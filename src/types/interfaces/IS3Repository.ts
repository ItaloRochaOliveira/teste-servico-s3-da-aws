import type { ProcessedDownload } from "@/utils/fileDownload";
import { Bucket, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export default interface IS3Repository {
  listBuckets(): Promise<Bucket[] | undefined>;
  upload(file: Express.Multer.File, caminho: string | undefined): Promise<PutObjectCommandOutput>;
  download(fileName: string): Promise<ProcessedDownload>;
}