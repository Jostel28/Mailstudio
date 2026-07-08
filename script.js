// ============================================
// MAILSTUDIO - SCRIPT PRINCIPAL
// VERSIÓN CORREGIDA
// ============================================

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
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    MAX_DAILY: 2000,
    MAX_PER_BATCH: 100,
    MAX_ATTACHMENTS: 10,
    MAX_SIZE_MB: 25,
    DELAY_BETWEEN_EMAILS: 3000,
};

// ============================================
// TLDs VÁLIDOS
// ============================================
const TLDS_VALIDOS = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'co', 'es', 'mx', 'ar', 'cl', 'pe', 've',
    'ec', 'uy', 'py', 'bo', 'cr', 'pa', 'gt', 'hn', 'ni', 'do', 'pr', 'cu', 'sv', 'bz',
    'tt', 'jm', 'bb', 'bs', 'gd', 'kn', 'lc', 'vc', 'ag', 'ai', 'aw', 'bm', 'ky', 'dm',
    'fk', 'gi', 'ms', 'pn', 'sh', 'tc', 'vg', 'vi', 'io', 'tv', 'me', 'ws', 'info', 'biz'
];

// ============================================
// VALIDACIÓN DE EMAIL
// ============================================
function validarEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valido: false, razon: 'Email vacío' };
    }
    
    email = email.trim().toLowerCase();
    
    if (email.includes(' ')) return { valido: false, razon: 'Contiene espacios' };
    if (!email.includes('@')) return { valido: false, razon: 'Falta @' };
    if (!email.includes('.')) return { valido: false, razon: 'Falta punto' };
    
    const partes = email.split('@');
    if (partes.length !== 2) return { valido: false, razon: 'Múltiples @' };
    
    const [local, dominio] = partes;
    
    const localNormalizado = local.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!/^[a-zA-Z0-9._-]+$/.test(localNormalizado)) {
        return { valido: false, razon: 'Caracteres no permitidos' };
    }
    if (local.includes('..')) return { valido: false, razon: 'Puntos seguidos' };
    if (local.startsWith('.') || local.endsWith('.')) {
        return { valido: false, razon: 'Empieza o termina con punto' };
    }
    if (local.length > 64) return { valido: false, razon: 'Parte local muy larga' };
    
    const domNormalizado = dominio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!/^[a-zA-Z0-9.-]+$/.test(domNormalizado)) {
        return { valido: false, razon: 'Dominio inválido' };
    }
    
    const partesDom = dominio.split('.');
    if (partesDom.length < 2) return { valido: false, razon: 'Sin extensión' };
    
    const tld = partesDom[partesDom.length - 1].toLowerCase();
    if (!TLDS_VALIDOS.includes(tld)) {
        return { valido: false, razon: `TLD .${tld} no válido` };
    }
    
    if (dominio.includes('..')) return { valido: false, razon: 'Puntos seguidos en dominio' };
    if (dominio.startsWith('-') || dominio.endsWith('-')) {
        return { valido: false, razon: 'Dominio con guion al inicio/final' };
    }
    
    return { valido: true, razon: 'Email válido' };
}

// ============================================
// FUNCIONES DE VISTA PREVIA
// ============================================
function updatePreview() {
    previewSubject.textContent = subjectInput.value || 'Sin asunto';
    previewBody.innerHTML = editor.innerHTML;
}

function getCurrentFontSize(element) {
    const size = window.getComputedStyle(element).fontSize;
    return parseInt(size) || 16;
}

// ============================================
// FUNCIONES DE FORMATO
// ============================================
function applyFormat(command) {
    document.execCommand(command, false, null);
    updatePreview();
    editor.focus();
}

function applyAlign(align) {
    document.execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1), false, null);
    updatePreview();
    editor.focus();
}

function applyFontSize(size) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.rangeCount === 0) {
        editor.style.fontSize = size;
        updatePreview();
        return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        editor.style.fontSize = size;
        updatePreview();
        return;
    }
    try {
        document.execCommand('fontSize', false, '7');
        const fontElements = editor.querySelectorAll('font[size="7"]');
        fontElements.forEach(el => {
            el.style.fontSize = size;
            el.removeAttribute('size');
        });
    } catch (e) {
        try {
            const span = document.createElement('span');
            span.style.fontSize = size;
            range.surroundContents(span);
        } catch (err) {
            console.warn('No se pudo aplicar el tamaño:', err);
        }
    }
    updatePreview();
    editor.focus();
}

