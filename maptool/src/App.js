import React, { useState, useEffect } from 'react';
import './App.css';
import MapComponent from './Map';

// Function to encode state to URL hash
const encodeStateToHash = (state) => {
  try {
    const stateString = JSON.stringify(state);
    // Use encodeURIComponent to handle special characters before base64 encoding
    return `#${btoa(encodeURIComponent(stateString))}`;
  } catch (error) {
    console.error('Error encoding state to hash:', error);
    return '';
  }
};

// Function to decode state from URL hash
const decodeHashToState = (hash) => {
  if (!hash || hash === '#') return null;
  
  try {
    const stateString = decodeURIComponent(atob(hash.substring(1)));
    return JSON.parse(stateString);
  } catch (error) {
    console.error('Error decoding hash to state:', error);
    return null;
  }
};

function App() {
  const [inputText, setInputText] = useState('');
  const [coordinates, setCoordinates] = useState([]);
  const [mapType, setMapType] = useState('openstreetmap');
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [measureEnabled, setMeasureEnabled] = useState(false);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  
  // Separate state variables for URL updates only
  const [urlCenter, setUrlCenter] = useState(null);
  const [urlZoom, setUrlZoom] = useState(null);

  // Parse coordinates from text area
  const parseCoordinates = (text) => {
    if (!text.trim()) return [];
    
    const lines = text.split('\n');
    const parsedCoordinates = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Try to parse different formats of coordinates with optional label and color
      // Format 1: "lat, lng" or "lat,lng" with optional label in quotes and optional color
      const commaMatchWithLabelAndColor = trimmedLine.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*(?:"([^"]*)")?\s*(?:(#[0-9A-Fa-f]{3,8}|[a-zA-Z]+))?$/);
      if (commaMatchWithLabelAndColor) {
        const lat = parseFloat(commaMatchWithLabelAndColor[1]);
        const lng = parseFloat(commaMatchWithLabelAndColor[2]);
        const label = commaMatchWithLabelAndColor[3] === '' ? null : commaMatchWithLabelAndColor[3] || null;
        const color = commaMatchWithLabelAndColor[4] || null;
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedCoordinates.push({ lat, lng, label, color });
          continue;
        }
      }
      
      // Format 2: "lat lng" (space separated) with optional label in quotes and optional color
      const spaceMatchWithLabelAndColor = trimmedLine.match(/^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*(?:"([^"]*)")?\s*(?:(#[0-9A-Fa-f]{3,8}|[a-zA-Z]+))?$/);
      if (spaceMatchWithLabelAndColor) {
        const lat = parseFloat(spaceMatchWithLabelAndColor[1]);
        const lng = parseFloat(spaceMatchWithLabelAndColor[2]);
        const label = spaceMatchWithLabelAndColor[3] === '' ? null : spaceMatchWithLabelAndColor[3] || null;
        const color = spaceMatchWithLabelAndColor[4] || null;
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedCoordinates.push({ lat, lng, label, color });
          continue;
        }
      }
    }
    
    return parsedCoordinates;
  };

  // Update coordinates when input text changes
  useEffect(() => {
    const parsedCoords = parseCoordinates(inputText);
    setCoordinates(parsedCoords);
  }, [inputText]);
  
  // Handle map changes and update URL only (not map state)
  const handleMapChange = ({ center, zoom }) => {
    // Only update URL-specific state variables, not the map view state
    setUrlCenter(center);
    setUrlZoom(zoom);
  };
  
  // Handle map clicks to add new coordinates
  const handleMapClick = ({ lat, lng }) => {
    // Set loading state to true when starting to fetch place name
    setIsLoadingPlace(true);

    // Identify the closest place name using OpenStreetMap Nominatim API
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        // Extract place name from the response
        let placeName = "";

        if (data && data.address) {
          if(data.address.city) {
            placeName = data.address.city;
          } else if (data.address.county) {
            placeName = data.address.county;
          }
        }
      
        // Log the closest place name to the console
        console.log("Closest place:", placeName);

        // Format the new coordinate with 6 decimal places
        const newCoord = `${lat.toFixed(6)}, ${lng.toFixed(6)} "${placeName}" blue`;

        // Add the new coordinate to the text area
        setInputText(prevText => {
          // If there's already text, add a new line
          const updatedText = prevText.trim() ? `${prevText}\n${newCoord}` : newCoord;
          
          // Also directly update the coordinates state to ensure URL gets updated
          const newCoordinates = [...coordinates, { 
            lat: parseFloat(lat.toFixed(6)), 
            lng: parseFloat(lng.toFixed(6)), 
            label: placeName, 
            color: "blue" 
          }];
          setCoordinates(newCoordinates);
          
          return updatedText;
        });

        // Set loading state to false when place name is fetched
        setIsLoadingPlace(false);
      })
      .catch(error => {
        console.error("Error fetching place name:", error);

        // Format the new coordinate with 6 decimal places
        const newCoord = `${lat.toFixed(6)}, ${lng.toFixed(6)} "" blue`;

        // Add the new coordinate to the text area
        setInputText(prevText => {
          // If there's already text, add a new line
          const updatedText = prevText.trim() ? `${prevText}\n${newCoord}` : newCoord;
          
          // Also directly update the coordinates state to ensure URL gets updated
          const newCoordinates = [...coordinates, { 
            lat: parseFloat(lat.toFixed(6)), 
            lng: parseFloat(lng.toFixed(6)), 
            label: "", 
            color: "blue" 
          }];
          setCoordinates(newCoordinates);
          
          return updatedText;
        });

        // Set loading state to false when there's an error
        setIsLoadingPlace(false);
      });
  };
  
  // Copy current URL to clipboard
  const copyToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setCopySuccess('Copied!');
        // Reset success message after 2 seconds
        setTimeout(() => {
          setCopySuccess('');
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        setCopySuccess('Failed to copy');
      });
  };

  // Update URL when state changes
  useEffect(() => {
    // Only update URL if we have all necessary state
    if (coordinates.length > 0 || (urlCenter && urlZoom)) {
      const state = {
        coordinates,
        mapType,
        center: urlCenter || mapCenter, // Use urlCenter if available, otherwise fall back to mapCenter
        zoom: urlZoom || mapZoom, // Use urlZoom if available, otherwise fall back to mapZoom
        measureEnabled
      };
      
      const newHash = encodeStateToHash(state);
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
  }, [coordinates, mapType, urlCenter, urlZoom, mapCenter, mapZoom, measureEnabled]);
  
  // Parse URL on initial load
  useEffect(() => {
    const handleHashChange = () => {
      const state = decodeHashToState(window.location.hash);
      if (state) {
        if (state.coordinates) {
          // Convert coordinates to string for textarea
          const coordsText = state.coordinates
            .map(coord => {
              // Handle all coordinate formats: [lat, lng], {lat, lng, label}, and {lat, lng, label, color}
              if (Array.isArray(coord)) {
                return `${coord[0]}, ${coord[1]}`;
              } else {
                return `${coord.lat}, ${coord.lng}${coord.label ? ` "${coord.label}"` : ''}${coord.color ? ` ${coord.color}` : ''}`;
              }
            })
            .join('\n');
          setInputText(coordsText);
        }

        if (state.mapType) {
          setMapType(state.mapType);
        }

        if (state.center) {
          // Update both map center and URL center
          setMapCenter(state.center);
          setUrlCenter(state.center);
        } else {
          // Default to center of continental US if no center is specified
          setMapCenter([39.8283, -98.5795]);
        }

        if (state.zoom) {
          // Update both map zoom and URL zoom
          setMapZoom(state.zoom);
          setUrlZoom(state.zoom);
        } else {
          // Default to zoom level 4 for continental US view if no zoom is specified
          setMapZoom(4);
        }
        
        // Set measure tool state if specified in URL
        if (state.measureEnabled !== undefined) {
          setMeasureEnabled(state.measureEnabled);
        }
      } else {
        // No state in URL, set defaults for US
        setMapCenter([39.8283, -98.5795]);
        setMapZoom(4);
      }
    };
    
    // Parse hash on initial load
    handleHashChange();
    
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="App">
      <div className="input-container">
        <textarea
          placeholder="Enter coordinates (one pair per line, format: latitude, longitude) or paste a URL with encoded map data"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={(e) => {
            const pastedText = e.clipboardData.getData('text');
            // Check if the pasted text looks like a URL with a hash
            if (pastedText.includes('http') && pastedText.includes('#')) {
              e.preventDefault(); // Prevent default paste behavior
              
              // Extract the hash part from the URL
              const hashMatch = pastedText.match(/#[^#\s]+$/);
              if (hashMatch) {
                const hash = hashMatch[0];
                const state = decodeHashToState(hash);
                
                if (state) {
                  // Update state based on the decoded information
                  if (state.coordinates) {
                    // Convert coordinates to string for textarea
                    const coordsText = state.coordinates
                      .map(coord => {
                        // Handle all coordinate formats: [lat, lng], {lat, lng, label}, and {lat, lng, label, color}
                        if (Array.isArray(coord)) {
                          return `${coord[0]}, ${coord[1]}`;
                        } else {
                          return `${coord.lat}, ${coord.lng}${coord.label ? ` "${coord.label}"` : ''}${coord.color ? ` ${coord.color}` : ''}`;
                        }
                      })
                      .join('\n');
                    setInputText(coordsText);
                  }
                  
                  if (state.mapType) {
                    setMapType(state.mapType);
                  }
                  
                  if (state.center) {
                    setMapCenter(state.center);
                    setUrlCenter(state.center);
                  }
                  
                  if (state.zoom) {
                    setMapZoom(state.zoom);
                    setUrlZoom(state.zoom);
                  }
                  
                  // Set measure tool state if specified in URL
                  if (state.measureEnabled !== undefined) {
                    setMeasureEnabled(state.measureEnabled);
                  }
                }
              }
            }
          }}
          rows={5}
        />
        <div className="controls-container">
          <div className="coordinates-info">
            {coordinates.length > 0 ? (
              <span>{coordinates.length} coordinate{coordinates.length !== 1 ? 's' : ''}</span>
            ) : (
              <span>No coordinates found</span>
            )}
            <span className="info-icon" onClick={() => setShowFormatDialog(!showFormatDialog)}>?</span>
            {showFormatDialog && (
              <div className="format-dialog">
                <div className="format-dialog-content">
                  <h3>Coordinate Format Help</h3>
                  <p>Enter one coordinate pair per line in one of the following formats:</p>
                  <h4>Mandatory:</h4>
                  <ul>
                    <li>Latitude and longitude (decimal format)</li>
                  </ul>
                  <h4>Optional:</h4>
                  <ul>
                    <li>Label (in quotes)</li>
                    <li>Color (name or hex code)</li>
                  </ul>
                  <h4>Examples:</h4>
                  <pre>
                    40.7128, -74.0060 "New York"<br/>
                    34.0522, -118.2437 "Los Angeles"<br/>
                    41.8781, -87.6298 "Chicago" red<br/>
                    29.7604, -95.3698 "Houston" #EB33FF<br/>
                    25.7617 -80.1918 "Miami" green<br/>
                  </pre>
                  <button onClick={() => setShowFormatDialog(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
          <div className="center-controls-group">
            <div className="zoom-level-display">
              <p>Zoom Level: {urlZoom || mapZoom || 'N/A'}</p>
            </div>
            <div className="map-type-selector">
              <label htmlFor="map-type">Map Type: </label>
              <select 
                id="map-type" 
                value={mapType} 
                onChange={(e) => setMapType(e.target.value)}
              >
                <option value="openstreetmap">OpenStreetMap</option>
                <option value="openstreetmap-cycle">OpenStreetMap Cycle</option>
                <option value="opentopomap">OpenTopoMap</option>
                <option value="esri-streetmap">ESRI StreetMap</option>
                <option value="esri-satellite">ESRI Satellite</option>
                <option value="openstreetmap-hot">Humanitarian OSM</option>
                <option value="openrailwaymap">OpenRailwayMap</option>
                <option value="usgs-topo">USGS Topo</option>
                <option value="cartodb-positron">CartoDB Positron</option>
                <option value="cartodb-darkmatter">CartoDB Dark Matter</option>
              </select>
            </div>
            <div className="measure-tool-toggle">
              <label>
                <span>Measure Distances</span>
                <div className="toggle-button">
                  <input
                    type="checkbox"
                    checked={measureEnabled}
                    onChange={(e) => setMeasureEnabled(e.target.checked)}
                    disabled={coordinates.length < 2}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>
          <div className="copy-url-button">
            <button onClick={copyToClipboard}>
              🔗 {copySuccess || 'Get shareable link'}
            </button>
          </div>
        </div>
      </div>
      <div className="map-wrapper">
        {isLoadingPlace && (
          <div className="loading-indicator">
            Loading the place name...
          </div>
        )}
        <MapComponent 
          coordinates={coordinates} 
          mapType={mapType} 
          center={mapCenter}
          zoom={mapZoom}
          onMapChange={handleMapChange}
          onMapClick={handleMapClick}
          measureEnabled={measureEnabled}
        />
      </div>
    </div>
  );
}

export default App;
