# Project Heritage

After cloning the repository and run the following command in terminal
```
npm install
```

### Encode Instructions
1. Place the RISC V code inside `/src/in/input.asm` and paste the Machine Code from Venus in `/src/out/venusOutput.m`
2. Compile the TypeScript Code to JavaScript using tsc.
3. Now run the following command
```
npm run encode
```
4. It will save output file in encode/src/out/myOutput.m


### Execute Encoded Instructions
1. After Encoding the instructions or placing the file inside `/src/out/venusOutput.m` run the following command
```
npm run execute
```