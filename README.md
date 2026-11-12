# Calculadora de Resina

Calculadora web que ajuda o cliente de uma loja online de resinas a saber **quanto produto comprar** antes de fechar o pedido.

Desenvolvi a calculadora para o e-commerce de uma indústria de resinas de Porto Alegre. Ela roda sozinha (abrindo o `calc.html`) ou embutida no tema da loja na plataforma **Tray**, sem depender de nenhuma biblioteca.

## O que ela calcula

### 1. Uso de resina

O cliente escolhe o formato da peça, informa as medidas em centímetros e recebe a quantidade de resina em **kg**.

| Formato | Medidas | Volume (cm³) |
| --- | --- | --- |
| Moldagem retangular | comprimento, largura, profundidade | C × L × P |
| Moldagem circular | diâmetro, altura | π × (d/2)² × h |
| Revestimento retangular | comprimento, largura, espessura (mm) | C × L × (e/10) |
| Revestimento circular | diâmetro, espessura (mm) | π × (d/2)² × (e/10) |
| Esfera | diâmetro | 4/3 × π × (d/2)³ |
| Meia esfera | diâmetro | 2/3 × π × (d/2)³ |

**Peso (kg) = volume (cm³) × densidade (g/cm³) ÷ 1000.** A densidade padrão é 1,1 g/cm³ e o cliente pode alterar.

### 2. Componentes A : B

Resinas epóxi são misturadas em proporção (por exemplo, 2:1). O cliente informa a proporção e a quantidade total, e a calculadora mostra quanto usar de cada componente, em gramas ou quilos, com barras de porcentagem. O componente B é calculado como `total − A`, para a soma fechar exata.

## Estrutura

| Arquivo | Conteúdo |
| --- | --- |
| `calc.html` | Página da calculadora (versão standalone) |
| `calc.css` | Estilos da calculadora |
| `calc.js` | Lógica dos dois modos de cálculo |
| `header.html` | Cabeçalho personalizado do tema da loja (Twig/Tray) |
| `style.css`, `Novostyle.css` | Ajustes visuais do tema da loja |
| `Layout_site.zip` | Backup do layout do tema |

## Como usar

**Standalone:** baixe o repositório e abra o `calc.html` no navegador.

**Na loja Tray:**

1. Cole o HTML da calculadora numa página da loja.
2. Cole o conteúdo de `calc.css` nos estilos do tema.
3. Cole o conteúdo de `calc.js` entre `<script>...</script>` em **Editor HTML (Desenvolvedor) → No final do body**.

O script espera a calculadora aparecer na página antes de ligar os eventos, porque na Tray parte do conteúdo carrega via AJAX.

## Decisões técnicas

- **JavaScript puro**, sem frameworks: o tema da loja já carrega muita coisa, então a calculadora não adiciona nenhuma dependência.
- **Cálculo em tempo real**: o resultado atualiza enquanto o cliente digita.
- **Abas e formatos feitos com radio buttons + CSS**: a troca de modo funciona mesmo antes do JavaScript carregar.
- **Números no padrão brasileiro** (`toLocaleString('pt-BR')`).

## Tecnologias

HTML · CSS · JavaScript · Twig (tema Tray)

## Autor

**Eduardo Consul** · [LinkedIn](https://www.linkedin.com/in/eduardo-consul/) · [GitHub](https://github.com/Dudu02170)
