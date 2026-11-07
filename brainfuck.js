/*
This runtime is made specifically for the engine in mind
If the brainfuck code had a loop that didn't start where it ended, this would break.
*/

const ADD   = 1;
const WHILE = 4;
const END   = 5;
const OUT   = 6;
const IN    = 7;

const SET   = 8;
const COPY  = 9;
const MUL   = 10;

export function brainfuckToTokens(engineCode) {
    let pointer = 0;
    let tokens = [{"type": SET, "value": 0, "pointer": 0}];
    let loopDepth = 0;
    let loopInfo = {}
    for (const char of engineCode) {
        let lastIndex = tokens.length - 1
        let lastInstruction = tokens[lastIndex];
        
        if (char == "+" || char == "-") {
            const value = char == "+" ? 1 : 255;
            if (lastInstruction && (lastInstruction.type == ADD || lastInstruction.type == SET) && lastInstruction.pointer == pointer) {
                tokens[lastIndex].value = (lastInstruction.value + value) % 256;
            } else {
                tokens.push({"type": ADD, "value": value, "pointer": pointer});
            }
        } else if (char == ">" || char == "<") {
            const value = char == ">" ? 1 : -1;
            pointer += value;
        } else if (char == ".") {
            tokens.push({"type": OUT, "value": 0, "pointer": pointer});
        } else if (char == ",") {
            tokens.push({"type": IN, "value": 0, "pointer": pointer});
        } else if (char == "[") {
            loopInfo[loopDepth] = tokens.length;
            tokens.push({"type": WHILE, "value": loopDepth, "pointer": pointer});
            loopDepth++;
        } else if (char == "]") {
            loopDepth -= 1;
            const loopData = tokens.slice(loopInfo[loopDepth] + 1);
            tokens[loopInfo[loopDepth]].siblingToken = tokens.length;
            tokens.push({"type": END, "value": loopDepth, "siblingToken": loopInfo[loopDepth], "pointer": pointer});

            const mask = {};
            let valid = true;
            for (let index = 0; index < loopData.length; index++) {
                const instruction = loopData[index];
                const maskPointer = instruction.pointer - pointer;

                if (instruction.type == ADD) {
                    mask[maskPointer] = ((mask[maskPointer] ? mask[maskPointer] : 0) + instruction.value) % 256
                } else {
                    valid = false;
                }
            }

            //tokens[tokens.length - 1].balance = maskPointer;
            //tokens[tokens[tokens.length - 1].siblingToken].balance = maskPointer;

            if (valid) {
                if (mask[0] == 255) { // This is either a set, move or multiply
                    tokens = tokens.slice(0, -(loopData.length+2));
                    lastIndex = tokens.length - 1
                    lastInstruction = tokens[lastIndex];

                    if (Object.keys(mask).length == 1) {
                        // This is a set operation
                        if (lastInstruction && (lastInstruction.type == ADD || lastInstruction.type == SET) && lastInstruction.pointer == pointer) {
                            tokens.pop();
                        }

                        tokens.push({"type": SET, "value": 0, "pointer": pointer});
                    } else {
                        // This is move or multiply

                        for (const key in mask) {
                            let keyInt = parseInt(key);
                            if (keyInt != 0) {
                                const keyValue = parseInt(mask[key]);
                                if (keyValue == 1) {
                                    // This is move
                                    tokens.push({"type": COPY, "value": keyInt, "pointer": pointer});
                                } else {
                                    tokens.push({"type": MUL, "value": keyInt, "mul": keyValue, "pointer": pointer});
                                }
                            }
                        }

                        tokens.push({"type": SET, "value": 0, "pointer": pointer});
                    }
                }
            }
        }
    }

    return tokens;
}

export class BrainfuckRuntime {
    constructor(tokens, memorySize) {
        this.tokens = tokens;
        this.memorySize = memorySize;
        this.instructionPointer = 0;
        this.memory = new Uint8Array(memorySize);
        this.inputBuffer = [];
    }

    reset() {
        this.memory = new Uint8Array(this.memorySize);
        this.instructionPointer = 0;
        this.inputBuffer = [];
    }

    run(steps) {
        let out = "";
        for (let index = 0; index < steps; index++) {
            const instruction = this.tokens[this.instructionPointer];
            if (instruction == undefined) break;
            const value = instruction.value;
            const pointer = instruction.pointer;

            switch (instruction.type) {
                case ADD:
                    this.memory[pointer] += value;
                    break;
                case SET:
                    this.memory[pointer] = value;
                    break;
                case COPY:
                    this.memory[pointer+value] += this.memory[pointer];
                    break;
                case MUL:
                    this.memory[pointer+value] += this.memory[pointer]*instruction.mul;
                    break;
                case WHILE:
                    if (this.memory[pointer] == 0) {
                        this.instructionPointer = instruction.siblingToken;
                    }
                    break;
                case END:
                    if (this.memory[pointer] != 0) {
                        this.instructionPointer = instruction.siblingToken;
                    }
                    break;
                
                case OUT:
                    out += String.fromCharCode(this.memory[pointer]);
                    break;
                
                case IN:
                    let inValue = 0;
                    if (this.inputBuffer.length > 0) inValue = this.inputBuffer.shift().charCodeAt(0);
                    this.memory[pointer] = inValue;
                default:
                    break;
            }

            this.instructionPointer++;
        }
        return out;
    }

    send(text) {
        this.inputBuffer = this.inputBuffer.concat(text.split(""));
    }

    readUntil(prefix) {
        let output = "";
        let lines = [];
        let start = Date.now();
        while (true) {
            output += this.run(10**6);
            lines = output.split("\n");
            lines = lines.splice(0, lines.length - 1); // The splice is needed so that an uncompleted line doesn't finish early
            for (const line of lines) {
                if (line.startsWith(prefix)) {
                    return lines;
                }
            }
            if ((Date.now() - start) > 60*1000) { // 60 second timeout
                return lines;
            }
        }
        return lines;
    }
}