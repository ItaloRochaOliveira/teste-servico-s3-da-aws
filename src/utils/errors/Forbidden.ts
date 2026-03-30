import HttpCode from '../HttpsCode';
import HttpError from './HttpError';

export default class Forbidden extends HttpError {
  constructor(message: string) {
    const statusCode = HttpCode.FORBIDDEN;
    super(statusCode, message);
  }
}
