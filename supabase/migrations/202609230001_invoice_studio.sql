-- Invoice Studio MVP. Run this file once in the Supabase SQL editor.
-- Isolated schema avoids collisions with existing public tables. No existing data is changed.
begin;
create schema invoice_studio;
revoke all on schema invoice_studio from public, anon, authenticated;
create type invoice_studio.invoice_type as enum ('standard','advance');
create type invoice_studio.invoice_status as enum ('draft','issued','sent','paid','cancelled');
create table invoice_studio.users (
 id uuid primary key references auth.users(id) on delete restrict,
 auth_subject uuid not null unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table invoice_studio.business_profiles (
 user_id uuid primary key references invoice_studio.users(id),
 details jsonb not null default '{}' check (jsonb_typeof(details)='object'),
 default_currency text not null default 'EUR' check(default_currency in ('EUR','USD','GBP')),
 default_payment_terms_days integer not null default 14 check(default_payment_terms_days between 0 and 365),
 default_notes text not null default '' check(length(default_notes)<=5000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table invoice_studio.customers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references invoice_studio.users(id),
 name text not null check(length(trim(name)) between 1 and 200),
 details jsonb not null default '{}' check(jsonb_typeof(details)='object'), archived_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create table invoice_studio.invoices (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references invoice_studio.users(id),customer_id uuid,
 type invoice_studio.invoice_type not null default 'standard',status invoice_studio.invoice_status not null default 'draft',
 number text,number_year integer,sequence_no bigint check(sequence_no>0),
 issue_date date not null,due_date date not null,service_date date,
 payment_terms_days integer not null check(payment_terms_days between 0 and 365),
 currency text not null check(currency in ('EUR','USD','GBP')),
 seller_snapshot jsonb not null default '{}' check(jsonb_typeof(seller_snapshot)='object'),
 customer_snapshot jsonb not null default '{}' check(jsonb_typeof(customer_snapshot)='object'),
 notes text not null default '' check(length(notes)<=5000),
 subtotal numeric(18,2) not null default 0 check(subtotal>=0),tax_total numeric(18,2) not null default 0 check(tax_total>=0),total numeric(18,2) not null default 0 check(total>=0),
 issued_at timestamptz,paid_on date,cancelled_at timestamptz,cancellation_reason text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(user_id,customer_id) references invoice_studio.customers(user_id,id) on delete restrict,
 unique(user_id,number),unique(user_id,type,number_year,sequence_no),
 check(due_date>=issue_date),check(total=subtotal+tax_total),
 check((status='draft' and number is null and number_year is null and sequence_no is null and issued_at is null) or (status<>'draft' and number is not null and number_year=extract(year from issue_date) and number_year is not null and sequence_no is not null and issued_at is not null)),
 check((status='paid' and paid_on is not null and paid_on>=issue_date) or (status<>'paid' and paid_on is null)),
 check((status='cancelled' and cancelled_at is not null and cancellation_reason is not null and length(trim(cancellation_reason)) between 1 and 2000) or (status<>'cancelled' and cancelled_at is null and cancellation_reason is null))
);
create table invoice_studio.invoice_items (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null references invoice_studio.invoices(id) on delete cascade,
 position integer not null check(position between 1 and 100),description text not null default '' check(length(description)<=2000),
 quantity numeric(12,4) not null default 1 check(quantity>0),unit text check(length(unit)<=30),
 unit_price numeric(14,4) not null default 0 check(unit_price>=0),tax_rate numeric(5,2) not null default 0 check(tax_rate between 0 and 100),
 line_net numeric(18,2) not null check(line_net>=0),line_tax numeric(18,2) not null check(line_tax>=0),line_total numeric(18,2) not null check(line_total>=0 and line_total=line_net+line_tax),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(invoice_id,position)
);
create table invoice_studio.invoice_counters (
 user_id uuid not null references invoice_studio.users(id),type invoice_studio.invoice_type not null,year integer not null check(year between 1 and 9999),
 last_value bigint not null default 0 check(last_value>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,type,year)
);
create index customers_owner_active_name on invoice_studio.customers(user_id,archived_at,name);
create index invoices_owner_history on invoice_studio.invoices(user_id,created_at desc,id);
create index invoices_owner_status_due on invoice_studio.invoices(user_id,status,due_date);
create index invoices_owner_customer on invoice_studio.invoices(user_id,customer_id);
alter table invoice_studio.users enable row level security;
alter table invoice_studio.business_profiles enable row level security;
alter table invoice_studio.customers enable row level security;
alter table invoice_studio.invoices enable row level security;
alter table invoice_studio.invoice_items enable row level security;
alter table invoice_studio.invoice_counters enable row level security;
-- Tables have no direct client grants/policies. RPCs below are the only write path.
create function invoice_studio.owner_id() returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null then raise exception 'Sign in to continue.'; end if;
 insert into invoice_studio.users(id,auth_subject) values(u,u) on conflict(id) do nothing;
 insert into invoice_studio.business_profiles(user_id) values(u) on conflict(user_id) do nothing;
 return u; end; $$;
create function invoice_studio.check_party(p jsonb, seller boolean default false, complete boolean default false) returns void language plpgsql set search_path='' as $$
declare k text;v jsonb;begin
 if p is null or jsonb_typeof(p)<>'object' then raise exception 'Contact details must be an object.';end if;
 for k,v in select * from jsonb_each(p) loop
  if k not in ('name','address','country_code','registration_number','tax_id','contact_email','phone','payment_instructions') or (k='payment_instructions' and not seller) then raise exception 'Unknown contact field: %',k;end if;
  if jsonb_typeof(v)<>'string' or length(v#>>'{}')>2000 then raise exception 'Invalid contact field: %',k;end if;
 end loop;
 if coalesce(p->>'country_code','')<>'' and (p->>'country_code')!~'^[A-Z]{2}$' then raise exception 'Country must be a two-letter uppercase code.';end if;
 if coalesce(p->>'contact_email','')<>'' and (p->>'contact_email')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid contact email.';end if;
 if complete and (length(trim(coalesce(p->>'name','')))=0 or length(trim(coalesce(p->>'address','')))=0 or coalesce(p->>'country_code','')!~'^[A-Z]{2}$') then raise exception 'Business and customer name, address and country are required.';end if;
end;$$;
create function invoice_studio.invoice_json(i uuid,u uuid) returns jsonb language sql stable set search_path='' as $$
 select to_jsonb(v)||jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(l) order by l.position) from invoice_studio.invoice_items l where l.invoice_id=v.id),'[]'::jsonb)) from invoice_studio.invoices v where v.id=i and v.user_id=u;
