export function getImageWithBackgroundFillColor(
  imageUrl: string
): Promise<{ dataUrl: string; backgroundColor: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // Allow cross-origin images
    image.src = imageUrl;

    image.onload = () => {
      const originalWidth = image.width;
      const originalHeight = image.height;

      // Draw the image on a temporary canvas to extract border pixels
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        reject(new Error("Failed to get temporary canvas context"));
        return;
      }

      tempCtx.drawImage(image, 0, 0, originalWidth, originalHeight);

      // Extract border pixels
      const rValues: number[] = [];
      const gValues: number[] = [];
      const bValues: number[] = [];
      const aValues: number[] = [];
      const imageData = tempCtx.getImageData(
        0,
        0,
        originalWidth,
        originalHeight
      ).data;

      // Top and bottom border pixels
      for (let x = 0; x < originalWidth; x++) {
        // Top border
        const topIndex = x * 4;
        rValues.push(imageData[topIndex]);
        gValues.push(imageData[topIndex + 1]);
        bValues.push(imageData[topIndex + 2]);
        aValues.push(imageData[topIndex + 3]);

        // Bottom border
        const bottomIndex = ((originalHeight - 1) * originalWidth + x) * 4;
        rValues.push(imageData[bottomIndex]);
        gValues.push(imageData[bottomIndex + 1]);
        bValues.push(imageData[bottomIndex + 2]);
        aValues.push(imageData[bottomIndex + 3]);
      }

      // Left and right border pixels
      for (let y = 0; y < originalHeight; y++) {
        // Left border
        const leftIndex = y * originalWidth * 4;
        rValues.push(imageData[leftIndex]);
        gValues.push(imageData[leftIndex + 1]);
        bValues.push(imageData[leftIndex + 2]);
        aValues.push(imageData[leftIndex + 3]);

        // Right border
        const rightIndex = (y * originalWidth + originalWidth - 1) * 4;
        rValues.push(imageData[rightIndex]);
        gValues.push(imageData[rightIndex + 1]);
        bValues.push(imageData[rightIndex + 2]);
        aValues.push(imageData[rightIndex + 3]);
      }

      // Helper function to calculate the median of an array
      const calculateMedian = (values: number[]): number => {
        const sorted = values.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      // Calculate median values
      const rMedian = calculateMedian(rValues);
      const gMedian = calculateMedian(gValues);
      const bMedian = calculateMedian(bValues);
      const aMedian = calculateMedian(aValues);

      // Convert the canvas to a data URL
      const dataUrl = tempCanvas.toDataURL("image/png");
      resolve({
        dataUrl,
        backgroundColor: `rgba(${rMedian}, ${gMedian}, ${bMedian}, ${aMedian})`,
      });
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
}
