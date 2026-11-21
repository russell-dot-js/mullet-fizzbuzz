"""Office of Carriage Returns. The union owns the last byte of every sign."""
import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

SOAP = "{http://schemas.xmlsoap.org/soap/envelope/}"
PAPER = "{urn:mullet:stationery}"


def issue(application, concessions):
    plan = application["prospectus"]
    quarters = plan["quarters"]
    if len(quarters) != 4 or plan["forecast"] + plan["variance"] != quarters[3]:
        raise ValueError("The board has recalled its newline pending restatement.")
    covenant = "in-arrears" if plan["variance"] < 0 else "performing"
    press = concessions.find(f"press[@covenant='{covenant}']")
    glyph = press.find("terminal-glyph")
    carriage = chr(int(glyph.text, int(glyph.attrib["radix"])))
    return dict(seal=application["seal"], press=press.attrib["proprietor"],
                lien=max(0, -plan["variance"]), line=application["sign"] + carriage)


def main():
    envelope = ET.parse(sys.stdin).getroot()
    body = envelope.find(SOAP + "Body/" + PAPER + "Waybill")
    if envelope.tag != SOAP + "Envelope" or body is None or body.text is None:
        raise ValueError("Only a Ministry of Stationery SOAP waybill will fit in this tray.")
    concessions = ET.parse(Path(__file__).with_name("articles-of-stationery.xml"))
    grants = [issue(application, concessions) for application in json.loads(body.text)]
    json.dump(grants, sys.stdout)


if __name__ == "__main__":
    main()
