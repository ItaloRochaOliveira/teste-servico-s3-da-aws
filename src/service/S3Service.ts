import IS3Repository from "@/types/interfaces/IS3Repository";
import { Bucket, GetObjectCommandOutput, ListBucketsCommandOutput, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export default class S3Service {
    constructor(private s3Repository: IS3Repository) {}

    async listBuckets(): Promise<Bucket[] | undefined> {
        return this.s3Repository.listBuckets();
    }

    async upload(file: Express.Multer.File): Promise<PutObjectCommandOutput> {
        return this.s3Repository.upload(file);
    }

    async download(fileName: string): Promise<GetObjectCommandOutput> {
        return this.s3Repository.download(fileName);
    }
}