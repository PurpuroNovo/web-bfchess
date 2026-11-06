/*
This runtime is made specifically for the engine in mind
If the brainfuck code had a loop that didn't start where it ended, this would break.
*/

const ENGINE_URL = "https://raw.githubusercontent.com/acherm/agentic-chessengine-brainfuck/refs/heads/master/chess.bf";

const ADD   = 1;
const WHILE = 4;
const END   = 5;
const OUT   = 6;
const IN    = 7;

const SET   = 8;
const COPY  = 9;
const MUL   = 10;

function brainfuckToTokens(engineCode) {
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
                            keyInt = parseInt(key);
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

fetch(ENGINE_URL).then(async (response) => {
    let newDiv = document.createElement("span");
    newDiv.textContent = "Downloaded code, tokenizing it...";
    document.body.appendChild(newDiv);
    document.body.appendChild(document.createElement("br"));

    const engineCode = await response.text();
    let tokens = brainfuckToTokens(engineCode);

    console.log(`IR length: ${tokens.length}`);

    tokens.forEach((instruction) => {
        let newSpan = document.createElement("span");
        newSpan.textContent = JSON.stringify(instruction);
        document.body.appendChild(newSpan);
        document.body.appendChild(document.createElement("br"));
    });

    setTimeout(() => {
    let input = "uci\nisready\nposition startpos\ngo".split("");
    let out = "";
    const memory = new Uint8Array(3000);
    let currentInstruction = 0
    while(currentInstruction < tokens.length) {
        const instruction = tokens[currentInstruction];
        if (instruction == undefined) break;
        const value = instruction.value;
        const pointer = instruction.pointer;

        switch (instruction.type) {
            case ADD:
                memory[pointer] += value;
                break;
            case SET:
                memory[pointer] = value;
                break;
            case COPY:
                memory[pointer+value] += memory[pointer];
                break;
            case MUL:
                memory[pointer+value] += memory[pointer]*instruction.mul;
                break;
            case WHILE:
                if (memory[pointer] == 0) {
                    currentInstruction = instruction.siblingToken;
                }
                break;
            case END:
                if (memory[pointer] != 0) {
                    currentInstruction = instruction.siblingToken;
                }
                break;
            
            case OUT:
                out += String.fromCharCode(memory[pointer]);
                console.log(out);
                break;
            
            case IN:
                let inValue = 0;
                if (input.length > 0) {
                    inValue = input.shift().charCodeAt(0);
                }
                memory[pointer] = inValue;
            default:
                break;
        }

        currentInstruction++;
    }

    }, 10*1000);
})