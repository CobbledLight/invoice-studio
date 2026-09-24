import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import Decimal from 'decimal.js';
import type { Invoice, Party } from './types';
import { money } from './invoice';
function isLithuanian() { return typeof window !== 'undefined' && window.localStorage.getItem('invoice-studio-locale') === 'lt'; }
function partyLines(p: Party, lt: boolean): Content[] { return [{ text: p.name || (lt ? 'Nenurodyta' : 'Not entered'), bold: true, fontSize: 12 }, ...[p.address, p.country_code, p.registration_number && `${lt ? 'Įmonės kodas' : 'Registration'}: ${p.registration_number}`, p.tax_id && `${lt ? 'Mokesčių kodas' : 'Tax ID'}: ${p.tax_id}`, p.contact_email, p.phone].filter(Boolean).map(s => ({ text: String(s), margin: [0, 3, 0, 0] as [
            number,
            number,
            number,
            number
        ] }))]; }
export function pdfDefinition(i: Invoice): TDocumentDefinitions {
    const lt = isLithuanian();
    const tax = new Map<string, {
        net: Decimal;
        tax: Decimal;
    }>();
    for (const l of i.items) {
        const key = String(l.tax_rate), v = tax.get(key) || { net: new Decimal(0), tax: new Decimal(0) };
        v.net = v.net.plus(l.line_net || 0);
        v.tax = v.tax.plus(l.line_tax || 0);
        tax.set(key, v);
    }
    return { pageSize: 'A4', pageMargins: [40, 44, 40, 48], defaultStyle: { font: 'Roboto', fontSize: 9, color: '#253742' }, info: { title: i.number || 'Draft invoice', author: i.seller_snapshot.name || 'Invoice Studio' },
        ...(i.status === 'draft' || i.status === 'cancelled' ? { watermark: { text: i.status.toUpperCase(), color: '#748995', opacity: 0.12, bold: true } } : {}),
        footer: (current, total) => ({ text: `${i.number || 'DRAFT'}  ·  ${current} / ${total}`, alignment: 'right', fontSize: 8, color: '#7c8890', margin: [40, 15, 40, 0] }),
        content: [{ columns: [{ text: i.type === 'advance' ? (lt ? 'IŠANKSTINĖ SĄSKAITA-FAKTŪRA' : 'ADVANCE INVOICE') : (lt ? 'SĄSKAITA' : 'INVOICE'), fontSize: 23, bold: true, color: '#19664b' }, { stack: [{ text: i.number || (lt ? 'JUODRAŠTIS' : 'DRAFT'), alignment: 'right', bold: true }, { text: `${lt ? 'Išrašymo data' : 'Issued'}: ${i.issue_date}\n${lt ? 'Apmokėti iki' : 'Due'}: ${i.due_date}\n${lt ? 'Valiuta' : 'Currency'}: ${i.currency}${i.service_date ? `\n${lt ? 'Paslaugos data' : 'Service date'}: ${i.service_date}` : ''}`, alignment: 'right', margin: [0, 10, 0, 0], lineHeight: 1.4 }] }] },
            { canvas: [{ type: 'line', x1: 0, y1: 18, x2: 515, y2: 18, lineWidth: 1.5, lineColor: '#19664b' }], margin: [0, 0, 0, 38] },
            { columns: [{ stack: [{ text: lt ? 'PARDAVĖJAS' : 'FROM', fontSize: 8, color: '#73838c', margin: [0, 0, 0, 10] }, ...partyLines(i.seller_snapshot, lt)] }, { stack: [{ text: lt ? 'PIRKĖJAS' : 'BILL TO', fontSize: 8, color: '#73838c', margin: [0, 0, 0, 10] }, ...partyLines(i.customer_snapshot, lt)] }], columnGap: 30, margin: [0, 0, 0, 30] },
            ...(i.status === 'cancelled' ? [{ text: `${lt ? 'ATŠAUKTA' : 'CANCELLED'} · ${i.cancellation_reason}`, color: '#9c4456', margin: [0, 0, 0, 15] } as Content] : []),
            { table: { headerRows: 1, dontBreakRows: true, widths: ['*', 38, 63, 40, 70], body: [[lt ? 'Aprašymas' : 'Description', lt ? 'Kiekis' : 'Qty', lt ? 'Kaina' : 'Unit price', lt ? 'Mokestis' : 'Tax', lt ? 'Suma' : 'Amount'].map(text => ({ text, bold: true, fillColor: '#edf4f0', margin: [0, 6, 0, 6] })), ...i.items.map(l => [{ text: l.description || (lt ? '(Aprašymas nenurodytas)' : '(No description)'), margin: [0, 7, 0, 7] as [
                                    number,
                                    number,
                                    number,
                                    number
                                ] }, `${l.quantity}${l.unit ? ' ' + l.unit : ''}`, { text: money(l.unit_price, i.currency), alignment: 'right' as const }, `${l.tax_rate}%`, { text: money(l.line_total || 0, i.currency), alignment: 'right' as const }])] }, layout: 'lightHorizontalLines' },
            { columns: [{ width: '*', text: '' }, { width: 235, stack: [{ columns: [{ text: lt ? 'Suma be mokesčių' : 'Subtotal' }, { text: money(i.subtotal, i.currency), alignment: 'right' }], margin: [0, 15, 0, 7] }, ...Array.from(tax).map(([rate, v]) => ({ columns: [{ text: `${lt ? 'Mokestis' : 'Tax'} ${rate}% ${lt ? 'nuo' : 'on'} ${money(v.net.toFixed(2), i.currency)}` }, { text: money(v.tax.toFixed(2), i.currency), alignment: 'right' as const }], margin: [0, 0, 0, 7] as [
                                    number,
                                    number,
                                    number,
                                    number
                                    ] })), { columns: [{ text: lt ? 'IŠ VISO' : 'TOTAL', bold: true }, { text: money(i.total, i.currency), alignment: 'right', bold: true }], fontSize: 15, margin: [0, 10, 0, 0] }] }] },
                ...(i.seller_snapshot.payment_instructions ? [{ text: lt ? 'MOKĖJIMO INFORMACIJA' : 'PAYMENT DETAILS', bold: true, margin: [0, 30, 0, 8] }, { text: i.seller_snapshot.payment_instructions, lineHeight: 1.4 }] as Content[] : []),
                ...(i.notes ? [{ text: lt ? 'PASTABOS' : 'NOTES', bold: true, margin: [0, 25, 0, 8] }, { text: i.notes, lineHeight: 1.4 }] as Content[] : [])] };
}
export async function downloadPdf(i: Invoice) { const [{ default: pdfMake }, fonts] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]); pdfMake.vfs = fonts.default; pdfMake.createPdf(pdfDefinition(i)).download(`${(i.number || 'draft-' + i.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`); }
