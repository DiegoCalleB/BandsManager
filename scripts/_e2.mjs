import ts from 'typescript'; import fs from 'node:fs'; import path from 'node:path';
const E=/\p{Extended_Pictographic}/u;
const files=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?(e.name==='__tests__'?[]:files(p)):p.endsWith('.tsx')||p.endsWith('.ts')?[p]:[]});
const rows=[]; const keyCount={};
for(const f of files('src')){
  if(f.includes('utils/')||f.includes('services/')||f.includes('data/')||f.includes('i18n')||f.includes('db_seed')) continue;
  const src=fs.readFileSync(f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,f.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const visit=n=>{
    if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)){
      const t=n.text; if(E.test(t)&&/^(\p{Extended_Pictographic}️?[\s‍]*)+/u.test(t)||/[\s](\p{Extended_Pictographic}️?)+$/u.test(t)){
        let k='?'; const p=n.parent;
        if(ts.isPropertyAssignment(p)) k='prop:'+p.name.getText(sf);
        else if(ts.isJsxAttribute(p)) k='attr:'+p.name.getText(sf);
        else if(ts.isCallExpression(p)) k='call:'+p.expression.getText(sf).slice(0,24);
        else k=ts.SyntaxKind[p.kind];
        keyCount[k]=(keyCount[k]||0)+1; rows.push([f.replace('src/',''),k,t.slice(0,50)]);
      }
    }
    ts.forEachChild(n,visit)};
  visit(sf);
}
console.log(rows.length); const by={}; for(const r of rows){(by[r[1]]=by[r[1]]||[]).push(r)} for(const k of ["prop:label","prop:text","prop:name","prop:title","ConditionalExpression","ArrayLiteralExpression","BinaryExpression","ReturnStatement","prop:description","prop:badge","attr:placeholder"]) console.log(k, (by[k]||[]).slice(0,6).map(r=>r[0].split("/").pop()+" «"+r[2]+"»").join(" | ")); console.log(Object.entries(keyCount).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,c])=>k+':'+c).join('  '));
