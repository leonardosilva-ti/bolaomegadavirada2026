const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const aposta = JSON.parse(localStorage.getItem("lastAposta"));
const dadosDiv = document.getElementById("dadosComprovante");
const jogosDiv = document.getElementById("jogosComprovante");
const statusEl = document.getElementById("statusAposta");
const btnAtualizarStatus = document.getElementById("btnAtualizarStatus");
const btnBaixarPDF = document.getElementById("baixarPDF");

if (aposta) {
  dadosDiv.innerHTML = `
    <p><b>Nome:</b> ${aposta.Nome}</p>
    <p><b>Protocolo:</b> ${aposta.Protocolo}</p>
    <p><b>Data:</b> ${aposta.Data || new Date().toLocaleDateString()}</p>
  `;

  const jogosFormatados = aposta.Jogos
    .split('|')
    .map((j, i) => `<div>Jogo ${i + 1}: <b>${j}</b></div>`)
    .join('');

  jogosDiv.innerHTML = `<h3>Jogos Escolhidos</h3>${jogosFormatados}`;
  buscarStatus(aposta.Protocolo);
} else {
  dadosDiv.innerHTML = `<p style="color:red;">Nenhuma aposta encontrada.</p>`;
}

async function buscarStatus(protocolo) {
  statusEl.textContent = "Verificando...";
  statusEl.className = "status aguardando";
  btnAtualizarStatus.disabled = true;

  try {
    const res = await fetch(`${SCRIPT_URL}?action=getStatus&protocolo=${protocolo}`);
    const data = await res.json();
    const status = data.status?.toUpperCase() || "AGUARDANDO PAGAMENTO";

    statusEl.textContent = status;
    statusEl.className = `status ${status === "PAGO" ? "pago" : "aguardando"}`;
  } catch (err) {
    statusEl.textContent = "Erro ao buscar status";
    statusEl.className = "status aguardando";
  } finally {
    btnAtualizarStatus.disabled = false;
  }
}

btnAtualizarStatus.addEventListener("click", () => {
  if (aposta?.Protocolo) buscarStatus(aposta.Protocolo);
});

btnBaixarPDF.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.html(document.getElementById("areaComprovante"), {
    callback: function (doc) {
      doc.save(`comprovante_${aposta.Protocolo}.pdf`);
    },
    margin: [10, 10, 10, 10],
    html2canvas: { scale: 0.8 }
  });
});
