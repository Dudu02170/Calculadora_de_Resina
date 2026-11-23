import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { scenario, assert, By, until } from './support.js';
const inputs = async (p, values) => { for (const [id,value] of Object.entries(values)) await p.fill('#'+id,value); };
const result = p => p.text('#uso-result-value');
const shapes = [
  ['rc', {'rc-l':10,'rc-w':10,'rc-h':1}, '0,110'],
  ['cc', {'cc-d':10,'cc-h':1}, '0,086'],
  ['rcoat', {'rcoat-l':10,'rcoat-w':10,'rcoat-t':1}, '0,011'],
  ['ccoat', {'ccoat-d':10,'ccoat-t':1}, '0,009'],
  ['sph', {'sph-d':10}, '0,576'],
  ['hsph', {'hsph-d':10}, '0,288']
];
for (const [shape, values, expected] of shapes) {
  scenario('volume em kg: ' + shape, async p => {
    await p.open('/calc.html');
    await p.click('label[for="calc-shape-'+shape+'"]');
    await inputs(p,values);
    await p.waitText('#uso-result-value',expected);
    assert.match(await result(p), /kg/);
  });
}
scenario('dimensao ausente ou zero nao produz massa', async p => {
  await p.open('/calc.html');
  await inputs(p,{'rc-l':10,'rc-w':10});
  assert.equal(await result(p),'—');
  await p.fill('#rc-h','0');
  assert.equal(await result(p),'—');
});
scenario('dimensao negativa nao produz massa', async p => {
  await p.open('/calc.html');
  await inputs(p,{'rc-l':-10,'rc-w':10,'rc-h':1});
  assert.equal(await result(p),'—');
});
scenario('densidade altera a massa calculada', async p => {
  await p.open('/calc.html');
  await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1,'uso-density':1.2});
  await p.waitText('#uso-result-value','0,120');
});
scenario('componentes 2 para 1 totalizam 300g', async p => {
  await p.open('/calc.html');
  await p.click('label[for="calc-mode-comp"]');
  await p.fill('#comp-total',300);
  const amounts=await p.driver.findElements(By.css('#comp-result .calc-amt'));
  assert.equal(amounts.length,2);
  assert.match(await amounts[0].getText(),/^200,0 g/);
  assert.match(await amounts[1].getText(),/^100,0 g/);
  await p.waitText('#comp-result','300,0');
});
scenario('preset 3 para 1 divide 400g em 300 e 100', async p => {
  await p.open('/calc.html');
  await p.click('label[for="calc-mode-comp"]');
  await p.fill('#comp-total',400);
  await p.click('.preset-btn[data-ra="3"]');
  const amounts=await p.driver.findElements(By.css('#comp-result .calc-amt'));
  assert.match(await amounts[0].getText(),/^300,0 g/);
  assert.match(await amounts[1].getText(),/^100,0 g/);
});
scenario('componentes em kg respeitam tres decimais', async p => {
  await p.open('/calc.html');
  await p.click('label[for="calc-mode-comp"]');
  await p.fill('#comp-total',3);
  await p.select('#comp-unit','kg');
  await p.waitText('#comp-result','2,000 kg');
  await p.waitText('#comp-result','1,000 kg');
});
scenario('proporcao zero exige preenchimento valido', async p => {
  await p.open('/calc.html');
  await p.click('label[for="calc-mode-comp"]');
  await inputs(p,{'comp-total':300,'comp-ra':0});
  await p.waitText('#comp-result','Preencha a proporção');
});

