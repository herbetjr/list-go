<template>
  <div class="row justify-center">
    <div class="col-12 col-xl-10">

      <!-- Cabeçalho com Título e Lápis de Edição -->
      <div class="row items-center justify-center q-mb-lg q-gutter-x-sm">
        <div
          class="text-h4 text-weight-bold text-primary-dark text-center"
          :class="{ 'cursor-pointer': podeEditarLista }"
          @click="podeEditarLista && abrirEditarTitulo()"
        >
          {{ lista?.titulo || 'Carregando lista...' }}
        </div>
        <q-btn
          v-if="podeEditarLista"
          flat
          round
          dense
          color="warning"
          icon="edit"
          size="sm"
          @click="abrirEditarTitulo"
        >
          <q-tooltip>Editar nome da lista</q-tooltip>
        </q-btn>
      </div>

      <!-- Layout Principal (2 Colunas no App, 1 Coluna Centralizada no Compartilhado ou se não puder adicionar) -->
      <div class="row q-col-gutter-lg" :class="(modoCompartilhado || !podeAdicionarItens) ? 'justify-center' : 'items-start'">

        <!-- Coluna da Esquerda: Tabela de Itens -->
        <div :class="(modoCompartilhado || !podeAdicionarItens) ? 'col-12 col-lg-10' : 'col-12 col-md-8'">
          <q-card class="rounded-card bg-white q-pa-none overflow-hidden shadow-2">
            <div class="q-pa-md q-pb-none row items-center justify-between">
              <div class="text-weight-bold text-subtitle1 text-grey-8">
                Itens da Lista ({{ lista?.itens?.length || 0 }})
              </div>
              <div class="text-caption text-grey-6" v-if="nomeUsuarioAtual">
                Participando como: <strong class="text-primary">{{ nomeUsuarioAtual }}</strong>
              </div>
            </div>

            <div class="q-pa-md">
              <table class="tabela-lista">
                <thead>
                  <tr>
                    <th :style="{ width: (modoCompartilhado || (!podeEditarItens && !podeRemoverItens)) ? '54%' : '44%' }">O quê</th>
                    <th :style="{ width: (modoCompartilhado || (!podeEditarItens && !podeRemoverItens)) ? '20%' : '18%' }">Qtd.</th>
                    <th :style="{ width: (modoCompartilhado || (!podeEditarItens && !podeRemoverItens)) ? '26%' : '24%' }">Quem</th>
                    <th v-if="!modoCompartilhado && (podeEditarItens || podeRemoverItens)" style="width: 14%; text-align: right"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!itensOrdenados || itensOrdenados.length === 0">
                    <td :colspan="(modoCompartilhado || (!podeEditarItens && !podeRemoverItens)) ? 3 : 4" class="text-center text-grey-5 q-py-xl">
                      <q-icon name="shopping_cart" size="48px" class="q-mb-sm text-grey-3" />
                      <div>Nenhum item na lista ainda.</div>
                      <div v-if="!modoCompartilhado && podeAdicionarItens" class="text-caption">Use o painel ao lado para adicionar o primeiro item!</div>
                    </td>
                  </tr>

                  <tr
                    v-for="item in itensOrdenados"
                    :key="item.id"
                    class="item-row"
                  >
                    <!-- O quê -->
                    <td>
                      <span
                        class="text-weight-medium text-body1"
                        :class="!item.responsavelNome ? 'item-precisamos' : 'item-confirmado'"
                      >
                        {{ item.descricao }}
                      </span>
                    </td>

                    <!-- Qtd -->
                    <td>
                      <span class="text-weight-bold text-grey-8">
                        {{ item.quantidade }}
                      </span>
                    </td>

                    <!-- Quem -->
                    <td>
                      <!-- Se já tem responsável -->
                      <q-chip
                        v-if="item.responsavelNome"
                        :clickable="podeClicarChip(item)"
                        :disable="!podeClicarChip(item)"
                        :color="podeClicarChip(item) ? 'light-blue-1' : 'grey-2'"
                        :text-color="podeClicarChip(item) ? 'primary' : 'grey-7'"
                        icon="person"
                        class="q-ma-none text-weight-bold"
                        @click="podeClicarChip(item) && solicitarAssumirOuAlterar(item)"
                      >
                        {{ item.responsavelNome }}
                        <q-tooltip>
                          {{ podeClicarChip(item) ? 'Clique para alterar ou liberar' : `Assumido por ${item.responsavelNome}` }}
                        </q-tooltip>
                      </q-chip>

                      <!-- Se NÃO tem responsável -->
                      <q-btn
                        v-else
                        outline
                        dense
                        no-caps
                        color="primary"
                        label="Marcar meu item"
                        class="btn-marcar-item q-px-sm"
                        @click="solicitarAssumirOuAlterar(item)"
                      >
                        <q-tooltip>Ninguém assumiu ainda. Clique para dizer que você leva!</q-tooltip>
                      </q-btn>
                    </td>

                    <!-- Ação: Editar e Excluir (Administrador) -->
                    <td v-if="!modoCompartilhado && (podeEditarItens || podeRemoverItens)" style="text-align: right">
                      <div class="row no-wrap justify-end q-gutter-x-xs">
                        <q-btn
                          v-if="podeEditarItens"
                          flat
                          round
                          dense
                          color="primary"
                          icon="edit"
                          size="sm"
                          @click="abrirEditarItem(item)"
                        >
                          <q-tooltip>Editar item</q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="podeRemoverItens"
                          flat
                          round
                          dense
                          color="grey-6"
                          icon="delete_outline"
                          size="sm"
                          @click="excluirItem(item)"
                        >
                          <q-tooltip>Remover item</q-tooltip>
                        </q-btn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </q-card>
        </div>

        <!-- Coluna da Direita: Card Adicionar Item (Oculto no link compartilhado ou sem permissão) -->
        <div v-if="!modoCompartilhado && podeAdicionarItens" class="col-12 col-md-4">
          <q-card class="rounded-card bg-white q-pa-lg shadow-2">
            <div class="text-h6 text-weight-bold text-dark q-mb-md">
              Adicionar item
            </div>

            <q-form @submit.prevent="adicionarComoPrecisamosDe" class="q-gutter-y-md">
              <!-- O que deseja adicionar? -->
              <q-input
                v-model="novoItemDescricao"
                outlined
                dense
                placeholder="O que deseja adicionar?"
                bg-color="grey-1"
                @keyup.enter="adicionarComoPrecisamosDe"
              />

              <!-- Quantidade -->
              <q-input
                v-model="novoItemQuantidade"
                outlined
                dense
                type="text"
                placeholder="1"
                bg-color="grey-1"
                style="max-width: 100%"
                @keyup.enter="adicionarComoPrecisamosDe"
              />

              <!-- Botão: Adicionar item -->
              <q-btn
                unelevated
                class="full-width btn-action-yellow q-py-sm"
                label="Adicionar item."
                :loading="salvandoItem"
                @click="adicionarComoPrecisamosDe"
              />

            </q-form>
          </q-card>
        </div>

      </div>

    </div>

    <!-- Modal Editar Título da Lista -->
    <q-dialog v-model="modalEditarTitulo">
      <q-card style="width: 100%; max-width: 400px; border-radius: 16px" class="q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Renomear lista</div>
          <q-input
            v-model="tituloTemporario"
            outlined
            dense
            autofocus
            class="q-mt-md"
            placeholder="Novo título da lista"
            @keyup.enter="salvarNovoTitulo"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated label="Salvar" class="btn-action-green" @click="salvarNovoTitulo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Assumir Item Aberto (?) -->
    <q-dialog v-model="modalAssumirItem">
      <q-card style="width: 100%; max-width: 420px; border-radius: 16px" class="q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Quem leva este item?</div>
          <div class="text-subtitle1 text-primary q-mt-xs text-weight-bold">
            {{ itemSelecionado?.descricao }} (Qtd total: {{ itemSelecionado?.quantidade }})
          </div>

          <div class="q-gutter-y-md q-mt-md">
            <!-- Se for link compartilhado e o participante já tiver nome definido, não mostra o input -->
            <div
              v-if="modoCompartilhado && nomeUsuarioAtual"
              class="row items-center q-pa-sm rounded-borders bg-grey-1 text-grey-8"
              style="border: 1px solid #e2e8f0; border-radius: 8px"
            >
              <q-icon name="person" color="primary" size="20px" class="q-mr-xs" />
              <span>Participando como: <strong class="text-primary">{{ nomeUsuarioAtual }}</strong></span>
            </div>

            <!-- Caso contrário (primeira vez no compartilhado ou administrador), exibe o input -->
            <q-input
              v-else
              v-model="nomeParaAssumir"
              outlined
              dense
              label="Seu nome"
              placeholder="Digite o nome de quem vai levar"
              autofocus
              @keyup.enter="confirmarAssumirItem"
            />

            <!-- Se quantidade for maior que 1, permite definir quanto vai levar -->
            <div v-if="podeDividirQuantidade">
              <div class="text-caption text-grey-8 text-weight-medium q-mb-xs">
                Quanto você vai levar?
              </div>
              <q-input
                v-model.number="quantidadeParaAssumir"
                type="number"
                outlined
                dense
                :min="1"
                :max="qtdMaximaItem"
                :autofocus="modoCompartilhado && !!nomeUsuarioAtual"
                placeholder="Ex: 6"
                :rules="[
                  (v) => (v >= 1 && v <= qtdMaximaItem) || `Informe uma quantidade entre 1 e ${qtdMaximaItem}`
                ]"
                @keyup.enter="confirmarAssumirItem"
              >
                <template #append>
                  <span class="text-caption text-grey-6">de {{ qtdMaximaItem }}</span>
                </template>
              </q-input>

              <div
                v-if="quantidadeParaAssumir < qtdMaximaItem && quantidadeParaAssumir >= 1"
                class="text-caption text-grey-7"
              >
                Restará <strong>{{ qtdMaximaItem - quantidadeParaAssumir }}</strong> na lista disponível para outros levarem.
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="between">
          <q-btn
            v-if="podeLiberarItem"
            flat
            label="Deixar sem ninguém"
            color="warning"
            :loading="salvandoItem"
            @click="liberarItem"
          />
          <div v-else></div>

          <div class="row q-gutter-x-sm">
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn
              unelevated
              label="Eu levo!"
              class="btn-action-green"
              :loading="salvandoItem"
              @click="confirmarAssumirItem"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Editar Item (Administrador) -->
    <q-dialog v-model="modalEditarItem">
      <q-card style="width: 100%; max-width: 440px; border-radius: 16px" class="q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold row items-center q-gutter-x-sm">
            <q-icon name="edit" color="primary" />
            <span>Editar item</span>
          </div>

          <div class="q-gutter-y-md q-mt-md">
            <q-input
              v-model="editItemDescricao"
              outlined
              dense
              label="O que levar"
              placeholder="Ex: Arroz, Carne, Refrigerante"
              autofocus
              :rules="[(v) => !!v.trim() || 'Informe a descrição do item']"
              @keyup.enter="salvarEdicaoItem"
            />
            <q-input
              v-model="editItemQuantidade"
              outlined
              dense
              label="Quantidade"
              placeholder="Ex: 1, 2kg, 3 garrafas"
              @keyup.enter="salvarEdicaoItem"
            />
            <q-input
              v-model="editItemResponsavel"
              outlined
              dense
              label="Quem leva (opcional)"
              placeholder="Deixe em branco para deixar em aberto (?)"
              @keyup.enter="salvarEdicaoItem"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Salvar alterações"
            class="btn-action-green"
            :loading="salvandoEdicaoItem"
            @click="salvarEdicaoItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo Compartilhar QR Code -->
    <QrCodeDialog
      v-model="modalCompartilhar"
      :codigo-compartilhamento="lista?.codigoCompartilhamento || ''"
      :titulo-lista="lista?.titulo || ''"
    />

    <!-- Diálogo Gerenciar Administradores da Lista (Apenas Dono) -->
    <GerenciarAdministradoresListaDialog
      v-if="isDonoDaLista"
      v-model="modalAdministradores"
      :lista-id-ou-codigo="props.idOuCodigo"
      :titulo-lista="lista?.titulo || ''"
      @administradores-alterados="recarregarLista"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { ItemLista, Lista } from '@/types/lista.types';
