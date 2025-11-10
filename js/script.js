// script.js - lógica de frontend
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec"; // <<-- substitua

const totalJogos = 5;
let jogoAtual = 1;
let jogos = new Array(totalJogos).fill(null).map(()=>new Array(6).fill("")); // cada jogo 6 slots

const jogosArea = document.getElementById("jogos-area");
const tituloJogo = document.getElementById("titulo-jogo");

function pad(n){ return String(n).padStart(2,"0"); }

// render jogo atual
function renderJogo() {
  tituloJogo.textContent = `Jogo ${jogoAtual} de ${totalJogos}`;
  jogosArea.innerHTML = "";
  const card = document.createElement("div");
  card.className = "jogo-card";

  const grid = document.createElement("div");
  grid.className = "jogo-grid";
  for (let i=0;i<6;i++) {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.maxLength = 2;
    inp.placeholder = pad(i+1);
    inp.value = jogos[jogoAtual-1][i] || "";
    inp.oninput = (e) => {
      let v = e.target.value.replace(/\D/g,"");
      if (v !== "") {
        let num = Number(v);
        if (num < 1) num = 1;
        if (num > 60) num = 60;
        v = String(num);
      }
      e.target.value = v;
      jogos[jogoAtual-1][i] = v;
    };
    grid.appendChild(inp);
  }

  card.appendChild(grid);
  jogosArea.appendChild(card);
}
renderJogo();

// botões
document.getElementById("btnProximo").onclick = () => {
  // validações: pode passar mesmo com campos vazios, mas quando enviar final, garantimos ter 6 por jogo (preenche aleatoriamente)
  if (jogoAtual < totalJogos) {
    jogoAtual++;
    updateNavButtons();
    renderJogo();
  } else {
    alert("Último jogo — clique Concluir e Enviar para gravar seu bolão.");
  }
};

document.getElementById("btnAnterior").onclick = () => {
  if (jogoAtual > 1) {
    jogoAtual--;
    updateNavButtons();
    renderJogo();
  }
};

function updateNavButtons(){
  document.getElementById("btnAnterior").disabled = (jogoAtual===1);
}
updateNavButtons();

// preencher aleatoriamente o JOGO atual (somente números não preenchidos)
document.getElementById("btnAleatorioJogo").onclick = () => {
  preencherAleatorioParaJogo(jogoAtual-1);
  renderJogo();
};

