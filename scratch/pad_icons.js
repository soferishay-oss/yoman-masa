const { Jimp } = require('jimp');

async function padIcon(size) {
  try {
    const filePath = `public/icon-${size}.png`;
    const img = await Jimp.read(filePath);
    
    // Create a new white image of the same size
    const bg = new Jimp({ width: size, height: size, color: '#ffffff' });
    
    // Resize original image to 70% (giving 15% padding on all sides)
    const newSize = Math.floor(size * 0.7);
    img.resize({ w: newSize, h: newSize });
    
    // Composite original onto bg in the center
    bg.composite(img, Math.floor((size - newSize) / 2), Math.floor((size - newSize) / 2));
    
    await bg.write(filePath);
    console.log(`Successfully padded ${size}px icon`);
  } catch (err) {
    console.error(`Error processing ${size}px icon:`, err);
  }
}

async function main() {
  await padIcon(192);
  await padIcon(512);
}

main();
