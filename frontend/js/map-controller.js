/**
 * Map Controller - Správa Leaflet mapy
 * Vykresluje ORP polygony a zpracovává interakce
 */

class MapController {
  constructor(containerId) {
    this.map = null;
    this.orpLayer = null;
    this.containerId = containerId;
    this.onORPClickCallback = null;
  }
  
  /**
   * Inicializuje Leaflet mapu
   */
  init() {
    // Vytvoř mapu se středem na ČR
    this.map = L.map(this.containerId, {
      center: [49.8, 15.5],
      zoom: 8,
      minZoom: 7,
      maxZoom: 12,
      zoomControl: true
    });
    
    // Bez podkladové mapy - jen polygony
    
    // Přidej měřítko
    L.control.scale({
      metric: true,
      imperial: false,
      position: 'bottomright'
    }).addTo(this.map);
    
    console.log('✅ Mapa inicializována');
  }
  
  /**
   * Vykreslí ORP polygony na mapu
   */
  renderORP(geojson) {
    // Odstraň předchozí vrstvu
    if (this.orpLayer) {
      this.map.removeLayer(this.orpLayer);
    }
    
    // Vytvoř GeoJSON vrstvu
    this.orpLayer = L.geoJSON(geojson, {
      style: this.getDefaultStyle(),
      onEachFeature: (feature, layer) => {
        // Kliknutí na polygon
        layer.on('click', (e) => {
          if (this.onORPClickCallback) {
            this.onORPClickCallback(feature);
          }
        });
        
        // Hover efekt
        layer.on('mouseover', () => {
          layer.setStyle({
            fillOpacity: 0.4,
            weight: 2.5
          });
        });
        
        layer.on('mouseout', () => {
          if (!layer.options.className?.includes('highlighted')) {
            layer.setStyle(this.getDefaultStyle());
          }
        });
      }
    }).addTo(this.map);
    
    // Nastav bounds mapy podle ORP
    this.map.fitBounds(this.orpLayer.getBounds());
    
    console.log(`✅ Vykresleno ${geojson.features.length} ORP`);
  }
  
  /**
   * Výchozí styl polygonů
   */
  getDefaultStyle() {
    return {
      fillColor: '#3498db',
      fillOpacity: 0.2,
      color: '#2c3e50',
      weight: 1.5,
      opacity: 0.6
    };
  }
  
  /**
   * Zvýrazní správnou ORP zeleně
   */
  highlightCorrect(orpKod) {
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        layer.setStyle({
          fillColor: '#2ecc71',
          fillOpacity: 0.6,
          color: '#27ae60',
          weight: 3
        });
        layer.options.className = 'highlighted';
      }
    });
  }
  
  /**
   * Zvýrazní špatnou ORP podle vzdálenosti od správné (gradient)
   * @param {number} orpKod - Kód kliknuté ORP
   * @param {number} correctKod - Kód správné ORP
   */
  highlightWrong(orpKod, correctKod) {
    let clickedCentroid = null;
    let correctCentroid = null;
    
    // Najdi centroidy obou ORP
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        clickedCentroid = this.getCentroid(layer);
      }
      if (layer.feature.properties.kod === correctKod) {
        correctCentroid = this.getCentroid(layer);
      }
    });
    
    if (!clickedCentroid || !correctCentroid) return;
    
    // Vypočti vzdálenost v km
    const distance = this.calculateDistance(
      clickedCentroid.lat, clickedCentroid.lng,
      correctCentroid.lat, correctCentroid.lng
    );
    
    // Získej barvu podle vzdálenosti (0-300km škála)
    const color = this.getDistanceColor(distance);
    
    // Zvýrazni kliknutou ORP gradientovou barvou
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        layer.setStyle({
          fillColor: color,
          fillOpacity: 0.7,
          color: this.darkenColor(color, 20),
          weight: 3
        });
        layer.options.className = 'highlighted';
      }
    });
  }
  
  /**
   * Vypočítá centroid polygonu
   */
  getCentroid(layer) {
    const bounds = layer.getBounds();
    return bounds.getCenter();
  }
  
  /**
   * Vypočítá vzdálenost mezi dvěma body (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Poloměr Země v km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  toRad(deg) {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Vrátí barvu podle vzdálenosti (gradient červená -> žlutá -> zelená)
   */
  getDistanceColor(distance) {
    // Normalizuj vzdálenost na škálu 0-1 (0 = blízko = zelená, 1 = daleko = červená)
    // Max vzdálenost cca 300km (přes celou ČR)
    const normalized = Math.min(distance / 300, 1);
    
    let r, g, b;
    
    if (normalized < 0.5) {
      // Zelená -> Žlutá (0-150km)
      const t = normalized * 2;
      r = Math.round(46 + (255 - 46) * t);   // 46 (zelená) -> 255 (žlutá)
      g = Math.round(204 + (241 - 204) * t); // 204 (zelená) -> 241 (žlutá)
      b = Math.round(113 + (118 - 113) * t); // 113 (zelená) -> 118 (žlutá)
    } else {
      // Žlutá -> Červená (150-300km)
      const t = (normalized - 0.5) * 2;
      r = Math.round(255);                    // 255 zůstává
      g = Math.round(241 + (107 - 241) * t);  // 241 (žlutá) -> 107 (červená)
      b = Math.round(118 + (60 - 118) * t);   // 118 (žlutá) -> 60 (červená)
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Ztmaví barvu o procento
   */
  darkenColor(rgb, percent) {
    const match = rgb.match(/\d+/g);
    if (!match) return rgb;
    
    const r = Math.max(0, parseInt(match[0]) - percent);
    const g = Math.max(0, parseInt(match[1]) - percent);
    const b = Math.max(0, parseInt(match[2]) - percent);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Resetuj všechny styly
   */
  resetStyles() {
    if (this.orpLayer) {
      this.orpLayer.eachLayer((layer) => {
        layer.setStyle(this.getDefaultStyle());
        layer.options.className = '';
      });
    }
  }
  
  /**
   * Nastav callback pro kliknutí na ORP
   */
  setORPClickHandler(callback) {
    this.onORPClickCallback = callback;
  }
}

export default MapController;
