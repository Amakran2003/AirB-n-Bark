import { Router } from 'express';
import { reviewsRoutes } from './routes/reviews.routes.js';

export const reviewsRouter = Router();
reviewsRouter.use('/', reviewsRoutes);
