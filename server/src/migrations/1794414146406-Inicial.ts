import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inicial1794414146406 implements MigrationInterface {
  name = 'Inicial1794414146406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuarios" (
        "id" varchar PRIMARY KEY NOT NULL,
        "nome" varchar(150) NOT NULL,
        "login" varchar(100) NOT NULL,
        "senhaHash" varchar(255) NOT NULL,
        "criado_em" datetime NOT NULL DEFAULT (datetime('now')),
        "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_0c0fcf4a8c228628476a29ea302" UNIQUE ("login")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listas" (
        "id" varchar PRIMARY KEY NOT NULL,
        "titulo" varchar(200) NOT NULL,
        "descricao" varchar(500),
        "tipo" varchar(50) NOT NULL DEFAULT ('QUEM_LEVA_O_QUE'),
        "codigoCompartilhamento" varchar(20) NOT NULL,
        "usuario_id" varchar,
        "criado_em" datetime NOT NULL DEFAULT (datetime('now')),
        "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_94ab93e452ad891bf02da114423" UNIQUE ("codigoCompartilhamento"),
        CONSTRAINT "FK_ad52256e3b02ce8d7c17d2971f0" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "itens_lista" (
        "id" varchar PRIMARY KEY NOT NULL,
        "lista_id" varchar NOT NULL,
        "descricao" varchar(250) NOT NULL,
        "quantidade" varchar(50) NOT NULL DEFAULT ('1'),
        "responsavelNome" varchar(150),
        "concluido" boolean NOT NULL DEFAULT (0),
        "criado_em" datetime NOT NULL DEFAULT (datetime('now')),
        "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_2cb86297639833fdea65e88b27f" FOREIGN KEY ("lista_id") REFERENCES "listas" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "itens_lista"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "listas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios"`);
  }
}

