import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '@/services/auth.service';
import { tokenStorage } from '@/services/token.storage';
import type { LoginPayload, RegistroPayload, Usuario } from '@/types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(tokenStorage.get());
  const usuario = ref<Usuario | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => usuario.value?.tipo === 'admin');
  const needsPasswordChange = computed(() => Boolean(usuario.value?.primeiroAcesso));

  async function login(payload: LoginPayload, remember: boolean) {
    const response = await authService.login(payload);
    tokenStorage.set(response.accessToken, remember);
    token.value = response.accessToken;
    usuario.value = response.usuario;
    return response.usuario;
  }

  async function registro(payload: RegistroPayload, remember: boolean) {
    const response = await authService.registro(payload);
    tokenStorage.set(response.accessToken, remember);
    token.value = response.accessToken;
    usuario.value = response.usuario;
    return response.usuario;
  }

  async function alterarSenhaPrimeiroAcesso(novaSenha: string) {
    const response = await authService.alterarSenhaPrimeiroAcesso({ novaSenha });
    tokenStorage.set(response.accessToken, true);
    token.value = response.accessToken;
    usuario.value = response.usuario;
    return response.usuario;
  }

  async function restaurarSessao(): Promise<boolean> {
    if (!token.value) return false;
    if (usuario.value) return true;
    try {
      usuario.value = await authService.me();
      return true;
    } catch {
      logout();
      return false;
    }
  }

  function logout() {
    tokenStorage.clear();
    token.value = null;
    usuario.value = null;
  }

  return {
    token,
    usuario,
    isAuthenticated,
    isAdmin,
    needsPasswordChange,
    login,
    registro,
    alterarSenhaPrimeiroAcesso,
    restaurarSessao,
    logout,
  };
});

