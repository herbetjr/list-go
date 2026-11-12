<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="width: 100%; max-width: 650px; border-radius: 16px" class="q-pa-md">
      <!-- Cabeçalho -->
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="row items-center q-gutter-x-sm">
          <q-avatar color="primary" text-color="white" icon="admin_panel_settings" size="38px" />
          <div>
            <div class="text-h6 text-weight-bold text-dark">Administradores da Lista</div>
            <div class="text-caption text-grey-7">{{ tituloLista || 'Gerenciar permissões de acesso' }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <!-- Indicador de carregamento -->
        <div v-if="carregando" class="text-center q-py-lg">
          <q-spinner color="primary" size="36px" />
          <div class="text-caption text-grey-6 q-mt-sm">Carregando permissões...</div>
        </div>

        <div v-else class="q-gutter-y-lg">
          <!-- Bloco 1: Vincular Novo Administrador -->
          <q-card flat bordered class="q-pa-md rounded-borders bg-grey-1">
            <div class="text-weight-bold text-subtitle2 text-primary q-mb-sm row items-center q-gutter-x-xs">
              <q-icon name="person_add" size="20px" />
              <span>Vincular Administrador</span>
            </div>

            <div v-if="candidatosDisponiveis.length === 0" class="text-caption text-grey-7 q-py-xs">
              Nenhum outro administrador disponível para vincular.
              <span class="text-primary cursor-pointer text-weight-bold">
                Cadastre novos administradores no menu "Usuários" no topo.
              </span>
            </div>

            <div v-else class="q-gutter-y-sm">
              <q-select
                v-model="novoAdminUsuario"
                :options="candidatosDisponiveis"
                option-label="nome"
                outlined
                dense
                bg-color="white"
                label="Selecione um administrador *"
                emit-value
                map-options
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon name="admin_panel_settings" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.nome }}</q-item-label>
                      <q-item-label caption>@{{ scope.opt.login }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Permissões concedidas:</div>
                <div class="row q-col-gutter-xs">
                  <div class="col-12 col-sm-6">
                    <q-checkbox v-model="novoAdminPermissoes.podeLer" label="Apenas ler a lista" color="primary" dense />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox v-model="novoAdminPermissoes.podeEditarLista" label="Editar a lista (título)" color="primary" dense />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox v-model="novoAdminPermissoes.podeAdicionarItens" label="Adicionar itens" color="primary" dense />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox v-model="novoAdminPermissoes.podeEditarItens" label="Editar itens" color="primary" dense />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-checkbox v-model="novoAdminPermissoes.podeRemoverItens" label="Remover itens" color="primary" dense />
                  </div>
                </div>
              </div>

              <div class="row justify-end q-mt-sm">
                <q-btn
                  unelevated
                  class="btn-action-green"
                  icon="add"
                  label="Vincular à Lista"
                  :loading="salvandoNovo"
                  :disable="!novoAdminUsuario"
                  @click="vincularNovoAdministrador"
                />
              </div>
            </div>
          </q-card>

          <!-- Bloco 2: Lista de Administradores Vinculados -->
          <div>
            <div class="text-weight-bold text-subtitle2 text-grey-8 q-mb-xs">
              Administradores Vinculados ({{ administradores.length }})
            </div>

            <div v-if="administradores.length === 0" class="text-caption text-grey-6 text-center q-py-md">
              Nenhum outro administrador vinculado a esta lista. Apenas você tem acesso administrativo.
            </div>

            <q-list v-else separator class="rounded-borders border-grey">
              <q-item
                v-for="admin in administradores"
                :key="admin.id"
                class="q-py-md column"
              >
                <div class="row items-center justify-between full-width q-mb-sm">
                  <div class="row items-center q-gutter-x-sm">
                    <q-avatar size="34px" color="primary" text-color="white" icon="admin_panel_settings" />
                    <div>
                      <div class="text-weight-bold text-body1">{{ admin.usuario?.nome || 'Administrador' }}</div>
                      <div class="text-caption text-grey-7">@{{ admin.usuario?.login }}</div>
                    </div>
                  </div>

                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="person_remove"
                    size="sm"
                    @click="confirmarRemoverAdministrador(admin)"
                  >
                    <q-tooltip>Desvincular administrador desta lista</q-tooltip>
                  </q-btn>
                </div>

                <!-- Checkboxes de Permissões para este administrador -->
                <div class="bg-grey-1 q-pa-sm rounded-borders full-width">
                  <div class="text-caption text-grey-7 text-weight-bold q-mb-xs">Permissões deste administrador:</div>
                  <div class="row q-col-gutter-xs">
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        :model-value="admin.podeLer"
                        label="Apenas ler a lista"
                        color="primary"
                        dense
                        @update:model-value="(val) => atualizarPermissao(admin, 'podeLer', Boolean(val))"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        :model-value="admin.podeEditarLista"
                        label="Editar lista (título)"
                        color="primary"
                        dense
                        @update:model-value="(val) => atualizarPermissao(admin, 'podeEditarLista', Boolean(val))"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        :model-value="admin.podeAdicionarItens"
                        label="Adicionar itens"
                        color="primary"
                        dense
                        @update:model-value="(val) => atualizarPermissao(admin, 'podeAdicionarItens', Boolean(val))"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        :model-value="admin.podeEditarItens"
                        label="Editar itens"
                        color="primary"
                        dense
                        @update:model-value="(val) => atualizarPermissao(admin, 'podeEditarItens', Boolean(val))"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-checkbox
                        :model-value="admin.podeRemoverItens"
                        label="Remover itens"
                        color="primary"
                        dense
                        @update:model-value="(val) => atualizarPermissao(admin, 'podeRemoverItens', Boolean(val))"
                      />
                    </div>
                  </div>
                </div>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn flat label="Fechar" color="grey-7" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { listaService } from '@/services/lista.service';
import { usuarioService } from '@/services/usuario.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ListaAdministradorItem } from '@/types/lista.types';
import type { Usuario } from '@/types/auth.types';

const props = defineProps<{
  modelValue: boolean;
  listaIdOuCodigo: string;
  tituloLista?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'administradoresAlterados'): void;
}>();

