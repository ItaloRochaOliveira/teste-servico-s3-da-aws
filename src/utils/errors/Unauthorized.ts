import HttpCode from '../HttpsCode';
import HttpError from './HttpError';

export default class Unauthorized extends HttpError {
  constructor(
    message: string = 'Não autorizado. Token de autenticação inválido ou ausente.',
  ) {
    const statusCode = HttpCode.UNAUTHORIZED;
    super(statusCode, message);
  }
}
