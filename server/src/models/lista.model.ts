import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.model';
import { ItemLista } from './item-lista.model';
import { ListaAdministrador } from './lista-administrador.model';

@Entity('listas')
export class Lista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ length: 500, nullable: true })
  descricao?: string;

  @Column({ length: 50, default: 'QUEM_LEVA_O_QUE' })
  tipo: string;

  @Column({ length: 20, unique: true })
  codigoCompartilhamento: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.listas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @OneToMany(() => ItemLista, (item) => item.lista, { cascade: true })
  itens: ItemLista[];

  @OneToMany(() => ListaAdministrador, (la) => la.lista, { cascade: true })
  administradores: ListaAdministrador[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

