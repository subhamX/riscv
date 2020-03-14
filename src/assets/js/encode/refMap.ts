import * as schema from './schema/schema';


// loadRefMap creates a map between mnemonic and its metadata 
export function loadRefMap(refMap: Map<String, schema.InstructionMetaData>) {
    // R Type Instructions
    refMap.set('add', { format: "R", opcode: "0110011", func3: "000", func7: "0000000"});
    refMap.set('and', { format: "R", opcode: "0110011", func3: "111", func7: "0000000"});
    refMap.set('or',  { format: "R", opcode: "0110011", func3: "110", func7: "0000000"});
    refMap.set('sll', { format: "R", opcode: "0110011", func3: "001", func7: "0000000"});
    refMap.set('slt', { format: "R", opcode: "0110011", func3: "010", func7: "0000000"});
    refMap.set('sra', { format: "R", opcode: "0110011", func3: "101", func7: "0100000"});
    refMap.set('srl', { format: "R", opcode: "0110011", func3: "101", func7: "0000000"});
    refMap.set('sub', { format: "R", opcode: "0110011", func3: "000", func7: "0100000"});
    refMap.set('xor', { format: "R", opcode: "0110011", func3: "100", func7: "0000000"});
    refMap.set('mul', { format: "R", opcode: "0110011", func3: "000", func7: "0000001"});
    refMap.set('div', { format: "R", opcode: "0110011", func3: "100", func7: "0000001"});
    refMap.set('rem', { format: "R", opcode: "0110011", func3: "110", func7: "0000001"});
    // I Type Instructions
    refMap.set('addi', { format: "I", opcode: "0010011", func3: "000", immLen: 12});
    refMap.set('andi', { format: "I", opcode: "0010011", func3: "111", immLen: 12});
    refMap.set('ori', { format: "I", opcode: "0010011", func3:  "110", immLen: 12});
    refMap.set('jalr', { format: "I", opcode: "1100111", func3: "000", immLen: 12});

    refMap.set('lb', { format: "I", opcode: "0000011", func3: "000", immLen: 12});
    refMap.set('ld', { format: "I", opcode: "0000011", func3: "011", immLen: 12});
    refMap.set('lh', { format: "I", opcode: "0000011", func3: "001", immLen: 12});
    refMap.set('lw', { format: "I", opcode: "0000011", func3: "010", immLen: 12});
    // S Type Instructions
    refMap.set('sb', { format: "S", opcode: "0100011", func3: "000", immLen: 12});
    refMap.set('sw', { format: "S", opcode: "0100011", func3: "010", immLen: 12});
    refMap.set('sd', { format: "S", opcode: "0100011", func3: "011", immLen: 12});
    refMap.set('sh', { format: "S", opcode: "0100011", func3: "001", immLen: 12});
    // SB Type Instructions
    refMap.set('beq', { format: "SB", opcode: "1100011", func3: "000", immLen: 12});
    refMap.set('bne', { format: "SB", opcode: "1100011", func3: "001", immLen: 12});
    refMap.set('bge', { format: "SB", opcode: "1100011", func3: "101", immLen: 12});
    refMap.set('blt', { format: "SB", opcode: "1100011", func3: "100", immLen: 12});
    // U Type Instructions
    // Here immLen refers to 20 bits from MSB
    refMap.set('lui', { format: "U", opcode: "0110111", immLen: 20});
    refMap.set('auipc', { format: "U", opcode: "0010111", immLen: 20});
    // UJ Type Instructions
    refMap.set('jal', { format: "UJ", opcode: "1101111", immLen: 20});
}
