// game.js
const game = document.getElementById("game");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const gridData = [
  ["p", "_", "_", "B", "B", "B", "B", "B", "B", "_"],
  ["B", "_", "B", "_", "_", "B", "_", "B", "B", "_"],
  ["_", "_", "_", "_", "_", "_", "I", "_", "B", "_"],
  ["_", "B", "_", "B", "B", "_", "_", "I", "B", "_"],
  ["_", "_", "_", "B", "_", "B", "_", "_", "_", "_"],
  ["B", "B", "B", "_", "F", "_", "_", "_", "I", "B"],
  ["_", "_", "_", "I", "B", "B", "_", "B", "_", "_"],
  ["B", "I", "_", "_", "_", "_", "_", "_", "_", "B"],
  ["_", "B", "_", "_", "_", "B", "_", "B", "B", "_"],
  ["I", "_", "B", "_", "B", "_", "I", "_", "_", "o"],
];

const enemies = [
  { x: 9, y: 0, direction: "up" },
  { x: 2, y: 6, direction: "up" },
  { x: 3, y: 7, direction: "down" },
  { x: 5, y: 8, direction: "up" },
  { x: 6, y: 3, direction: "down" },
  { x: 7, y: 1, direction: "up" },
  { x: 9, y: 6, direction: "up" },
];

function createGrid(grid) {
  game.innerHTML = ""; // Limpa a grade existente

  // Cria a nova grade com base na matriz fornecida
  grid.forEach((row) => {
    row.forEach((cell) => {
      const div = document.createElement("div");
      div.classList.add("game__content");
      if (cell !== "_") {
        div.classList.add(cell); // Adiciona a classe correspondente ao conteúdo da célula
        div.textContent = cell; // Adiciona o texto da célula
      }
      game.appendChild(div);
    });
  });
}

createGrid(gridData);

let x = 0; // Posição inicial do personagem
let y = 0;
let hasFruitPower = false; // Estado para saber se o personagem já pegou a fruta
let oldCena = "_";

function move(cena, movimento) {
  let newX = x;
  let newY = y;
  
  cena[x][y] = oldCena;

  if (movimento === "baixo") newX += 1;
  else if (movimento === "cima") newX -= 1;
  else if (movimento === "esquerda") newY -= 1;
  else if (movimento === "direita") newY += 1;

  if (
    newX < 0 ||
    newX >= cena.length ||
    newY < 0 ||
    newY >= cena[0].length ||
    (!hasFruitPower && cena[newX][newY] === "B")
  )
    return false;

  if (cena[newX][newY] === "I") {
    showMessage("Você foi capturado!");
    return false;
  }

  let r = handleBarrierCrossing(cena, newX, newY);
  oldCena = cena[newX][newY];

  cena[newX][newY] = "p";
  r ? (cena[r[0]][r[1]] = "b") : null;
  x = newX;
  y = newY;

  return true;
}

function moveEnemies(grid) {
  enemies.forEach((enemy) => {
    const { x, y, direction } = enemy;

    // Remove o inimigo da posição atual
    if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length) {
      grid[x][y] = "_";
    }

    // Movimenta o inimigo para cima ou para baixo apenas um passo por ciclo de movimento
    if (direction === "up") {
      if (x - 1 >= 0 && grid[x - 1][y] !== "B") {
        enemy.x -= 1;
        enemy.direction = "down"; // Muda direção para baixo após um movimento para cima
      }
    } else if (direction === "down") {
      if (x + 1 < grid.length && grid[x + 1][y] !== "B") {
        enemy.x += 1;
        enemy.direction = "up"; // Muda direção para cima após um movimento para baixo
      }
    }

    // Verifica colisão com o personagem
    if (enemy.x === x && enemy.y === y) {
      showMessage("Você foi capturado!");
    }

    // Adiciona o inimigo na nova posição, verificando se está dentro dos limites
    if (
      enemy.x >= 0 &&
      enemy.x < grid.length &&
      enemy.y >= 0 &&
      enemy.y < grid[0].length
    ) {
      grid[enemy.x][enemy.y] = "I";
    }
  });
}

function handleBarrierCrossing(cena, newX, newY) {
  if (cena[newX][newY] === "B" && hasFruitPower) {
    return [newX, newY];
  }
  return false;
}

function printMat(m) {
  for (let l = 0; l < m.length; l++) {
    let row = "";
    for (let c = 0; c < m[0].length; c++) {
      row += m[l][c] + " ";
    }
    console.log(row);
  }
}

function copia(m) {
  let cm = new Array(m.length);
  for (let l = 0; l < m.length; l++) {
    cm[l] = new Array(m[0].length);
    for (let c = 0; c < m[0].length; c++) {
      cm[l][c] = m[l][c];
    }
  }
  return cm;
}

