const sprites = {
    head: new Image(),
    body: new Image(),
    ready: false,
};

sprites.head.src = "/img/snake_head.png";
sprites.body.src = "/img/snake_body.png";

let loadedCount = 0;
function onSpriteLoad() {
    loadedCount++;
    if (loadedCount === 2) sprites.ready = true;
}
sprites.head.onload = onSpriteLoad;
sprites.body.onload = onSpriteLoad;

function angleFromDir(dx, dy) {
    // sprites face RIGHT by default
    if (dx === 1 && dy === 0) return 0;
    if (dx === -1 && dy === 0) return Math.PI;
    if (dx === 0 && dy === 1) return Math.PI / 2;
    if (dx === 0 && dy === -1) return -Math.PI / 2;
    return 0;
}

function drawSprite(img, cx, cy, size, angleRad) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
}

let gameover = false;

const canvasSize = 512;
const cellSeq = 8;
const cellSize = canvasSize / cellSeq;

const stepTime = 0.25; // seconds per cell (0.25s = 250ms like your old speed)

var canvas = document.getElementById("_canvas");
var ctx = canvas.getContext("2d");

// ---------- Rendering helpers ----------
function drawEnvironment() {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.backgroundColor = "#00AE00";

    for (let i = 0; i < cellSeq; i++) {
        for (let j = 0; j < cellSeq; j++) {
            ctx.fillStyle = ((i + j) % 2 == 0) ? "#A9D751" : "#A2D049";
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- Snake state (grid + smooth render) ----------
let snake = [
    { x: cellSeq / 2, y: cellSeq / 2 },
    { x: (cellSeq / 2) - 1, y: (cellSeq / 2) },
    { x: (cellSeq / 2) - 2, y: (cellSeq / 2) },
];

let snakeDir = [1, 0];
let grow = 0;

let score = 0;
let highscore = 0;

let allowInput = true;

// Smooth movement state:
// progress: 0..1 of the current cell step.
// prevSnake: snapshot of snake positions at the start of the step.
let progress = 1;
let prevSnake = snake.map(p => ({ ...p }));

// ---------- Food ----------
let food = { x: (cellSeq / 4) + 3, y: cellSeq / 4 };

function spawnFood() {
    while (true) {
        const fx = Math.floor(Math.random() * cellSeq);
        const fy = Math.floor(Math.random() * cellSeq);

        let onSnake = false;
        for (const s of snake) {
            if (s.x === fx && s.y === fy) { onSnake = true; break; }
        }
        if (!onSnake) { food = { x: fx, y: fy }; return; }
    }
}

function drawFood() {
    ctx.beginPath();
    ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        (cellSize / 2) - 12,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
}

// ---------- Logic ----------
function checkCollision() {
    const head = snake[0];

    if (head.x < 0 || head.x >= cellSeq || head.y < 0 || head.y >= cellSeq) {
        gameover = true;
        alert("GameOver");
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameover = true;
            alert("GameOver");
            return true;
        }
    }
    return false;
}

function doStep() {
    // Apply buffered input BEFORE moving
    if (dirQueue.length) {
        const next = dirQueue.shift();
        // extra safety: don't reverse current dir
        if (!isReverse(next, snakeDir)) snakeDir = next;
    }
    // snapshot start-of-step positions for smooth interpolation
    prevSnake = snake.map(p => ({ ...p }));
    progress = 0;
    allowInput = true;

    // move one grid cell
    const head = snake[0];
    const newHead = { x: head.x + snakeDir[0], y: head.y + snakeDir[1] };
    snake.unshift(newHead);

    if (grow > 0) {
        grow--;
    } else {
        snake.pop();
    }

    // collision after moving (matches your current feel best)
    if (checkCollision()) return;

    // eat
    const h = snake[0];
    if (h.x === food.x && h.y === food.y) {
        score++;
        document.getElementById("score").innerText = `: ${score}`;
        if (score > highscore) highscore = score;
        document.getElementById("highscore").innerText = `Highscore: ${highscore}`;

        grow++;
        spawnFood();
    }
}

// Smooth draw: interpolate each segment from prevSnake -> snake
function lerpColor(a, b, t) {
    // a,b: [r,g,b]
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t),
    ];
}
function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

