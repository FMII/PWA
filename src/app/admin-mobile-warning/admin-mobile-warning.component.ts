import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-mobile-warning',
  templateUrl: './admin-mobile-warning.component.html',
  styleUrls: ['./admin-mobile-warning.component.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonText, CommonModule]
})
export class AdminMobileWarningComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
