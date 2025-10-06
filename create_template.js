const docx = require('docx');
const fs = require('fs');

// Create a new Word document with proper placeholders
const doc = new docx.Document({
  sections: [{
    properties: {},
    children: [
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "Battery Energy Storage System (BESS) Quote Template",
            bold: true,
            size: 32
          })
        ],
        spacing: { after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Prepared for: "),
          new docx.TextRun("{CLIENT_NAME}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Date: "),
          new docx.TextRun("{QUOTE_DATE}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Project: "),
          new docx.TextRun("{PROJECT_NAME}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "1. Executive Summary",
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 300, after: 200 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("This proposal provides a tailored Battery Energy Storage System (BESS) configuration.")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Key highlights:")
        ],
        spacing: { before: 200 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• System Size: "),
          new docx.TextRun("{SYSTEM_SIZE_KW} kW")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Battery Capacity: "),
          new docx.TextRun("{BATTERY_CAPACITY_KWH} kWh")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Total Cost: "),
          new docx.TextRun("{TOTAL_COST}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Annual Savings: "),
          new docx.TextRun("{ANNUAL_SAVINGS}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• ROI Period: "),
          new docx.TextRun("{ROI_YEARS} years")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "2. Proposed Configuration & Costs",
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 300, after: 200 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("BESS Configuration: "),
          new docx.TextRun("{BATTERY_CAPACITY_KWH} kWh LFP + {SYSTEM_SIZE_KW} kW PCS")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("System Cost: "),
          new docx.TextRun("{SYSTEM_COST}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Installation Cost: "),
          new docx.TextRun("{INSTALLATION_COST}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Total Cost (ex-VAT): "),
          new docx.TextRun("{TOTAL_COST}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Grand CapEx: "),
          new docx.TextRun("{GRAND_CAPEX}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "3. ROI & Financials",
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 300, after: 200 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Annual Savings: "),
          new docx.TextRun("{ANNUAL_SAVINGS}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Payback Period: "),
          new docx.TextRun("{ROI_YEARS} years")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("Budget Delta: "),
          new docx.TextRun("{BUDGET_DELTA}")
        ]
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "4. Summary",
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 300, after: 200 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("This Battery Energy Storage System provides an optimal solution for your energy requirements with a strong return on investment.")
        ]
      })
    ]
  }]
});

// Generate and save the document
docx.Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('./server/templates/BESS_Quote_Template_Fixed.docx', buffer);
  console.log('Created new template with proper placeholders: BESS_Quote_Template_Fixed.docx');
});