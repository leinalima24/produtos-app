/* ==========================================================================
   Estoque&Cia — Cadastro e Gestão de Produtos
   Regras de negócio em JavaScript puro (array de objetos + localStorage)
   Manipulação de DOM, eventos e UI feita com jQuery
   ========================================================================== */

// ------------------------- Estado da aplicação -------------------------

const CHAVE_STORAGE = 'estoqueCia.produtos';
const LIMITE_ESTOQUE_BAIXO = 5;

let produtos = [];          // array de objetos: {id, codigo, nome, categoria, preco, quantidade}
let idParaExcluir = null;   // guarda o id selecionado no modal de confirmação
let idEmEdicao = null;      // guarda o id do produto sendo editado (null = cadastro novo)
let idProdutoEmDetalhe = null;

// ------------------------- Persistência (localStorage) -------------------------

function carregarProdutos() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  if (dados) {
    try {
      produtos = JSON.parse(dados);
    } catch (e) {
      produtos = [];
    }
  } else {
    // dados de exemplo na primeira execução
    produtos = [
      { id: 1, codigo: 'PRD-001', nome: 'Mouse sem fio', categoria: 'Eletrônicos', preco: 79.9, quantidade: 24 },
      { id: 2, codigo: 'PRD-002', nome: 'Cadeira gamer', categoria: 'Móveis', preco: 899.0, quantidade: 3 },
      { id: 3, codigo: 'PRD-003', nome: 'Caderno universitário', categoria: 'Papelaria', preco: 18.5, quantidade: 120 }
    ];
    salvarProdutos();
  }
}

function salvarProdutos() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(produtos));
}

