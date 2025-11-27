const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { extractTextFromPDF } = require('./pdf-converter');

/**
 * Check if file is PDF
 */
function isPDF(inputPath) {
  return path.extname(inputPath).toLowerCase() === '.pdf';
}

/**
 * Preprocessing for general text documents (Aadhar, DL, Company Registry)
 * Note: PDFs are handled separately in runOCR, this function only processes images
 */
async function preprocessForGeneralText(inputPath) {
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, '_text_optimized.png');

  const metadata = await sharp(inputPath).metadata();
  
  // High-quality preprocessing for standard documents
  const targetWidth = 2400;  // Good resolution for text
  const scaleFactor = metadata.width < targetWidth ? targetWidth / metadata.width : 1;

  await sharp(inputPath)
    .resize(
      Math.round(metadata.width * scaleFactor),
      Math.round(metadata.height * scaleFactor),
      { kernel: sharp.kernel.lanczos3, fit: 'inside' }
    )
    .grayscale()
    .normalise()  // Auto-adjust contrast
    .sharpen({ sigma: 1.0 })
    .median(2)  // Light noise reduction
    .linear(1.1, -(128 * 0.1))  // Slight contrast boost
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Enhanced preprocessing for passport text
 * Note: PDFs are handled separately in runOCR, this function only processes images
 */
async function preprocessForPassportText(inputPath) {
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, '_text_optimized.png');

  const metadata = await sharp(inputPath).metadata();
  
  // Enhanced preprocessing for passport text
  const targetWidth = 3000;  // Higher resolution for better accuracy
  const scaleFactor = metadata.width < targetWidth ? targetWidth / metadata.width : 1;

  await sharp(inputPath)
    .resize(
      Math.round(metadata.width * scaleFactor),
      Math.round(metadata.height * scaleFactor),
      { kernel: sharp.kernel.lanczos3, fit: 'inside' }
    )
    .grayscale()
    .normalise()  // Auto-adjust contrast
    .sharpen({ sigma: 1.2 })  // Moderate sharpening
    .median(3)  // Noise reduction
    .linear(1.2, -(128 * 0.2))  // Slight contrast boost
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outputPath);

  return outputPath;
}
/**
 * Preprocessing for MRZ zones in passports
 * Note: PDFs are handled separately in runOCR, this function only processes images
 */
async function preprocessForMRZ(inputPath) {
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, '_mrz_zone.png');

  const metadata = await sharp(inputPath).metadata();
  
  // Extract bottom 30% of image (MRZ zone is typically at bottom)
  const cropHeight = Math.round(metadata.height * 0.30);
  const cropTop = metadata.height - cropHeight;
  
  // High-contrast preprocessing optimized for MRZ
  await sharp(inputPath)
    .extract({ left: 0, top: cropTop, width: metadata.width, height: cropHeight })
    .resize(3500, null, { kernel: sharp.kernel.lanczos3 })  // Very high resolution for MRZ
    .grayscale()
    .normalise()
    .sharpen({ sigma: 2.0 })
    .threshold(128)  // Binary thresholding for MRZ characters
    .median(3)  // Noise reduction
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(outputPath);

  return outputPath;
}

async function runSingleOCR(imagePath, config = {}) {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        // Optional: log progress
      }
    }
  });
  
  await worker.setParameters({
    tessedit_pageseg_mode: config.psm || '3',
    tessedit_char_whitelist: config.whitelist || ''
  });

  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  return {
    text: data.text,
    confidence: data.confidence
  };
}
/**
 * Main OCR function with document type optimization
 */
