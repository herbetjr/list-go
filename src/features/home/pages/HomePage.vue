<template>
  <q-page class="q-py-xl q-px-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">

        <!-- Card Central: Criar Nova Lista (Apenas Administrador) -->
        <q-card v-if="authStore.isAdmin" class="rounded-card bg-white q-pa-lg q-mb-xl text-center shadow-3">
          <q-card-section class="q-py-sm">
            <h1 class="text-h4 text-weight-bolder text-dark q-my-none">
              Quem leva o quê?
            </h1>
            <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-lg">
              Crie uma lista, compartilhe e combine quem leva o quê.
            </p>

            <q-form @submit.prevent="onCriarLista" class="q-gutter-y-md">
              <q-input
                v-model="novoTitulo"
                outlined
                rounded
                class="full-width"
                bg-color="grey-1"
                placeholder="Título da sua nova lista"
                :rules="[(val) => (val && val.trim().length > 0) || 'Informe o título da lista']"
              >
                <template #prepend>
                  <q-icon name="drive_file_rename_outline" color="primary" />
                </template>
              </q-input>

              <q-btn
                type="submit"
                unelevated
                class="full-width btn-action-green q-py-sm text-subtitle1"
                label="Criar"
                size="lg"
                :loading="criando"
              />
            </q-form>
          </q-card-section>
        </q-card>

        <!-- Banner para Usuário do tipo 'user': apenas acompanhar listas abertas -->
        <div v-else class="q-mb-xl text-center">
          <h1 class="text-h4 text-weight-bolder text-primary q-my-none">
            Listas Abertas
          </h1>
          <p class="text-subtitle1 text-grey-7 q-mt-xs q-mb-none">
            Acompanhe os itens das listas e participe informando o que você vai levar!
          </p>
        </div>

        <!-- Seção: Explore outros tipos de listas (Apenas Administrador) -->
        <div v-if="authStore.isAdmin" class="text-center q-mb-lg">
          <h2 class="text-h6 text-weight-bold text-dark q-my-none">
            Explore outros tipos de listas
          </h2>
        </div>

        <div v-if="authStore.isAdmin" class="row q-col-gutter-md q-mb-xl">
          <!-- Card 1: Quem leva o quê? (Ativo / Selecionada) -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="card-tipo-lista selecionada q-pa-md full-height column justify-between">
              <div>
                <div class="row items-center justify-between q-mb-md">
                  <q-icon name="shopping_bag" color="primary" size="32px" />
                  <q-badge color="light-blue-1" text-color="primary" class="text-weight-bold q-px-sm q-py-xs" style="border-radius: 6px">
                    Selecionada
                  </q-badge>
                </div>
                <div class="text-weight-bold text-subtitle1 q-mb-xs">
                  Quem leva o quê?
                </div>
                <div class="text-caption text-grey-7">
                  Crie uma lista, compartilhe e combine quem leva o quê.
                </div>
              </div>
            </q-card>
          </div>

          <!-- Card 2: Lista simples -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="card-tipo-lista q-pa-md full-height column justify-between" @click="notificarEmBreve('Lista simples')">
              <div>
                <div class="row items-center justify-between q-mb-md">
                  <q-icon name="format_list_bulleted" color="grey-6" size="32px" />
                </div>
                <div class="text-weight-bold text-subtitle1 q-mb-xs">
                  Lista simples
                </div>
                <div class="text-caption text-grey-7">
                  Adicione itens, compartilhe a lista e editem juntos.
                </div>
              </div>
            </q-card>
          </div>

          <!-- Card 3: Lista de participantes -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="card-tipo-lista q-pa-md full-height column justify-between" @click="notificarEmBreve('Lista de participantes')">
              <div>
                <div class="row items-center justify-between q-mb-md">
                  <q-icon name="groups" color="grey-6" size="32px" />
                </div>
                <div class="text-weight-bold text-subtitle1 q-mb-xs">
                  Lista de participantes
                </div>
                <div class="text-caption text-grey-7">
                  Crie uma lista, compartilhe e deixe os participantes adicionarem seus nomes.
                </div>
              </div>
            </q-card>
          </div>

          <!-- Card 4: Lista de tarefas compartilhada -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="card-tipo-lista q-pa-md full-height column justify-between" @click="notificarEmBreve('Lista de tarefas compartilhada')">
              <div>
                <div class="row items-center justify-between q-mb-md">
                  <q-icon name="done_all" color="grey-6" size="32px" />
                </div>
                <div class="text-weight-bold text-subtitle1 q-mb-xs">
                  Lista de tarefas compartilhada
                </div>
                <div class="text-caption text-grey-7">
                  Adicionem tarefas, dividam as responsabilidades e marquem o que foi feito.
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- Seção: Lista de listas no feature "Quem leva o quê" -->
        <div class="q-mt-xl">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <h3 class="text-h6 text-weight-bold text-dark q-my-none">
                {{ authStore.isAdmin ? 'Minhas Listas: Quem leva o quê?' : 'Listas Abertas: Quem leva o quê?' }}
              </h3>
              <p class="text-caption text-grey-7 q-my-none">
                {{ authStore.isAdmin ? 'Acesse suas listas criadas, edite ou compartilhe o link' : 'Acompanhe os itens das listas e participe informando o que você vai levar' }}
              </p>
            </div>
            <q-btn
              flat
              dense
              icon="refresh"
              color="primary"
              label="Atualizar"
              :loading="listaStore.loading"
              @click="listaStore.carregarMinhasListas"
            />
          </div>

          <!-- Lista vazia -->
          <q-card
            v-if="!listaStore.loading && listaStore.minhasListas.length === 0"
            class="rounded-card bg-white q-pa-xl text-center shadow-1"
          >
            <q-icon name="playlist_remove" size="64px" color="grey-4" />
            <div class="text-subtitle1 text-weight-medium text-grey-7 q-mt-md">
              {{ authStore.isAdmin ? 'Você ainda não tem listas criadas' : 'Nenhuma lista aberta disponível no momento' }}
            </div>
            <p class="text-caption text-grey-5 q-mb-none">
              {{ authStore.isAdmin ? 'Use o formulário acima para criar sua primeira lista e começar a organizar!' : 'As listas criadas pelos administradores aparecerão aqui para você acompanhar.' }}
            </p>
          </q-card>

          <!-- Grade de listas -->
          <div v-else class="row q-col-gutter-md">
            <div
              v-for="lista in listaStore.minhasListas"
              :key="lista.id"
              class="col-12 col-md-6"
            >
              <q-card class="rounded-card bg-white q-pa-md full-height column justify-between shadow-1 hover-shadow">
                <div>
                  <div class="row items-center justify-between q-mb-sm">
                    <span class="text-weight-bold text-h6 text-dark ellipsis" style="max-width: 70%">
                      {{ lista.titulo }}
                    </span>
                    <div class="row items-center q-gutter-x-xs">
                      <q-badge
                        v-if="lista.permissoes && !lista.permissoes.dono"
                        color="blue-1"
                        text-color="primary"
                        class="q-px-xs q-py-xs"
                      >
                        {{ authStore.isAdmin ? 'Compartilhada' : 'Aberta' }}
                      </q-badge>
                      <q-badge color="light-blue-1" text-color="primary" class="q-px-sm q-py-xs">
                        {{ lista.itens?.length || 0 }} {{ (lista.itens?.length || 0) === 1 ? 'item' : 'itens' }}
                      </q-badge>
                    </div>
                  </div>

                  <div class="text-caption text-grey-6 q-mb-md row items-center q-gutter-x-sm">
                    <q-icon name="event" size="14px" />
                    <span>Criada em {{ formatarData(lista.criadoEm) }}</span>
                  </div>

                  <!-- Resumo dos itens -->
                  <div v-if="lista.itens && lista.itens.length > 0" class="q-mb-md bg-grey-1 q-pa-sm" style="border-radius: 8px">
                    <div class="text-caption text-grey-8 row items-center justify-between">
                      <span>Assumidos: <strong>{{ itensComResponsavel(lista) }}</strong></span>
                      <span>Precisamos de: <strong class="text-warning">{{ itensSemResponsavel(lista) }}</strong></span>
                    </div>
                  </div>
                </div>

                <div class="row items-center justify-between q-pt-sm" style="border-top: 1px solid #f1f5f9">
                  <div class="row q-gutter-x-xs">
                    <q-btn
                      flat
                      round
                      dense
                      color="primary"
                      icon="share"
                      @click="abrirCompartilhar(lista)"
                    >
                      <q-tooltip>Compartilhar lista</q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="authStore.isAdmin && (lista.permissoes ? lista.permissoes.dono : true)"
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete_outline"
                      @click="confirmarExclusao(lista)"
                    >
                      <q-tooltip>Excluir lista</q-tooltip>
                    </q-btn>
                  </div>

                  <q-btn
                    unelevated
                    dense
                    no-caps
                    class="btn-action-green q-px-md"
                    label="Abrir lista"
                    icon-right="arrow_forward"
                    @click="abrirLista(lista.id)"
                  />
                </div>
              </q-card>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Diálogo de Compartilhamento -->
    <QrCodeDialog
      v-model="modalCompartilhar"
      :codigo-compartilhamento="listaSelecionada?.codigoCompartilhamento || ''"
      :titulo-lista="listaSelecionada?.titulo || ''"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useListaStore } from '@/stores/lista.store';
