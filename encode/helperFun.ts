


// Function adds zeros to make the size of any register exactly 5 bit
export function addRegZeros(reg:string):string {
    let n = 5 - reg.length;
    while(n>0){
        reg = "0" + reg;
        n--;
    }
    return reg;
}

export function addZeros(imm:string, length: number):string{
    let n = length - imm.length;
    while(n>0){
        imm = "0" + imm;
        n--;
    }
    return imm;
}

// Function to prePrcocess the instructions. It removes the comments and trims the instruction.
export function preProcess(lines: string[]): string[] {
    let finalLines: string[] = Array();
    for (let line of lines) {
        line = line.trim();
        // If the instruction is not a comment
        if (line && line[0] != '#') {
            line = line.split("sp").join('x2');
            finalLines.push(line);
        }
    }
    return finalLines;
}


