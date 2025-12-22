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
    this.lastClickLatLng = null;
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
          // Store click position for precision calculation
          this.storeClickPosition(e.latlng);
          
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
   * Highlight correct ORP with green gradient based on click precision
   * @param {number} orpKod - Code of correct ORP
   * @param {number} distance - Distance from click to centroid in km (optional)
   */
  highlightCorrect(orpKod, distance = null) {
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        let fillColor, borderColor;
        
        if (distance !== null) {
          // Green gradient based on precision (0-50km scale)
          // Close = dark green, far = light green
          const greenColor = this.getPrecisionGreenColor(distance);
          fillColor = greenColor;
          borderColor = this.darkenColor(greenColor, 30);
        } else {
          // Default gold color (for showing correct answer without click)
          fillColor = '#FFD700';
          borderColor = '#DAA520';
        }
        
        layer.setStyle({
          fillColor: fillColor,
          fillOpacity: 0.7,
          color: borderColor,
          weight: 3
        });
        layer.options.className = 'highlighted';
      }
    });
  }
  
  /**
   * Get green color based on click precision
   * @param {number} distance - Distance in km (0-50km scale)
   * @returns {string} RGB color string
   */
  getPrecisionGreenColor(distance) {
    // Normalize distance to 0-1 (0 = very close = dark green, 1 = far = light green)
    // Max distance 50km for precision evaluation
    const normalized = Math.min(distance / 50, 1);
    
    // Dark green (#1a5f1a) to light green (#90ee90)
    const r = Math.round(26 + (144 - 26) * normalized);   // 26 -> 144
    const g = Math.round(95 + (238 - 95) * normalized);   // 95 -> 238
    const b = Math.round(26 + (144 - 26) * normalized);   // 26 -> 144
    
    return `rgb(${r}, ${g}, ${b})`;
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
   * Calculate precision score based on where user clicked within the correct ORP
   * @param {number} orpKod - Code of the ORP that was clicked
   * @returns {Object} { distance: km from centroid, coefficient: score multiplier 0.5-1.0 }
   */
  calculatePrecisionScore(orpKod) {
    let clickedLayer = null;
    let clickPosition = null;
    
    // Find the clicked layer and last click position
    this.orpLayer.eachLayer((layer) => {
      if (layer.feature.properties.kod === orpKod) {
        clickedLayer = layer;
      }
    });
    
    if (!clickedLayer || !this.lastClickLatLng) {
      return { distance: 0, coefficient: 1.0 };
    }
    
    // Get centroid of the ORP
    const centroid = this.getCentroid(clickedLayer);
    
    // Calculate distance from click to centroid
    const distance = this.calculateDistance(
      this.lastClickLatLng.lat,
      this.lastClickLatLng.lng,
      centroid.lat,
      centroid.lng
    );
    
    // Calculate coefficient (1.0 for perfect center, 0.5 for 50km+ away)
    // Linear scale: 0km = 1.0, 50km = 0.5
    const coefficient = Math.max(0.5, 1.0 - (distance / 50) * 0.5);
    
    return { distance, coefficient };
  }
  
  /**
   * Store last click position for precision calculation
   */
  storeClickPosition(latlng) {
    this.lastClickLatLng = latlng;
  }
  
  /**
   * Set callback for ORP click event
   */
  setORPClickHandler(callback) {
    this.onORPClickCallback = callback;
  }
}

export default MapController;
