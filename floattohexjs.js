//<![CDATA[
function HexToFloat(hex) {
    doRequest(floatToHexScriptName + '?action=hextofloat&hex=' + hex, true, processFloatResponse, 'GET', null);
}

function FloatToHex(float) {
    doRequest(floatToHexScriptName + '?action=floattohex&float=' + float, true, processFloatResponse, 'GET', null);
}

function HexToDouble(hex) {
    doRequest(floatToHexScriptName + '?action=hextodouble&hex=' + hex, true, processDoubleResponse, 'GET', null);
}

function DoubleToHex(double) {
    doRequest(floatToHexScriptName + '?action=doubletohex&double=' + double, true, processDoubleResponse, 'GET', null);
}

function processFloatResponse() {
    if (xmlhttp.readyState == 4) {
        var xmlDoc = xmlhttp.responseXML;
        var floatElem = xmlDoc.documentElement.getElementsByTagName("float")[0];
        var floatValue = getDOMText(floatElem.childNodes);
        document.getElementById('floatHex').value = floatValue;
        var hexElem = xmlDoc.documentElement.getElementsByTagName("hex")[0];
        var hexValue = getDOMText(hexElem.childNodes);
        document.getElementById('hexFloat').value = hexValue;
    }
}

function processDoubleResponse() {
    if (xmlhttp.readyState == 4) {
        var xmlDoc = xmlhttp.responseXML;
        var doubleElem = xmlDoc.documentElement.getElementsByTagName("double")[0];
        var doubleValue = getDOMText(doubleElem.childNodes);
        document.getElementById('doubleHex').value = doubleValue;
        var hexElem = xmlDoc.documentElement.getElementsByTagName("hex")[0];
        var hexValue = getDOMText(hexElem.childNodes);
        document.getElementById('hexDouble').value = hexValue;
    }
}
// using doRequest() in gregcommon.js

//]]>
