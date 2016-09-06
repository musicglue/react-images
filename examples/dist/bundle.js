require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inlineStylePrefixerStatic = require('inline-style-prefixer/static');

var _inlineStylePrefixerStatic2 = _interopRequireDefault(_inlineStylePrefixerStatic);

var _util = require('./util');

/**
 * Generate CSS for a selector and some styles.
 *
 * This function handles the media queries, pseudo selectors, and descendant
 * styles that can be used in aphrodite styles.
 *
 * @param {string} selector: A base CSS selector for the styles to be generated
 *     with.
 * @param {Object} styleTypes: A list of properties of the return type of
 *     StyleSheet.create, e.g. [styles.red, styles.blue].
 * @param stringHandlers: See `generateCSSRuleset`
 * @param useImportant: See `generateCSSRuleset`
 *
 * To actually generate the CSS special-construct-less styles are passed to
 * `generateCSSRuleset`.
 *
 * For instance, a call to
 *
 *     generateCSSInner(".foo", {
 *       color: "red",
 *       "@media screen": {
 *         height: 20,
 *         ":hover": {
 *           backgroundColor: "black"
 *         }
 *       },
 *       ":active": {
 *         fontWeight: "bold",
 *         ">>bar": {
 *           _names: { "foo_bar": true },
 *           height: 10,
 *         }
 *       }
 *     });
 *
 * will make 5 calls to `generateCSSRuleset`:
 *
 *     generateCSSRuleset(".foo", { color: "red" }, ...)
 *     generateCSSRuleset(".foo:active", { fontWeight: "bold" }, ...)
 *     generateCSSRuleset(".foo:active .foo_bar", { height: 10 }, ...)
 *     // These 2 will be wrapped in @media screen {}
 *     generateCSSRuleset(".foo", { height: 20 }, ...)
 *     generateCSSRuleset(".foo:hover", { backgroundColor: "black" }, ...)
 */
var generateCSS = function generateCSS(selector, styleTypes, stringHandlers, useImportant) {
    var merged = styleTypes.reduce(_util.recursiveMerge);

    var declarations = {};
    var mediaQueries = {};
    var pseudoStyles = {};

    Object.keys(merged).forEach(function (key) {
        if (key[0] === ':') {
            pseudoStyles[key] = merged[key];
        } else if (key[0] === '@') {
            mediaQueries[key] = merged[key];
        } else {
            declarations[key] = merged[key];
        }
    });

    return generateCSSRuleset(selector, declarations, stringHandlers, useImportant) + Object.keys(pseudoStyles).map(function (pseudoSelector) {
        return generateCSSRuleset(selector + pseudoSelector, pseudoStyles[pseudoSelector], stringHandlers, useImportant);
    }).join("") + Object.keys(mediaQueries).map(function (mediaQuery) {
        var ruleset = generateCSS(selector, [mediaQueries[mediaQuery]], stringHandlers, useImportant);
        return mediaQuery + '{' + ruleset + '}';
    }).join("");
};

exports.generateCSS = generateCSS;
/**
 * Helper method of generateCSSRuleset to facilitate custom handling of certain
 * CSS properties. Used for e.g. font families.
 *
 * See generateCSSRuleset for usage and documentation of paramater types.
 */
var runStringHandlers = function runStringHandlers(declarations, stringHandlers) {
    var result = {};

    Object.keys(declarations).forEach(function (key) {
        // If a handler exists for this particular key, let it interpret
        // that value first before continuing
        if (stringHandlers && stringHandlers.hasOwnProperty(key)) {
            result[key] = stringHandlers[key](declarations[key]);
        } else {
            result[key] = declarations[key];
        }
    });

    return result;
};

/**
 * Generate a CSS ruleset with the selector and containing the declarations.
 *
 * This function assumes that the given declarations don't contain any special
 * children (such as media queries, pseudo-selectors, or descendant styles).
 *
 * Note that this method does not deal with nesting used for e.g.
 * psuedo-selectors or media queries. That responsibility is left to  the
 * `generateCSS` function.
 *
 * @param {string} selector: the selector associated with the ruleset
 * @param {Object} declarations: a map from camelCased CSS property name to CSS
 *     property value.
 * @param {Object.<string, function>} stringHandlers: a map from camelCased CSS
 *     property name to a function which will map the given value to the value
 *     that is output.
 * @param {bool} useImportant: A boolean saying whether to append "!important"
 *     to each of the CSS declarations.
 * @returns {string} A string of raw CSS.
 *
 * Examples:
 *
 *    generateCSSRuleset(".blah", { color: "red" })
 *    -> ".blah{color: red !important;}"
 *    generateCSSRuleset(".blah", { color: "red" }, {}, false)
 *    -> ".blah{color: red}"
 *    generateCSSRuleset(".blah", { color: "red" }, {color: c => c.toUpperCase})
 *    -> ".blah{color: RED}"
 *    generateCSSRuleset(".blah:hover", { color: "red" })
 *    -> ".blah:hover{color: red}"
 */
var generateCSSRuleset = function generateCSSRuleset(selector, declarations, stringHandlers, useImportant) {
    var handledDeclarations = runStringHandlers(declarations, stringHandlers);

    var prefixedDeclarations = (0, _inlineStylePrefixerStatic2['default'])(handledDeclarations);

    var prefixedRules = (0, _util.flatten)((0, _util.objectToPairs)(prefixedDeclarations).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var value = _ref2[1];

        if (Array.isArray(value)) {
            var _ret = (function () {
                // inline-style-prefix-all returns an array when there should be
                // multiple rules, we will flatten to single rules

                var prefixedValues = [];
                var unprefixedValues = [];

                value.forEach(function (v) {
                    if (v.indexOf('-') === 0) {
                        prefixedValues.push(v);
                    } else {
                        unprefixedValues.push(v);
                    }
                });

                prefixedValues.sort();
                unprefixedValues.sort();

                return {
                    v: prefixedValues.concat(unprefixedValues).map(function (v) {
                        return [key, v];
                    })
                };
            })();

            if (typeof _ret === 'object') return _ret.v;
        }
        return [[key, value]];
    }));

    var rules = prefixedRules.map(function (_ref3) {
        var _ref32 = _slicedToArray(_ref3, 2);

        var key = _ref32[0];
        var value = _ref32[1];

        var stringValue = (0, _util.stringifyValue)(key, value);
        var ret = (0, _util.kebabifyStyleName)(key) + ':' + stringValue + ';';
        return useImportant === false ? ret : (0, _util.importantify)(ret);
    }).join("");

    if (rules) {
        return selector + '{' + rules + '}';
    } else {
        return "";
    }
};
exports.generateCSSRuleset = generateCSSRuleset;
},{"./util":5,"inline-style-prefixer/static":23}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _util = require('./util');

var _inject = require('./inject');

var StyleSheet = {
    create: function create(sheetDefinition) {
        return (0, _util.mapObj)(sheetDefinition, function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var key = _ref2[0];
            var val = _ref2[1];

            return [key, {
                // TODO(emily): Make a 'production' mode which doesn't prepend
                // the class name here, to make the generated CSS smaller.
                _name: key + '_' + (0, _util.hashObject)(val),
                _definition: val
            }];
        });
    },

    rehydrate: function rehydrate() {
        var renderedClassNames = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        (0, _inject.addRenderedClassNames)(renderedClassNames);
    }
};

/**
 * Utilities for using Aphrodite server-side.
 */
var StyleSheetServer = {
    renderStatic: function renderStatic(renderFunc) {
        (0, _inject.reset)();
        (0, _inject.startBuffering)();
        var html = renderFunc();
        var cssContent = (0, _inject.flushToString)();

        return {
            html: html,
            css: {
                content: cssContent,
                renderedClassNames: (0, _inject.getRenderedClassNames)()
            }
        };
    }
};

/**
 * Utilities for using Aphrodite in tests.
 *
 * Not meant to be used in production.
 */
var StyleSheetTestUtils = {
    /**
     * Prevent styles from being injected into the DOM.
     *
     * This is useful in situations where you'd like to test rendering UI
     * components which use Aphrodite without any of the side-effects of
     * Aphrodite happening. Particularly useful for testing the output of
     * components when you have no DOM, e.g. testing in Node without a fake DOM.
     *
     * Should be paired with a subsequent call to
     * clearBufferAndResumeStyleInjection.
     */
    suppressStyleInjection: function suppressStyleInjection() {
        (0, _inject.reset)();
        (0, _inject.startBuffering)();
    },

    /**
     * Opposite method of preventStyleInject.
     */
    clearBufferAndResumeStyleInjection: function clearBufferAndResumeStyleInjection() {
        (0, _inject.reset)();
    }
};

var css = function css() {
    for (var _len = arguments.length, styleDefinitions = Array(_len), _key = 0; _key < _len; _key++) {
        styleDefinitions[_key] = arguments[_key];
    }

    var useImportant = true; // Append !important to all style definitions
    return (0, _inject.injectAndGetClassName)(useImportant, styleDefinitions);
};

exports['default'] = {
    StyleSheet: StyleSheet,
    StyleSheetServer: StyleSheetServer,
    StyleSheetTestUtils: StyleSheetTestUtils,
    css: css
};
module.exports = exports['default'];
},{"./inject":3,"./util":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _asap = require('asap');

var _asap2 = _interopRequireDefault(_asap);

var _generate = require('./generate');

var _util = require('./util');

// The current <style> tag we are inserting into, or null if we haven't
// inserted anything yet. We could find this each time using
// `document.querySelector("style[data-aphrodite"])`, but holding onto it is
// faster.
var styleTag = null;

// Inject a string of styles into a <style> tag in the head of the document. This
// will automatically create a style tag and then continue to use it for
// multiple injections. It will also use a style tag with the `data-aphrodite`
// tag on it if that exists in the DOM. This could be used for e.g. reusing the
// same style tag that server-side rendering inserts.
var injectStyleTag = function injectStyleTag(cssContents) {
    if (styleTag == null) {
        // Try to find a style tag with the `data-aphrodite` attribute first.
        styleTag = document.querySelector("style[data-aphrodite]");

        // If that doesn't work, generate a new style tag.
        if (styleTag == null) {
            // Taken from
            // http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
            var head = document.head || document.getElementsByTagName('head')[0];
            styleTag = document.createElement('style');

            styleTag.type = 'text/css';
            styleTag.setAttribute("data-aphrodite", "");
            head.appendChild(styleTag);
        }
    }

    if (styleTag.styleSheet) {
        styleTag.styleSheet.cssText += cssContents;
    } else {
        styleTag.appendChild(document.createTextNode(cssContents));
    }
};

// Custom handlers for stringifying CSS values that have side effects
// (such as fontFamily, which can cause @font-face rules to be injected)
var stringHandlers = {
    // With fontFamily we look for objects that are passed in and interpret
    // them as @font-face rules that we need to inject. The value of fontFamily
    // can either be a string (as normal), an object (a single font face), or
    // an array of objects and strings.
    fontFamily: function fontFamily(val) {
        if (Array.isArray(val)) {
            return val.map(fontFamily).join(",");
        } else if (typeof val === "object") {
            injectStyleOnce(val.fontFamily, "@font-face", [val], false);
            return '"' + val.fontFamily + '"';
        } else {
            return val;
        }
    },

    // With animationName we look for an object that contains keyframes and
    // inject them as an `@keyframes` block, returning a uniquely generated
    // name. The keyframes object should look like
    //  animationName: {
    //    from: {
    //      left: 0,
    //      top: 0,
    //    },
    //    '50%': {
    //      left: 15,
    //      top: 5,
    //    },
    //    to: {
    //      left: 20,
    //      top: 20,
    //    }
    //  }
    // TODO(emily): `stringHandlers` doesn't let us rename the key, so I have
    // to use `animationName` here. Improve that so we can call this
    // `animation` instead of `animationName`.
    animationName: function animationName(val) {
        if (typeof val !== "object") {
            return val;
        }

        // Generate a unique name based on the hash of the object. We can't
        // just use the hash because the name can't start with a number.
        // TODO(emily): this probably makes debugging hard, allow a custom
        // name?
        var name = 'keyframe_' + (0, _util.hashObject)(val);

        // Since keyframes need 3 layers of nesting, we use `generateCSS` to
        // build the inner layers and wrap it in `@keyframes` ourselves.
        var finalVal = '@keyframes ' + name + '{';
        Object.keys(val).forEach(function (key) {
            finalVal += (0, _generate.generateCSS)(key, [val[key]], stringHandlers, false);
        });
        finalVal += '}';

        injectGeneratedCSSOnce(name, finalVal);

        return name;
    }
};

// This is a map from Aphrodite's generated class names to `true` (acting as a
// set of class names)
var alreadyInjected = {};

// This is the buffer of styles which have not yet been flushed.
var injectionBuffer = "";

// A flag to tell if we are already buffering styles. This could happen either
// because we scheduled a flush call already, so newly added styles will
// already be flushed, or because we are statically buffering on the server.
var isBuffering = false;

var injectGeneratedCSSOnce = function injectGeneratedCSSOnce(key, generatedCSS) {
    if (!alreadyInjected[key]) {
        if (!isBuffering) {
            // We should never be automatically buffering on the server (or any
            // place without a document), so guard against that.
            if (typeof document === "undefined") {
                throw new Error("Cannot automatically buffer without a document");
            }

            // If we're not already buffering, schedule a call to flush the
            // current styles.
            isBuffering = true;
            (0, _asap2['default'])(flushToStyleTag);
        }

        injectionBuffer += generatedCSS;
        alreadyInjected[key] = true;
    }
};

var injectStyleOnce = function injectStyleOnce(key, selector, definitions, useImportant) {
    if (!alreadyInjected[key]) {
        var generated = (0, _generate.generateCSS)(selector, definitions, stringHandlers, useImportant);

        injectGeneratedCSSOnce(key, generated);
    }
};

exports.injectStyleOnce = injectStyleOnce;
var reset = function reset() {
    injectionBuffer = "";
    alreadyInjected = {};
    isBuffering = false;
    styleTag = null;
};

exports.reset = reset;
var startBuffering = function startBuffering() {
    if (isBuffering) {
        throw new Error("Cannot buffer while already buffering");
    }
    isBuffering = true;
};

exports.startBuffering = startBuffering;
var flushToString = function flushToString() {
    isBuffering = false;
    var ret = injectionBuffer;
    injectionBuffer = "";
    return ret;
};

exports.flushToString = flushToString;
var flushToStyleTag = function flushToStyleTag() {
    var cssContent = flushToString();
    if (cssContent.length > 0) {
        injectStyleTag(cssContent);
    }
};

exports.flushToStyleTag = flushToStyleTag;
var getRenderedClassNames = function getRenderedClassNames() {
    return Object.keys(alreadyInjected);
};

exports.getRenderedClassNames = getRenderedClassNames;
var addRenderedClassNames = function addRenderedClassNames(classNames) {
    classNames.forEach(function (className) {
        alreadyInjected[className] = true;
    });
};

exports.addRenderedClassNames = addRenderedClassNames;
/**
 * Inject styles associated with the passed style definition objects, and return
 * an associated CSS class name.
 *
 * @param {boolean} useImportant If true, will append !important to generated
 *     CSS output. e.g. {color: red} -> "color: red !important".
 * @param {Object[]} styleDefinitions style definition objects as returned as
 *     properties of the return value of StyleSheet.create().
 */
var injectAndGetClassName = function injectAndGetClassName(useImportant, styleDefinitions) {
    // Filter out falsy values from the input, to allow for
    // `css(a, test && c)`
    var validDefinitions = styleDefinitions.filter(function (def) {
        return def;
    });

    // Break if there aren't any valid styles.
    if (validDefinitions.length === 0) {
        return "";
    }

    var className = validDefinitions.map(function (s) {
        return s._name;
    }).join("-o_O-");
    injectStyleOnce(className, '.' + className, validDefinitions.map(function (d) {
        return d._definition;
    }), useImportant);

    return className;
};
exports.injectAndGetClassName = injectAndGetClassName;
},{"./generate":1,"./util":5,"asap":7}],4:[function(require,module,exports){
// Module with the same interface as the core aphrodite module,
// except that styles injected do not automatically have !important
// appended to them.
//
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _inject = require('./inject');

var _indexJs = require('./index.js');

var css = function css() {
    for (var _len = arguments.length, styleDefinitions = Array(_len), _key = 0; _key < _len; _key++) {
        styleDefinitions[_key] = arguments[_key];
    }

    var useImportant = false; // Don't append !important to style definitions
    return (0, _inject.injectAndGetClassName)(useImportant, styleDefinitions);
};

exports.StyleSheet = _indexJs.StyleSheet;
exports.StyleSheetServer = _indexJs.StyleSheetServer;
exports.StyleSheetTestUtils = _indexJs.StyleSheetTestUtils;
exports.css = css;
},{"./index.js":2,"./inject":3}],5:[function(require,module,exports){
// {K1: V1, K2: V2, ...} -> [[K1, V1], [K2, V2]]
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var objectToPairs = function objectToPairs(obj) {
    return Object.keys(obj).map(function (key) {
        return [key, obj[key]];
    });
};

exports.objectToPairs = objectToPairs;
// [[K1, V1], [K2, V2]] -> {K1: V1, K2: V2, ...}
var pairsToObject = function pairsToObject(pairs) {
    var result = {};
    pairs.forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var val = _ref2[1];

        result[key] = val;
    });
    return result;
};

var mapObj = function mapObj(obj, fn) {
    return pairsToObject(objectToPairs(obj).map(fn));
};

exports.mapObj = mapObj;
// Flattens an array one level
// [[A], [B, C, [D]]] -> [A, B, C, [D]]
var flatten = function flatten(list) {
    return list.reduce(function (memo, x) {
        return memo.concat(x);
    }, []);
};

exports.flatten = flatten;
var UPPERCASE_RE = /([A-Z])/g;
var MS_RE = /^ms-/;

var kebabify = function kebabify(string) {
    return string.replace(UPPERCASE_RE, '-$1').toLowerCase();
};
var kebabifyStyleName = function kebabifyStyleName(string) {
    return kebabify(string).replace(MS_RE, '-ms-');
};

exports.kebabifyStyleName = kebabifyStyleName;
var recursiveMerge = function recursiveMerge(a, b) {
    // TODO(jlfwong): Handle malformed input where a and b are not the same
    // type.

    if (typeof a !== 'object') {
        return b;
    }

    var ret = _extends({}, a);

    Object.keys(b).forEach(function (key) {
        if (ret.hasOwnProperty(key)) {
            ret[key] = recursiveMerge(a[key], b[key]);
        } else {
            ret[key] = b[key];
        }
    });

    return ret;
};

exports.recursiveMerge = recursiveMerge;
/**
 * CSS properties which accept numbers but are not in units of "px".
 * Taken from React's CSSProperty.js
 */
var isUnitlessNumber = {
    animationIterationCount: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridColumn: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,

    // SVG-related properties
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
};

/**
 * Taken from React's CSSProperty.js
 *
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 * Taken from React's CSSProperty.js
 */
var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
// Taken from React's CSSProperty.js
Object.keys(isUnitlessNumber).forEach(function (prop) {
    prefixes.forEach(function (prefix) {
        isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
    });
});

var stringifyValue = function stringifyValue(key, prop) {
    if (typeof prop === "number") {
        if (isUnitlessNumber[key]) {
            return "" + prop;
        } else {
            return prop + "px";
        }
    } else {
        return prop;
    }
};

exports.stringifyValue = stringifyValue;
/**
 * JS Implementation of MurmurHash2
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} str ASCII only
 * @return {string} Base 36 encoded hash result
 */
function murmurhash2_32_gc(str) {
    var l = str.length;
    var h = l;
    var i = 0;
    var k = undefined;

    while (l >= 4) {
        k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;

        k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0x5bd1e995 & 0xffff) << 16);
        k ^= k >>> 24;
        k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0x5bd1e995 & 0xffff) << 16);

        h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16) ^ k;

        l -= 4;
        ++i;
    }

    switch (l) {
        case 3:
            h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
        case 2:
            h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
        case 1:
            h ^= str.charCodeAt(i) & 0xff;
            h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16);
    }

    h ^= h >>> 13;
    h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16);
    h ^= h >>> 15;

    return (h >>> 0).toString(36);
}

// Hash a javascript object using JSON.stringify. This is very fast, about 3
// microseconds on my computer for a sample object:
// http://jsperf.com/test-hashfnv32a-hash/5
//
// Note that this uses JSON.stringify to stringify the objects so in order for
// this to produce consistent hashes browsers need to have a consistent
// ordering of objects. Ben Alpert says that Facebook depends on this, so we
// can probably depend on this too.
var hashObject = function hashObject(object) {
    return murmurhash2_32_gc(JSON.stringify(object));
};

exports.hashObject = hashObject;
var IMPORTANT_RE = /^([^:]+:.*?)( !important)?;$/;

// Given a single style rule string like "a: b;", adds !important to generate
// "a: b !important;".
var importantify = function importantify(string) {
    return string.replace(IMPORTANT_RE, function (_, base, important) {
        return base + " !important;";
    });
};
exports.importantify = importantify;
},{}],6:[function(require,module,exports){
module.exports = require('./lib/no-important.js');

},{"./lib/no-important.js":4}],7:[function(require,module,exports){
"use strict";

// rawAsap provides everything we need except exception management.
var rawAsap = require("./raw");
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};

},{"./raw":8}],8:[function(require,module,exports){
(function (global){
"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.
var BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],9:[function(require,module,exports){
'use strict';

var uppercasePattern = /[A-Z]/g;
var msPattern = /^ms-/;

function hyphenateStyleName(string) {
    return string
        .replace(uppercasePattern, '-$&')
        .toLowerCase()
        .replace(msPattern, '-ms-');
}

module.exports = hyphenateStyleName;

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = calc;

var _joinPrefixedValue = require('../../utils/joinPrefixedValue');

var _joinPrefixedValue2 = _interopRequireDefault(_joinPrefixedValue);

var _isPrefixedValue = require('../../utils/isPrefixedValue');

var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function calc(property, value) {
  if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.indexOf('calc(') > -1) {
    return (0, _joinPrefixedValue2.default)(property, value, function (prefix, value) {
      return value.replace(/calc\(/g, prefix + 'calc(');
    });
  }
}
module.exports = exports['default'];
},{"../../utils/isPrefixedValue":21,"../../utils/joinPrefixedValue":22}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cursor;

var _joinPrefixedValue = require('../../utils/joinPrefixedValue');

var _joinPrefixedValue2 = _interopRequireDefault(_joinPrefixedValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var values = {
  'zoom-in': true,
  'zoom-out': true,
  grab: true,
  grabbing: true
};

function cursor(property, value) {
  if (property === 'cursor' && values[value]) {
    return (0, _joinPrefixedValue2.default)(property, value);
  }
}
module.exports = exports['default'];
},{"../../utils/joinPrefixedValue":22}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flex;
var values = { flex: true, 'inline-flex': true };

function flex(property, value) {
  if (property === 'display' && values[value]) {
    return {
      display: ['-webkit-box', '-moz-box', '-ms-' + value + 'box', '-webkit-' + value, value]
    };
  }
}
module.exports = exports['default'];
},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flexboxIE;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var alternativeValues = {
  'space-around': 'distribute',
  'space-between': 'justify',
  'flex-start': 'start',
  'flex-end': 'end'
};
var alternativeProps = {
  alignContent: 'msFlexLinePack',
  alignSelf: 'msFlexItemAlign',
  alignItems: 'msFlexAlign',
  justifyContent: 'msFlexPack',
  order: 'msFlexOrder',
  flexGrow: 'msFlexPositive',
  flexShrink: 'msFlexNegative',
  flexBasis: 'msPreferredSize'
};

function flexboxIE(property, value) {
  if (alternativeProps[property]) {
    return _defineProperty({}, alternativeProps[property], alternativeValues[value] || value);
  }
}
module.exports = exports['default'];
},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flexboxOld;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var alternativeValues = {
  'space-around': 'justify',
  'space-between': 'justify',
  'flex-start': 'start',
  'flex-end': 'end',
  'wrap-reverse': 'multiple',
  wrap: 'multiple'
};

var alternativeProps = {
  alignItems: 'WebkitBoxAlign',
  justifyContent: 'WebkitBoxPack',
  flexWrap: 'WebkitBoxLines'
};

function flexboxOld(property, value) {
  if (property === 'flexDirection') {
    return {
      WebkitBoxOrient: value.indexOf('column') > -1 ? 'vertical' : 'horizontal',
      WebkitBoxDirection: value.indexOf('reverse') > -1 ? 'reverse' : 'normal'
    };
  }
  if (alternativeProps[property]) {
    return _defineProperty({}, alternativeProps[property], alternativeValues[value] || value);
  }
}
module.exports = exports['default'];
},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = gradient;

var _joinPrefixedValue = require('../../utils/joinPrefixedValue');

var _joinPrefixedValue2 = _interopRequireDefault(_joinPrefixedValue);

var _isPrefixedValue = require('../../utils/isPrefixedValue');

var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var values = /linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient/;

function gradient(property, value) {
  if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.match(values) !== null) {
    return (0, _joinPrefixedValue2.default)(property, value);
  }
}
module.exports = exports['default'];
},{"../../utils/isPrefixedValue":21,"../../utils/joinPrefixedValue":22}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sizing;

var _joinPrefixedValue = require('../../utils/joinPrefixedValue');

var _joinPrefixedValue2 = _interopRequireDefault(_joinPrefixedValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var properties = {
  maxHeight: true,
  maxWidth: true,
  width: true,
  height: true,
  columnWidth: true,
  minWidth: true,
  minHeight: true
};
var values = {
  'min-content': true,
  'max-content': true,
  'fill-available': true,
  'fit-content': true,
  'contain-floats': true
};

function sizing(property, value) {
  if (properties[property] && values[value]) {
    return (0, _joinPrefixedValue2.default)(property, value);
  }
}
module.exports = exports['default'];
},{"../../utils/joinPrefixedValue":22}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transition;

var _hyphenateStyleName = require('hyphenate-style-name');

var _hyphenateStyleName2 = _interopRequireDefault(_hyphenateStyleName);

var _capitalizeString = require('../../utils/capitalizeString');

var _capitalizeString2 = _interopRequireDefault(_capitalizeString);

var _isPrefixedValue = require('../../utils/isPrefixedValue');

var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);

var _prefixProps = require('../prefixProps');

var _prefixProps2 = _interopRequireDefault(_prefixProps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var properties = {
  transition: true,
  transitionProperty: true,
  WebkitTransition: true,
  WebkitTransitionProperty: true
};

function transition(property, value) {
  // also check for already prefixed transitions
  if (typeof value === 'string' && properties[property]) {
    var _ref2;

    var outputValue = prefixValue(value);
    var webkitOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function (value) {
      return value.match(/-moz-|-ms-/) === null;
    }).join(',');

    // if the property is already prefixed
    if (property.indexOf('Webkit') > -1) {
      return _defineProperty({}, property, webkitOutput);
    }

    return _ref2 = {}, _defineProperty(_ref2, 'Webkit' + (0, _capitalizeString2.default)(property), webkitOutput), _defineProperty(_ref2, property, outputValue), _ref2;
  }
}

function prefixValue(value) {
  if ((0, _isPrefixedValue2.default)(value)) {
    return value;
  }

  // only split multi values, not cubic beziers
  var multipleValues = value.split(/,(?![^()]*(?:\([^()]*\))?\))/g);

  // iterate each single value and check for transitioned properties
  // that need to be prefixed as well
  multipleValues.forEach(function (val, index) {
    multipleValues[index] = Object.keys(_prefixProps2.default).reduce(function (out, prefix) {
      var dashCasePrefix = '-' + prefix.toLowerCase() + '-';

      Object.keys(_prefixProps2.default[prefix]).forEach(function (prop) {
        var dashCaseProperty = (0, _hyphenateStyleName2.default)(prop);

        if (val.indexOf(dashCaseProperty) > -1 && dashCaseProperty !== 'order') {
          // join all prefixes and create a new value
          out = val.replace(dashCaseProperty, dashCasePrefix + dashCaseProperty) + ',' + out;
        }
      });
      return out;
    }, val);
  });

  return multipleValues.join(',');
}
module.exports = exports['default'];
},{"../../utils/capitalizeString":20,"../../utils/isPrefixedValue":21,"../prefixProps":19,"hyphenate-style-name":9}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = prefixAll;

var _prefixProps = require('./prefixProps');

var _prefixProps2 = _interopRequireDefault(_prefixProps);

var _capitalizeString = require('../utils/capitalizeString');

var _capitalizeString2 = _interopRequireDefault(_capitalizeString);

var _calc = require('./plugins/calc');

var _calc2 = _interopRequireDefault(_calc);

var _cursor = require('./plugins/cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _flex = require('./plugins/flex');

var _flex2 = _interopRequireDefault(_flex);

var _sizing = require('./plugins/sizing');

var _sizing2 = _interopRequireDefault(_sizing);

var _gradient = require('./plugins/gradient');

var _gradient2 = _interopRequireDefault(_gradient);

var _transition = require('./plugins/transition');

var _transition2 = _interopRequireDefault(_transition);

var _flexboxIE = require('./plugins/flexboxIE');

var _flexboxIE2 = _interopRequireDefault(_flexboxIE);

var _flexboxOld = require('./plugins/flexboxOld');

var _flexboxOld2 = _interopRequireDefault(_flexboxOld);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// special flexbox specifications


var plugins = [_calc2.default, _cursor2.default, _sizing2.default, _gradient2.default, _transition2.default, _flexboxIE2.default, _flexboxOld2.default, _flex2.default];

/**
 * Returns a prefixed version of the style object using all vendor prefixes
 * @param {Object} styles - Style object that gets prefixed properties added
 * @returns {Object} - Style object with prefixed properties and values
 */
function prefixAll(styles) {
  Object.keys(styles).forEach(function (property) {
    var value = styles[property];
    if (value instanceof Object && !Array.isArray(value)) {
      // recurse through nested style objects
      styles[property] = prefixAll(value);
    } else {
      Object.keys(_prefixProps2.default).forEach(function (prefix) {
        var properties = _prefixProps2.default[prefix];
        // add prefixes if needed
        if (properties[property]) {
          styles[prefix + (0, _capitalizeString2.default)(property)] = value;
        }
      });
    }
  });

  Object.keys(styles).forEach(function (property) {
    [].concat(styles[property]).forEach(function (value, index) {
      // resolve every special plugins
      plugins.forEach(function (plugin) {
        return assignStyles(styles, plugin(property, value));
      });
    });
  });

  return styles;
}

function assignStyles(base) {
  var extend = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  Object.keys(extend).forEach(function (property) {
    var baseValue = base[property];
    if (Array.isArray(baseValue)) {
      [].concat(extend[property]).forEach(function (value) {
        var valueIndex = baseValue.indexOf(value);
        if (valueIndex > -1) {
          base[property].splice(valueIndex, 1);
        }
        base[property].push(value);
      });
    } else {
      base[property] = extend[property];
    }
  });
}
module.exports = exports['default'];
},{"../utils/capitalizeString":20,"./plugins/calc":10,"./plugins/cursor":11,"./plugins/flex":12,"./plugins/flexboxIE":13,"./plugins/flexboxOld":14,"./plugins/gradient":15,"./plugins/sizing":16,"./plugins/transition":17,"./prefixProps":19}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = { "Webkit": { "transform": true, "transformOrigin": true, "transformOriginX": true, "transformOriginY": true, "backfaceVisibility": true, "perspective": true, "perspectiveOrigin": true, "transformStyle": true, "transformOriginZ": true, "animation": true, "animationDelay": true, "animationDirection": true, "animationFillMode": true, "animationDuration": true, "animationIterationCount": true, "animationName": true, "animationPlayState": true, "animationTimingFunction": true, "appearance": true, "userSelect": true, "fontKerning": true, "textEmphasisPosition": true, "textEmphasis": true, "textEmphasisStyle": true, "textEmphasisColor": true, "boxDecorationBreak": true, "clipPath": true, "maskImage": true, "maskMode": true, "maskRepeat": true, "maskPosition": true, "maskClip": true, "maskOrigin": true, "maskSize": true, "maskComposite": true, "mask": true, "maskBorderSource": true, "maskBorderMode": true, "maskBorderSlice": true, "maskBorderWidth": true, "maskBorderOutset": true, "maskBorderRepeat": true, "maskBorder": true, "maskType": true, "textDecorationStyle": true, "textDecorationSkip": true, "textDecorationLine": true, "textDecorationColor": true, "filter": true, "fontFeatureSettings": true, "breakAfter": true, "breakBefore": true, "breakInside": true, "columnCount": true, "columnFill": true, "columnGap": true, "columnRule": true, "columnRuleColor": true, "columnRuleStyle": true, "columnRuleWidth": true, "columns": true, "columnSpan": true, "columnWidth": true, "flex": true, "flexBasis": true, "flexDirection": true, "flexGrow": true, "flexFlow": true, "flexShrink": true, "flexWrap": true, "alignContent": true, "alignItems": true, "alignSelf": true, "justifyContent": true, "order": true, "transition": true, "transitionDelay": true, "transitionDuration": true, "transitionProperty": true, "transitionTimingFunction": true, "backdropFilter": true, "scrollSnapType": true, "scrollSnapPointsX": true, "scrollSnapPointsY": true, "scrollSnapDestination": true, "scrollSnapCoordinate": true, "shapeImageThreshold": true, "shapeImageMargin": true, "shapeImageOutside": true, "hyphens": true, "flowInto": true, "flowFrom": true, "regionFragment": true, "textSizeAdjust": true, "borderImage": true, "borderImageOutset": true, "borderImageRepeat": true, "borderImageSlice": true, "borderImageSource": true, "borderImageWidth": true, "tabSize": true, "objectFit": true, "objectPosition": true }, "Moz": { "appearance": true, "userSelect": true, "boxSizing": true, "textAlignLast": true, "textDecorationStyle": true, "textDecorationSkip": true, "textDecorationLine": true, "textDecorationColor": true, "tabSize": true, "hyphens": true, "fontFeatureSettings": true, "breakAfter": true, "breakBefore": true, "breakInside": true, "columnCount": true, "columnFill": true, "columnGap": true, "columnRule": true, "columnRuleColor": true, "columnRuleStyle": true, "columnRuleWidth": true, "columns": true, "columnSpan": true, "columnWidth": true }, "ms": { "flex": true, "flexBasis": false, "flexDirection": true, "flexGrow": false, "flexFlow": true, "flexShrink": false, "flexWrap": true, "alignContent": false, "alignItems": false, "alignSelf": false, "justifyContent": false, "order": false, "transform": true, "transformOrigin": true, "transformOriginX": true, "transformOriginY": true, "userSelect": true, "wrapFlow": true, "wrapThrough": true, "wrapMargin": true, "scrollSnapType": true, "scrollSnapPointsX": true, "scrollSnapPointsY": true, "scrollSnapDestination": true, "scrollSnapCoordinate": true, "touchAction": true, "hyphens": true, "flowInto": true, "flowFrom": true, "breakBefore": true, "breakAfter": true, "breakInside": true, "regionFragment": true, "gridTemplateColumns": true, "gridTemplateRows": true, "gridTemplateAreas": true, "gridTemplate": true, "gridAutoColumns": true, "gridAutoRows": true, "gridAutoFlow": true, "grid": true, "gridRowStart": true, "gridColumnStart": true, "gridRowEnd": true, "gridRow": true, "gridColumn": true, "gridColumnEnd": true, "gridColumnGap": true, "gridRowGap": true, "gridArea": true, "gridGap": true, "textSizeAdjust": true } };
module.exports = exports["default"];
},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// helper to capitalize strings

exports.default = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

module.exports = exports["default"];
},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (value) {
  if (Array.isArray(value)) value = value.join(',');

  return value.match(/-webkit-|-moz-|-ms-/) !== null;
};

module.exports = exports['default'];
},{}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// returns a style object with a single concated prefixed value string

exports.default = function (property, value) {
  var replacer = arguments.length <= 2 || arguments[2] === undefined ? function (prefix, value) {
    return prefix + value;
  } : arguments[2];
  return _defineProperty({}, property, ['-webkit-', '-moz-', ''].map(function (prefix) {
    return replacer(prefix, value);
  }));
};

module.exports = exports['default'];
},{}],23:[function(require,module,exports){
module.exports = require('./lib/static/prefixAll')

},{"./lib/static/prefixAll":18}],24:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var _utils = require('../utils');

var _Icon = require('./Icon');

var _Icon2 = _interopRequireDefault(_Icon);

