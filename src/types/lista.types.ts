export interface ItemLista {
  id: string;
  listaId: string;
  descricao: string;
  quantidade: string;
  responsavelNome: string | null;
  concluido: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PermissoesUsuarioLista {
  dono: boolean;
  podeLer: boolean;
  podeEditarLista: boolean;
  podeAdicionarItens: boolean;
  podeEditarItens: boolean;
  podeRemoverItens: boolean;
}

export interface ListaAdministradorItem {
  id: string;
  listaId: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
    login: string;
    tipo: 'admin' | 'user';
  } | null;
  podeLer: boolean;
  podeEditarLista: boolean;
  podeAdicionarItens: boolean;
  podeEditarItens: boolean;
  podeRemoverItens: boolean;
  criadoEm?: string;
}

export interface VincularAdministradorPayload {
  usuarioId: string;
  podeLer?: boolean;
  podeEditarLista?: boolean;
  podeAdicionarItens?: boolean;
  podeEditarItens?: boolean;
  podeRemoverItens?: boolean;
}

export interface AtualizarPermissoesAdministradorPayload {
  podeLer?: boolean;
  podeEditarLista?: boolean;
  podeAdicionarItens?: boolean;
  podeEditarItens?: boolean;
  podeRemoverItens?: boolean;
}

export interface Lista {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  codigoCompartilhamento: string;
  usuarioId?: string;
  itens: ItemLista[];
  permissoes?: PermissoesUsuarioLista;
  administradores?: ListaAdministradorItem[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarListaPayload {
  titulo: string;
  descricao?: string;
}

export interface AtualizarListaPayload {
  titulo?: string;
  descricao?: string;
}

export interface CriarItemPayload {
  descricao: string;
  quantidade?: string;
  responsavelNome?: string | null;
}

export interface AtualizarItemPayload {
  descricao?: string;
  quantidade?: string;
  responsavelNome?: string | null;
  concluido?: boolean;
  historico?: {
    tipo?: string;
    detalhes?: string;
    descricao?: string;
  };
}

export interface HistoricoItem {
  id: string;
  listaId: string;
  itemId?: string | null;
  itemDescricao: string;
  tipoAcao: 'marcou' | 'alterou_quantidade' | 'liberou' | 'alterou_responsavel' | string;
  responsavelAntigo?: string | null;
  responsavelNovo?: string | null;
  quantidadeAntiga?: string | null;
  quantidadeNova?: string | null;
  detalhes: string;
  criadoEm: string;
}

export interface RegistrarHistoricoPayload {
  descricao: string;
  tipo: string;
  detalhes: string;
  responsavelAntigo?: string | null;
  responsavelNovo?: string | null;
  quantidadeAntiga?: string | null;
  quantidadeNova?: string | null;
  itemId?: string | null;
}

