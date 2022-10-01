#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const GENERATOR_FILE_REGEXP = /\.(.*?)-?page\.js$/;
const plugins = [];

function applyPlugins(hook, args={}){ // applies plugins that match the hook definitions
  args = Object.assign({output: ''}, args);
  return plugins.filter(e=>(typeof e.plugin[hook] === 'function')).reduce((s,e)=>{
    try{ args.output = e.plugin[hook](args) || args.output }catch(err){ colorLog(`❌ plugin ${e.name} ${hook}: ${err.message}`, 'red') }
    return args.output
  }, args.output)
}

function generate(src, dst){ // takes a file that is a js module and uses it to generate the final output
  let output = '', time = new Date().getTime(), error = null;
  try {
    let generator = require(path.resolve(src));
    output = applyPlugins('beforeGenerate', {src, dst, output});
    if(typeof generator != 'function') generator = generator['render'];
    if(typeof generator != 'function') throw(new Error(`${src} does not export a valid render function!`));
    output = generator({src,dst,output}).trim();
    output = applyPlugins('afterGenerate', {src, dst, output});
  }catch(err){
    error = err
  }
  return {output, error, src, dst, time: new Date().getTime()-time};
}
function nestedFolders(src){ // gets all folders recursively inside src
  return [src, ...fs.readdirSync(src).map(e=>path.join(src, e)).filter(e=>fs.lstatSync(e).isDirectory()).map(e=>nestedFolders(e)).flat()];
}
function filesInFolder(src){ // gets all files in src, not recursive
  return fs.readdirSync(src).map(e=>path.join(src, e)).filter(e=>!fs.lstatSync(e).isDirectory());
}
function mkdirpSync(path, mode) { // makes directories recursively
  const dirSep = require('path').sep, splitPath = path.split(dirSep);
  splitPath.forEach((e,i)=>{
    let tmpPath = splitPath.slice(0, i+1).join(dirSep);
    if(tmpPath === '') tmpPath = dirSep;
    if(!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath, mode);
  })
}

function handleSDPair({src, dst, skip=[]}={}){ // handles one src/dst/skip pair recursively, generating page files, copying the rest
  const folders = nestedFolders(src), logs = [];
  folders.filter(folder=>skip.indexOf(folder) === -1).forEach(folder=>{
    filesInFolder(folder).forEach(file=>{
      const generated = !!file.match(GENERATOR_FILE_REGEXP);
      const newDst = file.replace(src, dst).replace(generated ? GENERATOR_FILE_REGEXP : null, (_, ext)=>`.${ext || 'html'}`);
      mkdirpSync(path.dirname(newDst));
      if(applyPlugins('beforeFile', {src: file, dst: newDst, generated}) === false) return;
      if(generated){
        const {output, time, error} = generate(file, newDst);
        //fs.writeFile(newDst, output, (err)=>{if(err)console.error(err)});
        fs.writeFileSync(newDst, output);
        logs.push({src: file, dst: newDst, time, action: 'generate', error});
        colorLog(`🔧 generated ${file} ⏩ ${newDst} ⌚ ${time}ms${error ? ' 💀 '+error : ''}`, error ? 'red' : 'cyan');
      }else{ // we just gotta copy
        const time = new Date().getTime();
        //fs.copyFile(file, newDst, (err)=>{if(err)console.error(err)});
        fs.copyFileSync(file, newDst);
        logs.push({src: file, dst: newDst, time: new Date().getTime() - time, action: 'copy'});
        colorLog(`📤 copied ${file} ⏩ ${newDst} ⌚ ${new Date().getTime() - time}ms`, 'blue'); //⎘📤📥  ▶➔
      }
      applyPlugins('afterFile', {src: file, dst: newDst, generated})
    });
  });
  return logs
};

function build(sdPairs, rmd=false){ // builds one src/dst/ignore pair
  colorLog(`🏁 build started`, 'green');
  const startTime = new Date().getTime();
  applyPlugins('beforeBuild', {sdPairs, rmd});
  if(rmd){[...new Set(sdPairs.map(({dst})=>dst))].map(dst=>fs.rmSync(dst, {recursive: true, force: true}) && colorLog(`🗑️ deleted ${dst}`, 'magenta'))}
  const logs = [].concat(...sdPairs.map(sd=>handleSDPair(sd)));
  colorLog(`✅ build finished ⌚ ${new Date().getTime() - startTime}ms`, 'green');
  applyPlugins('afterBuild', {sdPairs, rmd, logs});
  return sdPairs.map(sd=>nestedFolders(sd.src)).flat();
}

