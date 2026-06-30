// ============================================
// ELEMENTOS DEL DOM
// ============================================

const editor = document.getElementById('contentEditor');
const subjectInput = document.getElementById('subjectInput');
const previewSubject = document.getElementById('previewSubject');
const previewBody = document.getElementById('previewBody');
const fontSelect = document.getElementById('fontSelect');
const sizeSelect = document.getElementById('sizeSelect');
const increaseSizeBtn = document.getElementById('increaseSizeBtn');
const decreaseSizeBtn = document.getElementById('decreaseSizeBtn');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const underlineBtn = document.getElementById('underlineBtn');
const alignLeftBtn = document.getElementById('alignLeftBtn');
const alignCenterBtn = document.getElementById('alignCenterBtn');
const alignRightBtn = document.getElementById('alignRightBtn');

let currentRecipients = [];
let attachments = [];

const headerColor = document.getElementById('headerColor');
const applyHeaderColor = document.getElementById('applyHeaderColor');
const mainHeader = document.querySelector('.mailstudio-header');
const excelUpload = document.getElementById('excelUpload');
const manualEmails = document.getElementById('manualEmails');
const addEmailsBtn = document.getElementById('addEmailsBtn');
const emailList = document.getElementById('emailList');
const sendBtn = document.getElementById('sendBtn');
const sendMessage = document.getElementById('sendMessage');
const fileAttachment = document.getElementById('fileAttachment');
const attachmentList = document.getElementById('attachmentList');
const previewAttachmentList = document.getElementById('previewAttachmentList');
const topLogoUpload = document.getElementById('topLogoUpload');
const bottomLogoUpload = document.getElementById('bottomLogoUpload');
const previewTopLogo = document.getElementById('previewTopLogo');
const previewBottomLogo = document.getElementById('previewBottomLogo');
const previewSocial = document.getElementById('previewSocial');
const connectBtn = document.getElementById('connectGmailBtn');
const disconnectBtn = document.getElementById('disconnectGmailBtn');
const gmailStatus = document.getElementById('gmailStatus');
const quotaInfo = document.getElementById('quotaInfo');

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE VISTA PREVIA
// ============================================

function updatePreview() {
    previewSubject.textContent = subjectInput.value || "Sin asunto";
    previewBody.innerHTML = editor.innerHTML;
}

function getCurrentFontSize(element) {
    const size = window.getComputedStyle(element).fontSize;
    return parseInt(size);
}

function increaseFontSize() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.min(currentSize + 2, 72);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentNode;
    
    let currentSize = getCurrentFontSize(container);
    let newSize = Math.min(currentSize + 2, 72);
    
    const span = document.createElement('span');
    span.style.fontSize = newSize + 'px';
    range.surroundContents(span);
    updatePreview();
}

function decreaseFontSize() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.max(currentSize - 2, 8);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentNode;
    
    let currentSize = getCurrentFontSize(container);
    let newSize = Math.max(currentSize - 2, 8);
    
    const span = document.createElement('span');
    span.style.fontSize = newSize + 'px';
    range.surroundContents(span);
    updatePreview();
}

function applyFormat(command) {
    document.execCommand(command, false, null);
    updatePreview();
}

function applyAlign(align) {
    document.execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1), false, null);
    updatePreview();
}

function applyFontSize(size) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        editor.style.fontSize = size;
        updatePreview();
        return;
    }
    
    const span = document.createElement('span');
    span.style.fontSize = size;
    range.surroundContents(span);
    updatePreview();
}

function applyFontFamily(font) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        editor.style.fontFamily = font;
        updatePreview();
        return;
    }
    
    const span = document.createElement('span');
    span.style.fontFamily = font;
    range.surroundContents(span);
    updatePreview();
}

// ============================================
// REDES SOCIALES
// ============================================

