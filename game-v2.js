// game.js
const game = document.getElementById("game");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const gridData = [
  ["p", "_", "_", "_", "_", "_", "_", "_", "B", "_"],
  ["B", "_", "B", "_", "_", "B", "B", "_", "B", "_"],
  ["_", "_", "_", "_", "_", "_", "_", "B", "B", "_"],
  ["_", "_", "_", "B", "B", "_", "_", "_", "B", "_"],
  ["_", "_", "_", "B", "_", "_", "B", "_", "B", "_"],
  ["B", "B", "B", "_", "F", "_", "_", "_", "_", "B"],
  ["_", "_", "_", "_", "B", "B", "B", "B", "_", "_"],
  ["B", "_", "_", "_", "_", "_", "_", "_", "_", "B"],
  ["_", "B", "_", "_", "_", "B", "_", "B", "B", "_"],
  ["I", "_", "B", "_", "B", "_", "_", "_", "_", "o"],
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

function move(cena, movimento) {
  if (movimento === "baixo") {
    console.log("baixo");
    if (x + 1 >= cena.length || (!hasFruitPower && cena[x + 1][y] === "B"))
      return false;
    handleBarrierCrossing(cena, x + 1, y);
    cena[x][y] = "x";
    cena[x + 1][y] = "p";
    x += 1;
  } else if (movimento === "cima") {
    console.log("cima");
    if (x - 1 < 0 || (!hasFruitPower && cena[x - 1][y] === "B")) return false;
    handleBarrierCrossing(cena, x - 1, y);
    cena[x][y] = "x";
    cena[x - 1][y] = "p";
    x -= 1;
  } else if (movimento === "esquerda") {
    console.log("esquerda");
    if (y - 1 < 0 || (!hasFruitPower && cena[x][y - 1] === "B")) return false;
    handleBarrierCrossing(cena, x, y - 1);
    cena[x][y] = "x";
    cena[x][y - 1] = "p";
    y -= 1;
  } else if (movimento === "direita") {
    console.log("direita");
    if (y + 1 >= cena[0].length || (!hasFruitPower && cena[x][y + 1] === "B"))
      return false;
    handleBarrierCrossing(cena, x, y + 1);
    cena[x][y] = "x";
    cena[x][y + 1] = "p";
    y += 1;
  }
  return true;
}

function handleBarrierCrossing(cena, newX, newY) {
  if (cena[newX][newY] === "B" && hasFruitPower) {
    cena[newX][newY] = "b"; // Marca a barreira como atravessada (cinza)
  }
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
    moveFunc(cena);
    createGrid(cena);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
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

      if (grid[neighbor[0]][neighbor[1]] === "B" && !allowBarrierPass) {
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
        bestCost = totalCost;
        bestPath = pathToFruit.concat(pathFromFruitToEnd.slice(1)); // Evita repetir o ponto da fruta
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
      if (cenaCopia[px][py] === "F") {
        hasFruitPower = true; // Ativa o poder da fruta
      }
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
