// js/script.js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

const totalJogos = 5;
let jogoAtual = 1;
let selections = Array.from({length: totalJogos}, ()=> new Set()); // cada jogo: set de números (1..60)
const gradeEl = document.getElementById("grade-numeros");
const tituloJogo = document.getElementById("titulo-jogo");
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");
const btnAleatorio = document.getElementById("btnAleatorioJogo");

const resumoFinal = document.getElementById("resumo-final");
const resumoDados = document.getElementById("resumo-dados");
const aceito = document.getElementById("aceito");
const btnConfirmarEnvio = document.getElementById("btnConfirmarEnvio");
const btnVoltarEditar = document.getElementById("btnVoltarEditar");

const listaJogosDiv = document.getElementById("lista-jogos");
const consultaStats = document.getElementById("consulta-stats");

const obsStaticText = document.getElementById("obs-static").innerHTML;
document.getElementById("obs-static-resumo").innerHTML = obsStaticText;

// monta grades 1..60 (6 linhas x 10 colunas via CSS grid)
function buildGrade() {
  gradeEl.innerHTML = "";
  for (let n=1; n<=60; n++) {
    const btn = document.createElement("button");
    btn.className = "num-btn";
    btn.textContent = String(n).padStart(2,"0");
    btn.dataset.num = n;
    btn.onclick = () => toggleNumber(n, btn);
    gradeEl.appendChild(btn);
  }
}
buildGrade();

function updateGradeUI() {
  // limpa todas classes
  document.querySelectorAll(".num-btn").forEach(b => b.classList.remove("selecionado"));
  // aplica seleção atual
  const set = selections[jogoAtual-1];
  set.forEach(n => {
    const btn = document.querySelector(`.num-btn[data-num='${n}']`);
    if (btn) btn.classList.add("selecionado");
  });
  tituloJogo.textContent = `Jogo ${jogoAtual} de ${totalJogos}`;
  btnAnterior.disabled = jogoAtual === 1;
}

function toggleNumber(n, btnEl) {
  const s = selections[jogoAtual-1];
  if (s.has(n)) {
    s.delete(n);
    btnEl.classList.remove("selecionado");
  } else {
    if (s.size >= 6) {
      alert("Você já selecionou 6 números neste jogo.");
      return;
    }
    s.add(n);
    btnEl.classList.add("selecionado");
  }
}

btnAnterior.addEventListener("click", () => {
  if (jogoAtual > 1) {
    jogoAtual--;
    updateGradeUI();
  }
});

btnProximo.addEventListener("click", () => {
  const s = selections[jogoAtual-1];
  if (s.size === 6) {
    if (jogoAtual < totalJogos) {
      jogoAtual++;
      updateGradeUI();
    } else {
      // todos os jogos preenchidos? mostrar resumo
      // check if at least one jogo has 6 numbers. Requirement is up to 5 games; user may leave some empty?
      // We'll require each game to have either 6 numbers or be deliberately left empty.
      showResumoIfReady();
    }
  } else {
    // menos de 6 -> perguntar se deseja completar aleatoriamente
    const faltam = 6 - s.size;
    const confirmar = confirm(`Você selecionou apenas ${s.size} números. Deseja que o sistema complete aleatoriamente os ${faltam} números faltantes? Clique "OK" para completar automaticamente ou "Cancelar" para preencher manualmente.`);
    if (confirmar) {
      preencherAleatorioParaJogo(jogoAtual-1);
      updateGradeUI();
      // avançar (se ainda não for o último)
      if (jogoAtual < totalJogos) {
        jogoAtual++;
        updateGradeUI();
      } else {
        showResumoIfReady();
      }
    } else {
      // não completar -> bloqueia avanço até ter 6
      alert("Por favor, preencha os números faltantes para continuar.");
    }
  }
});

btnAleatorio.addEventListener("click", () => {
  // preenche ALEATORIAMENTE somente os números faltantes deste jogo
  preencherAleatorioParaJogo(jogoAtual-1);
  updateGradeUI();
});

// preenche aleatoriamente os números faltantes sem repetir no mesmo jogo
function preencherAleatorioParaJogo(index) {
  const s = selections[index];
  const used = Array.from(s);
  // pool of remaining numbers 1..60 not in used
  const pool = [];
  for (let i=1; i<=60; i++) if (!used.includes(i)) pool.push(i);
  shuffleArray(pool);
  while (s.size < 6 && pool.length > 0) {
    s.add(pool.pop());
  }
}

