/**
 * Test script to diagnose passport upload errors
 */
const path = require('path');
const { runOCR } = require('./utils/ocr');
const passportParser = require('./parsers/passport-parser');

async function testPassportUpload() {
  console.log('=== Testing Passport Upload Process ===\n');
  
  // Use the most recent passport upload
  const testFile = path.join(__dirname, 'uploads', '1761742652129-589530811-passport.jpg');
  
  console.log('Test file:', testFile);
  console.log('Starting OCR...\n');
  
  try {
    // Step 1: Test OCR
    const ocr = await runOCR(testFile);
    console.log('✓ OCR completed successfully');
    console.log('  - Text length:', ocr.text?.length || 0);
    console.log('  - Confidence:', ocr.confidence);
    console.log('  - First 200 chars:', ocr.text?.substring(0, 200) || 'NO TEXT');
    console.log('');
    
    // Step 2: Test Passport Parser
    console.log('Starting passport parsing...\n');
    const parsed = passportParser.parse(ocr);
    
    console.log('✓ Parsing completed successfully');
    console.log('  - Overall confidence:', parsed.confidence_overall);
    console.log('  - Fields found:', parsed.fields.filter(f => f.field_value).length);
    console.log('');
    
    // Step 3: Show extracted fields
    console.log('Extracted fields:');
    parsed.fields.forEach(field => {
      if (field.field_value) {
        console.log(`  - ${field.field_name}: ${field.field_value} (${Math.round(field.confidence_score * 100)}%)`);
      }
    });
    
  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPassportUpload();
