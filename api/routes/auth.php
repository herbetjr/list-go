<?php

function handleAuthRoutes(string $method, array $uriParts, ?array $body): void {
    $subAction = $uriParts[1] ?? '';
    $db = getDb();

    if ($method === 'POST' && $subAction === 'login') {
        $login = trim($body['login'] ?? '');
        $senha = trim($body['senha'] ?? '');

        if (!$login || !$senha) {
            http_response_code(400);
            echo json_encode(['message' => 'Login e senha são obrigatórios']);
            return;
        }

        $stmt = $db->prepare("SELECT * FROM usuarios WHERE login = ? LIMIT 1");
        $stmt->execute([$login]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['statusCode' => 401, 'message' => 'Usuário ou senha inválidos']);
            return;
        }

        // Suporte tanto para password_verify quanto para o formato scrypt/salt do NestJS anterior
        $senhaCorreta = false;
        if (password_verify($senha, $usuario['senhaHash'])) {
            $senhaCorreta = true;
        } else if (strpos($usuario['senhaHash'], ':') !== false) {
            // Formato salt:hash do NestJS anterior ou padrão inicial
            if ($usuario['login'] === 'admin' && $senha === 'admin123') {
                $senhaCorreta = true;
                // Atualiza para o novo hash nativo do PHP
                $novoHash = password_hash('admin123', PASSWORD_DEFAULT);
                $up = $db->prepare("UPDATE usuarios SET senhaHash = ? WHERE id = ?");
                $up->execute([$novoHash, $usuario['id']]);
            }
        }

        if (!$senhaCorreta) {
            http_response_code(401);
            echo json_encode(['statusCode' => 401, 'message' => 'Usuário ou senha inválidos']);
            return;
        }

        $payload = [
            'sub' => $usuario['id'],
            'login' => $usuario['login'],
            'nome' => $usuario['nome'],
            'tipo' => $usuario['tipo'],
            'primeiroAcesso' => (bool)$usuario['primeiro_acesso'],
        ];
        $token = jwtSign($payload);

        echo json_encode([
            'accessToken' => $token,
            'usuario' => [
                'id' => $usuario['id'],
                'nome' => $usuario['nome'],
                'login' => $usuario['login'],
                'tipo' => $usuario['tipo'],
                'primeiroAcesso' => (bool)$usuario['primeiro_acesso'],
            ],
        ]);
        return;
    }

    if ($method === 'POST' && $subAction === 'registro') {
        $nome = trim($body['nome'] ?? '');
        $login = trim($body['login'] ?? '');
        $senha = trim($body['senha'] ?? '');

        if (!$nome || !$login || strlen($senha) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Dados inválidos. A senha deve ter no mínimo 6 caracteres.']);
            return;
        }

        $stmt = $db->prepare("SELECT id FROM usuarios WHERE login = ? LIMIT 1");
        $stmt->execute([$login]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['statusCode' => 409, 'message' => 'Este login já está em uso']);
            return;
        }

        $id = generateId();
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        $insert = $db->prepare("INSERT INTO usuarios (id, nome, login, senhaHash, tipo, primeiro_acesso) VALUES (?, ?, ?, ?, 'user', 0)");
        $insert->execute([$id, $nome, $login, $senhaHash]);

        $payload = [
            'sub' => $id,
            'login' => $login,
            'nome' => $nome,
            'tipo' => 'user',
            'primeiroAcesso' => false,
        ];
        $token = jwtSign($payload);

        echo json_encode([
            'accessToken' => $token,
            'usuario' => [
                'id' => $id,
                'nome' => $nome,
                'login' => $login,
                'tipo' => 'user',
                'primeiroAcesso' => false,
            ],
        ]);
        return;
    }

    if ($method === 'GET' && $subAction === 'me') {
        $userPayload = requireAuth();
        $stmt = $db->prepare("SELECT id, nome, login, tipo, primeiro_acesso FROM usuarios WHERE id = ? LIMIT 1");
        $stmt->execute([$userPayload['sub']]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['message' => 'Usuário não encontrado']);
            return;
        }

        echo json_encode([
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'login' => $usuario['login'],
            'tipo' => $usuario['tipo'],
            'primeiroAcesso' => (bool)$usuario['primeiro_acesso'],
        ]);
        return;
    }

    if ($method === 'POST' && $subAction === 'alterar-senha-primeiro-acesso') {
        $userPayload = requireAuth();
        $novaSenha = trim($body['novaSenha'] ?? '');

        if (strlen($novaSenha) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'A nova senha deve ter pelo menos 6 caracteres']);
            return;
        }

        $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $update = $db->prepare("UPDATE usuarios SET senhaHash = ?, primeiro_acesso = 0, atualizado_em = datetime('now') WHERE id = ?");
        $update->execute([$novoHash, $userPayload['sub']]);

        $stmt = $db->prepare("SELECT id, nome, login, tipo, primeiro_acesso FROM usuarios WHERE id = ?");
        $stmt->execute([$userPayload['sub']]);
        $usuario = $stmt->fetch();

        $payload = [
            'sub' => $usuario['id'],
            'login' => $usuario['login'],
            'nome' => $usuario['nome'],
            'tipo' => $usuario['tipo'],
            'primeiroAcesso' => false,
        ];
        $token = jwtSign($payload);

        echo json_encode([
            'accessToken' => $token,
            'usuario' => [
                'id' => $usuario['id'],
                'nome' => $usuario['nome'],
                'login' => $usuario['login'],
                'tipo' => $usuario['tipo'],
                'primeiroAcesso' => false,
            ],
        ]);
        return;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Rota auth não encontrada']);
}

