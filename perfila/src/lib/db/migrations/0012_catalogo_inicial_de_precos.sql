-- O catalogo de precos que o sistema precisa para acordar de pe.
--
-- POR QUE ISTO ESTA EM MIGRATION E NAO NO SEED
-- --------------------------------------------
-- A 0010 criou `precos_relatorios` e `precos_pacotes` VAZIAS, e o preco foi
-- para `db/seed.ts`. So que o deploy nunca roda o seed: `package.json:start` e
-- `scripts/infra/deploy.sh` rodam `drizzle-kit migrate` e mais nada. Sem uma
-- linha de preco, `lib/precos.ts` recusa — e recusar preco derruba TODO
-- caminho que cobra: criar mapa, criar lote, cadastrar parceiro e vender
-- credito. Sem conserto pela tela, porque /admin/precos so sabe EDITAR nivel
-- que ja existe. Foi medido em banco novo: 16 tabelas criadas, zero precos, e
-- a primeira criacao de mapa parando em "O nivel S2 nao tem preco cadastrado".
--
-- Preco continua sendo DADO, editavel pelo admin sem deploy. Esta migration so
-- garante que a tabela nasce com o catalogo da especificacao, que e o mesmo que
-- o seed escrevia — quem tem banco semeado nao ganha linha nenhuma aqui.
--
-- O `ON CONFLICT DO NOTHING` repete o predicado do indice PARCIAL
-- (`where is_deleted = false`): sem ele o Postgres nao sabe qual indice usar
-- para decidir o conflito e recusa o comando.
--
-- `modified_by` e o uuid zerado, o mesmo sentinela de `sessoes.ts` e de
-- `relatorio/persistir.ts` para "nao foi uma pessoa". Na hora em que isto roda
-- nao existe usuario nenhum no banco — e a coluna nao tem FK.
INSERT INTO "precos_relatorios" ("codigo", "nome", "creditos", "conteudo", "revenda_min", "revenda_max", "modified_by") VALUES
  ('S1', 'Perfil Essencial',  1, 'DISC + narrativa por IA básica + encaixe de cargos',      97, 147, '00000000-0000-0000-0000-000000000000'),
  ('S2', 'Perfil Completo',   2, 'S1 + estilo de liderança + como gerir este perfil',      147, 197, '00000000-0000-0000-0000-000000000000'),
  ('S3', 'Perfil Executivo',  3, 'S2 + Plano de Desenvolvimento Individual (PDI)',         197, 297, '00000000-0000-0000-0000-000000000000'),
  ('S4', 'Perfil Estratégico', 4, 'S3 + dashboard online do avaliado + histórico de evolução', 297, 497, '00000000-0000-0000-0000-000000000000')
ON CONFLICT ("codigo") WHERE "is_deleted" = false DO NOTHING;
--> statement-breakpoint
INSERT INTO "precos_pacotes" ("nome", "creditos", "preco", "publico", "modified_by") VALUES
  ('Starter',     10,  290, 'Consultores iniciando, testando a ferramenta', '00000000-0000-0000-0000-000000000000'),
  ('Pro',         50,  990, 'Consultores ativos, empresas médias',          '00000000-0000-0000-0000-000000000000'),
  ('Business',   100, 1790, 'Consultorias de RH, empresas maiores',         '00000000-0000-0000-0000-000000000000'),
  ('Enterprise', 500, 6990, 'Grandes empresas, contratos anuais',           '00000000-0000-0000-0000-000000000000')
ON CONFLICT ("nome") WHERE "is_deleted" = false DO NOTHING;
