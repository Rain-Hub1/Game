// --- 1. CONFIGURAÇÃO INICIAL ---

// ATENÇÃO: Cole aqui a configuração do seu projeto Firebase!
// Você encontra isso no Console do Firebase > Configurações do Projeto > Seus apps > App da Web
const firebaseConfig = {
  apiKey: "AIzaSyDxS8QUm7HacD7F-zAmbH64ITDkQ8A4tVg",
  authDomain: "test-4bfe7.firebaseapp.com",
  projectId: "test-4bfe7",
  storageBucket: "test-4bfe7.firebasestorage.app",
  messagingSenderId: "976394483611",
  appId: "1:976394483611:web:5ffb8abe8289f1c651133e"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Configura a tela (canvas)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- PRÉ-CARREGAMENTO DE IMAGENS ---
const playerImage = new Image();
playerImage.src = 'https://raw.githubusercontent.com/Rain-Hub1/Game/refs/heads/main/images/Main/1762461467012%7E2.png';

const punchImage = new Image();
punchImage.src = 'https://raw.githubusercontent.com/Rain-Hub1/Game/refs/heads/main/images/Main/Screenshot_20251106-174105%7E2.png';

let loadedCount = 0;
const totalImages = 2;

// Função para verificar se todas as imagens foram carregadas antes de iniciar o jogo
function imageLoaded() {
    loadedCount++;
    if (loadedCount === totalImages) {
        startGame();
    }
}

playerImage.onload = imageLoaded;
punchImage.onload = imageLoaded;

// --- 2. LÓGICA DO JOGO ---

// Cria um ID único e anônimo para o jogador nesta sessão
const myPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
const allPlayers = {}; // Objeto local para guardar os dados de todos os jogadores
const playersRef = database.ref('players'); // Referência ao nó "players" no banco de dados

// Evento de toque/clique na tela
document.addEventListener('pointerdown', (event) => {
    const myPlayerRef = database.ref(`players/${myPlayerId}`);
    
    // Atualiza a posição e o estado de soco no Firebase
    myPlayerRef.update({
        x: event.clientX,
        y: event.clientY,
        isPunching: true
    });

    // Volta ao estado "parado" após um curto período
    setTimeout(() => {
        myPlayerRef.update({ isPunching: false });
    }, 300); // Duração da animação de soco em milissegundos
});

// --- 3. SINCRONIZAÇÃO EM TEMPO REAL ---

// Escuta por QUALQUER mudança no nó "players" (novos jogadores, movimentos, etc.)
playersRef.on('value', (snapshot) => {
    const playersData = snapshot.val();
    if (playersData) {
        // Atualiza nosso objeto local com os dados mais recentes do servidor
        Object.assign(allPlayers, playersData);
    }
});

// Define uma ação para quando o jogador desconectar (fechar a aba/navegador)
// Isso remove o jogador do banco de dados para que ele não fique "flutuando" no jogo
database.ref(`players/${myPlayerId}`).onDisconnect().remove();

// --- 4. FUNÇÃO DE DESENHO (GAME LOOP) ---

function draw() {
    // Limpa toda a tela a cada quadro para redesenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Itera sobre todos os jogadores no objeto local
    for (const playerId in allPlayers) {
        const player = allPlayers[playerId];
        
        // Escolhe qual imagem desenhar com base no estado 'isPunching'
        const imageToDraw = player.isPunching ? punchImage : playerImage;
        
        const playerWidth = 80;
        const playerHeight = 80;

        // Desenha a imagem na tela, centralizada na sua posição (x, y)
        if (player.x && player.y) {
             ctx.drawImage(imageToDraw, player.x - playerWidth / 2, player.y - playerHeight / 2, playerWidth, playerHeight);
        }
    }

    // Pede ao navegador para chamar a função 'draw' novamente no próximo quadro de animação
    requestAnimationFrame(draw);
}

// --- 5. INÍCIO DO JOGO ---
function startGame() {
    // Define o estado inicial do nosso jogador
    allPlayers[myPlayerId] = { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        isPunching: false 
    };
    // Envia o estado inicial para o Firebase, criando o jogador no banco de dados
    database.ref(`players/${myPlayerId}`).set(allPlayers[myPlayerId]);
    
    // Inicia o loop de desenho
    draw();
}

// Exibe uma mensagem de carregamento enquanto as imagens não carregam
ctx.fillStyle = "white";
ctx.font = "20px sans-serif";
ctx.textAlign = "center";
ctx.fillText("Carregando o jogo...", canvas.width / 2, canvas.height / 2);
