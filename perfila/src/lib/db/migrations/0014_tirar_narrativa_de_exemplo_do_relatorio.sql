-- Tira do banco a narrativa de exemplo que o seed gravava como relatorio de
-- outra pessoa.
--
-- `lib/db/seed.ts` inseria `data/narrativa-exemplo.ts` como versao 1 do mapa
-- concluido do "Elias da Silva Maia". Aquele texto foi escrito para o Paulo e
-- comeca chamando o leitor pelo nome: em homologacao, abrir o relatorio mostra
-- um documento que conversa com a pessoa errada. O seed parou de gravar, mas os
-- ambientes que ja rodaram continuam com a linha, e nenhuma checagem de
-- NODE_ENV alcanca dado que esta no banco.
--
-- O delete e LOGICO, como manda a base. E nao ha perda: sem versao ativa, o mapa
-- concluido cai na tela de texto pendente (components/relatorio/TextoPendente.tsx)
-- e o parceiro gera a narrativa de verdade pelo botao da lista. O numero da
-- versao tambem nao se perde — `relatorio/persistir.ts` conta as apagadas, entao
-- a proxima nasce v2 e o historico continua legivel.
--
-- O WHERE e estreito de proposito: so a linha do assessment semeado, so a v1, e
-- so se o texto ainda for o de exemplo. Narrativa gerada de verdade por cima
-- deste mapa nao casa com o filtro e fica onde esta.
UPDATE "assessments_relatorios"
   SET "is_deleted" = true,
       "deleted_at" = now(),
       "updated_at" = now(),
       "modified_by" = '00000000-0000-0000-0000-000000000000'
 WHERE "assessment_id" = '2b8e4c69-0a3d-4f72-95b6-7d9e1f0a3b15'
   AND "versao" = 1
   AND "is_deleted" = false
   AND "narrativa"->>'resumoPerfil' LIKE 'Paulo, existe em você%';
