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
        
        // --- 1. Busca os dados do PARTICIPANTE específico (traz Nome/Telefone/PIX) ---
        let participante = null;
        try {
            const resParticipante = await fetch(`${SCRIPT_URL}?action=getComprovante&protocolo=${protocolo}`);
            const dataParticipante = await resParticipante.json();
            
            if (dataParticipante.success) {
                participante = dataParticipante.participante;
            } else if (dataParticipante.message) {
                resultadoDiv.innerHTML = `<p class="center" style="color:red">${dataParticipante.message}</p>`;
                return;
            } else {
                 throw new Error("Falha ao buscar dados do participante.");
            }
        } catch (err) {
            resultadoDiv.innerHTML = `<p class="center" style="color:red">Erro ao buscar seu protocolo: ${err.message}</p>`;
            return;
        }

        // --- 2. Busca os dados GERAIS do Bolão (estatísticas e todos os jogos) ---
        let dadosGerais = null;
        try {
            const resGeral = await fetch(`${SCRIPT_URL}?action=consultarBolao`);
            dadosGerais = await resGeral.json();
        } catch (err) {
             // Não impede a exibição, mas loga o erro e usa valores default
             console.error("Erro ao buscar estatísticas gerais:", err.message);
             dadosGerais = { totalParticipantes: "-", totalJogos: "-", todosJogos: [], jogoDaSorte: null };
        }


        // --- 3. Renderiza o HTML (Agora com Nome e Telefone disponíveis em 'participante') ---
        let html = "";
        const totalParticipantes = dadosGerais.totalParticipantes || "-";
        const totalJogos = dadosGerais.totalJogos || "-";
        const todosJogos = dadosGerais.todosJogos || [];

        // --- Estatísticas ---
        html += `
          <h3 class="center" style="margin-top:20px;">Estatísticas do Bolão</h3>
          <div class="stats-grid card">
            <p><strong>Participantes:</strong> ${totalParticipantes}</p>
            <p><strong>Total de Jogos:</strong> ${totalJogos}</p>
          </div>`;

        // --- Jogo da Sorte ---
        if (dadosGerais.jogoDaSorte && dadosGerais.jogoDaSorte.trim() !== "") {
          const sorteNumerosHtml = dadosGerais.jogoDaSorte
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
  ? `
    <div class="pix-box">
      <label>Chave PIX para pagamento:</label>
      <div id="pix-chave">${chavePix}</div>
      <button id="btnCopiarPix" class="btn-copiar">Copiar</button>
      <p class="pix-info">Use esta chave para realizar o pagamento da sua aposta.</p>
    </div>
  `
  : "";


        const jogosParticipante = participante.Jogos
          .split('|')
          .filter(j => j.trim() !== "") // Filtra jogos vazios
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
        if (todosJogos.length > 0) {
          html += `
            <h3 class="text-center" style="margin-top:20px;">Todos os Jogos do Bolão</h3>
            <div class="card jogos-grid" style="font-size: 0.9em;">
              ${todosJogos.map(j => `<div class="jogo-card">${j}</div>`).join('')}
            </div>`;
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
    });
});
