// ===============================================
// SISTEMA DE CONSENTIMIENTO DE COOKIES
// ODS CERO - Banner responsivo y elegante
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🍪 Iniciando sistema de consentimiento de cookies...');
    
    // Variable global para controlar WhatsApp
    window.cookieBannerActive = false;
    
    // Verificar si ya se dio consentimiento
    const existingConsent = localStorage.getItem('cookieConsent');
    console.log('Consentimiento existente:', existingConsent);
    
    if (existingConsent === 'accepted' || existingConsent === 'rejected') {
        console.log('⏭️ Banner no mostrado - consentimiento ya otorgado:', existingConsent);
        
        // Si ya hay consentimiento, asegurar que WhatsApp esté disponible
        window.cookieBannerActive = false;
        
        // Habilitar Analytics si fue aceptado
        if (existingConsent === 'accepted' && typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        } else if (existingConsent === 'rejected' && typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
        
        // Intentar inicializar WhatsApp después de un pequeño delay
        setTimeout(() => {
            if (typeof window.forceInitWhatsApp === 'function') {
                window.forceInitWhatsApp();
            } else if (typeof $ !== 'undefined' && $('#my-whatsapp').length && typeof $('#my-whatsapp').floatingWhatsApp === 'function') {
                console.log('🟢 Inicializando WhatsApp (consentimiento existente)');
                $('#my-whatsapp').floatingWhatsApp({
                    phone: '56954689181',
                    popupMessage: '¡Hola! Te gustaría tener más información sobre el polo ODS 0 ? Contáctanos',
                    showPopup: true,
                    position: 'right'
                });
            }
        }, 1000);
        
        return; // No mostrar banner si ya se dio consentimiento
    }

    console.log('🎯 Mostrando banner de cookies...');

    // Crear el banner de cookies
    function createCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="cookie-text">
                    <p><strong>Uso de Cookies</strong></p>
                    <p class="cookie-description">Utilizamos cookies para analizar el tráfico del sitio y mejorar tu experiencia de navegación.</p>
                </div>
                <div class="cookie-actions">
                    <button id="cookie-accept" class="cookie-btn cookie-accept">Aceptar</button>
                    <button id="cookie-reject" class="cookie-btn cookie-reject">Rechazar</button>
                </div>
            </div>
        `;

        // Estilos CSS integrados
        const styles = `
            <style>
                #cookie-consent-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(42, 186, 235, 0.2);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    max-width: 480px;
                    width: calc(100vw - 40px);
                    animation: slideUp 0.3s ease-out;
                    font-family: inherit;
                }

                .cookie-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .cookie-icon {
                    color: #2ABAEB;
                    flex-shrink: 0;
                }

                .cookie-text {
                    flex: 1;
                    min-width: 0;
                }

                .cookie-text p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #374151;
                }

                .cookie-text strong {
                    color: #1f2937;
                    font-weight: 600;
                }

                .cookie-description {
                    margin-top: 4px !important;
                    opacity: 0.8;
                    font-size: 13px !important;
                }

                .cookie-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .cookie-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .cookie-accept {
                    background: #2ABAEB;
                    color: white;
                }

                .cookie-accept:hover {
                    background: #229FCC;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(35, 153, 196, 0.3));
                }

                .cookie-reject {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .cookie-reject:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                @keyframes slideDown {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                }

                .cookie-hiding {
                    animation: slideDown 0.3s ease-out forwards;
                }

                /* Responsivo para móviles */
                @media (max-width: 640px) {
                    #cookie-consent-banner {
                        bottom: 10px;
                        left: 10px;
                        right: 10px;
                        transform: none;
                        width: auto;
                        max-width: none;
                        padding: 14px 16px;
                        /* Ajuste para evitar conflicto con WhatsApp */
                        margin-bottom: 70px;
                    }

                    .cookie-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .cookie-text {
                        width: 100%;
                    }

                    .cookie-actions {
                        width: 100%;
                        justify-content: flex-end;
                    }

                    .cookie-btn {
                        flex: 1;
                        max-width: 100px;
                    }
                }

                /* Ajuste específico para dispositivos muy pequeños */
                @media (max-width: 480px) {
                    #cookie-consent-banner {
                        margin-bottom: 80px;
                    }

                    .cookie-text p {
                        font-size: 13px;
                    }

                    .cookie-description {
                        font-size: 12px !important;
                    }
                }

                /* Modo oscuro */
                @media (prefers-color-scheme: dark) {
                    #cookie-consent-banner {
                        background: rgba(31, 41, 55, 0.98);
                        border-color: rgba(42, 186, 235, 0.3);
                    }

                    .cookie-text p {
                        color: #d1d5db;
                    }

                    .cookie-text strong {
                        color: #f9fafb;
                    }

                    .cookie-reject {
                        background: #374151;
                        color: #9ca3af;
                    }

                    .cookie-reject:hover {
                        background: #4b5563;
                        color: #d1d5db;
                    }
                }
            </style>
        `;

        // Insertar estilos en el head
        document.head.insertAdjacentHTML('beforeend', styles);

        // Insertar banner en el body
        document.body.appendChild(banner);

        // Marcar que el banner está activo y desactivar WhatsApp
        window.cookieBannerActive = true;
        disableWhatsApp();

        // Event listeners para los botones
        document.getElementById('cookie-accept').addEventListener('click', acceptCookies);
        document.getElementById('cookie-reject').addEventListener('click', rejectCookies);
    }

    // Función para desactivar WhatsApp
    function disableWhatsApp() {
        console.log('📵 Desactivando WhatsApp mientras el banner de cookies está activo');
        const whatsappWidget = document.getElementById('my-whatsapp');
        if (whatsappWidget) {
            whatsappWidget.style.display = 'none';
            whatsappWidget.style.visibility = 'hidden';
        }
    }

    // Función para reactivar WhatsApp después de un delay
    function enableWhatsAppDelayed() {
        console.log('⏰ Reactivando WhatsApp en 5 segundos...');
        setTimeout(() => {
            // Primero hacer visible el elemento contenedor
            const whatsappWidget = document.getElementById('my-whatsapp');
            if (whatsappWidget) {
                whatsappWidget.style.display = '';
                whatsappWidget.style.visibility = 'visible';
                console.log('✅ Elemento WhatsApp visible');
            }
            
            // Usar la función global para forzar inicialización
            if (typeof window.forceInitWhatsApp === 'function') {
                window.forceInitWhatsApp();
            } else {
                // Fallback: intentar inicializar directamente
                if (typeof $ !== 'undefined' && $('#my-whatsapp').length && typeof $('#my-whatsapp').floatingWhatsApp === 'function') {
                    if (!$('#my-whatsapp').hasClass('floating-wpp')) {
                        console.log('🔄 Inicializando plugin WhatsApp (fallback)...');
                        $('#my-whatsapp').floatingWhatsApp({
                            phone: '56954689181',
                            popupMessage: '¡Hola! Te gustaría tener más información sobre el polo ODS 0 ? Contáctanos',
                            showPopup: true,
                            position: 'right'
                        });
                    }
                }
            }
        }, 5000); // 5 segundos
    }

    // Función para aceptar cookies
    function acceptCookies() {
        console.log('✅ Usuario aceptó cookies');
        localStorage.setItem('cookieConsent', 'accepted');
        window.cookieBannerActive = false;
        hideBanner();
        
        // Reactivar WhatsApp después de 5 segundos
        enableWhatsAppDelayed();
        
        // Aquí puedes inicializar Google Analytics si no estaba ya iniciado
        if (typeof gtag !== 'undefined') {
            console.log('📊 Habilitando Google Analytics');
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
            
            // Trackear el consentimiento
            gtag('event', 'cookie_consent', {
                event_category: 'consent',
                event_label: 'accepted'
            });
        }
        
        console.log('✅ Cookies aceptadas - Analytics habilitado');
    }

    // Función para rechazar cookies
    function rejectCookies() {
        console.log('❌ Usuario rechazó cookies');
        localStorage.setItem('cookieConsent', 'rejected');
        window.cookieBannerActive = false;
        hideBanner();
        
        // Reactivar WhatsApp después de 5 segundos
        enableWhatsAppDelayed();
        
        // Deshabilitar Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
            
            // Trackear el rechazo (esto se enviará antes de deshabilitar)
            gtag('event', 'cookie_consent', {
                event_category: 'consent',
                event_label: 'rejected'
            });
        }
        
        console.log('❌ Cookies rechazadas - Analytics deshabilitado');
    }

    // Función para ocultar el banner
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.add('cookie-hiding');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    // Función para verificar si hay conflicto con WhatsApp
    function adjustForWhatsApp() {
        const banner = document.getElementById('cookie-consent-banner');
        const whatsappWidget = document.getElementById('my-whatsapp');
        
        if (banner && whatsappWidget && window.innerWidth <= 768) {
            // Agregar clase para ajuste adicional si WhatsApp está visible
            if (whatsappWidget.style.display !== 'none') {
                banner.style.marginBottom = '90px';
            }
        }
    }

    // Inicializar el banner
    function initCookieBanner() {
        // Esperar un poco para que la página se cargue completamente
        setTimeout(() => {
            createCookieBanner();
            adjustForWhatsApp();
            
            // Observer para ajustar si aparece el widget de WhatsApp
            const observer = new MutationObserver(() => {
                adjustForWhatsApp();
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true, 
                attributes: true, 
                attributeFilter: ['style'] 
            });
        }, 1000);
    }

    // Verificar el consentimiento previo
    const consentStatus = localStorage.getItem('cookieConsent');
    
    if (!consentStatus) {
        // No hay consentimiento previo, mostrar banner
        initCookieBanner();
    } else if (consentStatus === 'accepted' && typeof gtag !== 'undefined') {
        // Ya se aceptaron las cookies, habilitar Analytics
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    } else if (consentStatus === 'rejected' && typeof gtag !== 'undefined') {
        // Se rechazaron las cookies, deshabilitar Analytics
        gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }
});

// Función global para resetear el consentimiento (para debugging)
window.resetCookieConsent = function() {
    localStorage.removeItem('cookieConsent');
    location.reload();
};

// Función global para debugging del estado
window.debugCookieState = function() {
    console.log('🔍 Estado de cookies:');
    console.log('- Consentimiento:', localStorage.getItem('cookieConsent'));
    console.log('- Banner activo:', window.cookieBannerActive);
    console.log('- Elemento WhatsApp:', document.getElementById('my-whatsapp') ? 'Encontrado' : 'No encontrado');
    console.log('- Plugin WhatsApp disponible:', typeof $ !== 'undefined' && typeof $('#my-whatsapp').floatingWhatsApp === 'function');
    console.log('- WhatsApp inicializado:', $('#my-whatsapp').hasClass('floating-wpp'));
};