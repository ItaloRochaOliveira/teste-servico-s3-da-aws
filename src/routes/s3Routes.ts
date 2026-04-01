import { Router } from "express";
import multer from "multer";
import S3Controller from "../controller/s3Controller";
import { MulterConfig } from "@/config/multer.config";

const s3Controller = new S3Controller();

const s3Routes: Router = Router();
s3Routes.get("/list-buckets", s3Controller.listBuckets);
s3Routes.post("/upload", MulterConfig.noStorage().single("file"), s3Controller.upload);
s3Routes.get("/download", s3Controller.download);

export default s3Routes;
