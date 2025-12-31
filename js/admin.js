// === /js/admin.js - ADMIN COMPLETO (CORREÇÃO CONFERÊNCIA E VALIDAÇÕES) ===
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const el = id => document.getElementById(id);

// ==== ELEMENTOS HTML ====
const loginArea = el("loginArea");
const adminArea = el("adminArea");
const loginMsg = el("loginMsg");

const listaParticipantes = el("listaParticipantes");
const countParticipantes = el("countParticipantes");
const countJogos = el("countJogos");

// NOVOS ELEMENTOS (AJUSTADOS AOS IDs do HTML)
const inputPesquisa = el("searchProtocoloNome"); 
const selectFiltroStatus = el("statusFilter"); 
const paginacaoContainer = el("paginationContainer"); 

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

// ==== VARIÁVEIS GLOBAIS CORRIGIDAS ====
let todosDados = []; 
let dadosFiltradosEPesquisados = []; 
const PARTICIPANTES_POR_PAGINA = 10;
let paginaAtual = 1;

let jogoSorteAtual = [];				
let jogosExcedentes = [];				
let jogosExcedentesEmEdicao = []; 
let accessToken = localStorage.getItem("adminToken") || null;

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
				const formData = new FormData();
				formData.append("action", "login");
				formData.append("user", user);
				formData.append("pass", pass);

				const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
				let data;
				try { data = await res.json(); }
				catch (e) { const text = await res.text(); data = { success: false, message: text }; }

				if (data.success && data.token) {
						accessToken = data.token;
						localStorage.setItem("adminToken", accessToken);
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
				console.error(err);
		}
});

btnLogout?.addEventListener("click", () => {
		adminArea.classList.add("hidden");
		loginArea.classList.remove("hidden");
		el("adminUser").value = "";
		el("adminPass").value = "";
		loginMsg.classList.add("hidden");
		accessToken = null;
		localStorage.removeItem("adminToken");
});