import { useListaStore } from '@/stores/lista.store';
import { useAuthStore } from '@/stores/auth.store';
import QrCodeDialog from '@/components/QrCodeDialog.vue';
import GerenciarAdministradoresListaDialog from '@/components/GerenciarAdministradoresListaDialog.vue';

const props = withDefaults(
  defineProps<{
    idOuCodigo: string;
    modoCompartilhado?: boolean;
  }>(),
  {
    modoCompartilhado: false,
  },
);

const $q = useQuasar();
const listaStore = useListaStore();
const authStore = useAuthStore();

const lista = computed(() => listaStore.listaAtual);

const itensOrdenados = computed(() => {
  if (!lista.value?.itens) return [];
  // Mantém itens sem responsável no topo
  return [...lista.value.itens].sort((a, b) => {
    const aSemResp = !a.responsavelNome || !a.responsavelNome.trim();
    const bSemResp = !b.responsavelNome || !b.responsavelNome.trim();
    if (aSemResp && !bSemResp) return -1;
    if (!aSemResp && bSemResp) return 1;
    return 0;
  });
});

const novoItemDescricao = ref('');
const novoItemQuantidade = ref('1');
const salvandoItem = ref(false);

const modalCompartilhar = ref(false);
const modalEditarTitulo = ref(false);
const tituloTemporario = ref('');

