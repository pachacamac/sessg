// This shows how to create non-html pages.
// Simply add the extension you like in front like so `filename.<ext>-page.js`.
// The default when you only use `filename.page.js` results in `filename.html`.

module.exports = function(){
  return html`
  User-agent: *
  Allow: /
  
  `
}
