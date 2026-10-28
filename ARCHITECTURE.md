# Arquitetura

## 1. Visão geral

Kurio é um marketplace de NFTs no navegador. A interface é React. Os dados vêm de uma API simulada com MSW no próprio browser. O estado compartilhado (carrinho, sessão, carteiras, pedidos, favoritos) fica em `localStorage` na chave `kurio-mock-store`.

Pastas usadas hoje:

- `src/contracts` — schemas Zod de respostas
- `src/queries` — `queryOptions` do TanStack Query
- `src/mocks` — handlers REST, socket, fixtures e store
- `src/components` — UI, incluindo `account`, `form`, `order`, `mobile` e `icons`
- `src/pages` e `src/router.tsx` — rotas
- `src/lib` — Axios, ETH decimal, tempo real

Ainda não existem `src/api` por recurso, `src/features`, cenários MSW selecionáveis nem o pacote `@mswjs/socket.io-binding`.

## 2. Stack

| Ferramenta | Papel |
| --- | --- |
| Vite + React + TypeScript | App |
| TanStack Router | Rotas, search params e rota `/perfil` protegida no layout |
| TanStack Query | Cache, mutations e descarte de respostas obsoletas via `signal` |
| Axios | Todo REST em `src/lib/api.ts` (`baseURL` `/api`) |
| MSW | REST e o socket no service worker |
| `socket.io-client` | Cliente de `nft.updated` e `order.updated`, importado só depois do worker |
| Tailwind CSS v4 | Estilo, sem `tailwind.config` |
| shadcn-style | `Button`; `Sheet` e o modal de pedido usam `<dialog>` nativo (foco preso, Esc, retorno de foco). O hero usa o carrossel (Embla) |
| `decimal.js` | Contas de ETH no mock e em `src/lib/eth.ts` |
| Zod | Contratos das respostas |
| Playwright e Lighthouse | Testes e auditoria |

## 3. Contratos e eventos

REST principal:

- `GET /api/content` (inclui `heroSlides`), `GET /api/nfts`, `GET /api/nfts/:id`
- `GET/POST/PATCH/DELETE /api/cart` e `POST /api/cart/coupon`
- `POST /api/orders`, `GET /api/orders/:id`
- `GET/POST/DELETE /api/session`, `POST /api/signup`, `PATCH /api/session`
- `GET/PATCH /api/profile`, `POST /api/profile/avatar`, `POST /api/profile/password`
- `GET /api/wallets`, `POST /api/wallets`, `PATCH /api/wallets/:id` (`primary` ou `secondary`), `PUT /api/wallets/primary` e `PUT /api/wallets/secondary`
- favoritos em `/api/favorites`

ETH trafega como string decimal. Quantidade é inteiro. A cotação (`subtotalEth`, `discountEth`, `feeEth`, `totalEth`, `version`) vem da API. O front só formata.

Socket.IO:

- `nft.updated`: `id` do evento, `version`, `nftId`, `name`, `priceEth`, `available`
- `order.updated`: `id` do evento, `version`, `orderId`, `status`, `userId`

Versões iguais ou mais antigas são ignoradas. `order.updated` de outro `userId` é ignorado.

## 4. Sessão

A senha da conta fica no mesmo store, como hash SHA-256. Uma conta antiga com senha em texto é convertida no primeiro login. `GET /api/session` e `GET /api/profile` devolvem o mesmo usuário. A sessão sobrevive ao refresh porque o id fica no store. Login e cadastro gravam a sessão. Logout apaga a sessão e remove do cache as queries `session`, `wallets`, `favorites`, `order` e `cart`. O efeito do socket depende de `userId` e desliga os listeners ao trocar ou sair.

`/perfil` sem sessão, no desktop, permanece na página e abre o modal `?auth=login`. No mobile continua indo para `/entrar?redirect=...`. Favoritos e perfil na tab bar mobile fazem o mesmo. Depois do login, a página volta para `redirect` quando ele começa com `/`.

O login desktop é o modal em `?auth=login` ou `?auth=signup`, sobre a página atual. `/login` e `/cadastro` no desktop redirecionam para a home com esse parâmetro. Abaixo de 768px essas rotas mostram a tela cheia. O fundo do modal é `rgba(20, 13, 10, 0.6)`. O painel tem 500×600, 160px do topo, cantos retos (o cadastro do Figma tinha raio 8; os dois ficam sem raio). E-mail e senha usam rótulo só para leitor de tela; o placeholder é exemplo. Google, Facebook e "Esqueceu a senha?" avisam que estão fora da demonstração. A sessão continua em `POST /api/session`. No login, os itens do visitante entram na conta. Checkout, favoritos e pedidos exigem sessão: no desktop abrem o modal de login e no mobile vão para `/entrar`, com volta para a mesma tela.

O interceptor do Axios trata a resposta `401` com `code: session_expired`. Isso acontece quando `sessionStorage` tem `kurio-expire-session=1` e a próxima chamada de conta, carrinho, favorito, carteira ou pedido encontra uma sessão. O mock apaga a sessão, o cache privado sai do Query, e o login abre com `?reason=expired` e `redirect` de volta à tela atual. No celular a volta é `/entrar`.

## 5. Carrinho e cotação

O carrinho é do servidor (mock), não de Context/Zustand. A query `['cart']` usa `cartQueryOptions`. Subtotal, desconto, taxa e total vêm de `quote`. A taxa de rede é `0.016` com carrinho cheio. O cupom `KURIO10` aplica 10% com `decimal.js` (`ROUND_DOWN`). O slider de preço é o único ponto que converte ETH para número, porque o input `range` exige isso.

