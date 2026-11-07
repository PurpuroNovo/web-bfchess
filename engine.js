//const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

import { BrainfuckRuntime } from "./brainfuck";

export class BFChess {
    constructor(tokens) {
        this.runtime = new BrainfuckRuntime(tokens, 2000);
        this.best = undefined;
        this.reset();
    }

    reset() {
        this.runtime.reset();
        this.runtime.send("uci");
        this.runtime.readUntil("uciok");
        this.runtime.send("isready");
        this.runtime.readUntil("readyok");
        this.runtime.send("position startpos\n");
    }

    pushMove(move) {
        this.runtime.send(`domove ${move}\n`);
        this.best = undefined;
    }

    bestMove() {
        if (this.best) return this.best;
        this.runtime.send("go");
        const lines = this.runtime.readUntil("bestmove");
        this.best = lines[0].substring(9);
        return this.best;
    }
}
