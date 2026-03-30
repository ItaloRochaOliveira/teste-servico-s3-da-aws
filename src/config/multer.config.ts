import BadRequest from '@/utils/errors/BadRequest';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

export class MulterConfig {
  static readonly storage = () => {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        // Define o diretório de destino para os arquivos
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        // Define o nome do arquivo
        cb(
          null,
          path.parse(file.originalname).name +
            -+Date.now() +
            path.extname(file.originalname),
        );
      },
    });
  };

  static readonly fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const fileTypes = /jpeg|jpg|png|svg|pdf|doc|docx|xls|xlsx|csv/;

    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    // const mimetype = fileTypes.test(file.mimetype);

    if (extname) {
      return cb(null, true);
    } else {
      cb(new BadRequest('Tipo inválido de arquivo.'));
    }
  };

  static readonly upload = () => {
    return multer({
      storage: this.storage(),
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // Limita o tamanho do arquivo a 5MB
      },
    });
  };
}
