import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Poll } from '../interfaces/poll';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Polls {

  private apiUrl = `${environment.apiUrl}/polls`;
  
  // Subject para notificar cuando hay cambios en las encuestas
  private pollsUpdated = new BehaviorSubject<boolean>(false);
  public pollsUpdated$ = this.pollsUpdated.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken() ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // GET /api/polls
  getAllPolls(): Observable<Poll[]> {
    return this.http.get<Poll[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // GET /api/polls (El backend detecta el usuario por el token y devuelve el estado 'completed')
  getPollsForUser(userId: number): Observable<Poll[]> {
    return this.http.get<Poll[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // GET /api/polls/:id
  getPollById(id: number): Observable<Poll> {
    return this.http.get<Poll>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // POST /api/polls
  createPoll(data: Partial<Poll>): Observable<Poll> {
    return this.http.post<Poll>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  // PUT /api/polls/:id
  updatePoll(id: number, data: Partial<Poll>): Observable<Poll> {
    return this.http.put<Poll>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  // DELETE /api/polls/:id
  deletePoll(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // GET /api/polls/:id/questions
  getPollQuestions(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/questions`, { headers: this.getHeaders() });
  }

  // GET /api/polls/:id/responses
  getPollResponses(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/responses`, { headers: this.getHeaders() });
  }

  // GET /api/polls/stats - totals: total, open (active), closed
  getStats(): Observable<{ total: number; open: number; closed: number }> {
    return this.http.get<{ total: number; open: number; closed: number }>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  // GET /api/polls/user/:userId
  getPollsByUser(userId: number): Observable<Poll[]> {
    return this.http.get<Poll[]>(`${this.apiUrl}/user/${userId}`, { headers: this.getHeaders() });
  }

  /**
   * Notificar que las encuestas han sido actualizadas
   * Útil cuando se crea una nueva encuesta o llega una notificación
   */
  notifyPollsUpdated() {
    this.pollsUpdated.next(true);
  }
}
