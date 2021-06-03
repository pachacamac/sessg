const path = require("path");
const {fileNames} = require("./components/utils");
const layout = require("./components/layout");

module.exports = function(){

  const images = fileNames(path.join(__dirname, 'assets', 'screenshots')).map(e=>
    html`<h2>${e}</h2><img src="/assets/screenshots/${e}.png" alt="${e}">`
  )

  return layout(html`
    <h1>Let's see some screenshots!</h1>
    ${images.join('<br>')}
  `);
}