const path = require("path");
const fs = require("fs");

function fileNames(dir){
  return fs.readdirSync(dir).map(e=>path.join(dir, e)).filter(e=>!fs.lstatSync(e).isDirectory()).map(e=>path.basename(e).split('.')[0])
}

module.exports = { fileNames }