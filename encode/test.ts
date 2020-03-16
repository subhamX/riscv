import * as fs from 'fs';

console.log("<----- TESTING OUTPUT ----->")

let myFile = fs.readFileSync(__dirname + '/src/out/myOutput.m', {encoding: 'utf-8'})
let output = fs.readFileSync(__dirname + '/src/out/venusOutput.m', {encoding: 'utf-8'})
let myFileLines = myFile.split('\n');
let outputLines = output.split('\n');
let flag = false;
for(let i=0 ;i< myFileLines.length; i++){
    let myInst = myFileLines[i].split(' ')[1];
    let outputInstr = outputLines[i];
    if(myInst && outputInstr){
        if(parseInt(myInst)!=parseInt(outputInstr)){
            console.log("ERROR", myInst, outputInstr);
            flag= true;
        }
    }
}
if(!flag){
    console.log("NO Error Encountered");
}
console.log("My Output Length: ", myFileLines.length);
console.log("Venus Output Length: ", outputLines.length);