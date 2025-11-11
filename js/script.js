// js/script.js (SUBSTITUA TODO O ARQUIVO POR ESTE)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("proximo");
const btnEnviar = document.getElementById("enviar");
const form = document.getElementById("cadastroForm");
const msg = document.getElementById("mensagem");

let jogoAtual = 1;
let jogos = [];

// --- cria grade e mantém botão "Gerar Números Aleatórios" apenas 1 vez ---
function criarGradeECriarBotao() {
  gerarNumerosGrid();
  criarBotaoGerarUmaVez();
}
function gerarNumerosGrid() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button"; // evita submit acidental
    btn.textContent = i.toString().padStart(2, "0");
    btn.className = "num-grid-btn";
    btn.onclick = () => toggleNumero(btn);
    numerosContainer.appendChild(btn);
  }
  // atualiza estado do próximo
  validarSelecao();
}
function criarBotaoGerarUmaVez() {
  // se já existe, não cria de novo
  if (document.getElementById("btnGerarAuto")) return;
  const gerarAuto = document.createElement("button");
  gerarAuto.type = "button";
  gerarAuto.id = "btnGerarAuto";
  gerarAuto.textContent = "Gerar Números Aleatórios (completar)";
  gerarAuto.classList.add("muted");
  gerarAuto.style.display = "block";
  gerarAuto.style.margin = "12px auto";
  gerarAuto.onclick = () => gerarAleatoriosComplementando();
  // coloca após o container de números
  numerosContainer.parentNode.insertBefore(gerarAuto, numerosContainer.nextSibling);
}

// alterna seleção do número, respeitando limite de 6
function toggleNumero(btn) {
  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected");
  } else {
    const selecionados = document.querySelectorAll(".numeros-grid button.selected");
    if (selecionados.length >= 6) {
      alert("Você só pode selecionar 6 números por jogo.");
      return;
    }
    btn.classList.add("selected");
  }
  validarSelecao();
}

// completa somente os números faltantes (preservando os já escolhidos)
function gerarAleatoriosComplementando() {
  const botões = Array.from(document.querySelectorAll(".numeros-grid button"));
  const selecionados = Array.from(document.querySelectorAll(".numeros-grid button.selected")).map(b => b.textContent);
  const faltam = 6 - selecionados.length;
  if (faltam <= 0) {
    alert("Jogo já possui 6 números.");
    return;
  }

  // cria pool de números não selecionados ainda
  const pool = botões
    .map(b => b.textContent)
    .filter(n => !selecionados.includes(n));

  // embaralha pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // adiciona os faltantes sem desmarcar os existentes
  for (let k = 0; k < faltam && pool.length > 0; k++) {
    const n = pool.shift();
    const btn = botões.find(b => b.textContent === n);
    if (btn) btn.classList.add("selected");
  }

  validarSelecao();
}

// habilita/desabilita botão Próximo dependendo se há 6 selecionados
function validarSelecao() {
  const selecionados = document.querySelectorAll(".numeros-grid button.selected");
  btnProximo.disabled = selecionados.length !== 6;
}

// chamada do botão Próximo
btnProximo.onclick = () => {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.textContent);
  if (selecionados.length !== 6) {
    alert("Você deve selecionar 6 números antes de avançar.");
    return;
  }

  // salva o jogo atual (ordenado)
  const ordenados = selecionados.map(n => Number(n)).sort((a,b) => a - b).map(n => String(n).padStart(2,"0"));
  jogos.push(ordenados.join(" "));

  if (jogos.length < 5) {
    jogoAtual++;
    document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
    // prepara nova grade para o próximo jogo (sem recriar o botão gerar)
    gerarNumerosGrid();
  } else {
    // todos os 5 jogos preenchidos -> mostrar resumo + botão Confirmar posicionado abaixo
    btnProximo.style.display = "none";
    btnEnviar.disabled = true; // mantemos o botão do form desabilitado; usaremos botão próprio abaixo
    mostrarResumoComBotaoConfirmar();
  }
};

// mostra resumo e adiciona botão de confirmação abaixo (dentro #mensagem)
function mostrarResumoComBotaoConfirmar() {
  const container = document.getElementById("mensagem");
  container.innerHTML = `
    <div style="text-align:center;">
      <h3>Resumo dos Jogos</h3>
      <div id="listaJogosResumo" style="margin-bottom:12px;"></div>
      <label style="display:block;margin-bottom:10px;"><input type="checkbox" id="termos"> Li e concordo com os termos</label>
      <button id="btnConfirmarFinal" class="primary">Confirmar e Enviar Aposta</button>
    </div>
  `;
  const lista = document.getElementById("listaJogosResumo");
  lista.innerHTML = jogos.map((j,i) => `<p><strong>Jogo ${i+1}:</strong> ${j}</p>`).join("");

  document.getElementById("btnConfirmarFinal").onclick = () => {
    const termos = document.getElementById("termos");
    if (!termos.checked) {
      alert("Você deve aceitar os termos antes de enviar.");
      return;
    }
    // disparar envio (reaproveita lógica de envio do form)
    enviarAposta();
  };
}

// função que efetivamente envia os dados ao Apps Script
async function enviarAposta() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.getElementById("pix").value;
  if (!nome || !telefone) { alert("Nome e telefone são obrigatórios."); return; }

  const payload = { nome, telefone, pix, jogos };
  try {
    const resp = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (json && json.status === "ok") {
      alert("Aposta registrada com sucesso!");
      // limpar estado e redirecionar para consulta (ou onde preferir)
      jogos = [];
      jogoAtual = 1;
      document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
      window.location.href = "consulta.html";
    } else if (json && json.status === "erro") {
      alert("Erro do servidor: " + (json.msg || "Verifique a planilha."));
    } else {
      alert("Resposta inesperada do servidor: " + text);
    }
  } catch (err) {
    alert("Erro ao enviar: " + err.message);
  }
}

// alternativa: manter suporte ao submit do form (não usado quando usamos o botão ConfirmarFinal)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  // não enviar daqui — usamos botão de confirmação final para controlar localização
  // deixar aqui para compatibilidade, caso alguém clique no botão de submit
  enviarAposta();
});

// inicialização
criarGradeECriarBotao();
document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
