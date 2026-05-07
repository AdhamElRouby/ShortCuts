// Must run before any module that reads process.env (e.g. db/supabase).
import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import cors from 'cors';
import corsOptions from './config/corsOptions';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRouter from './routes/authRoutes';
import userRouter from './routes/userRoutes';
import videoRouter from './routes/videoRoutes';
import searchRouter from './routes/searchRoutes';
import analyticsRouter from './routes/analyticsRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// ============= Middleware Setup =============
// Enable CORS with custom options
app.use(cors(corsOptions));
// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= API Routes Setup =============
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/videos', videoRouter);
app.use('/api/search', searchRouter);
app.use('/api/analytics', analyticsRouter);

// ============= Error Handling Middleware =============
// Handle 404 routes not found
app.use(notFoundHandler);
// Centralized error handler for all errors
app.use(errorHandler);

// ============= Server Startup =============
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
