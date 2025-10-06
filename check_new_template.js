const mammoth = require('mammoth');

async function checkNewTemplate() {
  try {
    const result = await mammoth.extractRawText({
      path: './server/templates/BESS_Quote_Template_Fixed.docx'
    });
    
    console.log('New template content:');
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

checkNewTemplate();