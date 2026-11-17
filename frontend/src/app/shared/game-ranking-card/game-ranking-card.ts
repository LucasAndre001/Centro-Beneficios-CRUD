import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamesApi } from '../../api/games-api.service';
import { GameInfo, GameRankingItem } from '../../core/models';
import { RankingList } from '../ranking-list/ranking-list';
import { TabOption, Tabs } from '../tabs/tabs';

@Component({
  selector: 'app-game-ranking-card',
  imports: [Tabs, RankingList, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-ranking-card.html',
  host: { class: 'card' },
  styles: `
    .center {
      margin: 0;
      text-align: center;
    }
  `,
})
export class GameRankingCard {
  private readonly gamesApi = inject(GamesApi);

  readonly highlightUserId = input<number | null>(null);
  readonly showPlayLink = input(false);

  protected readonly games = signal<GameInfo[]>([]);
  protected readonly selected = signal('');
  protected readonly ranking = signal<GameRankingItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly tabs = computed<TabOption<string>[]>(() =>
    this.games().map((game) => ({ value: game.key, label: game.name })),
  );

  protected readonly gameName = computed(
    () => this.games().find((game) => game.key === this.selected())?.name ?? '',
  );

  protected readonly gap = computed(() => {
    const rows = this.ranking();
    const index = rows.findIndex((row) => row.userId === this.highlightUserId());
    if (index <= 0) {
      return null;
    }
    const ahead = rows[index - 1];
    return { position: ahead.position, points: ahead.bestScore - rows[index].bestScore };
  });

  constructor() {
    this.gamesApi.list().subscribe({
      next: (games) => {
        this.games.set(games);
        this.selected.set(games[0]?.key ?? '');
        if (games.length === 0) {
          this.loading.set(false);
        }
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });

    effect(() => {
      const game = this.selected();
      if (game) {
        this.load(game);
      }
    });
  }

  private load(game: string): void {
    this.loading.set(true);
    this.gamesApi.ranking(game).subscribe({
      next: (ranking) => {
        this.ranking.set(ranking);
        this.failed.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
