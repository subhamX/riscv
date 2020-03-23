# Heritage GUI

The following website is a course project under the guidance of [Dr T.V Kalyan](https://sites.google.com/view/kalyantv). It is a web simulator which converts the `Assembly code` written `RISCV syntax` to `Machine code` and provides a user-friendly environment for its execution.  

## Valid Instructions

**R format:**
add, and, or, sll, slt, sra, srl, sub, xor, mul, div, rem

**I format:**
addi, andi, ori, lb, ld, lh, lw, jalr

**S format:**
sb, sw, sd, sh

**SB format:**
beq, bne, bge, blt

**U format:**
auipc, lui

**UJ format:**
jal

**Assembler Directives:**
.text, .data, .byte, .half, .word, .dword, .asciiz

## Team Members
| Name            | Entry Number |
|:---------------:| -----------: |
| [Bharat Ladrecha](https://github.com/Bh4r4t) | 2018CSB1080  |
| [Subham Sahu](https://github.com/subhamX/)     | 2018EEB1183  |


## Technology Stack
1. Typescript
2. HTML/CSS
3. NodeJS

## File Structure
```
src
│   README.md
│   tsconfig.json
│
└───assets
   │   index.html
   │
   └───css
   │   style.css
   │    
   └───js
        │ main.ts
        │   
        └───encode
        │
        └───execute
```

**encode** contains files required to convert `Assembly Code` written in `RISC V` syntax into `Machine Code`  
**execute** contains files required to execute the generated `Machine Code`  
**main.ts** is the entrypoint of the application


## Features

1. On pressing `Ctrl+S` on **Editor Pane** current file will be downloaded.
2. On pressing `Ctrl+S` on **Simulator Pane** Output file will be downloaded if it's assembled.
Format - 
3. **Editor Pane** supports `Ctrl+/` as comment shortcut


## General Instructions To Run Locally

1. If you do not have a copy of `RISCV Heritage` clone the repo and checkout `GUI` branch. If you do have the project then go to `step 2`
```
git clone URL
git checkout GUI
```
2. Install all dependencies
```
npm install
```
3. Now to run the developement server run the following command in terminal
```
npm run start:dev
```
4. Now access the `RISCV Heritage` by visiting http://localhost:1234/


## Functionalities our GUI provide

1. BreakPoint:- Users can use a breakpoint for debugging. Users can select as many breakpoints as s(he) wants. During the execution of instructions, the program will stop after the execution of selected instructions in the order of program flow.

2. Run:- To run the complete program in a single go

3. Step:- To run the program instruction wise(one instruction at a time).

4. Stop:- Users can stop the execution process using the stop button.

5. Memory Segment displays only those values into which something is explicitly written during program execution or in the data segment and all other values which are not shown are `0x00`

6. On any error, the program will alert the user and will not proceed further for execution

7. Any instruction which uses **Double** like `sd, ld` are invalid since it is `32-bit system`

