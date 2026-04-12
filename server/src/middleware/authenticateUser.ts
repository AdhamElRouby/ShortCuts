import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabase';
import CustomAPIError from '../errors/CustomAPIError';

export const authenticateUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new CustomAPIError('Authentication invalid', 401);
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new CustomAPIError('Authentication invalid', 401);
  }

  (req as any).user = { id: data.user.id };
  next();
};
