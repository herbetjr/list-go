import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListaService } from '../services/lista.service';
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
import { Public } from '../decorators/public.decorator';
import { UsuarioLogado } from '../decorators/usuario-logado.decorator';

@ApiTags('Listas')
@Controller('listas')
export class ListaController {
  constructor(private readonly listaService: ListaService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Cria uma nova lista' })
  criarLista(
    @Body() dto: CriarListaDto,
    @UsuarioLogado() usuario?: { id: string; tipo: string },
  ) {
    return this.listaService.criarLista(dto, usuario);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Lista todas as listas do usuário autenticado' })
  listarMinhasListas(@UsuarioLogado() usuario?: { id: string; tipo: string }) {
    return this.listaService.listarMinhasListas(usuario);
  }

  @Public()
  @Get(':idOuCodigo')
  @ApiOperation({ summary: 'Obtém detalhes de uma lista por ID ou Código de compartilhamento (Público)' })
  obterPorIdOuCodigo(
    @Param('idOuCodigo') idOuCodigo: string,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.obterPorIdOuCodigo(idOuCodigo, usuario?.id);
  }

  @Public()
  @Sse(':idOuCodigo/eventos')
  @ApiOperation({ summary: 'Stream SSE de eventos em tempo real para atualização da lista (Público)' })
  async streamEventos(
    @Param('idOuCodigo') idOuCodigo: string,
  ): Promise<Observable<MessageEvent>> {
    const lista = await this.listaService.obterPorIdOuCodigo(idOuCodigo);
    return this.listaService.conectarStream(lista.id, lista.codigoCompartilhamento);
  }

  @Public()
  @Patch(':idOuCodigo')
  @ApiOperation({ summary: 'Atualiza o título ou descrição da lista' })
  atualizarLista(
    @Param('idOuCodigo') idOuCodigo: string,
    @Body() dto: AtualizarListaDto,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.atualizarLista(idOuCodigo, dto, usuario?.id);
  }

  @ApiBearerAuth()
  @Delete(':idOuCodigo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma lista' })
  excluirLista(
    @Param('idOuCodigo') idOuCodigo: string,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.excluirLista(idOuCodigo, usuario?.id);
  }

  @Public()
  @Post(':idOuCodigo/itens')
  @ApiOperation({ summary: 'Adiciona um item à lista (Público)' })
  adicionarItem(
    @Param('idOuCodigo') idOuCodigo: string,
    @Body() dto: CriarItemDto,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.adicionarItem(idOuCodigo, dto, usuario?.id);
  }

  @Public()
  @Patch(':idOuCodigo/itens/:itemId')
  @ApiOperation({ summary: 'Atualiza um item da lista, como assumir quem traz (Público)' })
  atualizarItem(
    @Param('idOuCodigo') idOuCodigo: string,
    @Param('itemId') itemId: string,
    @Body() dto: AtualizarItemDto,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.atualizarItem(idOuCodigo, itemId, dto, usuario?.id);
  }

  @Public()
  @Delete(':idOuCodigo/itens/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um item da lista (Público)' })
  removerItem(
    @Param('idOuCodigo') idOuCodigo: string,
    @Param('itemId') itemId: string,
    @UsuarioLogado() usuario?: { id: string },
  ) {
    return this.listaService.removerItem(idOuCodigo, itemId, usuario?.id);
  }

  // === Administradores da Lista ===

  @ApiBearerAuth()
  @Get(':idOuCodigo/administradores')
  @ApiOperation({ summary: 'Lista os administradores vinculados à lista' })
  listarAdministradores(
    @Param('idOuCodigo') idOuCodigo: string,
    @UsuarioLogado() usuario: { id: string },
  ) {
    return this.listaService.listarAdministradores(idOuCodigo, usuario.id);
  }

  @ApiBearerAuth()
  @Post(':idOuCodigo/administradores')
  @ApiOperation({ summary: 'Vincula um administrador à lista' })
  vincularAdministrador(
    @Param('idOuCodigo') idOuCodigo: string,
    @Body() dto: VincularAdministradorDto,
    @UsuarioLogado() usuario: { id: string },
  ) {
    return this.listaService.vincularAdministrador(idOuCodigo, usuario.id, dto);
  }

  @ApiBearerAuth()
  @Patch(':idOuCodigo/administradores/:usuarioId')
  @ApiOperation({ summary: 'Atualiza as permissões de um administrador na lista' })
  atualizarPermissoesAdministrador(
    @Param('idOuCodigo') idOuCodigo: string,
    @Param('usuarioId') usuarioIdAlvo: string,
    @Body() dto: AtualizarPermissoesAdministradorDto,
    @UsuarioLogado() usuario: { id: string },
  ) {
    return this.listaService.atualizarPermissoesAdministrador(
      idOuCodigo,
      usuario.id,
      usuarioIdAlvo,
      dto,
    );
  }

  @ApiBearerAuth()
  @Delete(':idOuCodigo/administradores/:usuarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove o vínculo de um administrador da lista' })
  removerAdministrador(
    @Param('idOuCodigo') idOuCodigo: string,
    @Param('usuarioId') usuarioIdAlvo: string,
    @UsuarioLogado() usuario: { id: string },
  ) {
    return this.listaService.removerAdministrador(
      idOuCodigo,
      usuario.id,
      usuarioIdAlvo,
    );
  }
}

