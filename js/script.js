const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("proximo");
const btnEnviar = document.getElementById("enviar");
const btnGerar = document.getElementById("gerarAleatorios");
const form = document.getElementById("cadastroForm");
const msg = document.getElementById("mensagem");

// Novo botão "Jogo Anterior"
let btnAnterior;

let jogoAtual = 1;
let jogos = [];

function gerarNumeros() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
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

  // Estado dos botões
  btnProximo.disabled = selecionados !== 6;

  // Jogo Anterior - cinza no 1º jogo, azul nos outros
  if (jogoAtual === 1) {
    btnAnterior.className = "muted";
    btnAnterior.disabled = true;
  } else {
    btnAnterior.className = "primary";
    btnAnterior.disabled = false;
  }

  // Próximo/Confirmar
  if (jogoAtual < 5) {
    btnProximo.textContent = "Próximo Jogo";
    btnProximo.className = selecionados === 6 ? "primary" : "muted";
  } else {
    btnProximo.textContent = "Confirmar";
    btnProximo.className = "primary";
    btnProximo.disabled = false;
  }
}

btnGerar.onclick = () => {
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

function salvarJogoAtual() {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.textContent);
  jogos[jogoAtual - 1] = selecionados.join(" ");
}

function restaurarJogo() {
  gerarNumeros();
  const numeros = jogos[jogoAtual - 1]?.split(" ") || [];
  const botoes = Array.from(numerosContainer.querySelectorAll("button"));
  numeros.forEach(n => {
    const btn = botoes.find(b => b.textContent === n);
    if (btn) btn.classList.add("selected");
  });
  atualizarBotoes();
}

// Função para avançar de jogo
btnProximo.onclick = () => {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.textContent);

  if (selecionados.length < 6) {
    const faltam = 6 - selecionados.length;
    const confirmar = confirm(`Faltam ${faltam} números. Deseja preencher aleatoriamente?`);
    if (confirmar) {
      const botoes = Array.from(numerosContainer.querySelectorAll("button"));
      const escolhidos = new Set(selecionados);
      while (escolhidos.size < 6) {
        const n = String(Math.floor(Math.random() * 60 + 1)).padStart(2, "0");
        if (!escolhidos.has(n)) {
          const btn = botoes.find(b => b.textContent === n);
          if (btn) btn.classList.add("selected");
          escolhidos.add(n);
        }
      }
    } else {
      return; // aguarda completar manualmente
    }
  }

  salvarJogoAtual();

  if (jogoAtual < 5) {
    jogoAtual++;
    document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
    restaurarJogo();
  } else {
    finalizarJogos();
  }
};

// Criar o botão "Jogo Anterior" apenas uma vez, após o DOM estar pronto
window.addEventListener("DOMContentLoaded", () => {
  const controles = document.querySelector(".controles");
  if (!document.getElementById("btnAnterior")) {
    btnAnterior = document.createElement("button");
    btnAnterior.id = "btnAnterior";
    btnAnterior.type = "button";
    btnAnterior.textContent = "Jogo Anterior";
    btnAnterior.className = "muted";
    btnAnterior.disabled = true;
    controles.insertBefore(btnAnterior, btnGerar);

    btnAnterior.onclick = () => {
      if (jogoAtual > 1) {
        salvarJogoAtual();
        jogoAtual--;
        document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
        restaurarJogo();
      }
    };
  }
});



function finalizarJogos() {
  // Validação de duplicados
  const duplicado = jogos.some((j, idx) => jogos.indexOf(j) !== idx);
  if (duplicado) {
    alert("Você escolheu o mesmo conjunto de 6 números em mais de um jogo. Altere antes de confirmar.");
    return;
  }

  numerosContainer.innerHTML = "";
  btnGerar.style.display = "none";
  btnProximo.style.display = "none";
  btnAnterior.style.display = "none";
  btnEnviar.disabled = false;

  msg.innerHTML = `
    <h3>Confirme suas apostas</h3>
    ${jogos.map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`).join("")}
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


