/* ============================================================
   CALCULADORA DE RESINA — lógica
   Uso standalone: já é chamado pelo calc.html
   Uso na Tray: cole este conteúdo dentro de <script>...</script>
   no "Editor HTML (Desenvolvedor) > No final do body"
   ============================================================ */
(function(){
  function $(id){ return document.getElementById(id); }
  function v(id){ var e=$(id); return e ? parseFloat(e.value) : NaN; }
  function fmt(n,d){ return n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}); }

  /* MODO 1: uso de resina (volume cm³ -> kg) */
  function calcUso(){
    var out=$('uso-result-value'); if(!out) return;
    var sel=document.querySelector('input[name="calc-shape"]:checked');
    var shape=sel ? sel.id : 'calc-shape-rc';
    var dens=v('uso-density'); if(isNaN(dens)||dens<=0) dens=1.1;
    var P=Math.PI, vol=NaN;
    if(shape==='calc-shape-rc'){ var a=v('rc-l'),b=v('rc-w'),c=v('rc-h'); if(a>0&&b>0&&c>0) vol=a*b*c; }
    else if(shape==='calc-shape-cc'){ var d=v('cc-d'),h=v('cc-h'); if(d>0&&h>0) vol=P*(d/2)*(d/2)*h; }
    else if(shape==='calc-shape-rcoat'){ var l=v('rcoat-l'),w=v('rcoat-w'),t=v('rcoat-t'); if(l>0&&w>0&&t>0) vol=l*w*(t/10); }
    else if(shape==='calc-shape-ccoat'){ var d2=v('ccoat-d'),t2=v('ccoat-t'); if(d2>0&&t2>0) vol=P*(d2/2)*(d2/2)*(t2/10); }
    else if(shape==='calc-shape-sph'){ var d3=v('sph-d'); if(d3>0) vol=(4/3)*P*Math.pow(d3/2,3); }
    else if(shape==='calc-shape-hsph'){ var d4=v('hsph-d'); if(d4>0) vol=(2/3)*P*Math.pow(d4/2,3); }
    if(isNaN(vol)){ out.innerHTML='—'; return; }
    var kg=vol*dens/1000;
    out.innerHTML=fmt(kg,3)+'<span class="calc-unit">kg</span>';
  }

  /* MODO 2: componentes A:B (fecha exato: B = total - A) */
  function calcComp(){
    var box=$('comp-result'); if(!box) return;
    var rA=v('comp-ra'),rB=v('comp-rb'),total=v('comp-total');
    var ue=$('comp-unit'),unit=ue?ue.value:'g';
    if(!(rA>0&&rB>0&&total>0)){ box.innerHTML='<div class="calc-comp-empty">Preencha a proporção e a quantidade.</div>'; return; }
    var sum=rA+rB, amtA=(total*rA)/sum, amtB=total-amtA;
    var pA=rA/sum*100, pB=100-pA, dec=unit==='kg'?3:1;
    box.innerHTML=
      '<div class="calc-comp-result"><div class="calc-comp-bar-head"><span class="calc-name">Componente A</span><span class="calc-amt">'+fmt(amtA,dec)+' '+unit+' ('+pA.toFixed(1)+'%)</span></div><div class="calc-bar-track"><div class="calc-bar-fill calc-bar-a" style="width:'+pA+'%"></div></div></div>'+
      '<div class="calc-comp-result"><div class="calc-comp-bar-head"><span class="calc-name">Componente B</span><span class="calc-amt">'+fmt(amtB,dec)+' '+unit+' ('+pB.toFixed(1)+'%)</span></div><div class="calc-bar-track"><div class="calc-bar-fill calc-bar-b" style="width:'+pB+'%"></div></div></div>'+
      '<div class="calc-result-item" style="margin-top:10px"><span class="calc-result-label">Total A + B</span><span class="calc-result-value">'+fmt(total,dec)+'<span class="calc-unit">'+unit+'</span></span></div>'+
      '<div class="calc-result-item"><span class="calc-result-label">Proporção utilizada</span><span class="calc-result-value">'+rA+'<span class="calc-unit">:</span>'+rB+'</span></div>';
  }

  function setRatio(a,b){ var A=$('comp-ra'),B=$('comp-rb'); if(A)A.value=a; if(B)B.value=b; calcComp(); }

  function wire(){
    var i;
    var usoIn=document.querySelectorAll('.uso-in');
    for(i=0;i<usoIn.length;i++) usoIn[i].addEventListener('input',calcUso);
    var shapes=document.querySelectorAll('input[name="calc-shape"]');
    for(i=0;i<shapes.length;i++) shapes[i].addEventListener('change',calcUso);
    var compIn=document.querySelectorAll('.comp-in');
    for(i=0;i<compIn.length;i++){ compIn[i].addEventListener('input',calcComp); compIn[i].addEventListener('change',calcComp); }
    var pb=document.querySelectorAll('.preset-btn');
    for(i=0;i<pb.length;i++){ (function(btn){ btn.addEventListener('click',function(){ setRatio(parseFloat(btn.getAttribute('data-ra')),parseFloat(btn.getAttribute('data-rb'))); }); })(pb[i]); }
    calcUso(); calcComp();
  }

  /* espera o conteúdo existir (na Tray o conteúdo pode carregar via AJAX) */
  var tries=0;
  function boot(){
    if(document.querySelector('.calc-container')){ wire(); return; }
    if(tries++ < 40){ setTimeout(boot, 250); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
