.data
var1: .word 0xeef, 0xbbf, 0xdead, 0xbeef
var2: .word 1000
var3: .word 1000
var4: .word 1000
var5: .word 1000


.text
addi x10, x10, 1000
lw x1, var2
lw x1, var3
lw x1, var5
lh x1, var1
lb x1, var3
addi x10, x10, 1000
auipc x1, 0x10005


lw x10, 100(x2)
sw x10, 100(x2)
addi x10, x31, 1000
lw x10, -100(x2)
sw x10, -100(x2)
.data
var12: .asciiz "abc100def\b"
var23: .word 0xbababdeadbeef   
.text
label3:

lw x10, var2
lw x9, var2
label5:
lw x10, var1

lw x10, 100(x2)
sw x10, 100(x2)
addi x10, x31, 1000
lw x10, -100(x2)
sw x10, -100(x2)
addi x10, x31, -1000
lw x10, 0x100(x2)
sw x10, 0x100(x2)
addi x10, x31, 0x100
lw x10, 0x7ff(x2)
sw x10, 0x7ff(x2)
addi x10, x31, 0x7ff

# R Type
add x10, x12, x29
and x10, x12, x29
or x10, x12, x29
sll x10, x12, x29
slt x10, x12, x29
sra x10, x12, x29
srl x10, x12, x29
sub x10, x12, x29
xor x10, x12, x29
mul x10, x12, x29
div x10, x12, x29
rem x10, x12, x29
sll x31, x31, x20


#add, and, or, sll, slt, sra, srl, sub, xor, mul, div, rem
#


# I Type
addi x10, x12, 0x7ea
addi x10, x12, -0x7ea
addi x10, x12, -0xf
addi x10, x12, 1398
addi x10, x12, -2048

andi x10, x12, 0x7ea
andi x10, x12, -0x7ea
andi x10, x12, -0xf
andi x10, x12, 1398
andi x10, x12, -2048

ori x10, x12, 0x7ea
ori x10, x12, -0x7ea
ori x10, x12, -0xf
ori x10, x12, 1398
ori x10, x12, -2048

#I format - addi, andi, ori, lb, ld, lh, lw, jalr

jalr x10, x12, 0x7ea
jalr x10, x12, -0x7ea
jalr x10, x12, -0xf
jalr x10, x12, 1398
jalr x10, x12, -2048

lb x10, 0x7ea(x12)
lb x10, -0x7ea(x12)
lb x10, -0xf(x12)
lb x10, 1398(x12) 
lb x10, -2048(x12) 

lh x10, 0x7ea(x12)
lh x10, -0x7ea(x12)
lh x10, -0xf(x12)
lh x10, 1398(x12) 
lh x10, -2048(x12) 

ld x10, 0x7ea(x12)
ld x10, -0x7ea(x12)
ld x10, -0xf(x12)
ld x10, 1398(x12) 
ld x10, -2048(x12) 

lw x10, 0x7ea(x12)
lw x10, -0x7ea(x12)
lw x10, -0xf(x12)
lw x10, 1398(x12) 
lw x10, -2048(x12) 



#S format - sb, sw, sd, sh
#SB format - beq, bne, bge, blt
#U format - auipc, lui
#UJ format - jal

label1:

sb x10, 0x7ea(x12)
sb x10, -0x7ea(x12)
sb x10, -0xf(x12)
sb x10, 1398(x12) 
sb x10, -2048(x12) 
sh x10, 0x7ea(x12)
sh x10, -0x7ea(x12)
sh x10, -0xf(x12)
sh x10, 1398(x12) 
sh x10, -2048(x12) 
sd x10, 0x7ea(x12)
label2:
sd x10, -0x7ea(x12)
sd x10, -0xf(x12)
sd x10, 1398(x12) 
sd x10, -2048(x12) 
sw x10, 0x7ea(x12)
sw x10, -0x7ea(x12)
sw x10, -0xf(x12)
sw x10, 1398(x12) 
sw x10, -2048(x12) 

# Negative Not allowed in AUIPC
auipc x10, 0x7ea
auipc x10, 0x7ea
auipc x10, 0xf
auipc x10, 1398

jal x10, label
jal x10, label1
jal x10, label2
jal x10, label5


beq x10, x20, label2



label: