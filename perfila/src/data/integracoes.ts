/** Integrações de pagamento disponíveis. */

export type Integracao = {
  name: string
  /** Inicial exibida no lugar do logotipo. */
  letter: string
  cor: string
  desc: string
  conectada: boolean
}

export const integracoes: Integracao[] = [
  {
    name: 'Pagarme',
    letter: 'P',
    cor: 'var(--color-accent)',
    desc: 'O Pagar.me é uma fintech brasileira que fornece soluções de pagamento e transações.',
    conectada: false,
  },
  {
    name: 'Hotmart',
    letter: 'H',
    cor: 'var(--color-ink)',
    desc: 'A Hotmart permite a criação, venda e distribuição de produtos digitais.',
    conectada: false,
  },
  {
    name: 'Guru',
    letter: 'G',
    cor: 'var(--color-text-secondary)',
    desc: 'A mais flexível e completa plataforma de vendas online para gerenciar seu negócio num só lugar.',
    conectada: false,
  },
]
