const docx = require('docx');
const fs = require('fs');

// Create a comprehensive BESS quote template with tables and image placeholders
const doc = new docx.Document({
  styles: {
    default: {
      document: {
        run: {
          font: "Helvetica",
          size: 22
        },
        paragraph: {
          spacing: { line: 240 }
        }
      }
    },
    paragraphStyles: [
      {
        id: "heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Helvetica",
          size: 32,
          bold: true,
          color: "2E3B82"
        },
        paragraph: {
          spacing: { after: 300, before: 200 }
        }
      },
      {
        id: "heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Helvetica",
          size: 24,
          bold: true,
          color: "4F46E5"
        },
        paragraph: {
          spacing: { after: 200, before: 300 }
        }
      },
      {
        id: "heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Helvetica",
          size: 20,
          bold: true,
          color: "6366F1"
        },
        paragraph: {
          spacing: { after: 150, before: 200 }
        }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1440, // 1 inch
          right: 1440,
          bottom: 1440,
          left: 1440
        }
      }
    },
    children: [
      // Header with Logo - using table for layout
      new docx.Table({
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: "BATTERY ENERGY STORAGE SYSTEM",
                        font: "Helvetica",
                        bold: true,
                        size: 36,
                        color: "1E40AF"
                      })
                    ],
                    alignment: docx.AlignmentType.LEFT
                  }),
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: "COMMERCIAL QUOTE PROPOSAL",
                        font: "Helvetica",
                        bold: true,
                        size: 24,
                        color: "3B82F6"
                      })
                    ],
                    alignment: docx.AlignmentType.LEFT,
                    spacing: { after: 200 }
                  })
                ],
                width: { size: 70, type: docx.WidthType.PERCENTAGE },
                borders: {
                  top: { style: docx.BorderStyle.NONE },
                  bottom: { style: docx.BorderStyle.NONE },
                  left: { style: docx.BorderStyle.NONE },
                  right: { style: docx.BorderStyle.NONE }
                }
              }),
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: "🧙‍♂️ MERLIN",
                        font: "Helvetica",
                        bold: true,
                        size: 28,
                        color: "7C3AED"
                      })
                    ],
                    alignment: docx.AlignmentType.RIGHT,
                    spacing: { before: 100, after: 100 }
                  }),
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: "[MERLIN_LOGO_PLACEHOLDER]",
                        font: "Helvetica",
                        italics: true,
                        size: 16,
                        color: "6B7280"
                      })
                    ],
                    alignment: docx.AlignmentType.RIGHT
                  })
                ],
                width: { size: 30, type: docx.WidthType.PERCENTAGE },
                borders: {
                  top: { style: docx.BorderStyle.NONE },
                  bottom: { style: docx.BorderStyle.NONE },
                  left: { style: docx.BorderStyle.NONE },
                  right: { style: docx.BorderStyle.NONE }
                }
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Spacing after header
      new docx.Paragraph({
        children: [new docx.TextRun("")],
        spacing: { after: 400 }
      }),
      
      // Client Information Section
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "PROJECT INFORMATION",
            font: "Helvetica",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { after: 200 }
      }),
      
      new docx.Table({
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Client Name:", bold: true, font: "Helvetica" })] })],
                width: { size: 30, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{CLIENT_NAME}", font: "Helvetica" })] })],
                width: { size: 70, type: docx.WidthType.PERCENTAGE }
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Project Name:", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{PROJECT_NAME}", font: "Helvetica" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Quote Date:", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{QUOTE_DATE}", font: "Helvetica" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Location:", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{LOCATION_REGION}", font: "Helvetica" })] })]
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Executive Summary
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "1. EXECUTIVE SUMMARY",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.")
        ],
        spacing: { after: 200 }
      }),
      
      // Key Highlights Table
      new docx.Table({
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "METRIC", bold: true, color: "FFFFFF", font: "Helvetica" })] })],
                width: { size: 40, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "1E40AF" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "VALUE", bold: true, color: "FFFFFF", font: "Helvetica" })] })],
                width: { size: 60, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "1E40AF" }
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "System Capacity", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{BATTERY_CAPACITY_KWH} kWh")] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Power Rating", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{SYSTEM_SIZE_KW} kW")] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Total Investment", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{GRAND_CAPEX}", bold: true, size: 24, color: "059669", font: "Helvetica" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Annual Savings", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{ANNUAL_SAVINGS}", bold: true, size: 24, color: "059669", font: "Helvetica" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Payback Period", bold: true, font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{ROI_YEARS} years", bold: true, size: 20, color: "7C3AED", font: "Helvetica" })] })]
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Project Overview & Images Section
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "2. PROJECT OVERVIEW & VISUALIZATION",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("The proposed BESS installation will integrate seamlessly with your existing infrastructure to provide reliable energy storage, peak shaving, and grid stabilization capabilities.")
        ],
        spacing: { after: 300 }
      }),
      
      // Image Placeholder Section
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "Project Site Layout & Configuration:",
            bold: true,
            size: 16
          })
        ],
        spacing: { after: 200 }
      }),
      
      new docx.Table({
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [new docx.TextRun({ text: "📷 PROJECT SITE PHOTO", bold: true, size: 16, font: "Helvetica" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { before: 400, after: 400 }
                  }),
                  new docx.Paragraph({
                    children: [new docx.TextRun({ text: "[Insert aerial or ground-level photo of installation site]", italics: true, font: "Helvetica" })],
                    alignment: docx.AlignmentType.CENTER
                  })
                ],
                width: { size: 50, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "F1F5F9" },
                margins: { top: 200, bottom: 200, left: 200, right: 200 }
              }),
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [new docx.TextRun({ text: "🔧 SYSTEM DIAGRAM", bold: true, size: 16, font: "Helvetica" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { before: 400, after: 400 }
                  }),
                  new docx.Paragraph({
                    children: [new docx.TextRun({ text: "[Insert technical diagram showing BESS configuration and connections]", italics: true, font: "Helvetica" })],
                    alignment: docx.AlignmentType.CENTER
                  })
                ],
                width: { size: 50, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "F1F5F9" },
                margins: { top: 200, bottom: 200, left: 200, right: 200 }
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Technical Specifications
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "3. TECHNICAL SPECIFICATIONS & PRICING",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      // Main Pricing Table
      new docx.Table({
        rows: [
          // Header Row
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "COMPONENT", bold: true, color: "FFFFFF", font: "Helvetica" })] })],
                width: { size: 35, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "1E40AF" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "SPECIFICATION", bold: true, color: "FFFFFF", font: "Helvetica" })] })],
                width: { size: 35, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "1E40AF" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "COST (USD)", bold: true, color: "FFFFFF", font: "Helvetica" })] })],
                width: { size: 30, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "1E40AF" }
              })
            ]
          }),
          
          // BESS Components
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Battery System", bold: true })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{BATTERY_CAPACITY_KWH} kWh LFP Chemistry")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{BATTERY_SUBTOTAL}", bold: true })] })]
              })
            ]
          }),
          
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Power Conversion", bold: true })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{PCS_KW} kW Bi-directional Inverter")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{PCS_SUBTOTAL}", bold: true })] })]
              })
            ]
          }),
          
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Balance of System", bold: true })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("Enclosures, Cabling, Protection")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{BOS}", bold: true })] })]
              })
            ]
          }),
          
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Engineering & Installation", bold: true })] })],
                shading: { fill: "F8FAFC" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("EPC Services, Commissioning")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{EPC}", bold: true })] })]
              })
            ]
          }),
          
          // Additional Components (if applicable)
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Solar Array", bold: true })] })],
                shading: { fill: "FEF3C7" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{SOLAR_MWP} MWp + Inverters")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{SOLAR_SUBTOTAL}", bold: true })] })]
              })
            ]
          }),
          
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Generator Backup", bold: true })] })],
                shading: { fill: "FEF3C7" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("{GENERATOR_MW} MW Natural Gas/Diesel")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{GEN_SUBTOTAL}", bold: true })] })]
              })
            ]
          }),
          
          // Subtotal Row
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "SYSTEM SUBTOTAL", bold: true, size: 22 })] })],
                shading: { fill: "E5E7EB" },
                columnSpan: 2
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{BESS_CAPEX}", bold: true, size: 22, color: "059669" })] })],
                shading: { fill: "ECFDF5" }
              })
            ]
          }),
          
          // Tariffs and Final Total
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Taxes & Tariffs", bold: true })] })],
                shading: { fill: "FEF2F2" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun("Import duties, local taxes")] })]
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{TARIFFS}", bold: true })] })]
              })
            ]
          }),
          
          // Grand Total Row
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "GRAND TOTAL", bold: true, size: 24, color: "FFFFFF" })] })],
                shading: { fill: "059669" },
                columnSpan: 2
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{GRAND_CAPEX}", bold: true, size: 24, color: "FFFFFF" })] })],
                shading: { fill: "059669" }
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Financial Analysis
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "4. FINANCIAL ANALYSIS & ROI",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      new docx.Table({
        rows: [
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "FINANCIAL METRIC", bold: true, color: "FFFFFF" })] })],
                width: { size: 50, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "7C3AED" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "VALUE", bold: true, color: "FFFFFF" })] })],
                width: { size: 50, type: docx.WidthType.PERCENTAGE },
                shading: { fill: "7C3AED" }
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Annual Energy Savings", bold: true })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{ANNUAL_SAVINGS}", size: 22, color: "059669" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Simple Payback Period", bold: true })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{ROI_YEARS} years", size: 22, color: "7C3AED" })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Budget Variance", bold: true })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{BUDGET_DELTA}", size: 22 })] })]
              })
            ]
          }),
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "System Utilization", bold: true })] })],
                shading: { fill: "F3F4F6" }
              }),
              new docx.TableCell({
                children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{UTILIZATION}%", size: 22 })] })]
              })
            ]
          })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      }),
      
      // Implementation & Certifications
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "5. IMPLEMENTATION & CERTIFICATIONS",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "Project Timeline: ", bold: true }),
          new docx.TextRun("12-16 weeks from contract execution to commissioning")
        ],
        spacing: { after: 150 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "Required Certifications: ", bold: true }),
          new docx.TextRun("{CERTIFICATIONS}")
        ],
        spacing: { after: 150 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "Warranty Period: ", bold: true }),
          new docx.TextRun("{WARRANTY_YEARS} years comprehensive system warranty")
        ],
        spacing: { after: 300 }
      }),
      
      // Summary & Next Steps
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "6. SUMMARY & NEXT STEPS",
            bold: true,
            size: 20,
            color: "1F2937"
          })
        ],
        spacing: { before: 600, after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("This Battery Energy Storage System provides an optimal solution for your energy requirements with strong financial returns and proven technology. The proposed system will deliver reliable energy storage, grid stabilization, and significant cost savings over its operational lifetime.")
        ],
        spacing: { after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "Key Benefits:", bold: true })
        ],
        spacing: { after: 150 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Peak demand reduction and energy cost optimization")
        ],
        spacing: { after: 100 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Grid stabilization and power quality improvement")
        ],
        spacing: { after: 100 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Backup power capability during outages")
        ],
        spacing: { after: 100 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun("• Reduced carbon footprint and sustainability goals")
        ],
        spacing: { after: 300 }
      }),
      
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: "This proposal is valid for 30 days. Please contact us to discuss next steps and begin the implementation process.", bold: true })
        ],
        spacing: { after: 400 }
      }),
      
      // Footer
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "Confidential & Proprietary",
            italics: true,
            size: 18,
            color: "6B7280"
          })
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 600 }
      })
    ]
  }]
});

// Generate and save the enhanced template
docx.Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('./server/templates/BESS_Quote_Template_Enhanced.docx', buffer);
  console.log('Created enhanced template: BESS_Quote_Template_Enhanced.docx');
  console.log('Features:');
  console.log('- Professional grid table for specifications and pricing');
  console.log('- Image placeholder sections for project photos/diagrams');
  console.log('- Comprehensive financial analysis');
  console.log('- Enhanced formatting and styling');
  console.log('- Structured sections for complete quote documentation');
});