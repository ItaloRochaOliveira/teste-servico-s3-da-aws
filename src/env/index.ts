import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3006),
  
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_BUCKET_NAME: z.string(),
  /** Segredo para AES-256-GCM nas rotas *-encrypted (criptografia no serviço antes do S3). */
  S3_APP_ENCRYPTION_KEY: z.string().min(8),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Variáveis de ambiente inválidas", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
