pub fn float32_to_hex(float: f32, swap: bool) -> u32 {
    let bytes: [u8; 4] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u32::from_le_bytes(bytes)
}

#[derive(Debug)]
struct FloatHexResult {
    // TODO - make an enum
    // Should be "float", "double", "float16", "bfloat16"
    float_key: String,
    float_value: String,
    hex_value: String,
}

impl FloatHexResult {
    pub fn to_xml(&self) -> String {
        format!(
            "<values>
    <{float_key}>{float_value}</{float_key}>
    <hex>{hex_value}</hex>
</values>",
            float_key = self.float_key,
            float_value = self.float_value,
            // the 10 here is for the 8 hex digits plus 2 for "0x"
            hex_value = format!("{:#010x}", self.hex_value.parse::<u32>().unwrap())
        )
    }
}

pub fn handle_cgi(action: &str, float_str: &str, hex_str: &str, swap: bool) -> String {
    let result: FloatHexResult = match action {
        "floattohex" => handle_float32tohex(float_str, swap),
        _ => return make_unknown_action_error(),
    };
    return result.to_xml();
}

fn handle_float32tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_key: "float".to_string(),
            float_value: float_str.to_string(),
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = float32_to_hex(float.unwrap(), swap);
    return FloatHexResult {
        float_key: "float".to_string(),
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    };
}

fn make_unknown_action_error() -> String {
    // We don't really know what XML tags to use here, so, umm, just use something
    let mut xml = "<values>".to_string();
    xml.push_str("<float>ERROR</float>");
    xml.push_str("<hex>ERROR</hex>");
    xml.push_str("</values>");
    xml
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        //let result = add(2, 2);
        //assert_eq!(result, 4);
    }
}
