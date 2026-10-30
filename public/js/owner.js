// Owner: the exam maker's private scoreboard (opened from the results link).
(function(){
var A=App,$=function(i){return document.getElementById(i)},view=A.view,esc=A.esc;

A.openOwner=function(id,key){A.setCur("owner");A.views.owner(id,key)};

A.views.owner=function(id,key){
  view.innerHTML='<p class="mute">Loading scores…</p>';
  Api.results(id,key).then(function(d){render(id,key,d)}).catch(function(e){
    view.innerHTML='<div class="card"><h2>Scores not available</h2><p class="mute">'+esc(e.message)+'</p><button class="pri" id="hm">Go to Practice</button></div>';
    $("hm").onclick=function(){history.replaceState(null,"",location.pathname);A.go("home")}})};

function render(id,key,d){
  var ex=d.exam,rs=d.results,total=A.sum(ex.qs,function(q){return q.m}),pcs=rs.map(function(r){return r.total?r.got/r.total*100:0});
  var avg=rs.length?Math.round(pcs.reduce(function(a,b){return a+b},0)/rs.length):0;
  var stu=location.origin+location.pathname+"#e="+id;
  view.innerHTML='<div class="row2"><div><h2>'+esc(ex.title)+'</h2><div class="mute">'+esc(ex.subject)+" · "+ex.qs.length+" questions · "+total+' marks</div></div><button id="rf">Refresh</button></div>'+
  '<div class="stats"><div class="card"><b>'+rs.length+'</b><span class="mute">submitted</span></div><div class="card"><b>'+(rs.length?avg+"%":"–")+'</b><span class="mute">average</span></div><div class="card"><b>'+(rs.length?Math.round(Math.max.apply(null,pcs))+"%":"–")+'</b><span class="mute">highest</span></div><div class="card"><b>'+(rs.length?Math.round(Math.min.apply(null,pcs))+"%":"–")+'</b><span class="mute">lowest</span></div></div>'+
  '<label>Student link</label><div class="copyrow"><input readonly id="sl" value="'+esc(stu)+'"><button id="sc">Copy</button></div>'+
  '<div class="acts"><button id="dl"'+(rs.length?"":" disabled")+'>Download CSV</button><button id="dx">Delete exam and scores</button></div>'+
  '<div class="sec">STUDENTS</div>'+
  (rs.length?rs.map(function(r){var pc=r.total?Math.round(r.got/r.total*100):0;
    return"<details><summary><span><b>"+esc(r.name)+'</b> <span class="mute">'+new Date(r.date).toLocaleString()+"</span></span><span><b>"+r.got+"/"+r.total+'</b> <span class="mute">'+pc+"%</span></span></summary>"+
      ex.qs.map(function(q,i){return'<div class="ans"><b>'+(i+1)+". "+esc(q.q)+"</b> ("+r.marks[i]+"/"+q.m+")<br>"+(r.answers[i]?esc(q.t==="mcq"?r.answers[i]+". "+(q.o["ABCD".indexOf(r.answers[i])]||""):r.answers[i]):"<i>not answered</i>")+"</div>"}).join("")+"</details>"}).join(""):
    '<p class="mute">No one has submitted yet. Send the student link to your class.</p>');
  $("rf").onclick=function(){A.views.owner(id,key)};
  $("sc").onclick=function(){try{navigator.clipboard.writeText(stu).then(function(){$("sc").textContent="Copied"})}catch(e){$("sl").select()}};
  $("sl").onclick=function(){this.select()};
  $("dl").onclick=function(){
    var head=["Name","Score","Total","Percent","Submitted"].concat(ex.qs.map(function(q,i){return"Q"+(i+1)+" marks"}));
    Store.download((ex.title||"exam").replace(/[^\w]+/g,"-")+"-scores.csv",Store.csv([head].concat(rs.map(function(r){return[r.name,r.got,r.total,r.total?Math.round(r.got/r.total*100):0,new Date(r.date).toLocaleString()].concat(r.marks)}))))};
  $("dx").onclick=function(){
    if(!confirm("Delete this exam and all its scores? This cannot be undone."))return;
    Api.remove(id,key).then(function(){
      Store.exams().forEach(function(x){if(x.pub&&x.pub.id===id){delete x.pub;Store.saveExam(x)}});
      history.replaceState(null,"",location.pathname);A.go("create")}).catch(function(e){alert(e.message)})}}
})();
