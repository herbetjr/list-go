<template>
  <div class="fullscreen doodle-bg flex flex-center q-pa-md">
    <div class="column items-center" style="width: 100%; max-width: 420px">
      <!-- Título Superior -->
      <div class="text-h4 text-weight-bolder text-primary q-mb-xl text-center">
        Listas Compartilhadas
        <div class="text-subtitle1 text-weight-regular text-grey-7 q-mt-xs">
          Quem leva o quê?
        </div>
      </div>

      <!-- Avatar Flutuante -->
      <q-avatar
        color="primary"
        text-color="white"
        icon="checklist"
        size="84px"
        class="shadow-5"
        style="margin-bottom: -42px; z-index: 2"
      />

      <!-- Card do Formulário -->
      <q-card class="full-width rounded-card q-pt-xl q-pb-lg bg-white">
        <q-card-section class="q-pt-lg q-px-lg">
          <q-banner
            v-if="errorMessage"
            dense
            rounded
            class="bg-negative text-white q-mb-md"
          >
            {{ errorMessage }}
          </q-banner>

          <!-- Formulário de Login -->
          <q-form @submit.prevent="onLoginSubmit" class="q-gutter-y-md">
            <q-input
              v-model="loginUsuario"
              outlined
              dense
              label="Usuário"
              autocomplete="username"
              :rules="[(v) => !!v || 'Informe o usuário']"
            >
              <template #prepend>
                <q-icon name="person" color="primary" />
              </template>
            </q-input>

            <q-input
              v-model="loginSenha"
              outlined
              dense
              label="Senha"
              autocomplete="current-password"
              :type="showPassword ? 'text' : 'password'"
              :rules="[(v) => !!v || 'Informe a senha']"
            >
              <template #prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div class="row items-center justify-between">
              <q-checkbox
                v-model="lembrar"
                dense
                size="sm"
                label="Lembrar-me"
              />
            </div>

            <q-btn
              type="submit"
              unelevated
              class="full-width btn-action-green"
              size="lg"
              label="Entrar na minha conta"
              :loading="loading"
            />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Rodapé -->
      <div class="text-caption text-grey-6 q-mt-lg text-center">
        Desenvolvido por <strong>Herbet Júnior</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/services/http';

const router = useRouter();
const auth = useAuthStore();

const loginUsuario = ref('');
const loginSenha = ref('');

const lembrar = ref(true);
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const CHAVE_CREDENCIAIS = 'lista-go:credenciais';

onMounted(() => {
  try {
    const salvo = localStorage.getItem(CHAVE_CREDENCIAIS);
    if (salvo) {
      const dados = JSON.parse(decodeURIComponent(escape(atob(salvo))));
      if (dados.login) loginUsuario.value = dados.login;
      if (dados.senha) loginSenha.value = dados.senha;
    }
  } catch {
    // Ignora erro
  }
});

function salvarCredenciais() {
  if (lembrar.value) {
    const dados = JSON.stringify({
      login: loginUsuario.value.trim(),
      senha: loginSenha.value,
    });
    localStorage.setItem(CHAVE_CREDENCIAIS, btoa(unescape(encodeURIComponent(dados))));
  } else {
    localStorage.removeItem(CHAVE_CREDENCIAIS);
  }
}

async function onLoginSubmit() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const user = await auth.login(
      { login: loginUsuario.value.trim(), senha: loginSenha.value },
      lembrar.value,
    );
    salvarCredenciais();
    if (user?.primeiroAcesso) {
      await router.replace('/primeiro-acesso');
    } else {
      await router.replace('/app');
    }
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Falha ao efetuar login';
  } finally {
    loading.value = false;
  }
}
</script>

