// =========================================
// 🧩 admin.js
// =========================================

// URL do Web App do Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

let accessToken = localStorage.getItem("accessToken") || "";
let jogoSorteAtual = [];

function el(id) {
  return document.getElementById(id);
}

// =========================================
// 🔐 LOGIN
// =========================================
async function fazerLogin() {
  const user = el("user").value.trim();
  const pass = el("pass").value.trim();

  if (!user || !pass) {
    alert("Informe usuário e senha");
    return;
  }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "checkLogin",
        user,
        pass
      })
    });

    const data = await res.json();
    if (data.success && data.accessToken) {
      accessToken = data.accessToken;
      localStorage.setItem("accessToken", accessToken);
      alert(data.message);
      carregarParticipantes();
      mostrarSecaoAdmin(true);
    } else {
      alert(data.message || "Erro no login.");
    }
  } catch (err) {
    alert("Erro de conexão: " + err.message);
  }
}

// =========================================
// 🚪 LOGOUT
// =========================================
function fazerLogout() {
  localStorage.removeItem("accessToken");
  accessToken = "";
  mostrarSecaoAdmin(false);
}

// =========================================
// 👥 PARTICIPANTES
// =========================================
async function carregarParticipantes() {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "listarParticipantes",
        accessToken
      })
    });
    const data = await res.json();

    if (data.success) {
      const div = el("listaParticipantes");
      div.innerHTML = "";
      data.participantes.forEach(p => {
        const item = document.createElement("div");
        item.textContent = `${p.Nome || ""} - ${p.Telefone || ""} - ${p["Números da Sorte"] || ""}`;
        div.appendChild(item);
      });
    } else {
      alert(data.message || "Erro ao listar participantes.");
      if (data.message.includes("Token")) fazerLogout();
    }
  } catch (err) {
    alert("Erro: " + err.message);
  }
}

// =========================================
// 🎲 JOGO DA SORTE
// =========================================

// Salvar novo jogo da sorte
el("btnSalvarJogoSorte")?.addEventListener("click", async () => {
  const numeros = [];
  for (let i = 1; i <= 9; i++) {
    const valor = el(`num${i}`).value.trim();
    if (!valor) {
      alert(`Preencha o número ${i}`);
      return;
    }
    numeros.push(valor);
  }

  const numerosUnicos = new Set(numeros);
  if (numerosUnicos.size < 9) {
    alert("Os números devem ser diferentes!");
    return;
  }

  const jogoFormatado = Array.from(numerosUnicos).map(n => n.padStart(2, '0')).join(" ");

  try {
    const body = new URLSearchParams({
      action: "salvarJogoSorte",
      jogo: jogoFormatado,
      accessToken: accessToken || ""
    });
    const res = await fetch(SCRIPT_URL, { method: "POST", body });
    const data = await res.json();

    if (data.success) {
      alert(data.message || "Jogo da Sorte salvo!");
    } else {
      alert("Falha ao salvar Jogo da Sorte: " + (data.message || data.error || "Erro desconhecido."));
      if (data.message && data.message.includes("Token")) fazerLogout();
    }

    carregarParticipantes();
  } catch (err) {
    alert("Erro ao salvar Jogo da Sorte: " + err.message);
  }
});

// Apagar jogo da sorte
el("btnApagarJogoSorte")?.addEventListener("click", async () => {
  if (!confirm("Deseja realmente apagar todos os números do Jogo da Sorte?")) return;

  try {
    const body = new URLSearchParams({
      action: "salvarJogoSorte",
      jogo: "",
      accessToken: accessToken || ""
    });
    const res = await fetch(SCRIPT_URL, { method: "POST", body });
    const data = await res.json();

    if (data.success) {
      alert(data.message || "Jogo da Sorte apagado!");
      jogoSorteAtual = [];
      renderizarJogoSorte();
      renderizarInputs();
    } else {
      alert("Falha ao apagar Jogo da Sorte: " + (data.message || data.error || "Erro desconhecido."));
      if (data.message && data.message.includes("Token")) fazerLogout();
    }

  } catch (err) {
    alert("Erro ao apagar Jogo da Sorte: " + err.message);
  }
});

// =========================================
// 🧱 INTERFACE
// =========================================
function mostrarSecaoAdmin(logado) {
  el("loginContainer").style.display = logado ? "none" : "block";
  el("adminContainer").style.display = logado ? "block" : "none";
}

function renderizarJogoSorte() {
  const div = el("jogoSorte");
  div.innerHTML = jogoSorteAtual.map(n => `<span class="num">${n}</span>`).join(" ");
}

function renderizarInputs() {
  const container = el("inputsJogoSorte");
  container.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const input = document.createElement("input");
    input.id = `num${i}`;
    input.type = "number";
    input.min = "1";
    input.max = "99";
    input.placeholder = `Nº ${i}`;
    input.classList.add("numInput");
    container.appendChild(input);
  }
}

// =========================================
// 🚀 INICIALIZAÇÃO
// =========================================
window.addEventListener("DOMContentLoaded", () => {
  renderizarInputs();
  if (accessToken) {
    mostrarSecaoAdmin(true);
    carregarParticipantes();
  }
});
