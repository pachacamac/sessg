const layout = require("./components/layout");

module.exports = function({src,dst}){
  return layout(html`
    <h1>I am the index page!</h1>
    <p>I was born here: ${src}</p>
    <p>And ended up here: ${dst}</p>
  `);
}