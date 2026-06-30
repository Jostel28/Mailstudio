// ============================================
// GMAIL API - CONEXIÓN COMPLETA CON ADJUNTOS Y LÍMITES
// ============================================

const CLIENT_ID = '860404033561-q8t68eoe18mprn42k8vdvmao71coklo4.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDv6X23JhpUtk82_xU_RnY3Ot9VByn2Th4';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';
const DISCOVERY_DOC = 'https://gmail.googleapis.com/$discovery/rest?version=v1';

class GmailSender {
    constructor() {
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.currentUser = null;
        this.accessToken = null;

        // ============================================
        // CONFIGURACIÓN DE LÍMITES
        // ============================================
        this.config = {
            // Límites de Gmail - SOLO LOS ESENCIALES
            MAX_DAILY: 500,
            MAX_PER_BATCH: 50,
            MAX_EMAIL_SIZE: 25 * 1024 * 1024,
            MAX_TOTAL_ATTACHMENTS: 10,
            MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024,
            MAX_SUBJECT_LENGTH: 255,
            // ✅ ELIMINADO: MAX_BODY_LENGTH - ya no se valida
            
            // Límites de tiempo
            DELAY_BETWEEN_BATCHES: 3000,
            DELAY_BETWEEN_EMAILS: 500,
            MAX_RETRIES: 3,
            RETRY_DELAY: 5000,
            
            // Tipos de archivo permitidos
            ALLOWED_MIME_TYPES: [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.oasis.opendocument.text',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.oasis.opendocument.spreadsheet',
                'text/csv',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'video/mp4', 'video/webm', 'video/quicktime',
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
                'application/octet-stream'
            ]
        };

        this.stats = {
            sentToday: 0,
            lastResetDate: new Date().toDateString(),
        };
    }

