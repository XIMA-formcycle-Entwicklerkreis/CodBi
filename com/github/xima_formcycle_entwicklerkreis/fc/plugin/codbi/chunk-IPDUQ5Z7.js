// ../../node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var defaultOptions = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  // remove NS from tag name or attribute name if true
  allowBooleanAttributes: false,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  //Trim string values of tag and attributes
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  //nested tags will not be parsed even for errors
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  // skipEmptyListItem: false
  captureMetaData: false
};
var buildOptions = function(options) {
  return Object.assign({}, defaultOptions, options);
};

// ../../node_modules/fast-xml-parser/src/util.js
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
var regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
var isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}

// ../../node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var METADATA_SYMBOL;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = Symbol("XML Node Metadata");
}
var XmlNode = class {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = {};
  }
  add(key, val) {
    if (key === "__proto__") key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__") node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== void 0) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
};

// ../../node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
function readDocType(xmlData, i) {
  const entities = {};
  if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false, comment = false;
    let exp = "";
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === "<" && !comment) {
        if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
          i += 7;
          let entityName, val;
          [entityName, val, i] = readEntityExp(xmlData, i + 1);
          if (val.indexOf("&") === -1)
            entities[entityName] = {
              regx: RegExp(`&${entityName};`, "g"),
              val
            };
        } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
          i += 8;
          const { index } = readElementExp(xmlData, i + 1);
          i = index;
        } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
          i += 8;
        } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
          i += 9;
          const { index } = readNotationExp(xmlData, i + 1);
          i = index;
        } else if (hasSeq(xmlData, "!--", i)) comment = true;
        else throw new Error("Invalid DOCTYPE");
        angleBracketsCount++;
        exp = "";
      } else if (xmlData[i] === ">") {
        if (comment) {
          if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
            comment = false;
            angleBracketsCount--;
          }
        } else {
          angleBracketsCount--;
        }
        if (angleBracketsCount === 0) {
          break;
        }
      } else if (xmlData[i] === "[") {
        hasBody = true;
      } else {
        exp += xmlData[i];
      }
    }
    if (angleBracketsCount !== 0) {
      throw new Error(`Unclosed DOCTYPE`);
    }
  } else {
    throw new Error(`Invalid Tag instead of DOCTYPE`);
  }
  return { entities, i };
}
var skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
function readEntityExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let entityName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
    entityName += xmlData[i];
    i++;
  }
  validateEntityName(entityName);
  i = skipWhitespace(xmlData, i);
  if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
    throw new Error("External entities are not supported");
  } else if (xmlData[i] === "%") {
    throw new Error("Parameter entities are not supported");
  }
  let entityValue = "";
  [i, entityValue] = readIdentifierVal(xmlData, i, "entity");
  i--;
  return [entityName, entityValue, i];
}
function readNotationExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let notationName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    notationName += xmlData[i];
    i++;
  }
  validateEntityName(notationName);
  i = skipWhitespace(xmlData, i);
  const identifierType = xmlData.substring(i, i + 6).toUpperCase();
  if (identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
    throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
  }
  i += identifierType.length;
  i = skipWhitespace(xmlData, i);
  let publicIdentifier = null;
  let systemIdentifier = null;
  if (identifierType === "PUBLIC") {
    [i, publicIdentifier] = readIdentifierVal(xmlData, i, "publicIdentifier");
    i = skipWhitespace(xmlData, i);
    if (xmlData[i] === '"' || xmlData[i] === "'") {
      [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    }
  } else if (identifierType === "SYSTEM") {
    [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    if (!systemIdentifier) {
      throw new Error("Missing mandatory system identifier for SYSTEM notation");
    }
  }
  return { notationName, publicIdentifier, systemIdentifier, index: --i };
}
function readIdentifierVal(xmlData, i, type) {
  let identifierVal = "";
  const startChar = xmlData[i];
  if (startChar !== '"' && startChar !== "'") {
    throw new Error(`Expected quoted string, found "${startChar}"`);
  }
  i++;
  while (i < xmlData.length && xmlData[i] !== startChar) {
    identifierVal += xmlData[i];
    i++;
  }
  if (xmlData[i] !== startChar) {
    throw new Error(`Unterminated ${type} value`);
  }
  i++;
  return [i, identifierVal];
}
function readElementExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let elementName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    elementName += xmlData[i];
    i++;
  }
  if (!validateEntityName(elementName)) {
    throw new Error(`Invalid element name: "${elementName}"`);
  }
  i = skipWhitespace(xmlData, i);
  let contentModel = "";
  if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 6;
  else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 4;
  else if (xmlData[i] === "(") {
    i++;
    while (i < xmlData.length && xmlData[i] !== ")") {
      contentModel += xmlData[i];
      i++;
    }
    if (xmlData[i] !== ")") {
      throw new Error("Unterminated content model");
    }
  } else {
    throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
  }
  return {
    elementName,
    contentModel: contentModel.trim(),
    index: i
  };
}
function hasSeq(data, seq, i) {
  for (let j = 0; j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1]) return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}

// ../../node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true
  //skipLike: /regex/
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string") return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
  else if (str === "0") return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (trimmedStr.search(/.+[eE].+/) !== -1) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? (
        // 0., -00., 000.
        str[leadingZeros.length + 1] === "."
      ) : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0 || num === -0) return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation) return num;
          else return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0") return num;
          else if (parsedStr === numTrimmedByZeros) return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
          else return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
var eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation) return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? (
      // 0E.
      str[leadingZeros.length + 1] === eChar
    ) : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || "") + notation[3];
      return Number(trimmedStr);
    } else return str;
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".") numStr = "0";
    else if (numStr[0] === ".") numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt) return parseInt(numStr, base);
  else if (Number.parseInt) return Number.parseInt(numStr, base);
  else if (window && window.parseInt) return window.parseInt(numStr, base);
  else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}

// ../../node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// ../../node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var OrderedObjParser = class {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
      "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
      "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
      "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
      "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
      "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
      "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
      "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
      "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
      "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }
};
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
      regex: new RegExp("&" + ent + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== void 0) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities) val = this.replaceEntitiesValue(val);
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if (newval === null || newval === void 0) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if (aName === "__proto__") aName = "#__proto__";
        if (oldVal !== void 0) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if (newVal === null || newVal === void 0) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n");
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for (let i = 0; i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }
        const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
          this.tagsNodeStack.pop();
        } else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData) throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
        } else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if (val == void 0) val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if (tagName !== xmlObj.tagname) {
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (tagName !== tagExp && attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if (tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          this.addChild(currentNode, childNode, jPath, startIndex);
        } else {
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            const childNode = new XmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          } else {
            const childNode = new XmlNode(tagName);
            this.tagsNodeStack.push(currentNode);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
  if (!this.options.captureMetaData) startIndex = void 0;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if (result === false) {
  } else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
var replaceEntitiesValue = function(val) {
  if (this.options.processEntities) {
    for (let entityName in this.docTypeEntities) {
      const entity = this.docTypeEntities[entityName];
      val = val.replace(entity.regx, entity.val);
    }
    for (let entityName in this.lastEntities) {
      const entity = this.lastEntities[entityName];
      val = val.replace(entity.regex, entity.val);
    }
    if (this.options.htmlEntities) {
      for (let entityName in this.htmlEntities) {
        const entity = this.htmlEntities[entityName];
        val = val.replace(entity.regex, entity.val);
      }
    }
    val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) {
    if (isLeafNode === void 0) isLeafNode = currentNode.child.length === 0;
    textData = this.parseTextData(
      textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode
    );
    if (textData !== void 0 && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodes, jPath, currentTagName) {
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if (allNodesExp === stopNodeExp || jPath === stopNodeExp) return true;
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary) attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "	") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true") return true;
    else if (newval === "false") return false;
    else return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}

// ../../node_modules/fast-xml-parser/src/xmlparser/node2json.js
var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
function prettify(node, options) {
  return compress(node, options);
}
function compress(arr, options, jPath) {
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if (jPath === void 0) newJpath = property;
    else newJpath = jPath + "." + property;
    if (property === options.textNodeName) {
      if (text === void 0) text = tagObj[property];
      else text += "" + tagObj[property];
    } else if (property === void 0) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL2] !== void 0) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], newJpath, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }
      if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        if (options.isArray(property, newJpath, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0) compressedObj[options.textNodeName] = text;
  } else if (text !== void 0) compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@") return key;
  }
}
function assignAttributes(obj, attrMap, jpath, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}

// ../../node_modules/fast-xml-parser/src/validator.js
var defaultOptions2 = {
  allowBooleanAttributes: false,
  //A tag can have attributes without any value
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions2, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err) return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject(
                "InvalidTag",
                "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                getLineNumberForPosition(xmlData, tagStartPos)
              );
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {
          } else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "	" || char === "\n" || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
      } else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

// ../../node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var XMLParser = class {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  /**
   * Parse XML dats to JS object 
   * @param {string|Buffer} xmlData 
   * @param {boolean|Object} validationOption 
   */
  parse(xmlData, validationOption) {
    if (typeof xmlData === "string") {
    } else if (xmlData.toString) {
      xmlData = xmlData.toString();
    } else {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true) validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
    else return prettify(orderedResult, this.options);
  }
  /**
   * Add Entity which is not by default supported by this library
   * @param {string} key 
   * @param {string} value 
   */
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  /**
   * Returns a Symbol that can be used to access the metadata
   * property on a node.
   * 
   * If Symbol is not available in the environment, an ordinary property is used
   * and the name of the property is here returned.
   * 
   * The XMLMetaData property is only present when `captureMetaData`
   * is true in the options.
   */
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
};

