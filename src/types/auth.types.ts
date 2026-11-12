export type TipoUsuario = 'admin' | 'user';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  tipo: TipoUsuario;
  primeiroAcesso?: boolean;
}

export interface LoginPayload {
  login: string;
  senha: string;
}

export interface RegistroPayload {
  nome: string;
  login: string;
  senha: string;
}

export interface AlterarSenhaPrimeiroAcessoPayload {
  novaSenha: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

export interface CriarUsuarioPayload {
  nome: string;
  login: string;
  senha: string;
  tipo?: TipoUsuario;
}


