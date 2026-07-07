"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeTikz = exports.parseTikzAst = void 0;
exports.parseTikz = parseTikz;
const TikzAstParser_1 = require("./TikzAstParser");
const TikzGeometryBuilder_1 = require("./TikzGeometryBuilder");
const TikzTokenizer_1 = require("./TikzTokenizer");
function parseTikz(source) {
    const tokenized = (0, TikzTokenizer_1.tokenizeTikz)(source);
    const parsed = (0, TikzAstParser_1.parseTikzAst)(tokenized.tokens);
    const geometry = (0, TikzGeometryBuilder_1.buildGeometryFromTikzAst)(parsed.ast);
    const issues = [...tokenized.issues, ...parsed.issues, ...geometry.issues];
    return {
        ast: parsed.ast,
        issues,
        objects: geometry.objects,
        supported: !issues.some((issue) => issue.severity === "error"),
        tokens: tokenized.tokens,
    };
}
var TikzAstParser_2 = require("./TikzAstParser");
Object.defineProperty(exports, "parseTikzAst", { enumerable: true, get: function () { return TikzAstParser_2.parseTikzAst; } });
var TikzTokenizer_2 = require("./TikzTokenizer");
Object.defineProperty(exports, "tokenizeTikz", { enumerable: true, get: function () { return TikzTokenizer_2.tokenizeTikz; } });
