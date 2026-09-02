CREATE TYPE "public"."fator_disc" AS ENUM('D', 'I', 'S', 'C');--> statement-breakpoint
CREATE TYPE "public"."papel_usuario" AS ENUM('admin', 'facilitador');--> statement-breakpoint
CREATE TYPE "public"."situacao_assessment" AS ENUM('pendente', 'em_andamento', 'concluido', 'expirado');--> statement-breakpoint
CREATE TYPE "public"."tipo_relatorio" AS ENUM('S1', 'S2', 'S3', 'S4');--> statement-breakpoint
CREATE TYPE "public"."tipo_transacao" AS ENUM('compra', 'uso', 'estorno', 'bonus');--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text,
	"papel" "papel_usuario" DEFAULT 'facilitador' NOT NULL,
	"empresa" text,
	"telefone" text,
	"creditos" integer DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"facilitador_id" uuid NOT NULL,
	"avaliado_nome" text NOT NULL,
	"avaliado_email" text NOT NULL,
	"tipo_relatorio" "tipo_relatorio" NOT NULL,
	"situacao" "situacao_assessment" DEFAULT 'pendente' NOT NULL,
	"creditos_usados" integer DEFAULT 0 NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"concluido_em" timestamp with time zone,
	"contador_d" integer,
	"contador_i" integer,
	"contador_s" integer,
	"contador_c" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments_relatorios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"narrativa" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments_respostas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"questao_codigo" text NOT NULL,
	"fator" "fator_disc" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creditos_transacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" "tipo_transacao" NOT NULL,
	"quantidade" integer NOT NULL,
	"descricao" text NOT NULL,
	"assessment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_facilitador_id_usuarios_id_fk" FOREIGN KEY ("facilitador_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ADD CONSTRAINT "assessments_relatorios_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments_respostas" ADD CONSTRAINT "assessments_respostas_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ADD CONSTRAINT "creditos_transacoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ADD CONSTRAINT "creditos_transacoes_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_usuarios_email" ON "usuarios" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_usuarios_ativos" ON "usuarios" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assessments_token" ON "assessments" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_assessments_facilitador" ON "assessments" USING btree ("facilitador_id");--> statement-breakpoint
CREATE INDEX "idx_assessments_ativos" ON "assessments" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relatorios_assessment_versao" ON "assessments_relatorios" USING btree ("assessment_id","versao");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_respostas_assessment_questao" ON "assessments_respostas" USING btree ("assessment_id","questao_codigo");--> statement-breakpoint
CREATE INDEX "idx_transacoes_usuario" ON "creditos_transacoes" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_transacoes_ativas" ON "creditos_transacoes" USING btree ("is_deleted");