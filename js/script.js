const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
const numerosContainer = document.getElementById("numerosContainer");
const btnProximo = document.getElementById("proximo");
const btnEnviar = document.getElementById("enviar");
const form = document.getElementById("cadastroForm");
const msg = document.getElementById("mensagem");

let jogoAtual = 1;
let jogos = [];

function gerarNumeros() {
  numerosContainer.innerHTML = "";
  for (let i = 1; i <= 60; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = i.toString().padStart(2, "0");
    btn.onclick = () => {
      if (btn.classList.contains("selected")) {
        btn.classList.remove("selected");
      } else {
        const selecionados = document.querySelectorAll(".numeros-grid button.selected");
        if (selecionados.length >= 6) {
          alert("Você só pode selecionar 6 números por jogo.");
          return;
        }
        btn.classList.add("selected");
      }
      validarSelecao();
    };
    numerosContainer.appendChild(btn);
  }

  // adiciona botão de gerar aleatório
  const gerarAuto = document.createElement("button");
  gerarAuto.type = "button";
  gerarAuto.textContent = "Gerar Números Aleatórios";
  gerarAuto.classList.add("muted");
  gerarAuto.onclick = () => gerarAleatorios();
  numerosContainer.after(gerarAuto);
}

function gerarAleatorios() {
  const botoes = [...document.querySelectorAll(".numeros-grid button")];
  botoes.forEach(b => b.classList.remove("selected"));
  const numeros = [];
  while (numeros.length < 6) {
    const n = String(Math.floor(Math.random() * 60 + 1)).padStart(2, "0");
    if (!numeros.includes(n)) numeros.push(n);
  }
  botoes.forEach(b => {
    if (numeros.includes(b.textContent)) b.classList.add("selected");
  });
  validarSelecao();
}

gerarNumeros();

function validarSelecao() {
  const selecionados = document.querySelectorAll(".numeros-grid button.selected");
  btnProximo.disabled = selecionados.length !== 6;
}

btnProximo.onclick = () => {
  const selecionados = [...document.querySelectorAll(".numeros-grid button.selected")].map(b => b.textContent);
  if (selecionados.length !== 6) return alert("Você deve selecionar 6 números.");
  jogos.push(selecionados.join(" "));
  if (jogos.length < 5) {
    jogoAtual++;
    document.getElementById("titulo-jogo").textContent = `Jogo ${jogoAtual} de 5`;
    gerarNumeros();
  } else {
    btnProximo.style.display = "none";
    btnEnviar.disabled = false;
    msg.innerHTML = `
      <h3>Confirmação</h3>
      <p>Revise seus dados e clique em Confirmar:</p>
      <p>${jogos.map((j, i) => `Jogo ${i + 1}: ${j}`).join("<br>")}</p>
      <label><input type="checkbox" id="termos"> Li e concordo com os termos</label>
    `;
  }
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const termos = document.getElementById("termos");
  if (!termos?.checked) return alert("Você deve aceitar os termos.");

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const pix = document.getElementById("pix").value;

  const payload = { nome, telefone, pix, jogos };

  const resp = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (json?.status === "DUPLICATE") return alert("Participante já cadastrado com este nome e telefone!");
  if (json?.status === "OK") {
    alert("Aposta registrada com sucesso!");
    window.location.href = "consulta.html";
  } else {
    alert("Erro ao enviar, tente novamente.");
  }
};
