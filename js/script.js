const totalJogos = 5;
let jogoAtual = 1;
let jogos = [];
let numerosSelecionados = [];

const numerosContainer = document.getElementById("numeros");
const tituloJogo = document.getElementById("titulo-jogo");
const btnProximo = document.getElementById("btn-proximo");

// gerar grade de números
for (let i = 1; i <= 60; i++) {
  const btn = document.createElement("button");
  btn.textContent = i.toString().padStart(2, '0');
  btn.classList.add("numero");
  btn.onclick = () => selecionarNumero(btn, i);
  numerosContainer.appendChild(btn);
}

function selecionarNumero(btn, numero) {
  if (numerosSelecionados.includes(numero)) {
    numerosSelecionados = numerosSelecionados.filter(n => n !== numero);
    btn.classList.remove("selecionado");
  } else if (numerosSelecionados.length < 6) {
    numerosSelecionados.push(numero);
    btn.classList.add("selecionado");
  }
}

btnProximo.onclick = () => {
  if (numerosSelecionados.length !== 6) {
    alert("Selecione 6 números para este jogo.");
    return;
  }
  jogos.push(numerosSelecionados.sort((a,b)=>a-b).join(' '));
  numerosSelecionados = [];
  document.querySelectorAll(".numero").forEach(b => b.classList.remove("selecionado"));

  if (jogoAtual < totalJogos) {
    jogoAtual++;
    tituloJogo.textContent = `Jogo ${jogoAtual} de 5`;
  } else {
    salvarDados();
  }
};

function salvarDados() {
  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const pix = document.querySelector('input[name="pix"]:checked')?.value || "Não informado";

  if (!nome || !telefone) {
    alert("Preencha seu nome e telefone!");
    return;
  }

  const dados = { nome, telefone, pix, jogos };
  fetch(https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec, {
    method: "POST",
    body: JSON.stringify(dados)
  })
  .then(() => {
    localStorage.setItem("dadosBolao", JSON.stringify(dados));
    window.location.href = "confirmacao.html";
  })
  .catch(() => alert("Erro ao enviar, tente novamente."));
}


