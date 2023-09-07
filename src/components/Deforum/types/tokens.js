// valid tokens are: +, -, *, /, (, ), number, t, sin, cos, **, %
// key value pairs enums
export const TokenType = {
  LEFT_PAREN: "(",
  RIGHT_PAREN: ")",
  PLUS: "+",
  MINUS: "-",
  MUL: "*",
  DIV: "/",
  MOD: "%",
  POWER: "**",
  SIN: "sin",
  COS: "cos",
  NUMBER: "number",
  T: "t",
  EOF: "EOF",
};

export class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}
