import type { ListBucketObjectsOptions } from "@/types/interfaces/IS3Repository";
import IS3Repository from "@/types/interfaces/IS3Repository";
import type { ListBucketObjectsResult } from "@/types/s3ListBucketObjects";
import type { ProcessedDownload } from "@/utils/fileDownload";
import { Bucket, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export default class S3Service {
    constructor(private s3Repository: IS3Repository) {}

    async listBuckets(): Promise<Bucket[] | undefined> {
        return this.s3Repository.listBuckets();
    }

    async listBucketObjects(options: ListBucketObjectsOptions): Promise<ListBucketObjectsResult> {
        return this.s3Repository.listBucketObjects(options);
    }

    async upload(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput> {
        return this.s3Repository.upload(file, caminho);
    }

    async download(fileName: string): Promise<ProcessedDownload> {
        return this.s3Repository.download(fileName);
    }

    async uploadEncrypted(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput> {
        return this.s3Repository.uploadEncrypted(file, caminho);
    }

    async downloadEncrypted(fileName: string): Promise<ProcessedDownload> {
        return this.s3Repository.downloadEncrypted(fileName);
    }
}