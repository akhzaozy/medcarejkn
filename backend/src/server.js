import app from './app.js';

const PORT = process.env.PORT || 5174;

app.listen(PORT, () => {
  console.log(`[JKN Integrity Intelligence] Server running on port ${PORT}`);
});

