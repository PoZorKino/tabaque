import { MigrationInterface, QueryRunner } from "typeorm";

export class Changelogs1791930000000 implements MigrationInterface {
    name = "Changelogs1791930000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "changelogs" ("id" character varying NOT NULL, "date" character varying NOT NULL, "content" text NOT NULL, "asset_type" integer, "asset" character varying, "show_on_startup" boolean NOT NULL DEFAULT true, "published" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_changelogs_id" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "changelogs"`);
    }
}
