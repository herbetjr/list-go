<template>
  <div class="fullscreen doodle-bg flex flex-center q-pa-md">
    <div class="column items-center" style="width: 100%; max-width: 440px">
      <!-- Título Superior -->
      <div class="text-h4 text-weight-bolder text-primary q-mb-xl text-center">
        Listas Compartilhadas
        <div class="text-subtitle1 text-weight-regular text-grey-7 q-mt-xs">
          Quem leva o quê?
        </div>
      </div>

      <!-- Avatar Flutuante -->
      <q-avatar
        color="warning"
        text-color="white"
        icon="lock_reset"
        size="84px"
        class="shadow-5"
        style="margin-bottom: -42px; z-index: 2"
      />

      <!-- Card do Formulário -->
      <q-card class="full-width rounded-card q-pt-xl q-pb-lg bg-white shadow-3">
        <q-card-section class="q-pt-lg q-px-lg">
          <div class="text-center q-mb-md">
            <h2 class="text-h6 text-weight-bold text-dark q-my-none">
              Primeiro Acesso
            </h2>
            <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
              Olá, <strong>{{ auth.usuario?.nome || 'usuário' }}</strong>! Por questões de segurança, você precisa cadastrar uma nova senha para liberar o seu acesso ao sistema.
            </p>
          </div>

          <q-banner
            v-if="errorMessage"
            dense
            rounded
            class="bg-negative text-white q-mb-md"
          >
            {{ errorMessage }}
          </q-banner>

          <q-form @submit.prevent="onAlterarSenha" class="q-gutter-y-md">
            <q-input
              v-model="novaSenha"
              outlined
              dense
              label="Nova Senha *"
              autocomplete="new-password"
              :type="showNovaSenha ? 'text' : 'password'"
              :rules="[
                (v) => !!v || 'Informe a nova senha',
                (v) => (v && v.length >= 6) || 'A senha deve ter no mínimo 6 caracteres',
              ]"
            >
              <template #prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template #append>
                <q-icon
                  :name="showNovaSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  color="grey-6"
                  @click="showNovaSenha = !showNovaSenha"
                />
              </template>
            </q-input>

            <q-input
              v-model="confirmarSenha"
              outlined
              dense
              label="Confirmar Nova Senha *"
              autocomplete="new-password"
              :type="showConfirmarSenha ? 'text' : 'password'"
              :rules="[
                (v) => !!v || 'Confirme a nova senha',
                (v) => v === novaSenha || 'As senhas não coincidem',
              ]"
            >
              <template #prepend>
                <q-icon name="lock_clock" color="primary" />
              </template>
              <template #append>
                <q-icon
                  :name="showConfirmarSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  color="grey-6"
                  @click="showConfirmarSenha = !showConfirmarSenha"
                />
              </template>
            </q-input>

            <q-btn
              type="submit"
              unelevated
              class="full-width btn-action-green q-py-sm text-subtitle1"
              label="Salvar senha e acessar"
              icon="check_circle"
              :loading="salvando"
            />
          </q-form>

          <div class="text-center q-mt-lg">
            <q-btn
              flat
              dense
              no-caps
              color="grey-7"
              icon="logout"
              label="Sair e entrar com outra conta"
              @click="sair"
            />
          </div>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const novaSenha = ref('');
const confirmarSenha = ref('');
const showNovaSenha = ref(false);
const showConfirmarSenha = ref(false);
const salvando = ref(false);
const errorMessage = ref('');

async function onAlterarSenha() {
  errorMessage.value = '';

  if (!novaSenha.value || novaSenha.value.length < 6) {
    errorMessage.value = 'A nova senha deve ter no mínimo 6 caracteres';
    return;
  }

  if (novaSenha.value !== confirmarSenha.value) {
    errorMessage.value = 'A confirmação de senha não confere com a nova senha';
    return;
  }

  salvando.value = true;
  try {
    await auth.alterarSenhaPrimeiroAcesso(novaSenha.value);

    $q.notify({
      type: 'positive',
      message: 'Senha alterada com sucesso! Bem-vindo ao sistema.',
      position: 'top',
    });

    void router.replace('/app');
  } catch (error: any) {
    errorMessage.value = error?.message || 'Falha ao alterar senha. Tente novamente.';
  } finally {
    salvando.value = false;
  }
}

function sair() {
  auth.logout();
  void router.replace('/');
}
</script>

