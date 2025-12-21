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
   * Zvýrazní špatnou ORP červeně
   */
  highlightWrong(orpKod) {
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        layer.setStyle({
          fillColor: '#e74c3c',
          fillOpacity: 0.6,
          color: '#c0392b',
          weight: 3
        });
        layer.options.className = 'highlighted';
      }
    });
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
