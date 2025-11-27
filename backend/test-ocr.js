const { runOCR } = require('./utils/ocr');
const passportParser = require('./parsers/passport-parser');

async function test() {
  try {
    console.log('Testing OCR on passport image...');
    const result = await runOCR('./uploads/1761792443770-186945408-passport.jpg');
    
    console.log('\n=== RAW OCR TEXT ===');
    console.log(result.text);
    console.log('\n=== END RAW TEXT ===\n');
    
    console.log('Running parser...');
    const parsed = passportParser.parse(result);
    
    console.log('\n=== PARSED FIELDS ===');
    parsed.fields.forEach(field => {
      console.log(`${field.field_name}: "${field.field_value}" (confidence: ${field.confidence_score})`);
    });
    console.log('\n=== END PARSED FIELDS ===');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
