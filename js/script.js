// /js/admin.js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec"; // Use sua URL

// 5.1 - Login simples
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

// Elementos
const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const listaParticipantes = document.getElementById("listaParticipantes");
const loginMsg = document.getElementById("loginMsg");
const countParticipantes = document.getElementById("countParticipantes");
const countJogos = document.getElementById("countJogos");
const jogoSorteAtual = document.getElementById("jogoSorteAtual");
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

// --- 5.2 - CARREGAR DADOS E ESTATÍSTICAS ---

async function carregarParticipantes() {
  listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
  try {
    // Usa a ação que retorna todos os dados necessários
    const res = await fetch(`${SCRIPT_URL}?action=consultarBolao`);
    const data = await res.json();
    
    // Armazena dados do bolão para conferência
    todosDados = data.participantes || []; 

    // 5.2 - Atualiza Estatísticas
    const totalParticipantes = todosDados.length;
    const totalJogos = todosDados.reduce((acc, p) => acc + (p.Jogos?.split('|').length || 0), 0);
    countParticipantes.textContent = totalParticipantes;
    countJogos.textContent = totalJogos;

    // 5.4 - Atualiza Jogo da Sorte
    jogoSorteAtual.textContent = `Jogo atual: ${data.jogoDaSorte || "N/A"}`;
    
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

  listaParticipantes.innerHTML = dados.map((p) => {
    const jogosParticipante = p.Jogos.split('|').map((j, i) => `Jogo ${i + 1}: ${j}`).join(' | ');
    return `
      <tr>
        <td class="py-2 px-3">${p.Nome}<br><span style="font-size:0.8em; color:#555;">${jogosParticipante}</span></td>
        <td class="py-2 px-3">${p.Protocolo}</td>
        <td class="py-2 px-3 font-semibold ${p.Status === "PAGO" ? "text-green-600" : "text-red-500"}">${p.Status || "AGUARDANDO"}</td>
        <td class="py-2 px-3 text-center">
                    <button class="primary small mb-1" onclick="confirmarPagamento('${p.Protocolo}')">Confirmar Pagamento</button>
          <button class="danger small" onclick="excluirParticipante('${p.Protocolo}')">Excluir</button>
        </td>
      </tr>
  `;
  }).join("");
}

// --- 5.3 - AÇÕES DE GERENCIAMENTO ---

window.confirmarPagamento = async (protocolo) => { // Tornada global
  if (!confirm(`Confirmar pagamento para o protocolo ${protocolo}?`)) return;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=excluir&protocolo=${protocolo}` // Apps Script deve processar
    });
    const data = await res.json();
    alert(data.message || "Participante excluído.");
    carregarParticipantes();
  } catch (err) {
    alert("Erro ao excluir: " + err.message);
  }
}

// --- 5.4 - JOGO DA SORTE ---

btnSalvarJogoSorte.onclick = async () => {
  const numeros = inputJogoSorte.value.trim();
  const numerosArray = numeros.split(/\s+/).filter(n => n.length > 0);
  
  if (numerosArray.length !== 9 || numerosArray.some(n => isNaN(parseInt(n)) || parseInt(n) < 1 || parseInt(n) > 60)) {
    alert("Por favor, insira exatamente 9 números válidos (entre 01 e 60) separados por espaço.");
    return;
  }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=salvarJogoSorte&jogo=${numeros}` // Apps Script deve processar
    });
    const data = await res.json();
    if (data.success) {
      alert("Jogo da Sorte salvo com sucesso!");
      carregarParticipantes(); // Atualiza a exibição
    } else {
      throw new Error(data.message || "Erro desconhecido.");
    }
  } catch (err) {
    alert("Erro ao salvar Jogo da Sorte: " + err.message);
  }
}

// --- 5.5 / 5.6 - CONFERÊNCIA DE PRÊMIOS ---

