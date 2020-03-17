# .DATA
# var1: .word 0xeef, 0xbbf, 0xdead, 0xbeef
# var2: .word 1000
# var3: .word 1000
# var4: .word 1000
# var5: .word 1000
# 
# 
# .text
# addi x10, x10, 1000
# lw x1, var2
# lw x1, var3
# lw x1, var5
# lh x1, var1
# lb x1, var3
# addi x10, x10, 1000

#auipc x1, 0x10005451

#main:
#addi x3, x0, 4
#addi x4, x0, 5
#jal x1, label
#beq x0, x0, main
#label:
#bne x0, x10, label1
#add x5, x3, x4
#jalr x12, x1, 0
#
#label1:
#bne x3, x4, exit
#
#exit:


sw x10, -100(x2)
.data
label5:
.data
label8:
var1: .asciiz "abc100def\b"
var2: .word 0xbababdeadbeef   
label1:    
.text
label3:

lw x10, var2
lw x9, var2
label2:
sd x10, -0x7ea(x12)
sd x10, -0xf(x12)
sd x10, 1398(x12) 
sd x10, -2048(x12) 

# Negative Not allowed in AUIPC
auipc x10, 0x7ea
auipc x10, 0x7ea
auipc x10, 0xf
auipc x10, 1398

jal x10, label
jal x10, label1
jal x10, label2
jal x10, label5





jal x11, label
label:
jal x11, label