/**
 * 加法函数，用来得到精确的加法结果
 */
function add(arg1: any, arg2: any) {
  if (!arg1 || !arg2) {
    return 0;
  }
  let r1, r2, m;
  try {
    r1 = arg1.toString().split(".")[1].length;
  } catch (e) {
    r1 = 0;
  }

  try {
    r2 = arg2.toString().split(".")[1].length;
  } catch (e) {
    r2 = 0;
  }

  m = Math.pow(10, Math.max(r1, r2));
  return (arg1 * m + arg2 * m) / m;
}

/**
 * 减法函数，用来得到精确的减法结果
 */
function sub(arg1: any, arg2: any) {
  if (!arg1 || !arg2) {
    return 0;
  }
  let r1, r2, m;
  try {
    r1 = arg1.toString().split(".")[1].length;
  } catch (e) {
    r1 = 0;
  }

  try {
    r2 = arg2.toString().split(".")[1].length;
  } catch (e) {
    r2 = 0;
  }

  m = Math.pow(10, Math.max(r1, r2));
  return (arg1 * m - arg2 * m) / m;
}

/**
 * 乘法函数，用来得到精确的乘法结果
 */
function mul(arg1: any, arg2: any) {
  if (!arg1 || !arg2) {
    return 0;
  }
  let m = 0,
    s1 = arg1.toString(),
    s2 = arg2.toString();
  try {
    m += s1.split(".")[1].length;
  } catch (e) {}

  try {
    m += s2.split(".")[1].length;
  } catch (e) {}

  return (
    (Number(s1.replace(".", "")) * Number(s2.replace(".", ""))) /
    Math.pow(10, m)
  );
}

/**
 * 除法函数，用来得到精确的除法结果
 */
function div(arg1: any, arg2: any) {
  if (!arg1 || !arg2) {
    return 0;
  }
  let t1 = 0,
    t2 = 0,
    r1,
    r2;
  try {
    t1 = arg1.toString().split(".")[1].length;
  } catch (e) {}

  try {
    t2 = arg2.toString().split(".")[1].length;
  } catch (e) {}

  r1 = Number(arg1.toString().replace(".", ""));
  r2 = Number(arg2.toString().replace(".", ""));
  return (r1 / r2) * Math.pow(10, t2 - t1);
}

/**
 * 算式解释器
 * 将算式字符串直接计算出结果
 */
function evaluate(expression: any) {
  let index = 0;

  function skipWhitespace() {
    while (index < expression.length && /\s/.test(expression[index])) {
      index++;
    }
  }

  function parseExpression(): any {
    skipWhitespace();
    let value = parseTerm();
    while (true) {
      skipWhitespace();
      if (match("+")) {
        value = add(value, parseTerm());
      } else if (match("-")) {
        value = sub(value, parseTerm());
      } else {
        return value;
      }
    }
  }

  function parseTerm() {
    skipWhitespace();
    let value = parseFactor();
    while (true) {
      skipWhitespace();
      if (match("*")) {
        value = mul(value, parseFactor());
      } else if (match("/")) {
        value = div(value, parseFactor());
      } else {
        return value;
      }
    }
  }

  function parseFactor() {
    skipWhitespace();
    if (match("(")) {
      let value = parseExpression();
      expect(")");
      return value;
    } else {
      let start = index;
      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        index++;
      }
      let number = parseFloat(expression.substring(start, index));
      if (isNaN(number)) {
        throw new Error("Number expected but not found at position " + start);
      }
      return number;
    }
  }

  function match(char: any) {
    if (expression[index] === char) {
      index++;
      return true;
    }
    return false;
  }

  function expect(char: any) {
    skipWhitespace();
    if (!match(char)) {
      throw new Error(
        "Expected '" +
          char +
          "' but found '" +
          expression[index] +
          "' at position " +
          index
      );
    }
  }

  let result = parseExpression();
  skipWhitespace();
  if (index !== expression.length) {
    throw new Error(
      "Unexpected character '" + expression[index] + "' at position " + index
    );
  }
  return result;
}

export default {
  add,
  sub,
  mul,
  div,
  evaluate,
};
