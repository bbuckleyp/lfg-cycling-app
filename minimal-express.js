const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(5002, '0.0.0.0', () => {
  console.log('Minimal Express server running on port 5002');
}).on('error', (err) => {
  console.error('Express server error:', err);
});