// Exam: builds a practice paper and marks answers.
(function(root){
  var E={},SUP={"⁰":0,"¹":1,"²":2,"³":3,"⁴":4,"⁵":5,"⁶":6,"⁷":7,"⁸":8,"⁹":9},
  STOP="the and for are was were that this with from have has had not but you your can will its into than then them they their which what when where who whom while also such been being does did each some more most other only very".split(" ");
  // makes "sin²θ", "sin^2θ" and "sin 2θ"-style typing compare equal; subscripts become plain digits
  function norm(s){return s.toLowerCase().replace(/[−–—]/g,"-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,function(c){return"^"+SUP[c]}).replace(/⁻/g,"^-").replace(/[₀-₉]/g,function(c){return c.charCodeAt(0)-8320}).replace(/\s+/g,"")}
  function autoKeys(a){var w=a.toLowerCase().match(/[a-z0-9]{4,}/g)||[],seen={},k=[];
    w.forEach(function(x){if(STOP.indexOf(x)<0&&!seen[x]){seen[x]=1;k.push(x)}});
    return k.length?k.slice(0,8):(a.trim()?[a.trim()]:[])}
  E.build=function(o){
    var pool=Store.all().filter(function(q){return(!o.subject||q.s===o.subject)&&(!o.chapter||q.c===o.chapter)});
    pool.sort(function(){return Math.random()-.5});return pool.slice(0,o.count)};
  // MCQ: full marks or zero. Written: by key points (yours, or the main words of your model answer).
  E.grade=function(q,ans){
    if(q.t==="mcq"){var ok=ans===q.a;return{got:ok?q.m:0,ok:ok}}
    var keys=q.k&&q.k.length?q.k:autoKeys(q.a||"");
    if(!keys.length)return{got:0,manual:true};
    var na=norm(ans||""),hit=[],miss=[];
    keys.forEach(function(k){(na.indexOf(norm(k))>-1?hit:miss).push(k)});
    return{got:Math.round(hit.length/keys.length*q.m*2)/2,hit:hit,miss:miss}};
  root.Exam=E;if(typeof module!=="undefined")module.exports=E;
})(typeof window!=="undefined"?window:globalThis);
