import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lista } from './lista.model';

export type TipoUsuario = 'admin' | 'user';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 100, unique: true })
  login: string;

  @Column({ length: 255 })
  senhaHash: string;

  @Column({ length: 20, default: 'user' })
  tipo: TipoUsuario;

  @Column({ name: 'primeiro_acesso', default: true })
  primeiroAcesso: boolean;

  @OneToMany(() => Lista, (lista) => lista.usuario)
  listas: Lista[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

