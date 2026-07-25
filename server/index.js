import 'dotenv/config';
import express from 'express';
import app from '../api/index.js';

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: process.cwd() });
  });
}

app.listen(PORT, () => {
  console.log(`LeadDesk API server running on port ${PORT}`);
});
