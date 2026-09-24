export type Party = {
    name?: string;
    address?: string;
    country_code?: string;
    registration_number?: string;
    tax_id?: string;
    contact_email?: string;
    phone?: string;
    payment_instructions?: string;
};
export type Status = 'draft' | 'issued' | 'paid' | 'cancelled';
export type Item = {
    id?: string;
    position?: number;
    description: string;
    quantity: string | number;
    unit?: string;
    unit_price: string | number;
    tax_rate: string | number;
    line_net?: string | number;
    line_tax?: string | number;
    line_total?: string | number;
};
export type Invoice = {
    id: string;
    customer_id: string | null;
    type: 'standard' | 'advance';
    status: Status;
    number: string | null;
    issue_date: string;
    due_date: string;
    service_date: string | null;
    payment_terms_days: number;
    currency: string;
    seller_snapshot: Party;
    customer_snapshot: Party;
    notes: string;
    subtotal: number | string;
    tax_total: number | string;
    total: number | string;
    issued_at?: string | null;
    paid_on: string | null;
    cancelled_at?: string | null;
    cancellation_reason: string | null;
    created_at: string;
    updated_at?: string;
    items: Item[];
};
export type Customer = {
    id: string;
    name: string;
    details: Party;
    archived_at: string | null;
};
export type Profile = {
    details: Party;
    default_currency: string;
    default_payment_terms_days: number;
    default_notes: string;
};
export type Workspace = {
    profile: Profile;
    customers: Customer[];
    invoices: Invoice[];
};