function updateSocialLinks() {
    const socialUrls = {
        web: document.getElementById('socialWeb')?.value || '',
        instagram: document.getElementById('socialInstagram').value,
        facebook: document.getElementById('socialFacebook').value,
        tiktok: document.getElementById('socialTiktok').value,
        youtube: document.getElementById('socialYoutube').value,
        twitter: document.getElementById('socialTwitter').value
    };
    const socialColors = {
        web: '#4285F4',
        instagram: '#E4405F',
        facebook: '#1877F2',
        tiktok: '#000000',
        youtube: '#FF0000',
        twitter: '#1DA1F2'
    };
    const socialIcons = {
        web: 'fa-globe',
        instagram: 'fa-instagram',
        facebook: 'fa-facebook',
        tiktok: 'fa-tiktok',
        youtube: 'fa-youtube',
        twitter: 'fa-twitter'
    };
    let html = '';
    for (const [key, url] of Object.entries(socialUrls)) {
        if (url && url.trim() !== '') {
            html += `<a href="${url}" target="_blank" style="color: ${socialColors[key]};"><i class="fab ${socialIcons[key]}"></i></a>`;
        }
    }
    previewSocial.innerHTML = html || '<span style="color:#ccc;">Sin enlaces sociales</span>';
}

// ============================================
// ADJUNTOS
// ============================================

function updateAttachmentsPreview() {
    const container = document.getElementById('attachmentList');
    if (attachments.length === 0) {
        container.innerHTML = '';
        previewAttachmentList.innerHTML = '';
        return;
    }
    
    let html = '<div style="display:flex; flex-wrap:wrap; gap:5px;">';
    attachments.forEach((file, index) => {
        let icon = file.type.startsWith('image/') ? '🖼️' : (file.type.startsWith('video/') ? '🎥' : '📄');
        let size = (file.size / 1024).toFixed(1);
        html += `<span style="background:#f1f5f9; padding:4px 10px; border-radius:12px; font-size:12px; display:inline-flex; align-items:center; gap:5px;">
            ${icon} ${file.name} (${size} KB)
            <span onclick="removeAttachment(${index})" style="cursor:pointer; color:#ef4444; font-weight:bold;">×</span>
        </span>`;
    });
    html += '</div>';
    container.innerHTML = html;
    
    // Actualizar vista previa
    let previewHtml = '';
    if (attachments.length > 0) {
        previewHtml = '<div style="background:#f1f5f9; padding:8px; border-radius:8px; margin-top:10px;"><strong>📎 Adjuntos:</strong><br>';
        attachments.forEach(file => {
            let icon = file.type.startsWith('image/') ? '🖼️' : (file.type.startsWith('video/') ? '🎥' : '📄');
            previewHtml += `<span style="display:inline-block; margin:4px;">${icon} ${file.name}</span><br>`;
        });
        previewHtml += '</div>';
    }
    previewAttachmentList.innerHTML = previewHtml;
}

function removeAttachment(index) {
    attachments.splice(index, 1);
    updateAttachmentsPreview();
    document.getElementById('fileAttachment').value = '';
}

// ============================================
// PLANTILLAS
// ============================================

