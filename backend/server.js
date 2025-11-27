const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Import parsers
const passportParser = require('./parsers/passport-parser');
const aadharParser = require('./parsers/aadhar-parser');
const { runOCR } = require('./utils/ocr');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS = path.join(__dirname, 'uploads');
const ARCHIVE = path.join(__dirname, 'archive');
[UPLOADS, ARCHIVE].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const id = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, id + '-' + file.originalname.replace(/\s+/g,'_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('=== NEW UPLOAD REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : 'NO FILE');
    
    const docType = req.body.documentType;
    const consent = req.body.consent === 'true' || req.body.consent === true;
    
    console.log('Document Type:', docType);
    console.log('Consent:', consent);
    
    if (!docType) return res.status(400).json({ error: 'documentType required' });
    if (!consent) return res.status(400).json({ error: 'consent required' });
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const allowed = ['.png','.jpg','.jpeg','.pdf','.tif','.tiff'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return res.status(400).json({ error: 'unsupported file format' });

    // Archive original (immutable copy)
    const archiveName = uuidv4() + '-' + req.file.originalname.replace(/\s+/g,'_');
    const archivePath = path.join(ARCHIVE, archiveName);
    fs.copyFileSync(req.file.path, archivePath);
    try { fs.chmodSync(archivePath, 0o444); } catch(e){ /* best-effort */ }

    // Run OCR with document type for optimization
    console.log('Starting OCR for document type:', docType);
    const ocr = await runOCR(req.file.path, docType);
    console.log('OCR completed. Text length:', ocr.text?.length || 0);

    // Parse according to selected type
    console.log('Parsing as:', docType);
    let parsed;
    if (docType === 'passport') parsed = passportParser.parse(ocr);
    else if (docType === 'aadhar') parsed = aadharParser.parse(ocr);
    else return res.status(400).json({ error: 'unknown document type' });

    console.log('Parsing completed. Confidence:', parsed.confidence_overall);
    
    const threshold = 0.75;
    const status = parsed.confidence_overall >= threshold ? 'success' : 'failed';
    const documentId = `doc-${Date.now()}${Math.random().toString(36).substring(7)}`;

    // Format fields for frontend display
    const extractedFields = parsed.fields.map(field => ({
      field_name: field.field_name,
      field_value: field.field_value || '',
      confidence_score: Math.round((field.confidence_score || 0) * 100),
      validated: (field.confidence_score || 0) >= 0.8
    }));

    const processingTime = Date.now() - startTime;

    return res.json({
      document_id: documentId,
      document_type: docType,
      status: status,
      overall_confidence: Math.round(parsed.confidence_overall * 100),
      processing_time_ms: processingTime,
      extracted_fields: extractedFields,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'internal server error', details: err.message });
  }
});

// Get list of uploaded documents
app.get('/api/documents', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS);
    const documents = files.map(filename => {
      const filePath = path.join(UPLOADS, filename);
      const stats = fs.statSync(filePath);
      
      const docType = filename.includes('passport') ? 'passport' :
                      filename.includes('aadhar') ? 'aadhar' : 'unknown';
      
      return {
        filename: filename,
        docType: docType,
        uploadDate: stats.mtime,
        size: stats.size
      };
    }).sort((a, b) => b.uploadDate - a.uploadDate);
    
    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to list documents' });
  }
});

// Get a specific document
app.get('/api/documents/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'document not found' });
    }
    
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to retrieve document' });
  }
});

// Delete a document
app.delete('/api/documents/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'document not found' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ message: 'document deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to delete document' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Document Processor Backend Started');
  console.log('========================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`Documents endpoint: http://localhost:${PORT}/api/documents`);
  console.log('========================================');
});
