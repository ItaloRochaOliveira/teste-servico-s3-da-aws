import IS3Repository from "@/types/interfaces/IS3Repository";

export default class S3Repository implements IS3Repository {
    async upload(file: Express.Multer.File): Promise<void> {
        return Promise.resolve();
    }

    async download(fileName: string): Promise<void> {
        return Promise.resolve();
    }
}