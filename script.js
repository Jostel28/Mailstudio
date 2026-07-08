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
const reanudarBtn = document.getElementById('reanudarBtn');
const limpiarEstadoBtn = document.getElementById('limpiarEstadoBtn');
const estadoSection = document.getElementById('estadoSection');
const estadoInfo = document.getElementById('estadoInfo');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');

// ============================================
// CONFIGURACIÓN DE ENVÍO
// ============================================
const CONFIG_ENVIO = {
    TAMANO_LOTE: 100,
    PAUSA_ENTRE_LOTES: 7200,
    MAX_DESTINATARIOS_DIA: 2000,
    MAX_DESTINATARIOS_POR_MSG: 100,
    MAX_TAMANO_MB: 25,
    TIEMPO_ENTRE_EMAILS: 10000,
};

// ============================================
// TLDs VÁLIDOS (Dominios de nivel superior)
// ============================================
const TLDS_VALIDOS = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'co', 'es', 'mx', 'ar', 'cl', 'pe', 've', 
    'ec', 'uy', 'py', 'bo', 'cr', 'pa', 'gt', 'hn', 'ni', 'do', 'pr', 'cu', 'sv', 'bz', 
    'tt', 'jm', 'bb', 'bs', 'gd', 'kn', 'lc', 'vc', 'ag', 'ai', 'aw', 'bm', 'ky', 'dm', 
    'fk', 'gi', 'ms', 'pn', 'sh', 'tc', 'vg', 'vi', 'io', 'tv', 'me', 'ws', 'info', 'biz',
    'name', 'mobi', 'asia', 'cat', 'jobs', 'pro', 'tel', 'travel', 'xxx', 'eu', 'asia',
    'coop', 'aero', 'museum', 'int', 'mil', 'edu', 'gob', 'gob.mx', 'gob.es', 'gob.ar'
];

// ============================================
// ESTADO DE ENVÍO (PERSISTENTE)
// ============================================
let estadoEnvio = {
    enviadosHoy: 0,
    fechaReset: new Date().toDateString(),
    progreso: null,
    emailsEnviados: [],
    emailsFallidos: [],
    emailsInvalidos: []
};

// ============================================
// FUNCIÓN: LIMPIAR PROGRESO (CORREGIDA)
// ============================================
function limpiarProgreso() {
    estadoEnvio.progreso = null;
    guardarEstadoEnvio();
    actualizarUIEstado();
    console.log('🧹 Progreso limpiado');
}

function cargarEstadoEnvio() {
    try {
        const guardado = localStorage.getItem('mailstudio_estado_envio');
        if (guardado) {
            const data = JSON.parse(guardado);
            const hoy = new Date().toDateString();
            if (data.fechaReset === hoy) {
                estadoEnvio = data;
            } else {
                estadoEnvio.enviadosHoy = 0;
                estadoEnvio.fechaReset = hoy;
                estadoEnvio.progreso = null;
                guardarEstadoEnvio();
            }
        }
        actualizarUIEstado();
    } catch (e) {
        console.warn('Error cargando estado:', e);
    }
}

function guardarEstadoEnvio() {
    try {
        localStorage.setItem('mailstudio_estado_envio', JSON.stringify(estadoEnvio));
    } catch (e) {
        console.warn('Error guardando estado:', e);
    }
}

function actualizarUIEstado() {
    const hoy = new Date().toDateString();
    if (hoy !== estadoEnvio.fechaReset) {
        estadoEnvio.enviadosHoy = 0;
        estadoEnvio.fechaReset = hoy;
        guardarEstadoEnvio();
    }

    const pendiente = estadoEnvio.progreso && estadoEnvio.progreso.pendientes && estadoEnvio.progreso.pendientes.length > 0;
    
    if (pendiente || estadoEnvio.enviadosHoy > 0 || estadoEnvio.emailsEnviados.length > 0) {
        estadoSection.style.display = 'block';
        let html = `
            <p><strong>📊 Enviados hoy:</strong> ${estadoEnvio.enviadosHoy} / ${CONFIG_ENVIO.MAX_DESTINATARIOS_DIA}</p>
            <p><strong>⏳ Restantes hoy:</strong> ${CONFIG_ENVIO.MAX_DESTINATARIOS_DIA - estadoEnvio.enviadosHoy}</p>
        `;
        if (pendiente) {
            html += `
                <p style="color: #FF9800;"><strong>🔄 Envío pendiente:</strong> ${estadoEnvio.progreso.pendientes.length} correos restantes</p>
                <p><strong>📌 Progreso:</strong> ${estadoEnvio.progreso.indice || 0} de ${estadoEnvio.progreso.total || 0}</p>
            `;
        }
        if (estadoEnvio.emailsEnviados.length > 0) {
            html += `<p><strong>✅ Enviados:</strong> ${estadoEnvio.emailsEnviados.length}</p>`;
        }
        if (estadoEnvio.emailsFallidos.length > 0) {
            html += `<p><strong>❌ Fallidos:</strong> ${estadoEnvio.emailsFallidos.length}</p>`;
        }
        if (estadoEnvio.emailsInvalidos.length > 0) {
            html += `<p><strong>🚫 Inválidos:</strong> ${estadoEnvio.emailsInvalidos.length}</p>`;
        }
        estadoInfo.innerHTML = html;
        
        reanudarBtn.style.display = pendiente ? 'block' : 'none';
    } else {
        estadoSection.style.display = 'none';
    }
}

