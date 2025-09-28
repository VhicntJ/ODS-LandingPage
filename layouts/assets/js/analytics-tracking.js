// ===============================================
// GOOGLE ANALYTICS 4 - SEGUIMIENTO AVANZADO
// ODS CERO - Tracking de eventos personalizados
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar si gtag está disponible
    if (typeof gtag === 'undefined') {
        console.warn('Google Analytics no está disponible');
        return;
    }

    // ===== 1. SEGUIMIENTO DE VISTAS DE PÁGINA =====
    function trackPageView() {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }

    // ===== 2. SEGUIMIENTO DE DESPLAZAMIENTO (SCROLL) =====
    let scrollTracked = {
        '25': false,
        '50': false,
        '75': false,
        '90': false
    };

    function trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        
        Object.keys(scrollTracked).forEach(threshold => {
            if (scrollPercent >= parseInt(threshold) && !scrollTracked[threshold]) {
                scrollTracked[threshold] = true;
                gtag('event', 'scroll', {
                    event_category: 'engagement',
                    event_label: `${threshold}%`,
                    value: parseInt(threshold)
                });
            }
        });
    }

    // ===== 3. SEGUIMIENTO DE CLICS DE SALIDA =====
    function trackOutboundLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
                const url = new URL(link.href, window.location.origin);
                
                // Verificar si es un link externo
                if (url.hostname !== window.location.hostname) {
                    gtag('event', 'click', {
                        event_category: 'outbound',
                        event_label: url.hostname,
                        transport_type: 'beacon'
                    });
                }
                
                // Tracking de enlaces específicos
                if (link.href.includes('whatsapp.com') || link.href.includes('wa.me')) {
                    gtag('event', 'whatsapp_click', {
                        event_category: 'contact',
                        event_label: 'WhatsApp'
                    });
                }
                
                if (link.href.includes('linkedin.com')) {
                    gtag('event', 'social_click', {
                        event_category: 'social',
                        event_label: 'LinkedIn'
                    });
                }
            }
        });
    }

    // ===== 4. SEGUIMIENTO DE BÚSQUEDAS EN EL SITIO =====
    function trackSiteSearch() {
        // Buscar campos de búsqueda
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]');
        
        searchInputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    gtag('event', 'search', {
                        search_term: this.value.trim(),
                        event_category: 'site_search'
                    });
                }
            });
        });
    }

    // ===== 5. SEGUIMIENTO DE INTERACCIONES CON VIDEOS =====
    function trackVideoInteractions() {
        // Seguimiento de videos HTML5
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            let played = false, paused = false, ended = false;
            
            video.addEventListener('play', function() {
                if (!played) {
                    gtag('event', 'video_start', {
                        event_category: 'video',
                        event_label: this.src || this.currentSrc || 'unknown'
                    });
                    played = true;
                }
            });
            
            video.addEventListener('pause', function() {
                if (!paused && this.currentTime > 0) {
                    gtag('event', 'video_pause', {
                        event_category: 'video',
                        event_label: this.src || this.currentSrc || 'unknown',
                        value: Math.round(this.currentTime)
                    });
                    paused = true;
                }
            });
            
            video.addEventListener('ended', function() {
                if (!ended) {
                    gtag('event', 'video_complete', {
                        event_category: 'video',
                        event_label: this.src || this.currentSrc || 'unknown',
                        value: Math.round(this.duration)
                    });
                    ended = true;
                }
            });
        });

        // Seguimiento de YouTube embeds (si los hay)
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
        youtubeIframes.forEach(iframe => {
            // Para YouTube se requiere la API de YouTube, simplemente trackear clicks
            iframe.addEventListener('click', function() {
                gtag('event', 'video_click', {
                    event_category: 'video',
                    event_label: 'YouTube Embed'
                });
            });
        });
    }

    // ===== 6. SEGUIMIENTO DE INTERACCIONES CON FORMULARIO =====
    function trackFormInteractions() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            let formStarted = false;
            
            // Seguimiento de inicio de formulario
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    if (!formStarted) {
                        gtag('event', 'form_start', {
                            event_category: 'form',
                            event_label: form.id || form.className || 'contact_form'
                        });
                        formStarted = true;
                    }
                });
            });
            
            // Seguimiento de envío de formulario
            form.addEventListener('submit', function(e) {
                gtag('event', 'form_submit', {
                    event_category: 'form',
                    event_label: this.id || this.className || 'contact_form'
                });
            });
            
            // Seguimiento de campos específicos
            const emailInputs = form.querySelectorAll('input[type="email"]');
            emailInputs.forEach(input => {
                input.addEventListener('blur', function() {
                    if (this.value && this.checkValidity()) {
                        gtag('event', 'email_entered', {
                            event_category: 'form',
                            event_label: 'valid_email'
                        });
                    }
                });
            });
            
            const phoneInputs = form.querySelectorAll('input[type="tel"]');
            phoneInputs.forEach(input => {
                input.addEventListener('blur', function() {
                    if (this.value) {
                        gtag('event', 'phone_entered', {
                            event_category: 'form',
                            event_label: 'phone_number'
                        });
                    }
                });
            });
        });
    }

    // ===== 7. SEGUIMIENTO DE NAVEGACIÓN INTERNA =====
    function trackInternalNavigation() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                const linkText = link.textContent.trim() || link.getAttribute('aria-label') || 'unknown';
                
                // Navegación del menú
                if (link.closest('.navbar, .navigation')) {
                    gtag('event', 'menu_click', {
                        event_category: 'navigation',
                        event_label: linkText
                    });
                }
                
                // Botones CTA
                if (link.classList.contains('btn')) {
                    gtag('event', 'cta_click', {
                        event_category: 'engagement',
                        event_label: linkText
                    });
                }
            }
        });
    }

    // ===== 8. SEGUIMIENTO DE TIEMPO EN PÁGINA =====
    function trackTimeOnPage() {
        let startTime = Date.now();
        let maxTime = 0;
        
        // Actualizar tiempo máximo cada 15 segundos
        const timeInterval = setInterval(() => {
            maxTime += 15;
            
            // Enviar evento cada minuto
            if (maxTime % 60 === 0) {
                gtag('event', 'timing_complete', {
                    name: 'time_on_page',
                    value: maxTime,
                    event_category: 'engagement'
                });
            }
        }, 15000);
        
        // Limpiar al salir de la página
        window.addEventListener('beforeunload', function() {
            clearInterval(timeInterval);
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            gtag('event', 'page_exit', {
                event_category: 'engagement',
                value: totalTime
            });
        });
    }

    // ===== 9. SEGUIMIENTO DEL CARRUSEL =====
    function trackCarouselInteractions() {
        // Detectar clics en controles del carrusel
        document.addEventListener('click', function(e) {
            if (e.target.closest('.tiny-slider, .carousel')) {
                gtag('event', 'carousel_interaction', {
                    event_category: 'engagement',
                    event_label: 'slide_change'
                });
            }
        });
    }

    // ===== 10. SEGUIMIENTO DE ERRORES =====
    function trackErrors() {
        window.addEventListener('error', function(e) {
            gtag('event', 'exception', {
                description: e.message,
                fatal: false
            });
        });
        
        // Promesas rechazadas
        window.addEventListener('unhandledrejection', function(e) {
            gtag('event', 'exception', {
                description: e.reason,
                fatal: false
            });
        });
    }

    // ===== 11. SEGUIMIENTO DEL WIDGET DE WHATSAPP =====
    function trackWhatsAppWidget() {
        // Observer para detectar cuando aparece el widget
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.id === 'my-whatsapp' || node.classList.contains('floating-wpp'))) {
                        // Trackear cuando se muestra el widget
                        gtag('event', 'whatsapp_widget_show', {
                            event_category: 'contact',
                            event_label: 'Widget Visible'
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ===== INICIALIZACIÓN =====
    function initAnalyticsTracking() {
        console.log('🔥 Iniciando Google Analytics 4 - Seguimiento Avanzado');
        
        // Ejecutar todas las funciones de tracking
        trackPageView();
        trackOutboundLinks();
        trackSiteSearch();
        trackVideoInteractions();
        trackFormInteractions();
        trackInternalNavigation();
        trackTimeOnPage();
        trackCarouselInteractions();
        trackErrors();
        trackWhatsAppWidget();
        
        // Eventos de scroll con throttling
        let scrollTimer = null;
        window.addEventListener('scroll', function() {
            if (scrollTimer !== null) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(trackScrollDepth, 100);
        });
        
        console.log('✅ Google Analytics tracking configurado correctamente');
    }

    // Ejecutar después de que la página esté completamente cargada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalyticsTracking);
    } else {
        initAnalyticsTracking();
    }
});

// ===== FUNCIONES GLOBALES PARA EVENTOS PERSONALIZADOS =====
window.trackCustomEvent = function(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
};

// Función para trackear descargas
window.trackDownload = function(fileName) {
    gtag('event', 'file_download', {
        event_category: 'downloads',
        event_label: fileName
    });
};

// Función para trackear clicks en teléfonos
window.trackPhoneClick = function(phoneNumber) {
    gtag('event', 'phone_call', {
        event_category: 'contact',
        event_label: phoneNumber
    });
};