import { BFChess } from "./engine";
import { Chess } from "chess.js"

//const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

fetch("chess.json").then(async (response) => {
    let newSpan = document.createElement("span");
    newSpan.textContent = "Loading code...";
    document.body.appendChild(newSpan);
    document.body.appendChild(document.createElement("br"));

    const engineCode = await response.text();
    const tokens = JSON.parse(engineCode);
    let engine = new BFChess(tokens);
    var board = Chessboard("board1", "start");

    newSpan.textContent = "Done.";

    const game = new Chess();

    function playItself() {
        let start = Date.now();
        let move = engine.bestMove();
        newSpan.textContent = `Took ${(Date.now() - start) / 1000}s`;
        game.move(move);
        engine.pushMove(move);
        board.position(game.fen());
    }

    document.getElementById("playItself").onclick = playItself;
});
