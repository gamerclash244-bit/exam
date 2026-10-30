// Main: decides what to open from the address (#e=exam link, #m=results link).
(function(){
  function boot(){
    var h=location.hash,m=h.match(/^#e=([\w-]+)$/);
    if(m)return App.openExam(m[1]);
    m=h.match(/^#m=([\w-]+)\.([\w-]+)$/);
    if(m)return App.openOwner(m[1],m[2]);
    App.go("home")}
  window.addEventListener("hashchange",function(){if(/^#[em]=/.test(location.hash))boot()});
  if(CONFIG.sheetCsvUrl)Store.sync(CONFIG.sheetCsvUrl).catch(function(){});
  boot();
})();
