use cgi::http;

extern crate cgi;

fn error(s: &str) -> cgi::Response {
    cgi::binary_response(200, "text/xml", format!("Error: {}", s).into_bytes())
}

fn success(s: &str) -> cgi::Response {
    cgi::binary_response(200, "text/xml", s.as_bytes().into())
}

fn process_request(request: &cgi::Request) -> Result<String, String> {
    let query = request
        .uri()
        .query()
        .ok_or(String::from("Internal error - no query string?"))?;
    floattohexlib::handle_cgi_querystring(query)
}

pub fn handle_cgi(action: &str, float_str: &str, hex_str: &str, swap: bool) -> String {
    floattohexlib::handle_cgi(action, float_str, hex_str, swap)
}

cgi::cgi_main! { |request: cgi::Request| {
    let result = process_request(&request);
    let mut response = match result {
        Ok(val) => success(&val),
        Err(err) => error(&err)
    };
    response.headers_mut().insert(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
    response
} }
