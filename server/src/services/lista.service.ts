import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  MessageEvent,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Subject, Observable, merge, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Lista } from '../models/lista.model';
import { ItemLista } from '../models/item-lista.model';
import { ListaAdministrador } from '../models/lista-administrador.model';
import { Usuario } from '../models/usuario.model';
import {
  AtualizarItemDto,
  AtualizarListaDto,
  CriarItemDto,
  CriarListaDto,
} from '../dtos/lista.dto';
import {
  AtualizarPermissoesAdministradorDto,
  VincularAdministradorDto,
} from '../dtos/lista-administrador.dto';

export interface EventoLista {
  listaId: string;
  codigoCompartilhamento: string;
  tipo:
    | 'item_adicionado'
    | 'item_atualizado'
    | 'item_removido'
    | 'lista_atualizada'
    | 'lista_excluida'
    | 'ping';
  timestamp: number;
}

export interface PermissoesUsuarioLista {
  dono: boolean;
  podeLer: boolean;
  podeEditarLista: boolean;
  podeAdicionarItens: boolean;
  podeEditarItens: boolean;
  podeRemoverItens: boolean;
}

@Injectable()
export class ListaService {
  private readonly eventosSubject = new Subject<EventoLista>();

  constructor(
    @InjectRepository(Lista)
    private readonly listaRepo: Repository<Lista>,
    @InjectRepository(ItemLista)
    private readonly itemRepo: Repository<ItemLista>,
    @InjectRepository(ListaAdministrador)
    private readonly listaAdminRepo: Repository<ListaAdministrador>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  notificarMudanca(
    listaId: string,
    codigoCompartilhamento: string,
    tipo: EventoLista['tipo'],
  ) {
    this.eventosSubject.next({
      listaId,
      codigoCompartilhamento,
      tipo,
      timestamp: Date.now(),
    });
  }

  conectarStream(
    listaId: string,
    codigoCompartilhamento: string,
  ): Observable<MessageEvent> {
    const eventos$ = this.eventosSubject.asObservable().pipe(
      filter(
        (ev) =>
          ev.listaId === listaId ||
          ev.codigoCompartilhamento === codigoCompartilhamento,
      ),
      map(
        (ev) =>
          ({
            data: ev,
          }) as MessageEvent,
      ),
    );

    // Heartbeat a cada 25 segundos para manter conexão viva sem timeout
    const heartbeat$ = interval(25000).pipe(
      map(
        () =>
          ({
            data: {
              tipo: 'ping',
              timestamp: Date.now(),
            },
          }) as MessageEvent,
      ),
    );

    return merge(eventos$, heartbeat$);
  }

  private gerarCodigo(): string {
    return randomBytes(4).toString('hex').toLowerCase();
  }

  async criarLista(
    dto: CriarListaDto,
    usuario?: { id: string; tipo: string },
  ): Promise<Lista> {
    if (usuario && usuario.tipo === 'user') {
      throw new ForbiddenException(
        'Usuários do tipo padrão não possuem permissão para criar listas. Apenas administradores podem cadastrar listas.',
      );
    }

    let codigo = this.gerarCodigo();
    while (await this.listaRepo.findOne({ where: { codigoCompartilhamento: codigo } })) {
      codigo = this.gerarCodigo();
    }

    const lista = this.listaRepo.create({
      titulo: dto.titulo,
      descricao: dto.descricao,
      tipo: 'QUEM_LEVA_O_QUE',
      codigoCompartilhamento: codigo,
      usuarioId: usuario?.id ?? null,
      itens: [],
    });

    return this.listaRepo.save(lista);
  }

  async listarMinhasListas(
    usuario?: { id: string; tipo: string },
  ): Promise<(Lista & { permissoes?: PermissoesUsuarioLista })[]> {
    if (!usuario) {
      const qb = this.listaRepo
        .createQueryBuilder('lista')
        .leftJoinAndSelect('lista.itens', 'itens')
        .orderBy('lista.criadoEm', 'DESC');
      return qb.getMany();
    }

    // Usuário do tipo 'user' acompanha todas as listas abertas do sistema
    if (usuario.tipo === 'user') {
      const listas = await this.listaRepo
        .createQueryBuilder('lista')
        .leftJoinAndSelect('lista.itens', 'itens')
        .leftJoinAndSelect('lista.administradores', 'admins')
        .leftJoinAndSelect('admins.usuario', 'adminUsuario')
        .orderBy('lista.criadoEm', 'DESC')
        .getMany();

      return listas.map((lista) => {
        const permissoes = this.calcularPermissoes(lista, usuario.id);
        return Object.assign(lista, { permissoes });
      });
    }

    // Usuário administrador: listas onde ele é dono OU administrador vinculado com podeLer = true
    const listas = await this.listaRepo
      .createQueryBuilder('lista')
      .leftJoinAndSelect('lista.itens', 'itens')
      .leftJoinAndSelect('lista.administradores', 'admins')
      .leftJoinAndSelect('admins.usuario', 'adminUsuario')
      .where('lista.usuarioId = :usuarioId', { usuarioId: usuario.id })
      .orWhere(
        'EXISTS (SELECT 1 FROM listas_administradores la WHERE la.lista_id = lista.id AND la.usuario_id = :usuarioId AND la.podeLer = 1)',
        { usuarioId: usuario.id },
      )
      .orderBy('lista.criadoEm', 'DESC')
      .getMany();

    return listas.map((lista) => {
      const permissoes = this.calcularPermissoes(lista, usuario.id);
      return Object.assign(lista, { permissoes });
    });
  }

  async obterPorIdOuCodigo(
    idOuCodigo: string,
    usuarioId?: string,
  ): Promise<Lista & { permissoes?: PermissoesUsuarioLista }> {
    const lista = await this.listaRepo
      .createQueryBuilder('lista')
      .leftJoinAndSelect('lista.itens', 'itens')
      .leftJoinAndSelect('lista.administradores', 'admins')
      .leftJoinAndSelect('admins.usuario', 'adminUsuario')
      .where('lista.id = :val OR lista.codigoCompartilhamento = :val', {
        val: idOuCodigo,
      })
      .orderBy('itens.criadoEm', 'ASC')
      .getOne();

    if (!lista) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (lista.itens && lista.itens.length > 0) {
      lista.itens.sort((a, b) => {
        const aSem = !a.responsavelNome || !a.responsavelNome.trim();
        const bSem = !b.responsavelNome || !b.responsavelNome.trim();
        if (aSem && !bSem) return -1;
        if (!aSem && bSem) return 1;
        const dataA = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
        const dataB = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
        return dataA - dataB;
      });
    }

    const permissoes = this.calcularPermissoes(lista, usuarioId);
    return Object.assign(lista, { permissoes });
  }

  private calcularPermissoes(lista: Lista, usuarioId?: string): PermissoesUsuarioLista {
    if (!usuarioId) {
      return {
        dono: false,
        podeLer: true,
        podeEditarLista: false,
        podeAdicionarItens: true, // No link compartilhado público, visitantes podem sugerir itens
        podeEditarItens: false,
        podeRemoverItens: false,
      };
    }

    if (lista.usuarioId === usuarioId) {
      return {
        dono: true,
        podeLer: true,
        podeEditarLista: true,
        podeAdicionarItens: true,
        podeEditarItens: true,
        podeRemoverItens: true,
      };
    }

    const vinculo = lista.administradores?.find((a) => a.usuarioId === usuarioId);
    if (vinculo) {
      return {
        dono: false,
        podeLer: Boolean(vinculo.podeLer),
        podeEditarLista: Boolean(vinculo.podeEditarLista),
        podeAdicionarItens: Boolean(vinculo.podeAdicionarItens),
        podeEditarItens: Boolean(vinculo.podeEditarItens),
        podeRemoverItens: Boolean(vinculo.podeRemoverItens),
      };
    }

    return {
      dono: false,
      podeLer: true,
      podeEditarLista: false,
      podeAdicionarItens: false,
      podeEditarItens: false,
      podeRemoverItens: false,
    };
  }

  async atualizarLista(
    id: string,
    dto: AtualizarListaDto,
    usuarioId?: string,
  ): Promise<Lista> {
    const lista = await this.obterPorIdOuCodigo(id, usuarioId);

    if (usuarioId && !lista.permissoes?.podeEditarLista) {
      throw new ForbiddenException('Você não tem permissão para editar as informações desta lista');
    }

    if (dto.titulo !== undefined) lista.titulo = dto.titulo;
    if (dto.descricao !== undefined) lista.descricao = dto.descricao;
    const salva = await this.listaRepo.save(lista);
    this.notificarMudanca(salva.id, salva.codigoCompartilhamento, 'lista_atualizada');
    return salva;
  }

  async excluirLista(id: string, usuarioId?: string): Promise<void> {
    const lista = await this.obterPorIdOuCodigo(id, usuarioId);

    if (usuarioId && !lista.permissoes?.dono) {
      throw new ForbiddenException('Apenas o criador da lista pode excluí-la');
    }

    await this.listaRepo.remove(lista);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'lista_excluida');
  }

