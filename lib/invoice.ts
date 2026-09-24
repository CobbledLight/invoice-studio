import Decimal from 'decimal.js';
import type { Invoice, Item, Profile } from './types.ts';
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });
export const currencies = ['EUR', 'USD', 'GBP'];
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function addDays(date: string, n: number) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function money(n: string | number, currency = 'EUR') { return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(Number(n)); }
export function dateLabel(s: string) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(s + 'T12:00:00Z')); }
export function totals(items: Item[]) { let subtotal = new Decimal(0), tax = new Decimal(0); const lines = items.map(i => { const q = new Decimal(i.quantity || 0), p = new Decimal(i.unit_price || 0), r = new Decimal(i.tax_rate || 0); if (!q.isFinite() || !p.isFinite() || !r.isFinite() || q.lte(0) || p.lt(0) || r.lt(0) || r.gt(100))
    throw Error('Check quantities, prices and tax rates.'); const net = q.mul(p).toDecimalPlaces(2), t = net.mul(r).div(100).toDecimalPlaces(2); if (net.gte('10000000000000000') || net.plus(t).gte('10000000000000000'))
    throw Error('Line amount is too large.'); subtotal = subtotal.plus(net); tax = tax.plus(t); return { ...i, line_net: net.toFixed(2), line_tax: t.toFixed(2), line_total: net.plus(t).toFixed(2) }; }); if (subtotal.plus(tax).gte('10000000000000000'))
    throw Error('Invoice amount is too large.'); return { items: lines, subtotal: subtotal.toFixed(2), tax_total: tax.toFixed(2), total: subtotal.plus(tax).toFixed(2) }; }
export const blankItem = (): Item => ({ description: '', quantity: '1', unit: '', unit_price: '0', tax_rate: '0' });
export const emptyProfile: Profile = { details: { country_code: 'LT' }, default_currency: 'EUR', default_payment_terms_days: 14, default_notes: '' };
export function newInvoice(profile: Profile): Invoice { return { id: crypto.randomUUID(), customer_id: null, type: 'standard', status: 'draft', number: null, issue_date: today(), due_date: addDays(today(), profile.default_payment_terms_days), service_date: null, payment_terms_days: profile.default_payment_terms_days, currency: profile.default_currency, seller_snapshot: { ...profile.details }, customer_snapshot: { country_code: 'LT' }, notes: profile.default_notes, subtotal: 0, tax_total: 0, total: 0, paid_on: null, cancellation_reason: null, created_at: new Date().toISOString(), items: [blankItem()] }; }
export function duplicateInvoice(source: Invoice, profile: Profile): Invoice { const d = newInvoice(profile); return { ...d, type: source.type, customer_id: source.customer_id, customer_snapshot: { ...source.customer_snapshot }, currency: source.currency, notes: source.notes, payment_terms_days: source.payment_terms_days, due_date: addDays(today(), source.payment_terms_days), ...totals(source.items.map(({ description, quantity, unit, unit_price, tax_rate }) => ({ description, quantity, unit, unit_price, tax_rate }))) }; }
export function displayStatus(i: Invoice) { return (i.status === 'issued' || i.status === 'sent') && i.due_date < today() ? 'overdue' : i.status; }
export function validateIssue(i: Invoice) { for (const [label, party] of [['Business', i.seller_snapshot], ['Customer', i.customer_snapshot]] as const) {
    if (!party.name?.trim() || !party.address?.trim() || !party.country_code?.match(/^[A-Z]{2}$/))
        throw Error(`${label} name, address and two-letter country code are required.`);
} if (!i.items.length || i.items.length > 100 || i.items.some(x => !x.description.trim()))
    throw Error('Add 1–100 services with descriptions.'); if (i.due_date < i.issue_date)
    throw Error('Due date cannot be earlier than issue date.'); totals(i.items); }
