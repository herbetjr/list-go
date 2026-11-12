<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="width: 100%; max-width: 650px; border-radius: 16px" class="q-pa-md">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center q-gutter-x-sm">
          <q-avatar color="primary" text-color="white" icon="manage_accounts" size="38px" />
          <div>
            <div class="text-h6 text-weight-bold text-dark">Gestão de Usuários</div>
            <div class="text-caption text-grey-7">Cadastre novos administradores e consulte usuários</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-tabs
          v-model="abaAtiva"
          dense
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="lista" icon="people" label="Usuários Cadastrados" />
          <q-tab name="novo" icon="person_add" label="Cadastrar Usuário" />
        </q-tabs>

        <q-separator class="q-my-sm" />

        <q-tab-panels v-model="abaAtiva" animated>
          <!-- Painel 1: Lista de Usuários -->
          <q-tab-panel name="lista" class="q-pa-none">
            <div class="row justify-between items-center q-mb-sm q-mt-xs">
              <div class="text-caption text-grey-6">
                Total: {{ usuarios.length }} usuário(s)
              </div>
              <q-btn
                flat
                dense
                color="primary"
                icon="refresh"
                label="Atualizar"
                :loading="carregando"
                @click="carregarUsuarios"
              />
            </div>

            <div v-if="carregando" class="text-center q-py-lg">
              <q-spinner color="primary" size="32px" />
            </div>

            <q-list v-else separator class="rounded-borders border-grey">
              <q-item v-for="u in usuarios" :key="u.id" class="q-py-sm">
                <q-item-section avatar>
                  <q-avatar
                    :color="u.tipo === 'admin' ? 'primary' : 'grey-4'"
                    :text-color="u.tipo === 'admin' ? 'white' : 'grey-8'"
                    :icon="u.tipo === 'admin' ? 'admin_panel_settings' : 'person'"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold text-body1">{{ u.nome }}</q-item-label>
                  <q-item-label caption class="text-grey-7">
                    Login: <strong>@{{ u.login }}</strong>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center q-gutter-x-sm">
                    <q-badge
                      :color="u.tipo === 'admin' ? 'primary' : 'grey-6'"
                      :label="u.tipo === 'admin' ? 'Administrador' : 'Usuário'"
                      class="q-px-sm q-py-xs text-weight-bold"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      color="warning"
                      icon="lock_reset"
                      @click="solicitarResetSenhaModal(u)"
                    >
                      <q-tooltip>Resetar senha de {{ u.nome }}</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- Painel 2: Cadastrar Usuário -->
          <q-tab-panel name="novo" class="q-pa-none q-pt-sm">
            <q-form @submit.prevent="salvarNovoUsuario" class="q-gutter-y-md">
              <q-input
                v-model="formulario.nome"
                outlined
                dense
                label="Nome completo *"
                placeholder="Ex: Carlos Eduardo"
                :rules="[(v) => !!v?.trim() || 'Informe o nome']"
              />

              <q-input
                v-model="formulario.login"
                outlined
                dense
                label="Login de acesso *"
                placeholder="Ex: carloseduardo"
                :rules="[(v) => !!v?.trim() || 'Informe o login de acesso']"
              />

              <q-input
                v-model="formulario.senha"
                outlined
                dense
                type="password"
                label="Senha *"
                placeholder="Mínimo 6 caracteres"
                :rules="[(v) => (v && v.length >= 6) || 'A senha deve ter no mínimo 6 caracteres']"
              />

              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Tipo de Usuário:</div>
                <div class="row q-gutter-x-md">
                  <q-radio
                    v-model="formulario.tipo"
                    val="admin"
                    label="Administrador"
                    color="primary"
                  />
                  <q-radio
                    v-model="formulario.tipo"
                    val="user"
                    label="Usuário padrão"
                    color="primary"
                  />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Administradores podem ser vinculados a listas com permissões personalizadas.
                </div>
              </div>

              <div class="row justify-end q-gutter-x-sm q-pt-sm">
                <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
                <q-btn
                  unelevated
                  class="btn-action-green"
                  label="Cadastrar Usuário"
                  icon="check"
                  type="submit"
                  :loading="salvando"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usuarioService } from '@/services/usuario.service';
import type { TipoUsuario, Usuario } from '@/types/auth.types';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'usuarioCriado', usuario: Usuario): void;
}>();

const $q = useQuasar();

const abaAtiva = ref<'lista' | 'novo'>('lista');
const usuarios = ref<Usuario[]>([]);
const carregando = ref(false);
const salvando = ref(false);

const formulario = ref<{
  nome: string;
  login: string;
  senha: string;
  tipo: TipoUsuario;
}>({
  nome: '',
  login: '',
  senha: '',
  tipo: 'admin',
});

async function carregarUsuarios() {
  carregando.value = true;
  try {
    usuarios.value = await usuarioService.listarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao carregar lista de usuários',
    });
  } finally {
    carregando.value = false;
  }
}

async function salvarNovoUsuario() {
  salvando.value = true;
  try {
    const criado = await usuarioService.criarUsuario({
      nome: formulario.value.nome.trim(),
      login: formulario.value.login.trim(),
      senha: formulario.value.senha,
      tipo: formulario.value.tipo,
    });

    $q.notify({
      type: 'positive',
      message: `Usuário ${criado.nome} cadastrado com sucesso como ${criado.tipo}!`,
    });

    emit('usuarioCriado', criado);

    // Limpar form e voltar para aba lista
    formulario.value = {
      nome: '',
      login: '',
      senha: '',
      tipo: 'admin',
    };
    abaAtiva.value = 'lista';
    await carregarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao cadastrar usuário',
    });
  } finally {
    salvando.value = false;
  }
}

function solicitarResetSenhaModal(u: Usuario) {
  $q.dialog({
    title: 'Resetar Senha',
    message: `Defina a nova senha provisória para ${u.nome} (@${u.login}):`,
    prompt: {
      model: '',
      type: 'password',
      isValid: (val: string) => val.length >= 6,
    },
    cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
    ok: { label: 'Resetar Senha', color: 'warning', textColor: 'dark', unelevated: true },
  }).onOk((novaSenha: string) => {
    void executarResetSenhaModal(u, novaSenha);
  });
}

async function executarResetSenhaModal(u: Usuario, novaSenha: string) {
  try {
    await usuarioService.resetarSenha(u.id, novaSenha);
    $q.notify({
      type: 'positive',
      message: `Senha de ${u.nome} resetada com sucesso! O usuário deverá cadastrar uma nova senha no próximo acesso.`,
      timeout: 5000,
    });
    await carregarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao resetar senha.',
    });
  }
}

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      void carregarUsuarios();
    }
  },
);
</script>

<style scoped>
.border-grey {
  border: 1px solid #e0e0e0;
}
</style>