const plantillas = {
    pombo: `<div style="background:linear-gradient(135deg, #facc15, #f59e0b); padding:30px; border-radius:24px; text-align:center; color:white;">
                <h1 style="font-size:32px; margin:0;">🎪 POMBOALONA 2025</h1>
                <p style="font-size:18px;">✨ Un lugar para la imaginación ✨</p>
            </div>
            <div style="padding:20px; text-align:center;">
                <p><strong>📅 14 al 20 de junio</strong></p>
                <p>📍 Plaza de las Flores</p>
                <p>🎭 Espectáculos, talleres y mucha diversión para toda la familia.</p>
                <p style="background:#facc15; display:inline-block; padding:10px 20px; border-radius:40px;"><strong>🎟️ ¡Te esperamos!</strong></p>
            </div>`,
    
    corporativa: `<div style="background:#0f172a; padding:25px; border-radius:16px; color:white;">
                    <h2 style="margin:0;">Comunicado Oficial</h2>
                    <p style="opacity:0.8;">Fundación Rafael Pombo</p>
                  </div>
                  <div style="padding:20px; color:#1e293b;">
                    <p>Estimados colaboradores,</p>
                    <p>Nos complace informarles sobre nuestras próximas actividades culturales.</p>
                    <ul>
                        <li>📚 Talleres de lectura</li>
                        <li>🎨 Clases creativas</li>
                        <li>🎭 Presentaciones artísticas</li>
                    </ul>
                    <hr>
                    <p><strong>Contacto:</strong> info@fundacionpombo.org</p>
                  </div>`,
    
    promocional: `<div style="background:#1a1a2e; color:white; padding:20px; text-align:center;">
                    <h2>🔥 OFERTA ESPECIAL 🔥</h2>
                    <p style="font-size:24px;">50% OFF</p>
                  </div>
                  <div style="padding:20px; text-align:center;">
                    <p>Vacaciones creativas para niños</p>
                    <p style="font-size:32px; color:#f59e0b;"><strong>14 - 20 JUNIO</strong></p>
                    <button style="background:#22c55e; color:white; border:none; padding:12px 24px; border-radius:40px;">📞 Reserva ahora</button>
                  </div>`,
    
    moderna: `<div style="display:flex; gap:20px; align-items:center; background:#f8fafc; padding:20px; border-radius:24px;">
                <i class="fas fa-envelope-open-text" style="font-size:48px; color:#facc15;"></i>
                <div><h2 style="margin:0;">Novedades</h2><p>Mantente informado</p></div>
              </div>
              <div style="padding:20px;">
                <p>🌟 Próximos eventos en la Fundación Rafael Pombo</p>
                <p>📅 Junio 2025 - Programa completo disponible</p>
                <p style="background:#e2e8f0; padding:12px; border-radius:12px;">🎯 "Un lugar para la imaginación"</p>
              </div>`,
    
    festival: `<div style="background:radial-gradient(circle, #facc15, #f59e0b); padding:30px; text-align:center;">
                <i class="fas fa-music" style="font-size:50px; color:white;"></i>
                <h1 style="color:white;">FESTIVAL POMBO</h1>
              </div>
              <div style="padding:20px; text-align:center;">
                <p><strong>🎵 14 - 20 de junio</strong></p>
                <p>🎪 Plaza de las Flores</p>
                <p>🎭 Presentaciones en vivo</p>
                <p>🍔 Zona de comidas</p>
                <p style="margin-top:16px;"><strong>¡Entrada libre!</strong></p>
              </div>`
};

// ============================================
// NAVEGACIÓN ENTRE PESTAÑAS
// ============================================

const navItems = document.querySelectorAll('.nav-item');
const destinatariosSection = document.getElementById('destinatariosSection');
const plantillasSection = document.getElementById('plantillasSection');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        destinatariosSection.style.display = 'none';
        plantillasSection.style.display = 'none';
        if (tab === 'destinatarios') destinatariosSection.style.display = 'block';
        else if (tab === 'plantillas') plantillasSection.style.display = 'block';
    });
});

// ============================================
// EVENT LISTENERS BASE
// ============================================

boldBtn.addEventListener('click', () => applyFormat('bold'));
italicBtn.addEventListener('click', () => applyFormat('italic'));
underlineBtn.addEventListener('click', () => applyFormat('underline'));
alignLeftBtn.addEventListener('click', () => applyAlign('left'));
alignCenterBtn.addEventListener('click', () => applyAlign('center'));
alignRightBtn.addEventListener('click', () => applyAlign('right'));
increaseSizeBtn.addEventListener('click', increaseFontSize);
decreaseSizeBtn.addEventListener('click', decreaseFontSize);
fontSelect.addEventListener('change', (e) => applyFontFamily(e.target.value));
sizeSelect.addEventListener('change', (e) => applyFontSize(e.target.value));
editor.addEventListener('input', updatePreview);
editor.addEventListener('keyup', updatePreview);
subjectInput.addEventListener('input', updatePreview);

