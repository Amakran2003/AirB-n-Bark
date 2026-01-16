import type { Request, Response } from 'express';

export const getAll = async (_req: Request, res: Response) => {
  res.json({ message: 'Get all listings - TODO' });
};

export const getById = async (req: Request, res: Response) => {
  res.json({ message: `Get listing ${req.params.id} - TODO` });
};

export const create = async (_req: Request, res: Response) => {
  res.json({ message: 'Create listing - TODO' });
};

export const update = async (req: Request, res: Response) => {
  res.json({ message: `Update listing ${req.params.id} - TODO` });
};

export const remove = async (req: Request, res: Response) => {
  res.json({ message: `Delete listing ${req.params.id} - TODO` });
};
