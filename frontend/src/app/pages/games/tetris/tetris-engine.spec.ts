import {
  COLUMNS,
  levelForLines,
  LINE_POINTS,
  PieceKind,
  rotateMatrix,
  ROWS,
  SHAPES,
  TetrisEngine,
} from './tetris-engine';

function fillRow(engine: TetrisEngine, row: number, gapCol: number | null = null): void {
  engine.board[row] = engine.board[row].map((_, col) => (col === gapCol ? null : 'O'));
}

function useVerticalI(engine: TetrisEngine, col: number): void {
  const kind: PieceKind = 'I';
  engine.current = { kind, matrix: rotateMatrix(SHAPES.I, 1), row: 0, col };
}

describe('TetrisEngine', () => {
  let engine: TetrisEngine;

  beforeEach(() => {
    engine = new TetrisEngine(() => 0.5);
  });

  it('starts with an empty board and a piece', () => {
    expect(engine.board.length).toBe(ROWS);
    expect(engine.board.every((row) => row.length === COLUMNS)).toBe(true);
    expect(engine.board.flat().every((cell) => cell === null)).toBe(true);
    expect(engine.current).toBeDefined();
    expect(engine.nextPieces.length).toBe(3);
  });

  it('rotates a matrix clockwise and back', () => {
    const rotated = rotateMatrix(SHAPES.T, 1);
    expect(rotated).toEqual([
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ]);
    expect(rotateMatrix(rotated, -1)).toEqual(SHAPES.T);
  });

  it('does not move through the walls', () => {
    for (let i = 0; i < COLUMNS; i++) {
      engine.moveLeft();
    }
    const leftmost = Math.min(...engine.cellsOf(engine.current).map((cell) => cell.col));
    expect(leftmost).toBe(0);
    expect(engine.moveLeft()).toBe(false);
  });

  it('gives 2 points per cell on hard drop', () => {
    const start = engine.current.row;
    const distance = engine.ghostRow() - start;
    engine.hardDrop();
    expect(engine.score).toBe(distance * 2);
  });

  it('gives 1 point per cell on soft drop', () => {
    engine.softDrop();
    engine.softDrop();
    expect(engine.score).toBe(2);
  });

  it('clears a full line and scores by level', () => {
    fillRow(engine, ROWS - 1, 0);
    useVerticalI(engine, -2);
    engine.hardDrop();

    expect(engine.lines).toBe(1);
    expect(engine.board[ROWS - 1].filter((cell) => cell !== null).length).toBe(1);
    expect(engine.score).toBeGreaterThanOrEqual(LINE_POINTS[1]);
  });

  it('scores a tetris for four lines at once', () => {
    for (let row = ROWS - 4; row < ROWS; row++) {
      fillRow(engine, row, 0);
    }
    useVerticalI(engine, -2);
    const dropDistance = engine.ghostRow() - engine.current.row;
    engine.hardDrop();

    expect(engine.lines).toBe(4);
    expect(engine.score).toBe(LINE_POINTS[4] + dropDistance * 2);
  });

  it('raises the level every 10 lines', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it('holds a piece only once per drop', () => {
    const first = engine.current.kind;
    engine.hold();
    expect(engine.held).toBe(first);

    const second = engine.current.kind;
    engine.hold();
    expect(engine.current.kind).toBe(second);
    expect(engine.held).toBe(first);
  });

  it('ends the game when a new piece cannot spawn', () => {
    for (let row = 0; row < ROWS; row++) {
      fillRow(engine, row, row % COLUMNS);
    }
    engine.hardDrop();
    expect(engine.gameOver).toBe(true);
  });

  it('resets everything on a new game', () => {
    engine.hardDrop();
    engine.reset();
    expect(engine.score).toBe(0);
    expect(engine.lines).toBe(0);
    expect(engine.level).toBe(1);
    expect(engine.gameOver).toBe(false);
    expect(engine.held).toBeNull();
  });
});
