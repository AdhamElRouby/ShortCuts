/**
 * 404 Not Found Handler Middleware
 * Catches requests to routes that don't exist
 * Returns 404 error with appropriate message
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Handle Route Not Found
 * Called when no route matches the request path
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({ msg: 'Route does not exist' });
};
