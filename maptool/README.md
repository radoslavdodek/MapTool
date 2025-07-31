# MapTool

A simple React application that allows users to visualize geographic coordinates on a map. Users can input latitude and longitude coordinates in a text area, and the application will display these points as markers on an interactive map.

## Features

- Input latitude and longitude coordinates in a text area
- Support for multiple coordinate formats (comma-separated or space-separated)
- Optional labels for points (in quotes after coordinates)
- Optional color specification for points (using named colors or hex color codes)
- Real-time parsing and validation of coordinates
- Interactive map display using Leaflet
- Multiple map styles to choose from (OpenStreetMap, OpenTopoMap, Stamen Terrain, etc.)
- Markers for each valid coordinate pair
- Popups showing the exact coordinates when clicking on markers
- URL sharing functionality - all map state (coordinates, map position, zoom level, map type) is encoded in the URL for easy sharing
- Responsive design with the map taking up most of the screen space

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/MapTool.git
   cd MapTool/maptool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Usage

1. Enter coordinates in the text area at the top of the page, one pair per line.
2. Supported formats:
   - Comma-separated: `latitude, longitude` (e.g., `51.505, -0.09`)
   - Space-separated: `latitude longitude` (e.g., `51.505 -0.09`)
3. Optional features:
   - Add labels to points by including text in quotes after the coordinates:
     - `51.505, -0.09 "London Eye"`
     - `40.7128, -74.0060 "New York City"`
   - Specify colors for points by adding a color name or hex code after the coordinates (or after the label if present):
     - Using named colors: `51.505, -0.09 red` or `51.505, -0.09 "London Eye" blue`
     - Using hex colors: `51.505, -0.09 #FF0000` or `51.505, -0.09 "London Eye" #0000FF`
     - Supported named colors include: red, green, blue, yellow, orange, purple, cyan, magenta, etc.
4. The map will automatically update to show markers for all valid coordinates.
5. Use the "Map Type" dropdown to select different map styles:
   - OpenStreetMap (default) - Standard street map
   - OpenTopoMap - Topographic map
   - CartoDB Positron - Light, clean map style
   - CartoDB Dark Matter - Dark map style
   - ESRI StreetMap - Detailed street map from ESRI
   - ESRI Satellite - Satellite imagery
   - OpenStreetMap Cycle - Cycling-focused map highlighting bike routes and infrastructure
   - Humanitarian OSM - Humanitarian OpenStreetMap Team style, useful for disaster response
   - OpenRailwayMap - Railway infrastructure map showing tracks, stations, and signals
   - USGS Topo - US Geological Survey topographic maps with detailed terrain information
6. Click on any marker to see a popup with the exact coordinates, label, and color (if specified).
7. The map will automatically center on the average position of all coordinates.
8. **URL Sharing**: As you interact with the map (adding coordinates, changing map type, panning, zooming), the URL in your browser is automatically updated to include all this information. You can:
   - Copy and share the URL to show others the exact same map view
   - When opening a shared URL directly, the map will automatically position and zoom according to the URL parameters
   - Paste a shared URL directly into the textarea to load that map configuration
   - Use browser back/forward buttons to navigate between different map states
   - Bookmark specific map configurations for later use

## Example Input

```
51.505, -0.09 "London" red
40.7128, -74.0060 "New York" #00FF00
48.8566 2.3522 "Paris" blue
35.6762 139.6503 "Tokyo" orange
37.7749, -122.4194
34.0522 -118.2437 "Los Angeles"
```

The example above demonstrates:
- Coordinates with both label and color (London, New York, Paris, Tokyo)
- Using named colors (red, blue, orange)
- Using hex color codes (#00FF00 for green)
- Coordinates without any label or color (San Francisco)
- Coordinates with label but no color (Los Angeles)

## Technologies Used

- React
- Leaflet (via react-leaflet)
- CSS Flexbox for layout

## Building and Deployment

### Building for Production

To build the application for production, run:

```
npm run build
```

This creates an optimized production build in the `build` folder that can be deployed to any static hosting service.

### Deployment Options

The application is a static site that can be deployed to various hosting platforms. Here are instructions for some popular options:

#### GitHub Pages

1. Install the GitHub Pages package:
   ```
   npm install --save-dev gh-pages
   ```

2. Add the following to your `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/MapTool",
     "scripts": {
       "start": "react-scripts start",
       "build": "react-scripts build",
       "test": "react-scripts test",
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. Deploy the application:
   ```
   npm run deploy
   ```

#### Netlify

1. Create a `netlify.toml` file in the root of your project:
   ```toml
   [build]
     publish = "build"
     command = "npm run build"
   ```

2. Deploy using Netlify CLI:
   ```
   npm install -g netlify-cli
   netlify deploy
   ```

   Or connect your GitHub repository to Netlify for automatic deployments.

#### Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy the application:
   ```
   vercel
   ```

   Or connect your GitHub repository to Vercel for automatic deployments.

#### AWS S3 + CloudFront

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to S3:
   ```
   aws s3 sync build/ s3://your-bucket-name --delete
   ```

3. If using CloudFront, invalidate the cache:
   ```
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

#### Custom Server Subfolder Deployment

If you want to deploy the application to a specific subfolder on your server (e.g., https://example.com/maptool/), follow these steps:

1. Set the `homepage` field in your `package.json` to the subfolder path:
   ```json
   {
     "name": "maptool",
     "version": "0.1.0",
     "private": true,
     "homepage": "/maptool",
     "dependencies": {
       "react": "^19.1.1",
       "react-dom": "^19.1.1"
     }
   }
   ```

2. Build the application:
   ```
   npm run build
   ```

3. Deploy the contents of the `build` folder to the corresponding subfolder on your server. For example, if your server uses FTP:
   ```
   # Using an FTP client
   ftp> cd /path/to/your/webroot/maptool
   ftp> put -r build/* .
   ```
   
   Or using rsync:
   ```
   rsync -avz build/ username@your-server:/path/to/webroot/maptool/
   ```

The application will now be accessible at https://example.com/maptool/ and all asset paths will be correctly prefixed with the subfolder path.

### Environment Variables

If you need to configure environment variables for your production build, create a `.env.production` file in the root of your project before building:

```
REACT_APP_API_URL=https://your-api-url.com
```

For more information on environment variables in Create React App, see the [official documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/).

## License

This project is open source and available under the [MIT License](LICENSE).
