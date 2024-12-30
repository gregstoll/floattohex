pub fn handle_cgi(action: &str, float_str: &str, hex_str: &str, swap: bool) -> String {
    floattohexlib::handle_cgi(action, float_str, hex_str, swap)
}