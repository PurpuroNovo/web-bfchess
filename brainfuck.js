const ADD   = 1;
const MOVE  = 3;
const WHILE = 4;
const END   = 5;
const OUT   = 6;
const IN    = 7;

const SET   = 8;
const COPY  = 9;
const MUL   = 10;

fetch("chess.bf").then(async (response) => {
    // Turn that to IR

    const engineCode = await response.text();

    let tokens = [{"type": SET, "value": 0}];
    let loopDepth = 0;
    let hasUnbalance = false;
    let loopInfo = {}
    for (const char of engineCode) {
        let lastIndex = tokens.length - 1
        let lastInstruction = tokens[lastIndex];
        
        if (char == "+" || char == "-") {
            const value = char == "+" ? 1 : 255;
            if (lastInstruction && lastInstruction.type == ADD || lastInstruction.type == SET) {
                tokens[lastIndex].value = (lastInstruction.value + value) % 256;
            } else {
                tokens.push({"type": ADD, "value": value});
            }
        } else if (char == ">" || char == "<") {
            const value = char == ">" ? 1 : -1;
            if (lastInstruction && lastInstruction.type == MOVE) {
                tokens[lastIndex].value += value;
            } else {
                tokens.push({"type": MOVE, "value": value});
            }
        } else if (char == ".") {
            tokens.push({"type": OUT, "value": 0});
        } else if (char == ",") {
            tokens.push({"type": IN, "value": 0});
        } else if (char == "[") {
            loopInfo[loopDepth] = tokens.length;
            tokens.push({"type": WHILE, "value": loopDepth});
            loopDepth++;
        } else if (char == "]") {
            loopDepth -= 1;
            const loopData = tokens.slice(loopInfo[loopDepth] + 1);
            tokens[loopInfo[loopDepth]].siblingToken = tokens.length;
            tokens.push({"type": END, "value": loopDepth, "siblingToken": loopInfo[loopDepth]});

            const mask = {};
            let maskPointer = 0;
            let valid = true;
            for (let index = 0; index < loopData.length; index++) {
                const instruction = loopData[index];

                if (instruction.type == ADD) {
                    mask[maskPointer] = ((mask[maskPointer] ? mask[maskPointer] : 0) + instruction.value) % 256
                } else if (instruction.type == MOVE) {
                    maskPointer += instruction.value;
                } else {
                    valid = false;
                }
            }

            tokens[tokens.length - 1].balance = maskPointer;
            tokens[tokens[tokens.length - 1].siblingToken].balance = maskPointer;

            if (maskPointer != 0) {
                hasUnbalance = true;
            }

            if (valid && maskPointer == 0) {
                if (mask[0] == 255) { // This is either a set, move or multiply
                    tokens = tokens.slice(0, -(loopData.length+2));
                    lastIndex = tokens.length - 1
                    lastInstruction = tokens[lastIndex];

                    if (Object.keys(mask).length == 1) {
                        // This is a set operation
                        if (lastInstruction && (lastInstruction.type == ADD || lastInstruction.type == SET)) {
                            tokens.pop();
                        }

                        tokens.push({"type": SET, "value": 0});
                    } else {
                        // This is move or multiply

                        for (const key in mask) {
                            keyInt = parseInt(key);
                            if (keyInt != 0) {
                                const keyValue = parseInt(mask[key]);
                                if (keyValue == 1) {
                                    // This is move
                                    tokens.push({"type": COPY, "value": keyInt});
                                } else {
                                    tokens.push({"type": MUL, "value": keyInt, "mul": keyValue});
                                }
                            }
                        }

                        tokens.push({"type": SET, "value": 0});
                    }
                }
            }
        }
    }

    let newDiv = document.createElement("span");
    newDiv.textContent = JSON.stringify(hasUnbalance);
    document.body.appendChild(newDiv);
    document.body.appendChild(document.createElement("br"));

    console.log(`IR length: ${tokens.length}`);

    tokens.forEach((instruction) => {
        let newDiv = document.createElement("span");
        newDiv.textContent = JSON.stringify(instruction);
        document.body.appendChild(newDiv);
        document.body.appendChild(document.createElement("br"));
    });


    /*
    let start = Date.now();
    let out = "";
    const memory = new Uint8Array(3000);
    let executingPointer = 0;
    let currentInstruction = 0
    while(currentInstruction < ir.length) {
        const instruction = ir[currentInstruction];
        if (instruction == undefined) break;
        const value = instruction.value;

        switch (instruction.type) {
            case ADD:
                memory[executingPointer] += value;
                break;
            case SET:
                memory[executingPointer] = value;
                break;
            case MOVE:
                executingPointer += value;
                break;
            case COPY:
                memory[executingPointer+value] += memory[executingPointer];
                break;
            case MUL:
                memory[executingPointer+value] += memory[executingPointer]*instruction.mul;
                break;
            case WHILE:
                if (memory[executingPointer] == 0) {
                    currentInstruction = instruction.siblingToken;
                }
                break;
            case END:
                if (memory[executingPointer] != 0) {
                    currentInstruction = instruction.siblingToken;
                }
                break;
            
            case OUT:
                out += String.fromCharCode(memory[executingPointer]);
                if (String.fromCharCode(memory[executingPointer]) == "\n") {
                    console.log(out);
                    out = "";
                }
                break;
            
            default:
                break;
        }

        currentInstruction++;
    }

    console.log(Date.now() - start);
    */
})