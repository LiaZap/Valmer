CREATE TABLE "cursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"conteudo" text NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"publicado_em" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_cursos_publicados" ON "cursos" USING btree ("is_deleted","publicado");