const modalAssumirItem = ref(false);
const itemSelecionado = ref<ItemLista | null>(null);
const nomeParaAssumir = ref('');
const quantidadeParaAssumir = ref(1);

const qtdMaximaItem = computed(() => {
  if (!itemSelecionado.value) return 1;
  const num = parseInt(itemSelecionado.value.quantidade, 10);
  return isNaN(num) || num < 1 ? 1 : num;
});

const podeDividirQuantidade = computed(() => {
  return qtdMaximaItem.value > 1;
});

const podeLiberarItem = computed(() => {
  if (!itemSelecionado.value?.responsavelNome) return false;

  // Administrador logado no painel interno pode liberar qualquer item
  if (!props.modoCompartilhado) return true;

  // No link compartilhado, só pode liberar se estiver marcado com o mesmo nome que o participante informou
  const nomeAtual = (nomeUsuarioAtual.value || nomeParaAssumir.value).trim().toLowerCase();
  const respItem = itemSelecionado.value.responsavelNome.trim().toLowerCase();
  return Boolean(nomeAtual && nomeAtual === respItem);
});

const modalEditarItem = ref(false);
const itemEmEdicao = ref<ItemLista | null>(null);
const editItemDescricao = ref('');
const editItemQuantidade = ref('');
const editItemResponsavel = ref('');
const salvandoEdicaoItem = ref(false);

