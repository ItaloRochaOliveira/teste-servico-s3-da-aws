
import logger from '@/config/winston';
import BadRequest from '@/utils/errors/BadRequest';
import NotFound from '@/utils/errors/NotFound';
import Unauthorized from '@/utils/errors/Unauthorized';
import HttpCode from '@/utils/HttpsCode';
import { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ZodError } from 'zod';

export default (
  err: Error,
  _req: Request,
  res: Response,
  /* eslint-disable @typescript-eslint/no-unused-vars */ _next: NextFunction,
) => {
  console.log('Error Middleware - Error:', err);
  console.log('Error Middleware - Type:', err.constructor.name);
  console.log('Error Middleware - Message:', err.message);

  if (err instanceof AxiosError) {
    logger.error('Axios Error', {
      status: err.status,
      message: err.message,
    });

    return res.status(err.status ? err.status : 404).json({
      status: 'Axios Error',
      error: {
        code: err.status ? err.status : 404,
        message: err.message,
      },
    });
  }

  if (err instanceof JsonWebTokenError) {
    logger.error('Json Web Token Error', {
      message: err.message,
    });

    return res.status(401).json({
      status: 'Json Web Token Error',
      error: {
        code: 401,
        message: err.message,
      },
    });
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) =>({
      message: issue.message,
      path: issue.path,
    }));

    const message: string[] = [];
    for (const key of issues) {
      message.push(' ' + key.message);
    }

    logger.error('Zod Error', {
      message: message.join(', '),
    });

    return res.status(400).json({
      status: 'Zod Error',
      error: {
        code: 400,
        message: issues.length > 1 ? 'Dados inválidos' : issues[0].message,
        details: issues.length > 1 ? issues : undefined,
      },
    });
  }

  if (err instanceof NotFound) {
    logger.error('NotFound Error', {
      message: err.message,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      status: 'NotFound Error',
      error: {
        code: err.statusCode,
        message: err.message,
      },
    });
  }

  if (err instanceof BadRequest) {
    logger.error('BadRequest Error', {
      message: err.message,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      status: 'BadRequest Error',
      error: {
        code: err.statusCode,
        message: err.message,
      },
    });
  }

  if (err instanceof Unauthorized) {
    logger.error('Unauthorized Error', {
      message: err.message,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      status: 'Unauthorized Error',
      error: {
        code: err.statusCode,
        message: err.message,
      },
    });
  }

  // Log completo para debugging
  logger.error('Internal Server Error', {
    message: err.message ? err.message : 'Erro interno do servidor. Por favor, tente novamente mais tarde.',
    stack: err.stack,
    name: err.name,
  });

  return res.status(HttpCode.INTERNAL_SERVER_ERROR).json({
    status: 'Internal Server Error',
    error: {
      code: HttpCode.INTERNAL_SERVER_ERROR,
      message: err.message
        ? err.message
        : 'Erro interno do servidor. Por favor, tente novamente mais tarde.',
    },
  });
};