function drawSnakeProcedural() {
    const t = clamp(progress, 0, 1);
    const lastPrev = prevSnake[prevSnake.length - 1];

    // Interpolated positions in GRID coords (floats)
    const pos = [];
    for (let i = 0; i < snake.length; i++) {
        const cur = snake[i];
        const prev = prevSnake[i] ?? lastPrev;
        pos.push({
            x: lerp(prev.x, cur.x, t),
            y: lerp(prev.y, cur.y, t),
        });
    }

    // ---- Style knobs (tweak these) ----
    const headColor = [90, 150, 255];   // light blue
    const tailColor = [0, 60, 160];     // dark blue

    const headWidth = cellSize * 0.78;  // thickness near head
    const tailWidth = cellSize * 0.55;  // thickness at tail

    // Body shadow-ish outline (optional)
    const outline = true;
    const outlineWidth = cellSize * 0.10;
    const outlineColor = "rgba(0,0,0,0.12)";

    // ---------------- Body ----------------
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Optional outline pass behind everything (makes it pop like the screenshot)
    if (outline) {
        ctx.strokeStyle = outlineColor;
        for (let i = pos.length - 1; i >= 1; i--) {
            const p0 = pos[i];
            const p1 = pos[i - 1];

            const x0 = p0.x * cellSize + cellSize / 2;
            const y0 = p0.y * cellSize + cellSize / 2;
            const x1 = p1.x * cellSize + cellSize / 2;
            const y1 = p1.y * cellSize + cellSize / 2;

            const tt = i / (pos.length - 1); // 0=head, 1=tail-ish if iter reversed — we’ll treat per segment anyway
            // We want outline to track the same taper
            const w = lerp(headWidth, tailWidth, i / (pos.length - 1)) + outlineWidth;

            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        }
    }

    // Main colored body pass (segment-by-segment gradient + taper)
    for (let i = pos.length - 1; i >= 1; i--) {
        const p0 = pos[i];
        const p1 = pos[i - 1];

        const x0 = p0.x * cellSize + cellSize / 2;
        const y0 = p0.y * cellSize + cellSize / 2;
        const x1 = p1.x * cellSize + cellSize / 2;
        const y1 = p1.y * cellSize + cellSize / 2;

        // "u" is 0 at head segment, 1 near tail
        const u = i / (pos.length - 1);

        const c = lerpColor(headColor, tailColor, u);
        ctx.strokeStyle = rgb(c);

        ctx.lineWidth = lerp(headWidth, tailWidth, u);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    }

    // ---------------- Head ----------------
    const head = pos[0];
    const hx = head.x * cellSize + cellSize / 2;
    const hy = head.y * cellSize + cellSize / 2;

    // Head circle
    const headR = headWidth * 0.52;
    ctx.beginPath();
    ctx.arc(hx, hy, headR, 0, Math.PI * 2);
    ctx.fillStyle = rgb(headColor);
    ctx.fill();

    // ---------------- Eyes ----------------
    // Use snakeDir to face eyes forward. We assume snakeDir is unit grid dir.
    const dx = snakeDir[0], dy = snakeDir[1];

    // Perpendicular vector for spacing eyes
    const px = -dy, py = dx;

    // Eye positions relative to head center
    const eyeForward = headR * 0.25;
    const eyeSide = headR * 0.35;

    const ex1 = hx + dx * eyeForward + px * eyeSide;
    const ey1 = hy + dy * eyeForward + py * eyeSide;
    const ex2 = hx + dx * eyeForward - px * eyeSide;
    const ey2 = hy + dy * eyeForward - py * eyeSide;

    const eyeR = headR * 0.22;
    const pupilR = eyeR * 0.45;

    // White eyes
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();

    // Pupils (slightly forward)
    const pupilForward = eyeR * 0.25;
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(ex1 + dx * pupilForward, ey1 + dy * pupilForward, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2 + dx * pupilForward, ey2 + dy * pupilForward, pupilR, 0, Math.PI * 2); ctx.fill();

    // Optional tiny highlight dot on pupils (cute factor)
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    const hl = pupilR * 0.35;
    ctx.beginPath(); ctx.arc(ex1 + dx * pupilForward - hl, ey1 + dy * pupilForward - hl, hl, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2 + dx * pupilForward - hl, ey2 + dy * pupilForward - hl, hl, 0, Math.PI * 2); ctx.fill();
}

