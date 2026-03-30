import HttpCode from '../HttpsCode';
import HttpError from './HttpError';

export default class NotFound extends HttpError {
  constructor(message: string = 'Beneficiário não encontrado') {
    const statusCode = HttpCode.NOT_FOUND;
    super(statusCode, message);
  }
}
