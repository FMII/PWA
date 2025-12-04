import { Component, OnInit, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonButton, IonSpinner, IonModal, IonButtons, IonItem, IonLabel, IonList } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { Polls } from '../services/polls';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgIf, NgFor } from '@angular/common';
import { OverlayEventDetail } from '@ionic/core/components';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonButton, IonSpinner, ExploreContainerComponent, FormsModule, RouterModule, DatePipe, NgIf, NgFor, IonModal, IonButtons, IonItem, IonLabel, IonList],
})
export class Tab1Page {
  @ViewChild('modal') modal!: IonModal;
  polls: any[] = [];
  loading = false;
  activePollId!: number;
  activePollTitle: string = '';
  pollQuestions: any[] = [];
  constructor(private pollsService: Polls) { }

  ngOnInit(): void {
    this.loadPolls();
  }

  loadPolls() {
    this.loading = true;
    this.pollsService.getAllPolls().subscribe({
      next: (res) => {
        this.polls = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando encuestas', err);
        this.loading = false;
      }
    });
  }

  /*MODAL*/
  message = 'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name!: string;

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
  }
  openPollModal(id: number) {
    this.activePollId = id;

    const poll = this.polls.find(p => p.id === id);
    this.activePollTitle = poll?.title || 'Encuesta';

    // Cargar preguntas
    this.pollsService.getPollQuestions(id).subscribe({
      next: (res) => {
        this.pollQuestions = res; // ← contiene los títulos de las preguntas
        this.modal.present();
      },
      error: (err) => console.error('Error cargando preguntas', err)
    });
  }

  onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role === 'confirm') {
      this.message = `Hello, ${event.detail.data}!`;
    }
  }
}
