const { runOCR } = require('./utils/ocr');
const aadharParser = require('./parsers/aadhar-parser');
const path = require('path');

async function testAadharOCR() {
  console.log('='.repeat(60));
  console.log('TESTING AADHAR OCR AND PARSER');
  console.log('='.repeat(60));
  
  const testImage = path.join(__dirname, 'uploads', '1761795996511-132077577-aadhar_2.jpg');
  
  console.log('\nTest Image:', testImage);
  console.log('\n');
  
  try {
    // Run OCR
    const ocr = await runOCR(testImage, 'aadhar');
    
    console.log('\n' + '='.repeat(60));
    console.log('RAW OCR TEXT OUTPUT:');
    console.log('='.repeat(60));
    console.log(ocr.text);
    console.log('='.repeat(60));
    console.log(`Text length: ${ocr.text.length} characters`);
    console.log(`OCR Confidence: ${ocr.confidence.toFixed(1)}%`);
    console.log('='.repeat(60));
    
    // Parse the text
    console.log('\n\nNow parsing with Aadhar parser...\n');
    const parsed = aadharParser.parse(ocr);
    
    console.log('\n' + '='.repeat(60));
    console.log('PARSED FIELDS:');
    console.log('='.repeat(60));
    parsed.fields.forEach(field => {
      const status = field.field_value ? '✓' : '✗';
      const confidence = field.confidence_score > 0 ? `${(field.confidence_score * 100).toFixed(0)}%` : 'N/A';
      console.log(`${status} ${field.field_name}: "${field.field_value}" (${confidence})`);
    });
    console.log('='.repeat(60));
    console.log(`Overall Confidence: ${(parsed.confidence_overall * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testAadharOCR();