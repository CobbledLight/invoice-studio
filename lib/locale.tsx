"use client";
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'en' | 'lt';

const translations: Record<string, string> = {
  "Opening your workspace…": "Atidaroma jūsų darbo sritis…",
  "Welcome back.": "Sveiki sugrįžę.",
  "Make room for your work.": "Vieta jūsų darbams.",
  "Reset your password": "Atkurkite slaptažodį",
  "Choose a new password": "Pasirinkite naują slaptažodį",
  "Your invoices, customers and details. All together.": "Jūsų sąskaitos, klientai ir rekvizitai vienoje vietoje.",
  "Create your private invoice workspace.": "Sukurkite savo privačią sąskaitų darbo sritį.",
  "We’ll email you a reset link.": "Atkūrimo nuorodą atsiųsime el. paštu.",
  "Set a secure password to continue.": "Norėdami tęsti nustatykite saugų slaptažodį.",
  "Email address": "El. pašto adresas",
  "Password": "Slaptažodis",
  "Use at least 8 characters.": "Naudokite bent 8 simbolius.",
  "Please wait…": "Palaukite…",
  "Save password": "Išsaugoti slaptažodį",
  "Create account": "Sukurti paskyrą",
  "Send reset link": "Siųsti atkūrimo nuorodą",
  "Sign in": "Prisijungti",
  "Continue with Google": "Tęsti su Google",
  "Google login is not enabled in Supabase yet. Enable the Google provider in Supabase Authentication settings, then try again.": "Prisijungimas per Google dar neįjungtas Supabase. Įjunkite Google teikėją Supabase autentifikavimo nustatymuose ir bandykite dar kartą.",
  "Create an account": "Sukurti paskyrą",
  "Back to sign in": "Grįžti į prisijungimą",
  "Forgot password?": "Pamiršote slaptažodį?",
  "Explore a sample workspace →": "Išbandyti pavyzdinę darbo sritį →",
  "Sample changes reset when you leave or refresh.": "Pavyzdinės darbo srities pakeitimai ištrinami išėjus arba atnaujinus puslapį.",
  "WORKSPACE": "DARBO SRITIS",
  "Invoices": "Sąskaitos",
  "Customers": "Klientai",
  "Business profile": "Įmonės profilis",
  "Workspace": "Darbo sritis",
  "All invoices": "Visos sąskaitos",
  "New invoice": "Nauja sąskaita",
  "Create, track and keep things moving.": "Kurkite, stebėkite ir tvarkykite sąskaitas.",
  "YOUR BUSINESS AT A GLANCE": "JŪSŲ ĮMONĖS SUVESTINĖ",
  "Summary currency": "Suvestinės valiuta",
  "Outstanding": "Neapmokėta",
  "Paid": "Apmokėta",
  "Drafts": "Juodraščiai",
  "invoices awaiting payment": "sąskaitos laukia apmokėjimo",
  "invoices settled": "sąskaitos apmokėtos",
  "Ready when you are": "Paruošta, kai būsite pasiruošę",
  "All invoices ": "Visos sąskaitos ",
  "Your latest documents, all together.": "Naujausi jūsų dokumentai vienoje vietoje.",
  "Search invoices": "Ieškoti sąskaitų",
  "Search invoice or customer…": "Ieškoti sąskaitos arba kliento…",
  "Status": "Būsena",
  "Type": "Tipas",
  "Invoice": "Sąskaita",
  "Customer": "Klientas",
  "Amount": "Suma",
  "Download": "Atsisiųsti",
  "Toggle Sidebar": "Rodyti / slėpti šoninį meniu",
  "All statuses": "Visos būsenos",
  "All types": "Visi tipai",
  "Standard invoice": "Įprasta sąskaita",
  "Advance invoice": "Išankstinė sąskaita-faktūra",
  "Issued": "Išrašyta",
  "Sent": "Išsiųsta",
  "Send invoice": "Siųsti sąskaitą",
  "Only an issued invoice can be sent.": "Siųsti galima tik išrašytą sąskaitą.",
  "Only a sent invoice can be marked paid.": "Apmokėta gali būti tik išsiųsta sąskaita.",
  "Overdue": "Vėluojama apmokėti",
  "Draft": "Juodraštis",
  "Cancelled": "Atšaukta",
  "New customer": "Naujas klientas",
  "Search customers…": "Ieškoti klientų…",
  "Active": "Aktyvūs",
  "Archived": "Archyvuoti",
  "Edit details": "Redaguoti rekvizitus",
  "Archive customer": "Archyvuoti klientą",
  "Restore customer": "Atkurti klientą",
  "Your details, filled in once and reused.": "Jūsų rekvizitai, įvedami vieną kartą ir naudojami pakartotinai.",
  "Your business": "Jūsų įmonė",
  "Invoice defaults": "Sąskaitų numatytieji nustatymai",
  "Default currency": "Numatytoji valiuta",
  "Default invoice notes": "Numatytosios sąskaitos pastabos",
  "Save business profile": "Išsaugoti įmonės profilį",
  "Saving…": "Išsaugoma…",
  "Invoice draft": "Sąskaitos juodraštis",
  "Fill in the fields below, then issue the invoice when it is ready.": "Užpildykite laukus ir išrašykite paruoštą sąskaitą.",
  "Invoice header": "Sąskaitos antraštė",
  "Invoice type": "Sąskaitos tipas",
  "Invoice number": "Sąskaitos numeris",
  "Assigned when issued": "Suteikiamas išrašant",
  "Currency": "Valiuta",
  "Invoice date": "Sąskaitos data",
  "Issue date": "Išrašymo data",
  "Payment terms in days": "Apmokėjimo terminas dienomis",
  "Due date": "Apmokėti iki",
  "Service date optional": "Paslaugos data (nebūtina)",
  "A permanent invoice number is assigned when you issue this draft.": "Nuolatinis sąskaitos numeris suteikiamas išrašant šį juodraštį.",
  "Bill to": "Pirkėjas",
  "Save as a contact": "Išsaugoti kaip kontaktą",
  "Choose a saved customer": "Pasirinkite išsaugotą klientą",
  "One-off customer": "Vienkartinis klientas",
  "From": "Pardavėjas",
  "your business": "jūsų įmonė",
  "Hide details": "Slėpti rekvizitus",
  "Use current profile": "Naudoti dabartinį profilį",
  "Services": "Paslaugos",
  "Service details": "Paslaugos duomenys",
  "Description": "Aprašymas",
  "Qty": "Kiekis",
  "Price": "Kaina",
  "Tax %": "Mokestis %",
  "Unit optional": "Mato vnt. (nebūtina)",
  "Add service": "Pridėti paslaugą",
  "Notes": "Pastabos",
  "Invoice summary": "Sąskaitos suvestinė",
  "Subtotal": "Suma be mokesčių",
  "Tax": "Mokestis",
  "Total": "Iš viso",
  "Issue invoice": "Išrašyti sąskaitą",
  "Save draft": "Išsaugoti juodraštį",
  "Save and download draft": "Išsaugoti ir atsisiųsti juodraštį",
  "Issued invoices are locked to preserve their original details.": "Išrašytos sąskaitos užrakinamos, kad būtų išsaugoti jų pradiniai duomenys.",
  "Business name": "Įmonės pavadinimas",
  "Customer name": "Kliento pavadinimas",
  "Address": "Adresas",
  "Country code": "Šalies kodas",
  "Registration number": "Įmonės kodas",
  "Tax or VAT ID": "Mokesčių mokėtojo arba PVM kodas",
  "Phone": "Telefonas",
  "Payment instructions": "Mokėjimo informacija",
  "Sample payment instructions. Not a real payment account.": "Pavyzdinė mokėjimo informacija. Tai nėra tikra mokėjimo sąskaita.",
  "Thank you for your business.": "Ačiū, kad pasirinkote mūsų paslaugas.",
  "A standard invoice for your services.": "Įprasta sąskaita už jūsų paslaugas.",
  "hours, pieces…": "valandos, vienetai…",
  "Remove service 1": "Pašalinti 1 paslaugą",
  "Email": "El. paštas",
  "Not entered": "Nenurodyta",
  "Duplicate": "Kopijuoti",
  "DRAFT · Not yet issued": "JUODRAŠTIS · Dar neišrašyta",
  "Registration": "Įmonės kodas",
  "Tax ID": "Mokesčių kodas",
  "Download PDF": "Atsisiųsti PDF",
  "Edit draft": "Redaguoti juodraštį",
  "Delete draft": "Ištrinti juodraštį",
  "Mark paid": "Pažymėti kaip apmokėtą",
  "Cancel invoice": "Atšaukti sąskaitą",
  "Undo paid status": "Panaikinti apmokėjimo būseną",
  "Issue date: ": "Išrašymo data: ",
  "Due date: ": "Apmokėti iki: ",
  "Service date: ": "Paslaugos data: ",
  "FROM": "PARDAVĖJAS",
  "BILL TO": "PIRKĖJAS",
  "Payment details": "Mokėjimo informacija",
  "Everything in one place": "Viskas vienoje vietoje",
  "Your invoices, customers and business details.": "Jūsų sąskaitos, klientai ir įmonės rekvizitai.",
  "Sample workspace": "Pavyzdinė darbo sritis",
  "Personal account": "Asmeninė paskyra",
  "Your workspace": "Jūsų darbo sritis",
  "Sign out": "Atsijungti",
  "Exit sample workspace": "Išeiti iš pavyzdinės darbo srities",
  "Sample workspace · Exit": "Pavyzdinė darbo sritis · Išeiti",
  "Sample workspace · Changes reset when you leave or refresh. Sign in to save real invoices.": "Pavyzdinė darbo sritis · Pakeitimai ištrinami išėjus arba atnaujinus puslapį. Prisijunkite, kad išsaugotumėte tikras sąskaitas.",
  "Showing ": "Rodoma ",
  " of ": " iš ",
  "Showing": "Rodoma",
  "of": "iš",
  "Previous page": "Ankstesnis puslapis",
  "Next page": "Kitas puslapis",
  "September": "rugsėjo",
  "Sept": "rugs.",
  "October": "spalio",
  "Oct": "spal.",
  "November": "lapkričio",
  "Nov": "lapkr.",
  "December": "gruodžio",
  "Dec": "gruod.",
  "January": "sausio",
  "Jan": "saus.",
  "February": "vasario",
  "Feb": "vas.",
  "March": "kovo",
  "Mar": "kov.",
  "April": "balandžio",
  "Apr": "bal.",
  "May": "gegužės",
  "June": "birželio",
  "Jun": "birž.",
  "July": "liepos",
  "Jul": "liep.",
  "August": "rugpjūčio",
  "Aug": "rugp.",
  "Loading your invoices…": "Kraunamos jūsų sąskaitos…",
  "Retry connection": "Bandyti prisijungti dar kartą",
  "Language": "Kalba",
  "Lithuanian": "Lietuvių",
  "English": "Anglų"
};

