import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../interfaces/response';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Answer {
  private apiUrl = `${environment.apiUrl}/responses`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken() ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ⭐ Obtener todas las respuestas (solo admin)
  getAllResponses(): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  // ⭐ Obtener respuesta por ID
  getResponseById(id: number): Observable<Response> {
    return this.http.get<Response>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // ⭐ Crear respuesta
  createResponse(data: {
    pollId: number;
    questionId: number;
    userId: number;
    optionId?: number;
    response: string;
  }): Observable<Response> {
    return this.http.post<Response>(`${this.apiUrl}`, data, { headers: this.getHeaders() });
  }

  // ⭐ Actualizar respuesta
  updateResponse(id: number, data: Partial<Response>): Observable<Response> {
    return this.http.put<Response>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  // ⭐ Eliminar respuesta (solo admin)
  deleteResponse(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // ⭐ Obtener detalles de encuesta contestada (preguntas + respuestas del usuario)
  getAnsweredPollDetails(pollId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/poll/${pollId}/user/${userId}/details`, { headers: this.getHeaders() });
  }

  // ⭐ Respuestas por encuesta
  getResponsesByPoll(pollId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/poll/${pollId}`);
  }

  // ⭐ Respuestas por usuario
  getResponsesByUser(userId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/user/${userId}`);
  }

  // ⭐ Respuestas por encuesta y usuario
  getResponsesByPollAndUser(pollId: number, userId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/poll/${pollId}/user/${userId}`);
  }
}
