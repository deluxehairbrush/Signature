// Test OCR functionality with the created test images
const { extractTextFromImage, isLowConfidence, getConfidenceMessage } = require('../lib/ocr');
const { readFileSync } = require('fs');
const path = require('path');

async function testOCRWithImage(imagePath: string, testName: string) {
  console.log(`\n=== Testing ${testName} ===`);
  
  try {
    const imageBuffer = readFileSync(imagePath);
    const file = new File([imageBuffer], path.basename(imagePath), { type: 'image/png' });
    
    console.log('Starting OCR extraction...');
    const result = await extractTextFromImage(file);
    
    console.log('✅ OCR completed successfully');
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Low confidence: ${isLowConfidence(result.confidence)}`);
    console.log(`Message: ${getConfidenceMessage(result.confidence)}`);
    console.log('\nExtracted text:');
    console.log('---');
    console.log(result.text);
    console.log('---');
    
    // Check for price extraction
    const priceMatches = result.text.match(/\$\d+/g);
    if (priceMatches) {
      console.log(`\n💰 Prices found: ${priceMatches.join(', ')}`);
    } else {
      console.log('\n⚠️ No prices found in extracted text');
    }
    
    // Check for key terms
    const keyTerms = ['price', 'budget', 'deadline', 'payment', 'deal'];
    const foundTerms = keyTerms.filter(term => result.text.toLowerCase().includes(term));
    console.log(`📋 Key terms found: ${foundTerms.join(', ') || 'None'}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error testing ${testName}:`, error);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 Starting OCR tests with generated images...\n');
  
  const testImages = [
    { path: './test-images/light-mode-chat.png', name: 'Light Mode WhatsApp Chat' },
    { path: './test-images/dark-mode-chat.png', name: 'Dark Mode WhatsApp Chat' },
    { path: './test-images/low-quality.png', name: 'Low Quality Image' },
  ];
  
  const results = [];
  
  for (const testImage of testImages) {
    const result = await testOCRWithImage(testImage.path, testImage.name);
    results.push({ name: testImage.name, result });
  }
  
  console.log('\n=== Test Summary ===');
  results.forEach(({ name, result }) => {
    if (result) {
      const status = result.confidence >= 60 ? '✅ PASS' : '⚠️ WARN';
      console.log(`${status} ${name}: ${result.confidence}% confidence`);
    } else {
      console.log(`❌ FAIL ${name}: OCR failed`);
    }
  });
  
  // Check for any price misreads
  console.log('\n=== Price Extraction Check ===');
  results.forEach(({ name, result }) => {
    if (result) {
      const priceMatches = result.text.match(/\$\d+/g);
      if (priceMatches) {
        console.log(`${name}: ${priceMatches.join(', ')}`);
        
        // Check for obvious misreads (our test images have $5000, $4500, $7500)
        const expectedPrices = ['$5000', '$4500', '$7500'];
        const misreads = priceMatches.filter(p => !expectedPrices.includes(p));
        if (misreads.length > 0) {
          console.log(`  ⚠️ POTENTIAL MISREAD: ${misreads.join(', ')}`);
        }
      }
    }
  });
}

runAllTests().catch(console.error);