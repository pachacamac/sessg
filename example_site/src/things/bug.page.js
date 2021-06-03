const layout = require("../components/layout");

module.exports = function(){
  const x = 123;
  x = "Let's produce an exception!";
  return layout(html`<h1>I am <strong>bug</strong></h1>`);
}