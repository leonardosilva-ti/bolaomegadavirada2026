// js/comprovante.js

document.addEventListener("DOMContentLoaded", () => {
    // ⚠️ A URL DO SEU SCRIPT DEVE SER ATUALIZADA AQUI!
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
    const PIX_KEY = "88f77025-40bc-4364-9b64-02ad88443cc4";

    const dadosDiv = document.getElementById("dadosComprovante");
    const jogosDiv = document.getElementById("jogosComprovante");
    const statusSpan = document.getElementById("statusAposta");
    const btnAtualizar = document.getElementById("btnAtualizarStatus");
    const btnBaixarPDF = document.getElementById("baixarPDF");

    // 1. Pega o protocolo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const protocolo = urlParams.get('protocolo');
    
    // Variável global para armazenar os dados carregados
    let apostaData = null; 

    if (!protocolo) {
        dadosDiv.innerHTML = "<p style='color:red; text-align:center;'>Protocolo não encontrado na URL.</p>";
        // Desabilita os botões se não houver protocolo
        btnAtualizar.style.display = 'none';
        btnBaixarPDF.style.display = 'none';
        return;
    }

    // Função principal para buscar e renderizar os dados
    async function carregarComprovante(protocolo) {
        dadosDiv.innerHTML = "<p style='text-align:center; color:#555;'>Carregando dados do comprovante...</p>";
        jogosDiv.innerHTML = "";
        statusSpan.textContent = "Buscando...";
        statusSpan.className = "status aguardando";
        btnAtualizar.disabled = true;

        try {
            // Usa a rota getComprovante que retorna todos os dados
            const response = await fetch(`${SCRIPT_URL}?action=getComprovante&protocolo=${encodeURIComponent(protocolo)}`);
            const data = await response.json();

            if (data.success && data.participante) {
                // Monta o objeto apostaData com base nos dados do servidor
                apostaData = {
                    nome: data.participante.Nome || 'N/A',
                    telefone: data.participante.Telefone || 'N/A',
                    protocolo: data.participante.Protocolo,
                    
                    // 🚀 CORREÇÃO APLICADA AQUI: Mudança para 'DataHora' 
                    // e tratamento para garantir que o valor seja uma string formatada
                    dataHora: (data.participante.DataHora instanceof Date 
                                ? data.participante.DataHora.toLocaleString("pt-BR") 
                                : data.participante.DataHora) || 'N/A',
                    
                    status: data.participante.Status,
                    jogos: data.participante.Jogos ? data.participante.Jogos.split('|').filter(j => j.trim() !== '') : []
                };

                // --- 2. Renderizar Dados na Tela ---
                renderizarComprovante(apostaData);

            } else {
                dadosDiv.innerHTML = `<p style='color:red; text-align:center;'>${data.message || 'Protocolo não encontrado.'}</p>`;
                btnAtualizar.style.display = 'none';
                btnBaixarPDF.style.display = 'none';
            }
        } catch (err) {
            console.error("Erro ao carregar comprovante:", err);
            dadosDiv.innerHTML = `<p style='color:red; text-align:center;'>Falha na conexão com o servidor. Verifique o Protocolo.</p>`;
            btnAtualizar.style.display = 'none';
            btnBaixarPDF.style.display = 'none';
        } finally {
            btnAtualizar.disabled = false;
        }
    }

    // --- FUNÇÃO DE RENDERIZAÇÃO NA TELA ---
    function renderizarComprovante(aposta) {
        dadosDiv.innerHTML = `
          <p><b>Nome:</b> ${aposta.nome}</p>
          <p><b>Telefone:</b> ${aposta.telefone}</p>
          <p><b>Protocolo:</b> ${aposta.protocolo}</p>
          <p><b>Data/Hora:</b> ${aposta.dataHora}</p>
        `;

        jogosDiv.innerHTML = `
          <h3>Jogos Selecionados</h3>
          ${aposta.jogos.map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`).join("")}
        `;

        atualizarStatusVisual(aposta.status);
        
        // Remove PIX box existente, se houver
        document.querySelector('.pix-box')?.remove();

        // Exibir PIX se ainda não pago
        if (aposta.status === "AGUARDANDO PAGAMENTO") {
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

    // ===== Atualizar status manualmente (Botão) =====
    btnAtualizar.addEventListener("click", async () => {
        if (!apostaData) return;
        
        statusSpan.textContent = "Atualizando...";
        statusSpan.className = "status aguardando";
        btnAtualizar.disabled = true;
        btnAtualizar.textContent = "Verificando...";

        try {
            // Usa a rota getStatus, que é mais leve, para a atualização
            const response = await fetch(
              `${SCRIPT_URL}?action=getStatus&protocolo=${encodeURIComponent(apostaData.protocolo)}`
            );
            const data = await response.json();

            if (data && data.status) {
                apostaData.status = data.status; // Atualiza a variável global
                atualizarStatusVisual(data.status);
                
                // Re-renderiza para mostrar/esconder o PIX se o status mudou para PAGO
                renderizarComprovante(apostaData); 
            } else {
                statusSpan.textContent = "Erro ao atualizar status.";
            }
        } catch (err) {
            console.error(err);
            statusSpan.textContent = "Falha na conexão.";
        } finally {
            btnAtualizar.disabled = false;
            btnAtualizar.textContent = "Atualizar";
        }
    });

    // ===== GERAR PDF DO COMPROVANTE (Com dados da variável global) =====
    btnBaixarPDF.addEventListener("click", () => {
        if (!apostaData) {
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
        doc.text(`Nome: ${apostaData.nome}`, 20, 35);
        doc.text(`Telefone: ${apostaData.telefone}`, 20, 45);
        doc.text(`Protocolo: ${apostaData.protocolo}`, 20, 55);
        doc.text(`Data/Hora: ${apostaData.dataHora}`, 20, 65);

        // Status
        doc.setFontSize(12);
        const statusColor = apostaData.status === "PAGO" ? [0, 150, 0] : [200, 0, 0];
        doc.setTextColor(...statusColor);
        doc.text(`Status: ${apostaData.status}`, 20, 75);
        doc.setTextColor(0, 0, 0);

        // Título dos jogos
        doc.setFontSize(13);
        doc.text("Jogos Selecionados:", 20, 90);

        // Lista de jogos
        doc.setFontSize(12);
        let y = 100;
        apostaData.jogos.forEach((j, i) => {
            doc.text(`Jogo ${i + 1}: ${j}`, 25, y);
            y += 10;
        });

        // PIX se ainda não pago
        if (apostaData.status === "AGUARDANDO PAGAMENTO") {
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
        const nomeArquivo = `Comprovante_${apostaData.protocolo}.pdf`;
        doc.save(nomeArquivo);
    });
    
    // Inicia o carregamento dos dados
    carregarComprovante(protocolo);
});
