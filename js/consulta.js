// --- Lógica da página de consulta de jogos ---

document.addEventListener("DOMContentLoaded", () => {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
  const chavePix = "88f77025-40bc-4364-9b64-02ad88443cc4"; // 👉 substitua pela sua chave real

  const btnConsultar = document.getElementById("btnConsultar");
  const resultadoDiv = document.getElementById("resultado");

  btnConsultar.addEventListener("click", async () => {
    const protocolo = document.getElementById("protocoloInput").value.trim();
    resultadoDiv.innerHTML = `<p class="center" style="color:#555">Buscando...</p>`;

    if (!protocolo) {
      resultadoDiv.innerHTML = `<p class="center" style="color:red">Preencha o número de Protocolo.</p>`;
      return;
    }

    try {
      const res = await fetch(`${SCRIPT_URL}?action=consultarBolao`);
      const data = await res.json();
      const participante = data.participantes.find(p => p.Protocolo === protocolo);

      let html = "";

      if (participante) {
        const totalParticipantes = data.participantes.length;
        const totalJogos = data.participantes.reduce((acc, p) => acc + (p.Jogos.split('|').length), 0);

        // --- Estatísticas ---
        html += `
          <h3 class="center" style="margin-top:20px;">Estatísticas do Bolão</h3>
          <div class="stats-grid card">
            <p><strong>Participantes:</strong> ${totalParticipantes}</p>
            <p><strong>Total de Jogos:</strong> ${totalJogos}</p>
          </div>`;

        // --- Jogo da Sorte ---
        if (data.jogoDaSorte && data.jogoDaSorte.trim() !== "") {
          const sorteNumerosHtml = data.jogoDaSorte
            .split(' ')
            .map(n => `<span>${n}</span>`)
            .join('');
          html += `
            <div class="jogo-sorte-box">
              <strong>Jogo da Sorte (9 Números)</strong><br><br>
              <div class="jogo-sorte-numeros">${sorteNumerosHtml}</div>
            </div>`;
        } else {
          html += `<div class="jogo-sorte-box"><strong>Jogo da Sorte:</strong><br><em>Ainda não cadastrado.</em></div>`;
        }

        // --- Dados do Participante ---
        const statusPago = participante.Status === "PAGO";
        const statusClass = statusPago ? "color:green" : "color:red";
        const statusText = statusPago ? "Pago" : "Aguardando Pagamento";

        const pixInfo = !statusPago
          ? `<div style="margin-top:8px; font-size:0.9em; color:#333;">
               <strong>Chave PIX para pagamento:</strong><br><br>
               <span id="pix-chave" style="user-select:all;">${chavePix}</span>
               <button id="btnCopiarPix" class="small" style="margin-left:8px;">Copiar</button>
             </div>`
          : "";

        const jogosParticipante = participante.Jogos
          .split('|')
          .map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`)
          .join('');

        html += `
          <h3 class="center" style="margin-top:20px;">Seus Dados e Jogos</h3>
          <div class="card">
            <p><strong>Nome:</strong> ${participante.Nome}</p>
            <p><strong>Telefone:</strong> ${participante.Telefone}</p>
            <p><strong>Protocolo:</strong> ${participante.Protocolo}</p>
            <p><strong>Status:</strong> <span style="${statusClass}">${statusText}</span></p>
            ${pixInfo}
            <hr style="margin: 8px 0;">
            ${jogosParticipante}
            <div class="controles" style="margin-top:15px;">
              <button onclick="window.location.href='comprovante.html?protocolo=${protocolo}'" class="primary small">Baixar Comprovante</button>
            </div>
          </div>`;

        // --- Lista de todos os jogos ---
        if (data.todosJogos?.length > 0) {
          html += `
            <h3 class="text-center" style="margin-top:20px;">Todos os Jogos do Bolão</h3>
            <div class="card jogos-grid" style="font-size: 0.9em;">
              ${data.todosJogos.map(j => `<div class="jogo-card">${j}</div>`).join('')}
            </div>`;
        }

      } else {
        html += `<p class="center" style="color:red">Protocolo não encontrado.</p>`;
      }

      resultadoDiv.innerHTML = html;

      // --- Botão copiar PIX ---
      const btnPix = document.getElementById("btnCopiarPix");
      if (btnPix) {
        btnPix.onclick = () => {
          const chave = document.getElementById("pix-chave").textContent.trim();
          navigator.clipboard.writeText(chave).then(() => {
            btnPix.textContent = "Copiado!";
            btnPix.disabled = true;
            setTimeout(() => {
              btnPix.textContent = "Copiar";
              btnPix.disabled = false;
            }, 2000);
          });
        };
      }

    } catch (err) {
      resultadoDiv.innerHTML = `<p class="center" style="color:red">Erro ao buscar dados: ${err.message}</p>`;
    }
  });
});
