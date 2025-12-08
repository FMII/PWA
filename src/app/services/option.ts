import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Option {

  private apiUrl = `${environment.apiUrl}/options`;

  constructor(private http: HttpClient, private authService: AuthService) {}
private getHeaders(): HttpHeaders {
  const token = this.authService.getAuthToken() ?? '';
  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
}
  /** Obtener todas las opciones */
  getAllOptions(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /** Obtener opción por ID */
  getOptionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /** Crear nueva opción (solo admin) */
  createOption(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  /** Actualizar opción (solo admin) */
  updateOption(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  /** Eliminar opción (solo admin) */
  deleteOption(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /** Obtener respuestas de una opción (solo admin) */
  getOptionResponses(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/responses`);
  }

  /** Obtener todas las opciones de una pregunta  
   *  (tu backend tiene el método en OptionService aunque no está en rutas)
   *  Si tienes una ruta /api/questions/:id/options deberías usarla.
   */
  getOptionsByQuestion(questionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/questions/${questionId}/options`);
  }
}
