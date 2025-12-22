/**
 * Map Controller - Leaflet map management
 * Renders ORP polygons and handles interactions
 */

class MapController {
  constructor(containerId) {
    this.map = null;
    this.orpLayer = null;
    this.containerId = containerId;
    this.onORPClickCallback = null;
  }
  
  /**
   * Initialize Leaflet map
   */
  init() {
    // Create map centered on Czech Republic
    this.map = L.map(this.containerId, {
      center: [49.8, 15.5],
      zoom: 8,
      minZoom: 7,
      maxZoom: 12,
      zoomControl: true
    });
    
    // No basemap - only polygons
    
    // Add scale control
    L.control.scale({
      metric: true,
      imperial: false,
      position: 'bottomright'
    }).addTo(this.map);
    
    console.log('✅ Map initialized');
  }
  
  /**
   * Render ORP polygons on the map
   */
  renderORP(geojson) {
    // Remove previous layer
    if (this.orpLayer) {
      this.map.removeLayer(this.orpLayer);
    }
    
    // Create GeoJSON layer
    this.orpLayer = L.geoJSON(geojson, {
      style: this.getDefaultStyle(),
      onEachFeature: (feature, layer) => {
        // Click on polygon
        layer.on('click', (e) => {
          if (this.onORPClickCallback) {
            this.onORPClickCallback(feature);
          }
        });
        
        // Hover effect
        layer.on('mouseover', () => {
          layer.setStyle({
            fillOpacity: 0.5,
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
    
    // Fit map bounds to ORP layer
    this.map.fitBounds(this.orpLayer.getBounds());
    
    console.log(`✅ Rendered ${geojson.features.length} ORP`);
  }
  
  /**
   * Default polygon style
   */
  getDefaultStyle() {
    return {
      fillColor: '#d3d3d3',
      fillOpacity: 0.3,
      color: '#999999',
      weight: 1.5,
      opacity: 0.7
    };
  }
  
  /**
   * Highlight correct ORP in gold
   */
  highlightCorrect(orpKod) {
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        layer.setStyle({
          fillColor: '#FFD700',
          fillOpacity: 0.7,
          color: '#DAA520',
          weight: 3
        });
        layer.options.className = 'highlighted';
      }
    });
  }
  
  /**
   * Highlight wrong ORP based on distance from correct answer (gradient)
   * @param {number} orpKod - Code of clicked ORP
   * @param {number} correctKod - Code of correct ORP
   */
  highlightWrong(orpKod, correctKod) {
    let clickedCentroid = null;
    let correctCentroid = null;
    
    // Find centroids of both ORPs
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        clickedCentroid = this.getCentroid(layer);
      }
      if (layer.feature.properties.kod === correctKod) {
        correctCentroid = this.getCentroid(layer);
      }
    });
    
    if (!clickedCentroid || !correctCentroid) return;
    
    // Calculate distance in km
    const distance = this.calculateDistance(
      clickedCentroid.lat, clickedCentroid.lng,
      correctCentroid.lat, correctCentroid.lng
    );
    
    // Get color based on distance (0-300km scale)
    const color = this.getDistanceColor(distance);
    
    // Highlight clicked ORP with gradient color
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
   * Calculate polygon centroid
   */
  getCentroid(layer) {
    const bounds = layer.getBounds();
    return bounds.getCenter();
  }
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
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
   * Return color based on distance (gradient red -> yellow -> green)
   */
  getDistanceColor(distance) {
    // Normalize distance to 0-1 scale (0 = close = green, 1 = far = red)
    // Max distance approx 300km (across entire Czech Republic)
    const normalized = Math.min(distance / 300, 1);
    
    let r, g, b;
    
    if (normalized < 0.5) {
      // Green -> Yellow (0-150km)
      const t = normalized * 2;
      r = Math.round(46 + (255 - 46) * t);   // 46 (green) -> 255 (yellow)
      g = Math.round(204 + (255 - 204) * t); // 204 (green) -> 241 (yellow)
      b = Math.round(113 + (118 - 113) * t); // 113 (green) -> 118 (yellow)
    } else {
      // Yellow -> Red (150-300km)
      const t = (normalized - 0.5) * 2;
      r = Math.round(255);                    // 255 stays
      g = Math.round(241 + (107 - 241) * t);  // 241 (yellow) -> 107 (red)
      b = Math.round(118 + (60 - 118) * t);   // 118 (yellow) -> 60 (red)
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Darken color by percentage
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
   * Reset all polygon styles
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
   * Set callback for ORP click event
   */
  setORPClickHandler(callback) {
    this.onORPClickCallback = callback;
  }
}

export default MapController;
