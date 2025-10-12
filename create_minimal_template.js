const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

async function createMinimalTemplate() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "{PROJECT_NAME}",
              bold: true,
              size: 64,
              color: "1E40AF"
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Client: {CLIENT_NAME}",
              size: 44
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total Investment: {GRAND_CAPEX}",
              bold: true,
              size: 44,
              color: "059669"
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Annual Savings: {ANNUAL_SAVINGS}",
              bold: true,
              size: 44,
              color: "059669"
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "ROI: {ROI_YEARS} years",
              bold: true,
              size: 44,
              color: "7C3AED"
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('BESS_Quote_Template_Minimal.docx', buffer);
  console.log('✅ Template created successfully!');
}

createMinimalTemplate().catch(console.error);
