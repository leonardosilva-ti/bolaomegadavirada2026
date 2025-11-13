// === /js/admin.js - ADMIN COMPLETO COM INPUTS UNIFICADOS ===
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const el = id => document.getElementById(id);

// ==== ELEMENTOS HTML ====
const loginArea = el("loginArea");
const adminArea = el("adminArea");
const loginMsg = el("loginMsg");

const listaParticipantes = el("listaParticipantes");
const countParticipantes = el("countParticipantes");
const countJogos = el("countJogos");

// JOGO DA SORTE
const jogoSorteContainer = el("jogoSorteContainer");
const jogoSorteInputs = el("jogoSorteInputs");
const btnSalvarJogoSorte = el("btnSalvarJogoSorte");
const btnApagarJogoSorte = el("btnApagarJogoSorte");

// JOGOS EXCEDENTES
const excedentesContainer = el("excedentesContainer");
const btnAddExcedente = el("btnAddExcedente");
const btnSalvarExcedentes = el("btnSalvarExcedentes");

// CONFERÊNCIA
const conferenciaContainer = el("conferenciaContainer");
const btnConferir = el("btnConferir");
const resultadoConferencia = el("resultadoConferencia");
const areaRateio = el("areaRateio");
const inputValorPremio = el("valorPremio");
const btnCalcularRateio = el("btnCalcularRateio");
const resultadoRateio = el("resultadoRateio");

const btnAtualizar = el("btnAtualizar");
const btnLogout = el("btnLogout");

// ==== VARIÁVEIS GLOBAIS ====
let todosDados = [];
let jogoSorteAtual = [];
let jogosExcedentes = [];
let accessToken = null; // Token JWT

// ================== LOGIN ==================
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
        const body = new URLSearchParams({ action:"login", user, pass });
        const res = await fetch(SCRIPT_URL, { method:"POST", body });
        const data = await res.json();

        if (data.success && data.token) {
            accessToken = data.token;
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

btnLogout?.addEventListener("click", () => {
    adminArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    el("adminUser").value = "";
    el("adminPass").value = "";
    loginMsg.classList.add("hidden");
    accessToken = null;
});

// ================== CARREGAR PARTICIPANTES ==================
async function carregarParticipantes() {
    if (!accessToken) { alert("Erro: Sessão expirada."); btnLogout?.click(); return; }

    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
    try {
        const body = new URLSearchParams({ action:"getAdminData", token: accessToken });
        const res = await fetch(SCRIPT_URL, { method:"POST", body });
        const data = await res.json();

        if (data.message && data.message.includes("negado")) {
            alert(data.message);
            btnLogout?.click(); 
            return;
        }

        todosDados = data.participantes || [];
        countParticipantes.textContent = todosDados.length;
        countJogos.textContent = todosDados.reduce((acc,p) => acc + (p.Jogos?.split('|').length||0),0);

        renderTabela(todosDados);

        // ==== Jogo da Sorte ====
        jogoSorteAtual = data.jogoDaSorte ? Array.from(new Set(data.jogoDaSorte.split(/\s+/).filter(Boolean))) : [];
        renderizarJogoSorte();
        renderizarInputsJogoSorte();

        // ==== Jogos Excedentes ====
        jogosExcedentes = data.jogosExcedentes || [];
        renderizarTodosExcedentes();

        // ==== Conferência ====
        renderizarConferencia();
    } catch (err) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar dados: ${err.message}</td></tr>`;
    }
}

btnAtualizar?.addEventListener("click", carregarParticipantes);

// ================== TABELA PARTICIPANTES ==================
function renderTabela(dados) {
    if (!dados.length) {
        listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum participante encontrado.</td></tr>`;
        return;
    }

    listaParticipantes.innerHTML = dados.map(p => `
        <tr>
            <td class="py-2 px-3 border">${p.Nome}<br><small>${p.Jogos?.split('|').join('<br>')}</small></td>
            <td class="py-2 px-3 border text-center">${p.Protocolo}</td>
            <td class="py-2 px-3 border text-center ${p.Status==="PAGO"?"text-green-600":"text-red-500"}">${p.Status||"AGUARDANDO"}</td>
            <td class="py-2 px-3 border text-center">
                <button class="primary small" onclick="confirmarPagamento('${p.Protocolo}')">💰 Confirmar</button><br>
                <button class="danger small" onclick="excluirParticipante('${p.Protocolo}')">🗑 Excluir</button>
            </td>
        </tr>
    `).join("");
}