import { useAuthStore } from '@/stores/auth.store';
import type { Lista } from '@/types/lista.types';
import QrCodeDialog from '@/components/QrCodeDialog.vue';

const router = useRouter();
const $q = useQuasar();
const listaStore = useListaStore();
const authStore = useAuthStore();

const novoTitulo = ref('');
const criando = ref(false);

const modalCompartilhar = ref(false);
const listaSelecionada = ref<Lista | null>(null);

onMounted(() => {
  void listaStore.carregarMinhasListas();
});

async function onCriarLista() {
  if (!novoTitulo.value.trim()) return;
  criando.value = true;
  try {
    const lista = await listaStore.criarLista({
      titulo: novoTitulo.value.trim(),
    });
    novoTitulo.value = '';
    $q.notify({
      type: 'positive',
      message: 'Lista criada com sucesso!',
      position: 'top',
    });
    void router.push(`/app/lista/${lista.id}`);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao criar lista',
      position: 'top',
    });
  } finally {
    criando.value = false;
  }
}

function abrirLista(id: string) {
  void router.push(`/app/lista/${id}`);
}

function abrirCompartilhar(lista: Lista) {
  listaSelecionada.value = lista;
  modalCompartilhar.value = true;
}

function confirmarExclusao(lista: Lista) {
  $q.dialog({
    title: 'Excluir lista',
    message: `Tem certeza que deseja excluir a lista "${lista.titulo}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await listaStore.excluirLista(lista.id);
      $q.notify({
        type: 'positive',
        message: 'Lista excluída com sucesso',
        position: 'top',
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Falha ao excluir lista',
        position: 'top',
      });
    }
  });
}

function notificarEmBreve(tipo: string) {
  $q.notify({
    type: 'info',
    message: `O modelo "${tipo}" estará disponível em breve!`,
    position: 'top',
  });
}

function formatarData(dataIso?: string): string {
  if (!dataIso) return '';
  const d = new Date(dataIso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function itensComResponsavel(lista: Lista): number {
  return lista.itens?.filter((i) => !!i.responsavelNome).length || 0;
}

function itensSemResponsavel(lista: Lista): number {
  return lista.itens?.filter((i) => !i.responsavelNome).length || 0;
}
</script>

<style scoped>
.hover-shadow {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.hover-shadow:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
}
</style>

