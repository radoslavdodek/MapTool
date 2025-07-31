// Test script for coordinate parsing with labels

// This is a simplified version of the parseCoordinates function from App.js
const parseCoordinates = (text) => {
  if (!text.trim()) return [];
  
  const lines = text.split('\n');
  const parsedCoordinates = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//')) continue; // Skip comments
    
    // Format 1: "lat, lng" or "lat,lng" with optional label in quotes
    const commaMatchWithLabel = trimmedLine.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*(?:"([^"]*)")?$/);
    if (commaMatchWithLabel) {
      const lat = parseFloat(commaMatchWithLabel[1]);
      const lng = parseFloat(commaMatchWithLabel[2]);
      const label = commaMatchWithLabel[3] || null;
      if (!isNaN(lat) && !isNaN(lng)) {
        parsedCoordinates.push({ lat, lng, label });
        continue;
      }
    }
    
    // Format 2: "lat lng" (space separated) with optional label in quotes
    const spaceMatchWithLabel = trimmedLine.match(/^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*(?:"([^"]*)")?$/);
    if (spaceMatchWithLabel) {
      const lat = parseFloat(spaceMatchWithLabel[1]);
      const lng = parseFloat(spaceMatchWithLabel[2]);
      const label = spaceMatchWithLabel[3] || null;
      if (!isNaN(lat) && !isNaN(lng)) {
        parsedCoordinates.push({ lat, lng, label });
        continue;
      }
    }
  }
  
  return parsedCoordinates;
};

// Read the test file
const fs = require('fs');
const path = require('path');

try {
  const testFilePath = path.join(__dirname, 'test-coordinates.txt');
  const testFileContent = fs.readFileSync(testFilePath, 'utf8');
  
  // Parse the coordinates
  const coordinates = parseCoordinates(testFileContent);
  
  // Display the results
  console.log('Parsed Coordinates:');
  coordinates.forEach((coord, index) => {
    console.log(`\nCoordinate ${index + 1}:`);
    console.log(`  Latitude: ${coord.lat}`);
    console.log(`  Longitude: ${coord.lng}`);
    console.log(`  Label: ${coord.label || 'None'}`);
  });
  
  console.log(`\nTotal coordinates parsed: ${coordinates.length}`);
} catch (error) {
  console.error('Error:', error.message);
}