const CHAVE_NOME_LOCAL = 'lista-go:participante-nome';
const nomeUsuarioLocal = ref(localStorage.getItem(CHAVE_NOME_LOCAL) || '');

// Se estiver logado, usa o nome do usuário autenticado; caso contrário, o nome do participante salvo localmente
const nomeUsuarioAtual = computed(() => {
  if (authStore.usuario?.nome) return authStore.usuario.nome;
  return nomeUsuarioLocal.value || '';
});

function isMeuItem(item: ItemLista): boolean {
  if (!item.responsavelNome) return false;
  if (!props.modoCompartilhado) return true; // Administrador logado pode gerenciar todos
  const nomeAtual = nomeUsuarioAtual.value.trim().toLowerCase();
  return Boolean(nomeAtual && nomeAtual === item.responsavelNome.trim().toLowerCase());
}

function podeClicarChip(item: ItemLista): boolean {
  if (!props.modoCompartilhado) return true;
  return isMeuItem(item);
}

let intervalAutoAtualizacao: ReturnType<typeof setInterval> | null = null;

function iniciarAtualizacaoAutomatica() {
  pararAtualizacaoAutomatica();
  intervalAutoAtualizacao = setInterval(() => {
    // Atualiza a cada 5s sem atrapalhar caso o usuário esteja salvando alterações
    if (!salvandoItem.value && !salvandoEdicaoItem.value && props.idOuCodigo) {
      void listaStore.carregarLista(props.idOuCodigo);
    }
  }, 5000);
}

function pararAtualizacaoAutomatica() {
  if (intervalAutoAtualizacao) {
    clearInterval(intervalAutoAtualizacao);
    intervalAutoAtualizacao = null;
  }
}

onMounted(async () => {
  await carregarDados();
  iniciarAtualizacaoAutomatica();
});

onUnmounted(() => {
  pararAtualizacaoAutomatica();
});

watch(
  () => props.idOuCodigo,
  (novoId) => {
    if (novoId) {
      void carregarDados();
      iniciarAtualizacaoAutomatica();
    }
  },
);

