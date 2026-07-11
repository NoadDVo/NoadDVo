"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTikzAst = parseTikzAst;
function tokenText(tokens) {
    return tokens.map((token) => token.value).join(" ");
}
function optionText(tokens) {
    return tokenText(tokens).replace(/\s*,\s*/g, ",").trim();
}
function splitOptions(tokens) {
    const options = [];
    let current = [];
    let braceDepth = 0;
    let parenDepth = 0;
    tokens.forEach((token) => {
        if (token.value === "{") {
            braceDepth += 1;
        }
        else if (token.value === "}") {
            braceDepth = Math.max(0, braceDepth - 1);
        }
        else if (token.value === "(") {
            parenDepth += 1;
        }
        else if (token.value === ")") {
            parenDepth = Math.max(0, parenDepth - 1);
        }
        if (token.value === "," && braceDepth === 0 && parenDepth === 0) {
            const text = optionText(current);
            if (text) {
                options.push(text);
            }
            current = [];
            return;
        }
        current.push(token);
    });
    const text = optionText(current);
    if (text) {
        options.push(text);
    }
    return options;
}
function validateBalance(tokens, command) {
    const issues = [];
    const stack = [];
    const pairs = {
        ")": "(",
        "]": "[",
        "}": "{",
    };
    tokens.forEach((token) => {
        if (token.value === "(" || token.value === "[" || token.value === "{") {
            stack.push(token);
        }
        else if (token.value === ")" || token.value === "]" || token.value === "}") {
            const expected = pairs[token.value];
            const previous = stack.pop();
            if (!previous || previous.value !== expected) {
                issues.push({
                    code: "TIKZ_UNBALANCED_SYNTAX",
                    column: token.column,
                    line: token.line,
                    message: `Unexpected "${token.value}" in ${command.value}.`,
                    severity: "error",
                });
            }
        }
    });
    stack.forEach((token) => {
        issues.push({
            code: "TIKZ_UNBALANCED_SYNTAX",
            column: token.column,
            line: token.line,
            message: `Missing closing delimiter for "${token.value}" in ${command.value}.`,
            severity: "error",
        });
    });
    return issues;
}
function consumeBracketGroup(tokens, start) {
    let depth = 0;
    for (let index = start; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token?.value === "[") {
            depth += 1;
        }
        else if (token?.value === "]") {
            depth -= 1;
            if (depth === 0) {
                return index + 1;
            }
        }
    }
    return start;
}
function buildCommand(command, body) {
    let bodyStart = 0;
    let options = [];
    if (body[0]?.value === "[") {
        const optionEnd = consumeBracketGroup(body, 0);
        if (optionEnd > 0) {
            options = splitOptions(body.slice(1, optionEnd - 1));
            bodyStart = optionEnd;
        }
    }
    return {
        argumentText: tokenText(body.slice(bodyStart)),
        column: command.column,
        line: command.line,
        name: command.value.slice(1),
        options,
        raw: `${command.value}${body.length > 0 ? ` ${tokenText(body)}` : ""}`,
        type: "command",
    };
}
function commandNeedsSemicolon(commandName) {
    return ["coordinate", "draw", "fill", "filldraw", "node", "pic"].includes(commandName);
}
function parseTikzAst(tokens) {
    const commands = [];
    const issues = [];
    let index = 0;
    while (index < tokens.length) {
        const token = tokens[index];
        if (!token || token.type !== "command") {
            index += 1;
            continue;
        }
        const body = [];
        const commandName = token.value.slice(1);
        let cursor = index + 1;
        let foundSemicolon = false;
        let bracketDepth = 0;
        let braceDepth = 0;
        let parenDepth = 0;
        while (cursor < tokens.length) {
            const current = tokens[cursor];
            if (!current) {
                break;
            }
            if (current.value === ";") {
                foundSemicolon = true;
                cursor += 1;
                break;
            }
            if (current.type === "command" &&
                bracketDepth === 0 &&
                braceDepth === 0 &&
                parenDepth === 0 &&
                !["begin", "end", "usepackage", "usetikzlibrary", "documentclass"].includes(commandName)) {
                break;
            }
            body.push(current);
            if (current.value === "[") {
                bracketDepth += 1;
            }
            else if (current.value === "]") {
                bracketDepth = Math.max(0, bracketDepth - 1);
            }
            else if (current.value === "{") {
                braceDepth += 1;
            }
            else if (current.value === "}") {
                braceDepth = Math.max(0, braceDepth - 1);
            }
            else if (current.value === "(") {
                parenDepth += 1;
            }
            else if (current.value === ")") {
                parenDepth = Math.max(0, parenDepth - 1);
            }
            cursor += 1;
            if ((commandName === "begin" || commandName === "end") && current.value === "}") {
                break;
            }
        }
        if (commandNeedsSemicolon(commandName) && !foundSemicolon) {
            issues.push({
                code: "TIKZ_MISSING_SEMICOLON",
                column: token.column,
                line: token.line,
                message: `${token.value} command is missing a terminating semicolon.`,
                severity: "error",
            });
        }
        issues.push(...validateBalance(body, token));
        commands.push(buildCommand(token, body));
        index = Math.max(cursor, index + 1);
    }
    return {
        ast: {
            commands,
            type: "tikz-document",
        },
        issues,
    };
}