function applyFontFamily(font) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.rangeCount === 0) {
        editor.style.fontFamily = font;
        updatePreview();
        return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        editor.style.fontFamily = font;
        updatePreview();
        return;
    }
    try {
        document.execCommand('fontName', false, font);
    } catch (e) {
        try {
            const span = document.createElement('span');
            span.style.fontFamily = font;
            range.surroundContents(span);
        } catch (err) {
            console.warn('No se pudo aplicar la fuente:', err);
        }
    }
    updatePreview();
    editor.focus();
}

function increaseFontSize() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.rangeCount === 0) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.min(currentSize + 2, 72);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.min(currentSize + 2, 72);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    try {
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentNode;
        let currentSize = container ? (parseInt(window.getComputedStyle(container).fontSize) || 16) : 16;
        let newSize = Math.min(currentSize + 2, 72);
        document.execCommand('fontSize', false, '7');
        const fontElements = editor.querySelectorAll('font[size="7"]');
        fontElements.forEach(el => {
            el.style.fontSize = newSize + 'px';
            el.removeAttribute('size');
        });
    } catch (e) {
        try {
            let currentSize = 16;
            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentNode;
            if (container) {
                currentSize = parseInt(window.getComputedStyle(container).fontSize) || 16;
            }
            let newSize = Math.min(currentSize + 2, 72);
            const span = document.createElement('span');
            span.style.fontSize = newSize + 'px';
            range.surroundContents(span);
        } catch (err) {
            console.warn('No se pudo aumentar el tamaño:', err);
        }
    }
    updatePreview();
    editor.focus();
}

function decreaseFontSize() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.rangeCount === 0) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.max(currentSize - 2, 8);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        let currentSize = getCurrentFontSize(editor);
        let newSize = Math.max(currentSize - 2, 8);
        editor.style.fontSize = newSize + 'px';
        updatePreview();
        return;
    }
    try {
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentNode;
        let currentSize = container ? (parseInt(window.getComputedStyle(container).fontSize) || 16) : 16;
        let newSize = Math.max(currentSize - 2, 8);
        document.execCommand('fontSize', false, '7');
        const fontElements = editor.querySelectorAll('font[size="7"]');
        fontElements.forEach(el => {
            el.style.fontSize = newSize + 'px';
            el.removeAttribute('size');
        });
    } catch (e) {
        try {
            let currentSize = 16;
            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentNode;
            if (container) {
                currentSize = parseInt(window.getComputedStyle(container).fontSize) || 16;
            }
            let newSize = Math.max(currentSize - 2, 8);
            const span = document.createElement('span');
            span.style.fontSize = newSize + 'px';
            range.surroundContents(span);
        } catch (err) {
            console.warn('No se pudo disminuir el tamaño:', err);
        }
    }
    updatePreview();
    editor.focus();
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
            html += `<a href="${url}" target="_blank" style="color: ${socialColors[key]}; text-decoration: none; font-size: 24px; margin: 0 8px;">
                <i class="fab ${socialIcons[key]}"></i>
            </a>`;
        }
    }
    previewSocial.innerHTML = html || '<span style="color:#94a3b8; font-size:12px;">Sin redes sociales</span>';
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
// FUNCIONES DE CONVERSIÓN
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

function showMessage(text, type) {
    const msg = document.getElementById('sendMessage');
    msg.textContent = text;
    msg.className = type;
    msg.style.display = text ? 'block' : 'none';
}

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
        <ul><li>📚 Talleres de lectura</li><li>🎨 Clases creativas</li><li>🎭 Presentaciones artísticas</li></ul>
        <hr><p><strong>Contacto:</strong> info@fundacionpombo.org</p>
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
// REDES SOCIALES - EVENTOS
// ============================================
document.querySelectorAll('#socialWeb, #socialInstagram, #socialFacebook, #socialTiktok, #socialYoutube, #socialTwitter').forEach(input => {
    if (input) input.addEventListener('input', updateSocialLinks);
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
    if (e.target.files[0]) {
        const r = new FileReader();
        r.onload = (ev) => previewTopLogo.src = ev.target.result;
        r.readAsDataURL(e.target.files[0]);
    }
});

