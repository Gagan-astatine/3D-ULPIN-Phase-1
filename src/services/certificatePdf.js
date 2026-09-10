import QRCode from 'qrcode';
import { certificateFonts } from './certificateFonts.js';
// A small one-page vector PDF writer. QR modules remain sharp when printed.
// The JSON certificate carries the full record; this PDF is its readable cover.
export function certificatePDF(certificate,url){
  const {record:r,digest,valid}=certificate,p=r.property;
  const safe=value=>String(value).normalize('NFKD').replace(/[^\x20-\x7e]/g,' ').replace(/([\\()])/g,'\\$1');
  const ops=[];
  const fill=c=>ops.push(`${c} rg`);
  const rect=(x,y,w,h)=>ops.push(`${x} ${842-y-h} ${w} ${h} re f`);
  const text=(value,x,y,size=11,bold=false)=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${842-y} Tm (${safe(value)}) Tj ET`);
  fill('0.98 0.985 0.99');rect(0,0,595,842);
  fill('0.025 0.12 0.2');rect(0,0,595,123);
  fill('1 1 1');text('3D ULPIN',36,40,22,true);text('PROPERTY VISUALIZATION CERTIFICATE',36,74,16,true);text('FICTIONAL DEMO RECORD',36,100,10,true);
  fill('0.06 0.19 0.27');text(r.certificateId,36,153,12,true);text(p.name,36,189,22,true);text(p.ulpin,36,216,15,true);
  const fields=[['PROPERTY CATEGORY',p.category],['ADDRESS',p.address],['PARCEL / BUILDING',`${p.parcelId} / ${p.buildingId}`],['LAND / BUILT-UP AREA',`${p.landArea} m2 / ${p.builtUpArea} m2`],['FLOORS / FLOOR-STACK HEIGHT',`${p.numberOfFloors} floors / ${p.buildingHeight} m`],['COORDINATE REFERENCE',p.crs],['DEMO TENURE',p.tenure],['ISSUE DATE / DATA REVISION',`${r.issuedOn} / ${r.revision}`]];
  fields.forEach(([label,value],i)=>{const y=249+i*34;fill('0.34 0.43 0.49');text(label,36,y,8,true);fill('0.06 0.19 0.27');text(value,36,y+15,11);});
  fill(valid?'0.08 0.36 0.29':'0.6 0.2 0.1');text(valid?'DEMO RECORD CHECKS PASSED':'DEMO RECORD CHECKS FAILED',36,550,12,true);
  fill('0.18 0.27 0.34');text('Checks cover data relationships, coordinates, floors, areas and units.',36,570,10);
  text('They do not establish legal ownership or cadastral survey accuracy.',36,586,10);
  const qr=QRCode.create(url,{errorCorrectionLevel:'M'}),n=qr.modules.size,scale=132/(n+8),x=422,y=619;
  fill('1 1 1');rect(x,y,132,132);fill('0.015 0.06 0.1');
  for(let row=0;row<n;row++)for(let col=0;col<n;col++)if(qr.modules.get(row,col))rect(x+(col+4)*scale,y+(row+4)*scale,scale+.015,scale+.015);
  text('SCAN TO VERIFY',430,770,9,true);text('SHA-256 RECORD FINGERPRINT',36,638,9,true);text(digest.slice(0,32),36,658,10);text(digest.slice(32),36,675,10);text('Verify against the same application dataset.',36,700,10);text('No digital signature or government attestation.',36,717,10);
  fill('0.025 0.12 0.2');rect(0,790,595,52);fill('1 1 1');text('DEMO DATA - Not an official government land or ownership record.',36,811,10,true);text('Fictional cadastral information for visualization purposes only.',36,828,9);
  const stream=ops.join('\n'),objects=[
    '<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R /Annots [7 0 R] >>',
    ...certificateFonts.map((f,i)=>`<< /Type /Font /Subtype /TrueType /BaseFont /${f.name} /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 126 /Widths [${f.widths.join(' ')}] /FontDescriptor ${8+i} 0 R >>`),
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Annot /Subtype /Link /Rect [422 72 554 223] /Border [0 0 0] /A << /S /URI /URI (${safe(url)}) >> >>`,
    ...certificateFonts.map((f,i)=>`<< /Type /FontDescriptor /FontName /${f.name} /Flags 32 /FontBBox [${f.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${f.ascent} /Descent ${f.descent} /CapHeight 730 /StemV 80 /FontFile2 ${10+i} 0 R >>`),
    ...certificateFonts.map(f=>`<< /Length ${f.hex.length+1} /Length1 ${f.hex.length/2} /Filter /ASCIIHexDecode >>\nstream\n${f.hex}>\nendstream`)
  ];
  let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const start=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;offsets.slice(1).forEach(o=>pdf+=`${String(o).padStart(10,'0')} 00000 n \n`);pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
