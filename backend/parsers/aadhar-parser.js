/**
 * Enhanced Aadhar Card Parser - Extracts all fields from Aadhar cards
 * Handles both old and new Aadhar card formats
 */

function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/[|]/g, 'I')
    .replace(/[`']/g, '')
    .trim();
}

/**
 * Extract Aadhaar number (12 digits, may be space-separated)
 */
function extractAadhaarNumber(text) {
  const lines = text.split('\n');
  
  console.log('Searching for Aadhaar number...');
  
  // Pattern 1: 12 digits with spaces (XXXX XXXX XXXX)
  for (const line of lines) {
    const match = line.match(/(\d{4}\s+\d{4}\s+\d{4})/);
    if (match) {
      console.log('Found Aadhaar with spaces:', match[1]);
      return match[1];
    }
  }
  
  // Pattern 2: 12 consecutive digits
  for (const line of lines) {
    const match = line.match(/(\d{12})/);
    if (match) {
      console.log('Found Aadhaar consecutive:', match[1]);
      // Format with spaces
      const num = match[1];
      return `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)}`;
    }
  }
  
  // Pattern 3: Look for digits near Aadhaar/UIDAI keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/aadhaar|aadhar|uidai|uid/i)) {
      // Check next few lines for 12 digits
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const checkLine = lines[j];
        const match = checkLine.match(/(\d{4}\s+\d{4}\s+\d{4})|(\d{12})/);
        if (match) {
          const num = match[1] || match[2];
          console.log('Found Aadhaar near keyword:', num);
          if (num.includes(' ')) {
            return num;
          } else {
            return `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)}`;
          }
        }
      }
    }
  }
  
  console.log('Aadhaar number not found');
  return '';
}

/**
 * Extract name from Aadhar card
 */
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim());
  
  // Skip common header lines
  const skipPatterns = /government|india|uidai|भारत|आधार|aadhar|aadhaar|unique|identification|authority/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty, too short, or header lines
    if (line.length < 3 || skipPatterns.test(line)) continue;
    
    // Look for name patterns: All caps, reasonable length, mostly letters
    if (line.match(/^[A-Z][A-Z\s]{2,40}$/)) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      
      // Check if next line looks like father's name pattern
      if (nextLine.match(/^[A-Z][A-Z\s]{2,40}$/) && !nextLine.match(/\d/)) {
        console.log('Found name:', line);
        return line;
      }
      
      // Or if current line is before DOB/gender info
      if (i + 1 < lines.length && (
        nextLine.match(/male|female|dob|birth|year/i) ||
        nextLine.match(/\d{2}\/\d{2}\/\d{4}/)
      )) {
        console.log('Found name before DOB/Gender:', line);
        return line;
      }
    }
  }
  
  return '';
}
/**
 * Extract father's name from Aadhar card
 */
function extractFatherName(text) {
  const lines = text.split('\n').map(l => l.trim());
  
  let allFatherNames = [];
  
  // Look for ALL S/O, D/O, C/O patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 1: S/O: followed by name
    const match1 = line.match(/(?:S\/O|D\/O|C\/O)[:\s]+(.+?)(?:,|$)/i);
    if (match1) {
      const potentialName = match1[1].trim();
      console.log('Found S/O pattern:', potentialName);
      
      // Clean up the name
      const cleaned = potentialName
        .replace(/,\s*-\s*,/g, '') // Remove ", -, " patterns
        .replace(/-+/g, '') // Remove dashes
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      if (cleaned.length > 3) {
        allFatherNames.push({
          name: cleaned,
          line: i,
          length: cleaned.length
        });
      }
    }
    
    // Pattern 2: Look for "Sri" or "Shri" which often precedes father's name
    const match2 = line.match(/(?:Sri|Shri)\s+([A-Z][A-Za-z\s]{5,50})/i);
    if (match2) {
      const potentialName = match2[1].trim();
      console.log('Found Sri pattern:', potentialName);
      
      const cleaned = potentialName
        .replace(/,.*$/, '') // Remove everything after comma
        .trim();
      
      if (cleaned.length > 5 && cleaned.split(/\s+/).length >= 2) {
        allFatherNames.push({
          name: cleaned,
          line: i,
          length: cleaned.length
        });
      }
    }
  }
  
  if (allFatherNames.length > 0) {
    // Take the LONGEST name (usually the most complete/correct one)
    allFatherNames.sort((a, b) => b.length - a.length);
    const bestName = allFatherNames[0].name;
    console.log('Selected best father name:', bestName);
    return bestName;
  }
  
  // Fallback: Look for "Father" keyword
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/father|पिता/i)) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (nextLine.match(/^[A-Z][A-Z\s]{5,40}$/)) {
        console.log('Found father name after keyword:', nextLine);
        return nextLine;
      }
    }
  }
  
  console.log('Father name not found');
  return '';
}

/**
 * Extract Date of Birth
 */
function extractDOB(text) {
  const lines = text.split('\n');
  
  console.log('Searching for DOB...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 1: DOB with label and date on same line
    const match1 = line.match(/(?:DOB|Date\s+of\s+Birth|जन्म.*?तिथि|Birth)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (match1) {
      console.log('Found DOB with label:', match1[1]);
      return match1[1];
    }
    
    // Pattern 2: Year of Birth
    const match2 = line.match(/(?:Year\s+of\s+Birth|YOB)[:\s]*(\d{4})/i);
    if (match2) {
      console.log('Found Year of Birth:', match2[1]);
      return match2[1];
    }
    
    // Pattern 3: Look for DOB label, then check next line
    if (line.match(/DOB|Date\s+of\s+Birth|जन्म|Birth/i)) {
      console.log('Found DOB label at line', i);
      
      // Check current line for date
      const dateMatch1 = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
      if (dateMatch1) {
        console.log('Found DOB in same line:', dateMatch1[1]);
        return dateMatch1[1];
      }
      
      // Check next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const dateMatch2 = nextLine.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
        if (dateMatch2) {
          console.log('Found DOB in next line:', dateMatch2[1]);
          return dateMatch2[1];
        }
        
        // Check for year only
        const yearMatch = nextLine.match(/^(\d{4})$/);
        if (yearMatch) {
          console.log('Found year in next line:', yearMatch[1]);
          return yearMatch[1];
        }
      }
    }
  }
  
  // Pattern 4: Look for any DD/MM/YYYY pattern (as fallback)
  for (const line of lines) {
    // Skip lines with other numbers
    if (!line.match(/aadhaar|male|female|address|pin/i)) {
      const match = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
      if (match) {
        console.log('Found standalone date:', match[1]);
        return match[1];
      }
    }
  }
  
  console.log('DOB not found');
  return '';
}

/**
 * Extract Gender with improved patterns
 */
function extractGender(text) {
  const lines = text.split('\n');
  
  console.log('Searching for gender in text...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    // Look for gender keywords or labels
    if (line.match(/SEX|GENDER|लिंग/i)) {
      console.log('Found gender label at line', i, ':', line);
      
      // Check current line for M/F
      if (line.includes(' M') || line.includes('M ') || line.includes('/M') || line.endsWith('M')) {
        console.log('Found Male in same line');
        return 'Male';
      }
      if (line.includes(' F') || line.includes('F ') || line.includes('/F') || line.endsWith('F')) {
        console.log('Found Female in same line');
        return 'Female';
      }
      
      // Check next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim().toUpperCase();
        console.log('Checking next line:', nextLine);
        
        if (nextLine === 'M' || nextLine === 'MALE' || nextLine.includes('MALE')) {
          console.log('Found Male in next line');
          return 'Male';
        }
        if (nextLine === 'F' || nextLine === 'FEMALE' || nextLine.includes('FEMALE')) {
          console.log('Found Female in next line');
          return 'Female';
        }
      }
    }
    
    // Direct match for MALE/FEMALE
    if (line === 'MALE' || line === 'M') {
      console.log('Found standalone Male');
      return 'Male';
    }
    if (line === 'FEMALE' || line === 'F') {
      console.log('Found standalone Female');
      return 'Female';
    }
    
    // Match within line with word boundaries
    if (line.match(/\bMALE\b/) && !line.match(/FEMALE/)) {
      console.log('Found Male with word boundary');
      return 'Male';
    }
    if (line.match(/\bFEMALE\b/)) {
      console.log('Found Female with word boundary');
      return 'Female';
    }
  }
  
  console.log('Gender not found in text');
  return '';
}
/**
 * Extract Address
 */
function extractAddress(text) {
  const lines = text.split('\n').map(l => l.trim());
  
  console.log('Searching for address...');
  
  // Helper function to check if a line is OCR garbage/noise
  function isGarbageLine(line) {
    // Too short
    if (line.length < 5) return true;
    
    // Contains mostly special characters or random symbols
    if (line.match(/^[^a-zA-Z0-9\s]{3,}/)) return true;
    
    // Has patterns like "=H", "9%Y", "ZZ)", which are OCR errors
    if (line.match(/[=][A-Z]|[0-9]%[A-Z]|[A-Z]{2}\)/)) return true;
    
    // Contains Hindi/other script mixed with random chars (OCR confusion)
    if (line.match(/[^\x00-\x7F]{3,}.*[,\s-]{3,}/)) return true;
    
    // Pattern of random lowercase letters with excessive punctuation: "ars", "suas", "areEmT"
    // But allow if it contains proper address markers like numbers, "ward", "nagar", etc.
    if (line.match(/\b[a-z]{2,4}\s[a-z]{2,4}\s[a-z]{2,4}\b/i)) {
      // Check if it has valid address indicators
      const hasValidAddress = line.match(/\d+|ward|nagar|ganj|road|street|village|district|city|town/i);
      if (!hasValidAddress) {
        return true;
      }
    }
    
    return false;
  }
  
  // Helper function to clean garbage from address text
  function cleanAddressGarbage(address) {
    // Remove patterns like "Rasher areEmT suas, ars" from the beginning
    // Pattern: random lowercase words followed by comma, before actual address
    address = address.replace(/^([a-z]{3,8}\s+[a-z]{3,8}\s+[a-z]{3,8}[,\s]+){1,2}/i, '');
    
    // Remove standalone random lowercase sequences (including single ones)
    address = address.replace(/\b[a-z]{2,4}\s+[a-z]{2,4}\s+[a-z]{2,4}\b[,\s]*/gi, ' ');
    
    // Remove single random 2-4 letter lowercase words at the beginning before uppercase words
    address = address.replace(/^[a-z]{2,4}\s+(?=[A-Z])/i, '');
    
    // Remove standalone short lowercase words followed by uppercase (like "ars SHIVAJI")
    address = address.replace(/\b[a-z]{2,4}\s+(?=[A-Z]{2,})/g, '');
    
    // Clean up multiple spaces and commas
    address = address.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
    
    // Remove leading/trailing commas and spaces
    address = address.replace(/^[,\s]+|[,\s]+$/g, '');
    
    return address;
  }
  
  // Pattern 1: Look for "Address:" label
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Address keyword on its own line or with "gar:" prefix
    if (line.match(/(?:gar:\s*)?(?:Address|पता)[:\s]*$/i)) {
      console.log('Found address label at line', i);
      // Collect next few lines as address, but SKIP S/O lines and garbage
      const addressLines = [];
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const addrLine = lines[j];
        
        // Stop at PIN code, empty line, or other field markers
        if (!addrLine || addrLine.match(/^\d{6}$/) || addrLine.match(/^(?:PIN|State|Help|VID)/i)) {
          break;
        }
        
        // SKIP lines with S/O, D/O, C/O (father/mother name lines)
        if (addrLine.match(/^(?:S\/O|D\/O|C\/O)[:\s]/i)) {
          console.log('Skipping S/O line:', addrLine);
          continue;
        }
        
        // SKIP OCR garbage lines
        if (isGarbageLine(addrLine)) {
          console.log('Skipping garbage line:', addrLine);
          continue;
        }
        
        // Collect valid address lines
        if (addrLine.length > 5 && addrLine.length < 150) {
          addressLines.push(addrLine);
        }
      }
      
      if (addressLines.length > 0) {
        let address = addressLines.join(', ');
        
        // Remove PIN code from address if present
        address = address.replace(/,?\s*\d{6}\s*[,\s]*/g, ', ').replace(/,\s*,/g, ', ').trim();
        if (address.endsWith(',')) address = address.slice(0, -1);
        
        // Clean OCR garbage from address
        address = cleanAddressGarbage(address);
        
        console.log('Found address after label:', address);
        return address;
      }
    }
    
    // Address with content on same line (but not S/O line)
    const match = line.match(/^(?:Address|पता)[:\s]+(.+)$/i);
    if (match && match[1].length > 10 && !match[1].match(/^S\/O/i)) {
      console.log('Found address on same line:', match[1]);
      return match[1];
    }
  }
  
  // Pattern 2: Look for address-like content before PIN code
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Found a line with 6 digits (likely PIN)
    if (line.match(/\b\d{6}\b/) && i > 2) {
      console.log('Found potential PIN at line', i, '- looking backwards for address');
      const addressLines = [];
      
      // Go back and collect address lines (skip S/O lines and garbage)
      for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
        const addrLine = lines[j];
        
        // Skip header/irrelevant lines
        if (addrLine.match(/government|india|uidai|aadhar|dob|birth|male|female|year|^address/i)) {
          break;
        }
        
        // SKIP S/O, D/O, C/O lines
        if (addrLine.match(/^(?:S\/O|D\/O|C\/O)[:\s]/i)) {
          console.log('Skipping S/O line in backward search:', addrLine);
          continue;
        }
        
        // SKIP OCR garbage lines
        if (isGarbageLine(addrLine)) {
          console.log('Skipping garbage line in backward search:', addrLine);
          continue;
        }
        
        // Collect lines that look like address parts
        if (addrLine.length > 10 && addrLine.length < 150) {
          addressLines.unshift(addrLine);
        }
      }
      
      if (addressLines.length > 0) {
        let address = addressLines.join(', ');
        
        // Remove PIN code from address if present
        address = address.replace(/,?\s*\d{6}\s*[,\s]*/g, ', ').replace(/,\s*,/g, ', ').trim();
        if (address.endsWith(',')) address = address.slice(0, -1);
        
        // Clean OCR garbage from address
        address = cleanAddressGarbage(address);
        
        console.log('Found address before PIN:', address);
        return address;
      }
    }
  }
  
  console.log('Address not found');
  return '';
}

/**
 * Extract PIN Code
 */
function extractPIN(text) {
  const lines = text.split('\n');
  
  console.log('Searching for PIN code...');
  
  // Pattern 1: Look for PIN keyword with number
  for (const line of lines) {
    const match = line.match(/(?:PIN|Pincode|Pin\s*Code)[:\s]*(\d{6})/i);
    if (match) {
      console.log('Found PIN with label:', match[1]);
      return match[1];
    }
  }
  
  // Pattern 2: Look for standalone 6-digit number (not part of Aadhaar)
  for (const line of lines) {
    // Skip if line contains Aadhaar patterns
    if (line.match(/\d{4}\s+\d{4}/) || line.match(/aadhaar|aadhar/i)) {
      continue;
    }
    
    // Look for 6 digits with word boundaries
    const match = line.match(/\b(\d{6})\b/);
    if (match) {
      const pin = match[1];
      console.log('Found standalone 6-digit PIN:', pin);
      return pin;
    }
  }
  
  // Pattern 3: Look near address or at end of address
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/address|पता/i)) {
      // Check next few lines for 6 digits
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const checkLine = lines[j];
        const match = checkLine.match(/(\d{6})/);
        if (match && !checkLine.match(/\d{4}\s+\d{4}/)) {
          console.log('Found PIN near address:', match[1]);
          return match[1];
        }
      }
    }
  }
  
  console.log('PIN code not found');
  return '';
}

/**
 * Extract State
 */
function extractState(text) {
  const statePatterns = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
  ];
  
  const textUpper = text.toUpperCase();
  
  for (const state of statePatterns) {
    if (textUpper.includes(state.toUpperCase())) {
      console.log('Found state:', state);
      return state;
    }
  }
  
  return '';
}
/**
 * Main parsing function
 */
function parse(ocr) {
  console.log('\n=== AADHAR PARSER START ===');
  
  const text = normalizeText(ocr.text || '');
  console.log('Text length:', text.length, 'chars');
  console.log('Sample text (first 500 chars):', text.substring(0, 500));
  
  const fields = [];
  
  // Extract all fields
  const name = extractName(text);
  console.log('Extracted name:', name);
  fields.push({
    field_name: 'Name',
    field_value: name,
    confidence_score: name ? 0.90 : 0
  });
  
  const fatherName = extractFatherName(text);
  console.log('Extracted father name:', fatherName);
  fields.push({
    field_name: 'Father Name',
    field_value: fatherName,
    confidence_score: fatherName ? 0.85 : 0
  });
  
  const dob = extractDOB(text);
  console.log('Extracted DOB:', dob);
  fields.push({
    field_name: 'Date of Birth',
    field_value: dob,
    confidence_score: dob ? 0.90 : 0
  });
  
  const gender = extractGender(text);
  console.log('Extracted gender:', gender);
  fields.push({
    field_name: 'Gender',
    field_value: gender,
    confidence_score: gender ? 0.95 : 0
  });
  
  const aadhaarNumber = extractAadhaarNumber(text);
  console.log('Extracted Aadhaar:', aadhaarNumber);
  fields.push({
    field_name: 'Aadhaar Number',
    field_value: aadhaarNumber,
    confidence_score: aadhaarNumber ? 0.98 : 0
  });
  
  const address = extractAddress(text);
  console.log('Extracted address:', address);
  fields.push({
    field_name: 'Address',
    field_value: address,
    confidence_score: address ? 0.80 : 0
  });
  
  const pin = extractPIN(text);
  console.log('Extracted PIN:', pin);
  fields.push({
    field_name: 'PIN Code',
    field_value: pin,
    confidence_score: pin ? 0.90 : 0
  });
  
  const state = extractState(text);
  console.log('Extracted state:', state);
  fields.push({
    field_name: 'State',
    field_value: state,
    confidence_score: state ? 0.85 : 0
  });
  
  // Calculate overall confidence
  const validFields = fields.filter(f => f.field_value && f.field_value.length > 0);
  const essentialFields = fields.slice(0, 5); // Name, Father, DOB, Gender, Aadhaar
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
  console.log('=== AADHAR PARSER END ===\n');
  
  return {
    fields: fields,
    confidence_overall: overallConfidence,
    threshold: 0.70
  };
}

module.exports = { parse };