function Arrow(_ref, _ref2) {
	var direction = _ref.direction;
	var icon = _ref.icon;
	var onClick = _ref.onClick;
	var size = _ref.size;

	var props = _objectWithoutProperties(_ref, ['direction', 'icon', 'onClick', 'size']);

	var theme = _ref2.theme;

	var classes = _aphroditeNoImportant.StyleSheet.create((0, _utils.deepMerge)(defaultStyles, theme));

	return _react2['default'].createElement(
		'button',
		_extends({
			type: 'button',
			className: (0, _aphroditeNoImportant.css)(classes.arrow, classes['arrow__direction__' + direction], size && classes['arrow__size__' + size]),
			onClick: onClick,
			onTouchEnd: onClick
		}, props),
		_react2['default'].createElement(_Icon2['default'], { fill: !!theme.arrow && theme.arrow.fill || _theme2['default'].arrow.fill, type: icon })
	);
};

Arrow.propTypes = {
	direction: _react.PropTypes.oneOf(['left', 'right']),
	icon: _react.PropTypes.string,
	onClick: _react.PropTypes.func.isRequired,
	size: _react.PropTypes.oneOf(['medium', 'small']).isRequired
};
Arrow.defaultProps = {
	size: 'medium'
};
Arrow.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var defaultStyles = {
	arrow: {
		background: 'none',
		border: 'none',
		borderRadius: 4,
		cursor: 'pointer',
		outline: 'none',
		padding: 10, // increase hit area
		position: 'absolute',
		top: '50%',

		// disable user select
		WebkitTouchCallout: 'none',
		userSelect: 'none'
	},

	// sizees
	arrow__size__medium: {
		height: _theme2['default'].arrow.height,
		marginTop: _theme2['default'].arrow.height / -2,
		width: 40,

		'@media (min-width: 768px)': {
			width: 70
		}
	},
	arrow__size__small: {
		height: _theme2['default'].thumbnail.size,
		marginTop: _theme2['default'].thumbnail.size / -2,
		width: 30,

		'@media (min-width: 500px)': {
			width: 40
		}
	},

	// direction
	arrow__direction__right: {
		right: _theme2['default'].container.gutter.horizontal
	},
	arrow__direction__left: {
		left: _theme2['default'].container.gutter.horizontal
	}
};

module.exports = Arrow;

},{"../theme":38,"../utils":42,"./Icon":28,"aphrodite/no-important":6,"react":undefined}],25:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var _utils = require('../utils');

function Container(_ref, _ref2) {
	var props = _objectWithoutProperties(_ref, []);

	var theme = _ref2.theme;

	var classes = _aphroditeNoImportant.StyleSheet.create((0, _utils.deepMerge)(defaultStyles, theme));

	return _react2['default'].createElement('div', _extends({
		className: (0, _aphroditeNoImportant.css)(classes.container)
	}, props));
};

Container.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var defaultStyles = {
	container: {
		alignItems: 'center',
		backgroundColor: _theme2['default'].container.background,
		boxSizing: 'border-box',
		display: 'flex',
		height: '100%',
		justifyContent: 'center',
		left: 0,
		paddingBottom: _theme2['default'].container.gutter.vertical,
		paddingLeft: _theme2['default'].container.gutter.horizontal,
		paddingRight: _theme2['default'].container.gutter.horizontal,
		paddingTop: _theme2['default'].container.gutter.vertical,
		position: 'fixed',
		top: 0,
		width: '100%',
		zIndex: _theme2['default'].container.zIndex
	}
};

module.exports = Container;

},{"../theme":38,"../utils":42,"aphrodite/no-important":6,"react":undefined}],26:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var _utils = require('../utils');

function Footer(_ref, _ref2) {
	var caption = _ref.caption;
	var countCurrent = _ref.countCurrent;
	var countSeparator = _ref.countSeparator;
	var countTotal = _ref.countTotal;
	var showCount = _ref.showCount;

	var props = _objectWithoutProperties(_ref, ['caption', 'countCurrent', 'countSeparator', 'countTotal', 'showCount']);

	var theme = _ref2.theme;

	if (!caption && !showCount) return null;

	var classes = _aphroditeNoImportant.StyleSheet.create((0, _utils.deepMerge)(defaultStyles, theme));

	var imageCount = showCount ? _react2['default'].createElement(
		'div',
		{ className: (0, _aphroditeNoImportant.css)(classes.footerCount) },
		countCurrent,
		countSeparator,
		countTotal
	) : _react2['default'].createElement('span', null);

	return _react2['default'].createElement(
		'div',
		_extends({ className: (0, _aphroditeNoImportant.css)(classes.footer) }, props),
		caption ? _react2['default'].createElement(
			'figcaption',
			{ className: (0, _aphroditeNoImportant.css)(classes.footerCaption) },
			caption
		) : _react2['default'].createElement('span', null),
		imageCount
	);
};

Footer.propTypes = {
	caption: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.element]),
	countCurrent: _react.PropTypes.number,
	countSeparator: _react.PropTypes.string,
	countTotal: _react.PropTypes.number,
	showCount: _react.PropTypes.bool
};
Footer.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var defaultStyles = {
	footer: {
		boxSizing: 'border-box',
		color: _theme2['default'].footer.color,
		cursor: 'auto',
		display: 'flex',
		justifyContent: 'space-between',
		left: 0,
		lineHeight: 1.3,
		height: _theme2['default'].footer.height,
		paddingBottom: _theme2['default'].footer.gutter.vertical,
		paddingLeft: _theme2['default'].footer.gutter.horizontal,
		paddingRight: _theme2['default'].footer.gutter.horizontal,
		paddingTop: _theme2['default'].footer.gutter.vertical
	},
	footerCount: {
		color: _theme2['default'].footer.count.color,
		fontSize: _theme2['default'].footer.count.fontSize,
		paddingLeft: '1em' },
	// add a small gutter for the caption
	footerCaption: {
		flex: '1 1 0'
	}
};

module.exports = Footer;

},{"../theme":38,"../utils":42,"aphrodite/no-important":6,"react":undefined}],27:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var _utils = require('../utils');

var _Icon = require('./Icon');

var _Icon2 = _interopRequireDefault(_Icon);

function Header(_ref, _ref2) {
	var customControls = _ref.customControls;
	var onClose = _ref.onClose;
	var showCloseButton = _ref.showCloseButton;

	var props = _objectWithoutProperties(_ref, ['customControls', 'onClose', 'showCloseButton']);

	var theme = _ref2.theme;

	var classes = _aphroditeNoImportant.StyleSheet.create((0, _utils.deepMerge)(defaultStyles, theme));

	return _react2['default'].createElement(
		'div',
		_extends({ className: (0, _aphroditeNoImportant.css)(classes.header) }, props),
		customControls ? customControls : _react2['default'].createElement('span', null),
		!!showCloseButton && _react2['default'].createElement(
			'button',
			{
				title: 'Close (Esc)',
				className: (0, _aphroditeNoImportant.css)(classes.close),
				onClick: onClose
			},
			_react2['default'].createElement(_Icon2['default'], { fill: !!theme.close && theme.close.fill || _theme2['default'].close.fill, type: 'close' })
		)
	);
};

Header.propTypes = {
	customControls: _react.PropTypes.array,
	onClose: _react.PropTypes.func.isRequired,
	showCloseButton: _react.PropTypes.bool
};
Header.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var defaultStyles = {
	header: {
		display: 'flex',
		justifyContent: 'space-between',
		height: _theme2['default'].header.height
	},
	close: {
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		outline: 'none',
		position: 'relative',
		top: 0,
		verticalAlign: 'bottom',

		// increase hit area
		height: _theme2['default'].close.height + 20,
		marginRight: -10,
		padding: 10,
		width: _theme2['default'].close.width + 20
	}
};

module.exports = Header;

},{"../theme":38,"../utils":42,"./Icon":28,"aphrodite/no-important":6,"react":undefined}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _icons = require('../icons');

var _icons2 = _interopRequireDefault(_icons);

var Icon = function Icon(_ref) {
	var fill = _ref.fill;
	var type = _ref.type;

	var props = _objectWithoutProperties(_ref, ['fill', 'type']);

	var icon = _icons2['default'][type];

	return _react2['default'].createElement('span', _extends({
		dangerouslySetInnerHTML: { __html: icon(fill) }
	}, props));
};

Icon.propTypes = {
	fill: _react.PropTypes.string,
	type: _react.PropTypes.oneOf(Object.keys(_icons2['default']))
};
Icon.defaultProps = {
	fill: 'white'
};

exports['default'] = Icon;
module.exports = exports['default'];

},{"../icons":37,"react":undefined}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _Thumbnail = require('./Thumbnail');

var _Thumbnail2 = _interopRequireDefault(_Thumbnail);

var _Arrow = require('./Arrow');

var _Arrow2 = _interopRequireDefault(_Arrow);

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var classes = _aphroditeNoImportant.StyleSheet.create({
	paginatedThumbnails: {
		bottom: _theme2['default'].container.gutter.vertical,
		height: _theme2['default'].thumbnail.size,
		padding: '0 50px',
		position: 'absolute',
		textAlign: 'center',
		whiteSpace: 'nowrap'
	}
});

var arrowStyles = {
	height: _theme2['default'].thumbnail.size + _theme2['default'].thumbnail.gutter * 2,
	width: 40
};

var PaginatedThumbnails = (function (_Component) {
	_inherits(PaginatedThumbnails, _Component);

	function PaginatedThumbnails(props) {
		_classCallCheck(this, PaginatedThumbnails);

		_get(Object.getPrototypeOf(PaginatedThumbnails.prototype), 'constructor', this).call(this, props);

		this.state = {
			hasCustomPage: false
		};

		this.gotoPrev = this.gotoPrev.bind(this);
		this.gotoNext = this.gotoNext.bind(this);
	}

	_createClass(PaginatedThumbnails, [{
		key: 'componentWillReceiveProps',
		value: function componentWillReceiveProps(nextProps) {
			// Component should be controlled, flush state when currentImage changes
			if (nextProps.currentImage !== this.props.currentImage) {
				this.setState({
					hasCustomPage: false
				});
			}
		}

		// ==============================
		// METHODS
		// ==============================

	}, {
		key: 'getFirst',
		value: function getFirst() {
			var _props = this.props;
			var currentImage = _props.currentImage;
			var offset = _props.offset;

			if (this.state.hasCustomPage) {
				return this.clampFirst(this.state.first);
			}
			return this.clampFirst(currentImage - offset);
		}
	}, {
		key: 'setFirst',
		value: function setFirst(event, newFirst) {
			var first = this.state.first;

			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			if (first === newFirst) return;

			this.setState({
				hasCustomPage: true,
				first: newFirst
			});
		}
	}, {
		key: 'gotoPrev',
		value: function gotoPrev(event) {
			this.setFirst(event, this.getFirst() - this.props.offset);
		}
	}, {
		key: 'gotoNext',
		value: function gotoNext(event) {
			this.setFirst(event, this.getFirst() + this.props.offset);
		}
	}, {
		key: 'clampFirst',
		value: function clampFirst(value) {
			var _props2 = this.props;
			var images = _props2.images;
			var offset = _props2.offset;

			var totalCount = 2 * offset + 1; // show $offset extra thumbnails on each side

			if (value < 0) {
				return 0;
			} else if (value + totalCount > images.length) {
				// Too far
				return images.length - totalCount;
			} else {
				return value;
			}
		}

		// ==============================
		// RENDERERS
		// ==============================

	}, {
		key: 'renderArrowPrev',
		value: function renderArrowPrev() {
			if (this.getFirst() <= 0) return null;

			return _react2['default'].createElement(_Arrow2['default'], {
				direction: 'left',
				size: 'small',
				icon: 'arrowLeft',
				onClick: this.gotoPrev,
				style: arrowStyles,
				title: 'Previous (Left arrow key)',
				type: 'button'
			});
		}
	}, {
		key: 'renderArrowNext',
		value: function renderArrowNext() {
			var _props3 = this.props;
			var offset = _props3.offset;
			var images = _props3.images;

			var totalCount = 2 * offset + 1;
			if (this.getFirst() + totalCount >= images.length) return null;

			return _react2['default'].createElement(_Arrow2['default'], {
				direction: 'right',
				size: 'small',
				icon: 'arrowRight',
				onClick: this.gotoNext,
				style: arrowStyles,
				title: 'Previous (Right arrow key)',
				type: 'button'
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var _props4 = this.props;
			var images = _props4.images;
			var currentImage = _props4.currentImage;
			var onClickThumbnail = _props4.onClickThumbnail;
			var offset = _props4.offset;

			var totalCount = 2 * offset + 1; // show $offset extra thumbnails on each side
			var thumbnails = [];
			var baseOffset = 0;
			if (images.length <= totalCount) {
				thumbnails = images;
			} else {
				// Try to center current image in list
				baseOffset = this.getFirst();
				thumbnails = images.slice(baseOffset, baseOffset + totalCount);
			}

			return _react2['default'].createElement(
				'div',
				{ className: (0, _aphroditeNoImportant.css)(classes.paginatedThumbnails) },
				this.renderArrowPrev(),
				thumbnails.map(function (img, idx) {
					return _react2['default'].createElement(_Thumbnail2['default'], _extends({ key: baseOffset + idx
					}, img, {
						index: baseOffset + idx,
						onClick: onClickThumbnail,
						active: baseOffset + idx === currentImage }));
				}),
				this.renderArrowNext()
			);
		}
	}]);

	return PaginatedThumbnails;
})(_react.Component);

exports['default'] = PaginatedThumbnails;

PaginatedThumbnails.propTypes = {
	currentImage: _react.PropTypes.number,
	images: _react.PropTypes.array,
	offset: _react.PropTypes.number,
	onClickThumbnail: _react.PropTypes.func.isRequired
};
module.exports = exports['default'];

},{"../theme":38,"./Arrow":24,"./Thumbnail":33,"aphrodite/no-important":6,"react":undefined}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

// Pass the Lightbox context through to the Portal's descendents
// StackOverflow discussion http://goo.gl/oclrJ9

var PassContext = (function (_Component) {
	_inherits(PassContext, _Component);

	function PassContext() {
		_classCallCheck(this, PassContext);

		_get(Object.getPrototypeOf(PassContext.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(PassContext, [{
		key: 'getChildContext',
		value: function getChildContext() {
			return this.props.context;
		}
	}, {
		key: 'render',
		value: function render() {
			return _react.Children.only(this.props.children);
		}
	}]);

	return PassContext;
})(_react.Component);

;

PassContext.propTypes = {
	context: _react.PropTypes.object.isRequired
};
PassContext.childContextTypes = {
	theme: _react.PropTypes.object
};

exports['default'] = PassContext;
module.exports = exports['default'];

},{"react":undefined}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

var _reactDom = require('react-dom');

var _PassContext = require('./PassContext');

var _PassContext2 = _interopRequireDefault(_PassContext);

var Portal = (function (_Component) {
	_inherits(Portal, _Component);

	function Portal() {
		_classCallCheck(this, Portal);

		_get(Object.getPrototypeOf(Portal.prototype), 'constructor', this).call(this);
		this.portalElement = null;
	}

	_createClass(Portal, [{
		key: 'componentDidMount',
		value: function componentDidMount() {
			var p = document.createElement('div');
			document.body.appendChild(p);
			this.portalElement = p;
			this.componentDidUpdate();
		}
	}, {
		key: 'componentDidUpdate',
		value: function componentDidUpdate() {
			// Animate fade on mount/unmount
			var duration = 200;
			var styles = '\n\t\t\t\t.fade-enter { opacity: 0.01; }\n\t\t\t\t.fade-enter.fade-enter-active { opacity: 1; transition: opacity ' + duration + 'ms; }\n\t\t\t\t.fade-leave { opacity: 1; }\n\t\t\t\t.fade-leave.fade-leave-active { opacity: 0.01; transition: opacity ' + duration + 'ms; }\n\t\t';

			(0, _reactDom.render)(_react2['default'].createElement(
				_PassContext2['default'],
				{ context: this.context },
				_react2['default'].createElement(
					'div',
					null,
					_react2['default'].createElement(
						'style',
						null,
						styles
					),
					_react2['default'].createElement(_reactAddonsCssTransitionGroup2['default'], _extends({
						component: 'div',
						transitionName: 'fade',
						transitionEnterTimeout: duration,
						transitionLeaveTimeout: duration
					}, this.props))
				)
			), this.portalElement);
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			document.body.removeChild(this.portalElement);
		}
	}, {
		key: 'render',
		value: function render() {
			return null;
		}
	}]);

	return Portal;
})(_react.Component);

exports['default'] = Portal;

Portal.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};
module.exports = exports['default'];

},{"./PassContext":30,"react":undefined,"react-addons-css-transition-group":undefined,"react-dom":undefined}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var lockCount = 0;

var ScrollLock = (function (_Component) {
	_inherits(ScrollLock, _Component);

	function ScrollLock() {
		_classCallCheck(this, ScrollLock);

		_get(Object.getPrototypeOf(ScrollLock.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(ScrollLock, [{
		key: 'componentWillMount',
		value: function componentWillMount() {
			if (typeof window === 'undefined') return;

			lockCount++;
			if (lockCount > 1) return;

			//	FIXME iOS ignores overflow on body
			try {
				var scrollBarWidth = window.innerWidth - document.body.clientWidth;

				var target = document.body;

				target.style.paddingRight = scrollBarWidth + 'px';
				target.style.overflowY = 'hidden';
			} catch (err) {
				console.error('Failed to find body element. Err:', err);
			}
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			if (typeof window === 'undefined' || lockCount === 0) return;

			lockCount--;
			if (lockCount > 0) return; // Still locked

			//	FIXME iOS ignores overflow on body
			try {
				var target = document.body;

				target.style.paddingRight = '';
				target.style.overflowY = '';
			} catch (err) {
				console.error('Failed to find body element. Err:', err);
			}
		}
	}, {
		key: 'render',
		value: function render() {
			return null;
		}
	}]);

	return ScrollLock;
})(_react.Component);

exports['default'] = ScrollLock;
module.exports = exports['default'];

},{"react":undefined}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _theme = require('../theme');

var _theme2 = _interopRequireDefault(_theme);

var _utils = require('../utils');

function Thumbnail(_ref, _ref2) {
	var index = _ref.index;
	var src = _ref.src;
	var thumbnail = _ref.thumbnail;
	var active = _ref.active;
	var onClick = _ref.onClick;
	var theme = _ref2.theme;

	var url = thumbnail ? thumbnail : src;
	var classes = _aphroditeNoImportant.StyleSheet.create((0, _utils.deepMerge)(defaultStyles, theme));

	return _react2['default'].createElement('div', {
		className: (0, _aphroditeNoImportant.css)(classes.thumbnail, active && classes.thumbnail__active),
		onClick: function (e) {
			e.preventDefault();
			e.stopPropagation();

			onClick(index);
		},
		style: { backgroundImage: 'url("' + url + '")' }
	});
}

Thumbnail.propTypes = {
	active: _react.PropTypes.bool,
	index: _react.PropTypes.number,
	onClick: _react.PropTypes.func.isRequired,
	src: _react.PropTypes.string,
	thumbnail: _react.PropTypes.string
};

Thumbnail.contextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var defaultStyles = {
	thumbnail: {
		backgroundPosition: 'center',
		backgroundSize: 'cover',
		borderRadius: 2,
		boxShadow: 'inset 0 0 0 1px hsla(0,0%,100%,.2)',
		cursor: 'pointer',
		display: 'inline-block',
		height: _theme2['default'].thumbnail.size,
		margin: _theme2['default'].thumbnail.gutter,
		overflow: 'hidden',
		width: _theme2['default'].thumbnail.size
	},
	thumbnail__active: {
		boxShadow: 'inset 0 0 0 2px ' + _theme2['default'].thumbnail.activeBorderColor
	}
};

exports['default'] = Thumbnail;
module.exports = exports['default'];

},{"../theme":38,"../utils":42,"aphrodite/no-important":6,"react":undefined}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports["default"] = function (fill) {
	return "<svg fill=\"" + fill + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"100%\" height=\"100%\" viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n\t\t<path d=\"M213.7,256L213.7,256L213.7,256L380.9,81.9c4.2-4.3,4.1-11.4-0.2-15.8l-29.9-30.6c-4.3-4.4-11.3-4.5-15.5-0.2L131.1,247.9 c-2.2,2.2-3.2,5.2-3,8.1c-0.1,3,0.9,5.9,3,8.1l204.2,212.7c4.2,4.3,11.2,4.2,15.5-0.2l29.9-30.6c4.3-4.4,4.4-11.5,0.2-15.8 L213.7,256z\"/>\n\t</svg>";
};

module.exports = exports["default"];

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports["default"] = function (fill) {
	return "<svg fill=\"" + fill + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"100%\" height=\"100%\" viewBox=\"0 0 512 512\" xml:space=\"preserve\">\n\t\t<path d=\"M298.3,256L298.3,256L298.3,256L131.1,81.9c-4.2-4.3-4.1-11.4,0.2-15.8l29.9-30.6c4.3-4.4,11.3-4.5,15.5-0.2l204.2,212.7 c2.2,2.2,3.2,5.2,3,8.1c0.1,3-0.9,5.9-3,8.1L176.7,476.8c-4.2,4.3-11.2,4.2-15.5-0.2L131.3,446c-4.3-4.4-4.4-11.5-0.2-15.8 L298.3,256z\"/>\n\t</svg>";
};

module.exports = exports["default"];

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports["default"] = function (fill) {
	return "<svg fill=\"" + fill + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"100%\" height=\"100%\" viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\">\n\t\t<path d=\"M443.6,387.1L312.4,255.4l131.5-130c5.4-5.4,5.4-14.2,0-19.6l-37.4-37.6c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4 L256,197.8L124.9,68.3c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4L68,105.9c-5.4,5.4-5.4,14.2,0,19.6l131.5,130L68.4,387.1 c-2.6,2.6-4.1,6.1-4.1,9.8c0,3.7,1.4,7.2,4.1,9.8l37.4,37.6c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1L256,313.1l130.7,131.1 c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1l37.4-37.6c2.6-2.6,4.1-6.1,4.1-9.8C447.7,393.2,446.2,389.7,443.6,387.1z\"/>\n\t</svg>";
};

module.exports = exports["default"];

},{}],37:[function(require,module,exports){
'use strict';

module.exports = {
	arrowLeft: require('./arrowLeft'),
	arrowRight: require('./arrowRight'),
	close: require('./close')
};

},{"./arrowLeft":34,"./arrowRight":35,"./close":36}],38:[function(require,module,exports){
// ==============================
// THEME
// ==============================

'use strict';

var theme = {};

// container
theme.container = {
	background: 'rgba(0, 0, 0, 0.8)',
	gutter: {
		horizontal: 10,
		vertical: 10
	},
	zIndex: 2001
};

// header
theme.header = {
	height: 40
};
theme.close = {
	fill: 'white',
	height: 20,
	width: 20
};

// footer
theme.footer = {
	color: 'white',
	count: {
		color: 'rgba(255, 255, 255, 0.75)',
		fontSize: '0.85em'
	},
	height: 40,
	gutter: {
		horizontal: 0,
		vertical: 5
	}
};

// thumbnails
theme.thumbnail = {
	activeBorderColor: 'white',
	size: 50,
	gutter: 2
};

// arrow
theme.arrow = {
	background: 'black',
	fill: 'white',
	height: 120
};

module.exports = theme;

},{}],39:[function(require,module,exports){
/**
	Bind multiple component methods:

	* @param {this} context
	* @param {Array} functions

	constructor() {
		...
		bindFunctions.call(this, ['handleClick', 'handleOther']);
	}
*/

"use strict";

module.exports = function bindFunctions(functions) {
	var _this = this;

	functions.forEach(function (f) {
		return _this[f] = _this[f].bind(_this);
	});
};

},{}],40:[function(require,module,exports){
// Return true if window + document

'use strict';

module.exports = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

},{}],41:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function deepMerge(target) {
	var source = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	var extended = _extends({}, target);

	Object.keys(source).forEach(function (key) {
		if (typeof source[key] !== 'object' || !source[key]) {
			extended[key] = source[key];
		} else {
			if (!target[key]) {
				extended[key] = source[key];
			} else {
				extended[key] = deepMerge(target[key], source[key]);
			}
		}
	});

	return extended;
}

module.exports = deepMerge;

},{}],42:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bindFunctions = require('./bindFunctions');

var _bindFunctions2 = _interopRequireDefault(_bindFunctions);

var _canUseDom = require('./canUseDom');

var _canUseDom2 = _interopRequireDefault(_canUseDom);

var _deepMerge = require('./deepMerge');

var _deepMerge2 = _interopRequireDefault(_deepMerge);

module.exports = {
	bindFunctions: _bindFunctions2['default'],
	canUseDom: _canUseDom2['default'],
	deepMerge: _deepMerge2['default']
};

},{"./bindFunctions":39,"./canUseDom":40,"./deepMerge":41}],"react-images":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _aphroditeNoImportant = require('aphrodite/no-important');

var _reactSwipeable = require('react-swipeable');

var _reactSwipeable2 = _interopRequireDefault(_reactSwipeable);

var _reactMotion = require('react-motion');

var _theme = require('./theme');

var _theme2 = _interopRequireDefault(_theme);

var _componentsArrow = require('./components/Arrow');

var _componentsArrow2 = _interopRequireDefault(_componentsArrow);

var _componentsContainer = require('./components/Container');

var _componentsContainer2 = _interopRequireDefault(_componentsContainer);

var _componentsFooter = require('./components/Footer');

var _componentsFooter2 = _interopRequireDefault(_componentsFooter);

var _componentsHeader = require('./components/Header');

var _componentsHeader2 = _interopRequireDefault(_componentsHeader);

var _componentsPaginatedThumbnails = require('./components/PaginatedThumbnails');

var _componentsPaginatedThumbnails2 = _interopRequireDefault(_componentsPaginatedThumbnails);

var _componentsPortal = require('./components/Portal');

var _componentsPortal2 = _interopRequireDefault(_componentsPortal);

var _componentsScrollLock = require('./components/ScrollLock');

var _componentsScrollLock2 = _interopRequireDefault(_componentsScrollLock);

var _utils = require('./utils');

var Lightbox = (function (_Component) {
	_inherits(Lightbox, _Component);

	function Lightbox() {
		_classCallCheck(this, Lightbox);

		_get(Object.getPrototypeOf(Lightbox.prototype), 'constructor', this).call(this);

		this.state = {
			isSwipingLeft: false,
			isSwipingRight: false,
			swipeDeltaX: 0
		};

		_utils.bindFunctions.call(this, ['gotoNext', 'gotoPrev', 'onSwipingLeft', 'onSwipingRight', 'onStopSwiping', 'onMotionRest', 'handleKeyboardInput']);
	}

	_createClass(Lightbox, [{
		key: 'getChildContext',
		value: function getChildContext() {
			return {
				theme: this.props.theme
			};
		}
	}, {
		key: 'componentWillReceiveProps',
		value: function componentWillReceiveProps(nextProps) {
			if (!_utils.canUseDom) return;

			// preload images
			if (nextProps.preloadNextImage) {
				var currentIndex = this.props.currentImage;
				var nextIndex = nextProps.currentImage + 1;
				var prevIndex = nextProps.currentImage - 1;
				var preloadIndex = undefined;

				if (currentIndex && nextProps.currentImage > currentIndex) {
					preloadIndex = nextIndex;
				} else if (currentIndex && nextProps.currentImage < currentIndex) {
					preloadIndex = prevIndex;
				}

				// if we know the user's direction just get one image
				// otherwise, to be safe, we need to grab one in each direction
				if (preloadIndex) {
					this.preloadImage(preloadIndex);
				} else {
					this.preloadImage(prevIndex);
					this.preloadImage(nextIndex);
				}
			}

			// add event listeners
			if (nextProps.enableKeyboardInput) {
				window.addEventListener('keydown', this.handleKeyboardInput);
			} else {
				window.removeEventListener('keydown', this.handleKeyboardInput);
			}
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			if (this.props.enableKeyboardInput) {
				window.removeEventListener('keydown', this.handleKeyboardInput);
			}
		}

		// ==============================
		// METHODS
		// ==============================

	}, {
		key: 'preloadImage',
		value: function preloadImage(idx) {
			var image = this.props.images[idx];

			if (!image) return;

			var img = new Image();

			img.src = image.src;

			if (image.srcset) {
				img.srcset = image.srcset.join();
			}
		}
	}, {
		key: 'gotoNext',
		value: function gotoNext(event) {
			if (this.isLastImage()) return;
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}
			this.resetSwipe(this.props.onClickNext);
		}
	}, {
		key: 'gotoPrev',
		value: function gotoPrev(event) {
			if (this.isFirstImage()) return;
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}
			this.resetSwipe(this.props.onClickPrev);
		}
	}, {
		key: 'handleKeyboardInput',
		value: function handleKeyboardInput(event) {
			if (event.keyCode === 37) {
				this.gotoPrev(event);
				return true;
			} else if (event.keyCode === 39) {
				this.gotoNext(event);
				return true;
			} else if (event.keyCode === 27) {
				this.props.onClose();
				return true;
			}
			return false;
		}
	}, {
		key: 'onSwipingLeft',
		value: function onSwipingLeft(e, deltaX) {
			if (this.isLastImage()) return;
			this.setState({
				isSwipingLeft: true,
				isSwipingRight: false,
				swipeDeltaX: deltaX
			});
		}
	}, {
		key: 'onSwipingRight',
		value: function onSwipingRight(e, deltaX) {
			if (this.isFirstImage()) return;
			this.setState({
				isSwipingLeft: false,
				isSwipingRight: true,
				swipeDeltaX: deltaX
			});
		}
	}, {
		key: 'onStopSwiping',
		value: function onStopSwiping() {
			var windowWidth = window.innerWidth;
			this.setState({
				swipeDeltaX: windowWidth
			});
		}
	}, {
		key: 'onMotionRest',
		value: function onMotionRest() {
			var _this = this;

			var wasSwipingLeft = this.state.isSwipingLeft;
			var wasSwipingRight = this.state.isSwipingRight;
			this.setState({
				isSwipingLeft: false,
				isSwipingRight: false
			}, function () {
				var fakeEvent = {
					preventDefault: function preventDefault() {},
					stopPropagation: function stopPropagation() {}
				};

				if (wasSwipingLeft) {
					_this.gotoNext(fakeEvent);
				} else if (wasSwipingRight) {
					_this.gotoPrev(fakeEvent);
				}
			});
		}
	}, {
		key: 'isFirstImage',
		value: function isFirstImage() {
			return this.props.currentImage === 0;
		}
	}, {
		key: 'isLastImage',
		value: function isLastImage() {
			return this.props.currentImage === this.props.images.length - 1;
		}
	}, {
		key: 'resetSwipe',
		value: function resetSwipe(onReset) {
			this.setState({
				isSwipingLeft: false,
				isSwipingRight: false,
				swipeDeltaX: 0
			}, function () {
				onReset ? onReset() : null;
			});
		}

		// ==============================
		// RENDERERS
		// ==============================

	}, {
		key: 'renderArrowPrev',
		value: function renderArrowPrev() {
			if (this.props.currentImage === 0) return null;

			return _react2['default'].createElement(_componentsArrow2['default'], {
				direction: 'left',
				icon: 'arrowLeft',
				onClick: this.gotoPrev,
				title: 'Previous (Left arrow key)',
				type: 'button'
			});
		}
	}, {
		key: 'renderArrowNext',
		value: function renderArrowNext() {
			if (this.props.currentImage === this.props.images.length - 1) return null;

			return _react2['default'].createElement(_componentsArrow2['default'], {
				direction: 'right',
				icon: 'arrowRight',
				onClick: this.gotoNext,
				title: 'Previous (Right arrow key)',
				type: 'button'
			});
		}
	}, {
		key: 'renderDialog',
		value: function renderDialog() {
			var _props = this.props;
			var backdropClosesModal = _props.backdropClosesModal;
			var customControls = _props.customControls;
			var isOpen = _props.isOpen;
			var onClose = _props.onClose;
			var showCloseButton = _props.showCloseButton;
			var showThumbnails = _props.showThumbnails;
			var width = _props.width;

			if (!isOpen) return _react2['default'].createElement('span', { key: 'closed' });

			var offsetThumbnails = 0;
			if (showThumbnails) {
				offsetThumbnails = _theme2['default'].thumbnail.size + _theme2['default'].container.gutter.vertical;
			}

			return _react2['default'].createElement(
				_componentsContainer2['default'],
				{
					key: 'open',
					onClick: !!backdropClosesModal && onClose,
					onTouchEnd: !!backdropClosesModal && onClose
				},
				_react2['default'].createElement(
					'div',
					{ className: (0, _aphroditeNoImportant.css)(classes.content), style: { marginBottom: offsetThumbnails, maxWidth: width } },
					_react2['default'].createElement(_componentsHeader2['default'], {
						customControls: customControls,
						onClose: onClose,
						showCloseButton: showCloseButton
					}),
					this.renderImages()
				),
				this.renderThumbnails(),
				this.renderArrowPrev(),
				this.renderArrowNext(),
				_react2['default'].createElement(_componentsScrollLock2['default'], null)
			);
		}
	}, {
		key: 'renderImages',
		value: function renderImages() {
			var _this2 = this;

			var _props2 = this.props;
			var currentImage = _props2.currentImage;
			var images = _props2.images;
			var imageCountSeparator = _props2.imageCountSeparator;
			var onClickImage = _props2.onClickImage;
			var showImageCount = _props2.showImageCount;
			var showThumbnails = _props2.showThumbnails;

			if (!images || !images.length) return null;

			var image = images[currentImage];

			var imageLeft = undefined;
			var imageRight = undefined;
			var deltaX = undefined;
			var motionStyle = { deltaX: 0 };
			if (this.state.isSwipingRight) {
				imageLeft = images[currentImage - 1];
				motionStyle = { deltaX: (0, _reactMotion.spring)(this.state.swipeDeltaX) };
			} else if (this.state.isSwipingLeft) {
				imageRight = images[currentImage + 1];
				motionStyle = { deltaX: (0, _reactMotion.spring)(-this.state.swipeDeltaX) };
			}

			var srcset = undefined;
			var sizes = undefined;

			if (image.srcset) {
				srcset = image.srcset.join();
				sizes = '100vw';
			}

			var thumbnailsSize = showThumbnails ? _theme2['default'].thumbnail.size : 0;
			var heightOffset = _theme2['default'].header.height + _theme2['default'].footer.height + thumbnailsSize + _theme2['default'].container.gutter.vertical + 'px';

			return _react2['default'].createElement(
				'figure',
				{ className: (0, _aphroditeNoImportant.css)(classes.figure) },
				_react2['default'].createElement(
					_reactSwipeable2['default'],
					{
						onSwipedLeft: this.onStopSwiping,
						onSwipedRight: this.onStopSwiping,
						onSwipingLeft: this.onSwipingLeft,
						onSwipingRight: this.onSwipingRight
					},
					_react2['default'].createElement(
						_reactMotion.Motion,
						{
							style: motionStyle,
							onRest: this.onMotionRest
						},
						function (_ref) {
							var deltaX = _ref.deltaX;
							return _react2['default'].createElement(
								'div',
								null,
								imageLeft ? _react2['default'].createElement(
									'div',
									{
										key: currentImage - 1,
										className: (0, _aphroditeNoImportant.css)(classes.imageContainer),
										style: { marginLeft: -window.innerWidth + deltaX }
									},
									_react2['default'].createElement('img', {
										className: (0, _aphroditeNoImportant.css)(classes.image),
										sizes: sizes,
										src: imageLeft.src,
										srcSet: imageLeft.srcset.join(),
										style: {
											cursor: _this2.props.onClickImage ? 'pointer' : 'auto',
											maxHeight: 'calc(100vh - ' + heightOffset + ')'
										}
									}),
									_react2['default'].createElement(_componentsFooter2['default'], {
										caption: images[currentImage - 1].caption,
										countCurrent: currentImage,
										countSeparator: imageCountSeparator,
										countTotal: images.length,
										showCount: showImageCount
									})
								) : null,
								_react2['default'].createElement(
									'div',
									{
										key: currentImage,
										className: (0, _aphroditeNoImportant.css)(classes.imageContainer),
										style: { marginLeft: deltaX }
									},
									_react2['default'].createElement('img', {
										className: (0, _aphroditeNoImportant.css)(classes.image),
										onClick: !!onClickImage && onClickImage,
										sizes: sizes,
										src: image.src,
										srcSet: srcset,
										style: {
											cursor: _this2.props.onClickImage ? 'pointer' : 'auto',
											maxHeight: 'calc(100vh - ' + heightOffset + ')'
										}
									}),
									_react2['default'].createElement(_componentsFooter2['default'], {
										caption: images[currentImage].caption,
										countCurrent: currentImage + 1,
										countSeparator: imageCountSeparator,
										countTotal: images.length,
										showCount: showImageCount
									})
								),
								imageRight ? _react2['default'].createElement(
									'div',
									{
										key: currentImage + 1,
										className: (0, _aphroditeNoImportant.css)(classes.imageContainer),
										style: { marginLeft: window.innerWidth + deltaX }
									},
									_react2['default'].createElement('img', {
										className: (0, _aphroditeNoImportant.css)(classes.image),
										sizes: sizes,
										src: imageRight.src,
										srcSet: imageRight.srcset.join(),
										style: {
											cursor: _this2.props.onClickImage ? 'pointer' : 'auto',
											maxHeight: 'calc(100vh - ' + heightOffset + ')'
										}
									}),
									_react2['default'].createElement(_componentsFooter2['default'], {
										caption: images[currentImage + 1].caption,
										countCurrent: currentImage + 2,
										countSeparator: imageCountSeparator,
										countTotal: images.length,
										showCount: showImageCount
									})
								) : null
							);
						}
					)
				)
			);
		}
	}, {
		key: 'renderThumbnails',
		value: function renderThumbnails() {
			var _props3 = this.props;
			var images = _props3.images;
			var currentImage = _props3.currentImage;
			var onClickThumbnail = _props3.onClickThumbnail;
			var showThumbnails = _props3.showThumbnails;
			var thumbnailOffset = _props3.thumbnailOffset;

			if (!showThumbnails) return;

			return _react2['default'].createElement(_componentsPaginatedThumbnails2['default'], {
				currentImage: currentImage,
				images: images,
				offset: thumbnailOffset,
				onClickThumbnail: onClickThumbnail
			});
		}
	}, {
		key: 'render',
		value: function render() {
			return _react2['default'].createElement(
				_componentsPortal2['default'],
				null,
				this.renderDialog()
			);
		}
	}]);

	return Lightbox;
})(_react.Component);

