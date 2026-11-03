import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { GamesApi } from '../../api/games-api.service';
import { errorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { DialogService } from '../../core/dialog.service';
import { GameInfo, GameRankingItem, MyGameStats, ScoreSubmission } from '../../core/models';
import { RankingList } from '../../shared/ranking-list/ranking-list';
import { TabOption, Tabs } from '../../shared/tabs/tabs';
import { Tetris } from './tetris/tetris';

const COMING_SOON = '__em-breve__';

@Component({
  selector: 'app-games',
  imports: [Tabs, Tetris, DecimalPipe, RankingList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games.html',
  styleUrl: './games.css',
})
export class Games implements OnInit {
  private readonly gamesApi = inject(GamesApi);
  private readonly dialogs = inject(DialogService);
  protected readonly userId = inject(AuthService).user()?.id ?? null;

  protected readonly games = signal<GameInfo[]>([]);
  protected readonly selected = signal('');
  protected readonly myStats = signal<MyGameStats | null>(null);
  protected readonly ranking = signal<GameRankingItem[]>([]);
  protected readonly saving = signal(false);

  protected readonly tabs = computed<TabOption<string>[]>(() => [
    ...this.games().map((game) => ({ value: game.key, label: game.name })),
    { value: COMING_SOON, label: 'Novo jogo · em breve', disabled: true },
  ]);

  protected readonly leader = computed(() => this.ranking()[0] ?? null);

  ngOnInit(): void {
    this.gamesApi.list().subscribe({
      next: (games) => {
        this.games.set(games);
        this.selected.set(games[0]?.key ?? '');
        this.loadStats();
      },
      error: (error) => this.dialogs.error('Jogos indisponíveis', errorMessage(error)),
    });
  }

  protected onFinished(result: ScoreSubmission): void {
    const game = this.selected();
    if (!game || result.score === 0) {
      return;
    }

    this.saving.set(true);
    this.gamesApi.submit(game, result).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.loadStats();
        this.dialogs.success(
          saved.isNewRecord ? 'Novo recorde!' : 'Fim de jogo',
          `Você fez ${saved.score} pontos.`,
          `Seu recorde é ${saved.bestScore} pontos · ${saved.position}º lugar no ranking.`,
        );
      },
      error: (error) => {
        this.saving.set(false);
        this.dialogs.error('Não foi possível salvar a pontuação', errorMessage(error));
      },
    });
  }

  private loadStats(): void {
    const game = this.selected();
    if (!game) {
      return;
    }

    this.gamesApi.myStats(game).subscribe({ next: (stats) => this.myStats.set(stats) });
    this.gamesApi.ranking(game).subscribe({ next: (ranking) => this.ranking.set(ranking) });
  }
}
