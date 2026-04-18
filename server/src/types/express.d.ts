/**
 * Extends Express's open `Express.Request` interface (see express-serve-static-core).
 * `import { Request } from 'express'` uses `Request` which extends `Express.Request`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export {};
