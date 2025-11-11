// admin.js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";

// Login simples — armazenado no código
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

// Elementos
const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const listaParticipantes = document.getElementById("listaParticipantes");
const loginMsg = document.getElementById("loginMsg");

// LOGIN
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

// LOGOUT
document.getElementById("btnLogout").addEventListener("click", () => {
  adminArea.classList.add("hidden");
  loginArea.classList.remove("hidden");
  document.getElementById("adminUser").value = "";
  document.getElementById("adminPass").value = "";
});

// ATUALIZAR LISTA
document.getElementById("btnAtualizar").addEventListener("click", carregarParticipantes);

// Buscar dados
async function carregarParticipantes() {
  listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Carregando...</td></tr>`;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=get`);
    const data = await res.json();
    renderTabela(data);
  } catch (err) {
    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 py-4">Erro ao carregar: ${err.message}</td></tr>`;
  }
}

// Renderizar tabela
function renderTabela(dados) {
  if (!Array.isArray(dados) || dados.length === 0) {
    listaParticipantes.innerHTML = `<tr><td colspan="4" class="text-center py-4">Nenhum participante encontrado.</td></tr>`;
    return;
  }

  listaParticipantes.innerHTML = dados.map((p) => `
    <tr>
      <td class="py-2 px-3">${p.Nome}</td>
      <td class="py-2 px-3">${p.Telefone}</td>
      <td class="py-2 px-3 font-semibold ${p.Pago === "SIM" ? "text-green-600" : "text-red-500"}">${p.Pago || "NÃO"}</td>
      <td class="py-2 px-3 text-center">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2" onclick="confirmarPagamento('${p.ReceiptID}')">Confirmar Pagamento</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onclick="excluirParticipante('${p.ReceiptID}')">Excluir</button>
      </td>
    </tr>
  `).join("");
}

// Confirmar pagamento
async function confirmarPagamento(receipt) {
  if (!confirm("Confirmar pagamento deste participante?")) return;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "PUT",
      body: JSON.stringify({ receipt })
    });
    const data = await res.json();
    alert(data.message || "Status atualizado.");
    carregarParticipantes();
  } catch (err) {
    alert("Erro ao atualizar pagamento: " + err.message);
  }
}

// Excluir participante
async function excluirParticipante(receipt) {
  if (!confirm("Tem certeza que deseja excluir este participante?")) return;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "DELETE",
      body: JSON.stringify({ receipt })
    });
    const data = await res.json();
    alert(data.message || "Participante excluído.");
    carregarParticipantes();
  } catch (err) {
    alert("Erro ao excluir: " + err.message);
  }
}
