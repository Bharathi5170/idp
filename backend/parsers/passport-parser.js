/**
 * Enhanced Passport Parser with robust field extraction
 * Prioritizes MRZ for names/numbers, text for dates and nationality
 */

function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/[|]/g, 'I')
    .replace(/[`']/g, '')
    .trim();
}

/**
 * Extract and validate MRZ lines from OCR text
 */
function extractMRZ(text) {
  const lines = text.split('\n').map(s => s.trim());
  const mrzLines = [];
  
  for (const line of lines) {
    const cleaned = line.replace(/\s/g, '').toUpperCase();
    
    // MRZ lines contain << and are typically 44 chars long
    if (cleaned.includes('<<') && cleaned.length >= 40 && cleaned.length <= 50) {
      // Apply OCR corrections for MRZ - be aggressive with number/letter substitution
      const normalized = cleaned
        .replace(/O/g, '0')  // Letter O to number 0
        .replace(/B/g, '8')  // Letter B to number 8
        .replace(/Z/g, '2')  // Letter Z to number 2
        .replace(/S/g, '5')  // Letter S to number 5
        .replace(/I/g, '1')  // Letter I to number 1
        .replace(/L/g, '<')  // Letter L to < (common in MRZ)
        .replace(/\|/g, '1'); // Pipe to 1
      
      mrzLines.push(normalized);
    }
  }
  
  return mrzLines;
}

/**
 * Parse MRZ according to ICAO 9303 standard
 */
function parseMRZ(mrzLines) {
  const data = {};
  
  if (mrzLines.length < 2) {
    console.log('Warning: Less than 2 MRZ lines found');
    return data;
  }
  
  const line1 = mrzLines[0];
  const line2 = mrzLines[1];
  
  console.log('MRZ Line 1 (normalized):', line1);
  console.log('MRZ Line 2 (normalized):', line2);
  
  // Line 1: P<ISSUING_COUNTRY<SURNAME<<GIVEN_NAMES
  if (line1.startsWith('P<') || line1.startsWith('P0')) {
    data.documentType = 'P';
    
    // Issuing country (positions 2-4)
    data.issuingCountry = line1.substring(2, 5).replace(/</g, '').replace(/0/g, 'O').trim();
    
    // Names section (from position 5)
    const namesSection = line1.substring(5);
    const nameParts = namesSection.split('<<');
    
    if (nameParts.length >= 1) {
      data.surname = nameParts[0].replace(/</g, ' ').replace(/0/g, 'O').replace(/1/g, 'I').trim();
    }
    if (nameParts.length >= 2) {
      data.givenNames = nameParts[1].replace(/</g, ' ').replace(/0/g, 'O').replace(/1/g, 'I').trim();
    }
  }
  
  // Line 2: PASSPORT_NUM<CHECK<NATIONALITY<DOB<CHECK<GENDER<EXPIRY<CHECK<OPTIONAL
  if (line2.length >= 44) {
    // Passport number (positions 0-8)
    const passportRaw = line2.substring(0, 9).replace(/</g, '');
    data.passportNumber = passportRaw.trim();
    
    // Nationality (positions 10-12)
    data.nationality = line2.substring(10, 13).replace(/</g, '').replace(/0/g, 'O').trim();
    
    // Date of birth (positions 13-18): YYMMDD
    const dobStr = line2.substring(13, 19);
    console.log('DOB raw from MRZ:', dobStr);
    if (dobStr.match(/^\d{6}$/)) {
      data.dateOfBirth = formatMRZDate(dobStr);
      console.log('DOB formatted:', data.dateOfBirth);
    } else {
      console.log('DOB does not match pattern, skipping');
    }
    
    // Gender (position 20)
    const genderChar = line2.charAt(20);
    console.log('Gender char from MRZ position 20:', genderChar);
    if (genderChar === 'M' || genderChar === 'F') {
      data.gender = genderChar === 'M' ? 'Male' : 'Female';
      console.log('Gender extracted:', data.gender);
    }
    
    // Date of expiry (positions 21-26): YYMMDD
    const doeStr = line2.substring(21, 27);
    console.log('DOE raw from MRZ:', doeStr);
    if (doeStr.match(/^\d{6}$/)) {
      data.dateOfExpiry = formatMRZDate(doeStr);
      console.log('DOE formatted:', data.dateOfExpiry);
    } else {
      console.log('DOE does not match pattern, skipping');
    }
  }
  
  return data;
}

/**
 * Convert MRZ date format (YYMMDD) to DD/MM/YYYY
 */
function formatMRZDate(mrzDate) {
  if (!mrzDate || mrzDate.length !== 6) return '';
  
  const yy = mrzDate.substring(0, 2);
  const mm = mrzDate.substring(2, 4);
  const dd = mrzDate.substring(4, 6);
  
  // Year logic: >50 = 19xx, <=50 = 20xx
  const year = parseInt(yy) > 50 ? '19' + yy : '20' + yy;
  
  return `${dd}/${mm}/${year}`;
}

/**
 * Extract dates from text with multiple format support
 */
function extractDateFromText(text, fieldName) {
  const lines = text.split('\n');
  
  // Pattern variations for different date formats
  const datePatterns = [
    // DD MMM YY format (e.g., "13 FEB 99", "01 JAN 21", with or without /XXX suffix)
    /(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:\s*\/\s*[A-Z]{3})?\s+\d{2,4})/i,
    // DD/MM/YYYY format
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    // DD-MM-YYYY format
    /(\d{2}\-\d{2}\-\d{4})/
  ];
  
  // Field-specific search terms with OCR variations
  const fieldTerms = {
    'dateOfBirth': /(?:Date\s+of\s+(?:birth|Brih|BrihvDate)|DOB|Oule\s+of\s+Brih)/i,
    'dateOfIssue': /(?:Date\s+of\s+(?:issue|sues|dedvrance)|Dute\s+of\s+sue)/i,
    'dateOfExpiry': /(?:Date\s+of\s+(?:expiry|coping|expivation|opin)|Valid\s+until|Dute\s+of\s+opin)/i
  };
  
  const searchTerm = fieldTerms[fieldName];
  if (!searchTerm) return '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line mentions the field
    if (searchTerm.test(line)) {
      // Search current and next few lines for date
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const searchLine = lines[j];
        
        for (const pattern of datePatterns) {
          const match = searchLine.match(pattern);
          if (match) {
            const dateStr = match[1].trim();
            // Convert to standard format
            return standardizeDate(dateStr);
          }
        }
      }
    }
  }
  
  return '';
}

/**
 * Convert various date formats to DD/MM/YYYY
 */
function standardizeDate(dateStr) {
  // Handle "DD MMM /XXX YY" format (e.g., "13 FEB /FEV 99" or "01 JAN /JAN 21")
  // Remove the second language part (e.g., /FEV, /JAN)
  dateStr = dateStr.replace(/\s*\/\s*[A-Z]{3}\s*/i, ' ');
  
  const monthMap = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  // Match "DD MMM YY" format
  const monthMatch = dateStr.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{2,4})/i);
  if (monthMatch) {
    const day = monthMatch[1].padStart(2, '0');
    const monthAbbr = monthMatch[2].toUpperCase().substring(0, 3);
    const month = monthMap[monthAbbr] || '01';
    let year = monthMatch[3];
    
    // Handle 2-digit year
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    
    return `${day}/${month}/${year}`;
  }
  
  // Already in DD/MM/YYYY or DD-MM-YYYY format
  if (dateStr.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
    return dateStr.replace(/-/g, '/');
  }
  
  return dateStr;
}

/**
 * Extract gender from text
 */
function extractGenderFromText(text) {
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for sex/gender field with OCR variations
    if (/(?:Sex|Gender|Sen\/Sene|Sen\/Sear)/i.test(line)) {
      // Check current and next 2 lines
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const searchLine = lines[j].trim().toUpperCase();
        
        // Look for standalone M or F
        if (searchLine === 'M' || /^M\s/.test(searchLine) || /\sM$/.test(searchLine)) {
          return 'Male';
        }
        if (searchLine === 'F' || /^F\s/.test(searchLine) || /\sF$/.test(searchLine)) {
          return 'Female';
        }
        
        // Also check for longer gender words
        if (searchLine.includes('MALE') && !searchLine.includes('FEMALE')) {
          return 'Male';
        }
        if (searchLine.includes('FEMALE')) {
          return 'Female';
        }
      }
    }
  }
  
  return '';
}

/**
 * Extract place of birth from text
 */
function extractPlaceOfBirth(text) {
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for place of birth field with OCR variations
    if (/(?:Place\s+of\s+birth|Pore\s+of\s+beth|Lioy\s+de\s+nadssance|Liew\s+de\s+nadtsacce)/i.test(line)) {
      // Check next line
      if (i + 1 < lines.length) {
        let nextLine = lines[i + 1].trim();
        
        // Remove leading gender marker if present (M or F at start)
        nextLine = nextLine.replace(/^[MF]\s+/, '');
        
        // If it looks like a place name (all caps, reasonable length)
        if (nextLine.match(/^[A-Z][A-Z\s,']{1,30}$/i) && nextLine.length >= 2) {
          return nextLine;
        }
      }
    }
  }
  
  return '';
}

/**
 * Extract other fields from text
 */
function extractFromText(text, fieldName) {
  const lines = text.split('\n');
  
  const patterns = {
    'surname': [
      /(?:Surname|Sur\s*name|Serna|Family\s*name|Nom)[:\s\/]*/i
    ],
    'givenNames': [
      /(?:Given\s+names?|Geven\s+nares|First\s+name|Frome)[:\s\/]*/i
    ],
    'passportNumber': [
      /(?:Passport\s+No\.?|Document\s+No\.?|Passepart\s+Ng)[:\s\/]*([A-Z0-9]{6,10})/i,
      /^([A-Z]\d{7}|[A-Z]{2}\d{6,8}|\d{8,9})$/
    ],
    'nationality': [
      /(?:Nationality|Nabonakty|Nations?|Naan|Country)[:\s\/]*/i,
      /^(BRITISH\s+CITIZEN|INDIAN|AMERICAN|CANADIAN|AUSTRALIAN)$/i,
      /^([A-Z]{3,20}\s+CITIZEN)$/i
    ]
  };
  
  if (!patterns[fieldName]) return '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const pattern of patterns[fieldName]) {
      const match = line.match(pattern);
      
      if (match) {
        // If we have a captured group, return it
        if (match[1]) {
          return match[1].trim();
        }
        
        // Otherwise, check the next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          
          // For names: look for all-caps words
          if (fieldName === 'surname' || fieldName === 'givenNames') {
            if (nextLine.match(/^[A-Z\s]{2,}$/) && nextLine.length < 40 && nextLine.length > 1) {
              return nextLine;
            }
          }
          
          // For nationality: be more flexible
          if (fieldName === 'nationality') {
            // Check if next line contains nationality keywords
            if (nextLine.match(/CITIZEN|NATIONAL/i)) {
              return nextLine;
            }
            // Or if it's all caps and reasonable length
            if (nextLine.match(/^[A-Z\s]{3,30}$/) && nextLine.length >= 3) {
              return nextLine;
            }
          }
          
          // For other fields, return the next line if it looks valid
          if (nextLine.length > 0 && nextLine.length < 30) {
            return nextLine;
          }
        }
      }
    }
  }
  
  // Special handling for nationality - search for common patterns anywhere in text
  if (fieldName === 'nationality') {
    for (const line of lines) {
      // Look for "BRITISH CITIZEN", "INDIAN", etc.
      if (line.match(/^(BRITISH\s+CITIZEN|INDIAN|AMERICAN|CANADIAN|AUSTRALIAN|FRENCH|GERMAN|ITALIAN|SPANISH|PORTUGUESE)$/i)) {
        return line.trim();
      }
    }
  }
  
  return '';
}

/**
 * Main parsing function
 */
function parse(ocr) {
  console.log('\n=== PASSPORT PARSER START ===');
  
  const text = normalizeText(ocr.text || '');
  console.log('Text length:', text.length, 'chars');
  
  // Step 1: Extract MRZ (PRIMARY SOURCE for names, passport number)
  const mrzLines = extractMRZ(text);
  console.log(`Found ${mrzLines.length} MRZ lines`);
  
  const mrzData = parseMRZ(mrzLines);
  console.log('MRZ Data Extracted:', JSON.stringify(mrzData, null, 2));
  
  // Step 2: Extract from text (FALLBACK/SUPPLEMENT)
  const textSurname = extractFromText(text, 'surname');
  const textGivenNames = extractFromText(text, 'givenNames');
  const textPassportNumber = extractFromText(text, 'passportNumber');
  const textNationality = extractFromText(text, 'nationality');
  const textDOB = extractDateFromText(text, 'dateOfBirth');
  const textDOI = extractDateFromText(text, 'dateOfIssue');
  const textDOE = extractDateFromText(text, 'dateOfExpiry');
  const textGender = extractGenderFromText(text);
  const textPlaceOfBirth = extractPlaceOfBirth(text);
  
  console.log('Text extraction results:');
  console.log('  Surname:', textSurname);
  console.log('  Given Names:', textGivenNames);
  console.log('  Passport #:', textPassportNumber);
  console.log('  Nationality:', textNationality);
  console.log('  DOB:', textDOB);
  console.log('  DOI:', textDOI);
  console.log('  DOE:', textDOE);
  console.log('  Gender:', textGender);
  console.log('  Place of Birth:', textPlaceOfBirth);
  
  // Step 3: Build fields array, prioritizing MRZ for names/numbers, text for dates
  const fields = [];
  
  // Surname - MRZ first
  const surname = mrzData.surname || textSurname;
  fields.push({
    field_name: 'Surname',
    field_value: surname,
    confidence_score: mrzData.surname ? 0.95 : (textSurname ? 0.85 : 0)
  });
  
  // Given Names - MRZ first
  const givenNames = mrzData.givenNames || textGivenNames;
  fields.push({
    field_name: 'Given Names',
    field_value: givenNames,
    confidence_score: mrzData.givenNames ? 0.95 : (textGivenNames ? 0.85 : 0)
  });
  
  // Passport Number - MRZ first
  const passportNumber = mrzData.passportNumber || textPassportNumber;
  fields.push({
    field_name: 'Passport Number',
    field_value: passportNumber,
    confidence_score: mrzData.passportNumber ? 0.98 : (textPassportNumber ? 0.85 : 0)
  });
  
  // Nationality - prefer text if it's more descriptive (e.g., "BRITISH CITIZEN" vs "GBR")
  let nationality;
  if (textNationality && (textNationality.includes('CITIZEN') || textNationality.length > 10)) {
    nationality = textNationality;
  } else {
    nationality = mrzData.nationality || textNationality;
  }
  fields.push({
    field_name: 'Nationality',
    field_value: nationality,
    confidence_score: (textNationality && textNationality.includes('CITIZEN')) ? 0.95 : (mrzData.nationality ? 0.95 : (textNationality ? 0.80 : 0))
  });
  
  // Date of Birth - prioritize text if found, otherwise MRZ
  const dateOfBirth = textDOB || mrzData.dateOfBirth;
  fields.push({
    field_name: 'Date of Birth',
    field_value: dateOfBirth,
    confidence_score: textDOB ? 0.90 : (mrzData.dateOfBirth ? 0.85 : 0)
  });
  
  // Gender - MRZ first, text fallback
  const gender = mrzData.gender || textGender;
  fields.push({
    field_name: 'Gender',
    field_value: gender,
    confidence_score: mrzData.gender ? 0.98 : (textGender ? 0.85 : 0)
  });
  
  // Date of Issue - Text only (not in MRZ)
  fields.push({
    field_name: 'Date of Issue',
    field_value: textDOI,
    confidence_score: textDOI ? 0.85 : 0
  });
  
  // Date of Expiry - prioritize text if found, otherwise MRZ
  const dateOfExpiry = textDOE || mrzData.dateOfExpiry;
  fields.push({
    field_name: 'Date of Expiry',
    field_value: dateOfExpiry,
    confidence_score: textDOE ? 0.90 : (mrzData.dateOfExpiry ? 0.85 : 0)
  });
  
  // Place of Birth - Text only
  if (textPlaceOfBirth) {
    fields.push({
      field_name: 'Place of Birth',
      field_value: textPlaceOfBirth,
      confidence_score: 0.80
    });
  }
  
  // MRZ lines are used internally for extraction but not exposed as form fields
  
  // Calculate overall confidence
  const validFields = fields.filter(f => 
    f.field_value && 
    f.field_value.length > 0
  );
  
  const essentialFields = fields.slice(0, 8);  // First 8 are core passport fields
  const essentialCount = essentialFields.filter(f => f.field_value && f.field_value.length > 0).length;
  const extractionRate = essentialCount / essentialFields.length;
  
  const avgConfidence = validFields.length > 0 
    ? validFields.reduce((sum, f) => sum + f.confidence_score, 0) / validFields.length
    : 0;
  
  const overallConfidence = avgConfidence * extractionRate;
  
  console.log(`Extracted ${essentialCount}/${essentialFields.length} essential fields`);
  console.log(`Extraction rate: ${(extractionRate * 100).toFixed(1)}%`);
  console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`Overall confidence: ${(overallConfidence * 100).toFixed(1)}%`);
  console.log('=== PASSPORT PARSER END ===\n');
  
  return {
    fields: fields,
    confidence_overall: overallConfidence,
    threshold: 0.70
  };
}

module.exports = { parse };
