import type { NextConfig } from 'next'

/**
 * `/avaliacao/<token>` e `/relatorio/<token>` sao publicas por natureza: o token
 * na URL e a unica credencial. Isso as torna documentos com PII (nome e e-mail
 * do avaliado, contato do facilitador) numa URL que circula por e-mail, chat e
 * planilha compartilhada.
 *
 * `noindex` tira o documento dos buscadores: sem ele, um link colado num quadro
 * publico entra em indice e passa a ser achavel SEM o token, que e o mesmo que
 * nao ter token nenhum. `no-referrer` impede o caminho inverso — o token vazar
 * no cabecalho Referer para qualquer destino externo que a pagina venha a ter.
 * Hoje ela nao tem nenhum; a regra existe para o dia em que tiver.
 *
 * Cabecalho e nao `robots.txt` de proposito: `Disallow` pede para nao BUSCAR, e
 * o Google ainda indexa a URL nua que descobriu por outro caminho. `noindex`
 * proibe indexar, que e o que se quer aqui.
 */
const SEM_INDICE_SEM_REFERER = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      { source: '/avaliacao/:path*', headers: SEM_INDICE_SEM_REFERER },
      { source: '/relatorio/:path*', headers: SEM_INDICE_SEM_REFERER },
    ]
  },
}

export default nextConfig
