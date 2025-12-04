import { Component, OnInit, ViewChild } from '@angular/core';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonSpinner, IonButton, IonModal, IonList, IonItem, IonLabel, IonButtons
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { Polls } from '../services/polls';
import { AuthService, User } from '../services/auth.service';
import { Poll } from '../interfaces/poll';
import { Answer } from '../services/answer';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonSpinner,
    ExploreContainerComponent, FormsModule, RouterModule, DatePipe, NgIf, NgFor, IonButton, IonModal, IonList, IonItem, IonLabel, IonButtons
  ],
})
export class Tab3Page implements OnInit {
  polls: Poll[] = [];
  loading: boolean = false;
  currentUser: User | null = null;

  @ViewChild('responsesModal') responsesModal!: IonModal;
  selectedPollTitle: string = '';
  userResponses: any[] = [];
  loadingResponses: boolean = false;

  constructor(
    private pollsService: Polls,
    private authService: AuthService,
    private answerService: Answer
  ) { }

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

  viewResponses(poll: Poll) {
    if (!this.currentUser) return;

    this.selectedPollTitle = poll.title;
    this.loadingResponses = true;

    // ✅ Usamos el servicio Answer, que apunta a /api/responses
    this.answerService.getResponsesByPollAndUser(poll.id, this.currentUser.id).subscribe({
      next: (res) => {
        this.userResponses = res;
        this.loadingResponses = false;
        this.responsesModal.present();
      },
      error: (err) => {
        console.error('Error cargando respuestas', err);
        this.loadingResponses = false;
      }
    });
  }

  closeResponsesModal() {
    this.responsesModal.dismiss();
  }
}