applyHeaderColor.addEventListener('click', () => { 
    mainHeader.style.backgroundColor = headerColor.value; 
});

topLogoUpload.addEventListener('change', (e) => { 
    if(e.target.files[0]) { 
        const r = new FileReader(); 
        r.onload = (ev) => previewTopLogo.src = ev.target.result; 
        r.readAsDataURL(e.target.files[0]); 
    } 
});

bottomLogoUpload.addEventListener('change', (e) => { 
    if(e.target.files[0]) { 
        const r = new FileReader(); 
        r.onload = (ev) => previewBottomLogo.src = ev.target.result; 
        r.readAsDataURL(e.target.files[0]); 
    } 
});

// ============================================
// ADJUNTOS - GUARDAR ARCHIVOS
// ============================================
fileAttachment.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILES = 10;
    const MAX_SIZE = 25 * 1024 * 1024;

    if (attachments.length + files.length > MAX_FILES) {
        alert(`❌ Demasiados archivos. Máximo ${MAX_FILES} archivos.`);
        e.target.value = '';
        return;
    }

    for (const file of files) {
        if (file.size > MAX_SIZE) {
            alert(`❌ El archivo "${file.name}" excede el límite de 25 MB.`);
            e.target.value = '';
            return;
        }
    }

    attachments = [...attachments, ...files];
    updateAttachmentsPreview();
    e.target.value = '';
});

// ============================================
// EXCEL Y DESTINATARIOS
// ============================================
excelUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        rows.forEach(row => { 
            if(row && row[0] && row[0].includes('@')) 
                currentRecipients.push(row[0].trim()); 
        });
        currentRecipients = [...new Set(currentRecipients)];
        emailList.textContent = `${currentRecipients.length} correos cargados`;
    };
    reader.readAsArrayBuffer(file);
});

addEmailsBtn.addEventListener('click', () => {
    const raw = manualEmails.value;
    if(raw.trim()) {
        const emails = raw.split(/[ ,;]+/).filter(e => e.includes('@'));
        currentRecipients.push(...emails);
        currentRecipients = [...new Set(currentRecipients)];
        emailList.textContent = `${currentRecipients.length} correos totales`;
        manualEmails.value = '';
    }
});

// ============================================
// PLANTILLAS
// ============================================
document.querySelectorAll('.plantilla-card').forEach(card => {
    card.addEventListener('click', () => {
        const template = card.getAttribute('data-template');
        if (plantillas[template]) {
            editor.innerHTML = plantillas[template];
            updatePreview();
        }
    });
});

// ============================================
// DISPOSITIVOS (VISTA PREVIA)
// ============================================
const deviceBtns = document.querySelectorAll('.device-btn');
const emailPreview = document.getElementById('emailPreview');
deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        deviceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        emailPreview.classList.remove('pc', 'tablet', 'mobile');
        emailPreview.classList.add(btn.getAttribute('data-device') === 'pc' ? 'pc' : 'mobile');
    });
});

// ============================================
// REDES SOCIALES
// ============================================
document.querySelectorAll('#socialWeb, #socialInstagram, #socialFacebook, #socialTiktok, #socialYoutube, #socialTwitter').forEach(input => {
    if (input) input.addEventListener('input', updateSocialLinks);
});

// ============================================
// FUNCIÓN: Convertir archivo a Base64
// ============================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// ============================================
// INTEGRACIÓN CON GMAIL API
// ============================================

async function initGmailAPI() {
    try {
        await gmailSender.initialize();
        console.log('✅ Gmail API lista');
    } catch (error) {
        console.error('Error inicializando Gmail API:', error);
        gmailStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error de configuración';
    }
}