function translateText(value: string) {
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  if (!core)
    return value;
  const exact = translations[core];
  if (exact)
    return leading + exact + trailing;
  const translated = core
    .replace(/^Paid (.+)$/, "Apmokėta $1")
    .replace(/^Due (.+)$/, "Apmokėti iki $1")
    .replace(/^Due$/, "Apmokėti iki")
    .replace(/^Workspace\b/, "Darbo sritis")
    .replace(/^Showing (.+) of (.+)$/, "Rodoma $1 iš $2")
    .replace(/^(\d+) invoices awaiting payment$/, "$1 sąskaitos laukia apmokėjimo")
    .replace(/^(\d+) invoices settled$/, "$1 sąskaitos apmokėtos")
    .replace(/^Workspace \/ (.+)$/, "Darbo sritis / $1")
    .replace(/^Download (.+) PDF$/, "Atsisiųsti $1 PDF")
    .replace(/\bSept\b/g, "rugs.")
    .replace(/\bOct\b/g, "spal.")
    .replace(/\bNov\b/g, "lapkr.")
    .replace(/\bDec\b/g, "gruod.")
    .replace(/\bJan\b/g, "saus.")
    .replace(/\bFeb\b/g, "vas.")
    .replace(/\bMar\b/g, "kov.")
    .replace(/\bApr\b/g, "bal.")
    .replace(/\bJun\b/g, "birž.")
    .replace(/\bJul\b/g, "liep.")
    .replace(/\bAug\b/g, "rugp.")
    .replace(/^Registration: /, "Įmonės kodas: ")
    .replace(/^Tax ID: /, "Mokesčių kodas: ");
  return leading + translated + trailing;
}

