/**
 * Mapa de rotas e navegação
 * -------------------------
 * Um único lugar define: o que aparece na sidebar, qual item fica
 * ativo em cada URL e o que o breadcrumb do topo mostra.
 */

import type { IconName } from '@/components/ui/Icon'
import { dnas } from '@/data/dna'

export type NavItem = {
  href: string
  /** Rótulo na sidebar — também usado no breadcrumb. */
  label: string
  icon: IconName
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { href: '/', label: 'Dashboard', icon: 'dash' },
      { href: '/envio-rapido', label: 'Envio Rápido', icon: 'zap' },
      { href: '/campanhas', label: 'Campanhas', icon: 'bag' },
      { href: '/dna', label: 'DNA Organizacional', icon: 'dna' },
      { href: '/arquitetura', label: 'Arquitetura de Cargos', icon: 'layers' },
      { href: '/devolutiva', label: 'Devolutiva', icon: 'chat' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/beneficios', label: 'Programa de Benefícios', icon: 'star' },
      { href: '/creditos', label: 'Créditos', icon: 'card' },
      { href: '/degustacao', label: 'Degustação', icon: 'gift' },
      { href: '/clientes', label: 'Clientes', icon: 'users' },
    ],
  },
  {
    label: 'Aprendizado',
    items: [
      { href: '/cursos', label: 'Cursos', icon: 'book' },
      { href: '/mentores', label: 'Mentores Especialistas', icon: 'award' },
      { href: '/ead', label: 'EAD', icon: 'play' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/integracoes', label: 'Integrações', icon: 'code' },
      { href: '/configuracoes', label: 'Configurações', icon: 'sliders' },
      { href: '/suporte', label: 'Suporte', icon: 'headset' },
    ],
  },
]

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

/**
 * Um item da sidebar continua destacado nas telas filhas.
 * Ex.: /campanhas/nova mantém "Campanhas" ativo.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export type Breadcrumb = {
  /** Segundo nível: a seção. */
  title: string
  /** Terceiro nível: a tela dentro da seção (opcional). */
  sub?: string
}

/** Sub-rótulos fixos das telas de detalhe/criação. */
const STATIC_SUBS: Record<string, string> = {
  '/campanhas/nova': 'Nova campanha',
  '/dna/novo': 'Novo DNA',
  '/ead': 'Treinamentos',
}

export function resolveBreadcrumb(pathname: string): Breadcrumb {
  const section = NAV_ITEMS.find((item) => isNavItemActive(item.href, pathname))
  const title = section?.label ?? 'Dashboard'

  const staticSub = STATIC_SUBS[pathname]
  if (staticSub) return { title, sub: staticSub }

  // DNA aberto: o terceiro nível é o nome da empresa.
  const dnaSlug = pathname.startsWith('/dna/') ? pathname.slice('/dna/'.length) : null
  if (dnaSlug) {
    const dna = dnas.find((item) => item.slug === dnaSlug)
    if (dna) return { title, sub: dna.name }
  }

  return { title }
}
