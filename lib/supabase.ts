import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> { if (!supabase)
    throw Error('Supabase is not configured. Follow the project README.'); const { data, error } = await supabase.rpc(name, args); if (error) {
    if (error.code === 'PGRST202')
        throw Error('Database setup is needed. Apply supabase/migrations/202609230001_invoice_studio.sql in the Supabase SQL editor, then retry.');
    throw Error(error.message);
} return data as T; }
