import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { usuario?: any }>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];

    if (isPublic) {
      if (tipo === 'Bearer' && token) {
        try {
          request.usuario = await this.authService.validarToken(token);
        } catch {
          // Rota pública: ignora erro de token inválido ou expirado
        }
      }
      return true;
    }

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    request.usuario = await this.authService.validarToken(token);
    return true;
  }
}