const $q = useQuasar();
const authStore = useAuthStore();

const administradores = ref<ListaAdministradorItem[]>([]);
const todosAdmins = ref<Usuario[]>([]);
const carregando = ref(false);
const salvandoNovo = ref(false);

const novoAdminUsuario = ref<Usuario | null>(null);
const novoAdminPermissoes = ref({
  podeLer: true,
  podeEditarLista: false,
  podeAdicionarItens: false,
  podeEditarItens: false,
  podeRemoverItens: false,
});

// Candidatos a vincular: usuários que são admin, que não são o usuário atual logado (dono), e que ainda não estão vinculados
const candidatosDisponiveis = computed(() => {
  const idsVinculados = new Set(administradores.value.map((a) => a.usuarioId));
  const idAtual = authStore.usuario?.id;

  return todosAdmins.value.filter(
    (u) => u.id !== idAtual && !idsVinculados.has(u.id),
  );
});

async function carregarDados() {
  if (!props.listaIdOuCodigo) return;
  carregando.value = true;
  try {
    const [listaAdmins, usuarios] = await Promise.all([
      listaService.listarAdministradores(props.listaIdOuCodigo),
      usuarioService.listarUsuarios('admin'),
    ]);
    administradores.value = listaAdmins;
    todosAdmins.value = usuarios;
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao carregar administradores da lista',
    });
  } finally {
    carregando.value = false;
  }
}

async function vincularNovoAdministrador() {
  if (!novoAdminUsuario.value) return;

  salvandoNovo.value = true;
  try {
    const vinculo = await listaService.vincularAdministrador(
      props.listaIdOuCodigo,
      {
        usuarioId: novoAdminUsuario.value.id,
        podeLer: novoAdminPermissoes.value.podeLer,
        podeEditarLista: novoAdminPermissoes.value.podeEditarLista,
        podeAdicionarItens: novoAdminPermissoes.value.podeAdicionarItens,
        podeEditarItens: novoAdminPermissoes.value.podeEditarItens,
        podeRemoverItens: novoAdminPermissoes.value.podeRemoverItens,
      },
    );

    $q.notify({
      type: 'positive',
      message: `Administrador ${novoAdminUsuario.value.nome} vinculado com sucesso!`,
    });

    // Reset form
    novoAdminUsuario.value = null;
    novoAdminPermissoes.value = {
      podeLer: true,
      podeEditarLista: false,
      podeAdicionarItens: false,
      podeEditarItens: false,
      podeRemoverItens: false,
    };

    administradores.value.push(vinculo);
    emit('administradoresAlterados');
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao vincular administrador',
    });
  } finally {
    salvandoNovo.value = false;
  }
}

async function atualizarPermissao(
  admin: ListaAdministradorItem,
  campo: 'podeLer' | 'podeEditarLista' | 'podeAdicionarItens' | 'podeEditarItens' | 'podeRemoverItens',
  valor: boolean,
) {
  const backup = admin[campo];
  admin[campo] = valor;

  try {
    await listaService.atualizarPermissoesAdministrador(
      props.listaIdOuCodigo,
      admin.usuarioId,
      { [campo]: valor },
    );
    $q.notify({
      type: 'positive',
      message: 'Permissão atualizada!',
      timeout: 1000,
    });
    emit('administradoresAlterados');
  } catch (error: any) {
    admin[campo] = backup;
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao atualizar permissão',
    });
  }
}

function confirmarRemoverAdministrador(admin: ListaAdministradorItem) {
  $q.dialog({
    title: 'Desvincular administrador',
    message: `Deseja realmente remover o acesso de ${admin.usuario?.nome || 'este administrador'} a esta lista?`,
    cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
    ok: { label: 'Remover', color: 'negative', unelevated: true },
  }).onOk(() => {
    void removerAdministrador(admin);
  });
}

async function removerAdministrador(admin: ListaAdministradorItem) {
  try {
    await listaService.removerAdministrador(props.listaIdOuCodigo, admin.usuarioId);
    administradores.value = administradores.value.filter((a) => a.usuarioId !== admin.usuarioId);
    $q.notify({
      type: 'positive',
      message: 'Administrador desvinculado com sucesso!',
    });
    emit('administradoresAlterados');
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Erro ao desvincular administrador',
    });
  }
}

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      void carregarDados();
    }
  },
);
</script>

<style scoped>
.border-grey {
  border: 1px solid #e0e0e0;
}
</style>

