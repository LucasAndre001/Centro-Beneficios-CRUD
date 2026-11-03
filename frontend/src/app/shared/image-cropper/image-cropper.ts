import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

type FitMode = 'cover' | 'contain';

interface Point {
  x: number;
  y: number;
}

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Point;
}

export const PRODUCT_IMAGE_WIDTH = 900;
export const PRODUCT_IMAGE_HEIGHT = 600;

const MAX_ZOOM = 3;

@Component({
  selector: 'app-image-cropper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.css',
})
export class ImageCropper {
  readonly src = input.required<string>();

  protected readonly maxZoom = MAX_ZOOM;
  protected readonly mode = signal<FitMode>('cover');
  protected readonly zoom = signal(1);
  protected readonly position = signal<Point>({ x: 0, y: 0 });
  readonly changed = signal(false);

  private readonly natural = signal<{ width: number; height: number } | null>(null);
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private image: HTMLImageElement | null = null;
  private drag: Drag | null = null;

  private readonly scale = computed(() => {
    const size = this.natural();
    if (!size) {
      return 1;
    }
    const fit = this.mode() === 'cover' ? Math.max : Math.min;
    const base = fit(PRODUCT_IMAGE_WIDTH / size.width, PRODUCT_IMAGE_HEIGHT / size.height);
    return base * this.zoom();
  });

  protected readonly drawn = computed(() => {
    const size = this.natural() ?? { width: 0, height: 0 };
    return { width: size.width * this.scale(), height: size.height * this.scale() };
  });

  protected readonly box = computed(() => ({
    left: (this.position().x / PRODUCT_IMAGE_WIDTH) * 100,
    top: (this.position().y / PRODUCT_IMAGE_HEIGHT) * 100,
    width: (this.drawn().width / PRODUCT_IMAGE_WIDTH) * 100,
    height: (this.drawn().height / PRODUCT_IMAGE_HEIGHT) * 100,
  }));

  constructor() {
    effect(() => this.load(this.src()));
  }

  export(): string {
    const canvas = document.createElement('canvas');
    canvas.width = PRODUCT_IMAGE_WIDTH;
    canvas.height = PRODUCT_IMAGE_HEIGHT;
    const context = canvas.getContext('2d');

    if (!context || !this.image) {
      return this.src();
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const { x, y } = this.position();
    const { width, height } = this.drawn();
    context.drawImage(this.image, x, y, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  protected setMode(mode: FitMode): void {
    this.mode.set(mode);
    this.zoom.set(1);
    this.center();
    this.changed.set(true);
  }

  protected setZoom(value: number): void {
    const previous = this.scale();
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(1, value)));
    const ratio = this.scale() / previous;

    // Mantém o centro do quadro no mesmo ponto da imagem ao aproximar ou afastar
    const centerX = PRODUCT_IMAGE_WIDTH / 2;
    const centerY = PRODUCT_IMAGE_HEIGHT / 2;
    const { x, y } = this.position();
    this.moveTo({ x: centerX - (centerX - x) * ratio, y: centerY - (centerY - y) * ratio });
    this.changed.set(true);
  }

  protected center(): void {
    const { width, height } = this.drawn();
    this.position.set({
      x: (PRODUCT_IMAGE_WIDTH - width) / 2,
      y: (PRODUCT_IMAGE_HEIGHT - height) / 2,
    });
  }

  protected recenter(): void {
    this.center();
    this.changed.set(true);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.frame().nativeElement.setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: this.position(),
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    const pixelsToImage = PRODUCT_IMAGE_WIDTH / this.frame().nativeElement.clientWidth;
    this.moveTo({
      x: this.drag.origin.x + (event.clientX - this.drag.startX) * pixelsToImage,
      y: this.drag.origin.y + (event.clientY - this.drag.startY) * pixelsToImage,
    });
    this.changed.set(true);
  }

  protected onPointerUp(): void {
    this.drag = null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = 20;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[event.key];

    if (move) {
      event.preventDefault();
      const { x, y } = this.position();
      this.moveTo({ x: x + move.x, y: y + move.y });
      this.changed.set(true);
    }
  }

  private moveTo(point: Point): void {
    const { width, height } = this.drawn();
    this.position.set({
      x: clampAxis(point.x, width, PRODUCT_IMAGE_WIDTH),
      y: clampAxis(point.y, height, PRODUCT_IMAGE_HEIGHT),
    });
  }

  private load(src: string): void {
    const image = new Image();
    image.onload = () => {
      this.image = image;
      this.natural.set({ width: image.naturalWidth, height: image.naturalHeight });
      this.mode.set('cover');
      this.zoom.set(1);
      this.center();
      this.changed.set(false);
    };
    image.src = src;
  }
}

// Imagem maior que o quadro não pode deixar borda vazia; menor fica centralizada.
function clampAxis(position: number, drawnSize: number, frameSize: number): number {
  if (drawnSize <= frameSize) {
    return (frameSize - drawnSize) / 2;
  }
  return Math.min(0, Math.max(frameSize - drawnSize, position));
}
