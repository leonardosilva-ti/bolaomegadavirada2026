// js/confirmacao.js

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const aposta = JSON.parse(localStorage.getItem("pendingAposta"));
const dadosDiv = document.getElementById("dadosConfirmacao");
const jogosDiv = document.getElementById("jogosConfirmacao");
const mensagem = document.getElementById("mensagem");
const termosCheckbox = document.getElementById("aceitoTermos");
const btnConfirmar = document.getElementById("btnConfirmar");

if (!aposta) {
  dadosDiv.innerHTML = "<p style='color:red'>Nenhuma aposta pendente encontrada. Retorne à página principal.</p>";
  btnConfirmar.disabled = true;
} else {
  dadosDiv.innerHTML = `
    <p><b>Nome Completo:</b> ${aposta.nome}</p>
    <p><b>Telefone (WhatsApp):</b> ${aposta.telefone}</p>
  `;
  jogosDiv.innerHTML = `
    <h3>Jogos Selecionados</h3>
    ${aposta.jogos.map((jogo, i) => `<p><b>Jogo ${i + 1}:</b> ${jogo}</p>`).join("")}
  `;
}

termosCheckbox.addEventListener("change", () => {
  btnConfirmar.disabled = !termosCheckbox.checked;
});

document.getElementById("btnVoltar").addEventListener("click", () => {
  window.location.href = "index.html";
});

btnConfirmar.addEventListener("click", async () => {
  if (!termosCheckbox.checked) {
    mensagem.textContent = "Você deve aceitar os termos antes de confirmar.";
    mensagem.style.color = "red";
    return;
  }

  mensagem.textContent = "Enviando e registrando aposta...";
  mensagem.style.color = "blue";
  btnConfirmar.disabled = true;

  const protocolo = gerarProtocolo();
  const dataHora = new Date().toLocaleString("pt-BR");

  const apostaCompleta = {
    ...aposta,
    dataHora,
    protocolo,
    status: "AGUARDANDO PAGAMENTO"
  };

  try {
    const formData = new FormData();
    formData.append("action", "registrarAposta");
    formData.append("nome", apostaCompleta.nome);
    formData.append("telefone", (apostaCompleta.telefone || "").replace(/\D/g, ""));
    formData.append("protocolo", apostaCompleta.protocolo);
    formData.append("dataHora", apostaCompleta.dataHora);
    formData.append("status", apostaCompleta.status);
    apostaCompleta.jogos.forEach((jogo, i) => formData.append(`jogo${i + 1}`, jogo));

    const response = await fetch(SCRIPT_URL, { method: "POST", body: formData });
    const texto = await response.text();

    if (response.ok && texto.includes("Sucesso")) {
      localStorage.setItem("lastAposta", JSON.stringify(apostaCompleta));
      localStorage.removeItem("pendingAposta");
      window.location.href = "comprovante.html";
    } else {
      mensagem.textContent = "Erro ao enviar: " + texto;
      mensagem.style.color = "red";
      btnConfirmar.disabled = false;
    }
  } catch (err) {
    mensagem.textContent = "Erro ao enviar: " + err.message;
    mensagem.style.color = "red";
    btnConfirmar.disabled = false;
  }
});

function gerarProtocolo() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const random = () => Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${random()}`;
}