$$;
create function public.studio_workspace() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=invoice_studio.owner_id();begin
 return jsonb_build_object('profile',(select to_jsonb(p) from invoice_studio.business_profiles p where p.user_id=u),
 'customers',coalesce((select jsonb_agg(to_jsonb(c) order by c.name) from invoice_studio.customers c where c.user_id=u),'[]'::jsonb),
 'invoices',coalesce((select jsonb_agg(invoice_studio.invoice_json(i.id,u) order by i.created_at desc,i.id) from invoice_studio.invoices i where i.user_id=u),'[]'::jsonb));end;$$;
create function public.studio_save_profile(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=invoice_studio.owner_id();begin
 perform invoice_studio.check_party(payload->'details',true);
 update invoice_studio.business_profiles set details=payload->'details',default_currency=payload->>'default_currency',default_payment_terms_days=(payload->>'default_payment_terms_days')::integer,default_notes=coalesce(payload->>'default_notes',''),updated_at=now() where user_id=u;
 return (select to_jsonb(p) from invoice_studio.business_profiles p where user_id=u);end;$$;
create function public.studio_save_customer(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=invoice_studio.owner_id();i uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());c invoice_studio.customers;begin
 perform invoice_studio.check_party(payload->'details',false);
 insert into invoice_studio.customers(id,user_id,name,details,archived_at) values(i,u,trim(payload->>'name'),payload->'details',(payload->>'archived_at')::timestamptz)
 on conflict(id) do update set name=excluded.name,details=excluded.details,archived_at=excluded.archived_at,updated_at=now() where invoice_studio.customers.user_id=u returning * into c;
 if c.id is null then raise exception 'Customer not found.';end if;return to_jsonb(c);end;$$;
create function public.studio_save_draft(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=invoice_studio.owner_id();i uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());v invoice_studio.invoices;l jsonb;pos integer:=0;q numeric;p numeric;r numeric;n numeric;t numeric;begin
 select * into v from invoice_studio.invoices where id=i and user_id=u for update;
 if found and v.status<>'draft' then raise exception 'Only drafts can be edited.';end if;
 perform invoice_studio.check_party(payload->'seller_snapshot',true);perform invoice_studio.check_party(payload->'customer_snapshot',false);
 if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items')>100 then raise exception 'Use at most 100 service lines.';end if;
 insert into invoice_studio.invoices(id,user_id,customer_id,type,issue_date,due_date,service_date,payment_terms_days,currency,seller_snapshot,customer_snapshot,notes)
 values(i,u,nullif(payload->>'customer_id','')::uuid,(payload->>'type')::invoice_studio.invoice_type,(payload->>'issue_date')::date,(payload->>'due_date')::date,nullif(payload->>'service_date','')::date,(payload->>'payment_terms_days')::integer,payload->>'currency',payload->'seller_snapshot',payload->'customer_snapshot',coalesce(payload->>'notes',''))
 on conflict(id) do update set customer_id=excluded.customer_id,type=excluded.type,issue_date=excluded.issue_date,due_date=excluded.due_date,service_date=excluded.service_date,payment_terms_days=excluded.payment_terms_days,currency=excluded.currency,seller_snapshot=excluded.seller_snapshot,customer_snapshot=excluded.customer_snapshot,notes=excluded.notes,updated_at=now()
 where invoice_studio.invoices.user_id=u and invoice_studio.invoices.status='draft' returning * into v;
 if v.id is null then raise exception 'Draft not found or no longer editable.';end if;
 delete from invoice_studio.invoice_items where invoice_id=i;
 for l in select * from jsonb_array_elements(payload->'items') loop
  pos:=pos+1;q:=(l->>'quantity')::numeric;p:=(l->>'unit_price')::numeric;r:=(l->>'tax_rate')::numeric;
  if q is null or p is null or r is null or q<=0 or p<0 or r<0 or r>100 or q<>round(q,4) or p<>round(p,4) or r<>round(r,2) or q::text in ('NaN','Infinity','-Infinity') or p::text in ('NaN','Infinity','-Infinity') or r::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid quantity, unit price or tax rate.';end if;
  n:=round(q*p,2);t:=round(n*r/100,2);
  insert into invoice_studio.invoice_items(invoice_id,position,description,quantity,unit,unit_price,tax_rate,line_net,line_tax,line_total) values(i,pos,coalesce(l->>'description',''),q,l->>'unit',p,r,n,t,n+t);
 end loop;
 update invoice_studio.invoices set subtotal=(select coalesce(sum(line_net),0) from invoice_studio.invoice_items where invoice_id=i),tax_total=(select coalesce(sum(line_tax),0) from invoice_studio.invoice_items where invoice_id=i),total=(select coalesce(sum(line_total),0) from invoice_studio.invoice_items where invoice_id=i),updated_at=now() where id=i and user_id=u;
 return invoice_studio.invoice_json(i,u);end;$$;
create function public.studio_invoice_action(invoice_id uuid, action text, payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=invoice_studio.owner_id();v invoice_studio.invoices;seq bigint;y integer;d date;today date:=(now() at time zone 'Europe/Vilnius')::date;copy jsonb;begin
 select * into v from invoice_studio.invoices where id=invoice_id and user_id=u for update;
 if not found then raise exception 'Invoice not found.';end if;
 if action='issue' then
  if v.status='issued' then return invoice_studio.invoice_json(v.id,u);end if;
  if v.status<>'draft' then raise exception 'Only a draft can be issued.';end if;
  perform invoice_studio.check_party(v.seller_snapshot,true,true);perform invoice_studio.check_party(v.customer_snapshot,false,true);
  if not exists(select 1 from invoice_studio.invoice_items l where l.invoice_id=v.id) or exists(select 1 from invoice_studio.invoice_items l where l.invoice_id=v.id and length(trim(description))=0) then raise exception 'Add at least one service with a description.';end if;
  -- Recompute from persisted decimals in the same transaction, never browser totals.
  update invoice_studio.invoice_items l set line_net=round(quantity*unit_price,2),line_tax=round(round(quantity*unit_price,2)*tax_rate/100,2),line_total=round(quantity*unit_price,2)+round(round(quantity*unit_price,2)*tax_rate/100,2) where l.invoice_id=v.id;
  y:=extract(year from v.issue_date)::integer;
  insert into invoice_studio.invoice_counters(user_id,type,year,last_value) values(u,v.type,y,1) on conflict(user_id,type,year) do update set last_value=invoice_studio.invoice_counters.last_value+1,updated_at=now() returning last_value into seq;
  update invoice_studio.invoices set status='issued',number_year=y,sequence_no=seq,number=(case when v.type='standard' then 'INV-' else 'ADV-' end)||y||'-'||lpad(seq::text,greatest(6,length(seq::text)),'0'),issued_at=now(),updated_at=now(),subtotal=(select sum(line_net) from invoice_studio.invoice_items l where l.invoice_id=v.id),tax_total=(select sum(line_tax) from invoice_studio.invoice_items l where l.invoice_id=v.id),total=(select sum(line_total) from invoice_studio.invoice_items l where l.invoice_id=v.id) where id=v.id;
 elsif action='send' then
  if v.status<>'issued' then raise exception 'Only an issued invoice can be sent.';end if;
  update invoice_studio.invoices set status='sent',updated_at=now() where id=v.id;
 elsif action='pay' then
  if v.status<>'sent' then raise exception 'Only a sent invoice can be marked paid.';end if;
  d:=(payload->>'paid_on')::date;if d is null or d<v.issue_date or d>today then raise exception 'Payment date must be between issue date and today.';end if;
  update invoice_studio.invoices set status='paid',paid_on=d,updated_at=now() where id=v.id;
 elsif action='unpay' then
  if v.status<>'paid' then raise exception 'Only a paid invoice can be reopened.';end if;
    update invoice_studio.invoices set status='sent',paid_on=null,updated_at=now() where id=v.id;
 elsif action='cancel' then
    if v.status not in ('issued','sent') then raise exception 'Only an issued or sent invoice can be cancelled.';end if;
  if length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'A cancellation reason is required.';end if;
  update invoice_studio.invoices set status='cancelled',cancelled_at=now(),cancellation_reason=trim(payload->>'reason'),updated_at=now() where id=v.id;
 elsif action='delete' then
  if v.status<>'draft' then raise exception 'Only a draft can be deleted.';end if;
  delete from invoice_studio.invoices where id=v.id;return jsonb_build_object('deleted',v.id);
 elsif action='duplicate' then
  copy:=invoice_studio.invoice_json(v.id,u);
  copy:=copy||jsonb_build_object('id',gen_random_uuid(),'seller_snapshot',(select details from invoice_studio.business_profiles where user_id=u),'issue_date',today,'due_date',today+v.payment_terms_days,'service_date',null);
  return public.studio_save_draft(copy);
 else raise exception 'Unknown invoice action.';end if;
 return invoice_studio.invoice_json(v.id,u);end;$$;
revoke all on all tables in schema invoice_studio from public,anon,authenticated;
revoke execute on all functions in schema invoice_studio from public,anon,authenticated;
revoke execute on function public.studio_workspace(),public.studio_save_profile(jsonb),public.studio_save_customer(jsonb),public.studio_save_draft(jsonb),public.studio_invoice_action(uuid,text,jsonb) from public,anon;
grant execute on function public.studio_workspace(),public.studio_save_profile(jsonb),public.studio_save_customer(jsonb),public.studio_save_draft(jsonb),public.studio_invoice_action(uuid,text,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
