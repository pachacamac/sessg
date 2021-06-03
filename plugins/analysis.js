const {colorLog} = require('../sessg');
const {statSync} = require('fs');
const {extname} = require('path');
let fileSummary = [];

function outliers(arr, sd=2, key=null) {
  const values = arr.map(e=>key?e[key]:e).sort((a, b) => a - b);
  const mean = values.reduce((s,e)=>s+e) / values.length;
  const stdev = Math.sqrt(values.map(e=>(e-mean)**2).reduce((s,e)=>s+e)/values.length);
  return arr.filter(e=>(key?e[key]:e) >= mean+sd*stdev).sort((a, b) => (key?b[key]:b) - (key?a[key]:a));
}

function afterFile({src, dst}){
  try { fileSummary.push({src, dst, ext: (extname(dst)||'no ext').toUpperCase(), size: statSync(dst).size}) } catch (err) { console.log(err) }
}

function beforeBuild({sdPairs, rmd}){
  fileSummary = []
}

function afterBuild({logs}){
  const round = (n)=>Math.round((n*10)/1024)/10;
  const pluralize = (s,n)=>n == 1 ? s : s+'s';
  const spaced = (s,ml,b="\t")=>`${s} ${' '.repeat(ml-String(s).length)}${b}`;
  const totalSize = fileSummary.reduce((s,e)=>s+e.size, 0);
  const extSize = fileSummary.reduce((s,e)=>{s[e.ext] = s[e.ext] ? s[e.ext]+e.size : e.size; return s}, {});
  const extCount = fileSummary.reduce((s,e)=>{s[e.ext] = s[e.ext] ? s[e.ext]+1 : 1; return s}, {});
  const extSum = Object.entries(extCount).map(([k,v])=>({ext:k, count:v, size:extSize[k]})).sort((a,b)=>b.size-a.size)
  const extSumOut = outliers(extSum, 1, 'size');
  colorLog('⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼ sizes ⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼', 'white');
  const mext = Math.max(...extSum.map(e=>e.ext.length)), msize = Math.max(...extSum.map(e=>String(e.size).length));
  extSum.forEach(e=>colorLog(`${spaced(e.ext,mext)} ${spaced(round(e.size),msize,' ')}kb\tin ${e.count} ${pluralize('file', e.count)}`, extSumOut.indexOf(e)!=-1 ? 'yellow' : 'green', {bright:false}))
  colorLog(`${spaced('TOTAL',mext)} ${spaced(round(totalSize),msize,' ')}kb\tin ${fileSummary.length} ${pluralize('file', fileSummary.length)}`, 'white');

  const errors = logs.filter(e=>e.error);
  const timesinks = outliers(logs, 2, 'time');
  const heavyweights = outliers(fileSummary, 2, 'size');
  if(errors.length || timesinks.length || heavyweights.length){
    colorLog('⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼ problems ⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼', 'white');
    errors.map(e=>colorLog(`💀 ${e.src} 🔎 ${e.error}`, 'red'));
    timesinks.map(e=>colorLog(`⏳ ${e.src} ${e.time} ms is slower than others`, 'yellow'));
    heavyweights.map(e=>colorLog(`🐘 ${e.src} ${round(e.size)} kb is bigger than others`, 'yellow', {bright: false}));
  }else{
    colorLog('✅ no problems detected', 'green');
  }
  colorLog('⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼⎼', 'white');
}

module.exports = { beforeBuild, afterBuild, afterFile }