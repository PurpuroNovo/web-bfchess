import { BFChess } from "./engine";

//const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

fetch("chess.json").then(async (response) => {
    let newSpan = document.createElement("span");
    newSpan.textContent = "Downloaded code, tokenizing it...";
    document.body.appendChild(newSpan);
    document.body.appendChild(document.createElement("br"));

    const engineCode = await response.text();
    const tokens = JSON.parse(engineCode);
    let engine = new BFChess(tokens);
    console.log(engine.bestMove());
});
