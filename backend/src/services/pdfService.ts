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
      // Create a document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
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
    // Try to include the logo if it exists
    const logoPath = './src/assets/logo.png';
    
    try {
      doc.image(logoPath, 50, 45, { width: 70 });
    } catch (err) {
      // If logo can't be loaded, continue without it
      console.log('Logo image not found, rendering header without logo');
    }
    
    doc
      .fillColor('#444444')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('TMR TRADING LANKA (PVT) LTD', 130, 55, { width: 400 })
      .font('Helvetica')
      .fontSize(12)
      .text('GUNAWARDHANA MOTORS, EMBILIPITIYA', 130, 85, { width: 400 })
      .fontSize(11)
      .text('AUTHORIZED DEALER - EMBILIPITIYA', 130, 105, { width: 400 })
      .moveDown();
  } catch (error) {
    // If there's an error, fall back to text-only header
    console.error('Error rendering header with logo:', error);
    doc
      .fillColor('#444444')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('TMR TRADING LANKA (PVT) LTD', 50, 45, { align: 'center' })
      .font('Helvetica')
      .fontSize(12)
      .text('GUNAWARDHANA MOTORS, EMBILIPITIYA', 50, 75, { align: 'center' })
      .fontSize(11)
      .text('AUTHORIZED DEALER - EMBILIPITIYA', 50, 95, { align: 'center' })
      .moveDown();
  }
};

/**
 * Generate customer information section
 */
const generateCustomerInformation = (doc: PDFKit.PDFDocument, bill: any): void => {
  // Right side data (Bill No and Date)
  doc
    .fontSize(10)
    .text('Bill No:', 400, 140)
    .font('Helvetica-Bold')
    .text(bill.billNumber || bill.bill_number || '', 450, 140, { width: 150 })
    .font('Helvetica');
    
  // Format the date properly
  const dateText = formatDate(bill.billDate || bill.bill_date);
  doc.text('Date:', 400, 160)
     .font('Helvetica-Bold')
     .text(dateText, 450, 160, { width: 150 })
     .font('Helvetica');
  
  doc
    .fillColor('#444444')
    .fontSize(14)
    .text('Customer Details:', 50, 140);
  
  doc
    .fontSize(10)
    .text('Name:', 50, 160)
    .font('Helvetica-Bold')
    .text(bill.customerName || bill.customer_name || '', 150, 160, { width: 200, lineBreak: true })
    .font('Helvetica');
  
  // Calculate the name height to adjust the NIC position
  const nameText = bill.customerName || bill.customer_name || '';
  const nameHeight = estimateTextHeight(nameText, 10, 200); // Estimate text height
  const nicYPosition = 160 + nameHeight + 5; // Add 5px padding
  
  doc
    .text('NIC:', 50, nicYPosition)
    .text(bill.customerNIC || bill.customer_nic || '', 150, nicYPosition, { width: 200 });
  
  // Calculate address position based on NIC
  const addressYPosition = nicYPosition + 15;
  doc
    .text('Address:', 50, addressYPosition)
    .text(bill.customerAddress || bill.customer_address || '', 150, addressYPosition, { width: 200 });
  
  // Adjust vehicle details position based on address
  const vehicleYPosition = addressYPosition + 30;
  doc
    .fontSize(14)
    .text('Vehicle Details:', 50, vehicleYPosition);
  
  doc
    .fontSize(10)
    .text('Model:', 50, vehicleYPosition + 20)
    .text(bill.bikeModel || bill.model_name || '', 150, vehicleYPosition + 20, { width: 300 })
    .text('Motor Number:', 50, vehicleYPosition + 35)
    .text(bill.motorNumber || bill.motor_number || '', 150, vehicleYPosition + 35, { width: 300 })
    .text('Chassis Number:', 50, vehicleYPosition + 50)
    .text(bill.chassisNumber || bill.chassis_number || '', 150, vehicleYPosition + 50, { width: 300 });
};

/**
 * Helper function to estimate text height based on font size and width
 */
