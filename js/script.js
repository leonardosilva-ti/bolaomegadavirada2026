// /js/script.js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec"; // Substitua pela sua URL

// Elementos DOM
const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("btnProximo");
const btnAnterior = document.getElementById("btnAnterior");
const btnGerar = document.getElementById("gerarAleatorios");
const tituloJogo = document.getElementById("titulo-jogo");
const statusContainer = document.getElementById("statusJogosContainer");
const nomeInput = document.getElementById("nome");
const telefoneInput = document.getElementById("telefone");
const pixSelect = document.getElementById("pix");

let jogoAtual = 1; // De 1 a 5
// Inicializa os 5 jogos. Os valores serão arrays de strings (os 6 números)
let jogos = Array(5).fill(null).map(() => []); 

// --- Inicialização ---

function inicializarStatusJogos() {
  statusContainer.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = `status-jogo-${i}`;
    btn.textContent = `Jogo ${i}`;
    btn.className = "status-jogo-btn";
    // Permite clicar para ir para outro jogo (se já preenchido)
    btn.onclick = () => {
      if (jogoAtual !== i) {
        salvarJogoAtual();
        jogoAtual = i;
        carregarJogo(i);
      }
    };
    statusContainer.appendChild(btn);
  }
}

function gerarNumerosGrid() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = i.toString().padStart(2, "0");
    btn.value = i.toString().padStart(2, "0");
    btn.onclick = () => selecionarNumero(btn);
    numerosContainer.appendChild(btn);
  }
}

function carregarJogo(index) {
  tituloJogo.textContent = `Jogo ${index} de 5`;

  // Limpa todos os botões de seleção e restaura a cor
  const botoes = document.querySelectorAll(".numeros-grid button");
  botoes.forEach(b => b.classList.remove("selected"));

  // Marca os números do jogo carregado
  const numerosSalvos = jogos[index - 1] || [];
  numerosSalvos.forEach(num => {
    const btn = Array.from(botoes).find(b => b.value === num);
    if (btn) btn.classList.add("selected");
  });

  // Atualiza a interface
  atualizarUI();
}

function atualizarUI() {
  // 1. Atualiza Status dos Jogos (1.8)
  const statusBotoes = document.querySelectorAll(".status-jogo-btn");
  statusBotoes.forEach((btn, i) => {
    btn.classList.remove("ativo", "preenchido");
    const numJogo = i + 1;
    const isPreenchido = jogos[i].length === 6;

    if (numJogo === jogoAtual) {
      btn.classList.add("ativo");
    }
    if (isPreenchido) {
      btn.classList.add("preenchido");
      btn.classList.remove("ativo"); // O preenchido tem prioridade visual sobre o ativo
      if (numJogo === jogoAtual) btn.classList.add("ativo"); // Mas o ativo tem que manter a cor amarela no Jogo Atual
    }
  });

  // 2. Atualiza controles de Navegação (1.4)
  const selecionados = document.querySelectorAll(".numeros-grid button.selected").length;

  // Jogo Anterior
  btnAnterior.disabled = jogoAtual === 1;
  btnAnterior.className = jogoAtual > 1 ? "primary" : "muted";

  // Próximo/Confirmar
  if (jogoAtual < 5) {
    btnProximo.textContent = "Próximo Jogo";
    btnProximo.className = selecionados === 6 ? "primary" : "muted";
    btnProximo.disabled = selecionados !== 6;
  } else {
    // Jogo 5
    btnProximo.textContent = "Confirmar";
    btnProximo.className = "primary";
    btnProximo.disabled = selecionados !== 6; // Só habilita se o Jogo 5 estiver completo
  }
}

// --- Ações do Usuário ---

function selecionarNumero(btn) {
  const selecionados = document.querySelectorAll(".numeros-grid button.selected").length;
  const isSelected = btn.classList.contains("selected");

  if (isSelected) {
    btn.classList.remove("selected");
  } else if (selecionados < 6) {
    btn.classList.add("selected");
  }
  atualizarUI();
}

btnGerar.onclick = () => {
  const botoes = Array.from(numerosContainer.querySelectorAll("button"));
  // Limpa os selecionados atuais (opcional, mas mais limpo para gerar)
  botoes.forEach(b => b.classList.remove("selected")); 
  const selecionados = new Set();

  while (selecionados.size < 6) {
    const n = String(Math.floor(Math.random() * 60 + 1)).padStart(2, "0");
    if (!selecionados.has(n)) {
      const btn = botoes.find(b => b.value === n);
      if (btn) {
        btn.classList.add("selected");
        selecionados.add(n);
      }
    }
  }
  atualizarUI();
};

function salvarJogoAtual() {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.value).sort();
  jogos[jogoAtual - 1] = selecionados;
}

btnAnterior.onclick = () => {
  if (jogoAtual > 1) {
    salvarJogoAtual(); // Salva o jogo atual antes de voltar
    jogoAtual--;
    carregarJogo(jogoAtual);
  }
};

btnProximo.onclick = () => {
  salvarJogoAtual(); // Salva o jogo atual antes de avançar/confirmar

  if (jogoAtual < 5) {
    jogoAtual++;
    carregarJogo(jogoAtual);
  } else {
    validarEEnviar();
  }
};

// --- Validação Final e Navegação (1.5, 1.6) ---

function validarEEnviar() {
  // 1. Validação de dados pessoais (1.6)
  const nome = nomeInput.value.trim();
  const telefone = telefoneInput.value.trim();
  const pix = pixSelect.value;
  if (!nome || !telefone || !pix) {
    alert("Por favor, preencha o Nome Completo, Telefone e se é Chave PIX antes de confirmar.");
    return;
  }
  if (jogos.some(j => j.length !== 6)) {
    alert("Você deve preencher 6 números em todos os 5 jogos antes de confirmar.");
    return;
  }

  // 2. Validação de duplicados (1.4)
  const jogosFormatados = jogos.map(j => j.join(" ")).sort().join("|");
  const setJogos = new Set(jogosFormatados.split("|"));
  if (setJogos.size !== 5) {
    alert("Você escolheu o mesmo conjunto de 6 números em mais de um jogo. Altere antes de confirmar (Jogos não podem se repetir).");
    return;
  }

  // 3. Preparar e Redirecionar (1.5)
  const payload = { nome, telefone, pix, jogos: jogos.map(j => j.join(" ")) };
  localStorage.setItem("pendingAposta", JSON.stringify(payload));
  window.location.href = "confirmacao.html";
}


// Inicia o processo
window.addEventListener("DOMContentLoaded", () => {
  inicializarStatusJogos();
  gerarNumerosGrid();
  carregarJogo(jogoAtual); // Carrega o Jogo 1 ao iniciar

  // Adiciona ouvintes para atualizar a UI se os campos de texto mudarem
  nomeInput.addEventListener('input', atualizarUI);
  telefoneInput.addEventListener('input', atualizarUI);
  pixSelect.addEventListener('change', atualizarUI);
});
