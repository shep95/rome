/**
 * Extracts the dominant color from an image or video frame
 */
export const extractDominantColor = (element: HTMLImageElement | HTMLVideoElement): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('rgb(59, 130, 246)'); // fallback blue
        return;
      }

      // Set canvas size (smaller for performance)
      canvas.width = 50;
      canvas.height = 50;
      
      // Draw the element to canvas
      ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Color buckets for averaging
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      // Sample pixels (skip every 4th for performance)
      for (let i = 0; i < data.length; i += 16) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const alpha = data[i + 3];
        
        // Skip transparent pixels
        if (alpha < 128) continue;
        
        // Skip very dark or very light pixels for better color
        const brightness = (red + green + blue) / 3;
        if (brightness < 30 || brightness > 225) continue;
        
        r += red;
        g += green;
        b += blue;
        count++;
      }
      
      if (count === 0) {
        resolve('rgb(59, 130, 246)'); // fallback blue
        return;
      }
      
      // Calculate average
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      resolve(`rgb(${r}, ${g}, ${b})`);
    } catch (error) {
      console.warn('Color extraction fallback (likely CORS-tainted canvas):', error);
      resolve('rgb(59, 130, 246)'); // fallback blue
    }
  });
};

/**
 * Extracts color from video by capturing current frame
 */
export const extractVideoColor = (video: HTMLVideoElement): Promise<string> => {
  return new Promise((resolve) => {
    if (video.readyState >= 2) {
      // Video has loaded enough to extract frame
      extractDominantColor(video).then(resolve);
    } else {
      // Wait for video to load
      const handleLoadedData = () => {
        extractDominantColor(video).then(resolve);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      video.addEventListener('loadeddata', handleLoadedData);
      
      // Fallback timeout
      setTimeout(() => {
        video.removeEventListener('loadeddata', handleLoadedData);
        resolve('rgb(59, 130, 246)');
      }, 3000);
    }
  });
};