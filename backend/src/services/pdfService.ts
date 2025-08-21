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
 * Utility function to wrap text properly within specified width
 */
const wrapText = (text: string, maxWidth: number, fontSize: number = 10): string[] => {
  if (!text) return [''];
  
  // Handle manual line breaks (\n) first
  const manualLines = text.split('\n');
  const wrappedLines: string[] = [];
  
  manualLines.forEach(line => {
    if (!line.trim()) {
      wrappedLines.push('');
      return;
    }
    
    const words = line.split(' ');
    let currentLine = '';
    
    // Approximate character limit based on font size and width
    const charLimit = Math.floor(maxWidth / (fontSize * 0.6));
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= charLimit) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  });
  
  return wrappedLines.length > 0 ? wrappedLines : [''];
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
  
  // Set starting Y position for customer details
  let currentY = 160;
  const lineHeight = 15;
  const labelWidth = 100;
  const contentWidth = 200;
  const sectionSpacing = 5; // Consistent spacing between fields
  
  // Customer Name with proper text wrapping
  const nameText = bill.customerName || bill.customer_name || '';
  doc.fontSize(10).text('Name:', 50, currentY);
  
  const nameLines = wrapText(nameText, contentWidth, 10);
  doc.font('Helvetica-Bold');
  nameLines.forEach((line, index) => {
    doc.text(line, 150, currentY + (index * lineHeight));
  });
  doc.font('Helvetica');
  
  currentY += Math.max(nameLines.length * lineHeight, lineHeight) + sectionSpacing;
  
  // NIC
  doc.text('NIC:', 50, currentY)
     .text(bill.customerNIC || bill.customer_nic || '', 150, currentY, { width: contentWidth });
  
  currentY += lineHeight + sectionSpacing;
  
  // Address with proper text wrapping
  const addressText = bill.customerAddress || bill.customer_address || '';
  doc.text('Address:', 50, currentY);
  
  const addressLines = wrapText(addressText, contentWidth, 10);
  addressLines.forEach((line, index) => {
    doc.text(line, 150, currentY + (index * lineHeight));
  });
  
  currentY += Math.max(addressLines.length * lineHeight, lineHeight) + (sectionSpacing * 2); // Double spacing before vehicle section
  
  // Vehicle Details section
  doc
    .fontSize(14)
    .text('Vehicle Details:', 50, currentY);
  
  currentY += 20;
  
  // Vehicle details with consistent spacing
  const vehicleFields = [
    { label: 'Model:', value: bill.bikeModel || bill.model_name || '' },
    { label: 'Type:', value: bill.vehicleType || bill.vehicle_type || 'E-MOTORCYCLE' },
    { label: 'Motor Number:', value: bill.motorNumber || bill.motor_number || '' },
    { label: 'Chassis Number:', value: bill.chassisNumber || bill.chassis_number || '' }
  ];
  
  doc.fontSize(10);
  vehicleFields.forEach(field => {
    doc.text(field.label, 50, currentY)
       .text(field.value, 150, currentY, { width: contentWidth });
    currentY += lineHeight;
  });
    
  // Store the final Y position as a property on the doc object for the invoice table to use
  (doc as any)._lastDetailY = currentY + (sectionSpacing * 2);
};

/**
 * Generate the invoice table with payment details
 */
