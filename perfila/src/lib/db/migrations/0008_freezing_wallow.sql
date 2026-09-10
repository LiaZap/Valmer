CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facilitador_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"celular" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cargos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facilitador_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"alvo_d" smallint,
	"alvo_i" smallint,
	"alvo_s" smallint,
	"alvo_c" smallint,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL,
	CONSTRAINT "ck_cargos_alvo" CHECK (("cargos"."alvo_d" IS NULL AND "cargos"."alvo_i" IS NULL AND "cargos"."alvo_s" IS NULL AND "cargos"."alvo_c" IS NULL)
        OR ("cargos"."alvo_d" IS NOT NULL AND "cargos"."alvo_i" IS NOT NULL
            AND "cargos"."alvo_s" IS NOT NULL AND "cargos"."alvo_c" IS NOT NULL
            AND "cargos"."alvo_d" + "cargos"."alvo_i" + "cargos"."alvo_s" + "cargos"."alvo_c" = 100
            AND "cargos"."alvo_d" BETWEEN 0 AND 100
            AND "cargos"."alvo_i" BETWEEN 0 AND 100
            AND "cargos"."alvo_s" BETWEEN 0 AND 100
            AND "cargos"."alvo_c" BETWEEN 0 AND 100))
);
--> statement-breakpoint
CREATE TABLE "devolutivas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"facilitador_id" uuid NOT NULL,
	"duracao_segundos" integer,
	"finalizada_em" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL,
	CONSTRAINT "ck_devolutivas_duracao" CHECK ("devolutivas"."duracao_segundos" IS NULL OR "devolutivas"."duracao_segundos" >= 0)
);
--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_facilitador_id_usuarios_id_fk" FOREIGN KEY ("facilitador_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_facilitador_id_usuarios_id_fk" FOREIGN KEY ("facilitador_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- REORDENADO A MAO, e nao pode voltar para a ordem do drizzle-kit.
--
-- O gerador emite os indices depois de TODAS as FKs, e a FK composta de
-- devolutivas referencia (assessments.id, assessments.facilitador_id): o
-- Postgres exige que esse par ja tenha unicidade no momento do ALTER TABLE. Na
-- ordem original a migration morre com "there is no unique constraint matching
-- given keys for referenced table assessments", porque o indice nasceria tres
-- linhas tarde demais. Por isso ele foi movido para ca.
CREATE UNIQUE INDEX "uq_assessments_id_facilitador" ON "assessments" USING btree ("id","facilitador_id");--> statement-breakpoint
ALTER TABLE "devolutivas" ADD CONSTRAINT "fk_devolutivas_assessment_dono" FOREIGN KEY ("assessment_id","facilitador_id") REFERENCES "public"."assessments"("id","facilitador_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clientes_facilitador_email" ON "clientes" USING btree ("facilitador_id","email") WHERE "clientes"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_clientes_id_facilitador" ON "clientes" USING btree ("id","facilitador_id");--> statement-breakpoint
CREATE INDEX "idx_clientes_dono" ON "clientes" USING btree ("facilitador_id","is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cargos_id_facilitador" ON "cargos" USING btree ("id","facilitador_id");--> statement-breakpoint
CREATE INDEX "idx_cargos_dono" ON "cargos" USING btree ("facilitador_id","is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_devolutivas_id_facilitador" ON "devolutivas" USING btree ("id","facilitador_id");--> statement-breakpoint
CREATE INDEX "idx_devolutivas_dono" ON "devolutivas" USING btree ("facilitador_id","is_deleted");
