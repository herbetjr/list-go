import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../models/usuario.model';
import { AlterarSenhaPrimeiroAcessoDto, LoginDto, RegistroDto } from '../dtos/auth.dto';
import { hashSenha, verificarSenha } from '../utils/senha.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { login: dto.login },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const senhaValida = await verificarSenha(dto.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = {
      sub: usuario.id,
      login: usuario.login,
      nome: usuario.nome,
      tipo: usuario.tipo,
      primeiroAcesso: Boolean(usuario.primeiroAcesso),
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        tipo: usuario.tipo,
        primeiroAcesso: Boolean(usuario.primeiroAcesso),
      },
    };
  }

  async registrar(dto: RegistroDto) {
    const existente = await this.usuarioRepo.findOne({
      where: { login: dto.login },
    });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este login');
    }

    const novo = this.usuarioRepo.create({
      nome: dto.nome,
      login: dto.login,
      senhaHash: hashSenha(dto.senha),
      tipo: 'user',
      primeiroAcesso: true,
    });

    const salvo = await this.usuarioRepo.save(novo);

    const payload = {
      sub: salvo.id,
      login: salvo.login,
      nome: salvo.nome,
      tipo: salvo.tipo,
      primeiroAcesso: true,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        id: salvo.id,
        nome: salvo.nome,
        login: salvo.login,
        tipo: salvo.tipo,
        primeiroAcesso: true,
      },
    };
  }

  async validarToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const usuario = await this.usuarioRepo.findOne({
        where: { id: payload.sub },
      });
      if (!usuario) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      return {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login,
        tipo: usuario.tipo,
        primeiroAcesso: Boolean(usuario.primeiroAcesso),
      };
    } catch {
      throw new UnauthorizedException('Sessão expirada ou token inválido');
    }
  }

  async obterUsuarioPorId(id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      select: ['id', 'nome', 'login', 'tipo', 'primeiroAcesso', 'criadoEm'],
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return usuario;
  }

  async alterarSenhaPrimeiroAcesso(
    usuarioId: string,
    dto: AlterarSenhaPrimeiroAcessoDto,
  ) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    usuario.senhaHash = hashSenha(dto.novaSenha);
    usuario.primeiroAcesso = false;
    const salvo = await this.usuarioRepo.save(usuario);

    const payload = {
      sub: salvo.id,
      login: salvo.login,
      nome: salvo.nome,
      tipo: salvo.tipo,
      primeiroAcesso: false,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        id: salvo.id,
        nome: salvo.nome,
        login: salvo.login,
        tipo: salvo.tipo,
        primeiroAcesso: false,
      },
    };
  }
}

