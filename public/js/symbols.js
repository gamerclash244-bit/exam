// Symbols: a keypad for characters that are not on the keyboard, plus typing shortcuts (x^2 becomes x²).
window.Symbols=(function(){
  var SETS={
    "Math":"² ³ ⁿ ⁻¹ √ ∛ ∑ ∏ ∫ ∞ ± × ÷ ≠ ≈ ≤ ≥ ° ′ ″ ∠ ⊥ ∥ ∴ ∵ ∈ ∉ ⊂ ⊆ ∪ ∩ ∅ ℕ ℤ ℚ ℝ ℂ ½ ⅓ ¼ ¾ π ∂ ∇ sin² cos² tan² sin⁻¹ cos⁻¹ tan⁻¹ log₁₀ logₑ lim x² x³ xⁿ √x",
    "Greek":"α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω",
    "Powers":"⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ⁼ ⁽ ⁾ ⁿ ⁱ ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ₊ ₋ ₌ ₍ ₎ ₐ ₑ ₙ ₓ ₒ",
    "Physics":"Δ μ λ ω Ω θ ρ ε₀ μ₀ ℏ Å ° ∝ → m/s m/s² kg·m/s N·m J/mol s⁻¹ ×10⁻ ×10⁵ ΔT ΔV ΔE",
    "Chemistry":"→ ⇌ ⇄ ↑ ↓ Δ ° H₂O CO₂ O₂ H₂ N₂ NH₃ CH₄ HCl H₂SO₄ HNO₃ NaOH NaCl CaCO₃ ⁺ ⁻ ²⁺ ³⁺ ²⁻ ³⁻ ΔH ΔG ΔS (aq) (s) (l) (g)",
    "Arrows":"← → ↑ ↓ ↔ ⇒ ⇔ ⟹ ∀ ∃ ¬ ∧ ∨ ✓ ✗ • · … — –",
    "Other":"₹ € £ $ ¢ ‰ © ® ™ § ¶ « » ‘ ’ “ ”"};
  var SUP={"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻","+":"⁺","n":"ⁿ"};
  function conv(s){return s.replace(/\^([-+]?\d+|n)/g,function(m,d){return d.split("").map(function(c){return SUP[c]}).join("")}).replace(/<=/g,"≤").replace(/>=/g,"≥").replace(/!=/g,"≠").replace(/->/g,"→").replace(/\+-/g,"±")}
  var last=null,tab="Math",box;
  function isText(t){return t&&(t.tagName==="TEXTAREA"||(t.tagName==="INPUT"&&(!t.type||t.type==="text")))}
  document.addEventListener("focusin",function(e){if(isText(e.target)&&!e.target.hasAttribute("data-raw"))last=e.target});
  document.addEventListener("input",function(e){var t=e.target;if(!isText(t)||t.hasAttribute("data-raw"))return;
    var p=t.selectionStart,b=t.value.slice(0,p),nb=conv(b);if(nb!==b){t.value=nb+t.value.slice(p);t.selectionStart=t.selectionEnd=nb.length}},true);
  function put(x){if(!last)return;var f=last;f.focus();var s=f.selectionStart,e=f.selectionEnd;f.value=f.value.slice(0,s)+x+f.value.slice(e);f.selectionStart=f.selectionEnd=s+x.length;f.dispatchEvent(new Event("input",{bubbles:true}))}
  function draw(){
    box.innerHTML='<div class="symtabs">'+Object.keys(SETS).map(function(k){return'<button type="button" class="'+(k===tab?"on":"")+'" data-t="'+k+'">'+k+"</button>"}).join("")+'<button type="button" data-x="1" class="sx">Close</button></div><div class="symgrid">'+
      SETS[tab].split(" ").map(function(x){return'<button type="button" data-s="'+x+'">'+x+"</button>"}).join("")+"</div>";
    box.onclick=function(e){var b=e.target;if(b.dataset.t){tab=b.dataset.t;draw()}else if(b.dataset.s)put(b.dataset.s);else if(b.dataset.x)box.hidden=true}}
  return{
    init:function(el){box=el;draw()},
    show:function(field){if(field)last=field;box.hidden=false;if(last)last.focus()},
    toggle:function(field){if(box.hidden)this.show(field);else box.hidden=true}
  }})();
