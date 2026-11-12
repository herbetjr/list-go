import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listaService } from '@/services/lista.service';
import type {
  AtualizarItemPayload,
  AtualizarListaPayload,
  CriarItemPayload,
  CriarListaPayload,
  ItemLista,
  Lista,
} from '@/types/lista.types';

export const useListaStore = defineStore('lista', () => {
  const minhasListas = ref<Lista[]>([]);
  const listaAtual = ref<Lista | null>(null);
  const loading = ref(false);

  async function carregarMinhasListas() {
    loading.value = true;
    try {
      minhasListas.value = await listaService.listarMinhasListas();
    } finally {
      loading.value = false;
    }
  }

  async function carregarLista(idOuCodigo: string) {
    loading.value = true;
    try {
      listaAtual.value = await listaService.obterPorIdOuCodigo(idOuCodigo);
      return listaAtual.value;
    } finally {
      loading.value = false;
    }
  }

  async function criarLista(payload: CriarListaPayload) {
    loading.value = true;
    try {
      const nova = await listaService.criarLista(payload);
      minhasListas.value.unshift(nova);
      listaAtual.value = nova;
      return nova;
    } finally {
      loading.value = false;
    }
  }

  async function atualizarTituloLista(idOuCodigo: string, titulo: string) {
    const atualizada = await listaService.atualizarLista(idOuCodigo, { titulo });
    if (listaAtual.value && (listaAtual.value.id === idOuCodigo || listaAtual.value.codigoCompartilhamento === idOuCodigo)) {
      listaAtual.value.titulo = atualizada.titulo;
    }
    const idx = minhasListas.value.findIndex(
      (l) => l.id === idOuCodigo || l.codigoCompartilhamento === idOuCodigo,
    );
    if (idx !== -1 && minhasListas.value[idx]) {
      minhasListas.value[idx].titulo = atualizada.titulo;
    }
    return atualizada;
  }

  async function excluirLista(idOuCodigo: string) {
    await listaService.excluirLista(idOuCodigo);
    minhasListas.value = minhasListas.value.filter(
      (l) => l.id !== idOuCodigo && l.codigoCompartilhamento !== idOuCodigo,
    );
    if (listaAtual.value && (listaAtual.value.id === idOuCodigo || listaAtual.value.codigoCompartilhamento === idOuCodigo)) {
      listaAtual.value = null;
    }
  }

  async function adicionarItem(idOuCodigo: string, payload: CriarItemPayload) {
    const item = await listaService.adicionarItem(idOuCodigo, payload);
    if (listaAtual.value) {
      listaAtual.value.itens.push(item);
    }
    return item;
  }

  async function atualizarItem(
    idOuCodigo: string,
    itemId: string,
    payload: AtualizarItemPayload,
  ) {
    const item = await listaService.atualizarItem(idOuCodigo, itemId, payload);
    if (listaAtual.value) {
      const idx = listaAtual.value.itens.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        listaAtual.value.itens[idx] = item;
      }
    }
    return item;
  }

  async function removerItem(idOuCodigo: string, itemId: string) {
    await listaService.removerItem(idOuCodigo, itemId);
    if (listaAtual.value) {
      listaAtual.value.itens = listaAtual.value.itens.filter((i) => i.id !== itemId);
    }
  }

  return {
    minhasListas,
    listaAtual,
    loading,
    carregarMinhasListas,
    carregarLista,
    criarLista,
    atualizarTituloLista,
    excluirLista,
    adicionarItem,
    atualizarItem,
    removerItem,
  };
});