Lightbox.propTypes = {
	backdropClosesModal: _react.PropTypes.bool,
	currentImage: _react.PropTypes.number,
	customControls: _react.PropTypes.arrayOf(_react.PropTypes.node),
	enableKeyboardInput: _react.PropTypes.bool,
	imageCountSeparator: _react.PropTypes.string,
	images: _react.PropTypes.arrayOf(_react.PropTypes.shape({
		src: _react.PropTypes.string.isRequired,
		srcset: _react.PropTypes.array,
		caption: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.element]),
		thumbnail: _react.PropTypes.string
	})).isRequired,
	isOpen: _react.PropTypes.bool,
	onClickImage: _react.PropTypes.func,
	onClickNext: _react.PropTypes.func,
	onClickPrev: _react.PropTypes.func,
	onClose: _react.PropTypes.func.isRequired,
	preloadNextImage: _react.PropTypes.bool,
	sheet: _react.PropTypes.object,
	showCloseButton: _react.PropTypes.bool,
	showImageCount: _react.PropTypes.bool,
	showThumbnails: _react.PropTypes.bool,
	theme: _react.PropTypes.object,
	thumbnailOffset: _react.PropTypes.number,
	width: _react.PropTypes.number
};
Lightbox.defaultProps = {
	currentImage: 0,
	enableKeyboardInput: true,
	imageCountSeparator: ' of ',
	onClickShowNextImage: true,
	preloadNextImage: true,
	showCloseButton: true,
	showImageCount: true,
	theme: {},
	thumbnailOffset: 2,
	width: 1024
};
Lightbox.childContextTypes = {
	theme: _react.PropTypes.object.isRequired
};

var classes = _aphroditeNoImportant.StyleSheet.create({
	content: {
		position: 'relative',
		width: '100%'
	},
	figure: {
		margin: 0 },
	// remove browser default
	imageContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: '100%',
		marginTop: _theme2['default'].footer.height / 2
	},
	image: {
		display: 'block', // removes browser default gutter
		height: 'auto',
		margin: '0 auto', // maintain center on very short screens OR very narrow image
		maxWidth: '100%',

		// disable user select
		WebkitTouchCallout: 'none',
		userSelect: 'none'
	}
});