async function runOCR(imagePath, documentType = 'passport') {
  console.log('\n=== OCR PROCESSING START ===');
  console.log('Document type:', documentType);
  console.log('File path:', imagePath);
  const startTime = Date.now();
  
  try {
    // Handle PDFs directly by extracting text (no OCR needed)
    if (isPDF(imagePath)) {
      console.log('PDF detected - extracting text directly (no OCR needed)...');
      const result = await extractTextFromPDF(imagePath);
      const totalTime = Date.now() - startTime;
      console.log(`PDF text extraction completed in ${totalTime}ms`);
      console.log(`Text length: ${result.text.length} chars`);
      console.log(`Confidence: ${result.confidence}%`);
      console.log('=== OCR PROCESSING END ===\n');
      return result;
    }
    
    if (documentType === 'passport') {
      // Passport: Use specialized processing with MRZ extraction
      console.log('Using passport-optimized OCR with MRZ extraction...');
      
      // Pass 1: General text extraction
      console.log('Pass 1: Extracting general text...');
      const textPath = await preprocessForPassportText(imagePath);
      const textOCR = await runSingleOCR(textPath, { psm: '3' });
      console.log(`Text OCR completed in ${Date.now() - startTime}ms`);
      console.log(`Text confidence: ${textOCR.confidence.toFixed(1)}%`);
      
      // Pass 2: MRZ zone extraction
      console.log('Pass 2: Extracting MRZ zone...');
      const mrzStartTime = Date.now();
      const mrzPath = await preprocessForMRZ(imagePath);
      const mrzOCR = await runSingleOCR(mrzPath, { psm: '6' });
      console.log(`MRZ OCR completed in ${Date.now() - mrzStartTime}ms`);
      console.log(`MRZ confidence: ${mrzOCR.confidence.toFixed(1)}%`);
      
      // Pass 3: MRZ with single line mode
      console.log('Pass 3: Re-extracting MRZ with single line mode...');
      const mrz2StartTime = Date.now();
      const mrzOCR2 = await runSingleOCR(mrzPath, { psm: '7' });
      console.log(`MRZ alternate OCR completed in ${Date.now() - mrz2StartTime}ms`);
      console.log(`MRZ alternate confidence: ${mrzOCR2.confidence.toFixed(1)}%`);
      
      // Choose better MRZ result
      const bestMRZ = mrzOCR2.confidence > mrzOCR.confidence ? mrzOCR2 : mrzOCR;
      console.log(`Using MRZ with ${bestMRZ.confidence.toFixed(1)}% confidence`);
      
      // Combine results
      const combinedText = textOCR.text + '\n\n--- MRZ ZONE ---\n' + bestMRZ.text;
      
      // Cleanup (only delete if temp files were created)
      try {
        if (textPath !== imagePath && fs.existsSync(textPath)) fs.unlinkSync(textPath);
        if (mrzPath !== imagePath && fs.existsSync(mrzPath)) fs.unlinkSync(mrzPath);
        // Also clean up converted PDF files
        const convertedPDF = imagePath.replace(/\.(jpg|jpeg|png|tif|tiff)$/i, '.pdf').replace('.pdf', '_converted.png');
        if (fs.existsSync(convertedPDF) && convertedPDF !== imagePath) fs.unlinkSync(convertedPDF);
      } catch (err) {
        console.warn('Could not delete temp files:', err.message);
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`Total OCR time: ${totalTime}ms`);
      console.log(`Text length: ${combinedText.length} chars`);
      console.log(`Average confidence: ${((textOCR.confidence + bestMRZ.confidence) / 2).toFixed(1)}%`);
      console.log('=== OCR PROCESSING END ===\n');
      
      return {
        text: combinedText,
        confidence: (textOCR.confidence + bestMRZ.confidence) / 2
      };
      
    } else {
      // Aadhar / Driving License / Company Registry: Use general text processing (no MRZ)
      console.log(`Using general text OCR (optimized for ${documentType})...`);
      
      // Single-pass OCR with high quality preprocessing
      const textPath = await preprocessForGeneralText(imagePath);
      const result = await runSingleOCR(textPath, { psm: '3' });
      
      console.log(`OCR completed in ${Date.now() - startTime}ms`);
      console.log(`Confidence: ${result.confidence.toFixed(1)}%`);
      console.log(`Text length: ${result.text.length} chars`);
      
      // Cleanup (only delete if temp files were created)
      try {
        if (textPath !== imagePath && fs.existsSync(textPath)) fs.unlinkSync(textPath);
        // Also clean up converted PDF files
        const originalExt = path.extname(imagePath);
        if (imagePath.includes('_converted.png')) {
          fs.unlinkSync(imagePath); // Delete the converted PDF image
        }
      } catch (err) {
        console.warn('Could not delete temp files:', err.message);
      }
      
      console.log('=== OCR PROCESSING END ===\n');
      
      return result;
    }
    
  } catch (err) {
    console.error('OCR Error:', err);
    throw err;
  }
}

module.exports = { runOCR };