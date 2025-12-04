import { Component, OnInit } from '@angular/core';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonSpinner, IonButton
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { Polls } from '../services/polls';
import { AuthService, User } from '../services/auth.service';
import { Poll } from '../interfaces/poll';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonSpinner,
    ExploreContainerComponent, FormsModule, RouterModule, DatePipe, NgIf, NgFor, IonButton
  ],
})
export class Tab3Page implements OnInit {
  polls: Poll[] = [];
  loading: boolean = false;
  currentUser: User | null = null;

  constructor(private pollsService: Polls, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      console.warn('No hay usuario autenticado.');
      return;
    }

    this.loadUserPolls(this.currentUser.id);
  }

  loadUserPolls(userId: number) {
    this.loading = true;

    this.pollsService.getPollsByUser(userId).subscribe({
      next: (res) => {
        this.polls = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando encuestas por usuario', err);
        this.loading = false;
      }
    });
  }
}
