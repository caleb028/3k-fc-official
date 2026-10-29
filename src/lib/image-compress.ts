/**
 * Client-side high-quality image compressor using HTML5 canvas.
 * Downscales smartphone/camera photos (e.g. 5-20MB) to optimal web editorial dimensions
 * and creates an ultra-fast base64 Data URL (~100-250KB).
 */
export function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.82
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            sizeKb: Math.round(file.size / 1024),
          });
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
