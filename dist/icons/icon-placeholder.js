// Generate placeholder icons if needed
function generateIcon(size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#06b6d4');
  gradient.addColorStop(0.5, '#3b82f6');
  gradient.addColorStop(1, '#9333ea');
  
  // Background with rounded corners
  const radius = size * 0.15;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Text
  const fontSize = size * 0.16;
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (size >= 64) {
    ctx.fillText('LETRIS', size/2, size/2);
  } else {
    ctx.fillText('L', size/2, size/2);
  }
  
  // Decorative blocks for larger sizes
  if (size >= 128) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const blockSize = size * 0.08;
    const spacing = blockSize * 1.2;
    const startX = (size - (4 * spacing)) / 2;
    const topY = size * 0.2;
    
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(startX + (i * spacing), topY, blockSize, blockSize);
    }
  }
  
  return canvas.toDataURL('image/png');
}

// Add roundRect support for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateIcon };
} else if (typeof window !== 'undefined') {
  window.generateIcon = generateIcon;
}