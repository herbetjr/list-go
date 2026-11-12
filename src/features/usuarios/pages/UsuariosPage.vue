<template>
  <q-page class="q-py-lg q-px-md">
    <div class="row justify-center">
      <div class="col-12 col-xl-10">

        <!-- Barra de Navegação Superior / Voltar -->
        <div class="row items-center justify-between q-mb-lg">
          <q-btn
            flat
            no-caps
            color="grey-8"
            icon="arrow_back"
            label="Voltar para as Listas"
            @click="voltarParaHome"
          />

          <q-btn
            unelevated
            class="btn-action-green"
            icon="person_add"
            label="Novo Usuário"
            @click="abrirModalCadastro"
          />
        </div>

        <!-- Cabeçalho da Feature -->
        <div class="text-center q-mb-xl">
          <h1 class="text-h4 text-weight-bolder text-primary-dark q-my-none row items-center justify-center q-gutter-x-sm">
            <q-icon name="manage_accounts" color="primary" />
            <span>Cadastro de Usuários</span>
          </h1>
          <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-none">
            Gerencie os acessos, administradores e membros do sistema
          </p>
        </div>

        <!-- Cards de Métricas / Resumo -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-4">
            <q-card class="rounded-card bg-white q-pa-md shadow-1">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-grey-6 text-uppercase text-weight-bold">Total de Usuários</div>
                  <div class="text-h4 text-weight-bolder text-dark q-mt-xs">{{ totalUsuarios }}</div>
                </div>
                <q-avatar color="light-blue-1" text-color="primary" icon="group" size="48px" />
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-4">
            <q-card class="rounded-card bg-white q-pa-md shadow-1">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-grey-6 text-uppercase text-weight-bold">Administradores</div>
                  <div class="text-h4 text-weight-bolder text-primary q-mt-xs">{{ totalAdmins }}</div>
                </div>
                <q-avatar color="primary" text-color="white" icon="admin_panel_settings" size="48px" />
              </div>
            </q-card>
          </div>

          <div class="col-12 col-sm-4">
            <q-card class="rounded-card bg-white q-pa-md shadow-1">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-grey-6 text-uppercase text-weight-bold">Usuários Padrão</div>
                  <div class="text-h4 text-weight-bolder text-grey-8 q-mt-xs">{{ totalUsersComuns }}</div>
                </div>
                <q-avatar color="grey-2" text-color="grey-8" icon="person" size="48px" />
              </div>
            </q-card>
          </div>
        </div>

        <!-- Card Principal da Tabela de Usuários -->
        <q-card class="rounded-card bg-white shadow-2 overflow-hidden">
          <!-- Filtros e Busca -->
          <div class="q-pa-md row items-center justify-between q-col-gutter-md" style="border-bottom: 1px solid #f1f5f9">
            <div class="col-12 col-sm-6 col-md-5">
              <q-input
                v-model="filtroTexto"
                outlined
                dense
                placeholder="Buscar por nome ou login..."
                bg-color="grey-1"
                clearable
              >
                <template #prepend>
                  <q-icon name="search" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6 col-md-4 row items-center justify-end q-gutter-x-sm">
              <q-btn-toggle
                v-model="filtroTipo"
                no-caps
                dense
                unelevated
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                :options="[
                  { label: 'Todos', value: 'todos' },
                  { label: 'Admins', value: 'admin' },
                  { label: 'Usuários', value: 'user' },
                ]"
              />

              <q-btn
                flat
                round
                dense
                color="primary"
                icon="refresh"
                :loading="carregando"
                @click="carregarUsuarios"
              >
                <q-tooltip>Atualizar lista</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Tabela de Usuários -->
          <div class="q-pa-md">
            <div v-if="carregando" class="text-center q-py-xl">
              <q-spinner color="primary" size="48px" />
              <div class="text-caption text-grey-6 q-mt-md">Carregando usuários...</div>
            </div>

            <div v-else-if="usuariosFiltrados.length === 0" class="text-center q-py-xl text-grey-5">
              <q-icon name="person_off" size="56px" color="grey-3" class="q-mb-sm" />
              <div class="text-subtitle1 text-weight-medium">Nenhum usuário encontrado</div>
              <div class="text-caption">Tente ajustar a busca ou cadastre um novo usuário.</div>
            </div>

            <table v-else class="tabela-usuarios">
              <thead>
                <tr>
                  <th style="width: 35%">Nome</th>
                  <th style="width: 25%">Login</th>
                  <th style="width: 20%">Tipo de Perfil</th>
                  <th style="width: 20%; text-align: right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in usuariosFiltrados" :key="user.id" class="usuario-row">
                  <td>
                    <div class="row items-center q-gutter-x-sm">
                      <q-avatar
                        size="36px"
                        :color="user.tipo === 'admin' ? 'primary' : 'grey-3'"
                        :text-color="user.tipo === 'admin' ? 'white' : 'grey-8'"
                        :icon="user.tipo === 'admin' ? 'admin_panel_settings' : 'person'"
                      />
                      <div>
                        <div class="text-weight-bold text-dark text-body1">{{ user.nome }}</div>
                        <div v-if="user.id === authStore.usuario?.id" class="text-caption text-primary text-weight-bold">
                          (Você)
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span class="text-weight-medium text-grey-8">
                      @{{ user.login }}
                    </span>
                  </td>

                  <td>
                    <q-badge
                      :color="user.tipo === 'admin' ? 'primary' : 'grey-5'"
                      class="text-weight-bold q-px-sm q-py-xs"
                      style="border-radius: 6px; font-size: 12px"
                    >
                      <q-icon
                        :name="user.tipo === 'admin' ? 'verified_user' : 'person'"
                        size="14px"
                        class="q-mr-xs"
                      />
                      {{ user.tipo === 'admin' ? 'Administrador' : 'Usuário Padrão' }}
                    </q-badge>
                  </td>

                  <td style="text-align: right">
                    <q-btn
                      unelevated
                      dense
                      no-caps
                      size="sm"
                      color="warning"
                      text-color="dark"
                      icon="lock_reset"
                      label="Resetar Senha"
                      class="q-px-sm text-weight-bold"
                      style="border-radius: 8px"
                      @click="abrirModalResetarSenha(user)"
                    >
                      <q-tooltip>Redefinir a senha de {{ user.nome }}</q-tooltip>
                    </q-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </q-card>

      </div>
    </div>

    <!-- Modal Cadastrar Usuário -->
    <q-dialog v-model="modalCadastro">
      <q-card style="width: 100%; max-width: 500px; border-radius: 16px" class="q-pa-md">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-x-sm">
            <q-avatar color="primary" text-color="white" icon="person_add" size="38px" />
            <div>
              <div class="text-h6 text-weight-bold text-dark">Novo Usuário</div>
              <div class="text-caption text-grey-7">Cadastre um novo administrador ou usuário</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="salvarUsuario" class="q-gutter-y-md">
            <q-input
              v-model="form.nome"
              outlined
              dense
              label="Nome completo *"
              placeholder="Ex: João da Silva"
              bg-color="grey-1"
              autofocus
              :rules="[(v) => !!v?.trim() || 'Informe o nome completo']"
            />

            <q-input
              v-model="form.login"
              outlined
              dense
              label="Login de acesso *"
              placeholder="Ex: joaosilva"
              bg-color="grey-1"
              :rules="[(v) => !!v?.trim() || 'Informe o login de acesso']"
            />

            <q-input
              v-model="form.senha"
              outlined
              dense
              type="password"
              label="Senha de acesso *"
              placeholder="Mínimo 6 caracteres"
              bg-color="grey-1"
              :rules="[(v) => (v && v.length >= 6) || 'A senha deve ter pelo menos 6 caracteres']"
            />

            <div>
              <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Tipo de Perfil:</div>
              <div class="row q-gutter-x-md">
                <q-radio
                  v-model="form.tipo"
                  val="admin"
                  label="Administrador"
                  color="primary"
                />
                <q-radio
                  v-model="form.tipo"
                  val="user"
                  label="Usuário Padrão"
                  color="primary"
                />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                Administradores podem gerenciar e ser vinculados a listas com permissões personalizadas.
              </div>
            </div>

            <div class="row justify-end q-gutter-x-sm q-pt-md">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn
                unelevated
                class="btn-action-green"
                label="Salvar Usuário"
                icon="check"
                type="submit"
                :loading="salvando"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modal Resetar Senha -->
    <q-dialog v-model="modalResetarSenha">
      <q-card style="width: 100%; max-width: 460px; border-radius: 16px" class="q-pa-md">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-x-sm">
            <q-avatar color="warning" text-color="white" icon="lock_reset" size="38px" />
            <div>
              <div class="text-h6 text-weight-bold text-dark">Resetar Senha</div>
              <div class="text-caption text-grey-7">
                Usuário: <strong>{{ usuarioParaReset?.nome }}</strong> (@{{ usuarioParaReset?.login }})
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="bg-amber-1 q-pa-sm rounded-borders text-caption text-grey-9 q-mb-md row items-center q-gutter-x-xs">
            <q-icon name="info" color="warning" size="20px" />
            <div class="col">
              Após o reset, o usuário deverá <strong>obrigatoriamente alterar a senha</strong> no próximo login.
            </div>
          </div>

          <q-form @submit.prevent="confirmarResetSenha" class="q-gutter-y-md">
            <q-input
              v-model="novaSenhaReset"
              outlined
              dense
              label="Nova Senha Provisória *"
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
              bg-color="grey-1"
              autofocus
              :type="showSenhaReset ? 'text' : 'password'"
              :rules="[
                (v) => !!v || 'Informe a nova senha',
                (v) => (v && v.length >= 6) || 'A senha deve ter no mínimo 6 caracteres',
              ]"
            >
              <template #prepend>
                <q-icon name="key" color="warning" />
              </template>
              <template #append>
                <q-icon
                  :name="showSenhaReset ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  color="grey-6"
                  @click="showSenhaReset = !showSenhaReset"
                />
              </template>
            </q-input>

            <div class="row justify-end q-gutter-x-sm q-pt-sm">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn
                unelevated
                color="warning"
                text-color="dark"
                class="text-weight-bold"
                label="Confirmar Reset"
                icon="lock_reset"
                type="submit"
                :loading="salvandoReset"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usuarioService } from '@/services/usuario.service';
