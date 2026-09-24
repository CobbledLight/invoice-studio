import {rolldown} from 'rolldown';
import {writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const bundle=await rolldown({input:'./lib/pdf.ts',platform:'node',external:['pdfmake/build/pdfmake','pdfmake/build/vfs_fonts']});
await bundle.write({file:'.sites-runtime/pdf-definition.mjs',format:'esm'});await bundle.close();
const {pdfDefinition}=await import(pathToFileURL(path.resolve('.sites-runtime/pdf-definition.mjs')));
const {default:pdfMake}=await import('pdfmake/build/pdfmake.js');
const {default:vfs}=await import('pdfmake/build/vfs_fonts.js');pdfMake.vfs=vfs;
const party={name:'Žilvinas Design Studio',address:'Gedimino pr. 12, Vilnius',country_code:'LT',tax_id:'LT123456789',contact_email:'sample@example.com'};
const invoice={id:'pdf-check',type:'standard',number:'INV-2026-000001',status:'issued',issue_date:'2026-09-24',due_date:'2026-10-08',service_date:null,currency:'EUR',seller_snapshot:party,customer_snapshot:{...party,name:'Northstar Studio'},notes:'Thank you for your business.',subtotal:100,tax_total:21,total:121,items:[{description:'Design consultation – ĄČĘĖĮŠŲŪŽ',quantity:2,unit:'hours',unit_price:50,tax_rate:21,line_net:100,line_tax:21,line_total:121}]};
mkdirSync('.sites-runtime/pdf-qa',{recursive:true});
for(const [name,count]of [['single',1],['long',100]]){const i={...invoice,items:Array.from({length:count},(_,n)=>({...invoice.items[0],description:`${n+1}. ${invoice.items[0].description}` })),subtotal:100*count,tax_total:21*count,total:121*count};await new Promise((resolve,reject)=>{try{pdfMake.createPdf(pdfDefinition(i)).getBuffer(b=>{writeFileSync(`.sites-runtime/pdf-qa/${name}.pdf`,b);resolve()})}catch(e){reject(e)}})}
console.log('PASS generated single-page and 100-line PDF fixtures');
