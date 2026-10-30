// Api: talks to the server. Every call returns a promise.
window.Api=(function(){
  function call(method,url,body,key){
    var h={"Content-Type":"application/json"};if(key)h["x-manage-key"]=key;
    return fetch(url,{method:method,headers:h,body:body?JSON.stringify(body):undefined}).then(
      function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw new Error(j.error||"Request failed.");return j})},
      function(){throw new Error(location.protocol==="file:"?"Open the app from its web address, not from the file on your computer.":"Could not reach the server. Check your internet connection.")})}
  return{
    publish:function(ex){return call("POST","/api/exams",ex)},
    update:function(id,key,ex){return call("PUT","/api/exams/"+id,ex,key)},
    get:function(id){return call("GET","/api/exams/"+id)},
    submit:function(id,name,answers){return call("POST","/api/exams/"+id+"/submit",{name:name,answers:answers})},
    results:function(id,key){return call("GET","/api/exams/"+id+"/results",null,key)},
    remove:function(id,key){return call("DELETE","/api/exams/"+id,null,key)},
    suggest:function(q,a){return call("POST","/api/suggest",{question:q,answer:a})}
  }})();