window.addEventListener('gmail-connected', async (event) => {
    const { user, token } = event.detail;
    
    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    gmailStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> Conectado: ${user.email}`;
    
    const stats = gmailSender.getStats();
    quotaInfo.innerHTML = `
        <i class="fas fa-chart-line"></i> 
        Cuenta: ${user.email} | 
        Enviados hoy: <strong>${stats.sentToday}</strong> / ${stats.maxDaily}
        <span style="margin-left: 10px; color: ${stats.remaining < 50 ? '#dc2626' : '#22c55e'};">
            ${stats.remaining > 0 ? `✅ ${stats.remaining} restantes` : '⚠️ Límite alcanzado'}
        </span>
        <br><small>⏳ Los límites se reinician cada día</small>
    `;
    
    localStorage.setItem('gmail_connected', 'true');
    localStorage.setItem('gmail_user', user.email);
});

window.addEventListener('gmail-disconnected', () => {
    connectBtn.style.display = 'inline-block';
    disconnectBtn.style.display = 'none';
    gmailStatus.innerHTML = '<i class="fas fa-circle-exclamation"></i> No conectado';
    quotaInfo.innerHTML = '';
    localStorage.removeItem('gmail_connected');
    localStorage.removeItem('gmail_user');
});

connectBtn.addEventListener('click', () => {
    if (gmailSender.tokenClient) {
        gmailSender.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        alert('Inicializando Gmail API, espera un momento...');
        setTimeout(() => connectBtn.click(), 1000);
    }
});

disconnectBtn.addEventListener('click', () => {
    if (confirm('¿Desconectar tu cuenta de Gmail? Ya no podrás enviar correos.')) {
        gmailSender.disconnect();
    }
});

// ============================================
// ENVÍO CON GMAIL - CON ADJUNTOS REALES
// ============================================
async function sendWithGmail() {
    if (!gmailSender.accessToken) {
        sendMessage.innerHTML = '❌ Primero conecta tu cuenta de Gmail';
        sendMessage.style.color = 'red';
        sendMessage.style.display = 'block';
        return;
    }
    
    if (currentRecipients.length === 0) {
        sendMessage.innerHTML = '❌ No hay destinatarios. Agrega correos en la pestaña "Destinatarios"';
        sendMessage.style.color = 'red';
        sendMessage.style.display = 'block';
        return;
    }

    // 📌 Validar límite de 500 correos por día
    const stats = gmailSender.getStats();
    if (currentRecipients.length > stats.remaining) {
        if (!confirm(`⚠️ Solo te quedan ${stats.remaining} correos para hoy.\n` +
            `Estás intentando enviar ${currentRecipients.length}.\n` +
            `¿Quieres enviar solo ${stats.remaining}?`)) {
            return;
        }
        currentRecipients = currentRecipients.slice(0, stats.remaining);
    }
    
    // 📌 Validar archivos adjuntos (cantidad y tamaño)
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
    const MAX_FILES = 10;
    let totalSize = 0;

    if (attachments.length > MAX_FILES) {
        alert(`❌ Demasiados archivos. Máximo ${MAX_FILES} archivos.`);
        return;
    }

    for (const file of attachments) {
        totalSize += file.size;
        if (file.size > MAX_TOTAL_SIZE) {
            alert(`❌ El archivo "${file.name}" excede el límite de 25 MB.`);
            return;
        }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
        alert(`❌ El tamaño total de los archivos (${(totalSize / 1024 / 1024).toFixed(1)} MB) excede el límite de 25 MB.`);
        return;
    }

    // 📌 Confirmar envío
    const total = currentRecipients.length;
    const batches = Math.ceil(total / 50);
    const timeEstimate = batches * 3;
    const fileInfo = attachments.length > 0 ? `\n📎 ${attachments.length} archivo(s) adjuntos (${(totalSize / 1024 / 1024).toFixed(1)} MB)` : '';
    
    if (!confirm(`📊 Vas a enviar ${total} correos.\n\n` +
        `📦 ${batches} lotes de 50 correos\n` +
        `⏱️ Tiempo estimado: ~${timeEstimate} segundos${fileInfo}\n` +
        `📧 Límite diario: ${stats.maxDaily}\n\n` +
        `¿Deseas continuar?`)) {
        return;
    }

    // 📌 Preparar UI
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando archivos...';
    sendBtn.disabled = true;
    sendMessage.style.display = 'none';

    try {
        // 📌 PROCESAR ARCHIVOS ADJUNTOS (convertir a Base64)
        const attachmentsBase64 = [];
        let processed = 0;
        const totalFiles = attachments.length;

        for (const file of attachments) {
            sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando ${processed + 1}/${totalFiles}: ${file.name}`;
            
            const base64 = await fileToBase64(file);
            attachmentsBase64.push({
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                base64: base64
            });
            processed++;
        }

        // 📌 Construir HTML final del correo
        const finalHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                    ${previewTopLogo.src && !previewTopLogo.src.includes('placehold') ? 
                        `<img src="${previewTopLogo.src}" style="max-height: 80px; width: auto;">` : ''}
                </div>
                <div style="padding: 0 10px;">
                    <h2 style="color: #1a1a2e;">${subjectInput.value || 'Sin asunto'}</h2>
                    <div style="line-height: 1.8; color: #1e293b; margin-top: 16px;">
                        ${previewBody.innerHTML}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                    ${previewBottomLogo.src && !previewBottomLogo.src.includes('placehold') ? 
                        `<img src="${previewBottomLogo.src}" style="max-height: 50px; width: auto; margin-bottom: 15px;"><br>` : ''}
                    <div style="margin: 10px 0;">${previewSocial.innerHTML}</div>
                    <p>© ${new Date().getFullYear()} - Enviado desde MailStudio</p>
                </div>
            </div>
        `;

        // 📌 Enviar con adjuntos
        sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enviando correos...`;
        
        const results = await gmailSender.sendBatch(
            currentRecipients,
            subjectInput.value || 'Sin asunto',
            finalHtml,
            50,
            attachmentsBase64,
            (progress) => {
                sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progress.sent}/${progress.total} (${progress.currentBatch}/${progress.totalBatches} lotes)`;
            }
        );
        
        if (results.sent > 0) {
            sendMessage.innerHTML = `✅ ¡Campaña enviada! ${results.sent} correos entregados. ${results.failed > 0 ? `⚠️ ${results.failed} fallaron.` : '🎉 Completado!'}`;
            sendMessage.style.color = results.failed > 0 ? 'orange' : 'green';
            sendMessage.style.display = 'block';
            
            const newStats = gmailSender.getStats();
            quotaInfo.innerHTML = `
                <i class="fas fa-chart-line"></i> 
                Cuenta: ${newStats.email || 'Cargando...'} | 
                Enviados hoy: <strong>${newStats.sentToday}</strong> / ${newStats.maxDaily}
                <span style="margin-left: 10px; color: ${newStats.remaining < 50 ? '#dc2626' : '#22c55e'};">
                    ${newStats.remaining > 0 ? `✅ ${newStats.remaining} restantes` : '⚠️ Límite alcanzado'}
                </span>
            `;
        } else {
            throw new Error('No se pudo enviar ningún correo');
        }
        
    } catch (error) {
        console.error('Error:', error);
        sendMessage.innerHTML = `❌ Error: ${error.message}`;
        sendMessage.style.color = 'red';
        sendMessage.style.display = 'block';
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
        
        setTimeout(() => {
            if (sendMessage.style.display !== 'none') {
                sendMessage.style.display = 'none';
            }
        }, 8000);
    }
}

// Reemplazar el evento del botón enviar
sendBtn.onclick = sendWithGmail;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initGmailAPI();
    
    if (localStorage.getItem('gmail_connected') === 'true') {
        console.log('Intentando reconectar sesión anterior...');
        setTimeout(() => {
            if (gmailSender.tokenClient && !gmailSender.accessToken) {
                connectBtn.click();
            }
        }, 2000);
    }
});

updatePreview();
updateSocialLinks();