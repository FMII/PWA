import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [NgIf, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
})
export class Tab2Page implements OnInit {
  user: User | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // cargar user inicial
    this.user = this.auth.getCurrentUser();
    // mantener actualizado si cambia
    this.auth.currentUser$.subscribe(u => this.user = u);
  }

  logout() {
    this.auth.logout();
    // navegar al login
    this.router.navigate(['/login']);
  }

}
