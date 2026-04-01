import type { ListBucketObjectsResult } from "@/types/s3ListBucketObjects";
import type { ProcessedDownload } from "@/utils/fileDownload";
import { Bucket, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export type ListBucketObjectsOptions = {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
};

export default interface IS3Repository {
  listBuckets(): Promise<Bucket[] | undefined>;
  listBucketObjects(options: ListBucketObjectsOptions): Promise<ListBucketObjectsResult>;
  upload(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput>;
  download(fileName: string): Promise<ProcessedDownload>;
}