use half::{bf16, f16};
use std::{borrow::Cow, collections::HashMap, num::ParseIntError};

/// ```
/// assert_eq!(floattohexlib::float32_to_hex(1.0, false), 0x3f800000);
/// assert_eq!(floattohexlib::float32_to_hex(1.0, true), 0x0000803f);
/// ```
pub fn float32_to_hex(float: f32, swap: bool) -> u32 {
    let bytes: [u8; 4] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u32::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::hex_to_float32(0x3f800000, false), 1.0);
/// assert_eq!(floattohexlib::hex_to_float32(0x0000803f, true), 1.0);
/// ```
pub fn hex_to_float32(hex: u32, swap: bool) -> f32 {
    let bytes: [u8; 4] = if swap {
        hex.to_be_bytes()
    } else {
        hex.to_le_bytes()
    };
    f32::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::float64_to_hex(1.0, false), 0x3ff0000000000000);
/// assert_eq!(floattohexlib::float64_to_hex(1.0, true), 0x000000000000f03f);
/// ```
pub fn float64_to_hex(float: f64, swap: bool) -> u64 {
    let bytes: [u8; 8] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u64::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::hex_to_float64(0x3ff0000000000000, false), 1.0);
/// assert_eq!(floattohexlib::hex_to_float64(0x000000000000f03f, true), 1.0);
/// ```
pub fn hex_to_float64(hex: u64, swap: bool) -> f64 {
    let bytes: [u8; 8] = if swap {
        hex.to_be_bytes()
    } else {
        hex.to_le_bytes()
    };
    f64::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::float16_to_hex(half::f16::from_f32(1.0), false), 0x3c00);
/// assert_eq!(floattohexlib::float16_to_hex(half::f16::from_f32(1.0), true), 0x003c);
/// ```
pub fn float16_to_hex(float: f16, swap: bool) -> u16 {
    let bytes: [u8; 2] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u16::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::hex_to_float16(0x3c00, false), half::f16::from_f32(1.0));
/// assert_eq!(floattohexlib::hex_to_float16(0x003c, true), half::f16::from_f32(1.0));
/// ```
pub fn hex_to_float16(hex: u16, swap: bool) -> f16 {
    let bytes: [u8; 2] = if swap {
        hex.to_be_bytes()
    } else {
        hex.to_le_bytes()
    };
    f16::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::bfloat16_to_hex(half::bf16::from_f32(1.0), false), 0x3f80);
/// assert_eq!(floattohexlib::bfloat16_to_hex(half::bf16::from_f32(1.0), true), 0x803f);
/// ```
pub fn bfloat16_to_hex(float: bf16, swap: bool) -> u16 {
    let bytes: [u8; 2] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u16::from_le_bytes(bytes)
}

/// ```
/// assert_eq!(floattohexlib::hex_to_bfloat16(0x3f80, false), half::bf16::from_f32(1.0));
/// assert_eq!(floattohexlib::hex_to_bfloat16(0x803f, true), half::bf16::from_f32(1.0));
/// ```
pub fn hex_to_bfloat16(hex: u16, swap: bool) -> bf16 {
    let bytes: [u8; 2] = if swap {
        hex.to_be_bytes()
    } else {
        hex.to_le_bytes()
    };
    bf16::from_le_bytes(bytes)
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
    coerced_float_value: Option<String>,
    hex_value: String,
}

impl FloatHexResult {
    pub fn float_string_for_display<'a>(float_str: &'a str) -> &'a str {
        match float_str {
            "inf" => "Infinity",
            "-inf" => "-Infinity",
            _ => float_str,
        }
    }
    fn hex_value_string(&self) -> String {
        match self.float_kind {
            FloatKind::Float32 => self.hex_value.parse::<u32>().map_or(
                self.hex_value.to_string(),
                // the 10 here is for the 8 hex digits plus 2 for "0x"
                |v| format!("{:#010x}", v),
            ),
            FloatKind::Float64 => self.hex_value.parse::<u64>().map_or(
                self.hex_value.to_string(),
                // the 18 here is for the 16 hex digits plus 2 for "0x"
                |v| format!("{:#018x}", v),
            ),
            FloatKind::Float16 | FloatKind::BFloat16 => self.hex_value.parse::<u16>().map_or(
                self.hex_value.to_string(),
                // the 6 here is for the 4 hex digits plus 2 for "0x"
                |v| format!("{:#06x}", v),
            ),
        }
    }
    pub fn to_xml(&self) -> String {
        let c = self
            .coerced_float_value
            .as_ref()
            .map(|f| {
                format!(
                    "\n<coercedFloat>{}</coercedFloat>",
                    Self::float_string_for_display(f)
                )
            })
            .unwrap_or("".to_string());
        format!(
            "<values>
    <{float_key}>{float_value}</{float_key}>
    <hex>{hex_value}</hex>{coerced_float_tag}
</values>",
            float_key = self.float_kind.to_key_string(),
            float_value = Self::float_string_for_display(&self.float_value),
            coerced_float_tag = c,
            hex_value = self.hex_value_string()
        )
    }
}

