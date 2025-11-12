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

  // Exibir PIX se ainda não pago
  if (lastAposta.status === "AGUARDANDO PAGAMENTO") {
    const pixBox = document.createElement("div");
    pixBox.className = "pix-box";
    pixBox.innerHTML = `
      <p>Chave PIX para pagamento:</p>
      <span class="pix-key">${PIX_KEY}</span>
      <button id="btnCopiarPix">Copiar</button>
    `;
    jogosDiv.after(pixBox);

    document.getElementById("btnCopiarPix").addEventListener("click", () => {
      navigator.clipboard.writeText(PIX_KEY);
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

// ===== Atualiza o status visualmente =====
function atualizarStatusVisual(status) {
  statusSpan.textContent = status;
  statusSpan.className = "status " + (status === "PAGO" ? "pago" : "aguardando");
}

// ===== Atualizar status manualmente =====
btnAtualizar.addEventListener("click", async () => {
  statusSpan.textContent = "Atualizando...";
  statusSpan.className = "status aguardando";
  btnAtualizar.disabled = true;
  btnAtualizar.textContent = "Verificando...";

  try {
    // 🔧 Correção principal: action=getStatus
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec?action=getStatus&protocolo=${encodeURIComponent(lastAposta.protocolo)}`
    );
    const data = await response.json();

    if (data && data.status) {
      atualizarStatusVisual(data.status);
      lastAposta.status = data.status;
      localStorage.setItem("lastAposta", JSON.stringify(lastAposta));
    } else {
      statusSpan.textContent = "Erro ao atualizar status.";
    }
  } catch (err) {
    console.error(err);
    statusSpan.textContent = "Falha na conexão com o servidor.";
  } finally {
    btnAtualizar.disabled = false;
    btnAtualizar.textContent = "Atualizar";
  }
});

// ===== GERAR PDF DO COMPROVANTE =====
document.getElementById("baixarPDF").addEventListener("click", () => {
  if (!lastAposta) {
    alert("Nenhuma aposta encontrada para gerar o comprovante.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text("Comprovante Oficial do Bolão - Mega da Virada", 105, 15, { align: "center" });

  // Dados principais
  doc.setFontSize(12);
  doc.text(`Nome: ${lastAposta.nome}`, 20, 35);
  doc.text(`Telefone: ${lastAposta.telefone}`, 20, 45);
  doc.text(`Protocolo: ${lastAposta.protocolo}`, 20, 55);
  doc.text(`Data/Hora: ${lastAposta.dataHora}`, 20, 65);

  // Status
  doc.setFontSize(12);
  const statusColor = lastAposta.status === "PAGO" ? [0, 150, 0] : [200, 0, 0];
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${lastAposta.status}`, 20, 75);
  doc.setTextColor(0, 0, 0);

  // Título dos jogos
  doc.setFontSize(13);
  doc.text("Jogos Selecionados:", 20, 90);

  // Lista de jogos
  doc.setFontSize(12);
  let y = 100;
  lastAposta.jogos.forEach((j, i) => {
    doc.text(`Jogo ${i + 1}: ${j}`, 25, y);
    y += 10;
  });

  // PIX se ainda não pago
  if (lastAposta.status === "AGUARDANDO PAGAMENTO") {
    y += 10;
    doc.setFontSize(13);
    doc.text("Chave PIX para pagamento:", 20, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(PIX_KEY, 20, y);
  }

  // Rodapé
  y += 20;
  doc.setFontSize(10);
  doc.text("Guarde este comprovante e o número de protocolo para futuras consultas.", 20, y);
  doc.text("Página gerada automaticamente.", 20, y + 8);

  // Nome do arquivo
  const nomeArquivo = `Comprovante_${lastAposta.protocolo}.pdf`;
  doc.save(nomeArquivo);
});
