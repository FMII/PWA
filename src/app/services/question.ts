import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../interfaces/question';
import { Option } from '../interfaces/question';
@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private apiUrl = 'http://localhost:3000/api/questions';

  constructor(private http: HttpClient) {}

  // 🔐 Inyecta el token en cada request
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // 🔹 Obtener todas las preguntas (requiere autenticación)
  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Obtener una pregunta por ID
  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Crear una pregunta (solo admin)
  createQuestion(data: {
    type: string;
    pollId: number;
    title: string;
  }): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, data, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Actualizar pregunta (solo admin)
  updateQuestion(id: number, data: Partial<Question>): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Eliminar pregunta (solo admin)
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Obtener opciones de una pregunta
  getQuestionOptions(id: number): Observable<Option[]> {
    return this.http.get<Option[]>(`${this.apiUrl}/${id}/options`, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Obtener respuestas de una pregunta (solo admin)
  getQuestionResponses(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/responses`, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Obtener preguntas por encuesta
  getQuestionsByPoll(pollId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}?pollId=${pollId}`, {
      headers: this.getHeaders()
    });
  }

  // 🔹 Obtener preguntas por tipo (ej: "multiple", "text", etc.)
  getQuestionsByType(type: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}?type=${type}`, {
      headers: this.getHeaders()
    });
  }

}