// ================== AÇÕES CONFIRMAR / EXCLUIR ==================
window.confirmarPagamento = async protocolo => {
    if(!confirm(`Confirmar pagamento do protocolo ${protocolo}?`)) return;
    await postAction("setPago", { protocolo });
};

window.excluirParticipante = async protocolo => {
    if(!confirm(`Excluir participante ${protocolo}?`)) return;
    await postAction("excluir", { protocolo });
};

async function postAction(action, params) {
    if (!accessToken) { alert("Token ausente."); btnLogout?.click(); return; }

    try {
        const body = new URLSearchParams({ action, token: accessToken, ...params });
        const res = await fetch(SCRIPT_URL, { method:"POST", body });
        const data = await res.json();

        if(data.success) alert(data.message || "Ação concluída.");
        else {
            alert("Falha: "+(data.message||data.error||"Erro desconhecido."));
            if(data.message && data.message.includes("Token")) btnLogout?.click();
        }

        carregarParticipantes();
    } catch(err) {
        alert("Erro de conexão: "+err.message);
    }
}

// ================== JOGO DA SORTE ==================
function renderizarJogoSorte() {
    jogoSorteContainer.innerHTML = "";
    if(jogoSorteAtual.length===0){
        jogoSorteContainer.innerHTML=`<p style="color:#999;">Nenhum jogo da sorte cadastrado.</p>`;
        return;
    }
    jogoSorteAtual.forEach(num=>{
        const div=document.createElement("div");
        div.className="jogo-numero";
        div.textContent=num;
        jogoSorteContainer.appendChild(div);
    });
}

function renderizarInputsJogoSorte(){
    jogoSorteInputs.innerHTML="";
    for(let i=0;i<9;i++){
        const input=document.createElement("input");
        input.type="number";
        input.min=1;
        input.max=60;
        input.className="input-numero"; // unificado com conferência
        input.value=jogoSorteAtual[i]||"";
        jogoSorteInputs.appendChild(input);
    }
}

btnSalvarJogoSorte?.addEventListener("click", async()=>{
    const numeros = Array.from(jogoSorteInputs.querySelectorAll("input"))
        .map(i=>i.value.trim())
        .filter(v=>v!=="")
        .map(n=>parseInt(n).toString().padStart(2,"0"));

    if(numeros.length!==9){ alert("Informe exatamente 9 números."); return; }
    if(new Set(numeros).size!==9){ alert("Não é permitido números repetidos."); return; }
    if(numeros.some(n=>isNaN(parseInt(n))||parseInt(n)<1||parseInt(n)>60)){ alert("Números entre 01 e 60."); return; }

    await postAction("salvarJogoSorte",{ jogo:numeros.join(" ") });
});

btnApagarJogoSorte?.addEventListener("click", async()=>{
    if(!confirm("Deseja apagar todos os números do Jogo da Sorte?")) return;
    await postAction("salvarJogoSorte",{ jogo:"" });
});

// ================== JOGOS EXCEDENTES ==================
function renderizarExcedente(index){
    const div=document.createElement("div");
    div.className="input-jogo-excedente flex gap-2 mb-2";
    div.dataset.index=index;

    for(let i=0;i<6;i++){
        const input=document.createElement("input");
        input.type="number";
        input.min=1;
        input.max=60;
        input.className="input-numero";
        input.value=(jogosExcedentes[index]&&jogosExcedentes[index][i])||"";
        div.appendChild(input);
    }

    const btnRemove=document.createElement("button");
    btnRemove.textContent="🗑";
    btnRemove.type="button";
    btnRemove.className="danger small";
    btnRemove.style.marginTop="5px";
    btnRemove.onclick=()=>{ jogosExcedentes.splice(index,1); renderizarTodosExcedentes(); };
    div.appendChild(btnRemove);

    return div;
}

