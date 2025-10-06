const docx = require('docx');
const fs = require('fs');

// Create a simple BESS quote template without embedded images for debugging
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
    }
  },
  sections: [
    {
      properties: {},
      children: [
        // Simple header without embedded image
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
                          text: "Energy Solutions",
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

        // Spacing
        new docx.Paragraph({ text: "", spacing: { after: 400 } }),

        // Introduction
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: "Executive Summary",
              font: "Helvetica",
              bold: true,
              size: 32,
              color: "1E40AF"
            })
          ],
          spacing: { after: 300 }
        }),

        new docx.Paragraph({
          children: [
            new docx.TextRun("This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.")
          ],
          spacing: { after: 400 }
        }),

        // Project Details Table
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: "Project Details",
              font: "Helvetica",
              bold: true,
              size: 28,
              color: "1E40AF"
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

        // Financial Summary
        new docx.Paragraph({ text: "", spacing: { after: 400 } }),

        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: "Financial Summary",
              font: "Helvetica",
              bold: true,
              size: 28,
              color: "1E40AF"
            })
          ],
          spacing: { after: 200 }
        }),

        new docx.Table({
          rows: [
            new docx.TableRow({
              children: [
                new docx.TableCell({
                  children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "Total Investment", bold: true, font: "Helvetica" })] })],
                  shading: { fill: "FFF3CD" }
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
                  shading: { fill: "FFF3CD" }
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
                  shading: { fill: "E3F2FD" }
                }),
                new docx.TableCell({
                  children: [new docx.Paragraph({ children: [new docx.TextRun({ text: "{ROI_YEARS} years", bold: true, size: 20, color: "7C3AED", font: "Helvetica" })] })]
                })
              ]
            })
          ],
          width: { size: 100, type: docx.WidthType.PERCENTAGE }
        })
      ]
    }
  ]
});

// Generate and save the document
docx.Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('./server/templates/BESS_Quote_Template_Simple.docx', buffer);
  console.log('Created simple template: BESS_Quote_Template_Simple.docx');
  console.log('Features:');
  console.log('- No embedded images (for debugging)');
  console.log('- Professional table layouts');
  console.log('- Helvetica typography');
  console.log('- Essential sections only');
});