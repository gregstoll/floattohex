pub fn float32_to_hex(float: f32, swap: bool) -> u32 {
    let bytes: [u8; 4] = if swap {
        float.to_be_bytes()
    } else {
        float.to_le_bytes()
    };
    u32::from_le_bytes(bytes)
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
