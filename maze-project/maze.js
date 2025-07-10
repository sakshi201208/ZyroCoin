const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const sizeSlider = document.getElementById('sizeSlider');
const generateBtn = document.getElementById('generateBtn');
const pcRadio = document.getElementById('pcRadio');
const phoneRadio = document.getElementById('phoneRadio');

let rows = parseInt(sizeSlider.value);
let cols = parseInt(sizeSlider.value);
let cellSize = canvas.width / cols;

let grid = [];
let stack = [];
let playerPos = {x: 0, y: 0};
let end = {x: cols - 1, y: rows - 1};
let trace = [];

function Cell(x, y) {
    this.x = x;
    this.y = y;
    this.walls = [true, true, true, true]; // top, right, bottom, left
    this.visited = false;

    this.draw = function() {
        let px = this.x * cellSize;
        let py = this.y * cellSize;

        // End cell
        if (this.x === end.x && this.y === end.y) {
            ctx.fillStyle = "#f00";
            ctx.fillRect(px, py, cellSize, cellSize);
        }

        // Start cell
        if (this.x === 0 && this.y === 0) {
            ctx.fillStyle = "#00f";
            ctx.fillRect(px, py, cellSize, cellSize);
        }

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;

        if (this.walls[0]) { // top
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + cellSize, py);
            ctx.stroke();
        }
        if (this.walls[1]) { // right
            ctx.beginPath();
            ctx.moveTo(px + cellSize, py);
            ctx.lineTo(px + cellSize, py + cellSize);
            ctx.stroke();
        }
        if (this.walls[2]) { // bottom
            ctx.beginPath();
            ctx.moveTo(px + cellSize, py + cellSize);
            ctx.lineTo(px, py + cellSize);
            ctx.stroke();
        }
        if (this.walls[3]) { // left
            ctx.beginPath();
            ctx.moveTo(px, py + cellSize);
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    };

    this.checkNeighbors = function() {
        let neighbors = [];
        let top = grid[index(this.x, this.y - 1)];
        let right = grid[index(this.x + 1, this.y)];
        let bottom = grid[index(this.x, this.y + 1)];
        let left = grid[index(this.x - 1, this.y)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            return neighbors[Math.floor(Math.random() * neighbors.length)];
        } else {
            return undefined;
        }
    };
}

function index(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
    return x + y * cols;
}

function setup() {
    rows = parseInt(sizeSlider.value);
    cols = parseInt(sizeSlider.value);
    cellSize = canvas.width / cols;
    end = {x: cols - 1, y: rows - 1};
    grid = [];
    trace = [{x: 0, y: 0}];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid.push(new Cell(x, y));
        }
    }
    stack = [];
    let current = grid[0];
    current.visited = true;
    stack.push(current);
    playerPos = {x: 0, y: 0};
    generateMazeStep();
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach(cell => cell.draw());

    // Draw trace as a line
    if (trace.length > 1) {
        ctx.strokeStyle = "#0ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(
            trace[0].x * cellSize + cellSize / 2,
            trace[0].y * cellSize + cellSize / 2
        );
        for (let i = 1; i < trace.length; i++) {
            ctx.lineTo(
                trace[i].x * cellSize + cellSize / 2,
                trace[i].y * cellSize + cellSize / 2
            );
        }
        ctx.stroke();
    }

    // Draw player
    ctx.fillStyle = "#0ff";
    ctx.beginPath();
    ctx.arc(
        playerPos.x * cellSize + cellSize / 2,
        playerPos.y * cellSize + cellSize / 2,
        cellSize / 3,
        0, 2 * Math.PI
    );
    ctx.fill();
}

function generateMazeStep() {
    if (stack.length > 0) {
        let current = stack[stack.length - 1];
        let next = current.checkNeighbors();
        if (next) {
            next.visited = true;
            stack.push(next);

            // Remove walls
            let dx = next.x - current.x;
            let dy = next.y - current.y;
            if (dx === 1) {
                current.walls[1] = false;
                next.walls[3] = false;
            } else if (dx === -1) {
                current.walls[3] = false;
                next.walls[1] = false;
            }
            if (dy === 1) {
                current.walls[2] = false;
                next.walls[0] = false;
            } else if (dy === -1) {
                current.walls[0] = false;
                next.walls[2] = false;
            }
        } else {
            stack.pop();
        }
        drawMaze();
        requestAnimationFrame(generateMazeStep);
    } else {
        drawMaze();
    }
}

// Player movement and trace with backtracking erase
document.addEventListener('keydown', function(event) {
    let {x, y} = playerPos;
    let cell = grid[index(x, y)];
    if (!cell) return;
    let moved = false;
    if (event.key === "ArrowUp" && !cell.walls[0]) {
        y -= 1;
        moved = true;
    }
    if (event.key === "ArrowRight" && !cell.walls[1]) {
        x += 1;
        moved = true;
    }
    if (event.key === "ArrowDown" && !cell.walls[2]) {
        y += 1;
        moved = true;
    }
    if (event.key === "ArrowLeft" && !cell.walls[3]) {
        x -= 1;
        moved = true;
    }
    if (moved && x >= 0 && y >= 0 && x < cols && y < rows) {
        playerPos = {x, y};
        // If revisiting a cell in the trace (not the last one), erase forward trace
        let idx = trace.findIndex(p => p.x === x && p.y === y);
        if (idx !== -1 && idx !== trace.length - 1) {
            trace = trace.slice(0, idx + 1);
        } else if (idx === -1) {
            trace.push({x, y});
        }
        drawMaze();
        // Check win
        if (playerPos.x === end.x && playerPos.y === end.y) {
            setTimeout(() => alert("🎉 Congratulations! You reached the end!"), 100);
        }
    }
});

// Play button
generateBtn.onclick = () => {
    setup();
};

// Slider controls
sizeSlider.addEventListener('input', () => {
    document.getElementById('sizeValue').textContent = sizeSlider.value;
    document.getElementById('sizeValue2').textContent = sizeSlider.value;
});

// Aspect ratio controls
function setAspect() {
    if (pcRadio.checked) {
        canvas.width = 500;
        canvas.height = 500;
    } else {
        canvas.width = 320;
        canvas.height = 570;
    }
    // Redraw maze with new aspect
    setup();
}
pcRadio.onchange = setAspect;
phoneRadio.onchange = setAspect;

// Set initial aspect and maze on page load
setAspect();

// Swipe controls for mobile/touch devices
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, {passive: true});

canvas.addEventListener('touchend', function(e) {
    if (touchStartX === null || touchStartY === null) return;
    let touch = e.changedTouches[0];
    let dx = touch.clientX - touchStartX;
    let dy = touch.clientY - touchStartY;
    let absDx = Math.abs(dx);
    let absDy = Math.abs(dy);

    // Only trigger if swipe is long enough
    if (Math.max(absDx, absDy) > 30) {
        let dir = null;
        if (absDx > absDy) {
            dir = dx > 0 ? "ArrowRight" : "ArrowLeft";
        } else {
            dir = dy > 0 ? "ArrowDown" : "ArrowUp";
        }
        const event = new KeyboardEvent('keydown', {key: dir});
        document.dispatchEvent(event);
    }
    touchStartX = null;
    touchStartY = null;
});