// Create test images for OCR testing
// This simulates WhatsApp chat screenshots in light and dark mode
const { createCanvas } = require('canvas');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const canvas = createCanvas(400, 600);
const ctx = canvas.getContext('2d');

// Light mode WhatsApp screenshot
function createLightModeChat() {
  // Background
  ctx.fillStyle = '#E5DDD5';
  ctx.fillRect(0, 0, 400, 600);
  
  // Header
  ctx.fillStyle = '#075E54';
  ctx.fillRect(0, 0, 400, 60);
  
  // Header text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Freelance Chat', 20, 35);
  
  // Chat bubbles (green for sent, white for received)
  // Received message
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 80, 250, 60);
  ctx.fillStyle = 'black';
  ctx.font = '14px Arial';
  ctx.fillText('Hi, I need a website for my business', 30, 110);
  ctx.fillText('Budget is around $5000', 30, 130);
  
  // Sent message
  ctx.fillStyle = '#DCF8C6';
  ctx.fillRect(130, 160, 250, 80);
  ctx.fillStyle = 'black';
  ctx.fillText('Sure! I can help with that', 140, 190);
  ctx.fillText('What type of website do you need?', 140, 210);
  ctx.fillText('Timeline and specific requirements?', 140, 230);
  
  // Received message with price
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 260, 250, 100);
  ctx.fillStyle = 'black';
  ctx.fillText('E-commerce site with 50 products', 30, 290);
  ctx.fillText('Deadline: 2 weeks', 30, 310);
  ctx.fillText('Payment: 50% upfront, 50% on delivery', 30, 330);
  ctx.fillText('Final price: $4500', 30, 350);
  
  // Sent message
  ctx.fillStyle = '#DCF8C6';
  ctx.fillRect(130, 380, 250, 60);
  ctx.fillStyle = 'black';
  ctx.fillText('Deal! Let me send you the contract', 140, 410);
  ctx.fillText('I\'ll start work tomorrow', 140, 430);
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(path.join(__dirname, '../test-images/light-mode-chat.png'), buffer);
  console.log('Created light-mode-chat.png');
}

// Dark mode WhatsApp screenshot
function createDarkModeChat() {
  // Background
  ctx.fillStyle = '#0B141A';
  ctx.fillRect(0, 0, 400, 600);
  
  // Header
  ctx.fillStyle = '#202C33';
  ctx.fillRect(0, 0, 400, 60);
  
  // Header text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Freelance Chat', 20, 35);
  
  // Chat bubbles (dark green for sent, dark gray for received)
  // Received message
  ctx.fillStyle = '#202C33';
  ctx.fillRect(20, 80, 250, 60);
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText('Hi, I need a website for my business', 30, 110);
  ctx.fillText('Budget is around $5000', 30, 130);
  
  // Sent message
  ctx.fillStyle = '#005C4B';
  ctx.fillRect(130, 160, 250, 80);
  ctx.fillStyle = 'white';
  ctx.fillText('Sure! I can help with that', 140, 190);
  ctx.fillText('What type of website do you need?', 140, 210);
  ctx.fillText('Timeline and specific requirements?', 140, 230);
  
  // Received message with price
  ctx.fillStyle = '#202C33';
  ctx.fillRect(20, 260, 250, 100);
  ctx.fillStyle = 'white';
  ctx.fillText('E-commerce site with 50 products', 30, 290);
  ctx.fillText('Deadline: 2 weeks', 30, 310);
  ctx.fillText('Payment: 50% upfront, 50% on delivery', 30, 330);
  ctx.fillText('Final price: $4500', 30, 350);
  
  // Sent message
  ctx.fillStyle = '#005C4B';
  ctx.fillRect(130, 380, 250, 60);
  ctx.fillStyle = 'white';
  ctx.fillText('Deal! Let me send you the contract', 140, 410);
  ctx.fillText('I\'ll start work tomorrow', 140, 430);
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(path.join(__dirname, '../test-images/dark-mode-chat.png'), buffer);
  console.log('Created dark-mode-chat.png');
}

// Low quality blurry image - genuinely degraded so it exercises the
// <60% confidence warning path, not just crisp text with light noise.
function createLowQualityImage() {
  // Render text small onto a low-res canvas...
  const smallScale = 0.25;
  const smallCanvas = createCanvas(400 * smallScale, 600 * smallScale);
  const smallCtx = smallCanvas.getContext('2d');

  smallCtx.fillStyle = '#CCCCCC';
  smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);

  smallCtx.fillStyle = '#666666';
  smallCtx.font = `${12 * smallScale}px Arial`;
  smallCtx.fillText('Price: $7500 for the project', 50 * smallScale, 100 * smallScale);
  smallCtx.fillText('Deadline: 3 weeks', 50 * smallScale, 130 * smallScale);
  smallCtx.fillText('Payment terms: Net 30', 50 * smallScale, 160 * smallScale);

  // ...then upscale it back to full size, which blurs the text (the classic
  // "downscale-then-upscale" way to fake a genuinely low-quality screenshot.
  ctx.fillStyle = '#CCCCCC';
  ctx.fillRect(0, 0, 400, 600);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(smallCanvas, 0, 0, 400, 600);

  // Heavier, higher-opacity noise on top of the blur.
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.35)`;
    ctx.fillRect(Math.random() * 400, Math.random() * 600, 2, 2);
  }

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(path.join(__dirname, '../test-images/low-quality.png'), buffer);
  console.log('Created low-quality.png');
}

// Create test images directory
try {
  mkdirSync(path.join(__dirname, '../test-images'));
} catch (e) {
  // Directory might already exist
}

createLightModeChat();
createDarkModeChat();
createLowQualityImage();

console.log('Test images created successfully!');