async function executeMoves(moves, interval, cena) {
  for (const moveFunc of moves) {
    moveEnemies(cena);
    moveFunc(cena);
    createGrid(cena);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function predictEnemyPosition(enemy, steps) {
  const futurePosition = { ...enemy };
  for (let i = 0; i < steps; i++) {
    if (futurePosition.direction === "up") {
      if (
        futurePosition.x > 0 &&
        gridData[futurePosition.x - 1][futurePosition.y] !== "B"
      ) {
        futurePosition.x -= 1;
      } else {
        futurePosition.direction = "down";
        futurePosition.x += 1;
      }
    } else if (futurePosition.direction === "down") {
      if (
        futurePosition.x < gridData.length - 1 &&
        gridData[futurePosition.x + 1][futurePosition.y] !== "B"
      ) {
        futurePosition.x += 1;
      } else {
        futurePosition.direction = "up";
        futurePosition.x -= 1;
      }
    }
  }
  return futurePosition;
}

function isEnemyOnPath(neighbor, steps) {
  for (const enemy of enemies) {
    const predictedPosition = predictEnemyPosition(enemy, steps);
    if (
      predictedPosition.x === neighbor[0] &&
      predictedPosition.y === neighbor[1]
    ) {
      return true;
    }
  }
  return false;
}

function aStar(grid, start, end, allowBarrierPass) {
  const openList = new PriorityQueue();
  const closedList = new Set();

  const startNode = {
    pos: start,
    g: 0,
    h: euclideanDistance(start[0], start[1], end[0], end[1]),
    f: 0,
  };
  startNode.f = startNode.g + startNode.h;
  openList.enqueue(startNode, startNode.f);

  const cameFrom = new Map();
  const gScore = new Map();
  gScore.set(JSON.stringify(start), 0);

  while (!openList.isEmpty()) {
    const current = openList.dequeue().element;

    if (current.pos[0] === end[0] && current.pos[1] === end[1]) {
      return reconstructPath(cameFrom, current.pos);
    }

    closedList.add(JSON.stringify(current.pos));

    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const neighbor = [current.pos[0] + dx, current.pos[1] + dy];
      const neighborKey = JSON.stringify(neighbor);

      if (
        neighbor[0] < 0 ||
        neighbor[0] >= grid.length ||
        neighbor[1] < 0 ||
        neighbor[1] >= grid[0].length ||
        closedList.has(neighborKey)
      ) {
        continue;
      }

      if (
        grid[neighbor[0]][neighbor[1]] === "B" &&
        !allowBarrierPass &&
        grid[neighbor[0]][neighbor[1]] !== "F"
      ) {
        continue;
      }

      const tentativeGScore = gScore.get(JSON.stringify(current.pos)) + 1;

      if (
        !gScore.has(neighborKey) ||
        tentativeGScore < gScore.get(neighborKey)
      ) {
        cameFrom.set(neighborKey, current.pos);
        gScore.set(neighborKey, tentativeGScore);
        const hScore = euclideanDistance(
          neighbor[0],
          neighbor[1],
          end[0],
          end[1]
        );
        const fScore = tentativeGScore + hScore;

        if (!openList.includes(neighborKey)) {
          openList.enqueue({ pos: neighbor, f: fScore }, fScore);
        }
      }
    }
  }

  return null;
}

function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  while (cameFrom.has(JSON.stringify(current))) {
    current = cameFrom.get(JSON.stringify(current));
    totalPath.unshift(current);
  }
  return totalPath;
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  includes(pos) {
    return this.items.some((item) => {
      return item.element.pos[0] === pos[0] && item.element.pos[1] === pos[1];
    });
  }
}

function calculateMoves(path) {
  const moves = [];
  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    if (x2 > x1) {
      moves.push((grid) => move(grid, "baixo"));
    } else if (x2 < x1) {
      moves.push((grid) => move(grid, "cima"));
    } else if (y2 > y1) {
      moves.push((grid) => move(grid, "direita"));
    } else if (y2 < y1) {
      moves.push((grid) => move(grid, "esquerda"));
    }
  }
  return moves;
}

function hasPathToPoint(grid, start, target) {
  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    const key = JSON.stringify(current);

    if (visited.has(key)) continue;
    visited.add(key);

    const [x, y] = current;

    if (x === target[0] && y === target[1]) {
      return true;
    }

    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const neighbor = [x + dx, y + dy];
      const [nx, ny] = neighbor;

      if (
        nx >= 0 &&
        nx < grid.length &&
        ny >= 0 &&
        ny < grid[0].length &&
        grid[nx][ny] !== "B" &&
        grid[nx][ny] !== "I" &&
        !visited.has(JSON.stringify(neighbor))
      ) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}

startButton.addEventListener("click", () => {
  const currentGrid = copia(gridData);

  const fruitPosition = [5, 4];
  const finalPosition = [9, 9];

  if (!hasPathToPoint(currentGrid, [x, y], fruitPosition)) {
    showMessage("Nenhum caminho disponível para pegar a fruta.");
    return;
  }

  const pathToFruit = aStar(currentGrid, [x, y], fruitPosition, false);

  if (!pathToFruit) {
    showMessage("Nenhum caminho disponível para pegar a fruta.");
    return;
  }

  const pathToEnd = aStar(
    currentGrid,
    pathToFruit[pathToFruit.length - 1],
    finalPosition,
    true
  );

  if (!pathToEnd) {
    showMessage("Nenhum caminho disponível para chegar ao ponto final.");
    return;
  }

  const totalPath = [...pathToFruit, ...pathToEnd.slice(1)];

  hasFruitPower = true;
  const moves = calculateMoves(totalPath);

  executeMoves(moves, 500, currentGrid);
});

restartButton.addEventListener("click", () => {
  window.location.reload();
});

function showMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => {
    messageDiv.remove();
  }, 2000);
}
