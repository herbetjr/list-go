import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarPrimeiroAcessoUsuario1794419900000 implements MigrationInterface {
  name = 'AdicionarPrimeiroAcessoUsuario1794419900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" ADD COLUMN "primeiro_acesso" boolean NOT NULL DEFAULT (1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" DROP COLUMN "primeiro_acesso"
    `);
  }
}

