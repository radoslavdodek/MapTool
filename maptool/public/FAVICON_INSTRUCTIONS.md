# Favicon Update Instructions

A new pin icon SVG has been created for the MapTool application. Follow these instructions to convert it to an .ico file and replace the existing favicon.

## Option 1: Using Online Converter

1. Use an online SVG to ICO converter like [convertio.co](https://convertio.co/svg-ico/) or [favicon.io](https://favicon.io/favicon-converter/)
2. Upload the `pin-icon.svg` file
3. Download the converted .ico file
4. Rename it to `favicon.ico`
5. Replace the existing `favicon.ico` file in the `public` directory

## Option 2: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Navigate to the public directory
cd maptool/public

# Convert SVG to ICO (creates multiple sizes)
convert -background transparent pin-icon.svg -define icon:auto-resize=16,32,48,64 favicon.ico

# This will replace the existing favicon.ico
```

## Option 3: Using Inkscape and GIMP

1. Open the SVG in Inkscape
2. Export as PNG with appropriate dimensions (e.g., 32x32, 64x64)
3. Open the PNG in GIMP
4. Export as ICO file (File > Export As... > Select .ico format)
5. Replace the existing `favicon.ico` file in the `public` directory

After replacing the favicon, rebuild the application to see the changes:

```bash
cd maptool
npm run build
```

The new pin icon favicon will be used when the application is loaded in the browser.