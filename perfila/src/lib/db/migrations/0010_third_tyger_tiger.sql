-- A tabela comercial da plataforma (precos_relatorios, precos_pacotes) e a
-- marca de degustacao.
--
-- As duas colunas novas sao NOT NULL sobre tabela COM DADO — homologacao ja tem
-- usuarios e assessments — entao as duas nascem com DEFAULT, senao o ALTER
-- morreria no primeiro ambiente com linha gravada:
--
--   usuarios.creditos_degustacao DEFAULT 180  o mesmo saldo que a tela
--       /facilitador/degustacao ja mostrava fixo em data/creditos.ts. Todo
--       parceiro que existe continua com as 180 amostras que a tela prometia.
--   assessments.degustacao DEFAULT false      todo mapa que existe hoje foi
--       pago com credito; nenhum deles e amostra.
--
-- As tabelas de preco nascem VAZIAS de proposito: preco e dado, e dado se
-- semeia (lib/db/seed.ts:semearPrecos). Uma migration que insere preco
-- desfaria, no proximo deploy, o preco que o admin ajustou pela tela.
--
-- Os indices unicos sao PARCIAIS (`where is_deleted = false`) porque o delete
-- aqui e logico: com indice cheio, o pacote descontinuado continuaria ocupando
-- o nome para sempre.

CREATE TABLE "precos_pacotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"creditos" integer NOT NULL,
	"preco" integer NOT NULL,
	"publico" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL,
	CONSTRAINT "ck_precos_pacotes_creditos" CHECK ("precos_pacotes"."creditos" > 0),
	CONSTRAINT "ck_precos_pacotes_preco" CHECK ("precos_pacotes"."preco" >= 0)
);
--> statement-breakpoint
CREATE TABLE "precos_relatorios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" "tipo_relatorio" NOT NULL,
	"nome" text NOT NULL,
	"creditos" integer NOT NULL,
	"conteudo" text NOT NULL,
	"revenda_min" integer NOT NULL,
	"revenda_max" integer NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid NOT NULL,
	CONSTRAINT "ck_precos_relatorios_creditos" CHECK ("precos_relatorios"."creditos" > 0),
	CONSTRAINT "ck_precos_relatorios_revenda" CHECK ("precos_relatorios"."revenda_min" <= "precos_relatorios"."revenda_max")
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "creditos_degustacao" integer DEFAULT 180 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "degustacao" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_precos_pacotes_nome" ON "precos_pacotes" USING btree ("nome") WHERE "precos_pacotes"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_precos_relatorios_codigo" ON "precos_relatorios" USING btree ("codigo") WHERE "precos_relatorios"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "ck_usuarios_degustacao_nao_negativa" CHECK ("usuarios"."creditos_degustacao" >= 0);