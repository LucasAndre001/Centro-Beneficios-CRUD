import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ScoreSubmission } from '../../../core/models';
import { COLUMNS, Matrix, PieceKind, ROWS, SHAPES, TetrisEngine } from './tetris-engine';

type Status = 'idle' | 'playing' | 'paused' | 'over';

interface Stats {
  score: number;
  lines: number;
  level: number;
}

const CELL = 30;

const COLORS: Record<PieceKind, string> = {
  I: '#8fc3e8',
  O: '#d3e5ef',
  T: '#5b7fd6',
  S: '#3a8bc0',
  Z: '#4b47e0',
  J: '#2f6fb3',
  L: '#9a97ee',
};

const BOARD_BACKGROUND = '#131059';
const GRID_LINE = '#1f1b72';

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
  'ArrowUp',
  'Space',
  'KeyX',
  'KeyZ',
  'KeyC',
  'ShiftLeft',
  'ShiftRight',
]);

@Component({
  selector: 'app-tetris',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tetris.html',
  styleUrl: './tetris.css',
  host: {
    '(window:keydown)': 'onKeydown($event)',
    '(window:blur)': 'pause()',
    '(document:visibilitychange)': 'pause()',
  },
})
export class Tetris {
  readonly finished = output<ScoreSubmission>();

  protected readonly width = COLUMNS * CELL;
  protected readonly height = ROWS * CELL;
  protected readonly status = signal<Status>('idle');
  protected readonly stats = signal<Stats>({ score: 0, lines: 0, level: 1 });
  protected readonly nextPieces = signal<PieceKind[]>([]);
  protected readonly held = signal<PieceKind | null>(null);

  private readonly engine = new TetrisEngine();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('board');
  private frameId = 0;
  private lastTime = 0;
  private elapsed = 0;

  constructor() {
    afterNextRender(() => this.draw());
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frameId));
  }

  start(): void {
    this.engine.reset();
    this.syncState();
    this.status.set('playing');
    this.resumeLoop();
  }

  pause(): void {
    if (this.status() === 'playing') {
      this.status.set('paused');
      cancelAnimationFrame(this.frameId);
      this.draw();
    }
  }

  resume(): void {
    if (this.status() === 'paused') {
      this.status.set('playing');
      this.resumeLoop();
    }
  }

  protected act(action: 'left' | 'right' | 'down' | 'rotate' | 'drop' | 'hold'): void {
    if (this.status() !== 'playing') {
      return;
    }

    switch (action) {
      case 'left':
        this.engine.moveLeft();
        break;
      case 'right':
        this.engine.moveRight();
        break;
      case 'down':
        this.engine.softDrop();
        break;
      case 'rotate':
        this.engine.rotate(1);
        break;
      case 'drop':
        this.engine.hardDrop();
        break;
      case 'hold':
        this.engine.hold();
        break;
    }

    this.afterAction();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      if (this.status() === 'playing') {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    if (this.status() !== 'playing' || !GAME_KEYS.has(event.code)) {
      return;
    }

    event.preventDefault();

    switch (event.code) {
      case 'ArrowLeft':
        this.engine.moveLeft();
        break;
      case 'ArrowRight':
        this.engine.moveRight();
        break;
      case 'ArrowDown':
        this.engine.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        this.engine.rotate(1);
        break;
      case 'KeyZ':
        this.engine.rotate(-1);
        break;
      case 'Space':
        this.engine.hardDrop();
        break;
      default:
        this.engine.hold();
    }

    this.afterAction();
  }

  protected previewCells(kind: PieceKind | null): boolean[][] {
    if (!kind) {
      return [];
    }
    return trim(SHAPES[kind]).map((row) => row.map(Boolean));
  }

  protected colorOf(kind: PieceKind): string {
    return COLORS[kind];
  }

  private resumeLoop(): void {
    cancelAnimationFrame(this.frameId);
    this.lastTime = performance.now();
    this.elapsed = 0;
    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }

  private loop(time: number): void {
    this.elapsed += time - this.lastTime;
    this.lastTime = time;

    if (this.elapsed >= this.engine.dropIntervalMs) {
      this.elapsed = 0;
      this.engine.tick();
      this.afterAction();
    } else {
      this.draw();
    }

    if (this.status() === 'playing') {
      this.frameId = requestAnimationFrame((next) => this.loop(next));
    }
  }

  private afterAction(): void {
    this.syncState();
    this.draw();

    if (this.engine.gameOver) {
      this.status.set('over');
      cancelAnimationFrame(this.frameId);
      this.finished.emit({
        score: this.engine.score,
        lines: this.engine.lines,
        level: this.engine.level,
      });
    }
  }

  private syncState(): void {
    this.stats.set({
      score: this.engine.score,
      lines: this.engine.lines,
      level: this.engine.level,
    });
    this.nextPieces.set(this.engine.nextPieces);
    this.held.set(this.engine.held);
  }

  private draw(): void {
    const context = this.canvas().nativeElement.getContext('2d');
    if (!context) {
      return;
    }

    context.fillStyle = BOARD_BACKGROUND;
    context.fillRect(0, 0, this.width, this.height);
    this.drawGrid(context);

    this.engine.board.forEach((line, row) =>
      line.forEach((cell, col) => {
        if (cell) {
          this.drawCell(context, row, col, COLORS[cell]);
        }
      }),
    );

    if (this.status() === 'idle') {
      return;
    }

    const piece = this.engine.current;
    const ghost = { ...piece, row: this.engine.ghostRow() };

    for (const { row, col } of this.engine.cellsOf(ghost)) {
      if (row >= 0) {
        context.strokeStyle = COLORS[piece.kind];
        context.lineWidth = 2;
        context.strokeRect(col * CELL + 3, row * CELL + 3, CELL - 6, CELL - 6);
      }
    }

    for (const { row, col } of this.engine.cellsOf(piece)) {
      if (row >= 0) {
        this.drawCell(context, row, col, COLORS[piece.kind]);
      }
    }
  }

  private drawGrid(context: CanvasRenderingContext2D): void {
    context.strokeStyle = GRID_LINE;
    context.lineWidth = 1;
    context.beginPath();
    for (let col = 1; col < COLUMNS; col++) {
      context.moveTo(col * CELL + 0.5, 0);
      context.lineTo(col * CELL + 0.5, this.height);
    }
    for (let row = 1; row < ROWS; row++) {
      context.moveTo(0, row * CELL + 0.5);
      context.lineTo(this.width, row * CELL + 0.5);
    }
    context.stroke();
  }

  private drawCell(
    context: CanvasRenderingContext2D,
    row: number,
    col: number,
    color: string,
  ): void {
    const x = col * CELL;
    const y = row * CELL;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.25)';
    context.fillRect(x + 1, y + 1, CELL - 2, 4);
    context.fillStyle = 'rgba(0, 0, 0, 0.18)';
    context.fillRect(x + 1, y + CELL - 5, CELL - 2, 4);
  }
}

function trim(matrix: Matrix): Matrix {
  const rows = matrix.filter((row) => row.some(Boolean));
  const usedCols = matrix[0].map((_, col) => matrix.some((row) => row[col]));
  return rows.map((row) => row.filter((_, col) => usedCols[col]));
}
