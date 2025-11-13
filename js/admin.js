// === /js/admin.js ===
// Painel administrativo com Jogo da Sorte editável e exclusão total.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

// 🚨 ADMIN_USER e ADMIN_PASS REMOVIDOS DESTE ARQUIVO! 🚨

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
// Variáveis para armazenar credenciais temporariamente
let storedUser = ""; 
let storedPass = ""; 

// === LOGIN CENTRALIZADO NO APPS SCRIPT ===
el("btnLogin")?.addEventListener("click", async () => {
    const user = el("adminUser").value.trim();
    const pass = el("adminPass").value.trim();

    loginMsg.classList.add("hidden");

    if (!user || !pass) {
        loginMsg.textContent = "Preencha usuário e senha.";
        loginMsg.classList.remove("hidden");
        return;
    }
    
    // 💡 ENVIA CREDENCIAIS PARA O Apps Script PARA VERIFICAÇÃO SEGURA
    try {
        const body = new URLSearchParams({ 
            action: "checkLogin", // Nova ação no Apps Script
            user: user, 
            pass: pass 
        });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        
        if (data.success) {
            // Guarda credenciais temporariamente para uso em postAction
            storedUser = user;
            storedPass = pass;
            
            loginArea.classList.add("hidden");
            adminArea.classList.remove("hidden");
            carregarParticipantes();
        } else {
            loginMsg.textContent = data.message || "Usuário ou senha inválidos.";
            loginMsg.classList.remove("hidden");
        }
    } catch (err) {
        loginMsg.textContent = "Erro de conexão com o servidor. Tente novamente.";
        loginMsg.classList.remove("hidden");
    }
});

el("btnLogout")?.addEventListener("click", () => {
    adminArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    el("adminUser").value = "";
    el("adminPass").value = "";
    loginMsg.classList.add("hidden");
    // Limpa as credenciais armazenadas
    storedUser = ""; 
    storedPass = "";
});

// === CONSULTA PRINCIPAL ===
async function carregarParticipantes() {
    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
    try {
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

// --- postAction (COM CREDENCIAIS ARMAZENADAS) ---
async function postAction(action, params) {
    if (!storedUser || !storedPass) {
        alert("Erro: Faça login novamente.");
        el("btnLogout")?.click(); // Força logout
        return;
    }

    try {
        // ✅ ENVIA CREDENCIAIS ARMAZENADAS PARA CADA AÇÃO ADMIN
        const body = new URLSearchParams({ 
            action, 
            user: storedUser, 
            pass: storedPass, 
            ...params 
        });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        
        if (data.success) {
            alert(data.message || "Ação concluída.");
        } else {
            alert("Falha na ação: " + (data.message || data.error || "Erro desconhecido."));
            if (data.message && data.message.includes("Acesso negado")) {
                el("btnLogout")?.click(); // Força logout se o acesso for negado
            }
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
    // 💡 CORREÇÃO DE BUG: Busca o elemento novamente para evitar TypeError
    const inputContainer = el("jogoSorteInputs");
    if (!inputContainer) {
        console.error("Erro HTML: Elemento 'jogoSorteInputs' não encontrado.");
        return;
    }

    inputContainer.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = 60;
        input.className = "input-numero";
        input.value = jogoSorteAtual[i] || "";
        inputContainer.appendChild(input);
    }
}

// Salvar novo jogo da sorte
btnSalvarJogoSorte?.addEventListener("click", async () => {
    // 💡 CORREÇÃO DE BUG: Busca o elemento novamente
    const inputContainer = el("jogoSorteInputs");
    if (!inputContainer) return alert("Erro interno: Container de inputs não encontrado.");

    const numeros = Array.from(inputContainer.querySelectorAll("input"))
        .map(i => i.value.trim())
        .filter(v => v !== "")
        .map(n => parseInt(n).toString().padStart(2, '0')); 

    if (numeros.length !== 9) {
        alert("Informe exatamente 9 números.");
        return;
    }

    const numerosUnicos = new Set(numeros);
    if (numerosUnicos.size !== 9) {
        alert("Não é permitido números repetidos no Jogo da Sorte.");
        return;
    }

    const invalidos = numeros.some(n => isNaN(parseInt(n)) || parseInt(n) < 1 || parseInt(n) > 60);
    if (invalidos) {
        alert("Os números devem estar entre 01 e 60.");
        return;
    }

    const jogoFormatado = Array.from(numerosUnicos).map(n => n.padStart(2, '0')).join(" ");
    
    await postAction("salvarJogoSorte", { jogo: jogoFormatado });
});

// Apagar jogo da sorte
btnApagarJogoSorte?.addEventListener("click", async () => {
    if (!confirm("Deseja realmente apagar todos os números do Jogo da Sorte?")) return;

    await postAction("salvarJogoSorte", { jogo: "" });
});

// === CONFERÊNCIA E RATEIO ===
el("btnConferir")?.addEventListener("click", () => {
    const sorteados_brutos = inputSorteados.value.trim().split(/\s+/).filter(Boolean);
    
    if (sorteados_brutos.length !== 6) return alert("Informe exatamente 6 números sorteados.");

    const sorteados_numericos = sorteados_brutos.map(n => parseInt(n));
    const sorteados_unicos = new Set(sorteados_numericos.filter(n => !isNaN(n) && n >= 1 && n <= 60));

    if (sorteados_unicos.size !== 6) {
        return alert("Os números sorteados devem ser 6 números únicos entre 1 e 60.");
    }

    const sorteados = Array.from(sorteados_unicos).map(n => n.toString().padStart(2, '0')); 

    resultadoConferencia.innerHTML = `<p class="loading">Conferindo resultados...</p>`;
    areaRateio.classList.add("hidden");

    const premiados = { sena: [], quina: [], quadra: [] };
    todosDados.forEach(p => {
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
