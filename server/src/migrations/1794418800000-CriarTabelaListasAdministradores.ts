import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaListasAdministradores1794418800000 implements MigrationInterface {
  name = 'CriarTabelaListasAdministradores1794418800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listas_administradores" (
        "id" varchar PRIMARY KEY NOT NULL,
        "lista_id" varchar NOT NULL,
        "usuario_id" varchar NOT NULL,
        "podeLer" boolean NOT NULL DEFAULT (1),
        "podeEditarLista" boolean NOT NULL DEFAULT (0),
        "podeAdicionarItens" boolean NOT NULL DEFAULT (0),
        "podeEditarItens" boolean NOT NULL DEFAULT (0),
        "podeRemoverItens" boolean NOT NULL DEFAULT (0),
        "criado_em" datetime NOT NULL DEFAULT (datetime('now')),
        "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_lista_usuario_admin" UNIQUE ("lista_id", "usuario_id"),
        CONSTRAINT "FK_lista_admin_lista" FOREIGN KEY ("lista_id") REFERENCES "listas" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_lista_admin_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "listas_administradores"`);
  }
}

