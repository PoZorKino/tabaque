import { MigrationInterface, QueryRunner } from "typeorm";

export class RelationshipCreatedAt1791910000000 implements MigrationInterface {
    name = "RelationshipCreatedAt1791910000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // existing friendships predate any restriction, so they get an old date
        await queryRunner.query(`ALTER TABLE "relationships" ADD "created_at" TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00'`);
        await queryRunner.query(`ALTER TABLE "relationships" ALTER COLUMN "created_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" DROP COLUMN "created_at"`);
    }
}
