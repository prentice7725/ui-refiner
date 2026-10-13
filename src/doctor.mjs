import fs from 'node:fs/promises';
import path from 'node:path';
import {staticAuditPath,probeChromium} from './execute.mjs';
import {verifyVendor,sutaCopyDrift} from './vendor.mjs';
export async function doctor({root,config,probe=probeChromium}){
 const lines=[`Preset: ${config.preset} | Locale: ${config.locale||'en-US'} | Node ${process.versions.node}`];let errors=0;
 const drift=await verifyVendor();if(drift.length){errors++;lines.push(`Vendor integrity: ERROR (${drift.join(', ')})`);}else lines.push('Vendor integrity: SHA-256 verified');
 for(const [name,required,file] of [['suta-audit',config.static.enabled,staticAuditPath(config,root)],['ui-policy',config.browser.enabled,path.resolve(root,config.browser.policyPath)],['SOT',!!config.sot.path,config.sot.path?path.resolve(root,config.sot.path):null]]){
  if(!required){lines.push(`${name}: N/A`);continue;}
  try{await fs.access(file);lines.push(`${name}: installed (${file})`);}catch{errors++;lines.push(`${name}: MISSING (${file})`);}
 }
 if(config.static.enabled&&staticAuditPath(config,root).split(path.sep).includes('node_modules')){errors++;lines.push('suta native TS cannot execute from node_modules; use tools/ui-refiner. A compiled npm distribution is not supported.');}
 const copied=await sutaCopyDrift(root);
 if(copied?.length)lines.push(`WARNING: installed suta guidance copy differs in ${copied.length} files. Refresh the guidance after review. Runtime source: ${staticAuditPath(config,root)}`);
 if(config.static.auditPath!=='bundled')lines.push('WARNING: static.auditPath overrides the bundled runtime. Set it to "bundled" to use the maintained source; copies can become stale.');
 if(config.browser.enabled){try{await probe({timeout:Math.min(config.browser.timeoutMs,15000)});lines.push('Chromium: launch OK');}catch(e){errors++;lines.push(`Chromium: ERROR — ${e.message}`);}}
 const [major,minor]=process.versions.node.split('.').map(Number);if(config.static.enabled&&(major<22||major===22&&minor<18)){errors++;lines.push('Node >=22.18 required for suta native TS.');}
 return {lines,errors};
}
