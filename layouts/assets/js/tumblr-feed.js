/**
 * TUMBLR API INTEGRATION - ODS CERO
 * Sistema moderno para mostrar noticias del blog de Tumblr
 * Integrado con el diseño existente de la página
 */

class TumblrFeed {
    constructor(options = {}) {
        // Solo usamos el consumer key público (seguro para frontend)
        this.apiKey = options.apiKey || 'PAoH5idLVQvCta6cxVwXSctjg8BvAoMGF03lG776ySZKYDZAY5';
        this.blogName = options.blogName || 'odscero';
        this.containerId = options.containerId || 'tumblr-feed';
        this.maxPosts = options.maxPosts || 6;
        this.showImages = options.showImages !== false;
        this.showDates = options.showDates !== false;
        this.compact = options.compact || false;
        
        // Configuración para el proxy backend (opcional)
        this.useProxy = options.useProxy || false;
        this.proxyUrl = options.proxyUrl || '/api/tumblr-proxy';
        this.debug = options.debug || false;
    }

    // Normaliza la URL de imagen para evitar bloqueos por mixed content y mejora de tamaño
    normalizeImageUrl(url) {
        if (!url || typeof url !== 'string') return '';
        try {
            // Forzar https cuando sea posible
            if (url.startsWith('http://')) {
                url = url.replace(/^http:\/\//i, 'https://');
            }
            // Aumentar tamaño en imágenes de Tumblr cuando vienen muy pequeñas
            url = this.upscaleTumblrImage(url);
        } catch {}
        return url;
    }

    // Limpia títulos que traen fecha prefijada: "Miércoles 27 de agosto de 2025." etc.
    cleanTitle(title) {
        if (!title) return '';
        const days = '(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)';
        const months = '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)';
        const datePrefix = new RegExp(`^\\s*${days}\\s+\\d{1,2}\\s+de\\s+${months}(?:\\s+de\\s+\\d{4})?\\.?\\s*-?\\s*`, 'i');
        return title.replace(datePrefix, '').trim();
    }

    // Extrae una URL de imagen desde NPF (Neue Post Format)
    extractImageFromNPF(post) {
        try {
            // NPF puede venir en post.content (array de bloques)
            const blocks = post.content || post.trail?.flatMap(t => t?.content) || [];
            if (Array.isArray(blocks) && blocks.length) {
                for (const block of blocks) {
                    // Bloques de tipo media con fotos
                    if (block.type === 'image' && block.media && Array.isArray(block.media)) {
                        // Buscar la mejor resolución disponible
                        const chosen = this.chooseBestTumblrMedia(block.media);
                        if (chosen) return chosen;
                    }
                    // Bloques de layout que contienen sub-bloques
                    if (block.type === 'layout' && Array.isArray(block.display)) {
                        for (const item of block.display) {
                            if (item.type === 'image' && item.media) {
                                const chosen = this.chooseBestTumblrMedia(item.media);
                                if (chosen) return chosen;
                            }
                        }
                    }
                }
            }
            // Algunos posts traen 'content_raw' HTML, intentar allí
            if (post.content_raw) {
                const match = post.content_raw.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match) return this.upscaleTumblrImage(match[1]);
            }
            // También trail puede traer content_raw
            if (post.trail && Array.isArray(post.trail)) {
                for (const t of post.trail) {
                    if (t?.content_raw) {
                        const match = t.content_raw.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (match) return this.upscaleTumblrImage(match[1]);
                    }
                }
            }
        } catch (e) {
            if (this.debug) console.warn('NPF parse error:', e);
        }
        return '';
    }

    // Escoge el mejor media de Tumblr (preferir ~500-800px de ancho)
    chooseBestTumblrMedia(mediaArray) {
        if (!Array.isArray(mediaArray) || !mediaArray.length) return '';
        // Cada elemento puede tener {url, width, height, ...}
        const sorted = [...mediaArray].sort((a, b) => (a.width||0) - (b.width||0));
        const preferred = sorted.find(m => (m.width||0) >= 400 && (m.width||0) <= 900)
                        || sorted.find(m => (m.width||0) >= 300)
                        || sorted[sorted.length - 1];
        return this.upscaleTumblrImage(preferred?.url || '');
    }

