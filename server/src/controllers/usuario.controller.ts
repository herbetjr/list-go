import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsuarioService } from '../services/usuario.service';
import { CriarUsuarioDto, ResetarSenhaDto } from '../dtos/usuario.dto';
import { UsuarioLogado } from '../decorators/usuario-logado.decorator';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo usuário (Apenas administradores)' })
  criarUsuario(
    @Body() dto: CriarUsuarioDto,
    @UsuarioLogado() usuario: { id: string; tipo: string },
  ) {
    return this.usuarioService.criarUsuarioPorAdmin(dto, usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os usuários cadastrados' })
  @ApiQuery({ name: 'tipo', required: false, enum: ['admin', 'user'] })
  listarUsuarios(@Query('tipo') tipo?: 'admin' | 'user') {
    return this.usuarioService.listarUsuarios(tipo);
  }

  @Patch(':id/resetar-senha')
  @ApiOperation({ summary: 'Reseta a senha de um usuário ou administrador (Apenas administradores)' })
  resetarSenha(
    @Param('id') id: string,
    @Body() dto: ResetarSenhaDto,
    @UsuarioLogado() usuario: { id: string; tipo: string },
  ) {
    return this.usuarioService.resetarSenha(id, dto, usuario);
  }
}

