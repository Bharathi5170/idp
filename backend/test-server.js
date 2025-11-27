const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPassportUpload() {
  const passportPath = path.join(__dirname, 'uploads', '1761792443770-186945408-passport.jpg');
  
  console.log('\n🧪 Testing Passport Upload...');
  console.log('File:', passportPath);
  console.log('Checking if file exists...');
  
  if (!fs.existsSync(passportPath)) {
    console.error('❌ Passport file not found!');
    return;
  }
  
  console.log('✅ File exists\n');
  
  // Read the file
  const fileBuffer = fs.readFileSync(passportPath);
  const FormData = require('form-data');
  const form = new FormData();
  
  form.append('file', fileBuffer, {
    filename: 'passport.jpg',
    contentType: 'image/jpeg'
  });
  form.append('documentType', 'passport');
  form.append('consent', 'true');
  
  try {
    console.log('📤 Uploading to http://localhost:5000/api/upload...\n');
    
    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ SUCCESS! Server Response:\n');
    console.log('='.repeat(60));
    console.log('Document ID:', response.data.document_id);
    console.log('Document Type:', response.data.document_type);
    console.log('Status:', response.data.status);
    console.log('Overall Confidence:', response.data.overall_confidence + '%');
    console.log('Processing Time:', response.data.processing_time_ms + 'ms');
    console.log('='.repeat(60));
    console.log('\n📋 EXTRACTED FIELDS:\n');
    
    response.data.extracted_fields.forEach((field, index) => {
      const icon = field.validated ? '✅' : '⚠️';
      const value = field.field_value || '(empty)';
      console.log(`${icon} ${field.field_name}: "${value}" (${field.confidence_score}%)`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Check if critical fields are present
    const fields = response.data.extracted_fields;
    const dob = fields.find(f => f.field_name === 'Date of Birth');
    const gender = fields.find(f => f.field_name === 'Gender');
    const doi = fields.find(f => f.field_name === 'Date of Issue');
    const doe = fields.find(f => f.field_name === 'Date of Expiry');
    
    console.log('\n🔍 VERIFICATION:');
    console.log(dob?.field_value ? '✅ Date of Birth: EXTRACTED' : '❌ Date of Birth: MISSING');
    console.log(gender?.field_value ? '✅ Gender: EXTRACTED' : '❌ Gender: MISSING');
    console.log(doi?.field_value ? '✅ Date of Issue: EXTRACTED' : '❌ Date of Issue: MISSING');
    console.log(doe?.field_value ? '✅ Date of Expiry: EXTRACTED' : '❌ Date of Expiry: MISSING');
    
    const allCriticalFieldsPresent = dob?.field_value && gender?.field_value && doi?.field_value && doe?.field_value;
    
    if (allCriticalFieldsPresent) {
      console.log('\n🎉 ALL CRITICAL FIELDS SUCCESSFULLY EXTRACTED!');
    } else {
      console.log('\n⚠️  Some critical fields are missing');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if form-data is installed
try {
  require('form-data');
  testPassportUpload();
} catch (e) {
  console.error('❌ form-data module not found. Installing...');
  const { execSync } = require('child_process');
  console.log('Running: npm install form-data');
  execSync('npm install form-data', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Installed! Please run this script again.');
}
