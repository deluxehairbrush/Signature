// Basic OCR test without actual images
import { isLowConfidence, getConfidenceMessage } from '../lib/ocr';

console.log('Testing OCR utility functions...\n');

// Test confidence thresholds
console.log('Testing confidence thresholds:');
console.log('High confidence (85):', isLowConfidence(85) ? 'LOW' : 'OK');
console.log('Medium confidence (65):', isLowConfidence(65) ? 'LOW' : 'OK');
console.log('Low confidence (45):', isLowConfidence(45) ? 'LOW' : 'OK');
console.log('Very low confidence (25):', isLowConfidence(25) ? 'LOW' : 'OK');

console.log('\nTesting confidence messages:');
console.log('High confidence (85):', getConfidenceMessage(85));
console.log('Medium confidence (65):', getConfidenceMessage(65));
console.log('Low confidence (45):', getConfidenceMessage(45));
console.log('Very low confidence (25):', getConfidenceMessage(25));

console.log('\n✅ OCR utility functions test completed!');