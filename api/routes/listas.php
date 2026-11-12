<?php

function handleListasRoutes(string $method, array $uriParts, ?array $body): void {
    $db = getDb();
    $token = getBearerToken();
    $userPayload = jwtVerify($token);
    $usuarioId = $userPayload ? $userPayload['sub'] : null;
    $usuarioTipo = $userPayload ? ($userPayload['tipo'] ?? 'user') : null;

    // 1. GET /api/listas (Listar listas do usuário)
    if ($method === 'GET' && count($uriParts) === 1) {
        if (!$userPayload) {
            http_response_code(401);
            echo json_encode(['message' => 'Não autorizado']);
            return;
        }

        // Se for user comum: retorna todas as listas abertas
        if ($usuarioTipo === 'user') {
            $stmt = $db->query("SELECT * FROM listas ORDER BY criado_em DESC");
        } else {
            // Admin: listas que ele é dono OU administrador vinculado com podeLer = 1
            $stmt = $db->prepare("
                SELECT DISTINCT l.* FROM listas l
                LEFT JOIN listas_administradores la ON la.lista_id = l.id
                WHERE l.usuario_id = ? OR (la.usuario_id = ? AND la.podeLer = 1)
                ORDER BY l.criado_em DESC
            ");
            $stmt->execute([$usuarioId, $usuarioId]);
        }

        $listas = $stmt->fetchAll();
        $resultado = [];
        foreach ($listas as $l) {
            $resultado[] = formatarListaCompleta($db, $l, $usuarioId);
        }

        echo json_encode($resultado);
        return;
    }

    // 2. POST /api/listas (Criar nova lista - Admin apenas)
    if ($method === 'POST' && count($uriParts) === 1) {
        $usuario = requireAuth();
        if (($usuario['tipo'] ?? '') === 'user') {
            http_response_code(403);
            echo json_encode(['message' => 'Usuários do tipo padrão não possuem permissão para criar listas. Apenas administradores podem cadastrar listas.']);
            return;
        }

        $titulo = trim($body['titulo'] ?? '');
        $descricao = trim($body['descricao'] ?? '');

        if (!$titulo) {
            http_response_code(400);
            echo json_encode(['message' => 'Título é obrigatório']);
            return;
        }

        $id = generateId();
        $codigo = generateCode(6);

        // Garantir unicidade do código
        $check = $db->prepare("SELECT id FROM listas WHERE codigoCompartilhamento = ?");
        $check->execute([$codigo]);
        while ($check->fetch()) {
            $codigo = generateCode(6);
            $check->execute([$codigo]);
        }

        $insert = $db->prepare("
            INSERT INTO listas (id, titulo, descricao, tipo, codigoCompartilhamento, usuario_id)
            VALUES (?, ?, ?, 'QUEM_LEVA_O_QUE', ?, ?)
        ");
        $insert->execute([$id, $titulo, $descricao, $codigo, $usuario['sub']]);

        $stmt = $db->prepare("SELECT * FROM listas WHERE id = ?");
        $stmt->execute([$id]);
        $lista = $stmt->fetch();

        echo json_encode(formatarListaCompleta($db, $lista, $usuario['sub']));
        return;
    }

    $idOuCodigo = $uriParts[1] ?? '';
    if (!$idOuCodigo) {
        http_response_code(404);
        echo json_encode(['message' => 'Lista não informada']);
        return;
    }

    // Carregar a lista alvo
    $stmt = $db->prepare("SELECT * FROM listas WHERE id = ? OR codigoCompartilhamento = ? LIMIT 1");
    $stmt->execute([$idOuCodigo, $idOuCodigo]);
    $lista = $stmt->fetch();

    if (!$lista) {
        http_response_code(404);
        echo json_encode(['message' => 'Lista não encontrada']);
        return;
    }

    $listaId = $lista['id'];
    $permissoes = calcularPermissoesLista($db, $lista, $usuarioId);

    // 3. GET /api/listas/:idOuCodigo (Detalhes da lista - público ou autenticado)
    if ($method === 'GET' && count($uriParts) === 2) {
        echo json_encode(formatarListaCompleta($db, $lista, $usuarioId));
        return;
    }

    // 4. PATCH /api/listas/:idOuCodigo (Atualizar título / descrição)
    if ($method === 'PATCH' && count($uriParts) === 2) {
        if ($usuarioId && !$permissoes['podeEditarLista']) {
            http_response_code(403);
            echo json_encode(['message' => 'Você não tem permissão para editar as informações desta lista']);
            return;
        }

        $titulo = isset($body['titulo']) ? trim($body['titulo']) : $lista['titulo'];
        $descricao = isset($body['descricao']) ? trim($body['descricao']) : $lista['descricao'];

        $up = $db->prepare("UPDATE listas SET titulo = ?, descricao = ?, atualizado_em = datetime('now') WHERE id = ?");
        $up->execute([$titulo, $descricao, $listaId]);

        $stmt = $db->prepare("SELECT * FROM listas WHERE id = ?");
        $stmt->execute([$listaId]);
        echo json_encode(formatarListaCompleta($db, $stmt->fetch(), $usuarioId));
        return;
    }

    // 5. DELETE /api/listas/:idOuCodigo (Excluir lista - Criador/Dono)
    if ($method === 'DELETE' && count($uriParts) === 2) {
        requireAuth();
        if (!$permissoes['dono']) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas o criador da lista pode excluí-la']);
            return;
        }

        $del = $db->prepare("DELETE FROM listas WHERE id = ?");
        $del->execute([$listaId]);
        http_response_code(204);
        return;
    }

    // === SUB-ROTAS DE ITENS ===
    $sub1 = $uriParts[2] ?? '';

    // POST /api/listas/:idOuCodigo/itens (Adicionar item)
    if ($method === 'POST' && $sub1 === 'itens' && count($uriParts) === 3) {
        if ($usuarioId && !$permissoes['podeAdicionarItens']) {
            http_response_code(403);
            echo json_encode(['message' => 'Você não tem permissão para adicionar itens a esta lista']);
            return;
        }

        $descricao = trim($body['descricao'] ?? '');
        $quantidade = trim($body['quantidade'] ?? '1');
        $responsavelNome = !empty($body['responsavelNome']) ? trim($body['responsavelNome']) : null;

        if (!$descricao) {
            http_response_code(400);
            echo json_encode(['message' => 'Descrição do item é obrigatória']);
            return;
        }

        $itemId = generateId();
        $ins = $db->prepare("
            INSERT INTO itens_lista (id, lista_id, descricao, quantidade, responsavelNome, concluido)
            VALUES (?, ?, ?, ?, ?, 0)
        ");
        $ins->execute([$itemId, $listaId, $descricao, $quantidade ?: '1', $responsavelNome]);

        $itemStmt = $db->prepare("SELECT * FROM itens_lista WHERE id = ?");
        $itemStmt->execute([$itemId]);
        echo json_encode(formatarItem($itemStmt->fetch()));
        return;
    }

    // PATCH /api/listas/:idOuCodigo/itens/:itemId (Atualizar item)
    if ($method === 'PATCH' && $sub1 === 'itens' && count($uriParts) === 4) {
        $itemId = $uriParts[3];
        $itemStmt = $db->prepare("SELECT * FROM itens_lista WHERE id = ? AND lista_id = ?");
        $itemStmt->execute([$itemId, $listaId]);
        $item = $itemStmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode(['message' => 'Item não encontrado']);
            return;
        }

        $alterandoConteudo = isset($body['descricao']) || isset($body['quantidade']);
        if ($usuarioId && $alterandoConteudo && !$permissoes['podeEditarItens']) {
            http_response_code(403);
            echo json_encode(['message' => 'Você não tem permissão para editar os dados deste item']);
            return;
        }

        $respAntigo = $item['responsavelNome'];
        $qtdAntiga = $item['quantidade'];
        $descAntiga = $item['descricao'];

        $descricao = isset($body['descricao']) ? trim($body['descricao']) : $item['descricao'];
        $quantidade = isset($body['quantidade']) ? trim($body['quantidade']) : $item['quantidade'];
        $responsavelNome = array_key_exists('responsavelNome', $body) ? ($body['responsavelNome'] !== null ? trim($body['responsavelNome']) : null) : $item['responsavelNome'];
        $concluido = isset($body['concluido']) ? (int)(bool)$body['concluido'] : (int)$item['concluido'];

        $up = $db->prepare("
            UPDATE itens_lista
            SET descricao = ?, quantidade = ?, responsavelNome = ?, concluido = ?, atualizado_em = datetime('now')
            WHERE id = ?
        ");
        $up->execute([$descricao, $quantidade, $responsavelNome, $concluido, $itemId]);

        // Registrar no histórico de atividades
        if (!empty($body['historico']) && is_array($body['historico'])) {
            $h = $body['historico'];
            registrarHistoricoItem(
                $db,
                $listaId,
                $itemId,
                $h['descricao'] ?? $descricao,
                $h['tipo'] ?? 'atualizacao',
                $respAntigo,
                $responsavelNome,
                $qtdAntiga,
                $quantidade,
                $h['detalhes'] ?? 'Item atualizado'
            );
        } else {
            $teveMudancaResp = ($respAntigo !== $responsavelNome);
            $teveMudancaQtd = ($qtdAntiga !== $quantidade);

            if ($teveMudancaResp || $teveMudancaQtd) {
                if (empty($respAntigo) && !empty($responsavelNome)) {
                    $tipoAcao = 'marcou';
                    $detalhes = "{$responsavelNome} marcou este item ({$quantidade} un)";
                } elseif (!empty($respAntigo) && empty($responsavelNome)) {
                    $tipoAcao = 'liberou';
                    $detalhes = "{$respAntigo} deixou o item sem ninguém";
                } elseif (!empty($responsavelNome) && $teveMudancaQtd && !$teveMudancaResp) {
                    $tipoAcao = 'alterou_quantidade';
                    $detalhes = "{$responsavelNome} alterou a quantidade de {$qtdAntiga} para {$quantidade}";
                } elseif ($teveMudancaResp && !empty($respAntigo) && !empty($responsavelNome)) {
                    $tipoAcao = 'alterou_responsavel';
                    $detalhes = "Responsável alterado de {$respAntigo} para {$responsavelNome}";
                } else {
                    $tipoAcao = 'alterou';
                    $detalhes = "Item atualizado";
                }

                registrarHistoricoItem(
                    $db,
                    $listaId,
                    $itemId,
                    $descricao,
                    $tipoAcao,
                    $respAntigo,
                    $responsavelNome,
                    $qtdAntiga,
                    $quantidade,
                    $detalhes
                );
            }
        }

        $itemStmt->execute([$itemId, $listaId]);
        echo json_encode(formatarItem($itemStmt->fetch()));
        return;
    }

    // DELETE /api/listas/:idOuCodigo/itens/:itemId (Remover item)
    if ($method === 'DELETE' && $sub1 === 'itens' && count($uriParts) === 4) {
        $itemId = $uriParts[3];
        if ($usuarioId && !$permissoes['podeRemoverItens']) {
            http_response_code(403);
            echo json_encode(['message' => 'Você não tem permissão para remover itens desta lista']);
            return;
        }

        $del = $db->prepare("DELETE FROM itens_lista WHERE id = ? AND lista_id = ?");
        $del->execute([$itemId, $listaId]);
        http_response_code(204);
        return;
    }

    // === SUB-ROTAS DE ADMINISTRADORES ===
    // GET /api/listas/:idOuCodigo/administradores
    if ($method === 'GET' && $sub1 === 'administradores' && count($uriParts) === 3) {
        requireAuth();
        $stmt = $db->prepare("
            SELECT la.*, u.nome as usuario_nome, u.login as usuario_login, u.tipo as usuario_tipo
            FROM listas_administradores la
            JOIN usuarios u ON u.id = la.usuario_id
            WHERE la.lista_id = ?
            ORDER BY u.nome ASC
        ");
        $stmt->execute([$listaId]);
        $rows = $stmt->fetchAll();

        $admins = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'listaId' => $r['lista_id'],
                'usuarioId' => $r['usuario_id'],
                'podeLer' => (bool)$r['podeLer'],
                'podeEditarLista' => (bool)$r['podeEditarLista'],
                'podeAdicionarItens' => (bool)$r['podeAdicionarItens'],
                'podeEditarItens' => (bool)$r['podeEditarItens'],
                'podeRemoverItens' => (bool)$r['podeRemoverItens'],
                'criadoEm' => $r['criado_em'],
                'usuario' => [
                    'id' => $r['usuario_id'],
                    'nome' => $r['usuario_nome'],
                    'login' => $r['usuario_login'],
                    'tipo' => $r['usuario_tipo'],
                ],
            ];
        }, $rows);

        echo json_encode($admins);
        return;
    }

    // POST /api/listas/:idOuCodigo/administradores
    if ($method === 'POST' && $sub1 === 'administradores' && count($uriParts) === 3) {
        requireAuth();
        if (!$permissoes['dono']) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas o dono da lista pode vincular administradores']);
            return;
        }

        $usuarioIdAlvo = trim($body['usuarioId'] ?? '');
        if (!$usuarioIdAlvo) {
            http_response_code(400);
            echo json_encode(['message' => 'usuarioId é obrigatório']);
            return;
        }

        // Verificar se usuário existe
        $uStmt = $db->prepare("SELECT id, nome, login, tipo FROM usuarios WHERE id = ?");
        $uStmt->execute([$usuarioIdAlvo]);
        $targetUser = $uStmt->fetch();
        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['message' => 'Usuário não encontrado']);
            return;
        }

        $id = generateId();
        $podeLer = isset($body['podeLer']) ? (int)(bool)$body['podeLer'] : 1;
        $podeEditarLista = isset($body['podeEditarLista']) ? (int)(bool)$body['podeEditarLista'] : 0;
        $podeAdicionarItens = isset($body['podeAdicionarItens']) ? (int)(bool)$body['podeAdicionarItens'] : 0;
        $podeEditarItens = isset($body['podeEditarItens']) ? (int)(bool)$body['podeEditarItens'] : 0;
        $podeRemoverItens = isset($body['podeRemoverItens']) ? (int)(bool)$body['podeRemoverItens'] : 0;

        $ins = $db->prepare("
            INSERT INTO listas_administradores (id, lista_id, usuario_id, podeLer, podeEditarLista, podeAdicionarItens, podeEditarItens, podeRemoverItens)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $ins->execute([$id, $listaId, $usuarioIdAlvo, $podeLer, $podeEditarLista, $podeAdicionarItens, $podeEditarItens, $podeRemoverItens]);

        echo json_encode([
            'id' => $id,
            'listaId' => $listaId,
            'usuarioId' => $usuarioIdAlvo,
            'podeLer' => (bool)$podeLer,
            'podeEditarLista' => (bool)$podeEditarLista,
            'podeAdicionarItens' => (bool)$podeAdicionarItens,
            'podeEditarItens' => (bool)$podeEditarItens,
            'podeRemoverItens' => (bool)$podeRemoverItens,
            'usuario' => $targetUser,
        ]);
        return;
    }

    // PATCH /api/listas/:idOuCodigo/administradores/:usuarioId
    if ($method === 'PATCH' && $sub1 === 'administradores' && count($uriParts) === 4) {
        requireAuth();
        if (!$permissoes['dono']) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas o dono da lista pode editar permissões de administradores']);
            return;
        }

        $usuarioIdAlvo = $uriParts[3];
        $chk = $db->prepare("SELECT * FROM listas_administradores WHERE lista_id = ? AND usuario_id = ?");
        $chk->execute([$listaId, $usuarioIdAlvo]);
        $row = $chk->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Vínculo de administrador não encontrado']);
            return;
        }

        $podeLer = isset($body['podeLer']) ? (int)(bool)$body['podeLer'] : (int)$row['podeLer'];
        $podeEditarLista = isset($body['podeEditarLista']) ? (int)(bool)$body['podeEditarLista'] : (int)$row['podeEditarLista'];
        $podeAdicionarItens = isset($body['podeAdicionarItens']) ? (int)(bool)$body['podeAdicionarItens'] : (int)$row['podeAdicionarItens'];
        $podeEditarItens = isset($body['podeEditarItens']) ? (int)(bool)$body['podeEditarItens'] : (int)$row['podeEditarItens'];
        $podeRemoverItens = isset($body['podeRemoverItens']) ? (int)(bool)$body['podeRemoverItens'] : (int)$row['podeRemoverItens'];

        $up = $db->prepare("
            UPDATE listas_administradores
            SET podeLer = ?, podeEditarLista = ?, podeAdicionarItens = ?, podeEditarItens = ?, podeRemoverItens = ?, atualizado_em = datetime('now')
            WHERE lista_id = ? AND usuario_id = ?
        ");
        $up->execute([$podeLer, $podeEditarLista, $podeAdicionarItens, $podeEditarItens, $podeRemoverItens, $listaId, $usuarioIdAlvo]);

        $uStmt = $db->prepare("SELECT id, nome, login, tipo FROM usuarios WHERE id = ?");
        $uStmt->execute([$usuarioIdAlvo]);

        echo json_encode([
            'id' => $row['id'],
            'listaId' => $listaId,
            'usuarioId' => $usuarioIdAlvo,
            'podeLer' => (bool)$podeLer,
            'podeEditarLista' => (bool)$podeEditarLista,
            'podeAdicionarItens' => (bool)$podeAdicionarItens,
            'podeEditarItens' => (bool)$podeEditarItens,
            'podeRemoverItens' => (bool)$podeRemoverItens,
            'usuario' => $uStmt->fetch(),
        ]);
        return;
    }

    // DELETE /api/listas/:idOuCodigo/administradores/:usuarioId
    if ($method === 'DELETE' && $sub1 === 'administradores' && count($uriParts) === 4) {
        requireAuth();
        if (!$permissoes['dono']) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas o dono da lista pode remover administradores vinculados']);
            return;
        }

        $usuarioIdAlvo = $uriParts[3];
        $del = $db->prepare("DELETE FROM listas_administradores WHERE lista_id = ? AND usuario_id = ?");
        $del->execute([$listaId, $usuarioIdAlvo]);
        http_response_code(204);
        return;
    }

    // === SUB-ROTAS DE HISTÓRICO ===
    // GET /api/listas/:idOuCodigo/historico (Apenas administradores da lista ou do sistema)
    if ($method === 'GET' && $sub1 === 'historico' && count($uriParts) === 3) {
        $ehAdmin = ($usuarioTipo === 'admin') || $permissoes['dono'] || $permissoes['podeEditarItens'] || $permissoes['podeEditarLista'];
        if (!$ehAdmin) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas administradores podem visualizar o histórico desta lista']);
            return;
        }

        $stmtHist = $db->prepare("
            SELECT * FROM historico_itens 
            WHERE lista_id = ? 
            ORDER BY criado_em DESC 
            LIMIT 200
        ");
        $stmtHist->execute([$listaId]);
        $rows = $stmtHist->fetchAll();

        $historico = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'listaId' => $r['lista_id'],
                'itemId' => $r['item_id'],
                'itemDescricao' => $r['item_descricao'],
                'tipoAcao' => $r['tipo_acao'],
                'responsavelAntigo' => $r['responsavel_antigo'],
                'responsavelNovo' => $r['responsavel_novo'],
                'quantidadeAntiga' => $r['quantidade_antiga'],
                'quantidadeNova' => $r['quantidade_nova'],
                'detalhes' => $r['detalhes'],
                'criadoEm' => $r['criado_em'],
            ];
        }, $rows);

        echo json_encode($historico);
        return;
    }

    // POST /api/listas/:idOuCodigo/historico (Registrar ação de histórico)
    if ($method === 'POST' && $sub1 === 'historico' && count($uriParts) === 3) {
        $itemDescricao = trim($body['descricao'] ?? 'Item');
        $tipoAcao = trim($body['tipo'] ?? 'atividade');
        $detalhes = trim($body['detalhes'] ?? '');
        $respAntigo = $body['responsavelAntigo'] ?? null;
        $respNovo = $body['responsavelNovo'] ?? null;
        $qtdAntiga = $body['quantidadeAntiga'] ?? null;
        $qtdNova = $body['quantidadeNova'] ?? null;
        $itemId = $body['itemId'] ?? null;

        if (!empty($detalhes)) {
            registrarHistoricoItem(
                $db,
                $listaId,
                $itemId,
                $itemDescricao,
                $tipoAcao,
                $respAntigo,
                $respNovo,
                $qtdAntiga,
                $qtdNova,
                $detalhes
            );
        }

        echo json_encode(['success' => true]);
        return;
    }

    // DELETE /api/listas/:idOuCodigo/historico (Limpar histórico)
    if ($method === 'DELETE' && $sub1 === 'historico' && count($uriParts) === 3) {
        $ehDonoOuAdmin = ($usuarioTipo === 'admin') || $permissoes['dono'] || $permissoes['podeEditarLista'];
        if (!$ehDonoOuAdmin) {
            http_response_code(403);
            echo json_encode(['message' => 'Apenas o dono da lista pode limpar o histórico']);
            return;
        }

        $del = $db->prepare("DELETE FROM historico_itens WHERE lista_id = ?");
        $del->execute([$listaId]);
        http_response_code(204);
        return;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Rota lista não encontrada']);
}

