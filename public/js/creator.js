// Creator: make an exam, add questions (by hand, photo, text or CSV), publish it, get the links.
(function(){
var A=App,$=function(i){return document.getElementById(i)},view=A.view,esc=A.esc,sum=A.sum,L=A.L,draft=null;

A.views.create=function(){
  var l=Store.exams();
  view.innerHTML='<div class="row2"><h2>Your exams</h2><button class="pri" id="nw">+ New exam</button></div>'+
  (l.length?l.map(function(x){return'<div class="item"><div class="l"><b>'+esc(x.title||"Untitled exam")+'</b>'+(x.pub?'<span class="badge">Published</span>':"")+'<div class="mute">'+esc(x.subject||"")+" · "+x.qs.length+" questions · "+sum(x.qs,function(q){return q.m})+' marks</div></div><div><button data-e="'+x.id+'">Edit</button>'+(x.pub?'<button data-r="'+x.id+'">Scores</button>':"")+'<button data-d="'+x.id+'">Delete</button></div></div>'}).join(""):
  '<p class="mute">Make an exam with your own questions and answers. Add them by hand, from a photo of a question paper, or from pasted text. Publish it, share the link, and every student’s score arrives on your private results page.</p>');
  var find=function(id){return Store.exams().filter(function(x){return x.id===id})[0]};
  $("nw").onclick=function(){draft={id:"e"+Date.now().toString(36),title:"",subject:"",mins:0,showAnswers:true,qs:[]};editor()};
  Array.prototype.forEach.call(view.querySelectorAll("[data-e]"),function(b){b.onclick=function(){draft=find(b.dataset.e);editor()}});
  Array.prototype.forEach.call(view.querySelectorAll("[data-r]"),function(b){b.onclick=function(){var p=find(b.dataset.r).pub;A.openOwner(p.id,p.key)}});
  Array.prototype.forEach.call(view.querySelectorAll("[data-d]"),function(b){b.onclick=function(){
    var x=find(b.dataset.d);if(!confirm("Delete this exam"+(x.pub?" and its scores from the server":"")+"?"))return;
    (x.pub?Api.remove(x.pub.id,x.pub.key).catch(function(){}):Promise.resolve()).then(function(){Store.delExam(x.id);A.views.create()})}})};

function persist(){Store.saveExam(draft)}
function blank(t){return t==="mcq"?{t:"mcq",m:1,q:"",o:["","","",""],a:"",k:[],e:""}:{t:"short",m:2,q:"",o:[],a:"",k:[],e:""}}

function editor(){
  A.setCur("edit");window.scrollTo(0,0);
  view.innerHTML='<button class="link" id="bk">← Your exams</button>'+
  '<div class="card"><label>Exam title<input id="et" value="'+esc(draft.title)+'" placeholder="e.g. Physics unit test 1"></label><div class="row"><label>Subject<input id="es" value="'+esc(draft.subject)+'" placeholder="Physics"></label><label>Time limit<select id="em">'+A.minsOpts(draft.mins)+'</select></label></div>'+
  '<label class="chk"><input type="checkbox" id="esh"'+(draft.showAnswers!==false?" checked":"")+'> Show correct answers to students after they submit</label></div>'+
  '<div class="sec" id="qc"></div><div id="qs"></div>'+
  '<div class="acts"><button id="am">+ Multiple choice</button><button id="aw">+ Written answer</button><button id="ai">+ From photo or text</button></div>'+
  '<div class="card" id="ib" hidden><b>Add questions from a photo or text</b><p class="mute">Use a clear photo of a printed question paper. Or paste text laid out like this:<br>1. Question text [2]<br>A) option B) option C) option D) option (each on its own line)<br>Answer: B</p>'+
  '<div class="acts"><button id="ph">Choose photo(s)</button><button id="cs">Choose CSV or text file</button></div><input type="file" id="pf" accept="image/*" multiple hidden><input type="file" id="cf" accept=".csv,.txt,text/*" hidden>'+
  '<textarea id="pt" data-raw placeholder="Text from the photo appears here. Fix any mistakes, then press Add questions. You can also paste text or CSV."></textarea><div class="acts"><button class="pri" id="pa">Add questions</button><span class="mute" id="pm"></span></div></div>'+
  '<div class="acts"><button class="pri" id="mk" style="flex:1;padding:12px">'+(draft.pub?"Update published exam":"Publish exam")+'</button><button id="pv">Preview</button></div><div class="card" id="lk" hidden></div>';
  drawQs();if(draft.pub)links(draft.pub,true);
  $("bk").onclick=function(){A.go("create")};
  $("et").oninput=function(){draft.title=this.value;persist()};$("es").oninput=function(){draft.subject=this.value;persist()};
  $("em").onchange=function(){draft.mins=+this.value;persist()};$("esh").onchange=function(){draft.showAnswers=this.checked;persist()};
  $("am").onclick=function(){draft.qs.push(blank("mcq"));persist();drawQs(true)};
  $("aw").onclick=function(){draft.qs.push(blank("short"));persist();drawQs(true)};
  $("ai").onclick=function(){$("ib").hidden=!$("ib").hidden};
  $("qs").addEventListener("input",function(e){
    var t=e.target,f=t.dataset.f,qe=t.closest(".q");if(!f||!qe)return;
    var q=draft.qs[+qe.dataset.i],v=t.value;
    if(f==="m")q.m=Math.max(1,+v||1);else if(f==="k")q.k=v.split(/[|;]/).map(function(s){return s.trim()}).filter(Boolean);else if(f[0]==="o")q.o[+f[1]]=v;else q[f]=v;
    persist();stats()});
  $("qs").addEventListener("click",function(e){
    var qe=e.target.closest(".q");if(!qe)return;var i=+qe.dataset.i;
    if(e.target.hasAttribute("data-del")&&confirm("Delete question "+(i+1)+"?")){draft.qs.splice(i,1);persist();drawQs()}
    if(e.target.hasAttribute("data-sym"))Symbols.toggle(qe.querySelector("textarea[data-f=a]"))});
  $("ph").onclick=function(){$("pf").click()};$("cs").onclick=function(){$("cf").click()};
  $("pf").onchange=function(){var f=Array.prototype.slice.call($("pf").files);if(!f.length)return;
    Import.ocr(f,function(m){$("pm").textContent=m}).then(function(t){$("pt").value=t;$("pm").textContent="Check the text, fix any mistakes, then press Add questions."}).catch(function(){$("pm").textContent="Could not read the photo. Connect to the internet once and try again."})};
  $("cf").onchange=function(){var f=$("cf").files[0];if(f){var r=new FileReader();r.onload=function(){$("pt").value=r.result};r.readAsText(f)}};
  $("pa").onclick=function(){
    var t=$("pt").value.trim(),first=t.split("\n")[0];if(!t)return;
    var csv=first.indexOf(",")>-1&&/question/i.test(first),qs=csv?Store.fromCSV(t,draft.subject,true):Import.text(t);
    if(!qs.length)return $("pm").textContent="No questions found. Number each question (1., 2., …) and put options on separate lines.";
    qs.forEach(function(q){q.o=q.o.length?q.o:(q.t==="mcq"?["","","",""]:[])});
    draft.qs=draft.qs.concat(qs);persist();drawQs();$("pt").value="";
    $("pm").textContent="Added "+qs.length+" questions. Check each one, especially the correct answers."};
  $("pv").onclick=function(){var err=check();if(err)return alert(err);
    A.startRun({title:draft.title,subject:draft.subject||"General",mins:draft.mins,qs:draft.qs.map(function(q){return Object.assign({s:draft.subject||"General"},q)}),name:"Preview"})};
  $("mk").onclick=publish}

function stats(){$("qc").textContent="QUESTIONS · "+draft.qs.length+" · "+sum(draft.qs,function(q){return q.m})+" MARKS"}
function drawQs(focus){
  $("qs").innerHTML=draft.qs.map(function(q,i){
    return'<div class="q" data-i="'+i+'"><div class="qh"><b>'+(i+1)+'</b><span><input class="mk" type="number" min="1" data-f="m" value="'+q.m+'"> marks <button class="link" data-del>Delete</button></span></div>'+
    '<textarea data-f="q" placeholder="Question">'+esc(q.q)+"</textarea>"+
    (q.t==="mcq"?[0,1,2,3].map(function(j){return'<label class="optrow"><input type="radio" name="c'+i+'" data-f="a" value="'+L[j]+'"'+(q.a===L[j]?" checked":"")+'><input data-f="o'+j+'" value="'+esc(q.o[j]||"")+'" placeholder="Option '+L[j]+'"></label>'}).join("")+'<p class="mute">Tick the circle next to the correct option.</p>':
    '<textarea data-f="a" placeholder="Model answer">'+esc(q.a)+'</textarea><input data-f="k" value="'+esc(q.k.join(" | "))+'" placeholder="Key points to look for, separated by | (optional)" style="margin-top:8px"><button type="button" class="link" data-sym>Σ Symbols (², √, π, H₂O …)</button>')+
    '<input data-f="e" value="'+esc(q.e||"")+'" placeholder="Explanation shown after the exam (optional)" style="margin-top:8px"></div>'}).join("")+(draft.qs.length?"":'<p class="mute">No questions yet. Add one below.</p>');
  stats();
  if(focus){var t=$("qs").querySelectorAll(".q");t[t.length-1].querySelector("textarea").focus()}}

function check(){
  if(!draft.title.trim())return"Give the exam a title.";
  if(!draft.qs.length)return"Add at least one question.";
  for(var i=0;i<draft.qs.length;i++){var q=draft.qs[i],n=i+1;
    if(!q.q.trim())return"Question "+n+" has no text.";
    if(q.t==="mcq"){if(q.o.filter(function(x){return x&&x.trim()}).length<2)return"Question "+n+" needs at least two options.";
      if(!q.a||!(q.o[L.indexOf(q.a)]||"").trim())return"Choose the correct option for question "+n+"."}
    else if(!q.a.trim()&&!q.k.length)return"Question "+n+" needs a model answer or key points so it can be marked."}
  return""}

function publish(){
  var box=$("lk"),err=check(),b=$("mk");box.hidden=false;
  if(err){box.innerHTML="<p>"+esc(err)+"</p>";return}
  draft.subject=draft.subject.trim()||"General";persist();
  b.disabled=true;b.textContent="Publishing…";
  var req=draft.pub?Api.update(draft.pub.id,draft.pub.key,draft).then(function(){return draft.pub}):Api.publish(draft).then(function(r){draft.pub={id:r.id,key:r.manageKey};persist();return draft.pub});
  req.then(function(p){links(p)}).catch(function(e){box.innerHTML="<p>"+esc(e.message)+"</p>"}).then(function(){b.disabled=false;b.textContent=draft.pub?"Update published exam":"Publish exam"})}

function links(pub,quiet){
  var box=$("lk"),base=location.origin+location.pathname,stu=base+"#e="+pub.id,res=base+"#m="+pub.id+"."+pub.key;
  box.hidden=false;
  box.innerHTML=(quiet?"":"<b>Your exam is published.</b>")+
  '<label>Student link (share this)</label><div class="copyrow"><input readonly id="l1" value="'+esc(stu)+'"><button id="c1">Copy</button></div>'+
  '<label>Your results link (keep this private)</label><div class="copyrow"><input readonly id="l2" value="'+esc(res)+'"><button id="c2">Copy</button></div>'+
  '<div class="acts"><button class="pri" id="or">Open scores</button></div>'+
  '<p class="mute">Every student’s score appears on your results page. Anyone who has the results link can see the scores, so do not share it. Editing a published exam changes it for students who open it afterwards.</p>';
  var cp=function(i,u,b){$(b).onclick=function(){try{navigator.clipboard.writeText(u).then(function(){$(b).textContent="Copied"})}catch(e){$(i).select()}}};
  cp("l1",stu,"c1");cp("l2",res,"c2");$("l1").onclick=$("l2").onclick=function(){this.select()};
  $("or").onclick=function(){A.openOwner(pub.id,pub.key)}}
})();
