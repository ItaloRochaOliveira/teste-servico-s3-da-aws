# ☁️ Serviço de integração com Amazon S3

API REST em **Node.js** para listar buckets, enviar e baixar objetos no **Amazon S3**, com **Express 5**, **TypeScript**, **AWS SDK v3**, validação com **Zod** e tratamento de erros centralizado.

## ✨ Funcionalidades

### 🪣 Amazon S3
- ✅ Listagem de buckets da conta configurada
- ✅ Listagem de objetos do bucket configurado (`ListObjectsV2`), com prefixo opcional, paginação e **`pathTree`** (pastas como objetos, arquivos agrupados em arrays)
- ✅ Upload de arquivos via **multipart/form-data** (campo `file`)
- ✅ Download por **key** do objeto, com inferência de MIME pela extensão quando o S3 retorna tipo genérico
- ✅ Resposta de download alinhada ao tipo: JSON parseado, texto (`text/plain`, `.txt`, etc.) ou binário com `Content-Type` adequado
- ✅ `Content-Type` e checksum no upload (`PutObject`) para metadados corretos no bucket

### 🛡️ Qualidade e DX
- ✅ Variáveis de ambiente validadas com **Zod**
- ✅ Middleware de erro unificado (Axios, JWT, Zod, erros HTTP customizados)
- ✅ Logs com **Winston**
- ✅ **CORS** habilitado para consumo por outros frontends

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** com **Express 5**
- **TypeScript**
- **AWS SDK for JavaScript v3** (`@aws-sdk/client-s3`)
- **Multer** para upload em memória
- **Zod** para validação de env e de upload
- **dotenv** para carregar `.env`
- **tsx** para desenvolvimento com hot reload

### Infraestrutura
- **Docker** (multi-stage) e **Docker Compose**
- **pnpm** para gerenciamento de pacotes

## 📁 Estrutura do Projeto

```
teste-servico-s3-da-aws/
├── src/
│   ├── app.ts                 # Express, CORS, rotas / e /s3
│   ├── server.ts              # Bootstrap HTTP + PORT
│   ├── env/                   # Validação de variáveis (Zod)
│   ├── routes/
│   │   └── s3Routes.ts        # Rotas S3
│   ├── controller/
│   │   ├── s3Controller.ts
│   │   └── schema.ts/         # Schemas Zod (ex.: upload)
│   ├── service/
│   │   └── S3Service.ts
│   ├── repository/
│   │   └── S3Repository.ts    # AWS S3 (list, put, get)
│   ├── config/                # Multer, Winston
│   ├── midleware/
│   │   └── ErrorMidleware.ts
│   ├── utils/                 # fileDownload, pathTreeFromKeys (árvore de keys), erros HTTP, etc.
│   └── types/
├── .github/
│   └── IA_NOVAS_ROTAS.md      # Guia para IA e devs: novas rotas Express
├── DockerFile                 # Build da imagem da API
├── docker-compose.yml
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md                  # Este arquivo
```

## 📖 Documentação adicional

- **[Guia para criação de novas rotas](.github/IA_NOVAS_ROTAS.md)** — convenções de arquitetura (controller → service → repository), uso de Zod, Multer, middleware de erro, checklist e esqueletos de código para manter rotas alinhadas ao projeto (útil para humanos e para assistentes de IA).

## 🚀 Como Executar

### Pré-requisitos
- **Node.js 18+** (recomendado 20+ para alinhar ao Docker)
- **pnpm** (recomendado) ou npm
- Conta **AWS** com credenciais e bucket S3
- **Docker** e **Docker Compose** (opcional)

### Desenvolvimento local

1. **Clonar o repositório**
```bash
git clone git@github.com-pessoal:ItaloRochaOliveira/teste-servico-s3-da-aws.git
cd teste-servico-s3-da-aws
```

2. **Instalar dependências**
```bash
pnpm install
```

3. **Configurar ambiente**
```bash
cp .env.example .env
# Edite .env com PORT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
```

4. **Executar em modo desenvolvimento**
```bash
pnpm run start:dev
```

A API sobe em `http://localhost:3006` (ou na `PORT` definida no `.env`).

### Build e produção local
```bash
pnpm run build
pnpm run start
```

