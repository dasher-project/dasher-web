#include <stdio.h>
#include <iostream>
#include <fstream>
#include <string>
#include <emscripten/emscripten.h>

using namespace std;

void runTests();
void testWriteFile();
void testReadFile();

//Goal:
//Test reading/writing to file
//Function to return arbitrary string
//Integrate other lib/file
int main(int argc, char ** argv) {
  printf("Hello, world!\n");
  runTests();
}

/******* Dasher API *****/
string getData(){
  return "Goodbye Dasher";
}

#ifdef __cplusplus
extern "C" {
#endif

void EMSCRIPTEN_KEEPALIVE myFunction(int argc, char ** argv) {
    printf("MyFunction Called\n");
}

#ifdef __cplusplus
}
#endif
/****** TESTS *******/
void runTests(){
  testWriteFile();
  testReadFile();
}
void testWriteFile(){
  ofstream outfile;
  outfile.open("TestFile.txt");
  outfile<<"Hello Dasher"<<endl;
  outfile.close();
}
void testReadFile(){
  printf("Contents of File:\n");
  string line;
  ifstream infile ("TestFile.txt");
  if(infile.is_open()){
    while(getline(infile,line)){
     cout << line << '\n';
    }
    infile.close();
  }
}
