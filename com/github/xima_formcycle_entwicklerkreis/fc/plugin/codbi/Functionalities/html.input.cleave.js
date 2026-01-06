import {
  EQ
} from "./chunk-CZTL4BAA.js";
import {
  TYPE
} from "./chunk-MQ6BYLTP.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass,
  __decorateParam
} from "./chunk-KWZW6WYL.js";

// ../../node_modules/cleave.js/dist/cleave-esm.js
var commonjsGlobal = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var NumeralFormatter = function(numeralDecimalMark, numeralIntegerScale, numeralDecimalScale, numeralThousandsGroupStyle, numeralPositiveOnly, stripLeadingZeroes, prefix, signBeforePrefix, tailPrefix, delimiter) {
  var owner = this;
  owner.numeralDecimalMark = numeralDecimalMark || ".";
  owner.numeralIntegerScale = numeralIntegerScale > 0 ? numeralIntegerScale : 0;
  owner.numeralDecimalScale = numeralDecimalScale >= 0 ? numeralDecimalScale : 2;
  owner.numeralThousandsGroupStyle = numeralThousandsGroupStyle || NumeralFormatter.groupStyle.thousand;
  owner.numeralPositiveOnly = !!numeralPositiveOnly;
  owner.stripLeadingZeroes = stripLeadingZeroes !== false;
  owner.prefix = prefix || prefix === "" ? prefix : "";
  owner.signBeforePrefix = !!signBeforePrefix;
  owner.tailPrefix = !!tailPrefix;
  owner.delimiter = delimiter || delimiter === "" ? delimiter : ",";
  owner.delimiterRE = delimiter ? new RegExp("\\" + delimiter, "g") : "";
};
NumeralFormatter.groupStyle = {
  thousand: "thousand",
  lakh: "lakh",
  wan: "wan",
  none: "none"
};
NumeralFormatter.prototype = {
  getRawValue: function(value) {
    return value.replace(this.delimiterRE, "").replace(this.numeralDecimalMark, ".");
  },
  format: function(value) {
    var owner = this, parts, partSign, partSignAndPrefix, partInteger, partDecimal = "";
    value = value.replace(/[A-Za-z]/g, "").replace(owner.numeralDecimalMark, "M").replace(/[^\dM-]/g, "").replace(/^\-/, "N").replace(/\-/g, "").replace("N", owner.numeralPositiveOnly ? "" : "-").replace("M", owner.numeralDecimalMark);
    if (owner.stripLeadingZeroes) {
      value = value.replace(/^(-)?0+(?=\d)/, "$1");
    }
    partSign = value.slice(0, 1) === "-" ? "-" : "";
    if (typeof owner.prefix != "undefined") {
      if (owner.signBeforePrefix) {
        partSignAndPrefix = partSign + owner.prefix;
      } else {
        partSignAndPrefix = owner.prefix + partSign;
      }
    } else {
      partSignAndPrefix = partSign;
    }
    partInteger = value;
    if (value.indexOf(owner.numeralDecimalMark) >= 0) {
      parts = value.split(owner.numeralDecimalMark);
      partInteger = parts[0];
      partDecimal = owner.numeralDecimalMark + parts[1].slice(0, owner.numeralDecimalScale);
    }
    if (partSign === "-") {
      partInteger = partInteger.slice(1);
    }
    if (owner.numeralIntegerScale > 0) {
      partInteger = partInteger.slice(0, owner.numeralIntegerScale);
    }
    switch (owner.numeralThousandsGroupStyle) {
      case NumeralFormatter.groupStyle.lakh:
        partInteger = partInteger.replace(/(\d)(?=(\d\d)+\d$)/g, "$1" + owner.delimiter);
        break;
      case NumeralFormatter.groupStyle.wan:
        partInteger = partInteger.replace(/(\d)(?=(\d{4})+$)/g, "$1" + owner.delimiter);
        break;
      case NumeralFormatter.groupStyle.thousand:
        partInteger = partInteger.replace(/(\d)(?=(\d{3})+$)/g, "$1" + owner.delimiter);
        break;
    }
    if (owner.tailPrefix) {
      return partSign + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : "") + owner.prefix;
    }
    return partSignAndPrefix + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : "");
  }
};
var NumeralFormatter_1 = NumeralFormatter;
var DateFormatter = function(datePattern, dateMin, dateMax) {
  var owner = this;
  owner.date = [];
  owner.blocks = [];
  owner.datePattern = datePattern;
  owner.dateMin = dateMin.split("-").reverse().map(function(x) {
    return parseInt(x, 10);
  });
  if (owner.dateMin.length === 2) owner.dateMin.unshift(0);
  owner.dateMax = dateMax.split("-").reverse().map(function(x) {
    return parseInt(x, 10);
  });
  if (owner.dateMax.length === 2) owner.dateMax.unshift(0);
  owner.initBlocks();
};
DateFormatter.prototype = {
  initBlocks: function() {
    var owner = this;
    owner.datePattern.forEach(function(value) {
      if (value === "Y") {
        owner.blocks.push(4);
      } else {
        owner.blocks.push(2);
      }
    });
  },
  getISOFormatDate: function() {
    var owner = this, date = owner.date;
    return date[2] ? date[2] + "-" + owner.addLeadingZero(date[1]) + "-" + owner.addLeadingZero(date[0]) : "";
  },
  getBlocks: function() {
    return this.blocks;
  },
  getValidatedDate: function(value) {
    var owner = this, result = "";
    value = value.replace(/[^\d]/g, "");
    owner.blocks.forEach(function(length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length), sub0 = sub.slice(0, 1), rest = value.slice(length);
        switch (owner.datePattern[index]) {
          case "d":
            if (sub === "00") {
              sub = "01";
            } else if (parseInt(sub0, 10) > 3) {
              sub = "0" + sub0;
            } else if (parseInt(sub, 10) > 31) {
              sub = "31";
            }
            break;
          case "m":
            if (sub === "00") {
              sub = "01";
            } else if (parseInt(sub0, 10) > 1) {
              sub = "0" + sub0;
            } else if (parseInt(sub, 10) > 12) {
              sub = "12";
            }
            break;
        }
        result += sub;
        value = rest;
      }
    });
    return this.getFixedDateString(result);
  },
  getFixedDateString: function(value) {
    var owner = this, datePattern = owner.datePattern, date = [], dayIndex = 0, monthIndex = 0, yearIndex = 0, dayStartIndex = 0, monthStartIndex = 0, yearStartIndex = 0, day, month, year, fullYearDone = false;
    if (value.length === 4 && datePattern[0].toLowerCase() !== "y" && datePattern[1].toLowerCase() !== "y") {
      dayStartIndex = datePattern[0] === "d" ? 0 : 2;
      monthStartIndex = 2 - dayStartIndex;
      day = parseInt(value.slice(dayStartIndex, dayStartIndex + 2), 10);
      month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
      date = this.getFixedDate(day, month, 0);
    }
    if (value.length === 8) {
      datePattern.forEach(function(type, index) {
        switch (type) {
          case "d":
            dayIndex = index;
            break;
          case "m":
            monthIndex = index;
            break;
          default:
            yearIndex = index;
            break;
        }
      });
      yearStartIndex = yearIndex * 2;
      dayStartIndex = dayIndex <= yearIndex ? dayIndex * 2 : dayIndex * 2 + 2;
      monthStartIndex = monthIndex <= yearIndex ? monthIndex * 2 : monthIndex * 2 + 2;
      day = parseInt(value.slice(dayStartIndex, dayStartIndex + 2), 10);
      month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
      year = parseInt(value.slice(yearStartIndex, yearStartIndex + 4), 10);
      fullYearDone = value.slice(yearStartIndex, yearStartIndex + 4).length === 4;
      date = this.getFixedDate(day, month, year);
    }
    if (value.length === 4 && (datePattern[0] === "y" || datePattern[1] === "y")) {
      monthStartIndex = datePattern[0] === "m" ? 0 : 2;
      yearStartIndex = 2 - monthStartIndex;
      month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
      year = parseInt(value.slice(yearStartIndex, yearStartIndex + 2), 10);
      fullYearDone = value.slice(yearStartIndex, yearStartIndex + 2).length === 2;
      date = [0, month, year];
    }
    if (value.length === 6 && (datePattern[0] === "Y" || datePattern[1] === "Y")) {
      monthStartIndex = datePattern[0] === "m" ? 0 : 4;
      yearStartIndex = 2 - 0.5 * monthStartIndex;
      month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
      year = parseInt(value.slice(yearStartIndex, yearStartIndex + 4), 10);
      fullYearDone = value.slice(yearStartIndex, yearStartIndex + 4).length === 4;
      date = [0, month, year];
    }
    date = owner.getRangeFixedDate(date);
    owner.date = date;
    var result = date.length === 0 ? value : datePattern.reduce(function(previous, current) {
      switch (current) {
        case "d":
          return previous + (date[0] === 0 ? "" : owner.addLeadingZero(date[0]));
        case "m":
          return previous + (date[1] === 0 ? "" : owner.addLeadingZero(date[1]));
        case "y":
          return previous + (fullYearDone ? owner.addLeadingZeroForYear(date[2], false) : "");
        case "Y":
          return previous + (fullYearDone ? owner.addLeadingZeroForYear(date[2], true) : "");
      }
    }, "");
    return result;
  },
  getRangeFixedDate: function(date) {
    var owner = this, datePattern = owner.datePattern, dateMin = owner.dateMin || [], dateMax = owner.dateMax || [];
    if (!date.length || dateMin.length < 3 && dateMax.length < 3) return date;
    if (datePattern.find(function(x) {
      return x.toLowerCase() === "y";
    }) && date[2] === 0) return date;
    if (dateMax.length && (dateMax[2] < date[2] || dateMax[2] === date[2] && (dateMax[1] < date[1] || dateMax[1] === date[1] && dateMax[0] < date[0]))) return dateMax;
    if (dateMin.length && (dateMin[2] > date[2] || dateMin[2] === date[2] && (dateMin[1] > date[1] || dateMin[1] === date[1] && dateMin[0] > date[0]))) return dateMin;
    return date;
  },
  getFixedDate: function(day, month, year) {
    day = Math.min(day, 31);
    month = Math.min(month, 12);
    year = parseInt(year || 0, 10);
    if (month < 7 && month % 2 === 0 || month > 8 && month % 2 === 1) {
      day = Math.min(day, month === 2 ? this.isLeapYear(year) ? 29 : 28 : 30);
    }
    return [day, month, year];
  },
  isLeapYear: function(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  },
  addLeadingZero: function(number) {
    return (number < 10 ? "0" : "") + number;
  },
  addLeadingZeroForYear: function(number, fullYearMode) {
    if (fullYearMode) {
      return (number < 10 ? "000" : number < 100 ? "00" : number < 1e3 ? "0" : "") + number;
    }
    return (number < 10 ? "0" : "") + number;
  }
};
var DateFormatter_1 = DateFormatter;
var TimeFormatter = function(timePattern, timeFormat) {
  var owner = this;
  owner.time = [];
  owner.blocks = [];
  owner.timePattern = timePattern;
  owner.timeFormat = timeFormat;
  owner.initBlocks();
};
TimeFormatter.prototype = {
  initBlocks: function() {
    var owner = this;
    owner.timePattern.forEach(function() {
      owner.blocks.push(2);
    });
  },
  getISOFormatTime: function() {
    var owner = this, time = owner.time;
    return time[2] ? owner.addLeadingZero(time[0]) + ":" + owner.addLeadingZero(time[1]) + ":" + owner.addLeadingZero(time[2]) : "";
  },
  getBlocks: function() {
    return this.blocks;
  },
  getTimeFormatOptions: function() {
    var owner = this;
    if (String(owner.timeFormat) === "12") {
      return {
        maxHourFirstDigit: 1,
        maxHours: 12,
        maxMinutesFirstDigit: 5,
        maxMinutes: 60
      };
    }
    return {
      maxHourFirstDigit: 2,
      maxHours: 23,
      maxMinutesFirstDigit: 5,
      maxMinutes: 60
    };
  },
  getValidatedTime: function(value) {
    var owner = this, result = "";
    value = value.replace(/[^\d]/g, "");
    var timeFormatOptions = owner.getTimeFormatOptions();
    owner.blocks.forEach(function(length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length), sub0 = sub.slice(0, 1), rest = value.slice(length);
        switch (owner.timePattern[index]) {
          case "h":
            if (parseInt(sub0, 10) > timeFormatOptions.maxHourFirstDigit) {
              sub = "0" + sub0;
            } else if (parseInt(sub, 10) > timeFormatOptions.maxHours) {
              sub = timeFormatOptions.maxHours + "";
            }
            break;
          case "m":
          case "s":
            if (parseInt(sub0, 10) > timeFormatOptions.maxMinutesFirstDigit) {
              sub = "0" + sub0;
            } else if (parseInt(sub, 10) > timeFormatOptions.maxMinutes) {
              sub = timeFormatOptions.maxMinutes + "";
            }
            break;
        }
        result += sub;
        value = rest;
      }
    });
    return this.getFixedTimeString(result);
  },
  getFixedTimeString: function(value) {
    var owner = this, timePattern = owner.timePattern, time = [], secondIndex = 0, minuteIndex = 0, hourIndex = 0, secondStartIndex = 0, minuteStartIndex = 0, hourStartIndex = 0, second, minute, hour;
    if (value.length === 6) {
      timePattern.forEach(function(type, index) {
        switch (type) {
          case "s":
            secondIndex = index * 2;
            break;
          case "m":
            minuteIndex = index * 2;
            break;
          case "h":
            hourIndex = index * 2;
            break;
        }
      });
      hourStartIndex = hourIndex;
      minuteStartIndex = minuteIndex;
      secondStartIndex = secondIndex;
      second = parseInt(value.slice(secondStartIndex, secondStartIndex + 2), 10);
      minute = parseInt(value.slice(minuteStartIndex, minuteStartIndex + 2), 10);
      hour = parseInt(value.slice(hourStartIndex, hourStartIndex + 2), 10);
      time = this.getFixedTime(hour, minute, second);
    }
    if (value.length === 4 && owner.timePattern.indexOf("s") < 0) {
      timePattern.forEach(function(type, index) {
        switch (type) {
          case "m":
            minuteIndex = index * 2;
            break;
          case "h":
            hourIndex = index * 2;
            break;
        }
      });
      hourStartIndex = hourIndex;
      minuteStartIndex = minuteIndex;
      second = 0;
      minute = parseInt(value.slice(minuteStartIndex, minuteStartIndex + 2), 10);
      hour = parseInt(value.slice(hourStartIndex, hourStartIndex + 2), 10);
      time = this.getFixedTime(hour, minute, second);
    }
    owner.time = time;
    return time.length === 0 ? value : timePattern.reduce(function(previous, current) {
      switch (current) {
        case "s":
          return previous + owner.addLeadingZero(time[2]);
        case "m":
          return previous + owner.addLeadingZero(time[1]);
        case "h":
          return previous + owner.addLeadingZero(time[0]);
      }
    }, "");
  },
  getFixedTime: function(hour, minute, second) {
    second = Math.min(parseInt(second || 0, 10), 60);
    minute = Math.min(minute, 60);
    hour = Math.min(hour, 60);
    return [hour, minute, second];
  },
  addLeadingZero: function(number) {
    return (number < 10 ? "0" : "") + number;
  }
};
var TimeFormatter_1 = TimeFormatter;
var PhoneFormatter = function(formatter, delimiter) {
  var owner = this;
  owner.delimiter = delimiter || delimiter === "" ? delimiter : " ";
  owner.delimiterRE = delimiter ? new RegExp("\\" + delimiter, "g") : "";
  owner.formatter = formatter;
};
PhoneFormatter.prototype = {
  setFormatter: function(formatter) {
    this.formatter = formatter;
  },
  format: function(phoneNumber) {
    var owner = this;
    owner.formatter.clear();
    phoneNumber = phoneNumber.replace(/[^\d+]/g, "");
    phoneNumber = phoneNumber.replace(/^\+/, "B").replace(/\+/g, "").replace("B", "+");
    phoneNumber = phoneNumber.replace(owner.delimiterRE, "");
    var result = "", current, validated = false;
    for (var i = 0, iMax = phoneNumber.length; i < iMax; i++) {
      current = owner.formatter.inputDigit(phoneNumber.charAt(i));
      if (/[\s()-]/g.test(current)) {
        result = current;
        validated = true;
      } else {
        if (!validated) {
          result = current;
        }
      }
    }
    result = result.replace(/[()]/g, "");
    result = result.replace(/[\s-]/g, owner.delimiter);
    return result;
  }
};
var PhoneFormatter_1 = PhoneFormatter;
var CreditCardDetector = {
  blocks: {
    uatp: [4, 5, 6],
    amex: [4, 6, 5],
    diners: [4, 6, 4],
    discover: [4, 4, 4, 4],
    mastercard: [4, 4, 4, 4],
    dankort: [4, 4, 4, 4],
    instapayment: [4, 4, 4, 4],
    jcb15: [4, 6, 5],
    jcb: [4, 4, 4, 4],
    maestro: [4, 4, 4, 4],
    visa: [4, 4, 4, 4],
    mir: [4, 4, 4, 4],
    unionPay: [4, 4, 4, 4],
    general: [4, 4, 4, 4]
  },
  re: {
    // starts with 1; 15 digits, not starts with 1800 (jcb card)
    uatp: /^(?!1800)1\d{0,14}/,
    // starts with 34/37; 15 digits
    amex: /^3[47]\d{0,13}/,
    // starts with 6011/65/644-649; 16 digits
    discover: /^(?:6011|65\d{0,2}|64[4-9]\d?)\d{0,12}/,
    // starts with 300-305/309 or 36/38/39; 14 digits
    diners: /^3(?:0([0-5]|9)|[689]\d?)\d{0,11}/,
    // starts with 51-55/2221–2720; 16 digits
    mastercard: /^(5[1-5]\d{0,2}|22[2-9]\d{0,1}|2[3-7]\d{0,2})\d{0,12}/,
    // starts with 5019/4175/4571; 16 digits
    dankort: /^(5019|4175|4571)\d{0,12}/,
    // starts with 637-639; 16 digits
    instapayment: /^63[7-9]\d{0,13}/,
    // starts with 2131/1800; 15 digits
    jcb15: /^(?:2131|1800)\d{0,11}/,
    // starts with 2131/1800/35; 16 digits
    jcb: /^(?:35\d{0,2})\d{0,12}/,
    // starts with 50/56-58/6304/67; 16 digits
    maestro: /^(?:5[0678]\d{0,2}|6304|67\d{0,2})\d{0,12}/,
    // starts with 22; 16 digits
    mir: /^220[0-4]\d{0,12}/,
    // starts with 4; 16 digits
    visa: /^4\d{0,15}/,
    // starts with 62/81; 16 digits
    unionPay: /^(62|81)\d{0,14}/
  },
  getStrictBlocks: function(block) {
    var total = block.reduce(function(prev, current) {
      return prev + current;
    }, 0);
    return block.concat(19 - total);
  },
  getInfo: function(value, strictMode) {
    var blocks = CreditCardDetector.blocks, re = CreditCardDetector.re;
    strictMode = !!strictMode;
    for (var key in re) {
      if (re[key].test(value)) {
        var matchedBlocks = blocks[key];
        return {
          type: key,
          blocks: strictMode ? this.getStrictBlocks(matchedBlocks) : matchedBlocks
        };
      }
    }
    return {
      type: "unknown",
      blocks: strictMode ? this.getStrictBlocks(blocks.general) : blocks.general
    };
  }
};
var CreditCardDetector_1 = CreditCardDetector;
var Util = {
  noop: function() {
  },
  strip: function(value, re) {
    return value.replace(re, "");
  },
  getPostDelimiter: function(value, delimiter, delimiters) {
    if (delimiters.length === 0) {
      return value.slice(-delimiter.length) === delimiter ? delimiter : "";
    }
    var matchedDelimiter = "";
    delimiters.forEach(function(current) {
      if (value.slice(-current.length) === current) {
        matchedDelimiter = current;
      }
    });
    return matchedDelimiter;
  },
  getDelimiterREByDelimiter: function(delimiter) {
    return new RegExp(delimiter.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"), "g");
  },
  getNextCursorPosition: function(prevPos, oldValue, newValue, delimiter, delimiters) {
    if (oldValue.length === prevPos) {
      return newValue.length;
    }
    return prevPos + this.getPositionOffset(prevPos, oldValue, newValue, delimiter, delimiters);
  },
  getPositionOffset: function(prevPos, oldValue, newValue, delimiter, delimiters) {
    var oldRawValue, newRawValue, lengthOffset;
    oldRawValue = this.stripDelimiters(oldValue.slice(0, prevPos), delimiter, delimiters);
    newRawValue = this.stripDelimiters(newValue.slice(0, prevPos), delimiter, delimiters);
    lengthOffset = oldRawValue.length - newRawValue.length;
    return lengthOffset !== 0 ? lengthOffset / Math.abs(lengthOffset) : 0;
  },
  stripDelimiters: function(value, delimiter, delimiters) {
    var owner = this;
    if (delimiters.length === 0) {
      var delimiterRE = delimiter ? owner.getDelimiterREByDelimiter(delimiter) : "";
      return value.replace(delimiterRE, "");
    }
    delimiters.forEach(function(current) {
      current.split("").forEach(function(letter) {
        value = value.replace(owner.getDelimiterREByDelimiter(letter), "");
      });
    });
    return value;
  },
  headStr: function(str, length) {
    return str.slice(0, length);
  },
  getMaxLength: function(blocks) {
    return blocks.reduce(function(previous, current) {
      return previous + current;
    }, 0);
  },
  // strip prefix
  // Before type  |   After type    |     Return value
  // PEFIX-...    |   PEFIX-...     |     ''
  // PREFIX-123   |   PEFIX-123     |     123
  // PREFIX-123   |   PREFIX-23     |     23
  // PREFIX-123   |   PREFIX-1234   |     1234
  getPrefixStrippedValue: function(value, prefix, prefixLength, prevResult, delimiter, delimiters, noImmediatePrefix, tailPrefix, signBeforePrefix) {
    if (prefixLength === 0) {
      return value;
    }
    if (value === prefix && value !== "") {
      return "";
    }
    if (signBeforePrefix && value.slice(0, 1) == "-") {
      var prev = prevResult.slice(0, 1) == "-" ? prevResult.slice(1) : prevResult;
      return "-" + this.getPrefixStrippedValue(value.slice(1), prefix, prefixLength, prev, delimiter, delimiters, noImmediatePrefix, tailPrefix, signBeforePrefix);
    }
    if (prevResult.slice(0, prefixLength) !== prefix && !tailPrefix) {
      if (noImmediatePrefix && !prevResult && value) return value;
      return "";
    } else if (prevResult.slice(-prefixLength) !== prefix && tailPrefix) {
      if (noImmediatePrefix && !prevResult && value) return value;
      return "";
    }
    var prevValue = this.stripDelimiters(prevResult, delimiter, delimiters);
    if (value.slice(0, prefixLength) !== prefix && !tailPrefix) {
      return prevValue.slice(prefixLength);
    } else if (value.slice(-prefixLength) !== prefix && tailPrefix) {
      return prevValue.slice(0, -prefixLength - 1);
    }
    return tailPrefix ? value.slice(0, -prefixLength) : value.slice(prefixLength);
  },
  getFirstDiffIndex: function(prev, current) {
    var index = 0;
    while (prev.charAt(index) === current.charAt(index)) {
      if (prev.charAt(index++) === "") {
        return -1;
      }
    }
    return index;
  },
  getFormattedValue: function(value, blocks, blocksLength, delimiter, delimiters, delimiterLazyShow) {
    var result = "", multipleDelimiters = delimiters.length > 0, currentDelimiter = "";
    if (blocksLength === 0) {
      return value;
    }
    blocks.forEach(function(length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length), rest = value.slice(length);
        if (multipleDelimiters) {
          currentDelimiter = delimiters[delimiterLazyShow ? index - 1 : index] || currentDelimiter;
        } else {
          currentDelimiter = delimiter;
        }
        if (delimiterLazyShow) {
          if (index > 0) {
            result += currentDelimiter;
          }
          result += sub;
        } else {
          result += sub;
          if (sub.length === length && index < blocksLength - 1) {
            result += currentDelimiter;
          }
        }
        value = rest;
      }
    });
    return result;
  },
  // move cursor to the end
  // the first time user focuses on an input with prefix
  fixPrefixCursor: function(el, prefix, delimiter, delimiters) {
    if (!el) {
      return;
    }
    var val = el.value, appendix = delimiter || (delimiters[0] || " ");
    if (!el.setSelectionRange || !prefix || prefix.length + appendix.length <= val.length) {
      return;
    }
    var len = val.length * 2;
    setTimeout(function() {
      el.setSelectionRange(len, len);
    }, 1);
  },
  // Check if input field is fully selected
  checkFullSelection: function(value) {
    try {
      var selection = window.getSelection() || document.getSelection() || {};
      return selection.toString().length === value.length;
    } catch (ex) {
    }
    return false;
  },
  setSelection: function(element, position, doc) {
    if (element !== this.getActiveElement(doc)) {
      return;
    }
    if (element && element.value.length <= position) {
      return;
    }
    if (element.createTextRange) {
      var range = element.createTextRange();
      range.move("character", position);
      range.select();
    } else {
      try {
        element.setSelectionRange(position, position);
      } catch (e) {
        console.warn("The input element type does not support selection");
      }
    }
  },
  getActiveElement: function(parent) {
    var activeElement = parent.activeElement;
    if (activeElement && activeElement.shadowRoot) {
      return this.getActiveElement(activeElement.shadowRoot);
    }
    return activeElement;
  },
  isAndroid: function() {
    return navigator && /android/i.test(navigator.userAgent);
  },
  // On Android chrome, the keyup and keydown events
  // always return key code 229 as a composition that
  // buffers the user’s keystrokes
  // see https://github.com/nosir/cleave.js/issues/147
  isAndroidBackspaceKeydown: function(lastInputValue, currentInputValue) {
    if (!this.isAndroid() || !lastInputValue || !currentInputValue) {
      return false;
    }
    return currentInputValue === lastInputValue.slice(0, -1);
  }
};
var Util_1 = Util;
var DefaultProperties = {
  // Maybe change to object-assign
  // for now just keep it as simple
  assign: function(target, opts) {
    target = target || {};
    opts = opts || {};
    target.creditCard = !!opts.creditCard;
    target.creditCardStrictMode = !!opts.creditCardStrictMode;
    target.creditCardType = "";
    target.onCreditCardTypeChanged = opts.onCreditCardTypeChanged || function() {
    };
    target.phone = !!opts.phone;
    target.phoneRegionCode = opts.phoneRegionCode || "AU";
    target.phoneFormatter = {};
    target.time = !!opts.time;
    target.timePattern = opts.timePattern || ["h", "m", "s"];
    target.timeFormat = opts.timeFormat || "24";
    target.timeFormatter = {};
    target.date = !!opts.date;
    target.datePattern = opts.datePattern || ["d", "m", "Y"];
    target.dateMin = opts.dateMin || "";
    target.dateMax = opts.dateMax || "";
    target.dateFormatter = {};
    target.numeral = !!opts.numeral;
    target.numeralIntegerScale = opts.numeralIntegerScale > 0 ? opts.numeralIntegerScale : 0;
    target.numeralDecimalScale = opts.numeralDecimalScale >= 0 ? opts.numeralDecimalScale : 2;
    target.numeralDecimalMark = opts.numeralDecimalMark || ".";
    target.numeralThousandsGroupStyle = opts.numeralThousandsGroupStyle || "thousand";
    target.numeralPositiveOnly = !!opts.numeralPositiveOnly;
    target.stripLeadingZeroes = opts.stripLeadingZeroes !== false;
    target.signBeforePrefix = !!opts.signBeforePrefix;
    target.tailPrefix = !!opts.tailPrefix;
    target.swapHiddenInput = !!opts.swapHiddenInput;
    target.numericOnly = target.creditCard || target.date || !!opts.numericOnly;
    target.uppercase = !!opts.uppercase;
    target.lowercase = !!opts.lowercase;
    target.prefix = target.creditCard || target.date ? "" : opts.prefix || "";
    target.noImmediatePrefix = !!opts.noImmediatePrefix;
    target.prefixLength = target.prefix.length;
    target.rawValueTrimPrefix = !!opts.rawValueTrimPrefix;
    target.copyDelimiter = !!opts.copyDelimiter;
    target.initValue = opts.initValue !== void 0 && opts.initValue !== null ? opts.initValue.toString() : "";
    target.delimiter = opts.delimiter || opts.delimiter === "" ? opts.delimiter : opts.date ? "/" : opts.time ? ":" : opts.numeral ? "," : opts.phone ? " " : " ";
    target.delimiterLength = target.delimiter.length;
    target.delimiterLazyShow = !!opts.delimiterLazyShow;
    target.delimiters = opts.delimiters || [];
    target.blocks = opts.blocks || [];
    target.blocksLength = target.blocks.length;
    target.root = typeof commonjsGlobal === "object" && commonjsGlobal ? commonjsGlobal : window;
    target.document = opts.document || target.root.document;
    target.maxLength = 0;
    target.backspace = false;
    target.result = "";
    target.onValueChanged = opts.onValueChanged || function() {
    };
    return target;
  }
};
var DefaultProperties_1 = DefaultProperties;
var Cleave = function(element, opts) {
  var owner = this;
  var hasMultipleElements = false;
  if (typeof element === "string") {
    owner.element = document.querySelector(element);
    hasMultipleElements = document.querySelectorAll(element).length > 1;
  } else {
    if (typeof element.length !== "undefined" && element.length > 0) {
      owner.element = element[0];
      hasMultipleElements = element.length > 1;
    } else {
      owner.element = element;
    }
  }
  if (!owner.element) {
    throw new Error("[cleave.js] Please check the element");
  }
  if (hasMultipleElements) {
    try {
      console.warn("[cleave.js] Multiple input fields matched, cleave.js will only take the first one.");
    } catch (e) {
    }
  }
  opts.initValue = owner.element.value;
  owner.properties = Cleave.DefaultProperties.assign({}, opts);
  owner.init();
};
Cleave.prototype = {
  init: function() {
    var owner = this, pps = owner.properties;
    if (!pps.numeral && !pps.phone && !pps.creditCard && !pps.time && !pps.date && (pps.blocksLength === 0 && !pps.prefix)) {
      owner.onInput(pps.initValue);
      return;
    }
    pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
    owner.isAndroid = Cleave.Util.isAndroid();
    owner.lastInputValue = "";
    owner.isBackward = "";
    owner.onChangeListener = owner.onChange.bind(owner);
    owner.onKeyDownListener = owner.onKeyDown.bind(owner);
    owner.onFocusListener = owner.onFocus.bind(owner);
    owner.onCutListener = owner.onCut.bind(owner);
    owner.onCopyListener = owner.onCopy.bind(owner);
    owner.initSwapHiddenInput();
    owner.element.addEventListener("input", owner.onChangeListener);
    owner.element.addEventListener("keydown", owner.onKeyDownListener);
    owner.element.addEventListener("focus", owner.onFocusListener);
    owner.element.addEventListener("cut", owner.onCutListener);
    owner.element.addEventListener("copy", owner.onCopyListener);
    owner.initPhoneFormatter();
    owner.initDateFormatter();
    owner.initTimeFormatter();
    owner.initNumeralFormatter();
    if (pps.initValue || pps.prefix && !pps.noImmediatePrefix) {
      owner.onInput(pps.initValue);
    }
  },
  initSwapHiddenInput: function() {
    var owner = this, pps = owner.properties;
    if (!pps.swapHiddenInput) return;
    var inputFormatter = owner.element.cloneNode(true);
    owner.element.parentNode.insertBefore(inputFormatter, owner.element);
    owner.elementSwapHidden = owner.element;
    owner.elementSwapHidden.type = "hidden";
    owner.element = inputFormatter;
    owner.element.id = "";
  },
  initNumeralFormatter: function() {
    var owner = this, pps = owner.properties;
    if (!pps.numeral) {
      return;
    }
    pps.numeralFormatter = new Cleave.NumeralFormatter(
      pps.numeralDecimalMark,
      pps.numeralIntegerScale,
      pps.numeralDecimalScale,
      pps.numeralThousandsGroupStyle,
      pps.numeralPositiveOnly,
      pps.stripLeadingZeroes,
      pps.prefix,
      pps.signBeforePrefix,
      pps.tailPrefix,
      pps.delimiter
    );
  },
  initTimeFormatter: function() {
    var owner = this, pps = owner.properties;
    if (!pps.time) {
      return;
    }
    pps.timeFormatter = new Cleave.TimeFormatter(pps.timePattern, pps.timeFormat);
    pps.blocks = pps.timeFormatter.getBlocks();
    pps.blocksLength = pps.blocks.length;
    pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
  },
  initDateFormatter: function() {
    var owner = this, pps = owner.properties;
    if (!pps.date) {
      return;
    }
    pps.dateFormatter = new Cleave.DateFormatter(pps.datePattern, pps.dateMin, pps.dateMax);
    pps.blocks = pps.dateFormatter.getBlocks();
    pps.blocksLength = pps.blocks.length;
    pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
  },
  initPhoneFormatter: function() {
    var owner = this, pps = owner.properties;
    if (!pps.phone) {
      return;
    }
    try {
      pps.phoneFormatter = new Cleave.PhoneFormatter(
        new pps.root.Cleave.AsYouTypeFormatter(pps.phoneRegionCode),
        pps.delimiter
      );
    } catch (ex) {
      throw new Error("[cleave.js] Please include phone-type-formatter.{country}.js lib");
    }
  },
  onKeyDown: function(event) {
    var owner = this, charCode = event.which || event.keyCode;
    owner.lastInputValue = owner.element.value;
    owner.isBackward = charCode === 8;
  },
  onChange: function(event) {
    var owner = this, pps = owner.properties, Util2 = Cleave.Util;
    owner.isBackward = owner.isBackward || event.inputType === "deleteContentBackward";
    var postDelimiter = Util2.getPostDelimiter(owner.lastInputValue, pps.delimiter, pps.delimiters);
    if (owner.isBackward && postDelimiter) {
      pps.postDelimiterBackspace = postDelimiter;
    } else {
      pps.postDelimiterBackspace = false;
    }
    this.onInput(this.element.value);
  },
  onFocus: function() {
    var owner = this, pps = owner.properties;
    owner.lastInputValue = owner.element.value;
    if (pps.prefix && pps.noImmediatePrefix && !owner.element.value) {
      this.onInput(pps.prefix);
    }
    Cleave.Util.fixPrefixCursor(owner.element, pps.prefix, pps.delimiter, pps.delimiters);
  },
  onCut: function(e) {
    if (!Cleave.Util.checkFullSelection(this.element.value)) return;
    this.copyClipboardData(e);
    this.onInput("");
  },
  onCopy: function(e) {
    if (!Cleave.Util.checkFullSelection(this.element.value)) return;
    this.copyClipboardData(e);
  },
  copyClipboardData: function(e) {
    var owner = this, pps = owner.properties, Util2 = Cleave.Util, inputValue = owner.element.value, textToCopy = "";
    if (!pps.copyDelimiter) {
      textToCopy = Util2.stripDelimiters(inputValue, pps.delimiter, pps.delimiters);
    } else {
      textToCopy = inputValue;
    }
    try {
      if (e.clipboardData) {
        e.clipboardData.setData("Text", textToCopy);
      } else {
        window.clipboardData.setData("Text", textToCopy);
      }
      e.preventDefault();
    } catch (ex) {
    }
  },
  onInput: function(value) {
    var owner = this, pps = owner.properties, Util2 = Cleave.Util;
    var postDelimiterAfter = Util2.getPostDelimiter(value, pps.delimiter, pps.delimiters);
    if (!pps.numeral && pps.postDelimiterBackspace && !postDelimiterAfter) {
      value = Util2.headStr(value, value.length - pps.postDelimiterBackspace.length);
    }
    if (pps.phone) {
      if (pps.prefix && (!pps.noImmediatePrefix || value.length)) {
        pps.result = pps.prefix + pps.phoneFormatter.format(value).slice(pps.prefix.length);
      } else {
        pps.result = pps.phoneFormatter.format(value);
      }
      owner.updateValueState();
      return;
    }
    if (pps.numeral) {
      if (pps.prefix && pps.noImmediatePrefix && value.length === 0) {
        pps.result = "";
      } else {
        pps.result = pps.numeralFormatter.format(value);
      }
      owner.updateValueState();
      return;
    }
    if (pps.date) {
      value = pps.dateFormatter.getValidatedDate(value);
    }
    if (pps.time) {
      value = pps.timeFormatter.getValidatedTime(value);
    }
    value = Util2.stripDelimiters(value, pps.delimiter, pps.delimiters);
    value = Util2.getPrefixStrippedValue(value, pps.prefix, pps.prefixLength, pps.result, pps.delimiter, pps.delimiters, pps.noImmediatePrefix, pps.tailPrefix, pps.signBeforePrefix);
    value = pps.numericOnly ? Util2.strip(value, /[^\d]/g) : value;
    value = pps.uppercase ? value.toUpperCase() : value;
    value = pps.lowercase ? value.toLowerCase() : value;
    if (pps.prefix) {
      if (pps.tailPrefix) {
        value = value + pps.prefix;
      } else {
        value = pps.prefix + value;
      }
      if (pps.blocksLength === 0) {
        pps.result = value;
        owner.updateValueState();
        return;
      }
    }
    if (pps.creditCard) {
      owner.updateCreditCardPropsByValue(value);
    }
    value = Util2.headStr(value, pps.maxLength);
    pps.result = Util2.getFormattedValue(
      value,
      pps.blocks,
      pps.blocksLength,
      pps.delimiter,
      pps.delimiters,
      pps.delimiterLazyShow
    );
    owner.updateValueState();
  },
  updateCreditCardPropsByValue: function(value) {
    var owner = this, pps = owner.properties, Util2 = Cleave.Util, creditCardInfo;
    if (Util2.headStr(pps.result, 4) === Util2.headStr(value, 4)) {
      return;
    }
    creditCardInfo = Cleave.CreditCardDetector.getInfo(value, pps.creditCardStrictMode);
    pps.blocks = creditCardInfo.blocks;
    pps.blocksLength = pps.blocks.length;
    pps.maxLength = Util2.getMaxLength(pps.blocks);
    if (pps.creditCardType !== creditCardInfo.type) {
      pps.creditCardType = creditCardInfo.type;
      pps.onCreditCardTypeChanged.call(owner, pps.creditCardType);
    }
  },
  updateValueState: function() {
    var owner = this, Util2 = Cleave.Util, pps = owner.properties;
    if (!owner.element) {
      return;
    }
    var endPos = owner.element.selectionEnd;
    var oldValue = owner.element.value;
    var newValue = pps.result;
    endPos = Util2.getNextCursorPosition(endPos, oldValue, newValue, pps.delimiter, pps.delimiters);
    if (owner.isAndroid) {
      window.setTimeout(function() {
        owner.element.value = newValue;
        Util2.setSelection(owner.element, endPos, pps.document, false);
        owner.callOnValueChanged();
      }, 1);
      return;
    }
    owner.element.value = newValue;
    if (pps.swapHiddenInput) owner.elementSwapHidden.value = owner.getRawValue();
    Util2.setSelection(owner.element, endPos, pps.document, false);
    owner.callOnValueChanged();
  },
  callOnValueChanged: function() {
    var owner = this, pps = owner.properties;
    pps.onValueChanged.call(owner, {
      target: {
        name: owner.element.name,
        value: pps.result,
        rawValue: owner.getRawValue()
      }
    });
  },
  setPhoneRegionCode: function(phoneRegionCode) {
    var owner = this, pps = owner.properties;
    pps.phoneRegionCode = phoneRegionCode;
    owner.initPhoneFormatter();
    owner.onChange();
  },
  setRawValue: function(value) {
    var owner = this, pps = owner.properties;
    value = value !== void 0 && value !== null ? value.toString() : "";
    if (pps.numeral) {
      value = value.replace(".", pps.numeralDecimalMark);
    }
    pps.postDelimiterBackspace = false;
    owner.element.value = value;
    owner.onInput(value);
  },
  getRawValue: function() {
    var owner = this, pps = owner.properties, Util2 = Cleave.Util, rawValue = owner.element.value;
    if (pps.rawValueTrimPrefix) {
      rawValue = Util2.getPrefixStrippedValue(rawValue, pps.prefix, pps.prefixLength, pps.result, pps.delimiter, pps.delimiters, pps.noImmediatePrefix, pps.tailPrefix, pps.signBeforePrefix);
    }
    if (pps.numeral) {
      rawValue = pps.numeralFormatter.getRawValue(rawValue);
    } else {
      rawValue = Util2.stripDelimiters(rawValue, pps.delimiter, pps.delimiters);
    }
    return rawValue;
  },
  getISOFormatDate: function() {
    var owner = this, pps = owner.properties;
    return pps.date ? pps.dateFormatter.getISOFormatDate() : "";
  },
  getISOFormatTime: function() {
    var owner = this, pps = owner.properties;
    return pps.time ? pps.timeFormatter.getISOFormatTime() : "";
  },
  getFormattedValue: function() {
    return this.element.value;
  },
  destroy: function() {
    var owner = this;
    owner.element.removeEventListener("input", owner.onChangeListener);
    owner.element.removeEventListener("keydown", owner.onKeyDownListener);
    owner.element.removeEventListener("focus", owner.onFocusListener);
    owner.element.removeEventListener("cut", owner.onCutListener);
    owner.element.removeEventListener("copy", owner.onCopyListener);
  },
  toString: function() {
    return "[Cleave Object]";
  }
};
Cleave.NumeralFormatter = NumeralFormatter_1;
Cleave.DateFormatter = DateFormatter_1;
Cleave.TimeFormatter = TimeFormatter_1;
Cleave.PhoneFormatter = PhoneFormatter_1;
Cleave.CreditCardDetector = CreditCardDetector_1;
Cleave.Util = Util_1;
Cleave.DefaultProperties = DefaultProperties_1;
(typeof commonjsGlobal === "object" && commonjsGlobal ? commonjsGlobal : window)["Cleave"] = Cleave;
var Cleave_1 = Cleave;
var cleave_esm_default = Cleave_1;

