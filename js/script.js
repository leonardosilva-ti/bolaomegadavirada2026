const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("proximo");
const btnGerar = document.getElementById("gerarAleatorios");
const btnAnterior = document.getElementById("anterior");
const form = document.getElementById("cadastroForm");
const msg = document.getElementById("mensagem");

let jogoAtual = 1;
let jogos = [[], [], [], [], []]; // 5 jogos

// === GERA BOTÕES DE 1 A 60 ===
function gerarNumeros() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = i.toString().padStart(2, "0");
    if (jogos[jogoAtual - 1].includes(btn.textContent)) btn.classList.add("selected");
    btn.onclick = () => selecionarNumero(btn);
    numerosContainer.appendChild(btn);
  }
  atualizarInterface();
}

// === SELECIONA / DESMARCA NÚMERO ===
function selecionarNumero(btn) {
  const numero = btn.textContent;
  const selecionados = jogos[jogoAtual - 1];
  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected");
    jogos[jogoAtual - 1] = selecionados.filter(n => n !== numero);
  } else {
    if (selecionados.length >= 6) return; // bloqueia mais de 6
    btn.classList.add("selected");
    selecionados.push(numero);
  }
  atualizarInterface();
}

// === ATUALIZA BOTÕES E TÍTULO ===
function atualizarInterface() {
  document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
  btnAnterior.disabled = jogoAtual === 1;
  const selecionados = jogos[jogoAtual - 1].length;
  btnProximo.disabled = selecionados !== 6;
  btnProximo.textContent = jogoAtual === 5 ? "Confirmar" : "Próximo Jogo";
}

// === GERAR NÚMEROS ALEATÓRIOS ===
btnGerar.onclick = () => {
  const selecionados = new Set(jogos[jogoAtual - 1]);
  while (selecionados.size < 6) {
    const n = String(Math.floor(Math.random() * 60 + 1)).padStart(2, "0");
    selecionados.add(n);
  }
  jogos[jogoAtual - 1] = Array.from(selecionados).sort((a, b) => a - b);
  gerarNumeros();
};

// === AVANÇAR / CONFIRMAR ===
btnProximo.onclick = () => {
  if (jogos[jogoAtual - 1].length !== 6) {
    alert("Selecione 6 números antes de continuar.");
    return;
  }
  if (jogoAtual < 5) {
    jogoAtual++;
    gerarNumeros();
  } else {
    finalizarJogos();
  }
};

// === VOLTAR JOGO ===
btnAnterior.onclick = () => {
  if (jogoAtual > 1) {
    jogoAtual--;
    gerarNumeros();
  }
};

// === FINALIZAR JOGOS ===
function finalizarJogos() {
  numerosContainer.innerHTML = "";
  document.querySelector(".controles").style.display = "none";

  msg.innerHTML = `
    <h3>Confirme suas apostas</h3>
    ${jogos.map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j.join(" ")}</p>`).join("")}
    <label><input type="checkbox" id="termos"> Li e concordo com os termos</label><br>
    <button type="submit" id="confirmar" class="primary">Confirmar e Enviar</button>
  `;
}

// === ENVIO FINAL ===
form.onsubmit = async (e) => {
  e.preventDefault();
  const termos = document.getElementById("termos");
  if (!termos?.checked) return alert("Você deve aceitar os termos antes de enviar.");

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.getElementById("pix").value;

  const payload = { nome, telefone, pix, jogos: jogos.map(j => j.join(" ")) };
  localStorage.setItem("pendingAposta", JSON.stringify(payload));
  window.location.href = "confirmacao.html";
};

// === INICIAR ===
gerarNumeros();
