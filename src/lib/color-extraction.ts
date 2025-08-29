export const extractDominantColor = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('rgba(255, 255, 255, 0.3)');
      return;
    }

    // Set small canvas size for performance
    canvas.width = 50;
    canvas.height = 50;

    // Draw image/video frame to canvas
    if (imageElement instanceof HTMLImageElement) {
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    } else {
      // For video elements, draw current frame
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const colorCounts: { [key: string]: number } = {};
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels and very dark/light pixels
      if (a < 125 || (r + g + b) < 50 || (r + g + b) > 650) continue;
      
      // Round to nearest 32 to group similar colors
      const roundedR = Math.round(r / 32) * 32;
      const roundedG = Math.round(g / 32) * 32;
      const roundedB = Math.round(b / 32) * 32;
      
      const color = `${roundedR},${roundedG},${roundedB}`;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
    
    // Find most frequent color
    let dominantColor = '255,255,255';
    let maxCount = 0;
    
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }
    
    resolve(`rgba(${dominantColor}, 0.3)`);
  });
};

export const extractColorFromMediaUrl = async (url: string, isVideo: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.onloadeddata = async () => {
        video.currentTime = 1; // Seek to 1 second for a good frame
      };
      
      video.onseeked = async () => {
        try {
          const color = await extractDominantColor(video);
          resolve(color);
        } catch (error) {
          resolve('rgba(255, 255, 255, 0.3)');
        }
      };
      
      video.onerror = () => {
        resolve('rgba(255, 255, 255, 0.3)');
      };
      
      video.src = url;
      video.load();
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          const color = await extractDominantColor(img);
          resolve(color);
        } catch (error) {
          resolve('rgba(255, 255, 255, 0.3)');
        }
      };
      
      img.onerror = () => {
        resolve('rgba(255, 255, 255, 0.3)');
      };
      
      img.src = url;
    }
  });
};