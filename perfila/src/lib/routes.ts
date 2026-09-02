/**
 * Mapa de rotas e navegação
 * -------------------------
 * A plataforma tem três ambientes com navegação própria:
 *
 * - `/admin`             → Valmer, dono da plataforma
 * - `/facilitador`       → parceiro ou empresa que compra créditos
 * - `/avaliacao/<token>` → quem responde, sem login e sem menu
 *
 * Os dois primeiros compartilham a mesma moldura; muda só o conjunto
 * de itens. Por isso tudo aqui recebe os grupos como parâmetro, em
 * vez de assumir um ambiente.
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

export const BASE_FACILITADOR = '/facilitador'
export const BASE_ADMIN = '/admin'

export const NAV_FACILITADOR: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { href: '/facilitador', label: 'Dashboard', icon: 'dash' },
      { href: '/facilitador/assessments', label: 'Assessments', icon: 'file' },
      { href: '/facilitador/envio-rapido', label: 'Envio Rápido', icon: 'zap' },
      { href: '/facilitador/campanhas', label: 'Campanhas', icon: 'bag' },
      { href: '/facilitador/dna', label: 'DNA Organizacional', icon: 'dna' },
      { href: '/facilitador/arquitetura', label: 'Arquitetura de Cargos', icon: 'layers' },
      { href: '/facilitador/devolutiva', label: 'Devolutiva', icon: 'chat' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/facilitador/beneficios', label: 'Programa de Benefícios', icon: 'star' },
      { href: '/facilitador/creditos', label: 'Créditos', icon: 'card' },
      { href: '/facilitador/degustacao', label: 'Degustação', icon: 'gift' },
      { href: '/facilitador/clientes', label: 'Clientes', icon: 'users' },
    ],
  },
  {
    label: 'Aprendizado',
    items: [
      { href: '/facilitador/cursos', label: 'Cursos', icon: 'book' },
      { href: '/facilitador/mentores', label: 'Mentores Especialistas', icon: 'award' },
      { href: '/facilitador/ead', label: 'EAD', icon: 'play' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/facilitador/integracoes', label: 'Integrações', icon: 'code' },
      { href: '/facilitador/configuracoes', label: 'Configurações', icon: 'sliders' },
      { href: '/facilitador/suporte', label: 'Suporte', icon: 'headset' },
    ],
  },
]

export const NAV_ADMIN: NavGroup[] = [
  {
    label: 'Plataforma',
    items: [
      { href: '/admin', label: 'Visão geral', icon: 'dash' },
      { href: '/admin/facilitadores', label: 'Facilitadores', icon: 'users' },
      { href: '/admin/assessments', label: 'Assessments', icon: 'file' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/admin/creditos', label: 'Créditos e pacotes', icon: 'card' },
      { href: '/admin/precos', label: 'Preços', icon: 'dollar' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [{ href: '/admin/questoes', label: 'Banco de questões', icon: 'book' }],
  },
]

/**
 * Um item segue ativo nas telas filhas. A raiz do ambiente é a
 * exceção: só fica ativa nela mesma, senão ficaria acesa em tudo.
 */
export function isNavItemActive(href: string, pathname: string, base: string): boolean {
  if (href === base) return pathname === base
  return pathname === href || pathname.startsWith(`${href}/`)
}

export type Breadcrumb = {
  /** Segundo nível: a seção. */
  title: string
  /** Terceiro nível: a tela dentro da seção (opcional). */
  sub?: string
}

/** Sub-rótulos fixos das telas de detalhe e criação. */
const STATIC_SUBS: Record<string, string> = {
  '/facilitador/assessments/novo': 'Novo assessment',
  '/facilitador/campanhas/nova': 'Nova campanha',
  '/facilitador/dna/novo': 'Novo DNA',
  '/facilitador/ead': 'Treinamentos',
  '/admin/facilitadores/novo': 'Novo facilitador',
}

export function resolveBreadcrumb(
  pathname: string,
  grupos: NavGroup[],
  base: string,
): Breadcrumb {
  const itens = grupos.flatMap((grupo) => grupo.items)
  const secao = itens.find((item) => isNavItemActive(item.href, pathname, base))
  const title = secao?.label ?? itens[0]?.label ?? ''

  const staticSub = STATIC_SUBS[pathname]
  if (staticSub) return { title, sub: staticSub }

  // DNA aberto: o terceiro nível é o nome da empresa.
  const prefixoDna = `${BASE_FACILITADOR}/dna/`
  if (pathname.startsWith(prefixoDna)) {
    const dna = dnas.find((item) => item.slug === pathname.slice(prefixoDna.length))
    if (dna) return { title, sub: dna.name }
  }

  return { title }
}
