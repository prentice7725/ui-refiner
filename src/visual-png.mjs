import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';

export const visualHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const maxVisualPixels=16_000_000,maxVisualBytes=32_000_000;
export function decodeVisualPng(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<33||bytes.length>maxVisualBytes||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid or oversized visual PNG');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(!width||!height||width*height>maxVisualPixels)throw Error('Visual PNG exceeds the 16 million pixel limit');
 return PNG.sync.read(bytes,{checkCRC:true});
}
export async function readVisualFile(root,file,expected){
 if(typeof file!=='string'||!file||path.isAbsolute(file)||file.split(/[\\/]/).some(s=>s==='..'||s===''))throw Error('Invalid visual artifact path');
 const base=await fs.realpath(root),target=path.resolve(base,file);
 if(!target.startsWith(base+path.sep))throw Error('Visual artifact must remain inside its directory');
 const actual=await fs.realpath(target),stat=await fs.lstat(target);
 if(!actual.startsWith(base+path.sep)||!stat.isFile()||stat.isSymbolicLink()||stat.size>maxVisualBytes)throw Error('Visual artifact is not a bounded regular file');
 const handle=await fs.open(target,'r');let bytes;
 try{const opened=await handle.stat();if(!opened.isFile()||opened.size!==stat.size)throw Error('Visual artifact changed while opening');const buffer=Buffer.alloc(stat.size+1);let count=0;while(count<buffer.length){const read=await handle.read(buffer,count,buffer.length-count,count);if(!read.bytesRead)break;count+=read.bytesRead;}if(count!==stat.size)throw Error('Visual artifact changed while reading');bytes=buffer.subarray(0,count);}
 finally{await handle.close();}
 if(expected&&(!/^[a-f0-9]{64}$/.test(expected.sha256||'')||visualHash(bytes)!==expected.sha256||bytes.length!==expected.bytes))throw Error('Visual artifact hash or byte count mismatch');
 return bytes;
}
export function compareVisualPng(actualBytes,expectedBytes,options){
 const actual=decodeVisualPng(actualBytes),expected=decodeVisualPng(expectedBytes);
 const dimensions={actual:{width:actual.width,height:actual.height},expected:{width:expected.width,height:expected.height}};
 if(actual.width!==expected.width||actual.height!==expected.height)return {status:'different',reason:'Image dimensions changed; no resizing performed',dimensions,diffPixels:null,diffRatio:null,diff:null};
 const totalPixels=actual.width*actual.height,output=new PNG({width:actual.width,height:actual.height});
 const diffPixels=pixelmatch(expected.data,actual.data,output.data,actual.width,actual.height,{threshold:options.threshold,includeAA:false});
 const allowedDiffPixels=Math.max(options.maxDiffPixels,Math.floor(totalPixels*options.maxDiffRatio));
 return {status:diffPixels<=allowedDiffPixels?'matched':'different',dimensions,totalPixels,diffPixels,diffRatio:diffPixels/totalPixels,allowedDiffPixels,diff:PNG.sync.write(output)};
}