function renderizarTodosExcedentes(){
    excedentesContainer.innerHTML="";
    jogosExcedentes.forEach((_,idx)=>{ excedentesContainer.appendChild(renderizarExcedente(idx)); });
}

btnAddExcedente?.addEventListener("click", ()=>{
    jogosExcedentes.push(["","","","","",""]);
    renderizarTodosExcedentes();
});

btnSalvarExcedentes?.addEventListener("click", async()=>{
    const grids=excedentesContainer.querySelectorAll(".input-jogo-excedente");
    const dados=Array.from(grids).map(grid=>Array.from(grid.querySelectorAll("input")).map(i=>i.value.trim().padStart(2,"0")));

    for(const jogo of dados){
        if(jogo.some(n=>!n)) { alert("Preencha todos os números de cada jogo."); return; }
        if(new Set(jogo).size!==6){ alert("Não é permitido números repetidos em um jogo."); return; }
    }

    await postAction("salvarJogosExcedentes",{ jogos: JSON.stringify(dados) });
});

// ================== CONFERÊNCIA ==================
function renderizarConferencia(){
    conferenciaContainer.innerHTML="";
    for(let i=0;i<6;i++){
        const input=document.createElement("input");
        input.type="number";
        input.min=1;
        input.max=60;
        input.className="input-numero"; // unificado
        conferenciaContainer.appendChild(input);
    }
}

function capturarConferencia(){
    return Array.from(conferenciaContainer.querySelectorAll("input"))
        .map(i=>i.value.trim())
        .filter(v=>v!=="")
        .map(n=>parseInt(n).toString().padStart(2,"0"));
}

btnConferir?.addEventListener("click",()=>{
    const sorteados=capturarConferencia();
    if(sorteados.length!==6) return alert("Informe exatamente 6 números sorteados.");

    resultadoConferencia.innerHTML=`<p class="loading">Conferindo resultados...</p>`;
    areaRateio.classList.add("hidden");

    const premiados={sena:[],quina:[],quadra:[]};
    todosDados.forEach(p=>{
        if(p.Jogos){
            p.Jogos.split('|').forEach((jogo,idx)=>{
                const acertos=jogo.split(' ').filter(n=>sorteados.includes(n.padStart(2,'0'))).length;
                if(acertos>=4)
                    premiados[acertos===6?'sena':acertos===5?'quina':'quadra'].push({...p,acertos,idx:idx+1,jogo});
            });
        }
    });

    let html=`<h4>Resultado da Conferência</h4><p><strong>Números:</strong> ${sorteados.join(' ')}</p><hr>`;
    ["sena","quina","quadra"].forEach(tipo=>{
        if(premiados[tipo].length){
            html+=`<h5>🎉 ${tipo.toUpperCase()} (${premiados[tipo].length})</h5>`;
            premiados[tipo].forEach(j=>html+=`<p>${j.Nome} (${j.Protocolo}) - Jogo ${j.idx}: <strong>${j.jogo}</strong></p>`);
        }
    });
    if(!premiados.sena.length&&!premiados.quina.length&&!premiados.quadra.length)
        html+=`<p style="color:red;">Nenhum premiado.</p>`;
    resultadoConferencia.innerHTML=html;
    areaRateio.classList.remove("hidden");
    document.rateioData={ totalPagos: todosDados.filter(p=>p.Status==='PAGO').length };
});

// ================== RATEIO ==================
btnCalcularRateio?.addEventListener("click",()=>{
    const total=parseFloat(inputValorPremio.value);
    const pagos=document.rateioData?.totalPagos||0;

    if(!total||total<=0) return mostrarRateio("Insira um valor válido.","red");
    if(pagos===0) return mostrarRateio("Nenhum participante pago.","red");

    const porPessoa=total/pagos;
    mostrarRateio(`💵 R$ ${total.toFixed(2).replace('.',',')} / ${pagos} → R$ ${porPessoa.toFixed(2).replace('.',',')} por participante.`,"green");
});

function mostrarRateio(msg,cor){
    resultadoRateio.textContent=msg;
    resultadoRateio.style.color=cor;
}
