// js/comprovante.js

const dadosDiv = document.getElementById("dadosComprovante");
const jogosDiv = document.getElementById("jogosComprovante");
const statusSpan = document.getElementById("statusAposta");
const btnAtualizar = document.getElementById("btnAtualizarStatus");
const PIX_KEY = "88f77025-40bc-4364-9b64-02ad88443cc4";

const lastAposta = JSON.parse(localStorage.getItem("lastAposta"));

if (!lastAposta) {
  dadosDiv.innerHTML = "<p style='color:red'>Nenhuma aposta encontrada.</p>";
} else {
  // Exibir dados da aposta
  dadosDiv.innerHTML = `
    <p><b>Nome:</b> ${lastAposta.nome}</p>
    <p><b>Telefone:</b> ${lastAposta.telefone}</p>
    <p><b>Protocolo:</b> ${lastAposta.protocolo}</p>
    <p><b>Data/Hora:</b> ${lastAposta.dataHora}</p>
  `;

  // Exibir jogos
  jogosDiv.innerHTML = `
    <h3>Jogos Selecionados</h3>
    ${lastAposta.jogos.map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`).join("")}
  `;

  // Status inicial
  atualizarStatusVisual(lastAposta.status);

  // Exibir bloco PIX se ainda não pago
  if (lastAposta.status === "AGUARDANDO PAGAMENTO") {
    const pixBox = document.createElement("div");
    pixBox.className = "pix-box";
    pixBox.innerHTML = `
      <p>Chave PIX para pagamento:</p>
      <span class="pix-key">88f77025-40bc-4364-9b64-02ad88443cc4</span>
      <button id="btnCopiarPix">Copiar</button>
    `;
    jogosDiv.after(pixBox);

    // Copiar PIX
    document.getElementById("btnCopiarPix").addEventListener("click", () => {
      navigator.clipboard.writeText("88f77025-40bc-4364-9b64-02ad88443cc4");
      const btn = document.getElementById("btnCopiarPix");
      btn.textContent = "Copiado!";
      btn.style.background = "#16a34a";
      setTimeout(() => {
        btn.textContent = "Copiar";
        btn.style.background = "";
      }, 2000);
    });
  }
}

// ===== Função para atualizar o status visualmente =====
function atualizarStatusVisual(status) {
  statusSpan.textContent = status;
  statusSpan.className = "status " + (status === "PAGO" ? "pago" : "aguardando");
}

// ===== Atualizar status manualmente =====
btnAtualizar.addEventListener("click", async () => {
  statusSpan.textContent = "Atualizando...";
  statusSpan.className = "status aguardando";
  btnAtualizar.disabled = true;

  try {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec?action=consultarStatus&protocolo=${lastAposta.protocolo}`);
    const data = await response.json();

    if (data && data.status) {
      atualizarStatusVisual(data.status);
      lastAposta.status = data.status;
      localStorage.setItem("lastAposta", JSON.stringify(lastAposta));
    } else {
      statusSpan.textContent = "Erro ao atualizar status.";
      statusSpan.className = "status aguardando";
    }
  } catch (err) {
    statusSpan.textContent = "Falha na conexão.";
    statusSpan.className = "status aguardando";
  } finally {
    btnAtualizar.disabled = false;
  }
});
