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

    let engineIsWhite = Math.random() > .5
    let playerIsWhite = !engineIsWhite;
    newSpan.textContent = `Done. Engine plays as ${engineIsWhite ? "white" : "black"}`;

    const game = new Chess();
    game.setHeader(engineIsWhite ? "White" : "Black", "BFChess");
    game.setHeader(playerIsWhite ? "White" : "Black", "Player");

    function onDragStart(source, piece, position, orientation) {
        if (game.isGameOver()) return false
        const isWhite = piece.search(/^b/) !== -1; // kind of dumb but ok

        return isWhite !== playerIsWhite;
    }

    function makeEngineMove() {
        let start = Date.now();
        let move = engine.bestMove();
        let moveObject = game.move({ from: move.slice(0,2), to: move.slice(2,4), promotion: move.length == 5 ? move.slice(4) : "q" });
        newSpan.textContent = `Took ${(Date.now() - start) / 1000}s. Engine played ${moveObject.san}`;
        engine.pushMove(move);
        board.position(game.fen());
        if (game.isGameOver()) console.log(game.pgn());
    }

    function onDrop(source, target) {
        if (source == target) return "snapback";
        const moves = game.moves({ verbose: true });
        let move = null;
        moves.forEach(legalMove => {
            if (legalMove.from == source && legalMove.to == target) move = legalMove;
        })
        if (move === null) return "snapback";

        console.log(game.move(move), "please");
        if (game.isGameOver()) console.log(game.pgn());
        engine.pushMove(move.lan);
        window.setTimeout(makeEngineMove, 1000);
        if (game.isGameOver()) console.log(game.pgn());
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    var config = {
        draggable: true,
        orientation: playerIsWhite ? "white" : "black",
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    }
    let board = Chessboard("board1", config);

    if (engineIsWhite) makeEngineMove();
});
