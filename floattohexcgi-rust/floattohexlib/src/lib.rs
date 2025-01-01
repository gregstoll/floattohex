use std::num::ParseIntError;

pub fn float32_to_hex(float: f32, swap: bool) -> u32 {
    let bytes: [u8; 4] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u32::from_le_bytes(bytes)
}

pub fn hex_to_float32(hex: u32, swap: bool) -> f32 {
    let bytes: [u8; 4] = if swap {
        hex.to_be_bytes()
    } else {
        hex.to_le_bytes()
    };
    f32::from_le_bytes(bytes)
}

#[derive(Debug)]
enum FloatKind {
    Float32,
    Float64,
    Float16,
    BFloat16,
}

impl FloatKind {
    fn to_key_string(&self) -> &'static str {
        match self {
            FloatKind::Float32 => "float",
            FloatKind::Float64 => "double",
            FloatKind::Float16 => "float16",
            FloatKind::BFloat16 => "bfloat16",
        }
    }
}

#[derive(Debug)]
struct FloatHexResult {
    float_kind: FloatKind,
    float_value: String,
    hex_value: String,
}

impl FloatHexResult {
    pub fn float_string_for_display(&self) -> &str {
        match self.float_value.as_str() {
            "inf" => "Infinity",
            "-inf" => "-Infinity",
            _ => &self.float_value,
        }
    }
    pub fn to_xml(&self) -> String {
        let hex_value = self.hex_value.parse::<u32>().map_or(
            self.hex_value.to_string(),
            // the 10 here is for the 8 hex digits plus 2 for "0x"
            |v| format!("{:#010x}", v),
        );
        format!(
            "<values>
    <{float_key}>{float_value}</{float_key}>
    <hex>{hex_value}</hex>
</values>",
            float_key = self.float_kind.to_key_string(),
            float_value = self.float_string_for_display(),
            hex_value = hex_value
        )
    }
}

pub fn handle_cgi(action: &str, float_str: &str, hex_str: &str, swap: bool) -> String {
    let result: FloatHexResult = match action {
        "floattohex" => handle_float32tohex(float_str, swap),
        "hextofloat" => handle_hextofloat32(hex_str, swap),
        _ => return make_unknown_action_error(),
    };
    return result.to_xml();
}

fn handle_float32tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float32,
            float_value: float_str.to_string(),
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = float32_to_hex(float.unwrap(), swap);
    return FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    };
}

fn parse_hex_u32(hex_str: &str) -> Result<u32, ParseIntError> {
    u32::from_str_radix(
        hex_str
            .to_lowercase()
            .strip_prefix("0x")
            .or(Some(hex_str))
            .unwrap(),
        16,
    )
}

fn handle_hextofloat32(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u32(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float32,
            float_value: "ERROR".to_string(),
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float32(hex, swap);
    return FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_value.to_string(),
        hex_value: hex.to_string(),
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
