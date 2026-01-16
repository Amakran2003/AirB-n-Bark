import { Router } from 'express';
import * as listingsController from '../controllers/listings.controller.js';

export const listingsRoutes = Router();

listingsRoutes.get('/', listingsController.getAll);
listingsRoutes.get('/:id', listingsController.getById);
listingsRoutes.post('/', listingsController.create);
listingsRoutes.put('/:id', listingsController.update);
listingsRoutes.delete('/:id', listingsController.remove);