// ---------- Main loop w/ delta time ----------
let lastTime = null;
let accumulator = 0;

function frame(nowMs) {
    if (gameover) return;

    if (lastTime === null) lastTime = nowMs;
    const dt = (nowMs - lastTime) / 1000; // seconds
    lastTime = nowMs;

    // avoid giant dt when tab is inactive
    const cappedDt = Math.min(dt, 0.05);
    accumulator += cappedDt;

    // step simulation at fixed rate
    while (accumulator >= stepTime) {
        accumulator -= stepTime;
        doStep();
        if (gameover) return;
    }

    // progress for interpolation
    progress = accumulator / stepTime;

    // draw
    drawEnvironment();
    drawFood();
    drawSnakeProcedural();

    requestAnimationFrame(frame);
}

function gameStart() {
    gameover = false;
    lastTime = null;
    accumulator = stepTime; // so we do an immediate step on start
    requestAnimationFrame(frame);
}

// ---------- Input ----------
let dirQueue = [];          // holds upcoming directions
const maxQueuedDirs = 2;    // 1–3 is typical, 2 feels great

function isReverse(a, b) {
  return a[0] === -b[0] && a[1] === -b[1];
}

function sameDir(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function queueDir(nx, ny) {
  const next = [nx, ny];

  // Determine what direction we'd be turning from:
  // - last queued direction, if any
  // - otherwise current snakeDir
  const base = dirQueue.length ? dirQueue[dirQueue.length - 1] : snakeDir;

  // don't queue duplicates
  if (sameDir(next, base)) return;

  // don't allow reversing relative to the base direction
  if (isReverse(next, base)) return;

  if (dirQueue.length < maxQueuedDirs) {
    dirQueue.push(next);
  } else {
    // optional: replace last queued direction (feels even more responsive)
    dirQueue[dirQueue.length - 1] = next;
  }
}

window.onkeydown = function (e) {
    const keyDown = e.key.toLowerCase();

    switch (keyDown) {
        case "w":
        case "arrowup":
            queueDir(0, -1);
            break;

        case "s":
        case "arrowdown":
            queueDir(0, 1);
            break;

        case "a":
        case "arrowleft":
            queueDir(-1, 0);
            break;

        case "d":
        case "arrowright":
            queueDir(1, 0);
            break;

        case "r":
            // reset
            dirQueue = [];
            gameover = false;
            score = 0;
            document.getElementById("score").innerText = `: ${score}`;
            document.getElementById("highscore").innerText = `Highscore: ${highscore}`;

            snake = [
                { x: cellSeq / 2, y: cellSeq / 2 },
                { x: (cellSeq / 2) - 1, y: (cellSeq / 2) },
                { x: (cellSeq / 2) - 2, y: (cellSeq / 2) },
            ];
            snakeDir = [1, 0];
            grow = 0;
            prevSnake = snake.map(p => ({ ...p }));
            progress = 1;

            // restart animation loop cleanly
            lastTime = null;
            accumulator = stepTime;
            requestAnimationFrame(frame);
            break;
    }
};
