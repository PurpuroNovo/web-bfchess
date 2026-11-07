import { BrainfuckRuntime, brainfuckToTokens } from "./brainfuck";

//const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

fetch("chess.json").then(async (response) => {
    let newSpan = document.createElement("span");
    newSpan.textContent = "Downloaded code, tokenizing it...";
    document.body.appendChild(newSpan);
    document.body.appendChild(document.createElement("br"));

    const engineCode = await response.text();
    const tokens = JSON.parse(engineCode);
    let runtime = new BrainfuckRuntime(tokens, 2000);

    runtime.send("uci");
    runtime.readUntil("uciok");
    runtime.send("isready");
    runtime.readUntil("readyok");
    runtime.send("position startpos\n");
    //runtime.send("domove d2d4\n")
    runtime.send("go")
    console.log(runtime.readUntil("bestmove"));
});
