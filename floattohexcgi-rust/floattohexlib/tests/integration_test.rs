use floattohexlib::*;
use std::fs;
use std::sync::OnceLock;

struct TestCase {
    action: String,
    float_key: String,
    float_value: String,
    coerced_float_value: Option<String>,
    hex_value: String,
    _note: String,
}

static TEST_CASES: OnceLock<Vec<TestCase>> = OnceLock::new();
fn get_testcases() -> &'static Vec<TestCase> {
    TEST_CASES.get_or_init(|| {
        // a more robust thing would be to copy the file into a good place
        // or at least traverse up until we find it.
        let s = fs::read_to_string("../../testCases.json").unwrap();
        let cases_value: serde_json::Value = serde_json::from_str(&s).unwrap();
        let cases_array = cases_value.as_array().unwrap();
        let mut cases = vec![];
        for item in cases_array {
            let action = item["action"].as_str().unwrap();
            let float_key = match action {
                "floatToHex" => "float",
                "doubleToHex" => "double",
                "float16ToHex" => "float16",
                "bfloat16ToHex" => "bfloat16",
                _ => panic!("Unknown action {}", action),
            };
            let float_raw_value = &item[float_key];
            let float_value = if float_raw_value.is_string() {
                float_raw_value.as_str().unwrap().to_string()
            } else {
                float_raw_value.as_f64().unwrap().to_string()
            };
            let hex_value = item["hex"].as_str().unwrap();
            let note = item.get("note").map_or("", |v| v.as_str().unwrap());
            let coerced_float_value = item.get("coercedFloat").map(|v| v.to_string());
            cases.push(TestCase {
                action: action.to_lowercase().to_string(),
                float_key: float_key.to_string(),
                float_value: float_value,
                coerced_float_value: coerced_float_value,
                hex_value: hex_value.to_string(),
                _note: note.to_string(),
            });
        }
        cases
    })
}

fn take_at_most(s: &str, num: usize) -> &str {
    &s[..s.len().min(num)]
}

fn assert_xml(
    response: &str,
    expected_float_key: &str,
    expected_float_value: &str,
    expected_coerced_float_value: &Option<String>,
    expected_hex_value: &str,
) {
    let response_elem = xmltree::Element::parse(response.as_bytes()).unwrap();
    assert_eq!(response_elem.name, "values");
    assert_eq!(
        response_elem.children.len(),
        if expected_coerced_float_value.is_some() {
            3
        } else {
            2
        }
    );
    assert_eq!(
        response_elem.children[0].as_element().unwrap().name,
        expected_float_key
    );
    assert_eq!(
        response_elem.children[0]
            .as_element()
            .unwrap()
            .children
            .len(),
        1
    );
    // sigh, close enough
    assert_eq!(
        take_at_most(
            response_elem.children[0].as_element().unwrap().children[0]
                .as_text()
                .unwrap(),
            47
        ),
        take_at_most(expected_float_value, 47)
    );
    assert_eq!(response_elem.children[1].as_element().unwrap().name, "hex");
    assert_eq!(
        response_elem.children[1]
            .as_element()
            .unwrap()
            .children
            .len(),
        1
    );
    assert_eq!(
        response_elem.children[1].as_element().unwrap().children[0]
            .as_text()
            .unwrap(),
        expected_hex_value
    );
    if expected_coerced_float_value.is_some() {
        assert_eq!(
            response_elem.children[2].as_element().unwrap().name,
            "coercedFloat"
        );
        assert_eq!(
            response_elem.children[2]
                .as_element()
                .unwrap()
                .children
                .len(),
            1
        );
        let expected_coerced_float_value: &str = expected_coerced_float_value.as_ref().unwrap();
        assert_eq!(
            response_elem.children[2].as_element().unwrap().children[0]
                .as_text()
                .unwrap(),
            expected_coerced_float_value
        );
    }
}

#[test]
fn test_floattohex() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "floattohex" {
            let response = handle_cgi(&test.action, &test.float_value, "", false);
            assert_xml(
                &response,
                &test.float_key,
                &test.float_value,
                &test.coerced_float_value,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_hextofloat() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "floattohex" {
            let response = handle_cgi("hextofloat", "", &test.hex_value, false);
            let expected_float_value: &str = test
                .coerced_float_value
                .as_ref()
                .unwrap_or(&test.float_value);
            assert_xml(
                &response,
                &test.float_key,
                expected_float_value,
                &None,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_doubletohex() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "doubletohex" {
            let response = handle_cgi(&test.action, &test.float_value, "", false);
            assert_xml(
                &response,
                "double",
                &test.float_value,
                &None,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_hextodouble() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "doubletohex" {
            let response = handle_cgi("hextodouble", "", &test.hex_value, false);
            assert_xml(
                &response,
                "double",
                &test.float_value,
                &None,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_float16tohex() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "float16tohex" {
            let response = handle_cgi(&test.action, &test.float_value, "", false);
            assert_xml(
                &response,
                &test.float_key,
                &test.float_value,
                &test.coerced_float_value,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_hextofloat16() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "float16tohex" {
            let response = handle_cgi("hextofloat16", "", &test.hex_value, false);
            assert_xml(
                &response,
                &test.float_key,
                &test.float_value,
                &None,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_bfloat16tohex() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "bfloat16tohex" {
            let response = handle_cgi(&test.action, &test.float_value, "", false);
            assert_xml(
                &response,
                &test.float_key,
                &test.float_value,
                &test.coerced_float_value,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_hextobfloat16() {
    let testcases = get_testcases();
    let mut num_tested = 0;
    for test in testcases {
        if test.action == "bfloat16tohex" {
            let response = handle_cgi("hextobfloat16", "", &test.hex_value, false);
            assert_xml(
                &response,
                &test.float_key,
                &test.float_value,
                &None,
                &test.hex_value,
            );
            num_tested = num_tested + 1;
        }
    }
    assert!(num_tested > 0);
}

#[test]
fn test_hextofloat_querystring_noswap() -> Result<(), String> {
    let response = handle_cgi_querystring("action=hextofloat&hex=40900000&swap=0")?;
    assert_xml(&response, "float", "4.5", &None, "0x40900000");
    Ok(())
}

#[test]
fn test_hextofloat_querystring_swap() -> Result<(), String> {
    let response = handle_cgi_querystring("action=hextofloat&hex=0x00009040&swap=1")?;
    assert_xml(&response, "float", "4.5", &None, "0x00009040");
    Ok(())
}

#[test]
fn test_floattohex_querystring_noswap() -> Result<(), String> {
    let response = handle_cgi_querystring("action=floattohex&float=4.5&swap=0")?;
    assert_xml(&response, "float", "4.5", &None, "0x40900000");
    Ok(())
}

#[test]
fn test_floattohex_querystring_swap() -> Result<(), String> {
    let response = handle_cgi_querystring("action=floattohex&float=4.5&swap=1")?;
    assert_xml(&response, "float", "4.5", &None, "0x00009040");
    Ok(())
}
