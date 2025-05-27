import PDFDocument from 'pdfkit';

interface InventoryData {
  modelPerformance: Array<{
    modelName: string;
    price: number;
    totalUnits: number;
    availableUnits: number;
    soldUnits: number;
    reservedUnits: number;
    damagedUnits: number;
    soldValue: number;
    sellThroughRate: number;
    stockHealth: string;
  }>;
  kpis: {
    totalModels: number;
    totalUnits: number;
    totalValue: number;
    averagePrice: number;
  };
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
      generateInventoryTable(doc, inventoryData.modelPerformance);
      generateActionItems(doc, inventoryData.insights);
      generateInventoryFooter(doc);

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Inventory PDF generation error:', error);
      reject(error);
    }
  });
};

/**
 * Generate the header section of the inventory report
 */
const generateInventoryHeader = (doc: PDFKit.PDFDocument, reportDate: Date): void => {
  // Logo placeholder (top-left)
  doc.fontSize(8)
     .font('Helvetica')
     .text('[LOGO]', 40, 45);

  // Company name
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('Gunawardhana Motors', 0, 50, { align: 'center' });

  // Report title
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Inventory Report', 0, 75, { align: 'center' });

  // Date
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Generated on: ${reportDate.toLocaleDateString('en-US', {
       weekday: 'long',
       year: 'numeric',
       month: 'long',
       day: 'numeric'
     })}`, 0, 95, { align: 'center' });

  // Add some space
  doc.moveDown(2);
};

/**
 * Generate the inventory table
 */
const generateInventoryTable = (doc: PDFKit.PDFDocument, modelPerformance: any[]): void => {
  const tableTop = 140;
  const tableLeft = 40;
  const rowHeight = 20;
  const tableWidth = 515;

  // Column widths
  const colWidths = [30, 80, 70, 90, 70, 70, 105];
  const headers = ['No', 'Model', 'Price', 'Stock Status', 'Revenue', 'Performance', 'Stock Health'];

  // Draw table headers
  let currentY = tableTop;
  doc.fontSize(8)
     .font('Helvetica-Bold');

  // Header background
  doc.rect(tableLeft, currentY, tableWidth, rowHeight)
     .fillAndStroke('#f0f0f0', '#000000');

  // Header text
  let currentX = tableLeft + 2;
  headers.forEach((header, index) => {
    doc.fillColor('#000000')
       .text(header, currentX, currentY + 5, {
         width: colWidths[index] - 4,
         align: 'center'
       });
    currentX += colWidths[index];
  });

  currentY += rowHeight;

  // Draw table rows
  doc.fontSize(7)
     .font('Helvetica');

  modelPerformance.forEach((item, index) => {
    // Alternate row colors
    const fillColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
    doc.rect(tableLeft, currentY, tableWidth, rowHeight)
       .fillAndStroke(fillColor, '#000000');

    currentX = tableLeft + 2;

    // Row data
    const rowData = [
      (index + 1).toString(),
      item.modelName,
      `Rs. ${item.price.toLocaleString()}`,
      `Available: ${item.availableUnits}, Sold: ${item.soldUnits}`,
      `Rs. ${item.soldValue.toLocaleString()}`,
      `${item.sellThroughRate.toFixed(0)}% Sell-through`,
      `${item.stockHealth}`
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

  // Add total row
  const totalAvailable = modelPerformance.reduce((sum, item) => sum + item.availableUnits, 0);
  const totalSold = modelPerformance.reduce((sum, item) => sum + item.soldUnits, 0);
  const totalRevenue = modelPerformance.reduce((sum, item) => sum + item.soldValue, 0);

  // Total row background
  doc.rect(tableLeft, currentY, tableWidth, rowHeight)
     .fillAndStroke('#e6f3ff', '#000000');

  currentX = tableLeft + 2;

  // Total row data
  const totalRowData = [
    'TOTAL',
    `${modelPerformance.length} Models`,
    '',
    `Available: ${totalAvailable}, Sold: ${totalSold}`,
    `Rs. ${totalRevenue.toLocaleString()}`,
    '',
    ''
  ];

  doc.fontSize(7)
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
 * Generate footer section
 */
const generateInventoryFooter = (doc: PDFKit.PDFDocument): void => {
  const footerY = 720;

  // Signature lines
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#000000')
     .text('_________________________', 80, footerY)
     .text('Dealer Signature & Seal', 80, footerY + 15)
     .text('_________________________', 350, footerY)
     .text('Territory Sales Manager Signature', 350, footerY + 15);

  // Contact info
  doc.fontSize(7)
     .text('For inquiries, contact: gunawardhanamotorsembilipitiya@gmail.com | 0778318061', 0, footerY + 40, {
       align: 'center'
     });
};