async function carregarDados() {
  try {
    await listaStore.carregarLista(props.idOuCodigo);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível carregar a lista.',
      position: 'top',
    });
  }
}

function abrirEditarTitulo() {
  tituloTemporario.value = lista.value?.titulo || '';
  modalEditarTitulo.value = true;
}

async function salvarNovoTitulo() {
  if (!tituloTemporario.value.trim()) return;
  try {
    await listaStore.atualizarTituloLista(props.idOuCodigo, tituloTemporario.value.trim());
    modalEditarTitulo.value = false;
    $q.notify({
      type: 'positive',
      message: 'Título da lista atualizado!',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao atualizar título da lista.',
      position: 'top',
    });
  }
}

async function adicionarComoPrecisamosDe() {
  if (!novoItemDescricao.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Informe o que deseja adicionar.',
      position: 'top',
    });
    return;
  }

  salvandoItem.value = true;
  try {
    await listaStore.adicionarItem(props.idOuCodigo, {
      descricao: novoItemDescricao.value.trim(),
      quantidade: novoItemQuantidade.value.trim() || '1',
      responsavelNome: null,
    });
    novoItemDescricao.value = '';
    novoItemQuantidade.value = '1';
    $q.notify({
      type: 'info',
      message: 'Item adicionado! Qualquer pessoa pode assumi-lo agora.',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao adicionar item.',
      position: 'top',
    });
  } finally {
    salvandoItem.value = false;
  }
}

function solicitarAssumirOuAlterar(item: ItemLista) {
  // No link compartilhado, itens de outros participantes não podem ser abertos para alteração
  if (props.modoCompartilhado && item.responsavelNome && !isMeuItem(item)) {
    return;
  }

  itemSelecionado.value = item;
  nomeParaAssumir.value = (props.modoCompartilhado && nomeUsuarioAtual.value)
    ? nomeUsuarioAtual.value
    : (item.responsavelNome || nomeUsuarioAtual.value || '');

  const num = parseInt(item.quantidade, 10);
  quantidadeParaAssumir.value = isNaN(num) || num < 1 ? 1 : num;
  modalAssumirItem.value = true;
}

