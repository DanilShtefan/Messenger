import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError.js';
import type { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if ('issues' in err) {
    const zodErr = err as ZodError;
    res.status(400).json({
      statusCode: 400,
      message: 'Validation error',
      errors: zodErr.flatten().fieldErrors,
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
  });
}
