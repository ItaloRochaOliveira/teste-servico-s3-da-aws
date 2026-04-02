import { Router } from "express";
import S3Controller from "../controller/s3Controller";
import { MulterConfig } from "@/config/multer.config";

const s3Controller = new S3Controller();

const s3Routes: Router = Router();

// com criptografia em código (chave indicada na configuração do bucket na aws)
s3Routes.get("/list-buckets", s3Controller.listBuckets);
s3Routes.post("/upload", MulterConfig.noStorage().single("file"), s3Controller.upload);
s3Routes.get("/download", s3Controller.download);
s3Routes.get("/list-objects", s3Controller.listObjects);

// com criptografia por lado do serviço s3
s3Routes.get("/list-objects-encrypted", s3Controller.listObjectsEncrypted);
s3Routes.post("/upload-encrypted", MulterConfig.noStorage().single("file"), s3Controller.uploadEncrypted);
s3Routes.get("/download-encrypted", s3Controller.downloadEncrypted);


export default s3Routes;