// completa um jogo com números random sem repetir dentro do mesmo jogo
function preencherAleatorioParaJogo(index) {
  const used = jogos[index].filter(Boolean).map(Number);
  const slots = jogos[index].map((v,i)=> v?null:i).filter(v=>v!==null);
  // generate pool
  const pool = [];
  for (let n=1;n<=60;n++) if (!used.includes(n)) pool.push(n);
  // shuffle pool
  for (let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  // fill slots
  for (let i=0;i<6;i++){
    if (!jogos[index][i]) {
      jogos[index][i] = String(pool.pop());
    }
  }
}

// função que normaliza e valida todos os jogos antes do envio - preenche aleatoriamente qualquer jogo incompleto
function prepararJogosParaEnvio() {
  for (let gi=0; gi<totalJogos; gi++) {
    // se todos vazios -> considera jogo não enviado (deixa vazio)
    const allEmpty = jogos[gi].every(v=>!v);
    if (allEmpty) {
      jogos[gi] = ["","","","","",""];
      continue;
    }
    // preencher faltantes
    const filled = jogos[gi].map(v => v?Number(v):null);
    // remove duplicates and ensure 1-60
    let used = filled.filter(n=>n).map(Number);
    used = used.filter((v,i,arr)=>arr.indexOf(v)===i);
    // fill missing with random no-repeat
    for (let i=0;i<6;i++){
      if (!filled[i]) {
        // pick random not used
        let candidate;
        do { candidate = Math.floor(Math.random()*60)+1; } while (used.includes(candidate));
        filled[i] = candidate;
        used.push(candidate);
      }
    }
    jogos[gi] = filled.map(n=>pad(n));
  }
  // convert jogo arrays to string or empty if all empty
  const out = jogos.map(g=>{
    if (g.every(v=>!v || v==="00")) return "";
    return g.map(n=>pad(Number(n))).join(" ");
  });
  return out;
}

// enviar dados
document.getElementById("btnEnviar").onclick = async () => {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.querySelector('input[name="pix"]:checked')?.value || "Não";
  if (!nome || !telefone) { alert("Preencha nome e telefone."); return; }

  const jogosParaEnviar = prepararJogosParaEnvio();
  // se nenhum jogo informado -> avisar
  if (jogosParaEnviar.every(j=>!j)) {
    if (!confirm("Você não preencheu nenhum número. Deseja enviar mesmo assim?")) return;
  }

  const payload = {
    nome: nome,
    telefone: telefone,
    pix: pix,
    jogos: jogosParaEnviar,
    obs: document.getElementById("obs-static").innerText,
    origem: "web"
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "OK" && data.receipt) {
      // gerar comprovante em PDF simples
      gerarComprovantePDF(payload, data.receipt);
      // salvar local para confirmar na pagina de confirmação
      localStorage.setItem("dadosBolao", JSON.stringify({payload, receipt:data.receipt}));
      // redireciona para confirmação
      window.location.href = "confirmacao.html";
    } else {
      alert("Erro ao enviar: " + (data.message || "resposta inesperada"));
    }
  } catch (err) {
    alert("Erro ao enviar: " + err.message);
  }
};

// gerar comprovante (PDF) e baixar automaticamente (usa jsPDF via CDN no confirm page)
// Aqui apenas criaremos um link para baixar o comprovante após o envio (a confirmação fará o download)
// Para simplificar, a geração real do PDF fica em confirmacao.html para ter a lib jsPDF disponível.
function gerarComprovantePDF(payload, receipt) {
  // apenas guarda no localStorage; geração do PDF será feita na confirmacao.html
  localStorage.setItem("lastReceiptData", JSON.stringify({payload, receipt}));
}

// ----------------------------------------------------
// Consulta jogos (verificação por primeiro nome + ultimos 4)
document.getElementById("btnVerJogos").onclick = async () => {
  const nome = document.getElementById("verNome").value.trim().toLowerCase();
  const ultimos = document.getElementById("verTelefone").value.trim();
  if (!nome || !ultimos) { alert("Informe primeiro nome e últimos 4 dígitos."); return; }
  try {
    const res = await fetch(SCRIPT_URL + "?action=get");
    const dados = await res.json();
    // valida
    const autorizado = dados.some(d => d.nome.toLowerCase().split(" ")[0] === nome.split(" ")[0] && String(d.telefone).slice(-4) === ultimos);
    if (!autorizado) { alert("Não foi possível validar seus dados."); return; }
    // exibe todos os jogos (apenas números, anonimamente)
    const todosJogos = dados.flatMap(d => d.jogos.filter(Boolean));
    const div = document.getElementById("lista-jogos");
    if (todosJogos.length === 0) div.innerHTML = "<p>Nenhum jogo registrado ainda.</p>";
    else div.innerHTML = "<h4>Todos os jogos registrados:</h4>" + todosJogos.map((j,i)=>`<p><strong>Jogo ${pad(i+1)}:</strong> ${j}</p>`).join("");
    // stats
    const statsRes = await fetch(SCRIPT_URL + "?action=stats");
    const stats = await statsRes.json();
    document.getElementById("consulta-stats").innerHTML = `<p><strong>Total de participantes:</strong> ${stats.participants} — <strong>Total de jogos:</strong> ${stats.totalJogos}</p>`;
  } catch (err) {
    alert("Erro ao consultar jogos: " + err.message);
  }
};
