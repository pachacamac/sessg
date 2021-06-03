const layout = require("../components/layout");

module.exports = function(){
  const start = new Date().getTime();
  do { /*nothing for a while so the analysis plugin has something to show*/ } while(new Date().getTime() - start < 123);
  return layout(html`<h1>I am <strong>foo</strong></h1>`);
}