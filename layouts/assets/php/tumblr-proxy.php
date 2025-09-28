<?php
/**
 * TUMBLR API PROXY - ODS CERO
 * Proxy seguro para acceder a la API de Tumblr con OAuth
 * Mantiene las credenciales en el servidor (seguro)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración OAuth - CARGAR DESDE ARCHIVO SEGURO
try {
    $config_file = __DIR__ . '/config.php';
    if (file_exists($config_file)) {
        $config = include $config_file;
        $oauth_config = $config['tumblr_oauth'];
        $allowed_origins = $config['allowed_origins'] ?? ['*'];
        $cache_duration = $config['cache_duration'] ?? 300;
    } else {
        // Fallback para desarrollo (usar variables de entorno si están disponibles)
        $oauth_config = [
            'consumer_key' => getenv('TUMBLR_CONSUMER_KEY') ?: 'PAoH5idLVQvCta6cxVwXSctjg8BvAoMGF03lG776ySZKYDZAY5',
            'consumer_secret' => getenv('TUMBLR_CONSUMER_SECRET') ?: '',
            'token' => getenv('TUMBLR_TOKEN') ?: '',
            'token_secret' => getenv('TUMBLR_TOKEN_SECRET') ?: ''
        ];
        $allowed_origins = ['*'];
        $cache_duration = 300;
        
        // Log warning si las credenciales no están completas
        if (empty($oauth_config['consumer_secret'])) {
            error_log('WARNING: Tumblr OAuth credentials not properly configured');
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error', 'success' => false]);
    exit;
}

// Validar CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array('*', $allowed_origins) && !in_array($origin, $allowed_origins)) {
    http_response_code(403);
    echo json_encode(['error' => 'Origin not allowed', 'success' => false]);
    exit;
}

/**
 * Generar signature OAuth 1.0a
 */
function generateOAuthSignature($method, $url, $params, $consumer_secret, $token_secret) {
    ksort($params);
    $param_string = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $base_string = strtoupper($method) . '&' . rawurlencode($url) . '&' . rawurlencode($param_string);
    $key = rawurlencode($consumer_secret) . '&' . rawurlencode($token_secret);
    return base64_encode(hash_hmac('sha1', $base_string, $key, true));
}

/**
 * Realizar petición OAuth a Tumblr
 */
function makeOAuthRequest($blog_name, $config, $limit = 6, $npf = true, $filter = 'raw') {
    $url = "https://api.tumblr.com/v2/blog/{$blog_name}.tumblr.com/posts";
    
    $oauth_params = [
        'oauth_consumer_key' => $config['consumer_key'],
        'oauth_nonce' => md5(uniqid(rand(), true)),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => time(),
        'oauth_token' => $config['token'],
        'oauth_version' => '1.0'
    ];
    
    $request_params = [
        'limit' => $limit,
        // Preferir NPF y contenido crudo para extraer imágenes correctamente
        'npf' => $npf ? 'true' : 'false',
        'filter' => $filter,
        'reblog_info' => 'true',
        'notes_info' => 'true'
    ];
    
    $all_params = array_merge($oauth_params, $request_params);
    
    // Generar signature
    $oauth_params['oauth_signature'] = generateOAuthSignature(
        'GET', 
        $url, 
        $all_params,
        $config['consumer_secret'],
        $config['token_secret']
    );
    
    // Construir Authorization header
    $oauth_header = 'OAuth ';
    $oauth_values = [];
    foreach ($oauth_params as $key => $value) {
        $oauth_values[] = rawurlencode($key) . '="' . rawurlencode($value) . '"';
    }
    $oauth_header .= implode(', ', $oauth_values);
    
    // Construir URL con parámetros
    $final_url = $url . '?' . http_build_query($request_params);
    
    // Realizar petición
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                "Authorization: {$oauth_header}",
                "User-Agent: ODS-Cero-Website/1.0"
            ],
            'timeout' => 30
        ]
    ]);
    
    $response = file_get_contents($final_url, false, $context);
    
    if ($response === false) {
        throw new Exception('Failed to fetch from Tumblr API');
    }
    
    return json_decode($response, true);
}

// Procesar la petición
try {
    // Validar parámetros
    $blog_name = $_GET['blog'] ?? 'odscero';
    $limit = min((int)($_GET['limit'] ?? 6), 20); // Máximo 20 posts
    $npf = isset($_GET['npf']) ? filter_var($_GET['npf'], FILTER_VALIDATE_BOOLEAN) : true;
    $filter = $_GET['filter'] ?? 'raw';
    
    // Validar blog name (solo caracteres alfanuméricos y guiones)
    if (!preg_match('/^[a-zA-Z0-9-]+$/', $blog_name)) {
        throw new Exception('Invalid blog name');
    }
    
    // Realizar petición a Tumblr
    $tumblr_response = makeOAuthRequest($blog_name, $oauth_config, $limit, $npf, $filter);
    
    if (!$tumblr_response || !isset($tumblr_response['response'])) {
        throw new Exception('Invalid response from Tumblr');
    }
    
    // Procesar y limpiar la respuesta
    $posts = $tumblr_response['response']['posts'] ?? [];
    $cleaned_posts = [];
    
    foreach ($posts as $post) {
        $cleaned_post = [
            'id' => $post['id'] ?? '',
            'type' => $post['type'] ?? 'text',
            'timestamp' => $post['timestamp'] ?? time(),
            'post_url' => $post['post_url'] ?? '',
            'short_url' => $post['short_url'] ?? '',
            'title' => $post['title'] ?? '',
            'body' => $post['body'] ?? '',
            'caption' => $post['caption'] ?? '',
            'summary' => $post['summary'] ?? '',
            // Campos NPF / ricos
            'is_blocks_post_format' => $post['is_blocks_post_format'] ?? false,
            'content' => $post['content'] ?? null,
            'content_raw' => $post['content_raw'] ?? null,
            'trail' => $post['trail'] ?? [],
            // Otros posibles campos de imagen
            'thumbnail_url' => $post['thumbnail_url'] ?? '',
            'link_image' => $post['link_image'] ?? ''
        ];
        
        // Agregar fotos si existen
        if (isset($post['photos'])) {
            $cleaned_post['photos'] = [];
            foreach ($post['photos'] as $photo) {
                $cleaned_post['photos'][] = [
                    'original_size' => $photo['original_size'] ?? null,
                    'alt_sizes' => $photo['alt_sizes'] ?? []
                ];
            }
        }

        // Incluir datos de video relevantes
        if ($post['type'] === 'video') {
            $cleaned_post['video_url'] = $post['video_url'] ?? '';
            $cleaned_post['player'] = $post['player'] ?? [];
        }
        
        $cleaned_posts[] = $cleaned_post;
    }
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'posts' => $cleaned_posts,
        'total_posts' => count($cleaned_posts),
        'blog_name' => $blog_name
    ]);

} catch (Exception $e) {
    // Error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'posts' => []
    ]);
}
?>