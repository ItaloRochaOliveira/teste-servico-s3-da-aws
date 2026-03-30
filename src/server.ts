import { env } from "@/env";
import app from "./app";

async function bootstrap() {
  app.listen(env.PORT, () => {
    console.log(`🚀 HTTP Server is running! url: http://localhost:${env.PORT}`);
  });
}

void bootstrap();