function proximoId() {
  return produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

// ------------------------- Regras de negócio -------------------------

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularSubtotal(produto) {
  return produto.preco * produto.quantidade;
}

function calcularIndicadores(lista) {
  const totalProdutos = lista.length;
  const totalItens = lista.reduce((soma, p) => soma + p.quantidade, 0);
  const valorTotal = lista.reduce((soma, p) => soma + calcularSubtotal(p), 0);
  return { totalProdutos, totalItens, valorTotal };
}

function codigoJaExiste(codigo, ignorarId) {
  return produtos.some(p => p.codigo.toLowerCase() === codigo.toLowerCase() && p.id !== ignorarId);
}

// Valida os dados do formulário e retorna { valido, erros }
function validarProduto(dados, idEmEdicaoAtual) {
  const erros = {};

  if (!dados.codigo.trim()) {
    erros.codigo = 'Informe o código do produto.';
  } else if (codigoJaExiste(dados.codigo.trim(), idEmEdicaoAtual)) {
    erros.codigo = 'Já existe um produto com esse código.';
  }

  if (!dados.nome.trim()) {
    erros.nome = 'Informe o nome do produto.';
  } else if (dados.nome.trim().length < 3) {
    erros.nome = 'O nome deve ter pelo menos 3 caracteres.';
  }

  if (!dados.categoria) {
    erros.categoria = 'Selecione uma categoria.';
  }

  if (dados.preco === '' || isNaN(dados.preco)) {
    erros.preco = 'Informe um preço válido.';
  } else if (Number(dados.preco) <= 0) {
    erros.preco = 'O preço deve ser maior que zero.';
  }

  if (dados.quantidade === '' || isNaN(dados.quantidade)) {
    erros.quantidade = 'Informe uma quantidade válida.';
  } else if (Number(dados.quantidade) < 0 || !Number.isInteger(Number(dados.quantidade))) {
    erros.quantidade = 'A quantidade deve ser um número inteiro maior ou igual a 0.';
  }

  return { valido: Object.keys(erros).length === 0, erros };
}

// Aplica busca, filtro de categoria e ordenação sobre o array de produtos
function obterProdutosFiltrados() {
  const termo = $('#busca').val().trim().toLowerCase();
  const categoria = $('#filtroCategoria').val();
  const ordenarPor = $('#ordenar').val();

  let resultado = produtos.filter(p => {
    const combinaTermo = !termo ||
      p.codigo.toLowerCase().includes(termo) ||
      p.nome.toLowerCase().includes(termo);
    const combinaCategoria = !categoria || p.categoria === categoria;
    return combinaTermo && combinaCategoria;
  });

  if (ordenarPor === 'nome') {
    resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } else if (ordenarPor === 'preco') {
    resultado.sort((a, b) => a.preco - b.preco);
  } else if (ordenarPor === 'quantidade') {
    resultado.sort((a, b) => a.quantidade - b.quantidade);
  }

  return resultado;
}

function atualizarEstadoFiltro() {
  $('#btnLimparFiltro').prop('hidden', !$('#filtroCategoria').val());
}

// ------------------------- Renderização (jQuery) -------------------------

function renderizarTabela() {
  const lista = obterProdutosFiltrados();
  const $corpo = $('#corpoTabela');
  $corpo.empty();

  $('#listaVazia').toggle(lista.length === 0);
  $('#tabelaProdutos').toggle(lista.length > 0);

  lista.forEach(produto => {
    const $linha = $('<tr>').attr('data-id', produto.id);
    $linha.on('click', function (event) {
      if ($(event.target).closest('button').length) return;
      abrirModalDetalhes(produto.id);
    });

    $linha.append($('<td>').addClass('col-codigo').text(produto.codigo));
    $linha.append($('<td>').text(produto.nome));
    $linha.append($('<td>').append($('<span>').addClass('badge-categoria').text(produto.categoria)));
    $linha.append($('<td>').addClass('col-preco').text(formatarMoeda(produto.preco)));

    const $qtd = $('<td>').addClass('col-qtd').text(produto.quantidade);
    $linha.append($qtd);

    $linha.append($('<td>').addClass('col-subtotal').text(formatarMoeda(calcularSubtotal(produto))));

    const $acoes = $('<td>').addClass('acoes-linha');
    const $btnEditar = $('<button>').addClass('btn--icone').attr('type', 'button').attr('title', 'Editar').attr('aria-label', 'Editar').html('<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21.2499 4.81934C21.25 4.27064 21.0314 3.74448 20.6435 3.35645C20.2556 2.96857 19.73 2.75019 19.1815 2.75C18.633 2.74993 18.1066 2.9678 17.7186 3.35547L4.37197 16.7051C4.2274 16.8492 4.11869 17.0266 4.05849 17.2217L4.05947 17.2227L2.87392 21.124L6.77822 19.9404C6.97395 19.8809 7.15286 19.7743 7.29775 19.6299L20.6435 6.28223C21.0314 5.89433 21.2498 5.36797 21.2499 4.81934ZM22.7499 4.81934C22.7498 5.70679 22.4191 6.56022 21.8261 7.21484L21.704 7.34277L8.35634 20.6924C8.07746 20.9704 7.74269 21.1853 7.3749 21.3223L7.21474 21.376L2.86123 22.6963H2.85927C2.64329 22.7611 2.41391 22.7669 2.19521 22.7119C1.97637 22.6569 1.77678 22.5432 1.61708 22.3838C1.45747 22.2244 1.34338 22.0253 1.28798 21.8066C1.23261 21.5879 1.23802 21.3578 1.30263 21.1416L1.30361 21.1387L2.62392 16.7861L2.6249 16.7842C2.75706 16.3533 2.99328 15.9618 3.3124 15.6436L16.6571 2.29492C17.3265 1.62571 18.235 1.24988 19.1815 1.25C20.128 1.25019 21.0358 1.62658 21.705 2.2959C22.374 2.96525 22.75 3.87293 22.7499 4.81934Z" fill="currentColor"/><path d="M14.4696 4.46973C14.7625 4.17683 15.2373 4.17683 15.5302 4.46973L19.5302 8.46973C19.8231 8.76262 19.8231 9.23738 19.5302 9.53027C19.2373 9.82317 18.7625 9.82317 18.4696 9.53027L14.4696 5.53027C14.1767 5.23738 14.1767 4.76262 14.4696 4.46973Z" fill="currentColor"/></svg>').on('click', () => iniciarEdicao(produto.id));
    const $btnExcluir = $('<button>').addClass('btn--icone perigo').attr('type', 'button').attr('title', 'Excluir').attr('aria-label', 'Excluir').html('<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 5.25C21.4142 5.25 21.75 5.58579 21.75 6C21.75 6.41421 21.4142 6.75 21 6.75H3C2.58579 6.75 2.25 6.41421 2.25 6C2.25 5.58579 2.58579 5.25 3 5.25H21Z" fill="currentColor"/><path d="M4.25 20V6C4.25 5.58579 4.58579 5.25 5 5.25C5.41421 5.25 5.75 5.58579 5.75 6V20C5.75 20.2561 5.88553 20.575 6.15527 20.8447C6.42501 21.1145 6.74392 21.25 7 21.25H17C17.2561 21.25 17.575 21.1145 17.8447 20.8447C18.1145 20.575 18.25 20.2561 18.25 20V6C18.25 5.58579 18.5858 5.25 19 5.25C19.4142 5.25 19.75 5.58579 19.75 6V20C19.75 20.7439 19.3855 21.425 18.9053 21.9053C18.425 22.3855 17.7439 22.75 17 22.75H7C6.25608 22.75 5.57499 22.3855 5.09473 21.9053C4.61447 21.425 4.25 20.7439 4.25 20Z" fill="currentColor"/><path d="M15.25 6V4C15.25 3.74392 15.1145 3.42501 14.8447 3.15527C14.575 2.88553 14.2561 2.75 14 2.75H10C9.74392 2.75 9.42501 2.88553 9.15527 3.15527C8.88553 3.42501 8.75 3.74392 8.75 4V6C8.75 6.41421 8.41421 6.75 8 6.75C7.58579 6.75 7.25 6.41421 7.25 6V4C7.25 3.25608 7.61447 2.57499 8.09473 2.09473C8.57499 1.61447 9.25608 1.25 10 1.25H14C14.7439 1.25 15.425 1.61447 15.9053 2.09473C16.3855 2.57499 16.75 3.25608 16.75 4V6C16.75 6.41421 16.4142 6.75 16 6.75C15.5858 6.75 15.25 6.41421 15.25 6Z" fill="currentColor"/><path d="M9.25 17V11C9.25 10.5858 9.58579 10.25 10 10.25C10.4142 10.25 10.75 10.5858 10.75 11V17C10.75 17.4142 10.4142 17.75 10 17.75C9.58579 17.75 9.25 17.4142 9.25 17Z" fill="currentColor"/><path d="M13.25 17V11C13.25 10.5858 13.5858 10.25 14 10.25C14.4142 10.25 14.75 10.5858 14.75 11V17C14.75 17.4142 14.4142 17.75 14 17.75C13.5858 17.75 13.25 17.4142 13.25 17Z" fill="currentColor"/></svg>').on('click', () => abrirModalExclusao(produto.id));
    $acoes.append($btnEditar, $btnExcluir);
    $linha.append($acoes);

    $corpo.append($linha);
  });

  atualizarIndicadores();
}

function abrirModalDetalhes(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  idProdutoEmDetalhe = id;

  $('#detalheCodigo').text(produto.codigo);
  $('#detalheNome').text(produto.nome);
  $('#detalheCategoria').text(produto.categoria);
  $('#detalhePreco').text(formatarMoeda(produto.preco));
  $('#detalheQuantidade').text(produto.quantidade);
  $('#detalheSubtotal').text(formatarMoeda(calcularSubtotal(produto)));

  $('#modalDetalheProduto').prop('hidden', false);
}

function fecharModalDetalhes() {
  idProdutoEmDetalhe = null;
  $('#modalDetalheProduto').prop('hidden', true);
}

function atualizarIndicadores() {
  const { totalProdutos, totalItens, valorTotal } = calcularIndicadores(produtos);
  $('#statTotalProdutos').text(totalProdutos);
  $('#statTotalItens').text(totalItens);
  $('#statValorTotal').text(formatarMoeda(valorTotal));
}

function mostrarToast(mensagem, tipo) {
  const $toast = $('#toast');
  $toast.text(mensagem)
    .removeClass('toast--sucesso toast--erro')
    .addClass(tipo === 'erro' ? 'toast--erro' : 'toast--sucesso')
    .prop('hidden', false);

  clearTimeout($toast.data('timeoutId'));
  const timeoutId = setTimeout(() => $toast.prop('hidden', true), 2800);
  $toast.data('timeoutId', timeoutId);
}

function limparErros() {
  $('.erro').text('');
  $('input, select').removeClass('campo-invalido');
}

function exibirErros(erros) {
  Object.keys(erros).forEach(campo => {
    $('#erro' + capitalizar(campo)).text(erros[campo]);
    $('#' + campo).addClass('campo-invalido');
  });
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ------------------------- Ações de CRUD -------------------------

function lerFormulario() {
  return {
    codigo: $('#codigo').val(),
    nome: $('#nome').val(),
    categoria: $('#categoria').val(),
    preco: $('#preco').val(),
    quantidade: $('#quantidade').val()
  };
}

function salvarProduto(event) {
  event.preventDefault();
  limparErros();

  const dados = lerFormulario();
  const { valido, erros } = validarProduto(dados, idEmEdicao);

  if (!valido) {
    exibirErros(erros);
    mostrarToast('Corrija os campos destacados antes de continuar.', 'erro');
    return;
  }

  if (idEmEdicao === null) {
    produtos.push({
      id: proximoId(),
      codigo: dados.codigo.trim(),
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      preco: Number(dados.preco),
      quantidade: Number(dados.quantidade)
    });
    mostrarToast('Produto cadastrado com sucesso!', 'sucesso');
  } else {
    const produto = produtos.find(p => p.id === idEmEdicao);
    produto.codigo = dados.codigo.trim();
    produto.nome = dados.nome.trim();
    produto.categoria = dados.categoria;
    produto.preco = Number(dados.preco);
    produto.quantidade = Number(dados.quantidade);
    mostrarToast('Produto atualizado com sucesso!', 'sucesso');
  }

  salvarProdutos();
  renderizarTabela();
  cancelarEdicao();
}

function abrirModalProduto() {
  idEmEdicao = null;
  $('#formProduto')[0].reset();
  $('#produtoId').val('');
  limparErros();
  $('#formTitulo').text('Novo produto');
  $('#btnSalvar').text('Cadastrar produto');
  $('#btnCancelar').prop('hidden', true);
  $('#modalProduto').prop('hidden', false);
  $('#codigo').trigger('focus');
}

function fecharModalProduto() {
  $('#modalProduto').prop('hidden', true);
  if (idEmEdicao !== null) {
    cancelarEdicao();
  } else {
    $('#formProduto')[0].reset();
    $('#produtoId').val('');
    limparErros();
    $('#formTitulo').text('Novo produto');
    $('#btnSalvar').text('Cadastrar produto');
    $('#btnCancelar').prop('hidden', true);
  }
}

function iniciarEdicao(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  idEmEdicao = id;
  limparErros();

  $('#produtoId').val(produto.id);
  $('#codigo').val(produto.codigo);
  $('#nome').val(produto.nome);
  $('#categoria').val(produto.categoria);
  $('#preco').val(produto.preco);
  $('#quantidade').val(produto.quantidade);

  $('#formTitulo').text('Editar produto');
  $('#btnSalvar').text('Salvar alterações');
  $('#btnCancelar').prop('hidden', false);
  $('#modalProduto').prop('hidden', false);

  $('html, body').animate({ scrollTop: 0 }, 200);
  $('#codigo').trigger('focus');
}

function cancelarEdicao() {
  idEmEdicao = null;
  $('#formProduto')[0].reset();
  $('#produtoId').val('');
  limparErros();
  $('#formTitulo').text('Novo produto');
  $('#btnSalvar').text('Cadastrar produto');
  $('#btnCancelar').prop('hidden', true);
  $('#modalProduto').prop('hidden', true);
}

function abrirModalExclusao(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  idParaExcluir = id;
  $('#modalNomeProduto').text(produto.nome);
  $('#modalConfirmar').prop('hidden', false);
}

function fecharModalExclusao() {
  idParaExcluir = null;
  $('#modalConfirmar').prop('hidden', true);
}

function confirmarExclusao() {
  if (idParaExcluir === null) return;
  produtos = produtos.filter(p => p.id !== idParaExcluir);
  salvarProdutos();
  renderizarTabela();
  mostrarToast('Produto excluído com sucesso.', 'sucesso');
  fecharModalExclusao();

  if (idEmEdicao === idParaExcluir) cancelarEdicao();
}

// ------------------------- Inicialização e eventos -------------------------

$(function () {
  carregarProdutos();
  atualizarEstadoFiltro();
  renderizarTabela();
  if (window.lucide) lucide.createIcons();

  $('#formProduto').on('submit', salvarProduto);
  $('#btnCancelar').on('click', function () {
    fecharModalProduto();
  });
  $('#btnNovoProduto').on('click', abrirModalProduto);
  $('#btnFecharModalProduto').on('click', fecharModalProduto);

  $('#busca').on('input', renderizarTabela);
  $('#filtroCategoria').on('change', function () {
    atualizarEstadoFiltro();
    renderizarTabela();
  });
  $('#ordenar').on('change', renderizarTabela);
  $('#btnLimparFiltro').on('click', function () {
    $('#filtroCategoria').val('');
    atualizarEstadoFiltro();
    renderizarTabela();
  });

  $('#btnCancelarExclusao').on('click', fecharModalExclusao);
  $('#btnConfirmarExclusao').on('click', confirmarExclusao);
  $('#btnFecharDetalhe').on('click', fecharModalDetalhes);
  $('#btnFecharDetalheProduto').on('click', fecharModalDetalhes);
  $('#btnIrParaEdicao').on('click', function () {
    if (idProdutoEmDetalhe === null) return;
    const id = idProdutoEmDetalhe;
    fecharModalDetalhes();
    iniciarEdicao(id);
  });

  $('#modalProduto').on('click', function (event) {
    if (event.target === this) fecharModalProduto();
  });
  $('#modalConfirmar').on('click', function (event) {
    if (event.target === this) fecharModalExclusao();
  });
  $('#modalDetalheProduto').on('click', function (event) {
    if (event.target === this) fecharModalDetalhes();
  });

  $(document).on('keydown', function (event) {
    if (event.key === 'Escape') {
      if (!$('#modalConfirmar').prop('hidden')) {
        fecharModalExclusao();
      } else if (!$('#modalDetalheProduto').prop('hidden')) {
        fecharModalDetalhes();
      } else if (!$('#modalProduto').prop('hidden')) {
        fecharModalProduto();
      }
    }
  });
});
