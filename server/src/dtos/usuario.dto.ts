import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Administrador 2' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  nome: string;

  @ApiProperty({ example: 'admin2' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o login' })
  login: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['admin', 'user'] })
  @IsString()
  @IsOptional()
  @IsIn(['admin', 'user'], { message: 'O tipo deve ser admin ou user' })
  tipo?: 'admin' | 'user';
}

export class UsuarioRespostaDto {
  id: string;
  nome: string;
  login: string;
  tipo: 'admin' | 'user';
  primeiroAcesso: boolean;
  criadoEm: Date;
}

export class ResetarSenhaDto {
  @ApiProperty({ example: 'mudar123' })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  novaSenha: string;
}


