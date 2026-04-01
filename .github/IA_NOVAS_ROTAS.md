# Guia para IA: criação de novas rotas (API Express)

Este documento descreve a arquitetura, convenções e passos obrigatórios deste repositório para que assistentes de IA (e humanos) adicionem **rotas HTTP novas** de forma consistente com o código existente.

**Stack:** Node.js, **Express 5**, **TypeScript** (`module`/`moduleResolution`: **NodeNext**), **Zod**, **AWS SDK v3** (S3 onde aplicável), **Multer** (uploads), **Winston** (logs), **CORS**.

---

## 1. Arquitetura em camadas

Ordem de dependência (sempre para **dentro**, nunca o contrário):

| Camada | Pasta | Responsabilidade |
|--------|--------|------------------|
| **Rotas** | `src/routes/` | Define `Router`, método HTTP, path, middlewares (ex.: Multer) e associa ao método do controller. |
| **Controller** | `src/controller/` | HTTP: lê `req`, valida entrada (Zod), chama **service**, monta `res` (status, headers, body). **Não** contém regra de negócio pesada nem chamadas diretas repetidas a SDKs externos (exceto padrão atual do S3 — ver §7). |
| **Service** | `src/service/` | Orquestra casos de uso; depende de **interfaces** de repositório (`src/types/interfaces/`). |
| **Repository** | `src/repository/` | Acesso a dados / APIs externas (ex.: `S3Client`, comandos AWS). |
| **Utils / config** | `src/utils/`, `src/config/` | Helpers compartilhados (ex.: `fileDownload.ts`), Multer, Winston. |

**Middleware global de erro** (`src/midleware/ErrorMidleware.ts`) é registrado **por último** em `src/app.ts` — após todas as rotas.

---

## 2. Alias de importação

- Use o prefixo **`@/`** para imports a partir de `src/`:
  - `@/env`, `@/controller/...`, `@/service/...`, `@/repository/...`, `@/utils/...`, `@/config/...`, `@/types/...`
- Definido em `tsconfig.json` (`paths`: `"@/*": ["src/*"]`).
- Evite imports relativos longos (`../../../`) quando `@/` for equivalente.

---

## 3. Variáveis de ambiente

- Carregamento e validação centralizados em **`src/env/index.ts`** com **Zod**.
- Para novas variáveis: **estenda o schema Zod** em `src/env/index.ts`, atualize **`.env.example`** e documente no `README.md` se necessário.
- **Nunca** commitar segredos; use apenas placeholders no exemplo.

---

## 4. Onde registrar uma rota nova

1. **Router** dedicado (recomendado): crie ou edite `src/routes/<feature>Routes.ts`:
   - `import { Router } from "express"`
   - `const router = Router()`
   - `router.get|post|put|patch|delete(path, ...middlewares, controller.method)`
   - `export default router`
2. **Montagem no app:** em **`src/app.ts`**, importe o router e use `app.use("/prefixo", nomeRoutes)`.
3. **Prefixo:** o projeto usa `/s3` para rotas S3 (`app.use("/s3", s3Routes)`). Novos agrupamentos devem seguir o mesmo padrão (`/recurso`, `/api/v1/...`, etc.).

Ordem em `app.ts`:

1. `express.json()` (e `cors()` já existentes)
2. Rotas (incluindo `GET /` se existir)
3. **`app.use(errorMiddleware)` por último**

---

## 5. Padrão do controller

- Classe **export default** ou funções exportadas — o projeto atual usa **classe** (`S3Controller`) instanciada no arquivo de rotas.
- Assinatura dos handlers: **`async (req, res, next)`** com tipos **`Request`, `Response`, `NextFunction`** do Express.
- **Sempre:**
  - `try { ... } catch (error) { next(error); }` para erros propagarem ao `ErrorMidleware`.
  - Respostas com **`return res.status(...).json(...)`** ou **`return res.status(...).send(...)`** para encerrar o fluxo.
- **Validação de entrada:** preferir **Zod** (`schema.parse` / `safeParse`) em schemas em **`src/controller/schema.ts/`** (ou subpasta por feature). Erros Zod são tratados pelo middleware (400 + detalhes).
- **Respostas de erro de validação manual** (query/body inválidos): use **`res.status(400).json({ error: "..." })`** com `return`, ou lance **`new BadRequest("mensagem")`** (de `src/utils/errors/BadRequest.ts`) para padronizar com o middleware.

---

## 6. Padrão do service e repository

- **Service:** classe com `constructor` recebendo dependências (ex.: `IS3Repository`). Métodos assíncronos retornando tipos explícitos (`Promise<...>`).
- **Repository:** implementa interface em **`src/types/interfaces/`**; nome típico `I<Nome>Repository.ts`.
- Ao adicionar método novo no repository **atualize a interface** correspondente e os métodos do service que delegam para ele.

---

