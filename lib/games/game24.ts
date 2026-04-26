import type { Difficulty } from "./shared";

const TARGET = 24;
const EPS = 1e-6;

type Op = "+" | "-" | "*" | "/";
const OPS: Op[] = ["+", "-", "*", "/"];

function applyOp(a: number, b: number, op: Op): number | null {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return Math.abs(b) < EPS ? null : a / b;
  }
}

function combinations(nums: number[]): number[] {
  // Recursively generate all reachable values via 3 binary ops with parens covered by combine order
  if (nums.length === 1) return [nums[0]!];
  const results = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest: number[] = [];
      for (let k = 0; k < nums.length; k++) {
        if (k !== i && k !== j) rest.push(nums[k]!);
      }
      for (const op of OPS) {
        const v = applyOp(nums[i]!, nums[j]!, op);
        if (v === null) continue;
        const next = [v, ...rest];
        for (const r of combinations(next)) {
          results.add(Math.round(r * 1e6) / 1e6);
        }
      }
    }
  }
  return Array.from(results);
}

export function hasSolution(cards: number[]): boolean {
  return combinations(cards).some((v) => Math.abs(v - TARGET) < EPS);
}

export function findOneSolution(cards: number[]): string | null {
  // DFS that builds expression strings, stops at first 24
  type Item = { val: number; expr: string };
  const items: Item[] = cards.map((n) => ({ val: n, expr: String(n) }));
  return solve(items);
}

function solve(items: { val: number; expr: string }[]): string | null {
  if (items.length === 1) {
    return Math.abs(items[0]!.val - TARGET) < EPS ? items[0]!.expr : null;
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const rest: { val: number; expr: string }[] = [];
      for (let k = 0; k < items.length; k++) {
        if (k !== i && k !== j) rest.push(items[k]!);
      }
      const a = items[i]!;
      const b = items[j]!;
      for (const op of OPS) {
        const v = applyOp(a.val, b.val, op);
        if (v === null) continue;
        const expr = `(${a.expr}${op}${b.expr})`;
        const got = solve([{ val: v, expr }, ...rest]);
        if (got !== null) return got;
      }
    }
  }
  return null;
}

const DIFFICULTY_RANGE: Record<Difficulty, [number, number]> = {
  easy:   [1, 9],
  medium: [1, 12],
  hard:   [1, 13],
};

function randomCards(difficulty: Difficulty): number[] {
  const [lo, hi] = DIFFICULTY_RANGE[difficulty];
  return Array.from({ length: 4 }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
}

export function generatePuzzle(difficulty: Difficulty): number[] {
  // Try up to 200 times; on extreme bad luck fall back to a known-solvable set
  for (let attempt = 0; attempt < 200; attempt++) {
    const cards = randomCards(difficulty);
    if (hasSolution(cards)) return cards;
  }
  return [3, 8, 4, 2];
}

export interface EvalResult {
  ok: boolean;
  value?: number;
  error?: string;
}

export function evaluateExpression(expr: string, cards: number[]): EvalResult {
  if (!expr.trim()) return { ok: false, error: "请输入表达式" };
  if (!/^[\d+\-*/() ]+$/.test(expr)) {
    return { ok: false, error: "只能用数字和 + - x / ( )" };
  }

  const numsInExpr = expr.match(/\d+/g)?.map((s) => parseInt(s, 10)) ?? [];
  if (numsInExpr.length !== cards.length) {
    return { ok: false, error: `必须用恰好 ${cards.length} 个数字` };
  }
  const a = [...numsInExpr].sort((x, y) => x - y);
  const b = [...cards].sort((x, y) => x - y);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return { ok: false, error: "数字必须使用题目给出的 4 张牌（每张恰好一次）" };
    }
  }

  let value: number;
  try {
    // Custom parser to avoid eval/Function (CSP-safe + safer)
    value = parseAndEval(expr);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "表达式有误" };
  }

  if (Math.abs(value - TARGET) < EPS) return { ok: true, value };
  return { ok: false, value, error: `结果是 ${formatNum(value)}，不是 24` };
}

function formatNum(n: number): string {
  if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n));
  return n.toFixed(2);
}

// Recursive descent: expr = term (+|- term)*; term = factor (*|/ factor)*; factor = number | (expr)
function parseAndEval(input: string): number {
  let i = 0;
  const s = input.replace(/\s+/g, "");

  function parseExpr(): number {
    let v = parseTerm();
    while (i < s.length && (s[i] === "+" || s[i] === "-")) {
      const op = s[i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  function parseTerm(): number {
    let v = parseFactor();
    while (i < s.length && (s[i] === "*" || s[i] === "/")) {
      const op = s[i++];
      const r = parseFactor();
      if (op === "*") v *= r;
      else {
        if (Math.abs(r) < EPS) throw new Error("除数不能为 0");
        v /= r;
      }
    }
    return v;
  }

  function parseFactor(): number {
    if (s[i] === "(") {
      i++;
      const v = parseExpr();
      if (s[i] !== ")") throw new Error("括号不匹配");
      i++;
      return v;
    }
    let n = "";
    while (i < s.length && /\d/.test(s[i]!)) {
      n += s[i++];
    }
    if (!n) throw new Error("缺少数字");
    return parseInt(n, 10);
  }

  const v = parseExpr();
  if (i !== s.length) throw new Error("表达式有多余字符");
  return v;
}
