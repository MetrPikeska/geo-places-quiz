const express = require('express');
const router = express.Router();
const orpService = require('../services/orp-service');

/**
 * GET /api/orp
 * Vrátí všechny ORP jako GeoJSON FeatureCollection
 */
router.get('/', async (req, res) => {
  try {
    const geojson = await orpService.getAllORP();
    res.json(geojson);
  } catch (error) {
    console.error('Chyba při načítání ORP:', error);
    res.status(500).json({ 
      error: 'Chyba při načítání ORP',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/random
 * Vrátí náhodnou ORP pro hru
 */
router.get('/random', async (req, res) => {
  try {
    const orp = await orpService.getRandomORP();
    res.json(orp);
  } catch (error) {
    console.error('Chyba při načítání náhodné ORP:', error);
    res.status(500).json({ 
      error: 'Chyba při načítání náhodné ORP',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/stats
 * Vrátí statistiky databáze
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await orpService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Chyba při načítání statistik:', error);
    res.status(500).json({ 
      error: 'Chyba při načítání statistik',
      message: error.message 
    });
  }
});

/**
 * GET /api/orp/:kod
 * Vrátí konkrétní ORP podle kódu
 */
router.get('/:kod', async (req, res) => {
  try {
    const kod = parseInt(req.params.kod);
    
    if (isNaN(kod)) {
      return res.status(400).json({ error: 'Neplatný kód ORP' });
    }
    
    const orp = await orpService.getORPByKod(kod);
    
    if (!orp) {
      return res.status(404).json({ error: 'ORP nenalezena' });
    }
    
    res.json(orp);
  } catch (error) {
    console.error('Chyba při načítání ORP:', error);
    res.status(500).json({ 
      error: 'Chyba při načítání ORP',
      message: error.message 
    });
  }
});

module.exports = router;
