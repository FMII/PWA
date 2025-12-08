import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../interfaces/question';
import { Option } from '../interfaces/question';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private apiUrl = `${environment.apiUrl}/questions`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // 🔐 Inyecta el token en cada request
  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken() ?? '';
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


  /* OPCIONES */

  /** Obtener todas las opciones */
  getAllOptions(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/options`, {
      headers: this.getHeaders()
    });
  }

  /** Obtener opción por ID */
  getOptionById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/options/${id}`, {
      headers: this.getHeaders()
    });
  }

  /** Crear nueva opción (solo admin) */
  createOption(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/options`, data, {
      headers: this.getHeaders()
    });
  }

  /** Actualizar opción (solo admin) */
  updateOption(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/options/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  /** Eliminar opción (solo admin) */
  deleteOption(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/options/${id}`, {
      headers: this.getHeaders()
    });
  }

  /** Obtener respuestas de una opción (solo admin) */
  getOptionResponses(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/options/${id}/responses`, {
      headers: this.getHeaders()
    });
  }

  /** Obtener todas las opciones de una pregunta  
   *  (tu backend tiene el método en OptionService aunque no está en rutas)
   *  Si tienes una ruta /api/questions/:id/options deberías usarla.
   */
  getOptionsByQuestion(questionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/questions/${questionId}/options`);
  }
}
