import type { Difficulty } from "./shared";

export type Size = 4 | 6;

export interface Puzzle {
  size: Size;
  boxRows: number;
  boxCols: number;
  given: number[][];   // 0 means empty
  solution: number[][];
}

const BOX: Record<Size, [number, number]> = {
  4: [2, 2],
  6: [2, 3],
};

const REMOVE_COUNT: Record<Size, Record<Difficulty, number>> = {
  4: { easy: 5, medium: 8, hard: 11 },
  6: { easy: 12, medium: 18, hard: 24 },
};

function emptyBoard(size: Size): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function clone(b: number[][]): number[][] {
  return b.map((r) => [...r]);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function isValid(board: number[][], row: number, col: number, num: number, size: Size): boolean {
  const [bR, bC] = BOX[size];
  for (let i = 0; i < size; i++) {
    if (board[row]![i] === num || board[i]![col] === num) return false;
  }
  const sR = Math.floor(row / bR) * bR;
  const sC = Math.floor(col / bC) * bC;
  for (let i = 0; i < bR; i++) {
    for (let j = 0; j < bC; j++) {
      if (board[sR + i]![sC + j] === num) return false;
    }
  }
  return true;
}

function fillSolution(board: number[][], size: Size): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r]![c] === 0) {
        for (const n of shuffled(Array.from({ length: size }, (_, i) => i + 1))) {
          if (isValid(board, r, c, n, size)) {
            board[r]![c] = n;
            if (fillSolution(board, size)) return true;
            board[r]![c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(board: number[][], size: Size, limit = 2): number {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r]![c] === 0) {
        let count = 0;
        for (let n = 1; n <= size; n++) {
          if (isValid(board, r, c, n, size)) {
            board[r]![c] = n;
            count += countSolutions(board, size, limit - count);
            board[r]![c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

export function generatePuzzle(size: Size, difficulty: Difficulty): Puzzle {
  const solution = emptyBoard(size);
  fillSolution(solution, size);

  const removeTarget = REMOVE_COUNT[size][difficulty];
  const given = clone(solution);
  const cells = shuffled(
    Array.from({ length: size * size }, (_, idx) => ({ r: Math.floor(idx / size), c: idx % size })),
  );

  let removed = 0;
  for (const { r, c } of cells) {
    if (removed >= removeTarget) break;
    const saved = given[r]![c]!;
    given[r]![c] = 0;
    const probe = clone(given);
    if (countSolutions(probe, size, 2) === 1) {
      removed++;
    } else {
      given[r]![c] = saved;
    }
  }

  return {
    size,
    boxRows: BOX[size][0],
    boxCols: BOX[size][1],
    given,
    solution,
  };
}

export function findConflicts(board: number[][], size: Size): boolean[][] {
  const conflicts = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const [bR, bC] = BOX[size];

  for (let r = 0; r < size; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < size; c++) {
      const v = board[r]![c]!;
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v)!.push(c);
    }
    for (const cs of seen.values()) {
      if (cs.length > 1) for (const c of cs) conflicts[r]![c] = true;
    }
  }

  for (let c = 0; c < size; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < size; r++) {
      const v = board[r]![c]!;
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v)!.push(r);
    }
    for (const rs of seen.values()) {
      if (rs.length > 1) for (const r of rs) conflicts[r]![c] = true;
    }
  }

  for (let bRow = 0; bRow < size; bRow += bR) {
    for (let bCol = 0; bCol < size; bCol += bC) {
      const seen = new Map<number, [number, number][]>();
      for (let i = 0; i < bR; i++) {
        for (let j = 0; j < bC; j++) {
          const r = bRow + i;
          const c = bCol + j;
          const v = board[r]![c]!;
          if (v === 0) continue;
          if (!seen.has(v)) seen.set(v, []);
          seen.get(v)!.push([r, c]);
        }
      }
      for (const cells of seen.values()) {
        if (cells.length > 1) for (const [r, c] of cells) conflicts[r]![c] = true;
      }
    }
  }

  return conflicts;
}

export function isComplete(board: number[][], conflicts: boolean[][]): boolean {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r]!.length; c++) {
      if (board[r]![c] === 0) return false;
      if (conflicts[r]![c]) return false;
    }
  }
  return true;
}