const otherPresets = [
  // Independent, exact batch weights from the label ratios.
  [100, 50, 300, '200,0 g (66.7%)', '100,0 g (33.3%)'],
  [100, 45, 145, '100,0 g (69.0%)', '45,0 g (31.0%)'],
  [100, 44, 144, '100,0 g (69.4%)', '44,0 g (30.6%)'],
  [100, 42, 142, '100,0 g (70.4%)', '42,0 g (29.6%)']
];
for (const [a, b, total, expectedA, expectedB] of otherPresets) {
  scenario('preset ' + a + ':' + b + ' atualiza campos, massas e percentuais', async p => {
    await p.open('/calc.html');
    await p.click('label[for="calc-mode-comp"]');
    await inputs(p, {'comp-total': total, 'comp-ra': 7, 'comp-rb': 3});
    await p.click('.preset-btn[data-ra="' + a + '"][data-rb="' + b + '"]');
    assert.equal(await (await p.element('#comp-ra')).getAttribute('value'), String(a));
    assert.equal(await (await p.element('#comp-rb')).getAttribute('value'), String(b));
    const amounts = await p.driver.findElements(By.css('#comp-result .calc-amt'));
    assert.equal(amounts.length, 2);
    assert.equal(await amounts[0].getText(), expectedA);
    assert.equal(await amounts[1].getText(), expectedB);
    await p.waitText('#comp-result', total.toFixed(1).replace('.', ','));
  });
}
for (const field of ['comp-total', 'comp-rb']) {
  scenario(field + ' invalido remove resultados anteriores e permite recalcular', async p => {
    await p.open('/calc.html');
    await p.click('label[for="calc-mode-comp"]');
    await p.fill('#comp-total', 300);
    await p.waitText('#comp-result', '200,0 g');
    for (const invalid of [0, -1, '']) {
      await p.fill('#' + field, invalid);
      await p.waitText('#comp-result', 'Preencha a proporção e a quantidade.');
      assert.equal((await p.driver.findElements(By.css('#comp-result .calc-amt'))).length, 0,
        field + '=' + JSON.stringify(invalid) + ' deve remover massas obsoletas');
      await p.fill('#' + field, field === 'comp-total' ? 300 : 1);
      await p.waitText('#comp-result', '200,0 g');
      const amounts = await p.driver.findElements(By.css('#comp-result .calc-amt'));
      assert.equal(amounts.length, 2);
      assert.equal(await amounts[0].getText(), '200,0 g (66.7%)');
      assert.equal(await amounts[1].getText(), '100,0 g (33.3%)');
    }
  });
}

scenario('trocar formatos limpa resultado incompleto e preserva medidas ao voltar',async p=>{
 await p.open('/calc.html');
 let previous=null;
 for(const [shape,values,expected] of shapes){
  await p.click('label[for="calc-shape-'+shape+'"]');
  assert.equal(await (await p.element('#fields-'+shape)).isDisplayed(),true);
  if(previous){
   assert.equal(await (await p.driver.findElement(By.css('#fields-'+previous))).isDisplayed(),false,
    'campos do formato anterior devem ficar ocultos');
  }
  assert.equal(await result(p),'—','formato sem medidas não deve mostrar a massa anterior');
  await inputs(p,values);await p.waitText('#uso-result-value',expected);
  previous=shape;
 }
 await p.click('label[for="calc-shape-rc"]');
 await p.waitText('#uso-result-value','0,110');
 for(const [id,value] of Object.entries(shapes[0][1])){
  assert.equal(await (await p.element('#'+id)).getAttribute('value'),String(value));
 }
});
scenario('alternar modos preserva medidas e proporcao sem cruzar resultados',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});
 await p.waitText('#uso-result-value','0,110');
 await p.click('label[for="calc-mode-comp"]');await p.fill('#comp-total',300);
 await p.click('.preset-btn[data-ra="3"][data-rb="1"]');
 const componentAmounts=async()=>Promise.all((await p.driver.findElements(By.css('#comp-result .calc-amt'))).map(e=>e.getText()));
 assert.deepEqual(await componentAmounts(),['225,0 g (75.0%)','75,0 g (25.0%)']);
 await p.click('label[for="calc-mode-uso"]');await p.waitText('#uso-result-value','0,110');
 await p.fill('#rc-h',2);await p.waitText('#uso-result-value','0,220');
 await p.click('label[for="calc-mode-comp"]');
 assert.equal(await (await p.element('#comp-total')).getAttribute('value'),'300');
 assert.equal(await (await p.element('#comp-ra')).getAttribute('value'),'3');
 assert.equal(await (await p.element('#comp-rb')).getAttribute('value'),'1');
 assert.deepEqual(await componentAmounts(),['225,0 g (75.0%)','75,0 g (25.0%)'],
  'alterar medidas do molde não deve mudar a divisão dos componentes');
 await p.click('label[for="calc-mode-uso"]');await p.waitText('#uso-result-value','0,220');
 assert.equal(await (await p.element('#rc-h')).getAttribute('value'),'2');
});

