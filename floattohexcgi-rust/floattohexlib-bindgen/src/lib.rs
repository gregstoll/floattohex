use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hexfloatcgi(query_string: &str) -> Result<String, String> {
    floattohexlib::handle_cgi_querystring(query_string)
}
