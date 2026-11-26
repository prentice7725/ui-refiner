import {createVisualCandidate,approveVisualCandidate} from './visual-baseline.mjs';
import {exportHtmlBundle,exportSarif} from './exporters.mjs';
import {reportToSarif} from './sarif.mjs';
import {renderOfflineReport} from './offline-report.mjs';
import {recordPreservation} from './preservation.mjs';
import {ruleCatalog,workflowGuide} from './rule-catalog.mjs';
import {createReviewPacket,validateDesignReview} from './design-review.mjs';
import {loadGuidanceCorpus,makeSuggestions} from './repair-guidance.mjs';
import path from 'node:path';
import fs from 'node:fs/promises';
import {initProject,loadConfig} from './config.mjs';
import {runGate,exitCode,baselineFromReport} from './gate.mjs';
import {doctor,scanDoctor} from './doctor.mjs';
import {upstreamCheck} from './vendor.mjs';
import {presets} from './presets.mjs';
import {scanUrl,scanLangs} from './scan.mjs';
import {compareDirections,verifyApplied} from './directions.mjs';
import {dealDirections,recordChoice,readLog} from './refine-log.mjs';
import {addPref,removePref,readPrefs,suggestPrefs,AXES} from './preferences.mjs';
import {loadMaterials} from './materials.mjs';
import {fetchStandIns} from './photos.mjs';
import {recordKeep,checkKeep} from './keep.mjs';
import {stressPage} from './stress.mjs';
import {listThemes,themeStarter} from './theme-starter.mjs';
import {ALLOW_FILE,readAllow,addAllow,removeAllow} from './allow.mjs';
import {extractSystem,checkSystem} from './site-system.mjs';

