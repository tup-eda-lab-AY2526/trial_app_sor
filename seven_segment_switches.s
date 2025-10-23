
/*
 * This program reads the state of the 10 switches on the DE1-SoC board.
 * The states of SW0-3 and SW4-7 are converted to hexadecimal and displayed
 * on the two seven-segment displays HEX0 and HEX1.
 */
.text
.global _start

_start:
    /* Set up stack pointer */
    mov sp, #0x100000  // Example stack base, adjust as needed

main_loop:
    /* Load addresses of peripherals */
    ldr r0, =0xFF200040  // Address for switches
    ldr r1, =0xFF200020  // Address for HEX0-3 displays
    ldr r2, =0xFF200030  // Address for HEX4-5 displays (not used for two digits, but good to have)

    /* Read switch values */
    ldr r3, [r0]

    /* Isolate SW0-3 for HEX0 */
    and r4, r3, #0xF
    mov r6, r4
    bl hex_to_7seg
    mov r8, r0  // Save HEX0 pattern in r8

    /* Isolate SW4-7 for HEX1 */
    lsr r5, r3, #4
    and r5, r5, #0xF
    mov r6, r5
    bl hex_to_7seg
    
    /* Combine HEX1 and HEX0 patterns */
    lsl r0, r0, #8     // Shift HEX1 pattern
    orr r8, r8, r0     // Combine with HEX0 pattern

    /* Write to the seven-segment display */
    str r8, [r1]

    b   main_loop




/*
 * Subroutine to convert a 4-bit hex value (in r6) to a 7-segment display pattern.
 * Result is returned in r0.
 */
hex_to_7seg:
    adr r7, hex_lookup_table
    ldrb r0, [r7, r6]
    bx lr

.section .rodata
hex_lookup_table:
    .byte 0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07  // 0-7
    .byte 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71  // 8-9, A-F
.end
