// js/comprovante.js

document.addEventListener("DOMContentLoaded", () => {
  const aposta = JSON.parse(localStorage.getItem("lastAposta"));
  const dadosDiv = document.getElementById("dadosComprovante");
  const jogosDiv = document.getElementById("jogosComprovante");
  const pixDiv = document.getElementById("pixComprovante");

  if (!aposta) {
    dadosDiv.innerHTML = `<p style="color:red;">Nenhuma aposta encontrada.</p>`;
    return;
  }

  // === DADOS PRINCIPAIS ===
  dadosDiv.innerHTML = `
    <p><b>Nome:</b> ${aposta.nome || "—"}</p>
    <p><b>Telefone (WhatsApp):</b> ${aposta.telefone || "—"}</p>
    <p><b>Protocolo:</b> ${aposta.protocolo || "—"}</p>
    <p><b>Status:</b> 
      <span style="color:${aposta.status === "PAGO" ? "green" : "red"}; font-weight:600;">
        ${aposta.status}
      </span>
    </p>
    <p><b>Data/Hora:</b> ${aposta.dataHora || new Date().toLocaleString("pt-BR")}</p>
  `;

  // === JOGOS FORMATADOS ===
  const jogosFormatados = Array.isArray(aposta.jogos)
    ? aposta.jogos.map((j, i) => `<div>Jogo ${i + 1}: <b>${j}</b></div>`).join("")
    : `<p style="color:red;">Nenhum jogo encontrado.</p>`;

  jogosDiv.innerHTML = `
    <h3>Jogos Selecionados</h3>
    ${jogosFormatados}
  `;

  // === CHAVE PIX ===
  const chavePix = "sua.chave.pix@exemplo.com"; // 🔁 coloque aqui sua chave real

  if (aposta.status !== "PAGO") {
    pixDiv.innerHTML = `
      <p><b>Chave PIX para pagamento:</b></p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span id="chavePixText" style="font-weight:600;">${chavePix}</span>
        <button id="btnCopiarPix" class="small primary">Copiar</button>
        <a href="https://wa.me/55${aposta.telefone.replace(/\D/g,'')}" target="_blank" class="whatsapp-link">
          Enviar Comprovante no WhatsApp
        </a>
      </div>
      <p style="margin-top:8px;font-size:0.9em;">
        Após o pagamento, envie o comprovante via WhatsApp para confirmação.
      </p>
    `;

    // Botão copiar PIX
    document.getElementById("btnCopiarPix").addEventListener("click", () => {
      navigator.clipboard.writeText(chavePix);
      alert("Chave PIX copiada com sucesso!");
    });
  } else {
    pixDiv.innerHTML = `<p style="color:green;font-weight:600;">Pagamento confirmado ✅</p>`;
  }
});