function translatePage(locale: Locale) {
  if (locale === 'en')
    return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode())
    nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const value = node.nodeValue || '';
    const translated = translateText(value);
    if (translated !== value)
      node.nodeValue = translated;
  }
  for (const element of document.querySelectorAll<HTMLElement>('[aria-label],[placeholder],[title]')) {
    for (const attribute of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(attribute);
      if (value) {
        const translated = translateText(value);
        if (translated !== value)
          element.setAttribute(attribute, translated);
      }
    }
  }
  for (const element of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')) {
    const value = element.value;
    const translated = translateText(value);
    if (translated !== value && translations[value])
      element.value = translated;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('invoice-studio-locale');
    if (saved === 'lt' || saved === 'en')
      setLocale(saved);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready)
      return;
    localStorage.setItem('invoice-studio-locale', locale);
    document.documentElement.lang = locale;
    translatePage(locale);
    const observer = new MutationObserver(() => translatePage(locale));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, ready]);
  useEffect(() => {
    const alignWithPrimary = () => {
      const switcher = document.querySelector<HTMLElement>('.locale-switcher');
      const heading = document.querySelector<HTMLElement>('.page-heading');
      const primary = heading?.querySelector<HTMLElement>('.primary');
      const status = heading?.querySelector<HTMLElement>('.status');
      if (!switcher || !heading)
        return;
      const isPhone = window.matchMedia('(max-width: 767px)').matches;
      const target = primary || status;
      if (isPhone && !primary) {
        // The editor has a Draft badge instead of a primary action. Put the
        // language control below the heading so it cannot cover the title.
        const rect = heading.getBoundingClientRect();
        switcher.style.left = `${Math.max(12, window.innerWidth - switcher.offsetWidth - 14)}px`;
        switcher.style.top = `${window.scrollY + rect.bottom + 8}px`;
      } else if (target) {
        const rect = target.getBoundingClientRect();
        switcher.style.left = `${window.scrollX + rect.right - switcher.offsetWidth}px`;
        switcher.style.top = `${window.scrollY + rect.top}px`;
      } else {
        const rect = heading.getBoundingClientRect();
        switcher.style.left = `${Math.max(12, window.innerWidth - switcher.offsetWidth - 14)}px`;
        switcher.style.top = `${window.scrollY + rect.top}px`;
      }
      switcher.style.right = 'auto';
    };
    alignWithPrimary();
    addEventListener('resize', alignWithPrimary);
    const resizeObserver = new ResizeObserver(alignWithPrimary);
    const primary = document.querySelector<HTMLElement>('.page-heading .primary');
    if (primary)
      resizeObserver.observe(primary);
    const mutationObserver = new MutationObserver(alignWithPrimary);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      removeEventListener('resize', alignWithPrimary);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
  return <>
    <div className="locale-switcher" aria-label="Language">
      <button type="button" className={locale === 'en' ? 'active' : ''} onClick={() => { localStorage.setItem('invoice-studio-locale', 'en'); location.reload(); }} aria-label="English">EN</button>
      <button type="button" className={locale === 'lt' ? 'active' : ''} onClick={() => { localStorage.setItem('invoice-studio-locale', 'lt'); location.reload(); }} aria-label="Lithuanian">LT</button>
    </div>
    {children}
  </>;
}