## 6. Cache

Query keys: `['cart']`, `['session']`, `['wallets']`, `['content']`, `['nfts', search]`, `['nft', id]`, `['order', id]`, `['favorites']`. Mutations invalidam a key do recurso. O catálogo usa `placeholderData: keepPreviousData` e o `AbortSignal` do Query. Não há `retry` customizado além do padrão do Query; a leitura do pedido em andamento usa `retry: false`.

## 7. REST e Socket.IO

No `connect` e na reconexão o cliente invalida NFTs, carrinho e pedido. `nft.updated` atualiza o cache da lista e invalida o detalhe e o carrinho. `order.updated` grava o status no cache do pedido e invalida carrinho e pedido. O preço sobe `0.10` ETH uma vez por sessão do browser (`sessionStorage` `kurio-nft-bump`), só se houver item no carrinho.

## 8. Idempotência

`POST /api/orders` manda `Idempotency-Key`. O id do pedido é essa chave. Repetir a chave devolve o mesmo pedido. A chave fica em `sessionStorage` (`kurio-checkout-order`) antes do POST, para um refresh ou um timeout retomar o mesmo pedido. A cotação é reenviada com `quoteVersion`. Se a versão não bater, a API responde 409 e a compra não segue. O botão fica desabilitado enquanto o POST ou o pedido `pending` estão ativos.

Na confirmação, o mock tira do carrinho só as quantidades compradas daquelas edições. O recibo é o snapshot gravado no pedido.

## 9. MSW

O worker sobe em `src/mocks/browser.ts` e é ligado no `main` antes da UI. O cenário vem de `?cenario=` e fica em `sessionStorage` (`kurio-scenario`): `normal`, `lentidao`, `erro`, `sessao-expirada`, `esgotado`, `timeout`, `vazio` ou `favorito`. Em `esgotado`, o detalhe devolve as edições indisponíveis. Em `timeout`, o primeiro `POST /api/orders` grava o pedido e responde 504; a mesma `Idempotency-Key` devolve esse pedido. Em `vazio`, `GET /api/nfts` devolve a lista vazia. `/?reset=1` apaga `kurio-mock-store`, o cenário e as chaves de checkout e de preço. A nota `recusar` no pagamento faz o pedido terminar como `refused`. O término do pedido pendente acontece dentro do handler do MSW, não no componente.

## 10. Responsividade

- Menor que 768px: mobile. Largura fluida, sem medidas fixas de frame. A home usa padding lateral de 24px.
- 768px a 1023px: o header, o catálogo e o pagamento desktop aparecem. A sidebar da conta vira `Sheet`. O formulário de pagamento, perfil e carteiras fica em uma coluna até 1024px.
- 1024px ou mais: desktop, conteúdo até 1200px.

A tab bar só existe abaixo de 768px e não entra no checkout.

## 11. Decisões de UX

- O botão central da tab bar abre a busca e os filtros do catálogo. Não há tela de scan.
- Os círculos do hero mobile são classes em `src/styles/hero.css`. O card antigo era um fundo opaco e não tinha essas camadas.
- Os três indicadores do carrossel são bolinhas. A ativa fica opaca e as outras com opacidade 0.5. No mobile medem 7px; no desktop, 8px.
- O hero troca de destaque a cada 5s. A troca pausa no hover, com foco dentro do carrossel e enquanto o usuário arrasta. Não roda com `prefers-reduced-motion: reduce`. Há um botão para pausar ou retomar.
- Atividade, lista de interesse, ofertas, arquivos e suporte da sidebar abrem "Em breve" em `/perfil/$section`. Não salvam nada.
- O checkout abaixo de 768px continua o fluxo em etapas que já existia.
- A confirmação do pedido é um modal. Abaixo de 768px o modal ocupa a tela e os metadados ficam em grade 2×2. Fechar volta para `/`.
- A rota direta `/pedidos/$orderId` abre o mesmo modal quando o pedido está confirmado.
- Login desktop é o modal descrito na seção de sessão. Cadastro desktop reaproveita os campos já existentes dentro desse modal.
- No detalhe, rede, contrato e direitos seguem a API, não a troca que aparecia no Figma.
- Edições e o stepper do carrinho mobile não foram redesenhados neste passo.
- O total do pagamento usa a largura da coluna (405px no desktop), não uma linha solta de 321px. No modal, o bloco de totais tem no máximo 321px.
- Conectar, Recusar e Desconectar continuam no pagamento porque a simulação de carteira e os testes usam esses botões. A seleção do rádio escolhe a carteira; a conexão muda nesses botões.
- "Ver no Etherscan" é um link para `https://etherscan.io` com `role="button"`, para o teste achar o botão e o clique abrir uma aba nova.
- O nome ENS no pagamento tem o select `.eth` e o campo do nome, porque a API exige o nome.

## 12. Limitações

- Carrinho, favoritos, cupom e pedidos ficam num espaço do visitante e noutro por conta. No login ou no cadastro, o que o visitante tinha entra na conta e o espaço do visitante esvazia. Sair volta ao espaço vazio do visitante. Um pedido só é lido por quem o criou.
- A sessão só expira quando `kurio-expire-session` está marcado. Não há prazo automático.
- Newsletter do rodapé só valida o e-mail na tela.
- Google e Facebook no login são visuais.
- Não há suíte Playwright nova para perfil, carteiras ou a tab bar.
- Telas mobile de Início (além da base), Detalhes, Carrinho, Pagamento, Login e Cadastro continuam as versões anteriores onde este passo não as substituiu.
