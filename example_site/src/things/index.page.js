const {fileNames} = require("../components/utils");
const layout = require("../components/layout");

module.exports = function(){
  return layout(html`
    <h1>This is a collection of things!</h1>
    So far we got:
    <ul>
      ${fileNames(__dirname).filter(e=>e!='index').map(e=>`<li>${e}</li>`)}
    </ul>  
  `);
}
