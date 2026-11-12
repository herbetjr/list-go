import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Lista } from './lista.model';
import { Usuario } from './usuario.model';

@Entity('listas_administradores')
@Unique(['listaId', 'usuarioId'])
export class ListaAdministrador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lista_id' })
  listaId: string;

  @ManyToOne(() => Lista, (lista) => lista.administradores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lista_id' })
  lista: Lista;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ default: true })
  podeLer: boolean;

  @Column({ default: false })
  podeEditarLista: boolean;

  @Column({ default: false })
  podeAdicionarItens: boolean;

  @Column({ default: false })
  podeEditarItens: boolean;

  @Column({ default: false })
  podeRemoverItens: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

