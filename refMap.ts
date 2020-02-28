import * as schema from './schema/schema';


// loadRefMap creates a map between mnemonic and its metadata 
export function loadRefMap(refMap: Map<String, schema.InstructionMetaData>) {
    refMap.set('add', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('and', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('or',  { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('sll', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('slt', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('sra', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('srl', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('sub', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('xor', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('mul', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('div', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
    refMap.set('rem', { format: "R", opcode: "0110011", immLen: 10 , func3: "011", func7: "0100101"});
}