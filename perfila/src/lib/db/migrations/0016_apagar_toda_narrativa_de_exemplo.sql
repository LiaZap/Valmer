-- A 0014 apagou UMA linha. Restaram duas.
--
-- Ela filtrava por `assessment_id` fixo — o mapa do "Elias da Silva Maia" —
-- porque era o unico que o seed inseria. Medido no banco de desenvolvimento
-- depois de a 0014 rodar: TRES linhas carregam a narrativa de exemplo, e duas
-- continuavam com `is_deleted = false`. A pior delas esta pendurada no mapa do
-- "Antonio Rodrigues Vidal", que abre o relatorio sendo chamado de Paulo.
--
-- Vieram de fora do seed: `narrativaParaExibir` devolvia o texto de exemplo
-- sempre que NODE_ENV nao era production, e qualquer geracao rodada em
-- desenvolvimento GRAVOU aquele texto como versao de verdade. Por isso um
-- `assessment_id` na clausula nunca ia dar conta: o defeito nao esta preso a um
-- mapa, esta preso ao TEXTO.
--
-- Entao o filtro passou a ser o proprio texto, e longo o bastante para nao pegar
-- narrativa legitima: uma pessoa de fato chamada Paulo teria a frase dela, e nao
-- esta. O delete continua LOGICO, e continua sem perda — o mapa sem versao ativa
-- cai em `components/relatorio/TextoPendente.tsx` e o parceiro gera a narrativa
-- de verdade pelo botao da lista. `relatorio/persistir.ts` conta as apagadas, e
-- a proxima nasce com o numero de versao seguinte.
UPDATE "assessments_relatorios"
   SET "is_deleted" = true,
       "deleted_at" = now(),
       "updated_at" = now(),
       "modified_by" = '00000000-0000-0000-0000-000000000000'
 WHERE "is_deleted" = false
   AND "narrativa"->>'resumoPerfil' LIKE
       'Paulo, existe em você uma combinação pouco comum. Você tem o calor de quem cria vínculo%';
