# ADR-0005: Uma VPS para HML e PRD

- **Status**: Aceito
- **Data**: 2026-09-03
- **Decisores**: Paulo (cliente do repositorio), infra

## Contexto

O `CLAUDE.md` da raiz descreve quatro VPS: frontend e backend separados, HML e
PRD, cada par em maquinas distintas, com a regra "Frontend e Backend SEMPRE em
VPS separadas (isolamento de falha)".

Foi contratada uma: Hostinger KVM 8, Ubuntu 24.04. Este ADR registra o que isso
muda de verdade, para que ninguem leia o diagrama das quatro VPS e acredite que
ele descreve o que existe.

Duas coisas separam o desenho do papel do que foi comprado, e elas pesam
diferente:

**A divisao frontend/backend nunca se aplicou a este produto.** O `perfila/` e
Next.js App Router com Server Components e Server Actions. O ADR-0001 fixou a
stack e o proprio `CLAUDE.md` manda "usar server-side nativo, sem API separada".
Nao existe processo de backend para morar em outra maquina: o mesmo processo
Node renderiza a pagina e executa a Server Action. Duas das quatro VPS eram para
um componente que este projeto nao tem, e separar o Next.js do Postgres em
maquinas diferentes so troca uma chamada em `127.0.0.1` por uma chamada de rede,
com mais latencia por query e mais uma superficie para proteger.

**A divisao HML/PRD, essa sim, foi perdida.** E dela que trata o resto deste
documento. O desenho que falta nao e de quatro maquinas: e de duas.

## Decisao

HML e PRD convivem na mesma maquina, isolados pelo que da para isolar dentro de
um kernel so, e com o custo do que nao da registrado por escrito.

O que fica separado de verdade:

- **Processo**: duas unidades systemd (`valmer-hml`, `valmer-prd`), portas
  distintas, `MemoryMax` e `CPUWeight` diferentes. Um `next build` em HML nao
  consegue tomar a memoria do PRD: o cgroup mata o processo de HML antes.
- **Banco**: dois containers, dois volumes, dois usuarios do Postgres, duas
  senhas, duas portas em `127.0.0.1`. As credenciais do HML nao abrem o banco de
  PRD. Uma migracao errada em homologacao nao encosta em dado de producao.
- **Segredo**: `BETTER_AUTH_SECRET` proprio por ambiente. Sessao de HML nao vale
  em PRD.
- **Codigo**: arvores de release separadas, `git reset` em uma nao afeta a
  outra.
- **Privilegio**: a app roda como `deploy`, que nao tem sudo alem de reiniciar
  os dois servicos.

O que **nao** fica separado, e nao ha configuracao que resolva:

- **Kernel e host.** Panico de kernel, falha do hipervisor, ou a Hostinger com
  problema no no derrubam os dois ambientes ao mesmo tempo.
- **Disco.** Um so. Log descontrolado, dump esquecido ou release acumulada
  enchem o disco e param HML e PRD juntos. Mitigado (teto no journal, retencao
  de backup, poda de release, alerta em 85%), nao eliminado.
- **IP e reputacao.** Um IP para os dois. Bloqueio ou lista negra vale para
  ambos.
- **Janela de manutencao.** Reboot de kernel derruba os dois. Nao da para
  atualizar HML primeiro e observar antes de mexer em PRD, que e justamente o
  motivo de existir um ambiente de homologacao.
- **Blast radius.** Comprometimento de root na maquina alcanca os dois bancos,
  os dois arquivos de segredo e os backups locais. O unico ativo que sobrevive e
  a copia off-site — que por isso deixou de ser recomendacao e virou requisito:
  `backup.sh` recusa rodar em PRD sem destino externo configurado.

E uma regra de operacao que acompanha a decisao, porque a configuracao sozinha
nao cobre: **nao se faz teste de carga em HML nesta maquina.** Os tetos protegem
memoria e CPU; disco e rede sao compartilhados e nao tem cgroup aqui.

## Alternativas Consideradas

- **So PRD na maquina, sem HML.** Isolamento perfeito e maquina barata. Mas o
  `CLAUDE.md` exige rollback e restore testados em HML, e o
  `definition-of-done.md` exige validacao em homologacao antes do merge. Sem
  HML, o primeiro teste de restore seria durante o incidente.
- **HML em container e PRD no host.** Aparencia de isolamento sem o ganho: mesmo
  kernel, mesmo disco, mesma queda. Trocaria o problema real por um desenho mais
  complicado.
- **Duas VPS menores em vez de uma KVM 8.** Seria o desenho correto. Nao e o que
  foi comprado, e a maquina ja esta paga. Registrado como o proximo passo, com
  gatilho abaixo.

## Consequencias

### Positivas
- Um custo, um servidor para manter, um firewall, um Nginx, um certificado.
- HML e PRD com a mesma versao de kernel, Node, Docker e Postgres, sem esforco:
  a exigencia de "HML replica exata de PRD" sai de graca.
- Banco no mesmo host que a app: query em `127.0.0.1`, sem latencia de rede e
  sem porta de banco atravessando lugar nenhum.
- Restore de PRD ensaiado em HML sem transferir dump entre maquinas.

### Negativas / Trade-offs
- **Um incidente de host = plataforma inteira fora**, sem ambiente de reserva.
  Nao ha failover; o plano de recuperacao e reprovisionar e restaurar o backup
  off-site. Estime horas, nao minutos.
- A regra "Frontend e Backend SEMPRE em VPS separadas" do `CLAUDE.md` fica
  **descumprida e documentada**, nao cumprida. Quem ler aquele trecho deve ser
  mandado para ca.
- Reboot de seguranca derruba homologacao e producao no mesmo minuto.
- Um bug de consumo de recurso em HML degrada PRD antes do cgroup agir — o teto
  impede a morte, nao a lentidao.

### Neutras
- Os scripts em `scripts/infra/` recebem o ambiente por argumento. Quando a
  segunda maquina chegar, mover um ambiente e rodar os mesmos scripts la e
  apontar o DNS; nada foi escrito assumindo uma maquina so.

### Quando comprar a segunda

Nao e "quando sobrar orcamento". O gatilho e o primeiro destes:

1. Existe cliente pagante com dado real em PRD — a partir dai a queda deixa de
   ser constrangimento e vira prejuizo, e a perda de uma janela de manutencao
   independente passa a custar mais que a assinatura.
2. HML precisa receber teste de carga ou dado de volume.
3. O uso de memoria em PRD encosta em 70% do teto de forma sustentada.

O primeiro corte e **PRD sozinho na maquina nova, HML fica nesta**. Nao e
frontend/backend: e producao longe de todo o resto.
