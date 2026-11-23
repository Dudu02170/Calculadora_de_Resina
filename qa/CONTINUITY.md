# Simulações salvas — entrega e continuidade

## Entrega e aceitação
- Guardar até dez simulações do modo atual, com nome opcional de até 60 caracteres. Salvar não modifica os campos atuais nem descarta registros antigos para abrir espaço.
- Guardar somente entradas: modo, formato/medidas/densidade ou proporção/total/unidade. Recalcular resultados com as mesmas funções usadas pela tela, sem confiar em resultados gravados.
- Restaurar o modo, formato e campos salvos; manter os campos do outro modo. Suportar os seis formatos e g/ml/kg já existentes.
- Dados locais na chave colmeia.resina.simulations.v1, formato version:1/items. Refresh na mesma origem mantém a lista; não há backend, conta ou sincronização entre dispositivos.
- Nome renderizado por textContent. Remoção exige confirmação e preserva outras simulações/campos.
- Entradas inválidas e resultados não representáveis não são salvos. Falha de escrita preserva lista anterior e informa erro/retry; leitura inválida bloqueia escrita para não sobrescrever dados antigos. Não apaga registros corrompidos automaticamente.

## Como testar
cd qa && npm install && npm test, com Node 22 e Chrome. São 46 Selenium (43 anteriores + 3 novos de proteção de gravação entre abas). Estado/CI final no PR da funcionalidade. Asserções usam resultados numéricos de referência e o formulário real. localStorage real em Chrome isolado; injeção de erro de escrita somente no teste.

## Dependência e limites
Parte de qa/test-automation, PR #1 ainda aberto. Revisar/integrar a suíte antes de retargetar a funcionalidade para main. Sem merge automático ou force-push, sem duplicar a suíte. Não há AGENTS.md no checkout ou ancestrais consultados.
A persistência depende da origem/permissão/quota do navegador e pode ser apagada ao limpar dados do site. file:// e embedding/checkout Tray não foram validados. Não valida durabilidade entre perfis/dispositivos ou densidade física. A proteção entre abas atuais tem o escopo descrito abaixo. Sem dados ou credenciais reais e sem serviços externos. Não há backend Java neste produto.

## Próximos passos
1. Comparação lado a lado entregue para o mesmo modo e, nos componentes, mesma unidade. Avaliar conversões somente com regra explícita, sem misturar massa/volume.
2. Validar outros navegadores e política para recuperação de armazenamento inválido. Proteção entre abas atuais entregue abaixo; versões antigas/outros escritores continuam fora do protocolo. Leitura inválida preserva os dados e a calculadora continua funcionando.

## Comparação de duas simulações
Seleções exigem registros distintos existentes e o mesmo modo. Uso permite diferentes formatos, mostrando medidas com cm/mm, densidade e massa em kg; componentes mostram proporção, total e A/B somente na mesma unidade g/ml/kg. Nenhuma conversão automática, gravação ou alteração do formulário. Cabeçalhos e valores usam textContent; tabela tem caption/headers e rolagem horizontal em espaços estreitos.

Recalcula pelos helpers existentes a partir das entradas salvas, sem confiar em resultados serializados. Trocar seleção ou atualizar a lista limpa a tabela para evitar resultado obsoleto. Cancelar remoção preserva comparação; remover selecionado limpa sua seleção, mantém o outro registro/seleção e o formulário.

Seis novos cenários Selenium: formatos com cm/mm/densidade/massas independentes e nome literal, componentes em cada uma das três unidades, recusa de seleção incompleta/mesmo registro/modos ou unidades diferentes, limpeza após seleção/remoção. Conferem armazenamento e campos antes/depois. Os 37 anteriores e o servidor de QA foram preservados. Não valida conversões entre unidades, comparação após concorrência entre abas ou integração Tray. Evidência final no PR #2/Actions.

## QA-CALC-001 — Cópia desatualizada sobrescrevia lista de outra aba
Reconfirmado em 32ca699 por inspeção e execução isolada de persist: a função escreve a lista em memória sem reler o armazenamento. Com lista externa A e cópia local B, a escrita anterior substitui A por B. A verificação isolada usa adaptador mínimo, não navegador real.

Entregue: antes de escrever, confere o conteúdo bruto conhecido com o atual. Conflito recarrega a lista, limpa comparação obsoleta e informa nova tentativa, sem alterar o formulário ou sobrescrever registros. Salvar/remover usam a mesma proteção. Quando disponível, navigator.locks.request serializa a conferência e escrita das abas cooperantes na mesma origem. A UI mostra Salvando... e bloqueia salvar/remover durante espera. Sem API, mantém a conferência antes da escrita e orienta usar uma única aba; esse fallback não garante exclusão mútua entre escritas simultâneas.

Aceitação: três novos cenários Selenium com duas abas da mesma sessão/origem: salvamento/remoção com cópia antiga e retry preservando registros; fila sob Web Lock real retido pelo teste, repetição bloqueada e dois escritores sem perda; ausência da API simulada com detecção de conflito sequencial. Os 43 anteriores mantêm as asserções, apenas aguardando o fim do estado ocupado na UI ao salvar/remover. localStorage e locks são reais no Chrome em loopback, sem backend ou novos serviços/dependências.

Limites: protocolo entre abas desta versão; não controla escritores externos/versões antigas que ignorem o lock, perfis/dispositivos ou processos fora da origem. Não há refresh passivo: consultas em aba ociosa mantêm sua cópia até reload ou tentativa de escrita. Falha/corrupção continua sem sobrescrita. Web Locks requer suporte/contexto apropriado; outros navegadores, file:// e Tray continuam pendentes. Referência consultada: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API. Evidência final no PR #2/Actions. Como testar: cd qa && npm install && npm test (Node 22 e Chrome).
