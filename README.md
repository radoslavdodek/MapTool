# MapTool

A simple React application that allows users to visualize geographic coordinates on a map. Users can input latitude and longitude coordinates in a text area, and the application will display these points as markers on an interactive map.

## Quick Start

The application is located in the `latlon-tool` directory. To get started:

```bash
cd latlon-tool
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Building and Deployment

To build the application for production:

```bash
cd latlon-tool
npm run build
```

This creates an optimized production build in the `build` folder that can be deployed to various hosting platforms.

### Deploying to a Subfolder

If you want to deploy the application to a specific subfolder on your server (e.g., https://example.com/maptool/), you need to configure the `homepage` field in package.json. See the [Custom Server Subfolder Deployment](latlon-tool/README.md#custom-server-subfolder-deployment) section in the latlon-tool README for detailed instructions.

For other deployment options (GitHub Pages, Netlify, Vercel, AWS), see the [Building and Deployment](latlon-tool/README.md#building-and-deployment) section in the latlon-tool README.

## Features

- Input latitude and longitude coordinates in a text area
- Support for multiple coordinate formats (comma-separated or space-separated)
- Optional labels for points (in quotes after coordinates, e.g., `41.849834 -87.880674 "Community Park in Westchester"`)
- Optional color specification for points (after the label, e.g., `41.849834 -87.880674 "Park" red` or `41.849834 -87.880674 #00FF00`)
- Reliable label display that works well at all zoom levels
- Real-time parsing and validation of coordinates
- Interactive map display using Leaflet
- Multiple map styles to choose from (OpenStreetMap, OpenTopoMap, Stamen Terrain, etc.)
- URL sharing functionality - all map state is encoded in the URL for easy sharing
- Responsive design with the map taking up most of the screen space

For more detailed information, please see the [README.md](latlon-tool/README.md) in the latlon-tool directory.
