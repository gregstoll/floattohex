# floattohex

Website for converting floating-point numbers to their binary representation (in hexadecimal) - [here's the live version](https://gregstoll.com/~gregstoll/floattohex/).

The backend now uses Rust - see the `floattohexcgi-rust` directory. It is compiled to WASM with `wasm-pack` - see the `floattohexcgi-rust/floattohexlib-bindgen` directory. (the previous version used Python with a C module - see `floattohexmodule.c` and `floattohex.py`)

The frontend is built with React - see the `floattohex-react` directory.