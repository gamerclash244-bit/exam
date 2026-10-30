// Import: turns pasted text or photos of a question paper into questions.
window.Import=(function(){
  var I={};
  // Reads this layout (marks in brackets are optional):
  //   1. Question text [2]
  //   A) option  B) option  C) option  D) option
  //   Answer: B        (for written questions, Answer: the model answer)
  I.text=function(t){
    var lines=t.replace(/\r/g,"").split("\n").map(function(s){return s.trim()}).filter(Boolean),out=[],cur=null,lo=-1;
    function done(){
      if(!cur)return;var q=cur;cur=null;
      var mk=q.q.match(/[\[(]\s*(\d+)\s*(?:marks?|m)?\s*[\])]\s*$/i);if(mk){q.m=+mk[1];q.q=q.q.replace(mk[0],"").trim()}
      var o=Array.from(q.o,function(x){return x||""}),n=o.filter(Boolean).length,a=q.ans.trim();
      if(n>=2){
        var mm=a.match(/^\(?([a-d])\b/i),ix=mm?"abcd".indexOf(mm[1].toLowerCase()):o.findIndex(function(x){return x&&x.toLowerCase()===a.toLowerCase()});
        while(o.length<4)o.push("");
        out.push({t:"mcq",m:q.m||1,q:q.q,o:o.slice(0,4),a:ix>-1?"ABCD"[ix]:"",k:[],e:""})}
      else out.push({t:"short",m:q.m||2,q:q.q,o:[],a:a,k:[],e:""})}
    lines.forEach(function(l){var m;
      if(m=l.match(/^(?:q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\]:-]\s*(\S.*)/i)){done();cur={q:m[2],o:[],ans:"",m:0};lo=-1}
      else if(cur&&(m=l.match(/^\(?([a-dA-D])\s*[.)\]:]\s*(\S.*)/))){lo="abcd".indexOf(m[1].toLowerCase());cur.o[lo]=m[2]}
      else if(cur&&(m=l.match(/^(?:ans(?:wer)?|correct(?: answer)?)\s*[:=.-]?\s*(\S.*)/i))){cur.ans=m[1];lo=-2}
      else if(cur){if(lo===-2)cur.ans+=" "+l;else if(lo>-1)cur.o[lo]+=" "+l;else cur.q+=" "+l}});
    done();return out};
  // Reads text from one or more photos in the browser (Tesseract.js, loaded the first time you use it).
  I.ocr=function(files,say){
    return new Promise(function(res,rej){
      function run(){var i=0,txt=[];(function next(){
        if(i>=files.length)return res(txt.join("\n"));
        say("Reading photo "+(i+1)+" of "+files.length+"…");
        Tesseract.recognize(files[i],"eng").then(function(r){txt.push(r.data.text);i++;next()}).catch(rej)})()}
      if(window.Tesseract)return run();
      var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      s.onload=run;s.onerror=function(){rej(new Error("load"))};document.head.appendChild(s)})};
  return I})();
