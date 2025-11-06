








const firebaseConfig = {
  apiKey: "AIzaSyDxS8QUm7HacD7F-zAmbH64ITDkQ8A4tVg",
  authDomain: "test-4bfe7.firebaseapp.com",
  databaseURL: "https://test-4bfe7-default-rtdb.firebaseio.com",
  projectId: "test-4bfe7",
  storageBucket: "test-4bfe7.firebasestorage.app",
  messagingSenderId: "976394483611",
  appId: "1:976394483611:web:5ffb8abe8289f1c651133e"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- 2. CARREGAMENTO DE ASSETS ---
const playerImage = new Image();
playerImage.src = 'https://raw.githubusercontent.com/Rain-Hub1/Game/refs/heads/main/images/Main/1762461467012%7E2.png';
const punchImage = new Image();
punchImage.src = 'https://raw.githubusercontent.com/Rain-Hub1/Game/refs/heads/main/images/Main/Screenshot_20251106-174105%7E2.png';

let loadedCount = 0;
const totalImages = 2;
function imageLoaded() {
    loadedCount++;
    if (loadedCount === totalImages) {
        startGame();
    }
}
playerImage.onload = imageLoaded;
punchImage.onload = imageLoaded;

// --- 3. LÓGICA DE CONTROLE E ESTADO DO JOGADOR ---
const myPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
const allPlayers = {};
const playersRef = database.ref('players');

const controls = {
    up: false,
    down: false,
    left: false,
    right: false
};

const playerSpeed = 4;

const controlMap = {
    'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right'
};

// Adiciona eventos de toque APENAS para os botões do D-pad
['up', 'down', 'left', 'right'].forEach(id => {
    const button = document.getElementById(id);
    button.addEventListener('pointerdown', (e) => { e.preventDefault(); controls[controlMap[id]] = true; });
    button.addEventListener('pointerup', (e) => { e.preventDefault(); controls[controlMap[id]] = false; });
    button.addEventListener('pointerleave', (e) => { e.preventDefault(); controls[controlMap[id]] = false; });
});

// Evento APENAS para o botão de soco
const punchButton = document.getElementById('punch-button');
punchButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const myPlayerRef = database.ref(`players/${myPlayerId}`);
    myPlayerRef.update({ isPunching: true });
    setTimeout(() => {
        myPlayerRef.update({ isPunching: false });
    }, 300);
});

// --- 4. SINCRONIZAÇÃO EM TEMPO REAL ---
playersRef.on('value', (snapshot) => {
    const playersData = snapshot.val();
    if (playersData) {
        for (const playerId in playersData) {
            if (playerId !== myPlayerId) {
                allPlayers[playerId] = playersData[playerId];
            }
        }
    }
});

database.ref(`players/${myPlayerId}`).onDisconnect().remove();

// --- 5. RENDERIZAÇÃO E GAME LOOP ---
function gameLoop() {
    const myPlayer = allPlayers[myPlayerId];
    if (myPlayer) {
        let positionChanged = false;
        if (controls.up) { myPlayer.y -= playerSpeed; positionChanged = true; }
        if (controls.down) { myPlayer.y += playerSpeed; positionChanged = true; }
        if (controls.left) { myPlayer.x -= playerSpeed; positionChanged = true; }
        if (controls.right) { myPlayer.x += playerSpeed; positionChanged = true; }

        if (positionChanged) {
            database.ref(`players/${myPlayerId}`).update({ x: myPlayer.x, y: myPlayer.y });
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const playerId in allPlayers) {
        const player = allPlayers[playerId];
        const imageToDraw = player.isPunching ? punchImage : playerImage;
        const playerWidth = 80;
        const playerHeight = 80;

        if (player.x && player.y) {
             ctx.drawImage(imageToDraw, player.x - playerWidth / 2, player.y - playerHeight / 2, playerWidth, playerHeight);
        }
    }

    requestAnimationFrame(gameLoop);
}

// --- 6. INICIALIZAÇÃO DO JOGO ---
function startGame() {
    allPlayers[myPlayerId] = { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        isPunching: false 
    };
    database.ref(`players/${myPlayerId}`).set(allPlayers[myPlayerId]);
    gameLoop();
}

ctx.fillStyle = "white";
ctx.font = "20px sans-serif";
ctx.textAlign = "center";
ctx.fillText("Carregando o jogo...", canvas.width / 2, canvas.height / 2);
