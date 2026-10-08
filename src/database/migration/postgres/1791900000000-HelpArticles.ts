import { MigrationInterface, QueryRunner } from "typeorm";

export class HelpArticles1791900000000 implements MigrationInterface {
    name = "HelpArticles1791900000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "help_articles" ("id" character varying NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL DEFAULT '', "source" character varying NOT NULL DEFAULT 'custom', "position" integer NOT NULL DEFAULT 0, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_help_articles_id" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "help_articles"`);
    }
}
