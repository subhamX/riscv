// func to map opcode with corresponding instruction type
export function opcodeMapfunc(opMap: Map<String, string>) {
    // R type
    opMap.set('0110011', 'R');

    // I type
    opMap.set('0010011', 'I');
    // Load instructions
    opMap.set('0000011', 'I');
    opMap.set('1100111', 'I');

    // S type
    opMap.set('0100011', 'S');

    // SB type
    opMap.set('1100011', 'SB');

    // U type
    opMap.set('0110111', 'U');
    opMap.set('0010111', 'U');

    // UJ type
    opMap.set('1101111', 'UJ');
}

// function to map opcode + func3 + func7 to operand
export function operationMapfunc(operMap: Map<string, string>) {
    // R type
    operMap.set("0000000000", 'add');
    operMap.set("0000100000", 'sub');
    operMap.set("0000000001", 'mul');
    operMap.set("1000000001", 'div');
    operMap.set("1100000001", 'rem');
    operMap.set("1110000000", 'and');
    operMap.set("1100000000", 'or');
    operMap.set("1000000000", 'xor');
    operMap.set("0010000000", 'sll');
    operMap.set("0100000000", 'slt');
    operMap.set("1010100000", 'sra');
    operMap.set("1010000000", 'srl');

    // I type
    operMap.set("0010011000", 'addi');
    operMap.set("0010011111", 'andi');
    operMap.set("0010011110", 'ori');
    operMap.set("0000011000", 'lb');
    operMap.set("0000011011", 'ld');
    operMap.set("0000011001", 'lh');
    operMap.set("0000011010", 'lw');
    operMap.set("1100111000", 'jalr');

    // S type
    operMap.set("0100011000", 'sb');
    operMap.set("0100011010", 'sw');
    operMap.set("0100011011", 'sd');
    operMap.set("0100011001", 'sh');

    // SB type
    operMap.set("1100011000", 'beq');
    operMap.set("1100011001", 'bne');
    operMap.set("1100011101", 'bge');
    operMap.set("1100011100", 'blt');

    // U type
    operMap.set("0110111", 'lui');
    operMap.set("0010111", 'auipc');

    // UJ type
    operMap.set("1101111", 'jal');
}