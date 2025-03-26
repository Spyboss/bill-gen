import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * Generate a PDF for a bill
 * @param bill The bill object
 * @returns Promise with PDF buffer
 */
export const generatePDF = async (bill: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document with proper A4 settings
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'portrait',
        autoFirstPage: true,
        bufferPages: true
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
      
      // Set default styling
      doc.font('Helvetica');
      doc.fontSize(10);
      doc.fillColor('#000000');
      doc.lineWidth(1);
      
      // Start adding content to the PDF
      generateHeader(doc);
      generateCustomerInformation(doc, bill);
      generateInvoiceTable(doc, bill);
      generateFooter(doc);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};

/**
 * Generate the header section of the bill
 */
const generateHeader = (doc: PDFKit.PDFDocument): void => {
  try {
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('TMR TRADING LANKA (PVT) LTD', 50, 50, { align: 'center' })
      .font('Helvetica')
      .fontSize(12)
      .text('GUNAWARDHANA MOTORS, EMBILIPITIYA', 50, 80, { align: 'center' })
      .fontSize(11)
      .text('AUTHORIZED DEALER - EMBILIPITIYA', 50, 100, { align: 'center' })
      .moveDown();
  } catch (error) {
    console.error('Error in header generation:', error);
  }
};

/**
 * Generate customer information section
 */
const generateCustomerInformation = (doc: PDFKit.PDFDocument, bill: any): void => {
  const startY = 140;
  
  // Bill details (right side)
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Bill No:', 400, startY)
    .font('Helvetica')
    .text(bill.billNumber || bill.bill_number || '', 450, startY)
    .font('Helvetica-Bold')
    .text('Date:', 400, startY + 20)
    .font('Helvetica')
    .text(formatDate(bill.billDate || bill.bill_date), 450, startY + 20);

  // Customer details (left side)
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Customer Details:', 50, startY);
  
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Name:', 50, startY + 20)
    .font('Helvetica')
    .text(bill.customerName || bill.customer_name || '', 150, startY + 20)
    .font('Helvetica-Bold')
    .text('NIC:', 50, startY + 35)
    .font('Helvetica')
    .text(bill.customerNIC || bill.customer_nic || '', 150, startY + 35)
    .font('Helvetica-Bold')
    .text('Address:', 50, startY + 50)
    .font('Helvetica')
    .text(bill.customerAddress || bill.customer_address || '', 150, startY + 50);

  // Vehicle details
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Vehicle Details:', 50, startY + 80)
    .fontSize(10)
    .text('Model:', 50, startY + 100)
    .font('Helvetica')
    .text(bill.bikeModel || bill.model_name || '', 150, startY + 100)
    .font('Helvetica-Bold')
    .text('Motor Number:', 50, startY + 115)
    .font('Helvetica')
    .text(bill.motorNumber || bill.motor_number || '', 150, startY + 115)
    .font('Helvetica-Bold')
    .text('Chassis Number:', 50, startY + 130)
    .font('Helvetica')
    .text(bill.chassisNumber || bill.chassis_number || '', 150, startY + 130);
};

/**
 * Generate the invoice table with payment details
 */
const generateInvoiceTable = (doc: PDFKit.PDFDocument, bill: any): void => {
  const startY = 320;
  const rowHeight = 25;
  const col1Width = 350;
  const col2Width = 150;
  
  // Table title
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Payment Details:', 50, startY - 30);

  // Table headers
  doc
    .font('Helvetica-Bold')
    .fontSize(10);

  // Draw header row
  doc
    .strokeColor('#000000')
    .lineWidth(1)
    .moveTo(50, startY)
    .lineTo(50 + col1Width + col2Width, startY)
    .stroke();

  // Header text
  doc
    .text('Description', 60, startY + 7)
    .text('Amount (Rs.)', 60 + col1Width + 20, startY + 7);

  let y = startY + rowHeight;

  // Helper function to add a row
  const addRow = (description: string, amount: number | string) => {
    doc
      .strokeColor('#000000')
      .moveTo(50, y)
      .lineTo(50 + col1Width + col2Width, y)
      .stroke();

    doc
      .font('Helvetica')
      .text(description, 60, y + 7)
      .text(formatAmount(amount), 60 + col1Width + 20, y + 7);

    y += rowHeight;
  };

  // Add rows
  addRow('Bike Price', bill.bikePrice || bill.bike_price || 0);

  if ((bill.rmvCharge > 0 || bill.rmv_charge > 0) && (bill.billType === 'cash' || bill.bill_type === 'cash')) {
    addRow('RMV Charge', bill.rmvCharge || bill.rmv_charge || 13000);
  } else if (bill.billType === 'leasing' || bill.bill_type === 'leasing') {
    addRow('RMV Charge - CPZ', bill.rmvCharge || bill.rmv_charge || 13500);
  }

  if ((bill.billType === 'leasing' || bill.bill_type === 'leasing') && (bill.downPayment || bill.down_payment)) {
    addRow('Down Payment', bill.downPayment || bill.down_payment || 0);
  }

  // Draw bottom line
  doc
    .strokeColor('#000000')
    .moveTo(50, y)
    .lineTo(50 + col1Width + col2Width, y)
    .stroke();
};

/**
 * Generate footer section
 */
const generateFooter = (doc: PDFKit.PDFDocument): void => {
  const pageHeight = doc.page.height;
  
  doc
    .fontSize(10)
    .text(
      '* This is a computer generated document.',
      50,
      pageHeight - 70,
      { align: 'center' }
    );
};

/**
 * Format amount with thousands separator
 */
const formatAmount = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format date
 */
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 