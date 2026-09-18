import xml.etree.ElementTree as ET
import glob

AlphabetUsesCharColors = False
AlphabetUsesGroupColors = False

def cleanString(s) : return "".join(x for x in s if x.isascii() and x.isalnum() or x == ".")

def AddCharData(Parent, data) :
    global AlphabetUsesCharColors
    newChar = ET.SubElement(Parent, "node", {
        "label" : data[0]
    })
    if not data[2] == -1 :
        newChar.append(ET.Comment(f"Old Char Color: {str(data[2])}"))
        AlphabetUsesCharColors = True
    if not data[3] == "" :
        newChar.append(ET.Comment(f"Note: {data[3]}"))
    inputAction = ET.SubElement(newChar, "textCharAction")
    if not data[1] == None and not data[0] == data[1] :
        inputAction.attrib["unicode"] = str(ord(data[1]))

for filename in glob.glob('./oldAlphabets/alphabet.*.xml'):
    AlphabetUsesCharColors = False
    AlphabetUsesGroupColors = False
    parser = ET.XMLParser(target=ET.TreeBuilder(insert_comments=True))
    input = ET.parse(filename, parser=parser).getroot()

    def getAttrib(Element, attrib, alt=None) :
        if(Element == None) : return alt
        return Element.attrib[attrib] if attrib in Element.attrib else alt

    def getCharData(tag):
        if(tag == None) : return None
        return [
            getAttrib(tag, 'd', None),
            getAttrib(tag, 't', None),
            getAttrib(tag, 'b', -1),
            getAttrib(tag, 'note', "")
        ]

        
    def conversionMode2str(convMode) :
        LUT = ["none", "none", "mandarin", "routingContextInsensitve", "routingContextSensitive"]
        return LUT[int(convMode)]

    def parseRecursive(element, outputElement, explicitInvisible) -> bool :
        global AlphabetUsesCharColors
        global AlphabetUsesGroupColors
        if element.tag == "group" :
            #if this group only has 1 group as child, just skip this one in parsing
            children = element.findall("*")
            visible = getAttrib(element, "visible", "yes")
            if explicitInvisible : visible = "no"
            name = getAttrib(element, "name")
            label = getAttrib(element, "label")
            if(len(children) == 1 and (children[0].tag == group or children[0].tag == "s") and visible == "no" and name == None and label == None):
                return parseRecursive(children[0], outputElement, False)
                
            color = getAttrib(element, "b")
            newGroup = ET.SubElement(outputElement, "group")
            if name != None : 
                newGroup.attrib["name"] = name
            if label != None and label != "" : 
                newGroup.attrib["label"] = label
            if visible != "no" and color != None :
                if(name != None) : newGroup.attrib["colorInfoName"] = name.lower()
                newGroup.append(ET.Comment(f"Old Group Color: {color}"))
                AlphabetUsesGroupColors = True                
            
            ChildUsesColors = False
            for child in children:
                ChildUsesColors = parseRecursive(child, newGroup, False) or ChildUsesColors
            if ChildUsesColors and name != None : newGroup.attrib["colorInfoName"] = name.lower()
                
        if element.tag == "s" :
            data = getCharData(element)
            AddCharData(outputElement, data)
            if(data[2] != -1) : return True
            
        if "function Comment" in str(element.tag):
            outputElement.append(element)
            
        return False
                

    for alphabet in input.iter('alphabet') :
        AlphabetUsesCharColors = False
        AlphabetUsesGroupColors = False
        name = getAttrib(alphabet, "name")
        orientation = getAttrib(alphabet.find("orientation"), "type")
        conversionMode = alphabet.find("conversionmode")
        conversionMode = getAttrib(conversionMode, "id")
        trainingfile = alphabet.find("train").text
        colorsName = alphabet.find("palette")
        colorsName = colorsName.text if colorsName != None else "Default"
        paragraph = getCharData(alphabet.find("paragraph"))
        space = getCharData(alphabet.find("space"))
               
        output = ET.Element("alphabet",{
            "name": name,
            "orientation" : orientation,
            "trainingFilename" : trainingfile,
            "colorsName" : colorsName
        })
        if conversionMode != None :
            output.attrib["conversionMode"] = conversionMode2str(conversionMode)
        
        for comment in alphabet.findall("*"):
            if "function Comment" in str(comment.tag): 
                output.append(comment)
        
        explicitInvisible = True
        for group in alphabet.findall("group") :
            parseRecursive(group, output, explicitInvisible)
            explicitInvisible = False
        
        if(paragraph != None and space != None) :
            newGroup = ET.SubElement(output, "group", {
                "name" : "paragraphSpace",
                "colorInfoName" : "paragraphSpace"
            })
            AddCharData(newGroup, paragraph)
            AddCharData(newGroup, space)
        elif (paragraph != None) :
            newGroup = ET.SubElement(output, "group", {
                "name" : "paragraph",
                "colorInfoName" : "saragraph"
            })
            AddCharData(newGroup, paragraph)
        elif (space != None) :
            newGroup = ET.SubElement(output, "group", {
                "name" : "space",
                "colorInfoName" : "space"
            })
            AddCharData(newGroup, space)
        
            
        tree = ET.ElementTree(output)
        ET.indent(tree, space="\t", level=0)
        alphnamePath = cleanString(name.lower().replace(" ", ".").replace(",", "")).replace("..", ".")
        newFilename = f"./autoConverted/alphabet.{alphnamePath}.xml"
        with open(newFilename, 'wb') as f:
            f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write(b'<!DOCTYPE alphabet SYSTEM "../alphabet.dtd">\n')
            tree.write(f, encoding="utf-8")