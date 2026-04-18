import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabase';

/**
 * Sets `req.user` when a valid Bearer token is present; otherwise continues without auth.
 * Use for routes that behave differently for logged-in users (e.g. public profile + isSubscribed).
 */
export const optionalAuthenticateUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (!error && data.user) {
    req.user = { id: data.user.id };
  }

  next();
};
