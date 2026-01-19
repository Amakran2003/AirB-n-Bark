import { Router } from 'express';
import { bookingRoutes } from './routes/booking.routes.js';

export const bookingRouter = Router();
bookingRouter.use('/', bookingRoutes);
