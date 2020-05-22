##########################################
#        					Dasher				         #
#           Copyright (c) 2020.          #
#             MIT licensed							 #
#   https://opensource.org/licenses/MIT  #
##########################################
# Purpose: Define generic make rules/terms
#   especially those that define compile
#   and link rules. Care should be taken
#   when modifying this file.
##########################################
ifeq ($(FOOTER),)
FOOTER = true
##########################################

program: $(OBJECTS)
		@echo 'Dasher WebASM Compile Finished'

clean_all:
		@echo 'Clean Files'
		rm -f *.wasm
		rm -f *.js

%.js : %.cpp
	${CXXCOMPILE} -o $@ $<

%.js : %.c
	${CCCOMPILE} -o $@ $<

##########################################
endif