function parseArgs(){ // handles the arg parsing, returns object
  const sdPairs = [];
  const args = process.argv.slice(2);
  const hasParam = (args, i) => i+1<args.length && !args[i+1].startsWith('--');
  let rmd = false, watch = false, serve = false, plugins = [];
  for(let i=0; i<args.length; i++){
    if(args[i] == '--sd'){
      const src = args[++i], dst = args[++i];
      const sd = {src, dst, skip: []};
      while(hasParam(args, i)) sd.skip.push(path.join(src, args[++i]));
      sdPairs.push(sd)
    }
    else if(args[i] == '--plugins'){
      while(hasParam(args, i)){ plugins.push(args[++i]) }
    }
    else if(args[i] == '--rmd') rmd = true;
    else if(args[i] == '--watch') watch = true;
    else if(args[i] == '--serve') serve = hasParam(args, i) ? parseInt(args[++i]) : 8080;
  }
  if(sdPairs.length == 0){
    console.log(`Usage:
    --sd <src> <dst> [<skip in src>, ...]
    \tREQUIRED at least once. Defines src/dst folders with optional folders to skip in src.
    --watch
    \twatches for changes in all src folders and triggers rebuild.
    --rmd
    \tdeletes the dst folders before every build.
    --serve [port]
    \tserves dst folders.
    --plugins plugin1 plugin2.js ...
    \tregisters plugins.`);
    process.exit()
  }
  return {sdPairs, rmd, watch, plugins, serve}
}

function colorLog(s, fg='white', {bg=false, bright=true}={}){ // console.log with color
  const colors = {black:30, red:31, green:32, yellow:33, blue:34, magenta:35, cyan:36, white:37};
  console.log('\x1b[%s%sm%s\x1b[0m', bright ? '1;' : '', colors[fg] + (bg ? 10 : 0), s);
}

function watch(folders, cb){ // watches a list of folders for changes
  const watcher = require('node-watch');
  return folders.map(f=>watcher(f, {recursive: false}, (evt, name)=>cb(name, evt))); // .close();
}

module.exports = { build, generate, watch, handleSDPair, colorLog, mkdirpSync, filesInFolder, nestedFolders };

if(typeof require !== 'undefined' && require.main === module){ // ran as script and not imported
  let args = parseArgs();
  //polyfill the string template literal html tag so it doesn't throw an undefined
  if(typeof html == 'undefined') html = (strings, ...keys)=>strings.map((str,i)=>typeof keys[i] !== 'undefined' ? `${str}${keys[i]}` : str).join('');
  args.plugins.forEach(p=>{ try{ // --plugins
    plugins.push({name: p, plugin: require(path.resolve(p))});
    colorLog(`📦 plugin ${p} loaded!`, 'green', {bright: false});
  }catch(err){ colorLog(`❌ plugin ${p} could not be loaded: ${err.message}`, 'red')}});
  args = applyPlugins('argsParsed', {output: args}); // allow plugins to register custom functionality
  if(args.watch){ // --watch
    try{
      let watchers;
      function changeHandler(file, evt){
        watchers.map(w=>w.close());
        colorLog(`🔁 change detected: ${file}`, 'yellow');
        Object.keys(require.cache).map(key=>delete require.cache[key]); // clear require cache. TODO: only clear relevant keys?
        watchers = watch(build(args.sdPairs, args.rmd), changeHandler);
        colorLog(`👀 watching for changes ...`, 'yellow'); // 👀🔭
      };
      watchers = watch(build(args.sdPairs, args.rmd), changeHandler);
      colorLog(`👀 watching for changes ...`, 'yellow'); // 👀🔭
    }catch(err){
      colorLog(`❌ could not watch for changes: ${err.message}`, 'red');
    }
  } else { // no --watch
    build(args.sdPairs, args.rmd);
  }
  if(args.serve){ // --serve
    try{
      const static = require('node-static'), http = require('http');
      const roots = [...new Set(args.sdPairs.map(({dst})=>dst))];
      roots.forEach((root,i)=>{
        const fileServer = new(static.Server)(root, {cache: 0});
        http.createServer((req, res)=>fileServer.serve(req, res)).listen(args.serve+i);
        colorLog(`📡 serving ${root} on http://localhost:${args.serve+i}`, 'green');
      });
    }catch(err){
      colorLog(`❌ could not run server: ${err.message}`, 'red');
    }
  }
}