function guardarProgreso(indice, total, pendientes) {
    estadoEnvio.progreso = {
        indice: indice,
        total: total,
        pendientes: pendientes,
        fecha: new Date().toISOString()
    };
    guardarEstadoEnvio();
    actualizarUIEstado();
}

function limpiarEstadoCompleto() {
    if (confirm('¿Estás seguro de limpiar todo el estado de envío? Se perderá el progreso de envíos pendientes.')) {
        estadoEnvio = {
            enviadosHoy: 0,
            fechaReset: new Date().toDateString(),
            progreso: null,
            emailsEnviados: [],
            emailsFallidos: [],
            emailsInvalidos: []
        };
        guardarEstadoEnvio();
        actualizarUIEstado();
        showMessage('🗑️ Estado limpiado correctamente', 'info');
    }
}

// ============================================
// VALIDACIÓN DE EMAIL - VERSIÓN MEJORADA
// ============================================
function validarEmailExhaustivo(email) {
    if (!email || typeof email !== 'string') {
        return { valido: false, razon: 'Email vacío o inválido' };
    }
    
    email = email.trim().toLowerCase();
    
    // 1. Verificar espacios
    if (email.includes(' ')) {
        return { valido: false, razon: 'Contiene espacios' };
    }
    
    // 2. Verificar @ y .
    if (!email.includes('@') || !email.includes('.')) {
        return { valido: false, razon: 'Formato inválido (falta @ o .)' };
    }
    
    // 3. Verificar múltiples @
    if (email.split('@').length !== 2) {
        return { valido: false, razon: 'Múltiples @' };
    }
    
    const [localPart, dominio] = email.split('@');
    
    // 4. Verificar parte local (solo caracteres permitidos)
    const localNormalized = localPart.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!/^[a-zA-Z0-9._-]+$/.test(localNormalized)) {
        return { valido: false, razon: 'Caracteres no permitidos (tildes, eñes, etc.)' };
    }
    
    // 5. Verificar puntos seguidos
    if (localPart.includes('..')) {
        return { valido: false, razon: 'Puntos seguidos en parte local' };
    }
    
    // 6. Verificar punto al inicio o final
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return { valido: false, razon: 'Empieza o termina con punto' };
    }
    
    // 7. Verificar longitud de parte local
    if (localPart.length > 64) {
        return { valido: false, razon: `Parte local muy larga (${localPart.length} > 64)` };
    }
    
    // 8. Verificar dominio (solo letras, números, puntos y guiones)
    const dominioNormalized = dominio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!/^[a-zA-Z0-9.-]+$/.test(dominioNormalized)) {
        return { valido: false, razon: `Dominio inválido: ${dominio}` };
    }
    
    // 9. Verificar que el dominio tenga TLD
    const partesDominio = dominioNormalized.split('.');
    if (partesDominio.length < 2) {
        return { valido: false, razon: `Dominio sin extensión: ${dominio}` };
    }
    
    const tld = partesDominio[partesDominio.length - 1].toLowerCase();
    
    // 10. Verificar TLD válido (incluye .es, .com, .org, etc.)
    if (!TLDS_VALIDOS.includes(tld)) {
        return { valido: false, razon: `TLD no válido: .${tld}` };
    }
    
    // 11. Verificar puntos seguidos en dominio
    if (dominio.includes('..')) {
        return { valido: false, razon: 'Puntos seguidos en dominio' };
    }
    
    // 12. Verificar que el dominio no empiece o termine con guion
    if (dominio.startsWith('-') || dominio.endsWith('-')) {
        return { valido: false, razon: 'Dominio empieza o termina con guion' };
    }
    
    // 13. Verificar longitud del dominio
    if (dominio.length > 255) {
        return { valido: false, razon: `Dominio demasiado largo (${dominio.length} > 255)` };
    }
    
    // 14. Verificar que la parte local no sea solo números
    if (/^\d+$/.test(localPart)) {
        return { valido: false, razon: 'Parte local solo números' };
    }
    
    // 15. Verificar que el dominio tenga al menos una letra
    if (!/[a-zA-Z]/.test(dominioNormalized)) {
        return { valido: false, razon: 'Dominio sin letras' };
    }
    
    return { valido: true, razon: 'Email válido' };
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE VISTA PREVIA
// ============================================