function registrarHistoricoItem(
    PDO $db,
    string $listaId,
    ?string $itemId,
    string $itemDescricao,
    string $tipoAcao,
    ?string $responsavelAntigo,
    ?string $responsavelNovo,
    ?string $qtdAntiga,
    ?string $qtdNova,
    string $detalhes
): void {
    try {
        $id = generateId();
        $stmt = $db->prepare("
            INSERT INTO historico_itens (
                id, lista_id, item_id, item_descricao, tipo_acao,
                responsavel_antigo, responsavel_novo, quantidade_antiga, quantidade_nova, detalhes, criado_em
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $stmt->execute([
            $id,
            $listaId,
            $itemId,
            $itemDescricao,
            $tipoAcao,
            $responsavelAntigo,
            $responsavelNovo,
            $qtdAntiga,
            $qtdNova,
            $detalhes,
        ]);
    } catch (Throwable $e) {
        error_log("Erro ao registrar historico: " . $e->getMessage());
    }
}

function calcularPermissoesLista(PDO $db, array $lista, ?string $usuarioId): array {
    if (!$usuarioId) {
        return [
            'dono' => false,
            'podeLer' => true,
            'podeEditarLista' => false,
            'podeAdicionarItens' => true,
            'podeEditarItens' => false,
            'podeRemoverItens' => false,
        ];
    }

    if ($lista['usuario_id'] === $usuarioId) {
        return [
            'dono' => true,
            'podeLer' => true,
            'podeEditarLista' => true,
            'podeAdicionarItens' => true,
            'podeEditarItens' => true,
            'podeRemoverItens' => true,
        ];
    }

    $stmt = $db->prepare("SELECT * FROM listas_administradores WHERE lista_id = ? AND usuario_id = ? LIMIT 1");
    $stmt->execute([$lista['id'], $usuarioId]);
    $vinculo = $stmt->fetch();

    if ($vinculo) {
        return [
            'dono' => false,
            'podeLer' => (bool)$vinculo['podeLer'],
            'podeEditarLista' => (bool)$vinculo['podeEditarLista'],
            'podeAdicionarItens' => (bool)$vinculo['podeAdicionarItens'],
            'podeEditarItens' => (bool)$vinculo['podeEditarItens'],
            'podeRemoverItens' => (bool)$vinculo['podeRemoverItens'],
        ];
    }

    return [
        'dono' => false,
        'podeLer' => true,
        'podeEditarLista' => false,
        'podeAdicionarItens' => false,
        'podeEditarItens' => false,
        'podeRemoverItens' => false,
    ];
}

function formatarListaCompleta(PDO $db, array $lista, ?string $usuarioId): array {
    $listaId = $lista['id'];

    // Buscar itens (mantém no topo os itens sem responsável)
    $stmtItens = $db->prepare("
        SELECT * FROM itens_lista 
        WHERE lista_id = ? 
        ORDER BY (CASE WHEN responsavelNome IS NULL OR TRIM(responsavelNome) = '' THEN 0 ELSE 1 END) ASC, criado_em ASC
    ");
    $stmtItens->execute([$listaId]);
    $itensRows = $stmtItens->fetchAll();

    $itens = array_map('formatarItem', $itensRows);

    // Buscar administradores
    $stmtAdmins = $db->prepare("
        SELECT la.*, u.nome as usuario_nome, u.login as usuario_login, u.tipo as usuario_tipo
        FROM listas_administradores la
        JOIN usuarios u ON u.id = la.usuario_id
        WHERE la.lista_id = ?
    ");
    $stmtAdmins->execute([$listaId]);
    $adminsRows = $stmtAdmins->fetchAll();

    $administradores = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'listaId' => $r['lista_id'],
            'usuarioId' => $r['usuario_id'],
            'podeLer' => (bool)$r['podeLer'],
            'podeEditarLista' => (bool)$r['podeEditarLista'],
            'podeAdicionarItens' => (bool)$r['podeAdicionarItens'],
            'podeEditarItens' => (bool)$r['podeEditarItens'],
            'podeRemoverItens' => (bool)$r['podeRemoverItens'],
            'usuario' => [
                'id' => $r['usuario_id'],
                'nome' => $r['usuario_nome'],
                'login' => $r['usuario_login'],
                'tipo' => $r['usuario_tipo'],
            ],
        ];
    }, $adminsRows);

    $permissoes = calcularPermissoesLista($db, $lista, $usuarioId);

    return [
        'id' => $lista['id'],
        'titulo' => $lista['titulo'],
        'descricao' => $lista['descricao'],
        'tipo' => $lista['tipo'],
        'codigoCompartilhamento' => $lista['codigoCompartilhamento'],
        'usuarioId' => $lista['usuario_id'],
        'criadoEm' => $lista['criado_em'],
        'atualizadoEm' => $lista['atualizado_em'],
        'itens' => $itens,
        'administradores' => $administradores,
        'permissoes' => $permissoes,
    ];
}

function formatarItem(array $item): array {
    return [
        'id' => $item['id'],
        'listaId' => $item['lista_id'],
        'descricao' => $item['descricao'],
        'quantidade' => $item['quantidade'],
        'responsavelNome' => $item['responsavelNome'],
        'concluido' => (bool)$item['concluido'],
        'criadoEm' => $item['criado_em'],
        'atualizadoEm' => $item['atualizado_em'],
    ];
}

