const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Extract text from PDF using pdf-parse
 * This is more reliable than image conversion since we get the actual text
 */
async function extractTextFromPDF(pdfPath) {
  console.log('Extracting text from PDF:', pdfPath);
  
  try {
    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse PDF
    const data = await pdfParse(dataBuffer);
    
    console.log(`PDF has ${data.numpages} page(s)`);
    console.log(`Extracted ${data.text.length} characters`);
    
    return {
      text: data.text,
      confidence: 95 // High confidence since we're extracting actual PDF text, not OCR
    };
    
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

module.exports = { extractTextFromPDF };