const estimateTextHeight = (text: string, fontSize: number, width: number): number => {
  if (!text) return fontSize; // Default to single line height
  
  // Roughly calculate how many lines the text will take
  const avgCharWidth = fontSize * 0.6; // Approximate character width
  const charsPerLine = Math.floor(width / avgCharWidth);
  const lines = Math.ceil(text.length / charsPerLine);
  
  return lines * (fontSize + 2); // fontSize + 2 for line spacing
};

/**
 * Generate the invoice table with payment details
 */
const generateInvoiceTable = (doc: PDFKit.PDFDocument, bill: any): void => {
  // Calculate the start position based on vehicle details
  const nameText = bill.customerName || bill.customer_name || '';
  const nameHeight = estimateTextHeight(nameText, 10, 200);
  const nicYPosition = 160 + nameHeight + 5;
  const addressYPosition = nicYPosition + 15;
  const vehicleYPosition = addressYPosition + 30;
  const vehicleDetailsHeight = 70; // Height of the vehicle details section
  
  let y = vehicleYPosition + vehicleDetailsHeight + 20; // Add some padding
  
  doc
    .fontSize(14)
    .text('Payment Details:', 50, y);
  
  y += 25;
  
  // Draw table with borders
  const tableTop = y;
  const itemRowHeight = 25;
  const tableWidth = 500;
  
  // Set column widths
  const col1Width = 350; // Description column
  const col2Width = 150; // Amount column
  
  // Table headers with borders and background
  doc
    .fontSize(10)
    .font('Helvetica-Bold');
  
  // Draw table header row with background
  doc
    .fillColor('#e0e0e0') // Light gray background
    .rect(50, tableTop, col1Width, itemRowHeight)
    .fill() // Fill with background color
    .fillColor('#000000') // Reset to black for text
    .rect(50, tableTop, col1Width, itemRowHeight)
    .stroke(); // Add stroke
    
  doc
    .fillColor('#e0e0e0') // Light gray background
    .rect(50 + col1Width, tableTop, col2Width, itemRowHeight)
    .fill() // Fill with background color
    .fillColor('#000000') // Reset to black for text
    .rect(50 + col1Width, tableTop, col2Width, itemRowHeight)
    .stroke(); // Add stroke
  
  // Header text
  doc
    .text('Description', 60, tableTop + 7)
    .text('Amount (Rs.)', 60 + col1Width + 20, tableTop + 7);
  
  doc.font('Helvetica');
  
  y = tableTop + itemRowHeight;
  
  // Add bike price row
  // Draw row background
  doc
    .rect(50, y, col1Width, itemRowHeight)
    .stroke()
    .rect(50 + col1Width, y, col2Width, itemRowHeight)
    .stroke();
  
  // Row content
  doc
    .text('Bike Price', 60, y + 7)
    .text(formatAmount(bill.bikePrice || bill.bike_price), 60 + col1Width + 20, y + 7);
  
  y += itemRowHeight;
  
  // Add RMV charge if applicable
  if ((bill.rmvCharge > 0 || bill.rmv_charge > 0) && (bill.billType === 'cash' || bill.bill_type === 'cash')) {
    // Draw row background
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    // Row content
    doc
      .text('RMV Charge', 60, y + 7)
      .text(formatAmount(bill.rmvCharge || bill.rmv_charge || 13000), 60 + col1Width + 20, y + 7);
    
    y += itemRowHeight;
  } else if ((bill.billType === 'leasing' || bill.bill_type === 'leasing')) {
    // Draw row background
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    // Row content
    doc
      .text('RMV Charge - CPZ', 60, y + 7)
      .text(formatAmount(bill.rmvCharge || bill.rmv_charge || 13500), 60 + col1Width + 20, y + 7);
    
    y += itemRowHeight;
  }
  
  // Add down payment if leasing
  if ((bill.billType === 'leasing' || bill.bill_type === 'leasing') && (bill.downPayment || bill.down_payment)) {
    // Draw row background
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    // Row content
    doc
      .text('Down Payment', 60, y + 7)
      .text(formatAmount(bill.downPayment || bill.down_payment), 60 + col1Width + 20, y + 7);
    
    y += itemRowHeight;
  }
  
  // If advance payment, show advance amount and balance
  if ((bill.isAdvancePayment || bill.is_advance_payment) && (bill.advanceAmount || bill.advance_amount)) {
    // Draw total row
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    doc
      .font('Helvetica-Bold')
      .text('Total Amount', 60, y + 7)
      .text(formatAmount(bill.totalAmount || bill.total_amount), 60 + col1Width + 20, y + 7);
    
    doc.font('Helvetica');
    
    y += itemRowHeight;
    
    // Draw advance row
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    doc
      .text('Advance Amount', 60, y + 7)
      .text(formatAmount(bill.advanceAmount || bill.advance_amount), 60 + col1Width + 20, y + 7);
    
    y += itemRowHeight;
    
    // Draw balance row
    doc
      .rect(50, y, col1Width, itemRowHeight)
      .stroke()
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    doc
      .text('Balance', 60, y + 7)
      .text(formatAmount(bill.balanceAmount || bill.balance_amount || 0), 60 + col1Width + 20, y + 7);
  } else {
    // Draw the total row with gray background
    doc
      .fillColor('#e0e0e0') // Light gray background
      .rect(50, y, col1Width, itemRowHeight)
      .fill() // Fill with background color
      .fillColor('#000000') // Reset to black for text
      .rect(50, y, col1Width, itemRowHeight)
      .stroke();
    
    doc
      .fillColor('#e0e0e0') // Light gray background
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .fill() // Fill with background color
      .fillColor('#000000') // Reset to black for text
      .rect(50 + col1Width, y, col2Width, itemRowHeight)
      .stroke();
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Amount', 60, y + 7)
      .text(formatAmount(bill.totalAmount || bill.total_amount), 60 + col1Width + 20, y + 7);
    
    doc.font('Helvetica');
  }
  
  // Terms and Conditions
  y += 50;
  doc
    .fillColor('#444444')  // Explicitly set color to match other sections
    .fontSize(12)
    .font('Helvetica-Bold')  // Make the header bold
    .text('Terms and Conditions:', 50, y);
  
  y += 20;
  doc
    .font('Helvetica')  // Reset to regular font
    .fontSize(10);
  
  doc.text('1. All prices are inclusive of taxes.', 50, y);
  y += 15;
  doc.text('2. Warranty is subject to terms and conditions.', 50, y);
  y += 15;
  doc.text('3. This is a computer-generated bill.', 50, y);
  
  // Add additional condition for RMV if applicable
  if ((bill.billType === 'cash' || bill.bill_type === 'cash') && 
      !(bill.isEbicycle || bill.is_ebicycle) && 
      !(bill.isAdvancePayment || bill.is_advance_payment)) {
    y += 15;
    doc.text('4. RMV registration will be completed within 30 days.', 50, y);
  }
  
  // Signature areas
  y += 70;
  doc
    .moveTo(50, y)
    .lineTo(200, y)
    .stroke();
  
  doc
    .moveTo(350, y)
    .lineTo(500, y)
    .stroke();
  
  doc
    .text('Dealer Signature', 70, y + 10)
    .text('Rubber Stamp', 390, y + 10);
};

/**
 * Generate footer section
 */
const generateFooter = (doc: PDFKit.PDFDocument): void => {
  doc
    .fontSize(10)
    .text(
      'Thank you for your business!',
      50,
      700,
      { align: 'center', width: 500 }
    );
    
  doc
    .fontSize(9)
    .text(
      'Contact: +94 77 831 8061 | Email: gunawardhanamotors@gmail.com',
      50,
      725,
      { align: 'center', width: 500 }
    );
};

/**
 * Format amount with thousands separator
 */
const formatAmount = (value: number | string): string => {
  if (value === undefined || value === null) return '0';
  try {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) return '0';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0';
  }
};

/**
 * Format date
 */
const formatDate = (date: string | Date): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Format as DD/MM/YYYY
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}; 