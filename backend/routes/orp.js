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
 * Query params: ?okres=name or ?kraj=name to filter by region
 */
router.get('/random', async (req, res) => {
  try {
    const okres = req.query.okres || null;
    const kraj = req.query.kraj || null;
    
    const orp = (okres || kraj)
      ? await orpService.getRandomORPFromRegion(okres, kraj)
      : await orpService.getRandomORP();
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

/**
 * GET /api/orp/regions/list
 * Returns list of all unique regions (okresy)
 */
router.get('/regions/list', async (req, res) => {
  try {
    const regions = await orpService.getRegions();
    res.json({ regions });
  } catch (error) {
    console.error('Error loading regions:', error);
    res.status(500).json({ 
      error: 'Error loading regions',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/kraje/list
 * Returns list of all unique kraje (regions)
 */
router.get('/kraje/list', async (req, res) => {
  try {
    const kraje = await orpService.getKraje();
    res.json({ kraje });
  } catch (error) {
    console.error('Error loading kraje:', error);
    res.status(500).json({ 
      error: 'Error loading kraje',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/region/:okres
 * Returns ORP filtered by region
 */
router.get('/region/:okres', async (req, res) => {
  try {
    const okres = decodeURIComponent(req.params.okres);
    const geojson = await orpService.getORPByRegion(okres);
    res.json(geojson);
  } catch (error) {
    console.error('Error loading ORP by region:', error);
    res.status(500).json({ 
      error: 'Error loading ORP by region',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/kraj/:kraj
 * Returns ORP filtered by kraj
 */
router.get('/kraj/:kraj', async (req, res) => {
  try {
    const kraj = decodeURIComponent(req.params.kraj);
    const geojson = await orpService.getORPByKraj(kraj);
    res.json(geojson);
  } catch (error) {
    console.error('Error loading ORP by kraj:', error);
    res.status(500).json({ 
      error: 'Error loading ORP by kraj',
      message: error.message 
    });
  }
});

module.exports = router;