import { useAuthStore } from '@/stores/auth.store';
import type { TipoUsuario, Usuario } from '@/types/auth.types';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const usuarios = ref<Usuario[]>([]);
const carregando = ref(false);
const salvando = ref(false);

const filtroTexto = ref('');
const filtroTipo = ref<'todos' | 'admin' | 'user'>('todos');

const modalCadastro = ref(false);
const form = ref<{
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

const modalResetarSenha = ref(false);
const usuarioParaReset = ref<Usuario | null>(null);
const novaSenhaReset = ref('');
const showSenhaReset = ref(false);
const salvandoReset = ref(false);

const totalUsuarios = computed(() => usuarios.value.length);
const totalAdmins = computed(() => usuarios.value.filter((u) => u.tipo === 'admin').length);
const totalUsersComuns = computed(() => usuarios.value.filter((u) => u.tipo === 'user').length);

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter((u) => {
    const matchTipo = filtroTipo.value === 'todos' || u.tipo === filtroTipo.value;
    const matchTexto =
      !filtroTexto.value.trim() ||
      u.nome.toLowerCase().includes(filtroTexto.value.trim().toLowerCase()) ||
      u.login.toLowerCase().includes(filtroTexto.value.trim().toLowerCase());
    return matchTipo && matchTexto;
  });
});

