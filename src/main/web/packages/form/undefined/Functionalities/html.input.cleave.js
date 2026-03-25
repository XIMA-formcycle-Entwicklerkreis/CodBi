import { EQ } from "./chunk-RI3LWO6O.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { __decorateClass, __decorateParam } from "./chunk-AOJQKO6T.js";

// ../../node_modules/cleave.js/dist/cleave-esm.js
var commonjsGlobal =
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : typeof self !== "undefined"
        ? self
        : {};
var NumeralFormatter = function (
  numeralDecimalMark,
  numeralIntegerScale,
  numeralDecimalScale,
  numeralThousandsGroupStyle,
  numeralPositiveOnly,
  stripLeadingZeroes,
  prefix,
  signBeforePrefix,
  tailPrefix,
  delimiter,
) {
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
  none: "none",
};
NumeralFormatter.prototype = {
  getRawValue: function (value) {
    return value.replace(this.delimiterRE, "").replace(this.numeralDecimalMark, ".");
  },
  format: function (value) {
    var owner = this,
      parts,
      partSign,
      partSignAndPrefix,
      partInteger,
      partDecimal = "";
    value = value
      .replace(/[A-Za-z]/g, "")
      .replace(owner.numeralDecimalMark, "M")
      .replace(/[^\dM-]/g, "")
      .replace(/^\-/, "N")
      .replace(/\-/g, "")
      .replace("N", owner.numeralPositiveOnly ? "" : "-")
      .replace("M", owner.numeralDecimalMark);
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
      return (
        partSign + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : "") + owner.prefix
      );
    }
    return partSignAndPrefix + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : "");
  },
};
var NumeralFormatter_1 = NumeralFormatter;
var DateFormatter = function (datePattern, dateMin, dateMax) {
  var owner = this;
  owner.date = [];
  owner.blocks = [];
  owner.datePattern = datePattern;
  owner.dateMin = dateMin
    .split("-")
    .reverse()
    .map(function (x) {
      return parseInt(x, 10);
    });
  if (owner.dateMin.length === 2) owner.dateMin.unshift(0);
  owner.dateMax = dateMax
    .split("-")
    .reverse()
    .map(function (x) {
      return parseInt(x, 10);
    });
  if (owner.dateMax.length === 2) owner.dateMax.unshift(0);
  owner.initBlocks();
};
DateFormatter.prototype = {
  initBlocks: function () {
    var owner = this;
    owner.datePattern.forEach(function (value) {
      if (value === "Y") {
        owner.blocks.push(4);
      } else {
        owner.blocks.push(2);
      }
    });
  },
  getISOFormatDate: function () {
    var owner = this,
      date = owner.date;
    return date[2] ? date[2] + "-" + owner.addLeadingZero(date[1]) + "-" + owner.addLeadingZero(date[0]) : "";
  },
  getBlocks: function () {
    return this.blocks;
  },
  getValidatedDate: function (value) {
    var owner = this,
      result = "";
    value = value.replace(/[^\d]/g, "");
    owner.blocks.forEach(function (length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length),
          sub0 = sub.slice(0, 1),
          rest = value.slice(length);
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
  getFixedDateString: function (value) {
    var owner = this,
      datePattern = owner.datePattern,
      date = [],
      dayIndex = 0,
      monthIndex = 0,
      yearIndex = 0,
      dayStartIndex = 0,
      monthStartIndex = 0,
      yearStartIndex = 0,
      day,
      month,
      year,
      fullYearDone = false;
    if (value.length === 4 && datePattern[0].toLowerCase() !== "y" && datePattern[1].toLowerCase() !== "y") {
      dayStartIndex = datePattern[0] === "d" ? 0 : 2;
      monthStartIndex = 2 - dayStartIndex;
      day = parseInt(value.slice(dayStartIndex, dayStartIndex + 2), 10);
      month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
      date = this.getFixedDate(day, month, 0);
    }
    if (value.length === 8) {
      datePattern.forEach(function (type, index) {
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
    var result =
      date.length === 0
        ? value
        : datePattern.reduce(function (previous, current) {
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
  getRangeFixedDate: function (date) {
    var owner = this,
      datePattern = owner.datePattern,
      dateMin = owner.dateMin || [],
      dateMax = owner.dateMax || [];
    if (!date.length || (dateMin.length < 3 && dateMax.length < 3)) return date;
    if (
      datePattern.find(function (x) {
        return x.toLowerCase() === "y";
      }) &&
      date[2] === 0
    )
      return date;
    if (
      dateMax.length &&
      (dateMax[2] < date[2] ||
        (dateMax[2] === date[2] && (dateMax[1] < date[1] || (dateMax[1] === date[1] && dateMax[0] < date[0]))))
    )
      return dateMax;
    if (
      dateMin.length &&
      (dateMin[2] > date[2] ||
        (dateMin[2] === date[2] && (dateMin[1] > date[1] || (dateMin[1] === date[1] && dateMin[0] > date[0]))))
    )
      return dateMin;
    return date;
  },
  getFixedDate: function (day, month, year) {
    day = Math.min(day, 31);
    month = Math.min(month, 12);
    year = parseInt(year || 0, 10);
    if ((month < 7 && month % 2 === 0) || (month > 8 && month % 2 === 1)) {
      day = Math.min(day, month === 2 ? (this.isLeapYear(year) ? 29 : 28) : 30);
    }
    return [day, month, year];
  },
  isLeapYear: function (year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  },
  addLeadingZero: function (number) {
    return (number < 10 ? "0" : "") + number;
  },
  addLeadingZeroForYear: function (number, fullYearMode) {
    if (fullYearMode) {
      return (number < 10 ? "000" : number < 100 ? "00" : number < 1e3 ? "0" : "") + number;
    }
    return (number < 10 ? "0" : "") + number;
  },
};
var DateFormatter_1 = DateFormatter;
var TimeFormatter = function (timePattern, timeFormat) {
  var owner = this;
  owner.time = [];
  owner.blocks = [];
  owner.timePattern = timePattern;
  owner.timeFormat = timeFormat;
  owner.initBlocks();
};
TimeFormatter.prototype = {
  initBlocks: function () {
    var owner = this;
    owner.timePattern.forEach(function () {
      owner.blocks.push(2);
    });
  },
  getISOFormatTime: function () {
    var owner = this,
      time = owner.time;
    return time[2]
      ? owner.addLeadingZero(time[0]) + ":" + owner.addLeadingZero(time[1]) + ":" + owner.addLeadingZero(time[2])
      : "";
  },
  getBlocks: function () {
    return this.blocks;
  },
  getTimeFormatOptions: function () {
    var owner = this;
    if (String(owner.timeFormat) === "12") {
      return {
        maxHourFirstDigit: 1,
        maxHours: 12,
        maxMinutesFirstDigit: 5,
        maxMinutes: 60,
      };
    }
    return {
      maxHourFirstDigit: 2,
      maxHours: 23,
      maxMinutesFirstDigit: 5,
      maxMinutes: 60,
    };
  },
  getValidatedTime: function (value) {
    var owner = this,
      result = "";
    value = value.replace(/[^\d]/g, "");
    var timeFormatOptions = owner.getTimeFormatOptions();
    owner.blocks.forEach(function (length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length),
          sub0 = sub.slice(0, 1),
          rest = value.slice(length);
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
  getFixedTimeString: function (value) {
    var owner = this,
      timePattern = owner.timePattern,
      time = [],
      secondIndex = 0,
      minuteIndex = 0,
      hourIndex = 0,
      secondStartIndex = 0,
      minuteStartIndex = 0,
      hourStartIndex = 0,
      second,
      minute,
      hour;
    if (value.length === 6) {
      timePattern.forEach(function (type, index) {
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
      timePattern.forEach(function (type, index) {
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
    return time.length === 0
      ? value
      : timePattern.reduce(function (previous, current) {
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
  getFixedTime: function (hour, minute, second) {
    second = Math.min(parseInt(second || 0, 10), 60);
    minute = Math.min(minute, 60);
    hour = Math.min(hour, 60);
    return [hour, minute, second];
  },
  addLeadingZero: function (number) {
    return (number < 10 ? "0" : "") + number;
  },
};
var TimeFormatter_1 = TimeFormatter;
var PhoneFormatter = function (formatter, delimiter) {
  var owner = this;
  owner.delimiter = delimiter || delimiter === "" ? delimiter : " ";
  owner.delimiterRE = delimiter ? new RegExp("\\" + delimiter, "g") : "";
  owner.formatter = formatter;
};
PhoneFormatter.prototype = {
  setFormatter: function (formatter) {
    this.formatter = formatter;
  },
  format: function (phoneNumber) {
    var owner = this;
    owner.formatter.clear();
    phoneNumber = phoneNumber.replace(/[^\d+]/g, "");
    phoneNumber = phoneNumber.replace(/^\+/, "B").replace(/\+/g, "").replace("B", "+");
    phoneNumber = phoneNumber.replace(owner.delimiterRE, "");
    var result = "",
      current,
      validated = false;
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
  },
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
    general: [4, 4, 4, 4],
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
    unionPay: /^(62|81)\d{0,14}/,
  },
  getStrictBlocks: function (block) {
    var total = block.reduce(function (prev, current) {
      return prev + current;
    }, 0);
    return block.concat(19 - total);
  },
  getInfo: function (value, strictMode) {
    var blocks = CreditCardDetector.blocks,
      re = CreditCardDetector.re;
    strictMode = !!strictMode;
    for (var key in re) {
      if (re[key].test(value)) {
        var matchedBlocks = blocks[key];
        return {
          type: key,
          blocks: strictMode ? this.getStrictBlocks(matchedBlocks) : matchedBlocks,
        };
      }
    }
    return {
      type: "unknown",
      blocks: strictMode ? this.getStrictBlocks(blocks.general) : blocks.general,
    };
  },
};
var CreditCardDetector_1 = CreditCardDetector;
var Util = {
  noop: function () {},
  strip: function (value, re) {
    return value.replace(re, "");
  },
  getPostDelimiter: function (value, delimiter, delimiters) {
    if (delimiters.length === 0) {
      return value.slice(-delimiter.length) === delimiter ? delimiter : "";
    }
    var matchedDelimiter = "";
    delimiters.forEach(function (current) {
      if (value.slice(-current.length) === current) {
        matchedDelimiter = current;
      }
    });
    return matchedDelimiter;
  },
  getDelimiterREByDelimiter: function (delimiter) {
    return new RegExp(delimiter.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"), "g");
  },
  getNextCursorPosition: function (prevPos, oldValue, newValue, delimiter, delimiters) {
    if (oldValue.length === prevPos) {
      return newValue.length;
    }
    return prevPos + this.getPositionOffset(prevPos, oldValue, newValue, delimiter, delimiters);
  },
  getPositionOffset: function (prevPos, oldValue, newValue, delimiter, delimiters) {
    var oldRawValue, newRawValue, lengthOffset;
    oldRawValue = this.stripDelimiters(oldValue.slice(0, prevPos), delimiter, delimiters);
    newRawValue = this.stripDelimiters(newValue.slice(0, prevPos), delimiter, delimiters);
    lengthOffset = oldRawValue.length - newRawValue.length;
    return lengthOffset !== 0 ? lengthOffset / Math.abs(lengthOffset) : 0;
  },
  stripDelimiters: function (value, delimiter, delimiters) {
    var owner = this;
    if (delimiters.length === 0) {
      var delimiterRE = delimiter ? owner.getDelimiterREByDelimiter(delimiter) : "";
      return value.replace(delimiterRE, "");
    }
    delimiters.forEach(function (current) {
      current.split("").forEach(function (letter) {
        value = value.replace(owner.getDelimiterREByDelimiter(letter), "");
      });
    });
    return value;
  },
  headStr: function (str, length) {
    return str.slice(0, length);
  },
  getMaxLength: function (blocks) {
    return blocks.reduce(function (previous, current) {
      return previous + current;
    }, 0);
  },
  // strip prefix
  // Before type  |   After type    |     Return value
  // PEFIX-...    |   PEFIX-...     |     ''
  // PREFIX-123   |   PEFIX-123     |     123
  // PREFIX-123   |   PREFIX-23     |     23
  // PREFIX-123   |   PREFIX-1234   |     1234
  getPrefixStrippedValue: function (
    value,
    prefix,
    prefixLength,
    prevResult,
    delimiter,
    delimiters,
    noImmediatePrefix,
    tailPrefix,
    signBeforePrefix,
  ) {
    if (prefixLength === 0) {
      return value;
    }
    if (value === prefix && value !== "") {
      return "";
    }
    if (signBeforePrefix && value.slice(0, 1) == "-") {
      var prev = prevResult.slice(0, 1) == "-" ? prevResult.slice(1) : prevResult;
      return (
        "-" +
        this.getPrefixStrippedValue(
          value.slice(1),
          prefix,
          prefixLength,
          prev,
          delimiter,
          delimiters,
          noImmediatePrefix,
          tailPrefix,
          signBeforePrefix,
        )
      );
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
  getFirstDiffIndex: function (prev, current) {
    var index = 0;
    while (prev.charAt(index) === current.charAt(index)) {
      if (prev.charAt(index++) === "") {
        return -1;
      }
    }
    return index;
  },
  getFormattedValue: function (value, blocks, blocksLength, delimiter, delimiters, delimiterLazyShow) {
    var result = "",
      multipleDelimiters = delimiters.length > 0,
      currentDelimiter = "";
    if (blocksLength === 0) {
      return value;
    }
    blocks.forEach(function (length, index) {
      if (value.length > 0) {
        var sub = value.slice(0, length),
          rest = value.slice(length);
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
  fixPrefixCursor: function (el, prefix, delimiter, delimiters) {
    if (!el) {
      return;
    }
    var val = el.value,
      appendix = delimiter || delimiters[0] || " ";
    if (!el.setSelectionRange || !prefix || prefix.length + appendix.length <= val.length) {
      return;
    }
    var len = val.length * 2;
    setTimeout(function () {
      el.setSelectionRange(len, len);
    }, 1);
  },
  // Check if input field is fully selected
  checkFullSelection: function (value) {
    try {
      var selection = window.getSelection() || document.getSelection() || {};
      return selection.toString().length === value.length;
    } catch (ex) {}
    return false;
  },
  setSelection: function (element, position, doc) {
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
  getActiveElement: function (parent) {
    var activeElement = parent.activeElement;
    if (activeElement && activeElement.shadowRoot) {
      return this.getActiveElement(activeElement.shadowRoot);
    }
    return activeElement;
  },
  isAndroid: function () {
    return navigator && /android/i.test(navigator.userAgent);
  },
  // On Android chrome, the keyup and keydown events
  // always return key code 229 as a composition that
  // buffers the user’s keystrokes
  // see https://github.com/nosir/cleave.js/issues/147
  isAndroidBackspaceKeydown: function (lastInputValue, currentInputValue) {
    if (!this.isAndroid() || !lastInputValue || !currentInputValue) {
      return false;
    }
    return currentInputValue === lastInputValue.slice(0, -1);
  },
};
var Util_1 = Util;
var DefaultProperties = {
  // Maybe change to object-assign
  // for now just keep it as simple
  assign: function (target, opts) {
    target = target || {};
    opts = opts || {};
    target.creditCard = !!opts.creditCard;
    target.creditCardStrictMode = !!opts.creditCardStrictMode;
    target.creditCardType = "";
    target.onCreditCardTypeChanged = opts.onCreditCardTypeChanged || function () {};
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
    target.delimiter =
      opts.delimiter || opts.delimiter === ""
        ? opts.delimiter
        : opts.date
          ? "/"
          : opts.time
            ? ":"
            : opts.numeral
              ? ","
              : opts.phone
                ? " "
                : " ";
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
    target.onValueChanged = opts.onValueChanged || function () {};
    return target;
  },
};
var DefaultProperties_1 = DefaultProperties;
var Cleave = function (element, opts) {
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
    } catch (e) {}
  }
  opts.initValue = owner.element.value;
  owner.properties = Cleave.DefaultProperties.assign({}, opts);
  owner.init();
};
Cleave.prototype = {
  init: function () {
    var owner = this,
      pps = owner.properties;
    if (
      !pps.numeral &&
      !pps.phone &&
      !pps.creditCard &&
      !pps.time &&
      !pps.date &&
      pps.blocksLength === 0 &&
      !pps.prefix
    ) {
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
    if (pps.initValue || (pps.prefix && !pps.noImmediatePrefix)) {
      owner.onInput(pps.initValue);
    }
  },
  initSwapHiddenInput: function () {
    var owner = this,
      pps = owner.properties;
    if (!pps.swapHiddenInput) return;
    var inputFormatter = owner.element.cloneNode(true);
    owner.element.parentNode.insertBefore(inputFormatter, owner.element);
    owner.elementSwapHidden = owner.element;
    owner.elementSwapHidden.type = "hidden";
    owner.element = inputFormatter;
    owner.element.id = "";
  },
  initNumeralFormatter: function () {
    var owner = this,
      pps = owner.properties;
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
      pps.delimiter,
    );
  },
  initTimeFormatter: function () {
    var owner = this,
      pps = owner.properties;
    if (!pps.time) {
      return;
    }
    pps.timeFormatter = new Cleave.TimeFormatter(pps.timePattern, pps.timeFormat);
    pps.blocks = pps.timeFormatter.getBlocks();
    pps.blocksLength = pps.blocks.length;
    pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
  },
  initDateFormatter: function () {
    var owner = this,
      pps = owner.properties;
    if (!pps.date) {
      return;
    }
    pps.dateFormatter = new Cleave.DateFormatter(pps.datePattern, pps.dateMin, pps.dateMax);
    pps.blocks = pps.dateFormatter.getBlocks();
    pps.blocksLength = pps.blocks.length;
    pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
  },
  initPhoneFormatter: function () {
    var owner = this,
      pps = owner.properties;
    if (!pps.phone) {
      return;
    }
    try {
      pps.phoneFormatter = new Cleave.PhoneFormatter(
        new pps.root.Cleave.AsYouTypeFormatter(pps.phoneRegionCode),
        pps.delimiter,
      );
    } catch (ex) {
      throw new Error("[cleave.js] Please include phone-type-formatter.{country}.js lib");
    }
  },
  onKeyDown: function (event) {
    var owner = this,
      charCode = event.which || event.keyCode;
    owner.lastInputValue = owner.element.value;
    owner.isBackward = charCode === 8;
  },
  onChange: function (event) {
    var owner = this,
      pps = owner.properties,
      Util2 = Cleave.Util;
    owner.isBackward = owner.isBackward || event.inputType === "deleteContentBackward";
    var postDelimiter = Util2.getPostDelimiter(owner.lastInputValue, pps.delimiter, pps.delimiters);
    if (owner.isBackward && postDelimiter) {
      pps.postDelimiterBackspace = postDelimiter;
    } else {
      pps.postDelimiterBackspace = false;
    }
    this.onInput(this.element.value);
  },
  onFocus: function () {
    var owner = this,
      pps = owner.properties;
    owner.lastInputValue = owner.element.value;
    if (pps.prefix && pps.noImmediatePrefix && !owner.element.value) {
      this.onInput(pps.prefix);
    }
    Cleave.Util.fixPrefixCursor(owner.element, pps.prefix, pps.delimiter, pps.delimiters);
  },
  onCut: function (e) {
    if (!Cleave.Util.checkFullSelection(this.element.value)) return;
    this.copyClipboardData(e);
    this.onInput("");
  },
  onCopy: function (e) {
    if (!Cleave.Util.checkFullSelection(this.element.value)) return;
    this.copyClipboardData(e);
  },
  copyClipboardData: function (e) {
    var owner = this,
      pps = owner.properties,
      Util2 = Cleave.Util,
      inputValue = owner.element.value,
      textToCopy = "";
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
    } catch (ex) {}
  },
  onInput: function (value) {
    var owner = this,
      pps = owner.properties,
      Util2 = Cleave.Util;
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
    value = Util2.getPrefixStrippedValue(
      value,
      pps.prefix,
      pps.prefixLength,
      pps.result,
      pps.delimiter,
      pps.delimiters,
      pps.noImmediatePrefix,
      pps.tailPrefix,
      pps.signBeforePrefix,
    );
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
      pps.delimiterLazyShow,
    );
    owner.updateValueState();
  },
  updateCreditCardPropsByValue: function (value) {
    var owner = this,
      pps = owner.properties,
      Util2 = Cleave.Util,
      creditCardInfo;
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
  updateValueState: function () {
    var owner = this,
      Util2 = Cleave.Util,
      pps = owner.properties;
    if (!owner.element) {
      return;
    }
    var endPos = owner.element.selectionEnd;
    var oldValue = owner.element.value;
    var newValue = pps.result;
    endPos = Util2.getNextCursorPosition(endPos, oldValue, newValue, pps.delimiter, pps.delimiters);
    if (owner.isAndroid) {
      window.setTimeout(function () {
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
  callOnValueChanged: function () {
    var owner = this,
      pps = owner.properties;
    pps.onValueChanged.call(owner, {
      target: {
        name: owner.element.name,
        value: pps.result,
        rawValue: owner.getRawValue(),
      },
    });
  },
  setPhoneRegionCode: function (phoneRegionCode) {
    var owner = this,
      pps = owner.properties;
    pps.phoneRegionCode = phoneRegionCode;
    owner.initPhoneFormatter();
    owner.onChange();
  },
  setRawValue: function (value) {
    var owner = this,
      pps = owner.properties;
    value = value !== void 0 && value !== null ? value.toString() : "";
    if (pps.numeral) {
      value = value.replace(".", pps.numeralDecimalMark);
    }
    pps.postDelimiterBackspace = false;
    owner.element.value = value;
    owner.onInput(value);
  },
  getRawValue: function () {
    var owner = this,
      pps = owner.properties,
      Util2 = Cleave.Util,
      rawValue = owner.element.value;
    if (pps.rawValueTrimPrefix) {
      rawValue = Util2.getPrefixStrippedValue(
        rawValue,
        pps.prefix,
        pps.prefixLength,
        pps.result,
        pps.delimiter,
        pps.delimiters,
        pps.noImmediatePrefix,
        pps.tailPrefix,
        pps.signBeforePrefix,
      );
    }
    if (pps.numeral) {
      rawValue = pps.numeralFormatter.getRawValue(rawValue);
    } else {
      rawValue = Util2.stripDelimiters(rawValue, pps.delimiter, pps.delimiters);
    }
    return rawValue;
  },
  getISOFormatDate: function () {
    var owner = this,
      pps = owner.properties;
    return pps.date ? pps.dateFormatter.getISOFormatDate() : "";
  },
  getISOFormatTime: function () {
    var owner = this,
      pps = owner.properties;
    return pps.time ? pps.timeFormatter.getISOFormatTime() : "";
  },
  getFormattedValue: function () {
    return this.element.value;
  },
  destroy: function () {
    var owner = this;
    owner.element.removeEventListener("input", owner.onChangeListener);
    owner.element.removeEventListener("keydown", owner.onKeyDownListener);
    owner.element.removeEventListener("focus", owner.onFocusListener);
    owner.element.removeEventListener("cut", owner.onCutListener);
    owner.element.removeEventListener("copy", owner.onCopyListener);
  },
  toString: function () {
    return "[Cleave Object]";
  },
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
!function () {
  function n(n2, t2) {
    var e2 = n2.split("."),
      l2 = U;
    e2[0] in l2 || !l2.execScript || l2.execScript("var " + e2[0]);
    for (var r2; e2.length && (r2 = e2.shift()); )
      e2.length || void 0 === t2 ? (l2 = l2[r2] ? l2[r2] : (l2[r2] = {})) : (l2[r2] = t2);
  }
  function t(n2, t2) {
    function e2() {}
    (e2.prototype = t2.prototype),
      (n2.M = t2.prototype),
      (n2.prototype = new e2()),
      (n2.prototype.constructor = n2),
      (n2.N = function (n3, e3, l2) {
        for (var r2 = Array(arguments.length - 2), i2 = 2; i2 < arguments.length; i2++) r2[i2 - 2] = arguments[i2];
        return t2.prototype[e3].apply(n3, r2);
      });
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
    var t2,
      e2 = [],
      l2 = 0;
    for (t2 in n2) e2[l2++] = n2[t2];
    return e2;
  }
  function a(n2, t2) {
    (this.b = n2), (this.a = {});
    for (var e2 = 0; e2 < t2.length; e2++) {
      var l2 = t2[e2];
      this.a[l2.b] = l2;
    }
  }
  function o(n2) {
    return (
      (n2 = u(n2.a)),
      r(n2, function (n3, t2) {
        return n3.b - t2.b;
      }),
      n2
    );
  }
  function s(n2, t2) {
    switch (((this.b = n2), (this.g = !!t2.v), (this.a = t2.c), (this.i = t2.type), (this.h = false), this.a)) {
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
    (this.a = {}), (this.f = this.j().a), (this.b = this.g = null);
  }
  function p(n2, t2) {
    for (var e2 = o(n2.j()), l2 = 0; l2 < e2.length; l2++) {
      var r2 = e2[l2],
        i2 = r2.b;
      if (null != t2.a[i2]) {
        n2.b && delete n2.b[r2.b];
        var u2 = 11 == r2.a || 10 == r2.a;
        if (r2.g)
          for (var r2 = c(t2, i2) || [], a2 = 0; a2 < r2.length; a2++) {
            var s2 = n2,
              f2 = i2,
              h2 = u2 ? r2[a2].clone() : r2[a2];
            s2.a[f2] || (s2.a[f2] = []), s2.a[f2].push(h2), s2.b && delete s2.b[f2];
          }
        else (r2 = c(t2, i2)), u2 ? ((u2 = c(n2, i2)) ? p(u2, r2) : m(n2, i2, r2.clone())) : m(n2, i2, r2);
      }
    }
  }
  function c(n2, t2) {
    var e2 = n2.a[t2];
    if (null == e2) return null;
    if (n2.g) {
      if (!(t2 in n2.b)) {
        var l2 = n2.g,
          r2 = n2.f[t2];
        if (null != e2)
          if (r2.g) {
            for (var i2 = [], u2 = 0; u2 < e2.length; u2++) i2[u2] = l2.b(r2, e2[u2]);
            e2 = i2;
          } else e2 = l2.b(r2, e2);
        return (n2.b[t2] = e2);
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
    else
      n: {
        if (((e2 = n2.f[t2]), void 0 === e2.f)) {
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
    return n2.f[t2].g ? (null != n2.a[t2] ? n2.a[t2].length : 0) : null != n2.a[t2] ? 1 : 0;
  }
  function m(n2, t2, e2) {
    (n2.a[t2] = e2), n2.b && (n2.b[t2] = e2);
  }
  function b(n2, t2) {
    var e2,
      l2 = [];
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
  function _() {}
  function S() {}
  function w() {}
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
      if (((e2 = tn[t2]), null == e2)) return null;
      (e2 = new w().a($.j(), e2)), (n2.a[t2] = e2);
    }
    return e2;
  }
  function E(n2) {
    return (n2 = nn[n2]), null == n2 ? "ZZ" : n2[0];
  }
  function j(n2) {
    (this.H = RegExp("\u2008")),
      (this.C = ""),
      (this.m = new e()),
      (this.w = ""),
      (this.i = new e()),
      (this.u = new e()),
      (this.l = true),
      (this.A = this.o = this.F = false),
      (this.G = x.b()),
      (this.s = 0),
      (this.b = new e()),
      (this.B = false),
      (this.h = ""),
      (this.a = new e()),
      (this.f = []),
      (this.D = n2),
      (this.J = this.g = B(this, this.D));
  }
  function B(n2, t2) {
    var e2;
    if (null != t2 && isNaN(t2) && t2.toUpperCase() in tn) {
      if (((e2 = N(n2.G, t2)), null == e2)) throw Error("Invalid region code: " + t2);
      e2 = g(e2, 10);
    } else e2 = 0;
    return (e2 = N(n2.G, E(e2))), null != e2 ? e2 : an;
  }
  function D(n2) {
    for (var t2 = n2.f.length, e2 = 0; e2 < t2; ++e2) {
      var r2 = n2.f[e2],
        i2 = g(r2, 1);
      if (n2.w == i2) return false;
      var u2;
      u2 = n2;
      var a2 = r2,
        o2 = g(a2, 1);
      if (-1 != o2.indexOf("|")) u2 = false;
      else {
        (o2 = o2.replace(on, "\\d")), (o2 = o2.replace(sn, "\\d")), l(u2.m);
        var s2;
        s2 = u2;
        var a2 = g(a2, 2),
          f2 = "999999999999999".match(o2)[0];
        f2.length < s2.a.b.length
          ? (s2 = "")
          : ((s2 = f2.replace(new RegExp(o2, "g"), a2)), (s2 = s2.replace(RegExp("9", "g"), "\u2008"))),
          0 < s2.length ? (u2.m.a(s2), (u2 = true)) : (u2 = false);
      }
      if (u2) return (n2.w = i2), (n2.B = pn.test(h(r2, 4))), (n2.s = 0), true;
    }
    return (n2.l = false);
  }
  function R(n2, t2) {
    for (var e2 = [], l2 = t2.length - 3, r2 = n2.f.length, i2 = 0; i2 < r2; ++i2) {
      var u2 = n2.f[i2];
      0 == d(u2, 3)
        ? e2.push(n2.f[i2])
        : ((u2 = h(u2, 3, Math.min(l2, d(u2, 3) - 1))), 0 == t2.search(u2) && e2.push(n2.f[i2]));
    }
    n2.f = e2;
  }
  function F(n2, t2) {
    n2.i.a(t2);
    var e2 = t2;
    if (rn.test(e2) || (1 == n2.i.b.length && ln.test(e2))) {
      var r2,
        e2 = t2;
      "+" == e2 ? ((r2 = e2), n2.u.a(e2)) : ((r2 = en[e2]), n2.u.a(r2), n2.a.a(r2)), (t2 = r2);
    } else (n2.l = false), (n2.F = true);
    if (!n2.l) {
      if (!n2.F) {
        if (P(n2)) {
          if (q(n2)) return C(n2);
        } else if (
          (0 < n2.h.length &&
            ((e2 = n2.a.toString()),
            l(n2.a),
            n2.a.a(n2.h),
            n2.a.a(e2),
            (e2 = n2.b.toString()),
            (r2 = e2.lastIndexOf(n2.h)),
            l(n2.b),
            n2.b.a(e2.substring(0, r2))),
          n2.h != H(n2))
        )
          return n2.b.a(" "), C(n2);
      }
      return n2.i.toString();
    }
    switch (n2.u.b.length) {
      case 0:
      case 1:
      case 2:
        return n2.i.toString();
      case 3:
        if (!P(n2)) return (n2.h = H(n2)), V(n2);
        n2.A = true;
      default:
        return n2.A
          ? (q(n2) && (n2.A = false), n2.b.toString() + n2.a.toString())
          : 0 < n2.f.length
            ? ((e2 = T(n2, t2)),
              (r2 = I(n2)),
              0 < r2.length ? r2 : (R(n2, n2.a.toString()), D(n2) ? G(n2) : n2.l ? M(n2, e2) : n2.i.toString()))
            : V(n2);
    }
  }
  function C(n2) {
    return (n2.l = true), (n2.A = false), (n2.f = []), (n2.s = 0), l(n2.m), (n2.w = ""), V(n2);
  }
  function I(n2) {
    for (var t2 = n2.a.toString(), e2 = n2.f.length, l2 = 0; l2 < e2; ++l2) {
      var r2 = n2.f[l2],
        i2 = g(r2, 1);
      if (new RegExp("^(?:" + i2 + ")$").test(t2))
        return (n2.B = pn.test(h(r2, 4))), (t2 = t2.replace(new RegExp(i2, "g"), h(r2, 2))), M(n2, t2);
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
      for (
        var e2 = n2.o && 0 == n2.h.length && 0 < d(n2.g, 20) ? c(n2.g, 20) || [] : c(n2.g, 19) || [],
          l2 = e2.length,
          r2 = 0;
        r2 < l2;
        ++r2
      ) {
        var i2 = e2[r2];
        (0 < n2.h.length && A(g(i2, 4)) && !h(i2, 6) && null == i2.a[5]) ||
          ((0 != n2.h.length || n2.o || A(g(i2, 4)) || h(i2, 6)) && fn.test(g(i2, 2)) && n2.f.push(i2));
      }
      return R(n2, t2), (t2 = I(n2)), 0 < t2.length ? t2 : D(n2) ? G(n2) : n2.i.toString();
    }
    return M(n2, t2);
  }
  function G(n2) {
    var t2 = n2.a.toString(),
      e2 = t2.length;
    if (0 < e2) {
      for (var l2 = "", r2 = 0; r2 < e2; r2++) l2 = T(n2, t2.charAt(r2));
      return n2.l ? M(n2, l2) : n2.i.toString();
    }
    return n2.b.toString();
  }
  function H(n2) {
    var t2,
      e2 = n2.a.toString(),
      r2 = 0;
    return (
      1 != h(n2.g, 10)
        ? (t2 = false)
        : ((t2 = n2.a.toString()), (t2 = "1" == t2.charAt(0) && "0" != t2.charAt(1) && "1" != t2.charAt(1))),
      t2
        ? ((r2 = 1), n2.b.a("1").a(" "), (n2.o = true))
        : null != n2.g.a[15] &&
          ((t2 = new RegExp("^(?:" + h(n2.g, 15) + ")")),
          (t2 = e2.match(t2)),
          null != t2 &&
            null != t2[0] &&
            0 < t2[0].length &&
            ((n2.o = true), (r2 = t2[0].length), n2.b.a(e2.substring(0, r2)))),
      l(n2.a),
      n2.a.a(e2.substring(r2)),
      e2.substring(0, r2)
    );
  }
  function P(n2) {
    var t2 = n2.u.toString(),
      e2 = new RegExp("^(?:\\+|" + h(n2.g, 11) + ")"),
      e2 = t2.match(e2);
    return (
      null != e2 &&
      null != e2[0] &&
      0 < e2[0].length &&
      ((n2.o = true),
      (e2 = e2[0].length),
      l(n2.a),
      n2.a.a(t2.substring(e2)),
      l(n2.b),
      n2.b.a(t2.substring(0, e2)),
      "+" != t2.charAt(0) && n2.b.a(" "),
      true)
    );
  }
  function q(n2) {
    if (0 == n2.a.b.length) return false;
    var t2,
      r2 = new e();
    n: {
      if (((t2 = n2.a.toString()), 0 != t2.length && "0" != t2.charAt(0))) {
        for (var i2, u2 = t2.length, a2 = 1; 3 >= a2 && a2 <= u2; ++a2)
          if (((i2 = parseInt(t2.substring(0, a2), 10)), i2 in nn)) {
            r2.a(t2.substring(a2)), (t2 = i2);
            break n;
          }
      }
      t2 = 0;
    }
    return (
      0 != t2 &&
      (l(n2.a),
      n2.a.a(r2.toString()),
      (r2 = E(t2)),
      "001" == r2 ? (n2.g = N(n2.G, "" + t2)) : r2 != n2.D && (n2.g = B(n2, r2)),
      n2.b.a("" + t2).a(" "),
      (n2.h = ""),
      true)
    );
  }
  function T(n2, t2) {
    var e2 = n2.m.toString();
    if (0 <= e2.substring(n2.s).search(n2.H)) {
      var r2 = e2.search(n2.H),
        e2 = e2.replace(n2.H, t2);
      return l(n2.m), n2.m.a(e2), (n2.s = r2), e2.substring(0, n2.s + 1);
    }
    return 1 == n2.f.length && (n2.l = false), (n2.w = ""), n2.i.toString();
  }
  var U = this;
  (e.prototype.b = ""),
    (e.prototype.set = function (n2) {
      this.b = "" + n2;
    }),
    (e.prototype.a = function (n2, t2, e2) {
      if (((this.b += String(n2)), null != t2)) for (var l2 = 1; l2 < arguments.length; l2++) this.b += arguments[l2];
      return this;
    }),
    (e.prototype.toString = function () {
      return this.b;
    });
  var Y = 1,
    k = 2,
    J = 3,
    K = 4,
    L = 6,
    O = 16,
    Z = 18;
  (f.prototype.set = function (n2, t2) {
    m(this, n2.b, t2);
  }),
    (f.prototype.clone = function () {
      var n2 = new this.constructor();
      return n2 != this && ((n2.a = {}), n2.b && (n2.b = {}), p(n2, this)), n2;
    }),
    t(y, f);
  var z = null;
  t(v, f);
  var Q = null;
  t($, f);
  var W = null;
  (y.prototype.j = function () {
    var n2 = z;
    return (
      n2 ||
        (z = n2 =
          b(y, {
            0: { name: "NumberFormat", I: "i18n.phonenumbers.NumberFormat" },
            1: { name: "pattern", required: true, c: 9, type: String },
            2: { name: "format", required: true, c: 9, type: String },
            3: { name: "leading_digits_pattern", v: true, c: 9, type: String },
            4: { name: "national_prefix_formatting_rule", c: 9, type: String },
            6: { name: "national_prefix_optional_when_formatting", c: 8, defaultValue: false, type: Boolean },
            5: { name: "domestic_carrier_code_formatting_rule", c: 9, type: String },
          })),
      n2
    );
  }),
    (y.j = y.prototype.j),
    (v.prototype.j = function () {
      var n2 = Q;
      return (
        n2 ||
          (Q = n2 =
            b(v, {
              0: { name: "PhoneNumberDesc", I: "i18n.phonenumbers.PhoneNumberDesc" },
              2: { name: "national_number_pattern", c: 9, type: String },
              9: { name: "possible_length", v: true, c: 5, type: Number },
              10: { name: "possible_length_local_only", v: true, c: 5, type: Number },
              6: { name: "example_number", c: 9, type: String },
            })),
        n2
      );
    }),
    (v.j = v.prototype.j),
    ($.prototype.j = function () {
      var n2 = W;
      return (
        n2 ||
          (W = n2 =
            b($, {
              0: { name: "PhoneMetadata", I: "i18n.phonenumbers.PhoneMetadata" },
              1: { name: "general_desc", c: 11, type: v },
              2: { name: "fixed_line", c: 11, type: v },
              3: { name: "mobile", c: 11, type: v },
              4: { name: "toll_free", c: 11, type: v },
              5: { name: "premium_rate", c: 11, type: v },
              6: { name: "shared_cost", c: 11, type: v },
              7: { name: "personal_number", c: 11, type: v },
              8: { name: "voip", c: 11, type: v },
              21: { name: "pager", c: 11, type: v },
              25: { name: "uan", c: 11, type: v },
              27: { name: "emergency", c: 11, type: v },
              28: { name: "voicemail", c: 11, type: v },
              29: { name: "short_code", c: 11, type: v },
              30: { name: "standard_rate", c: 11, type: v },
              31: { name: "carrier_specific", c: 11, type: v },
              33: { name: "sms_services", c: 11, type: v },
              24: { name: "no_international_dialling", c: 11, type: v },
              9: { name: "id", required: true, c: 9, type: String },
              10: { name: "country_code", c: 5, type: Number },
              11: { name: "international_prefix", c: 9, type: String },
              17: { name: "preferred_international_prefix", c: 9, type: String },
              12: { name: "national_prefix", c: 9, type: String },
              13: { name: "preferred_extn_prefix", c: 9, type: String },
              15: { name: "national_prefix_for_parsing", c: 9, type: String },
              16: { name: "national_prefix_transform_rule", c: 9, type: String },
              18: { name: "same_mobile_and_fixed_line_pattern", c: 8, defaultValue: false, type: Boolean },
              19: { name: "number_format", v: true, c: 11, type: y },
              20: { name: "intl_number_format", v: true, c: 11, type: y },
              22: { name: "main_country_for_code", c: 8, defaultValue: false, type: Boolean },
              23: { name: "leading_digits", c: 9, type: String },
              26: { name: "leading_zero_possible", c: 8, defaultValue: false, type: Boolean },
            })),
        n2
      );
    }),
    ($.j = $.prototype.j),
    (_.prototype.a = function (n2) {
      throw (new n2.b(), Error("Unimplemented"));
    }),
    (_.prototype.b = function (n2, t2) {
      if (11 == n2.a || 10 == n2.a) return t2 instanceof f ? t2 : this.a(n2.i.prototype.j(), t2);
      if (14 == n2.a) {
        if ("string" == typeof t2 && X.test(t2)) {
          var e2 = Number(t2);
          if (0 < e2) return e2;
        }
        return t2;
      }
      if (!n2.h) return t2;
      if (((e2 = n2.i), e2 === String)) {
        if ("number" == typeof t2) return String(t2);
      } else if (
        e2 === Number &&
        "string" == typeof t2 &&
        ("Infinity" === t2 || "-Infinity" === t2 || "NaN" === t2 || X.test(t2))
      )
        return Number(t2);
      return t2;
    });
  var X = /^-?[0-9]+$/;
  t(S, _),
    (S.prototype.a = function (n2, t2) {
      var e2 = new n2.b();
      return (e2.g = this), (e2.a = t2), (e2.b = {}), e2;
    }),
    t(w, S),
    (w.prototype.b = function (n2, t2) {
      return 8 == n2.a ? !!t2 : _.prototype.b.apply(this, arguments);
    }),
    (w.prototype.a = function (n2, t2) {
      return w.M.a.call(this, n2, t2);
    });
  var nn = { 49: ["DE"] },
    tn = {
      DE: [
        null,
        [
          null,
          null,
          "(?:1|[235-9]\\d{11}|4(?:[0-8]\\d{2,10}|9(?:[05]\\d{7}|[46][1-8]\\d{2,6})))\\d{3}|[1-35-9]\\d{6,13}|49(?:(?:[0-25]\\d|3[1-689])\\d{4,8}|4[1-8]\\d{4}|6[0-8]\\d{3,4}|7[1-7]\\d{5,8})|497[0-7]\\d{4}|49(?:[0-2579]\\d|[34][1-9])\\d{3}|[1-9]\\d{5}|[13468]\\d{4}",
          null,
          null,
          null,
          null,
          null,
          null,
          [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          [3],
        ],
        [
          null,
          null,
          "(?:2(?:0[1-689]|[1-3569]\\d|4[0-8]|7[1-7]|8[0-7])|5(?:0[2-8]|[124-6]\\d|[38][0-8]|[79][0-7])|6(?:0[02-9]|[1-3589]\\d|[47][0-8]|6[1-9])|7(?:0[2-8]|1[1-9]|[27][0-7]|3\\d|[4-6][0-8]|8[0-5]|9[013-7])|8(?:0[2-9]|1[0-79]|[29]\\d|3[0-46-9]|4[0-6]|5[013-9]|6[1-8]|7[0-8]|8[0-24-6])|9(?:0[6-9]|[1-4]\\d|[589][0-7]|6[0-8]|7[0-467]))\\d{4,12}|3(?:(?:[03569]\\d|4[0-79]|7[1-7]|8[1-8])\\d{4,12}|2\\d{9})|4(?:(?:[02-48]\\d|1[02-9]|5[0-6]|6[0-8]|7[0-79])\\d{4,12}|9(?:[0-37]\\d{4,9}|[4-6]\\d{4,10}))|(?:2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:0\\d?|[35-9][15]|4[015])|4(?:0\\d?|[2-9]1)|[57][1-9]1|[68](?:[1-8]1|9\\d?)|9(?:06|[1-9]1))\\d{3}",
          null,
          null,
          null,
          "30123456",
          null,
          null,
          [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          [3, 4],
        ],
        [
          null,
          null,
          "1(?:5[0-25-9]\\d{8}|(?:6[023]|7\\d)\\d{7,8})",
          null,
          null,
          null,
          "15123456789",
          null,
          null,
          [10, 11],
        ],
        [null, null, "800\\d{7,12}", null, null, null, "8001234567890", null, null, [10, 11, 12, 13, 14, 15]],
        [null, null, "(?:137[7-9]|900(?:[135]|9\\d))\\d{6}", null, null, null, "9001234567", null, null, [10, 11]],
        [
          null,
          null,
          "1(?:3(?:7[1-6]\\d\\d|8)|80\\d{1,7})\\d{4}",
          null,
          null,
          null,
          "18012345",
          null,
          null,
          [7, 8, 9, 10, 11, 12, 13, 14],
        ],
        [null, null, "700\\d{8}", null, null, null, "70012345678", null, null, [11]],
        [null, null, null, null, null, null, null, null, null, [-1]],
        "DE",
        49,
        "00",
        "0",
        null,
        null,
        "0",
        null,
        null,
        null,
        [
          [null, "(\\d{2})(\\d{3,13})", "$1 $2", ["3[02]|40|[68]9"], "0$1"],
          [
            null,
            "(\\d{3})(\\d{3,12})",
            "$1 $2",
            [
              "2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)",
              "2(?:0[1-389]|1(?:[14]|2[0-8])|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)",
            ],
            "0$1",
          ],
          [null, "(\\d{3})(\\d{4})", "$1 $2", ["138"], "0$1"],
          [
            null,
            "(\\d{4})(\\d{3,11})",
            "$1 $2",
            [
              "[24-6]|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])",
              "[24-6]|3(?:3(?:0[1-467]|2[127-9]|3[124578]|[46][1246]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|3[1357]|4[13578]|6[1246]|7[1356]|9[1346])|5(?:0[14]|2[1-3589]|3[1357]|[49][1246]|6[1-4]|7[13468]|8[13568])|6(?:0[1356]|2[1-489]|3[124-6]|4[1347]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|3[1357]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|4[1347]|6|7[1467]|8[136])|9(?:0[12479]|2[1358]|3[1357]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])",
            ],
            "0$1",
          ],
          [null, "(\\d{3})(\\d{5,11})", "$1 $2", ["181"], "0$1"],
          [null, "(\\d{3})(\\d)(\\d{4,10})", "$1 $2 $3", ["1(?:3|80)|9"], "0$1"],
          [null, "(\\d{5})(\\d{3,10})", "$1 $2", ["3"], "0$1"],
          [null, "(\\d{3})(\\d{7,8})", "$1 $2", ["1(?:6[02-489]|7)"], "0$1"],
          [null, "(\\d{3})(\\d{7,12})", "$1 $2", ["8"], "0$1"],
          [null, "(\\d{4})(\\d{7})", "$1 $2", ["15[1279]"], "0$1"],
          [null, "(\\d{5})(\\d{6})", "$1 $2", ["15[0568]"], "0$1"],
          [null, "(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["7"], "0$1"],
          [null, "(\\d{3})(\\d{8})", "$1 $2", ["18[2-579]", "18[2-579]", "18(?:[2-479]|5(?:0[1-9]|[1-9]))"], "0$1"],
          [null, "(\\d{4})(\\d{7})", "$1 $2", ["18[68]"], "0$1"],
          [null, "(\\d{5})(\\d{6})", "$1 $2", ["18"], "0$1"],
          [null, "(\\d{3})(\\d{2})(\\d{7,8})", "$1 $2 $3", ["1(?:6[023]|7)"], "0$1"],
          [null, "(\\d{3})(\\d{2})(\\d{8})", "$1 $2 $3", ["15[013-68]"], "0$1"],
          [null, "(\\d{4})(\\d{2})(\\d{7})", "$1 $2 $3", ["15"], "0$1"],
        ],
        null,
        [
          null,
          null,
          "16(?:4\\d{1,10}|[89]\\d{1,11})",
          null,
          null,
          null,
          "16412345",
          null,
          null,
          [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        ],
        null,
        null,
        [null, null, null, null, null, null, null, null, null, [-1]],
        [
          null,
          null,
          "18(?:1\\d{5,11}|[2-9]\\d{8})",
          null,
          null,
          null,
          "18500123456",
          null,
          null,
          [8, 9, 10, 11, 12, 13, 14],
        ],
        null,
        null,
        [
          null,
          null,
          "1(?:5(?:(?:[03-68]00|113)\\d|2\\d55|7\\d99|9\\d33)|(?:6(?:013|255|399)|7(?:(?:[015]1|[69]3)3|[2-4]55|[78]99))\\d?)\\d{7}",
          null,
          null,
          null,
          "177991234567",
          null,
          null,
          [12, 13],
        ],
      ],
    };
  x.b = function () {
    return x.a ? x.a : (x.a = new x());
  };
  var en = {
      0: "0",
      1: "1",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      "\uFF10": "0",
      "\uFF11": "1",
      "\uFF12": "2",
      "\uFF13": "3",
      "\uFF14": "4",
      "\uFF15": "5",
      "\uFF16": "6",
      "\uFF17": "7",
      "\uFF18": "8",
      "\uFF19": "9",
      "\u0660": "0",
      "\u0661": "1",
      "\u0662": "2",
      "\u0663": "3",
      "\u0664": "4",
      "\u0665": "5",
      "\u0666": "6",
      "\u0667": "7",
      "\u0668": "8",
      "\u0669": "9",
      "\u06F0": "0",
      "\u06F1": "1",
      "\u06F2": "2",
      "\u06F3": "3",
      "\u06F4": "4",
      "\u06F5": "5",
      "\u06F6": "6",
      "\u06F7": "7",
      "\u06F8": "8",
      "\u06F9": "9",
    },
    ln = RegExp("[+\uFF0B]+"),
    rn = RegExp("([0-9\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9])"),
    un = /^\(?\$1\)?$/,
    an = new $();
  m(an, 11, "NA");
  var on = /\[([^\[\]])*\]/g,
    sn = /\d(?=[^,}][^,}])/g,
    fn = RegExp(
      "^[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*(\\$\\d[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*)+$",
    ),
    pn = /[- ]/;
  (j.prototype.K = function () {
    (this.C = ""),
      l(this.i),
      l(this.u),
      l(this.m),
      (this.s = 0),
      (this.w = ""),
      l(this.b),
      (this.h = ""),
      l(this.a),
      (this.l = true),
      (this.A = this.o = this.F = false),
      (this.f = []),
      (this.B = false),
      this.g != this.J && (this.g = B(this, this.D));
  }),
    (j.prototype.L = function (n2) {
      return (this.C = F(this, n2));
    }),
    n("Cleave.AsYouTypeFormatter", j),
    n("Cleave.AsYouTypeFormatter.prototype.inputDigit", j.prototype.L),
    n("Cleave.AsYouTypeFormatter.prototype.clear", j.prototype.K);
}.call("object" == typeof global && global ? global : window);

// src/js/Functionalities/html.input.cleave.ts
var HTML_Input_Cleave = class {
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
    const config = toLoad.config
      ? typeof toLoad.config === "string"
        ? JSON.parse(toLoad.config.replace(/</, "{").replace(/>/, "}"))
        : toLoad.config
      : {
          date: toLoad.date ? toLoad.date : true,
          dateMin: toLoad.datemin && typeof toLoad.datemin === "string" ? toLoad.datemin : void 0,
          dateMax: toLoad.datemax && typeof toLoad.datemax === "string" ? toLoad.datemax : void 0,
          delimiter: toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".",
          datePattern: toLoad.datepattern ? TYPE.tsCheck(toLoad.datepattern, "string").split("-") : ["d", "m", "Y"],
        };
    new cleave_esm_default(toProcess, config);
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      1,
      INSTANCE.PRE(
        HTMLInputElement,
        void 0,
        'Is it not an <input type = "text"/> that is tagged with this functionality?',
      ),
    ),
    __decorateParam(1, EQ.PRE("text", false, "type")),
  ],
  HTML_Input_Cleave,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Input.Cleave", HTML_Input_Cleave.functionality.bind(HTML_Input_Cleave));
export { HTML_Input_Cleave };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsZWF2ZS5qcy9kaXN0L2NsZWF2ZS1lc20uanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsZWF2ZS5qcy9kaXN0L2FkZG9ucy9jbGVhdmUtcGhvbmUuZGUuanMiLCAiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9odG1sLmlucHV0LmNsZWF2ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsidmFyIGNvbW1vbmpzR2xvYmFsID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB7fTtcblxudmFyIE51bWVyYWxGb3JtYXR0ZXIgPSBmdW5jdGlvbiAobnVtZXJhbERlY2ltYWxNYXJrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJhbEludGVnZXJTY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYWxEZWNpbWFsU2NhbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYWxQb3NpdGl2ZU9ubHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpcExlYWRpbmdaZXJvZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduQmVmb3JlUHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFpbFByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlcikge1xuICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICBvd25lci5udW1lcmFsRGVjaW1hbE1hcmsgPSBudW1lcmFsRGVjaW1hbE1hcmsgfHwgJy4nO1xuICAgIG93bmVyLm51bWVyYWxJbnRlZ2VyU2NhbGUgPSBudW1lcmFsSW50ZWdlclNjYWxlID4gMCA/IG51bWVyYWxJbnRlZ2VyU2NhbGUgOiAwO1xuICAgIG93bmVyLm51bWVyYWxEZWNpbWFsU2NhbGUgPSBudW1lcmFsRGVjaW1hbFNjYWxlID49IDAgPyBudW1lcmFsRGVjaW1hbFNjYWxlIDogMjtcbiAgICBvd25lci5udW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSA9IG51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlIHx8IE51bWVyYWxGb3JtYXR0ZXIuZ3JvdXBTdHlsZS50aG91c2FuZDtcbiAgICBvd25lci5udW1lcmFsUG9zaXRpdmVPbmx5ID0gISFudW1lcmFsUG9zaXRpdmVPbmx5O1xuICAgIG93bmVyLnN0cmlwTGVhZGluZ1plcm9lcyA9IHN0cmlwTGVhZGluZ1plcm9lcyAhPT0gZmFsc2U7XG4gICAgb3duZXIucHJlZml4ID0gKHByZWZpeCB8fCBwcmVmaXggPT09ICcnKSA/IHByZWZpeCA6ICcnO1xuICAgIG93bmVyLnNpZ25CZWZvcmVQcmVmaXggPSAhIXNpZ25CZWZvcmVQcmVmaXg7XG4gICAgb3duZXIudGFpbFByZWZpeCA9ICEhdGFpbFByZWZpeDtcbiAgICBvd25lci5kZWxpbWl0ZXIgPSAoZGVsaW1pdGVyIHx8IGRlbGltaXRlciA9PT0gJycpID8gZGVsaW1pdGVyIDogJywnO1xuICAgIG93bmVyLmRlbGltaXRlclJFID0gZGVsaW1pdGVyID8gbmV3IFJlZ0V4cCgnXFxcXCcgKyBkZWxpbWl0ZXIsICdnJykgOiAnJztcbn07XG5cbk51bWVyYWxGb3JtYXR0ZXIuZ3JvdXBTdHlsZSA9IHtcbiAgICB0aG91c2FuZDogJ3Rob3VzYW5kJyxcbiAgICBsYWtoOiAgICAgJ2xha2gnLFxuICAgIHdhbjogICAgICAnd2FuJyxcbiAgICBub25lOiAgICAgJ25vbmUnICAgIFxufTtcblxuTnVtZXJhbEZvcm1hdHRlci5wcm90b3R5cGUgPSB7XG4gICAgZ2V0UmF3VmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZSh0aGlzLmRlbGltaXRlclJFLCAnJykucmVwbGFjZSh0aGlzLm51bWVyYWxEZWNpbWFsTWFyaywgJy4nKTtcbiAgICB9LFxuXG4gICAgZm9ybWF0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcGFydHMsIHBhcnRTaWduLCBwYXJ0U2lnbkFuZFByZWZpeCwgcGFydEludGVnZXIsIHBhcnREZWNpbWFsID0gJyc7XG5cbiAgICAgICAgLy8gc3RyaXAgYWxwaGFiZXQgbGV0dGVyc1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1tBLVphLXpdL2csICcnKVxuICAgICAgICAgICAgLy8gcmVwbGFjZSB0aGUgZmlyc3QgZGVjaW1hbCBtYXJrIHdpdGggcmVzZXJ2ZWQgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIC5yZXBsYWNlKG93bmVyLm51bWVyYWxEZWNpbWFsTWFyaywgJ00nKVxuXG4gICAgICAgICAgICAvLyBzdHJpcCBub24gbnVtZXJpYyBsZXR0ZXJzIGV4Y2VwdCBtaW51cyBhbmQgXCJNXCJcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgdG8gZW5zdXJlIHByZWZpeCBoYXMgYmVlbiBzdHJpcHBlZFxuICAgICAgICAgICAgLnJlcGxhY2UoL1teXFxkTS1dL2csICcnKVxuXG4gICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBsZWFkaW5nIG1pbnVzIHdpdGggcmVzZXJ2ZWQgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eXFwtLywgJ04nKVxuXG4gICAgICAgICAgICAvLyBzdHJpcCB0aGUgb3RoZXIgbWludXMgc2lnbiAoaWYgcHJlc2VudClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXC0vZywgJycpXG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdGhlIG1pbnVzIHNpZ24gKGlmIHByZXNlbnQpXG4gICAgICAgICAgICAucmVwbGFjZSgnTicsIG93bmVyLm51bWVyYWxQb3NpdGl2ZU9ubHkgPyAnJyA6ICctJylcblxuICAgICAgICAgICAgLy8gcmVwbGFjZSBkZWNpbWFsIG1hcmtcbiAgICAgICAgICAgIC5yZXBsYWNlKCdNJywgb3duZXIubnVtZXJhbERlY2ltYWxNYXJrKTtcblxuICAgICAgICAvLyBzdHJpcCBhbnkgbGVhZGluZyB6ZXJvc1xuICAgICAgICBpZiAob3duZXIuc3RyaXBMZWFkaW5nWmVyb2VzKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL14oLSk/MCsoPz1cXGQpLywgJyQxJyk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJ0U2lnbiA9IHZhbHVlLnNsaWNlKDAsIDEpID09PSAnLScgPyAnLScgOiAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvd25lci5wcmVmaXggIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChvd25lci5zaWduQmVmb3JlUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgcGFydFNpZ25BbmRQcmVmaXggPSBwYXJ0U2lnbiArIG93bmVyLnByZWZpeDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFydFNpZ25BbmRQcmVmaXggPSBvd25lci5wcmVmaXggKyBwYXJ0U2lnbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnRTaWduQW5kUHJlZml4ID0gcGFydFNpZ247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhcnRJbnRlZ2VyID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHZhbHVlLmluZGV4T2Yob3duZXIubnVtZXJhbERlY2ltYWxNYXJrKSA+PSAwKSB7XG4gICAgICAgICAgICBwYXJ0cyA9IHZhbHVlLnNwbGl0KG93bmVyLm51bWVyYWxEZWNpbWFsTWFyayk7XG4gICAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRzWzBdO1xuICAgICAgICAgICAgcGFydERlY2ltYWwgPSBvd25lci5udW1lcmFsRGVjaW1hbE1hcmsgKyBwYXJ0c1sxXS5zbGljZSgwLCBvd25lci5udW1lcmFsRGVjaW1hbFNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHBhcnRTaWduID09PSAnLScpIHtcbiAgICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydEludGVnZXIuc2xpY2UoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3duZXIubnVtZXJhbEludGVnZXJTY2FsZSA+IDApIHtcbiAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRJbnRlZ2VyLnNsaWNlKDAsIG93bmVyLm51bWVyYWxJbnRlZ2VyU2NhbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChvd25lci5udW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSkge1xuICAgICAgICBjYXNlIE51bWVyYWxGb3JtYXR0ZXIuZ3JvdXBTdHlsZS5sYWtoOlxuICAgICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0SW50ZWdlci5yZXBsYWNlKC8oXFxkKSg/PShcXGRcXGQpK1xcZCQpL2csICckMScgKyBvd25lci5kZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE51bWVyYWxGb3JtYXR0ZXIuZ3JvdXBTdHlsZS53YW46XG4gICAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRJbnRlZ2VyLnJlcGxhY2UoLyhcXGQpKD89KFxcZHs0fSkrJCkvZywgJyQxJyArIG93bmVyLmRlbGltaXRlcik7XG5cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgTnVtZXJhbEZvcm1hdHRlci5ncm91cFN0eWxlLnRob3VzYW5kOlxuICAgICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0SW50ZWdlci5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyQpL2csICckMScgKyBvd25lci5kZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvd25lci50YWlsUHJlZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gcGFydFNpZ24gKyBwYXJ0SW50ZWdlci50b1N0cmluZygpICsgKG93bmVyLm51bWVyYWxEZWNpbWFsU2NhbGUgPiAwID8gcGFydERlY2ltYWwudG9TdHJpbmcoKSA6ICcnKSArIG93bmVyLnByZWZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXJ0U2lnbkFuZFByZWZpeCArIHBhcnRJbnRlZ2VyLnRvU3RyaW5nKCkgKyAob3duZXIubnVtZXJhbERlY2ltYWxTY2FsZSA+IDAgPyBwYXJ0RGVjaW1hbC50b1N0cmluZygpIDogJycpO1xuICAgIH1cbn07XG5cbnZhciBOdW1lcmFsRm9ybWF0dGVyXzEgPSBOdW1lcmFsRm9ybWF0dGVyO1xuXG52YXIgRGF0ZUZvcm1hdHRlciA9IGZ1bmN0aW9uIChkYXRlUGF0dGVybiwgZGF0ZU1pbiwgZGF0ZU1heCkge1xuICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICBvd25lci5kYXRlID0gW107XG4gICAgb3duZXIuYmxvY2tzID0gW107XG4gICAgb3duZXIuZGF0ZVBhdHRlcm4gPSBkYXRlUGF0dGVybjtcbiAgICBvd25lci5kYXRlTWluID0gZGF0ZU1pblxuICAgICAgLnNwbGl0KCctJylcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5tYXAoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoeCwgMTApO1xuICAgICAgfSk7XG4gICAgaWYgKG93bmVyLmRhdGVNaW4ubGVuZ3RoID09PSAyKSBvd25lci5kYXRlTWluLnVuc2hpZnQoMCk7XG5cbiAgICBvd25lci5kYXRlTWF4ID0gZGF0ZU1heFxuICAgICAgLnNwbGl0KCctJylcbiAgICAgIC5yZXZlcnNlKClcbiAgICAgIC5tYXAoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoeCwgMTApO1xuICAgICAgfSk7XG4gICAgaWYgKG93bmVyLmRhdGVNYXgubGVuZ3RoID09PSAyKSBvd25lci5kYXRlTWF4LnVuc2hpZnQoMCk7XG4gICAgXG4gICAgb3duZXIuaW5pdEJsb2NrcygpO1xufTtcblxuRGF0ZUZvcm1hdHRlci5wcm90b3R5cGUgPSB7XG4gICAgaW5pdEJsb2NrczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuICAgICAgICBvd25lci5kYXRlUGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnWScpIHtcbiAgICAgICAgICAgICAgICBvd25lci5ibG9ja3MucHVzaCg0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3duZXIuYmxvY2tzLnB1c2goMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRJU09Gb3JtYXREYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBkYXRlID0gb3duZXIuZGF0ZTtcblxuICAgICAgICByZXR1cm4gZGF0ZVsyXSA/IChcbiAgICAgICAgICAgIGRhdGVbMl0gKyAnLScgKyBvd25lci5hZGRMZWFkaW5nWmVybyhkYXRlWzFdKSArICctJyArIG93bmVyLmFkZExlYWRpbmdaZXJvKGRhdGVbMF0pXG4gICAgICAgICkgOiAnJztcbiAgICB9LFxuXG4gICAgZ2V0QmxvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrcztcbiAgICB9LFxuXG4gICAgZ2V0VmFsaWRhdGVkRGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHJlc3VsdCA9ICcnO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvW15cXGRdL2csICcnKTtcblxuICAgICAgICBvd25lci5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbiAobGVuZ3RoLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViID0gdmFsdWUuc2xpY2UoMCwgbGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgc3ViMCA9IHN1Yi5zbGljZSgwLCAxKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdCA9IHZhbHVlLnNsaWNlKGxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG93bmVyLmRhdGVQYXR0ZXJuW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViID09PSAnMDAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMDEnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YjAsIDEwKSA+IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwJyArIHN1YjA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViLCAxMCkgPiAzMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzMxJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWIgPT09ICcwMCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwMSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViMCwgMTApID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAnICsgc3ViMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIsIDEwKSA+IDEyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMTInO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN1YjtcblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSByZW1haW5pbmcgc3RyaW5nXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGaXhlZERhdGVTdHJpbmcocmVzdWx0KTtcbiAgICB9LFxuXG4gICAgZ2V0Rml4ZWREYXRlU3RyaW5nOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgZGF0ZVBhdHRlcm4gPSBvd25lci5kYXRlUGF0dGVybiwgZGF0ZSA9IFtdLFxuICAgICAgICAgICAgZGF5SW5kZXggPSAwLCBtb250aEluZGV4ID0gMCwgeWVhckluZGV4ID0gMCxcbiAgICAgICAgICAgIGRheVN0YXJ0SW5kZXggPSAwLCBtb250aFN0YXJ0SW5kZXggPSAwLCB5ZWFyU3RhcnRJbmRleCA9IDAsXG4gICAgICAgICAgICBkYXksIG1vbnRoLCB5ZWFyLCBmdWxsWWVhckRvbmUgPSBmYWxzZTtcblxuICAgICAgICAvLyBtbS1kZCB8fCBkZC1tbVxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA0ICYmIGRhdGVQYXR0ZXJuWzBdLnRvTG93ZXJDYXNlKCkgIT09ICd5JyAmJiBkYXRlUGF0dGVyblsxXS50b0xvd2VyQ2FzZSgpICE9PSAneScpIHtcbiAgICAgICAgICAgIGRheVN0YXJ0SW5kZXggPSBkYXRlUGF0dGVyblswXSA9PT0gJ2QnID8gMCA6IDI7XG4gICAgICAgICAgICBtb250aFN0YXJ0SW5kZXggPSAyIC0gZGF5U3RhcnRJbmRleDtcbiAgICAgICAgICAgIGRheSA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKGRheVN0YXJ0SW5kZXgsIGRheVN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgbW9udGggPSBwYXJzZUludCh2YWx1ZS5zbGljZShtb250aFN0YXJ0SW5kZXgsIG1vbnRoU3RhcnRJbmRleCArIDIpLCAxMCk7XG5cbiAgICAgICAgICAgIGRhdGUgPSB0aGlzLmdldEZpeGVkRGF0ZShkYXksIG1vbnRoLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHl5eXktbW0tZGQgfHwgeXl5eS1kZC1tbSB8fCBtbS1kZC15eXl5IHx8IGRkLW1tLXl5eXkgfHwgZGQteXl5eS1tbSB8fCBtbS15eXl5LWRkXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDgpIHtcbiAgICAgICAgICAgIGRhdGVQYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24gKHR5cGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgICAgIGRheUluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgICAgICBtb250aEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHllYXJJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgeWVhclN0YXJ0SW5kZXggPSB5ZWFySW5kZXggKiAyO1xuICAgICAgICAgICAgZGF5U3RhcnRJbmRleCA9IChkYXlJbmRleCA8PSB5ZWFySW5kZXgpID8gZGF5SW5kZXggKiAyIDogKGRheUluZGV4ICogMiArIDIpO1xuICAgICAgICAgICAgbW9udGhTdGFydEluZGV4ID0gKG1vbnRoSW5kZXggPD0geWVhckluZGV4KSA/IG1vbnRoSW5kZXggKiAyIDogKG1vbnRoSW5kZXggKiAyICsgMik7XG5cbiAgICAgICAgICAgIGRheSA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKGRheVN0YXJ0SW5kZXgsIGRheVN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgbW9udGggPSBwYXJzZUludCh2YWx1ZS5zbGljZShtb250aFN0YXJ0SW5kZXgsIG1vbnRoU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgNCksIDEwKTtcblxuICAgICAgICAgICAgZnVsbFllYXJEb25lID0gdmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgNCkubGVuZ3RoID09PSA0O1xuXG4gICAgICAgICAgICBkYXRlID0gdGhpcy5nZXRGaXhlZERhdGUoZGF5LCBtb250aCwgeWVhcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtbS15eSB8fCB5eS1tbVxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA0ICYmIChkYXRlUGF0dGVyblswXSA9PT0gJ3knIHx8IGRhdGVQYXR0ZXJuWzFdID09PSAneScpKSB7XG4gICAgICAgICAgICBtb250aFN0YXJ0SW5kZXggPSBkYXRlUGF0dGVyblswXSA9PT0gJ20nID8gMCA6IDI7XG4gICAgICAgICAgICB5ZWFyU3RhcnRJbmRleCA9IDIgLSBtb250aFN0YXJ0SW5kZXg7XG4gICAgICAgICAgICBtb250aCA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1vbnRoU3RhcnRJbmRleCwgbW9udGhTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyAyKSwgMTApO1xuXG4gICAgICAgICAgICBmdWxsWWVhckRvbmUgPSB2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyAyKS5sZW5ndGggPT09IDI7XG5cbiAgICAgICAgICAgIGRhdGUgPSBbMCwgbW9udGgsIHllYXJdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW0teXl5eSB8fCB5eXl5LW1tXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDYgJiYgKGRhdGVQYXR0ZXJuWzBdID09PSAnWScgfHwgZGF0ZVBhdHRlcm5bMV0gPT09ICdZJykpIHtcbiAgICAgICAgICAgIG1vbnRoU3RhcnRJbmRleCA9IGRhdGVQYXR0ZXJuWzBdID09PSAnbScgPyAwIDogNDtcbiAgICAgICAgICAgIHllYXJTdGFydEluZGV4ID0gMiAtIDAuNSAqIG1vbnRoU3RhcnRJbmRleDtcbiAgICAgICAgICAgIG1vbnRoID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobW9udGhTdGFydEluZGV4LCBtb250aFN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgeWVhciA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDQpLCAxMCk7XG5cbiAgICAgICAgICAgIGZ1bGxZZWFyRG9uZSA9IHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDQpLmxlbmd0aCA9PT0gNDtcblxuICAgICAgICAgICAgZGF0ZSA9IFswLCBtb250aCwgeWVhcl07XG4gICAgICAgIH1cblxuICAgICAgICBkYXRlID0gb3duZXIuZ2V0UmFuZ2VGaXhlZERhdGUoZGF0ZSk7XG4gICAgICAgIG93bmVyLmRhdGUgPSBkYXRlO1xuXG4gICAgICAgIHZhciByZXN1bHQgPSBkYXRlLmxlbmd0aCA9PT0gMCA/IHZhbHVlIDogZGF0ZVBhdHRlcm4ucmVkdWNlKGZ1bmN0aW9uIChwcmV2aW91cywgY3VycmVudCkge1xuICAgICAgICAgICAgc3dpdGNoIChjdXJyZW50KSB7XG4gICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyAoZGF0ZVswXSA9PT0gMCA/ICcnIDogb3duZXIuYWRkTGVhZGluZ1plcm8oZGF0ZVswXSkpO1xuICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgKGRhdGVbMV0gPT09IDAgPyAnJyA6IG93bmVyLmFkZExlYWRpbmdaZXJvKGRhdGVbMV0pKTtcbiAgICAgICAgICAgIGNhc2UgJ3knOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIChmdWxsWWVhckRvbmUgPyBvd25lci5hZGRMZWFkaW5nWmVyb0ZvclllYXIoZGF0ZVsyXSwgZmFsc2UpIDogJycpO1xuICAgICAgICAgICAgY2FzZSAnWSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgKGZ1bGxZZWFyRG9uZSA/IG93bmVyLmFkZExlYWRpbmdaZXJvRm9yWWVhcihkYXRlWzJdLCB0cnVlKSA6ICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgJycpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIGdldFJhbmdlRml4ZWREYXRlOiBmdW5jdGlvbiAoZGF0ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgZGF0ZVBhdHRlcm4gPSBvd25lci5kYXRlUGF0dGVybixcbiAgICAgICAgICAgIGRhdGVNaW4gPSBvd25lci5kYXRlTWluIHx8IFtdLFxuICAgICAgICAgICAgZGF0ZU1heCA9IG93bmVyLmRhdGVNYXggfHwgW107XG5cbiAgICAgICAgaWYgKCFkYXRlLmxlbmd0aCB8fCAoZGF0ZU1pbi5sZW5ndGggPCAzICYmIGRhdGVNYXgubGVuZ3RoIDwgMykpIHJldHVybiBkYXRlO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkYXRlUGF0dGVybi5maW5kKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4LnRvTG93ZXJDYXNlKCkgPT09ICd5JztcbiAgICAgICAgICB9KSAmJlxuICAgICAgICAgIGRhdGVbMl0gPT09IDBcbiAgICAgICAgKSByZXR1cm4gZGF0ZTtcblxuICAgICAgICBpZiAoZGF0ZU1heC5sZW5ndGggJiYgKGRhdGVNYXhbMl0gPCBkYXRlWzJdIHx8IChcbiAgICAgICAgICBkYXRlTWF4WzJdID09PSBkYXRlWzJdICYmIChkYXRlTWF4WzFdIDwgZGF0ZVsxXSB8fCAoXG4gICAgICAgICAgICBkYXRlTWF4WzFdID09PSBkYXRlWzFdICYmIGRhdGVNYXhbMF0gPCBkYXRlWzBdXG4gICAgICAgICAgKSlcbiAgICAgICAgKSkpIHJldHVybiBkYXRlTWF4O1xuXG4gICAgICAgIGlmIChkYXRlTWluLmxlbmd0aCAmJiAoZGF0ZU1pblsyXSA+IGRhdGVbMl0gfHwgKFxuICAgICAgICAgIGRhdGVNaW5bMl0gPT09IGRhdGVbMl0gJiYgKGRhdGVNaW5bMV0gPiBkYXRlWzFdIHx8IChcbiAgICAgICAgICAgIGRhdGVNaW5bMV0gPT09IGRhdGVbMV0gJiYgZGF0ZU1pblswXSA+IGRhdGVbMF1cbiAgICAgICAgICApKVxuICAgICAgICApKSkgcmV0dXJuIGRhdGVNaW47XG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfSxcblxuICAgIGdldEZpeGVkRGF0ZTogZnVuY3Rpb24gKGRheSwgbW9udGgsIHllYXIpIHtcbiAgICAgICAgZGF5ID0gTWF0aC5taW4oZGF5LCAzMSk7XG4gICAgICAgIG1vbnRoID0gTWF0aC5taW4obW9udGgsIDEyKTtcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KCh5ZWFyIHx8IDApLCAxMCk7XG5cbiAgICAgICAgaWYgKChtb250aCA8IDcgJiYgbW9udGggJSAyID09PSAwKSB8fCAobW9udGggPiA4ICYmIG1vbnRoICUgMiA9PT0gMSkpIHtcbiAgICAgICAgICAgIGRheSA9IE1hdGgubWluKGRheSwgbW9udGggPT09IDIgPyAodGhpcy5pc0xlYXBZZWFyKHllYXIpID8gMjkgOiAyOCkgOiAzMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW2RheSwgbW9udGgsIHllYXJdO1xuICAgIH0sXG5cbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xuICAgICAgICByZXR1cm4gKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCk7XG4gICAgfSxcblxuICAgIGFkZExlYWRpbmdaZXJvOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAobnVtYmVyIDwgMTAgPyAnMCcgOiAnJykgKyBudW1iZXI7XG4gICAgfSxcblxuICAgIGFkZExlYWRpbmdaZXJvRm9yWWVhcjogZnVuY3Rpb24gKG51bWJlciwgZnVsbFllYXJNb2RlKSB7XG4gICAgICAgIGlmIChmdWxsWWVhck1vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiAobnVtYmVyIDwgMTAgPyAnMDAwJyA6IChudW1iZXIgPCAxMDAgPyAnMDAnIDogKG51bWJlciA8IDEwMDAgPyAnMCcgOiAnJykpKSArIG51bWJlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAobnVtYmVyIDwgMTAgPyAnMCcgOiAnJykgKyBudW1iZXI7XG4gICAgfVxufTtcblxudmFyIERhdGVGb3JtYXR0ZXJfMSA9IERhdGVGb3JtYXR0ZXI7XG5cbnZhciBUaW1lRm9ybWF0dGVyID0gZnVuY3Rpb24gKHRpbWVQYXR0ZXJuLCB0aW1lRm9ybWF0KSB7XG4gICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgIG93bmVyLnRpbWUgPSBbXTtcbiAgICBvd25lci5ibG9ja3MgPSBbXTtcbiAgICBvd25lci50aW1lUGF0dGVybiA9IHRpbWVQYXR0ZXJuO1xuICAgIG93bmVyLnRpbWVGb3JtYXQgPSB0aW1lRm9ybWF0O1xuICAgIG93bmVyLmluaXRCbG9ja3MoKTtcbn07XG5cblRpbWVGb3JtYXR0ZXIucHJvdG90eXBlID0ge1xuICAgIGluaXRCbG9ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcbiAgICAgICAgb3duZXIudGltZVBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvd25lci5ibG9ja3MucHVzaCgyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldElTT0Zvcm1hdFRpbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHRpbWUgPSBvd25lci50aW1lO1xuXG4gICAgICAgIHJldHVybiB0aW1lWzJdID8gKFxuICAgICAgICAgICAgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVswXSkgKyAnOicgKyBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzFdKSArICc6JyArIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMl0pXG4gICAgICAgICkgOiAnJztcbiAgICB9LFxuXG4gICAgZ2V0QmxvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrcztcbiAgICB9LFxuXG4gICAgZ2V0VGltZUZvcm1hdE9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcbiAgICAgICAgaWYgKFN0cmluZyhvd25lci50aW1lRm9ybWF0KSA9PT0gJzEyJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtYXhIb3VyRmlyc3REaWdpdDogMSxcbiAgICAgICAgICAgICAgICBtYXhIb3VyczogMTIsXG4gICAgICAgICAgICAgICAgbWF4TWludXRlc0ZpcnN0RGlnaXQ6IDUsXG4gICAgICAgICAgICAgICAgbWF4TWludXRlczogNjBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWF4SG91ckZpcnN0RGlnaXQ6IDIsXG4gICAgICAgICAgICBtYXhIb3VyczogMjMsXG4gICAgICAgICAgICBtYXhNaW51dGVzRmlyc3REaWdpdDogNSxcbiAgICAgICAgICAgIG1heE1pbnV0ZXM6IDYwXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFZhbGlkYXRlZFRpbWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCByZXN1bHQgPSAnJztcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1teXFxkXS9nLCAnJyk7XG5cbiAgICAgICAgdmFyIHRpbWVGb3JtYXRPcHRpb25zID0gb3duZXIuZ2V0VGltZUZvcm1hdE9wdGlvbnMoKTtcblxuICAgICAgICBvd25lci5ibG9ja3MuZm9yRWFjaChmdW5jdGlvbiAobGVuZ3RoLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViID0gdmFsdWUuc2xpY2UoMCwgbGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgc3ViMCA9IHN1Yi5zbGljZSgwLCAxKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdCA9IHZhbHVlLnNsaWNlKGxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG93bmVyLnRpbWVQYXR0ZXJuW2luZGV4XSkge1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnaCc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUludChzdWIwLCAxMCkgPiB0aW1lRm9ybWF0T3B0aW9ucy5tYXhIb3VyRmlyc3REaWdpdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAnICsgc3ViMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIsIDEwKSA+IHRpbWVGb3JtYXRPcHRpb25zLm1heEhvdXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSB0aW1lRm9ybWF0T3B0aW9ucy5tYXhIb3VycyArICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KHN1YjAsIDEwKSA+IHRpbWVGb3JtYXRPcHRpb25zLm1heE1pbnV0ZXNGaXJzdERpZ2l0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMCcgKyBzdWIwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YiwgMTApID4gdGltZUZvcm1hdE9wdGlvbnMubWF4TWludXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gdGltZUZvcm1hdE9wdGlvbnMubWF4TWludXRlcyArICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdWI7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgcmVtYWluaW5nIHN0cmluZ1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rml4ZWRUaW1lU3RyaW5nKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIGdldEZpeGVkVGltZVN0cmluZzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHRpbWVQYXR0ZXJuID0gb3duZXIudGltZVBhdHRlcm4sIHRpbWUgPSBbXSxcbiAgICAgICAgICAgIHNlY29uZEluZGV4ID0gMCwgbWludXRlSW5kZXggPSAwLCBob3VySW5kZXggPSAwLFxuICAgICAgICAgICAgc2Vjb25kU3RhcnRJbmRleCA9IDAsIG1pbnV0ZVN0YXJ0SW5kZXggPSAwLCBob3VyU3RhcnRJbmRleCA9IDAsXG4gICAgICAgICAgICBzZWNvbmQsIG1pbnV0ZSwgaG91cjtcblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA2KSB7XG4gICAgICAgICAgICB0aW1lUGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgICAgICBzZWNvbmRJbmRleCA9IGluZGV4ICogMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZUluZGV4ID0gaW5kZXggKiAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgICAgICAgICAgaG91ckluZGV4ID0gaW5kZXggKiAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaG91clN0YXJ0SW5kZXggPSBob3VySW5kZXg7XG4gICAgICAgICAgICBtaW51dGVTdGFydEluZGV4ID0gbWludXRlSW5kZXg7XG4gICAgICAgICAgICBzZWNvbmRTdGFydEluZGV4ID0gc2Vjb25kSW5kZXg7XG5cbiAgICAgICAgICAgIHNlY29uZCA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKHNlY29uZFN0YXJ0SW5kZXgsIHNlY29uZFN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgbWludXRlID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobWludXRlU3RhcnRJbmRleCwgbWludXRlU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICBob3VyID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoaG91clN0YXJ0SW5kZXgsIGhvdXJTdGFydEluZGV4ICsgMiksIDEwKTtcblxuICAgICAgICAgICAgdGltZSA9IHRoaXMuZ2V0Rml4ZWRUaW1lKGhvdXIsIG1pbnV0ZSwgc2Vjb25kKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDQgJiYgb3duZXIudGltZVBhdHRlcm4uaW5kZXhPZigncycpIDwgMCkge1xuICAgICAgICAgICAgdGltZVBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICAgICAgbWludXRlSW5kZXggPSBpbmRleCAqIDI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgICAgICBob3VySW5kZXggPSBpbmRleCAqIDI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBob3VyU3RhcnRJbmRleCA9IGhvdXJJbmRleDtcbiAgICAgICAgICAgIG1pbnV0ZVN0YXJ0SW5kZXggPSBtaW51dGVJbmRleDtcblxuICAgICAgICAgICAgc2Vjb25kID0gMDtcbiAgICAgICAgICAgIG1pbnV0ZSA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1pbnV0ZVN0YXJ0SW5kZXgsIG1pbnV0ZVN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgaG91ciA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKGhvdXJTdGFydEluZGV4LCBob3VyU3RhcnRJbmRleCArIDIpLCAxMCk7XG5cbiAgICAgICAgICAgIHRpbWUgPSB0aGlzLmdldEZpeGVkVGltZShob3VyLCBtaW51dGUsIHNlY29uZCk7XG4gICAgICAgIH1cblxuICAgICAgICBvd25lci50aW1lID0gdGltZTtcblxuICAgICAgICByZXR1cm4gdGltZS5sZW5ndGggPT09IDAgPyB2YWx1ZSA6IHRpbWVQYXR0ZXJuLnJlZHVjZShmdW5jdGlvbiAocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY3VycmVudCkge1xuICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVsyXSk7XG4gICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzFdKTtcbiAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAnJyk7XG4gICAgfSxcblxuICAgIGdldEZpeGVkVGltZTogZnVuY3Rpb24gKGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XG4gICAgICAgIHNlY29uZCA9IE1hdGgubWluKHBhcnNlSW50KHNlY29uZCB8fCAwLCAxMCksIDYwKTtcbiAgICAgICAgbWludXRlID0gTWF0aC5taW4obWludXRlLCA2MCk7XG4gICAgICAgIGhvdXIgPSBNYXRoLm1pbihob3VyLCA2MCk7XG5cbiAgICAgICAgcmV0dXJuIFtob3VyLCBtaW51dGUsIHNlY29uZF07XG4gICAgfSxcblxuICAgIGFkZExlYWRpbmdaZXJvOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAobnVtYmVyIDwgMTAgPyAnMCcgOiAnJykgKyBudW1iZXI7XG4gICAgfVxufTtcblxudmFyIFRpbWVGb3JtYXR0ZXJfMSA9IFRpbWVGb3JtYXR0ZXI7XG5cbnZhciBQaG9uZUZvcm1hdHRlciA9IGZ1bmN0aW9uIChmb3JtYXR0ZXIsIGRlbGltaXRlcikge1xuICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICBvd25lci5kZWxpbWl0ZXIgPSAoZGVsaW1pdGVyIHx8IGRlbGltaXRlciA9PT0gJycpID8gZGVsaW1pdGVyIDogJyAnO1xuICAgIG93bmVyLmRlbGltaXRlclJFID0gZGVsaW1pdGVyID8gbmV3IFJlZ0V4cCgnXFxcXCcgKyBkZWxpbWl0ZXIsICdnJykgOiAnJztcblxuICAgIG93bmVyLmZvcm1hdHRlciA9IGZvcm1hdHRlcjtcbn07XG5cblBob25lRm9ybWF0dGVyLnByb3RvdHlwZSA9IHtcbiAgICBzZXRGb3JtYXR0ZXI6IGZ1bmN0aW9uIChmb3JtYXR0ZXIpIHtcbiAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBmb3JtYXR0ZXI7XG4gICAgfSxcblxuICAgIGZvcm1hdDogZnVuY3Rpb24gKHBob25lTnVtYmVyKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICAgICAgb3duZXIuZm9ybWF0dGVyLmNsZWFyKCk7XG5cbiAgICAgICAgLy8gb25seSBrZWVwIG51bWJlciBhbmQgK1xuICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnJlcGxhY2UoL1teXFxkK10vZywgJycpO1xuXG4gICAgICAgIC8vIHN0cmlwIG5vbi1sZWFkaW5nICtcbiAgICAgICAgcGhvbmVOdW1iZXIgPSBwaG9uZU51bWJlci5yZXBsYWNlKC9eXFwrLywgJ0InKS5yZXBsYWNlKC9cXCsvZywgJycpLnJlcGxhY2UoJ0InLCAnKycpO1xuXG4gICAgICAgIC8vIHN0cmlwIGRlbGltaXRlclxuICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnJlcGxhY2Uob3duZXIuZGVsaW1pdGVyUkUsICcnKTtcblxuICAgICAgICB2YXIgcmVzdWx0ID0gJycsIGN1cnJlbnQsIHZhbGlkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpTWF4ID0gcGhvbmVOdW1iZXIubGVuZ3RoOyBpIDwgaU1heDsgaSsrKSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gb3duZXIuZm9ybWF0dGVyLmlucHV0RGlnaXQocGhvbmVOdW1iZXIuY2hhckF0KGkpKTtcblxuICAgICAgICAgICAgLy8gaGFzICgpLSBvciBzcGFjZSBpbnNpZGVcbiAgICAgICAgICAgIGlmICgvW1xccygpLV0vZy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gY3VycmVudDtcblxuICAgICAgICAgICAgICAgIHZhbGlkYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghdmFsaWRhdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVsc2U6IG92ZXIgbGVuZ3RoIGlucHV0XG4gICAgICAgICAgICAgICAgLy8gaXQgdHVybnMgdG8gaW52YWxpZCBudW1iZXIgYWdhaW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0cmlwICgpXG4gICAgICAgIC8vIGUuZy4gVVM6IDcxNjEyMzQ1NjcgcmV0dXJucyAoNzE2KSAxMjMtNDU2N1xuICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvWygpXS9nLCAnJyk7XG4gICAgICAgIC8vIHJlcGxhY2UgbGlicmFyeSBkZWxpbWl0ZXIgd2l0aCB1c2VyIGN1c3RvbWl6ZWQgZGVsaW1pdGVyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9bXFxzLV0vZywgb3duZXIuZGVsaW1pdGVyKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn07XG5cbnZhciBQaG9uZUZvcm1hdHRlcl8xID0gUGhvbmVGb3JtYXR0ZXI7XG5cbnZhciBDcmVkaXRDYXJkRGV0ZWN0b3IgPSB7XG4gICAgYmxvY2tzOiB7XG4gICAgICAgIHVhdHA6ICAgICAgICAgIFs0LCA1LCA2XSxcbiAgICAgICAgYW1leDogICAgICAgICAgWzQsIDYsIDVdLFxuICAgICAgICBkaW5lcnM6ICAgICAgICBbNCwgNiwgNF0sXG4gICAgICAgIGRpc2NvdmVyOiAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgbWFzdGVyY2FyZDogICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBkYW5rb3J0OiAgICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIGluc3RhcGF5bWVudDogIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgamNiMTU6ICAgICAgICAgWzQsIDYsIDVdLFxuICAgICAgICBqY2I6ICAgICAgICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIG1hZXN0cm86ICAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgdmlzYTogICAgICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBtaXI6ICAgICAgICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIHVuaW9uUGF5OiAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgZ2VuZXJhbDogICAgICAgWzQsIDQsIDQsIDRdXG4gICAgfSxcblxuICAgIHJlOiB7XG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDE7IDE1IGRpZ2l0cywgbm90IHN0YXJ0cyB3aXRoIDE4MDAgKGpjYiBjYXJkKVxuICAgICAgICB1YXRwOiAvXig/ITE4MDApMVxcZHswLDE0fS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMzQvMzc7IDE1IGRpZ2l0c1xuICAgICAgICBhbWV4OiAvXjNbNDddXFxkezAsMTN9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA2MDExLzY1LzY0NC02NDk7IDE2IGRpZ2l0c1xuICAgICAgICBkaXNjb3ZlcjogL14oPzo2MDExfDY1XFxkezAsMn18NjRbNC05XVxcZD8pXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCAzMDAtMzA1LzMwOSBvciAzNi8zOC8zOTsgMTQgZGlnaXRzXG4gICAgICAgIGRpbmVyczogL14zKD86MChbMC01XXw5KXxbNjg5XVxcZD8pXFxkezAsMTF9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA1MS01NS8yMjIxXHUyMDEzMjcyMDsgMTYgZGlnaXRzXG4gICAgICAgIG1hc3RlcmNhcmQ6IC9eKDVbMS01XVxcZHswLDJ9fDIyWzItOV1cXGR7MCwxfXwyWzMtN11cXGR7MCwyfSlcXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDUwMTkvNDE3NS80NTcxOyAxNiBkaWdpdHNcbiAgICAgICAgZGFua29ydDogL14oNTAxOXw0MTc1fDQ1NzEpXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA2MzctNjM5OyAxNiBkaWdpdHNcbiAgICAgICAgaW5zdGFwYXltZW50OiAvXjYzWzctOV1cXGR7MCwxM30vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDIxMzEvMTgwMDsgMTUgZGlnaXRzXG4gICAgICAgIGpjYjE1OiAvXig/OjIxMzF8MTgwMClcXGR7MCwxMX0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDIxMzEvMTgwMC8zNTsgMTYgZGlnaXRzXG4gICAgICAgIGpjYjogL14oPzozNVxcZHswLDJ9KVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNTAvNTYtNTgvNjMwNC82NzsgMTYgZGlnaXRzXG4gICAgICAgIG1hZXN0cm86IC9eKD86NVswNjc4XVxcZHswLDJ9fDYzMDR8NjdcXGR7MCwyfSlcXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDIyOyAxNiBkaWdpdHNcbiAgICAgICAgbWlyOiAvXjIyMFswLTRdXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA0OyAxNiBkaWdpdHNcbiAgICAgICAgdmlzYTogL140XFxkezAsMTV9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA2Mi84MTsgMTYgZGlnaXRzXG4gICAgICAgIHVuaW9uUGF5OiAvXig2Mnw4MSlcXGR7MCwxNH0vXG4gICAgfSxcblxuICAgIGdldFN0cmljdEJsb2NrczogZnVuY3Rpb24gKGJsb2NrKSB7XG4gICAgICB2YXIgdG90YWwgPSBibG9jay5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHByZXYgKyBjdXJyZW50O1xuICAgICAgfSwgMCk7XG5cbiAgICAgIHJldHVybiBibG9jay5jb25jYXQoMTkgLSB0b3RhbCk7XG4gICAgfSxcblxuICAgIGdldEluZm86IGZ1bmN0aW9uICh2YWx1ZSwgc3RyaWN0TW9kZSkge1xuICAgICAgICB2YXIgYmxvY2tzID0gQ3JlZGl0Q2FyZERldGVjdG9yLmJsb2NrcyxcbiAgICAgICAgICAgIHJlID0gQ3JlZGl0Q2FyZERldGVjdG9yLnJlO1xuXG4gICAgICAgIC8vIFNvbWUgY3JlZGl0IGNhcmQgY2FuIGhhdmUgdXAgdG8gMTkgZGlnaXRzIG51bWJlci5cbiAgICAgICAgLy8gU2V0IHN0cmljdE1vZGUgdG8gdHJ1ZSB3aWxsIHJlbW92ZSB0aGUgMTYgbWF4LWxlbmd0aCByZXN0cmFpbixcbiAgICAgICAgLy8gaG93ZXZlciwgSSBuZXZlciBmb3VuZCBhbnkgd2Vic2l0ZSB2YWxpZGF0ZSBjYXJkIG51bWJlciBsaWtlXG4gICAgICAgIC8vIHRoaXMsIGhlbmNlIHByb2JhYmx5IHlvdSBkb24ndCB3YW50IHRvIGVuYWJsZSB0aGlzIG9wdGlvbi5cbiAgICAgICAgc3RyaWN0TW9kZSA9ICEhc3RyaWN0TW9kZTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcmUpIHtcbiAgICAgICAgICAgIGlmIChyZVtrZXldLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoZWRCbG9ja3MgPSBibG9ja3Nba2V5XTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGJsb2Nrczogc3RyaWN0TW9kZSA/IHRoaXMuZ2V0U3RyaWN0QmxvY2tzKG1hdGNoZWRCbG9ja3MpIDogbWF0Y2hlZEJsb2Nrc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ3Vua25vd24nLFxuICAgICAgICAgICAgYmxvY2tzOiBzdHJpY3RNb2RlID8gdGhpcy5nZXRTdHJpY3RCbG9ja3MoYmxvY2tzLmdlbmVyYWwpIDogYmxvY2tzLmdlbmVyYWxcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG52YXIgQ3JlZGl0Q2FyZERldGVjdG9yXzEgPSBDcmVkaXRDYXJkRGV0ZWN0b3I7XG5cbnZhciBVdGlsID0ge1xuICAgIG5vb3A6IGZ1bmN0aW9uICgpIHtcbiAgICB9LFxuXG4gICAgc3RyaXA6IGZ1bmN0aW9uICh2YWx1ZSwgcmUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UocmUsICcnKTtcbiAgICB9LFxuXG4gICAgZ2V0UG9zdERlbGltaXRlcjogZnVuY3Rpb24gKHZhbHVlLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpIHtcbiAgICAgICAgLy8gc2luZ2xlIGRlbGltaXRlclxuICAgICAgICBpZiAoZGVsaW1pdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zbGljZSgtZGVsaW1pdGVyLmxlbmd0aCkgPT09IGRlbGltaXRlciA/IGRlbGltaXRlciA6ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbXVsdGlwbGUgZGVsaW1pdGVyc1xuICAgICAgICB2YXIgbWF0Y2hlZERlbGltaXRlciA9ICcnO1xuICAgICAgICBkZWxpbWl0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgtY3VycmVudC5sZW5ndGgpID09PSBjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hlZERlbGltaXRlciA9IGN1cnJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBtYXRjaGVkRGVsaW1pdGVyO1xuICAgIH0sXG5cbiAgICBnZXREZWxpbWl0ZXJSRUJ5RGVsaW1pdGVyOiBmdW5jdGlvbiAoZGVsaW1pdGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKGRlbGltaXRlci5yZXBsYWNlKC8oWy4/KiteJFtcXF1cXFxcKCl7fXwtXSkvZywgJ1xcXFwkMScpLCAnZycpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0Q3Vyc29yUG9zaXRpb246IGZ1bmN0aW9uIChwcmV2UG9zLCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGRlbGltaXRlciwgZGVsaW1pdGVycykge1xuICAgICAgLy8gSWYgY3Vyc29yIHdhcyBhdCB0aGUgZW5kIG9mIHZhbHVlLCBqdXN0IHBsYWNlIGl0IGJhY2suXG4gICAgICAvLyBCZWNhdXNlIG5ldyB2YWx1ZSBjb3VsZCBjb250YWluIGFkZGl0aW9uYWwgY2hhcnMuXG4gICAgICBpZiAob2xkVmFsdWUubGVuZ3RoID09PSBwcmV2UG9zKSB7XG4gICAgICAgICAgcmV0dXJuIG5ld1ZhbHVlLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZQb3MgKyB0aGlzLmdldFBvc2l0aW9uT2Zmc2V0KHByZXZQb3MsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgZGVsaW1pdGVyICxkZWxpbWl0ZXJzKTtcbiAgICB9LFxuXG4gICAgZ2V0UG9zaXRpb25PZmZzZXQ6IGZ1bmN0aW9uIChwcmV2UG9zLCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGRlbGltaXRlciwgZGVsaW1pdGVycykge1xuICAgICAgICB2YXIgb2xkUmF3VmFsdWUsIG5ld1Jhd1ZhbHVlLCBsZW5ndGhPZmZzZXQ7XG5cbiAgICAgICAgb2xkUmF3VmFsdWUgPSB0aGlzLnN0cmlwRGVsaW1pdGVycyhvbGRWYWx1ZS5zbGljZSgwLCBwcmV2UG9zKSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKTtcbiAgICAgICAgbmV3UmF3VmFsdWUgPSB0aGlzLnN0cmlwRGVsaW1pdGVycyhuZXdWYWx1ZS5zbGljZSgwLCBwcmV2UG9zKSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKTtcbiAgICAgICAgbGVuZ3RoT2Zmc2V0ID0gb2xkUmF3VmFsdWUubGVuZ3RoIC0gbmV3UmF3VmFsdWUubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiAobGVuZ3RoT2Zmc2V0ICE9PSAwKSA/IChsZW5ndGhPZmZzZXQgLyBNYXRoLmFicyhsZW5ndGhPZmZzZXQpKSA6IDA7XG4gICAgfSxcblxuICAgIHN0cmlwRGVsaW1pdGVyczogZnVuY3Rpb24gKHZhbHVlLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcblxuICAgICAgICAvLyBzaW5nbGUgZGVsaW1pdGVyXG4gICAgICAgIGlmIChkZWxpbWl0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdmFyIGRlbGltaXRlclJFID0gZGVsaW1pdGVyID8gb3duZXIuZ2V0RGVsaW1pdGVyUkVCeURlbGltaXRlcihkZWxpbWl0ZXIpIDogJyc7XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKGRlbGltaXRlclJFLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtdWx0aXBsZSBkZWxpbWl0ZXJzXG4gICAgICAgIGRlbGltaXRlcnMuZm9yRWFjaChmdW5jdGlvbiAoY3VycmVudCkge1xuICAgICAgICAgICAgY3VycmVudC5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKG93bmVyLmdldERlbGltaXRlclJFQnlEZWxpbWl0ZXIobGV0dGVyKSwgJycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgaGVhZFN0cjogZnVuY3Rpb24gKHN0ciwgbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBzdHIuc2xpY2UoMCwgbGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgZ2V0TWF4TGVuZ3RoOiBmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHJldHVybiBibG9ja3MucmVkdWNlKGZ1bmN0aW9uIChwcmV2aW91cywgY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgY3VycmVudDtcbiAgICAgICAgfSwgMCk7XG4gICAgfSxcblxuICAgIC8vIHN0cmlwIHByZWZpeFxuICAgIC8vIEJlZm9yZSB0eXBlICB8ICAgQWZ0ZXIgdHlwZSAgICB8ICAgICBSZXR1cm4gdmFsdWVcbiAgICAvLyBQRUZJWC0uLi4gICAgfCAgIFBFRklYLS4uLiAgICAgfCAgICAgJydcbiAgICAvLyBQUkVGSVgtMTIzICAgfCAgIFBFRklYLTEyMyAgICAgfCAgICAgMTIzXG4gICAgLy8gUFJFRklYLTEyMyAgIHwgICBQUkVGSVgtMjMgICAgIHwgICAgIDIzXG4gICAgLy8gUFJFRklYLTEyMyAgIHwgICBQUkVGSVgtMTIzNCAgIHwgICAgIDEyMzRcbiAgICBnZXRQcmVmaXhTdHJpcHBlZFZhbHVlOiBmdW5jdGlvbiAodmFsdWUsIHByZWZpeCwgcHJlZml4TGVuZ3RoLCBwcmV2UmVzdWx0LCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMsIG5vSW1tZWRpYXRlUHJlZml4LCB0YWlsUHJlZml4LCBzaWduQmVmb3JlUHJlZml4KSB7XG4gICAgICAgIC8vIE5vIHByZWZpeFxuICAgICAgICBpZiAocHJlZml4TGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcHJlZml4XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gcHJlZml4ICYmIHZhbHVlICE9PSAnJykge1xuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaWduQmVmb3JlUHJlZml4ICYmICh2YWx1ZS5zbGljZSgwLCAxKSA9PSAnLScpKSB7XG4gICAgICAgICAgICB2YXIgcHJldiA9IChwcmV2UmVzdWx0LnNsaWNlKDAsIDEpID09ICctJykgPyBwcmV2UmVzdWx0LnNsaWNlKDEpIDogcHJldlJlc3VsdDtcbiAgICAgICAgICAgIHJldHVybiAnLScgKyB0aGlzLmdldFByZWZpeFN0cmlwcGVkVmFsdWUodmFsdWUuc2xpY2UoMSksIHByZWZpeCwgcHJlZml4TGVuZ3RoLCBwcmV2LCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMsIG5vSW1tZWRpYXRlUHJlZml4LCB0YWlsUHJlZml4LCBzaWduQmVmb3JlUHJlZml4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZSByZXN1bHQgcHJlZml4IHN0cmluZyBkb2VzIG5vdCBtYXRjaCBwcmUtZGVmaW5lZCBwcmVmaXhcbiAgICAgICAgaWYgKHByZXZSZXN1bHQuc2xpY2UoMCwgcHJlZml4TGVuZ3RoKSAhPT0gcHJlZml4ICYmICF0YWlsUHJlZml4KSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgZmlyc3QgdGltZSB1c2VyIGVudGVyZWQgc29tZXRoaW5nXG4gICAgICAgICAgICBpZiAobm9JbW1lZGlhdGVQcmVmaXggJiYgIXByZXZSZXN1bHQgJiYgdmFsdWUpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2UmVzdWx0LnNsaWNlKC1wcmVmaXhMZW5ndGgpICE9PSBwcmVmaXggJiYgdGFpbFByZWZpeCkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGZpcnN0IHRpbWUgdXNlciBlbnRlcmVkIHNvbWV0aGluZ1xuICAgICAgICAgICAgaWYgKG5vSW1tZWRpYXRlUHJlZml4ICYmICFwcmV2UmVzdWx0ICYmIHZhbHVlKSByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJldlZhbHVlID0gdGhpcy5zdHJpcERlbGltaXRlcnMocHJldlJlc3VsdCwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKTtcblxuICAgICAgICAvLyBOZXcgdmFsdWUgaGFzIGlzc3VlLCBzb21lb25lIHR5cGVkIGluIGJldHdlZW4gcHJlZml4IGxldHRlcnNcbiAgICAgICAgLy8gUmV2ZXJ0IHRvIHByZSB2YWx1ZVxuICAgICAgICBpZiAodmFsdWUuc2xpY2UoMCwgcHJlZml4TGVuZ3RoKSAhPT0gcHJlZml4ICYmICF0YWlsUHJlZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gcHJldlZhbHVlLnNsaWNlKHByZWZpeExlbmd0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUuc2xpY2UoLXByZWZpeExlbmd0aCkgIT09IHByZWZpeCAmJiB0YWlsUHJlZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gcHJldlZhbHVlLnNsaWNlKDAsIC1wcmVmaXhMZW5ndGggLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vIGlzc3VlLCBzdHJpcCBwcmVmaXggZm9yIG5ldyB2YWx1ZVxuICAgICAgICByZXR1cm4gdGFpbFByZWZpeCA/IHZhbHVlLnNsaWNlKDAsIC1wcmVmaXhMZW5ndGgpIDogdmFsdWUuc2xpY2UocHJlZml4TGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgZ2V0Rmlyc3REaWZmSW5kZXg6IGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7XG4gICAgICAgIHZhciBpbmRleCA9IDA7XG5cbiAgICAgICAgd2hpbGUgKHByZXYuY2hhckF0KGluZGV4KSA9PT0gY3VycmVudC5jaGFyQXQoaW5kZXgpKSB7XG4gICAgICAgICAgICBpZiAocHJldi5jaGFyQXQoaW5kZXgrKykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICBnZXRGb3JtYXR0ZWRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlLCBibG9ja3MsIGJsb2Nrc0xlbmd0aCwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzLCBkZWxpbWl0ZXJMYXp5U2hvdykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gJycsXG4gICAgICAgICAgICBtdWx0aXBsZURlbGltaXRlcnMgPSBkZWxpbWl0ZXJzLmxlbmd0aCA+IDAsXG4gICAgICAgICAgICBjdXJyZW50RGVsaW1pdGVyID0gJyc7XG5cbiAgICAgICAgLy8gbm8gb3B0aW9ucywgbm9ybWFsIGlucHV0XG4gICAgICAgIGlmIChibG9ja3NMZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uIChsZW5ndGgsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBzdWIgPSB2YWx1ZS5zbGljZSgwLCBsZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICByZXN0ID0gdmFsdWUuc2xpY2UobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIGlmIChtdWx0aXBsZURlbGltaXRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudERlbGltaXRlciA9IGRlbGltaXRlcnNbZGVsaW1pdGVyTGF6eVNob3cgPyAoaW5kZXggLSAxKSA6IGluZGV4XSB8fCBjdXJyZW50RGVsaW1pdGVyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnREZWxpbWl0ZXIgPSBkZWxpbWl0ZXI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRlbGltaXRlckxhenlTaG93KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjdXJyZW50RGVsaW1pdGVyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN1YjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gc3ViO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWIubGVuZ3RoID09PSBsZW5ndGggJiYgaW5kZXggPCBibG9ja3NMZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gY3VycmVudERlbGltaXRlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSByZW1haW5pbmcgc3RyaW5nXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyBtb3ZlIGN1cnNvciB0byB0aGUgZW5kXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgdXNlciBmb2N1c2VzIG9uIGFuIGlucHV0IHdpdGggcHJlZml4XG4gICAgZml4UHJlZml4Q3Vyc29yOiBmdW5jdGlvbiAoZWwsIHByZWZpeCwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKSB7XG4gICAgICAgIGlmICghZWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWwgPSBlbC52YWx1ZSxcbiAgICAgICAgICAgIGFwcGVuZGl4ID0gZGVsaW1pdGVyIHx8IChkZWxpbWl0ZXJzWzBdIHx8ICcgJyk7XG5cbiAgICAgICAgaWYgKCFlbC5zZXRTZWxlY3Rpb25SYW5nZSB8fCAhcHJlZml4IHx8IChwcmVmaXgubGVuZ3RoICsgYXBwZW5kaXgubGVuZ3RoKSA8PSB2YWwubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuID0gdmFsLmxlbmd0aCAqIDI7XG5cbiAgICAgICAgLy8gc2V0IHRpbWVvdXQgdG8gYXZvaWQgYmxpbmtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShsZW4sIGxlbik7XG4gICAgICAgIH0sIDEpO1xuICAgIH0sXG5cbiAgICAvLyBDaGVjayBpZiBpbnB1dCBmaWVsZCBpcyBmdWxseSBzZWxlY3RlZFxuICAgIGNoZWNrRnVsbFNlbGVjdGlvbjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkgfHwgZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCkgfHwge307XG4gICAgICAgIHJldHVybiBzZWxlY3Rpb24udG9TdHJpbmcoKS5sZW5ndGggPT09IHZhbHVlLmxlbmd0aDtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIC8vIElnbm9yZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHNldFNlbGVjdGlvbjogZnVuY3Rpb24gKGVsZW1lbnQsIHBvc2l0aW9uLCBkb2MpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgIT09IHRoaXMuZ2V0QWN0aXZlRWxlbWVudChkb2MpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjdXJzb3IgaXMgYWxyZWFkeSBpbiB0aGUgZW5kXG4gICAgICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQudmFsdWUubGVuZ3RoIDw9IHBvc2l0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY3JlYXRlVGV4dFJhbmdlKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBlbGVtZW50LmNyZWF0ZVRleHRSYW5nZSgpO1xuXG4gICAgICAgICAgICByYW5nZS5tb3ZlKCdjaGFyYWN0ZXInLCBwb3NpdGlvbik7XG4gICAgICAgICAgICByYW5nZS5zZWxlY3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShwb3NpdGlvbiwgcG9zaXRpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhlIGlucHV0IGVsZW1lbnQgdHlwZSBkb2VzIG5vdCBzdXBwb3J0IHNlbGVjdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldEFjdGl2ZUVsZW1lbnQ6IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IHBhcmVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgICBpZiAoYWN0aXZlRWxlbWVudCAmJiBhY3RpdmVFbGVtZW50LnNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFjdGl2ZUVsZW1lbnQoYWN0aXZlRWxlbWVudC5zaGFkb3dSb290KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRWxlbWVudDtcbiAgICB9LFxuXG4gICAgaXNBbmRyb2lkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuYXZpZ2F0b3IgJiYgL2FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgIH0sXG5cbiAgICAvLyBPbiBBbmRyb2lkIGNocm9tZSwgdGhlIGtleXVwIGFuZCBrZXlkb3duIGV2ZW50c1xuICAgIC8vIGFsd2F5cyByZXR1cm4ga2V5IGNvZGUgMjI5IGFzIGEgY29tcG9zaXRpb24gdGhhdFxuICAgIC8vIGJ1ZmZlcnMgdGhlIHVzZXJcdTIwMTlzIGtleXN0cm9rZXNcbiAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vc2lyL2NsZWF2ZS5qcy9pc3N1ZXMvMTQ3XG4gICAgaXNBbmRyb2lkQmFja3NwYWNlS2V5ZG93bjogZnVuY3Rpb24gKGxhc3RJbnB1dFZhbHVlLCBjdXJyZW50SW5wdXRWYWx1ZSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNBbmRyb2lkKCkgfHwgIWxhc3RJbnB1dFZhbHVlIHx8ICFjdXJyZW50SW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRJbnB1dFZhbHVlID09PSBsYXN0SW5wdXRWYWx1ZS5zbGljZSgwLCAtMSk7XG4gICAgfVxufTtcblxudmFyIFV0aWxfMSA9IFV0aWw7XG5cbi8qKlxuICogUHJvcHMgQXNzaWdubWVudFxuICpcbiAqIFNlcGFyYXRlIHRoaXMsIHNvIHJlYWN0IG1vZHVsZSBjYW4gc2hhcmUgdGhlIHVzYWdlXG4gKi9cbnZhciBEZWZhdWx0UHJvcGVydGllcyA9IHtcbiAgICAvLyBNYXliZSBjaGFuZ2UgdG8gb2JqZWN0LWFzc2lnblxuICAgIC8vIGZvciBub3cganVzdCBrZWVwIGl0IGFzIHNpbXBsZVxuICAgIGFzc2lnbjogZnVuY3Rpb24gKHRhcmdldCwgb3B0cykge1xuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwge307XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIC8vIGNyZWRpdCBjYXJkXG4gICAgICAgIHRhcmdldC5jcmVkaXRDYXJkID0gISFvcHRzLmNyZWRpdENhcmQ7XG4gICAgICAgIHRhcmdldC5jcmVkaXRDYXJkU3RyaWN0TW9kZSA9ICEhb3B0cy5jcmVkaXRDYXJkU3RyaWN0TW9kZTtcbiAgICAgICAgdGFyZ2V0LmNyZWRpdENhcmRUeXBlID0gJyc7XG4gICAgICAgIHRhcmdldC5vbkNyZWRpdENhcmRUeXBlQ2hhbmdlZCA9IG9wdHMub25DcmVkaXRDYXJkVHlwZUNoYW5nZWQgfHwgKGZ1bmN0aW9uICgpIHt9KTtcblxuICAgICAgICAvLyBwaG9uZVxuICAgICAgICB0YXJnZXQucGhvbmUgPSAhIW9wdHMucGhvbmU7XG4gICAgICAgIHRhcmdldC5waG9uZVJlZ2lvbkNvZGUgPSBvcHRzLnBob25lUmVnaW9uQ29kZSB8fCAnQVUnO1xuICAgICAgICB0YXJnZXQucGhvbmVGb3JtYXR0ZXIgPSB7fTtcblxuICAgICAgICAvLyB0aW1lXG4gICAgICAgIHRhcmdldC50aW1lID0gISFvcHRzLnRpbWU7XG4gICAgICAgIHRhcmdldC50aW1lUGF0dGVybiA9IG9wdHMudGltZVBhdHRlcm4gfHwgWydoJywgJ20nLCAncyddO1xuICAgICAgICB0YXJnZXQudGltZUZvcm1hdCA9IG9wdHMudGltZUZvcm1hdCB8fCAnMjQnO1xuICAgICAgICB0YXJnZXQudGltZUZvcm1hdHRlciA9IHt9O1xuXG4gICAgICAgIC8vIGRhdGVcbiAgICAgICAgdGFyZ2V0LmRhdGUgPSAhIW9wdHMuZGF0ZTtcbiAgICAgICAgdGFyZ2V0LmRhdGVQYXR0ZXJuID0gb3B0cy5kYXRlUGF0dGVybiB8fCBbJ2QnLCAnbScsICdZJ107XG4gICAgICAgIHRhcmdldC5kYXRlTWluID0gb3B0cy5kYXRlTWluIHx8ICcnO1xuICAgICAgICB0YXJnZXQuZGF0ZU1heCA9IG9wdHMuZGF0ZU1heCB8fCAnJztcbiAgICAgICAgdGFyZ2V0LmRhdGVGb3JtYXR0ZXIgPSB7fTtcblxuICAgICAgICAvLyBudW1lcmFsXG4gICAgICAgIHRhcmdldC5udW1lcmFsID0gISFvcHRzLm51bWVyYWw7XG4gICAgICAgIHRhcmdldC5udW1lcmFsSW50ZWdlclNjYWxlID0gb3B0cy5udW1lcmFsSW50ZWdlclNjYWxlID4gMCA/IG9wdHMubnVtZXJhbEludGVnZXJTY2FsZSA6IDA7XG4gICAgICAgIHRhcmdldC5udW1lcmFsRGVjaW1hbFNjYWxlID0gb3B0cy5udW1lcmFsRGVjaW1hbFNjYWxlID49IDAgPyBvcHRzLm51bWVyYWxEZWNpbWFsU2NhbGUgOiAyO1xuICAgICAgICB0YXJnZXQubnVtZXJhbERlY2ltYWxNYXJrID0gb3B0cy5udW1lcmFsRGVjaW1hbE1hcmsgfHwgJy4nO1xuICAgICAgICB0YXJnZXQubnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUgPSBvcHRzLm51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlIHx8ICd0aG91c2FuZCc7XG4gICAgICAgIHRhcmdldC5udW1lcmFsUG9zaXRpdmVPbmx5ID0gISFvcHRzLm51bWVyYWxQb3NpdGl2ZU9ubHk7XG4gICAgICAgIHRhcmdldC5zdHJpcExlYWRpbmdaZXJvZXMgPSBvcHRzLnN0cmlwTGVhZGluZ1plcm9lcyAhPT0gZmFsc2U7XG4gICAgICAgIHRhcmdldC5zaWduQmVmb3JlUHJlZml4ID0gISFvcHRzLnNpZ25CZWZvcmVQcmVmaXg7XG4gICAgICAgIHRhcmdldC50YWlsUHJlZml4ID0gISFvcHRzLnRhaWxQcmVmaXg7XG5cbiAgICAgICAgLy8gb3RoZXJzXG4gICAgICAgIHRhcmdldC5zd2FwSGlkZGVuSW5wdXQgPSAhIW9wdHMuc3dhcEhpZGRlbklucHV0O1xuICAgICAgICBcbiAgICAgICAgdGFyZ2V0Lm51bWVyaWNPbmx5ID0gdGFyZ2V0LmNyZWRpdENhcmQgfHwgdGFyZ2V0LmRhdGUgfHwgISFvcHRzLm51bWVyaWNPbmx5O1xuXG4gICAgICAgIHRhcmdldC51cHBlcmNhc2UgPSAhIW9wdHMudXBwZXJjYXNlO1xuICAgICAgICB0YXJnZXQubG93ZXJjYXNlID0gISFvcHRzLmxvd2VyY2FzZTtcblxuICAgICAgICB0YXJnZXQucHJlZml4ID0gKHRhcmdldC5jcmVkaXRDYXJkIHx8IHRhcmdldC5kYXRlKSA/ICcnIDogKG9wdHMucHJlZml4IHx8ICcnKTtcbiAgICAgICAgdGFyZ2V0Lm5vSW1tZWRpYXRlUHJlZml4ID0gISFvcHRzLm5vSW1tZWRpYXRlUHJlZml4O1xuICAgICAgICB0YXJnZXQucHJlZml4TGVuZ3RoID0gdGFyZ2V0LnByZWZpeC5sZW5ndGg7XG4gICAgICAgIHRhcmdldC5yYXdWYWx1ZVRyaW1QcmVmaXggPSAhIW9wdHMucmF3VmFsdWVUcmltUHJlZml4O1xuICAgICAgICB0YXJnZXQuY29weURlbGltaXRlciA9ICEhb3B0cy5jb3B5RGVsaW1pdGVyO1xuXG4gICAgICAgIHRhcmdldC5pbml0VmFsdWUgPSAob3B0cy5pbml0VmFsdWUgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmluaXRWYWx1ZSAhPT0gbnVsbCkgPyBvcHRzLmluaXRWYWx1ZS50b1N0cmluZygpIDogJyc7XG5cbiAgICAgICAgdGFyZ2V0LmRlbGltaXRlciA9XG4gICAgICAgICAgICAob3B0cy5kZWxpbWl0ZXIgfHwgb3B0cy5kZWxpbWl0ZXIgPT09ICcnKSA/IG9wdHMuZGVsaW1pdGVyIDpcbiAgICAgICAgICAgICAgICAob3B0cy5kYXRlID8gJy8nIDpcbiAgICAgICAgICAgICAgICAgICAgKG9wdHMudGltZSA/ICc6JyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAob3B0cy5udW1lcmFsID8gJywnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAob3B0cy5waG9uZSA/ICcgJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgJykpKSk7XG4gICAgICAgIHRhcmdldC5kZWxpbWl0ZXJMZW5ndGggPSB0YXJnZXQuZGVsaW1pdGVyLmxlbmd0aDtcbiAgICAgICAgdGFyZ2V0LmRlbGltaXRlckxhenlTaG93ID0gISFvcHRzLmRlbGltaXRlckxhenlTaG93O1xuICAgICAgICB0YXJnZXQuZGVsaW1pdGVycyA9IG9wdHMuZGVsaW1pdGVycyB8fCBbXTtcblxuICAgICAgICB0YXJnZXQuYmxvY2tzID0gb3B0cy5ibG9ja3MgfHwgW107XG4gICAgICAgIHRhcmdldC5ibG9ja3NMZW5ndGggPSB0YXJnZXQuYmxvY2tzLmxlbmd0aDtcblxuICAgICAgICB0YXJnZXQucm9vdCA9ICh0eXBlb2YgY29tbW9uanNHbG9iYWwgPT09ICdvYmplY3QnICYmIGNvbW1vbmpzR2xvYmFsKSA/IGNvbW1vbmpzR2xvYmFsIDogd2luZG93O1xuICAgICAgICB0YXJnZXQuZG9jdW1lbnQgPSBvcHRzLmRvY3VtZW50IHx8IHRhcmdldC5yb290LmRvY3VtZW50O1xuXG4gICAgICAgIHRhcmdldC5tYXhMZW5ndGggPSAwO1xuXG4gICAgICAgIHRhcmdldC5iYWNrc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgdGFyZ2V0LnJlc3VsdCA9ICcnO1xuXG4gICAgICAgIHRhcmdldC5vblZhbHVlQ2hhbmdlZCA9IG9wdHMub25WYWx1ZUNoYW5nZWQgfHwgKGZ1bmN0aW9uICgpIHt9KTtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbn07XG5cbnZhciBEZWZhdWx0UHJvcGVydGllc18xID0gRGVmYXVsdFByb3BlcnRpZXM7XG5cbi8qKlxuICogQ29uc3RydWN0IGEgbmV3IENsZWF2ZSBpbnN0YW5jZSBieSBwYXNzaW5nIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nIHwgSFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbnZhciBDbGVhdmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0cykge1xuICAgIHZhciBvd25lciA9IHRoaXM7XG4gICAgdmFyIGhhc011bHRpcGxlRWxlbWVudHMgPSBmYWxzZTtcblxuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgb3duZXIuZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG4gICAgICAgIGhhc011bHRpcGxlRWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGVsZW1lbnQpLmxlbmd0aCA+IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudC5sZW5ndGggIT09ICd1bmRlZmluZWQnICYmIGVsZW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICBvd25lci5lbGVtZW50ID0gZWxlbWVudFswXTtcbiAgICAgICAgaGFzTXVsdGlwbGVFbGVtZW50cyA9IGVsZW1lbnQubGVuZ3RoID4gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG93bmVyLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghb3duZXIuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tjbGVhdmUuanNdIFBsZWFzZSBjaGVjayB0aGUgZWxlbWVudCcpO1xuICAgIH1cblxuICAgIGlmIChoYXNNdWx0aXBsZUVsZW1lbnRzKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgY29uc29sZS53YXJuKCdbY2xlYXZlLmpzXSBNdWx0aXBsZSBpbnB1dCBmaWVsZHMgbWF0Y2hlZCwgY2xlYXZlLmpzIHdpbGwgb25seSB0YWtlIHRoZSBmaXJzdCBvbmUuJyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIE9sZCBJRVxuICAgICAgfVxuICAgIH1cblxuICAgIG9wdHMuaW5pdFZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZTtcblxuICAgIG93bmVyLnByb3BlcnRpZXMgPSBDbGVhdmUuRGVmYXVsdFByb3BlcnRpZXMuYXNzaWduKHt9LCBvcHRzKTtcblxuICAgIG93bmVyLmluaXQoKTtcbn07XG5cbkNsZWF2ZS5wcm90b3R5cGUgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIC8vIG5vIG5lZWQgdG8gdXNlIHRoaXMgbGliXG4gICAgICAgIGlmICghcHBzLm51bWVyYWwgJiYgIXBwcy5waG9uZSAmJiAhcHBzLmNyZWRpdENhcmQgJiYgIXBwcy50aW1lICYmICFwcHMuZGF0ZSAmJiAocHBzLmJsb2Nrc0xlbmd0aCA9PT0gMCAmJiAhcHBzLnByZWZpeCkpIHtcbiAgICAgICAgICAgIG93bmVyLm9uSW5wdXQocHBzLmluaXRWYWx1ZSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBwcy5tYXhMZW5ndGggPSBDbGVhdmUuVXRpbC5nZXRNYXhMZW5ndGgocHBzLmJsb2Nrcyk7XG5cbiAgICAgICAgb3duZXIuaXNBbmRyb2lkID0gQ2xlYXZlLlV0aWwuaXNBbmRyb2lkKCk7XG4gICAgICAgIG93bmVyLmxhc3RJbnB1dFZhbHVlID0gJyc7XG4gICAgICAgIG93bmVyLmlzQmFja3dhcmQgPSAnJztcblxuICAgICAgICBvd25lci5vbkNoYW5nZUxpc3RlbmVyID0gb3duZXIub25DaGFuZ2UuYmluZChvd25lcik7XG4gICAgICAgIG93bmVyLm9uS2V5RG93bkxpc3RlbmVyID0gb3duZXIub25LZXlEb3duLmJpbmQob3duZXIpO1xuICAgICAgICBvd25lci5vbkZvY3VzTGlzdGVuZXIgPSBvd25lci5vbkZvY3VzLmJpbmQob3duZXIpO1xuICAgICAgICBvd25lci5vbkN1dExpc3RlbmVyID0gb3duZXIub25DdXQuYmluZChvd25lcik7XG4gICAgICAgIG93bmVyLm9uQ29weUxpc3RlbmVyID0gb3duZXIub25Db3B5LmJpbmQob3duZXIpO1xuXG4gICAgICAgIG93bmVyLmluaXRTd2FwSGlkZGVuSW5wdXQoKTtcblxuICAgICAgICBvd25lci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0Jywgb3duZXIub25DaGFuZ2VMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG93bmVyLm9uS2V5RG93bkxpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIG93bmVyLm9uRm9jdXNMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY3V0Jywgb3duZXIub25DdXRMaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29weScsIG93bmVyLm9uQ29weUxpc3RlbmVyKTtcblxuXG4gICAgICAgIG93bmVyLmluaXRQaG9uZUZvcm1hdHRlcigpO1xuICAgICAgICBvd25lci5pbml0RGF0ZUZvcm1hdHRlcigpO1xuICAgICAgICBvd25lci5pbml0VGltZUZvcm1hdHRlcigpO1xuICAgICAgICBvd25lci5pbml0TnVtZXJhbEZvcm1hdHRlcigpO1xuXG4gICAgICAgIC8vIGF2b2lkIHRvdWNoIGlucHV0IGZpZWxkIGlmIHZhbHVlIGlzIG51bGxcbiAgICAgICAgLy8gb3RoZXJ3aXNlIEZpcmVmb3ggd2lsbCBhZGQgcmVkIGJveC1zaGFkb3cgZm9yIDxpbnB1dCByZXF1aXJlZCAvPlxuICAgICAgICBpZiAocHBzLmluaXRWYWx1ZSB8fCAocHBzLnByZWZpeCAmJiAhcHBzLm5vSW1tZWRpYXRlUHJlZml4KSkge1xuICAgICAgICAgICAgb3duZXIub25JbnB1dChwcHMuaW5pdFZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0U3dhcEhpZGRlbklucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG4gICAgICAgIGlmICghcHBzLnN3YXBIaWRkZW5JbnB1dCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpbnB1dEZvcm1hdHRlciA9IG93bmVyLmVsZW1lbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBvd25lci5lbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGlucHV0Rm9ybWF0dGVyLCBvd25lci5lbGVtZW50KTtcblxuICAgICAgICBvd25lci5lbGVtZW50U3dhcEhpZGRlbiA9IG93bmVyLmVsZW1lbnQ7XG4gICAgICAgIG93bmVyLmVsZW1lbnRTd2FwSGlkZGVuLnR5cGUgPSAnaGlkZGVuJztcblxuICAgICAgICBvd25lci5lbGVtZW50ID0gaW5wdXRGb3JtYXR0ZXI7XG4gICAgICAgIG93bmVyLmVsZW1lbnQuaWQgPSAnJztcbiAgICB9LFxuXG4gICAgaW5pdE51bWVyYWxGb3JtYXR0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBpZiAoIXBwcy5udW1lcmFsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcHMubnVtZXJhbEZvcm1hdHRlciA9IG5ldyBDbGVhdmUuTnVtZXJhbEZvcm1hdHRlcihcbiAgICAgICAgICAgIHBwcy5udW1lcmFsRGVjaW1hbE1hcmssXG4gICAgICAgICAgICBwcHMubnVtZXJhbEludGVnZXJTY2FsZSxcbiAgICAgICAgICAgIHBwcy5udW1lcmFsRGVjaW1hbFNjYWxlLFxuICAgICAgICAgICAgcHBzLm51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlLFxuICAgICAgICAgICAgcHBzLm51bWVyYWxQb3NpdGl2ZU9ubHksXG4gICAgICAgICAgICBwcHMuc3RyaXBMZWFkaW5nWmVyb2VzLFxuICAgICAgICAgICAgcHBzLnByZWZpeCxcbiAgICAgICAgICAgIHBwcy5zaWduQmVmb3JlUHJlZml4LFxuICAgICAgICAgICAgcHBzLnRhaWxQcmVmaXgsXG4gICAgICAgICAgICBwcHMuZGVsaW1pdGVyXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIGluaXRUaW1lRm9ybWF0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBpZiAoIXBwcy50aW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcHMudGltZUZvcm1hdHRlciA9IG5ldyBDbGVhdmUuVGltZUZvcm1hdHRlcihwcHMudGltZVBhdHRlcm4sIHBwcy50aW1lRm9ybWF0KTtcbiAgICAgICAgcHBzLmJsb2NrcyA9IHBwcy50aW1lRm9ybWF0dGVyLmdldEJsb2NrcygpO1xuICAgICAgICBwcHMuYmxvY2tzTGVuZ3RoID0gcHBzLmJsb2Nrcy5sZW5ndGg7XG4gICAgICAgIHBwcy5tYXhMZW5ndGggPSBDbGVhdmUuVXRpbC5nZXRNYXhMZW5ndGgocHBzLmJsb2Nrcyk7XG4gICAgfSxcblxuICAgIGluaXREYXRlRm9ybWF0dGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgaWYgKCFwcHMuZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcHBzLmRhdGVGb3JtYXR0ZXIgPSBuZXcgQ2xlYXZlLkRhdGVGb3JtYXR0ZXIocHBzLmRhdGVQYXR0ZXJuLCBwcHMuZGF0ZU1pbiwgcHBzLmRhdGVNYXgpO1xuICAgICAgICBwcHMuYmxvY2tzID0gcHBzLmRhdGVGb3JtYXR0ZXIuZ2V0QmxvY2tzKCk7XG4gICAgICAgIHBwcy5ibG9ja3NMZW5ndGggPSBwcHMuYmxvY2tzLmxlbmd0aDtcbiAgICAgICAgcHBzLm1heExlbmd0aCA9IENsZWF2ZS5VdGlsLmdldE1heExlbmd0aChwcHMuYmxvY2tzKTtcbiAgICB9LFxuXG4gICAgaW5pdFBob25lRm9ybWF0dGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgaWYgKCFwcHMucGhvbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWF2ZS5Bc1lvdVR5cGVGb3JtYXR0ZXIgc2hvdWxkIGJlIHByb3ZpZGVkIGJ5XG4gICAgICAgIC8vIGV4dGVybmFsIGdvb2dsZSBjbG9zdXJlIGxpYlxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHBzLnBob25lRm9ybWF0dGVyID0gbmV3IENsZWF2ZS5QaG9uZUZvcm1hdHRlcihcbiAgICAgICAgICAgICAgICBuZXcgcHBzLnJvb3QuQ2xlYXZlLkFzWW91VHlwZUZvcm1hdHRlcihwcHMucGhvbmVSZWdpb25Db2RlKSxcbiAgICAgICAgICAgICAgICBwcHMuZGVsaW1pdGVyXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbY2xlYXZlLmpzXSBQbGVhc2UgaW5jbHVkZSBwaG9uZS10eXBlLWZvcm1hdHRlci57Y291bnRyeX0uanMgbGliJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25LZXlEb3duOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIGNoYXJDb2RlID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuICAgICAgICBvd25lci5sYXN0SW5wdXRWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWU7XG4gICAgICAgIG93bmVyLmlzQmFja3dhcmQgPSBjaGFyQ29kZSA9PT0gODtcbiAgICB9LFxuXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsO1xuXG4gICAgICAgIG93bmVyLmlzQmFja3dhcmQgPSBvd25lci5pc0JhY2t3YXJkIHx8IGV2ZW50LmlucHV0VHlwZSA9PT0gJ2RlbGV0ZUNvbnRlbnRCYWNrd2FyZCc7XG5cbiAgICAgICAgdmFyIHBvc3REZWxpbWl0ZXIgPSBVdGlsLmdldFBvc3REZWxpbWl0ZXIob3duZXIubGFzdElucHV0VmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcblxuICAgICAgICBpZiAob3duZXIuaXNCYWNrd2FyZCAmJiBwb3N0RGVsaW1pdGVyKSB7XG4gICAgICAgICAgICBwcHMucG9zdERlbGltaXRlckJhY2tzcGFjZSA9IHBvc3REZWxpbWl0ZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcHMucG9zdERlbGltaXRlckJhY2tzcGFjZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbklucHV0KHRoaXMuZWxlbWVudC52YWx1ZSk7XG4gICAgfSxcblxuICAgIG9uRm9jdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG4gICAgICAgIG93bmVyLmxhc3RJbnB1dFZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZTtcblxuICAgICAgICBpZiAocHBzLnByZWZpeCAmJiBwcHMubm9JbW1lZGlhdGVQcmVmaXggJiYgIW93bmVyLmVsZW1lbnQudmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMub25JbnB1dChwcHMucHJlZml4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIENsZWF2ZS5VdGlsLmZpeFByZWZpeEN1cnNvcihvd25lci5lbGVtZW50LCBwcHMucHJlZml4LCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG4gICAgfSxcblxuICAgIG9uQ3V0OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIUNsZWF2ZS5VdGlsLmNoZWNrRnVsbFNlbGVjdGlvbih0aGlzLmVsZW1lbnQudmFsdWUpKSByZXR1cm47XG4gICAgICAgIHRoaXMuY29weUNsaXBib2FyZERhdGEoZSk7XG4gICAgICAgIHRoaXMub25JbnB1dCgnJyk7XG4gICAgfSxcblxuICAgIG9uQ29weTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFDbGVhdmUuVXRpbC5jaGVja0Z1bGxTZWxlY3Rpb24odGhpcy5lbGVtZW50LnZhbHVlKSkgcmV0dXJuO1xuICAgICAgICB0aGlzLmNvcHlDbGlwYm9hcmREYXRhKGUpO1xuICAgIH0sXG5cbiAgICBjb3B5Q2xpcGJvYXJkRGF0YTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWwsXG4gICAgICAgICAgICBpbnB1dFZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZSxcbiAgICAgICAgICAgIHRleHRUb0NvcHkgPSAnJztcblxuICAgICAgICBpZiAoIXBwcy5jb3B5RGVsaW1pdGVyKSB7XG4gICAgICAgICAgICB0ZXh0VG9Db3B5ID0gVXRpbC5zdHJpcERlbGltaXRlcnMoaW5wdXRWYWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGV4dFRvQ29weSA9IGlucHV0VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGUuY2xpcGJvYXJkRGF0YSkge1xuICAgICAgICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCdUZXh0JywgdGV4dFRvQ29weSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGlwYm9hcmREYXRhLnNldERhdGEoJ1RleHQnLCB0ZXh0VG9Db3B5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgLy8gIGVtcHR5XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25JbnB1dDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWw7XG5cbiAgICAgICAgLy8gY2FzZSAxOiBkZWxldGUgb25lIG1vcmUgY2hhcmFjdGVyIFwiNFwiXG4gICAgICAgIC8vIDEyMzQqfCAtPiBoaXQgYmFja3NwYWNlIC0+IDEyM3xcbiAgICAgICAgLy8gY2FzZSAyOiBsYXN0IGNoYXJhY3RlciBpcyBub3QgZGVsaW1pdGVyIHdoaWNoIGlzOlxuICAgICAgICAvLyAxMnwzNCogLT4gaGl0IGJhY2tzcGFjZSAtPiAxfDM0KlxuICAgICAgICAvLyBub3RlOiBubyBuZWVkIHRvIGFwcGx5IHRoaXMgZm9yIG51bWVyYWwgbW9kZVxuICAgICAgICB2YXIgcG9zdERlbGltaXRlckFmdGVyID0gVXRpbC5nZXRQb3N0RGVsaW1pdGVyKHZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG4gICAgICAgIGlmICghcHBzLm51bWVyYWwgJiYgcHBzLnBvc3REZWxpbWl0ZXJCYWNrc3BhY2UgJiYgIXBvc3REZWxpbWl0ZXJBZnRlcikge1xuICAgICAgICAgICAgdmFsdWUgPSBVdGlsLmhlYWRTdHIodmFsdWUsIHZhbHVlLmxlbmd0aCAtIHBwcy5wb3N0RGVsaW1pdGVyQmFja3NwYWNlLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwaG9uZSBmb3JtYXR0ZXJcbiAgICAgICAgaWYgKHBwcy5waG9uZSkge1xuICAgICAgICAgICAgaWYgKHBwcy5wcmVmaXggJiYgKCFwcHMubm9JbW1lZGlhdGVQcmVmaXggfHwgdmFsdWUubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIHBwcy5yZXN1bHQgPSBwcHMucHJlZml4ICsgcHBzLnBob25lRm9ybWF0dGVyLmZvcm1hdCh2YWx1ZSkuc2xpY2UocHBzLnByZWZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcHMucmVzdWx0ID0gcHBzLnBob25lRm9ybWF0dGVyLmZvcm1hdCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvd25lci51cGRhdGVWYWx1ZVN0YXRlKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG51bWVyYWwgZm9ybWF0dGVyXG4gICAgICAgIGlmIChwcHMubnVtZXJhbCkge1xuICAgICAgICAgICAgLy8gRG8gbm90IHNob3cgcHJlZml4IHdoZW4gbm9JbW1lZGlhdGVQcmVmaXggaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAvLyBUaGlzIG1vc3RseSBiZWNhdXNlIHdlIG5lZWQgdG8gc2hvdyB1c2VyIHRoZSBuYXRpdmUgaW5wdXQgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIGlmIChwcHMucHJlZml4ICYmIHBwcy5ub0ltbWVkaWF0ZVByZWZpeCAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBwcHMucmVzdWx0ID0gJyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBwcy5yZXN1bHQgPSBwcHMubnVtZXJhbEZvcm1hdHRlci5mb3JtYXQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3duZXIudXBkYXRlVmFsdWVTdGF0ZSgpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkYXRlXG4gICAgICAgIGlmIChwcHMuZGF0ZSkge1xuICAgICAgICAgICAgdmFsdWUgPSBwcHMuZGF0ZUZvcm1hdHRlci5nZXRWYWxpZGF0ZWREYXRlKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRpbWVcbiAgICAgICAgaWYgKHBwcy50aW1lKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHBwcy50aW1lRm9ybWF0dGVyLmdldFZhbGlkYXRlZFRpbWUodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RyaXAgZGVsaW1pdGVyc1xuICAgICAgICB2YWx1ZSA9IFV0aWwuc3RyaXBEZWxpbWl0ZXJzKHZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG5cbiAgICAgICAgLy8gc3RyaXAgcHJlZml4XG4gICAgICAgIHZhbHVlID0gVXRpbC5nZXRQcmVmaXhTdHJpcHBlZFZhbHVlKHZhbHVlLCBwcHMucHJlZml4LCBwcHMucHJlZml4TGVuZ3RoLCBwcHMucmVzdWx0LCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycywgcHBzLm5vSW1tZWRpYXRlUHJlZml4LCBwcHMudGFpbFByZWZpeCwgcHBzLnNpZ25CZWZvcmVQcmVmaXgpO1xuXG4gICAgICAgIC8vIHN0cmlwIG5vbi1udW1lcmljIGNoYXJhY3RlcnNcbiAgICAgICAgdmFsdWUgPSBwcHMubnVtZXJpY09ubHkgPyBVdGlsLnN0cmlwKHZhbHVlLCAvW15cXGRdL2cpIDogdmFsdWU7XG5cbiAgICAgICAgLy8gY29udmVydCBjYXNlXG4gICAgICAgIHZhbHVlID0gcHBzLnVwcGVyY2FzZSA/IHZhbHVlLnRvVXBwZXJDYXNlKCkgOiB2YWx1ZTtcbiAgICAgICAgdmFsdWUgPSBwcHMubG93ZXJjYXNlID8gdmFsdWUudG9Mb3dlckNhc2UoKSA6IHZhbHVlO1xuXG4gICAgICAgIC8vIHByZXZlbnQgZnJvbSBzaG93aW5nIHByZWZpeCB3aGVuIG5vIGltbWVkaWF0ZSBvcHRpb24gZW5hYmxlZCB3aXRoIGVtcHR5IGlucHV0IHZhbHVlXG4gICAgICAgIGlmIChwcHMucHJlZml4KSB7XG4gICAgICAgICAgICBpZiAocHBzLnRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgcHBzLnByZWZpeDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwcHMucHJlZml4ICsgdmFsdWU7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gbm8gYmxvY2tzIHNwZWNpZmllZCwgbm8gbmVlZCB0byBkbyBmb3JtYXR0aW5nXG4gICAgICAgICAgICBpZiAocHBzLmJsb2Nrc0xlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBwcy5yZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBvd25lci51cGRhdGVWYWx1ZVN0YXRlKCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgY3JlZGl0IGNhcmQgcHJvcHNcbiAgICAgICAgaWYgKHBwcy5jcmVkaXRDYXJkKSB7XG4gICAgICAgICAgICBvd25lci51cGRhdGVDcmVkaXRDYXJkUHJvcHNCeVZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0cmlwIG92ZXIgbGVuZ3RoIGNoYXJhY3RlcnNcbiAgICAgICAgdmFsdWUgPSBVdGlsLmhlYWRTdHIodmFsdWUsIHBwcy5tYXhMZW5ndGgpO1xuXG4gICAgICAgIC8vIGFwcGx5IGJsb2Nrc1xuICAgICAgICBwcHMucmVzdWx0ID0gVXRpbC5nZXRGb3JtYXR0ZWRWYWx1ZShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgcHBzLmJsb2NrcywgcHBzLmJsb2Nrc0xlbmd0aCxcbiAgICAgICAgICAgIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzLCBwcHMuZGVsaW1pdGVyTGF6eVNob3dcbiAgICAgICAgKTtcblxuICAgICAgICBvd25lci51cGRhdGVWYWx1ZVN0YXRlKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNyZWRpdENhcmRQcm9wc0J5VmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsLFxuICAgICAgICAgICAgY3JlZGl0Q2FyZEluZm87XG5cbiAgICAgICAgLy8gQXQgbGVhc3Qgb25lIG9mIHRoZSBmaXJzdCA0IGNoYXJhY3RlcnMgaGFzIGNoYW5nZWRcbiAgICAgICAgaWYgKFV0aWwuaGVhZFN0cihwcHMucmVzdWx0LCA0KSA9PT0gVXRpbC5oZWFkU3RyKHZhbHVlLCA0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlZGl0Q2FyZEluZm8gPSBDbGVhdmUuQ3JlZGl0Q2FyZERldGVjdG9yLmdldEluZm8odmFsdWUsIHBwcy5jcmVkaXRDYXJkU3RyaWN0TW9kZSk7XG5cbiAgICAgICAgcHBzLmJsb2NrcyA9IGNyZWRpdENhcmRJbmZvLmJsb2NrcztcbiAgICAgICAgcHBzLmJsb2Nrc0xlbmd0aCA9IHBwcy5ibG9ja3MubGVuZ3RoO1xuICAgICAgICBwcHMubWF4TGVuZ3RoID0gVXRpbC5nZXRNYXhMZW5ndGgocHBzLmJsb2Nrcyk7XG5cbiAgICAgICAgLy8gY3JlZGl0IGNhcmQgdHlwZSBjaGFuZ2VkXG4gICAgICAgIGlmIChwcHMuY3JlZGl0Q2FyZFR5cGUgIT09IGNyZWRpdENhcmRJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgIHBwcy5jcmVkaXRDYXJkVHlwZSA9IGNyZWRpdENhcmRJbmZvLnR5cGU7XG5cbiAgICAgICAgICAgIHBwcy5vbkNyZWRpdENhcmRUeXBlQ2hhbmdlZC5jYWxsKG93bmVyLCBwcHMuY3JlZGl0Q2FyZFR5cGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHVwZGF0ZVZhbHVlU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbCxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgaWYgKCFvd25lci5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZW5kUG9zID0gb3duZXIuZWxlbWVudC5zZWxlY3Rpb25FbmQ7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWU7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IHBwcy5yZXN1bHQ7XG5cbiAgICAgICAgZW5kUG9zID0gVXRpbC5nZXROZXh0Q3Vyc29yUG9zaXRpb24oZW5kUG9zLCBvbGRWYWx1ZSwgbmV3VmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcblxuICAgICAgICAvLyBmaXggQW5kcm9pZCBicm93c2VyIHR5cGU9XCJ0ZXh0XCIgaW5wdXQgZmllbGRcbiAgICAgICAgLy8gY3Vyc29yIG5vdCBqdW1waW5nIGlzc3VlXG4gICAgICAgIGlmIChvd25lci5pc0FuZHJvaWQpIHtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvd25lci5lbGVtZW50LnZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgVXRpbC5zZXRTZWxlY3Rpb24ob3duZXIuZWxlbWVudCwgZW5kUG9zLCBwcHMuZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBvd25lci5jYWxsT25WYWx1ZUNoYW5nZWQoKTtcbiAgICAgICAgICAgIH0sIDEpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBvd25lci5lbGVtZW50LnZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgIGlmIChwcHMuc3dhcEhpZGRlbklucHV0KSBvd25lci5lbGVtZW50U3dhcEhpZGRlbi52YWx1ZSA9IG93bmVyLmdldFJhd1ZhbHVlKCk7XG5cbiAgICAgICAgVXRpbC5zZXRTZWxlY3Rpb24ob3duZXIuZWxlbWVudCwgZW5kUG9zLCBwcHMuZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgICAgb3duZXIuY2FsbE9uVmFsdWVDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIGNhbGxPblZhbHVlQ2hhbmdlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBwcHMub25WYWx1ZUNoYW5nZWQuY2FsbChvd25lciwge1xuICAgICAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb3duZXIuZWxlbWVudC5uYW1lLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwcHMucmVzdWx0LFxuICAgICAgICAgICAgICAgIHJhd1ZhbHVlOiBvd25lci5nZXRSYXdWYWx1ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZXRQaG9uZVJlZ2lvbkNvZGU6IGZ1bmN0aW9uIChwaG9uZVJlZ2lvbkNvZGUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICBwcHMucGhvbmVSZWdpb25Db2RlID0gcGhvbmVSZWdpb25Db2RlO1xuICAgICAgICBvd25lci5pbml0UGhvbmVGb3JtYXR0ZXIoKTtcbiAgICAgICAgb3duZXIub25DaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgc2V0UmF3VmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCA/IHZhbHVlLnRvU3RyaW5nKCkgOiAnJztcblxuICAgICAgICBpZiAocHBzLm51bWVyYWwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgnLicsIHBwcy5udW1lcmFsRGVjaW1hbE1hcmspO1xuICAgICAgICB9XG5cbiAgICAgICAgcHBzLnBvc3REZWxpbWl0ZXJCYWNrc3BhY2UgPSBmYWxzZTtcblxuICAgICAgICBvd25lci5lbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIG93bmVyLm9uSW5wdXQodmFsdWUpO1xuICAgIH0sXG5cbiAgICBnZXRSYXdWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbCxcbiAgICAgICAgICAgIHJhd1ZhbHVlID0gb3duZXIuZWxlbWVudC52YWx1ZTtcblxuICAgICAgICBpZiAocHBzLnJhd1ZhbHVlVHJpbVByZWZpeCkge1xuICAgICAgICAgICAgcmF3VmFsdWUgPSBVdGlsLmdldFByZWZpeFN0cmlwcGVkVmFsdWUocmF3VmFsdWUsIHBwcy5wcmVmaXgsIHBwcy5wcmVmaXhMZW5ndGgsIHBwcy5yZXN1bHQsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzLCBwcHMubm9JbW1lZGlhdGVQcmVmaXgsIHBwcy50YWlsUHJlZml4LCBwcHMuc2lnbkJlZm9yZVByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHBzLm51bWVyYWwpIHtcbiAgICAgICAgICAgIHJhd1ZhbHVlID0gcHBzLm51bWVyYWxGb3JtYXR0ZXIuZ2V0UmF3VmFsdWUocmF3VmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmF3VmFsdWUgPSBVdGlsLnN0cmlwRGVsaW1pdGVycyhyYXdWYWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJhd1ZhbHVlO1xuICAgIH0sXG5cbiAgICBnZXRJU09Gb3JtYXREYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHJldHVybiBwcHMuZGF0ZSA/IHBwcy5kYXRlRm9ybWF0dGVyLmdldElTT0Zvcm1hdERhdGUoKSA6ICcnO1xuICAgIH0sXG5cbiAgICBnZXRJU09Gb3JtYXRUaW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHJldHVybiBwcHMudGltZSA/IHBwcy50aW1lRm9ybWF0dGVyLmdldElTT0Zvcm1hdFRpbWUoKSA6ICcnO1xuICAgIH0sXG5cbiAgICBnZXRGb3JtYXR0ZWRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH0sXG5cbiAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICAgICAgb3duZXIuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcsIG93bmVyLm9uQ2hhbmdlTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvd25lci5vbktleURvd25MaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBvd25lci5vbkZvY3VzTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2N1dCcsIG93bmVyLm9uQ3V0TGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvcHknLCBvd25lci5vbkNvcHlMaXN0ZW5lcik7XG4gICAgfSxcblxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnW0NsZWF2ZSBPYmplY3RdJztcbiAgICB9XG59O1xuXG5DbGVhdmUuTnVtZXJhbEZvcm1hdHRlciA9IE51bWVyYWxGb3JtYXR0ZXJfMTtcbkNsZWF2ZS5EYXRlRm9ybWF0dGVyID0gRGF0ZUZvcm1hdHRlcl8xO1xuQ2xlYXZlLlRpbWVGb3JtYXR0ZXIgPSBUaW1lRm9ybWF0dGVyXzE7XG5DbGVhdmUuUGhvbmVGb3JtYXR0ZXIgPSBQaG9uZUZvcm1hdHRlcl8xO1xuQ2xlYXZlLkNyZWRpdENhcmREZXRlY3RvciA9IENyZWRpdENhcmREZXRlY3Rvcl8xO1xuQ2xlYXZlLlV0aWwgPSBVdGlsXzE7XG5DbGVhdmUuRGVmYXVsdFByb3BlcnRpZXMgPSBEZWZhdWx0UHJvcGVydGllc18xO1xuXG4vLyBmb3IgYW5ndWxhciBkaXJlY3RpdmVcbigodHlwZW9mIGNvbW1vbmpzR2xvYmFsID09PSAnb2JqZWN0JyAmJiBjb21tb25qc0dsb2JhbCkgPyBjb21tb25qc0dsb2JhbCA6IHdpbmRvdylbJ0NsZWF2ZSddID0gQ2xlYXZlO1xuXG4vLyBDb21tb25KU1xudmFyIENsZWF2ZV8xID0gQ2xlYXZlO1xuXG5leHBvcnQgZGVmYXVsdCBDbGVhdmVfMTtcbiIsICIhZnVuY3Rpb24oKXtmdW5jdGlvbiBuKG4sdCl7dmFyIGU9bi5zcGxpdChcIi5cIiksbD1VO2VbMF1pbiBsfHwhbC5leGVjU2NyaXB0fHxsLmV4ZWNTY3JpcHQoXCJ2YXIgXCIrZVswXSk7Zm9yKHZhciByO2UubGVuZ3RoJiYocj1lLnNoaWZ0KCkpOyllLmxlbmd0aHx8dm9pZCAwPT09dD9sPWxbcl0/bFtyXTpsW3JdPXt9Omxbcl09dH1mdW5jdGlvbiB0KG4sdCl7ZnVuY3Rpb24gZSgpe31lLnByb3RvdHlwZT10LnByb3RvdHlwZSxuLk09dC5wcm90b3R5cGUsbi5wcm90b3R5cGU9bmV3IGUsbi5wcm90b3R5cGUuY29uc3RydWN0b3I9bixuLk49ZnVuY3Rpb24obixlLGwpe2Zvcih2YXIgcj1BcnJheShhcmd1bWVudHMubGVuZ3RoLTIpLGk9MjtpPGFyZ3VtZW50cy5sZW5ndGg7aSsrKXJbaS0yXT1hcmd1bWVudHNbaV07cmV0dXJuIHQucHJvdG90eXBlW2VdLmFwcGx5KG4scil9fWZ1bmN0aW9uIGUobix0KXtudWxsIT1uJiZ0aGlzLmEuYXBwbHkodGhpcyxhcmd1bWVudHMpfWZ1bmN0aW9uIGwobil7bi5iPVwiXCJ9ZnVuY3Rpb24gcihuLHQpe24uc29ydCh0fHxpKX1mdW5jdGlvbiBpKG4sdCl7cmV0dXJuIG4+dD8xOm48dD8tMTowfWZ1bmN0aW9uIHUobil7dmFyIHQsZT1bXSxsPTA7Zm9yKHQgaW4gbillW2wrK109blt0XTtyZXR1cm4gZX1mdW5jdGlvbiBhKG4sdCl7dGhpcy5iPW4sdGhpcy5hPXt9O2Zvcih2YXIgZT0wO2U8dC5sZW5ndGg7ZSsrKXt2YXIgbD10W2VdO3RoaXMuYVtsLmJdPWx9fWZ1bmN0aW9uIG8obil7cmV0dXJuIG49dShuLmEpLHIobixmdW5jdGlvbihuLHQpe3JldHVybiBuLmItdC5ifSksbn1mdW5jdGlvbiBzKG4sdCl7c3dpdGNoKHRoaXMuYj1uLHRoaXMuZz0hIXQudix0aGlzLmE9dC5jLHRoaXMuaT10LnR5cGUsdGhpcy5oPSExLHRoaXMuYSl7Y2FzZSBKOmNhc2UgSzpjYXNlIEw6Y2FzZSBPOmNhc2UgWjpjYXNlIGs6Y2FzZSBZOnRoaXMuaD0hMH10aGlzLmY9dC5kZWZhdWx0VmFsdWV9ZnVuY3Rpb24gZigpe3RoaXMuYT17fSx0aGlzLmY9dGhpcy5qKCkuYSx0aGlzLmI9dGhpcy5nPW51bGx9ZnVuY3Rpb24gcChuLHQpe2Zvcih2YXIgZT1vKG4uaigpKSxsPTA7bDxlLmxlbmd0aDtsKyspe3ZhciByPWVbbF0saT1yLmI7aWYobnVsbCE9dC5hW2ldKXtuLmImJmRlbGV0ZSBuLmJbci5iXTt2YXIgdT0xMT09ci5hfHwxMD09ci5hO2lmKHIuZylmb3IodmFyIHI9Yyh0LGkpfHxbXSxhPTA7YTxyLmxlbmd0aDthKyspe3ZhciBzPW4sZj1pLGg9dT9yW2FdLmNsb25lKCk6clthXTtzLmFbZl18fChzLmFbZl09W10pLHMuYVtmXS5wdXNoKGgpLHMuYiYmZGVsZXRlIHMuYltmXX1lbHNlIHI9Yyh0LGkpLHU/KHU9YyhuLGkpKT9wKHUscik6bShuLGksci5jbG9uZSgpKTptKG4saSxyKX19fWZ1bmN0aW9uIGMobix0KXt2YXIgZT1uLmFbdF07aWYobnVsbD09ZSlyZXR1cm4gbnVsbDtpZihuLmcpe2lmKCEodCBpbiBuLmIpKXt2YXIgbD1uLmcscj1uLmZbdF07aWYobnVsbCE9ZSlpZihyLmcpe2Zvcih2YXIgaT1bXSx1PTA7dTxlLmxlbmd0aDt1KyspaVt1XT1sLmIocixlW3VdKTtlPWl9ZWxzZSBlPWwuYihyLGUpO3JldHVybiBuLmJbdF09ZX1yZXR1cm4gbi5iW3RdfXJldHVybiBlfWZ1bmN0aW9uIGgobix0LGUpe3ZhciBsPWMobix0KTtyZXR1cm4gbi5mW3RdLmc/bFtlfHwwXTpsfWZ1bmN0aW9uIGcobix0KXt2YXIgZTtpZihudWxsIT1uLmFbdF0pZT1oKG4sdCx2b2lkIDApO2Vsc2Ugbjp7aWYoZT1uLmZbdF0sdm9pZCAwPT09ZS5mKXt2YXIgbD1lLmk7aWYobD09PUJvb2xlYW4pZS5mPSExO2Vsc2UgaWYobD09PU51bWJlcillLmY9MDtlbHNle2lmKGwhPT1TdHJpbmcpe2U9bmV3IGw7YnJlYWsgbn1lLmY9ZS5oP1wiMFwiOlwiXCJ9fWU9ZS5mfXJldHVybiBlfWZ1bmN0aW9uIGQobix0KXtyZXR1cm4gbi5mW3RdLmc/bnVsbCE9bi5hW3RdP24uYVt0XS5sZW5ndGg6MDpudWxsIT1uLmFbdF0/MTowfWZ1bmN0aW9uIG0obix0LGUpe24uYVt0XT1lLG4uYiYmKG4uYlt0XT1lKX1mdW5jdGlvbiBiKG4sdCl7dmFyIGUsbD1bXTtmb3IoZSBpbiB0KTAhPWUmJmwucHVzaChuZXcgcyhlLHRbZV0pKTtyZXR1cm4gbmV3IGEobixsKX0vKlxuXG4gUHJvdG9jb2wgQnVmZmVyIDIgQ29weXJpZ2h0IDIwMDggR29vZ2xlIEluYy5cbiBBbGwgb3RoZXIgY29kZSBjb3B5cmlnaHQgaXRzIHJlc3BlY3RpdmUgb3duZXJzLlxuIENvcHlyaWdodCAoQykgMjAxMCBUaGUgTGlicGhvbmVudW1iZXIgQXV0aG9yc1xuXG4gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmZ1bmN0aW9uIHkoKXtmLmNhbGwodGhpcyl9ZnVuY3Rpb24gdigpe2YuY2FsbCh0aGlzKX1mdW5jdGlvbiAkKCl7Zi5jYWxsKHRoaXMpfWZ1bmN0aW9uIF8oKXt9ZnVuY3Rpb24gUygpe31mdW5jdGlvbiB3KCl7fS8qXG5cbiBDb3B5cmlnaHQgKEMpIDIwMTAgVGhlIExpYnBob25lbnVtYmVyIEF1dGhvcnMuXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuZnVuY3Rpb24geCgpe3RoaXMuYT17fX1mdW5jdGlvbiBBKG4pe3JldHVybiAwPT1uLmxlbmd0aHx8dW4udGVzdChuKX1mdW5jdGlvbiBOKG4sdCl7aWYobnVsbD09dClyZXR1cm4gbnVsbDt0PXQudG9VcHBlckNhc2UoKTt2YXIgZT1uLmFbdF07aWYobnVsbD09ZSl7aWYoZT10blt0XSxudWxsPT1lKXJldHVybiBudWxsO2U9KG5ldyB3KS5hKCQuaigpLGUpLG4uYVt0XT1lfXJldHVybiBlfWZ1bmN0aW9uIEUobil7cmV0dXJuIG49bm5bbl0sbnVsbD09bj9cIlpaXCI6blswXX1mdW5jdGlvbiBqKG4pe3RoaXMuSD1SZWdFeHAoXCJcdTIwMDhcIiksdGhpcy5DPVwiXCIsdGhpcy5tPW5ldyBlLHRoaXMudz1cIlwiLHRoaXMuaT1uZXcgZSx0aGlzLnU9bmV3IGUsdGhpcy5sPSEwLHRoaXMuQT10aGlzLm89dGhpcy5GPSExLHRoaXMuRz14LmIoKSx0aGlzLnM9MCx0aGlzLmI9bmV3IGUsdGhpcy5CPSExLHRoaXMuaD1cIlwiLHRoaXMuYT1uZXcgZSx0aGlzLmY9W10sdGhpcy5EPW4sdGhpcy5KPXRoaXMuZz1CKHRoaXMsdGhpcy5EKX1mdW5jdGlvbiBCKG4sdCl7dmFyIGU7aWYobnVsbCE9dCYmaXNOYU4odCkmJnQudG9VcHBlckNhc2UoKWluIHRuKXtpZihlPU4obi5HLHQpLG51bGw9PWUpdGhyb3cgRXJyb3IoXCJJbnZhbGlkIHJlZ2lvbiBjb2RlOiBcIit0KTtlPWcoZSwxMCl9ZWxzZSBlPTA7cmV0dXJuIGU9TihuLkcsRShlKSksbnVsbCE9ZT9lOmFufWZ1bmN0aW9uIEQobil7Zm9yKHZhciB0PW4uZi5sZW5ndGgsZT0wO2U8dDsrK2Upe3ZhciByPW4uZltlXSxpPWcociwxKTtpZihuLnc9PWkpcmV0dXJuITE7dmFyIHU7dT1uO3ZhciBhPXIsbz1nKGEsMSk7aWYoLTEhPW8uaW5kZXhPZihcInxcIikpdT0hMTtlbHNle289by5yZXBsYWNlKG9uLFwiXFxcXGRcIiksbz1vLnJlcGxhY2Uoc24sXCJcXFxcZFwiKSxsKHUubSk7dmFyIHM7cz11O3ZhciBhPWcoYSwyKSxmPVwiOTk5OTk5OTk5OTk5OTk5XCIubWF0Y2gobylbMF07Zi5sZW5ndGg8cy5hLmIubGVuZ3RoP3M9XCJcIjoocz1mLnJlcGxhY2UobmV3IFJlZ0V4cChvLFwiZ1wiKSxhKSxzPXMucmVwbGFjZShSZWdFeHAoXCI5XCIsXCJnXCIpLFwiXHUyMDA4XCIpKSwwPHMubGVuZ3RoPyh1Lm0uYShzKSx1PSEwKTp1PSExfWlmKHUpcmV0dXJuIG4udz1pLG4uQj1wbi50ZXN0KGgociw0KSksbi5zPTAsITB9cmV0dXJuIG4ubD0hMX1mdW5jdGlvbiBSKG4sdCl7Zm9yKHZhciBlPVtdLGw9dC5sZW5ndGgtMyxyPW4uZi5sZW5ndGgsaT0wO2k8cjsrK2kpe3ZhciB1PW4uZltpXTswPT1kKHUsMyk/ZS5wdXNoKG4uZltpXSk6KHU9aCh1LDMsTWF0aC5taW4obCxkKHUsMyktMSkpLDA9PXQuc2VhcmNoKHUpJiZlLnB1c2gobi5mW2ldKSl9bi5mPWV9ZnVuY3Rpb24gRihuLHQpe24uaS5hKHQpO3ZhciBlPXQ7aWYocm4udGVzdChlKXx8MT09bi5pLmIubGVuZ3RoJiZsbi50ZXN0KGUpKXt2YXIgcixlPXQ7XCIrXCI9PWU/KHI9ZSxuLnUuYShlKSk6KHI9ZW5bZV0sbi51LmEociksbi5hLmEocikpLHQ9cn1lbHNlIG4ubD0hMSxuLkY9ITA7aWYoIW4ubCl7aWYoIW4uRilpZihQKG4pKXtpZihxKG4pKXJldHVybiBDKG4pfWVsc2UgaWYoMDxuLmgubGVuZ3RoJiYoZT1uLmEudG9TdHJpbmcoKSxsKG4uYSksbi5hLmEobi5oKSxuLmEuYShlKSxlPW4uYi50b1N0cmluZygpLHI9ZS5sYXN0SW5kZXhPZihuLmgpLGwobi5iKSxuLmIuYShlLnN1YnN0cmluZygwLHIpKSksbi5oIT1IKG4pKXJldHVybiBuLmIuYShcIiBcIiksQyhuKTtyZXR1cm4gbi5pLnRvU3RyaW5nKCl9c3dpdGNoKG4udS5iLmxlbmd0aCl7Y2FzZSAwOmNhc2UgMTpjYXNlIDI6cmV0dXJuIG4uaS50b1N0cmluZygpO2Nhc2UgMzppZighUChuKSlyZXR1cm4gbi5oPUgobiksVihuKTtuLkE9ITA7ZGVmYXVsdDpyZXR1cm4gbi5BPyhxKG4pJiYobi5BPSExKSxuLmIudG9TdHJpbmcoKStuLmEudG9TdHJpbmcoKSk6MDxuLmYubGVuZ3RoPyhlPVQobix0KSxyPUkobiksMDxyLmxlbmd0aD9yOihSKG4sbi5hLnRvU3RyaW5nKCkpLEQobik/RyhuKTpuLmw/TShuLGUpOm4uaS50b1N0cmluZygpKSk6VihuKX19ZnVuY3Rpb24gQyhuKXtyZXR1cm4gbi5sPSEwLG4uQT0hMSxuLmY9W10sbi5zPTAsbChuLm0pLG4udz1cIlwiLFYobil9ZnVuY3Rpb24gSShuKXtmb3IodmFyIHQ9bi5hLnRvU3RyaW5nKCksZT1uLmYubGVuZ3RoLGw9MDtsPGU7KytsKXt2YXIgcj1uLmZbbF0saT1nKHIsMSk7aWYobmV3IFJlZ0V4cChcIl4oPzpcIitpK1wiKSRcIikudGVzdCh0KSlyZXR1cm4gbi5CPXBuLnRlc3QoaChyLDQpKSx0PXQucmVwbGFjZShuZXcgUmVnRXhwKGksXCJnXCIpLGgociwyKSksTShuLHQpfXJldHVyblwiXCJ9ZnVuY3Rpb24gTShuLHQpe3ZhciBlPW4uYi5iLmxlbmd0aDtyZXR1cm4gbi5CJiYwPGUmJlwiIFwiIT1uLmIudG9TdHJpbmcoKS5jaGFyQXQoZS0xKT9uLmIrXCIgXCIrdDpuLmIrdH1mdW5jdGlvbiBWKG4pe3ZhciB0PW4uYS50b1N0cmluZygpO2lmKDM8PXQubGVuZ3RoKXtmb3IodmFyIGU9bi5vJiYwPT1uLmgubGVuZ3RoJiYwPGQobi5nLDIwKT9jKG4uZywyMCl8fFtdOmMobi5nLDE5KXx8W10sbD1lLmxlbmd0aCxyPTA7cjxsOysrcil7dmFyIGk9ZVtyXTswPG4uaC5sZW5ndGgmJkEoZyhpLDQpKSYmIWgoaSw2KSYmbnVsbD09aS5hWzVdfHwoMCE9bi5oLmxlbmd0aHx8bi5vfHxBKGcoaSw0KSl8fGgoaSw2KSkmJmZuLnRlc3QoZyhpLDIpKSYmbi5mLnB1c2goaSl9cmV0dXJuIFIobix0KSx0PUkobiksMDx0Lmxlbmd0aD90OkQobik/RyhuKTpuLmkudG9TdHJpbmcoKX1yZXR1cm4gTShuLHQpfWZ1bmN0aW9uIEcobil7dmFyIHQ9bi5hLnRvU3RyaW5nKCksZT10Lmxlbmd0aDtpZigwPGUpe2Zvcih2YXIgbD1cIlwiLHI9MDtyPGU7cisrKWw9VChuLHQuY2hhckF0KHIpKTtyZXR1cm4gbi5sP00obixsKTpuLmkudG9TdHJpbmcoKX1yZXR1cm4gbi5iLnRvU3RyaW5nKCl9ZnVuY3Rpb24gSChuKXt2YXIgdCxlPW4uYS50b1N0cmluZygpLHI9MDtyZXR1cm4gMSE9aChuLmcsMTApP3Q9ITE6KHQ9bi5hLnRvU3RyaW5nKCksdD1cIjFcIj09dC5jaGFyQXQoMCkmJlwiMFwiIT10LmNoYXJBdCgxKSYmXCIxXCIhPXQuY2hhckF0KDEpKSx0PyhyPTEsbi5iLmEoXCIxXCIpLmEoXCIgXCIpLG4ubz0hMCk6bnVsbCE9bi5nLmFbMTVdJiYodD1uZXcgUmVnRXhwKFwiXig/OlwiK2gobi5nLDE1KStcIilcIiksdD1lLm1hdGNoKHQpLG51bGwhPXQmJm51bGwhPXRbMF0mJjA8dFswXS5sZW5ndGgmJihuLm89ITAscj10WzBdLmxlbmd0aCxuLmIuYShlLnN1YnN0cmluZygwLHIpKSkpLGwobi5hKSxuLmEuYShlLnN1YnN0cmluZyhyKSksZS5zdWJzdHJpbmcoMCxyKX1mdW5jdGlvbiBQKG4pe3ZhciB0PW4udS50b1N0cmluZygpLGU9bmV3IFJlZ0V4cChcIl4oPzpcXFxcK3xcIitoKG4uZywxMSkrXCIpXCIpLGU9dC5tYXRjaChlKTtyZXR1cm4gbnVsbCE9ZSYmbnVsbCE9ZVswXSYmMDxlWzBdLmxlbmd0aCYmKG4ubz0hMCxlPWVbMF0ubGVuZ3RoLGwobi5hKSxuLmEuYSh0LnN1YnN0cmluZyhlKSksbChuLmIpLG4uYi5hKHQuc3Vic3RyaW5nKDAsZSkpLFwiK1wiIT10LmNoYXJBdCgwKSYmbi5iLmEoXCIgXCIpLCEwKX1mdW5jdGlvbiBxKG4pe2lmKDA9PW4uYS5iLmxlbmd0aClyZXR1cm4hMTt2YXIgdCxyPW5ldyBlO246e2lmKHQ9bi5hLnRvU3RyaW5nKCksMCE9dC5sZW5ndGgmJlwiMFwiIT10LmNoYXJBdCgwKSlmb3IodmFyIGksdT10Lmxlbmd0aCxhPTE7Mz49YSYmYTw9dTsrK2EpaWYoaT1wYXJzZUludCh0LnN1YnN0cmluZygwLGEpLDEwKSxpIGluIG5uKXtyLmEodC5zdWJzdHJpbmcoYSkpLHQ9aTticmVhayBufXQ9MH1yZXR1cm4gMCE9dCYmKGwobi5hKSxuLmEuYShyLnRvU3RyaW5nKCkpLHI9RSh0KSxcIjAwMVwiPT1yP24uZz1OKG4uRyxcIlwiK3QpOnIhPW4uRCYmKG4uZz1CKG4scikpLG4uYi5hKFwiXCIrdCkuYShcIiBcIiksbi5oPVwiXCIsITApfWZ1bmN0aW9uIFQobix0KXt2YXIgZT1uLm0udG9TdHJpbmcoKTtpZigwPD1lLnN1YnN0cmluZyhuLnMpLnNlYXJjaChuLkgpKXt2YXIgcj1lLnNlYXJjaChuLkgpLGU9ZS5yZXBsYWNlKG4uSCx0KTtyZXR1cm4gbChuLm0pLG4ubS5hKGUpLG4ucz1yLGUuc3Vic3RyaW5nKDAsbi5zKzEpfXJldHVybiAxPT1uLmYubGVuZ3RoJiYobi5sPSExKSxuLnc9XCJcIixuLmkudG9TdHJpbmcoKX12YXIgVT10aGlzO2UucHJvdG90eXBlLmI9XCJcIixlLnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24obil7dGhpcy5iPVwiXCIrbn0sZS5wcm90b3R5cGUuYT1mdW5jdGlvbihuLHQsZSl7aWYodGhpcy5iKz1TdHJpbmcobiksbnVsbCE9dClmb3IodmFyIGw9MTtsPGFyZ3VtZW50cy5sZW5ndGg7bCsrKXRoaXMuYis9YXJndW1lbnRzW2xdO3JldHVybiB0aGlzfSxlLnByb3RvdHlwZS50b1N0cmluZz1mdW5jdGlvbigpe3JldHVybiB0aGlzLmJ9O3ZhciBZPTEsaz0yLEo9MyxLPTQsTD02LE89MTYsWj0xODtmLnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24obix0KXttKHRoaXMsbi5iLHQpfSxmLnByb3RvdHlwZS5jbG9uZT1mdW5jdGlvbigpe3ZhciBuPW5ldyB0aGlzLmNvbnN0cnVjdG9yO3JldHVybiBuIT10aGlzJiYobi5hPXt9LG4uYiYmKG4uYj17fSkscChuLHRoaXMpKSxufSx0KHksZik7dmFyIHo9bnVsbDt0KHYsZik7dmFyIFE9bnVsbDt0KCQsZik7dmFyIFc9bnVsbDt5LnByb3RvdHlwZS5qPWZ1bmN0aW9uKCl7dmFyIG49ejtyZXR1cm4gbnx8KHo9bj1iKHksezA6e25hbWU6XCJOdW1iZXJGb3JtYXRcIixJOlwiaTE4bi5waG9uZW51bWJlcnMuTnVtYmVyRm9ybWF0XCJ9LDE6e25hbWU6XCJwYXR0ZXJuXCIscmVxdWlyZWQ6ITAsYzo5LHR5cGU6U3RyaW5nfSwyOntuYW1lOlwiZm9ybWF0XCIscmVxdWlyZWQ6ITAsYzo5LHR5cGU6U3RyaW5nfSwzOntuYW1lOlwibGVhZGluZ19kaWdpdHNfcGF0dGVyblwiLHY6ITAsYzo5LHR5cGU6U3RyaW5nfSw0OntuYW1lOlwibmF0aW9uYWxfcHJlZml4X2Zvcm1hdHRpbmdfcnVsZVwiLGM6OSx0eXBlOlN0cmluZ30sNjp7bmFtZTpcIm5hdGlvbmFsX3ByZWZpeF9vcHRpb25hbF93aGVuX2Zvcm1hdHRpbmdcIixjOjgsZGVmYXVsdFZhbHVlOiExLHR5cGU6Qm9vbGVhbn0sNTp7bmFtZTpcImRvbWVzdGljX2NhcnJpZXJfY29kZV9mb3JtYXR0aW5nX3J1bGVcIixjOjksdHlwZTpTdHJpbmd9fSkpLG59LHkuaj15LnByb3RvdHlwZS5qLHYucHJvdG90eXBlLmo9ZnVuY3Rpb24oKXt2YXIgbj1RO3JldHVybiBufHwoUT1uPWIodix7MDp7bmFtZTpcIlBob25lTnVtYmVyRGVzY1wiLEk6XCJpMThuLnBob25lbnVtYmVycy5QaG9uZU51bWJlckRlc2NcIn0sMjp7bmFtZTpcIm5hdGlvbmFsX251bWJlcl9wYXR0ZXJuXCIsYzo5LHR5cGU6U3RyaW5nfSw5OntuYW1lOlwicG9zc2libGVfbGVuZ3RoXCIsdjohMCxjOjUsdHlwZTpOdW1iZXJ9LDEwOntuYW1lOlwicG9zc2libGVfbGVuZ3RoX2xvY2FsX29ubHlcIix2OiEwLGM6NSx0eXBlOk51bWJlcn0sNjp7bmFtZTpcImV4YW1wbGVfbnVtYmVyXCIsYzo5LHR5cGU6U3RyaW5nfX0pKSxufSx2Lmo9di5wcm90b3R5cGUuaiwkLnByb3RvdHlwZS5qPWZ1bmN0aW9uKCl7dmFyIG49VztyZXR1cm4gbnx8KFc9bj1iKCQsezA6e25hbWU6XCJQaG9uZU1ldGFkYXRhXCIsSTpcImkxOG4ucGhvbmVudW1iZXJzLlBob25lTWV0YWRhdGFcIn0sMTp7bmFtZTpcImdlbmVyYWxfZGVzY1wiLGM6MTEsdHlwZTp2fSwyOntuYW1lOlwiZml4ZWRfbGluZVwiLGM6MTEsdHlwZTp2fSwzOntuYW1lOlwibW9iaWxlXCIsYzoxMSx0eXBlOnZ9LDQ6e25hbWU6XCJ0b2xsX2ZyZWVcIixjOjExLHR5cGU6dn0sNTp7bmFtZTpcInByZW1pdW1fcmF0ZVwiLGM6MTEsdHlwZTp2fSw2OntuYW1lOlwic2hhcmVkX2Nvc3RcIixjOjExLHR5cGU6dn0sNzp7bmFtZTpcInBlcnNvbmFsX251bWJlclwiLGM6MTEsdHlwZTp2fSw4OntuYW1lOlwidm9pcFwiLGM6MTEsdHlwZTp2fSwyMTp7bmFtZTpcInBhZ2VyXCIsYzoxMSx0eXBlOnZ9LDI1OntuYW1lOlwidWFuXCIsYzoxMSx0eXBlOnZ9LDI3OntuYW1lOlwiZW1lcmdlbmN5XCIsYzoxMSx0eXBlOnZ9LDI4OntuYW1lOlwidm9pY2VtYWlsXCIsYzoxMSx0eXBlOnZ9LDI5OntuYW1lOlwic2hvcnRfY29kZVwiLGM6MTEsdHlwZTp2fSwzMDp7bmFtZTpcInN0YW5kYXJkX3JhdGVcIixjOjExLHR5cGU6dn0sMzE6e25hbWU6XCJjYXJyaWVyX3NwZWNpZmljXCIsYzoxMSx0eXBlOnZ9LDMzOntuYW1lOlwic21zX3NlcnZpY2VzXCIsYzoxMSx0eXBlOnZ9LDI0OntuYW1lOlwibm9faW50ZXJuYXRpb25hbF9kaWFsbGluZ1wiLGM6MTEsdHlwZTp2fSw5OntuYW1lOlwiaWRcIixyZXF1aXJlZDohMCxjOjksdHlwZTpTdHJpbmd9LDEwOntuYW1lOlwiY291bnRyeV9jb2RlXCIsYzo1LHR5cGU6TnVtYmVyfSwxMTp7bmFtZTpcImludGVybmF0aW9uYWxfcHJlZml4XCIsYzo5LHR5cGU6U3RyaW5nfSwxNzp7bmFtZTpcInByZWZlcnJlZF9pbnRlcm5hdGlvbmFsX3ByZWZpeFwiLGM6OSx0eXBlOlN0cmluZ30sMTI6e25hbWU6XCJuYXRpb25hbF9wcmVmaXhcIixjOjksdHlwZTpTdHJpbmd9LDEzOntuYW1lOlwicHJlZmVycmVkX2V4dG5fcHJlZml4XCIsYzo5LHR5cGU6U3RyaW5nfSwxNTp7bmFtZTpcIm5hdGlvbmFsX3ByZWZpeF9mb3JfcGFyc2luZ1wiLGM6OSx0eXBlOlN0cmluZ30sMTY6e25hbWU6XCJuYXRpb25hbF9wcmVmaXhfdHJhbnNmb3JtX3J1bGVcIixjOjksdHlwZTpTdHJpbmd9LDE4OntuYW1lOlwic2FtZV9tb2JpbGVfYW5kX2ZpeGVkX2xpbmVfcGF0dGVyblwiLGM6OCxkZWZhdWx0VmFsdWU6ITEsdHlwZTpCb29sZWFufSwxOTp7bmFtZTpcIm51bWJlcl9mb3JtYXRcIix2OiEwLGM6MTEsdHlwZTp5fSwyMDp7bmFtZTpcImludGxfbnVtYmVyX2Zvcm1hdFwiLHY6ITAsYzoxMSx0eXBlOnl9LDIyOntuYW1lOlwibWFpbl9jb3VudHJ5X2Zvcl9jb2RlXCIsYzo4LGRlZmF1bHRWYWx1ZTohMSx0eXBlOkJvb2xlYW59LDIzOntuYW1lOlwibGVhZGluZ19kaWdpdHNcIixjOjksdHlwZTpTdHJpbmd9LDI2OntuYW1lOlwibGVhZGluZ196ZXJvX3Bvc3NpYmxlXCIsYzo4LGRlZmF1bHRWYWx1ZTohMSx0eXBlOkJvb2xlYW59fSkpLG59LCQuaj0kLnByb3RvdHlwZS5qLF8ucHJvdG90eXBlLmE9ZnVuY3Rpb24obil7dGhyb3cgbmV3IG4uYixFcnJvcihcIlVuaW1wbGVtZW50ZWRcIil9LF8ucHJvdG90eXBlLmI9ZnVuY3Rpb24obix0KXtpZigxMT09bi5hfHwxMD09bi5hKXJldHVybiB0IGluc3RhbmNlb2YgZj90OnRoaXMuYShuLmkucHJvdG90eXBlLmooKSx0KTtpZigxND09bi5hKXtpZihcInN0cmluZ1wiPT10eXBlb2YgdCYmWC50ZXN0KHQpKXt2YXIgZT1OdW1iZXIodCk7aWYoMDxlKXJldHVybiBlfXJldHVybiB0fWlmKCFuLmgpcmV0dXJuIHQ7aWYoZT1uLmksZT09PVN0cmluZyl7aWYoXCJudW1iZXJcIj09dHlwZW9mIHQpcmV0dXJuIFN0cmluZyh0KX1lbHNlIGlmKGU9PT1OdW1iZXImJlwic3RyaW5nXCI9PXR5cGVvZiB0JiYoXCJJbmZpbml0eVwiPT09dHx8XCItSW5maW5pdHlcIj09PXR8fFwiTmFOXCI9PT10fHxYLnRlc3QodCkpKXJldHVybiBOdW1iZXIodCk7cmV0dXJuIHR9O3ZhciBYPS9eLT9bMC05XSskLzt0KFMsXyksUy5wcm90b3R5cGUuYT1mdW5jdGlvbihuLHQpe3ZhciBlPW5ldyBuLmI7cmV0dXJuIGUuZz10aGlzLGUuYT10LGUuYj17fSxlfSx0KHcsUyksdy5wcm90b3R5cGUuYj1mdW5jdGlvbihuLHQpe3JldHVybiA4PT1uLmE/ISF0Ol8ucHJvdG90eXBlLmIuYXBwbHkodGhpcyxhcmd1bWVudHMpfSx3LnByb3RvdHlwZS5hPWZ1bmN0aW9uKG4sdCl7cmV0dXJuIHcuTS5hLmNhbGwodGhpcyxuLHQpfTsvKlxuXG4gQ29weXJpZ2h0IChDKSAyMDEwIFRoZSBMaWJwaG9uZW51bWJlciBBdXRob3JzXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xudmFyIG5uPXs0OTpbXCJERVwiXX0sdG49e0RFOltudWxsLFtudWxsLG51bGwsXCIoPzoxfFsyMzUtOV1cXFxcZHsxMX18NCg/OlswLThdXFxcXGR7MiwxMH18OSg/OlswNV1cXFxcZHs3fXxbNDZdWzEtOF1cXFxcZHsyLDZ9KSkpXFxcXGR7M318WzEtMzUtOV1cXFxcZHs2LDEzfXw0OSg/Oig/OlswLTI1XVxcXFxkfDNbMS02ODldKVxcXFxkezQsOH18NFsxLThdXFxcXGR7NH18NlswLThdXFxcXGR7Myw0fXw3WzEtN11cXFxcZHs1LDh9KXw0OTdbMC03XVxcXFxkezR9fDQ5KD86WzAtMjU3OV1cXFxcZHxbMzRdWzEtOV0pXFxcXGR7M318WzEtOV1cXFxcZHs1fXxbMTM0NjhdXFxcXGR7NH1cIixudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxbNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTVdLFszXV0sW251bGwsbnVsbCxcIig/OjIoPzowWzEtNjg5XXxbMS0zNTY5XVxcXFxkfDRbMC04XXw3WzEtN118OFswLTddKXw1KD86MFsyLThdfFsxMjQtNl1cXFxcZHxbMzhdWzAtOF18Wzc5XVswLTddKXw2KD86MFswMi05XXxbMS0zNTg5XVxcXFxkfFs0N11bMC04XXw2WzEtOV0pfDcoPzowWzItOF18MVsxLTldfFsyN11bMC03XXwzXFxcXGR8WzQtNl1bMC04XXw4WzAtNV18OVswMTMtN10pfDgoPzowWzItOV18MVswLTc5XXxbMjldXFxcXGR8M1swLTQ2LTldfDRbMC02XXw1WzAxMy05XXw2WzEtOF18N1swLThdfDhbMC0yNC02XSl8OSg/OjBbNi05XXxbMS00XVxcXFxkfFs1ODldWzAtN118NlswLThdfDdbMC00NjddKSlcXFxcZHs0LDEyfXwzKD86KD86WzAzNTY5XVxcXFxkfDRbMC03OV18N1sxLTddfDhbMS04XSlcXFxcZHs0LDEyfXwyXFxcXGR7OX0pfDQoPzooPzpbMDItNDhdXFxcXGR8MVswMi05XXw1WzAtNl18NlswLThdfDdbMC03OV0pXFxcXGR7NCwxMn18OSg/OlswLTM3XVxcXFxkezQsOX18WzQtNl1cXFxcZHs0LDEwfSkpfCg/OjIoPzowWzEtMzg5XXwxWzEyNF18MlsxOF18M1sxNF18WzQtOV0xKXwzKD86MFxcXFxkP3xbMzUtOV1bMTVdfDRbMDE1XSl8NCg/OjBcXFxcZD98WzItOV0xKXxbNTddWzEtOV0xfFs2OF0oPzpbMS04XTF8OVxcXFxkPyl8OSg/OjA2fFsxLTldMSkpXFxcXGR7M31cIixudWxsLG51bGwsbnVsbCxcIjMwMTIzNDU2XCIsbnVsbCxudWxsLFs1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTVdLFszLDRdXSxbbnVsbCxudWxsLFwiMSg/OjVbMC0yNS05XVxcXFxkezh9fCg/OjZbMDIzXXw3XFxcXGQpXFxcXGR7Nyw4fSlcIixudWxsLG51bGwsbnVsbCxcIjE1MTIzNDU2Nzg5XCIsbnVsbCxudWxsLFsxMCwxMV1dLFtudWxsLG51bGwsXCI4MDBcXFxcZHs3LDEyfVwiLG51bGwsbnVsbCxudWxsLFwiODAwMTIzNDU2Nzg5MFwiLG51bGwsbnVsbCxbMTAsMTEsMTIsMTMsMTQsMTVdXSxbbnVsbCxudWxsLFwiKD86MTM3WzctOV18OTAwKD86WzEzNV18OVxcXFxkKSlcXFxcZHs2fVwiLG51bGwsbnVsbCxudWxsLFwiOTAwMTIzNDU2N1wiLG51bGwsbnVsbCxbMTAsMTFdXSxbbnVsbCxudWxsLFwiMSg/OjMoPzo3WzEtNl1cXFxcZFxcXFxkfDgpfDgwXFxcXGR7MSw3fSlcXFxcZHs0fVwiLG51bGwsbnVsbCxudWxsLFwiMTgwMTIzNDVcIixudWxsLG51bGwsWzcsOCw5LDEwLDExLDEyLDEzLDE0XV0sW251bGwsbnVsbCxcIjcwMFxcXFxkezh9XCIsbnVsbCxudWxsLG51bGwsXCI3MDAxMjM0NTY3OFwiLG51bGwsbnVsbCxbMTFdXSxbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsWy0xXV0sXCJERVwiLDQ5LFwiMDBcIixcIjBcIixudWxsLG51bGwsXCIwXCIsbnVsbCxudWxsLG51bGwsW1tudWxsLFwiKFxcXFxkezJ9KShcXFxcZHszLDEzfSlcIixcIiQxICQyXCIsW1wiM1swMl18NDB8WzY4XTlcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7M30pKFxcXFxkezMsMTJ9KVwiLFwiJDEgJDJcIixbXCIyKD86MFsxLTM4OV18MVsxMjRdfDJbMThdfDNbMTRdfFs0LTldMSl8Myg/OlszNS05XVsxNV18NFswMTVdKXwoPzo0WzItOV18WzU3XVsxLTldfFs2OF1bMS04XSkxfDkoPzowNnxbMS05XTEpXCIsXCIyKD86MFsxLTM4OV18MSg/OlsxNF18MlswLThdKXwyWzE4XXwzWzE0XXxbNC05XTEpfDMoPzpbMzUtOV1bMTVdfDRbMDE1XSl8KD86NFsyLTldfFs1N11bMS05XXxbNjhdWzEtOF0pMXw5KD86MDZ8WzEtOV0xKVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7NH0pXCIsXCIkMSAkMlwiLFtcIjEzOFwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs0fSkoXFxcXGR7MywxMX0pXCIsXCIkMSAkMlwiLFtcIlsyNC02XXwzKD86WzM1NjldWzAyLTQ2LTldfDRbMi00Njc5XXw3WzItNDY3XXw4WzItNDYtOF0pfDcoPzowWzItOF18WzEtOV0pfDgoPzowWzItOV18WzEtOF0pfDkoPzowWzctOV18WzEtOV0pXCIsXCJbMjQtNl18Myg/OjMoPzowWzEtNDY3XXwyWzEyNy05XXwzWzEyNDU3OF18WzQ2XVsxMjQ2XXw3WzEyNTctOV18OFsxMjU2XXw5WzE0NV0pfDQoPzoyWzEzNV18M1sxMzU3XXw0WzEzNTc4XXw2WzEyNDZdfDdbMTM1Nl18OVsxMzQ2XSl8NSg/OjBbMTRdfDJbMS0zNTg5XXwzWzEzNTddfFs0OV1bMTI0Nl18NlsxLTRdfDdbMTM0NjhdfDhbMTM1NjhdKXw2KD86MFsxMzU2XXwyWzEtNDg5XXwzWzEyNC02XXw0WzEzNDddfDZbMTNdfDdbMTI1NzldfDhbMS0zNTZdfDlbMTM1XSl8Nyg/OjJbMS03XXwzWzEzNTddfDRbMTQ1XXw2WzEtNV18N1sxLTRdKXw4KD86MjF8M1sxNDY4XXw0WzEzNDddfDZ8N1sxNDY3XXw4WzEzNl0pfDkoPzowWzEyNDc5XXwyWzEzNThdfDNbMTM1N118NFsxMzQ2NzldfDZbMS05XXw3WzEzNl18OFsxNDddfDlbMTQ2OF0pKXw3KD86MFsyLThdfFsxLTldKXw4KD86MFsyLTldfFsxLThdKXw5KD86MFs3LTldfFsxLTldKVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7NSwxMX0pXCIsXCIkMSAkMlwiLFtcIjE4MVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGQpKFxcXFxkezQsMTB9KVwiLFwiJDEgJDIgJDNcIixbXCIxKD86M3w4MCl8OVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs1fSkoXFxcXGR7MywxMH0pXCIsXCIkMSAkMlwiLFtcIjNcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7M30pKFxcXFxkezcsOH0pXCIsXCIkMSAkMlwiLFtcIjEoPzo2WzAyLTQ4OV18NylcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7M30pKFxcXFxkezcsMTJ9KVwiLFwiJDEgJDJcIixbXCI4XCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezR9KShcXFxcZHs3fSlcIixcIiQxICQyXCIsW1wiMTVbMTI3OV1cIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7NX0pKFxcXFxkezZ9KVwiLFwiJDEgJDJcIixbXCIxNVswNTY4XVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7NH0pKFxcXFxkezR9KVwiLFwiJDEgJDIgJDNcIixbXCI3XCJdLFwiMCQxXCJdLFtudWxsLFwiKFxcXFxkezN9KShcXFxcZHs4fSlcIixcIiQxICQyXCIsW1wiMThbMi01NzldXCIsXCIxOFsyLTU3OV1cIixcIjE4KD86WzItNDc5XXw1KD86MFsxLTldfFsxLTldKSlcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7NH0pKFxcXFxkezd9KVwiLFwiJDEgJDJcIixbXCIxOFs2OF1cIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7NX0pKFxcXFxkezZ9KVwiLFwiJDEgJDJcIixbXCIxOFwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHszfSkoXFxcXGR7Mn0pKFxcXFxkezcsOH0pXCIsXCIkMSAkMiAkM1wiLFtcIjEoPzo2WzAyM118NylcIl0sXCIwJDFcIl0sW251bGwsXCIoXFxcXGR7M30pKFxcXFxkezJ9KShcXFxcZHs4fSlcIixcIiQxICQyICQzXCIsW1wiMTVbMDEzLTY4XVwiXSxcIjAkMVwiXSxbbnVsbCxcIihcXFxcZHs0fSkoXFxcXGR7Mn0pKFxcXFxkezd9KVwiLFwiJDEgJDIgJDNcIixbXCIxNVwiXSxcIjAkMVwiXV0sbnVsbCxbbnVsbCxudWxsLFwiMTYoPzo0XFxcXGR7MSwxMH18Wzg5XVxcXFxkezEsMTF9KVwiLG51bGwsbnVsbCxudWxsLFwiMTY0MTIzNDVcIixudWxsLG51bGwsWzQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0XV0sbnVsbCxudWxsLFtudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxbLTFdXSxbbnVsbCxudWxsLFwiMTgoPzoxXFxcXGR7NSwxMX18WzItOV1cXFxcZHs4fSlcIixudWxsLG51bGwsbnVsbCxcIjE4NTAwMTIzNDU2XCIsbnVsbCxudWxsLFs4LDksMTAsMTEsMTIsMTMsMTRdXSxudWxsLG51bGwsW251bGwsbnVsbCxcIjEoPzo1KD86KD86WzAzLTY4XTAwfDExMylcXFxcZHwyXFxcXGQ1NXw3XFxcXGQ5OXw5XFxcXGQzMyl8KD86Nig/OjAxM3wyNTV8Mzk5KXw3KD86KD86WzAxNV0xfFs2OV0zKTN8WzItNF01NXxbNzhdOTkpKVxcXFxkPylcXFxcZHs3fVwiLG51bGwsbnVsbCxudWxsLFwiMTc3OTkxMjM0NTY3XCIsbnVsbCxudWxsLFsxMiwxM11dXX07eC5iPWZ1bmN0aW9uKCl7cmV0dXJuIHguYT94LmE6eC5hPW5ldyB4fTt2YXIgZW49ezA6XCIwXCIsMTpcIjFcIiwyOlwiMlwiLDM6XCIzXCIsNDpcIjRcIiw1OlwiNVwiLDY6XCI2XCIsNzpcIjdcIiw4OlwiOFwiLDk6XCI5XCIsXCJcdUZGMTBcIjpcIjBcIixcIlx1RkYxMVwiOlwiMVwiLFwiXHVGRjEyXCI6XCIyXCIsXCJcdUZGMTNcIjpcIjNcIixcIlx1RkYxNFwiOlwiNFwiLFwiXHVGRjE1XCI6XCI1XCIsXCJcdUZGMTZcIjpcIjZcIixcIlx1RkYxN1wiOlwiN1wiLFwiXHVGRjE4XCI6XCI4XCIsXCJcdUZGMTlcIjpcIjlcIixcIlx1MDY2MFwiOlwiMFwiLFwiXHUwNjYxXCI6XCIxXCIsXCJcdTA2NjJcIjpcIjJcIixcIlx1MDY2M1wiOlwiM1wiLFwiXHUwNjY0XCI6XCI0XCIsXCJcdTA2NjVcIjpcIjVcIixcIlx1MDY2NlwiOlwiNlwiLFwiXHUwNjY3XCI6XCI3XCIsXCJcdTA2NjhcIjpcIjhcIixcIlx1MDY2OVwiOlwiOVwiLFwiXHUwNkYwXCI6XCIwXCIsXCJcdTA2RjFcIjpcIjFcIixcIlx1MDZGMlwiOlwiMlwiLFwiXHUwNkYzXCI6XCIzXCIsXCJcdTA2RjRcIjpcIjRcIixcIlx1MDZGNVwiOlwiNVwiLFwiXHUwNkY2XCI6XCI2XCIsXCJcdTA2RjdcIjpcIjdcIixcIlx1MDZGOFwiOlwiOFwiLFwiXHUwNkY5XCI6XCI5XCJ9LGxuPVJlZ0V4cChcIlsrXHVGRjBCXStcIikscm49UmVnRXhwKFwiKFswLTlcdUZGMTAtXHVGRjE5XHUwNjYwLVx1MDY2OVx1MDZGMC1cdTA2RjldKVwiKSx1bj0vXlxcKD9cXCQxXFwpPyQvLGFuPW5ldyAkO20oYW4sMTEsXCJOQVwiKTt2YXIgb249L1xcWyhbXlxcW1xcXV0pKlxcXS9nLHNuPS9cXGQoPz1bXix9XVteLH1dKS9nLGZuPVJlZ0V4cChcIl5bLXhcdTIwMTAtXHUyMDE1XHUyMjEyXHUzMEZDXHVGRjBELVx1RkYwRiBcdTAwQTBcdTAwQURcdTIwMEJcdTIwNjBcdTMwMDAoKVx1RkYwOFx1RkYwOVx1RkYzQlx1RkYzRC5cXFxcW1xcXFxdL35cdTIwNTNcdTIyM0NcdUZGNUVdKihcXFxcJFxcXFxkWy14XHUyMDEwLVx1MjAxNVx1MjIxMlx1MzBGQ1x1RkYwRC1cdUZGMEYgXHUwMEEwXHUwMEFEXHUyMDBCXHUyMDYwXHUzMDAwKClcdUZGMDhcdUZGMDlcdUZGM0JcdUZGM0QuXFxcXFtcXFxcXS9+XHUyMDUzXHUyMjNDXHVGRjVFXSopKyRcIikscG49L1stIF0vO2oucHJvdG90eXBlLks9ZnVuY3Rpb24oKXt0aGlzLkM9XCJcIixsKHRoaXMuaSksbCh0aGlzLnUpLGwodGhpcy5tKSx0aGlzLnM9MCx0aGlzLnc9XCJcIixsKHRoaXMuYiksdGhpcy5oPVwiXCIsbCh0aGlzLmEpLHRoaXMubD0hMCx0aGlzLkE9dGhpcy5vPXRoaXMuRj0hMSx0aGlzLmY9W10sdGhpcy5CPSExLHRoaXMuZyE9dGhpcy5KJiYodGhpcy5nPUIodGhpcyx0aGlzLkQpKX0sai5wcm90b3R5cGUuTD1mdW5jdGlvbihuKXtyZXR1cm4gdGhpcy5DPUYodGhpcyxuKX0sbihcIkNsZWF2ZS5Bc1lvdVR5cGVGb3JtYXR0ZXJcIixqKSxuKFwiQ2xlYXZlLkFzWW91VHlwZUZvcm1hdHRlci5wcm90b3R5cGUuaW5wdXREaWdpdFwiLGoucHJvdG90eXBlLkwpLG4oXCJDbGVhdmUuQXNZb3VUeXBlRm9ybWF0dGVyLnByb3RvdHlwZS5jbGVhclwiLGoucHJvdG90eXBlLkspfS5jYWxsKFwib2JqZWN0XCI9PXR5cGVvZiBnbG9iYWwmJmdsb2JhbD9nbG9iYWw6d2luZG93KTsiLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIENsZWF2ZVxuaW1wb3J0IENsZWF2ZSBmcm9tIFwiY2xlYXZlLmpzXCI7XG5pbXBvcnQgXCJjbGVhdmUuanMvZGlzdC9hZGRvbnMvY2xlYXZlLXBob25lLmRlXCI7XG5pbXBvcnQgdHlwZSB7IENsZWF2ZU9wdGlvbnMgfSBmcm9tIFwiY2xlYXZlLmpzL29wdGlvbnMvaW5kZXguanNcIjtcbi8vICNlbmRyZWdpb24gQ2xlYXZlXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IEVRIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9FUVwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfSW5wdXRfQ2xlYXZlLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBIVE1MX0lucHV0X0NsZWF2ZSB7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgYXBwbGllcyBDbGVhdmUgb24gYW4ge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfS5cbiAgICpcbiAgICogIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIENvbmZpZyAgICAgIDogVGhlIHtAbGluayBDbGVhdmVPcHRpb25zIH0gdG8gc2V0IGluc3RlYWQgb2YgdGhlIG90aGVyIHNob3J0aGFuZCBwYXJhbWV0ZXIuXG4gICAqICAtIERhdGUgICAgICAgIDogVGhlIHtAbGluayBDbGVhdmVPcHRpb25zLmRhdGUgfS5cbiAgICogIC0gRGF0ZU1pbiAgICAgOiBUaGUge0BsaW5rIENsZWF2ZU9wdGlvbnMuZGF0ZU1pbiB9LlxuICAgKiAgICAgICAgICAgICAgICAgIEhhcyB0byBiZSBzZXQgYWNjb3JkaW5nIHRvIHRoZSBhbWVyaWNhbiBzdGFuZGFyZCB3aXRoIGRhc2hlcyAoWVlZWS1NTS1ERCkuXG4gICAqICAtIERhdGVNYXggICAgIDogVGhlIHtAbGluayBDbGVhdmVPcHRpb25zLmRhdGVNYXggfS5cbiAgICogICAgICAgICAgICAgICAgICBIYXMgdG8gYmUgc2V0IGFjY29yZGluZyB0byB0aGUgYW1lcmljYW4gc3RhbmRhcmQgd2l0aCBkYXNoZXMgKFlZWVktTU0tREQpLlxuICAgKiAgLSBEZWxpbWl0ZXIgICA6IFRoZSB7QGxpbmsgQ2xlYXZlT3B0aW9ucy5kZWxpbWl0ZXIgfS5cbiAgICogIC0gRGF0ZVBhdHRlcm4gOiBUaGUge0BsaW5rIENsZWF2ZU9wdGlvbnMuZGF0ZVBhdHRlcm4gfS5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB0aGUgQ29kQmkuXG4gICAqIEBwYXJhbSB0b1Byb2Nlc3MgUHJvdmlkZWQgYnkgdGhlIENvZEJpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcblxuICAgIEBJTlNUQU5DRS5QUkUoXG4gICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgJ0lzIGl0IG5vdCBhbiA8aW5wdXQgdHlwZSA9IFwidGV4dFwiLz4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/JyxcbiAgICApXG4gICAgQEVRLlBSRShcInRleHRcIiwgZmFsc2UsIFwidHlwZVwiKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBOb3JtYWxpemUgQXJyYXllZC1QYXJhbWV0ZXIuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodG9Mb2FkLmNvbmZpZykpIHtcbiAgICAgIHRvTG9hZC5jb25maWcgPSAodG9Mb2FkLmNvbmZpZyBhcyBBcnJheTxzdHJpbmc+KVswXTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodG9Mb2FkLmRhdGUpKSB7XG4gICAgICB0b0xvYWQuZGF0ZSA9ICh0b0xvYWQuZGF0ZSBhcyBBcnJheTxib29sZWFuPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlbWluKSkge1xuICAgICAgdG9Mb2FkLmRhdGVtaW4gPSAodG9Mb2FkLmRhdGVtaW4gYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlbWF4KSkge1xuICAgICAgdG9Mb2FkLmRhdGVtYXggPSAodG9Mb2FkLmRhdGVtYXggYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kZWxpbWl0ZXIpKSB7XG4gICAgICB0b0xvYWQuZGVsaW1pdGVyID0gKHRvTG9hZC5kZWxpbWl0ZXIgYXMgQXJyYXk8c3RyaW5nPilbMF07XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHRvTG9hZC5kYXRlcGF0dGVybikpIHtcbiAgICAgIHRvTG9hZC5kYXRlcGF0dGVybiA9ICh0b0xvYWQuZGF0ZXBhdHRlcm4gYXMgQXJyYXk8QXJyYXk8c3RyaW5nPj4pWzBdO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbGl6ZSBBcnJheWVkLVBhcmFtZXRlclxuICAgIC8vIERvIG5vdGhpbmcgaWYgbm90IGFwcGxpZWQgb24gYW4gXCJIVE1MSW5wdXRFbGVtZW50XCIuXG4gICAgaWYgKHRvUHJvY2Vzcy50YWdOYW1lLnRvVXBwZXJDYXNlKCkgIT09IFwiSU5QVVRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIEJ1aWxkIFwiQ2xlYXZlT3B0aW9uc1wiLlxuICAgIGNvbnN0IGNvbmZpZzogQ2xlYXZlT3B0aW9ucyA9IHRvTG9hZC5jb25maWdcbiAgICAgID8gdHlwZW9mIHRvTG9hZC5jb25maWcgPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyAoSlNPTi5wYXJzZSh0b0xvYWQuY29uZmlnLnJlcGxhY2UoLzwvLCBcIntcIikucmVwbGFjZSgvPi8sIFwifVwiKSkgYXMgQ2xlYXZlT3B0aW9ucylcbiAgICAgICAgOiAodG9Mb2FkLmNvbmZpZyBhcyBDbGVhdmVPcHRpb25zKVxuICAgICAgOiB7XG4gICAgICAgICAgZGF0ZTogdG9Mb2FkLmRhdGUgPyAodG9Mb2FkLmRhdGUgYXMgYm9vbGVhbikgOiB0cnVlLFxuICAgICAgICAgIGRhdGVNaW46IHRvTG9hZC5kYXRlbWluICYmIHR5cGVvZiB0b0xvYWQuZGF0ZW1pbiA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGF0ZW1pbiBhcyBzdHJpbmcpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRhdGVNYXg6IHRvTG9hZC5kYXRlbWF4ICYmIHR5cGVvZiB0b0xvYWQuZGF0ZW1heCA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGF0ZW1heCBhcyBzdHJpbmcpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRlbGltaXRlcjogdG9Mb2FkLmRlbGltaXRlciAmJiB0eXBlb2YgdG9Mb2FkLmRlbGltaXRlciA9PT0gXCJzdHJpbmdcIiA/ICh0b0xvYWQuZGVsaW1pdGVyIGFzIHN0cmluZykgOiBcIi5cIixcbiAgICAgICAgICBkYXRlUGF0dGVybjogdG9Mb2FkLmRhdGVwYXR0ZXJuXG4gICAgICAgICAgICA/IFRZUEUudHNDaGVjazxzdHJpbmc+KHRvTG9hZC5kYXRlcGF0dGVybiwgXCJzdHJpbmdcIikuc3BsaXQoXCItXCIpXG4gICAgICAgICAgICA6IFtcImRcIiwgXCJtXCIsIFwiWVwiXSxcbiAgICAgICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIEJ1aWxkIFwiQ2xlYXZlT3B0aW9uc1wiLlxuICAgIC8vIEFwcGx5IENsZWF2ZS5cbiAgICBuZXcgQ2xlYXZlKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCwgY29uZmlnKTtcbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiSFRNTC5JbnB1dC5DbGVhdmVcIiwgSFRNTF9JbnB1dF9DbGVhdmUuZnVuY3Rpb25hbGl0eS5iaW5kKEhUTUxfSW5wdXRfQ2xlYXZlKSk7IC8vIEluaXRpYWxpemF0aW9uXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJLGlCQUFpQixPQUFPLFdBQVcsY0FBYyxTQUFTLE9BQU8sV0FBVyxjQUFjLFNBQVMsT0FBTyxTQUFTLGNBQWMsT0FBTyxDQUFDO0FBRTdJLElBQUksbUJBQW1CLFNBQVUsb0JBQ0EscUJBQ0EscUJBQ0EsNEJBQ0EscUJBQ0Esb0JBQ0EsUUFDQSxrQkFDQSxZQUNBLFdBQVc7QUFDeEMsTUFBSSxRQUFRO0FBRVosUUFBTSxxQkFBcUIsc0JBQXNCO0FBQ2pELFFBQU0sc0JBQXNCLHNCQUFzQixJQUFJLHNCQUFzQjtBQUM1RSxRQUFNLHNCQUFzQix1QkFBdUIsSUFBSSxzQkFBc0I7QUFDN0UsUUFBTSw2QkFBNkIsOEJBQThCLGlCQUFpQixXQUFXO0FBQzdGLFFBQU0sc0JBQXNCLENBQUMsQ0FBQztBQUM5QixRQUFNLHFCQUFxQix1QkFBdUI7QUFDbEQsUUFBTSxTQUFVLFVBQVUsV0FBVyxLQUFNLFNBQVM7QUFDcEQsUUFBTSxtQkFBbUIsQ0FBQyxDQUFDO0FBQzNCLFFBQU0sYUFBYSxDQUFDLENBQUM7QUFDckIsUUFBTSxZQUFhLGFBQWEsY0FBYyxLQUFNLFlBQVk7QUFDaEUsUUFBTSxjQUFjLFlBQVksSUFBSSxPQUFPLE9BQU8sV0FBVyxHQUFHLElBQUk7QUFDeEU7QUFFQSxpQkFBaUIsYUFBYTtBQUFBLEVBQzFCLFVBQVU7QUFBQSxFQUNWLE1BQVU7QUFBQSxFQUNWLEtBQVU7QUFBQSxFQUNWLE1BQVU7QUFDZDtBQUVBLGlCQUFpQixZQUFZO0FBQUEsRUFDekIsYUFBYSxTQUFVLE9BQU87QUFDMUIsV0FBTyxNQUFNLFFBQVEsS0FBSyxhQUFhLEVBQUUsRUFBRSxRQUFRLEtBQUssb0JBQW9CLEdBQUc7QUFBQSxFQUNuRjtBQUFBLEVBRUEsUUFBUSxTQUFVLE9BQU87QUFDckIsUUFBSSxRQUFRLE1BQU0sT0FB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QUMsV0FBVTtBQUFDLFdBQVMsRUFBRUMsSUFBRUMsSUFBRTtBQUFDLFFBQUlDLEtBQUVGLEdBQUUsTUFBTSxHQUFHLEdBQUVHLEtBQUU7QUFBRSxJQUFBRCxHQUFFLENBQUMsS0FBSUMsTUFBRyxDQUFDQSxHQUFFLGNBQVlBLEdBQUUsV0FBVyxTQUFPRCxHQUFFLENBQUMsQ0FBQztBQUFFLGFBQVFFLElBQUVGLEdBQUUsV0FBU0UsS0FBRUYsR0FBRSxNQUFNLEtBQUksQ0FBQUEsR0FBRSxVQUFRLFdBQVNELEtBQUVFLEtBQUVBLEdBQUVDLEVBQUMsSUFBRUQsR0FBRUMsRUFBQyxJQUFFRCxHQUFFQyxFQUFDLElBQUUsQ0FBQyxJQUFFRCxHQUFFQyxFQUFDLElBQUVIO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUQsSUFBRUMsSUFBRTtBQUFDLGFBQVNDLEtBQUc7QUFBQSxJQUFDO0FBQUMsSUFBQUEsR0FBRSxZQUFVRCxHQUFFLFdBQVVELEdBQUUsSUFBRUMsR0FBRSxXQUFVRCxHQUFFLFlBQVUsSUFBSUUsTUFBRUYsR0FBRSxVQUFVLGNBQVlBLElBQUVBLEdBQUUsSUFBRSxTQUFTQSxJQUFFRSxJQUFFQyxJQUFFO0FBQUMsZUFBUUMsS0FBRSxNQUFNLFVBQVUsU0FBTyxDQUFDLEdBQUVDLEtBQUUsR0FBRUEsS0FBRSxVQUFVLFFBQU9BLEtBQUksQ0FBQUQsR0FBRUMsS0FBRSxDQUFDLElBQUUsVUFBVUEsRUFBQztBQUFFLGFBQU9KLEdBQUUsVUFBVUMsRUFBQyxFQUFFLE1BQU1GLElBQUVJLEVBQUM7QUFBQSxJQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUosSUFBRUMsSUFBRTtBQUFDLFlBQU1ELE1BQUcsS0FBSyxFQUFFLE1BQU0sTUFBSyxTQUFTO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLElBQUFBLEdBQUUsSUFBRTtBQUFBLEVBQUU7QUFBQyxXQUFTLEVBQUVBLElBQUVDLElBQUU7QUFBQyxJQUFBRCxHQUFFLEtBQUtDLE1BQUcsQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVELElBQUVDLElBQUU7QUFBQyxXQUFPRCxLQUFFQyxLQUFFLElBQUVELEtBQUVDLEtBQUUsS0FBRztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVELElBQUU7QUFBQyxRQUFJQyxJQUFFQyxLQUFFLENBQUMsR0FBRUMsS0FBRTtBQUFFLFNBQUlGLE1BQUtELEdBQUUsQ0FBQUUsR0FBRUMsSUFBRyxJQUFFSCxHQUFFQyxFQUFDO0FBQUUsV0FBT0M7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRixJQUFFQyxJQUFFO0FBQUMsU0FBSyxJQUFFRCxJQUFFLEtBQUssSUFBRSxDQUFDO0FBQUUsYUFBUUUsS0FBRSxHQUFFQSxLQUFFRCxHQUFFLFFBQU9DLE1BQUk7QUFBQyxVQUFJQyxLQUFFRixHQUFFQyxFQUFDO0FBQUUsV0FBSyxFQUFFQyxHQUFFLENBQUMsSUFBRUE7QUFBQSxJQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUgsSUFBRTtBQUFDLFdBQU9BLEtBQUUsRUFBRUEsR0FBRSxDQUFDLEdBQUUsRUFBRUEsSUFBRSxTQUFTQSxJQUFFQyxJQUFFO0FBQUMsYUFBT0QsR0FBRSxJQUFFQyxHQUFFO0FBQUEsSUFBQyxDQUFDLEdBQUVEO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRUMsSUFBRTtBQUFDLFlBQU8sS0FBSyxJQUFFRCxJQUFFLEtBQUssSUFBRSxDQUFDLENBQUNDLEdBQUUsR0FBRSxLQUFLLElBQUVBLEdBQUUsR0FBRSxLQUFLLElBQUVBLEdBQUUsTUFBSyxLQUFLLElBQUUsT0FBRyxLQUFLLEdBQUU7QUFBQSxNQUFDLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBQSxNQUFFLEtBQUs7QUFBRSxhQUFLLElBQUU7QUFBQSxJQUFFO0FBQUMsU0FBSyxJQUFFQSxHQUFFO0FBQUEsRUFBWTtBQUFDLFdBQVMsSUFBRztBQUFDLFNBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJ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LEtBQUdBLEdBQUUsVUFBUSxHQUFHLEtBQUtBLEVBQUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsUUFBRyxRQUFNQSxHQUFFLFFBQU87QUFBSyxJQUFBQSxLQUFFQSxHQUFFLFlBQVk7QUFBRSxRQUFJQyxLQUFFRixHQUFFLEVBQUVDLEVBQUM7QUFBRSxRQUFHLFFBQU1DLElBQUU7QUFBQyxVQUFHQSxLQUFFLEdBQUdELEVBQUMsR0FBRSxRQUFNQyxHQUFFLFFBQU87QUFBSyxNQUFBQSxLQUFHLElBQUksSUFBRyxFQUFFLEVBQUUsRUFBRSxHQUFFQSxFQUFDLEdBQUVGLEdBQUUsRUFBRUMsRUFBQyxJQUFFQztBQUFBLElBQUM7QUFBQyxXQUFPQTtBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVGLElBQUU7QUFBQyxXQUFPQSxLQUFFLEdBQUdBLEVBQUMsR0FBRSxRQUFNQSxLQUFFLE9BQUtBLEdBQUUsQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxTQUFLLElBQUUsT0FBTyxRQUFHLEdBQUUsS0FBSyxJQUFFLElBQUcsS0FBSyxJQUFFLElBQUksS0FBRSxLQUFLLElBQUUsSUFBRyxLQUFLLElBQUUsSUFBSSxLQUFFLEtBQUssSUFBRSxJQUFJLEtBQUUsS0FBSyxJQUFFLE1BQUcsS0FBSyxJQUFFLEtBQUssSUFBRSxLQUFLLElBQUUsT0FBRyxLQUFLLElBQUUsRUFBRSxFQUFFLEdBQUUsS0FBSyxJQUFFLEdBQUUsS0FBSyxJQUFFLElBQUksS0FBRSxLQUFLLElBQUUsT0FBRyxLQUFLLElBQUUsSUFBRyxLQUFLLElBQUUsSUFBSSxLQUFFLEtBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJQUFFQSxJQUFFLEtBQUssSUFBRSxLQUFLLElBQUUsRUFBRSxNQUFLLEtBQUssQ0FBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUVDLElBQUU7QUFBQyxRQUFJQztBQUFFLFFBQUcsUUFBTUQsTUFBRyxNQUFNQSxFQUFDLEtBQUdBLEdBQUUsWUFBWSxLQUFJLElBQUc7QUFBQyxVQUFHQyxLQUFFLEVBQUVGLEdBQUUsR0FBRUMsRUFBQyxHQUFFLFFBQU1DLEdBQUUsT0FBTSxNQUFNLDBCQUF3QkQsRUFBQztBQUFFLE1BQUFDLEtBQUUsRUFBRUEsSUFBRSxFQUFFO0FBQUEsSUFBQyxNQUFNLENBQUFBLEtBQUU7QUFBRSxXQUFPQSxLQUFFLEVBQUVGLEdBQUUsR0FBRSxFQUFFRSxFQUFDLENBQUMsR0FBRSxRQUFNQSxLQUFFQSxLQUFFO0FBQUEsRUFBRTtBQUFDLFdBQVMsRUFBRUYsSUFBRTtBQUFDLGFBQVFDLEtBQUVELEdBQUUsRUFBRSxRQUFPRSxLQUFFLEdBQUVBLEtBQUVELElBQUUsRUFBRUMsSUFBRTtBQUFDLFVBQUlFLEtBQUVKLEdBQUUsRUFBRUUsRUFBQyxHQUFFRyxLQUFFLEVBQUVELElBQUUsQ0FBQztBQUFFLFVBQUdKLEdBQUUsS0FBR0ssR0FBRSxRQUFNO0FBQUcsVUFBSUM7QUFBRSxNQUFBQSxLQUFFTjtBQUFFLFVBQUlPLEtBQUVILElBQUVPLEtBQUUsRUFBRUosSUFBRSxDQUFDO0FBQUUsVUFBRyxNQUFJSSxHQUFFLFFBQVEsR0FBRyxFQUFFLENBQUFMLEtBQUU7QUFBQSxXQUFPO0FBQUMsUUFBQUssS0FBRUEsR0FBRSxRQUFRLElBQUcsS0FBSyxHQUFFQSxLQUFFQSxHQUFFLFFBQVEsSUFBRyxLQUFLLEdBQUUsRUFBRUwsR0FBRSxDQUFDO0FBQUUsWUFBSUU7QUFBRSxRQUFBQSxLQUFFRjtBQUFFLFlBQUlDLEtBQUUsRUFBRUEsSUFBRSxDQUFDLEdBQUVFLEtBQUUsa0JBQWtCLE1BQU1FLEVBQUMsRUFBRSxDQUFDO0FBQUUsUUFBQUYsR0FBRSxTQUFPRCxHQUFFLEVBQUUsRUFBRSxTQUFPQSxLQUFFLE1BQUlBLEtBQUVDLEdBQUUsUUFBUSxJQUFJLE9BQU9FLElBQUUsR0FBRyxHQUFFSixFQUFDLEdBQUVDLEtBQUVBLEdBQUUsUUFBUSxPQUFPLEtBQUksR0FBRyxHQUFFLFFBQUcsSUFBRyxJQUFFQSxHQUFFLFVBQVFGLEdBQUUsRUFBRSxFQUFFRSxFQUFDLEdBQUVGLEtBQUUsUUFBSUEsS0FBRTtBQUFBLE1BQUU7QUFBQyxVQUFHQSxHQUFFLFFBQU9OLEdBQUUsSUFBRUssSUFBRUwsR0FBRSxJQUFFLEdBQUcsS0FBSyxFQUFFSSxJQUFFLENBQUMsQ0FBQyxHQUFFSixHQUFFLElBQUUsR0FBRTtBQUFBLElBQUU7QUFBQyxXQUFPQSxHQUFFLElBQUU7QUFBQSxFQUFFO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsYUFBUUMsS0FBRSxDQUFDLEdBQUVDLEtBQUVGLEdBQUUsU0FBTyxHQUFFRyxLQUFFSixHQUFFLEVBQUUsUUFBT0ssS0FBRSxHQUFFQSxLQUFFRCxJQUFFLEVBQUVDLElBQUU7QUFBQyxVQUFJQyxLQUFFTixHQUFFLEVBQUVLLEVBQUM7QUFBRSxXQUFHLEVBQUVDLElBQUUsQ0FBQyxJQUFFSixHQUFFLEtBQUtGLEdBQUUsRUFBRUssRUFBQyxDQUFDLEtBQUdDLEtBQUUsRUFBRUEsSUFBRSxHQUFFLEtBQUssSUFBSUgsSUFBRSxFQUFFRyxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBRSxLQUFHTCxHQUFFLE9BQU9LLEVBQUMsS0FBR0osR0FBRSxLQUFLRixHQUFFLEVBQUVLLEVBQUMsQ0FBQztBQUFBLElBQUU7QUFBQyxJQUFBTCxHQUFFLElBQUVFO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUYsSUFBRUMsSUFBRTtBQUFDLElBQUFELEdBQUUsRUFBRSxFQUFFQyxFQUFDO0FBQUUsUUFBSUMsS0FBRUQ7QUFBRSxRQUFHLEdBQUcsS0FBS0MsRUFBQyxLQUFHLEtBQUdGLEdBQUUsRUFBRSxFQUFFLFVBQVEsR0FBRyxLQUFLRSxFQUFDLEdBQUU7QUFBQyxVQUFJRSxJQUFFRixLQUFFRDtBQUFFLGFBQUtDLE1BQUdFLEtBQUVGLElBQUVGLEdBQUUsRUFBRSxFQUFFRSxFQUFDLE1BQUlFLEtBQUUsR0FBR0YsRUFBQyxHQUFFRixHQUFFLEVBQUUsRUFBRUksRUFBQyxHQUFFSixHQUFFLEVBQUUsRUFBRUksRUFBQyxJQUFHSCxLQUFFRztBQUFBLElBQUMsTUFBTSxDQUFBSixHQUFFLElBQUUsT0FBR0EsR0FBRSxJQUFFO0FBQUcsUUFBRyxDQUFDQSxHQUFFLEdBQUU7QUFBQyxVQUFHLENBQUNBLEdBQUU7QUFBRSxZQUFHLEVBQUVBLEVBQUMsR0FBRTtBQUFDLGNBQUcsRUFBRUEsRUFBQyxFQUFFLFFBQU8sRUFBRUEsRUFBQztBQUFBLFFBQUMsV0FBUyxJQUFFQSxHQUFFLEVBQUUsV0FBU0UsS0FBRUYsR0FBRSxFQUFFLFNBQVMsR0FBRSxFQUFFQSxHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLEVBQUUsRUFBRUUsRUFBQyxHQUFFQSxLQUFFRixHQUFFLEVBQUUsU0FBUyxHQUFFSSxLQUFFRixHQUFFLFlBQVlGLEdBQUUsQ0FBQyxHQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLEVBQUUsRUFBRUUsR0FBRSxVQUFVLEdBQUVFLEVBQUMsQ0FBQyxJQUFHSixHQUFFLEtBQUcsRUFBRUEsRUFBQyxFQUFFLFFBQU9BLEdBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRSxFQUFFQSxFQUFDO0FBQUE7QUFBRSxhQUFPQSxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxZQUFPQSxHQUFFLEVBQUUsRUFBRSxRQUFPO0FBQUEsTUFBQyxLQUFLO0FBQUEsTUFBRSxLQUFLO0FBQUEsTUFBRSxLQUFLO0FBQUUsZUFBT0EsR0FBRSxFQUFFLFNBQVM7QUFBQSxNQUFFLEtBQUs7QUFBRSxZQUFHLENBQUMsRUFBRUEsRUFBQyxFQUFFLFFBQU9BLEdBQUUsSUFBRSxFQUFFQSxFQUFDLEdBQUUsRUFBRUEsRUFBQztBQUFFLFFBQUFBLEdBQUUsSUFBRTtBQUFBLE1BQUc7QUFBUSxlQUFPQSxHQUFFLEtBQUcsRUFBRUEsRUFBQyxNQUFJQSxHQUFFLElBQUUsUUFBSUEsR0FBRSxFQUFFLFNBQVMsSUFBRUEsR0FBRSxFQUFFLFNBQVMsS0FBRyxJQUFFQSxHQUFFLEVBQUUsVUFBUUUsS0FBRSxFQUFFRixJQUFFQyxFQUFDLEdBQUVHLEtBQUUsRUFBRUosRUFBQyxHQUFFLElBQUVJLEdBQUUsU0FBT0EsTUFBRyxFQUFFSixJQUFFQSxHQUFFLEVBQUUsU0FBUyxDQUFDLEdBQUUsRUFBRUEsRUFBQyxJQUFFLEVBQUVBLEVBQUMsSUFBRUEsR0FBRSxJQUFFLEVBQUVBLElBQUVFLEVBQUMsSUFBRUYsR0FBRSxFQUFFLFNBQVMsTUFBSSxFQUFFQSxFQUFDO0FBQUEsSUFBQztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxXQUFPQSxHQUFFLElBQUUsTUFBR0EsR0FBRSxJQUFFLE9BQUdBLEdBQUUsSUFBRSxDQUFDLEdBQUVBLEdBQUUsSUFBRSxHQUFFLEVBQUVBLEdBQUUsQ0FBQyxHQUFFQSxHQUFFLElBQUUsSUFBRyxFQUFFQSxFQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLGFBQVFDLEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUVFLEtBQUVGLEdBQUUsRUFBRSxRQUFPRyxLQUFFLEdBQUVBLEtBQUVELElBQUUsRUFBRUMsSUFBRTtBQUFDLFVBQUlDLEtBQUVKLEdBQUUsRUFBRUcsRUFBQyxHQUFFRSxLQUFFLEVBQUVELElBQUUsQ0FBQztBQUFFLFVBQUcsSUFBSSxPQUFPLFNBQU9DLEtBQUUsSUFBSSxFQUFFLEtBQUtKLEVBQUMsRUFBRSxRQUFPRCxHQUFFLElBQUUsR0FBRyxLQUFLLEVBQUVJLElBQUUsQ0FBQyxDQUFDLEdBQUVILEtBQUVBLEdBQUUsUUFBUSxJQUFJLE9BQU9JLElBQUUsR0FBRyxHQUFFLEVBQUVELElBQUUsQ0FBQyxDQUFDLEdBQUUsRUFBRUosSUFBRUMsRUFBQztBQUFBLElBQUM7QUFBQyxXQUFNO0FBQUEsRUFBRTtBQUFDLFdBQVMsRUFBRUQsSUFBRUMsSUFBRTtBQUFDLFFBQUlDLEtBQUVGLEdBQUUsRUFBRSxFQUFFO0FBQU8sV0FBT0EsR0FBRSxLQUFHLElBQUVFLE1BQUcsT0FBS0YsR0FBRSxFQUFFLFNBQVMsRUFBRSxPQUFPRSxLQUFFLENBQUMsSUFBRUYsR0FBRSxJQUFFLE1BQUlDLEtBQUVELEdBQUUsSUFBRUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRCxJQUFFO0FBQUMsUUFBSUMsS0FBRUQsR0FBRSxFQUFFLFNBQVM7QUFBRSxRQUFHLEtBQUdDLEdBQUUsUUFBTztBQUFDLGVBQVFDLEtBQUVGLEdBQUUsS0FBRyxLQUFHQSxHQUFFLEVBQUUsVUFBUSxJQUFFLEVBQUVBLEdBQUUsR0FBRSxFQUFFLElBQUUsRUFBRUEsR0FBRSxHQUFFLEVBQUUsS0FBRyxDQUFDLElBQUUsRUFBRUEsR0FBRSxHQUFFLEVBQUUsS0FBRyxDQUFDLEdBQUVHLEtBQUVELEdBQUUsUUFBT0UsS0FBRSxHQUFFQSxLQUFFRCxJQUFFLEVBQUVDLElBQUU7QUFBQyxZQUFJQyxLQUFFSCxHQUFFRSxFQUFDO0FBQUUsWUFBRUosR0FBRSxFQUFFLFVBQVEsRUFBRSxFQUFFSyxJQUFFLENBQUMsQ0FBQyxLQUFHLENBQUMsRUFBRUEsSUFBRSxDQUFDLEtBQUcsUUFBTUEsR0FBRSxFQUFFLENBQUMsTUFBSSxLQUFHTCxHQUFFLEVBQUUsVUFBUUEsR0FBRSxLQUFHLEVBQUUsRUFBRUssSUFBRSxDQUFDLENBQUMsS0FBRyxFQUFFQSxJQUFFLENBQUMsTUFBSSxHQUFHLEtBQUssRUFBRUEsSUFBRSxDQUFDLENBQUMsS0FBR0wsR0FBRSxFQUFFLEtBQUtLLEVBQUM7QUFBQSxNQUFDO0FBQUMsYUFBTyxFQUFFTCxJQUFFQyxFQUFDLEdBQUVBLEtBQUUsRUFBRUQsRUFBQyxHQUFFLElBQUVDLEdBQUUsU0FBT0EsS0FBRSxFQUFFRCxFQUFDLElBQUUsRUFBRUEsRUFBQyxJQUFFQSxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxXQUFPLEVBQUVBLElBQUVDLEVBQUM7QUFBQSxFQUFDO0FBQUMsV0FBUyxFQUFFRCxJQUFFO0FBQUMsUUFBSUMsS0FBRUQsR0FBRSxFQUFFLFNBQVMsR0FBRUUsS0FBRUQsR0FBRTtBQUFPLFFBQUcsSUFBRUMsSUFBRTtBQUFDLGVBQVFDLEtBQUUsSUFBR0MsS0FBRSxHQUFFQSxLQUFFRixJQUFFRSxLQUFJLENBQUFELEtBQUUsRUFBRUgsSUFBRUMsR0FBRSxPQUFPRyxFQUFDLENBQUM7QUFBRSxhQUFPSixHQUFFLElBQUUsRUFBRUEsSUFBRUcsRUFBQyxJQUFFSCxHQUFFLEVBQUUsU0FBUztBQUFBLElBQUM7QUFBQyxXQUFPQSxHQUFFLEVBQUUsU0FBUztBQUFBLEVBQUM7QUFBQyxXQUFTLEVBQUVBLElBQUU7QUFBQyxRQUFJQyxJQUFFQyxLQUFFRixHQUFFLEVBQUUsU0FBUyxHQUFFSSxLQUFFO0FBQUUsV0FBTyxLQUFHLEVBQUVKLEdBQUUsR0FBRSxFQUFFLElBQUVDLEtBQUUsU0FBSUEsS0FBRUQsR0FBRSxFQUFFLFNBQVMsR0FBRUMsS0FBRSxPQUFLQSxHQUFFLE9BQU8sQ0FBQyxLQUFHLE9BQUtBLEdBQUUsT0FBTyxDQUFDLEtBQUcsT0FBS0EsR0FBRSxPQUFPLENBQUMsSUFBR0EsTUFBR0csS0FBRSxHQUFFSixHQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEdBQUVBLEdBQUUsSUFBRSxRQUFJLFFBQU1BLEdBQUUsRUFBRSxFQUFFLEVBQUUsTUFBSUMsS0FBRSxJQUFJLE9BQU8sU0FBTyxFQUFFRCxHQUFFLEdBQUUsRUFBRSxJQUFFLEdBQUcsR0FBRUMsS0FBRUMsR0FBRSxNQUFNRCxFQUFDLEdBQUUsUUFBTUEsTUFBRyxRQUFNQSxHQUFFLENBQUMsS0FBRyxJQUFFQSxHQUFFLENBQUMsRUFBRSxXQUFTRCxHQUFFLElBQUUsTUFBR0ksS0FBRUgsR0FBRSxDQUFDLEVBQUUsUUFBT0QsR0FBRSxFQUFFLEVBQUVFLEdBQUUsVUFBVSxHQUFFRSxFQUFDLENBQUMsS0FBSSxFQUFFSixHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVFLEdBQUUsVUFBVUUsRUFBQyxDQUFDLEdBQUVGLEdBQUUsVUFBVSxHQUFFRSxFQUFDO0FBQUEsRUFBQztBQUFDLFdBQVMsRUFBRUosSUFBRTtBQUFDLFFBQUlDLEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUVFLEtBQUUsSUFBSSxPQUFPLGFBQVcsRUFBRUYsR0FBRSxHQUFFLEVBQUUsSUFBRSxHQUFHLEdBQUVFLEtBQUVELEdBQUUsTUFBTUMsRUFBQztBQUFFLFdBQU8sUUFBTUEsTUFBRyxRQUFNQSxHQUFFLENBQUMsS0FBRyxJQUFFQSxHQUFFLENBQUMsRUFBRSxXQUFTRixHQUFFLElBQUUsTUFBR0UsS0FBRUEsR0FBRSxDQUFDLEVBQUUsUUFBTyxFQUFFRixHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVDLEdBQUUsVUFBVUMsRUFBQyxDQUFDLEdBQUUsRUFBRUYsR0FBRSxDQUFDLEdBQUVBLEdBQUUsRUFBRSxFQUFFQyxHQUFFLFVBQVUsR0FBRUMsRUFBQyxDQUFDLEdBQUUsT0FBS0QsR0FBRSxPQUFPLENBQUMsS0FBR0QsR0FBRSxFQUFFLEVBQUUsR0FBRyxHQUFFO0FBQUEsRUFBRztBQUFDLFdBQVMsRUFBRUEsSUFBRTtBQUFDLFFBQUcsS0FBR0EsR0FBRSxFQUFFLEVBQUUsT0FBTyxRQUFNO0FBQUcsUUFBSUMsSUFBRUcsS0FBRSxJQUFJO0FBQUUsT0FBRTtBQUFDLFVBQUdILEtBQUVELEdBQUUsRUFBRSxTQUFTLEdBQUUsS0FBR0MsR0FBRSxVQUFRLE9BQUtBLEdBQUUsT0FBTyxDQUFDO0FBQUUsaUJBQVFJLElBQUVDLEtBQUVMLEdBQUUsUUFBT00sS0FBRSxHQUFFLEtBQUdBLE1BQUdBLE1BQUdELElBQUUsRUFBRUMsR0FBRSxLQUFHRixLQUFFLFNBQVNKLEdBQUUsVUFBVSxHQUFFTSxFQUFDLEdBQUUsRUFBRSxHQUFFRixNQUFLLElBQUc7QUFBQyxVQUFBRCxHQUFFLEVBQUVILEdBQUUsVUFBVU0sRUFBQyxDQUFDLEdBQUVOLEtBQUVJO0FBQUUsZ0JBQU07QUFBQSxRQUFDO0FBQUE7QUFBQyxNQUFBSixLQUFFO0FBQUEsSUFBQztBQUFDLFdBQU8sS0FBR0EsT0FBSSxFQUFFRCxHQUFFLENBQUMsR0FBRUEsR0FBRSxFQUFFLEVBQUVJLEdBQUUsU0FBUyxDQUFDLEdBQUVBLEtBQUUsRUFBRUgsRUFBQyxHQUFFLFNBQU9HLEtBQUVKLEdBQUUsSUFBRSxFQUFFQSxHQUFFLEdBQUUsS0FBR0MsRUFBQyxJQUFFRyxNQUFHSixHQUFFLE1BQUlBLEdBQUUsSUFBRSxFQUFFQSxJQUFFSSxFQUFDLElBQUdKLEdBQUUsRUFBRSxFQUFFLEtBQUdDLEVBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRUQsR0FBRSxJQUFFLElBQUc7QUFBQSxFQUFHO0FBQUMsV0FBUyxFQUFFQSxJQUFFQyxJQUFFO0FBQUMsUUFBSUMsS0FBRUYsR0FBRSxFQUFFLFNBQVM7QUFBRSxRQUFHLEtBQUdFLEdBQUUsVUFBVUYsR0FBRSxDQUFDLEVBQUUsT0FBT0EsR0FBRSxDQUFDLEdBQUU7QUFBQyxVQUFJSSxLQUFFRixHQUFFLE9BQU9GLEdBQUUsQ0FBQyxHQUFFRSxLQUFFQSxHQUFFLFFBQVFGLEdBQUUsR0FBRUMsRUFBQztBQUFFLGFBQU8sRUFBRUQsR0FBRSxDQUFDLEdBQUVBLEdBQUUsRUFBRSxFQUFFRSxFQUFDLEdBQUVGLEdBQUUsSUFBRUksSUFBRUYsR0FBRSxVQUFVLEdBQUVGLEdBQUUsSUFBRSxDQUFDO0FBQUEsSUFBQztBQUFDLFdBQU8sS0FBR0EsR0FBRSxFQUFFLFdBQVNBLEdBQUUsSUFBRSxRQUFJQSxHQUFFLElBQUUsSUFBR0EsR0FBRSxFQUFFLFNBQVM7QUFBQSxFQUFDO0FBQUMsTUFBSSxJQUFFO0FBQUssSUFBRSxVQUFVLElBQUUsSUFBRyxFQUFFLFVBQVUsTUFBSSxTQUFTQSxJQUFFO0FBQUMsU0FBSyxJQUFFLEtBQUdBO0FBQUEsRUFBQyxHQUFFLEVBQUUsVUFBVSxJQUFFLFNBQVNBLElBQUVDLElBQUVDLElBQUU7QUFBQyxRQUFHLEtBQUssS0FBRyxPQUFPRixFQUFDLEdBQUUsUUFBTUMsR0FBRSxVQUFRRSxLQUFFLEdBQUVBLEtBQUUsVUFBVSxRQUFPQSxLQUFJLE1BQUssS0FBRyxVQUFVQSxFQUFDO0FBQUUsV0FBTztBQUFBLEVBQUksR0FBRSxFQUFFLFVBQVUsV0FBUyxXQUFVO0FB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S0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLEdBQUUsS0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLEdBQUUsS0FBSSxHQUFFLEtBQUksR0FBRSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxLQUFJLFVBQUksS0FBSSxVQUFJLEtBQUksVUFBSSxJQUFHLEdBQUUsS0FBRyxPQUFPLFlBQU8sR0FBRSxLQUFHLE9BQU8sZ0RBQWtCLEdBQUUsS0FBRyxlQUFjLEtBQUcsSUFBSTtBQUFFLElBQUUsSUFBRyxJQUFHLElBQUk7QUFBRSxNQUFJLEtBQUcsbUJBQWtCLEtBQUcscUJBQW9CLEtBQUcsT0FBTyxtUUFBdUYsR0FBRSxLQUFHO0FBQU8sSUFBRSxVQUFVLElBQUUsV0FBVTtBQUFDLFNBQUssSUFBRSxJQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUUsRUFBRSxLQUFLLENBQUMsR0FBRSxFQUFFLEtBQUssQ0FBQyxHQUFFLEtBQUssSUFBRSxHQUFFLEtBQUssSUFBRSxJQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUUsS0FBSyxJQUFFLElBQUcsRUFBRSxLQUFLLENBQUMsR0FBRSxLQUFLLElBQUUsTUFBRyxLQUFLLElBQUUsS0FBSyxJQUFFLEtBQUssSUFBRSxPQUFHLEtBQUssSUFBRSxDQUFDLEdBQUUsS0FBSyxJQUFFLE9BQUcsS0FBSyxLQUFHLEtBQUssTUFBSSxLQUFLLElBQUUsRUFBRSxNQUFLLEtBQUssQ0FBQztBQUFBLEVBQUUsR0FBRSxFQUFFLFVBQVUsSUFBRSxTQUFTRCxJQUFFO0FBQUMsV0FBTyxLQUFLLElBQUUsRUFBRSxNQUFLQSxFQUFDO0FBQUEsRUFBQyxHQUFFLEVBQUUsNkJBQTRCLENBQUMsR0FBRSxFQUFFLGtEQUFpRCxFQUFFLFVBQVUsQ0FBQyxHQUFFLEVBQUUsNkNBQTRDLEVBQUUsVUFBVSxDQUFDO0FBQUMsRUFBRSxLQUFLLFlBQVUsT0FBTyxVQUFRLFNBQU8sU0FBTyxNQUFNOzs7QUMvQng3SixJQUFNLG9CQUFOLE1BQXdCO0FBQUEsRUFpQjdCLE9BQWMsY0FDWixRQVFBLFdBQ007QUFFTixRQUFJLE1BQU0sUUFBUSxPQUFPLE1BQU0sR0FBRztBQUNoQyxhQUFPLFNBQVUsT0FBTyxPQUF5QixDQUFDO0FBQUEsSUFDcEQ7QUFDQSxRQUFJLE1BQU0sUUFBUSxPQUFPLElBQUksR0FBRztBQUM5QixhQUFPLE9BQVEsT0FBTyxLQUF3QixDQUFDO0FBQUEsSUFDakQ7QUFDQSxRQUFJLE1BQU0sUUFBUSxPQUFPLE9BQU8sR0FBRztBQUNqQyxhQUFPLFVBQVcsT0FBTyxRQUEwQixDQUFDO0FBQUEsSUFDdEQ7QUFDQSxRQUFJLE1BQU0sUUFBUSxPQUFPLE9BQU8sR0FBRztBQUNqQyxhQUFPLFVBQVcsT0FBTyxRQUEwQixDQUFDO0FBQUEsSUFDdEQ7QUFDQSxRQUFJLE1BQU0sUUFBUSxPQUFPLFNBQVMsR0FBRztBQUNuQyxhQUFPLFlBQWEsT0FBTyxVQUE0QixDQUFDO0FBQUEsSUFDMUQ7QUFDQSxRQUFJLE1BQU0sUUFBUSxPQUFPLFdBQVcsR0FBRztBQUNyQyxhQUFPLGNBQWUsT0FBTyxZQUFxQyxDQUFDO0FBQUEsSUFDckU7QUFHQSxRQUFJLFVBQVUsUUFBUSxZQUFZLE1BQU0sU0FBUztBQUMvQztBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQXdCLE9BQU8sU0FDakMsT0FBTyxPQUFPLFdBQVcsV0FDdEIsS0FBSyxNQUFNLE9BQU8sT0FBTyxRQUFRLEtBQUssR0FBRyxFQUFFLFFBQVEsS0FBSyxHQUFHLENBQUMsSUFDNUQsT0FBTyxTQUNWO0FBQUEsTUFDRSxNQUFNLE9BQU8sT0FBUSxPQUFPLE9BQW1CO0FBQUEsTUFDL0MsU0FBUyxPQUFPLFdBQVcsT0FBTyxPQUFPLFlBQVksV0FBWSxPQUFPLFVBQXFCO0FBQUEsTUFDN0YsU0FBUyxPQUFPLFdBQVcsT0FBTyxPQUFPLFlBQVksV0FBWSxPQUFPLFVBQXFCO0FBQUEsTUFDN0YsV0FBVyxPQUFPLGFBQWEsT0FBTyxPQUFPLGNBQWMsV0FBWSxPQUFPLFlBQXVCO0FBQUEsTUFDckcsYUFBYSxPQUFPLGNBQ2hCLEtBQUssUUFBZ0IsT0FBTyxhQUFhLFFBQVEsRUFBRSxNQUFNLEdBQUcsSUFDNUQsQ0FBQyxLQUFLLEtBQUssR0FBRztBQUFBLElBQ3BCO0FBR0osUUFBSSxtQkFBTyxXQUEwQixNQUFNO0FBQUEsRUFDN0M7QUFDRjtBQXJEZ0I7QUFBQSxFQURiLElBQUk7QUFBQSxFQUlGLDRCQUFTO0FBQUEsSUFDUjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0Msc0JBQUcsSUFBSSxRQUFRLE9BQU8sTUFBTTtBQUFBLEdBekJwQixtQkFpQkc7QUF1RGhCLE9BQU8sTUFBTSxzQkFBc0IscUJBQXFCLGtCQUFrQixjQUFjLEtBQUssaUJBQWlCLENBQUM7IiwKICAibmFtZXMiOiBbIlV0aWwiLCAibiIsICJ0IiwgImUiLCAibCIsICJyIiwgImkiLCAidSIsICJhIiwgInMiLCAiZiIsICJoIiwgIm8iXQp9Cg==
