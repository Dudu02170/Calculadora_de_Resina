# Automação da calculadora
JavaScript + Selenium WebDriver, Chrome e Node.js 22+. Execute:
```sh
cd qa
npm install
npm test
```
HEADLESS=false npm test abre o navegador. O servidor é iniciado automaticamente em 127.0.0.1 com porta livre; cada cenário recebe uma sessão limpa.
Cobertura: seis formatos, conversão mm/cm, densidade, medidas inválidas, divisão A:B, preset e kg.
Os resultados esperados são exemplos numéricos independentes da implementação.
Relatório JUnit em reports/results.xml e screenshot/HTML/URL nas falhas. GitHub Actions executa nos PRs.
Não testa o checkout da Tray nem a precisão física da densidade informada. Não acessa produção.
Referências: https://www.selenium.dev/selenium/docs/api/javascript/ e https://nodejs.org/api/test.html

## Simulações salvas
Total vigente: 37 cenários Selenium, mantendo os 23 anteriores. Quatorze novos casos validam salvamento/restauração dos seis formatos (incluindo densidade diferente da padrão), três unidades de componentes com proporção e preservação do outro modo, recusa de entradas inválidas/resultado obsoleto, nome literal, remoção com cancelamento e preservação de outra simulação, limite de dez, erro de quota seguido de recuperação e dados corrompidos sem sobrescrita.

O servidor entrega calc.html/calc.js reais sem transformação. Os registros usam localStorage real do Chrome em origem loopback isolada; refresh valida persistência na mesma sessão/origem do navegador. No caso de quota, apenas o teste substitui temporariamente Storage.prototype.setItem para lançar erro e depois restaura o método. No caso de corrupção, grava dados fictícios no armazenamento local da sessão. Não é backend, conta/sincronização, garantia de armazenamento permanente ou integração Tray. Nenhuma dependência adicionada.

As fórmulas foram centralizadas para tela e simulações usarem o mesmo cálculo; apenas resultados positivos/representáveis são aceitos. Verificação local dos helpers reais cobriu seis massas de referência, densidade, proporção e rejeição de zero/overflow. Sintaxe e diff --check locais; execução completa do navegador deve ser conferida no Actions do PR da funcionalidade. Não foi criado backend Java inexistente.

## Comparação lado a lado
Total vigente: 43 cenários Selenium (37 anteriores + seis novos). Tabela compara dois registros distintos do mesmo modo; componentes exigem a mesma unidade. Não converte ou persiste resultados. Exibe formato/medidas/densidade/kg ou proporção/total/A/B, recalculando com os mesmos helpers. Rejeições apresentam mensagem e não deixam tabela antiga. Mudar seleção ou lista limpa resultados; cancelar remoção preserva a comparação.

Testes verificam valores de referência independentes, nomes como texto, campos e localStorage intactos após consulta, três unidades, combinações recusadas e remoção/cancelamento com seleção preservada quando possível. Não invocam funções internas da aplicação. localStorage é real no Chrome isolado; sem backend, dependências novas, conversão de unidades ou integração Tray. Sintaxe/diff --check locais e evidência final no Actions do PR #2.
