import express, { type Express } from "express";
import cors from "cors";
import s3Routes from "./routes/s3Routes";
import errorMiddleware from "./midleware/ErrorMidleware";

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "teste-servico-s3-da-aws",
    message:
      "Testando serviço s3 da aws",
  });
});

app.use("/s3", s3Routes);


app.use(errorMiddleware);

export default app;
