import { env } from "@/env";
import type { BucketObjectSummary, ListBucketObjectsResult } from "@/types/s3ListBucketObjects";
import { buildPathTreeFromKeys } from "@/utils/pathTreeFromKeys";
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
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

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

        const objects: BucketObjectSummary[] = (response.Contents ?? []).map((obj) => ({
            key: obj.Key ?? "",
            size: obj.Size ?? 0,
            lastModified: obj.LastModified?.toISOString(),
            etag: obj.ETag?.replaceAll('"', ""),
            storageClass: obj.StorageClass,
        }));

        const keys = objects.map((o) => o.key).filter((k) => k.length > 0);
        const pathTree = buildPathTreeFromKeys(keys);

        return {
            pathTree,
            objects,
            isTruncated: response.IsTruncated ?? false,
            nextContinuationToken: response.NextContinuationToken,
            prefix: options.prefix,
        };
    }

    async upload(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput> {

        // const client = new S3();
        // const filePath = "/path/to/file";
        // const Body = createReadStream(filePath);

        // const upload = new Upload({
        // client,
        // params: {
        //     Bucket: "my-bucket",
        //     Key: "my-key",
        //     Body,
        //     ChecksumAlgorithm: ChecksumAlgorithm.CRC32,
        // },
        // });
        // await upload.done();
        const Body = file.buffer;
        const ChecksumSHA256 = await createHash("sha256").update(Body).digest("base64");

        return await this.s3.send(new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: caminho ? caminho + "/" + file.originalname : file.originalname,
            Body,
            ContentType: file.mimetype || undefined,
            ChecksumSHA256,
        }));
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

        return buildProcessedDownload(fileName, response.ContentType, buffer);
    }
}