// ================== CARREGAR PARTICIPANTES E STATUS ==================
async function carregarParticipantes() {
		if (!accessToken) { alert("Erro: Sessão expirada."); btnLogout?.click(); return; }

		listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
		try {
				// 1. CARREGAR STATUS DO BOLÃO (FECHADO/ABERTO)
				const resStatus = await fetch(SCRIPT_URL + "?action=getBolaoStatus");
				const dataStatus = await resStatus.json();
				if (el("checkFecharBolao")) {
					el("checkFecharBolao").checked = dataStatus.fechado === "true";
				}

				// 2. CARREGAR DADOS DOS PARTICIPANTES
				const formData = new FormData();
				formData.append("action", "getAdminData");
				formData.append("token", accessToken);
				
				const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
				const data = await res.json();

				if (data.message && data.message.includes("negado")) {
						alert(data.message);
						btnLogout?.click();
						return;
				}

				todosDados = data.participantes || [];
				countParticipantes.textContent = todosDados.length;
				countJogos.textContent = todosDados.reduce((acc,p) => acc + (p.Jogos?.split('|').length||0),0);

				aplicarFiltroPesquisaEpaginacao();

				// Jogo da Sorte
				if (data.jogoDaSorte) {
						jogoSorteAtual = Array.from(new Set(String(data.jogoDaSorte).split(/\s+/).filter(Boolean)))
								.map(n => n.toString().padStart(2,'0'));
				} else {
						jogoSorteAtual = [];
				}
				jogoSorteAtual.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
				renderizarJogoSorte();
				renderizarInputsJogoSorte();

				// Jogos Excedentes
				let rawExcedentes = data.jogosExcedentes || data.jogosAdm || [];
				if (!Array.isArray(rawExcedentes)) rawExcedentes = [];
				jogosExcedentes = rawExcedentes.map(item => {
						if (typeof item === 'string') {
								return item.split(/\s+/).filter(Boolean).map(n => String(n).padStart(2,'0')).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).join(" ");
						}
						return "";
				}).filter(str => str.length > 0);
				jogosExcedentesEmEdicao = [];
				renderizarTodosExcedentes();

				renderizarConferencia();
		} catch (err) {
				listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Erro ao carregar dados: ${err.message}</td></tr>`;
		}
}

// EVENTO PARA SALVAR STATUS DO BOLÃO
el("btnSalvarStatusBolao")?.addEventListener("click", async () => {
	const fechado = el("checkFecharBolao").checked;
	const formData = new FormData();
	formData.append("action", "setBolaoStatus");
	formData.append("fechado", fechado);
	formData.append("token", accessToken);

	try {
		const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
		const data = await res.json();
		if(data.success) alert("Status do bolão atualizado com sucesso!");
		else alert("Erro ao atualizar status: " + data.message);
	} catch (e) {
		alert("Erro de conexão ao salvar status.");
	}
});

btnAtualizar?.addEventListener("click", carregarParticipantes);

// ================== FILTRO, PESQUISA E PAGINAÇÃO ==================
inputPesquisa?.addEventListener("input", () => {
		paginaAtual = 1;
		aplicarFiltroPesquisaEpaginacao();
});

selectFiltroStatus?.addEventListener("change", () => {
		paginaAtual = 1;
		aplicarFiltroPesquisaEpaginacao();
});

function aplicarFiltroPesquisaEpaginacao() {
		const statusFiltro = selectFiltroStatus?.value || "TODOS";
		let dadosFiltrados = todosDados.filter(p => {
				const status = p.Status || "AGUARDANDO PAGAMENTO";
				if (statusFiltro === "PAGO") return status === "PAGO";
				if (statusFiltro === "AGUARDANDO PAGAMENTO") return status !== "PAGO"; 
				return true;
		});

		const termoPesquisa = inputPesquisa?.value.trim().toLowerCase() || "";
		if (termoPesquisa) {
				dadosFiltrados = dadosFiltrados.filter(p => {
						const nome = (p.Nome || "").toLowerCase();
						const protocolo = (p.Protocolo || "").toLowerCase();
						return nome.includes(termoPesquisa) || protocolo.includes(termoPesquisa);
				});
		}

		dadosFiltradosEPesquisados = dadosFiltrados;
		const indiceInicial = (paginaAtual - 1) * PARTICIPANTES_POR_PAGINA;
		const indiceFinal = indiceInicial + PARTICIPANTES_POR_PAGINA;
		const dadosPaginados = dadosFiltradosEPesquisados.slice(indiceInicial, indiceFinal);

		renderTabela(dadosPaginados);
		renderizarPaginacao();
}

function renderizarPaginacao() {
		const totalPaginas = Math.ceil(dadosFiltradosEPesquisados.length / PARTICIPANTES_POR_PAGINA);
		paginacaoContainer.innerHTML = "";
		paginacaoContainer.className = "pagination-controls"; 

		if (totalPaginas <= 1) return;

		const btnAnterior = document.createElement('button');
		btnAnterior.textContent = '« Anterior';
		btnAnterior.disabled = paginaAtual === 1;
		btnAnterior.onclick = () => {
				if (paginaAtual > 1) {
						paginaAtual--;
						aplicarFiltroPesquisaEpaginacao();
				}
		};
		paginacaoContainer.appendChild(btnAnterior);

		const spanInfo = document.createElement('span');
		spanInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
		spanInfo.className = 'pagination-info';
		paginacaoContainer.appendChild(spanInfo);

		const btnProxima = document.createElement('button');
		btnProxima.textContent = 'Próxima »';
		btnProxima.disabled = paginaAtual === totalPaginas;
		btnProxima.onclick = () => {
				if (paginaAtual < totalPaginas) {
						paginaAtual++;
						aplicarFiltroPesquisaEpaginacao();
				}
		};
		paginacaoContainer.appendChild(btnProxima);
}

window.toggleJogos = function(protocolo) {
		const elementoJogos = document.getElementById(`jogos-${protocolo}`);
		const btn = document.getElementById(`btn-toggle-${protocolo}`);
		if (elementoJogos.classList.contains('hidden')) {
				elementoJogos.classList.remove('hidden');
				btn.textContent = 'Ocultar Jogos';
		} else {
				elementoJogos.classList.add('hidden');
				btn.textContent = 'Exibir Jogos';
		}
}

function renderTabela(dados) {
		if (!dados.length) {
				listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum participante encontrado.</td></tr>`;
				return;
		}

		listaParticipantes.innerHTML = dados.map(p => {
				const status = p.Status === "PAGO" ? "PAGO" : "PENDENTE";
				const statusClass = status === "PAGO" ? "text-green-600" : "text-red-500";
				const jogosContent = p.Jogos?.split('|').join('<br>') || '';

				return `
						<tr>
								<td class="py-2 px-3 border">
										<strong>${p.Nome}</strong><br>
										<button id="btn-toggle-${p.Protocolo}" class="muted small mt-1" onclick="toggleJogos('${p.Protocolo}')">Exibir Jogos</button>
										<div id="jogos-${p.Protocolo}" class="mt-1 p-2 bg-gray-50 border rounded text-xs hidden">
												${jogosContent}
										</div>
								</td>
								<td class="py-2 px-3 border text-center">${p.Protocolo}</td>
								<td class="py-2 px-3 border text-center ${statusClass}">${status}</td>
								<td class="py-2 px-3 border text-center">
										<button class="primary small" onclick="confirmarPagamento('${p.Protocolo}')">💰 Confirmar</button><br>
										<button class="danger small" onclick="excluirParticipante('${p.Protocolo}')">🗑 Excluir</button>
								</td>
						</tr>
				`;
		}).join("");
}

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
				const formData = new FormData();
				formData.append("action", action);
				formData.append("token", accessToken);
				for (const k in params) formData.append(k, params[k]);

				const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
				let data;
				try { data = await res.json(); }
				catch (e) { const text = await res.text(); data = { success: false, message: text }; }

				if(data.success) {
						alert(data.message || "Ação concluída.");
				} else {
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
		const numerosParaMostrar = jogoSorteAtual.length === 9 ? jogoSorteAtual : Array(9).fill("-");
		numerosParaMostrar.forEach(num=>{
				const div=document.createElement("div");
				div.className="jogo-numero" + (num === "-" ? " empty" : "");	
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
				input.className="input-numero";
				input.value = "";	
				jogoSorteInputs.appendChild(input);
		}
}

btnSalvarJogoSorte?.addEventListener("click", async()=>{
		let numeros = Array.from(jogoSorteInputs.querySelectorAll("input"))
				.map(i=>i.value.trim())
				.filter(v=>v!=="")
				.map(n=>parseInt(n).toString().padStart(2,"0"));

		if(numeros.length!==9){ alert("Informe exatamente 9 números."); return; }
		if(new Set(numeros).size!==9){ alert("Não é permitido números repetidos."); return; }
		if(numeros.some(n=>isNaN(parseInt(n))||parseInt(n)<1||parseInt(n)>60)){ alert("Números entre 01 e 60."); return; }
		numeros.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
		await postAction("salvarJogoSorte",{ jogo:numeros.join(" ") });
});

btnApagarJogoSorte?.addEventListener("click", async()=>{
		if(!confirm("Deseja apagar todos os números do Jogo da Sorte?")) return;
		await postAction("salvarJogoSorte",{ jogo:"" });
});

// ================== JOGOS EXCEDENTES ==================
function renderizarExcedente(index){
		const div=document.createElement("div");
		div.className="flex gap-2 mb-2";	
		div.dataset.index=index;
		const jogo = jogosExcedentesEmEdicao[index] || ["","","","","",""];
		for(let i=0;i<6;i++){
				const input=document.createElement("input");
				input.type="number";
				input.min=1;
				input.max=60;
				input.className="input-numero";
				input.value=jogo[i] || "";
				div.appendChild(input);
		}
		const btnRemove=document.createElement("button");
		btnRemove.textContent="🗑";
		btnRemove.type="button";
		btnRemove.className="danger small";
		btnRemove.onclick=()=>{
				const grids = Array.from(excedentesContainer.querySelectorAll("div[data-index]"));
				grids.forEach((g, idx) => {
						const vals = Array.from(g.querySelectorAll("input")).map(i=>i.value.trim().padStart(2,"0"));	
						jogosExcedentesEmEdicao[idx] = vals;	
				});
				jogosExcedentesEmEdicao.splice(index,1);
				renderizarTodosExcedentes();
		};
		div.appendChild(btnRemove);
		return div;
}

function renderizarTodosExcedentes(){
		excedentesContainer.innerHTML="";
		jogosExcedentesEmEdicao.forEach((_,idx)=>{ excedentesContainer.appendChild(renderizarExcedente(idx)); });
}

btnAddExcedente?.addEventListener("click", ()=>{
		const grids = excedentesContainer.querySelectorAll("div[data-index]");
		grids.forEach((grid, idx) => {
				const vals = Array.from(grid.querySelectorAll("input")).map(i => i.value.trim().padStart(2,"0"));
				jogosExcedentesEmEdicao[idx] = vals;
		});
		jogosExcedentesEmEdicao.push(["","","","","",""]);
		renderizarTodosExcedentes();
});

btnSalvarExcedentes?.addEventListener("click", async()=>{
		const grids = excedentesContainer.querySelectorAll("div[data-index]");
		const dados = Array.from(grids).map(grid =>
				Array.from(grid.querySelectorAll("input")).map(i => i.value.trim().padStart(2,"0"))
		);
		let jogosStrings = [];
		for(const jogo of dados){
				if(jogo.some(n=>!n)) { alert("Preencha todos os números de cada jogo."); return; }
				const numerosInt = jogo.map(n => parseInt(n, 10));
				if(numerosInt.some(n => n < 1 || n > 60)){	
						alert("Todos os números devem estar entre 01 e 60.");	
						return;	
				}
				if(new Set(jogo.filter(n=>n && n!=="00")).size!==6){ alert("Não é permitido números repetidos em um jogo."); return; }
				jogo.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
				jogosStrings.push(jogo.join(" "));
		}
		if (dados.length === 0) {
				const confirmClear = confirm("Apagar todos os jogos excedentes?");
				if (!confirmClear) return;
				await postAction("salvarJogosAdm", { jogos: "" });
				return;
		}
		const payloadStr = jogosStrings.join("|");
		await postAction("salvarJogosAdm",{ jogos: payloadStr });
});

// ================== CONFERÊNCIA ==================
function renderizarConferencia(){
		conferenciaContainer.innerHTML="";
		for(let i=0;i<6;i++){
				const input=document.createElement("input");
				input.type="number";
				input.min=1;
				input.max=60;
				input.className="input-numero";
				conferenciaContainer.appendChild(input);
		}
}

function capturarConferencia(){
		const arr = Array.from(conferenciaContainer.querySelectorAll("input"))
				.map(i=>i.value.trim())
				.filter(v=>v!=="")
				.map(n=>parseInt(n).toString().padStart(2,"0"));
		arr.sort((a,b) => parseInt(a,10) - parseInt(b,10));
		return arr;
}

btnConferir?.addEventListener("click",()=>{
		const sorteados = capturarConferencia();
		if(sorteados.length!==6) return alert("Informe exatamente 6 números sorteados.");

		resultadoConferencia.innerHTML=`<p class="loading">Conferindo resultados...</p>`;
		areaRateio.classList.add("hidden");

		const premiados = { 6: [], 5: [], 4: [] }; 

		const conferirJogo = (jogoString, tipo, nome, protocolo) => {
				if (!jogoString) return;
				const nums = jogoString.split(/\s+/).filter(Boolean).map(n=>n.padStart(2,'0'));
				if (nums.length < 6) return;
				const jogoOrdenado = nums.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
				const acertos = jogoOrdenado.filter(n => sorteados.includes(n)).length;
				if(acertos >= 4){
						premiados[acertos].push({
								Nome: nome,
								Protocolo: protocolo,
								acertos: acertos,
								tipo: tipo,
								jogo: jogoOrdenado.join(" ")
						});
				}
		};

		todosDados.forEach(p => {
				if(p.Jogos){
						const jogosDoParticipante = p.Jogos.split('|').filter(Boolean);
						jogosDoParticipante.forEach(jogoStr => {
								conferirJogo(jogoStr, "Participante", p.Nome, p.Protocolo);
						});
				}
		});

		if (jogoSorteAtual && jogoSorteAtual.length === 9) {
				conferirJogo(jogoSorteAtual.join(' '), "Jogo da Sorte", "Jogo da Sorte", "-");
		}

		jogosExcedentes.forEach(jogoStr => {
				conferirJogo(jogoStr, "Excedente", "Jogo Excedente", "-");
		});

		const sorteadosBolinhas = sorteados.map(num =>	
				`<div class="jogo-numero" style="width: 35px; height: 35px; font-size: 0.9rem;">${num}</div>`
		).join('');
			
		let html=`<h4 class="section-title">Resultado da Conferência</h4>
							<p><strong>Números Sorteados:</strong></p>
							<div class="jogo-numero-container" style="margin-bottom: 1.5rem;">${sorteadosBolinhas}</div>
							<hr>`;
			
		let houvePremio = false;
		[6, 5, 4].forEach(acertos => {
				const tipo = acertos === 6 ? "Sena" : acertos === 5 ? "Quina" : "Quadra";
				const premiadosDoTipo = premiados[acertos];
				if(premiadosDoTipo && premiadosDoTipo.length){
						houvePremio = true;
						html+=`<h5><span style="color:#008000">🎉 ${tipo.toUpperCase()} (${premiadosDoTipo.length} JOGOS)</span></h5>`;
						premiadosDoTipo.forEach(j => {
								let infoDetalhe = j.tipo === "Participante" ? `Protocolo: ${j.Protocolo}` : `Categoria: ${j.tipo}`;
								let nomeDoPremio = j.tipo === "Participante" ? `Participante: ${j.Nome}` : j.tipo;
								html+=`<p style="margin: 5px 0;"><strong>${tipo}</strong> (${j.acertos} Acertos)<br>${nomeDoPremio}<br>${infoDetalhe}<br>Jogo: <strong>${j.jogo}</strong></p>`;
						});
						html += `<hr style="margin: 10px 0;">`;
				}
		});

		if (!houvePremio) html+=`<p style="color:red; font-weight: bold; text-align: center;">Nenhum jogo premiado.</p>`;
		resultadoConferencia.innerHTML = html.replace(/<hr style="margin: 10px 0;">$/, '');
		areaRateio.classList.remove("hidden");
		document.rateioData = { totalPagos: todosDados.filter(p=>p.Status==='PAGO').length };
});

// ================== RATEIO ==================
function formatCurrency(value) {
		if (isNaN(value)) return "R$ 0,00";
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);
}

btnCalcularRateio?.addEventListener("click",()=>{
		const total=parseFloat(inputValorPremio.value.replace('.', '').replace(',', '.')); 
		const pagos=document.rateioData?.totalPagos||0;
		if(isNaN(total) || total<=0) return mostrarRateio("Insira um valor válido.","red");
		if(pagos===0) return mostrarRateio("Nenhum participante pago.","red");
		const porPessoa=total/pagos;
		mostrarRateio(`💵 ${formatCurrency(total)} / ${pagos} → ${formatCurrency(porPessoa)} por participante.`, "green");
});

function mostrarRateio(msg,cor){
		resultadoRateio.textContent=msg;
		resultadoRateio.style.color=cor;
}