    // ============================================
    // FUNCIÓN: Codificar texto a Base64 (soporta caracteres especiales)
    // ============================================
    encodeToBase64(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            const utf8Bytes = new TextEncoder().encode(str);
            let binaryString = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
                binaryString += String.fromCharCode(utf8Bytes[i]);
            }
            return btoa(binaryString);
        }
    }

    // ============================================
    // FUNCIÓN: Validar archivos adjuntos
    // ============================================
    validateAttachments(attachments) {
        if (!attachments || attachments.length === 0) {
            return { valid: true, errors: [], totalSize: 0 };
        }

        const errors = [];

        if (attachments.length > this.config.MAX_TOTAL_ATTACHMENTS) {
            errors.push(`❌ Demasiados archivos. Máximo ${this.config.MAX_TOTAL_ATTACHMENTS} archivos.`);
        }

        let totalSize = 0;

        for (const file of attachments) {
            if (file.size > this.config.MAX_ATTACHMENT_SIZE) {
                errors.push(`❌ El archivo "${file.name}" excede el límite de 25 MB.`);
            }
            totalSize += file.size;
        }

        if (totalSize > this.config.MAX_EMAIL_SIZE) {
            errors.push(`❌ El tamaño total (${(totalSize / 1024 / 1024).toFixed(1)} MB) excede el límite de 25 MB.`);
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            totalSize: totalSize
        };
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async initialize() {
        return new Promise((resolve, reject) => {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.onload = () => {
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            apiKey: API_KEY,
                            discoveryDocs: [DISCOVERY_DOC],
                        });
                        this.gapiInited = true;
                        console.log('✅ GAPI inicializado');
                        this.checkLoginStatus();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            document.head.appendChild(gapiScript);

            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.onload = () => {
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse) => {
                        if (tokenResponse.access_token) {
                            this.accessToken = tokenResponse.access_token;
                            this.getUserInfo();
                        }
                    },
                });
                this.gisInited = true;
                console.log('✅ GIS inicializado');
            };
            document.head.appendChild(gisScript);
        });
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================
    async checkLoginStatus() {
        try {
            if (gapi.client.getToken()) {
                this.accessToken = gapi.client.getToken().access_token;
                await this.getUserInfo();
                return true;
            }
        } catch (error) {
            console.log('No hay sesión activa');
        }
        return false;
    }

    async getUserInfo() {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: `Bearer ${this.accessToken}` }
            });
            this.currentUser = await response.json();
            
            window.dispatchEvent(new CustomEvent('gmail-connected', { 
                detail: { user: this.currentUser, token: this.accessToken }
            }));
            
            return this.currentUser;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }

    // ============================================
    // VERIFICACIÓN DE LÍMITES DIARIOS
    // ============================================
    checkDailyLimit(recipientsCount) {
        const today = new Date().toDateString();
        if (today !== this.stats.lastResetDate) {
            this.stats.sentToday = 0;
            this.stats.lastResetDate = today;
        }

        if (this.stats.sentToday + recipientsCount > this.config.MAX_DAILY) {
            const remaining = this.config.MAX_DAILY - this.stats.sentToday;
            throw new Error(
                `⚠️ Límite diario de ${this.config.MAX_DAILY} correos excedido.\n` +
                `Te quedan ${remaining} correos para hoy.`
            );
        }

        return true;
    }

    // ============================================
    // ENVÍO CON REINTENTOS
    // ============================================
    async sendEmailWithRetry(to, subject, htmlContent, attachments = [], retryCount = 0) {
        try {
            return await this.sendEmail(to, subject, htmlContent, attachments);
        } catch (error) {
            if (error.status === 429 || error.message.includes('rate limit')) {
                if (retryCount < this.config.MAX_RETRIES) {
                    console.log(`⏳ Reintentando (${retryCount + 1}/${this.config.MAX_RETRIES})...`);
                    await this.sleep(this.config.RETRY_DELAY);
                    return this.sendEmailWithRetry(to, subject, htmlContent, attachments, retryCount + 1);
                }
            }
            throw error;
        }
    }

    // ============================================
    // 🔧 ENVÍO DE EMAIL CON ADJUNTOS - SIN VALIDACIÓN DE CONTENIDO
    // ============================================
    async sendEmail(to, subject, htmlContent, attachments = []) {
        if (!this.accessToken) {
            throw new Error('No hay sesión activa. Conecta tu Gmail primero.');
        }

        const recipientsCount = Array.isArray(to) ? to.length : 1;
        this.checkDailyLimit(recipientsCount);

        // ✅ SOLO VALIDACIÓN DE ASUNTO (255 caracteres)
        if (subject.length > this.config.MAX_SUBJECT_LENGTH) {
            throw new Error(`❌ El asunto excede los ${this.config.MAX_SUBJECT_LENGTH} caracteres.`);
        }

        // ✅ VALIDACIÓN DE ADJUNTOS (tamaño y cantidad)
        const validation = this.validateAttachments(attachments);
        if (!validation.valid) {
            throw new Error(validation.errors.join('\n'));
        }

        // ✅ CONSTRUIR EMAIL (SIN validación de contenido)
        const email = this.buildEmailMime(to, subject, htmlContent, attachments);
        
        let encodedEmail;
        try {
            encodedEmail = this.encodeToBase64(email)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (e) {
            console.warn('⚠️ Falló la codificación, usando método alternativo...');
            const utf8Bytes = new TextEncoder().encode(email);
            let binaryString = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
                binaryString += String.fromCharCode(utf8Bytes[i]);
            }
            encodedEmail = btoa(binaryString)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }

        try {
            const response = await gapi.client.gmail.users.messages.send({
                userId: 'me',
                resource: { raw: encodedEmail }
            });
            
            this.stats.sentToday += recipientsCount;
            console.log(`✅ Email enviado (${this.stats.sentToday}/${this.config.MAX_DAILY} hoy)`);
            console.log(`📎 ${attachments.length} archivo(s) adjunto(s)`);
            return response.result;
            
        } catch (error) {
            console.error('❌ Error enviando:', error);
            if (error.status === 429) {
                throw new Error('⏳ Demasiadas solicitudes. Espera unos segundos y vuelve a intentar.');
            }
            throw error;
        }
    }

    // ============================================
    // 🔧 ENVÍO POR LOTES - SIN VALIDACIÓN DE CONTENIDO
    // ============================================
    async sendBatch(recipients, subject, htmlContent, batchSize = 50, attachments = [], onProgress) {
        if (!this.accessToken) {
            throw new Error('No hay sesión activa');
        }

        this.checkDailyLimit(recipients.length);

        // ✅ SOLO VALIDACIÓN DE ADJUNTOS
        const validation = this.validateAttachments(attachments);
        if (!validation.valid) {
            throw new Error(validation.errors.join('\n'));
        }

        const BATCH_SIZE = Math.min(batchSize, this.config.MAX_PER_BATCH);
        const DELAY = this.config.DELAY_BETWEEN_BATCHES;
        const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);

        const results = {
            sent: 0,
            failed: 0,
            errors: [],
            batches: totalBatches,
            totalAttachments: attachments.length,
            totalSize: validation.totalSize || 0
        };

        console.log(`📊 Iniciando envío: ${recipients.length} correos en ${totalBatches} lotes`);
        console.log(`📎 ${attachments.length} archivo(s) adjunto(s) (${(results.totalSize / 1024 / 1024).toFixed(1)} MB)`);

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                await this.sendEmailWithRetry(
                    batch.join(','),
                    subject,
                    htmlContent,
                    attachments,
                    0
                );
                
                results.sent += batch.length;
                
                if (onProgress) {
                    onProgress({
                        sent: results.sent,
                        total: recipients.length,
                        currentBatch: batchNumber,
                        totalBatches: totalBatches,
                        remaining: recipients.length - results.sent
                    });
                }
                
                console.log(`✅ Lote ${batchNumber}/${totalBatches}: ${batch.length} enviados (${results.sent}/${recipients.length})`);
                
                if (i + BATCH_SIZE < recipients.length) {
                    console.log(`⏳ Esperando ${DELAY/1000}s antes del siguiente lote...`);
                    await this.sleep(DELAY);
                }
                
            } catch (error) {
                results.failed += batch.length;
                results.errors.push({
                    batch: batchNumber,
                    recipients: batch,
                    error: error.message
                });
                console.log(`❌ Lote ${batchNumber}: Error - ${error.message}`);
                
                if (error.message.includes('rate limit') || error.message.includes('429')) {
                    console.log('⏳ Límite de velocidad alcanzado. Esperando 10 segundos...');
                    await this.sleep(10000);
                }
            }
        }

        console.log(`📊 Envío completado: ${results.sent} enviados, ${results.failed} fallaron`);
        return results;
    }

    // ============================================
    // CONSTRUCCIÓN DE EMAIL MIME CON ADJUNTOS
    // ============================================
    buildEmailMime(to, subject, htmlContent, attachments = []) {
        const boundary = '----=_Part_' + Date.now();
        const toAddress = Array.isArray(to) ? to.join(',') : to;
        
        let encodedSubject = this.encodeToBase64(subject);
        
        let email = [
            'MIME-Version: 1.0',
            'To: ' + toAddress,
            'Subject: =?UTF-8?B?' + encodedSubject + '?=',
            'Content-Type: multipart/mixed; boundary="' + boundary + '"',
            '',
            '--' + boundary,
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            htmlContent,
            ''
        ];

        for (const attachment of attachments) {
            email.push('--' + boundary);
            email.push('Content-Type: ' + (attachment.type || 'application/octet-stream'));
            email.push('Content-Transfer-Encoding: base64');
            email.push('Content-Disposition: attachment; filename="' + attachment.name + '"');
            email.push('');
            email.push(attachment.base64);
            email.push('');
        }

        email.push('--' + boundary + '--');
        
        return email.join('\r\n');
    }

    // ============================================
    // UTILIDADES
    // ============================================
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        const today = new Date().toDateString();
        if (today !== this.stats.lastResetDate) {
            this.stats.sentToday = 0;
            this.stats.lastResetDate = today;
        }
        return {
            sentToday: this.stats.sentToday,
            maxDaily: this.config.MAX_DAILY,
            remaining: this.config.MAX_DAILY - this.stats.sentToday,
            resetDate: this.stats.lastResetDate
        };
    }

    // ============================================
    // DESCONEXIÓN
    // ============================================
    disconnect() {
        this.accessToken = null;
        this.currentUser = null;
        if (gapi.client.getToken()) {
            google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
        }
        window.dispatchEvent(new CustomEvent('gmail-disconnected'));
    }
}

const gmailSender = new GmailSender();