  async adicionarItem(
    idOuCodigo: string,
    dto: CriarItemDto,
    usuarioId?: string,
  ): Promise<ItemLista> {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, usuarioId);

    if (usuarioId && !lista.permissoes?.podeAdicionarItens) {
      throw new ForbiddenException('Você não tem permissão para adicionar itens a esta lista');
    }

    const item = this.itemRepo.create({
      listaId: lista.id,
      descricao: dto.descricao.trim(),
      quantidade: dto.quantidade?.trim() || '1',
      responsavelNome: dto.responsavelNome?.trim() || null,
      concluido: false,
    });

    const itemSalvo = await this.itemRepo.save(item);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'item_adicionado');
    return itemSalvo;
  }

  async atualizarItem(
    idOuCodigo: string,
    itemId: string,
    dto: AtualizarItemDto,
    usuarioId?: string,
  ): Promise<ItemLista> {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, usuarioId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, listaId: lista.id },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado na lista');
    }

    // Se estiver tentando alterar descrição ou quantidade e for usuário logado, validar se tem podeEditarItens
    const alterandoConteudo = dto.descricao !== undefined || dto.quantidade !== undefined;
    if (usuarioId && alterandoConteudo && !lista.permissoes?.podeEditarItens) {
      throw new ForbiddenException('Você não tem permissão para editar os dados deste item');
    }

    if (dto.descricao !== undefined) item.descricao = dto.descricao.trim();
    if (dto.quantidade !== undefined) item.quantidade = dto.quantidade.trim();
    if (dto.responsavelNome !== undefined) {
      item.responsavelNome = dto.responsavelNome ? dto.responsavelNome.trim() : null;
    }
    if (dto.concluido !== undefined) item.concluido = dto.concluido;

    const itemSalvo = await this.itemRepo.save(item);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'item_atualizado');
    return itemSalvo;
  }

  async removerItem(
    idOuCodigo: string,
    itemId: string,
    usuarioId?: string,
  ): Promise<void> {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, usuarioId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, listaId: lista.id },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado na lista');
    }

    if (usuarioId && !lista.permissoes?.podeRemoverItens) {
      throw new ForbiddenException('Você não tem permissão para remover itens desta lista');
    }

    await this.itemRepo.remove(item);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'item_removido');
  }

  // === Gestão de Administradores da Lista ===

  async listarAdministradores(idOuCodigo: string, usuarioId: string) {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, usuarioId);
    if (!lista.permissoes?.dono && !lista.permissoes?.podeLer) {
      throw new ForbiddenException('Você não tem acesso aos administradores desta lista');
    }

    const administradores = await this.listaAdminRepo.find({
      where: { listaId: lista.id },
      relations: ['usuario'],
      order: { criadoEm: 'ASC' },
    });

    return administradores.map((a) => ({
      id: a.id,
      listaId: a.listaId,
      usuarioId: a.usuarioId,
      usuario: a.usuario
        ? {
            id: a.usuario.id,
            nome: a.usuario.nome,
            login: a.usuario.login,
            tipo: a.usuario.tipo,
          }
        : null,
      podeLer: a.podeLer,
      podeEditarLista: a.podeEditarLista,
      podeAdicionarItens: a.podeAdicionarItens,
      podeEditarItens: a.podeEditarItens,
      podeRemoverItens: a.podeRemoverItens,
      criadoEm: a.criadoEm,
    }));
  }

  async vincularAdministrador(
    idOuCodigo: string,
    donoId: string,
    dto: VincularAdministradorDto,
  ) {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, donoId);
    if (lista.usuarioId !== donoId) {
      throw new ForbiddenException('Apenas o criador da lista pode vincular administradores');
    }

    if (dto.usuarioId === lista.usuarioId) {
      throw new BadRequestException('O criador da lista já é o administrador principal');
    }

    const usuarioAlvo = await this.usuarioRepo.findOne({
      where: { id: dto.usuarioId },
    });
    if (!usuarioAlvo) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (usuarioAlvo.tipo !== 'admin') {
      throw new BadRequestException('Apenas usuários administradores podem ser vinculados como administradores da lista');
    }

    let vinculo = await this.listaAdminRepo.findOne({
      where: { listaId: lista.id, usuarioId: dto.usuarioId },
      relations: ['usuario'],
    });

    if (vinculo) {
      if (dto.podeLer !== undefined) vinculo.podeLer = dto.podeLer;
      if (dto.podeEditarLista !== undefined) vinculo.podeEditarLista = dto.podeEditarLista;
      if (dto.podeAdicionarItens !== undefined) vinculo.podeAdicionarItens = dto.podeAdicionarItens;
      if (dto.podeEditarItens !== undefined) vinculo.podeEditarItens = dto.podeEditarItens;
      if (dto.podeRemoverItens !== undefined) vinculo.podeRemoverItens = dto.podeRemoverItens;
    } else {
      vinculo = this.listaAdminRepo.create({
        listaId: lista.id,
        usuarioId: dto.usuarioId,
        podeLer: dto.podeLer ?? true,
        podeEditarLista: dto.podeEditarLista ?? false,
        podeAdicionarItens: dto.podeAdicionarItens ?? false,
        podeEditarItens: dto.podeEditarItens ?? false,
        podeRemoverItens: dto.podeRemoverItens ?? false,
      });
    }

    const salvo = await this.listaAdminRepo.save(vinculo);
    salvo.usuario = usuarioAlvo;
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'lista_atualizada');

    return {
      id: salvo.id,
      listaId: salvo.listaId,
      usuarioId: salvo.usuarioId,
      usuario: {
        id: usuarioAlvo.id,
        nome: usuarioAlvo.nome,
        login: usuarioAlvo.login,
        tipo: usuarioAlvo.tipo,
      },
      podeLer: salvo.podeLer,
      podeEditarLista: salvo.podeEditarLista,
      podeAdicionarItens: salvo.podeAdicionarItens,
      podeEditarItens: salvo.podeEditarItens,
      podeRemoverItens: salvo.podeRemoverItens,
    };
  }

  async atualizarPermissoesAdministrador(
    idOuCodigo: string,
    donoId: string,
    usuarioIdAlvo: string,
    dto: AtualizarPermissoesAdministradorDto,
  ) {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, donoId);
    if (lista.usuarioId !== donoId) {
      throw new ForbiddenException('Apenas o criador da lista pode alterar permissões');
    }

    const vinculo = await this.listaAdminRepo.findOne({
      where: { listaId: lista.id, usuarioId: usuarioIdAlvo },
      relations: ['usuario'],
    });

    if (!vinculo) {
      throw new NotFoundException('Vínculo de administrador não encontrado');
    }

    if (dto.podeLer !== undefined) vinculo.podeLer = dto.podeLer;
    if (dto.podeEditarLista !== undefined) vinculo.podeEditarLista = dto.podeEditarLista;
    if (dto.podeAdicionarItens !== undefined) vinculo.podeAdicionarItens = dto.podeAdicionarItens;
    if (dto.podeEditarItens !== undefined) vinculo.podeEditarItens = dto.podeEditarItens;
    if (dto.podeRemoverItens !== undefined) vinculo.podeRemoverItens = dto.podeRemoverItens;

    const salvo = await this.listaAdminRepo.save(vinculo);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'lista_atualizada');

    return {
      id: salvo.id,
      listaId: salvo.listaId,
      usuarioId: salvo.usuarioId,
      usuario: vinculo.usuario
        ? {
            id: vinculo.usuario.id,
            nome: vinculo.usuario.nome,
            login: vinculo.usuario.login,
            tipo: vinculo.usuario.tipo,
          }
        : null,
      podeLer: salvo.podeLer,
      podeEditarLista: salvo.podeEditarLista,
      podeAdicionarItens: salvo.podeAdicionarItens,
      podeEditarItens: salvo.podeEditarItens,
      podeRemoverItens: salvo.podeRemoverItens,
    };
  }

  async removerAdministrador(
    idOuCodigo: string,
    donoId: string,
    usuarioIdAlvo: string,
  ): Promise<void> {
    const lista = await this.obterPorIdOuCodigo(idOuCodigo, donoId);
    if (lista.usuarioId !== donoId) {
      throw new ForbiddenException('Apenas o criador da lista pode desvincular administradores');
    }

    const vinculo = await this.listaAdminRepo.findOne({
      where: { listaId: lista.id, usuarioId: usuarioIdAlvo },
    });

    if (!vinculo) {
      throw new NotFoundException('Vínculo de administrador não encontrado');
    }

    await this.listaAdminRepo.remove(vinculo);
    this.notificarMudanca(lista.id, lista.codigoCompartilhamento, 'lista_atualizada');
  }
}


