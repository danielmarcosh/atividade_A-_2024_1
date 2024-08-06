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
  ["_", "B", "B", "_", "F", "_", "_", "_", "_", "B"],
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

createGrid(gridData)

let x = 0; // Posição inicial do personagem
let y = 0;

function move(cena, movimento) {
  if (movimento === "baixo") {
    console.log("baixo");
    if (x + 1 >= cena.length || cena[x + 1][y] === "x") return false;
    cena[x][y] = "x";
    cena[x + 1][y] = "p";
    x += 1;
  } else if (movimento === "cima") {
    console.log("cima");
    if (x - 1 < 0 || cena[x - 1][y] === "x") return false;
    cena[x][y] = "x";
    cena[x - 1][y] = "p";
    x -= 1;
  } else if (movimento === "esquerda") {
    console.log("esquerda");
    if (y - 1 < 0 || cena[x][y - 1] === "x") return false;
    cena[x][y] = "x";
    cena[x][y - 1] = "p";
    y -= 1;
  } else if (movimento === "direita") {
    console.log("direita");
    if (y + 1 >= cena[0].length || cena[x][y + 1] === "x") return false;
    cena[x][y] = "x";
    cena[x][y + 1] = "p";
    y += 1;
  }
  return true;
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

function aStar(grid, start, end) {
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
        grid[neighbor[0]][neighbor[1]] === "B" ||
        grid[neighbor[0]][neighbor[1]] === "I"
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

  const path = aStar(gridData, [x, y], [9, 9]); // [9, 9] é a posição do destino
  if (path) {
    console.log("Caminho encontrado: ", path);
    for (const [px, py] of path) {
      const moveFunc = (cena) =>
        move(
          cena,
          px > x ? "baixo" : px < x ? "cima" : py > y ? "direita" : "esquerda"
        );
      await executeMoves([moveFunc], 500, cenaCopia);
      x = px;
      y = py;
    }
  } else {
    console.log("Caminho não encontrado.");
  }
}

startButton.addEventListener("click", startGame);

// Adiciona o ouvinte de eventos ao botão "Reiniciar"
restartButton.addEventListener("click", () => {
  x = 0; // Redefine a posição inicial do personagem
  y = 0;
  console.log("Imprime a grade inicial: ");
  printMat(gridData);
  createGrid(gridData);
});
