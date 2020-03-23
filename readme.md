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
| Bharat Ladrecha | 2018CSB1080  |
| Subham Sahu     | 2018EEB1183  |


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

**Encode** contains files required to convert `Assembly Code` written in `RISC V` syntax into `Machine Code`  
**Execute** contains files required to execute the generated `Machine Code`  
**main.ts** is the entrypoint of the application


## Features

1. On pressing `Ctrl+S` on **Editor Pane** current file will be downloaded.
2. On pressing `Ctrl+S` on **Simulator Pane** Output file will be downloaded if it's assembled.
3. **Editor Pane** supports `Ctrl+/` as comment shortcut


## General Instructions To Run Locally

1. If you do not have a copy of `RISCV Heritage` clone the repo and checkout `GUI` branch
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



## Assumption

1. The `code segment` shown in the memory pane is starts from `0x00000000` but it is not used to store the actual code.