bottomLogoUpload.addEventListener('change', (e) => {
    if (e.target.files[0]) {
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
// EXCEL - CARGAR DESTINATARIOS
// ============================================
excelUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            
            let emailColumn = null;
            if (rows.length > 0) {
                const headers = Object.keys(rows[0]);
                for (const header of headers) {
                    const h = header.toLowerCase();
                    if (h.includes('email') || h.includes('correo') || h.includes('mail')) {
                        emailColumn = header;
                        break;
                    }
                }
                if (!emailColumn && headers.length > 0) {
                    emailColumn = headers[0];
                }
            }
            
            if (!emailColumn) {
                alert('❌ No se encontró columna de email.');
                return;
            }
            
            const emailsRaw = [];
            for (const row of rows) {
                const email = row[emailColumn];
                if (email) {
                    const emailStr = String(email).trim();
                    if (emailStr && emailStr.includes('@')) {
                        emailsRaw.push(emailStr);
                    }
                }
            }
            
            if (emailsRaw.length === 0) {
                alert('❌ No se encontraron correos.');
                return;
            }
            
            const vistos = new Set();
            const emailsUnicos = [];
            let duplicados = 0;
            for (const email of emailsRaw) {
                const clean = email.toLowerCase().trim();
                if (!vistos.has(clean)) {
                    vistos.add(clean);
                    emailsUnicos.push(email);
                } else {
                    duplicados++;
                }
            }
            
            const validos = [];
            const invalidos = [];
            for (const email of emailsUnicos) {
                const resultado = validarEmail(email);
                if (resultado.valido) {
                    validos.push(email);
                } else {
                    invalidos.push({ email: email, razon: resultado.razon });
                }
            }
            
            currentRecipients = validos;
            emailList.textContent = `${validos.length} correos válidos (${invalidos.length} inválidos)`;
            
            let mensaje = `📊 RESULTADO DE VALIDACIÓN\n\n`;
            mensaje += `📧 Total: ${emailsRaw.length}\n`;
            if (duplicados > 0) mensaje += `🔄 Duplicados: ${duplicados}\n`;
            mensaje += `✅ Válidos: ${validos.length}\n`;
            mensaje += `❌ Inválidos: ${invalidos.length}\n\n`;
            
            if (invalidos.length > 0) {
                mensaje += `📋 INVÁLIDOS:\n`;
                for (const inv of invalidos.slice(0, 5)) {
                    mensaje += `   ❌ ${inv.email}: ${inv.razon}\n`;
                }
                if (invalidos.length > 5) mensaje += `   ... y ${invalidos.length - 5} más\n`;
            }
            
            if (validos.length > 0) {
                mensaje += `\n✅ VÁLIDOS:\n`;
                for (const email of validos.slice(0, 3)) {
                    mensaje += `   ✓ ${email}\n`;
                }
                if (validos.length > 3) mensaje += `   ... y ${validos.length - 3} más\n`;
            }
            
            alert(mensaje);
            
        } catch (error) {
            alert('❌ Error al procesar el archivo:\n' + error.message);
            console.error('Error Excel:', error);
        }
    };
    reader.readAsArrayBuffer(file);
});

addEmailsBtn.addEventListener('click', () => {
    const raw = manualEmails.value;
    if (raw.trim()) {
        const emails = raw.split(/[ ,;\n\r]+/).filter(e => e && e.trim() && e.includes('@'));
        if (emails.length > 0) {
            const validos = [];
            const invalidos = [];
            for (const email of emails) {
                const resultado = validarEmail(email);
                if (resultado.valido) {
                    validos.push(email);
                } else {
                    invalidos.push({ email: email, razon: resultado.razon });
                }
            }
            currentRecipients = [...new Set([...currentRecipients, ...validos])];
            emailList.textContent = `${currentRecipients.length} correos válidos (${invalidos.length} inválidos)`;
            manualEmails.value = '';
            if (invalidos.length > 0) {
                let msg = `⚠️ ${invalidos.length} correos inválidos:\n`;
                for (const inv of invalidos.slice(0, 3)) {
                    msg += `   ❌ ${inv.email}: ${inv.razon}\n`;
                }
                if (invalidos.length > 3) msg += `   ... y ${invalidos.length - 3} más`;
                alert(msg);
            }
        }
    }
});

