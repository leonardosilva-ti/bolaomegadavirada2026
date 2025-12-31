document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // CONFIGURAÇÃO
    // ================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylsOPklfzElA8ZYF7wYneORp5nWymkrnDzXhVK-onsnb9PXze16S50yVbu059g_w4tLA/exec";
    const CHAVE_PIX = "88f77025-40bc-4364-9b64-02ad88443cc4";
    const MAX_NUMEROS = 6;
    const TOTAL_JOGOS = 5;

    // ================================
    // REFERÊNCIAS DO DOM
    // ================================
    const containerJogos = document.getElementById('container-jogos');
    const displaysJogos = document.querySelectorAll('.jogo-display');

    const limparJogoBtn = document.getElementById('limpar-jogo-btn');
    const preencherAleatoriamenteBtn = document.getElementById('preencher-aleatoriamente-btn');
    const proximoJogoBtn = document.getElementById('proximo-jogo-btn');
    const confirmarApostaBtn = document.getElementById('confirmar-aposta-btn');

    const copiarPixBtn = document.getElementById('copiar-pix-btn');
    const chavePixDisplay = document.getElementById('chave-pix-display');

    // ================================
    // ESTADO
    // ================================
    let jogos = [[], [], [], [], []];
    let jogoAtivo = 0;

    // ================================
    // FUNÇÕES DE STATUS (BOLÃO FECHADO)
    // ================================

    async function verificarStatusBolao() {
        try {
            const res = await fetch(SCRIPT_URL + "?action=getBolaoStatus");
            const data = await res.json();
            
            if (data.fechado === "true" || data.fechado === true) {
                const aberto = document.getElementById('conteudo-bolao-aberto');
                const fechado = document.getElementById('mensagem-bolao-fechado');
                
                if (aberto) aberto.classList.add('hidden');
                if (fechado) {
                    fechado.classList.remove('hidden');
                    fechado.style.display = 'block'; // Garante visibilidade se não usar apenas classes
                }
            }
        } catch (e) {
            console.error("Erro ao validar status do bolão", e);
        }
    }

    // ================================
    // FUNÇÕES VISUAIS E INTERFACE
    // ================================

    function atualizarDisplay(jogoIndex) {
        const jogo = jogos[jogoIndex];
        const display = displaysJogos[jogoIndex];

        if (jogo.length === 0) display.dataset.status = "vazio";
        else if (jogo.length < MAX_NUMEROS) display.dataset.status = "incompleto";
        else display.dataset.status = "completo";
    }

    function atualizarInterface() {
        // Atualiza displays redondos
        displaysJogos.forEach((_, i) => atualizarDisplay(i));

        // Controle do botão "Próximo"
        if (jogos[jogoAtivo].length === MAX_NUMEROS && jogoAtivo < TOTAL_JOGOS - 1) {
            proximoJogoBtn.disabled = false;
            proximoJogoBtn.style.display = "inline-block";
        } else {
            proximoJogoBtn.disabled = true;
            proximoJogoBtn.style.display = (jogoAtivo < TOTAL_JOGOS - 1) ? "inline-block" : "none";
        }

        // Controle do botão "Confirmar" (Só aparece se os 5 jogos estiverem com 6 números)
        const completos = jogos.every(j => j.length === MAX_NUMEROS);
        confirmarApostaBtn.style.display = completos ? "inline-block" : "none";

        // Atualiza botões numéricos (cor de selecionado)
        document.querySelectorAll('.numero-btn').forEach(btn => {
            const num = parseInt(btn.dataset.numero);
            btn.classList.toggle('selecionado', jogos[jogoAtivo].includes(num));
        });
    }

    function selecionarJogo(index) {
        displaysJogos[jogoAtivo].classList.remove('ativo');
        jogoAtivo = index;
        displaysJogos[jogoAtivo].classList.add('ativo');
        atualizarInterface();
    }

    // ================================
    // LÓGICA DE JOGOS
    // ================================

    function toggleNumero(num) {
        const jogo = jogos[jogoAtivo];

        if (jogo.includes(num)) {
            jogos[jogoAtivo] = jogo.filter(n => n !== num);
        } else {
            if (jogo.length >= MAX_NUMEROS) {
                alert(`O Jogo ${jogoAtivo + 1} já está completo.`);
                return;
            }
            jogo.push(num);
        }
        atualizarInterface();
    }

    function preencherAleatorio() {
        const jogo = jogos[jogoAtivo];
        const faltando = MAX_NUMEROS - jogo.length;
        if (faltando <= 0) {
            alert(`O Jogo ${jogoAtivo + 1} já está completo.`);
            return;
        }

        const pool = Array.from({ length: 60 }, (_, i) => i + 1)
            .filter(n => !jogo.includes(n));

        let novos = [];
        for (let i = 0; i < faltando; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            novos.push(pool.splice(idx, 1)[0]);
        }

        const copiaTeste = [...jogo, ...novos];
        
        // Verifica se o jogo gerado não é idêntico a outro jogo já preenchido
        const sortedNovo = copiaTeste.sort((a, b) => a - b).join(',');
        for (let i = 0; i < TOTAL_JOGOS; i++) {
            if (i !== jogoAtivo && jogos[i].length === MAX_NUMEROS) {
                const sortedOutro = [...jogos[i]].sort((a, b) => a - b).join(',');
                if (sortedNovo === sortedOutro) {
                    preencherAleatorio(); // Tenta gerar novamente se for repetido
                    return;
                }
            }
        }

        jogo.push(...novos);
        atualizarInterface();
    }

    // ================================
    // EVENTOS
    // ================================

    // Clique nos displays redondos (1 a 5)
    displaysJogos.forEach((display, i) => {
        display.addEventListener('click', () => selecionarJogo(i));
    });

    // Limpar Jogo Atual
    limparJogoBtn.addEventListener('click', () => {
        if (confirm(`Limpar os números do Jogo ${jogoAtivo + 1}?`)) {
            jogos[jogoAtivo] = [];
            atualizarInterface();
        }
    });

    // Preencher Aleatoriamente
    preencherAleatoriamenteBtn.addEventListener('click', preencherAleatorio);

    // Próximo Jogo
    proximoJogoBtn.addEventListener('click', () => {
        if (jogoAtivo < TOTAL_JOGOS - 1) selecionarJogo(jogoAtivo + 1);
    });

    // Confirmar Aposta e Ir para Pagamento
    confirmarApostaBtn.addEventListener('click', () => {
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();

        if (!nome || !telefone) {
            alert("Por favor, preencha seu Nome e Telefone antes de confirmar.");
            return;
        }

        if (!jogos.every(j => j.length === MAX_NUMEROS)) {
            alert("Você precisa completar os 5 jogos antes de continuar.");
            return;
        }

        const dados = {
            nome,
            telefone,
            chavePix: CHAVE_PIX,
            jogos
        };

        localStorage.setItem('dadosBolao', JSON.stringify(dados));
        window.location.href = "confirmacao.html";
    });

    // Gerar Botões 1–60 na grade
    for (let i = 1; i <= 60; i++) {
        const btn = document.createElement('div');
        btn.className = "numero-btn";
        btn.dataset.numero = i;
        btn.textContent = i.toString().padStart(2, '0');
        btn.addEventListener('click', () => toggleNumero(i));
        containerJogos.appendChild(btn);
    }

    // Lógica do PIX
    if (chavePixDisplay) chavePixDisplay.textContent = CHAVE_PIX;

    copiarPixBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(CHAVE_PIX).then(() => {
            const originalText = copiarPixBtn.textContent;
            copiarPixBtn.textContent = "Copiado!";
            copiarPixBtn.classList.add('success');
            setTimeout(() => {
                copiarPixBtn.textContent = originalText;
                copiarPixBtn.classList.remove('success');
            }, 1500);
        });
    });

    // ================================
    // INICIALIZAÇÃO
    // ================================
    verificarStatusBolao();
    selecionarJogo(0);
});