export const visualDefaults={enabled:false,mode:'advisory',baselineDir:'ui-visual-baseline',environmentProfile:null,capture:'viewport',threshold:0.1,maxDiffPixels:0,maxDiffRatio:0,masks:[],stabilityAttempts:3};
export function visualOptions(config){return {...visualDefaults,...config.visual};}
export function validateVisual(value){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('visual must be an object');
 for(const key of Object.keys(value))if(!Object.hasOwn(visualDefaults,key))throw Error('Unknown visual field: '+key);
 const v={...visualDefaults,...value};
 if(typeof v.enabled!=='boolean'||!['advisory','enforce'].includes(v.mode)||!['viewport','fullPage'].includes(v.capture))throw Error('Invalid visual enabled/mode/capture');
 if(typeof v.baselineDir!=='string'||!v.baselineDir.trim())throw Error('visual.baselineDir must be a nonempty path');
 if(v.environmentProfile!==null&&(typeof v.environmentProfile!=='string'||!v.environmentProfile.trim()||v.environmentProfile.length>200))throw Error('visual.environmentProfile must be null or a short declared font/execution profile');
 for(const key of ['threshold','maxDiffRatio'])if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<0||v[key]>1)throw Error('visual.'+key+' must be 0..1');
 if(!Number.isInteger(v.maxDiffPixels)||v.maxDiffPixels<0||v.maxDiffPixels>16000000)throw Error('visual.maxDiffPixels must be 0..16000000');
 if(!Number.isInteger(v.stabilityAttempts)||v.stabilityAttempts<2||v.stabilityAttempts>5)throw Error('visual.stabilityAttempts must be 2..5');
 if(!Array.isArray(v.masks)||v.masks.length>20||v.masks.some(s=>typeof s!=='string'||!s.trim()||s.length>500))throw Error('visual.masks must contain at most 20 selectors of 1..500 characters');
 if(v.enabled&&v.mode==='enforce'&&!v.environmentProfile)throw Error('visual enforce requires an explicitly declared environmentProfile for fonts and execution image');
}
