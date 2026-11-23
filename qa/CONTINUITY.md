# Simulações salvas — entrega e continuidade

## Entrega e aceitação
- Guardar até dez simulações do modo atual, com nome opcional de até 60 caracteres. Salvar não modifica os campos atuais nem descarta registros antigos para abrir espaço.
- Guardar somente entradas: modo, formato/medidas/densidade ou proporção/total/unidade. Recalcular resultados com as mesmas funções usadas pela tela, sem confiar em resultados gravados.
- Restaurar o modo, formato e campos salvos; manter os campos do outro modo. Suportar os seis formatos e g/ml/kg já existentes.
- Dados locais na chave colmeia.resina.simulations.v1, formato version:1/items. Refresh na mesma origem mantém a lista; não há backend, conta ou sincronização entre dispositivos.
- Nome renderizado por textContent. Remoção exige confirmação e preserva outras simulações/campos.
- Entradas inválidas e resultados não representáveis não são salvos. Falha de escrita preserva lista anterior e informa erro/retry; leitura inválida bloqueia escrita para não sobrescrever dados antigos. Não apaga registros corrompidos automaticamente; reinício opcional exige confirmação e oferece cópia local.

## Como testar
cd qa && npm install && npm test, com Node 22 e Chrome. São 63 Selenium (49 anteriores + 14 novos de importação local). Estado/CI final no PR da funcionalidade. Asserções usam resultados numéricos de referência e o formulário real. localStorage real em Chrome isolado; injeção de erro de escrita somente no teste.

## Dependência e limites
Parte de qa/test-automation, PR #1 ainda aberto. Revisar/integrar a suíte antes de retargetar a funcionalidade para main. Sem merge automático ou force-push, sem duplicar a suíte. Não há AGENTS.md no checkout ou ancestrais consultados.
A persistência depende da origem/permissão/quota do navegador e pode ser apagada ao limpar dados do site. file:// e embedding/checkout Tray não foram validados. Não valida durabilidade entre perfis/dispositivos ou densidade física. A proteção entre abas atuais tem o escopo descrito abaixo. Sem dados ou credenciais reais e sem serviços externos. Não há backend Java neste produto.

## Próximos passos
1. Comparação lado a lado entregue para o mesmo modo e, nos componentes, mesma unidade. Avaliar conversões somente com regra explícita, sem misturar massa/volume.
2. Validar outros navegadores. Cópia, reinício e importação validada entregues abaixo; não há reparo/importação automática. Versões antigas/outros escritores continuam fora do protocolo de abas.

## Comparação de duas simulações
Seleções exigem registros distintos existentes e o mesmo modo. Uso permite diferentes formatos, mostrando medidas com cm/mm, densidade e massa em kg; componentes mostram proporção, total e A/B somente na mesma unidade g/ml/kg. Nenhuma conversão automática, gravação ou alteração do formulário. Cabeçalhos e valores usam textContent; tabela tem caption/headers e rolagem horizontal em espaços estreitos.

Recalcula pelos helpers existentes a partir das entradas salvas, sem confiar em resultados serializados. Trocar seleção ou atualizar a lista limpa a tabela para evitar resultado obsoleto. Cancelar remoção preserva comparação; remover selecionado limpa sua seleção, mantém o outro registro/seleção e o formulário.

Seis novos cenários Selenium: formatos com cm/mm/densidade/massas independentes e nome literal, componentes em cada uma das três unidades, recusa de seleção incompleta/mesmo registro/modos ou unidades diferentes, limpeza após seleção/remoção. Conferem armazenamento e campos antes/depois. Os 37 anteriores e o servidor de QA foram preservados. Não valida conversões entre unidades, comparação após concorrência entre abas ou integração Tray. Evidência final no PR #2/Actions.

## QA-CALC-001 — Cópia desatualizada sobrescrevia lista de outra aba
Reconfirmado em 32ca699 por inspeção e execução isolada de persist: a função escreve a lista em memória sem reler o armazenamento. Com lista externa A e cópia local B, a escrita anterior substitui A por B. A verificação isolada usa adaptador mínimo, não navegador real.

Entregue: antes de escrever, confere o conteúdo bruto conhecido com o atual. Conflito recarrega a lista, limpa comparação obsoleta e informa nova tentativa, sem alterar o formulário ou sobrescrever registros. Salvar/remover usam a mesma proteção. Quando disponível, navigator.locks.request serializa a conferência e escrita das abas cooperantes na mesma origem. A UI mostra Salvando... e bloqueia salvar/remover durante espera. Sem API, mantém a conferência antes da escrita e orienta usar uma única aba; esse fallback não garante exclusão mútua entre escritas simultâneas.

Aceitação: três novos cenários Selenium com duas abas da mesma sessão/origem: salvamento/remoção com cópia antiga e retry preservando registros; fila sob Web Lock real retido pelo teste, repetição bloqueada e dois escritores sem perda; ausência da API simulada com detecção de conflito sequencial. Os 43 anteriores mantêm as asserções, apenas aguardando o fim do estado ocupado na UI ao salvar/remover. localStorage e locks são reais no Chrome em loopback, sem backend ou novos serviços/dependências.