const equivalentDepths=[
 // Rectangle: 100 cm³. Circle: 50*pi cm³. Expected masses rounded to 0.001 kg.
 ['retangular','rc',{'rc-l':20,'rc-w':10,'rc-h':0.5},'rcoat',{'rcoat-l':20,'rcoat-w':10,'rcoat-t':5},
  [[1,'0,100'],[1.1,'0,110'],[1.2,'0,120']]],
 ['circular','cc',{'cc-d':20,'cc-h':0.5},'ccoat',{'ccoat-d':20,'ccoat-t':5},
  [[1,'0,157'],[1.1,'0,173'],[1.2,'0,188']]]
];
for(const [name,mold,moldValues,coat,coatValues,densities] of equivalentDepths){
 scenario('0,5 cm e 5 mm produzem a mesma massa no formato '+name,async p=>{
  await p.open('/calc.html');
  for(const [density,expected] of densities){
   await p.click('label[for="calc-shape-'+mold+'"]');
   await inputs(p,{...moldValues,'uso-density':density});
   assert.match(await p.text('#fields-'+mold),/\(cm\)/i,'moldagem deve identificar medidas em cm');
   await p.waitText('#uso-result-value',expected);
   const molded=await result(p);assert.match(molded,/kg/);
   await p.click('label[for="calc-shape-'+coat+'"]');await inputs(p,coatValues);
   assert.match(await p.text('#fields-'+coat),/\(mm\)/i,'revestimento deve identificar espessura em mm');
   await p.waitText('#uso-result-value',expected);
   assert.equal(await result(p),molded,'conversão cm/mm divergente com densidade '+density);
  }
 });
}

