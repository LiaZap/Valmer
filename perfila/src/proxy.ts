import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO } from '@/lib/auth/cookie'

/**
 * Porta de entrada das áreas com login.
 *
 * `proxy.ts`, e não `middleware.ts`: no Next 16 o middleware foi renomeado, e a
 * convenção antiga sai com aviso de depreciação no build. A função é a mesma.
 *
 * Confere apenas a PRESENÇA do cookie, e não se ele vale: isto roda no runtime
 * de borda, sem acesso ao banco. Quem valida de verdade é `exigirSessaoNaTela`,
 * nos layouts de /admin e /facilitador — a própria documentação do Next diz
 * para não usar proxy como solução de sessão. Aqui se poupa um carregamento
 * inteiro para quem claramente não está logado, e nunca é a única defesa.
 *
 * `/avaliacao` e `/relatorio` ficam de fora: o token do link é a credencial
 * deles, e exigir cookie ali trancaria o respondente para fora.
 */
const AREAS_COM_LOGIN = ['/admin', '/facilitador']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const temCookie = request.cookies.has(COOKIE_SESSAO)
  const areaProtegida = AREAS_COM_LOGIN.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  )

  if (areaProtegida && !temCookie) {
    const destino = new URL('/', request.url)
    // Volta para onde a pessoa queria ir depois de entrar, em vez de largar
    // todo mundo no mesmo dashboard.
    destino.searchParams.set('proximo', pathname)
    return NextResponse.redirect(destino)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/facilitador/:path*'],
}
