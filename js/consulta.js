document.addEventListener("DOMContentLoaded", () => {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
  const chavePix = "88f77025-40bc-4364-9b64-02ad88443cc4";

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
      const [resParticipante, resGeral] = await Promise.all([
        fetch(`${SCRIPT_URL}?action=getComprovante&protocolo=${protocolo}`).then((r) => r.json()),
        fetch(`${SCRIPT_URL}?action=consultarBolao`).then((r) => r.json()),
      ]);

      if (!resParticipante.success) {
        resultadoDiv.innerHTML = `<p class="center" style="color:red">${
          resParticipante.message || "Protocolo não encontrado."
        }</p>`;
        return;
      }

      const participante = resParticipante.participante;
      const dadosGerais = resGeral || {};
      const todosJogos = dadosGerais.todosJogos || [];

      /* ======= ESTATÍSTICAS ======= */
      let html = `
        <h3 class="center" style="margin-top:20px;">Estatísticas do Bolão</h3>
        <div class="card">
          <p><strong>Participantes:</strong> ${dadosGerais.totalParticipantes || "-"}</p>
          <p><strong>Total de Jogos:</strong> ${dadosGerais.totalJogos || "-"}</p>
        </div>
      `;

      /* ======= JOGO DA SORTE ======= */
      if (dadosGerais.jogoDaSorte?.trim()) {
        const sorteHtml = dadosGerais.jogoDaSorte
          .split(" ")
          .map((n) => `<span>${n}</span>`)
          .join("");
        html += `
          <div class="jogo-sorte-container">
            <h3>Jogo da Sorte (9 Números)</h3>
            <div class="jogo-sorte-numeros">${sorteHtml}</div>
          </div>
        `;
      }

      /* ======= DADOS DO PARTICIPANTE ======= */
      const statusPago = participante.Status === "PAGO";
      const statusCor = statusPago ? "green" : "red";
      const statusTxt = statusPago ? "Pago" : "Aguardando Pagamento";

      html += `
        <h3 class="center" style="margin-top:20px;">Seus Dados e Jogos</h3>
        <div class="card">
          <p><strong>Nome:</strong> ${participante.Nome}</p>
          <p><strong>Telefone:</strong> ${participante.Telefone}</p>
          <p><strong>Protocolo:</strong> ${participante.Protocolo}</p>
          <p><strong>Status:</strong> <span style="color:${statusCor}">${statusTxt}</span></p>
          ${
            !statusPago
              ? `
            <div class="pix-box">
              <label><strong>Chave PIX para pagamento:</strong></label>
              <div id="pix-chave">${chavePix}</div>
              <button id="btnCopiarPix" class="btn-copiar">Copiar</button>
              <p class="pix-info">Use esta chave para realizar o pagamento da sua aposta.</p>
            </div>`
              : ""
          }
          <hr style="margin:10px 0;">
          ${participante.Jogos.split("|")
            .filter(Boolean)
            .map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`)
            .join("")}
          <div class="bottom-buttons">
            <button onclick="window.location.href='comprovante.html?protocolo=${protocolo}'">
              Baixar Comprovante
            </button>
          </div>
        </div>
      `;

      /* ======= TODOS OS JOGOS DO BOLÃO ======= */
      if (todosJogos.length > 0) {
        html += `
          <div class="jogos-bolao-container">
            <h3>Todos os Jogos do Bolão</h3>
            <div class="jogos-grid">
              ${todosJogos
                .map(
                  (j) => `
                <div class="jogo-card">
                  ${j
                    .split(" ")
                    .map((num) => `<span>${num}</span>`)
                    .join("")}
                </div>`
                )
                .join("")}
            </div>
          </div>
        `;
      }

      resultadoDiv.innerHTML = html;

      /* ======= BOTÃO COPIAR PIX ======= */
      const btnPix = document.getElementById("btnCopiarPix");
      if (btnPix) {
        btnPix.onclick = () => {
          const chave = document.getElementById("pix-chave").textContent.trim();
          navigator.clipboard.writeText(chave).then(() => {
            btnPix.textContent = "Copiado!";
            setTimeout(() => (btnPix.textContent = "Copiar"), 2000);
          });
        };
      }
    } catch (err) {
      resultadoDiv.innerHTML = `<p class="center" style="color:red">Erro: ${err.message}</p>`;
    }
  });
});
