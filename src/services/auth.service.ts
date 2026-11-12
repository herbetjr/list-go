import { http } from './http';
import type {
  AlterarSenhaPrimeiroAcessoPayload,
  LoginPayload,
  LoginResponse,
  RegistroPayload,
  Usuario,
} from '@/types/auth.types';

export const authService = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/login', payload, false);
  },
  registro(payload: RegistroPayload): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/registro', payload, false);
  },
  me(): Promise<Usuario> {
    return http.get<Usuario>('/auth/me');
  },
  alterarSenhaPrimeiroAcesso(
    payload: AlterarSenhaPrimeiroAcessoPayload,
  ): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/alterar-senha-primeiro-acesso', payload);
  },
};

