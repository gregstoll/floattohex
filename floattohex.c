#include "Python.h"

float hextofloat(int hex) {
    int *hexPtr = &hex;
    return *((float *)hexPtr);
}

int main() {
    //std::cout << hextofloat(0xabcdef00);
}
