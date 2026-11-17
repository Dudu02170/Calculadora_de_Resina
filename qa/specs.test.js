import { scenario, assert, By } from './support.js';
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
