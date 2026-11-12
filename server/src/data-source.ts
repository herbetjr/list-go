import { DataSource, DataSourceOptions } from 'typeorm';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Usuario } from './models/usuario.model';
import { Lista } from './models/lista.model';
import { ItemLista } from './models/item-lista.model';
import { ListaAdministrador } from './models/lista-administrador.model';

const baseDir = existsSync(join(__dirname, '..', 'data'))
  ? join(__dirname, '..')
  : existsSync(join(process.cwd(), 'data'))
  ? process.cwd()
  : join(__dirname, '..');

const dbPath = process.env.DB_PATH ?? join(baseDir, 'data', 'lista-go.sqlite');
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: dbPath,
  entities: [Usuario, Lista, ItemLista, ListaAdministrador],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  migrationsRun: true,
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
