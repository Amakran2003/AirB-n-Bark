import { Router } from 'express';
import { listingsRoutes } from './routes/listings.routes.js';

export const listingsRouter = Router();
listingsRouter.use('/', listingsRoutes);
