# floattohex

Website for converting floating-point numbers to their binary representation (in hexadecimal) - [here's the live version](https://gregstoll.com/~gregstoll/floattohex/).

The backend now uses Rust - see the `floattohexcgi-rust` directory. It is compiled to WASM with `wasm-pack` - see the `floattohexcgi-rust/floattohexlib-bindgen` directory. (the previous version used Python with a C module - see `floattohexmodule.c` and `floattohex.py`)

Here's [a writeup of when this was rewritten in Rust](https://gregstoll.wordpress.com/2025/01/08/floating-point-to-hex-converter-now-supports-16-bit-floats-plus-i-rewrote-it-in-rust-and-webassembly/) and support for 16-bit float types was added.

The frontend is built with React - see the `floattohex-react` directory.