import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Lista } from './lista.model';

@Entity('itens_lista')
export class ItemLista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lista_id' })
  listaId: string;

  @ManyToOne(() => Lista, (lista) => lista.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lista_id' })
  lista: Lista;

  @Column({ length: 250 })
  descricao: string;

  @Column({ length: 50, default: '1' })
  quantidade: string;

  @Column({ length: 150, nullable: true })
  responsavelNome?: string;

  @Column({ default: false })
  concluido: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

