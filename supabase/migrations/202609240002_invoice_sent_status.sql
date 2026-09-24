-- Add the delivery state to existing Invoice Studio databases.
begin;
alter type invoice_studio.invoice_status add value if not exists 'sent' after 'issued';
commit;
