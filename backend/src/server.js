import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import wagersRouter from './wagers.routes.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// DEV auth shim: simulate login via header while DEV_AUTH=true
app.use((req, _res, next) => {
  if (process.env.DEV_AUTH === 'true' && req.header('X-User-Id')) {
    req.user = { id: parseInt(req.header('X-User-Id'), 10) };
  }
  next();
});

// Protect wagers route
app.use('/api/wagers', (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthenticated' });
  next();
}, wagersRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on :${port}`));
