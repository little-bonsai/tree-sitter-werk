function interleave(exp, sep) {
  return seq(exp, repeat(seq(sep, exp)));
}

function interleave0(exp, sep) {
  return seq(optional(exp), repeat(seq(sep, exp)));
}

/**
 * @file werk
 * @author Freddie Gilbraith <freddie.gilbraith@littlebonsai.co.uk>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "werk",

  externals: ($) => [$._terminator],

  rules: {
    source_file: ($) => seq(repeat(choice($.comment, $._topLevelStatement, "\n"))),
    _topLevelStatement: ($) => choice($.let, $.default, $.config, $.buildBlock, $.taskBlock, $.include),

    buildBlock: ($) => seq("build", field("name", $.string), $.recipe),
    taskBlock: ($) => seq("task", field("name", $.identifier), $.recipe),
    recipe: ($) => seq("{", repeat(choice($.comment, $._recipeStatement, "\n")), "}", $._terminator),
    _recipeStatement: ($) =>
      choice($.let, $.from, $.run, $.build, $.setEnv, $.envRemove, $.error, $.warn, $.info, $.depfile),

    run: ($) => seq("run", choice($.string, $.runBlock)),
    runBlock: ($) => seq("{", repeat(choice($.comment, $._runStatement, "\n")), "}", $._terminator),
    _runStatement: ($) =>
      choice($.copy, $.setEnv, $.shell, $.envRemove, $.write, $.delete, $.error, $.warn, $.info, $.delete),

    // Statements
    build: ($) => seq("build", $.exp, $._terminator),
    config: ($) => seq("config", $.identifier, "=", $.exp, $._terminator),
    copy: ($) => seq("copy", $.exp, "to", $.exp, $._terminator),
    default: ($) => seq("default", $.identifier, "=", $.exp, $._terminator),
    delete: ($) => seq("delete", $.exp, $._terminator),
    depfile: ($) => seq("depfile", $.exp, $._terminator),
    envRemove: ($) => seq("env-remove", $.string, $._terminator),
    from: ($) => seq("from", $.exp, $._terminator),
    info: ($) => seq("info", $.exp, $._terminator),
    let: ($) => seq("let", $.identifier, "=", $.exp, $._terminator),
    setEnv: ($) => seq("env", $.string, "=", $.exp, $._terminator),
    shell: ($) => seq("shell", $.exp, $._terminator),
    write: ($) => seq("write", $.exp, "to", $.exp, $._terminator),

    // Expressions
    exp: ($) =>
      choice(
        $._value,
        $.access,
        $.error,
        $.getEnv,
        $.glob,
        $.identifier,
        $.include,
        $.info,
        $.pipe,
        $.read,
        $.warn,
        $.which,
        seq("(", $.exp, ")"),
      ),
    access: ($) => seq($.identifier, "[", $.exp, "]"),
    error: ($) => seq("error", $.exp),
    getEnv: ($) => seq("env", $.exp),
    glob: ($) => seq("glob", $.exp),
    include: ($) => seq("include", $.exp),
    info: ($) => seq("info", $.exp),
    pipe: ($) => prec.right(2, seq($.exp, "|", $.op)),
    read: ($) => seq("read", $.exp, $._terminator),
    warn: ($) => seq("warn", $.exp),
    which: ($) => seq("which", $.exp),

    // Operations
    op: ($) =>
      choice(
        "dedup",
        "first",
        "flatten",
        "last",
        "len",
        "lines",
        "tail",
        $.assertEq,
        $.discard,
        $.filter,
        $.filterMatch,
        $.join,
        $.map,
        $.match,
        $.split,
        $.string,
      ),
    assertEq: ($) => seq("assert-eq", $.exp),
    discard: ($) => seq("discard", $.exp),
    filter: ($) => seq("filter", $.exp),
    filterMap: ($) => seq("filter-map", $.exp),
    filterMatch: ($) => seq("filter-match", $.matchArm),
    flatten: ($) => seq("flatten", $.exp),
    join: ($) => seq("join", $.exp),
    map: ($) => seq("map", $.exp),
    match: ($) => seq("match", "{", repeat(choice($.comment, $.matchArm, "\n")), "}"),
    matchArm: ($) => seq($.string, "=>", $.exp, $._terminator),
    split: ($) => seq("split", $.exp),

    // Values
    _value: ($) => choice($.string, $.list, $.number),
    number: (_) => /-?\d+\.\d*|-?\.\d+|-?\d+/,
    list: ($) => seq("[", interleave0($.exp, ","), "]"),
    string: ($) => seq('"', repeat(choice($.interpolation, /[^"{}<>\n]+/)), '"'),
    identifier: () => prec(-1, /[^"\s}{><\[\]]+/),
    comment: () => /#.*\n/,

    interpolation: ($) =>
      choice(seq("{", optional($._interpolationBody), "}"), seq("<", optional($._interpolationBody), ">")),

    _interpolationBody: ($) =>
      seq($.exp, optional($.interpolationJoin), optional(seq(":", choice("dedup", /\..*=\..*/, /s\/.*\/.*\//)))),
    interpolationJoin: () => /.?\*/,
  },
});
