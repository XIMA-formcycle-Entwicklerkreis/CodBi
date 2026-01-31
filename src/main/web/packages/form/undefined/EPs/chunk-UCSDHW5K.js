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
    eNotation: true,
  },
  tagValueProcessor: function (tagName, val) {
    return val;
  },
  attributeValueProcessor: function (attrName, val) {
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
  updateTag: function (tagName, jPath, attrs) {
    return tagName;
  },
  // skipEmptyListItem: false
  captureMetaData: false,
};
var buildOptions = function (options) {
  return Object.assign({}, defaultOptions, options);
};

// ../../node_modules/fast-xml-parser/src/util.js
var nameStartChar =
  ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
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
var isName = function (string) {
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
  if (
    xmlData[i + 3] === "O" &&
    xmlData[i + 4] === "C" &&
    xmlData[i + 5] === "T" &&
    xmlData[i + 6] === "Y" &&
    xmlData[i + 7] === "P" &&
    xmlData[i + 8] === "E"
  ) {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false,
      comment = false;
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
              val,
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
    index: i,
  };
}
function hasSeq(data, seq, i) {
  for (let j = 0; j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1]) return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name)) return name;
  else throw new Error(`Invalid entity name ${name}`);
}

// ../../node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true,
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
      const decimalAdjacentToLeadingZeros = sign
        ? // 0., -00., 000.
          str[leadingZeros.length + 1] === "."
        : str[leadingZeros.length] === ".";
      if (
        !options.leadingZeros &&
        (leadingZeros.length > 1 || (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))
      ) {
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
    const eAdjacentToLeadingZeros = sign
      ? // 0E.
        str[leadingZeros.length + 1] === eChar
      : str[leadingZeros.length] === eChar;
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
      apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
      gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
      lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
      quot: { regex: /&(quot|#34|#x22);/g, val: '"' },
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      space: { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      cent: { regex: /&(cent|#162);/g, val: "\xA2" },
      pound: { regex: /&(pound|#163);/g, val: "\xA3" },
      yen: { regex: /&(yen|#165);/g, val: "\xA5" },
      euro: { regex: /&(euro|#8364);/g, val: "\u20AC" },
      copyright: { regex: /&(copy|#169);/g, val: "\xA9" },
      reg: { regex: /&(reg|#174);/g, val: "\xAE" },
      inr: { regex: /&(inr|#8377);/g, val: "\u20B9" },
      num_dec: { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) },
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
      val: externalEntities[ent],
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
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
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
var parseXml = function (xmlData) {
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
        if ((this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags) {
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
var replaceEntitiesValue = function (val) {
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
      isLeafNode,
    );
    if (textData !== void 0 && textData !== "") currentNode.add(this.options.textNodeName, textData);
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
            index,
          };
        }
      } else {
        return {
          data: tagExp,
          index,
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
    rawTagName,
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
              i: closeIndex,
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
      } else if (
        Object.keys(val).length === 1 &&
        val[options.textNodeName] !== void 0 &&
        !options.alwaysCreateTextNode
      ) {
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
  unpairedTags: [],
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
        for (
          ;
          i < xmlData.length &&
          xmlData[i] !== ">" &&
          xmlData[i] !== " " &&
          xmlData[i] !== "	" &&
          xmlData[i] !== "\n" &&
          xmlData[i] !== "\r";
          i++
        ) {
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
          return getErrorObject(
            "InvalidAttr",
            "Attributes for '" + tagName + "' have open quote.",
            getLineNumberForPosition(xmlData, i),
          );
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
            return getErrorObject(
              isValid.err.code,
              isValid.err.msg,
              getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line),
            );
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject(
              "InvalidTag",
              "Closing tag '" + tagName + "' doesn't have proper closing.",
              getLineNumberForPosition(xmlData, i),
            );
          } else if (attrStr.trim().length > 0) {
            return getErrorObject(
              "InvalidTag",
              "Closing tag '" + tagName + "' can't have attributes or invalid starting.",
              getLineNumberForPosition(xmlData, tagStartPos),
            );
          } else if (tags.length === 0) {
            return getErrorObject(
              "InvalidTag",
              "Closing tag '" + tagName + "' has not been opened.",
              getLineNumberForPosition(xmlData, tagStartPos),
            );
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject(
                "InvalidTag",
                "Expected closing tag '" +
                  otg.tagName +
                  "' (opened in line " +
                  openPos.line +
                  ", col " +
                  openPos.col +
                  ") instead of closing tag '" +
                  tagName +
                  "'.",
                getLineNumberForPosition(xmlData, tagStartPos),
              );
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(
              isValid.err.code,
              isValid.err.msg,
              getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line),
            );
          }
          if (reachedRoot === true) {
            return getErrorObject(
              "InvalidXml",
              "Multiple possible root nodes found.",
              getLineNumberForPosition(xmlData, i),
            );
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
      return getErrorObject(
        "InvalidChar",
        "char '" + xmlData[i] + "' is not expected.",
        getLineNumberForPosition(xmlData, i),
      );
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject(
      "InvalidTag",
      "Unclosed tag '" + tags[0].tagName + "'.",
      getLineNumberForPosition(xmlData, tags[0].tagStartPos),
    );
  } else if (tags.length > 0) {
    return getErrorObject(
      "InvalidXml",
      "Invalid '" +
        JSON.stringify(
          tags.map((t) => t.tagName),
          null,
          4,
        ).replace(/\r?\n/g, "") +
        "' found.",
      { line: 1, col: 1 },
    );
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
        return getErrorObject(
          "InvalidXml",
          "XML declaration allowed only at the start of the document.",
          getLineNumberForPosition(xmlData, i),
        );
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
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === "D" &&
    xmlData[i + 2] === "O" &&
    xmlData[i + 3] === "C" &&
    xmlData[i + 4] === "T" &&
    xmlData[i + 5] === "Y" &&
    xmlData[i + 6] === "P" &&
    xmlData[i + 7] === "E"
  ) {
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
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === "[" &&
    xmlData[i + 2] === "C" &&
    xmlData[i + 3] === "D" &&
    xmlData[i + 4] === "A" &&
    xmlData[i + 5] === "T" &&
    xmlData[i + 6] === "A" &&
    xmlData[i + 7] === "["
  ) {
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
    tagClosed,
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject(
        "InvalidAttr",
        "Attribute '" + matches[i][2] + "' has no space in starting.",
        getPositionFromMatch(matches[i]),
      );
    } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
      return getErrorObject(
        "InvalidAttr",
        "Attribute '" + matches[i][2] + "' is without value.",
        getPositionFromMatch(matches[i]),
      );
    } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
      return getErrorObject(
        "InvalidAttr",
        "boolean attribute '" + matches[i][2] + "' is not allowed.",
        getPositionFromMatch(matches[i]),
      );
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject(
        "InvalidAttr",
        "Attribute '" + attrName + "' is an invalid name.",
        getPositionFromMatch(matches[i]),
      );
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject(
        "InvalidAttr",
        "Attribute '" + attrName + "' is repeated.",
        getPositionFromMatch(matches[i]),
      );
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
    if (xmlData[i] === ";") return i;
    if (!xmlData[i].match(re)) break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";") return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20) continue;
    if (xmlData[i] === ";") break;
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
      col: lineNumber.col,
    },
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
    col: lines[lines.length - 1].length + 1,
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

export { XMLParser };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL09wdGlvbnNCdWlsZGVyLmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3V0aWwuanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL3htbE5vZGUuanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL0RvY1R5cGVSZWFkZXIuanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0cm51bS9zdHJudW0uanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMvaWdub3JlQXR0cmlidXRlcy5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy94bWxwYXJzZXIvT3JkZXJlZE9ialBhcnNlci5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy94bWxwYXJzZXIvbm9kZTJqc29uLmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3ZhbGlkYXRvci5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy94bWxwYXJzZXIvWE1MUGFyc2VyLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJcbmV4cG9ydCBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBwcmVzZXJ2ZU9yZGVyOiBmYWxzZSxcbiAgICBhdHRyaWJ1dGVOYW1lUHJlZml4OiAnQF8nLFxuICAgIGF0dHJpYnV0ZXNHcm91cE5hbWU6IGZhbHNlLFxuICAgIHRleHROb2RlTmFtZTogJyN0ZXh0JyxcbiAgICBpZ25vcmVBdHRyaWJ1dGVzOiB0cnVlLFxuICAgIHJlbW92ZU5TUHJlZml4OiBmYWxzZSwgLy8gcmVtb3ZlIE5TIGZyb20gdGFnIG5hbWUgb3IgYXR0cmlidXRlIG5hbWUgaWYgdHJ1ZVxuICAgIGFsbG93Qm9vbGVhbkF0dHJpYnV0ZXM6IGZhbHNlLCAvL2EgdGFnIGNhbiBoYXZlIGF0dHJpYnV0ZXMgd2l0aG91dCBhbnkgdmFsdWVcbiAgICAvL2lnbm9yZVJvb3RFbGVtZW50IDogZmFsc2UsXG4gICAgcGFyc2VUYWdWYWx1ZTogdHJ1ZSxcbiAgICBwYXJzZUF0dHJpYnV0ZVZhbHVlOiBmYWxzZSxcbiAgICB0cmltVmFsdWVzOiB0cnVlLCAvL1RyaW0gc3RyaW5nIHZhbHVlcyBvZiB0YWcgYW5kIGF0dHJpYnV0ZXNcbiAgICBjZGF0YVByb3BOYW1lOiBmYWxzZSxcbiAgICBudW1iZXJQYXJzZU9wdGlvbnM6IHtcbiAgICAgIGhleDogdHJ1ZSxcbiAgICAgIGxlYWRpbmdaZXJvczogdHJ1ZSxcbiAgICAgIGVOb3RhdGlvbjogdHJ1ZVxuICAgIH0sXG4gICAgdGFnVmFsdWVQcm9jZXNzb3I6IGZ1bmN0aW9uKHRhZ05hbWUsIHZhbCkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuICAgIGF0dHJpYnV0ZVZhbHVlUHJvY2Vzc29yOiBmdW5jdGlvbihhdHRyTmFtZSwgdmFsKSB7XG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG4gICAgc3RvcE5vZGVzOiBbXSwgLy9uZXN0ZWQgdGFncyB3aWxsIG5vdCBiZSBwYXJzZWQgZXZlbiBmb3IgZXJyb3JzXG4gICAgYWx3YXlzQ3JlYXRlVGV4dE5vZGU6IGZhbHNlLFxuICAgIGlzQXJyYXk6ICgpID0+IGZhbHNlLFxuICAgIGNvbW1lbnRQcm9wTmFtZTogZmFsc2UsXG4gICAgdW5wYWlyZWRUYWdzOiBbXSxcbiAgICBwcm9jZXNzRW50aXRpZXM6IHRydWUsXG4gICAgaHRtbEVudGl0aWVzOiBmYWxzZSxcbiAgICBpZ25vcmVEZWNsYXJhdGlvbjogZmFsc2UsXG4gICAgaWdub3JlUGlUYWdzOiBmYWxzZSxcbiAgICB0cmFuc2Zvcm1UYWdOYW1lOiBmYWxzZSxcbiAgICB0cmFuc2Zvcm1BdHRyaWJ1dGVOYW1lOiBmYWxzZSxcbiAgICB1cGRhdGVUYWc6IGZ1bmN0aW9uKHRhZ05hbWUsIGpQYXRoLCBhdHRycyl7XG4gICAgICByZXR1cm4gdGFnTmFtZVxuICAgIH0sXG4gICAgLy8gc2tpcEVtcHR5TGlzdEl0ZW06IGZhbHNlXG4gICAgY2FwdHVyZU1ldGFEYXRhOiBmYWxzZSxcbn07XG4gICBcbmV4cG9ydCBjb25zdCBidWlsZE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbn07XG4iLCAiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBuYW1lU3RhcnRDaGFyID0gJzpBLVphLXpfXFxcXHUwMEMwLVxcXFx1MDBENlxcXFx1MDBEOC1cXFxcdTAwRjZcXFxcdTAwRjgtXFxcXHUwMkZGXFxcXHUwMzcwLVxcXFx1MDM3RFxcXFx1MDM3Ri1cXFxcdTFGRkZcXFxcdTIwMEMtXFxcXHUyMDBEXFxcXHUyMDcwLVxcXFx1MjE4RlxcXFx1MkMwMC1cXFxcdTJGRUZcXFxcdTMwMDEtXFxcXHVEN0ZGXFxcXHVGOTAwLVxcXFx1RkRDRlxcXFx1RkRGMC1cXFxcdUZGRkQnO1xuY29uc3QgbmFtZUNoYXIgPSBuYW1lU3RhcnRDaGFyICsgJ1xcXFwtLlxcXFxkXFxcXHUwMEI3XFxcXHUwMzAwLVxcXFx1MDM2RlxcXFx1MjAzRi1cXFxcdTIwNDAnO1xuZXhwb3J0IGNvbnN0IG5hbWVSZWdleHAgPSAnWycgKyBuYW1lU3RhcnRDaGFyICsgJ11bJyArIG5hbWVDaGFyICsgJ10qJztcbmNvbnN0IHJlZ2V4TmFtZSA9IG5ldyBSZWdFeHAoJ14nICsgbmFtZVJlZ2V4cCArICckJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxNYXRjaGVzKHN0cmluZywgcmVnZXgpIHtcbiAgY29uc3QgbWF0Y2hlcyA9IFtdO1xuICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKHN0cmluZyk7XG4gIHdoaWxlIChtYXRjaCkge1xuICAgIGNvbnN0IGFsbG1hdGNoZXMgPSBbXTtcbiAgICBhbGxtYXRjaGVzLnN0YXJ0SW5kZXggPSByZWdleC5sYXN0SW5kZXggLSBtYXRjaFswXS5sZW5ndGg7XG4gICAgY29uc3QgbGVuID0gbWF0Y2gubGVuZ3RoO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsZW47IGluZGV4KyspIHtcbiAgICAgIGFsbG1hdGNoZXMucHVzaChtYXRjaFtpbmRleF0pO1xuICAgIH1cbiAgICBtYXRjaGVzLnB1c2goYWxsbWF0Y2hlcyk7XG4gICAgbWF0Y2ggPSByZWdleC5leGVjKHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbmV4cG9ydCBjb25zdCBpc05hbWUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgY29uc3QgbWF0Y2ggPSByZWdleE5hbWUuZXhlYyhzdHJpbmcpO1xuICByZXR1cm4gIShtYXRjaCA9PT0gbnVsbCB8fCB0eXBlb2YgbWF0Y2ggPT09ICd1bmRlZmluZWQnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhpc3Qodikge1xuICByZXR1cm4gdHlwZW9mIHYgIT09ICd1bmRlZmluZWQnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbXB0eU9iamVjdChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuXG4vKipcbiAqIENvcHkgYWxsIHRoZSBwcm9wZXJ0aWVzIG9mIGEgaW50byBiLlxuICogQHBhcmFtIHsqfSB0YXJnZXRcbiAqIEBwYXJhbSB7Kn0gYVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2UodGFyZ2V0LCBhLCBhcnJheU1vZGUpIHtcbiAgaWYgKGEpIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYSk7IC8vIHdpbGwgcmV0dXJuIGFuIGFycmF5IG9mIG93biBwcm9wZXJ0aWVzXG4gICAgY29uc3QgbGVuID0ga2V5cy5sZW5ndGg7IC8vZG9uJ3QgbWFrZSBpdCBpbmxpbmVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlNb2RlID09PSAnc3RyaWN0Jykge1xuICAgICAgICB0YXJnZXRba2V5c1tpXV0gPSBbIGFba2V5c1tpXV0gXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFtrZXlzW2ldXSA9IGFba2V5c1tpXV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4vKiBleHBvcnRzLm1lcmdlID1mdW5jdGlvbiAoYixhKXtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oYixhKTtcbn0gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlKHYpIHtcbiAgaWYgKGV4cG9ydHMuaXNFeGlzdCh2KSkge1xuICAgIHJldHVybiB2O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnJztcbiAgfVxufVxuXG4vLyBjb25zdCBmYWtlQ2FsbCA9IGZ1bmN0aW9uKGEpIHtyZXR1cm4gYTt9O1xuLy8gY29uc3QgZmFrZUNhbGxOb1JldHVybiA9IGZ1bmN0aW9uKCkge307IiwgIid1c2Ugc3RyaWN0JztcblxubGV0IE1FVEFEQVRBX1NZTUJPTDtcblxuaWYgKHR5cGVvZiBTeW1ib2wgIT09IFwiZnVuY3Rpb25cIikge1xuICBNRVRBREFUQV9TWU1CT0wgPSBcIkBAeG1sTWV0YWRhdGFcIjtcbn0gZWxzZSB7XG4gIE1FVEFEQVRBX1NZTUJPTCA9IFN5bWJvbChcIlhNTCBOb2RlIE1ldGFkYXRhXCIpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBYbWxOb2Rle1xuICBjb25zdHJ1Y3Rvcih0YWduYW1lKSB7XG4gICAgdGhpcy50YWduYW1lID0gdGFnbmFtZTtcbiAgICB0aGlzLmNoaWxkID0gW107IC8vbmVzdGVkIHRhZ3MsIHRleHQsIGNkYXRhLCBjb21tZW50cyBpbiBvcmRlclxuICAgIHRoaXNbXCI6QFwiXSA9IHt9OyAvL2F0dHJpYnV0ZXMgbWFwXG4gIH1cbiAgYWRkKGtleSx2YWwpe1xuICAgIC8vIHRoaXMuY2hpbGQucHVzaCgge25hbWUgOiBrZXksIHZhbDogdmFsLCBpc0NkYXRhOiBpc0NkYXRhIH0pO1xuICAgIGlmKGtleSA9PT0gXCJfX3Byb3RvX19cIikga2V5ID0gXCIjX19wcm90b19fXCI7XG4gICAgdGhpcy5jaGlsZC5wdXNoKCB7W2tleV06IHZhbCB9KTtcbiAgfVxuICBhZGRDaGlsZChub2RlLCBzdGFydEluZGV4KSB7XG4gICAgaWYobm9kZS50YWduYW1lID09PSBcIl9fcHJvdG9fX1wiKSBub2RlLnRhZ25hbWUgPSBcIiNfX3Byb3RvX19cIjtcbiAgICBpZihub2RlW1wiOkBcIl0gJiYgT2JqZWN0LmtleXMobm9kZVtcIjpAXCJdKS5sZW5ndGggPiAwKXtcbiAgICAgIHRoaXMuY2hpbGQucHVzaCggeyBbbm9kZS50YWduYW1lXTogbm9kZS5jaGlsZCwgW1wiOkBcIl06IG5vZGVbXCI6QFwiXSB9KTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuY2hpbGQucHVzaCggeyBbbm9kZS50YWduYW1lXTogbm9kZS5jaGlsZCB9KTtcbiAgICB9XG4gICAgLy8gaWYgcmVxdWVzdGVkLCBhZGQgdGhlIHN0YXJ0SW5kZXhcbiAgICBpZiAoc3RhcnRJbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBOb3RlOiBmb3Igbm93IHdlIGp1c3Qgb3ZlcndyaXRlIHRoZSBtZXRhZGF0YS4gSWYgd2UgaGFkIG1vcmUgY29tcGxleCBtZXRhZGF0YSxcbiAgICAgIC8vIHdlIG1pZ2h0IG5lZWQgdG8gZG8gYW4gb2JqZWN0IGFwcGVuZCBoZXJlOiAgbWV0YWRhdGEgPSB7IC4uLm1ldGFkYXRhLCBzdGFydEluZGV4IH1cbiAgICAgIHRoaXMuY2hpbGRbdGhpcy5jaGlsZC5sZW5ndGggLSAxXVtNRVRBREFUQV9TWU1CT0xdID0geyBzdGFydEluZGV4IH07XG4gICAgfVxuICB9XG4gIC8qKiBzeW1ib2wgdXNlZCBmb3IgbWV0YWRhdGEgKi9cbiAgc3RhdGljIGdldE1ldGFEYXRhU3ltYm9sKCkge1xuICAgIHJldHVybiBNRVRBREFUQV9TWU1CT0w7XG4gIH1cbn1cbiIsICJpbXBvcnQge2lzTmFtZX0gZnJvbSAnLi4vdXRpbC5qcyc7XG5cbi8vVE9ETzogaGFuZGxlIGNvbW1lbnRzXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZWFkRG9jVHlwZSh4bWxEYXRhLCBpKXtcbiAgICBcbiAgICBjb25zdCBlbnRpdGllcyA9IHt9O1xuICAgIGlmKCB4bWxEYXRhW2kgKyAzXSA9PT0gJ08nICYmXG4gICAgICAgICB4bWxEYXRhW2kgKyA0XSA9PT0gJ0MnICYmXG4gICAgICAgICB4bWxEYXRhW2kgKyA1XSA9PT0gJ1QnICYmXG4gICAgICAgICB4bWxEYXRhW2kgKyA2XSA9PT0gJ1knICYmXG4gICAgICAgICB4bWxEYXRhW2kgKyA3XSA9PT0gJ1AnICYmXG4gICAgICAgICB4bWxEYXRhW2kgKyA4XSA9PT0gJ0UnKVxuICAgIHsgICAgXG4gICAgICAgIGkgPSBpKzk7XG4gICAgICAgIGxldCBhbmdsZUJyYWNrZXRzQ291bnQgPSAxO1xuICAgICAgICBsZXQgaGFzQm9keSA9IGZhbHNlLCBjb21tZW50ID0gZmFsc2U7XG4gICAgICAgIGxldCBleHAgPSBcIlwiO1xuICAgICAgICBmb3IoO2k8eG1sRGF0YS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcgJiYgIWNvbW1lbnQpIHsgLy9EZXRlcm1pbmUgdGhlIHRhZyB0eXBlXG4gICAgICAgICAgICAgICAgaWYoIGhhc0JvZHkgJiYgaGFzU2VxKHhtbERhdGEsIFwiIUVOVElUWVwiLGkpKXtcbiAgICAgICAgICAgICAgICAgICAgaSArPSA3OyBcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVudGl0eU5hbWUsIHZhbDtcbiAgICAgICAgICAgICAgICAgICAgW2VudGl0eU5hbWUsIHZhbCxpXSA9IHJlYWRFbnRpdHlFeHAoeG1sRGF0YSxpKzEpO1xuICAgICAgICAgICAgICAgICAgICBpZih2YWwuaW5kZXhPZihcIiZcIikgPT09IC0xKSAvL1BhcmFtZXRlciBlbnRpdGllcyBhcmUgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50aXRpZXNbIGVudGl0eU5hbWUgXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWd4IDogUmVnRXhwKCBgJiR7ZW50aXR5TmFtZX07YCxcImdcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsOiB2YWxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIGhhc0JvZHkgJiYgaGFzU2VxKHhtbERhdGEsIFwiIUVMRU1FTlRcIixpKSkgIHtcbiAgICAgICAgICAgICAgICAgICAgaSArPSA4Oy8vTm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7aW5kZXh9ID0gcmVhZEVsZW1lbnRFeHAoeG1sRGF0YSxpKzEpO1xuICAgICAgICAgICAgICAgICAgICBpID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoIGhhc0JvZHkgJiYgaGFzU2VxKHhtbERhdGEsIFwiIUFUVExJU1RcIixpKSl7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gODsvL05vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3Qge2luZGV4fSA9IHJlYWRBdHRsaXN0RXhwKHhtbERhdGEsaSsxKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaSA9IGluZGV4O1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKCBoYXNCb2R5ICYmIGhhc1NlcSh4bWxEYXRhLCBcIiFOT1RBVElPTlwiLGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gOTsvL05vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2luZGV4fSA9IHJlYWROb3RhdGlvbkV4cCh4bWxEYXRhLGkrMSk7XG4gICAgICAgICAgICAgICAgICAgIGkgPSBpbmRleDtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZiggaGFzU2VxKHhtbERhdGEsIFwiIS0tXCIsaSkgKSBjb21tZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgRE9DVFlQRVwiKTtcblxuICAgICAgICAgICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudCsrO1xuICAgICAgICAgICAgICAgIGV4cCA9IFwiXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT09ICc+JykgeyAvL1JlYWQgdGFnIGNvbnRlbnRcbiAgICAgICAgICAgICAgICBpZihjb21tZW50KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIHhtbERhdGFbaSAtIDFdID09PSBcIi1cIiAmJiB4bWxEYXRhW2kgLSAyXSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5nbGVCcmFja2V0c0NvdW50LS07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgYW5nbGVCcmFja2V0c0NvdW50LS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhbmdsZUJyYWNrZXRzQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1lbHNlIGlmKCB4bWxEYXRhW2ldID09PSAnWycpe1xuICAgICAgICAgICAgICAgIGhhc0JvZHkgPSB0cnVlO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZXhwICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoYW5nbGVCcmFja2V0c0NvdW50ICE9PSAwKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5jbG9zZWQgRE9DVFlQRWApO1xuICAgICAgICB9XG4gICAgfWVsc2V7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUYWcgaW5zdGVhZCBvZiBET0NUWVBFYCk7XG4gICAgfVxuICAgIHJldHVybiB7ZW50aXRpZXMsIGl9O1xufVxuXG5jb25zdCBza2lwV2hpdGVzcGFjZSA9IChkYXRhLCBpbmRleCkgPT4ge1xuICAgIHdoaWxlIChpbmRleCA8IGRhdGEubGVuZ3RoICYmIC9cXHMvLnRlc3QoZGF0YVtpbmRleF0pKSB7XG4gICAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbn07XG5cbmZ1bmN0aW9uIHJlYWRFbnRpdHlFeHAoeG1sRGF0YSwgaSkgeyAgICBcbiAgICAvL0V4dGVybmFsIGVudGl0aWVzIGFyZSBub3Qgc3VwcG9ydGVkXG4gICAgLy8gICAgPCFFTlRJVFkgZXh0IFNZU1RFTSBcImh0dHA6Ly9ub3JtYWwtd2Vic2l0ZS5jb21cIiA+XG5cbiAgICAvL1BhcmFtZXRlciBlbnRpdGllcyBhcmUgbm90IHN1cHBvcnRlZFxuICAgIC8vICAgIDwhRU5USVRZIGVudGl0eW5hbWUgXCImYW5vdGhlckVsZW1lbnQ7XCI+XG5cbiAgICAvL0ludGVybmFsIGVudGl0aWVzIGFyZSBzdXBwb3J0ZWRcbiAgICAvLyAgICA8IUVOVElUWSBlbnRpdHluYW1lIFwicmVwbGFjZW1lbnQgdGV4dFwiPlxuXG4gICAgLy8gU2tpcCBsZWFkaW5nIHdoaXRlc3BhY2UgYWZ0ZXIgPCFFTlRJVFlcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIGVudGl0eSBuYW1lXG4gICAgbGV0IGVudGl0eU5hbWUgPSBcIlwiO1xuICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkgJiYgeG1sRGF0YVtpXSAhPT0gJ1wiJyAmJiB4bWxEYXRhW2ldICE9PSBcIidcIikge1xuICAgICAgICBlbnRpdHlOYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgdmFsaWRhdGVFbnRpdHlOYW1lKGVudGl0eU5hbWUpO1xuXG4gICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGVudGl0eSBuYW1lXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gQ2hlY2sgZm9yIHVuc3VwcG9ydGVkIGNvbnN0cnVjdHMgKGV4dGVybmFsIGVudGl0aWVzIG9yIHBhcmFtZXRlciBlbnRpdGllcylcbiAgICBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDYpLnRvVXBwZXJDYXNlKCkgPT09IFwiU1lTVEVNXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXh0ZXJuYWwgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgfWVsc2UgaWYgKHhtbERhdGFbaV0gPT09IFwiJVwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmFtZXRlciBlbnRpdGllcyBhcmUgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICAvLyBSZWFkIGVudGl0eSB2YWx1ZSAoaW50ZXJuYWwgZW50aXR5KVxuICAgIGxldCBlbnRpdHlWYWx1ZSA9IFwiXCI7XG4gICAgW2ksIGVudGl0eVZhbHVlXSA9IHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwiZW50aXR5XCIpO1xuICAgIGktLTtcbiAgICByZXR1cm4gW2VudGl0eU5hbWUsIGVudGl0eVZhbHVlLCBpIF07XG59XG5cbmZ1bmN0aW9uIHJlYWROb3RhdGlvbkV4cCh4bWxEYXRhLCBpKSB7XG4gICAgLy8gU2tpcCBsZWFkaW5nIHdoaXRlc3BhY2UgYWZ0ZXIgPCFOT1RBVElPTlxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIFJlYWQgbm90YXRpb24gbmFtZVxuICAgIGxldCBub3RhdGlvbk5hbWUgPSBcIlwiO1xuICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgbm90YXRpb25OYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgdmFsaWRhdGVFbnRpdHlOYW1lKG5vdGF0aW9uTmFtZSk7XG5cbiAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgbm90YXRpb24gbmFtZVxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIENoZWNrIGlkZW50aWZpZXIgdHlwZSAoU1lTVEVNIG9yIFBVQkxJQylcbiAgICBjb25zdCBpZGVudGlmaWVyVHlwZSA9IHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA2KS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChpZGVudGlmaWVyVHlwZSAhPT0gXCJTWVNURU1cIiAmJiBpZGVudGlmaWVyVHlwZSAhPT0gXCJQVUJMSUNcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIFNZU1RFTSBvciBQVUJMSUMsIGZvdW5kIFwiJHtpZGVudGlmaWVyVHlwZX1cImApO1xuICAgIH1cbiAgICBpICs9IGlkZW50aWZpZXJUeXBlLmxlbmd0aDtcblxuICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBpZGVudGlmaWVyIHR5cGVcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIHB1YmxpYyBpZGVudGlmaWVyIChpZiBQVUJMSUMpXG4gICAgbGV0IHB1YmxpY0lkZW50aWZpZXIgPSBudWxsO1xuICAgIGxldCBzeXN0ZW1JZGVudGlmaWVyID0gbnVsbDtcblxuICAgIGlmIChpZGVudGlmaWVyVHlwZSA9PT0gXCJQVUJMSUNcIikge1xuICAgICAgICBbaSwgcHVibGljSWRlbnRpZmllciBdID0gcmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSwgXCJwdWJsaWNJZGVudGlmaWVyXCIpO1xuXG4gICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBwdWJsaWMgaWRlbnRpZmllclxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gT3B0aW9uYWxseSByZWFkIHN5c3RlbSBpZGVudGlmaWVyXG4gICAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnXCInIHx8IHhtbERhdGFbaV0gPT09IFwiJ1wiKSB7XG4gICAgICAgICAgICBbaSwgc3lzdGVtSWRlbnRpZmllciBdID0gcmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSxcInN5c3RlbUlkZW50aWZpZXJcIik7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlkZW50aWZpZXJUeXBlID09PSBcIlNZU1RFTVwiKSB7XG4gICAgICAgIC8vIFJlYWQgc3lzdGVtIGlkZW50aWZpZXIgKG1hbmRhdG9yeSBmb3IgU1lTVEVNKVxuICAgICAgICBbaSwgc3lzdGVtSWRlbnRpZmllciBdID0gcmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSwgXCJzeXN0ZW1JZGVudGlmaWVyXCIpO1xuXG4gICAgICAgIGlmICghc3lzdGVtSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBtYW5kYXRvcnkgc3lzdGVtIGlkZW50aWZpZXIgZm9yIFNZU1RFTSBub3RhdGlvblwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge25vdGF0aW9uTmFtZSwgcHVibGljSWRlbnRpZmllciwgc3lzdGVtSWRlbnRpZmllciwgaW5kZXg6IC0taX07XG59XG5cbmZ1bmN0aW9uIHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIHR5cGUpIHtcbiAgICBsZXQgaWRlbnRpZmllclZhbCA9IFwiXCI7XG4gICAgY29uc3Qgc3RhcnRDaGFyID0geG1sRGF0YVtpXTtcbiAgICBpZiAoc3RhcnRDaGFyICE9PSAnXCInICYmIHN0YXJ0Q2hhciAhPT0gXCInXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBxdW90ZWQgc3RyaW5nLCBmb3VuZCBcIiR7c3RhcnRDaGFyfVwiYCk7XG4gICAgfVxuICAgIGkrKztcblxuICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgeG1sRGF0YVtpXSAhPT0gc3RhcnRDaGFyKSB7XG4gICAgICAgIGlkZW50aWZpZXJWYWwgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICh4bWxEYXRhW2ldICE9PSBzdGFydENoYXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnRlcm1pbmF0ZWQgJHt0eXBlfSB2YWx1ZWApO1xuICAgIH1cbiAgICBpKys7XG4gICAgcmV0dXJuIFtpLCBpZGVudGlmaWVyVmFsXTtcbn1cblxuZnVuY3Rpb24gcmVhZEVsZW1lbnRFeHAoeG1sRGF0YSwgaSkge1xuICAgIC8vIDwhRUxFTUVOVCBiciBFTVBUWT5cbiAgICAvLyA8IUVMRU1FTlQgZGl2IEFOWT5cbiAgICAvLyA8IUVMRU1FTlQgdGl0bGUgKCNQQ0RBVEEpPlxuICAgIC8vIDwhRUxFTUVOVCBib29rICh0aXRsZSwgYXV0aG9yKyk+XG4gICAgLy8gPCFFTEVNRU5UIG5hbWUgKGNvbnRlbnQtbW9kZWwpPlxuICAgIFxuICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhRUxFTUVOVFxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgIC8vIFJlYWQgZWxlbWVudCBuYW1lXG4gICAgbGV0IGVsZW1lbnROYW1lID0gXCJcIjtcbiAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgIGVsZW1lbnROYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBlbGVtZW50IG5hbWVcbiAgICBpZiAoIXZhbGlkYXRlRW50aXR5TmFtZShlbGVtZW50TmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVsZW1lbnQgbmFtZTogXCIke2VsZW1lbnROYW1lfVwiYCk7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGVsZW1lbnQgbmFtZVxuICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcbiAgICBsZXQgY29udGVudE1vZGVsID0gXCJcIjtcbiAgICAvLyBFeHBlY3QgJygnIHRvIHN0YXJ0IGNvbnRlbnQgbW9kZWxcbiAgICBpZih4bWxEYXRhW2ldID09PSBcIkVcIiAmJiBoYXNTZXEoeG1sRGF0YSwgXCJNUFRZXCIsaSkpIGkrPTY7XG4gICAgZWxzZSBpZih4bWxEYXRhW2ldID09PSBcIkFcIiAmJiBoYXNTZXEoeG1sRGF0YSwgXCJOWVwiLGkpKSBpKz00O1xuICAgIGVsc2UgaWYgKHhtbERhdGFbaV0gPT09IFwiKFwiKSB7XG4gICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICcoJ1xuXG4gICAgICAgIC8vIFJlYWQgY29udGVudCBtb2RlbFxuICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmIHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICBjb250ZW50TW9kZWwgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAoeG1sRGF0YVtpXSAhPT0gXCIpXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVudGVybWluYXRlZCBjb250ZW50IG1vZGVsXCIpO1xuICAgICAgICB9XG5cbiAgICB9ZWxzZXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEVsZW1lbnQgRXhwcmVzc2lvbiwgZm91bmQgXCIke3htbERhdGFbaV19XCJgKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudE5hbWUsXG4gICAgICAgIGNvbnRlbnRNb2RlbDogY29udGVudE1vZGVsLnRyaW0oKSxcbiAgICAgICAgaW5kZXg6IGlcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFkQXR0bGlzdEV4cCh4bWxEYXRhLCBpKSB7XG4gICAgLy8gU2tpcCBsZWFkaW5nIHdoaXRlc3BhY2UgYWZ0ZXIgPCFBVFRMSVNUXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBlbGVtZW50IG5hbWVcbiAgICBsZXQgZWxlbWVudE5hbWUgPSBcIlwiO1xuICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgZWxlbWVudE5hbWUgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGVsZW1lbnQgbmFtZVxuICAgIHZhbGlkYXRlRW50aXR5TmFtZShlbGVtZW50TmFtZSlcblxuICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBlbGVtZW50IG5hbWVcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIGF0dHJpYnV0ZSBuYW1lXG4gICAgbGV0IGF0dHJpYnV0ZU5hbWUgPSBcIlwiO1xuICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgYXR0cmlidXRlTmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgYXR0cmlidXRlIG5hbWVcbiAgICBpZiAoIXZhbGlkYXRlRW50aXR5TmFtZShhdHRyaWJ1dGVOYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXR0cmlidXRlIG5hbWU6IFwiJHthdHRyaWJ1dGVOYW1lfVwiYCk7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGF0dHJpYnV0ZSBuYW1lXG4gICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgLy8gUmVhZCBhdHRyaWJ1dGUgdHlwZVxuICAgIGxldCBhdHRyaWJ1dGVUeXBlID0gXCJcIjtcbiAgICBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDgpLnRvVXBwZXJDYXNlKCkgPT09IFwiTk9UQVRJT05cIikge1xuICAgICAgICBhdHRyaWJ1dGVUeXBlID0gXCJOT1RBVElPTlwiO1xuICAgICAgICBpICs9IDg7IC8vIE1vdmUgcGFzdCBcIk5PVEFUSU9OXCJcblxuICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgXCJOT1RBVElPTlwiXG4gICAgICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgICAgICAvLyBFeHBlY3QgJygnIHRvIHN0YXJ0IHRoZSBsaXN0IG9mIG5vdGF0aW9uc1xuICAgICAgICBpZiAoeG1sRGF0YVtpXSAhPT0gXCIoXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgJygnLCBmb3VuZCBcIiR7eG1sRGF0YVtpXX1cImApO1xuICAgICAgICB9XG4gICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICcoJ1xuXG4gICAgICAgIC8vIFJlYWQgdGhlIGxpc3Qgb2YgYWxsb3dlZCBub3RhdGlvbnNcbiAgICAgICAgbGV0IGFsbG93ZWROb3RhdGlvbnMgPSBbXTtcbiAgICAgICAgd2hpbGUgKGkgPCB4bWxEYXRhLmxlbmd0aCAmJiB4bWxEYXRhW2ldICE9PSBcIilcIikge1xuICAgICAgICAgICAgbGV0IG5vdGF0aW9uID0gXCJcIjtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgeG1sRGF0YVtpXSAhPT0gXCJ8XCIgJiYgeG1sRGF0YVtpXSAhPT0gXCIpXCIpIHtcbiAgICAgICAgICAgICAgICBub3RhdGlvbiArPSB4bWxEYXRhW2ldO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgbm90YXRpb24gbmFtZVxuICAgICAgICAgICAgbm90YXRpb24gPSBub3RhdGlvbi50cmltKCk7XG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRlRW50aXR5TmFtZShub3RhdGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbm90YXRpb24gbmFtZTogXCIke25vdGF0aW9ufVwiYCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFsbG93ZWROb3RhdGlvbnMucHVzaChub3RhdGlvbik7XG5cbiAgICAgICAgICAgIC8vIFNraXAgJ3wnIHNlcGFyYXRvciBvciBleGl0IGxvb3BcbiAgICAgICAgICAgIGlmICh4bWxEYXRhW2ldID09PSBcInxcIikge1xuICAgICAgICAgICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICd8J1xuICAgICAgICAgICAgICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTsgLy8gU2tpcCBvcHRpb25hbCB3aGl0ZXNwYWNlIGFmdGVyICd8J1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnRlcm1pbmF0ZWQgbGlzdCBvZiBub3RhdGlvbnNcIik7XG4gICAgICAgIH1cbiAgICAgICAgaSsrOyAvLyBNb3ZlIHBhc3QgJyknXG5cbiAgICAgICAgLy8gU3RvcmUgdGhlIGFsbG93ZWQgbm90YXRpb25zIGFzIHBhcnQgb2YgdGhlIGF0dHJpYnV0ZSB0eXBlXG4gICAgICAgIGF0dHJpYnV0ZVR5cGUgKz0gXCIgKFwiICsgYWxsb3dlZE5vdGF0aW9ucy5qb2luKFwifFwiKSArIFwiKVwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhbmRsZSBzaW1wbGUgdHlwZXMgKGUuZy4sIENEQVRBLCBJRCwgSURSRUYsIGV0Yy4pXG4gICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVR5cGUgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHNpbXBsZSBhdHRyaWJ1dGUgdHlwZVxuICAgICAgICBjb25zdCB2YWxpZFR5cGVzID0gW1wiQ0RBVEFcIiwgXCJJRFwiLCBcIklEUkVGXCIsIFwiSURSRUZTXCIsIFwiRU5USVRZXCIsIFwiRU5USVRJRVNcIiwgXCJOTVRPS0VOXCIsIFwiTk1UT0tFTlNcIl07XG4gICAgICAgIGlmICghdmFsaWRUeXBlcy5pbmNsdWRlcyhhdHRyaWJ1dGVUeXBlLnRvVXBwZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXR0cmlidXRlIHR5cGU6IFwiJHthdHRyaWJ1dGVUeXBlfVwiYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgYXR0cmlidXRlIHR5cGVcbiAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAvLyBSZWFkIGRlZmF1bHQgdmFsdWVcbiAgICBsZXQgZGVmYXVsdFZhbHVlID0gXCJcIjtcbiAgICBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDgpLnRvVXBwZXJDYXNlKCkgPT09IFwiI1JFUVVJUkVEXCIpIHtcbiAgICAgICAgZGVmYXVsdFZhbHVlID0gXCIjUkVRVUlSRURcIjtcbiAgICAgICAgaSArPSA4O1xuICAgIH0gZWxzZSBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDcpLnRvVXBwZXJDYXNlKCkgPT09IFwiI0lNUExJRURcIikge1xuICAgICAgICBkZWZhdWx0VmFsdWUgPSBcIiNJTVBMSUVEXCI7XG4gICAgICAgIGkgKz0gNztcbiAgICB9IGVsc2Uge1xuICAgICAgICBbaSwgZGVmYXVsdFZhbHVlXSA9IHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwiQVRUTElTVFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50TmFtZSxcbiAgICAgICAgYXR0cmlidXRlTmFtZSxcbiAgICAgICAgYXR0cmlidXRlVHlwZSxcbiAgICAgICAgZGVmYXVsdFZhbHVlLFxuICAgICAgICBpbmRleDogaVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzU2VxKGRhdGEsIHNlcSxpKXtcbiAgICBmb3IobGV0IGo9MDtqPHNlcS5sZW5ndGg7aisrKXtcbiAgICAgICAgaWYoc2VxW2pdIT09ZGF0YVtpK2orMV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRW50aXR5TmFtZShuYW1lKXtcbiAgICBpZiAoaXNOYW1lKG5hbWUpKVxuXHRyZXR1cm4gbmFtZTtcbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBlbnRpdHkgbmFtZSAke25hbWV9YCk7XG59XG4iLCAiY29uc3QgaGV4UmVnZXggPSAvXlstK10/MHhbYS1mQS1GMC05XSskLztcbmNvbnN0IG51bVJlZ2V4ID0gL14oW1xcLVxcK10pPygwKikoWzAtOV0qKFxcLlswLTldKik/KSQvO1xuLy8gY29uc3Qgb2N0UmVnZXggPSAvXjB4W2EtejAtOV0rLztcbi8vIGNvbnN0IGJpblJlZ2V4ID0gLzB4W2EtejAtOV0rLztcblxuIFxuY29uc3QgY29uc2lkZXIgPSB7XG4gICAgaGV4IDogIHRydWUsXG4gICAgLy8gb2N0OiBmYWxzZSxcbiAgICBsZWFkaW5nWmVyb3M6IHRydWUsXG4gICAgZGVjaW1hbFBvaW50OiBcIlxcLlwiLFxuICAgIGVOb3RhdGlvbjogdHJ1ZSxcbiAgICAvL3NraXBMaWtlOiAvcmVnZXgvXG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0b051bWJlcihzdHIsIG9wdGlvbnMgPSB7fSl7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGNvbnNpZGVyLCBvcHRpb25zICk7XG4gICAgaWYoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSBcInN0cmluZ1wiICkgcmV0dXJuIHN0cjtcbiAgICBcbiAgICBsZXQgdHJpbW1lZFN0ciAgPSBzdHIudHJpbSgpO1xuICAgIFxuICAgIGlmKG9wdGlvbnMuc2tpcExpa2UgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnNraXBMaWtlLnRlc3QodHJpbW1lZFN0cikpIHJldHVybiBzdHI7XG4gICAgZWxzZSBpZihzdHI9PT1cIjBcIikgcmV0dXJuIDA7XG4gICAgZWxzZSBpZiAob3B0aW9ucy5oZXggJiYgaGV4UmVnZXgudGVzdCh0cmltbWVkU3RyKSkge1xuICAgICAgICByZXR1cm4gcGFyc2VfaW50KHRyaW1tZWRTdHIsIDE2KTtcbiAgICAvLyB9ZWxzZSBpZiAob3B0aW9ucy5vY3QgJiYgb2N0UmVnZXgudGVzdChzdHIpKSB7XG4gICAgLy8gICAgIHJldHVybiBOdW1iZXIucGFyc2VJbnQodmFsLCA4KTtcbiAgICB9ZWxzZSBpZiAodHJpbW1lZFN0ci5zZWFyY2goLy4rW2VFXS4rLykhPT0gLTEpIHsgLy9lTm90YXRpb25cbiAgICAgICAgcmV0dXJuIHJlc29sdmVFbm90YXRpb24oc3RyLHRyaW1tZWRTdHIsb3B0aW9ucyk7XG4gICAgLy8gfWVsc2UgaWYgKG9wdGlvbnMucGFyc2VCaW4gJiYgYmluUmVnZXgudGVzdChzdHIpKSB7XG4gICAgLy8gICAgIHJldHVybiBOdW1iZXIucGFyc2VJbnQodmFsLCAyKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgLy9zZXBhcmF0ZSBuZWdhdGl2ZSBzaWduLCBsZWFkaW5nIHplcm9zLCBhbmQgcmVzdCBudW1iZXJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBudW1SZWdleC5leGVjKHRyaW1tZWRTdHIpO1xuICAgICAgICAvLyArMDAuMTIzID0+IFsgLCAnKycsICcwMCcsICcuMTIzJywgLi5cbiAgICAgICAgaWYobWF0Y2gpe1xuICAgICAgICAgICAgY29uc3Qgc2lnbiA9IG1hdGNoWzFdIHx8IFwiXCI7XG4gICAgICAgICAgICBjb25zdCBsZWFkaW5nWmVyb3MgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgIGxldCBudW1UcmltbWVkQnlaZXJvcyA9IHRyaW1aZXJvcyhtYXRjaFszXSk7IC8vY29tcGxldGUgbnVtIHdpdGhvdXQgbGVhZGluZyB6ZXJvc1xuICAgICAgICAgICAgY29uc3QgZGVjaW1hbEFkamFjZW50VG9MZWFkaW5nWmVyb3MgPSBzaWduID8gLy8gMC4sIC0wMC4sIDAwMC5cbiAgICAgICAgICAgICAgICBzdHJbbGVhZGluZ1plcm9zLmxlbmd0aCsxXSA9PT0gXCIuXCIgXG4gICAgICAgICAgICAgICAgOiBzdHJbbGVhZGluZ1plcm9zLmxlbmd0aF0gPT09IFwiLlwiO1xuXG4gICAgICAgICAgICAvL3RyaW0gZW5kaW5nIHplcm9zIGZvciBmbG9hdGluZyBudW1iZXJcbiAgICAgICAgICAgIGlmKCFvcHRpb25zLmxlYWRpbmdaZXJvcyAvL2xlYWRpbmcgemVyb3MgYXJlIG5vdCBhbGxvd2VkXG4gICAgICAgICAgICAgICAgJiYgKGxlYWRpbmdaZXJvcy5sZW5ndGggPiAxIFxuICAgICAgICAgICAgICAgICAgICB8fCAobGVhZGluZ1plcm9zLmxlbmd0aCA9PT0gMSAmJiAhZGVjaW1hbEFkamFjZW50VG9MZWFkaW5nWmVyb3MpKSl7XG4gICAgICAgICAgICAgICAgLy8gMDAsIDAwLjMsICswMy4yNCwgMDMsIDAzLjI0XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7Ly9ubyBsZWFkaW5nIHplcm9zIG9yIGxlYWRpbmcgemVyb3MgYXJlIGFsbG93ZWRcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIodHJpbW1lZFN0cik7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkU3RyID0gU3RyaW5nKG51bSk7XG5cbiAgICAgICAgICAgICAgICBpZiggbnVtID09PSAwIHx8IG51bSA9PT0gLTApIHJldHVybiBudW07XG4gICAgICAgICAgICAgICAgaWYocGFyc2VkU3RyLnNlYXJjaCgvW2VFXS8pICE9PSAtMSl7IC8vZ2l2ZW4gbnVtYmVyIGlzIGxvbmcgYW5kIHBhcnNlZCB0byBlTm90YXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5lTm90YXRpb24pIHJldHVybiBudW07XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHN0cjtcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZih0cmltbWVkU3RyLmluZGV4T2YoXCIuXCIpICE9PSAtMSl7IC8vZmxvYXRpbmcgbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgIGlmKHBhcnNlZFN0ciA9PT0gXCIwXCIpIHJldHVybiBudW07IC8vMC4wXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYocGFyc2VkU3RyID09PSBudW1UcmltbWVkQnlaZXJvcykgcmV0dXJuIG51bTsgLy8wLjQ1Ni4gMC43OTAwMFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKCBwYXJzZWRTdHIgPT09IGAke3NpZ259JHtudW1UcmltbWVkQnlaZXJvc31gKSByZXR1cm4gbnVtO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGxldCBuID0gbGVhZGluZ1plcm9zPyBudW1UcmltbWVkQnlaZXJvcyA6IHRyaW1tZWRTdHI7XG4gICAgICAgICAgICAgICAgaWYobGVhZGluZ1plcm9zKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gLTAwOSA9PiAtOVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG4gPT09IHBhcnNlZFN0cikgfHwgKHNpZ24rbiA9PT0gcGFyc2VkU3RyKSA/IG51bSA6IHN0clxuICAgICAgICAgICAgICAgIH1lbHNlICB7XG4gICAgICAgICAgICAgICAgICAgIC8vICs5XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAobiA9PT0gcGFyc2VkU3RyKSB8fCAobiA9PT0gc2lnbitwYXJzZWRTdHIpID8gbnVtIDogc3RyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXsgLy9ub24tbnVtZXJpYyBzdHJpbmdcbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IGVOb3RhdGlvblJlZ3ggPSAvXihbLStdKT8oMCopKFxcZCooXFwuXFxkKik/W2VFXVstXFwrXT9cXGQrKSQvO1xuZnVuY3Rpb24gcmVzb2x2ZUVub3RhdGlvbihzdHIsdHJpbW1lZFN0cixvcHRpb25zKXtcbiAgICBpZighb3B0aW9ucy5lTm90YXRpb24pIHJldHVybiBzdHI7XG4gICAgY29uc3Qgbm90YXRpb24gPSB0cmltbWVkU3RyLm1hdGNoKGVOb3RhdGlvblJlZ3gpOyBcbiAgICBpZihub3RhdGlvbil7XG4gICAgICAgIGxldCBzaWduID0gbm90YXRpb25bMV0gfHwgXCJcIjtcbiAgICAgICAgY29uc3QgZUNoYXIgPSBub3RhdGlvblszXS5pbmRleE9mKFwiZVwiKSA9PT0gLTEgPyBcIkVcIiA6IFwiZVwiO1xuICAgICAgICBjb25zdCBsZWFkaW5nWmVyb3MgPSBub3RhdGlvblsyXTtcbiAgICAgICAgY29uc3QgZUFkamFjZW50VG9MZWFkaW5nWmVyb3MgPSBzaWduID8gLy8gMEUuXG4gICAgICAgICAgICBzdHJbbGVhZGluZ1plcm9zLmxlbmd0aCsxXSA9PT0gZUNoYXIgXG4gICAgICAgICAgICA6IHN0cltsZWFkaW5nWmVyb3MubGVuZ3RoXSA9PT0gZUNoYXI7XG5cbiAgICAgICAgaWYobGVhZGluZ1plcm9zLmxlbmd0aCA+IDEgJiYgZUFkamFjZW50VG9MZWFkaW5nWmVyb3MpIHJldHVybiBzdHI7XG4gICAgICAgIGVsc2UgaWYobGVhZGluZ1plcm9zLmxlbmd0aCA9PT0gMSBcbiAgICAgICAgICAgICYmIChub3RhdGlvblszXS5zdGFydHNXaXRoKGAuJHtlQ2hhcn1gKSB8fCBub3RhdGlvblszXVswXSA9PT0gZUNoYXIpKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHRyaW1tZWRTdHIpO1xuICAgICAgICB9ZWxzZSBpZihvcHRpb25zLmxlYWRpbmdaZXJvcyAmJiAhZUFkamFjZW50VG9MZWFkaW5nWmVyb3MpeyAvL2FjY2VwdCB3aXRoIGxlYWRpbmcgemVyb3NcbiAgICAgICAgICAgIC8vcmVtb3ZlIGxlYWRpbmcgMHNcbiAgICAgICAgICAgIHRyaW1tZWRTdHIgPSAobm90YXRpb25bMV0gfHwgXCJcIikgKyBub3RhdGlvblszXTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIodHJpbW1lZFN0cik7XG4gICAgICAgIH1lbHNlIHJldHVybiBzdHI7XG4gICAgfWVsc2V7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxufVxuXG4vKipcbiAqIFxuICogQHBhcmFtIHtzdHJpbmd9IG51bVN0ciB3aXRob3V0IGxlYWRpbmcgemVyb3NcbiAqIEByZXR1cm5zIFxuICovXG5mdW5jdGlvbiB0cmltWmVyb3MobnVtU3RyKXtcbiAgICBpZihudW1TdHIgJiYgbnVtU3RyLmluZGV4T2YoXCIuXCIpICE9PSAtMSl7Ly9mbG9hdFxuICAgICAgICBudW1TdHIgPSBudW1TdHIucmVwbGFjZSgvMCskLywgXCJcIik7IC8vcmVtb3ZlIGVuZGluZyB6ZXJvc1xuICAgICAgICBpZihudW1TdHIgPT09IFwiLlwiKSAgbnVtU3RyID0gXCIwXCI7XG4gICAgICAgIGVsc2UgaWYobnVtU3RyWzBdID09PSBcIi5cIikgIG51bVN0ciA9IFwiMFwiK251bVN0cjtcbiAgICAgICAgZWxzZSBpZihudW1TdHJbbnVtU3RyLmxlbmd0aC0xXSA9PT0gXCIuXCIpICBudW1TdHIgPSBudW1TdHIuc3Vic3RyaW5nKDAsbnVtU3RyLmxlbmd0aC0xKTtcbiAgICAgICAgcmV0dXJuIG51bVN0cjtcbiAgICB9XG4gICAgcmV0dXJuIG51bVN0cjtcbn1cblxuZnVuY3Rpb24gcGFyc2VfaW50KG51bVN0ciwgYmFzZSl7XG4gICAgLy9wb2x5ZmlsbFxuICAgIGlmKHBhcnNlSW50KSByZXR1cm4gcGFyc2VJbnQobnVtU3RyLCBiYXNlKTtcbiAgICBlbHNlIGlmKE51bWJlci5wYXJzZUludCkgcmV0dXJuIE51bWJlci5wYXJzZUludChudW1TdHIsIGJhc2UpO1xuICAgIGVsc2UgaWYod2luZG93ICYmIHdpbmRvdy5wYXJzZUludCkgcmV0dXJuIHdpbmRvdy5wYXJzZUludChudW1TdHIsIGJhc2UpO1xuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwicGFyc2VJbnQsIE51bWJlci5wYXJzZUludCwgd2luZG93LnBhcnNlSW50IGFyZSBub3Qgc3VwcG9ydGVkXCIpXG59IiwgImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldElnbm9yZUF0dHJpYnV0ZXNGbihpZ25vcmVBdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBpZ25vcmVBdHRyaWJ1dGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBpZ25vcmVBdHRyaWJ1dGVzXG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlnbm9yZUF0dHJpYnV0ZXMpKSB7XG4gICAgICAgIHJldHVybiAoYXR0ck5hbWUpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBpZ25vcmVBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJyAmJiBhdHRyTmFtZSA9PT0gcGF0dGVybikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBwYXR0ZXJuLnRlc3QoYXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBmYWxzZVxufSIsICIndXNlIHN0cmljdCc7XG4vLy9AdHMtY2hlY2tcblxuaW1wb3J0IHtnZXRBbGxNYXRjaGVzLCBpc0V4aXN0fSBmcm9tICcuLi91dGlsLmpzJztcbmltcG9ydCB4bWxOb2RlIGZyb20gJy4veG1sTm9kZS5qcyc7XG5pbXBvcnQgcmVhZERvY1R5cGUgZnJvbSAnLi9Eb2NUeXBlUmVhZGVyLmpzJztcbmltcG9ydCB0b051bWJlciBmcm9tIFwic3RybnVtXCI7XG5pbXBvcnQgZ2V0SWdub3JlQXR0cmlidXRlc0ZuIGZyb20gXCIuLi9pZ25vcmVBdHRyaWJ1dGVzLmpzXCI7XG5cbi8vIGNvbnN0IHJlZ3ggPVxuLy8gICAnPCgoIVxcXFxbQ0RBVEFcXFxcWyhbXFxcXHNcXFxcU10qPykoXV0+KSl8KChOQU1FOik/KE5BTUUpKShbXj5dKik+fCgoXFxcXC8pKE5BTUUpXFxcXHMqPikpKFtePF0qKSdcbi8vICAgLnJlcGxhY2UoL05BTUUvZywgdXRpbC5uYW1lUmVnZXhwKTtcblxuLy9jb25zdCB0YWdzUmVneCA9IG5ldyBSZWdFeHAoXCI8KFxcXFwvP1tcXFxcdzpcXFxcLVxcLl9dKykoW14+XSopPihcXFxccypcIitjZGF0YVJlZ3grXCIpKihbXjxdKyk/XCIsXCJnXCIpO1xuLy9jb25zdCB0YWdzUmVneCA9IG5ldyBSZWdFeHAoXCI8KFxcXFwvPykoKFxcXFx3KjopPyhbXFxcXHc6XFxcXC1cXC5fXSspKShbXj5dKik+KFtePF0qKShcIitjZGF0YVJlZ3grXCIoW148XSopKSooW148XSspP1wiLFwiZ1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JkZXJlZE9ialBhcnNlcntcbiAgY29uc3RydWN0b3Iob3B0aW9ucyl7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLnRhZ3NOb2RlU3RhY2sgPSBbXTtcbiAgICB0aGlzLmRvY1R5cGVFbnRpdGllcyA9IHt9O1xuICAgIHRoaXMubGFzdEVudGl0aWVzID0ge1xuICAgICAgXCJhcG9zXCIgOiB7IHJlZ2V4OiAvJihhcG9zfCMzOXwjeDI3KTsvZywgdmFsIDogXCInXCJ9LFxuICAgICAgXCJndFwiIDogeyByZWdleDogLyYoZ3R8IzYyfCN4M0UpOy9nLCB2YWwgOiBcIj5cIn0sXG4gICAgICBcImx0XCIgOiB7IHJlZ2V4OiAvJihsdHwjNjB8I3gzQyk7L2csIHZhbCA6IFwiPFwifSxcbiAgICAgIFwicXVvdFwiIDogeyByZWdleDogLyYocXVvdHwjMzR8I3gyMik7L2csIHZhbCA6IFwiXFxcIlwifSxcbiAgICB9O1xuICAgIHRoaXMuYW1wRW50aXR5ID0geyByZWdleDogLyYoYW1wfCMzOHwjeDI2KTsvZywgdmFsIDogXCImXCJ9O1xuICAgIHRoaXMuaHRtbEVudGl0aWVzID0ge1xuICAgICAgXCJzcGFjZVwiOiB7IHJlZ2V4OiAvJihuYnNwfCMxNjApOy9nLCB2YWw6IFwiIFwiIH0sXG4gICAgICAvLyBcImx0XCIgOiB7IHJlZ2V4OiAvJihsdHwjNjApOy9nLCB2YWw6IFwiPFwiIH0sXG4gICAgICAvLyBcImd0XCIgOiB7IHJlZ2V4OiAvJihndHwjNjIpOy9nLCB2YWw6IFwiPlwiIH0sXG4gICAgICAvLyBcImFtcFwiIDogeyByZWdleDogLyYoYW1wfCMzOCk7L2csIHZhbDogXCImXCIgfSxcbiAgICAgIC8vIFwicXVvdFwiIDogeyByZWdleDogLyYocXVvdHwjMzQpOy9nLCB2YWw6IFwiXFxcIlwiIH0sXG4gICAgICAvLyBcImFwb3NcIiA6IHsgcmVnZXg6IC8mKGFwb3N8IzM5KTsvZywgdmFsOiBcIidcIiB9LFxuICAgICAgXCJjZW50XCIgOiB7IHJlZ2V4OiAvJihjZW50fCMxNjIpOy9nLCB2YWw6IFwiXHUwMEEyXCIgfSxcbiAgICAgIFwicG91bmRcIiA6IHsgcmVnZXg6IC8mKHBvdW5kfCMxNjMpOy9nLCB2YWw6IFwiXHUwMEEzXCIgfSxcbiAgICAgIFwieWVuXCIgOiB7IHJlZ2V4OiAvJih5ZW58IzE2NSk7L2csIHZhbDogXCJcdTAwQTVcIiB9LFxuICAgICAgXCJldXJvXCIgOiB7IHJlZ2V4OiAvJihldXJvfCM4MzY0KTsvZywgdmFsOiBcIlx1MjBBQ1wiIH0sXG4gICAgICBcImNvcHlyaWdodFwiIDogeyByZWdleDogLyYoY29weXwjMTY5KTsvZywgdmFsOiBcIlx1MDBBOVwiIH0sXG4gICAgICBcInJlZ1wiIDogeyByZWdleDogLyYocmVnfCMxNzQpOy9nLCB2YWw6IFwiXHUwMEFFXCIgfSxcbiAgICAgIFwiaW5yXCIgOiB7IHJlZ2V4OiAvJihpbnJ8IzgzNzcpOy9nLCB2YWw6IFwiXHUyMEI5XCIgfSxcbiAgICAgIFwibnVtX2RlY1wiOiB7IHJlZ2V4OiAvJiMoWzAtOV17MSw3fSk7L2csIHZhbCA6IChfLCBzdHIpID0+IFN0cmluZy5mcm9tQ29kZVBvaW50KE51bWJlci5wYXJzZUludChzdHIsIDEwKSkgfSxcbiAgICAgIFwibnVtX2hleFwiOiB7IHJlZ2V4OiAvJiN4KFswLTlhLWZBLUZdezEsNn0pOy9nLCB2YWwgOiAoXywgc3RyKSA9PiBTdHJpbmcuZnJvbUNvZGVQb2ludChOdW1iZXIucGFyc2VJbnQoc3RyLCAxNikpIH0sXG4gICAgfTtcbiAgICB0aGlzLmFkZEV4dGVybmFsRW50aXRpZXMgPSBhZGRFeHRlcm5hbEVudGl0aWVzO1xuICAgIHRoaXMucGFyc2VYbWwgPSBwYXJzZVhtbDtcbiAgICB0aGlzLnBhcnNlVGV4dERhdGEgPSBwYXJzZVRleHREYXRhO1xuICAgIHRoaXMucmVzb2x2ZU5hbWVTcGFjZSA9IHJlc29sdmVOYW1lU3BhY2U7XG4gICAgdGhpcy5idWlsZEF0dHJpYnV0ZXNNYXAgPSBidWlsZEF0dHJpYnV0ZXNNYXA7XG4gICAgdGhpcy5pc0l0U3RvcE5vZGUgPSBpc0l0U3RvcE5vZGU7XG4gICAgdGhpcy5yZXBsYWNlRW50aXRpZXNWYWx1ZSA9IHJlcGxhY2VFbnRpdGllc1ZhbHVlO1xuICAgIHRoaXMucmVhZFN0b3BOb2RlRGF0YSA9IHJlYWRTdG9wTm9kZURhdGE7XG4gICAgdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnID0gc2F2ZVRleHRUb1BhcmVudFRhZztcbiAgICB0aGlzLmFkZENoaWxkID0gYWRkQ2hpbGQ7XG4gICAgdGhpcy5pZ25vcmVBdHRyaWJ1dGVzRm4gPSBnZXRJZ25vcmVBdHRyaWJ1dGVzRm4odGhpcy5vcHRpb25zLmlnbm9yZUF0dHJpYnV0ZXMpXG4gIH1cblxufVxuXG5mdW5jdGlvbiBhZGRFeHRlcm5hbEVudGl0aWVzKGV4dGVybmFsRW50aXRpZXMpe1xuICBjb25zdCBlbnRLZXlzID0gT2JqZWN0LmtleXMoZXh0ZXJuYWxFbnRpdGllcyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW50S2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVudCA9IGVudEtleXNbaV07XG4gICAgdGhpcy5sYXN0RW50aXRpZXNbZW50XSA9IHtcbiAgICAgICByZWdleDogbmV3IFJlZ0V4cChcIiZcIitlbnQrXCI7XCIsXCJnXCIpLFxuICAgICAgIHZhbCA6IGV4dGVybmFsRW50aXRpZXNbZW50XVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGhcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZG9udFRyaW1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFzQXR0cmlidXRlc1xuICogQHBhcmFtIHtib29sZWFufSBpc0xlYWZOb2RlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGVzY2FwZUVudGl0aWVzXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVGV4dERhdGEodmFsLCB0YWdOYW1lLCBqUGF0aCwgZG9udFRyaW0sIGhhc0F0dHJpYnV0ZXMsIGlzTGVhZk5vZGUsIGVzY2FwZUVudGl0aWVzKSB7XG4gIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMudHJpbVZhbHVlcyAmJiAhZG9udFRyaW0pIHtcbiAgICAgIHZhbCA9IHZhbC50cmltKCk7XG4gICAgfVxuICAgIGlmKHZhbC5sZW5ndGggPiAwKXtcbiAgICAgIGlmKCFlc2NhcGVFbnRpdGllcykgdmFsID0gdGhpcy5yZXBsYWNlRW50aXRpZXNWYWx1ZSh2YWwpO1xuICAgICAgXG4gICAgICBjb25zdCBuZXd2YWwgPSB0aGlzLm9wdGlvbnMudGFnVmFsdWVQcm9jZXNzb3IodGFnTmFtZSwgdmFsLCBqUGF0aCwgaGFzQXR0cmlidXRlcywgaXNMZWFmTm9kZSk7XG4gICAgICBpZihuZXd2YWwgPT09IG51bGwgfHwgbmV3dmFsID09PSB1bmRlZmluZWQpe1xuICAgICAgICAvL2Rvbid0IHBhcnNlXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9ZWxzZSBpZih0eXBlb2YgbmV3dmFsICE9PSB0eXBlb2YgdmFsIHx8IG5ld3ZhbCAhPT0gdmFsKXtcbiAgICAgICAgLy9vdmVyd3JpdGVcbiAgICAgICAgcmV0dXJuIG5ld3ZhbDtcbiAgICAgIH1lbHNlIGlmKHRoaXMub3B0aW9ucy50cmltVmFsdWVzKXtcbiAgICAgICAgcmV0dXJuIHBhcnNlVmFsdWUodmFsLCB0aGlzLm9wdGlvbnMucGFyc2VUYWdWYWx1ZSwgdGhpcy5vcHRpb25zLm51bWJlclBhcnNlT3B0aW9ucyk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29uc3QgdHJpbW1lZFZhbCA9IHZhbC50cmltKCk7XG4gICAgICAgIGlmKHRyaW1tZWRWYWwgPT09IHZhbCl7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlVmFsdWUodmFsLCB0aGlzLm9wdGlvbnMucGFyc2VUYWdWYWx1ZSwgdGhpcy5vcHRpb25zLm51bWJlclBhcnNlT3B0aW9ucyk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU5hbWVTcGFjZSh0YWduYW1lKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMucmVtb3ZlTlNQcmVmaXgpIHtcbiAgICBjb25zdCB0YWdzID0gdGFnbmFtZS5zcGxpdCgnOicpO1xuICAgIGNvbnN0IHByZWZpeCA9IHRhZ25hbWUuY2hhckF0KDApID09PSAnLycgPyAnLycgOiAnJztcbiAgICBpZiAodGFnc1swXSA9PT0gJ3htbG5zJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodGFncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIHRhZ25hbWUgPSBwcmVmaXggKyB0YWdzWzFdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFnbmFtZTtcbn1cblxuLy9UT0RPOiBjaGFuZ2UgcmVnZXggdG8gY2FwdHVyZSBOU1xuLy9jb25zdCBhdHRyc1JlZ3ggPSBuZXcgUmVnRXhwKFwiKFtcXFxcd1xcXFwtXFxcXC5cXFxcOl0rKVxcXFxzKj1cXFxccyooWydcXFwiXSkoKC58XFxuKSo/KVxcXFwyXCIsXCJnbVwiKTtcbmNvbnN0IGF0dHJzUmVneCA9IG5ldyBSZWdFeHAoJyhbXlxcXFxzPV0rKVxcXFxzKig9XFxcXHMqKFtcXCdcIl0pKFtcXFxcc1xcXFxTXSo/KVxcXFwzKT8nLCAnZ20nKTtcblxuZnVuY3Rpb24gYnVpbGRBdHRyaWJ1dGVzTWFwKGF0dHJTdHIsIGpQYXRoLCB0YWdOYW1lKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlQXR0cmlidXRlcyAhPT0gdHJ1ZSAmJiB0eXBlb2YgYXR0clN0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBhdHRyU3RyID0gYXR0clN0ci5yZXBsYWNlKC9cXHI/XFxuL2csICcgJyk7XG4gICAgLy9hdHRyU3RyID0gYXR0clN0ciB8fCBhdHRyU3RyLnRyaW0oKTtcblxuICAgIGNvbnN0IG1hdGNoZXMgPSBnZXRBbGxNYXRjaGVzKGF0dHJTdHIsIGF0dHJzUmVneCk7XG4gICAgY29uc3QgbGVuID0gbWF0Y2hlcy5sZW5ndGg7IC8vZG9uJ3QgbWFrZSBpdCBpbmxpbmVcbiAgICBjb25zdCBhdHRycyA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5yZXNvbHZlTmFtZVNwYWNlKG1hdGNoZXNbaV1bMV0pO1xuICAgICAgaWYgKHRoaXMuaWdub3JlQXR0cmlidXRlc0ZuKGF0dHJOYW1lLCBqUGF0aCkpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGxldCBvbGRWYWwgPSBtYXRjaGVzW2ldWzRdO1xuICAgICAgbGV0IGFOYW1lID0gdGhpcy5vcHRpb25zLmF0dHJpYnV0ZU5hbWVQcmVmaXggKyBhdHRyTmFtZTtcbiAgICAgIGlmIChhdHRyTmFtZS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmFuc2Zvcm1BdHRyaWJ1dGVOYW1lKSB7XG4gICAgICAgICAgYU5hbWUgPSB0aGlzLm9wdGlvbnMudHJhbnNmb3JtQXR0cmlidXRlTmFtZShhTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoYU5hbWUgPT09IFwiX19wcm90b19fXCIpIGFOYW1lICA9IFwiI19fcHJvdG9fX1wiO1xuICAgICAgICBpZiAob2xkVmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRyaW1WYWx1ZXMpIHtcbiAgICAgICAgICAgIG9sZFZhbCA9IG9sZFZhbC50cmltKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9sZFZhbCA9IHRoaXMucmVwbGFjZUVudGl0aWVzVmFsdWUob2xkVmFsKTtcbiAgICAgICAgICBjb25zdCBuZXdWYWwgPSB0aGlzLm9wdGlvbnMuYXR0cmlidXRlVmFsdWVQcm9jZXNzb3IoYXR0ck5hbWUsIG9sZFZhbCwgalBhdGgpO1xuICAgICAgICAgIGlmKG5ld1ZhbCA9PT0gbnVsbCB8fCBuZXdWYWwgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAvL2Rvbid0IHBhcnNlXG4gICAgICAgICAgICBhdHRyc1thTmFtZV0gPSBvbGRWYWw7XG4gICAgICAgICAgfWVsc2UgaWYodHlwZW9mIG5ld1ZhbCAhPT0gdHlwZW9mIG9sZFZhbCB8fCBuZXdWYWwgIT09IG9sZFZhbCl7XG4gICAgICAgICAgICAvL292ZXJ3cml0ZVxuICAgICAgICAgICAgYXR0cnNbYU5hbWVdID0gbmV3VmFsO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgLy9wYXJzZVxuICAgICAgICAgICAgYXR0cnNbYU5hbWVdID0gcGFyc2VWYWx1ZShcbiAgICAgICAgICAgICAgb2xkVmFsLFxuICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFyc2VBdHRyaWJ1dGVWYWx1ZSxcbiAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm51bWJlclBhcnNlT3B0aW9uc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmFsbG93Qm9vbGVhbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICBhdHRyc1thTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghT2JqZWN0LmtleXMoYXR0cnMpLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNHcm91cE5hbWUpIHtcbiAgICAgIGNvbnN0IGF0dHJDb2xsZWN0aW9uID0ge307XG4gICAgICBhdHRyQ29sbGVjdGlvblt0aGlzLm9wdGlvbnMuYXR0cmlidXRlc0dyb3VwTmFtZV0gPSBhdHRycztcbiAgICAgIHJldHVybiBhdHRyQ29sbGVjdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJzXG4gIH1cbn1cblxuY29uc3QgcGFyc2VYbWwgPSBmdW5jdGlvbih4bWxEYXRhKSB7XG4gIHhtbERhdGEgPSB4bWxEYXRhLnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIik7IC8vVE9ETzogcmVtb3ZlIHRoaXMgbGluZVxuICBjb25zdCB4bWxPYmogPSBuZXcgeG1sTm9kZSgnIXhtbCcpO1xuICBsZXQgY3VycmVudE5vZGUgPSB4bWxPYmo7XG4gIGxldCB0ZXh0RGF0YSA9IFwiXCI7XG4gIGxldCBqUGF0aCA9IFwiXCI7XG4gIGZvcihsZXQgaT0wOyBpPCB4bWxEYXRhLmxlbmd0aDsgaSsrKXsvL2ZvciBlYWNoIGNoYXIgaW4gWE1MIGRhdGFcbiAgICBjb25zdCBjaCA9IHhtbERhdGFbaV07XG4gICAgaWYoY2ggPT09ICc8Jyl7XG4gICAgICAvLyBjb25zdCBuZXh0SW5kZXggPSBpKzE7XG4gICAgICAvLyBjb25zdCBfMm5kQ2hhciA9IHhtbERhdGFbbmV4dEluZGV4XTtcbiAgICAgIGlmKCB4bWxEYXRhW2krMV0gPT09ICcvJykgey8vQ2xvc2luZyBUYWdcbiAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCI+XCIsIGksIFwiQ2xvc2luZyBUYWcgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgbGV0IHRhZ05hbWUgPSB4bWxEYXRhLnN1YnN0cmluZyhpKzIsY2xvc2VJbmRleCkudHJpbSgpO1xuXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5yZW1vdmVOU1ByZWZpeCl7XG4gICAgICAgICAgY29uc3QgY29sb25JbmRleCA9IHRhZ05hbWUuaW5kZXhPZihcIjpcIik7XG4gICAgICAgICAgaWYoY29sb25JbmRleCAhPT0gLTEpe1xuICAgICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc3Vic3RyKGNvbG9uSW5kZXgrMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5vcHRpb25zLnRyYW5zZm9ybVRhZ05hbWUpIHtcbiAgICAgICAgICB0YWdOYW1lID0gdGhpcy5vcHRpb25zLnRyYW5zZm9ybVRhZ05hbWUodGFnTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihjdXJyZW50Tm9kZSl7XG4gICAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGxhc3QgdGFnIG9mIG5lc3RlZCB0YWcgd2FzIHVucGFpcmVkIHRhZ1xuICAgICAgICBjb25zdCBsYXN0VGFnTmFtZSA9IGpQYXRoLnN1YnN0cmluZyhqUGF0aC5sYXN0SW5kZXhPZihcIi5cIikrMSk7XG4gICAgICAgIGlmKHRhZ05hbWUgJiYgdGhpcy5vcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSApe1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5wYWlyZWQgdGFnIGNhbiBub3QgYmUgdXNlZCBhcyBjbG9zaW5nIHRhZzogPC8ke3RhZ05hbWV9PmApO1xuICAgICAgICB9XG4gICAgICAgIGxldCBwcm9wSW5kZXggPSAwXG4gICAgICAgIGlmKGxhc3RUYWdOYW1lICYmIHRoaXMub3B0aW9ucy51bnBhaXJlZFRhZ3MuaW5kZXhPZihsYXN0VGFnTmFtZSkgIT09IC0xICl7XG4gICAgICAgICAgcHJvcEluZGV4ID0galBhdGgubGFzdEluZGV4T2YoJy4nLCBqUGF0aC5sYXN0SW5kZXhPZignLicpLTEpXG4gICAgICAgICAgdGhpcy50YWdzTm9kZVN0YWNrLnBvcCgpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBwcm9wSW5kZXggPSBqUGF0aC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgICAgIH1cbiAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHJpbmcoMCwgcHJvcEluZGV4KTtcblxuICAgICAgICBjdXJyZW50Tm9kZSA9IHRoaXMudGFnc05vZGVTdGFjay5wb3AoKTsvL2F2b2lkIHJlY3Vyc2lvbiwgc2V0IHRoZSBwYXJlbnQgdGFnIHNjb3BlXG4gICAgICAgIHRleHREYXRhID0gXCJcIjtcbiAgICAgICAgaSA9IGNsb3NlSW5kZXg7XG4gICAgICB9IGVsc2UgaWYoIHhtbERhdGFbaSsxXSA9PT0gJz8nKSB7XG5cbiAgICAgICAgbGV0IHRhZ0RhdGEgPSByZWFkVGFnRXhwKHhtbERhdGEsaSwgZmFsc2UsIFwiPz5cIik7XG4gICAgICAgIGlmKCF0YWdEYXRhKSB0aHJvdyBuZXcgRXJyb3IoXCJQaSBUYWcgaXMgbm90IGNsb3NlZC5cIik7XG5cbiAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG4gICAgICAgIGlmKCAodGhpcy5vcHRpb25zLmlnbm9yZURlY2xhcmF0aW9uICYmIHRhZ0RhdGEudGFnTmFtZSA9PT0gXCI/eG1sXCIpIHx8IHRoaXMub3B0aW9ucy5pZ25vcmVQaVRhZ3Mpe1xuXG4gICAgICAgIH1lbHNle1xuICBcbiAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdEYXRhLnRhZ05hbWUpO1xuICAgICAgICAgIGNoaWxkTm9kZS5hZGQodGhpcy5vcHRpb25zLnRleHROb2RlTmFtZSwgXCJcIik7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYodGFnRGF0YS50YWdOYW1lICE9PSB0YWdEYXRhLnRhZ0V4cCAmJiB0YWdEYXRhLmF0dHJFeHBQcmVzZW50KXtcbiAgICAgICAgICAgIGNoaWxkTm9kZVtcIjpAXCJdID0gdGhpcy5idWlsZEF0dHJpYnV0ZXNNYXAodGFnRGF0YS50YWdFeHAsIGpQYXRoLCB0YWdEYXRhLnRhZ05hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZENoaWxkKGN1cnJlbnROb2RlLCBjaGlsZE5vZGUsIGpQYXRoLCBpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaSA9IHRhZ0RhdGEuY2xvc2VJbmRleCArIDE7XG4gICAgICB9IGVsc2UgaWYoeG1sRGF0YS5zdWJzdHIoaSArIDEsIDMpID09PSAnIS0tJykge1xuICAgICAgICBjb25zdCBlbmRJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCItLT5cIiwgaSs0LCBcIkNvbW1lbnQgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmNvbW1lbnRQcm9wTmFtZSl7XG4gICAgICAgICAgY29uc3QgY29tbWVudCA9IHhtbERhdGEuc3Vic3RyaW5nKGkgKyA0LCBlbmRJbmRleCAtIDIpO1xuXG4gICAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG5cbiAgICAgICAgICBjdXJyZW50Tm9kZS5hZGQodGhpcy5vcHRpb25zLmNvbW1lbnRQcm9wTmFtZSwgWyB7IFt0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lXSA6IGNvbW1lbnQgfSBdKTtcbiAgICAgICAgfVxuICAgICAgICBpID0gZW5kSW5kZXg7XG4gICAgICB9IGVsc2UgaWYoIHhtbERhdGEuc3Vic3RyKGkgKyAxLCAyKSA9PT0gJyFEJykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkRG9jVHlwZSh4bWxEYXRhLCBpKTtcbiAgICAgICAgdGhpcy5kb2NUeXBlRW50aXRpZXMgPSByZXN1bHQuZW50aXRpZXM7XG4gICAgICAgIGkgPSByZXN1bHQuaTtcbiAgICAgIH1lbHNlIGlmKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAyKSA9PT0gJyFbJykge1xuICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIl1dPlwiLCBpLCBcIkNEQVRBIGlzIG5vdCBjbG9zZWQuXCIpIC0gMjtcbiAgICAgICAgY29uc3QgdGFnRXhwID0geG1sRGF0YS5zdWJzdHJpbmcoaSArIDksY2xvc2VJbmRleCk7XG5cbiAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG5cbiAgICAgICAgbGV0IHZhbCA9IHRoaXMucGFyc2VUZXh0RGF0YSh0YWdFeHAsIGN1cnJlbnROb2RlLnRhZ25hbWUsIGpQYXRoLCB0cnVlLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGlmKHZhbCA9PSB1bmRlZmluZWQpIHZhbCA9IFwiXCI7XG5cbiAgICAgICAgLy9jZGF0YSBzaG91bGQgYmUgc2V0IGV2ZW4gaWYgaXQgaXMgMCBsZW5ndGggc3RyaW5nXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5jZGF0YVByb3BOYW1lKXtcbiAgICAgICAgICBjdXJyZW50Tm9kZS5hZGQodGhpcy5vcHRpb25zLmNkYXRhUHJvcE5hbWUsIFsgeyBbdGhpcy5vcHRpb25zLnRleHROb2RlTmFtZV0gOiB0YWdFeHAgfSBdKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGkgPSBjbG9zZUluZGV4ICsgMjtcbiAgICAgIH1lbHNlIHsvL09wZW5pbmcgdGFnXG4gICAgICAgIGxldCByZXN1bHQgPSByZWFkVGFnRXhwKHhtbERhdGEsaSwgdGhpcy5vcHRpb25zLnJlbW92ZU5TUHJlZml4KTtcbiAgICAgICAgbGV0IHRhZ05hbWU9IHJlc3VsdC50YWdOYW1lO1xuICAgICAgICBjb25zdCByYXdUYWdOYW1lID0gcmVzdWx0LnJhd1RhZ05hbWU7XG4gICAgICAgIGxldCB0YWdFeHAgPSByZXN1bHQudGFnRXhwO1xuICAgICAgICBsZXQgYXR0ckV4cFByZXNlbnQgPSByZXN1bHQuYXR0ckV4cFByZXNlbnQ7XG4gICAgICAgIGxldCBjbG9zZUluZGV4ID0gcmVzdWx0LmNsb3NlSW5kZXg7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKSB7XG4gICAgICAgICAgdGFnTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKHRhZ05hbWUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvL3NhdmUgdGV4dCBhcyBjaGlsZCBub2RlXG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSAmJiB0ZXh0RGF0YSkge1xuICAgICAgICAgIGlmKGN1cnJlbnROb2RlLnRhZ25hbWUgIT09ICcheG1sJyl7XG4gICAgICAgICAgICAvL3doZW4gbmVzdGVkIHRhZyBpcyBmb3VuZFxuICAgICAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgaWYgbGFzdCB0YWcgd2FzIHVucGFpcmVkIHRhZ1xuICAgICAgICBjb25zdCBsYXN0VGFnID0gY3VycmVudE5vZGU7XG4gICAgICAgIGlmKGxhc3RUYWcgJiYgdGhpcy5vcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKGxhc3RUYWcudGFnbmFtZSkgIT09IC0xICl7XG4gICAgICAgICAgY3VycmVudE5vZGUgPSB0aGlzLnRhZ3NOb2RlU3RhY2sucG9wKCk7XG4gICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHJpbmcoMCwgalBhdGgubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0YWdOYW1lICE9PSB4bWxPYmoudGFnbmFtZSl7XG4gICAgICAgICAgalBhdGggKz0galBhdGggPyBcIi5cIiArIHRhZ05hbWUgOiB0YWdOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBpO1xuICAgICAgICBpZiAodGhpcy5pc0l0U3RvcE5vZGUodGhpcy5vcHRpb25zLnN0b3BOb2RlcywgalBhdGgsIHRhZ05hbWUpKSB7XG4gICAgICAgICAgbGV0IHRhZ0NvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgIC8vc2VsZi1jbG9zaW5nIHRhZ1xuICAgICAgICAgIGlmKHRhZ0V4cC5sZW5ndGggPiAwICYmIHRhZ0V4cC5sYXN0SW5kZXhPZihcIi9cIikgPT09IHRhZ0V4cC5sZW5ndGggLSAxKXtcbiAgICAgICAgICAgIGlmKHRhZ05hbWVbdGFnTmFtZS5sZW5ndGggLSAxXSA9PT0gXCIvXCIpeyAvL3JlbW92ZSB0cmFpbGluZyAnLydcbiAgICAgICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc3Vic3RyKDAsIHRhZ05hbWUubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgIGpQYXRoID0galBhdGguc3Vic3RyKDAsIGpQYXRoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICB0YWdFeHAgPSB0YWdOYW1lO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIHRhZ0V4cCA9IHRhZ0V4cC5zdWJzdHIoMCwgdGFnRXhwLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHJlc3VsdC5jbG9zZUluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL3VucGFpcmVkIHRhZ1xuICAgICAgICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSl7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGkgPSByZXN1bHQuY2xvc2VJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy9ub3JtYWwgdGFnXG4gICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIC8vcmVhZCB1bnRpbCBjbG9zaW5nIHRhZyBpcyBmb3VuZFxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5yZWFkU3RvcE5vZGVEYXRhKHhtbERhdGEsIHJhd1RhZ05hbWUsIGNsb3NlSW5kZXggKyAxKTtcbiAgICAgICAgICAgIGlmKCFyZXN1bHQpIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBlbmQgb2YgJHtyYXdUYWdOYW1lfWApO1xuICAgICAgICAgICAgaSA9IHJlc3VsdC5pO1xuICAgICAgICAgICAgdGFnQ29udGVudCA9IHJlc3VsdC50YWdDb250ZW50O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IG5ldyB4bWxOb2RlKHRhZ05hbWUpO1xuXG4gICAgICAgICAgaWYodGFnTmFtZSAhPT0gdGFnRXhwICYmIGF0dHJFeHBQcmVzZW50KXtcbiAgICAgICAgICAgIGNoaWxkTm9kZVtcIjpAXCJdID0gdGhpcy5idWlsZEF0dHJpYnV0ZXNNYXAodGFnRXhwLCBqUGF0aCwgdGFnTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHRhZ0NvbnRlbnQpIHtcbiAgICAgICAgICAgIHRhZ0NvbnRlbnQgPSB0aGlzLnBhcnNlVGV4dERhdGEodGFnQ29udGVudCwgdGFnTmFtZSwgalBhdGgsIHRydWUsIGF0dHJFeHBQcmVzZW50LCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHIoMCwgalBhdGgubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgICBjaGlsZE5vZGUuYWRkKHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUsIHRhZ0NvbnRlbnQpO1xuICAgICAgICAgIFxuICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpO1xuICAgICAgICB9ZWxzZXtcbiAgLy9zZWxmQ2xvc2luZyB0YWdcbiAgICAgICAgICBpZih0YWdFeHAubGVuZ3RoID4gMCAmJiB0YWdFeHAubGFzdEluZGV4T2YoXCIvXCIpID09PSB0YWdFeHAubGVuZ3RoIC0gMSl7XG4gICAgICAgICAgICBpZih0YWdOYW1lW3RhZ05hbWUubGVuZ3RoIC0gMV0gPT09IFwiL1wiKXsgLy9yZW1vdmUgdHJhaWxpbmcgJy8nXG4gICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cigwLCB0YWdOYW1lLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cigwLCBqUGF0aC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgdGFnRXhwID0gdGFnTmFtZTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICB0YWdFeHAgPSB0YWdFeHAuc3Vic3RyKDAsIHRhZ0V4cC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLnRyYW5zZm9ybVRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgdGFnTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKHRhZ05hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdOYW1lKTtcbiAgICAgICAgICAgIGlmKHRhZ05hbWUgIT09IHRhZ0V4cCAmJiBhdHRyRXhwUHJlc2VudCl7XG4gICAgICAgICAgICAgIGNoaWxkTm9kZVtcIjpAXCJdID0gdGhpcy5idWlsZEF0dHJpYnV0ZXNNYXAodGFnRXhwLCBqUGF0aCwgdGFnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGN1cnJlbnROb2RlLCBjaGlsZE5vZGUsIGpQYXRoLCBzdGFydEluZGV4KTtcbiAgICAgICAgICAgIGpQYXRoID0galBhdGguc3Vic3RyKDAsIGpQYXRoLmxhc3RJbmRleE9mKFwiLlwiKSk7XG4gICAgICAgICAgfVxuICAgIC8vb3BlbmluZyB0YWdcbiAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gbmV3IHhtbE5vZGUoIHRhZ05hbWUpO1xuICAgICAgICAgICAgdGhpcy50YWdzTm9kZVN0YWNrLnB1c2goY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZih0YWdOYW1lICE9PSB0YWdFeHAgJiYgYXR0ckV4cFByZXNlbnQpe1xuICAgICAgICAgICAgICBjaGlsZE5vZGVbXCI6QFwiXSA9IHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwKHRhZ0V4cCwgalBhdGgsIHRhZ05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChjdXJyZW50Tm9kZSwgY2hpbGROb2RlLCBqUGF0aCwgc3RhcnRJbmRleCk7XG4gICAgICAgICAgICBjdXJyZW50Tm9kZSA9IGNoaWxkTm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGV4dERhdGEgPSBcIlwiO1xuICAgICAgICAgIGkgPSBjbG9zZUluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICB0ZXh0RGF0YSArPSB4bWxEYXRhW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4geG1sT2JqLmNoaWxkO1xufVxuXG5mdW5jdGlvbiBhZGRDaGlsZChjdXJyZW50Tm9kZSwgY2hpbGROb2RlLCBqUGF0aCwgc3RhcnRJbmRleCl7XG4gIC8vIHVuc2V0IHN0YXJ0SW5kZXggaWYgbm90IHJlcXVlc3RlZFxuICBpZiAoIXRoaXMub3B0aW9ucy5jYXB0dXJlTWV0YURhdGEpIHN0YXJ0SW5kZXggPSB1bmRlZmluZWQ7XG4gIGNvbnN0IHJlc3VsdCA9IHRoaXMub3B0aW9ucy51cGRhdGVUYWcoY2hpbGROb2RlLnRhZ25hbWUsIGpQYXRoLCBjaGlsZE5vZGVbXCI6QFwiXSlcbiAgaWYocmVzdWx0ID09PSBmYWxzZSl7XG4gIH0gZWxzZSBpZih0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKXtcbiAgICBjaGlsZE5vZGUudGFnbmFtZSA9IHJlc3VsdFxuICAgIGN1cnJlbnROb2RlLmFkZENoaWxkKGNoaWxkTm9kZSwgc3RhcnRJbmRleCk7XG4gIH1lbHNle1xuICAgIGN1cnJlbnROb2RlLmFkZENoaWxkKGNoaWxkTm9kZSwgc3RhcnRJbmRleCk7XG4gIH1cbn1cblxuY29uc3QgcmVwbGFjZUVudGl0aWVzVmFsdWUgPSBmdW5jdGlvbih2YWwpe1xuXG4gIGlmKHRoaXMub3B0aW9ucy5wcm9jZXNzRW50aXRpZXMpe1xuICAgIGZvcihsZXQgZW50aXR5TmFtZSBpbiB0aGlzLmRvY1R5cGVFbnRpdGllcyl7XG4gICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmRvY1R5cGVFbnRpdGllc1tlbnRpdHlOYW1lXTtcbiAgICAgIHZhbCA9IHZhbC5yZXBsYWNlKCBlbnRpdHkucmVneCwgZW50aXR5LnZhbCk7XG4gICAgfVxuICAgIGZvcihsZXQgZW50aXR5TmFtZSBpbiB0aGlzLmxhc3RFbnRpdGllcyl7XG4gICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmxhc3RFbnRpdGllc1tlbnRpdHlOYW1lXTtcbiAgICAgIHZhbCA9IHZhbC5yZXBsYWNlKCBlbnRpdHkucmVnZXgsIGVudGl0eS52YWwpO1xuICAgIH1cbiAgICBpZih0aGlzLm9wdGlvbnMuaHRtbEVudGl0aWVzKXtcbiAgICAgIGZvcihsZXQgZW50aXR5TmFtZSBpbiB0aGlzLmh0bWxFbnRpdGllcyl7XG4gICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuaHRtbEVudGl0aWVzW2VudGl0eU5hbWVdO1xuICAgICAgICB2YWwgPSB2YWwucmVwbGFjZSggZW50aXR5LnJlZ2V4LCBlbnRpdHkudmFsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFsID0gdmFsLnJlcGxhY2UoIHRoaXMuYW1wRW50aXR5LnJlZ2V4LCB0aGlzLmFtcEVudGl0eS52YWwpO1xuICB9XG4gIHJldHVybiB2YWw7XG59XG5mdW5jdGlvbiBzYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgsIGlzTGVhZk5vZGUpIHtcbiAgaWYgKHRleHREYXRhKSB7IC8vc3RvcmUgcHJldmlvdXNseSBjb2xsZWN0ZWQgZGF0YSBhcyB0ZXh0Tm9kZVxuICAgIGlmKGlzTGVhZk5vZGUgPT09IHVuZGVmaW5lZCkgaXNMZWFmTm9kZSA9IGN1cnJlbnROb2RlLmNoaWxkLmxlbmd0aCA9PT0gMFxuICAgIFxuICAgIHRleHREYXRhID0gdGhpcy5wYXJzZVRleHREYXRhKHRleHREYXRhLFxuICAgICAgY3VycmVudE5vZGUudGFnbmFtZSxcbiAgICAgIGpQYXRoLFxuICAgICAgZmFsc2UsXG4gICAgICBjdXJyZW50Tm9kZVtcIjpAXCJdID8gT2JqZWN0LmtleXMoY3VycmVudE5vZGVbXCI6QFwiXSkubGVuZ3RoICE9PSAwIDogZmFsc2UsXG4gICAgICBpc0xlYWZOb2RlKTtcblxuICAgIGlmICh0ZXh0RGF0YSAhPT0gdW5kZWZpbmVkICYmIHRleHREYXRhICE9PSBcIlwiKVxuICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUsIHRleHREYXRhKTtcbiAgICB0ZXh0RGF0YSA9IFwiXCI7XG4gIH1cbiAgcmV0dXJuIHRleHREYXRhO1xufVxuXG4vL1RPRE86IHVzZSBqUGF0aCB0byBzaW1wbGlmeSB0aGUgbG9naWNcbi8qKlxuICogXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBzdG9wTm9kZXMgXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBjdXJyZW50VGFnTmFtZSBcbiAqL1xuZnVuY3Rpb24gaXNJdFN0b3BOb2RlKHN0b3BOb2RlcywgalBhdGgsIGN1cnJlbnRUYWdOYW1lKXtcbiAgY29uc3QgYWxsTm9kZXNFeHAgPSBcIiouXCIgKyBjdXJyZW50VGFnTmFtZTtcbiAgZm9yIChjb25zdCBzdG9wTm9kZVBhdGggaW4gc3RvcE5vZGVzKSB7XG4gICAgY29uc3Qgc3RvcE5vZGVFeHAgPSBzdG9wTm9kZXNbc3RvcE5vZGVQYXRoXTtcbiAgICBpZiggYWxsTm9kZXNFeHAgPT09IHN0b3BOb2RlRXhwIHx8IGpQYXRoID09PSBzdG9wTm9kZUV4cCAgKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdGFnIEV4cHJlc3Npb24gYW5kIHdoZXJlIGl0IGlzIGVuZGluZyBoYW5kbGluZyBzaW5nbGUtZG91YmxlIHF1b3RlcyBzaXR1YXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSB4bWxEYXRhIFxuICogQHBhcmFtIHtudW1iZXJ9IGkgc3RhcnRpbmcgaW5kZXhcbiAqIEByZXR1cm5zIFxuICovXG5mdW5jdGlvbiB0YWdFeHBXaXRoQ2xvc2luZ0luZGV4KHhtbERhdGEsIGksIGNsb3NpbmdDaGFyID0gXCI+XCIpe1xuICBsZXQgYXR0ckJvdW5kYXJ5O1xuICBsZXQgdGFnRXhwID0gXCJcIjtcbiAgZm9yIChsZXQgaW5kZXggPSBpOyBpbmRleCA8IHhtbERhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgbGV0IGNoID0geG1sRGF0YVtpbmRleF07XG4gICAgaWYgKGF0dHJCb3VuZGFyeSkge1xuICAgICAgICBpZiAoY2ggPT09IGF0dHJCb3VuZGFyeSkgYXR0ckJvdW5kYXJ5ID0gXCJcIjsvL3Jlc2V0XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gJ1wiJyB8fCBjaCA9PT0gXCInXCIpIHtcbiAgICAgICAgYXR0ckJvdW5kYXJ5ID0gY2g7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gY2xvc2luZ0NoYXJbMF0pIHtcbiAgICAgIGlmKGNsb3NpbmdDaGFyWzFdKXtcbiAgICAgICAgaWYoeG1sRGF0YVtpbmRleCArIDFdID09PSBjbG9zaW5nQ2hhclsxXSl7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IHRhZ0V4cCxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGF0YTogdGFnRXhwLFxuICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcdCcpIHtcbiAgICAgIGNoID0gXCIgXCJcbiAgICB9XG4gICAgdGFnRXhwICs9IGNoO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgc3RyLCBpLCBlcnJNc2cpe1xuICBjb25zdCBjbG9zaW5nSW5kZXggPSB4bWxEYXRhLmluZGV4T2Yoc3RyLCBpKTtcbiAgaWYoY2xvc2luZ0luZGV4ID09PSAtMSl7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZylcbiAgfWVsc2V7XG4gICAgcmV0dXJuIGNsb3NpbmdJbmRleCArIHN0ci5sZW5ndGggLSAxO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRUYWdFeHAoeG1sRGF0YSxpLCByZW1vdmVOU1ByZWZpeCwgY2xvc2luZ0NoYXIgPSBcIj5cIil7XG4gIGNvbnN0IHJlc3VsdCA9IHRhZ0V4cFdpdGhDbG9zaW5nSW5kZXgoeG1sRGF0YSwgaSsxLCBjbG9zaW5nQ2hhcik7XG4gIGlmKCFyZXN1bHQpIHJldHVybjtcbiAgbGV0IHRhZ0V4cCA9IHJlc3VsdC5kYXRhO1xuICBjb25zdCBjbG9zZUluZGV4ID0gcmVzdWx0LmluZGV4O1xuICBjb25zdCBzZXBhcmF0b3JJbmRleCA9IHRhZ0V4cC5zZWFyY2goL1xccy8pO1xuICBsZXQgdGFnTmFtZSA9IHRhZ0V4cDtcbiAgbGV0IGF0dHJFeHBQcmVzZW50ID0gdHJ1ZTtcbiAgaWYoc2VwYXJhdG9ySW5kZXggIT09IC0xKXsvL3NlcGFyYXRlIHRhZyBuYW1lIGFuZCBhdHRyaWJ1dGVzIGV4cHJlc3Npb25cbiAgICB0YWdOYW1lID0gdGFnRXhwLnN1YnN0cmluZygwLCBzZXBhcmF0b3JJbmRleCk7XG4gICAgdGFnRXhwID0gdGFnRXhwLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDEpLnRyaW1TdGFydCgpO1xuICB9XG5cbiAgY29uc3QgcmF3VGFnTmFtZSA9IHRhZ05hbWU7XG4gIGlmKHJlbW92ZU5TUHJlZml4KXtcbiAgICBjb25zdCBjb2xvbkluZGV4ID0gdGFnTmFtZS5pbmRleE9mKFwiOlwiKTtcbiAgICBpZihjb2xvbkluZGV4ICE9PSAtMSl7XG4gICAgICB0YWdOYW1lID0gdGFnTmFtZS5zdWJzdHIoY29sb25JbmRleCsxKTtcbiAgICAgIGF0dHJFeHBQcmVzZW50ID0gdGFnTmFtZSAhPT0gcmVzdWx0LmRhdGEuc3Vic3RyKGNvbG9uSW5kZXggKyAxKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgdGFnRXhwOiB0YWdFeHAsXG4gICAgY2xvc2VJbmRleDogY2xvc2VJbmRleCxcbiAgICBhdHRyRXhwUHJlc2VudDogYXR0ckV4cFByZXNlbnQsXG4gICAgcmF3VGFnTmFtZTogcmF3VGFnTmFtZSxcbiAgfVxufVxuLyoqXG4gKiBmaW5kIHBhaXJlZCB0YWcgZm9yIGEgc3RvcCBub2RlXG4gKiBAcGFyYW0ge3N0cmluZ30geG1sRGF0YSBcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFxuICogQHBhcmFtIHtudW1iZXJ9IGkgXG4gKi9cbmZ1bmN0aW9uIHJlYWRTdG9wTm9kZURhdGEoeG1sRGF0YSwgdGFnTmFtZSwgaSl7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBpO1xuICAvLyBTdGFydGluZyBhdCAxIHNpbmNlIHdlIGFscmVhZHkgaGF2ZSBhbiBvcGVuIHRhZ1xuICBsZXQgb3BlblRhZ0NvdW50ID0gMTtcblxuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiggeG1sRGF0YVtpXSA9PT0gXCI8XCIpeyBcbiAgICAgIGlmICh4bWxEYXRhW2krMV0gPT09IFwiL1wiKSB7Ly9jbG9zZSB0YWdcbiAgICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIj5cIiwgaSwgYCR7dGFnTmFtZX0gaXMgbm90IGNsb3NlZGApO1xuICAgICAgICAgIGxldCBjbG9zZVRhZ05hbWUgPSB4bWxEYXRhLnN1YnN0cmluZyhpKzIsY2xvc2VJbmRleCkudHJpbSgpO1xuICAgICAgICAgIGlmKGNsb3NlVGFnTmFtZSA9PT0gdGFnTmFtZSl7XG4gICAgICAgICAgICBvcGVuVGFnQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChvcGVuVGFnQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YWdDb250ZW50OiB4bWxEYXRhLnN1YnN0cmluZyhzdGFydEluZGV4LCBpKSxcbiAgICAgICAgICAgICAgICBpIDogY2xvc2VJbmRleFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGk9Y2xvc2VJbmRleDtcbiAgICAgICAgfSBlbHNlIGlmKHhtbERhdGFbaSsxXSA9PT0gJz8nKSB7IFxuICAgICAgICAgIGNvbnN0IGNsb3NlSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiPz5cIiwgaSsxLCBcIlN0b3BOb2RlIGlzIG5vdCBjbG9zZWQuXCIpXG4gICAgICAgICAgaT1jbG9zZUluZGV4O1xuICAgICAgICB9IGVsc2UgaWYoeG1sRGF0YS5zdWJzdHIoaSArIDEsIDMpID09PSAnIS0tJykgeyBcbiAgICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIi0tPlwiLCBpKzMsIFwiU3RvcE5vZGUgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgICBpPWNsb3NlSW5kZXg7XG4gICAgICAgIH0gZWxzZSBpZih4bWxEYXRhLnN1YnN0cihpICsgMSwgMikgPT09ICchWycpIHsgXG4gICAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCJdXT5cIiwgaSwgXCJTdG9wTm9kZSBpcyBub3QgY2xvc2VkLlwiKSAtIDI7XG4gICAgICAgICAgaT1jbG9zZUluZGV4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHRhZ0RhdGEgPSByZWFkVGFnRXhwKHhtbERhdGEsIGksICc+JylcblxuICAgICAgICAgIGlmICh0YWdEYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuVGFnTmFtZSA9IHRhZ0RhdGEgJiYgdGFnRGF0YS50YWdOYW1lO1xuICAgICAgICAgICAgaWYgKG9wZW5UYWdOYW1lID09PSB0YWdOYW1lICYmIHRhZ0RhdGEudGFnRXhwW3RhZ0RhdGEudGFnRXhwLmxlbmd0aC0xXSAhPT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgb3BlblRhZ0NvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpPXRhZ0RhdGEuY2xvc2VJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfS8vZW5kIGZvciBsb29wXG59XG5cbmZ1bmN0aW9uIHBhcnNlVmFsdWUodmFsLCBzaG91bGRQYXJzZSwgb3B0aW9ucykge1xuICBpZiAoc2hvdWxkUGFyc2UgJiYgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICAvL2NvbnNvbGUubG9nKG9wdGlvbnMpXG4gICAgY29uc3QgbmV3dmFsID0gdmFsLnRyaW0oKTtcbiAgICBpZihuZXd2YWwgPT09ICd0cnVlJyApIHJldHVybiB0cnVlO1xuICAgIGVsc2UgaWYobmV3dmFsID09PSAnZmFsc2UnICkgcmV0dXJuIGZhbHNlO1xuICAgIGVsc2UgcmV0dXJuIHRvTnVtYmVyKHZhbCwgb3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzRXhpc3QodmFsKSkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxufVxuIiwgIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFhtbE5vZGUgZnJvbSAnLi94bWxOb2RlLmpzJztcblxuY29uc3QgTUVUQURBVEFfU1lNQk9MID0gWG1sTm9kZS5nZXRNZXRhRGF0YVN5bWJvbCgpO1xuXG4vKipcbiAqIFxuICogQHBhcmFtIHthcnJheX0gbm9kZSBcbiAqIEBwYXJhbSB7YW55fSBvcHRpb25zIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByZXR0aWZ5KG5vZGUsIG9wdGlvbnMpe1xuICByZXR1cm4gY29tcHJlc3MoIG5vZGUsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIFxuICogQHBhcmFtIHthcnJheX0gYXJyIFxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGggXG4gKiBAcmV0dXJucyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gY29tcHJlc3MoYXJyLCBvcHRpb25zLCBqUGF0aCl7XG4gIGxldCB0ZXh0O1xuICBjb25zdCBjb21wcmVzc2VkT2JqID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdGFnT2JqID0gYXJyW2ldO1xuICAgIGNvbnN0IHByb3BlcnR5ID0gcHJvcE5hbWUodGFnT2JqKTtcbiAgICBsZXQgbmV3SnBhdGggPSBcIlwiO1xuICAgIGlmKGpQYXRoID09PSB1bmRlZmluZWQpIG5ld0pwYXRoID0gcHJvcGVydHk7XG4gICAgZWxzZSBuZXdKcGF0aCA9IGpQYXRoICsgXCIuXCIgKyBwcm9wZXJ0eTtcblxuICAgIGlmKHByb3BlcnR5ID09PSBvcHRpb25zLnRleHROb2RlTmFtZSl7XG4gICAgICBpZih0ZXh0ID09PSB1bmRlZmluZWQpIHRleHQgPSB0YWdPYmpbcHJvcGVydHldO1xuICAgICAgZWxzZSB0ZXh0ICs9IFwiXCIgKyB0YWdPYmpbcHJvcGVydHldO1xuICAgIH1lbHNlIGlmKHByb3BlcnR5ID09PSB1bmRlZmluZWQpe1xuICAgICAgY29udGludWU7XG4gICAgfWVsc2UgaWYodGFnT2JqW3Byb3BlcnR5XSl7XG4gICAgICBcbiAgICAgIGxldCB2YWwgPSBjb21wcmVzcyh0YWdPYmpbcHJvcGVydHldLCBvcHRpb25zLCBuZXdKcGF0aCk7XG4gICAgICBjb25zdCBpc0xlYWYgPSBpc0xlYWZUYWcodmFsLCBvcHRpb25zKTtcbiAgICAgIGlmICh0YWdPYmpbTUVUQURBVEFfU1lNQk9MXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbFtNRVRBREFUQV9TWU1CT0xdID0gdGFnT2JqW01FVEFEQVRBX1NZTUJPTF07IC8vIGNvcHkgb3ZlciBtZXRhZGF0YVxuICAgICAgfVxuXG4gICAgICBpZih0YWdPYmpbXCI6QFwiXSl7XG4gICAgICAgIGFzc2lnbkF0dHJpYnV0ZXMoIHZhbCwgdGFnT2JqW1wiOkBcIl0sIG5ld0pwYXRoLCBvcHRpb25zKTtcbiAgICAgIH1lbHNlIGlmKE9iamVjdC5rZXlzKHZhbCkubGVuZ3RoID09PSAxICYmIHZhbFtvcHRpb25zLnRleHROb2RlTmFtZV0gIT09IHVuZGVmaW5lZCAmJiAhb3B0aW9ucy5hbHdheXNDcmVhdGVUZXh0Tm9kZSl7XG4gICAgICAgIHZhbCA9IHZhbFtvcHRpb25zLnRleHROb2RlTmFtZV07XG4gICAgICB9ZWxzZSBpZihPYmplY3Qua2V5cyh2YWwpLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgIGlmKG9wdGlvbnMuYWx3YXlzQ3JlYXRlVGV4dE5vZGUpIHZhbFtvcHRpb25zLnRleHROb2RlTmFtZV0gPSBcIlwiO1xuICAgICAgICBlbHNlIHZhbCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGlmKGNvbXByZXNzZWRPYmpbcHJvcGVydHldICE9PSB1bmRlZmluZWQgJiYgY29tcHJlc3NlZE9iai5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcbiAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkoY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0pKSB7XG4gICAgICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSA9IFsgY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0gXTtcbiAgICAgICAgfVxuICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XS5wdXNoKHZhbCk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgLy9UT0RPOiBpZiBhIG5vZGUgaXMgbm90IGFuIGFycmF5LCB0aGVuIGNoZWNrIGlmIGl0IHNob3VsZCBiZSBhbiBhcnJheVxuICAgICAgICAvL2Fsc28gZGV0ZXJtaW5lIGlmIGl0IGlzIGEgbGVhZiBub2RlXG4gICAgICAgIGlmIChvcHRpb25zLmlzQXJyYXkocHJvcGVydHksIG5ld0pwYXRoLCBpc0xlYWYgKSkge1xuICAgICAgICAgIGNvbXByZXNzZWRPYmpbcHJvcGVydHldID0gW3ZhbF07XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGNvbXByZXNzZWRPYmpbcHJvcGVydHldID0gdmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICB9XG4gIC8vIGlmKHRleHQgJiYgdGV4dC5sZW5ndGggPiAwKSBjb21wcmVzc2VkT2JqW29wdGlvbnMudGV4dE5vZGVOYW1lXSA9IHRleHQ7XG4gIGlmKHR5cGVvZiB0ZXh0ID09PSBcInN0cmluZ1wiKXtcbiAgICBpZih0ZXh0Lmxlbmd0aCA+IDApIGNvbXByZXNzZWRPYmpbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdID0gdGV4dDtcbiAgfWVsc2UgaWYodGV4dCAhPT0gdW5kZWZpbmVkKSBjb21wcmVzc2VkT2JqW29wdGlvbnMudGV4dE5vZGVOYW1lXSA9IHRleHQ7XG4gIHJldHVybiBjb21wcmVzc2VkT2JqO1xufVxuXG5mdW5jdGlvbiBwcm9wTmFtZShvYmope1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcbiAgICBpZihrZXkgIT09IFwiOkBcIikgcmV0dXJuIGtleTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NpZ25BdHRyaWJ1dGVzKG9iaiwgYXR0ck1hcCwganBhdGgsIG9wdGlvbnMpe1xuICBpZiAoYXR0ck1hcCkge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhhdHRyTWFwKTtcbiAgICBjb25zdCBsZW4gPSBrZXlzLmxlbmd0aDsgLy9kb24ndCBtYWtlIGl0IGlubGluZVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0cnJOYW1lID0ga2V5c1tpXTtcbiAgICAgIGlmIChvcHRpb25zLmlzQXJyYXkoYXRyck5hbWUsIGpwYXRoICsgXCIuXCIgKyBhdHJyTmFtZSwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgICAgb2JqW2F0cnJOYW1lXSA9IFsgYXR0ck1hcFthdHJyTmFtZV0gXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9ialthdHJyTmFtZV0gPSBhdHRyTWFwW2F0cnJOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNMZWFmVGFnKG9iaiwgb3B0aW9ucyl7XG4gIGNvbnN0IHsgdGV4dE5vZGVOYW1lIH0gPSBvcHRpb25zO1xuICBjb25zdCBwcm9wQ291bnQgPSBPYmplY3Qua2V5cyhvYmopLmxlbmd0aDtcbiAgXG4gIGlmIChwcm9wQ291bnQgPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChcbiAgICBwcm9wQ291bnQgPT09IDEgJiZcbiAgICAob2JqW3RleHROb2RlTmFtZV0gfHwgdHlwZW9mIG9ialt0ZXh0Tm9kZU5hbWVdID09PSBcImJvb2xlYW5cIiB8fCBvYmpbdGV4dE5vZGVOYW1lXSA9PT0gMClcbiAgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4iLCAiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge2dldEFsbE1hdGNoZXMsIGlzTmFtZX0gZnJvbSAnLi91dGlsLmpzJztcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIGFsbG93Qm9vbGVhbkF0dHJpYnV0ZXM6IGZhbHNlLCAvL0EgdGFnIGNhbiBoYXZlIGF0dHJpYnV0ZXMgd2l0aG91dCBhbnkgdmFsdWVcbiAgdW5wYWlyZWRUYWdzOiBbXVxufTtcblxuLy9jb25zdCB0YWdzUGF0dGVybiA9IG5ldyBSZWdFeHAoXCI8XFxcXC8/KFtcXFxcdzpcXFxcLV9cXC5dKylcXFxccypcXC8/PlwiLFwiZ1wiKTtcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZSh4bWxEYXRhLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgLy94bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLFwiXCIpOy8vbWFrZSBpdCBzaW5nbGUgbGluZVxuICAvL3htbERhdGEgPSB4bWxEYXRhLnJlcGxhY2UoLyheXFxzKjxcXD94bWwuKj9cXD8+KS9nLFwiXCIpOy8vUmVtb3ZlIFhNTCBzdGFydGluZyB0YWdcbiAgLy94bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC8oPCFET0NUWVBFW1xcc1xcd1xcXCJcXC5cXC9cXC1cXDpdKyhcXFsuKlxcXSkqXFxzKj4pL2csXCJcIik7Ly9SZW1vdmUgRE9DVFlQRVxuICBjb25zdCB0YWdzID0gW107XG4gIGxldCB0YWdGb3VuZCA9IGZhbHNlO1xuXG4gIC8vaW5kaWNhdGVzIHRoYXQgdGhlIHJvb3QgdGFnIGhhcyBiZWVuIGNsb3NlZCAoYWthLiBkZXB0aCAwIGhhcyBiZWVuIHJlYWNoZWQpXG4gIGxldCByZWFjaGVkUm9vdCA9IGZhbHNlO1xuXG4gIGlmICh4bWxEYXRhWzBdID09PSAnXFx1ZmVmZicpIHtcbiAgICAvLyBjaGVjayBmb3IgYnl0ZSBvcmRlciBtYXJrIChCT00pXG4gICAgeG1sRGF0YSA9IHhtbERhdGEuc3Vic3RyKDEpO1xuICB9XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcblxuICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcgJiYgeG1sRGF0YVtpKzFdID09PSAnPycpIHtcbiAgICAgIGkrPTI7XG4gICAgICBpID0gcmVhZFBJKHhtbERhdGEsaSk7XG4gICAgICBpZiAoaS5lcnIpIHJldHVybiBpO1xuICAgIH1lbHNlIGlmICh4bWxEYXRhW2ldID09PSAnPCcpIHtcbiAgICAgIC8vc3RhcnRpbmcgb2YgdGFnXG4gICAgICAvL3JlYWQgdW50aWwgeW91IHJlYWNoIHRvICc+JyBhdm9pZGluZyBhbnkgJz4nIGluIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgbGV0IHRhZ1N0YXJ0UG9zID0gaTtcbiAgICAgIGkrKztcbiAgICAgIFxuICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICchJykge1xuICAgICAgICBpID0gcmVhZENvbW1lbnRBbmRDREFUQSh4bWxEYXRhLCBpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgY2xvc2luZ1RhZyA9IGZhbHNlO1xuICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJy8nKSB7XG4gICAgICAgICAgLy9jbG9zaW5nIHRhZ1xuICAgICAgICAgIGNsb3NpbmdUYWcgPSB0cnVlO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICAvL3JlYWQgdGFnbmFtZVxuICAgICAgICBsZXQgdGFnTmFtZSA9ICcnO1xuICAgICAgICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJz4nICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJyAnICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJ1xcdCcgJiZcbiAgICAgICAgICB4bWxEYXRhW2ldICE9PSAnXFxuJyAmJlxuICAgICAgICAgIHhtbERhdGFbaV0gIT09ICdcXHInOyBpKytcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGFnTmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnRyaW0oKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh0YWdOYW1lKTtcblxuICAgICAgICBpZiAodGFnTmFtZVt0YWdOYW1lLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAvL3NlbGYgY2xvc2luZyB0YWcgd2l0aG91dCBhdHRyaWJ1dGVzXG4gICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc3Vic3RyaW5nKDAsIHRhZ05hbWUubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgLy9jb250aW51ZTtcbiAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWxpZGF0ZVRhZ05hbWUodGFnTmFtZSkpIHtcbiAgICAgICAgICBsZXQgbXNnO1xuICAgICAgICAgIGlmICh0YWdOYW1lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIG1zZyA9IFwiSW52YWxpZCBzcGFjZSBhZnRlciAnPCcuXCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1zZyA9IFwiVGFnICdcIit0YWdOYW1lK1wiJyBpcyBhbiBpbnZhbGlkIG5hbWUuXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFRhZycsIG1zZywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlYWRBdHRyaWJ1dGVTdHIoeG1sRGF0YSwgaSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlcyBmb3IgJ1wiK3RhZ05hbWUrXCInIGhhdmUgb3BlbiBxdW90ZS5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYXR0clN0ciA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgaSA9IHJlc3VsdC5pbmRleDtcblxuICAgICAgICBpZiAoYXR0clN0clthdHRyU3RyLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAvL3NlbGYgY2xvc2luZyB0YWdcbiAgICAgICAgICBjb25zdCBhdHRyU3RyU3RhcnQgPSBpIC0gYXR0clN0ci5sZW5ndGg7XG4gICAgICAgICAgYXR0clN0ciA9IGF0dHJTdHIuc3Vic3RyaW5nKDAsIGF0dHJTdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgY29uc3QgaXNWYWxpZCA9IHZhbGlkYXRlQXR0cmlidXRlU3RyaW5nKGF0dHJTdHIsIG9wdGlvbnMpO1xuICAgICAgICAgIGlmIChpc1ZhbGlkID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0YWdGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAvL2NvbnRpbnVlOyAvL3RleHQgbWF5IHByZXNlbnRzIGFmdGVyIHNlbGYgY2xvc2luZyB0YWdcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy90aGUgcmVzdWx0IGZyb20gdGhlIG5lc3RlZCBmdW5jdGlvbiByZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZXJyb3Igd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vaW4gb3JkZXIgdG8gZ2V0IHRoZSAndHJ1ZScgZXJyb3IgbGluZSwgd2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGUgYmVnaW5zIChpIC0gYXR0clN0ci5sZW5ndGgpIGFuZCB0aGVuIGFkZCB0aGUgcG9zaXRpb24gd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vdGhpcyBnaXZlcyB1cyB0aGUgYWJzb2x1dGUgaW5kZXggaW4gdGhlIGVudGlyZSB4bWwsIHdoaWNoIHdlIGNhbiB1c2UgdG8gZmluZCB0aGUgbGluZSBhdCBsYXN0XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoaXNWYWxpZC5lcnIuY29kZSwgaXNWYWxpZC5lcnIubXNnLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgYXR0clN0clN0YXJ0ICsgaXNWYWxpZC5lcnIubGluZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjbG9zaW5nVGFnKSB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQudGFnQ2xvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIkNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJyBkb2Vzbid0IGhhdmUgcHJvcGVyIGNsb3NpbmcuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChhdHRyU3RyLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIkNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJyBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMgb3IgaW52YWxpZCBzdGFydGluZy5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ1N0YXJ0UG9zKSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0YWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJywgXCJDbG9zaW5nIHRhZyAnXCIrdGFnTmFtZStcIicgaGFzIG5vdCBiZWVuIG9wZW5lZC5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ1N0YXJ0UG9zKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG90ZyA9IHRhZ3MucG9wKCk7XG4gICAgICAgICAgICBpZiAodGFnTmFtZSAhPT0gb3RnLnRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgbGV0IG9wZW5Qb3MgPSBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgb3RnLnRhZ1N0YXJ0UG9zKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJyxcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNsb3NpbmcgdGFnICdcIitvdGcudGFnTmFtZStcIicgKG9wZW5lZCBpbiBsaW5lIFwiK29wZW5Qb3MubGluZStcIiwgY29sIFwiK29wZW5Qb3MuY29sK1wiKSBpbnN0ZWFkIG9mIGNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJy5cIixcbiAgICAgICAgICAgICAgICBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgdGFnU3RhcnRQb3MpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy93aGVuIHRoZXJlIGFyZSBubyBtb3JlIHRhZ3MsIHdlIHJlYWNoZWQgdGhlIHJvb3QgbGV2ZWwuXG4gICAgICAgICAgICBpZiAodGFncy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICByZWFjaGVkUm9vdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0ZUF0dHJpYnV0ZVN0cmluZyhhdHRyU3RyLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoaXNWYWxpZCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgLy90aGUgcmVzdWx0IGZyb20gdGhlIG5lc3RlZCBmdW5jdGlvbiByZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZXJyb3Igd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vaW4gb3JkZXIgdG8gZ2V0IHRoZSAndHJ1ZScgZXJyb3IgbGluZSwgd2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGUgYmVnaW5zIChpIC0gYXR0clN0ci5sZW5ndGgpIGFuZCB0aGVuIGFkZCB0aGUgcG9zaXRpb24gd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vdGhpcyBnaXZlcyB1cyB0aGUgYWJzb2x1dGUgaW5kZXggaW4gdGhlIGVudGlyZSB4bWwsIHdoaWNoIHdlIGNhbiB1c2UgdG8gZmluZCB0aGUgbGluZSBhdCBsYXN0XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoaXNWYWxpZC5lcnIuY29kZSwgaXNWYWxpZC5lcnIubXNnLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSAtIGF0dHJTdHIubGVuZ3RoICsgaXNWYWxpZC5lcnIubGluZSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vaWYgdGhlIHJvb3QgbGV2ZWwgaGFzIGJlZW4gcmVhY2hlZCBiZWZvcmUgLi4uXG4gICAgICAgICAgaWYgKHJlYWNoZWRSb290ID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCAnTXVsdGlwbGUgcG9zc2libGUgcm9vdCBub2RlcyBmb3VuZC4nLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSl7XG4gICAgICAgICAgICAvL2Rvbid0IHB1c2ggaW50byBzdGFja1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YWdzLnB1c2goe3RhZ05hbWUsIHRhZ1N0YXJ0UG9zfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhZ0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2tpcCB0YWcgdGV4dCB2YWx1ZVxuICAgICAgICAvL0l0IG1heSBpbmNsdWRlIGNvbW1lbnRzIGFuZCBDREFUQSB2YWx1ZVxuICAgICAgICBmb3IgKGkrKzsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnKSB7XG4gICAgICAgICAgICBpZiAoeG1sRGF0YVtpICsgMV0gPT09ICchJykge1xuICAgICAgICAgICAgICAvL2NvbW1lbnQgb3IgQ0FEQVRBXG4gICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgaSA9IHJlYWRDb21tZW50QW5kQ0RBVEEoeG1sRGF0YSwgaSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2krMV0gPT09ICc/Jykge1xuICAgICAgICAgICAgICBpID0gcmVhZFBJKHhtbERhdGEsICsraSk7XG4gICAgICAgICAgICAgIGlmIChpLmVycikgcmV0dXJuIGk7XG4gICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJyYnKSB7XG4gICAgICAgICAgICBjb25zdCBhZnRlckFtcCA9IHZhbGlkYXRlQW1wZXJzYW5kKHhtbERhdGEsIGkpO1xuICAgICAgICAgICAgaWYgKGFmdGVyQW1wID09IC0xKVxuICAgICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRDaGFyJywgXCJjaGFyICcmJyBpcyBub3QgZXhwZWN0ZWQuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgICAgICBpID0gYWZ0ZXJBbXA7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZiAocmVhY2hlZFJvb3QgPT09IHRydWUgJiYgIWlzV2hpdGVTcGFjZSh4bWxEYXRhW2ldKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCBcIkV4dHJhIHRleHQgYXQgdGhlIGVuZFwiLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSAvL2VuZCBvZiByZWFkaW5nIHRhZyB0ZXh0IHZhbHVlXG4gICAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcpIHtcbiAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCBpc1doaXRlU3BhY2UoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRDaGFyJywgXCJjaGFyICdcIit4bWxEYXRhW2ldK1wiJyBpcyBub3QgZXhwZWN0ZWQuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0YWdGb3VuZCkge1xuICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFhtbCcsICdTdGFydCB0YWcgZXhwZWN0ZWQuJywgMSk7XG4gIH1lbHNlIGlmICh0YWdzLmxlbmd0aCA9PSAxKSB7XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIlVuY2xvc2VkIHRhZyAnXCIrdGFnc1swXS50YWdOYW1lK1wiJy5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ3NbMF0udGFnU3RhcnRQb3MpKTtcbiAgfWVsc2UgaWYgKHRhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkWG1sJywgXCJJbnZhbGlkICdcIitcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0YWdzLm1hcCh0ID0+IHQudGFnTmFtZSksIG51bGwsIDQpLnJlcGxhY2UoL1xccj9cXG4vZywgJycpK1xuICAgICAgICAgIFwiJyBmb3VuZC5cIiwge2xpbmU6IDEsIGNvbDogMX0pO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBpc1doaXRlU3BhY2UoY2hhcil7XG4gIHJldHVybiBjaGFyID09PSAnICcgfHwgY2hhciA9PT0gJ1xcdCcgfHwgY2hhciA9PT0gJ1xcbicgIHx8IGNoYXIgPT09ICdcXHInO1xufVxuLyoqXG4gKiBSZWFkIFByb2Nlc3NpbmcgaW5zc3RydWN0aW9ucyBhbmQgc2tpcFxuICogQHBhcmFtIHsqfSB4bWxEYXRhXG4gKiBAcGFyYW0geyp9IGlcbiAqL1xuZnVuY3Rpb24gcmVhZFBJKHhtbERhdGEsIGkpIHtcbiAgY29uc3Qgc3RhcnQgPSBpO1xuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PSAnPycgfHwgeG1sRGF0YVtpXSA9PSAnICcpIHtcbiAgICAgIC8vdGFnbmFtZVxuICAgICAgY29uc3QgdGFnbmFtZSA9IHhtbERhdGEuc3Vic3RyKHN0YXJ0LCBpIC0gc3RhcnQpO1xuICAgICAgaWYgKGkgPiA1ICYmIHRhZ25hbWUgPT09ICd4bWwnKSB7XG4gICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFhtbCcsICdYTUwgZGVjbGFyYXRpb24gYWxsb3dlZCBvbmx5IGF0IHRoZSBzdGFydCBvZiB0aGUgZG9jdW1lbnQuJywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PSAnPycgJiYgeG1sRGF0YVtpICsgMV0gPT0gJz4nKSB7XG4gICAgICAgIC8vY2hlY2sgaWYgdmFsaWQgYXR0cmlidXQgc3RyaW5nXG4gICAgICAgIGkrKztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb21tZW50QW5kQ0RBVEEoeG1sRGF0YSwgaSkge1xuICBpZiAoeG1sRGF0YS5sZW5ndGggPiBpICsgNSAmJiB4bWxEYXRhW2kgKyAxXSA9PT0gJy0nICYmIHhtbERhdGFbaSArIDJdID09PSAnLScpIHtcbiAgICAvL2NvbW1lbnRcbiAgICBmb3IgKGkgKz0gMzsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnLScgJiYgeG1sRGF0YVtpICsgMV0gPT09ICctJyAmJiB4bWxEYXRhW2kgKyAyXSA9PT0gJz4nKSB7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIHhtbERhdGEubGVuZ3RoID4gaSArIDggJiZcbiAgICB4bWxEYXRhW2kgKyAxXSA9PT0gJ0QnICYmXG4gICAgeG1sRGF0YVtpICsgMl0gPT09ICdPJyAmJlxuICAgIHhtbERhdGFbaSArIDNdID09PSAnQycgJiZcbiAgICB4bWxEYXRhW2kgKyA0XSA9PT0gJ1QnICYmXG4gICAgeG1sRGF0YVtpICsgNV0gPT09ICdZJyAmJlxuICAgIHhtbERhdGFbaSArIDZdID09PSAnUCcgJiZcbiAgICB4bWxEYXRhW2kgKyA3XSA9PT0gJ0UnXG4gICkge1xuICAgIGxldCBhbmdsZUJyYWNrZXRzQ291bnQgPSAxO1xuICAgIGZvciAoaSArPSA4OyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICc8Jykge1xuICAgICAgICBhbmdsZUJyYWNrZXRzQ291bnQrKztcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJz4nKSB7XG4gICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudC0tO1xuICAgICAgICBpZiAoYW5nbGVCcmFja2V0c0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoXG4gICAgeG1sRGF0YS5sZW5ndGggPiBpICsgOSAmJlxuICAgIHhtbERhdGFbaSArIDFdID09PSAnWycgJiZcbiAgICB4bWxEYXRhW2kgKyAyXSA9PT0gJ0MnICYmXG4gICAgeG1sRGF0YVtpICsgM10gPT09ICdEJyAmJlxuICAgIHhtbERhdGFbaSArIDRdID09PSAnQScgJiZcbiAgICB4bWxEYXRhW2kgKyA1XSA9PT0gJ1QnICYmXG4gICAgeG1sRGF0YVtpICsgNl0gPT09ICdBJyAmJlxuICAgIHhtbERhdGFbaSArIDddID09PSAnWydcbiAgKSB7XG4gICAgZm9yIChpICs9IDg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJ10nICYmIHhtbERhdGFbaSArIDFdID09PSAnXScgJiYgeG1sRGF0YVtpICsgMl0gPT09ICc+Jykge1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpO1xufVxuXG5jb25zdCBkb3VibGVRdW90ZSA9ICdcIic7XG5jb25zdCBzaW5nbGVRdW90ZSA9IFwiJ1wiO1xuXG4vKipcbiAqIEtlZXAgcmVhZGluZyB4bWxEYXRhIHVudGlsICc8JyBpcyBmb3VuZCBvdXRzaWRlIHRoZSBhdHRyaWJ1dGUgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30geG1sRGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IGlcbiAqL1xuZnVuY3Rpb24gcmVhZEF0dHJpYnV0ZVN0cih4bWxEYXRhLCBpKSB7XG4gIGxldCBhdHRyU3RyID0gJyc7XG4gIGxldCBzdGFydENoYXIgPSAnJztcbiAgbGV0IHRhZ0Nsb3NlZCA9IGZhbHNlO1xuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gZG91YmxlUXVvdGUgfHwgeG1sRGF0YVtpXSA9PT0gc2luZ2xlUXVvdGUpIHtcbiAgICAgIGlmIChzdGFydENoYXIgPT09ICcnKSB7XG4gICAgICAgIHN0YXJ0Q2hhciA9IHhtbERhdGFbaV07XG4gICAgICB9IGVsc2UgaWYgKHN0YXJ0Q2hhciAhPT0geG1sRGF0YVtpXSkge1xuICAgICAgICAvL2lmIHZhdWUgaXMgZW5jbG9zZWQgd2l0aCBkb3VibGUgcXVvdGUgdGhlbiBzaW5nbGUgcXVvdGVzIGFyZSBhbGxvd2VkIGluc2lkZSB0aGUgdmFsdWUgYW5kIHZpY2UgdmVyc2FcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0Q2hhciA9ICcnO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJz4nKSB7XG4gICAgICBpZiAoc3RhcnRDaGFyID09PSAnJykge1xuICAgICAgICB0YWdDbG9zZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYXR0clN0ciArPSB4bWxEYXRhW2ldO1xuICB9XG4gIGlmIChzdGFydENoYXIgIT09ICcnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB2YWx1ZTogYXR0clN0cixcbiAgICBpbmRleDogaSxcbiAgICB0YWdDbG9zZWQ6IHRhZ0Nsb3NlZFxuICB9O1xufVxuXG4vKipcbiAqIFNlbGVjdCBhbGwgdGhlIGF0dHJpYnV0ZXMgd2hldGhlciB2YWxpZCBvciBpbnZhbGlkLlxuICovXG5jb25zdCB2YWxpZEF0dHJTdHJSZWd4cCA9IG5ldyBSZWdFeHAoJyhcXFxccyopKFteXFxcXHM9XSspKFxcXFxzKj0pPyhcXFxccyooW1xcJ1wiXSkoKFtcXFxcc1xcXFxTXSkqPylcXFxcNSk/JywgJ2cnKTtcblxuLy9hdHRyLCA9XCJzZFwiLCBhPVwiYW1pdCdzXCIsIGE9XCJzZFwiYj1cInNhZlwiLCBhYiAgY2Q9XCJcIlxuXG5mdW5jdGlvbiB2YWxpZGF0ZUF0dHJpYnV0ZVN0cmluZyhhdHRyU3RyLCBvcHRpb25zKSB7XG4gIC8vY29uc29sZS5sb2coXCJzdGFydDpcIithdHRyU3RyK1wiOmVuZFwiKTtcblxuICAvL2lmKGF0dHJTdHIudHJpbSgpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7IC8vZW1wdHkgc3RyaW5nXG5cbiAgY29uc3QgbWF0Y2hlcyA9IGdldEFsbE1hdGNoZXMoYXR0clN0ciwgdmFsaWRBdHRyU3RyUmVneHApO1xuICBjb25zdCBhdHRyTmFtZXMgPSB7fTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobWF0Y2hlc1tpXVsxXS5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vbm9zcGFjZSBiZWZvcmUgYXR0cmlidXRlIG5hbWU6IGE9XCJzZFwiYj1cInNhZlwiXG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRBdHRyJywgXCJBdHRyaWJ1dGUgJ1wiK21hdGNoZXNbaV1bMl0rXCInIGhhcyBubyBzcGFjZSBpbiBzdGFydGluZy5cIiwgZ2V0UG9zaXRpb25Gcm9tTWF0Y2gobWF0Y2hlc1tpXSkpXG4gICAgfSBlbHNlIGlmIChtYXRjaGVzW2ldWzNdICE9PSB1bmRlZmluZWQgJiYgbWF0Y2hlc1tpXVs0XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRBdHRyJywgXCJBdHRyaWJ1dGUgJ1wiK21hdGNoZXNbaV1bMl0rXCInIGlzIHdpdGhvdXQgdmFsdWUuXCIsIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoZXNbaV0pKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoZXNbaV1bM10gPT09IHVuZGVmaW5lZCAmJiAhb3B0aW9ucy5hbGxvd0Jvb2xlYW5BdHRyaWJ1dGVzKSB7XG4gICAgICAvL2luZGVwZW5kZW50IGF0dHJpYnV0ZTogYWJcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcImJvb2xlYW4gYXR0cmlidXRlICdcIittYXRjaGVzW2ldWzJdK1wiJyBpcyBub3QgYWxsb3dlZC5cIiwgZ2V0UG9zaXRpb25Gcm9tTWF0Y2gobWF0Y2hlc1tpXSkpO1xuICAgIH1cbiAgICAvKiBlbHNlIGlmKG1hdGNoZXNbaV1bNl0gPT09IHVuZGVmaW5lZCl7Ly9hdHRyaWJ1dGUgd2l0aG91dCB2YWx1ZTogYWI9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycjogeyBjb2RlOlwiSW52YWxpZEF0dHJcIixtc2c6XCJhdHRyaWJ1dGUgXCIgKyBtYXRjaGVzW2ldWzJdICsgXCIgaGFzIG5vIHZhbHVlIGFzc2lnbmVkLlwifX07XG4gICAgICAgICAgICAgICAgfSAqL1xuICAgIGNvbnN0IGF0dHJOYW1lID0gbWF0Y2hlc1tpXVsyXTtcbiAgICBpZiAoIXZhbGlkYXRlQXR0ck5hbWUoYXR0ck5hbWUpKSB7XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRBdHRyJywgXCJBdHRyaWJ1dGUgJ1wiK2F0dHJOYW1lK1wiJyBpcyBhbiBpbnZhbGlkIG5hbWUuXCIsIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoZXNbaV0pKTtcbiAgICB9XG4gICAgaWYgKCFhdHRyTmFtZXMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUpKSB7XG4gICAgICAvL2NoZWNrIGZvciBkdXBsaWNhdGUgYXR0cmlidXRlLlxuICAgICAgYXR0ck5hbWVzW2F0dHJOYW1lXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcIkF0dHJpYnV0ZSAnXCIrYXR0ck5hbWUrXCInIGlzIHJlcGVhdGVkLlwiLCBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaGVzW2ldKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyQW1wZXJzYW5kKHhtbERhdGEsIGkpIHtcbiAgbGV0IHJlID0gL1xcZC87XG4gIGlmICh4bWxEYXRhW2ldID09PSAneCcpIHtcbiAgICBpKys7XG4gICAgcmUgPSAvW1xcZGEtZkEtRl0vO1xuICB9XG4gIGZvciAoOyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKykge1xuICAgIGlmICh4bWxEYXRhW2ldID09PSAnOycpXG4gICAgICByZXR1cm4gaTtcbiAgICBpZiAoIXhtbERhdGFbaV0ubWF0Y2gocmUpKVxuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUFtcGVyc2FuZCh4bWxEYXRhLCBpKSB7XG4gIC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi94bWwvI2R0LWNoYXJyZWZcbiAgaSsrO1xuICBpZiAoeG1sRGF0YVtpXSA9PT0gJzsnKVxuICAgIHJldHVybiAtMTtcbiAgaWYgKHhtbERhdGFbaV0gPT09ICcjJykge1xuICAgIGkrKztcbiAgICByZXR1cm4gdmFsaWRhdGVOdW1iZXJBbXBlcnNhbmQoeG1sRGF0YSwgaSk7XG4gIH1cbiAgbGV0IGNvdW50ID0gMDtcbiAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrLCBjb3VudCsrKSB7XG4gICAgaWYgKHhtbERhdGFbaV0ubWF0Y2goL1xcdy8pICYmIGNvdW50IDwgMjApXG4gICAgICBjb250aW51ZTtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzsnKVxuICAgICAgYnJlYWs7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIHJldHVybiBpO1xufVxuXG5mdW5jdGlvbiBnZXRFcnJvck9iamVjdChjb2RlLCBtZXNzYWdlLCBsaW5lTnVtYmVyKSB7XG4gIHJldHVybiB7XG4gICAgZXJyOiB7XG4gICAgICBjb2RlOiBjb2RlLFxuICAgICAgbXNnOiBtZXNzYWdlLFxuICAgICAgbGluZTogbGluZU51bWJlci5saW5lIHx8IGxpbmVOdW1iZXIsXG4gICAgICBjb2w6IGxpbmVOdW1iZXIuY29sLFxuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQXR0ck5hbWUoYXR0ck5hbWUpIHtcbiAgcmV0dXJuIGlzTmFtZShhdHRyTmFtZSk7XG59XG5cbi8vIGNvbnN0IHN0YXJ0c1dpdGhYTUwgPSAvXnhtbC9pO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVRhZ05hbWUodGFnbmFtZSkge1xuICByZXR1cm4gaXNOYW1lKHRhZ25hbWUpIC8qICYmICF0YWduYW1lLm1hdGNoKHN0YXJ0c1dpdGhYTUwpICovO1xufVxuXG4vL3RoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgbGluZSBudW1iZXIgZm9yIHRoZSBjaGFyYWN0ZXIgYXQgdGhlIGdpdmVuIGluZGV4XG5mdW5jdGlvbiBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaW5kZXgpIHtcbiAgY29uc3QgbGluZXMgPSB4bWxEYXRhLnN1YnN0cmluZygwLCBpbmRleCkuc3BsaXQoL1xccj9cXG4vKTtcbiAgcmV0dXJuIHtcbiAgICBsaW5lOiBsaW5lcy5sZW5ndGgsXG5cbiAgICAvLyBjb2x1bW4gbnVtYmVyIGlzIGxhc3QgbGluZSdzIGxlbmd0aCArIDEsIGJlY2F1c2UgY29sdW1uIG51bWJlcmluZyBzdGFydHMgYXQgMTpcbiAgICBjb2w6IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLmxlbmd0aCArIDFcbiAgfTtcbn1cblxuLy90aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgbWF0Y2ggd2l0aGluIGF0dHJTdHJcbmZ1bmN0aW9uIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoKSB7XG4gIHJldHVybiBtYXRjaC5zdGFydEluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoO1xufVxuIiwgImltcG9ydCB7IGJ1aWxkT3B0aW9uc30gZnJvbSAnLi9PcHRpb25zQnVpbGRlci5qcyc7XG5pbXBvcnQgT3JkZXJlZE9ialBhcnNlciBmcm9tICcuL09yZGVyZWRPYmpQYXJzZXIuanMnO1xuaW1wb3J0IHByZXR0aWZ5IGZyb20gJy4vbm9kZTJqc29uLmpzJztcbmltcG9ydCB7dmFsaWRhdGV9IGZyb20gXCIuLi92YWxpZGF0b3IuanNcIjtcbmltcG9ydCBYbWxOb2RlIGZyb20gJy4veG1sTm9kZS5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFhNTFBhcnNlcntcbiAgICBcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKXtcbiAgICAgICAgdGhpcy5leHRlcm5hbEVudGl0aWVzID0ge307XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IGJ1aWxkT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgXG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhcnNlIFhNTCBkYXRzIHRvIEpTIG9iamVjdCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xCdWZmZXJ9IHhtbERhdGEgXG4gICAgICogQHBhcmFtIHtib29sZWFufE9iamVjdH0gdmFsaWRhdGlvbk9wdGlvbiBcbiAgICAgKi9cbiAgICBwYXJzZSh4bWxEYXRhLHZhbGlkYXRpb25PcHRpb24pe1xuICAgICAgICBpZih0eXBlb2YgeG1sRGF0YSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgIH1lbHNlIGlmKCB4bWxEYXRhLnRvU3RyaW5nKXtcbiAgICAgICAgICAgIHhtbERhdGEgPSB4bWxEYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWE1MIGRhdGEgaXMgYWNjZXB0ZWQgaW4gU3RyaW5nIG9yIEJ5dGVzW10gZm9ybS5cIilcbiAgICAgICAgfVxuICAgICAgICBpZiggdmFsaWRhdGlvbk9wdGlvbil7XG4gICAgICAgICAgICBpZih2YWxpZGF0aW9uT3B0aW9uID09PSB0cnVlKSB2YWxpZGF0aW9uT3B0aW9uID0ge307IC8vdmFsaWRhdGUgd2l0aCBkZWZhdWx0IG9wdGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoeG1sRGF0YSwgdmFsaWRhdGlvbk9wdGlvbik7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKCBgJHtyZXN1bHQuZXJyLm1zZ306JHtyZXN1bHQuZXJyLmxpbmV9OiR7cmVzdWx0LmVyci5jb2x9YCApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmRlcmVkT2JqUGFyc2VyID0gbmV3IE9yZGVyZWRPYmpQYXJzZXIodGhpcy5vcHRpb25zKTtcbiAgICAgICAgb3JkZXJlZE9ialBhcnNlci5hZGRFeHRlcm5hbEVudGl0aWVzKHRoaXMuZXh0ZXJuYWxFbnRpdGllcyk7XG4gICAgICAgIGNvbnN0IG9yZGVyZWRSZXN1bHQgPSBvcmRlcmVkT2JqUGFyc2VyLnBhcnNlWG1sKHhtbERhdGEpO1xuICAgICAgICBpZih0aGlzLm9wdGlvbnMucHJlc2VydmVPcmRlciB8fCBvcmRlcmVkUmVzdWx0ID09PSB1bmRlZmluZWQpIHJldHVybiBvcmRlcmVkUmVzdWx0O1xuICAgICAgICBlbHNlIHJldHVybiBwcmV0dGlmeShvcmRlcmVkUmVzdWx0LCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBFbnRpdHkgd2hpY2ggaXMgbm90IGJ5IGRlZmF1bHQgc3VwcG9ydGVkIGJ5IHRoaXMgbGlicmFyeVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFxuICAgICAqL1xuICAgIGFkZEVudGl0eShrZXksIHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIiZcIikgIT09IC0xKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVudGl0eSB2YWx1ZSBjYW4ndCBoYXZlICcmJ1wiKVxuICAgICAgICB9ZWxzZSBpZihrZXkuaW5kZXhPZihcIiZcIikgIT09IC0xIHx8IGtleS5pbmRleE9mKFwiO1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQW4gZW50aXR5IG11c3QgYmUgc2V0IHdpdGhvdXQgJyYnIGFuZCAnOycuIEVnLiB1c2UgJyN4RCcgZm9yICcmI3hEOydcIilcbiAgICAgICAgfWVsc2UgaWYodmFsdWUgPT09IFwiJlwiKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFuIGVudGl0eSB3aXRoIHZhbHVlICcmJyBpcyBub3QgcGVybWl0dGVkXCIpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxFbnRpdGllc1trZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgU3ltYm9sIHRoYXQgY2FuIGJlIHVzZWQgdG8gYWNjZXNzIHRoZSBtZXRhZGF0YVxuICAgICAqIHByb3BlcnR5IG9uIGEgbm9kZS5cbiAgICAgKiBcbiAgICAgKiBJZiBTeW1ib2wgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGUgZW52aXJvbm1lbnQsIGFuIG9yZGluYXJ5IHByb3BlcnR5IGlzIHVzZWRcbiAgICAgKiBhbmQgdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IGlzIGhlcmUgcmV0dXJuZWQuXG4gICAgICogXG4gICAgICogVGhlIFhNTE1ldGFEYXRhIHByb3BlcnR5IGlzIG9ubHkgcHJlc2VudCB3aGVuIGBjYXB0dXJlTWV0YURhdGFgXG4gICAgICogaXMgdHJ1ZSBpbiB0aGUgb3B0aW9ucy5cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0TWV0YURhdGFTeW1ib2woKSB7XG4gICAgICAgIHJldHVybiBYbWxOb2RlLmdldE1ldGFEYXRhU3ltYm9sKCk7XG4gICAgfVxufVxuIl0s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
