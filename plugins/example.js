let buildCount = 0
let generateCount = 0
let fileCount = 0

// called after cli args are parsed and plugins are loaded
// let's you override how some command line args work or even define new ones
function argsParsed(args){
  if(args.output.serve){
    delete args.output.serve
    console.log('... too lazy but imagine adding code here to define a custom http server ...')
  }
  if(process.argv.slice(2).indexOf('--custom')){
    console.log('--custom flag detected ... doing nothing though')
  }
  return args.output
}

// called before a file is generated
// useful e.g. to calculate custom metrics etc
function beforeGenerate({file, output}){
  generateCount++
}

// called after a file is generated. does not apply for static files that only get copied
// useful e.g. for when you want to append something to the output or for custom metrics 
function afterGenerate({file, output}){
  return html`${output}\n<!-- ${file} generated @${new Date().toISOString()} -->`
}

// called before any file is generated or copied
// useful e.g. for custom metrics or to exclude files etc maybe for caching
function beforeFile({src, dst}){
  return true // returning false skips that file alltogether
}

// called after any file is generated or copied
// useful e.g. for postprocessing of images or custom metrics
function afterFile({src, dst}){
  fileCount++
}

// called before the build is started
// useful e.g. for custom metrics
function beforeBuild({sdPairs, rmd}){
  console.log(`Build number ${++buildCount}`)
}

// called after the build is finished
// useful e.g. for custom metrics or postprocessing
function afterBuild({logs}){ 
  console.log(`${buildCount} builds, ${generateCount} files generated, ${fileCount} files processed in total so far`)
}

module.exports = {
  argsParsed,
  beforeFile,
  afterFile,
  beforeGenerate,
  afterGenerate,
  beforeBuild,
  afterBuild
}