const help=`UI Refiner 0.14.0 — de-AI web design review and UI quality gate
  ui-refiner scan <url|host|file> [--out ui-refiner-scan] [--lang auto|ko|ja|en] [--locale ja-JP] [--source src] [--compare previous-scan-dir|scan.json | --no-compare] [--json]
      zero-config design review of any page; report language follows the page unless --lang or UI_REFINER_LANG is set;
      a rescan of the same page into the same --out folder is compared with the previous scan automatically
  ui-refiner directions <folder of .html mocks> [--lang auto|ko|ja|en] [--json]
      scans each design-direction mock and writes DIRECTIONS.html and DIRECTIONS.md side by side, so a person can choose one;
      warns when mocks share a surface, type pair or hero layout, ignore their deal, or repeat a choice made for another project
  ui-refiner directions deal <folder> [--kind software|service|place|public|company|studio|media] [--trade <trade>] [--tone calm|warm|technical|bold] [--lang en|ja|ko] [--no-photo] [--log file] [--seed n] [--json]
      assigns each of three mocks a hero structure (as common on human-made sites of that kind) and a material
      (a finished look: ground, colours, faces, surfaces, controls) that fits the tone and kind, avoiding what was chosen
      recently for other projects;
      --no-photo skips structures that need a real photo; --seed fixes the draw (for benchmarks: two runs with one
      seed differ only in their inputs)
  ui-refiner directions record <folder> --pick A|B|C [--page name] [--said "the person's words"] [--log file]
      remembers the picked direction (default log: ~/.ui-refiner/refine-log.json, or UI_REFINER_HOME)
  ui-refiner prefer add <axis> <value> --said "the person's words" [--kind kind] | prefer remove <axis> <value> [--kind kind]
  ui-refiner prefer list | prefer suggest [--log file]
      the person's taste as things directions deal leaves out (axes: hero, face, accent, surface, material), kept next
      to the refine log; suggest lists their recorded words and looks shown 3+ times and never picked, to ask about
  ui-refiner directions verify <folder> <applied page> [--pick A|B|C] [--json]
      checks that the applied page kept the chosen mock's hero structure, surface and type (exit 1 on drift)
  ui-refiner system extract <main page> [--dir folder] [--json]
      measures the picked main page (type, sizes, colours, main button, box radius, rules, content width) and writes
      ui-refiner-system.json and DESIGN_SYSTEM.md next to it (or in --dir), to build the site's other pages from
  ui-refiner system check <page> [more pages] [--system ui-refiner-system.json] [--json]
      lists where other pages of the site leave that design (exit 1 on drift)
  ui-refiner photos "<subject>" [--out assets/stand-in] [--count 6] [--orientation landscape|portrait|any] [--lang en|ja|ko] [--page index.html] [--no-optimise] [--json]
      saves openly licensed stand-in photographs from Wikimedia Commons with credits.json and a footer credit line;
      mark each on the page with data-stand-in, never present it as the client's own, replace it with real photos;
      each photo is saved as WebP at 640, 1024 and 1600px with a ready <img srcset> line (--no-optimise keeps the download)
  ui-refiner allow add <signal> --reason "why it is deliberate" [--file ui-refiner-allow.json]
  ui-refiner allow remove <signal> | ui-refiner allow list
      keeps a list of AI-look signals this project uses on purpose (a brand typeface, a brand accent); the scan reports
      them without scoring them. Baseline quality issues cannot be allowed
  ui-refiner keep record <page> [--out ui-refiner-keep.json]
  ui-refiner keep check <page> [--from ui-refiner-keep.json] [--json]
      records link targets, forms, fields, contact links and facts before a redesign, then fails (exit 1) when the
      redesigned page lost any of them; facts that appear only afterwards are listed to check they are real
  ui-refiner stress <page|url> [--out ui-refiner-stress] [--lang ko|ja|en] [--json]
      swaps realistic worst-case values (long labels and headings, long emails and URLs, big numbers) into the
      rendered text at 320, 390 and 1440px and lists what broke with the usual fix (exit 1 when something broke)
  ui-refiner theme list [--json]
  ui-refiner theme starter <theme> [--out ui-refiner-theme] [--brand "#rrggbb"] [--face "Typeface name"] [--lang ko|ja] [--variant statement] [--json]
      copies a measured Korean or Japanese theme (theme.css, theme.md) and writes brand.css, which puts the client's
      colour and typeface on the theme's tokens, and STARTER.md, which lists the photographs the theme needs with
      their place and ratio; with --brand it renders the theme's sample in that colour and lists the text and buttons
      whose contrast the colour broke at 1440 and 390px, each with the nearest shade that passes (a warning; exit 0);
      a theme can be used for either language: --lang swaps its faces, line height and line breaking when the page
      is not in the language the theme was measured in; --variant statement also copies the theme's stand-out
      variant (statement.css, three themes so far) for a client who wants to look unlike its neighbours
  ui-refiner init [--preset${presets.join('|')}] [--dir path] [--locale en-US|ko-KR|ja-JP]
  ui-refiner check [--config ui-refiner.config.json] [--url http://127.0.0.1:5173] [--changed-only] [--base ref]
  ui-refiner review packet --from report.json --out review-folder
  ui-refiner review validate --from review.json --report report.json [--out validated.json]
  ui-refiner guidance --query "keyboard focus" [--limit 3] [--json]
  ui-refiner rules [--json]
  ui-refiner guide audit|critique|polish|harden [--json]
  ui-refiner preserve record --from report.json --out preservation-reference.json
  ui-refiner export html|sarif --from report.json --out destination
  ui-refiner check [--format json|sarif|html|markdown]
  ui-refiner doctor [--config ui-refiner.config.json]
  ui-refiner upstream check
  ui-refiner baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.json
  ui-refiner visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
  ui-refiner visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
Exit 0: automated checks pass (manual visual review may remain), 1: findings, 2: infrastructure/error/uncovered, 3: scoped pass only (never full approval)`;
function parse(args){const out={_:[]};for(let i=0;i<args.length;i++){
  const a=args[i];if(!a.startsWith('--')){out._.push(a);continue;}
  if(a==='--changed-only'){out.changedOnly=true;continue;}
  if(a==='--json'){out.json=true;continue;}
  if(a==='--no-compare'){out.noCompare=true;continue;}
  if(a==='--no-photo'){out.noPhoto=true;continue;}
  if(a==='--no-optimise'){out.noOptimise=true;continue;}
  if(a==='--help'){out.help=true;continue;}
  if(!['--preset','--dir','--config','--url','--from','--out','--locale','--base','--format','--report','--query','--limit','--lang','--source','--compare','--pick','--page','--log','--kind','--trade','--tone','--count','--orientation','--system','--reason','--file','--seed','--said','--brand','--face','--variant'].includes(a))throw new Error(`Unknown flag ${a}`);
  const value=args[++i];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${a}`);
  const key=a.slice(2);if(out[key])throw new Error(`Duplicate flag ${a}`);out[key]=value;
}return out;}
try{
  const args=parse(process.argv.slice(2));
  const [command,sub]=args._;
  if((command==='scan'&&args.help)||(command==='help'&&sub==='scan')){
    console.log(help.split('  ui-refiner directions')[0]+'  Examples:\n    ui-refiner scan http://localhost:5173 --lang ko\n    ui-refiner scan examples/ai-slop-landing.html\n  Open <out>/DESIGN_REVIEW.md (default: ui-refiner-scan/DESIGN_REVIEW.md).');
  }else if(!command||args.help||command==='help'){console.log(help);process.exitCode=0;}
  else if(command==='scan'&&args._.length===2){
    // --lang wins over UI_REFINER_LANG; without either the report follows the page language.
    const lang=args.lang||process.env.UI_REFINER_LANG||'auto';
    if(lang!=='auto'&&!scanLangs.includes(lang))throw Error(`${args.lang?'--lang':'UI_REFINER_LANG'} must be auto or one of ${scanLangs.join(', ')}`);
    if(args.compare&&args.noCompare)throw Error('Use either --compare or --no-compare');
    const {result,dir}=await scanUrl(sub,{out:args.out||'ui-refiner-scan',lang,locale:args.locale||null,source:args.source||null,compare:args.noCompare?null:args.compare||'auto',grade:true});
    const c=result.comparison,delta=n=>n>0?`+${n}`:`${n}`;
    if(args.json)console.log(JSON.stringify(result,null,2));
    else console.log(`[SCAN] AI-look ${result.aiLook.score}/100 (${result.aiLook.band}); verdict=${result.aiLook.verdict==='ai'?'looks AI-made':result.aiLook.verdict==='unclear'?'unclear':'does not look AI-made'}; signals=${result.aiLook.signals.map(s=>s.id).join(',')||'none'}; quality issues=${result.quality.reduce((n,q)=>n+q.count,0)};${result.japanese.japanese?` ja-typography=${result.japanese.issues.map(i=>i.id).join(',')||'ok'};`:''} report=${result.lang};${c?` vs ${c.mode==='auto'?'last scan':'previous'} ${c.previous.score}→${c.current.score} (${delta(c.scoreDelta)}), resolved=${c.signals.resolved.length}, new=${c.signals.added.length}${c.warnings.length?`, warnings=${c.warnings.join(',')}`:''};`:''} ${path.join(dir,'DESIGN_REVIEW.md')}`);
  }
  else if(command==='allow'&&['add','remove','list'].includes(sub)){
    const file=path.resolve(args.file||ALLOW_FILE);
    if(sub==='add'&&args._.length===3){const r=await addAllow(file,{signal:args._[2],reason:args.reason});console.log(`[ALLOW] ${args._[2]}: ${r.allow.at(-1).reason} → ${r.file}`);}
    else if(sub==='remove'&&args._.length===3){const r=await removeAllow(file,args._[2]);console.log(`[ALLOW] removed ${args._[2]} → ${r.file}`);}
    else if(sub==='list'&&args._.length===2){const a=await readAllow(file);console.log(a.length?a.map(e=>`${e.signal}: ${e.reason}`).join('\n'):`No allowed signals (${file})`);}
    else throw Error('Usage: ui-refiner allow add <signal> --reason "…" | allow remove <signal> | allow list');
  }
  else if(command==='keep'&&sub==='record'&&args._.length===3){
    const r=await recordKeep(args._[2],{out:args.out||'ui-refiner-keep.json'});
    console.log(`[KEEP] ${r.inventory.links.length} links, ${r.inventory.forms.length} forms, ${r.inventory.fields.length} fields, ${r.inventory.facts.length} facts → ${r.file}`);
  }
  else if(command==='keep'&&sub==='check'&&args._.length===3){
    const r=await checkKeep(args._[2],{from:args.from||'ui-refiner-keep.json'});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else{const part=(k,label)=>r[k].length?`\n  ${label}: ${r[k].join(', ')}`:'';console.log((r.ok?'[KEPT] links, forms, fields and facts are all still there':'[LOST] the redesign dropped:')+part('links','links')+part('forms','forms')+part('fields','fields')+part('facts','facts')+(r.added.length?`\n  new facts to confirm (not on the original page): ${r.added.join(', ')}`:''));}
    process.exitCode=r.ok?0:1;
  }
  else if(command==='stress'&&args._.length===2){
    const r=await stressPage(sub,{out:args.out||'ui-refiner-stress',lang:args.lang&&args.lang!=='auto'?args.lang:undefined});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log((r.findings.length?r.findings.map((f,i)=>`${i+1}. [${f.severity.toUpperCase()}] ${f.width}px ${f.kind}: ${f.type}${f.element?` — ${f.element}`:''}${f.value?` → “${f.value}”`:''}${f.with?` (on “${f.with}”)`:''}\n   fix: ${f.fix}`).join('\n'):'[HELD] nothing broke with worst-case values')
      +`\n[TESTED] ${Object.entries(r.tested).map(([k,n])=>`${k} ${n}`).join(', ')} (${r.lang}, ${r.widths.join('/')}px)\n[STRESS] ${path.join(r.dir,'STRESS.md')}`);
    process.exitCode=r.broken?1:0;
  }
  else if(command==='theme'&&sub==='list'&&args._.length===2){
    const themes=await listThemes();
    console.log(args.json?JSON.stringify(themes,null,2):themes.map(t=>`${t.id.padEnd(24)} ${t.basis} (${t.sites} sites)${t.variants.length?` · variant: ${t.variants.join(', ')}`:''}`).join('\n'));
  }
  else if(command==='theme'&&sub==='starter'&&args._.length===3){
    const r=await themeStarter(args._[2],{out:args.out||'ui-refiner-theme',brand:args.brand,face:args.face,lang:args.lang,variant:args.variant});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else{
      const c=r.contrast;
      console.log(`[THEME] ${r.theme.id} in ${r.dir} (${r.files.join(', ')})`
        +(r.language?`\n[LANG] ${r.language.from} → ${r.language.to}: ${Object.keys(r.language.tokens).join(', ')}`:'')
        +(r.tokens?'\n[BRAND] '+Object.entries(r.tokens).map(([k,v])=>`${k} ${v}`).join(', '):'')
        +(r.literal?`\n[WARN] theme.css writes the theme colour ${r.literal} time(s) outside the tokens; brand.css does not reach those`:'')
        +(c?.skipped?`\n[WARN] contrast not checked: ${c.skipped}`:'')
        +(c?.failures?.length?'\n'+c.failures.map((f,i)=>`${i+1}. [CONTRAST] ${f.kind} ${f.element}${f.text?` “${f.text}”`:''}: ${f.colour} on ${f.on} is ${f.ratio}:1, needs ${f.needs}:1${f.fix?`\n   fix: ${f.fix}`:''}`).join('\n'):'')
        +(c&&!c.skipped&&!c.failures.length?`\n[CONTRAST] ${c.checked} changed colours still meet WCAG AA at ${c.widths.join(' and ')}px`:'')
        +`\n[PHOTOS] ${r.photos.length} photograph slots listed in ${path.join(r.dir,'STARTER.md')}`);
    }
  }
  else if(command==='photos'&&args._.length===2){
    const r=await fetchStandIns(sub,{out:args.out||'assets/stand-in',count:args.count?Number(args.count):6,orientation:args.orientation||'landscape',lang:args.lang&&args.lang!=='auto'?args.lang:'en',optimise:!args.noOptimise,page:args.page});
    const kb=n=>`${Math.round(n/1024)} KB`;
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(r.photos.map(p=>`${p.file}  ${p.width}x${p.height}  ${p.author} (${p.licence})  ${p.source}`+(p.variants?`\n  WebP ${p.variants.map(v=>`${v.width}w ${kb(v.bytes)}`).join(', ')} (was ${kb(p.originalBytes)})\n  ${p.img}`:'')).join('\n')
      +`\n[PHOTOS] ${r.photos.length} stand-ins in ${r.dir} (credits.json)`+(r.optimiseSkipped?`\n[WARN] ${r.optimiseSkipped}`:'')
      +(r.photos.some(p=>p.variants)?`\nThe <img> paths are relative to ${r.base}; a page in another folder (a mock in refine-directions/) needs them adjusted, or pass --page <its html file>.\nUse each photo through its <img> line: keep srcset, width and height, set sizes to the width the photo really takes in the layout (for example "(min-width: 64em) 50vw, 100vw"), add fetchpriority="high" to the first-screen photo and loading="lazy" to the rest, and write a generic alt.`:'')
      +`\nCredit line for the footer:\n${r.credit}`);
  }
  else if(command==='prefer'&&sub==='add'&&args._.length===4){
    const r=await addPref(args._[2],args._[3],{said:args.said,kind:args.kind,log:args.log,materials:(await loadMaterials()).map(m=>m.slug)});
    console.log(`[PREFER] avoid ${r.entry.axis} ${r.entry.value}${r.entry.kind?` on ${r.entry.kind} pages`:''} — "${r.entry.said}" → ${r.file}`);
  }
  else if(command==='prefer'&&sub==='remove'&&args._.length===4){
    const r=await removePref(args._[2],args._[3],{kind:args.kind,log:args.log});
    console.log(r.retired?`[PREFER] retired ${r.retired} → ${r.file}`:`[PREFER] no active entry for ${args._[2]} ${args._[3]}`);
  }
  else if(command==='prefer'&&sub==='list'&&args._.length===2){
    const active=(await readPrefs(undefined,args.log)).filter(p=>p.status==='active');
    if(args.json)console.log(JSON.stringify(active,null,2));
    else console.log(active.length?active.map(p=>`${p.axis} ${p.value}${p.kind?` (${p.kind})`:''}  ${p.date}  "${p.said}"`).join('\n'):`[PREFER] none recorded (axes: ${Object.keys(AXES).join(', ')})`);
  }
  else if(command==='prefer'&&sub==='suggest'&&args._.length===2){
    const r=suggestPrefs(await readLog(args.log),await readPrefs(undefined,args.log));
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log([...r.said.map(s=>`[SAID] ${s.date} ${s.page} (picked ${s.pick}): "${s.said}"`),...r.neverPicked.map(s=>`[NEVER PICKED] ${s.axis} ${s.value}: shown ${s.rejected} times, never picked`)].join('\n')
      +(r.said.length||r.neverPicked.length?`\nAsk the person before adding any of these; add only what they confirm, with their words: ui-refiner prefer add <axis> <value> --said "…"`:'[PREFER] nothing to suggest'));
  }
  else if(command==='directions'&&sub==='deal'&&args._.length===3){
    if(args.seed!=null&&!/^\d+$/.test(String(args.seed)))throw new Error('--seed must be a whole number');
    const r=await dealDirections(args._[2],{...(args.seed!=null?{seed:Number(args.seed)}:{}),log:args.log,noPhoto:!!args.noPhoto,kind:args.kind,trade:args.trade,tone:args.tone,lang:args.lang&&args.lang!=='auto'?args.lang:'en'});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log((r.trade?(r.tradeMeasured?`[TRADE] ${r.trade}: A follows ${r.structures[0].measured.sites} human-made sites of this trade in ${r.structures[0].measured.country}\n`:`[TRADE] ${r.trade}: too few sites of this trade measured for this language; A follows the page kind\n`):'')+(r.tone?`[TONE] ${r.tone}: ${r.toneBrief}
`:'')+r.structures.map(d=>`${d.label} · ${d.lane}: ${d.key} — ${d.brief}${d.humanShare!=null?` (${Math.round(d.humanShare*100)}% of human-made sites of this kind)`:''}${d.surface?`
   surface: ${d.surface.brief}`:''}${d.accent?`
   colour: ${d.accent.family} — ${d.accent.brief}`:''}${d.material?`
   material: ${d.material.name} — ${d.material.brief}
   material file: ${d.material.file}${d.alternate?`
   alternate, if that one does not suit this client: ${d.alternate.name} — ${d.alternate.file}`:''}`:''}
   read: ${d.file}`).join('\n')+(r.preferences.length?`\n[PREFERENCES] left out for this person: ${r.preferences.map(p=>`${p.axis} ${p.value}${p.kind?` (${p.kind})`:''} — "${p.said}"`).join('; ')}`:'')+`\n[AVOID FACES] ${r.avoidFaces.join(', ')}\n[LANES] build each direction in its own subagent, which reads only its lane file\n[DEAL] ${r.file}`);
  }
  else if(command==='directions'&&sub==='record'&&args._.length===3){
    if(!args.pick)throw Error('directions record requires --pick');
    const r=await recordChoice(args._[2],{pick:args.pick,page:args.page,log:args.log,said:args.said});
    console.log(`[RECORD] ${r.entry.label} ${r.entry.hero??'-'} ${(r.entry.fonts||[]).join(' + ')||'-'} → ${r.file}`+
      (r.entry.rejected.length?`\n[NOT PICKED] ${r.entry.rejected.map(d=>`${d.label} ${d.hero??'-'}`).join(', ')}`:'')+
      (r.entry.said?`\n[SAID] "${r.entry.said}"`:'')+(r.allowed?`\n[ALLOW] the familiar direction's plain typeface is recorded as deliberate → ${r.allowed}`:''));
  }
  else if(command==='system'&&sub==='extract'&&args._.length===3){
    const r=await extractSystem(args._[2],{dir:args.dir});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(`[SYSTEM] ${r.system.fonts.heading??'-'} / ${r.system.fonts.body??'-'}, accent ${r.system.accentFamily??'ink'}, button radius ${r.system.button?.radius??'-'}px, width ${r.system.content??'-'}px → ${r.markdown}`);
  }
  else if(command==='system'&&sub==='check'&&args._.length>=3){
    const r=await checkSystem(args._.slice(2),{system:args.system});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else for(const x of r.results)console.log(x.drift.length?`[DRIFT] ${x.page}: ${x.drift.map(d=>`${d.id} ${d.want} → ${d.got}`).join('; ')}`:`[SYSTEM] ${x.page}: keeps the design`);
    process.exitCode=r.results.some(x=>x.drift.length)?1:0;
  }
  else if(command==='directions'&&sub==='verify'&&args._.length===4){
    const r=await verifyApplied(args._[2],args._[3],{pick:args.pick,log:args.log});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(r.drift.length?`[DRIFT] ${r.label}: ${r.drift.map(d=>`${d.id} ${d.chosen} → ${d.applied}`).join('; ')}`:`[VERIFY] ${r.label}: hero ${r.applied.hero}, surface and type kept`);
    if(r.problems?.length)console.log(`[FIRST SCREEN] ${r.problems.join(', ')}: the first screen needs a one-line claim, not dwarfed by other text, the main action, and a photo or a large product screen showing one readable scene`);
    if(r.habits?.includes('stat-strip'))console.log('[HABIT] stat-strip: a row of big figures side by side. In benchmark round 16 all three set judges named it as a habit shared across unrelated clients; keep a figure only where it is the client’s point, as a sentence, a table or a timetable');
    for(const l of r.loading||[])console.log(l.id==='blocking-font-css'
      ?`[LOADING] blocking-font-css: ${l.items.join(', ')} blocks the first paint. Load it without blocking, keeping preconnect and display=swap: <link rel="stylesheet" href="…" media="print" onload="this.media='all'"> followed by <noscript><link rel="stylesheet" href="…"></noscript>`
      :`[LOADING] stand-in-no-srcset: ${l.items.join(', ')} has no srcset. Use the <img> line \`ui-refiner photos\` printed (srcset, width, height) and set sizes to the width the photo takes`);
    process.exitCode=r.drift.length||r.problems?.length||r.loading?.length?1:0;
  }
  else if(command==='directions'&&args._.length===2){
    const lang=args.lang||process.env.UI_REFINER_LANG||'auto';
    if(lang!=='auto'&&!scanLangs.includes(lang))throw Error(`${args.lang?'--lang':'UI_REFINER_LANG'} must be auto or one of ${scanLangs.join(', ')}`);
    const r=await compareDirections(sub,{lang,log:args.log});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(`[DIRECTIONS] ${r.items.map(d=>`${d.label}=${d.file} (AI-look ${d.score}, quality ${d.quality}${d.ja!=null?`, ja ${d.ja}`:''})`).join("; ")}${r.warnings.length?`; warnings=${r.warnings.map(w=>w.id+(w.a?`(${w.a},${w.b})`:"")).join(",")}`:""}${r.notes?.length?`; note=white-run (prefer ${r.notes[0].a})`:""}; ${r.html}`);
  }
  else if(command==='guidance'&&args._.length===1){
    if(!args.query)throw Error('guidance requires --query');const limit=args.limit===undefined?3:Number(args.limit);const corpus=await loadGuidanceCorpus();const suggestions=makeSuggestions(corpus,args.query,limit);console.log(JSON.stringify({schemaVersion:1,advisory:true,blocking:false,query:args.query,status:suggestions.length?'matched':'no-match',suggestions},null,2));
  }
  else if(command==='rules'&&args._.length===1){const result=await ruleCatalog();console.log(args.json||args.format==='json'?JSON.stringify(result,null,2):result.rules.map(r=>r.engine+'/'+r.id+' ['+r.domain+'] '+r.phases.join('+')+' — '+r.enforcement).join('\n'));}
  else if(command==='guide'&&args._.length===2){const result=workflowGuide(sub);console.log(args.json||args.format==='json'?JSON.stringify(result,null,2):result.goal+'\n\n'+result.required.map(s=>'- '+s).join('\n'));}
  else if(command==='init'&&args._.length===1){
    const root=path.resolve(args.dir||'.');const statuses=await initProject(root,args.preset||'web',args.locale||'en-US');console.log(statuses.join('\n'));console.log('Configure SOT; use bundled source of both auditors, then run ui-refiner check.');
  }else if(command==='check'&&args._.length===1){
    const {root,config,file}=await loadConfig(args.config);
    if(args.format&&!["json","sarif","html","markdown"].includes(args.format))throw Error("Unknown output format");
    if(args.url)config.browser.url=args.url;
    const report=await runGate({root,config,configFile:file,changedOnly:!!args.changedOnly,baseRef:args.base});
    if(args.format)console.log(args.format==='json'?JSON.stringify(report,null,2):args.format==='sarif'?JSON.stringify(reportToSarif(report),null,2):args.format==='html'?renderOfflineReport(report):await fs.readFile(path.join(root,config.reportDir,'report.md'),'utf8'));
    else console.log(`[${report.status}] new blockers=${report.summary.blockers}, findings=${report.summary.total}, visual=${report.visual?.status||'not-requested'}; ${path.join(root,config.reportDir,'report.md')}`);
    for(const s of report.stages)if(s.error)console.error(`[${s.engine}] ${s.error}`);
    process.exitCode=exitCode(report);
  }else if(command==='review'&&['packet','validate'].includes(sub)&&args._.length===2){
    if(!args.from||sub==='packet'&&!args.out||sub==='validate'&&!args.report)throw Error('review requires --from and packet --out / validate --report');
    const result=sub==='packet'?await createReviewPacket(args.from,args.out):await validateDesignReview(args.from,args.report);
    if(sub==='validate'&&args.out)await fs.writeFile(args.out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
  }else if(command==='preserve'&&sub==='record'&&args._.length===2){
    if(!args.from||!args.out)throw Error('preserve record requires --from and --out');
    const value=await recordPreservation(args.from,args.out);console.log('Recorded '+value.entries.length+' inventories. Review the preservation reference before enforcing.');
  }else if(command==='export'&&['html','sarif'].includes(sub)&&args._.length===2){
    if(!args.from||!args.out)throw Error('export requires --from and --out');
    const report=await (sub==='html'?exportHtmlBundle:exportSarif)(args.from,args.out);
    console.log('Exported '+sub+'; original verdict '+report.status+'; exit '+exitCode(report));process.exitCode=exitCode(report);
  }else if(command==='doctor'&&args._.length===1){
    const hasConfig=args.config||await fs.stat('ui-refiner.config.json').then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;});
    const result=hasConfig?await doctor(await loadConfig(args.config)):await scanDoctor();console.log(result.lines.join('\n'));process.exitCode=result.errors?2:0;
  }else if(command==='upstream'&&sub==='check'&&args._.length===2){
    for(const row of await upstreamCheck())console.log(`${row.name}: ${row.status} — pinned=${row.pinned} HEAD=${row.head}`);
  }else if(command==='visual'&&['candidate','approve'].includes(sub)&&args._.length===2){
    if(!args.from||!args.out)throw Error('visual '+sub+' requires --from and --out');
    const manifest=await (sub==='candidate'?createVisualCandidate:approveVisualCandidate)(args.from,args.out);
    console.log('Visual '+manifest.kind+': '+manifest.entries.length+' images. '+(sub==='candidate'?'Review images and environment before visual approve.':'Approved image manifest written; check never updates it.'));
  }else if(command==='baseline'&&sub==='create'&&args._.length===2){
    if(!args.from||!args.out)throw new Error('baseline create requires --from and --out');
    const count=await baselineFromReport(args.from,args.out);
    console.log(`Baseline created: ${count} finding IDs. Review this suppression list before using it.`);
  }else throw new Error(help);
}catch(e){console.error(`UI Refiner: ${e.message}`);process.exitCode=2;}