    // Intenta mejorar la resolución de URLs de 64.media.tumblr.com sustituyendo el tamaño
    upscaleTumblrImage(url) {
        if (!url) return '';
        try {
            if (url.includes('64.media.tumblr.com')) {
                // Reemplazar s75x75, s100x200, s250x400, etc. por s640x960 o s1280x1920
                url = url.replace(/\/s\d+x\d+(_c\d+)?\//, '/s640x960/');
            }
        } catch {}
        return url;
    }

    async fetchPosts() {
        try {
            console.log('🔄 Fetching posts from Tumblr API...');
            
            if (this.useProxy) {
                // Usar proxy backend para OAuth (más seguro)
                return await this.fetchViaProxy();
            } else {
                // Usar API pública con consumer key
                return await this.fetchPublicAPI();
            }
        } catch (error) {
            console.error('❌ Error fetching Tumblr posts:', error);
            return [];
        }
    }

    async fetchPublicAPI() {
        // Usar solo API pública - más limitada pero segura para frontend
        const response = await this.makeJSONPRequest(
            `https://api.tumblr.com/v2/blog/${this.blogName}.tumblr.com/posts?api_key=${this.apiKey}&limit=${this.maxPosts}&npf=true&filter=raw`
        );

        if (response && response.response && response.response.posts) {
            console.log('✅ Public API posts fetched successfully:', response.response.posts.length);
            return response.response.posts;
        }
        
        console.warn('⚠️ No posts found in public API response');
        return [];
    }

    async fetchViaProxy() {
        // Usar endpoint proxy backend que maneja OAuth de forma segura
        try {
            const proxyEndpoint = this.proxyUrl || 'assets/php/tumblr-proxy.php';
            const fullUrl = `${proxyEndpoint}?blog=${this.blogName}&limit=${this.maxPosts}&npf=true&filter=raw`;
            
            if (this.debug) {
                console.log('🔗 Proxy URL:', fullUrl);
            }
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // No enviar credenciales sensibles desde el frontend
            });

            if (this.debug) {
                console.log('📡 Proxy response status:', response.status);
                console.log('📡 Proxy response headers:', response.headers);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Proxy error response:', errorText);
                throw new Error(`Proxy error: ${response.status} - ${errorText}`);
            }

            const responseText = await response.text();
            if (this.debug) {
                console.log('📝 Raw proxy response:', responseText);
            }
            
            const data = JSON.parse(responseText);
            console.log('✅ Proxy posts fetched successfully:', data.posts?.length || 0);
            return data.posts || [];
        } catch (error) {
            console.error('❌ Error with proxy:', error);
            // Fallback a API pública
            console.log('🔄 Falling back to public API...');
            return await this.fetchPublicAPI();
        }
    }

    makeJSONPRequest(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'tumblr_callback_' + Date.now();
            const script = document.createElement('script');
            
            // Timeout para evitar requests colgados
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
                this.cleanupJSONP(script, callbackName);
            }, 10000);

            window[callbackName] = function(data) {
                clearTimeout(timeout);
                resolve(data);
                this.cleanupJSONP(script, callbackName);
            }.bind(this);

            script.src = url + '&jsonp=' + callbackName;
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('JSONP request failed'));
                this.cleanupJSONP(script, callbackName);
            };

            document.head.appendChild(script);
        });
    }

    cleanupJSONP(script, callbackName) {
        try {
            if (script && script.parentNode) {
                document.head.removeChild(script);
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
        } catch (e) {
            console.warn('Cleanup warning:', e);
        }
    }

    formatDate(timestamp) {
        let date;
        
        // Manejar diferentes formatos de timestamp
        if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (timestamp > 1000000000000) {
            // Timestamp en milisegundos
            date = new Date(timestamp);
        } else {
            // Timestamp en segundos (formato Unix)
            date = new Date(timestamp * 1000);
        }
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return 'Fecha no disponible';
        }
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Hace 1 día';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;
        
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    extractContent(post) {
        let title = '';
        let excerpt = '';
        let imageUrl = '';

        // Primero intentar extraer imagen desde NPF (Neue Post Format)
        const npfUrl = this.extractImageFromNPF(post);
        if (npfUrl) {
            imageUrl = npfUrl;
        }

        // Extraer contenido según el tipo de post
        if (post.type === 'text') {
            title = post.title || 'Noticia ODS Cero';
            excerpt = post.body ? this.stripHtml(post.body).substring(0, 120) + '...' : '';
            
            // Para posts de texto, buscar imágenes en el contenido HTML
            if (post.body) {
                // Buscar múltiples patrones de imágenes en el HTML
                const imgPatterns = [
                    /<img[^>]+src=["'](https:\/\/64\.media\.tumblr\.com\/[^"']+)["'][^>]*>/i,
                    /<img[^>]+src=["'](https:\/\/[^"']*\.media\.tumblr\.com\/[^"']+)["'][^>]*>/i,
                    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
                    /data-big-photo=["'](https:\/\/[^"']*\.media\.tumblr\.com\/[^"']+)["']/i,
                    /data-big-photo=["']([^"']+)["']/i
                ];
                
                for (const pattern of imgPatterns) {
                    const match = post.body.match(pattern);
                    if (match && match[1]) {
                        imageUrl = match[1];
                        if (this.debug) {
                            console.log('🎯 Imagen extraída del HTML del post text:', imageUrl);
                        }
                        break;
                    }
                }
                
                // Si encontramos una imagen muy pequeña (75x75), buscar una más grande
                if (imageUrl && imageUrl.includes('s75x75')) {
                    const betterSizes = ['s1280x1920', 's640x960', 's500x750', 's400x600'];
                    for (const size of betterSizes) {
                        const betterUrl = imageUrl.replace(/s\d+x\d+(_c\d+)?/, size);
                        if (betterUrl !== imageUrl) {
                            imageUrl = betterUrl;
                            if (this.debug) {
                                console.log('📈 Imagen mejorada a mayor resolución:', imageUrl);
                            }
                            break;
                        }
                    }
                }
            }
            
            // Para posts con formato de bloques, también buscar en trail si existe
            if (!imageUrl && post.trail && Array.isArray(post.trail)) {
                for (const trailItem of post.trail) {
                    if (trailItem.content_raw) {
                        const imgMatch = trailItem.content_raw.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
                        if (imgMatch && imgMatch[1]) {
                            imageUrl = imgMatch[1];
                            if (this.debug) {
                                console.log('🎯 Imagen extraída del trail:', imageUrl);
                            }
                            break;
                        }
                    }
                }
            }
        } else if (post.type === 'photo') {
            title = post.caption ? this.stripHtml(post.caption).substring(0, 120) : 'Actualización Fotográfica';
            excerpt = post.caption ? this.stripHtml(post.caption).substring(0, 100) + '...' : '';
            
            // Extraer imagen de posts de foto - múltiples métodos de extracción
            if (post.photos && post.photos.length > 0) {
                const photo = post.photos[0]; // Tomar la primera imagen
                
                // Método 1: Buscar en alt_sizes
                if (photo.alt_sizes && photo.alt_sizes.length > 0) {
                    const sizes = [...photo.alt_sizes].sort((a, b) => a.width - b.width);
                    const appropriateSize = sizes.find(size => size.width >= 400 && size.width <= 800) || 
                                          sizes.find(size => size.width >= 300) ||
                                          sizes[sizes.length - 1];
                    if (appropriateSize && appropriateSize.url) {
                        imageUrl = appropriateSize.url;
                    }
                }
                
                // Método 2: Usar original_size si no hay alt_sizes
                if (!imageUrl && photo.original_size && photo.original_size.url) {
                    imageUrl = photo.original_size.url;
                }
                
                // Método 3: Buscar cualquier URL de imagen en el objeto photo
                if (!imageUrl) {
                    const photoKeys = ['url', 'photo-url-1280', 'photo-url-500', 'photo-url-400', 'photo-url-250'];
                    for (const key of photoKeys) {
                        if (photo[key]) {
                            imageUrl = photo[key];
                            break;
                        }
                    }
                }
            }
            
            // Método 4: Buscar en photo-url directo del post
            if (!imageUrl) {
                const photoUrlKeys = ['photo-url-1280', 'photo-url-500', 'photo-url-400', 'photo-url-250', 'photo-url-100', 'photo-url-75sq'];
                for (const key of photoUrlKeys) {
                    if (post[key]) {
                        imageUrl = post[key];
                        break;
                    }
                }
            }
        } else if (post.type === 'photoset') {
            title = post.caption ? this.stripHtml(post.caption).substring(0, 120) : 'Galería de Fotos';
            excerpt = post.caption ? this.stripHtml(post.caption).substring(0, 100) + '...' : '';
            
            // Para photosets, usar la primera imagen del set con múltiples métodos
            if (post.photos && post.photos.length > 0) {
                const photo = post.photos[0];
                
                // Mismo sistema que para photos individuales
                if (photo.alt_sizes && photo.alt_sizes.length > 0) {
                    const sizes = [...photo.alt_sizes].sort((a, b) => a.width - b.width);
                    const appropriateSize = sizes.find(size => size.width >= 400 && size.width <= 800) || 
                                          sizes[sizes.length - 1];
                    if (appropriateSize && appropriateSize.url) {
                        imageUrl = appropriateSize.url;
                    }
                }
                
                if (!imageUrl && photo.original_size && photo.original_size.url) {
                    imageUrl = photo.original_size.url;
                }
                
                // Buscar URLs alternativas en photosets
                if (!imageUrl) {
                    const photoKeys = ['url', 'photo-url-1280', 'photo-url-500', 'photo-url-400'];
                    for (const key of photoKeys) {
                        if (photo[key]) {
                            imageUrl = photo[key];
                            break;
                        }
                    }
                }
            }
            
            // Fallback para photosets: buscar en el post directamente
            if (!imageUrl) {
                const photoUrlKeys = ['photoset-photo-url-1280', 'photoset-photo-url-500', 'photo-url-1280', 'photo-url-500'];
                for (const key of photoUrlKeys) {
                    if (post[key]) {
                        imageUrl = post[key];
                        break;
                    }
                }
            }
        } else if (post.type === 'link') {
            title = post.title || post.url || 'Enlace Compartido';
            excerpt = post.description ? this.stripHtml(post.description).substring(0, 120) + '...' : '';
            // Para enlaces, a veces Tumblr incluye una imagen de preview
            if (post.link_image) {
                imageUrl = post.link_image;
            }
        } else if (post.type === 'video') {
            title = post.caption ? this.stripHtml(post.caption).substring(0, 120) : 'Video ODS Cero';
            excerpt = post.caption ? this.stripHtml(post.caption).substring(0, 100) + '...' : '';
            
            // Para videos, buscar thumbnail en múltiples ubicaciones
            if (post.thumbnail_url) {
                imageUrl = post.thumbnail_url;
            } else if (post.thumbnail_width && post.thumbnail_height) {
                // Construir URL del thumbnail basado en metadata
                if (post.video_url) {
                    const videoId = post.video_url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&\n?#]+)/);
                    if (videoId) {
                        imageUrl = `https://img.youtube.com/vi/${videoId[1]}/maxresdefault.jpg`;
                    }
                }
            } else if (post.player && post.player.length > 0) {
                const playerWithPoster = post.player.find(p => p.poster_url);
                if (playerWithPoster) {
                    imageUrl = playerWithPoster.poster_url;
                }
            }
        } else {
            // Para otros tipos de post, buscar en el contenido general
            title = post.title || post.summary || `Post ${post.type}`;
            excerpt = '';
            
            // Intentar extraer imagen de cualquier contenido HTML disponible
            const htmlContent = post.body || post.description || post.caption || '';
            if (htmlContent) {
                const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                }
                excerpt = this.stripHtml(htmlContent).substring(0, 120) + '...';
            }
        }
        
        // BÚSQUEDA AGRESIVA DE IMÁGENES - Intentar todas las posibilidades
        if (!imageUrl) {
            // Buscar en todas las propiedades que podrían contener URLs de imágenes
            const imageFields = [
                'photo-url-1280', 'photo-url-500', 'photo-url-400', 'photo-url-250', 'photo-url-100', 'photo-url-75sq',
                'photoset-photo-url-1280', 'photoset-photo-url-500', 'photoset-photo-url-400',
                'thumbnail_url', 'link_image', 'video_thumbnail_url'
            ];
            
            for (const field of imageFields) {
                if (post[field]) {
                    imageUrl = post[field];
                    if (this.debug) {
                        console.log(`🎯 Imagen encontrada en campo ${field}:`, imageUrl);
                    }
                    break;
                }
            }
        }
        
        // Si aún no hay imagen, buscar en objetos anidados
        if (!imageUrl && post.photos && Array.isArray(post.photos) && post.photos.length > 0) {
            const photo = post.photos[0];
            if (typeof photo === 'string') {
                imageUrl = photo; // Si photos es array de strings
            } else if (photo && typeof photo === 'object') {
                // Buscar en diferentes propiedades del objeto photo
                imageUrl = photo.url || photo.src || photo.original_size?.url || 
                          (photo.alt_sizes && photo.alt_sizes[0]?.url);
            }
        }
        
        // Último intento: buscar cualquier URL que parezca una imagen
        if (!imageUrl) {
            const allKeys = Object.keys(post);
            for (const key of allKeys) {
                const value = post[key];
                if (typeof value === 'string' && 
                    (value.includes('.jpg') || value.includes('.png') || value.includes('.gif') || 
                     value.includes('.jpeg') || value.includes('media.tumblr.com'))) {
                    imageUrl = value;
                    if (this.debug) {
                        console.log(`🔍 Imagen encontrada por patrón en ${key}:`, imageUrl);
                    }
                    break;
                }
            }
        }

        // Debug: mostrar información completa sobre el post y las imágenes encontradas
        if (this.debug) {
            console.group(`📝 Post ${post.id} (${post.type})`);
            console.log('Título:', title);
            console.log('Imagen URL final:', imageUrl || 'NO ENCONTRADA');
            
            // Mostrar contenido del body si es un post de texto
            if (post.type === 'text' && post.body) {
                console.log('📄 Contenido HTML del body (primeros 500 chars):', post.body.substring(0, 500) + '...');
                
                // Buscar todas las imágenes en el HTML
                const allImages = [...post.body.matchAll(/(?:src|data-big-photo)=["']([^"']+)["']/gi)];
                if (allImages.length > 0) {
                    console.log('🖼️ Todas las imágenes encontradas en HTML:', allImages.map(match => match[1]));
                }
            }
            
            console.log('Datos del post completo:', post);
            
            if (post.photos && post.photos.length > 0) {
                console.log(`📸 Fotos disponibles (${post.photos.length}):`, post.photos);
                post.photos.forEach((photo, index) => {
                    console.log(`Foto ${index + 1}:`, {
                        original_size: photo.original_size,
                        alt_sizes: photo.alt_sizes,
                        directUrls: Object.keys(photo).filter(key => key.includes('url'))
                    });
                });
            }
            
            // Mostrar todas las claves que contengan 'url' o 'photo'
            const urlKeys = Object.keys(post).filter(key => 
                key.toLowerCase().includes('url') || 
                key.toLowerCase().includes('photo')
            );
            if (urlKeys.length > 0) {
                console.log('� Claves con URLs encontradas:', urlKeys.reduce((obj, key) => {
                    obj[key] = post[key];
                    return obj;
                }, {}));
            }
            
            console.groupEnd();
        }

        // Si no se encontró imagen, intentar un último método: buscar en el HTML del contenido
        if (!imageUrl && (post.body || post.caption || post.description)) {
            const htmlContent = post.body || post.caption || post.description || '';
            
            // Patrones específicos para diferentes tipos de imágenes en Tumblr
            const advancedImgPatterns = [
                // Imágenes de media.tumblr.com (más comunes)
                /(?:src|data-big-photo)=["'](https:\/\/64\.media\.tumblr\.com\/[^"']+\/[^"']+\/s\d+x\d+[^"']*\/[^"']+\.(?:jpg|png|gif))["']/gi,
                /(?:src|data-big-photo)=["'](https:\/\/[^"']*\.media\.tumblr\.com\/[^"']+)["']/gi,
                // Cualquier imagen con dominio tumblr
                /(?:src|data-big-photo)=["'](https:\/\/[^"']*tumblr[^"']+\.(?:jpg|png|gif)[^"']*)["']/gi,
                // Patrón general para imágenes
                /<img[^>]+src=["']([^"']+\.(?:jpg|png|gif|jpeg)[^"']*)["'][^>]*>/gi
            ];
            
            for (const pattern of advancedImgPatterns) {
                const matches = [...htmlContent.matchAll(pattern)];
                if (matches.length > 0) {
                    // Tomar la primera imagen encontrada
                    imageUrl = matches[0][1];
                    
                    // Si es una imagen pequeña, intentar encontrar una versión más grande
                    if (imageUrl.includes('s75x75') || imageUrl.includes('s100x200')) {
                        // Buscar versión de mayor resolución en el mismo HTML
                        const higherResMatch = htmlContent.match(/https:\/\/64\.media\.tumblr\.com\/[^"']+\/[^"']+\/s(?:640x960|500x750|1280x1920)\/[^"']+\.(?:jpg|png|gif)/i);
                        if (higherResMatch) {
                            imageUrl = higherResMatch[0];
                        }
                    }
                    
                    if (this.debug) {
                        console.log('🔍 Imagen final extraída del HTML:', imageUrl);
                        console.log('📊 Total de imágenes encontradas:', matches.length);
                    }
                    break;
                }
            }
        }

        // Normalizar resultados finales
        const finalTitle = this.cleanTitle(title || 'Actualización ODS Cero');
        const finalImage = this.normalizeImageUrl(imageUrl || '');

        return { 
            title: finalTitle, 
            excerpt: excerpt || '', 
            imageUrl: finalImage // Permitir string vacío si no hay imagen
        };
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    createPostElement(post) {
        const { title, excerpt, imageUrl } = this.extractContent(post);
        const postDate = this.formatDate(post.timestamp);
        
        if (this.debug) {
            console.log(`🖼️ Renderizando post ${post.id}:`, {
                title: title,
                imageUrl: imageUrl,
                showImages: this.showImages,
                willShowImage: imageUrl && this.showImages
            });
        }
        
        return `
            <div class="tumblr-post group bg-white dark:bg-slate-900 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-600">
                ${imageUrl && this.showImages ? `
                    <div class="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-slate-800">
                        <img src="${imageUrl}" 
                             alt="Imagen de la noticia" 
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                             loading="lazy"
                             decoding="async"
                             referrerpolicy="no-referrer"
                             onerror="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
                
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        ${this.showDates ? `
                            <time class="text-sm text-orange-600 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                ${postDate}
                            </time>
                        ` : ''}
                        <div class="flex items-center space-x-1 text-gray-400 dark:text-slate-500">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                            <span class="text-xs">Tumblr</span>
                        </div>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-4 group-hover:text-orange-600 transition-colors">
                        <a href="${post.post_url}" 
                           target="_blank" 
                           rel="noopener"
                           onclick="gtag('event', 'tumblr_post_click', {event_category: 'engagement', event_label: '${post.type}'});">
                            ${title}
                        </a>
                    </h3>
                    
                    ${excerpt ? `
                        <p class="text-gray-600 dark:text-slate-300 text-sm line-clamp-3 mb-4 leading-relaxed">
                            ${excerpt}
                        </p>
                    ` : ''}
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                            <span class="text-xs text-gray-500 dark:text-slate-400">ODS Cero</span>
                        </div>
                        
                        <a href="${post.post_url}" 
                           target="_blank" 
                           rel="noopener"
                           onclick="gtag('event', 'tumblr_read_more', {event_category: 'engagement', event_label: '${post.type}'});"
                           class="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium group/link">
                            Leer más
                            <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`❌ Container ${this.containerId} not found`);
            return;
        }

        // Estado de carga con animación moderna
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16">
                <div class="relative">
                    <div class="w-12 h-12 border-4 border-orange-200 dark:border-orange-900 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-600 rounded-full animate-spin"></div>
                </div>
                <p class="mt-4 text-gray-600 dark:text-slate-300 font-medium">Cargando las últimas noticias...</p>
                <p class="mt-1 text-sm text-gray-400 dark:text-slate-500">Conectando con Tumblr</p>
            </div>
        `;

        try {
            const posts = await this.fetchPosts();
            
            if (posts.length === 0) {
                // En modo debug, mostrar un post de prueba para verificar renderizado
                if (this.debug) {
                    console.log('🧪 Creando post de prueba para verificar renderizado...');
                    const testPost = {
                        id: 'test-post-' + Date.now(),
                        type: 'photo',
                        timestamp: Date.now() / 1000,
                        photos: [{
                            alt_sizes: [{
                                url: 'https://via.placeholder.com/500x300/ea580c/ffffff?text=Prueba+ODS+Cero',
                                width: 500,
                                height: 300
                            }]
                        }],
                        caption: '<p>Post de prueba para verificar que las imágenes funcionan correctamente en el sistema de noticias de ODS Cero.</p>',
                        post_url: 'https://odscero.tumblr.com'
                    };
                    
                    container.innerHTML = `
                        <div class="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <h4 class="text-yellow-800 dark:text-yellow-200 font-semibold mb-2 flex items-center">
                                <i data-lucide="flask" class="w-5 h-5 mr-2"></i>
                                Modo Debug - Post de Prueba
                            </h4>
                            <p class="text-yellow-700 dark:text-yellow-300 text-sm mb-4">Este es un post de prueba para verificar que el sistema de renderizado funciona correctamente.</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                ${this.createPostElement(testPost)}
                            </div>
                        </div>
                        <div class="text-center py-16 border-t border-gray-200 dark:border-slate-700">
                            <div class="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <i data-lucide="newspaper" class="w-10 h-10 text-gray-400 dark:text-slate-500"></i>
                            </div>
                            <h4 class="text-xl font-medium text-gray-900 dark:text-white mb-2">No hay noticias reales disponibles</h4>
                            <p class="text-gray-500 dark:text-slate-400 mb-6">Los posts de Tumblr no se pudieron cargar. Verifica la configuración del proxy.</p>
                            <a href="https://odscero.tumblr.com" 
                               target="_blank" 
                               rel="noopener"
                               class="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                                Ver blog en Tumblr
                            </a>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = `
                    <div class="text-center py-16">
                        <div class="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <i data-lucide="newspaper" class="w-10 h-10 text-gray-400 dark:text-slate-500"></i>
                        </div>
                        <h4 class="text-xl font-medium text-gray-900 dark:text-white mb-2">No hay noticias disponibles</h4>
                        <p class="text-gray-500 dark:text-slate-400 mb-6">En este momento no tenemos noticias que mostrar.</p>
                        <a href="https://odscero.tumblr.com" 
                           target="_blank" 
                           rel="noopener"
                           class="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                            <i data-lucide="external-link" class="w-4 h-4 mr-2"></i>
                            Visitar nuestro blog
                        </a>
                    </div>
                `;
                return;
            }

            const postsHtml = posts.map(post => this.createPostElement(post)).join('');
            
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${postsHtml}
                </div>
            `;

            // Inicializar iconos de Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Analytics tracking
            if (typeof gtag !== 'undefined') {
                gtag('event', 'tumblr_feed_loaded', {
                    event_category: 'content',
                    event_label: 'posts_count',
                    value: posts.length
                });
            }

            console.log('✅ Tumblr feed rendered successfully with', posts.length, 'posts');

        } catch (error) {
            console.error('❌ Error rendering Tumblr feed:', error);
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <i data-lucide="alert-circle" class="w-10 h-10 text-red-500"></i>
                    </div>
                    <h4 class="text-xl font-medium text-gray-900 dark:text-white mb-2">Error al cargar noticias</h4>
                    <p class="text-gray-500 dark:text-slate-400 mb-6">No pudimos conectar con nuestro blog. Inténtalo más tarde.</p>
                    <a href="https://odscero.tumblr.com" 
                       target="_blank" 
                       rel="noopener"
                       class="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                        <i data-lucide="external-link" class="w-4 h-4 mr-2"></i>
                        Ir a nuestro blog
                    </a>
                </div>
            `;
        }
    }
}

// Función global para inicializar el feed
window.initTumblrFeed = function(config = {}) {
    console.log('🚀 Initializing Tumblr feed...');
    const feed = new TumblrFeed(config);
    feed.render();
    return feed;
};

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para asegurar que otros scripts se carguen
    setTimeout(() => {
        if (document.getElementById('tumblr-feed')) {
            window.initTumblrFeed();
        }
    }, 1000);
});