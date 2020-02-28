import * as schema from './schema/schema';


// loadRefMap creates a map between mnemonic and its metadata 
export function loadRefMap(refMap: Map<String, schema.InstructionMetaData>) {
    // R Type Instructions
    refMap.set('add', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('and', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('or',  { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('sll', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('slt', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('sra', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('srl', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('sub', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('xor', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('mul', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('div', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    refMap.set('rem', { format: "R", opcode: "0110011", func3: "011", func7: "0100101"});
    // I Type Instructions
    refMap.set('addi', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('andi', { format: "I", opcode: "0010011", func3: "111", immLen: 12});
    refMap.set('ori', { format: "I", opcode: "0010011", func3: "110", immLen: 12});
    refMap.set('lb', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('ld', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('lh', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('lw', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('jalr', { format: "I", opcode: "0110011", func3: "011", immLen: 12});
    // S Type Instructions
    refMap.set('sb', { format: "S", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('sw', { format: "S", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('sd', { format: "S", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('sh', { format: "S", opcode: "0110011", func3: "011", immLen: 12});
    // SB Type Instructions
    refMap.set('beq', { format: "SB", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('bne', { format: "SB", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('bge', { format: "SB", opcode: "0110011", func3: "011", immLen: 12});
    refMap.set('blt', { format: "SB", opcode: "0110011", func3: "011", immLen: 12});
    // U Type Instructions
    // Here immLen refers to 20 bits from MSB
    refMap.set('lui', { format: "U", opcode: "0110011", immLen: 20});
    refMap.set('auipc', { format: "U", opcode: "0110011", immLen: 20});
    // UJ Type Instructions
    refMap.set('beq', { format: "SB", opcode: "0110011", func3: "011", immLen: 20});
}