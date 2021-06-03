const fs = require('fs');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

// simplistic markdown conversion plugin. to be improved

function afterFile({src, dst}){
  if(dst.endsWith('.md')){
    const newDst = dst.slice(0,-3)+'.html';
    console.log(`generating markdown for ${dst} -> ${newDst}`);
    const content = fs.readFileSync(dst, 'utf8');
    fs.writeFileSync(newDst, md.render(content));
    fs.unlinkSync(dst);
  }
}

module.exports = { afterFile }