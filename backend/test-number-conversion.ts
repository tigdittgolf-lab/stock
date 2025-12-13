import { numberToWords } from './src/utils/numberToWords.js';

// Test simple
try {
  console.log('Test 1234.56:', numberToWords(1234.56));
  console.log('Test 100:', numberToWords(100));
  console.log('Test 21:', numberToWords(21));
} catch (error) {
  console.error('Error:', error);
}