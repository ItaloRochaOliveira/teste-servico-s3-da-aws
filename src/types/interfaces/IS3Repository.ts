export default interface IS3Repository {
  upload(file: Express.Multer.File): Promise<void>;
  download(fileName: string): Promise<void>;
}