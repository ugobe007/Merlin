const mammoth = require('mammoth');
const fs = require('fs');

async function extractTemplateText() {
  try {
    const result = await mammoth.extractRawText({
      path: './server/templates/BESS_Quote_Template.docx'
    });
    
    console.log('Template content:');
    console.log(result.value);
    
    // Look for placeholders
    const placeholders = result.value.match(/\{[^}]+\}/g);
    if (placeholders) {
      console.log('\nFound placeholders:');
      [...new Set(placeholders)].forEach(p => console.log(p));
    } else {
      console.log('\nNo placeholders found in template');
    }
  } catch (error) {
    console.error('Error extracting template:', error);
  }
}

extractTemplateText();