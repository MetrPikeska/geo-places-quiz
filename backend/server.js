require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const orpRoutes = require('./routes/orp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Komprese odpovědí (GZIP)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Kompresní úroveň (0-9)
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/orp', orpRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend běží',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Chyba:', err);
  res.status(500).json({ 
    error: 'Interní chyba serveru',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nenalezen' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server běží na http://localhost:${PORT}`);
  console.log(`📊 Databáze: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`🗺️  API endpoint: http://localhost:${PORT}/api/orp`);
});