Limites: protocolo entre abas desta versão; não controla escritores externos/versões antigas que ignorem o lock, perfis/dispositivos ou processos fora da origem. Não há refresh passivo: consultas em aba ociosa mantêm sua cópia até reload ou tentativa de escrita. Falha/corrupção continua sem sobrescrita. Web Locks requer suporte/contexto apropriado; outros navegadores, file:// e Tray continuam pendentes. Referência consultada: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API. Evidência final no PR #2/Actions. Como testar: cd qa && npm install && npm test (Node 22 e Chrome).

## Cópia local e recuperação explícita
Baixar cópia local lê somente a chave da calculadora no momento do clique e solicita um arquivo simulacoes-resina.json com o conteúdo textual UTF-8, sem parse/normalização. Não afirma que o navegador concluiu o download nem importa/corrige o arquivo. Ausência de dados e falha de acesso são informadas sem alteração do armazenamento.

Reiniciar lista salva aparece somente após leitura bem-sucedida de conteúdo inválido. Não aparece em lista válida ou quando o armazenamento está inacessível. A confirmação informa o apagamento dos registros e orienta baixar cópia antes; cancelar mantém dados. Usa a mesma fila de escrita/lock e confere o conteúdo inválido observado antes de substituir pela lista vazia versionada. Se mudou em outra aba, recarrega e recusa o reinício. Mantém formulário, outras chaves e libera salvamento após sucesso.

Três novos cenários Selenium, total 49: download real no Chrome e conteúdo igual ao storage sem alterar formulário; cópia de texto inválido, cancelamento/reinício, preservação de campos/outra chave/cópia em arquivo e retomada de salvar; conflito com lista corrigida por outra aba sem apagamento. O suporte QA define diretório de downloads isolado por cenário e os testes aguardam o arquivo concluído no sistema de arquivos, sem simular Blob/URL/clique. Dados são fictícios; os 46 anteriores mantêm as asserções.

Limites: download depende do navegador/permissões e deve ser conferido pelo usuário antes de reiniciar. Reinício descarta o conteúdo inválido somente por decisão explícita, sem repará-lo; a cópia permanece um arquivo local, sem upload ou sincronização; importação explícita descrita abaixo. Outros navegadores, file:// e Tray não foram validados. A proteção entre abas mantém os limites do protocolo descrito acima. Como testar: cd qa && npm install && npm test (Node 22 e Chrome), evidências e cópias fictícias em qa/reports/ no artefato do Actions do PR #2.

## Importação local de cópias válidas
Entrega: controle de arquivo rotulado e botão Importar cópia. Lê somente o arquivo escolhido, JSON UTF-8 de até 128 KiB, sem HTTP/serviços novos. Reutiliza a validação version:1/items do armazenamento: até dez IDs únicos, nomes válidos e entradas positivas/representáveis dos formatos/unidades existentes. Campos desconhecidos e resultados fornecidos pelo arquivo são descartados; resultados continuam calculados pelos helpers da tela.

Aceitação: valida o arquivo inteiro antes de propor gravação. Adiciona novos registros na ordem do arquivo antes dos atuais, sem modificar registros atuais nem formulário. IDs existentes com nome/entradas idênticos são ignorados; ID com conteúdo diferente recusa tudo. Total combinado acima de dez também recusa tudo, sem descarte ou importação parcial. Cópia vazia/repetida informa que não há registros novos. Confirma a quantidade antes de gravar; cancelar mantém tudo. Limpa a seleção de arquivo para permitir nova tentativa.

Leitura mantém salvar/remover/exportar/reiniciar/importar ocupados; escrita usa persist e a mesma conferência/lock das demais operações. Conflito entre abas recarrega lista e recusa a operação; exige escolher o arquivo novamente para tentar. Falha de escrita mantém lista anterior. Lista atual ilegível/inválida não é substituída por importação: orienta conferir cópia e reiniciar explicitamente antes.

Regressões: 14 novos Selenium, total 63, preservando os 49 anteriores. Arquivos reais no input via WebDriver: round trip de cópia realmente baixada (dois modos), preservação, repetição sem duplicação e restauração com valores independentes; sem arquivo/vazio/cancelamento/retry; JSON quebrado, versão desconhecida, IDs repetidos, dimensão textual e formato desconhecido sem adição parcial; tamanho exato de 128 KiB e excesso; limite combinado; conflito de ID; quota injetada e recuperação; duas abas com lock real retido, conflito e retry; armazenamento atual corrompido; descarte de resultados/campos desconhecidos com recálculo. Não injeta FileList/Blob nem chama funções internas. Somente o erro de quota é simulado; armazenamento, leitura de arquivo, download e locks são reais no Chrome de QA.

Limites: não repara cópias inválidas, não faz merge de versões conflitantes nem substitui registros pelo ID. Sem sincronização/servidor/backend Java, outros navegadores e Tray pendentes. Mantém os limites do protocolo entre abas. Como testar: cd qa && npm install && npm test (Node 22/Chrome). Resultados finais no PR #2/Actions; arquivos são fictícios e ficam com JUnit em qa/reports/ no artefato. Referências de API: https://developer.mozilla.org/en-US/docs/Web/API/Blob/text e https://www.selenium.dev/documentation/webdriver/elements/file_upload/.
