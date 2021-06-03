const path = require("path");
const fileNames = require("./utils").fileNames;
const nav = require("./nav.js");

module.exports = function(content, navigation=null) {
  navigation = navigation || nav([
    {url: '/', text: 'Home'},
    {url: 'https://github.com/pachacamac/sessg', text: 'sessg on Github'},
    {url: '/screenshots.html', text: 'Screenshots'},
    {url: '/things', text: 'Things'},
    fileNames(path.join(__dirname, "..", "things")).filter(e=>e!='index').map(name=>({url: `/things/${name}.html`, text: name}))
  ]);
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>SESSG Example Site</title>
        <link href="/assets/style.css" rel="stylesheet">
      </head>
      <body>
        <section>${navigation}</section>
        <section>${content}</section>
      </body>
    </html>
  `;
};