async function confirmarAssumirItem() {
  if (!itemSelecionado.value) return;

  // No link compartilhado, impede alterar item assumido por outra pessoa
  if (props.modoCompartilhado && itemSelecionado.value.responsavelNome && !isMeuItem(itemSelecionado.value)) {
    $q.notify({
      type: 'warning',
      message: 'Você não pode alterar o item assumido por outro participante.',
      position: 'top',
    });
    return;
  }

  const nomeLimpo = (props.modoCompartilhado && nomeUsuarioAtual.value)
    ? nomeUsuarioAtual.value.trim()
    : nomeParaAssumir.value.trim();

  if (!nomeLimpo) {
    $q.notify({
      type: 'warning',
      message: 'Informe o nome de quem vai levar o item.',
      position: 'top',
    });
    return;
  }
  if (!nomeLimpo) {
    $q.notify({
      type: 'warning',
      message: 'Informe o nome de quem vai levar o item.',
      position: 'top',
    });
    return;
  }

  // Atualiza nome local se não havia
  if (!nomeUsuarioAtual.value) {
    nomeUsuarioLocal.value = nomeLimpo;
    localStorage.setItem(CHAVE_NOME_LOCAL, nomeLimpo);
  }

  const max = qtdMaximaItem.value;
  const assumida = podeDividirQuantidade.value
    ? Math.max(1, Math.min(max, Math.floor(Number(quantidadeParaAssumir.value) || max)))
    : max;

  salvandoItem.value = true;
  try {
    // Se a quantidade assumida for menor que o total, divide o item!
    if (podeDividirQuantidade.value && assumida < max) {
      const restante = max - assumida;
      const itemAtual = itemSelecionado.value;

      // Procura outro item com a mesma descrição que já esteja sem responsável (igual à lógica do botão deixar sem ninguém)
      const itemMesmoNomeSemResponsavel = listaStore.listaAtual?.itens.find((i) => {
        return (
          i.id !== itemAtual.id &&
          !i.responsavelNome &&
          i.descricao.trim().toLowerCase() === itemAtual.descricao.trim().toLowerCase()
        );
      });

      if (itemMesmoNomeSemResponsavel) {
        const qtdExistente = parseInt(itemMesmoNomeSemResponsavel.quantidade, 10);
        const novaQtd = !isNaN(qtdExistente)
          ? String(qtdExistente + restante)
          : String(restante);

        // 1. Atualiza o item existente sem responsável somando a quantidade restante
        await listaStore.atualizarItem(props.idOuCodigo, itemMesmoNomeSemResponsavel.id, {
          quantidade: novaQtd,
          responsavelNome: null,
        });

        // 2. Atualiza o item atual com a quantidade assumida pelo usuário
        await listaStore.atualizarItem(props.idOuCodigo, itemAtual.id, {
          quantidade: String(assumida),
          responsavelNome: nomeLimpo,
        });

        $q.notify({
          type: 'positive',
          message: `${nomeLimpo} assumiu ${assumida} unidade(s). Quantidades reunidas na lista (${novaQtd} disponíveis)!`,
          position: 'top',
        });
      } else {
        // Se NÃO houver outro item idêntico sem responsável:
        // 1. Atualiza o item atual com a quantidade assumida
        await listaStore.atualizarItem(props.idOuCodigo, itemAtual.id, {
          quantidade: String(assumida),
          responsavelNome: nomeLimpo,
        });

        // 2. Cria a nova linha com a quantidade restante disponível sem responsável
        await listaStore.adicionarItem(props.idOuCodigo, {
          descricao: itemAtual.descricao,
          quantidade: String(restante),
          responsavelNome: null,
        });

        $q.notify({
          type: 'positive',
          message: `${nomeLimpo} assumiu ${assumida} unidade(s). Restam ${restante} na lista!`,
          position: 'top',
        });
      }
    } else {
      // Assume o item inteiro (sem divisão)
      await listaStore.atualizarItem(props.idOuCodigo, itemSelecionado.value.id, {
        quantidade: String(assumida),
        responsavelNome: nomeLimpo,
      });

      $q.notify({
        type: 'positive',
        message: `Item assumido por ${nomeLimpo}!`,
        position: 'top',
      });
    }

    modalAssumirItem.value = false;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao atualizar responsável pelo item.',
      position: 'top',
    });
  } finally {
    salvandoItem.value = false;
  }
}

async function liberarItem() {
  if (!itemSelecionado.value) return;

  // Validação no link compartilhado: só pode liberar se estiver marcado com o nome informado
  if (props.modoCompartilhado) {
    const nomeAtual = (nomeUsuarioAtual.value || nomeParaAssumir.value).trim().toLowerCase();
    const respItem = itemSelecionado.value.responsavelNome?.trim().toLowerCase();
    if (!nomeAtual || nomeAtual !== respItem) {
      $q.notify({
        type: 'warning',
        message: 'No link compartilhado, você só pode liberar itens marcados com o seu nome.',
        position: 'top',
      });
      return;
    }
  }

  salvandoItem.value = true;
  try {
    const itemAtual = itemSelecionado.value;
    // Procura outro item com a mesma descrição que já esteja sem responsável
    const itemMesmoNomeSemResponsavel = listaStore.listaAtual?.itens.find((i) => {
      return (
        i.id !== itemAtual.id &&
        !i.responsavelNome &&
        i.descricao.trim().toLowerCase() === itemAtual.descricao.trim().toLowerCase()
      );
    });

    if (itemMesmoNomeSemResponsavel) {
      const qtdAtual = parseInt(itemAtual.quantidade, 10);
      const qtdExistente = parseInt(itemMesmoNomeSemResponsavel.quantidade, 10);

      const novaQtd =
        !isNaN(qtdAtual) && !isNaN(qtdExistente)
          ? String(qtdAtual + qtdExistente)
          : itemMesmoNomeSemResponsavel.quantidade;

      // 1. Atualiza o item que já estava sem responsável com a soma das quantidades
      await listaStore.atualizarItem(props.idOuCodigo, itemMesmoNomeSemResponsavel.id, {
        quantidade: novaQtd,
        responsavelNome: null,
      });

      // 2. Remove o item atual que foi abandonado
      await listaStore.removerItem(props.idOuCodigo, itemAtual.id);

      $q.notify({
        type: 'info',
        message: `Quantidades reunidas! Agora há ${novaQtd} de "${itemAtual.descricao}" disponíveis na lista.`,
        position: 'top',
      });
    } else {
      // Se não houver outro item idêntico sem responsável, apenas desvincula o responsável
      await listaStore.atualizarItem(props.idOuCodigo, itemAtual.id, {
        responsavelNome: null,
      });

      $q.notify({
        type: 'info',
        message: 'Item agora está sem responsável definido.',
        position: 'top',
      });
    }

    modalAssumirItem.value = false;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao liberar item.',
      position: 'top',
    });
  } finally {
    salvandoItem.value = false;
  }
}

