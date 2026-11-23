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

  var shapes={
    'calc-shape-rc':['Moldagem retangular',['rc-l','rc-w','rc-h']],
    'calc-shape-cc':['Moldagem circular',['cc-d','cc-h']],
    'calc-shape-rcoat':['Revestimento retangular',['rcoat-l','rcoat-w','rcoat-t']],
    'calc-shape-ccoat':['Revestimento circular',['ccoat-d','ccoat-t']],
    'calc-shape-sph':['Esfera',['sph-d']],
    'calc-shape-hsph':['Meia esfera',['hsph-d']]
  };
  function positive(n){ return typeof n==='number'&&Number.isFinite(n)&&n>0; }
  function mass(shape,values,density){
    if(!shapes[shape]||!Array.isArray(values)||values.length!==shapes[shape][1].length||!values.every(positive)||!positive(density))return null;
    var a=values[0],b=values[1],c=values[2],vol;
    if(shape==='calc-shape-rc')vol=a*b*c;
    else if(shape==='calc-shape-cc')vol=Math.PI*(a/2)*(a/2)*b;
    else if(shape==='calc-shape-rcoat')vol=a*b*(c/10);
    else if(shape==='calc-shape-ccoat')vol=Math.PI*(a/2)*(a/2)*(b/10);
    else if(shape==='calc-shape-sph')vol=(4/3)*Math.PI*Math.pow(a/2,3);
    else vol=(2/3)*Math.PI*Math.pow(a/2,3);
    var kg=vol*density/1000;return positive(kg)?kg:null;
  }
  function components(a,b,total){
    if(![a,b,total].every(positive)||!positive(a+b))return null;
    var amtA=(total*a)/(a+b),amtB=total-amtA,pA=a/(a+b)*100;
    return [amtA,amtB].every(positive)?{a:amtA,b:amtB,pA:pA,pB:100-pA}:null;
  }
  function snapshot(mode){
    if(mode==='uso'){
      var sel=document.querySelector('input[name="calc-shape"]:checked'),shape=sel?sel.id:'calc-shape-rc';
      var density=v('uso-density');if(isNaN(density)||density<=0)density=1.1;
      return {mode:mode,shape:shape,values:shapes[shape][1].map(v),density:density};
    }
    return {mode:'comp',a:v('comp-ra'),b:v('comp-rb'),total:v('comp-total'),unit:$('comp-unit').value};
  }
  function validSnapshot(s){
    return !!s&&((s.mode==='uso'&&mass(s.shape,s.values,s.density)!==null)||
      (s.mode==='comp'&&['g','ml','kg'].indexOf(s.unit)!==-1&&components(s.a,s.b,s.total)!==null));
  }
  function calcUso(){
    var out=$('uso-result-value');if(!out)return;
    var s=snapshot('uso'),kg=mass(s.shape,s.values,s.density);
    out.innerHTML=kg===null?'—':fmt(kg,3)+'<span class="calc-unit">kg</span>';
  }
  function calcComp(){
    var box=$('comp-result');if(!box)return;
    var s=snapshot('comp'),result=components(s.a,s.b,s.total),unit=s.unit,dec=unit==='kg'?3:1;
    if(!result){box.innerHTML='<div class="calc-comp-empty">Preencha a proporção e a quantidade.</div>';return;}
    box.innerHTML=
      '<div class="calc-comp-result"><div class="calc-comp-bar-head"><span class="calc-name">Componente A</span><span class="calc-amt">'+fmt(result.a,dec)+' '+unit+' ('+result.pA.toFixed(1)+'%)</span></div><div class="calc-bar-track"><div class="calc-bar-fill calc-bar-a" style="width:'+result.pA+'%"></div></div></div>'+
      '<div class="calc-comp-result"><div class="calc-comp-bar-head"><span class="calc-name">Componente B</span><span class="calc-amt">'+fmt(result.b,dec)+' '+unit+' ('+result.pB.toFixed(1)+'%)</span></div><div class="calc-bar-track"><div class="calc-bar-fill calc-bar-b" style="width:'+result.pB+'%"></div></div></div>'+
      '<div class="calc-result-item" style="margin-top:10px"><span class="calc-result-label">Total A + B</span><span class="calc-result-value">'+fmt(s.total,dec)+'<span class="calc-unit">'+unit+'</span></span></div>'+
      '<div class="calc-result-item"><span class="calc-result-label">Proporção utilizada</span><span class="calc-result-value">'+s.a+'<span class="calc-unit">:</span>'+s.b+'</span></div>';
  }

  var storageKey='colmeia.resina.simulations.v1',simulations=[],readable=true;
  function feedback(text){if($('sim-feedback'))$('sim-feedback').textContent=text;}
  function measurements(s){
    return s.values.map(function(value,i){return value+' '+((s.shape==='calc-shape-rcoat'&&i===2)||(s.shape==='calc-shape-ccoat'&&i===1)?'mm':'cm');}).join(' × ');
  }
  function summary(s){
    if(s.mode==='uso')return shapes[s.shape][0]+' · '+measurements(s)+' · '+fmt(s.density,2)+' g/ml · '+fmt(mass(s.shape,s.values,s.density),3)+' kg';
    var result=components(s.a,s.b,s.total),dec=s.unit==='kg'?3:1;
    return 'Componentes '+s.a+':'+s.b+' · A: '+fmt(result.a,dec)+' '+s.unit+' · B: '+fmt(result.b,dec)+' '+s.unit;
  }
  function clearComparison(message){
    if($('compare-result'))$('compare-result').replaceChildren();
    if($('compare-feedback'))$('compare-feedback').textContent=message||'';
  }
  function comparisonOptions(){
    if(!$('compare-first')||!$('compare-second'))return;
    ['compare-first','compare-second'].forEach(function(id){
      var select=$(id),current=select.value;
      select.replaceChildren(new Option('Selecione uma simulação',''));
      simulations.forEach(function(item,index){
        var mode=item.snapshot.mode==='uso'?shapes[item.snapshot.shape][0]:'Componentes '+item.snapshot.unit;
        select.add(new Option(item.name+' · '+mode+' ('+(index+1)+')',item.id));
      });
      if(simulations.some(function(item){return item.id===current;}))select.value=current;
    });
    clearComparison();
  }
  function comparisonValues(s){
    if(s.mode==='uso')return [shapes[s.shape][0],measurements(s),String(s.density).replace('.',',')+' g/ml',fmt(mass(s.shape,s.values,s.density),3)+' kg'];
    var result=components(s.a,s.b,s.total),dec=s.unit==='kg'?3:1;
    return [s.a+':'+s.b,fmt(s.total,dec)+' '+s.unit,fmt(result.a,dec)+' '+s.unit,fmt(result.b,dec)+' '+s.unit];
  }
  function compareSaved(){
    clearComparison();
    var first=simulations.find(function(item){return item.id===$('compare-first').value;}),second=simulations.find(function(item){return item.id===$('compare-second').value;});
    if(!first||!second){clearComparison('Escolha duas simulações salvas.');return;}
    if(first.id===second.id){clearComparison('Escolha duas simulações diferentes.');return;}
    if(first.snapshot.mode!==second.snapshot.mode){clearComparison('Compare simulações do mesmo modo: uso ou componentes.');return;}
    if(first.snapshot.mode==='comp'&&first.snapshot.unit!==second.snapshot.unit){clearComparison('Os componentes devem usar a mesma unidade. Nenhuma conversão foi aplicada.');return;}
    var table=document.createElement('table'),caption=document.createElement('caption'),head=document.createElement('thead'),body=document.createElement('tbody'),header=document.createElement('tr');
    caption.textContent='Comparação de simulações salvas';table.appendChild(caption);
    ['Dados',first.name,second.name].forEach(function(text){var th=document.createElement('th');th.scope='col';th.textContent=text;header.appendChild(th);});
    head.appendChild(header);table.appendChild(head);
    var labels=first.snapshot.mode==='uso'?['Formato','Medidas','Densidade','Quantidade']:['Proporção A:B','Total','Componente A','Componente B'];
    var a=comparisonValues(first.snapshot),b=comparisonValues(second.snapshot);
    labels.forEach(function(label,index){var row=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;row.appendChild(th);[a[index],b[index]].forEach(function(text){var cell=document.createElement('td');cell.textContent=text;row.appendChild(cell);});body.appendChild(row);});
    table.appendChild(body);$('compare-result').appendChild(table);
    $('compare-feedback').textContent='Comparação pronta. Os registros e os campos atuais não foram alterados.';
  }
  function renderSaved(){
    var list=$('sim-list');if(!list)return;comparisonOptions();list.replaceChildren();
    if(!simulations.length){var empty=document.createElement('li');empty.textContent='Nenhuma simulação salva.';list.appendChild(empty);return;}
    simulations.forEach(function(item){
      var row=document.createElement('li'),name=document.createElement('strong'),detail=document.createElement('p'),actions=document.createElement('div');
      name.textContent=item.name;detail.textContent=summary(item.snapshot);actions.className='sim-actions';
      [['Restaurar','data-sim-restore',function(){restore(item);}],['Remover','data-sim-remove',function(){
        if(confirm('Remover a simulação "'+item.name+'"?'))persist(simulations.filter(function(other){return other.id!==item.id;}),'Simulação removida.');
      }]].forEach(function(action){var button=document.createElement('button');button.type='button';button.className='preset-btn';button.textContent=action[0];button.setAttribute(action[1],item.id);button.addEventListener('click',action[2]);actions.appendChild(button);});
      row.append(name,detail,actions);list.appendChild(row);
    });
  }
  function loadSaved(){
    try{
      var raw=localStorage.getItem(storageKey),data=raw===null?{version:1,items:[]}:JSON.parse(raw);
      if(!data||data.version!==1||!Array.isArray(data.items)||data.items.length>10)throw Error('Formato inválido');
      var ids=new Set();
      data.items.forEach(function(item){
        if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>60||!validSnapshot(item.snapshot))throw Error('Simulação inválida');
        ids.add(item.id);
      });
      simulations=data.items;readable=true;
    }catch(error){simulations=[];readable=false;feedback('Não foi possível ler as simulações deste navegador. Os dados armazenados não foram alterados.');}
    renderSaved();
  }
  function persist(next,message){
    if(!readable){feedback('Não foi possível acessar as simulações. Os dados armazenados não foram alterados.');return;}
    try{localStorage.setItem(storageKey,JSON.stringify({version:1,items:next}));}
    catch(error){feedback('Não foi possível salvar as simulações neste navegador. Tente novamente.');return;}
    simulations=next;renderSaved();feedback(message);
  }
  function saveCurrent(){
    var s=snapshot($('calc-mode-comp').checked?'comp':'uso');
    if(!validSnapshot(s)){feedback('Preencha valores válidos antes de salvar a simulação.');return;}
    if(simulations.length>=10){feedback('Limite de 10 simulações atingido. Remova uma para salvar outra.');return;}
    var name=$('sim-name').value.trim().slice(0,60)||(s.mode==='uso'?shapes[s.shape][0]:'Componentes A:B');
    var item={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),name:name,snapshot:s};
    persist([item].concat(simulations),'Simulação salva neste navegador.');
  }
  function restore(item){
    var s=item.snapshot;
    $(s.mode==='uso'?'calc-mode-uso':'calc-mode-comp').checked=true;
    if(s.mode==='uso'){$(s.shape).checked=true;shapes[s.shape][1].forEach(function(id,i){$(id).value=s.values[i];});$('uso-density').value=s.density;}
    else{$('comp-ra').value=s.a;$('comp-rb').value=s.b;$('comp-total').value=s.total;$('comp-unit').value=s.unit;}
    $('sim-name').value=item.name;calcUso();calcComp();feedback('Simulação restaurada. Os outros campos foram preservados.');
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
    var pb=document.querySelectorAll('.preset-btn[data-ra][data-rb]');
    for(i=0;i<pb.length;i++){ (function(btn){ btn.addEventListener('click',function(){ setRatio(parseFloat(btn.getAttribute('data-ra')),parseFloat(btn.getAttribute('data-rb'))); }); })(pb[i]); }
    calcUso(); calcComp();
    if($('save-sim')){$('save-sim').addEventListener('click',saveCurrent);loadSaved();}
    if($('compare-sim')){$('compare-sim').addEventListener('click',compareSaved);['compare-first','compare-second'].forEach(function(id){$(id).addEventListener('change',function(){clearComparison('Seleção alterada. Compare novamente.');});});}
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
