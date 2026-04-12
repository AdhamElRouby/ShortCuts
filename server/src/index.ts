import express from 'express';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Load environment variables from .env file
config();

const app = express();
const PORT = 3000;

// ============= Middleware Setup =============
// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= API Routes Setup =============
app.get('/', (req, res) => {
    res.send('Welcome to the Express TypeScript Server!');
});

// ============= Error Handling Middleware =============
// Handle 404 routes not found
app.use(notFoundHandler);
// Centralized error handler for all errors
app.use(errorHandler);

// ============= Server Startup =============
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