function excluirItem(item: ItemLista) {
  $q.dialog({
    title: 'Remover item',
    message: `Deseja remover "${item.descricao}" da lista?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Remover', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await listaStore.removerItem(props.idOuCodigo, item.id);
      $q.notify({
        type: 'positive',
        message: 'Item removido!',
        position: 'top',
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Falha ao remover item.',
        position: 'top',
      });
    }
  });
}

function abrirEditarItem(item: ItemLista) {
  itemEmEdicao.value = item;
  editItemDescricao.value = item.descricao;
  editItemQuantidade.value = item.quantidade;
  editItemResponsavel.value = item.responsavelNome || '';
  modalEditarItem.value = true;
}

async function salvarEdicaoItem() {
  if (!itemEmEdicao.value) return;
  const desc = editItemDescricao.value.trim();
  if (!desc) {
    $q.notify({
      type: 'warning',
      message: 'A descrição do item não pode ser vazia.',
      position: 'top',
    });
    return;
  }

  salvandoEdicaoItem.value = true;
  try {
    await listaStore.atualizarItem(props.idOuCodigo, itemEmEdicao.value.id, {
      descricao: desc,
      quantidade: editItemQuantidade.value.trim() || '1',
      responsavelNome: editItemResponsavel.value.trim() || null,
    });
    modalEditarItem.value = false;
    $q.notify({
      type: 'positive',
      message: 'Item atualizado com sucesso!',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Falha ao atualizar o item.',
      position: 'top',
    });
  } finally {
    salvandoEdicaoItem.value = false;
  }
}

function abrirCompartilhar() {
  modalCompartilhar.value = true;
}

const isDonoDaLista = computed(() => {
  if (lista.value?.permissoes) {
    return Boolean(lista.value.permissoes.dono);
  }
  return Boolean(authStore.usuario?.id && lista.value?.usuarioId === authStore.usuario.id);
});

const podeEditarLista = computed(() => {
  if (props.modoCompartilhado) return false;
  if (lista.value?.permissoes) {
    return Boolean(lista.value.permissoes.podeEditarLista);
  }
  return true;
});

const podeAdicionarItens = computed(() => {
  if (props.modoCompartilhado) return false;
  if (lista.value?.permissoes) {
    return Boolean(lista.value.permissoes.podeAdicionarItens);
  }
  return true;
});

const podeEditarItens = computed(() => {
  if (props.modoCompartilhado) return false;
  if (lista.value?.permissoes) {
    return Boolean(lista.value.permissoes.podeEditarItens);
  }
  return true;
});

const podeRemoverItens = computed(() => {
  if (props.modoCompartilhado) return false;
  if (lista.value?.permissoes) {
    return Boolean(lista.value.permissoes.podeRemoverItens);
  }
  return true;
});

const modalAdministradores = ref(false);

function abrirAdministradores() {
  modalAdministradores.value = true;
}

function recarregarLista() {
  void listaStore.carregarLista(props.idOuCodigo);
}

defineExpose({
  abrirCompartilhar,
  modalCompartilhar,
  abrirAdministradores,
  modalAdministradores,
  isDonoDaLista,
});
</script>

<style scoped lang="scss">
.text-primary-dark {
  color: #0369a1;
}

.item-row {
  transition: background-color 0.2s ease;
}
.item-row:hover {
  background-color: #f8fafc;
}

/* Quando precisa de... (sem responsável), texto em tom alaranjado/âmbar conforme Anexo 3 */
.item-precisamos {
  color: #d97706;
}

.item-confirmado {
  color: #1e293b;
}

.btn-marcar-item {
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.btn-marcar-item:hover {
  background-color: rgba(14, 165, 233, 0.08);
}
</style>

