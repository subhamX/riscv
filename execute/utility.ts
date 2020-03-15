export function addZeros(imm:string, length: number):string{
    let n = length - imm.length;
    while(n>0){
        imm = "0" + imm;
        n--;
    }
    return imm;
}