# Vendas — notificações

PWA simples que recebe a notificação **"Venda aprovada! — Valor: R$ X"** a cada depósito concluído.
Página hospedada no GitHub Pages; checagem feita pelo GitHub Actions a cada ~5 min.

## Secrets (Settings → Secrets and variables → Actions)
| Secret | O que é |
|---|---|
| `BACKOFFICE_API_URL` | Base da API, ex.: `https://backoffice.play4tune.com/api` |
| `BACKOFFICE_TOKEN` | Token/API key do backoffice (ex.: `Bearer xxx`) |
| `BACKOFFICE_AUTH_HEADER` | Opcional. Nome do header (padrão `Authorization`) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Chaves de push |
| `PUSH_SUB_1` … `PUSH_SUB_5` | Código de cada celular (aparece no app depois de ativar) |

Variables opcionais: `NOTIFY_TITLE`, `NOTIFY_BODY` (`{valor}` vira o valor).

## Instalar no celular
1. Abra o link do GitHub Pages no celular
2. iPhone: Compartilhar → Adicionar à Tela de Início → abra pelo ícone. Android: menu → Instalar app
3. Toque em **Ativar notificações** → **Copiar código** → salve como secret `PUSH_SUB_1`
4. Teste: Actions → Notificar vendas → Run workflow → `test`

Obs.: o GitHub pausa agendamentos de repositórios sem atividade por 60 dias — se parar, é só reativar em Actions.
