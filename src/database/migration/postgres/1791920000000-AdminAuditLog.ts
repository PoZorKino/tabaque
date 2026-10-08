import { MigrationInterface, QueryRunner } from "typeorm";

export class AdminAuditLog1791920000000 implements MigrationInterface {
    name = "AdminAuditLog1791920000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "admin_audit_logs" ("id" character varying NOT NULL, "actor_id" character varying NOT NULL, "method" character varying NOT NULL, "path" character varying NOT NULL, "area" character varying NOT NULL, "target_id" character varying, "status" integer NOT NULL, "body" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_admin_audit_logs_id" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_admin_audit_logs_actor" ON "admin_audit_logs" ("actor_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_admin_audit_logs_area" ON "admin_audit_logs" ("area")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
    }
}
