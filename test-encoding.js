// Test script to verify encoding and decoding of special characters in place names

// Function to encode state to URL hash (updated version)
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

// Function to decode state from URL hash (updated version)
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

// Test with a state object containing a place name with special characters
const testState = {
  coordinates: [
    { lat: 49.2231, lng: 18.7403, label: "Žilina", color: "blue" },
    { lat: 48.1486, lng: 17.1077, label: "Bratislava", color: "red" }
  ],
  mapType: "openstreetmap",
  center: { lat: 48.6737, lng: 19.6990 },
  zoom: 7,
  measureEnabled: false
};

// Encode the test state to a URL hash
const encodedHash = encodeStateToHash(testState);
console.log("Encoded URL hash:", encodedHash);

// Decode the URL hash back to a state object
const decodedState = decodeHashToState(encodedHash);
console.log("Decoded state:", JSON.stringify(decodedState, null, 2));

// Verify that the special characters are preserved
console.log("Original place name with special characters:", testState.coordinates[0].label);
console.log("Decoded place name with special characters:", decodedState.coordinates[0].label);
console.log("Are they equal?", testState.coordinates[0].label === decodedState.coordinates[0].label);

// Test with the original encoding/decoding functions (without encodeURIComponent/decodeURIComponent)
const originalEncodeStateToHash = (state) => {
  try {
    const stateString = JSON.stringify(state);
    return `#${btoa(stateString)}`;
  } catch (error) {
    console.error('Error encoding state to hash (original):', error);
    return '';
  }
};

try {
  const originalEncodedHash = originalEncodeStateToHash(testState);
  console.log("Original encoded URL hash:", originalEncodedHash);
} catch (error) {
  console.error("Error with original encoding:", error.message);
}