use half::{bf16, f16};
use std::num::ParseIntError;

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
        format!(
            "<values>
    <{float_key}>{float_value}</{float_key}>
    <hex>{hex_value}</hex>
</values>",
            float_key = self.float_kind.to_key_string(),
            float_value = self.float_string_for_display(),
            hex_value = self.hex_value_string()
        )
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

fn parse_hex_u32(hex_str: &str) -> Result<u32, ParseIntError> {
    u32::from_str_radix(
        hex_str.to_lowercase().strip_prefix("0x").unwrap_or(hex_str),
        16,
    )
}

fn parse_hex_u64(hex_str: &str) -> Result<u64, ParseIntError> {
    u64::from_str_radix(
        hex_str.to_lowercase().strip_prefix("0x").unwrap_or(hex_str),
        16,
    )
}

fn parse_hex_u16(hex_str: &str) -> Result<u16, ParseIntError> {
    u16::from_str_radix(
        hex_str.to_lowercase().strip_prefix("0x").unwrap_or(hex_str),
        16,
    )
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
    FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    }
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
    FloatHexResult {
        float_kind: FloatKind::Float32,
        float_value: float_value.to_string(),
        hex_value: hex.to_string(),
    }
}

fn handle_float64tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float64,
            float_value: float_str.to_string(),
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = float64_to_hex(float.unwrap(), swap);
    FloatHexResult {
        float_kind: FloatKind::Float64,
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextofloat64(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u64(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float64,
            float_value: "ERROR".to_string(),
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float64(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::Float64,
        float_value: float_value.to_string(),
        hex_value: hex.to_string(),
    }
}

fn handle_float16tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float16,
            float_value: float_str.to_string(),
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = float16_to_hex(float.unwrap(), swap);
    FloatHexResult {
        float_kind: FloatKind::Float16,
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextofloat16(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u16(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::Float16,
            float_value: "ERROR".to_string(),
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_float16(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::Float16,
        float_value: float_value.to_string(),
        hex_value: hex.to_string(),
    }
}

fn handle_bfloat16tohex(float_str: &str, swap: bool) -> FloatHexResult {
    let float = float_str.parse();
    if float.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::BFloat16,
            float_value: float_str.to_string(),
            hex_value: "ERROR".to_string(),
        };
    }
    let hex_value = bfloat16_to_hex(float.unwrap(), swap);
    FloatHexResult {
        float_kind: FloatKind::BFloat16,
        float_value: float_str.to_string(),
        hex_value: hex_value.to_string(),
    }
}

fn handle_hextobfloat16(hex_str: &str, swap: bool) -> FloatHexResult {
    let hex = parse_hex_u16(hex_str);
    if hex.is_err() {
        return FloatHexResult {
            float_kind: FloatKind::BFloat16,
            float_value: "ERROR".to_string(),
            hex_value: hex_str.to_string(),
        };
    }
    let hex = hex.unwrap();
    let float_value = hex_to_bfloat16(hex, swap);
    FloatHexResult {
        float_kind: FloatKind::BFloat16,
        float_value: float_value.to_string(),
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
