import express from 'express';
import { apiRouter } from '../src/server/routes.ts';

const app = express();
app.use(express.json());

// Mount the standalone API router
app.use('/api', apiRouter);

// Export as default handler for Vercel serverless functions
export default app;
