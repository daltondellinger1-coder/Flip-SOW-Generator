
/**
 * Compresses and resizes an image file to a maximum dimension and quality.
 * This prevents the IndexedDB from becoming bloated with massive Base64 strings
 * from high-resolution mobile camera photos.
 */
export const compressImage = (file: File, maxWidthHeight = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions ensuring max dimension is respected
        if (width > height) {
          if (width > maxWidthHeight) {
            height = Math.round(height * (maxWidthHeight / width));
            width = maxWidthHeight;
          }
        } else {
          if (height > maxWidthHeight) {
            width = Math.round(width * (maxWidthHeight / height));
            height = maxWidthHeight;
          }
        }

        elem.width = width;
        elem.height = height;

        const ctx = elem.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as compressed JPEG
        const dataUrl = elem.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
