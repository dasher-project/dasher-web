##########################################
#        					Dasher				         #
#           Copyright (c) 2020.          #
#             MIT licensed							 #
#   https://opensource.org/licenses/MIT  #
##########################################
# Purpose: Define generic make rules/terms
#   that are required to be defined at the
#   top of a make file.
#
##########################################
ifeq ($(HEADER),)
HEADER = true
##########################################

## SOURCE DEFINES ##
CSOURCES = $(wildcard *.c)
CXXSOURCES = $(wildcard *.cpp)
SOURCES = $(CSOURCES) $(CXXSOURCES)

## OBJECT DEFINES ##
OBJEXT = js
COBJECTS = $(CSOURCES:.c=.$(OBJEXT))
CXXOBJECTS = $(CXXSOURCES:.cpp=.$(OBJEXT))
OBJECTS = $(COBJECTS) $(CXXOBJECTS)

## COMPILE SETTINGS ##
#Default
CC = emcc
CCFLAGS = -O3 -s WASM=1 -s NO_EXIT_RUNTIME=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']"
CXX = em++
CXXFLAGS = -O3 -s WASM=1 -s NO_EXIT_RUNTIME=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']"

## BUILD COMMANDS ##
CCCOMPILE = $(CC) $(INCLUDES) $(CCFLAGS)
CXXCOMPILE = $(CXX) $(INCLUDES) $(CXXFLAGS)

##########################################
endif
