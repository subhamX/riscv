


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