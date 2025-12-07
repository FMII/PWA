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
  turnstileToken: string;
}

export interface LoginData {
  email: string;
  password: string;
  turnstileToken: string;
}

export interface LoginInitiateResponse {
  success: boolean;
  message: string;
  userId: number;
}

export interface LoginVerifyData {
  userId: number;
  code: string;
  turnstileToken: string;
}

export interface AuthResponse {
  data: User;
  msg?: string;
  message?: string;
  token?: string;
  success?: boolean;
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
   * PASO 1: Iniciar login (envía código al correo)
   */
  loginInitiate(data: LoginData): Observable<LoginInitiateResponse> {
    return this.http.post<LoginInitiateResponse>(`${this.apiUrl}/auth/login/initiate`, data);
  }

  /**
   * PASO 2: Verificar código 2FA y completar login
   */
  loginVerify(data: LoginVerifyData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/verify`, data)
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
   * Login de usuario (método legacy - mantener por compatibilidad)
   */
  login(data: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data)
      .pipe(
        tap(response => {
          if (response.data) {
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
            
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

  /**
   * Decodificar payload de un JWT (si el token es JWT)
   */
  private decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
      return null;
    }
  }

  /**
   * Verificar si el token está caducado (solo para JWT con claim `exp`)
   */
  isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) return false; // si no tiene exp, no asumimos expirado
    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  }

  /**
   * Comprueba si el token es válido (no expirado)
   */
  isTokenValid(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    // Si tiene exp y no está caducado -> válido. Si no tiene exp, consideramos válido mientras exista.
    const payload = this.decodeJwtPayload(token);
    if (payload && payload.exp) {
      return !this.isTokenExpired();
    }
    return true;
  }

  /**
   * Verificar si el usuario actual es admin
   * Ajusta la comparación de `roleId` según tu sistema (por ejemplo, 1 = admin)
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.roleId === 1;
  }
}
