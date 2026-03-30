import HttpCode from '../HttpsCode';
import HttpError from './HttpError';

export default class BadRequest extends HttpError {
  constructor(
    message: string = 'Requisição inválida. Verifique os parâmetros e tente novamente.',
  ) {
    const statusCode = HttpCode.BAD_REQUEST;
    super(statusCode, message);
  }
}
