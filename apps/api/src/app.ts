import express from 'express';
import { authRouter } from './services/auth/index.js';
import { bookingRouter } from './services/booking/index.js';
import { listingsRouter } from './services/listings/index.js';
import { reviewsRouter } from './services/reviews/index.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { notFound } from './shared/middlewares/notFound.js';

const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/reviews', reviewsRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export { app };
