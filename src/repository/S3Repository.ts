import { env } from "@/env";
import logger from "@/config/winston";
import type { BucketObjectSummary, ListBucketObjectsResult } from "@/types/s3ListBucketObjects";
import { type PathTree } from "@/utils/pathTreeFromKeys";
import type { ListBucketObjectsOptions } from "@/types/interfaces/IS3Repository";
import IS3Repository from "@/types/interfaces/IS3Repository";
import { buildProcessedDownload, type ProcessedDownload } from "@/utils/fileDownload";
import {
  Bucket,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  ServerSideEncryption,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import BadRequest from "@/utils/errors/BadRequest";
import { decryptBuffer, encryptBuffer } from "@/utils/appS3Encryption";

function logPutObjectResult(
  context: string,
  key: string,
  out: PutObjectCommandOutput,
): void {
  logger.info(`[S3 PutObject] ${context}`, {
    bucket: env.AWS_BUCKET_NAME,
    key,
    serverSideEncryption: out.ServerSideEncryption ?? "(não devolvido — bucket pode aplicar encriptação por defeito)",
    sseKMSKeyId: out.SSEKMSKeyId,
    bucketKeyEnabled: out.BucketKeyEnabled,
    eTag: out.ETag,
  });
}

function logGetObjectEncryption(
  context: string,
  key: string,
  r: {
    ServerSideEncryption?: string;
    SSEKMSKeyId?: string;
    BucketKeyEnabled?: boolean;
    ContentLength?: number;
    ContentType?: string;
  },
): void {
  logger.info(`[S3 GetObject] ${context}`, {
    bucket: env.AWS_BUCKET_NAME,
    key,
    serverSideEncryption: r.ServerSideEncryption ?? "(não presente na resposta)",
    sseKMSKeyId: r.SSEKMSKeyId,
    bucketKeyEnabled: r.BucketKeyEnabled,
    contentLength: r.ContentLength,
    contentType: r.ContentType,
    nota: "O corpo já vem em claro; a encriptação em repouso é tratada pelo S3 antes de enviar.",
  });
}

/** Acumula nomes de ficheiro no diretório durante o `reduce`; depois vira `string[]`. */
const FILES_KEY = "__files__";

export default class S3Repository implements IS3Repository {
    constructor(private s3: S3Client) {}

    listBuckets(): Promise<Bucket[] | undefined> {
        
        return this.s3.send(new ListBucketsCommand({})).then(response => {
            return response.Buckets ?? []
        }).catch(error => {
            throw new Error(error.message);
        });
    }

    async listBucketObjects(options: ListBucketObjectsOptions): Promise<ListBucketObjectsResult> {
        const response = await this.s3.send(
            new ListObjectsV2Command({
                Bucket: env.AWS_BUCKET_NAME,
                Prefix: options.prefix,
                ContinuationToken: options.continuationToken,
                MaxKeys: options.maxKeys,
            }),
        ).catch((error: Error) => {
            throw new Error(error.message);
        });

        const keys = (response.Contents ?? []).map((obj) => (obj.Key ?? ""));

        const rawTree = keys.reduce<PathTree>((acc, key) => {
            const path = key.split("/").filter((s) => s.length > 0);
            if (path.length === 0) return acc;

            let current: PathTree = acc;
            for (let i = 0; i < path.length; i++) {
                const segment = path[i];
                const isUltimoSegmento = i === path.length - 1;
                const isPenultimoSegmento = i === path.length - 2;

                if (isPenultimoSegmento) {
                    if (!Array.isArray(current[segment])) {
                        current[segment] = [];
                    }
                } else if (isUltimoSegmento) {
                    if (path.length === 1) {
                        if (!Array.isArray(current[FILES_KEY])) {
                            current[FILES_KEY] = [];
                        }
                        (current[FILES_KEY] as string[]).push(segment);
                    } else {
                        const dirKey = path[i - 1];
                        const files = current[dirKey];
                        if (Array.isArray(files)) {
                            files.push(segment);
                        }
                    }
                } else {
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    const next = current[segment];
                    if (Array.isArray(next)) {
                        break;
                    }
                    current = next as PathTree;
                }
            }
            return acc;
        }, {});
        const objects: BucketObjectSummary[] = (response.Contents ?? []).map((obj) => ({
            key: obj.Key ?? "",
            size: obj.Size ?? 0,
            lastModified: obj.LastModified?.toISOString(),
            etag: obj.ETag?.replaceAll('"', ""),
            storageClass: obj.StorageClass,
        }));

        logger.info("[S3 ListObjectsV2] listagem (só metadados; não indica estado de encriptação por objeto)", {
            bucket: env.AWS_BUCKET_NAME,
            prefix: options.prefix ?? "(raiz)",
            keyCount: keys.length,
            isTruncated: response.IsTruncated,
        });

        return {
            pathTree: rawTree,
            objects,
            isTruncated: response.IsTruncated ?? false,
            nextContinuationToken: response.NextContinuationToken,
            prefix: options.prefix,
        };
    }

    async upload(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput> {
        const Body = file.buffer;
        const ChecksumSHA256 = await createHash("sha256").update(Body).digest("base64");
        const Key = caminho ? `${caminho}/${file.originalname}` : file.originalname;

        const out = await this.s3.send(
            new PutObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key,
                Body,
                ContentType: file.mimetype || undefined,
                ChecksumSHA256,
            }),
        );
        logPutObjectResult("upload (sem pedir SSE explícito no código)", Key, out);
        return out;
    }

    async download(fileName: string): Promise<ProcessedDownload> {
        const response = await this.s3.send(
            new GetObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key: fileName,
            }),
        ).catch((error: Error) => {
            throw new Error(error.message);
        });

        if (!response.Body) {
            throw new Error("Objeto vazio no S3");
        }

        const buffer = await response.Body.transformToByteArray();

        logGetObjectEncryption("download", fileName, {
            ServerSideEncryption: response.ServerSideEncryption,
            SSEKMSKeyId: response.SSEKMSKeyId,
            BucketKeyEnabled: response.BucketKeyEnabled,
            ContentLength: response.ContentLength,
            ContentType: response.ContentType,
        });

        return buildProcessedDownload(fileName, response.ContentType, buffer);
    }

    async uploadEncrypted(
        file: Express.Multer.File,
        caminho: string | undefined,
    ): Promise<PutObjectCommandOutput> {
        const Body = encryptBuffer(file.buffer, env.S3_APP_ENCRYPTION_KEY);
        const Key = caminho ? `${caminho}/${file.originalname}` : file.originalname;

        const out = await this.s3.send(
            new PutObjectCommand({
                Bucket: env.AWS_BUCKET_NAME,
                Key,
                Body,
                ContentType: "application/octet-stream",
                Metadata: {
                    origmime: file.mimetype || "application/octet-stream",
                    s3appenc: "v1",
                },
                ServerSideEncryption: ServerSideEncryption.aws_kms,
                SSEKMSKeyId: env.S3_APP_ENCRYPTION_KEY,
            }),
        );
        logPutObjectResult("uploadEncrypted (SSE-KMS pedido explicitamente)", Key, out);
        return out;
    }

    async downloadEncrypted(fileName: string): Promise<ProcessedDownload> {
        const response = await this.s3
            .send(
                new GetObjectCommand({
                    Bucket: env.AWS_BUCKET_NAME,
                    Key: fileName
                }),
            )
            .catch((error: Error) => {
                throw new Error(error.message);
            });

        if (!response.Body) {
            throw new Error("Objeto vazio no S3");
        }

        logGetObjectEncryption("downloadEncrypted", fileName, {
            ServerSideEncryption: response.ServerSideEncryption,
            SSEKMSKeyId: response.SSEKMSKeyId,
            BucketKeyEnabled: response.BucketKeyEnabled,
            ContentLength: response.ContentLength,
            ContentType: response.ContentType,
        });
        const meta = response.Metadata ?? {};
        if (meta.s3appenc !== "v1") {
            throw new BadRequest(
                "O objeto não foi enviado pela rota encrypted ou não contém metadados de cifra esperados.",
            );
        }

        const raw = await response.Body.transformToByteArray();
        let plain: Buffer;
        try {
            plain = decryptBuffer(Buffer.from(raw), env.S3_APP_ENCRYPTION_KEY);
        } catch {
            throw new BadRequest("Falha ao decifrar o objeto (chave incorrompida ou ficheiro alterado).");
        }

        const contentType = meta.origmime?.trim() || "application/octet-stream";
        return buildProcessedDownload(fileName, contentType, new Uint8Array(plain));
    }
}