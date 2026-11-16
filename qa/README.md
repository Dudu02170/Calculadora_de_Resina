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