// ============================================
// GMAIL API - CONEXIÓN
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
    const { user } = event.detail;
    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    gmailStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> Conectado: ${user.email}`;
    const stats = gmailSender.getStats();
    quotaInfo.innerHTML = `
        <i class="fas fa-chart-line"></i> 
        Cuenta: ${user.email} | 
        Enviados hoy: <strong>${stats.sentToday}</strong> / ${stats.maxDaily} |
        Disponibles: ${stats.remaining}
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
    if (confirm('¿Desconectar tu cuenta de Gmail?')) {
        gmailSender.disconnect();
    }
});

// ============================================
// ENVÍO DE CORREOS
// ============================================
async function sendWithGmail() {
    if (!gmailSender.accessToken) {
        showMessage('❌ Conecta tu cuenta de Gmail primero', 'error');
        return;
    }

    if (currentRecipients.length === 0) {
        showMessage('❌ No hay destinatarios', 'error');
        return;
    }

    const stats = gmailSender.getStats();
    if (currentRecipients.length > stats.remaining) {
        showMessage(`❌ Solo quedan ${stats.remaining} correos para hoy`, 'error');
        return;
    }

    const total = currentRecipients.length;
    const batches = Math.ceil(total / 100);
    const timeEstimate = batches * 3;

    if (!confirm(`📊 Enviar ${total} correos\n📦 ${batches} lotes\n⏱️ ~${timeEstimate} segundos\n\n¿Continuar?`)) {
        return;
    }

    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    sendBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    showMessage('', '');

    try {
        const attachmentsBase64 = [];
        for (const file of attachments) {
            const base64 = await fileToBase64(file);
            attachmentsBase64.push({
                name: file.name,
                type: file.type || 'application/octet-stream',
                base64: base64
            });
        }

        const redesHtml = previewSocial.innerHTML;
        const finalHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                    ${previewTopLogo.src && !previewTopLogo.src.includes('placehold') ? 
                        `<img src="${previewTopLogo.src}" style="max-height: 80px;">` : ''}
                </div>
                <div style="padding: 0 10px;">
                    <h2>${subjectInput.value || 'Sin asunto'}</h2>
                    <div style="line-height: 1.8; margin-top: 16px;">
                        ${previewBody.innerHTML}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                    ${previewBottomLogo.src && !previewBottomLogo.src.includes('placehold') ? 
                        `<img src="${previewBottomLogo.src}" style="max-height: 50px; margin-bottom: 15px;"><br>` : ''}
                    <div style="margin: 15px 0; font-size: 20px;">${redesHtml}</div>
                    <p>© ${new Date().getFullYear()} - Enviado desde MailStudio</p>
                </div>
            </div>
        `;

        const BATCH_SIZE = 100;
        let sent = 0;
        let failed = 0;
        const totalBatches = Math.ceil(currentRecipients.length / BATCH_SIZE);

        for (let i = 0; i < currentRecipients.length; i += BATCH_SIZE) {
            const batch = currentRecipients.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            try {
                await gmailSender.sendEmail(
                    batch.join(','),
                    subjectInput.value || 'Sin asunto',
                    finalHtml,
                    attachmentsBase64
                );
                sent += batch.length;
                const progress = Math.min(((i + BATCH_SIZE) / currentRecipients.length) * 100, 100);
                progressFill.style.width = progress + '%';
                sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${sent}/${currentRecipients.length} (${batchNum}/${totalBatches})`;
            } catch (error) {
                failed += batch.length;
                console.error(`Error en lote ${batchNum}:`, error);
            }

            if (i + BATCH_SIZE < currentRecipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const statsFinal = gmailSender.getStats();
        showMessage(`✅ Enviados: ${sent} | ❌ Fallidos: ${failed} | 📊 Total hoy: ${statsFinal.sentToday}/${statsFinal.maxDaily}`, 'success');

    } catch (error) {
        console.error('Error:', error);
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
        }, 3000);
    }
}

sendBtn.onclick = sendWithGmail;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initGmailAPI();
    if (localStorage.getItem('gmail_connected') === 'true') {
        console.log('Intentando reconectar...');
        setTimeout(() => {
            if (gmailSender.tokenClient && !gmailSender.accessToken) {
                connectBtn.click();
            }
        }, 2000);
    }
});

updatePreview();
updateSocialLinks();
console.log('✅ MailStudio cargado correctamente');
