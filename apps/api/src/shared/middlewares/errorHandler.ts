import type { Request, Response, NextFunction } from 'express';

export interface HttpError extends Error {
  status?: number;
}

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[Error] ${status}: ${message}`);
  
  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};
