const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

const WORD_TEMPLATE_PATH = path.join(__dirname, 'server/templates', 'BESS_Quote_Template_Fixed.docx');

console.log('Template path:', WORD_TEMPLATE_PATH);
console.log('Template exists:', fs.existsSync(WORD_TEMPLATE_PATH));

try {
  const content = fs.readFileSync(WORD_TEMPLATE_PATH, 'binary');
  console.log('Template loaded, size:', content.length);
  
  const zip = new PizZip(content);
  console.log('PizZip created successfully');
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  console.log('Docxtemplater created successfully');
  
  // Test with sample data
  const testData = {
    PROJECT_NAME: 'Test Project',
    CLIENT_NAME: 'Test Client',
    QUOTE_DATE: '2025-10-06',
    SYSTEM_SIZE_KW: '5000',
    TOTAL_COST: '$1,000,000'
  };
  
  doc.render(testData);
  console.log('Template rendered successfully');
  
  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  
  fs.writeFileSync('test_output.docx', buf);
  console.log('Test document created successfully: test_output.docx');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}