// Fisher-Yates
function shuffleArray(a) {
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

// quando finalizar, mostra resumo (apenas se todos os jogos tiverem 6 ou vazios)
function showResumoIfReady() {
  // require every non-empty jogo to have exactly 6 numbers
  for (let i=0;i<totalJogos;i++) {
    const s = selections[i];
    if (s.size > 0 && s.size !== 6) {
      alert(`O Jogo ${i+1} está incompleto. Complete 6 números ou deixe-o vazio.`);
      jogoAtual = i+1;
      updateGradeUI();
      return;
    }
  }
  // build resumo: default consider only jogos with 6 numbers
  const jogosList = selections.map((s,i) => {
    if (s.size === 6) {
      const arr = Array.from(s).sort((a,b)=>a-b).map(n => String(n).padStart(2,"0"));
      return arr.join(" ");
    }
    return "";
  });

  // show resumo section
  resumoFinal.style.display = "block";
  document.getElementById("submit-area").style.display = "none";

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.querySelector('input[name="pix"]:checked')?.value || "Não";

  resumoDados.innerHTML = `<p><strong>Nome:</strong> ${nome}<br><strong>Telefone:</strong> ${telefone}<br><strong>É chave PIX:</strong> ${pix}</p>
  <h4>Jogos</h4>
  ${jogosList.map((j,i)=> j ? `<p><strong>Jogo ${String(i+1).padStart(2,"0")}:</strong> ${j}</p>` : `<p><strong>Jogo ${String(i+1).padStart(2,"0")}:</strong> (não enviado)</p>`).join("")}`;

  // scroll to resumo
  resumoFinal.scrollIntoView({behavior:"smooth"});
}

// voltar para editar
btnVoltarEditar.addEventListener("click", () => {
  resumoFinal.style.display = "none";
  document.getElementById("submit-area").style.display = "block";
  jogoAtual = 1;
  updateGradeUI();
  window.scrollTo({top:0, behavior:"smooth"});
});

// confirmação final e envio (somente se aceito)
btnConfirmarEnvio.addEventListener("click", async () => {
  if (!document.getElementById("aceito").checked) { alert("Você precisa marcar 'Li e aceito os termos' antes de enviar."); return; }
  // preparar payload
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  if (!nome || !telefone) { alert("Nome e telefone são obrigatórios."); return; }

  const jogosList = selections.map(s => {
    if (s.size === 6) {
      return Array.from(s).sort((a,b)=>a-b).map(n=>String(n).padStart(2,"0")).join(" ");
    }
    return "";
  });

  const payload = {
    nome,
    telefone,
    pix: document.querySelector('input[name="pix"]:checked')?.value || "Não",
    jogos: jogosList,
    obs: document.getElementById("obs-static").innerText || "",
    origem: "web"
  };

  try {
    const resp = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data && data.status === "OK" && data.receipt) {
      // salvar local para confirmacao.html gerar comprovante
      localStorage.setItem("lastReceiptData", JSON.stringify({payload, receipt: data.receipt}));
      // redirecionar para confirmacao
      window.location.href = "confirmacao.html";
    } else {
      alert("Erro ao enviar. Tente novamente. " + (data && data.message ? data.message : ""));
    }
  } catch (err) {
    alert("Erro ao enviar: " + err.message);
  }
});

// Consulta "Ver Jogos" (primeiro nome + últimos 4 digitos)
document.getElementById("btnVerJogos").addEventListener("click", async () => {
  const nome = document.getElementById("verNome").value.trim().toLowerCase();
  const ultimos = document.getElementById("verTelefone").value.trim();
  if (!nome || !ultimos || ultimos.length < 2) { alert("Informe primeiro nome e últimos 4 dígitos do telefone."); return; }

  try {
    const res = await fetch(SCRIPT_URL + "?action=get");
    const dados = await res.json();
    // valida: encontra participante que tenha primeiro nome e últimos 4 dígitos
    const autorizado = dados.some(d => {
      const first = String(d.nome || "").trim().split(/\s+/)[0].toLowerCase();
      return first === nome.split(/\s+/)[0] && String(d.telefone || "").slice(-4) === ultimos;
    });
    if (!autorizado) { alert("Não foi possível validar seus dados. Verifique e tente novamente."); return; }

    const todosJogos = dados.flatMap(d => (d.jogos || []).filter(Boolean));
    if (todosJogos.length === 0) {
      listaJogosDiv.innerHTML = "<p>Nenhum jogo registrado ainda.</p>";
    } else {
      listaJogosDiv.innerHTML = "<h4>Todos os jogos registrados:</h4>" + todosJogos.map((j,i)=>`<p><strong>Jogo ${String(i+1).padStart(2,"0")}:</strong> ${j}</p>`).join("");
    }

    // stats
    const statsRes = await fetch(SCRIPT_URL + "?action=stats");
    const stats = await statsRes.json();
    consultaStats.innerHTML = `<p><strong>Total de participantes:</strong> ${stats.participants} — <strong>Total de jogos:</strong> ${stats.totalJogos}</p>`;
  } catch (err) {
    alert("Erro ao consultar jogos: " + err.message);
  }
});

// inicializa UI
updateGradeUI();
