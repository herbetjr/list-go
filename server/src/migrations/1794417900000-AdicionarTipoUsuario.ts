import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarTipoUsuario1794417900000 implements MigrationInterface {
  name = 'AdicionarTipoUsuario1794417900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" ADD COLUMN "tipo" varchar(20) NOT NULL DEFAULT ('user')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" DROP COLUMN "tipo"
    `);
  }
}

