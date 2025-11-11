const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("proximo");
const btnEnviar = document.getElementById("enviar");
const btnGerar = document.getElementById("gerarAleatorios");
const form = document.getElementById("cadastroForm");
const msg = document.getElementById("mensagem");

let jogoAtual = 1;
let jogos = [];

function gerarNumeros() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button"; // <- IMPORTANTE: evita submit do form
    btn.textContent = i.toString().padStart(2, "0");
    btn.onclick = () => selecionarNumero(btn);
    numerosContainer.appendChild(btn);
  }
  atualizarBotoes();
}


function selecionarNumero(btn) {
  btn.classList.toggle("selected");
  const selecionados = document.querySelectorAll(".numeros-grid button.selected").length;
  if (selecionados > 6) btn.classList.remove("selected");
  atualizarBotoes();
}

function atualizarBotoes() {
  const selecionados = document.querySelectorAll(".numeros-grid button.selected").length;
  btnProximo.disabled = selecionados !== 6;
}

btnGerar.onclick = () => {
  // usar Set para controlar os já selecionados e evitar loop infinito
  const botoes = Array.from(numerosContainer.querySelectorAll("button"));
  const selecionados = new Set(botoes.filter(b => b.classList.contains("selected")).map(b => b.textContent));

  while (selecionados.size < 6) {
    const n = String(Math.floor(Math.random() * 60 + 1)).padStart(2, "0");
    if (!selecionados.has(n)) {
      const btn = botoes.find(b => b.textContent === n);
      if (btn) {
        btn.classList.add("selected");
        selecionados.add(n);
      }
    }
  }
  atualizarBotoes();
};
;

btnProximo.onclick = () => {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.textContent);
  jogos.push(selecionados.join(" "));
  if (jogoAtual < 5) {
    jogoAtual++;
    document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
    gerarNumeros();
  } else {
    finalizarJogos();
  }
};

function finalizarJogos() {
  numerosContainer.innerHTML = "";
  btnGerar.style.display = "none";
  btnProximo.style.display = "none";
  btnEnviar.disabled = false;

  msg.innerHTML = `
    <h3>Confirme suas apostas</h3>
    ${jogos.map((j, i) => `<p><b>Jogo ${i+1}:</b> ${j}</p>`).join("")}
    <label><input type="checkbox" id="termos"> Li e concordo com os termos</label>
  `;
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const termos = document.getElementById("termos");
  if (!termos?.checked) return alert("Você deve aceitar os termos.");

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.getElementById("pix").value;

  const payload = { nome, telefone, pix, jogos };

  localStorage.setItem("pendingAposta", JSON.stringify(payload));
  window.location.href = "confirmacao.html";
};

gerarNumeros();

