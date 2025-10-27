import wagersRouter from './wagersRoutes.js';

// Protect wagers route
app.use('/api/wagers', (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthenticated' });
  next();
}, wagersRouter);
