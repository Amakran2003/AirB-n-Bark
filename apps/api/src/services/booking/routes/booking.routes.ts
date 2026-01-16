import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';

export const bookingRoutes = Router();

bookingRoutes.get('/', bookingController.getAll);
bookingRoutes.get('/:id', bookingController.getById);
bookingRoutes.post('/', bookingController.create);
bookingRoutes.put('/:id', bookingController.update);
bookingRoutes.delete('/:id', bookingController.remove);
