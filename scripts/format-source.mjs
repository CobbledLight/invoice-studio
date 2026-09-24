// Optional formatter using the TypeScript compiler already in this project.
import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
const files=['app/page.tsx','app/layout.tsx','components/studio.tsx','components/auth-screen.tsx','components/studio-fields.tsx','components/invoice-editor.tsx','components/invoice-detail.tsx','lib/types.ts','lib/invoice.ts','lib/supabase.ts','lib/demo.ts','lib/pdf.ts','tests/invoice.test.ts'];
for(const file of files){const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);writeFileSync(file,ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(source));}
console.log('Formatted application source');
