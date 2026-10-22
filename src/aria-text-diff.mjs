// Plain text comparison. This module does not parse YAML or infer semantic violations.
const defaults={context:3,maxCells:1_000_000,maxOperations:4000,maxLines:120,maxBytes:12000,maxLineBytes:2000};
export function truncateUtf8(text,limit){
 if(Buffer.byteLength(text)<=limit)return text;
 let result='',bytes=0;
 for(const char of text){const size=Buffer.byteLength(char);if(bytes+size>limit)break;result+=char;bytes+=size;}
 return result;
}

export function ariaTextDiff(before,after,options={}){
 const limits={...defaults,...options};
 const old=before===''?[]:before.split('\n'),current=after===''?[]:after.split('\n');
 let prefix=0,suffix=0;
 while(prefix<old.length&&prefix<current.length&&old[prefix]===current[prefix])prefix++;
 while(suffix<old.length-prefix&&suffix<current.length-prefix&&old[old.length-1-suffix]===current[current.length-1-suffix])suffix++;
 const a=old.slice(prefix,old.length-suffix),b=current.slice(prefix,current.length-suffix);
 const result={schemaVersion:1,status:'compared',format:'unified',algorithm:'line-lcs',oldTotalLines:old.length,newTotalLines:current.length,hunks:[],truncated:false,truncationReasons:[],omittedLines:0,omittedHunks:0,outputBytes:0,limits};
 if(!a.length&&!b.length)return result;
 const fallback=(a.length+1)*(b.length+1)>limits.maxCells||a.length+b.length>limits.maxOperations;
 const ops=[];let oldLine=prefix+1,newLine=prefix+1;
 const append=(type,text)=>{ops.push({type,text,oldLine,newLine});if(type!=='add')oldLine++;if(type!=='remove')newLine++;};
 const contextStart=Math.max(0,prefix-limits.context);
 oldLine=newLine=contextStart+1;
 for(let i=contextStart;i<prefix;i++)append('context',old[i]);
 if(fallback){
  // A bounded replacement is a valid (non-minimal) text edit, never a semantic diff.
  result.algorithm='bounded-replacement';
  const firstOld=oldLine,firstNew=newLine;
  for(const line of a.slice(0,limits.maxLines+1))append('remove',line);
  const removedShown=Math.min(a.length,limits.maxLines+1);
  oldLine=firstOld+a.length;newLine=firstNew;
  for(const line of b.slice(0,limits.maxLines+1))append('add',line);
  const addedShown=Math.min(b.length,limits.maxLines+1);
  newLine=firstNew+b.length;
  result.omittedLines=a.length-removedShown+b.length-addedShown;
  if(result.omittedLines){result.truncated=true;result.truncationReasons.push('replacement operation limit');}
 }else{
  const width=b.length+1,table=new Uint32Array((a.length+1)*width);
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--){
   table[i*width+j]=a[i]===b[j]?1+table[(i+1)*width+j+1]:Math.max(table[(i+1)*width+j],table[i*width+j+1]);
  }
  let i=0,j=0;
  while(i<a.length||j<b.length){
   if(i<a.length&&j<b.length&&a[i]===b[j]){append('context',a[i]);i++;j++;}
   else if(i<a.length&&(j===b.length||table[(i+1)*width+j]>=table[i*width+j+1]))append('remove',a[i++]);
   else append('add',b[j++]);
  }
 }
 for(let i=old.length-suffix;i<Math.min(old.length,old.length-suffix+limits.context);i++)append('context',old[i]);
 const windows=[];
 for(let i=0;i<ops.length;i++)if(ops[i].type!=='context'){
  const start=Math.max(0,i-limits.context),end=Math.min(ops.length,i+limits.context+1),last=windows.at(-1);
  if(last&&start<=last.end)last.end=end;else windows.push({start,end});
 }
 let emitted=0;
 for(const window of windows){
  const rows=ops.slice(window.start,window.end);
  const oldCount=rows.filter(r=>r.type!=='add').length,newCount=rows.filter(r=>r.type!=='remove').length;
  const hunk={oldStart:rows[0].oldLine-(oldCount?0:1),oldLines:oldCount,newStart:rows[0].newLine-(newCount?0:1),newLines:newCount,lines:[]};
  if(fallback){hunk.oldLines=a.length+prefix-contextStart+Math.min(suffix,limits.context);hunk.newLines=b.length+prefix-contextStart+Math.min(suffix,limits.context);}
  for(const row of rows){
   if(emitted>=limits.maxLines||result.outputBytes+2>limits.maxBytes){result.omittedLines++;continue;}
   const text=truncateUtf8(row.text,Math.max(0,Math.min(limits.maxLineBytes,limits.maxBytes-result.outputBytes-2)));
   const textTruncated=text!==row.text;
   hunk.lines.push({...row,text,...(textTruncated?{textTruncated:true}:{})});
   emitted++;result.outputBytes+=Buffer.byteLength(text)+2;
   if(textTruncated){result.truncated=true;result.truncationReasons.push('line byte limit');}
  }
  if(hunk.lines.length)result.hunks.push(hunk);else result.omittedHunks++;
 }
 if(result.omittedLines||result.omittedHunks){result.truncated=true;result.truncationReasons.push('output limit');}
 result.truncationReasons=[...new Set(result.truncationReasons)];
 return result;
}
