import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonButton, IonSpinner,
  IonModal, IonButtons, IonItem, IonLabel, IonList, IonRadio, IonInput, IonCheckbox, IonRadioGroup
} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { Polls } from '../services/polls';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { OverlayEventDetail } from '@ionic/core/components';
import { QuestionService } from '../services/question';
import { Answer } from '../services/answer';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonRow, IonCol, IonGrid, IonText, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonButton, IonSpinner,
    ExploreContainerComponent, FormsModule, RouterModule, DatePipe, NgIf, NgFor,
    IonModal, IonButtons, IonItem, IonLabel, IonList, IonRadio, IonInput, IonCheckbox, IonRadioGroup,
  ],
})
export class Tab1Page {
  @ViewChild('modal') modal!: IonModal;

  polls: any[] = [];
  loading = false;
  activePollId!: number;
  activePollTitle: string = '';
  pollQuestions: any[] = [];

  constructor(
    private pollsService: Polls,
    private questionService: QuestionService,
    private answerService: Answer,
    private alertController: AlertController
  ) { }

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

  /* MODAL */
  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openPollModal(id: number) {
    const poll = this.polls.find(p => p.id === id);

    if (poll?.status === 'closed') {
      const alert = await this.alertController.create({
        header: 'Encuesta cerrada',
        message: 'Esta encuesta ya no está disponible.',
        buttons: ['OK'],
      });

      await alert.present();
      return;
    }

    this.activePollId = id;
    this.activePollTitle = poll?.title || 'Encuesta';
    this.pollQuestions = [];

    this.pollsService.getPollQuestions(id).subscribe({
      next: (questions) => {
        let loaded = 0;

        if (questions.length === 0) {
          this.pollQuestions = [];
          this.modal.present();
          return;
        }

        questions.forEach((q: any) => {
          if (q.type === 'open' || q.type === 'yes-no') {
            q.options = [];
            loaded++;

            if (loaded === questions.length) {
              this.pollQuestions = questions;
              this.modal.present();
            }
          } else {
            this.questionService.getQuestionOptions(q.id).subscribe(options => {
              q.options = options || [];
              loaded++;

              if (loaded === questions.length) {
                this.pollQuestions = questions;
                this.modal.present();
              }
            });
          }
        });
      },
      error: err => console.error('Error cargando preguntas', err)
    });
  }
  sendSingleResponse(data: any): Promise<void> {
    const body: any = {
      pollId: data.pollId,
      questionId: data.questionId,
      userId: data.userId,
      response: data.response || ''
    };

    // 👉 Si hay optionId válido → lo enviamos
    if (data.optionId !== null && data.optionId !== undefined) {
      body.optionId = data.optionId;
    }

    console.log("📤 Enviando al backend:", body);

    return new Promise((resolve, reject) => {
      this.answerService.createResponse(body).subscribe({
        next: () => resolve(),
        error: (err) => {
          console.error("❌ Error enviando respuesta", err);
          reject(err);
        }
      });
    });
  }

  async submitResponses() {
    const userId = 1;

    try {
      for (const q of this.pollQuestions) {
        let payload: any = null;

        // -----------------------------
        // OPEN
        // -----------------------------
        if (q.type === 'open') {
          payload = {
            pollId: this.activePollId,
            questionId: q.id,
            userId,
            response: q.answer || '',
            optionId: null
          };
        }

        // -----------------------------
        // YES / NO
        // -----------------------------
        if (q.type === 'yes-no') {
          payload = {
            pollId: this.activePollId,
            questionId: q.id,
            userId,
            response: q.answer === true ? "yes" : "no"
          };
        }

        // -----------------------------
        // SINGLE CHOICE
        // -----------------------------
        if (q.type === 'single-choice') {
          payload = {
            pollId: this.activePollId,
            questionId: q.id,
            userId,
            optionId: q.answer,
            response: ''
          };
        }

        // -----------------------------
        // MULTIPLE CHOICE
        // -----------------------------
        if (q.type === 'multiple-choice') {
          const selected = q.options.filter((o: any) => o.selected);

          for (const opt of selected) {
            const multiPayload = {
              pollId: this.activePollId,
              questionId: q.id,
              userId,
              optionId: opt.id,
              response: ''
            };

            console.log("📤 Enviando MULTIPLE:", multiPayload);
            await this.sendSingleResponse(multiPayload);
          }

          continue;
        }

        console.log("📤 Enviando:", payload);
        await this.sendSingleResponse(payload);
      }

      // ✅ Al terminar todas las respuestas:
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'La encuesta se ha contestado correctamente.',
        buttons: ['OK'],
      });

      await alert.present();

      // Cierra el modal
      this.modal.dismiss();

    } catch (err) {
      console.error('Error enviando respuestas', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Hubo un problema al enviar la encuesta. Intenta de nuevo.',
        buttons: ['OK'],
      });

      await alert.present();
    }
  }
}
