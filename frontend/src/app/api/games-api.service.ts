import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GameInfo,
  GameRankingItem,
  GameResult,
  MyGameStats,
  ScoreSubmission,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class GamesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/games`;

  list(): Observable<GameInfo[]> {
    return this.http.get<GameInfo[]>(this.baseUrl);
  }

  ranking(game: string, take = 10): Observable<GameRankingItem[]> {
    const params = new HttpParams().set('take', take);
    return this.http.get<GameRankingItem[]>(`${this.baseUrl}/${game}/ranking`, { params });
  }

  myStats(game: string): Observable<MyGameStats> {
    return this.http.get<MyGameStats>(`${this.baseUrl}/${game}/me`);
  }

  submit(game: string, score: ScoreSubmission): Observable<GameResult> {
    return this.http.post<GameResult>(`${this.baseUrl}/${game}/scores`, score);
  }
}
