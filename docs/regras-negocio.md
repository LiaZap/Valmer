# Regras de Negocio do Cliente

## Como Usar Este Documento

Este arquivo e o registro oficial de TODAS as regras de negocio definidas pelo cliente.
Toda vez que uma regra nova for definida, ela DEVE ser adicionada aqui.
Agentes IA devem consultar este arquivo antes de implementar qualquer logica.

## Formato de Registro

Cada regra segue este formato:

```
### RN-[NUMERO] - [Titulo da Regra]
- **Definida por**: [Nome do cliente/stakeholder]
- **Data**: [YYYY-MM-DD]
- **Modulo**: [Qual parte do sistema]
- **Descricao**: [O que acontece]
- **Comportamento esperado**: [Como o sistema deve reagir]
- **Impacto se descumprida**: [O que da errado se nao seguir]
```

---

## Regras Globais (aplicam a todos os projetos)

### RN-001 - Exclusao Sempre Logica
- **Definida por**: Lucas Dettenborn
- **Data**: 2026-05-15
- **Modulo**: Todos
- **Descricao**: Nenhum registro pode ser excluido fisicamente do banco de dados
- **Comportamento esperado**: Ao excluir, marcar `is_deleted = true` e `deleted_at = now()`. Registro permanece no banco
- **Impacto se descumprida**: Perda de dados, impossibilidade de auditoria, cliente diz que "sumiu coisa"

### RN-002 - Rastreabilidade de Acoes
- **Definida por**: Lucas Dettenborn
- **Data**: 2026-05-15
- **Modulo**: Todos
- **Descricao**: Toda acao de criar, alterar ou excluir deve registrar quem fez e quando
- **Comportamento esperado**: Tabela de auditoria com user_id, acao, timestamp, dados anteriores e novos
- **Impacto se descumprida**: Impossibilidade de identificar origem de problemas

### RN-003 - Validacao Pre-Salvamento com Modal Block
- **Definida por**: Lucas Dettenborn
- **Data**: 2026-05-15
- **Modulo**: Lancamentos, Contratos, qualquer dado financeiro
- **Descricao**: Antes de salvar dados criticos, mostrar modal bloqueante por 3 segundos com resumo da acao
- **Comportamento esperado**: Modal aparece, tela bloqueia 3s, usuario le e confirma ou cancela
- **Impacto se descumprida**: Usuario salva dados errados sem perceber, gerando inconsistencias

### RN-004 - Versionamento de Documentos Gerados
- **Definida por**: Lucas Dettenborn
- **Data**: 2026-05-15
- **Modulo**: Relatorios, PDFs, Demonstrativos
- **Descricao**: Todo documento gerado (PDF, relatorio) deve ter versao incremental
- **Comportamento esperado**: v1, v2, v3... Sempre mostra ultima versao. Historico completo acessivel
- **Impacto se descumprida**: Cliente alega que dados mudaram sem prova do contrario

### RN-005 - Validacao de Categoria por Regex
- **Definida por**: Lucas Dettenborn
- **Data**: 2026-05-15
- **Modulo**: Lancamentos
- **Descricao**: Quando usuario lanca com categoria "Outros", validar por regex se a descricao corresponde a uma categoria existente
- **Comportamento esperado**: Sistema detecta que descricao "IPTU" deveria ser categoria IPTU, nao "Outros". Alerta o usuario
- **Impacto se descumprida**: Lancamentos ficam com categoria errada, relatorios ficam incorretos

---

## Regras Especificas do Projeto: Valmer (Perfila)

<!-- Adicionar regras especificas de cada cliente/projeto abaixo -->
<!-- Exemplo: -->

<!--
### RN-100 - [Titulo]
- **Definida por**: [Cliente]
- **Data**: [YYYY-MM-DD]
- **Modulo**: [Modulo]
- **Descricao**: [Descricao]
- **Comportamento esperado**: [Comportamento]
- **Impacto se descumprida**: [Impacto]
-->

### RN-100 - Assessment Consome Credito na Criacao
- **Definida por**: Valmer Albuquerque (especificacao da plataforma)
- **Data**: 2026-09-02
- **Modulo**: Assessments / Creditos
- **Descricao**: Cada nivel de relatorio custa creditos do facilitador: S1 = 1,
  S2 = 2, S3 = 3, S4 = 4. O debito acontece quando o assessment e criado, que e
  quando o link unico passa a existir, e nao quando o avaliado responde.
- **Comportamento esperado**: A criacao debita o saldo, grava a linha no extrato
  (`creditos_transacoes`) e cria o assessment na mesma transacao, com a linha do
  facilitador travada. Sem saldo, a criacao e recusada e nada e gravado.
- **Impacto se descumprida**: Duas criacoes simultaneas gastam o mesmo credito, ou
  o extrato deixa de explicar o saldo e a conferencia com o parceiro nao fecha.

### RN-101 - Facilitador So Enxerga o Que E Dele
- **Definida por**: Valmer Albuquerque (especificacao da plataforma)
- **Data**: 2026-09-02
- **Modulo**: Assessments
- **Descricao**: O portal do parceiro mostra apenas os assessments daquele
  facilitador. O admin, que e um so, enxerga os de todos os parceiros.
- **Comportamento esperado**: O recorte por dono entra no WHERE de toda funcao de
  `lib/actions/assessments.ts`, nao so na tela. Ler, atualizar e excluir de outro
  facilitador nao encontra o registro.
- **Impacto se descumprida**: Um parceiro ve os avaliados de outro. Sao dados
  comportamentais nominais de terceiros.

### RN-102 - Nivel do Relatorio Nao Muda Depois de Criado
- **Definida por**: Decisao tecnica, a confirmar com o cliente
- **Data**: 2026-09-02
- **Modulo**: Assessments
- **Descricao**: Depois de criado, o assessment nao troca de nivel (S1 a S4),
  porque o credito ja foi consumido. A edicao altera apenas nome e e-mail do
  avaliado. O credito tambem nao volta na exclusao logica, ja que o link pode
  ter sido enviado.
- **Comportamento esperado**: Para mudar de nivel, excluir e criar outro. Estorno
  e ato do admin, pela tela de creditos.
- **Impacto se descumprida**: Troca de nivel sem cobranca vira furo de receita.