const storageKey='colmeia.resina.simulations.v1';
async function clickSave(p){await p.click('#save-sim');await p.driver.wait(()=>p.driver.executeScript('return !document.getElementById("save-sim").disabled'),10000);}
const savedItems=p=>p.driver.executeScript('return JSON.parse(localStorage.getItem(arguments[0])||"null")',storageKey);
for(const [shape,values,expected] of shapes){
 scenario('salva e restaura simulacao do formato '+shape,async p=>{
  await p.open('/calc.html');await p.click('label[for="calc-shape-'+shape+'"]');await inputs(p,values);
  if(shape==='rc')await p.fill('#uso-density',1.2);
  const name=shape==='rc'?'<span id="qa-sim-name">Projeto & QA</span>':'Projeto '+shape+' QA';
  await p.fill('#sim-name',name);await clickSave(p);await p.waitText('#sim-feedback','Simulação salva');
  assert.equal(await p.text('#sim-list strong'),name);
  assert.equal(await p.driver.executeScript('return document.getElementById("qa-sim-name")'),null);
  const stored=await savedItems(p);assert.equal(stored.version,1);assert.equal(stored.items.length,1);
  assert.equal(stored.items[0].snapshot.shape,'calc-shape-'+shape);
  await p.driver.navigate().refresh();await p.click('[data-sim-restore]');
  assert.equal(await (await p.element('#sim-name')).getAttribute('value'),name);
  for(const [id,value] of Object.entries(values))assert.equal(await (await p.element('#'+id)).getAttribute('value'),String(value));
  await p.waitText('#uso-result-value',shape==='rc'?'0,120':expected);
  assert.equal(await (await p.element('#uso-density')).getAttribute('value'),shape==='rc'?'1.2':'1.1');
  assert.equal(await p.driver.executeScript('return document.getElementById(arguments[0]).checked','calc-shape-'+shape),true);
 });
}
for(const unit of ['g','ml','kg']){
 scenario('restaura componentes na unidade '+unit+' sem alterar molde',async p=>{
  await p.open('/calc.html');await inputs(p,{'rc-l':12,'rc-w':10,'rc-h':1});
  await p.click('label[for="calc-mode-comp"]');await p.click('.preset-btn[data-ra="3"]');
  await p.fill('#comp-total',unit==='kg'?4:400);await p.select('#comp-unit',unit);
  await p.fill('#sim-name','Mistura QA');await clickSave(p);await p.waitText('#sim-feedback','Simulação salva');
  assert.equal(await (await p.element('#comp-ra')).getAttribute('value'),'3');assert.equal(await (await p.element('#comp-rb')).getAttribute('value'),'1');
  assert.equal((await savedItems(p)).items.length,1);
  await p.driver.navigate().refresh();await inputs(p,{'rc-l':12,'rc-w':10,'rc-h':1});await p.click('label[for="calc-mode-comp"]');
  await p.fill('#comp-total',999);await p.select('#comp-unit',unit==='g'?'kg':'g');await p.click('.preset-btn[data-ra="100"][data-rb="45"]');
  await p.click('label[for="calc-mode-uso"]');await p.click('[data-sim-restore]');
  assert.equal(await p.driver.executeScript('return document.getElementById("calc-mode-comp").checked'),true);
  assert.equal(await (await p.element('#comp-ra')).getAttribute('value'),'3');assert.equal(await (await p.element('#comp-rb')).getAttribute('value'),'1');
  assert.equal(await (await p.element('#comp-unit')).getAttribute('value'),unit);
  const amounts=await p.driver.findElements(By.css('#comp-result .calc-amt'));
  assert.match(await amounts[0].getText(),unit==='kg'?/^3,000 kg/:new RegExp('^300,0 '+unit));
  assert.match(await amounts[1].getText(),unit==='kg'?/^1,000 kg/:new RegExp('^100,0 '+unit));
  await p.click('label[for="calc-mode-uso"]');assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'12');
 });
}
scenario('recusa salvar resultado invalido ou obsoleto e recupera apos correcao',async p=>{
 await p.open('/calc.html');await clickSave(p);await p.waitText('#sim-feedback','Preencha valores válidos');assert.equal(await savedItems(p),null);
 await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await p.fill('#rc-h',0);await clickSave(p);assert.equal(await savedItems(p),null);
 await p.fill('#rc-h',1);await clickSave(p);assert.equal((await savedItems(p)).items.length,1);
 await p.click('label[for="calc-mode-comp"]');await clickSave(p);await p.waitText('#sim-feedback','Preencha valores válidos');
 assert.equal((await savedItems(p)).items.length,1);assert.equal((await savedItems(p)).items[0].name,'Moldagem retangular');
});
scenario('remocao confirmada preserva outra simulacao e campos atuais',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await p.fill('#sim-name','Primeira QA');await clickSave(p);
 await p.fill('#rc-l',20);await p.fill('#sim-name','Segunda QA');await clickSave(p);
 const before=await savedItems(p);await p.click('[data-sim-remove]');await (await p.driver.wait(until.alertIsPresent(),10000)).dismiss();assert.deepEqual(await savedItems(p),before);
 await p.click('[data-sim-remove]');await p.alert(/Remover a simulação/);await p.driver.wait(()=>p.driver.executeScript('return !document.getElementById("save-sim").disabled'),10000);await p.waitText('#sim-feedback','Simulação removida');
 assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'20');assert.deepEqual((await savedItems(p)).items,[before.items[1]]);
 await p.driver.navigate().refresh();assert.equal(await p.text('#sim-list strong'),'Primeira QA');
});
scenario('falha de armazenamento preserva lista e permite nova tentativa',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await p.fill('#sim-name','Original QA');await clickSave(p);const before=await savedItems(p);
 await p.fill('#rc-l',20);await p.fill('#sim-name','Nova QA');
 await p.driver.executeScript('window.__qaSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException("Quota QA","QuotaExceededError")}');
 await clickSave(p);await p.waitText('#sim-feedback','Não foi possível salvar');assert.deepEqual(await savedItems(p),before);
 assert.equal(await p.text('#sim-list strong'),'Original QA');assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'20');
 await p.driver.executeScript('Storage.prototype.setItem=window.__qaSetItem');await clickSave(p);assert.equal((await savedItems(p)).items.length,2);
});
scenario('dados corrompidos nao sao sobrescritos e calculadora continua funcionando',async p=>{
 await p.open('/calc.html');await p.driver.executeScript('localStorage.setItem(arguments[0],"{invalido")',storageKey);await p.driver.navigate().refresh();
 await p.waitText('#sim-feedback','Os dados armazenados não foram alterados');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await p.waitText('#uso-result-value','0,110');
 await clickSave(p);assert.equal(await p.driver.executeScript('return localStorage.getItem(arguments[0])',storageKey),'{invalido');
});
scenario('limite de dez simulacoes nao descarta registros anteriores',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});
 for(let i=1;i<=10;i++){await p.fill('#sim-name','Projeto QA '+i);await clickSave(p);}
 const before=await savedItems(p);assert.equal(before.items.length,10);assert.equal(new Set(before.items.map(x=>x.id)).size,10);
 await p.fill('#sim-name','Excedente QA');await clickSave(p);await p.waitText('#sim-feedback','Limite de 10');assert.deepEqual(await savedItems(p),before);
});

