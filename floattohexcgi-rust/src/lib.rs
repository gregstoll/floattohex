use floattohexlib::*;

pub fn handle_cgi(action: &str, float_str: &str, hex_str: &str, swap: bool) -> String {
    let mut xml = "<values>".to_string();
    match action {
        "floattohex" => {},
        _ => return make_unknown_action_error(action)
    }
    xml.push_str("</values>");
    xml
}

fn make_unknown_action_error(action: &str) -> String{
    let mut xml = "<values>".to_string();
    xml.push_str("<float>ERROR</float>");
    xml.push_str("<hex>ERROR</hex>");
    xml.push_str("</values>");
    xml
}