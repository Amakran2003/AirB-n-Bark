import { Router } from 'express';
import { authRoutes } from './routes/auth.routes.js';

export const authRouter = Router();
authRouter.use('/', authRoutes);
