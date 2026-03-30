import { Bucket, GetObjectCommandOutput, ListBucketsCommandOutput, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export default interface IS3Repository {
  listBuckets(): Promise<Bucket[] | undefined>;
  upload(file: Express.Multer.File): Promise<PutObjectCommandOutput>;
  download(fileName: string): Promise<GetObjectCommandOutput>;
}