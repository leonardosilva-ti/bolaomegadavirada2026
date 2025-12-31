// js/consulta.js - VERSÃO FINAL CORRIGIDA

document.addEventListener("DOMContentLoaded", () => {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

    const btnConsultar = document.getElementById("btnConsultar");
    const resultadoDiv = document.getElementById("resultado");
    const conferenciaConsulta = document.getElementById("conferenciaConsulta");
    const listaConferencia = document.getElementById("listaConferencia");
    const btnConferirSorteio = document.getElementById("btnConferirSorteio");

    const COR_SUCESSO = "#008000"; 
    const COR_STATUS_RED = "#d32f2f"; 

    // Variável global para conferência
    let dadosGlobaisParaConferir = {
        jogoPrincipal: "", 
        jogosParticipante: [],
        jogosAdicionais: []
    };

    // Função auxiliar para transformar string de jogo em array de números limpos
    const formatarJogoParaArray = (str) => {
        if (!str) return [];
        // Regex /[,\s]+/ divide por vírgula OU espaço (trata "01, 02" ou "01 02")
        return str.split(/[,\s]+/).filter(Boolean).map(n => n.padStart(2, '0'));
    };

    btnConsultar.addEventListener("click", async () => {
        const protocolo = document.getElementById("protocoloInput").value.trim();
        resultadoDiv.innerHTML = `<p class="center" style="color:#555">Buscando...</p>`;
        
        conferenciaConsulta.classList.add("hidden");
        listaConferencia.innerHTML = "";

        if (!protocolo) {
            resultadoDiv.innerHTML = `<p class="center" style="color:${COR_STATUS_RED}">Preencha o número de Protocolo.</p>`;
            return;
        }

        try {
            const [resParticipante, resGeral, resJogosAdm] = await Promise.all([
                fetch(`${SCRIPT_URL}?action=getComprovante&protocolo=${protocolo}`).then((r) => r.json()),
                fetch(`${SCRIPT_URL}?action=consultarBolao`).then((r) => r.json()),
                fetch(`${SCRIPT_URL}?action=getJogosAdm`).then((r) => r.json()),
            ]);

            if (!resParticipante.success) {
                resultadoDiv.innerHTML = `<p class="center" style="color:${COR_STATUS_RED}">${resParticipante.message || "Protocolo não encontrado."}</p>`;
                return;
            }

            const participante = resParticipante.participante;
            const dadosGerais = resGeral || {};
            const todosJogos = dadosGerais.todosJogos || []; // Da aba Apostas
            const jogosAdm = resJogosAdm?.jogosAdm || [];    // Da aba Jogos-adm
            
            // --- ARMAZENAR DADOS ---
            dadosGlobaisParaConferir.jogoPrincipal = (dadosGerais.jogoDaSorte || "").trim();
            dadosGlobaisParaConferir.jogosParticipante = participante.Jogos ? participante.Jogos.split("|").filter(Boolean) : [];
            // Unifica todos os jogos que não são do participante específico
            dadosGlobaisParaConferir.jogosAdicionais = [...todosJogos, ...jogosAdm].filter(Boolean);

            conferenciaConsulta.classList.remove("hidden");

            /* ======= HTML ======= */
            let html = ``;

            // 1. Jogo Principal (9 números)
            if (dadosGlobaisParaConferir.jogoPrincipal) {
                const nums = formatarJogoParaArray(dadosGlobaisParaConferir.jogoPrincipal);
                html += `
                    <div class="jogo-sorte-container">
                        <h3>Jogo Principal do Bolão (9 números)</h3>
                        <div class="jogo-sorte-numeros">
                            ${nums.map(n => `<span>${n}</span>`).join("")}
                        </div>
                    </div>
                `;
            }

            // 2. Dados do Participante
            html += `
                <div class="resumo-container">
                    <h3>Sua Aposta</h3>
                    <p><strong>Participante:</strong> ${participante.Nome}</p>
                    <p><strong>Status:</strong> <span style="color:${participante.Status === 'PAGO' ? COR_SUCESSO : COR_STATUS_RED}; font-weight:700;">${participante.Status}</span></p>
                    <hr style="margin:10px 0; border:0; border-top:1px dashed #eee;">
                    <h4>Meus Jogos:</h4>
                    ${dadosGlobaisParaConferir.jogosParticipante.map((j, i) => `<p><b>Jogo ${i + 1}:</b> ${j}</p>`).join("")}
                </div>
            `;

            // 3. Exibição de TODOS os jogos do Bolão
            if (dadosGlobaisParaConferir.jogosAdicionais.length > 0) {
                html += `
                    <div class="jogos-bolao-container">
                        <h3 class="section-title">Todos os Jogos do Bolão</h3>
                        <div class="jogos-grid">
                            ${dadosGlobaisParaConferir.jogosAdicionais.map((jogoStr) => {
                                const nums = formatarJogoParaArray(jogoStr);
                                return `
                                    <div class="jogo-card">
                                        ${nums.map(n => `<span>${n}</span>`).join("")}
                                    </div>`;
                            }).join("")}
                        </div>
                    </div>
                `;
            }

            resultadoDiv.innerHTML = html;

        } catch (err) {
            console.error(err);
            resultadoDiv.innerHTML = `<p class="center">Erro ao carregar dados.</p>`;
        }
    });

    // --- LÓGICA DE CONFERÊNCIA ---
    btnConferirSorteio.addEventListener("click", () => {
        const inputs = document.querySelectorAll(".conf-input");
        const sorteados = Array.from(inputs)
            .map(i => i.value.trim().padStart(2, '0'))
            .filter(v => v !== "00" && v !== "");

        if (sorteados.length !== 6) {
            alert("Preencha os 6 números sorteados.");
            return;
        }

        let totalResultados = [];
        let chavesProcessadas = new Set(); 

        // Função interna para conferir e evitar duplicados
        const conferir = (jogoStr, label) => {
            const nums = formatarJogoParaArray(jogoStr);
            const key = [...nums].sort().join("|");
            if (chavesProcessadas.has(key)) return;

            const acertos = nums.filter(n => sorteados.includes(n));
            if (acertos.length >= 4) {
                totalResultados.push({ label, acertos });
            }
            chavesProcessadas.add(key);
        };

        // Executa conferência na ordem de importância
        if (dadosGlobaisParaConferir.jogoPrincipal) conferir(dadosGlobaisParaConferir.jogoPrincipal, "JOGO PRINCIPAL");
        dadosGlobaisParaConferir.jogosParticipante.forEach(j => conferir(j, "SEU JOGO"));
        dadosGlobaisParaConferir.jogosAdicionais.forEach(j => conferir(j, "JOGO DO BOLÃO"));

        // Exibir Resultados
        if (totalResultados.length === 0) {
            listaConferencia.innerHTML = "<p class='center' style='color:red; font-weight:bold; margin-top:10px;'>Nenhum prêmio encontrado.</p>";
            return;
        }

        listaConferencia.innerHTML = totalResultados.map(r => {
            let medalha = r.acertos.length === 6 ? "SENA" : (r.acertos.length === 5 ? "QUINA" : "QUADRA");
            return `
                <div class="premio-item">
                    <strong style="color:var(--mega-green)">🏆 ${medalha}! (${r.acertos.length} Acertos)</strong><br>
                    <small>${r.label}</small><br>
                    <span>Números: ${r.acertos.join(" - ")}</span>
                </div>`;
        }).join("");
    });
});