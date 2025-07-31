import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Map.css';

// Fix for the default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker component with integrated label and optional color
const createCustomMarkerIcon = (label, color) => {
  // If no label and no color, use default marker
  if (!label && !color) {
    return new L.Icon.Default();
  }
  
  // Create a custom icon with HTML content for the label and optional color
  const markerStyle = color ? `filter: hue-rotate(${getHueRotation(color)}deg) saturate(${getSaturation()}) brightness(${getBrightness(color)});` : '';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div>
        <img src="${require('leaflet/dist/images/marker-icon.png')}" alt="marker" style="${markerStyle}" />
        ${label ? `<div class="custom-marker-label" style="${color ? `border-color: ${color};` : ''}">${label}</div>` : ''}
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41], // Center bottom of the marker
  });
};

// Helper functions to transform color to filter values
const getHueRotation = (color) => {
  // Convert color to hue rotation value (0-360 degrees)
  // This is a simplified approach - for named colors we use predefined values
  const namedColors = {
    'red': 1,
    'orange': 30,
    'yellow': 60,
    'green': 120,
    'cyan': 180,
    'blue': 240,
    'purple': 270,
    'magenta': 300
  };
  
  if (color && typeof color === 'string' && namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()] - 210; // Adjust for the default blue marker
  }
  
  // For hex colors, we'll use a simple approach
  if (color && typeof color === 'string' && color.startsWith('#')) {
    try {
      const r = parseInt(color.slice(1, 3) || color.slice(1, 2).repeat(2), 16);
      const g = parseInt(color.slice(3, 5) || color.slice(2, 3).repeat(2), 16);
      const b = parseInt(color.slice(5, 7) || color.slice(3, 4).repeat(2), 16);
      
      // Convert RGB to HSL and extract hue
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      
      if (max === min) {
        h = 0; // achromatic
      } else {
        const d = max - min;
        if (max === r) {
          h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
          h = (b - r) / d + 2;
        } else {
          h = (r - g) / d + 4;
        }
        h *= 60;
      }
      
      return h - 210; // Adjust for the default blue marker
    } catch (e) {
      return 0; // Default to no rotation
    }
  }
  
  return 0; // Default to no rotation
};

const getSaturation = () => {
  // For simplicity, we'll use a fixed saturation value
  return 1.5;
};

const getBrightness = (color) => {
  // For dark colors, increase brightness
  const darkColors = ['black', 'navy', 'darkblue', 'darkgreen', 'darkred', 'darkpurple', '#000', '#000000'];
  if (darkColors.includes(color.toLowerCase())) {
    return 1.5;
  }
  return 1;
};

// Map tile configurations
const mapTiles = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  opentopomap: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  'cartodb-positron': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  'cartodb-darkmatter': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  'esri-streetmap': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }
};



// Component to handle map events and update URL
function MapEventHandler({ onMapChange }) {
  const map = useMapEvents({
    moveend: () => {
      // Called when the map stops moving (including after zoom)
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapChange({ 
        center: [center.lat, center.lng], 
        zoom 
      });
    },
    zoomend: () => {
      // Called when zoom animation is completed
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapChange({ 
        center: [center.lat, center.lng], 
        zoom 
      });
    }
  });
  
  return null; // This component doesn't render anything
}

// Component to update map view when center or zoom props change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom !== undefined && zoom !== null) {
      map.setView(center, zoom);
    } else if (center) {
      map.setView(center, map.getZoom());
    } else if (zoom !== undefined && zoom !== null) {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  
  return null; // This component doesn't render anything
}

function MapComponent({ coordinates, mapType = 'openstreetmap', center, zoom, onMapChange }) {
  // Find center of the map based on coordinates or default to a position
  const getMapCenter = () => {
    if (center) {
      return center;
    }
    
    if (coordinates.length === 0) {
      return [0, 0]; // Default center if no coordinates
    }
    
    // Calculate the average of all coordinates for the center
    const sumLat = coordinates.reduce((sum, coord) => {
      // Handle both old format [lat, lng] and new format {lat, lng, label}
      const lat = Array.isArray(coord) ? coord[0] : coord.lat;
      return sum + lat;
    }, 0);
    
    const sumLng = coordinates.reduce((sum, coord) => {
      // Handle both old format [lat, lng] and new format {lat, lng, label}
      const lng = Array.isArray(coord) ? coord[1] : coord.lng;
      return sum + lng;
    }, 0);
    
    return [sumLat / coordinates.length, sumLng / coordinates.length];
  };
  
  const getZoom = () => {
    if (zoom !== null && zoom !== undefined) {
      return zoom;
    }
    return coordinates.length ? 10 : 2;
  };

  return (
    <div className="map-container">
      <MapContainer 
        center={getMapCenter()} 
        zoom={getZoom()} 
        style={{ height: "100%", width: "100%" }}
      >
        {/* Add the event handler to listen for map movements and zoom changes */}
        {onMapChange && <MapEventHandler onMapChange={onMapChange} />}
        
        {/* Add the map updater to handle center and zoom changes */}
        <MapUpdater center={center} zoom={zoom} />

        <TileLayer
          attribution={mapTiles[mapType]?.attribution || mapTiles['openstreetmap'].attribution}
          url={mapTiles[mapType]?.url || mapTiles['openstreetmap'].url}
        />
        
        {coordinates.map((coord, idx) => {
          // Handle both old format [lat, lng] and new format {lat, lng, label, color}
          const position = Array.isArray(coord) 
            ? coord 
            : [coord.lat, coord.lng];
          
          const label = Array.isArray(coord) ? null : coord.label;
          const color = Array.isArray(coord) ? null : coord.color;
          
          // Create custom icon with integrated label and optional color
          const icon = createCustomMarkerIcon(label, color);
          
          return (
            <Marker 
              key={idx} 
              position={position} 
              icon={icon}
            >
              <Popup>
                Latitude: {position[0]}<br />
                Longitude: {position[1]}
                {label && (
                  <>
                    <br />
                    Label: {label}
                  </>
                )}
                {color && (
                  <>
                    <br />
                    Color: {color}
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapComponent;