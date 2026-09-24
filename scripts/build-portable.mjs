// A single-process static build, useful in restricted desktop environments.
// The normal Next.js and Vinext build scripts remain available.
import { rolldown } from 'rolldown';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { readFileSync,writeFileSync,mkdirSync,cpSync,existsSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const settings={};
for(const file of ['.env','.env.local'])if(existsSync(file))for(const line of readFileSync(file,'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)settings[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
const define={'process.env.NODE_ENV':JSON.stringify('production')};
for(const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])define[`process.env.${key}`]=JSON.stringify(process.env[key]||settings[key]||'');
mkdirSync('out',{recursive:true});mkdirSync('.sites-runtime',{recursive:true});
writeFileSync('.sites-runtime/client-entry.tsx',`import React from 'react';import{createRoot}from'react-dom/client';import App from '../app/page';createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);`);
const bundle=await rolldown({input:'./.sites-runtime/client-entry.tsx',platform:'browser',resolve:{alias:{'@':root}},transform:{jsx:'react-jsx',define},onwarn(w){if(w.code!=='MODULE_LEVEL_DIRECTIVE')console.warn(w.message)}});
await bundle.write({dir:'out/assets',format:'esm',entryFileNames:'app.js',minify:true});await bundle.close();
const compiler=await compile(readFileSync('app/globals.css','utf8'),{base:path.join(root,'app'),onDependency(){}});
const scan=new Scanner({sources:[{base:root,pattern:'{app,components,hooks,lib}/**/*.{ts,tsx}',negated:false}]});
writeFileSync('out/assets/app.css',compiler.build(scan.scan())+'\n'+readFileSync('app/studio.css','utf8'));
cpSync('public','out',{recursive:true});
writeFileSync('out/index.html','<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice Studio</title><meta name="description" content="Your invoices, customers and business details in one workspace."><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>');
console.log('Portable static build ready in out/');

