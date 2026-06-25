import PDFDocument from 'pdfkit';
import { s3Service } from './s3.service';

export interface OfferLetterData {
  id: string;
  workerName: string;
  companyName: string;
  role: string;
  salary: number;
  startDate: Date;
  city: string;
  contactName?: string | null;
  // E-signature state — when present, the signature block is "signed".
  esignEmployerAt?: Date | null;
  esignWorkerAt?: Date | null;
}

const NAVY = '#0C447C';
const AMBER = '#B26A07';
const INK = '#16202E';
const SUB = '#5A6675';

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// A professional, India-style appointment/offer letter with e-signature blocks.
function buildBuffer(hire: OfferLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const role = (hire.role || 'General').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const refId = `KD/${new Date().getFullYear()}/${hire.id.slice(0, 8).toUpperCase()}`;

    // ── Letterhead ──
    doc.fillColor(NAVY).fontSize(22).font('Helvetica-Bold').text('KaamDhaam', left, 50);
    doc.fillColor(SUB).fontSize(9).font('Helvetica').text('Verified Blue-Collar Hiring Platform', { continued: false });
    doc.moveTo(left, 84).lineTo(right, 84).lineWidth(2).strokeColor(AMBER).stroke();
    doc.moveDown(2);

    // ── Ref + date ──
    doc.fillColor(SUB).fontSize(10).font('Helvetica');
    doc.text(`Ref: ${refId}`, left, 98);
    doc.text(`Date: ${fmtDate(new Date())}`, left, 98, { align: 'right' });
    doc.moveDown(2);

    // ── Title ──
    doc.fillColor(INK).fontSize(15).font('Helvetica-Bold').text('LETTER OF APPOINTMENT', { align: 'center' });
    doc.moveDown(1.5);

    // ── Addressee + body ──
    doc.fillColor(INK).fontSize(11).font('Helvetica');
    doc.text(`Dear ${hire.workerName || 'Candidate'},`);
    doc.moveDown(0.8);
    doc.text(
      `With reference to your application and subsequent verification on the KaamDhaam platform, ` +
      `we are pleased to offer you the position of ${role} at ${hire.companyName}. ` +
      `The terms and conditions of your appointment are set out below.`,
      { align: 'justify', lineGap: 3 },
    );
    doc.moveDown(1);

    // ── Terms table ──
    doc.fillColor(NAVY).fontSize(12).font('Helvetica-Bold').text('Terms of Employment');
    doc.moveDown(0.5);
    const rows: [string, string][] = [
      ['Designation', role],
      ['Employer', hire.companyName],
      ['Work Location', hire.city || '—'],
      ['Monthly Salary', `Rs. ${hire.salary.toLocaleString('en-IN')}`],
      ['Date of Joining', fmtDate(hire.startDate)],
      ['Employment Type', 'Full-time'],
    ];
    doc.fontSize(11).font('Helvetica');
    rows.forEach(([k, v]) => {
      const y = doc.y;
      doc.fillColor(SUB).font('Helvetica').text(k, left + 6, y, { width: 160 });
      doc.fillColor(INK).font('Helvetica-Bold').text(v, left + 176, y, { width: right - left - 176 });
      doc.moveDown(0.4);
    });
    doc.moveDown(0.8);

    // ── Clauses ──
    doc.fillColor(INK).fontSize(10.5).font('Helvetica');
    const clauses = [
      'This appointment is subject to your continued background verification, which is renewed every 180 days as per platform policy.',
      'You are expected to discharge your duties diligently and abide by the employer’s workplace rules and applicable law.',
      'Either party may terminate this engagement with reasonable notice as mutually agreed.',
      'This offer is valid for 7 days from the date above and is governed by the laws of India.',
    ];
    clauses.forEach((c, i) => { doc.text(`${i + 1}.  ${c}`, { align: 'justify', lineGap: 2 }); doc.moveDown(0.3); });
    doc.moveDown(1.5);

    // ── Signature blocks ──
    const sigY = doc.y + 10;
    const colW = (right - left) / 2;
    drawSignature(doc, left, sigY, colW - 20, 'For ' + hire.companyName, hire.contactName || hire.companyName, hire.esignEmployerAt, AMBER);
    drawSignature(doc, left + colW + 20, sigY, colW - 20, 'Accepted by', hire.workerName, hire.esignWorkerAt, NAVY);

    // ── Footer ──
    doc.fillColor(SUB).fontSize(8).font('Helvetica').text(
      'This is a digitally generated offer letter via KaamDhaam. Typed e-signatures with timestamps are valid under the Information Technology Act, 2000.',
      left, doc.page.height - 70, { width: right - left, align: 'center' },
    );

    doc.end();
  });
}

function drawSignature(
  doc: PDFKit.PDFDocument, x: number, y: number, w: number,
  heading: string, name: string, signedAt: Date | null | undefined, color: string,
) {
  doc.fillColor(SUB).fontSize(9).font('Helvetica').text(heading, x, y, { width: w });
  if (signedAt) {
    // Typed e-signature in a script-like oblique face.
    doc.fillColor(color).fontSize(18).font('Helvetica-BoldOblique').text(name, x, y + 16, { width: w });
    doc.fillColor(SUB).fontSize(8).font('Helvetica').text(`Digitally signed on ${fmtDate(signedAt)}`, x, y + 42, { width: w });
  } else {
    doc.moveTo(x, y + 44).lineTo(x + w, y + 44).lineWidth(1).strokeColor('#BBBBBB').stroke();
    doc.fillColor('#AAAAAA').fontSize(8).font('Helvetica').text('Pending signature', x, y + 48, { width: w });
  }
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(name, x, y + 62, { width: w });
}

export const offerLetterService = {
  generateBuffer(hire: OfferLetterData): Promise<Buffer> {
    return buildBuffer(hire);
  },
  async generate(hire: OfferLetterData): Promise<string> {
    const buffer = await buildBuffer(hire);
    const key = `offer-letters/${hire.id}.pdf`;
    return s3Service.upload(key, buffer, 'application/pdf');
  },
};
