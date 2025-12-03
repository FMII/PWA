import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  createdAt: string;
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  data: User;
  msg: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario guardado si existe
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  /**
   * Registrar nuevo usuario
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users`, data)
      .pipe(
        tap(response => {
          if (response.data) {
            // Guardar usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
          }
        })
      );
  }

  /**
   * Login de usuario (adaptar según tu endpoint de login)
   */
  login(data: LoginData): Observable<AuthResponse> {
    // Ajusta esta URL según tu endpoint de login
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data)
      .pipe(
        tap(response => {
          if (response.data) {
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
            
            // Si hay token, guardarlo
            if (response.token) {
              localStorage.setItem('authToken', response.token);
            }
          }
        })
      );
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obtener token de autenticación
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
