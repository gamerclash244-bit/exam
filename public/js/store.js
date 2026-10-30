// Store: practice question bank, CSV reading, Google Sheet sync, saved exams and results.
window.Store=(function(){
  var S={};
  S.load=function(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
  S.save=function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  S.key=function(q){return(q.s+"|"+q.q).toLowerCase().replace(/\s+/g," ").trim()};
  function fromRow(r){
    return r[2]==="mcq"?{s:r[0],c:r[1],t:"mcq",m:r[3],q:r[4],o:r[5],a:r[6],e:r[7]||"",k:[]}
                       :{s:r[0],c:r[1],t:"short",m:r[3],q:r[4],o:[],a:r[5],e:r[6]||"",k:r[7]||[]}}
  S.base=(window.QUESTIONS||[]).map(fromRow);
  S.sheet=S.load("pe_sheet",[]);
  S.all=function(){var seen={},out=[];S.base.concat(S.sheet).forEach(function(q){var k=S.key(q);if(!seen[k]){seen[k]=1;out.push(q)}});return out};
  S.subjects=function(){var s=CONFIG.subjects.slice();S.all().forEach(function(q){if(s.indexOf(q.s)<0)s.push(q.s)});return s};

  S.parseCSV=function(t){
    var rows=[],r=[],f="",q=false,i,c;
    for(i=0;i<t.length;i++){c=t[i];
      if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
      else if(c==='"')q=true;
      else if(c===","){r.push(f);f=""}
      else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;r.push(f);f="";rows.push(r);r=[]}
      else f+=c}
    if(f||r.length){r.push(f);rows.push(r)}
    return rows.filter(function(r){return r.some(function(x){return x.trim()})})};

  var AL={subject:["subject"],chapter:["chapter","topic","unit"],type:["type","questiontype"],marks:["marks","mark"],question:["question"],
    a:["a","optiona","option1"],b:["b","optionb","option2"],c:["c","optionc","option3"],d:["d","optiond","option4"],
    answer:["answer","correctanswer","correct","correctoption"],keys:["keypoints","keywords","keys"],exp:["explanation","explain"],approved:["approved"]};
  // Works with any sheet whose headers contain Question and Answer (Subject, Marks, options are optional).
  S.fromCSV=function(text,defSubject,keepBlank){
    var rows=S.parseCSV(text);if(rows.length<2)return[];
    var h=rows[0].map(function(x){return x.toLowerCase().replace(/[^a-z0-9]/g,"")}),col={};
    Object.keys(AL).forEach(function(n){AL[n].forEach(function(a){if(col[n]==null&&h.indexOf(a)>-1)col[n]=h.indexOf(a)})});
    var g=function(r,n){return col[n]==null?"":(r[col[n]]||"").trim()},out=[];
    rows.slice(1).forEach(function(r){
      if(col.approved!=null&&!/^(y|yes|1|true|ok)/i.test(g(r,"approved")))return;
      var q=g(r,"question");if(!q)return;
      var ty=g(r,"type").toLowerCase(),o=[g(r,"a"),g(r,"b"),g(r,"c"),g(r,"d")];
      var t=/short|written|descr|essay/.test(ty)?"short":(/mcq|choice|obj/.test(ty)||o[0])?"mcq":"short";
      var ans=g(r,"answer");
      if(t==="mcq"){
        if(!/^[a-d]$/i.test(ans)){var ix=o.findIndex(function(x){return x&&x.toLowerCase()===ans.toLowerCase()});ans=ix>-1?"ABCD"[ix]:""}
        ans=ans.toUpperCase();if(!ans&&!keepBlank)return}
      out.push({s:g(r,"subject")||defSubject||"Community",c:g(r,"chapter")||"General",t:t,m:+g(r,"marks")||(t==="mcq"?1:2),q:q,o:t==="mcq"?o:[],a:ans,e:g(r,"exp"),
        k:g(r,"keys").split(/[|;]/).map(function(x){return x.trim()}).filter(Boolean)})});
    return out};
  S.sync=function(url){return fetch(url).then(function(r){if(!r.ok)throw new Error("bad");return r.text()}).then(function(t){S.sheet=S.fromCSV(t);S.save("pe_sheet",S.sheet);return S.sheet.length})};

  S.csv=function(rows){var esc=function(v){v=String(v==null?"":v);return/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};return rows.map(function(r){return r.map(esc).join(",")}).join("\n")};
  S.download=function(name,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+text],{type:"text/csv"}));a.download=name;a.click()};
  S.hist=function(){return S.load("pe_hist",[])};
  S.addHist=function(r){var h=S.hist();h.unshift(r);S.save("pe_hist",h.slice(0,200))};
  S.exams=function(){return S.load("pe_exams",[])};
  S.saveExam=function(ex){var l=S.exams(),i=l.findIndex(function(x){return x.id===ex.id});ex.updated=Date.now();if(i>-1)l[i]=ex;else l.unshift(ex);S.save("pe_exams",l)};
  S.delExam=function(id){S.save("pe_exams",S.exams().filter(function(x){return x.id!==id}))};
  return S})();
