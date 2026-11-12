<?php

// Headers de CORS e JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Resposta imediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/usuarios.php';
require_once __DIR__ . '/routes/listas.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // Obter URI limpa
    $requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

    // Remover caminho base até /api
    $basePath = dirname($scriptName);
    if ($basePath !== '/' && $basePath !== '\\' && strpos($requestUri, $basePath) === 0) {
        $path = substr($requestUri, strlen($basePath));
    } else {
        $path = $requestUri;
    }

    // Limpar prefixo /api caso exista
    $path = preg_replace('#^/api/?#i', '/', $path);
    $path = trim($path, '/');

    $uriParts = $path === '' ? [] : explode('/', $path);
    $resource = $uriParts[0] ?? '';

    // Ler body da requisição
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    if ($body === null && !empty($rawInput)) {
        // Fallback para form-urlencoded
        parse_str($rawInput, $body);
    }

    // Roteamento
    switch ($resource) {
        case 'health':
            echo json_encode([
                'status' => 'ok',
                'timestamp' => date('c'),
                'engine' => 'PHP ' . PHP_VERSION,
            ]);
            break;

        case 'auth':
            handleAuthRoutes($method, $uriParts, $body);
            break;

        case 'usuarios':
            handleUsuariosRoutes($method, $uriParts, $body);
            break;

        case 'listas':
            handleListasRoutes($method, $uriParts, $body);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'statusCode' => 404,
                'message' => 'Rota não encontrada na API PHP: /' . implode('/', $uriParts),
            ]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'statusCode' => 500,
        'message' => 'Erro interno do servidor: ' . $e->getMessage(),
    ]);
}
