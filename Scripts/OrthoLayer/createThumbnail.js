import Tiff from 'tiff.js';

export async function createTiffThumbnail(url, width = 100) {
  try {
    // Fetch the TIFF file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Read the TIFF using tiff.js
    const tiff = new Tiff({ buffer: arrayBuffer });
    // Get the first page of the TIFF
    tiff.setDirectory(0);

    // Create a canvas and draw the TIFF image
    const canvas = document.createElement('canvas');
    tiff.render({canvas: canvas});

    // Scale down the canvas to create a thumbnail
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    const scale = width / canvas.width;
    thumbnailCanvas.width = width;
    thumbnailCanvas.height = canvas.height * scale;
    ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

    // Convert the thumbnail to a data URL
    return thumbnailCanvas.toDataURL('image/jpeg');
  } catch (error) {
    console.log(error);
    return "";
  }
}