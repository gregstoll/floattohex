use std::{borrow::Cow, collections::HashMap};

use cgi::http;

extern crate cgi;

fn error(s: &str) -> cgi::Response {
    cgi::binary_response(200, "text/xml", format!("Error: {}", s).into_bytes())
}

fn success(s: &str) -> cgi::Response {
    cgi::binary_response(200, "text/xml", s.as_bytes().into())
}

fn get_query_value<'a>(
    query_parts: &'a HashMap<Cow<'_, str>, Cow<'_, str>>,
    key: &str,
) -> Result<&'a Cow<'a, str>, String> {
    query_parts
        .get(key)
        .ok_or(format!("Internal error - no {} specified!", key))
}

fn process_request(request: &cgi::Request) -> Result<String, String> {
    let query = request
        .uri()
        .query()
        .ok_or(String::from("Internal error - no query string?"))?;
    // this is inefficient, can make this a HashMap<&str, &str> or something?
    let query_parts: HashMap<Cow<'_, str>, Cow<'_, str>> =
        url::form_urlencoded::parse(query.as_bytes()).collect();
    let action = get_query_value(&query_parts, "action")?;
    let swap = get_query_value(&query_parts, "swap")? == "1";
    let is_to_float = action.starts_with("hexto");
    if is_to_float {
        let hex_value = get_query_value(&query_parts, "hex")?;
        Ok(handle_cgi(action, "", hex_value, swap))
    } else {
        // take off the "tohex" at the end
        let float_value = get_query_value(&query_parts, &action[..action.len() - 5])?;
        Ok(handle_cgi(action, float_value, "", swap))
    }
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
