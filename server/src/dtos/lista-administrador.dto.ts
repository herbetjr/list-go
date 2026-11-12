import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class VincularAdministradorDto {
  @ApiProperty({ description: 'ID do usuário administrador a vincular' })
  @IsUUID('all', { message: 'ID do usuário inválido' })
  @IsNotEmpty({ message: 'Informe o ID do usuário' })
  usuarioId: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  podeLer?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeEditarLista?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeAdicionarItens?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeEditarItens?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeRemoverItens?: boolean;
}

export class AtualizarPermissoesAdministradorDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  podeLer?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeEditarLista?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeAdicionarItens?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeEditarItens?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  podeRemoverItens?: boolean;
}

