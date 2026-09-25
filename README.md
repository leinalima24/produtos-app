# Portátil — Gestão de Produtos

![Logo Portátil](assets/logo-portatil.svg)

**Aluno(a):** Leina Lima

## Sobre o sistema

O **Portátil** é uma aplicação web para cadastro e consulta de produtos em estoque. A interface apresenta os produtos em uma tabela, com ações de cadastro, edição, visualização e exclusão.

## Funcionalidades atuais
 - Cadastro de produtos;
- Edição de produtos;
- Exclusão de produtos;
- Visualização dos detalhes;
- Pesquisa por código ou nome;
- Filtro por categoria;
- Indicadores de estoque;
- Cálculo automático do subtotal;
- Validação dos campos;
- Notificações de sucesso e erro;
- Armazenamento dos dados no `localStorage`;
- Layout responsivo.
### Dados de cada produto

Cada cadastro possui:

- **Código**;
- **Nome do produto**;
- **Categoria**;
- **Preço**;
- **Quantidade em estoque**.

Na tabela também são exibidos o subtotal e os botões de editar e excluir.

## Tecnologias utilizadas

- HTML5;
- CSS3, com variáveis de estilo e layout responsivo;
- JavaScript ES6+;
- jQuery 3.7.1;
- Lucide, para o ícone de pesquisa;
- `localStorage`, para armazenamento local dos produtos.

## Estrutura do projeto

```text
produtos-app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── assets/
│   └── logo-portatil.svg
└── README.md
```

## Como executar

1. Faça o download ou clone o projeto.
2. Abra o arquivo `index.html` diretamente no navegador.
3. Na primeira execução, alguns produtos de exemplo serão cadastrados automaticamente.

O sistema é executado no navegador e não possui servidor próprio. Como jQuery e Lucide são carregados por CDN, é necessário ter acesso à internet para que esses recursos sejam carregados.

## Próximas melhorias

- Cadastro e gerenciamento de categorias personalizadas;
- Controle de entradas e saídas do estoque;
- Histórico de movimentações;
- Relatórios e gráficos;
- Alertas de estoque mínimo.
