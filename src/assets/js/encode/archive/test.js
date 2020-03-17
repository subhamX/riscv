"use strict";
exports.__esModule = true;
var fs = require("fs");
console.log("<----- TESTING OUTPUT ----->");
var myFile = fs.readFileSync(__dirname + '/data.m', { encoding: 'utf-8' });
var output = fs.readFileSync(__dirname + '/output.m', { encoding: 'utf-8' });
var myFileLines = myFile.split('\n');
var outputLines = output.split('\n');
var flag = false;
for (var i = 0; i < myFileLines.length; i++) {
    var myInst = myFileLines[i].split(' ')[1];
    var outputInstr = outputLines[i];
    if (myInst && outputInstr) {
        if (parseInt(myInst) != parseInt(outputInstr)) {
            console.log("ERROR", myInst, outputInstr);
            flag = true;
        }
    }
}
if (!flag) {
    console.log("NO Error Encountered");
}
console.log("My Output Length: ", myFileLines.length);
console.log("Venus Output Length: ", outputLines.length);