// ../../node_modules/cleave.js/dist/addons/cleave-phone.de.js
!function() {
  function n(n2, t2) {
    var e2 = n2.split("."), l2 = U;
    e2[0] in l2 || !l2.execScript || l2.execScript("var " + e2[0]);
    for (var r2; e2.length && (r2 = e2.shift()); ) e2.length || void 0 === t2 ? l2 = l2[r2] ? l2[r2] : l2[r2] = {} : l2[r2] = t2;
  }
  function t(n2, t2) {
    function e2() {
    }
    e2.prototype = t2.prototype, n2.M = t2.prototype, n2.prototype = new e2(), n2.prototype.constructor = n2, n2.N = function(n3, e3, l2) {
      for (var r2 = Array(arguments.length - 2), i2 = 2; i2 < arguments.length; i2++) r2[i2 - 2] = arguments[i2];
      return t2.prototype[e3].apply(n3, r2);
    };
  }
  function e(n2, t2) {
    null != n2 && this.a.apply(this, arguments);
  }
  function l(n2) {
    n2.b = "";
  }
  function r(n2, t2) {
    n2.sort(t2 || i);
  }
  function i(n2, t2) {
    return n2 > t2 ? 1 : n2 < t2 ? -1 : 0;
  }
  function u(n2) {
    var t2, e2 = [], l2 = 0;
    for (t2 in n2) e2[l2++] = n2[t2];
    return e2;
  }
  function a(n2, t2) {
    this.b = n2, this.a = {};
    for (var e2 = 0; e2 < t2.length; e2++) {
      var l2 = t2[e2];
      this.a[l2.b] = l2;
    }
  }
  function o(n2) {
    return n2 = u(n2.a), r(n2, function(n3, t2) {
      return n3.b - t2.b;
    }), n2;
  }
  function s(n2, t2) {
    switch (this.b = n2, this.g = !!t2.v, this.a = t2.c, this.i = t2.type, this.h = false, this.a) {
      case J:
      case K:
      case L:
      case O:
      case Z:
      case k:
      case Y:
        this.h = true;
    }
    this.f = t2.defaultValue;
  }
  function f() {
    this.a = {}, this.f = this.j().a, this.b = this.g = null;
  }
  function p(n2, t2) {
    for (var e2 = o(n2.j()), l2 = 0; l2 < e2.length; l2++) {
      var r2 = e2[l2], i2 = r2.b;
      if (null != t2.a[i2]) {
        n2.b && delete n2.b[r2.b];
        var u2 = 11 == r2.a || 10 == r2.a;
        if (r2.g) for (var r2 = c(t2, i2) || [], a2 = 0; a2 < r2.length; a2++) {
          var s2 = n2, f2 = i2, h2 = u2 ? r2[a2].clone() : r2[a2];
          s2.a[f2] || (s2.a[f2] = []), s2.a[f2].push(h2), s2.b && delete s2.b[f2];
        }
        else r2 = c(t2, i2), u2 ? (u2 = c(n2, i2)) ? p(u2, r2) : m(n2, i2, r2.clone()) : m(n2, i2, r2);
      }
    }
  }
  function c(n2, t2) {
    var e2 = n2.a[t2];
    if (null == e2) return null;
    if (n2.g) {
      if (!(t2 in n2.b)) {
        var l2 = n2.g, r2 = n2.f[t2];
        if (null != e2) if (r2.g) {
          for (var i2 = [], u2 = 0; u2 < e2.length; u2++) i2[u2] = l2.b(r2, e2[u2]);
          e2 = i2;
        } else e2 = l2.b(r2, e2);
        return n2.b[t2] = e2;
      }
      return n2.b[t2];
    }
    return e2;
  }
  function h(n2, t2, e2) {
    var l2 = c(n2, t2);
    return n2.f[t2].g ? l2[e2 || 0] : l2;
  }
  function g(n2, t2) {
    var e2;
    if (null != n2.a[t2]) e2 = h(n2, t2, void 0);
    else n: {
      if (e2 = n2.f[t2], void 0 === e2.f) {
        var l2 = e2.i;
        if (l2 === Boolean) e2.f = false;
        else if (l2 === Number) e2.f = 0;
        else {
          if (l2 !== String) {
            e2 = new l2();
            break n;
          }
          e2.f = e2.h ? "0" : "";
        }
      }
      e2 = e2.f;
    }
    return e2;
  }
  function d(n2, t2) {
    return n2.f[t2].g ? null != n2.a[t2] ? n2.a[t2].length : 0 : null != n2.a[t2] ? 1 : 0;
  }
  function m(n2, t2, e2) {
    n2.a[t2] = e2, n2.b && (n2.b[t2] = e2);
  }
  function b(n2, t2) {
    var e2, l2 = [];
    for (e2 in t2) 0 != e2 && l2.push(new s(e2, t2[e2]));
    return new a(n2, l2);
  }
  function y() {
    f.call(this);
  }
  function v() {
    f.call(this);
  }
  function $() {
    f.call(this);
  }
  function _() {
  }
  function S() {
  }
  function w() {
  }
  function x() {
    this.a = {};
  }
  function A(n2) {
    return 0 == n2.length || un.test(n2);
  }
  function N(n2, t2) {
    if (null == t2) return null;
    t2 = t2.toUpperCase();
    var e2 = n2.a[t2];
    if (null == e2) {
      if (e2 = tn[t2], null == e2) return null;
      e2 = new w().a($.j(), e2), n2.a[t2] = e2;
    }
    return e2;
  }
  function E(n2) {
    return n2 = nn[n2], null == n2 ? "ZZ" : n2[0];
  }
  function j(n2) {
    this.H = RegExp("\u2008"), this.C = "", this.m = new e(), this.w = "", this.i = new e(), this.u = new e(), this.l = true, this.A = this.o = this.F = false, this.G = x.b(), this.s = 0, this.b = new e(), this.B = false, this.h = "", this.a = new e(), this.f = [], this.D = n2, this.J = this.g = B(this, this.D);
  }
  function B(n2, t2) {
    var e2;
    if (null != t2 && isNaN(t2) && t2.toUpperCase() in tn) {
      if (e2 = N(n2.G, t2), null == e2) throw Error("Invalid region code: " + t2);
      e2 = g(e2, 10);
    } else e2 = 0;
    return e2 = N(n2.G, E(e2)), null != e2 ? e2 : an;
  }
  function D(n2) {
    for (var t2 = n2.f.length, e2 = 0; e2 < t2; ++e2) {
      var r2 = n2.f[e2], i2 = g(r2, 1);
      if (n2.w == i2) return false;
      var u2;
      u2 = n2;
      var a2 = r2, o2 = g(a2, 1);
      if (-1 != o2.indexOf("|")) u2 = false;
      else {
        o2 = o2.replace(on, "\\d"), o2 = o2.replace(sn, "\\d"), l(u2.m);
        var s2;
        s2 = u2;
        var a2 = g(a2, 2), f2 = "999999999999999".match(o2)[0];
        f2.length < s2.a.b.length ? s2 = "" : (s2 = f2.replace(new RegExp(o2, "g"), a2), s2 = s2.replace(RegExp("9", "g"), "\u2008")), 0 < s2.length ? (u2.m.a(s2), u2 = true) : u2 = false;
      }
      if (u2) return n2.w = i2, n2.B = pn.test(h(r2, 4)), n2.s = 0, true;
    }
    return n2.l = false;
  }
  function R(n2, t2) {
    for (var e2 = [], l2 = t2.length - 3, r2 = n2.f.length, i2 = 0; i2 < r2; ++i2) {
      var u2 = n2.f[i2];
      0 == d(u2, 3) ? e2.push(n2.f[i2]) : (u2 = h(u2, 3, Math.min(l2, d(u2, 3) - 1)), 0 == t2.search(u2) && e2.push(n2.f[i2]));
    }
    n2.f = e2;
  }
  function F(n2, t2) {
    n2.i.a(t2);
    var e2 = t2;
    if (rn.test(e2) || 1 == n2.i.b.length && ln.test(e2)) {
      var r2, e2 = t2;
      "+" == e2 ? (r2 = e2, n2.u.a(e2)) : (r2 = en[e2], n2.u.a(r2), n2.a.a(r2)), t2 = r2;
    } else n2.l = false, n2.F = true;
    if (!n2.l) {
      if (!n2.F) {
        if (P(n2)) {
          if (q(n2)) return C(n2);
        } else if (0 < n2.h.length && (e2 = n2.a.toString(), l(n2.a), n2.a.a(n2.h), n2.a.a(e2), e2 = n2.b.toString(), r2 = e2.lastIndexOf(n2.h), l(n2.b), n2.b.a(e2.substring(0, r2))), n2.h != H(n2)) return n2.b.a(" "), C(n2);
      }
      return n2.i.toString();
    }
    switch (n2.u.b.length) {
      case 0:
      case 1:
      case 2:
        return n2.i.toString();
      case 3:
        if (!P(n2)) return n2.h = H(n2), V(n2);
        n2.A = true;
      default:
        return n2.A ? (q(n2) && (n2.A = false), n2.b.toString() + n2.a.toString()) : 0 < n2.f.length ? (e2 = T(n2, t2), r2 = I(n2), 0 < r2.length ? r2 : (R(n2, n2.a.toString()), D(n2) ? G(n2) : n2.l ? M(n2, e2) : n2.i.toString())) : V(n2);
    }
  }
  function C(n2) {
    return n2.l = true, n2.A = false, n2.f = [], n2.s = 0, l(n2.m), n2.w = "", V(n2);
  }
  function I(n2) {
    for (var t2 = n2.a.toString(), e2 = n2.f.length, l2 = 0; l2 < e2; ++l2) {
      var r2 = n2.f[l2], i2 = g(r2, 1);
      if (new RegExp("^(?:" + i2 + ")$").test(t2)) return n2.B = pn.test(h(r2, 4)), t2 = t2.replace(new RegExp(i2, "g"), h(r2, 2)), M(n2, t2);
    }
    return "";
  }
  function M(n2, t2) {
    var e2 = n2.b.b.length;
    return n2.B && 0 < e2 && " " != n2.b.toString().charAt(e2 - 1) ? n2.b + " " + t2 : n2.b + t2;
  }
  function V(n2) {
    var t2 = n2.a.toString();
    if (3 <= t2.length) {
      for (var e2 = n2.o && 0 == n2.h.length && 0 < d(n2.g, 20) ? c(n2.g, 20) || [] : c(n2.g, 19) || [], l2 = e2.length, r2 = 0; r2 < l2; ++r2) {
        var i2 = e2[r2];
        0 < n2.h.length && A(g(i2, 4)) && !h(i2, 6) && null == i2.a[5] || (0 != n2.h.length || n2.o || A(g(i2, 4)) || h(i2, 6)) && fn.test(g(i2, 2)) && n2.f.push(i2);
      }
      return R(n2, t2), t2 = I(n2), 0 < t2.length ? t2 : D(n2) ? G(n2) : n2.i.toString();
    }
    return M(n2, t2);
  }
  function G(n2) {
    var t2 = n2.a.toString(), e2 = t2.length;
    if (0 < e2) {
      for (var l2 = "", r2 = 0; r2 < e2; r2++) l2 = T(n2, t2.charAt(r2));
      return n2.l ? M(n2, l2) : n2.i.toString();
    }
    return n2.b.toString();
  }
  function H(n2) {
    var t2, e2 = n2.a.toString(), r2 = 0;
    return 1 != h(n2.g, 10) ? t2 = false : (t2 = n2.a.toString(), t2 = "1" == t2.charAt(0) && "0" != t2.charAt(1) && "1" != t2.charAt(1)), t2 ? (r2 = 1, n2.b.a("1").a(" "), n2.o = true) : null != n2.g.a[15] && (t2 = new RegExp("^(?:" + h(n2.g, 15) + ")"), t2 = e2.match(t2), null != t2 && null != t2[0] && 0 < t2[0].length && (n2.o = true, r2 = t2[0].length, n2.b.a(e2.substring(0, r2)))), l(n2.a), n2.a.a(e2.substring(r2)), e2.substring(0, r2);
  }
  function P(n2) {
    var t2 = n2.u.toString(), e2 = new RegExp("^(?:\\+|" + h(n2.g, 11) + ")"), e2 = t2.match(e2);
    return null != e2 && null != e2[0] && 0 < e2[0].length && (n2.o = true, e2 = e2[0].length, l(n2.a), n2.a.a(t2.substring(e2)), l(n2.b), n2.b.a(t2.substring(0, e2)), "+" != t2.charAt(0) && n2.b.a(" "), true);
  }
  function q(n2) {
    if (0 == n2.a.b.length) return false;
    var t2, r2 = new e();
    n: {
      if (t2 = n2.a.toString(), 0 != t2.length && "0" != t2.charAt(0)) {
        for (var i2, u2 = t2.length, a2 = 1; 3 >= a2 && a2 <= u2; ++a2) if (i2 = parseInt(t2.substring(0, a2), 10), i2 in nn) {
          r2.a(t2.substring(a2)), t2 = i2;
          break n;
        }
      }
      t2 = 0;
    }
    return 0 != t2 && (l(n2.a), n2.a.a(r2.toString()), r2 = E(t2), "001" == r2 ? n2.g = N(n2.G, "" + t2) : r2 != n2.D && (n2.g = B(n2, r2)), n2.b.a("" + t2).a(" "), n2.h = "", true);
  }
  function T(n2, t2) {
    var e2 = n2.m.toString();
    if (0 <= e2.substring(n2.s).search(n2.H)) {
      var r2 = e2.search(n2.H), e2 = e2.replace(n2.H, t2);
      return l(n2.m), n2.m.a(e2), n2.s = r2, e2.substring(0, n2.s + 1);
    }
    return 1 == n2.f.length && (n2.l = false), n2.w = "", n2.i.toString();
  }
  var U = this;
  e.prototype.b = "", e.prototype.set = function(n2) {
    this.b = "" + n2;
  }, e.prototype.a = function(n2, t2, e2) {
    if (this.b += String(n2), null != t2) for (var l2 = 1; l2 < arguments.length; l2++) this.b += arguments[l2];
    return this;
  }, e.prototype.toString = function() {
    return this.b;
  };
  var Y = 1, k = 2, J = 3, K = 4, L = 6, O = 16, Z = 18;
  f.prototype.set = function(n2, t2) {
    m(this, n2.b, t2);
  }, f.prototype.clone = function() {
    var n2 = new this.constructor();
    return n2 != this && (n2.a = {}, n2.b && (n2.b = {}), p(n2, this)), n2;
  }, t(y, f);
  var z = null;
  t(v, f);
  var Q = null;
  t($, f);
  var W = null;
  y.prototype.j = function() {
    var n2 = z;
    return n2 || (z = n2 = b(y, { 0: { name: "NumberFormat", I: "i18n.phonenumbers.NumberFormat" }, 1: { name: "pattern", required: true, c: 9, type: String }, 2: { name: "format", required: true, c: 9, type: String }, 3: { name: "leading_digits_pattern", v: true, c: 9, type: String }, 4: { name: "national_prefix_formatting_rule", c: 9, type: String }, 6: { name: "national_prefix_optional_when_formatting", c: 8, defaultValue: false, type: Boolean }, 5: { name: "domestic_carrier_code_formatting_rule", c: 9, type: String } })), n2;
  }, y.j = y.prototype.j, v.prototype.j = function() {
    var n2 = Q;
    return n2 || (Q = n2 = b(v, { 0: { name: "PhoneNumberDesc", I: "i18n.phonenumbers.PhoneNumberDesc" }, 2: { name: "national_number_pattern", c: 9, type: String }, 9: { name: "possible_length", v: true, c: 5, type: Number }, 10: { name: "possible_length_local_only", v: true, c: 5, type: Number }, 6: { name: "example_number", c: 9, type: String } })), n2;
  }, v.j = v.prototype.j, $.prototype.j = function() {
    var n2 = W;
    return n2 || (W = n2 = b($, { 0: { name: "PhoneMetadata", I: "i18n.phonenumbers.PhoneMetadata" }, 1: { name: "general_desc", c: 11, type: v }, 2: { name: "fixed_line", c: 11, type: v }, 3: { name: "mobile", c: 11, type: v }, 4: { name: "toll_free", c: 11, type: v }, 5: { name: "premium_rate", c: 11, type: v }, 6: { name: "shared_cost", c: 11, type: v }, 7: { name: "personal_number", c: 11, type: v }, 8: { name: "voip", c: 11, type: v }, 21: { name: "pager", c: 11, type: v }, 25: { name: "uan", c: 11, type: v }, 27: { name: "emergency", c: 11, type: v }, 28: { name: "voicemail", c: 11, type: v }, 29: { name: "short_code", c: 11, type: v }, 30: { name: "standard_rate", c: 11, type: v }, 31: { name: "carrier_specific", c: 11, type: v }, 33: { name: "sms_services", c: 11, type: v }, 24: { name: "no_international_dialling", c: 11, type: v }, 9: { name: "id", required: true, c: 9, type: String }, 10: { name: "country_code", c: 5, type: Number }, 11: { name: "international_prefix", c: 9, type: String }, 17: { name: "preferred_international_prefix", c: 9, type: String }, 12: { name: "national_prefix", c: 9, type: String }, 13: { name: "preferred_extn_prefix", c: 9, type: String }, 15: { name: "national_prefix_for_parsing", c: 9, type: String }, 16: { name: "national_prefix_transform_rule", c: 9, type: String }, 18: { name: "same_mobile_and_fixed_line_pattern", c: 8, defaultValue: false, type: Boolean }, 19: { name: "number_format", v: true, c: 11, type: y }, 20: { name: "intl_number_format", v: true, c: 11, type: y }, 22: { name: "main_country_for_code", c: 8, defaultValue: false, type: Boolean }, 23: { name: "leading_digits", c: 9, type: String }, 26: { name: "leading_zero_possible", c: 8, defaultValue: false, type: Boolean } })), n2;
  }, $.j = $.prototype.j, _.prototype.a = function(n2) {
    throw new n2.b(), Error("Unimplemented");
  }, _.prototype.b = function(n2, t2) {
    if (11 == n2.a || 10 == n2.a) return t2 instanceof f ? t2 : this.a(n2.i.prototype.j(), t2);
    if (14 == n2.a) {
      if ("string" == typeof t2 && X.test(t2)) {
        var e2 = Number(t2);
        if (0 < e2) return e2;
      }
      return t2;
    }
    if (!n2.h) return t2;
    if (e2 = n2.i, e2 === String) {
      if ("number" == typeof t2) return String(t2);
    } else if (e2 === Number && "string" == typeof t2 && ("Infinity" === t2 || "-Infinity" === t2 || "NaN" === t2 || X.test(t2))) return Number(t2);
    return t2;
  };
  var X = /^-?[0-9]+$/;
  t(S, _), S.prototype.a = function(n2, t2) {
    var e2 = new n2.b();
    return e2.g = this, e2.a = t2, e2.b = {}, e2;
  }, t(w, S), w.prototype.b = function(n2, t2) {
    return 8 == n2.a ? !!t2 : _.prototype.b.apply(this, arguments);
  }, w.prototype.a = function(n2, t2) {
    return w.M.a.call(this, n2, t2);
  };
  var nn = { 49: ["DE"] }, tn = { DE: [null, [null, null, "(?:1|[235-9]\\d{11}|4(?:[0-8]\\d{2,10}|9(?:[05]\\d{7}|[46][1-8]\\d{2,6})))\\d{3}|[1-35-9]\\d{6,13}|49(?:(?:[0-25]\\d|3[1-689])\\d{4,8}|4[1-8]\\d{4}|6[0-8]\\d{3,4}|7[1-7]\\d{5,8})|497[0-7]\\d{4}|49(?:[0-2579]\\d|[34][1-9])\\d{3}|[1-9]\\d{5}|[13468]\\d{4}", null, null, null, null, null, null, [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [3]], [null, null, "(?:2(?:0[1-689]|[1-3569]\\d|4[0-8]|7[1-7]|8[0-7])|5(?:0[2-8]|[124-6]\\d|[38][0-8]|[79][0-7])|6(?:0[02-9]|[1-3589]\\d|[47][0-8]|6[1-9])|7(?:0[2-8]|1[1-9]|[27][0-7]|3\\d|[4-6][0-8]|8[0-5]|9[013-7])|8(?:0[2-9]|1[0-79]|[29]\\d|3[0-46-9]|4[0-6]|5[013-9]|6[1-8]|7[0-8]|8[0-24-6])|9(?:0[6-9]|[1-4]\\d|[589][0-7]|6[0-8]|7[0-467]))\\d{4,12}|3(?:(?:[03569]\\d|4[0-79]|7[1-7]|8[1-8])\\d{4,12}|2\\d{9})|4(?:(?:[02-48]\\d|1[02-9]|5[0-6]|6[0-8]|7[0-79])\\d{4,12}|9(?:[0-37]\\d{4,9}|[4-6]\\d{4,10}))|(?:2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:0\\d?|[35-9][15]|4[015])|4(?:0\\d?|[2-9]1)|[57][1-9]1|[68](?:[1-8]1|9\\d?)|9(?:06|[1-9]1))\\d{3}", null, null, null, "30123456", null, null, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [3, 4]], [null, null, "1(?:5[0-25-9]\\d{8}|(?:6[023]|7\\d)\\d{7,8})", null, null, null, "15123456789", null, null, [10, 11]], [null, null, "800\\d{7,12}", null, null, null, "8001234567890", null, null, [10, 11, 12, 13, 14, 15]], [null, null, "(?:137[7-9]|900(?:[135]|9\\d))\\d{6}", null, null, null, "9001234567", null, null, [10, 11]], [null, null, "1(?:3(?:7[1-6]\\d\\d|8)|80\\d{1,7})\\d{4}", null, null, null, "18012345", null, null, [7, 8, 9, 10, 11, 12, 13, 14]], [null, null, "700\\d{8}", null, null, null, "70012345678", null, null, [11]], [null, null, null, null, null, null, null, null, null, [-1]], "DE", 49, "00", "0", null, null, "0", null, null, null, [[null, "(\\d{2})(\\d{3,13})", "$1 $2", ["3[02]|40|[68]9"], "0$1"], [null, "(\\d{3})(\\d{3,12})", "$1 $2", ["2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)", "2(?:0[1-389]|1(?:[14]|2[0-8])|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)"], "0$1"], [null, "(\\d{3})(\\d{4})", "$1 $2", ["138"], "0$1"], [null, "(\\d{4})(\\d{3,11})", "$1 $2", ["[24-6]|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])", "[24-6]|3(?:3(?:0[1-467]|2[127-9]|3[124578]|[46][1246]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|3[1357]|4[13578]|6[1246]|7[1356]|9[1346])|5(?:0[14]|2[1-3589]|3[1357]|[49][1246]|6[1-4]|7[13468]|8[13568])|6(?:0[1356]|2[1-489]|3[124-6]|4[1347]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|3[1357]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|4[1347]|6|7[1467]|8[136])|9(?:0[12479]|2[1358]|3[1357]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])"], "0$1"], [null, "(\\d{3})(\\d{5,11})", "$1 $2", ["181"], "0$1"], [null, "(\\d{3})(\\d)(\\d{4,10})", "$1 $2 $3", ["1(?:3|80)|9"], "0$1"], [null, "(\\d{5})(\\d{3,10})", "$1 $2", ["3"], "0$1"], [null, "(\\d{3})(\\d{7,8})", "$1 $2", ["1(?:6[02-489]|7)"], "0$1"], [null, "(\\d{3})(\\d{7,12})", "$1 $2", ["8"], "0$1"], [null, "(\\d{4})(\\d{7})", "$1 $2", ["15[1279]"], "0$1"], [null, "(\\d{5})(\\d{6})", "$1 $2", ["15[0568]"], "0$1"], [null, "(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["7"], "0$1"], [null, "(\\d{3})(\\d{8})", "$1 $2", ["18[2-579]", "18[2-579]", "18(?:[2-479]|5(?:0[1-9]|[1-9]))"], "0$1"], [null, "(\\d{4})(\\d{7})", "$1 $2", ["18[68]"], "0$1"], [null, "(\\d{5})(\\d{6})", "$1 $2", ["18"], "0$1"], [null, "(\\d{3})(\\d{2})(\\d{7,8})", "$1 $2 $3", ["1(?:6[023]|7)"], "0$1"], [null, "(\\d{3})(\\d{2})(\\d{8})", "$1 $2 $3", ["15[013-68]"], "0$1"], [null, "(\\d{4})(\\d{2})(\\d{7})", "$1 $2 $3", ["15"], "0$1"]], null, [null, null, "16(?:4\\d{1,10}|[89]\\d{1,11})", null, null, null, "16412345", null, null, [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]], null, null, [null, null, null, null, null, null, null, null, null, [-1]], [null, null, "18(?:1\\d{5,11}|[2-9]\\d{8})", null, null, null, "18500123456", null, null, [8, 9, 10, 11, 12, 13, 14]], null, null, [null, null, "1(?:5(?:(?:[03-68]00|113)\\d|2\\d55|7\\d99|9\\d33)|(?:6(?:013|255|399)|7(?:(?:[015]1|[69]3)3|[2-4]55|[78]99))\\d?)\\d{7}", null, null, null, "177991234567", null, null, [12, 13]]] };
  x.b = function() {
    return x.a ? x.a : x.a = new x();
  };
  var en = { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", "\uFF10": "0", "\uFF11": "1", "\uFF12": "2", "\uFF13": "3", "\uFF14": "4", "\uFF15": "5", "\uFF16": "6", "\uFF17": "7", "\uFF18": "8", "\uFF19": "9", "\u0660": "0", "\u0661": "1", "\u0662": "2", "\u0663": "3", "\u0664": "4", "\u0665": "5", "\u0666": "6", "\u0667": "7", "\u0668": "8", "\u0669": "9", "\u06F0": "0", "\u06F1": "1", "\u06F2": "2", "\u06F3": "3", "\u06F4": "4", "\u06F5": "5", "\u06F6": "6", "\u06F7": "7", "\u06F8": "8", "\u06F9": "9" }, ln = RegExp("[+\uFF0B]+"), rn = RegExp("([0-9\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9])"), un = /^\(?\$1\)?$/, an = new $();
  m(an, 11, "NA");
  var on = /\[([^\[\]])*\]/g, sn = /\d(?=[^,}][^,}])/g, fn = RegExp("^[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*(\\$\\d[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*)+$"), pn = /[- ]/;
  j.prototype.K = function() {
    this.C = "", l(this.i), l(this.u), l(this.m), this.s = 0, this.w = "", l(this.b), this.h = "", l(this.a), this.l = true, this.A = this.o = this.F = false, this.f = [], this.B = false, this.g != this.J && (this.g = B(this, this.D));
  }, j.prototype.L = function(n2) {
    return this.C = F(this, n2);
  }, n("Cleave.AsYouTypeFormatter", j), n("Cleave.AsYouTypeFormatter.prototype.inputDigit", j.prototype.L), n("Cleave.AsYouTypeFormatter.prototype.clear", j.prototype.K);
}.call("object" == typeof global && global ? global : window);

// src/js/Functionalities/html.input.cleave.ts
var _HTML_Input_Cleave = class _HTML_Input_Cleave {
  static functionality(toLoad, toProcess) {
    if (Array.isArray(toLoad.config)) {
      toLoad.config = toLoad.config[0];
    }
    if (Array.isArray(toLoad.date)) {
      toLoad.date = toLoad.date[0];
    }
    if (Array.isArray(toLoad.datemin)) {
      toLoad.datemin = toLoad.datemin[0];
    }
    if (Array.isArray(toLoad.datemax)) {
      toLoad.datemax = toLoad.datemax[0];
    }
    if (Array.isArray(toLoad.delimiter)) {
      toLoad.delimiter = toLoad.delimiter[0];
    }
    if (Array.isArray(toLoad.datepattern)) {
      toLoad.datepattern = toLoad.datepattern[0];
    }
    if (toProcess.tagName.toUpperCase() !== "INPUT") {
      return;
    }
    const config = toLoad.config ? typeof toLoad.config === "string" ? JSON.parse(toLoad.config.replace(/</, "{").replace(/>/, "}")) : toLoad.config : {
      date: toLoad.date ? toLoad.date : true,
      dateMin: toLoad.datemin && typeof toLoad.datemin === "string" ? toLoad.datemin : void 0,
      dateMax: toLoad.datemax && typeof toLoad.datemax === "string" ? toLoad.datemax : void 0,
      delimiter: toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".",
      datePattern: toLoad.datepattern ? TYPE.tsCheck(toLoad.datepattern, "string").split("-") : ["d", "m", "Y"]
    };
    new cleave_esm_default(toProcess, config);
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link HTML_Input_Cleave } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("HTML.Input.Cleave", _HTML_Input_Cleave.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(1, EQ.PRE("INPUT", false, "tagName"))
], _HTML_Input_Cleave, "functionality", 1);
var HTML_Input_Cleave = _HTML_Input_Cleave;
export {
  HTML_Input_Cleave
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9jbGVhdmUuanMvZGlzdC9jbGVhdmUtZXNtLmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvY2xlYXZlLmpzL2Rpc3QvYWRkb25zL2NsZWF2ZS1waG9uZS5kZS5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvZm9ybS9zcmMvanMvRnVuY3Rpb25hbGl0aWVzL2h0bWwuaW5wdXQuY2xlYXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ2YXIgY29tbW9uanNHbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9O1xuXG52YXIgTnVtZXJhbEZvcm1hdHRlciA9IGZ1bmN0aW9uIChudW1lcmFsRGVjaW1hbE1hcmssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmFsSW50ZWdlclNjYWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJhbERlY2ltYWxTY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJhbFBvc2l0aXZlT25seSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmlwTGVhZGluZ1plcm9lcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25CZWZvcmVQcmVmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWlsUHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyKSB7XG4gICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgIG93bmVyLm51bWVyYWxEZWNpbWFsTWFyayA9IG51bWVyYWxEZWNpbWFsTWFyayB8fCAnLic7XG4gICAgb3duZXIubnVtZXJhbEludGVnZXJTY2FsZSA9IG51bWVyYWxJbnRlZ2VyU2NhbGUgPiAwID8gbnVtZXJhbEludGVnZXJTY2FsZSA6IDA7XG4gICAgb3duZXIubnVtZXJhbERlY2ltYWxTY2FsZSA9IG51bWVyYWxEZWNpbWFsU2NhbGUgPj0gMCA/IG51bWVyYWxEZWNpbWFsU2NhbGUgOiAyO1xuICAgIG93bmVyLm51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlID0gbnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUgfHwgTnVtZXJhbEZvcm1hdHRlci5ncm91cFN0eWxlLnRob3VzYW5kO1xuICAgIG93bmVyLm51bWVyYWxQb3NpdGl2ZU9ubHkgPSAhIW51bWVyYWxQb3NpdGl2ZU9ubHk7XG4gICAgb3duZXIuc3RyaXBMZWFkaW5nWmVyb2VzID0gc3RyaXBMZWFkaW5nWmVyb2VzICE9PSBmYWxzZTtcbiAgICBvd25lci5wcmVmaXggPSAocHJlZml4IHx8IHByZWZpeCA9PT0gJycpID8gcHJlZml4IDogJyc7XG4gICAgb3duZXIuc2lnbkJlZm9yZVByZWZpeCA9ICEhc2lnbkJlZm9yZVByZWZpeDtcbiAgICBvd25lci50YWlsUHJlZml4ID0gISF0YWlsUHJlZml4O1xuICAgIG93bmVyLmRlbGltaXRlciA9IChkZWxpbWl0ZXIgfHwgZGVsaW1pdGVyID09PSAnJykgPyBkZWxpbWl0ZXIgOiAnLCc7XG4gICAgb3duZXIuZGVsaW1pdGVyUkUgPSBkZWxpbWl0ZXIgPyBuZXcgUmVnRXhwKCdcXFxcJyArIGRlbGltaXRlciwgJ2cnKSA6ICcnO1xufTtcblxuTnVtZXJhbEZvcm1hdHRlci5ncm91cFN0eWxlID0ge1xuICAgIHRob3VzYW5kOiAndGhvdXNhbmQnLFxuICAgIGxha2g6ICAgICAnbGFraCcsXG4gICAgd2FuOiAgICAgICd3YW4nLFxuICAgIG5vbmU6ICAgICAnbm9uZScgICAgXG59O1xuXG5OdW1lcmFsRm9ybWF0dGVyLnByb3RvdHlwZSA9IHtcbiAgICBnZXRSYXdWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHRoaXMuZGVsaW1pdGVyUkUsICcnKS5yZXBsYWNlKHRoaXMubnVtZXJhbERlY2ltYWxNYXJrLCAnLicpO1xuICAgIH0sXG5cbiAgICBmb3JtYXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwYXJ0cywgcGFydFNpZ24sIHBhcnRTaWduQW5kUHJlZml4LCBwYXJ0SW50ZWdlciwgcGFydERlY2ltYWwgPSAnJztcblxuICAgICAgICAvLyBzdHJpcCBhbHBoYWJldCBsZXR0ZXJzXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvW0EtWmEtel0vZywgJycpXG4gICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBmaXJzdCBkZWNpbWFsIG1hcmsgd2l0aCByZXNlcnZlZCBwbGFjZWhvbGRlclxuICAgICAgICAgICAgLnJlcGxhY2Uob3duZXIubnVtZXJhbERlY2ltYWxNYXJrLCAnTScpXG5cbiAgICAgICAgICAgIC8vIHN0cmlwIG5vbiBudW1lcmljIGxldHRlcnMgZXhjZXB0IG1pbnVzIGFuZCBcIk1cIlxuICAgICAgICAgICAgLy8gdGhpcyBpcyB0byBlbnN1cmUgcHJlZml4IGhhcyBiZWVuIHN0cmlwcGVkXG4gICAgICAgICAgICAucmVwbGFjZSgvW15cXGRNLV0vZywgJycpXG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdGhlIGxlYWRpbmcgbWludXMgd2l0aCByZXNlcnZlZCBwbGFjZWhvbGRlclxuICAgICAgICAgICAgLnJlcGxhY2UoL15cXC0vLCAnTicpXG5cbiAgICAgICAgICAgIC8vIHN0cmlwIHRoZSBvdGhlciBtaW51cyBzaWduIChpZiBwcmVzZW50KVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcLS9nLCAnJylcblxuICAgICAgICAgICAgLy8gcmVwbGFjZSB0aGUgbWludXMgc2lnbiAoaWYgcHJlc2VudClcbiAgICAgICAgICAgIC5yZXBsYWNlKCdOJywgb3duZXIubnVtZXJhbFBvc2l0aXZlT25seSA/ICcnIDogJy0nKVxuXG4gICAgICAgICAgICAvLyByZXBsYWNlIGRlY2ltYWwgbWFya1xuICAgICAgICAgICAgLnJlcGxhY2UoJ00nLCBvd25lci5udW1lcmFsRGVjaW1hbE1hcmspO1xuXG4gICAgICAgIC8vIHN0cmlwIGFueSBsZWFkaW5nIHplcm9zXG4gICAgICAgIGlmIChvd25lci5zdHJpcExlYWRpbmdaZXJvZXMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXigtKT8wKyg/PVxcZCkvLCAnJDEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcnRTaWduID0gdmFsdWUuc2xpY2UoMCwgMSkgPT09ICctJyA/ICctJyA6ICcnO1xuICAgICAgICBpZiAodHlwZW9mIG93bmVyLnByZWZpeCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKG93bmVyLnNpZ25CZWZvcmVQcmVmaXgpIHtcbiAgICAgICAgICAgICAgICBwYXJ0U2lnbkFuZFByZWZpeCA9IHBhcnRTaWduICsgb3duZXIucHJlZml4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJ0U2lnbkFuZFByZWZpeCA9IG93bmVyLnByZWZpeCArIHBhcnRTaWduO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFydFNpZ25BbmRQcmVmaXggPSBwYXJ0U2lnbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGFydEludGVnZXIgPSB2YWx1ZTtcblxuICAgICAgICBpZiAodmFsdWUuaW5kZXhPZihvd25lci5udW1lcmFsRGVjaW1hbE1hcmspID49IDApIHtcbiAgICAgICAgICAgIHBhcnRzID0gdmFsdWUuc3BsaXQob3duZXIubnVtZXJhbERlY2ltYWxNYXJrKTtcbiAgICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydHNbMF07XG4gICAgICAgICAgICBwYXJ0RGVjaW1hbCA9IG93bmVyLm51bWVyYWxEZWNpbWFsTWFyayArIHBhcnRzWzFdLnNsaWNlKDAsIG93bmVyLm51bWVyYWxEZWNpbWFsU2NhbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocGFydFNpZ24gPT09ICctJykge1xuICAgICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0SW50ZWdlci5zbGljZSgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvd25lci5udW1lcmFsSW50ZWdlclNjYWxlID4gMCkge1xuICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydEludGVnZXIuc2xpY2UoMCwgb3duZXIubnVtZXJhbEludGVnZXJTY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG93bmVyLm51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlKSB7XG4gICAgICAgIGNhc2UgTnVtZXJhbEZvcm1hdHRlci5ncm91cFN0eWxlLmxha2g6XG4gICAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRJbnRlZ2VyLnJlcGxhY2UoLyhcXGQpKD89KFxcZFxcZCkrXFxkJCkvZywgJyQxJyArIG93bmVyLmRlbGltaXRlcik7XG5cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgTnVtZXJhbEZvcm1hdHRlci5ncm91cFN0eWxlLndhbjpcbiAgICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydEludGVnZXIucmVwbGFjZSgvKFxcZCkoPz0oXFxkezR9KSskKS9nLCAnJDEnICsgb3duZXIuZGVsaW1pdGVyKTtcblxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBOdW1lcmFsRm9ybWF0dGVyLmdyb3VwU3R5bGUudGhvdXNhbmQ6XG4gICAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRJbnRlZ2VyLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrJCkvZywgJyQxJyArIG93bmVyLmRlbGltaXRlcik7XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG93bmVyLnRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJ0U2lnbiArIHBhcnRJbnRlZ2VyLnRvU3RyaW5nKCkgKyAob3duZXIubnVtZXJhbERlY2ltYWxTY2FsZSA+IDAgPyBwYXJ0RGVjaW1hbC50b1N0cmluZygpIDogJycpICsgb3duZXIucHJlZml4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcnRTaWduQW5kUHJlZml4ICsgcGFydEludGVnZXIudG9TdHJpbmcoKSArIChvd25lci5udW1lcmFsRGVjaW1hbFNjYWxlID4gMCA/IHBhcnREZWNpbWFsLnRvU3RyaW5nKCkgOiAnJyk7XG4gICAgfVxufTtcblxudmFyIE51bWVyYWxGb3JtYXR0ZXJfMSA9IE51bWVyYWxGb3JtYXR0ZXI7XG5cbnZhciBEYXRlRm9ybWF0dGVyID0gZnVuY3Rpb24gKGRhdGVQYXR0ZXJuLCBkYXRlTWluLCBkYXRlTWF4KSB7XG4gICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgIG93bmVyLmRhdGUgPSBbXTtcbiAgICBvd25lci5ibG9ja3MgPSBbXTtcbiAgICBvd25lci5kYXRlUGF0dGVybiA9IGRhdGVQYXR0ZXJuO1xuICAgIG93bmVyLmRhdGVNaW4gPSBkYXRlTWluXG4gICAgICAuc3BsaXQoJy0nKVxuICAgICAgLnJldmVyc2UoKVxuICAgICAgLm1hcChmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCh4LCAxMCk7XG4gICAgICB9KTtcbiAgICBpZiAob3duZXIuZGF0ZU1pbi5sZW5ndGggPT09IDIpIG93bmVyLmRhdGVNaW4udW5zaGlmdCgwKTtcblxuICAgIG93bmVyLmRhdGVNYXggPSBkYXRlTWF4XG4gICAgICAuc3BsaXQoJy0nKVxuICAgICAgLnJldmVyc2UoKVxuICAgICAgLm1hcChmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCh4LCAxMCk7XG4gICAgICB9KTtcbiAgICBpZiAob3duZXIuZGF0ZU1heC5sZW5ndGggPT09IDIpIG93bmVyLmRhdGVNYXgudW5zaGlmdCgwKTtcbiAgICBcbiAgICBvd25lci5pbml0QmxvY2tzKCk7XG59O1xuXG5EYXRlRm9ybWF0dGVyLnByb3RvdHlwZSA9IHtcbiAgICBpbml0QmxvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG4gICAgICAgIG93bmVyLmRhdGVQYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdZJykge1xuICAgICAgICAgICAgICAgIG93bmVyLmJsb2Nrcy5wdXNoKDQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvd25lci5ibG9ja3MucHVzaCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldElTT0Zvcm1hdERhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIGRhdGUgPSBvd25lci5kYXRlO1xuXG4gICAgICAgIHJldHVybiBkYXRlWzJdID8gKFxuICAgICAgICAgICAgZGF0ZVsyXSArICctJyArIG93bmVyLmFkZExlYWRpbmdaZXJvKGRhdGVbMV0pICsgJy0nICsgb3duZXIuYWRkTGVhZGluZ1plcm8oZGF0ZVswXSlcbiAgICAgICAgKSA6ICcnO1xuICAgIH0sXG5cbiAgICBnZXRCbG9ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzO1xuICAgIH0sXG5cbiAgICBnZXRWYWxpZGF0ZWREYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcmVzdWx0ID0gJyc7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9bXlxcZF0vZywgJycpO1xuXG4gICAgICAgIG93bmVyLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uIChsZW5ndGgsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBzdWIgPSB2YWx1ZS5zbGljZSgwLCBsZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICBzdWIwID0gc3ViLnNsaWNlKDAsIDEpLFxuICAgICAgICAgICAgICAgICAgICByZXN0ID0gdmFsdWUuc2xpY2UobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAob3duZXIuZGF0ZVBhdHRlcm5baW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWIgPT09ICcwMCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwMSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViMCwgMTApID4gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAnICsgc3ViMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIsIDEwKSA+IDMxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMzEnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YiA9PT0gJzAwJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAxJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIwLCAxMCkgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMCcgKyBzdWIwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YiwgMTApID4gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcxMic7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gc3ViO1xuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHJlbWFpbmluZyBzdHJpbmdcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpeGVkRGF0ZVN0cmluZyhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICBnZXRGaXhlZERhdGVTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBkYXRlUGF0dGVybiA9IG93bmVyLmRhdGVQYXR0ZXJuLCBkYXRlID0gW10sXG4gICAgICAgICAgICBkYXlJbmRleCA9IDAsIG1vbnRoSW5kZXggPSAwLCB5ZWFySW5kZXggPSAwLFxuICAgICAgICAgICAgZGF5U3RhcnRJbmRleCA9IDAsIG1vbnRoU3RhcnRJbmRleCA9IDAsIHllYXJTdGFydEluZGV4ID0gMCxcbiAgICAgICAgICAgIGRheSwgbW9udGgsIHllYXIsIGZ1bGxZZWFyRG9uZSA9IGZhbHNlO1xuXG4gICAgICAgIC8vIG1tLWRkIHx8IGRkLW1tXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDQgJiYgZGF0ZVBhdHRlcm5bMF0udG9Mb3dlckNhc2UoKSAhPT0gJ3knICYmIGRhdGVQYXR0ZXJuWzFdLnRvTG93ZXJDYXNlKCkgIT09ICd5Jykge1xuICAgICAgICAgICAgZGF5U3RhcnRJbmRleCA9IGRhdGVQYXR0ZXJuWzBdID09PSAnZCcgPyAwIDogMjtcbiAgICAgICAgICAgIG1vbnRoU3RhcnRJbmRleCA9IDIgLSBkYXlTdGFydEluZGV4O1xuICAgICAgICAgICAgZGF5ID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoZGF5U3RhcnRJbmRleCwgZGF5U3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICBtb250aCA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1vbnRoU3RhcnRJbmRleCwgbW9udGhTdGFydEluZGV4ICsgMiksIDEwKTtcblxuICAgICAgICAgICAgZGF0ZSA9IHRoaXMuZ2V0Rml4ZWREYXRlKGRheSwgbW9udGgsIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8geXl5eS1tbS1kZCB8fCB5eXl5LWRkLW1tIHx8IG1tLWRkLXl5eXkgfHwgZGQtbW0teXl5eSB8fCBkZC15eXl5LW1tIHx8IG1tLXl5eXktZGRcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gOCkge1xuICAgICAgICAgICAgZGF0ZVBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICAgICAgZGF5SW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgICAgIG1vbnRoSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgeWVhckluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB5ZWFyU3RhcnRJbmRleCA9IHllYXJJbmRleCAqIDI7XG4gICAgICAgICAgICBkYXlTdGFydEluZGV4ID0gKGRheUluZGV4IDw9IHllYXJJbmRleCkgPyBkYXlJbmRleCAqIDIgOiAoZGF5SW5kZXggKiAyICsgMik7XG4gICAgICAgICAgICBtb250aFN0YXJ0SW5kZXggPSAobW9udGhJbmRleCA8PSB5ZWFySW5kZXgpID8gbW9udGhJbmRleCAqIDIgOiAobW9udGhJbmRleCAqIDIgKyAyKTtcblxuICAgICAgICAgICAgZGF5ID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoZGF5U3RhcnRJbmRleCwgZGF5U3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICBtb250aCA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1vbnRoU3RhcnRJbmRleCwgbW9udGhTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyA0KSwgMTApO1xuXG4gICAgICAgICAgICBmdWxsWWVhckRvbmUgPSB2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyA0KS5sZW5ndGggPT09IDQ7XG5cbiAgICAgICAgICAgIGRhdGUgPSB0aGlzLmdldEZpeGVkRGF0ZShkYXksIG1vbnRoLCB5ZWFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1tLXl5IHx8IHl5LW1tXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDQgJiYgKGRhdGVQYXR0ZXJuWzBdID09PSAneScgfHwgZGF0ZVBhdHRlcm5bMV0gPT09ICd5JykpIHtcbiAgICAgICAgICAgIG1vbnRoU3RhcnRJbmRleCA9IGRhdGVQYXR0ZXJuWzBdID09PSAnbScgPyAwIDogMjtcbiAgICAgICAgICAgIHllYXJTdGFydEluZGV4ID0gMiAtIG1vbnRoU3RhcnRJbmRleDtcbiAgICAgICAgICAgIG1vbnRoID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobW9udGhTdGFydEluZGV4LCBtb250aFN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgeWVhciA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDIpLCAxMCk7XG5cbiAgICAgICAgICAgIGZ1bGxZZWFyRG9uZSA9IHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDIpLmxlbmd0aCA9PT0gMjtcblxuICAgICAgICAgICAgZGF0ZSA9IFswLCBtb250aCwgeWVhcl07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtbS15eXl5IHx8IHl5eXktbW1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gNiAmJiAoZGF0ZVBhdHRlcm5bMF0gPT09ICdZJyB8fCBkYXRlUGF0dGVyblsxXSA9PT0gJ1knKSkge1xuICAgICAgICAgICAgbW9udGhTdGFydEluZGV4ID0gZGF0ZVBhdHRlcm5bMF0gPT09ICdtJyA/IDAgOiA0O1xuICAgICAgICAgICAgeWVhclN0YXJ0SW5kZXggPSAyIC0gMC41ICogbW9udGhTdGFydEluZGV4O1xuICAgICAgICAgICAgbW9udGggPSBwYXJzZUludCh2YWx1ZS5zbGljZShtb250aFN0YXJ0SW5kZXgsIG1vbnRoU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgNCksIDEwKTtcblxuICAgICAgICAgICAgZnVsbFllYXJEb25lID0gdmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgNCkubGVuZ3RoID09PSA0O1xuXG4gICAgICAgICAgICBkYXRlID0gWzAsIG1vbnRoLCB5ZWFyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGUgPSBvd25lci5nZXRSYW5nZUZpeGVkRGF0ZShkYXRlKTtcbiAgICAgICAgb3duZXIuZGF0ZSA9IGRhdGU7XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IGRhdGUubGVuZ3RoID09PSAwID8gdmFsdWUgOiBkYXRlUGF0dGVybi5yZWR1Y2UoZnVuY3Rpb24gKHByZXZpb3VzLCBjdXJyZW50KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIChkYXRlWzBdID09PSAwID8gJycgOiBvd25lci5hZGRMZWFkaW5nWmVybyhkYXRlWzBdKSk7XG4gICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyAoZGF0ZVsxXSA9PT0gMCA/ICcnIDogb3duZXIuYWRkTGVhZGluZ1plcm8oZGF0ZVsxXSkpO1xuICAgICAgICAgICAgY2FzZSAneSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgKGZ1bGxZZWFyRG9uZSA/IG93bmVyLmFkZExlYWRpbmdaZXJvRm9yWWVhcihkYXRlWzJdLCBmYWxzZSkgOiAnJyk7XG4gICAgICAgICAgICBjYXNlICdZJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyAoZnVsbFllYXJEb25lID8gb3duZXIuYWRkTGVhZGluZ1plcm9Gb3JZZWFyKGRhdGVbMl0sIHRydWUpIDogJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAnJyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgZ2V0UmFuZ2VGaXhlZERhdGU6IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBkYXRlUGF0dGVybiA9IG93bmVyLmRhdGVQYXR0ZXJuLFxuICAgICAgICAgICAgZGF0ZU1pbiA9IG93bmVyLmRhdGVNaW4gfHwgW10sXG4gICAgICAgICAgICBkYXRlTWF4ID0gb3duZXIuZGF0ZU1heCB8fCBbXTtcblxuICAgICAgICBpZiAoIWRhdGUubGVuZ3RoIHx8IChkYXRlTWluLmxlbmd0aCA8IDMgJiYgZGF0ZU1heC5sZW5ndGggPCAzKSkgcmV0dXJuIGRhdGU7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRhdGVQYXR0ZXJuLmZpbmQoZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIHgudG9Mb3dlckNhc2UoKSA9PT0gJ3knO1xuICAgICAgICAgIH0pICYmXG4gICAgICAgICAgZGF0ZVsyXSA9PT0gMFxuICAgICAgICApIHJldHVybiBkYXRlO1xuXG4gICAgICAgIGlmIChkYXRlTWF4Lmxlbmd0aCAmJiAoZGF0ZU1heFsyXSA8IGRhdGVbMl0gfHwgKFxuICAgICAgICAgIGRhdGVNYXhbMl0gPT09IGRhdGVbMl0gJiYgKGRhdGVNYXhbMV0gPCBkYXRlWzFdIHx8IChcbiAgICAgICAgICAgIGRhdGVNYXhbMV0gPT09IGRhdGVbMV0gJiYgZGF0ZU1heFswXSA8IGRhdGVbMF1cbiAgICAgICAgICApKVxuICAgICAgICApKSkgcmV0dXJuIGRhdGVNYXg7XG5cbiAgICAgICAgaWYgKGRhdGVNaW4ubGVuZ3RoICYmIChkYXRlTWluWzJdID4gZGF0ZVsyXSB8fCAoXG4gICAgICAgICAgZGF0ZU1pblsyXSA9PT0gZGF0ZVsyXSAmJiAoZGF0ZU1pblsxXSA+IGRhdGVbMV0gfHwgKFxuICAgICAgICAgICAgZGF0ZU1pblsxXSA9PT0gZGF0ZVsxXSAmJiBkYXRlTWluWzBdID4gZGF0ZVswXVxuICAgICAgICAgICkpXG4gICAgICAgICkpKSByZXR1cm4gZGF0ZU1pbjtcblxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9LFxuXG4gICAgZ2V0Rml4ZWREYXRlOiBmdW5jdGlvbiAoZGF5LCBtb250aCwgeWVhcikge1xuICAgICAgICBkYXkgPSBNYXRoLm1pbihkYXksIDMxKTtcbiAgICAgICAgbW9udGggPSBNYXRoLm1pbihtb250aCwgMTIpO1xuICAgICAgICB5ZWFyID0gcGFyc2VJbnQoKHllYXIgfHwgMCksIDEwKTtcblxuICAgICAgICBpZiAoKG1vbnRoIDwgNyAmJiBtb250aCAlIDIgPT09IDApIHx8IChtb250aCA+IDggJiYgbW9udGggJSAyID09PSAxKSkge1xuICAgICAgICAgICAgZGF5ID0gTWF0aC5taW4oZGF5LCBtb250aCA9PT0gMiA/ICh0aGlzLmlzTGVhcFllYXIoeWVhcikgPyAyOSA6IDI4KSA6IDMwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbZGF5LCBtb250aCwgeWVhcl07XG4gICAgfSxcblxuICAgIGlzTGVhcFllYXI6IGZ1bmN0aW9uICh5ZWFyKSB7XG4gICAgICAgIHJldHVybiAoKHllYXIgJSA0ID09PSAwKSAmJiAoeWVhciAlIDEwMCAhPT0gMCkpIHx8ICh5ZWFyICUgNDAwID09PSAwKTtcbiAgICB9LFxuXG4gICAgYWRkTGVhZGluZ1plcm86IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIChudW1iZXIgPCAxMCA/ICcwJyA6ICcnKSArIG51bWJlcjtcbiAgICB9LFxuXG4gICAgYWRkTGVhZGluZ1plcm9Gb3JZZWFyOiBmdW5jdGlvbiAobnVtYmVyLCBmdWxsWWVhck1vZGUpIHtcbiAgICAgICAgaWYgKGZ1bGxZZWFyTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIChudW1iZXIgPCAxMCA/ICcwMDAnIDogKG51bWJlciA8IDEwMCA/ICcwMCcgOiAobnVtYmVyIDwgMTAwMCA/ICcwJyA6ICcnKSkpICsgbnVtYmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChudW1iZXIgPCAxMCA/ICcwJyA6ICcnKSArIG51bWJlcjtcbiAgICB9XG59O1xuXG52YXIgRGF0ZUZvcm1hdHRlcl8xID0gRGF0ZUZvcm1hdHRlcjtcblxudmFyIFRpbWVGb3JtYXR0ZXIgPSBmdW5jdGlvbiAodGltZVBhdHRlcm4sIHRpbWVGb3JtYXQpIHtcbiAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgb3duZXIudGltZSA9IFtdO1xuICAgIG93bmVyLmJsb2NrcyA9IFtdO1xuICAgIG93bmVyLnRpbWVQYXR0ZXJuID0gdGltZVBhdHRlcm47XG4gICAgb3duZXIudGltZUZvcm1hdCA9IHRpbWVGb3JtYXQ7XG4gICAgb3duZXIuaW5pdEJsb2NrcygpO1xufTtcblxuVGltZUZvcm1hdHRlci5wcm90b3R5cGUgPSB7XG4gICAgaW5pdEJsb2NrczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuICAgICAgICBvd25lci50aW1lUGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG93bmVyLmJsb2Nrcy5wdXNoKDIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0SVNPRm9ybWF0VGltZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgdGltZSA9IG93bmVyLnRpbWU7XG5cbiAgICAgICAgcmV0dXJuIHRpbWVbMl0gPyAoXG4gICAgICAgICAgICBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzBdKSArICc6JyArIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMV0pICsgJzonICsgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVsyXSlcbiAgICAgICAgKSA6ICcnO1xuICAgIH0sXG5cbiAgICBnZXRCbG9ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzO1xuICAgIH0sXG5cbiAgICBnZXRUaW1lRm9ybWF0T3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuICAgICAgICBpZiAoU3RyaW5nKG93bmVyLnRpbWVGb3JtYXQpID09PSAnMTInKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1heEhvdXJGaXJzdERpZ2l0OiAxLFxuICAgICAgICAgICAgICAgIG1heEhvdXJzOiAxMixcbiAgICAgICAgICAgICAgICBtYXhNaW51dGVzRmlyc3REaWdpdDogNSxcbiAgICAgICAgICAgICAgICBtYXhNaW51dGVzOiA2MFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtYXhIb3VyRmlyc3REaWdpdDogMixcbiAgICAgICAgICAgIG1heEhvdXJzOiAyMyxcbiAgICAgICAgICAgIG1heE1pbnV0ZXNGaXJzdERpZ2l0OiA1LFxuICAgICAgICAgICAgbWF4TWludXRlczogNjBcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0VmFsaWRhdGVkVGltZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHJlc3VsdCA9ICcnO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvW15cXGRdL2csICcnKTtcblxuICAgICAgICB2YXIgdGltZUZvcm1hdE9wdGlvbnMgPSBvd25lci5nZXRUaW1lRm9ybWF0T3B0aW9ucygpO1xuXG4gICAgICAgIG93bmVyLmJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uIChsZW5ndGgsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBzdWIgPSB2YWx1ZS5zbGljZSgwLCBsZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICBzdWIwID0gc3ViLnNsaWNlKDAsIDEpLFxuICAgICAgICAgICAgICAgICAgICByZXN0ID0gdmFsdWUuc2xpY2UobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAob3duZXIudGltZVBhdHRlcm5baW5kZXhdKSB7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KHN1YjAsIDEwKSA+IHRpbWVGb3JtYXRPcHRpb25zLm1heEhvdXJGaXJzdERpZ2l0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMCcgKyBzdWIwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YiwgMTApID4gdGltZUZvcm1hdE9wdGlvbnMubWF4SG91cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9IHRpbWVGb3JtYXRPcHRpb25zLm1heEhvdXJzICsgJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VJbnQoc3ViMCwgMTApID4gdGltZUZvcm1hdE9wdGlvbnMubWF4TWludXRlc0ZpcnN0RGlnaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwJyArIHN1YjA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViLCAxMCkgPiB0aW1lRm9ybWF0T3B0aW9ucy5tYXhNaW51dGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSB0aW1lRm9ybWF0T3B0aW9ucy5tYXhNaW51dGVzICsgJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN1YjtcblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSByZW1haW5pbmcgc3RyaW5nXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGaXhlZFRpbWVTdHJpbmcocmVzdWx0KTtcbiAgICB9LFxuXG4gICAgZ2V0Rml4ZWRUaW1lU3RyaW5nOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgdGltZVBhdHRlcm4gPSBvd25lci50aW1lUGF0dGVybiwgdGltZSA9IFtdLFxuICAgICAgICAgICAgc2Vjb25kSW5kZXggPSAwLCBtaW51dGVJbmRleCA9IDAsIGhvdXJJbmRleCA9IDAsXG4gICAgICAgICAgICBzZWNvbmRTdGFydEluZGV4ID0gMCwgbWludXRlU3RhcnRJbmRleCA9IDAsIGhvdXJTdGFydEluZGV4ID0gMCxcbiAgICAgICAgICAgIHNlY29uZCwgbWludXRlLCBob3VyO1xuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDYpIHtcbiAgICAgICAgICAgIHRpbWVQYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24gKHR5cGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZEluZGV4ID0gaW5kZXggKiAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICAgICAgbWludXRlSW5kZXggPSBpbmRleCAqIDI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgICAgICBob3VySW5kZXggPSBpbmRleCAqIDI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBob3VyU3RhcnRJbmRleCA9IGhvdXJJbmRleDtcbiAgICAgICAgICAgIG1pbnV0ZVN0YXJ0SW5kZXggPSBtaW51dGVJbmRleDtcbiAgICAgICAgICAgIHNlY29uZFN0YXJ0SW5kZXggPSBzZWNvbmRJbmRleDtcblxuICAgICAgICAgICAgc2Vjb25kID0gcGFyc2VJbnQodmFsdWUuc2xpY2Uoc2Vjb25kU3RhcnRJbmRleCwgc2Vjb25kU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICBtaW51dGUgPSBwYXJzZUludCh2YWx1ZS5zbGljZShtaW51dGVTdGFydEluZGV4LCBtaW51dGVTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIGhvdXIgPSBwYXJzZUludCh2YWx1ZS5zbGljZShob3VyU3RhcnRJbmRleCwgaG91clN0YXJ0SW5kZXggKyAyKSwgMTApO1xuXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nZXRGaXhlZFRpbWUoaG91ciwgbWludXRlLCBzZWNvbmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gNCAmJiBvd25lci50aW1lUGF0dGVybi5pbmRleE9mKCdzJykgPCAwKSB7XG4gICAgICAgICAgICB0aW1lUGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgICAgICBtaW51dGVJbmRleCA9IGluZGV4ICogMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnaCc6XG4gICAgICAgICAgICAgICAgICAgIGhvdXJJbmRleCA9IGluZGV4ICogMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGhvdXJTdGFydEluZGV4ID0gaG91ckluZGV4O1xuICAgICAgICAgICAgbWludXRlU3RhcnRJbmRleCA9IG1pbnV0ZUluZGV4O1xuXG4gICAgICAgICAgICBzZWNvbmQgPSAwO1xuICAgICAgICAgICAgbWludXRlID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobWludXRlU3RhcnRJbmRleCwgbWludXRlU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICBob3VyID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoaG91clN0YXJ0SW5kZXgsIGhvdXJTdGFydEluZGV4ICsgMiksIDEwKTtcblxuICAgICAgICAgICAgdGltZSA9IHRoaXMuZ2V0Rml4ZWRUaW1lKGhvdXIsIG1pbnV0ZSwgc2Vjb25kKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG93bmVyLnRpbWUgPSB0aW1lO1xuXG4gICAgICAgIHJldHVybiB0aW1lLmxlbmd0aCA9PT0gMCA/IHZhbHVlIDogdGltZVBhdHRlcm4ucmVkdWNlKGZ1bmN0aW9uIChwcmV2aW91cywgY3VycmVudCkge1xuICAgICAgICAgICAgc3dpdGNoIChjdXJyZW50KSB7XG4gICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzJdKTtcbiAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMV0pO1xuICAgICAgICAgICAgY2FzZSAnaCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICcnKTtcbiAgICB9LFxuXG4gICAgZ2V0Rml4ZWRUaW1lOiBmdW5jdGlvbiAoaG91ciwgbWludXRlLCBzZWNvbmQpIHtcbiAgICAgICAgc2Vjb25kID0gTWF0aC5taW4ocGFyc2VJbnQoc2Vjb25kIHx8IDAsIDEwKSwgNjApO1xuICAgICAgICBtaW51dGUgPSBNYXRoLm1pbihtaW51dGUsIDYwKTtcbiAgICAgICAgaG91ciA9IE1hdGgubWluKGhvdXIsIDYwKTtcblxuICAgICAgICByZXR1cm4gW2hvdXIsIG1pbnV0ZSwgc2Vjb25kXTtcbiAgICB9LFxuXG4gICAgYWRkTGVhZGluZ1plcm86IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIChudW1iZXIgPCAxMCA/ICcwJyA6ICcnKSArIG51bWJlcjtcbiAgICB9XG59O1xuXG52YXIgVGltZUZvcm1hdHRlcl8xID0gVGltZUZvcm1hdHRlcjtcblxudmFyIFBob25lRm9ybWF0dGVyID0gZnVuY3Rpb24gKGZvcm1hdHRlciwgZGVsaW1pdGVyKSB7XG4gICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgIG93bmVyLmRlbGltaXRlciA9IChkZWxpbWl0ZXIgfHwgZGVsaW1pdGVyID09PSAnJykgPyBkZWxpbWl0ZXIgOiAnICc7XG4gICAgb3duZXIuZGVsaW1pdGVyUkUgPSBkZWxpbWl0ZXIgPyBuZXcgUmVnRXhwKCdcXFxcJyArIGRlbGltaXRlciwgJ2cnKSA6ICcnO1xuXG4gICAgb3duZXIuZm9ybWF0dGVyID0gZm9ybWF0dGVyO1xufTtcblxuUGhvbmVGb3JtYXR0ZXIucHJvdG90eXBlID0ge1xuICAgIHNldEZvcm1hdHRlcjogZnVuY3Rpb24gKGZvcm1hdHRlcikge1xuICAgICAgICB0aGlzLmZvcm1hdHRlciA9IGZvcm1hdHRlcjtcbiAgICB9LFxuXG4gICAgZm9ybWF0OiBmdW5jdGlvbiAocGhvbmVOdW1iZXIpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgICAgICBvd25lci5mb3JtYXR0ZXIuY2xlYXIoKTtcblxuICAgICAgICAvLyBvbmx5IGtlZXAgbnVtYmVyIGFuZCArXG4gICAgICAgIHBob25lTnVtYmVyID0gcGhvbmVOdW1iZXIucmVwbGFjZSgvW15cXGQrXS9nLCAnJyk7XG5cbiAgICAgICAgLy8gc3RyaXAgbm9uLWxlYWRpbmcgK1xuICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnJlcGxhY2UoL15cXCsvLCAnQicpLnJlcGxhY2UoL1xcKy9nLCAnJykucmVwbGFjZSgnQicsICcrJyk7XG5cbiAgICAgICAgLy8gc3RyaXAgZGVsaW1pdGVyXG4gICAgICAgIHBob25lTnVtYmVyID0gcGhvbmVOdW1iZXIucmVwbGFjZShvd25lci5kZWxpbWl0ZXJSRSwgJycpO1xuXG4gICAgICAgIHZhciByZXN1bHQgPSAnJywgY3VycmVudCwgdmFsaWRhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlNYXggPSBwaG9uZU51bWJlci5sZW5ndGg7IGkgPCBpTWF4OyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBvd25lci5mb3JtYXR0ZXIuaW5wdXREaWdpdChwaG9uZU51bWJlci5jaGFyQXQoaSkpO1xuXG4gICAgICAgICAgICAvLyBoYXMgKCktIG9yIHNwYWNlIGluc2lkZVxuICAgICAgICAgICAgaWYgKC9bXFxzKCktXS9nLnRlc3QoY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBjdXJyZW50O1xuXG4gICAgICAgICAgICAgICAgdmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gY3VycmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZWxzZTogb3ZlciBsZW5ndGggaW5wdXRcbiAgICAgICAgICAgICAgICAvLyBpdCB0dXJucyB0byBpbnZhbGlkIG51bWJlciBhZ2FpblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RyaXAgKClcbiAgICAgICAgLy8gZS5nLiBVUzogNzE2MTIzNDU2NyByZXR1cm5zICg3MTYpIDEyMy00NTY3XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9bKCldL2csICcnKTtcbiAgICAgICAgLy8gcmVwbGFjZSBsaWJyYXJ5IGRlbGltaXRlciB3aXRoIHVzZXIgY3VzdG9taXplZCBkZWxpbWl0ZXJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL1tcXHMtXS9nLCBvd25lci5kZWxpbWl0ZXIpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufTtcblxudmFyIFBob25lRm9ybWF0dGVyXzEgPSBQaG9uZUZvcm1hdHRlcjtcblxudmFyIENyZWRpdENhcmREZXRlY3RvciA9IHtcbiAgICBibG9ja3M6IHtcbiAgICAgICAgdWF0cDogICAgICAgICAgWzQsIDUsIDZdLFxuICAgICAgICBhbWV4OiAgICAgICAgICBbNCwgNiwgNV0sXG4gICAgICAgIGRpbmVyczogICAgICAgIFs0LCA2LCA0XSxcbiAgICAgICAgZGlzY292ZXI6ICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBtYXN0ZXJjYXJkOiAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIGRhbmtvcnQ6ICAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgaW5zdGFwYXltZW50OiAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBqY2IxNTogICAgICAgICBbNCwgNiwgNV0sXG4gICAgICAgIGpjYjogICAgICAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgbWFlc3RybzogICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICB2aXNhOiAgICAgICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIG1pcjogICAgICAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgdW5pb25QYXk6ICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBnZW5lcmFsOiAgICAgICBbNCwgNCwgNCwgNF1cbiAgICB9LFxuXG4gICAgcmU6IHtcbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMTsgMTUgZGlnaXRzLCBub3Qgc3RhcnRzIHdpdGggMTgwMCAoamNiIGNhcmQpXG4gICAgICAgIHVhdHA6IC9eKD8hMTgwMCkxXFxkezAsMTR9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCAzNC8zNzsgMTUgZGlnaXRzXG4gICAgICAgIGFtZXg6IC9eM1s0N11cXGR7MCwxM30vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDYwMTEvNjUvNjQ0LTY0OTsgMTYgZGlnaXRzXG4gICAgICAgIGRpc2NvdmVyOiAvXig/OjYwMTF8NjVcXGR7MCwyfXw2NFs0LTldXFxkPylcXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDMwMC0zMDUvMzA5IG9yIDM2LzM4LzM5OyAxNCBkaWdpdHNcbiAgICAgICAgZGluZXJzOiAvXjMoPzowKFswLTVdfDkpfFs2ODldXFxkPylcXGR7MCwxMX0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDUxLTU1LzIyMjFcdTIwMTMyNzIwOyAxNiBkaWdpdHNcbiAgICAgICAgbWFzdGVyY2FyZDogL14oNVsxLTVdXFxkezAsMn18MjJbMi05XVxcZHswLDF9fDJbMy03XVxcZHswLDJ9KVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNTAxOS80MTc1LzQ1NzE7IDE2IGRpZ2l0c1xuICAgICAgICBkYW5rb3J0OiAvXig1MDE5fDQxNzV8NDU3MSlcXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDYzNy02Mzk7IDE2IGRpZ2l0c1xuICAgICAgICBpbnN0YXBheW1lbnQ6IC9eNjNbNy05XVxcZHswLDEzfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMjEzMS8xODAwOyAxNSBkaWdpdHNcbiAgICAgICAgamNiMTU6IC9eKD86MjEzMXwxODAwKVxcZHswLDExfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMjEzMS8xODAwLzM1OyAxNiBkaWdpdHNcbiAgICAgICAgamNiOiAvXig/OjM1XFxkezAsMn0pXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA1MC81Ni01OC82MzA0LzY3OyAxNiBkaWdpdHNcbiAgICAgICAgbWFlc3RybzogL14oPzo1WzA2NzhdXFxkezAsMn18NjMwNHw2N1xcZHswLDJ9KVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMjI7IDE2IGRpZ2l0c1xuICAgICAgICBtaXI6IC9eMjIwWzAtNF1cXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDQ7IDE2IGRpZ2l0c1xuICAgICAgICB2aXNhOiAvXjRcXGR7MCwxNX0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDYyLzgxOyAxNiBkaWdpdHNcbiAgICAgICAgdW5pb25QYXk6IC9eKDYyfDgxKVxcZHswLDE0fS9cbiAgICB9LFxuXG4gICAgZ2V0U3RyaWN0QmxvY2tzOiBmdW5jdGlvbiAoYmxvY2spIHtcbiAgICAgIHZhciB0b3RhbCA9IGJsb2NrLnJlZHVjZShmdW5jdGlvbiAocHJldiwgY3VycmVudCkge1xuICAgICAgICByZXR1cm4gcHJldiArIGN1cnJlbnQ7XG4gICAgICB9LCAwKTtcblxuICAgICAgcmV0dXJuIGJsb2NrLmNvbmNhdCgxOSAtIHRvdGFsKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5mbzogZnVuY3Rpb24gKHZhbHVlLCBzdHJpY3RNb2RlKSB7XG4gICAgICAgIHZhciBibG9ja3MgPSBDcmVkaXRDYXJkRGV0ZWN0b3IuYmxvY2tzLFxuICAgICAgICAgICAgcmUgPSBDcmVkaXRDYXJkRGV0ZWN0b3IucmU7XG5cbiAgICAgICAgLy8gU29tZSBjcmVkaXQgY2FyZCBjYW4gaGF2ZSB1cCB0byAxOSBkaWdpdHMgbnVtYmVyLlxuICAgICAgICAvLyBTZXQgc3RyaWN0TW9kZSB0byB0cnVlIHdpbGwgcmVtb3ZlIHRoZSAxNiBtYXgtbGVuZ3RoIHJlc3RyYWluLFxuICAgICAgICAvLyBob3dldmVyLCBJIG5ldmVyIGZvdW5kIGFueSB3ZWJzaXRlIHZhbGlkYXRlIGNhcmQgbnVtYmVyIGxpa2VcbiAgICAgICAgLy8gdGhpcywgaGVuY2UgcHJvYmFibHkgeW91IGRvbid0IHdhbnQgdG8gZW5hYmxlIHRoaXMgb3B0aW9uLlxuICAgICAgICBzdHJpY3RNb2RlID0gISFzdHJpY3RNb2RlO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiByZSkge1xuICAgICAgICAgICAgaWYgKHJlW2tleV0udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlZEJsb2NrcyA9IGJsb2Nrc1trZXldO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tzOiBzdHJpY3RNb2RlID8gdGhpcy5nZXRTdHJpY3RCbG9ja3MobWF0Y2hlZEJsb2NrcykgOiBtYXRjaGVkQmxvY2tzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndW5rbm93bicsXG4gICAgICAgICAgICBibG9ja3M6IHN0cmljdE1vZGUgPyB0aGlzLmdldFN0cmljdEJsb2NrcyhibG9ja3MuZ2VuZXJhbCkgOiBibG9ja3MuZ2VuZXJhbFxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbnZhciBDcmVkaXRDYXJkRGV0ZWN0b3JfMSA9IENyZWRpdENhcmREZXRlY3RvcjtcblxudmFyIFV0aWwgPSB7XG4gICAgbm9vcDogZnVuY3Rpb24gKCkge1xuICAgIH0sXG5cbiAgICBzdHJpcDogZnVuY3Rpb24gKHZhbHVlLCByZSkge1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShyZSwgJycpO1xuICAgIH0sXG5cbiAgICBnZXRQb3N0RGVsaW1pdGVyOiBmdW5jdGlvbiAodmFsdWUsIGRlbGltaXRlciwgZGVsaW1pdGVycykge1xuICAgICAgICAvLyBzaW5nbGUgZGVsaW1pdGVyXG4gICAgICAgIGlmIChkZWxpbWl0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKC1kZWxpbWl0ZXIubGVuZ3RoKSA9PT0gZGVsaW1pdGVyID8gZGVsaW1pdGVyIDogJyc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtdWx0aXBsZSBkZWxpbWl0ZXJzXG4gICAgICAgIHZhciBtYXRjaGVkRGVsaW1pdGVyID0gJyc7XG4gICAgICAgIGRlbGltaXRlcnMuZm9yRWFjaChmdW5jdGlvbiAoY3VycmVudCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnNsaWNlKC1jdXJyZW50Lmxlbmd0aCkgPT09IGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBtYXRjaGVkRGVsaW1pdGVyID0gY3VycmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZWREZWxpbWl0ZXI7XG4gICAgfSxcblxuICAgIGdldERlbGltaXRlclJFQnlEZWxpbWl0ZXI6IGZ1bmN0aW9uIChkZWxpbWl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoZGVsaW1pdGVyLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCAnXFxcXCQxJyksICdnJyk7XG4gICAgfSxcblxuICAgIGdldE5leHRDdXJzb3JQb3NpdGlvbjogZnVuY3Rpb24gKHByZXZQb3MsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKSB7XG4gICAgICAvLyBJZiBjdXJzb3Igd2FzIGF0IHRoZSBlbmQgb2YgdmFsdWUsIGp1c3QgcGxhY2UgaXQgYmFjay5cbiAgICAgIC8vIEJlY2F1c2UgbmV3IHZhbHVlIGNvdWxkIGNvbnRhaW4gYWRkaXRpb25hbCBjaGFycy5cbiAgICAgIGlmIChvbGRWYWx1ZS5sZW5ndGggPT09IHByZXZQb3MpIHtcbiAgICAgICAgICByZXR1cm4gbmV3VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJldlBvcyArIHRoaXMuZ2V0UG9zaXRpb25PZmZzZXQocHJldlBvcywgb2xkVmFsdWUsIG5ld1ZhbHVlLCBkZWxpbWl0ZXIgLGRlbGltaXRlcnMpO1xuICAgIH0sXG5cbiAgICBnZXRQb3NpdGlvbk9mZnNldDogZnVuY3Rpb24gKHByZXZQb3MsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKSB7XG4gICAgICAgIHZhciBvbGRSYXdWYWx1ZSwgbmV3UmF3VmFsdWUsIGxlbmd0aE9mZnNldDtcblxuICAgICAgICBvbGRSYXdWYWx1ZSA9IHRoaXMuc3RyaXBEZWxpbWl0ZXJzKG9sZFZhbHVlLnNsaWNlKDAsIHByZXZQb3MpLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpO1xuICAgICAgICBuZXdSYXdWYWx1ZSA9IHRoaXMuc3RyaXBEZWxpbWl0ZXJzKG5ld1ZhbHVlLnNsaWNlKDAsIHByZXZQb3MpLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpO1xuICAgICAgICBsZW5ndGhPZmZzZXQgPSBvbGRSYXdWYWx1ZS5sZW5ndGggLSBuZXdSYXdWYWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIChsZW5ndGhPZmZzZXQgIT09IDApID8gKGxlbmd0aE9mZnNldCAvIE1hdGguYWJzKGxlbmd0aE9mZnNldCkpIDogMDtcbiAgICB9LFxuXG4gICAgc3RyaXBEZWxpbWl0ZXJzOiBmdW5jdGlvbiAodmFsdWUsIGRlbGltaXRlciwgZGVsaW1pdGVycykge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgICAgIC8vIHNpbmdsZSBkZWxpbWl0ZXJcbiAgICAgICAgaWYgKGRlbGltaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB2YXIgZGVsaW1pdGVyUkUgPSBkZWxpbWl0ZXIgPyBvd25lci5nZXREZWxpbWl0ZXJSRUJ5RGVsaW1pdGVyKGRlbGltaXRlcikgOiAnJztcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoZGVsaW1pdGVyUkUsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG11bHRpcGxlIGRlbGltaXRlcnNcbiAgICAgICAgZGVsaW1pdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChjdXJyZW50KSB7XG4gICAgICAgICAgICBjdXJyZW50LnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2Uob3duZXIuZ2V0RGVsaW1pdGVyUkVCeURlbGltaXRlcihsZXR0ZXIpLCAnJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICBoZWFkU3RyOiBmdW5jdGlvbiAoc3RyLCBsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5zbGljZSgwLCBsZW5ndGgpO1xuICAgIH0sXG5cbiAgICBnZXRNYXhMZW5ndGg6IGZ1bmN0aW9uIChibG9ja3MpIHtcbiAgICAgICAgcmV0dXJuIGJsb2Nrcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXZpb3VzLCBjdXJyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyBjdXJyZW50O1xuICAgICAgICB9LCAwKTtcbiAgICB9LFxuXG4gICAgLy8gc3RyaXAgcHJlZml4XG4gICAgLy8gQmVmb3JlIHR5cGUgIHwgICBBZnRlciB0eXBlICAgIHwgICAgIFJldHVybiB2YWx1ZVxuICAgIC8vIFBFRklYLS4uLiAgICB8ICAgUEVGSVgtLi4uICAgICB8ICAgICAnJ1xuICAgIC8vIFBSRUZJWC0xMjMgICB8ICAgUEVGSVgtMTIzICAgICB8ICAgICAxMjNcbiAgICAvLyBQUkVGSVgtMTIzICAgfCAgIFBSRUZJWC0yMyAgICAgfCAgICAgMjNcbiAgICAvLyBQUkVGSVgtMTIzICAgfCAgIFBSRUZJWC0xMjM0ICAgfCAgICAgMTIzNFxuICAgIGdldFByZWZpeFN0cmlwcGVkVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSwgcHJlZml4LCBwcmVmaXhMZW5ndGgsIHByZXZSZXN1bHQsIGRlbGltaXRlciwgZGVsaW1pdGVycywgbm9JbW1lZGlhdGVQcmVmaXgsIHRhaWxQcmVmaXgsIHNpZ25CZWZvcmVQcmVmaXgpIHtcbiAgICAgICAgLy8gTm8gcHJlZml4XG4gICAgICAgIGlmIChwcmVmaXhMZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyBwcmVmaXhcbiAgICAgICAgaWYgKHZhbHVlID09PSBwcmVmaXggJiYgdmFsdWUgIT09ICcnKSB7XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNpZ25CZWZvcmVQcmVmaXggJiYgKHZhbHVlLnNsaWNlKDAsIDEpID09ICctJykpIHtcbiAgICAgICAgICAgIHZhciBwcmV2ID0gKHByZXZSZXN1bHQuc2xpY2UoMCwgMSkgPT0gJy0nKSA/IHByZXZSZXN1bHQuc2xpY2UoMSkgOiBwcmV2UmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuICctJyArIHRoaXMuZ2V0UHJlZml4U3RyaXBwZWRWYWx1ZSh2YWx1ZS5zbGljZSgxKSwgcHJlZml4LCBwcmVmaXhMZW5ndGgsIHByZXYsIGRlbGltaXRlciwgZGVsaW1pdGVycywgbm9JbW1lZGlhdGVQcmVmaXgsIHRhaWxQcmVmaXgsIHNpZ25CZWZvcmVQcmVmaXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJlIHJlc3VsdCBwcmVmaXggc3RyaW5nIGRvZXMgbm90IG1hdGNoIHByZS1kZWZpbmVkIHByZWZpeFxuICAgICAgICBpZiAocHJldlJlc3VsdC5zbGljZSgwLCBwcmVmaXhMZW5ndGgpICE9PSBwcmVmaXggJiYgIXRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBmaXJzdCB0aW1lIHVzZXIgZW50ZXJlZCBzb21ldGhpbmdcbiAgICAgICAgICAgIGlmIChub0ltbWVkaWF0ZVByZWZpeCAmJiAhcHJldlJlc3VsdCAmJiB2YWx1ZSkgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZSZXN1bHQuc2xpY2UoLXByZWZpeExlbmd0aCkgIT09IHByZWZpeCAmJiB0YWlsUHJlZml4KSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgZmlyc3QgdGltZSB1c2VyIGVudGVyZWQgc29tZXRoaW5nXG4gICAgICAgICAgICBpZiAobm9JbW1lZGlhdGVQcmVmaXggJiYgIXByZXZSZXN1bHQgJiYgdmFsdWUpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2VmFsdWUgPSB0aGlzLnN0cmlwRGVsaW1pdGVycyhwcmV2UmVzdWx0LCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpO1xuXG4gICAgICAgIC8vIE5ldyB2YWx1ZSBoYXMgaXNzdWUsIHNvbWVvbmUgdHlwZWQgaW4gYmV0d2VlbiBwcmVmaXggbGV0dGVyc1xuICAgICAgICAvLyBSZXZlcnQgdG8gcHJlIHZhbHVlXG4gICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBwcmVmaXhMZW5ndGgpICE9PSBwcmVmaXggJiYgIXRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2VmFsdWUuc2xpY2UocHJlZml4TGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5zbGljZSgtcHJlZml4TGVuZ3RoKSAhPT0gcHJlZml4ICYmIHRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2VmFsdWUuc2xpY2UoMCwgLXByZWZpeExlbmd0aCAtIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm8gaXNzdWUsIHN0cmlwIHByZWZpeCBmb3IgbmV3IHZhbHVlXG4gICAgICAgIHJldHVybiB0YWlsUHJlZml4ID8gdmFsdWUuc2xpY2UoMCwgLXByZWZpeExlbmd0aCkgOiB2YWx1ZS5zbGljZShwcmVmaXhMZW5ndGgpO1xuICAgIH0sXG5cbiAgICBnZXRGaXJzdERpZmZJbmRleDogZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcblxuICAgICAgICB3aGlsZSAocHJldi5jaGFyQXQoaW5kZXgpID09PSBjdXJyZW50LmNoYXJBdChpbmRleCkpIHtcbiAgICAgICAgICAgIGlmIChwcmV2LmNoYXJBdChpbmRleCsrKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSxcblxuICAgIGdldEZvcm1hdHRlZFZhbHVlOiBmdW5jdGlvbiAodmFsdWUsIGJsb2NrcywgYmxvY2tzTGVuZ3RoLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMsIGRlbGltaXRlckxhenlTaG93KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSAnJyxcbiAgICAgICAgICAgIG11bHRpcGxlRGVsaW1pdGVycyA9IGRlbGltaXRlcnMubGVuZ3RoID4gMCxcbiAgICAgICAgICAgIGN1cnJlbnREZWxpbWl0ZXIgPSAnJztcblxuICAgICAgICAvLyBubyBvcHRpb25zLCBub3JtYWwgaW5wdXRcbiAgICAgICAgaWYgKGJsb2Nrc0xlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgYmxvY2tzLmZvckVhY2goZnVuY3Rpb24gKGxlbmd0aCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YiA9IHZhbHVlLnNsaWNlKDAsIGxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIHJlc3QgPSB2YWx1ZS5zbGljZShsZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlRGVsaW1pdGVycykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RGVsaW1pdGVyID0gZGVsaW1pdGVyc1tkZWxpbWl0ZXJMYXp5U2hvdyA/IChpbmRleCAtIDEpIDogaW5kZXhdIHx8IGN1cnJlbnREZWxpbWl0ZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudERlbGltaXRlciA9IGRlbGltaXRlcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZGVsaW1pdGVyTGF6eVNob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGN1cnJlbnREZWxpbWl0ZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gc3ViO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdWI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Yi5sZW5ndGggPT09IGxlbmd0aCAmJiBpbmRleCA8IGJsb2Nrc0xlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjdXJyZW50RGVsaW1pdGVyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHJlbWFpbmluZyBzdHJpbmdcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1vdmUgY3Vyc29yIHRvIHRoZSBlbmRcbiAgICAvLyB0aGUgZmlyc3QgdGltZSB1c2VyIGZvY3VzZXMgb24gYW4gaW5wdXQgd2l0aCBwcmVmaXhcbiAgICBmaXhQcmVmaXhDdXJzb3I6IGZ1bmN0aW9uIChlbCwgcHJlZml4LCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpIHtcbiAgICAgICAgaWYgKCFlbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZhbCA9IGVsLnZhbHVlLFxuICAgICAgICAgICAgYXBwZW5kaXggPSBkZWxpbWl0ZXIgfHwgKGRlbGltaXRlcnNbMF0gfHwgJyAnKTtcblxuICAgICAgICBpZiAoIWVsLnNldFNlbGVjdGlvblJhbmdlIHx8ICFwcmVmaXggfHwgKHByZWZpeC5sZW5ndGggKyBhcHBlbmRpeC5sZW5ndGgpIDw9IHZhbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZW4gPSB2YWwubGVuZ3RoICogMjtcblxuICAgICAgICAvLyBzZXQgdGltZW91dCB0byBhdm9pZCBibGlua1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKGxlbiwgbGVuKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrIGlmIGlucHV0IGZpZWxkIGlzIGZ1bGx5IHNlbGVjdGVkXG4gICAgY2hlY2tGdWxsU2VsZWN0aW9uOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKSB8fCBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKSB8fCB7fTtcbiAgICAgICAgcmV0dXJuIHNlbGVjdGlvbi50b1N0cmluZygpLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgLy8gSWdub3JlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgc2V0U2VsZWN0aW9uOiBmdW5jdGlvbiAoZWxlbWVudCwgcG9zaXRpb24sIGRvYykge1xuICAgICAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5nZXRBY3RpdmVFbGVtZW50KGRvYykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGN1cnNvciBpcyBhbHJlYWR5IGluIHRoZSBlbmRcbiAgICAgICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC52YWx1ZS5sZW5ndGggPD0gcG9zaXRpb24pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudC5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IGVsZW1lbnQuY3JlYXRlVGV4dFJhbmdlKCk7XG5cbiAgICAgICAgICAgIHJhbmdlLm1vdmUoJ2NoYXJhY3RlcicsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHJhbmdlLnNlbGVjdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKHBvc2l0aW9uLCBwb3NpdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGUgaW5wdXQgZWxlbWVudCB0eXBlIGRvZXMgbm90IHN1cHBvcnQgc2VsZWN0aW9uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0QWN0aXZlRWxlbWVudDogZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICAgIHZhciBhY3RpdmVFbGVtZW50ID0gcGFyZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgIGlmIChhY3RpdmVFbGVtZW50ICYmIGFjdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWN0aXZlRWxlbWVudChhY3RpdmVFbGVtZW50LnNoYWRvd1Jvb3QpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3RpdmVFbGVtZW50O1xuICAgIH0sXG5cbiAgICBpc0FuZHJvaWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvciAmJiAvYW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgfSxcblxuICAgIC8vIE9uIEFuZHJvaWQgY2hyb21lLCB0aGUga2V5dXAgYW5kIGtleWRvd24gZXZlbnRzXG4gICAgLy8gYWx3YXlzIHJldHVybiBrZXkgY29kZSAyMjkgYXMgYSBjb21wb3NpdGlvbiB0aGF0XG4gICAgLy8gYnVmZmVycyB0aGUgdXNlclx1MjAxOXMga2V5c3Ryb2tlc1xuICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbm9zaXIvY2xlYXZlLmpzL2lzc3Vlcy8xNDdcbiAgICBpc0FuZHJvaWRCYWNrc3BhY2VLZXlkb3duOiBmdW5jdGlvbiAobGFzdElucHV0VmFsdWUsIGN1cnJlbnRJbnB1dFZhbHVlKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FuZHJvaWQoKSB8fCAhbGFzdElucHV0VmFsdWUgfHwgIWN1cnJlbnRJbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VycmVudElucHV0VmFsdWUgPT09IGxhc3RJbnB1dFZhbHVlLnNsaWNlKDAsIC0xKTtcbiAgICB9XG59O1xuXG52YXIgVXRpbF8xID0gVXRpbDtcblxuLyoqXG4gKiBQcm9wcyBBc3NpZ25tZW50XG4gKlxuICogU2VwYXJhdGUgdGhpcywgc28gcmVhY3QgbW9kdWxlIGNhbiBzaGFyZSB0aGUgdXNhZ2VcbiAqL1xudmFyIERlZmF1bHRQcm9wZXJ0aWVzID0ge1xuICAgIC8vIE1heWJlIGNoYW5nZSB0byBvYmplY3QtYXNzaWduXG4gICAgLy8gZm9yIG5vdyBqdXN0IGtlZXAgaXQgYXMgc2ltcGxlXG4gICAgYXNzaWduOiBmdW5jdGlvbiAodGFyZ2V0LCBvcHRzKSB7XG4gICAgICAgIHRhcmdldCA9IHRhcmdldCB8fCB7fTtcbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgLy8gY3JlZGl0IGNhcmRcbiAgICAgICAgdGFyZ2V0LmNyZWRpdENhcmQgPSAhIW9wdHMuY3JlZGl0Q2FyZDtcbiAgICAgICAgdGFyZ2V0LmNyZWRpdENhcmRTdHJpY3RNb2RlID0gISFvcHRzLmNyZWRpdENhcmRTdHJpY3RNb2RlO1xuICAgICAgICB0YXJnZXQuY3JlZGl0Q2FyZFR5cGUgPSAnJztcbiAgICAgICAgdGFyZ2V0Lm9uQ3JlZGl0Q2FyZFR5cGVDaGFuZ2VkID0gb3B0cy5vbkNyZWRpdENhcmRUeXBlQ2hhbmdlZCB8fCAoZnVuY3Rpb24gKCkge30pO1xuXG4gICAgICAgIC8vIHBob25lXG4gICAgICAgIHRhcmdldC5waG9uZSA9ICEhb3B0cy5waG9uZTtcbiAgICAgICAgdGFyZ2V0LnBob25lUmVnaW9uQ29kZSA9IG9wdHMucGhvbmVSZWdpb25Db2RlIHx8ICdBVSc7XG4gICAgICAgIHRhcmdldC5waG9uZUZvcm1hdHRlciA9IHt9O1xuXG4gICAgICAgIC8vIHRpbWVcbiAgICAgICAgdGFyZ2V0LnRpbWUgPSAhIW9wdHMudGltZTtcbiAgICAgICAgdGFyZ2V0LnRpbWVQYXR0ZXJuID0gb3B0cy50aW1lUGF0dGVybiB8fCBbJ2gnLCAnbScsICdzJ107XG4gICAgICAgIHRhcmdldC50aW1lRm9ybWF0ID0gb3B0cy50aW1lRm9ybWF0IHx8ICcyNCc7XG4gICAgICAgIHRhcmdldC50aW1lRm9ybWF0dGVyID0ge307XG5cbiAgICAgICAgLy8gZGF0ZVxuICAgICAgICB0YXJnZXQuZGF0ZSA9ICEhb3B0cy5kYXRlO1xuICAgICAgICB0YXJnZXQuZGF0ZVBhdHRlcm4gPSBvcHRzLmRhdGVQYXR0ZXJuIHx8IFsnZCcsICdtJywgJ1knXTtcbiAgICAgICAgdGFyZ2V0LmRhdGVNaW4gPSBvcHRzLmRhdGVNaW4gfHwgJyc7XG4gICAgICAgIHRhcmdldC5kYXRlTWF4ID0gb3B0cy5kYXRlTWF4IHx8ICcnO1xuICAgICAgICB0YXJnZXQuZGF0ZUZvcm1hdHRlciA9IHt9O1xuXG4gICAgICAgIC8vIG51bWVyYWxcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWwgPSAhIW9wdHMubnVtZXJhbDtcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWxJbnRlZ2VyU2NhbGUgPSBvcHRzLm51bWVyYWxJbnRlZ2VyU2NhbGUgPiAwID8gb3B0cy5udW1lcmFsSW50ZWdlclNjYWxlIDogMDtcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWxEZWNpbWFsU2NhbGUgPSBvcHRzLm51bWVyYWxEZWNpbWFsU2NhbGUgPj0gMCA/IG9wdHMubnVtZXJhbERlY2ltYWxTY2FsZSA6IDI7XG4gICAgICAgIHRhcmdldC5udW1lcmFsRGVjaW1hbE1hcmsgPSBvcHRzLm51bWVyYWxEZWNpbWFsTWFyayB8fCAnLic7XG4gICAgICAgIHRhcmdldC5udW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSA9IG9wdHMubnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUgfHwgJ3Rob3VzYW5kJztcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWxQb3NpdGl2ZU9ubHkgPSAhIW9wdHMubnVtZXJhbFBvc2l0aXZlT25seTtcbiAgICAgICAgdGFyZ2V0LnN0cmlwTGVhZGluZ1plcm9lcyA9IG9wdHMuc3RyaXBMZWFkaW5nWmVyb2VzICE9PSBmYWxzZTtcbiAgICAgICAgdGFyZ2V0LnNpZ25CZWZvcmVQcmVmaXggPSAhIW9wdHMuc2lnbkJlZm9yZVByZWZpeDtcbiAgICAgICAgdGFyZ2V0LnRhaWxQcmVmaXggPSAhIW9wdHMudGFpbFByZWZpeDtcblxuICAgICAgICAvLyBvdGhlcnNcbiAgICAgICAgdGFyZ2V0LnN3YXBIaWRkZW5JbnB1dCA9ICEhb3B0cy5zd2FwSGlkZGVuSW5wdXQ7XG4gICAgICAgIFxuICAgICAgICB0YXJnZXQubnVtZXJpY09ubHkgPSB0YXJnZXQuY3JlZGl0Q2FyZCB8fCB0YXJnZXQuZGF0ZSB8fCAhIW9wdHMubnVtZXJpY09ubHk7XG5cbiAgICAgICAgdGFyZ2V0LnVwcGVyY2FzZSA9ICEhb3B0cy51cHBlcmNhc2U7XG4gICAgICAgIHRhcmdldC5sb3dlcmNhc2UgPSAhIW9wdHMubG93ZXJjYXNlO1xuXG4gICAgICAgIHRhcmdldC5wcmVmaXggPSAodGFyZ2V0LmNyZWRpdENhcmQgfHwgdGFyZ2V0LmRhdGUpID8gJycgOiAob3B0cy5wcmVmaXggfHwgJycpO1xuICAgICAgICB0YXJnZXQubm9JbW1lZGlhdGVQcmVmaXggPSAhIW9wdHMubm9JbW1lZGlhdGVQcmVmaXg7XG4gICAgICAgIHRhcmdldC5wcmVmaXhMZW5ndGggPSB0YXJnZXQucHJlZml4Lmxlbmd0aDtcbiAgICAgICAgdGFyZ2V0LnJhd1ZhbHVlVHJpbVByZWZpeCA9ICEhb3B0cy5yYXdWYWx1ZVRyaW1QcmVmaXg7XG4gICAgICAgIHRhcmdldC5jb3B5RGVsaW1pdGVyID0gISFvcHRzLmNvcHlEZWxpbWl0ZXI7XG5cbiAgICAgICAgdGFyZ2V0LmluaXRWYWx1ZSA9IChvcHRzLmluaXRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuaW5pdFZhbHVlICE9PSBudWxsKSA/IG9wdHMuaW5pdFZhbHVlLnRvU3RyaW5nKCkgOiAnJztcblxuICAgICAgICB0YXJnZXQuZGVsaW1pdGVyID1cbiAgICAgICAgICAgIChvcHRzLmRlbGltaXRlciB8fCBvcHRzLmRlbGltaXRlciA9PT0gJycpID8gb3B0cy5kZWxpbWl0ZXIgOlxuICAgICAgICAgICAgICAgIChvcHRzLmRhdGUgPyAnLycgOlxuICAgICAgICAgICAgICAgICAgICAob3B0cy50aW1lID8gJzonIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChvcHRzLm51bWVyYWwgPyAnLCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvcHRzLnBob25lID8gJyAnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAnKSkpKTtcbiAgICAgICAgdGFyZ2V0LmRlbGltaXRlckxlbmd0aCA9IHRhcmdldC5kZWxpbWl0ZXIubGVuZ3RoO1xuICAgICAgICB0YXJnZXQuZGVsaW1pdGVyTGF6eVNob3cgPSAhIW9wdHMuZGVsaW1pdGVyTGF6eVNob3c7XG4gICAgICAgIHRhcmdldC5kZWxpbWl0ZXJzID0gb3B0cy5kZWxpbWl0ZXJzIHx8IFtdO1xuXG4gICAgICAgIHRhcmdldC5ibG9ja3MgPSBvcHRzLmJsb2NrcyB8fCBbXTtcbiAgICAgICAgdGFyZ2V0LmJsb2Nrc0xlbmd0aCA9IHRhcmdldC5ibG9ja3MubGVuZ3RoO1xuXG4gICAgICAgIHRhcmdldC5yb290ID0gKHR5cGVvZiBjb21tb25qc0dsb2JhbCA9PT0gJ29iamVjdCcgJiYgY29tbW9uanNHbG9iYWwpID8gY29tbW9uanNHbG9iYWwgOiB3aW5kb3c7XG4gICAgICAgIHRhcmdldC5kb2N1bWVudCA9IG9wdHMuZG9jdW1lbnQgfHwgdGFyZ2V0LnJvb3QuZG9jdW1lbnQ7XG5cbiAgICAgICAgdGFyZ2V0Lm1heExlbmd0aCA9IDA7XG5cbiAgICAgICAgdGFyZ2V0LmJhY2tzcGFjZSA9IGZhbHNlO1xuICAgICAgICB0YXJnZXQucmVzdWx0ID0gJyc7XG5cbiAgICAgICAgdGFyZ2V0Lm9uVmFsdWVDaGFuZ2VkID0gb3B0cy5vblZhbHVlQ2hhbmdlZCB8fCAoZnVuY3Rpb24gKCkge30pO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxufTtcblxudmFyIERlZmF1bHRQcm9wZXJ0aWVzXzEgPSBEZWZhdWx0UHJvcGVydGllcztcblxuLyoqXG4gKiBDb25zdHJ1Y3QgYSBuZXcgQ2xlYXZlIGluc3RhbmNlIGJ5IHBhc3NpbmcgdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKlxuICogQHBhcmFtIHtTdHJpbmcgfCBIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqL1xudmFyIENsZWF2ZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRzKSB7XG4gICAgdmFyIG93bmVyID0gdGhpcztcbiAgICB2YXIgaGFzTXVsdGlwbGVFbGVtZW50cyA9IGZhbHNlO1xuXG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICBvd25lci5lbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICAgICAgaGFzTXVsdGlwbGVFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCkubGVuZ3RoID4gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50Lmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgZWxlbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG93bmVyLmVsZW1lbnQgPSBlbGVtZW50WzBdO1xuICAgICAgICBoYXNNdWx0aXBsZUVsZW1lbnRzID0gZWxlbWVudC5sZW5ndGggPiAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3duZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFvd25lci5lbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW2NsZWF2ZS5qc10gUGxlYXNlIGNoZWNrIHRoZSBlbGVtZW50Jyk7XG4gICAgfVxuXG4gICAgaWYgKGhhc011bHRpcGxlRWxlbWVudHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICBjb25zb2xlLndhcm4oJ1tjbGVhdmUuanNdIE11bHRpcGxlIGlucHV0IGZpZWxkcyBtYXRjaGVkLCBjbGVhdmUuanMgd2lsbCBvbmx5IHRha2UgdGhlIGZpcnN0IG9uZS4nKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gT2xkIElFXG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0cy5pbml0VmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlO1xuXG4gICAgb3duZXIucHJvcGVydGllcyA9IENsZWF2ZS5EZWZhdWx0UHJvcGVydGllcy5hc3NpZ24oe30sIG9wdHMpO1xuXG4gICAgb3duZXIuaW5pdCgpO1xufTtcblxuQ2xlYXZlLnByb3RvdHlwZSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgLy8gbm8gbmVlZCB0byB1c2UgdGhpcyBsaWJcbiAgICAgICAgaWYgKCFwcHMubnVtZXJhbCAmJiAhcHBzLnBob25lICYmICFwcHMuY3JlZGl0Q2FyZCAmJiAhcHBzLnRpbWUgJiYgIXBwcy5kYXRlICYmIChwcHMuYmxvY2tzTGVuZ3RoID09PSAwICYmICFwcHMucHJlZml4KSkge1xuICAgICAgICAgICAgb3duZXIub25JbnB1dChwcHMuaW5pdFZhbHVlKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcHBzLm1heExlbmd0aCA9IENsZWF2ZS5VdGlsLmdldE1heExlbmd0aChwcHMuYmxvY2tzKTtcblxuICAgICAgICBvd25lci5pc0FuZHJvaWQgPSBDbGVhdmUuVXRpbC5pc0FuZHJvaWQoKTtcbiAgICAgICAgb3duZXIubGFzdElucHV0VmFsdWUgPSAnJztcbiAgICAgICAgb3duZXIuaXNCYWNrd2FyZCA9ICcnO1xuXG4gICAgICAgIG93bmVyLm9uQ2hhbmdlTGlzdGVuZXIgPSBvd25lci5vbkNoYW5nZS5iaW5kKG93bmVyKTtcbiAgICAgICAgb3duZXIub25LZXlEb3duTGlzdGVuZXIgPSBvd25lci5vbktleURvd24uYmluZChvd25lcik7XG4gICAgICAgIG93bmVyLm9uRm9jdXNMaXN0ZW5lciA9IG93bmVyLm9uRm9jdXMuYmluZChvd25lcik7XG4gICAgICAgIG93bmVyLm9uQ3V0TGlzdGVuZXIgPSBvd25lci5vbkN1dC5iaW5kKG93bmVyKTtcbiAgICAgICAgb3duZXIub25Db3B5TGlzdGVuZXIgPSBvd25lci5vbkNvcHkuYmluZChvd25lcik7XG5cbiAgICAgICAgb3duZXIuaW5pdFN3YXBIaWRkZW5JbnB1dCgpO1xuXG4gICAgICAgIG93bmVyLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBvd25lci5vbkNoYW5nZUxpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb3duZXIub25LZXlEb3duTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgb3duZXIub25Gb2N1c0xpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjdXQnLCBvd25lci5vbkN1dExpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjb3B5Jywgb3duZXIub25Db3B5TGlzdGVuZXIpO1xuXG5cbiAgICAgICAgb3duZXIuaW5pdFBob25lRm9ybWF0dGVyKCk7XG4gICAgICAgIG93bmVyLmluaXREYXRlRm9ybWF0dGVyKCk7XG4gICAgICAgIG93bmVyLmluaXRUaW1lRm9ybWF0dGVyKCk7XG4gICAgICAgIG93bmVyLmluaXROdW1lcmFsRm9ybWF0dGVyKCk7XG5cbiAgICAgICAgLy8gYXZvaWQgdG91Y2ggaW5wdXQgZmllbGQgaWYgdmFsdWUgaXMgbnVsbFxuICAgICAgICAvLyBvdGhlcndpc2UgRmlyZWZveCB3aWxsIGFkZCByZWQgYm94LXNoYWRvdyBmb3IgPGlucHV0IHJlcXVpcmVkIC8+XG4gICAgICAgIGlmIChwcHMuaW5pdFZhbHVlIHx8IChwcHMucHJlZml4ICYmICFwcHMubm9JbW1lZGlhdGVQcmVmaXgpKSB7XG4gICAgICAgICAgICBvd25lci5vbklucHV0KHBwcy5pbml0VmFsdWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRTd2FwSGlkZGVuSW5wdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcbiAgICAgICAgaWYgKCFwcHMuc3dhcEhpZGRlbklucHV0KSByZXR1cm47XG5cbiAgICAgICAgdmFyIGlucHV0Rm9ybWF0dGVyID0gb3duZXIuZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIG93bmVyLmVsZW1lbnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaW5wdXRGb3JtYXR0ZXIsIG93bmVyLmVsZW1lbnQpO1xuXG4gICAgICAgIG93bmVyLmVsZW1lbnRTd2FwSGlkZGVuID0gb3duZXIuZWxlbWVudDtcbiAgICAgICAgb3duZXIuZWxlbWVudFN3YXBIaWRkZW4udHlwZSA9ICdoaWRkZW4nO1xuXG4gICAgICAgIG93bmVyLmVsZW1lbnQgPSBpbnB1dEZvcm1hdHRlcjtcbiAgICAgICAgb3duZXIuZWxlbWVudC5pZCA9ICcnO1xuICAgIH0sXG5cbiAgICBpbml0TnVtZXJhbEZvcm1hdHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghcHBzLm51bWVyYWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBwcy5udW1lcmFsRm9ybWF0dGVyID0gbmV3IENsZWF2ZS5OdW1lcmFsRm9ybWF0dGVyKFxuICAgICAgICAgICAgcHBzLm51bWVyYWxEZWNpbWFsTWFyayxcbiAgICAgICAgICAgIHBwcy5udW1lcmFsSW50ZWdlclNjYWxlLFxuICAgICAgICAgICAgcHBzLm51bWVyYWxEZWNpbWFsU2NhbGUsXG4gICAgICAgICAgICBwcHMubnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUsXG4gICAgICAgICAgICBwcHMubnVtZXJhbFBvc2l0aXZlT25seSxcbiAgICAgICAgICAgIHBwcy5zdHJpcExlYWRpbmdaZXJvZXMsXG4gICAgICAgICAgICBwcHMucHJlZml4LFxuICAgICAgICAgICAgcHBzLnNpZ25CZWZvcmVQcmVmaXgsXG4gICAgICAgICAgICBwcHMudGFpbFByZWZpeCxcbiAgICAgICAgICAgIHBwcy5kZWxpbWl0ZXJcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgaW5pdFRpbWVGb3JtYXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghcHBzLnRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBwcy50aW1lRm9ybWF0dGVyID0gbmV3IENsZWF2ZS5UaW1lRm9ybWF0dGVyKHBwcy50aW1lUGF0dGVybiwgcHBzLnRpbWVGb3JtYXQpO1xuICAgICAgICBwcHMuYmxvY2tzID0gcHBzLnRpbWVGb3JtYXR0ZXIuZ2V0QmxvY2tzKCk7XG4gICAgICAgIHBwcy5ibG9ja3NMZW5ndGggPSBwcHMuYmxvY2tzLmxlbmd0aDtcbiAgICAgICAgcHBzLm1heExlbmd0aCA9IENsZWF2ZS5VdGlsLmdldE1heExlbmd0aChwcHMuYmxvY2tzKTtcbiAgICB9LFxuXG4gICAgaW5pdERhdGVGb3JtYXR0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBpZiAoIXBwcy5kYXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcHMuZGF0ZUZvcm1hdHRlciA9IG5ldyBDbGVhdmUuRGF0ZUZvcm1hdHRlcihwcHMuZGF0ZVBhdHRlcm4sIHBwcy5kYXRlTWluLCBwcHMuZGF0ZU1heCk7XG4gICAgICAgIHBwcy5ibG9ja3MgPSBwcHMuZGF0ZUZvcm1hdHRlci5nZXRCbG9ja3MoKTtcbiAgICAgICAgcHBzLmJsb2Nrc0xlbmd0aCA9IHBwcy5ibG9ja3MubGVuZ3RoO1xuICAgICAgICBwcHMubWF4TGVuZ3RoID0gQ2xlYXZlLlV0aWwuZ2V0TWF4TGVuZ3RoKHBwcy5ibG9ja3MpO1xuICAgIH0sXG5cbiAgICBpbml0UGhvbmVGb3JtYXR0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBpZiAoIXBwcy5waG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXZlLkFzWW91VHlwZUZvcm1hdHRlciBzaG91bGQgYmUgcHJvdmlkZWQgYnlcbiAgICAgICAgLy8gZXh0ZXJuYWwgZ29vZ2xlIGNsb3N1cmUgbGliXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcHMucGhvbmVGb3JtYXR0ZXIgPSBuZXcgQ2xlYXZlLlBob25lRm9ybWF0dGVyKFxuICAgICAgICAgICAgICAgIG5ldyBwcHMucm9vdC5DbGVhdmUuQXNZb3VUeXBlRm9ybWF0dGVyKHBwcy5waG9uZVJlZ2lvbkNvZGUpLFxuICAgICAgICAgICAgICAgIHBwcy5kZWxpbWl0ZXJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tjbGVhdmUuanNdIFBsZWFzZSBpbmNsdWRlIHBob25lLXR5cGUtZm9ybWF0dGVyLntjb3VudHJ5fS5qcyBsaWInKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbktleURvd246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgY2hhckNvZGUgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuXG4gICAgICAgIG93bmVyLmxhc3RJbnB1dFZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZTtcbiAgICAgICAgb3duZXIuaXNCYWNrd2FyZCA9IGNoYXJDb2RlID09PSA4O1xuICAgIH0sXG5cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWw7XG5cbiAgICAgICAgb3duZXIuaXNCYWNrd2FyZCA9IG93bmVyLmlzQmFja3dhcmQgfHwgZXZlbnQuaW5wdXRUeXBlID09PSAnZGVsZXRlQ29udGVudEJhY2t3YXJkJztcblxuICAgICAgICB2YXIgcG9zdERlbGltaXRlciA9IFV0aWwuZ2V0UG9zdERlbGltaXRlcihvd25lci5sYXN0SW5wdXRWYWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuXG4gICAgICAgIGlmIChvd25lci5pc0JhY2t3YXJkICYmIHBvc3REZWxpbWl0ZXIpIHtcbiAgICAgICAgICAgIHBwcy5wb3N0RGVsaW1pdGVyQmFja3NwYWNlID0gcG9zdERlbGltaXRlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBwcy5wb3N0RGVsaW1pdGVyQmFja3NwYWNlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9uSW5wdXQodGhpcy5lbGVtZW50LnZhbHVlKTtcbiAgICB9LFxuXG4gICAgb25Gb2N1czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcztcbiAgICAgICAgb3duZXIubGFzdElucHV0VmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlO1xuXG4gICAgICAgIGlmIChwcHMucHJlZml4ICYmIHBwcy5ub0ltbWVkaWF0ZVByZWZpeCAmJiAhb3duZXIuZWxlbWVudC52YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5vbklucHV0KHBwcy5wcmVmaXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgQ2xlYXZlLlV0aWwuZml4UHJlZml4Q3Vyc29yKG93bmVyLmVsZW1lbnQsIHBwcy5wcmVmaXgsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcbiAgICB9LFxuXG4gICAgb25DdXQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghQ2xlYXZlLlV0aWwuY2hlY2tGdWxsU2VsZWN0aW9uKHRoaXMuZWxlbWVudC52YWx1ZSkpIHJldHVybjtcbiAgICAgICAgdGhpcy5jb3B5Q2xpcGJvYXJkRGF0YShlKTtcbiAgICAgICAgdGhpcy5vbklucHV0KCcnKTtcbiAgICB9LFxuXG4gICAgb25Db3B5OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIUNsZWF2ZS5VdGlsLmNoZWNrRnVsbFNlbGVjdGlvbih0aGlzLmVsZW1lbnQudmFsdWUpKSByZXR1cm47XG4gICAgICAgIHRoaXMuY29weUNsaXBib2FyZERhdGEoZSk7XG4gICAgfSxcblxuICAgIGNvcHlDbGlwYm9hcmREYXRhOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbCxcbiAgICAgICAgICAgIGlucHV0VmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlLFxuICAgICAgICAgICAgdGV4dFRvQ29weSA9ICcnO1xuXG4gICAgICAgIGlmICghcHBzLmNvcHlEZWxpbWl0ZXIpIHtcbiAgICAgICAgICAgIHRleHRUb0NvcHkgPSBVdGlsLnN0cmlwRGVsaW1pdGVycyhpbnB1dFZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZXh0VG9Db3B5ID0gaW5wdXRWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZS5jbGlwYm9hcmREYXRhKSB7XG4gICAgICAgICAgICAgICAgZS5jbGlwYm9hcmREYXRhLnNldERhdGEoJ1RleHQnLCB0ZXh0VG9Db3B5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YSgnVGV4dCcsIHRleHRUb0NvcHkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAvLyAgZW1wdHlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbklucHV0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbDtcblxuICAgICAgICAvLyBjYXNlIDE6IGRlbGV0ZSBvbmUgbW9yZSBjaGFyYWN0ZXIgXCI0XCJcbiAgICAgICAgLy8gMTIzNCp8IC0+IGhpdCBiYWNrc3BhY2UgLT4gMTIzfFxuICAgICAgICAvLyBjYXNlIDI6IGxhc3QgY2hhcmFjdGVyIGlzIG5vdCBkZWxpbWl0ZXIgd2hpY2ggaXM6XG4gICAgICAgIC8vIDEyfDM0KiAtPiBoaXQgYmFja3NwYWNlIC0+IDF8MzQqXG4gICAgICAgIC8vIG5vdGU6IG5vIG5lZWQgdG8gYXBwbHkgdGhpcyBmb3IgbnVtZXJhbCBtb2RlXG4gICAgICAgIHZhciBwb3N0RGVsaW1pdGVyQWZ0ZXIgPSBVdGlsLmdldFBvc3REZWxpbWl0ZXIodmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcbiAgICAgICAgaWYgKCFwcHMubnVtZXJhbCAmJiBwcHMucG9zdERlbGltaXRlckJhY2tzcGFjZSAmJiAhcG9zdERlbGltaXRlckFmdGVyKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IFV0aWwuaGVhZFN0cih2YWx1ZSwgdmFsdWUubGVuZ3RoIC0gcHBzLnBvc3REZWxpbWl0ZXJCYWNrc3BhY2UubGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBob25lIGZvcm1hdHRlclxuICAgICAgICBpZiAocHBzLnBob25lKSB7XG4gICAgICAgICAgICBpZiAocHBzLnByZWZpeCAmJiAoIXBwcy5ub0ltbWVkaWF0ZVByZWZpeCB8fCB2YWx1ZS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgcHBzLnJlc3VsdCA9IHBwcy5wcmVmaXggKyBwcHMucGhvbmVGb3JtYXR0ZXIuZm9ybWF0KHZhbHVlKS5zbGljZShwcHMucHJlZml4Lmxlbmd0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBwcy5yZXN1bHQgPSBwcHMucGhvbmVGb3JtYXR0ZXIuZm9ybWF0KHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG93bmVyLnVwZGF0ZVZhbHVlU3RhdGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbnVtZXJhbCBmb3JtYXR0ZXJcbiAgICAgICAgaWYgKHBwcy5udW1lcmFsKSB7XG4gICAgICAgICAgICAvLyBEbyBub3Qgc2hvdyBwcmVmaXggd2hlbiBub0ltbWVkaWF0ZVByZWZpeCBpcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIC8vIFRoaXMgbW9zdGx5IGJlY2F1c2Ugd2UgbmVlZCB0byBzaG93IHVzZXIgdGhlIG5hdGl2ZSBpbnB1dCBwbGFjZWhvbGRlclxuICAgICAgICAgICAgaWYgKHBwcy5wcmVmaXggJiYgcHBzLm5vSW1tZWRpYXRlUHJlZml4ICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBwcy5yZXN1bHQgPSAnJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHBzLnJlc3VsdCA9IHBwcy5udW1lcmFsRm9ybWF0dGVyLmZvcm1hdCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvd25lci51cGRhdGVWYWx1ZVN0YXRlKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRhdGVcbiAgICAgICAgaWYgKHBwcy5kYXRlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHBwcy5kYXRlRm9ybWF0dGVyLmdldFZhbGlkYXRlZERhdGUodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGltZVxuICAgICAgICBpZiAocHBzLnRpbWUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcHBzLnRpbWVGb3JtYXR0ZXIuZ2V0VmFsaWRhdGVkVGltZSh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdHJpcCBkZWxpbWl0ZXJzXG4gICAgICAgIHZhbHVlID0gVXRpbC5zdHJpcERlbGltaXRlcnModmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcblxuICAgICAgICAvLyBzdHJpcCBwcmVmaXhcbiAgICAgICAgdmFsdWUgPSBVdGlsLmdldFByZWZpeFN0cmlwcGVkVmFsdWUodmFsdWUsIHBwcy5wcmVmaXgsIHBwcy5wcmVmaXhMZW5ndGgsIHBwcy5yZXN1bHQsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzLCBwcHMubm9JbW1lZGlhdGVQcmVmaXgsIHBwcy50YWlsUHJlZml4LCBwcHMuc2lnbkJlZm9yZVByZWZpeCk7XG5cbiAgICAgICAgLy8gc3RyaXAgbm9uLW51bWVyaWMgY2hhcmFjdGVyc1xuICAgICAgICB2YWx1ZSA9IHBwcy5udW1lcmljT25seSA/IFV0aWwuc3RyaXAodmFsdWUsIC9bXlxcZF0vZykgOiB2YWx1ZTtcblxuICAgICAgICAvLyBjb252ZXJ0IGNhc2VcbiAgICAgICAgdmFsdWUgPSBwcHMudXBwZXJjYXNlID8gdmFsdWUudG9VcHBlckNhc2UoKSA6IHZhbHVlO1xuICAgICAgICB2YWx1ZSA9IHBwcy5sb3dlcmNhc2UgPyB2YWx1ZS50b0xvd2VyQ2FzZSgpIDogdmFsdWU7XG5cbiAgICAgICAgLy8gcHJldmVudCBmcm9tIHNob3dpbmcgcHJlZml4IHdoZW4gbm8gaW1tZWRpYXRlIG9wdGlvbiBlbmFibGVkIHdpdGggZW1wdHkgaW5wdXQgdmFsdWVcbiAgICAgICAgaWYgKHBwcy5wcmVmaXgpIHtcbiAgICAgICAgICAgIGlmIChwcHMudGFpbFByZWZpeCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBwcHMucHJlZml4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBwcy5wcmVmaXggKyB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBubyBibG9ja3Mgc3BlY2lmaWVkLCBubyBuZWVkIHRvIGRvIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGlmIChwcHMuYmxvY2tzTGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcHBzLnJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIG93bmVyLnVwZGF0ZVZhbHVlU3RhdGUoKTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBjcmVkaXQgY2FyZCBwcm9wc1xuICAgICAgICBpZiAocHBzLmNyZWRpdENhcmQpIHtcbiAgICAgICAgICAgIG93bmVyLnVwZGF0ZUNyZWRpdENhcmRQcm9wc0J5VmFsdWUodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RyaXAgb3ZlciBsZW5ndGggY2hhcmFjdGVyc1xuICAgICAgICB2YWx1ZSA9IFV0aWwuaGVhZFN0cih2YWx1ZSwgcHBzLm1heExlbmd0aCk7XG5cbiAgICAgICAgLy8gYXBwbHkgYmxvY2tzXG4gICAgICAgIHBwcy5yZXN1bHQgPSBVdGlsLmdldEZvcm1hdHRlZFZhbHVlKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBwcHMuYmxvY2tzLCBwcHMuYmxvY2tzTGVuZ3RoLFxuICAgICAgICAgICAgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMsIHBwcy5kZWxpbWl0ZXJMYXp5U2hvd1xuICAgICAgICApO1xuXG4gICAgICAgIG93bmVyLnVwZGF0ZVZhbHVlU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQ3JlZGl0Q2FyZFByb3BzQnlWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWwsXG4gICAgICAgICAgICBjcmVkaXRDYXJkSW5mbztcblxuICAgICAgICAvLyBBdCBsZWFzdCBvbmUgb2YgdGhlIGZpcnN0IDQgY2hhcmFjdGVycyBoYXMgY2hhbmdlZFxuICAgICAgICBpZiAoVXRpbC5oZWFkU3RyKHBwcy5yZXN1bHQsIDQpID09PSBVdGlsLmhlYWRTdHIodmFsdWUsIDQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjcmVkaXRDYXJkSW5mbyA9IENsZWF2ZS5DcmVkaXRDYXJkRGV0ZWN0b3IuZ2V0SW5mbyh2YWx1ZSwgcHBzLmNyZWRpdENhcmRTdHJpY3RNb2RlKTtcblxuICAgICAgICBwcHMuYmxvY2tzID0gY3JlZGl0Q2FyZEluZm8uYmxvY2tzO1xuICAgICAgICBwcHMuYmxvY2tzTGVuZ3RoID0gcHBzLmJsb2Nrcy5sZW5ndGg7XG4gICAgICAgIHBwcy5tYXhMZW5ndGggPSBVdGlsLmdldE1heExlbmd0aChwcHMuYmxvY2tzKTtcblxuICAgICAgICAvLyBjcmVkaXQgY2FyZCB0eXBlIGNoYW5nZWRcbiAgICAgICAgaWYgKHBwcy5jcmVkaXRDYXJkVHlwZSAhPT0gY3JlZGl0Q2FyZEluZm8udHlwZSkge1xuICAgICAgICAgICAgcHBzLmNyZWRpdENhcmRUeXBlID0gY3JlZGl0Q2FyZEluZm8udHlwZTtcblxuICAgICAgICAgICAgcHBzLm9uQ3JlZGl0Q2FyZFR5cGVDaGFuZ2VkLmNhbGwob3duZXIsIHBwcy5jcmVkaXRDYXJkVHlwZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBkYXRlVmFsdWVTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBpZiAoIW93bmVyLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbmRQb3MgPSBvd25lci5lbGVtZW50LnNlbGVjdGlvbkVuZDtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZTtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0gcHBzLnJlc3VsdDtcblxuICAgICAgICBlbmRQb3MgPSBVdGlsLmdldE5leHRDdXJzb3JQb3NpdGlvbihlbmRQb3MsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuXG4gICAgICAgIC8vIGZpeCBBbmRyb2lkIGJyb3dzZXIgdHlwZT1cInRleHRcIiBpbnB1dCBmaWVsZFxuICAgICAgICAvLyBjdXJzb3Igbm90IGp1bXBpbmcgaXNzdWVcbiAgICAgICAgaWYgKG93bmVyLmlzQW5kcm9pZCkge1xuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG93bmVyLmVsZW1lbnQudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBVdGlsLnNldFNlbGVjdGlvbihvd25lci5lbGVtZW50LCBlbmRQb3MsIHBwcy5kb2N1bWVudCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIG93bmVyLmNhbGxPblZhbHVlQ2hhbmdlZCgpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG93bmVyLmVsZW1lbnQudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgaWYgKHBwcy5zd2FwSGlkZGVuSW5wdXQpIG93bmVyLmVsZW1lbnRTd2FwSGlkZGVuLnZhbHVlID0gb3duZXIuZ2V0UmF3VmFsdWUoKTtcblxuICAgICAgICBVdGlsLnNldFNlbGVjdGlvbihvd25lci5lbGVtZW50LCBlbmRQb3MsIHBwcy5kb2N1bWVudCwgZmFsc2UpO1xuICAgICAgICBvd25lci5jYWxsT25WYWx1ZUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgY2FsbE9uVmFsdWVDaGFuZ2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHBwcy5vblZhbHVlQ2hhbmdlZC5jYWxsKG93bmVyLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvd25lci5lbGVtZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHBwcy5yZXN1bHQsXG4gICAgICAgICAgICAgICAgcmF3VmFsdWU6IG93bmVyLmdldFJhd1ZhbHVlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNldFBob25lUmVnaW9uQ29kZTogZnVuY3Rpb24gKHBob25lUmVnaW9uQ29kZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHBwcy5waG9uZVJlZ2lvbkNvZGUgPSBwaG9uZVJlZ2lvbkNvZGU7XG4gICAgICAgIG93bmVyLmluaXRQaG9uZUZvcm1hdHRlcigpO1xuICAgICAgICBvd25lci5vbkNoYW5nZSgpO1xuICAgIH0sXG5cbiAgICBzZXRSYXdWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsID8gdmFsdWUudG9TdHJpbmcoKSA6ICcnO1xuXG4gICAgICAgIGlmIChwcHMubnVtZXJhbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKCcuJywgcHBzLm51bWVyYWxEZWNpbWFsTWFyayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcHMucG9zdERlbGltaXRlckJhY2tzcGFjZSA9IGZhbHNlO1xuXG4gICAgICAgIG93bmVyLmVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgb3duZXIub25JbnB1dCh2YWx1ZSk7XG4gICAgfSxcblxuICAgIGdldFJhd1ZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsLFxuICAgICAgICAgICAgcmF3VmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlO1xuXG4gICAgICAgIGlmIChwcHMucmF3VmFsdWVUcmltUHJlZml4KSB7XG4gICAgICAgICAgICByYXdWYWx1ZSA9IFV0aWwuZ2V0UHJlZml4U3RyaXBwZWRWYWx1ZShyYXdWYWx1ZSwgcHBzLnByZWZpeCwgcHBzLnByZWZpeExlbmd0aCwgcHBzLnJlc3VsdCwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMsIHBwcy5ub0ltbWVkaWF0ZVByZWZpeCwgcHBzLnRhaWxQcmVmaXgsIHBwcy5zaWduQmVmb3JlUHJlZml4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcHMubnVtZXJhbCkge1xuICAgICAgICAgICAgcmF3VmFsdWUgPSBwcHMubnVtZXJhbEZvcm1hdHRlci5nZXRSYXdWYWx1ZShyYXdWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByYXdWYWx1ZSA9IFV0aWwuc3RyaXBEZWxpbWl0ZXJzKHJhd1ZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmF3VmFsdWU7XG4gICAgfSxcblxuICAgIGdldElTT0Zvcm1hdERhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgcmV0dXJuIHBwcy5kYXRlID8gcHBzLmRhdGVGb3JtYXR0ZXIuZ2V0SVNPRm9ybWF0RGF0ZSgpIDogJyc7XG4gICAgfSxcblxuICAgIGdldElTT0Zvcm1hdFRpbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgcmV0dXJuIHBwcy50aW1lID8gcHBzLnRpbWVGb3JtYXR0ZXIuZ2V0SVNPRm9ybWF0VGltZSgpIDogJyc7XG4gICAgfSxcblxuICAgIGdldEZvcm1hdHRlZFZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgICAgICBvd25lci5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2lucHV0Jywgb3duZXIub25DaGFuZ2VMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG93bmVyLm9uS2V5RG93bkxpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIG93bmVyLm9uRm9jdXNMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY3V0Jywgb3duZXIub25DdXRMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29weScsIG93bmVyLm9uQ29weUxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICdbQ2xlYXZlIE9iamVjdF0nO1xuICAgIH1cbn07XG5cbkNsZWF2ZS5OdW1lcmFsRm9ybWF0dGVyID0gTnVtZXJhbEZvcm1hdHRlcl8xO1xuQ2xlYXZlLkRhdGVGb3JtYXR0ZXIgPSBEYXRlRm9ybWF0dGVyXzE7XG5DbGVhdmUuVGltZUZvcm1hdHRlciA9IFRpbWVGb3JtYXR0ZXJfMTtcbkNsZWF2ZS5QaG9uZUZvcm1hdHRlciA9IFBob25lRm9ybWF0dGVyXzE7XG5DbGVhdmUuQ3JlZGl0Q2FyZERldGVjdG9yID0gQ3JlZGl0Q2FyZERldGVjdG9yXzE7XG5DbGVhdmUuVXRpbCA9IFV0aWxfMTtcbkNsZWF2ZS5EZWZhdWx0UHJvcGVydGllcyA9IERlZmF1bHRQcm9wZXJ0aWVzXzE7XG5cbi8vIGZvciBhbmd1bGFyIGRpcmVjdGl2ZVxuKCh0eXBlb2YgY29tbW9uanNHbG9iYWwgPT09ICdvYmplY3QnICYmIGNvbW1vbmpzR2xvYmFsKSA/IGNvbW1vbmpzR2xvYmFsIDogd2luZG93KVsnQ2xlYXZlJ10gPSBDbGVhdmU7XG5cbi8vIENvbW1vbkpTXG52YXIgQ2xlYXZlXzEgPSBDbGVhdmU7XG5cbmV4cG9ydCBkZWZhdWx0IENsZWF2ZV8xO1xuIiwgIiFmdW5jdGlvbigpe2Z1bmN0aW9uIG4obix0KXt2YXIgZT1uLnNwbGl0KFwiLlwiKSxsPVU7ZVswXWluIGx8fCFsLmV4ZWNTY3JpcHR8fGwuZXhlY1NjcmlwdChcInZhciBcIitlWzBdKTtmb3IodmFyIHI7ZS5sZW5ndGgmJihyPWUuc2hpZnQoKSk7KWUubGVuZ3RofHx2b2lkIDA9PT10P2w9bFtyXT9sW3JdOmxbcl09e306bFtyXT10fWZ1bmN0aW9uIHQobix0KXtmdW5jdGlvbiBlKCl7fWUucHJvdG90eXBlPXQucHJvdG90eXBlLG4uTT10LnByb3RvdHlwZSxuLnByb3RvdHlwZT1uZXcgZSxuLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcj1uLG4uTj1mdW5jdGlvbihuLGUsbCl7Zm9yKHZhciByPUFycmF5KGFyZ3VtZW50cy5sZW5ndGgtMiksaT0yO2k8YXJndW1lbnRzLmxlbmd0aDtpKyspcltpLTJdPWFyZ3VtZW50c1tpXTtyZXR1cm4gdC5wcm90b3R5cGVbZV0uYXBwbHkobixyKX19ZnVuY3Rpb24gZShuLHQpe251bGwhPW4mJnRoaXMuYS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9ZnVuY3Rpb24gbChuKXtuLmI9XCJcIn1mdW5jdGlvbiByKG4sdCl7bi5zb3J0KHR8fGkpfWZ1bmN0aW9uIGkobix0KXtyZXR1cm4gbj50PzE6bjx0Py0xOjB9ZnVuY3Rpb24gdShuKXt2YXIgdCxlPVtdLGw9MDtmb3IodCBpbiBuKWVbbCsrXT1uW3RdO3JldHVybiBlfWZ1bmN0aW9uIGEobix0KXt0aGlzLmI9bix0aGlzLmE9e307Zm9yKHZhciBlPTA7ZTx0Lmxlbmd0aDtlKyspe3ZhciBsPXRbZV07dGhpcy5hW2wuYl09bH19ZnVuY3Rpb24gbyhuKXtyZXR1cm4gbj11KG4uYSkscihuLGZ1bmN0aW9uKG4sdCl7cmV0dXJuIG4uYi10LmJ9KSxufWZ1bmN0aW9uIHMobix0KXtzd2l0Y2godGhpcy5iPW4sdGhpcy5nPSEhdC52LHRoaXMuYT10LmMsdGhpcy5pPXQudHlwZSx0aGlzLmg9ITEsdGhpcy5hKXtjYXNlIEo6Y2FzZSBLOmNhc2UgTDpjYXNlIE86Y2FzZSBaOmNhc2UgazpjYXNlIFk6dGhpcy5oPSEwfXRoaXMuZj10LmRlZmF1bHRWYWx1ZX1mdW5jdGlvbiBmKCl7dGhpcy5hPXt9LHRoaXMuZj10aGlzLmooKS5hLHRoaXMuYj10aGlzLmc9bnVsbH1mdW5jdGlvbiBwKG4sdCl7Zm9yKHZhciBlPW8obi5qKCkpLGw9MDtsPGUubGVuZ3RoO2wrKyl7dmFyIHI9ZVtsXSxpPXIuYjtpZihudWxsIT10LmFbaV0pe24uYiYmZGVsZXRlIG4uYltyLmJdO3ZhciB1PTExPT1yLmF8fDEwPT1yLmE7aWYoci5nKWZvcih2YXIgcj1jKHQsaSl8fFtdLGE9MDthPHIubGVuZ3RoO2ErKyl7dmFyIHM9bixmPWksaD11P3JbYV0uY2xvbmUoKTpyW2FdO3MuYVtmXXx8KHMuYVtmXT1bXSkscy5hW2ZdLnB1c2goaCkscy5iJiZkZWxldGUgcy5iW2ZdfWVsc2Ugcj1jKHQsaSksdT8odT1jKG4saSkpP3AodSxyKTptKG4saSxyLmNsb25lKCkpOm0obixpLHIpfX19ZnVuY3Rpb24gYyhuLHQpe3ZhciBlPW4uYVt0XTtpZihudWxsPT1lKXJldHVybiBudWxsO2lmKG4uZyl7aWYoISh0IGluIG4uYikpe3ZhciBsPW4uZyxyPW4uZlt0XTtpZihudWxsIT1lKWlmKHIuZyl7Zm9yKHZhciBpPVtdLHU9MDt1PGUubGVuZ3RoO3UrKylpW3VdPWwuYihyLGVbdV0pO2U9aX1lbHNlIGU9bC5iKHIsZSk7cmV0dXJuIG4uYlt0XT1lfXJldHVybiBuLmJbdF19cmV0dXJuIGV9ZnVuY3Rpb24gaChuLHQsZSl7dmFyIGw9YyhuLHQpO3JldHVybiBuLmZbdF0uZz9sW2V8fDBdOmx9ZnVuY3Rpb24gZyhuLHQpe3ZhciBlO2lmKG51bGwhPW4uYVt0XSllPWgobix0LHZvaWQgMCk7ZWxzZSBuOntpZihlPW4uZlt0XSx2b2lkIDA9PT1lLmYpe3ZhciBsPWUuaTtpZihsPT09Qm9vbGVhbillLmY9ITE7ZWxzZSBpZihsPT09TnVtYmVyKWUuZj0wO2Vsc2V7aWYobCE9PVN0cmluZyl7ZT1uZXcgbDticmVhayBufWUuZj1lLmg/XCIwXCI6XCJcIn19ZT1lLmZ9cmV0dXJuIGV9ZnVuY3Rpb24gZChuLHQpe3JldHVybiBuLmZbdF0uZz9udWxsIT1uLmFbdF0/bi5hW3RdLmxlbmd0aDowOm51bGwhPW4uYVt0XT8xOjB9ZnVuY3Rpb24gbShuLHQsZSl7bi5hW3RdPWUsbi5iJiYobi5iW3RdPWUpfWZ1bmN0aW9uIGIobix0KXt2YXIgZSxsPVtdO2ZvcihlIGluIHQpMCE9ZSYmbC5wdXNoKG5ldyBzKGUsdFtlXSkpO3JldHVybiBuZXcgYShuLGwpfS8qXG5cbiBQcm90b2NvbCBCdWZmZXIgMiBDb3B5cmlnaHQgMjAwOCBHb29nbGUgSW5jLlxuIEFsbCBvdGhlciBjb2RlIGNvcHlyaWdodCBpdHMgcmVzcGVjdGl2ZSBvd25lcnMuXG4gQ29weXJpZ2h0IChDKSAyMDEwIFRoZSBMaWJwaG9uZW51bWJlciBBdXRob3JzXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuZnVuY3Rpb24geSgpe2YuY2FsbCh0aGlzKX1mdW5jdGlvbiB2KCl7Zi5jYWxsKHRoaXMpfWZ1bmN0aW9uICQoKXtmLmNhbGwodGhpcyl9ZnVuY3Rpb24gXygpe31mdW5jdGlvbiBTKCl7fWZ1bmN0aW9uIHcoKXt9LypcblxuIENvcHlyaWdodCAoQykgMjAxMCBUaGUgTGlicGhvbmVudW1iZXIgQXV0aG9ycy5cblxuIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5mdW5jdGlvbiB4KCl7dGhpcy5hPXt9fWZ1bmN0aW9uIEEobil7cmV0dXJuIDA9PW4ubGVuZ3RofHx1bi50ZXN0KG4pfWZ1bmN0aW9uIE4obix0KXtpZihudWxsPT10KXJldHVybiBudWxsO3Q9dC50b1VwcGVyQ2FzZSgpO3ZhciBlPW4uYVt0XTtpZihudWxsPT1lKXtpZihlPXRuW3RdLG51bGw9PWUpcmV0dXJuIG51bGw7ZT0obmV3IHcpLmEoJC5qKCksZSksbi5hW3RdPWV9cmV0dXJuIGV9ZnVuY3Rpb24gRShuKXtyZXR1cm4gbj1ubltuXSxudWxsPT1uP1wiWlpcIjpuWzBdfWZ1bmN0aW9uIGoobil7dGhpcy5IPVJlZ0V4cChcIlx1MjAwOFwiKSx0aGlzLkM9XCJcIix0aGlzLm09bmV3IGUsdGhpcy53PVwiXCIsdGhpcy5pPW5ldyBlLHRoaXMudT1uZXcgZSx0aGlzLmw9ITAsdGhpcy5BPXRoaXMubz10aGlzLkY9ITEsdGhpcy5HPXguYigpLHRoaXMucz0wLHRoaXMuYj1uZXcgZSx0aGlzLkI9ITEsdGhpcy5oPVwiXCIsdGhpcy5hPW5ldyBlLHRoaXMuZj1bXSx0aGlzLkQ9bix0aGlzLko9dGhpcy5nPUIodGhpcyx0aGlzLkQpfWZ1bmN0aW9uIEIobix0KXt2YXIgZTtpZihudWxsIT10JiZpc05hTih0KSYmdC50b1VwcGVyQ2FzZSgpaW4gdG4pe2lmKGU9TihuLkcsdCksbnVsbD09ZSl0aHJvdyBFcnJvcihcIkludmFsaWQgcmVnaW9uIGNvZGU6IFwiK3QpO2U9ZyhlLDEwKX1lbHNlIGU9MDtyZXR1cm4gZT1OKG4uRyxFKGUpKSxudWxsIT1lP2U6YW59ZnVuY3Rpb24gRChuKXtmb3IodmFyIHQ9bi5mLmxlbmd0aCxlPTA7ZTx0OysrZSl7dmFyIHI9bi5mW2VdLGk9ZyhyLDEpO2lmKG4udz09aSlyZXR1cm4hMTt2YXIgdTt1PW47dmFyIGE9cixvPWcoYSwxKTtpZigtMSE9by5pbmRleE9mKFwifFwiKSl1PSExO2Vsc2V7bz1vLnJlcGxhY2Uob24sXCJcXFxcZFwiKSxvPW8ucmVwbGFjZShzbixcIlxcXFxkXCIpLGwodS5tKTt2YXIgcztzPXU7dmFyIGE9ZyhhLDIpLGY9XCI5OTk5OTk5OTk5OTk5OTlcIi5tYXRjaChvKVswXTtmLmxlbmd0aDxzLmEuYi5sZW5ndGg/cz1cIlwiOihzPWYucmVwbGFjZShuZXcgUmVnRXhwKG8sXCJnXCIpLGEpLHM9cy5yZXBsYWNlKFJlZ0V4cChcIjlcIixcImdcIiksXCJcdTIwMDhcIikpLDA8cy5sZW5ndGg/KHUubS5hKHMpLHU9ITApOnU9ITF9aWYodSlyZXR1cm4gbi53PWksbi5CPXBuLnRlc3QoaChyLDQpKSxuLnM9MCwhMH1yZXR1cm4gbi5sPSExfWZ1bmN0aW9uIFIobix0KXtmb3IodmFyIGU9W10sbD10Lmxlbmd0aC0zLHI9bi5mLmxlbmd0aCxpPTA7aTxyOysraSl7dmFyIHU9bi5mW2ldOzA9PWQodSwzKT9lLnB1c2gobi5mW2ldKToodT1oKHUsMyxNYXRoLm1pbihsLGQodSwzKS0xKSksMD09dC5zZWFyY2godSkmJmUucHVzaChuLmZbaV0pKX1uLmY9ZX1mdW5jdGlvbiBGKG4sdCl7bi5pLmEodCk7dmFyIGU9dDtpZihybi50ZXN0KGUpfHwxPT1uLmkuYi5sZW5ndGgmJmxuLnRlc3QoZSkpe3ZhciByLGU9dDtcIitcIj09ZT8ocj1lLG4udS5hKGUpKToocj1lbltlXSxuLnUuYShyKSxuLmEuYShyKSksdD1yfWVsc2Ugbi5sPSExLG4uRj0hMDtpZighbi5sKXtpZighbi5GKWlmKFAobikpe2lmKHEobikpcmV0dXJuIEMobil9ZWxzZSBpZigwPG4uaC5sZW5ndGgmJihlPW4uYS50b1N0cmluZygpLGwobi5hKSxuLmEuYShuLmgpLG4uYS5hKGUpLGU9bi5iLnRvU3RyaW5nKCkscj1lLmxhc3RJbmRleE9mKG4uaCksbChuLmIpLG4uYi5hKGUuc3Vic3RyaW5nKDAscikpKSxuLmghPUgobikpcmV0dXJuIG4uYi5hKFwiIFwiKSxDKG4pO3JldHVybiBuLmkudG9TdHJpbmcoKX1zd2l0Y2gobi51LmIubGVuZ3RoKXtjYXNlIDA6Y2FzZSAxOmNhc2UgMjpyZXR1cm4gbi5pLnRvU3RyaW5nKCk7Y2FzZSAzOmlmKCFQKG4pKXJldHVybiBuLmg9SChuKSxWKG4pO24uQT0hMDtkZWZhdWx0OnJldHVybiBuLkE/KHEobikmJihuLkE9ITEpLG4uYi50b1N0cmluZygpK24uYS50b1N0cmluZygpKTowPG4uZi5sZW5ndGg/KGU9VChuLHQpLHI9SShuKSwwPHIubGVuZ3RoP3I6KFIobixuLmEudG9TdHJpbmcoKSksRChuKT9HKG4pOm4ubD9NKG4sZSk6bi5pLnRvU3RyaW5nKCkpKTpWKG4pfX1mdW5jdGlvbiBDKG4pe3JldHVybiBuLmw9ITAsbi5BPSExLG4uZj1bXSxuLnM9MCxsKG4ubSksbi53PVwiXCIsVihuKX1mdW5jdGlvbiBJKG4pe2Zvcih2YXIgdD1uLmEudG9TdHJpbmcoKSxlPW4uZi5sZW5ndGgsbD0wO2w8ZTsrK2wpe3ZhciByPW4uZltsXSxpPWcociwxKTtpZihuZXcgUmVnRXhwKFwiXig/OlwiK2krXCIpJFwiKS50ZXN0KHQpKXJldHVybiBuLkI9cG4udGVzdChoKHIsNCkpLHQ9dC5yZXBsYWNlKG5ldyBSZWdFeHAoaSxcImdcIiksaChyLDIpKSxNKG4sdCl9cmV0dXJuXCJcIn1mdW5jdGlvbiBNKG4sdCl7dmFyIGU9bi5iLmIubGVuZ3RoO3JldHVybiBuLkImJjA8ZSYmXCIgXCIhPW4uYi50b1N0cmluZygpLmNoYXJBdChlLTEpP24uYitcIiBcIit0Om4uYit0fWZ1bmN0aW9uIFYobil7dmFyIHQ9bi5hLnRvU3RyaW5nKCk7aWYoMzw9dC5sZW5ndGgpe2Zvcih2YXIgZT1uLm8mJjA9PW4uaC5sZW5ndGgmJjA8ZChuLmcsMjApP2Mobi5nLDIwKXx8W106YyhuLmcsMTkpfHxbXSxsPWUubGVuZ3RoLHI9MDtyPGw7KytyKXt2YXIgaT1lW3JdOzA8bi5oLmxlbmd0aCYmQShnKGksNCkpJiYhaChpLDYpJiZudWxsPT1pLmFbNV18fCgwIT1uLmgubGVuZ3RofHxuLm98fEEoZyhpLDQpKXx8aChpLDYpKSYmZm4udGVzdChnKGksMikpJiZuLmYucHVzaChpKX1yZXR1cm4gUihuLHQpLHQ9SShuKSwwPHQubGVuZ3RoP3Q6RChuKT9HKG4pOm4uaS50b1N0cmluZygpfXJldHVybiBNKG4sdCl9ZnVuY3Rpb24gRyhuKXt2YXIgdD1uLmEudG9TdHJpbmcoKSxlPXQubGVuZ3RoO2lmKDA8ZSl7Zm9yKHZhciBsPVwiXCIscj0wO3I8ZTtyKyspbD1UKG4sdC5jaGFyQXQocikpO3JldHVybiBuLmw/TShuLGwpOm4uaS50b1N0cmluZygpfXJldHVybiBuLmIudG9TdHJpbmcoKX1mdW5jdGlvbiBIKG4pe3ZhciB0LGU9bi5hLnRvU3RyaW5nKCkscj0wO3JldHVybiAxIT1oKG4uZywxMCk/dD0hMToodD1uLmEudG9TdHJpbmcoKSx0PVwiMVwiPT10LmNoYXJBdCgwKSYmXCIwXCIhPXQuY2hhckF0KDEpJiZcIjFcIiE9dC5jaGFyQXQoMSkpLHQ/KHI9MSxuLmIuYShcIjFcIikuYShcIiBcIiksbi5vPSEwKTpudWxsIT1uLmcuYVsxNV0mJih0PW5ldyBSZWdFeHAoXCJeKD86XCIraChuLmcsMTUpK1wiKVwiKSx0PWUubWF0Y2godCksbnVsbCE9dCYmbnVsbCE9dFswXSYmMDx0WzBdLmxlbmd0aCYmKG4ubz0hMCxyPXRbMF0ubGVuZ3RoLG4uYi5hKGUuc3Vic3RyaW5nKDAscikpKSksbChuLmEpLG4uYS5hKGUuc3Vic3RyaW5nKHIpKSxlLnN1YnN0cmluZygwLHIpfWZ1bmN0aW9uIFAobil7dmFyIHQ9bi51LnRvU3RyaW5nKCksZT1uZXcgUmVnRXhwKFwiXig/OlxcXFwrfFwiK2gobi5nLDExKStcIilcIiksZT10Lm1hdGNoKGUpO3JldHVybiBudWxsIT1lJiZudWxsIT1lWzBdJiYwPGVbMF0ubGVuZ3RoJiYobi5vPSEwLGU9ZVswXS5sZW5ndGgsbChuLmEpLG4uYS5hKHQuc3Vic3RyaW5nKGUpKSxsKG4uYiksbi5iLmEodC5zdWJzdHJpbmcoMCxlKSksXCIrXCIhPXQuY2hhckF0KDApJiZuLmIuYShcIiBcIiksITApfWZ1bmN0aW9uIHEobil7aWYoMD09bi5hLmIubGVuZ3RoKXJldHVybiExO3ZhciB0LHI9bmV3IGU7bjp7aWYodD1uLmEudG9TdHJpbmcoKSwwIT10Lmxlbmd0aCYmXCIwXCIhPXQuY2hhckF0KDApKWZvcih2YXIgaSx1PXQubGVuZ3RoLGE9MTszPj1hJiZhPD11OysrYSlpZihpPXBhcnNlSW50KHQuc3Vic3RyaW5nKDAsYSksMTApLGkgaW4gbm4pe3IuYSh0LnN1YnN0cmluZyhhKSksdD1pO2JyZWFrIG59dD0wfXJldHVybiAwIT10JiYobChuLmEpLG4uYS5hKHIudG9TdHJpbmcoKSkscj1FKHQpLFwiMDAxXCI9PXI/bi5nPU4obi5HLFwiXCIrdCk6ciE9bi5EJiYobi5nPUIobixyKSksbi5iLmEoXCJcIit0KS5hKFwiIFwiKSxuLmg9XCJcIiwhMCl9ZnVuY3Rpb24gVChuLHQpe3ZhciBlPW4ubS50b1N0cmluZygpO2lmKDA8PWUuc3Vic3RyaW5nKG4ucykuc2VhcmNoKG4uSCkpe3ZhciByPWUuc2VhcmNoKG4uSCksZT1lLnJlcGxhY2Uobi5ILHQpO3JldHVybiBsKG4ubSksbi5tLmEoZSksbi5zPXIsZS5zdWJzdHJpbmcoMCxuLnMrMSl9cmV0dXJuIDE9PW4uZi5sZW5ndGgmJihuLmw9ITEpLG4udz1cIlwiLG4uaS50b1N0cmluZygpfXZhciBVPXRoaXM7ZS5wcm90b3R5cGUuYj1cIlwiLGUucHJvdG90eXBlLnNldD1mdW5jdGlvbihuKXt0aGlzLmI9XCJcIitufSxlLnByb3RvdHlwZS5hPWZ1bmN0aW9uKG4sdCxlKXtpZih0aGlzLmIrPVN0cmluZyhuKSxudWxsIT10KWZvcih2YXIgbD0xO2w8YXJndW1lbnRzLmxlbmd0aDtsKyspdGhpcy5iKz1hcmd1bWVudHNbbF07cmV0dXJuIHRoaXN9LGUucHJvdG90eXBlLnRvU3RyaW5nPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuYn07dmFyIFk9MSxrPTIsSj0zLEs9NCxMPTYsTz0xNixaPTE4O2YucHJvdG90eXBlLnNldD1mdW5jdGlvbihuLHQpe20odGhpcyxuLmIsdCl9LGYucHJvdG90eXBlLmNsb25lPWZ1bmN0aW9uKCl7dmFyIG49bmV3IHRoaXMuY29uc3RydWN0b3I7cmV0dXJuIG4hPXRoaXMmJihuLmE9e30sbi5iJiYobi5iPXt9KSxwKG4sdGhpcykpLG59LHQoeSxmKTt2YXIgej1udWxsO3QodixmKTt2YXIgUT1udWxsO3QoJCxmKTt2YXIgVz1udWxsO3kucHJvdG90eXBlLmo9ZnVuY3Rpb24oKXt2YXIgbj16O3JldHVybiBufHwoej1uPWIoeSx7MDp7bmFtZTpcIk51bWJlckZvcm1hdFwiLEk6XCJpMThuLnBob25lbnVtYmVycy5OdW1iZXJGb3JtYXRcIn0sMTp7bmFtZTpcInBhdHRlcm5cIixyZXF1aXJlZDohMCxjOjksdHlwZTpTdHJpbmd9LDI6e25hbWU6XCJmb3JtYXRcIixyZXF1aXJlZDohMCxjOjksdHlwZTpTdHJpbmd9LDM6e25hbWU6XCJsZWFkaW5nX2RpZ2l0c19wYXR0ZXJuXCIsdjohMCxjOjksdHlwZTpTdHJpbmd9LDQ6e25hbWU6XCJuYXRpb25hbF9wcmVmaXhfZm9ybWF0dGluZ19ydWxlXCIsYzo5LHR5cGU6U3RyaW5nfSw2OntuYW1lOlwibmF0aW9uYWxfcHJlZml4X29wdGlvbmFsX3doZW5fZm9ybWF0dGluZ1wiLGM6OCxkZWZhdWx0VmFsdWU6ITEsdHlwZTpCb29sZWFufSw1OntuYW1lOlwiZG9tZXN0aWNfY2Fycmllcl9jb2RlX2Zvcm1hdHRpbmdfcnVsZVwiLGM6OSx0eXBlOlN0cmluZ319KSksbn0seS5qPXkucHJvdG90eXBlLmosdi5wcm90b3R5cGUuaj1mdW5jdGlvbigpe3ZhciBuPVE7cmV0dXJuIG58fChRPW49Yih2LHswOntuYW1lOlwiUGhvbmVOdW1iZXJEZXNjXCIsSTpcImkxOG4ucGhvbmVudW1iZXJzLlBob25lTnVtYmVyRGVzY1wifSwyOntuYW1lOlwibmF0aW9uYWxfbnVtYmVyX3BhdHRlcm5cIixjOjksdHlwZTpTdHJpbmd9LDk6e25hbWU6XCJwb3NzaWJsZV9sZW5ndGhcIix2OiEwLGM6NSx0eXBlOk51bWJlcn0sMTA6e25hbWU6XCJwb3NzaWJsZV9sZW5ndGhfbG9jYWxfb25seVwiLHY6ITAsYzo1LHR5cGU6TnVtYmVyfSw2OntuYW1lOlwiZXhhbXBsZV9udW1iZXJcIixjOjksdHlwZTpTdHJpbmd9fSkpLG59LHYuaj12LnByb3RvdHlwZS5qLCQucHJvdG90eXBlLmo9ZnVuY3Rpb24oKXt2YXIgbj1XO3JldHVybiBufHwoVz1uPWIoJCx7MDp7bmFtZTpcIlBob25lTWV0YWRhdGFcIixJOlwiaTE4bi5waG9uZW51bWJlcnMuUGhvbmVNZXRhZGF0YVwifSwxOntuYW1lOlwiZ2VuZXJhbF9kZXNjXCIsYzoxMSx0eXBlOnZ9LDI6e25hbWU6XCJmaXhlZF9saW5lXCIsYzoxMSx0eXBlOnZ9LDM6e25hbWU6XCJtb2JpbGVcIixjOjExLHR5cGU6dn0sNDp7bmFtZTpcInRvbGxfZnJlZVwiLGM6MTEsdHlwZTp2fSw1OntuYW1lOlwicHJlbWl1bV9yYXRlXCIsYzoxMSx0eXBlOnZ9LDY6e25hbWU6XCJzaGFyZWRfY29zdFwiLGM6MTEsdHlwZTp2fSw3OntuYW1lOlwicGVyc29uYWxfbnVtYmVyXCIsYzoxMSx0eXBlOnZ9LDg6e25hbWU6XCJ2b2lwXCIsYzoxMSx0eXBlOnZ9LDIxOntuYW1lOlwicGFnZXJcIixjOjExLHR5cGU6dn0sMjU6e25hbWU6XCJ1YW5cIixjOjExLHR5cGU6dn0sMjc6e25hbWU6XCJlbWVyZ2VuY3lcIixjOjExLHR5cGU6dn0sMjg6e25hbWU6XCJ2b2ljZW1haWxcIixjOjExLHR5cGU6dn0sMjk6e25hbWU6XCJzaG9ydF9jb2RlXCIsYzoxMSx0eXBlOnZ9LDMwOntuYW1lOlwic3RhbmRhcmRfcmF0ZVwiLGM6MTEsdHlwZTp2fSwzMTp7bmFtZTpcImNhcnJpZXJfc3BlY2lmaWNcIixjOjExLHR5cGU6dn0sMzM6e25hbWU6XCJzbXNfc2VydmljZXNcIixjOjExLHR5cGU6dn0sMjQ6e25hbWU6XCJub19pbnRlcm5hdGlvbmFsX2RpYWxsaW5nXCIsYzoxMSx0eXBlOnZ9LDk6e25hbWU6XCJpZFwiLHJlcXVpcmVkOiEwLGM6OSx0eXBlOlN0cmluZ30sMTA6e25hbWU6XCJjb3VudHJ5X2NvZGVcIixjOjUsdHlwZTpOdW1iZXJ9LDExOntuYW1lOlwiaW50ZXJuYXRpb25hbF9wcmVmaXhcIixjOjksdHlwZTpTdHJpbmd9LDE3OntuYW1lOlwicHJlZmVycmVkX2ludGVybmF0aW9uYWxfcHJlZml4XCIsYzo5LHR5cGU6U3RyaW5nfSwxMjp7bmFtZTpcIm5hdGlvbmFsX3ByZWZpeFwiLGM6OSx0eXBlOlN0cmluZ30sMTM6e25hbWU6XCJwcmVmZXJyZWRfZXh0bl9wcmVmaXhcIixjOjksdHlwZTpTdHJpbmd9LDE1OntuYW1lOlwibmF0aW9uYWxfcHJlZml4X2Zvcl9wYXJzaW5nXCIsYzo5LHR5cGU6U3RyaW5nfSwxNjp7bmFtZTpcIm5hdGlvbmFsX3ByZWZpeF90cmFuc2Zvcm1fcnVsZVwiLGM6OSx0eXBlOlN0cmluZ30sMTg6e25hbWU6XCJzYW1lX21vYmlsZV9hbmRfZml4ZWRfbGluZV9wYXR0ZXJuXCIsYzo4LGRlZmF1bHRWYWx1ZTohMSx0eXBlOkJvb2xlYW59LDE5OntuYW1lOlwibnVtYmVyX2Zvcm1hdFwiLHY6ITAsYzoxMSx0eXBlOnl9LDIwOntuYW1lOlwiaW50bF9udW1iZXJfZm9ybWF0XCIsdjohMCxjOjExLHR5cGU6eX0sMjI6e25hbWU6XCJtYWluX2NvdW50cnlfZm9yX2NvZGVcIixjOjgsZGVmYXVsdFZhbHVlOiExLHR5cGU6Qm9vbGVhbn0sMjM6e25hbWU6XCJsZWFkaW5nX2RpZ2l0c1wiLGM6OSx0eXBlOlN0cmluZ30sMjY6e25hbWU6XCJsZWFkaW5nX3plcm9fcG9zc2libGVcIixjOjgsZGVmYXVsdFZhbHVlOiExLHR5cGU6Qm9vbGVhbn19KSksbn0sJC5qPSQucHJvdG90eXBlLmosXy5wcm90b3R5cGUuYT1mdW5jdGlvbihuKXt0aHJvdyBuZXcgbi5iLEVycm9yKFwiVW5pbXBsZW1lbnRlZFwiKX0sXy5wcm90b3R5cGUuYj1mdW5jdGlvbihuLHQpe2lmKDExPT1uLmF8fDEwPT1uLmEpcmV0dXJuIHQgaW5zdGFuY2VvZiBmP3Q6dGhpcy5hKG4uaS5wcm90b3R5cGUuaigpLHQpO2lmKDE0PT1uLmEpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiB0JiZYLnRlc3QodCkpe3ZhciBlPU51bWJlcih0KTtpZigwPGUpcmV0dXJuIGV9cmV0dXJuIHR9aWYoIW4uaClyZXR1cm4gdDtpZihlPW4uaSxlPT09U3RyaW5nKXtpZihcIm51bWJlclwiPT10eXBlb2YgdClyZXR1cm4gU3RyaW5nKHQpfWVsc2UgaWYoZT09PU51bWJlciYmXCJzdHJpbmdcIj09dHlwZW9mIHQmJihcIkluZmluaXR5XCI9PT10fHxcIi1JbmZpbml0eVwiPT09dHx8XCJOYU5cIj09PXR8fFgudGVzdCh0KSkpcmV0dXJuIE51bWJlcih0KTtyZXR1cm4gdH07dmFyIFg9L14tP1swLTldKyQvO3QoUyxfKSxTLnByb3RvdHlwZS5hPWZ1bmN0aW9uKG4sdCl7dmFyIGU9bmV3IG4uYjtyZXR1cm4gZS5nPXRoaXMsZS5hPXQsZS5iPXt9LGV9LHQodyxTKSx3LnByb3RvdHlwZS5iPWZ1bmN0aW9uKG4sdCl7cmV0dXJuIDg9PW4uYT8hIXQ6Xy5wcm90b3R5cGUuYi5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LHcucHJvdG90eXBlLmE9ZnVuY3Rpb24obix0KXtyZXR1cm4gdy5NLmEuY2FsbCh0aGlzLG4sdCl9Oy8qXG5cbiBDb3B5cmlnaHQgKEMpIDIwMTAgVGhlIExpYnBob25lbnVtYmVyIEF1dGhvcnNcblxuIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG52YXIgbm49ezQ5OltcIkRFXCJdfSx0bj17REU6W251bGwsW251bGwsbnVsbCxcIig/OjF8WzIzNS05XVxcXFxkezExfXw0KD86WzAtOF1cXFxcZHsyLDEwfXw5KD86WzA1XVxcXFxkezd9fFs0Nl1bMS04XVxcXFxkezIsNn0pKSlcXFxcZHszfXxbMS0zNS05XVxcXFxkezYsMTN9fDQ5KD86KD86WzAtMjVdXFxcXGR8M1sxLTY4OV0pXFxcXGR7NCw4fXw0WzEtOF1cXFxcZHs0fXw2WzAtOF1cXFxcZHszLDR9fDdbMS03XVxcXFxkezUsOH0pfDQ5N1swLTddXFxcXGR7NH18NDkoPzpbMC0yNTc5XVxcXFxkfFszNF1bMS05XSlcXFxcZHszfXxbMS05XVxcXFxkezV9fFsxMzQ2OF1cXFxcZHs0fVwiLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLFs0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNV0sWzNdXSxbbnVsbCxudWxsLFwiKD86Mig/OjBbMS02ODldfFsxLTM1NjldXFxcXGR8NFswLThdfDdbMS03XXw4WzAtN10pfDUoPzowWzItOF18WzEyNC02XVxcXFxkfFszOF1bMC04XXxbNzldWzAtN10pfDYoPzowWzAyLTldfFsxLTM1ODldXFxcXGR8WzQ3XVswLThdfDZbMS05XSl8Nyg/OjBbMi04XXwxWzEtOV18WzI3XVswLTddfDNcXFxcZHxbNC02XVswLThdfDhbMC01XXw5WzAxMy03XSl8OCg/OjBbMi05XXwxWzAtNzldfFsyOV1cXFxcZHwzWzAtNDYtOV18NFswLTZdfDVbMDEzLTldfDZbMS04XXw3WzAtOF18OFswLTI0LTZdKXw5KD86MFs2LTldfFsxLTRdXFxcXGR8WzU4OV1bMC03XXw2WzAtOF18N1swLTQ2N10pKVxcXFxkezQsMTJ9fDMoPzooPzpbMDM1NjldXFxcXGR8NFswLTc5XXw3WzEtN118OFsxLThdKVxcXFxkezQsMTJ9fDJcXFxcZHs5fSl8NCg/Oig/OlswMi00OF1cXFxcZHwxWzAyLTldfDVbMC02XXw2WzAtOF18N1swLTc5XSlcXFxcZHs0LDEyfXw5KD86WzAtMzddXFxcXGR7NCw5fXxbNC02XVxcXFxkezQsMTB9KSl8KD86Mig/OjBbMS0zODldfDFbMTI0XXwyWzE4XXwzWzE0XXxbNC05XTEpfDMoPzowXFxcXGQ/fFszNS05XVsxNV18NFswMTVdKXw0KD86MFxcXFxkP3xbMi05XTEpfFs1N11bMS05XTF8WzY4XSg/OlsxLThdMXw5XFxcXGQ/KXw5KD86MDZ8WzEtOV0xKSlcXFxcZHszfVwiLG51bGwsbnVsbCxudWxsLFwiMzAxMjM0NTZcIixudWxsLG51bGwsWzUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNV0sWzMsNF1dLFtudWxsLG51bGwsXCIxKD86NVswLTI1LTldXFxcXGR7OH18KD86NlswMjNdfDdcXFxcZClcXFxcZHs3LDh9KVwiLG51bGwsbnVsbCxudWxsLFwiMTUxMjM0NTY3ODlcIixudWxsLG51bGwsWzEwLDExXV0sW251bGwsbnVsbCxcIjgwMFxcXFxkezcsMTJ9XCIsbnVsbCxudWxsLG51bGwsXCI4MDAxMjM0NTY3ODkwXCIsbnVsbCxudWxsLFsxMCwxMSwxMiwxMywxNCwxNV1dLFtudWxsLG51bGwsXCIoPzoxMzdbNy05XXw5MDAoPzpbMTM1XXw5XFxcXGQpKVxcXFxkezZ9XCIsbnVsbCxudWxsLG51bGwsXCI5MDAxMjM0NTY3XCIsbnVsbCxudWxsLFsxMCwxMV1dLFtudWxsLG51bGwsXCIxKD86Myg/OjdbMS02XVxcXFxkXFxcXGR8OCl8ODBcXFxcZHsxLDd9KVxcXFxkezR9XCIsbnVsbCxudWxsLG51bGwsXCIxODAxMjM0NVwiLG51bGwsbnVsbCxbNyw4LDksMTAsMTEsMTIsMTMsMTRdXSxbbnVsbCxudWxsLFwiNzAwXFxcXGR7OH1cIixudWxsLG51bGwsbnVsbCxcIjcwMDEyMzQ1Njc4XCIsbnVsbCxudWxsLFsxMV1dLFtudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxbLTFdXSxcIkRFXCIsNDksXCIwMFwiLFwiMFwiLG51bGwsbnVsbCxcIjBcIixudWxsLG51bGwsbnVsbCxbW251bGwsXCIoXFxcXGR7Mn0pKFxcXFxkezMsMTN9KVwiLFwiJDEgJDJcIixbXCIzWzAyXXw0MHxbNjhdOVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7MywxMn0pXCIsXCIkMSAkMlwiLFtcIjIoPzowWzEtMzg5XXwxWzEyNF18MlsxOF18M1sxNF18WzQtOV0xKXwzKD86WzM1LTldWzE1XXw0WzAxNV0pfCg/OjRbMi05XXxbNTddWzEtOV18WzY4XVsxLThdKTF8OSg/OjA2fFsxLTldMSlcIixcIjIoPzowWzEtMzg5XXwxKD86WzE0XXwyWzAtOF0pfDJbMThdfDNbMTRdfFs0LTldMSl8Myg/OlszNS05XVsxNV18NFswMTVdKXwoPzo0WzItOV18WzU3XVsxLTldfFs2OF1bMS04XSkxfDkoPzowNnxbMS05XTEpXCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZHs0fSlcIixcIiQxICQyXCIsW1wiMTM4XCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezR9KShcXFxcZHszLDExfSlcIixcIiQxICQyXCIsW1wiWzI0LTZdfDMoPzpbMzU2OV1bMDItNDYtOV18NFsyLTQ2NzldfDdbMi00NjddfDhbMi00Ni04XSl8Nyg/OjBbMi04XXxbMS05XSl8OCg/OjBbMi05XXxbMS04XSl8OSg/OjBbNy05XXxbMS05XSlcIixcIlsyNC02XXwzKD86Myg/OjBbMS00NjddfDJbMTI3LTldfDNbMTI0NTc4XXxbNDZdWzEyNDZdfDdbMTI1Ny05XXw4WzEyNTZdfDlbMTQ1XSl8NCg/OjJbMTM1XXwzWzEzNTddfDRbMTM1NzhdfDZbMTI0Nl18N1sxMzU2XXw5WzEzNDZdKXw1KD86MFsxNF18MlsxLTM1ODldfDNbMTM1N118WzQ5XVsxMjQ2XXw2WzEtNF18N1sxMzQ2OF18OFsxMzU2OF0pfDYoPzowWzEzNTZdfDJbMS00ODldfDNbMTI0LTZdfDRbMTM0N118NlsxM118N1sxMjU3OV18OFsxLTM1Nl18OVsxMzVdKXw3KD86MlsxLTddfDNbMTM1N118NFsxNDVdfDZbMS01XXw3WzEtNF0pfDgoPzoyMXwzWzE0NjhdfDRbMTM0N118Nnw3WzE0NjddfDhbMTM2XSl8OSg/OjBbMTI0NzldfDJbMTM1OF18M1sxMzU3XXw0WzEzNDY3OV18NlsxLTldfDdbMTM2XXw4WzE0N118OVsxNDY4XSkpfDcoPzowWzItOF18WzEtOV0pfDgoPzowWzItOV18WzEtOF0pfDkoPzowWzctOV18WzEtOV0pXCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZHs1LDExfSlcIixcIiQxICQyXCIsW1wiMTgxXCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZCkoXFxcXGR7NCwxMH0pXCIsXCIkMSAkMiAkM1wiLFtcIjEoPzozfDgwKXw5XCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezV9KShcXFxcZHszLDEwfSlcIixcIiQxICQyXCIsW1wiM1wiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7Nyw4fSlcIixcIiQxICQyXCIsW1wiMSg/OjZbMDItNDg5XXw3KVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7NywxMn0pXCIsXCIkMSAkMlwiLFtcIjhcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7NH0pKFxcXFxkezd9KVwiLFwiJDEgJDJcIixbXCIxNVsxMjc5XVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs1fSkoXFxcXGR7Nn0pXCIsXCIkMSAkMlwiLFtcIjE1WzA1NjhdXCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZHs0fSkoXFxcXGR7NH0pXCIsXCIkMSAkMiAkM1wiLFtcIjdcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7M30pKFxcXFxkezh9KVwiLFwiJDEgJDJcIixbXCIxOFsyLTU3OV1cIixcIjE4WzItNTc5XVwiLFwiMTgoPzpbMi00NzldfDUoPzowWzEtOV18WzEtOV0pKVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs0fSkoXFxcXGR7N30pXCIsXCIkMSAkMlwiLFtcIjE4WzY4XVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs1fSkoXFxcXGR7Nn0pXCIsXCIkMSAkMlwiLFtcIjE4XCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZHsyfSkoXFxcXGR7Nyw4fSlcIixcIiQxICQyICQzXCIsW1wiMSg/OjZbMDIzXXw3KVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7Mn0pKFxcXFxkezh9KVwiLFwiJDEgJDIgJDNcIixbXCIxNVswMTMtNjhdXCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezR9KShcXFxcZHsyfSkoXFxcXGR7N30pXCIsXCIkMSAkMiAkM1wiLFtcIjE1XCJdLFwiMCQxXCJdXSxudWxsLFtudWxsLG51bGwsXCIxNig/OjRcXFxcZHsxLDEwfXxbODldXFxcXGR7MSwxMX0pXCIsbnVsbCxudWxsLG51bGwsXCIxNjQxMjM0NVwiLG51bGwsbnVsbCxbNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTRdXSxudWxsLG51bGwsW251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLFstMV1dLFtudWxsLG51bGwsXCIxOCg/OjFcXFxcZHs1LDExfXxbMi05XVxcXFxkezh9KVwiLG51bGwsbnVsbCxudWxsLFwiMTg1MDAxMjM0NTZcIixudWxsLG51bGwsWzgsOSwxMCwxMSwxMiwxMywxNF1dLG51bGwsbnVsbCxbbnVsbCxudWxsLFwiMSg/OjUoPzooPzpbMDMtNjhdMDB8MTEzKVxcXFxkfDJcXFxcZDU1fDdcXFxcZDk5fDlcXFxcZDMzKXwoPzo2KD86MDEzfDI1NXwzOTkpfDcoPzooPzpbMDE1XTF8WzY5XTMpM3xbMi00XTU1fFs3OF05OSkpXFxcXGQ/KVxcXFxkezd9XCIsbnVsbCxudWxsLG51bGwsXCIxNzc5OTEyMzQ1NjdcIixudWxsLG51bGwsWzEyLDEzXV1dfTt4LmI9ZnVuY3Rpb24oKXtyZXR1cm4geC5hP3guYTp4LmE9bmV3IHh9O3ZhciBlbj17MDpcIjBcIiwxOlwiMVwiLDI6XCIyXCIsMzpcIjNcIiw0OlwiNFwiLDU6XCI1XCIsNjpcIjZcIiw3OlwiN1wiLDg6XCI4XCIsOTpcIjlcIixcIlx1RkYxMFwiOlwiMFwiLFwiXHVGRjExXCI6XCIxXCIsXCJcdUZGMTJcIjpcIjJcIixcIlx1RkYxM1wiOlwiM1wiLFwiXHVGRjE0XCI6XCI0XCIsXCJcdUZGMTVcIjpcIjVcIixcIlx1RkYxNlwiOlwiNlwiLFwiXHVGRjE3XCI6XCI3XCIsXCJcdUZGMThcIjpcIjhcIixcIlx1RkYxOVwiOlwiOVwiLFwiXHUwNjYwXCI6XCIwXCIsXCJcdTA2NjFcIjpcIjFcIixcIlx1MDY2MlwiOlwiMlwiLFwiXHUwNjYzXCI6XCIzXCIsXCJcdTA2NjRcIjpcIjRcIixcIlx1MDY2NVwiOlwiNVwiLFwiXHUwNjY2XCI6XCI2XCIsXCJcdTA2NjdcIjpcIjdcIixcIlx1MDY2OFwiOlwiOFwiLFwiXHUwNjY5XCI6XCI5XCIsXCJcdTA2RjBcIjpcIjBcIixcIlx1MDZGMVwiOlwiMVwiLFwiXHUwNkYyXCI6XCIyXCIsXCJcdTA2RjNcIjpcIjNcIixcIlx1MDZGNFwiOlwiNFwiLFwiXHUwNkY1XCI6XCI1XCIsXCJcdTA2RjZcIjpcIjZcIixcIlx1MDZGN1wiOlwiN1wiLFwiXHUwNkY4XCI6XCI4XCIsXCJcdTA2RjlcIjpcIjlcIn0sbG49UmVnRXhwKFwiWytcdUZGMEJdK1wiKSxybj1SZWdFeHAoXCIoWzAtOVx1RkYxMC1cdUZGMTlcdTA2NjAtXHUwNjY5XHUwNkYwLVx1MDZGOV0pXCIpLHVuPS9eXFwoP1xcJDFcXCk/JC8sYW49bmV3ICQ7bShhbiwxMSxcIk5BXCIpO3ZhciBvbj0vXFxbKFteXFxbXFxdXSkqXFxdL2csc249L1xcZCg/PVteLH1dW14sfV0pL2csZm49UmVnRXhwKFwiXlsteFx1MjAxMC1cdTIwMTVcdTIyMTJcdTMwRkNcdUZGMEQtXHVGRjBGIFx1MDBBMFx1MDBBRFx1MjAwQlx1MjA2MFx1MzAwMCgpXHVGRjA4XHVGRjA5XHVGRjNCXHVGRjNELlxcXFxbXFxcXF0vflx1MjA1M1x1MjIzQ1x1RkY1RV0qKFxcXFwkXFxcXGRbLXhcdTIwMTAtXHUyMDE1XHUyMjEyXHUzMEZDXHVGRjBELVx1RkYwRiBcdTAwQTBcdTAwQURcdTIwMEJcdTIwNjBcdTMwMDAoKVx1RkYwOFx1RkYwOVx1RkYzQlx1RkYzRC5cXFxcW1xcXFxdL35cdTIwNTNcdTIyM0NcdUZGNUVdKikrJFwiKSxwbj0vWy0gXS87ai5wcm90b3R5cGUuSz1mdW5jdGlvbigpe3RoaXMuQz1cIlwiLGwodGhpcy5pKSxsKHRoaXMudSksbCh0aGlzLm0pLHRoaXMucz0wLHRoaXMudz1cIlwiLGwodGhpcy5iKSx0aGlzLmg9XCJcIixsKHRoaXMuYSksdGhpcy5sPSEwLHRoaXMuQT10aGlzLm89dGhpcy5GPSExLHRoaXMuZj1bXSx0aGlzLkI9ITEsdGhpcy5nIT10aGlzLkomJih0aGlzLmc9Qih0aGlzLHRoaXMuRCkpfSxqLnByb3RvdHlwZS5MPWZ1bmN0aW9uKG4pe3JldHVybiB0aGlzLkM9Rih0aGlzLG4pfSxuKFwiQ2xlYXZlLkFzWW91VHlwZUZvcm1hdHRlclwiLGopLG4oXCJDbGVhdmUuQXNZb3VUeXBlRm9ybWF0dGVyLnByb3RvdHlwZS5pbnB1dERpZ2l0XCIsai5wcm90b3R5cGUuTCksbihcIkNsZWF2ZS5Bc1lvdVR5cGVGb3JtYXR0ZXIucHJvdG90eXBlLmNsZWFyXCIsai5wcm90b3R5cGUuSyl9LmNhbGwoXCJvYmplY3RcIj09dHlwZW9mIGdsb2JhbCYmZ2xvYmFsP2dsb2JhbDp3aW5kb3cpOyIsICIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gQ2xlYXZlXG5pbXBvcnQgQ2xlYXZlIGZyb20gXCJjbGVhdmUuanNcIjtcbmltcG9ydCBcImNsZWF2ZS5qcy9kaXN0L2FkZG9ucy9jbGVhdmUtcGhvbmUuZGVcIjtcbmltcG9ydCB0eXBlIHsgQ2xlYXZlT3B0aW9ucyB9IGZyb20gXCJjbGVhdmUuanMvb3B0aW9ucy9pbmRleC5qc1wiO1xuLy8gI2VuZHJlZ2lvbiBDbGVhdmVcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfSW5wdXRfQ2xlYXZlLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBIVE1MX0lucHV0X0NsZWF2ZSB7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgYXBwbGllcyBDbGVhdmUgb24gYW4ge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfS5cbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gQ29uZmlnICAgICAgOiBUaGUge0BsaW5rIENsZWF2ZU9wdGlvbnMgfSB0byBzZXQgaW5zdGVhZCBvZiB0aGUgb3RoZXIgc2hvcnRoYW5kIHBhcmFtZXRlci5cbiAgICogIC0gRGF0ZSAgICAgICAgOiBUaGUge0BsaW5rIENsZWF2ZU9wdGlvbnMuZGF0ZSB9LlxuICAgKiAgLSBEYXRlTWluICAgICA6IFRoZSB7QGxpbmsgQ2xlYXZlT3B0aW9ucy5kYXRlTWluIH0uXG4gICAqICAgICAgICAgICAgICAgICAgSGFzIHRvIGJlIHNldCBhY2NvcmRpbmcgdG8gdGhlIGFtZXJpY2FuIHN0YW5kYXJkIHdpdGggZGFzaGVzIChZWVlZLU1NLUREKS5cbiAgICogIC0gRGF0ZU1heCAgICAgOiBUaGUge0BsaW5rIENsZWF2ZU9wdGlvbnMuZGF0ZU1heCB9LlxuICAgKiAgICAgICAgICAgICAgICAgIEhhcyB0byBiZSBzZXQgYWNjb3JkaW5nIHRvIHRoZSBhbWVyaWNhbiBzdGFuZGFyZCB3aXRoIGRhc2hlcyAoWVlZWS1NTS1ERCkuXG4gICAqICAtIERlbGltaXRlciAgIDogVGhlIHtAbGluayBDbGVhdmVPcHRpb25zLmRlbGltaXRlciB9LlxuICAgKiAgLSBEYXRlUGF0dGVybiA6IFRoZSB7QGxpbmsgQ2xlYXZlT3B0aW9ucy5kYXRlUGF0dGVybiB9LlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS5cbiAgICogQHBhcmFtIHRvUHJvY2VzcyBQcm92aWRlZCBieSB0aGUgQ29kQmkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LFxuICAgIEBFUS5QUkUoXCJJTlBVVFwiLCBmYWxzZSwgXCJ0YWdOYW1lXCIpIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBOb3JtYWxpemUgQXJyYXllZC1QYXJhbWV0ZXIuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodG9Mb2FkLmNvbmZpZykpIHtcbiAgICAgIHRvTG9hZC5jb25maWcgPSAodG9Mb2FkLmNvbmZpZyBhcyBBcnJheTxzdHJpbmc+KVswXTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodG9Mb2FkLmRhdGUpKSB7XG4gICAgICB0b0xvYWQuZGF0ZSA9ICh0b0xvYWQuZGF0ZSBhcyBBcnJheTxib29sZWFuPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlbWluKSkge1xuICAgICAgdG9Mb2FkLmRhdGVtaW4gPSAodG9Mb2FkLmRhdGVtaW4gYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlbWF4KSkge1xuICAgICAgdG9Mb2FkLmRhdGVtYXggPSAodG9Mb2FkLmRhdGVtYXggYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kZWxpbWl0ZXIpKSB7XG4gICAgICB0b0xvYWQuZGVsaW1pdGVyID0gKHRvTG9hZC5kZWxpbWl0ZXIgYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlcGF0dGVybikpIHtcbiAgICAgIHRvTG9hZC5kYXRlcGF0dGVybiA9ICh0b0xvYWQuZGF0ZXBhdHRlcm4gYXMgQXJyYXk8QXJyYXk8c3RyaW5nPj4pWzBdO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbGl6ZSBBcnJheWVkLVBhcmFtZXRlclxuICAgIC8vIERvIG5vdGhpbmcgaWYgbm90IGFwcGxpZWQgb24gYW4gXCJIVE1MSW5wdXRFbGVtZW50XCIuXG4gICAgaWYgKHRvUHJvY2Vzcy50YWdOYW1lLnRvVXBwZXJDYXNlKCkgIT09IFwiSU5QVVRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIEJ1aWxkIFwiQ2xlYXZlT3B0aW9uc1wiLlxuICAgIGNvbnN0IGNvbmZpZzogQ2xlYXZlT3B0aW9ucyA9IHRvTG9hZC5jb25maWdcbiAgICAgID8gdHlwZW9mIHRvTG9hZC5jb25maWcgPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyAoSlNPTi5wYXJzZSh0b0xvYWQuY29uZmlnLnJlcGxhY2UoLzwvLCBcIntcIikucmVwbGFjZSgvPi8sIFwifVwiKSkgYXMgQ2xlYXZlT3B0aW9ucylcbiAgICAgICAgOiAodG9Mb2FkLmNvbmZpZyBhcyBDbGVhdmVPcHRpb25zKVxuICAgICAgOiB7XG4gICAgICAgICAgZGF0ZTogdG9Mb2FkLmRhdGUgPyAodG9Mb2FkLmRhdGUgYXMgYm9vbGVhbikgOiB0cnVlLFxuICAgICAgICAgIGRhdGVNaW46IHRvTG9hZC5kYXRlbWluICYmIHR5cGVvZiB0b0xvYWQuZGF0ZW1pbiA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGF0ZW1pbiBhcyBzdHJpbmcpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRhdGVNYXg6IHRvTG9hZC5kYXRlbWF4ICYmIHR5cGVvZiB0b0xvYWQuZGF0ZW1heCA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGF0ZW1heCBhcyBzdHJpbmcpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRlbGltaXRlcjogdG9Mb2FkLmRlbGltaXRlciAmJiB0eXBlb2YgdG9Mb2FkLmRlbGltaXRlciA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGVsaW1pdGVyIGFzIHN0cmluZykgOiBcIi5cIixcbiAgICAgICAgICBkYXRlUGF0dGVybjogdG9Mb2FkLmRhdGVwYXR0ZXJuXG4gICAgICAgICAgICA/IFRZUEUudHNDaGVjazxzdHJpbmc+KHRvTG9hZC5kYXRlcGF0dGVybiwgXCJzdHJpbmdcIikuc3BsaXQoXCItXCIpXG4gICAgICAgICAgICA6IFtcImRcIiwgXCJtXCIsIFwiWVwiXSxcbiAgICAgICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIEJ1aWxkIFwiQ2xlYXZlT3B0aW9uc1wiLlxuICAgIC8vIEFwcGx5IENsZWF2ZS5cbiAgICBuZXcgQ2xlYXZlKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCwgY29uZmlnKTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBIVE1MX0lucHV0X0NsZWF2ZSB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIkhUTUwuSW5wdXQuQ2xlYXZlXCIsIEhUTUxfSW5wdXRfQ2xlYXZlLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJLGlCQUFpQixPQUFPLFdBQVcsY0FBYyxTQUFTLE9BQU8sV0FBVyxjQUFjLFNBQVMsT0FBTyxTQUFTLGNBQWMsT0FBTyxDQUFDO0FBRTdJLElBQUksbUJBQW1CLFNBQVUsb0JBQ0EscUJBQ0EscUJBQ0EsNEJBQ0EscUJBQ0Esb0JBQ0EsUUFDQSxrQkFDQSxZQUNBLFdBQVc7QUFDeEMsTUFBSSxRQUFRO0FBRVosUUFBTSxxQkFBcUIsc0JBQXNCO0FBQ2pELFFBQU0sc0JBQXNCLHNCQUFzQixJQUFJLHNCQUFzQjtBQUM1RSxRQUFNLHNCQUFzQix1QkFBdUIsSUFBSSxzQkFBc0I7QUFDN0UsUUFBTSw2QkFBNkIsOEJBQThCLGlCQUFpQixXQUFXO0FBQzdGLFFBQU0sc0JBQXNCLENBQUMsQ0FBQztBQUM5QixRQUFNLHFCQUFxQix1QkFBdUI7QUFDbEQsUUFBTSxTQUFVLFVBQVUsV0FBVyxLQUFNLFNBQVM7QUFDcEQsUUFBTSxtQkFBbUIsQ0FBQyxDQUFDO0FBQzNCLFFBQU0sYUFBYSxDQUFDLENBQUM7QUFDckIsUUFBTSxZQUFhLGFBQWEsY0FBYyxLQUFNLFlBQVk7QUFDaEUsUUFBTSxjQUFjLFlBQVksSUFBSSxPQUFPLE9BQU8sV0FBVyxHQUFHLElBQUk7QUFDeEU7QUFFQSxpQkFBaUIsYUFBYTtBQUFBLEVBQzFCLFVBQVU7QUFBQSxFQUNWLE1BQVU7QUFBQSxFQUNWLEtBQVU7QUFBQSxFQUNWLE1B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LFlBQU1ELE1BQUcsS0FBSyxFQUFFLE1BQU0sTUFBSyxTQUFTO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLElBQUFBLEdBQUUsSUFBRTtBQUFBLEVBQUU7QUFBQyxXQUFTLEVBQUVBLElBQUVDLElBQUU7QUFBQyxJQUFBRCxHQUFFLEtBQUtDLE1BQUcsQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVELElBQUVDLElBQUU7QUFBQyxXQUFPRCxLQUFFQyxLQUFFLElBQUVELEtBQUVDLEtBQUUsS0FBRztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVELElBQUU7QUFBQyxRQUFJQyxJQUFFQyxLQUFFLENBQUMsR0FBRUMsS0FBRTtBQUFFLFNBQUlGLE1BQUtELEdBQUUsQ0FBQUUsR0FBRUMsSUFBRyxJQUFFSCxHQUFFQyxFQUFDO0FBQUUsV0FBT0M7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRixJQUFFQyxJQUFFO0FBQUMsU0FBSyxJQUFFRCxJQUFFLEtBQUssSUFBRSxDQUFDO0FBQUUsYUFBUUUsS0FBRSxHQUFFQSxLQUFFRCxHQUFFLFFBQU9DLE1BQUk7QUFBQyxVQUFJQyxLQUFFRixHQUFFQyxFQUFDO0FBQUUsV0FBSyxFQUFFQyxHQUFFLENBQUMsSUFBRUE7QUFBQSxJQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUgsSUFBRTtBQUFDLFdBQU9BLEtBQUUsRUFBRUEsR0FBRSxDQUFDLEdBQUUsRUFBRUEsSUFBRSxTQUFTQSxJQUFFQyxJQUFFO0FBQUMsYUFBT0QsR0FBRSxJQUFFQyxHQUFFO0FBQUEsSUFBQyxDQUFDLEdBQUVEO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRUMsSUFBRTtBQUFDLFlBQU8sS0FBSyxJQUFFRCxJQUFFLEtBQUssSUFBRSxDQUFDLENBQUNDLEdBQUUsR0FBRSxLQUFLLElBQUVBLEdBQUUsR0FBRSxLQUFLLElBQUVBLEdBQUUsTUFBSyxLQUFLLElBQUUsT0FBRyxLQUFLLEdBQUU7QUFBQSxNQUFDLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBRSxhQUFLLElBQUU7QUFBQSxJQUFFO0FBQUMsU0FBSyxJQUFFQSxHQUFFO0FBQUEsRUFBWTtBQUFDLFdBQVMsSUFBRztBQUFDLFNBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJQUFFLEtBQUssRUFBRSxFQUFFLEdBQUUsS0FBSyxJQUFFLEtBQUssSUFBRTtBQUFBLEVBQUk7QUFBQyxXQUFTLEVBQUVELElBQUVDLElBQUU7QUFBQyxhQUFRQyxLQUFFLEVBQUVGLEdBQUUsRUFBRSxDQUFDLEdBQUVHLEtBQUUsR0FBRUEsS0FBRUQsR0FBRSxRQUFPQyxNQUFJO0FBQUMsVUFBSUMsS0FBRUYsR0FBRUMsRUFBQyxHQUFFRSxLQUFFRCxHQUFFO0FBQUUsVUFBRyxRQUFNSCxHQUFFLEVBQUVJLEVBQUMsR0FBRTtBQUFDLFFBQUFMLEdBQUUsS0FBRyxPQUFPQSxHQUFFLEVBQUVJLEdBQUUsQ0FBQztBQUFFLFlBQUlFLEtBQUUsTUFBSUYsR0FBRSxLQUFHLE1BQUlBLEdBQUU7QUFBRSxZQUFHQSxHQUFFLEVBQUUsVUFBUUEsS0FBRSxFQUFFSCxJQUFFSSxFQUFDLEtBQUcsQ0FBQyxHQUFFRSxLQUFFLEdBQUVBLEtBQUVILEdBQUUsUUFBT0csTUFBSTtBQUFDLGNBQUlDLEtBQUVSLElBQUVTLEtBQUVKLElBQUVLLEtBQUVKLEtBQUVGLEdBQUVHLEVBQUMsRUFBRSxNQUFNLElBQUVILEdBQUVHLEVBQUM7QUFBRSxVQUFBQyxHQUFFLEVBQUVDLEVBQUMsTUFBSUQsR0FBRSxFQUFFQyxFQUFDLElBQUUsQ0FBQyxJQUFHRCxHQUFFLEVBQUVDLEVBQUMsRUFBRSxLQUFLQyxFQUFDLEdBQUVGLEdBQUUsS0FBRyxPQUFPQSxHQUFFLEVBQUVDLEVBQUM7QUFBQSxRQUFDO0FBQUEsWUFBTSxDQUFBTCxLQUFFLEVBQUVILElBQUVJLEVBQUMsR0FBRUMsTUFBR0EsS0FBRSxFQUFFTixJQUFFSyxFQUFDLEtBQUcsRUFBRUMsSUFBRUYsRUFBQyxJQUFFLEVBQUVKLElBQUVLLElBQUVELEdBQUUsTUFBTSxDQUFDLElBQUUsRUFBRUosSUFBRUssSUFBRUQsRUFBQztBQUFBLE1BQUM7QUFBQSxJQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUosSUFBRUMsSUFBRTtBQUFDLFFBQUlDLEtBQUVGLEdBQUUsRUFBRUMsRUFBQztBQUFFLFFBQUcsUUFBTUMsR0FBRSxRQUFPO0FBQUssUUFBR0YsR0FBRSxHQUFFO0FBQUMsVUFBRyxFQUFFQyxNQUFLRCxHQUFFLElBQUc7QUFBQyxZQUFJRyxLQUFFSCxHQUFFLEdBQUVJLEtBQUVKLEdBQUUsRUFBRUMsRUFBQztBQUFFLFlBQUcsUUFBTUMsR0FBRSxLQUFHRSxHQUFFLEdBQUU7QUFBQyxtQkFBUUMsS0FBRSxDQUFDLEdBQUVDLEtBQUUsR0FBRUEsS0FBRUosR0FBRSxRQUFPSSxLQUFJLENBQUFELEdBQUVDLEVBQUMsSUFBRUgsR0FBRSxFQUFFQyxJQUFFRixHQUFFSSxFQUFDLENBQUM7QUFBRSxVQUFBSixLQUFFRztBQUFBLFFBQUMsTUFBTSxDQUFBSCxLQUFFQyxHQUFFLEVBQUVDLElBQUVGLEVBQUM7QUFBRSxlQUFPRixHQUFFLEVBQUVDLEVBQUMsSUFBRUM7QUFBQSxNQUFDO0FBQUMsYUFBT0YsR0FBRSxFQUFFQyxFQUFDO0FBQUEsSUFBQztBQUFDLFdBQU9DO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUYsSUFBRUMsSUFBRUMsSUFBRTtBQUFDLFFBQUlDLEtBQUUsRUFBRUgsSUFBRUMsRUFBQztBQUFFLFdBQU9ELEdBQUUsRUFBRUMsRUFBQyxFQUFFLElBQUVFLEdBQUVELE1BQUcsQ0FBQyxJQUFFQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVILElBQUVDLElBQUU7QUFBQyxRQUFJQztBQUFFLFFBQUcsUUFBTUYsR0FBRSxFQUFFQyxFQUFDLEVBQUUsQ0FBQUMsS0FBRSxFQUFFRixJQUFFQyxJQUFFLE1BQU07QUFBQSxRQUFPLElBQUU7QUFBQyxVQUFHQyxLQUFFRixHQUFFLEVBQUVDLEVBQUMsR0FBRSxXQUFTQyxHQUFFLEdBQUU7QUFBQyxZQUFJQyxLQUFFRCxHQUFFO0FBQUUsWUFBR0MsT0FBSSxRQUFRLENBQUFELEdBQUUsSUFBRTtBQUFBLGlCQUFXQyxPQUFJLE9BQU8sQ0FBQUQsR0FBRSxJQUFFO0FBQUEsYUFBTTtBQUFDLGNBQUdDLE9BQUksUUFBTztBQUFDLFlBQUFELEtBQUUsSUFBSUM7QUFBRSxrQkFBTTtBQUFBLFVBQUM7QUFBQyxVQUFBRCxHQUFFLElBQUVBLEdBQUUsSUFBRSxNQUFJO0FBQUEsUUFBRTtBQUFBLE1BQUM7QUFBQyxNQUFBQSxLQUFFQSxHQUFFO0FBQUEsSUFBQztBQUFDLFdBQU9BO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUYsSUFBRUMsSUFBRTtBQUFDLFdBQU9ELEdBQUUsRUFBRUMsRUFBQyxFQUFFLElBQUUsUUFBTUQsR0FBRSxFQUFFQyxFQUFDLElBQUVELEdBQUUsRUFBRUMsRUFBQyxFQUFFLFNBQU8sSUFBRSxRQUFNRCxHQUFFLEVBQUVDLEVBQUMsSUFBRSxJQUFFO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUQsSUFBRUMsSUFBRUMsSUFBRTtBQUFDLElBQUFGLEdBQUUsRUFBRUMsRUFBQyxJQUFFQyxJQUFFRixHQUFFLE1BQUlBLEdBQUUsRUFBRUMsRUFBQyxJQUFFQztBQUFBLEVBQUU7QUFBQyxXQUFTLEVBQUVGLElBQUVDLElBQUU7QUFBQyxRQUFJQyxJQUFFQyxLQUFFLENBQUM7QUFBRSxTQUFJRCxNQUFLRCxHQUFFLE1BQUdDLE1BQUdDLEdBQUUsS0FBSyxJQUFJLEVBQUVELElBQUVELEdBQUVDLEVBQUMsQ0FBQyxDQUFDO0FBQUUsV0FBTyxJQUFJLEVBQUVGLElBQUVHLEVBQUM7QUFBQSxFQUFDO0FBa0JsZ0UsV0FBUyxJQUFHO0FBQUMsTUFBRSxLQUFLLElBQUk7QUFBQSxFQUFDO0FBQUMsV0FBUyxJQUFHO0FBQUMsTUFBRSxLQUFLLElBQUk7QUFBQSxFQUFDO0FBQUMsV0FBUyxJQUFHO0FBQUMsTUFBRSxLQUFLLElBQUk7QUFBQSxFQUFDO0FBQUMsV0FBUyxJQUFHO0FBQUEsRUFBQztBQUFDLFdBQVMsSUFBRztBQUFBLEVBQUM7QUFBQyxXQUFTLElBQUc7QUFBQSxFQUFDO0FBZ0J2SCxXQUFTLElBQUc7QUFBQyxTQUFLLElBQUUsQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVILElBQUU7QUFBQyxXQUFPLEtBQUdBLEdBQUUsVUFBUSxHQUFHLEtBQUtBLEVBQUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsUUFBRyxRQUFNQSxHQUFFLFFBQU87QUFBSyxJQUFBQSxLQUFFQSxHQUFFLFlBQVk7QUFBRSxRQUFJQyxLQUFFRixHQUFFLEVBQUVDLEVBQUM7QUFBRSxRQUFHLFFBQU1DLElBQUU7QUFBQyxVQUFHQSxLQUFFLEdBQUdELEVBQUMsR0FBRSxRQUFNQyxHQUFFLFFBQU87QUFBSyxNQUFBQSxLQUFHLElBQUksSUFBRyxFQUFFLEVBQUUsRUFBRSxHQUFFQSxFQUFDLEdBQUVGLEdBQUUsRUFBRUMsRUFBQyxJQUFFQztBQUFBLElBQUM7QUFBQyxXQUFPQTtBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVGLElBQUU7QUFBQyxXQUFPQSxLQUFFLEdBQUdBLEVBQUMsR0FBRSxRQUFNQSxLQUFFLE9BQUtBLEdBQUUsQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxTQUFLLElBQUUsT0FBTyxRQUFHLEdBQUUsS0FBSyxJQUFFLElBQUcsS0FBSyxJQUFFLElBQUksS0FBRSxLQUFLLElBQUUsSUFBRyxLQUFLLElBQUUsSUFBSSxLQUFFLEtBQUssSUFBRSxJQUFJLEtBQUUsS0FBSyxJQUFFLE1BQUcsS0FBSyxJQUFFLEtBQUssSUFBRSxLQUFLLElBQUUsT0FBRyxLQUFLLElBQUUsRUFBRSxFQUFFLEdBQUUsS0FBSyxJQUFFLEdBQUUsS0FBSyxJQUFFLElBQUksS0FBRSxLQUFLLElBQUUsT0FBRyxLQUFLLElBQUUsSUFBRyxLQUFLLElBQUUsSUFBSSxLQUFFLEtBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJQUFFQSxJQUFFLEtBQUssSUFBRSxLQUFLLElBQUUsRUFBRSxNQUFLLEtBQUssQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUVDLElBQUU7QUFBQyxRQUFJQztBQUFFLFFBQUcsUUFBTUQsTUFBRyxNQUFNQSxFQUFDLEtBQUdBLEdBQUUsWUFBWSxLQUFJLElBQUc7QUFBQyxVQUFHQyxLQUFFLEVBQUVGLEdBQUUsR0FBRUMsRUFBQyxHQUFFLFFBQU1DLEdBQUUsT0FBTSxNQUFNLDBCQUF3QkQsRUFBQztBQUFFLE1BQUFDLEtBQUUsRUFBRUEsSUFBRSxFQUFFO0FBQUEsSUFBQyxNQUFNLENBQUFBLEtBQUU7QUFBRSxXQUFPQSxLQUFFLEVBQUVGLEdBQUUsR0FBRSxFQUFFRSxFQUFDLENBQUMsR0FBRSxRQUFNQSxLQUFFQSxLQUFFO0FBQUEsRUFBRTtBQUFDLFdBQVMsRUFBRUYsSUFBRTtBQUFDLGFBQVFDLEtBQUVELEdBQUUsRUFBRSxRQUFPRSxLQUFFLEdBQUVBLEtBQUVELElBQUUsRUFBRUMsSUFBRTtBQUFDLFVBQUlFLEtBQUVKLEdBQUUsRUFBRUUsRUFBQyxHQUFFRyxLQUFFLEVBQUVELElBQUUsQ0FBQztBQUFFLFVBQUdKLEdBQUUsS0FBR0ssR0FBRSxRQUFNO0FBQUcsVUFBSUM7QUFBRSxNQUFBQSxLQUFFTjtBQUFFLFVBQUlPLEtBQUVILElBQUVPLEtBQUUsRUFBRUosSUFBRSxDQUFDO0FBQUUsVUFBRyxNQUFJSSxHQUFFLFFBQVEsR0FBRyxFQUFFLENBQUFMLEtBQUU7QUFBQSxXQUFPO0FBQUMsUUFBQUssS0FBRUEsR0FBRSxRQUFRLElBQUcsS0FBSyxHQUFFQSxLQUFFQSxHQUFFLFFBQVEsSUFBRyxLQUFLLEdBQUUsRUFBRUwsR0FBRSxDQUFDO0FBQUUsWUFBSUU7QUFBRSxRQUFBQSxLQUFFRjtBQUFFLFlBQUlDLEtBQUUsRUFBRUEsSUFBRSxDQUFDLEdBQUVFLEtBQUUsa0JBQWtCLE1BQU1FLEVBQUMsRUFBRSxDQUFDO0FBQUUsUUFBQUYsR0FBRSxTQUFPRCxHQUFFLEVBQUUsRUFBRSxTQUFPQSxLQUFFLE1BQUlBLEtBQUVDLEdBQUUsUUFBUSxJQUFJLE9BQU9FLElBQUUsR0FBRyxHQUFFSixFQUFDLEdBQUVDLEtBQUVBLEdBQUUsUUFBUSxPQUFPLEtBQUksR0FBRyxHQUFFLFFBQUcsSUFBRyxJQUFFQSxHQUFFLFVBQVFGLEdBQUUsRUFBRSxFQUFFRSxFQUFDLEdBQUVGLEtBQUUsUUFBSUEsS0FBRTtBQUFBLE1BQUU7QUFBQyxVQUFHQSxHQUFFLFFBQU9OLEdBQUUsSUFBRUssSUFBRUwsR0FBRSxJQUFFLEdBQUcsS0FBSyxFQUFFSSxJQUFFLENBQUMsQ0FBQyxHQUFFSixHQUFFLElBQUUsR0FBRTtBQUFBLElBQUU7QUFBQyxXQUFPQSxHQUFFLElBQUU7QUFBQSxFQUFFO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsYUFBUUMsS0FBRSxDQUFDLEdBQUVDLEtBQUVGLEdBQUUsU0FBTyxHQUFFRyxLQUFFSixHQUFFLEVBQUUsUUFBT0ssS0FBRSxHQUFFQSxLQUFFRCxJQUFFLEVBQUVDLElBQUU7QUFBQyxVQUFJQyxLQUFFTixHQUFFLEVBQUVLLEVBQUM7QUFBRSxXQUFHLEVBQUVDLElBQUUsQ0FBQyxJQUFFSixHQUFFLEtBQUtGLEdBQUUsRUFBRUssRUFBQyxDQUFDLEtBQUdDLEtBQUUsRUFBRUEsSUFBRSxHQUFFLEtBQUssSUFBSUgsSUFBRSxFQUFFRyxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBRSxLQUFHTCxHQUFFLE9BQU9LLEVBQUMsS0FBR0osR0FBRSxLQUFLRixHQUFFLEVBQUVLLEVBQUMsQ0FBQztBQUFBLElBQUU7QUFBQyxJQUFBTCxHQUFFLElBQUVFO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUYsSUFBRUMsSUFBRTtBQUFDLElBQUFELEdBQUUsRUFBRSxFQUFFQyxFQUFDO0FBQUUsUUFBSUMsS0FBRUQ7QUFBRSxRQUFHLEdBQUcsS0FBS0MsRUFBQyxLQUFHLEtBQUdGLEdBQUUsRUFBRSxFQUFFLFVBQVEsR0FBRyxLQUFLRSxFQUFDLEdBQUU7QUFBQyxVQUFJRSxJQUFFRixLQUFFRDtBQUFFLGFBQUtDLE1BQUdFLEtBQUVGLElBQUVGLEdBQUUsRUFBRSxFQUFFRSxFQUFDLE1BQUlFLEtBQUUsR0FBR0YsRUFBQyxHQUFFRixHQUFFLEVBQUUsRUFBRUksRUFBQyxHQUFFSixHQUFFLEVBQUUsRUFBRUksRUFBQyxJQUFHSCxLQUFFRztBQUFBLElBQUMsTUFBTSxDQUFBSixHQUFFLElBQUUsT0FBR0EsR0FBRSxJQUFFO0FBQUcsUUFBRyxDQUFDQSxHQUFFLEdBQUU7QUFBQyxVQUFHLENBQUNBLEdBQUU7QUFBRSxZQUFHLEVBQUVBLEVBQUMsR0FBRTtBQUFDLGNBQUcsRUFBRUEsRUFBQyxFQUFFLFFBQU8sRUFBRUEsRUFBQztBQUFBLFFBQUMsV0FBUyxJQUFFQSxHQUFFLEVBQUUsV0FBU0UsS0FBRUYsR0FBRSxFQUFFLFNBQVMsR0FBRSxFQUFFQSxHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLEVBQUUsRUFBRUUsRUFBQyxHQUFFQSxLQUFFRixHQUFFLEVBQUUsU0FBUyxHQUFFSSxLQUFFRixHQUFFLFlBQVlGLEdBQUUsQ0FBQyxHQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLEVBQUUsRUFBRUUsR0FBRSxVQUFVLEdBQUVFLEVBQUMsQ0FBQyxJQUFHSixHQUFFLEtBQUcsRUFBRUEsRUFBQyxFQUFFLFFBQU9BLEdBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRSxFQUFFQSxFQUFDO0FBQUE7QUFBRSxhQUFPQSxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxZQUFPQSxHQUFFLEVBQUUsRUFBRSxRQUFPO0FBQUEsTUFBQyxLQUFLO0FBQUEsTUFBRSxLQUFLO0FBQUEsTUFBRSxLQUFLO0FBQUUsZUFBT0EsR0FBRSxFQUFFLFNBQVM7QUFBQSxNQUFFLEtBQUs7QUFBRSxZQUFHLENBQUMsRUFBRUEsRUFBQyxFQUFFLFFBQU9BLEdBQUUsSUFBRSxFQUFFQSxFQUFDLEdBQUUsRUFBRUEsRUFBQztBQUFFLFFBQUFBLEdBQUUsSUFBRTtBQUFBLE1BQUc7QUFBUSxlQUFPQSxHQUFFLEtBQUcsRUFBRUEsRUFBQyxNQUFJQSxHQUFFLElBQUUsUUFBSUEsR0FBRSxFQUFFLFNBQVMsSUFBRUEsR0FBRSxFQUFFLFNBQVMsS0FBRyxJQUFFQSxHQUFFLEVBQUUsVUFBUUUsS0FBRSxFQUFFRixJQUFFQyxFQUFDLEdBQUVHLEtBQUUsRUFBRUosRUFBQyxHQUFFLElBQUVJLEdBQUUsU0FBT0EsTUFBRyxFQUFFSixJQUFFQSxHQUFFLEVBQUUsU0FBUyxDQUFDLEdBQUUsRUFBRUEsRUFBQyxJQUFFLEVBQUVBLEVBQUMsSUFBRUEsR0FBRSxJQUFFLEVBQUVBLElBQUVFLEVBQUMsSUFBRUYsR0FBRSxFQUFFLFNBQVMsTUFBSSxFQUFFQSxFQUFDO0FBQUEsSUFBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxXQUFPQSxHQUFFLElBQUUsTUFBR0EsR0FBRSxJQUFFLE9BQUdBLEdBQUUsSUFBRSxDQUFDLEdBQUVBLEdBQUUsSUFBRSxHQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLElBQUUsSUFBRyxFQUFFQSxFQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLGFBQVFDLEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUVFLEtBQUVGLEdBQUUsRUFBRSxRQUFPRyxLQUFFLEdBQUVBLEtBQUVELElBQUUsRUFBRUMsSUFBRTtBQUFDLFVBQUlDLEtBQUVKLEdBQUUsRUFBRUcsRUFBQyxHQUFFRSxLQUFFLEVBQUVELElBQUUsQ0FBQztBQUFFLFVBQUcsSUFBSSxPQUFPLFNBQU9DLEtBQUUsSUFBSSxFQUFFLEtBQUtKLEVBQUMsRUFBRSxRQUFPRCxHQUFFLElBQUUsR0FBRyxLQUFLLEVBQUVJLElBQUUsQ0FBQyxDQUFDLEdBQUVILEtBQUVBLEdBQUUsUUFBUSxJQUFJLE9BQU9JLElBQUUsR0FBRyxHQUFFLEVBQUVELElBQUUsQ0FBQyxDQUFDLEdBQUUsRUFBRUosSUFBRUMsRUFBQztBQUFBLElBQUM7QUFBQyxXQUFNO0FBQUEsRUFBRTtBQUFDLFdBQVMsRUFBRUQsSUFBRUMsSUFBRTtBQUFDLFFBQUlDLEtBQUVGLEdBQUUsRUFBRSxFQUFFO0FBQU8sV0FBT0EsR0FBRSxLQUFHLElBQUVFLE1BQUcsT0FBS0YsR0FBRSxFQUFFLFNBQVMsRUFBRSxPQUFPRSxLQUFFLENBQUMsSUFBRUYsR0FBRSxJQUFFLE1BQUlDLEtBQUVELEdBQUUsSUFBRUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRCxJQUFFO0FBQUMsUUFBSUMsS0FBRUQsR0FBRSxFQUFFLFNBQVM7QUFBRSxRQUFHLEtBQUdDLEdBQUUsUUFBTztBQUFDLGVBQVFDLEtBQUVGLEdBQUUsS0FBRyxLQUFHQSxHQUFFLEVBQUUsVUFBUSxJQUFFLEVBQUVBLEdBQUUsR0FBRSxFQUFFLElBQUUsRUFBRUEsR0FBRSxHQUFFLEVBQUUsS0FBRyxDQUFDLElBQUUsRUFBRUEsR0FBRSxHQUFFLEVBQUUsS0FBRyxDQUFDLEdBQUVHLEtBQUVELEdBQUUsUUFBT0UsS0FBRSxHQUFFQSxLQUFFRCxJQUFFLEVBQUVDLElBQUU7QUFBQyxZQUFJQyxLQUFFSCxHQUFFRSxFQUFDO0FBQUUsWUFBRUosR0FBRSxFQUFFLFVBQVEsRUFBRSxFQUFFSyxJQUFFLENBQUMsQ0FBQyxLQUFHLENBQUMsRUFBRUEsSUFBRSxDQUFDLEtBQUcsUUFBTUEsR0FBRSxFQUFFLENBQUMsTUFBSSxLQUFHTCxHQUFFLEVBQUUsVUFBUUEsR0FBRSxLQUFHLEVBQUUsRUFBRUssSUFBRSxDQUFDLENBQUMsS0FBRyxFQUFFQSxJQUFFLENBQUMsTUFBSSxHQUFHLEtBQUssRUFBRUEsSUFBRSxDQUFDLENBQUMsS0FBR0wsR0FBRSxFQUFFLEtBQUtLLEVBQUM7QUFBQSxNQUFDO0FBQUMsYUFBTyxFQUFFTCxJQUFFQyxFQUFDLEdBQUVBLEtBQUUsRUFBRUQsRUFBQyxHQUFFLElBQUVDLEdBQUUsU0FBT0EsS0FBRSxFQUFFRCxFQUFDLElBQUUsRUFBRUEsRUFBQyxJQUFFQSxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxXQUFPLEVBQUVBLElBQUVDLEVBQUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRCxJQUFFO0FBQUMsUUFBSUMsS0FBRUQsR0FBRSxFQUFFLFNBQVMsR0FBRUUsS0FBRUQsR0FBRTtBQUFPLFFBQUcsSUFBRUMsSUFBRTtBQUFDLGVBQVFDLEtBQUUsSUFBR0MsS0FBRSxHQUFFQSxLQUFFRixJQUFFRSxLQUFJLENBQUFELEtBQUUsRUFBRUgsSUFBRUMsR0FBRSxPQUFPRyxFQUFDLENBQUM7QUFBRSxhQUFPSixHQUFFLElBQUUsRUFBRUEsSUFBRUcsRUFBQyxJQUFFSCxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxXQUFPQSxHQUFFLEVBQUUsU0FBUztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxRQUFJQyxJQUFFQyxLQUFFRixHQUFFLEVBQUUsU0FBUyxHQUFFSSxLQUFFO0FBQUUsV0FBTyxLQUFHLEVBQUVKLEdBQUUsR0FBRSxFQUFFLElBQUVDLEtBQUUsU0FBSUEsS0FBRUQsR0FBRSxFQUFFLFNBQVMsR0FBRUMsS0FBRSxPQUFLQSxHQUFFLE9BQU8sQ0FBQyxLQUFHLE9BQUtBLEdBQUUsT0FBTyxDQUFDLEtBQUcsT0FBS0EsR0FBRSxPQUFPLENBQUMsSUFBR0EsTUFBR0csS0FBRSxHQUFFSixHQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEdBQUVBLEdBQUUsSUFBRSxRQUFJLFFBQU1BLEdBQUUsRUFBRSxFQUFFLEVBQUUsTUFBSUMsS0FBRSxJQUFJLE9BQU8sU0FBTyxFQUFFRCxHQUFFLEdBQUUsRUFBRSxJQUFFLEdBQUcsR0FBRUMsS0FBRUMsR0FBRSxNQUFNRCxFQUFDLEdBQUUsUUFBTUEsTUFBRyxRQUFNQSxHQUFFLENBQUMsS0FBRyxJQUFFQSxHQUFFLENBQUMsRUFBRSxXQUFTRCxHQUFFLElBQUUsTUFBR0ksS0FBRUgsR0FBRSxDQUFDLEVBQUUsUUFBT0QsR0FBRSxFQUFFLEVBQUVFLEdBQUUsVUFBVSxHQUFFRSxFQUFDLENBQUMsS0FBSSxFQUFFSixHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVFLEdBQUUsVUFBVUUsRUFBQyxDQUFDLEdBQUVGLEdBQUUsVUFBVSxHQUFFRSxFQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUosSUFBRTtBQUFDLFFBQUlDLEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUVFLEtBQUUsSUFBSSxPQUFPLGFBQVcsRUFBRUYsR0FBRSxHQUFFLEVBQUUsSUFBRSxHQUFHLEdBQUVFLEtBQUVELEdBQUUsTUFBTUMsRUFBQztBQUFFLFdBQU8sUUFBTUEsTUFBRyxRQUFNQSxHQUFFLENBQUMsS0FBRyxJQUFFQSxHQUFFLENBQUMsRUFBRSxXQUFTRixHQUFFLElBQUUsTUFBR0UsS0FBRUEsR0FBRSxDQUFDLEVBQUUsUUFBTyxFQUFFRixHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVDLEdBQUUsVUFBVUMsRUFBQyxDQUFDLEdBQUUsRUFBRUYsR0FBRSxDQUFDLEdBQUVBLEdBQUUsRUFBRSxFQUFFQyxHQUFFLFVBQVUsR0FBRUMsRUFBQyxDQUFDLEdBQUUsT0FBS0QsR0FBRSxPQUFPLENBQUMsS0FBR0QsR0FBRSxFQUFFLEVBQUUsR0FBRyxHQUFFO0FBQUEsRUFBRztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLFFBQUcsS0FBR0EsR0FBRSxFQUFFLEVBQUUsT0FBTyxRQUFNO0FBQUcsUUFBSUMsSUFBRUcsS0FBRSxJQUFJO0FBQUUsT0FBRTtBQUFDLFVBQUdILEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUUsS0FBR0MsR0FBRSxVQUFRLE9BQUtBLEdBQUUsT0FBTyxDQUFDO0FBQUUsaUJBQVFJLElBQUVDLEtBQUVMLEdBQUUsUUFBT00sS0FBRSxHQUFFLEtBQUdBLE1BQUdBLE1BQUdELElBQUUsRUFBRUMsR0FBRSxLQUFHRixLQUFFLFNBQVNKLEdBQUUsVUFBVSxHQUFFTSxFQUFDLEdBQUUsRUFBRSxHQUFFRixNQUFLLElBQUc7QUFBQyxVQUFBRCxHQUFFLEVBQUVILEdBQUUsVUFBVU0sRUFBQyxDQUFDLEdBQUVOLEtBQUVJO0FBQUUsZ0JBQU07QUFBQSxRQUFDO0FBQUE7QUFBQyxNQUFBSixLQUFFO0FBQUEsSUFBQztBQUFDLFdBQU8sS0FBR0EsT0FBSSxFQUFFRCxHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVJLEdBQUUsU0FBUyxDQUFDLEdBQUVBLEtBQUUsRUFBRUgsRUFBQyxHQUFFLFNBQU9HLEtBQUVKLEdBQUUsSUFBRSxFQUFFQSxHQUFFLEdBQUUsS0FBR0MsRUFBQyxJQUFFRyxNQUFHSixHQUFFLE1BQUlBLEdBQUUsSUFBRSxFQUFFQSxJQUFFSSxFQUFDLElBQUdKLEdBQUUsRUFBRSxFQUFFLEtBQUdDLEVBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRUQsR0FBRSxJQUFFLElBQUc7QUFBQSxFQUFHO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsUUFBSUMsS0FBRUYsR0FBRSxFQUFFLFNBQVM7QUFBRSxRQUFHLEtBQUdFLEdBQUUsVUFBVUYsR0FBRSxDQUFDLEVBQUUsT0FBT0EsR0FBRSxDQUFDLEdBQUU7QUFBQyxVQUFJSSxLQUFFRixHQUFFLE9BQU9GLEdBQUUsQ0FBQyxHQUFFRSxLQUFFQSxHQUFFLFFBQVFGLEdBQUUsR0FBRUMsRUFBQztBQUFFLGFBQU8sRUFBRUQsR0FBRSxDQUFDLEdBQUVBLEdBQUUsRUFBRSxFQUFFRSxFQUFDLEdBQUVGLEdBQUUsSUFBRUksSUFBRUYsR0FBRSxVQUFVLEdBQUVGLEdBQUUsSUFBRSxDQUFDO0FBQUEsSUFBQztBQUFDLFdBQU8sS0FBR0EsR0FBRSxFQUFFLFdBQVNBLEdBQUUsSUFBRSxRQUFJQSxHQUFFLElBQUUsSUFBR0EsR0FBRSxFQUFFLFNBQVM7QUFBQSxFQUFDO0FBQUMsTUFBSSxJQUFFO0FBQUssSUFBRSxVQUFVLElBQUUsSUFBRyxFQUFFLFVBQVUsTUFBSSxTQUFTQSxJQUFFO0FBQUMsU0FBSyxJQUFFLEtBQUdBO0FBQUEsRUFBQyxHQUFFLEVBQUUsVUFBVSxJQUFFLFNBQVNBLElBQUVDLElBQUVDLElBQUU7QUFBQyxRQUFHLEtBQUssS0FBRyxPQUFPRixFQUFDLEdBQUUsUUFBTUMsR0FBRSxVQUFRRSxLQUFFLEdBQUVBLEtBQUUsVUFBVSxRQUFPQSxLQUFJLE1BQUssS0FBRyxVQUFVQSxFQUFDO0FBQUUsV0FBTztBQUFBLEVBQUksR0FBRSxFQUFFLFVBQVUsV0FBUyxXQUFVO0FBQUMsV0FBTyxLQUFLO0FBQUEsRUFBQztBQUFFLE1BQUksSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBRSxHQUFFLElBQUUsR0FBRSxJQUFFLElBQUcsSUFBRTtBQUFHLElBQUUsVUFBVSxNQUFJLFNBQVNILElBQUVDLElBQUU7QUFBQyxNQUFFLE1BQUtELEdBQUUsR0FBRUMsRUFBQztBQUFBLEVBQUMsR0FBRSxFQUFFLFVBQVUsUUFBTSxXQUFVO0FBQUMsUUFBSUQsS0FBRSxJQUFJLEtBQUs7QUFBWSxXQUFPQSxNQUFHLFNBQU9BLEdBQUUsSUFBRSxDQUFDLEdBQUVBLEdBQUUsTUFBSUEsR0FBRSxJQUFFLENBQUMsSUFBRyxFQUFFQSxJQUFFLElBQUksSUFBR0E7QUFBQSxFQUFDLEdBQUUsRUFBRSxHQUFFLENBQUM7QUFBRSxNQUFJLElBQUU7QUFBSyxJQUFFLEdBQUUsQ0FBQztBQUFFLE1BQUksSUFBRTtBQUFLLElBQUUsR0FBRSxDQUFDO0FBQUUsTUFBSSxJQUFFO0FBQUssSUFBRSxVQUFVLElBQUUsV0FBVTtBQUFDLFFBQUlBLEtBQUU7QUFBRSxXQUFPQSxPQUFJLElBQUVBLEtBQUUsRUFBRSxHQUFFLEVBQUMsR0FBRSxFQUFDLE1BQUssZ0JBQWUsR0FBRSxpQ0FBZ0MsR0FBRSxHQUFFLEVBQUMsTUFBSyxXQUFVLFVBQVMsTUFBRyxHQUFFLEdBQUUsTUFBSyxPQUFNLEdBQUUsR0FBRSxFQUFDLE1BQUssVUFBUyxVQUFTLE1BQUcsR0FBRSxHQUFFLE1BQUssT0FBTSxHQUFFLEdBQUUsRUFBQyxNQUFLLDBCQUF5QixHQUFFLE1BQUcsR0FBRSxHQUFFLE1BQUssT0FBTSxHQUFF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MkgsTUFBSyxNQUFLLE1BQUssZ0JBQWUsTUFBSyxNQUFLLENBQUMsSUFBRyxFQUFFLENBQUMsQ0FBQyxFQUFDO0FBQUUsSUFBRSxJQUFFLFdBQVU7QUFBQyxXQUFPLEVBQUUsSUFBRSxFQUFFLElBQUUsRUFBRSxJQUFFLElBQUk7QUFBQSxFQUFDO0FBQUUsTUFBSSxLQUFHLEVBQUMsR0FBRSxLQUFJLEdBQUUsS0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLEdBQUUsS0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLEdBQUUsS0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxJQUFHLEdBQUUsS0FBRyxPQUFPLFlBQU8sR0FBRSxLQUFHLE9BQU8sZ0RBQWtCLEdBQUUsS0FBRyxlQUFjLEtBQUcsSUFBSTtBQUFFLElBQUUsSUFBRyxJQUFHLElBQUk7QUFBRSxNQUFJLEtBQUcsbUJBQWtCLEtBQUcscUJBQW9CLEtBQUcsT0FBTyxtUUFBdUYsR0FBRSxLQUFHO0FBQU8sSUFBRSxVQUFVLElBQUUsV0FBVTtBQUFDLFNBQUssSUFBRSxJQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUUsRUFBRSxLQUFLLENBQUMsR0FBRSxFQUFFLEtBQUssQ0FBQyxHQUFFLEtBQUssSUFBRSxHQUFFLEtBQUssSUFBRSxJQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUUsS0FBSyxJQUFFLElBQUcsRUFBRSxLQUFLLENBQUMsR0FBRSxLQUFLLElBQUUsTUFBRyxLQUFLLElBQUUsS0FBSyxJQUFFLEtBQUssSUFBRSxPQUFHLEtBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJQUFFLE9BQUcsS0FBSyxLQUFHLEtBQUssTUFBSSxLQUFLLElBQUUsRUFBRSxNQUFLLEtBQUssQ0FBQztBQUFBLEVBQUUsR0FBRSxFQUFFLFVBQVUsSUFBRSxTQUFTRCxJQUFFO0FBQUMsV0FBTyxLQUFLLElBQUUsRUFBRSxNQUFLQSxFQUFDO0FBQUEsRUFBQyxHQUFFLEVBQUUsNkJBQTRCLENBQUMsR0FBRSxFQUFFLGtEQUFpRCxFQUFFLFVBQVUsQ0FBQyxHQUFFLEVBQUUsNkNBQTRDLEVBQUUsVUFBVSxDQUFDO0FBQUMsRUFBRSxLQUFLLFlBQVUsT0FBTyxVQUFRLFNBQU8sU0FBTyxNQUFNOzs7QUNoQ3g3SixJQUFNLHFCQUFOLE1BQU0sbUJBQWtCO0FBQUEsRUFpQjdCLE9BQWMsY0FDWixRQUNtQyxXQUM3QjtBQUVOLFFBQUksTUFBTSxRQUFRLE9BQU8sTUFBTSxHQUFHO0FBQ2hDLGFBQU8sU0FBVSxPQUFPLE9BQXlCLENBQUM7QUFBQSxJQUNwRDtBQUNBLFFBQUksTUFBTSxRQUFRLE9BQU8sSUFBSSxHQUFHO0FBQzlCLGFBQU8sT0FBUSxPQUFPLEtBQXdCLENBQUM7QUFBQSxJQUNqRDtBQUNBLFFBQUksTUFBTSxRQUFRLE9BQU8sT0FBTyxHQUFHO0FBQ2pDLGFBQU8sVUFBVyxPQUFPLFFBQTBCLENBQUM7QUFBQSxJQUN0RDtBQUNBLFFBQUksTUFBTSxRQUFRLE9BQU8sT0FBTyxHQUFHO0FBQ2pDLGFBQU8sVUFBVyxPQUFPLFFBQTBCLENBQUM7QUFBQSxJQUN0RDtBQUNBLFFBQUksTUFBTSxRQUFRLE9BQU8sU0FBUyxHQUFHO0FBQ25DLGFBQU8sWUFBYSxPQUFPLFVBQTRCLENBQUM7QUFBQSxJQUMxRDtBQUNBLFFBQUksTUFBTSxRQUFRLE9BQU8sV0FBVyxHQUFHO0FBQ3JDLGFBQU8sY0FBZSxPQUFPLFlBQXFDLENBQUM7QUFBQSxJQUNyRTtBQUdBLFFBQUksVUFBVSxRQUFRLFlBQVksTUFBTSxTQUFTO0FBQy9DO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBd0IsT0FBTyxTQUNqQyxPQUFPLE9BQU8sV0FBVyxXQUN0QixLQUFLLE1BQU0sT0FBTyxPQUFPLFFBQVEsS0FBSyxHQUFHLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUM1RCxPQUFPLFNBQ1Y7QUFBQSxNQUNFLE1BQU0sT0FBTyxPQUFRLE9BQU8sT0FBbUI7QUFBQSxNQUMvQyxTQUFTLE9BQU8sV0FBVyxPQUFPLE9BQU8sWUFBWSxXQUFZLE9BQU8sVUFBcUI7QUFBQSxNQUM3RixTQUFTLE9BQU8sV0FBVyxPQUFPLE9BQU8sWUFBWSxXQUFZLE9BQU8sVUFBcUI7QUFBQSxNQUM3RixXQUFXLE9BQU8sYUFBYSxPQUFPLE9BQU8sY0FBYyxXQUFZLE9BQU8sWUFBdUI7QUFBQSxNQUNyRyxhQUFhLE9BQU8sY0FDaEIsS0FBSyxRQUFnQixPQUFPLGFBQWEsUUFBUSxFQUFFLE1BQU0sR0FBRyxJQUM1RCxDQUFDLEtBQUssS0FBSyxHQUFHO0FBQUEsSUFDcEI7QUFHSixRQUFJLG1CQUFPLFdBQTBCLE1BQU07QUFBQSxFQUM3QztBQUFBLEVBS0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQWMsY0FBdUIsTUFBTTtBQUN6QyxhQUFPLE9BQU8sTUFBTSxzQkFBc0IscUJBQXFCLG1CQUFrQixhQUFhO0FBQUEsSUFDaEcsR0FBRztBQUFBO0FBQUE7QUFFTDtBQXREZ0I7QUFBQSxFQURiLElBQUk7QUFBQSxFQUdGLHNCQUFHLElBQUksU0FBUyxPQUFPLFNBQVM7QUFBQSxHQW5CeEIsb0JBaUJHO0FBakJULElBQU0sb0JBQU47IiwKICAibmFtZXMiOiBbIlV0aWwiLCAibiIsICJ0IiwgImUiLCAibCIsICJyIiwgImkiLCAidSIsICJhIiwgInMiLCAiZiIsICJoIiwgIm8iXQp9Cg==
