import S3Repository from "@/repository/S3Repository";
import S3Service from "@/service/S3Service";
import { NextFunction, Request, Response } from "express";
import { listObjectsQuerySchema } from "./schema.ts/listObjectsSchema";
import uploadSchema, { downloadSchema } from "./schema.ts/uploadSchema";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

export default class S3Controller {
    async listObjects(req: Request, res: Response, next: NextFunction) {
        try {
            const query = listObjectsQuerySchema.parse(req.query);

            const s3 = new S3Client({
                region: env.AWS_REGION,
                credentials: {
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                },
            });

            const s3Service = new S3Service(new S3Repository(s3));
            const result = await s3Service.listBucketObjects({
                prefix: query.prefix,
                continuationToken: query.continuationToken,
                maxKeys: query.maxKeys,
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

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
        const caminho = downloadSchema.parse(req.body).caminho;

        const s3 = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const s3Service = new S3Service(new S3Repository(s3));
        await s3Service.upload(file as unknown as Express.Multer.File, caminho);

        return res.status(200).json({
        message: "File uploaded successfully",
        });
    } catch (error) {
        next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
        const raw = req.query.fileName;
        if (raw === undefined || raw === "" || Array.isArray(raw)) {
            return res.status(400).json({
                error: "Informe o query parameter fileName (string).",
            });
        }
        const fileName = String(raw);

        const s3 = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const s3Service = new S3Service(new S3Repository(s3));

        const file = await s3Service.download(fileName);

        res.setHeader(
            "Content-Disposition",
            `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        );

        if (file.kind === "json" && file.json !== undefined) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            return res.status(200).send(JSON.stringify(file.json));
        }

        if ((file.kind === "text" || file.kind === "json") && file.text !== undefined) {
            res.setHeader("Content-Type", `${file.mimeType}; charset=utf-8`);
            return res.status(200).send(file.text);
        }

        res.setHeader("Content-Type", file.mimeType);
        return res.status(200).send(Buffer.from(file.buffer));
    } catch (error) {
        next(error);
    }
  }
}