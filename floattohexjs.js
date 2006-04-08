//<![CDATA[
var isMozilla;
var xmlhttp;
// for Mozilla, etc.
if (window.XMLHttpRequest) {
    isMozilla = true;
}
// for IE
else if (window.ActiveXObject) {
    isMozilla = false;
}

function getDOMText(nodes) {
    var toReturn = "";
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType == Node.TEXT_NODE) {
            toReturn = toReturn + nodes[i].nodeValue;
        }
    }
    return toReturn;
}

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
function doRequest(url, async, callback, method, postData) {
    if (isMozilla) {
        xmlhttp = new XMLHttpRequest();
        // http://www.onlamp.com/pub/a/onlamp/2005/05/19/xmlhttprequest.html
        // Some versions of mozilla lock up without this, apparently.
        if (xmlhttp.overrideMimeType) {
            xmlhttp.overrideMimeType('text/xml');
        }
    } else {
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e) {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
    if (async) {
        xmlhttp.onreadystatechange = callback;
    }
    method = method.toUpperCase();
    xmlhttp.open(method, url, async);
    if (method == "GET") {
        if (isMozilla) {
            xmlhttp.send(null);
        } else {
            xmlhttp.send();
        }
    } else {
        // We're doing POST.
        xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xmlhttp.send(postData);
    }
    if (!async) {
        callback();
    }
}



//]]>
