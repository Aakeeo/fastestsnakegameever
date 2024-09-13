// Authentication and UI Handling
document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
});

document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
});

document.getElementById("register-button").addEventListener("click", register);
document.getElementById("login-button").addEventListener("click", login);
document.getElementById("logout-button").addEventListener("click", logout);
document
  .getElementById("start-game-button")
  .addEventListener("click", showGame);
document.getElementById("pause-button").addEventListener("click", pauseGame);
document.getElementById("resume-button").addEventListener("click", resumeGame);
document
  .getElementById("restart-button")
  .addEventListener("click", backToDashboard);
document
  .getElementById("profile-button")
  .addEventListener("click", showProfile);
document
  .getElementById("back-to-dashboard-button")
  .addEventListener("click", backToDashboardFromProfile);
document
  .getElementById("change-password-button")
  .addEventListener("click", changePassword);

async function register() {
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!username || !password) {
    alert("Please enter a username and password.");
    return;
  }

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    await fetch("/get-username");
    showDashboard();
  }
}

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    alert("Please enter your username and password.");
    return;
  }

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    await fetch("/get-username");
    showDashboard();
  }
}

async function logout() {
  await fetch("/logout", { method: "POST" });
  hideAllContainers();
  document.getElementById("auth-container").style.display = "flex";
  // Reset game
  clearInterval(gameInterval);
  document.removeEventListener("keydown", changeDirection);
}

// On page load, check if user is already logged in
window.onload = async function () {
  const response = await fetch("/is-logged-in");
  if (response.ok) {
    showDashboard();
  }
};

async function showDashboard() {
  hideAllContainers();
  document.getElementById("dashboard-container").style.display = "flex";
  const usernameResponse = await fetch("/get-username");
  const usernameData = await usernameResponse.json();
  document.getElementById("username-display").innerText = usernameData.username;
  updateScores();
}

function showGame() {
  hideAllContainers();
  document.getElementById("game-container").style.display = "flex";
  startGame();
}

function showGameOver() {
  hideAllContainers();
  document.getElementById("game-over-container").style.display = "flex";
  document.getElementById("final-score").innerText = score;
}

function backToDashboard() {
  hideAllContainers();
  document.getElementById("dashboard-container").style.display = "flex";
  updateScores();
}

function showProfile() {
  hideAllContainers();
  document.getElementById("profile-container").style.display = "flex";
}

function backToDashboardFromProfile() {
  hideAllContainers();
  document.getElementById("dashboard-container").style.display = "flex";
}

function hideAllContainers() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard-container").style.display = "none";
  document.getElementById("game-container").style.display = "none";
  document.getElementById("game-over-container").style.display = "none";
  document.getElementById("profile-container").style.display = "none";
}

async function changePassword() {
  const newPassword = document.getElementById("new-password").value.trim();

  if (!newPassword) {
    alert("Please enter a new password.");
    return;
  }

  const response = await fetch("/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    document.getElementById("new-password").value = "";
    backToDashboardFromProfile();
  }
}

async function updateScores() {
  const response = await fetch("/scores");
  const data = await response.json();

  document.getElementById("user-high-score").innerText = data.userHighScore;
  document.getElementById("overall-high-score").innerText =
    data.overallHighScore;
}

// Game variables and functions
let canvas, ctx;
let gridSize = 20;
let canvasSize = 600;
let gameSpeed = 150;
let snake, direction, food, score, gameInterval;
let changingDirection = false;
let paused = false;

// Start the game
function startGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Reset game variables
  snake = [{ x: canvasSize / 2, y: canvasSize / 2 }];
  direction = { x: gridSize, y: 0 };
  food = { x: 0, y: 0 };
  score = 0;
  changingDirection = false;
  paused = false;
  document.getElementById("pause-button").style.display = "inline-block";
  document.getElementById("resume-button").style.display = "none";
  placeFood();
  document.getElementById("current-score").innerText = score;

  // Event listeners
  document.addEventListener("keydown", changeDirection);

  // Start game loop
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, gameSpeed);
}

function gameLoop() {
  if (paused) return;
  if (hasGameEnded()) {
    endGame();
    return;
  }
  changingDirection = false;
  clearCanvas();
  moveSnake();
  drawSnake();
  drawFood();
}

function clearCanvas() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
}

function moveSnake() {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  snake.unshift(head);

  // Check if snake has eaten the food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    document.getElementById("current-score").innerText = score;
    placeFood();
  } else {
    snake.pop();
  }
}

function drawSnake() {
  ctx.fillStyle = "#0f0";
  snake.forEach((segment) => {
    ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
  });
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
    y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
  };
  // Ensure food doesn't appear on the snake
  if (snake.some((segment) => segment.x === food.x && segment.y === food.y)) {
    placeFood();
  }
}

function drawFood() {
  ctx.fillStyle = "#f00";
  ctx.fillRect(food.x, food.y, gridSize, gridSize);
}

function changeDirection(event) {
  if (changingDirection) return;
  changingDirection = true;

  const keyPressed = event.keyCode;
  const LEFT = 37;
  const UP = 38;
  const RIGHT = 39;
  const DOWN = 40;

  const goingUp = direction.y === -gridSize;
  const goingDown = direction.y === gridSize;
  const goingRight = direction.x === gridSize;
  const goingLeft = direction.x === -gridSize;

  if (keyPressed === LEFT && !goingRight) {
    direction = { x: -gridSize, y: 0 };
  } else if (keyPressed === UP && !goingDown) {
    direction = { x: 0, y: -gridSize };
  } else if (keyPressed === RIGHT && !goingLeft) {
    direction = { x: gridSize, y: 0 };
  } else if (keyPressed === DOWN && !goingUp) {
    direction = { x: 0, y: gridSize };
  } else {
    changingDirection = false;
  }
}

function pauseGame() {
  paused = true;
  document.getElementById("pause-button").style.display = "none";
  document.getElementById("resume-button").style.display = "inline-block";
}

function resumeGame() {
  paused = false;
  document.getElementById("pause-button").style.display = "inline-block";
  document.getElementById("resume-button").style.display = "none";
}

function hasGameEnded() {
  const head = snake[0];

  // Wall collisions
  if (
    head.x < 0 ||
    head.x >= canvasSize ||
    head.y < 0 ||
    head.y >= canvasSize
  ) {
    return true;
  }

  // Self-collisions
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }

  return false;
}

async function endGame() {
  clearInterval(gameInterval);
  document.removeEventListener("keydown", changeDirection);

  // Submit score to the server
  await fetch("/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });

  showGameOver();
}
