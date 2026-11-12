import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AlterarSenhaPrimeiroAcessoDto, LoginDto, RegistroDto } from '../dtos/auth.dto';
import { Public } from '../decorators/public.decorator';
import { UsuarioLogado } from '../decorators/usuario-logado.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Efetua login com usuário e senha' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('registro')
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  registro(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  me(@UsuarioLogado() usuario: { id: string }) {
    return this.authService.obterUsuarioPorId(usuario.id);
  }

  @ApiBearerAuth()
  @Post('alterar-senha-primeiro-acesso')
  @ApiOperation({ summary: 'Altera a senha no primeiro acesso e libera acesso ao sistema' })
  alterarSenhaPrimeiroAcesso(
    @UsuarioLogado() usuario: { id: string },
    @Body() dto: AlterarSenhaPrimeiroAcessoDto,
  ) {
    return this.authService.alterarSenhaPrimeiroAcesso(usuario.id, dto);
  }
}

