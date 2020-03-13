


// let memFile = new MemoryFile();
// console.log(index);
// let index = parseInt("0x10000005") - parseInt('0x10000000');
// console.log(memFile.writeValue(index, '0x7FFFFFF0', 6));
// console.log(memFile.readValue(index, 8));

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Y/N?", function(flag){
    if(flag=='N'){
        rl.close();
    }else{
        runStep();
    }
})
console.log("HCHCH");
rl.on("close", function() {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});