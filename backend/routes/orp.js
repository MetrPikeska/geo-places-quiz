const express = require('express');
const router = express.Router();
const orpService = require('../services/orp-service');

/**
 * GET /api/orp
 * Returns all ORP as GeoJSON FeatureCollection
 */
router.get('/', async (req, res) => {
  try {
    const geojson = await orpService.getAllORP();
    res.json(geojson);
  } catch (error) {
    console.error('Error loading ORP:', error);
    res.status(500).json({ 
      error: 'Error loading ORP',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/random
 * Returns random ORP for game
 */
router.get('/random', async (req, res) => {
  try {
    const orp = await orpService.getRandomORP();
    res.json(orp);
  } catch (error) {
    console.error('Error loading random ORP:', error);
    res.status(500).json({ 
      error: 'Error loading random ORP',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/stats
 * Returns database statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await orpService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error loading statistics:', error);
    res.status(500).json({ 
      error: 'Error loading statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/:kod
 * Returns specific ORP by code
 */
router.get('/:kod', async (req, res) => {
  try {
    const kod = parseInt(req.params.kod);
    
    if (isNaN(kod)) {
      return res.status(400).json({ error: 'Invalid ORP code' });
    }
    
    const orp = await orpService.getORPByKod(kod);
    
    if (!orp) {
      return res.status(404).json({ error: 'ORP not found' });
    }
    
    res.json(orp);
  } catch (error) {
    console.error('Error loading ORP:', error);
    res.status(500).json({ 
      error: 'Error loading ORP',
      message: error.message 
    });
  }
});

module.exports = router;
