# Immersia — Front web

Repositório independente iniciado a partir de `legacy/platform-safety/apps/web`. O histórico anterior permanece no repositório legado.

Instale as dependências com `npm ci`. Para o ambiente integrado, execute `docker compose up --build` em `platform`; ele configura a API em `http://localhost:4000/api/v1`. Para desenvolvimento sem Docker, copie `.env.example` para `.env.local` e ajuste a URL se necessário.

## Dois modos

| Modo | Quando | Telas |
|---|---|---|
| **Plataforma** | `VITE_API_URL` definido (padrão do `.env.example` e do Compose) | `src/plataforma/`: ligadas ao `platform-back` |
| **Demonstração** | sem `VITE_API_URL`, ou `VITE_DEMO_MODE=true` | `src/pages/`: vitrine do site, com dados simulados no navegador |

### Modo plataforma (`src/plataforma`)

Só pelo navegador, pensado também para o celular (quem digita o código do Quest costuma estar ao lado do óculos). Visual enxuto: título curto, tabelas sem caixa-alta; os painéis concentram os números e os gráficos.

- `api.ts`: cliente da API (`/api/v1`), tipos e conversão de perfis (`platform_admin`, `company_admin`, `instructor`, `student` no back; super admin, gestor, instrutor e aluno no front).
- `PlatformApp.tsx`: rotas por perfil e a troca de senha obrigatória no primeiro acesso.
- `ui.tsx` (componentes), `charts.tsx` (gráficos SVG: uma série por gráfico, dica ao passar o mouse), `LearnerReport.tsx` (ficha de acompanhamento do aluno, usada pelo instrutor, pelo gestor e pelo próprio aluno), `format.ts` (textos, datas, CSV), `people.ts` e `courses.ts` (formulários).

| Tela | Rota | Perfis |
|---|---|---|
| Meus cursos | `/app/meus-cursos`, `/app/meus-cursos/:matricula/:atribuicao` | aluno: só a galeria de cursos; no curso, as etapas e um painel de progresso (tempo de estudo, validade, certificado) |
| Etapa | `/app/meus-cursos/:matricula/:atribuicao/etapas/:etapa` | aluno: texto, apostila (PDF embutido, abrir, baixar), vídeo (YouTube, Vimeo, .mp4), imagem, link e quiz corrigido pela API; sumário do curso ao lado, anterior/próxima, marcar como concluída |
| Pré-visualização da etapa | `/app/cursos/:curso/etapas/:etapa` | Immersia e gestor: a etapa como o aluno vê; o quiz é corrigido sem registrar |
| Meu desempenho | `/app/desempenho`, `/app/desempenho/:matricula/:atribuicao` | aluno: o geral (cursos concluídos, tempo de estudo, tempo para concluir, notas e tempo de resposta nos quizzes, VR, próximos passos) e a página de cada curso (etapas, cada quiz com o acerto por pergunta, cada treinamento VR com as competências) |
| Iniciar treinamento | `/app/iniciar?turma=&licao=&matricula=` | instrutor: turma → treinamento → aluno (com a situação de cada um) → código; ou rodada de teste. Aluno: treinamento → código |
| Painel | `/app/painel?turma=&curso=&periodo=` | gestor e instrutor: participação, nota, aprovação, evolução, faixas de nota, onde os alunos erram, competências, turmas, alunos e tentativas; a Immersia vê o painel da plataforma: clientes ativos, uso, crescimento em 12 meses, funil do aluno, saúde das organizações e desempenho por curso |
| Aluno | `/app/alunos/:id`, `/app/alunos/:id/cursos/:matricula/:atribuicao` | gestor e instrutor: a ficha do aluno e o desempenho dele em cada curso |
| Sessões VR | `/app/sessoes`, `/app/sessoes/:id` | aluno vê as suas; instrutor e gestor, as das turmas |
| Turmas / Minhas turmas | `/app/turmas`, `/app/turmas/:id` | gestor e instrutor (Minhas turmas): cartões com risco, situação dos alunos e tendência; no detalhe, abas Visão geral (indicadores, situação, curva da turma, nota por tentativa, onde erram, alunos), Progresso (matriz aluno × etapa) e Alunos e cursos (gestão: vários instrutores, matrícula em lote, cursos, reciclagem) |
| Treinamentos VR | `/app/treinamentos`, `/app/treinamentos/:licao` | só Immersia: uso e desempenho de cada treinamento VR em todas as organizações ou em uma (cobertura, nota, etapa por etapa, erros, competências, curva por tentativa), sem nomes de alunos, para saber onde melhorar o conteúdo |
| Pessoas | `/app/pessoas` | gestor: instrutores e alunos, edição, senha provisória, importação por CSV |
| Conformidade | `/app/conformidade` | gestor: situação, reciclagem, certificados, CSV |
| Quests | `/app/quests` | gestor: cadastro pelo código, situação, só Quests cadastrados |
| Organizações | `/app/organizacoes`, `/app/organizacoes/:id` | Immersia: gestores e cursos liberados |
| Cursos | `/app/cursos`, `/app/cursos/:id` | Immersia mantém o catálogo (busca e páginas); gestor vê o catálogo como vitrine: os cursos da organização e os disponíveis para contratar com a equipe Immersia; no rascunho, a Immersia monta as etapas: texto, apostila (envio de PDF), vídeo, quiz (editor de perguntas), imagem, link e VR |
| Certificado | `/app/certificados/:matricula/:atribuicao` | aluno e quem o acompanha (dados da NR-1, imprimir ou PDF) |
| Verificação pública | `/verificar/:matricula/:atribuicao?codigo=` | qualquer pessoa |
| Perfil | `/app/perfil` | todos: troca de senha |

Em desenvolvimento, `/dev/instructor` (e `super-admin`, `org-admin`, `learner`) entra direto com as contas do seed demo do back (`python -m app.seed --demo`).

### Modo demonstração

Roda inteiro no navegador (`src/lib/demoApi.ts`), sem back-end. É o que vai junto do site institucional. As telas desse modo usam o vocabulário antigo (estudos, trilhas, grupos) e não falam com a API.

## Desenvolvimento

```powershell
npm run dev
```

Com Docker Compose, `VITE_API_URL` já vem configurado para `http://localhost:4000/api/v1`. Sem Docker, use o `.env.example` (mesma URL) e libere a origem do front no back (`CORS_ORIGINS`, padrão `http://localhost:5173`).
