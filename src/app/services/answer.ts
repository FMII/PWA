import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response } from '../interfaces/response';
@Injectable({
  providedIn: 'root'
})
export class Answer {
  private apiUrl = 'http://localhost:3000/api/responses';

  constructor(private http: HttpClient) { }

  // ⭐ Obtener todas las respuestas (solo admin)
  getAllResponses(): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}`);
  }

  // ⭐ Obtener respuesta por ID
  getResponseById(id: number): Observable<Response> {
    return this.http.get<Response>(`${this.apiUrl}/${id}`);
  }

  // ⭐ Crear respuesta
  createResponse(data: {
    pollId: number;
    questionId: number;
    userId: number;
    optionId: number;
    response: string;
  }): Observable<Response> {
    return this.http.post<Response>(`${this.apiUrl}`, data);
  }

  // ⭐ Actualizar respuesta
  updateResponse(id: number, data: Partial<Response>): Observable<Response> {
    return this.http.put<Response>(`${this.apiUrl}/${id}`, data);
  }

  // ⭐ Eliminar respuesta (solo admin)
  deleteResponse(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ⭐ Respuestas por encuesta
  getResponsesByPoll(pollId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/poll/${pollId}`);
  }

  // ⭐ Respuestas por usuario
  getResponsesByUser(userId: number): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.apiUrl}/user/${userId}`);
  }
}
