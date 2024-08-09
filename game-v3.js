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
  ["_", "_", "_", "I", "B", "B", "B", "B", "_", "_"],
  ["B", "I", "_", "_", "_", "_", "_", "_", "_", "B"],
  ["_", "B", "_", "_", "_", "B", "_", "B", "B", "_"],
  ["I", "_", "B", "_", "B", "_", "_", "_", "_", "o"],
];

const enemies = [
  { x: 9, y: 0, direction: "up" },
  { x: 2, y: 6, direction: "up" },
  { x: 3, y: 7, direction: "down" },
  { x: 5, y: 8, direction: "up" },
  { x: 6, y: 3, direction: "down" },
  { x: 7, y: 1, direction: "up" },
  // { x: 9, y: 6, direction: "up" },
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
        div.textContent = cell; // Opcional: adiciona o texto da célula
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

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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

      if (
        neighbor[0] < 0 ||
        neighbor[1] < 0 ||
        neighbor[0] >= grid.length ||
        neighbor[1] >= grid[0].length
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

      if (closedList.has(JSON.stringify(neighbor))) {
        continue;
      }

      const tentativeG = current.g + 1;
      if (
        !gScore.has(JSON.stringify(neighbor)) ||
        tentativeG < gScore.get(JSON.stringify(neighbor))
      ) {
        cameFrom.set(JSON.stringify(neighbor), current.pos);
        gScore.set(JSON.stringify(neighbor), tentativeG);
        const h = euclideanDistance(neighbor[0], neighbor[1], end[0], end[1]);
        const f = tentativeG + h;
        openList.enqueue({ pos: neighbor, g: tentativeG, h: h, f: f }, f);
      }
    }
  }

  return null; // Caminho não encontrado
}

function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom.has(JSON.stringify(current))) {
    current = cameFrom.get(JSON.stringify(current));
    path.push(current);
  }
  return path.reverse();
}

function findFruitPosition(grid) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === "F") {
        return [i, j];
      }
    }
  }
  return null; // Fruta não encontrada
}

function canPassThroughFruit(grid, start, neighbor) {
  const fruitPosition = findFruitPosition(grid);
  return (
    fruitPosition &&
    euclideanDistance(start[0], start[1], fruitPosition[0], fruitPosition[1]) <
      euclideanDistance(
        neighbor[0],
        neighbor[1],
        fruitPosition[0],
        fruitPosition[1]
      )
  );
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

async function startGame() {
  let cenaCopia = copia(gridData);
  x = 0; // Redefine a posição inicial do personagem
  y = 0;
  hasFruitPower = false; // Reinicia o estado da fruta

  const fruitPosition = findFruitPosition(gridData);
  const end = [9, 9]; // [9, 9] é a posição do destino

  let bestPath = [];
  let bestCost = Infinity;

  if (fruitPosition) {
    // Calcula o caminho sem pegar a fruta
    const pathWithoutFruit = aStar(gridData, [x, y], end, false);
    const costWithoutFruit = pathWithoutFruit
      ? pathWithoutFruit.length
      : Infinity;

    // Calcula o caminho para pegar a fruta e depois o destino
    const pathToFruit = aStar(gridData, [x, y], fruitPosition, false);
    const pathFromFruitToEnd = aStar(gridData, fruitPosition, end, true);

    if (pathToFruit && pathFromFruitToEnd) {
      const costToFruit = pathToFruit.length;
      const costFromFruitToEnd = pathFromFruitToEnd.length;
      const totalCost = costToFruit + costFromFruitToEnd;

      if (totalCost < bestCost) {
        // aqui
        bestCost = totalCost;
        bestPath = pathToFruit.concat(pathFromFruitToEnd.slice(1)); // Evita repetir o ponto da fruta
        hasFruitPower = true;
      }
    }

    // Se o caminho sem a fruta for melhor, use-o
    if (costWithoutFruit < bestCost) {
      bestPath = pathWithoutFruit;
    }
  } else {
    // Sem fruta no grid, apenas calcule o caminho direto
    bestPath = aStar(gridData, [x, y], end, false);
  }

  if (bestPath) {
    console.log("Caminho encontrado: ", bestPath);
    for (const [px, py] of bestPath) {
      const moveFunc = (cena) =>
        move(
          cena,
          px > x ? "baixo" : px < x ? "cima" : py > y ? "direita" : "esquerda"
        );
      await executeMoves([moveFunc], 500, cenaCopia);
      x = px;
      y = py;
    }
    console.log("Chegou ao destino!");
  } else {
    console.log("Caminho não encontrado.");
  }
}

startButton.addEventListener("click", startGame);

restartButton.addEventListener("click", () => {
  x = 0;
  y = 0;
  hasFruitPower = false;
  createGrid(gridData);
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
