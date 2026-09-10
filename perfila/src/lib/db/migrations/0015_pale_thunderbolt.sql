CREATE TABLE "curso_aulas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modulo_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"video_chave" text,
	"duracao_segundos" integer,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL,
	CONSTRAINT "ck_curso_aulas_duracao" CHECK ("curso_aulas"."duracao_segundos" IS NULL OR "curso_aulas"."duracao_segundos" > 0)
);
--> statement-breakpoint
CREATE TABLE "curso_modulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curso_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "curso_aulas" ADD CONSTRAINT "curso_aulas_modulo_id_curso_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."curso_modulos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curso_modulos" ADD CONSTRAINT "curso_modulos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_curso_aulas_modulo" ON "curso_aulas" USING btree ("modulo_id","is_deleted","ordem");--> statement-breakpoint
CREATE INDEX "idx_curso_modulos_curso" ON "curso_modulos" USING btree ("curso_id","is_deleted","ordem");