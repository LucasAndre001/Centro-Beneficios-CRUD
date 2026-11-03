export const COLUMNS = 10;
export const ROWS = 20;

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = PieceKind | null;
export type Matrix = number[][];

export interface Piece {
  kind: PieceKind;
  matrix: Matrix;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export const PIECE_KINDS: readonly PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const SHAPES: Record<PieceKind, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// Pontos por linhas eliminadas de uma vez, multiplicados pelo nível. A API valida a pontuação com esta mesma regra.
export const LINE_POINTS = [0, 100, 300, 500, 800];

// Só deslocamentos laterais: deslocar para cima permitiria somar pontos de queda sem limite.
const ROTATION_KICKS = [0, -1, 1, -2, 2];

const PREVIEW_QUEUE_SIZE = 3;

export function rotateMatrix(matrix: Matrix, direction: 1 | -1): Matrix {
  const size = matrix.length;
  return matrix.map((_, row) =>
    matrix.map((__, col) =>
      direction === 1 ? matrix[size - 1 - col][row] : matrix[col][size - 1 - row],
    ),
  );
}

export function levelForLines(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

function emptyRow(): Cell[] {
  return Array<Cell>(COLUMNS).fill(null);
}

export class TetrisEngine {
  board: Cell[][] = [];
  current!: Piece;
  held: PieceKind | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;

  private queue: PieceKind[] = [];
  private bag: PieceKind[] = [];

  constructor(private readonly random: () => number = Math.random) {
    this.reset();
  }

  get nextPieces(): PieceKind[] {
    return this.queue.slice(0, PREVIEW_QUEUE_SIZE);
  }

  get dropIntervalMs(): number {
    return Math.max(70, 800 - (this.level - 1) * 65);
  }

  reset(): void {
    this.board = Array.from({ length: ROWS }, emptyRow);
    this.held = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.queue = [];
    this.bag = [];
    this.spawn(this.takeNext());
  }

  moveLeft(): boolean {
    return this.tryMove(0, -1);
  }

  moveRight(): boolean {
    return this.tryMove(0, 1);
  }

  softDrop(): boolean {
    const moved = this.tryMove(1, 0);
    if (moved) {
      this.score += 1;
    }
    return moved;
  }

  hardDrop(): void {
    if (this.gameOver) {
      return;
    }

    let distance = 0;
    while (this.tryMove(1, 0)) {
      distance++;
    }
    this.score += distance * 2;
    this.lock();
  }

  rotate(direction: 1 | -1 = 1): boolean {
    if (this.gameOver) {
      return false;
    }

    const rotated = rotateMatrix(this.current.matrix, direction);

    for (const kick of ROTATION_KICKS) {
      const col = this.current.col + kick;
      if (!this.collides(rotated, this.current.row, col)) {
        this.current = { ...this.current, matrix: rotated, col };
        return true;
      }
    }

    return false;
  }

  hold(): void {
    if (!this.canHold || this.gameOver) {
      return;
    }

    const currentKind = this.current.kind;
    this.spawn(this.held ?? this.takeNext());
    this.held = currentKind;
    this.canHold = false;
  }

  tick(): void {
    if (this.gameOver) {
      return;
    }

    if (!this.tryMove(1, 0)) {
      this.lock();
    }
  }

  ghostRow(): number {
    let row = this.current.row;
    while (!this.collides(this.current.matrix, row + 1, this.current.col)) {
      row++;
    }
    return row;
  }

  cellsOf(piece: Piece): Position[] {
    const cells: Position[] = [];
    piece.matrix.forEach((line, r) =>
      line.forEach((value, c) => {
        if (value) {
          cells.push({ row: piece.row + r, col: piece.col + c });
        }
      }),
    );
    return cells;
  }

  private tryMove(rows: number, cols: number): boolean {
    if (this.gameOver) {
      return false;
    }

    const { matrix, row, col } = this.current;
    if (this.collides(matrix, row + rows, col + cols)) {
      return false;
    }

    this.current = { ...this.current, row: row + rows, col: col + cols };
    return true;
  }

  private collides(matrix: Matrix, row: number, col: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) {
          continue;
        }

        const y = row + r;
        const x = col + c;

        if (x < 0 || x >= COLUMNS || y >= ROWS) {
          return true;
        }
        if (y >= 0 && this.board[y][x] !== null) {
          return true;
        }
      }
    }
    return false;
  }

  private lock(): void {
    for (const { row, col } of this.cellsOf(this.current)) {
      if (row < 0) {
        this.gameOver = true;
        return;
      }
      this.board[row][col] = this.current.kind;
    }

    this.clearLines();
    this.canHold = true;
    this.spawn(this.takeNext());
  }

  private clearLines(): void {
    const remaining = this.board.filter((line) => line.some((cell) => cell === null));
    const cleared = ROWS - remaining.length;

    if (cleared === 0) {
      return;
    }

    this.score += LINE_POINTS[cleared] * this.level;
    this.lines += cleared;
    this.level = levelForLines(this.lines);
    this.board = [...Array.from({ length: cleared }, emptyRow), ...remaining];
  }

  private spawn(kind: PieceKind): void {
    const matrix = SHAPES[kind].map((line) => [...line]);
    const col = Math.floor((COLUMNS - matrix.length) / 2);
    const row = kind === 'I' ? -1 : 0;

    this.current = { kind, matrix, row, col };

    if (this.collides(matrix, row, col)) {
      this.gameOver = true;
    }
  }

  private takeNext(): PieceKind {
    this.fillQueue();
    const next = this.queue.shift()!;
    this.fillQueue();
    return next;
  }

  // Sorteio em "sacos" de 7: todas as peças aparecem uma vez antes de repetir
  private fillQueue(): void {
    while (this.queue.length <= PREVIEW_QUEUE_SIZE) {
      if (this.bag.length === 0) {
        this.bag = this.shuffled([...PIECE_KINDS]);
      }
      this.queue.push(this.bag.pop()!);
    }
  }

  private shuffled(kinds: PieceKind[]): PieceKind[] {
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    return kinds;
  }
}
