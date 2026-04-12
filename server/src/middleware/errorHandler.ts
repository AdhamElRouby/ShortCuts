/**
 * Global Error Handler Middleware
 * Catches all errors thrown in route handlers and middleware
 * Returns appropriate HTTP status codes and error messages
 * Must be the last middleware in the Express app
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import CustomAPIError from '../errors/CustomAPIError';

/**
 * Handle Errors
 * If error is CustomAPIError, uses its status code
 * Otherwise returns 500 Internal Server Error
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }
  console.error(err);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: 'Something went wrong, please try again' });
};
