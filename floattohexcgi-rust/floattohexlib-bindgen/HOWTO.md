build
-----
wasm-pack build --target web

output goes to pkg/ directory

test
----
python -m http.server 8080
will serve up testing_page.html