"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Decimal from 'decimal.js';
import { FileText, Users, Building2, Plus, Search, LayoutGrid, LogOut, ChevronLeft, ChevronRight, FileDown, Archive, RotateCcw } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { Toaster, toast } from 'sonner';
import { AuthScreen, Brand } from './auth-screen';
import { Choice, Field, TextField, PartyFields } from './studio-fields';
import { InvoiceEditor } from './invoice-editor';
import { InvoiceDetail, StatusBadge } from './invoice-detail';
import { supabase, rpc } from '@/lib/supabase';
import { demoWorkspace } from '@/lib/demo';
import { newInvoice, duplicateInvoice, totals, validateIssue, money, dateLabel, today, currencies, displayStatus } from '@/lib/invoice';
import { downloadPdf } from '@/lib/pdf';
import type { Workspace, Invoice, Customer, Profile } from '@/lib/types';
type View = 'invoices' | 'customers' | 'profile' | 'editor' | 'detail';
export default function Studio() {
    const [session, setSession] = useState<Session | null>(null), [authReady, setAuthReady] = useState(false), [recovery, setRecovery] = useState(false), [demo, setDemo] = useState(false), [data, setData] = useState<Workspace | null>(null), [view, setView] = useState<View>('invoices'), [draft, setDraft] = useState<Invoice | null>(null), [selected, setSelected] = useState<string | null>(null), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [loading, setLoading] = useState(false), [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [type, setType] = useState('all'), [page, setPage] = useState(1), [customerFilter, setCustomerFilter] = useState('active'), [customerEdit, setCustomerEdit] = useState<Customer | null>(null), [customerError, setCustomerError] = useState(''), [action, setAction] = useState<string | null>(null), [paidDate, setPaidDate] = useState(today()), [reason, setReason] = useState(''), [leave, setLeave] = useState<(() => void) | null>(null), [metricCurrency, setMetricCurrency] = useState('EUR');
    const dataRef = useRef(data);
    dataRef.current = data;
    const selectedInvoice = data?.invoices.find(i => i.id === selected);
    useEffect(() => { setRecovery(new URLSearchParams(location.search).get('recovery') === '1'); if (!supabase) {
        setAuthReady(true);
        return;
    } let active = true; supabase.auth.getSession().then(({ data, error }) => { if (active) {
        setSession(data.session);
        setAuthReady(true);
        if (error)
            setError(error.message);
    } }); const { data: sub } = supabase.auth.onAuthStateChange((event, s) => { if (active) {
        setSession(s);
        setAuthReady(true);
        if (event === 'PASSWORD_RECOVERY')
            setRecovery(true);
        if (event === 'SIGNED_OUT') {
            setData(null);
            setView('invoices');
            setDirty(false);
        }
    } }); return () => { active = false; sub.subscription.unsubscribe(); }; }, []);
    const reload = useCallback(async () => { const w = await rpc<Workspace>('studio_workspace'); setData(w); return w; }, []);
    useEffect(() => { if (demo || !session)
        return; let current = true; setData(null); setLoading(true); setError(''); rpc<Workspace>('studio_workspace').then(w => { if (current) {
        setData(w);
        setMetricCurrency(w.profile.default_currency);
    } }).catch(e => { if (current)
        setError(e.message); }).finally(() => { if (current)
        setLoading(false); }); return () => { current = false; }; }, [session?.user.id, demo]);
    useEffect(() => { if (!dirty)
        return; const prevent = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; addEventListener('beforeunload', prevent); return () => removeEventListener('beforeunload', prevent); }, [dirty]);
    useEffect(() => { setPage(1); }, [search, status, type]);
    function navigate(next: View) { const go = () => { setView(next); setError(''); setSearch(''); setDirty(false); }; if (dirty)
        setLeave(() => go);
    else
        go(); }
    function create() { if (!data)
        return; const go = () => { setDraft(newInvoice(data.profile)); setView('editor'); setError(''); setDirty(false); }; if (dirty)
        setLeave(() => go);
    else
        go(); }
    function open(i: Invoice) { setSelected(i.id); setView('detail'); setError(''); }
    function replaceInvoice(i: Invoice) { setData(d => d ? { ...d, invoices: [i, ...d.invoices.filter(x => x.id !== i.id)] } : d); }
    async function run(fn: () => Promise<void>) { if (busy)
        return; setBusy(true); setError(''); try {
        await fn();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please retry.');
    }
    finally {
        setBusy(false);
    } }
    async function save(issue: boolean, pdf = false) { if (!draft || !data)
        return; await run(async () => { if (draft.due_date < draft.issue_date)
        throw Error('Due date cannot be earlier than issue date.'); if (issue)
        validateIssue(draft); let saved: Invoice; if (demo) {
        saved = { ...draft, ...totals(draft.items) };
        if (issue)
            saved = demoAction(saved, 'issue');
        replaceInvoice(saved);
    }
    else {
        saved = await rpc<Invoice>('studio_save_draft', { payload: draft });
        if (issue)
            saved = await rpc<Invoice>('studio_invoice_action', { invoice_id: saved.id, action: 'issue' });
        replaceInvoice(saved);
    } setDraft(saved); setDirty(false); open(saved); toast.success(issue ? 'Invoice issued' : 'Draft saved'); if (pdf)
        await downloadPdf(saved); }); }
    function demoAction(i: Invoice, a: string): Invoice { if (a === 'duplicate')
        return duplicateInvoice(i, dataRef.current!.profile); if (a === 'issue') {
        validateIssue(i);
        const prefix = i.type === 'advance' ? 'ADV' : 'INV', year = i.issue_date.slice(0, 4);
        const max = Math.max(0, ...dataRef.current!.invoices.filter(x => x.number?.startsWith(`${prefix}-${year}-`)).map(x => Number(x.number!.split('-').at(-1))));
        return { ...i, status: 'issued', number: `${prefix}-${year}-${String(max + 1).padStart(6, '0')}`, issued_at: new Date().toISOString() };
    } if (a === 'pay') {
        if (paidDate < i.issue_date || paidDate > today())
            throw Error('Payment date must be between issue date and today.');
        return { ...i, status: 'paid', paid_on: paidDate };
    } if (a === 'unpay')
        return { ...i, status: 'issued', paid_on: null }; if (a === 'cancel') {
        if (!reason.trim())
            throw Error('Add a cancellation reason.');
        return { ...i, status: 'cancelled', cancellation_reason: reason, cancelled_at: new Date().toISOString() };
    } return i; }
    async function perform(a: string) { if (!selectedInvoice)
        return; await run(async () => { if (a === 'issue')
        validateIssue(selectedInvoice); if (a === 'delete') {
        if (demo)
            setData(d => ({ ...d!, invoices: d!.invoices.filter(i => i.id !== selectedInvoice.id) }));
        else {
            await rpc('studio_invoice_action', { invoice_id: selectedInvoice.id, action: a });
            await reload();
        }
        setView('invoices');
        setAction(null);
        toast.success('Draft deleted');
        return;
    } const result = demo ? demoAction(selectedInvoice, a) : await rpc<Invoice>('studio_invoice_action', { invoice_id: selectedInvoice.id, action: a, payload: { paid_on: paidDate, reason } }); replaceInvoice(result); setAction(null); if (a === 'duplicate') {
        setDraft(result);
        setSelected(result.id);
        setView('editor');
        setDirty(false);
        toast.success('New draft created');
    }
    else
        toast.success('Invoice updated'); }); }
    async function pdf(i: Invoice) { await run(async () => { let current = i; if (!demo) {
        const w = await reload();
        const found = w.invoices.find(v => v.id === i.id);
        if (!found)
            throw Error('Invoice no longer available.');
        current = found;
    } await downloadPdf(current); }); }
    async function saveContact(c: Customer): Promise<Customer> { if (!c.name.trim())
        throw Error('Customer name is required.'); let saved: Customer; if (demo)
        saved = { ...c, id: c.id || crypto.randomUUID() };
    else
        saved = await rpc<Customer>('studio_save_customer', { payload: c }); setData(d => ({ ...d!, customers: [saved, ...d!.customers.filter(x => x.id !== saved.id)] })); return saved; }
    async function contactFromDraft() { if (!draft)
        return; setBusy(true); setError(''); try {
        const { name, ...details } = draft.customer_snapshot;
        const result = await saveContact({ id: crypto.randomUUID(), name: name || '', details, archived_at: null });
        toast.success('Contact saved');
        return result;
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save contact');
    }
    finally {
        setBusy(false);
    } }
    async function saveProfile(profile: Profile) { await run(async () => { const saved = demo ? profile : await rpc<Profile>('studio_save_profile', { payload: profile }); setData(d => ({ ...d!, profile: saved })); toast.success('Business profile saved'); }); }
    function startDemo() { setData(demoWorkspace()); setDemo(true); setView('invoices'); setError(''); setMetricCurrency('EUR'); }
    async function exit() { const go = async () => { if (demo) {
        setDemo(false);
        setData(null);
    }
    else {
        const result = await supabase?.auth.signOut();
        if (result?.error) {
            setError(result.error.message);
            return;
        }
        setSession(null);
        setData(null);
    } setDirty(false); setView('invoices'); }; if (dirty)
        setLeave(() => () => void go());
    else
        await go(); }
    useEffect(() => { const context = (document as unknown as {
        modelContext?: {
            registerTool: (tool: unknown, options: {
                signal: AbortSignal;
            }) => void | Promise<void>;
        };
    }).modelContext; if (!context?.registerTool || !data)
        return; const lifecycle = new AbortController(); const tools = [{ name: 'list_visible_invoices', description: 'Read invoice summaries from the current signed-in or sample workspace. Does not modify records.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute(input: unknown) { if (!input || typeof input !== 'object' || Object.keys(input).length)
                throw Error('Expected an empty object.'); return dataRef.current!.invoices.map(({ id, number, status, total, currency }) => ({ id, number, status, total, currency })); } }, { name: 'start_invoice_creation', description: 'Open an unsaved new invoice form. Does not save or issue an invoice.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input: unknown) { if (!input || typeof input !== 'object' || Object.keys(input).length)
                throw Error('Expected an empty object.'); if (dirty)
                throw Error('Save or discard the current draft first.'); create(); return { view: 'invoice_editor', saved: false }; } }]; for (const tool of tools)
        try {
            void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => { });
        }
        catch { } return () => lifecycle.abort(); }, [!!data, dirty]);
    if (!authReady)
        return <div className="loading-state">Opening your workspace…</div>;
    if (recovery || (!demo && !session))
        return <><AuthScreen onDemo={startDemo} recovery={recovery} onRecovered={() => setRecovery(false)}/><Toaster /></>;
    const invoices = data?.invoices || [], curInvoices = invoices.filter(i => i.currency === metricCurrency), filtered = invoices.filter(i => (status === 'all' || displayStatus(i) === status) && (type === 'all' || i.type === type) && `${i.number || 'Draft'} ${i.customer_snapshot.name || ''}`.toLowerCase().includes(search.toLowerCase()));
    const pages = Math.max(1, Math.ceil(filtered.length / 8)), safePage = Math.min(page, pages), shown = filtered.slice((safePage - 1) * 8, safePage * 8);
    const sum = (s: string) => curInvoices.filter(i => i.status === s).reduce((n, i) => n.plus(i.total), new Decimal(0)).toFixed(2);
    const title = view === 'customers' ? 'Customers' : view === 'profile' ? 'Business profile' : 'Invoices';
    return <SidebarProvider><Sidebar className="studio-sidebar"><SidebarHeader><Brand /></SidebarHeader><SidebarContent><div className="nav-label">WORKSPACE</div><SidebarMenu>{[{ icon: FileText, label: 'Invoices', view: 'invoices' }, { icon: Users, label: 'Customers', view: 'customers' }, { icon: Building2, label: 'Business profile', view: 'profile' }].map(({ icon: Icon, label, view: v }) => <SidebarMenuItem key={v}><SidebarMenuButton isActive={title === label} onClick={() => navigate(v as View)}><Icon size={19}/><span>{label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="sidebar-note"><LayoutGrid size={18}/><p>Everything in one place</p><span>Your invoices, customers and business details.</span></div></SidebarContent><SidebarFooter><div className="account"><span className="avatar">{(data?.profile.details.name || session?.user.email || 'IG').slice(0, 2).toUpperCase()}</span><div style={{ minWidth: 0 }}><strong className="truncate max-w-32">{data?.profile.details.name || 'Your workspace'}</strong><small>{demo ? 'Sample workspace' : 'Personal account'}</small></div><button className="signout" aria-label={demo ? 'Exit sample workspace' : 'Sign out'} onClick={exit}><LogOut size={17}/></button></div></SidebarFooter></Sidebar><SidebarInset><header className="topbar"><div><SidebarTrigger /><span>Workspace <span className="crumb">/</span> {title}</span></div>{demo ? <button className="preview-tag" onClick={exit}>Sample workspace · Exit</button> : <span className="muted text-sm truncate max-w-48">{session?.user.email}</span>}</header><main className="workspace">{error && <div role="alert" className="error-message">{error}{!data && !loading && <Button variant="outline" className="ml-4" onClick={() => run(async () => { await reload(); })}>Retry connection</Button>}</div>}{loading && <div className="loading-state">Loading your invoices…</div>}{data && <>{view === 'invoices' && <><div className="page-heading"><div><div className="eyebrow">YOUR BUSINESS AT A GLANCE</div><h1>Invoices</h1><p>Create, track and keep things moving.</p></div><Button className="primary" onClick={create}><Plus size={18}/>New invoice</Button></div><div className="flex justify-end mb-3"><Choice label="Summary currency" value={metricCurrency} onChange={setMetricCurrency} options={currencies.map(c => ({ value: c, label: c }))}/></div><div className="metrics">{[['Outstanding', money(sum('issued'), metricCurrency), `${curInvoices.filter(i => i.status === 'issued').length} invoices awaiting payment`], ['Paid', money(sum('paid'), metricCurrency), `${curInvoices.filter(i => i.status === 'paid').length} invoices settled`], ['Drafts', String(invoices.filter(i => i.status === 'draft').length), 'Ready when you are']].map(([label, value, note]) => <section className="metric" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></section>)}</div><section className="invoice-panel"><div className="panel-toolbar"><div><h2>All invoices <span className="count">{invoices.length}</span></h2><p>Your latest documents, all together.</p></div><div className="search"><Search size={17}/><Input aria-label="Search invoices" placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)}/></div></div><div className="filters"><Choice label="Status" value={status} onChange={setStatus} options={['all', 'draft', 'issued', 'overdue', 'paid', 'cancelled'].map(s => ({ value: s, label: s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1) }))}/><Choice label="Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, { value: 'standard', label: 'Standard' }, { value: 'advance', label: 'Advance' }]}/></div>{shown.length ? <><Table><TableHeader><TableRow>{['Invoice', 'Customer', 'Issue date', 'Amount', 'Status', ''].map((v, n) => <TableHead key={n}>{v}</TableHead>)}</TableRow></TableHeader><TableBody>{shown.map(i => <TableRow key={i.id}><TableCell><button className="row-link invoice-id" onClick={() => open(i)}><span className="document-icon"><FileText size={18}/></span>{i.number || 'Draft'}</button><small className="subtext ml-11">{i.type === 'advance' ? 'Advance invoice' : 'Standard invoice'}</small></TableCell><TableCell><button className="row-link" onClick={() => open(i)}><strong>{i.customer_snapshot.name || 'No customer yet'}</strong></button><small className="subtext">Due {dateLabel(i.due_date)}</small></TableCell><TableCell>{dateLabel(i.issue_date)}</TableCell><TableCell className="amount">{money(i.total, i.currency)}</TableCell><TableCell><StatusBadge invoice={i}/></TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`Download ${i.number || 'draft'} PDF`} disabled={busy} onClick={() => pdf(i)}><FileDown size={17}/></Button></TableCell></TableRow>)}</TableBody></Table><div className="table-footer"><span>Showing {(safePage - 1) * 8 + 1}–{Math.min(safePage * 8, filtered.length)} of {filtered.length}</span><Pagination className="w-auto mx-0"><PaginationContent><PaginationItem><Button variant="outline" size="icon" disabled={safePage === 1} aria-label="Previous page" onClick={() => setPage(safePage - 1)}><ChevronLeft size={16}/></Button></PaginationItem><PaginationItem><span className="px-2">{safePage} / {pages}</span></PaginationItem><PaginationItem><Button variant="outline" size="icon" disabled={safePage === pages} aria-label="Next page" onClick={() => setPage(safePage + 1)}><ChevronRight size={16}/></Button></PaginationItem></PaginationContent></Pagination></div></> : <div className="empty-state"><FileText size={32}/><h2>{invoices.length ? 'No matching invoices' : 'Your first invoice starts here'}</h2><p>{invoices.length ? 'Try a different search or filter.' : 'Add your business details, then create an invoice.'}</p><Button className="primary mt-6" onClick={create}><Plus size={17}/>New invoice</Button></div>}</section></>}{view === 'editor' && draft && <InvoiceEditor invoice={draft} setInvoice={i => { setDraft(i); setDirty(true); }} workspace={data} busy={busy} save={save} onBack={() => navigate('invoices')} saveContact={contactFromDraft}/>}{view === 'detail' && selectedInvoice && <InvoiceDetail invoice={selectedInvoice} onBack={() => navigate('invoices')} onEdit={() => { setDraft(structuredClone(selectedInvoice)); setView('editor'); setDirty(false); }} onAction={a => { if (a === 'duplicate')
        void perform(a);
    else {
        setAction(a);
        setPaidDate(today());
        setReason('');
    } }} onPdf={() => pdf(selectedInvoice)} busy={busy}/>}{view === 'profile' && <ProfileForm profile={data.profile} save={saveProfile} busy={busy}/>}{view === 'customers' && <><div className="page-heading"><div><div className="eyebrow">PEOPLE YOU WORK WITH</div><h1>Customers</h1><p>Keep their details handy for the next project.</p></div><Button className="primary" onClick={() => { setCustomerEdit({ id: crypto.randomUUID(), name: '', details: { country_code: 'LT' }, archived_at: null }); setCustomerError(''); }}><Plus size={18}/>New customer</Button></div><div className="flex gap-4 mb-6 flex-wrap items-end"><div className="search"><Search size={17}/><Input aria-label="Search customers" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}/></div><Choice label="Show customers" value={customerFilter} onChange={setCustomerFilter} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]}/></div><div className="customer-grid">{data.customers.filter(c => (customerFilter === 'active' ? !c.archived_at : !!c.archived_at) && `${c.name} ${c.details.contact_email || ''}`.toLowerCase().includes(search.toLowerCase())).map(c => <section className="customer-card" key={c.id}><span className="avatar">{c.name.slice(0, 2).toUpperCase()}</span><h2>{c.name}</h2><p>{c.details.contact_email || 'No email added'}<br />{c.details.country_code || 'No country added'}</p><div className="actions"><button className="text-button" onClick={() => { setCustomerEdit(structuredClone(c)); setCustomerError(''); }}>Edit details</button><Button variant="ghost" size="icon" disabled={busy} aria-label={c.archived_at ? 'Restore customer' : 'Archive customer'} onClick={() => run(async () => { await saveContact({ ...c, archived_at: c.archived_at ? null : new Date().toISOString() }); toast.success(c.archived_at ? 'Customer restored' : 'Customer archived'); })}>{c.archived_at ? <RotateCcw size={16}/> : <Archive size={16}/>}</Button></div></section>)}</div>{!data.customers.some(c => (customerFilter === 'active' ? !c.archived_at : !!c.archived_at) && `${c.name} ${c.details.contact_email || ''}`.toLowerCase().includes(search.toLowerCase())) && <div className="empty-state"><Users size={32}/><h2>No customers here yet</h2><p>Create a contact to reuse their details on invoices.</p></div>}</>}{demo && <p className="preview-notice">Sample workspace · Changes reset when you leave or refresh. Sign in to save real invoices.</p>}</>}</main></SidebarInset><Toaster richColors position="bottom-right"/>
 <Dialog open={!!customerEdit} onOpenChange={v => { if (!v && !busy)
        setCustomerEdit(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Customer details</DialogTitle><DialogDescription>Save contact details for future invoices. Existing invoices keep their original details.</DialogDescription></DialogHeader>{customerEdit && <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setCustomerError(''); try {
        await saveContact(customerEdit);
        setCustomerEdit(null);
        toast.success('Customer saved');
    }
    catch (e) {
        setCustomerError(e instanceof Error ? e.message : 'Unable to save');
    }
    finally {
        setBusy(false);
    } }}>{customerError && <div role="alert" className="error-message">{customerError}</div>}<PartyFields value={{ ...customerEdit.details, name: customerEdit.name }} onChange={v => { const { name, ...details } = v; setCustomerEdit({ ...customerEdit, name: name || '', details }); }}/><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => setCustomerEdit(null)} disabled={busy}>Cancel</Button><Button className="primary" type="submit" disabled={busy}>Save customer</Button></DialogFooter></form>}</DialogContent></Dialog>
 <AlertDialog open={!!action} onOpenChange={v => { if (!v && !busy)
        setAction(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{action === 'pay' ? 'Record full payment' : action === 'cancel' ? 'Cancel this invoice?' : action === 'delete' ? 'Delete this draft?' : action === 'unpay' ? 'Undo paid status?' : 'Issue this invoice?'}</AlertDialogTitle><AlertDialogDescription>{action === 'issue' ? 'A permanent number will be assigned and the invoice details will be locked.' : action === 'cancel' ? 'The original invoice and number remain in your history. This cannot be undone.' : action === 'delete' ? 'This draft will be permanently removed.' : action === 'unpay' ? 'The invoice will return to issued and its payment date will be cleared.' : 'Payment tracking is manual. This records the invoice as paid in full.'}</AlertDialogDescription></AlertDialogHeader>{action === 'pay' && <Field label="Payment date" type="date" value={paidDate} onChange={setPaidDate} min={selectedInvoice?.issue_date} max={today()}/>}{action === 'cancel' && <TextField label="Cancellation reason" value={reason} onChange={setReason}/>}{error && <div role="alert" className="error-message">{error}</div>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Go back</AlertDialogCancel><Button className="primary" disabled={busy || (action === 'cancel' && !reason.trim())} onClick={() => action && perform(action)}>{busy ? 'Working…' : 'Confirm'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
 <AlertDialog open={!!leave} onOpenChange={v => { if (!v)
        setLeave(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave unsaved changes?</AlertDialogTitle><AlertDialogDescription>Your changes to this draft have not been saved.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => { leave?.(); setLeave(null); }}>Discard changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></SidebarProvider>;
}
function ProfileForm({ profile, save, busy }: {
    profile: Profile;
    save: (p: Profile) => void;
    busy: boolean;
}) { const [p, setP] = useState(profile); return <><div className="page-heading"><div><div className="eyebrow">READY FOR EVERY INVOICE</div><h1>Business profile</h1><p>Your details, filled in once and reused.</p></div></div><form style={{ maxWidth: 800 }} onSubmit={e => { e.preventDefault(); save(p); }}><section className="form-card mb-6"><h2>Your business</h2><PartyFields value={p.details} seller onChange={details => setP({ ...p, details })}/></section><section className="form-card mb-6"><h2>Invoice defaults</h2><div className="field-grid"><Choice label="Default currency" value={p.default_currency} onChange={default_currency => setP({ ...p, default_currency })} options={currencies.map(c => ({ value: c, label: c }))}/><Field label="Payment terms in days" value={p.default_payment_terms_days} type="number" min={0} max={365} onChange={v => setP({ ...p, default_payment_terms_days: Number(v) })}/><TextField label="Default invoice notes" value={p.default_notes} onChange={default_notes => setP({ ...p, default_notes })} full maxLength={5000}/></div><p className="inline-help">Profile changes apply to new invoices. Saved invoices keep their original details.</p></section><Button type="submit" className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save business profile'}</Button></form></>; }
