import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarListaDto {
  @ApiProperty({ example: 'Churrasco de Domingo' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o título da lista' })
  titulo: string;

  @ApiPropertyOptional({ example: 'Lista de compras e quem traz o quê para o churrasco' })
  @IsString()
  @IsOptional()
  descricao?: string;
}

export class AtualizarListaDto {
  @ApiPropertyOptional({ example: 'Churrasco dos Amigos' })
  @IsString()
  @IsOptional()
  titulo?: string;

  @ApiPropertyOptional({ example: 'Nova descrição' })
  @IsString()
  @IsOptional()
  descricao?: string;
}

export class CriarItemDto {
  @ApiProperty({ example: 'Arroz kg' })
  @IsString()
  @IsNotEmpty({ message: 'Informe a descrição do item' })
  descricao: string;

  @ApiPropertyOptional({ example: '1' })
  @IsString()
  @IsOptional()
  quantidade?: string;

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString()
  @IsOptional()
  responsavelNome?: string;
}

export class AtualizarItemDto {
  @ApiPropertyOptional({ example: 'Arroz 5kg' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsString()
  @IsOptional()
  quantidade?: string;

  @ApiPropertyOptional({ example: 'Maria Souza' })
  @IsString()
  @IsOptional()
  responsavelNome?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  concluido?: boolean;
}

