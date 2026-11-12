<?php

function handleUsuariosRoutes(string $method, array $uriParts, ?array $body): void {
    $db = getDb();

    // GET /api/usuarios
    if ($method === 'GET' && count($uriParts) === 1) {
        requireAdmin();
        $tipo = $_GET['tipo'] ?? null;

        if ($tipo) {
            $stmt = $db->prepare("SELECT id, nome, login, tipo, primeiro_acesso FROM usuarios WHERE tipo = ? ORDER BY nome ASC");
            $stmt->execute([$tipo]);
        } else {
            $stmt = $db->prepare("SELECT id, nome, login, tipo, primeiro_acesso FROM usuarios ORDER BY nome ASC");
            $stmt->execute();
        }

        $usuarios = $stmt->fetchAll();
        $result = array_map(function ($u) {
            return [
                'id' => $u['id'],
                'nome' => $u['nome'],
                'login' => $u['login'],
                'tipo' => $u['tipo'],
                'primeiroAcesso' => (bool)$u['primeiro_acesso'],
            ];
        }, $usuarios);

        echo json_encode($result);
        return;
    }

    // POST /api/usuarios
    if ($method === 'POST' && count($uriParts) === 1) {
        requireAdmin();
        $nome = trim($body['nome'] ?? '');
        $login = trim($body['login'] ?? '');
        $senha = trim($body['senha'] ?? '');
        $tipo = trim($body['tipo'] ?? 'user');

        if (!$nome || !$login || strlen($senha) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Nome, login e senha (mínimo 6 caracteres) são obrigatórios']);
            return;
        }

        if ($tipo !== 'admin' && $tipo !== 'user') {
            $tipo = 'user';
        }

        $check = $db->prepare("SELECT id FROM usuarios WHERE login = ? LIMIT 1");
        $check->execute([$login]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['statusCode' => 409, 'message' => 'Este login já está em uso']);
            return;
        }

        $id = generateId();
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        $stmt = $db->prepare("INSERT INTO usuarios (id, nome, login, senhaHash, tipo, primeiro_acesso) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->execute([$id, $nome, $login, $senhaHash, $tipo]);

        echo json_encode([
            'id' => $id,
            'nome' => $nome,
            'login' => $login,
            'tipo' => $tipo,
            'primeiroAcesso' => true,
        ]);
        return;
    }

    // PATCH /api/usuarios/:id/resetar-senha
    if ($method === 'PATCH' && count($uriParts) === 3 && $uriParts[2] === 'resetar-senha') {
        requireAdmin();
        $usuarioId = $uriParts[1];
        $novaSenha = trim($body['novaSenha'] ?? '');

        if (strlen($novaSenha) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'A nova senha deve ter no mínimo 6 caracteres']);
            return;
        }

        $check = $db->prepare("SELECT id FROM usuarios WHERE id = ? LIMIT 1");
        $check->execute([$usuarioId]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['message' => 'Usuário não encontrado']);
            return;
        }

        $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $update = $db->prepare("UPDATE usuarios SET senhaHash = ?, primeiro_acesso = 1, atualizado_em = datetime('now') WHERE id = ?");
        $update->execute([$novoHash, $usuarioId]);

        echo json_encode(['message' => 'Senha resetada com sucesso. O usuário deverá alterá-la no próximo acesso.']);
        return;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Rota usuarios não encontrada']);
}

