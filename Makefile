# Makefile for ARMv7 DE1-SoC assembly programs

# Toolchain prefix
PREFIX = arm-linux-gnueabihf-

# Tools
AS = $(PREFIX)as
LD = $(PREFIX)ld
OBJCOPY = $(PREFIX)objcopy

# Source and object files
SRC = seven_segment_switches.s
OBJ = $(SRC:.s=.o)
ELF = $(SRC:.s=.elf)
IMG = $(SRC:.s=.img)

# Targets
.PHONY: all clean

all: $(IMG)

$(IMG): $(ELF)
	$(OBJCOPY) -O binary $< $@

$(ELF): $(OBJ)
	$(LD) -o $@ $<

$(OBJ): $(SRC)
	$(AS) -o $@ $<

clean:
	rm -f $(OBJ) $(ELF) $(IMG)
