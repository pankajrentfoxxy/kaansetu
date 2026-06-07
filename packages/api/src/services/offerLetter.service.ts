import PDFDocument from 'pdfkit';
import { s3Service } from './s3.service';

export const offerLetterService = {
  async generate(hire: {
    id: string;
    workerName: string;
    companyName: string;
    role: string;
    salary: number;
    startDate: Date;
    city: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const key = `offer-letters/${hire.id}.pdf`;
        const url = await s3Service.upload(key, buffer, 'application/pdf');
        resolve(url);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('KaamSetu', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Verified Blue-Collar Job Platform', { align: 'center' });
      doc.moveDown(2);

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text('OFFER LETTER', { align: 'center' });
      doc.moveDown();

      // Content
      doc.fontSize(12).font('Helvetica');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown();
      doc.text(`Dear ${hire.workerName},`);
      doc.moveDown();
      doc.text(
        `We are pleased to offer you the position of ${hire.role} at ${hire.companyName}. ` +
        `This offer is contingent upon completion of all required verifications.`,
        { lineGap: 4 }
      );
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Employment Details:');
      doc.font('Helvetica');
      doc.text(`Role: ${hire.role}`);
      doc.text(`Company: ${hire.companyName}`);
      doc.text(`Monthly Salary: ₹${hire.salary.toLocaleString('en-IN')}`);
      doc.text(`Start Date: ${hire.startDate.toLocaleDateString('en-IN')}`);
      doc.text(`Work Location: ${hire.city}`);
      doc.moveDown(2);
      doc.text('Continuous verification notice: This worker\'s background check will be renewed every 180 days.');
      doc.moveDown(2);

      doc.text('_______________________', { align: 'left' });
      doc.text('Worker Signature', { align: 'left' });
      doc.moveDown();
      doc.text('_______________________', { align: 'right' });
      doc.text('Employer Signature', { align: 'right' });

      doc.end();
    });
  },
};