## 7. Cliente AWS S3 (padrão atual do projeto)

Hoje, **cada método** do `S3Controller` instancia **`new S3Client({ region, credentials })`** com `env.AWS_*`. Para novas rotas que usem S3:

- Siga o **mesmo padrão** até haver refatoração para factory/singleton (evite inventar outro padrão só na nova rota sem alinhar o restante).
- Credenciais: `env.AWS_ACCESS_KEY_ID`, `env.AWS_SECRET_ACCESS_KEY`, `env.AWS_REGION`; bucket: `env.AWS_BUCKET_NAME`.

---

## 8. Upload de arquivos (Multer)

- Configuração em **`src/config/multer.config.ts`** (`MulterConfig`).
- Upload em memória: `MulterConfig.noStorage().single("file")` — o campo do form deve ser **`file`** (como em `/s3/upload`), salvo decisão contrária documentada.
- Limite e `fileFilter` já definidos na classe; ao precisar de novos tipos MIME/extensões, **ajuste `fileFilter`** de forma explícita.
- Validação do objeto arquivo: schema Zod em **`uploadSchema`** (campos `fieldname`, `originalname`, `buffer`, etc.).

---

## 9. Respostas HTTP

- **JSON:** `res.status(2xx).json(payload)` — tipagem e formato estáveis para clientes.
- **Download de arquivo / binário:** como em `download`: definir `Content-Disposition`, `Content-Type`; para JSON já parseado usar `send(JSON.stringify(...))` quando necessário evitar corpo vazio; texto com `charset=utf-8` quando aplicável.
- **Não** misturar envio duplo de resposta no mesmo handler (um único `return` por caminho feliz).

---

## 10. Erros e middleware

Classes de erro HTTP em **`src/utils/errors/`** estendem **`HttpError`** (`HttpError.ts`):

- `BadRequest` (400), `NotFound`, `Unauthorized`, etc.

O **`ErrorMidleware`** trata, entre outros:

- `ZodError` → 400 + detalhes
- `BadRequest`, `NotFound`, `Unauthorized`
- `JsonWebTokenError` → 401
- `AxiosError`
- Demais → 500 com mensagem genérica

Para novas rotas: **prefira** lançar essas classes ou `next(error)` após `catch`, em vez de responder erro manualmente em todo lugar (exceto validações simples 400 com JSON curto, como query obrigatória).

---

## 11. Nomenclatura e arquivos

| Tipo | Convenção |
|------|-----------|
| Rotas | `camelCase` arquivo: `s3Routes.ts`, `userRoutes.ts` |
| Controller | `s3Controller.ts` — classe `S3Controller` |
| Service | `S3Service.ts` |
| Repository | `S3Repository.ts` |
| Schema Zod | `src/controller/schema.ts/<nome>.ts` ou agrupar por feature |
| Interfaces | `IS3Repository.ts` com `I` prefix |

---

## 12. Checklist — nova rota

- [ ] Definir método HTTP, path completo (com prefixo em `app.ts`) e responsabilidade.
- [ ] Criar/ajustar método no **controller** com `try/catch` e `next(error)`.
- [ ] Validar **query/body/params** com Zod ou checagens explícitas; atualizar **schemas** se necessário.
- [ ] Implementar lógica no **service** e, se precisar de persistência/API externa, no **repository** + **interface**.
- [ ] Registrar rota no **Router** e montar em **`app.ts`** (antes do `errorMiddleware`).
- [ ] Se nova env: **env/index.ts** + `.env.example`.
- [ ] Tipos exportados/`declaration` ok (`pnpm run build` ou IDE).
- [ ] Atualizar **README.md** (tabela de endpoints) se o projeto documentar a API ali.

---

## 13. Esqueleto mínimo (referência)

**`src/routes/exemploRoutes.ts`**

```typescript
import { Router } from "express";
import ExemploController from "../controller/exemploController";

const exemploController = new ExemploController();
const router = Router();

router.get("/ping", exemploController.ping);

export default router;
```

**Trecho em `src/app.ts`**

```typescript
import exemploRoutes from "./routes/exemploRoutes";
// ...
app.use("/exemplo", exemploRoutes);
```

**`exemploController.ts` (padrão try/catch)**

```typescript
import { NextFunction, Request, Response } from "express";

export default class ExemploController {
  async ping(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 14. O que evitar

- Lógica de negócio pesada no controller ou na rota.
- Ignorar `next(error)` em handlers `async` (risco de erro não tratado).
- Importar SDK AWS diretamente no service se o padrão do projeto for sempre via repository (S3 já está no repository).
- Adicionar rotas **depois** do `errorMiddleware` em `app.ts`.
- Quebrar o contrato da interface do repositório sem atualizar todos os implementadores.

---

*Documento gerado para o repositório **teste-servico-s3-da-aws** — alinhar novas contribuições ao estilo existente.*
