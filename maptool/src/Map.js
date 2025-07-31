import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Tooltip } from 'react-leaflet';
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
const createCustomMarkerIcon = (label, color, index = 0) => {
  // Convert color to hex format if it's a named color, or use default blue if no color specified
  const hexColor = color ? getColorHex(color) : '#0078FF'; // Default blue color
  
  // Create a unique gradient ID using the index to avoid conflicts
  const gradientId = `markerGradient_${index}`;
  
  // Create a custom icon with HTML content for the label and color
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 404 532" width="21" height="30" style="position: absolute; top: 0; left: 0; filter: drop-shadow(2px 3px 2px rgba(0,0,0,0.2));">
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${hexColor}; stop-opacity:1" />
              <stop offset="100%" style="stop-color:white; stop-opacity:1" />
            </linearGradient>
          </defs>
          <path fill="url(#${gradientId})" stroke="black" stroke-width="20" d="M192 0C85.961 0 0 85.961 0 192c0 77.413 26.97 99.031 172.268 309.67 4.767 6.887 12.47 10.77 19.732 10.77 7.262 0 14.965-3.883 19.732-10.77C357.03 291.031 384 269.413 384 192 384 85.961 298.039 0 192 0zm0 272c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z"/>
        </svg>
        ${label ? `<div class="custom-marker-label" style="border-color: ${hexColor};">${label}</div>` : ''}
      </div>
    `,
    iconSize: [21, 30],
    iconAnchor: [10.5, 30], // Exact tip of the marker
  });
};

// Helper function to convert named colors to hex
const getColorHex = (color) => {
  // If it's already a hex color, return it
  if (color && typeof color === 'string' && color.startsWith('#')) {
    return color;
  }
  
  // Named colors and their hex equivalents (less pastel versions)
  const namedColors = {
    'red': '#FF8080',
    'orange': '#FFC080',
    'yellow': '#FFFF80',
    'green': '#80FF80',
    'cyan': '#80FFFF',
    'blue': '#0078FF',
    'purple': '#C080FF',
    'magenta': '#FF80FF',
    'black': '#606060',
    'navy': '#8080B3',
    'darkblue': '#6666B3',
    'darkgreen': '#66B366',
    'darkred': '#B36666',
    'darkpurple': '#B380B3'
  };
  
  // Return the hex equivalent of the named color, or the original color if not found
  return (color && typeof color === 'string' && namedColors[color.toLowerCase()]) 
    ? namedColors[color.toLowerCase()] 
    : color;
};

// Calculate distance between two points using Haversine formula (for Earth distances)
const calculateDistance = (point1, point2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  // Extract coordinates
  const lat1 = Array.isArray(point1) ? point1[0] : point1.lat;
  const lng1 = Array.isArray(point1) ? point1[1] : point1.lng;
  const lat2 = Array.isArray(point2) ? point2[0] : point2.lat;
  const lng2 = Array.isArray(point2) ? point2[1] : point2.lng;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  // Calculate distance in miles (1 km = 0.621371 miles)
  const distanceMiles = distanceKm * 0.621371;
  
  // Return distances in km and miles, rounded to 1 decimal place
  return {
    km: Math.round(distanceKm * 10) / 10,
    miles: Math.round(distanceMiles * 10) / 10
  };
};

// Component to render measurement lines and distance labels
const MeasurementLines = ({ coordinates }) => {
  if (!coordinates || coordinates.length < 2) return null;
  
  // Create all possible pairs of points
  const lines = [];
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      const point1 = coordinates[i];
      const point2 = coordinates[j];
      
      // Extract positions
      const pos1 = Array.isArray(point1) ? point1 : [point1.lat, point1.lng];
      const pos2 = Array.isArray(point2) ? point2 : [point2.lat, point2.lng];
      
      // Calculate distance in both km and miles
      const distance = calculateDistance(point1, point2);
      
      // Calculate midpoint for the label
      const midpoint = [
        (pos1[0] + pos2[0]) / 2,
        (pos1[1] + pos2[1]) / 2
      ];
      
      lines.push({
        positions: [pos1, pos2],
        distance,
        midpoint
      });
    }
  }
  
  return (
    <>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          <Polyline 
            positions={line.positions} 
            color="#3388ff" 
            weight={2} 
            opacity={0.7} 
            dashArray="5,5"
          >
            <Tooltip permanent direction="center" className="distance-label">
              {line.distance.miles} miles ({line.distance.km} km)
            </Tooltip>
          </Polyline>
        </React.Fragment>
      ))}
    </>
  );
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
  },
  'esri-satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  'openstreetmap-cycle': {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  'openstreetmap-hot': {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
  },
  'openrailwaymap': {
    url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  'usgs-topo': {
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
  }
};



// Component to handle map events and update URL
function MapEventHandler({ onMapChange, onMapClick }) {
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
    },
    click: (e) => {
      // Called when the map is clicked
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
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

// Fullscreen button component
const FullscreenButton = ({ isFullscreen, onClick }) => {
  return (
    <div 
      className={`fullscreen-button ${isFullscreen ? 'exit' : 'enter'}`}
      onClick={onClick}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? (
        // Exit fullscreen icon (X shape)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
        </svg>
      ) : (
        // Enter fullscreen icon (arrows pointing outward)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
        </svg>
      )}
    </div>
  );
};

function MapComponent({ coordinates, mapType = 'openstreetmap', center, zoom, onMapChange, onMapClick, measureEnabled = false }) {
  // State for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Add escape key handler to exit fullscreen mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen]);
  
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
    <div className={`map-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <MapContainer 
        center={getMapCenter()} 
        zoom={getZoom()} 
        style={{ height: "100%", width: "100%" }}
      >
        {/* Add the event handler to listen for map movements, zoom changes, and clicks */}
        {(onMapChange || onMapClick) && <MapEventHandler onMapChange={onMapChange} onMapClick={onMapClick} />}
        
        {/* Add the map updater to handle center and zoom changes */}
        <MapUpdater center={center} zoom={zoom} />

        <TileLayer
          attribution={mapTiles[mapType]?.attribution || mapTiles['openstreetmap'].attribution}
          url={mapTiles[mapType]?.url || mapTiles['openstreetmap'].url}
        />
        
        {/* Render measurement lines when enabled */}
        {measureEnabled && coordinates.length >= 2 && (
          <MeasurementLines coordinates={coordinates} />
        )}
        
        {coordinates.map((coord, idx) => {
          // Handle both old format [lat, lng] and new format {lat, lng, label, color}
          const position = Array.isArray(coord) 
            ? coord 
            : [coord.lat, coord.lng];
          
          const label = Array.isArray(coord) ? null : coord.label;
          const color = Array.isArray(coord) ? null : coord.color;
          
          // Create custom icon with integrated label and optional color
          // Pass the index to ensure each marker has a unique gradient ID
          const icon = createCustomMarkerIcon(label, color, idx);
          
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
      
      {/* Add fullscreen button */}
      <FullscreenButton 
        isFullscreen={isFullscreen} 
        onClick={toggleFullscreen} 
      />
    </div>
  );
}

export default MapComponent;