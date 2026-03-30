import S3Repository from "@/repository/S3Repository";
import S3Service from "@/service/S3Service";
import { NextFunction, Request, Response } from "express";
import uploadSchema from "./schema.ts/uploadSchema";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

export default class S3Controller {
    async listBuckets(req: Request, res: Response, next: NextFunction) {
        try {
            const s3 = new S3Client({
                region: env.AWS_REGION,
                credentials: {
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                },
            });

            const s3Service = new S3Service(new S3Repository(s3));
            const buckets = await s3Service.listBuckets();

            return res.status(200).json(buckets);
        } catch (error) {
            next(error);
        }
    }

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
        const file = uploadSchema.parse(req.file);

        const s3 = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const s3Service = new S3Service(new S3Repository(s3));
        await s3Service.upload(file as unknown as Express.Multer.File);

        return res.status(200).json({
        message: "File uploaded successfully",
        });
    } catch (error) {
        next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
        const fileName = req.query.fileName as string;

        const s3 = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const s3Service = new S3Service(new S3Repository(s3));

        const file = await s3Service.download(fileName);

        return res.status(200).json(file);
    } catch (error) {
        next(error);
    }
  }
}