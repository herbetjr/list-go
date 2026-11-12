<?php

define('JWT_SECRET', 'lista-go-segredo-super-seguro-2026-cpanel');

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwtSign(array $payload, int $expiresInSeconds = 604800): string {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;
    $payloadEncoded = json_encode($payload);

    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payloadEncoded);

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64UrlEncode($signature);

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function jwtVerify(?string $token): ?array {
    if (!$token) return null;

    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    list($header64, $payload64, $signature64) = $parts;

    $expectedSignature = base64UrlEncode(
        hash_hmac('sha256', $header64 . "." . $payload64, JWT_SECRET, true)
    );

    if (!hash_equals($expectedSignature, $signature64)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($payload64), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

function getBearerToken(): ?string {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } else if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers) && preg_match('/Bearer\s+(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

function requireAuth(): array {
    $token = getBearerToken();
    $payload = jwtVerify($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['statusCode' => 401, 'message' => 'Não autorizado']);
        exit;
    }
    return $payload;
}

function requireAdmin(): array {
    $usuario = requireAuth();
    if (($usuario['tipo'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['statusCode' => 403, 'message' => 'Acesso restrito para administradores']);
        exit;
    }
    return $usuario;
}

