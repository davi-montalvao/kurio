# Kurio

Marketplace de NFTs para colecionar, filtrar e comprar arte digital. Catálogo, carrinho, pagamento e conta rodam no navegador: a API, a sessão e o tempo real são simulados com MSW. Não há blockchain nem gateway de pagamento.

## Começar

Requisitos: Node.js 22+.

```bash
npm install
npx playwright install chromium
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Na primeira carga o service worker do MSW sobe e a página recarrega uma vez. Se a lista ficar vazia, recarregue de novo.

Para desligar os mocks, crie um `.env` com `VITE_ENABLE_MSW=false`. Sem isso a interface não tem API.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run preview` | Serve o build |
| `npm run lint` | Oxlint |
| `npm run test:e2e` | Playwright (Chromium, 1280×800). Sobe o dev server se precisar |
| `npm run lighthouse` | Três medições de Início e Detalhe, mobile e desktop. Medianas em `lighthouse/summary.md` |

O relatório HTML do Playwright fica em `playwright-report/` depois de `npm run test:e2e`. Traces são gravados quando um teste falha.

## Rotas

| Caminho | Tela |
|---|---|
| `/` | Início. Busca, filtros, ordenação e página ficam na URL |
| `/nfts/$id` | Detalhe do NFT |
| `/carrinho` | Carrinho e cupom |
| `/pagamento` | Checkout |
| `/pedidos/$id` | Recibo, pendente ou recusa |
| `/entrar` | Login e cadastro |
| `/perfil` | Dados da conta. Carteiras ficam na mesma página |
| `/favoritos` | Itens marcados com o coração |

Um NFT direto para testar: `/nfts/emerald-ape-042`.

## Conta de demonstração

Não existe usuário inicial. Crie um em **Entrar → Criar conta**. Os testes usam:

- e-mail `colecionador@kurio.test`
- senha `senha123`

A conta fica no `localStorage` do navegador (`kurio-mock-store`). A senha é gravada como hash SHA-256, não como texto. Não use isso como modelo de autenticação real.

Para zerar catálogo, carrinho, sessão e pedidos, apague a chave `kurio-mock-store` no DevTools e recarregue.

## Fluxos da simulação

**Comprar.** No detalhe, escolha a edição e a quantidade e vá ao carrinho. O pagamento pede login. Depois de entrar, conecte a carteira, preencha o perfil e confirme. O recibo só aparece depois que a simulação confirma o pedido. Favoritos e o pedido também pedem conta.

**Cupom.** No carrinho, `KURIO10` aplica 10% sobre o subtotal. Qualquer outro código é inválido. `EXPIRADO` devolve cupom expirado. Subtotal, desconto, taxa de rede e total vêm da cotação da API, em ETH como string decimal.

**Recusar o pagamento.** No campo de observação do checkout, escreva `recusar`. O pedido termina recusado e os itens continuam no carrinho.

**Preço ao vivo.** Com um NFT no carrinho, o mock pode emitir `nft.updated` e subir o preço em 0,10 ETH. O checkout pede para revisar a cotação antes de confirmar. Isso acontece uma vez por sessão do navegador.

**Cenário.** Abra a home com `?cenario=` na URL. O valor fica salvo na aba até o reset.

- `lentidao` deixa as respostas mais lentas.
- `erro` faz o catálogo responder 500.
- `sessao-expirada`, com a conta aberta, encerra a sessão e abre o login. Depois de entrar, a tela volta para onde você estava.
- `esgotado` marca as edições como esgotadas. No detalhe, a compra fica desabilitada.
- `timeout`, no pagamento, faz a primeira confirmação falhar depois de gravar o pedido. Confirmar de novo usa a mesma chave e devolve esse pedido.
- `vazio` devolve o catálogo sem NFTs.
- `favorito` faz o favoritar responder 500. A estrela volta ao estado anterior.

**Reset.** Abra `/?reset=1`. Isso apaga conta, carrinho, pedidos e o cenário, e recarrega o estado inicial.

## O que a interface usa

React 19, TypeScript, TanStack Router, TanStack Query, Axios, Tailwind CSS 4, MSW 3 e `socket.io-client`. Fonte de interface: Roboto Mono. Valores em ETH são calculados com `decimal.js` na camada de mock; a tela só formata a cotação recebida.
