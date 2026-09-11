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
  /**
   * Rótulo na sidebar — também usado no breadcrumb.
   *
   * O rótulo é vocabulário da Impacto, e a rota é identificador: os dois
   * mudam separado. "Assessments" virou "Mapas Comportamentais" e
   * "Campanhas" virou "Turmas" a pedido do cliente, para o produto não
   * repetir o vocabulário da plataforma concorrente. As rotas
   * `/assessments` e `/campanhas` continuam como estão, e junto com elas os
   * nomes de tabela, de arquivo e de campo. Ao renomear outro item, mexa só
   * no `label`.
   */
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
      { href: '/facilitador', label: 'Visão Geral', icon: 'dash' },
      { href: '/facilitador/assessments', label: 'Mapas Comportamentais', icon: 'file' },
      { href: '/facilitador/envio-rapido', label: 'Aplicação Rápida', icon: 'zap' },
      { href: '/facilitador/campanhas', label: 'Turmas', icon: 'bag' },
      { href: '/facilitador/dna', label: 'DNA Organizacional', icon: 'dna' },
      { href: '/facilitador/arquitetura', label: 'Arquitetura de Cargos', icon: 'layers' },
      { href: '/facilitador/devolutiva', label: 'Devolutiva', icon: 'chat' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/facilitador/beneficios', label: 'Trilha do Parceiro', icon: 'star' },
      { href: '/facilitador/creditos', label: 'Créditos', icon: 'card' },
      { href: '/facilitador/degustacao', label: 'Demonstração', icon: 'gift' },
      { href: '/facilitador/clientes', label: 'Clientes', icon: 'users' },
    ],
  },
  {
    label: 'Aprendizado',
    items: [
      { href: '/facilitador/cursos', label: 'Cursos', icon: 'book' },
      { href: '/facilitador/mentores', label: 'Mentores', icon: 'award' },
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
      { href: '/admin/assessments', label: 'Mapas Comportamentais', icon: 'file' },
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
    items: [
      { href: '/admin/questoes', label: 'Banco de questões', icon: 'book' },
      { href: '/admin/cursos', label: 'Cursos', icon: 'play' },
    ],
  },
]

/**
 * Rótulo curto de cada atalho da barra inferior do telefone.
 *
 * Isto NÃO é uma segunda lista de navegação: `navRapida` pesca os itens nos
 * grupos acima pelo href, então rota, ícone e existência continuam saindo de
 * um lugar só — uma tela nova entra no menu sem ninguém lembrar de dois
 * arquivos. O que mora aqui é só o rótulo.
 *
 * Ele precisa ser curto porque os cinco slots da barra dividem 390px em 78px
 * cada: "Mapas Comportamentais" não cabe, e cinco rótulos cortados não dizem
 * nada. "Parceiros" no lugar de "Facilitadores" pelo mesmo motivo, e é
 * vocabulário que o produto já usa ("Portal do Parceiro").
 */
const ATALHOS_CURTOS: Record<string, string> = {
  '/facilitador': 'Início',
  '/facilitador/assessments': 'Mapas',
  '/facilitador/campanhas': 'Turmas',
  '/facilitador/creditos': 'Créditos',
  '/admin': 'Início',
  '/admin/facilitadores': 'Parceiros',
  '/admin/assessments': 'Mapas',
  '/admin/precos': 'Preços',
}

/** Os quatro destinos da barra inferior, na ordem em que os grupos os trazem. */
export function navRapida(grupos: NavGroup[]): NavItem[] {
  return grupos
    .flatMap((grupo) => grupo.items)
    .flatMap((item) => {
      const curto = ATALHOS_CURTOS[item.href]
      return curto ? [{ ...item, label: curto }] : []
    })
}

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
  '/facilitador/assessments/novo': 'Novo mapa',
  '/facilitador/campanhas/nova': 'Nova turma',
  '/facilitador/dna/novo': 'Novo DNA',
  '/facilitador/ead': 'Treinamentos',
  '/admin/facilitadores/novo': 'Novo facilitador',
}

/**
 * Telas que existem sem item de menu.
 *
 * Sem esta consulta, `resolveBreadcrumb` cai no primeiro item do menu e a
 * trilha do perfil dizia "Parceiro / Visão Geral" — o caminho errado, que é
 * pior que caminho nenhum.
 */
const TITULOS_FORA_DO_MENU: Record<string, string> = {
  '/facilitador/perfil': 'Perfil',
  '/admin/perfil': 'Perfil',
}

export function resolveBreadcrumb(
  pathname: string,
  grupos: NavGroup[],
  base: string,
): Breadcrumb {
  const foraDoMenu = TITULOS_FORA_DO_MENU[pathname]
  if (foraDoMenu) return { title: foraDoMenu }

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
