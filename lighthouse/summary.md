# Lighthouse

Build de produção com os mocks. Três medições por página e perfil; os números abaixo são a mediana.

Ferramenta: Lighthouse 13.5.0.
Ambiente: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36.
Rede: Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 99 | 97 | 100 | 92 | 1.80 s | 0.000 | 82 ms |
| Início | desktop | 100 | 97 | 100 | 92 | 0.59 s | 0.010 | 0 ms |
| Detalhe | mobile | 98 | 98 | 100 | 92 | 2.01 s | 0.000 | 138 ms |
| Detalhe | desktop | 99 | 97 | 100 | 92 | 0.65 s | 0.077 | 0 ms |

Metas: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95, SEO ≥ 90.

Os arquivos HTML e JSON de cada mediana estão nesta pasta.