fn get_query_value<'a>(
    query_parts: &'a HashMap<Cow<'_, str>, Cow<'_, str>>,
    key: &str,
) -> Result<&'a Cow<'a, str>, String> {
    query_parts
        .get(key)
        .ok_or(format!("Internal error - no {} specified!", key))
}

pub fn handle_cgi_querystring(query: &str) -> Result<String, String> {
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
    let result: FloatHexResult = match action {
        "floattohex" => handle_float32tohex(float_str, swap),
        "hextofloat" => handle_hextofloat32(hex_str, swap),
        "doubletohex" => handle_float64tohex(float_str, swap),
        "hextodouble" => handle_hextofloat64(hex_str, swap),
        "float16tohex" => handle_float16tohex(float_str, swap),
        "hextofloat16" => handle_hextofloat16(hex_str, swap),
        "bfloat16tohex" => handle_bfloat16tohex(float_str, swap),
        "hextobfloat16" => handle_hextobfloat16(hex_str, swap),
        _ => return make_unknown_action_error(),
    };
    result.to_xml()
}

fn clean_hex_str(hex_str: &str) -> String {
    hex_str
        .to_lowercase()
        .strip_prefix("0x")
        .unwrap_or(hex_str)
        .replace(" ", "")
}

fn parse_hex_u32(hex_str: &str) -> Result<u32, ParseIntError> {
    u32::from_str_radix(&clean_hex_str(hex_str), 16)
}

fn parse_hex_u64(hex_str: &str) -> Result<u64, ParseIntError> {
    u64::from_str_radix(&clean_hex_str(hex_str), 16)
}

fn parse_hex_u16(hex_str: &str) -> Result<u16, ParseIntError> {
    u16::from_str_radix(&clean_hex_str(hex_str), 16)
}

fn handle_float32tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float32,
            float_value: float_str.to_string(),
            coerced_float_value: None,
            hex_value: "ERROR".to_string(),
        };
    }
    let float = float.unwrap();
    let hex_value = float32_to_hex(float, swap);
    FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_str.to_string(),
        // TODO ugggggggh
        coerced_float_value: if FloatHexResult::float_string_for_display(float.to_string().as_str())
            .eq_ignore_ascii_case(&FloatHexResult::float_string_for_display(float_str))
        {
            None
        } else {
            Some(FloatHexResult::float_string_for_display(float.to_string().as_str()).to_string())
        },
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextofloat32(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u32(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float32,
            float_value: "ERROR".to_string(),
            coerced_float_value: None,
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float32(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_value.to_string(),
        coerced_float_value: None,
        hex_value: hex.to_string(),
    }
}

fn handle_float64tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float64,
            float_value: float_str.to_string(),
            coerced_float_value: None,
            hex_value: "ERROR".to_string(),
        };
    }
    let float = float.unwrap();
    let hex_value = float64_to_hex(float, swap);
    FloatHexResult {
        float_kind: FloatKind::Float64,
        float_value: float_str.to_string(),
        coerced_float_value: if &float.to_string() == float_str {
            None
        } else {
            Some(float.to_string())
        },
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextofloat64(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u64(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float64,
            float_value: "ERROR".to_string(),
            coerced_float_value: None,
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float64(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::Float64,
        float_value: float_value.to_string(),
        coerced_float_value: None,
        hex_value: hex.to_string(),
    }
}

fn handle_float16tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float16,
            float_value: float_str.to_string(),
            coerced_float_value: None,
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = float16_to_hex(float.unwrap(), swap);
    // TODO
    FloatHexResult {
        float_kind: FloatKind::Float16,
        float_value: float_str.to_string(),
        coerced_float_value: None,
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextofloat16(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u16(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float16,
            float_value: "ERROR".to_string(),
            coerced_float_value: None,
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float16(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::Float16,
        float_value: float_value.to_string(),
        coerced_float_value: None,
        hex_value: hex.to_string(),
    }
}

fn handle_bfloat16tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::BFloat16,
            float_value: float_str.to_string(),
            coerced_float_value: None,
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = bfloat16_to_hex(float.unwrap(), swap);
    // TODO
    FloatHexResult {
        float_kind: FloatKind::BFloat16,
        float_value: float_str.to_string(),
        coerced_float_value: None,
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextobfloat16(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u16(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::BFloat16,
            float_value: "ERROR".to_string(),
            coerced_float_value: None,
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_bfloat16(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::BFloat16,
        float_value: float_value.to_string(),
        coerced_float_value: None,
        hex_value: hex.to_string(),
    }
}

fn make_unknown_action_error() -> String {
    // We don't really know what XML tags to use here, so, umm, just use something
    let mut xml = "<values>".to_string();
    xml.push_str("<float>ERROR</float>");
    xml.push_str("<hex>ERROR</hex>");
    xml.push_str("</values>");
    xml
}
