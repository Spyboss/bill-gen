import PDFDocument from 'pdfkit';
import { IQuotation } from '../models/Quotation.js';

/**
 * Generate a PDF for a quotation or invoice
 * @param quotation The quotation object
 * @returns Promise with PDF buffer
 */
export const generateQuotationPDF = async (quotation: IQuotation): Promise<Buffer> => {
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

      // Company header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('TMR Trading Lanka Pvt Ltd', 50, 50);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Dealer: Gunawardana Motors - Embilipitiya', 50, 75)
         .text('Phone: +94 47 2230 123 | Email: info@gunawardanamotors.lk', 50, 90);

      // Document title
      const title = quotation.type === 'invoice' ? 'INVOICE' : 'QUOTATION';
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(title, 50, 130);

      // Document details
      doc.fontSize(12)
         .font('Helvetica')
         .text(`${title} No: ${quotation.quotationNumber}`, 50, 170)
         .text(`Date: ${quotation.quotationDate.toLocaleDateString()}`, 50, 185);

      if (quotation.validUntil && quotation.type === 'quotation') {
        doc.text(`Valid Until: ${quotation.validUntil.toLocaleDateString()}`, 50, 200);
      }

      // Customer details
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Customer Details:', 50, 230);

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Name: ${quotation.customerName}`, 50, 250)
         .text(`Address: ${quotation.customerAddress}`, 50, 265);

      if (quotation.customerNIC) {
        doc.text(`NIC: ${quotation.customerNIC}`, 50, 280);
      }

      if (quotation.customerPhone) {
        doc.text(`Phone: ${quotation.customerPhone}`, 50, 295);
      }

      if (quotation.bikeRegNo) {
        doc.text(`Bike Registration No: ${quotation.bikeRegNo}`, 50, 310);
      }

      // Insurance details (if applicable)
      let yPosition = 330;
      if (quotation.claimNumber || quotation.insuranceCompany || quotation.accidentDate) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Insurance Details:', 50, yPosition);
        
        yPosition += 20;
        
        if (quotation.claimNumber) {
          doc.fontSize(12)
             .font('Helvetica')
             .text(`Claim Number: ${quotation.claimNumber}`, 50, yPosition);
          yPosition += 15;
        }
        
        if (quotation.insuranceCompany) {
          doc.text(`Insurance Company: ${quotation.insuranceCompany}`, 50, yPosition);
          yPosition += 15;
        }
        
        if (quotation.accidentDate) {
          doc.text(`Accident Date: ${quotation.accidentDate.toLocaleDateString()}`, 50, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      }

      // Items table
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Items:', 50, yPosition);

      yPosition += 30;

      // Table headers
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 50, yPosition)
         .text('Qty', 350, yPosition)
         .text('Rate (LKR)', 400, yPosition)
         .text('Amount (LKR)', 480, yPosition);

      // Draw header line
      yPosition += 15;
      doc.moveTo(50, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      yPosition += 10;

      // Table rows
      doc.font('Helvetica');
      quotation.items.forEach((item) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(item.description, 50, yPosition, { width: 280 })
           .text(item.quantity.toString(), 350, yPosition)
           .text(item.rate.toLocaleString(), 400, yPosition)
           .text(item.amount.toLocaleString(), 480, yPosition);

        yPosition += 20;
      });

      // Draw line before total
      yPosition += 10;
      doc.moveTo(350, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      // Total
      yPosition += 15;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Total Amount:', 400, yPosition)
         .text(`LKR ${quotation.totalAmount.toLocaleString()}`, 480, yPosition);

      // Remarks
      if (quotation.remarks) {
        yPosition += 40;
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Remarks:', 50, yPosition);

        yPosition += 20;
        doc.fontSize(10)
           .font('Helvetica')
           .text(quotation.remarks, 50, yPosition, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 100;
      doc.fontSize(10)
         .font('Helvetica')
         .text('Thank you for your business!', 50, footerY)
         .text('This is a computer-generated document.', 50, footerY + 15);

      // Company stamp area
      doc.fontSize(8)
         .text('Authorized Signature: ___________________', 350, footerY)
         .text('Company Stamp', 350, footerY + 30);

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
