"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeTikz = tokenizeTikz;
function isWhitespace(char) {
    return char === " " || char === "\t" || char === "\r" || char === "\n";
}
function isLetter(char) {
    return /[A-Za-z]/.test(char);
}
function isIdentifierChar(char) {
    return /[A-Za-z0-9_.$]/.test(char);
}
function isNumberStart(source, index) {
    const char = source[index];
    const next = source[index + 1];
    return Boolean(char &&
        ((/[0-9.]/.test(char)) ||
            ((char === "-" || char === "+") && next && /[0-9.]/.test(next))));
}
function tokenizeTikz(source) {
    const tokens = [];
    const issues = [];
    let index = 0;
    let line = 1;
    let column = 1;
    const advance = (count = 1) => {
        const consumed = source.slice(index, index + count);
        for (const char of consumed) {
            if (char === "\n") {
                line += 1;
                column = 1;
            }
            else {
                column += 1;
            }
        }
        index += count;
        return consumed;
    };
    const pushToken = (type, value, tokenIndex, tokenLine, tokenColumn) => {
        tokens.push({
            column: tokenColumn,
            index: tokenIndex,
            line: tokenLine,
            type,
            value,
        });
    };
    while (index < source.length) {
        const char = source[index] ?? "";
        if (isWhitespace(char)) {
            advance();
            continue;
        }
        if (char === "%") {
            while (index < source.length && source[index] !== "\n") {
                advance();
            }
            continue;
        }
        const tokenIndex = index;
        const tokenLine = line;
        const tokenColumn = column;
        if (char === "\\") {
            advance();
            let value = "\\";
            while (index < source.length && isLetter(source[index] ?? "")) {
                value += advance();
            }
            if (value === "\\") {
                issues.push({
                    code: "TIKZ_INVALID_COMMAND",
                    column: tokenColumn,
                    line: tokenLine,
                    message: "Expected a TikZ command name after backslash.",
                    severity: "error",
                });
            }
            else {
                pushToken("command", value, tokenIndex, tokenLine, tokenColumn);
            }
            continue;
        }
        if (char === "-" && source[index + 1] === "-") {
            pushToken("operator", advance(2), tokenIndex, tokenLine, tokenColumn);
            continue;
        }
        if (isNumberStart(source, index)) {
            let value = "";
            if (source[index] === "-" || source[index] === "+") {
                value += advance();
            }
            while (index < source.length && /[0-9.]/.test(source[index] ?? "")) {
                value += advance();
            }
            pushToken("number", value, tokenIndex, tokenLine, tokenColumn);
            continue;
        }
        if (isLetter(char) || char === "_" || char === "$") {
            let value = "";
            while (index < source.length && isIdentifierChar(source[index] ?? "")) {
                value += advance();
            }
            pushToken("identifier", value, tokenIndex, tokenLine, tokenColumn);
            continue;
        }
        if ("()[]{};,=".includes(char)) {
            pushToken("symbol", advance(), tokenIndex, tokenLine, tokenColumn);
            continue;
        }
        pushToken("string", advance(), tokenIndex, tokenLine, tokenColumn);
    }
    return { issues, tokens };
}
