#!/usr/bin/python

import FloatToHex, cgi, sys

def returnFloatHex(f, h):
    print "Content-type: text/xml\n\n"
    print "<values>\n"
    print "<float>%f</float>\n" % f
    if (isinstance(h, int)):
        h = str(hex(h))
    elif (isinstance(h, str)):
        if (not h.startswith('0x')):
            h = '0x' + h
    print "<hex>%s</hex>\n" % h
    print "</values>\n"
    sys.exit(0)

form = cgi.FieldStorage()
action = form.getfirst('action')
if (action == 'floattohex'):
    f = float(form.getfirst('float'))
    h = FloatToHex.floattohex(f)
    returnFloatHex(f, h)
elif (action == 'hextofloat'):
    h = str(form.getfirst('hex'))
    if (not h.startswith('0x')):
        h = '0x' + h
    i = int(h[2:], 16)
    f = FloatToHex.hextofloat(i)
    returnFloatHex(f, h)
