import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const prebuildsDir = path.join(process.cwd(), 'scripts', 'prebuilds');
if (!fs.existsSync(prebuildsDir)) {
  fs.mkdirSync(prebuildsDir, { recursive: true });
}

const targets = [
  {
    abi: 'v127',
    label: 'Node 22 (ABI 127)',
    url: 'https://github.com/WiseLibs/better-sqlite3/releases/download/v12.11.1/better-sqlite3-v12.11.1-node-v127-linux-x64.tar.gz',
    filename: 'better_sqlite3.node-v127-linux-x64',
  },
  {
    abi: 'v115',
    label: 'Node 20 (ABI 115)',
    url: 'https://github.com/WiseLibs/better-sqlite3/releases/download/v11.8.1/better-sqlite3-v11.8.1-node-v115-linux-x64.tar.gz',
    filename: 'better_sqlite3.node-v115-linux-x64',
  },
  {
    abi: 'v108',
    label: 'Node 18 (ABI 108)',
    url: 'https://github.com/WiseLibs/better-sqlite3/releases/download/v11.8.1/better-sqlite3-v11.8.1-node-v108-linux-x64.tar.gz',
    filename: 'better_sqlite3.node-v108-linux-x64',
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Falha no download (${res.statusCode}): ${targetUrl}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    };
    request(url);
  });
}

export async function ensurePrebuilds() {
  console.log('--- Verificando binários pré-compilados do SQLite para Linux x64 (cPanel) ---');
  for (const t of targets) {
    const finalPath = path.join(prebuildsDir, t.filename);
    if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1000000) {
      console.log(`✓ Binário ${t.label} já em cache.`);
      continue;
    }

    console.log(`Baixando binário ${t.label}...`);
    const tempTar = path.join(prebuildsDir, `temp-${t.abi}.tar.gz`);
    const tempExtract = path.join(prebuildsDir, `extract-${t.abi}`);
    try {
      await downloadFile(t.url, tempTar);
      if (!fs.existsSync(tempExtract)) {
        fs.mkdirSync(tempExtract, { recursive: true });
      }
      execSync(`tar -xzf "${tempTar}" -C "${tempExtract}"`);
      const extractedNode = path.join(tempExtract, 'build', 'Release', 'better_sqlite3.node');
      if (fs.existsSync(extractedNode)) {
        fs.copyFileSync(extractedNode, finalPath);
        console.log(`✓ Binário ${t.label} pronto: ${t.filename}`);
      } else {
        console.warn(`! Não foi possível localizar better_sqlite3.node em ${tempExtract}`);
      }
    } catch (err) {
      console.warn(`! Erro ao obter binário ${t.label}:`, err.message);
    } finally {
      if (fs.existsSync(tempTar)) fs.rmSync(tempTar, { force: true });
      if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true });
    }
  }

  // Também salvar o binário do Windows local para prebuilds-bin
  const localWinNode = path.join(process.cwd(), 'server', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  const winDest = path.join(prebuildsDir, 'better_sqlite3.node-win32-x64');
  if (fs.existsSync(localWinNode)) {
    fs.copyFileSync(localWinNode, winDest);
    console.log(`✓ Binário do Windows local incluído em cache.`);
  }
}

// Se chamado diretamente
if (process.argv[1]?.endsWith('fetch-linux-sqlite.js')) {
  ensurePrebuilds();
}

