<?php
// share.php - Retorna o SPA com meta tags Open Graph dinâmicas para WhatsApp e redes sociais

$codigo = trim($_GET['codigo'] ?? '');
$titulo = 'Listas Compartilhadas';
$descricao = 'Colabore e marque o que você vai levar!';

if (!empty($codigo)) {
    try {
        $dbPath = __DIR__ . '/data/database.sqlite';
        if (file_exists($dbPath)) {
            $db = new PDO("sqlite:" . $dbPath);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $db->prepare("SELECT titulo, descricao FROM listas WHERE codigoCompartilhamento = ? OR id = ? LIMIT 1");
            $stmt->execute([$codigo, $codigo]);
            $lista = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($lista && !empty($lista['titulo'])) {
                $titulo = $lista['titulo'];
                if (!empty($lista['descricao'])) {
                    $descricao = $lista['descricao'];
                } else {
                    $descricao = "Colabore com a lista \"{$titulo}\" e marque o que você vai levar!";
                }
            }
        }
    } catch (Throwable $e) {
        // Fallback silencioso para o título padrão
    }
}

// Ler o index.html compilado do SPA
$indexPath = __DIR__ . '/index.html';
if (!file_exists($indexPath)) {
    echo "Aplicação não encontrada.";
    exit;
}

$html = file_get_contents($indexPath);

// Escapar para exibição segura em atributos HTML
$tituloHtml = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
$descricaoHtml = htmlspecialchars($descricao, ENT_QUOTES, 'UTF-8');

// Injetar tags Open Graph e substituir título
$tagsSocial = '
    <title>' . $tituloHtml . '</title>
    <meta property="og:title" content="' . $tituloHtml . '" />
    <meta property="og:description" content="' . $descricaoHtml . '" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Listas Compartilhadas" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="' . $tituloHtml . '" />
    <meta name="twitter:description" content="' . $descricaoHtml . '" />
    <meta name="description" content="' . $descricaoHtml . '" />';

$html = preg_replace('/<title>.*?<\/title>/i', $tagsSocial, $html, 1);

header('Content-Type: text/html; charset=UTF-8');
echo $html;
exit;

