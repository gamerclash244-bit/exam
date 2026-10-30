// App core: menu, practice, exam runner, results history and the suggest-a-question form.
(function(){
var $=function(i){return document.getElementById(i)},view=$("view"),L="ABCD";
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var sum=function(a,f){return a.reduce(function(t,x){return t+f(x)},0)};
var opts=function(a,all){return(all?'<option value="">'+all+"</option>":"")+a.map(function(x){return"<option>"+esc(x)+"</option>"}).join("")};
var minsOpts=function(sel){return[0,10,20,30,45,60,90,120].map(function(m){return'<option value="'+m+'"'+(m===+sel?" selected":"")+">"+(m?m+" minutes":"No time limit")+"</option>"}).join("")};
var cur="home",run=null,timer=null,last=null;
var App=window.App={view:view,L:L,esc:esc,sum:sum,opts:opts,minsOpts:minsOpts,views:{},go:go,startRun:startRun,openExam:openExam,setCur:function(v){cur=v;nav()}};
Symbols.init($("sym"));

function nav(){
  var it=[["home","Practice"],["create","Create exam"],["hist","Results"],["suggest","Suggest a question"]];
  $("nav").innerHTML=it.map(function(i){return'<button data-v="'+i[0]+'" class="'+(cur===i[0]||(cur==="edit"&&i[0]==="create")?"on":"")+'">'+i[1]+"</button>"}).join("");
  Array.prototype.forEach.call($("nav").querySelectorAll("[data-v]"),function(b){b.onclick=function(){go(b.dataset.v)}})}
$("logo").onclick=function(){go("home")};
function go(v){
  if(run&&!confirm("Leave the exam? Your answers will be lost."))return;
  clearInterval(timer);run=null;cur=v;$("sym").hidden=true;nav();App.views[v]();window.scrollTo(0,0)}

// ---------- practice ----------
App.views.home=function(){
  var all=Store.all(),subs=Store.subjects();
  view.innerHTML='<div class="card"><h2>Practice</h2><p class="mute">Pick a subject and take a quick exam from the question bank.</p><label>Your name<input id="nm" placeholder="Student name" value="'+esc(Store.load("pe_name",""))+'"></label>'+
  '<div class="row"><label>Subject<select id="sb">'+opts(subs,"All subjects")+'</select></label><label>Chapter<select id="ch"></select></label></div>'+
  '<div class="row"><label>Questions<select id="cn">'+opts([5,10,15,20,30])+'</select></label><label>Time limit<select id="tm">'+minsOpts(0)+'</select></label></div>'+
  '<p class="mute" id="av"></p><button class="pri" id="st">Start</button></div>'+
  '<p class="mute">Teacher? Open <b>Create exam</b> to make an exam with your own questions. Students’ scores come to your results page.</p>';
  $("cn").value="10";
  function pool(){var s=$("sb").value,c=$("ch").value;return all.filter(function(q){return(!s||q.s===s)&&(!c||q.c===c)})}
  function chapters(){var s=$("sb").value,seen={},c=[];all.forEach(function(q){if((!s||q.s===s)&&!seen[q.c]){seen[q.c]=1;c.push(q.c)}});$("ch").innerHTML=opts(c,"All chapters");info()}
  function info(){var p=pool();$("av").textContent=p.length+" questions · "+sum(p,function(q){return q.m})+" marks available"}
  $("sb").onchange=chapters;$("ch").onchange=info;chapters();
  $("st").onclick=function(){
    var qs=Exam.build({subject:$("sb").value,chapter:$("ch").value,count:+$("cn").value});
    if(!qs.length)return alert("No questions match.");
    var nm=$("nm").value.trim()||"Student";Store.save("pe_name",nm);
    startRun({title:"Practice · "+($("sb").value||"All subjects"),subject:$("sb").value||"All subjects",mins:+$("tm").value,qs:qs,name:nm})}};

// ---------- opening a shared exam ----------
function openExam(id){
  cur="intro";nav();view.innerHTML='<p class="mute">Opening exam…</p>';
  Api.get(id).then(function(ex){ex.remote=true;intro(ex)}).catch(function(e){
    cur="home";nav();view.innerHTML='<div class="card"><h2>Exam not available</h2><p class="mute">'+esc(e.message)+'</p><button class="pri" id="hm">Go to Practice</button></div>';
    $("hm").onclick=function(){history.replaceState(null,"",location.pathname);go("home")}})}
function intro(ex){
  view.innerHTML='<div class="card"><h2>'+esc(ex.title)+'</h2><p class="mute">'+esc(ex.subject)+" · "+ex.qs.length+" questions · "+sum(ex.qs,function(q){return q.m})+" marks · "+(ex.mins?ex.mins+" minutes":"no time limit")+'</p><label>Your name<input id="nm" value="'+esc(Store.load("pe_name",""))+'"></label><button class="pri big" id="go1" style="margin-top:16px">Start exam</button><p class="mute">Your score is sent to the person who made this exam.</p></div>';
  $("go1").onclick=function(){var nm=$("nm").value.trim();if(!nm)return $("nm").focus();Store.save("pe_name",nm);startRun(Object.assign({},ex,{name:nm}))}}

// ---------- taking an exam ----------
function qcard(q,i){
  return'<div class="q"><div class="qh"><span>'+(i+1)+(q.c?" · "+esc(q.c):"")+"</span><span>"+q.m+" mark"+(q.m>1?"s":"")+'</span></div><div class="qt">'+esc(q.q)+"</div>"+
  (q.t==="mcq"?q.o.map(function(o,j){return o?'<label class="opt"><input type="radio" name="q'+i+'" value="'+L[j]+'"><span>'+L[j]+". "+esc(o)+"</span></label>":""}).join(""):
  '<textarea name="q'+i+'" placeholder="Write your answer here"></textarea><button type="button" class="link" data-sym="'+i+'">Σ Symbols (², √, π, H₂O …)</button>')+"</div>"}

function startRun(ex){
  last=ex;run=ex;cur="exam";nav();document.documentElement.style.setProperty("--th",$("hd").offsetHeight+"px");
  view.innerHTML='<div class="examhead"><div><b>'+esc(ex.title)+'</b><div class="mute">'+esc(ex.name)+" · "+ex.qs.length+" questions · "+sum(ex.qs,function(q){return q.m})+' marks</div></div><div class="timer" id="tmr"></div></div>'+
    ex.qs.map(qcard).join("")+'<button class="pri big" id="sub">Submit exam</button>';
  window.scrollTo(0,0);
  Array.prototype.forEach.call(view.querySelectorAll("[data-sym]"),function(b){b.onclick=function(){Symbols.toggle(view.querySelector("textarea[name=q"+b.dataset.sym+"]"))}});
  if(ex.mins){var end=Date.now()+ex.mins*60000;var tick=function(){var s=Math.max(0,Math.round((end-Date.now())/1000));$("tmr").textContent=Math.floor(s/60)+":"+("0"+s%60).slice(-2);if(!s){clearInterval(timer);finish(true)}};tick();timer=setInterval(tick,1000)}
  $("sub").onclick=function(){var un=answers().filter(function(a){return!a}).length;if(!un||confirm(un+" question(s) not answered. Submit anyway?"))finish()}}

function answers(){return run.qs.map(function(q,i){return q.t==="mcq"?((view.querySelector("input[name=q"+i+"]:checked")||{}).value||""):view.querySelector("textarea[name=q"+i+"]").value.trim()})}

function finish(auto){
  clearInterval(timer);var a=answers(),ex=run;
  if(ex.remote){  // marked on the server, saved for the exam maker
    var sb=$("sub");sb.disabled=true;sb.textContent="Submitting…";
    return Api.submit(ex.id,ex.name,a).then(function(r){
      var res=ex.qs.map(function(q,i){var v=r.review[i];return Object.assign({q:Object.assign({},q,{a:v.a,e:v.e}),ans:a[i]},v)});
      done(ex,res,r.got,r.total,auto)
    }).catch(function(e){sb.disabled=false;sb.textContent="Submit exam";alert("Could not submit: "+e.message+"\nYour answers are still here. Press Submit to try again.")})}
  var res=ex.qs.map(function(q,i){return Object.assign({q:q,ans:a[i]},Exam.grade(q,a[i]))});
  done(ex,res,sum(res,function(r){return r.got}),sum(res,function(r){return r.q.m}),auto)}

function done(ex,res,got,total,auto){
  var rec={date:new Date().toISOString(),name:ex.name,title:ex.title,subject:ex.subject,got:got,total:total,n:res.length};
  Store.addHist(rec);clearInterval(timer);run=null;cur="home";$("sym").hidden=true;nav();result(rec,res,auto,ex)}

function result(rec,res,auto,ex){
  var pc=rec.total?Math.round(rec.got/rec.total*100):0,by={},hide=ex.remote&&!ex.showAnswers;
  res.forEach(function(r){var b=by[r.q.s]||(by[r.q.s]={g:0,t:0});b.g+=r.got;b.t+=r.q.m});
  var txt=rec.name+" · "+rec.title+" · "+rec.got+"/"+rec.total+" ("+pc+"%)";
  view.innerHTML='<div class="card center">'+(auto?'<p class="mute">Time is up. Your answers were submitted.</p>':"")+'<div class="mute">'+esc(rec.name)+" · "+esc(rec.title)+'</div><div class="big-n">'+rec.got+" / "+rec.total+"</div><div>"+pc+"% · "+(pc>=80?"Excellent":pc>=60?"Good":pc>=40?"Keep practising":"Needs more work")+'</div><div class="bar2"><i style="width:'+pc+'%"></i></div>'+
  (ex.remote?'<p class="mute">Your score has been sent to the exam maker.</p>':"")+
  (Object.keys(by).length>1?'<p class="mute">'+Object.keys(by).map(function(s){return esc(s)+": "+by[s].g+"/"+by[s].t}).join(" · ")+"</p>":"")+
  '<div class="acts" style="justify-content:center"><button class="pri" id="again">Done</button>'+(ex.remote?"":'<button id="retry">Retry</button>')+'<button id="cp">Copy result</button></div></div>'+
  (hide?'<p class="mute">The exam maker has chosen not to show answers.</p>':'<div class="sec">REVIEW</div>'+
  res.map(function(r,i){var q=r.q,full=r.got===q.m,body;
    if(q.t==="mcq")body="<div>Your answer: "+(r.ans?"<b>"+r.ans+"</b>. "+esc(q.o[L.indexOf(r.ans)]):"<i>not answered</i>")+"</div>"+(r.ok||!q.a?"":"<div>Correct answer: <b>"+q.a+"</b>. "+esc(q.o[L.indexOf(q.a)])+"</div>");
    else body="<div>Your answer: "+(r.ans?esc(r.ans):"<i>not answered</i>")+"</div>"+(r.manual?'<div class="mute">No model answer was set, so a teacher must mark this.</div>':((r.hit&&r.hit.length?'<div class="mute">Covered: '+esc(r.hit.join(", "))+"</div>":"")+(r.miss&&r.miss.length?'<div class="mute">Missing: '+esc(r.miss.join(", "))+"</div>":"")))+(q.a?'<div class="box">Model answer: '+esc(q.a)+"</div>":"");
    return'<div class="q '+(full?"good":r.got>0?"part":"bad")+'"><div class="qh"><span>'+(i+1)+" · "+(full?"Correct":r.got>0?"Partly correct":"Wrong")+"</span><span>"+r.got+" / "+q.m+'</span></div><div class="qt">'+esc(q.q)+"</div>"+body+(q.e?'<div class="mute" style="margin-top:6px">'+esc(q.e)+"</div>":"")+"</div>"}).join("")+
  '<p class="mute">Written answers are marked by key points, so a teacher’s marking may differ.</p>');
  $("again").onclick=function(){history.replaceState(null,"",location.pathname);go("home")};
  if($("retry"))$("retry").onclick=function(){startRun(Object.assign({},last,{mins:0}))};
  $("cp").onclick=function(){try{navigator.clipboard.writeText(txt).then(function(){$("cp").textContent="Copied"})}catch(e){prompt("Copy your result",txt)}};
  window.scrollTo(0,0)}

// ---------- results on this device ----------
App.views.hist=function(){
  var h=Store.hist();
  view.innerHTML='<h2>Results</h2>'+(h.length?h.map(function(r){var pc=r.total?Math.round(r.got/r.total*100):0;return'<div class="item"><div class="l"><b>'+esc(r.title||r.subject)+'</b><div class="mute">'+esc(r.name)+" · "+new Date(r.date).toLocaleString()+'</div></div><div style="text-align:right"><b>'+r.got+"/"+r.total+'</b><div class="mute">'+pc+"%</div></div></div>"}).join("")+'<div class="acts"><button id="hc">Clear results</button></div>':'<p class="mute">No exams taken yet on this device.</p>');
  if(h.length)$("hc").onclick=function(){if(confirm("Clear the results saved on this device?")){Store.save("pe_hist",[]);App.views.hist()}}};

// ---------- suggest a question (goes into the Google Form) ----------
App.views.suggest=function(){
  view.innerHTML='<div class="card"><h2>Suggest a question</h2><p class="mute">Know a good question? Send it with its answer and it goes straight to the teachers.</p>'+
  '<label>Question<textarea id="sq" maxlength="1000"></textarea></label><button type="button" class="link" id="sy">Σ Symbols (², √, π, H₂O …)</button>'+
  '<label>Answer<textarea id="sa" maxlength="1000"></textarea></label>'+
  '<div class="acts"><button class="pri" id="ss">Send</button><span class="mute" id="sm"></span></div></div>';
  $("sy").onclick=function(){Symbols.toggle($("sq"))};
  $("ss").onclick=function(){
    var q=$("sq").value.trim(),a=$("sa").value.trim(),b=$("ss");
    if(!q||!a)return $("sm").textContent="Fill in both the question and the answer.";
    b.disabled=true;$("sm").textContent="Sending…";
    Api.suggest(q,a).then(function(){$("sq").value="";$("sa").value="";$("sm").textContent="Thank you! Your question was sent."})
      .catch(function(e){$("sm").textContent=e.message}).then(function(){b.disabled=false})}};
})();
