import { http } from './http';
import type { CriarUsuarioPayload, Usuario } from '@/types/auth.types';

export const usuarioService = {
  listarUsuarios(tipo?: 'admin' | 'user'): Promise<Usuario[]> {
    return http.get<Usuario[]>('/usuarios', tipo ? { tipo } : undefined);
  },
  criarUsuario(payload: CriarUsuarioPayload): Promise<Usuario> {
    return http.post<Usuario>('/usuarios', payload);
  },
  resetarSenha(usuarioId: string, novaSenha: string): Promise<any> {
    return http.patch(`/usuarios/${usuarioId}/resetar-senha`, { novaSenha });
  },
};

