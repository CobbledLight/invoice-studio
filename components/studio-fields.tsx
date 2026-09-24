"use client";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { Party } from '@/lib/types';
export function Field({ label, value, onChange, type = 'text', required = false, full = false, min, max, step, placeholder, maxLength = 2000 }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
    full?: boolean;
    min?: number | string;
    max?: number | string;
    step?: string;
    placeholder?: string;
    maxLength?: number;
}) { return <label className={`field ${full ? 'full' : ''}`}><span>{label}{required ? ' *' : ''}</span><Input value={value} onChange={e => onChange(e.target.value)} type={type} required={required} min={min} max={max} step={step} placeholder={placeholder} maxLength={maxLength}/></label>; }
export function TextField({ label, value, onChange, full = false, maxLength = 2000 }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    full?: boolean;
    maxLength?: number;
}) { return <label className={`field ${full ? 'full' : ''}`}><span>{label}</span><Textarea value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength}/></label>; }
export function Choice({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: {
        value: string;
        label: string;
    }[];
}) { return <div className="field"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full h-[41px] bg-white"><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem value={o.value} key={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>; }
export function PartyFields({ value, onChange, seller = false }: {
    value: Party;
    onChange: (p: Party) => void;
    seller?: boolean;
}) { const set = (key: keyof Party, v: string) => onChange({ ...value, [key]: v }); return <div className="field-grid"><Field label={seller ? 'Business name' : 'Customer name'} value={value.name || ''} onChange={v => set('name', v)} full maxLength={200}/><TextField label="Address" value={value.address || ''} onChange={v => set('address', v)} full/><Field label="Country code" placeholder="LT" value={value.country_code || ''} onChange={v => set('country_code', v.toUpperCase())} maxLength={2}/><Field label="Email" type="email" value={value.contact_email || ''} onChange={v => set('contact_email', v)}/><Field label="Registration number" value={value.registration_number || ''} onChange={v => set('registration_number', v)}/><Field label="Tax or VAT ID" value={value.tax_id || ''} onChange={v => set('tax_id', v)}/><Field label="Phone" value={value.phone || ''} onChange={v => set('phone', v)}/>{seller && <TextField label="Payment instructions" value={value.payment_instructions || ''} onChange={v => set('payment_instructions', v)} full/>}</div>; }
