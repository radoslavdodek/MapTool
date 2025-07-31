// Test script to verify the namedColors implementation

// Function to simulate the getHueRotation function from Map.js
const getHueRotation = (color) => {
  // Copy of the namedColors object from Map.js
  const namedColors = {
    'aliceblue': 208,
    'antiquewhite': 34,
    'aqua': 180,
    'aquamarine': 160,
    'azure': 180,
    'beige': 60,
    'bisque': 33,
    'black': 0,
    'blanchedalmond': 36,
    'blue': 240,
    'blueviolet': 271,
    'brown': 0,
    'burlywood': 34,
    'cadetblue': 182,
    'chartreuse': 90,
    'chocolate': 25,
    'coral': 16,
    'cornflowerblue': 219,
    'cornsilk': 48,
    'crimson': 348,
    'cyan': 180,
    'darkblue': 240,
    'darkcyan': 180,
    'darkgoldenrod': 43,
    'darkgray': 0,
    'darkgreen': 120,
    'darkgrey': 0,
    'darkkhaki': 56,
    'darkmagenta': 300,
    'darkolivegreen': 82,
    'darkorange': 33,
    'darkorchid': 280,
    'darkred': 0,
    'darksalmon': 15,
    'darkseagreen': 120,
    'darkslateblue': 248,
    'darkslategray': 180,
    'darkslategrey': 180,
    'darkturquoise': 181,
    'darkviolet': 282,
    'deeppink': 328,
    'deepskyblue': 195,
    'dimgray': 0,
    'dimgrey': 0,
    'dodgerblue': 210,
    'firebrick': 0,
    'floralwhite': 40,
    'forestgreen': 120,
    'fuchsia': 300,
    'gainsboro': 0,
    'ghostwhite': 240,
    'gold': 51,
    'goldenrod': 43,
    'gray': 0,
    'green': 120,
    'greenyellow': 84,
    'grey': 0,
    'honeydew': 120,
    'hotpink': 330,
    'indianred': 0,
    'indigo': 275,
    'ivory': 60,
    'khaki': 54,
    'lavender': 240,
    'lavenderblush': 340,
    'lawngreen': 90,
    'lemonchiffon': 54,
    'lightblue': 195,
    'lightcoral': 0,
    'lightcyan': 180,
    'lightgoldenrodyellow': 60,
    'lightgray': 0,
    'lightgreen': 120,
    'lightgrey': 0,
    'lightpink': 351,
    'lightsalmon': 17,
    'lightseagreen': 177,
    'lightskyblue': 203,
    'lightslategray': 210,
    'lightslategrey': 210,
    'lightsteelblue': 214,
    'lightyellow': 60,
    'lime': 120,
    'limegreen': 120,
    'linen': 30,
    'magenta': 300,
    'maroon': 0,
    'mediumaquamarine': 160,
    'mediumblue': 240,
    'mediumorchid': 288,
    'mediumpurple': 260,
    'mediumseagreen': 147,
    'mediumslateblue': 249,
    'mediumspringgreen': 157,
    'mediumturquoise': 178,
    'mediumvioletred': 322,
    'midnightblue': 240,
    'mintcream': 150,
    'mistyrose': 6,
    'moccasin': 38,
    'navajowhite': 36,
    'navy': 240,
    'oldlace': 39,
    'olive': 60,
    'olivedrab': 80,
    'orange': 39,
    'orangered': 16,
    'orchid': 302,
    'palegoldenrod': 55,
    'palegreen': 120,
    'paleturquoise': 180,
    'palevioletred': 340,
    'papayawhip': 37,
    'peachpuff': 28,
    'peru': 30,
    'pink': 350,
    'plum': 300,
    'powderblue': 187,
    'purple': 300,
    'rebeccapurple': 270,
    'red': 0,
    'rosybrown': 0,
    'royalblue': 225,
    'saddlebrown': 25,
    'salmon': 6,
    'sandybrown': 28,
    'seagreen': 146,
    'seashell': 25,
    'sienna': 19,
    'silver': 0,
    'skyblue': 197,
    'slateblue': 248,
    'slategray': 210,
    'slategrey': 210,
    'snow': 0,
    'springgreen': 150,
    'steelblue': 207,
    'tan': 34,
    'teal': 180,
    'thistle': 300,
    'tomato': 9,
    'turquoise': 174,
    'violet': 300,
    'wheat': 39,
    'white': 0,
    'whitesmoke': 0,
    'yellow': 60,
    'yellowgreen': 80
  };
  
  if (color && typeof color === 'string' && namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()] - 210; // Adjust for the default blue marker
  }
  
  return 0; // Default to no rotation
};

// Test a variety of colors
const testColors = [
  'red',
  'blue',
  'green',
  'yellow',
  'cyan',
  'magenta',
  'purple',
  'orange',
  'darkblue',
  'lightgreen',
  'tomato',
  'rebeccapurple',
  'nonexistentcolor' // This should return 0
];

// Run the tests
console.log('Testing getHueRotation function with various colors:');
console.log('---------------------------------------------------');
for (const color of testColors) {
  const hueRotation = getHueRotation(color);
  console.log(`Color: ${color}, Hue Rotation: ${hueRotation} degrees`);
}

// Test case sensitivity
console.log('\nTesting case sensitivity:');
console.log('------------------------');
const caseTests = ['RED', 'Blue', 'GrEeN'];
for (const color of caseTests) {
  const hueRotation = getHueRotation(color);
  console.log(`Color: ${color}, Hue Rotation: ${hueRotation} degrees`);
}

// Count the number of colors in the namedColors object
const colorCount = Object.keys(namedColors).length;
console.log(`\nTotal number of CSS named colors: ${colorCount}`);