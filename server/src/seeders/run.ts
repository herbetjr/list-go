import AppDataSource from '../data-source';
import { runSeeders } from './index';

async function main() {
  await AppDataSource.initialize();
  console.log('Executando seeders...');
  await runSeeders(AppDataSource);
  await AppDataSource.destroy();
  console.log('Seeders finalizados com sucesso.');
}

main().catch((err) => {
  console.error('Erro ao executar seeders:', err);
  process.exit(1);
});

