import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationRequests1791807000000 implements MigrationInterface {
    name = "RegistrationRequests1791807000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "registration_requests" ("id" character varying NOT NULL, "username" character varying NOT NULL, "email" character varying, "password" character varying, "date_of_birth" character varying, "invite" character varying, "ip" character varying, "message" character varying, "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "decided_at" TIMESTAMP WITH TIME ZONE, "decided_by" character varying, "user_id" character varying, CONSTRAINT "PK_registration_requests_id" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "registration_requests"`);
    }
}