function updatePreview() {
    previewSubject.textContent = subjectInput.value || "Sin asunto";
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
    previewSocial.innerHTML = html || '<span style="color:#94a3b8; font-size:12px;">Sin redes sociales configuradas</span>';
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
const estadoSectionNav = document.getElementById('estadoSection');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        destinatariosSection.style.display = 'none';
        plantillasSection.style.display = 'none';
        estadoSectionNav.style.display = 'none';
        if (tab === 'destinatarios') destinatariosSection.style.display = 'block';
        else if (tab === 'plantillas') plantillasSection.style.display = 'block';
        else if (tab === 'estado') {
            estadoSectionNav.style.display = 'block';
            actualizarUIEstado();
        }
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
// EXCEL Y DESTINATARIOS (MEJORADO)
// ============================================
excelUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            
            // 🔧 IDENTIFICAR COLUMNA DE EMAIL
            let emailColumn = null;
            if (rows.length > 0) {
                const headers = Object.keys(rows[0]);
                for (const header of headers) {
                    const headerLower = header.toLowerCase();
                    if (headerLower.includes('email') || headerLower.includes('correo') || headerLower.includes('mail')) {
                        emailColumn = header;
                        break;
                    }
                }
                // Si no se encuentra, usar la primera columna
                if (!emailColumn && headers.length > 0) {
                    emailColumn = headers[0];
                }
            }
            
            if (!emailColumn) {
                alert('❌ No se encontró una columna de email en el archivo.');
                return;
            }
            
            // Extraer emails de la columna identificada
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
                alert('❌ No se encontraron correos en el archivo.');
                return;
            }
            
            // Eliminar duplicados
            const vistos = new Set();
            const emailsUnicos = [];
            let duplicados = 0;
            for (const email of emailsRaw) {
                const emailClean = email.toLowerCase().trim();
                if (!vistos.has(emailClean)) {
                    vistos.add(emailClean);
                    emailsUnicos.push(email);
                } else {
                    duplicados++;
                }
            }
            
            // Validar emails
            const validos = [];
            const invalidos = [];
            for (const email of emailsUnicos) {
                const resultado = validarEmailExhaustivo(email);
                if (resultado.valido) {
                    validos.push(email);
                } else {
                    invalidos.push({ email: email, razon: resultado.razon });
                }
            }
            
            // Mostrar resultados
            let mensaje = `📊 RESULTADO DE VALIDACIÓN\n\n`;
            mensaje += `📧 Total original: ${emailsRaw.length}\n`;
            mensaje += `📋 Columna usada: ${emailColumn}\n`;
            if (duplicados > 0) mensaje += `🔄 Duplicados eliminados: ${duplicados}\n`;
            mensaje += `✅ Válidos: ${validos.length}\n`;
            mensaje += `❌ Inválidos: ${invalidos.length}\n\n`;
            
            if (invalidos.length > 0) {
                mensaje += `📋 INVÁLIDOS:\n`;
                for (const inv of invalidos.slice(0, 10)) {
                    mensaje += `   ❌ ${inv.email}: ${inv.razon}\n`;
                }
                if (invalidos.length > 10) mensaje += `   ... y ${invalidos.length - 10} más\n`;
            }
            
            if (validos.length > 0) {
                mensaje += `\n✅ VÁLIDOS:\n`;
                for (const email of validos.slice(0, 5)) {
                    mensaje += `   ✓ ${email}\n`;
                }
                if (validos.length > 5) mensaje += `   ... y ${validos.length - 5} más\n`;
            }
            
            // Guardar en variable global y actualizar UI
            currentRecipients = validos
