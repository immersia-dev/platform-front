# Immersia — Front web

Repositório independente iniciado a partir de `legacy/platform-safety/apps/web`. O histórico anterior permanece no repositório legado.

Instale as dependências com `npm ci`. Para o ambiente integrado, execute `docker compose up --build` em `platform`; ele configura a API em `http://localhost:4000/api/v1`. Para desenvolvimento sem Docker, copie `.env.example` para `.env.local` e ajuste a URL se necessário.

Front-end web da plataforma Safety.

## Integracao com a API

O front consome a API em `VITE_API_URL`.

Valor padrao em desenvolvimento:

```text
http://localhost:8000/api/v1
```

Fluxo atual:

- login usa `POST /auth/login`;
- a sessao guarda usuario e bearer token;
- apos autenticar, o front busca `GET /platform/snapshot`;
- o snapshot alimenta a camada de dados usada pelas telas atuais;
- progresso de aula usa `PUT /studies/lessons/{lesson_id}/progress`;
- apos atualizar progresso, o snapshot e recarregado.

Essa camada de snapshot e temporaria/intencional: ela permite que o front deixe de depender de dados estaticos enquanto as telas ainda usam helpers herdados do periodo mock-first.

## Desenvolvimento

```powershell
npm run dev
```

Com Docker Compose, `VITE_API_URL` ja e configurado para `http://localhost:8000/api/v1`.
