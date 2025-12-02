import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
  imports: [ FormsModule, NgIf],
})
export class AdminLoginComponent implements OnInit {

  credentials = { email: '', password: '' };
  loading = false;
  errorMessage = '';

  /** URL de login tomada de `src/environments/environment.ts` */
  private apiLoginUrl = `${environment.apiUrl}/api/auth/login`;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage = 'Por favor completa los campos correctamente.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(this.apiLoginUrl, this.credentials).subscribe({
      next: (res) => {
        // Respuesta esperada según tu controlador: { message, data: user, token }
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          if (res.data) {
            localStorage.setItem('user', JSON.stringify(res.data));
          }
          // Redirige a dashboard (ajusta la ruta si es otra)
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Respuesta inesperada del servidor.';
        }
        this.loading = false;
      },
      error: (err) => {
        // Manejo simple de errores. El controlador envía { success:false, error: message }
        this.errorMessage = err?.error?.error || err?.message || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }

}
