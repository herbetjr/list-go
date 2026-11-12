import { http, BASE_URL } from './http';
import type {
  AtualizarItemPayload,
  AtualizarListaPayload,
  AtualizarPermissoesAdministradorPayload,
  CriarItemPayload,
  CriarListaPayload,
  ItemLista,
  Lista,
  ListaAdministradorItem,
  VincularAdministradorPayload,
} from '@/types/lista.types';

export const listaService = {
  listarMinhasListas(): Promise<Lista[]> {
    return http.get<Lista[]>('/listas');
  },
  criarLista(payload: CriarListaPayload): Promise<Lista> {
    return http.post<Lista>('/listas', payload);
  },
  obterPorIdOuCodigo(idOuCodigo: string): Promise<Lista> {
    return http.get<Lista>(`/listas/${idOuCodigo}`);
  },
  atualizarLista(idOuCodigo: string, payload: AtualizarListaPayload): Promise<Lista> {
    return http.patch<Lista>(`/listas/${idOuCodigo}`, payload, false);
  },
  excluirLista(idOuCodigo: string): Promise<void> {
    return http.delete<void>(`/listas/${idOuCodigo}`);
  },
  adicionarItem(idOuCodigo: string, payload: CriarItemPayload): Promise<ItemLista> {
    return http.post<ItemLista>(`/listas/${idOuCodigo}/itens`, payload, false);
  },
  atualizarItem(
    idOuCodigo: string,
    itemId: string,
    payload: AtualizarItemPayload,
  ): Promise<ItemLista> {
    return http.patch<ItemLista>(`/listas/${idOuCodigo}/itens/${itemId}`, payload, false);
  },
  removerItem(idOuCodigo: string, itemId: string): Promise<void> {
    return http.delete<void>(`/listas/${idOuCodigo}/itens/${itemId}`, false);
  },
  listarAdministradores(idOuCodigo: string): Promise<ListaAdministradorItem[]> {
    return http.get<ListaAdministradorItem[]>(`/listas/${idOuCodigo}/administradores`);
  },
  vincularAdministrador(
    idOuCodigo: string,
    payload: VincularAdministradorPayload,
  ): Promise<ListaAdministradorItem> {
    return http.post<ListaAdministradorItem>(
      `/listas/${idOuCodigo}/administradores`,
      payload,
    );
  },
  atualizarPermissoesAdministrador(
    idOuCodigo: string,
    usuarioId: string,
    payload: AtualizarPermissoesAdministradorPayload,
  ): Promise<ListaAdministradorItem> {
    return http.patch<ListaAdministradorItem>(
      `/listas/${idOuCodigo}/administradores/${usuarioId}`,
      payload,
    );
  },
  removerAdministrador(idOuCodigo: string, usuarioId: string): Promise<void> {
    return http.delete<void>(`/listas/${idOuCodigo}/administradores/${usuarioId}`);
  },
  obterUrlEventos(idOuCodigo: string): string {
    return `${BASE_URL}/listas/${encodeURIComponent(idOuCodigo)}/eventos`;
  },
};

