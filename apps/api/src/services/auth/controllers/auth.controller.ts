import type { Request, Response } from 'express';

export const register = async (_req: Request, res: Response) => {
  res.json({ message: 'Register endpoint - TODO' });
};

export const login = async (_req: Request, res: Response) => {
  res.json({ message: 'Login endpoint - TODO' });
};
