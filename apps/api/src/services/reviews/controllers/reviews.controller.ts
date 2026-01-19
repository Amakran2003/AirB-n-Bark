import type { Request, Response } from 'express';

export const getAll = async (_req: Request, res: Response) => {
  res.json({ message: 'Get all reviews - TODO' });
};

export const getById = async (req: Request, res: Response) => {
  res.json({ message: `Get review ${req.params.id} - TODO` });
};

export const create = async (_req: Request, res: Response) => {
  res.json({ message: 'Create review - TODO' });
};

export const update = async (req: Request, res: Response) => {
  res.json({ message: `Update review ${req.params.id} - TODO` });
};

export const remove = async (req: Request, res: Response) => {
  res.json({ message: `Delete review ${req.params.id} - TODO` });
};
