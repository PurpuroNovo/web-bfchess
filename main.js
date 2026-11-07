import { BFChess } from "./engine";
import { Chess } from "chess.js"

var newSpan = document.getElementById("engineSpan");

var playWhite = document.getElementById("playWhite");
var playBlack = document.getElementById("playBlack");
var playRandom = document.getElementById("playRandom");
var downloadPGN = document.getElementById("downloadPGN");

var engine = null;
var board = null;
var game = null;
var engineIsWhite = false;
var playerIsWhite = false;

function onDragStart(source, piece, position, orientation) {
    if (game.isGameOver()) return false
    const isWhite = piece.search(/^b/) !== -1; // kind of dumb but ok

    return isWhite !== playerIsWhite;
}

function makeEngineMove() {
    let start = Date.now();
    let move = engine.bestMove();
    if (move == "") {
        newSpan.textContent = "Engine took too long.";
    }
    console.log(`Engine move: ${move}`);
    let moveObject = game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move.length == 5 ? move.slice(4) : "q" });
    newSpan.textContent = `Took ${(Date.now() - start) / 1000}s. Engine played ${moveObject.san}`;
    engine.pushMove(move);
    board.position(game.fen());
    if (game.isCheckmate()) newSpan.textContent += ". Checkmate, engine wins!";
    if (game.isDraw()) newSpan.textContent += ". Draw, nobody wins!";
    if (game.isStalemate()) newSpan.textContent += ". Stalemate!";
}

function onDrop(source, target) {
    if (source == target) return "snapback";
    const moves = game.moves({ verbose: true });
    let move = null;
    moves.forEach(legalMove => {
        if (legalMove.from == source && legalMove.to == target) move = legalMove;
    })
    if (move === null) return "snapback";

    game.move(move);
    board.position(game.fen());
    if (game.isCheckmate()) {
        newSpan.textContent = "Checkmate, you win!";
    }
    if (game.isDraw()) {
        newSpan.textContent = "Draw, nobody wins!";
        return;
    }
    if (game.isStalemate()) {
        newSpan.textContent = "Stalemate!";
        return;
    }
    if (!game.isGameOver()) {
        engine.pushMove(move.lan);
        newSpan.textContent = "Engine is thinking...";
        window.setTimeout(makeEngineMove, 1000);
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function startGame(engineWhite) {
    engineIsWhite = engineWhite;
    playerIsWhite = !engineWhite;
    if (board) board.destroy();
    engine.reset();
    game = new Chess();
    game.setHeader(engineIsWhite ? "White" : "Black", "BFChess");
    game.setHeader(playerIsWhite ? "White" : "Black", "Player");
    board = Chessboard("board1", {
        draggable: true,
        orientation: playerIsWhite ? "white" : "black",
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });
    if (engineIsWhite) setTimeout(makeEngineMove, 500);
}

playWhite.onclick = () => {
    startGame(false);
}
playBlack.onclick = () => {
    startGame(true);
}
playRandom.onclick = () => {
    startGame(Math.random() > .5);
}
downloadPGN.onclick = () => {
    if (!game) return alert("There's no game to download!");
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(game.pgn()));
    element.setAttribute("download", "game.pgn");

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

//const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

fetch("chess.json").then(async (response) => {
    const engineCode = await response.text();
    const tokens = JSON.parse(engineCode);
    engine = new BFChess(tokens);

    playBlack.disabled = false;
    playWhite.disabled = false;
    playRandom.disabled = false;
    downloadPGN.disabled = false;

    newSpan.textContent = `Engine loaded!`;
});
