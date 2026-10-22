export function reportExitCode(report){return ['ERROR','INCOMPLETE'].includes(report.automatedStatus)?2:report.automatedStatus==='FAIL'?1:report.automatedStatus==='SCOPED_PASS'?3:0;}
export function validateReport(report){
 if(!report||report.fingerprintVersion!==2||!['PASS','FAIL','ERROR','INCOMPLETE','SCOPED_PASS'].includes(report.automatedStatus)||!Array.isArray(report.findings)||!Array.isArray(report.stages)||!report.scope)throw Error('Invalid UI Refiner report');
 if(report.exitCode!==undefined&&report.exitCode!==reportExitCode(report))throw Error('Report status and exitCode disagree');
 return report;
}
export function safeRelative(file){return typeof file==='string'&&file.length>0&&!/^[\\/]|:|[\x00-\x1f]/.test(file)&&!file.split(/[\\/]/).some(p=>p==='..'||p==='.'||p==='');}
