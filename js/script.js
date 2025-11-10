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
  fetch("https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec", {
    method: "POST",
    body: JSON.stringify(dados)
  })
  .then(() => {
    localStorage.setItem("dadosBolao", JSON.stringify(dados));
    window.location.href = "confirmacao.html";
  })
  .catch(() => alert("Erro ao enviar, tente novamente."));
}

// 🔹 Ver Jogos Registrados
document.getElementById("btnVerJogos").onclick = async () => {
  const nome = document.getElementById("verNome").value.trim().toLowerCase();
  const ultimos = document.getElementById("verTelefone").value.trim();

  if (!nome || !ultimos) {
    alert("Informe o primeiro nome e os últimos 4 dígitos do telefone.");
    return;
  }

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec?action=get");
    const dados = await res.json();

    // valida se o nome e ultimos 4 dígitos correspondem a algum participante
    const autorizado = dados.some(d =>
      d.nome.toLowerCase().includes(nome) &&
      String(d.telefone).endsWith(ultimos)
    );

    if (!autorizado) {
      alert("Não foi possível validar seus dados. Verifique e tente novamente.");
      return;
    }

    // mostra apenas os jogos, sem dados pessoais
    const todosJogos = dados.flatMap(d => d.jogos.filter(Boolean));
    const div = document.getElementById("lista-jogos");
    div.innerHTML = "<h3>Todos os jogos registrados até agora:</h3>" +
      todosJogos.map((jogo, i) =>
        `<p><strong>Jogo ${String(i + 1).padStart(2, "0")}:</strong> ${jogo}</p>`
      ).join("");
  } catch (err) {
    alert("Erro ao carregar jogos. Tente novamente mais tarde.");
  }
};