btnConferir.onclick = () => {
  const sorteadosStr = inputSorteados.value.trim();
  const sorteadosArray = sorteadosStr.split(/\s+/).filter(n => n.length > 0).map(n => n.padStart(2, '0')).sort();
  
  if (sorteadosArray.length !== 6) {
    alert("Por favor, insira exatamente 6 números sorteados separados por espaço.");
    return;
  }
  
  resultadoConferencia.innerHTML = "Conferindo...";
  areaRateio.classList.add('hidden');
  
  let premiados = {
    sena: [], // 6 acertos
    quina: [], // 5 acertos
    quadra: [] // 4 acertos
  };
  
  let totalJogosPremiados = 0;

  // Itera sobre os participantes e seus jogos
  todosDados.forEach(participante => {
    const jogos = participante.Jogos.split('|');
    jogos.forEach((jogoStr, index) => {
      const jogoParticipante = jogoStr.split(' ').map(n => n.padStart(2, '0'));
      let acertos = 0;
      
      jogoParticipante.forEach(num => {
        if (sorteadosArray.includes(num)) {
          acertos++;
        }
      });

      if (acertos >= 4) {
        const premio = acertos === 6 ? 'sena' : acertos === 5 ? 'quina' : 'quadra';
        premiados[premio].push({
          nome: participante.Nome,
          protocolo: participante.Protocolo,
          jogo: jogoStr,
          acertos: acertos,
          numJogo: index + 1 // Jogo 1, 2, 3...
        });
        totalJogosPremiados++;
      }
    });
  });

  // Exibe resultados
  let resultadoHtml = `<h4>Resultado da Conferência:</h4>`;
  resultadoHtml += `<p><strong>Números Sorteados:</strong> ${sorteadosArray.join(' ')}</p><hr>`;
  
  if (totalJogosPremiados === 0) {
    resultadoHtml += `<p style="color:red; font-weight:bold;">Nenhum jogo premiado (Sena, Quina ou Quadra) encontrado.</p>`;
  } else {
    const renderPremios = (lista, titulo) => {
      if (lista.length > 0) {
        resultadoHtml += `<h5>🎉 **${titulo} (${lista.length} jogos):**</h5>`;
        lista.forEach(p => {
          resultadoHtml += `<p style="margin-left:15px; font-size:0.9em;">
            ${p.nome} (${p.protocolo}) acertou ${p.acertos} números no Jogo ${p.numJogo}: <strong>${p.jogo}</strong>
          </p>`;
        });
      }
    };

    renderPremios(premiados.sena, 'SENA (6 Acertos)');
    renderPremios(premiados.quina, 'QUINA (5 Acertos)');
    renderPremios(premiados.quadra, 'QUADRA (4 Acertos)');
    
    areaRateio.classList.remove('hidden'); // Mostra a área de rateio
  }
  
  resultadoConferencia.innerHTML = resultadoHtml;
  
  // Armazena temporariamente os premiados para o rateio
  document.rateioData = {
    totalParticipantesPagos: todosDados.filter(p => p.Status === 'PAGO').length,
    premiados: premiados
  };
};

// --- 5.6 - CÁLCULO DE RATEIO ---

btnCalcularRateio.onclick = () => {
  const valorTotal = parseFloat(inputValorPremio.value);
  const totalParticipantesPagos = document.rateioData.totalParticipantesPagos;
  
  if (isNaN(valorTotal) || valorTotal <= 0) {
    resultadoRateio.textContent = "Insira um valor de prêmio válido.";
    resultadoRateio.style.color = "red";
    return;
  }
  
  if (totalParticipantesPagos === 0) {
    resultadoRateio.textContent = "Não há participantes com status 'PAGO' para rateio.";
    resultadoRateio.style.color = "red";
    return;
  }
  
  const valorPorParticipante = valorTotal / totalParticipantesPagos;
  
  resultadoRateio.textContent = `O valor de R$ ${valorTotal.toFixed(2).replace('.', ',')} será dividido igualmente entre ${totalParticipantesPagos} participantes PAGOS. Cada participante receberá R$ ${valorPorParticipante.toFixed(2).replace('.', ',')}.`;
  resultadoRateio.style.color = "green";
};


// Inicia o carregamento dos dados após o login
// Se o usuário já estiver logado (para testes), a função `carregarParticipantes` deve ser chamada.
// No seu HTML, ela é chamada no sucesso do login.
// Em um ambiente de produção, seria necessário um controle de sessão mais robusto.