const generateInvoiceTable = (doc: PDFKit.PDFDocument, bill: any): void => {
  // Get the Y position after customer and vehicle details
  let y = (doc as any)._lastDetailY || 320;
  
  const sectionSpacing = 5; // Consistent spacing value
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Payment Details:', 50, y);
  
  y += (sectionSpacing * 5);
  
  // Define table structure with proper alignment
  const tableTop = y;
  const itemRowHeight = 25;
  const tableWidth = 500;
  
  // Define column positions and widths for better alignment
  const columns = {
    description: { x: 50, width: 350 },
    amount: { x: 400, width: 150 }
  };
  
  // Table headers with borders and background
  doc.fontSize(12).font('Helvetica-Bold');
  
  // Draw table header row with background
  doc
    .fillColor('#e0e0e0') // Light gray background
    .rect(columns.description.x, tableTop, columns.description.width, itemRowHeight)
    .fill() // Fill with background color
    .fillColor('#000000') // Reset to black for text
    .rect(columns.description.x, tableTop, columns.description.width, itemRowHeight)
    .stroke(); // Add stroke
    
  doc
    .fillColor('#e0e0e0') // Light gray background
    .rect(columns.amount.x, tableTop, columns.amount.width, itemRowHeight)
    .fill() // Fill with background color
    .fillColor('#000000') // Reset to black for text
    .rect(columns.amount.x, tableTop, columns.amount.width, itemRowHeight)
    .stroke(); // Add stroke
  
  // Header text with proper alignment
  doc
    .text('Description', columns.description.x + 10, tableTop + 8)
    .text('Amount (Rs.)', columns.amount.x + 10, tableTop + 8, { 
      align: 'center', 
      width: columns.amount.width - 20 
    });
  
  doc.font('Helvetica');
  
  y = tableTop + itemRowHeight;
  
  // Helper function to draw a table row with text wrapping support
  const drawTableRow = (description: string, amount: string, isHighlighted: boolean = false) => {
    const bgColor = isHighlighted ? '#f8f4e8' : '#ffffff';
    
    // Wrap description text to fit within column width
    const wrappedDescription = wrapText(description, columns.description.width - 20, 10);
    const rowHeight = Math.max(itemRowHeight, wrappedDescription.length * 12 + 6);
    
    // Draw row background
    doc
      .fillColor(bgColor)
      .rect(columns.description.x, y, columns.description.width, rowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.description.x, y, columns.description.width, rowHeight)
      .stroke();
    
    doc
      .fillColor(bgColor)
      .rect(columns.amount.x, y, columns.amount.width, rowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.amount.x, y, columns.amount.width, rowHeight)
      .stroke();
    
    // Draw description text with proper wrapping
    doc.fontSize(10);
    let textY = y + 8;
    wrappedDescription.forEach(line => {
      doc.text(line, columns.description.x + 10, textY);
      textY += 12;
    });
    
    // Draw amount text (centered vertically in the row)
    const amountY = y + (rowHeight / 2) - 5;
    doc.text(amount, columns.amount.x + 10, amountY, { 
      align: 'right', 
      width: columns.amount.width - 20 
    });
    
    y += rowHeight;
  };
  
  // Add bike price row
  drawTableRow('Bike Price', formatAmount(bill.bikePrice || bill.bike_price));
  
  // Add RMV charge if applicable
  if ((bill.rmvCharge > 0 || bill.rmv_charge > 0) && (bill.billType === 'cash' || bill.bill_type === 'cash')) {
    drawTableRow('RMV Charge', formatAmount(bill.rmvCharge || bill.rmv_charge || 13000));
  } else if ((bill.billType === 'leasing' || bill.bill_type === 'leasing')) {
    drawTableRow('RMV Charge - CPZ', formatAmount(bill.rmvCharge || bill.rmv_charge || 13500));
  }
  
  // Add down payment if leasing
  if ((bill.billType === 'leasing' || bill.bill_type === 'leasing') && (bill.downPayment || bill.down_payment)) {
    drawTableRow('Down Payment', formatAmount(bill.downPayment || bill.down_payment));
  }
  
  // If advance payment, show advance amount and balance
  if ((bill.isAdvancePayment || bill.is_advance_payment) && (bill.advanceAmount || bill.advance_amount)) {
    // Draw total row with bold text
    const totalBgColor = '#e0e0e0';
    
    doc
      .fillColor(totalBgColor)
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .stroke();
    
    doc
      .fillColor(totalBgColor)
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .stroke();
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Amount', columns.description.x + 10, y + 8)
      .text(formatAmount(bill.totalAmount || bill.total_amount), columns.amount.x + 10, y + 8, { 
        align: 'right', 
        width: columns.amount.width - 20 
      });
    
    doc.font('Helvetica');
    y += itemRowHeight;
    
    // Draw advance row
    drawTableRow('Advance Amount', formatAmount(bill.advanceAmount || bill.advance_amount));
    
    // Draw balance row with highlighting and bold text
    const balanceBgColor = '#f8f4e8';
    
    doc
      .fillColor(balanceBgColor)
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .stroke();
    
    doc
      .fillColor(balanceBgColor)
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .stroke();
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Balance', columns.description.x + 10, y + 8)
      .text(formatAmount(bill.balanceAmount || bill.balance_amount || 0), columns.amount.x + 10, y + 8, { 
        align: 'right', 
        width: columns.amount.width - 20 
      });
    
    doc.font('Helvetica');
    y += itemRowHeight;
  } else {
    // Draw the total row with gray background and bold text
    const totalBgColor = '#e0e0e0';
    
    doc
      .fillColor(totalBgColor)
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.description.x, y, columns.description.width, itemRowHeight)
      .stroke();
    
    doc
      .fillColor(totalBgColor)
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .fill()
      .fillColor('#000000')
      .rect(columns.amount.x, y, columns.amount.width, itemRowHeight)
      .stroke();
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Amount', columns.description.x + 10, y + 8)
      .text(formatAmount(bill.totalAmount || bill.total_amount), columns.amount.x + 10, y + 8, { 
        align: 'right', 
        width: columns.amount.width - 20 
      });
    
    doc.font('Helvetica');
    y += itemRowHeight;
  }
  
  // Terms and Conditions
  y += (sectionSpacing * 10);
  doc
    .fillColor('#444444')  // Explicitly set color to match other sections
    .fontSize(12)
    .font('Helvetica-Bold')  // Make the header bold
    .text('Terms and Conditions:', 50, y);
  
  y += (sectionSpacing * 4);
  doc
    .font('Helvetica')  // Reset to regular font
    .fontSize(10);
  
  doc.text('1. All prices are inclusive of taxes.', 50, y);
  y += (sectionSpacing * 3);
  doc.text('2. Warranty is subject to terms and conditions.', 50, y);
  y += (sectionSpacing * 3);
  doc.text('3. This is a computer-generated bill.', 50, y);
  
  // Add additional condition for RMV if applicable
  if ((bill.billType === 'cash' || bill.bill_type === 'cash') && 
      !(bill.isEbicycle || bill.is_ebicycle) && 
      !(bill.isAdvancePayment || bill.is_advance_payment)) {
    y += (sectionSpacing * 3);
    doc.text('4. RMV registration will be completed within 30 days.', 50, y);
  }
  
  // Signature areas
  y += (sectionSpacing * 14);
  doc
    .moveTo(50, y)
    .lineTo(200, y)
    .stroke();
  
  doc
    .moveTo(350, y)
    .lineTo(500, y)
    .stroke();
  
  doc
    .text('Dealer Signature', 70, y + (sectionSpacing * 2))
    .text('Rubber Stamp', 390, y + (sectionSpacing * 2));
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
      'Contact: +94 77 8318 061 | Email: gunawardhanamotorsembilipitiya@gmail.com',
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
    
    // Use UTC methods to avoid timezone conversion issues
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};