### Docker Compose

Na raiz do projeto (com `.env` preenchido):

```bash
docker compose up --build
```

A API é exposta em **http://localhost:3006** (mapeamento `3006:3006`).

> **Nota:** O `docker-compose.yml` referencia `dockerfile: Dockerfile`. Se no seu sistema o arquivo se chama `DockerFile`, ajuste o nome no compose ou renomeie o arquivo para `Dockerfile` em ambientes **case-sensitive** (Linux).

## 🔧 Configuração

### Variáveis de ambiente (`.env`)

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta HTTP (padrão **3006** se omitida) |
| `AWS_ACCESS_KEY_ID` | Access key IAM com permissão no S3 |
| `AWS_SECRET_ACCESS_KEY` | Secret correspondente |
| `AWS_REGION` | Região do bucket (ex.: `us-east-1`) |
| `AWS_BUCKET_NAME` | Nome do bucket para upload/download |

Exemplo (não commite segredos reais):

```env
PORT=3006

AWS_ACCESS_KEY_ID=sua_access_key_id
AWS_SECRET_ACCESS_KEY=sua_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=seu-bucket
```

## 📡 Endpoints da API

Base: `http://localhost:<PORT>`

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Informações básicas da API (JSON) |
| `GET` | `/s3/list-buckets` | Lista buckets |
| `GET` | `/s3/list-objects` | Lista objetos do `AWS_BUCKET_NAME`; documentação completa na subseção **GET /s3/list-objects** abaixo |
| `POST` | `/s3/upload` | Upload de arquivo (`multipart/form-data`, campo **`file`**) |
| `GET` | `/s3/download?fileName=<key>` | Download do objeto pela **key** no bucket |

### GET /s3/list-objects

Lista objetos do bucket definido em `AWS_BUCKET_NAME` via API **ListObjectsV2** da AWS. A rota está registrada em `app.ts` como `GET /s3/list-objects` (mesmo prefixo `/s3` das demais rotas S3).

#### Query parameters (todos opcionais, validados com Zod)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `prefix` | string | Prefixo da key (como “pasta” no S3). Ex.: `docs/` ou `projeto/imagens/`. Máx. 1024 caracteres. |
| `continuationToken` | string | Token retornado em `nextContinuationToken` na página anterior, para listar a próxima página quando `isTruncated` for `true`. |
| `maxKeys` | número | Quantidade máxima de keys nesta resposta (1–1000). |

#### Corpo da resposta (`200`, JSON)

| Campo | Descrição |
|-------|-----------|
| `objects` | Lista plana de objetos: `key`, `size`, `lastModified` (ISO 8601), `etag`, `storageClass`. |
| `pathTree` | Árvore derivada das keys (separador `/`). Pastas viram objetos aninhados; arquivos no mesmo diretório aparecem em **um array de strings** (nomes dos ficheiros). |
| `isTruncated` | `true` se existirem mais objetos; use `continuationToken` na próxima chamada. |
| `nextContinuationToken` | Presente quando há próxima página; copie para o query `continuationToken`. |
| `prefix` | O mesmo `prefix` enviado na query (eco). |

#### Formato de `pathTree`

- **Só ficheiros nessa pasta:** o valor é o array de nomes, p.ex. `"relatorios": ["a.pdf", "b.pdf"]`.
- **Só subpastas:** o valor é um objeto com o próximo nível, p.ex. `"relatorios": { "2024": ["x.pdf"] }`.
- **Ficheiros e subpastas no mesmo nível:** os ficheiros ficam em `arquivos` e as pastas como outras chaves no mesmo objeto, p.ex. `"relatorios": { "arquivos": ["a.pdf"], "2024": ["x.pdf"] }`.
- **Objetos na raiz do bucket** (key sem `/`): aparecem em `arquivos` no topo de `pathTree`, p.ex. `{ "arquivos": ["readme.txt"], "pasta": { ... } }`.

> **IAM:** é necessário permissão de listagem no bucket (por exemplo `s3:ListBucket` no recurso do bucket e, se usar prefixos restritivos na política, alinhar o prefixo).

### Exemplos

**Health / info**
```bash
curl -s http://localhost:3006/
```

