let gameover = false;
let loopInterval = null;

const speed = 250;

const canvasSize = 512;
const cellSeq = 8;
const cellSize = 512/cellSeq;

var canvas  = document.getElementById("_canvas");
var ctx     = canvas.getContext("2d");

function drawEnvironment()
{
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.backgroundColor = "#00AE00";

    for(let i = 0; i < cellSeq; i++)
    {
        for(let j = 0; j < cellSeq; j++)
        {
            ctx.fillStyle = ((i+j) % 2 == 0) ? "#A9D751" : "#A2D049";
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
}

let snake = [
    {x: cellSeq/2, y: cellSeq / 2},
    {x: (cellSeq/2) - 1, y: (cellSeq/2)},
    {x: (cellSeq/2) - 2, y: (cellSeq/2)},
]
let snakeDir = [1, 0];

function drawSnake() {
    for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];

        const t = i / (snake.length - 1);
        const radius = cellSize * 0.5 * (0.8 - 0.6 * t);

        ctx.beginPath();
        ctx.arc(
            s.x * cellSize + cellSize / 2,
            s.y * cellSize + cellSize / 2,
            radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = i === 0 ? "#0033cc" : "#0055ff";
        ctx.fill();
    }
}

let food = {x: (cellSeq / 4) + 3, y: cellSeq / 4}
function spawnFood() {
    while (true) {
        const fx = Math.floor(Math.random() * cellSeq);
        const fy = Math.floor(Math.random() * cellSeq);

        let onSnake = false;
        for (const s of snake) {
            if (s.x === fx && s.y === fy) { onSnake = true; break; }
        }
        if (!onSnake) { food = {x: fx, y: fy}; return; }
    }
}

function drawFood() {
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, (cellSize / 2) - 12, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
}

function checkCollision()
{
    const head = snake[0];

    if (head.x < 0 || head.x >= cellSeq || head.y < 0 || head.y >= cellSeq)
    {
        clearInterval(loopInterval);
        alert("GameOver");
        return;
    }

    for (let i = 1; i < snake.length; i++)
    {
        if (snake[i].x === head.x && snake[i].y === head.y)
        {
            clearInterval(loopInterval);
            alert("GameOver");
            return;
        }
    }
}

let grow = 0;

function move()
{
    const head = snake[0];
    const newHead = {x: head.x + snakeDir[0], y: head.y + snakeDir[1]}
    snake.unshift(newHead);

    if(grow > 0)
    {
        grow--;
    }
    else
    {
        snake.pop();
    }
}

let allowInput = true;
let score = 0;
let highscore = 0;

function gameloop()
{
    allowInput = true;
    // snakePos[0] += snakeDir[0]
    // snakePos[1] += snakeDir[1]

    checkCollision();
    move()
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById("score").innerText = `: ${score}`;
        if(score > highscore) { highscore = score; }
        document.getElementById("highscore").innerText = `Highscore: ${score}`;

        grow++;
        spawnFood();
    }

    drawEnvironment();
    drawFood();
    drawSnake();
}

function gameStart()
{
    gameloop();
    loopInterval = setInterval(gameloop, speed);
}

function setDir(nx, ny) {
    if(allowInput)
    {
        if (nx === -snakeDir[0] && ny === -snakeDir[1]) return;
        snakeDir = [nx, ny];
    }
    allowInput = false;
}

window.onkeydown = function(e)
{
    let keyDown = e.key.toLowerCase();
    console.log(keyDown);

    switch(keyDown)
    {
        case "w":
        case "arrowup":
            setDir(0, -1);
            break;

        case "s":
        case "arrowdown":
            setDir(0, 1);
            break;

        case "a":
        case "arrowleft":
            setDir(-1, 0);
            break;

        case "d":
        case "arrowright":
            setDir(1, 0);
            break;

        case "r":
            clearInterval(loopInterval);
            score = 0;
            document.getElementById("score").innerText = `: ${score}`;

            snake = [
                {x: cellSeq/2, y: cellSeq / 2},
                {x: (cellSeq/2) - 1, y: (cellSeq/2)},
                {x: (cellSeq/2) - 2, y: (cellSeq/2)},
            ]
            snakeDir = [1, 0];
            loopInterval = setInterval(gameloop, speed);
            break;
    }
}

