CREATE TYPE "public"."area_turma" AS ENUM('global', 'pessoal', 'profissional');--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facilitador_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"area" "area_turma" NOT NULL,
	"tipo_relatorio" "tipo_relatorio" NOT NULL,
	"permite_download" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "turma_id" uuid;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_facilitador_id_usuarios_id_fk" FOREIGN KEY ("facilitador_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_turmas_id_facilitador" ON "turmas" USING btree ("id","facilitador_id");--> statement-breakpoint
CREATE INDEX "idx_turmas_dono" ON "turmas" USING btree ("facilitador_id","is_deleted");--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE restrict ON UPDATE no action;