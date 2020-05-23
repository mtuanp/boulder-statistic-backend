// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

// @ts-nocheck
/* eslint-disable */
let System, __instantiateAsync, __instantiate;

(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };

  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }

  __instantiateAsync = async (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExpA(m);
  };

  __instantiate = (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

"use strict";
System.register(
  "https://deno.land/x/dotenv/util",
  [],
  function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function trim(val) {
      return val.trim();
    }
    exports_1("trim", trim);
    function compact(obj) {
      return Object.keys(obj).reduce((result, key) => {
        if (obj[key]) {
          result[key] = obj[key];
        }
        return result;
      }, {});
    }
    exports_1("compact", compact);
    function difference(arrA, arrB) {
      return arrA.filter((a) => arrB.indexOf(a) < 0);
    }
    exports_1("difference", difference);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/dotenv/mod",
  ["https://deno.land/x/dotenv/util"],
  function (exports_2, context_2) {
    "use strict";
    var util_ts_1, MissingEnvVarsError;
    var __moduleName = context_2 && context_2.id;
    function parse(rawDotenv) {
      return rawDotenv.split("\n").reduce((acc, line) => {
        if (!isVariableStart(line)) {
          return acc;
        }
        let [key, ...vals] = removeSpacesAroundEquals(line).split("=");
        let value = vals.join("=");
        if (/^"/.test(value)) {
          value = expandNewlines(value);
        }
        acc[key] = util_ts_1.trim(cleanQuotes(value));
        return acc;
      }, {});
    }
    exports_2("parse", parse);
    function config(options = {}) {
      const o = Object.assign({
        path: `${Deno.cwd()}/.env`,
        export: false,
        safe: false,
        example: `${Deno.cwd()}/.env.example`,
        allowEmptyValues: false,
      }, options);
      const conf = parseFile(o.path);
      if (o.safe) {
        const confExample = parseFile(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
      }
      if (o.export) {
        for (let key in conf) {
          Deno.env.set(key, conf[key]);
        }
      }
      return conf;
    }
    exports_2("config", config);
    function parseFile(filepath) {
      return parse(
        new TextDecoder("utf-8").decode(Deno.readFileSync(filepath)),
      );
    }
    function isVariableStart(str) {
      return /^[a-zA-Z_ ]*=/.test(str);
    }
    function cleanQuotes(value = "") {
      return value.replace(/^['"]([\s\S]*)['"]$/gm, "$1");
    }
    function removeSpacesAroundEquals(str) {
      return str.replace(/( *= *)/, "=");
    }
    function expandNewlines(str) {
      return str.replace("\\n", "\n");
    }
    function assertSafe(conf, confExample, allowEmptyValues) {
      const currentEnv = Deno.env.toObject();
      // Not all the variables have to be defined in .env, they can be supplied externally
      const confWithEnv = Object.assign({}, currentEnv, conf);
      const missing = util_ts_1.difference(
        Object.keys(confExample),
        // If allowEmptyValues is false, filter out empty values from configuration
        Object.keys(
          allowEmptyValues ? confWithEnv : util_ts_1.compact(confWithEnv),
        ),
      );
      if (missing.length > 0) {
        const errorMessages = [
          `The following variables were defined in the example file but are not present in the environment:\n  ${
            missing.join(", ")
          }`,
          `Make sure to add them to your env file.`,
          !allowEmptyValues &&
          `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`,
        ];
        throw new MissingEnvVarsError(
          errorMessages.filter(Boolean).join("\n\n"),
        );
      }
    }
    return {
      setters: [
        function (util_ts_1_1) {
          util_ts_1 = util_ts_1_1;
        },
      ],
      execute: function () {
        MissingEnvVarsError = class MissingEnvVarsError extends Error {
          constructor(message) {
            super(message);
            this.name = "MissingEnvVarsError";
            Object.setPrototypeOf(this, new.target.prototype);
          }
        };
        exports_2("MissingEnvVarsError", MissingEnvVarsError);
      },
    };
  },
);
System.register(
  "https://deno.land/x/dotenv/dotenv",
  ["https://deno.land/x/dotenv/mod"],
  function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    function exportStar_1(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default") exports[n] = m[n];
      }
      exports_3(exports);
    }
    return {
      setters: [
        function (mod_ts_1_1) {
          exportStar_1(mod_ts_1_1);
        },
      ],
      execute: function () {
        console.warn(
          "Warning: In a future version loading from 'https://deno.land/x/dotenv/dotenv.ts' will be deprecated in favour of 'https://deno.land/x/dotenv/mod.ts'.",
        );
      },
    };
  },
);
System.register(
  "https://deno.land/x/dotenv/load",
  ["https://deno.land/x/dotenv/dotenv"],
  function (exports_4, context_4) {
    "use strict";
    var dotenv_ts_1;
    var __moduleName = context_4 && context_4.id;
    return {
      setters: [
        function (dotenv_ts_1_1) {
          dotenv_ts_1 = dotenv_ts_1_1;
        },
      ],
      execute: function () {
        dotenv_ts_1.config({ export: true });
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fmt/colors",
  [],
  function (exports_5, context_5) {
    "use strict";
    var noColor, enabled, ANSI_PATTERN;
    var __moduleName = context_5 && context_5.id;
    function setColorEnabled(value) {
      if (noColor) {
        return;
      }
      enabled = value;
    }
    exports_5("setColorEnabled", setColorEnabled);
    function getColorEnabled() {
      return enabled;
    }
    exports_5("getColorEnabled", getColorEnabled);
    function code(open, close) {
      return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
      };
    }
    function run(str, code) {
      return enabled
        ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
        : str;
    }
    function reset(str) {
      return run(str, code([0], 0));
    }
    exports_5("reset", reset);
    function bold(str) {
      return run(str, code([1], 22));
    }
    exports_5("bold", bold);
    function dim(str) {
      return run(str, code([2], 22));
    }
    exports_5("dim", dim);
    function italic(str) {
      return run(str, code([3], 23));
    }
    exports_5("italic", italic);
    function underline(str) {
      return run(str, code([4], 24));
    }
    exports_5("underline", underline);
    function inverse(str) {
      return run(str, code([7], 27));
    }
    exports_5("inverse", inverse);
    function hidden(str) {
      return run(str, code([8], 28));
    }
    exports_5("hidden", hidden);
    function strikethrough(str) {
      return run(str, code([9], 29));
    }
    exports_5("strikethrough", strikethrough);
    function black(str) {
      return run(str, code([30], 39));
    }
    exports_5("black", black);
    function red(str) {
      return run(str, code([31], 39));
    }
    exports_5("red", red);
    function green(str) {
      return run(str, code([32], 39));
    }
    exports_5("green", green);
    function yellow(str) {
      return run(str, code([33], 39));
    }
    exports_5("yellow", yellow);
    function blue(str) {
      return run(str, code([34], 39));
    }
    exports_5("blue", blue);
    function magenta(str) {
      return run(str, code([35], 39));
    }
    exports_5("magenta", magenta);
    function cyan(str) {
      return run(str, code([36], 39));
    }
    exports_5("cyan", cyan);
    function white(str) {
      return run(str, code([37], 39));
    }
    exports_5("white", white);
    function gray(str) {
      return run(str, code([90], 39));
    }
    exports_5("gray", gray);
    function bgBlack(str) {
      return run(str, code([40], 49));
    }
    exports_5("bgBlack", bgBlack);
    function bgRed(str) {
      return run(str, code([41], 49));
    }
    exports_5("bgRed", bgRed);
    function bgGreen(str) {
      return run(str, code([42], 49));
    }
    exports_5("bgGreen", bgGreen);
    function bgYellow(str) {
      return run(str, code([43], 49));
    }
    exports_5("bgYellow", bgYellow);
    function bgBlue(str) {
      return run(str, code([44], 49));
    }
    exports_5("bgBlue", bgBlue);
    function bgMagenta(str) {
      return run(str, code([45], 49));
    }
    exports_5("bgMagenta", bgMagenta);
    function bgCyan(str) {
      return run(str, code([46], 49));
    }
    exports_5("bgCyan", bgCyan);
    function bgWhite(str) {
      return run(str, code([47], 49));
    }
    exports_5("bgWhite", bgWhite);
    /* Special Color Sequences */
    function clampAndTruncate(n, max = 255, min = 0) {
      return Math.trunc(Math.max(Math.min(n, max), min));
    }
    /** Set text color using paletted 8bit colors.
     * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */
    function rgb8(str, color) {
      return run(str, code([38, 5, clampAndTruncate(color)], 39));
    }
    exports_5("rgb8", rgb8);
    /** Set background color using paletted 8bit colors.
     * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */
    function bgRgb8(str, color) {
      return run(str, code([48, 5, clampAndTruncate(color)], 49));
    }
    exports_5("bgRgb8", bgRgb8);
    /** Set text color using 24bit rgb.
     * `color` can be a number in range `0x000000` to `0xffffff` or
     * an `Rgb`.
     *
     * To produce the color magenta:
     *
     *      rgba24("foo", 0xff00ff);
     *      rgba24("foo", {r: 255, g: 0, b: 255});
     */
    function rgb24(str, color) {
      if (typeof color === "number") {
        return run(
          str,
          code(
            [38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
            39,
          ),
        );
      }
      return run(
        str,
        code([
          38,
          2,
          clampAndTruncate(color.r),
          clampAndTruncate(color.g),
          clampAndTruncate(color.b),
        ], 39),
      );
    }
    exports_5("rgb24", rgb24);
    /** Set background color using 24bit rgb.
     * `color` can be a number in range `0x000000` to `0xffffff` or
     * an `Rgb`.
     *
     * To produce the color magenta:
     *
     *      bgRgba24("foo", 0xff00ff);
     *      bgRgba24("foo", {r: 255, g: 0, b: 255});
     */
    function bgRgb24(str, color) {
      if (typeof color === "number") {
        return run(
          str,
          code(
            [48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
            49,
          ),
        );
      }
      return run(
        str,
        code([
          48,
          2,
          clampAndTruncate(color.r),
          clampAndTruncate(color.g),
          clampAndTruncate(color.b),
        ], 49),
      );
    }
    exports_5("bgRgb24", bgRgb24);
    function stripColor(string) {
      return string.replace(ANSI_PATTERN, "");
    }
    exports_5("stripColor", stripColor);
    return {
      setters: [],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        /**
             * A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
             * on npm.
             *
             * ```
             * import { bgBlue, red, bold } from "https://deno.land/std/fmt/colors.ts";
             * console.log(bgBlue(red(bold("Hello world!"))));
             * ```
             *
             * This module supports `NO_COLOR` environmental variable disabling any coloring
             * if `NO_COLOR` is set.
             */
        noColor = Deno.noColor;
        enabled = !noColor;
        // https://github.com/chalk/ansi-regex/blob/2b56fb0c7a07108e5b54241e8faec160d393aedb/index.js
        ANSI_PATTERN = new RegExp(
          [
            "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
            "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
          ].join("|"),
          "g",
        );
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/testing/diff",
  [],
  function (exports_6, context_6) {
    "use strict";
    var DiffType, REMOVED, COMMON, ADDED;
    var __moduleName = context_6 && context_6.id;
    function createCommon(A, B, reverse) {
      const common = [];
      if (A.length === 0 || B.length === 0) {
        return [];
      }
      for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
        if (
          A[reverse ? A.length - i - 1 : i] ===
            B[reverse ? B.length - i - 1 : i]
        ) {
          common.push(A[reverse ? A.length - i - 1 : i]);
        } else {
          return common;
        }
      }
      return common;
    }
    function diff(A, B) {
      const prefixCommon = createCommon(A, B);
      const suffixCommon = createCommon(
        A.slice(prefixCommon.length),
        B.slice(prefixCommon.length),
        true,
      ).reverse();
      A = suffixCommon.length
        ? A.slice(prefixCommon.length, -suffixCommon.length)
        : A.slice(prefixCommon.length);
      B = suffixCommon.length
        ? B.slice(prefixCommon.length, -suffixCommon.length)
        : B.slice(prefixCommon.length);
      const swapped = B.length > A.length;
      [A, B] = swapped ? [B, A] : [A, B];
      const M = A.length;
      const N = B.length;
      if (!M && !N && !suffixCommon.length && !prefixCommon.length) {
        return [];
      }
      if (!N) {
        return [
          ...prefixCommon.map((c) => ({ type: DiffType.common, value: c })),
          ...A.map((a) => ({
            type: swapped ? DiffType.added : DiffType.removed,
            value: a,
          })),
          ...suffixCommon.map((c) => ({ type: DiffType.common, value: c })),
        ];
      }
      const offset = N;
      const delta = M - N;
      const size = M + N + 1;
      const fp = new Array(size).fill({ y: -1 });
      /**
         * INFO:
         * This buffer is used to save memory and improve performance.
         * The first half is used to save route and last half is used to save diff
         * type.
         * This is because, when I kept new uint8array area to save type,performance
         * worsened.
         */
      const routes = new Uint32Array((M * N + size + 1) * 2);
      const diffTypesPtrOffset = routes.length / 2;
      let ptr = 0;
      let p = -1;
      function backTrace(A, B, current, swapped) {
        const M = A.length;
        const N = B.length;
        const result = [];
        let a = M - 1;
        let b = N - 1;
        let j = routes[current.id];
        let type = routes[current.id + diffTypesPtrOffset];
        while (true) {
          if (!j && !type) {
            break;
          }
          const prev = j;
          if (type === REMOVED) {
            result.unshift({
              type: swapped ? DiffType.removed : DiffType.added,
              value: B[b],
            });
            b -= 1;
          } else if (type === ADDED) {
            result.unshift({
              type: swapped ? DiffType.added : DiffType.removed,
              value: A[a],
            });
            a -= 1;
          } else {
            result.unshift({ type: DiffType.common, value: A[a] });
            a -= 1;
            b -= 1;
          }
          j = routes[prev];
          type = routes[prev + diffTypesPtrOffset];
        }
        return result;
      }
      function createFP(slide, down, k, M) {
        if (slide && slide.y === -1 && down && down.y === -1) {
          return { y: 0, id: 0 };
        }
        if (
          (down && down.y === -1) ||
          k === M ||
          (slide && slide.y) > (down && down.y) + 1
        ) {
          const prev = slide.id;
          ptr++;
          routes[ptr] = prev;
          routes[ptr + diffTypesPtrOffset] = ADDED;
          return { y: slide.y, id: ptr };
        } else {
          const prev = down.id;
          ptr++;
          routes[ptr] = prev;
          routes[ptr + diffTypesPtrOffset] = REMOVED;
          return { y: down.y + 1, id: ptr };
        }
      }
      function snake(k, slide, down, _offset, A, B) {
        const M = A.length;
        const N = B.length;
        if (k < -N || M < k) {
          return { y: -1, id: -1 };
        }
        const fp = createFP(slide, down, k, M);
        while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
          const prev = fp.id;
          ptr++;
          fp.id = ptr;
          fp.y += 1;
          routes[ptr] = prev;
          routes[ptr + diffTypesPtrOffset] = COMMON;
        }
        return fp;
      }
      while (fp[delta + offset].y < N) {
        p = p + 1;
        for (let k = -p; k < delta; ++k) {
          fp[k + offset] = snake(
            k,
            fp[k - 1 + offset],
            fp[k + 1 + offset],
            offset,
            A,
            B,
          );
        }
        for (let k = delta + p; k > delta; --k) {
          fp[k + offset] = snake(
            k,
            fp[k - 1 + offset],
            fp[k + 1 + offset],
            offset,
            A,
            B,
          );
        }
        fp[delta + offset] = snake(
          delta,
          fp[delta - 1 + offset],
          fp[delta + 1 + offset],
          offset,
          A,
          B,
        );
      }
      return [
        ...prefixCommon.map((c) => ({ type: DiffType.common, value: c })),
        ...backTrace(A, B, fp[delta + offset], swapped),
        ...suffixCommon.map((c) => ({ type: DiffType.common, value: c })),
      ];
    }
    exports_6("default", diff);
    return {
      setters: [],
      execute: function () {
        (function (DiffType) {
          DiffType["removed"] = "removed";
          DiffType["common"] = "common";
          DiffType["added"] = "added";
        })(DiffType || (DiffType = {}));
        exports_6("DiffType", DiffType);
        REMOVED = 1;
        COMMON = 2;
        ADDED = 3;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/testing/asserts",
  [
    "https://deno.land/std@0.53.0/fmt/colors",
    "https://deno.land/std@0.53.0/testing/diff",
  ],
  function (exports_7, context_7) {
    "use strict";
    var colors_ts_1, diff_ts_1, CAN_NOT_DISPLAY, AssertionError;
    var __moduleName = context_7 && context_7.id;
    function format(v) {
      let string = Deno.inspect(v);
      if (typeof v == "string") {
        string = `"${string.replace(/(?=["\\])/g, "\\")}"`;
      }
      return string;
    }
    function createColor(diffType) {
      switch (diffType) {
        case diff_ts_1.DiffType.added:
          return (s) => colors_ts_1.green(colors_ts_1.bold(s));
        case diff_ts_1.DiffType.removed:
          return (s) => colors_ts_1.red(colors_ts_1.bold(s));
        default:
          return colors_ts_1.white;
      }
    }
    function createSign(diffType) {
      switch (diffType) {
        case diff_ts_1.DiffType.added:
          return "+   ";
        case diff_ts_1.DiffType.removed:
          return "-   ";
        default:
          return "    ";
      }
    }
    function buildMessage(diffResult) {
      const messages = [];
      messages.push("");
      messages.push("");
      messages.push(
        `    ${colors_ts_1.gray(colors_ts_1.bold("[Diff]"))} ${
          colors_ts_1.red(colors_ts_1.bold("Actual"))
        } / ${colors_ts_1.green(colors_ts_1.bold("Expected"))}`,
      );
      messages.push("");
      messages.push("");
      diffResult.forEach((result) => {
        const c = createColor(result.type);
        messages.push(c(`${createSign(result.type)}${result.value}`));
      });
      messages.push("");
      return messages;
    }
    function isKeyedCollection(x) {
      return [Symbol.iterator, "size"].every((k) => k in x);
    }
    function equal(c, d) {
      const seen = new Map();
      return (function compare(a, b) {
        // Have to render RegExp & Date for string comparison
        // unless it's mistreated as object
        if (
          a &&
          b &&
          ((a instanceof RegExp && b instanceof RegExp) ||
            (a instanceof Date && b instanceof Date))
        ) {
          return String(a) === String(b);
        }
        if (Object.is(a, b)) {
          return true;
        }
        if (a && typeof a === "object" && b && typeof b === "object") {
          if (seen.get(a) === b) {
            return true;
          }
          if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
            return false;
          }
          if (isKeyedCollection(a) && isKeyedCollection(b)) {
            if (a.size !== b.size) {
              return false;
            }
            let unmatchedEntries = a.size;
            for (const [aKey, aValue] of a.entries()) {
              for (const [bKey, bValue] of b.entries()) {
                /* Given that Map keys can be references, we need
                             * to ensure that they are also deeply equal */
                if (
                  (aKey === aValue && bKey === bValue && compare(aKey, bKey)) ||
                  (compare(aKey, bKey) && compare(aValue, bValue))
                ) {
                  unmatchedEntries--;
                }
              }
            }
            return unmatchedEntries === 0;
          }
          const merged = { ...a, ...b };
          for (const key in merged) {
            if (!compare(a && a[key], b && b[key])) {
              return false;
            }
          }
          seen.set(a, b);
          return true;
        }
        return false;
      })(c, d);
    }
    exports_7("equal", equal);
    /** Make an assertion, if not `true`, then throw. */
    function assert(expr, msg = "") {
      if (!expr) {
        throw new AssertionError(msg);
      }
    }
    exports_7("assert", assert);
    /**
     * Make an assertion that `actual` and `expected` are equal, deeply. If not
     * deeply equal, then throw.
     */
    function assertEquals(actual, expected, msg) {
      if (equal(actual, expected)) {
        return;
      }
      let message = "";
      const actualString = format(actual);
      const expectedString = format(expected);
      try {
        const diffResult = diff_ts_1.default(
          actualString.split("\n"),
          expectedString.split("\n"),
        );
        const diffMsg = buildMessage(diffResult).join("\n");
        message = `Values are not equal:\n${diffMsg}`;
      } catch (e) {
        message = `\n${colors_ts_1.red(CAN_NOT_DISPLAY)} + \n\n`;
      }
      if (msg) {
        message = msg;
      }
      throw new AssertionError(message);
    }
    exports_7("assertEquals", assertEquals);
    /**
     * Make an assertion that `actual` and `expected` are not equal, deeply.
     * If not then throw.
     */
    function assertNotEquals(actual, expected, msg) {
      if (!equal(actual, expected)) {
        return;
      }
      let actualString;
      let expectedString;
      try {
        actualString = String(actual);
      } catch (e) {
        actualString = "[Cannot display]";
      }
      try {
        expectedString = String(expected);
      } catch (e) {
        expectedString = "[Cannot display]";
      }
      if (!msg) {
        msg = `actual: ${actualString} expected: ${expectedString}`;
      }
      throw new AssertionError(msg);
    }
    exports_7("assertNotEquals", assertNotEquals);
    /**
     * Make an assertion that `actual` and `expected` are strictly equal.  If
     * not then throw.
     */
    function assertStrictEq(actual, expected, msg) {
      if (actual === expected) {
        return;
      }
      let message;
      if (msg) {
        message = msg;
      } else {
        const actualString = format(actual);
        const expectedString = format(expected);
        if (actualString === expectedString) {
          const withOffset = actualString
            .split("\n")
            .map((l) => `     ${l}`)
            .join("\n");
          message =
            `Values have the same structure but are not reference-equal:\n\n${
              colors_ts_1.red(withOffset)
            }\n`;
        } else {
          try {
            const diffResult = diff_ts_1.default(
              actualString.split("\n"),
              expectedString.split("\n"),
            );
            const diffMsg = buildMessage(diffResult).join("\n");
            message = `Values are not strictly equal:\n${diffMsg}`;
          } catch (e) {
            message = `\n${colors_ts_1.red(CAN_NOT_DISPLAY)} + \n\n`;
          }
        }
      }
      throw new AssertionError(message);
    }
    exports_7("assertStrictEq", assertStrictEq);
    /**
     * Make an assertion that actual contains expected. If not
     * then thrown.
     */
    function assertStrContains(actual, expected, msg) {
      if (!actual.includes(expected)) {
        if (!msg) {
          msg = `actual: "${actual}" expected to contains: "${expected}"`;
        }
        throw new AssertionError(msg);
      }
    }
    exports_7("assertStrContains", assertStrContains);
    /**
     * Make an assertion that `actual` contains the `expected` values
     * If not then thrown.
     */
    function assertArrayContains(actual, expected, msg) {
      const missing = [];
      for (let i = 0; i < expected.length; i++) {
        let found = false;
        for (let j = 0; j < actual.length; j++) {
          if (equal(expected[i], actual[j])) {
            found = true;
            break;
          }
        }
        if (!found) {
          missing.push(expected[i]);
        }
      }
      if (missing.length === 0) {
        return;
      }
      if (!msg) {
        msg = `actual: "${actual}" expected to contains: "${expected}"`;
        msg += "\n";
        msg += `missing: ${missing}`;
      }
      throw new AssertionError(msg);
    }
    exports_7("assertArrayContains", assertArrayContains);
    /**
     * Make an assertion that `actual` match RegExp `expected`. If not
     * then thrown
     */
    function assertMatch(actual, expected, msg) {
      if (!expected.test(actual)) {
        if (!msg) {
          msg = `actual: "${actual}" expected to match: "${expected}"`;
        }
        throw new AssertionError(msg);
      }
    }
    exports_7("assertMatch", assertMatch);
    /**
     * Forcefully throws a failed assertion
     */
    function fail(msg) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
    }
    exports_7("fail", fail);
    /** Executes a function, expecting it to throw.  If it does not, then it
     * throws.  An error class and a string that should be included in the
     * error message can also be asserted.
     */
    function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
      let doesThrow = false;
      let error = null;
      try {
        fn();
      } catch (e) {
        if (
          ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)
        ) {
          msg =
            `Expected error to be instance of "${ErrorClass.name}", but was "${e.constructor.name}"${
              msg ? `: ${msg}` : "."
            }`;
          throw new AssertionError(msg);
        }
        if (msgIncludes && !e.message.includes(msgIncludes)) {
          msg =
            `Expected error message to include "${msgIncludes}", but got "${e.message}"${
              msg ? `: ${msg}` : "."
            }`;
          throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
      }
      if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
      }
      return error;
    }
    exports_7("assertThrows", assertThrows);
    async function assertThrowsAsync(fn, ErrorClass, msgIncludes = "", msg) {
      let doesThrow = false;
      let error = null;
      try {
        await fn();
      } catch (e) {
        if (
          ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)
        ) {
          msg =
            `Expected error to be instance of "${ErrorClass.name}", but got "${e.name}"${
              msg ? `: ${msg}` : "."
            }`;
          throw new AssertionError(msg);
        }
        if (msgIncludes && !e.message.includes(msgIncludes)) {
          msg =
            `Expected error message to include "${msgIncludes}", but got "${e.message}"${
              msg ? `: ${msg}` : "."
            }`;
          throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
      }
      if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
      }
      return error;
    }
    exports_7("assertThrowsAsync", assertThrowsAsync);
    /** Use this to stub out methods that will throw when invoked. */
    function unimplemented(msg) {
      throw new AssertionError(msg || "unimplemented");
    }
    exports_7("unimplemented", unimplemented);
    /** Use this to assert unreachable code. */
    function unreachable() {
      throw new AssertionError("unreachable");
    }
    exports_7("unreachable", unreachable);
    return {
      setters: [
        function (colors_ts_1_1) {
          colors_ts_1 = colors_ts_1_1;
        },
        function (diff_ts_1_1) {
          diff_ts_1 = diff_ts_1_1;
        },
      ],
      execute: function () {
        CAN_NOT_DISPLAY = "[Cannot display]";
        AssertionError = class AssertionError extends Error {
          constructor(message) {
            super(message);
            this.name = "AssertionError";
          }
        };
        exports_7("AssertionError", AssertionError);
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/path/interface",
  [],
  function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
System.register(
  "https://deno.land/std@0.53.0/path/_constants",
  [],
  function (exports_9, context_9) {
    "use strict";
    var build,
      CHAR_UPPERCASE_A,
      CHAR_LOWERCASE_A,
      CHAR_UPPERCASE_Z,
      CHAR_LOWERCASE_Z,
      CHAR_DOT,
      CHAR_FORWARD_SLASH,
      CHAR_BACKWARD_SLASH,
      CHAR_VERTICAL_LINE,
      CHAR_COLON,
      CHAR_QUESTION_MARK,
      CHAR_UNDERSCORE,
      CHAR_LINE_FEED,
      CHAR_CARRIAGE_RETURN,
      CHAR_TAB,
      CHAR_FORM_FEED,
      CHAR_EXCLAMATION_MARK,
      CHAR_HASH,
      CHAR_SPACE,
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE,
      CHAR_LEFT_SQUARE_BRACKET,
      CHAR_RIGHT_SQUARE_BRACKET,
      CHAR_LEFT_ANGLE_BRACKET,
      CHAR_RIGHT_ANGLE_BRACKET,
      CHAR_LEFT_CURLY_BRACKET,
      CHAR_RIGHT_CURLY_BRACKET,
      CHAR_HYPHEN_MINUS,
      CHAR_PLUS,
      CHAR_DOUBLE_QUOTE,
      CHAR_SINGLE_QUOTE,
      CHAR_PERCENT,
      CHAR_SEMICOLON,
      CHAR_CIRCUMFLEX_ACCENT,
      CHAR_GRAVE_ACCENT,
      CHAR_AT,
      CHAR_AMPERSAND,
      CHAR_EQUAL,
      CHAR_0,
      CHAR_9,
      isWindows,
      SEP,
      SEP_PATTERN;
    var __moduleName = context_9 && context_9.id;
    return {
      setters: [],
      execute: function () {
        build = Deno.build;
        // Alphabet chars.
        exports_9("CHAR_UPPERCASE_A", CHAR_UPPERCASE_A = 65); /* A */
        exports_9("CHAR_LOWERCASE_A", CHAR_LOWERCASE_A = 97); /* a */
        exports_9("CHAR_UPPERCASE_Z", CHAR_UPPERCASE_Z = 90); /* Z */
        exports_9("CHAR_LOWERCASE_Z", CHAR_LOWERCASE_Z = 122); /* z */
        // Non-alphabetic chars.
        exports_9("CHAR_DOT", CHAR_DOT = 46); /* . */
        exports_9("CHAR_FORWARD_SLASH", CHAR_FORWARD_SLASH = 47); /* / */
        exports_9("CHAR_BACKWARD_SLASH", CHAR_BACKWARD_SLASH = 92); /* \ */
        exports_9("CHAR_VERTICAL_LINE", CHAR_VERTICAL_LINE = 124); /* | */
        exports_9("CHAR_COLON", CHAR_COLON = 58); /* : */
        exports_9("CHAR_QUESTION_MARK", CHAR_QUESTION_MARK = 63); /* ? */
        exports_9("CHAR_UNDERSCORE", CHAR_UNDERSCORE = 95); /* _ */
        exports_9("CHAR_LINE_FEED", CHAR_LINE_FEED = 10); /* \n */
        exports_9("CHAR_CARRIAGE_RETURN", CHAR_CARRIAGE_RETURN = 13); /* \r */
        exports_9("CHAR_TAB", CHAR_TAB = 9); /* \t */
        exports_9("CHAR_FORM_FEED", CHAR_FORM_FEED = 12); /* \f */
        exports_9("CHAR_EXCLAMATION_MARK", CHAR_EXCLAMATION_MARK = 33); /* ! */
        exports_9("CHAR_HASH", CHAR_HASH = 35); /* # */
        exports_9("CHAR_SPACE", CHAR_SPACE = 32); /*   */
        exports_9(
          "CHAR_NO_BREAK_SPACE",
          CHAR_NO_BREAK_SPACE = 160,
        ); /* \u00A0 */
        exports_9(
          "CHAR_ZERO_WIDTH_NOBREAK_SPACE",
          CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279,
        ); /* \uFEFF */
        exports_9(
          "CHAR_LEFT_SQUARE_BRACKET",
          CHAR_LEFT_SQUARE_BRACKET = 91,
        ); /* [ */
        exports_9(
          "CHAR_RIGHT_SQUARE_BRACKET",
          CHAR_RIGHT_SQUARE_BRACKET = 93,
        ); /* ] */
        exports_9(
          "CHAR_LEFT_ANGLE_BRACKET",
          CHAR_LEFT_ANGLE_BRACKET = 60,
        ); /* < */
        exports_9(
          "CHAR_RIGHT_ANGLE_BRACKET",
          CHAR_RIGHT_ANGLE_BRACKET = 62,
        ); /* > */
        exports_9(
          "CHAR_LEFT_CURLY_BRACKET",
          CHAR_LEFT_CURLY_BRACKET = 123,
        ); /* { */
        exports_9(
          "CHAR_RIGHT_CURLY_BRACKET",
          CHAR_RIGHT_CURLY_BRACKET = 125,
        ); /* } */
        exports_9("CHAR_HYPHEN_MINUS", CHAR_HYPHEN_MINUS = 45); /* - */
        exports_9("CHAR_PLUS", CHAR_PLUS = 43); /* + */
        exports_9("CHAR_DOUBLE_QUOTE", CHAR_DOUBLE_QUOTE = 34); /* " */
        exports_9("CHAR_SINGLE_QUOTE", CHAR_SINGLE_QUOTE = 39); /* ' */
        exports_9("CHAR_PERCENT", CHAR_PERCENT = 37); /* % */
        exports_9("CHAR_SEMICOLON", CHAR_SEMICOLON = 59); /* ; */
        exports_9(
          "CHAR_CIRCUMFLEX_ACCENT",
          CHAR_CIRCUMFLEX_ACCENT = 94,
        ); /* ^ */
        exports_9("CHAR_GRAVE_ACCENT", CHAR_GRAVE_ACCENT = 96); /* ` */
        exports_9("CHAR_AT", CHAR_AT = 64); /* @ */
        exports_9("CHAR_AMPERSAND", CHAR_AMPERSAND = 38); /* & */
        exports_9("CHAR_EQUAL", CHAR_EQUAL = 61); /* = */
        // Digits
        exports_9("CHAR_0", CHAR_0 = 48); /* 0 */
        exports_9("CHAR_9", CHAR_9 = 57); /* 9 */
        isWindows = build.os == "windows";
        exports_9("SEP", SEP = isWindows ? "\\" : "/");
        exports_9("SEP_PATTERN", SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/);
      },
    };
  },
);
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
System.register(
  "https://deno.land/std@0.53.0/path/_util",
  ["https://deno.land/std@0.53.0/path/_constants"],
  function (exports_10, context_10) {
    "use strict";
    var _constants_ts_1;
    var __moduleName = context_10 && context_10.id;
    function assertPath(path) {
      if (typeof path !== "string") {
        throw new TypeError(
          `Path must be a string. Received ${JSON.stringify(path)}`,
        );
      }
    }
    exports_10("assertPath", assertPath);
    function isPosixPathSeparator(code) {
      return code === _constants_ts_1.CHAR_FORWARD_SLASH;
    }
    exports_10("isPosixPathSeparator", isPosixPathSeparator);
    function isPathSeparator(code) {
      return isPosixPathSeparator(code) ||
        code === _constants_ts_1.CHAR_BACKWARD_SLASH;
    }
    exports_10("isPathSeparator", isPathSeparator);
    function isWindowsDeviceRoot(code) {
      return ((code >= _constants_ts_1.CHAR_LOWERCASE_A &&
        code <= _constants_ts_1.CHAR_LOWERCASE_Z) ||
        (code >= _constants_ts_1.CHAR_UPPERCASE_A &&
          code <= _constants_ts_1.CHAR_UPPERCASE_Z));
    }
    exports_10("isWindowsDeviceRoot", isWindowsDeviceRoot);
    // Resolves . and .. elements in a path with directory names
    function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
      let res = "";
      let lastSegmentLength = 0;
      let lastSlash = -1;
      let dots = 0;
      let code;
      for (let i = 0, len = path.length; i <= len; ++i) {
        if (i < len) {
          code = path.charCodeAt(i);
        } else if (isPathSeparator(code)) {
          break;
        } else {
          code = _constants_ts_1.CHAR_FORWARD_SLASH;
        }
        if (isPathSeparator(code)) {
          if (lastSlash === i - 1 || dots === 1) {
            // NOOP
          } else if (lastSlash !== i - 1 && dots === 2) {
            if (
              res.length < 2 ||
              lastSegmentLength !== 2 ||
              res.charCodeAt(res.length - 1) !== _constants_ts_1.CHAR_DOT ||
              res.charCodeAt(res.length - 2) !== _constants_ts_1.CHAR_DOT
            ) {
              if (res.length > 2) {
                const lastSlashIndex = res.lastIndexOf(separator);
                if (lastSlashIndex === -1) {
                  res = "";
                  lastSegmentLength = 0;
                } else {
                  res = res.slice(0, lastSlashIndex);
                  lastSegmentLength = res.length - 1 -
                    res.lastIndexOf(separator);
                }
                lastSlash = i;
                dots = 0;
                continue;
              } else if (res.length === 2 || res.length === 1) {
                res = "";
                lastSegmentLength = 0;
                lastSlash = i;
                dots = 0;
                continue;
              }
            }
            if (allowAboveRoot) {
              if (res.length > 0) {
                res += `${separator}..`;
              } else {
                res = "..";
              }
              lastSegmentLength = 2;
            }
          } else {
            if (res.length > 0) {
              res += separator + path.slice(lastSlash + 1, i);
            } else {
              res = path.slice(lastSlash + 1, i);
            }
            lastSegmentLength = i - lastSlash - 1;
          }
          lastSlash = i;
          dots = 0;
        } else if (code === _constants_ts_1.CHAR_DOT && dots !== -1) {
          ++dots;
        } else {
          dots = -1;
        }
      }
      return res;
    }
    exports_10("normalizeString", normalizeString);
    function _format(sep, pathObject) {
      const dir = pathObject.dir || pathObject.root;
      const base = pathObject.base ||
        (pathObject.name || "") + (pathObject.ext || "");
      if (!dir) {
        return base;
      }
      if (dir === pathObject.root) {
        return dir + base;
      }
      return dir + sep + base;
    }
    exports_10("_format", _format);
    return {
      setters: [
        function (_constants_ts_1_1) {
          _constants_ts_1 = _constants_ts_1_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
System.register(
  "https://deno.land/std@0.53.0/path/win32",
  [
    "https://deno.land/std@0.53.0/path/_constants",
    "https://deno.land/std@0.53.0/path/_util",
    "https://deno.land/std@0.53.0/testing/asserts",
  ],
  function (exports_11, context_11) {
    "use strict";
    var cwd, env, _constants_ts_2, _util_ts_1, asserts_ts_1, sep, delimiter;
    var __moduleName = context_11 && context_11.id;
    function resolve(...pathSegments) {
      let resolvedDevice = "";
      let resolvedTail = "";
      let resolvedAbsolute = false;
      for (let i = pathSegments.length - 1; i >= -1; i--) {
        let path;
        if (i >= 0) {
          path = pathSegments[i];
        } else if (!resolvedDevice) {
          path = cwd();
        } else {
          // Windows has the concept of drive-specific current working
          // directories. If we've resolved a drive letter but not yet an
          // absolute path, get cwd for that drive, or the process cwd if
          // the drive cwd is not available. We're sure the device is not
          // a UNC path at this points, because UNC paths are always absolute.
          path = env.get(`=${resolvedDevice}`) || cwd();
          // Verify that a cwd was found and that it actually points
          // to our drive. If not, default to the drive's root.
          if (
            path === undefined ||
            path.slice(0, 3).toLowerCase() !==
              `${resolvedDevice.toLowerCase()}\\`
          ) {
            path = `${resolvedDevice}\\`;
          }
        }
        _util_ts_1.assertPath(path);
        const len = path.length;
        // Skip empty entries
        if (len === 0) {
          continue;
        }
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        // Try to match a root
        if (len > 1) {
          if (_util_ts_1.isPathSeparator(code)) {
            // Possible UNC root
            // If we started with a separator, we know we at least have an
            // absolute path of some kind (UNC or otherwise)
            isAbsolute = true;
            if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
              // Matched double path separator at beginning
              let j = 2;
              let last = j;
              // Match 1 or more non-path separators
              for (; j < len; ++j) {
                if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                  break;
                }
              }
              if (j < len && j !== last) {
                const firstPart = path.slice(last, j);
                // Matched!
                last = j;
                // Match 1 or more path separators
                for (; j < len; ++j) {
                  if (!_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                    break;
                  }
                }
                if (j < len && j !== last) {
                  // Matched!
                  last = j;
                  // Match 1 or more non-path separators
                  for (; j < len; ++j) {
                    if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                      break;
                    }
                  }
                  if (j === len) {
                    // We matched a UNC root only
                    device = `\\\\${firstPart}\\${path.slice(last)}`;
                    rootEnd = j;
                  } else if (j !== last) {
                    // We matched a UNC root with leftovers
                    device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                    rootEnd = j;
                  }
                }
              }
            } else {
              rootEnd = 1;
            }
          } else if (_util_ts_1.isWindowsDeviceRoot(code)) {
            // Possible device root
            if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
              device = path.slice(0, 2);
              rootEnd = 2;
              if (len > 2) {
                if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                  // Treat separator following drive name as an absolute path
                  // indicator
                  isAbsolute = true;
                  rootEnd = 3;
                }
              }
            }
          }
        } else if (_util_ts_1.isPathSeparator(code)) {
          // `path` contains just a path separator
          rootEnd = 1;
          isAbsolute = true;
        }
        if (
          device.length > 0 &&
          resolvedDevice.length > 0 &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()
        ) {
          // This path points to another device so it is not applicable
          continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
          resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
          resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
          resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) {
          break;
        }
      }
      // At this point the path should be resolved to a full absolute path,
      // but handle relative paths to be safe (might happen when process.cwd()
      // fails)
      // Normalize the tail path
      resolvedTail = _util_ts_1.normalizeString(
        resolvedTail,
        !resolvedAbsolute,
        "\\",
        _util_ts_1.isPathSeparator,
      );
      return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail ||
        ".";
    }
    exports_11("resolve", resolve);
    function normalize(path) {
      _util_ts_1.assertPath(path);
      const len = path.length;
      if (len === 0) {
        return ".";
      }
      let rootEnd = 0;
      let device;
      let isAbsolute = false;
      const code = path.charCodeAt(0);
      // Try to match a root
      if (len > 1) {
        if (_util_ts_1.isPathSeparator(code)) {
          // Possible UNC root
          // If we started with a separator, we know we at least have an absolute
          // path of some kind (UNC or otherwise)
          isAbsolute = true;
          if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
            // Matched double path separator at beginning
            let j = 2;
            let last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                break;
              }
            }
            if (j < len && j !== last) {
              const firstPart = path.slice(last, j);
              // Matched!
              last = j;
              // Match 1 or more path separators
              for (; j < len; ++j) {
                if (!_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                  break;
                }
              }
              if (j < len && j !== last) {
                // Matched!
                last = j;
                // Match 1 or more non-path separators
                for (; j < len; ++j) {
                  if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                    break;
                  }
                }
                if (j === len) {
                  // We matched a UNC root only
                  // Return the normalized version of the UNC root since there
                  // is nothing left to process
                  return `\\\\${firstPart}\\${path.slice(last)}\\`;
                } else if (j !== last) {
                  // We matched a UNC root with leftovers
                  device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                  rootEnd = j;
                }
              }
            }
          } else {
            rootEnd = 1;
          }
        } else if (_util_ts_1.isWindowsDeviceRoot(code)) {
          // Possible device root
          if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
            device = path.slice(0, 2);
            rootEnd = 2;
            if (len > 2) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                // Treat separator following drive name as an absolute path
                // indicator
                isAbsolute = true;
                rootEnd = 3;
              }
            }
          }
        }
      } else if (_util_ts_1.isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid unnecessary
        // work
        return "\\";
      }
      let tail;
      if (rootEnd < len) {
        tail = _util_ts_1.normalizeString(
          path.slice(rootEnd),
          !isAbsolute,
          "\\",
          _util_ts_1.isPathSeparator,
        );
      } else {
        tail = "";
      }
      if (tail.length === 0 && !isAbsolute) {
        tail = ".";
      }
      if (
        tail.length > 0 &&
        _util_ts_1.isPathSeparator(path.charCodeAt(len - 1))
      ) {
        tail += "\\";
      }
      if (device === undefined) {
        if (isAbsolute) {
          if (tail.length > 0) {
            return `\\${tail}`;
          } else {
            return "\\";
          }
        } else if (tail.length > 0) {
          return tail;
        } else {
          return "";
        }
      } else if (isAbsolute) {
        if (tail.length > 0) {
          return `${device}\\${tail}`;
        } else {
          return `${device}\\`;
        }
      } else if (tail.length > 0) {
        return device + tail;
      } else {
        return device;
      }
    }
    exports_11("normalize", normalize);
    function isAbsolute(path) {
      _util_ts_1.assertPath(path);
      const len = path.length;
      if (len === 0) {
        return false;
      }
      const code = path.charCodeAt(0);
      if (_util_ts_1.isPathSeparator(code)) {
        return true;
      } else if (_util_ts_1.isWindowsDeviceRoot(code)) {
        // Possible device root
        if (len > 2 && path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
          if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
            return true;
          }
        }
      }
      return false;
    }
    exports_11("isAbsolute", isAbsolute);
    function join(...paths) {
      const pathsCount = paths.length;
      if (pathsCount === 0) {
        return ".";
      }
      let joined;
      let firstPart = null;
      for (let i = 0; i < pathsCount; ++i) {
        const path = paths[i];
        _util_ts_1.assertPath(path);
        if (path.length > 0) {
          if (joined === undefined) {
            joined = firstPart = path;
          } else {
            joined += `\\${path}`;
          }
        }
      }
      if (joined === undefined) {
        return ".";
      }
      // Make sure that the joined path doesn't start with two slashes, because
      // normalize() will mistake it for an UNC path then.
      //
      // This step is skipped when it is very clear that the user actually
      // intended to point at an UNC path. This is assumed when the first
      // non-empty string arguments starts with exactly two slashes followed by
      // at least one more non-slash character.
      //
      // Note that for normalize() to treat a path as an UNC path it needs to
      // have at least 2 components, so we don't filter for that here.
      // This means that the user can use join to construct UNC paths from
      // a server name and a share name; for example:
      //   path.join('//server', 'share') -> '\\\\server\\share\\')
      let needsReplace = true;
      let slashCount = 0;
      asserts_ts_1.assert(firstPart != null);
      if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
          if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(1))) {
            ++slashCount;
            if (firstLen > 2) {
              if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(2))) {
                ++slashCount;
              } else {
                // We matched a UNC path in the first part
                needsReplace = false;
              }
            }
          }
        }
      }
      if (needsReplace) {
        // Find any more consecutive slashes we need to replace
        for (; slashCount < joined.length; ++slashCount) {
          if (!_util_ts_1.isPathSeparator(joined.charCodeAt(slashCount))) {
            break;
          }
        }
        // Replace the slashes if needed
        if (slashCount >= 2) {
          joined = `\\${joined.slice(slashCount)}`;
        }
      }
      return normalize(joined);
    }
    exports_11("join", join);
    // It will solve the relative path from `from` to `to`, for instance:
    //  from = 'C:\\orandea\\test\\aaa'
    //  to = 'C:\\orandea\\impl\\bbb'
    // The output of the function should be: '..\\..\\impl\\bbb'
    function relative(from, to) {
      _util_ts_1.assertPath(from);
      _util_ts_1.assertPath(to);
      if (from === to) {
        return "";
      }
      const fromOrig = resolve(from);
      const toOrig = resolve(to);
      if (fromOrig === toOrig) {
        return "";
      }
      from = fromOrig.toLowerCase();
      to = toOrig.toLowerCase();
      if (from === to) {
        return "";
      }
      // Trim any leading backslashes
      let fromStart = 0;
      let fromEnd = from.length;
      for (; fromStart < fromEnd; ++fromStart) {
        if (
          from.charCodeAt(fromStart) !== _constants_ts_2.CHAR_BACKWARD_SLASH
        ) {
          break;
        }
      }
      // Trim trailing backslashes (applicable to UNC paths only)
      for (; fromEnd - 1 > fromStart; --fromEnd) {
        if (
          from.charCodeAt(fromEnd - 1) !== _constants_ts_2.CHAR_BACKWARD_SLASH
        ) {
          break;
        }
      }
      const fromLen = fromEnd - fromStart;
      // Trim any leading backslashes
      let toStart = 0;
      let toEnd = to.length;
      for (; toStart < toEnd; ++toStart) {
        if (to.charCodeAt(toStart) !== _constants_ts_2.CHAR_BACKWARD_SLASH) {
          break;
        }
      }
      // Trim trailing backslashes (applicable to UNC paths only)
      for (; toEnd - 1 > toStart; --toEnd) {
        if (to.charCodeAt(toEnd - 1) !== _constants_ts_2.CHAR_BACKWARD_SLASH) {
          break;
        }
      }
      const toLen = toEnd - toStart;
      // Compare paths to find the longest common path from root
      const length = fromLen < toLen ? fromLen : toLen;
      let lastCommonSep = -1;
      let i = 0;
      for (; i <= length; ++i) {
        if (i === length) {
          if (toLen > length) {
            if (
              to.charCodeAt(toStart + i) === _constants_ts_2.CHAR_BACKWARD_SLASH
            ) {
              // We get here if `from` is the exact base path for `to`.
              // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
              return toOrig.slice(toStart + i + 1);
            } else if (i === 2) {
              // We get here if `from` is the device root.
              // For example: from='C:\\'; to='C:\\foo'
              return toOrig.slice(toStart + i);
            }
          }
          if (fromLen > length) {
            if (
              from.charCodeAt(fromStart + i) ===
                _constants_ts_2.CHAR_BACKWARD_SLASH
            ) {
              // We get here if `to` is the exact base path for `from`.
              // For example: from='C:\\foo\\bar'; to='C:\\foo'
              lastCommonSep = i;
            } else if (i === 2) {
              // We get here if `to` is the device root.
              // For example: from='C:\\foo\\bar'; to='C:\\'
              lastCommonSep = 3;
            }
          }
          break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) {
          break;
        } else if (fromCode === _constants_ts_2.CHAR_BACKWARD_SLASH) {
          lastCommonSep = i;
        }
      }
      // We found a mismatch before the first common path separator was seen, so
      // return the original `to`.
      if (i !== length && lastCommonSep === -1) {
        return toOrig;
      }
      let out = "";
      if (lastCommonSep === -1) {
        lastCommonSep = 0;
      }
      // Generate the relative path based on the path difference between `to` and
      // `from`
      for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
        if (
          i === fromEnd ||
          from.charCodeAt(i) === _constants_ts_2.CHAR_BACKWARD_SLASH
        ) {
          if (out.length === 0) {
            out += "..";
          } else {
            out += "\\..";
          }
        }
      }
      // Lastly, append the rest of the destination (`to`) path that comes after
      // the common path parts
      if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
      } else {
        toStart += lastCommonSep;
        if (
          toOrig.charCodeAt(toStart) === _constants_ts_2.CHAR_BACKWARD_SLASH
        ) {
          ++toStart;
        }
        return toOrig.slice(toStart, toEnd);
      }
    }
    exports_11("relative", relative);
    function toNamespacedPath(path) {
      // Note: this will *probably* throw somewhere.
      if (typeof path !== "string") {
        return path;
      }
      if (path.length === 0) {
        return "";
      }
      const resolvedPath = resolve(path);
      if (resolvedPath.length >= 3) {
        if (
          resolvedPath.charCodeAt(0) === _constants_ts_2.CHAR_BACKWARD_SLASH
        ) {
          // Possible UNC root
          if (
            resolvedPath.charCodeAt(1) === _constants_ts_2.CHAR_BACKWARD_SLASH
          ) {
            const code = resolvedPath.charCodeAt(2);
            if (
              code !== _constants_ts_2.CHAR_QUESTION_MARK &&
              code !== _constants_ts_2.CHAR_DOT
            ) {
              // Matched non-long UNC root, convert the path to a long UNC path
              return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
            }
          }
        } else if (_util_ts_1.isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
          // Possible device root
          if (
            resolvedPath.charCodeAt(1) === _constants_ts_2.CHAR_COLON &&
            resolvedPath.charCodeAt(2) === _constants_ts_2.CHAR_BACKWARD_SLASH
          ) {
            // Matched device root, convert the path to a long UNC path
            return `\\\\?\\${resolvedPath}`;
          }
        }
      }
      return path;
    }
    exports_11("toNamespacedPath", toNamespacedPath);
    function dirname(path) {
      _util_ts_1.assertPath(path);
      const len = path.length;
      if (len === 0) {
        return ".";
      }
      let rootEnd = -1;
      let end = -1;
      let matchedSlash = true;
      let offset = 0;
      const code = path.charCodeAt(0);
      // Try to match a root
      if (len > 1) {
        if (_util_ts_1.isPathSeparator(code)) {
          // Possible UNC root
          rootEnd = offset = 1;
          if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
            // Matched double path separator at beginning
            let j = 2;
            let last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                break;
              }
            }
            if (j < len && j !== last) {
              // Matched!
              last = j;
              // Match 1 or more path separators
              for (; j < len; ++j) {
                if (!_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                  break;
                }
              }
              if (j < len && j !== last) {
                // Matched!
                last = j;
                // Match 1 or more non-path separators
                for (; j < len; ++j) {
                  if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                    break;
                  }
                }
                if (j === len) {
                  // We matched a UNC root only
                  return path;
                }
                if (j !== last) {
                  // We matched a UNC root with leftovers
                  // Offset by 1 to include the separator after the UNC root to
                  // treat it as a "normal root" on top of a (UNC) root
                  rootEnd = offset = j + 1;
                }
              }
            }
          }
        } else if (_util_ts_1.isWindowsDeviceRoot(code)) {
          // Possible device root
          if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
            rootEnd = offset = 2;
            if (len > 2) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                rootEnd = offset = 3;
              }
            }
          }
        }
      } else if (_util_ts_1.isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid
        // unnecessary work
        return path;
      }
      for (let i = len - 1; i >= offset; --i) {
        if (_util_ts_1.isPathSeparator(path.charCodeAt(i))) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
          // We saw the first non-path separator
          matchedSlash = false;
        }
      }
      if (end === -1) {
        if (rootEnd === -1) {
          return ".";
        } else {
          end = rootEnd;
        }
      }
      return path.slice(0, end);
    }
    exports_11("dirname", dirname);
    function basename(path, ext = "") {
      if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
      }
      _util_ts_1.assertPath(path);
      let start = 0;
      let end = -1;
      let matchedSlash = true;
      let i;
      // Check for a drive letter prefix so as not to mistake the following
      // path separator as an extra separator at the end of the path that can be
      // disregarded
      if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (_util_ts_1.isWindowsDeviceRoot(drive)) {
          if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
            start = 2;
          }
        }
      }
      if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) {
          return "";
        }
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for (i = path.length - 1; i >= start; --i) {
          const code = path.charCodeAt(i);
          if (_util_ts_1.isPathSeparator(code)) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
            if (firstNonSlashEnd === -1) {
              // We saw the first non-path separator, remember this index in case
              // we need it if the extension ends up not matching
              matchedSlash = false;
              firstNonSlashEnd = i + 1;
            }
            if (extIdx >= 0) {
              // Try to match the explicit extension
              if (code === ext.charCodeAt(extIdx)) {
                if (--extIdx === -1) {
                  // We matched the extension, so mark this as the end of our path
                  // component
                  end = i;
                }
              } else {
                // Extension does not match, so our result is the entire path
                // component
                extIdx = -1;
                end = firstNonSlashEnd;
              }
            }
          }
        }
        if (start === end) {
          end = firstNonSlashEnd;
        } else if (end === -1) {
          end = path.length;
        }
        return path.slice(start, end);
      } else {
        for (i = path.length - 1; i >= start; --i) {
          if (_util_ts_1.isPathSeparator(path.charCodeAt(i))) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // path component
            matchedSlash = false;
            end = i + 1;
          }
        }
        if (end === -1) {
          return "";
        }
        return path.slice(start, end);
      }
    }
    exports_11("basename", basename);
    function extname(path) {
      _util_ts_1.assertPath(path);
      let start = 0;
      let startDot = -1;
      let startPart = 0;
      let end = -1;
      let matchedSlash = true;
      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      let preDotState = 0;
      // Check for a drive letter prefix so as not to mistake the following
      // path separator as an extra separator at the end of the path that can be
      // disregarded
      if (
        path.length >= 2 &&
        path.charCodeAt(1) === _constants_ts_2.CHAR_COLON &&
        _util_ts_1.isWindowsDeviceRoot(path.charCodeAt(0))
      ) {
        start = startPart = 2;
      }
      for (let i = path.length - 1; i >= start; --i) {
        const code = path.charCodeAt(i);
        if (_util_ts_1.isPathSeparator(code)) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === _constants_ts_2.CHAR_DOT) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) {
            startDot = i;
          } else if (preDotState !== 1) {
            preDotState = 1;
          }
        } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }
      if (
        startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 && startDot === end - 1 &&
          startDot === startPart + 1)
      ) {
        return "";
      }
      return path.slice(startDot, end);
    }
    exports_11("extname", extname);
    function format(pathObject) {
      /* eslint-disable max-len */
      if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(
          `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
        );
      }
      return _util_ts_1._format("\\", pathObject);
    }
    exports_11("format", format);
    function parse(path) {
      _util_ts_1.assertPath(path);
      const ret = { root: "", dir: "", base: "", ext: "", name: "" };
      const len = path.length;
      if (len === 0) {
        return ret;
      }
      let rootEnd = 0;
      let code = path.charCodeAt(0);
      // Try to match a root
      if (len > 1) {
        if (_util_ts_1.isPathSeparator(code)) {
          // Possible UNC root
          rootEnd = 1;
          if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
            // Matched double path separator at beginning
            let j = 2;
            let last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                break;
              }
            }
            if (j < len && j !== last) {
              // Matched!
              last = j;
              // Match 1 or more path separators
              for (; j < len; ++j) {
                if (!_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                  break;
                }
              }
              if (j < len && j !== last) {
                // Matched!
                last = j;
                // Match 1 or more non-path separators
                for (; j < len; ++j) {
                  if (_util_ts_1.isPathSeparator(path.charCodeAt(j))) {
                    break;
                  }
                }
                if (j === len) {
                  // We matched a UNC root only
                  rootEnd = j;
                } else if (j !== last) {
                  // We matched a UNC root with leftovers
                  rootEnd = j + 1;
                }
              }
            }
          }
        } else if (_util_ts_1.isWindowsDeviceRoot(code)) {
          // Possible device root
          if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
            rootEnd = 2;
            if (len > 2) {
              if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                if (len === 3) {
                  // `path` contains just a drive root, exit early to avoid
                  // unnecessary work
                  ret.root = ret.dir = path;
                  return ret;
                }
                rootEnd = 3;
              }
            } else {
              // `path` contains just a drive root, exit early to avoid
              // unnecessary work
              ret.root = ret.dir = path;
              return ret;
            }
          }
        }
      } else if (_util_ts_1.isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid
        // unnecessary work
        ret.root = ret.dir = path;
        return ret;
      }
      if (rootEnd > 0) {
        ret.root = path.slice(0, rootEnd);
      }
      let startDot = -1;
      let startPart = rootEnd;
      let end = -1;
      let matchedSlash = true;
      let i = path.length - 1;
      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      let preDotState = 0;
      // Get non-dir info
      for (; i >= rootEnd; --i) {
        code = path.charCodeAt(i);
        if (_util_ts_1.isPathSeparator(code)) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === _constants_ts_2.CHAR_DOT) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) {
            startDot = i;
          } else if (preDotState !== 1) {
            preDotState = 1;
          }
        } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }
      if (
        startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 && startDot === end - 1 &&
          startDot === startPart + 1)
      ) {
        if (end !== -1) {
          ret.base = ret.name = path.slice(startPart, end);
        }
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
      }
      // If the directory is the root, use the entire root as the `dir` including
      // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
      // trailing slash (`C:\abc\def` -> `C:\abc`).
      if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
      } else {
        ret.dir = ret.root;
      }
      return ret;
    }
    exports_11("parse", parse);
    /** Converts a file URL to a path string.
     *
     *      fromFileUrl("file:///C:/Users/foo"); // "C:\\Users\\foo"
     *      fromFileUrl("file:///home/foo"); // "\\home\\foo"
     *
     * Note that non-file URLs are treated as file URLs and irrelevant components
     * are ignored.
     */
    function fromFileUrl(url) {
      return new URL(url).pathname
        .replace(/^\/*([A-Za-z]:)(\/|$)/, "$1/")
        .replace(/\//g, "\\");
    }
    exports_11("fromFileUrl", fromFileUrl);
    return {
      setters: [
        function (_constants_ts_2_1) {
          _constants_ts_2 = _constants_ts_2_1;
        },
        function (_util_ts_1_1) {
          _util_ts_1 = _util_ts_1_1;
        },
        function (asserts_ts_1_1) {
          asserts_ts_1 = asserts_ts_1_1;
        },
      ],
      execute: function () {
        cwd = Deno.cwd, env = Deno.env;
        exports_11("sep", sep = "\\");
        exports_11("delimiter", delimiter = ";");
      },
    };
  },
);
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
System.register(
  "https://deno.land/std@0.53.0/path/posix",
  [
    "https://deno.land/std@0.53.0/path/_constants",
    "https://deno.land/std@0.53.0/path/_util",
  ],
  function (exports_12, context_12) {
    "use strict";
    var cwd, _constants_ts_3, _util_ts_2, sep, delimiter;
    var __moduleName = context_12 && context_12.id;
    // path.resolve([from ...], to)
    function resolve(...pathSegments) {
      let resolvedPath = "";
      let resolvedAbsolute = false;
      for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        let path;
        if (i >= 0) {
          path = pathSegments[i];
        } else {
          path = cwd();
        }
        _util_ts_2.assertPath(path);
        // Skip empty entries
        if (path.length === 0) {
          continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute =
          path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
      }
      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)
      // Normalize the path
      resolvedPath = _util_ts_2.normalizeString(
        resolvedPath,
        !resolvedAbsolute,
        "/",
        _util_ts_2.isPosixPathSeparator,
      );
      if (resolvedAbsolute) {
        if (resolvedPath.length > 0) {
          return `/${resolvedPath}`;
        } else {
          return "/";
        }
      } else if (resolvedPath.length > 0) {
        return resolvedPath;
      } else {
        return ".";
      }
    }
    exports_12("resolve", resolve);
    function normalize(path) {
      _util_ts_2.assertPath(path);
      if (path.length === 0) {
        return ".";
      }
      const isAbsolute =
        path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
      const trailingSeparator =
        path.charCodeAt(path.length - 1) === _constants_ts_3.CHAR_FORWARD_SLASH;
      // Normalize the path
      path = _util_ts_2.normalizeString(
        path,
        !isAbsolute,
        "/",
        _util_ts_2.isPosixPathSeparator,
      );
      if (path.length === 0 && !isAbsolute) {
        path = ".";
      }
      if (path.length > 0 && trailingSeparator) {
        path += "/";
      }
      if (isAbsolute) {
        return `/${path}`;
      }
      return path;
    }
    exports_12("normalize", normalize);
    function isAbsolute(path) {
      _util_ts_2.assertPath(path);
      return path.length > 0 &&
        path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
    }
    exports_12("isAbsolute", isAbsolute);
    function join(...paths) {
      if (paths.length === 0) {
        return ".";
      }
      let joined;
      for (let i = 0, len = paths.length; i < len; ++i) {
        const path = paths[i];
        _util_ts_2.assertPath(path);
        if (path.length > 0) {
          if (!joined) {
            joined = path;
          } else {
            joined += `/${path}`;
          }
        }
      }
      if (!joined) {
        return ".";
      }
      return normalize(joined);
    }
    exports_12("join", join);
    function relative(from, to) {
      _util_ts_2.assertPath(from);
      _util_ts_2.assertPath(to);
      if (from === to) {
        return "";
      }
      from = resolve(from);
      to = resolve(to);
      if (from === to) {
        return "";
      }
      // Trim any leading backslashes
      let fromStart = 1;
      const fromEnd = from.length;
      for (; fromStart < fromEnd; ++fromStart) {
        if (from.charCodeAt(fromStart) !== _constants_ts_3.CHAR_FORWARD_SLASH) {
          break;
        }
      }
      const fromLen = fromEnd - fromStart;
      // Trim any leading backslashes
      let toStart = 1;
      const toEnd = to.length;
      for (; toStart < toEnd; ++toStart) {
        if (to.charCodeAt(toStart) !== _constants_ts_3.CHAR_FORWARD_SLASH) {
          break;
        }
      }
      const toLen = toEnd - toStart;
      // Compare paths to find the longest common path from root
      const length = fromLen < toLen ? fromLen : toLen;
      let lastCommonSep = -1;
      let i = 0;
      for (; i <= length; ++i) {
        if (i === length) {
          if (toLen > length) {
            if (
              to.charCodeAt(toStart + i) === _constants_ts_3.CHAR_FORWARD_SLASH
            ) {
              // We get here if `from` is the exact base path for `to`.
              // For example: from='/foo/bar'; to='/foo/bar/baz'
              return to.slice(toStart + i + 1);
            } else if (i === 0) {
              // We get here if `from` is the root
              // For example: from='/'; to='/foo'
              return to.slice(toStart + i);
            }
          } else if (fromLen > length) {
            if (
              from.charCodeAt(fromStart + i) ===
                _constants_ts_3.CHAR_FORWARD_SLASH
            ) {
              // We get here if `to` is the exact base path for `from`.
              // For example: from='/foo/bar/baz'; to='/foo/bar'
              lastCommonSep = i;
            } else if (i === 0) {
              // We get here if `to` is the root.
              // For example: from='/foo'; to='/'
              lastCommonSep = 0;
            }
          }
          break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) {
          break;
        } else if (fromCode === _constants_ts_3.CHAR_FORWARD_SLASH) {
          lastCommonSep = i;
        }
      }
      let out = "";
      // Generate the relative path based on the path difference between `to`
      // and `from`
      for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
        if (
          i === fromEnd ||
          from.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH
        ) {
          if (out.length === 0) {
            out += "..";
          } else {
            out += "/..";
          }
        }
      }
      // Lastly, append the rest of the destination (`to`) path that comes after
      // the common path parts
      if (out.length > 0) {
        return out + to.slice(toStart + lastCommonSep);
      } else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === _constants_ts_3.CHAR_FORWARD_SLASH) {
          ++toStart;
        }
        return to.slice(toStart);
      }
    }
    exports_12("relative", relative);
    function toNamespacedPath(path) {
      // Non-op on posix systems
      return path;
    }
    exports_12("toNamespacedPath", toNamespacedPath);
    function dirname(path) {
      _util_ts_2.assertPath(path);
      if (path.length === 0) {
        return ".";
      }
      const hasRoot = path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
      let end = -1;
      let matchedSlash = true;
      for (let i = path.length - 1; i >= 1; --i) {
        if (path.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
          // We saw the first non-path separator
          matchedSlash = false;
        }
      }
      if (end === -1) {
        return hasRoot ? "/" : ".";
      }
      if (hasRoot && end === 1) {
        return "//";
      }
      return path.slice(0, end);
    }
    exports_12("dirname", dirname);
    function basename(path, ext = "") {
      if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
      }
      _util_ts_2.assertPath(path);
      let start = 0;
      let end = -1;
      let matchedSlash = true;
      let i;
      if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) {
          return "";
        }
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for (i = path.length - 1; i >= 0; --i) {
          const code = path.charCodeAt(i);
          if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
            if (firstNonSlashEnd === -1) {
              // We saw the first non-path separator, remember this index in case
              // we need it if the extension ends up not matching
              matchedSlash = false;
              firstNonSlashEnd = i + 1;
            }
            if (extIdx >= 0) {
              // Try to match the explicit extension
              if (code === ext.charCodeAt(extIdx)) {
                if (--extIdx === -1) {
                  // We matched the extension, so mark this as the end of our path
                  // component
                  end = i;
                }
              } else {
                // Extension does not match, so our result is the entire path
                // component
                extIdx = -1;
                end = firstNonSlashEnd;
              }
            }
          }
        }
        if (start === end) {
          end = firstNonSlashEnd;
        } else if (end === -1) {
          end = path.length;
        }
        return path.slice(start, end);
      } else {
        for (i = path.length - 1; i >= 0; --i) {
          if (path.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // path component
            matchedSlash = false;
            end = i + 1;
          }
        }
        if (end === -1) {
          return "";
        }
        return path.slice(start, end);
      }
    }
    exports_12("basename", basename);
    function extname(path) {
      _util_ts_2.assertPath(path);
      let startDot = -1;
      let startPart = 0;
      let end = -1;
      let matchedSlash = true;
      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      let preDotState = 0;
      for (let i = path.length - 1; i >= 0; --i) {
        const code = path.charCodeAt(i);
        if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === _constants_ts_3.CHAR_DOT) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) {
            startDot = i;
          } else if (preDotState !== 1) {
            preDotState = 1;
          }
        } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }
      if (
        startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 && startDot === end - 1 &&
          startDot === startPart + 1)
      ) {
        return "";
      }
      return path.slice(startDot, end);
    }
    exports_12("extname", extname);
    function format(pathObject) {
      /* eslint-disable max-len */
      if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(
          `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
        );
      }
      return _util_ts_2._format("/", pathObject);
    }
    exports_12("format", format);
    function parse(path) {
      _util_ts_2.assertPath(path);
      const ret = { root: "", dir: "", base: "", ext: "", name: "" };
      if (path.length === 0) {
        return ret;
      }
      const isAbsolute =
        path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
      let start;
      if (isAbsolute) {
        ret.root = "/";
        start = 1;
      } else {
        start = 0;
      }
      let startDot = -1;
      let startPart = 0;
      let end = -1;
      let matchedSlash = true;
      let i = path.length - 1;
      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      let preDotState = 0;
      // Get non-dir info
      for (; i >= start; --i) {
        const code = path.charCodeAt(i);
        if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === _constants_ts_3.CHAR_DOT) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) {
            startDot = i;
          } else if (preDotState !== 1) {
            preDotState = 1;
          }
        } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }
      if (
        startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 && startDot === end - 1 &&
          startDot === startPart + 1)
      ) {
        if (end !== -1) {
          if (startPart === 0 && isAbsolute) {
            ret.base = ret.name = path.slice(1, end);
          } else {
            ret.base = ret.name = path.slice(startPart, end);
          }
        }
      } else {
        if (startPart === 0 && isAbsolute) {
          ret.name = path.slice(1, startDot);
          ret.base = path.slice(1, end);
        } else {
          ret.name = path.slice(startPart, startDot);
          ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
      }
      if (startPart > 0) {
        ret.dir = path.slice(0, startPart - 1);
      } else if (isAbsolute) {
        ret.dir = "/";
      }
      return ret;
    }
    exports_12("parse", parse);
    /** Converts a file URL to a path string.
     *
     *      fromFileUrl("file:///home/foo"); // "/home/foo"
     *
     * Note that non-file URLs are treated as file URLs and irrelevant components
     * are ignored.
     */
    function fromFileUrl(url) {
      return new URL(url).pathname;
    }
    exports_12("fromFileUrl", fromFileUrl);
    return {
      setters: [
        function (_constants_ts_3_1) {
          _constants_ts_3 = _constants_ts_3_1;
        },
        function (_util_ts_2_1) {
          _util_ts_2 = _util_ts_2_1;
        },
      ],
      execute: function () {
        cwd = Deno.cwd;
        exports_12("sep", sep = "/");
        exports_12("delimiter", delimiter = ":");
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/path/separator",
  [],
  function (exports_13, context_13) {
    "use strict";
    var isWindows, SEP, SEP_PATTERN;
    var __moduleName = context_13 && context_13.id;
    return {
      setters: [],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        isWindows = Deno.build.os == "windows";
        exports_13("SEP", SEP = isWindows ? "\\" : "/");
        exports_13("SEP_PATTERN", SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/);
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std@0.53.0/path/common",
  ["https://deno.land/std@0.53.0/path/separator"],
  function (exports_14, context_14) {
    "use strict";
    var separator_ts_1;
    var __moduleName = context_14 && context_14.id;
    /** Determines the common path from a set of paths, using an optional separator,
     * which defaults to the OS default separator.
     *
     *       import { common } from "https://deno.land/std/path/mod.ts";
     *       const p = common([
     *         "./deno/std/path/mod.ts",
     *         "./deno/std/fs/mod.ts",
     *       ]);
     *       console.log(p); // "./deno/std/"
     *
     */
    function common(paths, sep = separator_ts_1.SEP) {
      const [first = "", ...remaining] = paths;
      if (first === "" || remaining.length === 0) {
        return first.substring(0, first.lastIndexOf(sep) + 1);
      }
      const parts = first.split(sep);
      let endOfPrefix = parts.length;
      for (const path of remaining) {
        const compare = path.split(sep);
        for (let i = 0; i < endOfPrefix; i++) {
          if (compare[i] !== parts[i]) {
            endOfPrefix = i;
          }
        }
        if (endOfPrefix === 0) {
          return "";
        }
      }
      const prefix = parts.slice(0, endOfPrefix).join(sep);
      return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
    }
    exports_14("common", common);
    return {
      setters: [
        function (separator_ts_1_1) {
          separator_ts_1 = separator_ts_1_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
// This file is ported from globrex@0.1.2
// MIT License
// Copyright (c) 2018 Terkel Gjervig Nielsen
System.register(
  "https://deno.land/std@0.53.0/path/_globrex",
  [],
  function (exports_15, context_15) {
    "use strict";
    var isWin,
      SEP,
      SEP_ESC,
      SEP_RAW,
      GLOBSTAR,
      WILDCARD,
      GLOBSTAR_SEGMENT,
      WILDCARD_SEGMENT;
    var __moduleName = context_15 && context_15.id;
    /**
     * Convert any glob pattern to a JavaScript Regexp object
     * @param glob Glob pattern to convert
     * @param opts Configuration object
     * @returns Converted object with string, segments and RegExp object
     */
    function globrex(
      glob,
      {
        extended = false,
        globstar = false,
        strict = false,
        filepath = false,
        flags = "",
      } = {},
    ) {
      const sepPattern = new RegExp(`^${SEP}${strict ? "" : "+"}$`);
      let regex = "";
      let segment = "";
      let pathRegexStr = "";
      const pathSegments = [];
      // If we are doing extended matching, this boolean is true when we are inside
      // a group (eg {*.html,*.js}), and false otherwise.
      let inGroup = false;
      let inRange = false;
      // extglob stack. Keep track of scope
      const ext = [];
      // Helper function to build string and segments
      function add(str, options = { split: false, last: false, only: "" }) {
        const { split, last, only } = options;
        if (only !== "path") {
          regex += str;
        }
        if (filepath && only !== "regex") {
          pathRegexStr += str.match(sepPattern) ? SEP : str;
          if (split) {
            if (last) {
              segment += str;
            }
            if (segment !== "") {
              // change it 'includes'
              if (!flags.includes("g")) {
                segment = `^${segment}$`;
              }
              pathSegments.push(new RegExp(segment, flags));
            }
            segment = "";
          } else {
            segment += str;
          }
        }
      }
      let c, n;
      for (let i = 0; i < glob.length; i++) {
        c = glob[i];
        n = glob[i + 1];
        if (["\\", "$", "^", ".", "="].includes(c)) {
          add(`\\${c}`);
          continue;
        }
        if (c.match(sepPattern)) {
          add(SEP, { split: true });
          if (n != null && n.match(sepPattern) && !strict) {
            regex += "?";
          }
          continue;
        }
        if (c === "(") {
          if (ext.length) {
            add(`${c}?:`);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === ")") {
          if (ext.length) {
            add(c);
            const type = ext.pop();
            if (type === "@") {
              add("{1}");
            } else if (type === "!") {
              add(WILDCARD);
            } else {
              add(type);
            }
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "|") {
          if (ext.length) {
            add(c);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "+") {
          if (n === "(" && extended) {
            ext.push(c);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "@" && extended) {
          if (n === "(") {
            ext.push(c);
            continue;
          }
        }
        if (c === "!") {
          if (extended) {
            if (inRange) {
              add("^");
              continue;
            }
            if (n === "(") {
              ext.push(c);
              add("(?!");
              i++;
              continue;
            }
            add(`\\${c}`);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "?") {
          if (extended) {
            if (n === "(") {
              ext.push(c);
            } else {
              add(".");
            }
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "[") {
          if (inRange && n === ":") {
            i++; // skip [
            let value = "";
            while (glob[++i] !== ":") {
              value += glob[i];
            }
            if (value === "alnum") {
              add("(?:\\w|\\d)");
            } else if (value === "space") {
              add("\\s");
            } else if (value === "digit") {
              add("\\d");
            }
            i++; // skip last ]
            continue;
          }
          if (extended) {
            inRange = true;
            add(c);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "]") {
          if (extended) {
            inRange = false;
            add(c);
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "{") {
          if (extended) {
            inGroup = true;
            add("(?:");
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "}") {
          if (extended) {
            inGroup = false;
            add(")");
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === ",") {
          if (inGroup) {
            add("|");
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        if (c === "*") {
          if (n === "(" && extended) {
            ext.push(c);
            continue;
          }
          // Move over all consecutive "*"'s.
          // Also store the previous and next characters
          const prevChar = glob[i - 1];
          let starCount = 1;
          while (glob[i + 1] === "*") {
            starCount++;
            i++;
          }
          const nextChar = glob[i + 1];
          if (!globstar) {
            // globstar is disabled, so treat any number of "*" as one
            add(".*");
          } else {
            // globstar is enabled, so determine if this is a globstar segment
            const isGlobstar = starCount > 1 && // multiple "*"'s
              // from the start of the segment
              [SEP_RAW, "/", undefined].includes(prevChar) &&
              // to the end of the segment
              [SEP_RAW, "/", undefined].includes(nextChar);
            if (isGlobstar) {
              // it's a globstar, so match zero or more path segments
              add(GLOBSTAR, { only: "regex" });
              add(GLOBSTAR_SEGMENT, { only: "path", last: true, split: true });
              i++; // move over the "/"
            } else {
              // it's not a globstar, so only match one path segment
              add(WILDCARD, { only: "regex" });
              add(WILDCARD_SEGMENT, { only: "path" });
            }
          }
          continue;
        }
        add(c);
      }
      // When regexp 'g' flag is specified don't
      // constrain the regular expression with ^ & $
      if (!flags.includes("g")) {
        regex = `^${regex}$`;
        segment = `^${segment}$`;
        if (filepath) {
          pathRegexStr = `^${pathRegexStr}$`;
        }
      }
      const result = { regex: new RegExp(regex, flags) };
      // Push the last segment
      if (filepath) {
        pathSegments.push(new RegExp(segment, flags));
        result.path = {
          regex: new RegExp(pathRegexStr, flags),
          segments: pathSegments,
          globstar: new RegExp(
            !flags.includes("g") ? `^${GLOBSTAR_SEGMENT}$` : GLOBSTAR_SEGMENT,
            flags,
          ),
        };
      }
      return result;
    }
    exports_15("globrex", globrex);
    return {
      setters: [],
      execute: function () {
        isWin = Deno.build.os === "windows";
        SEP = isWin ? `(?:\\\\|\\/)` : `\\/`;
        SEP_ESC = isWin ? `\\\\` : `/`;
        SEP_RAW = isWin ? `\\` : `/`;
        GLOBSTAR = `(?:(?:[^${SEP_ESC}/]*(?:${SEP_ESC}|\/|$))*)`;
        WILDCARD = `(?:[^${SEP_ESC}/]*)`;
        GLOBSTAR_SEGMENT = `((?:[^${SEP_ESC}/]*(?:${SEP_ESC}|\/|$))*)`;
        WILDCARD_SEGMENT = `(?:[^${SEP_ESC}/]*)`;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/path/glob",
  [
    "https://deno.land/std@0.53.0/path/separator",
    "https://deno.land/std@0.53.0/path/_globrex",
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/testing/asserts",
  ],
  function (exports_16, context_16) {
    "use strict";
    var separator_ts_2, _globrex_ts_1, mod_ts_2, asserts_ts_2;
    var __moduleName = context_16 && context_16.id;
    /**
     * Generate a regex based on glob pattern and options
     * This was meant to be using the the `fs.walk` function
     * but can be used anywhere else.
     * Examples:
     *
     *     Looking for all the `ts` files:
     *     walkSync(".", {
     *       match: [globToRegExp("*.ts")]
     *     })
     *
     *     Looking for all the `.json` files in any subfolder:
     *     walkSync(".", {
     *       match: [globToRegExp(join("a", "**", "*.json"),{
     *         flags: "g",
     *         extended: true,
     *         globstar: true
     *       })]
     *     })
     *
     * @param glob - Glob pattern to be used
     * @param options - Specific options for the glob pattern
     * @returns A RegExp for the glob pattern
     */
    function globToRegExp(glob, { extended = false, globstar = true } = {}) {
      const result = _globrex_ts_1.globrex(glob, {
        extended,
        globstar,
        strict: false,
        filepath: true,
      });
      asserts_ts_2.assert(result.path != null);
      return result.path.regex;
    }
    exports_16("globToRegExp", globToRegExp);
    /** Test whether the given string is a glob */
    function isGlob(str) {
      const chars = { "{": "}", "(": ")", "[": "]" };
      /* eslint-disable-next-line max-len */
      const regex =
        /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
      if (str === "") {
        return false;
      }
      let match;
      while ((match = regex.exec(str))) {
        if (match[2]) {
          return true;
        }
        let idx = match.index + match[0].length;
        // if an open bracket/brace/paren is escaped,
        // set the index to the next closing character
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
          const n = str.indexOf(close, idx);
          if (n !== -1) {
            idx = n + 1;
          }
        }
        str = str.slice(idx);
      }
      return false;
    }
    exports_16("isGlob", isGlob);
    /** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */
    function normalizeGlob(glob, { globstar = false } = {}) {
      if (!!glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
      }
      if (!globstar) {
        return mod_ts_2.normalize(glob);
      }
      const s = separator_ts_2.SEP_PATTERN.source;
      const badParentPattern = new RegExp(
        `(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`,
        "g",
      );
      return mod_ts_2.normalize(glob.replace(badParentPattern, "\0")).replace(
        /\0/g,
        "..",
      );
    }
    exports_16("normalizeGlob", normalizeGlob);
    /** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */
    function joinGlobs(globs, { extended = false, globstar = false } = {}) {
      if (!globstar || globs.length == 0) {
        return mod_ts_2.join(...globs);
      }
      if (globs.length === 0) {
        return ".";
      }
      let joined;
      for (const glob of globs) {
        const path = glob;
        if (path.length > 0) {
          if (!joined) {
            joined = path;
          } else {
            joined += `${separator_ts_2.SEP}${path}`;
          }
        }
      }
      if (!joined) {
        return ".";
      }
      return normalizeGlob(joined, { extended, globstar });
    }
    exports_16("joinGlobs", joinGlobs);
    return {
      setters: [
        function (separator_ts_2_1) {
          separator_ts_2 = separator_ts_2_1;
        },
        function (_globrex_ts_1_1) {
          _globrex_ts_1 = _globrex_ts_1_1;
        },
        function (mod_ts_2_1) {
          mod_ts_2 = mod_ts_2_1;
        },
        function (asserts_ts_2_1) {
          asserts_ts_2 = asserts_ts_2_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
System.register(
  "https://deno.land/std@0.53.0/path/mod",
  [
    "https://deno.land/std@0.53.0/path/win32",
    "https://deno.land/std@0.53.0/path/posix",
    "https://deno.land/std@0.53.0/path/common",
    "https://deno.land/std@0.53.0/path/separator",
    "https://deno.land/std@0.53.0/path/interface",
    "https://deno.land/std@0.53.0/path/glob",
  ],
  function (exports_17, context_17) {
    "use strict";
    var _win32,
      _posix,
      isWindows,
      path,
      win32,
      posix,
      basename,
      delimiter,
      dirname,
      extname,
      format,
      fromFileUrl,
      isAbsolute,
      join,
      normalize,
      parse,
      relative,
      resolve,
      sep,
      toNamespacedPath;
    var __moduleName = context_17 && context_17.id;
    var exportedNames_1 = {
      "win32": true,
      "posix": true,
      "basename": true,
      "delimiter": true,
      "dirname": true,
      "extname": true,
      "format": true,
      "fromFileUrl": true,
      "isAbsolute": true,
      "join": true,
      "normalize": true,
      "parse": true,
      "relative": true,
      "resolve": true,
      "sep": true,
      "toNamespacedPath": true,
      "SEP": true,
      "SEP_PATTERN": true,
    };
    function exportStar_2(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default" && !exportedNames_1.hasOwnProperty(n)) {
          exports[n] = m[n];
        }
      }
      exports_17(exports);
    }
    return {
      setters: [
        function (_win32_1) {
          _win32 = _win32_1;
        },
        function (_posix_1) {
          _posix = _posix_1;
        },
        function (common_ts_1_1) {
          exportStar_2(common_ts_1_1);
        },
        function (separator_ts_3_1) {
          exports_17({
            "SEP": separator_ts_3_1["SEP"],
            "SEP_PATTERN": separator_ts_3_1["SEP_PATTERN"],
          });
        },
        function (interface_ts_1_1) {
          exportStar_2(interface_ts_1_1);
        },
        function (glob_ts_1_1) {
          exportStar_2(glob_ts_1_1);
        },
      ],
      execute: function () {
        isWindows = Deno.build.os == "windows";
        path = isWindows ? _win32 : _posix;
        exports_17("win32", win32 = _win32);
        exports_17("posix", posix = _posix);
        exports_17("basename", basename = path.basename),
          exports_17("delimiter", delimiter = path.delimiter),
          exports_17("dirname", dirname = path.dirname),
          exports_17("extname", extname = path.extname),
          exports_17("format", format = path.format),
          exports_17("fromFileUrl", fromFileUrl = path.fromFileUrl),
          exports_17("isAbsolute", isAbsolute = path.isAbsolute),
          exports_17("join", join = path.join),
          exports_17("normalize", normalize = path.normalize),
          exports_17("parse", parse = path.parse),
          exports_17("relative", relative = path.relative),
          exports_17("resolve", resolve = path.resolve),
          exports_17("sep", sep = path.sep),
          exports_17(
            "toNamespacedPath",
            toNamespacedPath = path.toNamespacedPath,
          );
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/empty_dir",
  ["https://deno.land/std@0.53.0/path/mod"],
  function (exports_18, context_18) {
    "use strict";
    var mod_ts_3, readDir, readDirSync, mkdir, mkdirSync, remove, removeSync;
    var __moduleName = context_18 && context_18.id;
    /**
     * Ensures that a directory is empty.
     * Deletes directory contents if the directory is not empty.
     * If the directory does not exist, it is created.
     * The directory itself is not deleted.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    async function emptyDir(dir) {
      try {
        const items = [];
        for await (const dirEntry of readDir(dir)) {
          items.push(dirEntry);
        }
        while (items.length) {
          const item = items.shift();
          if (item && item.name) {
            const filepath = mod_ts_3.join(dir, item.name);
            await remove(filepath, { recursive: true });
          }
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
        // if not exist. then create it
        await mkdir(dir, { recursive: true });
      }
    }
    exports_18("emptyDir", emptyDir);
    /**
     * Ensures that a directory is empty.
     * Deletes directory contents if the directory is not empty.
     * If the directory does not exist, it is created.
     * The directory itself is not deleted.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    function emptyDirSync(dir) {
      try {
        const items = [...readDirSync(dir)];
        // If the directory exists, remove all entries inside it.
        while (items.length) {
          const item = items.shift();
          if (item && item.name) {
            const filepath = mod_ts_3.join(dir, item.name);
            removeSync(filepath, { recursive: true });
          }
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
        // if not exist. then create it
        mkdirSync(dir, { recursive: true });
        return;
      }
    }
    exports_18("emptyDirSync", emptyDirSync);
    return {
      setters: [
        function (mod_ts_3_1) {
          mod_ts_3 = mod_ts_3_1;
        },
      ],
      execute: function () {
        readDir = Deno.readDir,
          readDirSync = Deno.readDirSync,
          mkdir = Deno.mkdir,
          mkdirSync = Deno.mkdirSync,
          remove = Deno.remove,
          removeSync = Deno.removeSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/_util",
  ["https://deno.land/std@0.53.0/path/mod"],
  function (exports_19, context_19) {
    "use strict";
    var path;
    var __moduleName = context_19 && context_19.id;
    /**
     * Test whether or not `dest` is a sub-directory of `src`
     * @param src src file path
     * @param dest dest file path
     * @param sep path separator
     */
    function isSubdir(src, dest, sep = path.sep) {
      if (src === dest) {
        return false;
      }
      const srcArray = src.split(sep);
      const destArray = dest.split(sep);
      return srcArray.every((current, i) => destArray[i] === current);
    }
    exports_19("isSubdir", isSubdir);
    /**
     * Get a human readable file type string.
     *
     * @param fileInfo A FileInfo describes a file and is returned by `stat`,
     *                 `lstat`
     */
    function getFileInfoType(fileInfo) {
      return fileInfo.isFile ? "file" : fileInfo.isDirectory
      ? "dir"
      : fileInfo.isSymlink
      ? "symlink"
      : undefined;
    }
    exports_19("getFileInfoType", getFileInfoType);
    return {
      setters: [
        function (path_1) {
          path = path_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/ensure_dir",
  ["https://deno.land/std@0.53.0/fs/_util"],
  function (exports_20, context_20) {
    "use strict";
    var _util_ts_3, lstat, lstatSync, mkdir, mkdirSync;
    var __moduleName = context_20 && context_20.id;
    /**
     * Ensures that the directory exists.
     * If the directory structure does not exist, it is created. Like mkdir -p.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    async function ensureDir(dir) {
      try {
        const fileInfo = await lstat(dir);
        if (!fileInfo.isDirectory) {
          throw new Error(
            `Ensure path exists, expected 'dir', got '${
              _util_ts_3.getFileInfoType(fileInfo)
            }'`,
          );
        }
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          // if dir not exists. then create it.
          await mkdir(dir, { recursive: true });
          return;
        }
        throw err;
      }
    }
    exports_20("ensureDir", ensureDir);
    /**
     * Ensures that the directory exists.
     * If the directory structure does not exist, it is created. Like mkdir -p.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    function ensureDirSync(dir) {
      try {
        const fileInfo = lstatSync(dir);
        if (!fileInfo.isDirectory) {
          throw new Error(
            `Ensure path exists, expected 'dir', got '${
              _util_ts_3.getFileInfoType(fileInfo)
            }'`,
          );
        }
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          // if dir not exists. then create it.
          mkdirSync(dir, { recursive: true });
          return;
        }
        throw err;
      }
    }
    exports_20("ensureDirSync", ensureDirSync);
    return {
      setters: [
        function (_util_ts_3_1) {
          _util_ts_3 = _util_ts_3_1;
        },
      ],
      execute: function () {
        lstat = Deno.lstat,
          lstatSync = Deno.lstatSync,
          mkdir = Deno.mkdir,
          mkdirSync = Deno.mkdirSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/ensure_file",
  [
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/fs/ensure_dir",
    "https://deno.land/std@0.53.0/fs/_util",
  ],
  function (exports_21, context_21) {
    "use strict";
    var path,
      ensure_dir_ts_1,
      _util_ts_4,
      lstat,
      lstatSync,
      writeFile,
      writeFileSync;
    var __moduleName = context_21 && context_21.id;
    /**
     * Ensures that the file exists.
     * If the file that is requested to be created is in directories that do not
     * exist.
     * these directories are created. If the file already exists,
     * it is NOTMODIFIED.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    async function ensureFile(filePath) {
      try {
        // if file exists
        const stat = await lstat(filePath);
        if (!stat.isFile) {
          throw new Error(
            `Ensure path exists, expected 'file', got '${
              _util_ts_4.getFileInfoType(stat)
            }'`,
          );
        }
      } catch (err) {
        // if file not exists
        if (err instanceof Deno.errors.NotFound) {
          // ensure dir exists
          await ensure_dir_ts_1.ensureDir(path.dirname(filePath));
          // create file
          await writeFile(filePath, new Uint8Array());
          return;
        }
        throw err;
      }
    }
    exports_21("ensureFile", ensureFile);
    /**
     * Ensures that the file exists.
     * If the file that is requested to be created is in directories that do not
     * exist,
     * these directories are created. If the file already exists,
     * it is NOT MODIFIED.
     * Requires the `--allow-read` and `--allow-write` flag.
     */
    function ensureFileSync(filePath) {
      try {
        // if file exists
        const stat = lstatSync(filePath);
        if (!stat.isFile) {
          throw new Error(
            `Ensure path exists, expected 'file', got '${
              _util_ts_4.getFileInfoType(stat)
            }'`,
          );
        }
      } catch (err) {
        // if file not exists
        if (err instanceof Deno.errors.NotFound) {
          // ensure dir exists
          ensure_dir_ts_1.ensureDirSync(path.dirname(filePath));
          // create file
          writeFileSync(filePath, new Uint8Array());
          return;
        }
        throw err;
      }
    }
    exports_21("ensureFileSync", ensureFileSync);
    return {
      setters: [
        function (path_2) {
          path = path_2;
        },
        function (ensure_dir_ts_1_1) {
          ensure_dir_ts_1 = ensure_dir_ts_1_1;
        },
        function (_util_ts_4_1) {
          _util_ts_4 = _util_ts_4_1;
        },
      ],
      execute: function () {
        lstat = Deno.lstat,
          lstatSync = Deno.lstatSync,
          writeFile = Deno.writeFile,
          writeFileSync = Deno.writeFileSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/exists",
  [],
  function (exports_22, context_22) {
    "use strict";
    var lstat, lstatSync;
    var __moduleName = context_22 && context_22.id;
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    async function exists(filePath) {
      try {
        await lstat(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_22("exists", exists);
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    function existsSync(filePath) {
      try {
        lstatSync(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_22("existsSync", existsSync);
    return {
      setters: [],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        lstat = Deno.lstat, lstatSync = Deno.lstatSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/ensure_link",
  [
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/fs/ensure_dir",
    "https://deno.land/std@0.53.0/fs/exists",
    "https://deno.land/std@0.53.0/fs/_util",
  ],
  function (exports_23, context_23) {
    "use strict";
    var path, ensure_dir_ts_2, exists_ts_1, _util_ts_5;
    var __moduleName = context_23 && context_23.id;
    /**
     * Ensures that the hard link exists.
     * If the directory structure does not exist, it is created.
     *
     * @param src the source file path. Directory hard links are not allowed.
     * @param dest the destination link path
     */
    async function ensureLink(src, dest) {
      if (await exists_ts_1.exists(dest)) {
        const destStatInfo = await Deno.lstat(dest);
        const destFilePathType = _util_ts_5.getFileInfoType(destStatInfo);
        if (destFilePathType !== "file") {
          throw new Error(
            `Ensure path exists, expected 'file', got '${destFilePathType}'`,
          );
        }
        return;
      }
      await ensure_dir_ts_2.ensureDir(path.dirname(dest));
      await Deno.link(src, dest);
    }
    exports_23("ensureLink", ensureLink);
    /**
     * Ensures that the hard link exists.
     * If the directory structure does not exist, it is created.
     *
     * @param src the source file path. Directory hard links are not allowed.
     * @param dest the destination link path
     */
    function ensureLinkSync(src, dest) {
      if (exists_ts_1.existsSync(dest)) {
        const destStatInfo = Deno.lstatSync(dest);
        const destFilePathType = _util_ts_5.getFileInfoType(destStatInfo);
        if (destFilePathType !== "file") {
          throw new Error(
            `Ensure path exists, expected 'file', got '${destFilePathType}'`,
          );
        }
        return;
      }
      ensure_dir_ts_2.ensureDirSync(path.dirname(dest));
      Deno.linkSync(src, dest);
    }
    exports_23("ensureLinkSync", ensureLinkSync);
    return {
      setters: [
        function (path_3) {
          path = path_3;
        },
        function (ensure_dir_ts_2_1) {
          ensure_dir_ts_2 = ensure_dir_ts_2_1;
        },
        function (exists_ts_1_1) {
          exists_ts_1 = exists_ts_1_1;
        },
        function (_util_ts_5_1) {
          _util_ts_5 = _util_ts_5_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/ensure_symlink",
  [
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/fs/ensure_dir",
    "https://deno.land/std@0.53.0/fs/exists",
    "https://deno.land/std@0.53.0/fs/_util",
  ],
  function (exports_24, context_24) {
    "use strict";
    var path, ensure_dir_ts_3, exists_ts_2, _util_ts_6;
    var __moduleName = context_24 && context_24.id;
    /**
     * Ensures that the link exists.
     * If the directory structure does not exist, it is created.
     *
     * @param src the source file path
     * @param dest the destination link path
     */
    async function ensureSymlink(src, dest) {
      const srcStatInfo = await Deno.lstat(src);
      const srcFilePathType = _util_ts_6.getFileInfoType(srcStatInfo);
      if (await exists_ts_2.exists(dest)) {
        const destStatInfo = await Deno.lstat(dest);
        const destFilePathType = _util_ts_6.getFileInfoType(destStatInfo);
        if (destFilePathType !== "symlink") {
          throw new Error(
            `Ensure path exists, expected 'symlink', got '${destFilePathType}'`,
          );
        }
        return;
      }
      await ensure_dir_ts_3.ensureDir(path.dirname(dest));
      ensure_dir_ts_3.ensureDirSync(path.dirname(dest));
      if (Deno.build.os === "windows") {
        await Deno.symlink(src, dest, {
          type: srcFilePathType === "dir" ? "dir" : "file",
        });
      } else {
        await Deno.symlink(src, dest);
      }
    }
    exports_24("ensureSymlink", ensureSymlink);
    /**
     * Ensures that the link exists.
     * If the directory structure does not exist, it is created.
     *
     * @param src the source file path
     * @param dest the destination link path
     */
    function ensureSymlinkSync(src, dest) {
      const srcStatInfo = Deno.lstatSync(src);
      const srcFilePathType = _util_ts_6.getFileInfoType(srcStatInfo);
      if (exists_ts_2.existsSync(dest)) {
        const destStatInfo = Deno.lstatSync(dest);
        const destFilePathType = _util_ts_6.getFileInfoType(destStatInfo);
        if (destFilePathType !== "symlink") {
          throw new Error(
            `Ensure path exists, expected 'symlink', got '${destFilePathType}'`,
          );
        }
        return;
      }
      ensure_dir_ts_3.ensureDirSync(path.dirname(dest));
      if (Deno.build.os === "windows") {
        Deno.symlinkSync(src, dest, {
          type: srcFilePathType === "dir" ? "dir" : "file",
        });
      } else {
        Deno.symlinkSync(src, dest);
      }
    }
    exports_24("ensureSymlinkSync", ensureSymlinkSync);
    return {
      setters: [
        function (path_4) {
          path = path_4;
        },
        function (ensure_dir_ts_3_1) {
          ensure_dir_ts_3 = ensure_dir_ts_3_1;
        },
        function (exists_ts_2_1) {
          exists_ts_2 = exists_ts_2_1;
        },
        function (_util_ts_6_1) {
          _util_ts_6 = _util_ts_6_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/walk",
  [
    "https://deno.land/std@0.53.0/testing/asserts",
    "https://deno.land/std@0.53.0/path/mod",
  ],
  function (exports_25, context_25) {
    "use strict";
    var asserts_ts_3, mod_ts_4, readDir, readDirSync, stat, statSync;
    var __moduleName = context_25 && context_25.id;
    function createWalkEntrySync(path) {
      path = mod_ts_4.normalize(path);
      const name = mod_ts_4.basename(path);
      const info = statSync(path);
      return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink,
      };
    }
    exports_25("createWalkEntrySync", createWalkEntrySync);
    async function createWalkEntry(path) {
      path = mod_ts_4.normalize(path);
      const name = mod_ts_4.basename(path);
      const info = await stat(path);
      return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink,
      };
    }
    exports_25("createWalkEntry", createWalkEntry);
    function include(path, exts, match, skip) {
      if (exts && !exts.some((ext) => path.endsWith(ext))) {
        return false;
      }
      if (match && !match.some((pattern) => !!path.match(pattern))) {
        return false;
      }
      if (skip && skip.some((pattern) => !!path.match(pattern))) {
        return false;
      }
      return true;
    }
    /** Walks the file tree rooted at root, yielding each file or directory in the
     * tree filtered according to the given options. The files are walked in lexical
     * order, which makes the output deterministic but means that for very large
     * directories walk() can be inefficient.
     *
     * Options:
     * - maxDepth?: number = Infinity;
     * - includeFiles?: boolean = true;
     * - includeDirs?: boolean = true;
     * - followSymlinks?: boolean = false;
     * - exts?: string[];
     * - match?: RegExp[];
     * - skip?: RegExp[];
     *
     *      for await (const entry of walk(".")) {
     *        console.log(entry.path);
     *        assert(entry.isFile);
     *      };
     */
    async function* walk(
      root,
      {
        maxDepth = Infinity,
        includeFiles = true,
        includeDirs = true,
        followSymlinks = false,
        exts = undefined,
        match = undefined,
        skip = undefined,
      } = {},
    ) {
      if (maxDepth < 0) {
        return;
      }
      if (includeDirs && include(root, exts, match, skip)) {
        yield await createWalkEntry(root);
      }
      if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
      }
      for await (const entry of readDir(root)) {
        if (entry.isSymlink) {
          if (followSymlinks) {
            // TODO(ry) Re-enable followSymlinks.
            asserts_ts_3.unimplemented();
          } else {
            continue;
          }
        }
        asserts_ts_3.assert(entry.name != null);
        const path = mod_ts_4.join(root, entry.name);
        if (entry.isFile) {
          if (includeFiles && include(path, exts, match, skip)) {
            yield { path, ...entry };
          }
        } else {
          yield* walk(path, {
            maxDepth: maxDepth - 1,
            includeFiles,
            includeDirs,
            followSymlinks,
            exts,
            match,
            skip,
          });
        }
      }
    }
    exports_25("walk", walk);
    /** Same as walk() but uses synchronous ops */
    function* walkSync(
      root,
      {
        maxDepth = Infinity,
        includeFiles = true,
        includeDirs = true,
        followSymlinks = false,
        exts = undefined,
        match = undefined,
        skip = undefined,
      } = {},
    ) {
      if (maxDepth < 0) {
        return;
      }
      if (includeDirs && include(root, exts, match, skip)) {
        yield createWalkEntrySync(root);
      }
      if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
      }
      for (const entry of readDirSync(root)) {
        if (entry.isSymlink) {
          if (followSymlinks) {
            asserts_ts_3.unimplemented();
          } else {
            continue;
          }
        }
        asserts_ts_3.assert(entry.name != null);
        const path = mod_ts_4.join(root, entry.name);
        if (entry.isFile) {
          if (includeFiles && include(path, exts, match, skip)) {
            yield { path, ...entry };
          }
        } else {
          yield* walkSync(path, {
            maxDepth: maxDepth - 1,
            includeFiles,
            includeDirs,
            followSymlinks,
            exts,
            match,
            skip,
          });
        }
      }
    }
    exports_25("walkSync", walkSync);
    return {
      setters: [
        function (asserts_ts_3_1) {
          asserts_ts_3 = asserts_ts_3_1;
        },
        function (mod_ts_4_1) {
          mod_ts_4 = mod_ts_4_1;
        },
      ],
      execute: function () {
        readDir = Deno.readDir,
          readDirSync = Deno.readDirSync,
          stat = Deno.stat,
          statSync = Deno.statSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/expand_glob",
  [
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/fs/walk",
    "https://deno.land/std@0.53.0/testing/asserts",
  ],
  function (exports_26, context_26) {
    "use strict";
    var mod_ts_5, walk_ts_1, asserts_ts_4, cwd, isWindows;
    var __moduleName = context_26 && context_26.id;
    // TODO: Maybe make this public somewhere.
    function split(path) {
      const s = mod_ts_5.SEP_PATTERN.source;
      const segments = path
        .replace(new RegExp(`^${s}|${s}$`, "g"), "")
        .split(mod_ts_5.SEP_PATTERN);
      const isAbsolute_ = mod_ts_5.isAbsolute(path);
      return {
        segments,
        isAbsolute: isAbsolute_,
        hasTrailingSep: !!path.match(new RegExp(`${s}$`)),
        winRoot: isWindows && isAbsolute_ ? segments.shift() : undefined,
      };
    }
    function throwUnlessNotFound(error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
    function comparePath(a, b) {
      if (a.path < b.path) {
        return -1;
      }
      if (a.path > b.path) {
        return 1;
      }
      return 0;
    }
    /**
     * Expand the glob string from the specified `root` directory and yield each
     * result as a `WalkEntry` object.
     */
    async function* expandGlob(
      glob,
      {
        root = cwd(),
        exclude = [],
        includeDirs = true,
        extended = false,
        globstar = false,
      } = {},
    ) {
      const globOptions = { extended, globstar };
      const absRoot = mod_ts_5.isAbsolute(root) ? mod_ts_5.normalize(root)
      : mod_ts_5.joinGlobs([cwd(), root], globOptions);
      const resolveFromRoot = (path) =>
        mod_ts_5.isAbsolute(path)
          ? mod_ts_5.normalize(path)
          : mod_ts_5.joinGlobs([absRoot, path], globOptions);
      const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => mod_ts_5.globToRegExp(s, globOptions));
      const shouldInclude = (path) =>
        !excludePatterns.some((p) => !!path.match(p));
      const { segments, hasTrailingSep, winRoot } = split(
        resolveFromRoot(glob),
      );
      let fixedRoot = winRoot != undefined ? winRoot : "/";
      while (segments.length > 0 && !mod_ts_5.isGlob(segments[0])) {
        const seg = segments.shift();
        asserts_ts_4.assert(seg != null);
        fixedRoot = mod_ts_5.joinGlobs([fixedRoot, seg], globOptions);
      }
      let fixedRootInfo;
      try {
        fixedRootInfo = await walk_ts_1.createWalkEntry(fixedRoot);
      } catch (error) {
        return throwUnlessNotFound(error);
      }
      async function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
          return;
        } else if (globSegment == "..") {
          const parentPath = mod_ts_5.joinGlobs(
            [walkInfo.path, ".."],
            globOptions,
          );
          try {
            if (shouldInclude(parentPath)) {
              return yield await walk_ts_1.createWalkEntry(parentPath);
            }
          } catch (error) {
            throwUnlessNotFound(error);
          }
          return;
        } else if (globSegment == "**") {
          return yield* walk_ts_1.walk(walkInfo.path, {
            includeFiles: false,
            skip: excludePatterns,
          });
        }
        yield* walk_ts_1.walk(walkInfo.path, {
          maxDepth: 1,
          match: [
            mod_ts_5.globToRegExp(
              mod_ts_5.joinGlobs([walkInfo.path, globSegment], globOptions),
              globOptions,
            ),
          ],
          skip: excludePatterns,
        });
      }
      let currentMatches = [fixedRootInfo];
      for (const segment of segments) {
        // Advancing the list of current matches may introduce duplicates, so we
        // pass everything through this Map.
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches) {
          for await (const nextMatch of advanceMatch(currentMatch, segment)) {
            nextMatchMap.set(nextMatch.path, nextMatch);
          }
        }
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
      }
      if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
      }
      if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
      }
      yield* currentMatches;
    }
    exports_26("expandGlob", expandGlob);
    /** Synchronous version of `expandGlob()`. */
    function* expandGlobSync(
      glob,
      {
        root = cwd(),
        exclude = [],
        includeDirs = true,
        extended = false,
        globstar = false,
      } = {},
    ) {
      const globOptions = { extended, globstar };
      const absRoot = mod_ts_5.isAbsolute(root) ? mod_ts_5.normalize(root)
      : mod_ts_5.joinGlobs([cwd(), root], globOptions);
      const resolveFromRoot = (path) =>
        mod_ts_5.isAbsolute(path) ? mod_ts_5.normalize(path)
        : mod_ts_5.joinGlobs([absRoot, path], globOptions);
      const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => mod_ts_5.globToRegExp(s, globOptions));
      const shouldInclude = (path) =>
        !excludePatterns.some((p) => !!path.match(p));
      const { segments, hasTrailingSep, winRoot } = split(
        resolveFromRoot(glob),
      );
      let fixedRoot = winRoot != undefined ? winRoot : "/";
      while (segments.length > 0 && !mod_ts_5.isGlob(segments[0])) {
        const seg = segments.shift();
        asserts_ts_4.assert(seg != null);
        fixedRoot = mod_ts_5.joinGlobs([fixedRoot, seg], globOptions);
      }
      let fixedRootInfo;
      try {
        fixedRootInfo = walk_ts_1.createWalkEntrySync(fixedRoot);
      } catch (error) {
        return throwUnlessNotFound(error);
      }
      function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
          return;
        } else if (globSegment == "..") {
          const parentPath = mod_ts_5.joinGlobs(
            [walkInfo.path, ".."],
            globOptions,
          );
          try {
            if (shouldInclude(parentPath)) {
              return yield walk_ts_1.createWalkEntrySync(parentPath);
            }
          } catch (error) {
            throwUnlessNotFound(error);
          }
          return;
        } else if (globSegment == "**") {
          return yield* walk_ts_1.walkSync(walkInfo.path, {
            includeFiles: false,
            skip: excludePatterns,
          });
        }
        yield* walk_ts_1.walkSync(walkInfo.path, {
          maxDepth: 1,
          match: [
            mod_ts_5.globToRegExp(
              mod_ts_5.joinGlobs([walkInfo.path, globSegment], globOptions),
              globOptions,
            ),
          ],
          skip: excludePatterns,
        });
      }
      let currentMatches = [fixedRootInfo];
      for (const segment of segments) {
        // Advancing the list of current matches may introduce duplicates, so we
        // pass everything through this Map.
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches) {
          for (const nextMatch of advanceMatch(currentMatch, segment)) {
            nextMatchMap.set(nextMatch.path, nextMatch);
          }
        }
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
      }
      if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
      }
      if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
      }
      yield* currentMatches;
    }
    exports_26("expandGlobSync", expandGlobSync);
    return {
      setters: [
        function (mod_ts_5_1) {
          mod_ts_5 = mod_ts_5_1;
        },
        function (walk_ts_1_1) {
          walk_ts_1 = walk_ts_1_1;
        },
        function (asserts_ts_4_1) {
          asserts_ts_4 = asserts_ts_4_1;
        },
      ],
      execute: function () {
        cwd = Deno.cwd;
        isWindows = Deno.build.os == "windows";
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/move",
  [
    "https://deno.land/std@0.53.0/fs/exists",
    "https://deno.land/std@0.53.0/fs/_util",
  ],
  function (exports_27, context_27) {
    "use strict";
    var exists_ts_3, _util_ts_7;
    var __moduleName = context_27 && context_27.id;
    /** Moves a file or directory */
    async function move(src, dest, { overwrite = false } = {}) {
      const srcStat = await Deno.stat(src);
      if (srcStat.isDirectory && _util_ts_7.isSubdir(src, dest)) {
        throw new Error(
          `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`,
        );
      }
      if (overwrite) {
        if (await exists_ts_3.exists(dest)) {
          await Deno.remove(dest, { recursive: true });
        }
        await Deno.rename(src, dest);
      } else {
        if (await exists_ts_3.exists(dest)) {
          throw new Error("dest already exists.");
        }
        await Deno.rename(src, dest);
      }
      return;
    }
    exports_27("move", move);
    /** Moves a file or directory synchronously */
    function moveSync(src, dest, { overwrite = false } = {}) {
      const srcStat = Deno.statSync(src);
      if (srcStat.isDirectory && _util_ts_7.isSubdir(src, dest)) {
        throw new Error(
          `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`,
        );
      }
      if (overwrite) {
        if (exists_ts_3.existsSync(dest)) {
          Deno.removeSync(dest, { recursive: true });
        }
        Deno.renameSync(src, dest);
      } else {
        if (exists_ts_3.existsSync(dest)) {
          throw new Error("dest already exists.");
        }
        Deno.renameSync(src, dest);
      }
    }
    exports_27("moveSync", moveSync);
    return {
      setters: [
        function (exists_ts_3_1) {
          exists_ts_3 = exists_ts_3_1;
        },
        function (_util_ts_7_1) {
          _util_ts_7 = _util_ts_7_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/copy",
  [
    "https://deno.land/std@0.53.0/path/mod",
    "https://deno.land/std@0.53.0/fs/ensure_dir",
    "https://deno.land/std@0.53.0/fs/_util",
    "https://deno.land/std@0.53.0/testing/asserts",
  ],
  function (exports_28, context_28) {
    "use strict";
    var path, ensure_dir_ts_4, _util_ts_8, asserts_ts_5, isWindows;
    var __moduleName = context_28 && context_28.id;
    async function ensureValidCopy(src, dest, options, isCopyFolder = false) {
      let destStat;
      try {
        destStat = await Deno.lstat(dest);
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return;
        }
        throw err;
      }
      if (isCopyFolder && !destStat.isDirectory) {
        throw new Error(
          `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
        );
      }
      if (!options.overwrite) {
        throw new Error(`'${dest}' already exists.`);
      }
      return destStat;
    }
    function ensureValidCopySync(src, dest, options, isCopyFolder = false) {
      let destStat;
      try {
        destStat = Deno.lstatSync(dest);
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return;
        }
        throw err;
      }
      if (isCopyFolder && !destStat.isDirectory) {
        throw new Error(
          `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
        );
      }
      if (!options.overwrite) {
        throw new Error(`'${dest}' already exists.`);
      }
      return destStat;
    }
    /* copy file to dest */
    async function copyFile(src, dest, options) {
      await ensureValidCopy(src, dest, options);
      await Deno.copyFile(src, dest);
      if (options.preserveTimestamps) {
        const statInfo = await Deno.stat(src);
        asserts_ts_5.assert(
          statInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          statInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
      }
    }
    /* copy file to dest synchronously */
    function copyFileSync(src, dest, options) {
      ensureValidCopySync(src, dest, options);
      Deno.copyFileSync(src, dest);
      if (options.preserveTimestamps) {
        const statInfo = Deno.statSync(src);
        asserts_ts_5.assert(
          statInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          statInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
      }
    }
    /* copy symlink to dest */
    async function copySymLink(src, dest, options) {
      await ensureValidCopy(src, dest, options);
      const originSrcFilePath = await Deno.readLink(src);
      const type = _util_ts_8.getFileInfoType(await Deno.lstat(src));
      if (isWindows) {
        await Deno.symlink(originSrcFilePath, dest, {
          type: type === "dir" ? "dir" : "file",
        });
      } else {
        await Deno.symlink(originSrcFilePath, dest);
      }
      if (options.preserveTimestamps) {
        const statInfo = await Deno.lstat(src);
        asserts_ts_5.assert(
          statInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          statInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
      }
    }
    /* copy symlink to dest synchronously */
    function copySymlinkSync(src, dest, options) {
      ensureValidCopySync(src, dest, options);
      const originSrcFilePath = Deno.readLinkSync(src);
      const type = _util_ts_8.getFileInfoType(Deno.lstatSync(src));
      if (isWindows) {
        Deno.symlinkSync(originSrcFilePath, dest, {
          type: type === "dir" ? "dir" : "file",
        });
      } else {
        Deno.symlinkSync(originSrcFilePath, dest);
      }
      if (options.preserveTimestamps) {
        const statInfo = Deno.lstatSync(src);
        asserts_ts_5.assert(
          statInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          statInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
      }
    }
    /* copy folder from src to dest. */
    async function copyDir(src, dest, options) {
      const destStat = await ensureValidCopy(src, dest, options, true);
      if (!destStat) {
        await ensure_dir_ts_4.ensureDir(dest);
      }
      if (options.preserveTimestamps) {
        const srcStatInfo = await Deno.stat(src);
        asserts_ts_5.assert(
          srcStatInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          srcStatInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        await Deno.utime(dest, srcStatInfo.atime, srcStatInfo.mtime);
      }
      for await (const entry of Deno.readDir(src)) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, path.basename(srcPath));
        if (entry.isSymlink) {
          await copySymLink(srcPath, destPath, options);
        } else if (entry.isDirectory) {
          await copyDir(srcPath, destPath, options);
        } else if (entry.isFile) {
          await copyFile(srcPath, destPath, options);
        }
      }
    }
    /* copy folder from src to dest synchronously */
    function copyDirSync(src, dest, options) {
      const destStat = ensureValidCopySync(src, dest, options, true);
      if (!destStat) {
        ensure_dir_ts_4.ensureDirSync(dest);
      }
      if (options.preserveTimestamps) {
        const srcStatInfo = Deno.statSync(src);
        asserts_ts_5.assert(
          srcStatInfo.atime instanceof Date,
          `statInfo.atime is unavailable`,
        );
        asserts_ts_5.assert(
          srcStatInfo.mtime instanceof Date,
          `statInfo.mtime is unavailable`,
        );
        Deno.utimeSync(dest, srcStatInfo.atime, srcStatInfo.mtime);
      }
      for (const entry of Deno.readDirSync(src)) {
        asserts_ts_5.assert(entry.name != null, "file.name must be set");
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, path.basename(srcPath));
        if (entry.isSymlink) {
          copySymlinkSync(srcPath, destPath, options);
        } else if (entry.isDirectory) {
          copyDirSync(srcPath, destPath, options);
        } else if (entry.isFile) {
          copyFileSync(srcPath, destPath, options);
        }
      }
    }
    /**
     * Copy a file or directory. The directory can have contents. Like `cp -r`.
     * Requires the `--allow-read` and `--allow-write` flag.
     * @param src the file/directory path.
     *            Note that if `src` is a directory it will copy everything inside
     *            of this directory, not the entire directory itself
     * @param dest the destination path. Note that if `src` is a file, `dest` cannot
     *             be a directory
     * @param options
     */
    async function copy(src, dest, options = {}) {
      src = path.resolve(src);
      dest = path.resolve(dest);
      if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
      }
      const srcStat = await Deno.lstat(src);
      if (srcStat.isDirectory && _util_ts_8.isSubdir(src, dest)) {
        throw new Error(
          `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`,
        );
      }
      if (srcStat.isSymlink) {
        await copySymLink(src, dest, options);
      } else if (srcStat.isDirectory) {
        await copyDir(src, dest, options);
      } else if (srcStat.isFile) {
        await copyFile(src, dest, options);
      }
    }
    exports_28("copy", copy);
    /**
     * Copy a file or directory. The directory can have contents. Like `cp -r`.
     * Requires the `--allow-read` and `--allow-write` flag.
     * @param src the file/directory path.
     *            Note that if `src` is a directory it will copy everything inside
     *            of this directory, not the entire directory itself
     * @param dest the destination path. Note that if `src` is a file, `dest` cannot
     *             be a directory
     * @param options
     */
    function copySync(src, dest, options = {}) {
      src = path.resolve(src);
      dest = path.resolve(dest);
      if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
      }
      const srcStat = Deno.lstatSync(src);
      if (srcStat.isDirectory && _util_ts_8.isSubdir(src, dest)) {
        throw new Error(
          `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`,
        );
      }
      if (srcStat.isSymlink) {
        copySymlinkSync(src, dest, options);
      } else if (srcStat.isDirectory) {
        copyDirSync(src, dest, options);
      } else if (srcStat.isFile) {
        copyFileSync(src, dest, options);
      }
    }
    exports_28("copySync", copySync);
    return {
      setters: [
        function (path_5) {
          path = path_5;
        },
        function (ensure_dir_ts_4_1) {
          ensure_dir_ts_4 = ensure_dir_ts_4_1;
        },
        function (_util_ts_8_1) {
          _util_ts_8 = _util_ts_8_1;
        },
        function (asserts_ts_5_1) {
          asserts_ts_5 = asserts_ts_5_1;
        },
      ],
      execute: function () {
        isWindows = Deno.build.os === "windows";
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std@0.53.0/fs/read_file_str",
  [],
  function (exports_29, context_29) {
    "use strict";
    var __moduleName = context_29 && context_29.id;
    /**
     * Read file synchronously and output it as a string.
     *
     * @param filename File to read
     * @param opts Read options
     */
    function readFileStrSync(filename, opts = {}) {
      const decoder = new TextDecoder(opts.encoding);
      return decoder.decode(Deno.readFileSync(filename));
    }
    exports_29("readFileStrSync", readFileStrSync);
    /**
     * Read file and output it as a string.
     *
     * @param filename File to read
     * @param opts Read options
     */
    async function readFileStr(filename, opts = {}) {
      const decoder = new TextDecoder(opts.encoding);
      return decoder.decode(await Deno.readFile(filename));
    }
    exports_29("readFileStr", readFileStr);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std@0.53.0/fs/write_file_str",
  [],
  function (exports_30, context_30) {
    "use strict";
    var __moduleName = context_30 && context_30.id;
    /**
     * Write the string to file synchronously.
     *
     * @param filename File to write
     * @param content The content write to file
     * @returns void
     */
    function writeFileStrSync(filename, content) {
      const encoder = new TextEncoder();
      Deno.writeFileSync(filename, encoder.encode(content));
    }
    exports_30("writeFileStrSync", writeFileStrSync);
    /**
     * Write the string to file.
     *
     * @param filename File to write
     * @param content The content write to file
     * @returns Promise<void>
     */
    async function writeFileStr(filename, content) {
      const encoder = new TextEncoder();
      await Deno.writeFile(filename, encoder.encode(content));
    }
    exports_30("writeFileStr", writeFileStr);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std@0.53.0/fs/read_json",
  [],
  function (exports_31, context_31) {
    "use strict";
    var __moduleName = context_31 && context_31.id;
    /** Reads a JSON file and then parses it into an object */
    async function readJson(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(await Deno.readFile(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_31("readJson", readJson);
    /** Reads a JSON file and then parses it into an object */
    function readJsonSync(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(Deno.readFileSync(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_31("readJsonSync", readJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/write_json",
  [],
  function (exports_32, context_32) {
    "use strict";
    var __moduleName = context_32 && context_32.id;
    /* Writes an object to a JSON file. */
    async function writeJson(filePath, object, options = {}) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      await Deno.writeFile(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_32("writeJson", writeJson);
    /* Writes an object to a JSON file. */
    function writeJsonSync(filePath, object, options = {}) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      Deno.writeFileSync(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_32("writeJsonSync", writeJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std@0.53.0/fs/eol",
  [],
  function (exports_33, context_33) {
    "use strict";
    var EOL, regDetect;
    var __moduleName = context_33 && context_33.id;
    /**
     * Detect the EOL character for string input.
     * returns null if no newline
     */
    function detect(content) {
      const d = content.match(regDetect);
      if (!d || d.length === 0) {
        return null;
      }
      const crlf = d.filter((x) => x === EOL.CRLF);
      if (crlf.length > 0) {
        return EOL.CRLF;
      } else {
        return EOL.LF;
      }
    }
    exports_33("detect", detect);
    /** Format the file to the targeted EOL */
    function format(content, eol) {
      return content.replace(regDetect, eol);
    }
    exports_33("format", format);
    return {
      setters: [],
      execute: function () {
        /** EndOfLine character enum */
        (function (EOL) {
          EOL["LF"] = "\n";
          EOL["CRLF"] = "\r\n";
        })(EOL || (EOL = {}));
        exports_33("EOL", EOL);
        regDetect = /(?:\r?\n)/g;
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/fs/mod",
  [
    "https://deno.land/std@0.53.0/fs/empty_dir",
    "https://deno.land/std@0.53.0/fs/ensure_dir",
    "https://deno.land/std@0.53.0/fs/ensure_file",
    "https://deno.land/std@0.53.0/fs/ensure_link",
    "https://deno.land/std@0.53.0/fs/ensure_symlink",
    "https://deno.land/std@0.53.0/fs/exists",
    "https://deno.land/std@0.53.0/fs/expand_glob",
    "https://deno.land/std@0.53.0/fs/move",
    "https://deno.land/std@0.53.0/fs/copy",
    "https://deno.land/std@0.53.0/fs/read_file_str",
    "https://deno.land/std@0.53.0/fs/write_file_str",
    "https://deno.land/std@0.53.0/fs/read_json",
    "https://deno.land/std@0.53.0/fs/write_json",
    "https://deno.land/std@0.53.0/fs/walk",
    "https://deno.land/std@0.53.0/fs/eol",
  ],
  function (exports_34, context_34) {
    "use strict";
    var __moduleName = context_34 && context_34.id;
    function exportStar_3(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default") exports[n] = m[n];
      }
      exports_34(exports);
    }
    return {
      setters: [
        function (empty_dir_ts_1_1) {
          exportStar_3(empty_dir_ts_1_1);
        },
        function (ensure_dir_ts_5_1) {
          exportStar_3(ensure_dir_ts_5_1);
        },
        function (ensure_file_ts_1_1) {
          exportStar_3(ensure_file_ts_1_1);
        },
        function (ensure_link_ts_1_1) {
          exportStar_3(ensure_link_ts_1_1);
        },
        function (ensure_symlink_ts_1_1) {
          exportStar_3(ensure_symlink_ts_1_1);
        },
        function (exists_ts_4_1) {
          exportStar_3(exists_ts_4_1);
        },
        function (expand_glob_ts_1_1) {
          exportStar_3(expand_glob_ts_1_1);
        },
        function (move_ts_1_1) {
          exportStar_3(move_ts_1_1);
        },
        function (copy_ts_1_1) {
          exportStar_3(copy_ts_1_1);
        },
        function (read_file_str_ts_1_1) {
          exportStar_3(read_file_str_ts_1_1);
        },
        function (write_file_str_ts_1_1) {
          exportStar_3(write_file_str_ts_1_1);
        },
        function (read_json_ts_1_1) {
          exportStar_3(read_json_ts_1_1);
        },
        function (write_json_ts_1_1) {
          exportStar_3(write_json_ts_1_1);
        },
        function (walk_ts_2_1) {
          exportStar_3(walk_ts_2_1);
        },
        function (eol_ts_1_1) {
          exportStar_3(eol_ts_1_1);
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/log/levels",
  [],
  function (exports_35, context_35) {
    "use strict";
    var LogLevels, LogLevelNames, byLevel;
    var __moduleName = context_35 && context_35.id;
    /** Returns the numeric log level associated with the passed,
     * stringy log level name.
     */
    function getLevelByName(name) {
      switch (name) {
        case "NOTSET":
          return LogLevels.NOTSET;
        case "DEBUG":
          return LogLevels.DEBUG;
        case "INFO":
          return LogLevels.INFO;
        case "WARNING":
          return LogLevels.WARNING;
        case "ERROR":
          return LogLevels.ERROR;
        case "CRITICAL":
          return LogLevels.CRITICAL;
        default:
          throw new Error(`no log level found for "${name}"`);
      }
    }
    exports_35("getLevelByName", getLevelByName);
    /** Returns the stringy log level name provided the numeric log level */
    function getLevelName(level) {
      const levelName = byLevel[level];
      if (levelName) {
        return levelName;
      }
      throw new Error(`no level name found for level: ${level}`);
    }
    exports_35("getLevelName", getLevelName);
    return {
      setters: [],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        /** Get log level numeric values through enum constants
             */
        (function (LogLevels) {
          LogLevels[LogLevels["NOTSET"] = 0] = "NOTSET";
          LogLevels[LogLevels["DEBUG"] = 10] = "DEBUG";
          LogLevels[LogLevels["INFO"] = 20] = "INFO";
          LogLevels[LogLevels["WARNING"] = 30] = "WARNING";
          LogLevels[LogLevels["ERROR"] = 40] = "ERROR";
          LogLevels[LogLevels["CRITICAL"] = 50] = "CRITICAL";
        })(LogLevels || (LogLevels = {}));
        exports_35("LogLevels", LogLevels);
        /** Permitted log level names */
        exports_35(
          "LogLevelNames",
          LogLevelNames = Object.keys(LogLevels).filter((key) =>
            isNaN(Number(key))
          ),
        );
        byLevel = {
          [String(LogLevels.NOTSET)]: "NOTSET",
          [String(LogLevels.DEBUG)]: "DEBUG",
          [String(LogLevels.INFO)]: "INFO",
          [String(LogLevels.WARNING)]: "WARNING",
          [String(LogLevels.ERROR)]: "ERROR",
          [String(LogLevels.CRITICAL)]: "CRITICAL",
        };
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/log/handlers",
  [
    "https://deno.land/std@0.53.0/log/levels",
    "https://deno.land/std@0.53.0/fmt/colors",
    "https://deno.land/std@0.53.0/fs/exists",
  ],
  function (exports_36, context_36) {
    "use strict";
    var open,
      openSync,
      close,
      renameSync,
      statSync,
      levels_ts_1,
      colors_ts_2,
      exists_ts_5,
      DEFAULT_FORMATTER,
      BaseHandler,
      ConsoleHandler,
      WriterHandler,
      FileHandler,
      RotatingFileHandler;
    var __moduleName = context_36 && context_36.id;
    return {
      setters: [
        function (levels_ts_1_1) {
          levels_ts_1 = levels_ts_1_1;
        },
        function (colors_ts_2_1) {
          colors_ts_2 = colors_ts_2_1;
        },
        function (exists_ts_5_1) {
          exists_ts_5 = exists_ts_5_1;
        },
      ],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        open = Deno.open,
          openSync = Deno.openSync,
          close = Deno.close,
          renameSync = Deno.renameSync,
          statSync = Deno.statSync;
        DEFAULT_FORMATTER = "{levelName} {msg}";
        BaseHandler = class BaseHandler {
          constructor(levelName, options = {}) {
            this.level = levels_ts_1.getLevelByName(levelName);
            this.levelName = levelName;
            this.formatter = options.formatter || DEFAULT_FORMATTER;
          }
          handle(logRecord) {
            if (this.level > logRecord.level) {
              return;
            }
            const msg = this.format(logRecord);
            return this.log(msg);
          }
          format(logRecord) {
            if (this.formatter instanceof Function) {
              return this.formatter(logRecord);
            }
            return this.formatter.replace(/{(\S+)}/g, (match, p1) => {
              const value = logRecord[p1];
              // do not interpolate missing values
              if (!value) {
                return match;
              }
              return String(value);
            });
          }
          log(_msg) {}
          async setup() {}
          async destroy() {}
        };
        exports_36("BaseHandler", BaseHandler);
        ConsoleHandler = class ConsoleHandler extends BaseHandler {
          format(logRecord) {
            let msg = super.format(logRecord);
            switch (logRecord.level) {
              case levels_ts_1.LogLevels.INFO:
                msg = colors_ts_2.blue(msg);
                break;
              case levels_ts_1.LogLevels.WARNING:
                msg = colors_ts_2.yellow(msg);
                break;
              case levels_ts_1.LogLevels.ERROR:
                msg = colors_ts_2.red(msg);
                break;
              case levels_ts_1.LogLevels.CRITICAL:
                msg = colors_ts_2.bold(colors_ts_2.red(msg));
                break;
              default:
                break;
            }
            return msg;
          }
          log(msg) {
            console.log(msg);
          }
        };
        exports_36("ConsoleHandler", ConsoleHandler);
        WriterHandler = class WriterHandler extends BaseHandler {
          constructor() {
            super(...arguments);
            this.#encoder = new TextEncoder();
          }
          #encoder;
        };
        exports_36("WriterHandler", WriterHandler);
        FileHandler = class FileHandler extends WriterHandler {
          constructor(levelName, options) {
            super(levelName, options);
            this.#encoder = new TextEncoder();
            this._filename = options.filename;
            // default to append mode, write only
            this._mode = options.mode ? options.mode : "a";
            this._openOptions = {
              createNew: this._mode === "x",
              create: this._mode !== "x",
              append: this._mode === "a",
              truncate: this._mode !== "a",
              write: true,
            };
          }
          #encoder;
          async setup() {
            this._file = await open(this._filename, this._openOptions);
            this._writer = this._file;
          }
          log(msg) {
            Deno.writeSync(this._file.rid, this.#encoder.encode(msg + "\n"));
          }
          destroy() {
            this._file.close();
            return Promise.resolve();
          }
        };
        exports_36("FileHandler", FileHandler);
        RotatingFileHandler = class RotatingFileHandler extends FileHandler {
          constructor(levelName, options) {
            super(levelName, options);
            this.#maxBytes = options.maxBytes;
            this.#maxBackupCount = options.maxBackupCount;
          }
          #maxBytes;
          #maxBackupCount;
          async setup() {
            if (this.#maxBytes < 1) {
              throw new Error("maxBytes cannot be less than 1");
            }
            if (this.#maxBackupCount < 1) {
              throw new Error("maxBackupCount cannot be less than 1");
            }
            await super.setup();
            if (this._mode === "w") {
              // Remove old backups too as it doesn't make sense to start with a clean
              // log file, but old backups
              for (let i = 1; i <= this.#maxBackupCount; i++) {
                if (await exists_ts_5.exists(this._filename + "." + i)) {
                  await Deno.remove(this._filename + "." + i);
                }
              }
            } else if (this._mode === "x") {
              // Throw if any backups also exist
              for (let i = 1; i <= this.#maxBackupCount; i++) {
                if (await exists_ts_5.exists(this._filename + "." + i)) {
                  Deno.close(this._file.rid);
                  throw new Deno.errors.AlreadyExists(
                    "Backup log file " + this._filename + "." + i +
                      " already exists",
                  );
                }
              }
            }
          }
          handle(logRecord) {
            if (this.level > logRecord.level) {
              return;
            }
            const msg = this.format(logRecord);
            const currentFileSize = statSync(this._filename).size;
            if (currentFileSize + msg.length > this.#maxBytes) {
              this.rotateLogFiles();
            }
            return this.log(msg);
          }
          rotateLogFiles() {
            close(this._file.rid);
            for (let i = this.#maxBackupCount - 1; i >= 0; i--) {
              const source = this._filename + (i === 0 ? "" : "." + i);
              const dest = this._filename + "." + (i + 1);
              if (exists_ts_5.existsSync(source)) {
                renameSync(source, dest);
              }
            }
            this._file = openSync(this._filename, this._openOptions);
            this._writer = this._file;
          }
        };
        exports_36("RotatingFileHandler", RotatingFileHandler);
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/log/logger",
  ["https://deno.land/std@0.53.0/log/levels"],
  function (exports_37, context_37) {
    "use strict";
    var levels_ts_2, LogRecord, Logger;
    var __moduleName = context_37 && context_37.id;
    return {
      setters: [
        function (levels_ts_2_1) {
          levels_ts_2 = levels_ts_2_1;
        },
      ],
      execute: function () {
        LogRecord = class LogRecord {
          constructor(msg, args, level) {
            this.msg = msg;
            this.#args = [...args];
            this.level = level;
            this.#datetime = new Date();
            this.levelName = levels_ts_2.getLevelName(level);
          }
          #args;
          #datetime;
          get args() {
            return [...this.#args];
          }
          get datetime() {
            return new Date(this.#datetime.getTime());
          }
        };
        exports_37("LogRecord", LogRecord);
        Logger = class Logger {
          constructor(levelName, handlers) {
            this.level = levels_ts_2.getLevelByName(levelName);
            this.levelName = levelName;
            this.handlers = handlers || [];
          }
          _log(level, msg, ...args) {
            if (this.level > level) {
              return;
            }
            const record = new LogRecord(msg, args, level);
            this.handlers.forEach((handler) => {
              handler.handle(record);
            });
          }
          debug(msg, ...args) {
            this._log(levels_ts_2.LogLevels.DEBUG, msg, ...args);
          }
          info(msg, ...args) {
            this._log(levels_ts_2.LogLevels.INFO, msg, ...args);
          }
          warning(msg, ...args) {
            this._log(levels_ts_2.LogLevels.WARNING, msg, ...args);
          }
          error(msg, ...args) {
            this._log(levels_ts_2.LogLevels.ERROR, msg, ...args);
          }
          critical(msg, ...args) {
            this._log(levels_ts_2.LogLevels.CRITICAL, msg, ...args);
          }
        };
        exports_37("Logger", Logger);
      },
    };
  },
);
System.register(
  "https://deno.land/std@0.53.0/log/mod",
  [
    "https://deno.land/std@0.53.0/log/logger",
    "https://deno.land/std@0.53.0/log/handlers",
    "https://deno.land/std@0.53.0/testing/asserts",
    "https://deno.land/std@0.53.0/log/levels",
  ],
  function (exports_38, context_38) {
    "use strict";
    var logger_ts_1,
      handlers_ts_1,
      asserts_ts_6,
      LoggerConfig,
      DEFAULT_LEVEL,
      DEFAULT_CONFIG,
      state,
      handlers,
      debug,
      info,
      warning,
      error,
      critical;
    var __moduleName = context_38 && context_38.id;
    function getLogger(name) {
      if (!name) {
        const d = state.loggers.get("default");
        asserts_ts_6.assert(
          d != null,
          `"default" logger must be set for getting logger without name`,
        );
        return d;
      }
      const result = state.loggers.get(name);
      if (!result) {
        const logger = new logger_ts_1.Logger("NOTSET", []);
        state.loggers.set(name, logger);
        return logger;
      }
      return result;
    }
    exports_38("getLogger", getLogger);
    async function setup(config) {
      state.config = {
        handlers: { ...DEFAULT_CONFIG.handlers, ...config.handlers },
        loggers: { ...DEFAULT_CONFIG.loggers, ...config.loggers },
      };
      // tear down existing handlers
      state.handlers.forEach((handler) => {
        handler.destroy();
      });
      state.handlers.clear();
      // setup handlers
      const handlers = state.config.handlers || {};
      for (const handlerName in handlers) {
        const handler = handlers[handlerName];
        await handler.setup();
        state.handlers.set(handlerName, handler);
      }
      // remove existing loggers
      state.loggers.clear();
      // setup loggers
      const loggers = state.config.loggers || {};
      for (const loggerName in loggers) {
        const loggerConfig = loggers[loggerName];
        const handlerNames = loggerConfig.handlers || [];
        const handlers = [];
        handlerNames.forEach((handlerName) => {
          const handler = state.handlers.get(handlerName);
          if (handler) {
            handlers.push(handler);
          }
        });
        const levelName = loggerConfig.level || DEFAULT_LEVEL;
        const logger = new logger_ts_1.Logger(levelName, handlers);
        state.loggers.set(loggerName, logger);
      }
    }
    exports_38("setup", setup);
    return {
      setters: [
        function (logger_ts_1_1) {
          logger_ts_1 = logger_ts_1_1;
        },
        function (handlers_ts_1_1) {
          handlers_ts_1 = handlers_ts_1_1;
        },
        function (asserts_ts_6_1) {
          asserts_ts_6 = asserts_ts_6_1;
        },
        function (levels_ts_3_1) {
          exports_38({
            "LogLevels": levels_ts_3_1["LogLevels"],
          });
        },
      ],
      execute: async function () {
        LoggerConfig = class LoggerConfig {
        };
        exports_38("LoggerConfig", LoggerConfig);
        DEFAULT_LEVEL = "INFO";
        DEFAULT_CONFIG = {
          handlers: {
            default: new handlers_ts_1.ConsoleHandler(DEFAULT_LEVEL),
          },
          loggers: {
            default: {
              level: DEFAULT_LEVEL,
              handlers: ["default"],
            },
          },
        };
        state = {
          handlers: new Map(),
          loggers: new Map(),
          config: DEFAULT_CONFIG,
        };
        exports_38(
          "handlers",
          handlers = {
            BaseHandler: handlers_ts_1.BaseHandler,
            ConsoleHandler: handlers_ts_1.ConsoleHandler,
            WriterHandler: handlers_ts_1.WriterHandler,
            FileHandler: handlers_ts_1.FileHandler,
            RotatingFileHandler: handlers_ts_1.RotatingFileHandler,
          },
        );
        exports_38(
          "debug",
          debug = (msg, ...args) => getLogger("default").debug(msg, ...args),
        );
        exports_38(
          "info",
          info = (msg, ...args) => getLogger("default").info(msg, ...args),
        );
        exports_38(
          "warning",
          warning = (msg, ...args) =>
            getLogger("default").warning(msg, ...args),
        );
        exports_38(
          "error",
          error = (msg, ...args) => getLogger("default").error(msg, ...args),
        );
        exports_38(
          "critical",
          critical = (msg, ...args) =>
            getLogger("default").critical(msg, ...args),
        );
        await setup(DEFAULT_CONFIG);
      },
    };
  },
);
System.register(
  "https://deno.land/x/cron/cron",
  [],
  function (exports_39, context_39) {
    "use strict";
    var Cron;
    var __moduleName = context_39 && context_39.id;
    return {
      setters: [],
      execute: function () {
        Cron = class Cron {
          constructor() {
            this.add = (schedule, fn) => {
              this.cronJobs.push({
                schedule: schedule,
                fn: fn,
              });
            };
            this.validate = (schedule) => {
              let now = new Date();
              let minutes = String(now.getMinutes());
              let hours = String(now.getHours());
              let dayOfMonth = String(now.getDate());
              let month = String(now.getMonth() + 1);
              let dayOfWeek = String(now.getDay());
              let crontab = schedule.split(" ");
              let currTime = [minutes, hours, dayOfMonth, month, dayOfWeek];
              let a = crontab[0] === "*" ? true : crontab[0] === currTime[0]
              ? true
              : false;
              let b = crontab[1] === "*"
                ? true
                : crontab[1] === currTime[1]
                ? true
                : false;
              let c = crontab[2] === "*"
                ? true
                : crontab[2] === currTime[2]
                ? true
                : false;
              let d = crontab[3] === "*"
                ? true
                : crontab[3] === currTime[3]
                ? true
                : false;
              let e = crontab[4] === "*"
                ? true
                : crontab[4] === currTime[4]
                ? true
                : false;
              return a && b && c && d && e;
            };
            this.filterJobs = () => {
              let result = [];
              for (let i = 0; i < this.cronJobs.length; i++) {
                if (this.validate(this.cronJobs[i].schedule)) {
                  result.push(this.cronJobs[i].fn);
                }
              }
              return result;
            };
            this.logError = false;
            this.cronJobs = [];
          }
          async start() {
            let jobs = this.filterJobs();
            for (let i = 0; i < jobs.length; i++) {
              jobs[i]();
            }
            setTimeout(() => {
              this.start();
            }, (61 - (new Date().getSeconds())) * 1000);
          }
        };
        exports_39("Cron", Cron);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/UnpackEvt",
  [],
  function (exports_40, context_40) {
    "use strict";
    var __moduleName = context_40 && context_40.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/assert",
  [],
  function (exports_41, context_41) {
    "use strict";
    var __moduleName = context_41 && context_41.id;
    function assert(condition, msg) {
      if (!condition) {
        throw new Error(msg);
      }
    }
    exports_41("assert", assert);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/AsyncReturnType",
  [],
  function (exports_42, context_42) {
    "use strict";
    var __moduleName = context_42 && context_42.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/exclude",
  [],
  function (exports_43, context_43) {
    "use strict";
    var __moduleName = context_43 && context_43.id;
    /** Return a function to use as Array.prototype.filter argument
     * to exclude one or many primitive value element from the array.
     * Ex: ([ "a", "b" ] as const).filter(exclude("a") return "b"[]
     */
    function exclude(target) {
      const test = target instanceof Object
        ? ((element) => target.indexOf(element) < 0)
        : ((element) => element !== target);
      return function (str) {
        return test(str);
      };
    }
    exports_43("exclude", exclude);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/id",
  [],
  function (exports_44, context_44) {
    "use strict";
    var id;
    var __moduleName = context_44 && context_44.id;
    return {
      setters: [],
      execute: function () {
        /**
             * The identity function.
             *
             * Help to build an object of type T.
             * Better than using 'as T' as there is no type safety loss.
             *
             * - Used as continence for enabling type inference.
             * Example:
             *
             * type Circle = {
             *     type: "CIRCLE";
             *     radius: number;
             * };
             *
             * type Square = {
             *     type: "SQUARE";
             *     side: number;
             * };
             * type Shape= Circle | Square;
             *
             * declare function f(shape: Shape): void;
             *
             * f(id<Circle>({ "type": "CIRCLE", "radius": 33 }); <== We have auto completion to instantiate circle.
             *
             * - Used to loosen the type restriction without saying "trust me" to the compiler.
             * declare const x: Set<readonly ["FOO"]>;
             * declare function f(s: Set<string[]>): void;
             * f(id<Set<any>>(x));
             *
             * Example:
             * declare const x: Set<readonly [ "FOO" ]>;
             * declare f(x: Set<string[]>): void;
             * id(x as Set<["FOO"]>); <== trust me it's readonly!
             * f(id<Set<any>>(x)); <== we acknowledge that we are out of the safe zone.
             */
        exports_44("id", id = (x) => x);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/matchVoid",
  [],
  function (exports_45, context_45) {
    "use strict";
    var __moduleName = context_45 && context_45.id;
    /**
     *
     * Unlike undefined or null, testing o !== void
     * will not restrict the type.
     *
     * Example:
     *
     * declare o: { p: string; } | void;
     *
     * matchVoid(o)?null:o.p <== Type inference ok
     *
     * Match void
     * @param o type of o should be a union of type containing void
     * @returns true if o is undefined
     */
    function matchVoid(o) {
      return o === undefined;
    }
    exports_45("matchVoid", matchVoid);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/objectKeys",
  [],
  function (exports_46, context_46) {
    "use strict";
    var __moduleName = context_46 && context_46.id;
    /** Object.keys() with types */
    function objectKeys(o) {
      return Object.keys(o);
    }
    exports_46("objectKeys", objectKeys);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/typeGuard",
  [],
  function (exports_47, context_47) {
    "use strict";
    var __moduleName = context_47 && context_47.id;
    /**
     * Use cases:
     *
     * 1) When we know the subtype of a variable but the compiler is unaware.
     *
     * declare const x: "FOO" | "BAR";
     *
     * 1.1) If we want to tel the compile that we know x is of type "BAR"
     *
     * assert(typeGuard<"BAR">(x));
     * x; <== x is of type "BAR"
     *
     * 1.2) If we want to tell the compiler that x is NOT of type "BAR"
     *
     * assert(!typeGuard<"BAR">(x,false));
     * x; <== x is of type "FOO"
     *
     * 2) Tell the compiler what assertion can be made on a given variable
     * if a given test return true.
     *
     * type Circle = { type: "CIRCLE"; radius: number; };
     * type Square = { type: "SQUARE"; sideLength: number; };
     * type Shape = Circle | Square;
     *
     * declare const shape: Shape;
     *
     * if( typeGuard<Circle>(shape, shape.type === "CIRCLE") ){
     *     [ shape is Circle ]
     * }else{
     *     [ shape is not Circle ]
     * }
     *
     *
     * export function matchVoid(o: any): o is void {
     *     return typeGuard<void>(o, o === undefined || o === null );
     * }
     *
     * 3) Helper for safely build other type guards
     *
     * export function match<T>(set: Object): set is SetLike<T> {
     *     return (
     *         typeGuard<SetLike<T>>(set) &&
     *         typeof set.values === "function" &&
     *         /Set/.test(Object.getPrototypeOf(set).constructor.name)
     *     );
     * }
     *
     */
    function typeGuard(o, isMatched = true) {
      o; //NOTE: Just to avoid unused variable;
      return isMatched;
    }
    exports_47("typeGuard", typeGuard);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/UnpackPromise",
  [],
  function (exports_48, context_48) {
    "use strict";
    var __moduleName = context_48 && context_48.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/UnpackTypeGuard",
  [],
  function (exports_49, context_49) {
    "use strict";
    var __moduleName = context_49 && context_49.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/index",
  [
    "https://deno.land/x/evt/tools/typeSafety/assert",
    "https://deno.land/x/evt/tools/typeSafety/exclude",
    "https://deno.land/x/evt/tools/typeSafety/id",
    "https://deno.land/x/evt/tools/typeSafety/matchVoid",
    "https://deno.land/x/evt/tools/typeSafety/objectKeys",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
  ],
  function (exports_50, context_50) {
    "use strict";
    var __moduleName = context_50 && context_50.id;
    return {
      setters: [
        function (assert_ts_1_1) {
          exports_50({
            "assert": assert_ts_1_1["assert"],
          });
        },
        function (exclude_ts_1_1) {
          exports_50({
            "exclude": exclude_ts_1_1["exclude"],
          });
        },
        function (id_ts_1_1) {
          exports_50({
            "id": id_ts_1_1["id"],
          });
        },
        function (matchVoid_ts_1_1) {
          exports_50({
            "matchVoid": matchVoid_ts_1_1["matchVoid"],
          });
        },
        function (objectKeys_ts_1_1) {
          exports_50({
            "objectKeys": objectKeys_ts_1_1["objectKeys"],
          });
        },
        function (typeGuard_ts_1_1) {
          exports_50({
            "typeGuard": typeGuard_ts_1_1["typeGuard"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/Operator",
  ["https://deno.land/x/evt/tools/typeSafety/index"],
  function (exports_51, context_51) {
    "use strict";
    var index_ts_1, Operator;
    var __moduleName = context_51 && context_51.id;
    return {
      setters: [
        function (index_ts_1_1) {
          index_ts_1 = index_ts_1_1;
        },
      ],
      execute: function () {
        (function (Operator) {
          let fλ;
          (function (fλ) {
            let Stateful;
            (function (Stateful) {
              function match(op) {
                return typeof op !== "function";
              }
              Stateful.match = match;
            })(Stateful = fλ.Stateful || (fλ.Stateful = {}));
            let Result;
            (function (Result) {
              function match(result) {
                return Matched.match(result) || NotMatched.match(result);
              }
              Result.match = match;
              function getDetachArg(result) {
                const detach = Matched.match(result) ? result[1] : result;
                if (Detach.FromEvt.match(detach)) {
                  return true;
                }
                if (Detach.WithCtxArg.match(detach)) {
                  return [
                    detach.DETACH,
                    detach.err,
                    detach.res,
                  ];
                }
                return false;
              }
              Result.getDetachArg = getDetachArg;
              let NotMatched;
              (function (NotMatched) {
                function match(result) {
                  return (result === null ||
                    Detach.match(result));
                }
                NotMatched.match = match;
              })(NotMatched = Result.NotMatched || (Result.NotMatched = {}));
              let Matched;
              (function (Matched) {
                function match(result) {
                  return (index_ts_1.typeGuard(result) &&
                    result instanceof Object &&
                    !("input" in result) && //exclude String.prototype.match
                    (result.length === 1 ||
                      (result.length === 2 &&
                        (result[1] === null ||
                          Detach.match(result[1])))));
                }
                Matched.match = match;
              })(Matched = Result.Matched || (Result.Matched = {}));
              let Detach;
              (function (Detach) {
                let FromEvt;
                (function (FromEvt) {
                  function match(detach) {
                    return detach === "DETACH";
                  }
                  FromEvt.match = match;
                })(FromEvt = Detach.FromEvt || (Detach.FromEvt = {}));
                let WithCtxArg;
                (function (WithCtxArg) {
                  function match(detach) {
                    return (index_ts_1.typeGuard(detach) &&
                      detach instanceof Object &&
                      detach.DETACH instanceof Object);
                  }
                  WithCtxArg.match = match;
                })(WithCtxArg = Detach.WithCtxArg || (Detach.WithCtxArg = {}));
                function match(detach) {
                  return FromEvt.match(detach) || WithCtxArg.match(detach);
                }
                Detach.match = match;
              })(Detach = Result.Detach || (Result.Detach = {}));
            })(Result = fλ.Result || (fλ.Result = {}));
          })(fλ = Operator.fλ || (Operator.fλ = {}));
        })(Operator || (Operator = {}));
        exports_51("Operator", Operator);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/Handler",
  [],
  function (exports_52, context_52) {
    "use strict";
    var __moduleName = context_52 && context_52.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/Postable",
  [],
  function (exports_53, context_53) {
    "use strict";
    var __moduleName = context_53 && context_53.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/CtxLike",
  ["https://deno.land/x/evt/tools/typeSafety/typeGuard"],
  function (exports_54, context_54) {
    "use strict";
    var typeGuard_ts_2, CtxLike;
    var __moduleName = context_54 && context_54.id;
    return {
      setters: [
        function (typeGuard_ts_2_1) {
          typeGuard_ts_2 = typeGuard_ts_2_1;
        },
      ],
      execute: function () {
        (function (CtxLike) {
          function match(o) {
            return (typeGuard_ts_2.typeGuard(o) &&
              o instanceof Object &&
              typeof o.done === "function" &&
              typeof o.abort === "function" &&
              typeof o.zz__addHandler === "function" &&
              typeof o.zz__removeHandler === "function");
          }
          CtxLike.match = match;
        })(CtxLike || (CtxLike = {}));
        exports_54("CtxLike", CtxLike);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/StatefulReadonlyEvt",
  [],
  function (exports_55, context_55) {
    "use strict";
    var __moduleName = context_55 && context_55.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/StatefulPostable",
  [],
  function (exports_56, context_56) {
    "use strict";
    var __moduleName = context_56 && context_56.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/StatefulEvt",
  [],
  function (exports_57, context_57) {
    "use strict";
    var __moduleName = context_57 && context_57.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/NonPostableEvt",
  [],
  function (exports_58, context_58) {
    "use strict";
    var __moduleName = context_58 && context_58.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/Evt",
  [],
  function (exports_59, context_59) {
    "use strict";
    var __moduleName = context_59 && context_59.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/Ctx",
  [],
  function (exports_60, context_60) {
    "use strict";
    var __moduleName = context_60 && context_60.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/VoidCtx",
  [],
  function (exports_61, context_61) {
    "use strict";
    var __moduleName = context_61 && context_61.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/VoidEvt",
  [],
  function (exports_62, context_62) {
    "use strict";
    var __moduleName = context_62 && context_62.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/interfaces/index",
  ["https://deno.land/x/evt/lib/types/interfaces/CtxLike"],
  function (exports_63, context_63) {
    "use strict";
    var __moduleName = context_63 && context_63.id;
    return {
      setters: [
        function (CtxLike_ts_1_1) {
          exports_63({
            "CtxLike": CtxLike_ts_1_1["CtxLike"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/SwapEvtType",
  [],
  function (exports_64, context_64) {
    "use strict";
    var __moduleName = context_64 && context_64.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/FactorizeEvt",
  [],
  function (exports_65, context_65) {
    "use strict";
    var __moduleName = context_65 && context_65.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/ToPostableEvt",
  [],
  function (exports_66, context_66) {
    "use strict";
    var __moduleName = context_66 && context_66.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/ToNonPostableEvt",
  [],
  function (exports_67, context_67) {
    "use strict";
    var __moduleName = context_67 && context_67.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/UnpackCtx",
  [],
  function (exports_68, context_68) {
    "use strict";
    var __moduleName = context_68 && context_68.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/helper/index",
  [],
  function (exports_69, context_69) {
    "use strict";
    var __moduleName = context_69 && context_69.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/EventTargetLike",
  ["https://deno.land/x/evt/tools/typeSafety/index"],
  function (exports_70, context_70) {
    "use strict";
    var index_ts_2, EventTargetLike;
    var __moduleName = context_70 && context_70.id;
    return {
      setters: [
        function (index_ts_2_1) {
          index_ts_2 = index_ts_2_1;
        },
      ],
      execute: function () {
        (function (EventTargetLike) {
          let RxJSSubject;
          (function (RxJSSubject) {
            function match(eventTarget) {
              return (index_ts_2.typeGuard(eventTarget) &&
                eventTarget instanceof Object &&
                typeof eventTarget.subscribe === "function");
            }
            RxJSSubject.match = match;
          })(
            RxJSSubject = EventTargetLike.RxJSSubject ||
              (EventTargetLike.RxJSSubject = {}),
          );
          let NodeStyleEventEmitter;
          (function (NodeStyleEventEmitter) {
            function match(eventTarget) {
              return (index_ts_2.typeGuard(eventTarget) &&
                eventTarget instanceof Object &&
                typeof eventTarget.addListener === "function" &&
                typeof eventTarget.removeListener === "function");
            }
            NodeStyleEventEmitter.match = match;
          })(
            NodeStyleEventEmitter = EventTargetLike.NodeStyleEventEmitter ||
              (EventTargetLike.NodeStyleEventEmitter = {}),
          );
          let JQueryStyleEventEmitter;
          (function (JQueryStyleEventEmitter) {
            function match(eventTarget) {
              return (index_ts_2.typeGuard(eventTarget) &&
                eventTarget instanceof Object &&
                typeof eventTarget.on === "function" &&
                typeof eventTarget.off === "function");
            }
            JQueryStyleEventEmitter.match = match;
          })(
            JQueryStyleEventEmitter = EventTargetLike.JQueryStyleEventEmitter ||
              (EventTargetLike.JQueryStyleEventEmitter = {}),
          );
          let HasEventTargetAddRemove;
          (function (HasEventTargetAddRemove) {
            function match(eventTarget) {
              return (index_ts_2.typeGuard(eventTarget) &&
                eventTarget instanceof Object &&
                typeof eventTarget.addEventListener === "function" &&
                typeof eventTarget.removeEventListener === "function");
            }
            HasEventTargetAddRemove.match = match;
          })(
            HasEventTargetAddRemove = EventTargetLike.HasEventTargetAddRemove ||
              (EventTargetLike.HasEventTargetAddRemove = {}),
          );
        })(EventTargetLike || (EventTargetLike = {}));
        exports_70("EventTargetLike", EventTargetLike);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/EvtError",
  [],
  function (exports_71, context_71) {
    "use strict";
    var EvtError;
    var __moduleName = context_71 && context_71.id;
    return {
      setters: [],
      execute: function () {
        (function (EvtError) {
          class Timeout extends Error {
            constructor(timeout) {
              super(`Evt timeout after ${timeout}ms`);
              this.timeout = timeout;
              Object.setPrototypeOf(this, new.target.prototype);
            }
          }
          EvtError.Timeout = Timeout;
          class Detached extends Error {
            constructor() {
              super(`Evt handler detached`);
              Object.setPrototypeOf(this, new.target.prototype);
            }
          }
          EvtError.Detached = Detached;
        })(EvtError || (EvtError = {}));
        exports_71("EvtError", EvtError);
      },
    };
  },
);
/*
This is a curated re export of the dom API definitions.

The DOM definitions are available only when "compilerOptions": { "lib": ["DOM"] }}
is present in the tsconfig.json.

We need we re-export those definitions so that we can expose methods that interact with
the DOM ( ex Evt.from ) while not producing type error when
EVT is imported in project that does not use 'lib DOM', typically
projects that targets Node.JS.
*/
System.register(
  "https://deno.land/x/evt/lib/types/lib.dom",
  [],
  function (exports_72, context_72) {
    "use strict";
    var __moduleName = context_72 && context_72.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/types/index",
  [
    "https://deno.land/x/evt/lib/types/helper/index",
    "https://deno.land/x/evt/lib/types/interfaces/index",
    "https://deno.land/x/evt/lib/types/EventTargetLike",
    "https://deno.land/x/evt/lib/types/EvtError",
    "https://deno.land/x/evt/lib/types/lib.dom",
    "https://deno.land/x/evt/lib/types/Operator",
  ],
  function (exports_73, context_73) {
    "use strict";
    var dom;
    var __moduleName = context_73 && context_73.id;
    var exportedNames_2 = {
      "dom": true,
      "EventTargetLike": true,
      "EvtError": true,
      "Operator": true,
    };
    function exportStar_4(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default" && !exportedNames_2.hasOwnProperty(n)) {
          exports[n] = m[n];
        }
      }
      exports_73(exports);
    }
    return {
      setters: [
        function (index_ts_3_1) {
          exportStar_4(index_ts_3_1);
        },
        function (index_ts_4_1) {
          exportStar_4(index_ts_4_1);
        },
        function (EventTargetLike_ts_1_1) {
          exports_73({
            "EventTargetLike": EventTargetLike_ts_1_1["EventTargetLike"],
          });
        },
        function (EvtError_ts_1_1) {
          exports_73({
            "EvtError": EvtError_ts_1_1["EvtError"],
          });
        },
        function (dom_1) {
          dom = dom_1;
        },
        function (Operator_ts_1_1) {
          exports_73({
            "Operator": Operator_ts_1_1["Operator"],
          });
        },
      ],
      execute: function () {
        exports_73("dom", dom);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/encapsulateOpState",
  [
    "https://deno.land/x/evt/tools/typeSafety/id",
    "https://deno.land/x/evt/lib/types/Operator",
  ],
  function (exports_74, context_74) {
    "use strict";
    var id_ts_2, Operator_ts_2;
    var __moduleName = context_74 && context_74.id;
    function encapsulateOpState(statefulFλOp) {
      let state = statefulFλOp[1];
      return id_ts_2.id((...[data, , cbInvokedIfMatched]) => {
        const opResult = statefulFλOp[0](data, state, cbInvokedIfMatched);
        if (
          !!cbInvokedIfMatched &&
          Operator_ts_2.Operator.fλ.Result.Matched.match(opResult)
        ) {
          state = opResult[0];
        }
        return opResult;
      });
    }
    exports_74("encapsulateOpState", encapsulateOpState);
    return {
      setters: [
        function (id_ts_2_1) {
          id_ts_2 = id_ts_2_1;
        },
        function (Operator_ts_2_1) {
          Operator_ts_2 = Operator_ts_2_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/invokeOperator",
  ["https://deno.land/x/evt/lib/types/Operator"],
  function (exports_75, context_75) {
    "use strict";
    var Operator_ts_3;
    var __moduleName = context_75 && context_75.id;
    function invokeOperator(op, data, isPost) {
      const result = op(data, undefined, isPost);
      return Operator_ts_3.Operator.fλ.Result.match(result)
        ? result
        : !!result
        ? [data]
        : null;
    }
    exports_75("invokeOperator", invokeOperator);
    return {
      setters: [
        function (Operator_ts_3_1) {
          Operator_ts_3 = Operator_ts_3_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/compose",
  [
    "https://deno.land/x/evt/lib/util/encapsulateOpState",
    "https://deno.land/x/evt/lib/util/invokeOperator",
    "https://deno.land/x/evt/lib/types/Operator",
    "https://deno.land/x/evt/tools/typeSafety/id",
    "https://deno.land/x/evt/tools/typeSafety/assert",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
  ],
  function (exports_76, context_76) {
    "use strict";
    var encapsulateOpState_ts_1,
      invokeOperator_ts_1,
      Operator_ts_4,
      id_ts_3,
      assert_ts_2,
      typeGuard_ts_3;
    var __moduleName = context_76 && context_76.id;
    function f_o_g(op1, op2) {
      const opAtoB = Operator_ts_4.Operator.fλ.Stateful.match(op1)
        ? encapsulateOpState_ts_1.encapsulateOpState(op1) : id_ts_3.id(op1);
      const opBtoC = Operator_ts_4.Operator.fλ.Stateful.match(op2)
        ? encapsulateOpState_ts_1.encapsulateOpState(op2)
        : id_ts_3.id(op2);
      return id_ts_3.id((...[dataA, , isPost]) => {
        const resultB = invokeOperator_ts_1.invokeOperator(
          opAtoB,
          dataA,
          isPost,
        );
        if (Operator_ts_4.Operator.fλ.Result.NotMatched.match(resultB)) {
          //CtxResultOp1 assignable to CtxResultOp1 | CtxResultOp2...
          assert_ts_2.assert(typeGuard_ts_3.typeGuard(resultB));
          return resultB;
        }
        const detachOp1 = resultB[1] ?? null;
        //...same...
        assert_ts_2.assert(typeGuard_ts_3.typeGuard(detachOp1));
        const [dataB] = resultB;
        const resultC = invokeOperator_ts_1.invokeOperator(
          opBtoC,
          dataB,
          isPost,
        );
        if (Operator_ts_4.Operator.fλ.Result.NotMatched.match(resultC)) {
          //...same
          assert_ts_2.assert(typeGuard_ts_3.typeGuard(resultC));
          return detachOp1 ?? resultC;
        }
        return id_ts_3.id([
          resultC[0],
          detachOp1 ?? resultC[1] ?? null,
        ]);
      });
    }
    function compose(...ops) {
      if (ops.length === 1) {
        const [op] = ops;
        return Operator_ts_4.Operator.fλ.Stateful.match(op)
          ? encapsulateOpState_ts_1.encapsulateOpState(op)
          : op;
      }
      const [op1, op2, ...rest] = ops;
      const op1_o_op2 = f_o_g(op1, op2);
      if (rest.length === 0) {
        return op1_o_op2;
      }
      return compose(op1_o_op2, ...rest);
    }
    exports_76("compose", compose);
    return {
      setters: [
        function (encapsulateOpState_ts_1_1) {
          encapsulateOpState_ts_1 = encapsulateOpState_ts_1_1;
        },
        function (invokeOperator_ts_1_1) {
          invokeOperator_ts_1 = invokeOperator_ts_1_1;
        },
        function (Operator_ts_4_1) {
          Operator_ts_4 = Operator_ts_4_1;
        },
        function (id_ts_3_1) {
          id_ts_3 = id_ts_3_1;
        },
        function (assert_ts_2_1) {
          assert_ts_2 = assert_ts_2_1;
        },
        function (typeGuard_ts_3_1) {
          typeGuard_ts_3 = typeGuard_ts_3_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/genericOperators/throttleTime",
  ["https://deno.land/x/evt/lib/util/compose"],
  function (exports_77, context_77) {
    "use strict";
    var compose_ts_1, throttleTime;
    var __moduleName = context_77 && context_77.id;
    return {
      setters: [
        function (compose_ts_1_1) {
          compose_ts_1 = compose_ts_1_1;
        },
      ],
      execute: function () {
        exports_77(
          "throttleTime",
          throttleTime = (duration) =>
            compose_ts_1.compose([
              (data, { lastClick }) => {
                const now = Date.now();
                return now - lastClick < duration
                  ? null
                  : [{ data, "lastClick": now }];
              },
              { "lastClick": 0, "data": null },
            ], ({ data }) => [data]),
        );
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/genericOperators/to",
  [],
  function (exports_78, context_78) {
    "use strict";
    var to;
    var __moduleName = context_78 && context_78.id;
    return {
      setters: [],
      execute: function () {
        exports_78(
          "to",
          to = (eventName) =>
            (data) => data[0] !== eventName ? null : [data[1]],
        );
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/genericOperators/index",
  [
    "https://deno.land/x/evt/lib/util/genericOperators/throttleTime",
    "https://deno.land/x/evt/lib/util/genericOperators/to",
  ],
  function (exports_79, context_79) {
    "use strict";
    var __moduleName = context_79 && context_79.id;
    return {
      setters: [
        function (throttleTime_ts_1_1) {
          exports_79({
            "throttleTime": throttleTime_ts_1_1["throttleTime"],
          });
        },
        function (to_ts_1_1) {
          exports_79({
            "to": to_ts_1_1["to"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/util/index",
  [
    "https://deno.land/x/evt/lib/util/genericOperators/index",
    "https://deno.land/x/evt/lib/util/compose",
    "https://deno.land/x/evt/lib/util/invokeOperator",
  ],
  function (exports_80, context_80) {
    "use strict";
    var __moduleName = context_80 && context_80.id;
    var exportedNames_3 = {
      "compose": true,
      "invokeOperator": true,
    };
    function exportStar_5(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default" && !exportedNames_3.hasOwnProperty(n)) {
          exports[n] = m[n];
        }
      }
      exports_80(exports);
    }
    return {
      setters: [
        function (index_ts_5_1) {
          exportStar_5(index_ts_5_1);
        },
        function (compose_ts_2_1) {
          exports_80({
            "compose": compose_ts_2_1["compose"],
          });
        },
        function (invokeOperator_ts_2_1) {
          exports_80({
            "invokeOperator": invokeOperator_ts_2_1["invokeOperator"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Map",
  [],
  function (exports_81, context_81) {
    "use strict";
    var LightMapImpl, Polyfill;
    var __moduleName = context_81 && context_81.id;
    return {
      setters: [],
      execute: function () {
        LightMapImpl = class LightMapImpl {
          constructor() {
            this.record = [];
          }
          has(key) {
            return this.record
              .map(([_key]) => _key)
              .indexOf(key) >= 0;
          }
          get(key) {
            const [entry] = this.record
              .filter(([_key]) => _key === key);
            if (entry === undefined) {
              return undefined;
            }
            return entry[1];
          }
          set(key, value) {
            const [entry] = this.record
              .filter(([_key]) => _key === key);
            if (entry === undefined) {
              this.record.push([key, value]);
            } else {
              entry[1] = value;
            }
            return this;
          }
          delete(key) {
            const index = this.record.map(([key]) => key).indexOf(key);
            if (index < 0) {
              return false;
            }
            this.record.splice(index, 1);
            return true;
          }
          keys() {
            return this.record.map(([key]) => key);
          }
        };
        exports_81("LightMapImpl", LightMapImpl);
        exports_81(
          "Polyfill",
          Polyfill = typeof Map !== "undefined" ? Map : LightMapImpl,
        );
      },
    };
  },
);
System.register(
  "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Set",
  ["https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Map"],
  function (exports_82, context_82) {
    "use strict";
    var Map_ts_1, LightSetImpl, Polyfill;
    var __moduleName = context_82 && context_82.id;
    return {
      setters: [
        function (Map_ts_1_1) {
          Map_ts_1 = Map_ts_1_1;
        },
      ],
      execute: function () {
        LightSetImpl = class LightSetImpl {
          constructor(values) {
            this.map = new Map_ts_1.Polyfill();
            if (values === undefined) {
              return;
            }
            for (let value of values) {
              this.add(value);
            }
          }
          has(value) {
            return this.map.has(value);
          }
          add(value) {
            this.map.set(value, true);
            return this;
          }
          values() {
            return this.map.keys();
          }
          delete(value) {
            return this.map.delete(value);
          }
        };
        exports_82("LightSetImpl", LightSetImpl);
        exports_82(
          "Polyfill",
          Polyfill = typeof Set !== "undefined" ? Set : LightSetImpl,
        );
      },
    };
  },
);
System.register(
  "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/WeakMap",
  ["https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Map"],
  function (exports_83, context_83) {
    "use strict";
    var Map_ts_2, Polyfill;
    var __moduleName = context_83 && context_83.id;
    return {
      setters: [
        function (Map_ts_2_1) {
          Map_ts_2 = Map_ts_2_1;
        },
      ],
      execute: function () {
        exports_83(
          "Polyfill",
          Polyfill = typeof WeakMap !== "undefined"
            ? WeakMap
            : Map_ts_2.Polyfill,
        );
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp",
  [],
  function (exports_84, context_84) {
    "use strict";
    var overwriteReadonlyProp;
    var __moduleName = context_84 && context_84.id;
    return {
      setters: [],
      execute: function () {
        /**
             * Assign a value to a property even if the object is freezed or if the property is not writable
             * Throw if the assignation fail ( for example if the property is non configurable write: false )
             * */
        exports_84(
          "overwriteReadonlyProp",
          overwriteReadonlyProp = (obj, propertyName, value) => {
            try {
              obj[propertyName] = value;
            } catch {
            }
            if (obj[propertyName] === value) {
              return value;
            }
            let errorDefineProperty = undefined;
            const propertyDescriptor =
              Object.getOwnPropertyDescriptor(obj, propertyName) ?? {
                "enumerable": true,
                "configurable": true,
              };
            if (!!propertyDescriptor.get) {
              throw new Error(
                `Probably a wrong ides to overwrite ${propertyName} getter`,
              );
            }
            try {
              Object.defineProperty(obj, propertyName, {
                ...propertyDescriptor,
                value,
              });
            } catch (error) {
              errorDefineProperty = error;
            }
            if (obj[propertyName] !== value) {
              throw errorDefineProperty ?? new Error("Can't assign");
            }
            return value;
          },
        );
      },
    };
  },
);
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, "find", {
    value: function (predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;
      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== "function") {
        throw new TypeError("predicate must be a function");
      }
      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];
      // 5. Let k be 0.
      var k = 0;
      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }
      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true,
  });
}
System.register(
  "https://deno.land/x/evt/lib/Evt.create",
  ["https://deno.land/x/evt/lib/importProxy"],
  function (exports_85, context_85) {
    "use strict";
    var importProxy_ts_1;
    var __moduleName = context_85 && context_85.id;
    function create(...args) {
      return args.length === 0
        ? new importProxy_ts_1.importProxy.Evt()
        : new importProxy_ts_1.importProxy.StatefulEvt(args[0]);
    }
    exports_85("create", create);
    return {
      setters: [
        function (importProxy_ts_1_1) {
          importProxy_ts_1 = importProxy_ts_1_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.getCtx",
  [
    "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/WeakMap",
    "https://deno.land/x/evt/lib/importProxy",
  ],
  function (exports_86, context_86) {
    "use strict";
    var WeakMap_ts_1, importProxy_ts_2;
    var __moduleName = context_86 && context_86.id;
    /**
     * https://docs.evt.land/api/evt/getctx
     *
     * Evt.weakCtx(obj) always return the same instance of VoidCtx for a given object.
     * No strong reference to the object is created
     * when the object is no longer referenced it's associated Ctx will be freed from memory.
     */
    function getCtxFactory() {
      const ctxByObj = new WeakMap_ts_1.Polyfill();
      function getCtx(obj) {
        let ctx = ctxByObj.get(obj);
        if (ctx === undefined) {
          ctx = (new importProxy_ts_2.importProxy.Ctx());
          ctxByObj.set(obj, ctx);
        }
        return ctx;
      }
      return getCtx;
    }
    exports_86("getCtxFactory", getCtxFactory);
    return {
      setters: [
        function (WeakMap_ts_1_1) {
          WeakMap_ts_1 = WeakMap_ts_1_1;
        },
        function (importProxy_ts_2_1) {
          importProxy_ts_2 = importProxy_ts_2_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.factorize",
  [],
  function (exports_87, context_87) {
    "use strict";
    var __moduleName = context_87 && context_87.id;
    /** https://docs.evt.land/api/evt/factorize */
    function factorize(evt) {
      return evt;
    }
    exports_87("factorize", factorize);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.merge",
  ["https://deno.land/x/evt/lib/importProxy"],
  function (exports_88, context_88) {
    "use strict";
    var importProxy_ts_3;
    var __moduleName = context_88 && context_88.id;
    function mergeImpl(ctx, evts) {
      const evtUnion = new importProxy_ts_3.importProxy.Evt();
      const callback = (data) => evtUnion.post(data);
      evts.forEach((evt) => {
        if (ctx === undefined) {
          evt.attach(callback);
        } else {
          evt.attach(ctx, callback);
        }
      });
      return evtUnion;
    }
    exports_88("mergeImpl", mergeImpl);
    function merge(p1, p2) {
      return "length" in p1 ? mergeImpl(undefined, p1) : mergeImpl(p1, p2);
    }
    exports_88("merge", merge);
    return {
      setters: [
        function (importProxy_ts_3_1) {
          importProxy_ts_3 = importProxy_ts_3_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.from",
  [
    "https://deno.land/x/evt/tools/typeSafety/id",
    "https://deno.land/x/evt/tools/typeSafety/assert",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
    "https://deno.land/x/evt/lib/types/EventTargetLike",
    "https://deno.land/x/evt/lib/Evt.merge",
    "https://deno.land/x/evt/lib/importProxy",
  ],
  function (exports_89, context_89) {
    "use strict";
    var id_ts_4,
      assert_ts_3,
      typeGuard_ts_4,
      EventTargetLike_ts_2,
      Evt_merge_ts_1,
      importProxy_ts_4;
    var __moduleName = context_89 && context_89.id;
    function fromImpl(ctx, target, eventName, options) {
      if ("then" in target) {
        const evt = new importProxy_ts_4.importProxy.Evt();
        const isCtxDone = (() => {
          const getEvtDonePostCount = () => ctx?.evtDoneOrAborted.postCount;
          const n = getEvtDonePostCount();
          return () => n !== getEvtDonePostCount();
        })();
        target.then((data) => {
          if (isCtxDone()) {
            return;
          }
          evt.post(data);
        });
        return evt;
      }
      if ("length" in target) {
        return Evt_merge_ts_1.mergeImpl(
          ctx,
          Array.from(target).map((target) =>
            fromImpl(ctx, target, eventName, options)
          ),
        );
      }
      let proxy;
      if (
        EventTargetLike_ts_2.EventTargetLike.NodeStyleEventEmitter.match(target)
      ) {
        proxy = {
          "on": (listener, eventName) =>
            target.addListener(eventName, listener),
          "off": (listener, eventName) =>
            target.removeListener(eventName, listener),
        };
      } else if (
        EventTargetLike_ts_2.EventTargetLike.JQueryStyleEventEmitter.match(
          target,
        )
      ) {
        proxy = {
          "on": (listener, eventName) => target.on(eventName, listener),
          "off": (listener, eventName) => target.off(eventName, listener),
        };
      } else if (
        EventTargetLike_ts_2.EventTargetLike.HasEventTargetAddRemove.match(
          target,
        )
      ) {
        proxy = {
          "on": (listener, eventName, options) =>
            target.addEventListener(eventName, listener, options),
          "off": (listener, eventName, options) =>
            target.removeEventListener(eventName, listener, options),
        };
      } else if (
        EventTargetLike_ts_2.EventTargetLike.RxJSSubject.match(target)
      ) {
        let subscription;
        proxy = {
          "on": (listener) =>
            subscription = target.subscribe((data) => listener(data)),
          "off": () => subscription.unsubscribe(),
        };
      } else {
        id_ts_4.id(target);
        assert_ts_3.assert(false);
      }
      const evt = new importProxy_ts_4.importProxy.Evt();
      const listener = (data) => evt.post(data);
      ctx?.evtDoneOrAborted.attachOnce(() =>
        proxy.off(listener, eventName, options)
      );
      proxy.on(listener, eventName, options);
      return evt;
    }
    function from(ctxOrTarget, targetOrEventName, eventNameOrOptions, options) {
      if ("evtDoneOrAborted" in ctxOrTarget) {
        assert_ts_3.assert(
          typeGuard_ts_4.typeGuard(targetOrEventName) &&
            typeGuard_ts_4.typeGuard(eventNameOrOptions) &&
            typeGuard_ts_4.typeGuard(options),
        );
        return fromImpl(
          ctxOrTarget,
          targetOrEventName,
          eventNameOrOptions,
          options,
        );
      } else {
        assert_ts_3.assert(
          typeGuard_ts_4.typeGuard(targetOrEventName) &&
            typeGuard_ts_4.typeGuard(eventNameOrOptions),
        );
        return fromImpl(
          undefined,
          ctxOrTarget,
          targetOrEventName,
          eventNameOrOptions,
        );
      }
    }
    exports_89("from", from);
    return {
      setters: [
        function (id_ts_4_1) {
          id_ts_4 = id_ts_4_1;
        },
        function (assert_ts_3_1) {
          assert_ts_3 = assert_ts_3_1;
        },
        function (typeGuard_ts_4_1) {
          typeGuard_ts_4 = typeGuard_ts_4_1;
        },
        function (EventTargetLike_ts_2_1) {
          EventTargetLike_ts_2 = EventTargetLike_ts_2_1;
        },
        function (Evt_merge_ts_1_1) {
          Evt_merge_ts_1 = Evt_merge_ts_1_1;
        },
        function (importProxy_ts_4_1) {
          importProxy_ts_4 = importProxy_ts_4_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.useEffect",
  [],
  function (exports_90, context_90) {
    "use strict";
    var __moduleName = context_90 && context_90.id;
    function useEffect(effect, evt, dataFirst) {
      let i = 0;
      ("state" in evt ? evt.evtChange : evt)
        .attach((data) => effect(data, { "isFirst": false, data }, i++));
      effect(
        "state" in evt ? evt.state : dataFirst?.[0],
        { "isFirst": true },
        i++,
      );
    }
    exports_90("useEffect", useEffect);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.asPostable",
  [],
  function (exports_91, context_91) {
    "use strict";
    var __moduleName = context_91 && context_91.id;
    /**
     * https://docs.evt.land/api/evt/aspostable
     * ⚠ UNSAFE ⚠ - Please refer to documentation before using.
     * */
    function asPostable(evt) {
      return evt;
    }
    exports_91("asPostable", asPostable);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.asNonPostable",
  [],
  function (exports_92, context_92) {
    "use strict";
    var __moduleName = context_92 && context_92.id;
    //type EvtLike<T>= import("./types/helper/UnpackEvt.ts").EvtLike<T>;
    //type EvtLike<T>= import("./types/helper/UnpackEvt.ts").EvtLike<T>;
    /** https://docs.evt.land/api/evt/asnonpostable */
    function asNonPostable(evt) {
      return evt;
    }
    exports_92("asNonPostable", asNonPostable);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.parsePropsFromArgs",
  [
    "https://deno.land/x/evt/tools/typeSafety/id",
    "https://deno.land/x/evt/lib/util/compose",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
  ],
  function (exports_93, context_93) {
    "use strict";
    var id_ts_5, compose_ts_3, typeGuard_ts_5, canBeOperator, defaultParams;
    var __moduleName = context_93 && context_93.id;
    function matchAll() {
      return true;
    }
    exports_93("matchAll", matchAll);
    function parsePropsFromArgs(inputs, methodName) {
      typeGuard_ts_5.typeGuard(defaultParams);
      switch (methodName) {
        case "pipe":
          {
            //[]
            //[undefined] ( not valid but user would expect it to work )
            //[ ctx, ...op[] ]
            //[ ...op[] ]
            const getOpWrap = (ops) =>
              ops.length === 0 ? {} : {
                "op": ops.length === 1
                  ? ops[0]
                  : compose_ts_3.compose(...ops),
              };
            if (canBeOperator(inputs[0])) {
              //[ ...op[] ]
              return id_ts_5.id({
                ...defaultParams,
                ...getOpWrap(inputs),
              });
            } else {
              //[]
              //[ ctx, ...Operator.fλ[] ]
              const [ctx, ...rest] = inputs;
              return id_ts_5.id({
                ...defaultParams,
                ...(ctx !== undefined ? { ctx } : {}),
                ...getOpWrap(rest),
              });
            }
          }
          break;
        case "waitFor":
          {
            //[ op, ctx, timeout ]
            //[ op, ctx, undefined ]
            //[ op, ctx ]
            //[ op, timeout ]
            //[ op, undefined ]
            //[ ctx, timeout ]
            //[ ctx, undefined ]
            //[ op ]
            //[ ctx ]
            //[ timeout ]
            //[ undefined ]
            //[ callback ]
            return parsePropsFromArgs([
              //If the last element is undefined, remove it.
              ...inputs.filter((value, index) =>
                !(index === inputs.length - 1 &&
                  value === undefined)
              ),
              defaultParams.callback,
            ], "attach*");
          }
          break;
        case "attach*":
          {
            //NOTE: when callback is undefined call has been forward from waitFor.
            //[ op, ctx, timeout, callback ]
            //[ op, ctx, timeout, undefined ]
            //[ op, ctx, callback ]
            //[ op, ctx, undefined ]
            //[ op, timeout, callback ]
            //[ op, timeout, undefined ]
            //[ ctx, timeout, callback ]
            //[ ctx, timeout, undefined ]
            //[ op, callback ]
            //[ op, undefined ]
            //[ ctx, callback ]
            //[ ctx, undefined ]
            //[ timeout, callback ]
            //[ timeout, undefined ]
            //[ callback ]
            //[ undefined ]
            const n = inputs.length;
            switch (n) {
              case 4: {
                //[ op, ctx, timeout, callback ]
                const [p1, p2, p3, p4] = inputs;
                return id_ts_5.id({
                  ...defaultParams,
                  "op": p1,
                  "ctx": p2,
                  "timeout": p3,
                  "callback": p4,
                });
              }
              case 3: {
                //[ op, ctx, callback ]
                //[ op, timeout, callback ]
                //[ ctx, timeout, callback ]
                const [p1, p2, p3] = inputs;
                if (typeof p2 === "number") {
                  //[ op, timeout, callback ]
                  //[ ctx, timeout, callback ]
                  const timeout = p2;
                  const callback = p3;
                  if (canBeOperator(p1)) {
                    //[ op, timeout, callback ]
                    return id_ts_5.id({
                      ...defaultParams,
                      timeout,
                      callback,
                      "op": p1,
                    });
                  } else {
                    //[ ctx, timeout, callback ]
                    return id_ts_5.id({
                      ...defaultParams,
                      timeout,
                      callback,
                      "ctx": p1,
                    });
                  }
                } else {
                  //[ op, ctx, callback ]
                  return id_ts_5.id({
                    ...defaultParams,
                    "op": p1,
                    "ctx": p2,
                    "callback": p3,
                  });
                }
              }
              case 2: {
                //[ op, callback ]
                //[ ctx, callback ]
                //[ timeout, callback ]
                const [p1, p2] = inputs;
                if (typeof p1 === "number") {
                  //[ timeout, callback ]
                  return id_ts_5.id({
                    ...defaultParams,
                    "timeout": p1,
                    "callback": p2,
                  });
                } else {
                  //[ op, callback ]
                  //[ ctx, callback ]
                  const callback = p2;
                  if (canBeOperator(p1)) {
                    return id_ts_5.id({
                      ...defaultParams,
                      callback,
                      "op": p1,
                    });
                  } else {
                    return id_ts_5.id({
                      ...defaultParams,
                      callback,
                      "ctx": p1,
                    });
                  }
                }
              }
              case 1: {
                //[ callback ]
                const [p] = inputs;
                return id_ts_5.id({
                  ...defaultParams,
                  "callback": p,
                });
              }
              case 0: {
                return id_ts_5.id({ ...defaultParams });
              }
            }
          }
          break;
      }
    }
    exports_93("parsePropsFromArgs", parsePropsFromArgs);
    return {
      setters: [
        function (id_ts_5_1) {
          id_ts_5 = id_ts_5_1;
        },
        function (compose_ts_3_1) {
          compose_ts_3 = compose_ts_3_1;
        },
        function (typeGuard_ts_5_1) {
          typeGuard_ts_5 = typeGuard_ts_5_1;
        },
      ],
      execute: function () {
        canBeOperator = (p) => {
          return (p !== undefined &&
            typeGuard_ts_5.typeGuard(p) &&
            (typeof p === "function" ||
              typeof p[0] === "function"));
        };
        defaultParams = {
          "op": matchAll,
          "ctx": undefined,
          "timeout": undefined,
          "callback": undefined,
        };
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.newCtx",
  ["https://deno.land/x/evt/lib/importProxy"],
  function (exports_94, context_94) {
    "use strict";
    var importProxy_ts_5;
    var __moduleName = context_94 && context_94.id;
    function newCtx() {
      return new importProxy_ts_5.importProxy.Ctx();
    }
    exports_94("newCtx", newCtx);
    return {
      setters: [
        function (importProxy_ts_5_1) {
          importProxy_ts_5 = importProxy_ts_5_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
  [],
  function (exports_95, context_95) {
    "use strict";
    var defineAccessors;
    var __moduleName = context_95 && context_95.id;
    return {
      setters: [],
      execute: function () {
        exports_95(
          "defineAccessors",
          defineAccessors = (obj, propertyName, propertyDescriptor) => {
            const { get, set } = propertyDescriptor;
            Object.defineProperty(obj, propertyName, {
              ...(Object.getOwnPropertyDescriptor(obj, propertyName) ?? {
                "enumerable": true,
                "configurable": true,
              }),
              ...(get !== undefined
                ? {
                  "get": function () {
                    return get.call(this);
                  },
                }
                : {}),
              ...(set !== undefined
                ? {
                  "set": function (value) {
                    set.call(this, value);
                  },
                }
                : {}),
            });
          },
        );
      },
    };
  },
);
System.register(
  "https://raw.githubusercontent.com/garronej/run_exclusive/2.1.18/lib/runExclusive",
  ["https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/WeakMap"],
  function (exports_96, context_96) {
    "use strict";
    var WeakMap_ts_2,
      ExecQueue,
      globalContext,
      clusters,
      groupByRunExclusiveFunction;
    var __moduleName = context_96 && context_96.id;
    //console.log("Map version");
    //export const clusters = new Map<Object, Map<GroupRef,ExecQueue>>();
    function getOrCreateExecQueue(context, groupRef) {
      let execQueueByGroup = clusters.get(context);
      if (!execQueueByGroup) {
        execQueueByGroup = new WeakMap_ts_2.Polyfill();
        clusters.set(context, execQueueByGroup);
      }
      let execQueue = execQueueByGroup.get(groupRef);
      if (!execQueue) {
        execQueue = new ExecQueue();
        execQueueByGroup.set(groupRef, execQueue);
      }
      return execQueue;
    }
    function createGroupRef() {
      return new Array(0);
    }
    exports_96("createGroupRef", createGroupRef);
    function build(...inputs) {
      switch (inputs.length) {
        case 1:
          return buildFnPromise(true, createGroupRef(), inputs[0]);
        case 2:
          return buildFnPromise(true, inputs[0], inputs[1]);
      }
    }
    exports_96("build", build);
    function buildMethod(...inputs) {
      switch (inputs.length) {
        case 1:
          return buildFnPromise(false, createGroupRef(), inputs[0]);
        case 2:
          return buildFnPromise(false, inputs[0], inputs[1]);
      }
    }
    exports_96("buildMethod", buildMethod);
    /**
     *
     * Get the number of queued call of a run-exclusive function.
     * Note that if you call a runExclusive function and call this
     * directly after it will return 0 as there is one function call
     * execution ongoing but 0 queued.
     *
     * The classInstanceObject parameter is to provide only for the run-exclusive
     * function created with 'buildMethod[Cb].
     *
     * */
    function getQueuedCallCount(runExclusiveFunction, classInstanceObject) {
      const execQueue = getExecQueueByFunctionAndContext(
        runExclusiveFunction,
        classInstanceObject,
      );
      return execQueue ? execQueue.queuedCalls.length : 0;
    }
    exports_96("getQueuedCallCount", getQueuedCallCount);
    /**
     *
     * Cancel all queued calls of a run-exclusive function.
     * Note that the current running call will not be cancelled.
     *
     * The classInstanceObject parameter is to provide only for the run-exclusive
     * function created with 'buildMethod[Cb].
     *
     */
    function cancelAllQueuedCalls(runExclusiveFunction, classInstanceObject) {
      const execQueue = getExecQueueByFunctionAndContext(
        runExclusiveFunction,
        classInstanceObject,
      );
      return execQueue ? execQueue.cancelAllQueuedCalls() : 0;
    }
    exports_96("cancelAllQueuedCalls", cancelAllQueuedCalls);
    /**
     * Tell if a run-exclusive function has an instance of it's call currently being
     * performed.
     *
     * The classInstanceObject parameter is to provide only for the run-exclusive
     * function created with 'buildMethod[Cb].
     */
    function isRunning(runExclusiveFunction, classInstanceObject) {
      const execQueue = getExecQueueByFunctionAndContext(
        runExclusiveFunction,
        classInstanceObject,
      );
      return execQueue ? execQueue.isRunning : false;
    }
    exports_96("isRunning", isRunning);
    /**
     * Return a promise that resolve when all the current queued call of a runExclusive functions
     * have completed.
     *
     * The classInstanceObject parameter is to provide only for the run-exclusive
     * function created with 'buildMethod[Cb].
     */
    function getPrComplete(runExclusiveFunction, classInstanceObject) {
      const execQueue = getExecQueueByFunctionAndContext(
        runExclusiveFunction,
        classInstanceObject,
      );
      return execQueue ? execQueue.prComplete : Promise.resolve();
    }
    exports_96("getPrComplete", getPrComplete);
    function getExecQueueByFunctionAndContext(
      runExclusiveFunction,
      context = globalContext,
    ) {
      const groupRef = groupByRunExclusiveFunction.get(runExclusiveFunction);
      if (!groupRef) {
        throw Error("Not a run exclusiveFunction");
      }
      const execQueueByGroup = clusters.get(context);
      if (!execQueueByGroup) {
        return undefined;
      }
      return execQueueByGroup.get(groupRef);
    }
    function buildFnPromise(isGlobal, groupRef, fun) {
      let execQueue;
      const runExclusiveFunction = (function (...inputs) {
        if (!isGlobal) {
          if (!(this instanceof Object)) {
            throw new Error("Run exclusive, <this> should be an object");
          }
          execQueue = getOrCreateExecQueue(this, groupRef);
        }
        return new Promise((resolve, reject) => {
          let onPrCompleteResolve;
          execQueue.prComplete = new Promise((resolve) =>
            onPrCompleteResolve = () => resolve()
          );
          const onComplete = (result) => {
            onPrCompleteResolve();
            execQueue.isRunning = false;
            if (execQueue.queuedCalls.length) {
              execQueue.queuedCalls.shift()();
            }
            if ("data" in result) {
              resolve(result.data);
            } else {
              reject(result.reason);
            }
          };
          (function callee(...inputs) {
            if (execQueue.isRunning) {
              execQueue.queuedCalls.push(() => callee.apply(this, inputs));
              return;
            }
            execQueue.isRunning = true;
            try {
              fun.apply(this, inputs)
                .then((data) => onComplete({ data }))
                .catch((reason) => onComplete({ reason }));
            } catch (error) {
              onComplete({ "reason": error });
            }
          }).apply(this, inputs);
        });
      });
      if (isGlobal) {
        execQueue = getOrCreateExecQueue(globalContext, groupRef);
      }
      groupByRunExclusiveFunction.set(runExclusiveFunction, groupRef);
      return runExclusiveFunction;
    }
    function buildCb(...inputs) {
      switch (inputs.length) {
        case 1:
          return buildFnCallback(true, createGroupRef(), inputs[0]);
        case 2:
          return buildFnCallback(true, inputs[0], inputs[1]);
      }
    }
    exports_96("buildCb", buildCb);
    function buildMethodCb(...inputs) {
      switch (inputs.length) {
        case 1:
          return buildFnCallback(false, createGroupRef(), inputs[0]);
        case 2:
          return buildFnCallback(false, inputs[0], inputs[1]);
      }
    }
    exports_96("buildMethodCb", buildMethodCb);
    function buildFnCallback(isGlobal, groupRef, fun) {
      let execQueue;
      const runExclusiveFunction = (function (...inputs) {
        if (!isGlobal) {
          if (!(this instanceof Object)) {
            throw new Error("Run exclusive, <this> should be an object");
          }
          execQueue = getOrCreateExecQueue(this, groupRef);
        }
        let callback = undefined;
        if (inputs.length && typeof inputs[inputs.length - 1] === "function") {
          callback = inputs.pop();
        }
        let onPrCompleteResolve;
        execQueue.prComplete = new Promise((resolve) =>
          onPrCompleteResolve = () => resolve()
        );
        const onComplete = (...inputs) => {
          onPrCompleteResolve();
          execQueue.isRunning = false;
          if (execQueue.queuedCalls.length) {
            execQueue.queuedCalls.shift()();
          }
          if (callback) {
            callback.apply(this, inputs);
          }
        };
        onComplete.hasCallback = !!callback;
        (function callee(...inputs) {
          if (execQueue.isRunning) {
            execQueue.queuedCalls.push(() => callee.apply(this, inputs));
            return;
          }
          execQueue.isRunning = true;
          try {
            fun.apply(this, [...inputs, onComplete]);
          } catch (error) {
            error.message +=
              " ( This exception should not have been thrown, miss use of run-exclusive buildCb )";
            throw error;
          }
        }).apply(this, inputs);
      });
      if (isGlobal) {
        execQueue = getOrCreateExecQueue(globalContext, groupRef);
      }
      groupByRunExclusiveFunction.set(runExclusiveFunction, groupRef);
      return runExclusiveFunction;
    }
    return {
      setters: [
        function (WeakMap_ts_2_1) {
          WeakMap_ts_2 = WeakMap_ts_2_1;
        },
      ],
      execute: function () {
        ExecQueue = class ExecQueue {
          constructor() {
            this.queuedCalls = [];
            this.isRunning = false;
            this.prComplete = Promise.resolve();
          }
          //TODO: move where it is used.
          cancelAllQueuedCalls() {
            let n;
            this.queuedCalls.splice(0, n = this.queuedCalls.length);
            return n;
          }
        };
        globalContext = {};
        clusters = new WeakMap_ts_2.Polyfill();
        groupByRunExclusiveFunction = new WeakMap_ts_2.Polyfill();
      },
    };
  },
);
System.register(
  "https://raw.githubusercontent.com/garronej/run_exclusive/2.1.18/mod",
  ["https://raw.githubusercontent.com/garronej/run_exclusive/2.1.18/lib/runExclusive"],
  function (exports_97, context_97) {
    "use strict";
    var __moduleName = context_97 && context_97.id;
    function exportStar_6(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default") exports[n] = m[n];
      }
      exports_97(exports);
    }
    return {
      setters: [
        function (runExclusive_ts_1_1) {
          exportStar_6(runExclusive_ts_1_1);
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/tools/Deferred",
  ["https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp"],
  function (exports_98, context_98) {
    "use strict";
    var overwriteReadonlyProp_ts_1, Deferred, VoidDeferred;
    var __moduleName = context_98 && context_98.id;
    return {
      setters: [
        function (overwriteReadonlyProp_ts_1_1) {
          overwriteReadonlyProp_ts_1 = overwriteReadonlyProp_ts_1_1;
        },
      ],
      execute: function () {
        Deferred = class Deferred {
          constructor() {
            this.isPending = true;
            let resolve;
            let reject;
            this.pr = new Promise((resolve_, reject_) => {
              resolve = (value) => {
                overwriteReadonlyProp_ts_1.overwriteReadonlyProp(
                  this,
                  "isPending",
                  false,
                );
                resolve_(value);
              };
              reject = (error) => {
                overwriteReadonlyProp_ts_1.overwriteReadonlyProp(
                  this,
                  "isPending",
                  false,
                );
                reject_(error);
              };
            });
            this.resolve = resolve;
            this.reject = reject;
          }
        };
        exports_98("Deferred", Deferred);
        VoidDeferred = class VoidDeferred extends Deferred {
        };
        exports_98("VoidDeferred", VoidDeferred);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt.loosenType",
  [],
  function (exports_99, context_99) {
    "use strict";
    var __moduleName = context_99 && context_99.id;
    /**
     * https://docs.evt.land/api/evt/loosenType
     */
    function loosenType(evt) {
      return evt;
    }
    exports_99("loosenType", loosenType);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Evt",
  [
    "https://raw.github.com/garronej/minimal_polyfills/2.0.1/Array.prototype.find.ts",
    "https://deno.land/x/evt/lib/importProxy",
    "https://deno.land/x/evt/lib/Evt.create",
    "https://deno.land/x/evt/lib/Evt.getCtx",
    "https://deno.land/x/evt/lib/Evt.factorize",
    "https://deno.land/x/evt/lib/Evt.merge",
    "https://deno.land/x/evt/lib/Evt.from",
    "https://deno.land/x/evt/lib/Evt.useEffect",
    "https://deno.land/x/evt/lib/Evt.asPostable",
    "https://deno.land/x/evt/lib/Evt.asNonPostable",
    "https://deno.land/x/evt/lib/Evt.parsePropsFromArgs",
    "https://deno.land/x/evt/lib/Evt.newCtx",
    "https://deno.land/x/evt/lib/LazyEvt",
    "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
    "https://deno.land/x/evt/lib/util/invokeOperator",
    "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Map",
    "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/WeakMap",
    "https://raw.githubusercontent.com/garronej/run_exclusive/2.1.18/mod",
    "https://deno.land/x/evt/lib/types/EvtError",
    "https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
    "https://deno.land/x/evt/lib/util/encapsulateOpState",
    "https://deno.land/x/evt/tools/Deferred",
    "https://deno.land/x/evt/lib/Evt.loosenType",
    "https://deno.land/x/evt/lib/types/interfaces/CtxLike",
    "https://deno.land/x/evt/lib/types/Operator",
  ],
  function (exports_100, context_100) {
    "use strict";
    var importProxy_ts_6,
      Evt_create_ts_1,
      Evt_getCtx_ts_1,
      Evt_factorize_ts_1,
      Evt_merge_ts_2,
      Evt_from_ts_1,
      Evt_useEffect_ts_1,
      Evt_asPostable_ts_1,
      Evt_asNonPostable_ts_1,
      Evt_parsePropsFromArgs_ts_1,
      Evt_newCtx_ts_1,
      LazyEvt_ts_1,
      defineAccessors_ts_1,
      invokeOperator_ts_3,
      Map_ts_3,
      WeakMap_ts_3,
      runExclusive,
      EvtError_ts_2,
      overwriteReadonlyProp_ts_2,
      typeGuard_ts_6,
      encapsulateOpState_ts_2,
      Deferred_ts_1,
      Evt_loosenType_ts_1,
      CtxLike_ts_2,
      Operator_ts_5,
      safeSetTimeout,
      safeClearTimeout,
      EvtImpl,
      Evt;
    var __moduleName = context_100 && context_100.id;
    return {
      setters: [
        function (_1) {
        },
        function (importProxy_ts_6_1) {
          importProxy_ts_6 = importProxy_ts_6_1;
        },
        function (Evt_create_ts_1_1) {
          Evt_create_ts_1 = Evt_create_ts_1_1;
        },
        function (Evt_getCtx_ts_1_1) {
          Evt_getCtx_ts_1 = Evt_getCtx_ts_1_1;
        },
        function (Evt_factorize_ts_1_1) {
          Evt_factorize_ts_1 = Evt_factorize_ts_1_1;
        },
        function (Evt_merge_ts_2_1) {
          Evt_merge_ts_2 = Evt_merge_ts_2_1;
        },
        function (Evt_from_ts_1_1) {
          Evt_from_ts_1 = Evt_from_ts_1_1;
        },
        function (Evt_useEffect_ts_1_1) {
          Evt_useEffect_ts_1 = Evt_useEffect_ts_1_1;
        },
        function (Evt_asPostable_ts_1_1) {
          Evt_asPostable_ts_1 = Evt_asPostable_ts_1_1;
        },
        function (Evt_asNonPostable_ts_1_1) {
          Evt_asNonPostable_ts_1 = Evt_asNonPostable_ts_1_1;
        },
        function (Evt_parsePropsFromArgs_ts_1_1) {
          Evt_parsePropsFromArgs_ts_1 = Evt_parsePropsFromArgs_ts_1_1;
        },
        function (Evt_newCtx_ts_1_1) {
          Evt_newCtx_ts_1 = Evt_newCtx_ts_1_1;
        },
        function (LazyEvt_ts_1_1) {
          LazyEvt_ts_1 = LazyEvt_ts_1_1;
        },
        function (defineAccessors_ts_1_1) {
          defineAccessors_ts_1 = defineAccessors_ts_1_1;
        },
        function (invokeOperator_ts_3_1) {
          invokeOperator_ts_3 = invokeOperator_ts_3_1;
        },
        function (Map_ts_3_1) {
          Map_ts_3 = Map_ts_3_1;
        },
        function (WeakMap_ts_3_1) {
          WeakMap_ts_3 = WeakMap_ts_3_1;
        },
        function (runExclusive_1) {
          runExclusive = runExclusive_1;
        },
        function (EvtError_ts_2_1) {
          EvtError_ts_2 = EvtError_ts_2_1;
        },
        function (overwriteReadonlyProp_ts_2_1) {
          overwriteReadonlyProp_ts_2 = overwriteReadonlyProp_ts_2_1;
        },
        function (typeGuard_ts_6_1) {
          typeGuard_ts_6 = typeGuard_ts_6_1;
        },
        function (encapsulateOpState_ts_2_1) {
          encapsulateOpState_ts_2 = encapsulateOpState_ts_2_1;
        },
        function (Deferred_ts_1_1) {
          Deferred_ts_1 = Deferred_ts_1_1;
        },
        function (Evt_loosenType_ts_1_1) {
          Evt_loosenType_ts_1 = Evt_loosenType_ts_1_1;
        },
        function (CtxLike_ts_2_1) {
          CtxLike_ts_2 = CtxLike_ts_2_1;
        },
        function (Operator_ts_5_1) {
          Operator_ts_5 = Operator_ts_5_1;
        },
      ],
      execute: function () {
        safeSetTimeout = (callback, ms) => setTimeout(callback, ms);
        safeClearTimeout = (timer) => clearTimeout(timer);
        EvtImpl = /** @class */ (() => {
          class EvtImpl {
            constructor() {
              this.lazyEvtAttach = new LazyEvt_ts_1.LazyEvt();
              this.lazyEvtDetach = new LazyEvt_ts_1.LazyEvt();
              this.__maxHandlers = undefined;
              this.postCount = 0;
              this.traceId = null;
              this.handlers = [];
              this.handlerTriggers = new Map_ts_3.Polyfill();
              /*
                        NOTE: Used as Date.now() would be used to compare if an event is anterior
                        or posterior to an other. We don't use Date.now() because two call within
                        less than a ms will return the same value unlike this function.
                        */
              this.__currentChronologyMark = 0;
              this.asyncHandlerCount = 0;
            }
            static setDefaultMaxHandlers(n) {
              this.__defaultMaxHandlers = isFinite(n) ? n : 0;
            }
            toStateful(p1, p2) {
              const isP1Ctx = CtxLike_ts_2.CtxLike.match(p1);
              const initialValue = isP1Ctx ? undefined : p1;
              const ctx = p2 ?? (isP1Ctx ? p1 : undefined);
              const out = new importProxy_ts_6.importProxy.StatefulEvt(
                initialValue,
              );
              const callback = (data) => out.post(data);
              if (!!ctx) {
                this.attach(ctx, callback);
              } else {
                this.attach(callback);
              }
              return out;
            }
            setMaxHandlers(n) {
              this.__maxHandlers = isFinite(n) ? n : 0;
              return this;
            }
            enableTrace(params//NOTE: Not typeof console.log as we don't want to expose types from node
            ) {
              const { id, formatter, log } = params;
              this.traceId = id;
              this.traceFormatter = formatter ?? ((data) => {
                try {
                  return JSON.stringify(data, null, 2);
                } catch {
                  return `${data}`;
                }
              });
              this.log = log === undefined
                ? ((...inputs) => console.log(...inputs)) : log === false
                ? undefined
                : log;
            }
            disableTrace() {
              this.traceId = null;
              return this;
            }
            getChronologyMark() {
              return this.__currentChronologyMark++;
            }
            detachHandler(handler, wTimer, rejectPr) {
              const index = this.handlers.indexOf(handler);
              if (index < 0) {
                return false;
              }
              if (typeGuard_ts_6.typeGuard(handler, !!handler.ctx)) {
                handler.ctx.zz__removeHandler(handler);
              }
              this.handlers.splice(index, 1);
              if (handler.async) {
                this.asyncHandlerCount--;
              }
              this.handlerTriggers.delete(handler);
              if (wTimer[0] !== undefined) {
                safeClearTimeout(wTimer[0]);
                rejectPr(new EvtError_ts_2.EvtError.Detached());
              }
              this.lazyEvtDetach.post(handler);
              return true;
            }
            triggerHandler(handler, wTimer, resolvePr, opResult) {
              const { callback, once } = handler;
              if (wTimer[0] !== undefined) {
                safeClearTimeout(wTimer[0]);
                wTimer[0] = undefined;
              }
              EvtImpl.doDetachIfNeeded(handler, opResult, once);
              const [transformedData] = opResult;
              callback?.call(this, transformedData);
              resolvePr?.(transformedData);
            }
            addHandler(propsFromArgs, propsFromMethodName) {
              if (Operator_ts_5.Operator.fλ.Stateful.match(propsFromArgs.op)) {
                this.statelessByStatefulOp.set(
                  propsFromArgs.op,
                  encapsulateOpState_ts_2.encapsulateOpState(propsFromArgs.op),
                );
              }
              const d = new Deferred_ts_1.Deferred();
              const wTimer = [undefined];
              const handler = {
                ...propsFromArgs,
                ...propsFromMethodName,
                "detach": () => this.detachHandler(handler, wTimer, d.reject),
                "promise": d.pr,
              };
              if (typeof handler.timeout === "number") {
                wTimer[0] = safeSetTimeout(() => {
                  wTimer[0] = undefined;
                  handler.detach();
                  d.reject(new EvtError_ts_2.EvtError.Timeout(handler.timeout));
                }, handler.timeout);
              }
              this.handlerTriggers.set(handler, (opResult) =>
                this.triggerHandler(
                  handler,
                  wTimer,
                  d.isPending ? d.resolve : undefined,
                  opResult,
                ));
              if (handler.async) {
                this.asyncHandlerChronologyMark.set(
                  handler,
                  this.getChronologyMark(),
                );
              }
              if (handler.prepend) {
                let i;
                for (i = 0; i < this.handlers.length; i++) {
                  if (this.handlers[i].extract) {
                    continue;
                  }
                  break;
                }
                this.handlers.splice(i, 0, handler);
              } else {
                this.handlers.push(handler);
              }
              if (handler.async) {
                this.asyncHandlerCount++;
              }
              this.checkForPotentialMemoryLeak();
              if (typeGuard_ts_6.typeGuard(handler, !!handler.ctx)) {
                handler.ctx.zz__addHandler(handler, this);
              }
              this.lazyEvtAttach.post(handler);
              return handler;
            }
            checkForPotentialMemoryLeak() {
              const maxHandlers = this.__maxHandlers ??
                EvtImpl.__defaultMaxHandlers;
              if (
                maxHandlers === 0 ||
                this.handlers.length % (maxHandlers + 1) !== 0
              ) {
                return;
              }
              let message = [
                `MaxHandlersExceededWarning: Possible Evt memory leak detected.`,
                `${this.handlers.length} handlers attached${
                  this.traceId
                    ? ` to "${this.traceId}"`
                    : ""
                }.\n`,
                `Use Evt.prototype.setMaxHandlers(n) to increase limit on a specific Evt.\n`,
                `Use Evt.setDefaultMaxHandlers(n) to change the default limit currently set to ${EvtImpl.__defaultMaxHandlers}.\n`,
              ].join("");
              const map = new Map_ts_3.Polyfill();
              this.getHandlers()
                .map((
                  { ctx, async, once, prepend, extract, op, callback },
                ) => ({
                  "hasCtx": !!ctx,
                  once,
                  prepend,
                  extract,
                  "isWaitFor": async,
                  ...(op === Evt_parsePropsFromArgs_ts_1.matchAll ? {}
                  : { "op": op.toString() }),
                  ...(!callback ? {} : { "callback": callback.toString() }),
                }))
                .map((obj) =>
                  "{\n" + Object.keys(obj)
                    .map((key) => `  ${key}: ${obj[key]}`)
                    .join(",\n") +
                  "\n}"
                )
                .forEach((str) => map.set(str, (map.get(str) ?? 0) + 1));
              message += "\n" + Array.from(map.keys())
                .map((str) =>
                  `${map.get(str)} handler${
                    map.get(str) === 1 ? "" : "s"
                  } like:\n${str}`
                )
                .join("\n") +
                "\n";
              if (this.traceId === null) {
                message += "\n" + [
                  `To validate the identify of the Evt instance that is triggering this warning you can call`,
                  `Evt.prototype.enableTrace({ "id": "My evt id", "log": false }) on the Evt that you suspect.\n`,
                ].join(" ");
              }
              try {
                console.warn(message);
              } catch {
              }
            }
            getStatelessOp(op) {
              return Operator_ts_5.Operator.fλ.Stateful.match(op)
                ? this.statelessByStatefulOp.get(op)
                : op;
            }
            trace(data) {
              if (this.traceId === null) {
                return;
              }
              let message = `(${this.traceId}) `;
              const isExtracted = !!this.handlers.find((
                { extract, op },
              ) => (extract &&
                !!this.getStatelessOp(op)(data))
              );
              if (isExtracted) {
                message += "extracted ";
              } else {
                const handlerCount = this.handlers
                  .filter(({ extract, op }) =>
                    !extract &&
                    !!this.getStatelessOp(op)(data)
                  )
                  .length;
                message += `${handlerCount} handler${
                  (handlerCount > 1) ? "s" : ""
                }, `;
              }
              this.log?.(message + this.traceFormatter(data));
            }
            /** Return isExtracted */
            postSync(data) {
              for (const handler of [...this.handlers]) {
                const { async, op, extract } = handler;
                if (async) {
                  continue;
                }
                const opResult = invokeOperator_ts_3.invokeOperator(
                  this.getStatelessOp(op),
                  data,
                  true,
                );
                if (
                  Operator_ts_5.Operator.fλ.Result.NotMatched.match(opResult)
                ) {
                  EvtImpl.doDetachIfNeeded(handler, opResult);
                  continue;
                }
                const handlerTrigger = this.handlerTriggers.get(handler);
                //NOTE: Possible if detached while in the loop.
                if (!handlerTrigger) {
                  continue;
                }
                handlerTrigger(opResult);
                if (extract) {
                  return true;
                }
              }
              return false;
            }
            postAsyncFactory() {
              return runExclusive.buildMethodCb(
                (data, postChronologyMark, releaseLock) => {
                  if (this.asyncHandlerCount === 0) {
                    releaseLock();
                    return;
                  }
                  const promises = [];
                  let chronologyMarkStartResolveTick;
                  //NOTE: Must be before handlerTrigger call.
                  Promise.resolve().then(() =>
                    chronologyMarkStartResolveTick = this.getChronologyMark()
                  );
                  for (const handler of [...this.handlers]) {
                    if (!handler.async) {
                      continue;
                    }
                    const opResult = invokeOperator_ts_3.invokeOperator(
                      this.getStatelessOp(handler.op),
                      data,
                      true,
                    );
                    if (
                      Operator_ts_5.Operator.fλ.Result.NotMatched.match(
                        opResult,
                      )
                    ) {
                      EvtImpl.doDetachIfNeeded(handler, opResult);
                      continue;
                    }
                    const handlerTrigger = this.handlerTriggers.get(handler);
                    if (!handlerTrigger) {
                      continue;
                    }
                    const shouldCallHandlerTrigger = (() => {
                      const handlerMark = this.asyncHandlerChronologyMark.get(
                        handler,
                      );
                      if (postChronologyMark > handlerMark) {
                        return true;
                      }
                      const exceptionRange = this
                        .asyncHandlerChronologyExceptionRange.get(handler);
                      return (exceptionRange !== undefined &&
                        exceptionRange.lowerMark < postChronologyMark &&
                        postChronologyMark < exceptionRange.upperMark &&
                        handlerMark > exceptionRange.upperMark);
                    })();
                    if (!shouldCallHandlerTrigger) {
                      continue;
                    }
                    promises.push(
                      new Promise((resolve) =>
                        handler.promise
                          .then(() => resolve())
                          .catch(() => resolve())
                      ),
                    );
                    handlerTrigger(opResult);
                  }
                  if (promises.length === 0) {
                    releaseLock();
                    return;
                  }
                  const handlersDump = [...this.handlers];
                  Promise.all(promises).then(() => {
                    for (const handler of this.handlers) {
                      if (!handler.async) {
                        continue;
                      }
                      if (handlersDump.indexOf(handler) >= 0) {
                        continue;
                      }
                      this.asyncHandlerChronologyExceptionRange.set(handler, {
                        "lowerMark": postChronologyMark,
                        "upperMark": chronologyMarkStartResolveTick,
                      });
                    }
                    releaseLock();
                  });
                },
              );
            }
            isHandled(data) {
              return !!this.getHandlers()
                .find(({ op }) => !!this.getStatelessOp(op)(data));
            }
            getHandlers() {
              return [...this.handlers];
            }
            detach(ctx) {
              const detachedHandlers = [];
              for (const handler of this.getHandlers()) {
                if (ctx !== undefined && handler.ctx !== ctx) {
                  continue;
                }
                const wasStillAttached = handler.detach();
                //NOTE: It should not be possible.
                if (!wasStillAttached) {
                  continue;
                }
                detachedHandlers.push(handler);
              }
              return detachedHandlers;
            }
            pipe(...args) {
              const evtDelegate = new EvtImpl();
              this.addHandler({
                ...Evt_parsePropsFromArgs_ts_1.parsePropsFromArgs(args, "pipe"),
                "callback": (transformedData) =>
                  evtDelegate.post(transformedData),
              }, EvtImpl.propsFormMethodNames.attach);
              return evtDelegate;
            }
            waitFor(...args) {
              return this.addHandler(
                Evt_parsePropsFromArgs_ts_1.parsePropsFromArgs(args, "waitFor"),
                EvtImpl.propsFormMethodNames.waitFor,
              ).promise;
            }
            $attach(...inputs) {
              return this.attach(...inputs);
            }
            attach(...args) {
              return this.__attachX(args, "attach");
            }
            $attachOnce(...inputs) {
              return this.attachOnce(...inputs);
            }
            attachOnce(...args) {
              return this.__attachX(args, "attachOnce");
            }
            $attachExtract(...inputs) {
              return this.attachExtract(...inputs);
            }
            attachExtract(...args) {
              return this.__attachX(args, "attachExtract");
            }
            $attachPrepend(...inputs) {
              return this.attachPrepend(...inputs);
            }
            attachPrepend(...args) {
              return this.__attachX(args, "attachPrepend");
            }
            $attachOncePrepend(...inputs) {
              return this.attachOncePrepend(...inputs);
            }
            attachOncePrepend(...args) {
              return this.__attachX(args, "attachOncePrepend");
            }
            $attachOnceExtract(...inputs) {
              return this.attachOnceExtract(...inputs);
            }
            attachOnceExtract(...args) {
              return this.__attachX(args, "attachOnceExtract");
            }
            __attachX(args, methodName) {
              const propsFromArgs = Evt_parsePropsFromArgs_ts_1
                .parsePropsFromArgs(args, "attach*");
              const handler = this.addHandler(
                propsFromArgs,
                EvtImpl.propsFormMethodNames[methodName],
              );
              return propsFromArgs.timeout === undefined ? this
              : handler.promise;
            }
            postAsyncOnceHandled(data) {
              if (this.isHandled(data)) {
                return this.post(data);
              }
              const d = new Deferred_ts_1.Deferred();
              this.evtAttach.attachOnce(
                ({ op }) =>
                  !!invokeOperator_ts_3.invokeOperator(
                    this.getStatelessOp(op),
                    data,
                  ),
                () => Promise.resolve().then(() => d.resolve(this.post(data))),
              );
              return d.pr;
            }
            post(data) {
              this.trace(data);
              overwriteReadonlyProp_ts_2.overwriteReadonlyProp(
                this,
                "postCount",
                this.postCount + 1,
              );
              //NOTE: Must be before postSync.
              const postChronologyMark = this.getChronologyMark();
              const isExtracted = this.postSync(data);
              if (isExtracted) {
                return this.postCount;
              }
              if (this.postAsync === undefined) {
                if (this.asyncHandlerCount === 0) {
                  return this.postCount;
                }
                this.postAsync = this.postAsyncFactory();
              }
              this.postAsync(data, postChronologyMark);
              return this.postCount;
            }
          }
          EvtImpl.create = Evt_create_ts_1.create;
          EvtImpl.newCtx = Evt_newCtx_ts_1.newCtx;
          EvtImpl.merge = Evt_merge_ts_2.merge;
          EvtImpl.from = Evt_from_ts_1.from;
          EvtImpl.useEffect = Evt_useEffect_ts_1.useEffect;
          EvtImpl.getCtx = Evt_getCtx_ts_1.getCtxFactory();
          EvtImpl.loosenType = Evt_loosenType_ts_1.loosenType;
          EvtImpl.factorize = Evt_factorize_ts_1.factorize;
          EvtImpl.asPostable = Evt_asPostable_ts_1.asPostable;
          EvtImpl.asNonPostable = Evt_asNonPostable_ts_1.asNonPostable;
          EvtImpl.__defaultMaxHandlers = 25;
          EvtImpl.__1 = (() => {
            if (false) {
              EvtImpl.__1;
            }
            defineAccessors_ts_1.defineAccessors(
              EvtImpl.prototype,
              "evtAttach",
              {
                "get": function () {
                  return this.lazyEvtAttach.evt;
                },
              },
            );
            defineAccessors_ts_1.defineAccessors(
              EvtImpl.prototype,
              "evtDetach",
              {
                "get": function () {
                  return this.lazyEvtDetach.evt;
                },
              },
            );
          })();
          EvtImpl.__2 = (() => {
            if (false) {
              EvtImpl.__2;
            }
            Object.defineProperties(
              EvtImpl.prototype,
              [
                "__asyncHandlerChronologyMark",
                "__asyncHandlerChronologyExceptionRange",
                "__statelessByStatefulOp",
              ].map((key) => [
                key.substr(2),
                {
                  "get": function () {
                    if (this[key] === undefined) {
                      this[key] = new WeakMap_ts_3.Polyfill();
                    }
                    return this[key];
                  },
                },
              ]).reduce((prev, [key, obj]) => ({ ...prev, [key]: obj }), {}),
            );
          })();
          EvtImpl.propsFormMethodNames = {
            "waitFor": {
              "async": true,
              "extract": false,
              "once": true,
              "prepend": false,
            },
            "attach": {
              "async": false,
              "extract": false,
              "once": false,
              "prepend": false,
            },
            "attachExtract": {
              "async": false,
              "extract": true,
              "once": false,
              "prepend": true,
            },
            "attachPrepend": {
              "async": false,
              "extract": false,
              "once": false,
              "prepend": true,
            },
            "attachOnce": {
              "async": false,
              "extract": false,
              "once": true,
              "prepend": false,
            },
            "attachOncePrepend": {
              "async": false,
              "extract": false,
              "once": true,
              "prepend": true,
            },
            "attachOnceExtract": {
              "async": false,
              "extract": true,
              "once": true,
              "prepend": true,
            },
          };
          return EvtImpl;
        })();
        (function (EvtImpl) {
          function doDetachIfNeeded(handler, opResult, once) {
            const detach = Operator_ts_5.Operator.fλ.Result.getDetachArg(
              opResult,
            );
            if (typeof detach !== "boolean") {
              const [ctx, error, res] = detach;
              if (!!error) {
                ctx.abort(error);
              } else {
                ctx.done(res);
              }
            } else if (detach || !!once) {
              handler.detach();
            }
          }
          EvtImpl.doDetachIfNeeded = doDetachIfNeeded;
        })(EvtImpl || (EvtImpl = {}));
        exports_100("Evt", Evt = EvtImpl);
        try {
          overwriteReadonlyProp_ts_2.overwriteReadonlyProp(Evt, "name", "Evt");
        } catch {}
        importProxy_ts_6.importProxy.Evt = Evt;
      },
    };
  },
);
if (!Object.is) {
  Object.is = function (x, y) {
    // SameValue algorithm
    if (x === y) { // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  };
}
System.register(
  "https://deno.land/x/evt/lib/LazyStatefulEvt",
  [
    "https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp",
    "https://deno.land/x/evt/lib/importProxy",
    "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
  ],
  function (exports_101, context_101) {
    "use strict";
    var overwriteReadonlyProp_ts_3,
      importProxy_ts_7,
      defineAccessors_ts_2,
      LazyStatefulEvt;
    var __moduleName = context_101 && context_101.id;
    return {
      setters: [
        function (overwriteReadonlyProp_ts_3_1) {
          overwriteReadonlyProp_ts_3 = overwriteReadonlyProp_ts_3_1;
        },
        function (importProxy_ts_7_1) {
          importProxy_ts_7 = importProxy_ts_7_1;
        },
        function (defineAccessors_ts_2_1) {
          defineAccessors_ts_2 = defineAccessors_ts_2_1;
        },
      ],
      execute: function () {
        LazyStatefulEvt = /** @class */ (() => {
          class LazyStatefulEvt {
            constructor(initialState) {
              this.initialPostCount = 0;
              this.initialState = initialState;
            }
            post(data) {
              if (this.__evt === undefined) {
                this.initialState = data;
                return ++this.initialPostCount;
              }
              return this.__evt.post(data);
            }
          }
          LazyStatefulEvt.__1 = (() => {
            if (false) {
              LazyStatefulEvt.__1;
            }
            defineAccessors_ts_2.defineAccessors(
              LazyStatefulEvt.prototype,
              "evt",
              {
                "get": function () {
                  if (this.__evt === undefined) {
                    this.__evt = new importProxy_ts_7.importProxy.StatefulEvt(
                      this.initialState,
                    );
                    delete this.initialState;
                    overwriteReadonlyProp_ts_3.overwriteReadonlyProp(
                      this.__evt,
                      "postCount",
                      this.initialPostCount,
                    );
                  }
                  return this.__evt;
                },
              },
            );
          })();
          return LazyStatefulEvt;
        })();
        exports_101("LazyStatefulEvt", LazyStatefulEvt);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/StatefulEvt",
  [
    "https://raw.github.com/garronej/minimal_polyfills/2.0.1/Object.is.ts",
    "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
    "https://deno.land/x/evt/lib/LazyEvt",
    "https://deno.land/x/evt/lib/LazyStatefulEvt",
    "https://deno.land/x/evt/lib/importProxy",
    "https://deno.land/x/evt/lib/util/invokeOperator",
    "https://deno.land/x/evt/lib/types/Operator",
    "https://deno.land/x/evt/lib/Evt.parsePropsFromArgs",
    "https://deno.land/x/evt/lib/Evt",
  ],
  function (exports_102, context_102) {
    "use strict";
    var defineAccessors_ts_3,
      LazyEvt_ts_2,
      LazyStatefulEvt_ts_1,
      importProxy_ts_8,
      invokeOperator_ts_4,
      Operator_ts_6,
      Evt_parsePropsFromArgs_ts_2,
      Evt_ts_1,
      StatefulEvtImpl,
      StatefulEvt;
    var __moduleName = context_102 && context_102.id;
    return {
      setters: [
        function (_2) {
        },
        function (defineAccessors_ts_3_1) {
          defineAccessors_ts_3 = defineAccessors_ts_3_1;
        },
        function (LazyEvt_ts_2_1) {
          LazyEvt_ts_2 = LazyEvt_ts_2_1;
        },
        function (LazyStatefulEvt_ts_1_1) {
          LazyStatefulEvt_ts_1 = LazyStatefulEvt_ts_1_1;
        },
        function (importProxy_ts_8_1) {
          importProxy_ts_8 = importProxy_ts_8_1;
        },
        function (invokeOperator_ts_4_1) {
          invokeOperator_ts_4 = invokeOperator_ts_4_1;
        },
        function (Operator_ts_6_1) {
          Operator_ts_6 = Operator_ts_6_1;
        },
        function (Evt_parsePropsFromArgs_ts_2_1) {
          Evt_parsePropsFromArgs_ts_2 = Evt_parsePropsFromArgs_ts_2_1;
        },
        function (Evt_ts_1_1) {
          Evt_ts_1 = Evt_ts_1_1;
        },
      ],
      execute: function () {
        StatefulEvtImpl = /** @class */ (() => {
          class StatefulEvtImpl extends Evt_ts_1.Evt {
            constructor(initialState) {
              super();
              this.lazyEvtDiff = new LazyEvt_ts_2.LazyEvt();
              this.lazyEvtChangeDiff = new LazyEvt_ts_2.LazyEvt();
              this.__state = initialState;
              this.lazyEvtChange = new LazyStatefulEvt_ts_1.LazyStatefulEvt(
                this.__state,
              );
            }
            post(data) {
              return this.__post(data, false);
            }
            postForceChange(wData) {
              return this.__post(!!wData ? wData[0] : this.state, true);
            }
            __post(data, forceChange) {
              const prevState = this.state;
              this.__state = data;
              const diff = { prevState, "newState": this.state };
              this.lazyEvtDiff.post(diff);
              if (forceChange || !Object.is(prevState, this.state)) {
                this.lazyEvtChange.post(this.state);
                this.lazyEvtChangeDiff.post(diff);
              }
              return super.post(data);
            }
            pipe(...args) {
              const evt = super
                .pipe(...args);
              const opResult = invokeOperator_ts_4.invokeOperator(
                this.getStatelessOp(
                  Evt_parsePropsFromArgs_ts_2.parsePropsFromArgs(args, "pipe")
                    .op,
                ),
                this.state,
              );
              if (Operator_ts_6.Operator.fλ.Result.NotMatched.match(opResult)) {
                throw new Error([
                  "Cannot pipe StatefulEvt because the operator does not match",
                  "it's current state.",
                  "Use evt.toStateless([ctx]).pipe(op).toStatic(initialState)",
                  "to be sure the StatefulEvt is correctly initialized",
                ].join(" "));
              }
              return evt.toStateful(opResult[0]);
            }
            toStateless(ctx) {
              return !!ctx ? super.pipe(ctx) : super.pipe();
            }
          }
          StatefulEvtImpl.__4 = (() => {
            if (false) {
              StatefulEvtImpl.__4;
            }
            defineAccessors_ts_3.defineAccessors(
              StatefulEvtImpl.prototype,
              "state",
              {
                "get": function () {
                  return this.__state;
                },
                "set": function (state) {
                  this.post(state);
                },
              },
            );
            defineAccessors_ts_3.defineAccessors(
              StatefulEvtImpl.prototype,
              "evtDiff",
              {
                "get": function () {
                  return this.lazyEvtDiff.evt;
                },
              },
            );
            defineAccessors_ts_3.defineAccessors(
              StatefulEvtImpl.prototype,
              "evtChange",
              {
                "get": function () {
                  return this.lazyEvtChange.evt;
                },
              },
            );
            defineAccessors_ts_3.defineAccessors(
              StatefulEvtImpl.prototype,
              "evtChangeDiff",
              {
                "get": function () {
                  return this.lazyEvtChangeDiff.evt;
                },
              },
            );
          })();
          return StatefulEvtImpl;
        })();
        exports_102("StatefulEvt", StatefulEvt = StatefulEvtImpl);
        importProxy_ts_8.importProxy.StatefulEvt = StatefulEvt;
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/importProxy",
  [],
  function (exports_103, context_103) {
    "use strict";
    var importProxy;
    var __moduleName = context_103 && context_103.id;
    return {
      setters: [],
      execute: function () {
        /** Manually handling circular import so React Native does not gives warning. */
        exports_103("importProxy", importProxy = {});
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/LazyEvt",
  [
    "https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp",
    "https://deno.land/x/evt/lib/importProxy",
    "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
  ],
  function (exports_104, context_104) {
    "use strict";
    var overwriteReadonlyProp_ts_4,
      importProxy_ts_9,
      defineAccessors_ts_4,
      LazyEvt;
    var __moduleName = context_104 && context_104.id;
    return {
      setters: [
        function (overwriteReadonlyProp_ts_4_1) {
          overwriteReadonlyProp_ts_4 = overwriteReadonlyProp_ts_4_1;
        },
        function (importProxy_ts_9_1) {
          importProxy_ts_9 = importProxy_ts_9_1;
        },
        function (defineAccessors_ts_4_1) {
          defineAccessors_ts_4 = defineAccessors_ts_4_1;
        },
      ],
      execute: function () {
        LazyEvt = /** @class */ (() => {
          class LazyEvt {
            constructor() {
              this.initialPostCount = 0;
            }
            post(data) {
              if (this.__evt === undefined) {
                return ++this.initialPostCount;
              }
              return this.__evt.post(data);
            }
          }
          LazyEvt.__1 = (() => {
            if (false) {
              LazyEvt.__1;
            }
            defineAccessors_ts_4.defineAccessors(LazyEvt.prototype, "evt", {
              "get": function () {
                if (this.__evt === undefined) {
                  this.__evt = new importProxy_ts_9.importProxy.Evt();
                  overwriteReadonlyProp_ts_4.overwriteReadonlyProp(
                    this.__evt,
                    "postCount",
                    this.initialPostCount,
                  );
                }
                return this.__evt;
              },
            });
          })();
          return LazyEvt;
        })();
        exports_104("LazyEvt", LazyEvt);
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/Ctx",
  [
    "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/Set",
    "https://raw.githubusercontent.com/garronej/minimal_polyfills/2.0.1/WeakMap",
    "https://deno.land/x/evt/tools/typeSafety/assert",
    "https://deno.land/x/evt/tools/typeSafety/typeGuard",
    "https://deno.land/x/evt/lib/LazyEvt",
    "https://deno.land/x/evt/lib/importProxy",
    "https://deno.land/x/evt/tools/typeSafety/defineAccessors",
    "https://deno.land/x/evt/tools/typeSafety/overwriteReadonlyProp",
  ],
  function (exports_105, context_105) {
    "use strict";
    var Set_ts_1,
      WeakMap_ts_4,
      assert_ts_4,
      typeGuard_ts_7,
      LazyEvt_ts_3,
      importProxy_ts_10,
      defineAccessors_ts_5,
      overwriteReadonlyProp_ts_5,
      CtxImpl,
      Ctx;
    var __moduleName = context_105 && context_105.id;
    return {
      setters: [
        function (Set_ts_1_1) {
          Set_ts_1 = Set_ts_1_1;
        },
        function (WeakMap_ts_4_1) {
          WeakMap_ts_4 = WeakMap_ts_4_1;
        },
        function (assert_ts_4_1) {
          assert_ts_4 = assert_ts_4_1;
        },
        function (typeGuard_ts_7_1) {
          typeGuard_ts_7 = typeGuard_ts_7_1;
        },
        function (LazyEvt_ts_3_1) {
          LazyEvt_ts_3 = LazyEvt_ts_3_1;
        },
        function (importProxy_ts_10_1) {
          importProxy_ts_10 = importProxy_ts_10_1;
        },
        function (defineAccessors_ts_5_1) {
          defineAccessors_ts_5 = defineAccessors_ts_5_1;
        },
        function (overwriteReadonlyProp_ts_5_1) {
          overwriteReadonlyProp_ts_5 = overwriteReadonlyProp_ts_5_1;
        },
      ],
      execute: function () {
        CtxImpl = /** @class */ (() => {
          class CtxImpl {
            constructor() {
              this.lazyEvtAttach = new LazyEvt_ts_3.LazyEvt();
              this.lazyEvtDetach = new LazyEvt_ts_3.LazyEvt();
              this.lazyEvtDoneOrAborted = new LazyEvt_ts_3.LazyEvt();
              this.handlers = new Set_ts_1.Polyfill();
              this.evtByHandler = new WeakMap_ts_4.Polyfill();
            }
            onDoneOrAborted(doneEvtData) {
              this.lazyEvtDoneOrAborted.post(doneEvtData);
            }
            waitFor(timeout) {
              return this.evtDoneOrAborted
                .waitFor(timeout)
                .then((data) => {
                  if (data.type === "ABORTED") {
                    throw data.error;
                  }
                  return data.result;
                }, (timeoutError) => {
                  this.abort(timeoutError);
                  throw timeoutError;
                });
            }
            abort(error) {
              return this.__done(error);
            }
            done(result) {
              return this.__done(undefined, result);
            }
            /** Detach all handler bound to this context from theirs respective Evt and post getEvtDone() */
            __done(error, result) {
              const handlers = [];
              for (const handler of this.handlers.values()) {
                const evt = this.evtByHandler.get(handler);
                const wasStillAttached = handler.detach();
                //NOTE: It should not be possible
                if (!wasStillAttached) {
                  continue;
                }
                handlers.push({ handler, evt });
              }
              this.onDoneOrAborted({
                ...(!!error
                  ? { type: "ABORTED", error }
                  : { type: "DONE", "result": result }),
                handlers,
              });
              return handlers;
            }
            getHandlers() {
              return Array.from(this.handlers.values())
                .map((handler) => ({
                  handler,
                  "evt": this.evtByHandler.get(handler),
                }));
            }
            zz__addHandler(handler, evt) {
              assert_ts_4.assert(handler.ctx === this);
              assert_ts_4.assert(typeGuard_ts_7.typeGuard(handler));
              this.handlers.add(handler);
              this.evtByHandler.set(handler, evt);
              this.lazyEvtAttach.post({ handler, evt });
            }
            zz__removeHandler(handler) {
              assert_ts_4.assert(handler.ctx === this);
              assert_ts_4.assert(typeGuard_ts_7.typeGuard(handler));
              this.lazyEvtDetach.post({
                handler,
                "evt": this.evtByHandler.get(handler),
              });
              this.handlers.delete(handler);
            }
          }
          CtxImpl.__1 = (() => {
            if (false) {
              CtxImpl.__1;
            }
            defineAccessors_ts_5.defineAccessors(
              CtxImpl.prototype,
              "evtDoneOrAborted",
              {
                "get": function () {
                  return this.lazyEvtDoneOrAborted.evt;
                },
              },
            );
            defineAccessors_ts_5.defineAccessors(
              CtxImpl.prototype,
              "evtAttach",
              {
                "get": function () {
                  return this.lazyEvtAttach.evt;
                },
              },
            );
            defineAccessors_ts_5.defineAccessors(
              CtxImpl.prototype,
              "evtDetach",
              {
                "get": function () {
                  return this.lazyEvtDetach.evt;
                },
              },
            );
          })();
          return CtxImpl;
        })();
        exports_105("Ctx", Ctx = CtxImpl);
        try {
          overwriteReadonlyProp_ts_5.overwriteReadonlyProp(Ctx, "name", "Ctx");
        } catch {}
        importProxy_ts_10.importProxy.Ctx = Ctx;
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/lib/index",
  [
    "https://deno.land/x/evt/lib/types/index",
    "https://deno.land/x/evt/lib/util/index",
    "https://deno.land/x/evt/lib/Ctx",
    "https://deno.land/x/evt/lib/Evt",
    "https://deno.land/x/evt/lib/StatefulEvt",
    "https://deno.land/x/evt/tools/typeSafety/matchVoid",
  ],
  function (exports_106, context_106) {
    "use strict";
    var __moduleName = context_106 && context_106.id;
    var exportedNames_4 = {
      "Ctx": true,
      "Evt": true,
      "StatefulEvt": true,
      "matchVoid": true,
    };
    function exportStar_7(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default" && !exportedNames_4.hasOwnProperty(n)) {
          exports[n] = m[n];
        }
      }
      exports_106(exports);
    }
    return {
      setters: [
        function (index_ts_6_1) {
          exportStar_7(index_ts_6_1);
        },
        function (index_ts_7_1) {
          exportStar_7(index_ts_7_1);
        },
        function (Ctx_ts_1_1) {
          exports_106({
            "Ctx": Ctx_ts_1_1["Ctx"],
          });
        },
        function (Evt_ts_2_1) {
          exports_106({
            "Evt": Evt_ts_2_1["Evt"],
          });
        },
        function (StatefulEvt_ts_1_1) {
          exports_106({
            "StatefulEvt": StatefulEvt_ts_1_1["StatefulEvt"],
          });
        },
        function (matchVoid_ts_2_1) {
          exports_106({
            "matchVoid": matchVoid_ts_2_1["matchVoid"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/evt/mod",
  ["https://deno.land/x/evt/lib/index"],
  function (exports_107, context_107) {
    "use strict";
    var __moduleName = context_107 && context_107.id;
    function exportStar_8(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default") exports[n] = m[n];
      }
      exports_107(exports);
    }
    return {
      setters: [
        function (index_ts_8_1) {
          exportStar_8(index_ts_8_1);
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/html_entities@v1.0/lib/xml-entities",
  [],
  function (exports_108, context_108) {
    "use strict";
    var ALPHA_INDEX, CHAR_INDEX, CHAR_S_INDEX;
    var __moduleName = context_108 && context_108.id;
    /**
     * @param {String} str
     * @returns {String}
     */
    function encode(str) {
      if (!str || !str.length) {
        return "";
      }
      return str.replace(/<|>|"|'|&/g, function (s) {
        return CHAR_S_INDEX[s];
      });
    }
    exports_108("encode", encode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function decode(str) {
      if (!str || !str.length) {
        return "";
      }
      return str.replace(/&#?[0-9a-zA-Z]+;?/g, function (s) {
        if (s.charAt(1) === "#") {
          const code = s.charAt(2).toLowerCase() === "x"
            ? parseInt(s.substr(3), 16)
            : parseInt(s.substr(2));
          if (isNaN(code) || code < -32768 || code > 65535) {
            return "";
          }
          return String.fromCharCode(code);
        }
        return ALPHA_INDEX[s] || s;
      });
    }
    exports_108("decode", decode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonUTF(str) {
      if (!str || !str.length) {
        return "";
      }
      const strLength = str.length;
      let result = "";
      let i = 0;
      while (i < strLength) {
        const c = str.charCodeAt(i);
        const alpha = CHAR_INDEX[c];
        if (alpha) {
          result += "&" + alpha + ";";
          i++;
          continue;
        }
        if (c < 32 || c > 126) {
          result += "&#" + c + ";";
        } else {
          result += str.charAt(i);
        }
        i++;
      }
      return result;
    }
    exports_108("encodeNonUTF", encodeNonUTF);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonASCII(str) {
      if (!str || !str.length) {
        return "";
      }
      const strLength = str.length;
      let result = "";
      let i = 0;
      while (i < strLength) {
        const c = str.charCodeAt(i);
        if (c <= 255) {
          result += str[i++];
          continue;
        }
        result += "&#" + c + ";";
        i++;
      }
      return result;
    }
    exports_108("encodeNonASCII", encodeNonASCII);
    return {
      setters: [],
      execute: function () {
        ALPHA_INDEX = {
          "&lt": "<",
          "&gt": ">",
          "&quot": '"',
          "&apos": "'",
          "&amp": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
          "&amp;": "&",
        };
        CHAR_INDEX = {
          60: "lt",
          62: "gt",
          34: "quot",
          39: "apos",
          38: "amp",
        };
        CHAR_S_INDEX = {
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
          "&": "&amp;",
        };
        exports_108("default", {
          encode,
          decode,
          encodeNonUTF,
          encodeNonASCII,
        });
      },
    };
  },
);
System.register(
  "https://deno.land/x/html_entities@v1.0/lib/html4-entities",
  [],
  function (exports_109, context_109) {
    "use strict";
    var HTML_ALPHA, HTML_CODES, alphaIndex, numIndex, i, length;
    var __moduleName = context_109 && context_109.id;
    /**
     * @param {String} str
     * @returns {String}
     */
    function decode(str) {
      if (!str || !str.length) {
        return "";
      }
      return str.replace(/&(#?[\w\d]+);?/g, function (s, entity) {
        let chr;
        if (entity.charAt(0) === "#") {
          const code = entity.charAt(1).toLowerCase() === "x"
            ? parseInt(entity.substr(2), 16)
            : parseInt(entity.substr(1));
          if (!(isNaN(code) || code < -32768 || code > 65535)) {
            chr = String.fromCharCode(code);
          }
        } else {
          chr = alphaIndex[entity];
        }
        return chr || s;
      });
    }
    exports_109("decode", decode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encode(str) {
      if (!str || !str.length) {
        return "";
      }
      const strLength = str.length;
      let result = "";
      let i = 0;
      while (i < strLength) {
        const alpha = numIndex[str.charCodeAt(i)];
        result += alpha ? "&" + alpha + ";" : str.charAt(i);
        i++;
      }
      return result;
    }
    exports_109("encode", encode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonUTF(str) {
      if (!str || !str.length) {
        return "";
      }
      const strLength = str.length;
      let result = "";
      let i = 0;
      while (i < strLength) {
        const cc = str.charCodeAt(i);
        const alpha = numIndex[cc];
        if (alpha) {
          result += "&" + alpha + ";";
        } else if (cc < 32 || cc > 126) {
          result += "&#" + cc + ";";
        } else {
          result += str.charAt(i);
        }
        i++;
      }
      return result;
    }
    exports_109("encodeNonUTF", encodeNonUTF);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonASCII(str) {
      if (!str || !str.length) {
        return "";
      }
      const strLength = str.length;
      let result = "";
      let i = 0;
      while (i < strLength) {
        const c = str.charCodeAt(i);
        if (c <= 255) {
          result += str[i++];
          continue;
        }
        result += "&#" + c + ";";
        i++;
      }
      return result;
    }
    exports_109("encodeNonASCII", encodeNonASCII);
    return {
      setters: [],
      execute: function () {
        HTML_ALPHA = [
          "apos",
          "nbsp",
          "iexcl",
          "cent",
          "pound",
          "curren",
          "yen",
          "brvbar",
          "sect",
          "uml",
          "copy",
          "ordf",
          "laquo",
          "not",
          "shy",
          "reg",
          "macr",
          "deg",
          "plusmn",
          "sup2",
          "sup3",
          "acute",
          "micro",
          "para",
          "middot",
          "cedil",
          "sup1",
          "ordm",
          "raquo",
          "frac14",
          "frac12",
          "frac34",
          "iquest",
          "Agrave",
          "Aacute",
          "Acirc",
          "Atilde",
          "Auml",
          "Aring",
          "Aelig",
          "Ccedil",
          "Egrave",
          "Eacute",
          "Ecirc",
          "Euml",
          "Igrave",
          "Iacute",
          "Icirc",
          "Iuml",
          "ETH",
          "Ntilde",
          "Ograve",
          "Oacute",
          "Ocirc",
          "Otilde",
          "Ouml",
          "times",
          "Oslash",
          "Ugrave",
          "Uacute",
          "Ucirc",
          "Uuml",
          "Yacute",
          "THORN",
          "szlig",
          "agrave",
          "aacute",
          "acirc",
          "atilde",
          "auml",
          "aring",
          "aelig",
          "ccedil",
          "egrave",
          "eacute",
          "ecirc",
          "euml",
          "igrave",
          "iacute",
          "icirc",
          "iuml",
          "eth",
          "ntilde",
          "ograve",
          "oacute",
          "ocirc",
          "otilde",
          "ouml",
          "divide",
          "oslash",
          "ugrave",
          "uacute",
          "ucirc",
          "uuml",
          "yacute",
          "thorn",
          "yuml",
          "quot",
          "amp",
          "lt",
          "gt",
          "OElig",
          "oelig",
          "Scaron",
          "scaron",
          "Yuml",
          "circ",
          "tilde",
          "ensp",
          "emsp",
          "thinsp",
          "zwnj",
          "zwj",
          "lrm",
          "rlm",
          "ndash",
          "mdash",
          "lsquo",
          "rsquo",
          "sbquo",
          "ldquo",
          "rdquo",
          "bdquo",
          "dagger",
          "Dagger",
          "permil",
          "lsaquo",
          "rsaquo",
          "euro",
          "fnof",
          "Alpha",
          "Beta",
          "Gamma",
          "Delta",
          "Epsilon",
          "Zeta",
          "Eta",
          "Theta",
          "Iota",
          "Kappa",
          "Lambda",
          "Mu",
          "Nu",
          "Xi",
          "Omicron",
          "Pi",
          "Rho",
          "Sigma",
          "Tau",
          "Upsilon",
          "Phi",
          "Chi",
          "Psi",
          "Omega",
          "alpha",
          "beta",
          "gamma",
          "delta",
          "epsilon",
          "zeta",
          "eta",
          "theta",
          "iota",
          "kappa",
          "lambda",
          "mu",
          "nu",
          "xi",
          "omicron",
          "pi",
          "rho",
          "sigmaf",
          "sigma",
          "tau",
          "upsilon",
          "phi",
          "chi",
          "psi",
          "omega",
          "thetasym",
          "upsih",
          "piv",
          "bull",
          "hellip",
          "prime",
          "Prime",
          "oline",
          "frasl",
          "weierp",
          "image",
          "real",
          "trade",
          "alefsym",
          "larr",
          "uarr",
          "rarr",
          "darr",
          "harr",
          "crarr",
          "lArr",
          "uArr",
          "rArr",
          "dArr",
          "hArr",
          "forall",
          "part",
          "exist",
          "empty",
          "nabla",
          "isin",
          "notin",
          "ni",
          "prod",
          "sum",
          "minus",
          "lowast",
          "radic",
          "prop",
          "infin",
          "ang",
          "and",
          "or",
          "cap",
          "cup",
          "int",
          "there4",
          "sim",
          "cong",
          "asymp",
          "ne",
          "equiv",
          "le",
          "ge",
          "sub",
          "sup",
          "nsub",
          "sube",
          "supe",
          "oplus",
          "otimes",
          "perp",
          "sdot",
          "lceil",
          "rceil",
          "lfloor",
          "rfloor",
          "lang",
          "rang",
          "loz",
          "spades",
          "clubs",
          "hearts",
          "diams",
        ];
        HTML_CODES = [
          39,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          174,
          175,
          176,
          177,
          178,
          179,
          180,
          181,
          182,
          183,
          184,
          185,
          186,
          187,
          188,
          189,
          190,
          191,
          192,
          193,
          194,
          195,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          210,
          211,
          212,
          213,
          214,
          215,
          216,
          217,
          218,
          219,
          220,
          221,
          222,
          223,
          224,
          225,
          226,
          227,
          228,
          229,
          230,
          231,
          232,
          233,
          234,
          235,
          236,
          237,
          238,
          239,
          240,
          241,
          242,
          243,
          244,
          245,
          246,
          247,
          248,
          249,
          250,
          251,
          252,
          253,
          254,
          255,
          34,
          38,
          60,
          62,
          338,
          339,
          352,
          353,
          376,
          710,
          732,
          8194,
          8195,
          8201,
          8204,
          8205,
          8206,
          8207,
          8211,
          8212,
          8216,
          8217,
          8218,
          8220,
          8221,
          8222,
          8224,
          8225,
          8240,
          8249,
          8250,
          8364,
          402,
          913,
          914,
          915,
          916,
          917,
          918,
          919,
          920,
          921,
          922,
          923,
          924,
          925,
          926,
          927,
          928,
          929,
          931,
          932,
          933,
          934,
          935,
          936,
          937,
          945,
          946,
          947,
          948,
          949,
          950,
          951,
          952,
          953,
          954,
          955,
          956,
          957,
          958,
          959,
          960,
          961,
          962,
          963,
          964,
          965,
          966,
          967,
          968,
          969,
          977,
          978,
          982,
          8226,
          8230,
          8242,
          8243,
          8254,
          8260,
          8472,
          8465,
          8476,
          8482,
          8501,
          8592,
          8593,
          8594,
          8595,
          8596,
          8629,
          8656,
          8657,
          8658,
          8659,
          8660,
          8704,
          8706,
          8707,
          8709,
          8711,
          8712,
          8713,
          8715,
          8719,
          8721,
          8722,
          8727,
          8730,
          8733,
          8734,
          8736,
          8743,
          8744,
          8745,
          8746,
          8747,
          8756,
          8764,
          8773,
          8776,
          8800,
          8801,
          8804,
          8805,
          8834,
          8835,
          8836,
          8838,
          8839,
          8853,
          8855,
          8869,
          8901,
          8968,
          8969,
          8970,
          8971,
          9001,
          9002,
          9674,
          9824,
          9827,
          9829,
          9830,
        ];
        alphaIndex = {};
        numIndex = {};
        i = 0;
        length = HTML_ALPHA.length;
        while (i < length) {
          const a = HTML_ALPHA[i];
          const c = HTML_CODES[i];
          alphaIndex[a] = String.fromCharCode(c);
          numIndex[c] = a;
          i++;
        }
        exports_109("default", {
          encode,
          decode,
          encodeNonUTF,
          encodeNonASCII,
        });
      },
    };
  },
);
System.register(
  "https://deno.land/x/html_entities@v1.0/lib/html5-entities",
  [],
  function (exports_110, context_110) {
    "use strict";
    var ENTITIES, alphaIndex, charIndex;
    var __moduleName = context_110 && context_110.id;
    /**
     * @param {Object} alphaIndex Passed by reference.
     * @param {Object} charIndex Passed by reference.
     */
    function createIndexes(alphaIndex, charIndex) {
      let i = ENTITIES.length;
      const _results = [];
      while (i--) {
        const e = ENTITIES[i];
        const alpha = e[0];
        const chars = e[1];
        const chr = chars[0];
        const addChar = chr < 32 ||
          chr > 126 ||
          chr === 62 ||
          chr === 60 ||
          chr === 38 ||
          chr === 34 ||
          chr === 39;
        let charInfo;
        if (addChar) {
          charInfo = charIndex[chr] = charIndex[chr] || {};
        }
        if (chars[1]) {
          const chr2 = chars[1];
          alphaIndex[alpha] = String.fromCharCode(chr) +
            String.fromCharCode(chr2);
          _results.push(addChar && (charInfo[chr2] = alpha));
        } else {
          alphaIndex[alpha] = String.fromCharCode(chr);
          _results.push(addChar && (charInfo[""] = alpha));
        }
      }
    }
    /**
     * @param {String} str
     * @returns {String}
     */
    function decode(str) {
      if (!str || !str.length) {
        return "";
      }
      return str.replace(/&(#?[\w\d]+);?/g, function (s, entity) {
        var chr;
        if (entity.charAt(0) === "#") {
          var code = entity.charAt(1) === "x"
            ? parseInt(entity.substr(2).toLowerCase(), 16)
            : parseInt(entity.substr(1));
          if (!(isNaN(code) || code < -32768 || code > 65535)) {
            chr = String.fromCharCode(code);
          }
        } else {
          chr = alphaIndex[entity];
        }
        return chr || s;
      });
    }
    exports_110("decode", decode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encode(str) {
      if (!str || !str.length) {
        return "";
      }
      var strLength = str.length;
      var result = "";
      var i = 0;
      while (i < strLength) {
        var charInfo = charIndex[str.charCodeAt(i)];
        if (charInfo) {
          var alpha = charInfo[str.charCodeAt(i + 1)];
          if (alpha) {
            i++;
          } else {
            alpha = charInfo[""];
          }
          if (alpha) {
            result += "&" + alpha + ";";
            i++;
            continue;
          }
        }
        result += str.charAt(i);
        i++;
      }
      return result;
    }
    exports_110("encode", encode);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonUTF(str) {
      if (!str || !str.length) {
        return "";
      }
      var strLength = str.length;
      var result = "";
      var i = 0;
      while (i < strLength) {
        var c = str.charCodeAt(i);
        var charInfo = charIndex[c];
        if (charInfo) {
          var alpha = charInfo[str.charCodeAt(i + 1)];
          if (alpha) {
            i++;
          } else {
            alpha = charInfo[""];
          }
          if (alpha) {
            result += "&" + alpha + ";";
            i++;
            continue;
          }
        }
        if (c < 32 || c > 126) {
          result += "&#" + c + ";";
        } else {
          result += str.charAt(i);
        }
        i++;
      }
      return result;
    }
    exports_110("encodeNonUTF", encodeNonUTF);
    /**
     * @param {String} str
     * @returns {String}
     */
    function encodeNonASCII(str) {
      if (!str || !str.length) {
        return "";
      }
      var strLength = str.length;
      var result = "";
      var i = 0;
      while (i < strLength) {
        var c = str.charCodeAt(i);
        if (c <= 255) {
          result += str[i++];
          continue;
        }
        result += "&#" + c + ";";
        i++;
      }
      return result;
    }
    exports_110("encodeNonASCII", encodeNonASCII);
    return {
      setters: [],
      execute: function () {
        ENTITIES = [
          ["Aacute", [193]],
          ["aacute", [225]],
          ["Abreve", [258]],
          ["abreve", [259]],
          ["ac", [8766]],
          ["acd", [8767]],
          ["acE", [8766, 819]],
          ["Acirc", [194]],
          ["acirc", [226]],
          ["acute", [180]],
          ["Acy", [1040]],
          ["acy", [1072]],
          ["AElig", [198]],
          ["aelig", [230]],
          ["af", [8289]],
          ["Afr", [120068]],
          ["afr", [120094]],
          ["Agrave", [192]],
          ["agrave", [224]],
          ["alefsym", [8501]],
          ["aleph", [8501]],
          ["Alpha", [913]],
          ["alpha", [945]],
          ["Amacr", [256]],
          ["amacr", [257]],
          ["amalg", [10815]],
          ["amp", [38]],
          ["AMP", [38]],
          ["andand", [10837]],
          ["And", [10835]],
          ["and", [8743]],
          ["andd", [10844]],
          ["andslope", [10840]],
          ["andv", [10842]],
          ["ang", [8736]],
          ["ange", [10660]],
          ["angle", [8736]],
          ["angmsdaa", [10664]],
          ["angmsdab", [10665]],
          ["angmsdac", [10666]],
          ["angmsdad", [10667]],
          ["angmsdae", [10668]],
          ["angmsdaf", [10669]],
          ["angmsdag", [10670]],
          ["angmsdah", [10671]],
          ["angmsd", [8737]],
          ["angrt", [8735]],
          ["angrtvb", [8894]],
          ["angrtvbd", [10653]],
          ["angsph", [8738]],
          ["angst", [197]],
          ["angzarr", [9084]],
          ["Aogon", [260]],
          ["aogon", [261]],
          ["Aopf", [120120]],
          ["aopf", [120146]],
          ["apacir", [10863]],
          ["ap", [8776]],
          ["apE", [10864]],
          ["ape", [8778]],
          ["apid", [8779]],
          ["apos", [39]],
          ["ApplyFunction", [8289]],
          ["approx", [8776]],
          ["approxeq", [8778]],
          ["Aring", [197]],
          ["aring", [229]],
          ["Ascr", [119964]],
          ["ascr", [119990]],
          ["Assign", [8788]],
          ["ast", [42]],
          ["asymp", [8776]],
          ["asympeq", [8781]],
          ["Atilde", [195]],
          ["atilde", [227]],
          ["Auml", [196]],
          ["auml", [228]],
          ["awconint", [8755]],
          ["awint", [10769]],
          ["backcong", [8780]],
          ["backepsilon", [1014]],
          ["backprime", [8245]],
          ["backsim", [8765]],
          ["backsimeq", [8909]],
          ["Backslash", [8726]],
          ["Barv", [10983]],
          ["barvee", [8893]],
          ["barwed", [8965]],
          ["Barwed", [8966]],
          ["barwedge", [8965]],
          ["bbrk", [9141]],
          ["bbrktbrk", [9142]],
          ["bcong", [8780]],
          ["Bcy", [1041]],
          ["bcy", [1073]],
          ["bdquo", [8222]],
          ["becaus", [8757]],
          ["because", [8757]],
          ["Because", [8757]],
          ["bemptyv", [10672]],
          ["bepsi", [1014]],
          ["bernou", [8492]],
          ["Bernoullis", [8492]],
          ["Beta", [914]],
          ["beta", [946]],
          ["beth", [8502]],
          ["between", [8812]],
          ["Bfr", [120069]],
          ["bfr", [120095]],
          ["bigcap", [8898]],
          ["bigcirc", [9711]],
          ["bigcup", [8899]],
          ["bigodot", [10752]],
          ["bigoplus", [10753]],
          ["bigotimes", [10754]],
          ["bigsqcup", [10758]],
          ["bigstar", [9733]],
          ["bigtriangledown", [9661]],
          ["bigtriangleup", [9651]],
          ["biguplus", [10756]],
          ["bigvee", [8897]],
          ["bigwedge", [8896]],
          ["bkarow", [10509]],
          ["blacklozenge", [10731]],
          ["blacksquare", [9642]],
          ["blacktriangle", [9652]],
          ["blacktriangledown", [9662]],
          ["blacktriangleleft", [9666]],
          ["blacktriangleright", [9656]],
          ["blank", [9251]],
          ["blk12", [9618]],
          ["blk14", [9617]],
          ["blk34", [9619]],
          ["block", [9608]],
          ["bne", [61, 8421]],
          ["bnequiv", [8801, 8421]],
          ["bNot", [10989]],
          ["bnot", [8976]],
          ["Bopf", [120121]],
          ["bopf", [120147]],
          ["bot", [8869]],
          ["bottom", [8869]],
          ["bowtie", [8904]],
          ["boxbox", [10697]],
          ["boxdl", [9488]],
          ["boxdL", [9557]],
          ["boxDl", [9558]],
          ["boxDL", [9559]],
          ["boxdr", [9484]],
          ["boxdR", [9554]],
          ["boxDr", [9555]],
          ["boxDR", [9556]],
          ["boxh", [9472]],
          ["boxH", [9552]],
          ["boxhd", [9516]],
          ["boxHd", [9572]],
          ["boxhD", [9573]],
          ["boxHD", [9574]],
          ["boxhu", [9524]],
          ["boxHu", [9575]],
          ["boxhU", [9576]],
          ["boxHU", [9577]],
          ["boxminus", [8863]],
          ["boxplus", [8862]],
          ["boxtimes", [8864]],
          ["boxul", [9496]],
          ["boxuL", [9563]],
          ["boxUl", [9564]],
          ["boxUL", [9565]],
          ["boxur", [9492]],
          ["boxuR", [9560]],
          ["boxUr", [9561]],
          ["boxUR", [9562]],
          ["boxv", [9474]],
          ["boxV", [9553]],
          ["boxvh", [9532]],
          ["boxvH", [9578]],
          ["boxVh", [9579]],
          ["boxVH", [9580]],
          ["boxvl", [9508]],
          ["boxvL", [9569]],
          ["boxVl", [9570]],
          ["boxVL", [9571]],
          ["boxvr", [9500]],
          ["boxvR", [9566]],
          ["boxVr", [9567]],
          ["boxVR", [9568]],
          ["bprime", [8245]],
          ["breve", [728]],
          ["Breve", [728]],
          ["brvbar", [166]],
          ["bscr", [119991]],
          ["Bscr", [8492]],
          ["bsemi", [8271]],
          ["bsim", [8765]],
          ["bsime", [8909]],
          ["bsolb", [10693]],
          ["bsol", [92]],
          ["bsolhsub", [10184]],
          ["bull", [8226]],
          ["bullet", [8226]],
          ["bump", [8782]],
          ["bumpE", [10926]],
          ["bumpe", [8783]],
          ["Bumpeq", [8782]],
          ["bumpeq", [8783]],
          ["Cacute", [262]],
          ["cacute", [263]],
          ["capand", [10820]],
          ["capbrcup", [10825]],
          ["capcap", [10827]],
          ["cap", [8745]],
          ["Cap", [8914]],
          ["capcup", [10823]],
          ["capdot", [10816]],
          ["CapitalDifferentialD", [8517]],
          ["caps", [8745, 65024]],
          ["caret", [8257]],
          ["caron", [711]],
          ["Cayleys", [8493]],
          ["ccaps", [10829]],
          ["Ccaron", [268]],
          ["ccaron", [269]],
          ["Ccedil", [199]],
          ["ccedil", [231]],
          ["Ccirc", [264]],
          ["ccirc", [265]],
          ["Cconint", [8752]],
          ["ccups", [10828]],
          ["ccupssm", [10832]],
          ["Cdot", [266]],
          ["cdot", [267]],
          ["cedil", [184]],
          ["Cedilla", [184]],
          ["cemptyv", [10674]],
          ["cent", [162]],
          ["centerdot", [183]],
          ["CenterDot", [183]],
          ["cfr", [120096]],
          ["Cfr", [8493]],
          ["CHcy", [1063]],
          ["chcy", [1095]],
          ["check", [10003]],
          ["checkmark", [10003]],
          ["Chi", [935]],
          ["chi", [967]],
          ["circ", [710]],
          ["circeq", [8791]],
          ["circlearrowleft", [8634]],
          ["circlearrowright", [8635]],
          ["circledast", [8859]],
          ["circledcirc", [8858]],
          ["circleddash", [8861]],
          ["CircleDot", [8857]],
          ["circledR", [174]],
          ["circledS", [9416]],
          ["CircleMinus", [8854]],
          ["CirclePlus", [8853]],
          ["CircleTimes", [8855]],
          ["cir", [9675]],
          ["cirE", [10691]],
          ["cire", [8791]],
          ["cirfnint", [10768]],
          ["cirmid", [10991]],
          ["cirscir", [10690]],
          ["ClockwiseContourIntegral", [8754]],
          ["clubs", [9827]],
          ["clubsuit", [9827]],
          ["colon", [58]],
          ["Colon", [8759]],
          ["Colone", [10868]],
          ["colone", [8788]],
          ["coloneq", [8788]],
          ["comma", [44]],
          ["commat", [64]],
          ["comp", [8705]],
          ["compfn", [8728]],
          ["complement", [8705]],
          ["complexes", [8450]],
          ["cong", [8773]],
          ["congdot", [10861]],
          ["Congruent", [8801]],
          ["conint", [8750]],
          ["Conint", [8751]],
          ["ContourIntegral", [8750]],
          ["copf", [120148]],
          ["Copf", [8450]],
          ["coprod", [8720]],
          ["Coproduct", [8720]],
          ["copy", [169]],
          ["COPY", [169]],
          ["copysr", [8471]],
          ["CounterClockwiseContourIntegral", [8755]],
          ["crarr", [8629]],
          ["cross", [10007]],
          ["Cross", [10799]],
          ["Cscr", [119966]],
          ["cscr", [119992]],
          ["csub", [10959]],
          ["csube", [10961]],
          ["csup", [10960]],
          ["csupe", [10962]],
          ["ctdot", [8943]],
          ["cudarrl", [10552]],
          ["cudarrr", [10549]],
          ["cuepr", [8926]],
          ["cuesc", [8927]],
          ["cularr", [8630]],
          ["cularrp", [10557]],
          ["cupbrcap", [10824]],
          ["cupcap", [10822]],
          ["CupCap", [8781]],
          ["cup", [8746]],
          ["Cup", [8915]],
          ["cupcup", [10826]],
          ["cupdot", [8845]],
          ["cupor", [10821]],
          ["cups", [8746, 65024]],
          ["curarr", [8631]],
          ["curarrm", [10556]],
          ["curlyeqprec", [8926]],
          ["curlyeqsucc", [8927]],
          ["curlyvee", [8910]],
          ["curlywedge", [8911]],
          ["curren", [164]],
          ["curvearrowleft", [8630]],
          ["curvearrowright", [8631]],
          ["cuvee", [8910]],
          ["cuwed", [8911]],
          ["cwconint", [8754]],
          ["cwint", [8753]],
          ["cylcty", [9005]],
          ["dagger", [8224]],
          ["Dagger", [8225]],
          ["daleth", [8504]],
          ["darr", [8595]],
          ["Darr", [8609]],
          ["dArr", [8659]],
          ["dash", [8208]],
          ["Dashv", [10980]],
          ["dashv", [8867]],
          ["dbkarow", [10511]],
          ["dblac", [733]],
          ["Dcaron", [270]],
          ["dcaron", [271]],
          ["Dcy", [1044]],
          ["dcy", [1076]],
          ["ddagger", [8225]],
          ["ddarr", [8650]],
          ["DD", [8517]],
          ["dd", [8518]],
          ["DDotrahd", [10513]],
          ["ddotseq", [10871]],
          ["deg", [176]],
          ["Del", [8711]],
          ["Delta", [916]],
          ["delta", [948]],
          ["demptyv", [10673]],
          ["dfisht", [10623]],
          ["Dfr", [120071]],
          ["dfr", [120097]],
          ["dHar", [10597]],
          ["dharl", [8643]],
          ["dharr", [8642]],
          ["DiacriticalAcute", [180]],
          ["DiacriticalDot", [729]],
          ["DiacriticalDoubleAcute", [733]],
          ["DiacriticalGrave", [96]],
          ["DiacriticalTilde", [732]],
          ["diam", [8900]],
          ["diamond", [8900]],
          ["Diamond", [8900]],
          ["diamondsuit", [9830]],
          ["diams", [9830]],
          ["die", [168]],
          ["DifferentialD", [8518]],
          ["digamma", [989]],
          ["disin", [8946]],
          ["div", [247]],
          ["divide", [247]],
          ["divideontimes", [8903]],
          ["divonx", [8903]],
          ["DJcy", [1026]],
          ["djcy", [1106]],
          ["dlcorn", [8990]],
          ["dlcrop", [8973]],
          ["dollar", [36]],
          ["Dopf", [120123]],
          ["dopf", [120149]],
          ["Dot", [168]],
          ["dot", [729]],
          ["DotDot", [8412]],
          ["doteq", [8784]],
          ["doteqdot", [8785]],
          ["DotEqual", [8784]],
          ["dotminus", [8760]],
          ["dotplus", [8724]],
          ["dotsquare", [8865]],
          ["doublebarwedge", [8966]],
          ["DoubleContourIntegral", [8751]],
          ["DoubleDot", [168]],
          ["DoubleDownArrow", [8659]],
          ["DoubleLeftArrow", [8656]],
          ["DoubleLeftRightArrow", [8660]],
          ["DoubleLeftTee", [10980]],
          ["DoubleLongLeftArrow", [10232]],
          ["DoubleLongLeftRightArrow", [10234]],
          ["DoubleLongRightArrow", [10233]],
          ["DoubleRightArrow", [8658]],
          ["DoubleRightTee", [8872]],
          ["DoubleUpArrow", [8657]],
          ["DoubleUpDownArrow", [8661]],
          ["DoubleVerticalBar", [8741]],
          ["DownArrowBar", [10515]],
          ["downarrow", [8595]],
          ["DownArrow", [8595]],
          ["Downarrow", [8659]],
          ["DownArrowUpArrow", [8693]],
          ["DownBreve", [785]],
          ["downdownarrows", [8650]],
          ["downharpoonleft", [8643]],
          ["downharpoonright", [8642]],
          ["DownLeftRightVector", [10576]],
          ["DownLeftTeeVector", [10590]],
          ["DownLeftVectorBar", [10582]],
          ["DownLeftVector", [8637]],
          ["DownRightTeeVector", [10591]],
          ["DownRightVectorBar", [10583]],
          ["DownRightVector", [8641]],
          ["DownTeeArrow", [8615]],
          ["DownTee", [8868]],
          ["drbkarow", [10512]],
          ["drcorn", [8991]],
          ["drcrop", [8972]],
          ["Dscr", [119967]],
          ["dscr", [119993]],
          ["DScy", [1029]],
          ["dscy", [1109]],
          ["dsol", [10742]],
          ["Dstrok", [272]],
          ["dstrok", [273]],
          ["dtdot", [8945]],
          ["dtri", [9663]],
          ["dtrif", [9662]],
          ["duarr", [8693]],
          ["duhar", [10607]],
          ["dwangle", [10662]],
          ["DZcy", [1039]],
          ["dzcy", [1119]],
          ["dzigrarr", [10239]],
          ["Eacute", [201]],
          ["eacute", [233]],
          ["easter", [10862]],
          ["Ecaron", [282]],
          ["ecaron", [283]],
          ["Ecirc", [202]],
          ["ecirc", [234]],
          ["ecir", [8790]],
          ["ecolon", [8789]],
          ["Ecy", [1069]],
          ["ecy", [1101]],
          ["eDDot", [10871]],
          ["Edot", [278]],
          ["edot", [279]],
          ["eDot", [8785]],
          ["ee", [8519]],
          ["efDot", [8786]],
          ["Efr", [120072]],
          ["efr", [120098]],
          ["eg", [10906]],
          ["Egrave", [200]],
          ["egrave", [232]],
          ["egs", [10902]],
          ["egsdot", [10904]],
          ["el", [10905]],
          ["Element", [8712]],
          ["elinters", [9191]],
          ["ell", [8467]],
          ["els", [10901]],
          ["elsdot", [10903]],
          ["Emacr", [274]],
          ["emacr", [275]],
          ["empty", [8709]],
          ["emptyset", [8709]],
          ["EmptySmallSquare", [9723]],
          ["emptyv", [8709]],
          ["EmptyVerySmallSquare", [9643]],
          ["emsp13", [8196]],
          ["emsp14", [8197]],
          ["emsp", [8195]],
          ["ENG", [330]],
          ["eng", [331]],
          ["ensp", [8194]],
          ["Eogon", [280]],
          ["eogon", [281]],
          ["Eopf", [120124]],
          ["eopf", [120150]],
          ["epar", [8917]],
          ["eparsl", [10723]],
          ["eplus", [10865]],
          ["epsi", [949]],
          ["Epsilon", [917]],
          ["epsilon", [949]],
          ["epsiv", [1013]],
          ["eqcirc", [8790]],
          ["eqcolon", [8789]],
          ["eqsim", [8770]],
          ["eqslantgtr", [10902]],
          ["eqslantless", [10901]],
          ["Equal", [10869]],
          ["equals", [61]],
          ["EqualTilde", [8770]],
          ["equest", [8799]],
          ["Equilibrium", [8652]],
          ["equiv", [8801]],
          ["equivDD", [10872]],
          ["eqvparsl", [10725]],
          ["erarr", [10609]],
          ["erDot", [8787]],
          ["escr", [8495]],
          ["Escr", [8496]],
          ["esdot", [8784]],
          ["Esim", [10867]],
          ["esim", [8770]],
          ["Eta", [919]],
          ["eta", [951]],
          ["ETH", [208]],
          ["eth", [240]],
          ["Euml", [203]],
          ["euml", [235]],
          ["euro", [8364]],
          ["excl", [33]],
          ["exist", [8707]],
          ["Exists", [8707]],
          ["expectation", [8496]],
          ["exponentiale", [8519]],
          ["ExponentialE", [8519]],
          ["fallingdotseq", [8786]],
          ["Fcy", [1060]],
          ["fcy", [1092]],
          ["female", [9792]],
          ["ffilig", [64259]],
          ["fflig", [64256]],
          ["ffllig", [64260]],
          ["Ffr", [120073]],
          ["ffr", [120099]],
          ["filig", [64257]],
          ["FilledSmallSquare", [9724]],
          ["FilledVerySmallSquare", [9642]],
          ["fjlig", [102, 106]],
          ["flat", [9837]],
          ["fllig", [64258]],
          ["fltns", [9649]],
          ["fnof", [402]],
          ["Fopf", [120125]],
          ["fopf", [120151]],
          ["forall", [8704]],
          ["ForAll", [8704]],
          ["fork", [8916]],
          ["forkv", [10969]],
          ["Fouriertrf", [8497]],
          ["fpartint", [10765]],
          ["frac12", [189]],
          ["frac13", [8531]],
          ["frac14", [188]],
          ["frac15", [8533]],
          ["frac16", [8537]],
          ["frac18", [8539]],
          ["frac23", [8532]],
          ["frac25", [8534]],
          ["frac34", [190]],
          ["frac35", [8535]],
          ["frac38", [8540]],
          ["frac45", [8536]],
          ["frac56", [8538]],
          ["frac58", [8541]],
          ["frac78", [8542]],
          ["frasl", [8260]],
          ["frown", [8994]],
          ["fscr", [119995]],
          ["Fscr", [8497]],
          ["gacute", [501]],
          ["Gamma", [915]],
          ["gamma", [947]],
          ["Gammad", [988]],
          ["gammad", [989]],
          ["gap", [10886]],
          ["Gbreve", [286]],
          ["gbreve", [287]],
          ["Gcedil", [290]],
          ["Gcirc", [284]],
          ["gcirc", [285]],
          ["Gcy", [1043]],
          ["gcy", [1075]],
          ["Gdot", [288]],
          ["gdot", [289]],
          ["ge", [8805]],
          ["gE", [8807]],
          ["gEl", [10892]],
          ["gel", [8923]],
          ["geq", [8805]],
          ["geqq", [8807]],
          ["geqslant", [10878]],
          ["gescc", [10921]],
          ["ges", [10878]],
          ["gesdot", [10880]],
          ["gesdoto", [10882]],
          ["gesdotol", [10884]],
          ["gesl", [8923, 65024]],
          ["gesles", [10900]],
          ["Gfr", [120074]],
          ["gfr", [120100]],
          ["gg", [8811]],
          ["Gg", [8921]],
          ["ggg", [8921]],
          ["gimel", [8503]],
          ["GJcy", [1027]],
          ["gjcy", [1107]],
          ["gla", [10917]],
          ["gl", [8823]],
          ["glE", [10898]],
          ["glj", [10916]],
          ["gnap", [10890]],
          ["gnapprox", [10890]],
          ["gne", [10888]],
          ["gnE", [8809]],
          ["gneq", [10888]],
          ["gneqq", [8809]],
          ["gnsim", [8935]],
          ["Gopf", [120126]],
          ["gopf", [120152]],
          ["grave", [96]],
          ["GreaterEqual", [8805]],
          ["GreaterEqualLess", [8923]],
          ["GreaterFullEqual", [8807]],
          ["GreaterGreater", [10914]],
          ["GreaterLess", [8823]],
          ["GreaterSlantEqual", [10878]],
          ["GreaterTilde", [8819]],
          ["Gscr", [119970]],
          ["gscr", [8458]],
          ["gsim", [8819]],
          ["gsime", [10894]],
          ["gsiml", [10896]],
          ["gtcc", [10919]],
          ["gtcir", [10874]],
          ["gt", [62]],
          ["GT", [62]],
          ["Gt", [8811]],
          ["gtdot", [8919]],
          ["gtlPar", [10645]],
          ["gtquest", [10876]],
          ["gtrapprox", [10886]],
          ["gtrarr", [10616]],
          ["gtrdot", [8919]],
          ["gtreqless", [8923]],
          ["gtreqqless", [10892]],
          ["gtrless", [8823]],
          ["gtrsim", [8819]],
          ["gvertneqq", [8809, 65024]],
          ["gvnE", [8809, 65024]],
          ["Hacek", [711]],
          ["hairsp", [8202]],
          ["half", [189]],
          ["hamilt", [8459]],
          ["HARDcy", [1066]],
          ["hardcy", [1098]],
          ["harrcir", [10568]],
          ["harr", [8596]],
          ["hArr", [8660]],
          ["harrw", [8621]],
          ["Hat", [94]],
          ["hbar", [8463]],
          ["Hcirc", [292]],
          ["hcirc", [293]],
          ["hearts", [9829]],
          ["heartsuit", [9829]],
          ["hellip", [8230]],
          ["hercon", [8889]],
          ["hfr", [120101]],
          ["Hfr", [8460]],
          ["HilbertSpace", [8459]],
          ["hksearow", [10533]],
          ["hkswarow", [10534]],
          ["hoarr", [8703]],
          ["homtht", [8763]],
          ["hookleftarrow", [8617]],
          ["hookrightarrow", [8618]],
          ["hopf", [120153]],
          ["Hopf", [8461]],
          ["horbar", [8213]],
          ["HorizontalLine", [9472]],
          ["hscr", [119997]],
          ["Hscr", [8459]],
          ["hslash", [8463]],
          ["Hstrok", [294]],
          ["hstrok", [295]],
          ["HumpDownHump", [8782]],
          ["HumpEqual", [8783]],
          ["hybull", [8259]],
          ["hyphen", [8208]],
          ["Iacute", [205]],
          ["iacute", [237]],
          ["ic", [8291]],
          ["Icirc", [206]],
          ["icirc", [238]],
          ["Icy", [1048]],
          ["icy", [1080]],
          ["Idot", [304]],
          ["IEcy", [1045]],
          ["iecy", [1077]],
          ["iexcl", [161]],
          ["iff", [8660]],
          ["ifr", [120102]],
          ["Ifr", [8465]],
          ["Igrave", [204]],
          ["igrave", [236]],
          ["ii", [8520]],
          ["iiiint", [10764]],
          ["iiint", [8749]],
          ["iinfin", [10716]],
          ["iiota", [8489]],
          ["IJlig", [306]],
          ["ijlig", [307]],
          ["Imacr", [298]],
          ["imacr", [299]],
          ["image", [8465]],
          ["ImaginaryI", [8520]],
          ["imagline", [8464]],
          ["imagpart", [8465]],
          ["imath", [305]],
          ["Im", [8465]],
          ["imof", [8887]],
          ["imped", [437]],
          ["Implies", [8658]],
          ["incare", [8453]],
          ["in", [8712]],
          ["infin", [8734]],
          ["infintie", [10717]],
          ["inodot", [305]],
          ["intcal", [8890]],
          ["int", [8747]],
          ["Int", [8748]],
          ["integers", [8484]],
          ["Integral", [8747]],
          ["intercal", [8890]],
          ["Intersection", [8898]],
          ["intlarhk", [10775]],
          ["intprod", [10812]],
          ["InvisibleComma", [8291]],
          ["InvisibleTimes", [8290]],
          ["IOcy", [1025]],
          ["iocy", [1105]],
          ["Iogon", [302]],
          ["iogon", [303]],
          ["Iopf", [120128]],
          ["iopf", [120154]],
          ["Iota", [921]],
          ["iota", [953]],
          ["iprod", [10812]],
          ["iquest", [191]],
          ["iscr", [119998]],
          ["Iscr", [8464]],
          ["isin", [8712]],
          ["isindot", [8949]],
          ["isinE", [8953]],
          ["isins", [8948]],
          ["isinsv", [8947]],
          ["isinv", [8712]],
          ["it", [8290]],
          ["Itilde", [296]],
          ["itilde", [297]],
          ["Iukcy", [1030]],
          ["iukcy", [1110]],
          ["Iuml", [207]],
          ["iuml", [239]],
          ["Jcirc", [308]],
          ["jcirc", [309]],
          ["Jcy", [1049]],
          ["jcy", [1081]],
          ["Jfr", [120077]],
          ["jfr", [120103]],
          ["jmath", [567]],
          ["Jopf", [120129]],
          ["jopf", [120155]],
          ["Jscr", [119973]],
          ["jscr", [119999]],
          ["Jsercy", [1032]],
          ["jsercy", [1112]],
          ["Jukcy", [1028]],
          ["jukcy", [1108]],
          ["Kappa", [922]],
          ["kappa", [954]],
          ["kappav", [1008]],
          ["Kcedil", [310]],
          ["kcedil", [311]],
          ["Kcy", [1050]],
          ["kcy", [1082]],
          ["Kfr", [120078]],
          ["kfr", [120104]],
          ["kgreen", [312]],
          ["KHcy", [1061]],
          ["khcy", [1093]],
          ["KJcy", [1036]],
          ["kjcy", [1116]],
          ["Kopf", [120130]],
          ["kopf", [120156]],
          ["Kscr", [119974]],
          ["kscr", [120000]],
          ["lAarr", [8666]],
          ["Lacute", [313]],
          ["lacute", [314]],
          ["laemptyv", [10676]],
          ["lagran", [8466]],
          ["Lambda", [923]],
          ["lambda", [955]],
          ["lang", [10216]],
          ["Lang", [10218]],
          ["langd", [10641]],
          ["langle", [10216]],
          ["lap", [10885]],
          ["Laplacetrf", [8466]],
          ["laquo", [171]],
          ["larrb", [8676]],
          ["larrbfs", [10527]],
          ["larr", [8592]],
          ["Larr", [8606]],
          ["lArr", [8656]],
          ["larrfs", [10525]],
          ["larrhk", [8617]],
          ["larrlp", [8619]],
          ["larrpl", [10553]],
          ["larrsim", [10611]],
          ["larrtl", [8610]],
          ["latail", [10521]],
          ["lAtail", [10523]],
          ["lat", [10923]],
          ["late", [10925]],
          ["lates", [10925, 65024]],
          ["lbarr", [10508]],
          ["lBarr", [10510]],
          ["lbbrk", [10098]],
          ["lbrace", [123]],
          ["lbrack", [91]],
          ["lbrke", [10635]],
          ["lbrksld", [10639]],
          ["lbrkslu", [10637]],
          ["Lcaron", [317]],
          ["lcaron", [318]],
          ["Lcedil", [315]],
          ["lcedil", [316]],
          ["lceil", [8968]],
          ["lcub", [123]],
          ["Lcy", [1051]],
          ["lcy", [1083]],
          ["ldca", [10550]],
          ["ldquo", [8220]],
          ["ldquor", [8222]],
          ["ldrdhar", [10599]],
          ["ldrushar", [10571]],
          ["ldsh", [8626]],
          ["le", [8804]],
          ["lE", [8806]],
          ["LeftAngleBracket", [10216]],
          ["LeftArrowBar", [8676]],
          ["leftarrow", [8592]],
          ["LeftArrow", [8592]],
          ["Leftarrow", [8656]],
          ["LeftArrowRightArrow", [8646]],
          ["leftarrowtail", [8610]],
          ["LeftCeiling", [8968]],
          ["LeftDoubleBracket", [10214]],
          ["LeftDownTeeVector", [10593]],
          ["LeftDownVectorBar", [10585]],
          ["LeftDownVector", [8643]],
          ["LeftFloor", [8970]],
          ["leftharpoondown", [8637]],
          ["leftharpoonup", [8636]],
          ["leftleftarrows", [8647]],
          ["leftrightarrow", [8596]],
          ["LeftRightArrow", [8596]],
          ["Leftrightarrow", [8660]],
          ["leftrightarrows", [8646]],
          ["leftrightharpoons", [8651]],
          ["leftrightsquigarrow", [8621]],
          ["LeftRightVector", [10574]],
          ["LeftTeeArrow", [8612]],
          ["LeftTee", [8867]],
          ["LeftTeeVector", [10586]],
          ["leftthreetimes", [8907]],
          ["LeftTriangleBar", [10703]],
          ["LeftTriangle", [8882]],
          ["LeftTriangleEqual", [8884]],
          ["LeftUpDownVector", [10577]],
          ["LeftUpTeeVector", [10592]],
          ["LeftUpVectorBar", [10584]],
          ["LeftUpVector", [8639]],
          ["LeftVectorBar", [10578]],
          ["LeftVector", [8636]],
          ["lEg", [10891]],
          ["leg", [8922]],
          ["leq", [8804]],
          ["leqq", [8806]],
          ["leqslant", [10877]],
          ["lescc", [10920]],
          ["les", [10877]],
          ["lesdot", [10879]],
          ["lesdoto", [10881]],
          ["lesdotor", [10883]],
          ["lesg", [8922, 65024]],
          ["lesges", [10899]],
          ["lessapprox", [10885]],
          ["lessdot", [8918]],
          ["lesseqgtr", [8922]],
          ["lesseqqgtr", [10891]],
          ["LessEqualGreater", [8922]],
          ["LessFullEqual", [8806]],
          ["LessGreater", [8822]],
          ["lessgtr", [8822]],
          ["LessLess", [10913]],
          ["lesssim", [8818]],
          ["LessSlantEqual", [10877]],
          ["LessTilde", [8818]],
          ["lfisht", [10620]],
          ["lfloor", [8970]],
          ["Lfr", [120079]],
          ["lfr", [120105]],
          ["lg", [8822]],
          ["lgE", [10897]],
          ["lHar", [10594]],
          ["lhard", [8637]],
          ["lharu", [8636]],
          ["lharul", [10602]],
          ["lhblk", [9604]],
          ["LJcy", [1033]],
          ["ljcy", [1113]],
          ["llarr", [8647]],
          ["ll", [8810]],
          ["Ll", [8920]],
          ["llcorner", [8990]],
          ["Lleftarrow", [8666]],
          ["llhard", [10603]],
          ["lltri", [9722]],
          ["Lmidot", [319]],
          ["lmidot", [320]],
          ["lmoustache", [9136]],
          ["lmoust", [9136]],
          ["lnap", [10889]],
          ["lnapprox", [10889]],
          ["lne", [10887]],
          ["lnE", [8808]],
          ["lneq", [10887]],
          ["lneqq", [8808]],
          ["lnsim", [8934]],
          ["loang", [10220]],
          ["loarr", [8701]],
          ["lobrk", [10214]],
          ["longleftarrow", [10229]],
          ["LongLeftArrow", [10229]],
          ["Longleftarrow", [10232]],
          ["longleftrightarrow", [10231]],
          ["LongLeftRightArrow", [10231]],
          ["Longleftrightarrow", [10234]],
          ["longmapsto", [10236]],
          ["longrightarrow", [10230]],
          ["LongRightArrow", [10230]],
          ["Longrightarrow", [10233]],
          ["looparrowleft", [8619]],
          ["looparrowright", [8620]],
          ["lopar", [10629]],
          ["Lopf", [120131]],
          ["lopf", [120157]],
          ["loplus", [10797]],
          ["lotimes", [10804]],
          ["lowast", [8727]],
          ["lowbar", [95]],
          ["LowerLeftArrow", [8601]],
          ["LowerRightArrow", [8600]],
          ["loz", [9674]],
          ["lozenge", [9674]],
          ["lozf", [10731]],
          ["lpar", [40]],
          ["lparlt", [10643]],
          ["lrarr", [8646]],
          ["lrcorner", [8991]],
          ["lrhar", [8651]],
          ["lrhard", [10605]],
          ["lrm", [8206]],
          ["lrtri", [8895]],
          ["lsaquo", [8249]],
          ["lscr", [120001]],
          ["Lscr", [8466]],
          ["lsh", [8624]],
          ["Lsh", [8624]],
          ["lsim", [8818]],
          ["lsime", [10893]],
          ["lsimg", [10895]],
          ["lsqb", [91]],
          ["lsquo", [8216]],
          ["lsquor", [8218]],
          ["Lstrok", [321]],
          ["lstrok", [322]],
          ["ltcc", [10918]],
          ["ltcir", [10873]],
          ["lt", [60]],
          ["LT", [60]],
          ["Lt", [8810]],
          ["ltdot", [8918]],
          ["lthree", [8907]],
          ["ltimes", [8905]],
          ["ltlarr", [10614]],
          ["ltquest", [10875]],
          ["ltri", [9667]],
          ["ltrie", [8884]],
          ["ltrif", [9666]],
          ["ltrPar", [10646]],
          ["lurdshar", [10570]],
          ["luruhar", [10598]],
          ["lvertneqq", [8808, 65024]],
          ["lvnE", [8808, 65024]],
          ["macr", [175]],
          ["male", [9794]],
          ["malt", [10016]],
          ["maltese", [10016]],
          ["Map", [10501]],
          ["map", [8614]],
          ["mapsto", [8614]],
          ["mapstodown", [8615]],
          ["mapstoleft", [8612]],
          ["mapstoup", [8613]],
          ["marker", [9646]],
          ["mcomma", [10793]],
          ["Mcy", [1052]],
          ["mcy", [1084]],
          ["mdash", [8212]],
          ["mDDot", [8762]],
          ["measuredangle", [8737]],
          ["MediumSpace", [8287]],
          ["Mellintrf", [8499]],
          ["Mfr", [120080]],
          ["mfr", [120106]],
          ["mho", [8487]],
          ["micro", [181]],
          ["midast", [42]],
          ["midcir", [10992]],
          ["mid", [8739]],
          ["middot", [183]],
          ["minusb", [8863]],
          ["minus", [8722]],
          ["minusd", [8760]],
          ["minusdu", [10794]],
          ["MinusPlus", [8723]],
          ["mlcp", [10971]],
          ["mldr", [8230]],
          ["mnplus", [8723]],
          ["models", [8871]],
          ["Mopf", [120132]],
          ["mopf", [120158]],
          ["mp", [8723]],
          ["mscr", [120002]],
          ["Mscr", [8499]],
          ["mstpos", [8766]],
          ["Mu", [924]],
          ["mu", [956]],
          ["multimap", [8888]],
          ["mumap", [8888]],
          ["nabla", [8711]],
          ["Nacute", [323]],
          ["nacute", [324]],
          ["nang", [8736, 8402]],
          ["nap", [8777]],
          ["napE", [10864, 824]],
          ["napid", [8779, 824]],
          ["napos", [329]],
          ["napprox", [8777]],
          ["natural", [9838]],
          ["naturals", [8469]],
          ["natur", [9838]],
          ["nbsp", [160]],
          ["nbump", [8782, 824]],
          ["nbumpe", [8783, 824]],
          ["ncap", [10819]],
          ["Ncaron", [327]],
          ["ncaron", [328]],
          ["Ncedil", [325]],
          ["ncedil", [326]],
          ["ncong", [8775]],
          ["ncongdot", [10861, 824]],
          ["ncup", [10818]],
          ["Ncy", [1053]],
          ["ncy", [1085]],
          ["ndash", [8211]],
          ["nearhk", [10532]],
          ["nearr", [8599]],
          ["neArr", [8663]],
          ["nearrow", [8599]],
          ["ne", [8800]],
          ["nedot", [8784, 824]],
          ["NegativeMediumSpace", [8203]],
          ["NegativeThickSpace", [8203]],
          ["NegativeThinSpace", [8203]],
          ["NegativeVeryThinSpace", [8203]],
          ["nequiv", [8802]],
          ["nesear", [10536]],
          ["nesim", [8770, 824]],
          ["NestedGreaterGreater", [8811]],
          ["NestedLessLess", [8810]],
          ["nexist", [8708]],
          ["nexists", [8708]],
          ["Nfr", [120081]],
          ["nfr", [120107]],
          ["ngE", [8807, 824]],
          ["nge", [8817]],
          ["ngeq", [8817]],
          ["ngeqq", [8807, 824]],
          ["ngeqslant", [10878, 824]],
          ["nges", [10878, 824]],
          ["nGg", [8921, 824]],
          ["ngsim", [8821]],
          ["nGt", [8811, 8402]],
          ["ngt", [8815]],
          ["ngtr", [8815]],
          ["nGtv", [8811, 824]],
          ["nharr", [8622]],
          ["nhArr", [8654]],
          ["nhpar", [10994]],
          ["ni", [8715]],
          ["nis", [8956]],
          ["nisd", [8954]],
          ["niv", [8715]],
          ["NJcy", [1034]],
          ["njcy", [1114]],
          ["nlarr", [8602]],
          ["nlArr", [8653]],
          ["nldr", [8229]],
          ["nlE", [8806, 824]],
          ["nle", [8816]],
          ["nleftarrow", [8602]],
          ["nLeftarrow", [8653]],
          ["nleftrightarrow", [8622]],
          ["nLeftrightarrow", [8654]],
          ["nleq", [8816]],
          ["nleqq", [8806, 824]],
          ["nleqslant", [10877, 824]],
          ["nles", [10877, 824]],
          ["nless", [8814]],
          ["nLl", [8920, 824]],
          ["nlsim", [8820]],
          ["nLt", [8810, 8402]],
          ["nlt", [8814]],
          ["nltri", [8938]],
          ["nltrie", [8940]],
          ["nLtv", [8810, 824]],
          ["nmid", [8740]],
          ["NoBreak", [8288]],
          ["NonBreakingSpace", [160]],
          ["nopf", [120159]],
          ["Nopf", [8469]],
          ["Not", [10988]],
          ["not", [172]],
          ["NotCongruent", [8802]],
          ["NotCupCap", [8813]],
          ["NotDoubleVerticalBar", [8742]],
          ["NotElement", [8713]],
          ["NotEqual", [8800]],
          ["NotEqualTilde", [8770, 824]],
          ["NotExists", [8708]],
          ["NotGreater", [8815]],
          ["NotGreaterEqual", [8817]],
          ["NotGreaterFullEqual", [8807, 824]],
          ["NotGreaterGreater", [8811, 824]],
          ["NotGreaterLess", [8825]],
          ["NotGreaterSlantEqual", [10878, 824]],
          ["NotGreaterTilde", [8821]],
          ["NotHumpDownHump", [8782, 824]],
          ["NotHumpEqual", [8783, 824]],
          ["notin", [8713]],
          ["notindot", [8949, 824]],
          ["notinE", [8953, 824]],
          ["notinva", [8713]],
          ["notinvb", [8951]],
          ["notinvc", [8950]],
          ["NotLeftTriangleBar", [10703, 824]],
          ["NotLeftTriangle", [8938]],
          ["NotLeftTriangleEqual", [8940]],
          ["NotLess", [8814]],
          ["NotLessEqual", [8816]],
          ["NotLessGreater", [8824]],
          ["NotLessLess", [8810, 824]],
          ["NotLessSlantEqual", [10877, 824]],
          ["NotLessTilde", [8820]],
          ["NotNestedGreaterGreater", [10914, 824]],
          ["NotNestedLessLess", [10913, 824]],
          ["notni", [8716]],
          ["notniva", [8716]],
          ["notnivb", [8958]],
          ["notnivc", [8957]],
          ["NotPrecedes", [8832]],
          ["NotPrecedesEqual", [10927, 824]],
          ["NotPrecedesSlantEqual", [8928]],
          ["NotReverseElement", [8716]],
          ["NotRightTriangleBar", [10704, 824]],
          ["NotRightTriangle", [8939]],
          ["NotRightTriangleEqual", [8941]],
          ["NotSquareSubset", [8847, 824]],
          ["NotSquareSubsetEqual", [8930]],
          ["NotSquareSuperset", [8848, 824]],
          ["NotSquareSupersetEqual", [8931]],
          ["NotSubset", [8834, 8402]],
          ["NotSubsetEqual", [8840]],
          ["NotSucceeds", [8833]],
          ["NotSucceedsEqual", [10928, 824]],
          ["NotSucceedsSlantEqual", [8929]],
          ["NotSucceedsTilde", [8831, 824]],
          ["NotSuperset", [8835, 8402]],
          ["NotSupersetEqual", [8841]],
          ["NotTilde", [8769]],
          ["NotTildeEqual", [8772]],
          ["NotTildeFullEqual", [8775]],
          ["NotTildeTilde", [8777]],
          ["NotVerticalBar", [8740]],
          ["nparallel", [8742]],
          ["npar", [8742]],
          ["nparsl", [11005, 8421]],
          ["npart", [8706, 824]],
          ["npolint", [10772]],
          ["npr", [8832]],
          ["nprcue", [8928]],
          ["nprec", [8832]],
          ["npreceq", [10927, 824]],
          ["npre", [10927, 824]],
          ["nrarrc", [10547, 824]],
          ["nrarr", [8603]],
          ["nrArr", [8655]],
          ["nrarrw", [8605, 824]],
          ["nrightarrow", [8603]],
          ["nRightarrow", [8655]],
          ["nrtri", [8939]],
          ["nrtrie", [8941]],
          ["nsc", [8833]],
          ["nsccue", [8929]],
          ["nsce", [10928, 824]],
          ["Nscr", [119977]],
          ["nscr", [120003]],
          ["nshortmid", [8740]],
          ["nshortparallel", [8742]],
          ["nsim", [8769]],
          ["nsime", [8772]],
          ["nsimeq", [8772]],
          ["nsmid", [8740]],
          ["nspar", [8742]],
          ["nsqsube", [8930]],
          ["nsqsupe", [8931]],
          ["nsub", [8836]],
          ["nsubE", [10949, 824]],
          ["nsube", [8840]],
          ["nsubset", [8834, 8402]],
          ["nsubseteq", [8840]],
          ["nsubseteqq", [10949, 824]],
          ["nsucc", [8833]],
          ["nsucceq", [10928, 824]],
          ["nsup", [8837]],
          ["nsupE", [10950, 824]],
          ["nsupe", [8841]],
          ["nsupset", [8835, 8402]],
          ["nsupseteq", [8841]],
          ["nsupseteqq", [10950, 824]],
          ["ntgl", [8825]],
          ["Ntilde", [209]],
          ["ntilde", [241]],
          ["ntlg", [8824]],
          ["ntriangleleft", [8938]],
          ["ntrianglelefteq", [8940]],
          ["ntriangleright", [8939]],
          ["ntrianglerighteq", [8941]],
          ["Nu", [925]],
          ["nu", [957]],
          ["num", [35]],
          ["numero", [8470]],
          ["numsp", [8199]],
          ["nvap", [8781, 8402]],
          ["nvdash", [8876]],
          ["nvDash", [8877]],
          ["nVdash", [8878]],
          ["nVDash", [8879]],
          ["nvge", [8805, 8402]],
          ["nvgt", [62, 8402]],
          ["nvHarr", [10500]],
          ["nvinfin", [10718]],
          ["nvlArr", [10498]],
          ["nvle", [8804, 8402]],
          ["nvlt", [60, 8402]],
          ["nvltrie", [8884, 8402]],
          ["nvrArr", [10499]],
          ["nvrtrie", [8885, 8402]],
          ["nvsim", [8764, 8402]],
          ["nwarhk", [10531]],
          ["nwarr", [8598]],
          ["nwArr", [8662]],
          ["nwarrow", [8598]],
          ["nwnear", [10535]],
          ["Oacute", [211]],
          ["oacute", [243]],
          ["oast", [8859]],
          ["Ocirc", [212]],
          ["ocirc", [244]],
          ["ocir", [8858]],
          ["Ocy", [1054]],
          ["ocy", [1086]],
          ["odash", [8861]],
          ["Odblac", [336]],
          ["odblac", [337]],
          ["odiv", [10808]],
          ["odot", [8857]],
          ["odsold", [10684]],
          ["OElig", [338]],
          ["oelig", [339]],
          ["ofcir", [10687]],
          ["Ofr", [120082]],
          ["ofr", [120108]],
          ["ogon", [731]],
          ["Ograve", [210]],
          ["ograve", [242]],
          ["ogt", [10689]],
          ["ohbar", [10677]],
          ["ohm", [937]],
          ["oint", [8750]],
          ["olarr", [8634]],
          ["olcir", [10686]],
          ["olcross", [10683]],
          ["oline", [8254]],
          ["olt", [10688]],
          ["Omacr", [332]],
          ["omacr", [333]],
          ["Omega", [937]],
          ["omega", [969]],
          ["Omicron", [927]],
          ["omicron", [959]],
          ["omid", [10678]],
          ["ominus", [8854]],
          ["Oopf", [120134]],
          ["oopf", [120160]],
          ["opar", [10679]],
          ["OpenCurlyDoubleQuote", [8220]],
          ["OpenCurlyQuote", [8216]],
          ["operp", [10681]],
          ["oplus", [8853]],
          ["orarr", [8635]],
          ["Or", [10836]],
          ["or", [8744]],
          ["ord", [10845]],
          ["order", [8500]],
          ["orderof", [8500]],
          ["ordf", [170]],
          ["ordm", [186]],
          ["origof", [8886]],
          ["oror", [10838]],
          ["orslope", [10839]],
          ["orv", [10843]],
          ["oS", [9416]],
          ["Oscr", [119978]],
          ["oscr", [8500]],
          ["Oslash", [216]],
          ["oslash", [248]],
          ["osol", [8856]],
          ["Otilde", [213]],
          ["otilde", [245]],
          ["otimesas", [10806]],
          ["Otimes", [10807]],
          ["otimes", [8855]],
          ["Ouml", [214]],
          ["ouml", [246]],
          ["ovbar", [9021]],
          ["OverBar", [8254]],
          ["OverBrace", [9182]],
          ["OverBracket", [9140]],
          ["OverParenthesis", [9180]],
          ["para", [182]],
          ["parallel", [8741]],
          ["par", [8741]],
          ["parsim", [10995]],
          ["parsl", [11005]],
          ["part", [8706]],
          ["PartialD", [8706]],
          ["Pcy", [1055]],
          ["pcy", [1087]],
          ["percnt", [37]],
          ["period", [46]],
          ["permil", [8240]],
          ["perp", [8869]],
          ["pertenk", [8241]],
          ["Pfr", [120083]],
          ["pfr", [120109]],
          ["Phi", [934]],
          ["phi", [966]],
          ["phiv", [981]],
          ["phmmat", [8499]],
          ["phone", [9742]],
          ["Pi", [928]],
          ["pi", [960]],
          ["pitchfork", [8916]],
          ["piv", [982]],
          ["planck", [8463]],
          ["planckh", [8462]],
          ["plankv", [8463]],
          ["plusacir", [10787]],
          ["plusb", [8862]],
          ["pluscir", [10786]],
          ["plus", [43]],
          ["plusdo", [8724]],
          ["plusdu", [10789]],
          ["pluse", [10866]],
          ["PlusMinus", [177]],
          ["plusmn", [177]],
          ["plussim", [10790]],
          ["plustwo", [10791]],
          ["pm", [177]],
          ["Poincareplane", [8460]],
          ["pointint", [10773]],
          ["popf", [120161]],
          ["Popf", [8473]],
          ["pound", [163]],
          ["prap", [10935]],
          ["Pr", [10939]],
          ["pr", [8826]],
          ["prcue", [8828]],
          ["precapprox", [10935]],
          ["prec", [8826]],
          ["preccurlyeq", [8828]],
          ["Precedes", [8826]],
          ["PrecedesEqual", [10927]],
          ["PrecedesSlantEqual", [8828]],
          ["PrecedesTilde", [8830]],
          ["preceq", [10927]],
          ["precnapprox", [10937]],
          ["precneqq", [10933]],
          ["precnsim", [8936]],
          ["pre", [10927]],
          ["prE", [10931]],
          ["precsim", [8830]],
          ["prime", [8242]],
          ["Prime", [8243]],
          ["primes", [8473]],
          ["prnap", [10937]],
          ["prnE", [10933]],
          ["prnsim", [8936]],
          ["prod", [8719]],
          ["Product", [8719]],
          ["profalar", [9006]],
          ["profline", [8978]],
          ["profsurf", [8979]],
          ["prop", [8733]],
          ["Proportional", [8733]],
          ["Proportion", [8759]],
          ["propto", [8733]],
          ["prsim", [8830]],
          ["prurel", [8880]],
          ["Pscr", [119979]],
          ["pscr", [120005]],
          ["Psi", [936]],
          ["psi", [968]],
          ["puncsp", [8200]],
          ["Qfr", [120084]],
          ["qfr", [120110]],
          ["qint", [10764]],
          ["qopf", [120162]],
          ["Qopf", [8474]],
          ["qprime", [8279]],
          ["Qscr", [119980]],
          ["qscr", [120006]],
          ["quaternions", [8461]],
          ["quatint", [10774]],
          ["quest", [63]],
          ["questeq", [8799]],
          ["quot", [34]],
          ["QUOT", [34]],
          ["rAarr", [8667]],
          ["race", [8765, 817]],
          ["Racute", [340]],
          ["racute", [341]],
          ["radic", [8730]],
          ["raemptyv", [10675]],
          ["rang", [10217]],
          ["Rang", [10219]],
          ["rangd", [10642]],
          ["range", [10661]],
          ["rangle", [10217]],
          ["raquo", [187]],
          ["rarrap", [10613]],
          ["rarrb", [8677]],
          ["rarrbfs", [10528]],
          ["rarrc", [10547]],
          ["rarr", [8594]],
          ["Rarr", [8608]],
          ["rArr", [8658]],
          ["rarrfs", [10526]],
          ["rarrhk", [8618]],
          ["rarrlp", [8620]],
          ["rarrpl", [10565]],
          ["rarrsim", [10612]],
          ["Rarrtl", [10518]],
          ["rarrtl", [8611]],
          ["rarrw", [8605]],
          ["ratail", [10522]],
          ["rAtail", [10524]],
          ["ratio", [8758]],
          ["rationals", [8474]],
          ["rbarr", [10509]],
          ["rBarr", [10511]],
          ["RBarr", [10512]],
          ["rbbrk", [10099]],
          ["rbrace", [125]],
          ["rbrack", [93]],
          ["rbrke", [10636]],
          ["rbrksld", [10638]],
          ["rbrkslu", [10640]],
          ["Rcaron", [344]],
          ["rcaron", [345]],
          ["Rcedil", [342]],
          ["rcedil", [343]],
          ["rceil", [8969]],
          ["rcub", [125]],
          ["Rcy", [1056]],
          ["rcy", [1088]],
          ["rdca", [10551]],
          ["rdldhar", [10601]],
          ["rdquo", [8221]],
          ["rdquor", [8221]],
          ["CloseCurlyDoubleQuote", [8221]],
          ["rdsh", [8627]],
          ["real", [8476]],
          ["realine", [8475]],
          ["realpart", [8476]],
          ["reals", [8477]],
          ["Re", [8476]],
          ["rect", [9645]],
          ["reg", [174]],
          ["REG", [174]],
          ["ReverseElement", [8715]],
          ["ReverseEquilibrium", [8651]],
          ["ReverseUpEquilibrium", [10607]],
          ["rfisht", [10621]],
          ["rfloor", [8971]],
          ["rfr", [120111]],
          ["Rfr", [8476]],
          ["rHar", [10596]],
          ["rhard", [8641]],
          ["rharu", [8640]],
          ["rharul", [10604]],
          ["Rho", [929]],
          ["rho", [961]],
          ["rhov", [1009]],
          ["RightAngleBracket", [10217]],
          ["RightArrowBar", [8677]],
          ["rightarrow", [8594]],
          ["RightArrow", [8594]],
          ["Rightarrow", [8658]],
          ["RightArrowLeftArrow", [8644]],
          ["rightarrowtail", [8611]],
          ["RightCeiling", [8969]],
          ["RightDoubleBracket", [10215]],
          ["RightDownTeeVector", [10589]],
          ["RightDownVectorBar", [10581]],
          ["RightDownVector", [8642]],
          ["RightFloor", [8971]],
          ["rightharpoondown", [8641]],
          ["rightharpoonup", [8640]],
          ["rightleftarrows", [8644]],
          ["rightleftharpoons", [8652]],
          ["rightrightarrows", [8649]],
          ["rightsquigarrow", [8605]],
          ["RightTeeArrow", [8614]],
          ["RightTee", [8866]],
          ["RightTeeVector", [10587]],
          ["rightthreetimes", [8908]],
          ["RightTriangleBar", [10704]],
          ["RightTriangle", [8883]],
          ["RightTriangleEqual", [8885]],
          ["RightUpDownVector", [10575]],
          ["RightUpTeeVector", [10588]],
          ["RightUpVectorBar", [10580]],
          ["RightUpVector", [8638]],
          ["RightVectorBar", [10579]],
          ["RightVector", [8640]],
          ["ring", [730]],
          ["risingdotseq", [8787]],
          ["rlarr", [8644]],
          ["rlhar", [8652]],
          ["rlm", [8207]],
          ["rmoustache", [9137]],
          ["rmoust", [9137]],
          ["rnmid", [10990]],
          ["roang", [10221]],
          ["roarr", [8702]],
          ["robrk", [10215]],
          ["ropar", [10630]],
          ["ropf", [120163]],
          ["Ropf", [8477]],
          ["roplus", [10798]],
          ["rotimes", [10805]],
          ["RoundImplies", [10608]],
          ["rpar", [41]],
          ["rpargt", [10644]],
          ["rppolint", [10770]],
          ["rrarr", [8649]],
          ["Rrightarrow", [8667]],
          ["rsaquo", [8250]],
          ["rscr", [120007]],
          ["Rscr", [8475]],
          ["rsh", [8625]],
          ["Rsh", [8625]],
          ["rsqb", [93]],
          ["rsquo", [8217]],
          ["rsquor", [8217]],
          ["CloseCurlyQuote", [8217]],
          ["rthree", [8908]],
          ["rtimes", [8906]],
          ["rtri", [9657]],
          ["rtrie", [8885]],
          ["rtrif", [9656]],
          ["rtriltri", [10702]],
          ["RuleDelayed", [10740]],
          ["ruluhar", [10600]],
          ["rx", [8478]],
          ["Sacute", [346]],
          ["sacute", [347]],
          ["sbquo", [8218]],
          ["scap", [10936]],
          ["Scaron", [352]],
          ["scaron", [353]],
          ["Sc", [10940]],
          ["sc", [8827]],
          ["sccue", [8829]],
          ["sce", [10928]],
          ["scE", [10932]],
          ["Scedil", [350]],
          ["scedil", [351]],
          ["Scirc", [348]],
          ["scirc", [349]],
          ["scnap", [10938]],
          ["scnE", [10934]],
          ["scnsim", [8937]],
          ["scpolint", [10771]],
          ["scsim", [8831]],
          ["Scy", [1057]],
          ["scy", [1089]],
          ["sdotb", [8865]],
          ["sdot", [8901]],
          ["sdote", [10854]],
          ["searhk", [10533]],
          ["searr", [8600]],
          ["seArr", [8664]],
          ["searrow", [8600]],
          ["sect", [167]],
          ["semi", [59]],
          ["seswar", [10537]],
          ["setminus", [8726]],
          ["setmn", [8726]],
          ["sext", [10038]],
          ["Sfr", [120086]],
          ["sfr", [120112]],
          ["sfrown", [8994]],
          ["sharp", [9839]],
          ["SHCHcy", [1065]],
          ["shchcy", [1097]],
          ["SHcy", [1064]],
          ["shcy", [1096]],
          ["ShortDownArrow", [8595]],
          ["ShortLeftArrow", [8592]],
          ["shortmid", [8739]],
          ["shortparallel", [8741]],
          ["ShortRightArrow", [8594]],
          ["ShortUpArrow", [8593]],
          ["shy", [173]],
          ["Sigma", [931]],
          ["sigma", [963]],
          ["sigmaf", [962]],
          ["sigmav", [962]],
          ["sim", [8764]],
          ["simdot", [10858]],
          ["sime", [8771]],
          ["simeq", [8771]],
          ["simg", [10910]],
          ["simgE", [10912]],
          ["siml", [10909]],
          ["simlE", [10911]],
          ["simne", [8774]],
          ["simplus", [10788]],
          ["simrarr", [10610]],
          ["slarr", [8592]],
          ["SmallCircle", [8728]],
          ["smallsetminus", [8726]],
          ["smashp", [10803]],
          ["smeparsl", [10724]],
          ["smid", [8739]],
          ["smile", [8995]],
          ["smt", [10922]],
          ["smte", [10924]],
          ["smtes", [10924, 65024]],
          ["SOFTcy", [1068]],
          ["softcy", [1100]],
          ["solbar", [9023]],
          ["solb", [10692]],
          ["sol", [47]],
          ["Sopf", [120138]],
          ["sopf", [120164]],
          ["spades", [9824]],
          ["spadesuit", [9824]],
          ["spar", [8741]],
          ["sqcap", [8851]],
          ["sqcaps", [8851, 65024]],
          ["sqcup", [8852]],
          ["sqcups", [8852, 65024]],
          ["Sqrt", [8730]],
          ["sqsub", [8847]],
          ["sqsube", [8849]],
          ["sqsubset", [8847]],
          ["sqsubseteq", [8849]],
          ["sqsup", [8848]],
          ["sqsupe", [8850]],
          ["sqsupset", [8848]],
          ["sqsupseteq", [8850]],
          ["square", [9633]],
          ["Square", [9633]],
          ["SquareIntersection", [8851]],
          ["SquareSubset", [8847]],
          ["SquareSubsetEqual", [8849]],
          ["SquareSuperset", [8848]],
          ["SquareSupersetEqual", [8850]],
          ["SquareUnion", [8852]],
          ["squarf", [9642]],
          ["squ", [9633]],
          ["squf", [9642]],
          ["srarr", [8594]],
          ["Sscr", [119982]],
          ["sscr", [120008]],
          ["ssetmn", [8726]],
          ["ssmile", [8995]],
          ["sstarf", [8902]],
          ["Star", [8902]],
          ["star", [9734]],
          ["starf", [9733]],
          ["straightepsilon", [1013]],
          ["straightphi", [981]],
          ["strns", [175]],
          ["sub", [8834]],
          ["Sub", [8912]],
          ["subdot", [10941]],
          ["subE", [10949]],
          ["sube", [8838]],
          ["subedot", [10947]],
          ["submult", [10945]],
          ["subnE", [10955]],
          ["subne", [8842]],
          ["subplus", [10943]],
          ["subrarr", [10617]],
          ["subset", [8834]],
          ["Subset", [8912]],
          ["subseteq", [8838]],
          ["subseteqq", [10949]],
          ["SubsetEqual", [8838]],
          ["subsetneq", [8842]],
          ["subsetneqq", [10955]],
          ["subsim", [10951]],
          ["subsub", [10965]],
          ["subsup", [10963]],
          ["succapprox", [10936]],
          ["succ", [8827]],
          ["succcurlyeq", [8829]],
          ["Succeeds", [8827]],
          ["SucceedsEqual", [10928]],
          ["SucceedsSlantEqual", [8829]],
          ["SucceedsTilde", [8831]],
          ["succeq", [10928]],
          ["succnapprox", [10938]],
          ["succneqq", [10934]],
          ["succnsim", [8937]],
          ["succsim", [8831]],
          ["SuchThat", [8715]],
          ["sum", [8721]],
          ["Sum", [8721]],
          ["sung", [9834]],
          ["sup1", [185]],
          ["sup2", [178]],
          ["sup3", [179]],
          ["sup", [8835]],
          ["Sup", [8913]],
          ["supdot", [10942]],
          ["supdsub", [10968]],
          ["supE", [10950]],
          ["supe", [8839]],
          ["supedot", [10948]],
          ["Superset", [8835]],
          ["SupersetEqual", [8839]],
          ["suphsol", [10185]],
          ["suphsub", [10967]],
          ["suplarr", [10619]],
          ["supmult", [10946]],
          ["supnE", [10956]],
          ["supne", [8843]],
          ["supplus", [10944]],
          ["supset", [8835]],
          ["Supset", [8913]],
          ["supseteq", [8839]],
          ["supseteqq", [10950]],
          ["supsetneq", [8843]],
          ["supsetneqq", [10956]],
          ["supsim", [10952]],
          ["supsub", [10964]],
          ["supsup", [10966]],
          ["swarhk", [10534]],
          ["swarr", [8601]],
          ["swArr", [8665]],
          ["swarrow", [8601]],
          ["swnwar", [10538]],
          ["szlig", [223]],
          ["Tab", [9]],
          ["target", [8982]],
          ["Tau", [932]],
          ["tau", [964]],
          ["tbrk", [9140]],
          ["Tcaron", [356]],
          ["tcaron", [357]],
          ["Tcedil", [354]],
          ["tcedil", [355]],
          ["Tcy", [1058]],
          ["tcy", [1090]],
          ["tdot", [8411]],
          ["telrec", [8981]],
          ["Tfr", [120087]],
          ["tfr", [120113]],
          ["there4", [8756]],
          ["therefore", [8756]],
          ["Therefore", [8756]],
          ["Theta", [920]],
          ["theta", [952]],
          ["thetasym", [977]],
          ["thetav", [977]],
          ["thickapprox", [8776]],
          ["thicksim", [8764]],
          ["ThickSpace", [8287, 8202]],
          ["ThinSpace", [8201]],
          ["thinsp", [8201]],
          ["thkap", [8776]],
          ["thksim", [8764]],
          ["THORN", [222]],
          ["thorn", [254]],
          ["tilde", [732]],
          ["Tilde", [8764]],
          ["TildeEqual", [8771]],
          ["TildeFullEqual", [8773]],
          ["TildeTilde", [8776]],
          ["timesbar", [10801]],
          ["timesb", [8864]],
          ["times", [215]],
          ["timesd", [10800]],
          ["tint", [8749]],
          ["toea", [10536]],
          ["topbot", [9014]],
          ["topcir", [10993]],
          ["top", [8868]],
          ["Topf", [120139]],
          ["topf", [120165]],
          ["topfork", [10970]],
          ["tosa", [10537]],
          ["tprime", [8244]],
          ["trade", [8482]],
          ["TRADE", [8482]],
          ["triangle", [9653]],
          ["triangledown", [9663]],
          ["triangleleft", [9667]],
          ["trianglelefteq", [8884]],
          ["triangleq", [8796]],
          ["triangleright", [9657]],
          ["trianglerighteq", [8885]],
          ["tridot", [9708]],
          ["trie", [8796]],
          ["triminus", [10810]],
          ["TripleDot", [8411]],
          ["triplus", [10809]],
          ["trisb", [10701]],
          ["tritime", [10811]],
          ["trpezium", [9186]],
          ["Tscr", [119983]],
          ["tscr", [120009]],
          ["TScy", [1062]],
          ["tscy", [1094]],
          ["TSHcy", [1035]],
          ["tshcy", [1115]],
          ["Tstrok", [358]],
          ["tstrok", [359]],
          ["twixt", [8812]],
          ["twoheadleftarrow", [8606]],
          ["twoheadrightarrow", [8608]],
          ["Uacute", [218]],
          ["uacute", [250]],
          ["uarr", [8593]],
          ["Uarr", [8607]],
          ["uArr", [8657]],
          ["Uarrocir", [10569]],
          ["Ubrcy", [1038]],
          ["ubrcy", [1118]],
          ["Ubreve", [364]],
          ["ubreve", [365]],
          ["Ucirc", [219]],
          ["ucirc", [251]],
          ["Ucy", [1059]],
          ["ucy", [1091]],
          ["udarr", [8645]],
          ["Udblac", [368]],
          ["udblac", [369]],
          ["udhar", [10606]],
          ["ufisht", [10622]],
          ["Ufr", [120088]],
          ["ufr", [120114]],
          ["Ugrave", [217]],
          ["ugrave", [249]],
          ["uHar", [10595]],
          ["uharl", [8639]],
          ["uharr", [8638]],
          ["uhblk", [9600]],
          ["ulcorn", [8988]],
          ["ulcorner", [8988]],
          ["ulcrop", [8975]],
          ["ultri", [9720]],
          ["Umacr", [362]],
          ["umacr", [363]],
          ["uml", [168]],
          ["UnderBar", [95]],
          ["UnderBrace", [9183]],
          ["UnderBracket", [9141]],
          ["UnderParenthesis", [9181]],
          ["Union", [8899]],
          ["UnionPlus", [8846]],
          ["Uogon", [370]],
          ["uogon", [371]],
          ["Uopf", [120140]],
          ["uopf", [120166]],
          ["UpArrowBar", [10514]],
          ["uparrow", [8593]],
          ["UpArrow", [8593]],
          ["Uparrow", [8657]],
          ["UpArrowDownArrow", [8645]],
          ["updownarrow", [8597]],
          ["UpDownArrow", [8597]],
          ["Updownarrow", [8661]],
          ["UpEquilibrium", [10606]],
          ["upharpoonleft", [8639]],
          ["upharpoonright", [8638]],
          ["uplus", [8846]],
          ["UpperLeftArrow", [8598]],
          ["UpperRightArrow", [8599]],
          ["upsi", [965]],
          ["Upsi", [978]],
          ["upsih", [978]],
          ["Upsilon", [933]],
          ["upsilon", [965]],
          ["UpTeeArrow", [8613]],
          ["UpTee", [8869]],
          ["upuparrows", [8648]],
          ["urcorn", [8989]],
          ["urcorner", [8989]],
          ["urcrop", [8974]],
          ["Uring", [366]],
          ["uring", [367]],
          ["urtri", [9721]],
          ["Uscr", [119984]],
          ["uscr", [120010]],
          ["utdot", [8944]],
          ["Utilde", [360]],
          ["utilde", [361]],
          ["utri", [9653]],
          ["utrif", [9652]],
          ["uuarr", [8648]],
          ["Uuml", [220]],
          ["uuml", [252]],
          ["uwangle", [10663]],
          ["vangrt", [10652]],
          ["varepsilon", [1013]],
          ["varkappa", [1008]],
          ["varnothing", [8709]],
          ["varphi", [981]],
          ["varpi", [982]],
          ["varpropto", [8733]],
          ["varr", [8597]],
          ["vArr", [8661]],
          ["varrho", [1009]],
          ["varsigma", [962]],
          ["varsubsetneq", [8842, 65024]],
          ["varsubsetneqq", [10955, 65024]],
          ["varsupsetneq", [8843, 65024]],
          ["varsupsetneqq", [10956, 65024]],
          ["vartheta", [977]],
          ["vartriangleleft", [8882]],
          ["vartriangleright", [8883]],
          ["vBar", [10984]],
          ["Vbar", [10987]],
          ["vBarv", [10985]],
          ["Vcy", [1042]],
          ["vcy", [1074]],
          ["vdash", [8866]],
          ["vDash", [8872]],
          ["Vdash", [8873]],
          ["VDash", [8875]],
          ["Vdashl", [10982]],
          ["veebar", [8891]],
          ["vee", [8744]],
          ["Vee", [8897]],
          ["veeeq", [8794]],
          ["vellip", [8942]],
          ["verbar", [124]],
          ["Verbar", [8214]],
          ["vert", [124]],
          ["Vert", [8214]],
          ["VerticalBar", [8739]],
          ["VerticalLine", [124]],
          ["VerticalSeparator", [10072]],
          ["VerticalTilde", [8768]],
          ["VeryThinSpace", [8202]],
          ["Vfr", [120089]],
          ["vfr", [120115]],
          ["vltri", [8882]],
          ["vnsub", [8834, 8402]],
          ["vnsup", [8835, 8402]],
          ["Vopf", [120141]],
          ["vopf", [120167]],
          ["vprop", [8733]],
          ["vrtri", [8883]],
          ["Vscr", [119985]],
          ["vscr", [120011]],
          ["vsubnE", [10955, 65024]],
          ["vsubne", [8842, 65024]],
          ["vsupnE", [10956, 65024]],
          ["vsupne", [8843, 65024]],
          ["Vvdash", [8874]],
          ["vzigzag", [10650]],
          ["Wcirc", [372]],
          ["wcirc", [373]],
          ["wedbar", [10847]],
          ["wedge", [8743]],
          ["Wedge", [8896]],
          ["wedgeq", [8793]],
          ["weierp", [8472]],
          ["Wfr", [120090]],
          ["wfr", [120116]],
          ["Wopf", [120142]],
          ["wopf", [120168]],
          ["wp", [8472]],
          ["wr", [8768]],
          ["wreath", [8768]],
          ["Wscr", [119986]],
          ["wscr", [120012]],
          ["xcap", [8898]],
          ["xcirc", [9711]],
          ["xcup", [8899]],
          ["xdtri", [9661]],
          ["Xfr", [120091]],
          ["xfr", [120117]],
          ["xharr", [10231]],
          ["xhArr", [10234]],
          ["Xi", [926]],
          ["xi", [958]],
          ["xlarr", [10229]],
          ["xlArr", [10232]],
          ["xmap", [10236]],
          ["xnis", [8955]],
          ["xodot", [10752]],
          ["Xopf", [120143]],
          ["xopf", [120169]],
          ["xoplus", [10753]],
          ["xotime", [10754]],
          ["xrarr", [10230]],
          ["xrArr", [10233]],
          ["Xscr", [119987]],
          ["xscr", [120013]],
          ["xsqcup", [10758]],
          ["xuplus", [10756]],
          ["xutri", [9651]],
          ["xvee", [8897]],
          ["xwedge", [8896]],
          ["Yacute", [221]],
          ["yacute", [253]],
          ["YAcy", [1071]],
          ["yacy", [1103]],
          ["Ycirc", [374]],
          ["ycirc", [375]],
          ["Ycy", [1067]],
          ["ycy", [1099]],
          ["yen", [165]],
          ["Yfr", [120092]],
          ["yfr", [120118]],
          ["YIcy", [1031]],
          ["yicy", [1111]],
          ["Yopf", [120144]],
          ["yopf", [120170]],
          ["Yscr", [119988]],
          ["yscr", [120014]],
          ["YUcy", [1070]],
          ["yucy", [1102]],
          ["yuml", [255]],
          ["Yuml", [376]],
          ["Zacute", [377]],
          ["zacute", [378]],
          ["Zcaron", [381]],
          ["zcaron", [382]],
          ["Zcy", [1047]],
          ["zcy", [1079]],
          ["Zdot", [379]],
          ["zdot", [380]],
          ["zeetrf", [8488]],
          ["ZeroWidthSpace", [8203]],
          ["Zeta", [918]],
          ["zeta", [950]],
          ["zfr", [120119]],
          ["Zfr", [8488]],
          ["ZHcy", [1046]],
          ["zhcy", [1078]],
          ["zigrarr", [8669]],
          ["zopf", [120171]],
          ["Zopf", [8484]],
          ["Zscr", [119989]],
          ["zscr", [120015]],
          ["zwj", [8205]],
          ["zwnj", [8204]],
        ];
        alphaIndex = {};
        charIndex = {};
        createIndexes(alphaIndex, charIndex);
        exports_110("default", {
          encode,
          decode,
          encodeNonUTF,
          encodeNonASCII,
        });
      },
    };
  },
);
System.register(
  "https://deno.land/x/html_entities@v1.0/mod",
  [
    "https://deno.land/x/html_entities@v1.0/lib/xml-entities",
    "https://deno.land/x/html_entities@v1.0/lib/html4-entities",
    "https://deno.land/x/html_entities@v1.0/lib/html5-entities",
  ],
  function (exports_111, context_111) {
    "use strict";
    var __moduleName = context_111 && context_111.id;
    return {
      setters: [
        function (xml_entities_js_1_1) {
          exports_111({
            "XmlEntities": xml_entities_js_1_1["default"],
          });
        },
        function (html4_entities_js_1_1) {
          exports_111({
            "Html4Entities": html4_entities_js_1_1["default"],
          });
        },
        function (html5_entities_js_1_1) {
          exports_111({
            "Html5Entities": html5_entities_js_1_1["default"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/actdb/core/Adapter",
  [],
  function (exports_112, context_112) {
    "use strict";
    var Adapter;
    var __moduleName = context_112 && context_112.id;
    return {
      setters: [],
      execute: function () {
        Adapter = class Adapter {
        };
        exports_112("Adapter", Adapter);
      },
    };
  },
);
System.register(
  "https://deno.land/x/actdb/core/Store",
  ["https://deno.land/x/evt/mod"],
  function (exports_113, context_113) {
    "use strict";
    var mod_ts_6, Store;
    var __moduleName = context_113 && context_113.id;
    return {
      setters: [
        function (mod_ts_6_1) {
          mod_ts_6 = mod_ts_6_1;
        },
      ],
      execute: function () {
        Store = class Store {
          constructor(name, db) {
            this.name = name;
            this.$get = mod_ts_6.Evt.create();
            this.$filter = mod_ts_6.Evt.create();
            this.$insert = mod_ts_6.Evt.create();
            this.$remove = mod_ts_6.Evt.create();
            this.$update = mod_ts_6.Evt.create();
            this.$all = mod_ts_6.Evt.create();
            db.stores.set(name, this);
            this.db = db;
          }
          async insert(item) {
            const { collection, tree } = await this._getCollectionAndTree();
            collection.push(...item);
            this.$insert.post(item);
            this.$all.post(["insert", item]);
            this.db.adapter.write(tree);
          }
          async read() {
            const { collection } = await this._getCollectionAndTree();
            return collection;
          }
          async get(filter) {
            const { collection } = await this._getCollectionAndTree();
            const item = this._find(collection, filter);
            if (item) {
              this.$get.post(item);
              this.$all.post(["get", item]);
              return item;
            }
          }
          async filter(filter) {
            const { collection } = await this._getCollectionAndTree();
            const { filteredItems, filtered } = this._filter(
              collection,
              filter,
            );
            if (filteredItems) {
              this.$filter.post([filteredItems, filtered, filter]);
              this.$all.post(["filter", [filteredItems, filtered, filter]]);
              return filteredItems;
            }
          }
          async remove(filter) {
            let { collection, tree } = await this._getCollectionAndTree();
            const { filtered, filteredItems } = this._filter(
              collection,
              filter,
            );
            collection = filtered;
            this.db.adapter.write(tree);
            this.$remove.post([filtered, filteredItems, filter]);
            this.$all.post(["remove", [filtered, filteredItems, filter]]);
          }
          async update(filter) {
            let { collection, tree } = await this._getCollectionAndTree();
            collection = this._update(collection, filter);
            this.db.adapter.write(tree);
            const updated = this._filter(collection, filter).filtered;
            this.$update.post([collection, updated, filter]);
            this.$all.post(["update", [collection, updated, filter]]);
            return collection;
          }
          async _getCollectionAndTree() {
            const tree = await this.db.adapter.read();
            if (!tree[this.name]) {
              tree[this.name] = [];
            }
            return { collection: tree[this.name], tree };
          }
          _update(collection, properties) {
            return collection?.map((item) => {
              const match = Object.keys(properties).every((prop) => {
                return item[prop] === properties[prop];
              });
              if (match) {
                return { ...item, properties };
              }
              return item;
            });
          }
          _filter(collection, filter) {
            return Object.values(collection).reduce((acc, item) => {
              const match = Object.keys(filter).every((prop) => {
                return item[prop] === filter[prop];
              });
              if (match) {
                acc.filteredItems.push(item);
              } else {
                acc.filtered.push(item);
              }
              return acc;
            }, {
              filtered: [],
              filteredItems: [],
            });
          }
          _find(collection, properties) {
            return collection?.find((item) => {
              return Object.keys(properties).every((prop) => {
                return item[prop] === properties[prop];
              });
            });
          }
        };
        exports_113("Store", Store);
      },
    };
  },
);
System.register(
  "https://deno.land/x/actdb/core/Act",
  ["https://deno.land/x/actdb/core/Store"],
  function (exports_114, context_114) {
    "use strict";
    var Store_ts_1, Act;
    var __moduleName = context_114 && context_114.id;
    return {
      setters: [
        function (Store_ts_1_1) {
          Store_ts_1 = Store_ts_1_1;
        },
      ],
      execute: function () {
        Act = class Act {
          constructor(adapter) {
            this.adapter = adapter;
            this.stores = new Map();
          }
          createStore(name) {
            const store = new Store_ts_1.Store(name, this);
            this.stores.set(name, store);
            return store;
          }
        };
        exports_114("Act", Act);
      },
    };
  },
);
System.register(
  "https://deno.land/std/fs/exists",
  [],
  function (exports_115, context_115) {
    "use strict";
    var lstat, lstatSync;
    var __moduleName = context_115 && context_115.id;
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    async function exists(filePath) {
      try {
        await lstat(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_115("exists", exists);
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    function existsSync(filePath) {
      try {
        lstatSync(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_115("existsSync", existsSync);
    return {
      setters: [],
      execute: function () {
        // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
        lstat = Deno.lstat, lstatSync = Deno.lstatSync;
      },
    };
  },
);
System.register(
  "https://deno.land/std/fs/write_json",
  [],
  function (exports_116, context_116) {
    "use strict";
    var __moduleName = context_116 && context_116.id;
    /* Writes an object to a JSON file. */
    async function writeJson(filePath, object, options = {}) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      await Deno.writeFile(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_116("writeJson", writeJson);
    /* Writes an object to a JSON file. */
    function writeJsonSync(filePath, object, options = {}) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      Deno.writeFileSync(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_116("writeJsonSync", writeJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std/fs/read_json",
  [],
  function (exports_117, context_117) {
    "use strict";
    var __moduleName = context_117 && context_117.id;
    /** Reads a JSON file and then parses it into an object */
    async function readJson(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(await Deno.readFile(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_117("readJson", readJson);
    /** Reads a JSON file and then parses it into an object */
    function readJsonSync(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(Deno.readFileSync(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_117("readJsonSync", readJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/x/actdb/adapters/FileAdapter",
  [
    "https://deno.land/std/fs/exists",
    "https://deno.land/std/fs/write_json",
    "https://deno.land/std/fs/read_json",
  ],
  function (exports_118, context_118) {
    "use strict";
    var exists_ts_6, write_json_ts_2, read_json_ts_2, FileAdapter;
    var __moduleName = context_118 && context_118.id;
    return {
      setters: [
        function (exists_ts_6_1) {
          exists_ts_6 = exists_ts_6_1;
        },
        function (write_json_ts_2_1) {
          write_json_ts_2 = write_json_ts_2_1;
        },
        function (read_json_ts_2_1) {
          read_json_ts_2 = read_json_ts_2_1;
        },
      ],
      execute: function () {
        FileAdapter = class FileAdapter {
          constructor(filePath = "actdb.json") {
            this.filePath = filePath;
          }
          async read() {
            const isFile = await exists_ts_6.exists(this.filePath);
            if (!isFile) {
              await write_json_ts_2.writeJson(this.filePath, {
                version: 0,
              }, { spaces: "\t" });
            }
            return read_json_ts_2.readJson(this.filePath);
          }
          async write(tree) {
            await write_json_ts_2.writeJson(this.filePath, tree, {
              spaces: "\t",
            });
          }
        };
        exports_118("FileAdapter", FileAdapter);
      },
    };
  },
);
System.register(
  "https://deno.land/x/actdb/mod",
  [
    "https://deno.land/x/actdb/core/Act",
    "https://deno.land/x/actdb/core/Store",
    "https://deno.land/x/actdb/core/Adapter",
    "https://deno.land/x/actdb/adapters/FileAdapter",
  ],
  function (exports_119, context_119) {
    "use strict";
    var __moduleName = context_119 && context_119.id;
    return {
      setters: [
        function (Act_ts_1_1) {
          exports_119({
            "Act": Act_ts_1_1["Act"],
          });
        },
        function (Store_ts_2_1) {
          exports_119({
            "Store": Store_ts_2_1["Store"],
          });
        },
        function (Adapter_ts_1_1) {
          exports_119({
            "Adapter": Adapter_ts_1_1["Adapter"],
          });
        },
        function (FileAdapter_ts_1_1) {
          exports_119({
            "FileAdapter": FileAdapter_ts_1_1["FileAdapter"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps",
  [
    "https://deno.land/std@0.53.0/testing/asserts",
    "https://deno.land/std@0.53.0/fs/mod",
    "https://deno.land/std@0.53.0/log/mod",
    "https://deno.land/std@0.53.0/log/logger",
    "https://deno.land/x/cron/cron",
    "https://deno.land/x/evt/mod",
    "https://deno.land/x/html_entities@v1.0/mod",
    "https://deno.land/x/actdb/mod",
  ],
  function (exports_120, context_120) {
    "use strict";
    var __moduleName = context_120 && context_120.id;
    var exportedNames_5 = {
      "fs": true,
      "log": true,
      "LogRecord": true,
      "Cron": true,
      "Evt": true,
      "Html5Entities": true,
      "actdb": true,
    };
    function exportStar_9(m) {
      var exports = {};
      for (var n in m) {
        if (n !== "default" && !exportedNames_5.hasOwnProperty(n)) {exports[n] =
            m[n];}
      }
      exports_120(exports);
    }
    return {
      setters: [
        function (asserts_ts_7_1) {
          exportStar_9(asserts_ts_7_1);
        },
        function (fs_1) {
          exports_120("fs", fs_1);
        },
        function (log_1) {
          exports_120("log", log_1);
        },
        function (logger_ts_2_1) {
          exports_120({
            "LogRecord": logger_ts_2_1["LogRecord"],
          });
        },
        function (cron_ts_1_1) {
          exports_120({
            "Cron": cron_ts_1_1["Cron"],
          });
        },
        function (mod_ts_7_1) {
          exports_120({
            "Evt": mod_ts_7_1["Evt"],
          });
        },
        function (mod_js_1_1) {
          exports_120({
            "Html5Entities": mod_js_1_1["Html5Entities"],
          });
        },
        function (actdb_1) {
          exports_120("actdb", actdb_1);
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorResult",
  [],
  function (exports_121, context_121) {
    "use strict";
    var VisitorStatus;
    var __moduleName = context_121 && context_121.id;
    return {
      setters: [],
      execute: function () {
        (function (VisitorStatus) {
          VisitorStatus[VisitorStatus["FULL"] = 0] = "FULL";
          VisitorStatus[VisitorStatus["ALMOST_FULL"] = 1] = "ALMOST_FULL";
          VisitorStatus[VisitorStatus["FREE"] = 2] = "FREE";
          VisitorStatus[VisitorStatus["UNKNOWN"] = 3] = "UNKNOWN";
        })(VisitorStatus || (VisitorStatus = {}));
        exports_121("VisitorStatus", VisitorStatus);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorStoreEntry",
  [],
  function (exports_122, context_122) {
    "use strict";
    var __moduleName = context_122 && context_122.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Gym",
  [],
  function (exports_123, context_123) {
    "use strict";
    var Gym;
    var __moduleName = context_123 && context_123.id;
    return {
      setters: [],
      execute: function () {
        (function (Gym) {
          Gym[Gym["KOSMOS"] = 0] = "KOSMOS";
          Gym[Gym["BLOC_NO_LIMIT_BOULDERING"] = 1] = "BLOC_NO_LIMIT_BOULDERING";
          Gym[Gym["BLOC_NO_LIMIT_CLIMBING"] = 2] = "BLOC_NO_LIMIT_CLIMBING";
        })(Gym || (Gym = {}));
        exports_123("Gym", Gym);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Datastore",
  [],
  function (exports_124, context_124) {
    "use strict";
    var __moduleName = context_124 && context_124.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Parser",
  [],
  function (exports_125, context_125) {
    "use strict";
    var __moduleName = context_125 && context_125.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorEventData",
  [],
  function (exports_126, context_126) {
    "use strict";
    var __moduleName = context_126 && context_126.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorLiveEmitter",
  [],
  function (exports_127, context_127) {
    "use strict";
    var __moduleName = context_127 && context_127.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosVisitorLiveEmitter",
  ["file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Gym"],
  function (exports_128, context_128) {
    "use strict";
    var Gym_ts_1, KosmosVisitorLiveEmitter;
    var __moduleName = context_128 && context_128.id;
    return {
      setters: [
        function (Gym_ts_1_1) {
          Gym_ts_1 = Gym_ts_1_1;
        },
      ],
      execute: function () {
        KosmosVisitorLiveEmitter = class KosmosVisitorLiveEmitter {
          constructor(datastore, visitorEvent, parser) {
            this.parser = parser;
            this.visitorEvent = visitorEvent;
            this.datastore = datastore;
          }
          async emitActualVisitor() {
            const visitorStatus = await this.parser.parseActualVisitorStatus();
            const visitorStatureStore = {
              timestamp: new Date(),
              visitorStatus,
            };
            this.datastore.insertVisitor(
              Gym_ts_1.Gym.KOSMOS,
              visitorStatureStore,
            );
            this.visitorEvent.postAsyncOnceHandled({
              ...visitorStatureStore,
              gym: Gym_ts_1.Gym.KOSMOS,
            });
          }
        };
        exports_128("KosmosVisitorLiveEmitter", KosmosVisitorLiveEmitter);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosParser",
  [
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorResult",
  ],
  function (exports_129, context_129) {
    "use strict";
    var deps_ts_1,
      VisitorResult_ts_1,
      BoulderadoIframeRegEx,
      FreeCounterRegEx,
      AlmostFullThreshold,
      FullThreshold,
      KosmosParser;
    var __moduleName = context_129 && context_129.id;
    return {
      setters: [
        function (deps_ts_1_1) {
          deps_ts_1 = deps_ts_1_1;
        },
        function (VisitorResult_ts_1_1) {
          VisitorResult_ts_1 = VisitorResult_ts_1_1;
        },
      ],
      execute: function () {
        BoulderadoIframeRegEx = new RegExp(
          'iframe src="(.*)" name="Boulderado Clientcounter"',
        );
        FreeCounterRegEx = new RegExp(
          'data-value="(\\d+)" id="visitorcount-container"',
        );
        AlmostFullThreshold = 60;
        FullThreshold = 80;
        /**
             * Kosmos parser, it search for the Boulderado iframe and extract the current visitor count.
             */
        KosmosParser = class KosmosParser {
          constructor(txtFetcher = async (url) => {
            const res = await fetch(url);
            const resText = await res.text();
            return resText;
          }) {
            this.txtFetcher = txtFetcher;
          }
          async parseActualVisitorStatus() {
            const kosmosIndexHtmlText = await this.txtFetcher(
              "http://kosmos-bouldern.de",
            );
            const iframeGroups = BoulderadoIframeRegEx.exec(
              kosmosIndexHtmlText,
            );
            if (iframeGroups && iframeGroups.length === 2) {
              const decodedUrl = deps_ts_1.Html5Entities.decode(
                iframeGroups[1],
              );
              const counterHtmlText = await this.txtFetcher(decodedUrl);
              const freeCounterGroup = FreeCounterRegEx.exec(counterHtmlText);
              if (freeCounterGroup && freeCounterGroup.length === 2) {
                const visitorCount = +freeCounterGroup[1];
                return {
                  count: visitorCount,
                  status:
                    visitorCount >= 0 && visitorCount < AlmostFullThreshold
                      ? VisitorResult_ts_1.VisitorStatus.FREE
                      : visitorCount >= FullThreshold
                      ? VisitorResult_ts_1.VisitorStatus.FULL
                      : VisitorResult_ts_1.VisitorStatus.ALMOST_FULL,
                };
              }
            }
            throw new Error("Parsing not successfully");
          }
        };
        exports_129("KosmosParser", KosmosParser);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/log",
  ["file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps"],
  function (exports_130, context_130) {
    "use strict";
    var deps_ts_2, formatter, logger;
    var __moduleName = context_130 && context_130.id;
    return {
      setters: [
        function (deps_ts_2_1) {
          deps_ts_2 = deps_ts_2_1;
        },
      ],
      execute: async function () {
        formatter = (logRecord) => {
          let msg =
            `${logRecord.datetime} - ${logRecord.levelName} - ${logRecord.msg}`;
          logRecord.args.forEach((arg, index) => {
            msg += `, arg${index}: ${arg}`;
          });
          return msg;
        };
        await deps_ts_2.log.setup({
          handlers: {
            console: new deps_ts_2.log.handlers.ConsoleHandler("DEBUG", {
              formatter,
            }),
            file: new deps_ts_2.log.handlers.FileHandler("INFO", {
              filename: "./app.log",
              // you can change format of output message using any keys in `LogRecord`
              formatter,
            }),
          },
          loggers: {
            // configure default logger available via short-hand methods above
            default: {
              level: "DEBUG",
              handlers: ["console", "file"],
            },
          },
        });
        exports_130("logger", logger = deps_ts_2.log.getLogger());
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/telegram/TelegramTypes",
  [],
  function (exports_131, context_131) {
    "use strict";
    var __moduleName = context_131 && context_131.id;
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Utils",
  ["file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorResult"],
  function (exports_132, context_132) {
    "use strict";
    var VisitorResult_ts_2;
    var __moduleName = context_132 && context_132.id;
    function delay(n) {
      return new Promise((resolve, _) => {
        setTimeout(resolve, n);
      });
    }
    exports_132("delay", delay);
    function genUrl(url, parameters) {
      const requestParameters = parameters
        ? Object.keys(parameters)
          .filter((param) => parameters[param] !== undefined)
          .map((param) => `${param}=${parameters[param]}`)
          .join("&")
        : "";
      return `${url}${
        requestParameters.length > 0 ? "?" + requestParameters : ""
      }`;
    }
    exports_132("genUrl", genUrl);
    function statusEnumToString(visitorStatus) {
      switch (visitorStatus) {
        case VisitorResult_ts_2.VisitorStatus.FREE:
          return "free";
        case VisitorResult_ts_2.VisitorStatus.ALMOST_FULL:
          return "almost full";
        case VisitorResult_ts_2.VisitorStatus.FULL:
          return "full";
        case VisitorResult_ts_2.VisitorStatus.UNKNOWN:
          return "unknown";
      }
    }
    exports_132("statusEnumToString", statusEnumToString);
    return {
      setters: [
        function (VisitorResult_ts_2_1) {
          VisitorResult_ts_2 = VisitorResult_ts_2_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/telegram/TelegramBot",
  [
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/log",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Utils",
  ],
  function (exports_133, context_133) {
    "use strict";
    var deps_ts_3,
      log_ts_1,
      Utils_ts_1,
      TELEGRAM_BASE_URL,
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_URL,
      TELEGRAM_POLL_TIMEOUT,
      MessageUpdateEvent,
      MessageEvent;
    var __moduleName = context_133 && context_133.id;
    function sendMessage(outgoingMessage) {
      fetch(Utils_ts_1.genUrl(`${TELEGRAM_URL}/sendMessage`, outgoingMessage))
        .then(() => log_ts_1.logger.debug("Message send done"))
        .catch((error) => log_ts_1.logger.error("Message send error", error));
    }
    exports_133("sendMessage", sendMessage);
    function addMessageHandler(handler) {
      MessageEvent.attach(handler);
    }
    exports_133("addMessageHandler", addMessageHandler);
    function start() {
      MessageUpdateEvent.attach(_onMessageUpdate);
      MessageUpdateEvent.post({ ok: true, result: [] });
      log_ts_1.logger.info("Telegram Bot started");
    }
    exports_133("start", start);
    function _onMessageUpdate(messageUpdates) {
      if (messageUpdates.ok) {
        log_ts_1.logger.debug("Message OK - start incoming message process");
        messageUpdates.result.forEach((inMsg) =>
          inMsg.message && MessageEvent.postAsyncOnceHandled(inMsg.message)
        );
        const offset = messageUpdates.result.reduce(
          (_, msg) => msg.update_id + 1,
          0,
        );
        log_ts_1.logger.debug("offset", offset);
        fetch(Utils_ts_1.genUrl(`${TELEGRAM_URL}/getUpdates`, {
          timeout: TELEGRAM_POLL_TIMEOUT,
          offset,
        }))
          .then((res) => res.json())
          .then((messageUpdate) => {
            MessageUpdateEvent.post(messageUpdate);
          })
          .then(() => log_ts_1.logger.debug("Message update done"))
          .catch((error) =>
            log_ts_1.logger.error("Message incoming update error", error)
          );
      } else {
        log_ts_1.logger.error("Message Error | " + messageUpdates);
      }
    }
    return {
      setters: [
        function (deps_ts_3_1) {
          deps_ts_3 = deps_ts_3_1;
        },
        function (log_ts_1_1) {
          log_ts_1 = log_ts_1_1;
        },
        function (Utils_ts_1_1) {
          Utils_ts_1 = Utils_ts_1_1;
        },
      ],
      execute: function () {
        TELEGRAM_BASE_URL = Deno.env.get("TELEGRAM_BASE_URL") ||
          "https://api.telegram.org/bot";
        TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
        TELEGRAM_URL = TELEGRAM_BASE_URL + TELEGRAM_BOT_TOKEN;
        TELEGRAM_POLL_TIMEOUT =
          +(Deno.env.get("TELEGRAM_POLL_TIMEOUT") || "120");
        MessageUpdateEvent = new deps_ts_3.Evt();
        MessageEvent = new deps_ts_3.Evt();
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosTelegramMessageHandler",
  [
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Gym",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Utils",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/log",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/telegram/TelegramBot",
  ],
  function (exports_134, context_134) {
    "use strict";
    var Gym_ts_2, Utils_ts_2, log_ts_2, TelegramBot_ts_1;
    var __moduleName = context_134 && context_134.id;
    async function handleKosmosTelegramMessage(datastore, incomingMessage) {
      const { text, entities, chat } = incomingMessage;
      const { length, offset, type } = entities && entities.length > 0
        ? entities[0]
        : { length: 0, offset: 0, type: "" };
      const botCommand = text?.substr(offset, length).toLowerCase();
      if (
        type === "bot_command" &&
        botCommand &&
        botCommand.startsWith("/kosmos")
      ) {
        switch (botCommand) {
          case "/kosmosstatus":
            datastore
              .getLatestVisitorStatus(Gym_ts_2.Gym.KOSMOS)
              .then((latestVisitorStatus) => {
                TelegramBot_ts_1.sendMessage({
                  chat_id: chat.id,
                  text:
                    `Kosmos lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${
                      Utils_ts_2.statusEnumToString(
                        latestVisitorStatus.visitorStatus.status,
                      )
                    } |  visitors: ${latestVisitorStatus.visitorStatus.count}`,
                });
              })
              .catch((error) => {
                TelegramBot_ts_1.sendMessage({
                  chat_id: chat.id,
                  text: `Error something unexpected happens.`,
                });
                log_ts_2.logger.error("can't send last kosmos status", error);
              });
            break;
          case "/kosmoshelp":
          default:
            TelegramBot_ts_1.sendMessage({
              chat_id: chat.id,
              text:
                "following Kosmos command are available: /kosmosstatus - get latest visitor status from kosmos",
            });
        }
      }
    }
    exports_134("handleKosmosTelegramMessage", handleKosmosTelegramMessage);
    return {
      setters: [
        function (Gym_ts_2_1) {
          Gym_ts_2 = Gym_ts_2_1;
        },
        function (Utils_ts_2_1) {
          Utils_ts_2 = Utils_ts_2_1;
        },
        function (log_ts_2_1) {
          log_ts_2 = log_ts_2_1;
        },
        function (TelegramBot_ts_1_1) {
          TelegramBot_ts_1 = TelegramBot_ts_1_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/persistence/DailyFileAdapter",
  ["file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps"],
  function (exports_135, context_135) {
    "use strict";
    var deps_ts_4, DailyFileAdapter;
    var __moduleName = context_135 && context_135.id;
    return {
      setters: [
        function (deps_ts_4_1) {
          deps_ts_4 = deps_ts_4_1;
        },
      ],
      execute: function () {
        DailyFileAdapter = class DailyFileAdapter
          extends deps_ts_4.actdb.FileAdapter {
          constructor(baseFilePath, fileName = "actdb.json") {
            super(fileName);
            this.baseFilePath = baseFilePath;
            this.fileName = fileName;
          }
          overrideActualFilePath() {
            const now = new Date();
            super.filePath =
              `${this.baseFilePath}/${now.getFullYear()}_${now.getMonth() +
                1}_${now.getDate()}_${this.fileName}`;
          }
          read() {
            this.overrideActualFilePath();
            return super.read();
          }
          async write(tree) {
            this.overrideActualFilePath();
            super.write(tree);
          }
        };
        exports_135("DailyFileAdapter", DailyFileAdapter);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/persistence/ActDbDatastore",
  [
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/log",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/persistence/DailyFileAdapter",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/VisitorResult",
  ],
  function (exports_136, context_136) {
    "use strict";
    var deps_ts_5,
      log_ts_3,
      DailyFileAdapter_ts_1,
      VisitorResult_ts_3,
      ActDbDatastore;
    var __moduleName = context_136 && context_136.id;
    return {
      setters: [
        function (deps_ts_5_1) {
          deps_ts_5 = deps_ts_5_1;
        },
        function (log_ts_3_1) {
          log_ts_3 = log_ts_3_1;
        },
        function (DailyFileAdapter_ts_1_1) {
          DailyFileAdapter_ts_1 = DailyFileAdapter_ts_1_1;
        },
        function (VisitorResult_ts_3_1) {
          VisitorResult_ts_3 = VisitorResult_ts_3_1;
        },
      ],
      execute: function () {
        ActDbDatastore = class ActDbDatastore {
          constructor(
            kosmosDataPath = Deno.env.get("KOSMOS_DATA_PATH") || "data/kosmos",
          ) {
            this.kosmosDataPath = kosmosDataPath;
          }
          async init() {
            deps_ts_5.fs.ensureDirSync(this.kosmosDataPath);
            const db = new deps_ts_5.actdb.Act(
              new DailyFileAdapter_ts_1.DailyFileAdapter(this.kosmosDataPath),
            );
            this.visitorStore = db.createStore("visitors");
            log_ts_3.logger.debug("Datastore is ready");
          }
          async insertVisitor(gym, entry) {
            log_ts_3.logger.debug("Datastore insert entry", gym, entry);
            return this.visitorStore.insert([entry]);
          }
          async getLatestVisitorStatus(gym) {
            const visitors = await this.visitorStore.read();
            return visitors.length > 0
              ? {
                ...visitors[visitors.length - 1],
                timestamp: new Date(visitors[visitors.length - 1].timestamp),
              }
              : {
                timestamp: new Date(),
                visitorStatus: {
                  count: 0,
                  status: VisitorResult_ts_3.VisitorStatus.UNKNOWN,
                },
              };
          }
        };
        exports_136("ActDbDatastore", ActDbDatastore);
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Events",
  ["file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps"],
  function (exports_137, context_137) {
    "use strict";
    var deps_ts_6, VisitorStatusEvent;
    var __moduleName = context_137 && context_137.id;
    return {
      setters: [
        function (deps_ts_6_1) {
          deps_ts_6 = deps_ts_6_1;
        },
      ],
      execute: function () {
        exports_137(
          "VisitorStatusEvent",
          VisitorStatusEvent = new deps_ts_6.Evt(),
        );
      },
    };
  },
);
System.register(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/app",
  [
    "https://deno.land/x/dotenv/load",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/deps",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosVisitorLiveEmitter",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosParser",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/log",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/telegram/TelegramBot",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/kosmos/KosmosTelegramMessageHandler",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/persistence/ActDbDatastore",
    "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/core/Events",
  ],
  function (exports_138, context_138) {
    "use strict";
    var deps_ts_7,
      KosmosVisitorLiveEmitter_ts_1,
      KosmosParser_ts_1,
      log_ts_4,
      TelegramBot_ts_2,
      KosmosTelegramMessageHandler_ts_1,
      ActDbDatastore_ts_1,
      Events_ts_1,
      EVERY_MINUTES,
      db,
      cron,
      kosmosEmitter;
    var __moduleName = context_138 && context_138.id;
    return {
      setters: [
        function (_3) {
        },
        function (deps_ts_7_1) {
          deps_ts_7 = deps_ts_7_1;
        },
        function (KosmosVisitorLiveEmitter_ts_1_1) {
          KosmosVisitorLiveEmitter_ts_1 = KosmosVisitorLiveEmitter_ts_1_1;
        },
        function (KosmosParser_ts_1_1) {
          KosmosParser_ts_1 = KosmosParser_ts_1_1;
        },
        function (log_ts_4_1) {
          log_ts_4 = log_ts_4_1;
        },
        function (TelegramBot_ts_2_1) {
          TelegramBot_ts_2 = TelegramBot_ts_2_1;
        },
        function (KosmosTelegramMessageHandler_ts_1_1) {
          KosmosTelegramMessageHandler_ts_1 =
            KosmosTelegramMessageHandler_ts_1_1;
        },
        function (ActDbDatastore_ts_1_1) {
          ActDbDatastore_ts_1 = ActDbDatastore_ts_1_1;
        },
        function (Events_ts_1_1) {
          Events_ts_1 = Events_ts_1_1;
        },
      ],
      execute: async function () {
        EVERY_MINUTES = +(Deno.env.get("EVERY_MINUTES") || "5");
        log_ts_4.logger.info("Bootstrapping app");
        db = new ActDbDatastore_ts_1.ActDbDatastore();
        await db.init();
        TelegramBot_ts_2.addMessageHandler((msg) =>
          KosmosTelegramMessageHandler_ts_1.handleKosmosTelegramMessage(db, msg)
        );
        TelegramBot_ts_2.start();
        cron = new deps_ts_7.Cron();
        cron.start();
        kosmosEmitter = new KosmosVisitorLiveEmitter_ts_1
          .KosmosVisitorLiveEmitter(
          db,
          Events_ts_1.VisitorStatusEvent,
          new KosmosParser_ts_1.KosmosParser(),
        );
        // kosmos cron
        cron.add(Deno.env.get("KOSMOS_CRON") || "* * * * *", () => {
          const kosmosWorkingHour =
            (Deno.env.get("KOSMOS_WORKING_HOUR") || "8-22")
              .split("-")
              .map((x) => +x);
          const date = new Date();
          const hour = date.getHours();
          const minutes = date.getMinutes();
          if (
            hour >= kosmosWorkingHour[0] &&
            hour <= kosmosWorkingHour[1] &&
            minutes % EVERY_MINUTES === 0
          ) {
            kosmosEmitter
              .emitActualVisitor()
              .then(() => log_ts_4.logger.info("Kosmos status emitted"))
              .catch((error) => log_ts_4.logger.error("Kosmos error", error));
          }
        });
        log_ts_4.logger.info("App started");
        await Deno.signal(Deno.Signal.SIGINT);
        log_ts_4.logger.info("Shutdown the App");
        log_ts_4.logger.info("Bye Bye");
        Deno.exit(0);
      },
    };
  },
);

await __instantiateAsync(
  "file:///Users/tpham/workspaces/private/boulder-statistic-backend/src/app",
);
