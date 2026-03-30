import IS3Repository from "@/types/interfaces/IS3Repository";

export default class S3Service {
    constructor(private s3Repository: IS3Repository) {}

    async upload(file: Express.Multer.File): Promise<void> {
        return this.s3Repository.upload(file);
    }

    async download(fileName: string): Promise<void> {
        return this.s3Repository.download(fileName);
    }
}