**Listar buckets**
```bash
curl -s http://localhost:3006/s3/list-buckets
```

**Listar objetos do bucket** (todos ou com prefixo de pasta)
```bash
curl -s "http://localhost:3006/s3/list-objects"
curl -s "http://localhost:3006/s3/list-objects?prefix=pasta/&maxKeys=50"
```

**Resposta de list-objects (exemplo ilustrativo)**
```json
{
  "objects": [
    {
      "key": "pasta/relatorio.pdf",
      "size": 1024,
      "lastModified": "2026-04-01T12:00:00.000Z",
      "etag": "abc123",
      "storageClass": "STANDARD"
    }
  ],
  "pathTree": {
    "pasta": {
      "arquivos": ["relatorio.pdf"]
    }
  },
  "isTruncated": false,
  "nextContinuationToken": null,
  "prefix": "pasta/"
}
```

**Upload**
```bash
curl -X POST http://localhost:3006/s3/upload \
  -F "file=@./documento.txt"
```

**Download (key = nome do objeto no bucket)**
```bash
curl -s -o baixado.txt "http://localhost:3006/s3/download?fileName=documento.txt"
```

**Resposta de upload (exemplo)**
```json
{
  "message": "File uploaded successfully"
}
```

## 🔒 Segurança

### Implementações recomendadas na evolução do projeto
- Credenciais **somente** via `.env` ou secret manager; **nunca** commitar `.env`
- IAM com política mínima (apenas o bucket e ações necessárias: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, etc.)
- **HTTPS** em produção (reverse proxy ou load balancer)
- **CORS** restrito aos domínios do frontend em produção

### Boas práticas já adotadas
- Validação de entrada com **Zod**
- Tipagem com **TypeScript**
- Camadas **controller → service → repository**
- Tratamento de erros centralizado

## 🐛 Troubleshooting

### Variáveis de ambiente inválidas ao subir o servidor
- Confira se todas as chaves do `.env.example` estão preenchidas e sem aspas desnecessárias.
- `PORT` pode ser omitida: o padrão é **3006**.

### `AccessDenied` ou erros da AWS
- Verifique região, nome do bucket e permissões IAM.
- Confirme que a **key** no download é exatamente a do objeto (incluindo pastas/prefixos).

### Upload funciona, mas `.txt` ou tipo de arquivo “errado” no download
- O serviço infere MIME pela extensão quando o S3 envia `application/octet-stream`; use nomes de objeto com extensão (ex.: `arquivo.txt`).
- Garanta upload com `ContentType` (o repositório envia `ContentType` do Multer no `PutObject`).

### Docker não encontra o Dockerfile
- Em Linux, nomes `Dockerfile` vs `DockerFile` importam. Alinhe o nome do arquivo ao campo `dockerfile` no `docker-compose.yml`.

## 📈 Melhorias futuras

- [ ] Autenticação JWT nas rotas `/s3/*`
- [ ] Prefixo de tenant/pasta por usuário nas keys
- [ ] URLs assinadas (presigned URLs) para download direto do S3
- [ ] Testes automatizados (unitários e integração com LocalStack)
- [ ] Healthcheck dedicado (`GET /health`)
- [ ] Limite de tamanho e tipos MIME permitidos no upload (política explícita)

## 🤝 Como contribuir

1. Faça um **fork** do repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Ao adicionar ou alterar rotas HTTP, siga o **[guia em `.github/IA_NOVAS_ROTAS.md`](.github/IA_NOVAS_ROTAS.md)**.
4. Commit com mensagens claras (`git commit -m "Descreve a mudança"`)
5. Abra um **Pull Request**

## 📄 Licença

Este projeto está sob a licença **ISC** (veja `package.json`). Você pode adicionar um arquivo `LICENSE` com o texto completo, se desejar.

## 📞 Contato

- **Italo Rocha Oliveira**
- [LinkedIn](https://www.linkedin.com/in/italorochaoliveira/)
- [GitHub](https://github.com/ItaloRochaOliveira)
- Email: italo.rocha.de.oliveira@gmail.com

**API de exemplo para integração com Amazon S3 — desenvolvida com boas práticas de organização e tipagem.** 🚀
