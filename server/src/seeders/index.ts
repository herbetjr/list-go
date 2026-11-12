import { DataSource } from 'typeorm';
import { Usuario } from '../models/usuario.model';
import { hashSenha } from '../utils/senha.util';

export async function runSeeders(dataSource: DataSource) {
  const usuarioRepo = dataSource.getRepository(Usuario);

  let admin = await usuarioRepo.findOne({ where: { login: 'admin' } });
  if (!admin) {
    admin = usuarioRepo.create({
      nome: 'Administrador',
      login: 'admin',
      senhaHash: hashSenha('admin123'),
      tipo: 'admin',
    });
    admin = await usuarioRepo.save(admin);
    console.log('Seeder: Usuário padrão admin criado com sucesso.');
  } else if (admin.tipo !== 'admin') {
    admin.tipo = 'admin';
    await usuarioRepo.save(admin);
  }
}


