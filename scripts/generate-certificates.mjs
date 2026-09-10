import fs from 'node:fs';
import path from 'node:path';
import { getCadastralDataset } from '../src/services/propertyService.js';
import { createCertificate, verificationURL } from '../src/services/certificateService.js';
import { certificatePDF } from '../src/services/certificatePdf.js';
const base=process.argv[2]||process.env.ULPIN_CERTIFICATE_BASE_URL||'http://localhost:5173/';
const data=await getCadastralDataset(),out=path.resolve('certificates');
fs.mkdirSync(out,{recursive:true});
for(const p of data.properties){const certificate=createCertificate(p,data);if(!certificate.valid)throw new Error(`Record checks failed for ${p.ulpin}`);const url=verificationURL(certificate,base),id=certificate.record.certificateId;fs.writeFileSync(path.join(out,`${id}.pdf`),certificatePDF(certificate,url));fs.writeFileSync(path.join(out,`${id}.json`),JSON.stringify(certificate,null,2)+'\n');}
fs.writeFileSync(path.join(out,'README.md'),`# Demo property certificates\n\nTwelve fictional PDF certificates and their complete verification JSON records. The bundled QR codes open ${base}. Keep the application running when following a code. A phone needs a reachable LAN or hosted app URL. Regenerate with \`npm run certificates -- https://your-app.example/\` or set Application URL inside each in-app certificate dialog. These documents are not legal ownership certificates or government records.\n`);
console.log(`Created ${data.properties.length} PDFs and matching verification records in certificates/.`);
