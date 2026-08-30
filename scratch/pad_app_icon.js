const { Jimp } = require('jimp');

async function padAnyIcon(filePath) {
  try {
    const img = await Jimp.read(filePath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    
    // Create a new white image of the same size
    const bg = new Jimp({ width: w, height: h, color: '#ffffff' });
    
    // Resize original image to 70%
    const newW = Math.floor(w * 0.7);
    const newH = Math.floor(h * 0.7);
    img.resize({ w: newW, h: newH });
    
    // Composite original onto bg in the center
    bg.composite(img, Math.floor((w - newW) / 2), Math.floor((h - newH) / 2));
    
    await bg.write(filePath);
    console.log(`Successfully padded ${filePath} (${w}x${h})`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

async function main() {
  await padAnyIcon('src/app/icon.png');
}

main();
