<?php

function getDb(): PDO {
    static $db = null;
    if ($db !== null) {
        return $db;
    }

    $dbDir = __DIR__ . '/../data';
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0755, true);
    }

    $dbPath = $dbDir . '/lista-go.sqlite';
    $isNew = !file_exists($dbPath) || filesize($dbPath) === 0;

    $db = new PDO("sqlite:" . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Habilitar foreign keys no SQLite
    $db->exec("PRAGMA foreign_keys = ON;");

    // Executa schema e migrations automaticamente
    executarMigrations($db, $isNew);

    return $db;
}

function executarMigrations(PDO $db, bool $isNew): void {
    // 1. Criar tabelas se não existirem
    $db->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR PRIMARY KEY NOT NULL,
            nome VARCHAR(150) NOT NULL,
            login VARCHAR(100) NOT NULL UNIQUE,
            senhaHash VARCHAR(255) NOT NULL,
            tipo VARCHAR(20) NOT NULL DEFAULT 'user',
            primeiro_acesso BOOLEAN NOT NULL DEFAULT 1,
            criado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            atualizado_em DATETIME NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS listas (
            id VARCHAR PRIMARY KEY NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            descricao VARCHAR(500),
            tipo VARCHAR(50) NOT NULL DEFAULT 'QUEM_LEVA_O_QUE',
            codigoCompartilhamento VARCHAR(20) NOT NULL UNIQUE,
            usuario_id VARCHAR,
            criado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            atualizado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS itens_lista (
            id VARCHAR PRIMARY KEY NOT NULL,
            lista_id VARCHAR NOT NULL,
            descricao VARCHAR(250) NOT NULL,
            quantidade VARCHAR(50) NOT NULL DEFAULT '1',
            responsavelNome VARCHAR(150),
            concluido BOOLEAN NOT NULL DEFAULT 0,
            criado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            atualizado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (lista_id) REFERENCES listas (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS listas_administradores (
            id VARCHAR PRIMARY KEY NOT NULL,
            lista_id VARCHAR NOT NULL,
            usuario_id VARCHAR NOT NULL,
            podeLer BOOLEAN NOT NULL DEFAULT 1,
            podeEditarLista BOOLEAN NOT NULL DEFAULT 0,
            podeAdicionarItens BOOLEAN NOT NULL DEFAULT 0,
            podeEditarItens BOOLEAN NOT NULL DEFAULT 0,
            podeRemoverItens BOOLEAN NOT NULL DEFAULT 0,
            criado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            atualizado_em DATETIME NOT NULL DEFAULT (datetime('now')),
            UNIQUE(lista_id, usuario_id),
            FOREIGN KEY (lista_id) REFERENCES listas (id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
        );
    ");

    // 2. Se o banco já existia, garantir que colunas adicionadas em migrations posteriores existam
    if (!$isNew) {
        $colsUsuarios = obterColunasTabela($db, 'usuarios');
        if (!in_array('tipo', $colsUsuarios)) {
            $db->exec("ALTER TABLE usuarios ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'user'");
        }
        if (!in_array('primeiro_acesso', $colsUsuarios)) {
            $db->exec("ALTER TABLE usuarios ADD COLUMN primeiro_acesso BOOLEAN NOT NULL DEFAULT 1");
        }

        $colsListas = obterColunasTabela($db, 'listas');
        if (!in_array('tipo', $colsListas)) {
            $db->exec("ALTER TABLE listas ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'QUEM_LEVA_O_QUE'");
        }
        if (!in_array('codigoCompartilhamento', $colsListas)) {
            $db->exec("ALTER TABLE listas ADD COLUMN codigoCompartilhamento VARCHAR(20)");
        }
        if (!in_array('atualizado_em', $colsListas)) {
            $db->exec("ALTER TABLE listas ADD COLUMN atualizado_em DATETIME DEFAULT (datetime('now'))");
        }

        $colsItens = obterColunasTabela($db, 'itens_lista');
        if (!in_array('atualizado_em', $colsItens)) {
            $db->exec("ALTER TABLE itens_lista ADD COLUMN atualizado_em DATETIME DEFAULT (datetime('now'))");
        }
    }

    // 3. Garantir criação do admin padrão se não houver nenhum admin
    $stmt = $db->prepare("SELECT id FROM usuarios WHERE login = 'admin' LIMIT 1");
    $stmt->execute();
    $admin = $stmt->fetch();

    if (!$admin) {
        $id = generateId();
        $senhaHash = password_hash('admin123', PASSWORD_DEFAULT);
        $insert = $db->prepare("INSERT INTO usuarios (id, nome, login, senhaHash, tipo, primeiro_acesso) VALUES (?, 'Administrador', 'admin', ?, 'admin', 0)");
        $insert->execute([$id, $senhaHash]);
    }
}

function obterColunasTabela(PDO $db, string $tabela): array {
    $stmt = $db->query("PRAGMA table_info(" . $tabela . ")");
    $colunas = [];
    while ($row = $stmt->fetch()) {
        $colunas[] = $row['name'];
    }
    return $colunas;
}

function generateId(): string {
    return bin2hex(random_bytes(10));
}

function generateCode(int $length = 6): string {
    $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

