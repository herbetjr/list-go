import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o login' })
  login: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha' })
  senha: string;
}

export class RegistroDto {
  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  nome: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o login' })
  login: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;
}

export class AlterarSenhaPrimeiroAcessoDto {
  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  novaSenha: string;
}


