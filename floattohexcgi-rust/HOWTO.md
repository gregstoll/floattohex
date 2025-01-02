test
----
Here's an easy way to interactively test the CGI server which I learned from https://github.com/amandasaurus/rust-cgi:

- cargo build --bin cgi_server
- Copy from targets/debug/cgi_server[.exe] to cgi-bin/cgi_server[.exe]
- python -m http.server --cgi

Now from a separate command prompt run
    curl http://localhost:8000/cgi-bin/cgi_server[.exe]
(or just load that URL in a web browser)