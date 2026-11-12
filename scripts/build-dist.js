import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const spaDir = path.join(distDir, 'spa');
const clientDest = path.join(distDir, 'client');
const apiSrc = path.join(rootDir, 'api');
const apiDest = path.join(distDir, 'api');
const dataDest = path.join(distDir, 'data');
const htaccessPath = path.join(distDir, '.htaccess');
const zipPath = path.join(rootDir, 'dist.zip');

async function main() {
  console.log('\n======================================================');
  console.log('--- Construindo Pacote PHP + SPA para cPanel ---');
  console.log('======================================================\n');

  // 1. Organizar Frontend SPA diretamente na raiz de dist/
  if (fs.existsSync(spaDir)) {
    const spaFiles = fs.readdirSync(spaDir);
    for (const file of spaFiles) {
      const srcPath = path.join(spaDir, file);
      const destPath = path.join(distDir, file);
      fs.rmSync(destPath, { recursive: true, force: true });
      fs.cpSync(srcPath, destPath, { recursive: true });
    }
    fs.rmSync(spaDir, { recursive: true, force: true });
    if (fs.existsSync(clientDest)) {
      fs.rmSync(clientDest, { recursive: true, force: true });
    }
    console.log('✓ Frontend Quasar (index.html e assets/) posicionado na raiz de dist/');
  } else {
    console.log('✓ Frontend existente mantido na raiz de dist/');
  }

  // 2. Limpar resquícios anteriores de Node.js (não mais necessários)
  const nodeFilesToRemove = [
    path.join(distDir, 'node_modules'),
    path.join(distDir, 'server'),
    path.join(distDir, 'app.js'),
    path.join(distDir, 'package.json'),
    path.join(distDir, 'startup-error.log'),
  ];
  for (const item of nodeFilesToRemove) {
    if (fs.existsSync(item)) {
      fs.rmSync(item, { recursive: true, force: true });
    }
  }

  // 3. Copiar API PHP para dist/api
  if (fs.existsSync(apiSrc)) {
    fs.rmSync(apiDest, { recursive: true, force: true });
    fs.cpSync(apiSrc, apiDest, { recursive: true });
    console.log('✓ Backend PHP nativo posicionado em dist/api');
  }

  // 4. Garantir pasta dist/data protegida (NUNCA incluir arquivo de banco de dados no build)
  if (!fs.existsSync(dataDest)) {
    fs.mkdirSync(dataDest, { recursive: true });
  }

  // Remove qualquer arquivo de banco pré-existente da pasta dist/data
  const dataFiles = fs.readdirSync(dataDest);
  for (const file of dataFiles) {
    if (file !== '.htaccess') {
      fs.rmSync(path.join(dataDest, file), { recursive: true, force: true });
    }
  }

  const dataHtaccess = `# Proteger arquivos do banco de dados SQLite
<Files "*">
  Order allow,deny
  Deny from all
</Files>
Require all denied
`;
  fs.writeFileSync(path.join(dataDest, '.htaccess'), dataHtaccess, 'utf-8');
  console.log('✓ Pasta dist/data protegida (sem banco embutido - o SQLite será criado e migrado automaticamente no servidor)');

  // 5. Copiar share.php para a raiz de dist/ (Para Open Graph dinâmico no WhatsApp/redes sociais)
  const shareSrc = path.join(rootDir, 'share.php');
  if (fs.existsSync(shareSrc)) {
    fs.cpSync(shareSrc, path.join(distDir, 'share.php'));
    console.log('✓ Script share.php posicionado na raiz de dist/');
  }

  // 6. Gerar .htaccess da raiz (Roteador Apache para PHP e SPA)
  const rootHtaccess = `# Configuração Apache para API PHP + Frontend SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Requisições da API vão diretamente para a API PHP
  RewriteRule ^api/(.*)$ api/index.php [QSA,L]
  RewriteRule ^api$ api/index.php [QSA,L]

  # 2. Servir arquivos estáticos físicos existentes (JS, CSS, imagens, etc.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Rota de compartilhamento: serve HTML com Open Graph dinâmico para WhatsApp e redes sociais
  RewriteRule ^lista/([a-zA-Z0-9_-]+)/?$ share.php?codigo=$1 [QSA,L]

  # 4. Todas as demais rotas são páginas do SPA Quasar (Vue Router)
  RewriteRule ^ index.html [L]
</IfModule>

# Desabilitar listagem de diretórios
Options -Indexes
`;
  fs.writeFileSync(htaccessPath, rootHtaccess, 'utf-8');
  console.log('✓ Arquivo dist/.htaccess configurado (API PHP + SPA + Open Graph)');

  // 7. Gerar arquivo dist.zip leve (< 2MB)
  console.log('\n--- Gerando dist.zip ---');
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  const distZipInside = path.join(distDir, 'dist.zip');
  if (fs.existsSync(distZipInside)) {
    fs.rmSync(distZipInside, { force: true });
  }

  execSync(`tar -a -c -f "${zipPath}" -C "${distDir}" .`, { stdio: 'inherit' });
  const stats = fs.statSync(zipPath);
  console.log(`✓ Arquivo dist.zip gerado com sucesso! Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n======================================================');
  console.log('PACOTE PHP + SPA PRONTO PARA O CPANEL!');
  console.log('======================================================');
  console.log('Passos no cPanel:');
  console.log('  1. No cPanel, você pode EXCLUIR ou DESATIVAR a aplicação Node.js (não é mais necessária!).');
  console.log('  2. No Gerenciador de Arquivos, limpe a pasta do subdomínio.');
  console.log('  3. Envie o "dist.zip" e clique em "Extrair" (Extract).');
  console.log('  4. Pronto! O PHP e o SQLite rodam nativamente sem instalar nada!');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