function voltarParaHome() {
  void router.push('/app');
}

function abrirModalCadastro() {
  form.value = {
    nome: '',
    login: '',
    senha: '',
    tipo: 'admin',
  };
  modalCadastro.value = true;
}

async function carregarUsuarios() {
  carregando.value = true;
  try {
    usuarios.value = await usuarioService.listarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Falha ao carregar lista de usuários.',
    });
  } finally {
    carregando.value = false;
  }
}

async function salvarUsuario() {
  salvando.value = true;
  try {
    const novo = await usuarioService.criarUsuario({
      nome: form.value.nome.trim(),
      login: form.value.login.trim(),
      senha: form.value.senha,
      tipo: form.value.tipo,
    });

    $q.notify({
      type: 'positive',
      message: `Usuário ${novo.nome} cadastrado com sucesso!`,
    });

    modalCadastro.value = false;
    await carregarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao cadastrar usuário.',
    });
  } finally {
    salvando.value = false;
  }
}

function abrirModalResetarSenha(usuario: Usuario) {
  usuarioParaReset.value = usuario;
  novaSenhaReset.value = '';
  showSenhaReset.value = false;
  modalResetarSenha.value = true;
}

async function confirmarResetSenha() {
  if (!usuarioParaReset.value) return;

  if (!novaSenhaReset.value || novaSenhaReset.value.length < 6) {
    $q.notify({
      type: 'warning',
      message: 'A nova senha deve ter no mínimo 6 caracteres.',
    });
    return;
  }

  salvandoReset.value = true;
  try {
    await usuarioService.resetarSenha(
      usuarioParaReset.value.id,
      novaSenhaReset.value,
    );

    $q.notify({
      type: 'positive',
      message: `Senha de ${usuarioParaReset.value.nome} resetada com sucesso! O usuário deverá cadastrar uma nova senha no próximo acesso.`,
      timeout: 5000,
    });

    modalResetarSenha.value = false;
    usuarioParaReset.value = null;
    novaSenhaReset.value = '';
    await carregarUsuarios();
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao resetar senha.',
    });
  } finally {
    salvandoReset.value = false;
  }
}

onMounted(() => {
  void carregarUsuarios();
});
</script>

<style scoped lang="scss">
.text-primary-dark {
  color: #0369a1;
}

.tabela-usuarios {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    padding: 12px 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
}

.usuario-row {
  transition: background-color 0.2s ease;
}
.usuario-row:hover {
  background-color: #f8fafc;
}
</style>