const comparisonRows=p=>p.driver.executeScript('return Array.from(document.querySelectorAll("#compare-result tbody tr"),r=>Array.from(r.children,c=>c.textContent))');
async function saveNamed(p,name){await p.fill('#sim-name',name);await clickSave(p);await p.waitText('#sim-feedback','Simulação salva');}
async function chooseComparison(p,first,second){await p.select('#compare-first',first);await p.select('#compare-second',second);await p.click('#compare-sim');}
const currentCalculation=p=>p.driver.executeScript('return Array.from(document.querySelectorAll(".uso-in,.comp-in,input[name=calc-mode],input[name=calc-shape]"),e=>[e.id,e.value,e.checked])');
scenario('compara moldagem e revestimento com medidas densidade e massa sem gravar',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':0.5,'uso-density':1.2});await saveNamed(p,'<span id="qa-comparison-name">Molde QA</span>');
 await p.click('label[for="calc-shape-rcoat"]');await inputs(p,{'rcoat-l':10,'rcoat-w':10,'rcoat-t':5,'uso-density':1.1});await saveNamed(p,'Revestimento QA');
 const before=await savedItems(p),fields=await currentCalculation(p),first=before.items[1].id,second=before.items[0].id;
 await chooseComparison(p,first,second);await p.waitText('#compare-feedback','Comparação pronta');
 assert.deepEqual(await comparisonRows(p),[
  ['Formato','Moldagem retangular','Revestimento retangular'],['Medidas','10 cm × 10 cm × 0.5 cm','10 cm × 10 cm × 5 mm'],
  ['Densidade','1,2 g/ml','1,1 g/ml'],['Quantidade','0,060 kg','0,055 kg']
 ]);
 assert.equal(await p.driver.executeScript('return document.querySelectorAll("#qa-comparison-name").length'),0);
 const headers=await p.driver.executeScript('return Array.from(document.querySelectorAll("#compare-result thead th"),e=>e.textContent)');
 assert.deepEqual(headers,['Dados','<span id="qa-comparison-name">Molde QA</span>','Revestimento QA']);
 assert.deepEqual(await savedItems(p),before);assert.deepEqual(await currentCalculation(p),fields);
});
for(const unit of ['g','ml','kg']){
 scenario('compara componentes em '+unit+' com proporcoes e totais independentes',async p=>{
  await p.open('/calc.html');await p.click('label[for="calc-mode-comp"]');await p.select('#comp-unit',unit);
  await p.fill('#comp-total',unit==='kg'?3:300);await saveNamed(p,'Mistura 2:1 QA');
  await p.click('.preset-btn[data-ra="3"]');await p.fill('#comp-total',unit==='kg'?4:400);await saveNamed(p,'Mistura 3:1 QA');
  const before=await savedItems(p),fields=await currentCalculation(p);
  await chooseComparison(p,before.items[1].id,before.items[0].id);
  const expected=unit==='kg'?['3,000','4,000','2,000','3,000','1,000']:['300,0','400,0','200,0','300,0','100,0'];
  assert.deepEqual(await comparisonRows(p),[
   ['Proporção A:B','2:1','3:1'],['Total',expected[0]+' '+unit,expected[1]+' '+unit],
   ['Componente A',expected[2]+' '+unit,expected[3]+' '+unit],['Componente B',expected[4]+' '+unit,expected[4]+' '+unit]
  ]);
  assert.deepEqual(await savedItems(p),before);assert.deepEqual(await currentCalculation(p),fields);
 });
}
scenario('comparacao recusa selecao incompleta mesmo registro modos e unidades distintos',async p=>{
 await p.open('/calc.html');await p.click('#compare-sim');await p.waitText('#compare-feedback','Escolha duas simulações salvas');
 await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await saveNamed(p,'Uso QA');
 await p.click('label[for="calc-mode-comp"]');await p.fill('#comp-total',300);await saveNamed(p,'Gramas QA');
 await p.select('#comp-unit','kg');await p.fill('#comp-total',3);await saveNamed(p,'Quilos QA');
 const before=await savedItems(p),[kg,g,uso]=before.items;
 await chooseComparison(p,g.id,g.id);await p.waitText('#compare-feedback','simulações diferentes');assert.deepEqual(await comparisonRows(p),[]);
 await chooseComparison(p,uso.id,g.id);await p.waitText('#compare-feedback','mesmo modo');assert.deepEqual(await comparisonRows(p),[]);
 await chooseComparison(p,g.id,kg.id);await p.waitText('#compare-feedback','mesma unidade');assert.deepEqual(await comparisonRows(p),[]);
 assert.deepEqual(await savedItems(p),before);
});
scenario('trocar selecao e remover registro limpa comparacao obsoleta sem alterar campos',async p=>{
 await p.open('/calc.html');await inputs(p,{'rc-l':10,'rc-w':10,'rc-h':1});await saveNamed(p,'Primeira QA');
 await p.fill('#rc-l',20);await saveNamed(p,'Segunda QA');const before=await savedItems(p),fields=await currentCalculation(p),[second,first]=before.items;
 await chooseComparison(p,first.id,second.id);assert.equal((await comparisonRows(p)).length,4);
 await p.select('#compare-second',first.id);assert.deepEqual(await comparisonRows(p),[]);
 await chooseComparison(p,first.id,second.id);await p.click('[data-sim-remove="'+first.id+'"]');await (await p.driver.wait(until.alertIsPresent(),10000)).dismiss();
 assert.equal((await comparisonRows(p)).length,4);assert.deepEqual(await savedItems(p),before);
 await p.click('[data-sim-remove="'+first.id+'"]');await p.alert(/Remover a simulação/);await p.driver.wait(()=>p.driver.executeScript('return !document.getElementById("save-sim").disabled'),10000);
 assert.deepEqual(await comparisonRows(p),[]);assert.equal(await (await p.element('#compare-first')).getAttribute('value'),'');
 assert.equal(await (await p.element('#compare-second')).getAttribute('value'),second.id);
 assert.deepEqual((await savedItems(p)).items,[second]);assert.deepEqual(await currentCalculation(p),fields);
});

