import {spawnBounded} from './execute.mjs';
// Git's new-side hunk lines; deletions alone do not claim whole-file coverage.
export function parseChangedDiff(text){
 const changed=new Map();let file;
 for(const line of text.split('\n')){
  if(line.startsWith('+++ b/')){file=line.slice(6);if(!changed.has(file))changed.set(file,new Set());}
  else if(line==='+++ /dev/null')file=undefined;
  else if(file&&line.startsWith('@@')){
   const m=line.match(/\+(\d+)(?:,(\d+))? @@/);if(!m)continue;
   const start=Number(m[1]),count=m[2]===undefined?1:Number(m[2]);
   for(let i=0;i<count;i++)changed.get(file).add(start+i);
  }
 }
 return changed;
}
export async function gitChangedLines(root,{base}={}){
 let commit;
 if(base){
  const verified=await spawnBounded('git',['rev-parse','--verify','--end-of-options',`${base}^{commit}`],{cwd:root,timeoutMs:15000});
  if(verified.code!==0||verified.error)throw Error('Invalid --base commit ref');
  commit=verified.stdout.trim();
 }
 const args=['-c','core.quotepath=false','diff' ,'--no-ext-diff','--no-textconv','--no-renames','--unified=0',...(commit?[commit]:['HEAD']),'--'];
 const run=await spawnBounded('git',args,{cwd:root,timeoutMs:15000});
 if(run.code!==0||run.error)throw Error(`Cannot determine changed lines: ${run.error||run.stderr.trim()}`);
 const changed=parseChangedDiff(run.stdout);
 const fresh=await spawnBounded('git',['ls-files','--others','--exclude-standard','-z'],{cwd:root,timeoutMs:15000});
 if(fresh.code!==0||fresh.error)throw Error('Cannot determine untracked files');
 for(const file of fresh.stdout.split('\0').filter(Boolean))changed.set(file,null);
 return changed;
}
export function touchesChanged(f,changed){return changed.has(f.file)&&(changed.get(f.file)===null||changed.get(f.file).has(f.line)||(f.lines||[]).some(n=>changed.get(f.file).has(n)));}
