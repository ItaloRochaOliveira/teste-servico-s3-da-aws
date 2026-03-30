import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Variáveis de ambiente inválidas", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
