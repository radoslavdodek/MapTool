import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import MapComponent from './Map';

// Custom hook for responsive design
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            // Set window width/height to state
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowSize;
}

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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLatLngOrder, setIsLatLngOrder] = useState(true); // true = lat,lng, false = lng,lat

    // Get window size for responsive design
    const windowSize = useWindowSize();

    // Separate state variables for URL updates only
    const [urlCenter, setUrlCenter] = useState(null);
    const [urlZoom, setUrlZoom] = useState(null);

    // Ref to track current coordinate order for URL decoding
    const isLatLngOrderRef = useRef(isLatLngOrder);

    // Helper function to format coordinates to text according to coordinate order setting
    const formatCoordinatesToText = useCallback((coords, coordinateOrder) => {
        return coords
            .map(coord => {
                // Handle all coordinate formats: [lat, lng], {lat, lng, label}, and {lat, lng, label, color}
                if (Array.isArray(coord)) {
                    // For array format, apply coordinate order
                    const first = coordinateOrder ? coord[0] : coord[1];
                    const second = coordinateOrder ? coord[1] : coord[0];
                    return `${first}, ${second}`;
                } else {
                    // For object format, apply coordinate order
                    const first = coordinateOrder ? coord.lat : coord.lng;
                    const second = coordinateOrder ? coord.lng : coord.lat;
                    return `${first}, ${second}${coord.label ? ` "${coord.label}"` : ''}${coord.color ? ` ${coord.color}` : ''}`;
                }
            })
            .join('\n');
    }, []);

    // Parse coordinates from text area
    const parseCoordinates = useCallback((text, coordinateOrder) => {
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
                const first = parseFloat(commaMatchWithLabelAndColor[1]);
                const second = parseFloat(commaMatchWithLabelAndColor[2]);
                const label = commaMatchWithLabelAndColor[3] === '' ? null : commaMatchWithLabelAndColor[3] || null;
                const color = commaMatchWithLabelAndColor[4] || null;

                if (!isNaN(first) && !isNaN(second)) {
                    // Apply coordinate order: if lat-lng order, first=lat, second=lng; if lng-lat order, first=lng, second=lat
                    const lat = coordinateOrder ? first : second;
                    const lng = coordinateOrder ? second : first;
                    parsedCoordinates.push({lat, lng, label, color});
                    continue;
                }
            }

            // Format 2: "lat lng" (space separated) with optional label in quotes and optional color
            const spaceMatchWithLabelAndColor = trimmedLine.match(/^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*(?:"([^"]*)")?\s*(?:(#[0-9A-Fa-f]{3,8}|[a-zA-Z]+))?$/);
            if (spaceMatchWithLabelAndColor) {
                const first = parseFloat(spaceMatchWithLabelAndColor[1]);
                const second = parseFloat(spaceMatchWithLabelAndColor[2]);
                const label = spaceMatchWithLabelAndColor[3] === '' ? null : spaceMatchWithLabelAndColor[3] || null;
                const color = spaceMatchWithLabelAndColor[4] || null;

                if (!isNaN(first) && !isNaN(second)) {
                    // Apply coordinate order: if lat-lng order, first=lat, second=lng; if lng-lat order, first=lng, second=lat
                    const lat = coordinateOrder ? first : second;
                    const lng = coordinateOrder ? second : first;
                    parsedCoordinates.push({lat, lng, label, color});
                    continue;
                }
            }
        }

        return parsedCoordinates;
    }, []);

    // Handler to zoom and center the map to fit all points
    const handleZoomToFit = useCallback(() => {
        if (!coordinates.length) return;

        // Calculate bounds
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        coordinates.forEach(coord => {
            const lat = Array.isArray(coord) ? coord[0] : coord.lat;
            const lng = Array.isArray(coord) ? coord[1] : coord.lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        });

        // Add padding (in degrees) to bounds
        const latPadding = (maxLat - minLat) * 0.2 || 0.01; // 5% or minimum 0.01
        const lngPadding = (maxLng - minLng) * 0.2 || 0.01;

        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;
        
        // Center is the midpoint
        const center = [
            (minLat + maxLat) / 2,
            (minLng + maxLng) / 2
        ];

        // Calculate bounds for fit
        const bounds = [
            [minLat, minLng],
            [maxLat, maxLng]
        ];

        // Get map size in pixels (approximate, fallback to 800x600)
        const mapWidth = window.innerWidth > 0 ? window.innerWidth : 800;
        const mapHeight = window.innerHeight > 0 ? window.innerHeight : 600;

        // Helper to project lat/lng to mercator Y
        function latRad(lat) {
            const sin = Math.sin((lat * Math.PI) / 180);
            return Math.log((1 + sin) / (1 - sin)) / 2;
        }

        // Calculate zoom to fit bounds (Leaflet-like)
        function getBoundsZoom(bounds, mapDim, minZoom = 1, maxZoom = 18) {
            const WORLD_DIM = {height: 256, width: 256};
            const ZOOM_MAX = maxZoom;

            function latLngToPoint(lat, lng, zoom) {
                const scale = 256 * Math.pow(2, zoom);
                return {
                    x: (lng + 180) / 360 * scale,
                    y: (1 - latRad(lat) / Math.PI) / 2 * scale
                };
            }

            const ne = {lat: bounds[1][0], lng: bounds[1][1]};
            const sw = {lat: bounds[0][0], lng: bounds[0][1]};

            let zoom = ZOOM_MAX;
            for (; zoom >= minZoom; zoom--) {
                const nePoint = latLngToPoint(ne.lat, ne.lng, zoom);
                const swPoint = latLngToPoint(sw.lat, sw.lng, zoom);

                const width = Math.abs(nePoint.x - swPoint.x);
                const height = Math.abs(nePoint.y - swPoint.y);

                if (width <= mapDim.width && height <= mapDim.height) {
                    break;
                }
            }
            return zoom;
        }

        let zoom;
        if (minLat === maxLat && minLng === maxLng) {
            zoom = 16;
        } else {
            zoom = getBoundsZoom(bounds, {width: mapWidth, height: mapHeight}, 1, 18);
        }

        setMapCenter(center);
        setMapZoom(zoom);
        setUrlCenter(center);
        setUrlZoom(zoom);
    }, [coordinates]);

    // Update coordinates when input text changes
    useEffect(() => {
        const parsedCoords = parseCoordinates(inputText, isLatLngOrder);
        setCoordinates(parsedCoords);
    }, [inputText, isLatLngOrder, parseCoordinates]);

    // Update ref when coordinate order changes
    useEffect(() => {
        isLatLngOrderRef.current = isLatLngOrder;
    }, [isLatLngOrder]);

    // Handle map changes and update URL only (not map state)
    const handleMapChange = ({center, zoom}) => {
        // Only update URL-specific state variables, not the map view state
        setUrlCenter(center);
        setUrlZoom(zoom);
    };

    // Handle fullscreen state changes
    const handleFullscreenChange = (fullscreenState) => {
        setIsFullscreen(fullscreenState);
    };

    // Handle map clicks to add new coordinates
    const handleMapClick = ({lat, lng}) => {
        // Set loading state to true when starting to fetch place name
        setIsLoadingPlace(true);

        // Identify the closest place name using OpenStreetMap Nominatim API
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                // Extract place name from the response
                let placeName = "";

                if (data && data.address) {
                    if (data.address.city) {
                        placeName = data.address.city;
                    } else if (data.address.county) {
                        placeName = data.address.county;
                    }
                }

                // Log the closest place name to the console
                console.log("Closest place:", placeName);

                // Format the new coordinate with 6 decimal places, respecting the coordinate order setting
                const first = isLatLngOrder ? lat.toFixed(6) : lng.toFixed(6);
                const second = isLatLngOrder ? lng.toFixed(6) : lat.toFixed(6);
                const newCoord = `${first}, ${second} "${placeName}" blue`;

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

                // Format the new coordinate with 6 decimal places, respecting the coordinate order setting
                const first = isLatLngOrder ? lat.toFixed(6) : lng.toFixed(6);
                const second = isLatLngOrder ? lng.toFixed(6) : lat.toFixed(6);
                const newCoord = `${first}, ${second} "" blue`;

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

    // Handle marker drag events
    const handleMarkerDrag = (index, newLat, newLng) => {
        // Update the coordinates array with the new position
        const updatedCoordinates = [...coordinates];
        updatedCoordinates[index] = {
            ...updatedCoordinates[index],
            lat: parseFloat(newLat.toFixed(6)),
            lng: parseFloat(newLng.toFixed(6))
        };

        // Update the coordinates state
        setCoordinates(updatedCoordinates);

        // Update the textarea with the new coordinates
        const updatedText = formatCoordinatesToText(updatedCoordinates, isLatLngOrder);
        setInputText(updatedText);
    };

    // Handle marker delete events
    const handleMarkerDelete = (index) => {
        // Remove the coordinate at the specified index
        const updatedCoordinates = coordinates.filter((_, i) => i !== index);

        // Update the coordinates state
        setCoordinates(updatedCoordinates);

        // Update the textarea with the new coordinates
        const updatedText = formatCoordinatesToText(updatedCoordinates, isLatLngOrder);
        setInputText(updatedText);
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
                measureEnabled,
                isFullscreen, // Include fullscreen state in URL
                isLatLngOrder // Include coordinate order in URL
            };

            const newHash = encodeStateToHash(state);
            if (window.location.hash !== newHash) {
                window.history.pushState(null, '', newHash);
            }
        }
    }, [coordinates, mapType, urlCenter, urlZoom, mapCenter, mapZoom, measureEnabled, isFullscreen, isLatLngOrder]);

    // Parse URL on initial load
    useEffect(() => {
        const handleHashChange = () => {
            const state = decodeHashToState(window.location.hash);
            if (state) {
                // Get the coordinate order from URL or use current setting
                const coordinateOrder = state.isLatLngOrder !== undefined ? state.isLatLngOrder : isLatLngOrderRef.current;

                if (state.coordinates) {
                    // Convert coordinates to string for textarea using the coordinate order from URL or current setting
                    const coordsText = formatCoordinatesToText(state.coordinates, coordinateOrder);
                    setInputText(coordsText);
                }

                // Set coordinate order after setting input text to avoid triggering useEffect
                if (state.isLatLngOrder !== undefined) {
                    setIsLatLngOrder(state.isLatLngOrder);
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
                    // Default to zoom level 5 for continental US view if no zoom is specified
                    setMapZoom(5);
                }

                // Set measure tool state if specified in URL
                if (state.measureEnabled !== undefined) {
                    setMeasureEnabled(state.measureEnabled);
                }

                // Set fullscreen state if specified in URL
                if (state.isFullscreen !== undefined) {
                    setIsFullscreen(state.isFullscreen);
                }
            } else {
                // No state in URL, set defaults for US
                setMapCenter([39.8283, -98.5795]);
                setMapZoom(5);
            }
        };

        // Parse hash on initial load
        handleHashChange();

        // Listen for hash changes (browser back/forward)
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [formatCoordinatesToText]);

    return (
        <div className="App">
            <div className="input-container">
        <textarea
            placeholder={`Enter coordinates (one pair per line, format: ${isLatLngOrder ? 'latitude, longitude' : 'longitude, latitude'}) or click on the map to add a new coordinate`}
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
                            // Get the coordinate order from URL or use current setting
                            const coordinateOrder = state.isLatLngOrder !== undefined ? state.isLatLngOrder : isLatLngOrderRef.current;

                            // Update state based on the decoded information
                            if (state.coordinates) {
                                // Convert coordinates to string for textarea using the coordinate order from URL or current setting
                                const coordsText = formatCoordinatesToText(state.coordinates, coordinateOrder);
                                setInputText(coordsText);
                            }

                            // Set coordinate order after setting input text to avoid triggering useEffect
                            if (state.isLatLngOrder !== undefined) {
                                setIsLatLngOrder(state.isLatLngOrder);
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

                            // Set fullscreen state if specified in URL
                            if (state.isFullscreen !== undefined) {
                                setIsFullscreen(state.isFullscreen);
                            }
                        }
                    }
                }
            }}
            rows={windowSize.width <= 480 ? 3 : windowSize.width <= 768 ? 4 : 5}
        />
                <div className="controls-container">
                    <div className="coordinates-info">
                        {coordinates.length > 0 ? (
                            <span>{coordinates.length} coordinate{coordinates.length !== 1 ? 's' : ''}</span>
                        ) : (
                            <span>No coordinates found</span>
                        )}
                        {/* Zoom to fit button */}
                        {coordinates.length > 0 && (
                            <button
                                className="zoom-to-fit-btn"
                                title="Zoom and center map to fit all points"
                                style={{
                                    marginLeft: '8px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px 6px',
                                    verticalAlign: 'middle'
                                }}
                                onClick={handleZoomToFit}
                            >
                                {/* Target icon SVG */}
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="8" stroke="#0078FF" strokeWidth="2"/>
                                    <circle cx="10" cy="10" r="2" fill="#0078FF"/>
                                    <line x1="10" y1="1" x2="10" y2="4" stroke="#0078FF" strokeWidth="2"/>
                                    <line x1="10" y1="16" x2="10" y2="19" stroke="#0078FF" strokeWidth="2"/>
                                    <line x1="1" y1="10" x2="4" y2="10" stroke="#0078FF" strokeWidth="2"/>
                                    <line x1="16" y1="10" x2="19" y2="10" stroke="#0078FF" strokeWidth="2"/>
                                </svg>
                            </button>
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
                                        <li>Use the toggle button to switch between Lat,Lng and Lng,Lat order</li>
                                    </ul>
                                    <h4>Optional:</h4>
                                    <ul>
                                        <li>Label (in quotes)</li>
                                        <li>Color (name or hex code)</li>
                                    </ul>
                                    <h4>Examples (Lat,Lng order):</h4>
                                    <pre style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
                    40.7128, -74.0060 "New York"<br/>
                    34.0522, -118.243 "Los Angeles"<br/>
                    41.8781, -87.6298 "Chicago" red<br/>
                    29.7604, -95.3698 "Houston" #EB33FF<br/>
                    25.7617 -80.1918 "Miami" green<br/>
                  </pre>
                                    <h4>Examples (Lng,Lat order):</h4>
                                    <pre style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
                    -74.0060, 40.7128 "New York"<br/>
                    -118.243, 34.0522 "Los Angeles"<br/>
                    -87.6298, 41.8781 "Chicago" red<br/>
                    -95.3698, 29.7604 "Houston" #EB33FF<br/>
                    -80.1918, 25.7617 "Miami" green<br/>
                  </pre>
                                    <button onClick={() => setShowFormatDialog(false)}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="center-controls-group">
                        <div className="coordinate-order-button">
                            <button
                                title="Toggle between latitude-longitude and longitude-latitude order"
                                onClick={() => {
                                    const newOrder = !isLatLngOrder;
                                    setIsLatLngOrder(newOrder);

                                    // Reverse the coordinates in the textarea
                                    if (inputText.trim()) {
                                        const reversedText = formatCoordinatesToText(coordinates, newOrder);
                                        setInputText(reversedText);
                                    }
                                }}
                            >
                                {isLatLngOrder ? 'Lat ⟷ Lng' : 'Lng ⟷ Lat'}
                            </button>
                        </div>
                        <div className="control-divider"></div>
                        <div className="map-type-selector">
                            <label htmlFor="map-type">Map: </label>
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
                        <div className="control-divider"></div>
                        <div className="measure-tool-toggle">
                            <label title="Measure distances between the points on the map">
                                <span>Measure</span>
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
                        <div className="control-divider"></div>
                        <div className="zoom-level-display">
                            <p>Zoom: {urlZoom || mapZoom || 'N/A'}</p>
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
                    onMarkerDrag={handleMarkerDrag}
                    onMarkerDelete={handleMarkerDelete}
                    measureEnabled={measureEnabled}
                    isFullscreenInitial={isFullscreen}
                    onFullscreenChange={handleFullscreenChange}
                />
            </div>
        </div>
    );
}

export default App;
