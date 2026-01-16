import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller.js';

export const reviewsRoutes = Router();

reviewsRoutes.get('/', reviewsController.getAll);
reviewsRoutes.get('/:id', reviewsController.getById);
reviewsRoutes.post('/', reviewsController.create);
reviewsRoutes.put('/:id', reviewsController.update);
reviewsRoutes.delete('/:id', reviewsController.remove);
