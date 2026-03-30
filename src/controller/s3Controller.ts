import S3Repository from "@/repository/S3Repository";
import S3Service from "@/service/S3Service";
import { NextFunction, Request, Response } from "express";
import uploadSchema from "./schema.ts/uploadSchema";

export default class S3Controller {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
        const file = uploadSchema.parse(req.file);

        const s3Service = new S3Service(new S3Repository());
        await s3Service.upload(file as unknown as Express.Multer.File);

        return res.status(200).json({
        message: "File uploaded successfully",
        });
    } catch (error) {
        next(error);
    }
  }

  async download(req: Request, res: Response) {
    return res.status(200).json({
      message: "File downloaded successfully",
    });
  }
}