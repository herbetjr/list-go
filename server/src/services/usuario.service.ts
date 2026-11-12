import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../models/usuario.model';
import { CriarUsuarioDto, ResetarSenhaDto } from '../dtos/usuario.dto';
import { hashSenha } from '../utils/senha.util';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async criarUsuarioPorAdmin(
    dto: CriarUsuarioDto,
    usuarioLogado: { id: string; tipo: string },
  ) {
    if (usuarioLogado.tipo !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem cadastrar novos usuários');
    }

    const existente = await this.usuarioRepo.findOne({
      where: { login: dto.login },
    });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este login');
    }

    const novo = this.usuarioRepo.create({
      nome: dto.nome.trim(),
      login: dto.login.trim(),
      senhaHash: hashSenha(dto.senha),
      tipo: dto.tipo || 'admin',
      primeiroAcesso: true,
    });

    const salvo = await this.usuarioRepo.save(novo);

    return {
      id: salvo.id,
      nome: salvo.nome,
      login: salvo.login,
      tipo: salvo.tipo,
      primeiroAcesso: salvo.primeiroAcesso,
      criadoEm: salvo.criadoEm,
    };
  }

  async listarUsuarios(tipo?: 'admin' | 'user') {
    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }

    const usuarios = await this.usuarioRepo.find({
      where,
      select: ['id', 'nome', 'login', 'tipo', 'primeiroAcesso', 'criadoEm'],
      order: { nome: 'ASC' },
    });

    return usuarios;
  }

  async resetarSenha(
    usuarioAlvoId: string,
    dto: ResetarSenhaDto,
    adminLogado: { id: string; tipo: string },
  ) {
    if (adminLogado.tipo !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem resetar a senha de usuários');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioAlvoId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    usuario.senhaHash = hashSenha(dto.novaSenha);
    usuario.primeiroAcesso = true; // Exige alteração de senha no primeiro login após o reset
    await this.usuarioRepo.save(usuario);

    return {
      sucesso: true,
      mensagem: `Senha de ${usuario.nome} resetada com sucesso.`,
      usuarioId: usuario.id,
      login: usuario.login,
    };
  }
}

