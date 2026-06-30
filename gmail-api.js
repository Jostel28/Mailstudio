// ============================================
// FUNCIÓN AUXILIAR: UTF-8 a Base64
// ============================================
function utf8ToBase64(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
        binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binaryString);
}

// ============================================
// ENVÍO DE EMAIL (CORREGIDO)
// ============================================
async sendEmail(to, subject, htmlContent, attachments = []) {
    if (!this.accessToken) {
        throw new Error('No hay sesión activa. Conecta tu Gmail primero.');
    }

    const recipientsCount = Array.isArray(to) ? to.length : 1;
    this.checkDailyLimit(recipientsCount);

    const email = this.buildEmailMime(to, subject, htmlContent, attachments);
    
    // Usar utf8ToBase64 en lugar de btoa directamente
    const encodedEmail = utf8ToBase64(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const response = await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: { raw: encodedEmail }
        });
        
        this.stats.sentToday += recipientsCount;
        console.log(`✅ Email enviado (${this.stats.sentToday}/${this.config.MAX_DAILY} hoy)`);
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
// CONSTRUCCIÓN DE EMAIL MIME (CORREGIDO)
// ============================================
buildEmailMime(to, subject, htmlContent, attachments = []) {
    const boundary = '----=_Part_' + Date.now();
    const toAddress = Array.isArray(to) ? to.join(',') : to;
    
    let email = [
        'MIME-Version: 1.0',
        'To: ' + toAddress,
        'Subject: =?UTF-8?B?' + btoa(unescape(encodeURIComponent(subject))) + '?=',
        'Content-Type: multipart/mixed; boundary="' + boundary + '"',
        '',
        '--' + boundary,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlContent,
        ''
    ];

    attachments.forEach(attachment => {
        email.push('--' + boundary);
        email.push('Content-Type: ' + attachment.type);
        email.push('Content-Transfer-Encoding: base64');
        email.push('Content-Disposition: attachment; filename="' + attachment.name + '"');
        email.push('');
        email.push(attachment.base64);
        email.push('');
    });

    email.push('--' + boundary + '--');
    
    return email.join('\r\n');
}