async function prepareProject(p,name,length){await inputs(p,{'rc-l':length,'rc-w':10,'rc-h':1});await p.fill('#sim-name',name);}
async function waitSaveIdle(p){await p.driver.wait(()=>p.driver.executeScript('return !document.getElementById("save-sim").disabled'),10000);}
scenario('aba desatualizada preserva gravacoes externas ao salvar e remover',async p=>{
 await p.open('/calc.html');const a=await p.driver.getWindowHandle();await prepareProject(p,'Projeto A QA',10);
 await p.driver.switchTo().newWindow('tab');await p.open('/calc.html');const b=await p.driver.getWindowHandle();await prepareProject(p,'Projeto B QA',20);
 await p.driver.switchTo().window(a);await clickSave(p);const first=await savedItems(p);assert.equal(first.items.length,1);
 await p.driver.switchTo().window(b);await clickSave(p);await p.waitText('#sim-feedback','alterada em outra aba');
 assert.deepEqual(await savedItems(p),first);assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'20');assert.equal(await (await p.element('#sim-name')).getAttribute('value'),'Projeto B QA');
 await clickSave(p);const both=await savedItems(p);assert.equal(both.items.length,2);assert.deepEqual(both.items[1],first.items[0]);
 await p.driver.switchTo().window(a);await p.click('[data-sim-remove]');await p.alert(/Remover a simulação/);await waitSaveIdle(p);await p.waitText('#sim-feedback','alterada em outra aba');
 assert.deepEqual(await savedItems(p),both);assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'10');
 await p.click('[data-sim-remove="'+first.items[0].id+'"]');await p.alert(/Remover a simulação/);await waitSaveIdle(p);
 assert.deepEqual((await savedItems(p)).items,[both.items[0]]);
});
scenario('duas abas aguardam bloqueio real e nao sobrescrevem escrita simultanea',async p=>{
 await p.open('/calc.html');const a=await p.driver.getWindowHandle();await prepareProject(p,'Primeira aba QA',10);
 assert.equal(await p.driver.executeScript('return typeof navigator.locks?.request'),'function');
 await p.driver.switchTo().newWindow('tab');await p.open('/calc.html');const b=await p.driver.getWindowHandle();await prepareProject(p,'Segunda aba QA',20);
 try{
  await p.driver.switchTo().window(a);
  // Real browser lock held by the test, not a replacement for the application's lock API.
  await p.driver.executeScript('navigator.locks.request(arguments[0],()=>new Promise(resolve=>{window.__qaReleaseLock=resolve}))',storageKey);
  await p.driver.wait(()=>p.driver.executeScript('return typeof window.__qaReleaseLock==="function"'),10000);
  await p.click('#save-sim');await p.waitText('#save-sim','Salvando...');assert.equal(await (await p.element('#save-sim')).isEnabled(),false);
  await p.click('#save-sim');assert.equal(await savedItems(p),null);
  await p.driver.switchTo().window(b);await p.click('#save-sim');await p.waitText('#save-sim','Salvando...');assert.equal(await savedItems(p),null);
  await p.driver.switchTo().window(a);await p.driver.executeScript('window.__qaReleaseLock()');await waitSaveIdle(p);await p.waitText('#sim-feedback','Simulação salva');
  await p.driver.switchTo().window(b);await waitSaveIdle(p);await p.waitText('#sim-feedback','alterada em outra aba');
  assert.equal((await savedItems(p)).items.length,1);assert.equal((await savedItems(p)).items[0].name,'Primeira aba QA');
  assert.equal(await (await p.element('#rc-l')).getAttribute('value'),'20');await clickSave(p);
  assert.equal((await savedItems(p)).items.length,2);assert.equal(new Set((await savedItems(p)).items.map(x=>x.id)).size,2);
 }finally{await p.driver.switchTo().window(a);await p.driver.executeScript('if(window.__qaReleaseLock)window.__qaReleaseLock()');}
});
scenario('sem API de bloqueio ainda detecta copia desatualizada antes de gravar',async p=>{
 await p.open('/calc.html');const a=await p.driver.getWindowHandle();await prepareProject(p,'Original QA',10);await clickSave(p);
 await p.driver.executeScript('Object.defineProperty(navigator,"locks",{value:undefined,configurable:true})');
 await p.driver.switchTo().newWindow('tab');await p.open('/calc.html');await p.driver.executeScript('Object.defineProperty(navigator,"locks",{value:undefined,configurable:true})');
 await prepareProject(p,'Outro QA',20);await clickSave(p);const external=await savedItems(p);assert.equal(external.items.length,2);
 await p.driver.switchTo().window(a);await prepareProject(p,'Terceiro QA',30);await clickSave(p);await p.waitText('#sim-feedback','alterada em outra aba');assert.deepEqual(await savedItems(p),external);
 await clickSave(p);assert.equal((await savedItems(p)).items.length,3);assert.deepEqual((await savedItems(p)).items.slice(1),external.items);
});

