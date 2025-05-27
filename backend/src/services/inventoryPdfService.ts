import PDFDocument from 'pdfkit';

interface BikeInventoryItem {
  _id: any;
  bikeModelId: any;
  motorNumber: string;
  chassisNumber: string;
  status: string;
  notes?: string;
  dateAdded: Date;
}

interface InventoryData {
  inventoryItems: BikeInventoryItem[];
  totalAvailable: number;
  insights: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
  reportGenerated: Date;
}

/**
 * Generate a professional PDF for inventory report
 * @param inventoryData The inventory analytics data
 * @returns Promise with PDF buffer
 */
export const generateInventoryPDF = async (inventoryData: InventoryData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document with single page layout
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        layout: 'portrait'
      });

      // Set up streams to capture PDF data
      const buffers: Buffer[] = [];

      // Handle document stream events
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Start adding content to the PDF
      generateInventoryHeader(doc, inventoryData.reportGenerated);
      generateInventoryTable(doc, inventoryData.inventoryItems);
      generateTotalRow(doc, inventoryData.totalAvailable);
      generateActionItems(doc, inventoryData.insights);
      generateSignatureSection(doc);

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Inventory PDF generation error:', error);
      reject(error);
    }
  });
};

/**
 * Extract color from notes field or return default
 */
const extractColorFromNotes = (notes?: string): string => {
  if (!notes) return 'N/A';

  // Common color patterns to look for in notes
  const colorPatterns = [
    /color[:\s]*([a-zA-Z\s]+)/i,
    /colour[:\s]*([a-zA-Z\s]+)/i,
    /\b(red|blue|green|black|white|yellow|orange|purple|pink|brown|gray|grey|silver|gold)\b/i
  ];

  for (const pattern of colorPatterns) {
    const match = notes.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return 'N/A';
};

/**
 * Generate the header section of the inventory report
 */
const generateInventoryHeader = (doc: PDFKit.PDFDocument, reportDate: Date): void => {
  // Company name
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('Gunawardhana Motors', 0, 40, { align: 'center' });

  // Report title
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Inventory Report', 0, 65, { align: 'center' });

  // Date
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Date: ${reportDate.toLocaleDateString('en-GB')}`, 0, 85, { align: 'center' });

  // Add some space
  doc.moveDown(1.5);
};

/**
 * Generate the inventory table
 */
const generateInventoryTable = (doc: PDFKit.PDFDocument, inventoryItems: BikeInventoryItem[]): void => {
  const tableTop = 120;
  const tableLeft = 40;
  const rowHeight = 18;
  const tableWidth = 515;

  // Column widths for: No, Model, Color, Chassis Number, Motor Number
  const colWidths = [40, 120, 80, 135, 140];
  const headers = ['No', 'Model', 'Color', 'Chassis Number', 'Motor Number'];

  // Draw table headers
  let currentY = tableTop;
  doc.fontSize(9)
     .font('Helvetica-Bold');

  // Header background
  doc.rect(tableLeft, currentY, tableWidth, rowHeight)
     .fillAndStroke('#f0f0f0', '#000000');

  // Header text
  let currentX = tableLeft + 2;
  headers.forEach((header, index) => {
    doc.fillColor('#000000')
       .text(header, currentX, currentY + 4, {
         width: colWidths[index] - 4,
         align: 'center'
       });
    currentX += colWidths[index];
  });

  currentY += rowHeight;

  // Draw table rows for available bikes only
  doc.fontSize(8)
     .font('Helvetica');

  const availableBikes = inventoryItems.filter(item => item.status === 'available');

  availableBikes.forEach((item, index) => {
    // Alternate row colors
    const fillColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
    doc.rect(tableLeft, currentY, tableWidth, rowHeight)
       .fillAndStroke(fillColor, '#000000');

    currentX = tableLeft + 2;

    // Extract color from notes
    const color = extractColorFromNotes(item.notes);

    // Row data
    const rowData = [
      (index + 1).toString(),
      item.bikeModelId?.name || 'N/A',
      color,
      item.chassisNumber,
      item.motorNumber
    ];

    rowData.forEach((data, colIndex) => {
      doc.fillColor('#000000')
         .text(data, currentX, currentY + 3, {
           width: colWidths[colIndex] - 4,
           align: colIndex === 0 ? 'center' : 'left',
           height: rowHeight - 6
         });
      currentX += colWidths[colIndex];
    });

    currentY += rowHeight;
  });

  // Store the current Y position for the total row
  doc.y = currentY;
};

/**
 * Generate total row
 */
const generateTotalRow = (doc: PDFKit.PDFDocument, totalAvailable: number): void => {
  const tableLeft = 40;
  const rowHeight = 18;
  const tableWidth = 515;
  const colWidths = [40, 120, 80, 135, 140];

  let currentY = doc.y;

  // Total row background
  doc.rect(tableLeft, currentY, tableWidth, rowHeight)
     .fillAndStroke('#e6f3ff', '#000000');

  let currentX = tableLeft + 2;

  // Total row data
  const totalRowData = [
    'TOTAL',
    `${totalAvailable} Available`,
    '',
    '',
    ''
  ];

  doc.fontSize(8)
     .font('Helvetica-Bold');

  totalRowData.forEach((data, colIndex) => {
    doc.fillColor('#000000')
       .text(data, currentX, currentY + 3, {
         width: colWidths[colIndex] - 4,
         align: colIndex === 0 ? 'center' : 'left',
         height: rowHeight - 6
       });
    currentX += colWidths[colIndex];
  });

  doc.y = currentY + rowHeight + 10;
};

/**
 * Generate action items section
 */
const generateActionItems = (doc: PDFKit.PDFDocument, insights: any[]): void => {
  const currentY = doc.y + 20;

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Action Items:', 40, currentY);

  let itemY = currentY + 20;

  insights.slice(0, 3).forEach((insight) => {
    const priority = insight.priority === 'high' ? 'URGENT' :
                    insight.priority === 'medium' ? 'IMPORTANT' : 'NOTE';

    // Set color based on priority
    let textColor = '#000000';
    if (insight.priority === 'high') {
      textColor = '#dc3545'; // Red for urgent
    } else if (insight.priority === 'medium') {
      textColor = '#fd7e14'; // Orange for important
    } else {
      textColor = '#28a745'; // Green for success/hot seller
    }

    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(textColor)
       .text(`• ${priority}:`, 50, itemY, { continued: true })
       .font('Helvetica')
       .fillColor('#000000')
       .text(` ${insight.message}`, {
         width: 500
       });
    itemY += 15;
  });
};

/**
 * Generate signature section
 */
const generateSignatureSection = (doc: PDFKit.PDFDocument): void => {
  const currentY = doc.y + 30;

  // Signature & Rubberstamp section title
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Signature & Rubberstamp:', 40, currentY);

  const signatureY = currentY + 40;

  // Signature lines
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#000000')
     .text('_________________________', 80, signatureY)
     .text('Dealer Signature & Seal', 80, signatureY + 15)
     .text('_________________________', 350, signatureY)
     .text('Territory Sales Manager Signature', 350, signatureY + 15);

  // Contact info
  doc.fontSize(7)
     .text('For inquiries, contact: gunawardhanamotorsembilipitiya@gmail.com | 0778318061', 0, signatureY + 50, {
       align: 'center'
     });
};
