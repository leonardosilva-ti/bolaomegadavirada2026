// === /js/admin.js ===
// Painel administrativo com Jogo da Sorte editável, cadastro de jogos manuais e exclusão total.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const el = id => document.getElementById(id);

const loginArea = el("loginArea");
const adminArea = el("adminArea");
const loginMsg = el("loginMsg");
const listaParticipantes = el("listaParticipantes");
const countParticipantes = el("countParticipantes");
const countJogos = el("countJogos");
const jogoSorteContainer = el("jogoSorteContainer");
const jogoSorteInputs = el("jogoSorteInputs");
const inputSorteados = el("inputSorteados");
const resultadoConferencia = el("resultadoConferencia");
const areaRateio = el("areaRateio");
const inputValorPremio = el("valorPremio");
const resultadoRateio = el("resultadoRateio");

// === NOVO ===
const containerJogosAdm = el("containerJogosAdm");
const btnConfirmarJogosAdm = el("btnConfirmarJogosAdm");
const btnCancelarJogosAdm = el("btnCancelarJogosAdm");

let todosDados = [];
let jogoSorteAtual = [];
let accessToken = null; 

// === LOGIN ===
el("btnLogin")?.addEventListener("click", async () => {
    const user = el("adminUser").value.trim();
    const pass = el("adminPass").value.trim();
    loginMsg.classList.add("hidden");
    if (!user || !pass) {
        loginMsg.textContent = "Preencha usuário e senha.";
        loginMsg.classList.remove("hidden");
        return;
    }
    try {
        const body = new URLSearchParams({ action: "login", user, pass });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        if (data.success && data.token) {
            accessToken = data.token;
            loginArea.classList.add("hidden");
            adminArea.classList.remove("hidden");
            carregarParticipantes(); 
            initJogosAdm(); // inicializa área de jogos manuais
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
    accessToken = null; 
});

// === CARREGAR PARTICIPANTES ===
async function carregarParticipantes() {
    if (!accessToken) { alert("Erro: Sessão expirada."); el("btnLogout")?.click(); return; }

    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
    try {
        const body = new URLSearchParams({ action: "getAdminData", token: accessToken });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        if (data.message && data.message.includes("negado")) { alert(data.message); el("btnLogout")?.click(); return; }

        todosDados = data.participantes || [];
        countParticipantes.textContent = todosDados.length;
        countJogos.textContent = todosDados.reduce((acc, p) => acc + (p.Jogos?.split('|').length || 0), 0);
        renderTabela(todosDados);

        jogoSorteAtual = data.jogoDaSorte ? Array.from(new Set(data.jogoDaSorte.split(/\s+/).filter(Boolean))) : [];
        renderizarJogoSorte();
        renderizarInputs();
    } catch (err) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar dados: ${err.message}</td></tr>`;
    }
}

el("btnAtualizar")?.addEventListener("click", carregarParticipantes);

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

window.confirmarPagamento = async (protocolo) => { if (!confirm(`Confirmar pagamento do protocolo ${protocolo}?`)) return; await postAction("setPago", { protocolo }); };
window.excluirParticipante = async (protocolo) => { if (!confirm(`Excluir participante ${protocolo}?`)) return; await postAction("excluir", { protocolo }); };

async function postAction(action, params) {
    if (!accessToken) { alert("Erro: Faça login novamente."); el("btnLogout")?.click(); return; }
    try {
        const body = new URLSearchParams({ action, token: accessToken, ...params });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        if (data.success) alert(data.message || "Ação concluída.");
        else { alert("Falha: " + (data.message || data.error || "Erro")); if (data.message.includes("Token")) el("btnLogout")?.click(); }
        carregarParticipantes(); 
    } catch (err) { alert("Erro: " + err.message); }
}

// === JOGO DA SORTE ===
function renderizarJogoSorte() {
    jogoSorteContainer.innerHTML = "";
    if (!jogoSorteAtual.length) { jogoSorteContainer.innerHTML = `<p style="color:#999;">Nenhum jogo da sorte cadastrado.</p>`; return; }
    jogoSorteAtual.forEach(num => {
        const div = document.createElement("div");
        div.className = "jogo-numero";
        div.textContent = num;
        jogoSorteContainer.appendChild(div);
    });
}

function renderizarInputs() {
    const inputContainer = el("jogoSorteInputs");
    if (!inputContainer) return console.error("Erro HTML: Elemento 'jogoSorteInputs' não encontrado.");
    inputContainer.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const input = document.createElement("input");
        input.type = "number"; input.min = 1; input.max = 60; input.className = "input-numero";
        input.value = jogoSorteAtual[i] || "";
        inputContainer.appendChild(input);
    }
}

// === NOVA FUNÇÃO: Jogos Manuais Adm ===
function initJogosAdm() {
    if (!containerJogosAdm) return;
    containerJogosAdm.innerHTML = "";
    addJogoAdm(1);
}

function addJogoAdm(numero) {
    const div = document.createElement("div");
    div.className = "jogo-adm-row";
    div.dataset.numero = numero;

    div.innerHTML = `<strong>Jogo ${numero}:</strong> ${Array.from({length:6},()=>'<input type="number" min="1" max="60" class="input-numero-adm">').join(' ')} <button class="add-jogo">+</button>`;
    containerJogosAdm.appendChild(div);

    div.querySelector(".add-jogo")?.addEventListener("click", () => {
        div.querySelector(".add-jogo").disabled = true;
        addJogoAdm(numero + 1);
    });
}

btnConfirmarJogosAdm?.addEventListener("click", async () => {
    const linhas = containerJogosAdm.querySelectorAll(".jogo-adm-row");
    const jogos = [];

    for (let linha of linhas) {
        const nums = Array.from(linha.querySelectorAll("input")).map(i=>i.value.trim().padStart(2,'0'));

        // validação números vazios, entre 1-60
        if (nums.some(n => !n || isNaN(n) || n<1 || n>60)) {
            return alert(`Jogo ${linha.dataset.numero} contém números inválidos. Use valores entre 1 e 60.`);
        }

        // validação de repetição dentro do mesmo jogo
        const unique = Array.from(new Set(nums));
        if (unique.length !== nums.length) {
            return alert(`Jogo ${linha.dataset.numero} possui números repetidos.`);
        }

        jogos.push(nums.join(' '));
    }

    // envia para a planilha
    try {
        const body = new URLSearchParams({ action: "salvarJogosAdm", jogos: jogos.join('|'), token: accessToken });
        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const data = await res.json();
        if (data.success) {
            alert("Jogos salvos com sucesso.");
            containerJogosAdm.innerHTML = "";
            addJogoAdm(1);
        } else alert("Erro ao salvar: "+(data.message||"desconhecido"));
    } catch(err) {
        alert("Erro ao salvar: "+err.message);
    }
});

btnCancelarJogosAdm?.addEventListener("click", () => {
    containerJogosAdm.innerHTML = "";
    addJogoAdm(1);
});
