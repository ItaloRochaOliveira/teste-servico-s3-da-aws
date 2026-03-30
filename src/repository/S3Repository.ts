import { env } from "@/env";
import IS3Repository from "@/types/interfaces/IS3Repository";
import { Bucket, GetObjectCommand, GetObjectCommandOutput, ListBucketsCommand, ListBucketsCommandOutput, PutObjectCommand, PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

export default class S3Repository implements IS3Repository {
    constructor(private s3: S3Client) {}

    listBuckets(): Promise<Bucket[] | undefined> {
        return this.s3.send(new ListBucketsCommand({})).then(response => response.Buckets ?? []).catch(error => {
            throw new Error(error.message);
        });
    }

    async upload(file: Express.Multer.File): Promise<PutObjectCommandOutput> {
        const Body = file.buffer;
        const ChecksumSHA256 = await createHash("sha256").update(Body).digest("base64");

        return await this.s3.send(new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: file.originalname,
            // Body: file.buffer,
            Body,
            ChecksumSHA256,
        }));
    }

    async download(fileName: string): Promise<GetObjectCommandOutput> {
        return await this.s3.send(new GetObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: fileName,
        }));
    }
}