exports['default'] = Lightbox;
module.exports = exports['default'];

},{"./components/Arrow":24,"./components/Container":25,"./components/Footer":26,"./components/Header":27,"./components/PaginatedThumbnails":29,"./components/Portal":31,"./components/ScrollLock":32,"./theme":38,"./utils":42,"aphrodite/no-important":6,"react":undefined,"react-motion":undefined,"react-swipeable":undefined}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXBocm9kaXRlL2xpYi9nZW5lcmF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9hcGhyb2RpdGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FwaHJvZGl0ZS9saWIvaW5qZWN0LmpzIiwibm9kZV9tb2R1bGVzL2FwaHJvZGl0ZS9saWIvbm8taW1wb3J0YW50LmpzIiwibm9kZV9tb2R1bGVzL2FwaHJvZGl0ZS9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9hcGhyb2RpdGUvbm8taW1wb3J0YW50LmpzIiwibm9kZV9tb2R1bGVzL2FzYXAvYnJvd3Nlci1hc2FwLmpzIiwibm9kZV9tb2R1bGVzL2FzYXAvYnJvd3Nlci1yYXcuanMiLCJub2RlX21vZHVsZXMvaHlwaGVuYXRlLXN0eWxlLW5hbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5saW5lLXN0eWxlLXByZWZpeGVyL2xpYi9zdGF0aWMvcGx1Z2lucy9jYWxjLmpzIiwibm9kZV9tb2R1bGVzL2lubGluZS1zdHlsZS1wcmVmaXhlci9saWIvc3RhdGljL3BsdWdpbnMvY3Vyc29yLmpzIiwibm9kZV9tb2R1bGVzL2lubGluZS1zdHlsZS1wcmVmaXhlci9saWIvc3RhdGljL3BsdWdpbnMvZmxleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3N0YXRpYy9wbHVnaW5zL2ZsZXhib3hJRS5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3N0YXRpYy9wbHVnaW5zL2ZsZXhib3hPbGQuanMiLCJub2RlX21vZHVsZXMvaW5saW5lLXN0eWxlLXByZWZpeGVyL2xpYi9zdGF0aWMvcGx1Z2lucy9ncmFkaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3N0YXRpYy9wbHVnaW5zL3NpemluZy5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3N0YXRpYy9wbHVnaW5zL3RyYW5zaXRpb24uanMiLCJub2RlX21vZHVsZXMvaW5saW5lLXN0eWxlLXByZWZpeGVyL2xpYi9zdGF0aWMvcHJlZml4QWxsLmpzIiwibm9kZV9tb2R1bGVzL2lubGluZS1zdHlsZS1wcmVmaXhlci9saWIvc3RhdGljL3ByZWZpeFByb3BzLmpzIiwibm9kZV9tb2R1bGVzL2lubGluZS1zdHlsZS1wcmVmaXhlci9saWIvdXRpbHMvY2FwaXRhbGl6ZVN0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3V0aWxzL2lzUHJlZml4ZWRWYWx1ZS5qcyIsIm5vZGVfbW9kdWxlcy9pbmxpbmUtc3R5bGUtcHJlZml4ZXIvbGliL3V0aWxzL2pvaW5QcmVmaXhlZFZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL2lubGluZS1zdHlsZS1wcmVmaXhlci9zdGF0aWMuanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL2NvbXBvbmVudHMvQXJyb3cuanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL2NvbXBvbmVudHMvQ29udGFpbmVyLmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9jb21wb25lbnRzL0Zvb3Rlci5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvY29tcG9uZW50cy9IZWFkZXIuanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL2NvbXBvbmVudHMvSWNvbi5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvY29tcG9uZW50cy9QYWdpbmF0ZWRUaHVtYm5haWxzLmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9jb21wb25lbnRzL1Bhc3NDb250ZXh0LmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9jb21wb25lbnRzL1BvcnRhbC5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvY29tcG9uZW50cy9TY3JvbGxMb2NrLmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9jb21wb25lbnRzL1RodW1ibmFpbC5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvaWNvbnMvYXJyb3dMZWZ0LmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9pY29ucy9hcnJvd1JpZ2h0LmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy9pY29ucy9jbG9zZS5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvaWNvbnMvaW5kZXguanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL3RoZW1lLmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy91dGlscy9iaW5kRnVuY3Rpb25zLmpzIiwiL2hvbWUvam9qby9Qcm9ncmFtbWllcmVuL3JlYWN0L293bi1naXRodWIvcmVhY3QtaW1hZ2VzL3NyYy91dGlscy9jYW5Vc2VEb20uanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL3V0aWxzL2RlZXBNZXJnZS5qcyIsIi9ob21lL2pvam8vUHJvZ3JhbW1pZXJlbi9yZWFjdC9vd24tZ2l0aHViL3JlYWN0LWltYWdlcy9zcmMvdXRpbHMvaW5kZXguanMiLCIvaG9tZS9qb2pvL1Byb2dyYW1taWVyZW4vcmVhY3Qvb3duLWdpdGh1Yi9yZWFjdC1pbWFnZXMvc3JjL0xpZ2h0Ym94LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtB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QUFDckIsZUFBYyxFQUFFLElBQUk7QUFDcEIsTUFBSyxFQUFFLEVBQUU7QUFDVCxnQkFBZSxFQUFFLENBQUM7QUFDbEIsTUFBSyxFQUFFLElBQUk7Q0FDWCxDQUFDO0FBQ0YsUUFBUSxDQUFDLGlCQUFpQixHQUFHO0FBQzVCLE1BQUssRUFBRSxpQkFBVSxNQUFNLENBQUMsVUFBVTtDQUNsQyxDQUFDOztBQUVGLElBQU0sT0FBTyxHQUFHLGlDQUFXLE1BQU0sQ0FBQztBQUNqQyxRQUFPLEVBQUU7QUFDUixVQUFRLEVBQUUsVUFBVTtBQUNwQixPQUFLLEVBQUUsTUFBTTtFQUNiO0FBQ0QsT0FBTSxFQUFFO0FBQ1AsUUFBTSxFQUFFLENBQUMsRUFDVDs7QUFDRCxlQUFjLEVBQUU7QUFDZixVQUFRLEVBQUUsVUFBVTtBQUNwQixLQUFHLEVBQUUsS0FBSztBQUNWLE1BQUksRUFBRSxLQUFLO0FBQ1gsV0FBUyxFQUFFLHVCQUF1QjtBQUNsQyxPQUFLLEVBQUUsTUFBTTtBQUNYLFdBQVMsRUFBRSxtQkFBTSxNQUFNLENBQUMsTUFBTSxHQUFDLENBQUM7RUFDbEM7QUFDRCxNQUFLLEVBQUU7QUFDTixTQUFPLEVBQUUsT0FBTztBQUNoQixRQUFNLEVBQUUsTUFBTTtBQUNkLFFBQU0sRUFBRSxRQUFRO0FBQ2hCLFVBQVEsRUFBRSxNQUFNOzs7QUFHaEIsb0JBQWtCLEVBQUUsTUFBTTtBQUMxQixZQUFVLEVBQUUsTUFBTTtFQUNsQjtDQUNELENBQUMsQ0FBQzs7cUJBRVksUUFBUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfaW5saW5lU3R5bGVQcmVmaXhlclN0YXRpYyA9IHJlcXVpcmUoJ2lubGluZS1zdHlsZS1wcmVmaXhlci9zdGF0aWMnKTtcblxudmFyIF9pbmxpbmVTdHlsZVByZWZpeGVyU3RhdGljMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lubGluZVN0eWxlUHJlZml4ZXJTdGF0aWMpO1xuXG52YXIgX3V0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBDU1MgZm9yIGEgc2VsZWN0b3IgYW5kIHNvbWUgc3R5bGVzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyB0aGUgbWVkaWEgcXVlcmllcywgcHNldWRvIHNlbGVjdG9ycywgYW5kIGRlc2NlbmRhbnRcbiAqIHN0eWxlcyB0aGF0IGNhbiBiZSB1c2VkIGluIGFwaHJvZGl0ZSBzdHlsZXMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yOiBBIGJhc2UgQ1NTIHNlbGVjdG9yIGZvciB0aGUgc3R5bGVzIHRvIGJlIGdlbmVyYXRlZFxuICogICAgIHdpdGguXG4gKiBAcGFyYW0ge09iamVjdH0gc3R5bGVUeXBlczogQSBsaXN0IG9mIHByb3BlcnRpZXMgb2YgdGhlIHJldHVybiB0eXBlIG9mXG4gKiAgICAgU3R5bGVTaGVldC5jcmVhdGUsIGUuZy4gW3N0eWxlcy5yZWQsIHN0eWxlcy5ibHVlXS5cbiAqIEBwYXJhbSBzdHJpbmdIYW5kbGVyczogU2VlIGBnZW5lcmF0ZUNTU1J1bGVzZXRgXG4gKiBAcGFyYW0gdXNlSW1wb3J0YW50OiBTZWUgYGdlbmVyYXRlQ1NTUnVsZXNldGBcbiAqXG4gKiBUbyBhY3R1YWxseSBnZW5lcmF0ZSB0aGUgQ1NTIHNwZWNpYWwtY29uc3RydWN0LWxlc3Mgc3R5bGVzIGFyZSBwYXNzZWQgdG9cbiAqIGBnZW5lcmF0ZUNTU1J1bGVzZXRgLlxuICpcbiAqIEZvciBpbnN0YW5jZSwgYSBjYWxsIHRvXG4gKlxuICogICAgIGdlbmVyYXRlQ1NTSW5uZXIoXCIuZm9vXCIsIHtcbiAqICAgICAgIGNvbG9yOiBcInJlZFwiLFxuICogICAgICAgXCJAbWVkaWEgc2NyZWVuXCI6IHtcbiAqICAgICAgICAgaGVpZ2h0OiAyMCxcbiAqICAgICAgICAgXCI6aG92ZXJcIjoge1xuICogICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJibGFja1wiXG4gKiAgICAgICAgIH1cbiAqICAgICAgIH0sXG4gKiAgICAgICBcIjphY3RpdmVcIjoge1xuICogICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAqICAgICAgICAgXCI+PmJhclwiOiB7XG4gKiAgICAgICAgICAgX25hbWVzOiB7IFwiZm9vX2JhclwiOiB0cnVlIH0sXG4gKiAgICAgICAgICAgaGVpZ2h0OiAxMCxcbiAqICAgICAgICAgfVxuICogICAgICAgfVxuICogICAgIH0pO1xuICpcbiAqIHdpbGwgbWFrZSA1IGNhbGxzIHRvIGBnZW5lcmF0ZUNTU1J1bGVzZXRgOlxuICpcbiAqICAgICBnZW5lcmF0ZUNTU1J1bGVzZXQoXCIuZm9vXCIsIHsgY29sb3I6IFwicmVkXCIgfSwgLi4uKVxuICogICAgIGdlbmVyYXRlQ1NTUnVsZXNldChcIi5mb286YWN0aXZlXCIsIHsgZm9udFdlaWdodDogXCJib2xkXCIgfSwgLi4uKVxuICogICAgIGdlbmVyYXRlQ1NTUnVsZXNldChcIi5mb286YWN0aXZlIC5mb29fYmFyXCIsIHsgaGVpZ2h0OiAxMCB9LCAuLi4pXG4gKiAgICAgLy8gVGhlc2UgMiB3aWxsIGJlIHdyYXBwZWQgaW4gQG1lZGlhIHNjcmVlbiB7fVxuICogICAgIGdlbmVyYXRlQ1NTUnVsZXNldChcIi5mb29cIiwgeyBoZWlnaHQ6IDIwIH0sIC4uLilcbiAqICAgICBnZW5lcmF0ZUNTU1J1bGVzZXQoXCIuZm9vOmhvdmVyXCIsIHsgYmFja2dyb3VuZENvbG9yOiBcImJsYWNrXCIgfSwgLi4uKVxuICovXG52YXIgZ2VuZXJhdGVDU1MgPSBmdW5jdGlvbiBnZW5lcmF0ZUNTUyhzZWxlY3Rvciwgc3R5bGVUeXBlcywgc3RyaW5nSGFuZGxlcnMsIHVzZUltcG9ydGFudCkge1xuICAgIHZhciBtZXJnZWQgPSBzdHlsZVR5cGVzLnJlZHVjZShfdXRpbC5yZWN1cnNpdmVNZXJnZSk7XG5cbiAgICB2YXIgZGVjbGFyYXRpb25zID0ge307XG4gICAgdmFyIG1lZGlhUXVlcmllcyA9IHt9O1xuICAgIHZhciBwc2V1ZG9TdHlsZXMgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKG1lcmdlZCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChrZXlbMF0gPT09ICc6Jykge1xuICAgICAgICAgICAgcHNldWRvU3R5bGVzW2tleV0gPSBtZXJnZWRba2V5XTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlbMF0gPT09ICdAJykge1xuICAgICAgICAgICAgbWVkaWFRdWVyaWVzW2tleV0gPSBtZXJnZWRba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uc1trZXldID0gbWVyZ2VkW2tleV07XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBnZW5lcmF0ZUNTU1J1bGVzZXQoc2VsZWN0b3IsIGRlY2xhcmF0aW9ucywgc3RyaW5nSGFuZGxlcnMsIHVzZUltcG9ydGFudCkgKyBPYmplY3Qua2V5cyhwc2V1ZG9TdHlsZXMpLm1hcChmdW5jdGlvbiAocHNldWRvU2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ1NTUnVsZXNldChzZWxlY3RvciArIHBzZXVkb1NlbGVjdG9yLCBwc2V1ZG9TdHlsZXNbcHNldWRvU2VsZWN0b3JdLCBzdHJpbmdIYW5kbGVycywgdXNlSW1wb3J0YW50KTtcbiAgICB9KS5qb2luKFwiXCIpICsgT2JqZWN0LmtleXMobWVkaWFRdWVyaWVzKS5tYXAoZnVuY3Rpb24gKG1lZGlhUXVlcnkpIHtcbiAgICAgICAgdmFyIHJ1bGVzZXQgPSBnZW5lcmF0ZUNTUyhzZWxlY3RvciwgW21lZGlhUXVlcmllc1ttZWRpYVF1ZXJ5XV0sIHN0cmluZ0hhbmRsZXJzLCB1c2VJbXBvcnRhbnQpO1xuICAgICAgICByZXR1cm4gbWVkaWFRdWVyeSArICd7JyArIHJ1bGVzZXQgKyAnfSc7XG4gICAgfSkuam9pbihcIlwiKTtcbn07XG5cbmV4cG9ydHMuZ2VuZXJhdGVDU1MgPSBnZW5lcmF0ZUNTUztcbi8qKlxuICogSGVscGVyIG1ldGhvZCBvZiBnZW5lcmF0ZUNTU1J1bGVzZXQgdG8gZmFjaWxpdGF0ZSBjdXN0b20gaGFuZGxpbmcgb2YgY2VydGFpblxuICogQ1NTIHByb3BlcnRpZXMuIFVzZWQgZm9yIGUuZy4gZm9udCBmYW1pbGllcy5cbiAqXG4gKiBTZWUgZ2VuZXJhdGVDU1NSdWxlc2V0IGZvciB1c2FnZSBhbmQgZG9jdW1lbnRhdGlvbiBvZiBwYXJhbWF0ZXIgdHlwZXMuXG4gKi9cbnZhciBydW5TdHJpbmdIYW5kbGVycyA9IGZ1bmN0aW9uIHJ1blN0cmluZ0hhbmRsZXJzKGRlY2xhcmF0aW9ucywgc3RyaW5nSGFuZGxlcnMpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG5cbiAgICBPYmplY3Qua2V5cyhkZWNsYXJhdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAvLyBJZiBhIGhhbmRsZXIgZXhpc3RzIGZvciB0aGlzIHBhcnRpY3VsYXIga2V5LCBsZXQgaXQgaW50ZXJwcmV0XG4gICAgICAgIC8vIHRoYXQgdmFsdWUgZmlyc3QgYmVmb3JlIGNvbnRpbnVpbmdcbiAgICAgICAgaWYgKHN0cmluZ0hhbmRsZXJzICYmIHN0cmluZ0hhbmRsZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gc3RyaW5nSGFuZGxlcnNba2V5XShkZWNsYXJhdGlvbnNba2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IGRlY2xhcmF0aW9uc1trZXldO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIENTUyBydWxlc2V0IHdpdGggdGhlIHNlbGVjdG9yIGFuZCBjb250YWluaW5nIHRoZSBkZWNsYXJhdGlvbnMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhc3N1bWVzIHRoYXQgdGhlIGdpdmVuIGRlY2xhcmF0aW9ucyBkb24ndCBjb250YWluIGFueSBzcGVjaWFsXG4gKiBjaGlsZHJlbiAoc3VjaCBhcyBtZWRpYSBxdWVyaWVzLCBwc2V1ZG8tc2VsZWN0b3JzLCBvciBkZXNjZW5kYW50IHN0eWxlcykuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgbWV0aG9kIGRvZXMgbm90IGRlYWwgd2l0aCBuZXN0aW5nIHVzZWQgZm9yIGUuZy5cbiAqIHBzdWVkby1zZWxlY3RvcnMgb3IgbWVkaWEgcXVlcmllcy4gVGhhdCByZXNwb25zaWJpbGl0eSBpcyBsZWZ0IHRvICB0aGVcbiAqIGBnZW5lcmF0ZUNTU2AgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yOiB0aGUgc2VsZWN0b3IgYXNzb2NpYXRlZCB3aXRoIHRoZSBydWxlc2V0XG4gKiBAcGFyYW0ge09iamVjdH0gZGVjbGFyYXRpb25zOiBhIG1hcCBmcm9tIGNhbWVsQ2FzZWQgQ1NTIHByb3BlcnR5IG5hbWUgdG8gQ1NTXG4gKiAgICAgcHJvcGVydHkgdmFsdWUuXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBmdW5jdGlvbj59IHN0cmluZ0hhbmRsZXJzOiBhIG1hcCBmcm9tIGNhbWVsQ2FzZWQgQ1NTXG4gKiAgICAgcHJvcGVydHkgbmFtZSB0byBhIGZ1bmN0aW9uIHdoaWNoIHdpbGwgbWFwIHRoZSBnaXZlbiB2YWx1ZSB0byB0aGUgdmFsdWVcbiAqICAgICB0aGF0IGlzIG91dHB1dC5cbiAqIEBwYXJhbSB7Ym9vbH0gdXNlSW1wb3J0YW50OiBBIGJvb2xlYW4gc2F5aW5nIHdoZXRoZXIgdG8gYXBwZW5kIFwiIWltcG9ydGFudFwiXG4gKiAgICAgdG8gZWFjaCBvZiB0aGUgQ1NTIGRlY2xhcmF0aW9ucy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEEgc3RyaW5nIG9mIHJhdyBDU1MuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgZ2VuZXJhdGVDU1NSdWxlc2V0KFwiLmJsYWhcIiwgeyBjb2xvcjogXCJyZWRcIiB9KVxuICogICAgLT4gXCIuYmxhaHtjb2xvcjogcmVkICFpbXBvcnRhbnQ7fVwiXG4gKiAgICBnZW5lcmF0ZUNTU1J1bGVzZXQoXCIuYmxhaFwiLCB7IGNvbG9yOiBcInJlZFwiIH0sIHt9LCBmYWxzZSlcbiAqICAgIC0+IFwiLmJsYWh7Y29sb3I6IHJlZH1cIlxuICogICAgZ2VuZXJhdGVDU1NSdWxlc2V0KFwiLmJsYWhcIiwgeyBjb2xvcjogXCJyZWRcIiB9LCB7Y29sb3I6IGMgPT4gYy50b1VwcGVyQ2FzZX0pXG4gKiAgICAtPiBcIi5ibGFoe2NvbG9yOiBSRUR9XCJcbiAqICAgIGdlbmVyYXRlQ1NTUnVsZXNldChcIi5ibGFoOmhvdmVyXCIsIHsgY29sb3I6IFwicmVkXCIgfSlcbiAqICAgIC0+IFwiLmJsYWg6aG92ZXJ7Y29sb3I6IHJlZH1cIlxuICovXG52YXIgZ2VuZXJhdGVDU1NSdWxlc2V0ID0gZnVuY3Rpb24gZ2VuZXJhdGVDU1NSdWxlc2V0KHNlbGVjdG9yLCBkZWNsYXJhdGlvbnMsIHN0cmluZ0hhbmRsZXJzLCB1c2VJbXBvcnRhbnQpIHtcbiAgICB2YXIgaGFuZGxlZERlY2xhcmF0aW9ucyA9IHJ1blN0cmluZ0hhbmRsZXJzKGRlY2xhcmF0aW9ucywgc3RyaW5nSGFuZGxlcnMpO1xuXG4gICAgdmFyIHByZWZpeGVkRGVjbGFyYXRpb25zID0gKDAsIF9pbmxpbmVTdHlsZVByZWZpeGVyU3RhdGljMlsnZGVmYXVsdCddKShoYW5kbGVkRGVjbGFyYXRpb25zKTtcblxuICAgIHZhciBwcmVmaXhlZFJ1bGVzID0gKDAsIF91dGlsLmZsYXR0ZW4pKCgwLCBfdXRpbC5vYmplY3RUb1BhaXJzKShwcmVmaXhlZERlY2xhcmF0aW9ucykubWFwKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgICAgIHZhciBfcmVmMiA9IF9zbGljZWRUb0FycmF5KF9yZWYsIDIpO1xuXG4gICAgICAgIHZhciBrZXkgPSBfcmVmMlswXTtcbiAgICAgICAgdmFyIHZhbHVlID0gX3JlZjJbMV07XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICB2YXIgX3JldCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gaW5saW5lLXN0eWxlLXByZWZpeC1hbGwgcmV0dXJucyBhbiBhcnJheSB3aGVuIHRoZXJlIHNob3VsZCBiZVxuICAgICAgICAgICAgICAgIC8vIG11bHRpcGxlIHJ1bGVzLCB3ZSB3aWxsIGZsYXR0ZW4gdG8gc2luZ2xlIHJ1bGVzXG5cbiAgICAgICAgICAgICAgICB2YXIgcHJlZml4ZWRWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdW5wcmVmaXhlZFZhbHVlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodi5pbmRleE9mKCctJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZpeGVkVmFsdWVzLnB1c2godik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bnByZWZpeGVkVmFsdWVzLnB1c2godik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHByZWZpeGVkVmFsdWVzLnNvcnQoKTtcbiAgICAgICAgICAgICAgICB1bnByZWZpeGVkVmFsdWVzLnNvcnQoKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHY6IHByZWZpeGVkVmFsdWVzLmNvbmNhdCh1bnByZWZpeGVkVmFsdWVzKS5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBba2V5LCB2XTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBfcmV0ID09PSAnb2JqZWN0JykgcmV0dXJuIF9yZXQudjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW1trZXksIHZhbHVlXV07XG4gICAgfSkpO1xuXG4gICAgdmFyIHJ1bGVzID0gcHJlZml4ZWRSdWxlcy5tYXAoZnVuY3Rpb24gKF9yZWYzKSB7XG4gICAgICAgIHZhciBfcmVmMzIgPSBfc2xpY2VkVG9BcnJheShfcmVmMywgMik7XG5cbiAgICAgICAgdmFyIGtleSA9IF9yZWYzMlswXTtcbiAgICAgICAgdmFyIHZhbHVlID0gX3JlZjMyWzFdO1xuXG4gICAgICAgIHZhciBzdHJpbmdWYWx1ZSA9ICgwLCBfdXRpbC5zdHJpbmdpZnlWYWx1ZSkoa2V5LCB2YWx1ZSk7XG4gICAgICAgIHZhciByZXQgPSAoMCwgX3V0aWwua2ViYWJpZnlTdHlsZU5hbWUpKGtleSkgKyAnOicgKyBzdHJpbmdWYWx1ZSArICc7JztcbiAgICAgICAgcmV0dXJuIHVzZUltcG9ydGFudCA9PT0gZmFsc2UgPyByZXQgOiAoMCwgX3V0aWwuaW1wb3J0YW50aWZ5KShyZXQpO1xuICAgIH0pLmpvaW4oXCJcIik7XG5cbiAgICBpZiAocnVsZXMpIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yICsgJ3snICsgcnVsZXMgKyAnfSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxufTtcbmV4cG9ydHMuZ2VuZXJhdGVDU1NSdWxlc2V0ID0gZ2VuZXJhdGVDU1NSdWxlc2V0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cbnZhciBfdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgX2luamVjdCA9IHJlcXVpcmUoJy4vaW5qZWN0Jyk7XG5cbnZhciBTdHlsZVNoZWV0ID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKHNoZWV0RGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gKDAsIF91dGlsLm1hcE9iaikoc2hlZXREZWZpbml0aW9uLCBmdW5jdGlvbiAoX3JlZikge1xuICAgICAgICAgICAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMik7XG5cbiAgICAgICAgICAgIHZhciBrZXkgPSBfcmVmMlswXTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBfcmVmMlsxXTtcblxuICAgICAgICAgICAgcmV0dXJuIFtrZXksIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPKGVtaWx5KTogTWFrZSBhICdwcm9kdWN0aW9uJyBtb2RlIHdoaWNoIGRvZXNuJ3QgcHJlcGVuZFxuICAgICAgICAgICAgICAgIC8vIHRoZSBjbGFzcyBuYW1lIGhlcmUsIHRvIG1ha2UgdGhlIGdlbmVyYXRlZCBDU1Mgc21hbGxlci5cbiAgICAgICAgICAgICAgICBfbmFtZToga2V5ICsgJ18nICsgKDAsIF91dGlsLmhhc2hPYmplY3QpKHZhbCksXG4gICAgICAgICAgICAgICAgX2RlZmluaXRpb246IHZhbFxuICAgICAgICAgICAgfV07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZWh5ZHJhdGU6IGZ1bmN0aW9uIHJlaHlkcmF0ZSgpIHtcbiAgICAgICAgdmFyIHJlbmRlcmVkQ2xhc3NOYW1lcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IFtdIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICgwLCBfaW5qZWN0LmFkZFJlbmRlcmVkQ2xhc3NOYW1lcykocmVuZGVyZWRDbGFzc05hbWVzKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFV0aWxpdGllcyBmb3IgdXNpbmcgQXBocm9kaXRlIHNlcnZlci1zaWRlLlxuICovXG52YXIgU3R5bGVTaGVldFNlcnZlciA9IHtcbiAgICByZW5kZXJTdGF0aWM6IGZ1bmN0aW9uIHJlbmRlclN0YXRpYyhyZW5kZXJGdW5jKSB7XG4gICAgICAgICgwLCBfaW5qZWN0LnJlc2V0KSgpO1xuICAgICAgICAoMCwgX2luamVjdC5zdGFydEJ1ZmZlcmluZykoKTtcbiAgICAgICAgdmFyIGh0bWwgPSByZW5kZXJGdW5jKCk7XG4gICAgICAgIHZhciBjc3NDb250ZW50ID0gKDAsIF9pbmplY3QuZmx1c2hUb1N0cmluZykoKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaHRtbDogaHRtbCxcbiAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNzc0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgcmVuZGVyZWRDbGFzc05hbWVzOiAoMCwgX2luamVjdC5nZXRSZW5kZXJlZENsYXNzTmFtZXMpKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFV0aWxpdGllcyBmb3IgdXNpbmcgQXBocm9kaXRlIGluIHRlc3RzLlxuICpcbiAqIE5vdCBtZWFudCB0byBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gKi9cbnZhciBTdHlsZVNoZWV0VGVzdFV0aWxzID0ge1xuICAgIC8qKlxuICAgICAqIFByZXZlbnQgc3R5bGVzIGZyb20gYmVpbmcgaW5qZWN0ZWQgaW50byB0aGUgRE9NLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB1c2VmdWwgaW4gc2l0dWF0aW9ucyB3aGVyZSB5b3UnZCBsaWtlIHRvIHRlc3QgcmVuZGVyaW5nIFVJXG4gICAgICogY29tcG9uZW50cyB3aGljaCB1c2UgQXBocm9kaXRlIHdpdGhvdXQgYW55IG9mIHRoZSBzaWRlLWVmZmVjdHMgb2ZcbiAgICAgKiBBcGhyb2RpdGUgaGFwcGVuaW5nLiBQYXJ0aWN1bGFybHkgdXNlZnVsIGZvciB0ZXN0aW5nIHRoZSBvdXRwdXQgb2ZcbiAgICAgKiBjb21wb25lbnRzIHdoZW4geW91IGhhdmUgbm8gRE9NLCBlLmcuIHRlc3RpbmcgaW4gTm9kZSB3aXRob3V0IGEgZmFrZSBET00uXG4gICAgICpcbiAgICAgKiBTaG91bGQgYmUgcGFpcmVkIHdpdGggYSBzdWJzZXF1ZW50IGNhbGwgdG9cbiAgICAgKiBjbGVhckJ1ZmZlckFuZFJlc3VtZVN0eWxlSW5qZWN0aW9uLlxuICAgICAqL1xuICAgIHN1cHByZXNzU3R5bGVJbmplY3Rpb246IGZ1bmN0aW9uIHN1cHByZXNzU3R5bGVJbmplY3Rpb24oKSB7XG4gICAgICAgICgwLCBfaW5qZWN0LnJlc2V0KSgpO1xuICAgICAgICAoMCwgX2luamVjdC5zdGFydEJ1ZmZlcmluZykoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3Bwb3NpdGUgbWV0aG9kIG9mIHByZXZlbnRTdHlsZUluamVjdC5cbiAgICAgKi9cbiAgICBjbGVhckJ1ZmZlckFuZFJlc3VtZVN0eWxlSW5qZWN0aW9uOiBmdW5jdGlvbiBjbGVhckJ1ZmZlckFuZFJlc3VtZVN0eWxlSW5qZWN0aW9uKCkge1xuICAgICAgICAoMCwgX2luamVjdC5yZXNldCkoKTtcbiAgICB9XG59O1xuXG52YXIgY3NzID0gZnVuY3Rpb24gY3NzKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBzdHlsZURlZmluaXRpb25zID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIHN0eWxlRGVmaW5pdGlvbnNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgdmFyIHVzZUltcG9ydGFudCA9IHRydWU7IC8vIEFwcGVuZCAhaW1wb3J0YW50IHRvIGFsbCBzdHlsZSBkZWZpbml0aW9uc1xuICAgIHJldHVybiAoMCwgX2luamVjdC5pbmplY3RBbmRHZXRDbGFzc05hbWUpKHVzZUltcG9ydGFudCwgc3R5bGVEZWZpbml0aW9ucyk7XG59O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gICAgU3R5bGVTaGVldDogU3R5bGVTaGVldCxcbiAgICBTdHlsZVNoZWV0U2VydmVyOiBTdHlsZVNoZWV0U2VydmVyLFxuICAgIFN0eWxlU2hlZXRUZXN0VXRpbHM6IFN0eWxlU2hlZXRUZXN0VXRpbHMsXG4gICAgY3NzOiBjc3Ncbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9hc2FwID0gcmVxdWlyZSgnYXNhcCcpO1xuXG52YXIgX2FzYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYXNhcCk7XG5cbnZhciBfZ2VuZXJhdGUgPSByZXF1aXJlKCcuL2dlbmVyYXRlJyk7XG5cbnZhciBfdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vLyBUaGUgY3VycmVudCA8c3R5bGU+IHRhZyB3ZSBhcmUgaW5zZXJ0aW5nIGludG8sIG9yIG51bGwgaWYgd2UgaGF2ZW4ndFxuLy8gaW5zZXJ0ZWQgYW55dGhpbmcgeWV0LiBXZSBjb3VsZCBmaW5kIHRoaXMgZWFjaCB0aW1lIHVzaW5nXG4vLyBgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcInN0eWxlW2RhdGEtYXBocm9kaXRlXCJdKWAsIGJ1dCBob2xkaW5nIG9udG8gaXQgaXNcbi8vIGZhc3Rlci5cbnZhciBzdHlsZVRhZyA9IG51bGw7XG5cbi8vIEluamVjdCBhIHN0cmluZyBvZiBzdHlsZXMgaW50byBhIDxzdHlsZT4gdGFnIGluIHRoZSBoZWFkIG9mIHRoZSBkb2N1bWVudC4gVGhpc1xuLy8gd2lsbCBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBhIHN0eWxlIHRhZyBhbmQgdGhlbiBjb250aW51ZSB0byB1c2UgaXQgZm9yXG4vLyBtdWx0aXBsZSBpbmplY3Rpb25zLiBJdCB3aWxsIGFsc28gdXNlIGEgc3R5bGUgdGFnIHdpdGggdGhlIGBkYXRhLWFwaHJvZGl0ZWBcbi8vIHRhZyBvbiBpdCBpZiB0aGF0IGV4aXN0cyBpbiB0aGUgRE9NLiBUaGlzIGNvdWxkIGJlIHVzZWQgZm9yIGUuZy4gcmV1c2luZyB0aGVcbi8vIHNhbWUgc3R5bGUgdGFnIHRoYXQgc2VydmVyLXNpZGUgcmVuZGVyaW5nIGluc2VydHMuXG52YXIgaW5qZWN0U3R5bGVUYWcgPSBmdW5jdGlvbiBpbmplY3RTdHlsZVRhZyhjc3NDb250ZW50cykge1xuICAgIGlmIChzdHlsZVRhZyA9PSBudWxsKSB7XG4gICAgICAgIC8vIFRyeSB0byBmaW5kIGEgc3R5bGUgdGFnIHdpdGggdGhlIGBkYXRhLWFwaHJvZGl0ZWAgYXR0cmlidXRlIGZpcnN0LlxuICAgICAgICBzdHlsZVRhZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJzdHlsZVtkYXRhLWFwaHJvZGl0ZV1cIik7XG5cbiAgICAgICAgLy8gSWYgdGhhdCBkb2Vzbid0IHdvcmssIGdlbmVyYXRlIGEgbmV3IHN0eWxlIHRhZy5cbiAgICAgICAgaWYgKHN0eWxlVGFnID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRha2VuIGZyb21cbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTI0Njk2L2hvdy10by1jcmVhdGUtYS1zdHlsZS10YWctd2l0aC1qYXZhc2NyaXB0XG4gICAgICAgICAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICAgICAgICAgIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxuICAgICAgICAgICAgc3R5bGVUYWcudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICAgICAgICBzdHlsZVRhZy5zZXRBdHRyaWJ1dGUoXCJkYXRhLWFwaHJvZGl0ZVwiLCBcIlwiKTtcbiAgICAgICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0eWxlVGFnLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgc3R5bGVUYWcuc3R5bGVTaGVldC5jc3NUZXh0ICs9IGNzc0NvbnRlbnRzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlVGFnLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzc0NvbnRlbnRzKSk7XG4gICAgfVxufTtcblxuLy8gQ3VzdG9tIGhhbmRsZXJzIGZvciBzdHJpbmdpZnlpbmcgQ1NTIHZhbHVlcyB0aGF0IGhhdmUgc2lkZSBlZmZlY3RzXG4vLyAoc3VjaCBhcyBmb250RmFtaWx5LCB3aGljaCBjYW4gY2F1c2UgQGZvbnQtZmFjZSBydWxlcyB0byBiZSBpbmplY3RlZClcbnZhciBzdHJpbmdIYW5kbGVycyA9IHtcbiAgICAvLyBXaXRoIGZvbnRGYW1pbHkgd2UgbG9vayBmb3Igb2JqZWN0cyB0aGF0IGFyZSBwYXNzZWQgaW4gYW5kIGludGVycHJldFxuICAgIC8vIHRoZW0gYXMgQGZvbnQtZmFjZSBydWxlcyB0aGF0IHdlIG5lZWQgdG8gaW5qZWN0LiBUaGUgdmFsdWUgb2YgZm9udEZhbWlseVxuICAgIC8vIGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcgKGFzIG5vcm1hbCksIGFuIG9iamVjdCAoYSBzaW5nbGUgZm9udCBmYWNlKSwgb3JcbiAgICAvLyBhbiBhcnJheSBvZiBvYmplY3RzIGFuZCBzdHJpbmdzLlxuICAgIGZvbnRGYW1pbHk6IGZ1bmN0aW9uIGZvbnRGYW1pbHkodmFsKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKGZvbnRGYW1pbHkpLmpvaW4oXCIsXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGluamVjdFN0eWxlT25jZSh2YWwuZm9udEZhbWlseSwgXCJAZm9udC1mYWNlXCIsIFt2YWxdLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gJ1wiJyArIHZhbC5mb250RmFtaWx5ICsgJ1wiJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gV2l0aCBhbmltYXRpb25OYW1lIHdlIGxvb2sgZm9yIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGtleWZyYW1lcyBhbmRcbiAgICAvLyBpbmplY3QgdGhlbSBhcyBhbiBgQGtleWZyYW1lc2AgYmxvY2ssIHJldHVybmluZyBhIHVuaXF1ZWx5IGdlbmVyYXRlZFxuICAgIC8vIG5hbWUuIFRoZSBrZXlmcmFtZXMgb2JqZWN0IHNob3VsZCBsb29rIGxpa2VcbiAgICAvLyAgYW5pbWF0aW9uTmFtZToge1xuICAgIC8vICAgIGZyb206IHtcbiAgICAvLyAgICAgIGxlZnQ6IDAsXG4gICAgLy8gICAgICB0b3A6IDAsXG4gICAgLy8gICAgfSxcbiAgICAvLyAgICAnNTAlJzoge1xuICAgIC8vICAgICAgbGVmdDogMTUsXG4gICAgLy8gICAgICB0b3A6IDUsXG4gICAgLy8gICAgfSxcbiAgICAvLyAgICB0bzoge1xuICAgIC8vICAgICAgbGVmdDogMjAsXG4gICAgLy8gICAgICB0b3A6IDIwLFxuICAgIC8vICAgIH1cbiAgICAvLyAgfVxuICAgIC8vIFRPRE8oZW1pbHkpOiBgc3RyaW5nSGFuZGxlcnNgIGRvZXNuJ3QgbGV0IHVzIHJlbmFtZSB0aGUga2V5LCBzbyBJIGhhdmVcbiAgICAvLyB0byB1c2UgYGFuaW1hdGlvbk5hbWVgIGhlcmUuIEltcHJvdmUgdGhhdCBzbyB3ZSBjYW4gY2FsbCB0aGlzXG4gICAgLy8gYGFuaW1hdGlvbmAgaW5zdGVhZCBvZiBgYW5pbWF0aW9uTmFtZWAuXG4gICAgYW5pbWF0aW9uTmFtZTogZnVuY3Rpb24gYW5pbWF0aW9uTmFtZSh2YWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBuYW1lIGJhc2VkIG9uIHRoZSBoYXNoIG9mIHRoZSBvYmplY3QuIFdlIGNhbid0XG4gICAgICAgIC8vIGp1c3QgdXNlIHRoZSBoYXNoIGJlY2F1c2UgdGhlIG5hbWUgY2FuJ3Qgc3RhcnQgd2l0aCBhIG51bWJlci5cbiAgICAgICAgLy8gVE9ETyhlbWlseSk6IHRoaXMgcHJvYmFibHkgbWFrZXMgZGVidWdnaW5nIGhhcmQsIGFsbG93IGEgY3VzdG9tXG4gICAgICAgIC8vIG5hbWU/XG4gICAgICAgIHZhciBuYW1lID0gJ2tleWZyYW1lXycgKyAoMCwgX3V0aWwuaGFzaE9iamVjdCkodmFsKTtcblxuICAgICAgICAvLyBTaW5jZSBrZXlmcmFtZXMgbmVlZCAzIGxheWVycyBvZiBuZXN0aW5nLCB3ZSB1c2UgYGdlbmVyYXRlQ1NTYCB0b1xuICAgICAgICAvLyBidWlsZCB0aGUgaW5uZXIgbGF5ZXJzIGFuZCB3cmFwIGl0IGluIGBAa2V5ZnJhbWVzYCBvdXJzZWx2ZXMuXG4gICAgICAgIHZhciBmaW5hbFZhbCA9ICdAa2V5ZnJhbWVzICcgKyBuYW1lICsgJ3snO1xuICAgICAgICBPYmplY3Qua2V5cyh2YWwpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgZmluYWxWYWwgKz0gKDAsIF9nZW5lcmF0ZS5nZW5lcmF0ZUNTUykoa2V5LCBbdmFsW2tleV1dLCBzdHJpbmdIYW5kbGVycywgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgZmluYWxWYWwgKz0gJ30nO1xuXG4gICAgICAgIGluamVjdEdlbmVyYXRlZENTU09uY2UobmFtZSwgZmluYWxWYWwpO1xuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbn07XG5cbi8vIFRoaXMgaXMgYSBtYXAgZnJvbSBBcGhyb2RpdGUncyBnZW5lcmF0ZWQgY2xhc3MgbmFtZXMgdG8gYHRydWVgIChhY3RpbmcgYXMgYVxuLy8gc2V0IG9mIGNsYXNzIG5hbWVzKVxudmFyIGFscmVhZHlJbmplY3RlZCA9IHt9O1xuXG4vLyBUaGlzIGlzIHRoZSBidWZmZXIgb2Ygc3R5bGVzIHdoaWNoIGhhdmUgbm90IHlldCBiZWVuIGZsdXNoZWQuXG52YXIgaW5qZWN0aW9uQnVmZmVyID0gXCJcIjtcblxuLy8gQSBmbGFnIHRvIHRlbGwgaWYgd2UgYXJlIGFscmVhZHkgYnVmZmVyaW5nIHN0eWxlcy4gVGhpcyBjb3VsZCBoYXBwZW4gZWl0aGVyXG4vLyBiZWNhdXNlIHdlIHNjaGVkdWxlZCBhIGZsdXNoIGNhbGwgYWxyZWFkeSwgc28gbmV3bHkgYWRkZWQgc3R5bGVzIHdpbGxcbi8vIGFscmVhZHkgYmUgZmx1c2hlZCwgb3IgYmVjYXVzZSB3ZSBhcmUgc3RhdGljYWxseSBidWZmZXJpbmcgb24gdGhlIHNlcnZlci5cbnZhciBpc0J1ZmZlcmluZyA9IGZhbHNlO1xuXG52YXIgaW5qZWN0R2VuZXJhdGVkQ1NTT25jZSA9IGZ1bmN0aW9uIGluamVjdEdlbmVyYXRlZENTU09uY2Uoa2V5LCBnZW5lcmF0ZWRDU1MpIHtcbiAgICBpZiAoIWFscmVhZHlJbmplY3RlZFtrZXldKSB7XG4gICAgICAgIGlmICghaXNCdWZmZXJpbmcpIHtcbiAgICAgICAgICAgIC8vIFdlIHNob3VsZCBuZXZlciBiZSBhdXRvbWF0aWNhbGx5IGJ1ZmZlcmluZyBvbiB0aGUgc2VydmVyIChvciBhbnlcbiAgICAgICAgICAgIC8vIHBsYWNlIHdpdGhvdXQgYSBkb2N1bWVudCksIHNvIGd1YXJkIGFnYWluc3QgdGhhdC5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYXV0b21hdGljYWxseSBidWZmZXIgd2l0aG91dCBhIGRvY3VtZW50XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSBub3QgYWxyZWFkeSBidWZmZXJpbmcsIHNjaGVkdWxlIGEgY2FsbCB0byBmbHVzaCB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgc3R5bGVzLlxuICAgICAgICAgICAgaXNCdWZmZXJpbmcgPSB0cnVlO1xuICAgICAgICAgICAgKDAsIF9hc2FwMlsnZGVmYXVsdCddKShmbHVzaFRvU3R5bGVUYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5qZWN0aW9uQnVmZmVyICs9IGdlbmVyYXRlZENTUztcbiAgICAgICAgYWxyZWFkeUluamVjdGVkW2tleV0gPSB0cnVlO1xuICAgIH1cbn07XG5cbnZhciBpbmplY3RTdHlsZU9uY2UgPSBmdW5jdGlvbiBpbmplY3RTdHlsZU9uY2Uoa2V5LCBzZWxlY3RvciwgZGVmaW5pdGlvbnMsIHVzZUltcG9ydGFudCkge1xuICAgIGlmICghYWxyZWFkeUluamVjdGVkW2tleV0pIHtcbiAgICAgICAgdmFyIGdlbmVyYXRlZCA9ICgwLCBfZ2VuZXJhdGUuZ2VuZXJhdGVDU1MpKHNlbGVjdG9yLCBkZWZpbml0aW9ucywgc3RyaW5nSGFuZGxlcnMsIHVzZUltcG9ydGFudCk7XG5cbiAgICAgICAgaW5qZWN0R2VuZXJhdGVkQ1NTT25jZShrZXksIGdlbmVyYXRlZCk7XG4gICAgfVxufTtcblxuZXhwb3J0cy5pbmplY3RTdHlsZU9uY2UgPSBpbmplY3RTdHlsZU9uY2U7XG52YXIgcmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBpbmplY3Rpb25CdWZmZXIgPSBcIlwiO1xuICAgIGFscmVhZHlJbmplY3RlZCA9IHt9O1xuICAgIGlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgc3R5bGVUYWcgPSBudWxsO1xufTtcblxuZXhwb3J0cy5yZXNldCA9IHJlc2V0O1xudmFyIHN0YXJ0QnVmZmVyaW5nID0gZnVuY3Rpb24gc3RhcnRCdWZmZXJpbmcoKSB7XG4gICAgaWYgKGlzQnVmZmVyaW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBidWZmZXIgd2hpbGUgYWxyZWFkeSBidWZmZXJpbmdcIik7XG4gICAgfVxuICAgIGlzQnVmZmVyaW5nID0gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuc3RhcnRCdWZmZXJpbmcgPSBzdGFydEJ1ZmZlcmluZztcbnZhciBmbHVzaFRvU3RyaW5nID0gZnVuY3Rpb24gZmx1c2hUb1N0cmluZygpIHtcbiAgICBpc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgIHZhciByZXQgPSBpbmplY3Rpb25CdWZmZXI7XG4gICAgaW5qZWN0aW9uQnVmZmVyID0gXCJcIjtcbiAgICByZXR1cm4gcmV0O1xufTtcblxuZXhwb3J0cy5mbHVzaFRvU3RyaW5nID0gZmx1c2hUb1N0cmluZztcbnZhciBmbHVzaFRvU3R5bGVUYWcgPSBmdW5jdGlvbiBmbHVzaFRvU3R5bGVUYWcoKSB7XG4gICAgdmFyIGNzc0NvbnRlbnQgPSBmbHVzaFRvU3RyaW5nKCk7XG4gICAgaWYgKGNzc0NvbnRlbnQubGVuZ3RoID4gMCkge1xuICAgICAgICBpbmplY3RTdHlsZVRhZyhjc3NDb250ZW50KTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmZsdXNoVG9TdHlsZVRhZyA9IGZsdXNoVG9TdHlsZVRhZztcbnZhciBnZXRSZW5kZXJlZENsYXNzTmFtZXMgPSBmdW5jdGlvbiBnZXRSZW5kZXJlZENsYXNzTmFtZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGFscmVhZHlJbmplY3RlZCk7XG59O1xuXG5leHBvcnRzLmdldFJlbmRlcmVkQ2xhc3NOYW1lcyA9IGdldFJlbmRlcmVkQ2xhc3NOYW1lcztcbnZhciBhZGRSZW5kZXJlZENsYXNzTmFtZXMgPSBmdW5jdGlvbiBhZGRSZW5kZXJlZENsYXNzTmFtZXMoY2xhc3NOYW1lcykge1xuICAgIGNsYXNzTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGFscmVhZHlJbmplY3RlZFtjbGFzc05hbWVdID0gdHJ1ZTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydHMuYWRkUmVuZGVyZWRDbGFzc05hbWVzID0gYWRkUmVuZGVyZWRDbGFzc05hbWVzO1xuLyoqXG4gKiBJbmplY3Qgc3R5bGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcGFzc2VkIHN0eWxlIGRlZmluaXRpb24gb2JqZWN0cywgYW5kIHJldHVyblxuICogYW4gYXNzb2NpYXRlZCBDU1MgY2xhc3MgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHVzZUltcG9ydGFudCBJZiB0cnVlLCB3aWxsIGFwcGVuZCAhaW1wb3J0YW50IHRvIGdlbmVyYXRlZFxuICogICAgIENTUyBvdXRwdXQuIGUuZy4ge2NvbG9yOiByZWR9IC0+IFwiY29sb3I6IHJlZCAhaW1wb3J0YW50XCIuXG4gKiBAcGFyYW0ge09iamVjdFtdfSBzdHlsZURlZmluaXRpb25zIHN0eWxlIGRlZmluaXRpb24gb2JqZWN0cyBhcyByZXR1cm5lZCBhc1xuICogICAgIHByb3BlcnRpZXMgb2YgdGhlIHJldHVybiB2YWx1ZSBvZiBTdHlsZVNoZWV0LmNyZWF0ZSgpLlxuICovXG52YXIgaW5qZWN0QW5kR2V0Q2xhc3NOYW1lID0gZnVuY3Rpb24gaW5qZWN0QW5kR2V0Q2xhc3NOYW1lKHVzZUltcG9ydGFudCwgc3R5bGVEZWZpbml0aW9ucykge1xuICAgIC8vIEZpbHRlciBvdXQgZmFsc3kgdmFsdWVzIGZyb20gdGhlIGlucHV0LCB0byBhbGxvdyBmb3JcbiAgICAvLyBgY3NzKGEsIHRlc3QgJiYgYylgXG4gICAgdmFyIHZhbGlkRGVmaW5pdGlvbnMgPSBzdHlsZURlZmluaXRpb25zLmZpbHRlcihmdW5jdGlvbiAoZGVmKSB7XG4gICAgICAgIHJldHVybiBkZWY7XG4gICAgfSk7XG5cbiAgICAvLyBCcmVhayBpZiB0aGVyZSBhcmVuJ3QgYW55IHZhbGlkIHN0eWxlcy5cbiAgICBpZiAodmFsaWREZWZpbml0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHZhbGlkRGVmaW5pdGlvbnMubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiBzLl9uYW1lO1xuICAgIH0pLmpvaW4oXCItb19PLVwiKTtcbiAgICBpbmplY3RTdHlsZU9uY2UoY2xhc3NOYW1lLCAnLicgKyBjbGFzc05hbWUsIHZhbGlkRGVmaW5pdGlvbnMubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkLl9kZWZpbml0aW9uO1xuICAgIH0pLCB1c2VJbXBvcnRhbnQpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZTtcbn07XG5leHBvcnRzLmluamVjdEFuZEdldENsYXNzTmFtZSA9IGluamVjdEFuZEdldENsYXNzTmFtZTsiLCIvLyBNb2R1bGUgd2l0aCB0aGUgc2FtZSBpbnRlcmZhY2UgYXMgdGhlIGNvcmUgYXBocm9kaXRlIG1vZHVsZSxcbi8vIGV4Y2VwdCB0aGF0IHN0eWxlcyBpbmplY3RlZCBkbyBub3QgYXV0b21hdGljYWxseSBoYXZlICFpbXBvcnRhbnRcbi8vIGFwcGVuZGVkIHRvIHRoZW0uXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2luamVjdCA9IHJlcXVpcmUoJy4vaW5qZWN0Jyk7XG5cbnZhciBfaW5kZXhKcyA9IHJlcXVpcmUoJy4vaW5kZXguanMnKTtcblxudmFyIGNzcyA9IGZ1bmN0aW9uIGNzcygpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgc3R5bGVEZWZpbml0aW9ucyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBzdHlsZURlZmluaXRpb25zW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHZhciB1c2VJbXBvcnRhbnQgPSBmYWxzZTsgLy8gRG9uJ3QgYXBwZW5kICFpbXBvcnRhbnQgdG8gc3R5bGUgZGVmaW5pdGlvbnNcbiAgICByZXR1cm4gKDAsIF9pbmplY3QuaW5qZWN0QW5kR2V0Q2xhc3NOYW1lKSh1c2VJbXBvcnRhbnQsIHN0eWxlRGVmaW5pdGlvbnMpO1xufTtcblxuZXhwb3J0cy5TdHlsZVNoZWV0ID0gX2luZGV4SnMuU3R5bGVTaGVldDtcbmV4cG9ydHMuU3R5bGVTaGVldFNlcnZlciA9IF9pbmRleEpzLlN0eWxlU2hlZXRTZXJ2ZXI7XG5leHBvcnRzLlN0eWxlU2hlZXRUZXN0VXRpbHMgPSBfaW5kZXhKcy5TdHlsZVNoZWV0VGVzdFV0aWxzO1xuZXhwb3J0cy5jc3MgPSBjc3M7IiwiLy8ge0sxOiBWMSwgSzI6IFYyLCAuLi59IC0+IFtbSzEsIFYxXSwgW0syLCBWMl1dXG4ndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgb2JqZWN0VG9QYWlycyA9IGZ1bmN0aW9uIG9iamVjdFRvUGFpcnMob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIFtrZXksIG9ialtrZXldXTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydHMub2JqZWN0VG9QYWlycyA9IG9iamVjdFRvUGFpcnM7XG4vLyBbW0sxLCBWMV0sIFtLMiwgVjJdXSAtPiB7SzE6IFYxLCBLMjogVjIsIC4uLn1cbnZhciBwYWlyc1RvT2JqZWN0ID0gZnVuY3Rpb24gcGFpcnNUb09iamVjdChwYWlycykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBwYWlycy5mb3JFYWNoKGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgICAgIHZhciBfcmVmMiA9IF9zbGljZWRUb0FycmF5KF9yZWYsIDIpO1xuXG4gICAgICAgIHZhciBrZXkgPSBfcmVmMlswXTtcbiAgICAgICAgdmFyIHZhbCA9IF9yZWYyWzFdO1xuXG4gICAgICAgIHJlc3VsdFtrZXldID0gdmFsO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG52YXIgbWFwT2JqID0gZnVuY3Rpb24gbWFwT2JqKG9iaiwgZm4pIHtcbiAgICByZXR1cm4gcGFpcnNUb09iamVjdChvYmplY3RUb1BhaXJzKG9iaikubWFwKGZuKSk7XG59O1xuXG5leHBvcnRzLm1hcE9iaiA9IG1hcE9iajtcbi8vIEZsYXR0ZW5zIGFuIGFycmF5IG9uZSBsZXZlbFxuLy8gW1tBXSwgW0IsIEMsIFtEXV1dIC0+IFtBLCBCLCBDLCBbRF1dXG52YXIgZmxhdHRlbiA9IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdCkge1xuICAgIHJldHVybiBsaXN0LnJlZHVjZShmdW5jdGlvbiAobWVtbywgeCkge1xuICAgICAgICByZXR1cm4gbWVtby5jb25jYXQoeCk7XG4gICAgfSwgW10pO1xufTtcblxuZXhwb3J0cy5mbGF0dGVuID0gZmxhdHRlbjtcbnZhciBVUFBFUkNBU0VfUkUgPSAvKFtBLVpdKS9nO1xudmFyIE1TX1JFID0gL15tcy0vO1xuXG52YXIga2ViYWJpZnkgPSBmdW5jdGlvbiBrZWJhYmlmeShzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoVVBQRVJDQVNFX1JFLCAnLSQxJykudG9Mb3dlckNhc2UoKTtcbn07XG52YXIga2ViYWJpZnlTdHlsZU5hbWUgPSBmdW5jdGlvbiBrZWJhYmlmeVN0eWxlTmFtZShzdHJpbmcpIHtcbiAgICByZXR1cm4ga2ViYWJpZnkoc3RyaW5nKS5yZXBsYWNlKE1TX1JFLCAnLW1zLScpO1xufTtcblxuZXhwb3J0cy5rZWJhYmlmeVN0eWxlTmFtZSA9IGtlYmFiaWZ5U3R5bGVOYW1lO1xudmFyIHJlY3Vyc2l2ZU1lcmdlID0gZnVuY3Rpb24gcmVjdXJzaXZlTWVyZ2UoYSwgYikge1xuICAgIC8vIFRPRE8oamxmd29uZyk6IEhhbmRsZSBtYWxmb3JtZWQgaW5wdXQgd2hlcmUgYSBhbmQgYiBhcmUgbm90IHRoZSBzYW1lXG4gICAgLy8gdHlwZS5cblxuICAgIGlmICh0eXBlb2YgYSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgdmFyIHJldCA9IF9leHRlbmRzKHt9LCBhKTtcblxuICAgIE9iamVjdC5rZXlzKGIpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAocmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJldFtrZXldID0gcmVjdXJzaXZlTWVyZ2UoYVtrZXldLCBiW2tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0W2tleV0gPSBiW2tleV07XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5leHBvcnRzLnJlY3Vyc2l2ZU1lcmdlID0gcmVjdXJzaXZlTWVyZ2U7XG4vKipcbiAqIENTUyBwcm9wZXJ0aWVzIHdoaWNoIGFjY2VwdCBudW1iZXJzIGJ1dCBhcmUgbm90IGluIHVuaXRzIG9mIFwicHhcIi5cbiAqIFRha2VuIGZyb20gUmVhY3QncyBDU1NQcm9wZXJ0eS5qc1xuICovXG52YXIgaXNVbml0bGVzc051bWJlciA9IHtcbiAgICBhbmltYXRpb25JdGVyYXRpb25Db3VudDogdHJ1ZSxcbiAgICBib3JkZXJJbWFnZU91dHNldDogdHJ1ZSxcbiAgICBib3JkZXJJbWFnZVNsaWNlOiB0cnVlLFxuICAgIGJvcmRlckltYWdlV2lkdGg6IHRydWUsXG4gICAgYm94RmxleDogdHJ1ZSxcbiAgICBib3hGbGV4R3JvdXA6IHRydWUsXG4gICAgYm94T3JkaW5hbEdyb3VwOiB0cnVlLFxuICAgIGNvbHVtbkNvdW50OiB0cnVlLFxuICAgIGZsZXg6IHRydWUsXG4gICAgZmxleEdyb3c6IHRydWUsXG4gICAgZmxleFBvc2l0aXZlOiB0cnVlLFxuICAgIGZsZXhTaHJpbms6IHRydWUsXG4gICAgZmxleE5lZ2F0aXZlOiB0cnVlLFxuICAgIGZsZXhPcmRlcjogdHJ1ZSxcbiAgICBncmlkUm93OiB0cnVlLFxuICAgIGdyaWRDb2x1bW46IHRydWUsXG4gICAgZm9udFdlaWdodDogdHJ1ZSxcbiAgICBsaW5lQ2xhbXA6IHRydWUsXG4gICAgbGluZUhlaWdodDogdHJ1ZSxcbiAgICBvcGFjaXR5OiB0cnVlLFxuICAgIG9yZGVyOiB0cnVlLFxuICAgIG9ycGhhbnM6IHRydWUsXG4gICAgdGFiU2l6ZTogdHJ1ZSxcbiAgICB3aWRvd3M6IHRydWUsXG4gICAgekluZGV4OiB0cnVlLFxuICAgIHpvb206IHRydWUsXG5cbiAgICAvLyBTVkctcmVsYXRlZCBwcm9wZXJ0aWVzXG4gICAgZmlsbE9wYWNpdHk6IHRydWUsXG4gICAgZmxvb2RPcGFjaXR5OiB0cnVlLFxuICAgIHN0b3BPcGFjaXR5OiB0cnVlLFxuICAgIHN0cm9rZURhc2hhcnJheTogdHJ1ZSxcbiAgICBzdHJva2VEYXNob2Zmc2V0OiB0cnVlLFxuICAgIHN0cm9rZU1pdGVybGltaXQ6IHRydWUsXG4gICAgc3Ryb2tlT3BhY2l0eTogdHJ1ZSxcbiAgICBzdHJva2VXaWR0aDogdHJ1ZVxufTtcblxuLyoqXG4gKiBUYWtlbiBmcm9tIFJlYWN0J3MgQ1NTUHJvcGVydHkuanNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IHZlbmRvci1zcGVjaWZpYyBwcmVmaXgsIGVnOiBXZWJraXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgc3R5bGUgbmFtZSwgZWc6IHRyYW5zaXRpb25EdXJhdGlvblxuICogQHJldHVybiB7c3RyaW5nfSBzdHlsZSBuYW1lIHByZWZpeGVkIHdpdGggYHByZWZpeGAsIHByb3Blcmx5IGNhbWVsQ2FzZWQsIGVnOlxuICogV2Via2l0VHJhbnNpdGlvbkR1cmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHByZWZpeEtleShwcmVmaXgsIGtleSkge1xuICAgIHJldHVybiBwcmVmaXggKyBrZXkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBrZXkuc3Vic3RyaW5nKDEpO1xufVxuXG4vKipcbiAqIFN1cHBvcnQgc3R5bGUgbmFtZXMgdGhhdCBtYXkgY29tZSBwYXNzZWQgaW4gcHJlZml4ZWQgYnkgYWRkaW5nIHBlcm11dGF0aW9uc1xuICogb2YgdmVuZG9yIHByZWZpeGVzLlxuICogVGFrZW4gZnJvbSBSZWFjdCdzIENTU1Byb3BlcnR5LmpzXG4gKi9cbnZhciBwcmVmaXhlcyA9IFsnV2Via2l0JywgJ21zJywgJ01veicsICdPJ107XG5cbi8vIFVzaW5nIE9iamVjdC5rZXlzIGhlcmUsIG9yIGVsc2UgdGhlIHZhbmlsbGEgZm9yLWluIGxvb3AgbWFrZXMgSUU4IGdvIGludG8gYW5cbi8vIGluZmluaXRlIGxvb3AsIGJlY2F1c2UgaXQgaXRlcmF0ZXMgb3ZlciB0aGUgbmV3bHkgYWRkZWQgcHJvcHMgdG9vLlxuLy8gVGFrZW4gZnJvbSBSZWFjdCdzIENTU1Byb3BlcnR5LmpzXG5PYmplY3Qua2V5cyhpc1VuaXRsZXNzTnVtYmVyKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgcHJlZml4ZXMuZm9yRWFjaChmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgICAgIGlzVW5pdGxlc3NOdW1iZXJbcHJlZml4S2V5KHByZWZpeCwgcHJvcCldID0gaXNVbml0bGVzc051bWJlcltwcm9wXTtcbiAgICB9KTtcbn0pO1xuXG52YXIgc3RyaW5naWZ5VmFsdWUgPSBmdW5jdGlvbiBzdHJpbmdpZnlWYWx1ZShrZXksIHByb3ApIHtcbiAgICBpZiAodHlwZW9mIHByb3AgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgaWYgKGlzVW5pdGxlc3NOdW1iZXJba2V5XSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyBwcm9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHByb3AgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcHJvcDtcbiAgICB9XG59O1xuXG5leHBvcnRzLnN0cmluZ2lmeVZhbHVlID0gc3RyaW5naWZ5VmFsdWU7XG4vKipcbiAqIEpTIEltcGxlbWVudGF0aW9uIG9mIE11cm11ckhhc2gyXG4gKlxuICogQGF1dGhvciA8YSBocmVmPVwibWFpbHRvOmdhcnkuY291cnRAZ21haWwuY29tXCI+R2FyeSBDb3VydDwvYT5cbiAqIEBzZWUgaHR0cDovL2dpdGh1Yi5jb20vZ2FyeWNvdXJ0L211cm11cmhhc2gtanNcbiAqIEBhdXRob3IgPGEgaHJlZj1cIm1haWx0bzphYXBwbGVieUBnbWFpbC5jb21cIj5BdXN0aW4gQXBwbGVieTwvYT5cbiAqIEBzZWUgaHR0cDovL3NpdGVzLmdvb2dsZS5jb20vc2l0ZS9tdXJtdXJoYXNoL1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgQVNDSUkgb25seVxuICogQHJldHVybiB7c3RyaW5nfSBCYXNlIDM2IGVuY29kZWQgaGFzaCByZXN1bHRcbiAqL1xuZnVuY3Rpb24gbXVybXVyaGFzaDJfMzJfZ2Moc3RyKSB7XG4gICAgdmFyIGwgPSBzdHIubGVuZ3RoO1xuICAgIHZhciBoID0gbDtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGsgPSB1bmRlZmluZWQ7XG5cbiAgICB3aGlsZSAobCA+PSA0KSB7XG4gICAgICAgIGsgPSBzdHIuY2hhckNvZGVBdChpKSAmIDB4ZmYgfCAoc3RyLmNoYXJDb2RlQXQoKytpKSAmIDB4ZmYpIDw8IDggfCAoc3RyLmNoYXJDb2RlQXQoKytpKSAmIDB4ZmYpIDw8IDE2IHwgKHN0ci5jaGFyQ29kZUF0KCsraSkgJiAweGZmKSA8PCAyNDtcblxuICAgICAgICBrID0gKGsgJiAweGZmZmYpICogMHg1YmQxZTk5NSArICgoKGsgPj4+IDE2KSAqIDB4NWJkMWU5OTUgJiAweGZmZmYpIDw8IDE2KTtcbiAgICAgICAgayBePSBrID4+PiAyNDtcbiAgICAgICAgayA9IChrICYgMHhmZmZmKSAqIDB4NWJkMWU5OTUgKyAoKChrID4+PiAxNikgKiAweDViZDFlOTk1ICYgMHhmZmZmKSA8PCAxNik7XG5cbiAgICAgICAgaCA9IChoICYgMHhmZmZmKSAqIDB4NWJkMWU5OTUgKyAoKChoID4+PiAxNikgKiAweDViZDFlOTk1ICYgMHhmZmZmKSA8PCAxNikgXiBrO1xuXG4gICAgICAgIGwgLT0gNDtcbiAgICAgICAgKytpO1xuICAgIH1cblxuICAgIHN3aXRjaCAobCkge1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBoIF49IChzdHIuY2hhckNvZGVBdChpICsgMikgJiAweGZmKSA8PCAxNjtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgaCBePSAoc3RyLmNoYXJDb2RlQXQoaSArIDEpICYgMHhmZikgPDwgODtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgaCBePSBzdHIuY2hhckNvZGVBdChpKSAmIDB4ZmY7XG4gICAgICAgICAgICBoID0gKGggJiAweGZmZmYpICogMHg1YmQxZTk5NSArICgoKGggPj4+IDE2KSAqIDB4NWJkMWU5OTUgJiAweGZmZmYpIDw8IDE2KTtcbiAgICB9XG5cbiAgICBoIF49IGggPj4+IDEzO1xuICAgIGggPSAoaCAmIDB4ZmZmZikgKiAweDViZDFlOTk1ICsgKCgoaCA+Pj4gMTYpICogMHg1YmQxZTk5NSAmIDB4ZmZmZikgPDwgMTYpO1xuICAgIGggXj0gaCA+Pj4gMTU7XG5cbiAgICByZXR1cm4gKGggPj4+IDApLnRvU3RyaW5nKDM2KTtcbn1cblxuLy8gSGFzaCBhIGphdmFzY3JpcHQgb2JqZWN0IHVzaW5nIEpTT04uc3RyaW5naWZ5LiBUaGlzIGlzIHZlcnkgZmFzdCwgYWJvdXQgM1xuLy8gbWljcm9zZWNvbmRzIG9uIG15IGNvbXB1dGVyIGZvciBhIHNhbXBsZSBvYmplY3Q6XG4vLyBodHRwOi8vanNwZXJmLmNvbS90ZXN0LWhhc2hmbnYzMmEtaGFzaC81XG4vL1xuLy8gTm90ZSB0aGF0IHRoaXMgdXNlcyBKU09OLnN0cmluZ2lmeSB0byBzdHJpbmdpZnkgdGhlIG9iamVjdHMgc28gaW4gb3JkZXIgZm9yXG4vLyB0aGlzIHRvIHByb2R1Y2UgY29uc2lzdGVudCBoYXNoZXMgYnJvd3NlcnMgbmVlZCB0byBoYXZlIGEgY29uc2lzdGVudFxuLy8gb3JkZXJpbmcgb2Ygb2JqZWN0cy4gQmVuIEFscGVydCBzYXlzIHRoYXQgRmFjZWJvb2sgZGVwZW5kcyBvbiB0aGlzLCBzbyB3ZVxuLy8gY2FuIHByb2JhYmx5IGRlcGVuZCBvbiB0aGlzIHRvby5cbnZhciBoYXNoT2JqZWN0ID0gZnVuY3Rpb24gaGFzaE9iamVjdChvYmplY3QpIHtcbiAgICByZXR1cm4gbXVybXVyaGFzaDJfMzJfZ2MoSlNPTi5zdHJpbmdpZnkob2JqZWN0KSk7XG59O1xuXG5leHBvcnRzLmhhc2hPYmplY3QgPSBoYXNoT2JqZWN0O1xudmFyIElNUE9SVEFOVF9SRSA9IC9eKFteOl0rOi4qPykoICFpbXBvcnRhbnQpPzskLztcblxuLy8gR2l2ZW4gYSBzaW5nbGUgc3R5bGUgcnVsZSBzdHJpbmcgbGlrZSBcImE6IGI7XCIsIGFkZHMgIWltcG9ydGFudCB0byBnZW5lcmF0ZVxuLy8gXCJhOiBiICFpbXBvcnRhbnQ7XCIuXG52YXIgaW1wb3J0YW50aWZ5ID0gZnVuY3Rpb24gaW1wb3J0YW50aWZ5KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShJTVBPUlRBTlRfUkUsIGZ1bmN0aW9uIChfLCBiYXNlLCBpbXBvcnRhbnQpIHtcbiAgICAgICAgcmV0dXJuIGJhc2UgKyBcIiAhaW1wb3J0YW50O1wiO1xuICAgIH0pO1xufTtcbmV4cG9ydHMuaW1wb3J0YW50aWZ5ID0gaW1wb3J0YW50aWZ5OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvbm8taW1wb3J0YW50LmpzJyk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gcmF3QXNhcCBwcm92aWRlcyBldmVyeXRoaW5nIHdlIG5lZWQgZXhjZXB0IGV4Y2VwdGlvbiBtYW5hZ2VtZW50LlxudmFyIHJhd0FzYXAgPSByZXF1aXJlKFwiLi9yYXdcIik7XG4vLyBSYXdUYXNrcyBhcmUgcmVjeWNsZWQgdG8gcmVkdWNlIEdDIGNodXJuLlxudmFyIGZyZWVUYXNrcyA9IFtdO1xuLy8gV2UgcXVldWUgZXJyb3JzIHRvIGVuc3VyZSB0aGV5IGFyZSB0aHJvd24gaW4gcmlnaHQgb3JkZXIgKEZJRk8pLlxuLy8gQXJyYXktYXMtcXVldWUgaXMgZ29vZCBlbm91Z2ggaGVyZSwgc2luY2Ugd2UgYXJlIGp1c3QgZGVhbGluZyB3aXRoIGV4Y2VwdGlvbnMuXG52YXIgcGVuZGluZ0Vycm9ycyA9IFtdO1xudmFyIHJlcXVlc3RFcnJvclRocm93ID0gcmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIodGhyb3dGaXJzdEVycm9yKTtcblxuZnVuY3Rpb24gdGhyb3dGaXJzdEVycm9yKCkge1xuICAgIGlmIChwZW5kaW5nRXJyb3JzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBwZW5kaW5nRXJyb3JzLnNoaWZ0KCk7XG4gICAgfVxufVxuXG4vKipcbiAqIENhbGxzIGEgdGFzayBhcyBzb29uIGFzIHBvc3NpYmxlIGFmdGVyIHJldHVybmluZywgaW4gaXRzIG93biBldmVudCwgd2l0aCBwcmlvcml0eVxuICogb3ZlciBvdGhlciBldmVudHMgbGlrZSBhbmltYXRpb24sIHJlZmxvdywgYW5kIHJlcGFpbnQuIEFuIGVycm9yIHRocm93biBmcm9tIGFuXG4gKiBldmVudCB3aWxsIG5vdCBpbnRlcnJ1cHQsIG5vciBldmVuIHN1YnN0YW50aWFsbHkgc2xvdyBkb3duIHRoZSBwcm9jZXNzaW5nIG9mXG4gKiBvdGhlciBldmVudHMsIGJ1dCB3aWxsIGJlIHJhdGhlciBwb3N0cG9uZWQgdG8gYSBsb3dlciBwcmlvcml0eSBldmVudC5cbiAqIEBwYXJhbSB7e2NhbGx9fSB0YXNrIEEgY2FsbGFibGUgb2JqZWN0LCB0eXBpY2FsbHkgYSBmdW5jdGlvbiB0aGF0IHRha2VzIG5vXG4gKiBhcmd1bWVudHMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXNhcDtcbmZ1bmN0aW9uIGFzYXAodGFzaykge1xuICAgIHZhciByYXdUYXNrO1xuICAgIGlmIChmcmVlVGFza3MubGVuZ3RoKSB7XG4gICAgICAgIHJhd1Rhc2sgPSBmcmVlVGFza3MucG9wKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmF3VGFzayA9IG5ldyBSYXdUYXNrKCk7XG4gICAgfVxuICAgIHJhd1Rhc2sudGFzayA9IHRhc2s7XG4gICAgcmF3QXNhcChyYXdUYXNrKTtcbn1cblxuLy8gV2Ugd3JhcCB0YXNrcyB3aXRoIHJlY3ljbGFibGUgdGFzayBvYmplY3RzLiAgQSB0YXNrIG9iamVjdCBpbXBsZW1lbnRzXG4vLyBgY2FsbGAsIGp1c3QgbGlrZSBhIGZ1bmN0aW9uLlxuZnVuY3Rpb24gUmF3VGFzaygpIHtcbiAgICB0aGlzLnRhc2sgPSBudWxsO1xufVxuXG4vLyBUaGUgc29sZSBwdXJwb3NlIG9mIHdyYXBwaW5nIHRoZSB0YXNrIGlzIHRvIGNhdGNoIHRoZSBleGNlcHRpb24gYW5kIHJlY3ljbGVcbi8vIHRoZSB0YXNrIG9iamVjdCBhZnRlciBpdHMgc2luZ2xlIHVzZS5cblJhd1Rhc2sucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdGhpcy50YXNrLmNhbGwoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoYXNhcC5vbmVycm9yKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGhvb2sgZXhpc3RzIHB1cmVseSBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgICAgICAgICAgIC8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdFxuICAgICAgICAgICAgLy8gZGVwZW5kcyBvbiBpdHMgZXhpc3RlbmNlLlxuICAgICAgICAgICAgYXNhcC5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEluIGEgd2ViIGJyb3dzZXIsIGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC4gSG93ZXZlciwgdG8gYXZvaWRcbiAgICAgICAgICAgIC8vIHNsb3dpbmcgZG93biB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcywgd2UgcmV0aHJvdyB0aGUgZXJyb3IgaW4gYVxuICAgICAgICAgICAgLy8gbG93ZXIgcHJpb3JpdHkgdHVybi5cbiAgICAgICAgICAgIHBlbmRpbmdFcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICByZXF1ZXN0RXJyb3JUaHJvdygpO1xuICAgICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdGhpcy50YXNrID0gbnVsbDtcbiAgICAgICAgZnJlZVRhc2tzW2ZyZWVUYXNrcy5sZW5ndGhdID0gdGhpcztcbiAgICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBtZWFucyBwb3NzaWJsZSB0byBleGVjdXRlIGEgdGFzayBpbiBpdHMgb3duIHR1cm4sIHdpdGhcbi8vIHByaW9yaXR5IG92ZXIgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBJTywgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZWRyYXdcbi8vIGV2ZW50cyBpbiBicm93c2Vycy5cbi8vXG4vLyBBbiBleGNlcHRpb24gdGhyb3duIGJ5IGEgdGFzayB3aWxsIHBlcm1hbmVudGx5IGludGVycnVwdCB0aGUgcHJvY2Vzc2luZyBvZlxuLy8gc3Vic2VxdWVudCB0YXNrcy4gVGhlIGhpZ2hlciBsZXZlbCBgYXNhcGAgZnVuY3Rpb24gZW5zdXJlcyB0aGF0IGlmIGFuXG4vLyBleGNlcHRpb24gaXMgdGhyb3duIGJ5IGEgdGFzaywgdGhhdCB0aGUgdGFzayBxdWV1ZSB3aWxsIGNvbnRpbnVlIGZsdXNoaW5nIGFzXG4vLyBzb29uIGFzIHBvc3NpYmxlLCBidXQgaWYgeW91IHVzZSBgcmF3QXNhcGAgZGlyZWN0bHksIHlvdSBhcmUgcmVzcG9uc2libGUgdG9cbi8vIGVpdGhlciBlbnN1cmUgdGhhdCBubyBleGNlcHRpb25zIGFyZSB0aHJvd24gZnJvbSB5b3VyIHRhc2ssIG9yIHRvIG1hbnVhbGx5XG4vLyBjYWxsIGByYXdBc2FwLnJlcXVlc3RGbHVzaGAgaWYgYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cbm1vZHVsZS5leHBvcnRzID0gcmF3QXNhcDtcbmZ1bmN0aW9uIHJhd0FzYXAodGFzaykge1xuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHJlcXVlc3RGbHVzaCgpO1xuICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgfVxuICAgIC8vIEVxdWl2YWxlbnQgdG8gcHVzaCwgYnV0IGF2b2lkcyBhIGZ1bmN0aW9uIGNhbGwuXG4gICAgcXVldWVbcXVldWUubGVuZ3RoXSA9IHRhc2s7XG59XG5cbnZhciBxdWV1ZSA9IFtdO1xuLy8gT25jZSBhIGZsdXNoIGhhcyBiZWVuIHJlcXVlc3RlZCwgbm8gZnVydGhlciBjYWxscyB0byBgcmVxdWVzdEZsdXNoYCBhcmVcbi8vIG5lY2Vzc2FyeSB1bnRpbCB0aGUgbmV4dCBgZmx1c2hgIGNvbXBsZXRlcy5cbnZhciBmbHVzaGluZyA9IGZhbHNlO1xuLy8gYHJlcXVlc3RGbHVzaGAgaXMgYW4gaW1wbGVtZW50YXRpb24tc3BlY2lmaWMgbWV0aG9kIHRoYXQgYXR0ZW1wdHMgdG8ga2lja1xuLy8gb2ZmIGEgYGZsdXNoYCBldmVudCBhcyBxdWlja2x5IGFzIHBvc3NpYmxlLiBgZmx1c2hgIHdpbGwgYXR0ZW1wdCB0byBleGhhdXN0XG4vLyB0aGUgZXZlbnQgcXVldWUgYmVmb3JlIHlpZWxkaW5nIHRvIHRoZSBicm93c2VyJ3Mgb3duIGV2ZW50IGxvb3AuXG52YXIgcmVxdWVzdEZsdXNoO1xuLy8gVGhlIHBvc2l0aW9uIG9mIHRoZSBuZXh0IHRhc2sgdG8gZXhlY3V0ZSBpbiB0aGUgdGFzayBxdWV1ZS4gVGhpcyBpc1xuLy8gcHJlc2VydmVkIGJldHdlZW4gY2FsbHMgdG8gYGZsdXNoYCBzbyB0aGF0IGl0IGNhbiBiZSByZXN1bWVkIGlmXG4vLyBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbnZhciBpbmRleCA9IDA7XG4vLyBJZiBhIHRhc2sgc2NoZWR1bGVzIGFkZGl0aW9uYWwgdGFza3MgcmVjdXJzaXZlbHksIHRoZSB0YXNrIHF1ZXVlIGNhbiBncm93XG4vLyB1bmJvdW5kZWQuIFRvIHByZXZlbnQgbWVtb3J5IGV4aGF1c3Rpb24sIHRoZSB0YXNrIHF1ZXVlIHdpbGwgcGVyaW9kaWNhbGx5XG4vLyB0cnVuY2F0ZSBhbHJlYWR5LWNvbXBsZXRlZCB0YXNrcy5cbnZhciBjYXBhY2l0eSA9IDEwMjQ7XG5cbi8vIFRoZSBmbHVzaCBmdW5jdGlvbiBwcm9jZXNzZXMgYWxsIHRhc2tzIHRoYXQgaGF2ZSBiZWVuIHNjaGVkdWxlZCB3aXRoXG4vLyBgcmF3QXNhcGAgdW5sZXNzIGFuZCB1bnRpbCBvbmUgb2YgdGhvc2UgdGFza3MgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbi8vIElmIGEgdGFzayB0aHJvd3MgYW4gZXhjZXB0aW9uLCBgZmx1c2hgIGVuc3VyZXMgdGhhdCBpdHMgc3RhdGUgd2lsbCByZW1haW5cbi8vIGNvbnNpc3RlbnQgYW5kIHdpbGwgcmVzdW1lIHdoZXJlIGl0IGxlZnQgb2ZmIHdoZW4gY2FsbGVkIGFnYWluLlxuLy8gSG93ZXZlciwgYGZsdXNoYCBkb2VzIG5vdCBtYWtlIGFueSBhcnJhbmdlbWVudHMgdG8gYmUgY2FsbGVkIGFnYWluIGlmIGFuXG4vLyBleGNlcHRpb24gaXMgdGhyb3duLlxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgd2hpbGUgKGluZGV4IDwgcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgICAgLy8gQWR2YW5jZSB0aGUgaW5kZXggYmVmb3JlIGNhbGxpbmcgdGhlIHRhc2suIFRoaXMgZW5zdXJlcyB0aGF0IHdlIHdpbGxcbiAgICAgICAgLy8gYmVnaW4gZmx1c2hpbmcgb24gdGhlIG5leHQgdGFzayB0aGUgdGFzayB0aHJvd3MgYW4gZXJyb3IuXG4gICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICBxdWV1ZVtjdXJyZW50SW5kZXhdLmNhbGwoKTtcbiAgICAgICAgLy8gUHJldmVudCBsZWFraW5nIG1lbW9yeSBmb3IgbG9uZyBjaGFpbnMgb2YgcmVjdXJzaXZlIGNhbGxzIHRvIGBhc2FwYC5cbiAgICAgICAgLy8gSWYgd2UgY2FsbCBgYXNhcGAgd2l0aGluIHRhc2tzIHNjaGVkdWxlZCBieSBgYXNhcGAsIHRoZSBxdWV1ZSB3aWxsXG4gICAgICAgIC8vIGdyb3csIGJ1dCB0byBhdm9pZCBhbiBPKG4pIHdhbGsgZm9yIGV2ZXJ5IHRhc2sgd2UgZXhlY3V0ZSwgd2UgZG9uJ3RcbiAgICAgICAgLy8gc2hpZnQgdGFza3Mgb2ZmIHRoZSBxdWV1ZSBhZnRlciB0aGV5IGhhdmUgYmVlbiBleGVjdXRlZC5cbiAgICAgICAgLy8gSW5zdGVhZCwgd2UgcGVyaW9kaWNhbGx5IHNoaWZ0IDEwMjQgdGFza3Mgb2ZmIHRoZSBxdWV1ZS5cbiAgICAgICAgaWYgKGluZGV4ID4gY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IHNoaWZ0IGFsbCB2YWx1ZXMgc3RhcnRpbmcgYXQgdGhlIGluZGV4IGJhY2sgdG8gdGhlXG4gICAgICAgICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIHF1ZXVlLlxuICAgICAgICAgICAgZm9yICh2YXIgc2NhbiA9IDAsIG5ld0xlbmd0aCA9IHF1ZXVlLmxlbmd0aCAtIGluZGV4OyBzY2FuIDwgbmV3TGVuZ3RoOyBzY2FuKyspIHtcbiAgICAgICAgICAgICAgICBxdWV1ZVtzY2FuXSA9IHF1ZXVlW3NjYW4gKyBpbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggLT0gaW5kZXg7XG4gICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICBpbmRleCA9IDA7XG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbn1cblxuLy8gYHJlcXVlc3RGbHVzaGAgaXMgaW1wbGVtZW50ZWQgdXNpbmcgYSBzdHJhdGVneSBiYXNlZCBvbiBkYXRhIGNvbGxlY3RlZCBmcm9tXG4vLyBldmVyeSBhdmFpbGFibGUgU2F1Y2VMYWJzIFNlbGVuaXVtIHdlYiBkcml2ZXIgd29ya2VyIGF0IHRpbWUgb2Ygd3JpdGluZy5cbi8vIGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL3NwcmVhZHNoZWV0cy9kLzFtRy01VVlHdXA1cXhHZEVNV2toUDZCV0N6MDUzTlViMkUxUW9VVFUxNnVBL2VkaXQjZ2lkPTc4MzcyNDU5M1xuXG4vLyBTYWZhcmkgNiBhbmQgNi4xIGZvciBkZXNrdG9wLCBpUGFkLCBhbmQgaVBob25lIGFyZSB0aGUgb25seSBicm93c2VycyB0aGF0XG4vLyBoYXZlIFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIgYnV0IG5vdCB1bi1wcmVmaXhlZCBNdXRhdGlvbk9ic2VydmVyLlxuLy8gTXVzdCB1c2UgYGdsb2JhbGAgaW5zdGVhZCBvZiBgd2luZG93YCB0byB3b3JrIGluIGJvdGggZnJhbWVzIGFuZCB3ZWJcbi8vIHdvcmtlcnMuIGBnbG9iYWxgIGlzIGEgcHJvdmlzaW9uIG9mIEJyb3dzZXJpZnksIE1yLCBNcnMsIG9yIE1vcC5cbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuXG4vLyBNdXRhdGlvbk9ic2VydmVycyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBoYXZlIGhpZ2ggcHJpb3JpdHkgYW5kIHdvcmtcbi8vIHJlbGlhYmx5IGV2ZXJ5d2hlcmUgdGhleSBhcmUgaW1wbGVtZW50ZWQuXG4vLyBUaGV5IGFyZSBpbXBsZW1lbnRlZCBpbiBhbGwgbW9kZXJuIGJyb3dzZXJzLlxuLy9cbi8vIC0gQW5kcm9pZCA0LTQuM1xuLy8gLSBDaHJvbWUgMjYtMzRcbi8vIC0gRmlyZWZveCAxNC0yOVxuLy8gLSBJbnRlcm5ldCBFeHBsb3JlciAxMVxuLy8gLSBpUGFkIFNhZmFyaSA2LTcuMVxuLy8gLSBpUGhvbmUgU2FmYXJpIDctNy4xXG4vLyAtIFNhZmFyaSA2LTdcbmlmICh0eXBlb2YgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcblxuLy8gTWVzc2FnZUNoYW5uZWxzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGdpdmUgZGlyZWN0IGFjY2VzcyB0byB0aGUgSFRNTFxuLy8gdGFzayBxdWV1ZSwgYXJlIGltcGxlbWVudGVkIGluIEludGVybmV0IEV4cGxvcmVyIDEwLCBTYWZhcmkgNS4wLTEsIGFuZCBPcGVyYVxuLy8gMTEtMTIsIGFuZCBpbiB3ZWIgd29ya2VycyBpbiBtYW55IGVuZ2luZXMuXG4vLyBBbHRob3VnaCBtZXNzYWdlIGNoYW5uZWxzIHlpZWxkIHRvIGFueSBxdWV1ZWQgcmVuZGVyaW5nIGFuZCBJTyB0YXNrcywgdGhleVxuLy8gd291bGQgYmUgYmV0dGVyIHRoYW4gaW1wb3NpbmcgdGhlIDRtcyBkZWxheSBvZiB0aW1lcnMuXG4vLyBIb3dldmVyLCB0aGV5IGRvIG5vdCB3b3JrIHJlbGlhYmx5IGluIEludGVybmV0IEV4cGxvcmVyIG9yIFNhZmFyaS5cblxuLy8gSW50ZXJuZXQgRXhwbG9yZXIgMTAgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGhhcyBzZXRJbW1lZGlhdGUgYnV0IGRvZXNcbi8vIG5vdCBoYXZlIE11dGF0aW9uT2JzZXJ2ZXJzLlxuLy8gQWx0aG91Z2ggc2V0SW1tZWRpYXRlIHlpZWxkcyB0byB0aGUgYnJvd3NlcidzIHJlbmRlcmVyLCBpdCB3b3VsZCBiZVxuLy8gcHJlZmVycmFibGUgdG8gZmFsbGluZyBiYWNrIHRvIHNldFRpbWVvdXQgc2luY2UgaXQgZG9lcyBub3QgaGF2ZVxuLy8gdGhlIG1pbmltdW0gNG1zIHBlbmFsdHkuXG4vLyBVbmZvcnR1bmF0ZWx5IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAgTW9iaWxlIChhbmRcbi8vIERlc2t0b3AgdG8gYSBsZXNzZXIgZXh0ZW50KSB0aGF0IHJlbmRlcnMgYm90aCBzZXRJbW1lZGlhdGUgYW5kXG4vLyBNZXNzYWdlQ2hhbm5lbCB1c2VsZXNzIGZvciB0aGUgcHVycG9zZXMgb2YgQVNBUC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9pc3N1ZXMvMzk2XG5cbi8vIFRpbWVycyBhcmUgaW1wbGVtZW50ZWQgdW5pdmVyc2FsbHkuXG4vLyBXZSBmYWxsIGJhY2sgdG8gdGltZXJzIGluIHdvcmtlcnMgaW4gbW9zdCBlbmdpbmVzLCBhbmQgaW4gZm9yZWdyb3VuZFxuLy8gY29udGV4dHMgaW4gdGhlIGZvbGxvd2luZyBicm93c2Vycy5cbi8vIEhvd2V2ZXIsIG5vdGUgdGhhdCBldmVuIHRoaXMgc2ltcGxlIGNhc2UgcmVxdWlyZXMgbnVhbmNlcyB0byBvcGVyYXRlIGluIGFcbi8vIGJyb2FkIHNwZWN0cnVtIG9mIGJyb3dzZXJzLlxuLy9cbi8vIC0gRmlyZWZveCAzLTEzXG4vLyAtIEludGVybmV0IEV4cGxvcmVyIDYtOVxuLy8gLSBpUGFkIFNhZmFyaSA0LjNcbi8vIC0gTHlueCAyLjguN1xufSBlbHNlIHtcbiAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoZmx1c2gpO1xufVxuXG4vLyBgcmVxdWVzdEZsdXNoYCByZXF1ZXN0cyB0aGF0IHRoZSBoaWdoIHByaW9yaXR5IGV2ZW50IHF1ZXVlIGJlIGZsdXNoZWQgYXNcbi8vIHNvb24gYXMgcG9zc2libGUuXG4vLyBUaGlzIGlzIHVzZWZ1bCB0byBwcmV2ZW50IGFuIGVycm9yIHRocm93biBpbiBhIHRhc2sgZnJvbSBzdGFsbGluZyB0aGUgZXZlbnRcbi8vIHF1ZXVlIGlmIHRoZSBleGNlcHRpb24gaGFuZGxlZCBieSBOb2RlLmpz4oCZc1xuLy8gYHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiKWAgb3IgYnkgYSBkb21haW4uXG5yYXdBc2FwLnJlcXVlc3RGbHVzaCA9IHJlcXVlc3RGbHVzaDtcblxuLy8gVG8gcmVxdWVzdCBhIGhpZ2ggcHJpb3JpdHkgZXZlbnQsIHdlIGluZHVjZSBhIG11dGF0aW9uIG9ic2VydmVyIGJ5IHRvZ2dsaW5nXG4vLyB0aGUgdGV4dCBvZiBhIHRleHQgbm9kZSBiZXR3ZWVuIFwiMVwiIGFuZCBcIi0xXCIuXG5mdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgIHZhciB0b2dnbGUgPSAxO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtjaGFyYWN0ZXJEYXRhOiB0cnVlfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuICAgICAgICB0b2dnbGUgPSAtdG9nZ2xlO1xuICAgICAgICBub2RlLmRhdGEgPSB0b2dnbGU7XG4gICAgfTtcbn1cblxuLy8gVGhlIG1lc3NhZ2UgY2hhbm5lbCB0ZWNobmlxdWUgd2FzIGRpc2NvdmVyZWQgYnkgTWFsdGUgVWJsIGFuZCB3YXMgdGhlXG4vLyBvcmlnaW5hbCBmb3VuZGF0aW9uIGZvciB0aGlzIGxpYnJhcnkuXG4vLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuXG4vLyBTYWZhcmkgNi4wLjUgKGF0IGxlYXN0KSBpbnRlcm1pdHRlbnRseSBmYWlscyB0byBjcmVhdGUgbWVzc2FnZSBwb3J0cyBvbiBhXG4vLyBwYWdlJ3MgZmlyc3QgbG9hZC4gVGhhbmtmdWxseSwgdGhpcyB2ZXJzaW9uIG9mIFNhZmFyaSBzdXBwb3J0c1xuLy8gTXV0YXRpb25PYnNlcnZlcnMsIHNvIHdlIGRvbid0IG5lZWQgdG8gZmFsbCBiYWNrIGluIHRoYXQgY2FzZS5cblxuLy8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU1lc3NhZ2VDaGFubmVsKGNhbGxiYWNrKSB7XG4vLyAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbi8vICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGNhbGxiYWNrO1xuLy8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbi8vICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBGb3IgcmVhc29ucyBleHBsYWluZWQgYWJvdmUsIHdlIGFyZSBhbHNvIHVuYWJsZSB0byB1c2UgYHNldEltbWVkaWF0ZWBcbi8vIHVuZGVyIGFueSBjaXJjdW1zdGFuY2VzLlxuLy8gRXZlbiBpZiB3ZSB3ZXJlLCB0aGVyZSBpcyBhbm90aGVyIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMC5cbi8vIEl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGFzc2lnbiBgc2V0SW1tZWRpYXRlYCB0byBgcmVxdWVzdEZsdXNoYCBiZWNhdXNlXG4vLyBgc2V0SW1tZWRpYXRlYCBtdXN0IGJlIGNhbGxlZCAqYnkgbmFtZSogYW5kIHRoZXJlZm9yZSBtdXN0IGJlIHdyYXBwZWQgaW4gYVxuLy8gY2xvc3VyZS5cbi8vIE5ldmVyIGZvcmdldC5cblxuLy8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuLy8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbi8vICAgICAgICAgc2V0SW1tZWRpYXRlKGNhbGxiYWNrKTtcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBTYWZhcmkgNi4wIGhhcyBhIHByb2JsZW0gd2hlcmUgdGltZXJzIHdpbGwgZ2V0IGxvc3Qgd2hpbGUgdGhlIHVzZXIgaXNcbi8vIHNjcm9sbGluZy4gVGhpcyBwcm9ibGVtIGRvZXMgbm90IGltcGFjdCBBU0FQIGJlY2F1c2UgU2FmYXJpIDYuMCBzdXBwb3J0c1xuLy8gbXV0YXRpb24gb2JzZXJ2ZXJzLCBzbyB0aGF0IGltcGxlbWVudGF0aW9uIGlzIHVzZWQgaW5zdGVhZC5cbi8vIEhvd2V2ZXIsIGlmIHdlIGV2ZXIgZWxlY3QgdG8gdXNlIHRpbWVycyBpbiBTYWZhcmksIHRoZSBwcmV2YWxlbnQgd29yay1hcm91bmRcbi8vIGlzIHRvIGFkZCBhIHNjcm9sbCBldmVudCBsaXN0ZW5lciB0aGF0IGNhbGxzIGZvciBhIGZsdXNoLlxuXG4vLyBgc2V0VGltZW91dGAgZG9lcyBub3QgY2FsbCB0aGUgcGFzc2VkIGNhbGxiYWNrIGlmIHRoZSBkZWxheSBpcyBsZXNzIHRoYW5cbi8vIGFwcHJveGltYXRlbHkgNyBpbiB3ZWIgd29ya2VycyBpbiBGaXJlZm94IDggdGhyb3VnaCAxOCwgYW5kIHNvbWV0aW1lcyBub3Rcbi8vIGV2ZW4gdGhlbi5cblxuZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuICAgICAgICAvLyBXZSBkaXNwYXRjaCBhIHRpbWVvdXQgd2l0aCBhIHNwZWNpZmllZCBkZWxheSBvZiAwIGZvciBlbmdpbmVzIHRoYXRcbiAgICAgICAgLy8gY2FuIHJlbGlhYmx5IGFjY29tbW9kYXRlIHRoYXQgcmVxdWVzdC4gVGhpcyB3aWxsIHVzdWFsbHkgYmUgc25hcHBlZFxuICAgICAgICAvLyB0byBhIDQgbWlsaXNlY29uZCBkZWxheSwgYnV0IG9uY2Ugd2UncmUgZmx1c2hpbmcsIHRoZXJlJ3Mgbm8gZGVsYXlcbiAgICAgICAgLy8gYmV0d2VlbiBldmVudHMuXG4gICAgICAgIHZhciB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChoYW5kbGVUaW1lciwgMCk7XG4gICAgICAgIC8vIEhvd2V2ZXIsIHNpbmNlIHRoaXMgdGltZXIgZ2V0cyBmcmVxdWVudGx5IGRyb3BwZWQgaW4gRmlyZWZveFxuICAgICAgICAvLyB3b3JrZXJzLCB3ZSBlbmxpc3QgYW4gaW50ZXJ2YWwgaGFuZGxlIHRoYXQgd2lsbCB0cnkgdG8gZmlyZVxuICAgICAgICAvLyBhbiBldmVudCAyMCB0aW1lcyBwZXIgc2Vjb25kIHVudGlsIGl0IHN1Y2NlZWRzLlxuICAgICAgICB2YXIgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChoYW5kbGVUaW1lciwgNTApO1xuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVyKCkge1xuICAgICAgICAgICAgLy8gV2hpY2hldmVyIHRpbWVyIHN1Y2NlZWRzIHdpbGwgY2FuY2VsIGJvdGggdGltZXJzIGFuZFxuICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBUaGlzIGlzIGZvciBgYXNhcC5qc2Agb25seS5cbi8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdCBkZXBlbmRzIG9uXG4vLyBpdHMgZXhpc3RlbmNlLlxucmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIgPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXI7XG5cbi8vIEFTQVAgd2FzIG9yaWdpbmFsbHkgYSBuZXh0VGljayBzaGltIGluY2x1ZGVkIGluIFEuIFRoaXMgd2FzIGZhY3RvcmVkIG91dFxuLy8gaW50byB0aGlzIEFTQVAgcGFja2FnZS4gSXQgd2FzIGxhdGVyIGFkYXB0ZWQgdG8gUlNWUCB3aGljaCBtYWRlIGZ1cnRoZXJcbi8vIGFtZW5kbWVudHMuIFRoZXNlIGRlY2lzaW9ucywgcGFydGljdWxhcmx5IHRvIG1hcmdpbmFsaXplIE1lc3NhZ2VDaGFubmVsIGFuZFxuLy8gdG8gY2FwdHVyZSB0aGUgTXV0YXRpb25PYnNlcnZlciBpbXBsZW1lbnRhdGlvbiBpbiBhIGNsb3N1cmUsIHdlcmUgaW50ZWdyYXRlZFxuLy8gYmFjayBpbnRvIEFTQVAgcHJvcGVyLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qcy9ibG9iL2NkZGY3MjMyNTQ2YTljZjg1ODUyNGI3NWNkZTZmOWVkZjcyNjIwYTcvbGliL3JzdnAvYXNhcC5qc1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXBwZXJjYXNlUGF0dGVybiA9IC9bQS1aXS9nO1xudmFyIG1zUGF0dGVybiA9IC9ebXMtLztcblxuZnVuY3Rpb24gaHlwaGVuYXRlU3R5bGVOYW1lKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmdcbiAgICAgICAgLnJlcGxhY2UodXBwZXJjYXNlUGF0dGVybiwgJy0kJicpXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5yZXBsYWNlKG1zUGF0dGVybiwgJy1tcy0nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoeXBoZW5hdGVTdHlsZU5hbWU7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBjYWxjO1xuXG52YXIgX2pvaW5QcmVmaXhlZFZhbHVlID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvam9pblByZWZpeGVkVmFsdWUnKTtcblxudmFyIF9qb2luUHJlZml4ZWRWYWx1ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9qb2luUHJlZml4ZWRWYWx1ZSk7XG5cbnZhciBfaXNQcmVmaXhlZFZhbHVlID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvaXNQcmVmaXhlZFZhbHVlJyk7XG5cbnZhciBfaXNQcmVmaXhlZFZhbHVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lzUHJlZml4ZWRWYWx1ZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGNhbGMocHJvcGVydHksIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmICEoMCwgX2lzUHJlZml4ZWRWYWx1ZTIuZGVmYXVsdCkodmFsdWUpICYmIHZhbHVlLmluZGV4T2YoJ2NhbGMoJykgPiAtMSkge1xuICAgIHJldHVybiAoMCwgX2pvaW5QcmVmaXhlZFZhbHVlMi5kZWZhdWx0KShwcm9wZXJ0eSwgdmFsdWUsIGZ1bmN0aW9uIChwcmVmaXgsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvY2FsY1xcKC9nLCBwcmVmaXggKyAnY2FsYygnKTtcbiAgICB9KTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gY3Vyc29yO1xuXG52YXIgX2pvaW5QcmVmaXhlZFZhbHVlID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvam9pblByZWZpeGVkVmFsdWUnKTtcblxudmFyIF9qb2luUHJlZml4ZWRWYWx1ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9qb2luUHJlZml4ZWRWYWx1ZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciB2YWx1ZXMgPSB7XG4gICd6b29tLWluJzogdHJ1ZSxcbiAgJ3pvb20tb3V0JzogdHJ1ZSxcbiAgZ3JhYjogdHJ1ZSxcbiAgZ3JhYmJpbmc6IHRydWVcbn07XG5cbmZ1bmN0aW9uIGN1cnNvcihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgaWYgKHByb3BlcnR5ID09PSAnY3Vyc29yJyAmJiB2YWx1ZXNbdmFsdWVdKSB7XG4gICAgcmV0dXJuICgwLCBfam9pblByZWZpeGVkVmFsdWUyLmRlZmF1bHQpKHByb3BlcnR5LCB2YWx1ZSk7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGZsZXg7XG52YXIgdmFsdWVzID0geyBmbGV4OiB0cnVlLCAnaW5saW5lLWZsZXgnOiB0cnVlIH07XG5cbmZ1bmN0aW9uIGZsZXgocHJvcGVydHksIHZhbHVlKSB7XG4gIGlmIChwcm9wZXJ0eSA9PT0gJ2Rpc3BsYXknICYmIHZhbHVlc1t2YWx1ZV0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcGxheTogWyctd2Via2l0LWJveCcsICctbW96LWJveCcsICctbXMtJyArIHZhbHVlICsgJ2JveCcsICctd2Via2l0LScgKyB2YWx1ZSwgdmFsdWVdXG4gICAgfTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZmxleGJveElFO1xuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgYWx0ZXJuYXRpdmVWYWx1ZXMgPSB7XG4gICdzcGFjZS1hcm91bmQnOiAnZGlzdHJpYnV0ZScsXG4gICdzcGFjZS1iZXR3ZWVuJzogJ2p1c3RpZnknLFxuICAnZmxleC1zdGFydCc6ICdzdGFydCcsXG4gICdmbGV4LWVuZCc6ICdlbmQnXG59O1xudmFyIGFsdGVybmF0aXZlUHJvcHMgPSB7XG4gIGFsaWduQ29udGVudDogJ21zRmxleExpbmVQYWNrJyxcbiAgYWxpZ25TZWxmOiAnbXNGbGV4SXRlbUFsaWduJyxcbiAgYWxpZ25JdGVtczogJ21zRmxleEFsaWduJyxcbiAganVzdGlmeUNvbnRlbnQ6ICdtc0ZsZXhQYWNrJyxcbiAgb3JkZXI6ICdtc0ZsZXhPcmRlcicsXG4gIGZsZXhHcm93OiAnbXNGbGV4UG9zaXRpdmUnLFxuICBmbGV4U2hyaW5rOiAnbXNGbGV4TmVnYXRpdmUnLFxuICBmbGV4QmFzaXM6ICdtc1ByZWZlcnJlZFNpemUnXG59O1xuXG5mdW5jdGlvbiBmbGV4Ym94SUUocHJvcGVydHksIHZhbHVlKSB7XG4gIGlmIChhbHRlcm5hdGl2ZVByb3BzW3Byb3BlcnR5XSkge1xuICAgIHJldHVybiBfZGVmaW5lUHJvcGVydHkoe30sIGFsdGVybmF0aXZlUHJvcHNbcHJvcGVydHldLCBhbHRlcm5hdGl2ZVZhbHVlc1t2YWx1ZV0gfHwgdmFsdWUpO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBmbGV4Ym94T2xkO1xuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgYWx0ZXJuYXRpdmVWYWx1ZXMgPSB7XG4gICdzcGFjZS1hcm91bmQnOiAnanVzdGlmeScsXG4gICdzcGFjZS1iZXR3ZWVuJzogJ2p1c3RpZnknLFxuICAnZmxleC1zdGFydCc6ICdzdGFydCcsXG4gICdmbGV4LWVuZCc6ICdlbmQnLFxuICAnd3JhcC1yZXZlcnNlJzogJ211bHRpcGxlJyxcbiAgd3JhcDogJ211bHRpcGxlJ1xufTtcblxudmFyIGFsdGVybmF0aXZlUHJvcHMgPSB7XG4gIGFsaWduSXRlbXM6ICdXZWJraXRCb3hBbGlnbicsXG4gIGp1c3RpZnlDb250ZW50OiAnV2Via2l0Qm94UGFjaycsXG4gIGZsZXhXcmFwOiAnV2Via2l0Qm94TGluZXMnXG59O1xuXG5mdW5jdGlvbiBmbGV4Ym94T2xkKHByb3BlcnR5LCB2YWx1ZSkge1xuICBpZiAocHJvcGVydHkgPT09ICdmbGV4RGlyZWN0aW9uJykge1xuICAgIHJldHVybiB7XG4gICAgICBXZWJraXRCb3hPcmllbnQ6IHZhbHVlLmluZGV4T2YoJ2NvbHVtbicpID4gLTEgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnLFxuICAgICAgV2Via2l0Qm94RGlyZWN0aW9uOiB2YWx1ZS5pbmRleE9mKCdyZXZlcnNlJykgPiAtMSA/ICdyZXZlcnNlJyA6ICdub3JtYWwnXG4gICAgfTtcbiAgfVxuICBpZiAoYWx0ZXJuYXRpdmVQcm9wc1twcm9wZXJ0eV0pIHtcbiAgICByZXR1cm4gX2RlZmluZVByb3BlcnR5KHt9LCBhbHRlcm5hdGl2ZVByb3BzW3Byb3BlcnR5XSwgYWx0ZXJuYXRpdmVWYWx1ZXNbdmFsdWVdIHx8IHZhbHVlKTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZ3JhZGllbnQ7XG5cbnZhciBfam9pblByZWZpeGVkVmFsdWUgPSByZXF1aXJlKCcuLi8uLi91dGlscy9qb2luUHJlZml4ZWRWYWx1ZScpO1xuXG52YXIgX2pvaW5QcmVmaXhlZFZhbHVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2pvaW5QcmVmaXhlZFZhbHVlKTtcblxudmFyIF9pc1ByZWZpeGVkVmFsdWUgPSByZXF1aXJlKCcuLi8uLi91dGlscy9pc1ByZWZpeGVkVmFsdWUnKTtcblxudmFyIF9pc1ByZWZpeGVkVmFsdWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaXNQcmVmaXhlZFZhbHVlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIHZhbHVlcyA9IC9saW5lYXItZ3JhZGllbnR8cmFkaWFsLWdyYWRpZW50fHJlcGVhdGluZy1saW5lYXItZ3JhZGllbnR8cmVwZWF0aW5nLXJhZGlhbC1ncmFkaWVudC87XG5cbmZ1bmN0aW9uIGdyYWRpZW50KHByb3BlcnR5LCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiAhKDAsIF9pc1ByZWZpeGVkVmFsdWUyLmRlZmF1bHQpKHZhbHVlKSAmJiB2YWx1ZS5tYXRjaCh2YWx1ZXMpICE9PSBudWxsKSB7XG4gICAgcmV0dXJuICgwLCBfam9pblByZWZpeGVkVmFsdWUyLmRlZmF1bHQpKHByb3BlcnR5LCB2YWx1ZSk7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHNpemluZztcblxudmFyIF9qb2luUHJlZml4ZWRWYWx1ZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL2pvaW5QcmVmaXhlZFZhbHVlJyk7XG5cbnZhciBfam9pblByZWZpeGVkVmFsdWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfam9pblByZWZpeGVkVmFsdWUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgcHJvcGVydGllcyA9IHtcbiAgbWF4SGVpZ2h0OiB0cnVlLFxuICBtYXhXaWR0aDogdHJ1ZSxcbiAgd2lkdGg6IHRydWUsXG4gIGhlaWdodDogdHJ1ZSxcbiAgY29sdW1uV2lkdGg6IHRydWUsXG4gIG1pbldpZHRoOiB0cnVlLFxuICBtaW5IZWlnaHQ6IHRydWVcbn07XG52YXIgdmFsdWVzID0ge1xuICAnbWluLWNvbnRlbnQnOiB0cnVlLFxuICAnbWF4LWNvbnRlbnQnOiB0cnVlLFxuICAnZmlsbC1hdmFpbGFibGUnOiB0cnVlLFxuICAnZml0LWNvbnRlbnQnOiB0cnVlLFxuICAnY29udGFpbi1mbG9hdHMnOiB0cnVlXG59O1xuXG5mdW5jdGlvbiBzaXppbmcocHJvcGVydHksIHZhbHVlKSB7XG4gIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5XSAmJiB2YWx1ZXNbdmFsdWVdKSB7XG4gICAgcmV0dXJuICgwLCBfam9pblByZWZpeGVkVmFsdWUyLmRlZmF1bHQpKHByb3BlcnR5LCB2YWx1ZSk7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHRyYW5zaXRpb247XG5cbnZhciBfaHlwaGVuYXRlU3R5bGVOYW1lID0gcmVxdWlyZSgnaHlwaGVuYXRlLXN0eWxlLW5hbWUnKTtcblxudmFyIF9oeXBoZW5hdGVTdHlsZU5hbWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaHlwaGVuYXRlU3R5bGVOYW1lKTtcblxudmFyIF9jYXBpdGFsaXplU3RyaW5nID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvY2FwaXRhbGl6ZVN0cmluZycpO1xuXG52YXIgX2NhcGl0YWxpemVTdHJpbmcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2FwaXRhbGl6ZVN0cmluZyk7XG5cbnZhciBfaXNQcmVmaXhlZFZhbHVlID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvaXNQcmVmaXhlZFZhbHVlJyk7XG5cbnZhciBfaXNQcmVmaXhlZFZhbHVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lzUHJlZml4ZWRWYWx1ZSk7XG5cbnZhciBfcHJlZml4UHJvcHMgPSByZXF1aXJlKCcuLi9wcmVmaXhQcm9wcycpO1xuXG52YXIgX3ByZWZpeFByb3BzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3ByZWZpeFByb3BzKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIHByb3BlcnRpZXMgPSB7XG4gIHRyYW5zaXRpb246IHRydWUsXG4gIHRyYW5zaXRpb25Qcm9wZXJ0eTogdHJ1ZSxcbiAgV2Via2l0VHJhbnNpdGlvbjogdHJ1ZSxcbiAgV2Via2l0VHJhbnNpdGlvblByb3BlcnR5OiB0cnVlXG59O1xuXG5mdW5jdGlvbiB0cmFuc2l0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuICAvLyBhbHNvIGNoZWNrIGZvciBhbHJlYWR5IHByZWZpeGVkIHRyYW5zaXRpb25zXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHByb3BlcnRpZXNbcHJvcGVydHldKSB7XG4gICAgdmFyIF9yZWYyO1xuXG4gICAgdmFyIG91dHB1dFZhbHVlID0gcHJlZml4VmFsdWUodmFsdWUpO1xuICAgIHZhciB3ZWJraXRPdXRwdXQgPSBvdXRwdXRWYWx1ZS5zcGxpdCgvLCg/IVteKCldKig/OlxcKFteKCldKlxcKSk/XFwpKS9nKS5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUubWF0Y2goLy1tb3otfC1tcy0vKSA9PT0gbnVsbDtcbiAgICB9KS5qb2luKCcsJyk7XG5cbiAgICAvLyBpZiB0aGUgcHJvcGVydHkgaXMgYWxyZWFkeSBwcmVmaXhlZFxuICAgIGlmIChwcm9wZXJ0eS5pbmRleE9mKCdXZWJraXQnKSA+IC0xKSB7XG4gICAgICByZXR1cm4gX2RlZmluZVByb3BlcnR5KHt9LCBwcm9wZXJ0eSwgd2Via2l0T3V0cHV0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JlZjIgPSB7fSwgX2RlZmluZVByb3BlcnR5KF9yZWYyLCAnV2Via2l0JyArICgwLCBfY2FwaXRhbGl6ZVN0cmluZzIuZGVmYXVsdCkocHJvcGVydHkpLCB3ZWJraXRPdXRwdXQpLCBfZGVmaW5lUHJvcGVydHkoX3JlZjIsIHByb3BlcnR5LCBvdXRwdXRWYWx1ZSksIF9yZWYyO1xuICB9XG59XG5cbmZ1bmN0aW9uIHByZWZpeFZhbHVlKHZhbHVlKSB7XG4gIGlmICgoMCwgX2lzUHJlZml4ZWRWYWx1ZTIuZGVmYXVsdCkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLy8gb25seSBzcGxpdCBtdWx0aSB2YWx1ZXMsIG5vdCBjdWJpYyBiZXppZXJzXG4gIHZhciBtdWx0aXBsZVZhbHVlcyA9IHZhbHVlLnNwbGl0KC8sKD8hW14oKV0qKD86XFwoW14oKV0qXFwpKT9cXCkpL2cpO1xuXG4gIC8vIGl0ZXJhdGUgZWFjaCBzaW5nbGUgdmFsdWUgYW5kIGNoZWNrIGZvciB0cmFuc2l0aW9uZWQgcHJvcGVydGllc1xuICAvLyB0aGF0IG5lZWQgdG8gYmUgcHJlZml4ZWQgYXMgd2VsbFxuICBtdWx0aXBsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWwsIGluZGV4KSB7XG4gICAgbXVsdGlwbGVWYWx1ZXNbaW5kZXhdID0gT2JqZWN0LmtleXMoX3ByZWZpeFByb3BzMi5kZWZhdWx0KS5yZWR1Y2UoZnVuY3Rpb24gKG91dCwgcHJlZml4KSB7XG4gICAgICB2YXIgZGFzaENhc2VQcmVmaXggPSAnLScgKyBwcmVmaXgudG9Mb3dlckNhc2UoKSArICctJztcblxuICAgICAgT2JqZWN0LmtleXMoX3ByZWZpeFByb3BzMi5kZWZhdWx0W3ByZWZpeF0pLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgdmFyIGRhc2hDYXNlUHJvcGVydHkgPSAoMCwgX2h5cGhlbmF0ZVN0eWxlTmFtZTIuZGVmYXVsdCkocHJvcCk7XG5cbiAgICAgICAgaWYgKHZhbC5pbmRleE9mKGRhc2hDYXNlUHJvcGVydHkpID4gLTEgJiYgZGFzaENhc2VQcm9wZXJ0eSAhPT0gJ29yZGVyJykge1xuICAgICAgICAgIC8vIGpvaW4gYWxsIHByZWZpeGVzIGFuZCBjcmVhdGUgYSBuZXcgdmFsdWVcbiAgICAgICAgICBvdXQgPSB2YWwucmVwbGFjZShkYXNoQ2FzZVByb3BlcnR5LCBkYXNoQ2FzZVByZWZpeCArIGRhc2hDYXNlUHJvcGVydHkpICsgJywnICsgb3V0O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfSwgdmFsKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG11bHRpcGxlVmFsdWVzLmpvaW4oJywnKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHByZWZpeEFsbDtcblxudmFyIF9wcmVmaXhQcm9wcyA9IHJlcXVpcmUoJy4vcHJlZml4UHJvcHMnKTtcblxudmFyIF9wcmVmaXhQcm9wczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wcmVmaXhQcm9wcyk7XG5cbnZhciBfY2FwaXRhbGl6ZVN0cmluZyA9IHJlcXVpcmUoJy4uL3V0aWxzL2NhcGl0YWxpemVTdHJpbmcnKTtcblxudmFyIF9jYXBpdGFsaXplU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NhcGl0YWxpemVTdHJpbmcpO1xuXG52YXIgX2NhbGMgPSByZXF1aXJlKCcuL3BsdWdpbnMvY2FsYycpO1xuXG52YXIgX2NhbGMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2FsYyk7XG5cbnZhciBfY3Vyc29yID0gcmVxdWlyZSgnLi9wbHVnaW5zL2N1cnNvcicpO1xuXG52YXIgX2N1cnNvcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jdXJzb3IpO1xuXG52YXIgX2ZsZXggPSByZXF1aXJlKCcuL3BsdWdpbnMvZmxleCcpO1xuXG52YXIgX2ZsZXgyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZmxleCk7XG5cbnZhciBfc2l6aW5nID0gcmVxdWlyZSgnLi9wbHVnaW5zL3NpemluZycpO1xuXG52YXIgX3NpemluZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zaXppbmcpO1xuXG52YXIgX2dyYWRpZW50ID0gcmVxdWlyZSgnLi9wbHVnaW5zL2dyYWRpZW50Jyk7XG5cbnZhciBfZ3JhZGllbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ3JhZGllbnQpO1xuXG52YXIgX3RyYW5zaXRpb24gPSByZXF1aXJlKCcuL3BsdWdpbnMvdHJhbnNpdGlvbicpO1xuXG52YXIgX3RyYW5zaXRpb24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdHJhbnNpdGlvbik7XG5cbnZhciBfZmxleGJveElFID0gcmVxdWlyZSgnLi9wbHVnaW5zL2ZsZXhib3hJRScpO1xuXG52YXIgX2ZsZXhib3hJRTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mbGV4Ym94SUUpO1xuXG52YXIgX2ZsZXhib3hPbGQgPSByZXF1aXJlKCcuL3BsdWdpbnMvZmxleGJveE9sZCcpO1xuXG52YXIgX2ZsZXhib3hPbGQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZmxleGJveE9sZCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8vIHNwZWNpYWwgZmxleGJveCBzcGVjaWZpY2F0aW9uc1xuXG5cbnZhciBwbHVnaW5zID0gW19jYWxjMi5kZWZhdWx0LCBfY3Vyc29yMi5kZWZhdWx0LCBfc2l6aW5nMi5kZWZhdWx0LCBfZ3JhZGllbnQyLmRlZmF1bHQsIF90cmFuc2l0aW9uMi5kZWZhdWx0LCBfZmxleGJveElFMi5kZWZhdWx0LCBfZmxleGJveE9sZDIuZGVmYXVsdCwgX2ZsZXgyLmRlZmF1bHRdO1xuXG4vKipcbiAqIFJldHVybnMgYSBwcmVmaXhlZCB2ZXJzaW9uIG9mIHRoZSBzdHlsZSBvYmplY3QgdXNpbmcgYWxsIHZlbmRvciBwcmVmaXhlc1xuICogQHBhcmFtIHtPYmplY3R9IHN0eWxlcyAtIFN0eWxlIG9iamVjdCB0aGF0IGdldHMgcHJlZml4ZWQgcHJvcGVydGllcyBhZGRlZFxuICogQHJldHVybnMge09iamVjdH0gLSBTdHlsZSBvYmplY3Qgd2l0aCBwcmVmaXhlZCBwcm9wZXJ0aWVzIGFuZCB2YWx1ZXNcbiAqL1xuZnVuY3Rpb24gcHJlZml4QWxsKHN0eWxlcykge1xuICBPYmplY3Qua2V5cyhzdHlsZXMpLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgdmFyIHZhbHVlID0gc3R5bGVzW3Byb3BlcnR5XTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAvLyByZWN1cnNlIHRocm91Z2ggbmVzdGVkIHN0eWxlIG9iamVjdHNcbiAgICAgIHN0eWxlc1twcm9wZXJ0eV0gPSBwcmVmaXhBbGwodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhfcHJlZml4UHJvcHMyLmRlZmF1bHQpLmZvckVhY2goZnVuY3Rpb24gKHByZWZpeCkge1xuICAgICAgICB2YXIgcHJvcGVydGllcyA9IF9wcmVmaXhQcm9wczIuZGVmYXVsdFtwcmVmaXhdO1xuICAgICAgICAvLyBhZGQgcHJlZml4ZXMgaWYgbmVlZGVkXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5XSkge1xuICAgICAgICAgIHN0eWxlc1twcmVmaXggKyAoMCwgX2NhcGl0YWxpemVTdHJpbmcyLmRlZmF1bHQpKHByb3BlcnR5KV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3Qua2V5cyhzdHlsZXMpLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgW10uY29uY2F0KHN0eWxlc1twcm9wZXJ0eV0pLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuICAgICAgLy8gcmVzb2x2ZSBldmVyeSBzcGVjaWFsIHBsdWdpbnNcbiAgICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICAgIHJldHVybiBhc3NpZ25TdHlsZXMoc3R5bGVzLCBwbHVnaW4ocHJvcGVydHksIHZhbHVlKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZnVuY3Rpb24gYXNzaWduU3R5bGVzKGJhc2UpIHtcbiAgdmFyIGV4dGVuZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gIE9iamVjdC5rZXlzKGV4dGVuZCkuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICB2YXIgYmFzZVZhbHVlID0gYmFzZVtwcm9wZXJ0eV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYmFzZVZhbHVlKSkge1xuICAgICAgW10uY29uY2F0KGV4dGVuZFtwcm9wZXJ0eV0pLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciB2YWx1ZUluZGV4ID0gYmFzZVZhbHVlLmluZGV4T2YodmFsdWUpO1xuICAgICAgICBpZiAodmFsdWVJbmRleCA+IC0xKSB7XG4gICAgICAgICAgYmFzZVtwcm9wZXJ0eV0uc3BsaWNlKHZhbHVlSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGJhc2VbcHJvcGVydHldLnB1c2godmFsdWUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2VbcHJvcGVydHldID0gZXh0ZW5kW3Byb3BlcnR5XTtcbiAgICB9XG4gIH0pO1xufVxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB7IFwiV2Via2l0XCI6IHsgXCJ0cmFuc2Zvcm1cIjogdHJ1ZSwgXCJ0cmFuc2Zvcm1PcmlnaW5cIjogdHJ1ZSwgXCJ0cmFuc2Zvcm1PcmlnaW5YXCI6IHRydWUsIFwidHJhbnNmb3JtT3JpZ2luWVwiOiB0cnVlLCBcImJhY2tmYWNlVmlzaWJpbGl0eVwiOiB0cnVlLCBcInBlcnNwZWN0aXZlXCI6IHRydWUsIFwicGVyc3BlY3RpdmVPcmlnaW5cIjogdHJ1ZSwgXCJ0cmFuc2Zvcm1TdHlsZVwiOiB0cnVlLCBcInRyYW5zZm9ybU9yaWdpblpcIjogdHJ1ZSwgXCJhbmltYXRpb25cIjogdHJ1ZSwgXCJhbmltYXRpb25EZWxheVwiOiB0cnVlLCBcImFuaW1hdGlvbkRpcmVjdGlvblwiOiB0cnVlLCBcImFuaW1hdGlvbkZpbGxNb2RlXCI6IHRydWUsIFwiYW5pbWF0aW9uRHVyYXRpb25cIjogdHJ1ZSwgXCJhbmltYXRpb25JdGVyYXRpb25Db3VudFwiOiB0cnVlLCBcImFuaW1hdGlvbk5hbWVcIjogdHJ1ZSwgXCJhbmltYXRpb25QbGF5U3RhdGVcIjogdHJ1ZSwgXCJhbmltYXRpb25UaW1pbmdGdW5jdGlvblwiOiB0cnVlLCBcImFwcGVhcmFuY2VcIjogdHJ1ZSwgXCJ1c2VyU2VsZWN0XCI6IHRydWUsIFwiZm9udEtlcm5pbmdcIjogdHJ1ZSwgXCJ0ZXh0RW1waGFzaXNQb3NpdGlvblwiOiB0cnVlLCBcInRleHRFbXBoYXNpc1wiOiB0cnVlLCBcInRleHRFbXBoYXNpc1N0eWxlXCI6IHRydWUsIFwidGV4dEVtcGhhc2lzQ29sb3JcIjogdHJ1ZSwgXCJib3hEZWNvcmF0aW9uQnJlYWtcIjogdHJ1ZSwgXCJjbGlwUGF0aFwiOiB0cnVlLCBcIm1hc2tJbWFnZVwiOiB0cnVlLCBcIm1hc2tNb2RlXCI6IHRydWUsIFwibWFza1JlcGVhdFwiOiB0cnVlLCBcIm1hc2tQb3NpdGlvblwiOiB0cnVlLCBcIm1hc2tDbGlwXCI6IHRydWUsIFwibWFza09yaWdpblwiOiB0cnVlLCBcIm1hc2tTaXplXCI6IHRydWUsIFwibWFza0NvbXBvc2l0ZVwiOiB0cnVlLCBcIm1hc2tcIjogdHJ1ZSwgXCJtYXNrQm9yZGVyU291cmNlXCI6IHRydWUsIFwibWFza0JvcmRlck1vZGVcIjogdHJ1ZSwgXCJtYXNrQm9yZGVyU2xpY2VcIjogdHJ1ZSwgXCJtYXNrQm9yZGVyV2lkdGhcIjogdHJ1ZSwgXCJtYXNrQm9yZGVyT3V0c2V0XCI6IHRydWUsIFwibWFza0JvcmRlclJlcGVhdFwiOiB0cnVlLCBcIm1hc2tCb3JkZXJcIjogdHJ1ZSwgXCJtYXNrVHlwZVwiOiB0cnVlLCBcInRleHREZWNvcmF0aW9uU3R5bGVcIjogdHJ1ZSwgXCJ0ZXh0RGVjb3JhdGlvblNraXBcIjogdHJ1ZSwgXCJ0ZXh0RGVjb3JhdGlvbkxpbmVcIjogdHJ1ZSwgXCJ0ZXh0RGVjb3JhdGlvbkNvbG9yXCI6IHRydWUsIFwiZmlsdGVyXCI6IHRydWUsIFwiZm9udEZlYXR1cmVTZXR0aW5nc1wiOiB0cnVlLCBcImJyZWFrQWZ0ZXJcIjogdHJ1ZSwgXCJicmVha0JlZm9yZVwiOiB0cnVlLCBcImJyZWFrSW5zaWRlXCI6IHRydWUsIFwiY29sdW1uQ291bnRcIjogdHJ1ZSwgXCJjb2x1bW5GaWxsXCI6IHRydWUsIFwiY29sdW1uR2FwXCI6IHRydWUsIFwiY29sdW1uUnVsZVwiOiB0cnVlLCBcImNvbHVtblJ1bGVDb2xvclwiOiB0cnVlLCBcImNvbHVtblJ1bGVTdHlsZVwiOiB0cnVlLCBcImNvbHVtblJ1bGVXaWR0aFwiOiB0cnVlLCBcImNvbHVtbnNcIjogdHJ1ZSwgXCJjb2x1bW5TcGFuXCI6IHRydWUsIFwiY29sdW1uV2lkdGhcIjogdHJ1ZSwgXCJmbGV4XCI6IHRydWUsIFwiZmxleEJhc2lzXCI6IHRydWUsIFwiZmxleERpcmVjdGlvblwiOiB0cnVlLCBcImZsZXhHcm93XCI6IHRydWUsIFwiZmxleEZsb3dcIjogdHJ1ZSwgXCJmbGV4U2hyaW5rXCI6IHRydWUsIFwiZmxleFdyYXBcIjogdHJ1ZSwgXCJhbGlnbkNvbnRlbnRcIjogdHJ1ZSwgXCJhbGlnbkl0ZW1zXCI6IHRydWUsIFwiYWxpZ25TZWxmXCI6IHRydWUsIFwianVzdGlmeUNvbnRlbnRcIjogdHJ1ZSwgXCJvcmRlclwiOiB0cnVlLCBcInRyYW5zaXRpb25cIjogdHJ1ZSwgXCJ0cmFuc2l0aW9uRGVsYXlcIjogdHJ1ZSwgXCJ0cmFuc2l0aW9uRHVyYXRpb25cIjogdHJ1ZSwgXCJ0cmFuc2l0aW9uUHJvcGVydHlcIjogdHJ1ZSwgXCJ0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb25cIjogdHJ1ZSwgXCJiYWNrZHJvcEZpbHRlclwiOiB0cnVlLCBcInNjcm9sbFNuYXBUeXBlXCI6IHRydWUsIFwic2Nyb2xsU25hcFBvaW50c1hcIjogdHJ1ZSwgXCJzY3JvbGxTbmFwUG9pbnRzWVwiOiB0cnVlLCBcInNjcm9sbFNuYXBEZXN0aW5hdGlvblwiOiB0cnVlLCBcInNjcm9sbFNuYXBDb29yZGluYXRlXCI6IHRydWUsIFwic2hhcGVJbWFnZVRocmVzaG9sZFwiOiB0cnVlLCBcInNoYXBlSW1hZ2VNYXJnaW5cIjogdHJ1ZSwgXCJzaGFwZUltYWdlT3V0c2lkZVwiOiB0cnVlLCBcImh5cGhlbnNcIjogdHJ1ZSwgXCJmbG93SW50b1wiOiB0cnVlLCBcImZsb3dGcm9tXCI6IHRydWUsIFwicmVnaW9uRnJhZ21lbnRcIjogdHJ1ZSwgXCJ0ZXh0U2l6ZUFkanVzdFwiOiB0cnVlLCBcImJvcmRlckltYWdlXCI6IHRydWUsIFwiYm9yZGVySW1hZ2VPdXRzZXRcIjogdHJ1ZSwgXCJib3JkZXJJbWFnZVJlcGVhdFwiOiB0cnVlLCBcImJvcmRlckltYWdlU2xpY2VcIjogdHJ1ZSwgXCJib3JkZXJJbWFnZVNvdXJjZVwiOiB0cnVlLCBcImJvcmRlckltYWdlV2lkdGhcIjogdHJ1ZSwgXCJ0YWJTaXplXCI6IHRydWUsIFwib2JqZWN0Rml0XCI6IHRydWUsIFwib2JqZWN0UG9zaXRpb25cIjogdHJ1ZSB9LCBcIk1velwiOiB7IFwiYXBwZWFyYW5jZVwiOiB0cnVlLCBcInVzZXJTZWxlY3RcIjogdHJ1ZSwgXCJib3hTaXppbmdcIjogdHJ1ZSwgXCJ0ZXh0QWxpZ25MYXN0XCI6IHRydWUsIFwidGV4dERlY29yYXRpb25TdHlsZVwiOiB0cnVlLCBcInRleHREZWNvcmF0aW9uU2tpcFwiOiB0cnVlLCBcInRleHREZWNvcmF0aW9uTGluZVwiOiB0cnVlLCBcInRleHREZWNvcmF0aW9uQ29sb3JcIjogdHJ1ZSwgXCJ0YWJTaXplXCI6IHRydWUsIFwiaHlwaGVuc1wiOiB0cnVlLCBcImZvbnRGZWF0dXJlU2V0dGluZ3NcIjogdHJ1ZSwgXCJicmVha0FmdGVyXCI6IHRydWUsIFwiYnJlYWtCZWZvcmVcIjogdHJ1ZSwgXCJicmVha0luc2lkZVwiOiB0cnVlLCBcImNvbHVtbkNvdW50XCI6IHRydWUsIFwiY29sdW1uRmlsbFwiOiB0cnVlLCBcImNvbHVtbkdhcFwiOiB0cnVlLCBcImNvbHVtblJ1bGVcIjogdHJ1ZSwgXCJjb2x1bW5SdWxlQ29sb3JcIjogdHJ1ZSwgXCJjb2x1bW5SdWxlU3R5bGVcIjogdHJ1ZSwgXCJjb2x1bW5SdWxlV2lkdGhcIjogdHJ1ZSwgXCJjb2x1bW5zXCI6IHRydWUsIFwiY29sdW1uU3BhblwiOiB0cnVlLCBcImNvbHVtbldpZHRoXCI6IHRydWUgfSwgXCJtc1wiOiB7IFwiZmxleFwiOiB0cnVlLCBcImZsZXhCYXNpc1wiOiBmYWxzZSwgXCJmbGV4RGlyZWN0aW9uXCI6IHRydWUsIFwiZmxleEdyb3dcIjogZmFsc2UsIFwiZmxleEZsb3dcIjogdHJ1ZSwgXCJmbGV4U2hyaW5rXCI6IGZhbHNlLCBcImZsZXhXcmFwXCI6IHRydWUsIFwiYWxpZ25Db250ZW50XCI6IGZhbHNlLCBcImFsaWduSXRlbXNcIjogZmFsc2UsIFwiYWxpZ25TZWxmXCI6IGZhbHNlLCBcImp1c3RpZnlDb250ZW50XCI6IGZhbHNlLCBcIm9yZGVyXCI6IGZhbHNlLCBcInRyYW5zZm9ybVwiOiB0cnVlLCBcInRyYW5zZm9ybU9yaWdpblwiOiB0cnVlLCBcInRyYW5zZm9ybU9yaWdpblhcIjogdHJ1ZSwgXCJ0cmFuc2Zvcm1PcmlnaW5ZXCI6IHRydWUsIFwidXNlclNlbGVjdFwiOiB0cnVlLCBcIndyYXBGbG93XCI6IHRydWUsIFwid3JhcFRocm91Z2hcIjogdHJ1ZSwgXCJ3cmFwTWFyZ2luXCI6IHRydWUsIFwic2Nyb2xsU25hcFR5cGVcIjogdHJ1ZSwgXCJzY3JvbGxTbmFwUG9pbnRzWFwiOiB0cnVlLCBcInNjcm9sbFNuYXBQb2ludHNZXCI6IHRydWUsIFwic2Nyb2xsU25hcERlc3RpbmF0aW9uXCI6IHRydWUsIFwic2Nyb2xsU25hcENvb3JkaW5hdGVcIjogdHJ1ZSwgXCJ0b3VjaEFjdGlvblwiOiB0cnVlLCBcImh5cGhlbnNcIjogdHJ1ZSwgXCJmbG93SW50b1wiOiB0cnVlLCBcImZsb3dGcm9tXCI6IHRydWUsIFwiYnJlYWtCZWZvcmVcIjogdHJ1ZSwgXCJicmVha0FmdGVyXCI6IHRydWUsIFwiYnJlYWtJbnNpZGVcIjogdHJ1ZSwgXCJyZWdpb25GcmFnbWVudFwiOiB0cnVlLCBcImdyaWRUZW1wbGF0ZUNvbHVtbnNcIjogdHJ1ZSwgXCJncmlkVGVtcGxhdGVSb3dzXCI6IHRydWUsIFwiZ3JpZFRlbXBsYXRlQXJlYXNcIjogdHJ1ZSwgXCJncmlkVGVtcGxhdGVcIjogdHJ1ZSwgXCJncmlkQXV0b0NvbHVtbnNcIjogdHJ1ZSwgXCJncmlkQXV0b1Jvd3NcIjogdHJ1ZSwgXCJncmlkQXV0b0Zsb3dcIjogdHJ1ZSwgXCJncmlkXCI6IHRydWUsIFwiZ3JpZFJvd1N0YXJ0XCI6IHRydWUsIFwiZ3JpZENvbHVtblN0YXJ0XCI6IHRydWUsIFwiZ3JpZFJvd0VuZFwiOiB0cnVlLCBcImdyaWRSb3dcIjogdHJ1ZSwgXCJncmlkQ29sdW1uXCI6IHRydWUsIFwiZ3JpZENvbHVtbkVuZFwiOiB0cnVlLCBcImdyaWRDb2x1bW5HYXBcIjogdHJ1ZSwgXCJncmlkUm93R2FwXCI6IHRydWUsIFwiZ3JpZEFyZWFcIjogdHJ1ZSwgXCJncmlkR2FwXCI6IHRydWUsIFwidGV4dFNpemVBZGp1c3RcIjogdHJ1ZSB9IH07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuLy8gaGVscGVyIHRvIGNhcGl0YWxpemUgc3RyaW5nc1xuXG5leHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgdmFsdWUgPSB2YWx1ZS5qb2luKCcsJyk7XG5cbiAgcmV0dXJuIHZhbHVlLm1hdGNoKC8td2Via2l0LXwtbW96LXwtbXMtLykgIT09IG51bGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbi8vIHJldHVybnMgYSBzdHlsZSBvYmplY3Qgd2l0aCBhIHNpbmdsZSBjb25jYXRlZCBwcmVmaXhlZCB2YWx1ZSBzdHJpbmdcblxuZXhwb3J0cy5kZWZhdWx0ID0gZnVuY3Rpb24gKHByb3BlcnR5LCB2YWx1ZSkge1xuICB2YXIgcmVwbGFjZXIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDIgfHwgYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyBmdW5jdGlvbiAocHJlZml4LCB2YWx1ZSkge1xuICAgIHJldHVybiBwcmVmaXggKyB2YWx1ZTtcbiAgfSA6IGFyZ3VtZW50c1syXTtcbiAgcmV0dXJuIF9kZWZpbmVQcm9wZXJ0eSh7fSwgcHJvcGVydHksIFsnLXdlYmtpdC0nLCAnLW1vei0nLCAnJ10ubWFwKGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICByZXR1cm4gcmVwbGFjZXIocHJlZml4LCB2YWx1ZSk7XG4gIH0pKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvc3RhdGljL3ByZWZpeEFsbCcpXG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3NzLCBTdHlsZVNoZWV0IH0gZnJvbSAnYXBocm9kaXRlL25vLWltcG9ydGFudCc7XG5cbmltcG9ydCBkZWZhdWx0cyBmcm9tICcuLi90aGVtZSc7XG5pbXBvcnQgeyBkZWVwTWVyZ2UgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgSWNvbiBmcm9tICcuL0ljb24nO1xuXG5mdW5jdGlvbiBBcnJvdyAoe1xuXHRkaXJlY3Rpb24sXG5cdGljb24sXG5cdG9uQ2xpY2ssXG5cdHNpemUsXG5cdC4uLnByb3BzLFxufSxcbntcblx0dGhlbWUsXG59KSB7XG5cdGNvbnN0IGNsYXNzZXMgPSBTdHlsZVNoZWV0LmNyZWF0ZShkZWVwTWVyZ2UoZGVmYXVsdFN0eWxlcywgdGhlbWUpKTtcblxuXHRyZXR1cm4gKFxuXHRcdDxidXR0b25cblx0XHRcdHR5cGU9XCJidXR0b25cIlxuXHRcdFx0Y2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5hcnJvdywgY2xhc3Nlc1snYXJyb3dfX2RpcmVjdGlvbl9fJyArIGRpcmVjdGlvbl0sIHNpemUgJiYgY2xhc3Nlc1snYXJyb3dfX3NpemVfXycgKyBzaXplXSl9XG5cdFx0XHRvbkNsaWNrPXtvbkNsaWNrfVxuXHRcdFx0b25Ub3VjaEVuZD17b25DbGlja31cblx0XHRcdHsuLi5wcm9wc31cblx0XHQ+XG5cdFx0XHQ8SWNvbiBmaWxsPXshIXRoZW1lLmFycm93ICYmIHRoZW1lLmFycm93LmZpbGwgfHwgZGVmYXVsdHMuYXJyb3cuZmlsbH0gdHlwZT17aWNvbn0gLz5cblx0XHQ8L2J1dHRvbj5cblx0KTtcbn07XG5cbkFycm93LnByb3BUeXBlcyA9IHtcblx0ZGlyZWN0aW9uOiBQcm9wVHlwZXMub25lT2YoWydsZWZ0JywgJ3JpZ2h0J10pLFxuXHRpY29uOiBQcm9wVHlwZXMuc3RyaW5nLFxuXHRvbkNsaWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXHRzaXplOiBQcm9wVHlwZXMub25lT2YoWydtZWRpdW0nLCAnc21hbGwnXSkuaXNSZXF1aXJlZCxcbn07XG5BcnJvdy5kZWZhdWx0UHJvcHMgPSB7XG5cdHNpemU6ICdtZWRpdW0nLFxufTtcbkFycm93LmNvbnRleHRUeXBlcyA9IHtcblx0dGhlbWU6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbn07XG5cbmNvbnN0IGRlZmF1bHRTdHlsZXMgPSB7XG5cdGFycm93OiB7XG5cdFx0YmFja2dyb3VuZDogJ25vbmUnLFxuXHRcdGJvcmRlcjogJ25vbmUnLFxuXHRcdGJvcmRlclJhZGl1czogNCxcblx0XHRjdXJzb3I6ICdwb2ludGVyJyxcblx0XHRvdXRsaW5lOiAnbm9uZScsXG5cdFx0cGFkZGluZzogMTAsIC8vIGluY3JlYXNlIGhpdCBhcmVhXG5cdFx0cG9zaXRpb246ICdhYnNvbHV0ZScsXG5cdFx0dG9wOiAnNTAlJyxcblxuXHRcdC8vIGRpc2FibGUgdXNlciBzZWxlY3Rcblx0XHRXZWJraXRUb3VjaENhbGxvdXQ6ICdub25lJyxcblx0XHR1c2VyU2VsZWN0OiAnbm9uZScsXG5cdH0sXG5cblx0Ly8gc2l6ZWVzXG5cdGFycm93X19zaXplX19tZWRpdW06IHtcblx0XHRoZWlnaHQ6IGRlZmF1bHRzLmFycm93LmhlaWdodCxcblx0XHRtYXJnaW5Ub3A6IGRlZmF1bHRzLmFycm93LmhlaWdodCAvIC0yLFxuXHRcdHdpZHRoOiA0MCxcblxuXHRcdCdAbWVkaWEgKG1pbi13aWR0aDogNzY4cHgpJzoge1xuXHRcdFx0d2lkdGg6IDcwLFxuXHRcdH0sXG5cdH0sXG5cdGFycm93X19zaXplX19zbWFsbDoge1xuXHRcdGhlaWdodDogZGVmYXVsdHMudGh1bWJuYWlsLnNpemUsXG5cdFx0bWFyZ2luVG9wOiBkZWZhdWx0cy50aHVtYm5haWwuc2l6ZSAvIC0yLFxuXHRcdHdpZHRoOiAzMCxcblxuXHRcdCdAbWVkaWEgKG1pbi13aWR0aDogNTAwcHgpJzoge1xuXHRcdFx0d2lkdGg6IDQwLFxuXHRcdH0sXG5cdH0sXG5cblx0Ly8gZGlyZWN0aW9uXG5cdGFycm93X19kaXJlY3Rpb25fX3JpZ2h0OiB7XG5cdFx0cmlnaHQ6IGRlZmF1bHRzLmNvbnRhaW5lci5ndXR0ZXIuaG9yaXpvbnRhbCxcblx0fSxcblx0YXJyb3dfX2RpcmVjdGlvbl9fbGVmdDoge1xuXHRcdGxlZnQ6IGRlZmF1bHRzLmNvbnRhaW5lci5ndXR0ZXIuaG9yaXpvbnRhbCxcblx0fSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXJyb3c7XG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3NzLCBTdHlsZVNoZWV0IH0gZnJvbSAnYXBocm9kaXRlL25vLWltcG9ydGFudCc7XG5cbmltcG9ydCBkZWZhdWx0cyBmcm9tICcuLi90aGVtZSc7XG5pbXBvcnQgeyBkZWVwTWVyZ2UgfSBmcm9tICcuLi91dGlscyc7XG5cbmZ1bmN0aW9uIENvbnRhaW5lciAoeyAuLi5wcm9wcyB9LCB7IHRoZW1lIH0pIHtcblx0Y29uc3QgY2xhc3NlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKGRlZXBNZXJnZShkZWZhdWx0U3R5bGVzLCB0aGVtZSkpO1xuXG5cdHJldHVybiAoXG5cdFx0PGRpdlxuXHRcdFx0Y2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5jb250YWluZXIpfVxuXHRcdFx0ey4uLnByb3BzfVxuXHRcdC8+XG5cdCk7XG59O1xuXG5Db250YWluZXIuY29udGV4dFR5cGVzID0ge1xuXHR0aGVtZTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxufTtcblxuY29uc3QgZGVmYXVsdFN0eWxlcyA9IHtcblx0Y29udGFpbmVyOiB7XG5cdFx0YWxpZ25JdGVtczogJ2NlbnRlcicsXG5cdFx0YmFja2dyb3VuZENvbG9yOiBkZWZhdWx0cy5jb250YWluZXIuYmFja2dyb3VuZCxcblx0XHRib3hTaXppbmc6ICdib3JkZXItYm94Jyxcblx0XHRkaXNwbGF5OiAnZmxleCcsXG5cdFx0aGVpZ2h0OiAnMTAwJScsXG5cdFx0anVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuXHRcdGxlZnQ6IDAsXG5cdFx0cGFkZGluZ0JvdHRvbTogZGVmYXVsdHMuY29udGFpbmVyLmd1dHRlci52ZXJ0aWNhbCxcblx0XHRwYWRkaW5nTGVmdDogZGVmYXVsdHMuY29udGFpbmVyLmd1dHRlci5ob3Jpem9udGFsLFxuXHRcdHBhZGRpbmdSaWdodDogZGVmYXVsdHMuY29udGFpbmVyLmd1dHRlci5ob3Jpem9udGFsLFxuXHRcdHBhZGRpbmdUb3A6IGRlZmF1bHRzLmNvbnRhaW5lci5ndXR0ZXIudmVydGljYWwsXG5cdFx0cG9zaXRpb246ICdmaXhlZCcsXG5cdFx0dG9wOiAwLFxuXHRcdHdpZHRoOiAnMTAwJScsXG5cdFx0ekluZGV4OiBkZWZhdWx0cy5jb250YWluZXIuekluZGV4LFxuXHR9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250YWluZXI7XG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3NzLCBTdHlsZVNoZWV0IH0gZnJvbSAnYXBocm9kaXRlL25vLWltcG9ydGFudCc7XG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi4vdGhlbWUnO1xuaW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5mdW5jdGlvbiBGb290ZXIgKHtcblx0Y2FwdGlvbixcblx0Y291bnRDdXJyZW50LFxuXHRjb3VudFNlcGFyYXRvcixcblx0Y291bnRUb3RhbCxcblx0c2hvd0NvdW50LFxuXHQuLi5wcm9wcyxcbn0sIHtcblx0dGhlbWUsXG59KSB7XG5cdGlmICghY2FwdGlvbiAmJiAhc2hvd0NvdW50KSByZXR1cm4gbnVsbDtcblxuXHRjb25zdCBjbGFzc2VzID0gU3R5bGVTaGVldC5jcmVhdGUoZGVlcE1lcmdlKGRlZmF1bHRTdHlsZXMsIHRoZW1lKSk7XG5cblx0Y29uc3QgaW1hZ2VDb3VudCA9IHNob3dDb3VudCA/IChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y3NzKGNsYXNzZXMuZm9vdGVyQ291bnQpfT5cblx0XHRcdHtjb3VudEN1cnJlbnR9XG5cdFx0XHR7Y291bnRTZXBhcmF0b3J9XG5cdFx0XHR7Y291bnRUb3RhbH1cblx0XHQ8L2Rpdj4pXG5cdFx0OiA8c3BhbiAvPjtcblxuXHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5mb290ZXIpfSB7Li4ucHJvcHN9PlxuXHRcdFx0e2NhcHRpb24gPyAoXG5cdFx0XHRcdDxmaWdjYXB0aW9uIGNsYXNzTmFtZT17Y3NzKGNsYXNzZXMuZm9vdGVyQ2FwdGlvbil9PlxuXHRcdFx0XHRcdHtjYXB0aW9ufVxuXHRcdFx0XHQ8L2ZpZ2NhcHRpb24+XG5cdFx0XHQpIDogPHNwYW4gLz59XG5cdFx0XHR7aW1hZ2VDb3VudH1cblx0XHQ8L2Rpdj5cblx0KTtcbn07XG5cbkZvb3Rlci5wcm9wVHlwZXMgPSB7XG5cdGNhcHRpb246IFByb3BUeXBlcy5vbmVPZlR5cGUoW1Byb3BUeXBlcy5zdHJpbmcsIFByb3BUeXBlcy5lbGVtZW50XSksXG5cdGNvdW50Q3VycmVudDogUHJvcFR5cGVzLm51bWJlcixcblx0Y291bnRTZXBhcmF0b3I6IFByb3BUeXBlcy5zdHJpbmcsXG5cdGNvdW50VG90YWw6IFByb3BUeXBlcy5udW1iZXIsXG5cdHNob3dDb3VudDogUHJvcFR5cGVzLmJvb2wsXG59O1xuRm9vdGVyLmNvbnRleHRUeXBlcyA9IHtcblx0dGhlbWU6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbn07XG5cbmNvbnN0IGRlZmF1bHRTdHlsZXMgPSB7XG5cdGZvb3Rlcjoge1xuXHRcdGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuXHRcdGNvbG9yOiBkZWZhdWx0cy5mb290ZXIuY29sb3IsXG5cdFx0Y3Vyc29yOiAnYXV0bycsXG5cdFx0ZGlzcGxheTogJ2ZsZXgnLFxuXHRcdGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG5cdFx0bGVmdDogMCxcblx0XHRsaW5lSGVpZ2h0OiAxLjMsXG5cdFx0aGVpZ2h0OiBkZWZhdWx0cy5mb290ZXIuaGVpZ2h0LFxuXHRcdHBhZGRpbmdCb3R0b206IGRlZmF1bHRzLmZvb3Rlci5ndXR0ZXIudmVydGljYWwsXG5cdFx0cGFkZGluZ0xlZnQ6IGRlZmF1bHRzLmZvb3Rlci5ndXR0ZXIuaG9yaXpvbnRhbCxcblx0XHRwYWRkaW5nUmlnaHQ6IGRlZmF1bHRzLmZvb3Rlci5ndXR0ZXIuaG9yaXpvbnRhbCxcblx0XHRwYWRkaW5nVG9wOiBkZWZhdWx0cy5mb290ZXIuZ3V0dGVyLnZlcnRpY2FsLFxuXHR9LFxuXHRmb290ZXJDb3VudDoge1xuXHRcdGNvbG9yOiBkZWZhdWx0cy5mb290ZXIuY291bnQuY29sb3IsXG5cdFx0Zm9udFNpemU6IGRlZmF1bHRzLmZvb3Rlci5jb3VudC5mb250U2l6ZSxcblx0XHRwYWRkaW5nTGVmdDogJzFlbScsIC8vIGFkZCBhIHNtYWxsIGd1dHRlciBmb3IgdGhlIGNhcHRpb25cblx0fSxcblx0Zm9vdGVyQ2FwdGlvbjoge1xuXHRcdGZsZXg6ICcxIDEgMCcsXG5cdH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvb3RlcjtcbiIsImltcG9ydCBSZWFjdCwgeyBQcm9wVHlwZXMgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBjc3MsIFN0eWxlU2hlZXQgfSBmcm9tICdhcGhyb2RpdGUvbm8taW1wb3J0YW50JztcblxuaW1wb3J0IGRlZmF1bHRzIGZyb20gJy4uL3RoZW1lJztcbmltcG9ydCB7IGRlZXBNZXJnZSB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBJY29uIGZyb20gJy4vSWNvbic7XG5cbmZ1bmN0aW9uIEhlYWRlciAoe1xuXHRjdXN0b21Db250cm9scyxcblx0b25DbG9zZSxcblx0c2hvd0Nsb3NlQnV0dG9uLFxuXHQuLi5wcm9wcyxcbn0sIHtcblx0dGhlbWUsXG59KSB7XG5cdGNvbnN0IGNsYXNzZXMgPSBTdHlsZVNoZWV0LmNyZWF0ZShkZWVwTWVyZ2UoZGVmYXVsdFN0eWxlcywgdGhlbWUpKTtcblxuXHRyZXR1cm4gKFxuXHRcdDxkaXYgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5oZWFkZXIpfSB7Li4ucHJvcHN9PlxuXHRcdFx0e2N1c3RvbUNvbnRyb2xzID8gY3VzdG9tQ29udHJvbHMgOiA8c3BhbiAvPn1cblx0XHRcdHshIXNob3dDbG9zZUJ1dHRvbiAmJiAoXG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHR0aXRsZT1cIkNsb3NlIChFc2MpXCJcblx0XHRcdFx0XHRjbGFzc05hbWU9e2NzcyhjbGFzc2VzLmNsb3NlKX1cblx0XHRcdFx0XHRvbkNsaWNrPXtvbkNsb3NlfVxuXHRcdFx0XHQ+XG5cdFx0XHRcdFx0PEljb24gZmlsbD17ISF0aGVtZS5jbG9zZSAmJiB0aGVtZS5jbG9zZS5maWxsIHx8IGRlZmF1bHRzLmNsb3NlLmZpbGx9IHR5cGU9XCJjbG9zZVwiIC8+XG5cdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0KX1cblx0XHQ8L2Rpdj5cblx0KTtcbn07XG5cbkhlYWRlci5wcm9wVHlwZXMgPSB7XG5cdGN1c3RvbUNvbnRyb2xzOiBQcm9wVHlwZXMuYXJyYXksXG5cdG9uQ2xvc2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cdHNob3dDbG9zZUJ1dHRvbjogUHJvcFR5cGVzLmJvb2wsXG59O1xuSGVhZGVyLmNvbnRleHRUeXBlcyA9IHtcblx0dGhlbWU6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbn07XG5cbmNvbnN0IGRlZmF1bHRTdHlsZXMgPSB7XG5cdGhlYWRlcjoge1xuXHRcdGRpc3BsYXk6ICdmbGV4Jyxcblx0XHRqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuXHRcdGhlaWdodDogZGVmYXVsdHMuaGVhZGVyLmhlaWdodCxcblx0fSxcblx0Y2xvc2U6IHtcblx0XHRiYWNrZ3JvdW5kOiAnbm9uZScsXG5cdFx0Ym9yZGVyOiAnbm9uZScsXG5cdFx0Y3Vyc29yOiAncG9pbnRlcicsXG5cdFx0b3V0bGluZTogJ25vbmUnLFxuXHRcdHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuXHRcdHRvcDogMCxcblx0XHR2ZXJ0aWNhbEFsaWduOiAnYm90dG9tJyxcblxuXHRcdC8vIGluY3JlYXNlIGhpdCBhcmVhXG5cdFx0aGVpZ2h0OiBkZWZhdWx0cy5jbG9zZS5oZWlnaHQgKyAyMCxcblx0XHRtYXJnaW5SaWdodDogLTEwLFxuXHRcdHBhZGRpbmc6IDEwLFxuXHRcdHdpZHRoOiBkZWZhdWx0cy5jbG9zZS53aWR0aCArIDIwLFxuXHR9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXI7XG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGljb25zIGZyb20gJy4uL2ljb25zJztcblxuY29uc3QgSWNvbiA9ICh7IGZpbGwsIHR5cGUsIC4uLnByb3BzIH0pID0+IHtcblx0Y29uc3QgaWNvbiA9IGljb25zW3R5cGVdO1xuXG5cdHJldHVybiAoXG5cdFx0PHNwYW5cblx0XHRcdGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogaWNvbihmaWxsKSB9fVxuXHRcdFx0ey4uLnByb3BzfVxuXHRcdC8+XG5cdCk7XG59O1xuXG5JY29uLnByb3BUeXBlcyA9IHtcblx0ZmlsbDogUHJvcFR5cGVzLnN0cmluZyxcblx0dHlwZTogUHJvcFR5cGVzLm9uZU9mKE9iamVjdC5rZXlzKGljb25zKSksXG59O1xuSWNvbi5kZWZhdWx0UHJvcHMgPSB7XG5cdGZpbGw6ICd3aGl0ZScsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBJY29uO1xuIiwiaW1wb3J0IFJlYWN0LCB7IENvbXBvbmVudCwgUHJvcFR5cGVzIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3NzLCBTdHlsZVNoZWV0IH0gZnJvbSAnYXBocm9kaXRlL25vLWltcG9ydGFudCc7XG5cbmltcG9ydCBUaHVtYm5haWwgZnJvbSAnLi9UaHVtYm5haWwnO1xuaW1wb3J0IEFycm93IGZyb20gJy4vQXJyb3cnO1xuaW1wb3J0IHRoZW1lIGZyb20gJy4uL3RoZW1lJztcblxuY29uc3QgY2xhc3NlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKHtcblx0cGFnaW5hdGVkVGh1bWJuYWlsczoge1xuXHRcdGJvdHRvbTogdGhlbWUuY29udGFpbmVyLmd1dHRlci52ZXJ0aWNhbCxcblx0XHRoZWlnaHQ6IHRoZW1lLnRodW1ibmFpbC5zaXplLFxuXHRcdHBhZGRpbmc6ICcwIDUwcHgnLFxuXHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHRcdHRleHRBbGlnbjogJ2NlbnRlcicsXG5cdFx0d2hpdGVTcGFjZTogJ25vd3JhcCcsXG5cdH0sXG59KTtcblxuY29uc3QgYXJyb3dTdHlsZXMgPSB7XG5cdGhlaWdodDogdGhlbWUudGh1bWJuYWlsLnNpemUgKyAodGhlbWUudGh1bWJuYWlsLmd1dHRlciAqIDIpLFxuXHR3aWR0aDogNDAsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYWdpbmF0ZWRUaHVtYm5haWxzIGV4dGVuZHMgQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3IgKHByb3BzKSB7XG5cdFx0c3VwZXIocHJvcHMpO1xuXG5cdFx0dGhpcy5zdGF0ZSA9IHtcblx0XHRcdGhhc0N1c3RvbVBhZ2U6IGZhbHNlLFxuXHRcdH07XG5cblx0XHR0aGlzLmdvdG9QcmV2ID0gdGhpcy5nb3RvUHJldi5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuZ290b05leHQgPSB0aGlzLmdvdG9OZXh0LmJpbmQodGhpcyk7XG5cdH1cblx0Y29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAobmV4dFByb3BzKSB7XG5cdFx0Ly8gQ29tcG9uZW50IHNob3VsZCBiZSBjb250cm9sbGVkLCBmbHVzaCBzdGF0ZSB3aGVuIGN1cnJlbnRJbWFnZSBjaGFuZ2VzXG5cdFx0aWYgKG5leHRQcm9wcy5jdXJyZW50SW1hZ2UgIT09IHRoaXMucHJvcHMuY3VycmVudEltYWdlKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0aGFzQ3VzdG9tUGFnZTogZmFsc2UsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gTUVUSE9EU1xuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuXHRnZXRGaXJzdCAoKSB7XG5cdFx0Y29uc3QgeyBjdXJyZW50SW1hZ2UsIG9mZnNldCB9ID0gdGhpcy5wcm9wcztcblx0XHRpZiAodGhpcy5zdGF0ZS5oYXNDdXN0b21QYWdlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jbGFtcEZpcnN0KHRoaXMuc3RhdGUuZmlyc3QpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5jbGFtcEZpcnN0KGN1cnJlbnRJbWFnZSAtIG9mZnNldCk7XG5cdH1cblx0c2V0Rmlyc3QgKGV2ZW50LCBuZXdGaXJzdCkge1xuXHRcdGNvbnN0IHsgZmlyc3QgfSA9IHRoaXMuc3RhdGU7XG5cblx0XHRpZiAoZXZlbnQpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cblx0XHRpZiAoZmlyc3QgPT09IG5ld0ZpcnN0KSByZXR1cm47XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGhhc0N1c3RvbVBhZ2U6IHRydWUsXG5cdFx0XHRmaXJzdDogbmV3Rmlyc3QsXG5cdFx0fSk7XG5cdH1cblx0Z290b1ByZXYgKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRGaXJzdChldmVudCwgdGhpcy5nZXRGaXJzdCgpIC0gdGhpcy5wcm9wcy5vZmZzZXQpO1xuXHR9XG5cdGdvdG9OZXh0IChldmVudCkge1xuXHRcdHRoaXMuc2V0Rmlyc3QoZXZlbnQsIHRoaXMuZ2V0Rmlyc3QoKSArIHRoaXMucHJvcHMub2Zmc2V0KTtcblx0fVxuXHRjbGFtcEZpcnN0ICh2YWx1ZSkge1xuXHRcdGNvbnN0IHsgaW1hZ2VzLCBvZmZzZXQgfSA9IHRoaXMucHJvcHM7XG5cblx0XHRjb25zdCB0b3RhbENvdW50ID0gMiAqIG9mZnNldCArIDE7IC8vIHNob3cgJG9mZnNldCBleHRyYSB0aHVtYm5haWxzIG9uIGVhY2ggc2lkZVxuXG5cdFx0aWYgKHZhbHVlIDwgMCkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSArIHRvdGFsQ291bnQgPiBpbWFnZXMubGVuZ3RoKSB7IC8vIFRvbyBmYXJcblx0XHRcdHJldHVybiBpbWFnZXMubGVuZ3RoIC0gdG90YWxDb3VudDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQvLyBSRU5ERVJFUlNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0cmVuZGVyQXJyb3dQcmV2ICgpIHtcblx0XHRpZiAodGhpcy5nZXRGaXJzdCgpIDw9IDApIHJldHVybiBudWxsO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxBcnJvd1xuXHRcdFx0XHRkaXJlY3Rpb249XCJsZWZ0XCJcblx0XHRcdFx0c2l6ZT1cInNtYWxsXCJcblx0XHRcdFx0aWNvbj1cImFycm93TGVmdFwiXG5cdFx0XHRcdG9uQ2xpY2s9e3RoaXMuZ290b1ByZXZ9XG5cdFx0XHRcdHN0eWxlPXthcnJvd1N0eWxlc31cblx0XHRcdFx0dGl0bGU9XCJQcmV2aW91cyAoTGVmdCBhcnJvdyBrZXkpXCJcblx0XHRcdFx0dHlwZT1cImJ1dHRvblwiXG5cdFx0XHQvPlxuXHRcdCk7XG5cdH1cblx0cmVuZGVyQXJyb3dOZXh0ICgpIHtcblx0XHRjb25zdCB7IG9mZnNldCwgaW1hZ2VzIH0gPSB0aGlzLnByb3BzO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSAyICogb2Zmc2V0ICsgMTtcblx0XHRpZiAodGhpcy5nZXRGaXJzdCgpICsgdG90YWxDb3VudCA+PSBpbWFnZXMubGVuZ3RoKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8QXJyb3dcblx0XHRcdFx0ZGlyZWN0aW9uPVwicmlnaHRcIlxuXHRcdFx0XHRzaXplPVwic21hbGxcIlxuXHRcdFx0XHRpY29uPVwiYXJyb3dSaWdodFwiXG5cdFx0XHRcdG9uQ2xpY2s9e3RoaXMuZ290b05leHR9XG5cdFx0XHRcdHN0eWxlPXthcnJvd1N0eWxlc31cblx0XHRcdFx0dGl0bGU9XCJQcmV2aW91cyAoUmlnaHQgYXJyb3cga2V5KVwiXG5cdFx0XHRcdHR5cGU9XCJidXR0b25cIlxuXHRcdFx0Lz5cblx0XHQpO1xuXHR9XG5cdHJlbmRlciAoKSB7XG5cdFx0Y29uc3QgeyBpbWFnZXMsIGN1cnJlbnRJbWFnZSwgb25DbGlja1RodW1ibmFpbCwgb2Zmc2V0IH0gPSB0aGlzLnByb3BzO1xuXG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IDIgKiBvZmZzZXQgKyAxOyAvLyBzaG93ICRvZmZzZXQgZXh0cmEgdGh1bWJuYWlscyBvbiBlYWNoIHNpZGVcblx0XHRsZXQgdGh1bWJuYWlscyA9IFtdO1xuXHRcdGxldCBiYXNlT2Zmc2V0ID0gMDtcblx0XHRpZiAoaW1hZ2VzLmxlbmd0aCA8PSB0b3RhbENvdW50KSB7XG5cdFx0XHR0aHVtYm5haWxzID0gaW1hZ2VzO1xuXHRcdH0gZWxzZSB7IC8vIFRyeSB0byBjZW50ZXIgY3VycmVudCBpbWFnZSBpbiBsaXN0XG5cdFx0XHRiYXNlT2Zmc2V0ID0gdGhpcy5nZXRGaXJzdCgpO1xuXHRcdFx0dGh1bWJuYWlscyA9IGltYWdlcy5zbGljZShiYXNlT2Zmc2V0LCBiYXNlT2Zmc2V0ICsgdG90YWxDb3VudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5wYWdpbmF0ZWRUaHVtYm5haWxzKX0+XG5cdFx0XHRcdHt0aGlzLnJlbmRlckFycm93UHJldigpfVxuXHRcdFx0XHR7dGh1bWJuYWlscy5tYXAoKGltZywgaWR4KSA9PiAoXG5cdFx0XHRcdFx0PFRodW1ibmFpbCBrZXk9e2Jhc2VPZmZzZXQgKyBpZHh9XG5cdFx0XHRcdFx0XHR7Li4uaW1nfVxuXHRcdFx0XHRcdFx0aW5kZXg9e2Jhc2VPZmZzZXQgKyBpZHh9XG5cdFx0XHRcdFx0XHRvbkNsaWNrPXtvbkNsaWNrVGh1bWJuYWlsfVxuXHRcdFx0XHRcdFx0YWN0aXZlPXtiYXNlT2Zmc2V0ICsgaWR4ID09PSBjdXJyZW50SW1hZ2V9IC8+XG5cdFx0XHRcdCkpfVxuXHRcdFx0XHR7dGhpcy5yZW5kZXJBcnJvd05leHQoKX1cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn1cblxuUGFnaW5hdGVkVGh1bWJuYWlscy5wcm9wVHlwZXMgPSB7XG5cdGN1cnJlbnRJbWFnZTogUHJvcFR5cGVzLm51bWJlcixcblx0aW1hZ2VzOiBQcm9wVHlwZXMuYXJyYXksXG5cdG9mZnNldDogUHJvcFR5cGVzLm51bWJlcixcblx0b25DbGlja1RodW1ibmFpbDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbn07XG4iLCJpbXBvcnQgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBQcm9wVHlwZXMgfSBmcm9tICdyZWFjdCc7XG5cbi8vIFBhc3MgdGhlIExpZ2h0Ym94IGNvbnRleHQgdGhyb3VnaCB0byB0aGUgUG9ydGFsJ3MgZGVzY2VuZGVudHNcbi8vIFN0YWNrT3ZlcmZsb3cgZGlzY3Vzc2lvbiBodHRwOi8vZ29vLmdsL29jbHJKOVxuXG5jbGFzcyBQYXNzQ29udGV4dCBleHRlbmRzIENvbXBvbmVudCB7XG5cdGdldENoaWxkQ29udGV4dCAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuY29udGV4dDtcblx0fVxuXHRyZW5kZXIgKCkge1xuXHRcdHJldHVybiBDaGlsZHJlbi5vbmx5KHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXHR9XG59O1xuXG5QYXNzQ29udGV4dC5wcm9wVHlwZXMgPSB7XG5cdGNvbnRleHQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbn07XG5QYXNzQ29udGV4dC5jaGlsZENvbnRleHRUeXBlcyA9IHtcblx0dGhlbWU6IFByb3BUeXBlcy5vYmplY3QsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBQYXNzQ29udGV4dDtcbiIsImltcG9ydCBSZWFjdCwgeyBDb21wb25lbnQsIFByb3BUeXBlcyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBUcmFuc2l0aW9uIGZyb20gJ3JlYWN0LWFkZG9ucy1jc3MtdHJhbnNpdGlvbi1ncm91cCc7XG5pbXBvcnQgeyByZW5kZXIgfSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IFBhc3NDb250ZXh0IGZyb20gJy4vUGFzc0NvbnRleHQnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvcnRhbCBleHRlbmRzIENvbXBvbmVudCB7XG5cdGNvbnN0cnVjdG9yICgpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMucG9ydGFsRWxlbWVudCA9IG51bGw7XG5cdH1cblx0Y29tcG9uZW50RGlkTW91bnQgKCkge1xuXHRcdGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHApO1xuXHRcdHRoaXMucG9ydGFsRWxlbWVudCA9IHA7XG5cdFx0dGhpcy5jb21wb25lbnREaWRVcGRhdGUoKTtcblx0fVxuXHRjb21wb25lbnREaWRVcGRhdGUgKCkge1xuXHRcdC8vIEFuaW1hdGUgZmFkZSBvbiBtb3VudC91bm1vdW50XG5cdFx0Y29uc3QgZHVyYXRpb24gPSAyMDA7XG5cdFx0Y29uc3Qgc3R5bGVzID0gYFxuXHRcdFx0XHQuZmFkZS1lbnRlciB7IG9wYWNpdHk6IDAuMDE7IH1cblx0XHRcdFx0LmZhZGUtZW50ZXIuZmFkZS1lbnRlci1hY3RpdmUgeyBvcGFjaXR5OiAxOyB0cmFuc2l0aW9uOiBvcGFjaXR5ICR7ZHVyYXRpb259bXM7IH1cblx0XHRcdFx0LmZhZGUtbGVhdmUgeyBvcGFjaXR5OiAxOyB9XG5cdFx0XHRcdC5mYWRlLWxlYXZlLmZhZGUtbGVhdmUtYWN0aXZlIHsgb3BhY2l0eTogMC4wMTsgdHJhbnNpdGlvbjogb3BhY2l0eSAke2R1cmF0aW9ufW1zOyB9XG5cdFx0YDtcblxuXHRcdHJlbmRlcihcblx0XHRcdDxQYXNzQ29udGV4dCBjb250ZXh0PXt0aGlzLmNvbnRleHR9PlxuXHRcdFx0XHQ8ZGl2PlxuXHRcdFx0XHRcdDxzdHlsZT57c3R5bGVzfTwvc3R5bGU+XG5cdFx0XHRcdFx0PFRyYW5zaXRpb25cblx0XHRcdFx0XHRcdGNvbXBvbmVudD1cImRpdlwiXG5cdFx0XHRcdFx0XHR0cmFuc2l0aW9uTmFtZT1cImZhZGVcIlxuXHRcdFx0XHRcdFx0dHJhbnNpdGlvbkVudGVyVGltZW91dD17ZHVyYXRpb259XG5cdFx0XHRcdFx0XHR0cmFuc2l0aW9uTGVhdmVUaW1lb3V0PXtkdXJhdGlvbn1cblx0XHRcdFx0XHRcdHsuLi50aGlzLnByb3BzfVxuXHRcdFx0XHRcdC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9QYXNzQ29udGV4dD4sXG5cdFx0XHR0aGlzLnBvcnRhbEVsZW1lbnRcblx0XHQpO1xuXHR9XG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ICgpIHtcblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMucG9ydGFsRWxlbWVudCk7XG5cdH1cblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuXG5Qb3J0YWwuY29udGV4dFR5cGVzID0ge1xuXHR0aGVtZTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxufTtcbiIsImltcG9ydCBSZWFjdCwgeyBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XG5cbmxldCBsb2NrQ291bnQgPSAwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY3JvbGxMb2NrIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXHRjb21wb25lbnRXaWxsTW91bnQgKCkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuXG5cdFx0bG9ja0NvdW50Kys7XG5cdFx0aWYgKGxvY2tDb3VudCA+IDEpIHJldHVybjtcblxuXHRcdC8vXHRGSVhNRSBpT1MgaWdub3JlcyBvdmVyZmxvdyBvbiBib2R5XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHNjcm9sbEJhcldpZHRoID0gd2luZG93LmlubmVyV2lkdGggLSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuXG5cdFx0XHRjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXG5cdFx0XHR0YXJnZXQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gc2Nyb2xsQmFyV2lkdGggKyAncHgnO1xuXHRcdFx0dGFyZ2V0LnN0eWxlLm92ZXJmbG93WSA9ICdoaWRkZW4nO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignRmFpbGVkIHRvIGZpbmQgYm9keSBlbGVtZW50LiBFcnI6JywgZXJyKTtcblx0XHR9XG5cdH1cblxuXHRjb21wb25lbnRXaWxsVW5tb3VudCAoKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnIHx8IGxvY2tDb3VudCA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0bG9ja0NvdW50LS07XG5cdFx0aWYgKGxvY2tDb3VudCA+IDApIHJldHVybjsgLy8gU3RpbGwgbG9ja2VkXG5cblx0XHQvL1x0RklYTUUgaU9TIGlnbm9yZXMgb3ZlcmZsb3cgb24gYm9keVxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXG5cdFx0XHR0YXJnZXQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gJyc7XG5cdFx0XHR0YXJnZXQuc3R5bGUub3ZlcmZsb3dZID0gJyc7XG5cblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmaW5kIGJvZHkgZWxlbWVudC4gRXJyOicsIGVycik7XG5cdFx0fVxuXHR9XG5cblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNzcywgU3R5bGVTaGVldCB9IGZyb20gJ2FwaHJvZGl0ZS9uby1pbXBvcnRhbnQnO1xuXG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi4vdGhlbWUnO1xuaW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5mdW5jdGlvbiBUaHVtYm5haWwgKHsgaW5kZXgsIHNyYywgdGh1bWJuYWlsLCBhY3RpdmUsIG9uQ2xpY2sgfSwgeyB0aGVtZSB9KSB7XG5cdGNvbnN0IHVybCA9IHRodW1ibmFpbCA/IHRodW1ibmFpbCA6IHNyYztcblx0Y29uc3QgY2xhc3NlcyA9IFN0eWxlU2hlZXQuY3JlYXRlKGRlZXBNZXJnZShkZWZhdWx0U3R5bGVzLCB0aGVtZSkpO1xuXG5cdHJldHVybiAoXG5cdFx0PGRpdlxuXHRcdFx0Y2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy50aHVtYm5haWwsIGFjdGl2ZSAmJiBjbGFzc2VzLnRodW1ibmFpbF9fYWN0aXZlKX1cblx0XHRcdG9uQ2xpY2s9eyhlKSA9PiB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFxuXHRcdFx0XHRvbkNsaWNrKGluZGV4KVxuXHRcdFx0fX1cblx0XHRcdHN0eWxlPXt7IGJhY2tncm91bmRJbWFnZTogJ3VybChcIicgKyB1cmwgKyAnXCIpJyB9fVxuXHRcdC8+XG5cdCk7XG59XG5cblRodW1ibmFpbC5wcm9wVHlwZXMgPSB7XG5cdGFjdGl2ZTogUHJvcFR5cGVzLmJvb2wsXG5cdGluZGV4OiBQcm9wVHlwZXMubnVtYmVyLFxuXHRvbkNsaWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXHRzcmM6IFByb3BUeXBlcy5zdHJpbmcsXG5cdHRodW1ibmFpbDogUHJvcFR5cGVzLnN0cmluZyxcbn07XG5cblRodW1ibmFpbC5jb250ZXh0VHlwZXMgPSB7XG5cdHRoZW1lOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG59O1xuXG5jb25zdCBkZWZhdWx0U3R5bGVzID0ge1xuXHR0aHVtYm5haWw6IHtcblx0XHRiYWNrZ3JvdW5kUG9zaXRpb246ICdjZW50ZXInLFxuXHRcdGJhY2tncm91bmRTaXplOiAnY292ZXInLFxuXHRcdGJvcmRlclJhZGl1czogMixcblx0XHRib3hTaGFkb3c6ICdpbnNldCAwIDAgMCAxcHggaHNsYSgwLDAlLDEwMCUsLjIpJyxcblx0XHRjdXJzb3I6ICdwb2ludGVyJyxcblx0XHRkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcblx0XHRoZWlnaHQ6IGRlZmF1bHRzLnRodW1ibmFpbC5zaXplLFxuXHRcdG1hcmdpbjogZGVmYXVsdHMudGh1bWJuYWlsLmd1dHRlcixcblx0XHRvdmVyZmxvdzogJ2hpZGRlbicsXG5cdFx0d2lkdGg6IGRlZmF1bHRzLnRodW1ibmFpbC5zaXplLFxuXHR9LFxuXHR0aHVtYm5haWxfX2FjdGl2ZToge1xuXHRcdGJveFNoYWRvdzogYGluc2V0IDAgMCAwIDJweCAke2RlZmF1bHRzLnRodW1ibmFpbC5hY3RpdmVCb3JkZXJDb2xvcn1gLFxuXHR9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgVGh1bWJuYWlsO1xuIiwiZXhwb3J0IGRlZmF1bHQgKGZpbGwpID0+IChcblx0YDxzdmcgZmlsbD1cIiR7ZmlsbH1cIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgNTEyIDUxMlwiIHhtbDpzcGFjZT1cInByZXNlcnZlXCI+XG5cdFx0PHBhdGggZD1cIk0yMTMuNywyNTZMMjEzLjcsMjU2TDIxMy43LDI1NkwzODAuOSw4MS45YzQuMi00LjMsNC4xLTExLjQtMC4yLTE1LjhsLTI5LjktMzAuNmMtNC4zLTQuNC0xMS4zLTQuNS0xNS41LTAuMkwxMzEuMSwyNDcuOSBjLTIuMiwyLjItMy4yLDUuMi0zLDguMWMtMC4xLDMsMC45LDUuOSwzLDguMWwyMDQuMiwyMTIuN2M0LjIsNC4zLDExLjIsNC4yLDE1LjUtMC4ybDI5LjktMzAuNmM0LjMtNC40LDQuNC0xMS41LDAuMi0xNS44IEwyMTMuNywyNTZ6XCIvPlxuXHQ8L3N2Zz5gXG4pO1xuIiwiZXhwb3J0IGRlZmF1bHQgKGZpbGwpID0+IChcblx0YDxzdmcgZmlsbD1cIiR7ZmlsbH1cIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgNTEyIDUxMlwiIHhtbDpzcGFjZT1cInByZXNlcnZlXCI+XG5cdFx0PHBhdGggZD1cIk0yOTguMywyNTZMMjk4LjMsMjU2TDI5OC4zLDI1NkwxMzEuMSw4MS45Yy00LjItNC4zLTQuMS0xMS40LDAuMi0xNS44bDI5LjktMzAuNmM0LjMtNC40LDExLjMtNC41LDE1LjUtMC4ybDIwNC4yLDIxMi43IGMyLjIsMi4yLDMuMiw1LjIsMyw4LjFjMC4xLDMtMC45LDUuOS0zLDguMUwxNzYuNyw0NzYuOGMtNC4yLDQuMy0xMS4yLDQuMi0xNS41LTAuMkwxMzEuMyw0NDZjLTQuMy00LjQtNC40LTExLjUtMC4yLTE1LjggTDI5OC4zLDI1NnpcIi8+XG5cdDwvc3ZnPmBcbik7XG4iLCJleHBvcnQgZGVmYXVsdCAoZmlsbCkgPT4gKFxuXHRgPHN2ZyBmaWxsPVwiJHtmaWxsfVwiIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeD1cIjBweFwiIHk9XCIwcHhcIiB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgdmlld0JveD1cIjAgMCA1MTIgNTEyXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj5cblx0XHQ8cGF0aCBkPVwiTTQ0My42LDM4Ny4xTDMxMi40LDI1NS40bDEzMS41LTEzMGM1LjQtNS40LDUuNC0xNC4yLDAtMTkuNmwtMzcuNC0zNy42Yy0yLjYtMi42LTYuMS00LTkuOC00Yy0zLjcsMC03LjIsMS41LTkuOCw0IEwyNTYsMTk3LjhMMTI0LjksNjguM2MtMi42LTIuNi02LjEtNC05LjgtNGMtMy43LDAtNy4yLDEuNS05LjgsNEw2OCwxMDUuOWMtNS40LDUuNC01LjQsMTQuMiwwLDE5LjZsMTMxLjUsMTMwTDY4LjQsMzg3LjEgYy0yLjYsMi42LTQuMSw2LjEtNC4xLDkuOGMwLDMuNywxLjQsNy4yLDQuMSw5LjhsMzcuNCwzNy42YzIuNywyLjcsNi4yLDQuMSw5LjgsNC4xYzMuNSwwLDcuMS0xLjMsOS44LTQuMUwyNTYsMzEzLjFsMTMwLjcsMTMxLjEgYzIuNywyLjcsNi4yLDQuMSw5LjgsNC4xYzMuNSwwLDcuMS0xLjMsOS44LTQuMWwzNy40LTM3LjZjMi42LTIuNiw0LjEtNi4xLDQuMS05LjhDNDQ3LjcsMzkzLjIsNDQ2LjIsMzg5LjcsNDQzLjYsMzg3LjF6XCIvPlxuXHQ8L3N2Zz5gXG4pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGFycm93TGVmdDogcmVxdWlyZSgnLi9hcnJvd0xlZnQnKSxcblx0YXJyb3dSaWdodDogcmVxdWlyZSgnLi9hcnJvd1JpZ2h0JyksXG5cdGNsb3NlOiByZXF1aXJlKCcuL2Nsb3NlJyksXG59O1xuIiwiLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBUSEVNRVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmNvbnN0IHRoZW1lID0ge307XG5cbi8vIGNvbnRhaW5lclxudGhlbWUuY29udGFpbmVyID0ge1xuXHRiYWNrZ3JvdW5kOiAncmdiYSgwLCAwLCAwLCAwLjgpJyxcblx0Z3V0dGVyOiB7XG5cdFx0aG9yaXpvbnRhbDogMTAsXG5cdFx0dmVydGljYWw6IDEwLFxuXHR9LFxuXHR6SW5kZXg6IDIwMDEsXG59O1xuXG4vLyBoZWFkZXJcbnRoZW1lLmhlYWRlciA9IHtcblx0aGVpZ2h0OiA0MCxcbn07XG50aGVtZS5jbG9zZSA9IHtcblx0ZmlsbDogJ3doaXRlJyxcblx0aGVpZ2h0OiAyMCxcblx0d2lkdGg6IDIwLFxufTtcblxuLy8gZm9vdGVyXG50aGVtZS5mb290ZXIgPSB7XG5cdGNvbG9yOiAnd2hpdGUnLFxuXHRjb3VudDoge1xuXHRcdGNvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjc1KScsXG5cdFx0Zm9udFNpemU6ICcwLjg1ZW0nLFxuXHR9LFxuXHRoZWlnaHQ6IDQwLFxuXHRndXR0ZXI6IHtcblx0XHRob3Jpem9udGFsOiAwLFxuXHRcdHZlcnRpY2FsOiA1LFxuXHR9LFxufTtcblxuLy8gdGh1bWJuYWlsc1xudGhlbWUudGh1bWJuYWlsID0ge1xuXHRhY3RpdmVCb3JkZXJDb2xvcjogJ3doaXRlJyxcblx0c2l6ZTogNTAsXG5cdGd1dHRlcjogMixcbn07XG5cbi8vIGFycm93XG50aGVtZS5hcnJvdyA9IHtcblx0YmFja2dyb3VuZDogJ2JsYWNrJyxcblx0ZmlsbDogJ3doaXRlJyxcblx0aGVpZ2h0OiAxMjAsXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gdGhlbWU7XG4iLCIvKipcblx0QmluZCBtdWx0aXBsZSBjb21wb25lbnQgbWV0aG9kczpcblxuXHQqIEBwYXJhbSB7dGhpc30gY29udGV4dFxuXHQqIEBwYXJhbSB7QXJyYXl9IGZ1bmN0aW9uc1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdC4uLlxuXHRcdGJpbmRGdW5jdGlvbnMuY2FsbCh0aGlzLCBbJ2hhbmRsZUNsaWNrJywgJ2hhbmRsZU90aGVyJ10pO1xuXHR9XG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJpbmRGdW5jdGlvbnMgKGZ1bmN0aW9ucykge1xuXHRmdW5jdGlvbnMuZm9yRWFjaChmID0+ICh0aGlzW2ZdID0gdGhpc1tmXS5iaW5kKHRoaXMpKSk7XG59O1xuIiwiLy8gUmV0dXJuIHRydWUgaWYgd2luZG93ICsgZG9jdW1lbnRcblxubW9kdWxlLmV4cG9ydHMgPSAhIShcblx0dHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcblx0JiYgd2luZG93LmRvY3VtZW50XG5cdCYmIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50XG4pO1xuIiwiZnVuY3Rpb24gZGVlcE1lcmdlICh0YXJnZXQsIHNvdXJjZSA9IHt9KSB7XG5cdGNvbnN0IGV4dGVuZGVkID0gT2JqZWN0LmFzc2lnbih7fSwgdGFyZ2V0KTtcblxuXHRPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdGlmICh0eXBlb2Ygc291cmNlW2tleV0gIT09ICdvYmplY3QnIHx8ICFzb3VyY2Vba2V5XSkge1xuXHRcdFx0ZXh0ZW5kZWRba2V5XSA9IHNvdXJjZVtrZXldO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIXRhcmdldFtrZXldKSB7XG5cdFx0XHRcdGV4dGVuZGVkW2tleV0gPSBzb3VyY2Vba2V5XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV4dGVuZGVkW2tleV0gPSBkZWVwTWVyZ2UodGFyZ2V0W2tleV0sIHNvdXJjZVtrZXldKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdHJldHVybiBleHRlbmRlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWVwTWVyZ2U7XG4iLCJpbXBvcnQgYmluZEZ1bmN0aW9ucyBmcm9tICcuL2JpbmRGdW5jdGlvbnMnO1xuaW1wb3J0IGNhblVzZURvbSBmcm9tICcuL2NhblVzZURvbSc7XG5pbXBvcnQgZGVlcE1lcmdlIGZyb20gJy4vZGVlcE1lcmdlJztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGJpbmRGdW5jdGlvbnMsXG5cdGNhblVzZURvbSxcblx0ZGVlcE1lcmdlLFxufTtcbiIsImltcG9ydCBSZWFjdCwgeyBDb21wb25lbnQsIFByb3BUeXBlcyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNzcywgU3R5bGVTaGVldCB9IGZyb20gJ2FwaHJvZGl0ZS9uby1pbXBvcnRhbnQnO1xuaW1wb3J0IFN3aXBlYWJsZSBmcm9tICdyZWFjdC1zd2lwZWFibGUnO1xuaW1wb3J0IHtNb3Rpb24sIHNwcmluZ30gZnJvbSAncmVhY3QtbW90aW9uJztcblxuaW1wb3J0IHRoZW1lIGZyb20gJy4vdGhlbWUnO1xuaW1wb3J0IEFycm93IGZyb20gJy4vY29tcG9uZW50cy9BcnJvdyc7XG5pbXBvcnQgQ29udGFpbmVyIGZyb20gJy4vY29tcG9uZW50cy9Db250YWluZXInO1xuaW1wb3J0IEZvb3RlciBmcm9tICcuL2NvbXBvbmVudHMvRm9vdGVyJztcbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9jb21wb25lbnRzL0hlYWRlcic7XG5pbXBvcnQgUGFnaW5hdGVkVGh1bWJuYWlscyBmcm9tICcuL2NvbXBvbmVudHMvUGFnaW5hdGVkVGh1bWJuYWlscyc7XG5pbXBvcnQgUG9ydGFsIGZyb20gJy4vY29tcG9uZW50cy9Qb3J0YWwnO1xuaW1wb3J0IFNjcm9sbExvY2sgZnJvbSAnLi9jb21wb25lbnRzL1Njcm9sbExvY2snO1xuXG5pbXBvcnQgeyBiaW5kRnVuY3Rpb25zLCBjYW5Vc2VEb20gfSBmcm9tICcuL3V0aWxzJztcblxuY2xhc3MgTGlnaHRib3ggZXh0ZW5kcyBDb21wb25lbnQge1xuXHRjb25zdHJ1Y3RvciAoKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuc3RhdGUgPSB7XG5cdFx0XHRpc1N3aXBpbmdMZWZ0OiBmYWxzZSxcblx0XHRcdGlzU3dpcGluZ1JpZ2h0OiBmYWxzZSxcblx0XHRcdHN3aXBlRGVsdGFYOiAwXG5cdFx0fVxuXG5cdFx0YmluZEZ1bmN0aW9ucy5jYWxsKHRoaXMsIFtcblx0XHRcdCdnb3RvTmV4dCcsXG5cdFx0XHQnZ290b1ByZXYnLFxuXHRcdFx0J29uU3dpcGluZ0xlZnQnLFxuXHRcdFx0J29uU3dpcGluZ1JpZ2h0Jyxcblx0XHRcdCdvblN0b3BTd2lwaW5nJyxcblx0XHRcdCdvbk1vdGlvblJlc3QnLFxuXHRcdFx0J2hhbmRsZUtleWJvYXJkSW5wdXQnLFxuXHRcdF0pO1xuXHR9XG5cdGdldENoaWxkQ29udGV4dCAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLFxuXHRcdH07XG5cdH1cblx0Y29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAobmV4dFByb3BzKSB7XG5cdFx0aWYgKCFjYW5Vc2VEb20pIHJldHVybjtcblxuXHRcdC8vIHByZWxvYWQgaW1hZ2VzXG5cdFx0aWYgKG5leHRQcm9wcy5wcmVsb2FkTmV4dEltYWdlKSB7XG5cdFx0XHRjb25zdCBjdXJyZW50SW5kZXggPSB0aGlzLnByb3BzLmN1cnJlbnRJbWFnZTtcblx0XHRcdGNvbnN0IG5leHRJbmRleCA9IG5leHRQcm9wcy5jdXJyZW50SW1hZ2UgKyAxO1xuXHRcdFx0Y29uc3QgcHJldkluZGV4ID0gbmV4dFByb3BzLmN1cnJlbnRJbWFnZSAtIDE7XG5cdFx0XHRsZXQgcHJlbG9hZEluZGV4O1xuXG5cdFx0XHRpZiAoY3VycmVudEluZGV4ICYmIG5leHRQcm9wcy5jdXJyZW50SW1hZ2UgPiBjdXJyZW50SW5kZXgpIHtcblx0XHRcdFx0cHJlbG9hZEluZGV4ID0gbmV4dEluZGV4O1xuXHRcdFx0fSBlbHNlIGlmIChjdXJyZW50SW5kZXggJiYgbmV4dFByb3BzLmN1cnJlbnRJbWFnZSA8IGN1cnJlbnRJbmRleCkge1xuXHRcdFx0XHRwcmVsb2FkSW5kZXggPSBwcmV2SW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGlmIHdlIGtub3cgdGhlIHVzZXIncyBkaXJlY3Rpb24ganVzdCBnZXQgb25lIGltYWdlXG5cdFx0XHQvLyBvdGhlcndpc2UsIHRvIGJlIHNhZmUsIHdlIG5lZWQgdG8gZ3JhYiBvbmUgaW4gZWFjaCBkaXJlY3Rpb25cblx0XHRcdGlmIChwcmVsb2FkSW5kZXgpIHtcblx0XHRcdFx0dGhpcy5wcmVsb2FkSW1hZ2UocHJlbG9hZEluZGV4KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMucHJlbG9hZEltYWdlKHByZXZJbmRleCk7XG5cdFx0XHRcdHRoaXMucHJlbG9hZEltYWdlKG5leHRJbmRleCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gYWRkIGV2ZW50IGxpc3RlbmVyc1xuXHRcdGlmIChuZXh0UHJvcHMuZW5hYmxlS2V5Ym9hcmRJbnB1dCkge1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleWJvYXJkSW5wdXQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5Ym9hcmRJbnB1dCk7XG5cdFx0fVxuXHR9XG5cdGNvbXBvbmVudFdpbGxVbm1vdW50ICgpIHtcblx0XHRpZiAodGhpcy5wcm9wcy5lbmFibGVLZXlib2FyZElucHV0KSB7XG5cdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5Ym9hcmRJbnB1dCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdC8vIE1FVEhPRFNcblx0Ly8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblx0cHJlbG9hZEltYWdlIChpZHgpIHtcblx0XHRjb25zdCBpbWFnZSA9IHRoaXMucHJvcHMuaW1hZ2VzW2lkeF07XG5cblx0XHRpZiAoIWltYWdlKSByZXR1cm47XG5cblx0XHRjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdGltZy5zcmMgPSBpbWFnZS5zcmM7XG5cblx0XHRpZiAoaW1hZ2Uuc3Jjc2V0KSB7XG5cdFx0XHRpbWcuc3Jjc2V0ID0gaW1hZ2Uuc3Jjc2V0LmpvaW4oKTtcblx0XHR9XG5cdH1cblx0Z290b05leHQgKGV2ZW50KSB7XG5cdFx0aWYgKHRoaXMuaXNMYXN0SW1hZ2UoKSkgcmV0dXJuO1xuXHRcdGlmIChldmVudCkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0XHR0aGlzLnJlc2V0U3dpcGUodGhpcy5wcm9wcy5vbkNsaWNrTmV4dCk7XG5cblx0fVxuXHRnb3RvUHJldiAoZXZlbnQpIHtcblx0XHRpZiAodGhpcy5pc0ZpcnN0SW1hZ2UoKSkgcmV0dXJuO1xuXHRcdGlmIChldmVudCkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0XHR0aGlzLnJlc2V0U3dpcGUodGhpcy5wcm9wcy5vbkNsaWNrUHJldik7XG5cblx0fVxuXHRoYW5kbGVLZXlib2FyZElucHV0IChldmVudCkge1xuXHRcdGlmIChldmVudC5rZXlDb2RlID09PSAzNykge1xuXHRcdFx0dGhpcy5nb3RvUHJldihldmVudCk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM5KSB7XG5cdFx0XHR0aGlzLmdvdG9OZXh0KGV2ZW50KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcblx0XHRcdHRoaXMucHJvcHMub25DbG9zZSgpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHR9XG5cdG9uU3dpcGluZ0xlZnQgKGUsIGRlbHRhWCkge1xuXHRcdGlmICh0aGlzLmlzTGFzdEltYWdlKCkpIHJldHVybjtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzU3dpcGluZ0xlZnQ6IHRydWUsXG5cdFx0XHRpc1N3aXBpbmdSaWdodDogZmFsc2UsXG5cdFx0XHRzd2lwZURlbHRhWDogZGVsdGFYXG5cdFx0fSlcblx0fVxuXHRvblN3aXBpbmdSaWdodCAoZSwgZGVsdGFYKSB7XG5cdFx0aWYgKHRoaXMuaXNGaXJzdEltYWdlKCkpIHJldHVybjtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzU3dpcGluZ0xlZnQ6IGZhbHNlLFxuXHRcdFx0aXNTd2lwaW5nUmlnaHQ6IHRydWUsXG5cdFx0XHRzd2lwZURlbHRhWDogZGVsdGFYXG5cdFx0fSlcblx0fVxuXHRvblN0b3BTd2lwaW5nICgpIHtcblx0XHRsZXQgd2luZG93V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHN3aXBlRGVsdGFYOiB3aW5kb3dXaWR0aFxuXHRcdH0pXG5cdH1cblx0b25Nb3Rpb25SZXN0ICgpIHtcblx0XHRjb25zdCB3YXNTd2lwaW5nTGVmdCA9IHRoaXMuc3RhdGUuaXNTd2lwaW5nTGVmdDtcblx0XHRjb25zdCB3YXNTd2lwaW5nUmlnaHQgPSB0aGlzLnN0YXRlLmlzU3dpcGluZ1JpZ2h0O1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0aXNTd2lwaW5nTGVmdDogZmFsc2UsXG5cdFx0XHRpc1N3aXBpbmdSaWdodDogZmFsc2Vcblx0XHR9LCAoKSA9PiB7XG5cdFx0XHRjb25zdCBmYWtlRXZlbnQgPSB7XG5cdFx0XHRcdHByZXZlbnREZWZhdWx0OiAoKSA9PiB7fSxcblx0XHRcdFx0c3RvcFByb3BhZ2F0aW9uOiAoKSA9PiB7fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAod2FzU3dpcGluZ0xlZnQpIHtcblx0XHRcdFx0dGhpcy5nb3RvTmV4dChmYWtlRXZlbnQpXG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICh3YXNTd2lwaW5nUmlnaHQpIHtcblx0XHRcdFx0dGhpcy5nb3RvUHJldihmYWtlRXZlbnQpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXHRpc0ZpcnN0SW1hZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuY3VycmVudEltYWdlID09PSAwO1xuXHR9XG5cdGlzTGFzdEltYWdlICgpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5jdXJyZW50SW1hZ2UgPT09ICh0aGlzLnByb3BzLmltYWdlcy5sZW5ndGggLSAxKTtcblx0fVxuXHRyZXNldFN3aXBlKG9uUmVzZXQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzU3dpcGluZ0xlZnQ6IGZhbHNlLFxuXHRcdFx0aXNTd2lwaW5nUmlnaHQ6IGZhbHNlLFxuXHRcdFx0c3dpcGVEZWx0YVg6IDBcblx0XHR9LCAoKSA9PiB7IG9uUmVzZXQgPyBvblJlc2V0KCkgOiBudWxsIH0pXG5cdH1cblxuXHQvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Ly8gUkVOREVSRVJTXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cdHJlbmRlckFycm93UHJldiAoKSB7XG5cdFx0aWYgKHRoaXMucHJvcHMuY3VycmVudEltYWdlID09PSAwKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8QXJyb3dcblx0XHRcdFx0ZGlyZWN0aW9uPVwibGVmdFwiXG5cdFx0XHRcdGljb249XCJhcnJvd0xlZnRcIlxuXHRcdFx0XHRvbkNsaWNrPXt0aGlzLmdvdG9QcmV2fVxuXHRcdFx0XHR0aXRsZT1cIlByZXZpb3VzIChMZWZ0IGFycm93IGtleSlcIlxuXHRcdFx0XHR0eXBlPVwiYnV0dG9uXCJcblx0XHRcdC8+XG5cdFx0KTtcblx0fVxuXHRyZW5kZXJBcnJvd05leHQgKCkge1xuXHRcdGlmICh0aGlzLnByb3BzLmN1cnJlbnRJbWFnZSA9PT0gKHRoaXMucHJvcHMuaW1hZ2VzLmxlbmd0aCAtIDEpKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8QXJyb3dcblx0XHRcdFx0ZGlyZWN0aW9uPVwicmlnaHRcIlxuXHRcdFx0XHRpY29uPVwiYXJyb3dSaWdodFwiXG5cdFx0XHRcdG9uQ2xpY2s9e3RoaXMuZ290b05leHR9XG5cdFx0XHRcdHRpdGxlPVwiUHJldmlvdXMgKFJpZ2h0IGFycm93IGtleSlcIlxuXHRcdFx0XHR0eXBlPVwiYnV0dG9uXCJcblx0XHRcdC8+XG5cdFx0KTtcblx0fVxuXHRyZW5kZXJEaWFsb2cgKCkge1xuXHRcdGNvbnN0IHtcblx0XHRcdGJhY2tkcm9wQ2xvc2VzTW9kYWwsXG5cdFx0XHRjdXN0b21Db250cm9scyxcblx0XHRcdGlzT3Blbixcblx0XHRcdG9uQ2xvc2UsXG5cdFx0XHRzaG93Q2xvc2VCdXR0b24sXG5cdFx0XHRzaG93VGh1bWJuYWlscyxcblx0XHRcdHdpZHRoLFxuXHRcdH0gPSB0aGlzLnByb3BzO1xuXG5cdFx0aWYgKCFpc09wZW4pIHJldHVybiA8c3BhbiBrZXk9XCJjbG9zZWRcIiAvPjtcblxuXHRcdGxldCBvZmZzZXRUaHVtYm5haWxzID0gMDtcblx0XHRpZiAoc2hvd1RodW1ibmFpbHMpIHtcblx0XHRcdG9mZnNldFRodW1ibmFpbHMgPSB0aGVtZS50aHVtYm5haWwuc2l6ZSArIHRoZW1lLmNvbnRhaW5lci5ndXR0ZXIudmVydGljYWw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXJcblx0XHRcdFx0a2V5PVwib3BlblwiXG5cdFx0XHRcdG9uQ2xpY2s9eyEhYmFja2Ryb3BDbG9zZXNNb2RhbCAmJiBvbkNsb3NlfVxuXHRcdFx0XHRvblRvdWNoRW5kPXshIWJhY2tkcm9wQ2xvc2VzTW9kYWwgJiYgb25DbG9zZX1cblx0XHRcdD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2NzcyhjbGFzc2VzLmNvbnRlbnQpfSBzdHlsZT17eyBtYXJnaW5Cb3R0b206IG9mZnNldFRodW1ibmFpbHMsIG1heFdpZHRoOiB3aWR0aCB9fT5cblx0XHRcdFx0XHQ8SGVhZGVyXG5cdFx0XHRcdFx0XHRjdXN0b21Db250cm9scz17Y3VzdG9tQ29udHJvbHN9XG5cdFx0XHRcdFx0XHRvbkNsb3NlPXtvbkNsb3NlfVxuXHRcdFx0XHRcdFx0c2hvd0Nsb3NlQnV0dG9uPXtzaG93Q2xvc2VCdXR0b259XG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHR7dGhpcy5yZW5kZXJJbWFnZXMoKX1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHt0aGlzLnJlbmRlclRodW1ibmFpbHMoKX1cblx0XHRcdFx0e3RoaXMucmVuZGVyQXJyb3dQcmV2KCl9XG5cdFx0XHRcdHt0aGlzLnJlbmRlckFycm93TmV4dCgpfVxuXHRcdFx0XHQ8U2Nyb2xsTG9jayAvPlxuXHRcdFx0PC9Db250YWluZXI+XG5cdFx0KTtcblx0fVxuXHRyZW5kZXJJbWFnZXMgKCkge1xuXHRcdGNvbnN0IHtcblx0XHRcdGN1cnJlbnRJbWFnZSxcblx0XHRcdGltYWdlcyxcblx0XHRcdGltYWdlQ291bnRTZXBhcmF0b3IsXG5cdFx0XHRvbkNsaWNrSW1hZ2UsXG5cdFx0XHRzaG93SW1hZ2VDb3VudCxcblx0XHRcdHNob3dUaHVtYm5haWxzLFxuXHRcdH0gPSB0aGlzLnByb3BzO1xuXG5cdFx0aWYgKCFpbWFnZXMgfHwgIWltYWdlcy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG5cdFx0Y29uc3QgaW1hZ2UgPSBpbWFnZXNbY3VycmVudEltYWdlXTtcblxuXHRcdGxldCBpbWFnZUxlZnQ7XG5cdFx0bGV0IGltYWdlUmlnaHQ7XG5cdFx0bGV0IGRlbHRhWDtcblx0XHRsZXQgbW90aW9uU3R5bGUgPSB7IGRlbHRhWDogMCB9O1xuXHRcdGlmICh0aGlzLnN0YXRlLmlzU3dpcGluZ1JpZ2h0KSB7XG5cdFx0XHRpbWFnZUxlZnQgPSBpbWFnZXNbY3VycmVudEltYWdlIC0gMV07XG5cdFx0XHRtb3Rpb25TdHlsZSA9IHsgZGVsdGFYOiBzcHJpbmcodGhpcy5zdGF0ZS5zd2lwZURlbHRhWCkgfTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZS5pc1N3aXBpbmdMZWZ0KSB7XG5cdFx0XHRpbWFnZVJpZ2h0ID0gaW1hZ2VzW2N1cnJlbnRJbWFnZSArIDFdO1xuXHRcdFx0bW90aW9uU3R5bGUgPSB7IGRlbHRhWDogc3ByaW5nKC10aGlzLnN0YXRlLnN3aXBlRGVsdGFYKSB9O1xuXHRcdH1cblxuXHRcdGxldCBzcmNzZXQ7XG5cdFx0bGV0IHNpemVzO1xuXG5cdFx0aWYgKGltYWdlLnNyY3NldCkge1xuXHRcdFx0c3Jjc2V0ID0gaW1hZ2Uuc3Jjc2V0LmpvaW4oKTtcblx0XHRcdHNpemVzID0gJzEwMHZ3Jztcblx0XHR9XG5cblx0XHRjb25zdCB0aHVtYm5haWxzU2l6ZSA9IHNob3dUaHVtYm5haWxzID8gdGhlbWUudGh1bWJuYWlsLnNpemUgOiAwO1xuXHRcdGNvbnN0IGhlaWdodE9mZnNldCA9IGAke3RoZW1lLmhlYWRlci5oZWlnaHQgKyB0aGVtZS5mb290ZXIuaGVpZ2h0ICsgdGh1bWJuYWlsc1NpemUgKyAodGhlbWUuY29udGFpbmVyLmd1dHRlci52ZXJ0aWNhbCl9cHhgO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxmaWd1cmUgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5maWd1cmUpfT5cblx0XHRcdFx0PFN3aXBlYWJsZVxuXHRcdFx0XHRcdG9uU3dpcGVkTGVmdD17dGhpcy5vblN0b3BTd2lwaW5nfVxuXHRcdFx0XHRcdG9uU3dpcGVkUmlnaHQ9e3RoaXMub25TdG9wU3dpcGluZ31cblx0XHRcdFx0XHRvblN3aXBpbmdMZWZ0PXt0aGlzLm9uU3dpcGluZ0xlZnR9XG5cdFx0XHRcdFx0b25Td2lwaW5nUmlnaHQ9e3RoaXMub25Td2lwaW5nUmlnaHR9XG5cdFx0XHRcdD5cblxuXHRcdFx0XHRcdDxNb3Rpb25cblx0XHRcdFx0XHRcdHN0eWxlPXttb3Rpb25TdHlsZX1cblx0XHRcdFx0XHRcdG9uUmVzdD17dGhpcy5vbk1vdGlvblJlc3R9XG5cdFx0XHRcdFx0PlxuXHRcdFx0XHRcdFx0eyh7ZGVsdGFYfSkgPT4gKFxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGltYWdlTGVmdCA/XG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N1cnJlbnRJbWFnZSAtIDF9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5pbWFnZUNvbnRhaW5lcil9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgbWFyZ2luTGVmdDogLXdpbmRvdy5pbm5lcldpZHRoICsgZGVsdGFYIH19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NzcyhjbGFzc2VzLmltYWdlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemVzPXtzaXplc31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17aW1hZ2VMZWZ0LnNyY31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1NldD17aW1hZ2VMZWZ0LnNyY3NldC5qb2luKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6IHRoaXMucHJvcHMub25DbGlja0ltYWdlID8gJ3BvaW50ZXInIDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6IGBjYWxjKDEwMHZoIC0gJHtoZWlnaHRPZmZzZXR9KWAsXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8Rm9vdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uPXtpbWFnZXNbY3VycmVudEltYWdlIC0gMV0uY2FwdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50Q3VycmVudD17Y3VycmVudEltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRTZXBhcmF0b3I9e2ltYWdlQ291bnRTZXBhcmF0b3J9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFRvdGFsPXtpbWFnZXMubGVuZ3RofVxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0NvdW50PXtzaG93SW1hZ2VDb3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgOlxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGtleT17Y3VycmVudEltYWdlfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5pbWFnZUNvbnRhaW5lcil9XG4gICAgICAgICAgICAgICAgICBzdHlsZT17eyBtYXJnaW5MZWZ0OiBkZWx0YVggfX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y3NzKGNsYXNzZXMuaW1hZ2UpfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXshIW9uQ2xpY2tJbWFnZSAmJiBvbkNsaWNrSW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgIHNpemVzPXtzaXplc31cbiAgICAgICAgICAgICAgICAgICAgc3JjPXtpbWFnZS5zcmN9XG4gICAgICAgICAgICAgICAgICAgIHNyY1NldD17c3Jjc2V0fVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogdGhpcy5wcm9wcy5vbkNsaWNrSW1hZ2UgPyAncG9pbnRlcicgOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiBgY2FsYygxMDB2aCAtICR7aGVpZ2h0T2Zmc2V0fSlgLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxGb290ZXJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbj17aW1hZ2VzW2N1cnJlbnRJbWFnZV0uY2FwdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgY291bnRDdXJyZW50PXtjdXJyZW50SW1hZ2UgKyAxfVxuICAgICAgICAgICAgICAgICAgICBjb3VudFNlcGFyYXRvcj17aW1hZ2VDb3VudFNlcGFyYXRvcn1cbiAgICAgICAgICAgICAgICAgICAgY291bnRUb3RhbD17aW1hZ2VzLmxlbmd0aH1cbiAgICAgICAgICAgICAgICAgICAgc2hvd0NvdW50PXtzaG93SW1hZ2VDb3VudH1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgaW1hZ2VSaWdodCA/XG4gICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2N1cnJlbnRJbWFnZSArIDF9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjc3MoY2xhc3Nlcy5pbWFnZUNvbnRhaW5lcil9XG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgbWFyZ2luTGVmdDogd2luZG93LmlubmVyV2lkdGggKyBkZWx0YVggfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y3NzKGNsYXNzZXMuaW1hZ2UpfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZXM9e3NpemVzfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtpbWFnZVJpZ2h0LnNyY31cbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1NldD17aW1hZ2VSaWdodC5zcmNzZXQuam9pbigpfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiB0aGlzLnByb3BzLm9uQ2xpY2tJbWFnZSA/ICdwb2ludGVyJyA6ICdhdXRvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiBgY2FsYygxMDB2aCAtICR7aGVpZ2h0T2Zmc2V0fSlgLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxGb290ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb249e2ltYWdlc1tjdXJyZW50SW1hZ2UgKyAxXS5jYXB0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRDdXJyZW50PXtjdXJyZW50SW1hZ2UgKyAyfVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRTZXBhcmF0b3I9e2ltYWdlQ291bnRTZXBhcmF0b3J9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFRvdGFsPXtpbWFnZXMubGVuZ3RofVxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0NvdW50PXtzaG93SW1hZ2VDb3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgOlxuICAgICAgICAgICAgICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L2Rpdj5cblx0XHRcdFx0XHRcdCl9XG5cdFx0XHRcdFx0PC9Nb3Rpb24+XG5cdFx0XHRcdDwvU3dpcGVhYmxlPlxuXHRcdFx0PC9maWd1cmU+XG5cdFx0KTtcblx0fVxuXHRyZW5kZXJUaHVtYm5haWxzICgpIHtcblx0XHRjb25zdCB7IGltYWdlcywgY3VycmVudEltYWdlLCBvbkNsaWNrVGh1bWJuYWlsLCBzaG93VGh1bWJuYWlscywgdGh1bWJuYWlsT2Zmc2V0IH0gPSB0aGlzLnByb3BzO1xuXG5cdFx0aWYgKCFzaG93VGh1bWJuYWlscykgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxQYWdpbmF0ZWRUaHVtYm5haWxzXG5cdFx0XHRcdGN1cnJlbnRJbWFnZT17Y3VycmVudEltYWdlfVxuXHRcdFx0XHRpbWFnZXM9e2ltYWdlc31cblx0XHRcdFx0b2Zmc2V0PXt0aHVtYm5haWxPZmZzZXR9XG5cdFx0XHRcdG9uQ2xpY2tUaHVtYm5haWw9e29uQ2xpY2tUaHVtYm5haWx9XG5cdFx0XHQvPlxuXHRcdCk7XG5cdH1cblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PFBvcnRhbD5cblx0XHRcdFx0e3RoaXMucmVuZGVyRGlhbG9nKCl9XG5cdFx0XHQ8L1BvcnRhbD5cblx0XHQpO1xuXHR9XG59XG5cbkxpZ2h0Ym94LnByb3BUeXBlcyA9IHtcblx0YmFja2Ryb3BDbG9zZXNNb2RhbDogUHJvcFR5cGVzLmJvb2wsXG5cdGN1cnJlbnRJbWFnZTogUHJvcFR5cGVzLm51bWJlcixcblx0Y3VzdG9tQ29udHJvbHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5ub2RlKSxcblx0ZW5hYmxlS2V5Ym9hcmRJbnB1dDogUHJvcFR5cGVzLmJvb2wsXG5cdGltYWdlQ291bnRTZXBhcmF0b3I6IFByb3BUeXBlcy5zdHJpbmcsXG5cdGltYWdlczogUHJvcFR5cGVzLmFycmF5T2YoXG5cdFx0UHJvcFR5cGVzLnNoYXBlKHtcblx0XHRcdHNyYzogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuXHRcdFx0c3Jjc2V0OiBQcm9wVHlwZXMuYXJyYXksXG5cdFx0XHRjYXB0aW9uOiBQcm9wVHlwZXMub25lT2ZUeXBlKFtQcm9wVHlwZXMuc3RyaW5nLCBQcm9wVHlwZXMuZWxlbWVudF0pLFxuXHRcdFx0dGh1bWJuYWlsOiBQcm9wVHlwZXMuc3RyaW5nLFxuXHRcdH0pXG5cdCkuaXNSZXF1aXJlZCxcblx0aXNPcGVuOiBQcm9wVHlwZXMuYm9vbCxcblx0b25DbGlja0ltYWdlOiBQcm9wVHlwZXMuZnVuYyxcblx0b25DbGlja05leHQ6IFByb3BUeXBlcy5mdW5jLFxuXHRvbkNsaWNrUHJldjogUHJvcFR5cGVzLmZ1bmMsXG5cdG9uQ2xvc2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cdHByZWxvYWROZXh0SW1hZ2U6IFByb3BUeXBlcy5ib29sLFxuXHRzaGVldDogUHJvcFR5cGVzLm9iamVjdCxcblx0c2hvd0Nsb3NlQnV0dG9uOiBQcm9wVHlwZXMuYm9vbCxcblx0c2hvd0ltYWdlQ291bnQ6IFByb3BUeXBlcy5ib29sLFxuXHRzaG93VGh1bWJuYWlsczogUHJvcFR5cGVzLmJvb2wsXG5cdHRoZW1lOiBQcm9wVHlwZXMub2JqZWN0LFxuXHR0aHVtYm5haWxPZmZzZXQ6IFByb3BUeXBlcy5udW1iZXIsXG5cdHdpZHRoOiBQcm9wVHlwZXMubnVtYmVyLFxufTtcbkxpZ2h0Ym94LmRlZmF1bHRQcm9wcyA9IHtcblx0Y3VycmVudEltYWdlOiAwLFxuXHRlbmFibGVLZXlib2FyZElucHV0OiB0cnVlLFxuXHRpbWFnZUNvdW50U2VwYXJhdG9yOiAnIG9mICcsXG5cdG9uQ2xpY2tTaG93TmV4dEltYWdlOiB0cnVlLFxuXHRwcmVsb2FkTmV4dEltYWdlOiB0cnVlLFxuXHRzaG93Q2xvc2VCdXR0b246IHRydWUsXG5cdHNob3dJbWFnZUNvdW50OiB0cnVlLFxuXHR0aGVtZToge30sXG5cdHRodW1ibmFpbE9mZnNldDogMixcblx0d2lkdGg6IDEwMjQsXG59O1xuTGlnaHRib3guY2hpbGRDb250ZXh0VHlwZXMgPSB7XG5cdHRoZW1lOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG59O1xuXG5jb25zdCBjbGFzc2VzID0gU3R5bGVTaGVldC5jcmVhdGUoe1xuXHRjb250ZW50OiB7XG5cdFx0cG9zaXRpb246ICdyZWxhdGl2ZScsXG5cdFx0d2lkdGg6ICcxMDAlJ1xuXHR9LFxuXHRmaWd1cmU6IHtcblx0XHRtYXJnaW46IDAsIC8vIHJlbW92ZSBicm93c2VyIGRlZmF1bHRcblx0fSxcblx0aW1hZ2VDb250YWluZXI6IHtcblx0XHRwb3NpdGlvbjogJ2Fic29sdXRlJyxcblx0XHR0b3A6ICc1MCUnLFxuXHRcdGxlZnQ6ICc1MCUnLFxuXHRcdHRyYW5zZm9ybTogJ3RyYW5zbGF0ZSgtNTAlLCAtNTAlKScsXG5cdFx0d2lkdGg6ICcxMDAlJyxcbiAgICBtYXJnaW5Ub3A6IHRoZW1lLmZvb3Rlci5oZWlnaHQvMlxuXHR9LFxuXHRpbWFnZToge1xuXHRcdGRpc3BsYXk6ICdibG9jaycsIC8vIHJlbW92ZXMgYnJvd3NlciBkZWZhdWx0IGd1dHRlclxuXHRcdGhlaWdodDogJ2F1dG8nLFxuXHRcdG1hcmdpbjogJzAgYXV0bycsIC8vIG1haW50YWluIGNlbnRlciBvbiB2ZXJ5IHNob3J0IHNjcmVlbnMgT1IgdmVyeSBuYXJyb3cgaW1hZ2Vcblx0XHRtYXhXaWR0aDogJzEwMCUnLFxuXG5cdFx0Ly8gZGlzYWJsZSB1c2VyIHNlbGVjdFxuXHRcdFdlYmtpdFRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXHRcdHVzZXJTZWxlY3Q6ICdub25lJyxcblx0fSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBMaWdodGJveDtcbiJdfQ==
