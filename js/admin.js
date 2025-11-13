// === /js/admin.js ===
// Painel administrativo com Jogo da Sorte editável e exclusão total.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

// 🚨 VERSÃO ORIGINAL: CREDENCIAIS EXPOSTAS NO FRONT-END
const ADMIN_USER = "admin"; // MUDE AQUI
const ADMIN_PASS = "12345"; // MUDE AQUI
// 🚨 (Substitua pelos seus valores reais)

const el = id => document.getElementById(id);

const loginArea = el("loginArea");
const adminArea = el("adminArea");
const loginMsg = el("loginMsg");
const listaParticipantes = el("listaParticipantes");
const countParticipantes = el("countParticipantes");
const countJogos = el("countJogos");
const jogoSorteContainer = el("jogoSorteContainer");
const jogoSorteInputs = el("jogoSorteInputs");
const btnSalvarJogoSorte = el("btnSalvarJogoSorte");
const btnApagarJogoSorte = el("btnApagarJogoSorte");
const inputSorteados = el("inputSorteados");
const resultadoConferencia = el("resultadoConferencia");
const areaRateio = el("areaRateio");
const inputValorPremio = el("valorPremio");
const resultadoRateio = el("resultadoRateio");

let todosDados = [];
let jogoSorteAtual = [];
// let accessToken = null; // Token não existia

// === LOGIN SIMPLES NO FRONT-END ===
el("btnLogin")?.addEventListener("click", () => {
    const user = el("adminUser").value.trim();
    const pass = el("adminPass").value.trim();

    loginMsg.classList.add("hidden");
    
    // 🚨 VERIFICAÇÃO SIMPLES NO FRONT-END
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loginArea.classList.add("hidden");
        adminArea.classList.remove("hidden");
        carregarParticipantes();
    } else {
        loginMsg.textContent = "Usuário ou senha inválidos.";
        loginMsg.classList.remove("hidden");
    }
});

el("btnLogout")?.addEventListener("click", () => {
    adminArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    el("adminUser").value = "";
    el("adminPass").value = "";
    loginMsg.classList.add("hidden");
    // accessToken = null; // Não precisava limpar token
});

// === CONSULTA PRINCIPAL ===
async function carregarParticipantes() {
    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
    try {
        // Ação CONSULTAR BOLÃO (sem token)
        const res = await fetch(`${SCRIPT_URL}?action=consultarBolao`);
        const data = await res.json();
        todosDados = data.participantes || [];

        countParticipantes.textContent = todosDados.length;
        countJogos.textContent = todosDados.reduce((acc, p) => acc + (p.Jogos?.split('|').length || 0), 0);

        renderTabela(todosDados);

        // --- Jogo da Sorte ---
        if (data.jogoDaSorte) {
            const numerosUnicos = new Set(data.jogoDaSorte.split(/\s+/).filter(Boolean));
            jogoSorteAtual = Array.from(numerosUnicos);
        } else {
            jogoSorteAtual = [];
        }

        renderizarJogoSorte();
        renderizarInputs();
    } catch (err) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro: ${err.message}</td></tr>`;
    }
}

el("btnAtualizar")?.addEventListener("click", carregarParticipantes);

// === TABELA ===
function renderTabela(dados) {
    if (!dados.length) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum participante encontrado.</td></tr>`;
        return;
    }

    listaParticipantes.innerHTML = dados.map(p => `
        <tr>
            <td class="py-2 px-3 border">${p.Nome}<br><small>${p.Jogos?.split('|').join('<br>')}</small></td>
            <td class="py-2 px-3 border text-center">${p.Protocolo}</td>
            <td class="py-2 px-3 border text-center ${p.Status === "PAGO" ? "text-green-600" : "text-red-500"}">${p.Status || "AGUARDANDO"}</td>
            <td class="py-2 px-3 border text-center">
                <button class="primary small" onclick="confirmarPagamento('${p.Protocolo}')">💰 Confirmar</button><br>
                <button class="danger small" onclick="excluirParticipante('${p.Protocolo}')">🗑 Excluir</button>
            </td>
        </tr>
    `).join("");
}

// === CONFIRMAR / EXCLUIR ===
window.confirmarPagamento = async (protocolo) => {
    if (!confirm(`Confirmar pagamento do protocolo ${protocolo}?`)) return;
    await postAction("setPago", { protocolo });
};

window.excluirParticipante = async (protocolo) => {
    if (!confirm(`Excluir participante ${protocolo}? Esta ação é irreversível.`)) return;
    await postAction("excluir", { protocolo });
};

// --- postAction (SEM TOKEN) ---
async function postAction(action, params) {
    // 🚨 SEM VERIFICAÇÃO DE SEGURANÇA NO FRONT-END
    
    // Requer as credenciais no Apps Script (o Apps Script precisa fazer a validação)
    const adminUser = el("adminUser").value.trim(); 
    const adminPass = el("adminPass").value.trim();

    // 🚨 OS PARÂMETROS DE LOGIN E SENHA ERAM ENVIADOS JUNTO COM A AÇÃO
    if (!adminUser || !adminPass) {
        alert("Erro: Preencha usuário e senha antes de executar a ação.");
        return;
    }

    try {
        const body = new URLSearchParams({ action, user: adminUser, pass: adminPass, ...params });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        
        // Alerta de sucesso/falha baseado na resposta JSON do Apps Script
        if (data.success) {
            alert(data.message || "Ação concluída.");
        } else {
            // Exibe a mensagem de erro que vem do Apps Script
            alert("Falha na ação: " + (data.message || data.error || "Erro desconhecido."));
        }
        
        carregarParticipantes();
    } catch (err) {
        alert("Erro de conexão ao executar ação: " + err.message);
    }
}

// === JOGO DA SORTE ===

// Renderiza bolinhas
function renderizarJogoSorte() {
    jogoSorteContainer.innerHTML = "";

    if (jogoSorteAtual.length === 0) {
        jogoSorteContainer.innerHTML = `<p style="color:#999;">Nenhum jogo da sorte cadastrado.</p>`;
        return;
    }

    jogoSorteAtual.forEach(num => {
        const div = document.createElement("div");
        div.className = "jogo-numero";
        div.textContent = num;
        jogoSorteContainer.appendChild(div);
    });
}

// Renderiza os 9 inputs para novo jogo
function renderizarInputs() {
    jogoSorteInputs.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = 60;
        input.className = "input-numero";
        input.value = jogoSorteAtual[i] || "";
        jogoSorteInputs.appendChild(input);
    }
}

// Salvar novo jogo da sorte
btnSalvarJogoSorte?.addEventListener("click", async () => {
    const numeros = Array.from(jogoSorteInputs.querySelectorAll("input"))
        .map(i => i.value.trim())
        .filter(v => v !== "")
        .map(n => parseInt(n).toString().padStart(2, '0')); 

    if (numeros.length !== 9) {
        alert("Informe exatamente 9 números.");
        return;
    }

    // ⚠️ VERIFICAÇÃO DE DUPLICIDADE (mantida no front)
    const numerosUnicos = new Set(numeros);
    if (numerosUnicos.size !== 9) {
        alert("Não é permitido números repetidos no Jogo da Sorte.");
        return;
    }

    // Validação de faixa (mantida)
    const invalidos = numeros.some(n => isNaN(parseInt(n)) || parseInt(n) < 1 || parseInt(n) > 60);
    if (invalidos) {
        alert("Os números devem estar entre 01 e 60.");
        return;
    }

    // A conversão para string formatada de dois dígitos é feita aqui para o script do Sheets
    const jogoFormatado = Array.from(numerosUnicos).map(n => n.padStart(2, '0')).join(" ");
    
    // 🚨 Chamada de Ação sem Token
    await postAction("salvarJogoSorte", { jogo: jogoFormatado });
});

// Apagar jogo da sorte
btnApagarJogoSorte?.addEventListener("click", async () => {
    if (!confirm("Deseja realmente apagar todos os números do Jogo da Sorte?")) return;

    // 🚨 Chamada de Ação sem Token
    await postAction("salvarJogoSorte", { jogo: "" });
});

// === CONFERÊNCIA E RATEIO (com validação de duplicidade) ===
el("btnConferir")?.addEventListener("click", () => {
    const sorteados_brutos = inputSorteados.value.trim().split(/\s+/).filter(Boolean);
    
    if (sorteados_brutos.length !== 6) return alert("Informe exatamente 6 números sorteados.");

    // ⚠️ VERIFICAÇÃO DE DUPLICIDADE E FAIXA (NOVA VALIDAÇÃO)
    const sorteados_numericos = sorteados_brutos.map(n => parseInt(n));
    const sorteados_unicos = new Set(sorteados_numericos.filter(n => !isNaN(n) && n >= 1 && n <= 60));

    if (sorteados_unicos.size !== 6) {
        return alert("Os números sorteados devem ser 6 números únicos entre 1 e 60.");
    }

    // Formata os números únicos para comparação (ex: '05')
    const sorteados = Array.from(sorteados_unicos).map(n => n.toString().padStart(2, '0')); 

    resultadoConferencia.innerHTML = `<p class="loading">Conferindo resultados...</p>`;
    areaRateio.classList.add("hidden");

    const premiados = { sena: [], quina: [], quadra: [] };
    todosDados.forEach(p => {
        // Garantir que p.Jogos existe e é uma string
        if (p.Jogos) {
            p.Jogos.split('|').forEach((jogo, idx) => {
                const acertos = jogo.split(' ').filter(n => sorteados.includes(n.padStart(2, '0'))).length;
                if (acertos >= 4)
                    premiados[acertos === 6 ? 'sena' : acertos === 5 ? 'quina' : 'quadra']
                        .push({ ...p, acertos, idx: idx + 1, jogo });
            });
        }
    });

    let html = `<h4>Resultado da Conferência</h4><p><strong>Números:</strong> ${sorteados.join(' ')}</p><hr>`;
    ["sena", "quina", "quadra"].forEach(tipo => {
        if (premiados[tipo].length) {
            html += `<h5>🎉 ${tipo.toUpperCase()} (${premiados[tipo].length})</h5>`;
            premiados[tipo].forEach(j => html += `<p>${j.Nome} (${j.Protocolo}) - Jogo ${j.idx}: <strong>${j.jogo}</strong></p>`);
        }
    });
    if (!premiados.sena.length && !premiados.quina.length && !premiados.quadra.length)
        html += `<p style="color:red;">Nenhum premiado.</p>`;

    resultadoConferencia.innerHTML = html;
    areaRateio.classList.remove("hidden");
    document.rateioData = { totalPagos: todosDados.filter(p => p.Status === 'PAGO').length };
});

el("btnCalcularRateio")?.addEventListener("click", () => {
    const total = parseFloat(inputValorPremio.value);
    const pagos = document.rateioData?.totalPagos || 0;

    if (!total || total <= 0) return mostrarRateio("Insira um valor válido.", "red");
    if (pagos === 0) return mostrarRateio("Nenhum participante pago.", "red");

    const porPessoa = total / pagos;
    mostrarRateio(`💵 R$ ${total.toFixed(2).replace('.', ',')} / ${pagos} → R$ ${porPessoa.toFixed(2).replace('.', ',')} por participante.`, "green");
});

function mostrarRateio(msg, cor) {
    resultadoRateio.textContent = msg;
    resultadoRateio.style.color = cor;
}
