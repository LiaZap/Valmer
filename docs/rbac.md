# RBAC - Controle de Acesso Baseado em Roles

## Roles do Sistema

| Role | Descricao | Nivel |
|------|-----------|-------|
| `super_admin` | Conta do time de desenvolvimento (Lucas, Douglas). Ve dashboard de problemas, auditoria completa | 0 |
| `admin` | Administrador do cliente. Gerencia usuarios, ve relatorios | 1 |
| `operador` | Usuario padrao do cliente. Executa lancamentos e operacoes do dia a dia | 2 |
| `visualizador` | Apenas visualiza dados, sem permissao de escrita | 3 |

## Matriz de Permissoes

### Formato
```
C = Criar | R = Ler | U = Atualizar | D = Deletar (logico)
```

| Recurso | super_admin | admin | operador | visualizador |
|---------|------------|-------|----------|--------------|
| Dashboard problemas | CRUD | - | - | - |
| Auditoria completa | R | R | - | - |
| Usuarios | CRUD | CRUD | R | - |
| Lancamentos | CRUD | CRUD | CRU | R |
| Relatorios | CRUD | CR | R | R |
| Configuracoes | CRUD | RU | - | - |
| Contratos | CRUD | CRUD | R | R |
| Categorias | CRUD | CRUD | R | R |

## Implementacao

### Middleware de Verificacao
Toda rota/action deve verificar permissao antes de executar:

```typescript
// src/lib/auth/rbac.ts
type Role = 'super_admin' | 'admin' | 'operador' | 'visualizador';
type Acao = 'criar' | 'ler' | 'atualizar' | 'deletar';

const permissoes: Record<string, Role[]> = {
  'lancamentos:criar': ['super_admin', 'admin', 'operador'],
  'lancamentos:ler': ['super_admin', 'admin', 'operador', 'visualizador'],
  'lancamentos:atualizar': ['super_admin', 'admin', 'operador'],
  'lancamentos:deletar': ['super_admin', 'admin'],
  'auditoria:ler': ['super_admin', 'admin'],
  'dashboard_problemas:ler': ['super_admin'],
  // ... adicionar todas as permissoes
};

export function temPermissao(role: Role, recurso: string, acao: Acao): boolean {
  const chave = `${recurso}:${acao}`;
  return permissoes[chave]?.includes(role) ?? false;
}
```

### Uso em Server Actions
```typescript
// Toda action deve comecar com verificacao
export async function criarLancamento(dados: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Nao autenticado');
  
  if (!temPermissao(session.user.role, 'lancamentos', 'criar')) {
    throw new Error('Sem permissao para criar lancamentos');
  }
  
  // ... logica da action
}
```

## Dashboard Super Admin (Owner)

Visivel apenas para `super_admin`. Mostra:

1. **Alertas de Erro**: lancamentos com categoria incorreta, dados inconsistentes
2. **Erros por Usuario**: volume de erros agrupado por usuario
3. **Detalhes do Erro**: ao clicar, mostra o que foi lancado vs o que deveria ser
4. **Registros Deletados**: quem deletou, quando, qual registro
5. **Historico de Alteracoes**: timeline de todas as modificacoes no sistema

## Regras

- Nenhum usuario pode acessar dados de outro tenant/organizacao
- Super admin ve TODOS os tenants
- Toda tentativa de acesso negado deve ser logada na auditoria
- Sessoes expiram apos periodo de inatividade configuravel
