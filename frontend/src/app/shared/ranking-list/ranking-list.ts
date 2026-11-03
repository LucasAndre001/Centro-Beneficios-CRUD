import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GameRankingItem } from '../../core/models';

@Component({
  selector: 'app-ranking-list',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="list scroll">
      @for (row of rows(); track row.userId) {
        <li [class.me]="row.userId === highlightUserId()">
          <span class="rank-pos">{{ row.position }}</span>
          <span class="spacer">
            {{ row.userId === highlightUserId() ? 'Você' : row.name }}
            @if (row.isAdmin) {
              <span class="badge outline">supervisão</span>
            }
          </span>
          <span>{{ row.bestScore | number }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .badge {
      margin-left: 6px;
      font-size: 12px;
    }
  `,
})
export class RankingList {
  readonly rows = input.required<GameRankingItem[]>();
  readonly highlightUserId = input<number | null>(null);
}
