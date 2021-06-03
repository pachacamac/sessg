const nav = function(entries, sub=false) {
  const lis = entries.map(e=>
    Array.isArray(e)
    ? html`<li>${nav(e, true)}</li>`
    : html`<li><a href="${e.url}">${e.text}</a></li>`
  ).join("\n");
  return sub ? html`<ul>${lis}</ul>` : html`<nav><ul>${lis}</ul></nav>`;
};

module.exports = nav;