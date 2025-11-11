// /js/admin.js - CÓDIGO CORRIGIDO E SINCRONIZADO COM GOOGLE APPS SCRIPT

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec"; // Use sua URL de Implantação

// 5.1 - Login simples
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

// Elementos (Incluindo os elementos de estatística que estavam faltando)
const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const listaParticipantes = document.getElementById("listaParticipantes");
const loginMsg = document.getElementById("loginMsg");
const countParticipantes = document.getElementById("countParticipantes"); // Adicionado
const countJogos = document.getElementById("countJogos");                 // Adicionado
const jogoSorteAtual = document.getElementById("jogoSorteAtual");         // Adicionado

// Elementos de Gestão (Mantidos para compatibilidade com o HTML original)
const inputJogoSorte = document.getElementById("inputJogoSorte");
const btnSalvarJogoSorte = document.getElementById("btnSalvarJogoSorte");
const inputSorteados = document.getElementById("inputSorteados");
const btnConferir = document.getElementById("btnConferir");
const resultadoConferencia = document.getElementById("resultadoConferencia");
const areaRateio = document.getElementById("areaRateio");
const inputValorPremio = document.getElementById("valorPremio");
const btnCalcularRateio = document.getElementById("btnCalcularRateio");
const resultadoRateio = document.getElementById("resultadoRateio");

let todosDados = []; // Armazena todos os dados para conferência

// --- LOGIN/LOGOUT ---

document.getElementById("btnLogin").addEventListener("click", () => {
    const user = document.getElementById("adminUser").value.trim();
    const pass = document.getElementById("adminPass").value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loginArea.classList.add("hidden");
        adminArea.classList.remove("hidden");
        carregarParticipantes();
    } else {
        loginMsg.textContent = "Usuário ou senha inválidos.";
        loginMsg.classList.remove("hidden");
    }
});

document.getElementById("btnLogout").addEventListener("click", () => {
    adminArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    document.getElementById("adminUser").value = "";
    document.getElementById("adminPass").value = "";
});

document.getElementById("btnAtualizar").addEventListener("click", carregarParticipantes);

// --- 5.2 - CARREGAR DADOS E ESTATÍSTICAS (Ajustado para o Apps Script) ---

async function carregarParticipantes() {
    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
    try {
        // Usa a ação correta para o Apps Script
        const res = await fetch(`${SCRIPT_URL}?action=consultarBolao`);
        const data = await res.json();
        
        // Armazena dados do bolão para conferência
        todosDados = data.participantes || []; 

        // 5.2 - Atualiza Estatísticas
        const totalParticipantes = todosDados.length;
        // Assume que p.Jogos está em formato "Jogo1|Jogo2|..." (como definido no GAS)
        const totalJogos = todosDados.reduce((acc, p) => acc + (p.Jogos?.split('|').length || 0), 0);
        
        if (countParticipantes) countParticipantes.textContent = totalParticipantes;
        if (countJogos) countJogos.textContent = totalJogos;

        // 5.4 - Atualiza Jogo da Sorte
        if (jogoSorteAtual) jogoSorteAtual.textContent = `Jogo atual: ${data.jogoDaSorte || "N/A"}`;
        
        renderTabela(todosDados);
    } catch (err) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 py-4">Erro ao carregar: ${err.message}</td></tr>`;
    }
}

// --- 5.2 - RENDERIZAR TABELA ---

function renderTabela(dados) {
    if (!Array.isArray(dados) || dados.length === 0) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum participante encontrado.</td></tr>`;
        return;
    }

    // A tabela agora exibe o Nome, Protocolo, Status e Ações
    listaParticipantes.innerHTML = dados.map((p) => {
        // Extrai e formata a lista de jogos do participante
        const jogosParticipante = p.Jogos.split('|').map((j, i) => `Jogo ${i + 1}: ${j}`).join(' | ');
        // O Status vem do GAS com o nome 'Status' (PAGO ou AGUARDANDO)
        const status = p.Status || "AGUARDANDO"; 

        return `
            <tr>
                <td class="py-2 px-3">${p.Nome}<br><span style="font-size:0.8em; color:#555;">${jogosParticipante}</span></td>
                <td class="py-2 px-3">${p.Protocolo}</td>
                <td class="py-2 px-3 font-semibold ${status === "PAGO" ? "text-green-600" : "text-red-500"}">${status}</td>
                <td class="py-2 px-3 text-center">
                    <button class="primary small mb-1" onclick="confirmarPagamento('${p.Protocolo}')">Confirmar Pagamento</button>
                    <button class="danger small" onclick="excluirParticipante('${p.Protocolo}')">Excluir</button>
                </td>
            </tr>
        `;
    }).join("");
}

// --- 5.3 - AÇÕES DE GERENCIAMENTO (Ajustado para o Apps Script - POST) ---

window.confirmarPagamento = async (protocolo) => { // Tornada global
    if (!confirm(`Confirmar pagamento para o protocolo ${protocolo}?`)) return;

    try {
        const res = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Essencial para o GAS
            body: `action=setPago&protocolo=${protocolo}` // Apps Script deve processar
        });
        const data = await res.json();
        alert(data.message || "Status de pagamento atualizado.");
        carregarParticipantes();
    } catch (err) {
        alert("Erro ao atualizar pagamento: " + err.message);
    }
}

window.excluirParticipante = async (protocolo) => { // Tornada global
    if (!confirm(`Tem certeza que deseja EXCLUIR o participante com protocolo ${protocolo}? Esta ação é IRREVERSÍVEL.`)) return;

    try {
        const res = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Essencial para o GAS
            body: `action=excluir&protocolo=${protocolo}` // Apps Script deve processar
        });
        const data = await res.json();
        alert(data.message || "Participante excluído.");
        carregarParticipantes();
    } catch (err) {
        alert("Erro ao excluir: " + err.message);
    }
}

// --- Funções de Jogo da Sorte, Conferência e Rateio (Devem ser inseridas aqui, se existirem no seu código original) ---

// Seção 5.4 Jogo da Sorte (Exemplo, se você tiver os botões no HTML)
// btnSalvarJogoSorte.onclick = async () => { ... } 
// ...
