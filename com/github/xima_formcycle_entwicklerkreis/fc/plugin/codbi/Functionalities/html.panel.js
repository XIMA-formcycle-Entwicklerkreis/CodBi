import {
  CodBiError
} from "./chunk-QGX5JPGQ.js";
import {
  REGEX
} from "./chunk-QZ34KSY4.js";
import {
  INSTANCE
} from "./chunk-4PFSMFDI.js";
import {
  require_dist
} from "./chunk-2R3WETV4.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __commonJS,
  __decorateClass,
  __decorateParam,
  __toESM
} from "./chunk-KWZW6WYL.js";

// ../../node_modules/jquery/dist/jquery.js
var require_jquery = __commonJS({
  "../../node_modules/jquery/dist/jquery.js"(exports, module) {
    (function(global, factory) {
      "use strict";
      if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ? factory(global, true) : function(w) {
          if (!w.document) {
            throw new Error("jQuery requires a window with a document");
          }
          return factory(w);
        };
      } else {
        factory(global);
      }
    })(typeof window !== "undefined" ? window : exports, function(window2, noGlobal) {
      "use strict";
      var arr = [];
      var getProto = Object.getPrototypeOf;
      var slice = arr.slice;
      var flat = arr.flat ? function(array) {
        return arr.flat.call(array);
      } : function(array) {
        return arr.concat.apply([], array);
      };
      var push = arr.push;
      var indexOf = arr.indexOf;
      var class2type = {};
      var toString = class2type.toString;
      var hasOwn = class2type.hasOwnProperty;
      var fnToString = hasOwn.toString;
      var ObjectFunctionString = fnToString.call(Object);
      var support = {};
      var isFunction = function isFunction2(obj) {
        return typeof obj === "function" && typeof obj.nodeType !== "number" && typeof obj.item !== "function";
      };
      var isWindow = function isWindow2(obj) {
        return obj != null && obj === obj.window;
      };
      var document2 = window2.document;
      var preservedScriptAttributes = {
        type: true,
        src: true,
        nonce: true,
        noModule: true
      };
      function DOMEval(code, node, doc) {
        doc = doc || document2;
        var i, val, script = doc.createElement("script");
        script.text = code;
        if (node) {
          for (i in preservedScriptAttributes) {
            val = node[i] || node.getAttribute && node.getAttribute(i);
            if (val) {
              script.setAttribute(i, val);
            }
          }
        }
        doc.head.appendChild(script).parentNode.removeChild(script);
      }
      function toType(obj) {
        if (obj == null) {
          return obj + "";
        }
        return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
      }
      var version = "3.7.1", rhtmlSuffix = /HTML$/i, jQuery = function(selector, context) {
        return new jQuery.fn.init(selector, context);
      };
      jQuery.fn = jQuery.prototype = {
        // The current version of jQuery being used
        jquery: version,
        constructor: jQuery,
        // The default length of a jQuery object is 0
        length: 0,
        toArray: function() {
          return slice.call(this);
        },
        // Get the Nth element in the matched element set OR
        // Get the whole matched element set as a clean array
        get: function(num) {
          if (num == null) {
            return slice.call(this);
          }
          return num < 0 ? this[num + this.length] : this[num];
        },
        // Take an array of elements and push it onto the stack
        // (returning the new matched element set)
        pushStack: function(elems) {
          var ret = jQuery.merge(this.constructor(), elems);
          ret.prevObject = this;
          return ret;
        },
        // Execute a callback for every element in the matched set.
        each: function(callback) {
          return jQuery.each(this, callback);
        },
        map: function(callback) {
          return this.pushStack(jQuery.map(this, function(elem, i) {
            return callback.call(elem, i, elem);
          }));
        },
        slice: function() {
          return this.pushStack(slice.apply(this, arguments));
        },
        first: function() {
          return this.eq(0);
        },
        last: function() {
          return this.eq(-1);
        },
        even: function() {
          return this.pushStack(jQuery.grep(this, function(_elem, i) {
            return (i + 1) % 2;
          }));
        },
        odd: function() {
          return this.pushStack(jQuery.grep(this, function(_elem, i) {
            return i % 2;
          }));
        },
        eq: function(i) {
          var len = this.length, j = +i + (i < 0 ? len : 0);
          return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
        },
        end: function() {
          return this.prevObject || this.constructor();
        },
        // For internal use only.
        // Behaves like an Array's method, not like a jQuery method.
        push,
        sort: arr.sort,
        splice: arr.splice
      };
      jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
        if (typeof target === "boolean") {
          deep = target;
          target = arguments[i] || {};
          i++;
        }
        if (typeof target !== "object" && !isFunction(target)) {
          target = {};
        }
        if (i === length) {
          target = this;
          i--;
        }
        for (; i < length; i++) {
          if ((options = arguments[i]) != null) {
            for (name in options) {
              copy = options[name];
              if (name === "__proto__" || target === copy) {
                continue;
              }
              if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                src = target[name];
                if (copyIsArray && !Array.isArray(src)) {
                  clone = [];
                } else if (!copyIsArray && !jQuery.isPlainObject(src)) {
                  clone = {};
                } else {
                  clone = src;
                }
                copyIsArray = false;
                target[name] = jQuery.extend(deep, clone, copy);
              } else if (copy !== void 0) {
                target[name] = copy;
              }
            }
          }
        }
        return target;
      };
      jQuery.extend({
        // Unique for each copy of jQuery on the page
        expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
        // Assume jQuery is ready without the ready module
        isReady: true,
        error: function(msg) {
          throw new Error(msg);
        },
        noop: function() {
        },
        isPlainObject: function(obj) {
          var proto, Ctor;
          if (!obj || toString.call(obj) !== "[object Object]") {
            return false;
          }
          proto = getProto(obj);
          if (!proto) {
            return true;
          }
          Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
          return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
        },
        isEmptyObject: function(obj) {
          var name;
          for (name in obj) {
            return false;
          }
          return true;
        },
        // Evaluates a script in a provided context; falls back to the global one
        // if not specified.
        globalEval: function(code, options, doc) {
          DOMEval(code, { nonce: options && options.nonce }, doc);
        },
        each: function(obj, callback) {
          var length, i = 0;
          if (isArrayLike(obj)) {
            length = obj.length;
            for (; i < length; i++) {
              if (callback.call(obj[i], i, obj[i]) === false) {
                break;
              }
            }
          } else {
            for (i in obj) {
              if (callback.call(obj[i], i, obj[i]) === false) {
                break;
              }
            }
          }
          return obj;
        },
        // Retrieve the text value of an array of DOM nodes
        text: function(elem) {
          var node, ret = "", i = 0, nodeType = elem.nodeType;
          if (!nodeType) {
            while (node = elem[i++]) {
              ret += jQuery.text(node);
            }
          }
          if (nodeType === 1 || nodeType === 11) {
            return elem.textContent;
          }
          if (nodeType === 9) {
            return elem.documentElement.textContent;
          }
          if (nodeType === 3 || nodeType === 4) {
            return elem.nodeValue;
          }
          return ret;
        },
        // results is for internal usage only
        makeArray: function(arr2, results) {
          var ret = results || [];
          if (arr2 != null) {
            if (isArrayLike(Object(arr2))) {
              jQuery.merge(
                ret,
                typeof arr2 === "string" ? [arr2] : arr2
              );
            } else {
              push.call(ret, arr2);
            }
          }
          return ret;
        },
        inArray: function(elem, arr2, i) {
          return arr2 == null ? -1 : indexOf.call(arr2, elem, i);
        },
        isXMLDoc: function(elem) {
          var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
          return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
        },
        // Support: Android <=4.0 only, PhantomJS 1 only
        // push.apply(_, arraylike) throws on ancient WebKit
        merge: function(first, second) {
          var len = +second.length, j = 0, i = first.length;
          for (; j < len; j++) {
            first[i++] = second[j];
          }
          first.length = i;
          return first;
        },
        grep: function(elems, callback, invert) {
          var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
          for (; i < length; i++) {
            callbackInverse = !callback(elems[i], i);
            if (callbackInverse !== callbackExpect) {
              matches.push(elems[i]);
            }
          }
          return matches;
        },
        // arg is for internal usage only
        map: function(elems, callback, arg) {
          var length, value, i = 0, ret = [];
          if (isArrayLike(elems)) {
            length = elems.length;
            for (; i < length; i++) {
              value = callback(elems[i], i, arg);
              if (value != null) {
                ret.push(value);
              }
            }
          } else {
            for (i in elems) {
              value = callback(elems[i], i, arg);
              if (value != null) {
                ret.push(value);
              }
            }
          }
          return flat(ret);
        },
        // A global GUID counter for objects
        guid: 1,
        // jQuery.support is not used in Core but other projects attach their
        // properties to it so it needs to exist.
        support
      });
      if (typeof Symbol === "function") {
        jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
      }
      jQuery.each(
        "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
        function(_i, name) {
          class2type["[object " + name + "]"] = name.toLowerCase();
        }
      );
      function isArrayLike(obj) {
        var length = !!obj && "length" in obj && obj.length, type = toType(obj);
        if (isFunction(obj) || isWindow(obj)) {
          return false;
        }
        return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
      }
      function nodeName(elem, name) {
        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
      }
      var pop = arr.pop;
      var sort = arr.sort;
      var splice = arr.splice;
      var whitespace = "[\\x20\\t\\r\\n\\f]";
      var rtrimCSS = new RegExp(
        "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
        "g"
      );
      jQuery.contains = function(a, b) {
        var bup = b && b.parentNode;
        return a === bup || !!(bup && bup.nodeType === 1 && // Support: IE 9 - 11+
        // IE doesn't have `contains` on SVG.
        (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
      };
      var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
      function fcssescape(ch, asCodePoint) {
        if (asCodePoint) {
          if (ch === "\0") {
            return "\uFFFD";
          }
          return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
        }
        return "\\" + ch;
      }
      jQuery.escapeSelector = function(sel) {
        return (sel + "").replace(rcssescape, fcssescape);
      };
      var preferredDoc = document2, pushNative = push;
      (function() {
        var i, Expr, outermostContext, sortInput, hasDuplicate, push2 = pushNative, document3, documentElement2, documentIsHTML, rbuggyQSA, matches, expando = jQuery.expando, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), sortOrder = function(a, b) {
          if (a === b) {
            hasDuplicate = true;
          }
          return 0;
        }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
        "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + attributes + ")*)|.*)\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rleadingCombinator = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rdescend = new RegExp(whitespace + "|>"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
          ID: new RegExp("^#(" + identifier + ")"),
          CLASS: new RegExp("^\\.(" + identifier + ")"),
          TAG: new RegExp("^(" + identifier + "|[*])"),
          ATTR: new RegExp("^" + attributes),
          PSEUDO: new RegExp("^" + pseudos),
          CHILD: new RegExp(
            "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)",
            "i"
          ),
          bool: new RegExp("^(?:" + booleans + ")$", "i"),
          // For use in libraries implementing .is()
          // We use this for POS matching in `select`
          needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
        }, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rquickExpr2 = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g"), funescape = function(escape, nonHex) {
          var high = "0x" + escape.slice(1) - 65536;
          if (nonHex) {
            return nonHex;
          }
          return high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
        }, unloadHandler = function() {
          setDocument();
        }, inDisabledFieldset = addCombinator(
          function(elem) {
            return elem.disabled === true && nodeName(elem, "fieldset");
          },
          { dir: "parentNode", next: "legend" }
        );
        function safeActiveElement() {
          try {
            return document3.activeElement;
          } catch (err) {
          }
        }
        try {
          push2.apply(
            arr = slice.call(preferredDoc.childNodes),
            preferredDoc.childNodes
          );
          arr[preferredDoc.childNodes.length].nodeType;
        } catch (e) {
          push2 = {
            apply: function(target, els) {
              pushNative.apply(target, slice.call(els));
            },
            call: function(target) {
              pushNative.apply(target, slice.call(arguments, 1));
            }
          };
        }
        function find(selector, context, results, seed) {
          var m, i2, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
          results = results || [];
          if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
            return results;
          }
          if (!seed) {
            setDocument(context);
            context = context || document3;
            if (documentIsHTML) {
              if (nodeType !== 11 && (match = rquickExpr2.exec(selector))) {
                if (m = match[1]) {
                  if (nodeType === 9) {
                    if (elem = context.getElementById(m)) {
                      if (elem.id === m) {
                        push2.call(results, elem);
                        return results;
                      }
                    } else {
                      return results;
                    }
                  } else {
                    if (newContext && (elem = newContext.getElementById(m)) && find.contains(context, elem) && elem.id === m) {
                      push2.call(results, elem);
                      return results;
                    }
                  }
                } else if (match[2]) {
                  push2.apply(results, context.getElementsByTagName(selector));
                  return results;
                } else if ((m = match[3]) && context.getElementsByClassName) {
                  push2.apply(results, context.getElementsByClassName(m));
                  return results;
                }
              }
              if (!nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                newSelector = selector;
                newContext = context;
                if (nodeType === 1 && (rdescend.test(selector) || rleadingCombinator.test(selector))) {
                  newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                  if (newContext != context || !support.scope) {
                    if (nid = context.getAttribute("id")) {
                      nid = jQuery.escapeSelector(nid);
                    } else {
                      context.setAttribute("id", nid = expando);
                    }
                  }
                  groups = tokenize(selector);
                  i2 = groups.length;
                  while (i2--) {
                    groups[i2] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i2]);
                  }
                  newSelector = groups.join(",");
                }
                try {
                  push2.apply(
                    results,
                    newContext.querySelectorAll(newSelector)
                  );
                  return results;
                } catch (qsaError) {
                  nonnativeSelectorCache(selector, true);
                } finally {
                  if (nid === expando) {
                    context.removeAttribute("id");
                  }
                }
              }
            }
          }
          return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
        }
        function createCache() {
          var keys = [];
          function cache(key, value) {
            if (keys.push(key + " ") > Expr.cacheLength) {
              delete cache[keys.shift()];
            }
            return cache[key + " "] = value;
          }
          return cache;
        }
        function markFunction(fn) {
          fn[expando] = true;
          return fn;
        }
        function assert(fn) {
          var el = document3.createElement("fieldset");
          try {
            return !!fn(el);
          } catch (e) {
            return false;
          } finally {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
            el = null;
          }
        }
        function createInputPseudo(type) {
          return function(elem) {
            return nodeName(elem, "input") && elem.type === type;
          };
        }
        function createButtonPseudo(type) {
          return function(elem) {
            return (nodeName(elem, "input") || nodeName(elem, "button")) && elem.type === type;
          };
        }
        function createDisabledPseudo(disabled) {
          return function(elem) {
            if ("form" in elem) {
              if (elem.parentNode && elem.disabled === false) {
                if ("label" in elem) {
                  if ("label" in elem.parentNode) {
                    return elem.parentNode.disabled === disabled;
                  } else {
                    return elem.disabled === disabled;
                  }
                }
                return elem.isDisabled === disabled || // Where there is no isDisabled, check manually
                elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
              }
              return elem.disabled === disabled;
            } else if ("label" in elem) {
              return elem.disabled === disabled;
            }
            return false;
          };
        }
        function createPositionalPseudo(fn) {
          return markFunction(function(argument) {
            argument = +argument;
            return markFunction(function(seed, matches2) {
              var j, matchIndexes = fn([], seed.length, argument), i2 = matchIndexes.length;
              while (i2--) {
                if (seed[j = matchIndexes[i2]]) {
                  seed[j] = !(matches2[j] = seed[j]);
                }
              }
            });
          });
        }
        function testContext(context) {
          return context && typeof context.getElementsByTagName !== "undefined" && context;
        }
        function setDocument(node) {
          var subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
          if (doc == document3 || doc.nodeType !== 9 || !doc.documentElement) {
            return document3;
          }
          document3 = doc;
          documentElement2 = document3.documentElement;
          documentIsHTML = !jQuery.isXMLDoc(document3);
          matches = documentElement2.matches || documentElement2.webkitMatchesSelector || documentElement2.msMatchesSelector;
          if (documentElement2.msMatchesSelector && // Support: IE 11+, Edge 17 - 18+
          // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
          // two documents; shallow comparisons work.
          // eslint-disable-next-line eqeqeq
          preferredDoc != document3 && (subWindow = document3.defaultView) && subWindow.top !== subWindow) {
            subWindow.addEventListener("unload", unloadHandler);
          }
          support.getById = assert(function(el) {
            documentElement2.appendChild(el).id = jQuery.expando;
            return !document3.getElementsByName || !document3.getElementsByName(jQuery.expando).length;
          });
          support.disconnectedMatch = assert(function(el) {
            return matches.call(el, "*");
          });
          support.scope = assert(function() {
            return document3.querySelectorAll(":scope");
          });
          support.cssHas = assert(function() {
            try {
              document3.querySelector(":has(*,:jqfake)");
              return false;
            } catch (e) {
              return true;
            }
          });
          if (support.getById) {
            Expr.filter.ID = function(id) {
              var attrId = id.replace(runescape, funescape);
              return function(elem) {
                return elem.getAttribute("id") === attrId;
              };
            };
            Expr.find.ID = function(id, context) {
              if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                var elem = context.getElementById(id);
                return elem ? [elem] : [];
              }
            };
          } else {
            Expr.filter.ID = function(id) {
              var attrId = id.replace(runescape, funescape);
              return function(elem) {
                var node2 = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return node2 && node2.value === attrId;
              };
            };
            Expr.find.ID = function(id, context) {
              if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                var node2, i2, elems, elem = context.getElementById(id);
                if (elem) {
                  node2 = elem.getAttributeNode("id");
                  if (node2 && node2.value === id) {
                    return [elem];
                  }
                  elems = context.getElementsByName(id);
                  i2 = 0;
                  while (elem = elems[i2++]) {
                    node2 = elem.getAttributeNode("id");
                    if (node2 && node2.value === id) {
                      return [elem];
                    }
                  }
                }
                return [];
              }
            };
          }
          Expr.find.TAG = function(tag, context) {
            if (typeof context.getElementsByTagName !== "undefined") {
              return context.getElementsByTagName(tag);
            } else {
              return context.querySelectorAll(tag);
            }
          };
          Expr.find.CLASS = function(className, context) {
            if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
              return context.getElementsByClassName(className);
            }
          };
          rbuggyQSA = [];
          assert(function(el) {
            var input;
            documentElement2.appendChild(el).innerHTML = "<a id='" + expando + "' href='' disabled='disabled'></a><select id='" + expando + "-\r\\' disabled='disabled'><option selected=''></option></select>";
            if (!el.querySelectorAll("[selected]").length) {
              rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
            }
            if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
              rbuggyQSA.push("~=");
            }
            if (!el.querySelectorAll("a#" + expando + "+*").length) {
              rbuggyQSA.push(".#.+[+~]");
            }
            if (!el.querySelectorAll(":checked").length) {
              rbuggyQSA.push(":checked");
            }
            input = document3.createElement("input");
            input.setAttribute("type", "hidden");
            el.appendChild(input).setAttribute("name", "D");
            documentElement2.appendChild(el).disabled = true;
            if (el.querySelectorAll(":disabled").length !== 2) {
              rbuggyQSA.push(":enabled", ":disabled");
            }
            input = document3.createElement("input");
            input.setAttribute("name", "");
            el.appendChild(input);
            if (!el.querySelectorAll("[name='']").length) {
              rbuggyQSA.push("\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + `*(?:''|"")`);
            }
          });
          if (!support.cssHas) {
            rbuggyQSA.push(":has");
          }
          rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
          sortOrder = function(a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }
            var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
            if (compare) {
              return compare;
            }
            compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : (
              // Otherwise we know they are disconnected
              1
            );
            if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
              if (a === document3 || a.ownerDocument == preferredDoc && find.contains(preferredDoc, a)) {
                return -1;
              }
              if (b === document3 || b.ownerDocument == preferredDoc && find.contains(preferredDoc, b)) {
                return 1;
              }
              return sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
            }
            return compare & 4 ? -1 : 1;
          };
          return document3;
        }
        find.matches = function(expr, elements) {
          return find(expr, null, null, elements);
        };
        find.matchesSelector = function(elem, expr) {
          setDocument(elem);
          if (documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
            try {
              var ret = matches.call(elem, expr);
              if (ret || support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
              // fragment in IE 9
              elem.document && elem.document.nodeType !== 11) {
                return ret;
              }
            } catch (e) {
              nonnativeSelectorCache(expr, true);
            }
          }
          return find(expr, document3, null, [elem]).length > 0;
        };
        find.contains = function(context, elem) {
          if ((context.ownerDocument || context) != document3) {
            setDocument(context);
          }
          return jQuery.contains(context, elem);
        };
        find.attr = function(elem, name) {
          if ((elem.ownerDocument || elem) != document3) {
            setDocument(elem);
          }
          var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : void 0;
          if (val !== void 0) {
            return val;
          }
          return elem.getAttribute(name);
        };
        find.error = function(msg) {
          throw new Error("Syntax error, unrecognized expression: " + msg);
        };
        jQuery.uniqueSort = function(results) {
          var elem, duplicates = [], j = 0, i2 = 0;
          hasDuplicate = !support.sortStable;
          sortInput = !support.sortStable && slice.call(results, 0);
          sort.call(results, sortOrder);
          if (hasDuplicate) {
            while (elem = results[i2++]) {
              if (elem === results[i2]) {
                j = duplicates.push(i2);
              }
            }
            while (j--) {
              splice.call(results, duplicates[j], 1);
            }
          }
          sortInput = null;
          return results;
        };
        jQuery.fn.uniqueSort = function() {
          return this.pushStack(jQuery.uniqueSort(slice.apply(this)));
        };
        Expr = jQuery.expr = {
          // Can be adjusted by the user
          cacheLength: 50,
          createPseudo: markFunction,
          match: matchExpr,
          attrHandle: {},
          find: {},
          relative: {
            ">": { dir: "parentNode", first: true },
            " ": { dir: "parentNode" },
            "+": { dir: "previousSibling", first: true },
            "~": { dir: "previousSibling" }
          },
          preFilter: {
            ATTR: function(match) {
              match[1] = match[1].replace(runescape, funescape);
              match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
              if (match[2] === "~=") {
                match[3] = " " + match[3] + " ";
              }
              return match.slice(0, 4);
            },
            CHILD: function(match) {
              match[1] = match[1].toLowerCase();
              if (match[1].slice(0, 3) === "nth") {
                if (!match[3]) {
                  find.error(match[0]);
                }
                match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                match[5] = +(match[7] + match[8] || match[3] === "odd");
              } else if (match[3]) {
                find.error(match[0]);
              }
              return match;
            },
            PSEUDO: function(match) {
              var excess, unquoted = !match[6] && match[2];
              if (matchExpr.CHILD.test(match[0])) {
                return null;
              }
              if (match[3]) {
                match[2] = match[4] || match[5] || "";
              } else if (unquoted && rpseudo.test(unquoted) && // Get excess from tokenize (recursively)
              (excess = tokenize(unquoted, true)) && // advance to the next closing parenthesis
              (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                match[0] = match[0].slice(0, excess);
                match[2] = unquoted.slice(0, excess);
              }
              return match.slice(0, 3);
            }
          },
          filter: {
            TAG: function(nodeNameSelector) {
              var expectedNodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
              return nodeNameSelector === "*" ? function() {
                return true;
              } : function(elem) {
                return nodeName(elem, expectedNodeName);
              };
            },
            CLASS: function(className) {
              var pattern = classCache[className + " "];
              return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                return pattern.test(
                  typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || ""
                );
              });
            },
            ATTR: function(name, operator, check) {
              return function(elem) {
                var result = find.attr(elem, name);
                if (result == null) {
                  return operator === "!=";
                }
                if (!operator) {
                  return true;
                }
                result += "";
                if (operator === "=") {
                  return result === check;
                }
                if (operator === "!=") {
                  return result !== check;
                }
                if (operator === "^=") {
                  return check && result.indexOf(check) === 0;
                }
                if (operator === "*=") {
                  return check && result.indexOf(check) > -1;
                }
                if (operator === "$=") {
                  return check && result.slice(-check.length) === check;
                }
                if (operator === "~=") {
                  return (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1;
                }
                if (operator === "|=") {
                  return result === check || result.slice(0, check.length + 1) === check + "-";
                }
                return false;
              };
            },
            CHILD: function(type, what, _argument, first, last) {
              var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
              return first === 1 && last === 0 ? (
                // Shortcut for :nth-*(n)
                function(elem) {
                  return !!elem.parentNode;
                }
              ) : function(elem, _context, xml) {
                var cache, outerCache, node, nodeIndex, start, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                if (parent) {
                  if (simple) {
                    while (dir2) {
                      node = elem;
                      while (node = node[dir2]) {
                        if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                          return false;
                        }
                      }
                      start = dir2 = type === "only" && !start && "nextSibling";
                    }
                    return true;
                  }
                  start = [forward ? parent.firstChild : parent.lastChild];
                  if (forward && useCache) {
                    outerCache = parent[expando] || (parent[expando] = {});
                    cache = outerCache[type] || [];
                    nodeIndex = cache[0] === dirruns && cache[1];
                    diff = nodeIndex && cache[2];
                    node = nodeIndex && parent.childNodes[nodeIndex];
                    while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                    (diff = nodeIndex = 0) || start.pop()) {
                      if (node.nodeType === 1 && ++diff && node === elem) {
                        outerCache[type] = [dirruns, nodeIndex, diff];
                        break;
                      }
                    }
                  } else {
                    if (useCache) {
                      outerCache = elem[expando] || (elem[expando] = {});
                      cache = outerCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex;
                    }
                    if (diff === false) {
                      while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start.pop()) {
                        if ((ofType ? nodeName(node, name) : node.nodeType === 1) && ++diff) {
                          if (useCache) {
                            outerCache = node[expando] || (node[expando] = {});
                            outerCache[type] = [dirruns, diff];
                          }
                          if (node === elem) {
                            break;
                          }
                        }
                      }
                    }
                  }
                  diff -= last;
                  return diff === first || diff % first === 0 && diff / first >= 0;
                }
              };
            },
            PSEUDO: function(pseudo, argument) {
              var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || find.error("unsupported pseudo: " + pseudo);
              if (fn[expando]) {
                return fn(argument);
              }
              if (fn.length > 1) {
                args = [pseudo, pseudo, "", argument];
                return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches2) {
                  var idx, matched = fn(seed, argument), i2 = matched.length;
                  while (i2--) {
                    idx = indexOf.call(seed, matched[i2]);
                    seed[idx] = !(matches2[idx] = matched[i2]);
                  }
                }) : function(elem) {
                  return fn(elem, 0, args);
                };
              }
              return fn;
            }
          },
          pseudos: {
            // Potentially complex pseudos
            not: markFunction(function(selector) {
              var input = [], results = [], matcher = compile(selector.replace(rtrimCSS, "$1"));
              return matcher[expando] ? markFunction(function(seed, matches2, _context, xml) {
                var elem, unmatched = matcher(seed, null, xml, []), i2 = seed.length;
                while (i2--) {
                  if (elem = unmatched[i2]) {
                    seed[i2] = !(matches2[i2] = elem);
                  }
                }
              }) : function(elem, _context, xml) {
                input[0] = elem;
                matcher(input, null, xml, results);
                input[0] = null;
                return !results.pop();
              };
            }),
            has: markFunction(function(selector) {
              return function(elem) {
                return find(selector, elem).length > 0;
              };
            }),
            contains: markFunction(function(text) {
              text = text.replace(runescape, funescape);
              return function(elem) {
                return (elem.textContent || jQuery.text(elem)).indexOf(text) > -1;
              };
            }),
            // "Whether an element is represented by a :lang() selector
            // is based solely on the element's language value
            // being equal to the identifier C,
            // or beginning with the identifier C immediately followed by "-".
            // The matching of C against the element's language value is performed case-insensitively.
            // The identifier C does not have to be a valid language name."
            // https://www.w3.org/TR/selectors/#lang-pseudo
            lang: markFunction(function(lang) {
              if (!ridentifier.test(lang || "")) {
                find.error("unsupported lang: " + lang);
              }
              lang = lang.replace(runescape, funescape).toLowerCase();
              return function(elem) {
                var elemLang;
                do {
                  if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                    elemLang = elemLang.toLowerCase();
                    return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                  }
                } while ((elem = elem.parentNode) && elem.nodeType === 1);
                return false;
              };
            }),
            // Miscellaneous
            target: function(elem) {
              var hash = window2.location && window2.location.hash;
              return hash && hash.slice(1) === elem.id;
            },
            root: function(elem) {
              return elem === documentElement2;
            },
            focus: function(elem) {
              return elem === safeActiveElement() && document3.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
            },
            // Boolean properties
            enabled: createDisabledPseudo(false),
            disabled: createDisabledPseudo(true),
            checked: function(elem) {
              return nodeName(elem, "input") && !!elem.checked || nodeName(elem, "option") && !!elem.selected;
            },
            selected: function(elem) {
              if (elem.parentNode) {
                elem.parentNode.selectedIndex;
              }
              return elem.selected === true;
            },
            // Contents
            empty: function(elem) {
              for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                if (elem.nodeType < 6) {
                  return false;
                }
              }
              return true;
            },
            parent: function(elem) {
              return !Expr.pseudos.empty(elem);
            },
            // Element/input types
            header: function(elem) {
              return rheader.test(elem.nodeName);
            },
            input: function(elem) {
              return rinputs.test(elem.nodeName);
            },
            button: function(elem) {
              return nodeName(elem, "input") && elem.type === "button" || nodeName(elem, "button");
            },
            text: function(elem) {
              var attr;
              return nodeName(elem, "input") && elem.type === "text" && // Support: IE <10 only
              // New HTML5 attribute values (e.g., "search") appear
              // with elem.type === "text"
              ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
            },
            // Position-in-collection
            first: createPositionalPseudo(function() {
              return [0];
            }),
            last: createPositionalPseudo(function(_matchIndexes, length) {
              return [length - 1];
            }),
            eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
              return [argument < 0 ? argument + length : argument];
            }),
            even: createPositionalPseudo(function(matchIndexes, length) {
              var i2 = 0;
              for (; i2 < length; i2 += 2) {
                matchIndexes.push(i2);
              }
              return matchIndexes;
            }),
            odd: createPositionalPseudo(function(matchIndexes, length) {
              var i2 = 1;
              for (; i2 < length; i2 += 2) {
                matchIndexes.push(i2);
              }
              return matchIndexes;
            }),
            lt: createPositionalPseudo(function(matchIndexes, length, argument) {
              var i2;
              if (argument < 0) {
                i2 = argument + length;
              } else if (argument > length) {
                i2 = length;
              } else {
                i2 = argument;
              }
              for (; --i2 >= 0; ) {
                matchIndexes.push(i2);
              }
              return matchIndexes;
            }),
            gt: createPositionalPseudo(function(matchIndexes, length, argument) {
              var i2 = argument < 0 ? argument + length : argument;
              for (; ++i2 < length; ) {
                matchIndexes.push(i2);
              }
              return matchIndexes;
            })
          }
        };
        Expr.pseudos.nth = Expr.pseudos.eq;
        for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
          Expr.pseudos[i] = createInputPseudo(i);
        }
        for (i in { submit: true, reset: true }) {
          Expr.pseudos[i] = createButtonPseudo(i);
        }
        function setFilters() {
        }
        setFilters.prototype = Expr.filters = Expr.pseudos;
        Expr.setFilters = new setFilters();
        function tokenize(selector, parseOnly) {
          var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
          if (cached) {
            return parseOnly ? 0 : cached.slice(0);
          }
          soFar = selector;
          groups = [];
          preFilters = Expr.preFilter;
          while (soFar) {
            if (!matched || (match = rcomma.exec(soFar))) {
              if (match) {
                soFar = soFar.slice(match[0].length) || soFar;
              }
              groups.push(tokens = []);
            }
            matched = false;
            if (match = rleadingCombinator.exec(soFar)) {
              matched = match.shift();
              tokens.push({
                value: matched,
                // Cast descendant combinators to space
                type: match[0].replace(rtrimCSS, " ")
              });
              soFar = soFar.slice(matched.length);
            }
            for (type in Expr.filter) {
              if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  type,
                  matches: match
                });
                soFar = soFar.slice(matched.length);
              }
            }
            if (!matched) {
              break;
            }
          }
          if (parseOnly) {
            return soFar.length;
          }
          return soFar ? find.error(selector) : (
            // Cache the tokens
            tokenCache(selector, groups).slice(0)
          );
        }
        function toSelector(tokens) {
          var i2 = 0, len = tokens.length, selector = "";
          for (; i2 < len; i2++) {
            selector += tokens[i2].value;
          }
          return selector;
        }
        function addCombinator(matcher, combinator, base) {
          var dir2 = combinator.dir, skip = combinator.next, key = skip || dir2, checkNonElements = base && key === "parentNode", doneName = done++;
          return combinator.first ? (
            // Check against closest ancestor/preceding element
            function(elem, context, xml) {
              while (elem = elem[dir2]) {
                if (elem.nodeType === 1 || checkNonElements) {
                  return matcher(elem, context, xml);
                }
              }
              return false;
            }
          ) : (
            // Check against all ancestor/preceding elements
            function(elem, context, xml) {
              var oldCache, outerCache, newCache = [dirruns, doneName];
              if (xml) {
                while (elem = elem[dir2]) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    if (matcher(elem, context, xml)) {
                      return true;
                    }
                  }
                }
              } else {
                while (elem = elem[dir2]) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    outerCache = elem[expando] || (elem[expando] = {});
                    if (skip && nodeName(elem, skip)) {
                      elem = elem[dir2] || elem;
                    } else if ((oldCache = outerCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                      return newCache[2] = oldCache[2];
                    } else {
                      outerCache[key] = newCache;
                      if (newCache[2] = matcher(elem, context, xml)) {
                        return true;
                      }
                    }
                  }
                }
              }
              return false;
            }
          );
        }
        function elementMatcher(matchers) {
          return matchers.length > 1 ? function(elem, context, xml) {
            var i2 = matchers.length;
            while (i2--) {
              if (!matchers[i2](elem, context, xml)) {
                return false;
              }
            }
            return true;
          } : matchers[0];
        }
        function multipleContexts(selector, contexts, results) {
          var i2 = 0, len = contexts.length;
          for (; i2 < len; i2++) {
            find(selector, contexts[i2], results);
          }
          return results;
        }
        function condense(unmatched, map, filter, context, xml) {
          var elem, newUnmatched = [], i2 = 0, len = unmatched.length, mapped = map != null;
          for (; i2 < len; i2++) {
            if (elem = unmatched[i2]) {
              if (!filter || filter(elem, context, xml)) {
                newUnmatched.push(elem);
                if (mapped) {
                  map.push(i2);
                }
              }
            }
          }
          return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
          if (postFilter && !postFilter[expando]) {
            postFilter = setMatcher(postFilter);
          }
          if (postFinder && !postFinder[expando]) {
            postFinder = setMatcher(postFinder, postSelector);
          }
          return markFunction(function(seed, results, context, xml) {
            var temp, i2, elem, matcherOut, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(
              selector || "*",
              context.nodeType ? [context] : context,
              []
            ), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems;
            if (matcher) {
              matcherOut = postFinder || (seed ? preFilter : preexisting || postFilter) ? (
                // ...intermediate processing is necessary
                []
              ) : (
                // ...otherwise use results directly
                results
              );
              matcher(matcherIn, matcherOut, context, xml);
            } else {
              matcherOut = matcherIn;
            }
            if (postFilter) {
              temp = condense(matcherOut, postMap);
              postFilter(temp, [], context, xml);
              i2 = temp.length;
              while (i2--) {
                if (elem = temp[i2]) {
                  matcherOut[postMap[i2]] = !(matcherIn[postMap[i2]] = elem);
                }
              }
            }
            if (seed) {
              if (postFinder || preFilter) {
                if (postFinder) {
                  temp = [];
                  i2 = matcherOut.length;
                  while (i2--) {
                    if (elem = matcherOut[i2]) {
                      temp.push(matcherIn[i2] = elem);
                    }
                  }
                  postFinder(null, matcherOut = [], temp, xml);
                }
                i2 = matcherOut.length;
                while (i2--) {
                  if ((elem = matcherOut[i2]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i2]) > -1) {
                    seed[temp] = !(results[temp] = elem);
                  }
                }
              }
            } else {
              matcherOut = condense(
                matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut
              );
              if (postFinder) {
                postFinder(null, results, matcherOut, xml);
              } else {
                push2.apply(results, matcherOut);
              }
            }
          });
        }
        function matcherFromTokens(tokens) {
          var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i2 = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
            return elem === checkContext;
          }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
            return indexOf.call(checkContext, elem) > -1;
          }, implicitRelative, true), matchers = [function(elem, context, xml) {
            var ret = !leadingRelative && (xml || context != outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
            checkContext = null;
            return ret;
          }];
          for (; i2 < len; i2++) {
            if (matcher = Expr.relative[tokens[i2].type]) {
              matchers = [addCombinator(elementMatcher(matchers), matcher)];
            } else {
              matcher = Expr.filter[tokens[i2].type].apply(null, tokens[i2].matches);
              if (matcher[expando]) {
                j = ++i2;
                for (; j < len; j++) {
                  if (Expr.relative[tokens[j].type]) {
                    break;
                  }
                }
                return setMatcher(
                  i2 > 1 && elementMatcher(matchers),
                  i2 > 1 && toSelector(
                    // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                    tokens.slice(0, i2 - 1).concat({ value: tokens[i2 - 2].type === " " ? "*" : "" })
                  ).replace(rtrimCSS, "$1"),
                  matcher,
                  i2 < j && matcherFromTokens(tokens.slice(i2, j)),
                  j < len && matcherFromTokens(tokens = tokens.slice(j)),
                  j < len && toSelector(tokens)
                );
              }
              matchers.push(matcher);
            }
          }
          return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
          var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
            var elem, j, matcher, matchedCount = 0, i2 = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
            if (outermost) {
              outermostContext = context == document3 || context || outermost;
            }
            for (; i2 !== len && (elem = elems[i2]) != null; i2++) {
              if (byElement && elem) {
                j = 0;
                if (!context && elem.ownerDocument != document3) {
                  setDocument(elem);
                  xml = !documentIsHTML;
                }
                while (matcher = elementMatchers[j++]) {
                  if (matcher(elem, context || document3, xml)) {
                    push2.call(results, elem);
                    break;
                  }
                }
                if (outermost) {
                  dirruns = dirrunsUnique;
                }
              }
              if (bySet) {
                if (elem = !matcher && elem) {
                  matchedCount--;
                }
                if (seed) {
                  unmatched.push(elem);
                }
              }
            }
            matchedCount += i2;
            if (bySet && i2 !== matchedCount) {
              j = 0;
              while (matcher = setMatchers[j++]) {
                matcher(unmatched, setMatched, context, xml);
              }
              if (seed) {
                if (matchedCount > 0) {
                  while (i2--) {
                    if (!(unmatched[i2] || setMatched[i2])) {
                      setMatched[i2] = pop.call(results);
                    }
                  }
                }
                setMatched = condense(setMatched);
              }
              push2.apply(results, setMatched);
              if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                jQuery.uniqueSort(results);
              }
            }
            if (outermost) {
              dirruns = dirrunsUnique;
              outermostContext = contextBackup;
            }
            return unmatched;
          };
          return bySet ? markFunction(superMatcher) : superMatcher;
        }
        function compile(selector, match) {
          var i2, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
          if (!cached) {
            if (!match) {
              match = tokenize(selector);
            }
            i2 = match.length;
            while (i2--) {
              cached = matcherFromTokens(match[i2]);
              if (cached[expando]) {
                setMatchers.push(cached);
              } else {
                elementMatchers.push(cached);
              }
            }
            cached = compilerCache(
              selector,
              matcherFromGroupMatchers(elementMatchers, setMatchers)
            );
            cached.selector = selector;
          }
          return cached;
        }
        function select(selector, context, results, seed) {
          var i2, tokens, token, type, find2, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
          results = results || [];
          if (match.length === 1) {
            tokens = match[0] = match[0].slice(0);
            if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
              context = (Expr.find.ID(
                token.matches[0].replace(runescape, funescape),
                context
              ) || [])[0];
              if (!context) {
                return results;
              } else if (compiled) {
                context = context.parentNode;
              }
              selector = selector.slice(tokens.shift().value.length);
            }
            i2 = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
            while (i2--) {
              token = tokens[i2];
              if (Expr.relative[type = token.type]) {
                break;
              }
              if (find2 = Expr.find[type]) {
                if (seed = find2(
                  token.matches[0].replace(runescape, funescape),
                  rsibling.test(tokens[0].type) && testContext(context.parentNode) || context
                )) {
                  tokens.splice(i2, 1);
                  selector = seed.length && toSelector(tokens);
                  if (!selector) {
                    push2.apply(results, seed);
                    return results;
                  }
                  break;
                }
              }
            }
          }
          (compiled || compile(selector, match))(
            seed,
            context,
            !documentIsHTML,
            results,
            !context || rsibling.test(selector) && testContext(context.parentNode) || context
          );
          return results;
        }
        support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
        setDocument();
        support.sortDetached = assert(function(el) {
          return el.compareDocumentPosition(document3.createElement("fieldset")) & 1;
        });
        jQuery.find = find;
        jQuery.expr[":"] = jQuery.expr.pseudos;
        jQuery.unique = jQuery.uniqueSort;
        find.compile = compile;
        find.select = select;
        find.setDocument = setDocument;
        find.tokenize = tokenize;
        find.escape = jQuery.escapeSelector;
        find.getText = jQuery.text;
        find.isXML = jQuery.isXMLDoc;
        find.selectors = jQuery.expr;
        find.support = jQuery.support;
        find.uniqueSort = jQuery.uniqueSort;
      })();
      var dir = function(elem, dir2, until) {
        var matched = [], truncate = until !== void 0;
        while ((elem = elem[dir2]) && elem.nodeType !== 9) {
          if (elem.nodeType === 1) {
            if (truncate && jQuery(elem).is(until)) {
              break;
            }
            matched.push(elem);
          }
        }
        return matched;
      };
      var siblings = function(n, elem) {
        var matched = [];
        for (; n; n = n.nextSibling) {
          if (n.nodeType === 1 && n !== elem) {
            matched.push(n);
          }
        }
        return matched;
      };
      var rneedsContext = jQuery.expr.match.needsContext;
      var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
      function winnow(elements, qualifier, not) {
        if (isFunction(qualifier)) {
          return jQuery.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not;
          });
        }
        if (qualifier.nodeType) {
          return jQuery.grep(elements, function(elem) {
            return elem === qualifier !== not;
          });
        }
        if (typeof qualifier !== "string") {
          return jQuery.grep(elements, function(elem) {
            return indexOf.call(qualifier, elem) > -1 !== not;
          });
        }
        return jQuery.filter(qualifier, elements, not);
      }
      jQuery.filter = function(expr, elems, not) {
        var elem = elems[0];
        if (not) {
          expr = ":not(" + expr + ")";
        }
        if (elems.length === 1 && elem.nodeType === 1) {
          return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
        }
        return jQuery.find.matches(expr, jQuery.grep(elems, function(elem2) {
          return elem2.nodeType === 1;
        }));
      };
      jQuery.fn.extend({
        find: function(selector) {
          var i, ret, len = this.length, self = this;
          if (typeof selector !== "string") {
            return this.pushStack(jQuery(selector).filter(function() {
              for (i = 0; i < len; i++) {
                if (jQuery.contains(self[i], this)) {
                  return true;
                }
              }
            }));
          }
          ret = this.pushStack([]);
          for (i = 0; i < len; i++) {
            jQuery.find(selector, self[i], ret);
          }
          return len > 1 ? jQuery.uniqueSort(ret) : ret;
        },
        filter: function(selector) {
          return this.pushStack(winnow(this, selector || [], false));
        },
        not: function(selector) {
          return this.pushStack(winnow(this, selector || [], true));
        },
        is: function(selector) {
          return !!winnow(
            this,
            // If this is a positional/relative selector, check membership in the returned set
            // so $("p:first").is("p:last") won't return true for a doc with two "p".
            typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [],
            false
          ).length;
        }
      });
      var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery.fn.init = function(selector, context, root) {
        var match, elem;
        if (!selector) {
          return this;
        }
        root = root || rootjQuery;
        if (typeof selector === "string") {
          if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
            match = [null, selector, null];
          } else {
            match = rquickExpr.exec(selector);
          }
          if (match && (match[1] || !context)) {
            if (match[1]) {
              context = context instanceof jQuery ? context[0] : context;
              jQuery.merge(this, jQuery.parseHTML(
                match[1],
                context && context.nodeType ? context.ownerDocument || context : document2,
                true
              ));
              if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                for (match in context) {
                  if (isFunction(this[match])) {
                    this[match](context[match]);
                  } else {
                    this.attr(match, context[match]);
                  }
                }
              }
              return this;
            } else {
              elem = document2.getElementById(match[2]);
              if (elem) {
                this[0] = elem;
                this.length = 1;
              }
              return this;
            }
          } else if (!context || context.jquery) {
            return (context || root).find(selector);
          } else {
            return this.constructor(context).find(selector);
          }
        } else if (selector.nodeType) {
          this[0] = selector;
          this.length = 1;
          return this;
        } else if (isFunction(selector)) {
          return root.ready !== void 0 ? root.ready(selector) : (
            // Execute immediately if ready is not present
            selector(jQuery)
          );
        }
        return jQuery.makeArray(selector, this);
      };
      init.prototype = jQuery.fn;
      rootjQuery = jQuery(document2);
      var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
        children: true,
        contents: true,
        next: true,
        prev: true
      };
      jQuery.fn.extend({
        has: function(target) {
          var targets = jQuery(target, this), l = targets.length;
          return this.filter(function() {
            var i = 0;
            for (; i < l; i++) {
              if (jQuery.contains(this, targets[i])) {
                return true;
              }
            }
          });
        },
        closest: function(selectors, context) {
          var cur, i = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery(selectors);
          if (!rneedsContext.test(selectors)) {
            for (; i < l; i++) {
              for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : (
                  // Don't pass non-elements to jQuery#find
                  cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors)
                ))) {
                  matched.push(cur);
                  break;
                }
              }
            }
          }
          return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
        },
        // Determine the position of an element within the set
        index: function(elem) {
          if (!elem) {
            return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
          }
          if (typeof elem === "string") {
            return indexOf.call(jQuery(elem), this[0]);
          }
          return indexOf.call(
            this,
            // If it receives a jQuery object, the first element is used
            elem.jquery ? elem[0] : elem
          );
        },
        add: function(selector, context) {
          return this.pushStack(
            jQuery.uniqueSort(
              jQuery.merge(this.get(), jQuery(selector, context))
            )
          );
        },
        addBack: function(selector) {
          return this.add(
            selector == null ? this.prevObject : this.prevObject.filter(selector)
          );
        }
      });
      function sibling(cur, dir2) {
        while ((cur = cur[dir2]) && cur.nodeType !== 1) {
        }
        return cur;
      }
      jQuery.each({
        parent: function(elem) {
          var parent = elem.parentNode;
          return parent && parent.nodeType !== 11 ? parent : null;
        },
        parents: function(elem) {
          return dir(elem, "parentNode");
        },
        parentsUntil: function(elem, _i, until) {
          return dir(elem, "parentNode", until);
        },
        next: function(elem) {
          return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
          return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
          return dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
          return dir(elem, "previousSibling");
        },
        nextUntil: function(elem, _i, until) {
          return dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, _i, until) {
          return dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
          return siblings((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
          return siblings(elem.firstChild);
        },
        contents: function(elem) {
          if (elem.contentDocument != null && // Support: IE 11+
          // <object> elements with no `data` attribute has an object
          // `contentDocument` with a `null` prototype.
          getProto(elem.contentDocument)) {
            return elem.contentDocument;
          }
          if (nodeName(elem, "template")) {
            elem = elem.content || elem;
          }
          return jQuery.merge([], elem.childNodes);
        }
      }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
          var matched = jQuery.map(this, fn, until);
          if (name.slice(-5) !== "Until") {
            selector = until;
          }
          if (selector && typeof selector === "string") {
            matched = jQuery.filter(selector, matched);
          }
          if (this.length > 1) {
            if (!guaranteedUnique[name]) {
              jQuery.uniqueSort(matched);
            }
            if (rparentsprev.test(name)) {
              matched.reverse();
            }
          }
          return this.pushStack(matched);
        };
      });
      var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
      function createOptions(options) {
        var object = {};
        jQuery.each(options.match(rnothtmlwhite) || [], function(_, flag) {
          object[flag] = true;
        });
        return object;
      }
      jQuery.Callbacks = function(options) {
        options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
        var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
          locked = locked || options.once;
          fired = firing = true;
          for (; queue.length; firingIndex = -1) {
            memory = queue.shift();
            while (++firingIndex < list.length) {
              if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                firingIndex = list.length;
                memory = false;
              }
            }
          }
          if (!options.memory) {
            memory = false;
          }
          firing = false;
          if (locked) {
            if (memory) {
              list = [];
            } else {
              list = "";
            }
          }
        }, self = {
          // Add a callback or a collection of callbacks to the list
          add: function() {
            if (list) {
              if (memory && !firing) {
                firingIndex = list.length - 1;
                queue.push(memory);
              }
              (function add(args) {
                jQuery.each(args, function(_, arg) {
                  if (isFunction(arg)) {
                    if (!options.unique || !self.has(arg)) {
                      list.push(arg);
                    }
                  } else if (arg && arg.length && toType(arg) !== "string") {
                    add(arg);
                  }
                });
              })(arguments);
              if (memory && !firing) {
                fire();
              }
            }
            return this;
          },
          // Remove a callback from the list
          remove: function() {
            jQuery.each(arguments, function(_, arg) {
              var index;
              while ((index = jQuery.inArray(arg, list, index)) > -1) {
                list.splice(index, 1);
                if (index <= firingIndex) {
                  firingIndex--;
                }
              }
            });
            return this;
          },
          // Check if a given callback is in the list.
          // If no argument is given, return whether or not list has callbacks attached.
          has: function(fn) {
            return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
          },
          // Remove all callbacks from the list
          empty: function() {
            if (list) {
              list = [];
            }
            return this;
          },
          // Disable .fire and .add
          // Abort any current/pending executions
          // Clear all callbacks and values
          disable: function() {
            locked = queue = [];
            list = memory = "";
            return this;
          },
          disabled: function() {
            return !list;
          },
          // Disable .fire
          // Also disable .add unless we have memory (since it would have no effect)
          // Abort any pending executions
          lock: function() {
            locked = queue = [];
            if (!memory && !firing) {
              list = memory = "";
            }
            return this;
          },
          locked: function() {
            return !!locked;
          },
          // Call all callbacks with the given context and arguments
          fireWith: function(context, args) {
            if (!locked) {
              args = args || [];
              args = [context, args.slice ? args.slice() : args];
              queue.push(args);
              if (!firing) {
                fire();
              }
            }
            return this;
          },
          // Call all the callbacks with the given arguments
          fire: function() {
            self.fireWith(this, arguments);
            return this;
          },
          // To know if the callbacks have already been called at least once
          fired: function() {
            return !!fired;
          }
        };
        return self;
      };
      function Identity(v) {
        return v;
      }
      function Thrower(ex) {
        throw ex;
      }
      function adoptValue(value, resolve, reject, noValue) {
        var method;
        try {
          if (value && isFunction(method = value.promise)) {
            method.call(value).done(resolve).fail(reject);
          } else if (value && isFunction(method = value.then)) {
            method.call(value, resolve, reject);
          } else {
            resolve.apply(void 0, [value].slice(noValue));
          }
        } catch (value2) {
          reject.apply(void 0, [value2]);
        }
      }
      jQuery.extend({
        Deferred: function(func) {
          var tuples = [
            // action, add listener, callbacks,
            // ... .then handlers, argument index, [final state]
            [
              "notify",
              "progress",
              jQuery.Callbacks("memory"),
              jQuery.Callbacks("memory"),
              2
            ],
            [
              "resolve",
              "done",
              jQuery.Callbacks("once memory"),
              jQuery.Callbacks("once memory"),
              0,
              "resolved"
            ],
            [
              "reject",
              "fail",
              jQuery.Callbacks("once memory"),
              jQuery.Callbacks("once memory"),
              1,
              "rejected"
            ]
          ], state = "pending", promise = {
            state: function() {
              return state;
            },
            always: function() {
              deferred.done(arguments).fail(arguments);
              return this;
            },
            "catch": function(fn) {
              return promise.then(null, fn);
            },
            // Keep pipe for back-compat
            pipe: function() {
              var fns = arguments;
              return jQuery.Deferred(function(newDefer) {
                jQuery.each(tuples, function(_i, tuple) {
                  var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
                  deferred[tuple[1]](function() {
                    var returned = fn && fn.apply(this, arguments);
                    if (returned && isFunction(returned.promise)) {
                      returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                    } else {
                      newDefer[tuple[0] + "With"](
                        this,
                        fn ? [returned] : arguments
                      );
                    }
                  });
                });
                fns = null;
              }).promise();
            },
            then: function(onFulfilled, onRejected, onProgress) {
              var maxDepth = 0;
              function resolve(depth, deferred2, handler, special) {
                return function() {
                  var that = this, args = arguments, mightThrow = function() {
                    var returned, then;
                    if (depth < maxDepth) {
                      return;
                    }
                    returned = handler.apply(that, args);
                    if (returned === deferred2.promise()) {
                      throw new TypeError("Thenable self-resolution");
                    }
                    then = returned && // Support: Promises/A+ section 2.3.4
                    // https://promisesaplus.com/#point-64
                    // Only check objects and functions for thenability
                    (typeof returned === "object" || typeof returned === "function") && returned.then;
                    if (isFunction(then)) {
                      if (special) {
                        then.call(
                          returned,
                          resolve(maxDepth, deferred2, Identity, special),
                          resolve(maxDepth, deferred2, Thrower, special)
                        );
                      } else {
                        maxDepth++;
                        then.call(
                          returned,
                          resolve(maxDepth, deferred2, Identity, special),
                          resolve(maxDepth, deferred2, Thrower, special),
                          resolve(
                            maxDepth,
                            deferred2,
                            Identity,
                            deferred2.notifyWith
                          )
                        );
                      }
                    } else {
                      if (handler !== Identity) {
                        that = void 0;
                        args = [returned];
                      }
                      (special || deferred2.resolveWith)(that, args);
                    }
                  }, process = special ? mightThrow : function() {
                    try {
                      mightThrow();
                    } catch (e) {
                      if (jQuery.Deferred.exceptionHook) {
                        jQuery.Deferred.exceptionHook(
                          e,
                          process.error
                        );
                      }
                      if (depth + 1 >= maxDepth) {
                        if (handler !== Thrower) {
                          that = void 0;
                          args = [e];
                        }
                        deferred2.rejectWith(that, args);
                      }
                    }
                  };
                  if (depth) {
                    process();
                  } else {
                    if (jQuery.Deferred.getErrorHook) {
                      process.error = jQuery.Deferred.getErrorHook();
                    } else if (jQuery.Deferred.getStackHook) {
                      process.error = jQuery.Deferred.getStackHook();
                    }
                    window2.setTimeout(process);
                  }
                };
              }
              return jQuery.Deferred(function(newDefer) {
                tuples[0][3].add(
                  resolve(
                    0,
                    newDefer,
                    isFunction(onProgress) ? onProgress : Identity,
                    newDefer.notifyWith
                  )
                );
                tuples[1][3].add(
                  resolve(
                    0,
                    newDefer,
                    isFunction(onFulfilled) ? onFulfilled : Identity
                  )
                );
                tuples[2][3].add(
                  resolve(
                    0,
                    newDefer,
                    isFunction(onRejected) ? onRejected : Thrower
                  )
                );
              }).promise();
            },
            // Get a promise for this deferred
            // If obj is provided, the promise aspect is added to the object
            promise: function(obj) {
              return obj != null ? jQuery.extend(obj, promise) : promise;
            }
          }, deferred = {};
          jQuery.each(tuples, function(i, tuple) {
            var list = tuple[2], stateString = tuple[5];
            promise[tuple[1]] = list.add;
            if (stateString) {
              list.add(
                function() {
                  state = stateString;
                },
                // rejected_callbacks.disable
                // fulfilled_callbacks.disable
                tuples[3 - i][2].disable,
                // rejected_handlers.disable
                // fulfilled_handlers.disable
                tuples[3 - i][3].disable,
                // progress_callbacks.lock
                tuples[0][2].lock,
                // progress_handlers.lock
                tuples[0][3].lock
              );
            }
            list.add(tuple[3].fire);
            deferred[tuple[0]] = function() {
              deferred[tuple[0] + "With"](this === deferred ? void 0 : this, arguments);
              return this;
            };
            deferred[tuple[0] + "With"] = list.fireWith;
          });
          promise.promise(deferred);
          if (func) {
            func.call(deferred, deferred);
          }
          return deferred;
        },
        // Deferred helper
        when: function(singleValue) {
          var remaining = arguments.length, i = remaining, resolveContexts = Array(i), resolveValues = slice.call(arguments), primary = jQuery.Deferred(), updateFunc = function(i2) {
            return function(value) {
              resolveContexts[i2] = this;
              resolveValues[i2] = arguments.length > 1 ? slice.call(arguments) : value;
              if (!--remaining) {
                primary.resolveWith(resolveContexts, resolveValues);
              }
            };
          };
          if (remaining <= 1) {
            adoptValue(
              singleValue,
              primary.done(updateFunc(i)).resolve,
              primary.reject,
              !remaining
            );
            if (primary.state() === "pending" || isFunction(resolveValues[i] && resolveValues[i].then)) {
              return primary.then();
            }
          }
          while (i--) {
            adoptValue(resolveValues[i], updateFunc(i), primary.reject);
          }
          return primary.promise();
        }
      });
      var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
      jQuery.Deferred.exceptionHook = function(error, asyncError) {
        if (window2.console && window2.console.warn && error && rerrorNames.test(error.name)) {
          window2.console.warn(
            "jQuery.Deferred exception: " + error.message,
            error.stack,
            asyncError
          );
        }
      };
      jQuery.readyException = function(error) {
        window2.setTimeout(function() {
          throw error;
        });
      };
      var readyList = jQuery.Deferred();
      jQuery.fn.ready = function(fn) {
        readyList.then(fn).catch(function(error) {
          jQuery.readyException(error);
        });
        return this;
      };
      jQuery.extend({
        // Is the DOM ready to be used? Set to true once it occurs.
        isReady: false,
        // A counter to track how many items to wait for before
        // the ready event fires. See trac-6781
        readyWait: 1,
        // Handle when the DOM is ready
        ready: function(wait) {
          if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
            return;
          }
          jQuery.isReady = true;
          if (wait !== true && --jQuery.readyWait > 0) {
            return;
          }
          readyList.resolveWith(document2, [jQuery]);
        }
      });
      jQuery.ready.then = readyList.then;
      function completed() {
        document2.removeEventListener("DOMContentLoaded", completed);
        window2.removeEventListener("load", completed);
        jQuery.ready();
      }
      if (document2.readyState === "complete" || document2.readyState !== "loading" && !document2.documentElement.doScroll) {
        window2.setTimeout(jQuery.ready);
      } else {
        document2.addEventListener("DOMContentLoaded", completed);
        window2.addEventListener("load", completed);
      }
      var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
        var i = 0, len = elems.length, bulk = key == null;
        if (toType(key) === "object") {
          chainable = true;
          for (i in key) {
            access(elems, fn, i, key[i], true, emptyGet, raw);
          }
        } else if (value !== void 0) {
          chainable = true;
          if (!isFunction(value)) {
            raw = true;
          }
          if (bulk) {
            if (raw) {
              fn.call(elems, value);
              fn = null;
            } else {
              bulk = fn;
              fn = function(elem, _key, value2) {
                return bulk.call(jQuery(elem), value2);
              };
            }
          }
          if (fn) {
            for (; i < len; i++) {
              fn(
                elems[i],
                key,
                raw ? value : value.call(elems[i], i, fn(elems[i], key))
              );
            }
          }
        }
        if (chainable) {
          return elems;
        }
        if (bulk) {
          return fn.call(elems);
        }
        return len ? fn(elems[0], key) : emptyGet;
      };
      var rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g;
      function fcamelCase(_all, letter) {
        return letter.toUpperCase();
      }
      function camelCase(string) {
        return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
      }
      var acceptData = function(owner) {
        return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
      };
      function Data() {
        this.expando = jQuery.expando + Data.uid++;
      }
      Data.uid = 1;
      Data.prototype = {
        cache: function(owner) {
          var value = owner[this.expando];
          if (!value) {
            value = {};
            if (acceptData(owner)) {
              if (owner.nodeType) {
                owner[this.expando] = value;
              } else {
                Object.defineProperty(owner, this.expando, {
                  value,
                  configurable: true
                });
              }
            }
          }
          return value;
        },
        set: function(owner, data, value) {
          var prop, cache = this.cache(owner);
          if (typeof data === "string") {
            cache[camelCase(data)] = value;
          } else {
            for (prop in data) {
              cache[camelCase(prop)] = data[prop];
            }
          }
          return cache;
        },
        get: function(owner, key) {
          return key === void 0 ? this.cache(owner) : (
            // Always use camelCase key (gh-2257)
            owner[this.expando] && owner[this.expando][camelCase(key)]
          );
        },
        access: function(owner, key, value) {
          if (key === void 0 || key && typeof key === "string" && value === void 0) {
            return this.get(owner, key);
          }
          this.set(owner, key, value);
          return value !== void 0 ? value : key;
        },
        remove: function(owner, key) {
          var i, cache = owner[this.expando];
          if (cache === void 0) {
            return;
          }
          if (key !== void 0) {
            if (Array.isArray(key)) {
              key = key.map(camelCase);
            } else {
              key = camelCase(key);
              key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
            }
            i = key.length;
            while (i--) {
              delete cache[key[i]];
            }
          }
          if (key === void 0 || jQuery.isEmptyObject(cache)) {
            if (owner.nodeType) {
              owner[this.expando] = void 0;
            } else {
              delete owner[this.expando];
            }
          }
        },
        hasData: function(owner) {
          var cache = owner[this.expando];
          return cache !== void 0 && !jQuery.isEmptyObject(cache);
        }
      };
      var dataPriv = new Data();
      var dataUser = new Data();
      var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
      function getData(data) {
        if (data === "true") {
          return true;
        }
        if (data === "false") {
          return false;
        }
        if (data === "null") {
          return null;
        }
        if (data === +data + "") {
          return +data;
        }
        if (rbrace.test(data)) {
          return JSON.parse(data);
        }
        return data;
      }
      function dataAttr(elem, key, data) {
        var name;
        if (data === void 0 && elem.nodeType === 1) {
          name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
          data = elem.getAttribute(name);
          if (typeof data === "string") {
            try {
              data = getData(data);
            } catch (e) {
            }
            dataUser.set(elem, key, data);
          } else {
            data = void 0;
          }
        }
        return data;
      }
      jQuery.extend({
        hasData: function(elem) {
          return dataUser.hasData(elem) || dataPriv.hasData(elem);
        },
        data: function(elem, name, data) {
          return dataUser.access(elem, name, data);
        },
        removeData: function(elem, name) {
          dataUser.remove(elem, name);
        },
        // TODO: Now that all calls to _data and _removeData have been replaced
        // with direct calls to dataPriv methods, these can be deprecated.
        _data: function(elem, name, data) {
          return dataPriv.access(elem, name, data);
        },
        _removeData: function(elem, name) {
          dataPriv.remove(elem, name);
        }
      });
      jQuery.fn.extend({
        data: function(key, value) {
          var i, name, data, elem = this[0], attrs = elem && elem.attributes;
          if (key === void 0) {
            if (this.length) {
              data = dataUser.get(elem);
              if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                i = attrs.length;
                while (i--) {
                  if (attrs[i]) {
                    name = attrs[i].name;
                    if (name.indexOf("data-") === 0) {
                      name = camelCase(name.slice(5));
                      dataAttr(elem, name, data[name]);
                    }
                  }
                }
                dataPriv.set(elem, "hasDataAttrs", true);
              }
            }
            return data;
          }
          if (typeof key === "object") {
            return this.each(function() {
              dataUser.set(this, key);
            });
          }
          return access(this, function(value2) {
            var data2;
            if (elem && value2 === void 0) {
              data2 = dataUser.get(elem, key);
              if (data2 !== void 0) {
                return data2;
              }
              data2 = dataAttr(elem, key);
              if (data2 !== void 0) {
                return data2;
              }
              return;
            }
            this.each(function() {
              dataUser.set(this, key, value2);
            });
          }, null, value, arguments.length > 1, null, true);
        },
        removeData: function(key) {
          return this.each(function() {
            dataUser.remove(this, key);
          });
        }
      });
      jQuery.extend({
        queue: function(elem, type, data) {
          var queue;
          if (elem) {
            type = (type || "fx") + "queue";
            queue = dataPriv.get(elem, type);
            if (data) {
              if (!queue || Array.isArray(data)) {
                queue = dataPriv.access(elem, type, jQuery.makeArray(data));
              } else {
                queue.push(data);
              }
            }
            return queue || [];
          }
        },
        dequeue: function(elem, type) {
          type = type || "fx";
          var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function() {
            jQuery.dequeue(elem, type);
          };
          if (fn === "inprogress") {
            fn = queue.shift();
            startLength--;
          }
          if (fn) {
            if (type === "fx") {
              queue.unshift("inprogress");
            }
            delete hooks.stop;
            fn.call(elem, next, hooks);
          }
          if (!startLength && hooks) {
            hooks.empty.fire();
          }
        },
        // Not public - generate a queueHooks object, or return the current one
        _queueHooks: function(elem, type) {
          var key = type + "queueHooks";
          return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
            empty: jQuery.Callbacks("once memory").add(function() {
              dataPriv.remove(elem, [type + "queue", key]);
            })
          });
        }
      });
      jQuery.fn.extend({
        queue: function(type, data) {
          var setter = 2;
          if (typeof type !== "string") {
            data = type;
            type = "fx";
            setter--;
          }
          if (arguments.length < setter) {
            return jQuery.queue(this[0], type);
          }
          return data === void 0 ? this : this.each(function() {
            var queue = jQuery.queue(this, type, data);
            jQuery._queueHooks(this, type);
            if (type === "fx" && queue[0] !== "inprogress") {
              jQuery.dequeue(this, type);
            }
          });
        },
        dequeue: function(type) {
          return this.each(function() {
            jQuery.dequeue(this, type);
          });
        },
        clearQueue: function(type) {
          return this.queue(type || "fx", []);
        },
        // Get a promise resolved when queues of a certain type
        // are emptied (fx is the type by default)
        promise: function(type, obj) {
          var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
            if (!--count) {
              defer.resolveWith(elements, [elements]);
            }
          };
          if (typeof type !== "string") {
            obj = type;
            type = void 0;
          }
          type = type || "fx";
          while (i--) {
            tmp = dataPriv.get(elements[i], type + "queueHooks");
            if (tmp && tmp.empty) {
              count++;
              tmp.empty.add(resolve);
            }
          }
          resolve();
          return defer.promise(obj);
        }
      });
      var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
      var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
      var cssExpand = ["Top", "Right", "Bottom", "Left"];
      var documentElement = document2.documentElement;
      var isAttached = function(elem) {
        return jQuery.contains(elem.ownerDocument, elem);
      }, composed = { composed: true };
      if (documentElement.getRootNode) {
        isAttached = function(elem) {
          return jQuery.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
        };
      }
      var isHiddenWithinTree = function(elem, el) {
        elem = el || elem;
        return elem.style.display === "none" || elem.style.display === "" && // Otherwise, check computed style
        // Support: Firefox <=43 - 45
        // Disconnected elements can have computed display: none, so first confirm that elem is
        // in the document.
        isAttached(elem) && jQuery.css(elem, "display") === "none";
      };
      function adjustCSS(elem, prop, valueParts, tween) {
        var adjusted, scale, maxIterations = 20, currentValue = tween ? function() {
          return tween.cur();
        } : function() {
          return jQuery.css(elem, prop, "");
        }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"), initialInUnit = elem.nodeType && (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));
        if (initialInUnit && initialInUnit[3] !== unit) {
          initial = initial / 2;
          unit = unit || initialInUnit[3];
          initialInUnit = +initial || 1;
          while (maxIterations--) {
            jQuery.style(elem, prop, initialInUnit + unit);
            if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
              maxIterations = 0;
            }
            initialInUnit = initialInUnit / scale;
          }
          initialInUnit = initialInUnit * 2;
          jQuery.style(elem, prop, initialInUnit + unit);
          valueParts = valueParts || [];
        }
        if (valueParts) {
          initialInUnit = +initialInUnit || +initial || 0;
          adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
          if (tween) {
            tween.unit = unit;
            tween.start = initialInUnit;
            tween.end = adjusted;
          }
        }
        return adjusted;
      }
      var defaultDisplayMap = {};
      function getDefaultDisplay(elem) {
        var temp, doc = elem.ownerDocument, nodeName2 = elem.nodeName, display = defaultDisplayMap[nodeName2];
        if (display) {
          return display;
        }
        temp = doc.body.appendChild(doc.createElement(nodeName2));
        display = jQuery.css(temp, "display");
        temp.parentNode.removeChild(temp);
        if (display === "none") {
          display = "block";
        }
        defaultDisplayMap[nodeName2] = display;
        return display;
      }
      function showHide(elements, show) {
        var display, elem, values = [], index = 0, length = elements.length;
        for (; index < length; index++) {
          elem = elements[index];
          if (!elem.style) {
            continue;
          }
          display = elem.style.display;
          if (show) {
            if (display === "none") {
              values[index] = dataPriv.get(elem, "display") || null;
              if (!values[index]) {
                elem.style.display = "";
              }
            }
            if (elem.style.display === "" && isHiddenWithinTree(elem)) {
              values[index] = getDefaultDisplay(elem);
            }
          } else {
            if (display !== "none") {
              values[index] = "none";
              dataPriv.set(elem, "display", display);
            }
          }
        }
        for (index = 0; index < length; index++) {
          if (values[index] != null) {
            elements[index].style.display = values[index];
          }
        }
        return elements;
      }
      jQuery.fn.extend({
        show: function() {
          return showHide(this, true);
        },
        hide: function() {
          return showHide(this);
        },
        toggle: function(state) {
          if (typeof state === "boolean") {
            return state ? this.show() : this.hide();
          }
          return this.each(function() {
            if (isHiddenWithinTree(this)) {
              jQuery(this).show();
            } else {
              jQuery(this).hide();
            }
          });
        }
      });
      var rcheckableType = /^(?:checkbox|radio)$/i;
      var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
      var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
      (function() {
        var fragment = document2.createDocumentFragment(), div = fragment.appendChild(document2.createElement("div")), input = document2.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("checked", "checked");
        input.setAttribute("name", "t");
        div.appendChild(input);
        support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
        div.innerHTML = "<textarea>x</textarea>";
        support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
        div.innerHTML = "<option></option>";
        support.option = !!div.lastChild;
      })();
      var wrapMap = {
        // XHTML parsers do not magically insert elements in the
        // same way that tag soup parsers do. So we cannot shorten
        // this by omitting <tbody> or other required elements.
        thead: [1, "<table>", "</table>"],
        col: [2, "<table><colgroup>", "</colgroup></table>"],
        tr: [2, "<table><tbody>", "</tbody></table>"],
        td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        _default: [0, "", ""]
      };
      wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
      wrapMap.th = wrapMap.td;
      if (!support.option) {
        wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", "</select>"];
      }
      function getAll(context, tag) {
        var ret;
        if (typeof context.getElementsByTagName !== "undefined") {
          ret = context.getElementsByTagName(tag || "*");
        } else if (typeof context.querySelectorAll !== "undefined") {
          ret = context.querySelectorAll(tag || "*");
        } else {
          ret = [];
        }
        if (tag === void 0 || tag && nodeName(context, tag)) {
          return jQuery.merge([context], ret);
        }
        return ret;
      }
      function setGlobalEval(elems, refElements) {
        var i = 0, l = elems.length;
        for (; i < l; i++) {
          dataPriv.set(
            elems[i],
            "globalEval",
            !refElements || dataPriv.get(refElements[i], "globalEval")
          );
        }
      }
      var rhtml = /<|&#?\w+;/;
      function buildFragment(elems, context, scripts, selection, ignored) {
        var elem, tmp, tag, wrap, attached, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
        for (; i < l; i++) {
          elem = elems[i];
          if (elem || elem === 0) {
            if (toType(elem) === "object") {
              jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
            } else if (!rhtml.test(elem)) {
              nodes.push(context.createTextNode(elem));
            } else {
              tmp = tmp || fragment.appendChild(context.createElement("div"));
              tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
              wrap = wrapMap[tag] || wrapMap._default;
              tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
              j = wrap[0];
              while (j--) {
                tmp = tmp.lastChild;
              }
              jQuery.merge(nodes, tmp.childNodes);
              tmp = fragment.firstChild;
              tmp.textContent = "";
            }
          }
        }
        fragment.textContent = "";
        i = 0;
        while (elem = nodes[i++]) {
          if (selection && jQuery.inArray(elem, selection) > -1) {
            if (ignored) {
              ignored.push(elem);
            }
            continue;
          }
          attached = isAttached(elem);
          tmp = getAll(fragment.appendChild(elem), "script");
          if (attached) {
            setGlobalEval(tmp);
          }
          if (scripts) {
            j = 0;
            while (elem = tmp[j++]) {
              if (rscriptType.test(elem.type || "")) {
                scripts.push(elem);
              }
            }
          }
        }
        return fragment;
      }
      var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
      function returnTrue() {
        return true;
      }
      function returnFalse() {
        return false;
      }
      function on(elem, types, selector, data, fn, one) {
        var origFn, type;
        if (typeof types === "object") {
          if (typeof selector !== "string") {
            data = data || selector;
            selector = void 0;
          }
          for (type in types) {
            on(elem, type, selector, data, types[type], one);
          }
          return elem;
        }
        if (data == null && fn == null) {
          fn = selector;
          data = selector = void 0;
        } else if (fn == null) {
          if (typeof selector === "string") {
            fn = data;
            data = void 0;
          } else {
            fn = data;
            data = selector;
            selector = void 0;
          }
        }
        if (fn === false) {
          fn = returnFalse;
        } else if (!fn) {
          return elem;
        }
        if (one === 1) {
          origFn = fn;
          fn = function(event) {
            jQuery().off(event);
            return origFn.apply(this, arguments);
          };
          fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
        }
        return elem.each(function() {
          jQuery.event.add(this, types, fn, data, selector);
        });
      }
      jQuery.event = {
        global: {},
        add: function(elem, types, handler, data, selector) {
          var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
          if (!acceptData(elem)) {
            return;
          }
          if (handler.handler) {
            handleObjIn = handler;
            handler = handleObjIn.handler;
            selector = handleObjIn.selector;
          }
          if (selector) {
            jQuery.find.matchesSelector(documentElement, selector);
          }
          if (!handler.guid) {
            handler.guid = jQuery.guid++;
          }
          if (!(events = elemData.events)) {
            events = elemData.events = /* @__PURE__ */ Object.create(null);
          }
          if (!(eventHandle = elemData.handle)) {
            eventHandle = elemData.handle = function(e) {
              return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : void 0;
            };
          }
          types = (types || "").match(rnothtmlwhite) || [""];
          t = types.length;
          while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || "").split(".").sort();
            if (!type) {
              continue;
            }
            special = jQuery.event.special[type] || {};
            type = (selector ? special.delegateType : special.bindType) || type;
            special = jQuery.event.special[type] || {};
            handleObj = jQuery.extend({
              type,
              origType,
              data,
              handler,
              guid: handler.guid,
              selector,
              needsContext: selector && jQuery.expr.match.needsContext.test(selector),
              namespace: namespaces.join(".")
            }, handleObjIn);
            if (!(handlers = events[type])) {
              handlers = events[type] = [];
              handlers.delegateCount = 0;
              if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                if (elem.addEventListener) {
                  elem.addEventListener(type, eventHandle);
                }
              }
            }
            if (special.add) {
              special.add.call(elem, handleObj);
              if (!handleObj.handler.guid) {
                handleObj.handler.guid = handler.guid;
              }
            }
            if (selector) {
              handlers.splice(handlers.delegateCount++, 0, handleObj);
            } else {
              handlers.push(handleObj);
            }
            jQuery.event.global[type] = true;
          }
        },
        // Detach an event or set of events from an element
        remove: function(elem, types, handler, selector, mappedTypes) {
          var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
          if (!elemData || !(events = elemData.events)) {
            return;
          }
          types = (types || "").match(rnothtmlwhite) || [""];
          t = types.length;
          while (t--) {
            tmp = rtypenamespace.exec(types[t]) || [];
            type = origType = tmp[1];
            namespaces = (tmp[2] || "").split(".").sort();
            if (!type) {
              for (type in events) {
                jQuery.event.remove(elem, type + types[t], handler, selector, true);
              }
              continue;
            }
            special = jQuery.event.special[type] || {};
            type = (selector ? special.delegateType : special.bindType) || type;
            handlers = events[type] || [];
            tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
            origCount = j = handlers.length;
            while (j--) {
              handleObj = handlers[j];
              if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                handlers.splice(j, 1);
                if (handleObj.selector) {
                  handlers.delegateCount--;
                }
                if (special.remove) {
                  special.remove.call(elem, handleObj);
                }
              }
            }
            if (origCount && !handlers.length) {
              if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                jQuery.removeEvent(elem, type, elemData.handle);
              }
              delete events[type];
            }
          }
          if (jQuery.isEmptyObject(events)) {
            dataPriv.remove(elem, "handle events");
          }
        },
        dispatch: function(nativeEvent) {
          var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || /* @__PURE__ */ Object.create(null))[event.type] || [], special = jQuery.event.special[event.type] || {};
          args[0] = event;
          for (i = 1; i < arguments.length; i++) {
            args[i] = arguments[i];
          }
          event.delegateTarget = this;
          if (special.preDispatch && special.preDispatch.call(this, event) === false) {
            return;
          }
          handlerQueue = jQuery.event.handlers.call(this, event, handlers);
          i = 0;
          while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
            event.currentTarget = matched.elem;
            j = 0;
            while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
              if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
                event.handleObj = handleObj;
                event.data = handleObj.data;
                ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                if (ret !== void 0) {
                  if ((event.result = ret) === false) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }
              }
            }
          }
          if (special.postDispatch) {
            special.postDispatch.call(this, event);
          }
          return event.result;
        },
        handlers: function(event, handlers) {
          var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
          if (delegateCount && // Support: IE <=9
          // Black-hole SVG <use> instance trees (trac-13180)
          cur.nodeType && // Support: Firefox <=42
          // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
          // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
          // Support: IE 11 only
          // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
          !(event.type === "click" && event.button >= 1)) {
            for (; cur !== this; cur = cur.parentNode || this) {
              if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
                matchedHandlers = [];
                matchedSelectors = {};
                for (i = 0; i < delegateCount; i++) {
                  handleObj = handlers[i];
                  sel = handleObj.selector + " ";
                  if (matchedSelectors[sel] === void 0) {
                    matchedSelectors[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [cur]).length;
                  }
                  if (matchedSelectors[sel]) {
                    matchedHandlers.push(handleObj);
                  }
                }
                if (matchedHandlers.length) {
                  handlerQueue.push({ elem: cur, handlers: matchedHandlers });
                }
              }
            }
          }
          cur = this;
          if (delegateCount < handlers.length) {
            handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
          }
          return handlerQueue;
        },
        addProp: function(name, hook) {
          Object.defineProperty(jQuery.Event.prototype, name, {
            enumerable: true,
            configurable: true,
            get: isFunction(hook) ? function() {
              if (this.originalEvent) {
                return hook(this.originalEvent);
              }
            } : function() {
              if (this.originalEvent) {
                return this.originalEvent[name];
              }
            },
            set: function(value) {
              Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                writable: true,
                value
              });
            }
          });
        },
        fix: function(originalEvent) {
          return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
        },
        special: {
          load: {
            // Prevent triggered image.load events from bubbling to window.load
            noBubble: true
          },
          click: {
            // Utilize native event to ensure correct state for checkable inputs
            setup: function(data) {
              var el = this || data;
              if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                leverageNative(el, "click", true);
              }
              return false;
            },
            trigger: function(data) {
              var el = this || data;
              if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                leverageNative(el, "click");
              }
              return true;
            },
            // For cross-browser consistency, suppress native .click() on links
            // Also prevent it if we're currently inside a leveraged native-event stack
            _default: function(event) {
              var target = event.target;
              return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
            }
          },
          beforeunload: {
            postDispatch: function(event) {
              if (event.result !== void 0 && event.originalEvent) {
                event.originalEvent.returnValue = event.result;
              }
            }
          }
        }
      };
      function leverageNative(el, type, isSetup) {
        if (!isSetup) {
          if (dataPriv.get(el, type) === void 0) {
            jQuery.event.add(el, type, returnTrue);
          }
          return;
        }
        dataPriv.set(el, type, false);
        jQuery.event.add(el, type, {
          namespace: false,
          handler: function(event) {
            var result, saved = dataPriv.get(this, type);
            if (event.isTrigger & 1 && this[type]) {
              if (!saved) {
                saved = slice.call(arguments);
                dataPriv.set(this, type, saved);
                this[type]();
                result = dataPriv.get(this, type);
                dataPriv.set(this, type, false);
                if (saved !== result) {
                  event.stopImmediatePropagation();
                  event.preventDefault();
                  return result;
                }
              } else if ((jQuery.event.special[type] || {}).delegateType) {
                event.stopPropagation();
              }
            } else if (saved) {
              dataPriv.set(this, type, jQuery.event.trigger(
                saved[0],
                saved.slice(1),
                this
              ));
              event.stopPropagation();
              event.isImmediatePropagationStopped = returnTrue;
            }
          }
        });
      }
      jQuery.removeEvent = function(elem, type, handle) {
        if (elem.removeEventListener) {
          elem.removeEventListener(type, handle);
        }
      };
      jQuery.Event = function(src, props) {
        if (!(this instanceof jQuery.Event)) {
          return new jQuery.Event(src, props);
        }
        if (src && src.type) {
          this.originalEvent = src;
          this.type = src.type;
          this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === void 0 && // Support: Android <=2.3 only
          src.returnValue === false ? returnTrue : returnFalse;
          this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
          this.currentTarget = src.currentTarget;
          this.relatedTarget = src.relatedTarget;
        } else {
          this.type = src;
        }
        if (props) {
          jQuery.extend(this, props);
        }
        this.timeStamp = src && src.timeStamp || Date.now();
        this[jQuery.expando] = true;
      };
      jQuery.Event.prototype = {
        constructor: jQuery.Event,
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,
        isSimulated: false,
        preventDefault: function() {
          var e = this.originalEvent;
          this.isDefaultPrevented = returnTrue;
          if (e && !this.isSimulated) {
            e.preventDefault();
          }
        },
        stopPropagation: function() {
          var e = this.originalEvent;
          this.isPropagationStopped = returnTrue;
          if (e && !this.isSimulated) {
            e.stopPropagation();
          }
        },
        stopImmediatePropagation: function() {
          var e = this.originalEvent;
          this.isImmediatePropagationStopped = returnTrue;
          if (e && !this.isSimulated) {
            e.stopImmediatePropagation();
          }
          this.stopPropagation();
        }
      };
      jQuery.each({
        altKey: true,
        bubbles: true,
        cancelable: true,
        changedTouches: true,
        ctrlKey: true,
        detail: true,
        eventPhase: true,
        metaKey: true,
        pageX: true,
        pageY: true,
        shiftKey: true,
        view: true,
        "char": true,
        code: true,
        charCode: true,
        key: true,
        keyCode: true,
        button: true,
        buttons: true,
        clientX: true,
        clientY: true,
        offsetX: true,
        offsetY: true,
        pointerId: true,
        pointerType: true,
        screenX: true,
        screenY: true,
        targetTouches: true,
        toElement: true,
        touches: true,
        which: true
      }, jQuery.event.addProp);
      jQuery.each({ focus: "focusin", blur: "focusout" }, function(type, delegateType) {
        function focusMappedHandler(nativeEvent) {
          if (document2.documentMode) {
            var handle = dataPriv.get(this, "handle"), event = jQuery.event.fix(nativeEvent);
            event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
            event.isSimulated = true;
            handle(nativeEvent);
            if (event.target === event.currentTarget) {
              handle(event);
            }
          } else {
            jQuery.event.simulate(
              delegateType,
              nativeEvent.target,
              jQuery.event.fix(nativeEvent)
            );
          }
        }
        jQuery.event.special[type] = {
          // Utilize native event if possible so blur/focus sequence is correct
          setup: function() {
            var attaches;
            leverageNative(this, type, true);
            if (document2.documentMode) {
              attaches = dataPriv.get(this, delegateType);
              if (!attaches) {
                this.addEventListener(delegateType, focusMappedHandler);
              }
              dataPriv.set(this, delegateType, (attaches || 0) + 1);
            } else {
              return false;
            }
          },
          trigger: function() {
            leverageNative(this, type);
            return true;
          },
          teardown: function() {
            var attaches;
            if (document2.documentMode) {
              attaches = dataPriv.get(this, delegateType) - 1;
              if (!attaches) {
                this.removeEventListener(delegateType, focusMappedHandler);
                dataPriv.remove(this, delegateType);
              } else {
                dataPriv.set(this, delegateType, attaches);
              }
            } else {
              return false;
            }
          },
          // Suppress native focus or blur if we're currently inside
          // a leveraged native-event stack
          _default: function(event) {
            return dataPriv.get(event.target, type);
          },
          delegateType
        };
        jQuery.event.special[delegateType] = {
          setup: function() {
            var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType);
            if (!attaches) {
              if (document2.documentMode) {
                this.addEventListener(delegateType, focusMappedHandler);
              } else {
                doc.addEventListener(type, focusMappedHandler, true);
              }
            }
            dataPriv.set(dataHolder, delegateType, (attaches || 0) + 1);
          },
          teardown: function() {
            var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType) - 1;
            if (!attaches) {
              if (document2.documentMode) {
                this.removeEventListener(delegateType, focusMappedHandler);
              } else {
                doc.removeEventListener(type, focusMappedHandler, true);
              }
              dataPriv.remove(dataHolder, delegateType);
            } else {
              dataPriv.set(dataHolder, delegateType, attaches);
            }
          }
        };
      });
      jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        pointerenter: "pointerover",
        pointerleave: "pointerout"
      }, function(orig, fix) {
        jQuery.event.special[orig] = {
          delegateType: fix,
          bindType: fix,
          handle: function(event) {
            var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
            if (!related || related !== target && !jQuery.contains(target, related)) {
              event.type = handleObj.origType;
              ret = handleObj.handler.apply(this, arguments);
              event.type = fix;
            }
            return ret;
          }
        };
      });
      jQuery.fn.extend({
        on: function(types, selector, data, fn) {
          return on(this, types, selector, data, fn);
        },
        one: function(types, selector, data, fn) {
          return on(this, types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
          var handleObj, type;
          if (types && types.preventDefault && types.handleObj) {
            handleObj = types.handleObj;
            jQuery(types.delegateTarget).off(
              handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
              handleObj.selector,
              handleObj.handler
            );
            return this;
          }
          if (typeof types === "object") {
            for (type in types) {
              this.off(type, selector, types[type]);
            }
            return this;
          }
          if (selector === false || typeof selector === "function") {
            fn = selector;
            selector = void 0;
          }
          if (fn === false) {
            fn = returnFalse;
          }
          return this.each(function() {
            jQuery.event.remove(this, types, fn, selector);
          });
        }
      });
      var rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
      function manipulationTarget(elem, content) {
        if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
          return jQuery(elem).children("tbody")[0] || elem;
        }
        return elem;
      }
      function disableScript(elem) {
        elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
        return elem;
      }
      function restoreScript(elem) {
        if ((elem.type || "").slice(0, 5) === "true/") {
          elem.type = elem.type.slice(5);
        } else {
          elem.removeAttribute("type");
        }
        return elem;
      }
      function cloneCopyEvent(src, dest) {
        var i, l, type, pdataOld, udataOld, udataCur, events;
        if (dest.nodeType !== 1) {
          return;
        }
        if (dataPriv.hasData(src)) {
          pdataOld = dataPriv.get(src);
          events = pdataOld.events;
          if (events) {
            dataPriv.remove(dest, "handle events");
            for (type in events) {
              for (i = 0, l = events[type].length; i < l; i++) {
                jQuery.event.add(dest, type, events[type][i]);
              }
            }
          }
        }
        if (dataUser.hasData(src)) {
          udataOld = dataUser.access(src);
          udataCur = jQuery.extend({}, udataOld);
          dataUser.set(dest, udataCur);
        }
      }
      function fixInput(src, dest) {
        var nodeName2 = dest.nodeName.toLowerCase();
        if (nodeName2 === "input" && rcheckableType.test(src.type)) {
          dest.checked = src.checked;
        } else if (nodeName2 === "input" || nodeName2 === "textarea") {
          dest.defaultValue = src.defaultValue;
        }
      }
      function domManip(collection, args, callback, ignored) {
        args = flat(args);
        var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFunction(value);
        if (valueIsFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
          return collection.each(function(index) {
            var self = collection.eq(index);
            if (valueIsFunction) {
              args[0] = value.call(this, index, self.html());
            }
            domManip(self, args, callback, ignored);
          });
        }
        if (l) {
          fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
          first = fragment.firstChild;
          if (fragment.childNodes.length === 1) {
            fragment = first;
          }
          if (first || ignored) {
            scripts = jQuery.map(getAll(fragment, "script"), disableScript);
            hasScripts = scripts.length;
            for (; i < l; i++) {
              node = fragment;
              if (i !== iNoClone) {
                node = jQuery.clone(node, true, true);
                if (hasScripts) {
                  jQuery.merge(scripts, getAll(node, "script"));
                }
              }
              callback.call(collection[i], node, i);
            }
            if (hasScripts) {
              doc = scripts[scripts.length - 1].ownerDocument;
              jQuery.map(scripts, restoreScript);
              for (i = 0; i < hasScripts; i++) {
                node = scripts[i];
                if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
                  if (node.src && (node.type || "").toLowerCase() !== "module") {
                    if (jQuery._evalUrl && !node.noModule) {
                      jQuery._evalUrl(node.src, {
                        nonce: node.nonce || node.getAttribute("nonce")
                      }, doc);
                    }
                  } else {
                    DOMEval(node.textContent.replace(rcleanScript, ""), node, doc);
                  }
                }
              }
            }
          }
        }
        return collection;
      }
      function remove(elem, selector, keepData) {
        var node, nodes = selector ? jQuery.filter(selector, elem) : elem, i = 0;
        for (; (node = nodes[i]) != null; i++) {
          if (!keepData && node.nodeType === 1) {
            jQuery.cleanData(getAll(node));
          }
          if (node.parentNode) {
            if (keepData && isAttached(node)) {
              setGlobalEval(getAll(node, "script"));
            }
            node.parentNode.removeChild(node);
          }
        }
        return elem;
      }
      jQuery.extend({
        htmlPrefilter: function(html) {
          return html;
        },
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
          var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
          if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
            destElements = getAll(clone);
            srcElements = getAll(elem);
            for (i = 0, l = srcElements.length; i < l; i++) {
              fixInput(srcElements[i], destElements[i]);
            }
          }
          if (dataAndEvents) {
            if (deepDataAndEvents) {
              srcElements = srcElements || getAll(elem);
              destElements = destElements || getAll(clone);
              for (i = 0, l = srcElements.length; i < l; i++) {
                cloneCopyEvent(srcElements[i], destElements[i]);
              }
            } else {
              cloneCopyEvent(elem, clone);
            }
          }
          destElements = getAll(clone, "script");
          if (destElements.length > 0) {
            setGlobalEval(destElements, !inPage && getAll(elem, "script"));
          }
          return clone;
        },
        cleanData: function(elems) {
          var data, elem, type, special = jQuery.event.special, i = 0;
          for (; (elem = elems[i]) !== void 0; i++) {
            if (acceptData(elem)) {
              if (data = elem[dataPriv.expando]) {
                if (data.events) {
                  for (type in data.events) {
                    if (special[type]) {
                      jQuery.event.remove(elem, type);
                    } else {
                      jQuery.removeEvent(elem, type, data.handle);
                    }
                  }
                }
                elem[dataPriv.expando] = void 0;
              }
              if (elem[dataUser.expando]) {
                elem[dataUser.expando] = void 0;
              }
            }
          }
        }
      });
      jQuery.fn.extend({
        detach: function(selector) {
          return remove(this, selector, true);
        },
        remove: function(selector) {
          return remove(this, selector);
        },
        text: function(value) {
          return access(this, function(value2) {
            return value2 === void 0 ? jQuery.text(this) : this.empty().each(function() {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                this.textContent = value2;
              }
            });
          }, null, value, arguments.length);
        },
        append: function() {
          return domManip(this, arguments, function(elem) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var target = manipulationTarget(this, elem);
              target.appendChild(elem);
            }
          });
        },
        prepend: function() {
          return domManip(this, arguments, function(elem) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var target = manipulationTarget(this, elem);
              target.insertBefore(elem, target.firstChild);
            }
          });
        },
        before: function() {
          return domManip(this, arguments, function(elem) {
            if (this.parentNode) {
              this.parentNode.insertBefore(elem, this);
            }
          });
        },
        after: function() {
          return domManip(this, arguments, function(elem) {
            if (this.parentNode) {
              this.parentNode.insertBefore(elem, this.nextSibling);
            }
          });
        },
        empty: function() {
          var elem, i = 0;
          for (; (elem = this[i]) != null; i++) {
            if (elem.nodeType === 1) {
              jQuery.cleanData(getAll(elem, false));
              elem.textContent = "";
            }
          }
          return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
          dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
          deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
          return this.map(function() {
            return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
          });
        },
        html: function(value) {
          return access(this, function(value2) {
            var elem = this[0] || {}, i = 0, l = this.length;
            if (value2 === void 0 && elem.nodeType === 1) {
              return elem.innerHTML;
            }
            if (typeof value2 === "string" && !rnoInnerhtml.test(value2) && !wrapMap[(rtagName.exec(value2) || ["", ""])[1].toLowerCase()]) {
              value2 = jQuery.htmlPrefilter(value2);
              try {
                for (; i < l; i++) {
                  elem = this[i] || {};
                  if (elem.nodeType === 1) {
                    jQuery.cleanData(getAll(elem, false));
                    elem.innerHTML = value2;
                  }
                }
                elem = 0;
              } catch (e) {
              }
            }
            if (elem) {
              this.empty().append(value2);
            }
          }, null, value, arguments.length);
        },
        replaceWith: function() {
          var ignored = [];
          return domManip(this, arguments, function(elem) {
            var parent = this.parentNode;
            if (jQuery.inArray(this, ignored) < 0) {
              jQuery.cleanData(getAll(this));
              if (parent) {
                parent.replaceChild(elem, this);
              }
            }
          }, ignored);
        }
      });
      jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
      }, function(name, original) {
        jQuery.fn[name] = function(selector) {
          var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0;
          for (; i <= last; i++) {
            elems = i === last ? this : this.clone(true);
            jQuery(insert[i])[original](elems);
            push.apply(ret, elems.get());
          }
          return this.pushStack(ret);
        };
      });
      var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
      var rcustomProp = /^--/;
      var getStyles = function(elem) {
        var view = elem.ownerDocument.defaultView;
        if (!view || !view.opener) {
          view = window2;
        }
        return view.getComputedStyle(elem);
      };
      var swap = function(elem, options, callback) {
        var ret, name, old = {};
        for (name in options) {
          old[name] = elem.style[name];
          elem.style[name] = options[name];
        }
        ret = callback.call(elem);
        for (name in options) {
          elem.style[name] = old[name];
        }
        return ret;
      };
      var rboxStyle = new RegExp(cssExpand.join("|"), "i");
      (function() {
        function computeStyleTests() {
          if (!div) {
            return;
          }
          container.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0";
          div.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%";
          documentElement.appendChild(container).appendChild(div);
          var divStyle = window2.getComputedStyle(div);
          pixelPositionVal = divStyle.top !== "1%";
          reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12;
          div.style.right = "60%";
          pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36;
          boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36;
          div.style.position = "absolute";
          scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
          documentElement.removeChild(container);
          div = null;
        }
        function roundPixelMeasures(measure) {
          return Math.round(parseFloat(measure));
        }
        var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableTrDimensionsVal, reliableMarginLeftVal, container = document2.createElement("div"), div = document2.createElement("div");
        if (!div.style) {
          return;
        }
        div.style.backgroundClip = "content-box";
        div.cloneNode(true).style.backgroundClip = "";
        support.clearCloneStyle = div.style.backgroundClip === "content-box";
        jQuery.extend(support, {
          boxSizingReliable: function() {
            computeStyleTests();
            return boxSizingReliableVal;
          },
          pixelBoxStyles: function() {
            computeStyleTests();
            return pixelBoxStylesVal;
          },
          pixelPosition: function() {
            computeStyleTests();
            return pixelPositionVal;
          },
          reliableMarginLeft: function() {
            computeStyleTests();
            return reliableMarginLeftVal;
          },
          scrollboxSize: function() {
            computeStyleTests();
            return scrollboxSizeVal;
          },
          // Support: IE 9 - 11+, Edge 15 - 18+
          // IE/Edge misreport `getComputedStyle` of table rows with width/height
          // set in CSS while `offset*` properties report correct values.
          // Behavior in IE 9 is more subtle than in newer versions & it passes
          // some versions of this test; make sure not to make it pass there!
          //
          // Support: Firefox 70+
          // Only Firefox includes border widths
          // in computed dimensions. (gh-4529)
          reliableTrDimensions: function() {
            var table, tr, trChild, trStyle;
            if (reliableTrDimensionsVal == null) {
              table = document2.createElement("table");
              tr = document2.createElement("tr");
              trChild = document2.createElement("div");
              table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
              tr.style.cssText = "box-sizing:content-box;border:1px solid";
              tr.style.height = "1px";
              trChild.style.height = "9px";
              trChild.style.display = "block";
              documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
              trStyle = window2.getComputedStyle(tr);
              reliableTrDimensionsVal = parseInt(trStyle.height, 10) + parseInt(trStyle.borderTopWidth, 10) + parseInt(trStyle.borderBottomWidth, 10) === tr.offsetHeight;
              documentElement.removeChild(table);
            }
            return reliableTrDimensionsVal;
          }
        });
      })();
      function curCSS(elem, name, computed) {
        var width, minWidth, maxWidth, ret, isCustomProp = rcustomProp.test(name), style = elem.style;
        computed = computed || getStyles(elem);
        if (computed) {
          ret = computed.getPropertyValue(name) || computed[name];
          if (isCustomProp && ret) {
            ret = ret.replace(rtrimCSS, "$1") || void 0;
          }
          if (ret === "" && !isAttached(elem)) {
            ret = jQuery.style(elem, name);
          }
          if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
            width = style.width;
            minWidth = style.minWidth;
            maxWidth = style.maxWidth;
            style.minWidth = style.maxWidth = style.width = ret;
            ret = computed.width;
            style.width = width;
            style.minWidth = minWidth;
            style.maxWidth = maxWidth;
          }
        }
        return ret !== void 0 ? (
          // Support: IE <=9 - 11 only
          // IE returns zIndex value as an integer.
          ret + ""
        ) : ret;
      }
      function addGetHookIf(conditionFn, hookFn) {
        return {
          get: function() {
            if (conditionFn()) {
              delete this.get;
              return;
            }
            return (this.get = hookFn).apply(this, arguments);
          }
        };
      }
      var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document2.createElement("div").style, vendorProps = {};
      function vendorPropName(name) {
        var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
        while (i--) {
          name = cssPrefixes[i] + capName;
          if (name in emptyStyle) {
            return name;
          }
        }
      }
      function finalPropName(name) {
        var final = jQuery.cssProps[name] || vendorProps[name];
        if (final) {
          return final;
        }
        if (name in emptyStyle) {
          return name;
        }
        return vendorProps[name] = vendorPropName(name) || name;
      }
      var rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = { position: "absolute", visibility: "hidden", display: "block" }, cssNormalTransform = {
        letterSpacing: "0",
        fontWeight: "400"
      };
      function setPositiveNumber(_elem, value, subtract) {
        var matches = rcssNum.exec(value);
        return matches ? (
          // Guard against undefined "subtract", e.g., when used as in cssHooks
          Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px")
        ) : value;
      }
      function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
        var i = dimension === "width" ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
        if (box === (isBorderBox ? "border" : "content")) {
          return 0;
        }
        for (; i < 4; i += 2) {
          if (box === "margin") {
            marginDelta += jQuery.css(elem, box + cssExpand[i], true, styles);
          }
          if (!isBorderBox) {
            delta += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
            if (box !== "padding") {
              delta += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
            } else {
              extra += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
            }
          } else {
            if (box === "content") {
              delta -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
            }
            if (box !== "margin") {
              delta -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
            }
          }
        }
        if (!isBorderBox && computedVal >= 0) {
          delta += Math.max(0, Math.ceil(
            elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5
            // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
            // Use an explicit zero to avoid NaN (gh-3964)
          )) || 0;
        }
        return delta + marginDelta;
      }
      function getWidthOrHeight(elem, dimension, extra) {
        var styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
        if (rnumnonpx.test(val)) {
          if (!extra) {
            return val;
          }
          val = "auto";
        }
        if ((!support.boxSizingReliable() && isBorderBox || // Support: IE 10 - 11+, Edge 15 - 18+
        // IE/Edge misreport `getComputedStyle` of table rows with width/height
        // set in CSS while `offset*` properties report correct values.
        // Interestingly, in some cases IE 9 doesn't suffer from this issue.
        !support.reliableTrDimensions() && nodeName(elem, "tr") || // Fall back to offsetWidth/offsetHeight when value is "auto"
        // This happens for inline elements with no explicit setting (gh-3571)
        val === "auto" || // Support: Android <=4.1 - 4.3 only
        // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
        !parseFloat(val) && jQuery.css(elem, "display", false, styles) === "inline") && // Make sure the element is visible & connected
        elem.getClientRects().length) {
          isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
          valueIsBorderBox = offsetProp in elem;
          if (valueIsBorderBox) {
            val = elem[offsetProp];
          }
        }
        val = parseFloat(val) || 0;
        return val + boxModelAdjustment(
          elem,
          dimension,
          extra || (isBorderBox ? "border" : "content"),
          valueIsBorderBox,
          styles,
          // Provide the current computed size to request scroll gutter calculation (gh-3589)
          val
        ) + "px";
      }
      jQuery.extend({
        // Add in style property hooks for overriding the default
        // behavior of getting and setting a style property
        cssHooks: {
          opacity: {
            get: function(elem, computed) {
              if (computed) {
                var ret = curCSS(elem, "opacity");
                return ret === "" ? "1" : ret;
              }
            }
          }
        },
        // Don't automatically add "px" to these possibly-unitless properties
        cssNumber: {
          animationIterationCount: true,
          aspectRatio: true,
          borderImageSlice: true,
          columnCount: true,
          flexGrow: true,
          flexShrink: true,
          fontWeight: true,
          gridArea: true,
          gridColumn: true,
          gridColumnEnd: true,
          gridColumnStart: true,
          gridRow: true,
          gridRowEnd: true,
          gridRowStart: true,
          lineHeight: true,
          opacity: true,
          order: true,
          orphans: true,
          scale: true,
          widows: true,
          zIndex: true,
          zoom: true,
          // SVG-related
          fillOpacity: true,
          floodOpacity: true,
          stopOpacity: true,
          strokeMiterlimit: true,
          strokeOpacity: true
        },
        // Add in properties whose names you wish to fix before
        // setting or getting the value
        cssProps: {},
        // Get and set the style property on a DOM Node
        style: function(elem, name, value, extra) {
          if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
            return;
          }
          var ret, type, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
          if (!isCustomProp) {
            name = finalPropName(origName);
          }
          hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
          if (value !== void 0) {
            type = typeof value;
            if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
              value = adjustCSS(elem, name, ret);
              type = "number";
            }
            if (value == null || value !== value) {
              return;
            }
            if (type === "number" && !isCustomProp) {
              value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
            }
            if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
              style[name] = "inherit";
            }
            if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== void 0) {
              if (isCustomProp) {
                style.setProperty(name, value);
              } else {
                style[name] = value;
              }
            }
          } else {
            if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== void 0) {
              return ret;
            }
            return style[name];
          }
        },
        css: function(elem, name, extra, styles) {
          var val, num, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name);
          if (!isCustomProp) {
            name = finalPropName(origName);
          }
          hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
          if (hooks && "get" in hooks) {
            val = hooks.get(elem, true, extra);
          }
          if (val === void 0) {
            val = curCSS(elem, name, styles);
          }
          if (val === "normal" && name in cssNormalTransform) {
            val = cssNormalTransform[name];
          }
          if (extra === "" || extra) {
            num = parseFloat(val);
            return extra === true || isFinite(num) ? num || 0 : val;
          }
          return val;
        }
      });
      jQuery.each(["height", "width"], function(_i, dimension) {
        jQuery.cssHooks[dimension] = {
          get: function(elem, computed, extra) {
            if (computed) {
              return rdisplayswap.test(jQuery.css(elem, "display")) && // Support: Safari 8+
              // Table columns in Safari have non-zero offsetWidth & zero
              // getBoundingClientRect().width unless display is changed.
              // Support: IE <=11 only
              // Running getBoundingClientRect on a disconnected node
              // in IE throws an error.
              (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function() {
                return getWidthOrHeight(elem, dimension, extra);
              }) : getWidthOrHeight(elem, dimension, extra);
            }
          },
          set: function(elem, value, extra) {
            var matches, styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === "absolute", boxSizingNeeded = scrollboxSizeBuggy || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(
              elem,
              dimension,
              extra,
              isBorderBox,
              styles
            ) : 0;
            if (isBorderBox && scrollboxSizeBuggy) {
              subtract -= Math.ceil(
                elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, "border", false, styles) - 0.5
              );
            }
            if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
              elem.style[dimension] = value;
              value = jQuery.css(elem, dimension);
            }
            return setPositiveNumber(elem, value, subtract);
          }
        };
      });
      jQuery.cssHooks.marginLeft = addGetHookIf(
        support.reliableMarginLeft,
        function(elem, computed) {
          if (computed) {
            return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, function() {
              return elem.getBoundingClientRect().left;
            })) + "px";
          }
        }
      );
      jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
      }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
          expand: function(value) {
            var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
            for (; i < 4; i++) {
              expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
            }
            return expanded;
          }
        };
        if (prefix !== "margin") {
          jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
        }
      });
      jQuery.fn.extend({
        css: function(name, value) {
          return access(this, function(elem, name2, value2) {
            var styles, len, map = {}, i = 0;
            if (Array.isArray(name2)) {
              styles = getStyles(elem);
              len = name2.length;
              for (; i < len; i++) {
                map[name2[i]] = jQuery.css(elem, name2[i], false, styles);
              }
              return map;
            }
            return value2 !== void 0 ? jQuery.style(elem, name2, value2) : jQuery.css(elem, name2);
          }, name, value, arguments.length > 1);
        }
      });
      function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
      }
      jQuery.Tween = Tween;
      Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
          this.elem = elem;
          this.prop = prop;
          this.easing = easing || jQuery.easing._default;
          this.options = options;
          this.start = this.now = this.cur();
          this.end = end;
          this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
          var hooks = Tween.propHooks[this.prop];
          return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
          var eased, hooks = Tween.propHooks[this.prop];
          if (this.options.duration) {
            this.pos = eased = jQuery.easing[this.easing](
              percent,
              this.options.duration * percent,
              0,
              1,
              this.options.duration
            );
          } else {
            this.pos = eased = percent;
          }
          this.now = (this.end - this.start) * eased + this.start;
          if (this.options.step) {
            this.options.step.call(this.elem, this.now, this);
          }
          if (hooks && hooks.set) {
            hooks.set(this);
          } else {
            Tween.propHooks._default.set(this);
          }
          return this;
        }
      };
      Tween.prototype.init.prototype = Tween.prototype;
      Tween.propHooks = {
        _default: {
          get: function(tween) {
            var result;
            if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
              return tween.elem[tween.prop];
            }
            result = jQuery.css(tween.elem, tween.prop, "");
            return !result || result === "auto" ? 0 : result;
          },
          set: function(tween) {
            if (jQuery.fx.step[tween.prop]) {
              jQuery.fx.step[tween.prop](tween);
            } else if (tween.elem.nodeType === 1 && (jQuery.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
              jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
            } else {
              tween.elem[tween.prop] = tween.now;
            }
          }
        }
      };
      Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
          if (tween.elem.nodeType && tween.elem.parentNode) {
            tween.elem[tween.prop] = tween.now;
          }
        }
      };
      jQuery.easing = {
        linear: function(p) {
          return p;
        },
        swing: function(p) {
          return 0.5 - Math.cos(p * Math.PI) / 2;
        },
        _default: "swing"
      };
      jQuery.fx = Tween.prototype.init;
      jQuery.fx.step = {};
      var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
      function schedule() {
        if (inProgress) {
          if (document2.hidden === false && window2.requestAnimationFrame) {
            window2.requestAnimationFrame(schedule);
          } else {
            window2.setTimeout(schedule, jQuery.fx.interval);
          }
          jQuery.fx.tick();
        }
      }
      function createFxNow() {
        window2.setTimeout(function() {
          fxNow = void 0;
        });
        return fxNow = Date.now();
      }
      function genFx(type, includeWidth) {
        var which, i = 0, attrs = { height: type };
        includeWidth = includeWidth ? 1 : 0;
        for (; i < 4; i += 2 - includeWidth) {
          which = cssExpand[i];
          attrs["margin" + which] = attrs["padding" + which] = type;
        }
        if (includeWidth) {
          attrs.opacity = attrs.width = type;
        }
        return attrs;
      }
      function createTween(value, prop, animation) {
        var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
        for (; index < length; index++) {
          if (tween = collection[index].call(animation, prop, value)) {
            return tween;
          }
        }
      }
      function defaultPrefilter(elem, props, opts) {
        var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
        if (!opts.queue) {
          hooks = jQuery._queueHooks(elem, "fx");
          if (hooks.unqueued == null) {
            hooks.unqueued = 0;
            oldfire = hooks.empty.fire;
            hooks.empty.fire = function() {
              if (!hooks.unqueued) {
                oldfire();
              }
            };
          }
          hooks.unqueued++;
          anim.always(function() {
            anim.always(function() {
              hooks.unqueued--;
              if (!jQuery.queue(elem, "fx").length) {
                hooks.empty.fire();
              }
            });
          });
        }
        for (prop in props) {
          value = props[prop];
          if (rfxtypes.test(value)) {
            delete props[prop];
            toggle = toggle || value === "toggle";
            if (value === (hidden ? "hide" : "show")) {
              if (value === "show" && dataShow && dataShow[prop] !== void 0) {
                hidden = true;
              } else {
                continue;
              }
            }
            orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
          }
        }
        propTween = !jQuery.isEmptyObject(props);
        if (!propTween && jQuery.isEmptyObject(orig)) {
          return;
        }
        if (isBox && elem.nodeType === 1) {
          opts.overflow = [style.overflow, style.overflowX, style.overflowY];
          restoreDisplay = dataShow && dataShow.display;
          if (restoreDisplay == null) {
            restoreDisplay = dataPriv.get(elem, "display");
          }
          display = jQuery.css(elem, "display");
          if (display === "none") {
            if (restoreDisplay) {
              display = restoreDisplay;
            } else {
              showHide([elem], true);
              restoreDisplay = elem.style.display || restoreDisplay;
              display = jQuery.css(elem, "display");
              showHide([elem]);
            }
          }
          if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
            if (jQuery.css(elem, "float") === "none") {
              if (!propTween) {
                anim.done(function() {
                  style.display = restoreDisplay;
                });
                if (restoreDisplay == null) {
                  display = style.display;
                  restoreDisplay = display === "none" ? "" : display;
                }
              }
              style.display = "inline-block";
            }
          }
        }
        if (opts.overflow) {
          style.overflow = "hidden";
          anim.always(function() {
            style.overflow = opts.overflow[0];
            style.overflowX = opts.overflow[1];
            style.overflowY = opts.overflow[2];
          });
        }
        propTween = false;
        for (prop in orig) {
          if (!propTween) {
            if (dataShow) {
              if ("hidden" in dataShow) {
                hidden = dataShow.hidden;
              }
            } else {
              dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
            }
            if (toggle) {
              dataShow.hidden = !hidden;
            }
            if (hidden) {
              showHide([elem], true);
            }
            anim.done(function() {
              if (!hidden) {
                showHide([elem]);
              }
              dataPriv.remove(elem, "fxshow");
              for (prop in orig) {
                jQuery.style(elem, prop, orig[prop]);
              }
            });
          }
          propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
          if (!(prop in dataShow)) {
            dataShow[prop] = propTween.start;
            if (hidden) {
              propTween.end = propTween.start;
              propTween.start = 0;
            }
          }
        }
      }
      function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        for (index in props) {
          name = camelCase(index);
          easing = specialEasing[name];
          value = props[index];
          if (Array.isArray(value)) {
            easing = value[1];
            value = props[index] = value[0];
          }
          if (index !== name) {
            props[name] = value;
            delete props[index];
          }
          hooks = jQuery.cssHooks[name];
          if (hooks && "expand" in hooks) {
            value = hooks.expand(value);
            delete props[name];
            for (index in value) {
              if (!(index in props)) {
                props[index] = value[index];
                specialEasing[index] = easing;
              }
            }
          } else {
            specialEasing[name] = easing;
          }
        }
      }
      function Animation(elem, properties, options) {
        var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery.Deferred().always(function() {
          delete tick.elem;
        }), tick = function() {
          if (stopped) {
            return false;
          }
          var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index2 = 0, length2 = animation.tweens.length;
          for (; index2 < length2; index2++) {
            animation.tweens[index2].run(percent);
          }
          deferred.notifyWith(elem, [animation, percent, remaining]);
          if (percent < 1 && length2) {
            return remaining;
          }
          if (!length2) {
            deferred.notifyWith(elem, [animation, 1, 0]);
          }
          deferred.resolveWith(elem, [animation]);
          return false;
        }, animation = deferred.promise({
          elem,
          props: jQuery.extend({}, properties),
          opts: jQuery.extend(true, {
            specialEasing: {},
            easing: jQuery.easing._default
          }, options),
          originalProperties: properties,
          originalOptions: options,
          startTime: fxNow || createFxNow(),
          duration: options.duration,
          tweens: [],
          createTween: function(prop, end) {
            var tween = jQuery.Tween(
              elem,
              animation.opts,
              prop,
              end,
              animation.opts.specialEasing[prop] || animation.opts.easing
            );
            animation.tweens.push(tween);
            return tween;
          },
          stop: function(gotoEnd) {
            var index2 = 0, length2 = gotoEnd ? animation.tweens.length : 0;
            if (stopped) {
              return this;
            }
            stopped = true;
            for (; index2 < length2; index2++) {
              animation.tweens[index2].run(1);
            }
            if (gotoEnd) {
              deferred.notifyWith(elem, [animation, 1, 0]);
              deferred.resolveWith(elem, [animation, gotoEnd]);
            } else {
              deferred.rejectWith(elem, [animation, gotoEnd]);
            }
            return this;
          }
        }), props = animation.props;
        propFilter(props, animation.opts.specialEasing);
        for (; index < length; index++) {
          result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
          if (result) {
            if (isFunction(result.stop)) {
              jQuery._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
            }
            return result;
          }
        }
        jQuery.map(props, createTween, animation);
        if (isFunction(animation.opts.start)) {
          animation.opts.start.call(elem, animation);
        }
        animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
        jQuery.fx.timer(
          jQuery.extend(tick, {
            elem,
            anim: animation,
            queue: animation.opts.queue
          })
        );
        return animation;
      }
      jQuery.Animation = jQuery.extend(Animation, {
        tweeners: {
          "*": [function(prop, value) {
            var tween = this.createTween(prop, value);
            adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
            return tween;
          }]
        },
        tweener: function(props, callback) {
          if (isFunction(props)) {
            callback = props;
            props = ["*"];
          } else {
            props = props.match(rnothtmlwhite);
          }
          var prop, index = 0, length = props.length;
          for (; index < length; index++) {
            prop = props[index];
            Animation.tweeners[prop] = Animation.tweeners[prop] || [];
            Animation.tweeners[prop].unshift(callback);
          }
        },
        prefilters: [defaultPrefilter],
        prefilter: function(callback, prepend) {
          if (prepend) {
            Animation.prefilters.unshift(callback);
          } else {
            Animation.prefilters.push(callback);
          }
        }
      });
      jQuery.speed = function(speed, easing, fn) {
        var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
          complete: fn || !fn && easing || isFunction(speed) && speed,
          duration: speed,
          easing: fn && easing || easing && !isFunction(easing) && easing
        };
        if (jQuery.fx.off) {
          opt.duration = 0;
        } else {
          if (typeof opt.duration !== "number") {
            if (opt.duration in jQuery.fx.speeds) {
              opt.duration = jQuery.fx.speeds[opt.duration];
            } else {
              opt.duration = jQuery.fx.speeds._default;
            }
          }
        }
        if (opt.queue == null || opt.queue === true) {
          opt.queue = "fx";
        }
        opt.old = opt.complete;
        opt.complete = function() {
          if (isFunction(opt.old)) {
            opt.old.call(this);
          }
          if (opt.queue) {
            jQuery.dequeue(this, opt.queue);
          }
        };
        return opt;
      };
      jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
          return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
          var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
            var anim = Animation(this, jQuery.extend({}, prop), optall);
            if (empty || dataPriv.get(this, "finish")) {
              anim.stop(true);
            }
          };
          doAnimation.finish = doAnimation;
          return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
          var stopQueue = function(hooks) {
            var stop = hooks.stop;
            delete hooks.stop;
            stop(gotoEnd);
          };
          if (typeof type !== "string") {
            gotoEnd = clearQueue;
            clearQueue = type;
            type = void 0;
          }
          if (clearQueue) {
            this.queue(type || "fx", []);
          }
          return this.each(function() {
            var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery.timers, data = dataPriv.get(this);
            if (index) {
              if (data[index] && data[index].stop) {
                stopQueue(data[index]);
              }
            } else {
              for (index in data) {
                if (data[index] && data[index].stop && rrun.test(index)) {
                  stopQueue(data[index]);
                }
              }
            }
            for (index = timers.length; index--; ) {
              if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                timers[index].anim.stop(gotoEnd);
                dequeue = false;
                timers.splice(index, 1);
              }
            }
            if (dequeue || !gotoEnd) {
              jQuery.dequeue(this, type);
            }
          });
        },
        finish: function(type) {
          if (type !== false) {
            type = type || "fx";
          }
          return this.each(function() {
            var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery.timers, length = queue ? queue.length : 0;
            data.finish = true;
            jQuery.queue(this, type, []);
            if (hooks && hooks.stop) {
              hooks.stop.call(this, true);
            }
            for (index = timers.length; index--; ) {
              if (timers[index].elem === this && timers[index].queue === type) {
                timers[index].anim.stop(true);
                timers.splice(index, 1);
              }
            }
            for (index = 0; index < length; index++) {
              if (queue[index] && queue[index].finish) {
                queue[index].finish.call(this);
              }
            }
            delete data.finish;
          });
        }
      });
      jQuery.each(["toggle", "show", "hide"], function(_i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
          return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
        };
      });
      jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: { opacity: "show" },
        fadeOut: { opacity: "hide" },
        fadeToggle: { opacity: "toggle" }
      }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
          return this.animate(props, speed, easing, callback);
        };
      });
      jQuery.timers = [];
      jQuery.fx.tick = function() {
        var timer, i = 0, timers = jQuery.timers;
        fxNow = Date.now();
        for (; i < timers.length; i++) {
          timer = timers[i];
          if (!timer() && timers[i] === timer) {
            timers.splice(i--, 1);
          }
        }
        if (!timers.length) {
          jQuery.fx.stop();
        }
        fxNow = void 0;
      };
      jQuery.fx.timer = function(timer) {
        jQuery.timers.push(timer);
        jQuery.fx.start();
      };
      jQuery.fx.interval = 13;
      jQuery.fx.start = function() {
        if (inProgress) {
          return;
        }
        inProgress = true;
        schedule();
      };
      jQuery.fx.stop = function() {
        inProgress = null;
      };
      jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        // Default speed
        _default: 400
      };
      jQuery.fn.delay = function(time, type) {
        time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
        type = type || "fx";
        return this.queue(type, function(next, hooks) {
          var timeout = window2.setTimeout(next, time);
          hooks.stop = function() {
            window2.clearTimeout(timeout);
          };
        });
      };
      (function() {
        var input = document2.createElement("input"), select = document2.createElement("select"), opt = select.appendChild(document2.createElement("option"));
        input.type = "checkbox";
        support.checkOn = input.value !== "";
        support.optSelected = opt.selected;
        input = document2.createElement("input");
        input.value = "t";
        input.type = "radio";
        support.radioValue = input.value === "t";
      })();
      var boolHook, attrHandle = jQuery.expr.attrHandle;
      jQuery.fn.extend({
        attr: function(name, value) {
          return access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
          return this.each(function() {
            jQuery.removeAttr(this, name);
          });
        }
      });
      jQuery.extend({
        attr: function(elem, name, value) {
          var ret, hooks, nType = elem.nodeType;
          if (nType === 3 || nType === 8 || nType === 2) {
            return;
          }
          if (typeof elem.getAttribute === "undefined") {
            return jQuery.prop(elem, name, value);
          }
          if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
            hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : void 0);
          }
          if (value !== void 0) {
            if (value === null) {
              jQuery.removeAttr(elem, name);
              return;
            }
            if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
              return ret;
            }
            elem.setAttribute(name, value + "");
            return value;
          }
          if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
            return ret;
          }
          ret = jQuery.find.attr(elem, name);
          return ret == null ? void 0 : ret;
        },
        attrHooks: {
          type: {
            set: function(elem, value) {
              if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
                var val = elem.value;
                elem.setAttribute("type", value);
                if (val) {
                  elem.value = val;
                }
                return value;
              }
            }
          }
        },
        removeAttr: function(elem, value) {
          var name, i = 0, attrNames = value && value.match(rnothtmlwhite);
          if (attrNames && elem.nodeType === 1) {
            while (name = attrNames[i++]) {
              elem.removeAttribute(name);
            }
          }
        }
      });
      boolHook = {
        set: function(elem, value, name) {
          if (value === false) {
            jQuery.removeAttr(elem, name);
          } else {
            elem.setAttribute(name, name);
          }
          return name;
        }
      };
      jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(_i, name) {
        var getter = attrHandle[name] || jQuery.find.attr;
        attrHandle[name] = function(elem, name2, isXML) {
          var ret, handle, lowercaseName = name2.toLowerCase();
          if (!isXML) {
            handle = attrHandle[lowercaseName];
            attrHandle[lowercaseName] = ret;
            ret = getter(elem, name2, isXML) != null ? lowercaseName : null;
            attrHandle[lowercaseName] = handle;
          }
          return ret;
        };
      });
      var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
      jQuery.fn.extend({
        prop: function(name, value) {
          return access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
          return this.each(function() {
            delete this[jQuery.propFix[name] || name];
          });
        }
      });
      jQuery.extend({
        prop: function(elem, name, value) {
          var ret, hooks, nType = elem.nodeType;
          if (nType === 3 || nType === 8 || nType === 2) {
            return;
          }
          if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
            name = jQuery.propFix[name] || name;
            hooks = jQuery.propHooks[name];
          }
          if (value !== void 0) {
            if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
              return ret;
            }
            return elem[name] = value;
          }
          if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
            return ret;
          }
          return elem[name];
        },
        propHooks: {
          tabIndex: {
            get: function(elem) {
              var tabindex = jQuery.find.attr(elem, "tabindex");
              if (tabindex) {
                return parseInt(tabindex, 10);
              }
              if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
                return 0;
              }
              return -1;
            }
          }
        },
        propFix: {
          "for": "htmlFor",
          "class": "className"
        }
      });
      if (!support.optSelected) {
        jQuery.propHooks.selected = {
          get: function(elem) {
            var parent = elem.parentNode;
            if (parent && parent.parentNode) {
              parent.parentNode.selectedIndex;
            }
            return null;
          },
          set: function(elem) {
            var parent = elem.parentNode;
            if (parent) {
              parent.selectedIndex;
              if (parent.parentNode) {
                parent.parentNode.selectedIndex;
              }
            }
          }
        };
      }
      jQuery.each([
        "tabIndex",
        "readOnly",
        "maxLength",
        "cellSpacing",
        "cellPadding",
        "rowSpan",
        "colSpan",
        "useMap",
        "frameBorder",
        "contentEditable"
      ], function() {
        jQuery.propFix[this.toLowerCase()] = this;
      });
      function stripAndCollapse(value) {
        var tokens = value.match(rnothtmlwhite) || [];
        return tokens.join(" ");
      }
      function getClass(elem) {
        return elem.getAttribute && elem.getAttribute("class") || "";
      }
      function classesToArray(value) {
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === "string") {
          return value.match(rnothtmlwhite) || [];
        }
        return [];
      }
      jQuery.fn.extend({
        addClass: function(value) {
          var classNames, cur, curValue, className, i, finalValue;
          if (isFunction(value)) {
            return this.each(function(j) {
              jQuery(this).addClass(value.call(this, j, getClass(this)));
            });
          }
          classNames = classesToArray(value);
          if (classNames.length) {
            return this.each(function() {
              curValue = getClass(this);
              cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
              if (cur) {
                for (i = 0; i < classNames.length; i++) {
                  className = classNames[i];
                  if (cur.indexOf(" " + className + " ") < 0) {
                    cur += className + " ";
                  }
                }
                finalValue = stripAndCollapse(cur);
                if (curValue !== finalValue) {
                  this.setAttribute("class", finalValue);
                }
              }
            });
          }
          return this;
        },
        removeClass: function(value) {
          var classNames, cur, curValue, className, i, finalValue;
          if (isFunction(value)) {
            return this.each(function(j) {
              jQuery(this).removeClass(value.call(this, j, getClass(this)));
            });
          }
          if (!arguments.length) {
            return this.attr("class", "");
          }
          classNames = classesToArray(value);
          if (classNames.length) {
            return this.each(function() {
              curValue = getClass(this);
              cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
              if (cur) {
                for (i = 0; i < classNames.length; i++) {
                  className = classNames[i];
                  while (cur.indexOf(" " + className + " ") > -1) {
                    cur = cur.replace(" " + className + " ", " ");
                  }
                }
                finalValue = stripAndCollapse(cur);
                if (curValue !== finalValue) {
                  this.setAttribute("class", finalValue);
                }
              }
            });
          }
          return this;
        },
        toggleClass: function(value, stateVal) {
          var classNames, className, i, self, type = typeof value, isValidValue = type === "string" || Array.isArray(value);
          if (isFunction(value)) {
            return this.each(function(i2) {
              jQuery(this).toggleClass(
                value.call(this, i2, getClass(this), stateVal),
                stateVal
              );
            });
          }
          if (typeof stateVal === "boolean" && isValidValue) {
            return stateVal ? this.addClass(value) : this.removeClass(value);
          }
          classNames = classesToArray(value);
          return this.each(function() {
            if (isValidValue) {
              self = jQuery(this);
              for (i = 0; i < classNames.length; i++) {
                className = classNames[i];
                if (self.hasClass(className)) {
                  self.removeClass(className);
                } else {
                  self.addClass(className);
                }
              }
            } else if (value === void 0 || type === "boolean") {
              className = getClass(this);
              if (className) {
                dataPriv.set(this, "__className__", className);
              }
              if (this.setAttribute) {
                this.setAttribute(
                  "class",
                  className || value === false ? "" : dataPriv.get(this, "__className__") || ""
                );
              }
            }
          });
        },
        hasClass: function(selector) {
          var className, elem, i = 0;
          className = " " + selector + " ";
          while (elem = this[i++]) {
            if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
              return true;
            }
          }
          return false;
        }
      });
      var rreturn = /\r/g;
      jQuery.fn.extend({
        val: function(value) {
          var hooks, ret, valueIsFunction, elem = this[0];
          if (!arguments.length) {
            if (elem) {
              hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
              if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== void 0) {
                return ret;
              }
              ret = elem.value;
              if (typeof ret === "string") {
                return ret.replace(rreturn, "");
              }
              return ret == null ? "" : ret;
            }
            return;
          }
          valueIsFunction = isFunction(value);
          return this.each(function(i) {
            var val;
            if (this.nodeType !== 1) {
              return;
            }
            if (valueIsFunction) {
              val = value.call(this, i, jQuery(this).val());
            } else {
              val = value;
            }
            if (val == null) {
              val = "";
            } else if (typeof val === "number") {
              val += "";
            } else if (Array.isArray(val)) {
              val = jQuery.map(val, function(value2) {
                return value2 == null ? "" : value2 + "";
              });
            }
            hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
            if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === void 0) {
              this.value = val;
            }
          });
        }
      });
      jQuery.extend({
        valHooks: {
          option: {
            get: function(elem) {
              var val = jQuery.find.attr(elem, "value");
              return val != null ? val : (
                // Support: IE <=10 - 11 only
                // option.text throws exceptions (trac-14686, trac-14858)
                // Strip and collapse whitespace
                // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
                stripAndCollapse(jQuery.text(elem))
              );
            }
          },
          select: {
            get: function(elem) {
              var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
              if (index < 0) {
                i = max;
              } else {
                i = one ? index : 0;
              }
              for (; i < max; i++) {
                option = options[i];
                if ((option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
                !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                  value = jQuery(option).val();
                  if (one) {
                    return value;
                  }
                  values.push(value);
                }
              }
              return values;
            },
            set: function(elem, value) {
              var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length;
              while (i--) {
                option = options[i];
                if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
                  optionSet = true;
                }
              }
              if (!optionSet) {
                elem.selectedIndex = -1;
              }
              return values;
            }
          }
        }
      });
      jQuery.each(["radio", "checkbox"], function() {
        jQuery.valHooks[this] = {
          set: function(elem, value) {
            if (Array.isArray(value)) {
              return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
            }
          }
        };
        if (!support.checkOn) {
          jQuery.valHooks[this].get = function(elem) {
            return elem.getAttribute("value") === null ? "on" : elem.value;
          };
        }
      });
      var location = window2.location;
      var nonce = { guid: Date.now() };
      var rquery = /\?/;
      jQuery.parseXML = function(data) {
        var xml, parserErrorElem;
        if (!data || typeof data !== "string") {
          return null;
        }
        try {
          xml = new window2.DOMParser().parseFromString(data, "text/xml");
        } catch (e) {
        }
        parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
        if (!xml || parserErrorElem) {
          jQuery.error("Invalid XML: " + (parserErrorElem ? jQuery.map(parserErrorElem.childNodes, function(el) {
            return el.textContent;
          }).join("\n") : data));
        }
        return xml;
      };
      var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function(e) {
        e.stopPropagation();
      };
      jQuery.extend(jQuery.event, {
        trigger: function(event, data, elem, onlyHandlers) {
          var i, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document2], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
          cur = lastElement = tmp = elem = elem || document2;
          if (elem.nodeType === 3 || elem.nodeType === 8) {
            return;
          }
          if (rfocusMorph.test(type + jQuery.event.triggered)) {
            return;
          }
          if (type.indexOf(".") > -1) {
            namespaces = type.split(".");
            type = namespaces.shift();
            namespaces.sort();
          }
          ontype = type.indexOf(":") < 0 && "on" + type;
          event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
          event.isTrigger = onlyHandlers ? 2 : 3;
          event.namespace = namespaces.join(".");
          event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
          event.result = void 0;
          if (!event.target) {
            event.target = elem;
          }
          data = data == null ? [event] : jQuery.makeArray(data, [event]);
          special = jQuery.event.special[type] || {};
          if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
            return;
          }
          if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
            bubbleType = special.delegateType || type;
            if (!rfocusMorph.test(bubbleType + type)) {
              cur = cur.parentNode;
            }
            for (; cur; cur = cur.parentNode) {
              eventPath.push(cur);
              tmp = cur;
            }
            if (tmp === (elem.ownerDocument || document2)) {
              eventPath.push(tmp.defaultView || tmp.parentWindow || window2);
            }
          }
          i = 0;
          while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
            lastElement = cur;
            event.type = i > 1 ? bubbleType : special.bindType || type;
            handle = (dataPriv.get(cur, "events") || /* @__PURE__ */ Object.create(null))[event.type] && dataPriv.get(cur, "handle");
            if (handle) {
              handle.apply(cur, data);
            }
            handle = ontype && cur[ontype];
            if (handle && handle.apply && acceptData(cur)) {
              event.result = handle.apply(cur, data);
              if (event.result === false) {
                event.preventDefault();
              }
            }
          }
          event.type = type;
          if (!onlyHandlers && !event.isDefaultPrevented()) {
            if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
              if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
                tmp = elem[ontype];
                if (tmp) {
                  elem[ontype] = null;
                }
                jQuery.event.triggered = type;
                if (event.isPropagationStopped()) {
                  lastElement.addEventListener(type, stopPropagationCallback);
                }
                elem[type]();
                if (event.isPropagationStopped()) {
                  lastElement.removeEventListener(type, stopPropagationCallback);
                }
                jQuery.event.triggered = void 0;
                if (tmp) {
                  elem[ontype] = tmp;
                }
              }
            }
          }
          return event.result;
        },
        // Piggyback on a donor event to simulate a different one
        // Used only for `focus(in | out)` events
        simulate: function(type, elem, event) {
          var e = jQuery.extend(
            new jQuery.Event(),
            event,
            {
              type,
              isSimulated: true
            }
          );
          jQuery.event.trigger(e, null, elem);
        }
      });
      jQuery.fn.extend({
        trigger: function(type, data) {
          return this.each(function() {
            jQuery.event.trigger(type, data, this);
          });
        },
        triggerHandler: function(type, data) {
          var elem = this[0];
          if (elem) {
            return jQuery.event.trigger(type, data, elem, true);
          }
        }
      });
      var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
      function buildParams(prefix, obj, traditional, add) {
        var name;
        if (Array.isArray(obj)) {
          jQuery.each(obj, function(i, v) {
            if (traditional || rbracket.test(prefix)) {
              add(prefix, v);
            } else {
              buildParams(
                prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                v,
                traditional,
                add
              );
            }
          });
        } else if (!traditional && toType(obj) === "object") {
          for (name in obj) {
            buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
          }
        } else {
          add(prefix, obj);
        }
      }
      jQuery.param = function(a, traditional) {
        var prefix, s = [], add = function(key, valueOrFunction) {
          var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
          s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
        };
        if (a == null) {
          return "";
        }
        if (Array.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
          jQuery.each(a, function() {
            add(this.name, this.value);
          });
        } else {
          for (prefix in a) {
            buildParams(prefix, a[prefix], traditional, add);
          }
        }
        return s.join("&");
      };
      jQuery.fn.extend({
        serialize: function() {
          return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
          return this.map(function() {
            var elements = jQuery.prop(this, "elements");
            return elements ? jQuery.makeArray(elements) : this;
          }).filter(function() {
            var type = this.type;
            return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
          }).map(function(_i, elem) {
            var val = jQuery(this).val();
            if (val == null) {
              return null;
            }
            if (Array.isArray(val)) {
              return jQuery.map(val, function(val2) {
                return { name: elem.name, value: val2.replace(rCRLF, "\r\n") };
              });
            }
            return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
          }).get();
        }
      });
      var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document2.createElement("a");
      originAnchor.href = location.href;
      function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
          if (typeof dataTypeExpression !== "string") {
            func = dataTypeExpression;
            dataTypeExpression = "*";
          }
          var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
          if (isFunction(func)) {
            while (dataType = dataTypes[i++]) {
              if (dataType[0] === "+") {
                dataType = dataType.slice(1) || "*";
                (structure[dataType] = structure[dataType] || []).unshift(func);
              } else {
                (structure[dataType] = structure[dataType] || []).push(func);
              }
            }
          }
        };
      }
      function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
        var inspected = {}, seekingTransport = structure === transports;
        function inspect(dataType) {
          var selected;
          inspected[dataType] = true;
          jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
            var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
            if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
              options.dataTypes.unshift(dataTypeOrTransport);
              inspect(dataTypeOrTransport);
              return false;
            } else if (seekingTransport) {
              return !(selected = dataTypeOrTransport);
            }
          });
          return selected;
        }
        return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
      }
      function ajaxExtend(target, src) {
        var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) {
          if (src[key] !== void 0) {
            (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
          }
        }
        if (deep) {
          jQuery.extend(true, target, deep);
        }
        return target;
      }
      function ajaxHandleResponses(s, jqXHR, responses) {
        var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
        while (dataTypes[0] === "*") {
          dataTypes.shift();
          if (ct === void 0) {
            ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
          }
        }
        if (ct) {
          for (type in contents) {
            if (contents[type] && contents[type].test(ct)) {
              dataTypes.unshift(type);
              break;
            }
          }
        }
        if (dataTypes[0] in responses) {
          finalDataType = dataTypes[0];
        } else {
          for (type in responses) {
            if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
              finalDataType = type;
              break;
            }
            if (!firstDataType) {
              firstDataType = type;
            }
          }
          finalDataType = finalDataType || firstDataType;
        }
        if (finalDataType) {
          if (finalDataType !== dataTypes[0]) {
            dataTypes.unshift(finalDataType);
          }
          return responses[finalDataType];
        }
      }
      function ajaxConvert(s, response, jqXHR, isSuccess) {
        var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
        if (dataTypes[1]) {
          for (conv in s.converters) {
            converters[conv.toLowerCase()] = s.converters[conv];
          }
        }
        current = dataTypes.shift();
        while (current) {
          if (s.responseFields[current]) {
            jqXHR[s.responseFields[current]] = response;
          }
          if (!prev && isSuccess && s.dataFilter) {
            response = s.dataFilter(response, s.dataType);
          }
          prev = current;
          current = dataTypes.shift();
          if (current) {
            if (current === "*") {
              current = prev;
            } else if (prev !== "*" && prev !== current) {
              conv = converters[prev + " " + current] || converters["* " + current];
              if (!conv) {
                for (conv2 in converters) {
                  tmp = conv2.split(" ");
                  if (tmp[1] === current) {
                    conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                    if (conv) {
                      if (conv === true) {
                        conv = converters[conv2];
                      } else if (converters[conv2] !== true) {
                        current = tmp[0];
                        dataTypes.unshift(tmp[1]);
                      }
                      break;
                    }
                  }
                }
              }
              if (conv !== true) {
                if (conv && s.throws) {
                  response = conv(response);
                } else {
                  try {
                    response = conv(response);
                  } catch (e) {
                    return {
                      state: "parsererror",
                      error: conv ? e : "No conversion from " + prev + " to " + current
                    };
                  }
                }
              }
            }
          }
        }
        return { state: "success", data: response };
      }
      jQuery.extend({
        // Counter for holding the number of active queries
        active: 0,
        // Last-Modified header cache for next request
        lastModified: {},
        etag: {},
        ajaxSettings: {
          url: location.href,
          type: "GET",
          isLocal: rlocalProtocol.test(location.protocol),
          global: true,
          processData: true,
          async: true,
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          /*
          timeout: 0,
          data: null,
          dataType: null,
          username: null,
          password: null,
          cache: null,
          throws: false,
          traditional: false,
          headers: {},
          */
          accepts: {
            "*": allTypes,
            text: "text/plain",
            html: "text/html",
            xml: "application/xml, text/xml",
            json: "application/json, text/javascript"
          },
          contents: {
            xml: /\bxml\b/,
            html: /\bhtml/,
            json: /\bjson\b/
          },
          responseFields: {
            xml: "responseXML",
            text: "responseText",
            json: "responseJSON"
          },
          // Data converters
          // Keys separate source (or catchall "*") and destination types with a single space
          converters: {
            // Convert anything to text
            "* text": String,
            // Text to html (true = no transformation)
            "text html": true,
            // Evaluate text as a json expression
            "text json": JSON.parse,
            // Parse text as xml
            "text xml": jQuery.parseXML
          },
          // For options that shouldn't be deep extended:
          // you can add your own custom options here if
          // and when you create one that shouldn't be
          // deep extended (see ajaxExtend)
          flatOptions: {
            url: true,
            context: true
          }
        },
        // Creates a full fledged settings object into target
        // with both ajaxSettings and settings fields.
        // If target is omitted, writes into ajaxSettings.
        ajaxSetup: function(target, settings) {
          return settings ? (
            // Building a settings object
            ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings)
          ) : (
            // Extending ajaxSettings
            ajaxExtend(jQuery.ajaxSettings, target)
          );
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        // Main method
        ajax: function(url, options) {
          if (typeof url === "object") {
            options = url;
            url = void 0;
          }
          options = options || {};
          var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed2, fireGlobals, i, uncached, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
            readyState: 0,
            // Builds headers hashtable if needed
            getResponseHeader: function(key) {
              var match;
              if (completed2) {
                if (!responseHeaders) {
                  responseHeaders = {};
                  while (match = rheaders.exec(responseHeadersString)) {
                    responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
                  }
                }
                match = responseHeaders[key.toLowerCase() + " "];
              }
              return match == null ? null : match.join(", ");
            },
            // Raw string
            getAllResponseHeaders: function() {
              return completed2 ? responseHeadersString : null;
            },
            // Caches the header
            setRequestHeader: function(name, value) {
              if (completed2 == null) {
                name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
                requestHeaders[name] = value;
              }
              return this;
            },
            // Overrides response content-type header
            overrideMimeType: function(type) {
              if (completed2 == null) {
                s.mimeType = type;
              }
              return this;
            },
            // Status-dependent callbacks
            statusCode: function(map) {
              var code;
              if (map) {
                if (completed2) {
                  jqXHR.always(map[jqXHR.status]);
                } else {
                  for (code in map) {
                    statusCode[code] = [statusCode[code], map[code]];
                  }
                }
              }
              return this;
            },
            // Cancel the request
            abort: function(statusText) {
              var finalText = statusText || strAbort;
              if (transport) {
                transport.abort(finalText);
              }
              done(0, finalText);
              return this;
            }
          };
          deferred.promise(jqXHR);
          s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
          s.type = options.method || options.type || s.method || s.type;
          s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
          if (s.crossDomain == null) {
            urlAnchor = document2.createElement("a");
            try {
              urlAnchor.href = s.url;
              urlAnchor.href = urlAnchor.href;
              s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
            } catch (e) {
              s.crossDomain = true;
            }
          }
          if (s.data && s.processData && typeof s.data !== "string") {
            s.data = jQuery.param(s.data, s.traditional);
          }
          inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
          if (completed2) {
            return jqXHR;
          }
          fireGlobals = jQuery.event && s.global;
          if (fireGlobals && jQuery.active++ === 0) {
            jQuery.event.trigger("ajaxStart");
          }
          s.type = s.type.toUpperCase();
          s.hasContent = !rnoContent.test(s.type);
          cacheURL = s.url.replace(rhash, "");
          if (!s.hasContent) {
            uncached = s.url.slice(cacheURL.length);
            if (s.data && (s.processData || typeof s.data === "string")) {
              cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
              delete s.data;
            }
            if (s.cache === false) {
              cacheURL = cacheURL.replace(rantiCache, "$1");
              uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
            }
            s.url = cacheURL + uncached;
          } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
            s.data = s.data.replace(r20, "+");
          }
          if (s.ifModified) {
            if (jQuery.lastModified[cacheURL]) {
              jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
            }
            if (jQuery.etag[cacheURL]) {
              jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
            }
          }
          if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
            jqXHR.setRequestHeader("Content-Type", s.contentType);
          }
          jqXHR.setRequestHeader(
            "Accept",
            s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]
          );
          for (i in s.headers) {
            jqXHR.setRequestHeader(i, s.headers[i]);
          }
          if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed2)) {
            return jqXHR.abort();
          }
          strAbort = "abort";
          completeDeferred.add(s.complete);
          jqXHR.done(s.success);
          jqXHR.fail(s.error);
          transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
          if (!transport) {
            done(-1, "No Transport");
          } else {
            jqXHR.readyState = 1;
            if (fireGlobals) {
              globalEventContext.trigger("ajaxSend", [jqXHR, s]);
            }
            if (completed2) {
              return jqXHR;
            }
            if (s.async && s.timeout > 0) {
              timeoutTimer = window2.setTimeout(function() {
                jqXHR.abort("timeout");
              }, s.timeout);
            }
            try {
              completed2 = false;
              transport.send(requestHeaders, done);
            } catch (e) {
              if (completed2) {
                throw e;
              }
              done(-1, e);
            }
          }
          function done(status, nativeStatusText, responses, headers) {
            var isSuccess, success, error, response, modified, statusText = nativeStatusText;
            if (completed2) {
              return;
            }
            completed2 = true;
            if (timeoutTimer) {
              window2.clearTimeout(timeoutTimer);
            }
            transport = void 0;
            responseHeadersString = headers || "";
            jqXHR.readyState = status > 0 ? 4 : 0;
            isSuccess = status >= 200 && status < 300 || status === 304;
            if (responses) {
              response = ajaxHandleResponses(s, jqXHR, responses);
            }
            if (!isSuccess && jQuery.inArray("script", s.dataTypes) > -1 && jQuery.inArray("json", s.dataTypes) < 0) {
              s.converters["text script"] = function() {
              };
            }
            response = ajaxConvert(s, response, jqXHR, isSuccess);
            if (isSuccess) {
              if (s.ifModified) {
                modified = jqXHR.getResponseHeader("Last-Modified");
                if (modified) {
                  jQuery.lastModified[cacheURL] = modified;
                }
                modified = jqXHR.getResponseHeader("etag");
                if (modified) {
                  jQuery.etag[cacheURL] = modified;
                }
              }
              if (status === 204 || s.type === "HEAD") {
                statusText = "nocontent";
              } else if (status === 304) {
                statusText = "notmodified";
              } else {
                statusText = response.state;
                success = response.data;
                error = response.error;
                isSuccess = !error;
              }
            } else {
              error = statusText;
              if (status || !statusText) {
                statusText = "error";
                if (status < 0) {
                  status = 0;
                }
              }
            }
            jqXHR.status = status;
            jqXHR.statusText = (nativeStatusText || statusText) + "";
            if (isSuccess) {
              deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
            } else {
              deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
            }
            jqXHR.statusCode(statusCode);
            statusCode = void 0;
            if (fireGlobals) {
              globalEventContext.trigger(
                isSuccess ? "ajaxSuccess" : "ajaxError",
                [jqXHR, s, isSuccess ? success : error]
              );
            }
            completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
            if (fireGlobals) {
              globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
              if (!--jQuery.active) {
                jQuery.event.trigger("ajaxStop");
              }
            }
          }
          return jqXHR;
        },
        getJSON: function(url, data, callback) {
          return jQuery.get(url, data, callback, "json");
        },
        getScript: function(url, callback) {
          return jQuery.get(url, void 0, callback, "script");
        }
      });
      jQuery.each(["get", "post"], function(_i, method) {
        jQuery[method] = function(url, data, callback, type) {
          if (isFunction(data)) {
            type = type || callback;
            callback = data;
            data = void 0;
          }
          return jQuery.ajax(jQuery.extend({
            url,
            type: method,
            dataType: type,
            data,
            success: callback
          }, jQuery.isPlainObject(url) && url));
        };
      });
      jQuery.ajaxPrefilter(function(s) {
        var i;
        for (i in s.headers) {
          if (i.toLowerCase() === "content-type") {
            s.contentType = s.headers[i] || "";
          }
        }
      });
      jQuery._evalUrl = function(url, options, doc) {
        return jQuery.ajax({
          url,
          // Make this explicit, since user can override this through ajaxSetup (trac-11264)
          type: "GET",
          dataType: "script",
          cache: true,
          async: false,
          global: false,
          // Only evaluate the response if it is successful (gh-4126)
          // dataFilter is not invoked for failure responses, so using it instead
          // of the default converter is kludgy but it works.
          converters: {
            "text script": function() {
            }
          },
          dataFilter: function(response) {
            jQuery.globalEval(response, options, doc);
          }
        });
      };
      jQuery.fn.extend({
        wrapAll: function(html) {
          var wrap;
          if (this[0]) {
            if (isFunction(html)) {
              html = html.call(this[0]);
            }
            wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
            if (this[0].parentNode) {
              wrap.insertBefore(this[0]);
            }
            wrap.map(function() {
              var elem = this;
              while (elem.firstElementChild) {
                elem = elem.firstElementChild;
              }
              return elem;
            }).append(this);
          }
          return this;
        },
        wrapInner: function(html) {
          if (isFunction(html)) {
            return this.each(function(i) {
              jQuery(this).wrapInner(html.call(this, i));
            });
          }
          return this.each(function() {
            var self = jQuery(this), contents = self.contents();
            if (contents.length) {
              contents.wrapAll(html);
            } else {
              self.append(html);
            }
          });
        },
        wrap: function(html) {
          var htmlIsFunction = isFunction(html);
          return this.each(function(i) {
            jQuery(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
          });
        },
        unwrap: function(selector) {
          this.parent(selector).not("body").each(function() {
            jQuery(this).replaceWith(this.childNodes);
          });
          return this;
        }
      });
      jQuery.expr.pseudos.hidden = function(elem) {
        return !jQuery.expr.pseudos.visible(elem);
      };
      jQuery.expr.pseudos.visible = function(elem) {
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
      };
      jQuery.ajaxSettings.xhr = function() {
        try {
          return new window2.XMLHttpRequest();
        } catch (e) {
        }
      };
      var xhrSuccessStatus = {
        // File protocol always yields status code 0, assume 200
        0: 200,
        // Support: IE <=9 only
        // trac-1450: sometimes IE returns 1223 when it should be 204
        1223: 204
      }, xhrSupported = jQuery.ajaxSettings.xhr();
      support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
      support.ajax = xhrSupported = !!xhrSupported;
      jQuery.ajaxTransport(function(options) {
        var callback, errorCallback;
        if (support.cors || xhrSupported && !options.crossDomain) {
          return {
            send: function(headers, complete) {
              var i, xhr = options.xhr();
              xhr.open(
                options.type,
                options.url,
                options.async,
                options.username,
                options.password
              );
              if (options.xhrFields) {
                for (i in options.xhrFields) {
                  xhr[i] = options.xhrFields[i];
                }
              }
              if (options.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(options.mimeType);
              }
              if (!options.crossDomain && !headers["X-Requested-With"]) {
                headers["X-Requested-With"] = "XMLHttpRequest";
              }
              for (i in headers) {
                xhr.setRequestHeader(i, headers[i]);
              }
              callback = function(type) {
                return function() {
                  if (callback) {
                    callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
                    if (type === "abort") {
                      xhr.abort();
                    } else if (type === "error") {
                      if (typeof xhr.status !== "number") {
                        complete(0, "error");
                      } else {
                        complete(
                          // File: protocol always yields status 0; see trac-8605, trac-14207
                          xhr.status,
                          xhr.statusText
                        );
                      }
                    } else {
                      complete(
                        xhrSuccessStatus[xhr.status] || xhr.status,
                        xhr.statusText,
                        // Support: IE <=9 only
                        // IE9 has no XHR2 but throws on binary (trac-11426)
                        // For XHR2 non-text, let the caller handle it (gh-2498)
                        (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? { binary: xhr.response } : { text: xhr.responseText },
                        xhr.getAllResponseHeaders()
                      );
                    }
                  }
                };
              };
              xhr.onload = callback();
              errorCallback = xhr.onerror = xhr.ontimeout = callback("error");
              if (xhr.onabort !== void 0) {
                xhr.onabort = errorCallback;
              } else {
                xhr.onreadystatechange = function() {
                  if (xhr.readyState === 4) {
                    window2.setTimeout(function() {
                      if (callback) {
                        errorCallback();
                      }
                    });
                  }
                };
              }
              callback = callback("abort");
              try {
                xhr.send(options.hasContent && options.data || null);
              } catch (e) {
                if (callback) {
                  throw e;
                }
              }
            },
            abort: function() {
              if (callback) {
                callback();
              }
            }
          };
        }
      });
      jQuery.ajaxPrefilter(function(s) {
        if (s.crossDomain) {
          s.contents.script = false;
        }
      });
      jQuery.ajaxSetup({
        accepts: {
          script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
          script: /\b(?:java|ecma)script\b/
        },
        converters: {
          "text script": function(text) {
            jQuery.globalEval(text);
            return text;
          }
        }
      });
      jQuery.ajaxPrefilter("script", function(s) {
        if (s.cache === void 0) {
          s.cache = false;
        }
        if (s.crossDomain) {
          s.type = "GET";
        }
      });
      jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain || s.scriptAttrs) {
          var script, callback;
          return {
            send: function(_, complete) {
              script = jQuery("<script>").attr(s.scriptAttrs || {}).prop({ charset: s.scriptCharset, src: s.url }).on("load error", callback = function(evt) {
                script.remove();
                callback = null;
                if (evt) {
                  complete(evt.type === "error" ? 404 : 200, evt.type);
                }
              });
              document2.head.appendChild(script[0]);
            },
            abort: function() {
              if (callback) {
                callback();
              }
            }
          };
        }
      });
      var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
      jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
          var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce.guid++;
          this[callback] = true;
          return callback;
        }
      });
      jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
        if (jsonProp || s.dataTypes[0] === "jsonp") {
          callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
          if (jsonProp) {
            s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
          } else if (s.jsonp !== false) {
            s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
          }
          s.converters["script json"] = function() {
            if (!responseContainer) {
              jQuery.error(callbackName + " was not called");
            }
            return responseContainer[0];
          };
          s.dataTypes[0] = "json";
          overwritten = window2[callbackName];
          window2[callbackName] = function() {
            responseContainer = arguments;
          };
          jqXHR.always(function() {
            if (overwritten === void 0) {
              jQuery(window2).removeProp(callbackName);
            } else {
              window2[callbackName] = overwritten;
            }
            if (s[callbackName]) {
              s.jsonpCallback = originalSettings.jsonpCallback;
              oldCallbacks.push(callbackName);
            }
            if (responseContainer && isFunction(overwritten)) {
              overwritten(responseContainer[0]);
            }
            responseContainer = overwritten = void 0;
          });
          return "script";
        }
      });
      support.createHTMLDocument = function() {
        var body = document2.implementation.createHTMLDocument("").body;
        body.innerHTML = "<form></form><form></form>";
        return body.childNodes.length === 2;
      }();
      jQuery.parseHTML = function(data, context, keepScripts) {
        if (typeof data !== "string") {
          return [];
        }
        if (typeof context === "boolean") {
          keepScripts = context;
          context = false;
        }
        var base, parsed, scripts;
        if (!context) {
          if (support.createHTMLDocument) {
            context = document2.implementation.createHTMLDocument("");
            base = context.createElement("base");
            base.href = document2.location.href;
            context.head.appendChild(base);
          } else {
            context = document2;
          }
        }
        parsed = rsingleTag.exec(data);
        scripts = !keepScripts && [];
        if (parsed) {
          return [context.createElement(parsed[1])];
        }
        parsed = buildFragment([data], context, scripts);
        if (scripts && scripts.length) {
          jQuery(scripts).remove();
        }
        return jQuery.merge([], parsed.childNodes);
      };
      jQuery.fn.load = function(url, params, callback) {
        var selector, type, response, self = this, off = url.indexOf(" ");
        if (off > -1) {
          selector = stripAndCollapse(url.slice(off));
          url = url.slice(0, off);
        }
        if (isFunction(params)) {
          callback = params;
          params = void 0;
        } else if (params && typeof params === "object") {
          type = "POST";
        }
        if (self.length > 0) {
          jQuery.ajax({
            url,
            // If "type" variable is undefined, then "GET" method will be used.
            // Make value of this field explicit since
            // user can override it through ajaxSetup method
            type: type || "GET",
            dataType: "html",
            data: params
          }).done(function(responseText) {
            response = arguments;
            self.html(selector ? (
              // If a selector was specified, locate the right elements in a dummy div
              // Exclude scripts to avoid IE 'Permission Denied' errors
              jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector)
            ) : (
              // Otherwise use the full result
              responseText
            ));
          }).always(callback && function(jqXHR, status) {
            self.each(function() {
              callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
            });
          });
        }
        return this;
      };
      jQuery.expr.pseudos.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
          return elem === fn.elem;
        }).length;
      };
      jQuery.offset = {
        setOffset: function(elem, options, i) {
          var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"), curElem = jQuery(elem), props = {};
          if (position === "static") {
            elem.style.position = "relative";
          }
          curOffset = curElem.offset();
          curCSSTop = jQuery.css(elem, "top");
          curCSSLeft = jQuery.css(elem, "left");
          calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
          if (calculatePosition) {
            curPosition = curElem.position();
            curTop = curPosition.top;
            curLeft = curPosition.left;
          } else {
            curTop = parseFloat(curCSSTop) || 0;
            curLeft = parseFloat(curCSSLeft) || 0;
          }
          if (isFunction(options)) {
            options = options.call(elem, i, jQuery.extend({}, curOffset));
          }
          if (options.top != null) {
            props.top = options.top - curOffset.top + curTop;
          }
          if (options.left != null) {
            props.left = options.left - curOffset.left + curLeft;
          }
          if ("using" in options) {
            options.using.call(elem, props);
          } else {
            curElem.css(props);
          }
        }
      };
      jQuery.fn.extend({
        // offset() relates an element's border box to the document origin
        offset: function(options) {
          if (arguments.length) {
            return options === void 0 ? this : this.each(function(i) {
              jQuery.offset.setOffset(this, options, i);
            });
          }
          var rect, win, elem = this[0];
          if (!elem) {
            return;
          }
          if (!elem.getClientRects().length) {
            return { top: 0, left: 0 };
          }
          rect = elem.getBoundingClientRect();
          win = elem.ownerDocument.defaultView;
          return {
            top: rect.top + win.pageYOffset,
            left: rect.left + win.pageXOffset
          };
        },
        // position() relates an element's margin box to its offset parent's padding box
        // This corresponds to the behavior of CSS absolute positioning
        position: function() {
          if (!this[0]) {
            return;
          }
          var offsetParent, offset, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
          if (jQuery.css(elem, "position") === "fixed") {
            offset = elem.getBoundingClientRect();
          } else {
            offset = this.offset();
            doc = elem.ownerDocument;
            offsetParent = elem.offsetParent || doc.documentElement;
            while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && jQuery.css(offsetParent, "position") === "static") {
              offsetParent = offsetParent.parentNode;
            }
            if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
              parentOffset = jQuery(offsetParent).offset();
              parentOffset.top += jQuery.css(offsetParent, "borderTopWidth", true);
              parentOffset.left += jQuery.css(offsetParent, "borderLeftWidth", true);
            }
          }
          return {
            top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
            left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
          };
        },
        // This method will return documentElement in the following cases:
        // 1) For the element inside the iframe without offsetParent, this method will return
        //    documentElement of the parent window
        // 2) For the hidden or detached element
        // 3) For body or html element, i.e. in case of the html node - it will return itself
        //
        // but those exceptions were never presented as a real life use-cases
        // and might be considered as more preferable results.
        //
        // This logic, however, is not guaranteed and can change at any point in the future
        offsetParent: function() {
          return this.map(function() {
            var offsetParent = this.offsetParent;
            while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
              offsetParent = offsetParent.offsetParent;
            }
            return offsetParent || documentElement;
          });
        }
      });
      jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(method, prop) {
        var top = "pageYOffset" === prop;
        jQuery.fn[method] = function(val) {
          return access(this, function(elem, method2, val2) {
            var win;
            if (isWindow(elem)) {
              win = elem;
            } else if (elem.nodeType === 9) {
              win = elem.defaultView;
            }
            if (val2 === void 0) {
              return win ? win[prop] : elem[method2];
            }
            if (win) {
              win.scrollTo(
                !top ? val2 : win.pageXOffset,
                top ? val2 : win.pageYOffset
              );
            } else {
              elem[method2] = val2;
            }
          }, method, val, arguments.length);
        };
      });
      jQuery.each(["top", "left"], function(_i, prop) {
        jQuery.cssHooks[prop] = addGetHookIf(
          support.pixelPosition,
          function(elem, computed) {
            if (computed) {
              computed = curCSS(elem, prop);
              return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
            }
          }
        );
      });
      jQuery.each({ Height: "height", Width: "width" }, function(name, type) {
        jQuery.each({
          padding: "inner" + name,
          content: type,
          "": "outer" + name
        }, function(defaultExtra, funcName) {
          jQuery.fn[funcName] = function(margin, value) {
            var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
            return access(this, function(elem, type2, value2) {
              var doc;
              if (isWindow(elem)) {
                return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
              }
              if (elem.nodeType === 9) {
                doc = elem.documentElement;
                return Math.max(
                  elem.body["scroll" + name],
                  doc["scroll" + name],
                  elem.body["offset" + name],
                  doc["offset" + name],
                  doc["client" + name]
                );
              }
              return value2 === void 0 ? (
                // Get width or height on the element, requesting but not forcing parseFloat
                jQuery.css(elem, type2, extra)
              ) : (
                // Set width or height on the element
                jQuery.style(elem, type2, value2, extra)
              );
            }, type, chainable ? margin : void 0, chainable);
          };
        });
      });
      jQuery.each([
        "ajaxStart",
        "ajaxStop",
        "ajaxComplete",
        "ajaxError",
        "ajaxSuccess",
        "ajaxSend"
      ], function(_i, type) {
        jQuery.fn[type] = function(fn) {
          return this.on(type, fn);
        };
      });
      jQuery.fn.extend({
        bind: function(types, data, fn) {
          return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
          return this.off(types, null, fn);
        },
        delegate: function(selector, types, data, fn) {
          return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
          return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        },
        hover: function(fnOver, fnOut) {
          return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
        }
      });
      jQuery.each(
        "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
        function(_i, name) {
          jQuery.fn[name] = function(data, fn) {
            return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
          };
        }
      );
      var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
      jQuery.proxy = function(fn, context) {
        var tmp, args, proxy;
        if (typeof context === "string") {
          tmp = fn[context];
          context = fn;
          fn = tmp;
        }
        if (!isFunction(fn)) {
          return void 0;
        }
        args = slice.call(arguments, 2);
        proxy = function() {
          return fn.apply(context || this, args.concat(slice.call(arguments)));
        };
        proxy.guid = fn.guid = fn.guid || jQuery.guid++;
        return proxy;
      };
      jQuery.holdReady = function(hold) {
        if (hold) {
          jQuery.readyWait++;
        } else {
          jQuery.ready(true);
        }
      };
      jQuery.isArray = Array.isArray;
      jQuery.parseJSON = JSON.parse;
      jQuery.nodeName = nodeName;
      jQuery.isFunction = isFunction;
      jQuery.isWindow = isWindow;
      jQuery.camelCase = camelCase;
      jQuery.type = toType;
      jQuery.now = Date.now;
      jQuery.isNumeric = function(obj) {
        var type = jQuery.type(obj);
        return (type === "number" || type === "string") && // parseFloat NaNs numeric-cast false positives ("")
        // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
        // subtraction forces infinities to NaN
        !isNaN(obj - parseFloat(obj));
      };
      jQuery.trim = function(text) {
        return text == null ? "" : (text + "").replace(rtrim, "$1");
      };
      if (typeof define === "function" && define.amd) {
        define("jquery", [], function() {
          return jQuery;
        });
      }
      var _jQuery = window2.jQuery, _$ = window2.$;
      jQuery.noConflict = function(deep) {
        if (window2.$ === jQuery) {
          window2.$ = _$;
        }
        if (deep && window2.jQuery === jQuery) {
          window2.jQuery = _jQuery;
        }
        return jQuery;
      };
      if (typeof noGlobal === "undefined") {
        window2.jQuery = window2.$ = jQuery;
      }
      return jQuery;
    });
  }
});

// src/js/Functionalities/html.panel.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var import_jquery = __toESM(require_jquery(), 1);
var _HTML_Panel = class _HTML_Panel {
  static {
    this.mapHeaderAfterElements = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves the first ".CXPage"-{@link HTMLElement } above the given "element".
   *
   * @param element The {@link HTMLElement } to start the search from.
   *
   * @returns The ".CXPage"-{@link HTMLElement } containing the given "element". */
  static determinePage(element) {
    let currentElement = element;
    while (currentElement !== null) {
      if (currentElement.classList.contains("CXPage")) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }
    return currentElement;
  }
  static {
    /** Stores all {@link HTMLElement }s that're currently invalid. */
    this.invalidElements = new Array();
  }
  static {
    /** States whether the validator algorithm has already been registered. */
    this.validatorRegistered = false;
  }
  /**
   * Unfolds all HTML-Panels that are ancestors of the specified {@link Element } by simulating a click on their
   * header if they're folded.
   *
   * @param from The {@link Element } to start the unfolding from. */
  static unfoldPanelAncestors(from) {
    let currentElement = from;
    while (currentElement !== null) {
      if (currentElement.CodBi_HTML_Panel_Folded) {
        currentElement.CodBi_HTML_Panel_Header.click();
      }
      currentElement = currentElement.parentElement;
    }
  }
  static functionality(toLoad, toProcess) {
    if (XFC_METADATA.requestType === "print") {
      return;
    }
    let header;
    if (toLoad.generateheader && toProcess.children.length > 0 && toLoad.generateheader.toLocaleLowerCase() === "true") {
      if (toLoad.scroll === void 0) {
        toLoad.scroll = false;
      } else {
        if (typeof toLoad.scroll === "string") {
          toLoad.scroll = toLoad.scroll.toLowerCase().trim() === "true";
        }
      }
      if (toLoad.scroll && toLoad.scrollblock && typeof toLoad.scrollblock === "string") {
        toLoad.scrollblock = toLoad.scrollblock.toLowerCase().trim();
      }
      if (toLoad.scroll && toLoad.scrollblock !== "start" && toLoad.scrollblock !== "center" && toLoad.scrollblock !== "end" && toLoad.scrollblock !== "nearest") {
        toLoad.scrollblock = "nearest";
      }
      const wrpHeader = document.createElement("div");
      wrpHeader.classList.add("cHeader");
      header = document.createElement("div");
      const legend = toProcess.querySelector("legend");
      toLoad.autoheadertitlesuplementsspacer = toLoad.autoheadertitlesuplementsspacer ? toLoad.autoheadertitlesuplementsspacer : " / ";
      let autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer;
      const supplements = toProcess.querySelectorAll(".CodBi_HTML_Panel_AutoHeaderTitle_Supplement");
      const constructHeaderSupplements = () => {
        for (let i = 0; i < supplements.length; i++) {
          autoHeaderTitleSupplement += `${supplements[i].value === "" || i === 0 ? "" : ", "}${supplements[i].value}`;
        }
      };
      for (let i = 0; i < supplements.length; i++) {
        if (!isClassInBetween("XFieldSet", toProcess, supplements[i]) && !isClassInBetween("XContainer", toProcess, supplements[i])) {
          supplements[i].addEventListener("change", (event) => {
            autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer;
            constructHeaderSupplements();
            header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? toLoad.autoheadertitle + (autoHeaderTitleSupplement.length !== toLoad.autoheadertitlesuplementsspacer.length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? legend.innerHTML + (autoHeaderTitleSupplement.length === toLoad.autoheadertitlesuplementsspacer.length ? "" : autoHeaderTitleSupplement) : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
          });
        }
      }
      constructHeaderSupplements();
      header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? toLoad.autoheadertitle + (autoHeaderTitleSupplement.length !== toLoad.autoheadertitlesuplementsspacer.length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? legend ? toProcess.querySelector("legend")?.innerHTML + (autoHeaderTitleSupplement.length === toLoad.autoheadertitlesuplementsspacer.length ? "" : autoHeaderTitleSupplement) : "" : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
      if (legend) {
        legend.remove();
      }
      header.setAttribute("style", toLoad.autoheadercss);
      header.classList.add("CodBi_HTML_Panel_Header");
      wrpHeader.appendChild(header);
      toProcess.insertBefore(wrpHeader, toProcess.firstChild);
    } else {
      header = toProcess.querySelector(".CodBi_HTML_Panel_Header");
    }
    if (header === null) {
      throw new CodBiError(
        `Tagged <div> "${toProcess.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`
      );
    } else {
      toProcess.CodBi_HTML_Panel_Header = header;
      toProcess.classList.add("--HTML_Panel");
      const styHeader = header.getAttribute("style");
      const childArray = Array.from(toProcess.children);
      const idxHeader = childArray.indexOf(header.parentElement);
      const headerAfterElement = idxHeader === childArray.length - 1 ? void 0 : childArray[idxHeader];
      if (headerAfterElement) {
        _HTML_Panel.mapHeaderAfterElements.set(toProcess, headerAfterElement);
      }
      const bufferDisplay = toProcess.style.display;
      toProcess.CodBi_HTML_Panel_Folded = document.body.classList.contains(
        "fc-print-mode"
      ) ? false : toLoad.folded !== void 0 ? toLoad.folded.toLowerCase().trim() === "true" : false;
      if (toProcess.CodBi_HTML_Panel_Folded) {
        toProcess.style.display = "none";
        header?.remove();
        toProcess.parentElement?.appendChild(header);
      } else {
        if (toLoad.cssheaderunfolded) {
          header?.setAttribute("style", toLoad.cssheaderunfolded);
        }
      }
      if (toProcess.CodBi_HTML_Panel_Folded) {
        toProcess.classList.add("--folded");
      }
      let parentID = header.parentElement?.getAttribute("id");
      if (parentID === null) {
        parentID = toProcess.getAttribute("id");
      }
      const style = document.createElement("style");
      style.innerHTML = `
      @media( print ) {
        #${parentID}.CodBi.--HTML_Panel { display : ${bufferDisplay} !important ;}
      }

      .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: red !important ;}

      @media( prefers-color-scheme : dark ) {
        .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: darkorange !important ;}

        #${parentID} .CodBi_HTML_Panel_Header { ${toLoad.dcssheaderunfolded ? toLoad.dcssheaderunfolded : "background: linear-gradient(130deg, rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(84, 62, 62, 1) 55%, rgba(56, 52, 52, 1) 89%, rgba(0, 0, 0, 1) 100%) !important ;"}}}

      .CodBi_HTML_Panel_Header > p { margin : 0 ;}

      #${parentID} .CodBi_HTML_Panel_Header:after,
      #${toProcess.parentElement?.parentElement?.getAttribute("id")} .CodBi_HTML_Panel_Header:after {
        content : "${toLoad.cssafterheadercontent ? toLoad.cssafterheadercontent : ""}";

        ${toLoad.cssafterheader ? toLoad.cssafterheader : ""}
      }

      #${parentID} .CodBi_HTML_Panel_Header:before,
      #${toProcess.parentElement?.parentElement?.getAttribute("id")} .CodBi_HTML_Panel_Header:before {
        content : "${toLoad.cssbeforeheadercontent ? toLoad.cssbeforeheadercontent : ""}";

        ${toLoad.cssbeforeheader ? toLoad.cssbeforeheader : ""}
      }

      #${parentID} .CodBi_HTML_Panel_Header:hover,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:hover     { ${toLoad.cssheaderhover ? toLoad.cssheaderhover : "color: darkorange ;"}}
      #${parentID} .CodBi_HTML_Panel_Header:hover > *,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:hover > * { ${toLoad.cssheaderhover ? "" : "margin-left: 5% ; transition: .5s all ;"}}
      #${parentID} .CodBi_HTML_Panel_Header:active,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:active    { ${toLoad.cssheaderactive ? toLoad.cssheaderactive : "scale : .9 ;"}}

      ${toLoad.cssanimfadeinpanel ? `@keyframes CodBi_FadeIN_Panel_${parentID} {
          ${toLoad.cssanimfadeinpanel}}` : ""}

      #${parentID} .CodBi.--HTML_Panel,
      #${parentID}.CodBi.--HTML_Panel    { animation : CodBi_FadeIN_Panel_${parentID} ${toLoad.cssanimfadeinpanelduration ? toLoad.cssanimfadeinpanelduration : "0s"} ${toLoad.cssanimfadeinpaneleasing ? toLoad.cssanimfadeinpaneleasing : "ease-in-out"} forwards ;}`;
      const styleAfterUnfolded = document.createElement("style");
      styleAfterUnfolded.innerHTML = `
        #${parentID} > style + .CodBi_HTML_Panel_Header::after,
        #${parentID} > * > style + .CodBi_HTML_Panel_Header::after {
          content : "${toLoad.cssafterheadercontentunfolded ? toLoad.cssafterheadercontentunfolded : toLoad.cssafterheadercontent ? toLoad.cssafterheadercontent : ""}";

          ${toLoad.cssafterheaderunfolded ? toLoad.cssafterheaderunfolded : toLoad.cssafterheader ? toLoad.cssafterheader : ""}}`;
      const styleBeforeUnfolded = document.createElement("style");
      styleBeforeUnfolded.innerHTML = `
        #${parentID} > style + .CodBi_HTML_Panel_Header::before,
        #${parentID} > * > style + .CodBi_HTML_Panel_Header::before {
          content : "${toLoad.cssbeforeheadercontentunfolded ? toLoad.cssbeforeheadercontentunfolded : toLoad.cssbeforeheadercontent ? toLoad.cssbeforeheadercontent : ""}";

          ${toLoad.cssbeforeheaderunfolded ? toLoad.cssbeforeheaderunfolded : toLoad.cssbeforeheader ? toLoad.cssbeforeheader : ""}}`;
      header.parentElement?.insertBefore(style, header);
      if (toLoad.wrappercss && toProcess.parentElement?.classList.contains("XFieldSetWrapper")) {
        toProcess.parentElement?.setAttribute("style", toLoad.wrappercss);
      }
      header.addEventListener("click", (event) => {
        if (toProcess.CodBi_HTML_Panel_Folded) {
          toProcess.CodBi_HTML_Panel_Folded = !toProcess.CodBi_HTML_Panel_Folded;
          toProcess.style.display = bufferDisplay;
          header?.remove();
          if (toLoad.cssheaderunfolded) {
            header.setAttribute("style", toLoad.cssheaderunfolded);
          }
          if (headerAfterElement === void 0) {
            toProcess.appendChild(header);
          } else {
            toProcess.insertBefore(header, headerAfterElement);
          }
          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            header.parentElement?.insertBefore(styleAfterUnfolded, header);
            header.parentElement?.insertBefore(styleBeforeUnfolded, header);
          }
          if (toLoad.scroll) {
            toProcess.scrollIntoView({
              behavior: "smooth",
              block: toLoad.scrollblock,
              inline: "nearest"
            });
          }
          if (toProcess.hasAttribute("data-cb-accordion")) {
            toLoad.accordion = toProcess.getAttribute("data-cb-accordion");
            for (const toFold of document.querySelectorAll(
              `.CodBi.--HTML_Panel[ data-cb-accordion = "${toLoad.accordion}"]:not(.--folded)`
            )) {
              toFold.querySelector(".CodBi_HTML_Panel_Header")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }
          }
          toProcess.classList.remove("--folded");
        } else {
          toProcess.CodBi_HTML_Panel_Folded = !toProcess.CodBi_HTML_Panel_Folded;
          toProcess.style.display = "none";
          header.remove();
          if (styHeader) {
            header.setAttribute("style", styHeader);
          }
          toProcess.parentElement?.appendChild(header);
          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            styleAfterUnfolded.remove();
            styleBeforeUnfolded.remove();
          }
          toProcess.classList.add("--folded");
        }
      });
      let requiredFieldsContained = false;
      for (const required of toProcess.querySelectorAll('[ aria-required = "true"]')) {
        requiredFieldsContained = true;
      }
      if (requiredFieldsContained) {
        const styleRequiredFieldsContained = document.createElement("style");
        styleRequiredFieldsContained.innerHTML = `
          #${parentID} > .CodBi_HTML_Panel_Header:before,
          #${toProcess.parentElement?.parentElement?.getAttribute("id")} > * > .CodBi_HTML_Panel_Header:before {
            content : "${toLoad.cssrequiredfieldscontent ? toLoad.cssrequiredfieldscontent : "*"}";

          ${toLoad.cssrequiredfields ? toLoad.cssrequiredfields : "color : red ; position : relative ; top : .5em ;"}}`;
        header.parentElement?.insertBefore(styleRequiredFieldsContained, header);
      }
      (0, import_fc_form_renderer.getXUtil)().on("submit", (params) => {
        for (const untag of document.querySelectorAll(".CodBi_HTML_Panel_MissingRequiredField")) {
          untag.classList.remove("CodBi_HTML_Panel_MissingRequiredField");
        }
        let reallyInvalid = false;
        for (const candidate of document.querySelectorAll('[ aria-required = "true"]')) {
          if (candidate.value === "" || candidate.value === void 0) {
            _HTML_Panel.unfoldPanelAncestors(candidate);
            if (!isDisplayNone(candidate)) {
              let checkedSelection = false;
              if (candidate.classList.contains("XSelect")) {
                for (const option of candidate.querySelectorAll("input")) {
                  if (option.checked === true) {
                    checkedSelection = true;
                  }
                }
              }
              if (!checkedSelection) {
                const pageName = _HTML_Panel.determinePage(candidate)?.getAttribute("data-xn");
                if (pageName) {
                  gotoPage(pageName);
                  candidate.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock });
                }
                candidate.focus();
                candidate.classList.add("CodBi_HTML_Panel_MissingRequiredField");
                return { preventSubmission: true };
              }
            }
          }
        }
        if (_HTML_Panel.invalidElements.length === 0) {
          return { preventSubmission: false };
        } else {
          for (const invalid of _HTML_Panel.invalidElements) {
            reallyInvalid = true;
            _HTML_Panel.unfoldPanelAncestors(invalid);
            const pageName = _HTML_Panel.determinePage(invalid)?.getAttribute("data-xn");
            if (pageName) {
              gotoPage(pageName);
              invalid.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock });
            }
            invalid.focus();
          }
          return { preventSubmission: reallyInvalid };
        }
      });
      if (!_HTML_Panel.validatorRegistered) {
        xm_validator.on("begin", (data) => {
          for (const item of data.items) {
            if (!_HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "true") {
              _HTML_Panel.invalidElements.push(item);
            }
            if (_HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "false") {
              _HTML_Panel.invalidElements = _HTML_Panel.invalidElements.filter((candidate) => candidate !== item);
            }
          }
        });
      }
    }
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link HTML_Panel } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("HTML.Panel", _HTML_Panel.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.keyPath, "path")),
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.property, "property")),
  __decorateParam(1, INSTANCE.PRE(HTMLDivElement))
], _HTML_Panel, "functionality", 1);
var HTML_Panel = _HTML_Panel;
function isClassInBetween(suspect, start, end) {
  while (end && end !== start) {
    if (end.getAttribute("class").indexOf(` ${suspect} `) !== -1 || end.getAttribute("class").indexOf(` ${suspect}"`) !== -1 || end.getAttribute("class").indexOf(`"${suspect} `) !== -1 || end.getAttribute("class").indexOf(`"${suspect}"`) !== -1) {
      return true;
    }
    end = end.parentElement;
  }
  return false;
}
function isDisplayNone(suspect) {
  while (suspect !== null) {
    if (suspect.style.display === "none") {
      return true;
    }
    suspect = suspect.parentElement;
  }
  return false;
}
export {
  HTML_Panel
};
/*! Bundled license information:

jquery/dist/jquery.js:
  (*!
   * jQuery JavaScript Library v3.7.1
   * https://jquery.com/
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.org/license
   *
   * Date: 2023-08-28T13:37Z
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9qcXVlcnkvZGlzdC9qcXVlcnkuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9odG1sLnBhbmVsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiFcbiAqIGpRdWVyeSBKYXZhU2NyaXB0IExpYnJhcnkgdjMuNy4xXG4gKiBodHRwczovL2pxdWVyeS5jb20vXG4gKlxuICogQ29weXJpZ2h0IE9wZW5KUyBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9qcXVlcnkub3JnL2xpY2Vuc2VcbiAqXG4gKiBEYXRlOiAyMDIzLTA4LTI4VDEzOjM3WlxuICovXG4oIGZ1bmN0aW9uKCBnbG9iYWwsIGZhY3RvcnkgKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0aWYgKCB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJvYmplY3RcIiApIHtcblxuXHRcdC8vIEZvciBDb21tb25KUyBhbmQgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgd2hlcmUgYSBwcm9wZXIgYHdpbmRvd2Bcblx0XHQvLyBpcyBwcmVzZW50LCBleGVjdXRlIHRoZSBmYWN0b3J5IGFuZCBnZXQgalF1ZXJ5LlxuXHRcdC8vIEZvciBlbnZpcm9ubWVudHMgdGhhdCBkbyBub3QgaGF2ZSBhIGB3aW5kb3dgIHdpdGggYSBgZG9jdW1lbnRgXG5cdFx0Ly8gKHN1Y2ggYXMgTm9kZS5qcyksIGV4cG9zZSBhIGZhY3RvcnkgYXMgbW9kdWxlLmV4cG9ydHMuXG5cdFx0Ly8gVGhpcyBhY2NlbnR1YXRlcyB0aGUgbmVlZCBmb3IgdGhlIGNyZWF0aW9uIG9mIGEgcmVhbCBgd2luZG93YC5cblx0XHQvLyBlLmcuIHZhciBqUXVlcnkgPSByZXF1aXJlKFwianF1ZXJ5XCIpKHdpbmRvdyk7XG5cdFx0Ly8gU2VlIHRpY2tldCB0cmFjLTE0NTQ5IGZvciBtb3JlIGluZm8uXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBnbG9iYWwuZG9jdW1lbnQgP1xuXHRcdFx0ZmFjdG9yeSggZ2xvYmFsLCB0cnVlICkgOlxuXHRcdFx0ZnVuY3Rpb24oIHcgKSB7XG5cdFx0XHRcdGlmICggIXcuZG9jdW1lbnQgKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcImpRdWVyeSByZXF1aXJlcyBhIHdpbmRvdyB3aXRoIGEgZG9jdW1lbnRcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBmYWN0b3J5KCB3ICk7XG5cdFx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdGZhY3RvcnkoIGdsb2JhbCApO1xuXHR9XG5cbi8vIFBhc3MgdGhpcyBpZiB3aW5kb3cgaXMgbm90IGRlZmluZWQgeWV0XG59ICkoIHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0aGlzLCBmdW5jdGlvbiggd2luZG93LCBub0dsb2JhbCApIHtcblxuLy8gRWRnZSA8PSAxMiAtIDEzKywgRmlyZWZveCA8PTE4IC0gNDUrLCBJRSAxMCAtIDExLCBTYWZhcmkgNS4xIC0gOSssIGlPUyA2IC0gOS4xXG4vLyB0aHJvdyBleGNlcHRpb25zIHdoZW4gbm9uLXN0cmljdCBjb2RlIChlLmcuLCBBU1AuTkVUIDQuNSkgYWNjZXNzZXMgc3RyaWN0IG1vZGVcbi8vIGFyZ3VtZW50cy5jYWxsZWUuY2FsbGVyICh0cmFjLTEzMzM1KS4gQnV0IGFzIG9mIGpRdWVyeSAzLjAgKDIwMTYpLCBzdHJpY3QgbW9kZSBzaG91bGQgYmUgY29tbW9uXG4vLyBlbm91Z2ggdGhhdCBhbGwgc3VjaCBhdHRlbXB0cyBhcmUgZ3VhcmRlZCBpbiBhIHRyeSBibG9jay5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXJyID0gW107XG5cbnZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZjtcblxudmFyIHNsaWNlID0gYXJyLnNsaWNlO1xuXG52YXIgZmxhdCA9IGFyci5mbGF0ID8gZnVuY3Rpb24oIGFycmF5ICkge1xuXHRyZXR1cm4gYXJyLmZsYXQuY2FsbCggYXJyYXkgKTtcbn0gOiBmdW5jdGlvbiggYXJyYXkgKSB7XG5cdHJldHVybiBhcnIuY29uY2F0LmFwcGx5KCBbXSwgYXJyYXkgKTtcbn07XG5cblxudmFyIHB1c2ggPSBhcnIucHVzaDtcblxudmFyIGluZGV4T2YgPSBhcnIuaW5kZXhPZjtcblxudmFyIGNsYXNzMnR5cGUgPSB7fTtcblxudmFyIHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxudmFyIGhhc093biA9IGNsYXNzMnR5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBmblRvU3RyaW5nID0gaGFzT3duLnRvU3RyaW5nO1xuXG52YXIgT2JqZWN0RnVuY3Rpb25TdHJpbmcgPSBmblRvU3RyaW5nLmNhbGwoIE9iamVjdCApO1xuXG52YXIgc3VwcG9ydCA9IHt9O1xuXG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIGlzRnVuY3Rpb24oIG9iaiApIHtcblxuXHRcdC8vIFN1cHBvcnQ6IENocm9tZSA8PTU3LCBGaXJlZm94IDw9NTJcblx0XHQvLyBJbiBzb21lIGJyb3dzZXJzLCB0eXBlb2YgcmV0dXJucyBcImZ1bmN0aW9uXCIgZm9yIEhUTUwgPG9iamVjdD4gZWxlbWVudHNcblx0XHQvLyAoaS5lLiwgYHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcIm9iamVjdFwiICkgPT09IFwiZnVuY3Rpb25cImApLlxuXHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gY2xhc3NpZnkgKmFueSogRE9NIG5vZGUgYXMgYSBmdW5jdGlvbi5cblx0XHQvLyBTdXBwb3J0OiBRdFdlYiA8PTMuOC41LCBXZWJLaXQgPD01MzQuMzQsIHdraHRtbHRvcGRmIHRvb2wgPD0wLjEyLjVcblx0XHQvLyBQbHVzIGZvciBvbGQgV2ViS2l0LCB0eXBlb2YgcmV0dXJucyBcImZ1bmN0aW9uXCIgZm9yIEhUTUwgY29sbGVjdGlvbnNcblx0XHQvLyAoZS5nLiwgYHR5cGVvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImRpdlwiKSA9PT0gXCJmdW5jdGlvblwiYCkuIChnaC00NzU2KVxuXHRcdHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIG9iai5ub2RlVHlwZSAhPT0gXCJudW1iZXJcIiAmJlxuXHRcdFx0dHlwZW9mIG9iai5pdGVtICE9PSBcImZ1bmN0aW9uXCI7XG5cdH07XG5cblxudmFyIGlzV2luZG93ID0gZnVuY3Rpb24gaXNXaW5kb3coIG9iaiApIHtcblx0XHRyZXR1cm4gb2JqICE9IG51bGwgJiYgb2JqID09PSBvYmoud2luZG93O1xuXHR9O1xuXG5cbnZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcblxuXG5cblx0dmFyIHByZXNlcnZlZFNjcmlwdEF0dHJpYnV0ZXMgPSB7XG5cdFx0dHlwZTogdHJ1ZSxcblx0XHRzcmM6IHRydWUsXG5cdFx0bm9uY2U6IHRydWUsXG5cdFx0bm9Nb2R1bGU6IHRydWVcblx0fTtcblxuXHRmdW5jdGlvbiBET01FdmFsKCBjb2RlLCBub2RlLCBkb2MgKSB7XG5cdFx0ZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuXG5cdFx0dmFyIGksIHZhbCxcblx0XHRcdHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCBcInNjcmlwdFwiICk7XG5cblx0XHRzY3JpcHQudGV4dCA9IGNvZGU7XG5cdFx0aWYgKCBub2RlICkge1xuXHRcdFx0Zm9yICggaSBpbiBwcmVzZXJ2ZWRTY3JpcHRBdHRyaWJ1dGVzICkge1xuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IEZpcmVmb3ggNjQrLCBFZGdlIDE4K1xuXHRcdFx0XHQvLyBTb21lIGJyb3dzZXJzIGRvbid0IHN1cHBvcnQgdGhlIFwibm9uY2VcIiBwcm9wZXJ0eSBvbiBzY3JpcHRzLlxuXHRcdFx0XHQvLyBPbiB0aGUgb3RoZXIgaGFuZCwganVzdCB1c2luZyBgZ2V0QXR0cmlidXRlYCBpcyBub3QgZW5vdWdoIGFzXG5cdFx0XHRcdC8vIHRoZSBgbm9uY2VgIGF0dHJpYnV0ZSBpcyByZXNldCB0byBhbiBlbXB0eSBzdHJpbmcgd2hlbmV2ZXIgaXRcblx0XHRcdFx0Ly8gYmVjb21lcyBicm93c2luZy1jb250ZXh0IGNvbm5lY3RlZC5cblx0XHRcdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93aGF0d2cvaHRtbC9pc3N1ZXMvMjM2OVxuXHRcdFx0XHQvLyBTZWUgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy8jbm9uY2UtYXR0cmlidXRlc1xuXHRcdFx0XHQvLyBUaGUgYG5vZGUuZ2V0QXR0cmlidXRlYCBjaGVjayB3YXMgYWRkZWQgZm9yIHRoZSBzYWtlIG9mXG5cdFx0XHRcdC8vIGBqUXVlcnkuZ2xvYmFsRXZhbGAgc28gdGhhdCBpdCBjYW4gZmFrZSBhIG5vbmNlLWNvbnRhaW5pbmcgbm9kZVxuXHRcdFx0XHQvLyB2aWEgYW4gb2JqZWN0LlxuXHRcdFx0XHR2YWwgPSBub2RlWyBpIF0gfHwgbm9kZS5nZXRBdHRyaWJ1dGUgJiYgbm9kZS5nZXRBdHRyaWJ1dGUoIGkgKTtcblx0XHRcdFx0aWYgKCB2YWwgKSB7XG5cdFx0XHRcdFx0c2NyaXB0LnNldEF0dHJpYnV0ZSggaSwgdmFsICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZG9jLmhlYWQuYXBwZW5kQ2hpbGQoIHNjcmlwdCApLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIHNjcmlwdCApO1xuXHR9XG5cblxuZnVuY3Rpb24gdG9UeXBlKCBvYmogKSB7XG5cdGlmICggb2JqID09IG51bGwgKSB7XG5cdFx0cmV0dXJuIG9iaiArIFwiXCI7XG5cdH1cblxuXHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9Mi4zIG9ubHkgKGZ1bmN0aW9uaXNoIFJlZ0V4cClcblx0cmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiID9cblx0XHRjbGFzczJ0eXBlWyB0b1N0cmluZy5jYWxsKCBvYmogKSBdIHx8IFwib2JqZWN0XCIgOlxuXHRcdHR5cGVvZiBvYmo7XG59XG4vKiBnbG9iYWwgU3ltYm9sICovXG4vLyBEZWZpbmluZyB0aGlzIGdsb2JhbCBpbiAuZXNsaW50cmMuanNvbiB3b3VsZCBjcmVhdGUgYSBkYW5nZXIgb2YgdXNpbmcgdGhlIGdsb2JhbFxuLy8gdW5ndWFyZGVkIGluIGFub3RoZXIgcGxhY2UsIGl0IHNlZW1zIHNhZmVyIHRvIGRlZmluZSBnbG9iYWwgb25seSBmb3IgdGhpcyBtb2R1bGVcblxuXG5cbnZhciB2ZXJzaW9uID0gXCIzLjcuMVwiLFxuXG5cdHJodG1sU3VmZml4ID0gL0hUTUwkL2ksXG5cblx0Ly8gRGVmaW5lIGEgbG9jYWwgY29weSBvZiBqUXVlcnlcblx0alF1ZXJ5ID0gZnVuY3Rpb24oIHNlbGVjdG9yLCBjb250ZXh0ICkge1xuXG5cdFx0Ly8gVGhlIGpRdWVyeSBvYmplY3QgaXMgYWN0dWFsbHkganVzdCB0aGUgaW5pdCBjb25zdHJ1Y3RvciAnZW5oYW5jZWQnXG5cdFx0Ly8gTmVlZCBpbml0IGlmIGpRdWVyeSBpcyBjYWxsZWQgKGp1c3QgYWxsb3cgZXJyb3IgdG8gYmUgdGhyb3duIGlmIG5vdCBpbmNsdWRlZClcblx0XHRyZXR1cm4gbmV3IGpRdWVyeS5mbi5pbml0KCBzZWxlY3RvciwgY29udGV4dCApO1xuXHR9O1xuXG5qUXVlcnkuZm4gPSBqUXVlcnkucHJvdG90eXBlID0ge1xuXG5cdC8vIFRoZSBjdXJyZW50IHZlcnNpb24gb2YgalF1ZXJ5IGJlaW5nIHVzZWRcblx0anF1ZXJ5OiB2ZXJzaW9uLFxuXG5cdGNvbnN0cnVjdG9yOiBqUXVlcnksXG5cblx0Ly8gVGhlIGRlZmF1bHQgbGVuZ3RoIG9mIGEgalF1ZXJ5IG9iamVjdCBpcyAwXG5cdGxlbmd0aDogMCxcblxuXHR0b0FycmF5OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2xpY2UuY2FsbCggdGhpcyApO1xuXHR9LFxuXG5cdC8vIEdldCB0aGUgTnRoIGVsZW1lbnQgaW4gdGhlIG1hdGNoZWQgZWxlbWVudCBzZXQgT1Jcblx0Ly8gR2V0IHRoZSB3aG9sZSBtYXRjaGVkIGVsZW1lbnQgc2V0IGFzIGEgY2xlYW4gYXJyYXlcblx0Z2V0OiBmdW5jdGlvbiggbnVtICkge1xuXG5cdFx0Ly8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjbGVhbiBhcnJheVxuXHRcdGlmICggbnVtID09IG51bGwgKSB7XG5cdFx0XHRyZXR1cm4gc2xpY2UuY2FsbCggdGhpcyApO1xuXHRcdH1cblxuXHRcdC8vIFJldHVybiBqdXN0IHRoZSBvbmUgZWxlbWVudCBmcm9tIHRoZSBzZXRcblx0XHRyZXR1cm4gbnVtIDwgMCA/IHRoaXNbIG51bSArIHRoaXMubGVuZ3RoIF0gOiB0aGlzWyBudW0gXTtcblx0fSxcblxuXHQvLyBUYWtlIGFuIGFycmF5IG9mIGVsZW1lbnRzIGFuZCBwdXNoIGl0IG9udG8gdGhlIHN0YWNrXG5cdC8vIChyZXR1cm5pbmcgdGhlIG5ldyBtYXRjaGVkIGVsZW1lbnQgc2V0KVxuXHRwdXNoU3RhY2s6IGZ1bmN0aW9uKCBlbGVtcyApIHtcblxuXHRcdC8vIEJ1aWxkIGEgbmV3IGpRdWVyeSBtYXRjaGVkIGVsZW1lbnQgc2V0XG5cdFx0dmFyIHJldCA9IGpRdWVyeS5tZXJnZSggdGhpcy5jb25zdHJ1Y3RvcigpLCBlbGVtcyApO1xuXG5cdFx0Ly8gQWRkIHRoZSBvbGQgb2JqZWN0IG9udG8gdGhlIHN0YWNrIChhcyBhIHJlZmVyZW5jZSlcblx0XHRyZXQucHJldk9iamVjdCA9IHRoaXM7XG5cblx0XHQvLyBSZXR1cm4gdGhlIG5ld2x5LWZvcm1lZCBlbGVtZW50IHNldFxuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cblx0Ly8gRXhlY3V0ZSBhIGNhbGxiYWNrIGZvciBldmVyeSBlbGVtZW50IGluIHRoZSBtYXRjaGVkIHNldC5cblx0ZWFjaDogZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuXHRcdHJldHVybiBqUXVlcnkuZWFjaCggdGhpcywgY2FsbGJhY2sgKTtcblx0fSxcblxuXHRtYXA6IGZ1bmN0aW9uKCBjYWxsYmFjayApIHtcblx0XHRyZXR1cm4gdGhpcy5wdXNoU3RhY2soIGpRdWVyeS5tYXAoIHRoaXMsIGZ1bmN0aW9uKCBlbGVtLCBpICkge1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwoIGVsZW0sIGksIGVsZW0gKTtcblx0XHR9ICkgKTtcblx0fSxcblxuXHRzbGljZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKCBzbGljZS5hcHBseSggdGhpcywgYXJndW1lbnRzICkgKTtcblx0fSxcblxuXHRmaXJzdDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXEoIDAgKTtcblx0fSxcblxuXHRsYXN0OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lcSggLTEgKTtcblx0fSxcblxuXHRldmVuOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wdXNoU3RhY2soIGpRdWVyeS5ncmVwKCB0aGlzLCBmdW5jdGlvbiggX2VsZW0sIGkgKSB7XG5cdFx0XHRyZXR1cm4gKCBpICsgMSApICUgMjtcblx0XHR9ICkgKTtcblx0fSxcblxuXHRvZGQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnB1c2hTdGFjayggalF1ZXJ5LmdyZXAoIHRoaXMsIGZ1bmN0aW9uKCBfZWxlbSwgaSApIHtcblx0XHRcdHJldHVybiBpICUgMjtcblx0XHR9ICkgKTtcblx0fSxcblxuXHRlcTogZnVuY3Rpb24oIGkgKSB7XG5cdFx0dmFyIGxlbiA9IHRoaXMubGVuZ3RoLFxuXHRcdFx0aiA9ICtpICsgKCBpIDwgMCA/IGxlbiA6IDAgKTtcblx0XHRyZXR1cm4gdGhpcy5wdXNoU3RhY2soIGogPj0gMCAmJiBqIDwgbGVuID8gWyB0aGlzWyBqIF0gXSA6IFtdICk7XG5cdH0sXG5cblx0ZW5kOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wcmV2T2JqZWN0IHx8IHRoaXMuY29uc3RydWN0b3IoKTtcblx0fSxcblxuXHQvLyBGb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG5cdC8vIEJlaGF2ZXMgbGlrZSBhbiBBcnJheSdzIG1ldGhvZCwgbm90IGxpa2UgYSBqUXVlcnkgbWV0aG9kLlxuXHRwdXNoOiBwdXNoLFxuXHRzb3J0OiBhcnIuc29ydCxcblx0c3BsaWNlOiBhcnIuc3BsaWNlXG59O1xuXG5qUXVlcnkuZXh0ZW5kID0galF1ZXJ5LmZuLmV4dGVuZCA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmUsXG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWyAwIF0gfHwge30sXG5cdFx0aSA9IDEsXG5cdFx0bGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0XHRkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAoIHR5cGVvZiB0YXJnZXQgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdGRlZXAgPSB0YXJnZXQ7XG5cblx0XHQvLyBTa2lwIHRoZSBib29sZWFuIGFuZCB0aGUgdGFyZ2V0XG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWyBpIF0gfHwge307XG5cdFx0aSsrO1xuXHR9XG5cblx0Ly8gSGFuZGxlIGNhc2Ugd2hlbiB0YXJnZXQgaXMgYSBzdHJpbmcgb3Igc29tZXRoaW5nIChwb3NzaWJsZSBpbiBkZWVwIGNvcHkpXG5cdGlmICggdHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiAhaXNGdW5jdGlvbiggdGFyZ2V0ICkgKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdH1cblxuXHQvLyBFeHRlbmQgalF1ZXJ5IGl0c2VsZiBpZiBvbmx5IG9uZSBhcmd1bWVudCBpcyBwYXNzZWRcblx0aWYgKCBpID09PSBsZW5ndGggKSB7XG5cdFx0dGFyZ2V0ID0gdGhpcztcblx0XHRpLS07XG5cdH1cblxuXHRmb3IgKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcblxuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAoICggb3B0aW9ucyA9IGFyZ3VtZW50c1sgaSBdICkgIT0gbnVsbCApIHtcblxuXHRcdFx0Ly8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuXHRcdFx0Zm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuXHRcdFx0XHRjb3B5ID0gb3B0aW9uc1sgbmFtZSBdO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgT2JqZWN0LnByb3RvdHlwZSBwb2xsdXRpb25cblx0XHRcdFx0Ly8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuXHRcdFx0XHRpZiAoIG5hbWUgPT09IFwiX19wcm90b19fXCIgfHwgdGFyZ2V0ID09PSBjb3B5ICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdGlmICggZGVlcCAmJiBjb3B5ICYmICggalF1ZXJ5LmlzUGxhaW5PYmplY3QoIGNvcHkgKSB8fFxuXHRcdFx0XHRcdCggY29weUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KCBjb3B5ICkgKSApICkge1xuXHRcdFx0XHRcdHNyYyA9IHRhcmdldFsgbmFtZSBdO1xuXG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHByb3BlciB0eXBlIGZvciB0aGUgc291cmNlIHZhbHVlXG5cdFx0XHRcdFx0aWYgKCBjb3B5SXNBcnJheSAmJiAhQXJyYXkuaXNBcnJheSggc3JjICkgKSB7XG5cdFx0XHRcdFx0XHRjbG9uZSA9IFtdO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoICFjb3B5SXNBcnJheSAmJiAhalF1ZXJ5LmlzUGxhaW5PYmplY3QoIHNyYyApICkge1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSB7fTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmM7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cblx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHR0YXJnZXRbIG5hbWUgXSA9IGpRdWVyeS5leHRlbmQoIGRlZXAsIGNsb25lLCBjb3B5ICk7XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBjb3B5ICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0dGFyZ2V0WyBuYW1lIF0gPSBjb3B5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG5cbmpRdWVyeS5leHRlbmQoIHtcblxuXHQvLyBVbmlxdWUgZm9yIGVhY2ggY29weSBvZiBqUXVlcnkgb24gdGhlIHBhZ2Vcblx0ZXhwYW5kbzogXCJqUXVlcnlcIiArICggdmVyc2lvbiArIE1hdGgucmFuZG9tKCkgKS5yZXBsYWNlKCAvXFxEL2csIFwiXCIgKSxcblxuXHQvLyBBc3N1bWUgalF1ZXJ5IGlzIHJlYWR5IHdpdGhvdXQgdGhlIHJlYWR5IG1vZHVsZVxuXHRpc1JlYWR5OiB0cnVlLFxuXG5cdGVycm9yOiBmdW5jdGlvbiggbXNnICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggbXNnICk7XG5cdH0sXG5cblx0bm9vcDogZnVuY3Rpb24oKSB7fSxcblxuXHRpc1BsYWluT2JqZWN0OiBmdW5jdGlvbiggb2JqICkge1xuXHRcdHZhciBwcm90bywgQ3RvcjtcblxuXHRcdC8vIERldGVjdCBvYnZpb3VzIG5lZ2F0aXZlc1xuXHRcdC8vIFVzZSB0b1N0cmluZyBpbnN0ZWFkIG9mIGpRdWVyeS50eXBlIHRvIGNhdGNoIGhvc3Qgb2JqZWN0c1xuXHRcdGlmICggIW9iaiB8fCB0b1N0cmluZy5jYWxsKCBvYmogKSAhPT0gXCJbb2JqZWN0IE9iamVjdF1cIiApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRwcm90byA9IGdldFByb3RvKCBvYmogKTtcblxuXHRcdC8vIE9iamVjdHMgd2l0aCBubyBwcm90b3R5cGUgKGUuZy4sIGBPYmplY3QuY3JlYXRlKCBudWxsIClgKSBhcmUgcGxhaW5cblx0XHRpZiAoICFwcm90byApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIE9iamVjdHMgd2l0aCBwcm90b3R5cGUgYXJlIHBsYWluIGlmZiB0aGV5IHdlcmUgY29uc3RydWN0ZWQgYnkgYSBnbG9iYWwgT2JqZWN0IGZ1bmN0aW9uXG5cdFx0Q3RvciA9IGhhc093bi5jYWxsKCBwcm90bywgXCJjb25zdHJ1Y3RvclwiICkgJiYgcHJvdG8uY29uc3RydWN0b3I7XG5cdFx0cmV0dXJuIHR5cGVvZiBDdG9yID09PSBcImZ1bmN0aW9uXCIgJiYgZm5Ub1N0cmluZy5jYWxsKCBDdG9yICkgPT09IE9iamVjdEZ1bmN0aW9uU3RyaW5nO1xuXHR9LFxuXG5cdGlzRW1wdHlPYmplY3Q6IGZ1bmN0aW9uKCBvYmogKSB7XG5cdFx0dmFyIG5hbWU7XG5cblx0XHRmb3IgKCBuYW1lIGluIG9iaiApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblx0Ly8gRXZhbHVhdGVzIGEgc2NyaXB0IGluIGEgcHJvdmlkZWQgY29udGV4dDsgZmFsbHMgYmFjayB0byB0aGUgZ2xvYmFsIG9uZVxuXHQvLyBpZiBub3Qgc3BlY2lmaWVkLlxuXHRnbG9iYWxFdmFsOiBmdW5jdGlvbiggY29kZSwgb3B0aW9ucywgZG9jICkge1xuXHRcdERPTUV2YWwoIGNvZGUsIHsgbm9uY2U6IG9wdGlvbnMgJiYgb3B0aW9ucy5ub25jZSB9LCBkb2MgKTtcblx0fSxcblxuXHRlYWNoOiBmdW5jdGlvbiggb2JqLCBjYWxsYmFjayApIHtcblx0XHR2YXIgbGVuZ3RoLCBpID0gMDtcblxuXHRcdGlmICggaXNBcnJheUxpa2UoIG9iaiApICkge1xuXHRcdFx0bGVuZ3RoID0gb2JqLmxlbmd0aDtcblx0XHRcdGZvciAoIDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIGNhbGxiYWNrLmNhbGwoIG9ialsgaSBdLCBpLCBvYmpbIGkgXSApID09PSBmYWxzZSApIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKCBpIGluIG9iaiApIHtcblx0XHRcdFx0aWYgKCBjYWxsYmFjay5jYWxsKCBvYmpbIGkgXSwgaSwgb2JqWyBpIF0gKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gb2JqO1xuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmUgdGhlIHRleHQgdmFsdWUgb2YgYW4gYXJyYXkgb2YgRE9NIG5vZGVzXG5cdHRleHQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdHZhciBub2RlLFxuXHRcdFx0cmV0ID0gXCJcIixcblx0XHRcdGkgPSAwLFxuXHRcdFx0bm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xuXG5cdFx0aWYgKCAhbm9kZVR5cGUgKSB7XG5cblx0XHRcdC8vIElmIG5vIG5vZGVUeXBlLCB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGFuIGFycmF5XG5cdFx0XHR3aGlsZSAoICggbm9kZSA9IGVsZW1bIGkrKyBdICkgKSB7XG5cblx0XHRcdFx0Ly8gRG8gbm90IHRyYXZlcnNlIGNvbW1lbnQgbm9kZXNcblx0XHRcdFx0cmV0ICs9IGpRdWVyeS50ZXh0KCBub2RlICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggbm9kZVR5cGUgPT09IDEgfHwgbm9kZVR5cGUgPT09IDExICkge1xuXHRcdFx0cmV0dXJuIGVsZW0udGV4dENvbnRlbnQ7XG5cdFx0fVxuXHRcdGlmICggbm9kZVR5cGUgPT09IDkgKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5kb2N1bWVudEVsZW1lbnQudGV4dENvbnRlbnQ7XG5cdFx0fVxuXHRcdGlmICggbm9kZVR5cGUgPT09IDMgfHwgbm9kZVR5cGUgPT09IDQgKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5ub2RlVmFsdWU7XG5cdFx0fVxuXG5cdFx0Ly8gRG8gbm90IGluY2x1ZGUgY29tbWVudCBvciBwcm9jZXNzaW5nIGluc3RydWN0aW9uIG5vZGVzXG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdC8vIHJlc3VsdHMgaXMgZm9yIGludGVybmFsIHVzYWdlIG9ubHlcblx0bWFrZUFycmF5OiBmdW5jdGlvbiggYXJyLCByZXN1bHRzICkge1xuXHRcdHZhciByZXQgPSByZXN1bHRzIHx8IFtdO1xuXG5cdFx0aWYgKCBhcnIgIT0gbnVsbCApIHtcblx0XHRcdGlmICggaXNBcnJheUxpa2UoIE9iamVjdCggYXJyICkgKSApIHtcblx0XHRcdFx0alF1ZXJ5Lm1lcmdlKCByZXQsXG5cdFx0XHRcdFx0dHlwZW9mIGFyciA9PT0gXCJzdHJpbmdcIiA/XG5cdFx0XHRcdFx0XHRbIGFyciBdIDogYXJyXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwdXNoLmNhbGwoIHJldCwgYXJyICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblxuXHRpbkFycmF5OiBmdW5jdGlvbiggZWxlbSwgYXJyLCBpICkge1xuXHRcdHJldHVybiBhcnIgPT0gbnVsbCA/IC0xIDogaW5kZXhPZi5jYWxsKCBhcnIsIGVsZW0sIGkgKTtcblx0fSxcblxuXHRpc1hNTERvYzogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0dmFyIG5hbWVzcGFjZSA9IGVsZW0gJiYgZWxlbS5uYW1lc3BhY2VVUkksXG5cdFx0XHRkb2NFbGVtID0gZWxlbSAmJiAoIGVsZW0ub3duZXJEb2N1bWVudCB8fCBlbGVtICkuZG9jdW1lbnRFbGVtZW50O1xuXG5cdFx0Ly8gQXNzdW1lIEhUTUwgd2hlbiBkb2N1bWVudEVsZW1lbnQgZG9lc24ndCB5ZXQgZXhpc3QsIHN1Y2ggYXMgaW5zaWRlXG5cdFx0Ly8gZG9jdW1lbnQgZnJhZ21lbnRzLlxuXHRcdHJldHVybiAhcmh0bWxTdWZmaXgudGVzdCggbmFtZXNwYWNlIHx8IGRvY0VsZW0gJiYgZG9jRWxlbS5ub2RlTmFtZSB8fCBcIkhUTUxcIiApO1xuXHR9LFxuXG5cdC8vIFN1cHBvcnQ6IEFuZHJvaWQgPD00LjAgb25seSwgUGhhbnRvbUpTIDEgb25seVxuXHQvLyBwdXNoLmFwcGx5KF8sIGFycmF5bGlrZSkgdGhyb3dzIG9uIGFuY2llbnQgV2ViS2l0XG5cdG1lcmdlOiBmdW5jdGlvbiggZmlyc3QsIHNlY29uZCApIHtcblx0XHR2YXIgbGVuID0gK3NlY29uZC5sZW5ndGgsXG5cdFx0XHRqID0gMCxcblx0XHRcdGkgPSBmaXJzdC5sZW5ndGg7XG5cblx0XHRmb3IgKCA7IGogPCBsZW47IGorKyApIHtcblx0XHRcdGZpcnN0WyBpKysgXSA9IHNlY29uZFsgaiBdO1xuXHRcdH1cblxuXHRcdGZpcnN0Lmxlbmd0aCA9IGk7XG5cblx0XHRyZXR1cm4gZmlyc3Q7XG5cdH0sXG5cblx0Z3JlcDogZnVuY3Rpb24oIGVsZW1zLCBjYWxsYmFjaywgaW52ZXJ0ICkge1xuXHRcdHZhciBjYWxsYmFja0ludmVyc2UsXG5cdFx0XHRtYXRjaGVzID0gW10sXG5cdFx0XHRpID0gMCxcblx0XHRcdGxlbmd0aCA9IGVsZW1zLmxlbmd0aCxcblx0XHRcdGNhbGxiYWNrRXhwZWN0ID0gIWludmVydDtcblxuXHRcdC8vIEdvIHRocm91Z2ggdGhlIGFycmF5LCBvbmx5IHNhdmluZyB0aGUgaXRlbXNcblx0XHQvLyB0aGF0IHBhc3MgdGhlIHZhbGlkYXRvciBmdW5jdGlvblxuXHRcdGZvciAoIDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdFx0Y2FsbGJhY2tJbnZlcnNlID0gIWNhbGxiYWNrKCBlbGVtc1sgaSBdLCBpICk7XG5cdFx0XHRpZiAoIGNhbGxiYWNrSW52ZXJzZSAhPT0gY2FsbGJhY2tFeHBlY3QgKSB7XG5cdFx0XHRcdG1hdGNoZXMucHVzaCggZWxlbXNbIGkgXSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9LFxuXG5cdC8vIGFyZyBpcyBmb3IgaW50ZXJuYWwgdXNhZ2Ugb25seVxuXHRtYXA6IGZ1bmN0aW9uKCBlbGVtcywgY2FsbGJhY2ssIGFyZyApIHtcblx0XHR2YXIgbGVuZ3RoLCB2YWx1ZSxcblx0XHRcdGkgPSAwLFxuXHRcdFx0cmV0ID0gW107XG5cblx0XHQvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSwgdHJhbnNsYXRpbmcgZWFjaCBvZiB0aGUgaXRlbXMgdG8gdGhlaXIgbmV3IHZhbHVlc1xuXHRcdGlmICggaXNBcnJheUxpa2UoIGVsZW1zICkgKSB7XG5cdFx0XHRsZW5ndGggPSBlbGVtcy5sZW5ndGg7XG5cdFx0XHRmb3IgKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0dmFsdWUgPSBjYWxsYmFjayggZWxlbXNbIGkgXSwgaSwgYXJnICk7XG5cblx0XHRcdFx0aWYgKCB2YWx1ZSAhPSBudWxsICkge1xuXHRcdFx0XHRcdHJldC5wdXNoKCB2YWx1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHQvLyBHbyB0aHJvdWdoIGV2ZXJ5IGtleSBvbiB0aGUgb2JqZWN0LFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKCBpIGluIGVsZW1zICkge1xuXHRcdFx0XHR2YWx1ZSA9IGNhbGxiYWNrKCBlbGVtc1sgaSBdLCBpLCBhcmcgKTtcblxuXHRcdFx0XHRpZiAoIHZhbHVlICE9IG51bGwgKSB7XG5cdFx0XHRcdFx0cmV0LnB1c2goIHZhbHVlICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBGbGF0dGVuIGFueSBuZXN0ZWQgYXJyYXlzXG5cdFx0cmV0dXJuIGZsYXQoIHJldCApO1xuXHR9LFxuXG5cdC8vIEEgZ2xvYmFsIEdVSUQgY291bnRlciBmb3Igb2JqZWN0c1xuXHRndWlkOiAxLFxuXG5cdC8vIGpRdWVyeS5zdXBwb3J0IGlzIG5vdCB1c2VkIGluIENvcmUgYnV0IG90aGVyIHByb2plY3RzIGF0dGFjaCB0aGVpclxuXHQvLyBwcm9wZXJ0aWVzIHRvIGl0IHNvIGl0IG5lZWRzIHRvIGV4aXN0LlxuXHRzdXBwb3J0OiBzdXBwb3J0XG59ICk7XG5cbmlmICggdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRqUXVlcnkuZm5bIFN5bWJvbC5pdGVyYXRvciBdID0gYXJyWyBTeW1ib2wuaXRlcmF0b3IgXTtcbn1cblxuLy8gUG9wdWxhdGUgdGhlIGNsYXNzMnR5cGUgbWFwXG5qUXVlcnkuZWFjaCggXCJCb29sZWFuIE51bWJlciBTdHJpbmcgRnVuY3Rpb24gQXJyYXkgRGF0ZSBSZWdFeHAgT2JqZWN0IEVycm9yIFN5bWJvbFwiLnNwbGl0KCBcIiBcIiApLFxuXHRmdW5jdGlvbiggX2ksIG5hbWUgKSB7XG5cdFx0Y2xhc3MydHlwZVsgXCJbb2JqZWN0IFwiICsgbmFtZSArIFwiXVwiIF0gPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG5cdH0gKTtcblxuZnVuY3Rpb24gaXNBcnJheUxpa2UoIG9iaiApIHtcblxuXHQvLyBTdXBwb3J0OiByZWFsIGlPUyA4LjIgb25seSAobm90IHJlcHJvZHVjaWJsZSBpbiBzaW11bGF0b3IpXG5cdC8vIGBpbmAgY2hlY2sgdXNlZCB0byBwcmV2ZW50IEpJVCBlcnJvciAoZ2gtMjE0NSlcblx0Ly8gaGFzT3duIGlzbid0IHVzZWQgaGVyZSBkdWUgdG8gZmFsc2UgbmVnYXRpdmVzXG5cdC8vIHJlZ2FyZGluZyBOb2RlbGlzdCBsZW5ndGggaW4gSUVcblx0dmFyIGxlbmd0aCA9ICEhb2JqICYmIFwibGVuZ3RoXCIgaW4gb2JqICYmIG9iai5sZW5ndGgsXG5cdFx0dHlwZSA9IHRvVHlwZSggb2JqICk7XG5cblx0aWYgKCBpc0Z1bmN0aW9uKCBvYmogKSB8fCBpc1dpbmRvdyggb2JqICkgKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHR5cGUgPT09IFwiYXJyYXlcIiB8fCBsZW5ndGggPT09IDAgfHxcblx0XHR0eXBlb2YgbGVuZ3RoID09PSBcIm51bWJlclwiICYmIGxlbmd0aCA+IDAgJiYgKCBsZW5ndGggLSAxICkgaW4gb2JqO1xufVxuXG5cbmZ1bmN0aW9uIG5vZGVOYW1lKCBlbGVtLCBuYW1lICkge1xuXG5cdHJldHVybiBlbGVtLm5vZGVOYW1lICYmIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuXG59XG52YXIgcG9wID0gYXJyLnBvcDtcblxuXG52YXIgc29ydCA9IGFyci5zb3J0O1xuXG5cbnZhciBzcGxpY2UgPSBhcnIuc3BsaWNlO1xuXG5cbnZhciB3aGl0ZXNwYWNlID0gXCJbXFxcXHgyMFxcXFx0XFxcXHJcXFxcblxcXFxmXVwiO1xuXG5cbnZhciBydHJpbUNTUyA9IG5ldyBSZWdFeHAoXG5cdFwiXlwiICsgd2hpdGVzcGFjZSArIFwiK3woKD86XnxbXlxcXFxcXFxcXSkoPzpcXFxcXFxcXC4pKilcIiArIHdoaXRlc3BhY2UgKyBcIiskXCIsXG5cdFwiZ1wiXG4pO1xuXG5cblxuXG4vLyBOb3RlOiBhbiBlbGVtZW50IGRvZXMgbm90IGNvbnRhaW4gaXRzZWxmXG5qUXVlcnkuY29udGFpbnMgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0dmFyIGJ1cCA9IGIgJiYgYi5wYXJlbnROb2RlO1xuXG5cdHJldHVybiBhID09PSBidXAgfHwgISEoIGJ1cCAmJiBidXAubm9kZVR5cGUgPT09IDEgJiYgKFxuXG5cdFx0Ly8gU3VwcG9ydDogSUUgOSAtIDExK1xuXHRcdC8vIElFIGRvZXNuJ3QgaGF2ZSBgY29udGFpbnNgIG9uIFNWRy5cblx0XHRhLmNvbnRhaW5zID9cblx0XHRcdGEuY29udGFpbnMoIGJ1cCApIDpcblx0XHRcdGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gJiYgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiggYnVwICkgJiAxNlxuXHQpICk7XG59O1xuXG5cblxuXG4vLyBDU1Mgc3RyaW5nL2lkZW50aWZpZXIgc2VyaWFsaXphdGlvblxuLy8gaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzc29tLyNjb21tb24tc2VyaWFsaXppbmctaWRpb21zXG52YXIgcmNzc2VzY2FwZSA9IC8oW1xcMC1cXHgxZlxceDdmXXxeLT9cXGQpfF4tJHxbXlxceDgwLVxcdUZGRkZcXHctXS9nO1xuXG5mdW5jdGlvbiBmY3NzZXNjYXBlKCBjaCwgYXNDb2RlUG9pbnQgKSB7XG5cdGlmICggYXNDb2RlUG9pbnQgKSB7XG5cblx0XHQvLyBVKzAwMDAgTlVMTCBiZWNvbWVzIFUrRkZGRCBSRVBMQUNFTUVOVCBDSEFSQUNURVJcblx0XHRpZiAoIGNoID09PSBcIlxcMFwiICkge1xuXHRcdFx0cmV0dXJuIFwiXFx1RkZGRFwiO1xuXHRcdH1cblxuXHRcdC8vIENvbnRyb2wgY2hhcmFjdGVycyBhbmQgKGRlcGVuZGVudCB1cG9uIHBvc2l0aW9uKSBudW1iZXJzIGdldCBlc2NhcGVkIGFzIGNvZGUgcG9pbnRzXG5cdFx0cmV0dXJuIGNoLnNsaWNlKCAwLCAtMSApICsgXCJcXFxcXCIgKyBjaC5jaGFyQ29kZUF0KCBjaC5sZW5ndGggLSAxICkudG9TdHJpbmcoIDE2ICkgKyBcIiBcIjtcblx0fVxuXG5cdC8vIE90aGVyIHBvdGVudGlhbGx5LXNwZWNpYWwgQVNDSUkgY2hhcmFjdGVycyBnZXQgYmFja3NsYXNoLWVzY2FwZWRcblx0cmV0dXJuIFwiXFxcXFwiICsgY2g7XG59XG5cbmpRdWVyeS5lc2NhcGVTZWxlY3RvciA9IGZ1bmN0aW9uKCBzZWwgKSB7XG5cdHJldHVybiAoIHNlbCArIFwiXCIgKS5yZXBsYWNlKCByY3NzZXNjYXBlLCBmY3NzZXNjYXBlICk7XG59O1xuXG5cblxuXG52YXIgcHJlZmVycmVkRG9jID0gZG9jdW1lbnQsXG5cdHB1c2hOYXRpdmUgPSBwdXNoO1xuXG4oIGZ1bmN0aW9uKCkge1xuXG52YXIgaSxcblx0RXhwcixcblx0b3V0ZXJtb3N0Q29udGV4dCxcblx0c29ydElucHV0LFxuXHRoYXNEdXBsaWNhdGUsXG5cdHB1c2ggPSBwdXNoTmF0aXZlLFxuXG5cdC8vIExvY2FsIGRvY3VtZW50IHZhcnNcblx0ZG9jdW1lbnQsXG5cdGRvY3VtZW50RWxlbWVudCxcblx0ZG9jdW1lbnRJc0hUTUwsXG5cdHJidWdneVFTQSxcblx0bWF0Y2hlcyxcblxuXHQvLyBJbnN0YW5jZS1zcGVjaWZpYyBkYXRhXG5cdGV4cGFuZG8gPSBqUXVlcnkuZXhwYW5kbyxcblx0ZGlycnVucyA9IDAsXG5cdGRvbmUgPSAwLFxuXHRjbGFzc0NhY2hlID0gY3JlYXRlQ2FjaGUoKSxcblx0dG9rZW5DYWNoZSA9IGNyZWF0ZUNhY2hlKCksXG5cdGNvbXBpbGVyQ2FjaGUgPSBjcmVhdGVDYWNoZSgpLFxuXHRub25uYXRpdmVTZWxlY3RvckNhY2hlID0gY3JlYXRlQ2FjaGUoKSxcblx0c29ydE9yZGVyID0gZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0aWYgKCBhID09PSBiICkge1xuXHRcdFx0aGFzRHVwbGljYXRlID0gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIDA7XG5cdH0sXG5cblx0Ym9vbGVhbnMgPSBcImNoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxcIiArXG5cdFx0XCJsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkXCIsXG5cblx0Ly8gUmVndWxhciBleHByZXNzaW9uc1xuXG5cdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2lkZW50LXRva2VuLWRpYWdyYW1cblx0aWRlbnRpZmllciA9IFwiKD86XFxcXFxcXFxbXFxcXGRhLWZBLUZdezEsNn1cIiArIHdoaXRlc3BhY2UgK1xuXHRcdFwiP3xcXFxcXFxcXFteXFxcXHJcXFxcblxcXFxmXXxbXFxcXHctXXxbXlxcMC1cXFxceDdmXSkrXCIsXG5cblx0Ly8gQXR0cmlidXRlIHNlbGVjdG9yczogaHR0cHM6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xuXHRhdHRyaWJ1dGVzID0gXCJcXFxcW1wiICsgd2hpdGVzcGFjZSArIFwiKihcIiArIGlkZW50aWZpZXIgKyBcIikoPzpcIiArIHdoaXRlc3BhY2UgK1xuXG5cdFx0Ly8gT3BlcmF0b3IgKGNhcHR1cmUgMilcblx0XHRcIiooWypeJHwhfl0/PSlcIiArIHdoaXRlc3BhY2UgK1xuXG5cdFx0Ly8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIGlkZW50aWZpZXJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcblx0XHRcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgaWRlbnRpZmllciArIFwiKSl8KVwiICtcblx0XHR3aGl0ZXNwYWNlICsgXCIqXFxcXF1cIixcblxuXHRwc2V1ZG9zID0gXCI6KFwiICsgaWRlbnRpZmllciArIFwiKSg/OlxcXFwoKFwiICtcblxuXHRcdC8vIFRvIHJlZHVjZSB0aGUgbnVtYmVyIG9mIHNlbGVjdG9ycyBuZWVkaW5nIHRva2VuaXplIGluIHRoZSBwcmVGaWx0ZXIsIHByZWZlciBhcmd1bWVudHM6XG5cdFx0Ly8gMS4gcXVvdGVkIChjYXB0dXJlIDM7IGNhcHR1cmUgNCBvciBjYXB0dXJlIDUpXG5cdFx0XCIoJygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwiKXxcIiArXG5cblx0XHQvLyAyLiBzaW1wbGUgKGNhcHR1cmUgNilcblx0XHRcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpW1xcXFxdXXxcIiArIGF0dHJpYnV0ZXMgKyBcIikqKXxcIiArXG5cblx0XHQvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXG5cdFx0XCIuKlwiICtcblx0XHRcIilcXFxcKXwpXCIsXG5cblx0Ly8gTGVhZGluZyBhbmQgbm9uLWVzY2FwZWQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgY2FwdHVyaW5nIHNvbWUgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBwcmVjZWRpbmcgdGhlIGxhdHRlclxuXHRyd2hpdGVzcGFjZSA9IG5ldyBSZWdFeHAoIHdoaXRlc3BhY2UgKyBcIitcIiwgXCJnXCIgKSxcblxuXHRyY29tbWEgPSBuZXcgUmVnRXhwKCBcIl5cIiArIHdoaXRlc3BhY2UgKyBcIiosXCIgKyB3aGl0ZXNwYWNlICsgXCIqXCIgKSxcblx0cmxlYWRpbmdDb21iaW5hdG9yID0gbmV3IFJlZ0V4cCggXCJeXCIgKyB3aGl0ZXNwYWNlICsgXCIqKFs+K35dfFwiICsgd2hpdGVzcGFjZSArIFwiKVwiICtcblx0XHR3aGl0ZXNwYWNlICsgXCIqXCIgKSxcblx0cmRlc2NlbmQgPSBuZXcgUmVnRXhwKCB3aGl0ZXNwYWNlICsgXCJ8PlwiICksXG5cblx0cnBzZXVkbyA9IG5ldyBSZWdFeHAoIHBzZXVkb3MgKSxcblx0cmlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKCBcIl5cIiArIGlkZW50aWZpZXIgKyBcIiRcIiApLFxuXG5cdG1hdGNoRXhwciA9IHtcblx0XHRJRDogbmV3IFJlZ0V4cCggXCJeIyhcIiArIGlkZW50aWZpZXIgKyBcIilcIiApLFxuXHRcdENMQVNTOiBuZXcgUmVnRXhwKCBcIl5cXFxcLihcIiArIGlkZW50aWZpZXIgKyBcIilcIiApLFxuXHRcdFRBRzogbmV3IFJlZ0V4cCggXCJeKFwiICsgaWRlbnRpZmllciArIFwifFsqXSlcIiApLFxuXHRcdEFUVFI6IG5ldyBSZWdFeHAoIFwiXlwiICsgYXR0cmlidXRlcyApLFxuXHRcdFBTRVVETzogbmV3IFJlZ0V4cCggXCJeXCIgKyBwc2V1ZG9zICksXG5cdFx0Q0hJTEQ6IG5ldyBSZWdFeHAoXG5cdFx0XHRcIl46KG9ubHl8Zmlyc3R8bGFzdHxudGh8bnRoLWxhc3QpLShjaGlsZHxvZi10eXBlKSg/OlxcXFwoXCIgK1xuXHRcdFx0XHR3aGl0ZXNwYWNlICsgXCIqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufClcIiArIHdoaXRlc3BhY2UgKyBcIiooPzooWystXXwpXCIgK1xuXHRcdFx0XHR3aGl0ZXNwYWNlICsgXCIqKFxcXFxkKyl8KSlcIiArIHdoaXRlc3BhY2UgKyBcIipcXFxcKXwpXCIsIFwiaVwiICksXG5cdFx0Ym9vbDogbmV3IFJlZ0V4cCggXCJeKD86XCIgKyBib29sZWFucyArIFwiKSRcIiwgXCJpXCIgKSxcblxuXHRcdC8vIEZvciB1c2UgaW4gbGlicmFyaWVzIGltcGxlbWVudGluZyAuaXMoKVxuXHRcdC8vIFdlIHVzZSB0aGlzIGZvciBQT1MgbWF0Y2hpbmcgaW4gYHNlbGVjdGBcblx0XHRuZWVkc0NvbnRleHQ6IG5ldyBSZWdFeHAoIFwiXlwiICsgd2hpdGVzcGFjZSArXG5cdFx0XHRcIipbPit+XXw6KGV2ZW58b2RkfGVxfGd0fGx0fG50aHxmaXJzdHxsYXN0KSg/OlxcXFwoXCIgKyB3aGl0ZXNwYWNlICtcblx0XHRcdFwiKigoPzotXFxcXGQpP1xcXFxkKilcIiArIHdoaXRlc3BhY2UgKyBcIipcXFxcKXwpKD89W14tXXwkKVwiLCBcImlcIiApXG5cdH0sXG5cblx0cmlucHV0cyA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbikkL2ksXG5cdHJoZWFkZXIgPSAvXmhcXGQkL2ksXG5cblx0Ly8gRWFzaWx5LXBhcnNlYWJsZS9yZXRyaWV2YWJsZSBJRCBvciBUQUcgb3IgQ0xBU1Mgc2VsZWN0b3JzXG5cdHJxdWlja0V4cHIgPSAvXig/OiMoW1xcdy1dKyl8KFxcdyspfFxcLihbXFx3LV0rKSkkLyxcblxuXHRyc2libGluZyA9IC9bK35dLyxcblxuXHQvLyBDU1MgZXNjYXBlc1xuXHQvLyBodHRwczovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xuXHRydW5lc2NhcGUgPSBuZXcgUmVnRXhwKCBcIlxcXFxcXFxcW1xcXFxkYS1mQS1GXXsxLDZ9XCIgKyB3aGl0ZXNwYWNlICtcblx0XHRcIj98XFxcXFxcXFwoW15cXFxcclxcXFxuXFxcXGZdKVwiLCBcImdcIiApLFxuXHRmdW5lc2NhcGUgPSBmdW5jdGlvbiggZXNjYXBlLCBub25IZXggKSB7XG5cdFx0dmFyIGhpZ2ggPSBcIjB4XCIgKyBlc2NhcGUuc2xpY2UoIDEgKSAtIDB4MTAwMDA7XG5cblx0XHRpZiAoIG5vbkhleCApIHtcblxuXHRcdFx0Ly8gU3RyaXAgdGhlIGJhY2tzbGFzaCBwcmVmaXggZnJvbSBhIG5vbi1oZXggZXNjYXBlIHNlcXVlbmNlXG5cdFx0XHRyZXR1cm4gbm9uSGV4O1xuXHRcdH1cblxuXHRcdC8vIFJlcGxhY2UgYSBoZXhhZGVjaW1hbCBlc2NhcGUgc2VxdWVuY2Ugd2l0aCB0aGUgZW5jb2RlZCBVbmljb2RlIGNvZGUgcG9pbnRcblx0XHQvLyBTdXBwb3J0OiBJRSA8PTExK1xuXHRcdC8vIEZvciB2YWx1ZXMgb3V0c2lkZSB0aGUgQmFzaWMgTXVsdGlsaW5ndWFsIFBsYW5lIChCTVApLCBtYW51YWxseSBjb25zdHJ1Y3QgYVxuXHRcdC8vIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0cmV0dXJuIGhpZ2ggPCAwID9cblx0XHRcdFN0cmluZy5mcm9tQ2hhckNvZGUoIGhpZ2ggKyAweDEwMDAwICkgOlxuXHRcdFx0U3RyaW5nLmZyb21DaGFyQ29kZSggaGlnaCA+PiAxMCB8IDB4RDgwMCwgaGlnaCAmIDB4M0ZGIHwgMHhEQzAwICk7XG5cdH0sXG5cblx0Ly8gVXNlZCBmb3IgaWZyYW1lczsgc2VlIGBzZXREb2N1bWVudGAuXG5cdC8vIFN1cHBvcnQ6IElFIDkgLSAxMSssIEVkZ2UgMTIgLSAxOCtcblx0Ly8gUmVtb3ZpbmcgdGhlIGZ1bmN0aW9uIHdyYXBwZXIgY2F1c2VzIGEgXCJQZXJtaXNzaW9uIERlbmllZFwiXG5cdC8vIGVycm9yIGluIElFL0VkZ2UuXG5cdHVubG9hZEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblx0XHRzZXREb2N1bWVudCgpO1xuXHR9LFxuXG5cdGluRGlzYWJsZWRGaWVsZHNldCA9IGFkZENvbWJpbmF0b3IoXG5cdFx0ZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5kaXNhYmxlZCA9PT0gdHJ1ZSAmJiBub2RlTmFtZSggZWxlbSwgXCJmaWVsZHNldFwiICk7XG5cdFx0fSxcblx0XHR7IGRpcjogXCJwYXJlbnROb2RlXCIsIG5leHQ6IFwibGVnZW5kXCIgfVxuXHQpO1xuXG4vLyBTdXBwb3J0OiBJRSA8PTkgb25seVxuLy8gQWNjZXNzaW5nIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgY2FuIHRocm93IHVuZXhwZWN0ZWRseVxuLy8gaHR0cHM6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzEzMzkzXG5mdW5jdGlvbiBzYWZlQWN0aXZlRWxlbWVudCgpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblx0fSBjYXRjaCAoIGVyciApIHsgfVxufVxuXG4vLyBPcHRpbWl6ZSBmb3IgcHVzaC5hcHBseSggXywgTm9kZUxpc3QgKVxudHJ5IHtcblx0cHVzaC5hcHBseShcblx0XHQoIGFyciA9IHNsaWNlLmNhbGwoIHByZWZlcnJlZERvYy5jaGlsZE5vZGVzICkgKSxcblx0XHRwcmVmZXJyZWREb2MuY2hpbGROb2Rlc1xuXHQpO1xuXG5cdC8vIFN1cHBvcnQ6IEFuZHJvaWQgPD00LjBcblx0Ly8gRGV0ZWN0IHNpbGVudGx5IGZhaWxpbmcgcHVzaC5hcHBseVxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLWV4cHJlc3Npb25zXG5cdGFyclsgcHJlZmVycmVkRG9jLmNoaWxkTm9kZXMubGVuZ3RoIF0ubm9kZVR5cGU7XG59IGNhdGNoICggZSApIHtcblx0cHVzaCA9IHtcblx0XHRhcHBseTogZnVuY3Rpb24oIHRhcmdldCwgZWxzICkge1xuXHRcdFx0cHVzaE5hdGl2ZS5hcHBseSggdGFyZ2V0LCBzbGljZS5jYWxsKCBlbHMgKSApO1xuXHRcdH0sXG5cdFx0Y2FsbDogZnVuY3Rpb24oIHRhcmdldCApIHtcblx0XHRcdHB1c2hOYXRpdmUuYXBwbHkoIHRhcmdldCwgc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICkgKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGZpbmQoIHNlbGVjdG9yLCBjb250ZXh0LCByZXN1bHRzLCBzZWVkICkge1xuXHR2YXIgbSwgaSwgZWxlbSwgbmlkLCBtYXRjaCwgZ3JvdXBzLCBuZXdTZWxlY3Rvcixcblx0XHRuZXdDb250ZXh0ID0gY29udGV4dCAmJiBjb250ZXh0Lm93bmVyRG9jdW1lbnQsXG5cblx0XHQvLyBub2RlVHlwZSBkZWZhdWx0cyB0byA5LCBzaW5jZSBjb250ZXh0IGRlZmF1bHRzIHRvIGRvY3VtZW50XG5cdFx0bm9kZVR5cGUgPSBjb250ZXh0ID8gY29udGV4dC5ub2RlVHlwZSA6IDk7XG5cblx0cmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG5cblx0Ly8gUmV0dXJuIGVhcmx5IGZyb20gY2FsbHMgd2l0aCBpbnZhbGlkIHNlbGVjdG9yIG9yIGNvbnRleHRcblx0aWYgKCB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIgfHwgIXNlbGVjdG9yIHx8XG5cdFx0bm9kZVR5cGUgIT09IDEgJiYgbm9kZVR5cGUgIT09IDkgJiYgbm9kZVR5cGUgIT09IDExICkge1xuXG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH1cblxuXHQvLyBUcnkgdG8gc2hvcnRjdXQgZmluZCBvcGVyYXRpb25zIChhcyBvcHBvc2VkIHRvIGZpbHRlcnMpIGluIEhUTUwgZG9jdW1lbnRzXG5cdGlmICggIXNlZWQgKSB7XG5cdFx0c2V0RG9jdW1lbnQoIGNvbnRleHQgKTtcblx0XHRjb250ZXh0ID0gY29udGV4dCB8fCBkb2N1bWVudDtcblxuXHRcdGlmICggZG9jdW1lbnRJc0hUTUwgKSB7XG5cblx0XHRcdC8vIElmIHRoZSBzZWxlY3RvciBpcyBzdWZmaWNpZW50bHkgc2ltcGxlLCB0cnkgdXNpbmcgYSBcImdldCpCeSpcIiBET00gbWV0aG9kXG5cdFx0XHQvLyAoZXhjZXB0aW5nIERvY3VtZW50RnJhZ21lbnQgY29udGV4dCwgd2hlcmUgdGhlIG1ldGhvZHMgZG9uJ3QgZXhpc3QpXG5cdFx0XHRpZiAoIG5vZGVUeXBlICE9PSAxMSAmJiAoIG1hdGNoID0gcnF1aWNrRXhwci5leGVjKCBzZWxlY3RvciApICkgKSB7XG5cblx0XHRcdFx0Ly8gSUQgc2VsZWN0b3Jcblx0XHRcdFx0aWYgKCAoIG0gPSBtYXRjaFsgMSBdICkgKSB7XG5cblx0XHRcdFx0XHQvLyBEb2N1bWVudCBjb250ZXh0XG5cdFx0XHRcdFx0aWYgKCBub2RlVHlwZSA9PT0gOSApIHtcblx0XHRcdFx0XHRcdGlmICggKCBlbGVtID0gY29udGV4dC5nZXRFbGVtZW50QnlJZCggbSApICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUgOSBvbmx5XG5cdFx0XHRcdFx0XHRcdC8vIGdldEVsZW1lbnRCeUlkIGNhbiBtYXRjaCBlbGVtZW50cyBieSBuYW1lIGluc3RlYWQgb2YgSURcblx0XHRcdFx0XHRcdFx0aWYgKCBlbGVtLmlkID09PSBtICkge1xuXHRcdFx0XHRcdFx0XHRcdHB1c2guY2FsbCggcmVzdWx0cywgZWxlbSApO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIEVsZW1lbnQgY29udGV4dFxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDkgb25seVxuXHRcdFx0XHRcdFx0Ly8gZ2V0RWxlbWVudEJ5SWQgY2FuIG1hdGNoIGVsZW1lbnRzIGJ5IG5hbWUgaW5zdGVhZCBvZiBJRFxuXHRcdFx0XHRcdFx0aWYgKCBuZXdDb250ZXh0ICYmICggZWxlbSA9IG5ld0NvbnRleHQuZ2V0RWxlbWVudEJ5SWQoIG0gKSApICYmXG5cdFx0XHRcdFx0XHRcdGZpbmQuY29udGFpbnMoIGNvbnRleHQsIGVsZW0gKSAmJlxuXHRcdFx0XHRcdFx0XHRlbGVtLmlkID09PSBtICkge1xuXG5cdFx0XHRcdFx0XHRcdHB1c2guY2FsbCggcmVzdWx0cywgZWxlbSApO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVHlwZSBzZWxlY3RvclxuXHRcdFx0XHR9IGVsc2UgaWYgKCBtYXRjaFsgMiBdICkge1xuXHRcdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIHNlbGVjdG9yICkgKTtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0cztcblxuXHRcdFx0XHQvLyBDbGFzcyBzZWxlY3RvclxuXHRcdFx0XHR9IGVsc2UgaWYgKCAoIG0gPSBtYXRjaFsgMyBdICkgJiYgY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lICkge1xuXHRcdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsIGNvbnRleHQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSggbSApICk7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gVGFrZSBhZHZhbnRhZ2Ugb2YgcXVlcnlTZWxlY3RvckFsbFxuXHRcdFx0aWYgKCAhbm9ubmF0aXZlU2VsZWN0b3JDYWNoZVsgc2VsZWN0b3IgKyBcIiBcIiBdICYmXG5cdFx0XHRcdCggIXJidWdneVFTQSB8fCAhcmJ1Z2d5UVNBLnRlc3QoIHNlbGVjdG9yICkgKSApIHtcblxuXHRcdFx0XHRuZXdTZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdFx0XHRuZXdDb250ZXh0ID0gY29udGV4dDtcblxuXHRcdFx0XHQvLyBxU0EgY29uc2lkZXJzIGVsZW1lbnRzIG91dHNpZGUgYSBzY29waW5nIHJvb3Qgd2hlbiBldmFsdWF0aW5nIGNoaWxkIG9yXG5cdFx0XHRcdC8vIGRlc2NlbmRhbnQgY29tYmluYXRvcnMsIHdoaWNoIGlzIG5vdCB3aGF0IHdlIHdhbnQuXG5cdFx0XHRcdC8vIEluIHN1Y2ggY2FzZXMsIHdlIHdvcmsgYXJvdW5kIHRoZSBiZWhhdmlvciBieSBwcmVmaXhpbmcgZXZlcnkgc2VsZWN0b3IgaW4gdGhlXG5cdFx0XHRcdC8vIGxpc3Qgd2l0aCBhbiBJRCBzZWxlY3RvciByZWZlcmVuY2luZyB0aGUgc2NvcGUgY29udGV4dC5cblx0XHRcdFx0Ly8gVGhlIHRlY2huaXF1ZSBoYXMgdG8gYmUgdXNlZCBhcyB3ZWxsIHdoZW4gYSBsZWFkaW5nIGNvbWJpbmF0b3IgaXMgdXNlZFxuXHRcdFx0XHQvLyBhcyBzdWNoIHNlbGVjdG9ycyBhcmUgbm90IHJlY29nbml6ZWQgYnkgcXVlcnlTZWxlY3RvckFsbC5cblx0XHRcdFx0Ly8gVGhhbmtzIHRvIEFuZHJldyBEdXBvbnQgZm9yIHRoaXMgdGVjaG5pcXVlLlxuXHRcdFx0XHRpZiAoIG5vZGVUeXBlID09PSAxICYmXG5cdFx0XHRcdFx0KCByZGVzY2VuZC50ZXN0KCBzZWxlY3RvciApIHx8IHJsZWFkaW5nQ29tYmluYXRvci50ZXN0KCBzZWxlY3RvciApICkgKSB7XG5cblx0XHRcdFx0XHQvLyBFeHBhbmQgY29udGV4dCBmb3Igc2libGluZyBzZWxlY3RvcnNcblx0XHRcdFx0XHRuZXdDb250ZXh0ID0gcnNpYmxpbmcudGVzdCggc2VsZWN0b3IgKSAmJiB0ZXN0Q29udGV4dCggY29udGV4dC5wYXJlbnROb2RlICkgfHxcblx0XHRcdFx0XHRcdGNvbnRleHQ7XG5cblx0XHRcdFx0XHQvLyBXZSBjYW4gdXNlIDpzY29wZSBpbnN0ZWFkIG9mIHRoZSBJRCBoYWNrIGlmIHRoZSBicm93c2VyXG5cdFx0XHRcdFx0Ly8gc3VwcG9ydHMgaXQgJiBpZiB3ZSdyZSBub3QgY2hhbmdpbmcgdGhlIGNvbnRleHQuXG5cdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUgMTErLCBFZGdlIDE3IC0gMTgrXG5cdFx0XHRcdFx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlblxuXHRcdFx0XHRcdC8vIHN0cmljdC1jb21wYXJpbmcgdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcblx0XHRcdFx0XHRpZiAoIG5ld0NvbnRleHQgIT0gY29udGV4dCB8fCAhc3VwcG9ydC5zY29wZSApIHtcblxuXHRcdFx0XHRcdFx0Ly8gQ2FwdHVyZSB0aGUgY29udGV4dCBJRCwgc2V0dGluZyBpdCBmaXJzdCBpZiBuZWNlc3Nhcnlcblx0XHRcdFx0XHRcdGlmICggKCBuaWQgPSBjb250ZXh0LmdldEF0dHJpYnV0ZSggXCJpZFwiICkgKSApIHtcblx0XHRcdFx0XHRcdFx0bmlkID0galF1ZXJ5LmVzY2FwZVNlbGVjdG9yKCBuaWQgKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRleHQuc2V0QXR0cmlidXRlKCBcImlkXCIsICggbmlkID0gZXhwYW5kbyApICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gUHJlZml4IGV2ZXJ5IHNlbGVjdG9yIGluIHRoZSBsaXN0XG5cdFx0XHRcdFx0Z3JvdXBzID0gdG9rZW5pemUoIHNlbGVjdG9yICk7XG5cdFx0XHRcdFx0aSA9IGdyb3Vwcy5sZW5ndGg7XG5cdFx0XHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRcdFx0XHRncm91cHNbIGkgXSA9ICggbmlkID8gXCIjXCIgKyBuaWQgOiBcIjpzY29wZVwiICkgKyBcIiBcIiArXG5cdFx0XHRcdFx0XHRcdHRvU2VsZWN0b3IoIGdyb3Vwc1sgaSBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG5ld1NlbGVjdG9yID0gZ3JvdXBzLmpvaW4oIFwiLFwiICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHB1c2guYXBwbHkoIHJlc3VsdHMsXG5cdFx0XHRcdFx0XHRuZXdDb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoIG5ld1NlbGVjdG9yIClcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHRzO1xuXHRcdFx0XHR9IGNhdGNoICggcXNhRXJyb3IgKSB7XG5cdFx0XHRcdFx0bm9ubmF0aXZlU2VsZWN0b3JDYWNoZSggc2VsZWN0b3IsIHRydWUgKTtcblx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHRpZiAoIG5pZCA9PT0gZXhwYW5kbyApIHtcblx0XHRcdFx0XHRcdGNvbnRleHQucmVtb3ZlQXR0cmlidXRlKCBcImlkXCIgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBBbGwgb3RoZXJzXG5cdHJldHVybiBzZWxlY3QoIHNlbGVjdG9yLnJlcGxhY2UoIHJ0cmltQ1NTLCBcIiQxXCIgKSwgY29udGV4dCwgcmVzdWx0cywgc2VlZCApO1xufVxuXG4vKipcbiAqIENyZWF0ZSBrZXktdmFsdWUgY2FjaGVzIG9mIGxpbWl0ZWQgc2l6ZVxuICogQHJldHVybnMge2Z1bmN0aW9uKHN0cmluZywgb2JqZWN0KX0gUmV0dXJucyB0aGUgT2JqZWN0IGRhdGEgYWZ0ZXIgc3RvcmluZyBpdCBvbiBpdHNlbGYgd2l0aFxuICpcdHByb3BlcnR5IG5hbWUgdGhlIChzcGFjZS1zdWZmaXhlZCkgc3RyaW5nIGFuZCAoaWYgdGhlIGNhY2hlIGlzIGxhcmdlciB0aGFuIEV4cHIuY2FjaGVMZW5ndGgpXG4gKlx0ZGVsZXRpbmcgdGhlIG9sZGVzdCBlbnRyeVxuICovXG5mdW5jdGlvbiBjcmVhdGVDYWNoZSgpIHtcblx0dmFyIGtleXMgPSBbXTtcblxuXHRmdW5jdGlvbiBjYWNoZSgga2V5LCB2YWx1ZSApIHtcblxuXHRcdC8vIFVzZSAoa2V5ICsgXCIgXCIpIHRvIGF2b2lkIGNvbGxpc2lvbiB3aXRoIG5hdGl2ZSBwcm90b3R5cGUgcHJvcGVydGllc1xuXHRcdC8vIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9zaXp6bGUvaXNzdWVzLzE1Nylcblx0XHRpZiAoIGtleXMucHVzaCgga2V5ICsgXCIgXCIgKSA+IEV4cHIuY2FjaGVMZW5ndGggKSB7XG5cblx0XHRcdC8vIE9ubHkga2VlcCB0aGUgbW9zdCByZWNlbnQgZW50cmllc1xuXHRcdFx0ZGVsZXRlIGNhY2hlWyBrZXlzLnNoaWZ0KCkgXTtcblx0XHR9XG5cdFx0cmV0dXJuICggY2FjaGVbIGtleSArIFwiIFwiIF0gPSB2YWx1ZSApO1xuXHR9XG5cdHJldHVybiBjYWNoZTtcbn1cblxuLyoqXG4gKiBNYXJrIGEgZnVuY3Rpb24gZm9yIHNwZWNpYWwgdXNlIGJ5IGpRdWVyeSBzZWxlY3RvciBtb2R1bGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBtYXJrXG4gKi9cbmZ1bmN0aW9uIG1hcmtGdW5jdGlvbiggZm4gKSB7XG5cdGZuWyBleHBhbmRvIF0gPSB0cnVlO1xuXHRyZXR1cm4gZm47XG59XG5cbi8qKlxuICogU3VwcG9ydCB0ZXN0aW5nIHVzaW5nIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFBhc3NlZCB0aGUgY3JlYXRlZCBlbGVtZW50IGFuZCByZXR1cm5zIGEgYm9vbGVhbiByZXN1bHRcbiAqL1xuZnVuY3Rpb24gYXNzZXJ0KCBmbiApIHtcblx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJmaWVsZHNldFwiICk7XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gISFmbiggZWwgKTtcblx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9IGZpbmFsbHkge1xuXG5cdFx0Ly8gUmVtb3ZlIGZyb20gaXRzIHBhcmVudCBieSBkZWZhdWx0XG5cdFx0aWYgKCBlbC5wYXJlbnROb2RlICkge1xuXHRcdFx0ZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggZWwgKTtcblx0XHR9XG5cblx0XHQvLyByZWxlYXNlIG1lbW9yeSBpbiBJRVxuXHRcdGVsID0gbnVsbDtcblx0fVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0byB1c2UgaW4gcHNldWRvcyBmb3IgaW5wdXQgdHlwZXNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUlucHV0UHNldWRvKCB0eXBlICkge1xuXHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0cmV0dXJuIG5vZGVOYW1lKCBlbGVtLCBcImlucHV0XCIgKSAmJiBlbGVtLnR5cGUgPT09IHR5cGU7XG5cdH07XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIHVzZSBpbiBwc2V1ZG9zIGZvciBidXR0b25zXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICovXG5mdW5jdGlvbiBjcmVhdGVCdXR0b25Qc2V1ZG8oIHR5cGUgKSB7XG5cdHJldHVybiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRyZXR1cm4gKCBub2RlTmFtZSggZWxlbSwgXCJpbnB1dFwiICkgfHwgbm9kZU5hbWUoIGVsZW0sIFwiYnV0dG9uXCIgKSApICYmXG5cdFx0XHRlbGVtLnR5cGUgPT09IHR5cGU7XG5cdH07XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIHVzZSBpbiBwc2V1ZG9zIGZvciA6ZW5hYmxlZC86ZGlzYWJsZWRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzYWJsZWQgdHJ1ZSBmb3IgOmRpc2FibGVkOyBmYWxzZSBmb3IgOmVuYWJsZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlzYWJsZWRQc2V1ZG8oIGRpc2FibGVkICkge1xuXG5cdC8vIEtub3duIDpkaXNhYmxlZCBmYWxzZSBwb3NpdGl2ZXM6IGZpZWxkc2V0W2Rpc2FibGVkXSA+IGxlZ2VuZDpudGgtb2YtdHlwZShuKzIpIDpjYW4tZGlzYWJsZVxuXHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cblx0XHQvLyBPbmx5IGNlcnRhaW4gZWxlbWVudHMgY2FuIG1hdGNoIDplbmFibGVkIG9yIDpkaXNhYmxlZFxuXHRcdC8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3NjcmlwdGluZy5odG1sI3NlbGVjdG9yLWVuYWJsZWRcblx0XHQvLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zY3JpcHRpbmcuaHRtbCNzZWxlY3Rvci1kaXNhYmxlZFxuXHRcdGlmICggXCJmb3JtXCIgaW4gZWxlbSApIHtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGluaGVyaXRlZCBkaXNhYmxlZG5lc3Mgb24gcmVsZXZhbnQgbm9uLWRpc2FibGVkIGVsZW1lbnRzOlxuXHRcdFx0Ly8gKiBsaXN0ZWQgZm9ybS1hc3NvY2lhdGVkIGVsZW1lbnRzIGluIGEgZGlzYWJsZWQgZmllbGRzZXRcblx0XHRcdC8vICAgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCNjYXRlZ29yeS1saXN0ZWRcblx0XHRcdC8vICAgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCNjb25jZXB0LWZlLWRpc2FibGVkXG5cdFx0XHQvLyAqIG9wdGlvbiBlbGVtZW50cyBpbiBhIGRpc2FibGVkIG9wdGdyb3VwXG5cdFx0XHQvLyAgIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2Zvcm1zLmh0bWwjY29uY2VwdC1vcHRpb24tZGlzYWJsZWRcblx0XHRcdC8vIEFsbCBzdWNoIGVsZW1lbnRzIGhhdmUgYSBcImZvcm1cIiBwcm9wZXJ0eS5cblx0XHRcdGlmICggZWxlbS5wYXJlbnROb2RlICYmIGVsZW0uZGlzYWJsZWQgPT09IGZhbHNlICkge1xuXG5cdFx0XHRcdC8vIE9wdGlvbiBlbGVtZW50cyBkZWZlciB0byBhIHBhcmVudCBvcHRncm91cCBpZiBwcmVzZW50XG5cdFx0XHRcdGlmICggXCJsYWJlbFwiIGluIGVsZW0gKSB7XG5cdFx0XHRcdFx0aWYgKCBcImxhYmVsXCIgaW4gZWxlbS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVsZW0ucGFyZW50Tm9kZS5kaXNhYmxlZCA9PT0gZGlzYWJsZWQ7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA2IC0gMTErXG5cdFx0XHRcdC8vIFVzZSB0aGUgaXNEaXNhYmxlZCBzaG9ydGN1dCBwcm9wZXJ0eSB0byBjaGVjayBmb3IgZGlzYWJsZWQgZmllbGRzZXQgYW5jZXN0b3JzXG5cdFx0XHRcdHJldHVybiBlbGVtLmlzRGlzYWJsZWQgPT09IGRpc2FibGVkIHx8XG5cblx0XHRcdFx0XHQvLyBXaGVyZSB0aGVyZSBpcyBubyBpc0Rpc2FibGVkLCBjaGVjayBtYW51YWxseVxuXHRcdFx0XHRcdGVsZW0uaXNEaXNhYmxlZCAhPT0gIWRpc2FibGVkICYmXG5cdFx0XHRcdFx0XHRpbkRpc2FibGVkRmllbGRzZXQoIGVsZW0gKSA9PT0gZGlzYWJsZWQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblxuXHRcdC8vIFRyeSB0byB3aW5ub3cgb3V0IGVsZW1lbnRzIHRoYXQgY2FuJ3QgYmUgZGlzYWJsZWQgYmVmb3JlIHRydXN0aW5nIHRoZSBkaXNhYmxlZCBwcm9wZXJ0eS5cblx0XHQvLyBTb21lIHZpY3RpbXMgZ2V0IGNhdWdodCBpbiBvdXIgbmV0IChsYWJlbCwgbGVnZW5kLCBtZW51LCB0cmFjayksIGJ1dCBpdCBzaG91bGRuJ3Rcblx0XHQvLyBldmVuIGV4aXN0IG9uIHRoZW0sIGxldCBhbG9uZSBoYXZlIGEgYm9vbGVhbiB2YWx1ZS5cblx0XHR9IGVsc2UgaWYgKCBcImxhYmVsXCIgaW4gZWxlbSApIHtcblx0XHRcdHJldHVybiBlbGVtLmRpc2FibGVkID09PSBkaXNhYmxlZDtcblx0XHR9XG5cblx0XHQvLyBSZW1haW5pbmcgZWxlbWVudHMgYXJlIG5laXRoZXIgOmVuYWJsZWQgbm9yIDpkaXNhYmxlZFxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gdXNlIGluIHBzZXVkb3MgZm9yIHBvc2l0aW9uYWxzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5mdW5jdGlvbiBjcmVhdGVQb3NpdGlvbmFsUHNldWRvKCBmbiApIHtcblx0cmV0dXJuIG1hcmtGdW5jdGlvbiggZnVuY3Rpb24oIGFyZ3VtZW50ICkge1xuXHRcdGFyZ3VtZW50ID0gK2FyZ3VtZW50O1xuXHRcdHJldHVybiBtYXJrRnVuY3Rpb24oIGZ1bmN0aW9uKCBzZWVkLCBtYXRjaGVzICkge1xuXHRcdFx0dmFyIGosXG5cdFx0XHRcdG1hdGNoSW5kZXhlcyA9IGZuKCBbXSwgc2VlZC5sZW5ndGgsIGFyZ3VtZW50ICksXG5cdFx0XHRcdGkgPSBtYXRjaEluZGV4ZXMubGVuZ3RoO1xuXG5cdFx0XHQvLyBNYXRjaCBlbGVtZW50cyBmb3VuZCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4ZXNcblx0XHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0XHRpZiAoIHNlZWRbICggaiA9IG1hdGNoSW5kZXhlc1sgaSBdICkgXSApIHtcblx0XHRcdFx0XHRzZWVkWyBqIF0gPSAhKCBtYXRjaGVzWyBqIF0gPSBzZWVkWyBqIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSApO1xufVxuXG4vKipcbiAqIENoZWNrcyBhIG5vZGUgZm9yIHZhbGlkaXR5IGFzIGEgalF1ZXJ5IHNlbGVjdG9yIGNvbnRleHRcbiAqIEBwYXJhbSB7RWxlbWVudHxPYmplY3Q9fSBjb250ZXh0XG4gKiBAcmV0dXJucyB7RWxlbWVudHxPYmplY3R8Qm9vbGVhbn0gVGhlIGlucHV0IG5vZGUgaWYgYWNjZXB0YWJsZSwgb3RoZXJ3aXNlIGEgZmFsc3kgdmFsdWVcbiAqL1xuZnVuY3Rpb24gdGVzdENvbnRleHQoIGNvbnRleHQgKSB7XG5cdHJldHVybiBjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnRleHQ7XG59XG5cbi8qKlxuICogU2V0cyBkb2N1bWVudC1yZWxhdGVkIHZhcmlhYmxlcyBvbmNlIGJhc2VkIG9uIHRoZSBjdXJyZW50IGRvY3VtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBbbm9kZV0gQW4gZWxlbWVudCBvciBkb2N1bWVudCBvYmplY3QgdG8gdXNlIHRvIHNldCB0aGUgZG9jdW1lbnRcbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGN1cnJlbnQgZG9jdW1lbnRcbiAqL1xuZnVuY3Rpb24gc2V0RG9jdW1lbnQoIG5vZGUgKSB7XG5cdHZhciBzdWJXaW5kb3csXG5cdFx0ZG9jID0gbm9kZSA/IG5vZGUub3duZXJEb2N1bWVudCB8fCBub2RlIDogcHJlZmVycmVkRG9jO1xuXG5cdC8vIFJldHVybiBlYXJseSBpZiBkb2MgaXMgaW52YWxpZCBvciBhbHJlYWR5IHNlbGVjdGVkXG5cdC8vIFN1cHBvcnQ6IElFIDExKywgRWRnZSAxNyAtIDE4K1xuXHQvLyBJRS9FZGdlIHNvbWV0aW1lcyB0aHJvdyBhIFwiUGVybWlzc2lvbiBkZW5pZWRcIiBlcnJvciB3aGVuIHN0cmljdC1jb21wYXJpbmdcblx0Ly8gdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG5cdGlmICggZG9jID09IGRvY3VtZW50IHx8IGRvYy5ub2RlVHlwZSAhPT0gOSB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCApIHtcblx0XHRyZXR1cm4gZG9jdW1lbnQ7XG5cdH1cblxuXHQvLyBVcGRhdGUgZ2xvYmFsIHZhcmlhYmxlc1xuXHRkb2N1bWVudCA9IGRvYztcblx0ZG9jdW1lbnRFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRkb2N1bWVudElzSFRNTCA9ICFqUXVlcnkuaXNYTUxEb2MoIGRvY3VtZW50ICk7XG5cblx0Ly8gU3VwcG9ydDogaU9TIDcgb25seSwgSUUgOSAtIDExK1xuXHQvLyBPbGRlciBicm93c2VycyBkaWRuJ3Qgc3VwcG9ydCB1bnByZWZpeGVkIGBtYXRjaGVzYC5cblx0bWF0Y2hlcyA9IGRvY3VtZW50RWxlbWVudC5tYXRjaGVzIHx8XG5cdFx0ZG9jdW1lbnRFbGVtZW50LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuXHRcdGRvY3VtZW50RWxlbWVudC5tc01hdGNoZXNTZWxlY3RvcjtcblxuXHQvLyBTdXBwb3J0OiBJRSA5IC0gMTErLCBFZGdlIDEyIC0gMTgrXG5cdC8vIEFjY2Vzc2luZyBpZnJhbWUgZG9jdW1lbnRzIGFmdGVyIHVubG9hZCB0aHJvd3MgXCJwZXJtaXNzaW9uIGRlbmllZFwiIGVycm9yc1xuXHQvLyAoc2VlIHRyYWMtMTM5MzYpLlxuXHQvLyBMaW1pdCB0aGUgZml4IHRvIElFICYgRWRnZSBMZWdhY3k7IGRlc3BpdGUgRWRnZSAxNSsgaW1wbGVtZW50aW5nIGBtYXRjaGVzYCxcblx0Ly8gYWxsIElFIDkrIGFuZCBFZGdlIExlZ2FjeSB2ZXJzaW9ucyBpbXBsZW1lbnQgYG1zTWF0Y2hlc1NlbGVjdG9yYCBhcyB3ZWxsLlxuXHRpZiAoIGRvY3VtZW50RWxlbWVudC5tc01hdGNoZXNTZWxlY3RvciAmJlxuXG5cdFx0Ly8gU3VwcG9ydDogSUUgMTErLCBFZGdlIDE3IC0gMTgrXG5cdFx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlbiBzdHJpY3QtY29tcGFyaW5nXG5cdFx0Ly8gdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcblx0XHRwcmVmZXJyZWREb2MgIT0gZG9jdW1lbnQgJiZcblx0XHQoIHN1YldpbmRvdyA9IGRvY3VtZW50LmRlZmF1bHRWaWV3ICkgJiYgc3ViV2luZG93LnRvcCAhPT0gc3ViV2luZG93ICkge1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgOSAtIDExKywgRWRnZSAxMiAtIDE4K1xuXHRcdHN1YldpbmRvdy5hZGRFdmVudExpc3RlbmVyKCBcInVubG9hZFwiLCB1bmxvYWRIYW5kbGVyICk7XG5cdH1cblxuXHQvLyBTdXBwb3J0OiBJRSA8MTBcblx0Ly8gQ2hlY2sgaWYgZ2V0RWxlbWVudEJ5SWQgcmV0dXJucyBlbGVtZW50cyBieSBuYW1lXG5cdC8vIFRoZSBicm9rZW4gZ2V0RWxlbWVudEJ5SWQgbWV0aG9kcyBkb24ndCBwaWNrIHVwIHByb2dyYW1tYXRpY2FsbHktc2V0IG5hbWVzLFxuXHQvLyBzbyB1c2UgYSByb3VuZGFib3V0IGdldEVsZW1lbnRzQnlOYW1lIHRlc3Rcblx0c3VwcG9ydC5nZXRCeUlkID0gYXNzZXJ0KCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0ZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKCBlbCApLmlkID0galF1ZXJ5LmV4cGFuZG87XG5cdFx0cmV0dXJuICFkb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSB8fFxuXHRcdFx0IWRvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCBqUXVlcnkuZXhwYW5kbyApLmxlbmd0aDtcblx0fSApO1xuXG5cdC8vIFN1cHBvcnQ6IElFIDkgb25seVxuXHQvLyBDaGVjayB0byBzZWUgaWYgaXQncyBwb3NzaWJsZSB0byBkbyBtYXRjaGVzU2VsZWN0b3Jcblx0Ly8gb24gYSBkaXNjb25uZWN0ZWQgbm9kZS5cblx0c3VwcG9ydC5kaXNjb25uZWN0ZWRNYXRjaCA9IGFzc2VydCggZnVuY3Rpb24oIGVsICkge1xuXHRcdHJldHVybiBtYXRjaGVzLmNhbGwoIGVsLCBcIipcIiApO1xuXHR9ICk7XG5cblx0Ly8gU3VwcG9ydDogSUUgOSAtIDExKywgRWRnZSAxMiAtIDE4K1xuXHQvLyBJRS9FZGdlIGRvbid0IHN1cHBvcnQgdGhlIDpzY29wZSBwc2V1ZG8tY2xhc3MuXG5cdHN1cHBvcnQuc2NvcGUgPSBhc3NlcnQoIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBcIjpzY29wZVwiICk7XG5cdH0gKTtcblxuXHQvLyBTdXBwb3J0OiBDaHJvbWUgMTA1IC0gMTExIG9ubHksIFNhZmFyaSAxNS40IC0gMTYuMyBvbmx5XG5cdC8vIE1ha2Ugc3VyZSB0aGUgYDpoYXMoKWAgYXJndW1lbnQgaXMgcGFyc2VkIHVuZm9yZ2l2aW5nbHkuXG5cdC8vIFdlIGluY2x1ZGUgYCpgIGluIHRoZSB0ZXN0IHRvIGRldGVjdCBidWdneSBpbXBsZW1lbnRhdGlvbnMgdGhhdCBhcmVcblx0Ly8gX3NlbGVjdGl2ZWx5XyBmb3JnaXZpbmcgKHNwZWNpZmljYWxseSB3aGVuIHRoZSBsaXN0IGluY2x1ZGVzIGF0IGxlYXN0XG5cdC8vIG9uZSB2YWxpZCBzZWxlY3RvcikuXG5cdC8vIE5vdGUgdGhhdCB3ZSB0cmVhdCBjb21wbGV0ZSBsYWNrIG9mIHN1cHBvcnQgZm9yIGA6aGFzKClgIGFzIGlmIGl0IHdlcmVcblx0Ly8gc3BlYy1jb21wbGlhbnQgc3VwcG9ydCwgd2hpY2ggaXMgZmluZSBiZWNhdXNlIHVzZSBvZiBgOmhhcygpYCBpbiBzdWNoXG5cdC8vIGVudmlyb25tZW50cyB3aWxsIGZhaWwgaW4gdGhlIHFTQSBwYXRoIGFuZCBmYWxsIGJhY2sgdG8galF1ZXJ5IHRyYXZlcnNhbFxuXHQvLyBhbnl3YXkuXG5cdHN1cHBvcnQuY3NzSGFzID0gYXNzZXJ0KCBmdW5jdGlvbigpIHtcblx0XHR0cnkge1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvciggXCI6aGFzKCosOmpxZmFrZSlcIiApO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9ICk7XG5cblx0Ly8gSUQgZmlsdGVyIGFuZCBmaW5kXG5cdGlmICggc3VwcG9ydC5nZXRCeUlkICkge1xuXHRcdEV4cHIuZmlsdGVyLklEID0gZnVuY3Rpb24oIGlkICkge1xuXHRcdFx0dmFyIGF0dHJJZCA9IGlkLnJlcGxhY2UoIHJ1bmVzY2FwZSwgZnVuZXNjYXBlICk7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRcdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggXCJpZFwiICkgPT09IGF0dHJJZDtcblx0XHRcdH07XG5cdFx0fTtcblx0XHRFeHByLmZpbmQuSUQgPSBmdW5jdGlvbiggaWQsIGNvbnRleHQgKSB7XG5cdFx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRCeUlkICE9PSBcInVuZGVmaW5lZFwiICYmIGRvY3VtZW50SXNIVE1MICkge1xuXHRcdFx0XHR2YXIgZWxlbSA9IGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQoIGlkICk7XG5cdFx0XHRcdHJldHVybiBlbGVtID8gWyBlbGVtIF0gOiBbXTtcblx0XHRcdH1cblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdEV4cHIuZmlsdGVyLklEID0gIGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdHZhciBhdHRySWQgPSBpZC5yZXBsYWNlKCBydW5lc2NhcGUsIGZ1bmVzY2FwZSApO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHR2YXIgbm9kZSA9IHR5cGVvZiBlbGVtLmdldEF0dHJpYnV0ZU5vZGUgIT09IFwidW5kZWZpbmVkXCIgJiZcblx0XHRcdFx0XHRlbGVtLmdldEF0dHJpYnV0ZU5vZGUoIFwiaWRcIiApO1xuXHRcdFx0XHRyZXR1cm4gbm9kZSAmJiBub2RlLnZhbHVlID09PSBhdHRySWQ7XG5cdFx0XHR9O1xuXHRcdH07XG5cblx0XHQvLyBTdXBwb3J0OiBJRSA2IC0gNyBvbmx5XG5cdFx0Ly8gZ2V0RWxlbWVudEJ5SWQgaXMgbm90IHJlbGlhYmxlIGFzIGEgZmluZCBzaG9ydGN1dFxuXHRcdEV4cHIuZmluZC5JRCA9IGZ1bmN0aW9uKCBpZCwgY29udGV4dCApIHtcblx0XHRcdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudEJ5SWQgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnRJc0hUTUwgKSB7XG5cdFx0XHRcdHZhciBub2RlLCBpLCBlbGVtcyxcblx0XHRcdFx0XHRlbGVtID0gY29udGV4dC5nZXRFbGVtZW50QnlJZCggaWQgKTtcblxuXHRcdFx0XHRpZiAoIGVsZW0gKSB7XG5cblx0XHRcdFx0XHQvLyBWZXJpZnkgdGhlIGlkIGF0dHJpYnV0ZVxuXHRcdFx0XHRcdG5vZGUgPSBlbGVtLmdldEF0dHJpYnV0ZU5vZGUoIFwiaWRcIiApO1xuXHRcdFx0XHRcdGlmICggbm9kZSAmJiBub2RlLnZhbHVlID09PSBpZCApIHtcblx0XHRcdFx0XHRcdHJldHVybiBbIGVsZW0gXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBGYWxsIGJhY2sgb24gZ2V0RWxlbWVudHNCeU5hbWVcblx0XHRcdFx0XHRlbGVtcyA9IGNvbnRleHQuZ2V0RWxlbWVudHNCeU5hbWUoIGlkICk7XG5cdFx0XHRcdFx0aSA9IDA7XG5cdFx0XHRcdFx0d2hpbGUgKCAoIGVsZW0gPSBlbGVtc1sgaSsrIF0gKSApIHtcblx0XHRcdFx0XHRcdG5vZGUgPSBlbGVtLmdldEF0dHJpYnV0ZU5vZGUoIFwiaWRcIiApO1xuXHRcdFx0XHRcdFx0aWYgKCBub2RlICYmIG5vZGUudmFsdWUgPT09IGlkICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gWyBlbGVtIF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHQvLyBUYWdcblx0RXhwci5maW5kLlRBRyA9IGZ1bmN0aW9uKCB0YWcsIGNvbnRleHQgKSB7XG5cdFx0aWYgKCB0eXBlb2YgY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSAhPT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdHJldHVybiBjb250ZXh0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCB0YWcgKTtcblxuXHRcdC8vIERvY3VtZW50RnJhZ21lbnQgbm9kZXMgZG9uJ3QgaGF2ZSBnRUJUTlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKCB0YWcgKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gQ2xhc3Ncblx0RXhwci5maW5kLkNMQVNTID0gZnVuY3Rpb24oIGNsYXNzTmFtZSwgY29udGV4dCApIHtcblx0XHRpZiAoIHR5cGVvZiBjb250ZXh0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnRJc0hUTUwgKSB7XG5cdFx0XHRyZXR1cm4gY29udGV4dC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCBjbGFzc05hbWUgKTtcblx0XHR9XG5cdH07XG5cblx0LyogUVNBL21hdGNoZXNTZWxlY3RvclxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cblx0Ly8gUVNBIGFuZCBtYXRjaGVzU2VsZWN0b3Igc3VwcG9ydFxuXG5cdHJidWdneVFTQSA9IFtdO1xuXG5cdC8vIEJ1aWxkIFFTQSByZWdleFxuXHQvLyBSZWdleCBzdHJhdGVneSBhZG9wdGVkIGZyb20gRGllZ28gUGVyaW5pXG5cdGFzc2VydCggZnVuY3Rpb24oIGVsICkge1xuXG5cdFx0dmFyIGlucHV0O1xuXG5cdFx0ZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKCBlbCApLmlubmVySFRNTCA9XG5cdFx0XHRcIjxhIGlkPSdcIiArIGV4cGFuZG8gKyBcIicgaHJlZj0nJyBkaXNhYmxlZD0nZGlzYWJsZWQnPjwvYT5cIiArXG5cdFx0XHRcIjxzZWxlY3QgaWQ9J1wiICsgZXhwYW5kbyArIFwiLVxcclxcXFwnIGRpc2FibGVkPSdkaXNhYmxlZCc+XCIgK1xuXHRcdFx0XCI8b3B0aW9uIHNlbGVjdGVkPScnPjwvb3B0aW9uPjwvc2VsZWN0PlwiO1xuXG5cdFx0Ly8gU3VwcG9ydDogaU9TIDw9NyAtIDggb25seVxuXHRcdC8vIEJvb2xlYW4gYXR0cmlidXRlcyBhbmQgXCJ2YWx1ZVwiIGFyZSBub3QgdHJlYXRlZCBjb3JyZWN0bHkgaW4gc29tZSBYTUwgZG9jdW1lbnRzXG5cdFx0aWYgKCAhZWwucXVlcnlTZWxlY3RvckFsbCggXCJbc2VsZWN0ZWRdXCIgKS5sZW5ndGggKSB7XG5cdFx0XHRyYnVnZ3lRU0EucHVzaCggXCJcXFxcW1wiICsgd2hpdGVzcGFjZSArIFwiKig/OnZhbHVlfFwiICsgYm9vbGVhbnMgKyBcIilcIiApO1xuXHRcdH1cblxuXHRcdC8vIFN1cHBvcnQ6IGlPUyA8PTcgLSA4IG9ubHlcblx0XHRpZiAoICFlbC5xdWVyeVNlbGVjdG9yQWxsKCBcIltpZH49XCIgKyBleHBhbmRvICsgXCItXVwiICkubGVuZ3RoICkge1xuXHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwifj1cIiApO1xuXHRcdH1cblxuXHRcdC8vIFN1cHBvcnQ6IGlPUyA4IG9ubHlcblx0XHQvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTM2ODUxXG5cdFx0Ly8gSW4tcGFnZSBgc2VsZWN0b3IjaWQgc2libGluZy1jb21iaW5hdG9yIHNlbGVjdG9yYCBmYWlsc1xuXHRcdGlmICggIWVsLnF1ZXJ5U2VsZWN0b3JBbGwoIFwiYSNcIiArIGV4cGFuZG8gKyBcIisqXCIgKS5sZW5ndGggKSB7XG5cdFx0XHRyYnVnZ3lRU0EucHVzaCggXCIuIy4rWyt+XVwiICk7XG5cdFx0fVxuXG5cdFx0Ly8gU3VwcG9ydDogQ2hyb21lIDw9MTA1KywgRmlyZWZveCA8PTEwNCssIFNhZmFyaSA8PTE1LjQrXG5cdFx0Ly8gSW4gc29tZSBvZiB0aGUgZG9jdW1lbnQga2luZHMsIHRoZXNlIHNlbGVjdG9ycyB3b3VsZG4ndCB3b3JrIG5hdGl2ZWx5LlxuXHRcdC8vIFRoaXMgaXMgcHJvYmFibHkgT0sgYnV0IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3ZSB3YW50IHRvIG1haW50YWluXG5cdFx0Ly8gaGFuZGxpbmcgdGhlbSB0aHJvdWdoIGpRdWVyeSB0cmF2ZXJzYWwgaW4galF1ZXJ5IDMueC5cblx0XHRpZiAoICFlbC5xdWVyeVNlbGVjdG9yQWxsKCBcIjpjaGVja2VkXCIgKS5sZW5ndGggKSB7XG5cdFx0XHRyYnVnZ3lRU0EucHVzaCggXCI6Y2hlY2tlZFwiICk7XG5cdFx0fVxuXG5cdFx0Ly8gU3VwcG9ydDogV2luZG93cyA4IE5hdGl2ZSBBcHBzXG5cdFx0Ly8gVGhlIHR5cGUgYW5kIG5hbWUgYXR0cmlidXRlcyBhcmUgcmVzdHJpY3RlZCBkdXJpbmcgLmlubmVySFRNTCBhc3NpZ25tZW50XG5cdFx0aW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImlucHV0XCIgKTtcblx0XHRpbnB1dC5zZXRBdHRyaWJ1dGUoIFwidHlwZVwiLCBcImhpZGRlblwiICk7XG5cdFx0ZWwuYXBwZW5kQ2hpbGQoIGlucHV0ICkuc2V0QXR0cmlidXRlKCBcIm5hbWVcIiwgXCJEXCIgKTtcblxuXHRcdC8vIFN1cHBvcnQ6IElFIDkgLSAxMStcblx0XHQvLyBJRSdzIDpkaXNhYmxlZCBzZWxlY3RvciBkb2VzIG5vdCBwaWNrIHVwIHRoZSBjaGlsZHJlbiBvZiBkaXNhYmxlZCBmaWVsZHNldHNcblx0XHQvLyBTdXBwb3J0OiBDaHJvbWUgPD0xMDUrLCBGaXJlZm94IDw9MTA0KywgU2FmYXJpIDw9MTUuNCtcblx0XHQvLyBJbiBzb21lIG9mIHRoZSBkb2N1bWVudCBraW5kcywgdGhlc2Ugc2VsZWN0b3JzIHdvdWxkbid0IHdvcmsgbmF0aXZlbHkuXG5cdFx0Ly8gVGhpcyBpcyBwcm9iYWJseSBPSyBidXQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdlIHdhbnQgdG8gbWFpbnRhaW5cblx0XHQvLyBoYW5kbGluZyB0aGVtIHRocm91Z2ggalF1ZXJ5IHRyYXZlcnNhbCBpbiBqUXVlcnkgMy54LlxuXHRcdGRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZCggZWwgKS5kaXNhYmxlZCA9IHRydWU7XG5cdFx0aWYgKCBlbC5xdWVyeVNlbGVjdG9yQWxsKCBcIjpkaXNhYmxlZFwiICkubGVuZ3RoICE9PSAyICkge1xuXHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwiOmVuYWJsZWRcIiwgXCI6ZGlzYWJsZWRcIiApO1xuXHRcdH1cblxuXHRcdC8vIFN1cHBvcnQ6IElFIDExKywgRWRnZSAxNSAtIDE4K1xuXHRcdC8vIElFIDExL0VkZ2UgZG9uJ3QgZmluZCBlbGVtZW50cyBvbiBhIGBbbmFtZT0nJ11gIHF1ZXJ5IGluIHNvbWUgY2FzZXMuXG5cdFx0Ly8gQWRkaW5nIGEgdGVtcG9yYXJ5IGF0dHJpYnV0ZSB0byB0aGUgZG9jdW1lbnQgYmVmb3JlIHRoZSBzZWxlY3Rpb24gd29ya3Ncblx0XHQvLyBhcm91bmQgdGhlIGlzc3VlLlxuXHRcdC8vIEludGVyZXN0aW5nbHksIElFIDEwICYgb2xkZXIgZG9uJ3Qgc2VlbSB0byBoYXZlIHRoZSBpc3N1ZS5cblx0XHRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiaW5wdXRcIiApO1xuXHRcdGlucHV0LnNldEF0dHJpYnV0ZSggXCJuYW1lXCIsIFwiXCIgKTtcblx0XHRlbC5hcHBlbmRDaGlsZCggaW5wdXQgKTtcblx0XHRpZiAoICFlbC5xdWVyeVNlbGVjdG9yQWxsKCBcIltuYW1lPScnXVwiICkubGVuZ3RoICkge1xuXHRcdFx0cmJ1Z2d5UVNBLnB1c2goIFwiXFxcXFtcIiArIHdoaXRlc3BhY2UgKyBcIipuYW1lXCIgKyB3aGl0ZXNwYWNlICsgXCIqPVwiICtcblx0XHRcdFx0d2hpdGVzcGFjZSArIFwiKig/OicnfFxcXCJcXFwiKVwiICk7XG5cdFx0fVxuXHR9ICk7XG5cblx0aWYgKCAhc3VwcG9ydC5jc3NIYXMgKSB7XG5cblx0XHQvLyBTdXBwb3J0OiBDaHJvbWUgMTA1IC0gMTEwKywgU2FmYXJpIDE1LjQgLSAxNi4zK1xuXHRcdC8vIE91ciByZWd1bGFyIGB0cnktY2F0Y2hgIG1lY2hhbmlzbSBmYWlscyB0byBkZXRlY3QgbmF0aXZlbHktdW5zdXBwb3J0ZWRcblx0XHQvLyBwc2V1ZG8tY2xhc3NlcyBpbnNpZGUgYDpoYXMoKWAgKHN1Y2ggYXMgYDpoYXMoOmNvbnRhaW5zKFwiRm9vXCIpKWApXG5cdFx0Ly8gaW4gYnJvd3NlcnMgdGhhdCBwYXJzZSB0aGUgYDpoYXMoKWAgYXJndW1lbnQgYXMgYSBmb3JnaXZpbmcgc2VsZWN0b3IgbGlzdC5cblx0XHQvLyBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvc2VsZWN0b3JzLyNyZWxhdGlvbmFsIG5vdyByZXF1aXJlcyB0aGUgYXJndW1lbnRcblx0XHQvLyB0byBiZSBwYXJzZWQgdW5mb3JnaXZpbmdseSwgYnV0IGJyb3dzZXJzIGhhdmUgbm90IHlldCBmdWxseSBhZGp1c3RlZC5cblx0XHRyYnVnZ3lRU0EucHVzaCggXCI6aGFzXCIgKTtcblx0fVxuXG5cdHJidWdneVFTQSA9IHJidWdneVFTQS5sZW5ndGggJiYgbmV3IFJlZ0V4cCggcmJ1Z2d5UVNBLmpvaW4oIFwifFwiICkgKTtcblxuXHQvKiBTb3J0aW5nXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuXHQvLyBEb2N1bWVudCBvcmRlciBzb3J0aW5nXG5cdHNvcnRPcmRlciA9IGZ1bmN0aW9uKCBhLCBiICkge1xuXG5cdFx0Ly8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcblx0XHRpZiAoIGEgPT09IGIgKSB7XG5cdFx0XHRoYXNEdXBsaWNhdGUgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0Ly8gU29ydCBvbiBtZXRob2QgZXhpc3RlbmNlIGlmIG9ubHkgb25lIGlucHV0IGhhcyBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxuXHRcdHZhciBjb21wYXJlID0gIWEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gLSAhYi5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbjtcblx0XHRpZiAoIGNvbXBhcmUgKSB7XG5cdFx0XHRyZXR1cm4gY29tcGFyZTtcblx0XHR9XG5cblx0XHQvLyBDYWxjdWxhdGUgcG9zaXRpb24gaWYgYm90aCBpbnB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIGRvY3VtZW50XG5cdFx0Ly8gU3VwcG9ydDogSUUgMTErLCBFZGdlIDE3IC0gMTgrXG5cdFx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlbiBzdHJpY3QtY29tcGFyaW5nXG5cdFx0Ly8gdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcblx0XHRjb21wYXJlID0gKCBhLm93bmVyRG9jdW1lbnQgfHwgYSApID09ICggYi5vd25lckRvY3VtZW50IHx8IGIgKSA/XG5cdFx0XHRhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKCBiICkgOlxuXG5cdFx0XHQvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcblx0XHRcdDE7XG5cblx0XHQvLyBEaXNjb25uZWN0ZWQgbm9kZXNcblx0XHRpZiAoIGNvbXBhcmUgJiAxIHx8XG5cdFx0XHQoICFzdXBwb3J0LnNvcnREZXRhY2hlZCAmJiBiLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKCBhICkgPT09IGNvbXBhcmUgKSApIHtcblxuXHRcdFx0Ly8gQ2hvb3NlIHRoZSBmaXJzdCBlbGVtZW50IHRoYXQgaXMgcmVsYXRlZCB0byBvdXIgcHJlZmVycmVkIGRvY3VtZW50XG5cdFx0XHQvLyBTdXBwb3J0OiBJRSAxMSssIEVkZ2UgMTcgLSAxOCtcblx0XHRcdC8vIElFL0VkZ2Ugc29tZXRpbWVzIHRocm93IGEgXCJQZXJtaXNzaW9uIGRlbmllZFwiIGVycm9yIHdoZW4gc3RyaWN0LWNvbXBhcmluZ1xuXHRcdFx0Ly8gdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuXHRcdFx0aWYgKCBhID09PSBkb2N1bWVudCB8fCBhLm93bmVyRG9jdW1lbnQgPT0gcHJlZmVycmVkRG9jICYmXG5cdFx0XHRcdGZpbmQuY29udGFpbnMoIHByZWZlcnJlZERvYywgYSApICkge1xuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN1cHBvcnQ6IElFIDExKywgRWRnZSAxNyAtIDE4K1xuXHRcdFx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlbiBzdHJpY3QtY29tcGFyaW5nXG5cdFx0XHQvLyB0d28gZG9jdW1lbnRzOyBzaGFsbG93IGNvbXBhcmlzb25zIHdvcmsuXG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG5cdFx0XHRpZiAoIGIgPT09IGRvY3VtZW50IHx8IGIub3duZXJEb2N1bWVudCA9PSBwcmVmZXJyZWREb2MgJiZcblx0XHRcdFx0ZmluZC5jb250YWlucyggcHJlZmVycmVkRG9jLCBiICkgKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBNYWludGFpbiBvcmlnaW5hbCBvcmRlclxuXHRcdFx0cmV0dXJuIHNvcnRJbnB1dCA/XG5cdFx0XHRcdCggaW5kZXhPZi5jYWxsKCBzb3J0SW5wdXQsIGEgKSAtIGluZGV4T2YuY2FsbCggc29ydElucHV0LCBiICkgKSA6XG5cdFx0XHRcdDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbXBhcmUgJiA0ID8gLTEgOiAxO1xuXHR9O1xuXG5cdHJldHVybiBkb2N1bWVudDtcbn1cblxuZmluZC5tYXRjaGVzID0gZnVuY3Rpb24oIGV4cHIsIGVsZW1lbnRzICkge1xuXHRyZXR1cm4gZmluZCggZXhwciwgbnVsbCwgbnVsbCwgZWxlbWVudHMgKTtcbn07XG5cbmZpbmQubWF0Y2hlc1NlbGVjdG9yID0gZnVuY3Rpb24oIGVsZW0sIGV4cHIgKSB7XG5cdHNldERvY3VtZW50KCBlbGVtICk7XG5cblx0aWYgKCBkb2N1bWVudElzSFRNTCAmJlxuXHRcdCFub25uYXRpdmVTZWxlY3RvckNhY2hlWyBleHByICsgXCIgXCIgXSAmJlxuXHRcdCggIXJidWdneVFTQSB8fCAhcmJ1Z2d5UVNBLnRlc3QoIGV4cHIgKSApICkge1xuXG5cdFx0dHJ5IHtcblx0XHRcdHZhciByZXQgPSBtYXRjaGVzLmNhbGwoIGVsZW0sIGV4cHIgKTtcblxuXHRcdFx0Ly8gSUUgOSdzIG1hdGNoZXNTZWxlY3RvciByZXR1cm5zIGZhbHNlIG9uIGRpc2Nvbm5lY3RlZCBub2Rlc1xuXHRcdFx0aWYgKCByZXQgfHwgc3VwcG9ydC5kaXNjb25uZWN0ZWRNYXRjaCB8fFxuXG5cdFx0XHRcdFx0Ly8gQXMgd2VsbCwgZGlzY29ubmVjdGVkIG5vZGVzIGFyZSBzYWlkIHRvIGJlIGluIGEgZG9jdW1lbnRcblx0XHRcdFx0XHQvLyBmcmFnbWVudCBpbiBJRSA5XG5cdFx0XHRcdFx0ZWxlbS5kb2N1bWVudCAmJiBlbGVtLmRvY3VtZW50Lm5vZGVUeXBlICE9PSAxMSApIHtcblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdG5vbm5hdGl2ZVNlbGVjdG9yQ2FjaGUoIGV4cHIsIHRydWUgKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmluZCggZXhwciwgZG9jdW1lbnQsIG51bGwsIFsgZWxlbSBdICkubGVuZ3RoID4gMDtcbn07XG5cbmZpbmQuY29udGFpbnMgPSBmdW5jdGlvbiggY29udGV4dCwgZWxlbSApIHtcblxuXHQvLyBTZXQgZG9jdW1lbnQgdmFycyBpZiBuZWVkZWRcblx0Ly8gU3VwcG9ydDogSUUgMTErLCBFZGdlIDE3IC0gMTgrXG5cdC8vIElFL0VkZ2Ugc29tZXRpbWVzIHRocm93IGEgXCJQZXJtaXNzaW9uIGRlbmllZFwiIGVycm9yIHdoZW4gc3RyaWN0LWNvbXBhcmluZ1xuXHQvLyB0d28gZG9jdW1lbnRzOyBzaGFsbG93IGNvbXBhcmlzb25zIHdvcmsuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcblx0aWYgKCAoIGNvbnRleHQub3duZXJEb2N1bWVudCB8fCBjb250ZXh0ICkgIT0gZG9jdW1lbnQgKSB7XG5cdFx0c2V0RG9jdW1lbnQoIGNvbnRleHQgKTtcblx0fVxuXHRyZXR1cm4galF1ZXJ5LmNvbnRhaW5zKCBjb250ZXh0LCBlbGVtICk7XG59O1xuXG5cbmZpbmQuYXR0ciA9IGZ1bmN0aW9uKCBlbGVtLCBuYW1lICkge1xuXG5cdC8vIFNldCBkb2N1bWVudCB2YXJzIGlmIG5lZWRlZFxuXHQvLyBTdXBwb3J0OiBJRSAxMSssIEVkZ2UgMTcgLSAxOCtcblx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlbiBzdHJpY3QtY29tcGFyaW5nXG5cdC8vIHR3byBkb2N1bWVudHM7IHNoYWxsb3cgY29tcGFyaXNvbnMgd29yay5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuXHRpZiAoICggZWxlbS5vd25lckRvY3VtZW50IHx8IGVsZW0gKSAhPSBkb2N1bWVudCApIHtcblx0XHRzZXREb2N1bWVudCggZWxlbSApO1xuXHR9XG5cblx0dmFyIGZuID0gRXhwci5hdHRySGFuZGxlWyBuYW1lLnRvTG93ZXJDYXNlKCkgXSxcblxuXHRcdC8vIERvbid0IGdldCBmb29sZWQgYnkgT2JqZWN0LnByb3RvdHlwZSBwcm9wZXJ0aWVzIChzZWUgdHJhYy0xMzgwNylcblx0XHR2YWwgPSBmbiAmJiBoYXNPd24uY2FsbCggRXhwci5hdHRySGFuZGxlLCBuYW1lLnRvTG93ZXJDYXNlKCkgKSA/XG5cdFx0XHRmbiggZWxlbSwgbmFtZSwgIWRvY3VtZW50SXNIVE1MICkgOlxuXHRcdFx0dW5kZWZpbmVkO1xuXG5cdGlmICggdmFsICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSggbmFtZSApO1xufTtcblxuZmluZC5lcnJvciA9IGZ1bmN0aW9uKCBtc2cgKSB7XG5cdHRocm93IG5ldyBFcnJvciggXCJTeW50YXggZXJyb3IsIHVucmVjb2duaXplZCBleHByZXNzaW9uOiBcIiArIG1zZyApO1xufTtcblxuLyoqXG4gKiBEb2N1bWVudCBzb3J0aW5nIGFuZCByZW1vdmluZyBkdXBsaWNhdGVzXG4gKiBAcGFyYW0ge0FycmF5TGlrZX0gcmVzdWx0c1xuICovXG5qUXVlcnkudW5pcXVlU29ydCA9IGZ1bmN0aW9uKCByZXN1bHRzICkge1xuXHR2YXIgZWxlbSxcblx0XHRkdXBsaWNhdGVzID0gW10sXG5cdFx0aiA9IDAsXG5cdFx0aSA9IDA7XG5cblx0Ly8gVW5sZXNzIHdlICprbm93KiB3ZSBjYW4gZGV0ZWN0IGR1cGxpY2F0ZXMsIGFzc3VtZSB0aGVpciBwcmVzZW5jZVxuXHQvL1xuXHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4wK1xuXHQvLyBUZXN0aW5nIGZvciBkZXRlY3RpbmcgZHVwbGljYXRlcyBpcyB1bnByZWRpY3RhYmxlIHNvIGluc3RlYWQgYXNzdW1lIHdlIGNhbid0XG5cdC8vIGRlcGVuZCBvbiBkdXBsaWNhdGUgZGV0ZWN0aW9uIGluIGFsbCBicm93c2VycyB3aXRob3V0IGEgc3RhYmxlIHNvcnQuXG5cdGhhc0R1cGxpY2F0ZSA9ICFzdXBwb3J0LnNvcnRTdGFibGU7XG5cdHNvcnRJbnB1dCA9ICFzdXBwb3J0LnNvcnRTdGFibGUgJiYgc2xpY2UuY2FsbCggcmVzdWx0cywgMCApO1xuXHRzb3J0LmNhbGwoIHJlc3VsdHMsIHNvcnRPcmRlciApO1xuXG5cdGlmICggaGFzRHVwbGljYXRlICkge1xuXHRcdHdoaWxlICggKCBlbGVtID0gcmVzdWx0c1sgaSsrIF0gKSApIHtcblx0XHRcdGlmICggZWxlbSA9PT0gcmVzdWx0c1sgaSBdICkge1xuXHRcdFx0XHRqID0gZHVwbGljYXRlcy5wdXNoKCBpICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHdoaWxlICggai0tICkge1xuXHRcdFx0c3BsaWNlLmNhbGwoIHJlc3VsdHMsIGR1cGxpY2F0ZXNbIGogXSwgMSApO1xuXHRcdH1cblx0fVxuXG5cdC8vIENsZWFyIGlucHV0IGFmdGVyIHNvcnRpbmcgdG8gcmVsZWFzZSBvYmplY3RzXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L3NpenpsZS9wdWxsLzIyNVxuXHRzb3J0SW5wdXQgPSBudWxsO1xuXG5cdHJldHVybiByZXN1bHRzO1xufTtcblxualF1ZXJ5LmZuLnVuaXF1ZVNvcnQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKCBqUXVlcnkudW5pcXVlU29ydCggc2xpY2UuYXBwbHkoIHRoaXMgKSApICk7XG59O1xuXG5FeHByID0galF1ZXJ5LmV4cHIgPSB7XG5cblx0Ly8gQ2FuIGJlIGFkanVzdGVkIGJ5IHRoZSB1c2VyXG5cdGNhY2hlTGVuZ3RoOiA1MCxcblxuXHRjcmVhdGVQc2V1ZG86IG1hcmtGdW5jdGlvbixcblxuXHRtYXRjaDogbWF0Y2hFeHByLFxuXG5cdGF0dHJIYW5kbGU6IHt9LFxuXG5cdGZpbmQ6IHt9LFxuXG5cdHJlbGF0aXZlOiB7XG5cdFx0XCI+XCI6IHsgZGlyOiBcInBhcmVudE5vZGVcIiwgZmlyc3Q6IHRydWUgfSxcblx0XHRcIiBcIjogeyBkaXI6IFwicGFyZW50Tm9kZVwiIH0sXG5cdFx0XCIrXCI6IHsgZGlyOiBcInByZXZpb3VzU2libGluZ1wiLCBmaXJzdDogdHJ1ZSB9LFxuXHRcdFwiflwiOiB7IGRpcjogXCJwcmV2aW91c1NpYmxpbmdcIiB9XG5cdH0sXG5cblx0cHJlRmlsdGVyOiB7XG5cdFx0QVRUUjogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdFx0bWF0Y2hbIDEgXSA9IG1hdGNoWyAxIF0ucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKTtcblxuXHRcdFx0Ly8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcblx0XHRcdG1hdGNoWyAzIF0gPSAoIG1hdGNoWyAzIF0gfHwgbWF0Y2hbIDQgXSB8fCBtYXRjaFsgNSBdIHx8IFwiXCIgKVxuXHRcdFx0XHQucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKTtcblxuXHRcdFx0aWYgKCBtYXRjaFsgMiBdID09PSBcIn49XCIgKSB7XG5cdFx0XHRcdG1hdGNoWyAzIF0gPSBcIiBcIiArIG1hdGNoWyAzIF0gKyBcIiBcIjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1hdGNoLnNsaWNlKCAwLCA0ICk7XG5cdFx0fSxcblxuXHRcdENISUxEOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cblx0XHRcdC8qIG1hdGNoZXMgZnJvbSBtYXRjaEV4cHJbXCJDSElMRFwiXVxuXHRcdFx0XHQxIHR5cGUgKG9ubHl8bnRofC4uLilcblx0XHRcdFx0MiB3aGF0IChjaGlsZHxvZi10eXBlKVxuXHRcdFx0XHQzIGFyZ3VtZW50IChldmVufG9kZHxcXGQqfFxcZCpuKFsrLV1cXGQrKT98Li4uKVxuXHRcdFx0XHQ0IHhuLWNvbXBvbmVudCBvZiB4bit5IGFyZ3VtZW50IChbKy1dP1xcZCpufClcblx0XHRcdFx0NSBzaWduIG9mIHhuLWNvbXBvbmVudFxuXHRcdFx0XHQ2IHggb2YgeG4tY29tcG9uZW50XG5cdFx0XHRcdDcgc2lnbiBvZiB5LWNvbXBvbmVudFxuXHRcdFx0XHQ4IHkgb2YgeS1jb21wb25lbnRcblx0XHRcdCovXG5cdFx0XHRtYXRjaFsgMSBdID0gbWF0Y2hbIDEgXS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHRpZiAoIG1hdGNoWyAxIF0uc2xpY2UoIDAsIDMgKSA9PT0gXCJudGhcIiApIHtcblxuXHRcdFx0XHQvLyBudGgtKiByZXF1aXJlcyBhcmd1bWVudFxuXHRcdFx0XHRpZiAoICFtYXRjaFsgMyBdICkge1xuXHRcdFx0XHRcdGZpbmQuZXJyb3IoIG1hdGNoWyAwIF0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIG51bWVyaWMgeCBhbmQgeSBwYXJhbWV0ZXJzIGZvciBFeHByLmZpbHRlci5DSElMRFxuXHRcdFx0XHQvLyByZW1lbWJlciB0aGF0IGZhbHNlL3RydWUgY2FzdCByZXNwZWN0aXZlbHkgdG8gMC8xXG5cdFx0XHRcdG1hdGNoWyA0IF0gPSArKCBtYXRjaFsgNCBdID9cblx0XHRcdFx0XHRtYXRjaFsgNSBdICsgKCBtYXRjaFsgNiBdIHx8IDEgKSA6XG5cdFx0XHRcdFx0MiAqICggbWF0Y2hbIDMgXSA9PT0gXCJldmVuXCIgfHwgbWF0Y2hbIDMgXSA9PT0gXCJvZGRcIiApXG5cdFx0XHRcdCk7XG5cdFx0XHRcdG1hdGNoWyA1IF0gPSArKCAoIG1hdGNoWyA3IF0gKyBtYXRjaFsgOCBdICkgfHwgbWF0Y2hbIDMgXSA9PT0gXCJvZGRcIiApO1xuXG5cdFx0XHQvLyBvdGhlciB0eXBlcyBwcm9oaWJpdCBhcmd1bWVudHNcblx0XHRcdH0gZWxzZSBpZiAoIG1hdGNoWyAzIF0gKSB7XG5cdFx0XHRcdGZpbmQuZXJyb3IoIG1hdGNoWyAwIF0gKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdH0sXG5cblx0XHRQU0VVRE86IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHRcdHZhciBleGNlc3MsXG5cdFx0XHRcdHVucXVvdGVkID0gIW1hdGNoWyA2IF0gJiYgbWF0Y2hbIDIgXTtcblxuXHRcdFx0aWYgKCBtYXRjaEV4cHIuQ0hJTEQudGVzdCggbWF0Y2hbIDAgXSApICkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcblx0XHRcdGlmICggbWF0Y2hbIDMgXSApIHtcblx0XHRcdFx0bWF0Y2hbIDIgXSA9IG1hdGNoWyA0IF0gfHwgbWF0Y2hbIDUgXSB8fCBcIlwiO1xuXG5cdFx0XHQvLyBTdHJpcCBleGNlc3MgY2hhcmFjdGVycyBmcm9tIHVucXVvdGVkIGFyZ3VtZW50c1xuXHRcdFx0fSBlbHNlIGlmICggdW5xdW90ZWQgJiYgcnBzZXVkby50ZXN0KCB1bnF1b3RlZCApICYmXG5cblx0XHRcdFx0Ly8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcblx0XHRcdFx0KCBleGNlc3MgPSB0b2tlbml6ZSggdW5xdW90ZWQsIHRydWUgKSApICYmXG5cblx0XHRcdFx0Ly8gYWR2YW5jZSB0byB0aGUgbmV4dCBjbG9zaW5nIHBhcmVudGhlc2lzXG5cdFx0XHRcdCggZXhjZXNzID0gdW5xdW90ZWQuaW5kZXhPZiggXCIpXCIsIHVucXVvdGVkLmxlbmd0aCAtIGV4Y2VzcyApIC0gdW5xdW90ZWQubGVuZ3RoICkgKSB7XG5cblx0XHRcdFx0Ly8gZXhjZXNzIGlzIGEgbmVnYXRpdmUgaW5kZXhcblx0XHRcdFx0bWF0Y2hbIDAgXSA9IG1hdGNoWyAwIF0uc2xpY2UoIDAsIGV4Y2VzcyApO1xuXHRcdFx0XHRtYXRjaFsgMiBdID0gdW5xdW90ZWQuc2xpY2UoIDAsIGV4Y2VzcyApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcblx0XHRcdHJldHVybiBtYXRjaC5zbGljZSggMCwgMyApO1xuXHRcdH1cblx0fSxcblxuXHRmaWx0ZXI6IHtcblxuXHRcdFRBRzogZnVuY3Rpb24oIG5vZGVOYW1lU2VsZWN0b3IgKSB7XG5cdFx0XHR2YXIgZXhwZWN0ZWROb2RlTmFtZSA9IG5vZGVOYW1lU2VsZWN0b3IucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIG5vZGVOYW1lU2VsZWN0b3IgPT09IFwiKlwiID9cblx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gOlxuXHRcdFx0XHRmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZU5hbWUoIGVsZW0sIGV4cGVjdGVkTm9kZU5hbWUgKTtcblx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0Q0xBU1M6IGZ1bmN0aW9uKCBjbGFzc05hbWUgKSB7XG5cdFx0XHR2YXIgcGF0dGVybiA9IGNsYXNzQ2FjaGVbIGNsYXNzTmFtZSArIFwiIFwiIF07XG5cblx0XHRcdHJldHVybiBwYXR0ZXJuIHx8XG5cdFx0XHRcdCggcGF0dGVybiA9IG5ldyBSZWdFeHAoIFwiKF58XCIgKyB3aGl0ZXNwYWNlICsgXCIpXCIgKyBjbGFzc05hbWUgK1xuXHRcdFx0XHRcdFwiKFwiICsgd2hpdGVzcGFjZSArIFwifCQpXCIgKSApICYmXG5cdFx0XHRcdGNsYXNzQ2FjaGUoIGNsYXNzTmFtZSwgZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHBhdHRlcm4udGVzdChcblx0XHRcdFx0XHRcdHR5cGVvZiBlbGVtLmNsYXNzTmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBlbGVtLmNsYXNzTmFtZSB8fFxuXHRcdFx0XHRcdFx0XHR0eXBlb2YgZWxlbS5nZXRBdHRyaWJ1dGUgIT09IFwidW5kZWZpbmVkXCIgJiZcblx0XHRcdFx0XHRcdFx0XHRlbGVtLmdldEF0dHJpYnV0ZSggXCJjbGFzc1wiICkgfHxcblx0XHRcdFx0XHRcdFx0XCJcIlxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gKTtcblx0XHR9LFxuXG5cdFx0QVRUUjogZnVuY3Rpb24oIG5hbWUsIG9wZXJhdG9yLCBjaGVjayApIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0dmFyIHJlc3VsdCA9IGZpbmQuYXR0ciggZWxlbSwgbmFtZSApO1xuXG5cdFx0XHRcdGlmICggcmVzdWx0ID09IG51bGwgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wZXJhdG9yID09PSBcIiE9XCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCAhb3BlcmF0b3IgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXN1bHQgKz0gXCJcIjtcblxuXHRcdFx0XHRpZiAoIG9wZXJhdG9yID09PSBcIj1cIiApIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0ID09PSBjaGVjaztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIG9wZXJhdG9yID09PSBcIiE9XCIgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCAhPT0gY2hlY2s7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBvcGVyYXRvciA9PT0gXCJePVwiICkge1xuXHRcdFx0XHRcdHJldHVybiBjaGVjayAmJiByZXN1bHQuaW5kZXhPZiggY2hlY2sgKSA9PT0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIG9wZXJhdG9yID09PSBcIio9XCIgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNoZWNrICYmIHJlc3VsdC5pbmRleE9mKCBjaGVjayApID4gLTE7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBvcGVyYXRvciA9PT0gXCIkPVwiICkge1xuXHRcdFx0XHRcdHJldHVybiBjaGVjayAmJiByZXN1bHQuc2xpY2UoIC1jaGVjay5sZW5ndGggKSA9PT0gY2hlY2s7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBvcGVyYXRvciA9PT0gXCJ+PVwiICkge1xuXHRcdFx0XHRcdHJldHVybiAoIFwiIFwiICsgcmVzdWx0LnJlcGxhY2UoIHJ3aGl0ZXNwYWNlLCBcIiBcIiApICsgXCIgXCIgKVxuXHRcdFx0XHRcdFx0LmluZGV4T2YoIGNoZWNrICkgPiAtMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIG9wZXJhdG9yID09PSBcInw9XCIgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCA9PT0gY2hlY2sgfHwgcmVzdWx0LnNsaWNlKCAwLCBjaGVjay5sZW5ndGggKyAxICkgPT09IGNoZWNrICsgXCItXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRDSElMRDogZnVuY3Rpb24oIHR5cGUsIHdoYXQsIF9hcmd1bWVudCwgZmlyc3QsIGxhc3QgKSB7XG5cdFx0XHR2YXIgc2ltcGxlID0gdHlwZS5zbGljZSggMCwgMyApICE9PSBcIm50aFwiLFxuXHRcdFx0XHRmb3J3YXJkID0gdHlwZS5zbGljZSggLTQgKSAhPT0gXCJsYXN0XCIsXG5cdFx0XHRcdG9mVHlwZSA9IHdoYXQgPT09IFwib2YtdHlwZVwiO1xuXG5cdFx0XHRyZXR1cm4gZmlyc3QgPT09IDEgJiYgbGFzdCA9PT0gMCA/XG5cblx0XHRcdFx0Ly8gU2hvcnRjdXQgZm9yIDpudGgtKihuKVxuXHRcdFx0XHRmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0XHRyZXR1cm4gISFlbGVtLnBhcmVudE5vZGU7XG5cdFx0XHRcdH0gOlxuXG5cdFx0XHRcdGZ1bmN0aW9uKCBlbGVtLCBfY29udGV4dCwgeG1sICkge1xuXHRcdFx0XHRcdHZhciBjYWNoZSwgb3V0ZXJDYWNoZSwgbm9kZSwgbm9kZUluZGV4LCBzdGFydCxcblx0XHRcdFx0XHRcdGRpciA9IHNpbXBsZSAhPT0gZm9yd2FyZCA/IFwibmV4dFNpYmxpbmdcIiA6IFwicHJldmlvdXNTaWJsaW5nXCIsXG5cdFx0XHRcdFx0XHRwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXG5cdFx0XHRcdFx0XHRuYW1lID0gb2ZUeXBlICYmIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdFx0XHRcdHVzZUNhY2hlID0gIXhtbCAmJiAhb2ZUeXBlLFxuXHRcdFx0XHRcdFx0ZGlmZiA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0aWYgKCBwYXJlbnQgKSB7XG5cblx0XHRcdFx0XHRcdC8vIDooZmlyc3R8bGFzdHxvbmx5KS0oY2hpbGR8b2YtdHlwZSlcblx0XHRcdFx0XHRcdGlmICggc2ltcGxlICkge1xuXHRcdFx0XHRcdFx0XHR3aGlsZSAoIGRpciApIHtcblx0XHRcdFx0XHRcdFx0XHRub2RlID0gZWxlbTtcblx0XHRcdFx0XHRcdFx0XHR3aGlsZSAoICggbm9kZSA9IG5vZGVbIGRpciBdICkgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIG9mVHlwZSA/XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5vZGVOYW1lKCBub2RlLCBuYW1lICkgOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRub2RlLm5vZGVUeXBlID09PSAxICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBSZXZlcnNlIGRpcmVjdGlvbiBmb3IgOm9ubHktKiAoaWYgd2UgaGF2ZW4ndCB5ZXQgZG9uZSBzbylcblx0XHRcdFx0XHRcdFx0XHRzdGFydCA9IGRpciA9IHR5cGUgPT09IFwib25seVwiICYmICFzdGFydCAmJiBcIm5leHRTaWJsaW5nXCI7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN0YXJ0ID0gWyBmb3J3YXJkID8gcGFyZW50LmZpcnN0Q2hpbGQgOiBwYXJlbnQubGFzdENoaWxkIF07XG5cblx0XHRcdFx0XHRcdC8vIG5vbi14bWwgOm50aC1jaGlsZCguLi4pIHN0b3JlcyBjYWNoZSBkYXRhIG9uIGBwYXJlbnRgXG5cdFx0XHRcdFx0XHRpZiAoIGZvcndhcmQgJiYgdXNlQ2FjaGUgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gU2VlayBgZWxlbWAgZnJvbSBhIHByZXZpb3VzbHktY2FjaGVkIGluZGV4XG5cdFx0XHRcdFx0XHRcdG91dGVyQ2FjaGUgPSBwYXJlbnRbIGV4cGFuZG8gXSB8fCAoIHBhcmVudFsgZXhwYW5kbyBdID0ge30gKTtcblx0XHRcdFx0XHRcdFx0Y2FjaGUgPSBvdXRlckNhY2hlWyB0eXBlIF0gfHwgW107XG5cdFx0XHRcdFx0XHRcdG5vZGVJbmRleCA9IGNhY2hlWyAwIF0gPT09IGRpcnJ1bnMgJiYgY2FjaGVbIDEgXTtcblx0XHRcdFx0XHRcdFx0ZGlmZiA9IG5vZGVJbmRleCAmJiBjYWNoZVsgMiBdO1xuXHRcdFx0XHRcdFx0XHRub2RlID0gbm9kZUluZGV4ICYmIHBhcmVudC5jaGlsZE5vZGVzWyBub2RlSW5kZXggXTtcblxuXHRcdFx0XHRcdFx0XHR3aGlsZSAoICggbm9kZSA9ICsrbm9kZUluZGV4ICYmIG5vZGUgJiYgbm9kZVsgZGlyIF0gfHxcblxuXHRcdFx0XHRcdFx0XHRcdC8vIEZhbGxiYWNrIHRvIHNlZWtpbmcgYGVsZW1gIGZyb20gdGhlIHN0YXJ0XG5cdFx0XHRcdFx0XHRcdFx0KCBkaWZmID0gbm9kZUluZGV4ID0gMCApIHx8IHN0YXJ0LnBvcCgpICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBXaGVuIGZvdW5kLCBjYWNoZSBpbmRleGVzIG9uIGBwYXJlbnRgIGFuZCBicmVha1xuXHRcdFx0XHRcdFx0XHRcdGlmICggbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiArK2RpZmYgJiYgbm9kZSA9PT0gZWxlbSApIHtcblx0XHRcdFx0XHRcdFx0XHRcdG91dGVyQ2FjaGVbIHR5cGUgXSA9IFsgZGlycnVucywgbm9kZUluZGV4LCBkaWZmIF07XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBVc2UgcHJldmlvdXNseS1jYWNoZWQgZWxlbWVudCBpbmRleCBpZiBhdmFpbGFibGVcblx0XHRcdFx0XHRcdFx0aWYgKCB1c2VDYWNoZSApIHtcblx0XHRcdFx0XHRcdFx0XHRvdXRlckNhY2hlID0gZWxlbVsgZXhwYW5kbyBdIHx8ICggZWxlbVsgZXhwYW5kbyBdID0ge30gKTtcblx0XHRcdFx0XHRcdFx0XHRjYWNoZSA9IG91dGVyQ2FjaGVbIHR5cGUgXSB8fCBbXTtcblx0XHRcdFx0XHRcdFx0XHRub2RlSW5kZXggPSBjYWNoZVsgMCBdID09PSBkaXJydW5zICYmIGNhY2hlWyAxIF07XG5cdFx0XHRcdFx0XHRcdFx0ZGlmZiA9IG5vZGVJbmRleDtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vIHhtbCA6bnRoLWNoaWxkKC4uLilcblx0XHRcdFx0XHRcdFx0Ly8gb3IgOm50aC1sYXN0LWNoaWxkKC4uLikgb3IgOm50aCgtbGFzdCk/LW9mLXR5cGUoLi4uKVxuXHRcdFx0XHRcdFx0XHRpZiAoIGRpZmYgPT09IGZhbHNlICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gVXNlIHRoZSBzYW1lIGxvb3AgYXMgYWJvdmUgdG8gc2VlayBgZWxlbWAgZnJvbSB0aGUgc3RhcnRcblx0XHRcdFx0XHRcdFx0XHR3aGlsZSAoICggbm9kZSA9ICsrbm9kZUluZGV4ICYmIG5vZGUgJiYgbm9kZVsgZGlyIF0gfHxcblx0XHRcdFx0XHRcdFx0XHRcdCggZGlmZiA9IG5vZGVJbmRleCA9IDAgKSB8fCBzdGFydC5wb3AoKSApICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoICggb2ZUeXBlID9cblx0XHRcdFx0XHRcdFx0XHRcdFx0bm9kZU5hbWUoIG5vZGUsIG5hbWUgKSA6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5vZGUubm9kZVR5cGUgPT09IDEgKSAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0XHQrK2RpZmYgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gQ2FjaGUgdGhlIGluZGV4IG9mIGVhY2ggZW5jb3VudGVyZWQgZWxlbWVudFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoIHVzZUNhY2hlICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG91dGVyQ2FjaGUgPSBub2RlWyBleHBhbmRvIF0gfHxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCggbm9kZVsgZXhwYW5kbyBdID0ge30gKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRvdXRlckNhY2hlWyB0eXBlIF0gPSBbIGRpcnJ1bnMsIGRpZmYgXTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICggbm9kZSA9PT0gZWxlbSApIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBJbmNvcnBvcmF0ZSB0aGUgb2Zmc2V0LCB0aGVuIGNoZWNrIGFnYWluc3QgY3ljbGUgc2l6ZVxuXHRcdFx0XHRcdFx0ZGlmZiAtPSBsYXN0O1xuXHRcdFx0XHRcdFx0cmV0dXJuIGRpZmYgPT09IGZpcnN0IHx8ICggZGlmZiAlIGZpcnN0ID09PSAwICYmIGRpZmYgLyBmaXJzdCA+PSAwICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRQU0VVRE86IGZ1bmN0aW9uKCBwc2V1ZG8sIGFyZ3VtZW50ICkge1xuXG5cdFx0XHQvLyBwc2V1ZG8tY2xhc3MgbmFtZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmVcblx0XHRcdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI3BzZXVkby1jbGFzc2VzXG5cdFx0XHQvLyBQcmlvcml0aXplIGJ5IGNhc2Ugc2Vuc2l0aXZpdHkgaW4gY2FzZSBjdXN0b20gcHNldWRvcyBhcmUgYWRkZWQgd2l0aCB1cHBlcmNhc2UgbGV0dGVyc1xuXHRcdFx0Ly8gUmVtZW1iZXIgdGhhdCBzZXRGaWx0ZXJzIGluaGVyaXRzIGZyb20gcHNldWRvc1xuXHRcdFx0dmFyIGFyZ3MsXG5cdFx0XHRcdGZuID0gRXhwci5wc2V1ZG9zWyBwc2V1ZG8gXSB8fCBFeHByLnNldEZpbHRlcnNbIHBzZXVkby50b0xvd2VyQ2FzZSgpIF0gfHxcblx0XHRcdFx0XHRmaW5kLmVycm9yKCBcInVuc3VwcG9ydGVkIHBzZXVkbzogXCIgKyBwc2V1ZG8gKTtcblxuXHRcdFx0Ly8gVGhlIHVzZXIgbWF5IHVzZSBjcmVhdGVQc2V1ZG8gdG8gaW5kaWNhdGUgdGhhdFxuXHRcdFx0Ly8gYXJndW1lbnRzIGFyZSBuZWVkZWQgdG8gY3JlYXRlIHRoZSBmaWx0ZXIgZnVuY3Rpb25cblx0XHRcdC8vIGp1c3QgYXMgalF1ZXJ5IGRvZXNcblx0XHRcdGlmICggZm5bIGV4cGFuZG8gXSApIHtcblx0XHRcdFx0cmV0dXJuIGZuKCBhcmd1bWVudCApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBCdXQgbWFpbnRhaW4gc3VwcG9ydCBmb3Igb2xkIHNpZ25hdHVyZXNcblx0XHRcdGlmICggZm4ubGVuZ3RoID4gMSApIHtcblx0XHRcdFx0YXJncyA9IFsgcHNldWRvLCBwc2V1ZG8sIFwiXCIsIGFyZ3VtZW50IF07XG5cdFx0XHRcdHJldHVybiBFeHByLnNldEZpbHRlcnMuaGFzT3duUHJvcGVydHkoIHBzZXVkby50b0xvd2VyQ2FzZSgpICkgP1xuXHRcdFx0XHRcdG1hcmtGdW5jdGlvbiggZnVuY3Rpb24oIHNlZWQsIG1hdGNoZXMgKSB7XG5cdFx0XHRcdFx0XHR2YXIgaWR4LFxuXHRcdFx0XHRcdFx0XHRtYXRjaGVkID0gZm4oIHNlZWQsIGFyZ3VtZW50ICksXG5cdFx0XHRcdFx0XHRcdGkgPSBtYXRjaGVkLmxlbmd0aDtcblx0XHRcdFx0XHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0XHRcdFx0XHRpZHggPSBpbmRleE9mLmNhbGwoIHNlZWQsIG1hdGNoZWRbIGkgXSApO1xuXHRcdFx0XHRcdFx0XHRzZWVkWyBpZHggXSA9ICEoIG1hdGNoZXNbIGlkeCBdID0gbWF0Y2hlZFsgaSBdICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSApIDpcblx0XHRcdFx0XHRmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBmbiggZWxlbSwgMCwgYXJncyApO1xuXHRcdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmbjtcblx0XHR9XG5cdH0sXG5cblx0cHNldWRvczoge1xuXG5cdFx0Ly8gUG90ZW50aWFsbHkgY29tcGxleCBwc2V1ZG9zXG5cdFx0bm90OiBtYXJrRnVuY3Rpb24oIGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblxuXHRcdFx0Ly8gVHJpbSB0aGUgc2VsZWN0b3IgcGFzc2VkIHRvIGNvbXBpbGVcblx0XHRcdC8vIHRvIGF2b2lkIHRyZWF0aW5nIGxlYWRpbmcgYW5kIHRyYWlsaW5nXG5cdFx0XHQvLyBzcGFjZXMgYXMgY29tYmluYXRvcnNcblx0XHRcdHZhciBpbnB1dCA9IFtdLFxuXHRcdFx0XHRyZXN1bHRzID0gW10sXG5cdFx0XHRcdG1hdGNoZXIgPSBjb21waWxlKCBzZWxlY3Rvci5yZXBsYWNlKCBydHJpbUNTUywgXCIkMVwiICkgKTtcblxuXHRcdFx0cmV0dXJuIG1hdGNoZXJbIGV4cGFuZG8gXSA/XG5cdFx0XHRcdG1hcmtGdW5jdGlvbiggZnVuY3Rpb24oIHNlZWQsIG1hdGNoZXMsIF9jb250ZXh0LCB4bWwgKSB7XG5cdFx0XHRcdFx0dmFyIGVsZW0sXG5cdFx0XHRcdFx0XHR1bm1hdGNoZWQgPSBtYXRjaGVyKCBzZWVkLCBudWxsLCB4bWwsIFtdICksXG5cdFx0XHRcdFx0XHRpID0gc2VlZC5sZW5ndGg7XG5cblx0XHRcdFx0XHQvLyBNYXRjaCBlbGVtZW50cyB1bm1hdGNoZWQgYnkgYG1hdGNoZXJgXG5cdFx0XHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRcdFx0XHRpZiAoICggZWxlbSA9IHVubWF0Y2hlZFsgaSBdICkgKSB7XG5cdFx0XHRcdFx0XHRcdHNlZWRbIGkgXSA9ICEoIG1hdGNoZXNbIGkgXSA9IGVsZW0gKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKSA6XG5cdFx0XHRcdGZ1bmN0aW9uKCBlbGVtLCBfY29udGV4dCwgeG1sICkge1xuXHRcdFx0XHRcdGlucHV0WyAwIF0gPSBlbGVtO1xuXHRcdFx0XHRcdG1hdGNoZXIoIGlucHV0LCBudWxsLCB4bWwsIHJlc3VsdHMgKTtcblxuXHRcdFx0XHRcdC8vIERvbid0IGtlZXAgdGhlIGVsZW1lbnRcblx0XHRcdFx0XHQvLyAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvc2l6emxlL2lzc3Vlcy8yOTkpXG5cdFx0XHRcdFx0aW5wdXRbIDAgXSA9IG51bGw7XG5cdFx0XHRcdFx0cmV0dXJuICFyZXN1bHRzLnBvcCgpO1xuXHRcdFx0XHR9O1xuXHRcdH0gKSxcblxuXHRcdGhhczogbWFya0Z1bmN0aW9uKCBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRcdHJldHVybiBmaW5kKCBzZWxlY3RvciwgZWxlbSApLmxlbmd0aCA+IDA7XG5cdFx0XHR9O1xuXHRcdH0gKSxcblxuXHRcdGNvbnRhaW5zOiBtYXJrRnVuY3Rpb24oIGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKTtcblx0XHRcdHJldHVybiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdFx0cmV0dXJuICggZWxlbS50ZXh0Q29udGVudCB8fCBqUXVlcnkudGV4dCggZWxlbSApICkuaW5kZXhPZiggdGV4dCApID4gLTE7XG5cdFx0XHR9O1xuXHRcdH0gKSxcblxuXHRcdC8vIFwiV2hldGhlciBhbiBlbGVtZW50IGlzIHJlcHJlc2VudGVkIGJ5IGEgOmxhbmcoKSBzZWxlY3RvclxuXHRcdC8vIGlzIGJhc2VkIHNvbGVseSBvbiB0aGUgZWxlbWVudCdzIGxhbmd1YWdlIHZhbHVlXG5cdFx0Ly8gYmVpbmcgZXF1YWwgdG8gdGhlIGlkZW50aWZpZXIgQyxcblx0XHQvLyBvciBiZWdpbm5pbmcgd2l0aCB0aGUgaWRlbnRpZmllciBDIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IFwiLVwiLlxuXHRcdC8vIFRoZSBtYXRjaGluZyBvZiBDIGFnYWluc3QgdGhlIGVsZW1lbnQncyBsYW5ndWFnZSB2YWx1ZSBpcyBwZXJmb3JtZWQgY2FzZS1pbnNlbnNpdGl2ZWx5LlxuXHRcdC8vIFRoZSBpZGVudGlmaWVyIEMgZG9lcyBub3QgaGF2ZSB0byBiZSBhIHZhbGlkIGxhbmd1YWdlIG5hbWUuXCJcblx0XHQvLyBodHRwczovL3d3dy53My5vcmcvVFIvc2VsZWN0b3JzLyNsYW5nLXBzZXVkb1xuXHRcdGxhbmc6IG1hcmtGdW5jdGlvbiggZnVuY3Rpb24oIGxhbmcgKSB7XG5cblx0XHRcdC8vIGxhbmcgdmFsdWUgbXVzdCBiZSBhIHZhbGlkIGlkZW50aWZpZXJcblx0XHRcdGlmICggIXJpZGVudGlmaWVyLnRlc3QoIGxhbmcgfHwgXCJcIiApICkge1xuXHRcdFx0XHRmaW5kLmVycm9yKCBcInVuc3VwcG9ydGVkIGxhbmc6IFwiICsgbGFuZyApO1xuXHRcdFx0fVxuXHRcdFx0bGFuZyA9IGxhbmcucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0XHR2YXIgZWxlbUxhbmc7XG5cdFx0XHRcdGRvIHtcblx0XHRcdFx0XHRpZiAoICggZWxlbUxhbmcgPSBkb2N1bWVudElzSFRNTCA/XG5cdFx0XHRcdFx0XHRlbGVtLmxhbmcgOlxuXHRcdFx0XHRcdFx0ZWxlbS5nZXRBdHRyaWJ1dGUoIFwieG1sOmxhbmdcIiApIHx8IGVsZW0uZ2V0QXR0cmlidXRlKCBcImxhbmdcIiApICkgKSB7XG5cblx0XHRcdFx0XHRcdGVsZW1MYW5nID0gZWxlbUxhbmcudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtTGFuZyA9PT0gbGFuZyB8fCBlbGVtTGFuZy5pbmRleE9mKCBsYW5nICsgXCItXCIgKSA9PT0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gd2hpbGUgKCAoIGVsZW0gPSBlbGVtLnBhcmVudE5vZGUgKSAmJiBlbGVtLm5vZGVUeXBlID09PSAxICk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH07XG5cdFx0fSApLFxuXG5cdFx0Ly8gTWlzY2VsbGFuZW91c1xuXHRcdHRhcmdldDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHR2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbiAmJiB3aW5kb3cubG9jYXRpb24uaGFzaDtcblx0XHRcdHJldHVybiBoYXNoICYmIGhhc2guc2xpY2UoIDEgKSA9PT0gZWxlbS5pZDtcblx0XHR9LFxuXG5cdFx0cm9vdDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gZG9jdW1lbnRFbGVtZW50O1xuXHRcdH0sXG5cblx0XHRmb2N1czogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gc2FmZUFjdGl2ZUVsZW1lbnQoKSAmJlxuXHRcdFx0XHRkb2N1bWVudC5oYXNGb2N1cygpICYmXG5cdFx0XHRcdCEhKCBlbGVtLnR5cGUgfHwgZWxlbS5ocmVmIHx8IH5lbGVtLnRhYkluZGV4ICk7XG5cdFx0fSxcblxuXHRcdC8vIEJvb2xlYW4gcHJvcGVydGllc1xuXHRcdGVuYWJsZWQ6IGNyZWF0ZURpc2FibGVkUHNldWRvKCBmYWxzZSApLFxuXHRcdGRpc2FibGVkOiBjcmVhdGVEaXNhYmxlZFBzZXVkbyggdHJ1ZSApLFxuXG5cdFx0Y2hlY2tlZDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cblx0XHRcdC8vIEluIENTUzMsIDpjaGVja2VkIHNob3VsZCByZXR1cm4gYm90aCBjaGVja2VkIGFuZCBzZWxlY3RlZCBlbGVtZW50c1xuXHRcdFx0Ly8gaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMTEvUkVDLWNzczMtc2VsZWN0b3JzLTIwMTEwOTI5LyNjaGVja2VkXG5cdFx0XHRyZXR1cm4gKCBub2RlTmFtZSggZWxlbSwgXCJpbnB1dFwiICkgJiYgISFlbGVtLmNoZWNrZWQgKSB8fFxuXHRcdFx0XHQoIG5vZGVOYW1lKCBlbGVtLCBcIm9wdGlvblwiICkgJiYgISFlbGVtLnNlbGVjdGVkICk7XG5cdFx0fSxcblxuXHRcdHNlbGVjdGVkOiBmdW5jdGlvbiggZWxlbSApIHtcblxuXHRcdFx0Ly8gU3VwcG9ydDogSUUgPD0xMStcblx0XHRcdC8vIEFjY2Vzc2luZyB0aGUgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eVxuXHRcdFx0Ly8gZm9yY2VzIHRoZSBicm93c2VyIHRvIHRyZWF0IHRoZSBkZWZhdWx0IG9wdGlvbiBhc1xuXHRcdFx0Ly8gc2VsZWN0ZWQgd2hlbiBpbiBhbiBvcHRncm91cC5cblx0XHRcdGlmICggZWxlbS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLWV4cHJlc3Npb25zXG5cdFx0XHRcdGVsZW0ucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZWxlbS5zZWxlY3RlZCA9PT0gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0Ly8gQ29udGVudHNcblx0XHRlbXB0eTogZnVuY3Rpb24oIGVsZW0gKSB7XG5cblx0XHRcdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2VtcHR5LXBzZXVkb1xuXHRcdFx0Ly8gOmVtcHR5IGlzIG5lZ2F0ZWQgYnkgZWxlbWVudCAoMSkgb3IgY29udGVudCBub2RlcyAodGV4dDogMzsgY2RhdGE6IDQ7IGVudGl0eSByZWY6IDUpLFxuXHRcdFx0Ly8gICBidXQgbm90IGJ5IG90aGVycyAoY29tbWVudDogODsgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbjogNzsgZXRjLilcblx0XHRcdC8vIG5vZGVUeXBlIDwgNiB3b3JrcyBiZWNhdXNlIGF0dHJpYnV0ZXMgKDIpIGRvIG5vdCBhcHBlYXIgYXMgY2hpbGRyZW5cblx0XHRcdGZvciAoIGVsZW0gPSBlbGVtLmZpcnN0Q2hpbGQ7IGVsZW07IGVsZW0gPSBlbGVtLm5leHRTaWJsaW5nICkge1xuXHRcdFx0XHRpZiAoIGVsZW0ubm9kZVR5cGUgPCA2ICkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSxcblxuXHRcdHBhcmVudDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gIUV4cHIucHNldWRvcy5lbXB0eSggZWxlbSApO1xuXHRcdH0sXG5cblx0XHQvLyBFbGVtZW50L2lucHV0IHR5cGVzXG5cdFx0aGVhZGVyOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiByaGVhZGVyLnRlc3QoIGVsZW0ubm9kZU5hbWUgKTtcblx0XHR9LFxuXG5cdFx0aW5wdXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIHJpbnB1dHMudGVzdCggZWxlbS5ub2RlTmFtZSApO1xuXHRcdH0sXG5cblx0XHRidXR0b246IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIG5vZGVOYW1lKCBlbGVtLCBcImlucHV0XCIgKSAmJiBlbGVtLnR5cGUgPT09IFwiYnV0dG9uXCIgfHxcblx0XHRcdFx0bm9kZU5hbWUoIGVsZW0sIFwiYnV0dG9uXCIgKTtcblx0XHR9LFxuXG5cdFx0dGV4dDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHR2YXIgYXR0cjtcblx0XHRcdHJldHVybiBub2RlTmFtZSggZWxlbSwgXCJpbnB1dFwiICkgJiYgZWxlbS50eXBlID09PSBcInRleHRcIiAmJlxuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDwxMCBvbmx5XG5cdFx0XHRcdC8vIE5ldyBIVE1MNSBhdHRyaWJ1dGUgdmFsdWVzIChlLmcuLCBcInNlYXJjaFwiKSBhcHBlYXJcblx0XHRcdFx0Ly8gd2l0aCBlbGVtLnR5cGUgPT09IFwidGV4dFwiXG5cdFx0XHRcdCggKCBhdHRyID0gZWxlbS5nZXRBdHRyaWJ1dGUoIFwidHlwZVwiICkgKSA9PSBudWxsIHx8XG5cdFx0XHRcdFx0YXR0ci50b0xvd2VyQ2FzZSgpID09PSBcInRleHRcIiApO1xuXHRcdH0sXG5cblx0XHQvLyBQb3NpdGlvbi1pbi1jb2xsZWN0aW9uXG5cdFx0Zmlyc3Q6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFsgMCBdO1xuXHRcdH0gKSxcblxuXHRcdGxhc3Q6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oIGZ1bmN0aW9uKCBfbWF0Y2hJbmRleGVzLCBsZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gWyBsZW5ndGggLSAxIF07XG5cdFx0fSApLFxuXG5cdFx0ZXE6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oIGZ1bmN0aW9uKCBfbWF0Y2hJbmRleGVzLCBsZW5ndGgsIGFyZ3VtZW50ICkge1xuXHRcdFx0cmV0dXJuIFsgYXJndW1lbnQgPCAwID8gYXJndW1lbnQgKyBsZW5ndGggOiBhcmd1bWVudCBdO1xuXHRcdH0gKSxcblxuXHRcdGV2ZW46IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oIGZ1bmN0aW9uKCBtYXRjaEluZGV4ZXMsIGxlbmd0aCApIHtcblx0XHRcdHZhciBpID0gMDtcblx0XHRcdGZvciAoIDsgaSA8IGxlbmd0aDsgaSArPSAyICkge1xuXHRcdFx0XHRtYXRjaEluZGV4ZXMucHVzaCggaSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1hdGNoSW5kZXhlcztcblx0XHR9ICksXG5cblx0XHRvZGQ6IGNyZWF0ZVBvc2l0aW9uYWxQc2V1ZG8oIGZ1bmN0aW9uKCBtYXRjaEluZGV4ZXMsIGxlbmd0aCApIHtcblx0XHRcdHZhciBpID0gMTtcblx0XHRcdGZvciAoIDsgaSA8IGxlbmd0aDsgaSArPSAyICkge1xuXHRcdFx0XHRtYXRjaEluZGV4ZXMucHVzaCggaSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1hdGNoSW5kZXhlcztcblx0XHR9ICksXG5cblx0XHRsdDogY3JlYXRlUG9zaXRpb25hbFBzZXVkbyggZnVuY3Rpb24oIG1hdGNoSW5kZXhlcywgbGVuZ3RoLCBhcmd1bWVudCApIHtcblx0XHRcdHZhciBpO1xuXG5cdFx0XHRpZiAoIGFyZ3VtZW50IDwgMCApIHtcblx0XHRcdFx0aSA9IGFyZ3VtZW50ICsgbGVuZ3RoO1xuXHRcdFx0fSBlbHNlIGlmICggYXJndW1lbnQgPiBsZW5ndGggKSB7XG5cdFx0XHRcdGkgPSBsZW5ndGg7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpID0gYXJndW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoIDsgLS1pID49IDA7ICkge1xuXHRcdFx0XHRtYXRjaEluZGV4ZXMucHVzaCggaSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1hdGNoSW5kZXhlcztcblx0XHR9ICksXG5cblx0XHRndDogY3JlYXRlUG9zaXRpb25hbFBzZXVkbyggZnVuY3Rpb24oIG1hdGNoSW5kZXhlcywgbGVuZ3RoLCBhcmd1bWVudCApIHtcblx0XHRcdHZhciBpID0gYXJndW1lbnQgPCAwID8gYXJndW1lbnQgKyBsZW5ndGggOiBhcmd1bWVudDtcblx0XHRcdGZvciAoIDsgKytpIDwgbGVuZ3RoOyApIHtcblx0XHRcdFx0bWF0Y2hJbmRleGVzLnB1c2goIGkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtYXRjaEluZGV4ZXM7XG5cdFx0fSApXG5cdH1cbn07XG5cbkV4cHIucHNldWRvcy5udGggPSBFeHByLnBzZXVkb3MuZXE7XG5cbi8vIEFkZCBidXR0b24vaW5wdXQgdHlwZSBwc2V1ZG9zXG5mb3IgKCBpIGluIHsgcmFkaW86IHRydWUsIGNoZWNrYm94OiB0cnVlLCBmaWxlOiB0cnVlLCBwYXNzd29yZDogdHJ1ZSwgaW1hZ2U6IHRydWUgfSApIHtcblx0RXhwci5wc2V1ZG9zWyBpIF0gPSBjcmVhdGVJbnB1dFBzZXVkbyggaSApO1xufVxuZm9yICggaSBpbiB7IHN1Ym1pdDogdHJ1ZSwgcmVzZXQ6IHRydWUgfSApIHtcblx0RXhwci5wc2V1ZG9zWyBpIF0gPSBjcmVhdGVCdXR0b25Qc2V1ZG8oIGkgKTtcbn1cblxuLy8gRWFzeSBBUEkgZm9yIGNyZWF0aW5nIG5ldyBzZXRGaWx0ZXJzXG5mdW5jdGlvbiBzZXRGaWx0ZXJzKCkge31cbnNldEZpbHRlcnMucHJvdG90eXBlID0gRXhwci5maWx0ZXJzID0gRXhwci5wc2V1ZG9zO1xuRXhwci5zZXRGaWx0ZXJzID0gbmV3IHNldEZpbHRlcnMoKTtcblxuZnVuY3Rpb24gdG9rZW5pemUoIHNlbGVjdG9yLCBwYXJzZU9ubHkgKSB7XG5cdHZhciBtYXRjaGVkLCBtYXRjaCwgdG9rZW5zLCB0eXBlLFxuXHRcdHNvRmFyLCBncm91cHMsIHByZUZpbHRlcnMsXG5cdFx0Y2FjaGVkID0gdG9rZW5DYWNoZVsgc2VsZWN0b3IgKyBcIiBcIiBdO1xuXG5cdGlmICggY2FjaGVkICkge1xuXHRcdHJldHVybiBwYXJzZU9ubHkgPyAwIDogY2FjaGVkLnNsaWNlKCAwICk7XG5cdH1cblxuXHRzb0ZhciA9IHNlbGVjdG9yO1xuXHRncm91cHMgPSBbXTtcblx0cHJlRmlsdGVycyA9IEV4cHIucHJlRmlsdGVyO1xuXG5cdHdoaWxlICggc29GYXIgKSB7XG5cblx0XHQvLyBDb21tYSBhbmQgZmlyc3QgcnVuXG5cdFx0aWYgKCAhbWF0Y2hlZCB8fCAoIG1hdGNoID0gcmNvbW1hLmV4ZWMoIHNvRmFyICkgKSApIHtcblx0XHRcdGlmICggbWF0Y2ggKSB7XG5cblx0XHRcdFx0Ly8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcblx0XHRcdFx0c29GYXIgPSBzb0Zhci5zbGljZSggbWF0Y2hbIDAgXS5sZW5ndGggKSB8fCBzb0Zhcjtcblx0XHRcdH1cblx0XHRcdGdyb3Vwcy5wdXNoKCAoIHRva2VucyA9IFtdICkgKTtcblx0XHR9XG5cblx0XHRtYXRjaGVkID0gZmFsc2U7XG5cblx0XHQvLyBDb21iaW5hdG9yc1xuXHRcdGlmICggKCBtYXRjaCA9IHJsZWFkaW5nQ29tYmluYXRvci5leGVjKCBzb0ZhciApICkgKSB7XG5cdFx0XHRtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcblx0XHRcdHRva2Vucy5wdXNoKCB7XG5cdFx0XHRcdHZhbHVlOiBtYXRjaGVkLFxuXG5cdFx0XHRcdC8vIENhc3QgZGVzY2VuZGFudCBjb21iaW5hdG9ycyB0byBzcGFjZVxuXHRcdFx0XHR0eXBlOiBtYXRjaFsgMCBdLnJlcGxhY2UoIHJ0cmltQ1NTLCBcIiBcIiApXG5cdFx0XHR9ICk7XG5cdFx0XHRzb0ZhciA9IHNvRmFyLnNsaWNlKCBtYXRjaGVkLmxlbmd0aCApO1xuXHRcdH1cblxuXHRcdC8vIEZpbHRlcnNcblx0XHRmb3IgKCB0eXBlIGluIEV4cHIuZmlsdGVyICkge1xuXHRcdFx0aWYgKCAoIG1hdGNoID0gbWF0Y2hFeHByWyB0eXBlIF0uZXhlYyggc29GYXIgKSApICYmICggIXByZUZpbHRlcnNbIHR5cGUgXSB8fFxuXHRcdFx0XHQoIG1hdGNoID0gcHJlRmlsdGVyc1sgdHlwZSBdKCBtYXRjaCApICkgKSApIHtcblx0XHRcdFx0bWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XG5cdFx0XHRcdHRva2Vucy5wdXNoKCB7XG5cdFx0XHRcdFx0dmFsdWU6IG1hdGNoZWQsXG5cdFx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0XHRtYXRjaGVzOiBtYXRjaFxuXHRcdFx0XHR9ICk7XG5cdFx0XHRcdHNvRmFyID0gc29GYXIuc2xpY2UoIG1hdGNoZWQubGVuZ3RoICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCAhbWF0Y2hlZCApIHtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdC8vIFJldHVybiB0aGUgbGVuZ3RoIG9mIHRoZSBpbnZhbGlkIGV4Y2Vzc1xuXHQvLyBpZiB3ZSdyZSBqdXN0IHBhcnNpbmdcblx0Ly8gT3RoZXJ3aXNlLCB0aHJvdyBhbiBlcnJvciBvciByZXR1cm4gdG9rZW5zXG5cdGlmICggcGFyc2VPbmx5ICkge1xuXHRcdHJldHVybiBzb0Zhci5sZW5ndGg7XG5cdH1cblxuXHRyZXR1cm4gc29GYXIgP1xuXHRcdGZpbmQuZXJyb3IoIHNlbGVjdG9yICkgOlxuXG5cdFx0Ly8gQ2FjaGUgdGhlIHRva2Vuc1xuXHRcdHRva2VuQ2FjaGUoIHNlbGVjdG9yLCBncm91cHMgKS5zbGljZSggMCApO1xufVxuXG5mdW5jdGlvbiB0b1NlbGVjdG9yKCB0b2tlbnMgKSB7XG5cdHZhciBpID0gMCxcblx0XHRsZW4gPSB0b2tlbnMubGVuZ3RoLFxuXHRcdHNlbGVjdG9yID0gXCJcIjtcblx0Zm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0c2VsZWN0b3IgKz0gdG9rZW5zWyBpIF0udmFsdWU7XG5cdH1cblx0cmV0dXJuIHNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBhZGRDb21iaW5hdG9yKCBtYXRjaGVyLCBjb21iaW5hdG9yLCBiYXNlICkge1xuXHR2YXIgZGlyID0gY29tYmluYXRvci5kaXIsXG5cdFx0c2tpcCA9IGNvbWJpbmF0b3IubmV4dCxcblx0XHRrZXkgPSBza2lwIHx8IGRpcixcblx0XHRjaGVja05vbkVsZW1lbnRzID0gYmFzZSAmJiBrZXkgPT09IFwicGFyZW50Tm9kZVwiLFxuXHRcdGRvbmVOYW1lID0gZG9uZSsrO1xuXG5cdHJldHVybiBjb21iaW5hdG9yLmZpcnN0ID9cblxuXHRcdC8vIENoZWNrIGFnYWluc3QgY2xvc2VzdCBhbmNlc3Rvci9wcmVjZWRpbmcgZWxlbWVudFxuXHRcdGZ1bmN0aW9uKCBlbGVtLCBjb250ZXh0LCB4bWwgKSB7XG5cdFx0XHR3aGlsZSAoICggZWxlbSA9IGVsZW1bIGRpciBdICkgKSB7XG5cdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSB8fCBjaGVja05vbkVsZW1lbnRzICkge1xuXHRcdFx0XHRcdHJldHVybiBtYXRjaGVyKCBlbGVtLCBjb250ZXh0LCB4bWwgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gOlxuXG5cdFx0Ly8gQ2hlY2sgYWdhaW5zdCBhbGwgYW5jZXN0b3IvcHJlY2VkaW5nIGVsZW1lbnRzXG5cdFx0ZnVuY3Rpb24oIGVsZW0sIGNvbnRleHQsIHhtbCApIHtcblx0XHRcdHZhciBvbGRDYWNoZSwgb3V0ZXJDYWNoZSxcblx0XHRcdFx0bmV3Q2FjaGUgPSBbIGRpcnJ1bnMsIGRvbmVOYW1lIF07XG5cblx0XHRcdC8vIFdlIGNhbid0IHNldCBhcmJpdHJhcnkgZGF0YSBvbiBYTUwgbm9kZXMsIHNvIHRoZXkgZG9uJ3QgYmVuZWZpdCBmcm9tIGNvbWJpbmF0b3IgY2FjaGluZ1xuXHRcdFx0aWYgKCB4bWwgKSB7XG5cdFx0XHRcdHdoaWxlICggKCBlbGVtID0gZWxlbVsgZGlyIF0gKSApIHtcblx0XHRcdFx0XHRpZiAoIGVsZW0ubm9kZVR5cGUgPT09IDEgfHwgY2hlY2tOb25FbGVtZW50cyApIHtcblx0XHRcdFx0XHRcdGlmICggbWF0Y2hlciggZWxlbSwgY29udGV4dCwgeG1sICkgKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2hpbGUgKCAoIGVsZW0gPSBlbGVtWyBkaXIgXSApICkge1xuXHRcdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSB8fCBjaGVja05vbkVsZW1lbnRzICkge1xuXHRcdFx0XHRcdFx0b3V0ZXJDYWNoZSA9IGVsZW1bIGV4cGFuZG8gXSB8fCAoIGVsZW1bIGV4cGFuZG8gXSA9IHt9ICk7XG5cblx0XHRcdFx0XHRcdGlmICggc2tpcCAmJiBub2RlTmFtZSggZWxlbSwgc2tpcCApICkge1xuXHRcdFx0XHRcdFx0XHRlbGVtID0gZWxlbVsgZGlyIF0gfHwgZWxlbTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoICggb2xkQ2FjaGUgPSBvdXRlckNhY2hlWyBrZXkgXSApICYmXG5cdFx0XHRcdFx0XHRcdG9sZENhY2hlWyAwIF0gPT09IGRpcnJ1bnMgJiYgb2xkQ2FjaGVbIDEgXSA9PT0gZG9uZU5hbWUgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gQXNzaWduIHRvIG5ld0NhY2hlIHNvIHJlc3VsdHMgYmFjay1wcm9wYWdhdGUgdG8gcHJldmlvdXMgZWxlbWVudHNcblx0XHRcdFx0XHRcdFx0cmV0dXJuICggbmV3Q2FjaGVbIDIgXSA9IG9sZENhY2hlWyAyIF0gKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmV1c2UgbmV3Y2FjaGUgc28gcmVzdWx0cyBiYWNrLXByb3BhZ2F0ZSB0byBwcmV2aW91cyBlbGVtZW50c1xuXHRcdFx0XHRcdFx0XHRvdXRlckNhY2hlWyBrZXkgXSA9IG5ld0NhY2hlO1xuXG5cdFx0XHRcdFx0XHRcdC8vIEEgbWF0Y2ggbWVhbnMgd2UncmUgZG9uZTsgYSBmYWlsIG1lYW5zIHdlIGhhdmUgdG8ga2VlcCBjaGVja2luZ1xuXHRcdFx0XHRcdFx0XHRpZiAoICggbmV3Q2FjaGVbIDIgXSA9IG1hdGNoZXIoIGVsZW0sIGNvbnRleHQsIHhtbCApICkgKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xufVxuXG5mdW5jdGlvbiBlbGVtZW50TWF0Y2hlciggbWF0Y2hlcnMgKSB7XG5cdHJldHVybiBtYXRjaGVycy5sZW5ndGggPiAxID9cblx0XHRmdW5jdGlvbiggZWxlbSwgY29udGV4dCwgeG1sICkge1xuXHRcdFx0dmFyIGkgPSBtYXRjaGVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0aWYgKCAhbWF0Y2hlcnNbIGkgXSggZWxlbSwgY29udGV4dCwgeG1sICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IDpcblx0XHRtYXRjaGVyc1sgMCBdO1xufVxuXG5mdW5jdGlvbiBtdWx0aXBsZUNvbnRleHRzKCBzZWxlY3RvciwgY29udGV4dHMsIHJlc3VsdHMgKSB7XG5cdHZhciBpID0gMCxcblx0XHRsZW4gPSBjb250ZXh0cy5sZW5ndGg7XG5cdGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdGZpbmQoIHNlbGVjdG9yLCBjb250ZXh0c1sgaSBdLCByZXN1bHRzICk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdHM7XG59XG5cbmZ1bmN0aW9uIGNvbmRlbnNlKCB1bm1hdGNoZWQsIG1hcCwgZmlsdGVyLCBjb250ZXh0LCB4bWwgKSB7XG5cdHZhciBlbGVtLFxuXHRcdG5ld1VubWF0Y2hlZCA9IFtdLFxuXHRcdGkgPSAwLFxuXHRcdGxlbiA9IHVubWF0Y2hlZC5sZW5ndGgsXG5cdFx0bWFwcGVkID0gbWFwICE9IG51bGw7XG5cblx0Zm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0aWYgKCAoIGVsZW0gPSB1bm1hdGNoZWRbIGkgXSApICkge1xuXHRcdFx0aWYgKCAhZmlsdGVyIHx8IGZpbHRlciggZWxlbSwgY29udGV4dCwgeG1sICkgKSB7XG5cdFx0XHRcdG5ld1VubWF0Y2hlZC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdGlmICggbWFwcGVkICkge1xuXHRcdFx0XHRcdG1hcC5wdXNoKCBpICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbmV3VW5tYXRjaGVkO1xufVxuXG5mdW5jdGlvbiBzZXRNYXRjaGVyKCBwcmVGaWx0ZXIsIHNlbGVjdG9yLCBtYXRjaGVyLCBwb3N0RmlsdGVyLCBwb3N0RmluZGVyLCBwb3N0U2VsZWN0b3IgKSB7XG5cdGlmICggcG9zdEZpbHRlciAmJiAhcG9zdEZpbHRlclsgZXhwYW5kbyBdICkge1xuXHRcdHBvc3RGaWx0ZXIgPSBzZXRNYXRjaGVyKCBwb3N0RmlsdGVyICk7XG5cdH1cblx0aWYgKCBwb3N0RmluZGVyICYmICFwb3N0RmluZGVyWyBleHBhbmRvIF0gKSB7XG5cdFx0cG9zdEZpbmRlciA9IHNldE1hdGNoZXIoIHBvc3RGaW5kZXIsIHBvc3RTZWxlY3RvciApO1xuXHR9XG5cdHJldHVybiBtYXJrRnVuY3Rpb24oIGZ1bmN0aW9uKCBzZWVkLCByZXN1bHRzLCBjb250ZXh0LCB4bWwgKSB7XG5cdFx0dmFyIHRlbXAsIGksIGVsZW0sIG1hdGNoZXJPdXQsXG5cdFx0XHRwcmVNYXAgPSBbXSxcblx0XHRcdHBvc3RNYXAgPSBbXSxcblx0XHRcdHByZWV4aXN0aW5nID0gcmVzdWx0cy5sZW5ndGgsXG5cblx0XHRcdC8vIEdldCBpbml0aWFsIGVsZW1lbnRzIGZyb20gc2VlZCBvciBjb250ZXh0XG5cdFx0XHRlbGVtcyA9IHNlZWQgfHxcblx0XHRcdFx0bXVsdGlwbGVDb250ZXh0cyggc2VsZWN0b3IgfHwgXCIqXCIsXG5cdFx0XHRcdFx0Y29udGV4dC5ub2RlVHlwZSA/IFsgY29udGV4dCBdIDogY29udGV4dCwgW10gKSxcblxuXHRcdFx0Ly8gUHJlZmlsdGVyIHRvIGdldCBtYXRjaGVyIGlucHV0LCBwcmVzZXJ2aW5nIGEgbWFwIGZvciBzZWVkLXJlc3VsdHMgc3luY2hyb25pemF0aW9uXG5cdFx0XHRtYXRjaGVySW4gPSBwcmVGaWx0ZXIgJiYgKCBzZWVkIHx8ICFzZWxlY3RvciApID9cblx0XHRcdFx0Y29uZGVuc2UoIGVsZW1zLCBwcmVNYXAsIHByZUZpbHRlciwgY29udGV4dCwgeG1sICkgOlxuXHRcdFx0XHRlbGVtcztcblxuXHRcdGlmICggbWF0Y2hlciApIHtcblxuXHRcdFx0Ly8gSWYgd2UgaGF2ZSBhIHBvc3RGaW5kZXIsIG9yIGZpbHRlcmVkIHNlZWQsIG9yIG5vbi1zZWVkIHBvc3RGaWx0ZXJcblx0XHRcdC8vIG9yIHByZWV4aXN0aW5nIHJlc3VsdHMsXG5cdFx0XHRtYXRjaGVyT3V0ID0gcG9zdEZpbmRlciB8fCAoIHNlZWQgPyBwcmVGaWx0ZXIgOiBwcmVleGlzdGluZyB8fCBwb3N0RmlsdGVyICkgP1xuXG5cdFx0XHRcdC8vIC4uLmludGVybWVkaWF0ZSBwcm9jZXNzaW5nIGlzIG5lY2Vzc2FyeVxuXHRcdFx0XHRbXSA6XG5cblx0XHRcdFx0Ly8gLi4ub3RoZXJ3aXNlIHVzZSByZXN1bHRzIGRpcmVjdGx5XG5cdFx0XHRcdHJlc3VsdHM7XG5cblx0XHRcdC8vIEZpbmQgcHJpbWFyeSBtYXRjaGVzXG5cdFx0XHRtYXRjaGVyKCBtYXRjaGVySW4sIG1hdGNoZXJPdXQsIGNvbnRleHQsIHhtbCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXRjaGVyT3V0ID0gbWF0Y2hlckluO1xuXHRcdH1cblxuXHRcdC8vIEFwcGx5IHBvc3RGaWx0ZXJcblx0XHRpZiAoIHBvc3RGaWx0ZXIgKSB7XG5cdFx0XHR0ZW1wID0gY29uZGVuc2UoIG1hdGNoZXJPdXQsIHBvc3RNYXAgKTtcblx0XHRcdHBvc3RGaWx0ZXIoIHRlbXAsIFtdLCBjb250ZXh0LCB4bWwgKTtcblxuXHRcdFx0Ly8gVW4tbWF0Y2ggZmFpbGluZyBlbGVtZW50cyBieSBtb3ZpbmcgdGhlbSBiYWNrIHRvIG1hdGNoZXJJblxuXHRcdFx0aSA9IHRlbXAubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRcdGlmICggKCBlbGVtID0gdGVtcFsgaSBdICkgKSB7XG5cdFx0XHRcdFx0bWF0Y2hlck91dFsgcG9zdE1hcFsgaSBdIF0gPSAhKCBtYXRjaGVySW5bIHBvc3RNYXBbIGkgXSBdID0gZWxlbSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCBzZWVkICkge1xuXHRcdFx0aWYgKCBwb3N0RmluZGVyIHx8IHByZUZpbHRlciApIHtcblx0XHRcdFx0aWYgKCBwb3N0RmluZGVyICkge1xuXG5cdFx0XHRcdFx0Ly8gR2V0IHRoZSBmaW5hbCBtYXRjaGVyT3V0IGJ5IGNvbmRlbnNpbmcgdGhpcyBpbnRlcm1lZGlhdGUgaW50byBwb3N0RmluZGVyIGNvbnRleHRzXG5cdFx0XHRcdFx0dGVtcCA9IFtdO1xuXHRcdFx0XHRcdGkgPSBtYXRjaGVyT3V0Lmxlbmd0aDtcblx0XHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRcdGlmICggKCBlbGVtID0gbWF0Y2hlck91dFsgaSBdICkgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmVzdG9yZSBtYXRjaGVySW4gc2luY2UgZWxlbSBpcyBub3QgeWV0IGEgZmluYWwgbWF0Y2hcblx0XHRcdFx0XHRcdFx0dGVtcC5wdXNoKCAoIG1hdGNoZXJJblsgaSBdID0gZWxlbSApICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBvc3RGaW5kZXIoIG51bGwsICggbWF0Y2hlck91dCA9IFtdICksIHRlbXAsIHhtbCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTW92ZSBtYXRjaGVkIGVsZW1lbnRzIGZyb20gc2VlZCB0byByZXN1bHRzIHRvIGtlZXAgdGhlbSBzeW5jaHJvbml6ZWRcblx0XHRcdFx0aSA9IG1hdGNoZXJPdXQubGVuZ3RoO1xuXHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRpZiAoICggZWxlbSA9IG1hdGNoZXJPdXRbIGkgXSApICYmXG5cdFx0XHRcdFx0XHQoIHRlbXAgPSBwb3N0RmluZGVyID8gaW5kZXhPZi5jYWxsKCBzZWVkLCBlbGVtICkgOiBwcmVNYXBbIGkgXSApID4gLTEgKSB7XG5cblx0XHRcdFx0XHRcdHNlZWRbIHRlbXAgXSA9ICEoIHJlc3VsdHNbIHRlbXAgXSA9IGVsZW0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdC8vIEFkZCBlbGVtZW50cyB0byByZXN1bHRzLCB0aHJvdWdoIHBvc3RGaW5kZXIgaWYgZGVmaW5lZFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXRjaGVyT3V0ID0gY29uZGVuc2UoXG5cdFx0XHRcdG1hdGNoZXJPdXQgPT09IHJlc3VsdHMgP1xuXHRcdFx0XHRcdG1hdGNoZXJPdXQuc3BsaWNlKCBwcmVleGlzdGluZywgbWF0Y2hlck91dC5sZW5ndGggKSA6XG5cdFx0XHRcdFx0bWF0Y2hlck91dFxuXHRcdFx0KTtcblx0XHRcdGlmICggcG9zdEZpbmRlciApIHtcblx0XHRcdFx0cG9zdEZpbmRlciggbnVsbCwgcmVzdWx0cywgbWF0Y2hlck91dCwgeG1sICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwdXNoLmFwcGx5KCByZXN1bHRzLCBtYXRjaGVyT3V0ICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9ICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXJGcm9tVG9rZW5zKCB0b2tlbnMgKSB7XG5cdHZhciBjaGVja0NvbnRleHQsIG1hdGNoZXIsIGosXG5cdFx0bGVuID0gdG9rZW5zLmxlbmd0aCxcblx0XHRsZWFkaW5nUmVsYXRpdmUgPSBFeHByLnJlbGF0aXZlWyB0b2tlbnNbIDAgXS50eXBlIF0sXG5cdFx0aW1wbGljaXRSZWxhdGl2ZSA9IGxlYWRpbmdSZWxhdGl2ZSB8fCBFeHByLnJlbGF0aXZlWyBcIiBcIiBdLFxuXHRcdGkgPSBsZWFkaW5nUmVsYXRpdmUgPyAxIDogMCxcblxuXHRcdC8vIFRoZSBmb3VuZGF0aW9uYWwgbWF0Y2hlciBlbnN1cmVzIHRoYXQgZWxlbWVudHMgYXJlIHJlYWNoYWJsZSBmcm9tIHRvcC1sZXZlbCBjb250ZXh0KHMpXG5cdFx0bWF0Y2hDb250ZXh0ID0gYWRkQ29tYmluYXRvciggZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gZWxlbSA9PT0gY2hlY2tDb250ZXh0O1xuXHRcdH0sIGltcGxpY2l0UmVsYXRpdmUsIHRydWUgKSxcblx0XHRtYXRjaEFueUNvbnRleHQgPSBhZGRDb21iaW5hdG9yKCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBpbmRleE9mLmNhbGwoIGNoZWNrQ29udGV4dCwgZWxlbSApID4gLTE7XG5cdFx0fSwgaW1wbGljaXRSZWxhdGl2ZSwgdHJ1ZSApLFxuXHRcdG1hdGNoZXJzID0gWyBmdW5jdGlvbiggZWxlbSwgY29udGV4dCwgeG1sICkge1xuXG5cdFx0XHQvLyBTdXBwb3J0OiBJRSAxMSssIEVkZ2UgMTcgLSAxOCtcblx0XHRcdC8vIElFL0VkZ2Ugc29tZXRpbWVzIHRocm93IGEgXCJQZXJtaXNzaW9uIGRlbmllZFwiIGVycm9yIHdoZW4gc3RyaWN0LWNvbXBhcmluZ1xuXHRcdFx0Ly8gdHdvIGRvY3VtZW50czsgc2hhbGxvdyBjb21wYXJpc29ucyB3b3JrLlxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuXHRcdFx0dmFyIHJldCA9ICggIWxlYWRpbmdSZWxhdGl2ZSAmJiAoIHhtbCB8fCBjb250ZXh0ICE9IG91dGVybW9zdENvbnRleHQgKSApIHx8IChcblx0XHRcdFx0KCBjaGVja0NvbnRleHQgPSBjb250ZXh0ICkubm9kZVR5cGUgP1xuXHRcdFx0XHRcdG1hdGNoQ29udGV4dCggZWxlbSwgY29udGV4dCwgeG1sICkgOlxuXHRcdFx0XHRcdG1hdGNoQW55Q29udGV4dCggZWxlbSwgY29udGV4dCwgeG1sICkgKTtcblxuXHRcdFx0Ly8gQXZvaWQgaGFuZ2luZyBvbnRvIGVsZW1lbnRcblx0XHRcdC8vIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9zaXp6bGUvaXNzdWVzLzI5OSlcblx0XHRcdGNoZWNrQ29udGV4dCA9IG51bGw7XG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH0gXTtcblxuXHRmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRpZiAoICggbWF0Y2hlciA9IEV4cHIucmVsYXRpdmVbIHRva2Vuc1sgaSBdLnR5cGUgXSApICkge1xuXHRcdFx0bWF0Y2hlcnMgPSBbIGFkZENvbWJpbmF0b3IoIGVsZW1lbnRNYXRjaGVyKCBtYXRjaGVycyApLCBtYXRjaGVyICkgXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWF0Y2hlciA9IEV4cHIuZmlsdGVyWyB0b2tlbnNbIGkgXS50eXBlIF0uYXBwbHkoIG51bGwsIHRva2Vuc1sgaSBdLm1hdGNoZXMgKTtcblxuXHRcdFx0Ly8gUmV0dXJuIHNwZWNpYWwgdXBvbiBzZWVpbmcgYSBwb3NpdGlvbmFsIG1hdGNoZXJcblx0XHRcdGlmICggbWF0Y2hlclsgZXhwYW5kbyBdICkge1xuXG5cdFx0XHRcdC8vIEZpbmQgdGhlIG5leHQgcmVsYXRpdmUgb3BlcmF0b3IgKGlmIGFueSkgZm9yIHByb3BlciBoYW5kbGluZ1xuXHRcdFx0XHRqID0gKytpO1xuXHRcdFx0XHRmb3IgKCA7IGogPCBsZW47IGorKyApIHtcblx0XHRcdFx0XHRpZiAoIEV4cHIucmVsYXRpdmVbIHRva2Vuc1sgaiBdLnR5cGUgXSApIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gc2V0TWF0Y2hlcihcblx0XHRcdFx0XHRpID4gMSAmJiBlbGVtZW50TWF0Y2hlciggbWF0Y2hlcnMgKSxcblx0XHRcdFx0XHRpID4gMSAmJiB0b1NlbGVjdG9yKFxuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGUgcHJlY2VkaW5nIHRva2VuIHdhcyBhIGRlc2NlbmRhbnQgY29tYmluYXRvciwgaW5zZXJ0IGFuIGltcGxpY2l0IGFueS1lbGVtZW50IGAqYFxuXHRcdFx0XHRcdFx0dG9rZW5zLnNsaWNlKCAwLCBpIC0gMSApXG5cdFx0XHRcdFx0XHRcdC5jb25jYXQoIHsgdmFsdWU6IHRva2Vuc1sgaSAtIDIgXS50eXBlID09PSBcIiBcIiA/IFwiKlwiIDogXCJcIiB9IClcblx0XHRcdFx0XHQpLnJlcGxhY2UoIHJ0cmltQ1NTLCBcIiQxXCIgKSxcblx0XHRcdFx0XHRtYXRjaGVyLFxuXHRcdFx0XHRcdGkgPCBqICYmIG1hdGNoZXJGcm9tVG9rZW5zKCB0b2tlbnMuc2xpY2UoIGksIGogKSApLFxuXHRcdFx0XHRcdGogPCBsZW4gJiYgbWF0Y2hlckZyb21Ub2tlbnMoICggdG9rZW5zID0gdG9rZW5zLnNsaWNlKCBqICkgKSApLFxuXHRcdFx0XHRcdGogPCBsZW4gJiYgdG9TZWxlY3RvciggdG9rZW5zIClcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdG1hdGNoZXJzLnB1c2goIG1hdGNoZXIgKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZWxlbWVudE1hdGNoZXIoIG1hdGNoZXJzICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXJGcm9tR3JvdXBNYXRjaGVycyggZWxlbWVudE1hdGNoZXJzLCBzZXRNYXRjaGVycyApIHtcblx0dmFyIGJ5U2V0ID0gc2V0TWF0Y2hlcnMubGVuZ3RoID4gMCxcblx0XHRieUVsZW1lbnQgPSBlbGVtZW50TWF0Y2hlcnMubGVuZ3RoID4gMCxcblx0XHRzdXBlck1hdGNoZXIgPSBmdW5jdGlvbiggc2VlZCwgY29udGV4dCwgeG1sLCByZXN1bHRzLCBvdXRlcm1vc3QgKSB7XG5cdFx0XHR2YXIgZWxlbSwgaiwgbWF0Y2hlcixcblx0XHRcdFx0bWF0Y2hlZENvdW50ID0gMCxcblx0XHRcdFx0aSA9IFwiMFwiLFxuXHRcdFx0XHR1bm1hdGNoZWQgPSBzZWVkICYmIFtdLFxuXHRcdFx0XHRzZXRNYXRjaGVkID0gW10sXG5cdFx0XHRcdGNvbnRleHRCYWNrdXAgPSBvdXRlcm1vc3RDb250ZXh0LFxuXG5cdFx0XHRcdC8vIFdlIG11c3QgYWx3YXlzIGhhdmUgZWl0aGVyIHNlZWQgZWxlbWVudHMgb3Igb3V0ZXJtb3N0IGNvbnRleHRcblx0XHRcdFx0ZWxlbXMgPSBzZWVkIHx8IGJ5RWxlbWVudCAmJiBFeHByLmZpbmQuVEFHKCBcIipcIiwgb3V0ZXJtb3N0ICksXG5cblx0XHRcdFx0Ly8gVXNlIGludGVnZXIgZGlycnVucyBpZmYgdGhpcyBpcyB0aGUgb3V0ZXJtb3N0IG1hdGNoZXJcblx0XHRcdFx0ZGlycnVuc1VuaXF1ZSA9ICggZGlycnVucyArPSBjb250ZXh0QmFja3VwID09IG51bGwgPyAxIDogTWF0aC5yYW5kb20oKSB8fCAwLjEgKSxcblx0XHRcdFx0bGVuID0gZWxlbXMubGVuZ3RoO1xuXG5cdFx0XHRpZiAoIG91dGVybW9zdCApIHtcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBJRSAxMSssIEVkZ2UgMTcgLSAxOCtcblx0XHRcdFx0Ly8gSUUvRWRnZSBzb21ldGltZXMgdGhyb3cgYSBcIlBlcm1pc3Npb24gZGVuaWVkXCIgZXJyb3Igd2hlbiBzdHJpY3QtY29tcGFyaW5nXG5cdFx0XHRcdC8vIHR3byBkb2N1bWVudHM7IHNoYWxsb3cgY29tcGFyaXNvbnMgd29yay5cblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuXHRcdFx0XHRvdXRlcm1vc3RDb250ZXh0ID0gY29udGV4dCA9PSBkb2N1bWVudCB8fCBjb250ZXh0IHx8IG91dGVybW9zdDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWRkIGVsZW1lbnRzIHBhc3NpbmcgZWxlbWVudE1hdGNoZXJzIGRpcmVjdGx5IHRvIHJlc3VsdHNcblx0XHRcdC8vIFN1cHBvcnQ6IGlPUyA8PTcgLSA5IG9ubHlcblx0XHRcdC8vIFRvbGVyYXRlIE5vZGVMaXN0IHByb3BlcnRpZXMgKElFOiBcImxlbmd0aFwiOyBTYWZhcmk6IDxudW1iZXI+KSBtYXRjaGluZ1xuXHRcdFx0Ly8gZWxlbWVudHMgYnkgaWQuIChzZWUgdHJhYy0xNDE0Milcblx0XHRcdGZvciAoIDsgaSAhPT0gbGVuICYmICggZWxlbSA9IGVsZW1zWyBpIF0gKSAhPSBudWxsOyBpKysgKSB7XG5cdFx0XHRcdGlmICggYnlFbGVtZW50ICYmIGVsZW0gKSB7XG5cdFx0XHRcdFx0aiA9IDA7XG5cblx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSAxMSssIEVkZ2UgMTcgLSAxOCtcblx0XHRcdFx0XHQvLyBJRS9FZGdlIHNvbWV0aW1lcyB0aHJvdyBhIFwiUGVybWlzc2lvbiBkZW5pZWRcIiBlcnJvciB3aGVuIHN0cmljdC1jb21wYXJpbmdcblx0XHRcdFx0XHQvLyB0d28gZG9jdW1lbnRzOyBzaGFsbG93IGNvbXBhcmlzb25zIHdvcmsuXG5cdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuXHRcdFx0XHRcdGlmICggIWNvbnRleHQgJiYgZWxlbS5vd25lckRvY3VtZW50ICE9IGRvY3VtZW50ICkge1xuXHRcdFx0XHRcdFx0c2V0RG9jdW1lbnQoIGVsZW0gKTtcblx0XHRcdFx0XHRcdHhtbCA9ICFkb2N1bWVudElzSFRNTDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0d2hpbGUgKCAoIG1hdGNoZXIgPSBlbGVtZW50TWF0Y2hlcnNbIGorKyBdICkgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIG1hdGNoZXIoIGVsZW0sIGNvbnRleHQgfHwgZG9jdW1lbnQsIHhtbCApICkge1xuXHRcdFx0XHRcdFx0XHRwdXNoLmNhbGwoIHJlc3VsdHMsIGVsZW0gKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggb3V0ZXJtb3N0ICkge1xuXHRcdFx0XHRcdFx0ZGlycnVucyA9IGRpcnJ1bnNVbmlxdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVHJhY2sgdW5tYXRjaGVkIGVsZW1lbnRzIGZvciBzZXQgZmlsdGVyc1xuXHRcdFx0XHRpZiAoIGJ5U2V0ICkge1xuXG5cdFx0XHRcdFx0Ly8gVGhleSB3aWxsIGhhdmUgZ29uZSB0aHJvdWdoIGFsbCBwb3NzaWJsZSBtYXRjaGVyc1xuXHRcdFx0XHRcdGlmICggKCBlbGVtID0gIW1hdGNoZXIgJiYgZWxlbSApICkge1xuXHRcdFx0XHRcdFx0bWF0Y2hlZENvdW50LS07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTGVuZ3RoZW4gdGhlIGFycmF5IGZvciBldmVyeSBlbGVtZW50LCBtYXRjaGVkIG9yIG5vdFxuXHRcdFx0XHRcdGlmICggc2VlZCApIHtcblx0XHRcdFx0XHRcdHVubWF0Y2hlZC5wdXNoKCBlbGVtICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIGBpYCBpcyBub3cgdGhlIGNvdW50IG9mIGVsZW1lbnRzIHZpc2l0ZWQgYWJvdmUsIGFuZCBhZGRpbmcgaXQgdG8gYG1hdGNoZWRDb3VudGBcblx0XHRcdC8vIG1ha2VzIHRoZSBsYXR0ZXIgbm9ubmVnYXRpdmUuXG5cdFx0XHRtYXRjaGVkQ291bnQgKz0gaTtcblxuXHRcdFx0Ly8gQXBwbHkgc2V0IGZpbHRlcnMgdG8gdW5tYXRjaGVkIGVsZW1lbnRzXG5cdFx0XHQvLyBOT1RFOiBUaGlzIGNhbiBiZSBza2lwcGVkIGlmIHRoZXJlIGFyZSBubyB1bm1hdGNoZWQgZWxlbWVudHMgKGkuZS4sIGBtYXRjaGVkQ291bnRgXG5cdFx0XHQvLyBlcXVhbHMgYGlgKSwgdW5sZXNzIHdlIGRpZG4ndCB2aXNpdCBfYW55XyBlbGVtZW50cyBpbiB0aGUgYWJvdmUgbG9vcCBiZWNhdXNlIHdlIGhhdmVcblx0XHRcdC8vIG5vIGVsZW1lbnQgbWF0Y2hlcnMgYW5kIG5vIHNlZWQuXG5cdFx0XHQvLyBJbmNyZW1lbnRpbmcgYW4gaW5pdGlhbGx5LXN0cmluZyBcIjBcIiBgaWAgYWxsb3dzIGBpYCB0byByZW1haW4gYSBzdHJpbmcgb25seSBpbiB0aGF0XG5cdFx0XHQvLyBjYXNlLCB3aGljaCB3aWxsIHJlc3VsdCBpbiBhIFwiMDBcIiBgbWF0Y2hlZENvdW50YCB0aGF0IGRpZmZlcnMgZnJvbSBgaWAgYnV0IGlzIGFsc29cblx0XHRcdC8vIG51bWVyaWNhbGx5IHplcm8uXG5cdFx0XHRpZiAoIGJ5U2V0ICYmIGkgIT09IG1hdGNoZWRDb3VudCApIHtcblx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdHdoaWxlICggKCBtYXRjaGVyID0gc2V0TWF0Y2hlcnNbIGorKyBdICkgKSB7XG5cdFx0XHRcdFx0bWF0Y2hlciggdW5tYXRjaGVkLCBzZXRNYXRjaGVkLCBjb250ZXh0LCB4bWwgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggc2VlZCApIHtcblxuXHRcdFx0XHRcdC8vIFJlaW50ZWdyYXRlIGVsZW1lbnQgbWF0Y2hlcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHNvcnRpbmdcblx0XHRcdFx0XHRpZiAoIG1hdGNoZWRDb3VudCA+IDAgKSB7XG5cdFx0XHRcdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCAhKCB1bm1hdGNoZWRbIGkgXSB8fCBzZXRNYXRjaGVkWyBpIF0gKSApIHtcblx0XHRcdFx0XHRcdFx0XHRzZXRNYXRjaGVkWyBpIF0gPSBwb3AuY2FsbCggcmVzdWx0cyApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gRGlzY2FyZCBpbmRleCBwbGFjZWhvbGRlciB2YWx1ZXMgdG8gZ2V0IG9ubHkgYWN0dWFsIG1hdGNoZXNcblx0XHRcdFx0XHRzZXRNYXRjaGVkID0gY29uZGVuc2UoIHNldE1hdGNoZWQgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEFkZCBtYXRjaGVzIHRvIHJlc3VsdHNcblx0XHRcdFx0cHVzaC5hcHBseSggcmVzdWx0cywgc2V0TWF0Y2hlZCApO1xuXG5cdFx0XHRcdC8vIFNlZWRsZXNzIHNldCBtYXRjaGVzIHN1Y2NlZWRpbmcgbXVsdGlwbGUgc3VjY2Vzc2Z1bCBtYXRjaGVycyBzdGlwdWxhdGUgc29ydGluZ1xuXHRcdFx0XHRpZiAoIG91dGVybW9zdCAmJiAhc2VlZCAmJiBzZXRNYXRjaGVkLmxlbmd0aCA+IDAgJiZcblx0XHRcdFx0XHQoIG1hdGNoZWRDb3VudCArIHNldE1hdGNoZXJzLmxlbmd0aCApID4gMSApIHtcblxuXHRcdFx0XHRcdGpRdWVyeS51bmlxdWVTb3J0KCByZXN1bHRzICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gT3ZlcnJpZGUgbWFuaXB1bGF0aW9uIG9mIGdsb2JhbHMgYnkgbmVzdGVkIG1hdGNoZXJzXG5cdFx0XHRpZiAoIG91dGVybW9zdCApIHtcblx0XHRcdFx0ZGlycnVucyA9IGRpcnJ1bnNVbmlxdWU7XG5cdFx0XHRcdG91dGVybW9zdENvbnRleHQgPSBjb250ZXh0QmFja3VwO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5tYXRjaGVkO1xuXHRcdH07XG5cblx0cmV0dXJuIGJ5U2V0ID9cblx0XHRtYXJrRnVuY3Rpb24oIHN1cGVyTWF0Y2hlciApIDpcblx0XHRzdXBlck1hdGNoZXI7XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGUoIHNlbGVjdG9yLCBtYXRjaCAvKiBJbnRlcm5hbCBVc2UgT25seSAqLyApIHtcblx0dmFyIGksXG5cdFx0c2V0TWF0Y2hlcnMgPSBbXSxcblx0XHRlbGVtZW50TWF0Y2hlcnMgPSBbXSxcblx0XHRjYWNoZWQgPSBjb21waWxlckNhY2hlWyBzZWxlY3RvciArIFwiIFwiIF07XG5cblx0aWYgKCAhY2FjaGVkICkge1xuXG5cdFx0Ly8gR2VuZXJhdGUgYSBmdW5jdGlvbiBvZiByZWN1cnNpdmUgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2hlY2sgZWFjaCBlbGVtZW50XG5cdFx0aWYgKCAhbWF0Y2ggKSB7XG5cdFx0XHRtYXRjaCA9IHRva2VuaXplKCBzZWxlY3RvciApO1xuXHRcdH1cblx0XHRpID0gbWF0Y2gubGVuZ3RoO1xuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0Y2FjaGVkID0gbWF0Y2hlckZyb21Ub2tlbnMoIG1hdGNoWyBpIF0gKTtcblx0XHRcdGlmICggY2FjaGVkWyBleHBhbmRvIF0gKSB7XG5cdFx0XHRcdHNldE1hdGNoZXJzLnB1c2goIGNhY2hlZCApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWxlbWVudE1hdGNoZXJzLnB1c2goIGNhY2hlZCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIENhY2hlIHRoZSBjb21waWxlZCBmdW5jdGlvblxuXHRcdGNhY2hlZCA9IGNvbXBpbGVyQ2FjaGUoIHNlbGVjdG9yLFxuXHRcdFx0bWF0Y2hlckZyb21Hcm91cE1hdGNoZXJzKCBlbGVtZW50TWF0Y2hlcnMsIHNldE1hdGNoZXJzICkgKTtcblxuXHRcdC8vIFNhdmUgc2VsZWN0b3IgYW5kIHRva2VuaXphdGlvblxuXHRcdGNhY2hlZC5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHR9XG5cdHJldHVybiBjYWNoZWQ7XG59XG5cbi8qKlxuICogQSBsb3ctbGV2ZWwgc2VsZWN0aW9uIGZ1bmN0aW9uIHRoYXQgd29ya3Mgd2l0aCBqUXVlcnkncyBjb21waWxlZFxuICogIHNlbGVjdG9yIGZ1bmN0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHNlbGVjdG9yIEEgc2VsZWN0b3Igb3IgYSBwcmUtY29tcGlsZWRcbiAqICBzZWxlY3RvciBmdW5jdGlvbiBidWlsdCB3aXRoIGpRdWVyeSBzZWxlY3RvciBjb21waWxlXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNvbnRleHRcbiAqIEBwYXJhbSB7QXJyYXl9IFtyZXN1bHRzXVxuICogQHBhcmFtIHtBcnJheX0gW3NlZWRdIEEgc2V0IG9mIGVsZW1lbnRzIHRvIG1hdGNoIGFnYWluc3RcbiAqL1xuZnVuY3Rpb24gc2VsZWN0KCBzZWxlY3RvciwgY29udGV4dCwgcmVzdWx0cywgc2VlZCApIHtcblx0dmFyIGksIHRva2VucywgdG9rZW4sIHR5cGUsIGZpbmQsXG5cdFx0Y29tcGlsZWQgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwiZnVuY3Rpb25cIiAmJiBzZWxlY3Rvcixcblx0XHRtYXRjaCA9ICFzZWVkICYmIHRva2VuaXplKCAoIHNlbGVjdG9yID0gY29tcGlsZWQuc2VsZWN0b3IgfHwgc2VsZWN0b3IgKSApO1xuXG5cdHJlc3VsdHMgPSByZXN1bHRzIHx8IFtdO1xuXG5cdC8vIFRyeSB0byBtaW5pbWl6ZSBvcGVyYXRpb25zIGlmIHRoZXJlIGlzIG9ubHkgb25lIHNlbGVjdG9yIGluIHRoZSBsaXN0IGFuZCBubyBzZWVkXG5cdC8vICh0aGUgbGF0dGVyIG9mIHdoaWNoIGd1YXJhbnRlZXMgdXMgY29udGV4dClcblx0aWYgKCBtYXRjaC5sZW5ndGggPT09IDEgKSB7XG5cblx0XHQvLyBSZWR1Y2UgY29udGV4dCBpZiB0aGUgbGVhZGluZyBjb21wb3VuZCBzZWxlY3RvciBpcyBhbiBJRFxuXHRcdHRva2VucyA9IG1hdGNoWyAwIF0gPSBtYXRjaFsgMCBdLnNsaWNlKCAwICk7XG5cdFx0aWYgKCB0b2tlbnMubGVuZ3RoID4gMiAmJiAoIHRva2VuID0gdG9rZW5zWyAwIF0gKS50eXBlID09PSBcIklEXCIgJiZcblx0XHRcdFx0Y29udGV4dC5ub2RlVHlwZSA9PT0gOSAmJiBkb2N1bWVudElzSFRNTCAmJiBFeHByLnJlbGF0aXZlWyB0b2tlbnNbIDEgXS50eXBlIF0gKSB7XG5cblx0XHRcdGNvbnRleHQgPSAoIEV4cHIuZmluZC5JRChcblx0XHRcdFx0dG9rZW4ubWF0Y2hlc1sgMCBdLnJlcGxhY2UoIHJ1bmVzY2FwZSwgZnVuZXNjYXBlICksXG5cdFx0XHRcdGNvbnRleHRcblx0XHRcdCkgfHwgW10gKVsgMCBdO1xuXHRcdFx0aWYgKCAhY29udGV4dCApIHtcblx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cblx0XHRcdC8vIFByZWNvbXBpbGVkIG1hdGNoZXJzIHdpbGwgc3RpbGwgdmVyaWZ5IGFuY2VzdHJ5LCBzbyBzdGVwIHVwIGEgbGV2ZWxcblx0XHRcdH0gZWxzZSBpZiAoIGNvbXBpbGVkICkge1xuXHRcdFx0XHRjb250ZXh0ID0gY29udGV4dC5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnNsaWNlKCB0b2tlbnMuc2hpZnQoKS52YWx1ZS5sZW5ndGggKTtcblx0XHR9XG5cblx0XHQvLyBGZXRjaCBhIHNlZWQgc2V0IGZvciByaWdodC10by1sZWZ0IG1hdGNoaW5nXG5cdFx0aSA9IG1hdGNoRXhwci5uZWVkc0NvbnRleHQudGVzdCggc2VsZWN0b3IgKSA/IDAgOiB0b2tlbnMubGVuZ3RoO1xuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0dG9rZW4gPSB0b2tlbnNbIGkgXTtcblxuXHRcdFx0Ly8gQWJvcnQgaWYgd2UgaGl0IGEgY29tYmluYXRvclxuXHRcdFx0aWYgKCBFeHByLnJlbGF0aXZlWyAoIHR5cGUgPSB0b2tlbi50eXBlICkgXSApIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRpZiAoICggZmluZCA9IEV4cHIuZmluZFsgdHlwZSBdICkgKSB7XG5cblx0XHRcdFx0Ly8gU2VhcmNoLCBleHBhbmRpbmcgY29udGV4dCBmb3IgbGVhZGluZyBzaWJsaW5nIGNvbWJpbmF0b3JzXG5cdFx0XHRcdGlmICggKCBzZWVkID0gZmluZChcblx0XHRcdFx0XHR0b2tlbi5tYXRjaGVzWyAwIF0ucmVwbGFjZSggcnVuZXNjYXBlLCBmdW5lc2NhcGUgKSxcblx0XHRcdFx0XHRyc2libGluZy50ZXN0KCB0b2tlbnNbIDAgXS50eXBlICkgJiZcblx0XHRcdFx0XHRcdHRlc3RDb250ZXh0KCBjb250ZXh0LnBhcmVudE5vZGUgKSB8fCBjb250ZXh0XG5cdFx0XHRcdCkgKSApIHtcblxuXHRcdFx0XHRcdC8vIElmIHNlZWQgaXMgZW1wdHkgb3Igbm8gdG9rZW5zIHJlbWFpbiwgd2UgY2FuIHJldHVybiBlYXJseVxuXHRcdFx0XHRcdHRva2Vucy5zcGxpY2UoIGksIDEgKTtcblx0XHRcdFx0XHRzZWxlY3RvciA9IHNlZWQubGVuZ3RoICYmIHRvU2VsZWN0b3IoIHRva2VucyApO1xuXHRcdFx0XHRcdGlmICggIXNlbGVjdG9yICkge1xuXHRcdFx0XHRcdFx0cHVzaC5hcHBseSggcmVzdWx0cywgc2VlZCApO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBDb21waWxlIGFuZCBleGVjdXRlIGEgZmlsdGVyaW5nIGZ1bmN0aW9uIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcblx0Ly8gUHJvdmlkZSBgbWF0Y2hgIHRvIGF2b2lkIHJldG9rZW5pemF0aW9uIGlmIHdlIG1vZGlmaWVkIHRoZSBzZWxlY3RvciBhYm92ZVxuXHQoIGNvbXBpbGVkIHx8IGNvbXBpbGUoIHNlbGVjdG9yLCBtYXRjaCApICkoXG5cdFx0c2VlZCxcblx0XHRjb250ZXh0LFxuXHRcdCFkb2N1bWVudElzSFRNTCxcblx0XHRyZXN1bHRzLFxuXHRcdCFjb250ZXh0IHx8IHJzaWJsaW5nLnRlc3QoIHNlbGVjdG9yICkgJiYgdGVzdENvbnRleHQoIGNvbnRleHQucGFyZW50Tm9kZSApIHx8IGNvbnRleHRcblx0KTtcblx0cmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIE9uZS10aW1lIGFzc2lnbm1lbnRzXG5cbi8vIFN1cHBvcnQ6IEFuZHJvaWQgPD00LjAgLSA0LjErXG4vLyBTb3J0IHN0YWJpbGl0eVxuc3VwcG9ydC5zb3J0U3RhYmxlID0gZXhwYW5kby5zcGxpdCggXCJcIiApLnNvcnQoIHNvcnRPcmRlciApLmpvaW4oIFwiXCIgKSA9PT0gZXhwYW5kbztcblxuLy8gSW5pdGlhbGl6ZSBhZ2FpbnN0IHRoZSBkZWZhdWx0IGRvY3VtZW50XG5zZXREb2N1bWVudCgpO1xuXG4vLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4wIC0gNC4xK1xuLy8gRGV0YWNoZWQgbm9kZXMgY29uZm91bmRpbmdseSBmb2xsb3cgKmVhY2ggb3RoZXIqXG5zdXBwb3J0LnNvcnREZXRhY2hlZCA9IGFzc2VydCggZnVuY3Rpb24oIGVsICkge1xuXG5cdC8vIFNob3VsZCByZXR1cm4gMSwgYnV0IHJldHVybnMgNCAoZm9sbG93aW5nKVxuXHRyZXR1cm4gZWwuY29tcGFyZURvY3VtZW50UG9zaXRpb24oIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiZmllbGRzZXRcIiApICkgJiAxO1xufSApO1xuXG5qUXVlcnkuZmluZCA9IGZpbmQ7XG5cbi8vIERlcHJlY2F0ZWRcbmpRdWVyeS5leHByWyBcIjpcIiBdID0galF1ZXJ5LmV4cHIucHNldWRvcztcbmpRdWVyeS51bmlxdWUgPSBqUXVlcnkudW5pcXVlU29ydDtcblxuLy8gVGhlc2UgaGF2ZSBhbHdheXMgYmVlbiBwcml2YXRlLCBidXQgdGhleSB1c2VkIHRvIGJlIGRvY3VtZW50ZWQgYXMgcGFydCBvZlxuLy8gU2l6emxlIHNvIGxldCdzIG1haW50YWluIHRoZW0gZm9yIG5vdyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgcHVycG9zZXMuXG5maW5kLmNvbXBpbGUgPSBjb21waWxlO1xuZmluZC5zZWxlY3QgPSBzZWxlY3Q7XG5maW5kLnNldERvY3VtZW50ID0gc2V0RG9jdW1lbnQ7XG5maW5kLnRva2VuaXplID0gdG9rZW5pemU7XG5cbmZpbmQuZXNjYXBlID0galF1ZXJ5LmVzY2FwZVNlbGVjdG9yO1xuZmluZC5nZXRUZXh0ID0galF1ZXJ5LnRleHQ7XG5maW5kLmlzWE1MID0galF1ZXJ5LmlzWE1MRG9jO1xuZmluZC5zZWxlY3RvcnMgPSBqUXVlcnkuZXhwcjtcbmZpbmQuc3VwcG9ydCA9IGpRdWVyeS5zdXBwb3J0O1xuZmluZC51bmlxdWVTb3J0ID0galF1ZXJ5LnVuaXF1ZVNvcnQ7XG5cblx0LyogZXNsaW50LWVuYWJsZSAqL1xuXG59ICkoKTtcblxuXG52YXIgZGlyID0gZnVuY3Rpb24oIGVsZW0sIGRpciwgdW50aWwgKSB7XG5cdHZhciBtYXRjaGVkID0gW10sXG5cdFx0dHJ1bmNhdGUgPSB1bnRpbCAhPT0gdW5kZWZpbmVkO1xuXG5cdHdoaWxlICggKCBlbGVtID0gZWxlbVsgZGlyIF0gKSAmJiBlbGVtLm5vZGVUeXBlICE9PSA5ICkge1xuXHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdGlmICggdHJ1bmNhdGUgJiYgalF1ZXJ5KCBlbGVtICkuaXMoIHVudGlsICkgKSB7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0bWF0Y2hlZC5wdXNoKCBlbGVtICk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtYXRjaGVkO1xufTtcblxuXG52YXIgc2libGluZ3MgPSBmdW5jdGlvbiggbiwgZWxlbSApIHtcblx0dmFyIG1hdGNoZWQgPSBbXTtcblxuXHRmb3IgKCA7IG47IG4gPSBuLm5leHRTaWJsaW5nICkge1xuXHRcdGlmICggbi5ub2RlVHlwZSA9PT0gMSAmJiBuICE9PSBlbGVtICkge1xuXHRcdFx0bWF0Y2hlZC5wdXNoKCBuICk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG1hdGNoZWQ7XG59O1xuXG5cbnZhciBybmVlZHNDb250ZXh0ID0galF1ZXJ5LmV4cHIubWF0Y2gubmVlZHNDb250ZXh0O1xuXG52YXIgcnNpbmdsZVRhZyA9ICggL148KFthLXpdW15cXC9cXDA+OlxceDIwXFx0XFxyXFxuXFxmXSopW1xceDIwXFx0XFxyXFxuXFxmXSpcXC8/Pig/OjxcXC9cXDE+fCkkL2kgKTtcblxuXG5cbi8vIEltcGxlbWVudCB0aGUgaWRlbnRpY2FsIGZ1bmN0aW9uYWxpdHkgZm9yIGZpbHRlciBhbmQgbm90XG5mdW5jdGlvbiB3aW5ub3coIGVsZW1lbnRzLCBxdWFsaWZpZXIsIG5vdCApIHtcblx0aWYgKCBpc0Z1bmN0aW9uKCBxdWFsaWZpZXIgKSApIHtcblx0XHRyZXR1cm4galF1ZXJ5LmdyZXAoIGVsZW1lbnRzLCBmdW5jdGlvbiggZWxlbSwgaSApIHtcblx0XHRcdHJldHVybiAhIXF1YWxpZmllci5jYWxsKCBlbGVtLCBpLCBlbGVtICkgIT09IG5vdDtcblx0XHR9ICk7XG5cdH1cblxuXHQvLyBTaW5nbGUgZWxlbWVudFxuXHRpZiAoIHF1YWxpZmllci5ub2RlVHlwZSApIHtcblx0XHRyZXR1cm4galF1ZXJ5LmdyZXAoIGVsZW1lbnRzLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiAoIGVsZW0gPT09IHF1YWxpZmllciApICE9PSBub3Q7XG5cdFx0fSApO1xuXHR9XG5cblx0Ly8gQXJyYXlsaWtlIG9mIGVsZW1lbnRzIChqUXVlcnksIGFyZ3VtZW50cywgQXJyYXkpXG5cdGlmICggdHlwZW9mIHF1YWxpZmllciAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRyZXR1cm4galF1ZXJ5LmdyZXAoIGVsZW1lbnRzLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiAoIGluZGV4T2YuY2FsbCggcXVhbGlmaWVyLCBlbGVtICkgPiAtMSApICE9PSBub3Q7XG5cdFx0fSApO1xuXHR9XG5cblx0Ly8gRmlsdGVyZWQgZGlyZWN0bHkgZm9yIGJvdGggc2ltcGxlIGFuZCBjb21wbGV4IHNlbGVjdG9yc1xuXHRyZXR1cm4galF1ZXJ5LmZpbHRlciggcXVhbGlmaWVyLCBlbGVtZW50cywgbm90ICk7XG59XG5cbmpRdWVyeS5maWx0ZXIgPSBmdW5jdGlvbiggZXhwciwgZWxlbXMsIG5vdCApIHtcblx0dmFyIGVsZW0gPSBlbGVtc1sgMCBdO1xuXG5cdGlmICggbm90ICkge1xuXHRcdGV4cHIgPSBcIjpub3QoXCIgKyBleHByICsgXCIpXCI7XG5cdH1cblxuXHRpZiAoIGVsZW1zLmxlbmd0aCA9PT0gMSAmJiBlbGVtLm5vZGVUeXBlID09PSAxICkge1xuXHRcdHJldHVybiBqUXVlcnkuZmluZC5tYXRjaGVzU2VsZWN0b3IoIGVsZW0sIGV4cHIgKSA/IFsgZWxlbSBdIDogW107XG5cdH1cblxuXHRyZXR1cm4galF1ZXJ5LmZpbmQubWF0Y2hlcyggZXhwciwgalF1ZXJ5LmdyZXAoIGVsZW1zLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRyZXR1cm4gZWxlbS5ub2RlVHlwZSA9PT0gMTtcblx0fSApICk7XG59O1xuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdGZpbmQ6IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHR2YXIgaSwgcmV0LFxuXHRcdFx0bGVuID0gdGhpcy5sZW5ndGgsXG5cdFx0XHRzZWxmID0gdGhpcztcblxuXHRcdGlmICggdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiICkge1xuXHRcdFx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKCBqUXVlcnkoIHNlbGVjdG9yICkuZmlsdGVyKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0Zm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0XHRpZiAoIGpRdWVyeS5jb250YWlucyggc2VsZlsgaSBdLCB0aGlzICkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gKSApO1xuXHRcdH1cblxuXHRcdHJldCA9IHRoaXMucHVzaFN0YWNrKCBbXSApO1xuXG5cdFx0Zm9yICggaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdGpRdWVyeS5maW5kKCBzZWxlY3Rvciwgc2VsZlsgaSBdLCByZXQgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbGVuID4gMSA/IGpRdWVyeS51bmlxdWVTb3J0KCByZXQgKSA6IHJldDtcblx0fSxcblx0ZmlsdGVyOiBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKCB3aW5ub3coIHRoaXMsIHNlbGVjdG9yIHx8IFtdLCBmYWxzZSApICk7XG5cdH0sXG5cdG5vdDogZnVuY3Rpb24oIHNlbGVjdG9yICkge1xuXHRcdHJldHVybiB0aGlzLnB1c2hTdGFjayggd2lubm93KCB0aGlzLCBzZWxlY3RvciB8fCBbXSwgdHJ1ZSApICk7XG5cdH0sXG5cdGlzOiBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0cmV0dXJuICEhd2lubm93KFxuXHRcdFx0dGhpcyxcblxuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIHBvc2l0aW9uYWwvcmVsYXRpdmUgc2VsZWN0b3IsIGNoZWNrIG1lbWJlcnNoaXAgaW4gdGhlIHJldHVybmVkIHNldFxuXHRcdFx0Ly8gc28gJChcInA6Zmlyc3RcIikuaXMoXCJwOmxhc3RcIikgd29uJ3QgcmV0dXJuIHRydWUgZm9yIGEgZG9jIHdpdGggdHdvIFwicFwiLlxuXHRcdFx0dHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiICYmIHJuZWVkc0NvbnRleHQudGVzdCggc2VsZWN0b3IgKSA/XG5cdFx0XHRcdGpRdWVyeSggc2VsZWN0b3IgKSA6XG5cdFx0XHRcdHNlbGVjdG9yIHx8IFtdLFxuXHRcdFx0ZmFsc2Vcblx0XHQpLmxlbmd0aDtcblx0fVxufSApO1xuXG5cbi8vIEluaXRpYWxpemUgYSBqUXVlcnkgb2JqZWN0XG5cblxuLy8gQSBjZW50cmFsIHJlZmVyZW5jZSB0byB0aGUgcm9vdCBqUXVlcnkoZG9jdW1lbnQpXG52YXIgcm9vdGpRdWVyeSxcblxuXHQvLyBBIHNpbXBsZSB3YXkgdG8gY2hlY2sgZm9yIEhUTUwgc3RyaW5nc1xuXHQvLyBQcmlvcml0aXplICNpZCBvdmVyIDx0YWc+IHRvIGF2b2lkIFhTUyB2aWEgbG9jYXRpb24uaGFzaCAodHJhYy05NTIxKVxuXHQvLyBTdHJpY3QgSFRNTCByZWNvZ25pdGlvbiAodHJhYy0xMTI5MDogbXVzdCBzdGFydCB3aXRoIDwpXG5cdC8vIFNob3J0Y3V0IHNpbXBsZSAjaWQgY2FzZSBmb3Igc3BlZWRcblx0cnF1aWNrRXhwciA9IC9eKD86XFxzKig8W1xcd1xcV10rPilbXj5dKnwjKFtcXHctXSspKSQvLFxuXG5cdGluaXQgPSBqUXVlcnkuZm4uaW5pdCA9IGZ1bmN0aW9uKCBzZWxlY3RvciwgY29udGV4dCwgcm9vdCApIHtcblx0XHR2YXIgbWF0Y2gsIGVsZW07XG5cblx0XHQvLyBIQU5ETEU6ICQoXCJcIiksICQobnVsbCksICQodW5kZWZpbmVkKSwgJChmYWxzZSlcblx0XHRpZiAoICFzZWxlY3RvciApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdC8vIE1ldGhvZCBpbml0KCkgYWNjZXB0cyBhbiBhbHRlcm5hdGUgcm9vdGpRdWVyeVxuXHRcdC8vIHNvIG1pZ3JhdGUgY2FuIHN1cHBvcnQgalF1ZXJ5LnN1YiAoZ2gtMjEwMSlcblx0XHRyb290ID0gcm9vdCB8fCByb290alF1ZXJ5O1xuXG5cdFx0Ly8gSGFuZGxlIEhUTUwgc3RyaW5nc1xuXHRcdGlmICggdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0aWYgKCBzZWxlY3RvclsgMCBdID09PSBcIjxcIiAmJlxuXHRcdFx0XHRzZWxlY3Rvclsgc2VsZWN0b3IubGVuZ3RoIC0gMSBdID09PSBcIj5cIiAmJlxuXHRcdFx0XHRzZWxlY3Rvci5sZW5ndGggPj0gMyApIHtcblxuXHRcdFx0XHQvLyBBc3N1bWUgdGhhdCBzdHJpbmdzIHRoYXQgc3RhcnQgYW5kIGVuZCB3aXRoIDw+IGFyZSBIVE1MIGFuZCBza2lwIHRoZSByZWdleCBjaGVja1xuXHRcdFx0XHRtYXRjaCA9IFsgbnVsbCwgc2VsZWN0b3IsIG51bGwgXTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bWF0Y2ggPSBycXVpY2tFeHByLmV4ZWMoIHNlbGVjdG9yICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE1hdGNoIGh0bWwgb3IgbWFrZSBzdXJlIG5vIGNvbnRleHQgaXMgc3BlY2lmaWVkIGZvciAjaWRcblx0XHRcdGlmICggbWF0Y2ggJiYgKCBtYXRjaFsgMSBdIHx8ICFjb250ZXh0ICkgKSB7XG5cblx0XHRcdFx0Ly8gSEFORExFOiAkKGh0bWwpIC0+ICQoYXJyYXkpXG5cdFx0XHRcdGlmICggbWF0Y2hbIDEgXSApIHtcblx0XHRcdFx0XHRjb250ZXh0ID0gY29udGV4dCBpbnN0YW5jZW9mIGpRdWVyeSA/IGNvbnRleHRbIDAgXSA6IGNvbnRleHQ7XG5cblx0XHRcdFx0XHQvLyBPcHRpb24gdG8gcnVuIHNjcmlwdHMgaXMgdHJ1ZSBmb3IgYmFjay1jb21wYXRcblx0XHRcdFx0XHQvLyBJbnRlbnRpb25hbGx5IGxldCB0aGUgZXJyb3IgYmUgdGhyb3duIGlmIHBhcnNlSFRNTCBpcyBub3QgcHJlc2VudFxuXHRcdFx0XHRcdGpRdWVyeS5tZXJnZSggdGhpcywgalF1ZXJ5LnBhcnNlSFRNTChcblx0XHRcdFx0XHRcdG1hdGNoWyAxIF0sXG5cdFx0XHRcdFx0XHRjb250ZXh0ICYmIGNvbnRleHQubm9kZVR5cGUgPyBjb250ZXh0Lm93bmVyRG9jdW1lbnQgfHwgY29udGV4dCA6IGRvY3VtZW50LFxuXHRcdFx0XHRcdFx0dHJ1ZVxuXHRcdFx0XHRcdCkgKTtcblxuXHRcdFx0XHRcdC8vIEhBTkRMRTogJChodG1sLCBwcm9wcylcblx0XHRcdFx0XHRpZiAoIHJzaW5nbGVUYWcudGVzdCggbWF0Y2hbIDEgXSApICYmIGpRdWVyeS5pc1BsYWluT2JqZWN0KCBjb250ZXh0ICkgKSB7XG5cdFx0XHRcdFx0XHRmb3IgKCBtYXRjaCBpbiBjb250ZXh0ICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFByb3BlcnRpZXMgb2YgY29udGV4dCBhcmUgY2FsbGVkIGFzIG1ldGhvZHMgaWYgcG9zc2libGVcblx0XHRcdFx0XHRcdFx0aWYgKCBpc0Z1bmN0aW9uKCB0aGlzWyBtYXRjaCBdICkgKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpc1sgbWF0Y2ggXSggY29udGV4dFsgbWF0Y2ggXSApO1xuXG5cdFx0XHRcdFx0XHRcdC8vIC4uLmFuZCBvdGhlcndpc2Ugc2V0IGFzIGF0dHJpYnV0ZXNcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmF0dHIoIG1hdGNoLCBjb250ZXh0WyBtYXRjaCBdICk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdFx0XHQvLyBIQU5ETEU6ICQoI2lkKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggbWF0Y2hbIDIgXSApO1xuXG5cdFx0XHRcdFx0aWYgKCBlbGVtICkge1xuXG5cdFx0XHRcdFx0XHQvLyBJbmplY3QgdGhlIGVsZW1lbnQgZGlyZWN0bHkgaW50byB0aGUgalF1ZXJ5IG9iamVjdFxuXHRcdFx0XHRcdFx0dGhpc1sgMCBdID0gZWxlbTtcblx0XHRcdFx0XHRcdHRoaXMubGVuZ3RoID0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gSEFORExFOiAkKGV4cHIsICQoLi4uKSlcblx0XHRcdH0gZWxzZSBpZiAoICFjb250ZXh0IHx8IGNvbnRleHQuanF1ZXJ5ICkge1xuXHRcdFx0XHRyZXR1cm4gKCBjb250ZXh0IHx8IHJvb3QgKS5maW5kKCBzZWxlY3RvciApO1xuXG5cdFx0XHQvLyBIQU5ETEU6ICQoZXhwciwgY29udGV4dClcblx0XHRcdC8vICh3aGljaCBpcyBqdXN0IGVxdWl2YWxlbnQgdG86ICQoY29udGV4dCkuZmluZChleHByKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoIGNvbnRleHQgKS5maW5kKCBzZWxlY3RvciApO1xuXHRcdFx0fVxuXG5cdFx0Ly8gSEFORExFOiAkKERPTUVsZW1lbnQpXG5cdFx0fSBlbHNlIGlmICggc2VsZWN0b3Iubm9kZVR5cGUgKSB7XG5cdFx0XHR0aGlzWyAwIF0gPSBzZWxlY3Rvcjtcblx0XHRcdHRoaXMubGVuZ3RoID0gMTtcblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0Ly8gSEFORExFOiAkKGZ1bmN0aW9uKVxuXHRcdC8vIFNob3J0Y3V0IGZvciBkb2N1bWVudCByZWFkeVxuXHRcdH0gZWxzZSBpZiAoIGlzRnVuY3Rpb24oIHNlbGVjdG9yICkgKSB7XG5cdFx0XHRyZXR1cm4gcm9vdC5yZWFkeSAhPT0gdW5kZWZpbmVkID9cblx0XHRcdFx0cm9vdC5yZWFkeSggc2VsZWN0b3IgKSA6XG5cblx0XHRcdFx0Ly8gRXhlY3V0ZSBpbW1lZGlhdGVseSBpZiByZWFkeSBpcyBub3QgcHJlc2VudFxuXHRcdFx0XHRzZWxlY3RvciggalF1ZXJ5ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGpRdWVyeS5tYWtlQXJyYXkoIHNlbGVjdG9yLCB0aGlzICk7XG5cdH07XG5cbi8vIEdpdmUgdGhlIGluaXQgZnVuY3Rpb24gdGhlIGpRdWVyeSBwcm90b3R5cGUgZm9yIGxhdGVyIGluc3RhbnRpYXRpb25cbmluaXQucHJvdG90eXBlID0galF1ZXJ5LmZuO1xuXG4vLyBJbml0aWFsaXplIGNlbnRyYWwgcmVmZXJlbmNlXG5yb290alF1ZXJ5ID0galF1ZXJ5KCBkb2N1bWVudCApO1xuXG5cbnZhciBycGFyZW50c3ByZXYgPSAvXig/OnBhcmVudHN8cHJldig/OlVudGlsfEFsbCkpLyxcblxuXHQvLyBNZXRob2RzIGd1YXJhbnRlZWQgdG8gcHJvZHVjZSBhIHVuaXF1ZSBzZXQgd2hlbiBzdGFydGluZyBmcm9tIGEgdW5pcXVlIHNldFxuXHRndWFyYW50ZWVkVW5pcXVlID0ge1xuXHRcdGNoaWxkcmVuOiB0cnVlLFxuXHRcdGNvbnRlbnRzOiB0cnVlLFxuXHRcdG5leHQ6IHRydWUsXG5cdFx0cHJldjogdHJ1ZVxuXHR9O1xuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdGhhczogZnVuY3Rpb24oIHRhcmdldCApIHtcblx0XHR2YXIgdGFyZ2V0cyA9IGpRdWVyeSggdGFyZ2V0LCB0aGlzICksXG5cdFx0XHRsID0gdGFyZ2V0cy5sZW5ndGg7XG5cblx0XHRyZXR1cm4gdGhpcy5maWx0ZXIoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGkgPSAwO1xuXHRcdFx0Zm9yICggOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRpZiAoIGpRdWVyeS5jb250YWlucyggdGhpcywgdGFyZ2V0c1sgaSBdICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblx0Y2xvc2VzdDogZnVuY3Rpb24oIHNlbGVjdG9ycywgY29udGV4dCApIHtcblx0XHR2YXIgY3VyLFxuXHRcdFx0aSA9IDAsXG5cdFx0XHRsID0gdGhpcy5sZW5ndGgsXG5cdFx0XHRtYXRjaGVkID0gW10sXG5cdFx0XHR0YXJnZXRzID0gdHlwZW9mIHNlbGVjdG9ycyAhPT0gXCJzdHJpbmdcIiAmJiBqUXVlcnkoIHNlbGVjdG9ycyApO1xuXG5cdFx0Ly8gUG9zaXRpb25hbCBzZWxlY3RvcnMgbmV2ZXIgbWF0Y2gsIHNpbmNlIHRoZXJlJ3Mgbm8gX3NlbGVjdGlvbl8gY29udGV4dFxuXHRcdGlmICggIXJuZWVkc0NvbnRleHQudGVzdCggc2VsZWN0b3JzICkgKSB7XG5cdFx0XHRmb3IgKCA7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdGZvciAoIGN1ciA9IHRoaXNbIGkgXTsgY3VyICYmIGN1ciAhPT0gY29udGV4dDsgY3VyID0gY3VyLnBhcmVudE5vZGUgKSB7XG5cblx0XHRcdFx0XHQvLyBBbHdheXMgc2tpcCBkb2N1bWVudCBmcmFnbWVudHNcblx0XHRcdFx0XHRpZiAoIGN1ci5ub2RlVHlwZSA8IDExICYmICggdGFyZ2V0cyA/XG5cdFx0XHRcdFx0XHR0YXJnZXRzLmluZGV4KCBjdXIgKSA+IC0xIDpcblxuXHRcdFx0XHRcdFx0Ly8gRG9uJ3QgcGFzcyBub24tZWxlbWVudHMgdG8galF1ZXJ5I2ZpbmRcblx0XHRcdFx0XHRcdGN1ci5ub2RlVHlwZSA9PT0gMSAmJlxuXHRcdFx0XHRcdFx0XHRqUXVlcnkuZmluZC5tYXRjaGVzU2VsZWN0b3IoIGN1ciwgc2VsZWN0b3JzICkgKSApIHtcblxuXHRcdFx0XHRcdFx0bWF0Y2hlZC5wdXNoKCBjdXIgKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnB1c2hTdGFjayggbWF0Y2hlZC5sZW5ndGggPiAxID8galF1ZXJ5LnVuaXF1ZVNvcnQoIG1hdGNoZWQgKSA6IG1hdGNoZWQgKTtcblx0fSxcblxuXHQvLyBEZXRlcm1pbmUgdGhlIHBvc2l0aW9uIG9mIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBzZXRcblx0aW5kZXg6IGZ1bmN0aW9uKCBlbGVtICkge1xuXG5cdFx0Ly8gTm8gYXJndW1lbnQsIHJldHVybiBpbmRleCBpbiBwYXJlbnRcblx0XHRpZiAoICFlbGVtICkge1xuXHRcdFx0cmV0dXJuICggdGhpc1sgMCBdICYmIHRoaXNbIDAgXS5wYXJlbnROb2RlICkgPyB0aGlzLmZpcnN0KCkucHJldkFsbCgpLmxlbmd0aCA6IC0xO1xuXHRcdH1cblxuXHRcdC8vIEluZGV4IGluIHNlbGVjdG9yXG5cdFx0aWYgKCB0eXBlb2YgZWxlbSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdHJldHVybiBpbmRleE9mLmNhbGwoIGpRdWVyeSggZWxlbSApLCB0aGlzWyAwIF0gKTtcblx0XHR9XG5cblx0XHQvLyBMb2NhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBkZXNpcmVkIGVsZW1lbnRcblx0XHRyZXR1cm4gaW5kZXhPZi5jYWxsKCB0aGlzLFxuXG5cdFx0XHQvLyBJZiBpdCByZWNlaXZlcyBhIGpRdWVyeSBvYmplY3QsIHRoZSBmaXJzdCBlbGVtZW50IGlzIHVzZWRcblx0XHRcdGVsZW0uanF1ZXJ5ID8gZWxlbVsgMCBdIDogZWxlbVxuXHRcdCk7XG5cdH0sXG5cblx0YWRkOiBmdW5jdGlvbiggc2VsZWN0b3IsIGNvbnRleHQgKSB7XG5cdFx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKFxuXHRcdFx0alF1ZXJ5LnVuaXF1ZVNvcnQoXG5cdFx0XHRcdGpRdWVyeS5tZXJnZSggdGhpcy5nZXQoKSwgalF1ZXJ5KCBzZWxlY3RvciwgY29udGV4dCApIClcblx0XHRcdClcblx0XHQpO1xuXHR9LFxuXG5cdGFkZEJhY2s6IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHRyZXR1cm4gdGhpcy5hZGQoIHNlbGVjdG9yID09IG51bGwgP1xuXHRcdFx0dGhpcy5wcmV2T2JqZWN0IDogdGhpcy5wcmV2T2JqZWN0LmZpbHRlciggc2VsZWN0b3IgKVxuXHRcdCk7XG5cdH1cbn0gKTtcblxuZnVuY3Rpb24gc2libGluZyggY3VyLCBkaXIgKSB7XG5cdHdoaWxlICggKCBjdXIgPSBjdXJbIGRpciBdICkgJiYgY3VyLm5vZGVUeXBlICE9PSAxICkge31cblx0cmV0dXJuIGN1cjtcbn1cblxualF1ZXJ5LmVhY2goIHtcblx0cGFyZW50OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHR2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xuXHRcdHJldHVybiBwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlICE9PSAxMSA/IHBhcmVudCA6IG51bGw7XG5cdH0sXG5cdHBhcmVudHM6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdHJldHVybiBkaXIoIGVsZW0sIFwicGFyZW50Tm9kZVwiICk7XG5cdH0sXG5cdHBhcmVudHNVbnRpbDogZnVuY3Rpb24oIGVsZW0sIF9pLCB1bnRpbCApIHtcblx0XHRyZXR1cm4gZGlyKCBlbGVtLCBcInBhcmVudE5vZGVcIiwgdW50aWwgKTtcblx0fSxcblx0bmV4dDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0cmV0dXJuIHNpYmxpbmcoIGVsZW0sIFwibmV4dFNpYmxpbmdcIiApO1xuXHR9LFxuXHRwcmV2OiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRyZXR1cm4gc2libGluZyggZWxlbSwgXCJwcmV2aW91c1NpYmxpbmdcIiApO1xuXHR9LFxuXHRuZXh0QWxsOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRyZXR1cm4gZGlyKCBlbGVtLCBcIm5leHRTaWJsaW5nXCIgKTtcblx0fSxcblx0cHJldkFsbDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0cmV0dXJuIGRpciggZWxlbSwgXCJwcmV2aW91c1NpYmxpbmdcIiApO1xuXHR9LFxuXHRuZXh0VW50aWw6IGZ1bmN0aW9uKCBlbGVtLCBfaSwgdW50aWwgKSB7XG5cdFx0cmV0dXJuIGRpciggZWxlbSwgXCJuZXh0U2libGluZ1wiLCB1bnRpbCApO1xuXHR9LFxuXHRwcmV2VW50aWw6IGZ1bmN0aW9uKCBlbGVtLCBfaSwgdW50aWwgKSB7XG5cdFx0cmV0dXJuIGRpciggZWxlbSwgXCJwcmV2aW91c1NpYmxpbmdcIiwgdW50aWwgKTtcblx0fSxcblx0c2libGluZ3M6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdHJldHVybiBzaWJsaW5ncyggKCBlbGVtLnBhcmVudE5vZGUgfHwge30gKS5maXJzdENoaWxkLCBlbGVtICk7XG5cdH0sXG5cdGNoaWxkcmVuOiBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRyZXR1cm4gc2libGluZ3MoIGVsZW0uZmlyc3RDaGlsZCApO1xuXHR9LFxuXHRjb250ZW50czogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0aWYgKCBlbGVtLmNvbnRlbnREb2N1bWVudCAhPSBudWxsICYmXG5cblx0XHRcdC8vIFN1cHBvcnQ6IElFIDExK1xuXHRcdFx0Ly8gPG9iamVjdD4gZWxlbWVudHMgd2l0aCBubyBgZGF0YWAgYXR0cmlidXRlIGhhcyBhbiBvYmplY3Rcblx0XHRcdC8vIGBjb250ZW50RG9jdW1lbnRgIHdpdGggYSBgbnVsbGAgcHJvdG90eXBlLlxuXHRcdFx0Z2V0UHJvdG8oIGVsZW0uY29udGVudERvY3VtZW50ICkgKSB7XG5cblx0XHRcdHJldHVybiBlbGVtLmNvbnRlbnREb2N1bWVudDtcblx0XHR9XG5cblx0XHQvLyBTdXBwb3J0OiBJRSA5IC0gMTEgb25seSwgaU9TIDcgb25seSwgQW5kcm9pZCBCcm93c2VyIDw9NC4zIG9ubHlcblx0XHQvLyBUcmVhdCB0aGUgdGVtcGxhdGUgZWxlbWVudCBhcyBhIHJlZ3VsYXIgb25lIGluIGJyb3dzZXJzIHRoYXRcblx0XHQvLyBkb24ndCBzdXBwb3J0IGl0LlxuXHRcdGlmICggbm9kZU5hbWUoIGVsZW0sIFwidGVtcGxhdGVcIiApICkge1xuXHRcdFx0ZWxlbSA9IGVsZW0uY29udGVudCB8fCBlbGVtO1xuXHRcdH1cblxuXHRcdHJldHVybiBqUXVlcnkubWVyZ2UoIFtdLCBlbGVtLmNoaWxkTm9kZXMgKTtcblx0fVxufSwgZnVuY3Rpb24oIG5hbWUsIGZuICkge1xuXHRqUXVlcnkuZm5bIG5hbWUgXSA9IGZ1bmN0aW9uKCB1bnRpbCwgc2VsZWN0b3IgKSB7XG5cdFx0dmFyIG1hdGNoZWQgPSBqUXVlcnkubWFwKCB0aGlzLCBmbiwgdW50aWwgKTtcblxuXHRcdGlmICggbmFtZS5zbGljZSggLTUgKSAhPT0gXCJVbnRpbFwiICkge1xuXHRcdFx0c2VsZWN0b3IgPSB1bnRpbDtcblx0XHR9XG5cblx0XHRpZiAoIHNlbGVjdG9yICYmIHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdG1hdGNoZWQgPSBqUXVlcnkuZmlsdGVyKCBzZWxlY3RvciwgbWF0Y2hlZCApO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5sZW5ndGggPiAxICkge1xuXG5cdFx0XHQvLyBSZW1vdmUgZHVwbGljYXRlc1xuXHRcdFx0aWYgKCAhZ3VhcmFudGVlZFVuaXF1ZVsgbmFtZSBdICkge1xuXHRcdFx0XHRqUXVlcnkudW5pcXVlU29ydCggbWF0Y2hlZCApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZXZlcnNlIG9yZGVyIGZvciBwYXJlbnRzKiBhbmQgcHJldi1kZXJpdmF0aXZlc1xuXHRcdFx0aWYgKCBycGFyZW50c3ByZXYudGVzdCggbmFtZSApICkge1xuXHRcdFx0XHRtYXRjaGVkLnJldmVyc2UoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5wdXNoU3RhY2soIG1hdGNoZWQgKTtcblx0fTtcbn0gKTtcbnZhciBybm90aHRtbHdoaXRlID0gKCAvW15cXHgyMFxcdFxcclxcblxcZl0rL2cgKTtcblxuXG5cbi8vIENvbnZlcnQgU3RyaW5nLWZvcm1hdHRlZCBvcHRpb25zIGludG8gT2JqZWN0LWZvcm1hdHRlZCBvbmVzXG5mdW5jdGlvbiBjcmVhdGVPcHRpb25zKCBvcHRpb25zICkge1xuXHR2YXIgb2JqZWN0ID0ge307XG5cdGpRdWVyeS5lYWNoKCBvcHRpb25zLm1hdGNoKCBybm90aHRtbHdoaXRlICkgfHwgW10sIGZ1bmN0aW9uKCBfLCBmbGFnICkge1xuXHRcdG9iamVjdFsgZmxhZyBdID0gdHJ1ZTtcblx0fSApO1xuXHRyZXR1cm4gb2JqZWN0O1xufVxuXG4vKlxuICogQ3JlYXRlIGEgY2FsbGJhY2sgbGlzdCB1c2luZyB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gKlxuICpcdG9wdGlvbnM6IGFuIG9wdGlvbmFsIGxpc3Qgb2Ygc3BhY2Utc2VwYXJhdGVkIG9wdGlvbnMgdGhhdCB3aWxsIGNoYW5nZSBob3dcbiAqXHRcdFx0dGhlIGNhbGxiYWNrIGxpc3QgYmVoYXZlcyBvciBhIG1vcmUgdHJhZGl0aW9uYWwgb3B0aW9uIG9iamVjdFxuICpcbiAqIEJ5IGRlZmF1bHQgYSBjYWxsYmFjayBsaXN0IHdpbGwgYWN0IGxpa2UgYW4gZXZlbnQgY2FsbGJhY2sgbGlzdCBhbmQgY2FuIGJlXG4gKiBcImZpcmVkXCIgbXVsdGlwbGUgdGltZXMuXG4gKlxuICogUG9zc2libGUgb3B0aW9uczpcbiAqXG4gKlx0b25jZTpcdFx0XHR3aWxsIGVuc3VyZSB0aGUgY2FsbGJhY2sgbGlzdCBjYW4gb25seSBiZSBmaXJlZCBvbmNlIChsaWtlIGEgRGVmZXJyZWQpXG4gKlxuICpcdG1lbW9yeTpcdFx0XHR3aWxsIGtlZXAgdHJhY2sgb2YgcHJldmlvdXMgdmFsdWVzIGFuZCB3aWxsIGNhbGwgYW55IGNhbGxiYWNrIGFkZGVkXG4gKlx0XHRcdFx0XHRhZnRlciB0aGUgbGlzdCBoYXMgYmVlbiBmaXJlZCByaWdodCBhd2F5IHdpdGggdGhlIGxhdGVzdCBcIm1lbW9yaXplZFwiXG4gKlx0XHRcdFx0XHR2YWx1ZXMgKGxpa2UgYSBEZWZlcnJlZClcbiAqXG4gKlx0dW5pcXVlOlx0XHRcdHdpbGwgZW5zdXJlIGEgY2FsbGJhY2sgY2FuIG9ubHkgYmUgYWRkZWQgb25jZSAobm8gZHVwbGljYXRlIGluIHRoZSBsaXN0KVxuICpcbiAqXHRzdG9wT25GYWxzZTpcdGludGVycnVwdCBjYWxsaW5ncyB3aGVuIGEgY2FsbGJhY2sgcmV0dXJucyBmYWxzZVxuICpcbiAqL1xualF1ZXJ5LkNhbGxiYWNrcyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXG5cdC8vIENvbnZlcnQgb3B0aW9ucyBmcm9tIFN0cmluZy1mb3JtYXR0ZWQgdG8gT2JqZWN0LWZvcm1hdHRlZCBpZiBuZWVkZWRcblx0Ly8gKHdlIGNoZWNrIGluIGNhY2hlIGZpcnN0KVxuXHRvcHRpb25zID0gdHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIgP1xuXHRcdGNyZWF0ZU9wdGlvbnMoIG9wdGlvbnMgKSA6XG5cdFx0alF1ZXJ5LmV4dGVuZCgge30sIG9wdGlvbnMgKTtcblxuXHR2YXIgLy8gRmxhZyB0byBrbm93IGlmIGxpc3QgaXMgY3VycmVudGx5IGZpcmluZ1xuXHRcdGZpcmluZyxcblxuXHRcdC8vIExhc3QgZmlyZSB2YWx1ZSBmb3Igbm9uLWZvcmdldHRhYmxlIGxpc3RzXG5cdFx0bWVtb3J5LFxuXG5cdFx0Ly8gRmxhZyB0byBrbm93IGlmIGxpc3Qgd2FzIGFscmVhZHkgZmlyZWRcblx0XHRmaXJlZCxcblxuXHRcdC8vIEZsYWcgdG8gcHJldmVudCBmaXJpbmdcblx0XHRsb2NrZWQsXG5cblx0XHQvLyBBY3R1YWwgY2FsbGJhY2sgbGlzdFxuXHRcdGxpc3QgPSBbXSxcblxuXHRcdC8vIFF1ZXVlIG9mIGV4ZWN1dGlvbiBkYXRhIGZvciByZXBlYXRhYmxlIGxpc3RzXG5cdFx0cXVldWUgPSBbXSxcblxuXHRcdC8vIEluZGV4IG9mIGN1cnJlbnRseSBmaXJpbmcgY2FsbGJhY2sgKG1vZGlmaWVkIGJ5IGFkZC9yZW1vdmUgYXMgbmVlZGVkKVxuXHRcdGZpcmluZ0luZGV4ID0gLTEsXG5cblx0XHQvLyBGaXJlIGNhbGxiYWNrc1xuXHRcdGZpcmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gRW5mb3JjZSBzaW5nbGUtZmlyaW5nXG5cdFx0XHRsb2NrZWQgPSBsb2NrZWQgfHwgb3B0aW9ucy5vbmNlO1xuXG5cdFx0XHQvLyBFeGVjdXRlIGNhbGxiYWNrcyBmb3IgYWxsIHBlbmRpbmcgZXhlY3V0aW9ucyxcblx0XHRcdC8vIHJlc3BlY3RpbmcgZmlyaW5nSW5kZXggb3ZlcnJpZGVzIGFuZCBydW50aW1lIGNoYW5nZXNcblx0XHRcdGZpcmVkID0gZmlyaW5nID0gdHJ1ZTtcblx0XHRcdGZvciAoIDsgcXVldWUubGVuZ3RoOyBmaXJpbmdJbmRleCA9IC0xICkge1xuXHRcdFx0XHRtZW1vcnkgPSBxdWV1ZS5zaGlmdCgpO1xuXHRcdFx0XHR3aGlsZSAoICsrZmlyaW5nSW5kZXggPCBsaXN0Lmxlbmd0aCApIHtcblxuXHRcdFx0XHRcdC8vIFJ1biBjYWxsYmFjayBhbmQgY2hlY2sgZm9yIGVhcmx5IHRlcm1pbmF0aW9uXG5cdFx0XHRcdFx0aWYgKCBsaXN0WyBmaXJpbmdJbmRleCBdLmFwcGx5KCBtZW1vcnlbIDAgXSwgbWVtb3J5WyAxIF0gKSA9PT0gZmFsc2UgJiZcblx0XHRcdFx0XHRcdG9wdGlvbnMuc3RvcE9uRmFsc2UgKSB7XG5cblx0XHRcdFx0XHRcdC8vIEp1bXAgdG8gZW5kIGFuZCBmb3JnZXQgdGhlIGRhdGEgc28gLmFkZCBkb2Vzbid0IHJlLWZpcmVcblx0XHRcdFx0XHRcdGZpcmluZ0luZGV4ID0gbGlzdC5sZW5ndGg7XG5cdFx0XHRcdFx0XHRtZW1vcnkgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRm9yZ2V0IHRoZSBkYXRhIGlmIHdlJ3JlIGRvbmUgd2l0aCBpdFxuXHRcdFx0aWYgKCAhb3B0aW9ucy5tZW1vcnkgKSB7XG5cdFx0XHRcdG1lbW9yeSA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRmaXJpbmcgPSBmYWxzZTtcblxuXHRcdFx0Ly8gQ2xlYW4gdXAgaWYgd2UncmUgZG9uZSBmaXJpbmcgZm9yIGdvb2Rcblx0XHRcdGlmICggbG9ja2VkICkge1xuXG5cdFx0XHRcdC8vIEtlZXAgYW4gZW1wdHkgbGlzdCBpZiB3ZSBoYXZlIGRhdGEgZm9yIGZ1dHVyZSBhZGQgY2FsbHNcblx0XHRcdFx0aWYgKCBtZW1vcnkgKSB7XG5cdFx0XHRcdFx0bGlzdCA9IFtdO1xuXG5cdFx0XHRcdC8vIE90aGVyd2lzZSwgdGhpcyBvYmplY3QgaXMgc3BlbnRcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsaXN0ID0gXCJcIjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBBY3R1YWwgQ2FsbGJhY2tzIG9iamVjdFxuXHRcdHNlbGYgPSB7XG5cblx0XHRcdC8vIEFkZCBhIGNhbGxiYWNrIG9yIGEgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgdG8gdGhlIGxpc3Rcblx0XHRcdGFkZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggbGlzdCApIHtcblxuXHRcdFx0XHRcdC8vIElmIHdlIGhhdmUgbWVtb3J5IGZyb20gYSBwYXN0IHJ1biwgd2Ugc2hvdWxkIGZpcmUgYWZ0ZXIgYWRkaW5nXG5cdFx0XHRcdFx0aWYgKCBtZW1vcnkgJiYgIWZpcmluZyApIHtcblx0XHRcdFx0XHRcdGZpcmluZ0luZGV4ID0gbGlzdC5sZW5ndGggLSAxO1xuXHRcdFx0XHRcdFx0cXVldWUucHVzaCggbWVtb3J5ICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0KCBmdW5jdGlvbiBhZGQoIGFyZ3MgKSB7XG5cdFx0XHRcdFx0XHRqUXVlcnkuZWFjaCggYXJncywgZnVuY3Rpb24oIF8sIGFyZyApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCBpc0Z1bmN0aW9uKCBhcmcgKSApIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoICFvcHRpb25zLnVuaXF1ZSB8fCAhc2VsZi5oYXMoIGFyZyApICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0bGlzdC5wdXNoKCBhcmcgKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoIGFyZyAmJiBhcmcubGVuZ3RoICYmIHRvVHlwZSggYXJnICkgIT09IFwic3RyaW5nXCIgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBJbnNwZWN0IHJlY3Vyc2l2ZWx5XG5cdFx0XHRcdFx0XHRcdFx0YWRkKCBhcmcgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSApO1xuXHRcdFx0XHRcdH0gKSggYXJndW1lbnRzICk7XG5cblx0XHRcdFx0XHRpZiAoIG1lbW9yeSAmJiAhZmlyaW5nICkge1xuXHRcdFx0XHRcdFx0ZmlyZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdC8vIFJlbW92ZSBhIGNhbGxiYWNrIGZyb20gdGhlIGxpc3Rcblx0XHRcdHJlbW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGpRdWVyeS5lYWNoKCBhcmd1bWVudHMsIGZ1bmN0aW9uKCBfLCBhcmcgKSB7XG5cdFx0XHRcdFx0dmFyIGluZGV4O1xuXHRcdFx0XHRcdHdoaWxlICggKCBpbmRleCA9IGpRdWVyeS5pbkFycmF5KCBhcmcsIGxpc3QsIGluZGV4ICkgKSA+IC0xICkge1xuXHRcdFx0XHRcdFx0bGlzdC5zcGxpY2UoIGluZGV4LCAxICk7XG5cblx0XHRcdFx0XHRcdC8vIEhhbmRsZSBmaXJpbmcgaW5kZXhlc1xuXHRcdFx0XHRcdFx0aWYgKCBpbmRleCA8PSBmaXJpbmdJbmRleCApIHtcblx0XHRcdFx0XHRcdFx0ZmlyaW5nSW5kZXgtLTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBDaGVjayBpZiBhIGdpdmVuIGNhbGxiYWNrIGlzIGluIHRoZSBsaXN0LlxuXHRcdFx0Ly8gSWYgbm8gYXJndW1lbnQgaXMgZ2l2ZW4sIHJldHVybiB3aGV0aGVyIG9yIG5vdCBsaXN0IGhhcyBjYWxsYmFja3MgYXR0YWNoZWQuXG5cdFx0XHRoYXM6IGZ1bmN0aW9uKCBmbiApIHtcblx0XHRcdFx0cmV0dXJuIGZuID9cblx0XHRcdFx0XHRqUXVlcnkuaW5BcnJheSggZm4sIGxpc3QgKSA+IC0xIDpcblx0XHRcdFx0XHRsaXN0Lmxlbmd0aCA+IDA7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBSZW1vdmUgYWxsIGNhbGxiYWNrcyBmcm9tIHRoZSBsaXN0XG5cdFx0XHRlbXB0eTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggbGlzdCApIHtcblx0XHRcdFx0XHRsaXN0ID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBEaXNhYmxlIC5maXJlIGFuZCAuYWRkXG5cdFx0XHQvLyBBYm9ydCBhbnkgY3VycmVudC9wZW5kaW5nIGV4ZWN1dGlvbnNcblx0XHRcdC8vIENsZWFyIGFsbCBjYWxsYmFja3MgYW5kIHZhbHVlc1xuXHRcdFx0ZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxvY2tlZCA9IHF1ZXVlID0gW107XG5cdFx0XHRcdGxpc3QgPSBtZW1vcnkgPSBcIlwiO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cdFx0XHRkaXNhYmxlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAhbGlzdDtcblx0XHRcdH0sXG5cblx0XHRcdC8vIERpc2FibGUgLmZpcmVcblx0XHRcdC8vIEFsc28gZGlzYWJsZSAuYWRkIHVubGVzcyB3ZSBoYXZlIG1lbW9yeSAoc2luY2UgaXQgd291bGQgaGF2ZSBubyBlZmZlY3QpXG5cdFx0XHQvLyBBYm9ydCBhbnkgcGVuZGluZyBleGVjdXRpb25zXG5cdFx0XHRsb2NrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bG9ja2VkID0gcXVldWUgPSBbXTtcblx0XHRcdFx0aWYgKCAhbWVtb3J5ICYmICFmaXJpbmcgKSB7XG5cdFx0XHRcdFx0bGlzdCA9IG1lbW9yeSA9IFwiXCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9LFxuXHRcdFx0bG9ja2VkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICEhbG9ja2VkO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gQ2FsbCBhbGwgY2FsbGJhY2tzIHdpdGggdGhlIGdpdmVuIGNvbnRleHQgYW5kIGFyZ3VtZW50c1xuXHRcdFx0ZmlyZVdpdGg6IGZ1bmN0aW9uKCBjb250ZXh0LCBhcmdzICkge1xuXHRcdFx0XHRpZiAoICFsb2NrZWQgKSB7XG5cdFx0XHRcdFx0YXJncyA9IGFyZ3MgfHwgW107XG5cdFx0XHRcdFx0YXJncyA9IFsgY29udGV4dCwgYXJncy5zbGljZSA/IGFyZ3Muc2xpY2UoKSA6IGFyZ3MgXTtcblx0XHRcdFx0XHRxdWV1ZS5wdXNoKCBhcmdzICk7XG5cdFx0XHRcdFx0aWYgKCAhZmlyaW5nICkge1xuXHRcdFx0XHRcdFx0ZmlyZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdC8vIENhbGwgYWxsIHRoZSBjYWxsYmFja3Mgd2l0aCB0aGUgZ2l2ZW4gYXJndW1lbnRzXG5cdFx0XHRmaXJlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi5maXJlV2l0aCggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gVG8ga25vdyBpZiB0aGUgY2FsbGJhY2tzIGhhdmUgYWxyZWFkeSBiZWVuIGNhbGxlZCBhdCBsZWFzdCBvbmNlXG5cdFx0XHRmaXJlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAhIWZpcmVkO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0cmV0dXJuIHNlbGY7XG59O1xuXG5cbmZ1bmN0aW9uIElkZW50aXR5KCB2ICkge1xuXHRyZXR1cm4gdjtcbn1cbmZ1bmN0aW9uIFRocm93ZXIoIGV4ICkge1xuXHR0aHJvdyBleDtcbn1cblxuZnVuY3Rpb24gYWRvcHRWYWx1ZSggdmFsdWUsIHJlc29sdmUsIHJlamVjdCwgbm9WYWx1ZSApIHtcblx0dmFyIG1ldGhvZDtcblxuXHR0cnkge1xuXG5cdFx0Ly8gQ2hlY2sgZm9yIHByb21pc2UgYXNwZWN0IGZpcnN0IHRvIHByaXZpbGVnZSBzeW5jaHJvbm91cyBiZWhhdmlvclxuXHRcdGlmICggdmFsdWUgJiYgaXNGdW5jdGlvbiggKCBtZXRob2QgPSB2YWx1ZS5wcm9taXNlICkgKSApIHtcblx0XHRcdG1ldGhvZC5jYWxsKCB2YWx1ZSApLmRvbmUoIHJlc29sdmUgKS5mYWlsKCByZWplY3QgKTtcblxuXHRcdC8vIE90aGVyIHRoZW5hYmxlc1xuXHRcdH0gZWxzZSBpZiAoIHZhbHVlICYmIGlzRnVuY3Rpb24oICggbWV0aG9kID0gdmFsdWUudGhlbiApICkgKSB7XG5cdFx0XHRtZXRob2QuY2FsbCggdmFsdWUsIHJlc29sdmUsIHJlamVjdCApO1xuXG5cdFx0Ly8gT3RoZXIgbm9uLXRoZW5hYmxlc1xuXHRcdH0gZWxzZSB7XG5cblx0XHRcdC8vIENvbnRyb2wgYHJlc29sdmVgIGFyZ3VtZW50cyBieSBsZXR0aW5nIEFycmF5I3NsaWNlIGNhc3QgYm9vbGVhbiBgbm9WYWx1ZWAgdG8gaW50ZWdlcjpcblx0XHRcdC8vICogZmFsc2U6IFsgdmFsdWUgXS5zbGljZSggMCApID0+IHJlc29sdmUoIHZhbHVlIClcblx0XHRcdC8vICogdHJ1ZTogWyB2YWx1ZSBdLnNsaWNlKCAxICkgPT4gcmVzb2x2ZSgpXG5cdFx0XHRyZXNvbHZlLmFwcGx5KCB1bmRlZmluZWQsIFsgdmFsdWUgXS5zbGljZSggbm9WYWx1ZSApICk7XG5cdFx0fVxuXG5cdC8vIEZvciBQcm9taXNlcy9BKywgY29udmVydCBleGNlcHRpb25zIGludG8gcmVqZWN0aW9uc1xuXHQvLyBTaW5jZSBqUXVlcnkud2hlbiBkb2Vzbid0IHVud3JhcCB0aGVuYWJsZXMsIHdlIGNhbiBza2lwIHRoZSBleHRyYSBjaGVja3MgYXBwZWFyaW5nIGluXG5cdC8vIERlZmVycmVkI3RoZW4gdG8gY29uZGl0aW9uYWxseSBzdXBwcmVzcyByZWplY3Rpb24uXG5cdH0gY2F0Y2ggKCB2YWx1ZSApIHtcblxuXHRcdC8vIFN1cHBvcnQ6IEFuZHJvaWQgNC4wIG9ubHlcblx0XHQvLyBTdHJpY3QgbW9kZSBmdW5jdGlvbnMgaW52b2tlZCB3aXRob3V0IC5jYWxsLy5hcHBseSBnZXQgZ2xvYmFsLW9iamVjdCBjb250ZXh0XG5cdFx0cmVqZWN0LmFwcGx5KCB1bmRlZmluZWQsIFsgdmFsdWUgXSApO1xuXHR9XG59XG5cbmpRdWVyeS5leHRlbmQoIHtcblxuXHREZWZlcnJlZDogZnVuY3Rpb24oIGZ1bmMgKSB7XG5cdFx0dmFyIHR1cGxlcyA9IFtcblxuXHRcdFx0XHQvLyBhY3Rpb24sIGFkZCBsaXN0ZW5lciwgY2FsbGJhY2tzLFxuXHRcdFx0XHQvLyAuLi4gLnRoZW4gaGFuZGxlcnMsIGFyZ3VtZW50IGluZGV4LCBbZmluYWwgc3RhdGVdXG5cdFx0XHRcdFsgXCJub3RpZnlcIiwgXCJwcm9ncmVzc1wiLCBqUXVlcnkuQ2FsbGJhY2tzKCBcIm1lbW9yeVwiICksXG5cdFx0XHRcdFx0alF1ZXJ5LkNhbGxiYWNrcyggXCJtZW1vcnlcIiApLCAyIF0sXG5cdFx0XHRcdFsgXCJyZXNvbHZlXCIsIFwiZG9uZVwiLCBqUXVlcnkuQ2FsbGJhY2tzKCBcIm9uY2UgbWVtb3J5XCIgKSxcblx0XHRcdFx0XHRqUXVlcnkuQ2FsbGJhY2tzKCBcIm9uY2UgbWVtb3J5XCIgKSwgMCwgXCJyZXNvbHZlZFwiIF0sXG5cdFx0XHRcdFsgXCJyZWplY3RcIiwgXCJmYWlsXCIsIGpRdWVyeS5DYWxsYmFja3MoIFwib25jZSBtZW1vcnlcIiApLFxuXHRcdFx0XHRcdGpRdWVyeS5DYWxsYmFja3MoIFwib25jZSBtZW1vcnlcIiApLCAxLCBcInJlamVjdGVkXCIgXVxuXHRcdFx0XSxcblx0XHRcdHN0YXRlID0gXCJwZW5kaW5nXCIsXG5cdFx0XHRwcm9taXNlID0ge1xuXHRcdFx0XHRzdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRhbHdheXM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRlZmVycmVkLmRvbmUoIGFyZ3VtZW50cyApLmZhaWwoIGFyZ3VtZW50cyApO1xuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNhdGNoXCI6IGZ1bmN0aW9uKCBmbiApIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvbWlzZS50aGVuKCBudWxsLCBmbiApO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8vIEtlZXAgcGlwZSBmb3IgYmFjay1jb21wYXRcblx0XHRcdFx0cGlwZTogZnVuY3Rpb24oIC8qIGZuRG9uZSwgZm5GYWlsLCBmblByb2dyZXNzICovICkge1xuXHRcdFx0XHRcdHZhciBmbnMgPSBhcmd1bWVudHM7XG5cblx0XHRcdFx0XHRyZXR1cm4galF1ZXJ5LkRlZmVycmVkKCBmdW5jdGlvbiggbmV3RGVmZXIgKSB7XG5cdFx0XHRcdFx0XHRqUXVlcnkuZWFjaCggdHVwbGVzLCBmdW5jdGlvbiggX2ksIHR1cGxlICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIE1hcCB0dXBsZXMgKHByb2dyZXNzLCBkb25lLCBmYWlsKSB0byBhcmd1bWVudHMgKGRvbmUsIGZhaWwsIHByb2dyZXNzKVxuXHRcdFx0XHRcdFx0XHR2YXIgZm4gPSBpc0Z1bmN0aW9uKCBmbnNbIHR1cGxlWyA0IF0gXSApICYmIGZuc1sgdHVwbGVbIDQgXSBdO1xuXG5cdFx0XHRcdFx0XHRcdC8vIGRlZmVycmVkLnByb2dyZXNzKGZ1bmN0aW9uKCkgeyBiaW5kIHRvIG5ld0RlZmVyIG9yIG5ld0RlZmVyLm5vdGlmeSB9KVxuXHRcdFx0XHRcdFx0XHQvLyBkZWZlcnJlZC5kb25lKGZ1bmN0aW9uKCkgeyBiaW5kIHRvIG5ld0RlZmVyIG9yIG5ld0RlZmVyLnJlc29sdmUgfSlcblx0XHRcdFx0XHRcdFx0Ly8gZGVmZXJyZWQuZmFpbChmdW5jdGlvbigpIHsgYmluZCB0byBuZXdEZWZlciBvciBuZXdEZWZlci5yZWplY3QgfSlcblx0XHRcdFx0XHRcdFx0ZGVmZXJyZWRbIHR1cGxlWyAxIF0gXSggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIHJldHVybmVkID0gZm4gJiYgZm4uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdFx0XHRcdFx0XHRcdGlmICggcmV0dXJuZWQgJiYgaXNGdW5jdGlvbiggcmV0dXJuZWQucHJvbWlzZSApICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuZWQucHJvbWlzZSgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC5wcm9ncmVzcyggbmV3RGVmZXIubm90aWZ5IClcblx0XHRcdFx0XHRcdFx0XHRcdFx0LmRvbmUoIG5ld0RlZmVyLnJlc29sdmUgKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQuZmFpbCggbmV3RGVmZXIucmVqZWN0ICk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdG5ld0RlZmVyWyB0dXBsZVsgMCBdICsgXCJXaXRoXCIgXShcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Zm4gPyBbIHJldHVybmVkIF0gOiBhcmd1bWVudHNcblx0XHRcdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdFx0XHRmbnMgPSBudWxsO1xuXHRcdFx0XHRcdH0gKS5wcm9taXNlKCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoZW46IGZ1bmN0aW9uKCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyApIHtcblx0XHRcdFx0XHR2YXIgbWF4RGVwdGggPSAwO1xuXHRcdFx0XHRcdGZ1bmN0aW9uIHJlc29sdmUoIGRlcHRoLCBkZWZlcnJlZCwgaGFuZGxlciwgc3BlY2lhbCApIHtcblx0XHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHRoYXQgPSB0aGlzLFxuXHRcdFx0XHRcdFx0XHRcdGFyZ3MgPSBhcmd1bWVudHMsXG5cdFx0XHRcdFx0XHRcdFx0bWlnaHRUaHJvdyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIHJldHVybmVkLCB0aGVuO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBQcm9taXNlcy9BKyBzZWN0aW9uIDIuMy4zLjMuM1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gaHR0cHM6Ly9wcm9taXNlc2FwbHVzLmNvbS8jcG9pbnQtNTlcblx0XHRcdFx0XHRcdFx0XHRcdC8vIElnbm9yZSBkb3VibGUtcmVzb2x1dGlvbiBhdHRlbXB0c1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCBkZXB0aCA8IG1heERlcHRoICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybmVkID0gaGFuZGxlci5hcHBseSggdGhhdCwgYXJncyApO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBQcm9taXNlcy9BKyBzZWN0aW9uIDIuMy4xXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBodHRwczovL3Byb21pc2VzYXBsdXMuY29tLyNwb2ludC00OFxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCByZXR1cm5lZCA9PT0gZGVmZXJyZWQucHJvbWlzZSgpICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCBcIlRoZW5hYmxlIHNlbGYtcmVzb2x1dGlvblwiICk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8vIFN1cHBvcnQ6IFByb21pc2VzL0ErIHNlY3Rpb25zIDIuMy4zLjEsIDMuNVxuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gaHR0cHM6Ly9wcm9taXNlc2FwbHVzLmNvbS8jcG9pbnQtNTRcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGh0dHBzOi8vcHJvbWlzZXNhcGx1cy5jb20vI3BvaW50LTc1XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBSZXRyaWV2ZSBgdGhlbmAgb25seSBvbmNlXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGVuID0gcmV0dXJuZWQgJiZcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBQcm9taXNlcy9BKyBzZWN0aW9uIDIuMy40XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGh0dHBzOi8vcHJvbWlzZXNhcGx1cy5jb20vI3BvaW50LTY0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIE9ubHkgY2hlY2sgb2JqZWN0cyBhbmQgZnVuY3Rpb25zIGZvciB0aGVuYWJpbGl0eVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQoIHR5cGVvZiByZXR1cm5lZCA9PT0gXCJvYmplY3RcIiB8fFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGVvZiByZXR1cm5lZCA9PT0gXCJmdW5jdGlvblwiICkgJiZcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuZWQudGhlbjtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gSGFuZGxlIGEgcmV0dXJuZWQgdGhlbmFibGVcblx0XHRcdFx0XHRcdFx0XHRcdGlmICggaXNGdW5jdGlvbiggdGhlbiApICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIFNwZWNpYWwgcHJvY2Vzc29ycyAobm90aWZ5KSBqdXN0IHdhaXQgZm9yIHJlc29sdXRpb25cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCBzcGVjaWFsICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoZW4uY2FsbChcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybmVkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzb2x2ZSggbWF4RGVwdGgsIGRlZmVycmVkLCBJZGVudGl0eSwgc3BlY2lhbCApLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzb2x2ZSggbWF4RGVwdGgsIGRlZmVycmVkLCBUaHJvd2VyLCBzcGVjaWFsIClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIE5vcm1hbCBwcm9jZXNzb3JzIChyZXNvbHZlKSBhbHNvIGhvb2sgaW50byBwcm9ncmVzc1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gLi4uYW5kIGRpc3JlZ2FyZCBvbGRlciByZXNvbHV0aW9uIHZhbHVlc1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1heERlcHRoKys7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGVuLmNhbGwoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm5lZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJlc29sdmUoIG1heERlcHRoLCBkZWZlcnJlZCwgSWRlbnRpdHksIHNwZWNpYWwgKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJlc29sdmUoIG1heERlcHRoLCBkZWZlcnJlZCwgVGhyb3dlciwgc3BlY2lhbCApLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzb2x2ZSggbWF4RGVwdGgsIGRlZmVycmVkLCBJZGVudGl0eSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmZXJyZWQubm90aWZ5V2l0aCApXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBIYW5kbGUgYWxsIG90aGVyIHJldHVybmVkIHZhbHVlc1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBPbmx5IHN1YnN0aXR1dGUgaGFuZGxlcnMgcGFzcyBvbiBjb250ZXh0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGFuZCBtdWx0aXBsZSB2YWx1ZXMgKG5vbi1zcGVjIGJlaGF2aW9yKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoIGhhbmRsZXIgIT09IElkZW50aXR5ICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoYXQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXJncyA9IFsgcmV0dXJuZWQgXTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIFByb2Nlc3MgdGhlIHZhbHVlKHMpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIERlZmF1bHQgcHJvY2VzcyBpcyByZXNvbHZlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCggc3BlY2lhbCB8fCBkZWZlcnJlZC5yZXNvbHZlV2l0aCApKCB0aGF0LCBhcmdzICk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdFx0XHRcdC8vIE9ubHkgbm9ybWFsIHByb2Nlc3NvcnMgKHJlc29sdmUpIGNhdGNoIGFuZCByZWplY3QgZXhjZXB0aW9uc1xuXHRcdFx0XHRcdFx0XHRcdHByb2Nlc3MgPSBzcGVjaWFsID9cblx0XHRcdFx0XHRcdFx0XHRcdG1pZ2h0VGhyb3cgOlxuXHRcdFx0XHRcdFx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWlnaHRUaHJvdygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGNhdGNoICggZSApIHtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICggalF1ZXJ5LkRlZmVycmVkLmV4Y2VwdGlvbkhvb2sgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRqUXVlcnkuRGVmZXJyZWQuZXhjZXB0aW9uSG9vayggZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvY2Vzcy5lcnJvciApO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIFN1cHBvcnQ6IFByb21pc2VzL0ErIHNlY3Rpb24gMi4zLjMuMy40LjFcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBodHRwczovL3Byb21pc2VzYXBsdXMuY29tLyNwb2ludC02MVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIElnbm9yZSBwb3N0LXJlc29sdXRpb24gZXhjZXB0aW9uc1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICggZGVwdGggKyAxID49IG1heERlcHRoICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBPbmx5IHN1YnN0aXR1dGUgaGFuZGxlcnMgcGFzcyBvbiBjb250ZXh0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBhbmQgbXVsdGlwbGUgdmFsdWVzIChub24tc3BlYyBiZWhhdmlvcilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICggaGFuZGxlciAhPT0gVGhyb3dlciApIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhhdCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXJncyA9IFsgZSBdO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3RXaXRoKCB0aGF0LCBhcmdzICk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdC8vIFN1cHBvcnQ6IFByb21pc2VzL0ErIHNlY3Rpb24gMi4zLjMuMy4xXG5cdFx0XHRcdFx0XHRcdC8vIGh0dHBzOi8vcHJvbWlzZXNhcGx1cy5jb20vI3BvaW50LTU3XG5cdFx0XHRcdFx0XHRcdC8vIFJlLXJlc29sdmUgcHJvbWlzZXMgaW1tZWRpYXRlbHkgdG8gZG9kZ2UgZmFsc2UgcmVqZWN0aW9uIGZyb21cblx0XHRcdFx0XHRcdFx0Ly8gc3Vic2VxdWVudCBlcnJvcnNcblx0XHRcdFx0XHRcdFx0aWYgKCBkZXB0aCApIHtcblx0XHRcdFx0XHRcdFx0XHRwcm9jZXNzKCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBDYWxsIGFuIG9wdGlvbmFsIGhvb2sgdG8gcmVjb3JkIHRoZSBlcnJvciwgaW4gY2FzZSBvZiBleGNlcHRpb25cblx0XHRcdFx0XHRcdFx0XHQvLyBzaW5jZSBpdCdzIG90aGVyd2lzZSBsb3N0IHdoZW4gZXhlY3V0aW9uIGdvZXMgYXN5bmNcblx0XHRcdFx0XHRcdFx0XHRpZiAoIGpRdWVyeS5EZWZlcnJlZC5nZXRFcnJvckhvb2sgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRwcm9jZXNzLmVycm9yID0galF1ZXJ5LkRlZmVycmVkLmdldEVycm9ySG9vaygpO1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gVGhlIGRlcHJlY2F0ZWQgYWxpYXMgb2YgdGhlIGFib3ZlLiBXaGlsZSB0aGUgbmFtZSBzdWdnZXN0c1xuXHRcdFx0XHRcdFx0XHRcdC8vIHJldHVybmluZyB0aGUgc3RhY2ssIG5vdCBhbiBlcnJvciBpbnN0YW5jZSwgalF1ZXJ5IGp1c3QgcGFzc2VzXG5cdFx0XHRcdFx0XHRcdFx0Ly8gaXQgZGlyZWN0bHkgdG8gYGNvbnNvbGUud2FybmAgc28gYm90aCB3aWxsIHdvcms7IGFuIGluc3RhbmNlXG5cdFx0XHRcdFx0XHRcdFx0Ly8ganVzdCBiZXR0ZXIgY29vcGVyYXRlcyB3aXRoIHNvdXJjZSBtYXBzLlxuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoIGpRdWVyeS5EZWZlcnJlZC5nZXRTdGFja0hvb2sgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRwcm9jZXNzLmVycm9yID0galF1ZXJ5LkRlZmVycmVkLmdldFN0YWNrSG9vaygpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR3aW5kb3cuc2V0VGltZW91dCggcHJvY2VzcyApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBqUXVlcnkuRGVmZXJyZWQoIGZ1bmN0aW9uKCBuZXdEZWZlciApIHtcblxuXHRcdFx0XHRcdFx0Ly8gcHJvZ3Jlc3NfaGFuZGxlcnMuYWRkKCAuLi4gKVxuXHRcdFx0XHRcdFx0dHVwbGVzWyAwIF1bIDMgXS5hZGQoXG5cdFx0XHRcdFx0XHRcdHJlc29sdmUoXG5cdFx0XHRcdFx0XHRcdFx0MCxcblx0XHRcdFx0XHRcdFx0XHRuZXdEZWZlcixcblx0XHRcdFx0XHRcdFx0XHRpc0Z1bmN0aW9uKCBvblByb2dyZXNzICkgP1xuXHRcdFx0XHRcdFx0XHRcdFx0b25Qcm9ncmVzcyA6XG5cdFx0XHRcdFx0XHRcdFx0XHRJZGVudGl0eSxcblx0XHRcdFx0XHRcdFx0XHRuZXdEZWZlci5ub3RpZnlXaXRoXG5cdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdC8vIGZ1bGZpbGxlZF9oYW5kbGVycy5hZGQoIC4uLiApXG5cdFx0XHRcdFx0XHR0dXBsZXNbIDEgXVsgMyBdLmFkZChcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZShcblx0XHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRcdG5ld0RlZmVyLFxuXHRcdFx0XHRcdFx0XHRcdGlzRnVuY3Rpb24oIG9uRnVsZmlsbGVkICkgP1xuXHRcdFx0XHRcdFx0XHRcdFx0b25GdWxmaWxsZWQgOlxuXHRcdFx0XHRcdFx0XHRcdFx0SWRlbnRpdHlcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0Ly8gcmVqZWN0ZWRfaGFuZGxlcnMuYWRkKCAuLi4gKVxuXHRcdFx0XHRcdFx0dHVwbGVzWyAyIF1bIDMgXS5hZGQoXG5cdFx0XHRcdFx0XHRcdHJlc29sdmUoXG5cdFx0XHRcdFx0XHRcdFx0MCxcblx0XHRcdFx0XHRcdFx0XHRuZXdEZWZlcixcblx0XHRcdFx0XHRcdFx0XHRpc0Z1bmN0aW9uKCBvblJlamVjdGVkICkgP1xuXHRcdFx0XHRcdFx0XHRcdFx0b25SZWplY3RlZCA6XG5cdFx0XHRcdFx0XHRcdFx0XHRUaHJvd2VyXG5cdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fSApLnByb21pc2UoKTtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHQvLyBHZXQgYSBwcm9taXNlIGZvciB0aGlzIGRlZmVycmVkXG5cdFx0XHRcdC8vIElmIG9iaiBpcyBwcm92aWRlZCwgdGhlIHByb21pc2UgYXNwZWN0IGlzIGFkZGVkIHRvIHRoZSBvYmplY3Rcblx0XHRcdFx0cHJvbWlzZTogZnVuY3Rpb24oIG9iaiApIHtcblx0XHRcdFx0XHRyZXR1cm4gb2JqICE9IG51bGwgPyBqUXVlcnkuZXh0ZW5kKCBvYmosIHByb21pc2UgKSA6IHByb21pc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRkZWZlcnJlZCA9IHt9O1xuXG5cdFx0Ly8gQWRkIGxpc3Qtc3BlY2lmaWMgbWV0aG9kc1xuXHRcdGpRdWVyeS5lYWNoKCB0dXBsZXMsIGZ1bmN0aW9uKCBpLCB0dXBsZSApIHtcblx0XHRcdHZhciBsaXN0ID0gdHVwbGVbIDIgXSxcblx0XHRcdFx0c3RhdGVTdHJpbmcgPSB0dXBsZVsgNSBdO1xuXG5cdFx0XHQvLyBwcm9taXNlLnByb2dyZXNzID0gbGlzdC5hZGRcblx0XHRcdC8vIHByb21pc2UuZG9uZSA9IGxpc3QuYWRkXG5cdFx0XHQvLyBwcm9taXNlLmZhaWwgPSBsaXN0LmFkZFxuXHRcdFx0cHJvbWlzZVsgdHVwbGVbIDEgXSBdID0gbGlzdC5hZGQ7XG5cblx0XHRcdC8vIEhhbmRsZSBzdGF0ZVxuXHRcdFx0aWYgKCBzdGF0ZVN0cmluZyApIHtcblx0XHRcdFx0bGlzdC5hZGQoXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0XHRcdC8vIHN0YXRlID0gXCJyZXNvbHZlZFwiIChpLmUuLCBmdWxmaWxsZWQpXG5cdFx0XHRcdFx0XHQvLyBzdGF0ZSA9IFwicmVqZWN0ZWRcIlxuXHRcdFx0XHRcdFx0c3RhdGUgPSBzdGF0ZVN0cmluZztcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0Ly8gcmVqZWN0ZWRfY2FsbGJhY2tzLmRpc2FibGVcblx0XHRcdFx0XHQvLyBmdWxmaWxsZWRfY2FsbGJhY2tzLmRpc2FibGVcblx0XHRcdFx0XHR0dXBsZXNbIDMgLSBpIF1bIDIgXS5kaXNhYmxlLFxuXG5cdFx0XHRcdFx0Ly8gcmVqZWN0ZWRfaGFuZGxlcnMuZGlzYWJsZVxuXHRcdFx0XHRcdC8vIGZ1bGZpbGxlZF9oYW5kbGVycy5kaXNhYmxlXG5cdFx0XHRcdFx0dHVwbGVzWyAzIC0gaSBdWyAzIF0uZGlzYWJsZSxcblxuXHRcdFx0XHRcdC8vIHByb2dyZXNzX2NhbGxiYWNrcy5sb2NrXG5cdFx0XHRcdFx0dHVwbGVzWyAwIF1bIDIgXS5sb2NrLFxuXG5cdFx0XHRcdFx0Ly8gcHJvZ3Jlc3NfaGFuZGxlcnMubG9ja1xuXHRcdFx0XHRcdHR1cGxlc1sgMCBdWyAzIF0ubG9ja1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBwcm9ncmVzc19oYW5kbGVycy5maXJlXG5cdFx0XHQvLyBmdWxmaWxsZWRfaGFuZGxlcnMuZmlyZVxuXHRcdFx0Ly8gcmVqZWN0ZWRfaGFuZGxlcnMuZmlyZVxuXHRcdFx0bGlzdC5hZGQoIHR1cGxlWyAzIF0uZmlyZSApO1xuXG5cdFx0XHQvLyBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbigpIHsgZGVmZXJyZWQubm90aWZ5V2l0aCguLi4pIH1cblx0XHRcdC8vIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVzb2x2ZVdpdGgoLi4uKSB9XG5cdFx0XHQvLyBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVqZWN0V2l0aCguLi4pIH1cblx0XHRcdGRlZmVycmVkWyB0dXBsZVsgMCBdIF0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZGVmZXJyZWRbIHR1cGxlWyAwIF0gKyBcIldpdGhcIiBdKCB0aGlzID09PSBkZWZlcnJlZCA/IHVuZGVmaW5lZCA6IHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH07XG5cblx0XHRcdC8vIGRlZmVycmVkLm5vdGlmeVdpdGggPSBsaXN0LmZpcmVXaXRoXG5cdFx0XHQvLyBkZWZlcnJlZC5yZXNvbHZlV2l0aCA9IGxpc3QuZmlyZVdpdGhcblx0XHRcdC8vIGRlZmVycmVkLnJlamVjdFdpdGggPSBsaXN0LmZpcmVXaXRoXG5cdFx0XHRkZWZlcnJlZFsgdHVwbGVbIDAgXSArIFwiV2l0aFwiIF0gPSBsaXN0LmZpcmVXaXRoO1xuXHRcdH0gKTtcblxuXHRcdC8vIE1ha2UgdGhlIGRlZmVycmVkIGEgcHJvbWlzZVxuXHRcdHByb21pc2UucHJvbWlzZSggZGVmZXJyZWQgKTtcblxuXHRcdC8vIENhbGwgZ2l2ZW4gZnVuYyBpZiBhbnlcblx0XHRpZiAoIGZ1bmMgKSB7XG5cdFx0XHRmdW5jLmNhbGwoIGRlZmVycmVkLCBkZWZlcnJlZCApO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBkb25lIVxuXHRcdHJldHVybiBkZWZlcnJlZDtcblx0fSxcblxuXHQvLyBEZWZlcnJlZCBoZWxwZXJcblx0d2hlbjogZnVuY3Rpb24oIHNpbmdsZVZhbHVlICkge1xuXHRcdHZhclxuXG5cdFx0XHQvLyBjb3VudCBvZiB1bmNvbXBsZXRlZCBzdWJvcmRpbmF0ZXNcblx0XHRcdHJlbWFpbmluZyA9IGFyZ3VtZW50cy5sZW5ndGgsXG5cblx0XHRcdC8vIGNvdW50IG9mIHVucHJvY2Vzc2VkIGFyZ3VtZW50c1xuXHRcdFx0aSA9IHJlbWFpbmluZyxcblxuXHRcdFx0Ly8gc3Vib3JkaW5hdGUgZnVsZmlsbG1lbnQgZGF0YVxuXHRcdFx0cmVzb2x2ZUNvbnRleHRzID0gQXJyYXkoIGkgKSxcblx0XHRcdHJlc29sdmVWYWx1ZXMgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMgKSxcblxuXHRcdFx0Ly8gdGhlIHByaW1hcnkgRGVmZXJyZWRcblx0XHRcdHByaW1hcnkgPSBqUXVlcnkuRGVmZXJyZWQoKSxcblxuXHRcdFx0Ly8gc3Vib3JkaW5hdGUgY2FsbGJhY2sgZmFjdG9yeVxuXHRcdFx0dXBkYXRlRnVuYyA9IGZ1bmN0aW9uKCBpICkge1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oIHZhbHVlICkge1xuXHRcdFx0XHRcdHJlc29sdmVDb250ZXh0c1sgaSBdID0gdGhpcztcblx0XHRcdFx0XHRyZXNvbHZlVmFsdWVzWyBpIF0gPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApIDogdmFsdWU7XG5cdFx0XHRcdFx0aWYgKCAhKCAtLXJlbWFpbmluZyApICkge1xuXHRcdFx0XHRcdFx0cHJpbWFyeS5yZXNvbHZlV2l0aCggcmVzb2x2ZUNvbnRleHRzLCByZXNvbHZlVmFsdWVzICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblxuXHRcdC8vIFNpbmdsZS0gYW5kIGVtcHR5IGFyZ3VtZW50cyBhcmUgYWRvcHRlZCBsaWtlIFByb21pc2UucmVzb2x2ZVxuXHRcdGlmICggcmVtYWluaW5nIDw9IDEgKSB7XG5cdFx0XHRhZG9wdFZhbHVlKCBzaW5nbGVWYWx1ZSwgcHJpbWFyeS5kb25lKCB1cGRhdGVGdW5jKCBpICkgKS5yZXNvbHZlLCBwcmltYXJ5LnJlamVjdCxcblx0XHRcdFx0IXJlbWFpbmluZyApO1xuXG5cdFx0XHQvLyBVc2UgLnRoZW4oKSB0byB1bndyYXAgc2Vjb25kYXJ5IHRoZW5hYmxlcyAoY2YuIGdoLTMwMDApXG5cdFx0XHRpZiAoIHByaW1hcnkuc3RhdGUoKSA9PT0gXCJwZW5kaW5nXCIgfHxcblx0XHRcdFx0aXNGdW5jdGlvbiggcmVzb2x2ZVZhbHVlc1sgaSBdICYmIHJlc29sdmVWYWx1ZXNbIGkgXS50aGVuICkgKSB7XG5cblx0XHRcdFx0cmV0dXJuIHByaW1hcnkudGhlbigpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIE11bHRpcGxlIGFyZ3VtZW50cyBhcmUgYWdncmVnYXRlZCBsaWtlIFByb21pc2UuYWxsIGFycmF5IGVsZW1lbnRzXG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHRhZG9wdFZhbHVlKCByZXNvbHZlVmFsdWVzWyBpIF0sIHVwZGF0ZUZ1bmMoIGkgKSwgcHJpbWFyeS5yZWplY3QgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcHJpbWFyeS5wcm9taXNlKCk7XG5cdH1cbn0gKTtcblxuXG4vLyBUaGVzZSB1c3VhbGx5IGluZGljYXRlIGEgcHJvZ3JhbW1lciBtaXN0YWtlIGR1cmluZyBkZXZlbG9wbWVudCxcbi8vIHdhcm4gYWJvdXQgdGhlbSBBU0FQIHJhdGhlciB0aGFuIHN3YWxsb3dpbmcgdGhlbSBieSBkZWZhdWx0LlxudmFyIHJlcnJvck5hbWVzID0gL14oRXZhbHxJbnRlcm5hbHxSYW5nZXxSZWZlcmVuY2V8U3ludGF4fFR5cGV8VVJJKUVycm9yJC87XG5cbi8vIElmIGBqUXVlcnkuRGVmZXJyZWQuZ2V0RXJyb3JIb29rYCBpcyBkZWZpbmVkLCBgYXN5bmNFcnJvcmAgaXMgYW4gZXJyb3Jcbi8vIGNhcHR1cmVkIGJlZm9yZSB0aGUgYXN5bmMgYmFycmllciB0byBnZXQgdGhlIG9yaWdpbmFsIGVycm9yIGNhdXNlXG4vLyB3aGljaCBtYXkgb3RoZXJ3aXNlIGJlIGhpZGRlbi5cbmpRdWVyeS5EZWZlcnJlZC5leGNlcHRpb25Ib29rID0gZnVuY3Rpb24oIGVycm9yLCBhc3luY0Vycm9yICkge1xuXG5cdC8vIFN1cHBvcnQ6IElFIDggLSA5IG9ubHlcblx0Ly8gQ29uc29sZSBleGlzdHMgd2hlbiBkZXYgdG9vbHMgYXJlIG9wZW4sIHdoaWNoIGNhbiBoYXBwZW4gYXQgYW55IHRpbWVcblx0aWYgKCB3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS53YXJuICYmIGVycm9yICYmIHJlcnJvck5hbWVzLnRlc3QoIGVycm9yLm5hbWUgKSApIHtcblx0XHR3aW5kb3cuY29uc29sZS53YXJuKCBcImpRdWVyeS5EZWZlcnJlZCBleGNlcHRpb246IFwiICsgZXJyb3IubWVzc2FnZSxcblx0XHRcdGVycm9yLnN0YWNrLCBhc3luY0Vycm9yICk7XG5cdH1cbn07XG5cblxuXG5cbmpRdWVyeS5yZWFkeUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKCBlcnJvciApIHtcblx0d2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdHRocm93IGVycm9yO1xuXHR9ICk7XG59O1xuXG5cblxuXG4vLyBUaGUgZGVmZXJyZWQgdXNlZCBvbiBET00gcmVhZHlcbnZhciByZWFkeUxpc3QgPSBqUXVlcnkuRGVmZXJyZWQoKTtcblxualF1ZXJ5LmZuLnJlYWR5ID0gZnVuY3Rpb24oIGZuICkge1xuXG5cdHJlYWR5TGlzdFxuXHRcdC50aGVuKCBmbiApXG5cblx0XHQvLyBXcmFwIGpRdWVyeS5yZWFkeUV4Y2VwdGlvbiBpbiBhIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIGxvb2t1cFxuXHRcdC8vIGhhcHBlbnMgYXQgdGhlIHRpbWUgb2YgZXJyb3IgaGFuZGxpbmcgaW5zdGVhZCBvZiBjYWxsYmFja1xuXHRcdC8vIHJlZ2lzdHJhdGlvbi5cblx0XHQuY2F0Y2goIGZ1bmN0aW9uKCBlcnJvciApIHtcblx0XHRcdGpRdWVyeS5yZWFkeUV4Y2VwdGlvbiggZXJyb3IgKTtcblx0XHR9ICk7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5qUXVlcnkuZXh0ZW5kKCB7XG5cblx0Ly8gSXMgdGhlIERPTSByZWFkeSB0byBiZSB1c2VkPyBTZXQgdG8gdHJ1ZSBvbmNlIGl0IG9jY3Vycy5cblx0aXNSZWFkeTogZmFsc2UsXG5cblx0Ly8gQSBjb3VudGVyIHRvIHRyYWNrIGhvdyBtYW55IGl0ZW1zIHRvIHdhaXQgZm9yIGJlZm9yZVxuXHQvLyB0aGUgcmVhZHkgZXZlbnQgZmlyZXMuIFNlZSB0cmFjLTY3ODFcblx0cmVhZHlXYWl0OiAxLFxuXG5cdC8vIEhhbmRsZSB3aGVuIHRoZSBET00gaXMgcmVhZHlcblx0cmVhZHk6IGZ1bmN0aW9uKCB3YWl0ICkge1xuXG5cdFx0Ly8gQWJvcnQgaWYgdGhlcmUgYXJlIHBlbmRpbmcgaG9sZHMgb3Igd2UncmUgYWxyZWFkeSByZWFkeVxuXHRcdGlmICggd2FpdCA9PT0gdHJ1ZSA/IC0talF1ZXJ5LnJlYWR5V2FpdCA6IGpRdWVyeS5pc1JlYWR5ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFJlbWVtYmVyIHRoYXQgdGhlIERPTSBpcyByZWFkeVxuXHRcdGpRdWVyeS5pc1JlYWR5ID0gdHJ1ZTtcblxuXHRcdC8vIElmIGEgbm9ybWFsIERPTSBSZWFkeSBldmVudCBmaXJlZCwgZGVjcmVtZW50LCBhbmQgd2FpdCBpZiBuZWVkIGJlXG5cdFx0aWYgKCB3YWl0ICE9PSB0cnVlICYmIC0talF1ZXJ5LnJlYWR5V2FpdCA+IDAgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlcmUgYXJlIGZ1bmN0aW9ucyBib3VuZCwgdG8gZXhlY3V0ZVxuXHRcdHJlYWR5TGlzdC5yZXNvbHZlV2l0aCggZG9jdW1lbnQsIFsgalF1ZXJ5IF0gKTtcblx0fVxufSApO1xuXG5qUXVlcnkucmVhZHkudGhlbiA9IHJlYWR5TGlzdC50aGVuO1xuXG4vLyBUaGUgcmVhZHkgZXZlbnQgaGFuZGxlciBhbmQgc2VsZiBjbGVhbnVwIG1ldGhvZFxuZnVuY3Rpb24gY29tcGxldGVkKCkge1xuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgY29tcGxldGVkICk7XG5cdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCBcImxvYWRcIiwgY29tcGxldGVkICk7XG5cdGpRdWVyeS5yZWFkeSgpO1xufVxuXG4vLyBDYXRjaCBjYXNlcyB3aGVyZSAkKGRvY3VtZW50KS5yZWFkeSgpIGlzIGNhbGxlZFxuLy8gYWZ0ZXIgdGhlIGJyb3dzZXIgZXZlbnQgaGFzIGFscmVhZHkgb2NjdXJyZWQuXG4vLyBTdXBwb3J0OiBJRSA8PTkgLSAxMCBvbmx5XG4vLyBPbGRlciBJRSBzb21ldGltZXMgc2lnbmFscyBcImludGVyYWN0aXZlXCIgdG9vIHNvb25cbmlmICggZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8XG5cdCggZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gXCJsb2FkaW5nXCIgJiYgIWRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCApICkge1xuXG5cdC8vIEhhbmRsZSBpdCBhc3luY2hyb25vdXNseSB0byBhbGxvdyBzY3JpcHRzIHRoZSBvcHBvcnR1bml0eSB0byBkZWxheSByZWFkeVxuXHR3aW5kb3cuc2V0VGltZW91dCggalF1ZXJ5LnJlYWR5ICk7XG5cbn0gZWxzZSB7XG5cblx0Ly8gVXNlIHRoZSBoYW5keSBldmVudCBjYWxsYmFja1xuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgY29tcGxldGVkICk7XG5cblx0Ly8gQSBmYWxsYmFjayB0byB3aW5kb3cub25sb2FkLCB0aGF0IHdpbGwgYWx3YXlzIHdvcmtcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoIFwibG9hZFwiLCBjb21wbGV0ZWQgKTtcbn1cblxuXG5cblxuLy8gTXVsdGlmdW5jdGlvbmFsIG1ldGhvZCB0byBnZXQgYW5kIHNldCB2YWx1ZXMgb2YgYSBjb2xsZWN0aW9uXG4vLyBUaGUgdmFsdWUvcyBjYW4gb3B0aW9uYWxseSBiZSBleGVjdXRlZCBpZiBpdCdzIGEgZnVuY3Rpb25cbnZhciBhY2Nlc3MgPSBmdW5jdGlvbiggZWxlbXMsIGZuLCBrZXksIHZhbHVlLCBjaGFpbmFibGUsIGVtcHR5R2V0LCByYXcgKSB7XG5cdHZhciBpID0gMCxcblx0XHRsZW4gPSBlbGVtcy5sZW5ndGgsXG5cdFx0YnVsayA9IGtleSA9PSBudWxsO1xuXG5cdC8vIFNldHMgbWFueSB2YWx1ZXNcblx0aWYgKCB0b1R5cGUoIGtleSApID09PSBcIm9iamVjdFwiICkge1xuXHRcdGNoYWluYWJsZSA9IHRydWU7XG5cdFx0Zm9yICggaSBpbiBrZXkgKSB7XG5cdFx0XHRhY2Nlc3MoIGVsZW1zLCBmbiwgaSwga2V5WyBpIF0sIHRydWUsIGVtcHR5R2V0LCByYXcgKTtcblx0XHR9XG5cblx0Ly8gU2V0cyBvbmUgdmFsdWVcblx0fSBlbHNlIGlmICggdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcblx0XHRjaGFpbmFibGUgPSB0cnVlO1xuXG5cdFx0aWYgKCAhaXNGdW5jdGlvbiggdmFsdWUgKSApIHtcblx0XHRcdHJhdyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCBidWxrICkge1xuXG5cdFx0XHQvLyBCdWxrIG9wZXJhdGlvbnMgcnVuIGFnYWluc3QgdGhlIGVudGlyZSBzZXRcblx0XHRcdGlmICggcmF3ICkge1xuXHRcdFx0XHRmbi5jYWxsKCBlbGVtcywgdmFsdWUgKTtcblx0XHRcdFx0Zm4gPSBudWxsO1xuXG5cdFx0XHQvLyAuLi5leGNlcHQgd2hlbiBleGVjdXRpbmcgZnVuY3Rpb24gdmFsdWVzXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRidWxrID0gZm47XG5cdFx0XHRcdGZuID0gZnVuY3Rpb24oIGVsZW0sIF9rZXksIHZhbHVlICkge1xuXHRcdFx0XHRcdHJldHVybiBidWxrLmNhbGwoIGpRdWVyeSggZWxlbSApLCB2YWx1ZSApO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICggZm4gKSB7XG5cdFx0XHRmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0Zm4oXG5cdFx0XHRcdFx0ZWxlbXNbIGkgXSwga2V5LCByYXcgP1xuXHRcdFx0XHRcdFx0dmFsdWUgOlxuXHRcdFx0XHRcdFx0dmFsdWUuY2FsbCggZWxlbXNbIGkgXSwgaSwgZm4oIGVsZW1zWyBpIF0sIGtleSApIClcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoIGNoYWluYWJsZSApIHtcblx0XHRyZXR1cm4gZWxlbXM7XG5cdH1cblxuXHQvLyBHZXRzXG5cdGlmICggYnVsayApIHtcblx0XHRyZXR1cm4gZm4uY2FsbCggZWxlbXMgKTtcblx0fVxuXG5cdHJldHVybiBsZW4gPyBmbiggZWxlbXNbIDAgXSwga2V5ICkgOiBlbXB0eUdldDtcbn07XG5cblxuLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXG52YXIgcm1zUHJlZml4ID0gL14tbXMtLyxcblx0cmRhc2hBbHBoYSA9IC8tKFthLXpdKS9nO1xuXG4vLyBVc2VkIGJ5IGNhbWVsQ2FzZSBhcyBjYWxsYmFjayB0byByZXBsYWNlKClcbmZ1bmN0aW9uIGZjYW1lbENhc2UoIF9hbGwsIGxldHRlciApIHtcblx0cmV0dXJuIGxldHRlci50b1VwcGVyQ2FzZSgpO1xufVxuXG4vLyBDb252ZXJ0IGRhc2hlZCB0byBjYW1lbENhc2U7IHVzZWQgYnkgdGhlIGNzcyBhbmQgZGF0YSBtb2R1bGVzXG4vLyBTdXBwb3J0OiBJRSA8PTkgLSAxMSwgRWRnZSAxMiAtIDE1XG4vLyBNaWNyb3NvZnQgZm9yZ290IHRvIGh1bXAgdGhlaXIgdmVuZG9yIHByZWZpeCAodHJhYy05NTcyKVxuZnVuY3Rpb24gY2FtZWxDYXNlKCBzdHJpbmcgKSB7XG5cdHJldHVybiBzdHJpbmcucmVwbGFjZSggcm1zUHJlZml4LCBcIm1zLVwiICkucmVwbGFjZSggcmRhc2hBbHBoYSwgZmNhbWVsQ2FzZSApO1xufVxudmFyIGFjY2VwdERhdGEgPSBmdW5jdGlvbiggb3duZXIgKSB7XG5cblx0Ly8gQWNjZXB0cyBvbmx5OlxuXHQvLyAgLSBOb2RlXG5cdC8vICAgIC0gTm9kZS5FTEVNRU5UX05PREVcblx0Ly8gICAgLSBOb2RlLkRPQ1VNRU5UX05PREVcblx0Ly8gIC0gT2JqZWN0XG5cdC8vICAgIC0gQW55XG5cdHJldHVybiBvd25lci5ub2RlVHlwZSA9PT0gMSB8fCBvd25lci5ub2RlVHlwZSA9PT0gOSB8fCAhKCArb3duZXIubm9kZVR5cGUgKTtcbn07XG5cblxuXG5cbmZ1bmN0aW9uIERhdGEoKSB7XG5cdHRoaXMuZXhwYW5kbyA9IGpRdWVyeS5leHBhbmRvICsgRGF0YS51aWQrKztcbn1cblxuRGF0YS51aWQgPSAxO1xuXG5EYXRhLnByb3RvdHlwZSA9IHtcblxuXHRjYWNoZTogZnVuY3Rpb24oIG93bmVyICkge1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIG93bmVyIG9iamVjdCBhbHJlYWR5IGhhcyBhIGNhY2hlXG5cdFx0dmFyIHZhbHVlID0gb3duZXJbIHRoaXMuZXhwYW5kbyBdO1xuXG5cdFx0Ly8gSWYgbm90LCBjcmVhdGUgb25lXG5cdFx0aWYgKCAhdmFsdWUgKSB7XG5cdFx0XHR2YWx1ZSA9IHt9O1xuXG5cdFx0XHQvLyBXZSBjYW4gYWNjZXB0IGRhdGEgZm9yIG5vbi1lbGVtZW50IG5vZGVzIGluIG1vZGVybiBicm93c2Vycyxcblx0XHRcdC8vIGJ1dCB3ZSBzaG91bGQgbm90LCBzZWUgdHJhYy04MzM1LlxuXHRcdFx0Ly8gQWx3YXlzIHJldHVybiBhbiBlbXB0eSBvYmplY3QuXG5cdFx0XHRpZiAoIGFjY2VwdERhdGEoIG93bmVyICkgKSB7XG5cblx0XHRcdFx0Ly8gSWYgaXQgaXMgYSBub2RlIHVubGlrZWx5IHRvIGJlIHN0cmluZ2lmeS1lZCBvciBsb29wZWQgb3ZlclxuXHRcdFx0XHQvLyB1c2UgcGxhaW4gYXNzaWdubWVudFxuXHRcdFx0XHRpZiAoIG93bmVyLm5vZGVUeXBlICkge1xuXHRcdFx0XHRcdG93bmVyWyB0aGlzLmV4cGFuZG8gXSA9IHZhbHVlO1xuXG5cdFx0XHRcdC8vIE90aGVyd2lzZSBzZWN1cmUgaXQgaW4gYSBub24tZW51bWVyYWJsZSBwcm9wZXJ0eVxuXHRcdFx0XHQvLyBjb25maWd1cmFibGUgbXVzdCBiZSB0cnVlIHRvIGFsbG93IHRoZSBwcm9wZXJ0eSB0byBiZVxuXHRcdFx0XHQvLyBkZWxldGVkIHdoZW4gZGF0YSBpcyByZW1vdmVkXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBvd25lciwgdGhpcy5leHBhbmRvLCB7XG5cdFx0XHRcdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcblx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdmFsdWU7XG5cdH0sXG5cdHNldDogZnVuY3Rpb24oIG93bmVyLCBkYXRhLCB2YWx1ZSApIHtcblx0XHR2YXIgcHJvcCxcblx0XHRcdGNhY2hlID0gdGhpcy5jYWNoZSggb3duZXIgKTtcblxuXHRcdC8vIEhhbmRsZTogWyBvd25lciwga2V5LCB2YWx1ZSBdIGFyZ3Ncblx0XHQvLyBBbHdheXMgdXNlIGNhbWVsQ2FzZSBrZXkgKGdoLTIyNTcpXG5cdFx0aWYgKCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdGNhY2hlWyBjYW1lbENhc2UoIGRhdGEgKSBdID0gdmFsdWU7XG5cblx0XHQvLyBIYW5kbGU6IFsgb3duZXIsIHsgcHJvcGVydGllcyB9IF0gYXJnc1xuXHRcdH0gZWxzZSB7XG5cblx0XHRcdC8vIENvcHkgdGhlIHByb3BlcnRpZXMgb25lLWJ5LW9uZSB0byB0aGUgY2FjaGUgb2JqZWN0XG5cdFx0XHRmb3IgKCBwcm9wIGluIGRhdGEgKSB7XG5cdFx0XHRcdGNhY2hlWyBjYW1lbENhc2UoIHByb3AgKSBdID0gZGF0YVsgcHJvcCBdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY2FjaGU7XG5cdH0sXG5cdGdldDogZnVuY3Rpb24oIG93bmVyLCBrZXkgKSB7XG5cdFx0cmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkID9cblx0XHRcdHRoaXMuY2FjaGUoIG93bmVyICkgOlxuXG5cdFx0XHQvLyBBbHdheXMgdXNlIGNhbWVsQ2FzZSBrZXkgKGdoLTIyNTcpXG5cdFx0XHRvd25lclsgdGhpcy5leHBhbmRvIF0gJiYgb3duZXJbIHRoaXMuZXhwYW5kbyBdWyBjYW1lbENhc2UoIGtleSApIF07XG5cdH0sXG5cdGFjY2VzczogZnVuY3Rpb24oIG93bmVyLCBrZXksIHZhbHVlICkge1xuXG5cdFx0Ly8gSW4gY2FzZXMgd2hlcmUgZWl0aGVyOlxuXHRcdC8vXG5cdFx0Ly8gICAxLiBObyBrZXkgd2FzIHNwZWNpZmllZFxuXHRcdC8vICAgMi4gQSBzdHJpbmcga2V5IHdhcyBzcGVjaWZpZWQsIGJ1dCBubyB2YWx1ZSBwcm92aWRlZFxuXHRcdC8vXG5cdFx0Ly8gVGFrZSB0aGUgXCJyZWFkXCIgcGF0aCBhbmQgYWxsb3cgdGhlIGdldCBtZXRob2QgdG8gZGV0ZXJtaW5lXG5cdFx0Ly8gd2hpY2ggdmFsdWUgdG8gcmV0dXJuLCByZXNwZWN0aXZlbHkgZWl0aGVyOlxuXHRcdC8vXG5cdFx0Ly8gICAxLiBUaGUgZW50aXJlIGNhY2hlIG9iamVjdFxuXHRcdC8vICAgMi4gVGhlIGRhdGEgc3RvcmVkIGF0IHRoZSBrZXlcblx0XHQvL1xuXHRcdGlmICgga2V5ID09PSB1bmRlZmluZWQgfHxcblx0XHRcdFx0KCAoIGtleSAmJiB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiICkgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCApICkge1xuXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXQoIG93bmVyLCBrZXkgKTtcblx0XHR9XG5cblx0XHQvLyBXaGVuIHRoZSBrZXkgaXMgbm90IGEgc3RyaW5nLCBvciBib3RoIGEga2V5IGFuZCB2YWx1ZVxuXHRcdC8vIGFyZSBzcGVjaWZpZWQsIHNldCBvciBleHRlbmQgKGV4aXN0aW5nIG9iamVjdHMpIHdpdGggZWl0aGVyOlxuXHRcdC8vXG5cdFx0Ly8gICAxLiBBbiBvYmplY3Qgb2YgcHJvcGVydGllc1xuXHRcdC8vICAgMi4gQSBrZXkgYW5kIHZhbHVlXG5cdFx0Ly9cblx0XHR0aGlzLnNldCggb3duZXIsIGtleSwgdmFsdWUgKTtcblxuXHRcdC8vIFNpbmNlIHRoZSBcInNldFwiIHBhdGggY2FuIGhhdmUgdHdvIHBvc3NpYmxlIGVudHJ5IHBvaW50c1xuXHRcdC8vIHJldHVybiB0aGUgZXhwZWN0ZWQgZGF0YSBiYXNlZCBvbiB3aGljaCBwYXRoIHdhcyB0YWtlblsqXVxuXHRcdHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBrZXk7XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24oIG93bmVyLCBrZXkgKSB7XG5cdFx0dmFyIGksXG5cdFx0XHRjYWNoZSA9IG93bmVyWyB0aGlzLmV4cGFuZG8gXTtcblxuXHRcdGlmICggY2FjaGUgPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIGtleSAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHQvLyBTdXBwb3J0IGFycmF5IG9yIHNwYWNlIHNlcGFyYXRlZCBzdHJpbmcgb2Yga2V5c1xuXHRcdFx0aWYgKCBBcnJheS5pc0FycmF5KCBrZXkgKSApIHtcblxuXHRcdFx0XHQvLyBJZiBrZXkgaXMgYW4gYXJyYXkgb2Yga2V5cy4uLlxuXHRcdFx0XHQvLyBXZSBhbHdheXMgc2V0IGNhbWVsQ2FzZSBrZXlzLCBzbyByZW1vdmUgdGhhdC5cblx0XHRcdFx0a2V5ID0ga2V5Lm1hcCggY2FtZWxDYXNlICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBjYW1lbENhc2UoIGtleSApO1xuXG5cdFx0XHRcdC8vIElmIGEga2V5IHdpdGggdGhlIHNwYWNlcyBleGlzdHMsIHVzZSBpdC5cblx0XHRcdFx0Ly8gT3RoZXJ3aXNlLCBjcmVhdGUgYW4gYXJyYXkgYnkgbWF0Y2hpbmcgbm9uLXdoaXRlc3BhY2Vcblx0XHRcdFx0a2V5ID0ga2V5IGluIGNhY2hlID9cblx0XHRcdFx0XHRbIGtleSBdIDpcblx0XHRcdFx0XHQoIGtleS5tYXRjaCggcm5vdGh0bWx3aGl0ZSApIHx8IFtdICk7XG5cdFx0XHR9XG5cblx0XHRcdGkgPSBrZXkubGVuZ3RoO1xuXG5cdFx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdFx0ZGVsZXRlIGNhY2hlWyBrZXlbIGkgXSBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlbW92ZSB0aGUgZXhwYW5kbyBpZiB0aGVyZSdzIG5vIG1vcmUgZGF0YVxuXHRcdGlmICgga2V5ID09PSB1bmRlZmluZWQgfHwgalF1ZXJ5LmlzRW1wdHlPYmplY3QoIGNhY2hlICkgKSB7XG5cblx0XHRcdC8vIFN1cHBvcnQ6IENocm9tZSA8PTM1IC0gNDVcblx0XHRcdC8vIFdlYmtpdCAmIEJsaW5rIHBlcmZvcm1hbmNlIHN1ZmZlcnMgd2hlbiBkZWxldGluZyBwcm9wZXJ0aWVzXG5cdFx0XHQvLyBmcm9tIERPTSBub2Rlcywgc28gc2V0IHRvIHVuZGVmaW5lZCBpbnN0ZWFkXG5cdFx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzg2MDcgKGJ1ZyByZXN0cmljdGVkKVxuXHRcdFx0aWYgKCBvd25lci5ub2RlVHlwZSApIHtcblx0XHRcdFx0b3duZXJbIHRoaXMuZXhwYW5kbyBdID0gdW5kZWZpbmVkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlIG93bmVyWyB0aGlzLmV4cGFuZG8gXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGhhc0RhdGE6IGZ1bmN0aW9uKCBvd25lciApIHtcblx0XHR2YXIgY2FjaGUgPSBvd25lclsgdGhpcy5leHBhbmRvIF07XG5cdFx0cmV0dXJuIGNhY2hlICE9PSB1bmRlZmluZWQgJiYgIWpRdWVyeS5pc0VtcHR5T2JqZWN0KCBjYWNoZSApO1xuXHR9XG59O1xudmFyIGRhdGFQcml2ID0gbmV3IERhdGEoKTtcblxudmFyIGRhdGFVc2VyID0gbmV3IERhdGEoKTtcblxuXG5cbi8vXHRJbXBsZW1lbnRhdGlvbiBTdW1tYXJ5XG4vL1xuLy9cdDEuIEVuZm9yY2UgQVBJIHN1cmZhY2UgYW5kIHNlbWFudGljIGNvbXBhdGliaWxpdHkgd2l0aCAxLjkueCBicmFuY2hcbi8vXHQyLiBJbXByb3ZlIHRoZSBtb2R1bGUncyBtYWludGFpbmFiaWxpdHkgYnkgcmVkdWNpbmcgdGhlIHN0b3JhZ2Vcbi8vXHRcdHBhdGhzIHRvIGEgc2luZ2xlIG1lY2hhbmlzbS5cbi8vXHQzLiBVc2UgdGhlIHNhbWUgc2luZ2xlIG1lY2hhbmlzbSB0byBzdXBwb3J0IFwicHJpdmF0ZVwiIGFuZCBcInVzZXJcIiBkYXRhLlxuLy9cdDQuIF9OZXZlcl8gZXhwb3NlIFwicHJpdmF0ZVwiIGRhdGEgdG8gdXNlciBjb2RlIChUT0RPOiBEcm9wIF9kYXRhLCBfcmVtb3ZlRGF0YSlcbi8vXHQ1LiBBdm9pZCBleHBvc2luZyBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzIG9uIHVzZXIgb2JqZWN0cyAoZWcuIGV4cGFuZG8gcHJvcGVydGllcylcbi8vXHQ2LiBQcm92aWRlIGEgY2xlYXIgcGF0aCBmb3IgaW1wbGVtZW50YXRpb24gdXBncmFkZSB0byBXZWFrTWFwIGluIDIwMTRcblxudmFyIHJicmFjZSA9IC9eKD86XFx7W1xcd1xcV10qXFx9fFxcW1tcXHdcXFddKlxcXSkkLyxcblx0cm11bHRpRGFzaCA9IC9bQS1aXS9nO1xuXG5mdW5jdGlvbiBnZXREYXRhKCBkYXRhICkge1xuXHRpZiAoIGRhdGEgPT09IFwidHJ1ZVwiICkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKCBkYXRhID09PSBcImZhbHNlXCIgKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aWYgKCBkYXRhID09PSBcIm51bGxcIiApIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8vIE9ubHkgY29udmVydCB0byBhIG51bWJlciBpZiBpdCBkb2Vzbid0IGNoYW5nZSB0aGUgc3RyaW5nXG5cdGlmICggZGF0YSA9PT0gK2RhdGEgKyBcIlwiICkge1xuXHRcdHJldHVybiArZGF0YTtcblx0fVxuXG5cdGlmICggcmJyYWNlLnRlc3QoIGRhdGEgKSApIHtcblx0XHRyZXR1cm4gSlNPTi5wYXJzZSggZGF0YSApO1xuXHR9XG5cblx0cmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIGRhdGFBdHRyKCBlbGVtLCBrZXksIGRhdGEgKSB7XG5cdHZhciBuYW1lO1xuXG5cdC8vIElmIG5vdGhpbmcgd2FzIGZvdW5kIGludGVybmFsbHksIHRyeSB0byBmZXRjaCBhbnlcblx0Ly8gZGF0YSBmcm9tIHRoZSBIVE1MNSBkYXRhLSogYXR0cmlidXRlXG5cdGlmICggZGF0YSA9PT0gdW5kZWZpbmVkICYmIGVsZW0ubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0bmFtZSA9IFwiZGF0YS1cIiArIGtleS5yZXBsYWNlKCBybXVsdGlEYXNoLCBcIi0kJlwiICkudG9Mb3dlckNhc2UoKTtcblx0XHRkYXRhID0gZWxlbS5nZXRBdHRyaWJ1dGUoIG5hbWUgKTtcblxuXHRcdGlmICggdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkYXRhID0gZ2V0RGF0YSggZGF0YSApO1xuXHRcdFx0fSBjYXRjaCAoIGUgKSB7fVxuXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugc2V0IHRoZSBkYXRhIHNvIGl0IGlzbid0IGNoYW5nZWQgbGF0ZXJcblx0XHRcdGRhdGFVc2VyLnNldCggZWxlbSwga2V5LCBkYXRhICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRhdGEgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBkYXRhO1xufVxuXG5qUXVlcnkuZXh0ZW5kKCB7XG5cdGhhc0RhdGE6IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdHJldHVybiBkYXRhVXNlci5oYXNEYXRhKCBlbGVtICkgfHwgZGF0YVByaXYuaGFzRGF0YSggZWxlbSApO1xuXHR9LFxuXG5cdGRhdGE6IGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCBkYXRhICkge1xuXHRcdHJldHVybiBkYXRhVXNlci5hY2Nlc3MoIGVsZW0sIG5hbWUsIGRhdGEgKTtcblx0fSxcblxuXHRyZW1vdmVEYXRhOiBmdW5jdGlvbiggZWxlbSwgbmFtZSApIHtcblx0XHRkYXRhVXNlci5yZW1vdmUoIGVsZW0sIG5hbWUgKTtcblx0fSxcblxuXHQvLyBUT0RPOiBOb3cgdGhhdCBhbGwgY2FsbHMgdG8gX2RhdGEgYW5kIF9yZW1vdmVEYXRhIGhhdmUgYmVlbiByZXBsYWNlZFxuXHQvLyB3aXRoIGRpcmVjdCBjYWxscyB0byBkYXRhUHJpdiBtZXRob2RzLCB0aGVzZSBjYW4gYmUgZGVwcmVjYXRlZC5cblx0X2RhdGE6IGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCBkYXRhICkge1xuXHRcdHJldHVybiBkYXRhUHJpdi5hY2Nlc3MoIGVsZW0sIG5hbWUsIGRhdGEgKTtcblx0fSxcblxuXHRfcmVtb3ZlRGF0YTogZnVuY3Rpb24oIGVsZW0sIG5hbWUgKSB7XG5cdFx0ZGF0YVByaXYucmVtb3ZlKCBlbGVtLCBuYW1lICk7XG5cdH1cbn0gKTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXHRkYXRhOiBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcblx0XHR2YXIgaSwgbmFtZSwgZGF0YSxcblx0XHRcdGVsZW0gPSB0aGlzWyAwIF0sXG5cdFx0XHRhdHRycyA9IGVsZW0gJiYgZWxlbS5hdHRyaWJ1dGVzO1xuXG5cdFx0Ly8gR2V0cyBhbGwgdmFsdWVzXG5cdFx0aWYgKCBrZXkgPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhVXNlci5nZXQoIGVsZW0gKTtcblxuXHRcdFx0XHRpZiAoIGVsZW0ubm9kZVR5cGUgPT09IDEgJiYgIWRhdGFQcml2LmdldCggZWxlbSwgXCJoYXNEYXRhQXR0cnNcIiApICkge1xuXHRcdFx0XHRcdGkgPSBhdHRycy5sZW5ndGg7XG5cdFx0XHRcdFx0d2hpbGUgKCBpLS0gKSB7XG5cblx0XHRcdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDExIG9ubHlcblx0XHRcdFx0XHRcdC8vIFRoZSBhdHRycyBlbGVtZW50cyBjYW4gYmUgbnVsbCAodHJhYy0xNDg5NClcblx0XHRcdFx0XHRcdGlmICggYXR0cnNbIGkgXSApIHtcblx0XHRcdFx0XHRcdFx0bmFtZSA9IGF0dHJzWyBpIF0ubmFtZTtcblx0XHRcdFx0XHRcdFx0aWYgKCBuYW1lLmluZGV4T2YoIFwiZGF0YS1cIiApID09PSAwICkge1xuXHRcdFx0XHRcdFx0XHRcdG5hbWUgPSBjYW1lbENhc2UoIG5hbWUuc2xpY2UoIDUgKSApO1xuXHRcdFx0XHRcdFx0XHRcdGRhdGFBdHRyKCBlbGVtLCBuYW1lLCBkYXRhWyBuYW1lIF0gKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhUHJpdi5zZXQoIGVsZW0sIFwiaGFzRGF0YUF0dHJzXCIsIHRydWUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZGF0YTtcblx0XHR9XG5cblx0XHQvLyBTZXRzIG11bHRpcGxlIHZhbHVlc1xuXHRcdGlmICggdHlwZW9mIGtleSA9PT0gXCJvYmplY3RcIiApIHtcblx0XHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkYXRhVXNlci5zZXQoIHRoaXMsIGtleSApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBhY2Nlc3MoIHRoaXMsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHRcdHZhciBkYXRhO1xuXG5cdFx0XHQvLyBUaGUgY2FsbGluZyBqUXVlcnkgb2JqZWN0IChlbGVtZW50IG1hdGNoZXMpIGlzIG5vdCBlbXB0eVxuXHRcdFx0Ly8gKGFuZCB0aGVyZWZvcmUgaGFzIGFuIGVsZW1lbnQgYXBwZWFycyBhdCB0aGlzWyAwIF0pIGFuZCB0aGVcblx0XHRcdC8vIGB2YWx1ZWAgcGFyYW1ldGVyIHdhcyBub3QgdW5kZWZpbmVkLiBBbiBlbXB0eSBqUXVlcnkgb2JqZWN0XG5cdFx0XHQvLyB3aWxsIHJlc3VsdCBpbiBgdW5kZWZpbmVkYCBmb3IgZWxlbSA9IHRoaXNbIDAgXSB3aGljaCB3aWxsXG5cdFx0XHQvLyB0aHJvdyBhbiBleGNlcHRpb24gaWYgYW4gYXR0ZW1wdCB0byByZWFkIGEgZGF0YSBjYWNoZSBpcyBtYWRlLlxuXHRcdFx0aWYgKCBlbGVtICYmIHZhbHVlID09PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0Ly8gQXR0ZW1wdCB0byBnZXQgZGF0YSBmcm9tIHRoZSBjYWNoZVxuXHRcdFx0XHQvLyBUaGUga2V5IHdpbGwgYWx3YXlzIGJlIGNhbWVsQ2FzZWQgaW4gRGF0YVxuXHRcdFx0XHRkYXRhID0gZGF0YVVzZXIuZ2V0KCBlbGVtLCBrZXkgKTtcblx0XHRcdFx0aWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBBdHRlbXB0IHRvIFwiZGlzY292ZXJcIiB0aGUgZGF0YSBpblxuXHRcdFx0XHQvLyBIVE1MNSBjdXN0b20gZGF0YS0qIGF0dHJzXG5cdFx0XHRcdGRhdGEgPSBkYXRhQXR0ciggZWxlbSwga2V5ICk7XG5cdFx0XHRcdGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gV2UgdHJpZWQgcmVhbGx5IGhhcmQsIGJ1dCB0aGUgZGF0YSBkb2Vzbid0IGV4aXN0LlxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNldCB0aGUgZGF0YS4uLlxuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBXZSBhbHdheXMgc3RvcmUgdGhlIGNhbWVsQ2FzZWQga2V5XG5cdFx0XHRcdGRhdGFVc2VyLnNldCggdGhpcywga2V5LCB2YWx1ZSApO1xuXHRcdFx0fSApO1xuXHRcdH0sIG51bGwsIHZhbHVlLCBhcmd1bWVudHMubGVuZ3RoID4gMSwgbnVsbCwgdHJ1ZSApO1xuXHR9LFxuXG5cdHJlbW92ZURhdGE6IGZ1bmN0aW9uKCBrZXkgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkYXRhVXNlci5yZW1vdmUoIHRoaXMsIGtleSApO1xuXHRcdH0gKTtcblx0fVxufSApO1xuXG5cbmpRdWVyeS5leHRlbmQoIHtcblx0cXVldWU6IGZ1bmN0aW9uKCBlbGVtLCB0eXBlLCBkYXRhICkge1xuXHRcdHZhciBxdWV1ZTtcblxuXHRcdGlmICggZWxlbSApIHtcblx0XHRcdHR5cGUgPSAoIHR5cGUgfHwgXCJmeFwiICkgKyBcInF1ZXVlXCI7XG5cdFx0XHRxdWV1ZSA9IGRhdGFQcml2LmdldCggZWxlbSwgdHlwZSApO1xuXG5cdFx0XHQvLyBTcGVlZCB1cCBkZXF1ZXVlIGJ5IGdldHRpbmcgb3V0IHF1aWNrbHkgaWYgdGhpcyBpcyBqdXN0IGEgbG9va3VwXG5cdFx0XHRpZiAoIGRhdGEgKSB7XG5cdFx0XHRcdGlmICggIXF1ZXVlIHx8IEFycmF5LmlzQXJyYXkoIGRhdGEgKSApIHtcblx0XHRcdFx0XHRxdWV1ZSA9IGRhdGFQcml2LmFjY2VzcyggZWxlbSwgdHlwZSwgalF1ZXJ5Lm1ha2VBcnJheSggZGF0YSApICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cXVldWUucHVzaCggZGF0YSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcXVldWUgfHwgW107XG5cdFx0fVxuXHR9LFxuXG5cdGRlcXVldWU6IGZ1bmN0aW9uKCBlbGVtLCB0eXBlICkge1xuXHRcdHR5cGUgPSB0eXBlIHx8IFwiZnhcIjtcblxuXHRcdHZhciBxdWV1ZSA9IGpRdWVyeS5xdWV1ZSggZWxlbSwgdHlwZSApLFxuXHRcdFx0c3RhcnRMZW5ndGggPSBxdWV1ZS5sZW5ndGgsXG5cdFx0XHRmbiA9IHF1ZXVlLnNoaWZ0KCksXG5cdFx0XHRob29rcyA9IGpRdWVyeS5fcXVldWVIb29rcyggZWxlbSwgdHlwZSApLFxuXHRcdFx0bmV4dCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRqUXVlcnkuZGVxdWV1ZSggZWxlbSwgdHlwZSApO1xuXHRcdFx0fTtcblxuXHRcdC8vIElmIHRoZSBmeCBxdWV1ZSBpcyBkZXF1ZXVlZCwgYWx3YXlzIHJlbW92ZSB0aGUgcHJvZ3Jlc3Mgc2VudGluZWxcblx0XHRpZiAoIGZuID09PSBcImlucHJvZ3Jlc3NcIiApIHtcblx0XHRcdGZuID0gcXVldWUuc2hpZnQoKTtcblx0XHRcdHN0YXJ0TGVuZ3RoLS07XG5cdFx0fVxuXG5cdFx0aWYgKCBmbiApIHtcblxuXHRcdFx0Ly8gQWRkIGEgcHJvZ3Jlc3Mgc2VudGluZWwgdG8gcHJldmVudCB0aGUgZnggcXVldWUgZnJvbSBiZWluZ1xuXHRcdFx0Ly8gYXV0b21hdGljYWxseSBkZXF1ZXVlZFxuXHRcdFx0aWYgKCB0eXBlID09PSBcImZ4XCIgKSB7XG5cdFx0XHRcdHF1ZXVlLnVuc2hpZnQoIFwiaW5wcm9ncmVzc1wiICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENsZWFyIHVwIHRoZSBsYXN0IHF1ZXVlIHN0b3AgZnVuY3Rpb25cblx0XHRcdGRlbGV0ZSBob29rcy5zdG9wO1xuXHRcdFx0Zm4uY2FsbCggZWxlbSwgbmV4dCwgaG9va3MgKTtcblx0XHR9XG5cblx0XHRpZiAoICFzdGFydExlbmd0aCAmJiBob29rcyApIHtcblx0XHRcdGhvb2tzLmVtcHR5LmZpcmUoKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gTm90IHB1YmxpYyAtIGdlbmVyYXRlIGEgcXVldWVIb29rcyBvYmplY3QsIG9yIHJldHVybiB0aGUgY3VycmVudCBvbmVcblx0X3F1ZXVlSG9va3M6IGZ1bmN0aW9uKCBlbGVtLCB0eXBlICkge1xuXHRcdHZhciBrZXkgPSB0eXBlICsgXCJxdWV1ZUhvb2tzXCI7XG5cdFx0cmV0dXJuIGRhdGFQcml2LmdldCggZWxlbSwga2V5ICkgfHwgZGF0YVByaXYuYWNjZXNzKCBlbGVtLCBrZXksIHtcblx0XHRcdGVtcHR5OiBqUXVlcnkuQ2FsbGJhY2tzKCBcIm9uY2UgbWVtb3J5XCIgKS5hZGQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkYXRhUHJpdi5yZW1vdmUoIGVsZW0sIFsgdHlwZSArIFwicXVldWVcIiwga2V5IF0gKTtcblx0XHRcdH0gKVxuXHRcdH0gKTtcblx0fVxufSApO1xuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdHF1ZXVlOiBmdW5jdGlvbiggdHlwZSwgZGF0YSApIHtcblx0XHR2YXIgc2V0dGVyID0gMjtcblxuXHRcdGlmICggdHlwZW9mIHR5cGUgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRkYXRhID0gdHlwZTtcblx0XHRcdHR5cGUgPSBcImZ4XCI7XG5cdFx0XHRzZXR0ZXItLTtcblx0XHR9XG5cblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPCBzZXR0ZXIgKSB7XG5cdFx0XHRyZXR1cm4galF1ZXJ5LnF1ZXVlKCB0aGlzWyAwIF0sIHR5cGUgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGF0YSA9PT0gdW5kZWZpbmVkID9cblx0XHRcdHRoaXMgOlxuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHF1ZXVlID0galF1ZXJ5LnF1ZXVlKCB0aGlzLCB0eXBlLCBkYXRhICk7XG5cblx0XHRcdFx0Ly8gRW5zdXJlIGEgaG9va3MgZm9yIHRoaXMgcXVldWVcblx0XHRcdFx0alF1ZXJ5Ll9xdWV1ZUhvb2tzKCB0aGlzLCB0eXBlICk7XG5cblx0XHRcdFx0aWYgKCB0eXBlID09PSBcImZ4XCIgJiYgcXVldWVbIDAgXSAhPT0gXCJpbnByb2dyZXNzXCIgKSB7XG5cdFx0XHRcdFx0alF1ZXJ5LmRlcXVldWUoIHRoaXMsIHR5cGUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHR9LFxuXHRkZXF1ZXVlOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdGpRdWVyeS5kZXF1ZXVlKCB0aGlzLCB0eXBlICk7XG5cdFx0fSApO1xuXHR9LFxuXHRjbGVhclF1ZXVlOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHRyZXR1cm4gdGhpcy5xdWV1ZSggdHlwZSB8fCBcImZ4XCIsIFtdICk7XG5cdH0sXG5cblx0Ly8gR2V0IGEgcHJvbWlzZSByZXNvbHZlZCB3aGVuIHF1ZXVlcyBvZiBhIGNlcnRhaW4gdHlwZVxuXHQvLyBhcmUgZW1wdGllZCAoZnggaXMgdGhlIHR5cGUgYnkgZGVmYXVsdClcblx0cHJvbWlzZTogZnVuY3Rpb24oIHR5cGUsIG9iaiApIHtcblx0XHR2YXIgdG1wLFxuXHRcdFx0Y291bnQgPSAxLFxuXHRcdFx0ZGVmZXIgPSBqUXVlcnkuRGVmZXJyZWQoKSxcblx0XHRcdGVsZW1lbnRzID0gdGhpcyxcblx0XHRcdGkgPSB0aGlzLmxlbmd0aCxcblx0XHRcdHJlc29sdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCAhKCAtLWNvdW50ICkgKSB7XG5cdFx0XHRcdFx0ZGVmZXIucmVzb2x2ZVdpdGgoIGVsZW1lbnRzLCBbIGVsZW1lbnRzIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdGlmICggdHlwZW9mIHR5cGUgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRvYmogPSB0eXBlO1xuXHRcdFx0dHlwZSA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0dHlwZSA9IHR5cGUgfHwgXCJmeFwiO1xuXG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR0bXAgPSBkYXRhUHJpdi5nZXQoIGVsZW1lbnRzWyBpIF0sIHR5cGUgKyBcInF1ZXVlSG9va3NcIiApO1xuXHRcdFx0aWYgKCB0bXAgJiYgdG1wLmVtcHR5ICkge1xuXHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHR0bXAuZW1wdHkuYWRkKCByZXNvbHZlICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJlc29sdmUoKTtcblx0XHRyZXR1cm4gZGVmZXIucHJvbWlzZSggb2JqICk7XG5cdH1cbn0gKTtcbnZhciBwbnVtID0gKCAvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLyApLnNvdXJjZTtcblxudmFyIHJjc3NOdW0gPSBuZXcgUmVnRXhwKCBcIl4oPzooWystXSk9fCkoXCIgKyBwbnVtICsgXCIpKFthLXolXSopJFwiLCBcImlcIiApO1xuXG5cbnZhciBjc3NFeHBhbmQgPSBbIFwiVG9wXCIsIFwiUmlnaHRcIiwgXCJCb3R0b21cIiwgXCJMZWZ0XCIgXTtcblxudmFyIGRvY3VtZW50RWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXG5cblx0dmFyIGlzQXR0YWNoZWQgPSBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdHJldHVybiBqUXVlcnkuY29udGFpbnMoIGVsZW0ub3duZXJEb2N1bWVudCwgZWxlbSApO1xuXHRcdH0sXG5cdFx0Y29tcG9zZWQgPSB7IGNvbXBvc2VkOiB0cnVlIH07XG5cblx0Ly8gU3VwcG9ydDogSUUgOSAtIDExKywgRWRnZSAxMiAtIDE4KywgaU9TIDEwLjAgLSAxMC4yIG9ubHlcblx0Ly8gQ2hlY2sgYXR0YWNobWVudCBhY3Jvc3Mgc2hhZG93IERPTSBib3VuZGFyaWVzIHdoZW4gcG9zc2libGUgKGdoLTM1MDQpXG5cdC8vIFN1cHBvcnQ6IGlPUyAxMC4wLTEwLjIgb25seVxuXHQvLyBFYXJseSBpT1MgMTAgdmVyc2lvbnMgc3VwcG9ydCBgYXR0YWNoU2hhZG93YCBidXQgbm90IGBnZXRSb290Tm9kZWAsXG5cdC8vIGxlYWRpbmcgdG8gZXJyb3JzLiBXZSBuZWVkIHRvIGNoZWNrIGZvciBgZ2V0Um9vdE5vZGVgLlxuXHRpZiAoIGRvY3VtZW50RWxlbWVudC5nZXRSb290Tm9kZSApIHtcblx0XHRpc0F0dGFjaGVkID0gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4galF1ZXJ5LmNvbnRhaW5zKCBlbGVtLm93bmVyRG9jdW1lbnQsIGVsZW0gKSB8fFxuXHRcdFx0XHRlbGVtLmdldFJvb3ROb2RlKCBjb21wb3NlZCApID09PSBlbGVtLm93bmVyRG9jdW1lbnQ7XG5cdFx0fTtcblx0fVxudmFyIGlzSGlkZGVuV2l0aGluVHJlZSA9IGZ1bmN0aW9uKCBlbGVtLCBlbCApIHtcblxuXHRcdC8vIGlzSGlkZGVuV2l0aGluVHJlZSBtaWdodCBiZSBjYWxsZWQgZnJvbSBqUXVlcnkjZmlsdGVyIGZ1bmN0aW9uO1xuXHRcdC8vIGluIHRoYXQgY2FzZSwgZWxlbWVudCB3aWxsIGJlIHNlY29uZCBhcmd1bWVudFxuXHRcdGVsZW0gPSBlbCB8fCBlbGVtO1xuXG5cdFx0Ly8gSW5saW5lIHN0eWxlIHRydW1wcyBhbGxcblx0XHRyZXR1cm4gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fFxuXHRcdFx0ZWxlbS5zdHlsZS5kaXNwbGF5ID09PSBcIlwiICYmXG5cblx0XHRcdC8vIE90aGVyd2lzZSwgY2hlY2sgY29tcHV0ZWQgc3R5bGVcblx0XHRcdC8vIFN1cHBvcnQ6IEZpcmVmb3ggPD00MyAtIDQ1XG5cdFx0XHQvLyBEaXNjb25uZWN0ZWQgZWxlbWVudHMgY2FuIGhhdmUgY29tcHV0ZWQgZGlzcGxheTogbm9uZSwgc28gZmlyc3QgY29uZmlybSB0aGF0IGVsZW0gaXNcblx0XHRcdC8vIGluIHRoZSBkb2N1bWVudC5cblx0XHRcdGlzQXR0YWNoZWQoIGVsZW0gKSAmJlxuXG5cdFx0XHRqUXVlcnkuY3NzKCBlbGVtLCBcImRpc3BsYXlcIiApID09PSBcIm5vbmVcIjtcblx0fTtcblxuXG5cbmZ1bmN0aW9uIGFkanVzdENTUyggZWxlbSwgcHJvcCwgdmFsdWVQYXJ0cywgdHdlZW4gKSB7XG5cdHZhciBhZGp1c3RlZCwgc2NhbGUsXG5cdFx0bWF4SXRlcmF0aW9ucyA9IDIwLFxuXHRcdGN1cnJlbnRWYWx1ZSA9IHR3ZWVuID9cblx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdHdlZW4uY3VyKCk7XG5cdFx0XHR9IDpcblx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4galF1ZXJ5LmNzcyggZWxlbSwgcHJvcCwgXCJcIiApO1xuXHRcdFx0fSxcblx0XHRpbml0aWFsID0gY3VycmVudFZhbHVlKCksXG5cdFx0dW5pdCA9IHZhbHVlUGFydHMgJiYgdmFsdWVQYXJ0c1sgMyBdIHx8ICggalF1ZXJ5LmNzc051bWJlclsgcHJvcCBdID8gXCJcIiA6IFwicHhcIiApLFxuXG5cdFx0Ly8gU3RhcnRpbmcgdmFsdWUgY29tcHV0YXRpb24gaXMgcmVxdWlyZWQgZm9yIHBvdGVudGlhbCB1bml0IG1pc21hdGNoZXNcblx0XHRpbml0aWFsSW5Vbml0ID0gZWxlbS5ub2RlVHlwZSAmJlxuXHRcdFx0KCBqUXVlcnkuY3NzTnVtYmVyWyBwcm9wIF0gfHwgdW5pdCAhPT0gXCJweFwiICYmICtpbml0aWFsICkgJiZcblx0XHRcdHJjc3NOdW0uZXhlYyggalF1ZXJ5LmNzcyggZWxlbSwgcHJvcCApICk7XG5cblx0aWYgKCBpbml0aWFsSW5Vbml0ICYmIGluaXRpYWxJblVuaXRbIDMgXSAhPT0gdW5pdCApIHtcblxuXHRcdC8vIFN1cHBvcnQ6IEZpcmVmb3ggPD01NFxuXHRcdC8vIEhhbHZlIHRoZSBpdGVyYXRpb24gdGFyZ2V0IHZhbHVlIHRvIHByZXZlbnQgaW50ZXJmZXJlbmNlIGZyb20gQ1NTIHVwcGVyIGJvdW5kcyAoZ2gtMjE0NClcblx0XHRpbml0aWFsID0gaW5pdGlhbCAvIDI7XG5cblx0XHQvLyBUcnVzdCB1bml0cyByZXBvcnRlZCBieSBqUXVlcnkuY3NzXG5cdFx0dW5pdCA9IHVuaXQgfHwgaW5pdGlhbEluVW5pdFsgMyBdO1xuXG5cdFx0Ly8gSXRlcmF0aXZlbHkgYXBwcm94aW1hdGUgZnJvbSBhIG5vbnplcm8gc3RhcnRpbmcgcG9pbnRcblx0XHRpbml0aWFsSW5Vbml0ID0gK2luaXRpYWwgfHwgMTtcblxuXHRcdHdoaWxlICggbWF4SXRlcmF0aW9ucy0tICkge1xuXG5cdFx0XHQvLyBFdmFsdWF0ZSBhbmQgdXBkYXRlIG91ciBiZXN0IGd1ZXNzIChkb3VibGluZyBndWVzc2VzIHRoYXQgemVybyBvdXQpLlxuXHRcdFx0Ly8gRmluaXNoIGlmIHRoZSBzY2FsZSBlcXVhbHMgb3IgY3Jvc3NlcyAxIChtYWtpbmcgdGhlIG9sZCpuZXcgcHJvZHVjdCBub24tcG9zaXRpdmUpLlxuXHRcdFx0alF1ZXJ5LnN0eWxlKCBlbGVtLCBwcm9wLCBpbml0aWFsSW5Vbml0ICsgdW5pdCApO1xuXHRcdFx0aWYgKCAoIDEgLSBzY2FsZSApICogKCAxIC0gKCBzY2FsZSA9IGN1cnJlbnRWYWx1ZSgpIC8gaW5pdGlhbCB8fCAwLjUgKSApIDw9IDAgKSB7XG5cdFx0XHRcdG1heEl0ZXJhdGlvbnMgPSAwO1xuXHRcdFx0fVxuXHRcdFx0aW5pdGlhbEluVW5pdCA9IGluaXRpYWxJblVuaXQgLyBzY2FsZTtcblxuXHRcdH1cblxuXHRcdGluaXRpYWxJblVuaXQgPSBpbml0aWFsSW5Vbml0ICogMjtcblx0XHRqUXVlcnkuc3R5bGUoIGVsZW0sIHByb3AsIGluaXRpYWxJblVuaXQgKyB1bml0ICk7XG5cblx0XHQvLyBNYWtlIHN1cmUgd2UgdXBkYXRlIHRoZSB0d2VlbiBwcm9wZXJ0aWVzIGxhdGVyIG9uXG5cdFx0dmFsdWVQYXJ0cyA9IHZhbHVlUGFydHMgfHwgW107XG5cdH1cblxuXHRpZiAoIHZhbHVlUGFydHMgKSB7XG5cdFx0aW5pdGlhbEluVW5pdCA9ICtpbml0aWFsSW5Vbml0IHx8ICtpbml0aWFsIHx8IDA7XG5cblx0XHQvLyBBcHBseSByZWxhdGl2ZSBvZmZzZXQgKCs9Ly09KSBpZiBzcGVjaWZpZWRcblx0XHRhZGp1c3RlZCA9IHZhbHVlUGFydHNbIDEgXSA/XG5cdFx0XHRpbml0aWFsSW5Vbml0ICsgKCB2YWx1ZVBhcnRzWyAxIF0gKyAxICkgKiB2YWx1ZVBhcnRzWyAyIF0gOlxuXHRcdFx0K3ZhbHVlUGFydHNbIDIgXTtcblx0XHRpZiAoIHR3ZWVuICkge1xuXHRcdFx0dHdlZW4udW5pdCA9IHVuaXQ7XG5cdFx0XHR0d2Vlbi5zdGFydCA9IGluaXRpYWxJblVuaXQ7XG5cdFx0XHR0d2Vlbi5lbmQgPSBhZGp1c3RlZDtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGFkanVzdGVkO1xufVxuXG5cbnZhciBkZWZhdWx0RGlzcGxheU1hcCA9IHt9O1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0RGlzcGxheSggZWxlbSApIHtcblx0dmFyIHRlbXAsXG5cdFx0ZG9jID0gZWxlbS5vd25lckRvY3VtZW50LFxuXHRcdG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZSxcblx0XHRkaXNwbGF5ID0gZGVmYXVsdERpc3BsYXlNYXBbIG5vZGVOYW1lIF07XG5cblx0aWYgKCBkaXNwbGF5ICkge1xuXHRcdHJldHVybiBkaXNwbGF5O1xuXHR9XG5cblx0dGVtcCA9IGRvYy5ib2R5LmFwcGVuZENoaWxkKCBkb2MuY3JlYXRlRWxlbWVudCggbm9kZU5hbWUgKSApO1xuXHRkaXNwbGF5ID0galF1ZXJ5LmNzcyggdGVtcCwgXCJkaXNwbGF5XCIgKTtcblxuXHR0ZW1wLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIHRlbXAgKTtcblxuXHRpZiAoIGRpc3BsYXkgPT09IFwibm9uZVwiICkge1xuXHRcdGRpc3BsYXkgPSBcImJsb2NrXCI7XG5cdH1cblx0ZGVmYXVsdERpc3BsYXlNYXBbIG5vZGVOYW1lIF0gPSBkaXNwbGF5O1xuXG5cdHJldHVybiBkaXNwbGF5O1xufVxuXG5mdW5jdGlvbiBzaG93SGlkZSggZWxlbWVudHMsIHNob3cgKSB7XG5cdHZhciBkaXNwbGF5LCBlbGVtLFxuXHRcdHZhbHVlcyA9IFtdLFxuXHRcdGluZGV4ID0gMCxcblx0XHRsZW5ndGggPSBlbGVtZW50cy5sZW5ndGg7XG5cblx0Ly8gRGV0ZXJtaW5lIG5ldyBkaXNwbGF5IHZhbHVlIGZvciBlbGVtZW50cyB0aGF0IG5lZWQgdG8gY2hhbmdlXG5cdGZvciAoIDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KysgKSB7XG5cdFx0ZWxlbSA9IGVsZW1lbnRzWyBpbmRleCBdO1xuXHRcdGlmICggIWVsZW0uc3R5bGUgKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRkaXNwbGF5ID0gZWxlbS5zdHlsZS5kaXNwbGF5O1xuXHRcdGlmICggc2hvdyApIHtcblxuXHRcdFx0Ly8gU2luY2Ugd2UgZm9yY2UgdmlzaWJpbGl0eSB1cG9uIGNhc2NhZGUtaGlkZGVuIGVsZW1lbnRzLCBhbiBpbW1lZGlhdGUgKGFuZCBzbG93KVxuXHRcdFx0Ly8gY2hlY2sgaXMgcmVxdWlyZWQgaW4gdGhpcyBmaXJzdCBsb29wIHVubGVzcyB3ZSBoYXZlIGEgbm9uZW1wdHkgZGlzcGxheSB2YWx1ZSAoZWl0aGVyXG5cdFx0XHQvLyBpbmxpbmUgb3IgYWJvdXQtdG8tYmUtcmVzdG9yZWQpXG5cdFx0XHRpZiAoIGRpc3BsYXkgPT09IFwibm9uZVwiICkge1xuXHRcdFx0XHR2YWx1ZXNbIGluZGV4IF0gPSBkYXRhUHJpdi5nZXQoIGVsZW0sIFwiZGlzcGxheVwiICkgfHwgbnVsbDtcblx0XHRcdFx0aWYgKCAhdmFsdWVzWyBpbmRleCBdICkge1xuXHRcdFx0XHRcdGVsZW0uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggZWxlbS5zdHlsZS5kaXNwbGF5ID09PSBcIlwiICYmIGlzSGlkZGVuV2l0aGluVHJlZSggZWxlbSApICkge1xuXHRcdFx0XHR2YWx1ZXNbIGluZGV4IF0gPSBnZXREZWZhdWx0RGlzcGxheSggZWxlbSApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIGRpc3BsYXkgIT09IFwibm9uZVwiICkge1xuXHRcdFx0XHR2YWx1ZXNbIGluZGV4IF0gPSBcIm5vbmVcIjtcblxuXHRcdFx0XHQvLyBSZW1lbWJlciB3aGF0IHdlJ3JlIG92ZXJ3cml0aW5nXG5cdFx0XHRcdGRhdGFQcml2LnNldCggZWxlbSwgXCJkaXNwbGF5XCIsIGRpc3BsYXkgKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBTZXQgdGhlIGRpc3BsYXkgb2YgdGhlIGVsZW1lbnRzIGluIGEgc2Vjb25kIGxvb3AgdG8gYXZvaWQgY29uc3RhbnQgcmVmbG93XG5cdGZvciAoIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KysgKSB7XG5cdFx0aWYgKCB2YWx1ZXNbIGluZGV4IF0gIT0gbnVsbCApIHtcblx0XHRcdGVsZW1lbnRzWyBpbmRleCBdLnN0eWxlLmRpc3BsYXkgPSB2YWx1ZXNbIGluZGV4IF07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGVsZW1lbnRzO1xufVxuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdHNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzaG93SGlkZSggdGhpcywgdHJ1ZSApO1xuXHR9LFxuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2hvd0hpZGUoIHRoaXMgKTtcblx0fSxcblx0dG9nZ2xlOiBmdW5jdGlvbiggc3RhdGUgKSB7XG5cdFx0aWYgKCB0eXBlb2Ygc3RhdGUgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdFx0cmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggaXNIaWRkZW5XaXRoaW5UcmVlKCB0aGlzICkgKSB7XG5cdFx0XHRcdGpRdWVyeSggdGhpcyApLnNob3coKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpRdWVyeSggdGhpcyApLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH1cbn0gKTtcbnZhciByY2hlY2thYmxlVHlwZSA9ICggL14oPzpjaGVja2JveHxyYWRpbykkL2kgKTtcblxudmFyIHJ0YWdOYW1lID0gKCAvPChbYS16XVteXFwvXFwwPlxceDIwXFx0XFxyXFxuXFxmXSopL2kgKTtcblxudmFyIHJzY3JpcHRUeXBlID0gKCAvXiR8Xm1vZHVsZSR8XFwvKD86amF2YXxlY21hKXNjcmlwdC9pICk7XG5cblxuXG4oIGZ1bmN0aW9uKCkge1xuXHR2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG5cdFx0ZGl2ID0gZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiZGl2XCIgKSApLFxuXHRcdGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJpbnB1dFwiICk7XG5cblx0Ly8gU3VwcG9ydDogQW5kcm9pZCA0LjAgLSA0LjMgb25seVxuXHQvLyBDaGVjayBzdGF0ZSBsb3N0IGlmIHRoZSBuYW1lIGlzIHNldCAodHJhYy0xMTIxNylcblx0Ly8gU3VwcG9ydDogV2luZG93cyBXZWIgQXBwcyAoV1dBKVxuXHQvLyBgbmFtZWAgYW5kIGB0eXBlYCBtdXN0IHVzZSAuc2V0QXR0cmlidXRlIGZvciBXV0EgKHRyYWMtMTQ5MDEpXG5cdGlucHV0LnNldEF0dHJpYnV0ZSggXCJ0eXBlXCIsIFwicmFkaW9cIiApO1xuXHRpbnB1dC5zZXRBdHRyaWJ1dGUoIFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIiApO1xuXHRpbnB1dC5zZXRBdHRyaWJ1dGUoIFwibmFtZVwiLCBcInRcIiApO1xuXG5cdGRpdi5hcHBlbmRDaGlsZCggaW5wdXQgKTtcblxuXHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4xIG9ubHlcblx0Ly8gT2xkZXIgV2ViS2l0IGRvZXNuJ3QgY2xvbmUgY2hlY2tlZCBzdGF0ZSBjb3JyZWN0bHkgaW4gZnJhZ21lbnRzXG5cdHN1cHBvcnQuY2hlY2tDbG9uZSA9IGRpdi5jbG9uZU5vZGUoIHRydWUgKS5jbG9uZU5vZGUoIHRydWUgKS5sYXN0Q2hpbGQuY2hlY2tlZDtcblxuXHQvLyBTdXBwb3J0OiBJRSA8PTExIG9ubHlcblx0Ly8gTWFrZSBzdXJlIHRleHRhcmVhIChhbmQgY2hlY2tib3gpIGRlZmF1bHRWYWx1ZSBpcyBwcm9wZXJseSBjbG9uZWRcblx0ZGl2LmlubmVySFRNTCA9IFwiPHRleHRhcmVhPng8L3RleHRhcmVhPlwiO1xuXHRzdXBwb3J0Lm5vQ2xvbmVDaGVja2VkID0gISFkaXYuY2xvbmVOb2RlKCB0cnVlICkubGFzdENoaWxkLmRlZmF1bHRWYWx1ZTtcblxuXHQvLyBTdXBwb3J0OiBJRSA8PTkgb25seVxuXHQvLyBJRSA8PTkgcmVwbGFjZXMgPG9wdGlvbj4gdGFncyB3aXRoIHRoZWlyIGNvbnRlbnRzIHdoZW4gaW5zZXJ0ZWQgb3V0c2lkZSBvZlxuXHQvLyB0aGUgc2VsZWN0IGVsZW1lbnQuXG5cdGRpdi5pbm5lckhUTUwgPSBcIjxvcHRpb24+PC9vcHRpb24+XCI7XG5cdHN1cHBvcnQub3B0aW9uID0gISFkaXYubGFzdENoaWxkO1xufSApKCk7XG5cblxuLy8gV2UgaGF2ZSB0byBjbG9zZSB0aGVzZSB0YWdzIHRvIHN1cHBvcnQgWEhUTUwgKHRyYWMtMTMyMDApXG52YXIgd3JhcE1hcCA9IHtcblxuXHQvLyBYSFRNTCBwYXJzZXJzIGRvIG5vdCBtYWdpY2FsbHkgaW5zZXJ0IGVsZW1lbnRzIGluIHRoZVxuXHQvLyBzYW1lIHdheSB0aGF0IHRhZyBzb3VwIHBhcnNlcnMgZG8uIFNvIHdlIGNhbm5vdCBzaG9ydGVuXG5cdC8vIHRoaXMgYnkgb21pdHRpbmcgPHRib2R5PiBvciBvdGhlciByZXF1aXJlZCBlbGVtZW50cy5cblx0dGhlYWQ6IFsgMSwgXCI8dGFibGU+XCIsIFwiPC90YWJsZT5cIiBdLFxuXHRjb2w6IFsgMiwgXCI8dGFibGU+PGNvbGdyb3VwPlwiLCBcIjwvY29sZ3JvdXA+PC90YWJsZT5cIiBdLFxuXHR0cjogWyAyLCBcIjx0YWJsZT48dGJvZHk+XCIsIFwiPC90Ym9keT48L3RhYmxlPlwiIF0sXG5cdHRkOiBbIDMsIFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsIFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCIgXSxcblxuXHRfZGVmYXVsdDogWyAwLCBcIlwiLCBcIlwiIF1cbn07XG5cbndyYXBNYXAudGJvZHkgPSB3cmFwTWFwLnRmb290ID0gd3JhcE1hcC5jb2xncm91cCA9IHdyYXBNYXAuY2FwdGlvbiA9IHdyYXBNYXAudGhlYWQ7XG53cmFwTWFwLnRoID0gd3JhcE1hcC50ZDtcblxuLy8gU3VwcG9ydDogSUUgPD05IG9ubHlcbmlmICggIXN1cHBvcnQub3B0aW9uICkge1xuXHR3cmFwTWFwLm9wdGdyb3VwID0gd3JhcE1hcC5vcHRpb24gPSBbIDEsIFwiPHNlbGVjdCBtdWx0aXBsZT0nbXVsdGlwbGUnPlwiLCBcIjwvc2VsZWN0PlwiIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0QWxsKCBjb250ZXh0LCB0YWcgKSB7XG5cblx0Ly8gU3VwcG9ydDogSUUgPD05IC0gMTEgb25seVxuXHQvLyBVc2UgdHlwZW9mIHRvIGF2b2lkIHplcm8tYXJndW1lbnQgbWV0aG9kIGludm9jYXRpb24gb24gaG9zdCBvYmplY3RzICh0cmFjLTE1MTUxKVxuXHR2YXIgcmV0O1xuXG5cdGlmICggdHlwZW9mIGNvbnRleHQuZ2V0RWxlbWVudHNCeVRhZ05hbWUgIT09IFwidW5kZWZpbmVkXCIgKSB7XG5cdFx0cmV0ID0gY29udGV4dC5nZXRFbGVtZW50c0J5VGFnTmFtZSggdGFnIHx8IFwiKlwiICk7XG5cblx0fSBlbHNlIGlmICggdHlwZW9mIGNvbnRleHQucXVlcnlTZWxlY3RvckFsbCAhPT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRyZXQgPSBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoIHRhZyB8fCBcIipcIiApO1xuXG5cdH0gZWxzZSB7XG5cdFx0cmV0ID0gW107XG5cdH1cblxuXHRpZiAoIHRhZyA9PT0gdW5kZWZpbmVkIHx8IHRhZyAmJiBub2RlTmFtZSggY29udGV4dCwgdGFnICkgKSB7XG5cdFx0cmV0dXJuIGpRdWVyeS5tZXJnZSggWyBjb250ZXh0IF0sIHJldCApO1xuXHR9XG5cblx0cmV0dXJuIHJldDtcbn1cblxuXG4vLyBNYXJrIHNjcmlwdHMgYXMgaGF2aW5nIGFscmVhZHkgYmVlbiBldmFsdWF0ZWRcbmZ1bmN0aW9uIHNldEdsb2JhbEV2YWwoIGVsZW1zLCByZWZFbGVtZW50cyApIHtcblx0dmFyIGkgPSAwLFxuXHRcdGwgPSBlbGVtcy5sZW5ndGg7XG5cblx0Zm9yICggOyBpIDwgbDsgaSsrICkge1xuXHRcdGRhdGFQcml2LnNldChcblx0XHRcdGVsZW1zWyBpIF0sXG5cdFx0XHRcImdsb2JhbEV2YWxcIixcblx0XHRcdCFyZWZFbGVtZW50cyB8fCBkYXRhUHJpdi5nZXQoIHJlZkVsZW1lbnRzWyBpIF0sIFwiZ2xvYmFsRXZhbFwiIClcblx0XHQpO1xuXHR9XG59XG5cblxudmFyIHJodG1sID0gLzx8JiM/XFx3KzsvO1xuXG5mdW5jdGlvbiBidWlsZEZyYWdtZW50KCBlbGVtcywgY29udGV4dCwgc2NyaXB0cywgc2VsZWN0aW9uLCBpZ25vcmVkICkge1xuXHR2YXIgZWxlbSwgdG1wLCB0YWcsIHdyYXAsIGF0dGFjaGVkLCBqLFxuXHRcdGZyYWdtZW50ID0gY29udGV4dC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG5cdFx0bm9kZXMgPSBbXSxcblx0XHRpID0gMCxcblx0XHRsID0gZWxlbXMubGVuZ3RoO1xuXG5cdGZvciAoIDsgaSA8IGw7IGkrKyApIHtcblx0XHRlbGVtID0gZWxlbXNbIGkgXTtcblxuXHRcdGlmICggZWxlbSB8fCBlbGVtID09PSAwICkge1xuXG5cdFx0XHQvLyBBZGQgbm9kZXMgZGlyZWN0bHlcblx0XHRcdGlmICggdG9UeXBlKCBlbGVtICkgPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHRcdFx0Ly8gU3VwcG9ydDogQW5kcm9pZCA8PTQuMCBvbmx5LCBQaGFudG9tSlMgMSBvbmx5XG5cdFx0XHRcdC8vIHB1c2guYXBwbHkoXywgYXJyYXlsaWtlKSB0aHJvd3Mgb24gYW5jaWVudCBXZWJLaXRcblx0XHRcdFx0alF1ZXJ5Lm1lcmdlKCBub2RlcywgZWxlbS5ub2RlVHlwZSA/IFsgZWxlbSBdIDogZWxlbSApO1xuXG5cdFx0XHQvLyBDb252ZXJ0IG5vbi1odG1sIGludG8gYSB0ZXh0IG5vZGVcblx0XHRcdH0gZWxzZSBpZiAoICFyaHRtbC50ZXN0KCBlbGVtICkgKSB7XG5cdFx0XHRcdG5vZGVzLnB1c2goIGNvbnRleHQuY3JlYXRlVGV4dE5vZGUoIGVsZW0gKSApO1xuXG5cdFx0XHQvLyBDb252ZXJ0IGh0bWwgaW50byBET00gbm9kZXNcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRtcCA9IHRtcCB8fCBmcmFnbWVudC5hcHBlbmRDaGlsZCggY29udGV4dC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICkgKTtcblxuXHRcdFx0XHQvLyBEZXNlcmlhbGl6ZSBhIHN0YW5kYXJkIHJlcHJlc2VudGF0aW9uXG5cdFx0XHRcdHRhZyA9ICggcnRhZ05hbWUuZXhlYyggZWxlbSApIHx8IFsgXCJcIiwgXCJcIiBdIClbIDEgXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR3cmFwID0gd3JhcE1hcFsgdGFnIF0gfHwgd3JhcE1hcC5fZGVmYXVsdDtcblx0XHRcdFx0dG1wLmlubmVySFRNTCA9IHdyYXBbIDEgXSArIGpRdWVyeS5odG1sUHJlZmlsdGVyKCBlbGVtICkgKyB3cmFwWyAyIF07XG5cblx0XHRcdFx0Ly8gRGVzY2VuZCB0aHJvdWdoIHdyYXBwZXJzIHRvIHRoZSByaWdodCBjb250ZW50XG5cdFx0XHRcdGogPSB3cmFwWyAwIF07XG5cdFx0XHRcdHdoaWxlICggai0tICkge1xuXHRcdFx0XHRcdHRtcCA9IHRtcC5sYXN0Q2hpbGQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4wIG9ubHksIFBoYW50b21KUyAxIG9ubHlcblx0XHRcdFx0Ly8gcHVzaC5hcHBseShfLCBhcnJheWxpa2UpIHRocm93cyBvbiBhbmNpZW50IFdlYktpdFxuXHRcdFx0XHRqUXVlcnkubWVyZ2UoIG5vZGVzLCB0bXAuY2hpbGROb2RlcyApO1xuXG5cdFx0XHRcdC8vIFJlbWVtYmVyIHRoZSB0b3AtbGV2ZWwgY29udGFpbmVyXG5cdFx0XHRcdHRtcCA9IGZyYWdtZW50LmZpcnN0Q2hpbGQ7XG5cblx0XHRcdFx0Ly8gRW5zdXJlIHRoZSBjcmVhdGVkIG5vZGVzIGFyZSBvcnBoYW5lZCAodHJhYy0xMjM5Milcblx0XHRcdFx0dG1wLnRleHRDb250ZW50ID0gXCJcIjtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZW1vdmUgd3JhcHBlciBmcm9tIGZyYWdtZW50XG5cdGZyYWdtZW50LnRleHRDb250ZW50ID0gXCJcIjtcblxuXHRpID0gMDtcblx0d2hpbGUgKCAoIGVsZW0gPSBub2Rlc1sgaSsrIF0gKSApIHtcblxuXHRcdC8vIFNraXAgZWxlbWVudHMgYWxyZWFkeSBpbiB0aGUgY29udGV4dCBjb2xsZWN0aW9uICh0cmFjLTQwODcpXG5cdFx0aWYgKCBzZWxlY3Rpb24gJiYgalF1ZXJ5LmluQXJyYXkoIGVsZW0sIHNlbGVjdGlvbiApID4gLTEgKSB7XG5cdFx0XHRpZiAoIGlnbm9yZWQgKSB7XG5cdFx0XHRcdGlnbm9yZWQucHVzaCggZWxlbSApO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0YXR0YWNoZWQgPSBpc0F0dGFjaGVkKCBlbGVtICk7XG5cblx0XHQvLyBBcHBlbmQgdG8gZnJhZ21lbnRcblx0XHR0bXAgPSBnZXRBbGwoIGZyYWdtZW50LmFwcGVuZENoaWxkKCBlbGVtICksIFwic2NyaXB0XCIgKTtcblxuXHRcdC8vIFByZXNlcnZlIHNjcmlwdCBldmFsdWF0aW9uIGhpc3Rvcnlcblx0XHRpZiAoIGF0dGFjaGVkICkge1xuXHRcdFx0c2V0R2xvYmFsRXZhbCggdG1wICk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2FwdHVyZSBleGVjdXRhYmxlc1xuXHRcdGlmICggc2NyaXB0cyApIHtcblx0XHRcdGogPSAwO1xuXHRcdFx0d2hpbGUgKCAoIGVsZW0gPSB0bXBbIGorKyBdICkgKSB7XG5cdFx0XHRcdGlmICggcnNjcmlwdFR5cGUudGVzdCggZWxlbS50eXBlIHx8IFwiXCIgKSApIHtcblx0XHRcdFx0XHRzY3JpcHRzLnB1c2goIGVsZW0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBmcmFnbWVudDtcbn1cblxuXG52YXIgcnR5cGVuYW1lc3BhY2UgPSAvXihbXi5dKikoPzpcXC4oLispfCkvO1xuXG5mdW5jdGlvbiByZXR1cm5UcnVlKCkge1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmV0dXJuRmFsc2UoKSB7XG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gb24oIGVsZW0sIHR5cGVzLCBzZWxlY3RvciwgZGF0YSwgZm4sIG9uZSApIHtcblx0dmFyIG9yaWdGbiwgdHlwZTtcblxuXHQvLyBUeXBlcyBjYW4gYmUgYSBtYXAgb2YgdHlwZXMvaGFuZGxlcnNcblx0aWYgKCB0eXBlb2YgdHlwZXMgPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHQvLyAoIHR5cGVzLU9iamVjdCwgc2VsZWN0b3IsIGRhdGEgKVxuXHRcdGlmICggdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiICkge1xuXG5cdFx0XHQvLyAoIHR5cGVzLU9iamVjdCwgZGF0YSApXG5cdFx0XHRkYXRhID0gZGF0YSB8fCBzZWxlY3Rvcjtcblx0XHRcdHNlbGVjdG9yID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRmb3IgKCB0eXBlIGluIHR5cGVzICkge1xuXHRcdFx0b24oIGVsZW0sIHR5cGUsIHNlbGVjdG9yLCBkYXRhLCB0eXBlc1sgdHlwZSBdLCBvbmUgKTtcblx0XHR9XG5cdFx0cmV0dXJuIGVsZW07XG5cdH1cblxuXHRpZiAoIGRhdGEgPT0gbnVsbCAmJiBmbiA9PSBudWxsICkge1xuXG5cdFx0Ly8gKCB0eXBlcywgZm4gKVxuXHRcdGZuID0gc2VsZWN0b3I7XG5cdFx0ZGF0YSA9IHNlbGVjdG9yID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKCBmbiA9PSBudWxsICkge1xuXHRcdGlmICggdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiICkge1xuXG5cdFx0XHQvLyAoIHR5cGVzLCBzZWxlY3RvciwgZm4gKVxuXHRcdFx0Zm4gPSBkYXRhO1xuXHRcdFx0ZGF0YSA9IHVuZGVmaW5lZDtcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyAoIHR5cGVzLCBkYXRhLCBmbiApXG5cdFx0XHRmbiA9IGRhdGE7XG5cdFx0XHRkYXRhID0gc2VsZWN0b3I7XG5cdFx0XHRzZWxlY3RvciA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH1cblx0aWYgKCBmbiA9PT0gZmFsc2UgKSB7XG5cdFx0Zm4gPSByZXR1cm5GYWxzZTtcblx0fSBlbHNlIGlmICggIWZuICkge1xuXHRcdHJldHVybiBlbGVtO1xuXHR9XG5cblx0aWYgKCBvbmUgPT09IDEgKSB7XG5cdFx0b3JpZ0ZuID0gZm47XG5cdFx0Zm4gPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRcdC8vIENhbiB1c2UgYW4gZW1wdHkgc2V0LCBzaW5jZSBldmVudCBjb250YWlucyB0aGUgaW5mb1xuXHRcdFx0alF1ZXJ5KCkub2ZmKCBldmVudCApO1xuXHRcdFx0cmV0dXJuIG9yaWdGbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0fTtcblxuXHRcdC8vIFVzZSBzYW1lIGd1aWQgc28gY2FsbGVyIGNhbiByZW1vdmUgdXNpbmcgb3JpZ0ZuXG5cdFx0Zm4uZ3VpZCA9IG9yaWdGbi5ndWlkIHx8ICggb3JpZ0ZuLmd1aWQgPSBqUXVlcnkuZ3VpZCsrICk7XG5cdH1cblx0cmV0dXJuIGVsZW0uZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0alF1ZXJ5LmV2ZW50LmFkZCggdGhpcywgdHlwZXMsIGZuLCBkYXRhLCBzZWxlY3RvciApO1xuXHR9ICk7XG59XG5cbi8qXG4gKiBIZWxwZXIgZnVuY3Rpb25zIGZvciBtYW5hZ2luZyBldmVudHMgLS0gbm90IHBhcnQgb2YgdGhlIHB1YmxpYyBpbnRlcmZhY2UuXG4gKiBQcm9wcyB0byBEZWFuIEVkd2FyZHMnIGFkZEV2ZW50IGxpYnJhcnkgZm9yIG1hbnkgb2YgdGhlIGlkZWFzLlxuICovXG5qUXVlcnkuZXZlbnQgPSB7XG5cblx0Z2xvYmFsOiB7fSxcblxuXHRhZGQ6IGZ1bmN0aW9uKCBlbGVtLCB0eXBlcywgaGFuZGxlciwgZGF0YSwgc2VsZWN0b3IgKSB7XG5cblx0XHR2YXIgaGFuZGxlT2JqSW4sIGV2ZW50SGFuZGxlLCB0bXAsXG5cdFx0XHRldmVudHMsIHQsIGhhbmRsZU9iaixcblx0XHRcdHNwZWNpYWwsIGhhbmRsZXJzLCB0eXBlLCBuYW1lc3BhY2VzLCBvcmlnVHlwZSxcblx0XHRcdGVsZW1EYXRhID0gZGF0YVByaXYuZ2V0KCBlbGVtICk7XG5cblx0XHQvLyBPbmx5IGF0dGFjaCBldmVudHMgdG8gb2JqZWN0cyB0aGF0IGFjY2VwdCBkYXRhXG5cdFx0aWYgKCAhYWNjZXB0RGF0YSggZWxlbSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENhbGxlciBjYW4gcGFzcyBpbiBhbiBvYmplY3Qgb2YgY3VzdG9tIGRhdGEgaW4gbGlldSBvZiB0aGUgaGFuZGxlclxuXHRcdGlmICggaGFuZGxlci5oYW5kbGVyICkge1xuXHRcdFx0aGFuZGxlT2JqSW4gPSBoYW5kbGVyO1xuXHRcdFx0aGFuZGxlciA9IGhhbmRsZU9iakluLmhhbmRsZXI7XG5cdFx0XHRzZWxlY3RvciA9IGhhbmRsZU9iakluLnNlbGVjdG9yO1xuXHRcdH1cblxuXHRcdC8vIEVuc3VyZSB0aGF0IGludmFsaWQgc2VsZWN0b3JzIHRocm93IGV4Y2VwdGlvbnMgYXQgYXR0YWNoIHRpbWVcblx0XHQvLyBFdmFsdWF0ZSBhZ2FpbnN0IGRvY3VtZW50RWxlbWVudCBpbiBjYXNlIGVsZW0gaXMgYSBub24tZWxlbWVudCBub2RlIChlLmcuLCBkb2N1bWVudClcblx0XHRpZiAoIHNlbGVjdG9yICkge1xuXHRcdFx0alF1ZXJ5LmZpbmQubWF0Y2hlc1NlbGVjdG9yKCBkb2N1bWVudEVsZW1lbnQsIHNlbGVjdG9yICk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFrZSBzdXJlIHRoYXQgdGhlIGhhbmRsZXIgaGFzIGEgdW5pcXVlIElELCB1c2VkIHRvIGZpbmQvcmVtb3ZlIGl0IGxhdGVyXG5cdFx0aWYgKCAhaGFuZGxlci5ndWlkICkge1xuXHRcdFx0aGFuZGxlci5ndWlkID0galF1ZXJ5Lmd1aWQrKztcblx0XHR9XG5cblx0XHQvLyBJbml0IHRoZSBlbGVtZW50J3MgZXZlbnQgc3RydWN0dXJlIGFuZCBtYWluIGhhbmRsZXIsIGlmIHRoaXMgaXMgdGhlIGZpcnN0XG5cdFx0aWYgKCAhKCBldmVudHMgPSBlbGVtRGF0YS5ldmVudHMgKSApIHtcblx0XHRcdGV2ZW50cyA9IGVsZW1EYXRhLmV2ZW50cyA9IE9iamVjdC5jcmVhdGUoIG51bGwgKTtcblx0XHR9XG5cdFx0aWYgKCAhKCBldmVudEhhbmRsZSA9IGVsZW1EYXRhLmhhbmRsZSApICkge1xuXHRcdFx0ZXZlbnRIYW5kbGUgPSBlbGVtRGF0YS5oYW5kbGUgPSBmdW5jdGlvbiggZSApIHtcblxuXHRcdFx0XHQvLyBEaXNjYXJkIHRoZSBzZWNvbmQgZXZlbnQgb2YgYSBqUXVlcnkuZXZlbnQudHJpZ2dlcigpIGFuZFxuXHRcdFx0XHQvLyB3aGVuIGFuIGV2ZW50IGlzIGNhbGxlZCBhZnRlciBhIHBhZ2UgaGFzIHVubG9hZGVkXG5cdFx0XHRcdHJldHVybiB0eXBlb2YgalF1ZXJ5ICE9PSBcInVuZGVmaW5lZFwiICYmIGpRdWVyeS5ldmVudC50cmlnZ2VyZWQgIT09IGUudHlwZSA/XG5cdFx0XHRcdFx0alF1ZXJ5LmV2ZW50LmRpc3BhdGNoLmFwcGx5KCBlbGVtLCBhcmd1bWVudHMgKSA6IHVuZGVmaW5lZDtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIG11bHRpcGxlIGV2ZW50cyBzZXBhcmF0ZWQgYnkgYSBzcGFjZVxuXHRcdHR5cGVzID0gKCB0eXBlcyB8fCBcIlwiICkubWF0Y2goIHJub3RodG1sd2hpdGUgKSB8fCBbIFwiXCIgXTtcblx0XHR0ID0gdHlwZXMubGVuZ3RoO1xuXHRcdHdoaWxlICggdC0tICkge1xuXHRcdFx0dG1wID0gcnR5cGVuYW1lc3BhY2UuZXhlYyggdHlwZXNbIHQgXSApIHx8IFtdO1xuXHRcdFx0dHlwZSA9IG9yaWdUeXBlID0gdG1wWyAxIF07XG5cdFx0XHRuYW1lc3BhY2VzID0gKCB0bXBbIDIgXSB8fCBcIlwiICkuc3BsaXQoIFwiLlwiICkuc29ydCgpO1xuXG5cdFx0XHQvLyBUaGVyZSAqbXVzdCogYmUgYSB0eXBlLCBubyBhdHRhY2hpbmcgbmFtZXNwYWNlLW9ubHkgaGFuZGxlcnNcblx0XHRcdGlmICggIXR5cGUgKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBldmVudCBjaGFuZ2VzIGl0cyB0eXBlLCB1c2UgdGhlIHNwZWNpYWwgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBjaGFuZ2VkIHR5cGVcblx0XHRcdHNwZWNpYWwgPSBqUXVlcnkuZXZlbnQuc3BlY2lhbFsgdHlwZSBdIHx8IHt9O1xuXG5cdFx0XHQvLyBJZiBzZWxlY3RvciBkZWZpbmVkLCBkZXRlcm1pbmUgc3BlY2lhbCBldmVudCBhcGkgdHlwZSwgb3RoZXJ3aXNlIGdpdmVuIHR5cGVcblx0XHRcdHR5cGUgPSAoIHNlbGVjdG9yID8gc3BlY2lhbC5kZWxlZ2F0ZVR5cGUgOiBzcGVjaWFsLmJpbmRUeXBlICkgfHwgdHlwZTtcblxuXHRcdFx0Ly8gVXBkYXRlIHNwZWNpYWwgYmFzZWQgb24gbmV3bHkgcmVzZXQgdHlwZVxuXHRcdFx0c3BlY2lhbCA9IGpRdWVyeS5ldmVudC5zcGVjaWFsWyB0eXBlIF0gfHwge307XG5cblx0XHRcdC8vIGhhbmRsZU9iaiBpcyBwYXNzZWQgdG8gYWxsIGV2ZW50IGhhbmRsZXJzXG5cdFx0XHRoYW5kbGVPYmogPSBqUXVlcnkuZXh0ZW5kKCB7XG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdG9yaWdUeXBlOiBvcmlnVHlwZSxcblx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0aGFuZGxlcjogaGFuZGxlcixcblx0XHRcdFx0Z3VpZDogaGFuZGxlci5ndWlkLFxuXHRcdFx0XHRzZWxlY3Rvcjogc2VsZWN0b3IsXG5cdFx0XHRcdG5lZWRzQ29udGV4dDogc2VsZWN0b3IgJiYgalF1ZXJ5LmV4cHIubWF0Y2gubmVlZHNDb250ZXh0LnRlc3QoIHNlbGVjdG9yICksXG5cdFx0XHRcdG5hbWVzcGFjZTogbmFtZXNwYWNlcy5qb2luKCBcIi5cIiApXG5cdFx0XHR9LCBoYW5kbGVPYmpJbiApO1xuXG5cdFx0XHQvLyBJbml0IHRoZSBldmVudCBoYW5kbGVyIHF1ZXVlIGlmIHdlJ3JlIHRoZSBmaXJzdFxuXHRcdFx0aWYgKCAhKCBoYW5kbGVycyA9IGV2ZW50c1sgdHlwZSBdICkgKSB7XG5cdFx0XHRcdGhhbmRsZXJzID0gZXZlbnRzWyB0eXBlIF0gPSBbXTtcblx0XHRcdFx0aGFuZGxlcnMuZGVsZWdhdGVDb3VudCA9IDA7XG5cblx0XHRcdFx0Ly8gT25seSB1c2UgYWRkRXZlbnRMaXN0ZW5lciBpZiB0aGUgc3BlY2lhbCBldmVudHMgaGFuZGxlciByZXR1cm5zIGZhbHNlXG5cdFx0XHRcdGlmICggIXNwZWNpYWwuc2V0dXAgfHxcblx0XHRcdFx0XHRzcGVjaWFsLnNldHVwLmNhbGwoIGVsZW0sIGRhdGEsIG5hbWVzcGFjZXMsIGV2ZW50SGFuZGxlICkgPT09IGZhbHNlICkge1xuXG5cdFx0XHRcdFx0aWYgKCBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgKSB7XG5cdFx0XHRcdFx0XHRlbGVtLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIGV2ZW50SGFuZGxlICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggc3BlY2lhbC5hZGQgKSB7XG5cdFx0XHRcdHNwZWNpYWwuYWRkLmNhbGwoIGVsZW0sIGhhbmRsZU9iaiApO1xuXG5cdFx0XHRcdGlmICggIWhhbmRsZU9iai5oYW5kbGVyLmd1aWQgKSB7XG5cdFx0XHRcdFx0aGFuZGxlT2JqLmhhbmRsZXIuZ3VpZCA9IGhhbmRsZXIuZ3VpZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGQgdG8gdGhlIGVsZW1lbnQncyBoYW5kbGVyIGxpc3QsIGRlbGVnYXRlcyBpbiBmcm9udFxuXHRcdFx0aWYgKCBzZWxlY3RvciApIHtcblx0XHRcdFx0aGFuZGxlcnMuc3BsaWNlKCBoYW5kbGVycy5kZWxlZ2F0ZUNvdW50KyssIDAsIGhhbmRsZU9iaiApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aGFuZGxlcnMucHVzaCggaGFuZGxlT2JqICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEtlZXAgdHJhY2sgb2Ygd2hpY2ggZXZlbnRzIGhhdmUgZXZlciBiZWVuIHVzZWQsIGZvciBldmVudCBvcHRpbWl6YXRpb25cblx0XHRcdGpRdWVyeS5ldmVudC5nbG9iYWxbIHR5cGUgXSA9IHRydWU7XG5cdFx0fVxuXG5cdH0sXG5cblx0Ly8gRGV0YWNoIGFuIGV2ZW50IG9yIHNldCBvZiBldmVudHMgZnJvbSBhbiBlbGVtZW50XG5cdHJlbW92ZTogZnVuY3Rpb24oIGVsZW0sIHR5cGVzLCBoYW5kbGVyLCBzZWxlY3RvciwgbWFwcGVkVHlwZXMgKSB7XG5cblx0XHR2YXIgaiwgb3JpZ0NvdW50LCB0bXAsXG5cdFx0XHRldmVudHMsIHQsIGhhbmRsZU9iaixcblx0XHRcdHNwZWNpYWwsIGhhbmRsZXJzLCB0eXBlLCBuYW1lc3BhY2VzLCBvcmlnVHlwZSxcblx0XHRcdGVsZW1EYXRhID0gZGF0YVByaXYuaGFzRGF0YSggZWxlbSApICYmIGRhdGFQcml2LmdldCggZWxlbSApO1xuXG5cdFx0aWYgKCAhZWxlbURhdGEgfHwgISggZXZlbnRzID0gZWxlbURhdGEuZXZlbnRzICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gT25jZSBmb3IgZWFjaCB0eXBlLm5hbWVzcGFjZSBpbiB0eXBlczsgdHlwZSBtYXkgYmUgb21pdHRlZFxuXHRcdHR5cGVzID0gKCB0eXBlcyB8fCBcIlwiICkubWF0Y2goIHJub3RodG1sd2hpdGUgKSB8fCBbIFwiXCIgXTtcblx0XHR0ID0gdHlwZXMubGVuZ3RoO1xuXHRcdHdoaWxlICggdC0tICkge1xuXHRcdFx0dG1wID0gcnR5cGVuYW1lc3BhY2UuZXhlYyggdHlwZXNbIHQgXSApIHx8IFtdO1xuXHRcdFx0dHlwZSA9IG9yaWdUeXBlID0gdG1wWyAxIF07XG5cdFx0XHRuYW1lc3BhY2VzID0gKCB0bXBbIDIgXSB8fCBcIlwiICkuc3BsaXQoIFwiLlwiICkuc29ydCgpO1xuXG5cdFx0XHQvLyBVbmJpbmQgYWxsIGV2ZW50cyAob24gdGhpcyBuYW1lc3BhY2UsIGlmIHByb3ZpZGVkKSBmb3IgdGhlIGVsZW1lbnRcblx0XHRcdGlmICggIXR5cGUgKSB7XG5cdFx0XHRcdGZvciAoIHR5cGUgaW4gZXZlbnRzICkge1xuXHRcdFx0XHRcdGpRdWVyeS5ldmVudC5yZW1vdmUoIGVsZW0sIHR5cGUgKyB0eXBlc1sgdCBdLCBoYW5kbGVyLCBzZWxlY3RvciwgdHJ1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRzcGVjaWFsID0galF1ZXJ5LmV2ZW50LnNwZWNpYWxbIHR5cGUgXSB8fCB7fTtcblx0XHRcdHR5cGUgPSAoIHNlbGVjdG9yID8gc3BlY2lhbC5kZWxlZ2F0ZVR5cGUgOiBzcGVjaWFsLmJpbmRUeXBlICkgfHwgdHlwZTtcblx0XHRcdGhhbmRsZXJzID0gZXZlbnRzWyB0eXBlIF0gfHwgW107XG5cdFx0XHR0bXAgPSB0bXBbIDIgXSAmJlxuXHRcdFx0XHRuZXcgUmVnRXhwKCBcIihefFxcXFwuKVwiICsgbmFtZXNwYWNlcy5qb2luKCBcIlxcXFwuKD86LipcXFxcLnwpXCIgKSArIFwiKFxcXFwufCQpXCIgKTtcblxuXHRcdFx0Ly8gUmVtb3ZlIG1hdGNoaW5nIGV2ZW50c1xuXHRcdFx0b3JpZ0NvdW50ID0gaiA9IGhhbmRsZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlICggai0tICkge1xuXHRcdFx0XHRoYW5kbGVPYmogPSBoYW5kbGVyc1sgaiBdO1xuXG5cdFx0XHRcdGlmICggKCBtYXBwZWRUeXBlcyB8fCBvcmlnVHlwZSA9PT0gaGFuZGxlT2JqLm9yaWdUeXBlICkgJiZcblx0XHRcdFx0XHQoICFoYW5kbGVyIHx8IGhhbmRsZXIuZ3VpZCA9PT0gaGFuZGxlT2JqLmd1aWQgKSAmJlxuXHRcdFx0XHRcdCggIXRtcCB8fCB0bXAudGVzdCggaGFuZGxlT2JqLm5hbWVzcGFjZSApICkgJiZcblx0XHRcdFx0XHQoICFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gaGFuZGxlT2JqLnNlbGVjdG9yIHx8XG5cdFx0XHRcdFx0XHRzZWxlY3RvciA9PT0gXCIqKlwiICYmIGhhbmRsZU9iai5zZWxlY3RvciApICkge1xuXHRcdFx0XHRcdGhhbmRsZXJzLnNwbGljZSggaiwgMSApO1xuXG5cdFx0XHRcdFx0aWYgKCBoYW5kbGVPYmouc2VsZWN0b3IgKSB7XG5cdFx0XHRcdFx0XHRoYW5kbGVycy5kZWxlZ2F0ZUNvdW50LS07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICggc3BlY2lhbC5yZW1vdmUgKSB7XG5cdFx0XHRcdFx0XHRzcGVjaWFsLnJlbW92ZS5jYWxsKCBlbGVtLCBoYW5kbGVPYmogKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVtb3ZlIGdlbmVyaWMgZXZlbnQgaGFuZGxlciBpZiB3ZSByZW1vdmVkIHNvbWV0aGluZyBhbmQgbm8gbW9yZSBoYW5kbGVycyBleGlzdFxuXHRcdFx0Ly8gKGF2b2lkcyBwb3RlbnRpYWwgZm9yIGVuZGxlc3MgcmVjdXJzaW9uIGR1cmluZyByZW1vdmFsIG9mIHNwZWNpYWwgZXZlbnQgaGFuZGxlcnMpXG5cdFx0XHRpZiAoIG9yaWdDb3VudCAmJiAhaGFuZGxlcnMubGVuZ3RoICkge1xuXHRcdFx0XHRpZiAoICFzcGVjaWFsLnRlYXJkb3duIHx8XG5cdFx0XHRcdFx0c3BlY2lhbC50ZWFyZG93bi5jYWxsKCBlbGVtLCBuYW1lc3BhY2VzLCBlbGVtRGF0YS5oYW5kbGUgKSA9PT0gZmFsc2UgKSB7XG5cblx0XHRcdFx0XHRqUXVlcnkucmVtb3ZlRXZlbnQoIGVsZW0sIHR5cGUsIGVsZW1EYXRhLmhhbmRsZSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGVsZXRlIGV2ZW50c1sgdHlwZSBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlbW92ZSBkYXRhIGFuZCB0aGUgZXhwYW5kbyBpZiBpdCdzIG5vIGxvbmdlciB1c2VkXG5cdFx0aWYgKCBqUXVlcnkuaXNFbXB0eU9iamVjdCggZXZlbnRzICkgKSB7XG5cdFx0XHRkYXRhUHJpdi5yZW1vdmUoIGVsZW0sIFwiaGFuZGxlIGV2ZW50c1wiICk7XG5cdFx0fVxuXHR9LFxuXG5cdGRpc3BhdGNoOiBmdW5jdGlvbiggbmF0aXZlRXZlbnQgKSB7XG5cblx0XHR2YXIgaSwgaiwgcmV0LCBtYXRjaGVkLCBoYW5kbGVPYmosIGhhbmRsZXJRdWV1ZSxcblx0XHRcdGFyZ3MgPSBuZXcgQXJyYXkoIGFyZ3VtZW50cy5sZW5ndGggKSxcblxuXHRcdFx0Ly8gTWFrZSBhIHdyaXRhYmxlIGpRdWVyeS5FdmVudCBmcm9tIHRoZSBuYXRpdmUgZXZlbnQgb2JqZWN0XG5cdFx0XHRldmVudCA9IGpRdWVyeS5ldmVudC5maXgoIG5hdGl2ZUV2ZW50ICksXG5cblx0XHRcdGhhbmRsZXJzID0gKFxuXHRcdFx0XHRkYXRhUHJpdi5nZXQoIHRoaXMsIFwiZXZlbnRzXCIgKSB8fCBPYmplY3QuY3JlYXRlKCBudWxsIClcblx0XHRcdClbIGV2ZW50LnR5cGUgXSB8fCBbXSxcblx0XHRcdHNwZWNpYWwgPSBqUXVlcnkuZXZlbnQuc3BlY2lhbFsgZXZlbnQudHlwZSBdIHx8IHt9O1xuXG5cdFx0Ly8gVXNlIHRoZSBmaXgtZWQgalF1ZXJ5LkV2ZW50IHJhdGhlciB0aGFuIHRoZSAocmVhZC1vbmx5KSBuYXRpdmUgZXZlbnRcblx0XHRhcmdzWyAwIF0gPSBldmVudDtcblxuXHRcdGZvciAoIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0YXJnc1sgaSBdID0gYXJndW1lbnRzWyBpIF07XG5cdFx0fVxuXG5cdFx0ZXZlbnQuZGVsZWdhdGVUYXJnZXQgPSB0aGlzO1xuXG5cdFx0Ly8gQ2FsbCB0aGUgcHJlRGlzcGF0Y2ggaG9vayBmb3IgdGhlIG1hcHBlZCB0eXBlLCBhbmQgbGV0IGl0IGJhaWwgaWYgZGVzaXJlZFxuXHRcdGlmICggc3BlY2lhbC5wcmVEaXNwYXRjaCAmJiBzcGVjaWFsLnByZURpc3BhdGNoLmNhbGwoIHRoaXMsIGV2ZW50ICkgPT09IGZhbHNlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIERldGVybWluZSBoYW5kbGVyc1xuXHRcdGhhbmRsZXJRdWV1ZSA9IGpRdWVyeS5ldmVudC5oYW5kbGVycy5jYWxsKCB0aGlzLCBldmVudCwgaGFuZGxlcnMgKTtcblxuXHRcdC8vIFJ1biBkZWxlZ2F0ZXMgZmlyc3Q7IHRoZXkgbWF5IHdhbnQgdG8gc3RvcCBwcm9wYWdhdGlvbiBiZW5lYXRoIHVzXG5cdFx0aSA9IDA7XG5cdFx0d2hpbGUgKCAoIG1hdGNoZWQgPSBoYW5kbGVyUXVldWVbIGkrKyBdICkgJiYgIWV2ZW50LmlzUHJvcGFnYXRpb25TdG9wcGVkKCkgKSB7XG5cdFx0XHRldmVudC5jdXJyZW50VGFyZ2V0ID0gbWF0Y2hlZC5lbGVtO1xuXG5cdFx0XHRqID0gMDtcblx0XHRcdHdoaWxlICggKCBoYW5kbGVPYmogPSBtYXRjaGVkLmhhbmRsZXJzWyBqKysgXSApICYmXG5cdFx0XHRcdCFldmVudC5pc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCgpICkge1xuXG5cdFx0XHRcdC8vIElmIHRoZSBldmVudCBpcyBuYW1lc3BhY2VkLCB0aGVuIGVhY2ggaGFuZGxlciBpcyBvbmx5IGludm9rZWQgaWYgaXQgaXNcblx0XHRcdFx0Ly8gc3BlY2lhbGx5IHVuaXZlcnNhbCBvciBpdHMgbmFtZXNwYWNlcyBhcmUgYSBzdXBlcnNldCBvZiB0aGUgZXZlbnQncy5cblx0XHRcdFx0aWYgKCAhZXZlbnQucm5hbWVzcGFjZSB8fCBoYW5kbGVPYmoubmFtZXNwYWNlID09PSBmYWxzZSB8fFxuXHRcdFx0XHRcdGV2ZW50LnJuYW1lc3BhY2UudGVzdCggaGFuZGxlT2JqLm5hbWVzcGFjZSApICkge1xuXG5cdFx0XHRcdFx0ZXZlbnQuaGFuZGxlT2JqID0gaGFuZGxlT2JqO1xuXHRcdFx0XHRcdGV2ZW50LmRhdGEgPSBoYW5kbGVPYmouZGF0YTtcblxuXHRcdFx0XHRcdHJldCA9ICggKCBqUXVlcnkuZXZlbnQuc3BlY2lhbFsgaGFuZGxlT2JqLm9yaWdUeXBlIF0gfHwge30gKS5oYW5kbGUgfHxcblx0XHRcdFx0XHRcdGhhbmRsZU9iai5oYW5kbGVyICkuYXBwbHkoIG1hdGNoZWQuZWxlbSwgYXJncyApO1xuXG5cdFx0XHRcdFx0aWYgKCByZXQgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHRcdGlmICggKCBldmVudC5yZXN1bHQgPSByZXQgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIENhbGwgdGhlIHBvc3REaXNwYXRjaCBob29rIGZvciB0aGUgbWFwcGVkIHR5cGVcblx0XHRpZiAoIHNwZWNpYWwucG9zdERpc3BhdGNoICkge1xuXHRcdFx0c3BlY2lhbC5wb3N0RGlzcGF0Y2guY2FsbCggdGhpcywgZXZlbnQgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXZlbnQucmVzdWx0O1xuXHR9LFxuXG5cdGhhbmRsZXJzOiBmdW5jdGlvbiggZXZlbnQsIGhhbmRsZXJzICkge1xuXHRcdHZhciBpLCBoYW5kbGVPYmosIHNlbCwgbWF0Y2hlZEhhbmRsZXJzLCBtYXRjaGVkU2VsZWN0b3JzLFxuXHRcdFx0aGFuZGxlclF1ZXVlID0gW10sXG5cdFx0XHRkZWxlZ2F0ZUNvdW50ID0gaGFuZGxlcnMuZGVsZWdhdGVDb3VudCxcblx0XHRcdGN1ciA9IGV2ZW50LnRhcmdldDtcblxuXHRcdC8vIEZpbmQgZGVsZWdhdGUgaGFuZGxlcnNcblx0XHRpZiAoIGRlbGVnYXRlQ291bnQgJiZcblxuXHRcdFx0Ly8gU3VwcG9ydDogSUUgPD05XG5cdFx0XHQvLyBCbGFjay1ob2xlIFNWRyA8dXNlPiBpbnN0YW5jZSB0cmVlcyAodHJhYy0xMzE4MClcblx0XHRcdGN1ci5ub2RlVHlwZSAmJlxuXG5cdFx0XHQvLyBTdXBwb3J0OiBGaXJlZm94IDw9NDJcblx0XHRcdC8vIFN1cHByZXNzIHNwZWMtdmlvbGF0aW5nIGNsaWNrcyBpbmRpY2F0aW5nIGEgbm9uLXByaW1hcnkgcG9pbnRlciBidXR0b24gKHRyYWMtMzg2MSlcblx0XHRcdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1FdmVudHMvI2V2ZW50LXR5cGUtY2xpY2tcblx0XHRcdC8vIFN1cHBvcnQ6IElFIDExIG9ubHlcblx0XHRcdC8vIC4uLmJ1dCBub3QgYXJyb3cga2V5IFwiY2xpY2tzXCIgb2YgcmFkaW8gaW5wdXRzLCB3aGljaCBjYW4gaGF2ZSBgYnV0dG9uYCAtMSAoZ2gtMjM0Mylcblx0XHRcdCEoIGV2ZW50LnR5cGUgPT09IFwiY2xpY2tcIiAmJiBldmVudC5idXR0b24gPj0gMSApICkge1xuXG5cdFx0XHRmb3IgKCA7IGN1ciAhPT0gdGhpczsgY3VyID0gY3VyLnBhcmVudE5vZGUgfHwgdGhpcyApIHtcblxuXHRcdFx0XHQvLyBEb24ndCBjaGVjayBub24tZWxlbWVudHMgKHRyYWMtMTMyMDgpXG5cdFx0XHRcdC8vIERvbid0IHByb2Nlc3MgY2xpY2tzIG9uIGRpc2FibGVkIGVsZW1lbnRzICh0cmFjLTY5MTEsIHRyYWMtODE2NSwgdHJhYy0xMTM4MiwgdHJhYy0xMTc2NClcblx0XHRcdFx0aWYgKCBjdXIubm9kZVR5cGUgPT09IDEgJiYgISggZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiICYmIGN1ci5kaXNhYmxlZCA9PT0gdHJ1ZSApICkge1xuXHRcdFx0XHRcdG1hdGNoZWRIYW5kbGVycyA9IFtdO1xuXHRcdFx0XHRcdG1hdGNoZWRTZWxlY3RvcnMgPSB7fTtcblx0XHRcdFx0XHRmb3IgKCBpID0gMDsgaSA8IGRlbGVnYXRlQ291bnQ7IGkrKyApIHtcblx0XHRcdFx0XHRcdGhhbmRsZU9iaiA9IGhhbmRsZXJzWyBpIF07XG5cblx0XHRcdFx0XHRcdC8vIERvbid0IGNvbmZsaWN0IHdpdGggT2JqZWN0LnByb3RvdHlwZSBwcm9wZXJ0aWVzICh0cmFjLTEzMjAzKVxuXHRcdFx0XHRcdFx0c2VsID0gaGFuZGxlT2JqLnNlbGVjdG9yICsgXCIgXCI7XG5cblx0XHRcdFx0XHRcdGlmICggbWF0Y2hlZFNlbGVjdG9yc1sgc2VsIF0gPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHRcdFx0bWF0Y2hlZFNlbGVjdG9yc1sgc2VsIF0gPSBoYW5kbGVPYmoubmVlZHNDb250ZXh0ID9cblx0XHRcdFx0XHRcdFx0XHRqUXVlcnkoIHNlbCwgdGhpcyApLmluZGV4KCBjdXIgKSA+IC0xIDpcblx0XHRcdFx0XHRcdFx0XHRqUXVlcnkuZmluZCggc2VsLCB0aGlzLCBudWxsLCBbIGN1ciBdICkubGVuZ3RoO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKCBtYXRjaGVkU2VsZWN0b3JzWyBzZWwgXSApIHtcblx0XHRcdFx0XHRcdFx0bWF0Y2hlZEhhbmRsZXJzLnB1c2goIGhhbmRsZU9iaiApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIG1hdGNoZWRIYW5kbGVycy5sZW5ndGggKSB7XG5cdFx0XHRcdFx0XHRoYW5kbGVyUXVldWUucHVzaCggeyBlbGVtOiBjdXIsIGhhbmRsZXJzOiBtYXRjaGVkSGFuZGxlcnMgfSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEFkZCB0aGUgcmVtYWluaW5nIChkaXJlY3RseS1ib3VuZCkgaGFuZGxlcnNcblx0XHRjdXIgPSB0aGlzO1xuXHRcdGlmICggZGVsZWdhdGVDb3VudCA8IGhhbmRsZXJzLmxlbmd0aCApIHtcblx0XHRcdGhhbmRsZXJRdWV1ZS5wdXNoKCB7IGVsZW06IGN1ciwgaGFuZGxlcnM6IGhhbmRsZXJzLnNsaWNlKCBkZWxlZ2F0ZUNvdW50ICkgfSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBoYW5kbGVyUXVldWU7XG5cdH0sXG5cblx0YWRkUHJvcDogZnVuY3Rpb24oIG5hbWUsIGhvb2sgKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KCBqUXVlcnkuRXZlbnQucHJvdG90eXBlLCBuYW1lLCB7XG5cdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXG5cdFx0XHRnZXQ6IGlzRnVuY3Rpb24oIGhvb2sgKSA/XG5cdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICggdGhpcy5vcmlnaW5hbEV2ZW50ICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGhvb2soIHRoaXMub3JpZ2luYWxFdmVudCApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSA6XG5cdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICggdGhpcy5vcmlnaW5hbEV2ZW50ICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMub3JpZ2luYWxFdmVudFsgbmFtZSBdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblxuXHRcdFx0c2V0OiBmdW5jdGlvbiggdmFsdWUgKSB7XG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdGhpcywgbmFtZSwge1xuXHRcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdHZhbHVlOiB2YWx1ZVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdGZpeDogZnVuY3Rpb24oIG9yaWdpbmFsRXZlbnQgKSB7XG5cdFx0cmV0dXJuIG9yaWdpbmFsRXZlbnRbIGpRdWVyeS5leHBhbmRvIF0gP1xuXHRcdFx0b3JpZ2luYWxFdmVudCA6XG5cdFx0XHRuZXcgalF1ZXJ5LkV2ZW50KCBvcmlnaW5hbEV2ZW50ICk7XG5cdH0sXG5cblx0c3BlY2lhbDoge1xuXHRcdGxvYWQ6IHtcblxuXHRcdFx0Ly8gUHJldmVudCB0cmlnZ2VyZWQgaW1hZ2UubG9hZCBldmVudHMgZnJvbSBidWJibGluZyB0byB3aW5kb3cubG9hZFxuXHRcdFx0bm9CdWJibGU6IHRydWVcblx0XHR9LFxuXHRcdGNsaWNrOiB7XG5cblx0XHRcdC8vIFV0aWxpemUgbmF0aXZlIGV2ZW50IHRvIGVuc3VyZSBjb3JyZWN0IHN0YXRlIGZvciBjaGVja2FibGUgaW5wdXRzXG5cdFx0XHRzZXR1cDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cblx0XHRcdFx0Ly8gRm9yIG11dHVhbCBjb21wcmVzc2liaWxpdHkgd2l0aCBfZGVmYXVsdCwgcmVwbGFjZSBgdGhpc2AgYWNjZXNzIHdpdGggYSBsb2NhbCB2YXIuXG5cdFx0XHRcdC8vIGB8fCBkYXRhYCBpcyBkZWFkIGNvZGUgbWVhbnQgb25seSB0byBwcmVzZXJ2ZSB0aGUgdmFyaWFibGUgdGhyb3VnaCBtaW5pZmljYXRpb24uXG5cdFx0XHRcdHZhciBlbCA9IHRoaXMgfHwgZGF0YTtcblxuXHRcdFx0XHQvLyBDbGFpbSB0aGUgZmlyc3QgaGFuZGxlclxuXHRcdFx0XHRpZiAoIHJjaGVja2FibGVUeXBlLnRlc3QoIGVsLnR5cGUgKSAmJlxuXHRcdFx0XHRcdGVsLmNsaWNrICYmIG5vZGVOYW1lKCBlbCwgXCJpbnB1dFwiICkgKSB7XG5cblx0XHRcdFx0XHQvLyBkYXRhUHJpdi5zZXQoIGVsLCBcImNsaWNrXCIsIC4uLiApXG5cdFx0XHRcdFx0bGV2ZXJhZ2VOYXRpdmUoIGVsLCBcImNsaWNrXCIsIHRydWUgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJldHVybiBmYWxzZSB0byBhbGxvdyBub3JtYWwgcHJvY2Vzc2luZyBpbiB0aGUgY2FsbGVyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHR0cmlnZ2VyOiBmdW5jdGlvbiggZGF0YSApIHtcblxuXHRcdFx0XHQvLyBGb3IgbXV0dWFsIGNvbXByZXNzaWJpbGl0eSB3aXRoIF9kZWZhdWx0LCByZXBsYWNlIGB0aGlzYCBhY2Nlc3Mgd2l0aCBhIGxvY2FsIHZhci5cblx0XHRcdFx0Ly8gYHx8IGRhdGFgIGlzIGRlYWQgY29kZSBtZWFudCBvbmx5IHRvIHByZXNlcnZlIHRoZSB2YXJpYWJsZSB0aHJvdWdoIG1pbmlmaWNhdGlvbi5cblx0XHRcdFx0dmFyIGVsID0gdGhpcyB8fCBkYXRhO1xuXG5cdFx0XHRcdC8vIEZvcmNlIHNldHVwIGJlZm9yZSB0cmlnZ2VyaW5nIGEgY2xpY2tcblx0XHRcdFx0aWYgKCByY2hlY2thYmxlVHlwZS50ZXN0KCBlbC50eXBlICkgJiZcblx0XHRcdFx0XHRlbC5jbGljayAmJiBub2RlTmFtZSggZWwsIFwiaW5wdXRcIiApICkge1xuXG5cdFx0XHRcdFx0bGV2ZXJhZ2VOYXRpdmUoIGVsLCBcImNsaWNrXCIgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJldHVybiBub24tZmFsc2UgdG8gYWxsb3cgbm9ybWFsIGV2ZW50LXBhdGggcHJvcGFnYXRpb25cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBGb3IgY3Jvc3MtYnJvd3NlciBjb25zaXN0ZW5jeSwgc3VwcHJlc3MgbmF0aXZlIC5jbGljaygpIG9uIGxpbmtzXG5cdFx0XHQvLyBBbHNvIHByZXZlbnQgaXQgaWYgd2UncmUgY3VycmVudGx5IGluc2lkZSBhIGxldmVyYWdlZCBuYXRpdmUtZXZlbnQgc3RhY2tcblx0XHRcdF9kZWZhdWx0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cdFx0XHRcdHJldHVybiByY2hlY2thYmxlVHlwZS50ZXN0KCB0YXJnZXQudHlwZSApICYmXG5cdFx0XHRcdFx0dGFyZ2V0LmNsaWNrICYmIG5vZGVOYW1lKCB0YXJnZXQsIFwiaW5wdXRcIiApICYmXG5cdFx0XHRcdFx0ZGF0YVByaXYuZ2V0KCB0YXJnZXQsIFwiY2xpY2tcIiApIHx8XG5cdFx0XHRcdFx0bm9kZU5hbWUoIHRhcmdldCwgXCJhXCIgKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0YmVmb3JldW5sb2FkOiB7XG5cdFx0XHRwb3N0RGlzcGF0Y2g6IGZ1bmN0aW9uKCBldmVudCApIHtcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBGaXJlZm94IDIwK1xuXHRcdFx0XHQvLyBGaXJlZm94IGRvZXNuJ3QgYWxlcnQgaWYgdGhlIHJldHVyblZhbHVlIGZpZWxkIGlzIG5vdCBzZXQuXG5cdFx0XHRcdGlmICggZXZlbnQucmVzdWx0ICE9PSB1bmRlZmluZWQgJiYgZXZlbnQub3JpZ2luYWxFdmVudCApIHtcblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnJldHVyblZhbHVlID0gZXZlbnQucmVzdWx0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBFbnN1cmUgdGhlIHByZXNlbmNlIG9mIGFuIGV2ZW50IGxpc3RlbmVyIHRoYXQgaGFuZGxlcyBtYW51YWxseS10cmlnZ2VyZWRcbi8vIHN5bnRoZXRpYyBldmVudHMgYnkgaW50ZXJydXB0aW5nIHByb2dyZXNzIHVudGlsIHJlaW52b2tlZCBpbiByZXNwb25zZSB0b1xuLy8gKm5hdGl2ZSogZXZlbnRzIHRoYXQgaXQgZmlyZXMgZGlyZWN0bHksIGVuc3VyaW5nIHRoYXQgc3RhdGUgY2hhbmdlcyBoYXZlXG4vLyBhbHJlYWR5IG9jY3VycmVkIGJlZm9yZSBvdGhlciBsaXN0ZW5lcnMgYXJlIGludm9rZWQuXG5mdW5jdGlvbiBsZXZlcmFnZU5hdGl2ZSggZWwsIHR5cGUsIGlzU2V0dXAgKSB7XG5cblx0Ly8gTWlzc2luZyBgaXNTZXR1cGAgaW5kaWNhdGVzIGEgdHJpZ2dlciBjYWxsLCB3aGljaCBtdXN0IGZvcmNlIHNldHVwIHRocm91Z2ggalF1ZXJ5LmV2ZW50LmFkZFxuXHRpZiAoICFpc1NldHVwICkge1xuXHRcdGlmICggZGF0YVByaXYuZ2V0KCBlbCwgdHlwZSApID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRqUXVlcnkuZXZlbnQuYWRkKCBlbCwgdHlwZSwgcmV0dXJuVHJ1ZSApO1xuXHRcdH1cblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBSZWdpc3RlciB0aGUgY29udHJvbGxlciBhcyBhIHNwZWNpYWwgdW5pdmVyc2FsIGhhbmRsZXIgZm9yIGFsbCBldmVudCBuYW1lc3BhY2VzXG5cdGRhdGFQcml2LnNldCggZWwsIHR5cGUsIGZhbHNlICk7XG5cdGpRdWVyeS5ldmVudC5hZGQoIGVsLCB0eXBlLCB7XG5cdFx0bmFtZXNwYWNlOiBmYWxzZSxcblx0XHRoYW5kbGVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgcmVzdWx0LFxuXHRcdFx0XHRzYXZlZCA9IGRhdGFQcml2LmdldCggdGhpcywgdHlwZSApO1xuXG5cdFx0XHRpZiAoICggZXZlbnQuaXNUcmlnZ2VyICYgMSApICYmIHRoaXNbIHR5cGUgXSApIHtcblxuXHRcdFx0XHQvLyBJbnRlcnJ1cHQgcHJvY2Vzc2luZyBvZiB0aGUgb3V0ZXIgc3ludGhldGljIC50cmlnZ2VyKCllZCBldmVudFxuXHRcdFx0XHRpZiAoICFzYXZlZCApIHtcblxuXHRcdFx0XHRcdC8vIFN0b3JlIGFyZ3VtZW50cyBmb3IgdXNlIHdoZW4gaGFuZGxpbmcgdGhlIGlubmVyIG5hdGl2ZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZXJlIHdpbGwgYWx3YXlzIGJlIGF0IGxlYXN0IG9uZSBhcmd1bWVudCAoYW4gZXZlbnQgb2JqZWN0KSwgc28gdGhpcyBhcnJheVxuXHRcdFx0XHRcdC8vIHdpbGwgbm90IGJlIGNvbmZ1c2VkIHdpdGggYSBsZWZ0b3ZlciBjYXB0dXJlIG9iamVjdC5cblx0XHRcdFx0XHRzYXZlZCA9IHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApO1xuXHRcdFx0XHRcdGRhdGFQcml2LnNldCggdGhpcywgdHlwZSwgc2F2ZWQgKTtcblxuXHRcdFx0XHRcdC8vIFRyaWdnZXIgdGhlIG5hdGl2ZSBldmVudCBhbmQgY2FwdHVyZSBpdHMgcmVzdWx0XG5cdFx0XHRcdFx0dGhpc1sgdHlwZSBdKCk7XG5cdFx0XHRcdFx0cmVzdWx0ID0gZGF0YVByaXYuZ2V0KCB0aGlzLCB0eXBlICk7XG5cdFx0XHRcdFx0ZGF0YVByaXYuc2V0KCB0aGlzLCB0eXBlLCBmYWxzZSApO1xuXG5cdFx0XHRcdFx0aWYgKCBzYXZlZCAhPT0gcmVzdWx0ICkge1xuXG5cdFx0XHRcdFx0XHQvLyBDYW5jZWwgdGhlIG91dGVyIHN5bnRoZXRpYyBldmVudFxuXHRcdFx0XHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJZiB0aGlzIGlzIGFuIGlubmVyIHN5bnRoZXRpYyBldmVudCBmb3IgYW4gZXZlbnQgd2l0aCBhIGJ1YmJsaW5nIHN1cnJvZ2F0ZVxuXHRcdFx0XHQvLyAoZm9jdXMgb3IgYmx1ciksIGFzc3VtZSB0aGF0IHRoZSBzdXJyb2dhdGUgYWxyZWFkeSBwcm9wYWdhdGVkIGZyb20gdHJpZ2dlcmluZ1xuXHRcdFx0XHQvLyB0aGUgbmF0aXZlIGV2ZW50IGFuZCBwcmV2ZW50IHRoYXQgZnJvbSBoYXBwZW5pbmcgYWdhaW4gaGVyZS5cblx0XHRcdFx0Ly8gVGhpcyB0ZWNobmljYWxseSBnZXRzIHRoZSBvcmRlcmluZyB3cm9uZyB3LnIudC4gdG8gYC50cmlnZ2VyKClgIChpbiB3aGljaCB0aGVcblx0XHRcdFx0Ly8gYnViYmxpbmcgc3Vycm9nYXRlIHByb3BhZ2F0ZXMgKmFmdGVyKiB0aGUgbm9uLWJ1YmJsaW5nIGJhc2UpLCBidXQgdGhhdCBzZWVtc1xuXHRcdFx0XHQvLyBsZXNzIGJhZCB0aGFuIGR1cGxpY2F0aW9uLlxuXHRcdFx0XHR9IGVsc2UgaWYgKCAoIGpRdWVyeS5ldmVudC5zcGVjaWFsWyB0eXBlIF0gfHwge30gKS5kZWxlZ2F0ZVR5cGUgKSB7XG5cdFx0XHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIG5hdGl2ZSBldmVudCB0cmlnZ2VyZWQgYWJvdmUsIGV2ZXJ5dGhpbmcgaXMgbm93IGluIG9yZGVyXG5cdFx0XHQvLyBGaXJlIGFuIGlubmVyIHN5bnRoZXRpYyBldmVudCB3aXRoIHRoZSBvcmlnaW5hbCBhcmd1bWVudHNcblx0XHRcdH0gZWxzZSBpZiAoIHNhdmVkICkge1xuXG5cdFx0XHRcdC8vIC4uLmFuZCBjYXB0dXJlIHRoZSByZXN1bHRcblx0XHRcdFx0ZGF0YVByaXYuc2V0KCB0aGlzLCB0eXBlLCBqUXVlcnkuZXZlbnQudHJpZ2dlcihcblx0XHRcdFx0XHRzYXZlZFsgMCBdLFxuXHRcdFx0XHRcdHNhdmVkLnNsaWNlKCAxICksXG5cdFx0XHRcdFx0dGhpc1xuXHRcdFx0XHQpICk7XG5cblx0XHRcdFx0Ly8gQWJvcnQgaGFuZGxpbmcgb2YgdGhlIG5hdGl2ZSBldmVudCBieSBhbGwgalF1ZXJ5IGhhbmRsZXJzIHdoaWxlIGFsbG93aW5nXG5cdFx0XHRcdC8vIG5hdGl2ZSBoYW5kbGVycyBvbiB0aGUgc2FtZSBlbGVtZW50IHRvIHJ1bi4gT24gdGFyZ2V0LCB0aGlzIGlzIGFjaGlldmVkXG5cdFx0XHRcdC8vIGJ5IHN0b3BwaW5nIGltbWVkaWF0ZSBwcm9wYWdhdGlvbiBqdXN0IG9uIHRoZSBqUXVlcnkgZXZlbnQuIEhvd2V2ZXIsXG5cdFx0XHRcdC8vIHRoZSBuYXRpdmUgZXZlbnQgaXMgcmUtd3JhcHBlZCBieSBhIGpRdWVyeSBvbmUgb24gZWFjaCBsZXZlbCBvZiB0aGVcblx0XHRcdFx0Ly8gcHJvcGFnYXRpb24gc28gdGhlIG9ubHkgd2F5IHRvIHN0b3AgaXQgZm9yIGpRdWVyeSBpcyB0byBzdG9wIGl0IGZvclxuXHRcdFx0XHQvLyBldmVyeW9uZSB2aWEgbmF0aXZlIGBzdG9wUHJvcGFnYXRpb24oKWAuIFRoaXMgaXMgbm90IGEgcHJvYmxlbSBmb3Jcblx0XHRcdFx0Ly8gZm9jdXMvYmx1ciB3aGljaCBkb24ndCBidWJibGUsIGJ1dCBpdCBkb2VzIGFsc28gc3RvcCBjbGljayBvbiBjaGVja2JveGVzXG5cdFx0XHRcdC8vIGFuZCByYWRpb3MuIFdlIGFjY2VwdCB0aGlzIGxpbWl0YXRpb24uXG5cdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRldmVudC5pc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9ICk7XG59XG5cbmpRdWVyeS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKCBlbGVtLCB0eXBlLCBoYW5kbGUgKSB7XG5cblx0Ly8gVGhpcyBcImlmXCIgaXMgbmVlZGVkIGZvciBwbGFpbiBvYmplY3RzXG5cdGlmICggZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyICkge1xuXHRcdGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lciggdHlwZSwgaGFuZGxlICk7XG5cdH1cbn07XG5cbmpRdWVyeS5FdmVudCA9IGZ1bmN0aW9uKCBzcmMsIHByb3BzICkge1xuXG5cdC8vIEFsbG93IGluc3RhbnRpYXRpb24gd2l0aG91dCB0aGUgJ25ldycga2V5d29yZFxuXHRpZiAoICEoIHRoaXMgaW5zdGFuY2VvZiBqUXVlcnkuRXZlbnQgKSApIHtcblx0XHRyZXR1cm4gbmV3IGpRdWVyeS5FdmVudCggc3JjLCBwcm9wcyApO1xuXHR9XG5cblx0Ly8gRXZlbnQgb2JqZWN0XG5cdGlmICggc3JjICYmIHNyYy50eXBlICkge1xuXHRcdHRoaXMub3JpZ2luYWxFdmVudCA9IHNyYztcblx0XHR0aGlzLnR5cGUgPSBzcmMudHlwZTtcblxuXHRcdC8vIEV2ZW50cyBidWJibGluZyB1cCB0aGUgZG9jdW1lbnQgbWF5IGhhdmUgYmVlbiBtYXJrZWQgYXMgcHJldmVudGVkXG5cdFx0Ly8gYnkgYSBoYW5kbGVyIGxvd2VyIGRvd24gdGhlIHRyZWU7IHJlZmxlY3QgdGhlIGNvcnJlY3QgdmFsdWUuXG5cdFx0dGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSBzcmMuZGVmYXVsdFByZXZlbnRlZCB8fFxuXHRcdFx0XHRzcmMuZGVmYXVsdFByZXZlbnRlZCA9PT0gdW5kZWZpbmVkICYmXG5cblx0XHRcdFx0Ly8gU3VwcG9ydDogQW5kcm9pZCA8PTIuMyBvbmx5XG5cdFx0XHRcdHNyYy5yZXR1cm5WYWx1ZSA9PT0gZmFsc2UgP1xuXHRcdFx0cmV0dXJuVHJ1ZSA6XG5cdFx0XHRyZXR1cm5GYWxzZTtcblxuXHRcdC8vIENyZWF0ZSB0YXJnZXQgcHJvcGVydGllc1xuXHRcdC8vIFN1cHBvcnQ6IFNhZmFyaSA8PTYgLSA3IG9ubHlcblx0XHQvLyBUYXJnZXQgc2hvdWxkIG5vdCBiZSBhIHRleHQgbm9kZSAodHJhYy01MDQsIHRyYWMtMTMxNDMpXG5cdFx0dGhpcy50YXJnZXQgPSAoIHNyYy50YXJnZXQgJiYgc3JjLnRhcmdldC5ub2RlVHlwZSA9PT0gMyApID9cblx0XHRcdHNyYy50YXJnZXQucGFyZW50Tm9kZSA6XG5cdFx0XHRzcmMudGFyZ2V0O1xuXG5cdFx0dGhpcy5jdXJyZW50VGFyZ2V0ID0gc3JjLmN1cnJlbnRUYXJnZXQ7XG5cdFx0dGhpcy5yZWxhdGVkVGFyZ2V0ID0gc3JjLnJlbGF0ZWRUYXJnZXQ7XG5cblx0Ly8gRXZlbnQgdHlwZVxuXHR9IGVsc2Uge1xuXHRcdHRoaXMudHlwZSA9IHNyYztcblx0fVxuXG5cdC8vIFB1dCBleHBsaWNpdGx5IHByb3ZpZGVkIHByb3BlcnRpZXMgb250byB0aGUgZXZlbnQgb2JqZWN0XG5cdGlmICggcHJvcHMgKSB7XG5cdFx0alF1ZXJ5LmV4dGVuZCggdGhpcywgcHJvcHMgKTtcblx0fVxuXG5cdC8vIENyZWF0ZSBhIHRpbWVzdGFtcCBpZiBpbmNvbWluZyBldmVudCBkb2Vzbid0IGhhdmUgb25lXG5cdHRoaXMudGltZVN0YW1wID0gc3JjICYmIHNyYy50aW1lU3RhbXAgfHwgRGF0ZS5ub3coKTtcblxuXHQvLyBNYXJrIGl0IGFzIGZpeGVkXG5cdHRoaXNbIGpRdWVyeS5leHBhbmRvIF0gPSB0cnVlO1xufTtcblxuLy8galF1ZXJ5LkV2ZW50IGlzIGJhc2VkIG9uIERPTTMgRXZlbnRzIGFzIHNwZWNpZmllZCBieSB0aGUgRUNNQVNjcmlwdCBMYW5ndWFnZSBCaW5kaW5nXG4vLyBodHRwczovL3d3dy53My5vcmcvVFIvMjAwMy9XRC1ET00tTGV2ZWwtMy1FdmVudHMtMjAwMzAzMzEvZWNtYS1zY3JpcHQtYmluZGluZy5odG1sXG5qUXVlcnkuRXZlbnQucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvcjogalF1ZXJ5LkV2ZW50LFxuXHRpc0RlZmF1bHRQcmV2ZW50ZWQ6IHJldHVybkZhbHNlLFxuXHRpc1Byb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2UsXG5cdGlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcblx0aXNTaW11bGF0ZWQ6IGZhbHNlLFxuXG5cdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiAhdGhpcy5pc1NpbXVsYXRlZCApIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cdHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiAhdGhpcy5pc1NpbXVsYXRlZCApIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHR9LFxuXHRzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgIXRoaXMuaXNTaW11bGF0ZWQgKSB7XG5cdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdH1cblxuXHRcdHRoaXMuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH1cbn07XG5cbi8vIEluY2x1ZGVzIGFsbCBjb21tb24gZXZlbnQgcHJvcHMgaW5jbHVkaW5nIEtleUV2ZW50IGFuZCBNb3VzZUV2ZW50IHNwZWNpZmljIHByb3BzXG5qUXVlcnkuZWFjaCgge1xuXHRhbHRLZXk6IHRydWUsXG5cdGJ1YmJsZXM6IHRydWUsXG5cdGNhbmNlbGFibGU6IHRydWUsXG5cdGNoYW5nZWRUb3VjaGVzOiB0cnVlLFxuXHRjdHJsS2V5OiB0cnVlLFxuXHRkZXRhaWw6IHRydWUsXG5cdGV2ZW50UGhhc2U6IHRydWUsXG5cdG1ldGFLZXk6IHRydWUsXG5cdHBhZ2VYOiB0cnVlLFxuXHRwYWdlWTogdHJ1ZSxcblx0c2hpZnRLZXk6IHRydWUsXG5cdHZpZXc6IHRydWUsXG5cdFwiY2hhclwiOiB0cnVlLFxuXHRjb2RlOiB0cnVlLFxuXHRjaGFyQ29kZTogdHJ1ZSxcblx0a2V5OiB0cnVlLFxuXHRrZXlDb2RlOiB0cnVlLFxuXHRidXR0b246IHRydWUsXG5cdGJ1dHRvbnM6IHRydWUsXG5cdGNsaWVudFg6IHRydWUsXG5cdGNsaWVudFk6IHRydWUsXG5cdG9mZnNldFg6IHRydWUsXG5cdG9mZnNldFk6IHRydWUsXG5cdHBvaW50ZXJJZDogdHJ1ZSxcblx0cG9pbnRlclR5cGU6IHRydWUsXG5cdHNjcmVlblg6IHRydWUsXG5cdHNjcmVlblk6IHRydWUsXG5cdHRhcmdldFRvdWNoZXM6IHRydWUsXG5cdHRvRWxlbWVudDogdHJ1ZSxcblx0dG91Y2hlczogdHJ1ZSxcblx0d2hpY2g6IHRydWVcbn0sIGpRdWVyeS5ldmVudC5hZGRQcm9wICk7XG5cbmpRdWVyeS5lYWNoKCB7IGZvY3VzOiBcImZvY3VzaW5cIiwgYmx1cjogXCJmb2N1c291dFwiIH0sIGZ1bmN0aW9uKCB0eXBlLCBkZWxlZ2F0ZVR5cGUgKSB7XG5cblx0ZnVuY3Rpb24gZm9jdXNNYXBwZWRIYW5kbGVyKCBuYXRpdmVFdmVudCApIHtcblx0XHRpZiAoIGRvY3VtZW50LmRvY3VtZW50TW9kZSApIHtcblxuXHRcdFx0Ly8gU3VwcG9ydDogSUUgMTErXG5cdFx0XHQvLyBBdHRhY2ggYSBzaW5nbGUgZm9jdXNpbi9mb2N1c291dCBoYW5kbGVyIG9uIHRoZSBkb2N1bWVudCB3aGlsZSBzb21lb25lIHdhbnRzXG5cdFx0XHQvLyBmb2N1cy9ibHVyLiBUaGlzIGlzIGJlY2F1c2UgdGhlIGZvcm1lciBhcmUgc3luY2hyb25vdXMgaW4gSUUgd2hpbGUgdGhlIGxhdHRlclxuXHRcdFx0Ly8gYXJlIGFzeW5jLiBJbiBvdGhlciBicm93c2VycywgYWxsIHRob3NlIGhhbmRsZXJzIGFyZSBpbnZva2VkIHN5bmNocm9ub3VzbHkuXG5cblx0XHRcdC8vIGBoYW5kbGVgIGZyb20gcHJpdmF0ZSBkYXRhIHdvdWxkIGFscmVhZHkgd3JhcCB0aGUgZXZlbnQsIGJ1dCB3ZSBuZWVkXG5cdFx0XHQvLyB0byBjaGFuZ2UgdGhlIGB0eXBlYCBoZXJlLlxuXHRcdFx0dmFyIGhhbmRsZSA9IGRhdGFQcml2LmdldCggdGhpcywgXCJoYW5kbGVcIiApLFxuXHRcdFx0XHRldmVudCA9IGpRdWVyeS5ldmVudC5maXgoIG5hdGl2ZUV2ZW50ICk7XG5cdFx0XHRldmVudC50eXBlID0gbmF0aXZlRXZlbnQudHlwZSA9PT0gXCJmb2N1c2luXCIgPyBcImZvY3VzXCIgOiBcImJsdXJcIjtcblx0XHRcdGV2ZW50LmlzU2ltdWxhdGVkID0gdHJ1ZTtcblxuXHRcdFx0Ly8gRmlyc3QsIGhhbmRsZSBmb2N1c2luL2ZvY3Vzb3V0XG5cdFx0XHRoYW5kbGUoIG5hdGl2ZUV2ZW50ICk7XG5cblx0XHRcdC8vIC4uLnRoZW4sIGhhbmRsZSBmb2N1cy9ibHVyXG5cdFx0XHQvL1xuXHRcdFx0Ly8gZm9jdXMvYmx1ciBkb24ndCBidWJibGUgd2hpbGUgZm9jdXNpbi9mb2N1c291dCBkbzsgc2ltdWxhdGUgdGhlIGZvcm1lciBieSBvbmx5XG5cdFx0XHQvLyBpbnZva2luZyB0aGUgaGFuZGxlciBhdCB0aGUgbG93ZXIgbGV2ZWwuXG5cdFx0XHRpZiAoIGV2ZW50LnRhcmdldCA9PT0gZXZlbnQuY3VycmVudFRhcmdldCApIHtcblxuXHRcdFx0XHQvLyBUaGUgc2V0dXAgcGFydCBjYWxscyBgbGV2ZXJhZ2VOYXRpdmVgLCB3aGljaCwgaW4gdHVybiwgY2FsbHNcblx0XHRcdFx0Ly8gYGpRdWVyeS5ldmVudC5hZGRgLCBzbyBldmVudCBoYW5kbGUgd2lsbCBhbHJlYWR5IGhhdmUgYmVlbiBzZXRcblx0XHRcdFx0Ly8gYnkgdGhpcyBwb2ludC5cblx0XHRcdFx0aGFuZGxlKCBldmVudCApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdC8vIEZvciBub24tSUUgYnJvd3NlcnMsIGF0dGFjaCBhIHNpbmdsZSBjYXB0dXJpbmcgaGFuZGxlciBvbiB0aGUgZG9jdW1lbnRcblx0XHRcdC8vIHdoaWxlIHNvbWVvbmUgd2FudHMgZm9jdXNpbi9mb2N1c291dC5cblx0XHRcdGpRdWVyeS5ldmVudC5zaW11bGF0ZSggZGVsZWdhdGVUeXBlLCBuYXRpdmVFdmVudC50YXJnZXQsXG5cdFx0XHRcdGpRdWVyeS5ldmVudC5maXgoIG5hdGl2ZUV2ZW50ICkgKTtcblx0XHR9XG5cdH1cblxuXHRqUXVlcnkuZXZlbnQuc3BlY2lhbFsgdHlwZSBdID0ge1xuXG5cdFx0Ly8gVXRpbGl6ZSBuYXRpdmUgZXZlbnQgaWYgcG9zc2libGUgc28gYmx1ci9mb2N1cyBzZXF1ZW5jZSBpcyBjb3JyZWN0XG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgYXR0YWNoZXM7XG5cblx0XHRcdC8vIENsYWltIHRoZSBmaXJzdCBoYW5kbGVyXG5cdFx0XHQvLyBkYXRhUHJpdi5zZXQoIHRoaXMsIFwiZm9jdXNcIiwgLi4uIClcblx0XHRcdC8vIGRhdGFQcml2LnNldCggdGhpcywgXCJibHVyXCIsIC4uLiApXG5cdFx0XHRsZXZlcmFnZU5hdGl2ZSggdGhpcywgdHlwZSwgdHJ1ZSApO1xuXG5cdFx0XHRpZiAoIGRvY3VtZW50LmRvY3VtZW50TW9kZSApIHtcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA5IC0gMTErXG5cdFx0XHRcdC8vIFdlIHVzZSB0aGUgc2FtZSBuYXRpdmUgaGFuZGxlciBmb3IgZm9jdXNpbiAmIGZvY3VzIChhbmQgZm9jdXNvdXQgJiBibHVyKVxuXHRcdFx0XHQvLyBzbyB3ZSBuZWVkIHRvIGNvb3JkaW5hdGUgc2V0dXAgJiB0ZWFyZG93biBwYXJ0cyBiZXR3ZWVuIHRob3NlIGV2ZW50cy5cblx0XHRcdFx0Ly8gVXNlIGBkZWxlZ2F0ZVR5cGVgIGFzIHRoZSBrZXkgYXMgYHR5cGVgIGlzIGFscmVhZHkgdXNlZCBieSBgbGV2ZXJhZ2VOYXRpdmVgLlxuXHRcdFx0XHRhdHRhY2hlcyA9IGRhdGFQcml2LmdldCggdGhpcywgZGVsZWdhdGVUeXBlICk7XG5cdFx0XHRcdGlmICggIWF0dGFjaGVzICkge1xuXHRcdFx0XHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggZGVsZWdhdGVUeXBlLCBmb2N1c01hcHBlZEhhbmRsZXIgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkYXRhUHJpdi5zZXQoIHRoaXMsIGRlbGVnYXRlVHlwZSwgKCBhdHRhY2hlcyB8fCAwICkgKyAxICk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFJldHVybiBmYWxzZSB0byBhbGxvdyBub3JtYWwgcHJvY2Vzc2luZyBpbiB0aGUgY2FsbGVyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHRyaWdnZXI6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQvLyBGb3JjZSBzZXR1cCBiZWZvcmUgdHJpZ2dlclxuXHRcdFx0bGV2ZXJhZ2VOYXRpdmUoIHRoaXMsIHR5cGUgKTtcblxuXHRcdFx0Ly8gUmV0dXJuIG5vbi1mYWxzZSB0byBhbGxvdyBub3JtYWwgZXZlbnQtcGF0aCBwcm9wYWdhdGlvblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhdHRhY2hlcztcblxuXHRcdFx0aWYgKCBkb2N1bWVudC5kb2N1bWVudE1vZGUgKSB7XG5cdFx0XHRcdGF0dGFjaGVzID0gZGF0YVByaXYuZ2V0KCB0aGlzLCBkZWxlZ2F0ZVR5cGUgKSAtIDE7XG5cdFx0XHRcdGlmICggIWF0dGFjaGVzICkge1xuXHRcdFx0XHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciggZGVsZWdhdGVUeXBlLCBmb2N1c01hcHBlZEhhbmRsZXIgKTtcblx0XHRcdFx0XHRkYXRhUHJpdi5yZW1vdmUoIHRoaXMsIGRlbGVnYXRlVHlwZSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRhdGFQcml2LnNldCggdGhpcywgZGVsZWdhdGVUeXBlLCBhdHRhY2hlcyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFJldHVybiBmYWxzZSB0byBpbmRpY2F0ZSBzdGFuZGFyZCB0ZWFyZG93biBzaG91bGQgYmUgYXBwbGllZFxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIFN1cHByZXNzIG5hdGl2ZSBmb2N1cyBvciBibHVyIGlmIHdlJ3JlIGN1cnJlbnRseSBpbnNpZGVcblx0XHQvLyBhIGxldmVyYWdlZCBuYXRpdmUtZXZlbnQgc3RhY2tcblx0XHRfZGVmYXVsdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0cmV0dXJuIGRhdGFQcml2LmdldCggZXZlbnQudGFyZ2V0LCB0eXBlICk7XG5cdFx0fSxcblxuXHRcdGRlbGVnYXRlVHlwZTogZGVsZWdhdGVUeXBlXG5cdH07XG5cblx0Ly8gU3VwcG9ydDogRmlyZWZveCA8PTQ0XG5cdC8vIEZpcmVmb3ggZG9lc24ndCBoYXZlIGZvY3VzKGluIHwgb3V0KSBldmVudHNcblx0Ly8gUmVsYXRlZCB0aWNrZXQgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02ODc3ODdcblx0Ly9cblx0Ly8gU3VwcG9ydDogQ2hyb21lIDw9NDggLSA0OSwgU2FmYXJpIDw9OS4wIC0gOS4xXG5cdC8vIGZvY3VzKGluIHwgb3V0KSBldmVudHMgZmlyZSBhZnRlciBmb2N1cyAmIGJsdXIgZXZlbnRzLFxuXHQvLyB3aGljaCBpcyBzcGVjIHZpb2xhdGlvbiAtIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy8jZXZlbnRzLWZvY3VzZXZlbnQtZXZlbnQtb3JkZXJcblx0Ly8gUmVsYXRlZCB0aWNrZXQgLSBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00NDk4NTdcblx0Ly9cblx0Ly8gU3VwcG9ydDogSUUgOSAtIDExK1xuXHQvLyBUbyBwcmVzZXJ2ZSByZWxhdGl2ZSBmb2N1c2luL2ZvY3VzICYgZm9jdXNvdXQvYmx1ciBldmVudCBvcmRlciBndWFyYW50ZWVkIG9uIHRoZSAzLnggYnJhbmNoLFxuXHQvLyBhdHRhY2ggYSBzaW5nbGUgaGFuZGxlciBmb3IgYm90aCBldmVudHMgaW4gSUUuXG5cdGpRdWVyeS5ldmVudC5zcGVjaWFsWyBkZWxlZ2F0ZVR5cGUgXSA9IHtcblx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cblx0XHRcdC8vIEhhbmRsZTogcmVndWxhciBub2RlcyAodmlhIGB0aGlzLm93bmVyRG9jdW1lbnRgKSwgd2luZG93XG5cdFx0XHQvLyAodmlhIGB0aGlzLmRvY3VtZW50YCkgJiBkb2N1bWVudCAodmlhIGB0aGlzYCkuXG5cdFx0XHR2YXIgZG9jID0gdGhpcy5vd25lckRvY3VtZW50IHx8IHRoaXMuZG9jdW1lbnQgfHwgdGhpcyxcblx0XHRcdFx0ZGF0YUhvbGRlciA9IGRvY3VtZW50LmRvY3VtZW50TW9kZSA/IHRoaXMgOiBkb2MsXG5cdFx0XHRcdGF0dGFjaGVzID0gZGF0YVByaXYuZ2V0KCBkYXRhSG9sZGVyLCBkZWxlZ2F0ZVR5cGUgKTtcblxuXHRcdFx0Ly8gU3VwcG9ydDogSUUgOSAtIDExK1xuXHRcdFx0Ly8gV2UgdXNlIHRoZSBzYW1lIG5hdGl2ZSBoYW5kbGVyIGZvciBmb2N1c2luICYgZm9jdXMgKGFuZCBmb2N1c291dCAmIGJsdXIpXG5cdFx0XHQvLyBzbyB3ZSBuZWVkIHRvIGNvb3JkaW5hdGUgc2V0dXAgJiB0ZWFyZG93biBwYXJ0cyBiZXR3ZWVuIHRob3NlIGV2ZW50cy5cblx0XHRcdC8vIFVzZSBgZGVsZWdhdGVUeXBlYCBhcyB0aGUga2V5IGFzIGB0eXBlYCBpcyBhbHJlYWR5IHVzZWQgYnkgYGxldmVyYWdlTmF0aXZlYC5cblx0XHRcdGlmICggIWF0dGFjaGVzICkge1xuXHRcdFx0XHRpZiAoIGRvY3VtZW50LmRvY3VtZW50TW9kZSApIHtcblx0XHRcdFx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIGRlbGVnYXRlVHlwZSwgZm9jdXNNYXBwZWRIYW5kbGVyICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZG9jLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIGZvY3VzTWFwcGVkSGFuZGxlciwgdHJ1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkYXRhUHJpdi5zZXQoIGRhdGFIb2xkZXIsIGRlbGVnYXRlVHlwZSwgKCBhdHRhY2hlcyB8fCAwICkgKyAxICk7XG5cdFx0fSxcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZG9jID0gdGhpcy5vd25lckRvY3VtZW50IHx8IHRoaXMuZG9jdW1lbnQgfHwgdGhpcyxcblx0XHRcdFx0ZGF0YUhvbGRlciA9IGRvY3VtZW50LmRvY3VtZW50TW9kZSA/IHRoaXMgOiBkb2MsXG5cdFx0XHRcdGF0dGFjaGVzID0gZGF0YVByaXYuZ2V0KCBkYXRhSG9sZGVyLCBkZWxlZ2F0ZVR5cGUgKSAtIDE7XG5cblx0XHRcdGlmICggIWF0dGFjaGVzICkge1xuXHRcdFx0XHRpZiAoIGRvY3VtZW50LmRvY3VtZW50TW9kZSApIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGRlbGVnYXRlVHlwZSwgZm9jdXNNYXBwZWRIYW5kbGVyICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGZvY3VzTWFwcGVkSGFuZGxlciwgdHJ1ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRhdGFQcml2LnJlbW92ZSggZGF0YUhvbGRlciwgZGVsZWdhdGVUeXBlICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkYXRhUHJpdi5zZXQoIGRhdGFIb2xkZXIsIGRlbGVnYXRlVHlwZSwgYXR0YWNoZXMgKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59ICk7XG5cbi8vIENyZWF0ZSBtb3VzZWVudGVyL2xlYXZlIGV2ZW50cyB1c2luZyBtb3VzZW92ZXIvb3V0IGFuZCBldmVudC10aW1lIGNoZWNrc1xuLy8gc28gdGhhdCBldmVudCBkZWxlZ2F0aW9uIHdvcmtzIGluIGpRdWVyeS5cbi8vIERvIHRoZSBzYW1lIGZvciBwb2ludGVyZW50ZXIvcG9pbnRlcmxlYXZlIGFuZCBwb2ludGVyb3Zlci9wb2ludGVyb3V0XG4vL1xuLy8gU3VwcG9ydDogU2FmYXJpIDcgb25seVxuLy8gU2FmYXJpIHNlbmRzIG1vdXNlZW50ZXIgdG9vIG9mdGVuOyBzZWU6XG4vLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00NzAyNThcbi8vIGZvciB0aGUgZGVzY3JpcHRpb24gb2YgdGhlIGJ1ZyAoaXQgZXhpc3RlZCBpbiBvbGRlciBDaHJvbWUgdmVyc2lvbnMgYXMgd2VsbCkuXG5qUXVlcnkuZWFjaCgge1xuXHRtb3VzZWVudGVyOiBcIm1vdXNlb3ZlclwiLFxuXHRtb3VzZWxlYXZlOiBcIm1vdXNlb3V0XCIsXG5cdHBvaW50ZXJlbnRlcjogXCJwb2ludGVyb3ZlclwiLFxuXHRwb2ludGVybGVhdmU6IFwicG9pbnRlcm91dFwiXG59LCBmdW5jdGlvbiggb3JpZywgZml4ICkge1xuXHRqUXVlcnkuZXZlbnQuc3BlY2lhbFsgb3JpZyBdID0ge1xuXHRcdGRlbGVnYXRlVHlwZTogZml4LFxuXHRcdGJpbmRUeXBlOiBmaXgsXG5cblx0XHRoYW5kbGU6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciByZXQsXG5cdFx0XHRcdHRhcmdldCA9IHRoaXMsXG5cdFx0XHRcdHJlbGF0ZWQgPSBldmVudC5yZWxhdGVkVGFyZ2V0LFxuXHRcdFx0XHRoYW5kbGVPYmogPSBldmVudC5oYW5kbGVPYmo7XG5cblx0XHRcdC8vIEZvciBtb3VzZWVudGVyL2xlYXZlIGNhbGwgdGhlIGhhbmRsZXIgaWYgcmVsYXRlZCBpcyBvdXRzaWRlIHRoZSB0YXJnZXQuXG5cdFx0XHQvLyBOQjogTm8gcmVsYXRlZFRhcmdldCBpZiB0aGUgbW91c2UgbGVmdC9lbnRlcmVkIHRoZSBicm93c2VyIHdpbmRvd1xuXHRcdFx0aWYgKCAhcmVsYXRlZCB8fCAoIHJlbGF0ZWQgIT09IHRhcmdldCAmJiAhalF1ZXJ5LmNvbnRhaW5zKCB0YXJnZXQsIHJlbGF0ZWQgKSApICkge1xuXHRcdFx0XHRldmVudC50eXBlID0gaGFuZGxlT2JqLm9yaWdUeXBlO1xuXHRcdFx0XHRyZXQgPSBoYW5kbGVPYmouaGFuZGxlci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0XHRcdGV2ZW50LnR5cGUgPSBmaXg7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH1cblx0fTtcbn0gKTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXG5cdG9uOiBmdW5jdGlvbiggdHlwZXMsIHNlbGVjdG9yLCBkYXRhLCBmbiApIHtcblx0XHRyZXR1cm4gb24oIHRoaXMsIHR5cGVzLCBzZWxlY3RvciwgZGF0YSwgZm4gKTtcblx0fSxcblx0b25lOiBmdW5jdGlvbiggdHlwZXMsIHNlbGVjdG9yLCBkYXRhLCBmbiApIHtcblx0XHRyZXR1cm4gb24oIHRoaXMsIHR5cGVzLCBzZWxlY3RvciwgZGF0YSwgZm4sIDEgKTtcblx0fSxcblx0b2ZmOiBmdW5jdGlvbiggdHlwZXMsIHNlbGVjdG9yLCBmbiApIHtcblx0XHR2YXIgaGFuZGxlT2JqLCB0eXBlO1xuXHRcdGlmICggdHlwZXMgJiYgdHlwZXMucHJldmVudERlZmF1bHQgJiYgdHlwZXMuaGFuZGxlT2JqICkge1xuXG5cdFx0XHQvLyAoIGV2ZW50ICkgIGRpc3BhdGNoZWQgalF1ZXJ5LkV2ZW50XG5cdFx0XHRoYW5kbGVPYmogPSB0eXBlcy5oYW5kbGVPYmo7XG5cdFx0XHRqUXVlcnkoIHR5cGVzLmRlbGVnYXRlVGFyZ2V0ICkub2ZmKFxuXHRcdFx0XHRoYW5kbGVPYmoubmFtZXNwYWNlID9cblx0XHRcdFx0XHRoYW5kbGVPYmoub3JpZ1R5cGUgKyBcIi5cIiArIGhhbmRsZU9iai5uYW1lc3BhY2UgOlxuXHRcdFx0XHRcdGhhbmRsZU9iai5vcmlnVHlwZSxcblx0XHRcdFx0aGFuZGxlT2JqLnNlbGVjdG9yLFxuXHRcdFx0XHRoYW5kbGVPYmouaGFuZGxlclxuXHRcdFx0KTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiB0eXBlcyA9PT0gXCJvYmplY3RcIiApIHtcblxuXHRcdFx0Ly8gKCB0eXBlcy1vYmplY3QgWywgc2VsZWN0b3JdIClcblx0XHRcdGZvciAoIHR5cGUgaW4gdHlwZXMgKSB7XG5cdFx0XHRcdHRoaXMub2ZmKCB0eXBlLCBzZWxlY3RvciwgdHlwZXNbIHR5cGUgXSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGlmICggc2VsZWN0b3IgPT09IGZhbHNlIHx8IHR5cGVvZiBzZWxlY3RvciA9PT0gXCJmdW5jdGlvblwiICkge1xuXG5cdFx0XHQvLyAoIHR5cGVzIFssIGZuXSApXG5cdFx0XHRmbiA9IHNlbGVjdG9yO1xuXHRcdFx0c2VsZWN0b3IgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmICggZm4gPT09IGZhbHNlICkge1xuXHRcdFx0Zm4gPSByZXR1cm5GYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRqUXVlcnkuZXZlbnQucmVtb3ZlKCB0aGlzLCB0eXBlcywgZm4sIHNlbGVjdG9yICk7XG5cdFx0fSApO1xuXHR9XG59ICk7XG5cblxudmFyXG5cblx0Ly8gU3VwcG9ydDogSUUgPD0xMCAtIDExLCBFZGdlIDEyIC0gMTMgb25seVxuXHQvLyBJbiBJRS9FZGdlIHVzaW5nIHJlZ2V4IGdyb3VwcyBoZXJlIGNhdXNlcyBzZXZlcmUgc2xvd2Rvd25zLlxuXHQvLyBTZWUgaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvZmVlZGJhY2svZGV0YWlscy8xNzM2NTEyL1xuXHRybm9Jbm5lcmh0bWwgPSAvPHNjcmlwdHw8c3R5bGV8PGxpbmsvaSxcblxuXHQvLyBjaGVja2VkPVwiY2hlY2tlZFwiIG9yIGNoZWNrZWRcblx0cmNoZWNrZWQgPSAvY2hlY2tlZFxccyooPzpbXj1dfD1cXHMqLmNoZWNrZWQuKS9pLFxuXG5cdHJjbGVhblNjcmlwdCA9IC9eXFxzKjwhXFxbQ0RBVEFcXFt8XFxdXFxdPlxccyokL2c7XG5cbi8vIFByZWZlciBhIHRib2R5IG92ZXIgaXRzIHBhcmVudCB0YWJsZSBmb3IgY29udGFpbmluZyBuZXcgcm93c1xuZnVuY3Rpb24gbWFuaXB1bGF0aW9uVGFyZ2V0KCBlbGVtLCBjb250ZW50ICkge1xuXHRpZiAoIG5vZGVOYW1lKCBlbGVtLCBcInRhYmxlXCIgKSAmJlxuXHRcdG5vZGVOYW1lKCBjb250ZW50Lm5vZGVUeXBlICE9PSAxMSA/IGNvbnRlbnQgOiBjb250ZW50LmZpcnN0Q2hpbGQsIFwidHJcIiApICkge1xuXG5cdFx0cmV0dXJuIGpRdWVyeSggZWxlbSApLmNoaWxkcmVuKCBcInRib2R5XCIgKVsgMCBdIHx8IGVsZW07XG5cdH1cblxuXHRyZXR1cm4gZWxlbTtcbn1cblxuLy8gUmVwbGFjZS9yZXN0b3JlIHRoZSB0eXBlIGF0dHJpYnV0ZSBvZiBzY3JpcHQgZWxlbWVudHMgZm9yIHNhZmUgRE9NIG1hbmlwdWxhdGlvblxuZnVuY3Rpb24gZGlzYWJsZVNjcmlwdCggZWxlbSApIHtcblx0ZWxlbS50eXBlID0gKCBlbGVtLmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSAhPT0gbnVsbCApICsgXCIvXCIgKyBlbGVtLnR5cGU7XG5cdHJldHVybiBlbGVtO1xufVxuZnVuY3Rpb24gcmVzdG9yZVNjcmlwdCggZWxlbSApIHtcblx0aWYgKCAoIGVsZW0udHlwZSB8fCBcIlwiICkuc2xpY2UoIDAsIDUgKSA9PT0gXCJ0cnVlL1wiICkge1xuXHRcdGVsZW0udHlwZSA9IGVsZW0udHlwZS5zbGljZSggNSApO1xuXHR9IGVsc2Uge1xuXHRcdGVsZW0ucmVtb3ZlQXR0cmlidXRlKCBcInR5cGVcIiApO1xuXHR9XG5cblx0cmV0dXJuIGVsZW07XG59XG5cbmZ1bmN0aW9uIGNsb25lQ29weUV2ZW50KCBzcmMsIGRlc3QgKSB7XG5cdHZhciBpLCBsLCB0eXBlLCBwZGF0YU9sZCwgdWRhdGFPbGQsIHVkYXRhQ3VyLCBldmVudHM7XG5cblx0aWYgKCBkZXN0Lm5vZGVUeXBlICE9PSAxICkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIDEuIENvcHkgcHJpdmF0ZSBkYXRhOiBldmVudHMsIGhhbmRsZXJzLCBldGMuXG5cdGlmICggZGF0YVByaXYuaGFzRGF0YSggc3JjICkgKSB7XG5cdFx0cGRhdGFPbGQgPSBkYXRhUHJpdi5nZXQoIHNyYyApO1xuXHRcdGV2ZW50cyA9IHBkYXRhT2xkLmV2ZW50cztcblxuXHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0ZGF0YVByaXYucmVtb3ZlKCBkZXN0LCBcImhhbmRsZSBldmVudHNcIiApO1xuXG5cdFx0XHRmb3IgKCB0eXBlIGluIGV2ZW50cyApIHtcblx0XHRcdFx0Zm9yICggaSA9IDAsIGwgPSBldmVudHNbIHR5cGUgXS5sZW5ndGg7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdFx0alF1ZXJ5LmV2ZW50LmFkZCggZGVzdCwgdHlwZSwgZXZlbnRzWyB0eXBlIF1bIGkgXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gMi4gQ29weSB1c2VyIGRhdGFcblx0aWYgKCBkYXRhVXNlci5oYXNEYXRhKCBzcmMgKSApIHtcblx0XHR1ZGF0YU9sZCA9IGRhdGFVc2VyLmFjY2Vzcyggc3JjICk7XG5cdFx0dWRhdGFDdXIgPSBqUXVlcnkuZXh0ZW5kKCB7fSwgdWRhdGFPbGQgKTtcblxuXHRcdGRhdGFVc2VyLnNldCggZGVzdCwgdWRhdGFDdXIgKTtcblx0fVxufVxuXG4vLyBGaXggSUUgYnVncywgc2VlIHN1cHBvcnQgdGVzdHNcbmZ1bmN0aW9uIGZpeElucHV0KCBzcmMsIGRlc3QgKSB7XG5cdHZhciBub2RlTmFtZSA9IGRlc3Qubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblxuXHQvLyBGYWlscyB0byBwZXJzaXN0IHRoZSBjaGVja2VkIHN0YXRlIG9mIGEgY2xvbmVkIGNoZWNrYm94IG9yIHJhZGlvIGJ1dHRvbi5cblx0aWYgKCBub2RlTmFtZSA9PT0gXCJpbnB1dFwiICYmIHJjaGVja2FibGVUeXBlLnRlc3QoIHNyYy50eXBlICkgKSB7XG5cdFx0ZGVzdC5jaGVja2VkID0gc3JjLmNoZWNrZWQ7XG5cblx0Ly8gRmFpbHMgdG8gcmV0dXJuIHRoZSBzZWxlY3RlZCBvcHRpb24gdG8gdGhlIGRlZmF1bHQgc2VsZWN0ZWQgc3RhdGUgd2hlbiBjbG9uaW5nIG9wdGlvbnNcblx0fSBlbHNlIGlmICggbm9kZU5hbWUgPT09IFwiaW5wdXRcIiB8fCBub2RlTmFtZSA9PT0gXCJ0ZXh0YXJlYVwiICkge1xuXHRcdGRlc3QuZGVmYXVsdFZhbHVlID0gc3JjLmRlZmF1bHRWYWx1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBkb21NYW5pcCggY29sbGVjdGlvbiwgYXJncywgY2FsbGJhY2ssIGlnbm9yZWQgKSB7XG5cblx0Ly8gRmxhdHRlbiBhbnkgbmVzdGVkIGFycmF5c1xuXHRhcmdzID0gZmxhdCggYXJncyApO1xuXG5cdHZhciBmcmFnbWVudCwgZmlyc3QsIHNjcmlwdHMsIGhhc1NjcmlwdHMsIG5vZGUsIGRvYyxcblx0XHRpID0gMCxcblx0XHRsID0gY29sbGVjdGlvbi5sZW5ndGgsXG5cdFx0aU5vQ2xvbmUgPSBsIC0gMSxcblx0XHR2YWx1ZSA9IGFyZ3NbIDAgXSxcblx0XHR2YWx1ZUlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uKCB2YWx1ZSApO1xuXG5cdC8vIFdlIGNhbid0IGNsb25lTm9kZSBmcmFnbWVudHMgdGhhdCBjb250YWluIGNoZWNrZWQsIGluIFdlYktpdFxuXHRpZiAoIHZhbHVlSXNGdW5jdGlvbiB8fFxuXHRcdFx0KCBsID4gMSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiZcblx0XHRcdFx0IXN1cHBvcnQuY2hlY2tDbG9uZSAmJiByY2hlY2tlZC50ZXN0KCB2YWx1ZSApICkgKSB7XG5cdFx0cmV0dXJuIGNvbGxlY3Rpb24uZWFjaCggZnVuY3Rpb24oIGluZGV4ICkge1xuXHRcdFx0dmFyIHNlbGYgPSBjb2xsZWN0aW9uLmVxKCBpbmRleCApO1xuXHRcdFx0aWYgKCB2YWx1ZUlzRnVuY3Rpb24gKSB7XG5cdFx0XHRcdGFyZ3NbIDAgXSA9IHZhbHVlLmNhbGwoIHRoaXMsIGluZGV4LCBzZWxmLmh0bWwoKSApO1xuXHRcdFx0fVxuXHRcdFx0ZG9tTWFuaXAoIHNlbGYsIGFyZ3MsIGNhbGxiYWNrLCBpZ25vcmVkICk7XG5cdFx0fSApO1xuXHR9XG5cblx0aWYgKCBsICkge1xuXHRcdGZyYWdtZW50ID0gYnVpbGRGcmFnbWVudCggYXJncywgY29sbGVjdGlvblsgMCBdLm93bmVyRG9jdW1lbnQsIGZhbHNlLCBjb2xsZWN0aW9uLCBpZ25vcmVkICk7XG5cdFx0Zmlyc3QgPSBmcmFnbWVudC5maXJzdENoaWxkO1xuXG5cdFx0aWYgKCBmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSApIHtcblx0XHRcdGZyYWdtZW50ID0gZmlyc3Q7XG5cdFx0fVxuXG5cdFx0Ly8gUmVxdWlyZSBlaXRoZXIgbmV3IGNvbnRlbnQgb3IgYW4gaW50ZXJlc3QgaW4gaWdub3JlZCBlbGVtZW50cyB0byBpbnZva2UgdGhlIGNhbGxiYWNrXG5cdFx0aWYgKCBmaXJzdCB8fCBpZ25vcmVkICkge1xuXHRcdFx0c2NyaXB0cyA9IGpRdWVyeS5tYXAoIGdldEFsbCggZnJhZ21lbnQsIFwic2NyaXB0XCIgKSwgZGlzYWJsZVNjcmlwdCApO1xuXHRcdFx0aGFzU2NyaXB0cyA9IHNjcmlwdHMubGVuZ3RoO1xuXG5cdFx0XHQvLyBVc2UgdGhlIG9yaWdpbmFsIGZyYWdtZW50IGZvciB0aGUgbGFzdCBpdGVtXG5cdFx0XHQvLyBpbnN0ZWFkIG9mIHRoZSBmaXJzdCBiZWNhdXNlIGl0IGNhbiBlbmQgdXBcblx0XHRcdC8vIGJlaW5nIGVtcHRpZWQgaW5jb3JyZWN0bHkgaW4gY2VydGFpbiBzaXR1YXRpb25zICh0cmFjLTgwNzApLlxuXHRcdFx0Zm9yICggOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRub2RlID0gZnJhZ21lbnQ7XG5cblx0XHRcdFx0aWYgKCBpICE9PSBpTm9DbG9uZSApIHtcblx0XHRcdFx0XHRub2RlID0galF1ZXJ5LmNsb25lKCBub2RlLCB0cnVlLCB0cnVlICk7XG5cblx0XHRcdFx0XHQvLyBLZWVwIHJlZmVyZW5jZXMgdG8gY2xvbmVkIHNjcmlwdHMgZm9yIGxhdGVyIHJlc3RvcmF0aW9uXG5cdFx0XHRcdFx0aWYgKCBoYXNTY3JpcHRzICkge1xuXG5cdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4wIG9ubHksIFBoYW50b21KUyAxIG9ubHlcblx0XHRcdFx0XHRcdC8vIHB1c2guYXBwbHkoXywgYXJyYXlsaWtlKSB0aHJvd3Mgb24gYW5jaWVudCBXZWJLaXRcblx0XHRcdFx0XHRcdGpRdWVyeS5tZXJnZSggc2NyaXB0cywgZ2V0QWxsKCBub2RlLCBcInNjcmlwdFwiICkgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjay5jYWxsKCBjb2xsZWN0aW9uWyBpIF0sIG5vZGUsIGkgKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBoYXNTY3JpcHRzICkge1xuXHRcdFx0XHRkb2MgPSBzY3JpcHRzWyBzY3JpcHRzLmxlbmd0aCAtIDEgXS5vd25lckRvY3VtZW50O1xuXG5cdFx0XHRcdC8vIFJlLWVuYWJsZSBzY3JpcHRzXG5cdFx0XHRcdGpRdWVyeS5tYXAoIHNjcmlwdHMsIHJlc3RvcmVTY3JpcHQgKTtcblxuXHRcdFx0XHQvLyBFdmFsdWF0ZSBleGVjdXRhYmxlIHNjcmlwdHMgb24gZmlyc3QgZG9jdW1lbnQgaW5zZXJ0aW9uXG5cdFx0XHRcdGZvciAoIGkgPSAwOyBpIDwgaGFzU2NyaXB0czsgaSsrICkge1xuXHRcdFx0XHRcdG5vZGUgPSBzY3JpcHRzWyBpIF07XG5cdFx0XHRcdFx0aWYgKCByc2NyaXB0VHlwZS50ZXN0KCBub2RlLnR5cGUgfHwgXCJcIiApICYmXG5cdFx0XHRcdFx0XHQhZGF0YVByaXYuYWNjZXNzKCBub2RlLCBcImdsb2JhbEV2YWxcIiApICYmXG5cdFx0XHRcdFx0XHRqUXVlcnkuY29udGFpbnMoIGRvYywgbm9kZSApICkge1xuXG5cdFx0XHRcdFx0XHRpZiAoIG5vZGUuc3JjICYmICggbm9kZS50eXBlIHx8IFwiXCIgKS50b0xvd2VyQ2FzZSgpICAhPT0gXCJtb2R1bGVcIiApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBPcHRpb25hbCBBSkFYIGRlcGVuZGVuY3ksIGJ1dCB3b24ndCBydW4gc2NyaXB0cyBpZiBub3QgcHJlc2VudFxuXHRcdFx0XHRcdFx0XHRpZiAoIGpRdWVyeS5fZXZhbFVybCAmJiAhbm9kZS5ub01vZHVsZSApIHtcblx0XHRcdFx0XHRcdFx0XHRqUXVlcnkuX2V2YWxVcmwoIG5vZGUuc3JjLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRub25jZTogbm9kZS5ub25jZSB8fCBub2RlLmdldEF0dHJpYnV0ZSggXCJub25jZVwiIClcblx0XHRcdFx0XHRcdFx0XHR9LCBkb2MgKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBVbndyYXAgYSBDREFUQSBzZWN0aW9uIGNvbnRhaW5pbmcgc2NyaXB0IGNvbnRlbnRzLiBUaGlzIHNob3VsZG4ndCBiZVxuXHRcdFx0XHRcdFx0XHQvLyBuZWVkZWQgYXMgaW4gWE1MIGRvY3VtZW50cyB0aGV5J3JlIGFscmVhZHkgbm90IHZpc2libGUgd2hlblxuXHRcdFx0XHRcdFx0XHQvLyBpbnNwZWN0aW5nIGVsZW1lbnQgY29udGVudHMgYW5kIGluIEhUTUwgZG9jdW1lbnRzIHRoZXkgaGF2ZSBub1xuXHRcdFx0XHRcdFx0XHQvLyBtZWFuaW5nIGJ1dCB3ZSdyZSBwcmVzZXJ2aW5nIHRoYXQgbG9naWMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXHRcdFx0XHRcdFx0XHQvLyBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBjb21wbGV0ZWx5IGluIDQuMC4gU2VlIGdoLTQ5MDQuXG5cdFx0XHRcdFx0XHRcdERPTUV2YWwoIG5vZGUudGV4dENvbnRlbnQucmVwbGFjZSggcmNsZWFuU2NyaXB0LCBcIlwiICksIG5vZGUsIGRvYyApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBjb2xsZWN0aW9uO1xufVxuXG5mdW5jdGlvbiByZW1vdmUoIGVsZW0sIHNlbGVjdG9yLCBrZWVwRGF0YSApIHtcblx0dmFyIG5vZGUsXG5cdFx0bm9kZXMgPSBzZWxlY3RvciA/IGpRdWVyeS5maWx0ZXIoIHNlbGVjdG9yLCBlbGVtICkgOiBlbGVtLFxuXHRcdGkgPSAwO1xuXG5cdGZvciAoIDsgKCBub2RlID0gbm9kZXNbIGkgXSApICE9IG51bGw7IGkrKyApIHtcblx0XHRpZiAoICFrZWVwRGF0YSAmJiBub2RlLm5vZGVUeXBlID09PSAxICkge1xuXHRcdFx0alF1ZXJ5LmNsZWFuRGF0YSggZ2V0QWxsKCBub2RlICkgKTtcblx0XHR9XG5cblx0XHRpZiAoIG5vZGUucGFyZW50Tm9kZSApIHtcblx0XHRcdGlmICgga2VlcERhdGEgJiYgaXNBdHRhY2hlZCggbm9kZSApICkge1xuXHRcdFx0XHRzZXRHbG9iYWxFdmFsKCBnZXRBbGwoIG5vZGUsIFwic2NyaXB0XCIgKSApO1xuXHRcdFx0fVxuXHRcdFx0bm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKCBub2RlICk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGVsZW07XG59XG5cbmpRdWVyeS5leHRlbmQoIHtcblx0aHRtbFByZWZpbHRlcjogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0cmV0dXJuIGh0bWw7XG5cdH0sXG5cblx0Y2xvbmU6IGZ1bmN0aW9uKCBlbGVtLCBkYXRhQW5kRXZlbnRzLCBkZWVwRGF0YUFuZEV2ZW50cyApIHtcblx0XHR2YXIgaSwgbCwgc3JjRWxlbWVudHMsIGRlc3RFbGVtZW50cyxcblx0XHRcdGNsb25lID0gZWxlbS5jbG9uZU5vZGUoIHRydWUgKSxcblx0XHRcdGluUGFnZSA9IGlzQXR0YWNoZWQoIGVsZW0gKTtcblxuXHRcdC8vIEZpeCBJRSBjbG9uaW5nIGlzc3Vlc1xuXHRcdGlmICggIXN1cHBvcnQubm9DbG9uZUNoZWNrZWQgJiYgKCBlbGVtLm5vZGVUeXBlID09PSAxIHx8IGVsZW0ubm9kZVR5cGUgPT09IDExICkgJiZcblx0XHRcdFx0IWpRdWVyeS5pc1hNTERvYyggZWxlbSApICkge1xuXG5cdFx0XHQvLyBXZSBlc2NoZXcgalF1ZXJ5I2ZpbmQgaGVyZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29uczpcblx0XHRcdC8vIGh0dHBzOi8vanNwZXJmLmNvbS9nZXRhbGwtdnMtc2l6emxlLzJcblx0XHRcdGRlc3RFbGVtZW50cyA9IGdldEFsbCggY2xvbmUgKTtcblx0XHRcdHNyY0VsZW1lbnRzID0gZ2V0QWxsKCBlbGVtICk7XG5cblx0XHRcdGZvciAoIGkgPSAwLCBsID0gc3JjRWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0XHRmaXhJbnB1dCggc3JjRWxlbWVudHNbIGkgXSwgZGVzdEVsZW1lbnRzWyBpIF0gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBDb3B5IHRoZSBldmVudHMgZnJvbSB0aGUgb3JpZ2luYWwgdG8gdGhlIGNsb25lXG5cdFx0aWYgKCBkYXRhQW5kRXZlbnRzICkge1xuXHRcdFx0aWYgKCBkZWVwRGF0YUFuZEV2ZW50cyApIHtcblx0XHRcdFx0c3JjRWxlbWVudHMgPSBzcmNFbGVtZW50cyB8fCBnZXRBbGwoIGVsZW0gKTtcblx0XHRcdFx0ZGVzdEVsZW1lbnRzID0gZGVzdEVsZW1lbnRzIHx8IGdldEFsbCggY2xvbmUgKTtcblxuXHRcdFx0XHRmb3IgKCBpID0gMCwgbCA9IHNyY0VsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcblx0XHRcdFx0XHRjbG9uZUNvcHlFdmVudCggc3JjRWxlbWVudHNbIGkgXSwgZGVzdEVsZW1lbnRzWyBpIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2xvbmVDb3B5RXZlbnQoIGVsZW0sIGNsb25lICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUHJlc2VydmUgc2NyaXB0IGV2YWx1YXRpb24gaGlzdG9yeVxuXHRcdGRlc3RFbGVtZW50cyA9IGdldEFsbCggY2xvbmUsIFwic2NyaXB0XCIgKTtcblx0XHRpZiAoIGRlc3RFbGVtZW50cy5sZW5ndGggPiAwICkge1xuXHRcdFx0c2V0R2xvYmFsRXZhbCggZGVzdEVsZW1lbnRzLCAhaW5QYWdlICYmIGdldEFsbCggZWxlbSwgXCJzY3JpcHRcIiApICk7XG5cdFx0fVxuXG5cdFx0Ly8gUmV0dXJuIHRoZSBjbG9uZWQgc2V0XG5cdFx0cmV0dXJuIGNsb25lO1xuXHR9LFxuXG5cdGNsZWFuRGF0YTogZnVuY3Rpb24oIGVsZW1zICkge1xuXHRcdHZhciBkYXRhLCBlbGVtLCB0eXBlLFxuXHRcdFx0c3BlY2lhbCA9IGpRdWVyeS5ldmVudC5zcGVjaWFsLFxuXHRcdFx0aSA9IDA7XG5cblx0XHRmb3IgKCA7ICggZWxlbSA9IGVsZW1zWyBpIF0gKSAhPT0gdW5kZWZpbmVkOyBpKysgKSB7XG5cdFx0XHRpZiAoIGFjY2VwdERhdGEoIGVsZW0gKSApIHtcblx0XHRcdFx0aWYgKCAoIGRhdGEgPSBlbGVtWyBkYXRhUHJpdi5leHBhbmRvIF0gKSApIHtcblx0XHRcdFx0XHRpZiAoIGRhdGEuZXZlbnRzICkge1xuXHRcdFx0XHRcdFx0Zm9yICggdHlwZSBpbiBkYXRhLmV2ZW50cyApIHtcblx0XHRcdFx0XHRcdFx0aWYgKCBzcGVjaWFsWyB0eXBlIF0gKSB7XG5cdFx0XHRcdFx0XHRcdFx0alF1ZXJ5LmV2ZW50LnJlbW92ZSggZWxlbSwgdHlwZSApO1xuXG5cdFx0XHRcdFx0XHRcdC8vIFRoaXMgaXMgYSBzaG9ydGN1dCB0byBhdm9pZCBqUXVlcnkuZXZlbnQucmVtb3ZlJ3Mgb3ZlcmhlYWRcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRqUXVlcnkucmVtb3ZlRXZlbnQoIGVsZW0sIHR5cGUsIGRhdGEuaGFuZGxlICk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWUgPD0zNSAtIDQ1K1xuXHRcdFx0XHRcdC8vIEFzc2lnbiB1bmRlZmluZWQgaW5zdGVhZCBvZiB1c2luZyBkZWxldGUsIHNlZSBEYXRhI3JlbW92ZVxuXHRcdFx0XHRcdGVsZW1bIGRhdGFQcml2LmV4cGFuZG8gXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGVsZW1bIGRhdGFVc2VyLmV4cGFuZG8gXSApIHtcblxuXHRcdFx0XHRcdC8vIFN1cHBvcnQ6IENocm9tZSA8PTM1IC0gNDUrXG5cdFx0XHRcdFx0Ly8gQXNzaWduIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIHVzaW5nIGRlbGV0ZSwgc2VlIERhdGEjcmVtb3ZlXG5cdFx0XHRcdFx0ZWxlbVsgZGF0YVVzZXIuZXhwYW5kbyBdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59ICk7XG5cbmpRdWVyeS5mbi5leHRlbmQoIHtcblx0ZGV0YWNoOiBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0cmV0dXJuIHJlbW92ZSggdGhpcywgc2VsZWN0b3IsIHRydWUgKTtcblx0fSxcblxuXHRyZW1vdmU6IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHRyZXR1cm4gcmVtb3ZlKCB0aGlzLCBzZWxlY3RvciApO1xuXHR9LFxuXG5cdHRleHQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHRyZXR1cm4gYWNjZXNzKCB0aGlzLCBmdW5jdGlvbiggdmFsdWUgKSB7XG5cdFx0XHRyZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/XG5cdFx0XHRcdGpRdWVyeS50ZXh0KCB0aGlzICkgOlxuXHRcdFx0XHR0aGlzLmVtcHR5KCkuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCB0aGlzLm5vZGVUeXBlID09PSAxIHx8IHRoaXMubm9kZVR5cGUgPT09IDExIHx8IHRoaXMubm9kZVR5cGUgPT09IDkgKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRleHRDb250ZW50ID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cdFx0fSwgbnVsbCwgdmFsdWUsIGFyZ3VtZW50cy5sZW5ndGggKTtcblx0fSxcblxuXHRhcHBlbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBkb21NYW5pcCggdGhpcywgYXJndW1lbnRzLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdGlmICggdGhpcy5ub2RlVHlwZSA9PT0gMSB8fCB0aGlzLm5vZGVUeXBlID09PSAxMSB8fCB0aGlzLm5vZGVUeXBlID09PSA5ICkge1xuXHRcdFx0XHR2YXIgdGFyZ2V0ID0gbWFuaXB1bGF0aW9uVGFyZ2V0KCB0aGlzLCBlbGVtICk7XG5cdFx0XHRcdHRhcmdldC5hcHBlbmRDaGlsZCggZWxlbSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRwcmVwZW5kOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZG9tTWFuaXAoIHRoaXMsIGFyZ3VtZW50cywgZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRpZiAoIHRoaXMubm9kZVR5cGUgPT09IDEgfHwgdGhpcy5ub2RlVHlwZSA9PT0gMTEgfHwgdGhpcy5ub2RlVHlwZSA9PT0gOSApIHtcblx0XHRcdFx0dmFyIHRhcmdldCA9IG1hbmlwdWxhdGlvblRhcmdldCggdGhpcywgZWxlbSApO1xuXHRcdFx0XHR0YXJnZXQuaW5zZXJ0QmVmb3JlKCBlbGVtLCB0YXJnZXQuZmlyc3RDaGlsZCApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRiZWZvcmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBkb21NYW5pcCggdGhpcywgYXJndW1lbnRzLCBmdW5jdGlvbiggZWxlbSApIHtcblx0XHRcdGlmICggdGhpcy5wYXJlbnROb2RlICkge1xuXHRcdFx0XHR0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKCBlbGVtLCB0aGlzICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdGFmdGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZG9tTWFuaXAoIHRoaXMsIGFyZ3VtZW50cywgZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRpZiAoIHRoaXMucGFyZW50Tm9kZSApIHtcblx0XHRcdFx0dGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZSggZWxlbSwgdGhpcy5uZXh0U2libGluZyApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRlbXB0eTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGVsZW0sXG5cdFx0XHRpID0gMDtcblxuXHRcdGZvciAoIDsgKCBlbGVtID0gdGhpc1sgaSBdICkgIT0gbnVsbDsgaSsrICkge1xuXHRcdFx0aWYgKCBlbGVtLm5vZGVUeXBlID09PSAxICkge1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbWVtb3J5IGxlYWtzXG5cdFx0XHRcdGpRdWVyeS5jbGVhbkRhdGEoIGdldEFsbCggZWxlbSwgZmFsc2UgKSApO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSBhbnkgcmVtYWluaW5nIG5vZGVzXG5cdFx0XHRcdGVsZW0udGV4dENvbnRlbnQgPSBcIlwiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGNsb25lOiBmdW5jdGlvbiggZGF0YUFuZEV2ZW50cywgZGVlcERhdGFBbmRFdmVudHMgKSB7XG5cdFx0ZGF0YUFuZEV2ZW50cyA9IGRhdGFBbmRFdmVudHMgPT0gbnVsbCA/IGZhbHNlIDogZGF0YUFuZEV2ZW50cztcblx0XHRkZWVwRGF0YUFuZEV2ZW50cyA9IGRlZXBEYXRhQW5kRXZlbnRzID09IG51bGwgPyBkYXRhQW5kRXZlbnRzIDogZGVlcERhdGFBbmRFdmVudHM7XG5cblx0XHRyZXR1cm4gdGhpcy5tYXAoIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGpRdWVyeS5jbG9uZSggdGhpcywgZGF0YUFuZEV2ZW50cywgZGVlcERhdGFBbmRFdmVudHMgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0aHRtbDogZnVuY3Rpb24oIHZhbHVlICkge1xuXHRcdHJldHVybiBhY2Nlc3MoIHRoaXMsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHRcdHZhciBlbGVtID0gdGhpc1sgMCBdIHx8IHt9LFxuXHRcdFx0XHRpID0gMCxcblx0XHRcdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdFx0XHRpZiAoIHZhbHVlID09PSB1bmRlZmluZWQgJiYgZWxlbS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0cmV0dXJuIGVsZW0uaW5uZXJIVE1MO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZWUgaWYgd2UgY2FuIHRha2UgYSBzaG9ydGN1dCBhbmQganVzdCB1c2UgaW5uZXJIVE1MXG5cdFx0XHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiAhcm5vSW5uZXJodG1sLnRlc3QoIHZhbHVlICkgJiZcblx0XHRcdFx0IXdyYXBNYXBbICggcnRhZ05hbWUuZXhlYyggdmFsdWUgKSB8fCBbIFwiXCIsIFwiXCIgXSApWyAxIF0udG9Mb3dlckNhc2UoKSBdICkge1xuXG5cdFx0XHRcdHZhbHVlID0galF1ZXJ5Lmh0bWxQcmVmaWx0ZXIoIHZhbHVlICk7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRmb3IgKCA7IGkgPCBsOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRlbGVtID0gdGhpc1sgaSBdIHx8IHt9O1xuXG5cdFx0XHRcdFx0XHQvLyBSZW1vdmUgZWxlbWVudCBub2RlcyBhbmQgcHJldmVudCBtZW1vcnkgbGVha3Ncblx0XHRcdFx0XHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdFx0alF1ZXJ5LmNsZWFuRGF0YSggZ2V0QWxsKCBlbGVtLCBmYWxzZSApICk7XG5cdFx0XHRcdFx0XHRcdGVsZW0uaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZWxlbSA9IDA7XG5cblx0XHRcdFx0Ly8gSWYgdXNpbmcgaW5uZXJIVE1MIHRocm93cyBhbiBleGNlcHRpb24sIHVzZSB0aGUgZmFsbGJhY2sgbWV0aG9kXG5cdFx0XHRcdH0gY2F0Y2ggKCBlICkge31cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBlbGVtICkge1xuXHRcdFx0XHR0aGlzLmVtcHR5KCkuYXBwZW5kKCB2YWx1ZSApO1xuXHRcdFx0fVxuXHRcdH0sIG51bGwsIHZhbHVlLCBhcmd1bWVudHMubGVuZ3RoICk7XG5cdH0sXG5cblx0cmVwbGFjZVdpdGg6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpZ25vcmVkID0gW107XG5cblx0XHQvLyBNYWtlIHRoZSBjaGFuZ2VzLCByZXBsYWNpbmcgZWFjaCBub24taWdub3JlZCBjb250ZXh0IGVsZW1lbnQgd2l0aCB0aGUgbmV3IGNvbnRlbnRcblx0XHRyZXR1cm4gZG9tTWFuaXAoIHRoaXMsIGFyZ3VtZW50cywgZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHR2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG5cdFx0XHRpZiAoIGpRdWVyeS5pbkFycmF5KCB0aGlzLCBpZ25vcmVkICkgPCAwICkge1xuXHRcdFx0XHRqUXVlcnkuY2xlYW5EYXRhKCBnZXRBbGwoIHRoaXMgKSApO1xuXHRcdFx0XHRpZiAoIHBhcmVudCApIHtcblx0XHRcdFx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKCBlbGVtLCB0aGlzICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdC8vIEZvcmNlIGNhbGxiYWNrIGludm9jYXRpb25cblx0XHR9LCBpZ25vcmVkICk7XG5cdH1cbn0gKTtcblxualF1ZXJ5LmVhY2goIHtcblx0YXBwZW5kVG86IFwiYXBwZW5kXCIsXG5cdHByZXBlbmRUbzogXCJwcmVwZW5kXCIsXG5cdGluc2VydEJlZm9yZTogXCJiZWZvcmVcIixcblx0aW5zZXJ0QWZ0ZXI6IFwiYWZ0ZXJcIixcblx0cmVwbGFjZUFsbDogXCJyZXBsYWNlV2l0aFwiXG59LCBmdW5jdGlvbiggbmFtZSwgb3JpZ2luYWwgKSB7XG5cdGpRdWVyeS5mblsgbmFtZSBdID0gZnVuY3Rpb24oIHNlbGVjdG9yICkge1xuXHRcdHZhciBlbGVtcyxcblx0XHRcdHJldCA9IFtdLFxuXHRcdFx0aW5zZXJ0ID0galF1ZXJ5KCBzZWxlY3RvciApLFxuXHRcdFx0bGFzdCA9IGluc2VydC5sZW5ndGggLSAxLFxuXHRcdFx0aSA9IDA7XG5cblx0XHRmb3IgKCA7IGkgPD0gbGFzdDsgaSsrICkge1xuXHRcdFx0ZWxlbXMgPSBpID09PSBsYXN0ID8gdGhpcyA6IHRoaXMuY2xvbmUoIHRydWUgKTtcblx0XHRcdGpRdWVyeSggaW5zZXJ0WyBpIF0gKVsgb3JpZ2luYWwgXSggZWxlbXMgKTtcblxuXHRcdFx0Ly8gU3VwcG9ydDogQW5kcm9pZCA8PTQuMCBvbmx5LCBQaGFudG9tSlMgMSBvbmx5XG5cdFx0XHQvLyAuZ2V0KCkgYmVjYXVzZSBwdXNoLmFwcGx5KF8sIGFycmF5bGlrZSkgdGhyb3dzIG9uIGFuY2llbnQgV2ViS2l0XG5cdFx0XHRwdXNoLmFwcGx5KCByZXQsIGVsZW1zLmdldCgpICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMucHVzaFN0YWNrKCByZXQgKTtcblx0fTtcbn0gKTtcbnZhciBybnVtbm9ucHggPSBuZXcgUmVnRXhwKCBcIl4oXCIgKyBwbnVtICsgXCIpKD8hcHgpW2EteiVdKyRcIiwgXCJpXCIgKTtcblxudmFyIHJjdXN0b21Qcm9wID0gL14tLS87XG5cblxudmFyIGdldFN0eWxlcyA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgPD0xMSBvbmx5LCBGaXJlZm94IDw9MzAgKHRyYWMtMTUwOTgsIHRyYWMtMTQxNTApXG5cdFx0Ly8gSUUgdGhyb3dzIG9uIGVsZW1lbnRzIGNyZWF0ZWQgaW4gcG9wdXBzXG5cdFx0Ly8gRkYgbWVhbndoaWxlIHRocm93cyBvbiBmcmFtZSBlbGVtZW50cyB0aHJvdWdoIFwiZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZVwiXG5cdFx0dmFyIHZpZXcgPSBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG5cblx0XHRpZiAoICF2aWV3IHx8ICF2aWV3Lm9wZW5lciApIHtcblx0XHRcdHZpZXcgPSB3aW5kb3c7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSggZWxlbSApO1xuXHR9O1xuXG52YXIgc3dhcCA9IGZ1bmN0aW9uKCBlbGVtLCBvcHRpb25zLCBjYWxsYmFjayApIHtcblx0dmFyIHJldCwgbmFtZSxcblx0XHRvbGQgPSB7fTtcblxuXHQvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcblx0Zm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuXHRcdG9sZFsgbmFtZSBdID0gZWxlbS5zdHlsZVsgbmFtZSBdO1xuXHRcdGVsZW0uc3R5bGVbIG5hbWUgXSA9IG9wdGlvbnNbIG5hbWUgXTtcblx0fVxuXG5cdHJldCA9IGNhbGxiYWNrLmNhbGwoIGVsZW0gKTtcblxuXHQvLyBSZXZlcnQgdGhlIG9sZCB2YWx1ZXNcblx0Zm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuXHRcdGVsZW0uc3R5bGVbIG5hbWUgXSA9IG9sZFsgbmFtZSBdO1xuXHR9XG5cblx0cmV0dXJuIHJldDtcbn07XG5cblxudmFyIHJib3hTdHlsZSA9IG5ldyBSZWdFeHAoIGNzc0V4cGFuZC5qb2luKCBcInxcIiApLCBcImlcIiApO1xuXG5cblxuKCBmdW5jdGlvbigpIHtcblxuXHQvLyBFeGVjdXRpbmcgYm90aCBwaXhlbFBvc2l0aW9uICYgYm94U2l6aW5nUmVsaWFibGUgdGVzdHMgcmVxdWlyZSBvbmx5IG9uZSBsYXlvdXRcblx0Ly8gc28gdGhleSdyZSBleGVjdXRlZCBhdCB0aGUgc2FtZSB0aW1lIHRvIHNhdmUgdGhlIHNlY29uZCBjb21wdXRhdGlvbi5cblx0ZnVuY3Rpb24gY29tcHV0ZVN0eWxlVGVzdHMoKSB7XG5cblx0XHQvLyBUaGlzIGlzIGEgc2luZ2xldG9uLCB3ZSBuZWVkIHRvIGV4ZWN1dGUgaXQgb25seSBvbmNlXG5cdFx0aWYgKCAhZGl2ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0xMTExMXB4O3dpZHRoOjYwcHg7XCIgK1xuXHRcdFx0XCJtYXJnaW4tdG9wOjFweDtwYWRkaW5nOjA7Ym9yZGVyOjBcIjtcblx0XHRkaXYuc3R5bGUuY3NzVGV4dCA9XG5cdFx0XHRcInBvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6YmxvY2s7Ym94LXNpemluZzpib3JkZXItYm94O292ZXJmbG93OnNjcm9sbDtcIiArXG5cdFx0XHRcIm1hcmdpbjphdXRvO2JvcmRlcjoxcHg7cGFkZGluZzoxcHg7XCIgK1xuXHRcdFx0XCJ3aWR0aDo2MCU7dG9wOjElXCI7XG5cdFx0ZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKCBjb250YWluZXIgKS5hcHBlbmRDaGlsZCggZGl2ICk7XG5cblx0XHR2YXIgZGl2U3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSggZGl2ICk7XG5cdFx0cGl4ZWxQb3NpdGlvblZhbCA9IGRpdlN0eWxlLnRvcCAhPT0gXCIxJVwiO1xuXG5cdFx0Ly8gU3VwcG9ydDogQW5kcm9pZCA0LjAgLSA0LjMgb25seSwgRmlyZWZveCA8PTMgLSA0NFxuXHRcdHJlbGlhYmxlTWFyZ2luTGVmdFZhbCA9IHJvdW5kUGl4ZWxNZWFzdXJlcyggZGl2U3R5bGUubWFyZ2luTGVmdCApID09PSAxMjtcblxuXHRcdC8vIFN1cHBvcnQ6IEFuZHJvaWQgNC4wIC0gNC4zIG9ubHksIFNhZmFyaSA8PTkuMSAtIDEwLjEsIGlPUyA8PTcuMCAtIDkuM1xuXHRcdC8vIFNvbWUgc3R5bGVzIGNvbWUgYmFjayB3aXRoIHBlcmNlbnRhZ2UgdmFsdWVzLCBldmVuIHRob3VnaCB0aGV5IHNob3VsZG4ndFxuXHRcdGRpdi5zdHlsZS5yaWdodCA9IFwiNjAlXCI7XG5cdFx0cGl4ZWxCb3hTdHlsZXNWYWwgPSByb3VuZFBpeGVsTWVhc3VyZXMoIGRpdlN0eWxlLnJpZ2h0ICkgPT09IDM2O1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgOSAtIDExIG9ubHlcblx0XHQvLyBEZXRlY3QgbWlzcmVwb3J0aW5nIG9mIGNvbnRlbnQgZGltZW5zaW9ucyBmb3IgYm94LXNpemluZzpib3JkZXItYm94IGVsZW1lbnRzXG5cdFx0Ym94U2l6aW5nUmVsaWFibGVWYWwgPSByb3VuZFBpeGVsTWVhc3VyZXMoIGRpdlN0eWxlLndpZHRoICkgPT09IDM2O1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgOSBvbmx5XG5cdFx0Ly8gRGV0ZWN0IG92ZXJmbG93OnNjcm9sbCBzY3Jld2luZXNzIChnaC0zNjk5KVxuXHRcdC8vIFN1cHBvcnQ6IENocm9tZSA8PTY0XG5cdFx0Ly8gRG9uJ3QgZ2V0IHRyaWNrZWQgd2hlbiB6b29tIGFmZmVjdHMgb2Zmc2V0V2lkdGggKGdoLTQwMjkpXG5cdFx0ZGl2LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHRcdHNjcm9sbGJveFNpemVWYWwgPSByb3VuZFBpeGVsTWVhc3VyZXMoIGRpdi5vZmZzZXRXaWR0aCAvIDMgKSA9PT0gMTI7XG5cblx0XHRkb2N1bWVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoIGNvbnRhaW5lciApO1xuXG5cdFx0Ly8gTnVsbGlmeSB0aGUgZGl2IHNvIGl0IHdvdWxkbid0IGJlIHN0b3JlZCBpbiB0aGUgbWVtb3J5IGFuZFxuXHRcdC8vIGl0IHdpbGwgYWxzbyBiZSBhIHNpZ24gdGhhdCBjaGVja3MgYWxyZWFkeSBwZXJmb3JtZWRcblx0XHRkaXYgPSBudWxsO1xuXHR9XG5cblx0ZnVuY3Rpb24gcm91bmRQaXhlbE1lYXN1cmVzKCBtZWFzdXJlICkge1xuXHRcdHJldHVybiBNYXRoLnJvdW5kKCBwYXJzZUZsb2F0KCBtZWFzdXJlICkgKTtcblx0fVxuXG5cdHZhciBwaXhlbFBvc2l0aW9uVmFsLCBib3hTaXppbmdSZWxpYWJsZVZhbCwgc2Nyb2xsYm94U2l6ZVZhbCwgcGl4ZWxCb3hTdHlsZXNWYWwsXG5cdFx0cmVsaWFibGVUckRpbWVuc2lvbnNWYWwsIHJlbGlhYmxlTWFyZ2luTGVmdFZhbCxcblx0XHRjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICksXG5cdFx0ZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJkaXZcIiApO1xuXG5cdC8vIEZpbmlzaCBlYXJseSBpbiBsaW1pdGVkIChub24tYnJvd3NlcikgZW52aXJvbm1lbnRzXG5cdGlmICggIWRpdi5zdHlsZSApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBTdXBwb3J0OiBJRSA8PTkgLSAxMSBvbmx5XG5cdC8vIFN0eWxlIG9mIGNsb25lZCBlbGVtZW50IGFmZmVjdHMgc291cmNlIGVsZW1lbnQgY2xvbmVkICh0cmFjLTg5MDgpXG5cdGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ2xpcCA9IFwiY29udGVudC1ib3hcIjtcblx0ZGl2LmNsb25lTm9kZSggdHJ1ZSApLnN0eWxlLmJhY2tncm91bmRDbGlwID0gXCJcIjtcblx0c3VwcG9ydC5jbGVhckNsb25lU3R5bGUgPSBkaXYuc3R5bGUuYmFja2dyb3VuZENsaXAgPT09IFwiY29udGVudC1ib3hcIjtcblxuXHRqUXVlcnkuZXh0ZW5kKCBzdXBwb3J0LCB7XG5cdFx0Ym94U2l6aW5nUmVsaWFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29tcHV0ZVN0eWxlVGVzdHMoKTtcblx0XHRcdHJldHVybiBib3hTaXppbmdSZWxpYWJsZVZhbDtcblx0XHR9LFxuXHRcdHBpeGVsQm94U3R5bGVzOiBmdW5jdGlvbigpIHtcblx0XHRcdGNvbXB1dGVTdHlsZVRlc3RzKCk7XG5cdFx0XHRyZXR1cm4gcGl4ZWxCb3hTdHlsZXNWYWw7XG5cdFx0fSxcblx0XHRwaXhlbFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRcdGNvbXB1dGVTdHlsZVRlc3RzKCk7XG5cdFx0XHRyZXR1cm4gcGl4ZWxQb3NpdGlvblZhbDtcblx0XHR9LFxuXHRcdHJlbGlhYmxlTWFyZ2luTGVmdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRjb21wdXRlU3R5bGVUZXN0cygpO1xuXHRcdFx0cmV0dXJuIHJlbGlhYmxlTWFyZ2luTGVmdFZhbDtcblx0XHR9LFxuXHRcdHNjcm9sbGJveFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29tcHV0ZVN0eWxlVGVzdHMoKTtcblx0XHRcdHJldHVybiBzY3JvbGxib3hTaXplVmFsO1xuXHRcdH0sXG5cblx0XHQvLyBTdXBwb3J0OiBJRSA5IC0gMTErLCBFZGdlIDE1IC0gMTgrXG5cdFx0Ly8gSUUvRWRnZSBtaXNyZXBvcnQgYGdldENvbXB1dGVkU3R5bGVgIG9mIHRhYmxlIHJvd3Mgd2l0aCB3aWR0aC9oZWlnaHRcblx0XHQvLyBzZXQgaW4gQ1NTIHdoaWxlIGBvZmZzZXQqYCBwcm9wZXJ0aWVzIHJlcG9ydCBjb3JyZWN0IHZhbHVlcy5cblx0XHQvLyBCZWhhdmlvciBpbiBJRSA5IGlzIG1vcmUgc3VidGxlIHRoYW4gaW4gbmV3ZXIgdmVyc2lvbnMgJiBpdCBwYXNzZXNcblx0XHQvLyBzb21lIHZlcnNpb25zIG9mIHRoaXMgdGVzdDsgbWFrZSBzdXJlIG5vdCB0byBtYWtlIGl0IHBhc3MgdGhlcmUhXG5cdFx0Ly9cblx0XHQvLyBTdXBwb3J0OiBGaXJlZm94IDcwK1xuXHRcdC8vIE9ubHkgRmlyZWZveCBpbmNsdWRlcyBib3JkZXIgd2lkdGhzXG5cdFx0Ly8gaW4gY29tcHV0ZWQgZGltZW5zaW9ucy4gKGdoLTQ1MjkpXG5cdFx0cmVsaWFibGVUckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRhYmxlLCB0ciwgdHJDaGlsZCwgdHJTdHlsZTtcblx0XHRcdGlmICggcmVsaWFibGVUckRpbWVuc2lvbnNWYWwgPT0gbnVsbCApIHtcblx0XHRcdFx0dGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcInRhYmxlXCIgKTtcblx0XHRcdFx0dHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcInRyXCIgKTtcblx0XHRcdFx0dHJDaGlsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiZGl2XCIgKTtcblxuXHRcdFx0XHR0YWJsZS5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0xMTExMXB4O2JvcmRlci1jb2xsYXBzZTpzZXBhcmF0ZVwiO1xuXHRcdFx0XHR0ci5zdHlsZS5jc3NUZXh0ID0gXCJib3gtc2l6aW5nOmNvbnRlbnQtYm94O2JvcmRlcjoxcHggc29saWRcIjtcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWUgODYrXG5cdFx0XHRcdC8vIEhlaWdodCBzZXQgdGhyb3VnaCBjc3NUZXh0IGRvZXMgbm90IGdldCBhcHBsaWVkLlxuXHRcdFx0XHQvLyBDb21wdXRlZCBoZWlnaHQgdGhlbiBjb21lcyBiYWNrIGFzIDAuXG5cdFx0XHRcdHRyLnN0eWxlLmhlaWdodCA9IFwiMXB4XCI7XG5cdFx0XHRcdHRyQ2hpbGQuc3R5bGUuaGVpZ2h0ID0gXCI5cHhcIjtcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkIDggQ2hyb21lIDg2K1xuXHRcdFx0XHQvLyBJbiBvdXIgYm9keUJhY2tncm91bmQuaHRtbCBpZnJhbWUsXG5cdFx0XHRcdC8vIGRpc3BsYXkgZm9yIGFsbCBkaXYgZWxlbWVudHMgaXMgc2V0IHRvIFwiaW5saW5lXCIsXG5cdFx0XHRcdC8vIHdoaWNoIGNhdXNlcyBhIHByb2JsZW0gb25seSBpbiBBbmRyb2lkIDggQ2hyb21lIDg2LlxuXHRcdFx0XHQvLyBFbnN1cmluZyB0aGUgZGl2IGlzIGBkaXNwbGF5OiBibG9ja2Bcblx0XHRcdFx0Ly8gZ2V0cyBhcm91bmQgdGhpcyBpc3N1ZS5cblx0XHRcdFx0dHJDaGlsZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXG5cdFx0XHRcdGRvY3VtZW50RWxlbWVudFxuXHRcdFx0XHRcdC5hcHBlbmRDaGlsZCggdGFibGUgKVxuXHRcdFx0XHRcdC5hcHBlbmRDaGlsZCggdHIgKVxuXHRcdFx0XHRcdC5hcHBlbmRDaGlsZCggdHJDaGlsZCApO1xuXG5cdFx0XHRcdHRyU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSggdHIgKTtcblx0XHRcdFx0cmVsaWFibGVUckRpbWVuc2lvbnNWYWwgPSAoIHBhcnNlSW50KCB0clN0eWxlLmhlaWdodCwgMTAgKSArXG5cdFx0XHRcdFx0cGFyc2VJbnQoIHRyU3R5bGUuYm9yZGVyVG9wV2lkdGgsIDEwICkgK1xuXHRcdFx0XHRcdHBhcnNlSW50KCB0clN0eWxlLmJvcmRlckJvdHRvbVdpZHRoLCAxMCApICkgPT09IHRyLm9mZnNldEhlaWdodDtcblxuXHRcdFx0XHRkb2N1bWVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoIHRhYmxlICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVsaWFibGVUckRpbWVuc2lvbnNWYWw7XG5cdFx0fVxuXHR9ICk7XG59ICkoKTtcblxuXG5mdW5jdGlvbiBjdXJDU1MoIGVsZW0sIG5hbWUsIGNvbXB1dGVkICkge1xuXHR2YXIgd2lkdGgsIG1pbldpZHRoLCBtYXhXaWR0aCwgcmV0LFxuXHRcdGlzQ3VzdG9tUHJvcCA9IHJjdXN0b21Qcm9wLnRlc3QoIG5hbWUgKSxcblxuXHRcdC8vIFN1cHBvcnQ6IEZpcmVmb3ggNTErXG5cdFx0Ly8gUmV0cmlldmluZyBzdHlsZSBiZWZvcmUgY29tcHV0ZWQgc29tZWhvd1xuXHRcdC8vIGZpeGVzIGFuIGlzc3VlIHdpdGggZ2V0dGluZyB3cm9uZyB2YWx1ZXNcblx0XHQvLyBvbiBkZXRhY2hlZCBlbGVtZW50c1xuXHRcdHN0eWxlID0gZWxlbS5zdHlsZTtcblxuXHRjb21wdXRlZCA9IGNvbXB1dGVkIHx8IGdldFN0eWxlcyggZWxlbSApO1xuXG5cdC8vIGdldFByb3BlcnR5VmFsdWUgaXMgbmVlZGVkIGZvcjpcblx0Ly8gICAuY3NzKCdmaWx0ZXInKSAoSUUgOSBvbmx5LCB0cmFjLTEyNTM3KVxuXHQvLyAgIC5jc3MoJy0tY3VzdG9tUHJvcGVydHkpIChnaC0zMTQ0KVxuXHRpZiAoIGNvbXB1dGVkICkge1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgPD05IC0gMTErXG5cdFx0Ly8gSUUgb25seSBzdXBwb3J0cyBgXCJmbG9hdFwiYCBpbiBgZ2V0UHJvcGVydHlWYWx1ZWA7IGluIGNvbXB1dGVkIHN0eWxlc1xuXHRcdC8vIGl0J3Mgb25seSBhdmFpbGFibGUgYXMgYFwiY3NzRmxvYXRcImAuIFdlIG5vIGxvbmdlciBtb2RpZnkgcHJvcGVydGllc1xuXHRcdC8vIHNlbnQgdG8gYC5jc3MoKWAgYXBhcnQgZnJvbSBjYW1lbENhc2luZywgc28gd2UgbmVlZCB0byBjaGVjayBib3RoLlxuXHRcdC8vIE5vcm1hbGx5LCB0aGlzIHdvdWxkIGNyZWF0ZSBkaWZmZXJlbmNlIGluIGJlaGF2aW9yOiBpZlxuXHRcdC8vIGBnZXRQcm9wZXJ0eVZhbHVlYCByZXR1cm5zIGFuIGVtcHR5IHN0cmluZywgdGhlIHZhbHVlIHJldHVybmVkXG5cdFx0Ly8gYnkgYC5jc3MoKWAgd291bGQgYmUgYHVuZGVmaW5lZGAuIFRoaXMgaXMgdXN1YWxseSB0aGUgY2FzZSBmb3Jcblx0XHQvLyBkaXNjb25uZWN0ZWQgZWxlbWVudHMuIEhvd2V2ZXIsIGluIElFIGV2ZW4gZGlzY29ubmVjdGVkIGVsZW1lbnRzXG5cdFx0Ly8gd2l0aCBubyBzdHlsZXMgcmV0dXJuIGBcIm5vbmVcImAgZm9yIGBnZXRQcm9wZXJ0eVZhbHVlKCBcImZsb2F0XCIgKWBcblx0XHRyZXQgPSBjb21wdXRlZC5nZXRQcm9wZXJ0eVZhbHVlKCBuYW1lICkgfHwgY29tcHV0ZWRbIG5hbWUgXTtcblxuXHRcdGlmICggaXNDdXN0b21Qcm9wICYmIHJldCApIHtcblxuXHRcdFx0Ly8gU3VwcG9ydDogRmlyZWZveCAxMDUrLCBDaHJvbWUgPD0xMDUrXG5cdFx0XHQvLyBTcGVjIHJlcXVpcmVzIHRyaW1taW5nIHdoaXRlc3BhY2UgZm9yIGN1c3RvbSBwcm9wZXJ0aWVzIChnaC00OTI2KS5cblx0XHRcdC8vIEZpcmVmb3ggb25seSB0cmltcyBsZWFkaW5nIHdoaXRlc3BhY2UuIENocm9tZSBqdXN0IGNvbGxhcHNlc1xuXHRcdFx0Ly8gYm90aCBsZWFkaW5nICYgdHJhaWxpbmcgd2hpdGVzcGFjZSB0byBhIHNpbmdsZSBzcGFjZS5cblx0XHRcdC8vXG5cdFx0XHQvLyBGYWxsIGJhY2sgdG8gYHVuZGVmaW5lZGAgaWYgZW1wdHkgc3RyaW5nIHJldHVybmVkLlxuXHRcdFx0Ly8gVGhpcyBjb2xsYXBzZXMgYSBtaXNzaW5nIGRlZmluaXRpb24gd2l0aCBwcm9wZXJ0eSBkZWZpbmVkXG5cdFx0XHQvLyBhbmQgc2V0IHRvIGFuIGVtcHR5IHN0cmluZyBidXQgdGhlcmUncyBubyBzdGFuZGFyZCBBUElcblx0XHRcdC8vIGFsbG93aW5nIHVzIHRvIGRpZmZlcmVudGlhdGUgdGhlbSB3aXRob3V0IGEgcGVyZm9ybWFuY2UgcGVuYWx0eVxuXHRcdFx0Ly8gYW5kIHJldHVybmluZyBgdW5kZWZpbmVkYCBhbGlnbnMgd2l0aCBvbGRlciBqUXVlcnkuXG5cdFx0XHQvL1xuXHRcdFx0Ly8gcnRyaW1DU1MgdHJlYXRzIFUrMDAwRCBDQVJSSUFHRSBSRVRVUk4gYW5kIFUrMDAwQyBGT1JNIEZFRURcblx0XHRcdC8vIGFzIHdoaXRlc3BhY2Ugd2hpbGUgQ1NTIGRvZXMgbm90LCBidXQgdGhpcyBpcyBub3QgYSBwcm9ibGVtXG5cdFx0XHQvLyBiZWNhdXNlIENTUyBwcmVwcm9jZXNzaW5nIHJlcGxhY2VzIHRoZW0gd2l0aCBVKzAwMEEgTElORSBGRUVEXG5cdFx0XHQvLyAod2hpY2ggKmlzKiBDU1Mgd2hpdGVzcGFjZSlcblx0XHRcdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3Mtc3ludGF4LTMvI2lucHV0LXByZXByb2Nlc3Npbmdcblx0XHRcdHJldCA9IHJldC5yZXBsYWNlKCBydHJpbUNTUywgXCIkMVwiICkgfHwgdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGlmICggcmV0ID09PSBcIlwiICYmICFpc0F0dGFjaGVkKCBlbGVtICkgKSB7XG5cdFx0XHRyZXQgPSBqUXVlcnkuc3R5bGUoIGVsZW0sIG5hbWUgKTtcblx0XHR9XG5cblx0XHQvLyBBIHRyaWJ1dGUgdG8gdGhlIFwiYXdlc29tZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1wiXG5cdFx0Ly8gQW5kcm9pZCBCcm93c2VyIHJldHVybnMgcGVyY2VudGFnZSBmb3Igc29tZSB2YWx1ZXMsXG5cdFx0Ly8gYnV0IHdpZHRoIHNlZW1zIHRvIGJlIHJlbGlhYmx5IHBpeGVscy5cblx0XHQvLyBUaGlzIGlzIGFnYWluc3QgdGhlIENTU09NIGRyYWZ0IHNwZWM6XG5cdFx0Ly8gaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzc29tLyNyZXNvbHZlZC12YWx1ZXNcblx0XHRpZiAoICFzdXBwb3J0LnBpeGVsQm94U3R5bGVzKCkgJiYgcm51bW5vbnB4LnRlc3QoIHJldCApICYmIHJib3hTdHlsZS50ZXN0KCBuYW1lICkgKSB7XG5cblx0XHRcdC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcblx0XHRcdHdpZHRoID0gc3R5bGUud2lkdGg7XG5cdFx0XHRtaW5XaWR0aCA9IHN0eWxlLm1pbldpZHRoO1xuXHRcdFx0bWF4V2lkdGggPSBzdHlsZS5tYXhXaWR0aDtcblxuXHRcdFx0Ly8gUHV0IGluIHRoZSBuZXcgdmFsdWVzIHRvIGdldCBhIGNvbXB1dGVkIHZhbHVlIG91dFxuXHRcdFx0c3R5bGUubWluV2lkdGggPSBzdHlsZS5tYXhXaWR0aCA9IHN0eWxlLndpZHRoID0gcmV0O1xuXHRcdFx0cmV0ID0gY29tcHV0ZWQud2lkdGg7XG5cblx0XHRcdC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcblx0XHRcdHN0eWxlLndpZHRoID0gd2lkdGg7XG5cdFx0XHRzdHlsZS5taW5XaWR0aCA9IG1pbldpZHRoO1xuXHRcdFx0c3R5bGUubWF4V2lkdGggPSBtYXhXaWR0aDtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmV0ICE9PSB1bmRlZmluZWQgP1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgPD05IC0gMTEgb25seVxuXHRcdC8vIElFIHJldHVybnMgekluZGV4IHZhbHVlIGFzIGFuIGludGVnZXIuXG5cdFx0cmV0ICsgXCJcIiA6XG5cdFx0cmV0O1xufVxuXG5cbmZ1bmN0aW9uIGFkZEdldEhvb2tJZiggY29uZGl0aW9uRm4sIGhvb2tGbiApIHtcblxuXHQvLyBEZWZpbmUgdGhlIGhvb2ssIHdlJ2xsIGNoZWNrIG9uIHRoZSBmaXJzdCBydW4gaWYgaXQncyByZWFsbHkgbmVlZGVkLlxuXHRyZXR1cm4ge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIGNvbmRpdGlvbkZuKCkgKSB7XG5cblx0XHRcdFx0Ly8gSG9vayBub3QgbmVlZGVkIChvciBpdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgaXQgZHVlXG5cdFx0XHRcdC8vIHRvIG1pc3NpbmcgZGVwZW5kZW5jeSksIHJlbW92ZSBpdC5cblx0XHRcdFx0ZGVsZXRlIHRoaXMuZ2V0O1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIEhvb2sgbmVlZGVkOyByZWRlZmluZSBpdCBzbyB0aGF0IHRoZSBzdXBwb3J0IHRlc3QgaXMgbm90IGV4ZWN1dGVkIGFnYWluLlxuXHRcdFx0cmV0dXJuICggdGhpcy5nZXQgPSBob29rRm4gKS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0fVxuXHR9O1xufVxuXG5cbnZhciBjc3NQcmVmaXhlcyA9IFsgXCJXZWJraXRcIiwgXCJNb3pcIiwgXCJtc1wiIF0sXG5cdGVtcHR5U3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICkuc3R5bGUsXG5cdHZlbmRvclByb3BzID0ge307XG5cbi8vIFJldHVybiBhIHZlbmRvci1wcmVmaXhlZCBwcm9wZXJ0eSBvciB1bmRlZmluZWRcbmZ1bmN0aW9uIHZlbmRvclByb3BOYW1lKCBuYW1lICkge1xuXG5cdC8vIENoZWNrIGZvciB2ZW5kb3IgcHJlZml4ZWQgbmFtZXNcblx0dmFyIGNhcE5hbWUgPSBuYW1lWyAwIF0udG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoIDEgKSxcblx0XHRpID0gY3NzUHJlZml4ZXMubGVuZ3RoO1xuXG5cdHdoaWxlICggaS0tICkge1xuXHRcdG5hbWUgPSBjc3NQcmVmaXhlc1sgaSBdICsgY2FwTmFtZTtcblx0XHRpZiAoIG5hbWUgaW4gZW1wdHlTdHlsZSApIHtcblx0XHRcdHJldHVybiBuYW1lO1xuXHRcdH1cblx0fVxufVxuXG4vLyBSZXR1cm4gYSBwb3RlbnRpYWxseS1tYXBwZWQgalF1ZXJ5LmNzc1Byb3BzIG9yIHZlbmRvciBwcmVmaXhlZCBwcm9wZXJ0eVxuZnVuY3Rpb24gZmluYWxQcm9wTmFtZSggbmFtZSApIHtcblx0dmFyIGZpbmFsID0galF1ZXJ5LmNzc1Byb3BzWyBuYW1lIF0gfHwgdmVuZG9yUHJvcHNbIG5hbWUgXTtcblxuXHRpZiAoIGZpbmFsICkge1xuXHRcdHJldHVybiBmaW5hbDtcblx0fVxuXHRpZiAoIG5hbWUgaW4gZW1wdHlTdHlsZSApIHtcblx0XHRyZXR1cm4gbmFtZTtcblx0fVxuXHRyZXR1cm4gdmVuZG9yUHJvcHNbIG5hbWUgXSA9IHZlbmRvclByb3BOYW1lKCBuYW1lICkgfHwgbmFtZTtcbn1cblxuXG52YXJcblxuXHQvLyBTd2FwcGFibGUgaWYgZGlzcGxheSBpcyBub25lIG9yIHN0YXJ0cyB3aXRoIHRhYmxlXG5cdC8vIGV4Y2VwdCBcInRhYmxlXCIsIFwidGFibGUtY2VsbFwiLCBvciBcInRhYmxlLWNhcHRpb25cIlxuXHQvLyBTZWUgaGVyZSBmb3IgZGlzcGxheSB2YWx1ZXM6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvQ1NTL2Rpc3BsYXlcblx0cmRpc3BsYXlzd2FwID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxuXHRjc3NTaG93ID0geyBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLCB2aXNpYmlsaXR5OiBcImhpZGRlblwiLCBkaXNwbGF5OiBcImJsb2NrXCIgfSxcblx0Y3NzTm9ybWFsVHJhbnNmb3JtID0ge1xuXHRcdGxldHRlclNwYWNpbmc6IFwiMFwiLFxuXHRcdGZvbnRXZWlnaHQ6IFwiNDAwXCJcblx0fTtcblxuZnVuY3Rpb24gc2V0UG9zaXRpdmVOdW1iZXIoIF9lbGVtLCB2YWx1ZSwgc3VidHJhY3QgKSB7XG5cblx0Ly8gQW55IHJlbGF0aXZlICgrLy0pIHZhbHVlcyBoYXZlIGFscmVhZHkgYmVlblxuXHQvLyBub3JtYWxpemVkIGF0IHRoaXMgcG9pbnRcblx0dmFyIG1hdGNoZXMgPSByY3NzTnVtLmV4ZWMoIHZhbHVlICk7XG5cdHJldHVybiBtYXRjaGVzID9cblxuXHRcdC8vIEd1YXJkIGFnYWluc3QgdW5kZWZpbmVkIFwic3VidHJhY3RcIiwgZS5nLiwgd2hlbiB1c2VkIGFzIGluIGNzc0hvb2tzXG5cdFx0TWF0aC5tYXgoIDAsIG1hdGNoZXNbIDIgXSAtICggc3VidHJhY3QgfHwgMCApICkgKyAoIG1hdGNoZXNbIDMgXSB8fCBcInB4XCIgKSA6XG5cdFx0dmFsdWU7XG59XG5cbmZ1bmN0aW9uIGJveE1vZGVsQWRqdXN0bWVudCggZWxlbSwgZGltZW5zaW9uLCBib3gsIGlzQm9yZGVyQm94LCBzdHlsZXMsIGNvbXB1dGVkVmFsICkge1xuXHR2YXIgaSA9IGRpbWVuc2lvbiA9PT0gXCJ3aWR0aFwiID8gMSA6IDAsXG5cdFx0ZXh0cmEgPSAwLFxuXHRcdGRlbHRhID0gMCxcblx0XHRtYXJnaW5EZWx0YSA9IDA7XG5cblx0Ly8gQWRqdXN0bWVudCBtYXkgbm90IGJlIG5lY2Vzc2FyeVxuXHRpZiAoIGJveCA9PT0gKCBpc0JvcmRlckJveCA/IFwiYm9yZGVyXCIgOiBcImNvbnRlbnRcIiApICkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cblx0Zm9yICggOyBpIDwgNDsgaSArPSAyICkge1xuXG5cdFx0Ly8gQm90aCBib3ggbW9kZWxzIGV4Y2x1ZGUgbWFyZ2luXG5cdFx0Ly8gQ291bnQgbWFyZ2luIGRlbHRhIHNlcGFyYXRlbHkgdG8gb25seSBhZGQgaXQgYWZ0ZXIgc2Nyb2xsIGd1dHRlciBhZGp1c3RtZW50LlxuXHRcdC8vIFRoaXMgaXMgbmVlZGVkIHRvIG1ha2UgbmVnYXRpdmUgbWFyZ2lucyB3b3JrIHdpdGggYG91dGVySGVpZ2h0KCB0cnVlIClgIChnaC0zOTgyKS5cblx0XHRpZiAoIGJveCA9PT0gXCJtYXJnaW5cIiApIHtcblx0XHRcdG1hcmdpbkRlbHRhICs9IGpRdWVyeS5jc3MoIGVsZW0sIGJveCArIGNzc0V4cGFuZFsgaSBdLCB0cnVlLCBzdHlsZXMgKTtcblx0XHR9XG5cblx0XHQvLyBJZiB3ZSBnZXQgaGVyZSB3aXRoIGEgY29udGVudC1ib3gsIHdlJ3JlIHNlZWtpbmcgXCJwYWRkaW5nXCIgb3IgXCJib3JkZXJcIiBvciBcIm1hcmdpblwiXG5cdFx0aWYgKCAhaXNCb3JkZXJCb3ggKSB7XG5cblx0XHRcdC8vIEFkZCBwYWRkaW5nXG5cdFx0XHRkZWx0YSArPSBqUXVlcnkuY3NzKCBlbGVtLCBcInBhZGRpbmdcIiArIGNzc0V4cGFuZFsgaSBdLCB0cnVlLCBzdHlsZXMgKTtcblxuXHRcdFx0Ly8gRm9yIFwiYm9yZGVyXCIgb3IgXCJtYXJnaW5cIiwgYWRkIGJvcmRlclxuXHRcdFx0aWYgKCBib3ggIT09IFwicGFkZGluZ1wiICkge1xuXHRcdFx0XHRkZWx0YSArPSBqUXVlcnkuY3NzKCBlbGVtLCBcImJvcmRlclwiICsgY3NzRXhwYW5kWyBpIF0gKyBcIldpZHRoXCIsIHRydWUsIHN0eWxlcyApO1xuXG5cdFx0XHQvLyBCdXQgc3RpbGwga2VlcCB0cmFjayBvZiBpdCBvdGhlcndpc2Vcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV4dHJhICs9IGpRdWVyeS5jc3MoIGVsZW0sIFwiYm9yZGVyXCIgKyBjc3NFeHBhbmRbIGkgXSArIFwiV2lkdGhcIiwgdHJ1ZSwgc3R5bGVzICk7XG5cdFx0XHR9XG5cblx0XHQvLyBJZiB3ZSBnZXQgaGVyZSB3aXRoIGEgYm9yZGVyLWJveCAoY29udGVudCArIHBhZGRpbmcgKyBib3JkZXIpLCB3ZSdyZSBzZWVraW5nIFwiY29udGVudFwiIG9yXG5cdFx0Ly8gXCJwYWRkaW5nXCIgb3IgXCJtYXJnaW5cIlxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdC8vIEZvciBcImNvbnRlbnRcIiwgc3VidHJhY3QgcGFkZGluZ1xuXHRcdFx0aWYgKCBib3ggPT09IFwiY29udGVudFwiICkge1xuXHRcdFx0XHRkZWx0YSAtPSBqUXVlcnkuY3NzKCBlbGVtLCBcInBhZGRpbmdcIiArIGNzc0V4cGFuZFsgaSBdLCB0cnVlLCBzdHlsZXMgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRm9yIFwiY29udGVudFwiIG9yIFwicGFkZGluZ1wiLCBzdWJ0cmFjdCBib3JkZXJcblx0XHRcdGlmICggYm94ICE9PSBcIm1hcmdpblwiICkge1xuXHRcdFx0XHRkZWx0YSAtPSBqUXVlcnkuY3NzKCBlbGVtLCBcImJvcmRlclwiICsgY3NzRXhwYW5kWyBpIF0gKyBcIldpZHRoXCIsIHRydWUsIHN0eWxlcyApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIEFjY291bnQgZm9yIHBvc2l0aXZlIGNvbnRlbnQtYm94IHNjcm9sbCBndXR0ZXIgd2hlbiByZXF1ZXN0ZWQgYnkgcHJvdmlkaW5nIGNvbXB1dGVkVmFsXG5cdGlmICggIWlzQm9yZGVyQm94ICYmIGNvbXB1dGVkVmFsID49IDAgKSB7XG5cblx0XHQvLyBvZmZzZXRXaWR0aC9vZmZzZXRIZWlnaHQgaXMgYSByb3VuZGVkIHN1bSBvZiBjb250ZW50LCBwYWRkaW5nLCBzY3JvbGwgZ3V0dGVyLCBhbmQgYm9yZGVyXG5cdFx0Ly8gQXNzdW1pbmcgaW50ZWdlciBzY3JvbGwgZ3V0dGVyLCBzdWJ0cmFjdCB0aGUgcmVzdCBhbmQgcm91bmQgZG93blxuXHRcdGRlbHRhICs9IE1hdGgubWF4KCAwLCBNYXRoLmNlaWwoXG5cdFx0XHRlbGVtWyBcIm9mZnNldFwiICsgZGltZW5zaW9uWyAwIF0udG9VcHBlckNhc2UoKSArIGRpbWVuc2lvbi5zbGljZSggMSApIF0gLVxuXHRcdFx0Y29tcHV0ZWRWYWwgLVxuXHRcdFx0ZGVsdGEgLVxuXHRcdFx0ZXh0cmEgLVxuXHRcdFx0MC41XG5cblx0XHQvLyBJZiBvZmZzZXRXaWR0aC9vZmZzZXRIZWlnaHQgaXMgdW5rbm93biwgdGhlbiB3ZSBjYW4ndCBkZXRlcm1pbmUgY29udGVudC1ib3ggc2Nyb2xsIGd1dHRlclxuXHRcdC8vIFVzZSBhbiBleHBsaWNpdCB6ZXJvIHRvIGF2b2lkIE5hTiAoZ2gtMzk2NClcblx0XHQpICkgfHwgMDtcblx0fVxuXG5cdHJldHVybiBkZWx0YSArIG1hcmdpbkRlbHRhO1xufVxuXG5mdW5jdGlvbiBnZXRXaWR0aE9ySGVpZ2h0KCBlbGVtLCBkaW1lbnNpb24sIGV4dHJhICkge1xuXG5cdC8vIFN0YXJ0IHdpdGggY29tcHV0ZWQgc3R5bGVcblx0dmFyIHN0eWxlcyA9IGdldFN0eWxlcyggZWxlbSApLFxuXG5cdFx0Ly8gVG8gYXZvaWQgZm9yY2luZyBhIHJlZmxvdywgb25seSBmZXRjaCBib3hTaXppbmcgaWYgd2UgbmVlZCBpdCAoZ2gtNDMyMikuXG5cdFx0Ly8gRmFrZSBjb250ZW50LWJveCB1bnRpbCB3ZSBrbm93IGl0J3MgbmVlZGVkIHRvIGtub3cgdGhlIHRydWUgdmFsdWUuXG5cdFx0Ym94U2l6aW5nTmVlZGVkID0gIXN1cHBvcnQuYm94U2l6aW5nUmVsaWFibGUoKSB8fCBleHRyYSxcblx0XHRpc0JvcmRlckJveCA9IGJveFNpemluZ05lZWRlZCAmJlxuXHRcdFx0alF1ZXJ5LmNzcyggZWxlbSwgXCJib3hTaXppbmdcIiwgZmFsc2UsIHN0eWxlcyApID09PSBcImJvcmRlci1ib3hcIixcblx0XHR2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3gsXG5cblx0XHR2YWwgPSBjdXJDU1MoIGVsZW0sIGRpbWVuc2lvbiwgc3R5bGVzICksXG5cdFx0b2Zmc2V0UHJvcCA9IFwib2Zmc2V0XCIgKyBkaW1lbnNpb25bIDAgXS50b1VwcGVyQ2FzZSgpICsgZGltZW5zaW9uLnNsaWNlKCAxICk7XG5cblx0Ly8gU3VwcG9ydDogRmlyZWZveCA8PTU0XG5cdC8vIFJldHVybiBhIGNvbmZvdW5kaW5nIG5vbi1waXhlbCB2YWx1ZSBvciBmZWlnbiBpZ25vcmFuY2UsIGFzIGFwcHJvcHJpYXRlLlxuXHRpZiAoIHJudW1ub25weC50ZXN0KCB2YWwgKSApIHtcblx0XHRpZiAoICFleHRyYSApIHtcblx0XHRcdHJldHVybiB2YWw7XG5cdFx0fVxuXHRcdHZhbCA9IFwiYXV0b1wiO1xuXHR9XG5cblxuXHQvLyBTdXBwb3J0OiBJRSA5IC0gMTEgb25seVxuXHQvLyBVc2Ugb2Zmc2V0V2lkdGgvb2Zmc2V0SGVpZ2h0IGZvciB3aGVuIGJveCBzaXppbmcgaXMgdW5yZWxpYWJsZS5cblx0Ly8gSW4gdGhvc2UgY2FzZXMsIHRoZSBjb21wdXRlZCB2YWx1ZSBjYW4gYmUgdHJ1c3RlZCB0byBiZSBib3JkZXItYm94LlxuXHRpZiAoICggIXN1cHBvcnQuYm94U2l6aW5nUmVsaWFibGUoKSAmJiBpc0JvcmRlckJveCB8fFxuXG5cdFx0Ly8gU3VwcG9ydDogSUUgMTAgLSAxMSssIEVkZ2UgMTUgLSAxOCtcblx0XHQvLyBJRS9FZGdlIG1pc3JlcG9ydCBgZ2V0Q29tcHV0ZWRTdHlsZWAgb2YgdGFibGUgcm93cyB3aXRoIHdpZHRoL2hlaWdodFxuXHRcdC8vIHNldCBpbiBDU1Mgd2hpbGUgYG9mZnNldCpgIHByb3BlcnRpZXMgcmVwb3J0IGNvcnJlY3QgdmFsdWVzLlxuXHRcdC8vIEludGVyZXN0aW5nbHksIGluIHNvbWUgY2FzZXMgSUUgOSBkb2Vzbid0IHN1ZmZlciBmcm9tIHRoaXMgaXNzdWUuXG5cdFx0IXN1cHBvcnQucmVsaWFibGVUckRpbWVuc2lvbnMoKSAmJiBub2RlTmFtZSggZWxlbSwgXCJ0clwiICkgfHxcblxuXHRcdC8vIEZhbGwgYmFjayB0byBvZmZzZXRXaWR0aC9vZmZzZXRIZWlnaHQgd2hlbiB2YWx1ZSBpcyBcImF1dG9cIlxuXHRcdC8vIFRoaXMgaGFwcGVucyBmb3IgaW5saW5lIGVsZW1lbnRzIHdpdGggbm8gZXhwbGljaXQgc2V0dGluZyAoZ2gtMzU3MSlcblx0XHR2YWwgPT09IFwiYXV0b1wiIHx8XG5cblx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4xIC0gNC4zIG9ubHlcblx0XHQvLyBBbHNvIHVzZSBvZmZzZXRXaWR0aC9vZmZzZXRIZWlnaHQgZm9yIG1pc3JlcG9ydGVkIGlubGluZSBkaW1lbnNpb25zIChnaC0zNjAyKVxuXHRcdCFwYXJzZUZsb2F0KCB2YWwgKSAmJiBqUXVlcnkuY3NzKCBlbGVtLCBcImRpc3BsYXlcIiwgZmFsc2UsIHN0eWxlcyApID09PSBcImlubGluZVwiICkgJiZcblxuXHRcdC8vIE1ha2Ugc3VyZSB0aGUgZWxlbWVudCBpcyB2aXNpYmxlICYgY29ubmVjdGVkXG5cdFx0ZWxlbS5nZXRDbGllbnRSZWN0cygpLmxlbmd0aCApIHtcblxuXHRcdGlzQm9yZGVyQm94ID0galF1ZXJ5LmNzcyggZWxlbSwgXCJib3hTaXppbmdcIiwgZmFsc2UsIHN0eWxlcyApID09PSBcImJvcmRlci1ib3hcIjtcblxuXHRcdC8vIFdoZXJlIGF2YWlsYWJsZSwgb2Zmc2V0V2lkdGgvb2Zmc2V0SGVpZ2h0IGFwcHJveGltYXRlIGJvcmRlciBib3ggZGltZW5zaW9ucy5cblx0XHQvLyBXaGVyZSBub3QgYXZhaWxhYmxlIChlLmcuLCBTVkcpLCBhc3N1bWUgdW5yZWxpYWJsZSBib3gtc2l6aW5nIGFuZCBpbnRlcnByZXQgdGhlXG5cdFx0Ly8gcmV0cmlldmVkIHZhbHVlIGFzIGEgY29udGVudCBib3ggZGltZW5zaW9uLlxuXHRcdHZhbHVlSXNCb3JkZXJCb3ggPSBvZmZzZXRQcm9wIGluIGVsZW07XG5cdFx0aWYgKCB2YWx1ZUlzQm9yZGVyQm94ICkge1xuXHRcdFx0dmFsID0gZWxlbVsgb2Zmc2V0UHJvcCBdO1xuXHRcdH1cblx0fVxuXG5cdC8vIE5vcm1hbGl6ZSBcIlwiIGFuZCBhdXRvXG5cdHZhbCA9IHBhcnNlRmxvYXQoIHZhbCApIHx8IDA7XG5cblx0Ly8gQWRqdXN0IGZvciB0aGUgZWxlbWVudCdzIGJveCBtb2RlbFxuXHRyZXR1cm4gKCB2YWwgK1xuXHRcdGJveE1vZGVsQWRqdXN0bWVudChcblx0XHRcdGVsZW0sXG5cdFx0XHRkaW1lbnNpb24sXG5cdFx0XHRleHRyYSB8fCAoIGlzQm9yZGVyQm94ID8gXCJib3JkZXJcIiA6IFwiY29udGVudFwiICksXG5cdFx0XHR2YWx1ZUlzQm9yZGVyQm94LFxuXHRcdFx0c3R5bGVzLFxuXG5cdFx0XHQvLyBQcm92aWRlIHRoZSBjdXJyZW50IGNvbXB1dGVkIHNpemUgdG8gcmVxdWVzdCBzY3JvbGwgZ3V0dGVyIGNhbGN1bGF0aW9uIChnaC0zNTg5KVxuXHRcdFx0dmFsXG5cdFx0KVxuXHQpICsgXCJweFwiO1xufVxuXG5qUXVlcnkuZXh0ZW5kKCB7XG5cblx0Ly8gQWRkIGluIHN0eWxlIHByb3BlcnR5IGhvb2tzIGZvciBvdmVycmlkaW5nIHRoZSBkZWZhdWx0XG5cdC8vIGJlaGF2aW9yIG9mIGdldHRpbmcgYW5kIHNldHRpbmcgYSBzdHlsZSBwcm9wZXJ0eVxuXHRjc3NIb29rczoge1xuXHRcdG9wYWNpdHk6IHtcblx0XHRcdGdldDogZnVuY3Rpb24oIGVsZW0sIGNvbXB1dGVkICkge1xuXHRcdFx0XHRpZiAoIGNvbXB1dGVkICkge1xuXG5cdFx0XHRcdFx0Ly8gV2Ugc2hvdWxkIGFsd2F5cyBnZXQgYSBudW1iZXIgYmFjayBmcm9tIG9wYWNpdHlcblx0XHRcdFx0XHR2YXIgcmV0ID0gY3VyQ1NTKCBlbGVtLCBcIm9wYWNpdHlcIiApO1xuXHRcdFx0XHRcdHJldHVybiByZXQgPT09IFwiXCIgPyBcIjFcIiA6IHJldDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvLyBEb24ndCBhdXRvbWF0aWNhbGx5IGFkZCBcInB4XCIgdG8gdGhlc2UgcG9zc2libHktdW5pdGxlc3MgcHJvcGVydGllc1xuXHRjc3NOdW1iZXI6IHtcblx0XHRhbmltYXRpb25JdGVyYXRpb25Db3VudDogdHJ1ZSxcblx0XHRhc3BlY3RSYXRpbzogdHJ1ZSxcblx0XHRib3JkZXJJbWFnZVNsaWNlOiB0cnVlLFxuXHRcdGNvbHVtbkNvdW50OiB0cnVlLFxuXHRcdGZsZXhHcm93OiB0cnVlLFxuXHRcdGZsZXhTaHJpbms6IHRydWUsXG5cdFx0Zm9udFdlaWdodDogdHJ1ZSxcblx0XHRncmlkQXJlYTogdHJ1ZSxcblx0XHRncmlkQ29sdW1uOiB0cnVlLFxuXHRcdGdyaWRDb2x1bW5FbmQ6IHRydWUsXG5cdFx0Z3JpZENvbHVtblN0YXJ0OiB0cnVlLFxuXHRcdGdyaWRSb3c6IHRydWUsXG5cdFx0Z3JpZFJvd0VuZDogdHJ1ZSxcblx0XHRncmlkUm93U3RhcnQ6IHRydWUsXG5cdFx0bGluZUhlaWdodDogdHJ1ZSxcblx0XHRvcGFjaXR5OiB0cnVlLFxuXHRcdG9yZGVyOiB0cnVlLFxuXHRcdG9ycGhhbnM6IHRydWUsXG5cdFx0c2NhbGU6IHRydWUsXG5cdFx0d2lkb3dzOiB0cnVlLFxuXHRcdHpJbmRleDogdHJ1ZSxcblx0XHR6b29tOiB0cnVlLFxuXG5cdFx0Ly8gU1ZHLXJlbGF0ZWRcblx0XHRmaWxsT3BhY2l0eTogdHJ1ZSxcblx0XHRmbG9vZE9wYWNpdHk6IHRydWUsXG5cdFx0c3RvcE9wYWNpdHk6IHRydWUsXG5cdFx0c3Ryb2tlTWl0ZXJsaW1pdDogdHJ1ZSxcblx0XHRzdHJva2VPcGFjaXR5OiB0cnVlXG5cdH0sXG5cblx0Ly8gQWRkIGluIHByb3BlcnRpZXMgd2hvc2UgbmFtZXMgeW91IHdpc2ggdG8gZml4IGJlZm9yZVxuXHQvLyBzZXR0aW5nIG9yIGdldHRpbmcgdGhlIHZhbHVlXG5cdGNzc1Byb3BzOiB7fSxcblxuXHQvLyBHZXQgYW5kIHNldCB0aGUgc3R5bGUgcHJvcGVydHkgb24gYSBET00gTm9kZVxuXHRzdHlsZTogZnVuY3Rpb24oIGVsZW0sIG5hbWUsIHZhbHVlLCBleHRyYSApIHtcblxuXHRcdC8vIERvbid0IHNldCBzdHlsZXMgb24gdGV4dCBhbmQgY29tbWVudCBub2Rlc1xuXHRcdGlmICggIWVsZW0gfHwgZWxlbS5ub2RlVHlwZSA9PT0gMyB8fCBlbGVtLm5vZGVUeXBlID09PSA4IHx8ICFlbGVtLnN0eWxlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHdlJ3JlIHdvcmtpbmcgd2l0aCB0aGUgcmlnaHQgbmFtZVxuXHRcdHZhciByZXQsIHR5cGUsIGhvb2tzLFxuXHRcdFx0b3JpZ05hbWUgPSBjYW1lbENhc2UoIG5hbWUgKSxcblx0XHRcdGlzQ3VzdG9tUHJvcCA9IHJjdXN0b21Qcm9wLnRlc3QoIG5hbWUgKSxcblx0XHRcdHN0eWxlID0gZWxlbS5zdHlsZTtcblxuXHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHdlJ3JlIHdvcmtpbmcgd2l0aCB0aGUgcmlnaHQgbmFtZS4gV2UgZG9uJ3Rcblx0XHQvLyB3YW50IHRvIHF1ZXJ5IHRoZSB2YWx1ZSBpZiBpdCBpcyBhIENTUyBjdXN0b20gcHJvcGVydHlcblx0XHQvLyBzaW5jZSB0aGV5IGFyZSB1c2VyLWRlZmluZWQuXG5cdFx0aWYgKCAhaXNDdXN0b21Qcm9wICkge1xuXHRcdFx0bmFtZSA9IGZpbmFsUHJvcE5hbWUoIG9yaWdOYW1lICk7XG5cdFx0fVxuXG5cdFx0Ly8gR2V0cyBob29rIGZvciB0aGUgcHJlZml4ZWQgdmVyc2lvbiwgdGhlbiB1bnByZWZpeGVkIHZlcnNpb25cblx0XHRob29rcyA9IGpRdWVyeS5jc3NIb29rc1sgbmFtZSBdIHx8IGpRdWVyeS5jc3NIb29rc1sgb3JpZ05hbWUgXTtcblxuXHRcdC8vIENoZWNrIGlmIHdlJ3JlIHNldHRpbmcgYSB2YWx1ZVxuXHRcdGlmICggdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cblx0XHRcdC8vIENvbnZlcnQgXCIrPVwiIG9yIFwiLT1cIiB0byByZWxhdGl2ZSBudW1iZXJzICh0cmFjLTczNDUpXG5cdFx0XHRpZiAoIHR5cGUgPT09IFwic3RyaW5nXCIgJiYgKCByZXQgPSByY3NzTnVtLmV4ZWMoIHZhbHVlICkgKSAmJiByZXRbIDEgXSApIHtcblx0XHRcdFx0dmFsdWUgPSBhZGp1c3RDU1MoIGVsZW0sIG5hbWUsIHJldCApO1xuXG5cdFx0XHRcdC8vIEZpeGVzIGJ1ZyB0cmFjLTkyMzdcblx0XHRcdFx0dHlwZSA9IFwibnVtYmVyXCI7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE1ha2Ugc3VyZSB0aGF0IG51bGwgYW5kIE5hTiB2YWx1ZXMgYXJlbid0IHNldCAodHJhYy03MTE2KVxuXHRcdFx0aWYgKCB2YWx1ZSA9PSBudWxsIHx8IHZhbHVlICE9PSB2YWx1ZSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBhIG51bWJlciB3YXMgcGFzc2VkIGluLCBhZGQgdGhlIHVuaXQgKGV4Y2VwdCBmb3IgY2VydGFpbiBDU1MgcHJvcGVydGllcylcblx0XHRcdC8vIFRoZSBpc0N1c3RvbVByb3AgY2hlY2sgY2FuIGJlIHJlbW92ZWQgaW4galF1ZXJ5IDQuMCB3aGVuIHdlIG9ubHkgYXV0by1hcHBlbmRcblx0XHRcdC8vIFwicHhcIiB0byBhIGZldyBoYXJkY29kZWQgdmFsdWVzLlxuXHRcdFx0aWYgKCB0eXBlID09PSBcIm51bWJlclwiICYmICFpc0N1c3RvbVByb3AgKSB7XG5cdFx0XHRcdHZhbHVlICs9IHJldCAmJiByZXRbIDMgXSB8fCAoIGpRdWVyeS5jc3NOdW1iZXJbIG9yaWdOYW1lIF0gPyBcIlwiIDogXCJweFwiICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGJhY2tncm91bmQtKiBwcm9wcyBhZmZlY3Qgb3JpZ2luYWwgY2xvbmUncyB2YWx1ZXNcblx0XHRcdGlmICggIXN1cHBvcnQuY2xlYXJDbG9uZVN0eWxlICYmIHZhbHVlID09PSBcIlwiICYmIG5hbWUuaW5kZXhPZiggXCJiYWNrZ3JvdW5kXCIgKSA9PT0gMCApIHtcblx0XHRcdFx0c3R5bGVbIG5hbWUgXSA9IFwiaW5oZXJpdFwiO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBhIGhvb2sgd2FzIHByb3ZpZGVkLCB1c2UgdGhhdCB2YWx1ZSwgb3RoZXJ3aXNlIGp1c3Qgc2V0IHRoZSBzcGVjaWZpZWQgdmFsdWVcblx0XHRcdGlmICggIWhvb2tzIHx8ICEoIFwic2V0XCIgaW4gaG9va3MgKSB8fFxuXHRcdFx0XHQoIHZhbHVlID0gaG9va3Muc2V0KCBlbGVtLCB2YWx1ZSwgZXh0cmEgKSApICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdFx0aWYgKCBpc0N1c3RvbVByb3AgKSB7XG5cdFx0XHRcdFx0c3R5bGUuc2V0UHJvcGVydHkoIG5hbWUsIHZhbHVlICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c3R5bGVbIG5hbWUgXSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBJZiBhIGhvb2sgd2FzIHByb3ZpZGVkIGdldCB0aGUgbm9uLWNvbXB1dGVkIHZhbHVlIGZyb20gdGhlcmVcblx0XHRcdGlmICggaG9va3MgJiYgXCJnZXRcIiBpbiBob29rcyAmJlxuXHRcdFx0XHQoIHJldCA9IGhvb2tzLmdldCggZWxlbSwgZmFsc2UsIGV4dHJhICkgKSAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE90aGVyd2lzZSBqdXN0IGdldCB0aGUgdmFsdWUgZnJvbSB0aGUgc3R5bGUgb2JqZWN0XG5cdFx0XHRyZXR1cm4gc3R5bGVbIG5hbWUgXTtcblx0XHR9XG5cdH0sXG5cblx0Y3NzOiBmdW5jdGlvbiggZWxlbSwgbmFtZSwgZXh0cmEsIHN0eWxlcyApIHtcblx0XHR2YXIgdmFsLCBudW0sIGhvb2tzLFxuXHRcdFx0b3JpZ05hbWUgPSBjYW1lbENhc2UoIG5hbWUgKSxcblx0XHRcdGlzQ3VzdG9tUHJvcCA9IHJjdXN0b21Qcm9wLnRlc3QoIG5hbWUgKTtcblxuXHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHdlJ3JlIHdvcmtpbmcgd2l0aCB0aGUgcmlnaHQgbmFtZS4gV2UgZG9uJ3Rcblx0XHQvLyB3YW50IHRvIG1vZGlmeSB0aGUgdmFsdWUgaWYgaXQgaXMgYSBDU1MgY3VzdG9tIHByb3BlcnR5XG5cdFx0Ly8gc2luY2UgdGhleSBhcmUgdXNlci1kZWZpbmVkLlxuXHRcdGlmICggIWlzQ3VzdG9tUHJvcCApIHtcblx0XHRcdG5hbWUgPSBmaW5hbFByb3BOYW1lKCBvcmlnTmFtZSApO1xuXHRcdH1cblxuXHRcdC8vIFRyeSBwcmVmaXhlZCBuYW1lIGZvbGxvd2VkIGJ5IHRoZSB1bnByZWZpeGVkIG5hbWVcblx0XHRob29rcyA9IGpRdWVyeS5jc3NIb29rc1sgbmFtZSBdIHx8IGpRdWVyeS5jc3NIb29rc1sgb3JpZ05hbWUgXTtcblxuXHRcdC8vIElmIGEgaG9vayB3YXMgcHJvdmlkZWQgZ2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBmcm9tIHRoZXJlXG5cdFx0aWYgKCBob29rcyAmJiBcImdldFwiIGluIGhvb2tzICkge1xuXHRcdFx0dmFsID0gaG9va3MuZ2V0KCBlbGVtLCB0cnVlLCBleHRyYSApO1xuXHRcdH1cblxuXHRcdC8vIE90aGVyd2lzZSwgaWYgYSB3YXkgdG8gZ2V0IHRoZSBjb21wdXRlZCB2YWx1ZSBleGlzdHMsIHVzZSB0aGF0XG5cdFx0aWYgKCB2YWwgPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdHZhbCA9IGN1ckNTUyggZWxlbSwgbmFtZSwgc3R5bGVzICk7XG5cdFx0fVxuXG5cdFx0Ly8gQ29udmVydCBcIm5vcm1hbFwiIHRvIGNvbXB1dGVkIHZhbHVlXG5cdFx0aWYgKCB2YWwgPT09IFwibm9ybWFsXCIgJiYgbmFtZSBpbiBjc3NOb3JtYWxUcmFuc2Zvcm0gKSB7XG5cdFx0XHR2YWwgPSBjc3NOb3JtYWxUcmFuc2Zvcm1bIG5hbWUgXTtcblx0XHR9XG5cblx0XHQvLyBNYWtlIG51bWVyaWMgaWYgZm9yY2VkIG9yIGEgcXVhbGlmaWVyIHdhcyBwcm92aWRlZCBhbmQgdmFsIGxvb2tzIG51bWVyaWNcblx0XHRpZiAoIGV4dHJhID09PSBcIlwiIHx8IGV4dHJhICkge1xuXHRcdFx0bnVtID0gcGFyc2VGbG9hdCggdmFsICk7XG5cdFx0XHRyZXR1cm4gZXh0cmEgPT09IHRydWUgfHwgaXNGaW5pdGUoIG51bSApID8gbnVtIHx8IDAgOiB2YWw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbDtcblx0fVxufSApO1xuXG5qUXVlcnkuZWFjaCggWyBcImhlaWdodFwiLCBcIndpZHRoXCIgXSwgZnVuY3Rpb24oIF9pLCBkaW1lbnNpb24gKSB7XG5cdGpRdWVyeS5jc3NIb29rc1sgZGltZW5zaW9uIF0gPSB7XG5cdFx0Z2V0OiBmdW5jdGlvbiggZWxlbSwgY29tcHV0ZWQsIGV4dHJhICkge1xuXHRcdFx0aWYgKCBjb21wdXRlZCApIHtcblxuXHRcdFx0XHQvLyBDZXJ0YWluIGVsZW1lbnRzIGNhbiBoYXZlIGRpbWVuc2lvbiBpbmZvIGlmIHdlIGludmlzaWJseSBzaG93IHRoZW1cblx0XHRcdFx0Ly8gYnV0IGl0IG11c3QgaGF2ZSBhIGN1cnJlbnQgZGlzcGxheSBzdHlsZSB0aGF0IHdvdWxkIGJlbmVmaXRcblx0XHRcdFx0cmV0dXJuIHJkaXNwbGF5c3dhcC50ZXN0KCBqUXVlcnkuY3NzKCBlbGVtLCBcImRpc3BsYXlcIiApICkgJiZcblxuXHRcdFx0XHRcdC8vIFN1cHBvcnQ6IFNhZmFyaSA4K1xuXHRcdFx0XHRcdC8vIFRhYmxlIGNvbHVtbnMgaW4gU2FmYXJpIGhhdmUgbm9uLXplcm8gb2Zmc2V0V2lkdGggJiB6ZXJvXG5cdFx0XHRcdFx0Ly8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGggdW5sZXNzIGRpc3BsYXkgaXMgY2hhbmdlZC5cblx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8PTExIG9ubHlcblx0XHRcdFx0XHQvLyBSdW5uaW5nIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBvbiBhIGRpc2Nvbm5lY3RlZCBub2RlXG5cdFx0XHRcdFx0Ly8gaW4gSUUgdGhyb3dzIGFuIGVycm9yLlxuXHRcdFx0XHRcdCggIWVsZW0uZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGggfHwgIWVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGggKSA/XG5cdFx0XHRcdFx0c3dhcCggZWxlbSwgY3NzU2hvdywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZ2V0V2lkdGhPckhlaWdodCggZWxlbSwgZGltZW5zaW9uLCBleHRyYSApO1xuXHRcdFx0XHRcdH0gKSA6XG5cdFx0XHRcdFx0Z2V0V2lkdGhPckhlaWdodCggZWxlbSwgZGltZW5zaW9uLCBleHRyYSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRzZXQ6IGZ1bmN0aW9uKCBlbGVtLCB2YWx1ZSwgZXh0cmEgKSB7XG5cdFx0XHR2YXIgbWF0Y2hlcyxcblx0XHRcdFx0c3R5bGVzID0gZ2V0U3R5bGVzKCBlbGVtICksXG5cblx0XHRcdFx0Ly8gT25seSByZWFkIHN0eWxlcy5wb3NpdGlvbiBpZiB0aGUgdGVzdCBoYXMgYSBjaGFuY2UgdG8gZmFpbFxuXHRcdFx0XHQvLyB0byBhdm9pZCBmb3JjaW5nIGEgcmVmbG93LlxuXHRcdFx0XHRzY3JvbGxib3hTaXplQnVnZ3kgPSAhc3VwcG9ydC5zY3JvbGxib3hTaXplKCkgJiZcblx0XHRcdFx0XHRzdHlsZXMucG9zaXRpb24gPT09IFwiYWJzb2x1dGVcIixcblxuXHRcdFx0XHQvLyBUbyBhdm9pZCBmb3JjaW5nIGEgcmVmbG93LCBvbmx5IGZldGNoIGJveFNpemluZyBpZiB3ZSBuZWVkIGl0IChnaC0zOTkxKVxuXHRcdFx0XHRib3hTaXppbmdOZWVkZWQgPSBzY3JvbGxib3hTaXplQnVnZ3kgfHwgZXh0cmEsXG5cdFx0XHRcdGlzQm9yZGVyQm94ID0gYm94U2l6aW5nTmVlZGVkICYmXG5cdFx0XHRcdFx0alF1ZXJ5LmNzcyggZWxlbSwgXCJib3hTaXppbmdcIiwgZmFsc2UsIHN0eWxlcyApID09PSBcImJvcmRlci1ib3hcIixcblx0XHRcdFx0c3VidHJhY3QgPSBleHRyYSA/XG5cdFx0XHRcdFx0Ym94TW9kZWxBZGp1c3RtZW50KFxuXHRcdFx0XHRcdFx0ZWxlbSxcblx0XHRcdFx0XHRcdGRpbWVuc2lvbixcblx0XHRcdFx0XHRcdGV4dHJhLFxuXHRcdFx0XHRcdFx0aXNCb3JkZXJCb3gsXG5cdFx0XHRcdFx0XHRzdHlsZXNcblx0XHRcdFx0XHQpIDpcblx0XHRcdFx0XHQwO1xuXG5cdFx0XHQvLyBBY2NvdW50IGZvciB1bnJlbGlhYmxlIGJvcmRlci1ib3ggZGltZW5zaW9ucyBieSBjb21wYXJpbmcgb2Zmc2V0KiB0byBjb21wdXRlZCBhbmRcblx0XHRcdC8vIGZha2luZyBhIGNvbnRlbnQtYm94IHRvIGdldCBib3JkZXIgYW5kIHBhZGRpbmcgKGdoLTM2OTkpXG5cdFx0XHRpZiAoIGlzQm9yZGVyQm94ICYmIHNjcm9sbGJveFNpemVCdWdneSApIHtcblx0XHRcdFx0c3VidHJhY3QgLT0gTWF0aC5jZWlsKFxuXHRcdFx0XHRcdGVsZW1bIFwib2Zmc2V0XCIgKyBkaW1lbnNpb25bIDAgXS50b1VwcGVyQ2FzZSgpICsgZGltZW5zaW9uLnNsaWNlKCAxICkgXSAtXG5cdFx0XHRcdFx0cGFyc2VGbG9hdCggc3R5bGVzWyBkaW1lbnNpb24gXSApIC1cblx0XHRcdFx0XHRib3hNb2RlbEFkanVzdG1lbnQoIGVsZW0sIGRpbWVuc2lvbiwgXCJib3JkZXJcIiwgZmFsc2UsIHN0eWxlcyApIC1cblx0XHRcdFx0XHQwLjVcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29udmVydCB0byBwaXhlbHMgaWYgdmFsdWUgYWRqdXN0bWVudCBpcyBuZWVkZWRcblx0XHRcdGlmICggc3VidHJhY3QgJiYgKCBtYXRjaGVzID0gcmNzc051bS5leGVjKCB2YWx1ZSApICkgJiZcblx0XHRcdFx0KCBtYXRjaGVzWyAzIF0gfHwgXCJweFwiICkgIT09IFwicHhcIiApIHtcblxuXHRcdFx0XHRlbGVtLnN0eWxlWyBkaW1lbnNpb24gXSA9IHZhbHVlO1xuXHRcdFx0XHR2YWx1ZSA9IGpRdWVyeS5jc3MoIGVsZW0sIGRpbWVuc2lvbiApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc2V0UG9zaXRpdmVOdW1iZXIoIGVsZW0sIHZhbHVlLCBzdWJ0cmFjdCApO1xuXHRcdH1cblx0fTtcbn0gKTtcblxualF1ZXJ5LmNzc0hvb2tzLm1hcmdpbkxlZnQgPSBhZGRHZXRIb29rSWYoIHN1cHBvcnQucmVsaWFibGVNYXJnaW5MZWZ0LFxuXHRmdW5jdGlvbiggZWxlbSwgY29tcHV0ZWQgKSB7XG5cdFx0aWYgKCBjb21wdXRlZCApIHtcblx0XHRcdHJldHVybiAoIHBhcnNlRmxvYXQoIGN1ckNTUyggZWxlbSwgXCJtYXJnaW5MZWZ0XCIgKSApIHx8XG5cdFx0XHRcdGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtXG5cdFx0XHRcdFx0c3dhcCggZWxlbSwgeyBtYXJnaW5MZWZ0OiAwIH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcblx0XHRcdFx0XHR9IClcblx0XHRcdCkgKyBcInB4XCI7XG5cdFx0fVxuXHR9XG4pO1xuXG4vLyBUaGVzZSBob29rcyBhcmUgdXNlZCBieSBhbmltYXRlIHRvIGV4cGFuZCBwcm9wZXJ0aWVzXG5qUXVlcnkuZWFjaCgge1xuXHRtYXJnaW46IFwiXCIsXG5cdHBhZGRpbmc6IFwiXCIsXG5cdGJvcmRlcjogXCJXaWR0aFwiXG59LCBmdW5jdGlvbiggcHJlZml4LCBzdWZmaXggKSB7XG5cdGpRdWVyeS5jc3NIb29rc1sgcHJlZml4ICsgc3VmZml4IF0gPSB7XG5cdFx0ZXhwYW5kOiBmdW5jdGlvbiggdmFsdWUgKSB7XG5cdFx0XHR2YXIgaSA9IDAsXG5cdFx0XHRcdGV4cGFuZGVkID0ge30sXG5cblx0XHRcdFx0Ly8gQXNzdW1lcyBhIHNpbmdsZSBudW1iZXIgaWYgbm90IGEgc3RyaW5nXG5cdFx0XHRcdHBhcnRzID0gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUuc3BsaXQoIFwiIFwiICkgOiBbIHZhbHVlIF07XG5cblx0XHRcdGZvciAoIDsgaSA8IDQ7IGkrKyApIHtcblx0XHRcdFx0ZXhwYW5kZWRbIHByZWZpeCArIGNzc0V4cGFuZFsgaSBdICsgc3VmZml4IF0gPVxuXHRcdFx0XHRcdHBhcnRzWyBpIF0gfHwgcGFydHNbIGkgLSAyIF0gfHwgcGFydHNbIDAgXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGV4cGFuZGVkO1xuXHRcdH1cblx0fTtcblxuXHRpZiAoIHByZWZpeCAhPT0gXCJtYXJnaW5cIiApIHtcblx0XHRqUXVlcnkuY3NzSG9va3NbIHByZWZpeCArIHN1ZmZpeCBdLnNldCA9IHNldFBvc2l0aXZlTnVtYmVyO1xuXHR9XG59ICk7XG5cbmpRdWVyeS5mbi5leHRlbmQoIHtcblx0Y3NzOiBmdW5jdGlvbiggbmFtZSwgdmFsdWUgKSB7XG5cdFx0cmV0dXJuIGFjY2VzcyggdGhpcywgZnVuY3Rpb24oIGVsZW0sIG5hbWUsIHZhbHVlICkge1xuXHRcdFx0dmFyIHN0eWxlcywgbGVuLFxuXHRcdFx0XHRtYXAgPSB7fSxcblx0XHRcdFx0aSA9IDA7XG5cblx0XHRcdGlmICggQXJyYXkuaXNBcnJheSggbmFtZSApICkge1xuXHRcdFx0XHRzdHlsZXMgPSBnZXRTdHlsZXMoIGVsZW0gKTtcblx0XHRcdFx0bGVuID0gbmFtZS5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdFx0bWFwWyBuYW1lWyBpIF0gXSA9IGpRdWVyeS5jc3MoIGVsZW0sIG5hbWVbIGkgXSwgZmFsc2UsIHN0eWxlcyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIG1hcDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgP1xuXHRcdFx0XHRqUXVlcnkuc3R5bGUoIGVsZW0sIG5hbWUsIHZhbHVlICkgOlxuXHRcdFx0XHRqUXVlcnkuY3NzKCBlbGVtLCBuYW1lICk7XG5cdFx0fSwgbmFtZSwgdmFsdWUsIGFyZ3VtZW50cy5sZW5ndGggPiAxICk7XG5cdH1cbn0gKTtcblxuXG5mdW5jdGlvbiBUd2VlbiggZWxlbSwgb3B0aW9ucywgcHJvcCwgZW5kLCBlYXNpbmcgKSB7XG5cdHJldHVybiBuZXcgVHdlZW4ucHJvdG90eXBlLmluaXQoIGVsZW0sIG9wdGlvbnMsIHByb3AsIGVuZCwgZWFzaW5nICk7XG59XG5qUXVlcnkuVHdlZW4gPSBUd2VlbjtcblxuVHdlZW4ucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvcjogVHdlZW4sXG5cdGluaXQ6IGZ1bmN0aW9uKCBlbGVtLCBvcHRpb25zLCBwcm9wLCBlbmQsIGVhc2luZywgdW5pdCApIHtcblx0XHR0aGlzLmVsZW0gPSBlbGVtO1xuXHRcdHRoaXMucHJvcCA9IHByb3A7XG5cdFx0dGhpcy5lYXNpbmcgPSBlYXNpbmcgfHwgalF1ZXJ5LmVhc2luZy5fZGVmYXVsdDtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuc3RhcnQgPSB0aGlzLm5vdyA9IHRoaXMuY3VyKCk7XG5cdFx0dGhpcy5lbmQgPSBlbmQ7XG5cdFx0dGhpcy51bml0ID0gdW5pdCB8fCAoIGpRdWVyeS5jc3NOdW1iZXJbIHByb3AgXSA/IFwiXCIgOiBcInB4XCIgKTtcblx0fSxcblx0Y3VyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaG9va3MgPSBUd2Vlbi5wcm9wSG9va3NbIHRoaXMucHJvcCBdO1xuXG5cdFx0cmV0dXJuIGhvb2tzICYmIGhvb2tzLmdldCA/XG5cdFx0XHRob29rcy5nZXQoIHRoaXMgKSA6XG5cdFx0XHRUd2Vlbi5wcm9wSG9va3MuX2RlZmF1bHQuZ2V0KCB0aGlzICk7XG5cdH0sXG5cdHJ1bjogZnVuY3Rpb24oIHBlcmNlbnQgKSB7XG5cdFx0dmFyIGVhc2VkLFxuXHRcdFx0aG9va3MgPSBUd2Vlbi5wcm9wSG9va3NbIHRoaXMucHJvcCBdO1xuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuZHVyYXRpb24gKSB7XG5cdFx0XHR0aGlzLnBvcyA9IGVhc2VkID0galF1ZXJ5LmVhc2luZ1sgdGhpcy5lYXNpbmcgXShcblx0XHRcdFx0cGVyY2VudCwgdGhpcy5vcHRpb25zLmR1cmF0aW9uICogcGVyY2VudCwgMCwgMSwgdGhpcy5vcHRpb25zLmR1cmF0aW9uXG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnBvcyA9IGVhc2VkID0gcGVyY2VudDtcblx0XHR9XG5cdFx0dGhpcy5ub3cgPSAoIHRoaXMuZW5kIC0gdGhpcy5zdGFydCApICogZWFzZWQgKyB0aGlzLnN0YXJ0O1xuXG5cdFx0aWYgKCB0aGlzLm9wdGlvbnMuc3RlcCApIHtcblx0XHRcdHRoaXMub3B0aW9ucy5zdGVwLmNhbGwoIHRoaXMuZWxlbSwgdGhpcy5ub3csIHRoaXMgKTtcblx0XHR9XG5cblx0XHRpZiAoIGhvb2tzICYmIGhvb2tzLnNldCApIHtcblx0XHRcdGhvb2tzLnNldCggdGhpcyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRUd2Vlbi5wcm9wSG9va3MuX2RlZmF1bHQuc2V0KCB0aGlzICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59O1xuXG5Ud2Vlbi5wcm90b3R5cGUuaW5pdC5wcm90b3R5cGUgPSBUd2Vlbi5wcm90b3R5cGU7XG5cblR3ZWVuLnByb3BIb29rcyA9IHtcblx0X2RlZmF1bHQ6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uKCB0d2VlbiApIHtcblx0XHRcdHZhciByZXN1bHQ7XG5cblx0XHRcdC8vIFVzZSBhIHByb3BlcnR5IG9uIHRoZSBlbGVtZW50IGRpcmVjdGx5IHdoZW4gaXQgaXMgbm90IGEgRE9NIGVsZW1lbnQsXG5cdFx0XHQvLyBvciB3aGVuIHRoZXJlIGlzIG5vIG1hdGNoaW5nIHN0eWxlIHByb3BlcnR5IHRoYXQgZXhpc3RzLlxuXHRcdFx0aWYgKCB0d2Vlbi5lbGVtLm5vZGVUeXBlICE9PSAxIHx8XG5cdFx0XHRcdHR3ZWVuLmVsZW1bIHR3ZWVuLnByb3AgXSAhPSBudWxsICYmIHR3ZWVuLmVsZW0uc3R5bGVbIHR3ZWVuLnByb3AgXSA9PSBudWxsICkge1xuXHRcdFx0XHRyZXR1cm4gdHdlZW4uZWxlbVsgdHdlZW4ucHJvcCBdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBQYXNzaW5nIGFuIGVtcHR5IHN0cmluZyBhcyBhIDNyZCBwYXJhbWV0ZXIgdG8gLmNzcyB3aWxsIGF1dG9tYXRpY2FsbHlcblx0XHRcdC8vIGF0dGVtcHQgYSBwYXJzZUZsb2F0IGFuZCBmYWxsYmFjayB0byBhIHN0cmluZyBpZiB0aGUgcGFyc2UgZmFpbHMuXG5cdFx0XHQvLyBTaW1wbGUgdmFsdWVzIHN1Y2ggYXMgXCIxMHB4XCIgYXJlIHBhcnNlZCB0byBGbG9hdDtcblx0XHRcdC8vIGNvbXBsZXggdmFsdWVzIHN1Y2ggYXMgXCJyb3RhdGUoMXJhZClcIiBhcmUgcmV0dXJuZWQgYXMtaXMuXG5cdFx0XHRyZXN1bHQgPSBqUXVlcnkuY3NzKCB0d2Vlbi5lbGVtLCB0d2Vlbi5wcm9wLCBcIlwiICk7XG5cblx0XHRcdC8vIEVtcHR5IHN0cmluZ3MsIG51bGwsIHVuZGVmaW5lZCBhbmQgXCJhdXRvXCIgYXJlIGNvbnZlcnRlZCB0byAwLlxuXHRcdFx0cmV0dXJuICFyZXN1bHQgfHwgcmVzdWx0ID09PSBcImF1dG9cIiA/IDAgOiByZXN1bHQ7XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uKCB0d2VlbiApIHtcblxuXHRcdFx0Ly8gVXNlIHN0ZXAgaG9vayBmb3IgYmFjayBjb21wYXQuXG5cdFx0XHQvLyBVc2UgY3NzSG9vayBpZiBpdHMgdGhlcmUuXG5cdFx0XHQvLyBVc2UgLnN0eWxlIGlmIGF2YWlsYWJsZSBhbmQgdXNlIHBsYWluIHByb3BlcnRpZXMgd2hlcmUgYXZhaWxhYmxlLlxuXHRcdFx0aWYgKCBqUXVlcnkuZnguc3RlcFsgdHdlZW4ucHJvcCBdICkge1xuXHRcdFx0XHRqUXVlcnkuZnguc3RlcFsgdHdlZW4ucHJvcCBdKCB0d2VlbiApO1xuXHRcdFx0fSBlbHNlIGlmICggdHdlZW4uZWxlbS5ub2RlVHlwZSA9PT0gMSAmJiAoXG5cdFx0XHRcdGpRdWVyeS5jc3NIb29rc1sgdHdlZW4ucHJvcCBdIHx8XG5cdFx0XHRcdFx0dHdlZW4uZWxlbS5zdHlsZVsgZmluYWxQcm9wTmFtZSggdHdlZW4ucHJvcCApIF0gIT0gbnVsbCApICkge1xuXHRcdFx0XHRqUXVlcnkuc3R5bGUoIHR3ZWVuLmVsZW0sIHR3ZWVuLnByb3AsIHR3ZWVuLm5vdyArIHR3ZWVuLnVuaXQgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHR3ZWVuLmVsZW1bIHR3ZWVuLnByb3AgXSA9IHR3ZWVuLm5vdztcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbi8vIFN1cHBvcnQ6IElFIDw9OSBvbmx5XG4vLyBQYW5pYyBiYXNlZCBhcHByb2FjaCB0byBzZXR0aW5nIHRoaW5ncyBvbiBkaXNjb25uZWN0ZWQgbm9kZXNcblR3ZWVuLnByb3BIb29rcy5zY3JvbGxUb3AgPSBUd2Vlbi5wcm9wSG9va3Muc2Nyb2xsTGVmdCA9IHtcblx0c2V0OiBmdW5jdGlvbiggdHdlZW4gKSB7XG5cdFx0aWYgKCB0d2Vlbi5lbGVtLm5vZGVUeXBlICYmIHR3ZWVuLmVsZW0ucGFyZW50Tm9kZSApIHtcblx0XHRcdHR3ZWVuLmVsZW1bIHR3ZWVuLnByb3AgXSA9IHR3ZWVuLm5vdztcblx0XHR9XG5cdH1cbn07XG5cbmpRdWVyeS5lYXNpbmcgPSB7XG5cdGxpbmVhcjogZnVuY3Rpb24oIHAgKSB7XG5cdFx0cmV0dXJuIHA7XG5cdH0sXG5cdHN3aW5nOiBmdW5jdGlvbiggcCApIHtcblx0XHRyZXR1cm4gMC41IC0gTWF0aC5jb3MoIHAgKiBNYXRoLlBJICkgLyAyO1xuXHR9LFxuXHRfZGVmYXVsdDogXCJzd2luZ1wiXG59O1xuXG5qUXVlcnkuZnggPSBUd2Vlbi5wcm90b3R5cGUuaW5pdDtcblxuLy8gQmFjayBjb21wYXQgPDEuOCBleHRlbnNpb24gcG9pbnRcbmpRdWVyeS5meC5zdGVwID0ge307XG5cblxuXG5cbnZhclxuXHRmeE5vdywgaW5Qcm9ncmVzcyxcblx0cmZ4dHlwZXMgPSAvXig/OnRvZ2dsZXxzaG93fGhpZGUpJC8sXG5cdHJydW4gPSAvcXVldWVIb29rcyQvO1xuXG5mdW5jdGlvbiBzY2hlZHVsZSgpIHtcblx0aWYgKCBpblByb2dyZXNzICkge1xuXHRcdGlmICggZG9jdW1lbnQuaGlkZGVuID09PSBmYWxzZSAmJiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICkge1xuXHRcdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggc2NoZWR1bGUgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoIHNjaGVkdWxlLCBqUXVlcnkuZnguaW50ZXJ2YWwgKTtcblx0XHR9XG5cblx0XHRqUXVlcnkuZngudGljaygpO1xuXHR9XG59XG5cbi8vIEFuaW1hdGlvbnMgY3JlYXRlZCBzeW5jaHJvbm91c2x5IHdpbGwgcnVuIHN5bmNocm9ub3VzbHlcbmZ1bmN0aW9uIGNyZWF0ZUZ4Tm93KCkge1xuXHR3aW5kb3cuc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0ZnhOb3cgPSB1bmRlZmluZWQ7XG5cdH0gKTtcblx0cmV0dXJuICggZnhOb3cgPSBEYXRlLm5vdygpICk7XG59XG5cbi8vIEdlbmVyYXRlIHBhcmFtZXRlcnMgdG8gY3JlYXRlIGEgc3RhbmRhcmQgYW5pbWF0aW9uXG5mdW5jdGlvbiBnZW5GeCggdHlwZSwgaW5jbHVkZVdpZHRoICkge1xuXHR2YXIgd2hpY2gsXG5cdFx0aSA9IDAsXG5cdFx0YXR0cnMgPSB7IGhlaWdodDogdHlwZSB9O1xuXG5cdC8vIElmIHdlIGluY2x1ZGUgd2lkdGgsIHN0ZXAgdmFsdWUgaXMgMSB0byBkbyBhbGwgY3NzRXhwYW5kIHZhbHVlcyxcblx0Ly8gb3RoZXJ3aXNlIHN0ZXAgdmFsdWUgaXMgMiB0byBza2lwIG92ZXIgTGVmdCBhbmQgUmlnaHRcblx0aW5jbHVkZVdpZHRoID0gaW5jbHVkZVdpZHRoID8gMSA6IDA7XG5cdGZvciAoIDsgaSA8IDQ7IGkgKz0gMiAtIGluY2x1ZGVXaWR0aCApIHtcblx0XHR3aGljaCA9IGNzc0V4cGFuZFsgaSBdO1xuXHRcdGF0dHJzWyBcIm1hcmdpblwiICsgd2hpY2ggXSA9IGF0dHJzWyBcInBhZGRpbmdcIiArIHdoaWNoIF0gPSB0eXBlO1xuXHR9XG5cblx0aWYgKCBpbmNsdWRlV2lkdGggKSB7XG5cdFx0YXR0cnMub3BhY2l0eSA9IGF0dHJzLndpZHRoID0gdHlwZTtcblx0fVxuXG5cdHJldHVybiBhdHRycztcbn1cblxuZnVuY3Rpb24gY3JlYXRlVHdlZW4oIHZhbHVlLCBwcm9wLCBhbmltYXRpb24gKSB7XG5cdHZhciB0d2Vlbixcblx0XHRjb2xsZWN0aW9uID0gKCBBbmltYXRpb24udHdlZW5lcnNbIHByb3AgXSB8fCBbXSApLmNvbmNhdCggQW5pbWF0aW9uLnR3ZWVuZXJzWyBcIipcIiBdICksXG5cdFx0aW5kZXggPSAwLFxuXHRcdGxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuXHRmb3IgKCA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrICkge1xuXHRcdGlmICggKCB0d2VlbiA9IGNvbGxlY3Rpb25bIGluZGV4IF0uY2FsbCggYW5pbWF0aW9uLCBwcm9wLCB2YWx1ZSApICkgKSB7XG5cblx0XHRcdC8vIFdlJ3JlIGRvbmUgd2l0aCB0aGlzIHByb3BlcnR5XG5cdFx0XHRyZXR1cm4gdHdlZW47XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRQcmVmaWx0ZXIoIGVsZW0sIHByb3BzLCBvcHRzICkge1xuXHR2YXIgcHJvcCwgdmFsdWUsIHRvZ2dsZSwgaG9va3MsIG9sZGZpcmUsIHByb3BUd2VlbiwgcmVzdG9yZURpc3BsYXksIGRpc3BsYXksXG5cdFx0aXNCb3ggPSBcIndpZHRoXCIgaW4gcHJvcHMgfHwgXCJoZWlnaHRcIiBpbiBwcm9wcyxcblx0XHRhbmltID0gdGhpcyxcblx0XHRvcmlnID0ge30sXG5cdFx0c3R5bGUgPSBlbGVtLnN0eWxlLFxuXHRcdGhpZGRlbiA9IGVsZW0ubm9kZVR5cGUgJiYgaXNIaWRkZW5XaXRoaW5UcmVlKCBlbGVtICksXG5cdFx0ZGF0YVNob3cgPSBkYXRhUHJpdi5nZXQoIGVsZW0sIFwiZnhzaG93XCIgKTtcblxuXHQvLyBRdWV1ZS1za2lwcGluZyBhbmltYXRpb25zIGhpamFjayB0aGUgZnggaG9va3Ncblx0aWYgKCAhb3B0cy5xdWV1ZSApIHtcblx0XHRob29rcyA9IGpRdWVyeS5fcXVldWVIb29rcyggZWxlbSwgXCJmeFwiICk7XG5cdFx0aWYgKCBob29rcy51bnF1ZXVlZCA9PSBudWxsICkge1xuXHRcdFx0aG9va3MudW5xdWV1ZWQgPSAwO1xuXHRcdFx0b2xkZmlyZSA9IGhvb2tzLmVtcHR5LmZpcmU7XG5cdFx0XHRob29rcy5lbXB0eS5maXJlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggIWhvb2tzLnVucXVldWVkICkge1xuXHRcdFx0XHRcdG9sZGZpcmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0aG9va3MudW5xdWV1ZWQrKztcblxuXHRcdGFuaW0uYWx3YXlzKCBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gRW5zdXJlIHRoZSBjb21wbGV0ZSBoYW5kbGVyIGlzIGNhbGxlZCBiZWZvcmUgdGhpcyBjb21wbGV0ZXNcblx0XHRcdGFuaW0uYWx3YXlzKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aG9va3MudW5xdWV1ZWQtLTtcblx0XHRcdFx0aWYgKCAhalF1ZXJ5LnF1ZXVlKCBlbGVtLCBcImZ4XCIgKS5sZW5ndGggKSB7XG5cdFx0XHRcdFx0aG9va3MuZW1wdHkuZmlyZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXHR9XG5cblx0Ly8gRGV0ZWN0IHNob3cvaGlkZSBhbmltYXRpb25zXG5cdGZvciAoIHByb3AgaW4gcHJvcHMgKSB7XG5cdFx0dmFsdWUgPSBwcm9wc1sgcHJvcCBdO1xuXHRcdGlmICggcmZ4dHlwZXMudGVzdCggdmFsdWUgKSApIHtcblx0XHRcdGRlbGV0ZSBwcm9wc1sgcHJvcCBdO1xuXHRcdFx0dG9nZ2xlID0gdG9nZ2xlIHx8IHZhbHVlID09PSBcInRvZ2dsZVwiO1xuXHRcdFx0aWYgKCB2YWx1ZSA9PT0gKCBoaWRkZW4gPyBcImhpZGVcIiA6IFwic2hvd1wiICkgKSB7XG5cblx0XHRcdFx0Ly8gUHJldGVuZCB0byBiZSBoaWRkZW4gaWYgdGhpcyBpcyBhIFwic2hvd1wiIGFuZFxuXHRcdFx0XHQvLyB0aGVyZSBpcyBzdGlsbCBkYXRhIGZyb20gYSBzdG9wcGVkIHNob3cvaGlkZVxuXHRcdFx0XHRpZiAoIHZhbHVlID09PSBcInNob3dcIiAmJiBkYXRhU2hvdyAmJiBkYXRhU2hvd1sgcHJvcCBdICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0aGlkZGVuID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyBJZ25vcmUgYWxsIG90aGVyIG5vLW9wIHNob3cvaGlkZSBkYXRhXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdG9yaWdbIHByb3AgXSA9IGRhdGFTaG93ICYmIGRhdGFTaG93WyBwcm9wIF0gfHwgalF1ZXJ5LnN0eWxlKCBlbGVtLCBwcm9wICk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQmFpbCBvdXQgaWYgdGhpcyBpcyBhIG5vLW9wIGxpa2UgLmhpZGUoKS5oaWRlKClcblx0cHJvcFR3ZWVuID0gIWpRdWVyeS5pc0VtcHR5T2JqZWN0KCBwcm9wcyApO1xuXHRpZiAoICFwcm9wVHdlZW4gJiYgalF1ZXJ5LmlzRW1wdHlPYmplY3QoIG9yaWcgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBSZXN0cmljdCBcIm92ZXJmbG93XCIgYW5kIFwiZGlzcGxheVwiIHN0eWxlcyBkdXJpbmcgYm94IGFuaW1hdGlvbnNcblx0aWYgKCBpc0JveCAmJiBlbGVtLm5vZGVUeXBlID09PSAxICkge1xuXG5cdFx0Ly8gU3VwcG9ydDogSUUgPD05IC0gMTEsIEVkZ2UgMTIgLSAxNVxuXHRcdC8vIFJlY29yZCBhbGwgMyBvdmVyZmxvdyBhdHRyaWJ1dGVzIGJlY2F1c2UgSUUgZG9lcyBub3QgaW5mZXIgdGhlIHNob3J0aGFuZFxuXHRcdC8vIGZyb20gaWRlbnRpY2FsbHktdmFsdWVkIG92ZXJmbG93WCBhbmQgb3ZlcmZsb3dZIGFuZCBFZGdlIGp1c3QgbWlycm9yc1xuXHRcdC8vIHRoZSBvdmVyZmxvd1ggdmFsdWUgdGhlcmUuXG5cdFx0b3B0cy5vdmVyZmxvdyA9IFsgc3R5bGUub3ZlcmZsb3csIHN0eWxlLm92ZXJmbG93WCwgc3R5bGUub3ZlcmZsb3dZIF07XG5cblx0XHQvLyBJZGVudGlmeSBhIGRpc3BsYXkgdHlwZSwgcHJlZmVycmluZyBvbGQgc2hvdy9oaWRlIGRhdGEgb3ZlciB0aGUgQ1NTIGNhc2NhZGVcblx0XHRyZXN0b3JlRGlzcGxheSA9IGRhdGFTaG93ICYmIGRhdGFTaG93LmRpc3BsYXk7XG5cdFx0aWYgKCByZXN0b3JlRGlzcGxheSA9PSBudWxsICkge1xuXHRcdFx0cmVzdG9yZURpc3BsYXkgPSBkYXRhUHJpdi5nZXQoIGVsZW0sIFwiZGlzcGxheVwiICk7XG5cdFx0fVxuXHRcdGRpc3BsYXkgPSBqUXVlcnkuY3NzKCBlbGVtLCBcImRpc3BsYXlcIiApO1xuXHRcdGlmICggZGlzcGxheSA9PT0gXCJub25lXCIgKSB7XG5cdFx0XHRpZiAoIHJlc3RvcmVEaXNwbGF5ICkge1xuXHRcdFx0XHRkaXNwbGF5ID0gcmVzdG9yZURpc3BsYXk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIEdldCBub25lbXB0eSB2YWx1ZShzKSBieSB0ZW1wb3JhcmlseSBmb3JjaW5nIHZpc2liaWxpdHlcblx0XHRcdFx0c2hvd0hpZGUoIFsgZWxlbSBdLCB0cnVlICk7XG5cdFx0XHRcdHJlc3RvcmVEaXNwbGF5ID0gZWxlbS5zdHlsZS5kaXNwbGF5IHx8IHJlc3RvcmVEaXNwbGF5O1xuXHRcdFx0XHRkaXNwbGF5ID0galF1ZXJ5LmNzcyggZWxlbSwgXCJkaXNwbGF5XCIgKTtcblx0XHRcdFx0c2hvd0hpZGUoIFsgZWxlbSBdICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gQW5pbWF0ZSBpbmxpbmUgZWxlbWVudHMgYXMgaW5saW5lLWJsb2NrXG5cdFx0aWYgKCBkaXNwbGF5ID09PSBcImlubGluZVwiIHx8IGRpc3BsYXkgPT09IFwiaW5saW5lLWJsb2NrXCIgJiYgcmVzdG9yZURpc3BsYXkgIT0gbnVsbCApIHtcblx0XHRcdGlmICggalF1ZXJ5LmNzcyggZWxlbSwgXCJmbG9hdFwiICkgPT09IFwibm9uZVwiICkge1xuXG5cdFx0XHRcdC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIGRpc3BsYXkgdmFsdWUgYXQgdGhlIGVuZCBvZiBwdXJlIHNob3cvaGlkZSBhbmltYXRpb25zXG5cdFx0XHRcdGlmICggIXByb3BUd2VlbiApIHtcblx0XHRcdFx0XHRhbmltLmRvbmUoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0c3R5bGUuZGlzcGxheSA9IHJlc3RvcmVEaXNwbGF5O1xuXHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0XHRpZiAoIHJlc3RvcmVEaXNwbGF5ID09IG51bGwgKSB7XG5cdFx0XHRcdFx0XHRkaXNwbGF5ID0gc3R5bGUuZGlzcGxheTtcblx0XHRcdFx0XHRcdHJlc3RvcmVEaXNwbGF5ID0gZGlzcGxheSA9PT0gXCJub25lXCIgPyBcIlwiIDogZGlzcGxheTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0c3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKCBvcHRzLm92ZXJmbG93ICkge1xuXHRcdHN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcblx0XHRhbmltLmFsd2F5cyggZnVuY3Rpb24oKSB7XG5cdFx0XHRzdHlsZS5vdmVyZmxvdyA9IG9wdHMub3ZlcmZsb3dbIDAgXTtcblx0XHRcdHN0eWxlLm92ZXJmbG93WCA9IG9wdHMub3ZlcmZsb3dbIDEgXTtcblx0XHRcdHN0eWxlLm92ZXJmbG93WSA9IG9wdHMub3ZlcmZsb3dbIDIgXTtcblx0XHR9ICk7XG5cdH1cblxuXHQvLyBJbXBsZW1lbnQgc2hvdy9oaWRlIGFuaW1hdGlvbnNcblx0cHJvcFR3ZWVuID0gZmFsc2U7XG5cdGZvciAoIHByb3AgaW4gb3JpZyApIHtcblxuXHRcdC8vIEdlbmVyYWwgc2hvdy9oaWRlIHNldHVwIGZvciB0aGlzIGVsZW1lbnQgYW5pbWF0aW9uXG5cdFx0aWYgKCAhcHJvcFR3ZWVuICkge1xuXHRcdFx0aWYgKCBkYXRhU2hvdyApIHtcblx0XHRcdFx0aWYgKCBcImhpZGRlblwiIGluIGRhdGFTaG93ICkge1xuXHRcdFx0XHRcdGhpZGRlbiA9IGRhdGFTaG93LmhpZGRlbjtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGF0YVNob3cgPSBkYXRhUHJpdi5hY2Nlc3MoIGVsZW0sIFwiZnhzaG93XCIsIHsgZGlzcGxheTogcmVzdG9yZURpc3BsYXkgfSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdG9yZSBoaWRkZW4vdmlzaWJsZSBmb3IgdG9nZ2xlIHNvIGAuc3RvcCgpLnRvZ2dsZSgpYCBcInJldmVyc2VzXCJcblx0XHRcdGlmICggdG9nZ2xlICkge1xuXHRcdFx0XHRkYXRhU2hvdy5oaWRkZW4gPSAhaGlkZGVuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTaG93IGVsZW1lbnRzIGJlZm9yZSBhbmltYXRpbmcgdGhlbVxuXHRcdFx0aWYgKCBoaWRkZW4gKSB7XG5cdFx0XHRcdHNob3dIaWRlKCBbIGVsZW0gXSwgdHJ1ZSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1sb29wLWZ1bmMgKi9cblxuXHRcdFx0YW5pbS5kb25lKCBmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIG5vLWxvb3AtZnVuYyAqL1xuXG5cdFx0XHRcdC8vIFRoZSBmaW5hbCBzdGVwIG9mIGEgXCJoaWRlXCIgYW5pbWF0aW9uIGlzIGFjdHVhbGx5IGhpZGluZyB0aGUgZWxlbWVudFxuXHRcdFx0XHRpZiAoICFoaWRkZW4gKSB7XG5cdFx0XHRcdFx0c2hvd0hpZGUoIFsgZWxlbSBdICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGF0YVByaXYucmVtb3ZlKCBlbGVtLCBcImZ4c2hvd1wiICk7XG5cdFx0XHRcdGZvciAoIHByb3AgaW4gb3JpZyApIHtcblx0XHRcdFx0XHRqUXVlcnkuc3R5bGUoIGVsZW0sIHByb3AsIG9yaWdbIHByb3AgXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0Ly8gUGVyLXByb3BlcnR5IHNldHVwXG5cdFx0cHJvcFR3ZWVuID0gY3JlYXRlVHdlZW4oIGhpZGRlbiA/IGRhdGFTaG93WyBwcm9wIF0gOiAwLCBwcm9wLCBhbmltICk7XG5cdFx0aWYgKCAhKCBwcm9wIGluIGRhdGFTaG93ICkgKSB7XG5cdFx0XHRkYXRhU2hvd1sgcHJvcCBdID0gcHJvcFR3ZWVuLnN0YXJ0O1xuXHRcdFx0aWYgKCBoaWRkZW4gKSB7XG5cdFx0XHRcdHByb3BUd2Vlbi5lbmQgPSBwcm9wVHdlZW4uc3RhcnQ7XG5cdFx0XHRcdHByb3BUd2Vlbi5zdGFydCA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHByb3BGaWx0ZXIoIHByb3BzLCBzcGVjaWFsRWFzaW5nICkge1xuXHR2YXIgaW5kZXgsIG5hbWUsIGVhc2luZywgdmFsdWUsIGhvb2tzO1xuXG5cdC8vIGNhbWVsQ2FzZSwgc3BlY2lhbEVhc2luZyBhbmQgZXhwYW5kIGNzc0hvb2sgcGFzc1xuXHRmb3IgKCBpbmRleCBpbiBwcm9wcyApIHtcblx0XHRuYW1lID0gY2FtZWxDYXNlKCBpbmRleCApO1xuXHRcdGVhc2luZyA9IHNwZWNpYWxFYXNpbmdbIG5hbWUgXTtcblx0XHR2YWx1ZSA9IHByb3BzWyBpbmRleCBdO1xuXHRcdGlmICggQXJyYXkuaXNBcnJheSggdmFsdWUgKSApIHtcblx0XHRcdGVhc2luZyA9IHZhbHVlWyAxIF07XG5cdFx0XHR2YWx1ZSA9IHByb3BzWyBpbmRleCBdID0gdmFsdWVbIDAgXTtcblx0XHR9XG5cblx0XHRpZiAoIGluZGV4ICE9PSBuYW1lICkge1xuXHRcdFx0cHJvcHNbIG5hbWUgXSA9IHZhbHVlO1xuXHRcdFx0ZGVsZXRlIHByb3BzWyBpbmRleCBdO1xuXHRcdH1cblxuXHRcdGhvb2tzID0galF1ZXJ5LmNzc0hvb2tzWyBuYW1lIF07XG5cdFx0aWYgKCBob29rcyAmJiBcImV4cGFuZFwiIGluIGhvb2tzICkge1xuXHRcdFx0dmFsdWUgPSBob29rcy5leHBhbmQoIHZhbHVlICk7XG5cdFx0XHRkZWxldGUgcHJvcHNbIG5hbWUgXTtcblxuXHRcdFx0Ly8gTm90IHF1aXRlICQuZXh0ZW5kLCB0aGlzIHdvbid0IG92ZXJ3cml0ZSBleGlzdGluZyBrZXlzLlxuXHRcdFx0Ly8gUmV1c2luZyAnaW5kZXgnIGJlY2F1c2Ugd2UgaGF2ZSB0aGUgY29ycmVjdCBcIm5hbWVcIlxuXHRcdFx0Zm9yICggaW5kZXggaW4gdmFsdWUgKSB7XG5cdFx0XHRcdGlmICggISggaW5kZXggaW4gcHJvcHMgKSApIHtcblx0XHRcdFx0XHRwcm9wc1sgaW5kZXggXSA9IHZhbHVlWyBpbmRleCBdO1xuXHRcdFx0XHRcdHNwZWNpYWxFYXNpbmdbIGluZGV4IF0gPSBlYXNpbmc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0c3BlY2lhbEVhc2luZ1sgbmFtZSBdID0gZWFzaW5nO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBBbmltYXRpb24oIGVsZW0sIHByb3BlcnRpZXMsIG9wdGlvbnMgKSB7XG5cdHZhciByZXN1bHQsXG5cdFx0c3RvcHBlZCxcblx0XHRpbmRleCA9IDAsXG5cdFx0bGVuZ3RoID0gQW5pbWF0aW9uLnByZWZpbHRlcnMubGVuZ3RoLFxuXHRcdGRlZmVycmVkID0galF1ZXJ5LkRlZmVycmVkKCkuYWx3YXlzKCBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gRG9uJ3QgbWF0Y2ggZWxlbSBpbiB0aGUgOmFuaW1hdGVkIHNlbGVjdG9yXG5cdFx0XHRkZWxldGUgdGljay5lbGVtO1xuXHRcdH0gKSxcblx0XHR0aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIHN0b3BwZWQgKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHZhciBjdXJyZW50VGltZSA9IGZ4Tm93IHx8IGNyZWF0ZUZ4Tm93KCksXG5cdFx0XHRcdHJlbWFpbmluZyA9IE1hdGgubWF4KCAwLCBhbmltYXRpb24uc3RhcnRUaW1lICsgYW5pbWF0aW9uLmR1cmF0aW9uIC0gY3VycmVudFRpbWUgKSxcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkIDIuMyBvbmx5XG5cdFx0XHRcdC8vIEFyY2hhaWMgY3Jhc2ggYnVnIHdvbid0IGFsbG93IHVzIHRvIHVzZSBgMSAtICggMC41IHx8IDAgKWAgKHRyYWMtMTI0OTcpXG5cdFx0XHRcdHRlbXAgPSByZW1haW5pbmcgLyBhbmltYXRpb24uZHVyYXRpb24gfHwgMCxcblx0XHRcdFx0cGVyY2VudCA9IDEgLSB0ZW1wLFxuXHRcdFx0XHRpbmRleCA9IDAsXG5cdFx0XHRcdGxlbmd0aCA9IGFuaW1hdGlvbi50d2VlbnMubGVuZ3RoO1xuXG5cdFx0XHRmb3IgKCA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrICkge1xuXHRcdFx0XHRhbmltYXRpb24udHdlZW5zWyBpbmRleCBdLnJ1biggcGVyY2VudCApO1xuXHRcdFx0fVxuXG5cdFx0XHRkZWZlcnJlZC5ub3RpZnlXaXRoKCBlbGVtLCBbIGFuaW1hdGlvbiwgcGVyY2VudCwgcmVtYWluaW5nIF0gKTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUncyBtb3JlIHRvIGRvLCB5aWVsZFxuXHRcdFx0aWYgKCBwZXJjZW50IDwgMSAmJiBsZW5ndGggKSB7XG5cdFx0XHRcdHJldHVybiByZW1haW5pbmc7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHRoaXMgd2FzIGFuIGVtcHR5IGFuaW1hdGlvbiwgc3ludGhlc2l6ZSBhIGZpbmFsIHByb2dyZXNzIG5vdGlmaWNhdGlvblxuXHRcdFx0aWYgKCAhbGVuZ3RoICkge1xuXHRcdFx0XHRkZWZlcnJlZC5ub3RpZnlXaXRoKCBlbGVtLCBbIGFuaW1hdGlvbiwgMSwgMCBdICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlc29sdmUgdGhlIGFuaW1hdGlvbiBhbmQgcmVwb3J0IGl0cyBjb25jbHVzaW9uXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlV2l0aCggZWxlbSwgWyBhbmltYXRpb24gXSApO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cdFx0YW5pbWF0aW9uID0gZGVmZXJyZWQucHJvbWlzZSgge1xuXHRcdFx0ZWxlbTogZWxlbSxcblx0XHRcdHByb3BzOiBqUXVlcnkuZXh0ZW5kKCB7fSwgcHJvcGVydGllcyApLFxuXHRcdFx0b3B0czogalF1ZXJ5LmV4dGVuZCggdHJ1ZSwge1xuXHRcdFx0XHRzcGVjaWFsRWFzaW5nOiB7fSxcblx0XHRcdFx0ZWFzaW5nOiBqUXVlcnkuZWFzaW5nLl9kZWZhdWx0XG5cdFx0XHR9LCBvcHRpb25zICksXG5cdFx0XHRvcmlnaW5hbFByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG5cdFx0XHRvcmlnaW5hbE9wdGlvbnM6IG9wdGlvbnMsXG5cdFx0XHRzdGFydFRpbWU6IGZ4Tm93IHx8IGNyZWF0ZUZ4Tm93KCksXG5cdFx0XHRkdXJhdGlvbjogb3B0aW9ucy5kdXJhdGlvbixcblx0XHRcdHR3ZWVuczogW10sXG5cdFx0XHRjcmVhdGVUd2VlbjogZnVuY3Rpb24oIHByb3AsIGVuZCApIHtcblx0XHRcdFx0dmFyIHR3ZWVuID0galF1ZXJ5LlR3ZWVuKCBlbGVtLCBhbmltYXRpb24ub3B0cywgcHJvcCwgZW5kLFxuXHRcdFx0XHRcdGFuaW1hdGlvbi5vcHRzLnNwZWNpYWxFYXNpbmdbIHByb3AgXSB8fCBhbmltYXRpb24ub3B0cy5lYXNpbmcgKTtcblx0XHRcdFx0YW5pbWF0aW9uLnR3ZWVucy5wdXNoKCB0d2VlbiApO1xuXHRcdFx0XHRyZXR1cm4gdHdlZW47XG5cdFx0XHR9LFxuXHRcdFx0c3RvcDogZnVuY3Rpb24oIGdvdG9FbmQgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IDAsXG5cblx0XHRcdFx0XHQvLyBJZiB3ZSBhcmUgZ29pbmcgdG8gdGhlIGVuZCwgd2Ugd2FudCB0byBydW4gYWxsIHRoZSB0d2VlbnNcblx0XHRcdFx0XHQvLyBvdGhlcndpc2Ugd2Ugc2tpcCB0aGlzIHBhcnRcblx0XHRcdFx0XHRsZW5ndGggPSBnb3RvRW5kID8gYW5pbWF0aW9uLnR3ZWVucy5sZW5ndGggOiAwO1xuXHRcdFx0XHRpZiAoIHN0b3BwZWQgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHRcdH1cblx0XHRcdFx0c3RvcHBlZCA9IHRydWU7XG5cdFx0XHRcdGZvciAoIDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KysgKSB7XG5cdFx0XHRcdFx0YW5pbWF0aW9uLnR3ZWVuc1sgaW5kZXggXS5ydW4oIDEgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJlc29sdmUgd2hlbiB3ZSBwbGF5ZWQgdGhlIGxhc3QgZnJhbWU7IG90aGVyd2lzZSwgcmVqZWN0XG5cdFx0XHRcdGlmICggZ290b0VuZCApIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5ub3RpZnlXaXRoKCBlbGVtLCBbIGFuaW1hdGlvbiwgMSwgMCBdICk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZVdpdGgoIGVsZW0sIFsgYW5pbWF0aW9uLCBnb3RvRW5kIF0gKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3RXaXRoKCBlbGVtLCBbIGFuaW1hdGlvbiwgZ290b0VuZCBdICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9XG5cdFx0fSApLFxuXHRcdHByb3BzID0gYW5pbWF0aW9uLnByb3BzO1xuXG5cdHByb3BGaWx0ZXIoIHByb3BzLCBhbmltYXRpb24ub3B0cy5zcGVjaWFsRWFzaW5nICk7XG5cblx0Zm9yICggOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKyApIHtcblx0XHRyZXN1bHQgPSBBbmltYXRpb24ucHJlZmlsdGVyc1sgaW5kZXggXS5jYWxsKCBhbmltYXRpb24sIGVsZW0sIHByb3BzLCBhbmltYXRpb24ub3B0cyApO1xuXHRcdGlmICggcmVzdWx0ICkge1xuXHRcdFx0aWYgKCBpc0Z1bmN0aW9uKCByZXN1bHQuc3RvcCApICkge1xuXHRcdFx0XHRqUXVlcnkuX3F1ZXVlSG9va3MoIGFuaW1hdGlvbi5lbGVtLCBhbmltYXRpb24ub3B0cy5xdWV1ZSApLnN0b3AgPVxuXHRcdFx0XHRcdHJlc3VsdC5zdG9wLmJpbmQoIHJlc3VsdCApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9XG5cdH1cblxuXHRqUXVlcnkubWFwKCBwcm9wcywgY3JlYXRlVHdlZW4sIGFuaW1hdGlvbiApO1xuXG5cdGlmICggaXNGdW5jdGlvbiggYW5pbWF0aW9uLm9wdHMuc3RhcnQgKSApIHtcblx0XHRhbmltYXRpb24ub3B0cy5zdGFydC5jYWxsKCBlbGVtLCBhbmltYXRpb24gKTtcblx0fVxuXG5cdC8vIEF0dGFjaCBjYWxsYmFja3MgZnJvbSBvcHRpb25zXG5cdGFuaW1hdGlvblxuXHRcdC5wcm9ncmVzcyggYW5pbWF0aW9uLm9wdHMucHJvZ3Jlc3MgKVxuXHRcdC5kb25lKCBhbmltYXRpb24ub3B0cy5kb25lLCBhbmltYXRpb24ub3B0cy5jb21wbGV0ZSApXG5cdFx0LmZhaWwoIGFuaW1hdGlvbi5vcHRzLmZhaWwgKVxuXHRcdC5hbHdheXMoIGFuaW1hdGlvbi5vcHRzLmFsd2F5cyApO1xuXG5cdGpRdWVyeS5meC50aW1lcihcblx0XHRqUXVlcnkuZXh0ZW5kKCB0aWNrLCB7XG5cdFx0XHRlbGVtOiBlbGVtLFxuXHRcdFx0YW5pbTogYW5pbWF0aW9uLFxuXHRcdFx0cXVldWU6IGFuaW1hdGlvbi5vcHRzLnF1ZXVlXG5cdFx0fSApXG5cdCk7XG5cblx0cmV0dXJuIGFuaW1hdGlvbjtcbn1cblxualF1ZXJ5LkFuaW1hdGlvbiA9IGpRdWVyeS5leHRlbmQoIEFuaW1hdGlvbiwge1xuXG5cdHR3ZWVuZXJzOiB7XG5cdFx0XCIqXCI6IFsgZnVuY3Rpb24oIHByb3AsIHZhbHVlICkge1xuXHRcdFx0dmFyIHR3ZWVuID0gdGhpcy5jcmVhdGVUd2VlbiggcHJvcCwgdmFsdWUgKTtcblx0XHRcdGFkanVzdENTUyggdHdlZW4uZWxlbSwgcHJvcCwgcmNzc051bS5leGVjKCB2YWx1ZSApLCB0d2VlbiApO1xuXHRcdFx0cmV0dXJuIHR3ZWVuO1xuXHRcdH0gXVxuXHR9LFxuXG5cdHR3ZWVuZXI6IGZ1bmN0aW9uKCBwcm9wcywgY2FsbGJhY2sgKSB7XG5cdFx0aWYgKCBpc0Z1bmN0aW9uKCBwcm9wcyApICkge1xuXHRcdFx0Y2FsbGJhY2sgPSBwcm9wcztcblx0XHRcdHByb3BzID0gWyBcIipcIiBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm9wcyA9IHByb3BzLm1hdGNoKCBybm90aHRtbHdoaXRlICk7XG5cdFx0fVxuXG5cdFx0dmFyIHByb3AsXG5cdFx0XHRpbmRleCA9IDAsXG5cdFx0XHRsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG5cblx0XHRmb3IgKCA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrICkge1xuXHRcdFx0cHJvcCA9IHByb3BzWyBpbmRleCBdO1xuXHRcdFx0QW5pbWF0aW9uLnR3ZWVuZXJzWyBwcm9wIF0gPSBBbmltYXRpb24udHdlZW5lcnNbIHByb3AgXSB8fCBbXTtcblx0XHRcdEFuaW1hdGlvbi50d2VlbmVyc1sgcHJvcCBdLnVuc2hpZnQoIGNhbGxiYWNrICk7XG5cdFx0fVxuXHR9LFxuXG5cdHByZWZpbHRlcnM6IFsgZGVmYXVsdFByZWZpbHRlciBdLFxuXG5cdHByZWZpbHRlcjogZnVuY3Rpb24oIGNhbGxiYWNrLCBwcmVwZW5kICkge1xuXHRcdGlmICggcHJlcGVuZCApIHtcblx0XHRcdEFuaW1hdGlvbi5wcmVmaWx0ZXJzLnVuc2hpZnQoIGNhbGxiYWNrICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdEFuaW1hdGlvbi5wcmVmaWx0ZXJzLnB1c2goIGNhbGxiYWNrICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbmpRdWVyeS5zcGVlZCA9IGZ1bmN0aW9uKCBzcGVlZCwgZWFzaW5nLCBmbiApIHtcblx0dmFyIG9wdCA9IHNwZWVkICYmIHR5cGVvZiBzcGVlZCA9PT0gXCJvYmplY3RcIiA/IGpRdWVyeS5leHRlbmQoIHt9LCBzcGVlZCApIDoge1xuXHRcdGNvbXBsZXRlOiBmbiB8fCAhZm4gJiYgZWFzaW5nIHx8XG5cdFx0XHRpc0Z1bmN0aW9uKCBzcGVlZCApICYmIHNwZWVkLFxuXHRcdGR1cmF0aW9uOiBzcGVlZCxcblx0XHRlYXNpbmc6IGZuICYmIGVhc2luZyB8fCBlYXNpbmcgJiYgIWlzRnVuY3Rpb24oIGVhc2luZyApICYmIGVhc2luZ1xuXHR9O1xuXG5cdC8vIEdvIHRvIHRoZSBlbmQgc3RhdGUgaWYgZnggYXJlIG9mZlxuXHRpZiAoIGpRdWVyeS5meC5vZmYgKSB7XG5cdFx0b3B0LmR1cmF0aW9uID0gMDtcblxuXHR9IGVsc2Uge1xuXHRcdGlmICggdHlwZW9mIG9wdC5kdXJhdGlvbiAhPT0gXCJudW1iZXJcIiApIHtcblx0XHRcdGlmICggb3B0LmR1cmF0aW9uIGluIGpRdWVyeS5meC5zcGVlZHMgKSB7XG5cdFx0XHRcdG9wdC5kdXJhdGlvbiA9IGpRdWVyeS5meC5zcGVlZHNbIG9wdC5kdXJhdGlvbiBdO1xuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvcHQuZHVyYXRpb24gPSBqUXVlcnkuZnguc3BlZWRzLl9kZWZhdWx0O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIE5vcm1hbGl6ZSBvcHQucXVldWUgLSB0cnVlL3VuZGVmaW5lZC9udWxsIC0+IFwiZnhcIlxuXHRpZiAoIG9wdC5xdWV1ZSA9PSBudWxsIHx8IG9wdC5xdWV1ZSA9PT0gdHJ1ZSApIHtcblx0XHRvcHQucXVldWUgPSBcImZ4XCI7XG5cdH1cblxuXHQvLyBRdWV1ZWluZ1xuXHRvcHQub2xkID0gb3B0LmNvbXBsZXRlO1xuXG5cdG9wdC5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggaXNGdW5jdGlvbiggb3B0Lm9sZCApICkge1xuXHRcdFx0b3B0Lm9sZC5jYWxsKCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBvcHQucXVldWUgKSB7XG5cdFx0XHRqUXVlcnkuZGVxdWV1ZSggdGhpcywgb3B0LnF1ZXVlICk7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBvcHQ7XG59O1xuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdGZhZGVUbzogZnVuY3Rpb24oIHNwZWVkLCB0bywgZWFzaW5nLCBjYWxsYmFjayApIHtcblxuXHRcdC8vIFNob3cgYW55IGhpZGRlbiBlbGVtZW50cyBhZnRlciBzZXR0aW5nIG9wYWNpdHkgdG8gMFxuXHRcdHJldHVybiB0aGlzLmZpbHRlciggaXNIaWRkZW5XaXRoaW5UcmVlICkuY3NzKCBcIm9wYWNpdHlcIiwgMCApLnNob3coKVxuXG5cdFx0XHQvLyBBbmltYXRlIHRvIHRoZSB2YWx1ZSBzcGVjaWZpZWRcblx0XHRcdC5lbmQoKS5hbmltYXRlKCB7IG9wYWNpdHk6IHRvIH0sIHNwZWVkLCBlYXNpbmcsIGNhbGxiYWNrICk7XG5cdH0sXG5cdGFuaW1hdGU6IGZ1bmN0aW9uKCBwcm9wLCBzcGVlZCwgZWFzaW5nLCBjYWxsYmFjayApIHtcblx0XHR2YXIgZW1wdHkgPSBqUXVlcnkuaXNFbXB0eU9iamVjdCggcHJvcCApLFxuXHRcdFx0b3B0YWxsID0galF1ZXJ5LnNwZWVkKCBzcGVlZCwgZWFzaW5nLCBjYWxsYmFjayApLFxuXHRcdFx0ZG9BbmltYXRpb24gPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBPcGVyYXRlIG9uIGEgY29weSBvZiBwcm9wIHNvIHBlci1wcm9wZXJ0eSBlYXNpbmcgd29uJ3QgYmUgbG9zdFxuXHRcdFx0XHR2YXIgYW5pbSA9IEFuaW1hdGlvbiggdGhpcywgalF1ZXJ5LmV4dGVuZCgge30sIHByb3AgKSwgb3B0YWxsICk7XG5cblx0XHRcdFx0Ly8gRW1wdHkgYW5pbWF0aW9ucywgb3IgZmluaXNoaW5nIHJlc29sdmVzIGltbWVkaWF0ZWx5XG5cdFx0XHRcdGlmICggZW1wdHkgfHwgZGF0YVByaXYuZ2V0KCB0aGlzLCBcImZpbmlzaFwiICkgKSB7XG5cdFx0XHRcdFx0YW5pbS5zdG9wKCB0cnVlICk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRkb0FuaW1hdGlvbi5maW5pc2ggPSBkb0FuaW1hdGlvbjtcblxuXHRcdHJldHVybiBlbXB0eSB8fCBvcHRhbGwucXVldWUgPT09IGZhbHNlID9cblx0XHRcdHRoaXMuZWFjaCggZG9BbmltYXRpb24gKSA6XG5cdFx0XHR0aGlzLnF1ZXVlKCBvcHRhbGwucXVldWUsIGRvQW5pbWF0aW9uICk7XG5cdH0sXG5cdHN0b3A6IGZ1bmN0aW9uKCB0eXBlLCBjbGVhclF1ZXVlLCBnb3RvRW5kICkge1xuXHRcdHZhciBzdG9wUXVldWUgPSBmdW5jdGlvbiggaG9va3MgKSB7XG5cdFx0XHR2YXIgc3RvcCA9IGhvb2tzLnN0b3A7XG5cdFx0XHRkZWxldGUgaG9va3Muc3RvcDtcblx0XHRcdHN0b3AoIGdvdG9FbmQgKTtcblx0XHR9O1xuXG5cdFx0aWYgKCB0eXBlb2YgdHlwZSAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdGdvdG9FbmQgPSBjbGVhclF1ZXVlO1xuXHRcdFx0Y2xlYXJRdWV1ZSA9IHR5cGU7XG5cdFx0XHR0eXBlID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRpZiAoIGNsZWFyUXVldWUgKSB7XG5cdFx0XHR0aGlzLnF1ZXVlKCB0eXBlIHx8IFwiZnhcIiwgW10gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBkZXF1ZXVlID0gdHJ1ZSxcblx0XHRcdFx0aW5kZXggPSB0eXBlICE9IG51bGwgJiYgdHlwZSArIFwicXVldWVIb29rc1wiLFxuXHRcdFx0XHR0aW1lcnMgPSBqUXVlcnkudGltZXJzLFxuXHRcdFx0XHRkYXRhID0gZGF0YVByaXYuZ2V0KCB0aGlzICk7XG5cblx0XHRcdGlmICggaW5kZXggKSB7XG5cdFx0XHRcdGlmICggZGF0YVsgaW5kZXggXSAmJiBkYXRhWyBpbmRleCBdLnN0b3AgKSB7XG5cdFx0XHRcdFx0c3RvcFF1ZXVlKCBkYXRhWyBpbmRleCBdICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZvciAoIGluZGV4IGluIGRhdGEgKSB7XG5cdFx0XHRcdFx0aWYgKCBkYXRhWyBpbmRleCBdICYmIGRhdGFbIGluZGV4IF0uc3RvcCAmJiBycnVuLnRlc3QoIGluZGV4ICkgKSB7XG5cdFx0XHRcdFx0XHRzdG9wUXVldWUoIGRhdGFbIGluZGV4IF0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Zm9yICggaW5kZXggPSB0aW1lcnMubGVuZ3RoOyBpbmRleC0tOyApIHtcblx0XHRcdFx0aWYgKCB0aW1lcnNbIGluZGV4IF0uZWxlbSA9PT0gdGhpcyAmJlxuXHRcdFx0XHRcdCggdHlwZSA9PSBudWxsIHx8IHRpbWVyc1sgaW5kZXggXS5xdWV1ZSA9PT0gdHlwZSApICkge1xuXG5cdFx0XHRcdFx0dGltZXJzWyBpbmRleCBdLmFuaW0uc3RvcCggZ290b0VuZCApO1xuXHRcdFx0XHRcdGRlcXVldWUgPSBmYWxzZTtcblx0XHRcdFx0XHR0aW1lcnMuc3BsaWNlKCBpbmRleCwgMSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIFN0YXJ0IHRoZSBuZXh0IGluIHRoZSBxdWV1ZSBpZiB0aGUgbGFzdCBzdGVwIHdhc24ndCBmb3JjZWQuXG5cdFx0XHQvLyBUaW1lcnMgY3VycmVudGx5IHdpbGwgY2FsbCB0aGVpciBjb21wbGV0ZSBjYWxsYmFja3MsIHdoaWNoXG5cdFx0XHQvLyB3aWxsIGRlcXVldWUgYnV0IG9ubHkgaWYgdGhleSB3ZXJlIGdvdG9FbmQuXG5cdFx0XHRpZiAoIGRlcXVldWUgfHwgIWdvdG9FbmQgKSB7XG5cdFx0XHRcdGpRdWVyeS5kZXF1ZXVlKCB0aGlzLCB0eXBlICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXHRmaW5pc2g6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdGlmICggdHlwZSAhPT0gZmFsc2UgKSB7XG5cdFx0XHR0eXBlID0gdHlwZSB8fCBcImZ4XCI7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4LFxuXHRcdFx0XHRkYXRhID0gZGF0YVByaXYuZ2V0KCB0aGlzICksXG5cdFx0XHRcdHF1ZXVlID0gZGF0YVsgdHlwZSArIFwicXVldWVcIiBdLFxuXHRcdFx0XHRob29rcyA9IGRhdGFbIHR5cGUgKyBcInF1ZXVlSG9va3NcIiBdLFxuXHRcdFx0XHR0aW1lcnMgPSBqUXVlcnkudGltZXJzLFxuXHRcdFx0XHRsZW5ndGggPSBxdWV1ZSA/IHF1ZXVlLmxlbmd0aCA6IDA7XG5cblx0XHRcdC8vIEVuYWJsZSBmaW5pc2hpbmcgZmxhZyBvbiBwcml2YXRlIGRhdGFcblx0XHRcdGRhdGEuZmluaXNoID0gdHJ1ZTtcblxuXHRcdFx0Ly8gRW1wdHkgdGhlIHF1ZXVlIGZpcnN0XG5cdFx0XHRqUXVlcnkucXVldWUoIHRoaXMsIHR5cGUsIFtdICk7XG5cblx0XHRcdGlmICggaG9va3MgJiYgaG9va3Muc3RvcCApIHtcblx0XHRcdFx0aG9va3Muc3RvcC5jYWxsKCB0aGlzLCB0cnVlICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIExvb2sgZm9yIGFueSBhY3RpdmUgYW5pbWF0aW9ucywgYW5kIGZpbmlzaCB0aGVtXG5cdFx0XHRmb3IgKCBpbmRleCA9IHRpbWVycy5sZW5ndGg7IGluZGV4LS07ICkge1xuXHRcdFx0XHRpZiAoIHRpbWVyc1sgaW5kZXggXS5lbGVtID09PSB0aGlzICYmIHRpbWVyc1sgaW5kZXggXS5xdWV1ZSA9PT0gdHlwZSApIHtcblx0XHRcdFx0XHR0aW1lcnNbIGluZGV4IF0uYW5pbS5zdG9wKCB0cnVlICk7XG5cdFx0XHRcdFx0dGltZXJzLnNwbGljZSggaW5kZXgsIDEgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBMb29rIGZvciBhbnkgYW5pbWF0aW9ucyBpbiB0aGUgb2xkIHF1ZXVlIGFuZCBmaW5pc2ggdGhlbVxuXHRcdFx0Zm9yICggaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKyApIHtcblx0XHRcdFx0aWYgKCBxdWV1ZVsgaW5kZXggXSAmJiBxdWV1ZVsgaW5kZXggXS5maW5pc2ggKSB7XG5cdFx0XHRcdFx0cXVldWVbIGluZGV4IF0uZmluaXNoLmNhbGwoIHRoaXMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBUdXJuIG9mZiBmaW5pc2hpbmcgZmxhZ1xuXHRcdFx0ZGVsZXRlIGRhdGEuZmluaXNoO1xuXHRcdH0gKTtcblx0fVxufSApO1xuXG5qUXVlcnkuZWFjaCggWyBcInRvZ2dsZVwiLCBcInNob3dcIiwgXCJoaWRlXCIgXSwgZnVuY3Rpb24oIF9pLCBuYW1lICkge1xuXHR2YXIgY3NzRm4gPSBqUXVlcnkuZm5bIG5hbWUgXTtcblx0alF1ZXJ5LmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggc3BlZWQsIGVhc2luZywgY2FsbGJhY2sgKSB7XG5cdFx0cmV0dXJuIHNwZWVkID09IG51bGwgfHwgdHlwZW9mIHNwZWVkID09PSBcImJvb2xlYW5cIiA/XG5cdFx0XHRjc3NGbi5hcHBseSggdGhpcywgYXJndW1lbnRzICkgOlxuXHRcdFx0dGhpcy5hbmltYXRlKCBnZW5GeCggbmFtZSwgdHJ1ZSApLCBzcGVlZCwgZWFzaW5nLCBjYWxsYmFjayApO1xuXHR9O1xufSApO1xuXG4vLyBHZW5lcmF0ZSBzaG9ydGN1dHMgZm9yIGN1c3RvbSBhbmltYXRpb25zXG5qUXVlcnkuZWFjaCgge1xuXHRzbGlkZURvd246IGdlbkZ4KCBcInNob3dcIiApLFxuXHRzbGlkZVVwOiBnZW5GeCggXCJoaWRlXCIgKSxcblx0c2xpZGVUb2dnbGU6IGdlbkZ4KCBcInRvZ2dsZVwiICksXG5cdGZhZGVJbjogeyBvcGFjaXR5OiBcInNob3dcIiB9LFxuXHRmYWRlT3V0OiB7IG9wYWNpdHk6IFwiaGlkZVwiIH0sXG5cdGZhZGVUb2dnbGU6IHsgb3BhY2l0eTogXCJ0b2dnbGVcIiB9XG59LCBmdW5jdGlvbiggbmFtZSwgcHJvcHMgKSB7XG5cdGpRdWVyeS5mblsgbmFtZSBdID0gZnVuY3Rpb24oIHNwZWVkLCBlYXNpbmcsIGNhbGxiYWNrICkge1xuXHRcdHJldHVybiB0aGlzLmFuaW1hdGUoIHByb3BzLCBzcGVlZCwgZWFzaW5nLCBjYWxsYmFjayApO1xuXHR9O1xufSApO1xuXG5qUXVlcnkudGltZXJzID0gW107XG5qUXVlcnkuZngudGljayA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdGltZXIsXG5cdFx0aSA9IDAsXG5cdFx0dGltZXJzID0galF1ZXJ5LnRpbWVycztcblxuXHRmeE5vdyA9IERhdGUubm93KCk7XG5cblx0Zm9yICggOyBpIDwgdGltZXJzLmxlbmd0aDsgaSsrICkge1xuXHRcdHRpbWVyID0gdGltZXJzWyBpIF07XG5cblx0XHQvLyBSdW4gdGhlIHRpbWVyIGFuZCBzYWZlbHkgcmVtb3ZlIGl0IHdoZW4gZG9uZSAoYWxsb3dpbmcgZm9yIGV4dGVybmFsIHJlbW92YWwpXG5cdFx0aWYgKCAhdGltZXIoKSAmJiB0aW1lcnNbIGkgXSA9PT0gdGltZXIgKSB7XG5cdFx0XHR0aW1lcnMuc3BsaWNlKCBpLS0sIDEgKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoICF0aW1lcnMubGVuZ3RoICkge1xuXHRcdGpRdWVyeS5meC5zdG9wKCk7XG5cdH1cblx0ZnhOb3cgPSB1bmRlZmluZWQ7XG59O1xuXG5qUXVlcnkuZngudGltZXIgPSBmdW5jdGlvbiggdGltZXIgKSB7XG5cdGpRdWVyeS50aW1lcnMucHVzaCggdGltZXIgKTtcblx0alF1ZXJ5LmZ4LnN0YXJ0KCk7XG59O1xuXG5qUXVlcnkuZnguaW50ZXJ2YWwgPSAxMztcbmpRdWVyeS5meC5zdGFydCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIGluUHJvZ3Jlc3MgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aW5Qcm9ncmVzcyA9IHRydWU7XG5cdHNjaGVkdWxlKCk7XG59O1xuXG5qUXVlcnkuZnguc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRpblByb2dyZXNzID0gbnVsbDtcbn07XG5cbmpRdWVyeS5meC5zcGVlZHMgPSB7XG5cdHNsb3c6IDYwMCxcblx0ZmFzdDogMjAwLFxuXG5cdC8vIERlZmF1bHQgc3BlZWRcblx0X2RlZmF1bHQ6IDQwMFxufTtcblxuXG4vLyBCYXNlZCBvZmYgb2YgdGhlIHBsdWdpbiBieSBDbGludCBIZWxmZXJzLCB3aXRoIHBlcm1pc3Npb24uXG5qUXVlcnkuZm4uZGVsYXkgPSBmdW5jdGlvbiggdGltZSwgdHlwZSApIHtcblx0dGltZSA9IGpRdWVyeS5meCA/IGpRdWVyeS5meC5zcGVlZHNbIHRpbWUgXSB8fCB0aW1lIDogdGltZTtcblx0dHlwZSA9IHR5cGUgfHwgXCJmeFwiO1xuXG5cdHJldHVybiB0aGlzLnF1ZXVlKCB0eXBlLCBmdW5jdGlvbiggbmV4dCwgaG9va3MgKSB7XG5cdFx0dmFyIHRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dCggbmV4dCwgdGltZSApO1xuXHRcdGhvb2tzLnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRcdHdpbmRvdy5jbGVhclRpbWVvdXQoIHRpbWVvdXQgKTtcblx0XHR9O1xuXHR9ICk7XG59O1xuXG5cbiggZnVuY3Rpb24oKSB7XG5cdHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiaW5wdXRcIiApLFxuXHRcdHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwic2VsZWN0XCIgKSxcblx0XHRvcHQgPSBzZWxlY3QuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwib3B0aW9uXCIgKSApO1xuXG5cdGlucHV0LnR5cGUgPSBcImNoZWNrYm94XCI7XG5cblx0Ly8gU3VwcG9ydDogQW5kcm9pZCA8PTQuMyBvbmx5XG5cdC8vIERlZmF1bHQgdmFsdWUgZm9yIGEgY2hlY2tib3ggc2hvdWxkIGJlIFwib25cIlxuXHRzdXBwb3J0LmNoZWNrT24gPSBpbnB1dC52YWx1ZSAhPT0gXCJcIjtcblxuXHQvLyBTdXBwb3J0OiBJRSA8PTExIG9ubHlcblx0Ly8gTXVzdCBhY2Nlc3Mgc2VsZWN0ZWRJbmRleCB0byBtYWtlIGRlZmF1bHQgb3B0aW9ucyBzZWxlY3Rcblx0c3VwcG9ydC5vcHRTZWxlY3RlZCA9IG9wdC5zZWxlY3RlZDtcblxuXHQvLyBTdXBwb3J0OiBJRSA8PTExIG9ubHlcblx0Ly8gQW4gaW5wdXQgbG9zZXMgaXRzIHZhbHVlIGFmdGVyIGJlY29taW5nIGEgcmFkaW9cblx0aW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImlucHV0XCIgKTtcblx0aW5wdXQudmFsdWUgPSBcInRcIjtcblx0aW5wdXQudHlwZSA9IFwicmFkaW9cIjtcblx0c3VwcG9ydC5yYWRpb1ZhbHVlID0gaW5wdXQudmFsdWUgPT09IFwidFwiO1xufSApKCk7XG5cblxudmFyIGJvb2xIb29rLFxuXHRhdHRySGFuZGxlID0galF1ZXJ5LmV4cHIuYXR0ckhhbmRsZTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXHRhdHRyOiBmdW5jdGlvbiggbmFtZSwgdmFsdWUgKSB7XG5cdFx0cmV0dXJuIGFjY2VzcyggdGhpcywgalF1ZXJ5LmF0dHIsIG5hbWUsIHZhbHVlLCBhcmd1bWVudHMubGVuZ3RoID4gMSApO1xuXHR9LFxuXG5cdHJlbW92ZUF0dHI6IGZ1bmN0aW9uKCBuYW1lICkge1xuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0alF1ZXJ5LnJlbW92ZUF0dHIoIHRoaXMsIG5hbWUgKTtcblx0XHR9ICk7XG5cdH1cbn0gKTtcblxualF1ZXJ5LmV4dGVuZCgge1xuXHRhdHRyOiBmdW5jdGlvbiggZWxlbSwgbmFtZSwgdmFsdWUgKSB7XG5cdFx0dmFyIHJldCwgaG9va3MsXG5cdFx0XHRuVHlwZSA9IGVsZW0ubm9kZVR5cGU7XG5cblx0XHQvLyBEb24ndCBnZXQvc2V0IGF0dHJpYnV0ZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXG5cdFx0aWYgKCBuVHlwZSA9PT0gMyB8fCBuVHlwZSA9PT0gOCB8fCBuVHlwZSA9PT0gMiApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBGYWxsYmFjayB0byBwcm9wIHdoZW4gYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZFxuXHRcdGlmICggdHlwZW9mIGVsZW0uZ2V0QXR0cmlidXRlID09PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0cmV0dXJuIGpRdWVyeS5wcm9wKCBlbGVtLCBuYW1lLCB2YWx1ZSApO1xuXHRcdH1cblxuXHRcdC8vIEF0dHJpYnV0ZSBob29rcyBhcmUgZGV0ZXJtaW5lZCBieSB0aGUgbG93ZXJjYXNlIHZlcnNpb25cblx0XHQvLyBHcmFiIG5lY2Vzc2FyeSBob29rIGlmIG9uZSBpcyBkZWZpbmVkXG5cdFx0aWYgKCBuVHlwZSAhPT0gMSB8fCAhalF1ZXJ5LmlzWE1MRG9jKCBlbGVtICkgKSB7XG5cdFx0XHRob29rcyA9IGpRdWVyeS5hdHRySG9va3NbIG5hbWUudG9Mb3dlckNhc2UoKSBdIHx8XG5cdFx0XHRcdCggalF1ZXJ5LmV4cHIubWF0Y2guYm9vbC50ZXN0KCBuYW1lICkgPyBib29sSG9vayA6IHVuZGVmaW5lZCApO1xuXHRcdH1cblxuXHRcdGlmICggdmFsdWUgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdGlmICggdmFsdWUgPT09IG51bGwgKSB7XG5cdFx0XHRcdGpRdWVyeS5yZW1vdmVBdHRyKCBlbGVtLCBuYW1lICk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBob29rcyAmJiBcInNldFwiIGluIGhvb2tzICYmXG5cdFx0XHRcdCggcmV0ID0gaG9va3Muc2V0KCBlbGVtLCB2YWx1ZSwgbmFtZSApICkgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblxuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoIG5hbWUsIHZhbHVlICsgXCJcIiApO1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblxuXHRcdGlmICggaG9va3MgJiYgXCJnZXRcIiBpbiBob29rcyAmJiAoIHJldCA9IGhvb2tzLmdldCggZWxlbSwgbmFtZSApICkgIT09IG51bGwgKSB7XG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH1cblxuXHRcdHJldCA9IGpRdWVyeS5maW5kLmF0dHIoIGVsZW0sIG5hbWUgKTtcblxuXHRcdC8vIE5vbi1leGlzdGVudCBhdHRyaWJ1dGVzIHJldHVybiBudWxsLCB3ZSBub3JtYWxpemUgdG8gdW5kZWZpbmVkXG5cdFx0cmV0dXJuIHJldCA9PSBudWxsID8gdW5kZWZpbmVkIDogcmV0O1xuXHR9LFxuXG5cdGF0dHJIb29rczoge1xuXHRcdHR5cGU6IHtcblx0XHRcdHNldDogZnVuY3Rpb24oIGVsZW0sIHZhbHVlICkge1xuXHRcdFx0XHRpZiAoICFzdXBwb3J0LnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09IFwicmFkaW9cIiAmJlxuXHRcdFx0XHRcdG5vZGVOYW1lKCBlbGVtLCBcImlucHV0XCIgKSApIHtcblx0XHRcdFx0XHR2YXIgdmFsID0gZWxlbS52YWx1ZTtcblx0XHRcdFx0XHRlbGVtLnNldEF0dHJpYnV0ZSggXCJ0eXBlXCIsIHZhbHVlICk7XG5cdFx0XHRcdFx0aWYgKCB2YWwgKSB7XG5cdFx0XHRcdFx0XHRlbGVtLnZhbHVlID0gdmFsO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0cmVtb3ZlQXR0cjogZnVuY3Rpb24oIGVsZW0sIHZhbHVlICkge1xuXHRcdHZhciBuYW1lLFxuXHRcdFx0aSA9IDAsXG5cblx0XHRcdC8vIEF0dHJpYnV0ZSBuYW1lcyBjYW4gY29udGFpbiBub24tSFRNTCB3aGl0ZXNwYWNlIGNoYXJhY3RlcnNcblx0XHRcdC8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuXHRcdFx0YXR0ck5hbWVzID0gdmFsdWUgJiYgdmFsdWUubWF0Y2goIHJub3RodG1sd2hpdGUgKTtcblxuXHRcdGlmICggYXR0ck5hbWVzICYmIGVsZW0ubm9kZVR5cGUgPT09IDEgKSB7XG5cdFx0XHR3aGlsZSAoICggbmFtZSA9IGF0dHJOYW1lc1sgaSsrIF0gKSApIHtcblx0XHRcdFx0ZWxlbS5yZW1vdmVBdHRyaWJ1dGUoIG5hbWUgKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0gKTtcblxuLy8gSG9va3MgZm9yIGJvb2xlYW4gYXR0cmlidXRlc1xuYm9vbEhvb2sgPSB7XG5cdHNldDogZnVuY3Rpb24oIGVsZW0sIHZhbHVlLCBuYW1lICkge1xuXHRcdGlmICggdmFsdWUgPT09IGZhbHNlICkge1xuXG5cdFx0XHQvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXG5cdFx0XHRqUXVlcnkucmVtb3ZlQXR0ciggZWxlbSwgbmFtZSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZSggbmFtZSwgbmFtZSApO1xuXHRcdH1cblx0XHRyZXR1cm4gbmFtZTtcblx0fVxufTtcblxualF1ZXJ5LmVhY2goIGpRdWVyeS5leHByLm1hdGNoLmJvb2wuc291cmNlLm1hdGNoKCAvXFx3Ky9nICksIGZ1bmN0aW9uKCBfaSwgbmFtZSApIHtcblx0dmFyIGdldHRlciA9IGF0dHJIYW5kbGVbIG5hbWUgXSB8fCBqUXVlcnkuZmluZC5hdHRyO1xuXG5cdGF0dHJIYW5kbGVbIG5hbWUgXSA9IGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCBpc1hNTCApIHtcblx0XHR2YXIgcmV0LCBoYW5kbGUsXG5cdFx0XHRsb3dlcmNhc2VOYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0aWYgKCAhaXNYTUwgKSB7XG5cblx0XHRcdC8vIEF2b2lkIGFuIGluZmluaXRlIGxvb3AgYnkgdGVtcG9yYXJpbHkgcmVtb3ZpbmcgdGhpcyBmdW5jdGlvbiBmcm9tIHRoZSBnZXR0ZXJcblx0XHRcdGhhbmRsZSA9IGF0dHJIYW5kbGVbIGxvd2VyY2FzZU5hbWUgXTtcblx0XHRcdGF0dHJIYW5kbGVbIGxvd2VyY2FzZU5hbWUgXSA9IHJldDtcblx0XHRcdHJldCA9IGdldHRlciggZWxlbSwgbmFtZSwgaXNYTUwgKSAhPSBudWxsID9cblx0XHRcdFx0bG93ZXJjYXNlTmFtZSA6XG5cdFx0XHRcdG51bGw7XG5cdFx0XHRhdHRySGFuZGxlWyBsb3dlcmNhc2VOYW1lIF0gPSBoYW5kbGU7XG5cdFx0fVxuXHRcdHJldHVybiByZXQ7XG5cdH07XG59ICk7XG5cblxuXG5cbnZhciByZm9jdXNhYmxlID0gL14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8YnV0dG9uKSQvaSxcblx0cmNsaWNrYWJsZSA9IC9eKD86YXxhcmVhKSQvaTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXHRwcm9wOiBmdW5jdGlvbiggbmFtZSwgdmFsdWUgKSB7XG5cdFx0cmV0dXJuIGFjY2VzcyggdGhpcywgalF1ZXJ5LnByb3AsIG5hbWUsIHZhbHVlLCBhcmd1bWVudHMubGVuZ3RoID4gMSApO1xuXHR9LFxuXG5cdHJlbW92ZVByb3A6IGZ1bmN0aW9uKCBuYW1lICkge1xuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZGVsZXRlIHRoaXNbIGpRdWVyeS5wcm9wRml4WyBuYW1lIF0gfHwgbmFtZSBdO1xuXHRcdH0gKTtcblx0fVxufSApO1xuXG5qUXVlcnkuZXh0ZW5kKCB7XG5cdHByb3A6IGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCB2YWx1ZSApIHtcblx0XHR2YXIgcmV0LCBob29rcyxcblx0XHRcdG5UeXBlID0gZWxlbS5ub2RlVHlwZTtcblxuXHRcdC8vIERvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcblx0XHRpZiAoIG5UeXBlID09PSAzIHx8IG5UeXBlID09PSA4IHx8IG5UeXBlID09PSAyICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggblR5cGUgIT09IDEgfHwgIWpRdWVyeS5pc1hNTERvYyggZWxlbSApICkge1xuXG5cdFx0XHQvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXG5cdFx0XHRuYW1lID0galF1ZXJ5LnByb3BGaXhbIG5hbWUgXSB8fCBuYW1lO1xuXHRcdFx0aG9va3MgPSBqUXVlcnkucHJvcEhvb2tzWyBuYW1lIF07XG5cdFx0fVxuXG5cdFx0aWYgKCB2YWx1ZSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0aWYgKCBob29rcyAmJiBcInNldFwiIGluIGhvb2tzICYmXG5cdFx0XHRcdCggcmV0ID0gaG9va3Muc2V0KCBlbGVtLCB2YWx1ZSwgbmFtZSApICkgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICggZWxlbVsgbmFtZSBdID0gdmFsdWUgKTtcblx0XHR9XG5cblx0XHRpZiAoIGhvb2tzICYmIFwiZ2V0XCIgaW4gaG9va3MgJiYgKCByZXQgPSBob29rcy5nZXQoIGVsZW0sIG5hbWUgKSApICE9PSBudWxsICkge1xuXHRcdFx0cmV0dXJuIHJldDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZWxlbVsgbmFtZSBdO1xuXHR9LFxuXG5cdHByb3BIb29rczoge1xuXHRcdHRhYkluZGV4OiB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDw9OSAtIDExIG9ubHlcblx0XHRcdFx0Ly8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlXG5cdFx0XHRcdC8vIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxuXHRcdFx0XHQvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwgKHRyYWMtMTIwNzIpXG5cdFx0XHRcdHZhciB0YWJpbmRleCA9IGpRdWVyeS5maW5kLmF0dHIoIGVsZW0sIFwidGFiaW5kZXhcIiApO1xuXG5cdFx0XHRcdGlmICggdGFiaW5kZXggKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHBhcnNlSW50KCB0YWJpbmRleCwgMTAgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRyZm9jdXNhYmxlLnRlc3QoIGVsZW0ubm9kZU5hbWUgKSB8fFxuXHRcdFx0XHRcdHJjbGlja2FibGUudGVzdCggZWxlbS5ub2RlTmFtZSApICYmXG5cdFx0XHRcdFx0ZWxlbS5ocmVmXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRwcm9wRml4OiB7XG5cdFx0XCJmb3JcIjogXCJodG1sRm9yXCIsXG5cdFx0XCJjbGFzc1wiOiBcImNsYXNzTmFtZVwiXG5cdH1cbn0gKTtcblxuLy8gU3VwcG9ydDogSUUgPD0xMSBvbmx5XG4vLyBBY2Nlc3NpbmcgdGhlIHNlbGVjdGVkSW5kZXggcHJvcGVydHlcbi8vIGZvcmNlcyB0aGUgYnJvd3NlciB0byByZXNwZWN0IHNldHRpbmcgc2VsZWN0ZWRcbi8vIG9uIHRoZSBvcHRpb25cbi8vIFRoZSBnZXR0ZXIgZW5zdXJlcyBhIGRlZmF1bHQgb3B0aW9uIGlzIHNlbGVjdGVkXG4vLyB3aGVuIGluIGFuIG9wdGdyb3VwXG4vLyBlc2xpbnQgcnVsZSBcIm5vLXVudXNlZC1leHByZXNzaW9uc1wiIGlzIGRpc2FibGVkIGZvciB0aGlzIGNvZGVcbi8vIHNpbmNlIGl0IGNvbnNpZGVycyBzdWNoIGFjY2Vzc2lvbnMgbm9vcFxuaWYgKCAhc3VwcG9ydC5vcHRTZWxlY3RlZCApIHtcblx0alF1ZXJ5LnByb3BIb29rcy5zZWxlY3RlZCA9IHtcblx0XHRnZXQ6IGZ1bmN0aW9uKCBlbGVtICkge1xuXG5cdFx0XHQvKiBlc2xpbnQgbm8tdW51c2VkLWV4cHJlc3Npb25zOiBcIm9mZlwiICovXG5cblx0XHRcdHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XG5cdFx0XHRpZiAoIHBhcmVudCAmJiBwYXJlbnQucGFyZW50Tm9kZSApIHtcblx0XHRcdFx0cGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0sXG5cdFx0c2V0OiBmdW5jdGlvbiggZWxlbSApIHtcblxuXHRcdFx0LyogZXNsaW50IG5vLXVudXNlZC1leHByZXNzaW9uczogXCJvZmZcIiAqL1xuXG5cdFx0XHR2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xuXHRcdFx0aWYgKCBwYXJlbnQgKSB7XG5cdFx0XHRcdHBhcmVudC5zZWxlY3RlZEluZGV4O1xuXG5cdFx0XHRcdGlmICggcGFyZW50LnBhcmVudE5vZGUgKSB7XG5cdFx0XHRcdFx0cGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn1cblxualF1ZXJ5LmVhY2goIFtcblx0XCJ0YWJJbmRleFwiLFxuXHRcInJlYWRPbmx5XCIsXG5cdFwibWF4TGVuZ3RoXCIsXG5cdFwiY2VsbFNwYWNpbmdcIixcblx0XCJjZWxsUGFkZGluZ1wiLFxuXHRcInJvd1NwYW5cIixcblx0XCJjb2xTcGFuXCIsXG5cdFwidXNlTWFwXCIsXG5cdFwiZnJhbWVCb3JkZXJcIixcblx0XCJjb250ZW50RWRpdGFibGVcIlxuXSwgZnVuY3Rpb24oKSB7XG5cdGpRdWVyeS5wcm9wRml4WyB0aGlzLnRvTG93ZXJDYXNlKCkgXSA9IHRoaXM7XG59ICk7XG5cblxuXG5cblx0Ly8gU3RyaXAgYW5kIGNvbGxhcHNlIHdoaXRlc3BhY2UgYWNjb3JkaW5nIHRvIEhUTUwgc3BlY1xuXHQvLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jc3RyaXAtYW5kLWNvbGxhcHNlLWFzY2lpLXdoaXRlc3BhY2Vcblx0ZnVuY3Rpb24gc3RyaXBBbmRDb2xsYXBzZSggdmFsdWUgKSB7XG5cdFx0dmFyIHRva2VucyA9IHZhbHVlLm1hdGNoKCBybm90aHRtbHdoaXRlICkgfHwgW107XG5cdFx0cmV0dXJuIHRva2Vucy5qb2luKCBcIiBcIiApO1xuXHR9XG5cblxuZnVuY3Rpb24gZ2V0Q2xhc3MoIGVsZW0gKSB7XG5cdHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSAmJiBlbGVtLmdldEF0dHJpYnV0ZSggXCJjbGFzc1wiICkgfHwgXCJcIjtcbn1cblxuZnVuY3Rpb24gY2xhc3Nlc1RvQXJyYXkoIHZhbHVlICkge1xuXHRpZiAoIEFycmF5LmlzQXJyYXkoIHZhbHVlICkgKSB7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cdGlmICggdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICkge1xuXHRcdHJldHVybiB2YWx1ZS5tYXRjaCggcm5vdGh0bWx3aGl0ZSApIHx8IFtdO1xuXHR9XG5cdHJldHVybiBbXTtcbn1cblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXHRhZGRDbGFzczogZnVuY3Rpb24oIHZhbHVlICkge1xuXHRcdHZhciBjbGFzc05hbWVzLCBjdXIsIGN1clZhbHVlLCBjbGFzc05hbWUsIGksIGZpbmFsVmFsdWU7XG5cblx0XHRpZiAoIGlzRnVuY3Rpb24oIHZhbHVlICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbiggaiApIHtcblx0XHRcdFx0alF1ZXJ5KCB0aGlzICkuYWRkQ2xhc3MoIHZhbHVlLmNhbGwoIHRoaXMsIGosIGdldENsYXNzKCB0aGlzICkgKSApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdGNsYXNzTmFtZXMgPSBjbGFzc2VzVG9BcnJheSggdmFsdWUgKTtcblxuXHRcdGlmICggY2xhc3NOYW1lcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3VyVmFsdWUgPSBnZXRDbGFzcyggdGhpcyApO1xuXHRcdFx0XHRjdXIgPSB0aGlzLm5vZGVUeXBlID09PSAxICYmICggXCIgXCIgKyBzdHJpcEFuZENvbGxhcHNlKCBjdXJWYWx1ZSApICsgXCIgXCIgKTtcblxuXHRcdFx0XHRpZiAoIGN1ciApIHtcblx0XHRcdFx0XHRmb3IgKCBpID0gMDsgaSA8IGNsYXNzTmFtZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRjbGFzc05hbWUgPSBjbGFzc05hbWVzWyBpIF07XG5cdFx0XHRcdFx0XHRpZiAoIGN1ci5pbmRleE9mKCBcIiBcIiArIGNsYXNzTmFtZSArIFwiIFwiICkgPCAwICkge1xuXHRcdFx0XHRcdFx0XHRjdXIgKz0gY2xhc3NOYW1lICsgXCIgXCI7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gT25seSBhc3NpZ24gaWYgZGlmZmVyZW50IHRvIGF2b2lkIHVubmVlZGVkIHJlbmRlcmluZy5cblx0XHRcdFx0XHRmaW5hbFZhbHVlID0gc3RyaXBBbmRDb2xsYXBzZSggY3VyICk7XG5cdFx0XHRcdFx0aWYgKCBjdXJWYWx1ZSAhPT0gZmluYWxWYWx1ZSApIHtcblx0XHRcdFx0XHRcdHRoaXMuc2V0QXR0cmlidXRlKCBcImNsYXNzXCIsIGZpbmFsVmFsdWUgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZW1vdmVDbGFzczogZnVuY3Rpb24oIHZhbHVlICkge1xuXHRcdHZhciBjbGFzc05hbWVzLCBjdXIsIGN1clZhbHVlLCBjbGFzc05hbWUsIGksIGZpbmFsVmFsdWU7XG5cblx0XHRpZiAoIGlzRnVuY3Rpb24oIHZhbHVlICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbiggaiApIHtcblx0XHRcdFx0alF1ZXJ5KCB0aGlzICkucmVtb3ZlQ2xhc3MoIHZhbHVlLmNhbGwoIHRoaXMsIGosIGdldENsYXNzKCB0aGlzICkgKSApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdGlmICggIWFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5hdHRyKCBcImNsYXNzXCIsIFwiXCIgKTtcblx0XHR9XG5cblx0XHRjbGFzc05hbWVzID0gY2xhc3Nlc1RvQXJyYXkoIHZhbHVlICk7XG5cblx0XHRpZiAoIGNsYXNzTmFtZXMubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGN1clZhbHVlID0gZ2V0Q2xhc3MoIHRoaXMgKTtcblxuXHRcdFx0XHQvLyBUaGlzIGV4cHJlc3Npb24gaXMgaGVyZSBmb3IgYmV0dGVyIGNvbXByZXNzaWJpbGl0eSAoc2VlIGFkZENsYXNzKVxuXHRcdFx0XHRjdXIgPSB0aGlzLm5vZGVUeXBlID09PSAxICYmICggXCIgXCIgKyBzdHJpcEFuZENvbGxhcHNlKCBjdXJWYWx1ZSApICsgXCIgXCIgKTtcblxuXHRcdFx0XHRpZiAoIGN1ciApIHtcblx0XHRcdFx0XHRmb3IgKCBpID0gMDsgaSA8IGNsYXNzTmFtZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRjbGFzc05hbWUgPSBjbGFzc05hbWVzWyBpIF07XG5cblx0XHRcdFx0XHRcdC8vIFJlbW92ZSAqYWxsKiBpbnN0YW5jZXNcblx0XHRcdFx0XHRcdHdoaWxlICggY3VyLmluZGV4T2YoIFwiIFwiICsgY2xhc3NOYW1lICsgXCIgXCIgKSA+IC0xICkge1xuXHRcdFx0XHRcdFx0XHRjdXIgPSBjdXIucmVwbGFjZSggXCIgXCIgKyBjbGFzc05hbWUgKyBcIiBcIiwgXCIgXCIgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBPbmx5IGFzc2lnbiBpZiBkaWZmZXJlbnQgdG8gYXZvaWQgdW5uZWVkZWQgcmVuZGVyaW5nLlxuXHRcdFx0XHRcdGZpbmFsVmFsdWUgPSBzdHJpcEFuZENvbGxhcHNlKCBjdXIgKTtcblx0XHRcdFx0XHRpZiAoIGN1clZhbHVlICE9PSBmaW5hbFZhbHVlICkge1xuXHRcdFx0XHRcdFx0dGhpcy5zZXRBdHRyaWJ1dGUoIFwiY2xhc3NcIiwgZmluYWxWYWx1ZSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHRvZ2dsZUNsYXNzOiBmdW5jdGlvbiggdmFsdWUsIHN0YXRlVmFsICkge1xuXHRcdHZhciBjbGFzc05hbWVzLCBjbGFzc05hbWUsIGksIHNlbGYsXG5cdFx0XHR0eXBlID0gdHlwZW9mIHZhbHVlLFxuXHRcdFx0aXNWYWxpZFZhbHVlID0gdHlwZSA9PT0gXCJzdHJpbmdcIiB8fCBBcnJheS5pc0FycmF5KCB2YWx1ZSApO1xuXG5cdFx0aWYgKCBpc0Z1bmN0aW9uKCB2YWx1ZSApICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oIGkgKSB7XG5cdFx0XHRcdGpRdWVyeSggdGhpcyApLnRvZ2dsZUNsYXNzKFxuXHRcdFx0XHRcdHZhbHVlLmNhbGwoIHRoaXMsIGksIGdldENsYXNzKCB0aGlzICksIHN0YXRlVmFsICksXG5cdFx0XHRcdFx0c3RhdGVWYWxcblx0XHRcdFx0KTtcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRpZiAoIHR5cGVvZiBzdGF0ZVZhbCA9PT0gXCJib29sZWFuXCIgJiYgaXNWYWxpZFZhbHVlICkge1xuXHRcdFx0cmV0dXJuIHN0YXRlVmFsID8gdGhpcy5hZGRDbGFzcyggdmFsdWUgKSA6IHRoaXMucmVtb3ZlQ2xhc3MoIHZhbHVlICk7XG5cdFx0fVxuXG5cdFx0Y2xhc3NOYW1lcyA9IGNsYXNzZXNUb0FycmF5KCB2YWx1ZSApO1xuXG5cdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIGlzVmFsaWRWYWx1ZSApIHtcblxuXHRcdFx0XHQvLyBUb2dnbGUgaW5kaXZpZHVhbCBjbGFzcyBuYW1lc1xuXHRcdFx0XHRzZWxmID0galF1ZXJ5KCB0aGlzICk7XG5cblx0XHRcdFx0Zm9yICggaSA9IDA7IGkgPCBjbGFzc05hbWVzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRcdGNsYXNzTmFtZSA9IGNsYXNzTmFtZXNbIGkgXTtcblxuXHRcdFx0XHRcdC8vIENoZWNrIGVhY2ggY2xhc3NOYW1lIGdpdmVuLCBzcGFjZSBzZXBhcmF0ZWQgbGlzdFxuXHRcdFx0XHRcdGlmICggc2VsZi5oYXNDbGFzcyggY2xhc3NOYW1lICkgKSB7XG5cdFx0XHRcdFx0XHRzZWxmLnJlbW92ZUNsYXNzKCBjbGFzc05hbWUgKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0c2VsZi5hZGRDbGFzcyggY2xhc3NOYW1lICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdC8vIFRvZ2dsZSB3aG9sZSBjbGFzcyBuYW1lXG5cdFx0XHR9IGVsc2UgaWYgKCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGUgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdFx0XHRjbGFzc05hbWUgPSBnZXRDbGFzcyggdGhpcyApO1xuXHRcdFx0XHRpZiAoIGNsYXNzTmFtZSApIHtcblxuXHRcdFx0XHRcdC8vIFN0b3JlIGNsYXNzTmFtZSBpZiBzZXRcblx0XHRcdFx0XHRkYXRhUHJpdi5zZXQoIHRoaXMsIFwiX19jbGFzc05hbWVfX1wiLCBjbGFzc05hbWUgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGhhcyBhIGNsYXNzIG5hbWUgb3IgaWYgd2UncmUgcGFzc2VkIGBmYWxzZWAsXG5cdFx0XHRcdC8vIHRoZW4gcmVtb3ZlIHRoZSB3aG9sZSBjbGFzc25hbWUgKGlmIHRoZXJlIHdhcyBvbmUsIHRoZSBhYm92ZSBzYXZlZCBpdCkuXG5cdFx0XHRcdC8vIE90aGVyd2lzZSBicmluZyBiYWNrIHdoYXRldmVyIHdhcyBwcmV2aW91c2x5IHNhdmVkIChpZiBhbnl0aGluZyksXG5cdFx0XHRcdC8vIGZhbGxpbmcgYmFjayB0byB0aGUgZW1wdHkgc3RyaW5nIGlmIG5vdGhpbmcgd2FzIHN0b3JlZC5cblx0XHRcdFx0aWYgKCB0aGlzLnNldEF0dHJpYnV0ZSApIHtcblx0XHRcdFx0XHR0aGlzLnNldEF0dHJpYnV0ZSggXCJjbGFzc1wiLFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lIHx8IHZhbHVlID09PSBmYWxzZSA/XG5cdFx0XHRcdFx0XHRcdFwiXCIgOlxuXHRcdFx0XHRcdFx0XHRkYXRhUHJpdi5nZXQoIHRoaXMsIFwiX19jbGFzc05hbWVfX1wiICkgfHwgXCJcIlxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblx0aGFzQ2xhc3M6IGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHR2YXIgY2xhc3NOYW1lLCBlbGVtLFxuXHRcdFx0aSA9IDA7XG5cblx0XHRjbGFzc05hbWUgPSBcIiBcIiArIHNlbGVjdG9yICsgXCIgXCI7XG5cdFx0d2hpbGUgKCAoIGVsZW0gPSB0aGlzWyBpKysgXSApICkge1xuXHRcdFx0aWYgKCBlbGVtLm5vZGVUeXBlID09PSAxICYmXG5cdFx0XHRcdCggXCIgXCIgKyBzdHJpcEFuZENvbGxhcHNlKCBnZXRDbGFzcyggZWxlbSApICkgKyBcIiBcIiApLmluZGV4T2YoIGNsYXNzTmFtZSApID4gLTEgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufSApO1xuXG5cblxuXG52YXIgcnJldHVybiA9IC9cXHIvZztcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXHR2YWw6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR2YXIgaG9va3MsIHJldCwgdmFsdWVJc0Z1bmN0aW9uLFxuXHRcdFx0ZWxlbSA9IHRoaXNbIDAgXTtcblxuXHRcdGlmICggIWFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIGVsZW0gKSB7XG5cdFx0XHRcdGhvb2tzID0galF1ZXJ5LnZhbEhvb2tzWyBlbGVtLnR5cGUgXSB8fFxuXHRcdFx0XHRcdGpRdWVyeS52YWxIb29rc1sgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpIF07XG5cblx0XHRcdFx0aWYgKCBob29rcyAmJlxuXHRcdFx0XHRcdFwiZ2V0XCIgaW4gaG9va3MgJiZcblx0XHRcdFx0XHQoIHJldCA9IGhvb2tzLmdldCggZWxlbSwgXCJ2YWx1ZVwiICkgKSAhPT0gdW5kZWZpbmVkXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXQgPSBlbGVtLnZhbHVlO1xuXG5cdFx0XHRcdC8vIEhhbmRsZSBtb3N0IGNvbW1vbiBzdHJpbmcgY2FzZXNcblx0XHRcdFx0aWYgKCB0eXBlb2YgcmV0ID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHRcdHJldHVybiByZXQucmVwbGFjZSggcnJldHVybiwgXCJcIiApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSGFuZGxlIGNhc2VzIHdoZXJlIHZhbHVlIGlzIG51bGwvdW5kZWYgb3IgbnVtYmVyXG5cdFx0XHRcdHJldHVybiByZXQgPT0gbnVsbCA/IFwiXCIgOiByZXQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YWx1ZUlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uKCB2YWx1ZSApO1xuXG5cdFx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oIGkgKSB7XG5cdFx0XHR2YXIgdmFsO1xuXG5cdFx0XHRpZiAoIHRoaXMubm9kZVR5cGUgIT09IDEgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB2YWx1ZUlzRnVuY3Rpb24gKSB7XG5cdFx0XHRcdHZhbCA9IHZhbHVlLmNhbGwoIHRoaXMsIGksIGpRdWVyeSggdGhpcyApLnZhbCgpICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YWwgPSB2YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVHJlYXQgbnVsbC91bmRlZmluZWQgYXMgXCJcIjsgY29udmVydCBudW1iZXJzIHRvIHN0cmluZ1xuXHRcdFx0aWYgKCB2YWwgPT0gbnVsbCApIHtcblx0XHRcdFx0dmFsID0gXCJcIjtcblxuXHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHZhbCA9PT0gXCJudW1iZXJcIiApIHtcblx0XHRcdFx0dmFsICs9IFwiXCI7XG5cblx0XHRcdH0gZWxzZSBpZiAoIEFycmF5LmlzQXJyYXkoIHZhbCApICkge1xuXHRcdFx0XHR2YWwgPSBqUXVlcnkubWFwKCB2YWwsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsdWUgPT0gbnVsbCA/IFwiXCIgOiB2YWx1ZSArIFwiXCI7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblxuXHRcdFx0aG9va3MgPSBqUXVlcnkudmFsSG9va3NbIHRoaXMudHlwZSBdIHx8IGpRdWVyeS52YWxIb29rc1sgdGhpcy5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpIF07XG5cblx0XHRcdC8vIElmIHNldCByZXR1cm5zIHVuZGVmaW5lZCwgZmFsbCBiYWNrIHRvIG5vcm1hbCBzZXR0aW5nXG5cdFx0XHRpZiAoICFob29rcyB8fCAhKCBcInNldFwiIGluIGhvb2tzICkgfHwgaG9va3Muc2V0KCB0aGlzLCB2YWwsIFwidmFsdWVcIiApID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdHRoaXMudmFsdWUgPSB2YWw7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9XG59ICk7XG5cbmpRdWVyeS5leHRlbmQoIHtcblx0dmFsSG9va3M6IHtcblx0XHRvcHRpb246IHtcblx0XHRcdGdldDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cblx0XHRcdFx0dmFyIHZhbCA9IGpRdWVyeS5maW5kLmF0dHIoIGVsZW0sIFwidmFsdWVcIiApO1xuXHRcdFx0XHRyZXR1cm4gdmFsICE9IG51bGwgP1xuXHRcdFx0XHRcdHZhbCA6XG5cblx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8PTEwIC0gMTEgb25seVxuXHRcdFx0XHRcdC8vIG9wdGlvbi50ZXh0IHRocm93cyBleGNlcHRpb25zICh0cmFjLTE0Njg2LCB0cmFjLTE0ODU4KVxuXHRcdFx0XHRcdC8vIFN0cmlwIGFuZCBjb2xsYXBzZSB3aGl0ZXNwYWNlXG5cdFx0XHRcdFx0Ly8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy8jc3RyaXAtYW5kLWNvbGxhcHNlLXdoaXRlc3BhY2Vcblx0XHRcdFx0XHRzdHJpcEFuZENvbGxhcHNlKCBqUXVlcnkudGV4dCggZWxlbSApICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzZWxlY3Q6IHtcblx0XHRcdGdldDogZnVuY3Rpb24oIGVsZW0gKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSwgb3B0aW9uLCBpLFxuXHRcdFx0XHRcdG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXG5cdFx0XHRcdFx0aW5kZXggPSBlbGVtLnNlbGVjdGVkSW5kZXgsXG5cdFx0XHRcdFx0b25lID0gZWxlbS50eXBlID09PSBcInNlbGVjdC1vbmVcIixcblx0XHRcdFx0XHR2YWx1ZXMgPSBvbmUgPyBudWxsIDogW10sXG5cdFx0XHRcdFx0bWF4ID0gb25lID8gaW5kZXggKyAxIDogb3B0aW9ucy5sZW5ndGg7XG5cblx0XHRcdFx0aWYgKCBpbmRleCA8IDAgKSB7XG5cdFx0XHRcdFx0aSA9IG1heDtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGkgPSBvbmUgPyBpbmRleCA6IDA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBzZWxlY3RlZCBvcHRpb25zXG5cdFx0XHRcdGZvciAoIDsgaSA8IG1heDsgaSsrICkge1xuXHRcdFx0XHRcdG9wdGlvbiA9IG9wdGlvbnNbIGkgXTtcblxuXHRcdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDw9OSBvbmx5XG5cdFx0XHRcdFx0Ly8gSUU4LTkgZG9lc24ndCB1cGRhdGUgc2VsZWN0ZWQgYWZ0ZXIgZm9ybSByZXNldCAodHJhYy0yNTUxKVxuXHRcdFx0XHRcdGlmICggKCBvcHRpb24uc2VsZWN0ZWQgfHwgaSA9PT0gaW5kZXggKSAmJlxuXG5cdFx0XHRcdFx0XHRcdC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcblx0XHRcdFx0XHRcdFx0IW9wdGlvbi5kaXNhYmxlZCAmJlxuXHRcdFx0XHRcdFx0XHQoICFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fFxuXHRcdFx0XHRcdFx0XHRcdCFub2RlTmFtZSggb3B0aW9uLnBhcmVudE5vZGUsIFwib3B0Z3JvdXBcIiApICkgKSB7XG5cblx0XHRcdFx0XHRcdC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cblx0XHRcdFx0XHRcdHZhbHVlID0galF1ZXJ5KCBvcHRpb24gKS52YWwoKTtcblxuXHRcdFx0XHRcdFx0Ly8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcblx0XHRcdFx0XHRcdGlmICggb25lICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XG5cdFx0XHRcdFx0XHR2YWx1ZXMucHVzaCggdmFsdWUgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdFx0fSxcblxuXHRcdFx0c2V0OiBmdW5jdGlvbiggZWxlbSwgdmFsdWUgKSB7XG5cdFx0XHRcdHZhciBvcHRpb25TZXQsIG9wdGlvbixcblx0XHRcdFx0XHRvcHRpb25zID0gZWxlbS5vcHRpb25zLFxuXHRcdFx0XHRcdHZhbHVlcyA9IGpRdWVyeS5tYWtlQXJyYXkoIHZhbHVlICksXG5cdFx0XHRcdFx0aSA9IG9wdGlvbnMubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0XHRcdG9wdGlvbiA9IG9wdGlvbnNbIGkgXTtcblxuXHRcdFx0XHRcdC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbmQtYXNzaWduICovXG5cblx0XHRcdFx0XHRpZiAoIG9wdGlvbi5zZWxlY3RlZCA9XG5cdFx0XHRcdFx0XHRqUXVlcnkuaW5BcnJheSggalF1ZXJ5LnZhbEhvb2tzLm9wdGlvbi5nZXQoIG9wdGlvbiApLCB2YWx1ZXMgKSA+IC0xXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRvcHRpb25TZXQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tY29uZC1hc3NpZ24gKi9cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XG5cdFx0XHRcdGlmICggIW9wdGlvblNldCApIHtcblx0XHRcdFx0XHRlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSApO1xuXG4vLyBSYWRpb3MgYW5kIGNoZWNrYm94ZXMgZ2V0dGVyL3NldHRlclxualF1ZXJ5LmVhY2goIFsgXCJyYWRpb1wiLCBcImNoZWNrYm94XCIgXSwgZnVuY3Rpb24oKSB7XG5cdGpRdWVyeS52YWxIb29rc1sgdGhpcyBdID0ge1xuXHRcdHNldDogZnVuY3Rpb24oIGVsZW0sIHZhbHVlICkge1xuXHRcdFx0aWYgKCBBcnJheS5pc0FycmF5KCB2YWx1ZSApICkge1xuXHRcdFx0XHRyZXR1cm4gKCBlbGVtLmNoZWNrZWQgPSBqUXVlcnkuaW5BcnJheSggalF1ZXJ5KCBlbGVtICkudmFsKCksIHZhbHVlICkgPiAtMSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0aWYgKCAhc3VwcG9ydC5jaGVja09uICkge1xuXHRcdGpRdWVyeS52YWxIb29rc1sgdGhpcyBdLmdldCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRcdFx0cmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCBcInZhbHVlXCIgKSA9PT0gbnVsbCA/IFwib25cIiA6IGVsZW0udmFsdWU7XG5cdFx0fTtcblx0fVxufSApO1xuXG5cblxuXG4vLyBSZXR1cm4galF1ZXJ5IGZvciBhdHRyaWJ1dGVzLW9ubHkgaW5jbHVzaW9uXG52YXIgbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG5cbnZhciBub25jZSA9IHsgZ3VpZDogRGF0ZS5ub3coKSB9O1xuXG52YXIgcnF1ZXJ5ID0gKCAvXFw/LyApO1xuXG5cblxuLy8gQ3Jvc3MtYnJvd3NlciB4bWwgcGFyc2luZ1xualF1ZXJ5LnBhcnNlWE1MID0gZnVuY3Rpb24oIGRhdGEgKSB7XG5cdHZhciB4bWwsIHBhcnNlckVycm9yRWxlbTtcblx0aWYgKCAhZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8vIFN1cHBvcnQ6IElFIDkgLSAxMSBvbmx5XG5cdC8vIElFIHRocm93cyBvbiBwYXJzZUZyb21TdHJpbmcgd2l0aCBpbnZhbGlkIGlucHV0LlxuXHR0cnkge1xuXHRcdHhtbCA9ICggbmV3IHdpbmRvdy5ET01QYXJzZXIoKSApLnBhcnNlRnJvbVN0cmluZyggZGF0YSwgXCJ0ZXh0L3htbFwiICk7XG5cdH0gY2F0Y2ggKCBlICkge31cblxuXHRwYXJzZXJFcnJvckVsZW0gPSB4bWwgJiYgeG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKCBcInBhcnNlcmVycm9yXCIgKVsgMCBdO1xuXHRpZiAoICF4bWwgfHwgcGFyc2VyRXJyb3JFbGVtICkge1xuXHRcdGpRdWVyeS5lcnJvciggXCJJbnZhbGlkIFhNTDogXCIgKyAoXG5cdFx0XHRwYXJzZXJFcnJvckVsZW0gP1xuXHRcdFx0XHRqUXVlcnkubWFwKCBwYXJzZXJFcnJvckVsZW0uY2hpbGROb2RlcywgZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRcdHJldHVybiBlbC50ZXh0Q29udGVudDtcblx0XHRcdFx0fSApLmpvaW4oIFwiXFxuXCIgKSA6XG5cdFx0XHRcdGRhdGFcblx0XHQpICk7XG5cdH1cblx0cmV0dXJuIHhtbDtcbn07XG5cblxudmFyIHJmb2N1c01vcnBoID0gL14oPzpmb2N1c2luZm9jdXN8Zm9jdXNvdXRibHVyKSQvLFxuXHRzdG9wUHJvcGFnYXRpb25DYWxsYmFjayA9IGZ1bmN0aW9uKCBlICkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH07XG5cbmpRdWVyeS5leHRlbmQoIGpRdWVyeS5ldmVudCwge1xuXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCBldmVudCwgZGF0YSwgZWxlbSwgb25seUhhbmRsZXJzICkge1xuXG5cdFx0dmFyIGksIGN1ciwgdG1wLCBidWJibGVUeXBlLCBvbnR5cGUsIGhhbmRsZSwgc3BlY2lhbCwgbGFzdEVsZW1lbnQsXG5cdFx0XHRldmVudFBhdGggPSBbIGVsZW0gfHwgZG9jdW1lbnQgXSxcblx0XHRcdHR5cGUgPSBoYXNPd24uY2FsbCggZXZlbnQsIFwidHlwZVwiICkgPyBldmVudC50eXBlIDogZXZlbnQsXG5cdFx0XHRuYW1lc3BhY2VzID0gaGFzT3duLmNhbGwoIGV2ZW50LCBcIm5hbWVzcGFjZVwiICkgPyBldmVudC5uYW1lc3BhY2Uuc3BsaXQoIFwiLlwiICkgOiBbXTtcblxuXHRcdGN1ciA9IGxhc3RFbGVtZW50ID0gdG1wID0gZWxlbSA9IGVsZW0gfHwgZG9jdW1lbnQ7XG5cblx0XHQvLyBEb24ndCBkbyBldmVudHMgb24gdGV4dCBhbmQgY29tbWVudCBub2Rlc1xuXHRcdGlmICggZWxlbS5ub2RlVHlwZSA9PT0gMyB8fCBlbGVtLm5vZGVUeXBlID09PSA4ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIGZvY3VzL2JsdXIgbW9ycGhzIHRvIGZvY3VzaW4vb3V0OyBlbnN1cmUgd2UncmUgbm90IGZpcmluZyB0aGVtIHJpZ2h0IG5vd1xuXHRcdGlmICggcmZvY3VzTW9ycGgudGVzdCggdHlwZSArIGpRdWVyeS5ldmVudC50cmlnZ2VyZWQgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIHR5cGUuaW5kZXhPZiggXCIuXCIgKSA+IC0xICkge1xuXG5cdFx0XHQvLyBOYW1lc3BhY2VkIHRyaWdnZXI7IGNyZWF0ZSBhIHJlZ2V4cCB0byBtYXRjaCBldmVudCB0eXBlIGluIGhhbmRsZSgpXG5cdFx0XHRuYW1lc3BhY2VzID0gdHlwZS5zcGxpdCggXCIuXCIgKTtcblx0XHRcdHR5cGUgPSBuYW1lc3BhY2VzLnNoaWZ0KCk7XG5cdFx0XHRuYW1lc3BhY2VzLnNvcnQoKTtcblx0XHR9XG5cdFx0b250eXBlID0gdHlwZS5pbmRleE9mKCBcIjpcIiApIDwgMCAmJiBcIm9uXCIgKyB0eXBlO1xuXG5cdFx0Ly8gQ2FsbGVyIGNhbiBwYXNzIGluIGEgalF1ZXJ5LkV2ZW50IG9iamVjdCwgT2JqZWN0LCBvciBqdXN0IGFuIGV2ZW50IHR5cGUgc3RyaW5nXG5cdFx0ZXZlbnQgPSBldmVudFsgalF1ZXJ5LmV4cGFuZG8gXSA/XG5cdFx0XHRldmVudCA6XG5cdFx0XHRuZXcgalF1ZXJ5LkV2ZW50KCB0eXBlLCB0eXBlb2YgZXZlbnQgPT09IFwib2JqZWN0XCIgJiYgZXZlbnQgKTtcblxuXHRcdC8vIFRyaWdnZXIgYml0bWFzazogJiAxIGZvciBuYXRpdmUgaGFuZGxlcnM7ICYgMiBmb3IgalF1ZXJ5IChhbHdheXMgdHJ1ZSlcblx0XHRldmVudC5pc1RyaWdnZXIgPSBvbmx5SGFuZGxlcnMgPyAyIDogMztcblx0XHRldmVudC5uYW1lc3BhY2UgPSBuYW1lc3BhY2VzLmpvaW4oIFwiLlwiICk7XG5cdFx0ZXZlbnQucm5hbWVzcGFjZSA9IGV2ZW50Lm5hbWVzcGFjZSA/XG5cdFx0XHRuZXcgUmVnRXhwKCBcIihefFxcXFwuKVwiICsgbmFtZXNwYWNlcy5qb2luKCBcIlxcXFwuKD86LipcXFxcLnwpXCIgKSArIFwiKFxcXFwufCQpXCIgKSA6XG5cdFx0XHRudWxsO1xuXG5cdFx0Ly8gQ2xlYW4gdXAgdGhlIGV2ZW50IGluIGNhc2UgaXQgaXMgYmVpbmcgcmV1c2VkXG5cdFx0ZXZlbnQucmVzdWx0ID0gdW5kZWZpbmVkO1xuXHRcdGlmICggIWV2ZW50LnRhcmdldCApIHtcblx0XHRcdGV2ZW50LnRhcmdldCA9IGVsZW07XG5cdFx0fVxuXG5cdFx0Ly8gQ2xvbmUgYW55IGluY29taW5nIGRhdGEgYW5kIHByZXBlbmQgdGhlIGV2ZW50LCBjcmVhdGluZyB0aGUgaGFuZGxlciBhcmcgbGlzdFxuXHRcdGRhdGEgPSBkYXRhID09IG51bGwgP1xuXHRcdFx0WyBldmVudCBdIDpcblx0XHRcdGpRdWVyeS5tYWtlQXJyYXkoIGRhdGEsIFsgZXZlbnQgXSApO1xuXG5cdFx0Ly8gQWxsb3cgc3BlY2lhbCBldmVudHMgdG8gZHJhdyBvdXRzaWRlIHRoZSBsaW5lc1xuXHRcdHNwZWNpYWwgPSBqUXVlcnkuZXZlbnQuc3BlY2lhbFsgdHlwZSBdIHx8IHt9O1xuXHRcdGlmICggIW9ubHlIYW5kbGVycyAmJiBzcGVjaWFsLnRyaWdnZXIgJiYgc3BlY2lhbC50cmlnZ2VyLmFwcGx5KCBlbGVtLCBkYXRhICkgPT09IGZhbHNlICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIERldGVybWluZSBldmVudCBwcm9wYWdhdGlvbiBwYXRoIGluIGFkdmFuY2UsIHBlciBXM0MgZXZlbnRzIHNwZWMgKHRyYWMtOTk1MSlcblx0XHQvLyBCdWJibGUgdXAgdG8gZG9jdW1lbnQsIHRoZW4gdG8gd2luZG93OyB3YXRjaCBmb3IgYSBnbG9iYWwgb3duZXJEb2N1bWVudCB2YXIgKHRyYWMtOTcyNClcblx0XHRpZiAoICFvbmx5SGFuZGxlcnMgJiYgIXNwZWNpYWwubm9CdWJibGUgJiYgIWlzV2luZG93KCBlbGVtICkgKSB7XG5cblx0XHRcdGJ1YmJsZVR5cGUgPSBzcGVjaWFsLmRlbGVnYXRlVHlwZSB8fCB0eXBlO1xuXHRcdFx0aWYgKCAhcmZvY3VzTW9ycGgudGVzdCggYnViYmxlVHlwZSArIHR5cGUgKSApIHtcblx0XHRcdFx0Y3VyID0gY3VyLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKCA7IGN1cjsgY3VyID0gY3VyLnBhcmVudE5vZGUgKSB7XG5cdFx0XHRcdGV2ZW50UGF0aC5wdXNoKCBjdXIgKTtcblx0XHRcdFx0dG1wID0gY3VyO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBPbmx5IGFkZCB3aW5kb3cgaWYgd2UgZ290IHRvIGRvY3VtZW50IChlLmcuLCBub3QgcGxhaW4gb2JqIG9yIGRldGFjaGVkIERPTSlcblx0XHRcdGlmICggdG1wID09PSAoIGVsZW0ub3duZXJEb2N1bWVudCB8fCBkb2N1bWVudCApICkge1xuXHRcdFx0XHRldmVudFBhdGgucHVzaCggdG1wLmRlZmF1bHRWaWV3IHx8IHRtcC5wYXJlbnRXaW5kb3cgfHwgd2luZG93ICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZSBoYW5kbGVycyBvbiB0aGUgZXZlbnQgcGF0aFxuXHRcdGkgPSAwO1xuXHRcdHdoaWxlICggKCBjdXIgPSBldmVudFBhdGhbIGkrKyBdICkgJiYgIWV2ZW50LmlzUHJvcGFnYXRpb25TdG9wcGVkKCkgKSB7XG5cdFx0XHRsYXN0RWxlbWVudCA9IGN1cjtcblx0XHRcdGV2ZW50LnR5cGUgPSBpID4gMSA/XG5cdFx0XHRcdGJ1YmJsZVR5cGUgOlxuXHRcdFx0XHRzcGVjaWFsLmJpbmRUeXBlIHx8IHR5cGU7XG5cblx0XHRcdC8vIGpRdWVyeSBoYW5kbGVyXG5cdFx0XHRoYW5kbGUgPSAoIGRhdGFQcml2LmdldCggY3VyLCBcImV2ZW50c1wiICkgfHwgT2JqZWN0LmNyZWF0ZSggbnVsbCApIClbIGV2ZW50LnR5cGUgXSAmJlxuXHRcdFx0XHRkYXRhUHJpdi5nZXQoIGN1ciwgXCJoYW5kbGVcIiApO1xuXHRcdFx0aWYgKCBoYW5kbGUgKSB7XG5cdFx0XHRcdGhhbmRsZS5hcHBseSggY3VyLCBkYXRhICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5hdGl2ZSBoYW5kbGVyXG5cdFx0XHRoYW5kbGUgPSBvbnR5cGUgJiYgY3VyWyBvbnR5cGUgXTtcblx0XHRcdGlmICggaGFuZGxlICYmIGhhbmRsZS5hcHBseSAmJiBhY2NlcHREYXRhKCBjdXIgKSApIHtcblx0XHRcdFx0ZXZlbnQucmVzdWx0ID0gaGFuZGxlLmFwcGx5KCBjdXIsIGRhdGEgKTtcblx0XHRcdFx0aWYgKCBldmVudC5yZXN1bHQgPT09IGZhbHNlICkge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZXZlbnQudHlwZSA9IHR5cGU7XG5cblx0XHQvLyBJZiBub2JvZHkgcHJldmVudGVkIHRoZSBkZWZhdWx0IGFjdGlvbiwgZG8gaXQgbm93XG5cdFx0aWYgKCAhb25seUhhbmRsZXJzICYmICFldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSApIHtcblxuXHRcdFx0aWYgKCAoICFzcGVjaWFsLl9kZWZhdWx0IHx8XG5cdFx0XHRcdHNwZWNpYWwuX2RlZmF1bHQuYXBwbHkoIGV2ZW50UGF0aC5wb3AoKSwgZGF0YSApID09PSBmYWxzZSApICYmXG5cdFx0XHRcdGFjY2VwdERhdGEoIGVsZW0gKSApIHtcblxuXHRcdFx0XHQvLyBDYWxsIGEgbmF0aXZlIERPTSBtZXRob2Qgb24gdGhlIHRhcmdldCB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgdGhlIGV2ZW50LlxuXHRcdFx0XHQvLyBEb24ndCBkbyBkZWZhdWx0IGFjdGlvbnMgb24gd2luZG93LCB0aGF0J3Mgd2hlcmUgZ2xvYmFsIHZhcmlhYmxlcyBiZSAodHJhYy02MTcwKVxuXHRcdFx0XHRpZiAoIG9udHlwZSAmJiBpc0Z1bmN0aW9uKCBlbGVtWyB0eXBlIF0gKSAmJiAhaXNXaW5kb3coIGVsZW0gKSApIHtcblxuXHRcdFx0XHRcdC8vIERvbid0IHJlLXRyaWdnZXIgYW4gb25GT08gZXZlbnQgd2hlbiB3ZSBjYWxsIGl0cyBGT08oKSBtZXRob2Rcblx0XHRcdFx0XHR0bXAgPSBlbGVtWyBvbnR5cGUgXTtcblxuXHRcdFx0XHRcdGlmICggdG1wICkge1xuXHRcdFx0XHRcdFx0ZWxlbVsgb250eXBlIF0gPSBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFByZXZlbnQgcmUtdHJpZ2dlcmluZyBvZiB0aGUgc2FtZSBldmVudCwgc2luY2Ugd2UgYWxyZWFkeSBidWJibGVkIGl0IGFib3ZlXG5cdFx0XHRcdFx0alF1ZXJ5LmV2ZW50LnRyaWdnZXJlZCA9IHR5cGU7XG5cblx0XHRcdFx0XHRpZiAoIGV2ZW50LmlzUHJvcGFnYXRpb25TdG9wcGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRsYXN0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBzdG9wUHJvcGFnYXRpb25DYWxsYmFjayApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGVsZW1bIHR5cGUgXSgpO1xuXG5cdFx0XHRcdFx0aWYgKCBldmVudC5pc1Byb3BhZ2F0aW9uU3RvcHBlZCgpICkge1xuXHRcdFx0XHRcdFx0bGFzdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggdHlwZSwgc3RvcFByb3BhZ2F0aW9uQ2FsbGJhY2sgKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRqUXVlcnkuZXZlbnQudHJpZ2dlcmVkID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdFx0aWYgKCB0bXAgKSB7XG5cdFx0XHRcdFx0XHRlbGVtWyBvbnR5cGUgXSA9IHRtcDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZXZlbnQucmVzdWx0O1xuXHR9LFxuXG5cdC8vIFBpZ2d5YmFjayBvbiBhIGRvbm9yIGV2ZW50IHRvIHNpbXVsYXRlIGEgZGlmZmVyZW50IG9uZVxuXHQvLyBVc2VkIG9ubHkgZm9yIGBmb2N1cyhpbiB8IG91dClgIGV2ZW50c1xuXHRzaW11bGF0ZTogZnVuY3Rpb24oIHR5cGUsIGVsZW0sIGV2ZW50ICkge1xuXHRcdHZhciBlID0galF1ZXJ5LmV4dGVuZChcblx0XHRcdG5ldyBqUXVlcnkuRXZlbnQoKSxcblx0XHRcdGV2ZW50LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRpc1NpbXVsYXRlZDogdHJ1ZVxuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHRqUXVlcnkuZXZlbnQudHJpZ2dlciggZSwgbnVsbCwgZWxlbSApO1xuXHR9XG5cbn0gKTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKCB0eXBlLCBkYXRhICkge1xuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0alF1ZXJ5LmV2ZW50LnRyaWdnZXIoIHR5cGUsIGRhdGEsIHRoaXMgKTtcblx0XHR9ICk7XG5cdH0sXG5cdHRyaWdnZXJIYW5kbGVyOiBmdW5jdGlvbiggdHlwZSwgZGF0YSApIHtcblx0XHR2YXIgZWxlbSA9IHRoaXNbIDAgXTtcblx0XHRpZiAoIGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4galF1ZXJ5LmV2ZW50LnRyaWdnZXIoIHR5cGUsIGRhdGEsIGVsZW0sIHRydWUgKTtcblx0XHR9XG5cdH1cbn0gKTtcblxuXG52YXJcblx0cmJyYWNrZXQgPSAvXFxbXFxdJC8sXG5cdHJDUkxGID0gL1xccj9cXG4vZyxcblx0cnN1Ym1pdHRlclR5cGVzID0gL14oPzpzdWJtaXR8YnV0dG9ufGltYWdlfHJlc2V0fGZpbGUpJC9pLFxuXHRyc3VibWl0dGFibGUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2k7XG5cbmZ1bmN0aW9uIGJ1aWxkUGFyYW1zKCBwcmVmaXgsIG9iaiwgdHJhZGl0aW9uYWwsIGFkZCApIHtcblx0dmFyIG5hbWU7XG5cblx0aWYgKCBBcnJheS5pc0FycmF5KCBvYmogKSApIHtcblxuXHRcdC8vIFNlcmlhbGl6ZSBhcnJheSBpdGVtLlxuXHRcdGpRdWVyeS5lYWNoKCBvYmosIGZ1bmN0aW9uKCBpLCB2ICkge1xuXHRcdFx0aWYgKCB0cmFkaXRpb25hbCB8fCByYnJhY2tldC50ZXN0KCBwcmVmaXggKSApIHtcblxuXHRcdFx0XHQvLyBUcmVhdCBlYWNoIGFycmF5IGl0ZW0gYXMgYSBzY2FsYXIuXG5cdFx0XHRcdGFkZCggcHJlZml4LCB2ICk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gSXRlbSBpcyBub24tc2NhbGFyIChhcnJheSBvciBvYmplY3QpLCBlbmNvZGUgaXRzIG51bWVyaWMgaW5kZXguXG5cdFx0XHRcdGJ1aWxkUGFyYW1zKFxuXHRcdFx0XHRcdHByZWZpeCArIFwiW1wiICsgKCB0eXBlb2YgdiA9PT0gXCJvYmplY3RcIiAmJiB2ICE9IG51bGwgPyBpIDogXCJcIiApICsgXCJdXCIsXG5cdFx0XHRcdFx0dixcblx0XHRcdFx0XHR0cmFkaXRpb25hbCxcblx0XHRcdFx0XHRhZGRcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fSBlbHNlIGlmICggIXRyYWRpdGlvbmFsICYmIHRvVHlwZSggb2JqICkgPT09IFwib2JqZWN0XCIgKSB7XG5cblx0XHQvLyBTZXJpYWxpemUgb2JqZWN0IGl0ZW0uXG5cdFx0Zm9yICggbmFtZSBpbiBvYmogKSB7XG5cdFx0XHRidWlsZFBhcmFtcyggcHJlZml4ICsgXCJbXCIgKyBuYW1lICsgXCJdXCIsIG9ialsgbmFtZSBdLCB0cmFkaXRpb25hbCwgYWRkICk7XG5cdFx0fVxuXG5cdH0gZWxzZSB7XG5cblx0XHQvLyBTZXJpYWxpemUgc2NhbGFyIGl0ZW0uXG5cdFx0YWRkKCBwcmVmaXgsIG9iaiApO1xuXHR9XG59XG5cbi8vIFNlcmlhbGl6ZSBhbiBhcnJheSBvZiBmb3JtIGVsZW1lbnRzIG9yIGEgc2V0IG9mXG4vLyBrZXkvdmFsdWVzIGludG8gYSBxdWVyeSBzdHJpbmdcbmpRdWVyeS5wYXJhbSA9IGZ1bmN0aW9uKCBhLCB0cmFkaXRpb25hbCApIHtcblx0dmFyIHByZWZpeCxcblx0XHRzID0gW10sXG5cdFx0YWRkID0gZnVuY3Rpb24oIGtleSwgdmFsdWVPckZ1bmN0aW9uICkge1xuXG5cdFx0XHQvLyBJZiB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCBpbnZva2UgaXQgYW5kIHVzZSBpdHMgcmV0dXJuIHZhbHVlXG5cdFx0XHR2YXIgdmFsdWUgPSBpc0Z1bmN0aW9uKCB2YWx1ZU9yRnVuY3Rpb24gKSA/XG5cdFx0XHRcdHZhbHVlT3JGdW5jdGlvbigpIDpcblx0XHRcdFx0dmFsdWVPckZ1bmN0aW9uO1xuXG5cdFx0XHRzWyBzLmxlbmd0aCBdID0gZW5jb2RlVVJJQ29tcG9uZW50KCBrZXkgKSArIFwiPVwiICtcblx0XHRcdFx0ZW5jb2RlVVJJQ29tcG9uZW50KCB2YWx1ZSA9PSBudWxsID8gXCJcIiA6IHZhbHVlICk7XG5cdFx0fTtcblxuXHRpZiAoIGEgPT0gbnVsbCApIHtcblx0XHRyZXR1cm4gXCJcIjtcblx0fVxuXG5cdC8vIElmIGFuIGFycmF5IHdhcyBwYXNzZWQgaW4sIGFzc3VtZSB0aGF0IGl0IGlzIGFuIGFycmF5IG9mIGZvcm0gZWxlbWVudHMuXG5cdGlmICggQXJyYXkuaXNBcnJheSggYSApIHx8ICggYS5qcXVlcnkgJiYgIWpRdWVyeS5pc1BsYWluT2JqZWN0KCBhICkgKSApIHtcblxuXHRcdC8vIFNlcmlhbGl6ZSB0aGUgZm9ybSBlbGVtZW50c1xuXHRcdGpRdWVyeS5lYWNoKCBhLCBmdW5jdGlvbigpIHtcblx0XHRcdGFkZCggdGhpcy5uYW1lLCB0aGlzLnZhbHVlICk7XG5cdFx0fSApO1xuXG5cdH0gZWxzZSB7XG5cblx0XHQvLyBJZiB0cmFkaXRpb25hbCwgZW5jb2RlIHRoZSBcIm9sZFwiIHdheSAodGhlIHdheSAxLjMuMiBvciBvbGRlclxuXHRcdC8vIGRpZCBpdCksIG90aGVyd2lzZSBlbmNvZGUgcGFyYW1zIHJlY3Vyc2l2ZWx5LlxuXHRcdGZvciAoIHByZWZpeCBpbiBhICkge1xuXHRcdFx0YnVpbGRQYXJhbXMoIHByZWZpeCwgYVsgcHJlZml4IF0sIHRyYWRpdGlvbmFsLCBhZGQgKTtcblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIHJlc3VsdGluZyBzZXJpYWxpemF0aW9uXG5cdHJldHVybiBzLmpvaW4oIFwiJlwiICk7XG59O1xuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cdHNlcmlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGpRdWVyeS5wYXJhbSggdGhpcy5zZXJpYWxpemVBcnJheSgpICk7XG5cdH0sXG5cdHNlcmlhbGl6ZUFycmF5OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXAoIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQvLyBDYW4gYWRkIHByb3BIb29rIGZvciBcImVsZW1lbnRzXCIgdG8gZmlsdGVyIG9yIGFkZCBmb3JtIGVsZW1lbnRzXG5cdFx0XHR2YXIgZWxlbWVudHMgPSBqUXVlcnkucHJvcCggdGhpcywgXCJlbGVtZW50c1wiICk7XG5cdFx0XHRyZXR1cm4gZWxlbWVudHMgPyBqUXVlcnkubWFrZUFycmF5KCBlbGVtZW50cyApIDogdGhpcztcblx0XHR9ICkuZmlsdGVyKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB0eXBlID0gdGhpcy50eXBlO1xuXG5cdFx0XHQvLyBVc2UgLmlzKCBcIjpkaXNhYmxlZFwiICkgc28gdGhhdCBmaWVsZHNldFtkaXNhYmxlZF0gd29ya3Ncblx0XHRcdHJldHVybiB0aGlzLm5hbWUgJiYgIWpRdWVyeSggdGhpcyApLmlzKCBcIjpkaXNhYmxlZFwiICkgJiZcblx0XHRcdFx0cnN1Ym1pdHRhYmxlLnRlc3QoIHRoaXMubm9kZU5hbWUgKSAmJiAhcnN1Ym1pdHRlclR5cGVzLnRlc3QoIHR5cGUgKSAmJlxuXHRcdFx0XHQoIHRoaXMuY2hlY2tlZCB8fCAhcmNoZWNrYWJsZVR5cGUudGVzdCggdHlwZSApICk7XG5cdFx0fSApLm1hcCggZnVuY3Rpb24oIF9pLCBlbGVtICkge1xuXHRcdFx0dmFyIHZhbCA9IGpRdWVyeSggdGhpcyApLnZhbCgpO1xuXG5cdFx0XHRpZiAoIHZhbCA9PSBudWxsICkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBBcnJheS5pc0FycmF5KCB2YWwgKSApIHtcblx0XHRcdFx0cmV0dXJuIGpRdWVyeS5tYXAoIHZhbCwgZnVuY3Rpb24oIHZhbCApIHtcblx0XHRcdFx0XHRyZXR1cm4geyBuYW1lOiBlbGVtLm5hbWUsIHZhbHVlOiB2YWwucmVwbGFjZSggckNSTEYsIFwiXFxyXFxuXCIgKSB9O1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7IG5hbWU6IGVsZW0ubmFtZSwgdmFsdWU6IHZhbC5yZXBsYWNlKCByQ1JMRiwgXCJcXHJcXG5cIiApIH07XG5cdFx0fSApLmdldCgpO1xuXHR9XG59ICk7XG5cblxudmFyXG5cdHIyMCA9IC8lMjAvZyxcblx0cmhhc2ggPSAvIy4qJC8sXG5cdHJhbnRpQ2FjaGUgPSAvKFs/Jl0pXz1bXiZdKi8sXG5cdHJoZWFkZXJzID0gL14oLio/KTpbIFxcdF0qKFteXFxyXFxuXSopJC9tZyxcblxuXHQvLyB0cmFjLTc2NTMsIHRyYWMtODEyNSwgdHJhYy04MTUyOiBsb2NhbCBwcm90b2NvbCBkZXRlY3Rpb25cblx0cmxvY2FsUHJvdG9jb2wgPSAvXig/OmFib3V0fGFwcHxhcHAtc3RvcmFnZXwuKy1leHRlbnNpb258ZmlsZXxyZXN8d2lkZ2V0KTokLyxcblx0cm5vQ29udGVudCA9IC9eKD86R0VUfEhFQUQpJC8sXG5cdHJwcm90b2NvbCA9IC9eXFwvXFwvLyxcblxuXHQvKiBQcmVmaWx0ZXJzXG5cdCAqIDEpIFRoZXkgYXJlIHVzZWZ1bCB0byBpbnRyb2R1Y2UgY3VzdG9tIGRhdGFUeXBlcyAoc2VlIGFqYXgvanNvbnAuanMgZm9yIGFuIGV4YW1wbGUpXG5cdCAqIDIpIFRoZXNlIGFyZSBjYWxsZWQ6XG5cdCAqICAgIC0gQkVGT1JFIGFza2luZyBmb3IgYSB0cmFuc3BvcnRcblx0ICogICAgLSBBRlRFUiBwYXJhbSBzZXJpYWxpemF0aW9uIChzLmRhdGEgaXMgYSBzdHJpbmcgaWYgcy5wcm9jZXNzRGF0YSBpcyB0cnVlKVxuXHQgKiAzKSBrZXkgaXMgdGhlIGRhdGFUeXBlXG5cdCAqIDQpIHRoZSBjYXRjaGFsbCBzeW1ib2wgXCIqXCIgY2FuIGJlIHVzZWRcblx0ICogNSkgZXhlY3V0aW9uIHdpbGwgc3RhcnQgd2l0aCB0cmFuc3BvcnQgZGF0YVR5cGUgYW5kIFRIRU4gY29udGludWUgZG93biB0byBcIipcIiBpZiBuZWVkZWRcblx0ICovXG5cdHByZWZpbHRlcnMgPSB7fSxcblxuXHQvKiBUcmFuc3BvcnRzIGJpbmRpbmdzXG5cdCAqIDEpIGtleSBpcyB0aGUgZGF0YVR5cGVcblx0ICogMikgdGhlIGNhdGNoYWxsIHN5bWJvbCBcIipcIiBjYW4gYmUgdXNlZFxuXHQgKiAzKSBzZWxlY3Rpb24gd2lsbCBzdGFydCB3aXRoIHRyYW5zcG9ydCBkYXRhVHlwZSBhbmQgVEhFTiBnbyB0byBcIipcIiBpZiBuZWVkZWRcblx0ICovXG5cdHRyYW5zcG9ydHMgPSB7fSxcblxuXHQvLyBBdm9pZCBjb21tZW50LXByb2xvZyBjaGFyIHNlcXVlbmNlICh0cmFjLTEwMDk4KTsgbXVzdCBhcHBlYXNlIGxpbnQgYW5kIGV2YWRlIGNvbXByZXNzaW9uXG5cdGFsbFR5cGVzID0gXCIqL1wiLmNvbmNhdCggXCIqXCIgKSxcblxuXHQvLyBBbmNob3IgdGFnIGZvciBwYXJzaW5nIHRoZSBkb2N1bWVudCBvcmlnaW5cblx0b3JpZ2luQW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJhXCIgKTtcblxub3JpZ2luQW5jaG9yLmhyZWYgPSBsb2NhdGlvbi5ocmVmO1xuXG4vLyBCYXNlIFwiY29uc3RydWN0b3JcIiBmb3IgalF1ZXJ5LmFqYXhQcmVmaWx0ZXIgYW5kIGpRdWVyeS5hamF4VHJhbnNwb3J0XG5mdW5jdGlvbiBhZGRUb1ByZWZpbHRlcnNPclRyYW5zcG9ydHMoIHN0cnVjdHVyZSApIHtcblxuXHQvLyBkYXRhVHlwZUV4cHJlc3Npb24gaXMgb3B0aW9uYWwgYW5kIGRlZmF1bHRzIHRvIFwiKlwiXG5cdHJldHVybiBmdW5jdGlvbiggZGF0YVR5cGVFeHByZXNzaW9uLCBmdW5jICkge1xuXG5cdFx0aWYgKCB0eXBlb2YgZGF0YVR5cGVFeHByZXNzaW9uICE9PSBcInN0cmluZ1wiICkge1xuXHRcdFx0ZnVuYyA9IGRhdGFUeXBlRXhwcmVzc2lvbjtcblx0XHRcdGRhdGFUeXBlRXhwcmVzc2lvbiA9IFwiKlwiO1xuXHRcdH1cblxuXHRcdHZhciBkYXRhVHlwZSxcblx0XHRcdGkgPSAwLFxuXHRcdFx0ZGF0YVR5cGVzID0gZGF0YVR5cGVFeHByZXNzaW9uLnRvTG93ZXJDYXNlKCkubWF0Y2goIHJub3RodG1sd2hpdGUgKSB8fCBbXTtcblxuXHRcdGlmICggaXNGdW5jdGlvbiggZnVuYyApICkge1xuXG5cdFx0XHQvLyBGb3IgZWFjaCBkYXRhVHlwZSBpbiB0aGUgZGF0YVR5cGVFeHByZXNzaW9uXG5cdFx0XHR3aGlsZSAoICggZGF0YVR5cGUgPSBkYXRhVHlwZXNbIGkrKyBdICkgKSB7XG5cblx0XHRcdFx0Ly8gUHJlcGVuZCBpZiByZXF1ZXN0ZWRcblx0XHRcdFx0aWYgKCBkYXRhVHlwZVsgMCBdID09PSBcIitcIiApIHtcblx0XHRcdFx0XHRkYXRhVHlwZSA9IGRhdGFUeXBlLnNsaWNlKCAxICkgfHwgXCIqXCI7XG5cdFx0XHRcdFx0KCBzdHJ1Y3R1cmVbIGRhdGFUeXBlIF0gPSBzdHJ1Y3R1cmVbIGRhdGFUeXBlIF0gfHwgW10gKS51bnNoaWZ0KCBmdW5jICk7XG5cblx0XHRcdFx0Ly8gT3RoZXJ3aXNlIGFwcGVuZFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCggc3RydWN0dXJlWyBkYXRhVHlwZSBdID0gc3RydWN0dXJlWyBkYXRhVHlwZSBdIHx8IFtdICkucHVzaCggZnVuYyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufVxuXG4vLyBCYXNlIGluc3BlY3Rpb24gZnVuY3Rpb24gZm9yIHByZWZpbHRlcnMgYW5kIHRyYW5zcG9ydHNcbmZ1bmN0aW9uIGluc3BlY3RQcmVmaWx0ZXJzT3JUcmFuc3BvcnRzKCBzdHJ1Y3R1cmUsIG9wdGlvbnMsIG9yaWdpbmFsT3B0aW9ucywganFYSFIgKSB7XG5cblx0dmFyIGluc3BlY3RlZCA9IHt9LFxuXHRcdHNlZWtpbmdUcmFuc3BvcnQgPSAoIHN0cnVjdHVyZSA9PT0gdHJhbnNwb3J0cyApO1xuXG5cdGZ1bmN0aW9uIGluc3BlY3QoIGRhdGFUeXBlICkge1xuXHRcdHZhciBzZWxlY3RlZDtcblx0XHRpbnNwZWN0ZWRbIGRhdGFUeXBlIF0gPSB0cnVlO1xuXHRcdGpRdWVyeS5lYWNoKCBzdHJ1Y3R1cmVbIGRhdGFUeXBlIF0gfHwgW10sIGZ1bmN0aW9uKCBfLCBwcmVmaWx0ZXJPckZhY3RvcnkgKSB7XG5cdFx0XHR2YXIgZGF0YVR5cGVPclRyYW5zcG9ydCA9IHByZWZpbHRlck9yRmFjdG9yeSggb3B0aW9ucywgb3JpZ2luYWxPcHRpb25zLCBqcVhIUiApO1xuXHRcdFx0aWYgKCB0eXBlb2YgZGF0YVR5cGVPclRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiAmJlxuXHRcdFx0XHQhc2Vla2luZ1RyYW5zcG9ydCAmJiAhaW5zcGVjdGVkWyBkYXRhVHlwZU9yVHJhbnNwb3J0IF0gKSB7XG5cblx0XHRcdFx0b3B0aW9ucy5kYXRhVHlwZXMudW5zaGlmdCggZGF0YVR5cGVPclRyYW5zcG9ydCApO1xuXHRcdFx0XHRpbnNwZWN0KCBkYXRhVHlwZU9yVHJhbnNwb3J0ICk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0gZWxzZSBpZiAoIHNlZWtpbmdUcmFuc3BvcnQgKSB7XG5cdFx0XHRcdHJldHVybiAhKCBzZWxlY3RlZCA9IGRhdGFUeXBlT3JUcmFuc3BvcnQgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdFx0cmV0dXJuIHNlbGVjdGVkO1xuXHR9XG5cblx0cmV0dXJuIGluc3BlY3QoIG9wdGlvbnMuZGF0YVR5cGVzWyAwIF0gKSB8fCAhaW5zcGVjdGVkWyBcIipcIiBdICYmIGluc3BlY3QoIFwiKlwiICk7XG59XG5cbi8vIEEgc3BlY2lhbCBleHRlbmQgZm9yIGFqYXggb3B0aW9uc1xuLy8gdGhhdCB0YWtlcyBcImZsYXRcIiBvcHRpb25zIChub3QgdG8gYmUgZGVlcCBleHRlbmRlZClcbi8vIEZpeGVzIHRyYWMtOTg4N1xuZnVuY3Rpb24gYWpheEV4dGVuZCggdGFyZ2V0LCBzcmMgKSB7XG5cdHZhciBrZXksIGRlZXAsXG5cdFx0ZmxhdE9wdGlvbnMgPSBqUXVlcnkuYWpheFNldHRpbmdzLmZsYXRPcHRpb25zIHx8IHt9O1xuXG5cdGZvciAoIGtleSBpbiBzcmMgKSB7XG5cdFx0aWYgKCBzcmNbIGtleSBdICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHQoIGZsYXRPcHRpb25zWyBrZXkgXSA/IHRhcmdldCA6ICggZGVlcCB8fCAoIGRlZXAgPSB7fSApICkgKVsga2V5IF0gPSBzcmNbIGtleSBdO1xuXHRcdH1cblx0fVxuXHRpZiAoIGRlZXAgKSB7XG5cdFx0alF1ZXJ5LmV4dGVuZCggdHJ1ZSwgdGFyZ2V0LCBkZWVwICk7XG5cdH1cblxuXHRyZXR1cm4gdGFyZ2V0O1xufVxuXG4vKiBIYW5kbGVzIHJlc3BvbnNlcyB0byBhbiBhamF4IHJlcXVlc3Q6XG4gKiAtIGZpbmRzIHRoZSByaWdodCBkYXRhVHlwZSAobWVkaWF0ZXMgYmV0d2VlbiBjb250ZW50LXR5cGUgYW5kIGV4cGVjdGVkIGRhdGFUeXBlKVxuICogLSByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIHJlc3BvbnNlXG4gKi9cbmZ1bmN0aW9uIGFqYXhIYW5kbGVSZXNwb25zZXMoIHMsIGpxWEhSLCByZXNwb25zZXMgKSB7XG5cblx0dmFyIGN0LCB0eXBlLCBmaW5hbERhdGFUeXBlLCBmaXJzdERhdGFUeXBlLFxuXHRcdGNvbnRlbnRzID0gcy5jb250ZW50cyxcblx0XHRkYXRhVHlwZXMgPSBzLmRhdGFUeXBlcztcblxuXHQvLyBSZW1vdmUgYXV0byBkYXRhVHlwZSBhbmQgZ2V0IGNvbnRlbnQtdHlwZSBpbiB0aGUgcHJvY2Vzc1xuXHR3aGlsZSAoIGRhdGFUeXBlc1sgMCBdID09PSBcIipcIiApIHtcblx0XHRkYXRhVHlwZXMuc2hpZnQoKTtcblx0XHRpZiAoIGN0ID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRjdCA9IHMubWltZVR5cGUgfHwganFYSFIuZ2V0UmVzcG9uc2VIZWFkZXIoIFwiQ29udGVudC1UeXBlXCIgKTtcblx0XHR9XG5cdH1cblxuXHQvLyBDaGVjayBpZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBrbm93biBjb250ZW50LXR5cGVcblx0aWYgKCBjdCApIHtcblx0XHRmb3IgKCB0eXBlIGluIGNvbnRlbnRzICkge1xuXHRcdFx0aWYgKCBjb250ZW50c1sgdHlwZSBdICYmIGNvbnRlbnRzWyB0eXBlIF0udGVzdCggY3QgKSApIHtcblx0XHRcdFx0ZGF0YVR5cGVzLnVuc2hpZnQoIHR5cGUgKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ2hlY2sgdG8gc2VlIGlmIHdlIGhhdmUgYSByZXNwb25zZSBmb3IgdGhlIGV4cGVjdGVkIGRhdGFUeXBlXG5cdGlmICggZGF0YVR5cGVzWyAwIF0gaW4gcmVzcG9uc2VzICkge1xuXHRcdGZpbmFsRGF0YVR5cGUgPSBkYXRhVHlwZXNbIDAgXTtcblx0fSBlbHNlIHtcblxuXHRcdC8vIFRyeSBjb252ZXJ0aWJsZSBkYXRhVHlwZXNcblx0XHRmb3IgKCB0eXBlIGluIHJlc3BvbnNlcyApIHtcblx0XHRcdGlmICggIWRhdGFUeXBlc1sgMCBdIHx8IHMuY29udmVydGVyc1sgdHlwZSArIFwiIFwiICsgZGF0YVR5cGVzWyAwIF0gXSApIHtcblx0XHRcdFx0ZmluYWxEYXRhVHlwZSA9IHR5cGU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCAhZmlyc3REYXRhVHlwZSApIHtcblx0XHRcdFx0Zmlyc3REYXRhVHlwZSA9IHR5cGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gT3IganVzdCB1c2UgZmlyc3Qgb25lXG5cdFx0ZmluYWxEYXRhVHlwZSA9IGZpbmFsRGF0YVR5cGUgfHwgZmlyc3REYXRhVHlwZTtcblx0fVxuXG5cdC8vIElmIHdlIGZvdW5kIGEgZGF0YVR5cGVcblx0Ly8gV2UgYWRkIHRoZSBkYXRhVHlwZSB0byB0aGUgbGlzdCBpZiBuZWVkZWRcblx0Ly8gYW5kIHJldHVybiB0aGUgY29ycmVzcG9uZGluZyByZXNwb25zZVxuXHRpZiAoIGZpbmFsRGF0YVR5cGUgKSB7XG5cdFx0aWYgKCBmaW5hbERhdGFUeXBlICE9PSBkYXRhVHlwZXNbIDAgXSApIHtcblx0XHRcdGRhdGFUeXBlcy51bnNoaWZ0KCBmaW5hbERhdGFUeXBlICk7XG5cdFx0fVxuXHRcdHJldHVybiByZXNwb25zZXNbIGZpbmFsRGF0YVR5cGUgXTtcblx0fVxufVxuXG4vKiBDaGFpbiBjb252ZXJzaW9ucyBnaXZlbiB0aGUgcmVxdWVzdCBhbmQgdGhlIG9yaWdpbmFsIHJlc3BvbnNlXG4gKiBBbHNvIHNldHMgdGhlIHJlc3BvbnNlWFhYIGZpZWxkcyBvbiB0aGUganFYSFIgaW5zdGFuY2VcbiAqL1xuZnVuY3Rpb24gYWpheENvbnZlcnQoIHMsIHJlc3BvbnNlLCBqcVhIUiwgaXNTdWNjZXNzICkge1xuXHR2YXIgY29udjIsIGN1cnJlbnQsIGNvbnYsIHRtcCwgcHJldixcblx0XHRjb252ZXJ0ZXJzID0ge30sXG5cblx0XHQvLyBXb3JrIHdpdGggYSBjb3B5IG9mIGRhdGFUeXBlcyBpbiBjYXNlIHdlIG5lZWQgdG8gbW9kaWZ5IGl0IGZvciBjb252ZXJzaW9uXG5cdFx0ZGF0YVR5cGVzID0gcy5kYXRhVHlwZXMuc2xpY2UoKTtcblxuXHQvLyBDcmVhdGUgY29udmVydGVycyBtYXAgd2l0aCBsb3dlcmNhc2VkIGtleXNcblx0aWYgKCBkYXRhVHlwZXNbIDEgXSApIHtcblx0XHRmb3IgKCBjb252IGluIHMuY29udmVydGVycyApIHtcblx0XHRcdGNvbnZlcnRlcnNbIGNvbnYudG9Mb3dlckNhc2UoKSBdID0gcy5jb252ZXJ0ZXJzWyBjb252IF07XG5cdFx0fVxuXHR9XG5cblx0Y3VycmVudCA9IGRhdGFUeXBlcy5zaGlmdCgpO1xuXG5cdC8vIENvbnZlcnQgdG8gZWFjaCBzZXF1ZW50aWFsIGRhdGFUeXBlXG5cdHdoaWxlICggY3VycmVudCApIHtcblxuXHRcdGlmICggcy5yZXNwb25zZUZpZWxkc1sgY3VycmVudCBdICkge1xuXHRcdFx0anFYSFJbIHMucmVzcG9uc2VGaWVsZHNbIGN1cnJlbnQgXSBdID0gcmVzcG9uc2U7XG5cdFx0fVxuXG5cdFx0Ly8gQXBwbHkgdGhlIGRhdGFGaWx0ZXIgaWYgcHJvdmlkZWRcblx0XHRpZiAoICFwcmV2ICYmIGlzU3VjY2VzcyAmJiBzLmRhdGFGaWx0ZXIgKSB7XG5cdFx0XHRyZXNwb25zZSA9IHMuZGF0YUZpbHRlciggcmVzcG9uc2UsIHMuZGF0YVR5cGUgKTtcblx0XHR9XG5cblx0XHRwcmV2ID0gY3VycmVudDtcblx0XHRjdXJyZW50ID0gZGF0YVR5cGVzLnNoaWZ0KCk7XG5cblx0XHRpZiAoIGN1cnJlbnQgKSB7XG5cblx0XHRcdC8vIFRoZXJlJ3Mgb25seSB3b3JrIHRvIGRvIGlmIGN1cnJlbnQgZGF0YVR5cGUgaXMgbm9uLWF1dG9cblx0XHRcdGlmICggY3VycmVudCA9PT0gXCIqXCIgKSB7XG5cblx0XHRcdFx0Y3VycmVudCA9IHByZXY7XG5cblx0XHRcdC8vIENvbnZlcnQgcmVzcG9uc2UgaWYgcHJldiBkYXRhVHlwZSBpcyBub24tYXV0byBhbmQgZGlmZmVycyBmcm9tIGN1cnJlbnRcblx0XHRcdH0gZWxzZSBpZiAoIHByZXYgIT09IFwiKlwiICYmIHByZXYgIT09IGN1cnJlbnQgKSB7XG5cblx0XHRcdFx0Ly8gU2VlayBhIGRpcmVjdCBjb252ZXJ0ZXJcblx0XHRcdFx0Y29udiA9IGNvbnZlcnRlcnNbIHByZXYgKyBcIiBcIiArIGN1cnJlbnQgXSB8fCBjb252ZXJ0ZXJzWyBcIiogXCIgKyBjdXJyZW50IF07XG5cblx0XHRcdFx0Ly8gSWYgbm9uZSBmb3VuZCwgc2VlayBhIHBhaXJcblx0XHRcdFx0aWYgKCAhY29udiApIHtcblx0XHRcdFx0XHRmb3IgKCBjb252MiBpbiBjb252ZXJ0ZXJzICkge1xuXG5cdFx0XHRcdFx0XHQvLyBJZiBjb252MiBvdXRwdXRzIGN1cnJlbnRcblx0XHRcdFx0XHRcdHRtcCA9IGNvbnYyLnNwbGl0KCBcIiBcIiApO1xuXHRcdFx0XHRcdFx0aWYgKCB0bXBbIDEgXSA9PT0gY3VycmVudCApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBJZiBwcmV2IGNhbiBiZSBjb252ZXJ0ZWQgdG8gYWNjZXB0ZWQgaW5wdXRcblx0XHRcdFx0XHRcdFx0Y29udiA9IGNvbnZlcnRlcnNbIHByZXYgKyBcIiBcIiArIHRtcFsgMCBdIF0gfHxcblx0XHRcdFx0XHRcdFx0XHRjb252ZXJ0ZXJzWyBcIiogXCIgKyB0bXBbIDAgXSBdO1xuXHRcdFx0XHRcdFx0XHRpZiAoIGNvbnYgKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBDb25kZW5zZSBlcXVpdmFsZW5jZSBjb252ZXJ0ZXJzXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCBjb252ID09PSB0cnVlICkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29udiA9IGNvbnZlcnRlcnNbIGNvbnYyIF07XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UsIGluc2VydCB0aGUgaW50ZXJtZWRpYXRlIGRhdGFUeXBlXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICggY29udmVydGVyc1sgY29udjIgXSAhPT0gdHJ1ZSApIHtcblx0XHRcdFx0XHRcdFx0XHRcdGN1cnJlbnQgPSB0bXBbIDAgXTtcblx0XHRcdFx0XHRcdFx0XHRcdGRhdGFUeXBlcy51bnNoaWZ0KCB0bXBbIDEgXSApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEFwcGx5IGNvbnZlcnRlciAoaWYgbm90IGFuIGVxdWl2YWxlbmNlKVxuXHRcdFx0XHRpZiAoIGNvbnYgIT09IHRydWUgKSB7XG5cblx0XHRcdFx0XHQvLyBVbmxlc3MgZXJyb3JzIGFyZSBhbGxvd2VkIHRvIGJ1YmJsZSwgY2F0Y2ggYW5kIHJldHVybiB0aGVtXG5cdFx0XHRcdFx0aWYgKCBjb252ICYmIHMudGhyb3dzICkge1xuXHRcdFx0XHRcdFx0cmVzcG9uc2UgPSBjb252KCByZXNwb25zZSApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRyZXNwb25zZSA9IGNvbnYoIHJlc3BvbnNlICk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZTogXCJwYXJzZXJlcnJvclwiLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBjb252ID8gZSA6IFwiTm8gY29udmVyc2lvbiBmcm9tIFwiICsgcHJldiArIFwiIHRvIFwiICsgY3VycmVudFxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB7IHN0YXRlOiBcInN1Y2Nlc3NcIiwgZGF0YTogcmVzcG9uc2UgfTtcbn1cblxualF1ZXJ5LmV4dGVuZCgge1xuXG5cdC8vIENvdW50ZXIgZm9yIGhvbGRpbmcgdGhlIG51bWJlciBvZiBhY3RpdmUgcXVlcmllc1xuXHRhY3RpdmU6IDAsXG5cblx0Ly8gTGFzdC1Nb2RpZmllZCBoZWFkZXIgY2FjaGUgZm9yIG5leHQgcmVxdWVzdFxuXHRsYXN0TW9kaWZpZWQ6IHt9LFxuXHRldGFnOiB7fSxcblxuXHRhamF4U2V0dGluZ3M6IHtcblx0XHR1cmw6IGxvY2F0aW9uLmhyZWYsXG5cdFx0dHlwZTogXCJHRVRcIixcblx0XHRpc0xvY2FsOiBybG9jYWxQcm90b2NvbC50ZXN0KCBsb2NhdGlvbi5wcm90b2NvbCApLFxuXHRcdGdsb2JhbDogdHJ1ZSxcblx0XHRwcm9jZXNzRGF0YTogdHJ1ZSxcblx0XHRhc3luYzogdHJ1ZSxcblx0XHRjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIixcblxuXHRcdC8qXG5cdFx0dGltZW91dDogMCxcblx0XHRkYXRhOiBudWxsLFxuXHRcdGRhdGFUeXBlOiBudWxsLFxuXHRcdHVzZXJuYW1lOiBudWxsLFxuXHRcdHBhc3N3b3JkOiBudWxsLFxuXHRcdGNhY2hlOiBudWxsLFxuXHRcdHRocm93czogZmFsc2UsXG5cdFx0dHJhZGl0aW9uYWw6IGZhbHNlLFxuXHRcdGhlYWRlcnM6IHt9LFxuXHRcdCovXG5cblx0XHRhY2NlcHRzOiB7XG5cdFx0XHRcIipcIjogYWxsVHlwZXMsXG5cdFx0XHR0ZXh0OiBcInRleHQvcGxhaW5cIixcblx0XHRcdGh0bWw6IFwidGV4dC9odG1sXCIsXG5cdFx0XHR4bWw6IFwiYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbFwiLFxuXHRcdFx0anNvbjogXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHRcIlxuXHRcdH0sXG5cblx0XHRjb250ZW50czoge1xuXHRcdFx0eG1sOiAvXFxieG1sXFxiLyxcblx0XHRcdGh0bWw6IC9cXGJodG1sLyxcblx0XHRcdGpzb246IC9cXGJqc29uXFxiL1xuXHRcdH0sXG5cblx0XHRyZXNwb25zZUZpZWxkczoge1xuXHRcdFx0eG1sOiBcInJlc3BvbnNlWE1MXCIsXG5cdFx0XHR0ZXh0OiBcInJlc3BvbnNlVGV4dFwiLFxuXHRcdFx0anNvbjogXCJyZXNwb25zZUpTT05cIlxuXHRcdH0sXG5cblx0XHQvLyBEYXRhIGNvbnZlcnRlcnNcblx0XHQvLyBLZXlzIHNlcGFyYXRlIHNvdXJjZSAob3IgY2F0Y2hhbGwgXCIqXCIpIGFuZCBkZXN0aW5hdGlvbiB0eXBlcyB3aXRoIGEgc2luZ2xlIHNwYWNlXG5cdFx0Y29udmVydGVyczoge1xuXG5cdFx0XHQvLyBDb252ZXJ0IGFueXRoaW5nIHRvIHRleHRcblx0XHRcdFwiKiB0ZXh0XCI6IFN0cmluZyxcblxuXHRcdFx0Ly8gVGV4dCB0byBodG1sICh0cnVlID0gbm8gdHJhbnNmb3JtYXRpb24pXG5cdFx0XHRcInRleHQgaHRtbFwiOiB0cnVlLFxuXG5cdFx0XHQvLyBFdmFsdWF0ZSB0ZXh0IGFzIGEganNvbiBleHByZXNzaW9uXG5cdFx0XHRcInRleHQganNvblwiOiBKU09OLnBhcnNlLFxuXG5cdFx0XHQvLyBQYXJzZSB0ZXh0IGFzIHhtbFxuXHRcdFx0XCJ0ZXh0IHhtbFwiOiBqUXVlcnkucGFyc2VYTUxcblx0XHR9LFxuXG5cdFx0Ly8gRm9yIG9wdGlvbnMgdGhhdCBzaG91bGRuJ3QgYmUgZGVlcCBleHRlbmRlZDpcblx0XHQvLyB5b3UgY2FuIGFkZCB5b3VyIG93biBjdXN0b20gb3B0aW9ucyBoZXJlIGlmXG5cdFx0Ly8gYW5kIHdoZW4geW91IGNyZWF0ZSBvbmUgdGhhdCBzaG91bGRuJ3QgYmVcblx0XHQvLyBkZWVwIGV4dGVuZGVkIChzZWUgYWpheEV4dGVuZClcblx0XHRmbGF0T3B0aW9uczoge1xuXHRcdFx0dXJsOiB0cnVlLFxuXHRcdFx0Y29udGV4dDogdHJ1ZVxuXHRcdH1cblx0fSxcblxuXHQvLyBDcmVhdGVzIGEgZnVsbCBmbGVkZ2VkIHNldHRpbmdzIG9iamVjdCBpbnRvIHRhcmdldFxuXHQvLyB3aXRoIGJvdGggYWpheFNldHRpbmdzIGFuZCBzZXR0aW5ncyBmaWVsZHMuXG5cdC8vIElmIHRhcmdldCBpcyBvbWl0dGVkLCB3cml0ZXMgaW50byBhamF4U2V0dGluZ3MuXG5cdGFqYXhTZXR1cDogZnVuY3Rpb24oIHRhcmdldCwgc2V0dGluZ3MgKSB7XG5cdFx0cmV0dXJuIHNldHRpbmdzID9cblxuXHRcdFx0Ly8gQnVpbGRpbmcgYSBzZXR0aW5ncyBvYmplY3Rcblx0XHRcdGFqYXhFeHRlbmQoIGFqYXhFeHRlbmQoIHRhcmdldCwgalF1ZXJ5LmFqYXhTZXR0aW5ncyApLCBzZXR0aW5ncyApIDpcblxuXHRcdFx0Ly8gRXh0ZW5kaW5nIGFqYXhTZXR0aW5nc1xuXHRcdFx0YWpheEV4dGVuZCggalF1ZXJ5LmFqYXhTZXR0aW5ncywgdGFyZ2V0ICk7XG5cdH0sXG5cblx0YWpheFByZWZpbHRlcjogYWRkVG9QcmVmaWx0ZXJzT3JUcmFuc3BvcnRzKCBwcmVmaWx0ZXJzICksXG5cdGFqYXhUcmFuc3BvcnQ6IGFkZFRvUHJlZmlsdGVyc09yVHJhbnNwb3J0cyggdHJhbnNwb3J0cyApLFxuXG5cdC8vIE1haW4gbWV0aG9kXG5cdGFqYXg6IGZ1bmN0aW9uKCB1cmwsIG9wdGlvbnMgKSB7XG5cblx0XHQvLyBJZiB1cmwgaXMgYW4gb2JqZWN0LCBzaW11bGF0ZSBwcmUtMS41IHNpZ25hdHVyZVxuXHRcdGlmICggdHlwZW9mIHVybCA9PT0gXCJvYmplY3RcIiApIHtcblx0XHRcdG9wdGlvbnMgPSB1cmw7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Ly8gRm9yY2Ugb3B0aW9ucyB0byBiZSBhbiBvYmplY3Rcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdHZhciB0cmFuc3BvcnQsXG5cblx0XHRcdC8vIFVSTCB3aXRob3V0IGFudGktY2FjaGUgcGFyYW1cblx0XHRcdGNhY2hlVVJMLFxuXG5cdFx0XHQvLyBSZXNwb25zZSBoZWFkZXJzXG5cdFx0XHRyZXNwb25zZUhlYWRlcnNTdHJpbmcsXG5cdFx0XHRyZXNwb25zZUhlYWRlcnMsXG5cblx0XHRcdC8vIHRpbWVvdXQgaGFuZGxlXG5cdFx0XHR0aW1lb3V0VGltZXIsXG5cblx0XHRcdC8vIFVybCBjbGVhbnVwIHZhclxuXHRcdFx0dXJsQW5jaG9yLFxuXG5cdFx0XHQvLyBSZXF1ZXN0IHN0YXRlIChiZWNvbWVzIGZhbHNlIHVwb24gc2VuZCBhbmQgdHJ1ZSB1cG9uIGNvbXBsZXRpb24pXG5cdFx0XHRjb21wbGV0ZWQsXG5cblx0XHRcdC8vIFRvIGtub3cgaWYgZ2xvYmFsIGV2ZW50cyBhcmUgdG8gYmUgZGlzcGF0Y2hlZFxuXHRcdFx0ZmlyZUdsb2JhbHMsXG5cblx0XHRcdC8vIExvb3AgdmFyaWFibGVcblx0XHRcdGksXG5cblx0XHRcdC8vIHVuY2FjaGVkIHBhcnQgb2YgdGhlIHVybFxuXHRcdFx0dW5jYWNoZWQsXG5cblx0XHRcdC8vIENyZWF0ZSB0aGUgZmluYWwgb3B0aW9ucyBvYmplY3Rcblx0XHRcdHMgPSBqUXVlcnkuYWpheFNldHVwKCB7fSwgb3B0aW9ucyApLFxuXG5cdFx0XHQvLyBDYWxsYmFja3MgY29udGV4dFxuXHRcdFx0Y2FsbGJhY2tDb250ZXh0ID0gcy5jb250ZXh0IHx8IHMsXG5cblx0XHRcdC8vIENvbnRleHQgZm9yIGdsb2JhbCBldmVudHMgaXMgY2FsbGJhY2tDb250ZXh0IGlmIGl0IGlzIGEgRE9NIG5vZGUgb3IgalF1ZXJ5IGNvbGxlY3Rpb25cblx0XHRcdGdsb2JhbEV2ZW50Q29udGV4dCA9IHMuY29udGV4dCAmJlxuXHRcdFx0XHQoIGNhbGxiYWNrQ29udGV4dC5ub2RlVHlwZSB8fCBjYWxsYmFja0NvbnRleHQuanF1ZXJ5ICkgP1xuXHRcdFx0XHRqUXVlcnkoIGNhbGxiYWNrQ29udGV4dCApIDpcblx0XHRcdFx0alF1ZXJ5LmV2ZW50LFxuXG5cdFx0XHQvLyBEZWZlcnJlZHNcblx0XHRcdGRlZmVycmVkID0galF1ZXJ5LkRlZmVycmVkKCksXG5cdFx0XHRjb21wbGV0ZURlZmVycmVkID0galF1ZXJ5LkNhbGxiYWNrcyggXCJvbmNlIG1lbW9yeVwiICksXG5cblx0XHRcdC8vIFN0YXR1cy1kZXBlbmRlbnQgY2FsbGJhY2tzXG5cdFx0XHRzdGF0dXNDb2RlID0gcy5zdGF0dXNDb2RlIHx8IHt9LFxuXG5cdFx0XHQvLyBIZWFkZXJzICh0aGV5IGFyZSBzZW50IGFsbCBhdCBvbmNlKVxuXHRcdFx0cmVxdWVzdEhlYWRlcnMgPSB7fSxcblx0XHRcdHJlcXVlc3RIZWFkZXJzTmFtZXMgPSB7fSxcblxuXHRcdFx0Ly8gRGVmYXVsdCBhYm9ydCBtZXNzYWdlXG5cdFx0XHRzdHJBYm9ydCA9IFwiY2FuY2VsZWRcIixcblxuXHRcdFx0Ly8gRmFrZSB4aHJcblx0XHRcdGpxWEhSID0ge1xuXHRcdFx0XHRyZWFkeVN0YXRlOiAwLFxuXG5cdFx0XHRcdC8vIEJ1aWxkcyBoZWFkZXJzIGhhc2h0YWJsZSBpZiBuZWVkZWRcblx0XHRcdFx0Z2V0UmVzcG9uc2VIZWFkZXI6IGZ1bmN0aW9uKCBrZXkgKSB7XG5cdFx0XHRcdFx0dmFyIG1hdGNoO1xuXHRcdFx0XHRcdGlmICggY29tcGxldGVkICkge1xuXHRcdFx0XHRcdFx0aWYgKCAhcmVzcG9uc2VIZWFkZXJzICkge1xuXHRcdFx0XHRcdFx0XHRyZXNwb25zZUhlYWRlcnMgPSB7fTtcblx0XHRcdFx0XHRcdFx0d2hpbGUgKCAoIG1hdGNoID0gcmhlYWRlcnMuZXhlYyggcmVzcG9uc2VIZWFkZXJzU3RyaW5nICkgKSApIHtcblx0XHRcdFx0XHRcdFx0XHRyZXNwb25zZUhlYWRlcnNbIG1hdGNoWyAxIF0udG9Mb3dlckNhc2UoKSArIFwiIFwiIF0gPVxuXHRcdFx0XHRcdFx0XHRcdFx0KCByZXNwb25zZUhlYWRlcnNbIG1hdGNoWyAxIF0udG9Mb3dlckNhc2UoKSArIFwiIFwiIF0gfHwgW10gKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQuY29uY2F0KCBtYXRjaFsgMiBdICk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdG1hdGNoID0gcmVzcG9uc2VIZWFkZXJzWyBrZXkudG9Mb3dlckNhc2UoKSArIFwiIFwiIF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBtYXRjaCA9PSBudWxsID8gbnVsbCA6IG1hdGNoLmpvaW4oIFwiLCBcIiApO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8vIFJhdyBzdHJpbmdcblx0XHRcdFx0Z2V0QWxsUmVzcG9uc2VIZWFkZXJzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gY29tcGxldGVkID8gcmVzcG9uc2VIZWFkZXJzU3RyaW5nIDogbnVsbDtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHQvLyBDYWNoZXMgdGhlIGhlYWRlclxuXHRcdFx0XHRzZXRSZXF1ZXN0SGVhZGVyOiBmdW5jdGlvbiggbmFtZSwgdmFsdWUgKSB7XG5cdFx0XHRcdFx0aWYgKCBjb21wbGV0ZWQgPT0gbnVsbCApIHtcblx0XHRcdFx0XHRcdG5hbWUgPSByZXF1ZXN0SGVhZGVyc05hbWVzWyBuYW1lLnRvTG93ZXJDYXNlKCkgXSA9XG5cdFx0XHRcdFx0XHRcdHJlcXVlc3RIZWFkZXJzTmFtZXNbIG5hbWUudG9Mb3dlckNhc2UoKSBdIHx8IG5hbWU7XG5cdFx0XHRcdFx0XHRyZXF1ZXN0SGVhZGVyc1sgbmFtZSBdID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdC8vIE92ZXJyaWRlcyByZXNwb25zZSBjb250ZW50LXR5cGUgaGVhZGVyXG5cdFx0XHRcdG92ZXJyaWRlTWltZVR5cGU6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdFx0XHRcdGlmICggY29tcGxldGVkID09IG51bGwgKSB7XG5cdFx0XHRcdFx0XHRzLm1pbWVUeXBlID0gdHlwZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0Ly8gU3RhdHVzLWRlcGVuZGVudCBjYWxsYmFja3Ncblx0XHRcdFx0c3RhdHVzQ29kZTogZnVuY3Rpb24oIG1hcCApIHtcblx0XHRcdFx0XHR2YXIgY29kZTtcblx0XHRcdFx0XHRpZiAoIG1hcCApIHtcblx0XHRcdFx0XHRcdGlmICggY29tcGxldGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIEV4ZWN1dGUgdGhlIGFwcHJvcHJpYXRlIGNhbGxiYWNrc1xuXHRcdFx0XHRcdFx0XHRqcVhIUi5hbHdheXMoIG1hcFsganFYSFIuc3RhdHVzIF0gKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gTGF6eS1hZGQgdGhlIG5ldyBjYWxsYmFja3MgaW4gYSB3YXkgdGhhdCBwcmVzZXJ2ZXMgb2xkIG9uZXNcblx0XHRcdFx0XHRcdFx0Zm9yICggY29kZSBpbiBtYXAgKSB7XG5cdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZVsgY29kZSBdID0gWyBzdGF0dXNDb2RlWyBjb2RlIF0sIG1hcFsgY29kZSBdIF07XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0Ly8gQ2FuY2VsIHRoZSByZXF1ZXN0XG5cdFx0XHRcdGFib3J0OiBmdW5jdGlvbiggc3RhdHVzVGV4dCApIHtcblx0XHRcdFx0XHR2YXIgZmluYWxUZXh0ID0gc3RhdHVzVGV4dCB8fCBzdHJBYm9ydDtcblx0XHRcdFx0XHRpZiAoIHRyYW5zcG9ydCApIHtcblx0XHRcdFx0XHRcdHRyYW5zcG9ydC5hYm9ydCggZmluYWxUZXh0ICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRvbmUoIDAsIGZpbmFsVGV4dCApO1xuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0Ly8gQXR0YWNoIGRlZmVycmVkc1xuXHRcdGRlZmVycmVkLnByb21pc2UoIGpxWEhSICk7XG5cblx0XHQvLyBBZGQgcHJvdG9jb2wgaWYgbm90IHByb3ZpZGVkIChwcmVmaWx0ZXJzIG1pZ2h0IGV4cGVjdCBpdClcblx0XHQvLyBIYW5kbGUgZmFsc3kgdXJsIGluIHRoZSBzZXR0aW5ncyBvYmplY3QgKHRyYWMtMTAwOTM6IGNvbnNpc3RlbmN5IHdpdGggb2xkIHNpZ25hdHVyZSlcblx0XHQvLyBXZSBhbHNvIHVzZSB0aGUgdXJsIHBhcmFtZXRlciBpZiBhdmFpbGFibGVcblx0XHRzLnVybCA9ICggKCB1cmwgfHwgcy51cmwgfHwgbG9jYXRpb24uaHJlZiApICsgXCJcIiApXG5cdFx0XHQucmVwbGFjZSggcnByb3RvY29sLCBsb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiApO1xuXG5cdFx0Ly8gQWxpYXMgbWV0aG9kIG9wdGlvbiB0byB0eXBlIGFzIHBlciB0aWNrZXQgdHJhYy0xMjAwNFxuXHRcdHMudHlwZSA9IG9wdGlvbnMubWV0aG9kIHx8IG9wdGlvbnMudHlwZSB8fCBzLm1ldGhvZCB8fCBzLnR5cGU7XG5cblx0XHQvLyBFeHRyYWN0IGRhdGFUeXBlcyBsaXN0XG5cdFx0cy5kYXRhVHlwZXMgPSAoIHMuZGF0YVR5cGUgfHwgXCIqXCIgKS50b0xvd2VyQ2FzZSgpLm1hdGNoKCBybm90aHRtbHdoaXRlICkgfHwgWyBcIlwiIF07XG5cblx0XHQvLyBBIGNyb3NzLWRvbWFpbiByZXF1ZXN0IGlzIGluIG9yZGVyIHdoZW4gdGhlIG9yaWdpbiBkb2Vzbid0IG1hdGNoIHRoZSBjdXJyZW50IG9yaWdpbi5cblx0XHRpZiAoIHMuY3Jvc3NEb21haW4gPT0gbnVsbCApIHtcblx0XHRcdHVybEFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwiYVwiICk7XG5cblx0XHRcdC8vIFN1cHBvcnQ6IElFIDw9OCAtIDExLCBFZGdlIDEyIC0gMTVcblx0XHRcdC8vIElFIHRocm93cyBleGNlcHRpb24gb24gYWNjZXNzaW5nIHRoZSBocmVmIHByb3BlcnR5IGlmIHVybCBpcyBtYWxmb3JtZWQsXG5cdFx0XHQvLyBlLmcuIGh0dHA6Ly9leGFtcGxlLmNvbTo4MHgvXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR1cmxBbmNob3IuaHJlZiA9IHMudXJsO1xuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDw9OCAtIDExIG9ubHlcblx0XHRcdFx0Ly8gQW5jaG9yJ3MgaG9zdCBwcm9wZXJ0eSBpc24ndCBjb3JyZWN0bHkgc2V0IHdoZW4gcy51cmwgaXMgcmVsYXRpdmVcblx0XHRcdFx0dXJsQW5jaG9yLmhyZWYgPSB1cmxBbmNob3IuaHJlZjtcblx0XHRcdFx0cy5jcm9zc0RvbWFpbiA9IG9yaWdpbkFuY2hvci5wcm90b2NvbCArIFwiLy9cIiArIG9yaWdpbkFuY2hvci5ob3N0ICE9PVxuXHRcdFx0XHRcdHVybEFuY2hvci5wcm90b2NvbCArIFwiLy9cIiArIHVybEFuY2hvci5ob3N0O1xuXHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cblx0XHRcdFx0Ly8gSWYgdGhlcmUgaXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgVVJMLCBhc3N1bWUgaXQgaXMgY3Jvc3NEb21haW4sXG5cdFx0XHRcdC8vIGl0IGNhbiBiZSByZWplY3RlZCBieSB0aGUgdHJhbnNwb3J0IGlmIGl0IGlzIGludmFsaWRcblx0XHRcdFx0cy5jcm9zc0RvbWFpbiA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gQ29udmVydCBkYXRhIGlmIG5vdCBhbHJlYWR5IGEgc3RyaW5nXG5cdFx0aWYgKCBzLmRhdGEgJiYgcy5wcm9jZXNzRGF0YSAmJiB0eXBlb2Ygcy5kYXRhICE9PSBcInN0cmluZ1wiICkge1xuXHRcdFx0cy5kYXRhID0galF1ZXJ5LnBhcmFtKCBzLmRhdGEsIHMudHJhZGl0aW9uYWwgKTtcblx0XHR9XG5cblx0XHQvLyBBcHBseSBwcmVmaWx0ZXJzXG5cdFx0aW5zcGVjdFByZWZpbHRlcnNPclRyYW5zcG9ydHMoIHByZWZpbHRlcnMsIHMsIG9wdGlvbnMsIGpxWEhSICk7XG5cblx0XHQvLyBJZiByZXF1ZXN0IHdhcyBhYm9ydGVkIGluc2lkZSBhIHByZWZpbHRlciwgc3RvcCB0aGVyZVxuXHRcdGlmICggY29tcGxldGVkICkge1xuXHRcdFx0cmV0dXJuIGpxWEhSO1xuXHRcdH1cblxuXHRcdC8vIFdlIGNhbiBmaXJlIGdsb2JhbCBldmVudHMgYXMgb2Ygbm93IGlmIGFza2VkIHRvXG5cdFx0Ly8gRG9uJ3QgZmlyZSBldmVudHMgaWYgalF1ZXJ5LmV2ZW50IGlzIHVuZGVmaW5lZCBpbiBhbiBBTUQtdXNhZ2Ugc2NlbmFyaW8gKHRyYWMtMTUxMTgpXG5cdFx0ZmlyZUdsb2JhbHMgPSBqUXVlcnkuZXZlbnQgJiYgcy5nbG9iYWw7XG5cblx0XHQvLyBXYXRjaCBmb3IgYSBuZXcgc2V0IG9mIHJlcXVlc3RzXG5cdFx0aWYgKCBmaXJlR2xvYmFscyAmJiBqUXVlcnkuYWN0aXZlKysgPT09IDAgKSB7XG5cdFx0XHRqUXVlcnkuZXZlbnQudHJpZ2dlciggXCJhamF4U3RhcnRcIiApO1xuXHRcdH1cblxuXHRcdC8vIFVwcGVyY2FzZSB0aGUgdHlwZVxuXHRcdHMudHlwZSA9IHMudHlwZS50b1VwcGVyQ2FzZSgpO1xuXG5cdFx0Ly8gRGV0ZXJtaW5lIGlmIHJlcXVlc3QgaGFzIGNvbnRlbnRcblx0XHRzLmhhc0NvbnRlbnQgPSAhcm5vQ29udGVudC50ZXN0KCBzLnR5cGUgKTtcblxuXHRcdC8vIFNhdmUgdGhlIFVSTCBpbiBjYXNlIHdlJ3JlIHRveWluZyB3aXRoIHRoZSBJZi1Nb2RpZmllZC1TaW5jZVxuXHRcdC8vIGFuZC9vciBJZi1Ob25lLU1hdGNoIGhlYWRlciBsYXRlciBvblxuXHRcdC8vIFJlbW92ZSBoYXNoIHRvIHNpbXBsaWZ5IHVybCBtYW5pcHVsYXRpb25cblx0XHRjYWNoZVVSTCA9IHMudXJsLnJlcGxhY2UoIHJoYXNoLCBcIlwiICk7XG5cblx0XHQvLyBNb3JlIG9wdGlvbnMgaGFuZGxpbmcgZm9yIHJlcXVlc3RzIHdpdGggbm8gY29udGVudFxuXHRcdGlmICggIXMuaGFzQ29udGVudCApIHtcblxuXHRcdFx0Ly8gUmVtZW1iZXIgdGhlIGhhc2ggc28gd2UgY2FuIHB1dCBpdCBiYWNrXG5cdFx0XHR1bmNhY2hlZCA9IHMudXJsLnNsaWNlKCBjYWNoZVVSTC5sZW5ndGggKTtcblxuXHRcdFx0Ly8gSWYgZGF0YSBpcyBhdmFpbGFibGUgYW5kIHNob3VsZCBiZSBwcm9jZXNzZWQsIGFwcGVuZCBkYXRhIHRvIHVybFxuXHRcdFx0aWYgKCBzLmRhdGEgJiYgKCBzLnByb2Nlc3NEYXRhIHx8IHR5cGVvZiBzLmRhdGEgPT09IFwic3RyaW5nXCIgKSApIHtcblx0XHRcdFx0Y2FjaGVVUkwgKz0gKCBycXVlcnkudGVzdCggY2FjaGVVUkwgKSA/IFwiJlwiIDogXCI/XCIgKSArIHMuZGF0YTtcblxuXHRcdFx0XHQvLyB0cmFjLTk2ODI6IHJlbW92ZSBkYXRhIHNvIHRoYXQgaXQncyBub3QgdXNlZCBpbiBhbiBldmVudHVhbCByZXRyeVxuXHRcdFx0XHRkZWxldGUgcy5kYXRhO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGQgb3IgdXBkYXRlIGFudGktY2FjaGUgcGFyYW0gaWYgbmVlZGVkXG5cdFx0XHRpZiAoIHMuY2FjaGUgPT09IGZhbHNlICkge1xuXHRcdFx0XHRjYWNoZVVSTCA9IGNhY2hlVVJMLnJlcGxhY2UoIHJhbnRpQ2FjaGUsIFwiJDFcIiApO1xuXHRcdFx0XHR1bmNhY2hlZCA9ICggcnF1ZXJ5LnRlc3QoIGNhY2hlVVJMICkgPyBcIiZcIiA6IFwiP1wiICkgKyBcIl89XCIgKyAoIG5vbmNlLmd1aWQrKyApICtcblx0XHRcdFx0XHR1bmNhY2hlZDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUHV0IGhhc2ggYW5kIGFudGktY2FjaGUgb24gdGhlIFVSTCB0aGF0IHdpbGwgYmUgcmVxdWVzdGVkIChnaC0xNzMyKVxuXHRcdFx0cy51cmwgPSBjYWNoZVVSTCArIHVuY2FjaGVkO1xuXG5cdFx0Ly8gQ2hhbmdlICclMjAnIHRvICcrJyBpZiB0aGlzIGlzIGVuY29kZWQgZm9ybSBib2R5IGNvbnRlbnQgKGdoLTI2NTgpXG5cdFx0fSBlbHNlIGlmICggcy5kYXRhICYmIHMucHJvY2Vzc0RhdGEgJiZcblx0XHRcdCggcy5jb250ZW50VHlwZSB8fCBcIlwiICkuaW5kZXhPZiggXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIiApID09PSAwICkge1xuXHRcdFx0cy5kYXRhID0gcy5kYXRhLnJlcGxhY2UoIHIyMCwgXCIrXCIgKTtcblx0XHR9XG5cblx0XHQvLyBTZXQgdGhlIElmLU1vZGlmaWVkLVNpbmNlIGFuZC9vciBJZi1Ob25lLU1hdGNoIGhlYWRlciwgaWYgaW4gaWZNb2RpZmllZCBtb2RlLlxuXHRcdGlmICggcy5pZk1vZGlmaWVkICkge1xuXHRcdFx0aWYgKCBqUXVlcnkubGFzdE1vZGlmaWVkWyBjYWNoZVVSTCBdICkge1xuXHRcdFx0XHRqcVhIUi5zZXRSZXF1ZXN0SGVhZGVyKCBcIklmLU1vZGlmaWVkLVNpbmNlXCIsIGpRdWVyeS5sYXN0TW9kaWZpZWRbIGNhY2hlVVJMIF0gKTtcblx0XHRcdH1cblx0XHRcdGlmICggalF1ZXJ5LmV0YWdbIGNhY2hlVVJMIF0gKSB7XG5cdFx0XHRcdGpxWEhSLnNldFJlcXVlc3RIZWFkZXIoIFwiSWYtTm9uZS1NYXRjaFwiLCBqUXVlcnkuZXRhZ1sgY2FjaGVVUkwgXSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFNldCB0aGUgY29ycmVjdCBoZWFkZXIsIGlmIGRhdGEgaXMgYmVpbmcgc2VudFxuXHRcdGlmICggcy5kYXRhICYmIHMuaGFzQ29udGVudCAmJiBzLmNvbnRlbnRUeXBlICE9PSBmYWxzZSB8fCBvcHRpb25zLmNvbnRlbnRUeXBlICkge1xuXHRcdFx0anFYSFIuc2V0UmVxdWVzdEhlYWRlciggXCJDb250ZW50LVR5cGVcIiwgcy5jb250ZW50VHlwZSApO1xuXHRcdH1cblxuXHRcdC8vIFNldCB0aGUgQWNjZXB0cyBoZWFkZXIgZm9yIHRoZSBzZXJ2ZXIsIGRlcGVuZGluZyBvbiB0aGUgZGF0YVR5cGVcblx0XHRqcVhIUi5zZXRSZXF1ZXN0SGVhZGVyKFxuXHRcdFx0XCJBY2NlcHRcIixcblx0XHRcdHMuZGF0YVR5cGVzWyAwIF0gJiYgcy5hY2NlcHRzWyBzLmRhdGFUeXBlc1sgMCBdIF0gP1xuXHRcdFx0XHRzLmFjY2VwdHNbIHMuZGF0YVR5cGVzWyAwIF0gXSArXG5cdFx0XHRcdFx0KCBzLmRhdGFUeXBlc1sgMCBdICE9PSBcIipcIiA/IFwiLCBcIiArIGFsbFR5cGVzICsgXCI7IHE9MC4wMVwiIDogXCJcIiApIDpcblx0XHRcdFx0cy5hY2NlcHRzWyBcIipcIiBdXG5cdFx0KTtcblxuXHRcdC8vIENoZWNrIGZvciBoZWFkZXJzIG9wdGlvblxuXHRcdGZvciAoIGkgaW4gcy5oZWFkZXJzICkge1xuXHRcdFx0anFYSFIuc2V0UmVxdWVzdEhlYWRlciggaSwgcy5oZWFkZXJzWyBpIF0gKTtcblx0XHR9XG5cblx0XHQvLyBBbGxvdyBjdXN0b20gaGVhZGVycy9taW1ldHlwZXMgYW5kIGVhcmx5IGFib3J0XG5cdFx0aWYgKCBzLmJlZm9yZVNlbmQgJiZcblx0XHRcdCggcy5iZWZvcmVTZW5kLmNhbGwoIGNhbGxiYWNrQ29udGV4dCwganFYSFIsIHMgKSA9PT0gZmFsc2UgfHwgY29tcGxldGVkICkgKSB7XG5cblx0XHRcdC8vIEFib3J0IGlmIG5vdCBkb25lIGFscmVhZHkgYW5kIHJldHVyblxuXHRcdFx0cmV0dXJuIGpxWEhSLmFib3J0KCk7XG5cdFx0fVxuXG5cdFx0Ly8gQWJvcnRpbmcgaXMgbm8gbG9uZ2VyIGEgY2FuY2VsbGF0aW9uXG5cdFx0c3RyQWJvcnQgPSBcImFib3J0XCI7XG5cblx0XHQvLyBJbnN0YWxsIGNhbGxiYWNrcyBvbiBkZWZlcnJlZHNcblx0XHRjb21wbGV0ZURlZmVycmVkLmFkZCggcy5jb21wbGV0ZSApO1xuXHRcdGpxWEhSLmRvbmUoIHMuc3VjY2VzcyApO1xuXHRcdGpxWEhSLmZhaWwoIHMuZXJyb3IgKTtcblxuXHRcdC8vIEdldCB0cmFuc3BvcnRcblx0XHR0cmFuc3BvcnQgPSBpbnNwZWN0UHJlZmlsdGVyc09yVHJhbnNwb3J0cyggdHJhbnNwb3J0cywgcywgb3B0aW9ucywganFYSFIgKTtcblxuXHRcdC8vIElmIG5vIHRyYW5zcG9ydCwgd2UgYXV0by1hYm9ydFxuXHRcdGlmICggIXRyYW5zcG9ydCApIHtcblx0XHRcdGRvbmUoIC0xLCBcIk5vIFRyYW5zcG9ydFwiICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGpxWEhSLnJlYWR5U3RhdGUgPSAxO1xuXG5cdFx0XHQvLyBTZW5kIGdsb2JhbCBldmVudFxuXHRcdFx0aWYgKCBmaXJlR2xvYmFscyApIHtcblx0XHRcdFx0Z2xvYmFsRXZlbnRDb250ZXh0LnRyaWdnZXIoIFwiYWpheFNlbmRcIiwgWyBqcVhIUiwgcyBdICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHJlcXVlc3Qgd2FzIGFib3J0ZWQgaW5zaWRlIGFqYXhTZW5kLCBzdG9wIHRoZXJlXG5cdFx0XHRpZiAoIGNvbXBsZXRlZCApIHtcblx0XHRcdFx0cmV0dXJuIGpxWEhSO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaW1lb3V0XG5cdFx0XHRpZiAoIHMuYXN5bmMgJiYgcy50aW1lb3V0ID4gMCApIHtcblx0XHRcdFx0dGltZW91dFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGpxWEhSLmFib3J0KCBcInRpbWVvdXRcIiApO1xuXHRcdFx0XHR9LCBzLnRpbWVvdXQgKTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29tcGxldGVkID0gZmFsc2U7XG5cdFx0XHRcdHRyYW5zcG9ydC5zZW5kKCByZXF1ZXN0SGVhZGVycywgZG9uZSApO1xuXHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cblx0XHRcdFx0Ly8gUmV0aHJvdyBwb3N0LWNvbXBsZXRpb24gZXhjZXB0aW9uc1xuXHRcdFx0XHRpZiAoIGNvbXBsZXRlZCApIHtcblx0XHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUHJvcGFnYXRlIG90aGVycyBhcyByZXN1bHRzXG5cdFx0XHRcdGRvbmUoIC0xLCBlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gQ2FsbGJhY2sgZm9yIHdoZW4gZXZlcnl0aGluZyBpcyBkb25lXG5cdFx0ZnVuY3Rpb24gZG9uZSggc3RhdHVzLCBuYXRpdmVTdGF0dXNUZXh0LCByZXNwb25zZXMsIGhlYWRlcnMgKSB7XG5cdFx0XHR2YXIgaXNTdWNjZXNzLCBzdWNjZXNzLCBlcnJvciwgcmVzcG9uc2UsIG1vZGlmaWVkLFxuXHRcdFx0XHRzdGF0dXNUZXh0ID0gbmF0aXZlU3RhdHVzVGV4dDtcblxuXHRcdFx0Ly8gSWdub3JlIHJlcGVhdCBpbnZvY2F0aW9uc1xuXHRcdFx0aWYgKCBjb21wbGV0ZWQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29tcGxldGVkID0gdHJ1ZTtcblxuXHRcdFx0Ly8gQ2xlYXIgdGltZW91dCBpZiBpdCBleGlzdHNcblx0XHRcdGlmICggdGltZW91dFRpbWVyICkge1xuXHRcdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KCB0aW1lb3V0VGltZXIgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRGVyZWZlcmVuY2UgdHJhbnNwb3J0IGZvciBlYXJseSBnYXJiYWdlIGNvbGxlY3Rpb25cblx0XHRcdC8vIChubyBtYXR0ZXIgaG93IGxvbmcgdGhlIGpxWEhSIG9iamVjdCB3aWxsIGJlIHVzZWQpXG5cdFx0XHR0cmFuc3BvcnQgPSB1bmRlZmluZWQ7XG5cblx0XHRcdC8vIENhY2hlIHJlc3BvbnNlIGhlYWRlcnNcblx0XHRcdHJlc3BvbnNlSGVhZGVyc1N0cmluZyA9IGhlYWRlcnMgfHwgXCJcIjtcblxuXHRcdFx0Ly8gU2V0IHJlYWR5U3RhdGVcblx0XHRcdGpxWEhSLnJlYWR5U3RhdGUgPSBzdGF0dXMgPiAwID8gNCA6IDA7XG5cblx0XHRcdC8vIERldGVybWluZSBpZiBzdWNjZXNzZnVsXG5cdFx0XHRpc1N1Y2Nlc3MgPSBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCB8fCBzdGF0dXMgPT09IDMwNDtcblxuXHRcdFx0Ly8gR2V0IHJlc3BvbnNlIGRhdGFcblx0XHRcdGlmICggcmVzcG9uc2VzICkge1xuXHRcdFx0XHRyZXNwb25zZSA9IGFqYXhIYW5kbGVSZXNwb25zZXMoIHMsIGpxWEhSLCByZXNwb25zZXMgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVXNlIGEgbm9vcCBjb252ZXJ0ZXIgZm9yIG1pc3Npbmcgc2NyaXB0IGJ1dCBub3QgaWYganNvbnBcblx0XHRcdGlmICggIWlzU3VjY2VzcyAmJlxuXHRcdFx0XHRqUXVlcnkuaW5BcnJheSggXCJzY3JpcHRcIiwgcy5kYXRhVHlwZXMgKSA+IC0xICYmXG5cdFx0XHRcdGpRdWVyeS5pbkFycmF5KCBcImpzb25cIiwgcy5kYXRhVHlwZXMgKSA8IDAgKSB7XG5cdFx0XHRcdHMuY29udmVydGVyc1sgXCJ0ZXh0IHNjcmlwdFwiIF0gPSBmdW5jdGlvbigpIHt9O1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb252ZXJ0IG5vIG1hdHRlciB3aGF0ICh0aGF0IHdheSByZXNwb25zZVhYWCBmaWVsZHMgYXJlIGFsd2F5cyBzZXQpXG5cdFx0XHRyZXNwb25zZSA9IGFqYXhDb252ZXJ0KCBzLCByZXNwb25zZSwganFYSFIsIGlzU3VjY2VzcyApO1xuXG5cdFx0XHQvLyBJZiBzdWNjZXNzZnVsLCBoYW5kbGUgdHlwZSBjaGFpbmluZ1xuXHRcdFx0aWYgKCBpc1N1Y2Nlc3MgKSB7XG5cblx0XHRcdFx0Ly8gU2V0IHRoZSBJZi1Nb2RpZmllZC1TaW5jZSBhbmQvb3IgSWYtTm9uZS1NYXRjaCBoZWFkZXIsIGlmIGluIGlmTW9kaWZpZWQgbW9kZS5cblx0XHRcdFx0aWYgKCBzLmlmTW9kaWZpZWQgKSB7XG5cdFx0XHRcdFx0bW9kaWZpZWQgPSBqcVhIUi5nZXRSZXNwb25zZUhlYWRlciggXCJMYXN0LU1vZGlmaWVkXCIgKTtcblx0XHRcdFx0XHRpZiAoIG1vZGlmaWVkICkge1xuXHRcdFx0XHRcdFx0alF1ZXJ5Lmxhc3RNb2RpZmllZFsgY2FjaGVVUkwgXSA9IG1vZGlmaWVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRtb2RpZmllZCA9IGpxWEhSLmdldFJlc3BvbnNlSGVhZGVyKCBcImV0YWdcIiApO1xuXHRcdFx0XHRcdGlmICggbW9kaWZpZWQgKSB7XG5cdFx0XHRcdFx0XHRqUXVlcnkuZXRhZ1sgY2FjaGVVUkwgXSA9IG1vZGlmaWVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGlmIG5vIGNvbnRlbnRcblx0XHRcdFx0aWYgKCBzdGF0dXMgPT09IDIwNCB8fCBzLnR5cGUgPT09IFwiSEVBRFwiICkge1xuXHRcdFx0XHRcdHN0YXR1c1RleHQgPSBcIm5vY29udGVudFwiO1xuXG5cdFx0XHRcdC8vIGlmIG5vdCBtb2RpZmllZFxuXHRcdFx0XHR9IGVsc2UgaWYgKCBzdGF0dXMgPT09IDMwNCApIHtcblx0XHRcdFx0XHRzdGF0dXNUZXh0ID0gXCJub3Rtb2RpZmllZFwiO1xuXG5cdFx0XHRcdC8vIElmIHdlIGhhdmUgZGF0YSwgbGV0J3MgY29udmVydCBpdFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN0YXR1c1RleHQgPSByZXNwb25zZS5zdGF0ZTtcblx0XHRcdFx0XHRzdWNjZXNzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRlcnJvciA9IHJlc3BvbnNlLmVycm9yO1xuXHRcdFx0XHRcdGlzU3VjY2VzcyA9ICFlcnJvcjtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBFeHRyYWN0IGVycm9yIGZyb20gc3RhdHVzVGV4dCBhbmQgbm9ybWFsaXplIGZvciBub24tYWJvcnRzXG5cdFx0XHRcdGVycm9yID0gc3RhdHVzVGV4dDtcblx0XHRcdFx0aWYgKCBzdGF0dXMgfHwgIXN0YXR1c1RleHQgKSB7XG5cdFx0XHRcdFx0c3RhdHVzVGV4dCA9IFwiZXJyb3JcIjtcblx0XHRcdFx0XHRpZiAoIHN0YXR1cyA8IDAgKSB7XG5cdFx0XHRcdFx0XHRzdGF0dXMgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgZGF0YSBmb3IgdGhlIGZha2UgeGhyIG9iamVjdFxuXHRcdFx0anFYSFIuc3RhdHVzID0gc3RhdHVzO1xuXHRcdFx0anFYSFIuc3RhdHVzVGV4dCA9ICggbmF0aXZlU3RhdHVzVGV4dCB8fCBzdGF0dXNUZXh0ICkgKyBcIlwiO1xuXG5cdFx0XHQvLyBTdWNjZXNzL0Vycm9yXG5cdFx0XHRpZiAoIGlzU3VjY2VzcyApIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZVdpdGgoIGNhbGxiYWNrQ29udGV4dCwgWyBzdWNjZXNzLCBzdGF0dXNUZXh0LCBqcVhIUiBdICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3RXaXRoKCBjYWxsYmFja0NvbnRleHQsIFsganFYSFIsIHN0YXR1c1RleHQsIGVycm9yIF0gKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RhdHVzLWRlcGVuZGVudCBjYWxsYmFja3Ncblx0XHRcdGpxWEhSLnN0YXR1c0NvZGUoIHN0YXR1c0NvZGUgKTtcblx0XHRcdHN0YXR1c0NvZGUgPSB1bmRlZmluZWQ7XG5cblx0XHRcdGlmICggZmlyZUdsb2JhbHMgKSB7XG5cdFx0XHRcdGdsb2JhbEV2ZW50Q29udGV4dC50cmlnZ2VyKCBpc1N1Y2Nlc3MgPyBcImFqYXhTdWNjZXNzXCIgOiBcImFqYXhFcnJvclwiLFxuXHRcdFx0XHRcdFsganFYSFIsIHMsIGlzU3VjY2VzcyA/IHN1Y2Nlc3MgOiBlcnJvciBdICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbXBsZXRlXG5cdFx0XHRjb21wbGV0ZURlZmVycmVkLmZpcmVXaXRoKCBjYWxsYmFja0NvbnRleHQsIFsganFYSFIsIHN0YXR1c1RleHQgXSApO1xuXG5cdFx0XHRpZiAoIGZpcmVHbG9iYWxzICkge1xuXHRcdFx0XHRnbG9iYWxFdmVudENvbnRleHQudHJpZ2dlciggXCJhamF4Q29tcGxldGVcIiwgWyBqcVhIUiwgcyBdICk7XG5cblx0XHRcdFx0Ly8gSGFuZGxlIHRoZSBnbG9iYWwgQUpBWCBjb3VudGVyXG5cdFx0XHRcdGlmICggISggLS1qUXVlcnkuYWN0aXZlICkgKSB7XG5cdFx0XHRcdFx0alF1ZXJ5LmV2ZW50LnRyaWdnZXIoIFwiYWpheFN0b3BcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGpxWEhSO1xuXHR9LFxuXG5cdGdldEpTT046IGZ1bmN0aW9uKCB1cmwsIGRhdGEsIGNhbGxiYWNrICkge1xuXHRcdHJldHVybiBqUXVlcnkuZ2V0KCB1cmwsIGRhdGEsIGNhbGxiYWNrLCBcImpzb25cIiApO1xuXHR9LFxuXG5cdGdldFNjcmlwdDogZnVuY3Rpb24oIHVybCwgY2FsbGJhY2sgKSB7XG5cdFx0cmV0dXJuIGpRdWVyeS5nZXQoIHVybCwgdW5kZWZpbmVkLCBjYWxsYmFjaywgXCJzY3JpcHRcIiApO1xuXHR9XG59ICk7XG5cbmpRdWVyeS5lYWNoKCBbIFwiZ2V0XCIsIFwicG9zdFwiIF0sIGZ1bmN0aW9uKCBfaSwgbWV0aG9kICkge1xuXHRqUXVlcnlbIG1ldGhvZCBdID0gZnVuY3Rpb24oIHVybCwgZGF0YSwgY2FsbGJhY2ssIHR5cGUgKSB7XG5cblx0XHQvLyBTaGlmdCBhcmd1bWVudHMgaWYgZGF0YSBhcmd1bWVudCB3YXMgb21pdHRlZFxuXHRcdGlmICggaXNGdW5jdGlvbiggZGF0YSApICkge1xuXHRcdFx0dHlwZSA9IHR5cGUgfHwgY2FsbGJhY2s7XG5cdFx0XHRjYWxsYmFjayA9IGRhdGE7XG5cdFx0XHRkYXRhID0gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdC8vIFRoZSB1cmwgY2FuIGJlIGFuIG9wdGlvbnMgb2JqZWN0ICh3aGljaCB0aGVuIG11c3QgaGF2ZSAudXJsKVxuXHRcdHJldHVybiBqUXVlcnkuYWpheCggalF1ZXJ5LmV4dGVuZCgge1xuXHRcdFx0dXJsOiB1cmwsXG5cdFx0XHR0eXBlOiBtZXRob2QsXG5cdFx0XHRkYXRhVHlwZTogdHlwZSxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRzdWNjZXNzOiBjYWxsYmFja1xuXHRcdH0sIGpRdWVyeS5pc1BsYWluT2JqZWN0KCB1cmwgKSAmJiB1cmwgKSApO1xuXHR9O1xufSApO1xuXG5qUXVlcnkuYWpheFByZWZpbHRlciggZnVuY3Rpb24oIHMgKSB7XG5cdHZhciBpO1xuXHRmb3IgKCBpIGluIHMuaGVhZGVycyApIHtcblx0XHRpZiAoIGkudG9Mb3dlckNhc2UoKSA9PT0gXCJjb250ZW50LXR5cGVcIiApIHtcblx0XHRcdHMuY29udGVudFR5cGUgPSBzLmhlYWRlcnNbIGkgXSB8fCBcIlwiO1xuXHRcdH1cblx0fVxufSApO1xuXG5cbmpRdWVyeS5fZXZhbFVybCA9IGZ1bmN0aW9uKCB1cmwsIG9wdGlvbnMsIGRvYyApIHtcblx0cmV0dXJuIGpRdWVyeS5hamF4KCB7XG5cdFx0dXJsOiB1cmwsXG5cblx0XHQvLyBNYWtlIHRoaXMgZXhwbGljaXQsIHNpbmNlIHVzZXIgY2FuIG92ZXJyaWRlIHRoaXMgdGhyb3VnaCBhamF4U2V0dXAgKHRyYWMtMTEyNjQpXG5cdFx0dHlwZTogXCJHRVRcIixcblx0XHRkYXRhVHlwZTogXCJzY3JpcHRcIixcblx0XHRjYWNoZTogdHJ1ZSxcblx0XHRhc3luYzogZmFsc2UsXG5cdFx0Z2xvYmFsOiBmYWxzZSxcblxuXHRcdC8vIE9ubHkgZXZhbHVhdGUgdGhlIHJlc3BvbnNlIGlmIGl0IGlzIHN1Y2Nlc3NmdWwgKGdoLTQxMjYpXG5cdFx0Ly8gZGF0YUZpbHRlciBpcyBub3QgaW52b2tlZCBmb3IgZmFpbHVyZSByZXNwb25zZXMsIHNvIHVzaW5nIGl0IGluc3RlYWRcblx0XHQvLyBvZiB0aGUgZGVmYXVsdCBjb252ZXJ0ZXIgaXMga2x1ZGd5IGJ1dCBpdCB3b3Jrcy5cblx0XHRjb252ZXJ0ZXJzOiB7XG5cdFx0XHRcInRleHQgc2NyaXB0XCI6IGZ1bmN0aW9uKCkge31cblx0XHR9LFxuXHRcdGRhdGFGaWx0ZXI6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcblx0XHRcdGpRdWVyeS5nbG9iYWxFdmFsKCByZXNwb25zZSwgb3B0aW9ucywgZG9jICk7XG5cdFx0fVxuXHR9ICk7XG59O1xuXG5cbmpRdWVyeS5mbi5leHRlbmQoIHtcblx0d3JhcEFsbDogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0dmFyIHdyYXA7XG5cblx0XHRpZiAoIHRoaXNbIDAgXSApIHtcblx0XHRcdGlmICggaXNGdW5jdGlvbiggaHRtbCApICkge1xuXHRcdFx0XHRodG1sID0gaHRtbC5jYWxsKCB0aGlzWyAwIF0gKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVGhlIGVsZW1lbnRzIHRvIHdyYXAgdGhlIHRhcmdldCBhcm91bmRcblx0XHRcdHdyYXAgPSBqUXVlcnkoIGh0bWwsIHRoaXNbIDAgXS5vd25lckRvY3VtZW50ICkuZXEoIDAgKS5jbG9uZSggdHJ1ZSApO1xuXG5cdFx0XHRpZiAoIHRoaXNbIDAgXS5wYXJlbnROb2RlICkge1xuXHRcdFx0XHR3cmFwLmluc2VydEJlZm9yZSggdGhpc1sgMCBdICk7XG5cdFx0XHR9XG5cblx0XHRcdHdyYXAubWFwKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVsZW0gPSB0aGlzO1xuXG5cdFx0XHRcdHdoaWxlICggZWxlbS5maXJzdEVsZW1lbnRDaGlsZCApIHtcblx0XHRcdFx0XHRlbGVtID0gZWxlbS5maXJzdEVsZW1lbnRDaGlsZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBlbGVtO1xuXHRcdFx0fSApLmFwcGVuZCggdGhpcyApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHdyYXBJbm5lcjogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0aWYgKCBpc0Z1bmN0aW9uKCBodG1sICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbiggaSApIHtcblx0XHRcdFx0alF1ZXJ5KCB0aGlzICkud3JhcElubmVyKCBodG1sLmNhbGwoIHRoaXMsIGkgKSApO1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHNlbGYgPSBqUXVlcnkoIHRoaXMgKSxcblx0XHRcdFx0Y29udGVudHMgPSBzZWxmLmNvbnRlbnRzKCk7XG5cblx0XHRcdGlmICggY29udGVudHMubGVuZ3RoICkge1xuXHRcdFx0XHRjb250ZW50cy53cmFwQWxsKCBodG1sICk7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbGYuYXBwZW5kKCBodG1sICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdHdyYXA6IGZ1bmN0aW9uKCBodG1sICkge1xuXHRcdHZhciBodG1sSXNGdW5jdGlvbiA9IGlzRnVuY3Rpb24oIGh0bWwgKTtcblxuXHRcdHJldHVybiB0aGlzLmVhY2goIGZ1bmN0aW9uKCBpICkge1xuXHRcdFx0alF1ZXJ5KCB0aGlzICkud3JhcEFsbCggaHRtbElzRnVuY3Rpb24gPyBodG1sLmNhbGwoIHRoaXMsIGkgKSA6IGh0bWwgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0dW53cmFwOiBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0dGhpcy5wYXJlbnQoIHNlbGVjdG9yICkubm90KCBcImJvZHlcIiApLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0alF1ZXJ5KCB0aGlzICkucmVwbGFjZVdpdGgoIHRoaXMuY2hpbGROb2RlcyApO1xuXHRcdH0gKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSApO1xuXG5cbmpRdWVyeS5leHByLnBzZXVkb3MuaGlkZGVuID0gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdHJldHVybiAhalF1ZXJ5LmV4cHIucHNldWRvcy52aXNpYmxlKCBlbGVtICk7XG59O1xualF1ZXJ5LmV4cHIucHNldWRvcy52aXNpYmxlID0gZnVuY3Rpb24oIGVsZW0gKSB7XG5cdHJldHVybiAhISggZWxlbS5vZmZzZXRXaWR0aCB8fCBlbGVtLm9mZnNldEhlaWdodCB8fCBlbGVtLmdldENsaWVudFJlY3RzKCkubGVuZ3RoICk7XG59O1xuXG5cblxuXG5qUXVlcnkuYWpheFNldHRpbmdzLnhociA9IGZ1bmN0aW9uKCkge1xuXHR0cnkge1xuXHRcdHJldHVybiBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XG5cdH0gY2F0Y2ggKCBlICkge31cbn07XG5cbnZhciB4aHJTdWNjZXNzU3RhdHVzID0ge1xuXG5cdFx0Ly8gRmlsZSBwcm90b2NvbCBhbHdheXMgeWllbGRzIHN0YXR1cyBjb2RlIDAsIGFzc3VtZSAyMDBcblx0XHQwOiAyMDAsXG5cblx0XHQvLyBTdXBwb3J0OiBJRSA8PTkgb25seVxuXHRcdC8vIHRyYWMtMTQ1MDogc29tZXRpbWVzIElFIHJldHVybnMgMTIyMyB3aGVuIGl0IHNob3VsZCBiZSAyMDRcblx0XHQxMjIzOiAyMDRcblx0fSxcblx0eGhyU3VwcG9ydGVkID0galF1ZXJ5LmFqYXhTZXR0aW5ncy54aHIoKTtcblxuc3VwcG9ydC5jb3JzID0gISF4aHJTdXBwb3J0ZWQgJiYgKCBcIndpdGhDcmVkZW50aWFsc1wiIGluIHhoclN1cHBvcnRlZCApO1xuc3VwcG9ydC5hamF4ID0geGhyU3VwcG9ydGVkID0gISF4aHJTdXBwb3J0ZWQ7XG5cbmpRdWVyeS5hamF4VHJhbnNwb3J0KCBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0dmFyIGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrO1xuXG5cdC8vIENyb3NzIGRvbWFpbiBvbmx5IGFsbG93ZWQgaWYgc3VwcG9ydGVkIHRocm91Z2ggWE1MSHR0cFJlcXVlc3Rcblx0aWYgKCBzdXBwb3J0LmNvcnMgfHwgeGhyU3VwcG9ydGVkICYmICFvcHRpb25zLmNyb3NzRG9tYWluICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZW5kOiBmdW5jdGlvbiggaGVhZGVycywgY29tcGxldGUgKSB7XG5cdFx0XHRcdHZhciBpLFxuXHRcdFx0XHRcdHhociA9IG9wdGlvbnMueGhyKCk7XG5cblx0XHRcdFx0eGhyLm9wZW4oXG5cdFx0XHRcdFx0b3B0aW9ucy50eXBlLFxuXHRcdFx0XHRcdG9wdGlvbnMudXJsLFxuXHRcdFx0XHRcdG9wdGlvbnMuYXN5bmMsXG5cdFx0XHRcdFx0b3B0aW9ucy51c2VybmFtZSxcblx0XHRcdFx0XHRvcHRpb25zLnBhc3N3b3JkXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0Ly8gQXBwbHkgY3VzdG9tIGZpZWxkcyBpZiBwcm92aWRlZFxuXHRcdFx0XHRpZiAoIG9wdGlvbnMueGhyRmllbGRzICkge1xuXHRcdFx0XHRcdGZvciAoIGkgaW4gb3B0aW9ucy54aHJGaWVsZHMgKSB7XG5cdFx0XHRcdFx0XHR4aHJbIGkgXSA9IG9wdGlvbnMueGhyRmllbGRzWyBpIF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gT3ZlcnJpZGUgbWltZSB0eXBlIGlmIG5lZWRlZFxuXHRcdFx0XHRpZiAoIG9wdGlvbnMubWltZVR5cGUgJiYgeGhyLm92ZXJyaWRlTWltZVR5cGUgKSB7XG5cdFx0XHRcdFx0eGhyLm92ZXJyaWRlTWltZVR5cGUoIG9wdGlvbnMubWltZVR5cGUgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFgtUmVxdWVzdGVkLVdpdGggaGVhZGVyXG5cdFx0XHRcdC8vIEZvciBjcm9zcy1kb21haW4gcmVxdWVzdHMsIHNlZWluZyBhcyBjb25kaXRpb25zIGZvciBhIHByZWZsaWdodCBhcmVcblx0XHRcdFx0Ly8gYWtpbiB0byBhIGppZ3NhdyBwdXp6bGUsIHdlIHNpbXBseSBuZXZlciBzZXQgaXQgdG8gYmUgc3VyZS5cblx0XHRcdFx0Ly8gKGl0IGNhbiBhbHdheXMgYmUgc2V0IG9uIGEgcGVyLXJlcXVlc3QgYmFzaXMgb3IgZXZlbiB1c2luZyBhamF4U2V0dXApXG5cdFx0XHRcdC8vIEZvciBzYW1lLWRvbWFpbiByZXF1ZXN0cywgd29uJ3QgY2hhbmdlIGhlYWRlciBpZiBhbHJlYWR5IHByb3ZpZGVkLlxuXHRcdFx0XHRpZiAoICFvcHRpb25zLmNyb3NzRG9tYWluICYmICFoZWFkZXJzWyBcIlgtUmVxdWVzdGVkLVdpdGhcIiBdICkge1xuXHRcdFx0XHRcdGhlYWRlcnNbIFwiWC1SZXF1ZXN0ZWQtV2l0aFwiIF0gPSBcIlhNTEh0dHBSZXF1ZXN0XCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBTZXQgaGVhZGVyc1xuXHRcdFx0XHRmb3IgKCBpIGluIGhlYWRlcnMgKSB7XG5cdFx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoIGksIGhlYWRlcnNbIGkgXSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQ2FsbGJhY2tcblx0XHRcdFx0Y2FsbGJhY2sgPSBmdW5jdGlvbiggdHlwZSApIHtcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoIGNhbGxiYWNrICkge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjayA9IGVycm9yQ2FsbGJhY2sgPSB4aHIub25sb2FkID1cblx0XHRcdFx0XHRcdFx0XHR4aHIub25lcnJvciA9IHhoci5vbmFib3J0ID0geGhyLm9udGltZW91dCA9XG5cdFx0XHRcdFx0XHRcdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIHR5cGUgPT09IFwiYWJvcnRcIiApIHtcblx0XHRcdFx0XHRcdFx0XHR4aHIuYWJvcnQoKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICggdHlwZSA9PT0gXCJlcnJvclwiICkge1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gU3VwcG9ydDogSUUgPD05IG9ubHlcblx0XHRcdFx0XHRcdFx0XHQvLyBPbiBhIG1hbnVhbCBuYXRpdmUgYWJvcnQsIElFOSB0aHJvd3Ncblx0XHRcdFx0XHRcdFx0XHQvLyBlcnJvcnMgb24gYW55IHByb3BlcnR5IGFjY2VzcyB0aGF0IGlzIG5vdCByZWFkeVN0YXRlXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCB0eXBlb2YgeGhyLnN0YXR1cyAhPT0gXCJudW1iZXJcIiApIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbXBsZXRlKCAwLCBcImVycm9yXCIgKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29tcGxldGUoXG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gRmlsZTogcHJvdG9jb2wgYWx3YXlzIHlpZWxkcyBzdGF0dXMgMDsgc2VlIHRyYWMtODYwNSwgdHJhYy0xNDIwN1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR4aHIuc3RhdHVzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR4aHIuc3RhdHVzVGV4dFxuXHRcdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29tcGxldGUoXG5cdFx0XHRcdFx0XHRcdFx0XHR4aHJTdWNjZXNzU3RhdHVzWyB4aHIuc3RhdHVzIF0gfHwgeGhyLnN0YXR1cyxcblx0XHRcdFx0XHRcdFx0XHRcdHhoci5zdGF0dXNUZXh0LFxuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBTdXBwb3J0OiBJRSA8PTkgb25seVxuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gSUU5IGhhcyBubyBYSFIyIGJ1dCB0aHJvd3Mgb24gYmluYXJ5ICh0cmFjLTExNDI2KVxuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gRm9yIFhIUjIgbm9uLXRleHQsIGxldCB0aGUgY2FsbGVyIGhhbmRsZSBpdCAoZ2gtMjQ5OClcblx0XHRcdFx0XHRcdFx0XHRcdCggeGhyLnJlc3BvbnNlVHlwZSB8fCBcInRleHRcIiApICE9PSBcInRleHRcIiAgfHxcblx0XHRcdFx0XHRcdFx0XHRcdHR5cGVvZiB4aHIucmVzcG9uc2VUZXh0ICE9PSBcInN0cmluZ1wiID9cblx0XHRcdFx0XHRcdFx0XHRcdFx0eyBiaW5hcnk6IHhoci5yZXNwb25zZSB9IDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0eyB0ZXh0OiB4aHIucmVzcG9uc2VUZXh0IH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKClcblx0XHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvLyBMaXN0ZW4gdG8gZXZlbnRzXG5cdFx0XHRcdHhoci5vbmxvYWQgPSBjYWxsYmFjaygpO1xuXHRcdFx0XHRlcnJvckNhbGxiYWNrID0geGhyLm9uZXJyb3IgPSB4aHIub250aW1lb3V0ID0gY2FsbGJhY2soIFwiZXJyb3JcIiApO1xuXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IElFIDkgb25seVxuXHRcdFx0XHQvLyBVc2Ugb25yZWFkeXN0YXRlY2hhbmdlIHRvIHJlcGxhY2Ugb25hYm9ydFxuXHRcdFx0XHQvLyB0byBoYW5kbGUgdW5jYXVnaHQgYWJvcnRzXG5cdFx0XHRcdGlmICggeGhyLm9uYWJvcnQgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHR4aHIub25hYm9ydCA9IGVycm9yQ2FsbGJhY2s7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0XHQvLyBDaGVjayByZWFkeVN0YXRlIGJlZm9yZSB0aW1lb3V0IGFzIGl0IGNoYW5nZXNcblx0XHRcdFx0XHRcdGlmICggeGhyLnJlYWR5U3RhdGUgPT09IDQgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gQWxsb3cgb25lcnJvciB0byBiZSBjYWxsZWQgZmlyc3QsXG5cdFx0XHRcdFx0XHRcdC8vIGJ1dCB0aGF0IHdpbGwgbm90IGhhbmRsZSBhIG5hdGl2ZSBhYm9ydFxuXHRcdFx0XHRcdFx0XHQvLyBBbHNvLCBzYXZlIGVycm9yQ2FsbGJhY2sgdG8gYSB2YXJpYWJsZVxuXHRcdFx0XHRcdFx0XHQvLyBhcyB4aHIub25lcnJvciBjYW5ub3QgYmUgYWNjZXNzZWRcblx0XHRcdFx0XHRcdFx0d2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnJvckNhbGxiYWNrKCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENyZWF0ZSB0aGUgYWJvcnQgY2FsbGJhY2tcblx0XHRcdFx0Y2FsbGJhY2sgPSBjYWxsYmFjayggXCJhYm9ydFwiICk7XG5cblx0XHRcdFx0dHJ5IHtcblxuXHRcdFx0XHRcdC8vIERvIHNlbmQgdGhlIHJlcXVlc3QgKHRoaXMgbWF5IHJhaXNlIGFuIGV4Y2VwdGlvbilcblx0XHRcdFx0XHR4aHIuc2VuZCggb3B0aW9ucy5oYXNDb250ZW50ICYmIG9wdGlvbnMuZGF0YSB8fCBudWxsICk7XG5cdFx0XHRcdH0gY2F0Y2ggKCBlICkge1xuXG5cdFx0XHRcdFx0Ly8gdHJhYy0xNDY4MzogT25seSByZXRocm93IGlmIHRoaXMgaGFzbid0IGJlZW4gbm90aWZpZWQgYXMgYW4gZXJyb3IgeWV0XG5cdFx0XHRcdFx0aWYgKCBjYWxsYmFjayApIHtcblx0XHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRhYm9ydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn0gKTtcblxuXG5cblxuLy8gUHJldmVudCBhdXRvLWV4ZWN1dGlvbiBvZiBzY3JpcHRzIHdoZW4gbm8gZXhwbGljaXQgZGF0YVR5cGUgd2FzIHByb3ZpZGVkIChTZWUgZ2gtMjQzMilcbmpRdWVyeS5hamF4UHJlZmlsdGVyKCBmdW5jdGlvbiggcyApIHtcblx0aWYgKCBzLmNyb3NzRG9tYWluICkge1xuXHRcdHMuY29udGVudHMuc2NyaXB0ID0gZmFsc2U7XG5cdH1cbn0gKTtcblxuLy8gSW5zdGFsbCBzY3JpcHQgZGF0YVR5cGVcbmpRdWVyeS5hamF4U2V0dXAoIHtcblx0YWNjZXB0czoge1xuXHRcdHNjcmlwdDogXCJ0ZXh0L2phdmFzY3JpcHQsIGFwcGxpY2F0aW9uL2phdmFzY3JpcHQsIFwiICtcblx0XHRcdFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdCwgYXBwbGljYXRpb24veC1lY21hc2NyaXB0XCJcblx0fSxcblx0Y29udGVudHM6IHtcblx0XHRzY3JpcHQ6IC9cXGIoPzpqYXZhfGVjbWEpc2NyaXB0XFxiL1xuXHR9LFxuXHRjb252ZXJ0ZXJzOiB7XG5cdFx0XCJ0ZXh0IHNjcmlwdFwiOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRcdGpRdWVyeS5nbG9iYWxFdmFsKCB0ZXh0ICk7XG5cdFx0XHRyZXR1cm4gdGV4dDtcblx0XHR9XG5cdH1cbn0gKTtcblxuLy8gSGFuZGxlIGNhY2hlJ3Mgc3BlY2lhbCBjYXNlIGFuZCBjcm9zc0RvbWFpblxualF1ZXJ5LmFqYXhQcmVmaWx0ZXIoIFwic2NyaXB0XCIsIGZ1bmN0aW9uKCBzICkge1xuXHRpZiAoIHMuY2FjaGUgPT09IHVuZGVmaW5lZCApIHtcblx0XHRzLmNhY2hlID0gZmFsc2U7XG5cdH1cblx0aWYgKCBzLmNyb3NzRG9tYWluICkge1xuXHRcdHMudHlwZSA9IFwiR0VUXCI7XG5cdH1cbn0gKTtcblxuLy8gQmluZCBzY3JpcHQgdGFnIGhhY2sgdHJhbnNwb3J0XG5qUXVlcnkuYWpheFRyYW5zcG9ydCggXCJzY3JpcHRcIiwgZnVuY3Rpb24oIHMgKSB7XG5cblx0Ly8gVGhpcyB0cmFuc3BvcnQgb25seSBkZWFscyB3aXRoIGNyb3NzIGRvbWFpbiBvciBmb3JjZWQtYnktYXR0cnMgcmVxdWVzdHNcblx0aWYgKCBzLmNyb3NzRG9tYWluIHx8IHMuc2NyaXB0QXR0cnMgKSB7XG5cdFx0dmFyIHNjcmlwdCwgY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbmQ6IGZ1bmN0aW9uKCBfLCBjb21wbGV0ZSApIHtcblx0XHRcdFx0c2NyaXB0ID0galF1ZXJ5KCBcIjxzY3JpcHQ+XCIgKVxuXHRcdFx0XHRcdC5hdHRyKCBzLnNjcmlwdEF0dHJzIHx8IHt9IClcblx0XHRcdFx0XHQucHJvcCggeyBjaGFyc2V0OiBzLnNjcmlwdENoYXJzZXQsIHNyYzogcy51cmwgfSApXG5cdFx0XHRcdFx0Lm9uKCBcImxvYWQgZXJyb3JcIiwgY2FsbGJhY2sgPSBmdW5jdGlvbiggZXZ0ICkge1xuXHRcdFx0XHRcdFx0c2NyaXB0LnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2sgPSBudWxsO1xuXHRcdFx0XHRcdFx0aWYgKCBldnQgKSB7XG5cdFx0XHRcdFx0XHRcdGNvbXBsZXRlKCBldnQudHlwZSA9PT0gXCJlcnJvclwiID8gNDA0IDogMjAwLCBldnQudHlwZSApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHQvLyBVc2UgbmF0aXZlIERPTSBtYW5pcHVsYXRpb24gdG8gYXZvaWQgb3VyIGRvbU1hbmlwIEFKQVggdHJpY2tlcnlcblx0XHRcdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCggc2NyaXB0WyAwIF0gKTtcblx0XHRcdH0sXG5cdFx0XHRhYm9ydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn0gKTtcblxuXG5cblxudmFyIG9sZENhbGxiYWNrcyA9IFtdLFxuXHRyanNvbnAgPSAvKD0pXFw/KD89JnwkKXxcXD9cXD8vO1xuXG4vLyBEZWZhdWx0IGpzb25wIHNldHRpbmdzXG5qUXVlcnkuYWpheFNldHVwKCB7XG5cdGpzb25wOiBcImNhbGxiYWNrXCIsXG5cdGpzb25wQ2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjYWxsYmFjayA9IG9sZENhbGxiYWNrcy5wb3AoKSB8fCAoIGpRdWVyeS5leHBhbmRvICsgXCJfXCIgKyAoIG5vbmNlLmd1aWQrKyApICk7XG5cdFx0dGhpc1sgY2FsbGJhY2sgXSA9IHRydWU7XG5cdFx0cmV0dXJuIGNhbGxiYWNrO1xuXHR9XG59ICk7XG5cbi8vIERldGVjdCwgbm9ybWFsaXplIG9wdGlvbnMgYW5kIGluc3RhbGwgY2FsbGJhY2tzIGZvciBqc29ucCByZXF1ZXN0c1xualF1ZXJ5LmFqYXhQcmVmaWx0ZXIoIFwianNvbiBqc29ucFwiLCBmdW5jdGlvbiggcywgb3JpZ2luYWxTZXR0aW5ncywganFYSFIgKSB7XG5cblx0dmFyIGNhbGxiYWNrTmFtZSwgb3ZlcndyaXR0ZW4sIHJlc3BvbnNlQ29udGFpbmVyLFxuXHRcdGpzb25Qcm9wID0gcy5qc29ucCAhPT0gZmFsc2UgJiYgKCByanNvbnAudGVzdCggcy51cmwgKSA/XG5cdFx0XHRcInVybFwiIDpcblx0XHRcdHR5cGVvZiBzLmRhdGEgPT09IFwic3RyaW5nXCIgJiZcblx0XHRcdFx0KCBzLmNvbnRlbnRUeXBlIHx8IFwiXCIgKVxuXHRcdFx0XHRcdC5pbmRleE9mKCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiICkgPT09IDAgJiZcblx0XHRcdFx0cmpzb25wLnRlc3QoIHMuZGF0YSApICYmIFwiZGF0YVwiXG5cdFx0KTtcblxuXHQvLyBIYW5kbGUgaWZmIHRoZSBleHBlY3RlZCBkYXRhIHR5cGUgaXMgXCJqc29ucFwiIG9yIHdlIGhhdmUgYSBwYXJhbWV0ZXIgdG8gc2V0XG5cdGlmICgganNvblByb3AgfHwgcy5kYXRhVHlwZXNbIDAgXSA9PT0gXCJqc29ucFwiICkge1xuXG5cdFx0Ly8gR2V0IGNhbGxiYWNrIG5hbWUsIHJlbWVtYmVyaW5nIHByZWV4aXN0aW5nIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCBpdFxuXHRcdGNhbGxiYWNrTmFtZSA9IHMuanNvbnBDYWxsYmFjayA9IGlzRnVuY3Rpb24oIHMuanNvbnBDYWxsYmFjayApID9cblx0XHRcdHMuanNvbnBDYWxsYmFjaygpIDpcblx0XHRcdHMuanNvbnBDYWxsYmFjaztcblxuXHRcdC8vIEluc2VydCBjYWxsYmFjayBpbnRvIHVybCBvciBmb3JtIGRhdGFcblx0XHRpZiAoIGpzb25Qcm9wICkge1xuXHRcdFx0c1sganNvblByb3AgXSA9IHNbIGpzb25Qcm9wIF0ucmVwbGFjZSggcmpzb25wLCBcIiQxXCIgKyBjYWxsYmFja05hbWUgKTtcblx0XHR9IGVsc2UgaWYgKCBzLmpzb25wICE9PSBmYWxzZSApIHtcblx0XHRcdHMudXJsICs9ICggcnF1ZXJ5LnRlc3QoIHMudXJsICkgPyBcIiZcIiA6IFwiP1wiICkgKyBzLmpzb25wICsgXCI9XCIgKyBjYWxsYmFja05hbWU7XG5cdFx0fVxuXG5cdFx0Ly8gVXNlIGRhdGEgY29udmVydGVyIHRvIHJldHJpZXZlIGpzb24gYWZ0ZXIgc2NyaXB0IGV4ZWN1dGlvblxuXHRcdHMuY29udmVydGVyc1sgXCJzY3JpcHQganNvblwiIF0gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggIXJlc3BvbnNlQ29udGFpbmVyICkge1xuXHRcdFx0XHRqUXVlcnkuZXJyb3IoIGNhbGxiYWNrTmFtZSArIFwiIHdhcyBub3QgY2FsbGVkXCIgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZXNwb25zZUNvbnRhaW5lclsgMCBdO1xuXHRcdH07XG5cblx0XHQvLyBGb3JjZSBqc29uIGRhdGFUeXBlXG5cdFx0cy5kYXRhVHlwZXNbIDAgXSA9IFwianNvblwiO1xuXG5cdFx0Ly8gSW5zdGFsbCBjYWxsYmFja1xuXHRcdG92ZXJ3cml0dGVuID0gd2luZG93WyBjYWxsYmFja05hbWUgXTtcblx0XHR3aW5kb3dbIGNhbGxiYWNrTmFtZSBdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXNwb25zZUNvbnRhaW5lciA9IGFyZ3VtZW50cztcblx0XHR9O1xuXG5cdFx0Ly8gQ2xlYW4tdXAgZnVuY3Rpb24gKGZpcmVzIGFmdGVyIGNvbnZlcnRlcnMpXG5cdFx0anFYSFIuYWx3YXlzKCBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gSWYgcHJldmlvdXMgdmFsdWUgZGlkbid0IGV4aXN0IC0gcmVtb3ZlIGl0XG5cdFx0XHRpZiAoIG92ZXJ3cml0dGVuID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdGpRdWVyeSggd2luZG93ICkucmVtb3ZlUHJvcCggY2FsbGJhY2tOYW1lICk7XG5cblx0XHRcdC8vIE90aGVyd2lzZSByZXN0b3JlIHByZWV4aXN0aW5nIHZhbHVlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3aW5kb3dbIGNhbGxiYWNrTmFtZSBdID0gb3ZlcndyaXR0ZW47XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNhdmUgYmFjayBhcyBmcmVlXG5cdFx0XHRpZiAoIHNbIGNhbGxiYWNrTmFtZSBdICkge1xuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHJlLXVzaW5nIHRoZSBvcHRpb25zIGRvZXNuJ3Qgc2NyZXcgdGhpbmdzIGFyb3VuZFxuXHRcdFx0XHRzLmpzb25wQ2FsbGJhY2sgPSBvcmlnaW5hbFNldHRpbmdzLmpzb25wQ2FsbGJhY2s7XG5cblx0XHRcdFx0Ly8gU2F2ZSB0aGUgY2FsbGJhY2sgbmFtZSBmb3IgZnV0dXJlIHVzZVxuXHRcdFx0XHRvbGRDYWxsYmFja3MucHVzaCggY2FsbGJhY2tOYW1lICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhbGwgaWYgaXQgd2FzIGEgZnVuY3Rpb24gYW5kIHdlIGhhdmUgYSByZXNwb25zZVxuXHRcdFx0aWYgKCByZXNwb25zZUNvbnRhaW5lciAmJiBpc0Z1bmN0aW9uKCBvdmVyd3JpdHRlbiApICkge1xuXHRcdFx0XHRvdmVyd3JpdHRlbiggcmVzcG9uc2VDb250YWluZXJbIDAgXSApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNwb25zZUNvbnRhaW5lciA9IG92ZXJ3cml0dGVuID0gdW5kZWZpbmVkO1xuXHRcdH0gKTtcblxuXHRcdC8vIERlbGVnYXRlIHRvIHNjcmlwdFxuXHRcdHJldHVybiBcInNjcmlwdFwiO1xuXHR9XG59ICk7XG5cblxuXG5cbi8vIFN1cHBvcnQ6IFNhZmFyaSA4IG9ubHlcbi8vIEluIFNhZmFyaSA4IGRvY3VtZW50cyBjcmVhdGVkIHZpYSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnRcbi8vIGNvbGxhcHNlIHNpYmxpbmcgZm9ybXM6IHRoZSBzZWNvbmQgb25lIGJlY29tZXMgYSBjaGlsZCBvZiB0aGUgZmlyc3Qgb25lLlxuLy8gQmVjYXVzZSBvZiB0aGF0LCB0aGlzIHNlY3VyaXR5IG1lYXN1cmUgaGFzIHRvIGJlIGRpc2FibGVkIGluIFNhZmFyaSA4LlxuLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTEzNzMzN1xuc3VwcG9ydC5jcmVhdGVIVE1MRG9jdW1lbnQgPSAoIGZ1bmN0aW9uKCkge1xuXHR2YXIgYm9keSA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCggXCJcIiApLmJvZHk7XG5cdGJvZHkuaW5uZXJIVE1MID0gXCI8Zm9ybT48L2Zvcm0+PGZvcm0+PC9mb3JtPlwiO1xuXHRyZXR1cm4gYm9keS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMjtcbn0gKSgpO1xuXG5cbi8vIEFyZ3VtZW50IFwiZGF0YVwiIHNob3VsZCBiZSBzdHJpbmcgb2YgaHRtbFxuLy8gY29udGV4dCAob3B0aW9uYWwpOiBJZiBzcGVjaWZpZWQsIHRoZSBmcmFnbWVudCB3aWxsIGJlIGNyZWF0ZWQgaW4gdGhpcyBjb250ZXh0LFxuLy8gZGVmYXVsdHMgdG8gZG9jdW1lbnRcbi8vIGtlZXBTY3JpcHRzIChvcHRpb25hbCk6IElmIHRydWUsIHdpbGwgaW5jbHVkZSBzY3JpcHRzIHBhc3NlZCBpbiB0aGUgaHRtbCBzdHJpbmdcbmpRdWVyeS5wYXJzZUhUTUwgPSBmdW5jdGlvbiggZGF0YSwgY29udGV4dCwga2VlcFNjcmlwdHMgKSB7XG5cdGlmICggdHlwZW9mIGRhdGEgIT09IFwic3RyaW5nXCIgKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdGlmICggdHlwZW9mIGNvbnRleHQgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdGtlZXBTY3JpcHRzID0gY29udGV4dDtcblx0XHRjb250ZXh0ID0gZmFsc2U7XG5cdH1cblxuXHR2YXIgYmFzZSwgcGFyc2VkLCBzY3JpcHRzO1xuXG5cdGlmICggIWNvbnRleHQgKSB7XG5cblx0XHQvLyBTdG9wIHNjcmlwdHMgb3IgaW5saW5lIGV2ZW50IGhhbmRsZXJzIGZyb20gYmVpbmcgZXhlY3V0ZWQgaW1tZWRpYXRlbHlcblx0XHQvLyBieSB1c2luZyBkb2N1bWVudC5pbXBsZW1lbnRhdGlvblxuXHRcdGlmICggc3VwcG9ydC5jcmVhdGVIVE1MRG9jdW1lbnQgKSB7XG5cdFx0XHRjb250ZXh0ID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCBcIlwiICk7XG5cblx0XHRcdC8vIFNldCB0aGUgYmFzZSBocmVmIGZvciB0aGUgY3JlYXRlZCBkb2N1bWVudFxuXHRcdFx0Ly8gc28gYW55IHBhcnNlZCBlbGVtZW50cyB3aXRoIFVSTHNcblx0XHRcdC8vIGFyZSBiYXNlZCBvbiB0aGUgZG9jdW1lbnQncyBVUkwgKGdoLTI5NjUpXG5cdFx0XHRiYXNlID0gY29udGV4dC5jcmVhdGVFbGVtZW50KCBcImJhc2VcIiApO1xuXHRcdFx0YmFzZS5ocmVmID0gZG9jdW1lbnQubG9jYXRpb24uaHJlZjtcblx0XHRcdGNvbnRleHQuaGVhZC5hcHBlbmRDaGlsZCggYmFzZSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb250ZXh0ID0gZG9jdW1lbnQ7XG5cdFx0fVxuXHR9XG5cblx0cGFyc2VkID0gcnNpbmdsZVRhZy5leGVjKCBkYXRhICk7XG5cdHNjcmlwdHMgPSAha2VlcFNjcmlwdHMgJiYgW107XG5cblx0Ly8gU2luZ2xlIHRhZ1xuXHRpZiAoIHBhcnNlZCApIHtcblx0XHRyZXR1cm4gWyBjb250ZXh0LmNyZWF0ZUVsZW1lbnQoIHBhcnNlZFsgMSBdICkgXTtcblx0fVxuXG5cdHBhcnNlZCA9IGJ1aWxkRnJhZ21lbnQoIFsgZGF0YSBdLCBjb250ZXh0LCBzY3JpcHRzICk7XG5cblx0aWYgKCBzY3JpcHRzICYmIHNjcmlwdHMubGVuZ3RoICkge1xuXHRcdGpRdWVyeSggc2NyaXB0cyApLnJlbW92ZSgpO1xuXHR9XG5cblx0cmV0dXJuIGpRdWVyeS5tZXJnZSggW10sIHBhcnNlZC5jaGlsZE5vZGVzICk7XG59O1xuXG5cbi8qKlxuICogTG9hZCBhIHVybCBpbnRvIGEgcGFnZVxuICovXG5qUXVlcnkuZm4ubG9hZCA9IGZ1bmN0aW9uKCB1cmwsIHBhcmFtcywgY2FsbGJhY2sgKSB7XG5cdHZhciBzZWxlY3RvciwgdHlwZSwgcmVzcG9uc2UsXG5cdFx0c2VsZiA9IHRoaXMsXG5cdFx0b2ZmID0gdXJsLmluZGV4T2YoIFwiIFwiICk7XG5cblx0aWYgKCBvZmYgPiAtMSApIHtcblx0XHRzZWxlY3RvciA9IHN0cmlwQW5kQ29sbGFwc2UoIHVybC5zbGljZSggb2ZmICkgKTtcblx0XHR1cmwgPSB1cmwuc2xpY2UoIDAsIG9mZiApO1xuXHR9XG5cblx0Ly8gSWYgaXQncyBhIGZ1bmN0aW9uXG5cdGlmICggaXNGdW5jdGlvbiggcGFyYW1zICkgKSB7XG5cblx0XHQvLyBXZSBhc3N1bWUgdGhhdCBpdCdzIHRoZSBjYWxsYmFja1xuXHRcdGNhbGxiYWNrID0gcGFyYW1zO1xuXHRcdHBhcmFtcyA9IHVuZGVmaW5lZDtcblxuXHQvLyBPdGhlcndpc2UsIGJ1aWxkIGEgcGFyYW0gc3RyaW5nXG5cdH0gZWxzZSBpZiAoIHBhcmFtcyAmJiB0eXBlb2YgcGFyYW1zID09PSBcIm9iamVjdFwiICkge1xuXHRcdHR5cGUgPSBcIlBPU1RcIjtcblx0fVxuXG5cdC8vIElmIHdlIGhhdmUgZWxlbWVudHMgdG8gbW9kaWZ5LCBtYWtlIHRoZSByZXF1ZXN0XG5cdGlmICggc2VsZi5sZW5ndGggPiAwICkge1xuXHRcdGpRdWVyeS5hamF4KCB7XG5cdFx0XHR1cmw6IHVybCxcblxuXHRcdFx0Ly8gSWYgXCJ0eXBlXCIgdmFyaWFibGUgaXMgdW5kZWZpbmVkLCB0aGVuIFwiR0VUXCIgbWV0aG9kIHdpbGwgYmUgdXNlZC5cblx0XHRcdC8vIE1ha2UgdmFsdWUgb2YgdGhpcyBmaWVsZCBleHBsaWNpdCBzaW5jZVxuXHRcdFx0Ly8gdXNlciBjYW4gb3ZlcnJpZGUgaXQgdGhyb3VnaCBhamF4U2V0dXAgbWV0aG9kXG5cdFx0XHR0eXBlOiB0eXBlIHx8IFwiR0VUXCIsXG5cdFx0XHRkYXRhVHlwZTogXCJodG1sXCIsXG5cdFx0XHRkYXRhOiBwYXJhbXNcblx0XHR9ICkuZG9uZSggZnVuY3Rpb24oIHJlc3BvbnNlVGV4dCApIHtcblxuXHRcdFx0Ly8gU2F2ZSByZXNwb25zZSBmb3IgdXNlIGluIGNvbXBsZXRlIGNhbGxiYWNrXG5cdFx0XHRyZXNwb25zZSA9IGFyZ3VtZW50cztcblxuXHRcdFx0c2VsZi5odG1sKCBzZWxlY3RvciA/XG5cblx0XHRcdFx0Ly8gSWYgYSBzZWxlY3RvciB3YXMgc3BlY2lmaWVkLCBsb2NhdGUgdGhlIHJpZ2h0IGVsZW1lbnRzIGluIGEgZHVtbXkgZGl2XG5cdFx0XHRcdC8vIEV4Y2x1ZGUgc2NyaXB0cyB0byBhdm9pZCBJRSAnUGVybWlzc2lvbiBEZW5pZWQnIGVycm9yc1xuXHRcdFx0XHRqUXVlcnkoIFwiPGRpdj5cIiApLmFwcGVuZCggalF1ZXJ5LnBhcnNlSFRNTCggcmVzcG9uc2VUZXh0ICkgKS5maW5kKCBzZWxlY3RvciApIDpcblxuXHRcdFx0XHQvLyBPdGhlcndpc2UgdXNlIHRoZSBmdWxsIHJlc3VsdFxuXHRcdFx0XHRyZXNwb25zZVRleHQgKTtcblxuXHRcdC8vIElmIHRoZSByZXF1ZXN0IHN1Y2NlZWRzLCB0aGlzIGZ1bmN0aW9uIGdldHMgXCJkYXRhXCIsIFwic3RhdHVzXCIsIFwianFYSFJcIlxuXHRcdC8vIGJ1dCB0aGV5IGFyZSBpZ25vcmVkIGJlY2F1c2UgcmVzcG9uc2Ugd2FzIHNldCBhYm92ZS5cblx0XHQvLyBJZiBpdCBmYWlscywgdGhpcyBmdW5jdGlvbiBnZXRzIFwianFYSFJcIiwgXCJzdGF0dXNcIiwgXCJlcnJvclwiXG5cdFx0fSApLmFsd2F5cyggY2FsbGJhY2sgJiYgZnVuY3Rpb24oIGpxWEhSLCBzdGF0dXMgKSB7XG5cdFx0XHRzZWxmLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjYWxsYmFjay5hcHBseSggdGhpcywgcmVzcG9uc2UgfHwgWyBqcVhIUi5yZXNwb25zZVRleHQsIHN0YXR1cywganFYSFIgXSApO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuXG5cblxualF1ZXJ5LmV4cHIucHNldWRvcy5hbmltYXRlZCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuXHRyZXR1cm4galF1ZXJ5LmdyZXAoIGpRdWVyeS50aW1lcnMsIGZ1bmN0aW9uKCBmbiApIHtcblx0XHRyZXR1cm4gZWxlbSA9PT0gZm4uZWxlbTtcblx0fSApLmxlbmd0aDtcbn07XG5cblxuXG5cbmpRdWVyeS5vZmZzZXQgPSB7XG5cdHNldE9mZnNldDogZnVuY3Rpb24oIGVsZW0sIG9wdGlvbnMsIGkgKSB7XG5cdFx0dmFyIGN1clBvc2l0aW9uLCBjdXJMZWZ0LCBjdXJDU1NUb3AsIGN1clRvcCwgY3VyT2Zmc2V0LCBjdXJDU1NMZWZ0LCBjYWxjdWxhdGVQb3NpdGlvbixcblx0XHRcdHBvc2l0aW9uID0galF1ZXJ5LmNzcyggZWxlbSwgXCJwb3NpdGlvblwiICksXG5cdFx0XHRjdXJFbGVtID0galF1ZXJ5KCBlbGVtICksXG5cdFx0XHRwcm9wcyA9IHt9O1xuXG5cdFx0Ly8gU2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxuXHRcdGlmICggcG9zaXRpb24gPT09IFwic3RhdGljXCIgKSB7XG5cdFx0XHRlbGVtLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuXHRcdH1cblxuXHRcdGN1ck9mZnNldCA9IGN1ckVsZW0ub2Zmc2V0KCk7XG5cdFx0Y3VyQ1NTVG9wID0galF1ZXJ5LmNzcyggZWxlbSwgXCJ0b3BcIiApO1xuXHRcdGN1ckNTU0xlZnQgPSBqUXVlcnkuY3NzKCBlbGVtLCBcImxlZnRcIiApO1xuXHRcdGNhbGN1bGF0ZVBvc2l0aW9uID0gKCBwb3NpdGlvbiA9PT0gXCJhYnNvbHV0ZVwiIHx8IHBvc2l0aW9uID09PSBcImZpeGVkXCIgKSAmJlxuXHRcdFx0KCBjdXJDU1NUb3AgKyBjdXJDU1NMZWZ0ICkuaW5kZXhPZiggXCJhdXRvXCIgKSA+IC0xO1xuXG5cdFx0Ly8gTmVlZCB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSBwb3NpdGlvbiBpZiBlaXRoZXJcblx0XHQvLyB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcblx0XHRpZiAoIGNhbGN1bGF0ZVBvc2l0aW9uICkge1xuXHRcdFx0Y3VyUG9zaXRpb24gPSBjdXJFbGVtLnBvc2l0aW9uKCk7XG5cdFx0XHRjdXJUb3AgPSBjdXJQb3NpdGlvbi50b3A7XG5cdFx0XHRjdXJMZWZ0ID0gY3VyUG9zaXRpb24ubGVmdDtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJUb3AgPSBwYXJzZUZsb2F0KCBjdXJDU1NUb3AgKSB8fCAwO1xuXHRcdFx0Y3VyTGVmdCA9IHBhcnNlRmxvYXQoIGN1ckNTU0xlZnQgKSB8fCAwO1xuXHRcdH1cblxuXHRcdGlmICggaXNGdW5jdGlvbiggb3B0aW9ucyApICkge1xuXG5cdFx0XHQvLyBVc2UgalF1ZXJ5LmV4dGVuZCBoZXJlIHRvIGFsbG93IG1vZGlmaWNhdGlvbiBvZiBjb29yZGluYXRlcyBhcmd1bWVudCAoZ2gtMTg0OClcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zLmNhbGwoIGVsZW0sIGksIGpRdWVyeS5leHRlbmQoIHt9LCBjdXJPZmZzZXQgKSApO1xuXHRcdH1cblxuXHRcdGlmICggb3B0aW9ucy50b3AgIT0gbnVsbCApIHtcblx0XHRcdHByb3BzLnRvcCA9ICggb3B0aW9ucy50b3AgLSBjdXJPZmZzZXQudG9wICkgKyBjdXJUb3A7XG5cdFx0fVxuXHRcdGlmICggb3B0aW9ucy5sZWZ0ICE9IG51bGwgKSB7XG5cdFx0XHRwcm9wcy5sZWZ0ID0gKCBvcHRpb25zLmxlZnQgLSBjdXJPZmZzZXQubGVmdCApICsgY3VyTGVmdDtcblx0XHR9XG5cblx0XHRpZiAoIFwidXNpbmdcIiBpbiBvcHRpb25zICkge1xuXHRcdFx0b3B0aW9ucy51c2luZy5jYWxsKCBlbGVtLCBwcm9wcyApO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1ckVsZW0uY3NzKCBwcm9wcyApO1xuXHRcdH1cblx0fVxufTtcblxualF1ZXJ5LmZuLmV4dGVuZCgge1xuXG5cdC8vIG9mZnNldCgpIHJlbGF0ZXMgYW4gZWxlbWVudCdzIGJvcmRlciBib3ggdG8gdGhlIGRvY3VtZW50IG9yaWdpblxuXHRvZmZzZXQ6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXG5cdFx0Ly8gUHJlc2VydmUgY2hhaW5pbmcgZm9yIHNldHRlclxuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aCApIHtcblx0XHRcdHJldHVybiBvcHRpb25zID09PSB1bmRlZmluZWQgP1xuXHRcdFx0XHR0aGlzIDpcblx0XHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbiggaSApIHtcblx0XHRcdFx0XHRqUXVlcnkub2Zmc2V0LnNldE9mZnNldCggdGhpcywgb3B0aW9ucywgaSApO1xuXHRcdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0dmFyIHJlY3QsIHdpbixcblx0XHRcdGVsZW0gPSB0aGlzWyAwIF07XG5cblx0XHRpZiAoICFlbGVtICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFJldHVybiB6ZXJvcyBmb3IgZGlzY29ubmVjdGVkIGFuZCBoaWRkZW4gKGRpc3BsYXk6IG5vbmUpIGVsZW1lbnRzIChnaC0yMzEwKVxuXHRcdC8vIFN1cHBvcnQ6IElFIDw9MTEgb25seVxuXHRcdC8vIFJ1bm5pbmcgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IG9uIGFcblx0XHQvLyBkaXNjb25uZWN0ZWQgbm9kZSBpbiBJRSB0aHJvd3MgYW4gZXJyb3Jcblx0XHRpZiAoICFlbGVtLmdldENsaWVudFJlY3RzKCkubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuIHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cdFx0fVxuXG5cdFx0Ly8gR2V0IGRvY3VtZW50LXJlbGF0aXZlIHBvc2l0aW9uIGJ5IGFkZGluZyB2aWV3cG9ydCBzY3JvbGwgdG8gdmlld3BvcnQtcmVsYXRpdmUgZ0JDUlxuXHRcdHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdHdpbiA9IGVsZW0ub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dG9wOiByZWN0LnRvcCArIHdpbi5wYWdlWU9mZnNldCxcblx0XHRcdGxlZnQ6IHJlY3QubGVmdCArIHdpbi5wYWdlWE9mZnNldFxuXHRcdH07XG5cdH0sXG5cblx0Ly8gcG9zaXRpb24oKSByZWxhdGVzIGFuIGVsZW1lbnQncyBtYXJnaW4gYm94IHRvIGl0cyBvZmZzZXQgcGFyZW50J3MgcGFkZGluZyBib3hcblx0Ly8gVGhpcyBjb3JyZXNwb25kcyB0byB0aGUgYmVoYXZpb3Igb2YgQ1NTIGFic29sdXRlIHBvc2l0aW9uaW5nXG5cdHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICF0aGlzWyAwIF0gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG9mZnNldFBhcmVudCwgb2Zmc2V0LCBkb2MsXG5cdFx0XHRlbGVtID0gdGhpc1sgMCBdLFxuXHRcdFx0cGFyZW50T2Zmc2V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuXHRcdC8vIHBvc2l0aW9uOmZpeGVkIGVsZW1lbnRzIGFyZSBvZmZzZXQgZnJvbSB0aGUgdmlld3BvcnQsIHdoaWNoIGl0c2VsZiBhbHdheXMgaGFzIHplcm8gb2Zmc2V0XG5cdFx0aWYgKCBqUXVlcnkuY3NzKCBlbGVtLCBcInBvc2l0aW9uXCIgKSA9PT0gXCJmaXhlZFwiICkge1xuXG5cdFx0XHQvLyBBc3N1bWUgcG9zaXRpb246Zml4ZWQgaW1wbGllcyBhdmFpbGFiaWxpdHkgb2YgZ2V0Qm91bmRpbmdDbGllbnRSZWN0XG5cdFx0XHRvZmZzZXQgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdG9mZnNldCA9IHRoaXMub2Zmc2V0KCk7XG5cblx0XHRcdC8vIEFjY291bnQgZm9yIHRoZSAqcmVhbCogb2Zmc2V0IHBhcmVudCwgd2hpY2ggY2FuIGJlIHRoZSBkb2N1bWVudCBvciBpdHMgcm9vdCBlbGVtZW50XG5cdFx0XHQvLyB3aGVuIGEgc3RhdGljYWxseSBwb3NpdGlvbmVkIGVsZW1lbnQgaXMgaWRlbnRpZmllZFxuXHRcdFx0ZG9jID0gZWxlbS5vd25lckRvY3VtZW50O1xuXHRcdFx0b2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgZG9jLmRvY3VtZW50RWxlbWVudDtcblx0XHRcdHdoaWxlICggb2Zmc2V0UGFyZW50ICYmXG5cdFx0XHRcdCggb2Zmc2V0UGFyZW50ID09PSBkb2MuYm9keSB8fCBvZmZzZXRQYXJlbnQgPT09IGRvYy5kb2N1bWVudEVsZW1lbnQgKSAmJlxuXHRcdFx0XHRqUXVlcnkuY3NzKCBvZmZzZXRQYXJlbnQsIFwicG9zaXRpb25cIiApID09PSBcInN0YXRpY1wiICkge1xuXG5cdFx0XHRcdG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBvZmZzZXRQYXJlbnQgJiYgb2Zmc2V0UGFyZW50ICE9PSBlbGVtICYmIG9mZnNldFBhcmVudC5ub2RlVHlwZSA9PT0gMSApIHtcblxuXHRcdFx0XHQvLyBJbmNvcnBvcmF0ZSBib3JkZXJzIGludG8gaXRzIG9mZnNldCwgc2luY2UgdGhleSBhcmUgb3V0c2lkZSBpdHMgY29udGVudCBvcmlnaW5cblx0XHRcdFx0cGFyZW50T2Zmc2V0ID0galF1ZXJ5KCBvZmZzZXRQYXJlbnQgKS5vZmZzZXQoKTtcblx0XHRcdFx0cGFyZW50T2Zmc2V0LnRvcCArPSBqUXVlcnkuY3NzKCBvZmZzZXRQYXJlbnQsIFwiYm9yZGVyVG9wV2lkdGhcIiwgdHJ1ZSApO1xuXHRcdFx0XHRwYXJlbnRPZmZzZXQubGVmdCArPSBqUXVlcnkuY3NzKCBvZmZzZXRQYXJlbnQsIFwiYm9yZGVyTGVmdFdpZHRoXCIsIHRydWUgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBTdWJ0cmFjdCBwYXJlbnQgb2Zmc2V0cyBhbmQgZWxlbWVudCBtYXJnaW5zXG5cdFx0cmV0dXJuIHtcblx0XHRcdHRvcDogb2Zmc2V0LnRvcCAtIHBhcmVudE9mZnNldC50b3AgLSBqUXVlcnkuY3NzKCBlbGVtLCBcIm1hcmdpblRvcFwiLCB0cnVlICksXG5cdFx0XHRsZWZ0OiBvZmZzZXQubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0IC0galF1ZXJ5LmNzcyggZWxlbSwgXCJtYXJnaW5MZWZ0XCIsIHRydWUgKVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gVGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gZG9jdW1lbnRFbGVtZW50IGluIHRoZSBmb2xsb3dpbmcgY2FzZXM6XG5cdC8vIDEpIEZvciB0aGUgZWxlbWVudCBpbnNpZGUgdGhlIGlmcmFtZSB3aXRob3V0IG9mZnNldFBhcmVudCwgdGhpcyBtZXRob2Qgd2lsbCByZXR1cm5cblx0Ly8gICAgZG9jdW1lbnRFbGVtZW50IG9mIHRoZSBwYXJlbnQgd2luZG93XG5cdC8vIDIpIEZvciB0aGUgaGlkZGVuIG9yIGRldGFjaGVkIGVsZW1lbnRcblx0Ly8gMykgRm9yIGJvZHkgb3IgaHRtbCBlbGVtZW50LCBpLmUuIGluIGNhc2Ugb2YgdGhlIGh0bWwgbm9kZSAtIGl0IHdpbGwgcmV0dXJuIGl0c2VsZlxuXHQvL1xuXHQvLyBidXQgdGhvc2UgZXhjZXB0aW9ucyB3ZXJlIG5ldmVyIHByZXNlbnRlZCBhcyBhIHJlYWwgbGlmZSB1c2UtY2FzZXNcblx0Ly8gYW5kIG1pZ2h0IGJlIGNvbnNpZGVyZWQgYXMgbW9yZSBwcmVmZXJhYmxlIHJlc3VsdHMuXG5cdC8vXG5cdC8vIFRoaXMgbG9naWMsIGhvd2V2ZXIsIGlzIG5vdCBndWFyYW50ZWVkIGFuZCBjYW4gY2hhbmdlIGF0IGFueSBwb2ludCBpbiB0aGUgZnV0dXJlXG5cdG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubWFwKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBvZmZzZXRQYXJlbnQgPSB0aGlzLm9mZnNldFBhcmVudDtcblxuXHRcdFx0d2hpbGUgKCBvZmZzZXRQYXJlbnQgJiYgalF1ZXJ5LmNzcyggb2Zmc2V0UGFyZW50LCBcInBvc2l0aW9uXCIgKSA9PT0gXCJzdGF0aWNcIiApIHtcblx0XHRcdFx0b2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG9mZnNldFBhcmVudCB8fCBkb2N1bWVudEVsZW1lbnQ7XG5cdFx0fSApO1xuXHR9XG59ICk7XG5cbi8vIENyZWF0ZSBzY3JvbGxMZWZ0IGFuZCBzY3JvbGxUb3AgbWV0aG9kc1xualF1ZXJ5LmVhY2goIHsgc2Nyb2xsTGVmdDogXCJwYWdlWE9mZnNldFwiLCBzY3JvbGxUb3A6IFwicGFnZVlPZmZzZXRcIiB9LCBmdW5jdGlvbiggbWV0aG9kLCBwcm9wICkge1xuXHR2YXIgdG9wID0gXCJwYWdlWU9mZnNldFwiID09PSBwcm9wO1xuXG5cdGpRdWVyeS5mblsgbWV0aG9kIF0gPSBmdW5jdGlvbiggdmFsICkge1xuXHRcdHJldHVybiBhY2Nlc3MoIHRoaXMsIGZ1bmN0aW9uKCBlbGVtLCBtZXRob2QsIHZhbCApIHtcblxuXHRcdFx0Ly8gQ29hbGVzY2UgZG9jdW1lbnRzIGFuZCB3aW5kb3dzXG5cdFx0XHR2YXIgd2luO1xuXHRcdFx0aWYgKCBpc1dpbmRvdyggZWxlbSApICkge1xuXHRcdFx0XHR3aW4gPSBlbGVtO1xuXHRcdFx0fSBlbHNlIGlmICggZWxlbS5ub2RlVHlwZSA9PT0gOSApIHtcblx0XHRcdFx0d2luID0gZWxlbS5kZWZhdWx0Vmlldztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCB2YWwgPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0cmV0dXJuIHdpbiA/IHdpblsgcHJvcCBdIDogZWxlbVsgbWV0aG9kIF07XG5cdFx0XHR9XG5cblx0XHRcdGlmICggd2luICkge1xuXHRcdFx0XHR3aW4uc2Nyb2xsVG8oXG5cdFx0XHRcdFx0IXRvcCA/IHZhbCA6IHdpbi5wYWdlWE9mZnNldCxcblx0XHRcdFx0XHR0b3AgPyB2YWwgOiB3aW4ucGFnZVlPZmZzZXRcblx0XHRcdFx0KTtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWxlbVsgbWV0aG9kIF0gPSB2YWw7XG5cdFx0XHR9XG5cdFx0fSwgbWV0aG9kLCB2YWwsIGFyZ3VtZW50cy5sZW5ndGggKTtcblx0fTtcbn0gKTtcblxuLy8gU3VwcG9ydDogU2FmYXJpIDw9NyAtIDkuMSwgQ2hyb21lIDw9MzcgLSA0OVxuLy8gQWRkIHRoZSB0b3AvbGVmdCBjc3NIb29rcyB1c2luZyBqUXVlcnkuZm4ucG9zaXRpb25cbi8vIFdlYmtpdCBidWc6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0yOTA4NFxuLy8gQmxpbmsgYnVnOiBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD01ODkzNDdcbi8vIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBwZXJjZW50IHdoZW4gc3BlY2lmaWVkIGZvciB0b3AvbGVmdC9ib3R0b20vcmlnaHQ7XG4vLyByYXRoZXIgdGhhbiBtYWtlIHRoZSBjc3MgbW9kdWxlIGRlcGVuZCBvbiB0aGUgb2Zmc2V0IG1vZHVsZSwganVzdCBjaGVjayBmb3IgaXQgaGVyZVxualF1ZXJ5LmVhY2goIFsgXCJ0b3BcIiwgXCJsZWZ0XCIgXSwgZnVuY3Rpb24oIF9pLCBwcm9wICkge1xuXHRqUXVlcnkuY3NzSG9va3NbIHByb3AgXSA9IGFkZEdldEhvb2tJZiggc3VwcG9ydC5waXhlbFBvc2l0aW9uLFxuXHRcdGZ1bmN0aW9uKCBlbGVtLCBjb21wdXRlZCApIHtcblx0XHRcdGlmICggY29tcHV0ZWQgKSB7XG5cdFx0XHRcdGNvbXB1dGVkID0gY3VyQ1NTKCBlbGVtLCBwcm9wICk7XG5cblx0XHRcdFx0Ly8gSWYgY3VyQ1NTIHJldHVybnMgcGVyY2VudGFnZSwgZmFsbGJhY2sgdG8gb2Zmc2V0XG5cdFx0XHRcdHJldHVybiBybnVtbm9ucHgudGVzdCggY29tcHV0ZWQgKSA/XG5cdFx0XHRcdFx0alF1ZXJ5KCBlbGVtICkucG9zaXRpb24oKVsgcHJvcCBdICsgXCJweFwiIDpcblx0XHRcdFx0XHRjb21wdXRlZDtcblx0XHRcdH1cblx0XHR9XG5cdCk7XG59ICk7XG5cblxuLy8gQ3JlYXRlIGlubmVySGVpZ2h0LCBpbm5lcldpZHRoLCBoZWlnaHQsIHdpZHRoLCBvdXRlckhlaWdodCBhbmQgb3V0ZXJXaWR0aCBtZXRob2RzXG5qUXVlcnkuZWFjaCggeyBIZWlnaHQ6IFwiaGVpZ2h0XCIsIFdpZHRoOiBcIndpZHRoXCIgfSwgZnVuY3Rpb24oIG5hbWUsIHR5cGUgKSB7XG5cdGpRdWVyeS5lYWNoKCB7XG5cdFx0cGFkZGluZzogXCJpbm5lclwiICsgbmFtZSxcblx0XHRjb250ZW50OiB0eXBlLFxuXHRcdFwiXCI6IFwib3V0ZXJcIiArIG5hbWVcblx0fSwgZnVuY3Rpb24oIGRlZmF1bHRFeHRyYSwgZnVuY05hbWUgKSB7XG5cblx0XHQvLyBNYXJnaW4gaXMgb25seSBmb3Igb3V0ZXJIZWlnaHQsIG91dGVyV2lkdGhcblx0XHRqUXVlcnkuZm5bIGZ1bmNOYW1lIF0gPSBmdW5jdGlvbiggbWFyZ2luLCB2YWx1ZSApIHtcblx0XHRcdHZhciBjaGFpbmFibGUgPSBhcmd1bWVudHMubGVuZ3RoICYmICggZGVmYXVsdEV4dHJhIHx8IHR5cGVvZiBtYXJnaW4gIT09IFwiYm9vbGVhblwiICksXG5cdFx0XHRcdGV4dHJhID0gZGVmYXVsdEV4dHJhIHx8ICggbWFyZ2luID09PSB0cnVlIHx8IHZhbHVlID09PSB0cnVlID8gXCJtYXJnaW5cIiA6IFwiYm9yZGVyXCIgKTtcblxuXHRcdFx0cmV0dXJuIGFjY2VzcyggdGhpcywgZnVuY3Rpb24oIGVsZW0sIHR5cGUsIHZhbHVlICkge1xuXHRcdFx0XHR2YXIgZG9jO1xuXG5cdFx0XHRcdGlmICggaXNXaW5kb3coIGVsZW0gKSApIHtcblxuXHRcdFx0XHRcdC8vICQoIHdpbmRvdyApLm91dGVyV2lkdGgvSGVpZ2h0IHJldHVybiB3L2ggaW5jbHVkaW5nIHNjcm9sbGJhcnMgKGdoLTE3MjkpXG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmNOYW1lLmluZGV4T2YoIFwib3V0ZXJcIiApID09PSAwID9cblx0XHRcdFx0XHRcdGVsZW1bIFwiaW5uZXJcIiArIG5hbWUgXSA6XG5cdFx0XHRcdFx0XHRlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudFsgXCJjbGllbnRcIiArIG5hbWUgXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEdldCBkb2N1bWVudCB3aWR0aCBvciBoZWlnaHRcblx0XHRcdFx0aWYgKCBlbGVtLm5vZGVUeXBlID09PSA5ICkge1xuXHRcdFx0XHRcdGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xuXG5cdFx0XHRcdFx0Ly8gRWl0aGVyIHNjcm9sbFtXaWR0aC9IZWlnaHRdIG9yIG9mZnNldFtXaWR0aC9IZWlnaHRdIG9yIGNsaWVudFtXaWR0aC9IZWlnaHRdLFxuXHRcdFx0XHRcdC8vIHdoaWNoZXZlciBpcyBncmVhdGVzdFxuXHRcdFx0XHRcdHJldHVybiBNYXRoLm1heChcblx0XHRcdFx0XHRcdGVsZW0uYm9keVsgXCJzY3JvbGxcIiArIG5hbWUgXSwgZG9jWyBcInNjcm9sbFwiICsgbmFtZSBdLFxuXHRcdFx0XHRcdFx0ZWxlbS5ib2R5WyBcIm9mZnNldFwiICsgbmFtZSBdLCBkb2NbIFwib2Zmc2V0XCIgKyBuYW1lIF0sXG5cdFx0XHRcdFx0XHRkb2NbIFwiY2xpZW50XCIgKyBuYW1lIF1cblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgP1xuXG5cdFx0XHRcdFx0Ly8gR2V0IHdpZHRoIG9yIGhlaWdodCBvbiB0aGUgZWxlbWVudCwgcmVxdWVzdGluZyBidXQgbm90IGZvcmNpbmcgcGFyc2VGbG9hdFxuXHRcdFx0XHRcdGpRdWVyeS5jc3MoIGVsZW0sIHR5cGUsIGV4dHJhICkgOlxuXG5cdFx0XHRcdFx0Ly8gU2V0IHdpZHRoIG9yIGhlaWdodCBvbiB0aGUgZWxlbWVudFxuXHRcdFx0XHRcdGpRdWVyeS5zdHlsZSggZWxlbSwgdHlwZSwgdmFsdWUsIGV4dHJhICk7XG5cdFx0XHR9LCB0eXBlLCBjaGFpbmFibGUgPyBtYXJnaW4gOiB1bmRlZmluZWQsIGNoYWluYWJsZSApO1xuXHRcdH07XG5cdH0gKTtcbn0gKTtcblxuXG5qUXVlcnkuZWFjaCggW1xuXHRcImFqYXhTdGFydFwiLFxuXHRcImFqYXhTdG9wXCIsXG5cdFwiYWpheENvbXBsZXRlXCIsXG5cdFwiYWpheEVycm9yXCIsXG5cdFwiYWpheFN1Y2Nlc3NcIixcblx0XCJhamF4U2VuZFwiXG5dLCBmdW5jdGlvbiggX2ksIHR5cGUgKSB7XG5cdGpRdWVyeS5mblsgdHlwZSBdID0gZnVuY3Rpb24oIGZuICkge1xuXHRcdHJldHVybiB0aGlzLm9uKCB0eXBlLCBmbiApO1xuXHR9O1xufSApO1xuXG5cblxuXG5qUXVlcnkuZm4uZXh0ZW5kKCB7XG5cblx0YmluZDogZnVuY3Rpb24oIHR5cGVzLCBkYXRhLCBmbiApIHtcblx0XHRyZXR1cm4gdGhpcy5vbiggdHlwZXMsIG51bGwsIGRhdGEsIGZuICk7XG5cdH0sXG5cdHVuYmluZDogZnVuY3Rpb24oIHR5cGVzLCBmbiApIHtcblx0XHRyZXR1cm4gdGhpcy5vZmYoIHR5cGVzLCBudWxsLCBmbiApO1xuXHR9LFxuXG5cdGRlbGVnYXRlOiBmdW5jdGlvbiggc2VsZWN0b3IsIHR5cGVzLCBkYXRhLCBmbiApIHtcblx0XHRyZXR1cm4gdGhpcy5vbiggdHlwZXMsIHNlbGVjdG9yLCBkYXRhLCBmbiApO1xuXHR9LFxuXHR1bmRlbGVnYXRlOiBmdW5jdGlvbiggc2VsZWN0b3IsIHR5cGVzLCBmbiApIHtcblxuXHRcdC8vICggbmFtZXNwYWNlICkgb3IgKCBzZWxlY3RvciwgdHlwZXMgWywgZm5dIClcblx0XHRyZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/XG5cdFx0XHR0aGlzLm9mZiggc2VsZWN0b3IsIFwiKipcIiApIDpcblx0XHRcdHRoaXMub2ZmKCB0eXBlcywgc2VsZWN0b3IgfHwgXCIqKlwiLCBmbiApO1xuXHR9LFxuXG5cdGhvdmVyOiBmdW5jdGlvbiggZm5PdmVyLCBmbk91dCApIHtcblx0XHRyZXR1cm4gdGhpc1xuXHRcdFx0Lm9uKCBcIm1vdXNlZW50ZXJcIiwgZm5PdmVyIClcblx0XHRcdC5vbiggXCJtb3VzZWxlYXZlXCIsIGZuT3V0IHx8IGZuT3ZlciApO1xuXHR9XG59ICk7XG5cbmpRdWVyeS5lYWNoKFxuXHQoIFwiYmx1ciBmb2N1cyBmb2N1c2luIGZvY3Vzb3V0IHJlc2l6ZSBzY3JvbGwgY2xpY2sgZGJsY2xpY2sgXCIgK1xuXHRcIm1vdXNlZG93biBtb3VzZXVwIG1vdXNlbW92ZSBtb3VzZW92ZXIgbW91c2VvdXQgbW91c2VlbnRlciBtb3VzZWxlYXZlIFwiICtcblx0XCJjaGFuZ2Ugc2VsZWN0IHN1Ym1pdCBrZXlkb3duIGtleXByZXNzIGtleXVwIGNvbnRleHRtZW51XCIgKS5zcGxpdCggXCIgXCIgKSxcblx0ZnVuY3Rpb24oIF9pLCBuYW1lICkge1xuXG5cdFx0Ly8gSGFuZGxlIGV2ZW50IGJpbmRpbmdcblx0XHRqUXVlcnkuZm5bIG5hbWUgXSA9IGZ1bmN0aW9uKCBkYXRhLCBmbiApIHtcblx0XHRcdHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMCA/XG5cdFx0XHRcdHRoaXMub24oIG5hbWUsIG51bGwsIGRhdGEsIGZuICkgOlxuXHRcdFx0XHR0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXHR9XG4pO1xuXG5cblxuXG4vLyBTdXBwb3J0OiBBbmRyb2lkIDw9NC4wIG9ubHlcbi8vIE1ha2Ugc3VyZSB3ZSB0cmltIEJPTSBhbmQgTkJTUFxuLy8gUmVxdWlyZSB0aGF0IHRoZSBcIndoaXRlc3BhY2UgcnVuXCIgc3RhcnRzIGZyb20gYSBub24td2hpdGVzcGFjZVxuLy8gdG8gYXZvaWQgTyhOXjIpIGJlaGF2aW9yIHdoZW4gdGhlIGVuZ2luZSB3b3VsZCB0cnkgbWF0Y2hpbmcgXCJcXHMrJFwiIGF0IGVhY2ggc3BhY2UgcG9zaXRpb24uXG52YXIgcnRyaW0gPSAvXltcXHNcXHVGRUZGXFx4QTBdK3woW15cXHNcXHVGRUZGXFx4QTBdKVtcXHNcXHVGRUZGXFx4QTBdKyQvZztcblxuLy8gQmluZCBhIGZ1bmN0aW9uIHRvIGEgY29udGV4dCwgb3B0aW9uYWxseSBwYXJ0aWFsbHkgYXBwbHlpbmcgYW55XG4vLyBhcmd1bWVudHMuXG4vLyBqUXVlcnkucHJveHkgaXMgZGVwcmVjYXRlZCB0byBwcm9tb3RlIHN0YW5kYXJkcyAoc3BlY2lmaWNhbGx5IEZ1bmN0aW9uI2JpbmQpXG4vLyBIb3dldmVyLCBpdCBpcyBub3Qgc2xhdGVkIGZvciByZW1vdmFsIGFueSB0aW1lIHNvb25cbmpRdWVyeS5wcm94eSA9IGZ1bmN0aW9uKCBmbiwgY29udGV4dCApIHtcblx0dmFyIHRtcCwgYXJncywgcHJveHk7XG5cblx0aWYgKCB0eXBlb2YgY29udGV4dCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHR0bXAgPSBmblsgY29udGV4dCBdO1xuXHRcdGNvbnRleHQgPSBmbjtcblx0XHRmbiA9IHRtcDtcblx0fVxuXG5cdC8vIFF1aWNrIGNoZWNrIHRvIGRldGVybWluZSBpZiB0YXJnZXQgaXMgY2FsbGFibGUsIGluIHRoZSBzcGVjXG5cdC8vIHRoaXMgdGhyb3dzIGEgVHlwZUVycm9yLCBidXQgd2Ugd2lsbCBqdXN0IHJldHVybiB1bmRlZmluZWQuXG5cdGlmICggIWlzRnVuY3Rpb24oIGZuICkgKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdC8vIFNpbXVsYXRlZCBiaW5kXG5cdGFyZ3MgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMsIDIgKTtcblx0cHJveHkgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZm4uYXBwbHkoIGNvbnRleHQgfHwgdGhpcywgYXJncy5jb25jYXQoIHNsaWNlLmNhbGwoIGFyZ3VtZW50cyApICkgKTtcblx0fTtcblxuXHQvLyBTZXQgdGhlIGd1aWQgb2YgdW5pcXVlIGhhbmRsZXIgdG8gdGhlIHNhbWUgb2Ygb3JpZ2luYWwgaGFuZGxlciwgc28gaXQgY2FuIGJlIHJlbW92ZWRcblx0cHJveHkuZ3VpZCA9IGZuLmd1aWQgPSBmbi5ndWlkIHx8IGpRdWVyeS5ndWlkKys7XG5cblx0cmV0dXJuIHByb3h5O1xufTtcblxualF1ZXJ5LmhvbGRSZWFkeSA9IGZ1bmN0aW9uKCBob2xkICkge1xuXHRpZiAoIGhvbGQgKSB7XG5cdFx0alF1ZXJ5LnJlYWR5V2FpdCsrO1xuXHR9IGVsc2Uge1xuXHRcdGpRdWVyeS5yZWFkeSggdHJ1ZSApO1xuXHR9XG59O1xualF1ZXJ5LmlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xualF1ZXJ5LnBhcnNlSlNPTiA9IEpTT04ucGFyc2U7XG5qUXVlcnkubm9kZU5hbWUgPSBub2RlTmFtZTtcbmpRdWVyeS5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbmpRdWVyeS5pc1dpbmRvdyA9IGlzV2luZG93O1xualF1ZXJ5LmNhbWVsQ2FzZSA9IGNhbWVsQ2FzZTtcbmpRdWVyeS50eXBlID0gdG9UeXBlO1xuXG5qUXVlcnkubm93ID0gRGF0ZS5ub3c7XG5cbmpRdWVyeS5pc051bWVyaWMgPSBmdW5jdGlvbiggb2JqICkge1xuXG5cdC8vIEFzIG9mIGpRdWVyeSAzLjAsIGlzTnVtZXJpYyBpcyBsaW1pdGVkIHRvXG5cdC8vIHN0cmluZ3MgYW5kIG51bWJlcnMgKHByaW1pdGl2ZXMgb3Igb2JqZWN0cylcblx0Ly8gdGhhdCBjYW4gYmUgY29lcmNlZCB0byBmaW5pdGUgbnVtYmVycyAoZ2gtMjY2Milcblx0dmFyIHR5cGUgPSBqUXVlcnkudHlwZSggb2JqICk7XG5cdHJldHVybiAoIHR5cGUgPT09IFwibnVtYmVyXCIgfHwgdHlwZSA9PT0gXCJzdHJpbmdcIiApICYmXG5cblx0XHQvLyBwYXJzZUZsb2F0IE5hTnMgbnVtZXJpYy1jYXN0IGZhbHNlIHBvc2l0aXZlcyAoXCJcIilcblx0XHQvLyAuLi5idXQgbWlzaW50ZXJwcmV0cyBsZWFkaW5nLW51bWJlciBzdHJpbmdzLCBwYXJ0aWN1bGFybHkgaGV4IGxpdGVyYWxzIChcIjB4Li4uXCIpXG5cdFx0Ly8gc3VidHJhY3Rpb24gZm9yY2VzIGluZmluaXRpZXMgdG8gTmFOXG5cdFx0IWlzTmFOKCBvYmogLSBwYXJzZUZsb2F0KCBvYmogKSApO1xufTtcblxualF1ZXJ5LnRyaW0gPSBmdW5jdGlvbiggdGV4dCApIHtcblx0cmV0dXJuIHRleHQgPT0gbnVsbCA/XG5cdFx0XCJcIiA6XG5cdFx0KCB0ZXh0ICsgXCJcIiApLnJlcGxhY2UoIHJ0cmltLCBcIiQxXCIgKTtcbn07XG5cblxuXG4vLyBSZWdpc3RlciBhcyBhIG5hbWVkIEFNRCBtb2R1bGUsIHNpbmNlIGpRdWVyeSBjYW4gYmUgY29uY2F0ZW5hdGVkIHdpdGggb3RoZXJcbi8vIGZpbGVzIHRoYXQgbWF5IHVzZSBkZWZpbmUsIGJ1dCBub3QgdmlhIGEgcHJvcGVyIGNvbmNhdGVuYXRpb24gc2NyaXB0IHRoYXRcbi8vIHVuZGVyc3RhbmRzIGFub255bW91cyBBTUQgbW9kdWxlcy4gQSBuYW1lZCBBTUQgaXMgc2FmZXN0IGFuZCBtb3N0IHJvYnVzdFxuLy8gd2F5IHRvIHJlZ2lzdGVyLiBMb3dlcmNhc2UganF1ZXJ5IGlzIHVzZWQgYmVjYXVzZSBBTUQgbW9kdWxlIG5hbWVzIGFyZVxuLy8gZGVyaXZlZCBmcm9tIGZpbGUgbmFtZXMsIGFuZCBqUXVlcnkgaXMgbm9ybWFsbHkgZGVsaXZlcmVkIGluIGEgbG93ZXJjYXNlXG4vLyBmaWxlIG5hbWUuIERvIHRoaXMgYWZ0ZXIgY3JlYXRpbmcgdGhlIGdsb2JhbCBzbyB0aGF0IGlmIGFuIEFNRCBtb2R1bGUgd2FudHNcbi8vIHRvIGNhbGwgbm9Db25mbGljdCB0byBoaWRlIHRoaXMgdmVyc2lvbiBvZiBqUXVlcnksIGl0IHdpbGwgd29yay5cblxuLy8gTm90ZSB0aGF0IGZvciBtYXhpbXVtIHBvcnRhYmlsaXR5LCBsaWJyYXJpZXMgdGhhdCBhcmUgbm90IGpRdWVyeSBzaG91bGRcbi8vIGRlY2xhcmUgdGhlbXNlbHZlcyBhcyBhbm9ueW1vdXMgbW9kdWxlcywgYW5kIGF2b2lkIHNldHRpbmcgYSBnbG9iYWwgaWYgYW5cbi8vIEFNRCBsb2FkZXIgaXMgcHJlc2VudC4galF1ZXJ5IGlzIGEgc3BlY2lhbCBjYXNlLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlXG4vLyBodHRwczovL2dpdGh1Yi5jb20vanJidXJrZS9yZXF1aXJlanMvd2lraS9VcGRhdGluZy1leGlzdGluZy1saWJyYXJpZXMjd2lraS1hbm9uXG5cbmlmICggdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgKSB7XG5cdGRlZmluZSggXCJqcXVlcnlcIiwgW10sIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBqUXVlcnk7XG5cdH0gKTtcbn1cblxuXG5cblxudmFyXG5cblx0Ly8gTWFwIG92ZXIgalF1ZXJ5IGluIGNhc2Ugb2Ygb3ZlcndyaXRlXG5cdF9qUXVlcnkgPSB3aW5kb3cualF1ZXJ5LFxuXG5cdC8vIE1hcCBvdmVyIHRoZSAkIGluIGNhc2Ugb2Ygb3ZlcndyaXRlXG5cdF8kID0gd2luZG93LiQ7XG5cbmpRdWVyeS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oIGRlZXAgKSB7XG5cdGlmICggd2luZG93LiQgPT09IGpRdWVyeSApIHtcblx0XHR3aW5kb3cuJCA9IF8kO1xuXHR9XG5cblx0aWYgKCBkZWVwICYmIHdpbmRvdy5qUXVlcnkgPT09IGpRdWVyeSApIHtcblx0XHR3aW5kb3cualF1ZXJ5ID0gX2pRdWVyeTtcblx0fVxuXG5cdHJldHVybiBqUXVlcnk7XG59O1xuXG4vLyBFeHBvc2UgalF1ZXJ5IGFuZCAkIGlkZW50aWZpZXJzLCBldmVuIGluIEFNRFxuLy8gKHRyYWMtNzEwMiNjb21tZW50OjEwLCBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS9wdWxsLzU1Nylcbi8vIGFuZCBDb21tb25KUyBmb3IgYnJvd3NlciBlbXVsYXRvcnMgKHRyYWMtMTM1NjYpXG5pZiAoIHR5cGVvZiBub0dsb2JhbCA9PT0gXCJ1bmRlZmluZWRcIiApIHtcblx0d2luZG93LmpRdWVyeSA9IHdpbmRvdy4kID0galF1ZXJ5O1xufVxuXG5cblxuXG5yZXR1cm4galF1ZXJ5O1xufSApO1xuIiwgIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRYVXRpbCwgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG5pbXBvcnQgeyBDb2RCaUVycm9yIH0gZnJvbSBcIi4uL2dsb2JhbC1zY29wZVwiO1xuaW1wb3J0IHsgeHV0aWwgfSBmcm9tIFwianF1ZXJ5XCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBIVE1MX1BhbmVsLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2gubmV0KSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBIVE1MX1BhbmVsIHtcbiAgc3RhdGljIG1hcEhlYWRlckFmdGVyRWxlbWVudHM6IE1hcDxIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnQ+ID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnQ+KCk7XG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGZpcnN0IFwiLkNYUGFnZVwiLXtAbGluayBIVE1MRWxlbWVudCB9IGFib3ZlIHRoZSBnaXZlbiBcImVsZW1lbnRcIi5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRvIHN0YXJ0IHRoZSBzZWFyY2ggZnJvbS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFwiLkNYUGFnZVwiLXtAbGluayBIVE1MRWxlbWVudCB9IGNvbnRhaW5pbmcgdGhlIGdpdmVuIFwiZWxlbWVudFwiLiAqL1xuICBwdWJsaWMgc3RhdGljIGRldGVybWluZVBhZ2UoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGxldCBjdXJyZW50RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZWxlbWVudDtcblxuICAgIHdoaWxlIChjdXJyZW50RWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgaWYgKGN1cnJlbnRFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcIkNYUGFnZVwiKSkge1xuICAgICAgICByZXR1cm4gY3VycmVudEVsZW1lbnQ7XG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudEVsZW1lbnQ7XG4gIH1cbiAgLyoqIFN0b3JlcyBhbGwge0BsaW5rIEhUTUxFbGVtZW50IH1zIHRoYXQncmUgY3VycmVudGx5IGludmFsaWQuICovXG4gIHB1YmxpYyBzdGF0aWMgaW52YWxpZEVsZW1lbnRzOiBBcnJheTxIVE1MRWxlbWVudD4gPSBuZXcgQXJyYXk8SFRNTEVsZW1lbnQ+KCk7XG4gIC8qKiBTdGF0ZXMgd2hldGhlciB0aGUgdmFsaWRhdG9yIGFsZ29yaXRobSBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQuICovXG4gIHB1YmxpYyBzdGF0aWMgdmFsaWRhdG9yUmVnaXN0ZXJlZCA9IGZhbHNlO1xuICAvKipcbiAgICogVW5mb2xkcyBhbGwgSFRNTC1QYW5lbHMgdGhhdCBhcmUgYW5jZXN0b3JzIG9mIHRoZSBzcGVjaWZpZWQge0BsaW5rIEVsZW1lbnQgfSBieSBzaW11bGF0aW5nIGEgY2xpY2sgb24gdGhlaXJcbiAgICogaGVhZGVyIGlmIHRoZXkncmUgZm9sZGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZnJvbSBUaGUge0BsaW5rIEVsZW1lbnQgfSB0byBzdGFydCB0aGUgdW5mb2xkaW5nIGZyb20uICovXG4gIHB1YmxpYyBzdGF0aWMgdW5mb2xkUGFuZWxBbmNlc3RvcnMoZnJvbTogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBsZXQgY3VycmVudEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGZyb207XG5cbiAgICB3aGlsZSAoY3VycmVudEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgIGlmICgoY3VycmVudEVsZW1lbnQgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQpIHtcbiAgICAgICAgKChjdXJyZW50RWxlbWVudCBhcyB1bmtub3duIGFzIHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9KS5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlciBhcyBIVE1MRWxlbWVudCkuY2xpY2soKTtcbiAgICAgIH1cblxuICAgICAgY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IHRyYW5zZm9ybXMgdGhlIHRhZ2dlZCB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfSBpbnRvIGEgUGFuZWwuIFRoZSBwYW5lbCdzIGhlYWRlciwgd2hpY2ggaXMgdXNlZCB0byBmb2xkL3VuZm9sZFxuICAgKiB0aGUgcGFuZWwsIGlzIGFuIHtAbGluayBIVE1MRWxlbWVudCB9IHRhZ2dlZCB3aXRoIHRoZSBDU1MtQ2xhc3MgXCJDb2RCaV9IVE1MX1BhbmVsX0hlYWRlclwiIHRoYXQgaXMgbmVzdGVkICBhdCBtb3N0XG4gICAqIHR3byBsZXZlbHMgd2l0aGluIHRoZSB0YWdnZWQge0BsaW5rIEhUTUxFbGVtZW50fS4gVGh1cyB1c2luZyBhICogWElNQS1UZXh0LUVsZW1lbnQgYXMgdGhlIGhlYWRlciB3aWxsIHByb3ZpZGVcbiAgICogdGhlIFhJTUEtVGV4dC9IVE1MLUVkaXRvciBmb3IgY3JlYXRpbmcgdGhlIGhlYWRlcidzIGNvbnRlbnQuXG4gICAqXG4gICAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIEZvbGRlZDogICAgICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZXMgd2hldGhlciB0aGlzIHBhbmVsIGlzIGZvbGRlZCAoVFJVRSkgb3IgdW5mb2xkZWQgKGV2ZXJ5dGhpbmcgZWxzZSkgd2hlblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXQgaXMgbG9hZGVkIChkZWZhdWx0cyB0byBUUlVFKS5cbiAgICogIC0gQ1NTSGVhZGVySG92ZXI6ICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCBoZWFkZXIncyBDU1M6aG92ZXIgKGRlZmF1bHRzIHRvIHsgc2NhbGUgOiAxLjEgO30pLlxuICAgKiAgLSBDU1NIZWFkZXJBY3RpdmU6ICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbmFsIGhlYWRlcidzIENTUzphY3RpdmUgKGRlZmF1bHRzIHRvIHsgc2NhbGUgOiAuOSA7fSkuXG4gICAqICAtIENTU0hlYWRlclVuZm9sZGVkOiAgICAgICAgICAgICAgICBUaGUgb3B0aW9uYWwgQ1NTIHRvIGJlIGFwcGxpZWQgb250byB0aGUgaGVhZGVyIHdoZW4gdGhlIHBhbmVsIGlzIHVuZm9sZGVkLlxuICAgKiAgLSBEQ1NTSGVhZGVyVW5mb2xkZWQ6ICAgICAgICAgICAgICAgVGhlIG9wdGlvbmFsIERhcmttb2RlIENTUyB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogIC0gQ1NTQW5pbUZhZGVJTlBhbmVsOiAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCBhbmltYXRpb24gdG8gYmUgYXBwbGllZCBvbnRvIHRoZSBwYW5lbCB3aGVuZXZlciB0aGUgcGFuZWxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIHVuZm9sZGVkLlxuICAgKiAgLSBDU1NBbmltRmFkZUlOUGFuZWxEdXJhdGlvbjogICAgICAgVGhlIG9wdGlvbmFsIGFuaW1hdGlvbidzIGR1cmF0aW9uIHRoYXQgaXMgYXBwbGllZCBvbnRvIHRoZSBwYW5lbCB3aGVuZXZlclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHBhbmVsIGlzIHVuZm9sZGVkIChkZWZhdWx0cyB0byAwcykuXG4gICAqICAtIENTU0FuaW1GYWRlSU5QYW5lbEVhc2luZzogICAgICAgICBUaGUgb3B0aW9uYWwgYW5pbWF0aW9uJ3MgZWFzaW5nIGZ1bmN0aW9uIHRoYXQgaXMgYXBwbGllZCBvbnRvIHRoZSBwYW5lbFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbmV2ZXIgdGhlIHBhbmVsIGlzIHVuZm9sZGVkIChkZWZhdWx0cyB0byBcImVhc2UtaW4tb3V0XCIpLlxuICAgKiAgLSBDU1NBZnRlckhlYWRlcjogICAgICAgICAgICAgICAgICAgVGhlIENTUzphZnRlciB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWQuXG4gICAqICAtIENTU0JlZm9yZUhlYWRlcjogICAgICAgICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTQWZ0ZXJIZWFkZXJDb250ZW50OiAgICAgICAgICAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWQuXG4gICAqICAtIENTU0JlZm9yZUhlYWRlckNvbnRlbnQ6ICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSBjb250ZW50IHRvIGJlIGFwcGxpZWQgb250byB0aGUgaGVhZGVyIHdoZW4gdGhlIHBhbmVsIGlzIGZvbGRlZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTQWZ0ZXJIZWFkZXJDb250ZW50VW5mb2xkZWQ6ICAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogIC0gQ1NTQmVmb3JlSGVhZGVyQ29udGVudFVuZm9sZGVkOiAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTUmVxdWlyZWRGaWVsZHNDb250ZW50OiAgICAgICAgIFRoZSBDU1M6YmVmb3JlIGNvbnRlbnQgdG8gYXBwbGllZCBvbnRvIHRoZSBoZWFkZXIgaWYgaXQgY29udGFpbnMgYSB2YWxpZGF0aW9uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5zaXRpdmUgZmllbGQuXG4gICAqICAtIENTU1JlcXVpcmVkRmllbGRzOiAgICAgICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSB0byBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciBpZiBpdCBjb250YWlucyBhIHZhbGlkYXRpb25cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbnNpdGl2ZSBmaWVsZC5cbiAgICogIC0gQXV0b0hlYWRlclRpdGxlOiAgICAgICAgICAgICAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH10aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVhZGVyIHNoYWxsIGRpc3BsYXkuXG4gICAqICAtIEF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnRzU3BhY2VyICBUaGUge0BsaW5rIHN0cmluZyB9IHNlcGFyYXRpbmcgdGhlIGFjdHVhbCB0aXRsZSBmb3JtIGFsbCB7QGxpbmsgc3RyaW5nIH1zXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0J3JlIHN1cHBsZW1lbnRlZCAnY2F1c2UgdGhleSdyZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudC52YWx1ZSB9cyBvZlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfXMgdGFnZ2VkIHdpdGggdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1MtQ2xhc3MgKipDb2RCaV9IVE1MX1BhbmVsX0F1dG9IZWFkZXJUaXRsZV9TdXBwbGVtZW50Kiogd2l0aG91dCBhbnlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqWEZpZWxkU2V0KipzIG9yICoqWENvbnRhaW5lcioqIGluIGJldHdlZW4uXG4gICAqICAtIEF1dG9IZWFkZXJMZXZlbDogICAgICAgICAgICAgICAgICBXaGljaCBsZXZlbCBvZiBlbmNsb3NpbmcgXFw8aD5zIHRoZSBcIkF1dG9IZWFkZXJUaXRsZVwiIHNoYWxsIGhhdmUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmcuIHRvIGdldCBhIFxcPGgxPiBlbmNsb3N1cmUgdGhlIHZhbHVlIGhhcyB0byBiZSAxLlxuICAgKiAgLSBTY3JvbGxCbG9jazogICAgICAgICAgICAgICAgICAgICAgRGVmaW5lcyB0aGUgbG9naWNhbCBwb3NpdGlvbiB0byBzY3JvbGwgdG8gd2hlbiB0aGUgcGFuZWxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIHVuZm9sZGVkIChzdGFydCwgY2VudGVyLCBlbmQsIG5lYXJlc3QpLiBEZWZhdWx0cyB0byBcIm5lYXJlc3RcIi5cbiAgICogIC0gR2VuZXJhdGVIZWFkZXI6ICAgICAgICAgICAgICAgICAgIFN0YXRlcyB3aGV0aGVyIGEgaGVhZGVyIHNoYWxsIGJlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBEZWZhdWx0cyB0byBGQUxTRS5cbiAgICogIC0gU2Nyb2xsICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0YXRlcyB3aGV0aGVyIHRoZSB2aWV3IHNoYWxsIGJlIHNjcm9sbGVkIHdoZW4gdGhlIHBhbmVsIHVuZm9sZHMuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0IGlzIEZBTFNFLlxuICAgKiAgLSBBY2NvcmRpb24gICAgICAgICAgICAgICAgICAgICAgICAgSWYgc2V0LCB0aGlzIHBhbmVsIGJlY29tZXMgcGFydCBvZiBhbiBhY2NvcmRpb24uIEFsbCBwYW5lbHMgc2hhcmluZyB0aGUgc2FtZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3JkaW9uIG5hbWUgd2lsbCBiZSBmb2xkZWQgd2hlbiBvbmUgb2YgdGhlbSBpcyB1bmZvbGRlZC5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB7QGxpbmsgQ29kQmkuY2hlY2tBdHRyaWJ1dGVzIH0gLyB7QGxpbmsgQ29kQmkubG9hZENvbmZpZyB9LlxuICAgKiBAcGFyYW0gdG9Qcm9jZXNzIFByb3ZpZGVkIGJ5IHtAbGluayBDb2RCaS5jaGVja0F0dHJpYnV0ZXMgfSAvIHtAbGluayBDb2RCaS5sb2FkQ29uZmlnIH0uXG4gICAqXG4gICAqIEB0aHJvd3MgIEEge0BsaW5rIENvZEJpRXJyb3IgfSBpZiB0aGUgdGFnZ2VkIHtAbGluayBFbGVtZW50IH0gZG9lcyBub3QgY29udGFpblxuICAgKiAgICAgICAgICBhIGNoaWxkIG9mIENTUy1DbGFzcyBcIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIuKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KFxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmtleVBhdGgsIFwicGF0aFwiKVxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLnByb3BlcnR5LCBcInByb3BlcnR5XCIpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcbiAgICBASU5TVEFOQ0UuUFJFKEhUTUxEaXZFbGVtZW50KVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdW5kZWZpbmVkIHtcbiAgICBpZiAoWEZDX01FVEFEQVRBLnJlcXVlc3RUeXBlID09PSBcInByaW50XCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgaGVhZGVyOiBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgICBpZiAoXG4gICAgICB0b0xvYWQuZ2VuZXJhdGVoZWFkZXIgJiZcbiAgICAgIHRvUHJvY2Vzcy5jaGlsZHJlbi5sZW5ndGggPiAwICYmXG4gICAgICAodG9Mb2FkLmdlbmVyYXRlaGVhZGVyIGFzIHN0cmluZykudG9Mb2NhbGVMb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCJcbiAgICApIHtcbiAgICAgIC8vICNyZWdpb24gTm9ybWFsaXplIFsgdG9Mb2FkLnNjcm9sbCBdLlxuICAgICAgaWYgKHRvTG9hZC5zY3JvbGwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0b0xvYWQuc2Nyb2xsID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHRvTG9hZC5zY3JvbGwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0b0xvYWQuc2Nyb2xsID0gKHRvTG9hZC5zY3JvbGwgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpLnRyaW0oKSA9PT0gXCJ0cnVlXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gTm9ybWFsaXplIFsgdG9Mb2FkLnNjcm9sbCBdLlxuICAgICAgLy8gI3JlZ2lvbiBOb3JtYWxpemUgWyB0b0xvYWQuc2Nyb2xsYmxvY2sgXS5cbiAgICAgIGlmICh0b0xvYWQuc2Nyb2xsICYmIHRvTG9hZC5zY3JvbGxibG9jayAmJiB0eXBlb2YgdG9Mb2FkLnNjcm9sbGJsb2NrID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRvTG9hZC5zY3JvbGxibG9jayA9IHRvTG9hZC5zY3JvbGxibG9jay50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICB0b0xvYWQuc2Nyb2xsICYmXG4gICAgICAgIHRvTG9hZC5zY3JvbGxibG9jayAhPT0gXCJzdGFydFwiICYmXG4gICAgICAgIHRvTG9hZC5zY3JvbGxibG9jayAhPT0gXCJjZW50ZXJcIiAmJlxuICAgICAgICB0b0xvYWQuc2Nyb2xsYmxvY2sgIT09IFwiZW5kXCIgJiZcbiAgICAgICAgdG9Mb2FkLnNjcm9sbGJsb2NrICE9PSBcIm5lYXJlc3RcIlxuICAgICAgKSB7XG4gICAgICAgIHRvTG9hZC5zY3JvbGxibG9jayA9IFwibmVhcmVzdFwiO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBOb3JtYWxpemUgWyB0b0xvYWQuc2Nyb2xsYmxvY2sgXS5cbiAgICAgIGNvbnN0IHdycEhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgIHdycEhlYWRlci5jbGFzc0xpc3QuYWRkKFwiY0hlYWRlclwiKTtcblxuICAgICAgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgY29uc3QgbGVnZW5kID0gdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3IoXCJsZWdlbmRcIik7XG5cbiAgICAgIHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyID0gdG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXJcbiAgICAgICAgPyAodG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nKVxuICAgICAgICA6IFwiIC8gXCI7XG5cbiAgICAgIGxldCBhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50ID0gdG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nO1xuXG4gICAgICBjb25zdCBzdXBwbGVtZW50cyA9IHRvUHJvY2Vzcy5xdWVyeVNlbGVjdG9yQWxsKFwiLkNvZEJpX0hUTUxfUGFuZWxfQXV0b0hlYWRlclRpdGxlX1N1cHBsZW1lbnRcIik7XG4gICAgICBjb25zdCBjb25zdHJ1Y3RIZWFkZXJTdXBwbGVtZW50cyA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdXBwbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQgKz0gYCR7KHN1cHBsZW1lbnRzW2ldIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID09PSBcIlwiIHx8IGkgPT09IDAgPyBcIlwiIDogXCIsIFwifSR7KHN1cHBsZW1lbnRzW2ldIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlfWA7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3VwcGxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc0NsYXNzSW5CZXR3ZWVuKFwiWEZpZWxkU2V0XCIsIHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCwgc3VwcGxlbWVudHNbaV0gYXMgSFRNTEVsZW1lbnQpICYmXG4gICAgICAgICAgIWlzQ2xhc3NJbkJldHdlZW4oXCJYQ29udGFpbmVyXCIsIHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCwgc3VwcGxlbWVudHNbaV0gYXMgSFRNTEVsZW1lbnQpXG4gICAgICAgICkge1xuICAgICAgICAgIHN1cHBsZW1lbnRzW2ldLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50ID0gdG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nO1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3RIZWFkZXJTdXBwbGVtZW50cygpO1xuXG4gICAgICAgICAgICBoZWFkZXIuaW5uZXJIVE1MID0gYCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbCA/IGA8aCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbH0+YCA6IFwiXCJ9JHt0b0xvYWQuYXV0b2hlYWRlcnRpdGxlID8gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGUgYXMgc3RyaW5nKSArIChhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50Lmxlbmd0aCAhPT0gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZykubGVuZ3RoID8gYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCA6IFwiXCIpIDogdG9Qcm9jZXNzLnRhZ05hbWUgPT09IFwiRklFTERTRVRcIiA/IChsZWdlbmQuaW5uZXJIVE1MICsgKGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQubGVuZ3RoID09PSAodG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nKS5sZW5ndGggPyBcIlwiIDogYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCkpIDogXCJcIn0ke3RvTG9hZC5hdXRvaGVhZGVybGV2ZWwgPyBgPC9oJHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsfT5gIDogXCJcIn1gO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cnVjdEhlYWRlclN1cHBsZW1lbnRzKCk7XG5cbiAgICAgIGhlYWRlci5pbm5lckhUTUwgPSBgJHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsID8gYDxoJHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsfT5gIDogXCJcIn0ke3RvTG9hZC5hdXRvaGVhZGVydGl0bGUgPyAodG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZSBhcyBzdHJpbmcpICsgKGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQubGVuZ3RoICE9PSAodG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nKS5sZW5ndGggPyBhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50IDogXCJcIikgOiB0b1Byb2Nlc3MudGFnTmFtZSA9PT0gXCJGSUVMRFNFVFwiID8gKGxlZ2VuZCA/IHRvUHJvY2Vzcy5xdWVyeVNlbGVjdG9yKFwibGVnZW5kXCIpPy5pbm5lckhUTUwgKyAoYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudC5sZW5ndGggPT09ICh0b0xvYWQuYXV0b2hlYWRlcnRpdGxlc3VwbGVtZW50c3NwYWNlciBhcyBzdHJpbmcpLmxlbmd0aCA/IFwiXCIgOiBhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50KSA6IFwiXCIpIDogXCJcIn0ke3RvTG9hZC5hdXRvaGVhZGVybGV2ZWwgPyBgPC9oJHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsfT5gIDogXCJcIn1gO1xuXG4gICAgICBpZiAobGVnZW5kKSB7XG4gICAgICAgIGxlZ2VuZC5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgaGVhZGVyLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIHRvTG9hZC5hdXRvaGVhZGVyY3NzIGFzIHN0cmluZyk7XG4gICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpO1xuXG4gICAgICB3cnBIZWFkZXIuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICAgIHRvUHJvY2Vzcy5pbnNlcnRCZWZvcmUod3JwSGVhZGVyLCB0b1Byb2Nlc3MuZmlyc3RDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlciA9IHRvUHJvY2Vzcy5xdWVyeVNlbGVjdG9yKFwiLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpO1xuICAgIH1cblxuICAgIGlmIChoZWFkZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBDb2RCaUVycm9yKFxuICAgICAgICBgVGFnZ2VkIDxkaXY+IFwiJHt0b1Byb2Nlc3MuZ2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpfVwiIGNvbnRhaW5zIG5vIEhUTUwtRWxlbWVudCB0YWdnZWQgd2l0aCBDU1MtXCJDb2RCaV9IVE1MX1BhbmVsX0hlYWRlclwiLmAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyID0gaGVhZGVyO1xuXG4gICAgICB0b1Byb2Nlc3MuY2xhc3NMaXN0LmFkZChcIi0tSFRNTF9QYW5lbFwiKTtcblxuICAgICAgY29uc3Qgc3R5SGVhZGVyOiBzdHJpbmcgfCBudWxsID0gaGVhZGVyLmdldEF0dHJpYnV0ZShcInN0eWxlXCIpO1xuICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgd2hlcmUgdG8gcmUtaW5zZXJ0IHRoZSBoZWFkZXIgd2hlbiBwYW5lbCBnZXRzIHVuZm9sZGVkLlxuICAgICAgY29uc3QgY2hpbGRBcnJheSA9IEFycmF5LmZyb20odG9Qcm9jZXNzLmNoaWxkcmVuKTtcbiAgICAgIGNvbnN0IGlkeEhlYWRlciA9IGNoaWxkQXJyYXkuaW5kZXhPZihoZWFkZXIucGFyZW50RWxlbWVudCk7XG4gICAgICBjb25zdCBoZWFkZXJBZnRlckVsZW1lbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgPVxuICAgICAgICBpZHhIZWFkZXIgPT09IGNoaWxkQXJyYXkubGVuZ3RoIC0gMSA/IHVuZGVmaW5lZCA6IGNoaWxkQXJyYXlbaWR4SGVhZGVyXTtcblxuICAgICAgaWYgKGhlYWRlckFmdGVyRWxlbWVudCkge1xuICAgICAgICBIVE1MX1BhbmVsLm1hcEhlYWRlckFmdGVyRWxlbWVudHMuc2V0KHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCwgaGVhZGVyQWZ0ZXJFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIHdoZXJlIHRvIHJlLWluc2VydCB0aGUgaGVhZGVyIHdoZW4gcGFuZWwgZ2V0cyB1bmZvbGRlZC5cbiAgICAgIGNvbnN0IGJ1ZmZlckRpc3BsYXkgPSAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5kaXNwbGF5OyAvLyBTdG9yZSBpbiBvcmRlciB0byByZXN0b3JlIGl0IGxhdGVyIG9uLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdlYXRoZXIgaW5pdGlhbGx5IGZvbGRlZCBvciBub3QuXG4gICAgICAodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkID0gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXG4gICAgICAgIFwiZmMtcHJpbnQtbW9kZVwiLFxuICAgICAgKVxuICAgICAgICA/IGZhbHNlXG4gICAgICAgIDogdG9Mb2FkLmZvbGRlZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyAodG9Mb2FkLmZvbGRlZCBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkudHJpbSgpID09PSBcInRydWVcIlxuICAgICAgICAgIDogZmFsc2U7XG4gICAgICAvLyAjcmVnaW9uIENvbnNpZGVyIGluaXRpYWwgZm9sZGluZyBzdGF0ZS5cbiAgICAgIGlmICgodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkKSB7XG4gICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgaGVhZGVyPy5yZW1vdmUoKTtcbiAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudD8uYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0b0xvYWQuY3NzaGVhZGVydW5mb2xkZWQpIHtcbiAgICAgICAgICBoZWFkZXI/LnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIHRvTG9hZC5jc3NoZWFkZXJ1bmZvbGRlZCBhcyBzdHJpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkKSB7XG4gICAgICAgIHRvUHJvY2Vzcy5jbGFzc0xpc3QuYWRkKFwiLS1mb2xkZWRcIik7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIENvbnNpZGVyIGluaXRpYWwgZm9sZGluZyBzdGF0ZS5cbiAgICAgIC8vICNyZWdpb24gSW5qZWN0IG5lY2Vzc2FyeSBzdHlsZXMuXG4gICAgICAvLyAjcmVnaW9uIERldGVybWluZSBcInRvUHJvY2Vzc1wiJ3MgcGFyZW50J3MgaWQtQXR0cmlidXRlLlxuICAgICAgLy8gVGhpcyB3aWxsIGJlIHRoZSBpZCBvZiBcInRvUHJvY2Vzc1wiLCBpZiBcInRvUHJvY2Vzc1wiIGlzIGEgZmllbGRzZXQuXG4gICAgICBsZXQgcGFyZW50SUQgPSBoZWFkZXIucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIik7XG5cbiAgICAgIGlmIChwYXJlbnRJRCA9PT0gbnVsbCkge1xuICAgICAgICBwYXJlbnRJRCA9IHRvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIFwidG9Qcm9jZXNzXCIncyBwYXJlbnQncyBpZC1BdHRyaWJ1dGUuXG4gICAgICAvLyAjcmVnaW9uIEdlbmVyYXRpb24uXG4gICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcblxuICAgICAgc3R5bGUuaW5uZXJIVE1MID0gYFxuICAgICAgQG1lZGlhKCBwcmludCApIHtcbiAgICAgICAgIyR7cGFyZW50SUR9LkNvZEJpLi0tSFRNTF9QYW5lbCB7IGRpc3BsYXkgOiAke2J1ZmZlckRpc3BsYXl9ICFpbXBvcnRhbnQgO31cbiAgICAgIH1cblxuICAgICAgLkNvZEJpX0hUTUxfUGFuZWxfTWlzc2luZ1JlcXVpcmVkRmllbGQgeyBib3JkZXItbGVmdC1zdHlsZTogc29saWQgIWltcG9ydGFudCA7IGJvcmRlci1yaWdodC1zdHlsZTogc29saWQgIWltcG9ydGFudCA7IHBhZGRpbmc6IC41ZW0gOyBib3gtc2hhZG93OiAwIDAgLjI1ZW0gZGFya29yYW5nZSA7IGJvcmRlci1jb2xvcjogcmVkICFpbXBvcnRhbnQgO31cblxuICAgICAgQG1lZGlhKCBwcmVmZXJzLWNvbG9yLXNjaGVtZSA6IGRhcmsgKSB7XG4gICAgICAgIC5Db2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkIHsgYm9yZGVyLWxlZnQtc3R5bGU6IHNvbGlkICFpbXBvcnRhbnQgOyBib3JkZXItcmlnaHQtc3R5bGU6IHNvbGlkICFpbXBvcnRhbnQgOyBwYWRkaW5nOiAuNWVtIDsgYm94LXNoYWRvdzogMCAwIC4yNWVtIGRhcmtvcmFuZ2UgOyBib3JkZXItY29sb3I6IGRhcmtvcmFuZ2UgIWltcG9ydGFudCA7fVxuXG4gICAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXIgeyAke3RvTG9hZC5kY3NzaGVhZGVydW5mb2xkZWQgPyB0b0xvYWQuZGNzc2hlYWRlcnVuZm9sZGVkIDogXCJiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTMwZGVnLCByZ2JhKDUsIDUsIDUsIDEpIDAlLCByZ2JhKDU2LCA0NywgNDcsIDEpIDIzJSwgcmdiYSg4NCwgNjIsIDYyLCAxKSA1NSUsIHJnYmEoNTYsIDUyLCA1MiwgMSkgODklLCByZ2JhKDAsIDAsIDAsIDEpIDEwMCUpICFpbXBvcnRhbnQgO1wifX19XG5cbiAgICAgIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlciA+IHAgeyBtYXJnaW4gOiAwIDt9XG5cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6YWZ0ZXIsXG4gICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjphZnRlciB7XG4gICAgICAgIGNvbnRlbnQgOiBcIiR7dG9Mb2FkLmNzc2FmdGVyaGVhZGVyY29udGVudCA/IHRvTG9hZC5jc3NhZnRlcmhlYWRlcmNvbnRlbnQgOiBcIlwifVwiO1xuXG4gICAgICAgICR7dG9Mb2FkLmNzc2FmdGVyaGVhZGVyID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVyIDogXCJcIn1cbiAgICAgIH1cblxuICAgICAgIyR7cGFyZW50SUR9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUsXG4gICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUge1xuICAgICAgICBjb250ZW50IDogXCIke3RvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50ID8gdG9Mb2FkLmNzc2JlZm9yZWhlYWRlcmNvbnRlbnQgOiBcIlwifVwiO1xuXG4gICAgICAgICR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlciA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXIgOiBcIlwifVxuICAgICAgfVxuXG4gICAgICAjJHtwYXJlbnRJRH0gLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOmhvdmVyLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpob3ZlciAgICAgeyAke3RvTG9hZC5jc3NoZWFkZXJob3ZlciA/IHRvTG9hZC5jc3NoZWFkZXJob3ZlciA6IFwiY29sb3I6IGRhcmtvcmFuZ2UgO1wifX1cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6aG92ZXIgPiAqLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpob3ZlciA+ICogeyAke3RvTG9hZC5jc3NoZWFkZXJob3ZlciA/IFwiXCIgOiBcIm1hcmdpbi1sZWZ0OiA1JSA7IHRyYW5zaXRpb246IC41cyBhbGwgO1wifX1cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6YWN0aXZlLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjphY3RpdmUgICAgeyAke3RvTG9hZC5jc3NoZWFkZXJhY3RpdmUgPyB0b0xvYWQuY3NzaGVhZGVyYWN0aXZlIDogXCJzY2FsZSA6IC45IDtcIn19XG5cbiAgICAgICR7XG4gICAgICAgIHRvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxcbiAgICAgICAgICA/IGBAa2V5ZnJhbWVzIENvZEJpX0ZhZGVJTl9QYW5lbF8ke3BhcmVudElEfSB7XG4gICAgICAgICAgJHt0b0xvYWQuY3NzYW5pbWZhZGVpbnBhbmVsfX1gXG4gICAgICAgICAgOiBcIlwiXG4gICAgICB9XG5cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmkuLS1IVE1MX1BhbmVsLFxuICAgICAgIyR7cGFyZW50SUR9LkNvZEJpLi0tSFRNTF9QYW5lbCAgICB7IGFuaW1hdGlvbiA6IENvZEJpX0ZhZGVJTl9QYW5lbF8ke3BhcmVudElEfSAke3RvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxkdXJhdGlvbiA/IHRvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxkdXJhdGlvbiA6IFwiMHNcIn0gJHt0b0xvYWQuY3NzYW5pbWZhZGVpbnBhbmVsZWFzaW5nID8gdG9Mb2FkLmNzc2FuaW1mYWRlaW5wYW5lbGVhc2luZyA6IFwiZWFzZS1pbi1vdXRcIn0gZm9yd2FyZHMgO31gO1xuXG4gICAgICBjb25zdCBzdHlsZUFmdGVyVW5mb2xkZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgIHN0eWxlQWZ0ZXJVbmZvbGRlZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICMke3BhcmVudElEfSA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjphZnRlcixcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gKiA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjphZnRlciB7XG4gICAgICAgICAgY29udGVudCA6IFwiJHt0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgPyB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgOiB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50ID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVyY29udGVudCA6IFwiXCJ9XCI7XG5cbiAgICAgICAgICAke3RvTG9hZC5jc3NhZnRlcmhlYWRlcnVuZm9sZGVkID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVydW5mb2xkZWQgOiB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXIgPyB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXIgOiBcIlwifX1gO1xuXG4gICAgICBjb25zdCBzdHlsZUJlZm9yZVVuZm9sZGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgICBzdHlsZUJlZm9yZVVuZm9sZGVkLmlubmVySFRNTCA9IGBcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gc3R5bGUgKyAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6OmJlZm9yZSxcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gKiA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjpiZWZvcmUge1xuICAgICAgICAgIGNvbnRlbnQgOiBcIiR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlcmNvbnRlbnR1bmZvbGRlZCA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50dW5mb2xkZWQgOiB0b0xvYWQuY3NzYmVmb3JlaGVhZGVyY29udGVudCA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50IDogXCJcIn1cIjtcblxuICAgICAgICAgICR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlcnVuZm9sZGVkID8gdG9Mb2FkLmNzc2JlZm9yZWhlYWRlcnVuZm9sZGVkIDogdG9Mb2FkLmNzc2JlZm9yZWhlYWRlciA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXIgOiBcIlwifX1gO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBHZW5lcmF0aW9uLlxuICAgICAgLy8gI3JlZ2lvbiBBY3R1YWwgaW5qZWN0aW9uLlxuICAgICAgaGVhZGVyLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShzdHlsZSwgaGVhZGVyKTtcblxuICAgICAgaWYgKHRvTG9hZC53cmFwcGVyY3NzICYmIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJYRmllbGRTZXRXcmFwcGVyXCIpKSB7XG4gICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCB0b0xvYWQud3JhcHBlcmNzcyBhcyBzdHJpbmcpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBBY3R1YWwgaW5qZWN0aW9uLlxuICAgICAgLy8gI2VuZHJlZ2lvbiBJbmplY3QgbmVjZXNzYXJ5IHN0eWxlcy5cbiAgICAgIC8vICNyZWdpb24gSGFuZGxlIGNsaWNrcyBvbiB0aGUgaGVhZGVyLlxuICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQpIHtcbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkID0gIShcbiAgICAgICAgICAgIHRvUHJvY2VzcyBhcyB1bmtub3duIGFzIHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9XG4gICAgICAgICAgKS5Db2RCaV9IVE1MX1BhbmVsX0ZvbGRlZDtcbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gYnVmZmVyRGlzcGxheTtcblxuICAgICAgICAgIGhlYWRlcj8ucmVtb3ZlKCk7XG5cbiAgICAgICAgICBpZiAodG9Mb2FkLmNzc2hlYWRlcnVuZm9sZGVkKSB7XG4gICAgICAgICAgICBoZWFkZXIuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgdG9Mb2FkLmNzc2hlYWRlcnVuZm9sZGVkIGFzIHN0cmluZyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGhlYWRlckFmdGVyRWxlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5pbnNlcnRCZWZvcmUoaGVhZGVyLCBoZWFkZXJBZnRlckVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgfHwgdG9Mb2FkLmNzc2FmdGVyaGVhZGVydW5mb2xkZWQpIHtcbiAgICAgICAgICAgIGhlYWRlci5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUoc3R5bGVBZnRlclVuZm9sZGVkLCBoZWFkZXIpO1xuICAgICAgICAgICAgaGVhZGVyLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShzdHlsZUJlZm9yZVVuZm9sZGVkLCBoZWFkZXIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0xvYWQuc2Nyb2xsKSB7XG4gICAgICAgICAgICB0b1Byb2Nlc3Muc2Nyb2xsSW50b1ZpZXcoe1xuICAgICAgICAgICAgICBiZWhhdmlvcjogXCJzbW9vdGhcIixcbiAgICAgICAgICAgICAgYmxvY2s6IHRvTG9hZC5zY3JvbGxibG9jayBhcyBTY3JvbGxMb2dpY2FsUG9zaXRpb24sXG4gICAgICAgICAgICAgIGlubGluZTogXCJuZWFyZXN0XCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgYWNjb3JkaW9ucyBlbmFibGluZyBsaXZlIGNoYW5nZXMuXG4gICAgICAgICAgaWYgKHRvUHJvY2Vzcy5oYXNBdHRyaWJ1dGUoXCJkYXRhLWNiLWFjY29yZGlvblwiKSkge1xuICAgICAgICAgICAgdG9Mb2FkLmFjY29yZGlvbiA9IHRvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNiLWFjY29yZGlvblwiKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0b0ZvbGQgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgICAgICAgYC5Db2RCaS4tLUhUTUxfUGFuZWxbIGRhdGEtY2ItYWNjb3JkaW9uID0gXCIke3RvTG9hZC5hY2NvcmRpb24gYXMgc3RyaW5nfVwiXTpub3QoLi0tZm9sZGVkKWAsXG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgIHRvRm9sZFxuICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yKFwiLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpXG4gICAgICAgICAgICAgICAgPy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgYWNjb3JkaW9ucyBlbmFibGluZyBsaXZlIGNoYW5nZXMuXG4gICAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LnJlbW92ZShcIi0tZm9sZGVkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQgPSAhKFxuICAgICAgICAgICAgdG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH1cbiAgICAgICAgICApLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkO1xuICAgICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgICAgICAgIGhlYWRlci5yZW1vdmUoKTtcblxuICAgICAgICAgIGlmIChzdHlIZWFkZXIpIHtcbiAgICAgICAgICAgIGhlYWRlci5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBzdHlIZWFkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgICAgICAgaWYgKHRvTG9hZC5jc3NhZnRlcmhlYWRlcmNvbnRlbnR1bmZvbGRlZCB8fCB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJ1bmZvbGRlZCkge1xuICAgICAgICAgICAgc3R5bGVBZnRlclVuZm9sZGVkLnJlbW92ZSgpO1xuICAgICAgICAgICAgc3R5bGVCZWZvcmVVbmZvbGRlZC5yZW1vdmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QuYWRkKFwiLS1mb2xkZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgY2xpY2tzIG9uIHRoZSBoZWFkZXIuXG4gICAgICAvLyAjcmVnaW9uIFJlcXVpcmVkIGZpZWxkcyBoYW5kbGluZyAodmFsaWRhdGlvbiBoYW5kbGluZykuXG4gICAgICBsZXQgcmVxdWlyZWRGaWVsZHNDb250YWluZWQgPSBmYWxzZTtcblxuICAgICAgZm9yIChjb25zdCByZXF1aXJlZCBvZiB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvckFsbCgnWyBhcmlhLXJlcXVpcmVkID0gXCJ0cnVlXCJdJykpIHtcbiAgICAgICAgLy9IVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5wdXNoKHJlcXVpcmVkIGFzIEhUTUxFbGVtZW50KTtcblxuICAgICAgICByZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCkge1xuICAgICAgICAvLyAjcmVnaW9uIFN0eWxlIGdlbmVyYXRpb24gJiBpbmplY3Rpb24uXG4gICAgICAgIGNvbnN0IHN0eWxlUmVxdWlyZWRGaWVsZHNDb250YWluZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgICAgc3R5bGVSZXF1aXJlZEZpZWxkc0NvbnRhaW5lZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgIyR7cGFyZW50SUR9ID4gLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOmJlZm9yZSxcbiAgICAgICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9ID4gKiA+IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUge1xuICAgICAgICAgICAgY29udGVudCA6IFwiJHt0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHNjb250ZW50ID8gdG9Mb2FkLmNzc3JlcXVpcmVkZmllbGRzY29udGVudCA6IFwiKlwifVwiO1xuXG4gICAgICAgICAgJHt0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHMgPyB0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHMgOiBcImNvbG9yIDogcmVkIDsgcG9zaXRpb24gOiByZWxhdGl2ZSA7IHRvcCA6IC41ZW0gO1wifX1gO1xuXG4gICAgICAgIGhlYWRlci5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUoc3R5bGVSZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCwgaGVhZGVyKTtcbiAgICAgICAgLy8gI3JlZ2lvbiBTdHlsZSBnZW5lcmF0aW9uICYgaW5qZWN0aW9uLlxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBSZXF1aXJlZCBmaWVsZHMgaGFuZGxpbmcgKHZhbGlkYXRpb24gaGFuZGxpbmcpLlxuICAgICAgLy8gI3JlZ2lvbiBQcmV2ZW50IGZvcm0gc3VibWlzc2lvbiBhcyBsb25nIGFzIHRoZXJlJ3JlIGludmFsaWQgZmllbGRzLlxuICAgICAgZ2V0WFV0aWwoKS5vbihcInN1Ym1pdFwiLCAocGFyYW1zKSA9PiB7XG4gICAgICAgIC8vICNyZWdpb24gVW50YWcgbWlzc2luZyByZXF1aXJlZCBmaWVsZHMuXG4gICAgICAgIGZvciAoY29uc3QgdW50YWcgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5Db2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkXCIpKSB7XG4gICAgICAgICAgdW50YWcuY2xhc3NMaXN0LnJlbW92ZShcIkNvZEJpX0hUTUxfUGFuZWxfTWlzc2luZ1JlcXVpcmVkRmllbGRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBVbnRhZyBtaXNzaW5nIHJlcXVpcmVkIGZpZWxkcy5cbiAgICAgICAgbGV0IHJlYWxseUludmFsaWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbIGFyaWEtcmVxdWlyZWQgPSBcInRydWVcIl0nKSkge1xuICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgIGlmICgoY2FuZGlkYXRlIGFzIGFueSkudmFsdWUgPT09IFwiXCIgfHwgKGNhbmRpZGF0ZSBhcyBhbnkpLnZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIEhUTUxfUGFuZWwudW5mb2xkUGFuZWxBbmNlc3RvcnMoY2FuZGlkYXRlIGFzIEhUTUxFbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKCFpc0Rpc3BsYXlOb25lKGNhbmRpZGF0ZSBhcyBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgbGV0IGNoZWNrZWRTZWxlY3Rpb24gPSBmYWxzZTtcblxuICAgICAgICAgICAgICBpZiAoY2FuZGlkYXRlLmNsYXNzTGlzdC5jb250YWlucyhcIlhTZWxlY3RcIikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBjYW5kaWRhdGUucXVlcnlTZWxlY3RvckFsbChcImlucHV0XCIpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAob3B0aW9uLmNoZWNrZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZFNlbGVjdGlvbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCFjaGVja2VkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgYW5kIGdvIHRvIHBhZ2UuXG4gICAgICAgICAgICAgICAgY29uc3QgcGFnZU5hbWUgPSBIVE1MX1BhbmVsLmRldGVybWluZVBhZ2UoY2FuZGlkYXRlIGFzIEhUTUxFbGVtZW50KT8uZ2V0QXR0cmlidXRlKFwiZGF0YS14blwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYWdlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgZ290b1BhZ2UocGFnZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlLnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6IFwic21vb3RoXCIsIGJsb2NrOiB0b0xvYWQuc2Nyb2xsYmxvY2sgYXMgU2Nyb2xsTG9naWNhbFBvc2l0aW9uIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIERldGVybWluZSBhbmQgZ28gdG8gcGFnZS5cbiAgICAgICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICAgICAoY2FuZGlkYXRlIGFzIGFueSkuZm9jdXMoKTtcblxuICAgICAgICAgICAgICAgIChjYW5kaWRhdGUgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5hZGQoXCJDb2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkXCIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJldmVudFN1Ym1pc3Npb246IHRydWUgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4geyBwcmV2ZW50U3VibWlzc2lvbjogZmFsc2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGludmFsaWQgb2YgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMpIHtcbiAgICAgICAgICAgIHJlYWxseUludmFsaWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBIVE1MX1BhbmVsLnVuZm9sZFBhbmVsQW5jZXN0b3JzKGludmFsaWQpO1xuICAgICAgICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgYW5kIGdvIHRvIHBhZ2UuXG4gICAgICAgICAgICBjb25zdCBwYWdlTmFtZSA9IEhUTUxfUGFuZWwuZGV0ZXJtaW5lUGFnZShpbnZhbGlkKT8uZ2V0QXR0cmlidXRlKFwiZGF0YS14blwiKTtcblxuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICAgIGdvdG9QYWdlKHBhZ2VOYW1lKTtcbiAgICAgICAgICAgICAgaW52YWxpZC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiBcInNtb290aFwiLCBibG9jazogdG9Mb2FkLnNjcm9sbGJsb2NrIGFzIFNjcm9sbExvZ2ljYWxQb3NpdGlvbiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIGFuZCBnbyB0byBwYWdlLlxuICAgICAgICAgICAgaW52YWxpZC5mb2N1cygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7IHByZXZlbnRTdWJtaXNzaW9uOiByZWFsbHlJbnZhbGlkIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBQcmV2ZW50IGZvcm0gc3VibWlzc2lvbiBhcyBsb25nIGFzIHRoZXJlJ3JlIGludmFsaWQgZmllbGRzLlxuICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgdW5mb2xkaW5nIG9mIHBhbmVscyBjb250YWluaW5nIGludmFsaWQgZmllbGRzLlxuICAgICAgaWYgKCFIVE1MX1BhbmVsLnZhbGlkYXRvclJlZ2lzdGVyZWQpIHtcbiAgICAgICAgeG1fdmFsaWRhdG9yLm9uKFwiYmVnaW5cIiwgKGRhdGEpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YS5pdGVtcykge1xuICAgICAgICAgICAgaWYgKCFIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5pbmNsdWRlcyhpdGVtKSAmJiBpdGVtLmdldEF0dHJpYnV0ZShcImFyaWEtaW52YWxpZFwiKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICAgICAgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKEhUTUxfUGFuZWwuaW52YWxpZEVsZW1lbnRzLmluY2x1ZGVzKGl0ZW0pICYmIGl0ZW0uZ2V0QXR0cmlidXRlKFwiYXJpYS1pbnZhbGlkXCIpID09PSBcImZhbHNlXCIpIHtcbiAgICAgICAgICAgICAgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMgPSBIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5maWx0ZXIoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlICE9PSBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgdW5mb2xkaW5nIG9mIHBhbmVscyBjb250YWluaW5nIGludmFsaWQgZmllbGRzLlxuICAgIH1cbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBIVE1MX1BhbmVsIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJGdW5jdGlvbmFsaXR5IH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiSFRNTC5QYW5lbFwiLCBIVE1MX1BhbmVsLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4vLyAjcmVnaW9uIEhlbHBlclxuLyoqXG4gKiBGaW5kcyBpZiBhbiBlbGVtZW50IHdpdGggYSBzcGVjaWZpYyBjbGFzcyBleGlzdHMgYmV0d2VlbiB0d28gbm9kZXMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgc3VzcGVjdCAtIFRoZSBjbGFzcyB0byBsb29rIGZvci5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHN0YXJ0ICAgLSBUaGUgc3RhcnRpbmcgSFRNTCBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZW5kICAgICAtIFRoZSBlbmRpbmcgSFRNTCBlbGVtZW50LlxuICpcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBjbGFzcyBpcyBmb3VuZCBiZXR3ZWVuIHRoZSBub2RlcyAoZXhjbHVzaXZlKS4gKi9cbmZ1bmN0aW9uIGlzQ2xhc3NJbkJldHdlZW4oc3VzcGVjdDogc3RyaW5nLCBzdGFydDogSFRNTEVsZW1lbnQsIGVuZDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgd2hpbGUgKGVuZCAmJiBlbmQgIT09IHN0YXJ0KSB7XG4gICAgaWYgKFxuICAgICAgZW5kLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpLmluZGV4T2YoYCAke3N1c3BlY3R9IGApICE9PSAtMSB8fFxuICAgICAgZW5kLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpLmluZGV4T2YoYCAke3N1c3BlY3R9XCJgKSAhPT0gLTEgfHxcbiAgICAgIGVuZC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKS5pbmRleE9mKGBcIiR7c3VzcGVjdH0gYCkgIT09IC0xIHx8XG4gICAgICBlbmQuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikuaW5kZXhPZihgXCIke3N1c3BlY3R9XCJgKSAhPT0gLTFcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdHlsZS9ub1BhcmFtZXRlckFzc2lnbjogTm8gbmVlZCBmb3IgYSBsb2NhbCB2YXJpYWJsZSBmb3Igc3VjaCBzaG9ydCBjb2RlLlxuICAgIGVuZCA9IGVuZC5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlICoqc3VzcGVjdCoqIHtAbGluayBIVE1MRWxlbWVudCB9IGlzIGhpZGRlbiBjYXVzZSBvZiBpdCdzIG93biBvciBvbmUgb2YgaXQnUyBhbmNlc3RvcidzXG4gKiBDU1MgKipkaXNwbGF5KiogcHJvcGVydHkgaXMgc2V0IHRvICoqbm9uZSoqLlxuICpcbiAqIEBwYXJhbSBzdXNwZWN0IFRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfSB0byBjaGVjay5cbiAqXG4gKiBAcmV0dXJucyAqKlRSVUUqKiBpZiB0aGUgKipzdXNwZWN0Kioge0BsaW5rIEhUTUxFbGVtZW50IH0gaXMgaGlkZGVuLCBvdGhlcndpc2UgKipGQUxTRSoqLiAqL1xuZnVuY3Rpb24gaXNEaXNwbGF5Tm9uZShzdXNwZWN0OiBIVE1MRWxlbWVudCkge1xuICB3aGlsZSAoc3VzcGVjdCAhPT0gbnVsbCkge1xuICAgIGlmIChzdXNwZWN0LnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3R5bGUvbm9QYXJhbWV0ZXJBc3NpZ246XG4gICAgc3VzcGVjdCA9IHN1c3BlY3QucGFyZW50RWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cbi8vICNlbmRyZWdpb24gSGVscGVyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFVQSxLQUFFLFNBQVUsUUFBUSxTQUFVO0FBRTdCO0FBRUEsVUFBSyxPQUFPLFdBQVcsWUFBWSxPQUFPLE9BQU8sWUFBWSxVQUFXO0FBU3ZFLGVBQU8sVUFBVSxPQUFPLFdBQ3ZCLFFB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QUMsY0FBYyxjQUFjLElBQUk7QUFBQSxZQUNsRztBQUFBLFVBQ0Y7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFFRjtBQUFBLEVBQ0Y7QUFBQSxFQUtBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFjLGNBQXVCLE1BQU07QUFDekMsYUFBTyxPQUFPLE1BQU0sc0JBQXNCLGNBQWMsWUFBVyxhQUFhO0FBQUEsSUFDbEYsR0FBRztBQUFBO0FBQUE7QUFFTDtBQXRaZ0I7QUFBQSxFQURiLElBQUk7QUFBQSxFQUVGLHlCQUFNLElBQUksTUFBTSxPQUFPLFNBQVMsTUFBTTtBQUFBLEVBQ3RDLHlCQUFNLElBQUksTUFBTSxPQUFPLFVBQVUsVUFBVTtBQUFBLEVBRTNDLDRCQUFTLElBQUksY0FBYztBQUFBLEdBbkduQixhQStGRztBQS9GVCxJQUFNLGFBQU47QUErZlAsU0FBUyxpQkFBaUIsU0FBaUIsT0FBb0IsS0FBMkI7QUFDeEYsU0FBTyxPQUFPLFFBQVEsT0FBTztBQUMzQixRQUNFLElBQUksYUFBYSxPQUFPLEVBQUUsUUFBUSxJQUFJLE9BQU8sR0FBRyxNQUFNLE1BQ3RELElBQUksYUFBYSxPQUFPLEVBQUUsUUFBUSxJQUFJLE9BQU8sR0FBRyxNQUFNLE1BQ3RELElBQUksYUFBYSxPQUFPLEVBQUUsUUFBUSxJQUFJLE9BQU8sR0FBRyxNQUFNLE1BQ3RELElBQUksYUFBYSxPQUFPLEVBQUUsUUFBUSxJQUFJLE9BQU8sR0FBRyxNQUFNLElBQ3REO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLElBQUk7QUFBQSxFQUNaO0FBRUEsU0FBTztBQUNUO0FBUUEsU0FBUyxjQUFjLFNBQXNCO0FBQzNDLFNBQU8sWUFBWSxNQUFNO0FBQ3ZCLFFBQUksUUFBUSxNQUFNLFlBQVksUUFBUTtBQUNwQyxhQUFPO0FBQUEsSUFDVDtBQUVBLGNBQVUsUUFBUTtBQUFBLEVBQ3BCO0FBRUEsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogWyJ3aW5kb3ciLCAiaXNGdW5jdGlvbiIsICJpc1dpbmRvdyIsICJkb2N1bWVudCIsICJhcnIiLCAicHVzaCIsICJkb2N1bWVudEVsZW1lbnQiLCAicnF1aWNrRXhwciIsICJpIiwgIm1hdGNoZXMiLCAibm9kZSIsICJkaXIiLCAiZmluZCIsICJlbGVtIiwgInZhbHVlIiwgImRlZmVycmVkIiwgImRhdGEiLCAibm9kZU5hbWUiLCAibmFtZSIsICJpbmRleCIsICJsZW5ndGgiLCAidmFsIiwgImNvbXBsZXRlZCIsICJtZXRob2QiLCAidHlwZSJdCn0K