export {
  XMLParser
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbHBhcnNlci9PcHRpb25zQnVpbGRlci5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMvdXRpbC5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL3htbE5vZGUuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbHBhcnNlci9Eb2NUeXBlUmVhZGVyLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvc3RybnVtL3N0cm51bS5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMvaWdub3JlQXR0cmlidXRlcy5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL09yZGVyZWRPYmpQYXJzZXIuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbHBhcnNlci9ub2RlMmpzb24uanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3ZhbGlkYXRvci5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL1hNTFBhcnNlci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXG5leHBvcnQgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgcHJlc2VydmVPcmRlcjogZmFsc2UsXG4gICAgYXR0cmlidXRlTmFtZVByZWZpeDogJ0BfJyxcbiAgICBhdHRyaWJ1dGVzR3JvdXBOYW1lOiBmYWxzZSxcbiAgICB0ZXh0Tm9kZU5hbWU6ICcjdGV4dCcsXG4gICAgaWdub3JlQXR0cmlidXRlczogdHJ1ZSxcbiAgICByZW1vdmVOU1ByZWZpeDogZmFsc2UsIC8vIHJlbW92ZSBOUyBmcm9tIHRhZyBuYW1lIG9yIGF0dHJpYnV0ZSBuYW1lIGlmIHRydWVcbiAgICBhbGxvd0Jvb2xlYW5BdHRyaWJ1dGVzOiBmYWxzZSwgLy9hIHRhZyBjYW4gaGF2ZSBhdHRyaWJ1dGVzIHdpdGhvdXQgYW55IHZhbHVlXG4gICAgLy9pZ25vcmVSb290RWxlbWVudCA6IGZhbHNlLFxuICAgIHBhcnNlVGFnVmFsdWU6IHRydWUsXG4gICAgcGFyc2VBdHRyaWJ1dGVWYWx1ZTogZmFsc2UsXG4gICAgdHJpbVZhbHVlczogdHJ1ZSwgLy9UcmltIHN0cmluZyB2YWx1ZXMgb2YgdGFnIGFuZCBhdHRyaWJ1dGVzXG4gICAgY2RhdGFQcm9wTmFtZTogZmFsc2UsXG4gICAgbnVtYmVyUGFyc2VPcHRpb25zOiB7XG4gICAgICBoZXg6IHRydWUsXG4gICAgICBsZWFkaW5nWmVyb3M6IHRydWUsXG4gICAgICBlTm90YXRpb246IHRydWVcbiAgICB9LFxuICAgIHRhZ1ZhbHVlUHJvY2Vzc29yOiBmdW5jdGlvbih0YWdOYW1lLCB2YWwpIHtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcbiAgICBhdHRyaWJ1dGVWYWx1ZVByb2Nlc3NvcjogZnVuY3Rpb24oYXR0ck5hbWUsIHZhbCkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuICAgIHN0b3BOb2RlczogW10sIC8vbmVzdGVkIHRhZ3Mgd2lsbCBub3QgYmUgcGFyc2VkIGV2ZW4gZm9yIGVycm9yc1xuICAgIGFsd2F5c0NyZWF0ZVRleHROb2RlOiBmYWxzZSxcbiAgICBpc0FycmF5OiAoKSA9PiBmYWxzZSxcbiAgICBjb21tZW50UHJvcE5hbWU6IGZhbHNlLFxuICAgIHVucGFpcmVkVGFnczogW10sXG4gICAgcHJvY2Vzc0VudGl0aWVzOiB0cnVlLFxuICAgIGh0bWxFbnRpdGllczogZmFsc2UsXG4gICAgaWdub3JlRGVjbGFyYXRpb246IGZhbHNlLFxuICAgIGlnbm9yZVBpVGFnczogZmFsc2UsXG4gICAgdHJhbnNmb3JtVGFnTmFtZTogZmFsc2UsXG4gICAgdHJhbnNmb3JtQXR0cmlidXRlTmFtZTogZmFsc2UsXG4gICAgdXBkYXRlVGFnOiBmdW5jdGlvbih0YWdOYW1lLCBqUGF0aCwgYXR0cnMpe1xuICAgICAgcmV0dXJuIHRhZ05hbWVcbiAgICB9LFxuICAgIC8vIHNraXBFbXB0eUxpc3RJdGVtOiBmYWxzZVxuICAgIGNhcHR1cmVNZXRhRGF0YTogZmFsc2UsXG59O1xuICAgXG5leHBvcnQgY29uc3QgYnVpbGRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG59O1xuIiwgIid1c2Ugc3RyaWN0JztcblxuY29uc3QgbmFtZVN0YXJ0Q2hhciA9ICc6QS1aYS16X1xcXFx1MDBDMC1cXFxcdTAwRDZcXFxcdTAwRDgtXFxcXHUwMEY2XFxcXHUwMEY4LVxcXFx1MDJGRlxcXFx1MDM3MC1cXFxcdTAzN0RcXFxcdTAzN0YtXFxcXHUxRkZGXFxcXHUyMDBDLVxcXFx1MjAwRFxcXFx1MjA3MC1cXFxcdTIxOEZcXFxcdTJDMDAtXFxcXHUyRkVGXFxcXHUzMDAxLVxcXFx1RDdGRlxcXFx1RjkwMC1cXFxcdUZEQ0ZcXFxcdUZERjAtXFxcXHVGRkZEJztcbmNvbnN0IG5hbWVDaGFyID0gbmFtZVN0YXJ0Q2hhciArICdcXFxcLS5cXFxcZFxcXFx1MDBCN1xcXFx1MDMwMC1cXFxcdTAzNkZcXFxcdTIwM0YtXFxcXHUyMDQwJztcbmV4cG9ydCBjb25zdCBuYW1lUmVnZXhwID0gJ1snICsgbmFtZVN0YXJ0Q2hhciArICddWycgKyBuYW1lQ2hhciArICddKic7XG5jb25zdCByZWdleE5hbWUgPSBuZXcgUmVnRXhwKCdeJyArIG5hbWVSZWdleHAgKyAnJCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsTWF0Y2hlcyhzdHJpbmcsIHJlZ2V4KSB7XG4gIGNvbnN0IG1hdGNoZXMgPSBbXTtcbiAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhzdHJpbmcpO1xuICB3aGlsZSAobWF0Y2gpIHtcbiAgICBjb25zdCBhbGxtYXRjaGVzID0gW107XG4gICAgYWxsbWF0Y2hlcy5zdGFydEluZGV4ID0gcmVnZXgubGFzdEluZGV4IC0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgIGNvbnN0IGxlbiA9IG1hdGNoLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGVuOyBpbmRleCsrKSB7XG4gICAgICBhbGxtYXRjaGVzLnB1c2gobWF0Y2hbaW5kZXhdKTtcbiAgICB9XG4gICAgbWF0Y2hlcy5wdXNoKGFsbG1hdGNoZXMpO1xuICAgIG1hdGNoID0gcmVnZXguZXhlYyhzdHJpbmcpO1xuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG5leHBvcnQgY29uc3QgaXNOYW1lID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gIGNvbnN0IG1hdGNoID0gcmVnZXhOYW1lLmV4ZWMoc3RyaW5nKTtcbiAgcmV0dXJuICEobWF0Y2ggPT09IG51bGwgfHwgdHlwZW9mIG1hdGNoID09PSAndW5kZWZpbmVkJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0V4aXN0KHYpIHtcbiAgcmV0dXJuIHR5cGVvZiB2ICE9PSAndW5kZWZpbmVkJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHlPYmplY3Qob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cblxuLyoqXG4gKiBDb3B5IGFsbCB0aGUgcHJvcGVydGllcyBvZiBhIGludG8gYi5cbiAqIEBwYXJhbSB7Kn0gdGFyZ2V0XG4gKiBAcGFyYW0geyp9IGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgYSwgYXJyYXlNb2RlKSB7XG4gIGlmIChhKSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGEpOyAvLyB3aWxsIHJldHVybiBhbiBhcnJheSBvZiBvd24gcHJvcGVydGllc1xuICAgIGNvbnN0IGxlbiA9IGtleXMubGVuZ3RoOyAvL2Rvbid0IG1ha2UgaXQgaW5saW5lXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKGFycmF5TW9kZSA9PT0gJ3N0cmljdCcpIHtcbiAgICAgICAgdGFyZ2V0W2tleXNbaV1dID0gWyBhW2tleXNbaV1dIF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRba2V5c1tpXV0gPSBhW2tleXNbaV1dO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuLyogZXhwb3J0cy5tZXJnZSA9ZnVuY3Rpb24gKGIsYSl7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKGIsYSk7XG59ICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZSh2KSB7XG4gIGlmIChleHBvcnRzLmlzRXhpc3QodikpIHtcbiAgICByZXR1cm4gdjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuLy8gY29uc3QgZmFrZUNhbGwgPSBmdW5jdGlvbihhKSB7cmV0dXJuIGE7fTtcbi8vIGNvbnN0IGZha2VDYWxsTm9SZXR1cm4gPSBmdW5jdGlvbigpIHt9OyIsICIndXNlIHN0cmljdCc7XG5cbmxldCBNRVRBREFUQV9TWU1CT0w7XG5cbmlmICh0eXBlb2YgU3ltYm9sICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgTUVUQURBVEFfU1lNQk9MID0gXCJAQHhtbE1ldGFkYXRhXCI7XG59IGVsc2Uge1xuICBNRVRBREFUQV9TWU1CT0wgPSBTeW1ib2woXCJYTUwgTm9kZSBNZXRhZGF0YVwiKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgWG1sTm9kZXtcbiAgY29uc3RydWN0b3IodGFnbmFtZSkge1xuICAgIHRoaXMudGFnbmFtZSA9IHRhZ25hbWU7XG4gICAgdGhpcy5jaGlsZCA9IFtdOyAvL25lc3RlZCB0YWdzLCB0ZXh0LCBjZGF0YSwgY29tbWVudHMgaW4gb3JkZXJcbiAgICB0aGlzW1wiOkBcIl0gPSB7fTsgLy9hdHRyaWJ1dGVzIG1hcFxuICB9XG4gIGFkZChrZXksdmFsKXtcbiAgICAvLyB0aGlzLmNoaWxkLnB1c2goIHtuYW1lIDoga2V5LCB2YWw6IHZhbCwgaXNDZGF0YTogaXNDZGF0YSB9KTtcbiAgICBpZihrZXkgPT09IFwiX19wcm90b19fXCIpIGtleSA9IFwiI19fcHJvdG9fX1wiO1xuICAgIHRoaXMuY2hpbGQucHVzaCgge1trZXldOiB2YWwgfSk7XG4gIH1cbiAgYWRkQ2hpbGQobm9kZSwgc3RhcnRJbmRleCkge1xuICAgIGlmKG5vZGUudGFnbmFtZSA9PT0gXCJfX3Byb3RvX19cIikgbm9kZS50YWduYW1lID0gXCIjX19wcm90b19fXCI7XG4gICAgaWYobm9kZVtcIjpAXCJdICYmIE9iamVjdC5rZXlzKG5vZGVbXCI6QFwiXSkubGVuZ3RoID4gMCl7XG4gICAgICB0aGlzLmNoaWxkLnB1c2goIHsgW25vZGUudGFnbmFtZV06IG5vZGUuY2hpbGQsIFtcIjpAXCJdOiBub2RlW1wiOkBcIl0gfSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmNoaWxkLnB1c2goIHsgW25vZGUudGFnbmFtZV06IG5vZGUuY2hpbGQgfSk7XG4gICAgfVxuICAgIC8vIGlmIHJlcXVlc3RlZCwgYWRkIHRoZSBzdGFydEluZGV4XG4gICAgaWYgKHN0YXJ0SW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTm90ZTogZm9yIG5vdyB3ZSBqdXN0IG92ZXJ3cml0ZSB0aGUgbWV0YWRhdGEuIElmIHdlIGhhZCBtb3JlIGNvbXBsZXggbWV0YWRhdGEsXG4gICAgICAvLyB3ZSBtaWdodCBuZWVkIHRvIGRvIGFuIG9iamVjdCBhcHBlbmQgaGVyZTogIG1ldGFkYXRhID0geyAuLi5tZXRhZGF0YSwgc3RhcnRJbmRleCB9XG4gICAgICB0aGlzLmNoaWxkW3RoaXMuY2hpbGQubGVuZ3RoIC0gMV1bTUVUQURBVEFfU1lNQk9MXSA9IHsgc3RhcnRJbmRleCB9O1xuICAgIH1cbiAgfVxuICAvKiogc3ltYm9sIHVzZWQgZm9yIG1ldGFkYXRhICovXG4gIHN0YXRpYyBnZXRNZXRhRGF0YVN5bWJvbCgpIHtcbiAgICByZXR1cm4gTUVUQURBVEFfU1lNQk9MO1xuICB9XG59XG4iLCAiaW1wb3J0IHtpc05hbWV9IGZyb20gJy4uL3V0aWwuanMnO1xuXG4vL1RPRE86IGhhbmRsZSBjb21tZW50c1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVhZERvY1R5cGUoeG1sRGF0YSwgaSl7XG4gICAgXG4gICAgY29uc3QgZW50aXRpZXMgPSB7fTtcbiAgICBpZiggeG1sRGF0YVtpICsgM10gPT09ICdPJyAmJlxuICAgICAgICAgeG1sRGF0YVtpICsgNF0gPT09ICdDJyAmJlxuICAgICAgICAgeG1sRGF0YVtpICsgNV0gPT09ICdUJyAmJlxuICAgICAgICAgeG1sRGF0YVtpICsgNl0gPT09ICdZJyAmJlxuICAgICAgICAgeG1sRGF0YVtpICsgN10gPT09ICdQJyAmJlxuICAgICAgICAgeG1sRGF0YVtpICsgOF0gPT09ICdFJylcbiAgICB7ICAgIFxuICAgICAgICBpID0gaSs5O1xuICAgICAgICBsZXQgYW5nbGVCcmFja2V0c0NvdW50ID0gMTtcbiAgICAgICAgbGV0IGhhc0JvZHkgPSBmYWxzZSwgY29tbWVudCA9IGZhbHNlO1xuICAgICAgICBsZXQgZXhwID0gXCJcIjtcbiAgICAgICAgZm9yKDtpPHhtbERhdGEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnICYmICFjb21tZW50KSB7IC8vRGV0ZXJtaW5lIHRoZSB0YWcgdHlwZVxuICAgICAgICAgICAgICAgIGlmKCBoYXNCb2R5ICYmIGhhc1NlcSh4bWxEYXRhLCBcIiFFTlRJVFlcIixpKSl7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gNzsgXG4gICAgICAgICAgICAgICAgICAgIGxldCBlbnRpdHlOYW1lLCB2YWw7XG4gICAgICAgICAgICAgICAgICAgIFtlbnRpdHlOYW1lLCB2YWwsaV0gPSByZWFkRW50aXR5RXhwKHhtbERhdGEsaSsxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYodmFsLmluZGV4T2YoXCImXCIpID09PSAtMSkgLy9QYXJhbWV0ZXIgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzWyBlbnRpdHlOYW1lIF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVneCA6IFJlZ0V4cCggYCYke2VudGl0eU5hbWV9O2AsXCJnXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbDogdmFsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBoYXNCb2R5ICYmIGhhc1NlcSh4bWxEYXRhLCBcIiFFTEVNRU5UXCIsaSkpICB7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gODsvL05vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2luZGV4fSA9IHJlYWRFbGVtZW50RXhwKHhtbERhdGEsaSsxKTtcbiAgICAgICAgICAgICAgICAgICAgaSA9IGluZGV4O1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKCBoYXNCb2R5ICYmIGhhc1NlcSh4bWxEYXRhLCBcIiFBVFRMSVNUXCIsaSkpe1xuICAgICAgICAgICAgICAgICAgICBpICs9IDg7Ly9Ob3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0IHtpbmRleH0gPSByZWFkQXR0bGlzdEV4cCh4bWxEYXRhLGkrMSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGkgPSBpbmRleDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZiggaGFzQm9keSAmJiBoYXNTZXEoeG1sRGF0YSwgXCIhTk9UQVRJT05cIixpKSkge1xuICAgICAgICAgICAgICAgICAgICBpICs9IDk7Ly9Ob3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtpbmRleH0gPSByZWFkTm90YXRpb25FeHAoeG1sRGF0YSxpKzEpO1xuICAgICAgICAgICAgICAgICAgICBpID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoIGhhc1NlcSh4bWxEYXRhLCBcIiEtLVwiLGkpICkgY29tbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIERPQ1RZUEVcIik7XG5cbiAgICAgICAgICAgICAgICBhbmdsZUJyYWNrZXRzQ291bnQrKztcbiAgICAgICAgICAgICAgICBleHAgPSBcIlwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2ldID09PSAnPicpIHsgLy9SZWFkIHRhZyBjb250ZW50XG4gICAgICAgICAgICAgICAgaWYoY29tbWVudCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKCB4bWxEYXRhW2kgLSAxXSA9PT0gXCItXCIgJiYgeG1sRGF0YVtpIC0gMl0gPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudC0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYW5nbGVCcmFja2V0c0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ZWxzZSBpZiggeG1sRGF0YVtpXSA9PT0gJ1snKXtcbiAgICAgICAgICAgICAgICBoYXNCb2R5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGV4cCArPSB4bWxEYXRhW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGFuZ2xlQnJhY2tldHNDb3VudCAhPT0gMCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuY2xvc2VkIERPQ1RZUEVgKTtcbiAgICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVGFnIGluc3RlYWQgb2YgRE9DVFlQRWApO1xuICAgIH1cbiAgICByZXR1cm4ge2VudGl0aWVzLCBpfTtcbn1cblxuY29uc3Qgc2tpcFdoaXRlc3BhY2UgPSAoZGF0YSwgaW5kZXgpID0+IHtcbiAgICB3aGlsZSAoaW5kZXggPCBkYXRhLmxlbmd0aCAmJiAvXFxzLy50ZXN0KGRhdGFbaW5kZXhdKSkge1xuICAgICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG59O1xuXG5mdW5jdGlvbiByZWFkRW50aXR5RXhwKHhtbERhdGEsIGkpIHsgICAgXG4gICAgLy9FeHRlcm5hbCBlbnRpdGllcyBhcmUgbm90IHN1cHBvcnRlZFxuICAgIC8vICAgIDwhRU5USVRZIGV4dCBTWVNURU0gXCJodHRwOi8vbm9ybWFsLXdlYnNpdGUuY29tXCIgPlxuXG4gICAgLy9QYXJhbWV0ZXIgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcbiAgICAvLyAgICA8IUVOVElUWSBlbnRpdHluYW1lIFwiJmFub3RoZXJFbGVtZW50O1wiPlxuXG4gICAgLy9JbnRlcm5hbCBlbnRpdGllcyBhcmUgc3VwcG9ydGVkXG4gICAgLy8gICAgPCFFTlRJVFkgZW50aXR5bmFtZSBcInJlcGxhY2VtZW50IHRleHRcIj5cblxuICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhRU5USVRZXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBlbnRpdHkgbmFtZVxuICAgIGxldCBlbnRpdHlOYW1lID0gXCJcIjtcbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pICYmIHhtbERhdGFbaV0gIT09ICdcIicgJiYgeG1sRGF0YVtpXSAhPT0gXCInXCIpIHtcbiAgICAgICAgZW50aXR5TmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIHZhbGlkYXRlRW50aXR5TmFtZShlbnRpdHlOYW1lKTtcblxuICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBlbnRpdHkgbmFtZVxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIENoZWNrIGZvciB1bnN1cHBvcnRlZCBjb25zdHJ1Y3RzIChleHRlcm5hbCBlbnRpdGllcyBvciBwYXJhbWV0ZXIgZW50aXRpZXMpXG4gICAgaWYgKHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA2KS50b1VwcGVyQ2FzZSgpID09PSBcIlNZU1RFTVwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4dGVybmFsIGVudGl0aWVzIGFyZSBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1lbHNlIGlmICh4bWxEYXRhW2ldID09PSBcIiVcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJhbWV0ZXIgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgfVxuXG4gICAgLy8gUmVhZCBlbnRpdHkgdmFsdWUgKGludGVybmFsIGVudGl0eSlcbiAgICBsZXQgZW50aXR5VmFsdWUgPSBcIlwiO1xuICAgIFtpLCBlbnRpdHlWYWx1ZV0gPSByZWFkSWRlbnRpZmllclZhbCh4bWxEYXRhLCBpLCBcImVudGl0eVwiKTtcbiAgICBpLS07XG4gICAgcmV0dXJuIFtlbnRpdHlOYW1lLCBlbnRpdHlWYWx1ZSwgaSBdO1xufVxuXG5mdW5jdGlvbiByZWFkTm90YXRpb25FeHAoeG1sRGF0YSwgaSkge1xuICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhTk9UQVRJT05cbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIG5vdGF0aW9uIG5hbWVcbiAgICBsZXQgbm90YXRpb25OYW1lID0gXCJcIjtcbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgIG5vdGF0aW9uTmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIHZhbGlkYXRlRW50aXR5TmFtZShub3RhdGlvbk5hbWUpO1xuXG4gICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIG5vdGF0aW9uIG5hbWVcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBDaGVjayBpZGVudGlmaWVyIHR5cGUgKFNZU1RFTSBvciBQVUJMSUMpXG4gICAgY29uc3QgaWRlbnRpZmllclR5cGUgPSB4bWxEYXRhLnN1YnN0cmluZyhpLCBpICsgNikudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoaWRlbnRpZmllclR5cGUgIT09IFwiU1lTVEVNXCIgJiYgaWRlbnRpZmllclR5cGUgIT09IFwiUFVCTElDXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBTWVNURU0gb3IgUFVCTElDLCBmb3VuZCBcIiR7aWRlbnRpZmllclR5cGV9XCJgKTtcbiAgICB9XG4gICAgaSArPSBpZGVudGlmaWVyVHlwZS5sZW5ndGg7XG5cbiAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgaWRlbnRpZmllciB0eXBlXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBwdWJsaWMgaWRlbnRpZmllciAoaWYgUFVCTElDKVxuICAgIGxldCBwdWJsaWNJZGVudGlmaWVyID0gbnVsbDtcbiAgICBsZXQgc3lzdGVtSWRlbnRpZmllciA9IG51bGw7XG5cbiAgICBpZiAoaWRlbnRpZmllclR5cGUgPT09IFwiUFVCTElDXCIpIHtcbiAgICAgICAgW2ksIHB1YmxpY0lkZW50aWZpZXIgXSA9IHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwicHVibGljSWRlbnRpZmllclwiKTtcblxuICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgcHVibGljIGlkZW50aWZpZXJcbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgcmVhZCBzeXN0ZW0gaWRlbnRpZmllclxuICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJ1wiJyB8fCB4bWxEYXRhW2ldID09PSBcIidcIikge1xuICAgICAgICAgICAgW2ksIHN5c3RlbUlkZW50aWZpZXIgXSA9IHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksXCJzeXN0ZW1JZGVudGlmaWVyXCIpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpZGVudGlmaWVyVHlwZSA9PT0gXCJTWVNURU1cIikge1xuICAgICAgICAvLyBSZWFkIHN5c3RlbSBpZGVudGlmaWVyIChtYW5kYXRvcnkgZm9yIFNZU1RFTSlcbiAgICAgICAgW2ksIHN5c3RlbUlkZW50aWZpZXIgXSA9IHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwic3lzdGVtSWRlbnRpZmllclwiKTtcblxuICAgICAgICBpZiAoIXN5c3RlbUlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgbWFuZGF0b3J5IHN5c3RlbSBpZGVudGlmaWVyIGZvciBTWVNURU0gbm90YXRpb25cIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtub3RhdGlvbk5hbWUsIHB1YmxpY0lkZW50aWZpZXIsIHN5c3RlbUlkZW50aWZpZXIsIGluZGV4OiAtLWl9O1xufVxuXG5mdW5jdGlvbiByZWFkSWRlbnRpZmllclZhbCh4bWxEYXRhLCBpLCB0eXBlKSB7XG4gICAgbGV0IGlkZW50aWZpZXJWYWwgPSBcIlwiO1xuICAgIGNvbnN0IHN0YXJ0Q2hhciA9IHhtbERhdGFbaV07XG4gICAgaWYgKHN0YXJ0Q2hhciAhPT0gJ1wiJyAmJiBzdGFydENoYXIgIT09IFwiJ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgcXVvdGVkIHN0cmluZywgZm91bmQgXCIke3N0YXJ0Q2hhcn1cImApO1xuICAgIH1cbiAgICBpKys7XG5cbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmIHhtbERhdGFbaV0gIT09IHN0YXJ0Q2hhcikge1xuICAgICAgICBpZGVudGlmaWVyVmFsICs9IHhtbERhdGFbaV07XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAoeG1sRGF0YVtpXSAhPT0gc3RhcnRDaGFyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW50ZXJtaW5hdGVkICR7dHlwZX0gdmFsdWVgKTtcbiAgICB9XG4gICAgaSsrO1xuICAgIHJldHVybiBbaSwgaWRlbnRpZmllclZhbF07XG59XG5cbmZ1bmN0aW9uIHJlYWRFbGVtZW50RXhwKHhtbERhdGEsIGkpIHtcbiAgICAvLyA8IUVMRU1FTlQgYnIgRU1QVFk+XG4gICAgLy8gPCFFTEVNRU5UIGRpdiBBTlk+XG4gICAgLy8gPCFFTEVNRU5UIHRpdGxlICgjUENEQVRBKT5cbiAgICAvLyA8IUVMRU1FTlQgYm9vayAodGl0bGUsIGF1dGhvcispPlxuICAgIC8vIDwhRUxFTUVOVCBuYW1lIChjb250ZW50LW1vZGVsKT5cbiAgICBcbiAgICAvLyBTa2lwIGxlYWRpbmcgd2hpdGVzcGFjZSBhZnRlciA8IUVMRU1FTlRcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIGVsZW1lbnQgbmFtZVxuICAgIGxldCBlbGVtZW50TmFtZSA9IFwiXCI7XG4gICAgd2hpbGUgKGkgPCB4bWxEYXRhLmxlbmd0aCAmJiAhL1xccy8udGVzdCh4bWxEYXRhW2ldKSkge1xuICAgICAgICBlbGVtZW50TmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgZWxlbWVudCBuYW1lXG4gICAgaWYgKCF2YWxpZGF0ZUVudGl0eU5hbWUoZWxlbWVudE5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBlbGVtZW50IG5hbWU6IFwiJHtlbGVtZW50TmFtZX1cImApO1xuICAgIH1cblxuICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBlbGVtZW50IG5hbWVcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG4gICAgbGV0IGNvbnRlbnRNb2RlbCA9IFwiXCI7XG4gICAgLy8gRXhwZWN0ICcoJyB0byBzdGFydCBjb250ZW50IG1vZGVsXG4gICAgaWYoeG1sRGF0YVtpXSA9PT0gXCJFXCIgJiYgaGFzU2VxKHhtbERhdGEsIFwiTVBUWVwiLGkpKSBpKz02O1xuICAgIGVsc2UgaWYoeG1sRGF0YVtpXSA9PT0gXCJBXCIgJiYgaGFzU2VxKHhtbERhdGEsIFwiTllcIixpKSkgaSs9NDtcbiAgICBlbHNlIGlmICh4bWxEYXRhW2ldID09PSBcIihcIikge1xuICAgICAgICBpKys7IC8vIE1vdmUgcGFzdCAnKCdcblxuICAgICAgICAvLyBSZWFkIGNvbnRlbnQgbW9kZWxcbiAgICAgICAgd2hpbGUgKGkgPCB4bWxEYXRhLmxlbmd0aCAmJiB4bWxEYXRhW2ldICE9PSBcIilcIikge1xuICAgICAgICAgICAgY29udGVudE1vZGVsICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnRlcm1pbmF0ZWQgY29udGVudCBtb2RlbFwiKTtcbiAgICAgICAgfVxuXG4gICAgfWVsc2V7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBFbGVtZW50IEV4cHJlc3Npb24sIGZvdW5kIFwiJHt4bWxEYXRhW2ldfVwiYCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnROYW1lLFxuICAgICAgICBjb250ZW50TW9kZWw6IGNvbnRlbnRNb2RlbC50cmltKCksXG4gICAgICAgIGluZGV4OiBpXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVhZEF0dGxpc3RFeHAoeG1sRGF0YSwgaSkge1xuICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhQVRUTElTVFxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIFJlYWQgZWxlbWVudCBuYW1lXG4gICAgbGV0IGVsZW1lbnROYW1lID0gXCJcIjtcbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgIGVsZW1lbnROYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBlbGVtZW50IG5hbWVcbiAgICB2YWxpZGF0ZUVudGl0eU5hbWUoZWxlbWVudE5hbWUpXG5cbiAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgZWxlbWVudCBuYW1lXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBhdHRyaWJ1dGUgbmFtZVxuICAgIGxldCBhdHRyaWJ1dGVOYW1lID0gXCJcIjtcbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgIGF0dHJpYnV0ZU5hbWUgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGF0dHJpYnV0ZSBuYW1lXG4gICAgaWYgKCF2YWxpZGF0ZUVudGl0eU5hbWUoYXR0cmlidXRlTmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGF0dHJpYnV0ZSBuYW1lOiBcIiR7YXR0cmlidXRlTmFtZX1cImApO1xuICAgIH1cblxuICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBhdHRyaWJ1dGUgbmFtZVxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIFJlYWQgYXR0cmlidXRlIHR5cGVcbiAgICBsZXQgYXR0cmlidXRlVHlwZSA9IFwiXCI7XG4gICAgaWYgKHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA4KS50b1VwcGVyQ2FzZSgpID09PSBcIk5PVEFUSU9OXCIpIHtcbiAgICAgICAgYXR0cmlidXRlVHlwZSA9IFwiTk9UQVRJT05cIjtcbiAgICAgICAgaSArPSA4OyAvLyBNb3ZlIHBhc3QgXCJOT1RBVElPTlwiXG5cbiAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIFwiTk9UQVRJT05cIlxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gRXhwZWN0ICcoJyB0byBzdGFydCB0aGUgbGlzdCBvZiBub3RhdGlvbnNcbiAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IFwiKFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICcoJywgZm91bmQgXCIke3htbERhdGFbaV19XCJgKTtcbiAgICAgICAgfVxuICAgICAgICBpKys7IC8vIE1vdmUgcGFzdCAnKCdcblxuICAgICAgICAvLyBSZWFkIHRoZSBsaXN0IG9mIGFsbG93ZWQgbm90YXRpb25zXG4gICAgICAgIGxldCBhbGxvd2VkTm90YXRpb25zID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgeG1sRGF0YVtpXSAhPT0gXCIpXCIpIHtcbiAgICAgICAgICAgIGxldCBub3RhdGlvbiA9IFwiXCI7XG4gICAgICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmIHhtbERhdGFbaV0gIT09IFwifFwiICYmIHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICAgICAgbm90YXRpb24gKz0geG1sRGF0YVtpXTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIG5vdGF0aW9uIG5hbWVcbiAgICAgICAgICAgIG5vdGF0aW9uID0gbm90YXRpb24udHJpbSgpO1xuICAgICAgICAgICAgaWYgKCF2YWxpZGF0ZUVudGl0eU5hbWUobm90YXRpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG5vdGF0aW9uIG5hbWU6IFwiJHtub3RhdGlvbn1cImApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhbGxvd2VkTm90YXRpb25zLnB1c2gobm90YXRpb24pO1xuXG4gICAgICAgICAgICAvLyBTa2lwICd8JyBzZXBhcmF0b3Igb3IgZXhpdCBsb29wXG4gICAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gXCJ8XCIpIHtcbiAgICAgICAgICAgICAgICBpKys7IC8vIE1vdmUgcGFzdCAnfCdcbiAgICAgICAgICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7IC8vIFNraXAgb3B0aW9uYWwgd2hpdGVzcGFjZSBhZnRlciAnfCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh4bWxEYXRhW2ldICE9PSBcIilcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW50ZXJtaW5hdGVkIGxpc3Qgb2Ygbm90YXRpb25zXCIpO1xuICAgICAgICB9XG4gICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICcpJ1xuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBhbGxvd2VkIG5vdGF0aW9ucyBhcyBwYXJ0IG9mIHRoZSBhdHRyaWJ1dGUgdHlwZVxuICAgICAgICBhdHRyaWJ1dGVUeXBlICs9IFwiIChcIiArIGFsbG93ZWROb3RhdGlvbnMuam9pbihcInxcIikgKyBcIilcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBIYW5kbGUgc2ltcGxlIHR5cGVzIChlLmcuLCBDREFUQSwgSUQsIElEUkVGLCBldGMuKVxuICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVUeXBlICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBzaW1wbGUgYXR0cmlidXRlIHR5cGVcbiAgICAgICAgY29uc3QgdmFsaWRUeXBlcyA9IFtcIkNEQVRBXCIsIFwiSURcIiwgXCJJRFJFRlwiLCBcIklEUkVGU1wiLCBcIkVOVElUWVwiLCBcIkVOVElUSUVTXCIsIFwiTk1UT0tFTlwiLCBcIk5NVE9LRU5TXCJdO1xuICAgICAgICBpZiAoIXZhbGlkVHlwZXMuaW5jbHVkZXMoYXR0cmlidXRlVHlwZS50b1VwcGVyQ2FzZSgpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGF0dHJpYnV0ZSB0eXBlOiBcIiR7YXR0cmlidXRlVHlwZX1cImApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGF0dHJpYnV0ZSB0eXBlXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBkZWZhdWx0IHZhbHVlXG4gICAgbGV0IGRlZmF1bHRWYWx1ZSA9IFwiXCI7XG4gICAgaWYgKHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA4KS50b1VwcGVyQ2FzZSgpID09PSBcIiNSRVFVSVJFRFwiKSB7XG4gICAgICAgIGRlZmF1bHRWYWx1ZSA9IFwiI1JFUVVJUkVEXCI7XG4gICAgICAgIGkgKz0gODtcbiAgICB9IGVsc2UgaWYgKHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA3KS50b1VwcGVyQ2FzZSgpID09PSBcIiNJTVBMSUVEXCIpIHtcbiAgICAgICAgZGVmYXVsdFZhbHVlID0gXCIjSU1QTElFRFwiO1xuICAgICAgICBpICs9IDc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgW2ksIGRlZmF1bHRWYWx1ZV0gPSByZWFkSWRlbnRpZmllclZhbCh4bWxEYXRhLCBpLCBcIkFUVExJU1RcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudE5hbWUsXG4gICAgICAgIGF0dHJpYnV0ZU5hbWUsXG4gICAgICAgIGF0dHJpYnV0ZVR5cGUsXG4gICAgICAgIGRlZmF1bHRWYWx1ZSxcbiAgICAgICAgaW5kZXg6IGlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc1NlcShkYXRhLCBzZXEsaSl7XG4gICAgZm9yKGxldCBqPTA7ajxzZXEubGVuZ3RoO2orKyl7XG4gICAgICAgIGlmKHNlcVtqXSE9PWRhdGFbaStqKzFdKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUVudGl0eU5hbWUobmFtZSl7XG4gICAgaWYgKGlzTmFtZShuYW1lKSlcblx0cmV0dXJuIG5hbWU7XG4gICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZW50aXR5IG5hbWUgJHtuYW1lfWApO1xufVxuIiwgImNvbnN0IGhleFJlZ2V4ID0gL15bLStdPzB4W2EtZkEtRjAtOV0rJC87XG5jb25zdCBudW1SZWdleCA9IC9eKFtcXC1cXCtdKT8oMCopKFswLTldKihcXC5bMC05XSopPykkLztcbi8vIGNvbnN0IG9jdFJlZ2V4ID0gL14weFthLXowLTldKy87XG4vLyBjb25zdCBiaW5SZWdleCA9IC8weFthLXowLTldKy87XG5cbiBcbmNvbnN0IGNvbnNpZGVyID0ge1xuICAgIGhleCA6ICB0cnVlLFxuICAgIC8vIG9jdDogZmFsc2UsXG4gICAgbGVhZGluZ1plcm9zOiB0cnVlLFxuICAgIGRlY2ltYWxQb2ludDogXCJcXC5cIixcbiAgICBlTm90YXRpb246IHRydWUsXG4gICAgLy9za2lwTGlrZTogL3JlZ2V4L1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdG9OdW1iZXIoc3RyLCBvcHRpb25zID0ge30pe1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBjb25zaWRlciwgb3B0aW9ucyApO1xuICAgIGlmKCFzdHIgfHwgdHlwZW9mIHN0ciAhPT0gXCJzdHJpbmdcIiApIHJldHVybiBzdHI7XG4gICAgXG4gICAgbGV0IHRyaW1tZWRTdHIgID0gc3RyLnRyaW0oKTtcbiAgICBcbiAgICBpZihvcHRpb25zLnNraXBMaWtlICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5za2lwTGlrZS50ZXN0KHRyaW1tZWRTdHIpKSByZXR1cm4gc3RyO1xuICAgIGVsc2UgaWYoc3RyPT09XCIwXCIpIHJldHVybiAwO1xuICAgIGVsc2UgaWYgKG9wdGlvbnMuaGV4ICYmIGhleFJlZ2V4LnRlc3QodHJpbW1lZFN0cikpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlX2ludCh0cmltbWVkU3RyLCAxNik7XG4gICAgLy8gfWVsc2UgaWYgKG9wdGlvbnMub2N0ICYmIG9jdFJlZ2V4LnRlc3Qoc3RyKSkge1xuICAgIC8vICAgICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KHZhbCwgOCk7XG4gICAgfWVsc2UgaWYgKHRyaW1tZWRTdHIuc2VhcmNoKC8uK1tlRV0uKy8pIT09IC0xKSB7IC8vZU5vdGF0aW9uXG4gICAgICAgIHJldHVybiByZXNvbHZlRW5vdGF0aW9uKHN0cix0cmltbWVkU3RyLG9wdGlvbnMpO1xuICAgIC8vIH1lbHNlIGlmIChvcHRpb25zLnBhcnNlQmluICYmIGJpblJlZ2V4LnRlc3Qoc3RyKSkge1xuICAgIC8vICAgICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KHZhbCwgMik7XG4gICAgfWVsc2V7XG4gICAgICAgIC8vc2VwYXJhdGUgbmVnYXRpdmUgc2lnbiwgbGVhZGluZyB6ZXJvcywgYW5kIHJlc3QgbnVtYmVyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gbnVtUmVnZXguZXhlYyh0cmltbWVkU3RyKTtcbiAgICAgICAgLy8gKzAwLjEyMyA9PiBbICwgJysnLCAnMDAnLCAnLjEyMycsIC4uXG4gICAgICAgIGlmKG1hdGNoKXtcbiAgICAgICAgICAgIGNvbnN0IHNpZ24gPSBtYXRjaFsxXSB8fCBcIlwiO1xuICAgICAgICAgICAgY29uc3QgbGVhZGluZ1plcm9zID0gbWF0Y2hbMl07XG4gICAgICAgICAgICBsZXQgbnVtVHJpbW1lZEJ5WmVyb3MgPSB0cmltWmVyb3MobWF0Y2hbM10pOyAvL2NvbXBsZXRlIG51bSB3aXRob3V0IGxlYWRpbmcgemVyb3NcbiAgICAgICAgICAgIGNvbnN0IGRlY2ltYWxBZGphY2VudFRvTGVhZGluZ1plcm9zID0gc2lnbiA/IC8vIDAuLCAtMDAuLCAwMDAuXG4gICAgICAgICAgICAgICAgc3RyW2xlYWRpbmdaZXJvcy5sZW5ndGgrMV0gPT09IFwiLlwiIFxuICAgICAgICAgICAgICAgIDogc3RyW2xlYWRpbmdaZXJvcy5sZW5ndGhdID09PSBcIi5cIjtcblxuICAgICAgICAgICAgLy90cmltIGVuZGluZyB6ZXJvcyBmb3IgZmxvYXRpbmcgbnVtYmVyXG4gICAgICAgICAgICBpZighb3B0aW9ucy5sZWFkaW5nWmVyb3MgLy9sZWFkaW5nIHplcm9zIGFyZSBub3QgYWxsb3dlZFxuICAgICAgICAgICAgICAgICYmIChsZWFkaW5nWmVyb3MubGVuZ3RoID4gMSBcbiAgICAgICAgICAgICAgICAgICAgfHwgKGxlYWRpbmdaZXJvcy5sZW5ndGggPT09IDEgJiYgIWRlY2ltYWxBZGphY2VudFRvTGVhZGluZ1plcm9zKSkpe1xuICAgICAgICAgICAgICAgIC8vIDAwLCAwMC4zLCArMDMuMjQsIDAzLCAwMy4yNFxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNley8vbm8gbGVhZGluZyB6ZXJvcyBvciBsZWFkaW5nIHplcm9zIGFyZSBhbGxvd2VkXG4gICAgICAgICAgICAgICAgY29uc3QgbnVtID0gTnVtYmVyKHRyaW1tZWRTdHIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZFN0ciA9IFN0cmluZyhudW0pO1xuXG4gICAgICAgICAgICAgICAgaWYoIG51bSA9PT0gMCB8fCBudW0gPT09IC0wKSByZXR1cm4gbnVtO1xuICAgICAgICAgICAgICAgIGlmKHBhcnNlZFN0ci5zZWFyY2goL1tlRV0vKSAhPT0gLTEpeyAvL2dpdmVuIG51bWJlciBpcyBsb25nIGFuZCBwYXJzZWQgdG8gZU5vdGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZU5vdGF0aW9uKSByZXR1cm4gbnVtO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYodHJpbW1lZFN0ci5pbmRleE9mKFwiLlwiKSAhPT0gLTEpeyAvL2Zsb2F0aW5nIG51bWJlclxuICAgICAgICAgICAgICAgICAgICBpZihwYXJzZWRTdHIgPT09IFwiMFwiKSByZXR1cm4gbnVtOyAvLzAuMFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKHBhcnNlZFN0ciA9PT0gbnVtVHJpbW1lZEJ5WmVyb3MpIHJldHVybiBudW07IC8vMC40NTYuIDAuNzkwMDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiggcGFyc2VkU3RyID09PSBgJHtzaWdufSR7bnVtVHJpbW1lZEJ5WmVyb3N9YCkgcmV0dXJuIG51bTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gc3RyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgbiA9IGxlYWRpbmdaZXJvcz8gbnVtVHJpbW1lZEJ5WmVyb3MgOiB0cmltbWVkU3RyO1xuICAgICAgICAgICAgICAgIGlmKGxlYWRpbmdaZXJvcyl7XG4gICAgICAgICAgICAgICAgICAgIC8vIC0wMDkgPT4gLTlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChuID09PSBwYXJzZWRTdHIpIHx8IChzaWduK24gPT09IHBhcnNlZFN0cikgPyBudW0gOiBzdHJcbiAgICAgICAgICAgICAgICB9ZWxzZSAge1xuICAgICAgICAgICAgICAgICAgICAvLyArOVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG4gPT09IHBhcnNlZFN0cikgfHwgKG4gPT09IHNpZ24rcGFyc2VkU3RyKSA/IG51bSA6IHN0clxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7IC8vbm9uLW51bWVyaWMgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBlTm90YXRpb25SZWd4ID0gL14oWy0rXSk/KDAqKShcXGQqKFxcLlxcZCopP1tlRV1bLVxcK10/XFxkKykkLztcbmZ1bmN0aW9uIHJlc29sdmVFbm90YXRpb24oc3RyLHRyaW1tZWRTdHIsb3B0aW9ucyl7XG4gICAgaWYoIW9wdGlvbnMuZU5vdGF0aW9uKSByZXR1cm4gc3RyO1xuICAgIGNvbnN0IG5vdGF0aW9uID0gdHJpbW1lZFN0ci5tYXRjaChlTm90YXRpb25SZWd4KTsgXG4gICAgaWYobm90YXRpb24pe1xuICAgICAgICBsZXQgc2lnbiA9IG5vdGF0aW9uWzFdIHx8IFwiXCI7XG4gICAgICAgIGNvbnN0IGVDaGFyID0gbm90YXRpb25bM10uaW5kZXhPZihcImVcIikgPT09IC0xID8gXCJFXCIgOiBcImVcIjtcbiAgICAgICAgY29uc3QgbGVhZGluZ1plcm9zID0gbm90YXRpb25bMl07XG4gICAgICAgIGNvbnN0IGVBZGphY2VudFRvTGVhZGluZ1plcm9zID0gc2lnbiA/IC8vIDBFLlxuICAgICAgICAgICAgc3RyW2xlYWRpbmdaZXJvcy5sZW5ndGgrMV0gPT09IGVDaGFyIFxuICAgICAgICAgICAgOiBzdHJbbGVhZGluZ1plcm9zLmxlbmd0aF0gPT09IGVDaGFyO1xuXG4gICAgICAgIGlmKGxlYWRpbmdaZXJvcy5sZW5ndGggPiAxICYmIGVBZGphY2VudFRvTGVhZGluZ1plcm9zKSByZXR1cm4gc3RyO1xuICAgICAgICBlbHNlIGlmKGxlYWRpbmdaZXJvcy5sZW5ndGggPT09IDEgXG4gICAgICAgICAgICAmJiAobm90YXRpb25bM10uc3RhcnRzV2l0aChgLiR7ZUNoYXJ9YCkgfHwgbm90YXRpb25bM11bMF0gPT09IGVDaGFyKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcih0cmltbWVkU3RyKTtcbiAgICAgICAgfWVsc2UgaWYob3B0aW9ucy5sZWFkaW5nWmVyb3MgJiYgIWVBZGphY2VudFRvTGVhZGluZ1plcm9zKXsgLy9hY2NlcHQgd2l0aCBsZWFkaW5nIHplcm9zXG4gICAgICAgICAgICAvL3JlbW92ZSBsZWFkaW5nIDBzXG4gICAgICAgICAgICB0cmltbWVkU3RyID0gKG5vdGF0aW9uWzFdIHx8IFwiXCIpICsgbm90YXRpb25bM107XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHRyaW1tZWRTdHIpO1xuICAgICAgICB9ZWxzZSByZXR1cm4gc3RyO1xuICAgIH1lbHNle1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7c3RyaW5nfSBudW1TdHIgd2l0aG91dCBsZWFkaW5nIHplcm9zXG4gKiBAcmV0dXJucyBcbiAqL1xuZnVuY3Rpb24gdHJpbVplcm9zKG51bVN0cil7XG4gICAgaWYobnVtU3RyICYmIG51bVN0ci5pbmRleE9mKFwiLlwiKSAhPT0gLTEpey8vZmxvYXRcbiAgICAgICAgbnVtU3RyID0gbnVtU3RyLnJlcGxhY2UoLzArJC8sIFwiXCIpOyAvL3JlbW92ZSBlbmRpbmcgemVyb3NcbiAgICAgICAgaWYobnVtU3RyID09PSBcIi5cIikgIG51bVN0ciA9IFwiMFwiO1xuICAgICAgICBlbHNlIGlmKG51bVN0clswXSA9PT0gXCIuXCIpICBudW1TdHIgPSBcIjBcIitudW1TdHI7XG4gICAgICAgIGVsc2UgaWYobnVtU3RyW251bVN0ci5sZW5ndGgtMV0gPT09IFwiLlwiKSAgbnVtU3RyID0gbnVtU3RyLnN1YnN0cmluZygwLG51bVN0ci5sZW5ndGgtMSk7XG4gICAgICAgIHJldHVybiBudW1TdHI7XG4gICAgfVxuICAgIHJldHVybiBudW1TdHI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlX2ludChudW1TdHIsIGJhc2Upe1xuICAgIC8vcG9seWZpbGxcbiAgICBpZihwYXJzZUludCkgcmV0dXJuIHBhcnNlSW50KG51bVN0ciwgYmFzZSk7XG4gICAgZWxzZSBpZihOdW1iZXIucGFyc2VJbnQpIHJldHVybiBOdW1iZXIucGFyc2VJbnQobnVtU3RyLCBiYXNlKTtcbiAgICBlbHNlIGlmKHdpbmRvdyAmJiB3aW5kb3cucGFyc2VJbnQpIHJldHVybiB3aW5kb3cucGFyc2VJbnQobnVtU3RyLCBiYXNlKTtcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcInBhcnNlSW50LCBOdW1iZXIucGFyc2VJbnQsIHdpbmRvdy5wYXJzZUludCBhcmUgbm90IHN1cHBvcnRlZFwiKVxufSIsICJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRJZ25vcmVBdHRyaWJ1dGVzRm4oaWdub3JlQXR0cmlidXRlcykge1xuICAgIGlmICh0eXBlb2YgaWdub3JlQXR0cmlidXRlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gaWdub3JlQXR0cmlidXRlc1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShpZ25vcmVBdHRyaWJ1dGVzKSkge1xuICAgICAgICByZXR1cm4gKGF0dHJOYW1lKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgaWdub3JlQXR0cmlidXRlcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycgJiYgYXR0ck5hbWUgPT09IHBhdHRlcm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBSZWdFeHAgJiYgcGF0dGVybi50ZXN0KGF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKCkgPT4gZmFsc2Vcbn0iLCAiJ3VzZSBzdHJpY3QnO1xuLy8vQHRzLWNoZWNrXG5cbmltcG9ydCB7Z2V0QWxsTWF0Y2hlcywgaXNFeGlzdH0gZnJvbSAnLi4vdXRpbC5qcyc7XG5pbXBvcnQgeG1sTm9kZSBmcm9tICcuL3htbE5vZGUuanMnO1xuaW1wb3J0IHJlYWREb2NUeXBlIGZyb20gJy4vRG9jVHlwZVJlYWRlci5qcyc7XG5pbXBvcnQgdG9OdW1iZXIgZnJvbSBcInN0cm51bVwiO1xuaW1wb3J0IGdldElnbm9yZUF0dHJpYnV0ZXNGbiBmcm9tIFwiLi4vaWdub3JlQXR0cmlidXRlcy5qc1wiO1xuXG4vLyBjb25zdCByZWd4ID1cbi8vICAgJzwoKCFcXFxcW0NEQVRBXFxcXFsoW1xcXFxzXFxcXFNdKj8pKF1dPikpfCgoTkFNRTopPyhOQU1FKSkoW14+XSopPnwoKFxcXFwvKShOQU1FKVxcXFxzKj4pKShbXjxdKiknXG4vLyAgIC5yZXBsYWNlKC9OQU1FL2csIHV0aWwubmFtZVJlZ2V4cCk7XG5cbi8vY29uc3QgdGFnc1JlZ3ggPSBuZXcgUmVnRXhwKFwiPChcXFxcLz9bXFxcXHc6XFxcXC1cXC5fXSspKFtePl0qKT4oXFxcXHMqXCIrY2RhdGFSZWd4K1wiKSooW148XSspP1wiLFwiZ1wiKTtcbi8vY29uc3QgdGFnc1JlZ3ggPSBuZXcgUmVnRXhwKFwiPChcXFxcLz8pKChcXFxcdyo6KT8oW1xcXFx3OlxcXFwtXFwuX10rKSkoW14+XSopPihbXjxdKikoXCIrY2RhdGFSZWd4K1wiKFtePF0qKSkqKFtePF0rKT9cIixcImdcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9yZGVyZWRPYmpQYXJzZXJ7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpe1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgdGhpcy50YWdzTm9kZVN0YWNrID0gW107XG4gICAgdGhpcy5kb2NUeXBlRW50aXRpZXMgPSB7fTtcbiAgICB0aGlzLmxhc3RFbnRpdGllcyA9IHtcbiAgICAgIFwiYXBvc1wiIDogeyByZWdleDogLyYoYXBvc3wjMzl8I3gyNyk7L2csIHZhbCA6IFwiJ1wifSxcbiAgICAgIFwiZ3RcIiA6IHsgcmVnZXg6IC8mKGd0fCM2MnwjeDNFKTsvZywgdmFsIDogXCI+XCJ9LFxuICAgICAgXCJsdFwiIDogeyByZWdleDogLyYobHR8IzYwfCN4M0MpOy9nLCB2YWwgOiBcIjxcIn0sXG4gICAgICBcInF1b3RcIiA6IHsgcmVnZXg6IC8mKHF1b3R8IzM0fCN4MjIpOy9nLCB2YWwgOiBcIlxcXCJcIn0sXG4gICAgfTtcbiAgICB0aGlzLmFtcEVudGl0eSA9IHsgcmVnZXg6IC8mKGFtcHwjMzh8I3gyNik7L2csIHZhbCA6IFwiJlwifTtcbiAgICB0aGlzLmh0bWxFbnRpdGllcyA9IHtcbiAgICAgIFwic3BhY2VcIjogeyByZWdleDogLyYobmJzcHwjMTYwKTsvZywgdmFsOiBcIiBcIiB9LFxuICAgICAgLy8gXCJsdFwiIDogeyByZWdleDogLyYobHR8IzYwKTsvZywgdmFsOiBcIjxcIiB9LFxuICAgICAgLy8gXCJndFwiIDogeyByZWdleDogLyYoZ3R8IzYyKTsvZywgdmFsOiBcIj5cIiB9LFxuICAgICAgLy8gXCJhbXBcIiA6IHsgcmVnZXg6IC8mKGFtcHwjMzgpOy9nLCB2YWw6IFwiJlwiIH0sXG4gICAgICAvLyBcInF1b3RcIiA6IHsgcmVnZXg6IC8mKHF1b3R8IzM0KTsvZywgdmFsOiBcIlxcXCJcIiB9LFxuICAgICAgLy8gXCJhcG9zXCIgOiB7IHJlZ2V4OiAvJihhcG9zfCMzOSk7L2csIHZhbDogXCInXCIgfSxcbiAgICAgIFwiY2VudFwiIDogeyByZWdleDogLyYoY2VudHwjMTYyKTsvZywgdmFsOiBcIlx1MDBBMlwiIH0sXG4gICAgICBcInBvdW5kXCIgOiB7IHJlZ2V4OiAvJihwb3VuZHwjMTYzKTsvZywgdmFsOiBcIlx1MDBBM1wiIH0sXG4gICAgICBcInllblwiIDogeyByZWdleDogLyYoeWVufCMxNjUpOy9nLCB2YWw6IFwiXHUwMEE1XCIgfSxcbiAgICAgIFwiZXVyb1wiIDogeyByZWdleDogLyYoZXVyb3wjODM2NCk7L2csIHZhbDogXCJcdTIwQUNcIiB9LFxuICAgICAgXCJjb3B5cmlnaHRcIiA6IHsgcmVnZXg6IC8mKGNvcHl8IzE2OSk7L2csIHZhbDogXCJcdTAwQTlcIiB9LFxuICAgICAgXCJyZWdcIiA6IHsgcmVnZXg6IC8mKHJlZ3wjMTc0KTsvZywgdmFsOiBcIlx1MDBBRVwiIH0sXG4gICAgICBcImluclwiIDogeyByZWdleDogLyYoaW5yfCM4Mzc3KTsvZywgdmFsOiBcIlx1MjBCOVwiIH0sXG4gICAgICBcIm51bV9kZWNcIjogeyByZWdleDogLyYjKFswLTldezEsN30pOy9nLCB2YWwgOiAoXywgc3RyKSA9PiBTdHJpbmcuZnJvbUNvZGVQb2ludChOdW1iZXIucGFyc2VJbnQoc3RyLCAxMCkpIH0sXG4gICAgICBcIm51bV9oZXhcIjogeyByZWdleDogLyYjeChbMC05YS1mQS1GXXsxLDZ9KTsvZywgdmFsIDogKF8sIHN0cikgPT4gU3RyaW5nLmZyb21Db2RlUG9pbnQoTnVtYmVyLnBhcnNlSW50KHN0ciwgMTYpKSB9LFxuICAgIH07XG4gICAgdGhpcy5hZGRFeHRlcm5hbEVudGl0aWVzID0gYWRkRXh0ZXJuYWxFbnRpdGllcztcbiAgICB0aGlzLnBhcnNlWG1sID0gcGFyc2VYbWw7XG4gICAgdGhpcy5wYXJzZVRleHREYXRhID0gcGFyc2VUZXh0RGF0YTtcbiAgICB0aGlzLnJlc29sdmVOYW1lU3BhY2UgPSByZXNvbHZlTmFtZVNwYWNlO1xuICAgIHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwID0gYnVpbGRBdHRyaWJ1dGVzTWFwO1xuICAgIHRoaXMuaXNJdFN0b3BOb2RlID0gaXNJdFN0b3BOb2RlO1xuICAgIHRoaXMucmVwbGFjZUVudGl0aWVzVmFsdWUgPSByZXBsYWNlRW50aXRpZXNWYWx1ZTtcbiAgICB0aGlzLnJlYWRTdG9wTm9kZURhdGEgPSByZWFkU3RvcE5vZGVEYXRhO1xuICAgIHRoaXMuc2F2ZVRleHRUb1BhcmVudFRhZyA9IHNhdmVUZXh0VG9QYXJlbnRUYWc7XG4gICAgdGhpcy5hZGRDaGlsZCA9IGFkZENoaWxkO1xuICAgIHRoaXMuaWdub3JlQXR0cmlidXRlc0ZuID0gZ2V0SWdub3JlQXR0cmlidXRlc0ZuKHRoaXMub3B0aW9ucy5pZ25vcmVBdHRyaWJ1dGVzKVxuICB9XG5cbn1cblxuZnVuY3Rpb24gYWRkRXh0ZXJuYWxFbnRpdGllcyhleHRlcm5hbEVudGl0aWVzKXtcbiAgY29uc3QgZW50S2V5cyA9IE9iamVjdC5rZXlzKGV4dGVybmFsRW50aXRpZXMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVudEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBlbnQgPSBlbnRLZXlzW2ldO1xuICAgIHRoaXMubGFzdEVudGl0aWVzW2VudF0gPSB7XG4gICAgICAgcmVnZXg6IG5ldyBSZWdFeHAoXCImXCIrZW50K1wiO1wiLFwiZ1wiKSxcbiAgICAgICB2YWwgOiBleHRlcm5hbEVudGl0aWVzW2VudF1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGpQYXRoXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGRvbnRUcmltXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGhhc0F0dHJpYnV0ZXNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNMZWFmTm9kZVxuICogQHBhcmFtIHtib29sZWFufSBlc2NhcGVFbnRpdGllc1xuICovXG5mdW5jdGlvbiBwYXJzZVRleHREYXRhKHZhbCwgdGFnTmFtZSwgalBhdGgsIGRvbnRUcmltLCBoYXNBdHRyaWJ1dGVzLCBpc0xlYWZOb2RlLCBlc2NhcGVFbnRpdGllcykge1xuICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRyaW1WYWx1ZXMgJiYgIWRvbnRUcmltKSB7XG4gICAgICB2YWwgPSB2YWwudHJpbSgpO1xuICAgIH1cbiAgICBpZih2YWwubGVuZ3RoID4gMCl7XG4gICAgICBpZighZXNjYXBlRW50aXRpZXMpIHZhbCA9IHRoaXMucmVwbGFjZUVudGl0aWVzVmFsdWUodmFsKTtcbiAgICAgIFxuICAgICAgY29uc3QgbmV3dmFsID0gdGhpcy5vcHRpb25zLnRhZ1ZhbHVlUHJvY2Vzc29yKHRhZ05hbWUsIHZhbCwgalBhdGgsIGhhc0F0dHJpYnV0ZXMsIGlzTGVhZk5vZGUpO1xuICAgICAgaWYobmV3dmFsID09PSBudWxsIHx8IG5ld3ZhbCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgLy9kb24ndCBwYXJzZVxuICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgfWVsc2UgaWYodHlwZW9mIG5ld3ZhbCAhPT0gdHlwZW9mIHZhbCB8fCBuZXd2YWwgIT09IHZhbCl7XG4gICAgICAgIC8vb3ZlcndyaXRlXG4gICAgICAgIHJldHVybiBuZXd2YWw7XG4gICAgICB9ZWxzZSBpZih0aGlzLm9wdGlvbnMudHJpbVZhbHVlcyl7XG4gICAgICAgIHJldHVybiBwYXJzZVZhbHVlKHZhbCwgdGhpcy5vcHRpb25zLnBhcnNlVGFnVmFsdWUsIHRoaXMub3B0aW9ucy5udW1iZXJQYXJzZU9wdGlvbnMpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbnN0IHRyaW1tZWRWYWwgPSB2YWwudHJpbSgpO1xuICAgICAgICBpZih0cmltbWVkVmFsID09PSB2YWwpe1xuICAgICAgICAgIHJldHVybiBwYXJzZVZhbHVlKHZhbCwgdGhpcy5vcHRpb25zLnBhcnNlVGFnVmFsdWUsIHRoaXMub3B0aW9ucy5udW1iZXJQYXJzZU9wdGlvbnMpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVOYW1lU3BhY2UodGFnbmFtZSkge1xuICBpZiAodGhpcy5vcHRpb25zLnJlbW92ZU5TUHJlZml4KSB7XG4gICAgY29uc3QgdGFncyA9IHRhZ25hbWUuc3BsaXQoJzonKTtcbiAgICBjb25zdCBwcmVmaXggPSB0YWduYW1lLmNoYXJBdCgwKSA9PT0gJy8nID8gJy8nIDogJyc7XG4gICAgaWYgKHRhZ3NbMF0gPT09ICd4bWxucycpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaWYgKHRhZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICB0YWduYW1lID0gcHJlZml4ICsgdGFnc1sxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhZ25hbWU7XG59XG5cbi8vVE9ETzogY2hhbmdlIHJlZ2V4IHRvIGNhcHR1cmUgTlNcbi8vY29uc3QgYXR0cnNSZWd4ID0gbmV3IFJlZ0V4cChcIihbXFxcXHdcXFxcLVxcXFwuXFxcXDpdKylcXFxccyo9XFxcXHMqKFsnXFxcIl0pKCgufFxcbikqPylcXFxcMlwiLFwiZ21cIik7XG5jb25zdCBhdHRyc1JlZ3ggPSBuZXcgUmVnRXhwKCcoW15cXFxccz1dKylcXFxccyooPVxcXFxzKihbXFwnXCJdKShbXFxcXHNcXFxcU10qPylcXFxcMyk/JywgJ2dtJyk7XG5cbmZ1bmN0aW9uIGJ1aWxkQXR0cmlidXRlc01hcChhdHRyU3RyLCBqUGF0aCwgdGFnTmFtZSkge1xuICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZUF0dHJpYnV0ZXMgIT09IHRydWUgJiYgdHlwZW9mIGF0dHJTdHIgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gYXR0clN0ciA9IGF0dHJTdHIucmVwbGFjZSgvXFxyP1xcbi9nLCAnICcpO1xuICAgIC8vYXR0clN0ciA9IGF0dHJTdHIgfHwgYXR0clN0ci50cmltKCk7XG5cbiAgICBjb25zdCBtYXRjaGVzID0gZ2V0QWxsTWF0Y2hlcyhhdHRyU3RyLCBhdHRyc1JlZ3gpO1xuICAgIGNvbnN0IGxlbiA9IG1hdGNoZXMubGVuZ3RoOyAvL2Rvbid0IG1ha2UgaXQgaW5saW5lXG4gICAgY29uc3QgYXR0cnMgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHRoaXMucmVzb2x2ZU5hbWVTcGFjZShtYXRjaGVzW2ldWzFdKTtcbiAgICAgIGlmICh0aGlzLmlnbm9yZUF0dHJpYnV0ZXNGbihhdHRyTmFtZSwgalBhdGgpKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBsZXQgb2xkVmFsID0gbWF0Y2hlc1tpXVs0XTtcbiAgICAgIGxldCBhTmFtZSA9IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVOYW1lUHJlZml4ICsgYXR0ck5hbWU7XG4gICAgICBpZiAoYXR0ck5hbWUubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJhbnNmb3JtQXR0cmlidXRlTmFtZSkge1xuICAgICAgICAgIGFOYW1lID0gdGhpcy5vcHRpb25zLnRyYW5zZm9ybUF0dHJpYnV0ZU5hbWUoYU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGFOYW1lID09PSBcIl9fcHJvdG9fX1wiKSBhTmFtZSAgPSBcIiNfX3Byb3RvX19cIjtcbiAgICAgICAgaWYgKG9sZFZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmltVmFsdWVzKSB7XG4gICAgICAgICAgICBvbGRWYWwgPSBvbGRWYWwudHJpbSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBvbGRWYWwgPSB0aGlzLnJlcGxhY2VFbnRpdGllc1ZhbHVlKG9sZFZhbCk7XG4gICAgICAgICAgY29uc3QgbmV3VmFsID0gdGhpcy5vcHRpb25zLmF0dHJpYnV0ZVZhbHVlUHJvY2Vzc29yKGF0dHJOYW1lLCBvbGRWYWwsIGpQYXRoKTtcbiAgICAgICAgICBpZihuZXdWYWwgPT09IG51bGwgfHwgbmV3VmFsID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgLy9kb24ndCBwYXJzZVxuICAgICAgICAgICAgYXR0cnNbYU5hbWVdID0gb2xkVmFsO1xuICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZiBuZXdWYWwgIT09IHR5cGVvZiBvbGRWYWwgfHwgbmV3VmFsICE9PSBvbGRWYWwpe1xuICAgICAgICAgICAgLy9vdmVyd3JpdGVcbiAgICAgICAgICAgIGF0dHJzW2FOYW1lXSA9IG5ld1ZhbDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vcGFyc2VcbiAgICAgICAgICAgIGF0dHJzW2FOYW1lXSA9IHBhcnNlVmFsdWUoXG4gICAgICAgICAgICAgIG9sZFZhbCxcbiAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBhcnNlQXR0cmlidXRlVmFsdWUsXG4gICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5udW1iZXJQYXJzZU9wdGlvbnNcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5hbGxvd0Jvb2xlYW5BdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgYXR0cnNbYU5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIU9iamVjdC5rZXlzKGF0dHJzKS5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVzR3JvdXBOYW1lKSB7XG4gICAgICBjb25zdCBhdHRyQ29sbGVjdGlvbiA9IHt9O1xuICAgICAgYXR0ckNvbGxlY3Rpb25bdGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNHcm91cE5hbWVdID0gYXR0cnM7XG4gICAgICByZXR1cm4gYXR0ckNvbGxlY3Rpb247XG4gICAgfVxuICAgIHJldHVybiBhdHRyc1xuICB9XG59XG5cbmNvbnN0IHBhcnNlWG1sID0gZnVuY3Rpb24oeG1sRGF0YSkge1xuICB4bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpOyAvL1RPRE86IHJlbW92ZSB0aGlzIGxpbmVcbiAgY29uc3QgeG1sT2JqID0gbmV3IHhtbE5vZGUoJyF4bWwnKTtcbiAgbGV0IGN1cnJlbnROb2RlID0geG1sT2JqO1xuICBsZXQgdGV4dERhdGEgPSBcIlwiO1xuICBsZXQgalBhdGggPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTwgeG1sRGF0YS5sZW5ndGg7IGkrKyl7Ly9mb3IgZWFjaCBjaGFyIGluIFhNTCBkYXRhXG4gICAgY29uc3QgY2ggPSB4bWxEYXRhW2ldO1xuICAgIGlmKGNoID09PSAnPCcpe1xuICAgICAgLy8gY29uc3QgbmV4dEluZGV4ID0gaSsxO1xuICAgICAgLy8gY29uc3QgXzJuZENoYXIgPSB4bWxEYXRhW25leHRJbmRleF07XG4gICAgICBpZiggeG1sRGF0YVtpKzFdID09PSAnLycpIHsvL0Nsb3NpbmcgVGFnXG4gICAgICAgIGNvbnN0IGNsb3NlSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiPlwiLCBpLCBcIkNsb3NpbmcgVGFnIGlzIG5vdCBjbG9zZWQuXCIpXG4gICAgICAgIGxldCB0YWdOYW1lID0geG1sRGF0YS5zdWJzdHJpbmcoaSsyLGNsb3NlSW5kZXgpLnRyaW0oKTtcblxuICAgICAgICBpZih0aGlzLm9wdGlvbnMucmVtb3ZlTlNQcmVmaXgpe1xuICAgICAgICAgIGNvbnN0IGNvbG9uSW5kZXggPSB0YWdOYW1lLmluZGV4T2YoXCI6XCIpO1xuICAgICAgICAgIGlmKGNvbG9uSW5kZXggIT09IC0xKXtcbiAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cihjb2xvbkluZGV4KzEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKSB7XG4gICAgICAgICAgdGFnTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKHRhZ05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoY3VycmVudE5vZGUpe1xuICAgICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayBpZiBsYXN0IHRhZyBvZiBuZXN0ZWQgdGFnIHdhcyB1bnBhaXJlZCB0YWdcbiAgICAgICAgY29uc3QgbGFzdFRhZ05hbWUgPSBqUGF0aC5zdWJzdHJpbmcoalBhdGgubGFzdEluZGV4T2YoXCIuXCIpKzEpO1xuICAgICAgICBpZih0YWdOYW1lICYmIHRoaXMub3B0aW9ucy51bnBhaXJlZFRhZ3MuaW5kZXhPZih0YWdOYW1lKSAhPT0gLTEgKXtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucGFpcmVkIHRhZyBjYW4gbm90IGJlIHVzZWQgYXMgY2xvc2luZyB0YWc6IDwvJHt0YWdOYW1lfT5gKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcHJvcEluZGV4ID0gMFxuICAgICAgICBpZihsYXN0VGFnTmFtZSAmJiB0aGlzLm9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2YobGFzdFRhZ05hbWUpICE9PSAtMSApe1xuICAgICAgICAgIHByb3BJbmRleCA9IGpQYXRoLmxhc3RJbmRleE9mKCcuJywgalBhdGgubGFzdEluZGV4T2YoJy4nKS0xKVxuICAgICAgICAgIHRoaXMudGFnc05vZGVTdGFjay5wb3AoKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcHJvcEluZGV4ID0galBhdGgubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGpQYXRoID0galBhdGguc3Vic3RyaW5nKDAsIHByb3BJbmRleCk7XG5cbiAgICAgICAgY3VycmVudE5vZGUgPSB0aGlzLnRhZ3NOb2RlU3RhY2sucG9wKCk7Ly9hdm9pZCByZWN1cnNpb24sIHNldCB0aGUgcGFyZW50IHRhZyBzY29wZVxuICAgICAgICB0ZXh0RGF0YSA9IFwiXCI7XG4gICAgICAgIGkgPSBjbG9zZUluZGV4O1xuICAgICAgfSBlbHNlIGlmKCB4bWxEYXRhW2krMV0gPT09ICc/Jykge1xuXG4gICAgICAgIGxldCB0YWdEYXRhID0gcmVhZFRhZ0V4cCh4bWxEYXRhLGksIGZhbHNlLCBcIj8+XCIpO1xuICAgICAgICBpZighdGFnRGF0YSkgdGhyb3cgbmV3IEVycm9yKFwiUGkgVGFnIGlzIG5vdCBjbG9zZWQuXCIpO1xuXG4gICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgpO1xuICAgICAgICBpZiggKHRoaXMub3B0aW9ucy5pZ25vcmVEZWNsYXJhdGlvbiAmJiB0YWdEYXRhLnRhZ05hbWUgPT09IFwiP3htbFwiKSB8fCB0aGlzLm9wdGlvbnMuaWdub3JlUGlUYWdzKXtcblxuICAgICAgICB9ZWxzZXtcbiAgXG4gICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gbmV3IHhtbE5vZGUodGFnRGF0YS50YWdOYW1lKTtcbiAgICAgICAgICBjaGlsZE5vZGUuYWRkKHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUsIFwiXCIpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmKHRhZ0RhdGEudGFnTmFtZSAhPT0gdGFnRGF0YS50YWdFeHAgJiYgdGFnRGF0YS5hdHRyRXhwUHJlc2VudCl7XG4gICAgICAgICAgICBjaGlsZE5vZGVbXCI6QFwiXSA9IHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwKHRhZ0RhdGEudGFnRXhwLCBqUGF0aCwgdGFnRGF0YS50YWdOYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hZGRDaGlsZChjdXJyZW50Tm9kZSwgY2hpbGROb2RlLCBqUGF0aCwgaSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGkgPSB0YWdEYXRhLmNsb3NlSW5kZXggKyAxO1xuICAgICAgfSBlbHNlIGlmKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAzKSA9PT0gJyEtLScpIHtcbiAgICAgICAgY29uc3QgZW5kSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiLS0+XCIsIGkrNCwgXCJDb21tZW50IGlzIG5vdCBjbG9zZWQuXCIpXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWUpe1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnQgPSB4bWxEYXRhLnN1YnN0cmluZyhpICsgNCwgZW5kSW5kZXggLSAyKTtcblxuICAgICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgpO1xuXG4gICAgICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWUsIFsgeyBbdGhpcy5vcHRpb25zLnRleHROb2RlTmFtZV0gOiBjb21tZW50IH0gXSk7XG4gICAgICAgIH1cbiAgICAgICAgaSA9IGVuZEluZGV4O1xuICAgICAgfSBlbHNlIGlmKCB4bWxEYXRhLnN1YnN0cihpICsgMSwgMikgPT09ICchRCcpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZERvY1R5cGUoeG1sRGF0YSwgaSk7XG4gICAgICAgIHRoaXMuZG9jVHlwZUVudGl0aWVzID0gcmVzdWx0LmVudGl0aWVzO1xuICAgICAgICBpID0gcmVzdWx0Lmk7XG4gICAgICB9ZWxzZSBpZih4bWxEYXRhLnN1YnN0cihpICsgMSwgMikgPT09ICchWycpIHtcbiAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCJdXT5cIiwgaSwgXCJDREFUQSBpcyBub3QgY2xvc2VkLlwiKSAtIDI7XG4gICAgICAgIGNvbnN0IHRhZ0V4cCA9IHhtbERhdGEuc3Vic3RyaW5nKGkgKyA5LGNsb3NlSW5kZXgpO1xuXG4gICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgpO1xuXG4gICAgICAgIGxldCB2YWwgPSB0aGlzLnBhcnNlVGV4dERhdGEodGFnRXhwLCBjdXJyZW50Tm9kZS50YWduYW1lLCBqUGF0aCwgdHJ1ZSwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICBpZih2YWwgPT0gdW5kZWZpbmVkKSB2YWwgPSBcIlwiO1xuXG4gICAgICAgIC8vY2RhdGEgc2hvdWxkIGJlIHNldCBldmVuIGlmIGl0IGlzIDAgbGVuZ3RoIHN0cmluZ1xuICAgICAgICBpZih0aGlzLm9wdGlvbnMuY2RhdGFQcm9wTmFtZSl7XG4gICAgICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy5jZGF0YVByb3BOYW1lLCBbIHsgW3RoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWVdIDogdGFnRXhwIH0gXSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGN1cnJlbnROb2RlLmFkZCh0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lLCB2YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpID0gY2xvc2VJbmRleCArIDI7XG4gICAgICB9ZWxzZSB7Ly9PcGVuaW5nIHRhZ1xuICAgICAgICBsZXQgcmVzdWx0ID0gcmVhZFRhZ0V4cCh4bWxEYXRhLGksIHRoaXMub3B0aW9ucy5yZW1vdmVOU1ByZWZpeCk7XG4gICAgICAgIGxldCB0YWdOYW1lPSByZXN1bHQudGFnTmFtZTtcbiAgICAgICAgY29uc3QgcmF3VGFnTmFtZSA9IHJlc3VsdC5yYXdUYWdOYW1lO1xuICAgICAgICBsZXQgdGFnRXhwID0gcmVzdWx0LnRhZ0V4cDtcbiAgICAgICAgbGV0IGF0dHJFeHBQcmVzZW50ID0gcmVzdWx0LmF0dHJFeHBQcmVzZW50O1xuICAgICAgICBsZXQgY2xvc2VJbmRleCA9IHJlc3VsdC5jbG9zZUluZGV4O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJhbnNmb3JtVGFnTmFtZSkge1xuICAgICAgICAgIHRhZ05hbWUgPSB0aGlzLm9wdGlvbnMudHJhbnNmb3JtVGFnTmFtZSh0YWdOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy9zYXZlIHRleHQgYXMgY2hpbGQgbm9kZVxuICAgICAgICBpZiAoY3VycmVudE5vZGUgJiYgdGV4dERhdGEpIHtcbiAgICAgICAgICBpZihjdXJyZW50Tm9kZS50YWduYW1lICE9PSAnIXhtbCcpe1xuICAgICAgICAgICAgLy93aGVuIG5lc3RlZCB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGxhc3QgdGFnIHdhcyB1bnBhaXJlZCB0YWdcbiAgICAgICAgY29uc3QgbGFzdFRhZyA9IGN1cnJlbnROb2RlO1xuICAgICAgICBpZihsYXN0VGFnICYmIHRoaXMub3B0aW9ucy51bnBhaXJlZFRhZ3MuaW5kZXhPZihsYXN0VGFnLnRhZ25hbWUpICE9PSAtMSApe1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gdGhpcy50YWdzTm9kZVN0YWNrLnBvcCgpO1xuICAgICAgICAgIGpQYXRoID0galBhdGguc3Vic3RyaW5nKDAsIGpQYXRoLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGFnTmFtZSAhPT0geG1sT2JqLnRhZ25hbWUpe1xuICAgICAgICAgIGpQYXRoICs9IGpQYXRoID8gXCIuXCIgKyB0YWdOYW1lIDogdGFnTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFydEluZGV4ID0gaTtcbiAgICAgICAgaWYgKHRoaXMuaXNJdFN0b3BOb2RlKHRoaXMub3B0aW9ucy5zdG9wTm9kZXMsIGpQYXRoLCB0YWdOYW1lKSkge1xuICAgICAgICAgIGxldCB0YWdDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAvL3NlbGYtY2xvc2luZyB0YWdcbiAgICAgICAgICBpZih0YWdFeHAubGVuZ3RoID4gMCAmJiB0YWdFeHAubGFzdEluZGV4T2YoXCIvXCIpID09PSB0YWdFeHAubGVuZ3RoIC0gMSl7XG4gICAgICAgICAgICBpZih0YWdOYW1lW3RhZ05hbWUubGVuZ3RoIC0gMV0gPT09IFwiL1wiKXsgLy9yZW1vdmUgdHJhaWxpbmcgJy8nXG4gICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cigwLCB0YWdOYW1lLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cigwLCBqUGF0aC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgdGFnRXhwID0gdGFnTmFtZTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICB0YWdFeHAgPSB0YWdFeHAuc3Vic3RyKDAsIHRhZ0V4cC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSByZXN1bHQuY2xvc2VJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy91bnBhaXJlZCB0YWdcbiAgICAgICAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy51bnBhaXJlZFRhZ3MuaW5kZXhPZih0YWdOYW1lKSAhPT0gLTEpe1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpID0gcmVzdWx0LmNsb3NlSW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vbm9ybWFsIHRhZ1xuICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAvL3JlYWQgdW50aWwgY2xvc2luZyB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZFN0b3BOb2RlRGF0YSh4bWxEYXRhLCByYXdUYWdOYW1lLCBjbG9zZUluZGV4ICsgMSk7XG4gICAgICAgICAgICBpZighcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mICR7cmF3VGFnTmFtZX1gKTtcbiAgICAgICAgICAgIGkgPSByZXN1bHQuaTtcbiAgICAgICAgICAgIHRhZ0NvbnRlbnQgPSByZXN1bHQudGFnQ29udGVudDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdOYW1lKTtcblxuICAgICAgICAgIGlmKHRhZ05hbWUgIT09IHRhZ0V4cCAmJiBhdHRyRXhwUHJlc2VudCl7XG4gICAgICAgICAgICBjaGlsZE5vZGVbXCI6QFwiXSA9IHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwKHRhZ0V4cCwgalBhdGgsIHRhZ05hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZih0YWdDb250ZW50KSB7XG4gICAgICAgICAgICB0YWdDb250ZW50ID0gdGhpcy5wYXJzZVRleHREYXRhKHRhZ0NvbnRlbnQsIHRhZ05hbWUsIGpQYXRoLCB0cnVlLCBhdHRyRXhwUHJlc2VudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGpQYXRoID0galBhdGguc3Vic3RyKDAsIGpQYXRoLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgICAgY2hpbGROb2RlLmFkZCh0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lLCB0YWdDb250ZW50KTtcbiAgICAgICAgICBcbiAgICAgICAgICB0aGlzLmFkZENoaWxkKGN1cnJlbnROb2RlLCBjaGlsZE5vZGUsIGpQYXRoLCBzdGFydEluZGV4KTtcbiAgICAgICAgfWVsc2V7XG4gIC8vc2VsZkNsb3NpbmcgdGFnXG4gICAgICAgICAgaWYodGFnRXhwLmxlbmd0aCA+IDAgJiYgdGFnRXhwLmxhc3RJbmRleE9mKFwiL1wiKSA9PT0gdGFnRXhwLmxlbmd0aCAtIDEpe1xuICAgICAgICAgICAgaWYodGFnTmFtZVt0YWdOYW1lLmxlbmd0aCAtIDFdID09PSBcIi9cIil7IC8vcmVtb3ZlIHRyYWlsaW5nICcvJ1xuICAgICAgICAgICAgICB0YWdOYW1lID0gdGFnTmFtZS5zdWJzdHIoMCwgdGFnTmFtZS5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHIoMCwgalBhdGgubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgIHRhZ0V4cCA9IHRhZ05hbWU7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgdGFnRXhwID0gdGFnRXhwLnN1YnN0cigwLCB0YWdFeHAubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKSB7XG4gICAgICAgICAgICAgIHRhZ05hbWUgPSB0aGlzLm9wdGlvbnMudHJhbnNmb3JtVGFnTmFtZSh0YWdOYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gbmV3IHhtbE5vZGUodGFnTmFtZSk7XG4gICAgICAgICAgICBpZih0YWdOYW1lICE9PSB0YWdFeHAgJiYgYXR0ckV4cFByZXNlbnQpe1xuICAgICAgICAgICAgICBjaGlsZE5vZGVbXCI6QFwiXSA9IHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwKHRhZ0V4cCwgalBhdGgsIHRhZ05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChjdXJyZW50Tm9kZSwgY2hpbGROb2RlLCBqUGF0aCwgc3RhcnRJbmRleCk7XG4gICAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cigwLCBqUGF0aC5sYXN0SW5kZXhPZihcIi5cIikpO1xuICAgICAgICAgIH1cbiAgICAvL29wZW5pbmcgdGFnXG4gICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IG5ldyB4bWxOb2RlKCB0YWdOYW1lKTtcbiAgICAgICAgICAgIHRoaXMudGFnc05vZGVTdGFjay5wdXNoKGN1cnJlbnROb2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYodGFnTmFtZSAhPT0gdGFnRXhwICYmIGF0dHJFeHBQcmVzZW50KXtcbiAgICAgICAgICAgICAgY2hpbGROb2RlW1wiOkBcIl0gPSB0aGlzLmJ1aWxkQXR0cmlidXRlc01hcCh0YWdFeHAsIGpQYXRoLCB0YWdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgY3VycmVudE5vZGUgPSBjaGlsZE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRleHREYXRhID0gXCJcIjtcbiAgICAgICAgICBpID0gY2xvc2VJbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgdGV4dERhdGEgKz0geG1sRGF0YVtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHhtbE9iai5jaGlsZDtcbn1cblxuZnVuY3Rpb24gYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpe1xuICAvLyB1bnNldCBzdGFydEluZGV4IGlmIG5vdCByZXF1ZXN0ZWRcbiAgaWYgKCF0aGlzLm9wdGlvbnMuY2FwdHVyZU1ldGFEYXRhKSBzdGFydEluZGV4ID0gdW5kZWZpbmVkO1xuICBjb25zdCByZXN1bHQgPSB0aGlzLm9wdGlvbnMudXBkYXRlVGFnKGNoaWxkTm9kZS50YWduYW1lLCBqUGF0aCwgY2hpbGROb2RlW1wiOkBcIl0pXG4gIGlmKHJlc3VsdCA9PT0gZmFsc2Upe1xuICB9IGVsc2UgaWYodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIil7XG4gICAgY2hpbGROb2RlLnRhZ25hbWUgPSByZXN1bHRcbiAgICBjdXJyZW50Tm9kZS5hZGRDaGlsZChjaGlsZE5vZGUsIHN0YXJ0SW5kZXgpO1xuICB9ZWxzZXtcbiAgICBjdXJyZW50Tm9kZS5hZGRDaGlsZChjaGlsZE5vZGUsIHN0YXJ0SW5kZXgpO1xuICB9XG59XG5cbmNvbnN0IHJlcGxhY2VFbnRpdGllc1ZhbHVlID0gZnVuY3Rpb24odmFsKXtcblxuICBpZih0aGlzLm9wdGlvbnMucHJvY2Vzc0VudGl0aWVzKXtcbiAgICBmb3IobGV0IGVudGl0eU5hbWUgaW4gdGhpcy5kb2NUeXBlRW50aXRpZXMpe1xuICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5kb2NUeXBlRW50aXRpZXNbZW50aXR5TmFtZV07XG4gICAgICB2YWwgPSB2YWwucmVwbGFjZSggZW50aXR5LnJlZ3gsIGVudGl0eS52YWwpO1xuICAgIH1cbiAgICBmb3IobGV0IGVudGl0eU5hbWUgaW4gdGhpcy5sYXN0RW50aXRpZXMpe1xuICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5sYXN0RW50aXRpZXNbZW50aXR5TmFtZV07XG4gICAgICB2YWwgPSB2YWwucmVwbGFjZSggZW50aXR5LnJlZ2V4LCBlbnRpdHkudmFsKTtcbiAgICB9XG4gICAgaWYodGhpcy5vcHRpb25zLmh0bWxFbnRpdGllcyl7XG4gICAgICBmb3IobGV0IGVudGl0eU5hbWUgaW4gdGhpcy5odG1sRW50aXRpZXMpe1xuICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmh0bWxFbnRpdGllc1tlbnRpdHlOYW1lXTtcbiAgICAgICAgdmFsID0gdmFsLnJlcGxhY2UoIGVudGl0eS5yZWdleCwgZW50aXR5LnZhbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhbCA9IHZhbC5yZXBsYWNlKCB0aGlzLmFtcEVudGl0eS5yZWdleCwgdGhpcy5hbXBFbnRpdHkudmFsKTtcbiAgfVxuICByZXR1cm4gdmFsO1xufVxuZnVuY3Rpb24gc2F2ZVRleHRUb1BhcmVudFRhZyh0ZXh0RGF0YSwgY3VycmVudE5vZGUsIGpQYXRoLCBpc0xlYWZOb2RlKSB7XG4gIGlmICh0ZXh0RGF0YSkgeyAvL3N0b3JlIHByZXZpb3VzbHkgY29sbGVjdGVkIGRhdGEgYXMgdGV4dE5vZGVcbiAgICBpZihpc0xlYWZOb2RlID09PSB1bmRlZmluZWQpIGlzTGVhZk5vZGUgPSBjdXJyZW50Tm9kZS5jaGlsZC5sZW5ndGggPT09IDBcbiAgICBcbiAgICB0ZXh0RGF0YSA9IHRoaXMucGFyc2VUZXh0RGF0YSh0ZXh0RGF0YSxcbiAgICAgIGN1cnJlbnROb2RlLnRhZ25hbWUsXG4gICAgICBqUGF0aCxcbiAgICAgIGZhbHNlLFxuICAgICAgY3VycmVudE5vZGVbXCI6QFwiXSA/IE9iamVjdC5rZXlzKGN1cnJlbnROb2RlW1wiOkBcIl0pLmxlbmd0aCAhPT0gMCA6IGZhbHNlLFxuICAgICAgaXNMZWFmTm9kZSk7XG5cbiAgICBpZiAodGV4dERhdGEgIT09IHVuZGVmaW5lZCAmJiB0ZXh0RGF0YSAhPT0gXCJcIilcbiAgICAgIGN1cnJlbnROb2RlLmFkZCh0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lLCB0ZXh0RGF0YSk7XG4gICAgdGV4dERhdGEgPSBcIlwiO1xuICB9XG4gIHJldHVybiB0ZXh0RGF0YTtcbn1cblxuLy9UT0RPOiB1c2UgalBhdGggdG8gc2ltcGxpZnkgdGhlIGxvZ2ljXG4vKipcbiAqIFxuICogQHBhcmFtIHtzdHJpbmdbXX0gc3RvcE5vZGVzIFxuICogQHBhcmFtIHtzdHJpbmd9IGpQYXRoXG4gKiBAcGFyYW0ge3N0cmluZ30gY3VycmVudFRhZ05hbWUgXG4gKi9cbmZ1bmN0aW9uIGlzSXRTdG9wTm9kZShzdG9wTm9kZXMsIGpQYXRoLCBjdXJyZW50VGFnTmFtZSl7XG4gIGNvbnN0IGFsbE5vZGVzRXhwID0gXCIqLlwiICsgY3VycmVudFRhZ05hbWU7XG4gIGZvciAoY29uc3Qgc3RvcE5vZGVQYXRoIGluIHN0b3BOb2Rlcykge1xuICAgIGNvbnN0IHN0b3BOb2RlRXhwID0gc3RvcE5vZGVzW3N0b3BOb2RlUGF0aF07XG4gICAgaWYoIGFsbE5vZGVzRXhwID09PSBzdG9wTm9kZUV4cCB8fCBqUGF0aCA9PT0gc3RvcE5vZGVFeHAgICkgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHRhZyBFeHByZXNzaW9uIGFuZCB3aGVyZSBpdCBpcyBlbmRpbmcgaGFuZGxpbmcgc2luZ2xlLWRvdWJsZSBxdW90ZXMgc2l0dWF0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30geG1sRGF0YSBcbiAqIEBwYXJhbSB7bnVtYmVyfSBpIHN0YXJ0aW5nIGluZGV4XG4gKiBAcmV0dXJucyBcbiAqL1xuZnVuY3Rpb24gdGFnRXhwV2l0aENsb3NpbmdJbmRleCh4bWxEYXRhLCBpLCBjbG9zaW5nQ2hhciA9IFwiPlwiKXtcbiAgbGV0IGF0dHJCb3VuZGFyeTtcbiAgbGV0IHRhZ0V4cCA9IFwiXCI7XG4gIGZvciAobGV0IGluZGV4ID0gaTsgaW5kZXggPCB4bWxEYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGxldCBjaCA9IHhtbERhdGFbaW5kZXhdO1xuICAgIGlmIChhdHRyQm91bmRhcnkpIHtcbiAgICAgICAgaWYgKGNoID09PSBhdHRyQm91bmRhcnkpIGF0dHJCb3VuZGFyeSA9IFwiXCI7Ly9yZXNldFxuICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcIicgfHwgY2ggPT09IFwiJ1wiKSB7XG4gICAgICAgIGF0dHJCb3VuZGFyeSA9IGNoO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IGNsb3NpbmdDaGFyWzBdKSB7XG4gICAgICBpZihjbG9zaW5nQ2hhclsxXSl7XG4gICAgICAgIGlmKHhtbERhdGFbaW5kZXggKyAxXSA9PT0gY2xvc2luZ0NoYXJbMV0pe1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiB0YWdFeHAsXG4gICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRhdGE6IHRhZ0V4cCxcbiAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXHQnKSB7XG4gICAgICBjaCA9IFwiIFwiXG4gICAgfVxuICAgIHRhZ0V4cCArPSBjaDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIHN0ciwgaSwgZXJyTXNnKXtcbiAgY29uc3QgY2xvc2luZ0luZGV4ID0geG1sRGF0YS5pbmRleE9mKHN0ciwgaSk7XG4gIGlmKGNsb3NpbmdJbmRleCA9PT0gLTEpe1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpXG4gIH1lbHNle1xuICAgIHJldHVybiBjbG9zaW5nSW5kZXggKyBzdHIubGVuZ3RoIC0gMTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkVGFnRXhwKHhtbERhdGEsaSwgcmVtb3ZlTlNQcmVmaXgsIGNsb3NpbmdDaGFyID0gXCI+XCIpe1xuICBjb25zdCByZXN1bHQgPSB0YWdFeHBXaXRoQ2xvc2luZ0luZGV4KHhtbERhdGEsIGkrMSwgY2xvc2luZ0NoYXIpO1xuICBpZighcmVzdWx0KSByZXR1cm47XG4gIGxldCB0YWdFeHAgPSByZXN1bHQuZGF0YTtcbiAgY29uc3QgY2xvc2VJbmRleCA9IHJlc3VsdC5pbmRleDtcbiAgY29uc3Qgc2VwYXJhdG9ySW5kZXggPSB0YWdFeHAuc2VhcmNoKC9cXHMvKTtcbiAgbGV0IHRhZ05hbWUgPSB0YWdFeHA7XG4gIGxldCBhdHRyRXhwUHJlc2VudCA9IHRydWU7XG4gIGlmKHNlcGFyYXRvckluZGV4ICE9PSAtMSl7Ly9zZXBhcmF0ZSB0YWcgbmFtZSBhbmQgYXR0cmlidXRlcyBleHByZXNzaW9uXG4gICAgdGFnTmFtZSA9IHRhZ0V4cC5zdWJzdHJpbmcoMCwgc2VwYXJhdG9ySW5kZXgpO1xuICAgIHRhZ0V4cCA9IHRhZ0V4cC5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAxKS50cmltU3RhcnQoKTtcbiAgfVxuXG4gIGNvbnN0IHJhd1RhZ05hbWUgPSB0YWdOYW1lO1xuICBpZihyZW1vdmVOU1ByZWZpeCl7XG4gICAgY29uc3QgY29sb25JbmRleCA9IHRhZ05hbWUuaW5kZXhPZihcIjpcIik7XG4gICAgaWYoY29sb25JbmRleCAhPT0gLTEpe1xuICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc3Vic3RyKGNvbG9uSW5kZXgrMSk7XG4gICAgICBhdHRyRXhwUHJlc2VudCA9IHRhZ05hbWUgIT09IHJlc3VsdC5kYXRhLnN1YnN0cihjb2xvbkluZGV4ICsgMSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIHRhZ0V4cDogdGFnRXhwLFxuICAgIGNsb3NlSW5kZXg6IGNsb3NlSW5kZXgsXG4gICAgYXR0ckV4cFByZXNlbnQ6IGF0dHJFeHBQcmVzZW50LFxuICAgIHJhd1RhZ05hbWU6IHJhd1RhZ05hbWUsXG4gIH1cbn1cbi8qKlxuICogZmluZCBwYWlyZWQgdGFnIGZvciBhIHN0b3Agbm9kZVxuICogQHBhcmFtIHtzdHJpbmd9IHhtbERhdGEgXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBcbiAqIEBwYXJhbSB7bnVtYmVyfSBpIFxuICovXG5mdW5jdGlvbiByZWFkU3RvcE5vZGVEYXRhKHhtbERhdGEsIHRhZ05hbWUsIGkpe1xuICBjb25zdCBzdGFydEluZGV4ID0gaTtcbiAgLy8gU3RhcnRpbmcgYXQgMSBzaW5jZSB3ZSBhbHJlYWR5IGhhdmUgYW4gb3BlbiB0YWdcbiAgbGV0IG9wZW5UYWdDb3VudCA9IDE7XG5cbiAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYoIHhtbERhdGFbaV0gPT09IFwiPFwiKXsgXG4gICAgICBpZiAoeG1sRGF0YVtpKzFdID09PSBcIi9cIikgey8vY2xvc2UgdGFnXG4gICAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCI+XCIsIGksIGAke3RhZ05hbWV9IGlzIG5vdCBjbG9zZWRgKTtcbiAgICAgICAgICBsZXQgY2xvc2VUYWdOYW1lID0geG1sRGF0YS5zdWJzdHJpbmcoaSsyLGNsb3NlSW5kZXgpLnRyaW0oKTtcbiAgICAgICAgICBpZihjbG9zZVRhZ05hbWUgPT09IHRhZ05hbWUpe1xuICAgICAgICAgICAgb3BlblRhZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAob3BlblRhZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGFnQ29udGVudDogeG1sRGF0YS5zdWJzdHJpbmcoc3RhcnRJbmRleCwgaSksXG4gICAgICAgICAgICAgICAgaSA6IGNsb3NlSW5kZXhcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpPWNsb3NlSW5kZXg7XG4gICAgICAgIH0gZWxzZSBpZih4bWxEYXRhW2krMV0gPT09ICc/JykgeyBcbiAgICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIj8+XCIsIGkrMSwgXCJTdG9wTm9kZSBpcyBub3QgY2xvc2VkLlwiKVxuICAgICAgICAgIGk9Y2xvc2VJbmRleDtcbiAgICAgICAgfSBlbHNlIGlmKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAzKSA9PT0gJyEtLScpIHsgXG4gICAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCItLT5cIiwgaSszLCBcIlN0b3BOb2RlIGlzIG5vdCBjbG9zZWQuXCIpXG4gICAgICAgICAgaT1jbG9zZUluZGV4O1xuICAgICAgICB9IGVsc2UgaWYoeG1sRGF0YS5zdWJzdHIoaSArIDEsIDIpID09PSAnIVsnKSB7IFxuICAgICAgICAgIGNvbnN0IGNsb3NlSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiXV0+XCIsIGksIFwiU3RvcE5vZGUgaXMgbm90IGNsb3NlZC5cIikgLSAyO1xuICAgICAgICAgIGk9Y2xvc2VJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB0YWdEYXRhID0gcmVhZFRhZ0V4cCh4bWxEYXRhLCBpLCAnPicpXG5cbiAgICAgICAgICBpZiAodGFnRGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3BlblRhZ05hbWUgPSB0YWdEYXRhICYmIHRhZ0RhdGEudGFnTmFtZTtcbiAgICAgICAgICAgIGlmIChvcGVuVGFnTmFtZSA9PT0gdGFnTmFtZSAmJiB0YWdEYXRhLnRhZ0V4cFt0YWdEYXRhLnRhZ0V4cC5sZW5ndGgtMV0gIT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgIG9wZW5UYWdDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaT10YWdEYXRhLmNsb3NlSW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gIH0vL2VuZCBmb3IgbG9vcFxufVxuXG5mdW5jdGlvbiBwYXJzZVZhbHVlKHZhbCwgc2hvdWxkUGFyc2UsIG9wdGlvbnMpIHtcbiAgaWYgKHNob3VsZFBhcnNlICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgLy9jb25zb2xlLmxvZyhvcHRpb25zKVxuICAgIGNvbnN0IG5ld3ZhbCA9IHZhbC50cmltKCk7XG4gICAgaWYobmV3dmFsID09PSAndHJ1ZScgKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIGlmKG5ld3ZhbCA9PT0gJ2ZhbHNlJyApIHJldHVybiBmYWxzZTtcbiAgICBlbHNlIHJldHVybiB0b051bWJlcih2YWwsIG9wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc0V4aXN0KHZhbCkpIHtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cbn1cbiIsICIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBYbWxOb2RlIGZyb20gJy4veG1sTm9kZS5qcyc7XG5cbmNvbnN0IE1FVEFEQVRBX1NZTUJPTCA9IFhtbE5vZGUuZ2V0TWV0YURhdGFTeW1ib2woKTtcblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7YXJyYXl9IG5vZGUgXG4gKiBAcGFyYW0ge2FueX0gb3B0aW9ucyBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwcmV0dGlmeShub2RlLCBvcHRpb25zKXtcbiAgcmV0dXJuIGNvbXByZXNzKCBub2RlLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7YXJyYXl9IGFyciBcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFxuICogQHBhcmFtIHtzdHJpbmd9IGpQYXRoIFxuICogQHJldHVybnMgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGNvbXByZXNzKGFyciwgb3B0aW9ucywgalBhdGgpe1xuICBsZXQgdGV4dDtcbiAgY29uc3QgY29tcHJlc3NlZE9iaiA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHRhZ09iaiA9IGFycltpXTtcbiAgICBjb25zdCBwcm9wZXJ0eSA9IHByb3BOYW1lKHRhZ09iaik7XG4gICAgbGV0IG5ld0pwYXRoID0gXCJcIjtcbiAgICBpZihqUGF0aCA9PT0gdW5kZWZpbmVkKSBuZXdKcGF0aCA9IHByb3BlcnR5O1xuICAgIGVsc2UgbmV3SnBhdGggPSBqUGF0aCArIFwiLlwiICsgcHJvcGVydHk7XG5cbiAgICBpZihwcm9wZXJ0eSA9PT0gb3B0aW9ucy50ZXh0Tm9kZU5hbWUpe1xuICAgICAgaWYodGV4dCA9PT0gdW5kZWZpbmVkKSB0ZXh0ID0gdGFnT2JqW3Byb3BlcnR5XTtcbiAgICAgIGVsc2UgdGV4dCArPSBcIlwiICsgdGFnT2JqW3Byb3BlcnR5XTtcbiAgICB9ZWxzZSBpZihwcm9wZXJ0eSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1lbHNlIGlmKHRhZ09ialtwcm9wZXJ0eV0pe1xuICAgICAgXG4gICAgICBsZXQgdmFsID0gY29tcHJlc3ModGFnT2JqW3Byb3BlcnR5XSwgb3B0aW9ucywgbmV3SnBhdGgpO1xuICAgICAgY29uc3QgaXNMZWFmID0gaXNMZWFmVGFnKHZhbCwgb3B0aW9ucyk7XG4gICAgICBpZiAodGFnT2JqW01FVEFEQVRBX1NZTUJPTF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWxbTUVUQURBVEFfU1lNQk9MXSA9IHRhZ09ialtNRVRBREFUQV9TWU1CT0xdOyAvLyBjb3B5IG92ZXIgbWV0YWRhdGFcbiAgICAgIH1cblxuICAgICAgaWYodGFnT2JqW1wiOkBcIl0pe1xuICAgICAgICBhc3NpZ25BdHRyaWJ1dGVzKCB2YWwsIHRhZ09ialtcIjpAXCJdLCBuZXdKcGF0aCwgb3B0aW9ucyk7XG4gICAgICB9ZWxzZSBpZihPYmplY3Qua2V5cyh2YWwpLmxlbmd0aCA9PT0gMSAmJiB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdICE9PSB1bmRlZmluZWQgJiYgIW9wdGlvbnMuYWx3YXlzQ3JlYXRlVGV4dE5vZGUpe1xuICAgICAgICB2YWwgPSB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdO1xuICAgICAgfWVsc2UgaWYoT2JqZWN0LmtleXModmFsKS5sZW5ndGggPT09IDApe1xuICAgICAgICBpZihvcHRpb25zLmFsd2F5c0NyZWF0ZVRleHROb2RlKSB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdID0gXCJcIjtcbiAgICAgICAgZWxzZSB2YWwgPSBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZihjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkICYmIGNvbXByZXNzZWRPYmouaGFzT3duUHJvcGVydHkocHJvcGVydHkpKSB7XG4gICAgICAgIGlmKCFBcnJheS5pc0FycmF5KGNvbXByZXNzZWRPYmpbcHJvcGVydHldKSkge1xuICAgICAgICAgICAgY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0gPSBbIGNvbXByZXNzZWRPYmpbcHJvcGVydHldIF07XG4gICAgICAgIH1cbiAgICAgICAgY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0ucHVzaCh2YWwpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIC8vVE9ETzogaWYgYSBub2RlIGlzIG5vdCBhbiBhcnJheSwgdGhlbiBjaGVjayBpZiBpdCBzaG91bGQgYmUgYW4gYXJyYXlcbiAgICAgICAgLy9hbHNvIGRldGVybWluZSBpZiBpdCBpcyBhIGxlYWYgbm9kZVxuICAgICAgICBpZiAob3B0aW9ucy5pc0FycmF5KHByb3BlcnR5LCBuZXdKcGF0aCwgaXNMZWFmICkpIHtcbiAgICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSA9IFt2YWxdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgfVxuICAvLyBpZih0ZXh0ICYmIHRleHQubGVuZ3RoID4gMCkgY29tcHJlc3NlZE9ialtvcHRpb25zLnRleHROb2RlTmFtZV0gPSB0ZXh0O1xuICBpZih0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIil7XG4gICAgaWYodGV4dC5sZW5ndGggPiAwKSBjb21wcmVzc2VkT2JqW29wdGlvbnMudGV4dE5vZGVOYW1lXSA9IHRleHQ7XG4gIH1lbHNlIGlmKHRleHQgIT09IHVuZGVmaW5lZCkgY29tcHJlc3NlZE9ialtvcHRpb25zLnRleHROb2RlTmFtZV0gPSB0ZXh0O1xuICByZXR1cm4gY29tcHJlc3NlZE9iajtcbn1cblxuZnVuY3Rpb24gcHJvcE5hbWUob2JqKXtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgaWYoa2V5ICE9PSBcIjpAXCIpIHJldHVybiBrZXk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzaWduQXR0cmlidXRlcyhvYmosIGF0dHJNYXAsIGpwYXRoLCBvcHRpb25zKXtcbiAgaWYgKGF0dHJNYXApIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0ck1hcCk7XG4gICAgY29uc3QgbGVuID0ga2V5cy5sZW5ndGg7IC8vZG9uJ3QgbWFrZSBpdCBpbmxpbmVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBhdHJyTmFtZSA9IGtleXNbaV07XG4gICAgICBpZiAob3B0aW9ucy5pc0FycmF5KGF0cnJOYW1lLCBqcGF0aCArIFwiLlwiICsgYXRyck5hbWUsIHRydWUsIHRydWUpKSB7XG4gICAgICAgIG9ialthdHJyTmFtZV0gPSBbIGF0dHJNYXBbYXRyck5hbWVdIF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmpbYXRyck5hbWVdID0gYXR0ck1hcFthdHJyTmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzTGVhZlRhZyhvYmosIG9wdGlvbnMpe1xuICBjb25zdCB7IHRleHROb2RlTmFtZSB9ID0gb3B0aW9ucztcbiAgY29uc3QgcHJvcENvdW50ID0gT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gIFxuICBpZiAocHJvcENvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoXG4gICAgcHJvcENvdW50ID09PSAxICYmXG4gICAgKG9ialt0ZXh0Tm9kZU5hbWVdIHx8IHR5cGVvZiBvYmpbdGV4dE5vZGVOYW1lXSA9PT0gXCJib29sZWFuXCIgfHwgb2JqW3RleHROb2RlTmFtZV0gPT09IDApXG4gICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIiwgIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtnZXRBbGxNYXRjaGVzLCBpc05hbWV9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICBhbGxvd0Jvb2xlYW5BdHRyaWJ1dGVzOiBmYWxzZSwgLy9BIHRhZyBjYW4gaGF2ZSBhdHRyaWJ1dGVzIHdpdGhvdXQgYW55IHZhbHVlXG4gIHVucGFpcmVkVGFnczogW11cbn07XG5cbi8vY29uc3QgdGFnc1BhdHRlcm4gPSBuZXcgUmVnRXhwKFwiPFxcXFwvPyhbXFxcXHc6XFxcXC1fXFwuXSspXFxcXHMqXFwvPz5cIixcImdcIik7XG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGUoeG1sRGF0YSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIC8veG1sRGF0YSA9IHhtbERhdGEucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSxcIlwiKTsvL21ha2UgaXQgc2luZ2xlIGxpbmVcbiAgLy94bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC8oXlxccyo8XFw/eG1sLio/XFw/PikvZyxcIlwiKTsvL1JlbW92ZSBYTUwgc3RhcnRpbmcgdGFnXG4gIC8veG1sRGF0YSA9IHhtbERhdGEucmVwbGFjZSgvKDwhRE9DVFlQRVtcXHNcXHdcXFwiXFwuXFwvXFwtXFw6XSsoXFxbLipcXF0pKlxccyo+KS9nLFwiXCIpOy8vUmVtb3ZlIERPQ1RZUEVcbiAgY29uc3QgdGFncyA9IFtdO1xuICBsZXQgdGFnRm91bmQgPSBmYWxzZTtcblxuICAvL2luZGljYXRlcyB0aGF0IHRoZSByb290IHRhZyBoYXMgYmVlbiBjbG9zZWQgKGFrYS4gZGVwdGggMCBoYXMgYmVlbiByZWFjaGVkKVxuICBsZXQgcmVhY2hlZFJvb3QgPSBmYWxzZTtcblxuICBpZiAoeG1sRGF0YVswXSA9PT0gJ1xcdWZlZmYnKSB7XG4gICAgLy8gY2hlY2sgZm9yIGJ5dGUgb3JkZXIgbWFyayAoQk9NKVxuICAgIHhtbERhdGEgPSB4bWxEYXRhLnN1YnN0cigxKTtcbiAgfVxuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnICYmIHhtbERhdGFbaSsxXSA9PT0gJz8nKSB7XG4gICAgICBpKz0yO1xuICAgICAgaSA9IHJlYWRQSSh4bWxEYXRhLGkpO1xuICAgICAgaWYgKGkuZXJyKSByZXR1cm4gaTtcbiAgICB9ZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnKSB7XG4gICAgICAvL3N0YXJ0aW5nIG9mIHRhZ1xuICAgICAgLy9yZWFkIHVudGlsIHlvdSByZWFjaCB0byAnPicgYXZvaWRpbmcgYW55ICc+JyBpbiBhdHRyaWJ1dGUgdmFsdWVcbiAgICAgIGxldCB0YWdTdGFydFBvcyA9IGk7XG4gICAgICBpKys7XG4gICAgICBcbiAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnIScpIHtcbiAgICAgICAgaSA9IHJlYWRDb21tZW50QW5kQ0RBVEEoeG1sRGF0YSwgaSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGNsb3NpbmdUYWcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICcvJykge1xuICAgICAgICAgIC8vY2xvc2luZyB0YWdcbiAgICAgICAgICBjbG9zaW5nVGFnID0gdHJ1ZTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgLy9yZWFkIHRhZ25hbWVcbiAgICAgICAgbGV0IHRhZ05hbWUgPSAnJztcbiAgICAgICAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aCAmJlxuICAgICAgICAgIHhtbERhdGFbaV0gIT09ICc+JyAmJlxuICAgICAgICAgIHhtbERhdGFbaV0gIT09ICcgJyAmJlxuICAgICAgICAgIHhtbERhdGFbaV0gIT09ICdcXHQnICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJ1xcbicgJiZcbiAgICAgICAgICB4bWxEYXRhW2ldICE9PSAnXFxyJzsgaSsrXG4gICAgICAgICkge1xuICAgICAgICAgIHRhZ05hbWUgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgfVxuICAgICAgICB0YWdOYW1lID0gdGFnTmFtZS50cmltKCk7XG4gICAgICAgIC8vY29uc29sZS5sb2codGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKHRhZ05hbWVbdGFnTmFtZS5sZW5ndGggLSAxXSA9PT0gJy8nKSB7XG4gICAgICAgICAgLy9zZWxmIGNsb3NpbmcgdGFnIHdpdGhvdXQgYXR0cmlidXRlc1xuICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cmluZygwLCB0YWdOYW1lLmxlbmd0aCAtIDEpO1xuICAgICAgICAgIC8vY29udGludWU7XG4gICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmFsaWRhdGVUYWdOYW1lKHRhZ05hbWUpKSB7XG4gICAgICAgICAgbGV0IG1zZztcbiAgICAgICAgICBpZiAodGFnTmFtZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBtc2cgPSBcIkludmFsaWQgc3BhY2UgYWZ0ZXIgJzwnLlwiO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtc2cgPSBcIlRhZyAnXCIrdGFnTmFtZStcIicgaXMgYW4gaW52YWxpZCBuYW1lLlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBtc2csIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkQXR0cmlidXRlU3RyKHhtbERhdGEsIGkpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcIkF0dHJpYnV0ZXMgZm9yICdcIit0YWdOYW1lK1wiJyBoYXZlIG9wZW4gcXVvdGUuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGF0dHJTdHIgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGkgPSByZXN1bHQuaW5kZXg7XG5cbiAgICAgICAgaWYgKGF0dHJTdHJbYXR0clN0ci5sZW5ndGggLSAxXSA9PT0gJy8nKSB7XG4gICAgICAgICAgLy9zZWxmIGNsb3NpbmcgdGFnXG4gICAgICAgICAgY29uc3QgYXR0clN0clN0YXJ0ID0gaSAtIGF0dHJTdHIubGVuZ3RoO1xuICAgICAgICAgIGF0dHJTdHIgPSBhdHRyU3RyLnN1YnN0cmluZygwLCBhdHRyU3RyLmxlbmd0aCAtIDEpO1xuICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0ZUF0dHJpYnV0ZVN0cmluZyhhdHRyU3RyLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoaXNWYWxpZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGFnRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgLy9jb250aW51ZTsgLy90ZXh0IG1heSBwcmVzZW50cyBhZnRlciBzZWxmIGNsb3NpbmcgdGFnXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vdGhlIHJlc3VsdCBmcm9tIHRoZSBuZXN0ZWQgZnVuY3Rpb24gcmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhlIGVycm9yIHdpdGhpbiB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAvL2luIG9yZGVyIHRvIGdldCB0aGUgJ3RydWUnIGVycm9yIGxpbmUsIHdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlIGJlZ2lucyAoaSAtIGF0dHJTdHIubGVuZ3RoKSBhbmQgdGhlbiBhZGQgdGhlIHBvc2l0aW9uIHdpdGhpbiB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAvL3RoaXMgZ2l2ZXMgdXMgdGhlIGFic29sdXRlIGluZGV4IGluIHRoZSBlbnRpcmUgeG1sLCB3aGljaCB3ZSBjYW4gdXNlIHRvIGZpbmQgdGhlIGxpbmUgYXQgbGFzdFxuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KGlzVmFsaWQuZXJyLmNvZGUsIGlzVmFsaWQuZXJyLm1zZywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGF0dHJTdHJTdGFydCArIGlzVmFsaWQuZXJyLmxpbmUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY2xvc2luZ1RhZykge1xuICAgICAgICAgIGlmICghcmVzdWx0LnRhZ0Nsb3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJywgXCJDbG9zaW5nIHRhZyAnXCIrdGFnTmFtZStcIicgZG9lc24ndCBoYXZlIHByb3BlciBjbG9zaW5nLlwiLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYXR0clN0ci50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJywgXCJDbG9zaW5nIHRhZyAnXCIrdGFnTmFtZStcIicgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzIG9yIGludmFsaWQgc3RhcnRpbmcuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCB0YWdTdGFydFBvcykpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGFncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFRhZycsIFwiQ2xvc2luZyB0YWcgJ1wiK3RhZ05hbWUrXCInIGhhcyBub3QgYmVlbiBvcGVuZWQuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCB0YWdTdGFydFBvcykpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvdGcgPSB0YWdzLnBvcCgpO1xuICAgICAgICAgICAgaWYgKHRhZ05hbWUgIT09IG90Zy50YWdOYW1lKSB7XG4gICAgICAgICAgICAgIGxldCBvcGVuUG9zID0gZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIG90Zy50YWdTdGFydFBvcyk7XG4gICAgICAgICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFRhZycsXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjbG9zaW5nIHRhZyAnXCIrb3RnLnRhZ05hbWUrXCInIChvcGVuZWQgaW4gbGluZSBcIitvcGVuUG9zLmxpbmUrXCIsIGNvbCBcIitvcGVuUG9zLmNvbCtcIikgaW5zdGVhZCBvZiBjbG9zaW5nIHRhZyAnXCIrdGFnTmFtZStcIicuXCIsXG4gICAgICAgICAgICAgICAgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ1N0YXJ0UG9zKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vd2hlbiB0aGVyZSBhcmUgbm8gbW9yZSB0YWdzLCB3ZSByZWFjaGVkIHRoZSByb290IGxldmVsLlxuICAgICAgICAgICAgaWYgKHRhZ3MubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgcmVhY2hlZFJvb3QgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpc1ZhbGlkID0gdmFsaWRhdGVBdHRyaWJ1dGVTdHJpbmcoYXR0clN0ciwgb3B0aW9ucyk7XG4gICAgICAgICAgaWYgKGlzVmFsaWQgIT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vdGhlIHJlc3VsdCBmcm9tIHRoZSBuZXN0ZWQgZnVuY3Rpb24gcmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhlIGVycm9yIHdpdGhpbiB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAvL2luIG9yZGVyIHRvIGdldCB0aGUgJ3RydWUnIGVycm9yIGxpbmUsIHdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlIGJlZ2lucyAoaSAtIGF0dHJTdHIubGVuZ3RoKSBhbmQgdGhlbiBhZGQgdGhlIHBvc2l0aW9uIHdpdGhpbiB0aGUgYXR0cmlidXRlXG4gICAgICAgICAgICAvL3RoaXMgZ2l2ZXMgdXMgdGhlIGFic29sdXRlIGluZGV4IGluIHRoZSBlbnRpcmUgeG1sLCB3aGljaCB3ZSBjYW4gdXNlIHRvIGZpbmQgdGhlIGxpbmUgYXQgbGFzdFxuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KGlzVmFsaWQuZXJyLmNvZGUsIGlzVmFsaWQuZXJyLm1zZywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkgLSBhdHRyU3RyLmxlbmd0aCArIGlzVmFsaWQuZXJyLmxpbmUpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL2lmIHRoZSByb290IGxldmVsIGhhcyBiZWVuIHJlYWNoZWQgYmVmb3JlIC4uLlxuICAgICAgICAgIGlmIChyZWFjaGVkUm9vdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkWG1sJywgJ011bHRpcGxlIHBvc3NpYmxlIHJvb3Qgbm9kZXMgZm91bmQuJywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgICB9IGVsc2UgaWYob3B0aW9ucy51bnBhaXJlZFRhZ3MuaW5kZXhPZih0YWdOYW1lKSAhPT0gLTEpe1xuICAgICAgICAgICAgLy9kb24ndCBwdXNoIGludG8gc3RhY2tcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFncy5wdXNoKHt0YWdOYW1lLCB0YWdTdGFydFBvc30pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0YWdGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvL3NraXAgdGFnIHRleHQgdmFsdWVcbiAgICAgICAgLy9JdCBtYXkgaW5jbHVkZSBjb21tZW50cyBhbmQgQ0RBVEEgdmFsdWVcbiAgICAgICAgZm9yIChpKys7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICc8Jykge1xuICAgICAgICAgICAgaWYgKHhtbERhdGFbaSArIDFdID09PSAnIScpIHtcbiAgICAgICAgICAgICAgLy9jb21tZW50IG9yIENBREFUQVxuICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgIGkgPSByZWFkQ29tbWVudEFuZENEQVRBKHhtbERhdGEsIGkpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpKzFdID09PSAnPycpIHtcbiAgICAgICAgICAgICAgaSA9IHJlYWRQSSh4bWxEYXRhLCArK2kpO1xuICAgICAgICAgICAgICBpZiAoaS5lcnIpIHJldHVybiBpO1xuICAgICAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT09ICcmJykge1xuICAgICAgICAgICAgY29uc3QgYWZ0ZXJBbXAgPSB2YWxpZGF0ZUFtcGVyc2FuZCh4bWxEYXRhLCBpKTtcbiAgICAgICAgICAgIGlmIChhZnRlckFtcCA9PSAtMSlcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQ2hhcicsIFwiY2hhciAnJicgaXMgbm90IGV4cGVjdGVkLlwiLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgICAgaSA9IGFmdGVyQW1wO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYgKHJlYWNoZWRSb290ID09PSB0cnVlICYmICFpc1doaXRlU3BhY2UoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkWG1sJywgXCJFeHRyYSB0ZXh0IGF0IHRoZSBlbmRcIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gLy9lbmQgb2YgcmVhZGluZyB0YWcgdGV4dCB2YWx1ZVxuICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnKSB7XG4gICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICggaXNXaGl0ZVNwYWNlKHhtbERhdGFbaV0pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQ2hhcicsIFwiY2hhciAnXCIreG1sRGF0YVtpXStcIicgaXMgbm90IGV4cGVjdGVkLlwiLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGFnRm91bmQpIHtcbiAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCAnU3RhcnQgdGFnIGV4cGVjdGVkLicsIDEpO1xuICB9ZWxzZSBpZiAodGFncy5sZW5ndGggPT0gMSkge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJywgXCJVbmNsb3NlZCB0YWcgJ1wiK3RhZ3NbMF0udGFnTmFtZStcIicuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCB0YWdzWzBdLnRhZ1N0YXJ0UG9zKSk7XG4gIH1lbHNlIGlmICh0YWdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFhtbCcsIFwiSW52YWxpZCAnXCIrXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGFncy5tYXAodCA9PiB0LnRhZ05hbWUpLCBudWxsLCA0KS5yZXBsYWNlKC9cXHI/XFxuL2csICcnKStcbiAgICAgICAgICBcIicgZm91bmQuXCIsIHtsaW5lOiAxLCBjb2w6IDF9KTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gaXNXaGl0ZVNwYWNlKGNoYXIpe1xuICByZXR1cm4gY2hhciA9PT0gJyAnIHx8IGNoYXIgPT09ICdcXHQnIHx8IGNoYXIgPT09ICdcXG4nICB8fCBjaGFyID09PSAnXFxyJztcbn1cbi8qKlxuICogUmVhZCBQcm9jZXNzaW5nIGluc3N0cnVjdGlvbnMgYW5kIHNraXBcbiAqIEBwYXJhbSB7Kn0geG1sRGF0YVxuICogQHBhcmFtIHsqfSBpXG4gKi9cbmZ1bmN0aW9uIHJlYWRQSSh4bWxEYXRhLCBpKSB7XG4gIGNvbnN0IHN0YXJ0ID0gaTtcbiAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHhtbERhdGFbaV0gPT0gJz8nIHx8IHhtbERhdGFbaV0gPT0gJyAnKSB7XG4gICAgICAvL3RhZ25hbWVcbiAgICAgIGNvbnN0IHRhZ25hbWUgPSB4bWxEYXRhLnN1YnN0cihzdGFydCwgaSAtIHN0YXJ0KTtcbiAgICAgIGlmIChpID4gNSAmJiB0YWduYW1lID09PSAneG1sJykge1xuICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCAnWE1MIGRlY2xhcmF0aW9uIGFsbG93ZWQgb25seSBhdCB0aGUgc3RhcnQgb2YgdGhlIGRvY3VtZW50LicsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT0gJz8nICYmIHhtbERhdGFbaSArIDFdID09ICc+Jykge1xuICAgICAgICAvL2NoZWNrIGlmIHZhbGlkIGF0dHJpYnV0IHN0cmluZ1xuICAgICAgICBpKys7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpO1xufVxuXG5mdW5jdGlvbiByZWFkQ29tbWVudEFuZENEQVRBKHhtbERhdGEsIGkpIHtcbiAgaWYgKHhtbERhdGEubGVuZ3RoID4gaSArIDUgJiYgeG1sRGF0YVtpICsgMV0gPT09ICctJyAmJiB4bWxEYXRhW2kgKyAyXSA9PT0gJy0nKSB7XG4gICAgLy9jb21tZW50XG4gICAgZm9yIChpICs9IDM7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJy0nICYmIHhtbERhdGFbaSArIDFdID09PSAnLScgJiYgeG1sRGF0YVtpICsgMl0gPT09ICc+Jykge1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChcbiAgICB4bWxEYXRhLmxlbmd0aCA+IGkgKyA4ICYmXG4gICAgeG1sRGF0YVtpICsgMV0gPT09ICdEJyAmJlxuICAgIHhtbERhdGFbaSArIDJdID09PSAnTycgJiZcbiAgICB4bWxEYXRhW2kgKyAzXSA9PT0gJ0MnICYmXG4gICAgeG1sRGF0YVtpICsgNF0gPT09ICdUJyAmJlxuICAgIHhtbERhdGFbaSArIDVdID09PSAnWScgJiZcbiAgICB4bWxEYXRhW2kgKyA2XSA9PT0gJ1AnICYmXG4gICAgeG1sRGF0YVtpICsgN10gPT09ICdFJ1xuICApIHtcbiAgICBsZXQgYW5nbGVCcmFja2V0c0NvdW50ID0gMTtcbiAgICBmb3IgKGkgKz0gODsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcpIHtcbiAgICAgICAgYW5nbGVCcmFja2V0c0NvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT09ICc+Jykge1xuICAgICAgICBhbmdsZUJyYWNrZXRzQ291bnQtLTtcbiAgICAgICAgaWYgKGFuZ2xlQnJhY2tldHNDb3VudCA9PT0gMCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIHhtbERhdGEubGVuZ3RoID4gaSArIDkgJiZcbiAgICB4bWxEYXRhW2kgKyAxXSA9PT0gJ1snICYmXG4gICAgeG1sRGF0YVtpICsgMl0gPT09ICdDJyAmJlxuICAgIHhtbERhdGFbaSArIDNdID09PSAnRCcgJiZcbiAgICB4bWxEYXRhW2kgKyA0XSA9PT0gJ0EnICYmXG4gICAgeG1sRGF0YVtpICsgNV0gPT09ICdUJyAmJlxuICAgIHhtbERhdGFbaSArIDZdID09PSAnQScgJiZcbiAgICB4bWxEYXRhW2kgKyA3XSA9PT0gJ1snXG4gICkge1xuICAgIGZvciAoaSArPSA4OyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICddJyAmJiB4bWxEYXRhW2kgKyAxXSA9PT0gJ10nICYmIHhtbERhdGFbaSArIDJdID09PSAnPicpIHtcbiAgICAgICAgaSArPSAyO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaTtcbn1cblxuY29uc3QgZG91YmxlUXVvdGUgPSAnXCInO1xuY29uc3Qgc2luZ2xlUXVvdGUgPSBcIidcIjtcblxuLyoqXG4gKiBLZWVwIHJlYWRpbmcgeG1sRGF0YSB1bnRpbCAnPCcgaXMgZm91bmQgb3V0c2lkZSB0aGUgYXR0cmlidXRlIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IHhtbERhdGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBpXG4gKi9cbmZ1bmN0aW9uIHJlYWRBdHRyaWJ1dGVTdHIoeG1sRGF0YSwgaSkge1xuICBsZXQgYXR0clN0ciA9ICcnO1xuICBsZXQgc3RhcnRDaGFyID0gJyc7XG4gIGxldCB0YWdDbG9zZWQgPSBmYWxzZTtcbiAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHhtbERhdGFbaV0gPT09IGRvdWJsZVF1b3RlIHx8IHhtbERhdGFbaV0gPT09IHNpbmdsZVF1b3RlKSB7XG4gICAgICBpZiAoc3RhcnRDaGFyID09PSAnJykge1xuICAgICAgICBzdGFydENoYXIgPSB4bWxEYXRhW2ldO1xuICAgICAgfSBlbHNlIGlmIChzdGFydENoYXIgIT09IHhtbERhdGFbaV0pIHtcbiAgICAgICAgLy9pZiB2YXVlIGlzIGVuY2xvc2VkIHdpdGggZG91YmxlIHF1b3RlIHRoZW4gc2luZ2xlIHF1b3RlcyBhcmUgYWxsb3dlZCBpbnNpZGUgdGhlIHZhbHVlIGFuZCB2aWNlIHZlcnNhXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydENoYXIgPSAnJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT09ICc+Jykge1xuICAgICAgaWYgKHN0YXJ0Q2hhciA9PT0gJycpIHtcbiAgICAgICAgdGFnQ2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGF0dHJTdHIgKz0geG1sRGF0YVtpXTtcbiAgfVxuICBpZiAoc3RhcnRDaGFyICE9PSAnJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdmFsdWU6IGF0dHJTdHIsXG4gICAgaW5kZXg6IGksXG4gICAgdGFnQ2xvc2VkOiB0YWdDbG9zZWRcbiAgfTtcbn1cblxuLyoqXG4gKiBTZWxlY3QgYWxsIHRoZSBhdHRyaWJ1dGVzIHdoZXRoZXIgdmFsaWQgb3IgaW52YWxpZC5cbiAqL1xuY29uc3QgdmFsaWRBdHRyU3RyUmVneHAgPSBuZXcgUmVnRXhwKCcoXFxcXHMqKShbXlxcXFxzPV0rKShcXFxccyo9KT8oXFxcXHMqKFtcXCdcIl0pKChbXFxcXHNcXFxcU10pKj8pXFxcXDUpPycsICdnJyk7XG5cbi8vYXR0ciwgPVwic2RcIiwgYT1cImFtaXQnc1wiLCBhPVwic2RcImI9XCJzYWZcIiwgYWIgIGNkPVwiXCJcblxuZnVuY3Rpb24gdmFsaWRhdGVBdHRyaWJ1dGVTdHJpbmcoYXR0clN0ciwgb3B0aW9ucykge1xuICAvL2NvbnNvbGUubG9nKFwic3RhcnQ6XCIrYXR0clN0citcIjplbmRcIik7XG5cbiAgLy9pZihhdHRyU3RyLnRyaW0oKS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlOyAvL2VtcHR5IHN0cmluZ1xuXG4gIGNvbnN0IG1hdGNoZXMgPSBnZXRBbGxNYXRjaGVzKGF0dHJTdHIsIHZhbGlkQXR0clN0clJlZ3hwKTtcbiAgY29uc3QgYXR0ck5hbWVzID0ge307XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG1hdGNoZXNbaV1bMV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAvL25vc3BhY2UgYmVmb3JlIGF0dHJpYnV0ZSBuYW1lOiBhPVwic2RcImI9XCJzYWZcIlxuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlICdcIittYXRjaGVzW2ldWzJdK1wiJyBoYXMgbm8gc3BhY2UgaW4gc3RhcnRpbmcuXCIsIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoZXNbaV0pKVxuICAgIH0gZWxzZSBpZiAobWF0Y2hlc1tpXVszXSAhPT0gdW5kZWZpbmVkICYmIG1hdGNoZXNbaV1bNF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlICdcIittYXRjaGVzW2ldWzJdK1wiJyBpcyB3aXRob3V0IHZhbHVlLlwiLCBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaGVzW2ldKSk7XG4gICAgfSBlbHNlIGlmIChtYXRjaGVzW2ldWzNdID09PSB1bmRlZmluZWQgJiYgIW9wdGlvbnMuYWxsb3dCb29sZWFuQXR0cmlidXRlcykge1xuICAgICAgLy9pbmRlcGVuZGVudCBhdHRyaWJ1dGU6IGFiXG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRBdHRyJywgXCJib29sZWFuIGF0dHJpYnV0ZSAnXCIrbWF0Y2hlc1tpXVsyXStcIicgaXMgbm90IGFsbG93ZWQuXCIsIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoZXNbaV0pKTtcbiAgICB9XG4gICAgLyogZWxzZSBpZihtYXRjaGVzW2ldWzZdID09PSB1bmRlZmluZWQpey8vYXR0cmlidXRlIHdpdGhvdXQgdmFsdWU6IGFiPVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBlcnI6IHsgY29kZTpcIkludmFsaWRBdHRyXCIsbXNnOlwiYXR0cmlidXRlIFwiICsgbWF0Y2hlc1tpXVsyXSArIFwiIGhhcyBubyB2YWx1ZSBhc3NpZ25lZC5cIn19O1xuICAgICAgICAgICAgICAgIH0gKi9cbiAgICBjb25zdCBhdHRyTmFtZSA9IG1hdGNoZXNbaV1bMl07XG4gICAgaWYgKCF2YWxpZGF0ZUF0dHJOYW1lKGF0dHJOYW1lKSkge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlICdcIithdHRyTmFtZStcIicgaXMgYW4gaW52YWxpZCBuYW1lLlwiLCBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaGVzW2ldKSk7XG4gICAgfVxuICAgIGlmICghYXR0ck5hbWVzLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xuICAgICAgLy9jaGVjayBmb3IgZHVwbGljYXRlIGF0dHJpYnV0ZS5cbiAgICAgIGF0dHJOYW1lc1thdHRyTmFtZV0gPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRBdHRyJywgXCJBdHRyaWJ1dGUgJ1wiK2F0dHJOYW1lK1wiJyBpcyByZXBlYXRlZC5cIiwgZ2V0UG9zaXRpb25Gcm9tTWF0Y2gobWF0Y2hlc1tpXSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZU51bWJlckFtcGVyc2FuZCh4bWxEYXRhLCBpKSB7XG4gIGxldCByZSA9IC9cXGQvO1xuICBpZiAoeG1sRGF0YVtpXSA9PT0gJ3gnKSB7XG4gICAgaSsrO1xuICAgIHJlID0gL1tcXGRhLWZBLUZdLztcbiAgfVxuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzsnKVxuICAgICAgcmV0dXJuIGk7XG4gICAgaWYgKCF4bWxEYXRhW2ldLm1hdGNoKHJlKSlcbiAgICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBbXBlcnNhbmQoeG1sRGF0YSwgaSkge1xuICAvLyBodHRwczovL3d3dy53My5vcmcvVFIveG1sLyNkdC1jaGFycmVmXG4gIGkrKztcbiAgaWYgKHhtbERhdGFbaV0gPT09ICc7JylcbiAgICByZXR1cm4gLTE7XG4gIGlmICh4bWxEYXRhW2ldID09PSAnIycpIHtcbiAgICBpKys7XG4gICAgcmV0dXJuIHZhbGlkYXRlTnVtYmVyQW1wZXJzYW5kKHhtbERhdGEsIGkpO1xuICB9XG4gIGxldCBjb3VudCA9IDA7XG4gIGZvciAoOyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKywgY291bnQrKykge1xuICAgIGlmICh4bWxEYXRhW2ldLm1hdGNoKC9cXHcvKSAmJiBjb3VudCA8IDIwKVxuICAgICAgY29udGludWU7XG4gICAgaWYgKHhtbERhdGFbaV0gPT09ICc7JylcbiAgICAgIGJyZWFrO1xuICAgIHJldHVybiAtMTtcbiAgfVxuICByZXR1cm4gaTtcbn1cblxuZnVuY3Rpb24gZ2V0RXJyb3JPYmplY3QoY29kZSwgbWVzc2FnZSwgbGluZU51bWJlcikge1xuICByZXR1cm4ge1xuICAgIGVycjoge1xuICAgICAgY29kZTogY29kZSxcbiAgICAgIG1zZzogbWVzc2FnZSxcbiAgICAgIGxpbmU6IGxpbmVOdW1iZXIubGluZSB8fCBsaW5lTnVtYmVyLFxuICAgICAgY29sOiBsaW5lTnVtYmVyLmNvbCxcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUF0dHJOYW1lKGF0dHJOYW1lKSB7XG4gIHJldHVybiBpc05hbWUoYXR0ck5hbWUpO1xufVxuXG4vLyBjb25zdCBzdGFydHNXaXRoWE1MID0gL154bWwvaTtcblxuZnVuY3Rpb24gdmFsaWRhdGVUYWdOYW1lKHRhZ25hbWUpIHtcbiAgcmV0dXJuIGlzTmFtZSh0YWduYW1lKSAvKiAmJiAhdGFnbmFtZS5tYXRjaChzdGFydHNXaXRoWE1MKSAqLztcbn1cblxuLy90aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGxpbmUgbnVtYmVyIGZvciB0aGUgY2hhcmFjdGVyIGF0IHRoZSBnaXZlbiBpbmRleFxuZnVuY3Rpb24gZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGluZGV4KSB7XG4gIGNvbnN0IGxpbmVzID0geG1sRGF0YS5zdWJzdHJpbmcoMCwgaW5kZXgpLnNwbGl0KC9cXHI/XFxuLyk7XG4gIHJldHVybiB7XG4gICAgbGluZTogbGluZXMubGVuZ3RoLFxuXG4gICAgLy8gY29sdW1uIG51bWJlciBpcyBsYXN0IGxpbmUncyBsZW5ndGggKyAxLCBiZWNhdXNlIGNvbHVtbiBudW1iZXJpbmcgc3RhcnRzIGF0IDE6XG4gICAgY29sOiBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXS5sZW5ndGggKyAxXG4gIH07XG59XG5cbi8vdGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIG1hdGNoIHdpdGhpbiBhdHRyU3RyXG5mdW5jdGlvbiBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaCkge1xuICByZXR1cm4gbWF0Y2guc3RhcnRJbmRleCArIG1hdGNoWzFdLmxlbmd0aDtcbn1cbiIsICJpbXBvcnQgeyBidWlsZE9wdGlvbnN9IGZyb20gJy4vT3B0aW9uc0J1aWxkZXIuanMnO1xuaW1wb3J0IE9yZGVyZWRPYmpQYXJzZXIgZnJvbSAnLi9PcmRlcmVkT2JqUGFyc2VyLmpzJztcbmltcG9ydCBwcmV0dGlmeSBmcm9tICcuL25vZGUyanNvbi5qcyc7XG5pbXBvcnQge3ZhbGlkYXRlfSBmcm9tIFwiLi4vdmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgWG1sTm9kZSBmcm9tICcuL3htbE5vZGUuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBYTUxQYXJzZXJ7XG4gICAgXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucyl7XG4gICAgICAgIHRoaXMuZXh0ZXJuYWxFbnRpdGllcyA9IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBidWlsZE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIFxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXJzZSBYTUwgZGF0cyB0byBKUyBvYmplY3QgXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QnVmZmVyfSB4bWxEYXRhIFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxPYmplY3R9IHZhbGlkYXRpb25PcHRpb24gXG4gICAgICovXG4gICAgcGFyc2UoeG1sRGF0YSx2YWxpZGF0aW9uT3B0aW9uKXtcbiAgICAgICAgaWYodHlwZW9mIHhtbERhdGEgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICB9ZWxzZSBpZiggeG1sRGF0YS50b1N0cmluZyl7XG4gICAgICAgICAgICB4bWxEYXRhID0geG1sRGF0YS50b1N0cmluZygpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlhNTCBkYXRhIGlzIGFjY2VwdGVkIGluIFN0cmluZyBvciBCeXRlc1tdIGZvcm0uXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYoIHZhbGlkYXRpb25PcHRpb24pe1xuICAgICAgICAgICAgaWYodmFsaWRhdGlvbk9wdGlvbiA9PT0gdHJ1ZSkgdmFsaWRhdGlvbk9wdGlvbiA9IHt9OyAvL3ZhbGlkYXRlIHdpdGggZGVmYXVsdCBvcHRpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKHhtbERhdGEsIHZhbGlkYXRpb25PcHRpb24pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICB0aHJvdyBFcnJvciggYCR7cmVzdWx0LmVyci5tc2d9OiR7cmVzdWx0LmVyci5saW5lfToke3Jlc3VsdC5lcnIuY29sfWAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3JkZXJlZE9ialBhcnNlciA9IG5ldyBPcmRlcmVkT2JqUGFyc2VyKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIG9yZGVyZWRPYmpQYXJzZXIuYWRkRXh0ZXJuYWxFbnRpdGllcyh0aGlzLmV4dGVybmFsRW50aXRpZXMpO1xuICAgICAgICBjb25zdCBvcmRlcmVkUmVzdWx0ID0gb3JkZXJlZE9ialBhcnNlci5wYXJzZVhtbCh4bWxEYXRhKTtcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLnByZXNlcnZlT3JkZXIgfHwgb3JkZXJlZFJlc3VsdCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gb3JkZXJlZFJlc3VsdDtcbiAgICAgICAgZWxzZSByZXR1cm4gcHJldHRpZnkob3JkZXJlZFJlc3VsdCwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgRW50aXR5IHdoaWNoIGlzIG5vdCBieSBkZWZhdWx0IHN1cHBvcnRlZCBieSB0aGlzIGxpYnJhcnlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBcbiAgICAgKi9cbiAgICBhZGRFbnRpdHkoa2V5LCB2YWx1ZSl7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCImXCIpICE9PSAtMSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbnRpdHkgdmFsdWUgY2FuJ3QgaGF2ZSAnJidcIilcbiAgICAgICAgfWVsc2UgaWYoa2V5LmluZGV4T2YoXCImXCIpICE9PSAtMSB8fCBrZXkuaW5kZXhPZihcIjtcIikgIT09IC0xKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFuIGVudGl0eSBtdXN0IGJlIHNldCB3aXRob3V0ICcmJyBhbmQgJzsnLiBFZy4gdXNlICcjeEQnIGZvciAnJiN4RDsnXCIpXG4gICAgICAgIH1lbHNlIGlmKHZhbHVlID09PSBcIiZcIil7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBbiBlbnRpdHkgd2l0aCB2YWx1ZSAnJicgaXMgbm90IHBlcm1pdHRlZFwiKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aGlzLmV4dGVybmFsRW50aXRpZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIFN5bWJvbCB0aGF0IGNhbiBiZSB1c2VkIHRvIGFjY2VzcyB0aGUgbWV0YWRhdGFcbiAgICAgKiBwcm9wZXJ0eSBvbiBhIG5vZGUuXG4gICAgICogXG4gICAgICogSWYgU3ltYm9sIGlzIG5vdCBhdmFpbGFibGUgaW4gdGhlIGVudmlyb25tZW50LCBhbiBvcmRpbmFyeSBwcm9wZXJ0eSBpcyB1c2VkXG4gICAgICogYW5kIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSBpcyBoZXJlIHJldHVybmVkLlxuICAgICAqIFxuICAgICAqIFRoZSBYTUxNZXRhRGF0YSBwcm9wZXJ0eSBpcyBvbmx5IHByZXNlbnQgd2hlbiBgY2FwdHVyZU1ldGFEYXRhYFxuICAgICAqIGlzIHRydWUgaW4gdGhlIG9wdGlvbnMuXG4gICAgICovXG4gICAgc3RhdGljIGdldE1ldGFEYXRhU3ltYm9sKCkge1xuICAgICAgICByZXR1cm4gWG1sTm9kZS5nZXRNZXRhRGF0YVN5bWJvbCgpO1xuICAgIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDTyxJQUFNLGlCQUFpQjtBQUFBLEVBQzFCLGVBQWU7QUFBQSxFQUNmLHFCQUFxQjtBQUFBLEVBQ3JCLHFCQUFxQjtBQUFBLEVBQ3JCLGNBQWM7QUFBQSxFQUNkLGtCQUFrQjtBQUFBLEVBQ2xCLGdCQUFnQjtBQUFBO0FBQUEsRUFDaEIsd0JBQXdCO0FBQUE7QUFBQTtBQUFBLEVBRXhCLGVBQWU7QUFBQSxFQUNmLHFCQUFxQjtBQUFBLEVBQ3JCLFlBQVk7QUFBQTtBQUFBLEVBQ1osZUFBZTtBQUFBLEVBQ2Ysb0JBQW9CO0FBQUEsSUFDbEIsS0FBSztBQUFBLElBQ0wsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLG1CQUFtQixTQUFTLFNBQVMsS0FBSztBQUN4QyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EseUJBQXlCLFNBQVMsVUFBVSxLQUFLO0FBQy9DLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxXQUFXLENBQUM7QUFBQTtBQUFBLEVBQ1osc0JBQXNCO0FBQUEsRUFDdEIsU0FBUyxNQUFNO0FBQUEsRUFDZixpQkFBaUI7QUFBQSxFQUNqQixjQUFjLENBQUM7QUFBQSxFQUNmLGlCQUFpQjtBQUFBLEVBQ2pCLGNBQWM7QUFBQSxFQUNkLG1CQUFtQjtBQUFBLEVBQ25CLGNBQWM7QUFBQSxFQUNkLGtCQUFrQjtBQUFBLEVBQ2xCLHdCQUF3QjtBQUFBLEVBQ3hCLFdBQVcsU0FBUyxTQUFTLE9BQU8s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T0FBTztBQUNuQyxTQUFPLE1BQU0sYUFBYSxNQUFNLENBQUMsRUFBRTtBQUNyQzs7O0FDbGFBLElBQXFCLFlBQXJCLE1BQThCO0FBQUEsRUFFMUIsWUFBWSxTQUFRO0FBQ2hCLFNBQUssbUJBQW1CLENBQUM7QUFDekIsU0FBSyxVQUFVLGFBQWEsT0FBTztBQUFBLEVBRXZDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsTUFBTSxTQUFRLGtCQUFpQjtBQUMzQixRQUFHLE9BQU8sWUFBWSxVQUFTO0FBQUEsSUFDL0IsV0FBVSxRQUFRLFVBQVM7QUFDdkIsZ0JBQVUsUUFBUSxTQUFTO0FBQUEsSUFDL0IsT0FBSztBQUNELFlBQU0sSUFBSSxNQUFNLGlEQUFpRDtBQUFBLElBQ3JFO0FBQ0EsUUFBSSxrQkFBaUI7QUFDakIsVUFBRyxxQkFBcUIsS0FBTSxvQkFBbUIsQ0FBQztBQUVsRCxZQUFNLFNBQVMsU0FBUyxTQUFTLGdCQUFnQjtBQUNqRCxVQUFJLFdBQVcsTUFBTTtBQUNuQixjQUFNLE1BQU8sR0FBRyxPQUFPLElBQUksR0FBRyxJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksT0FBTyxJQUFJLEdBQUcsRUFBRztBQUFBLE1BQ3hFO0FBQUEsSUFDRjtBQUNGLFVBQU0sbUJBQW1CLElBQUksaUJBQWlCLEtBQUssT0FBTztBQUMxRCxxQkFBaUIsb0JBQW9CLEtBQUssZ0JBQWdCO0FBQzFELFVBQU0sZ0JBQWdCLGlCQUFpQixTQUFTLE9BQU87QUFDdkQsUUFBRyxLQUFLLFFBQVEsaUJBQWlCLGtCQUFrQixPQUFXLFFBQU87QUFBQSxRQUNoRSxRQUFPLFNBQVMsZUFBZSxLQUFLLE9BQU87QUFBQSxFQUNwRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFVBQVUsS0FBSyxPQUFNO0FBQ2pCLFFBQUcsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFHO0FBQ3pCLFlBQU0sSUFBSSxNQUFNLDZCQUE2QjtBQUFBLElBQ2pELFdBQVMsSUFBSSxRQUFRLEdBQUcsTUFBTSxNQUFNLElBQUksUUFBUSxHQUFHLE1BQU0sSUFBRztBQUN4RCxZQUFNLElBQUksTUFBTSxzRUFBc0U7QUFBQSxJQUMxRixXQUFTLFVBQVUsS0FBSTtBQUNuQixZQUFNLElBQUksTUFBTSwyQ0FBMkM7QUFBQSxJQUMvRCxPQUFLO0FBQ0QsV0FBSyxpQkFBaUIsR0FBRyxJQUFJO0FBQUEsSUFDakM7QUFBQSxFQUNKO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQU8sb0JBQW9CO0FBQ3ZCLFdBQU8sUUFBUSxrQkFBa0I7QUFBQSxFQUNyQztBQUNKOyIsCiAgIm5hbWVzIjogWyJyZXN1bHQiLCAiTUVUQURBVEFfU1lNQk9MIiwgImRlZmF1bHRPcHRpb25zIl0KfQo=