async function downloadCopy(p,expected){
 const before=new Set(await readdir(p.downloadDir));let file;
 await p.click('#sim-export');await p.waitText('#sim-feedback','Download solicitado');
 await p.driver.wait(async()=>{
  for(const name of await readdir(p.downloadDir)){
   if(before.has(name)||!name.endsWith('.json'))continue;
   const path=join(p.downloadDir,name);
   try{if(await readFile(path,'utf8')===expected){file=path;return true;}}catch{}
  }
  return false;
 },10000,'cópia JSON concluída pelo navegador');
 return file;
}
scenario('copia local baixa arquivo real sem alterar simulacoes ou formulario',async p=>{
 await p.open('/calc.html');await p.click('#sim-export');await p.waitText('#sim-feedback','Não há dados armazenados');assert.deepEqual(await readdir(p.downloadDir),[]);
 await prepareProject(p,'Projeto cópia QA',10);await clickSave(p);
 const raw=await p.driver.executeScript('return localStorage.getItem(arguments[0])',storageKey),fields=await currentCalculation(p);
 const file=await downloadCopy(p,raw);assert.equal(await readFile(file,'utf8'),raw);
 assert.equal(await p.driver.executeScript('return localStorage.getItem(arguments[0])',storageKey),raw);assert.deepEqual(await currentCalculation(p),fields);
});
scenario('copia dados invalidos e reinicia somente apos confirmacao preservando campos',async p=>{
 await p.open('/calc.html');const raw='{dados inválidos QA\n';
 await p.driver.executeScript('localStorage.setItem(arguments[0],arguments[1]);localStorage.setItem("qa-other","Preservar QA")',storageKey,raw);await p.driver.navigate().refresh();
 await p.waitText('#sim-feedback','Os dados armazenados não foram alterados');await prepareProject(p,'Rascunho QA',10);const fields=await currentCalculation(p);
 const file=await downloadCopy(p,raw);await p.click('#sim-reset');const dialog=await p.driver.wait(until.alertIsPresent(),10000);assert.match(await dialog.getText(),/registros armazenados serão apagados/);await dialog.dismiss();
 assert.equal(await p.driver.executeScript('return localStorage.getItem(arguments[0])',storageKey),raw);assert.deepEqual(await currentCalculation(p),fields);
 await p.click('#sim-reset');await p.alert(/Reiniciar a lista salva/);await waitSaveIdle(p);await p.waitText('#sim-feedback','Lista reiniciada');
 assert.deepEqual(await savedItems(p),{version:1,items:[]});assert.deepEqual(await currentCalculation(p),fields);
 assert.equal(await (await p.element('#sim-name')).getAttribute('value'),'Rascunho QA');
 assert.equal(await p.driver.executeScript('return localStorage.getItem("qa-other")'),'Preservar QA');assert.equal(await readFile(file,'utf8'),raw);
 assert.equal(await p.driver.executeScript('return document.getElementById("sim-reset").hidden'),true);
 await clickSave(p);assert.equal((await savedItems(p)).items.length,1);assert.equal((await savedItems(p)).items[0].name,'Rascunho QA');
});
scenario('recuperacao antiga nao apaga lista corrigida em outra aba',async p=>{
 await p.open('/calc.html');await p.driver.executeScript('localStorage.setItem(arguments[0],"{quebrado QA")',storageKey);await p.driver.navigate().refresh();
 await p.waitText('#sim-feedback','Os dados armazenados não foram alterados');await prepareProject(p,'Aba antiga QA',10);const a=await p.driver.getWindowHandle(),fields=await currentCalculation(p);
 await p.driver.switchTo().newWindow('tab');await p.open('/calc.html');await p.click('#sim-reset');await p.alert(/Reiniciar a lista salva/);await waitSaveIdle(p);
 await prepareProject(p,'Recuperada QA',20);await clickSave(p);const current=await savedItems(p);assert.equal(current.items.length,1);
 await p.driver.switchTo().window(a);await p.click('#sim-reset');await p.alert(/Reiniciar a lista salva/);await waitSaveIdle(p);await p.waitText('#sim-feedback','alterada em outra aba');
 assert.deepEqual(await savedItems(p),current);assert.deepEqual(await currentCalculation(p),fields);
 assert.equal(await p.driver.executeScript('return document.getElementById("sim-reset").hidden'),true);
});
