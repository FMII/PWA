import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
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
import { AuthService } from '../services/auth.service';
import { PushNotificationService } from '../services/push-notification.service';
import { OfflineData } from '../services/offline-data';
import { firstValueFrom } from 'rxjs';

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
export class Tab1Page implements OnInit {
  @ViewChild('modal') modal!: IonModal;

  polls: any[] = [];
  loading = false;
  activePollId!: number;
  activePollTitle: string = '';
  pollQuestions: any[] = [];
  pendingCount: number = 0;
  answeredPolls: number[] = []; // IDs de encuestas contestadas


  constructor(
    private pollsService: Polls,
    private questionService: QuestionService,
    private answerService: Answer,
    private alertController: AlertController,
    private toastController: ToastController,
    private pushService: PushNotificationService,
    private authService: AuthService,
    private offlineData: OfflineData
  ) { }

  ngOnInit(): void {
    /*this.loadAnsweredPolls();*/
    this.loadPolls();
    this.checkAndRequestNotifications();
    // queue processing moved to AppComponent (global)
    // actualizar contador de pendientes
    this.updatePendingCount();
    
    // Suscribirse a actualizaciones de encuestas
    this.pollsService.pollsUpdated$.subscribe((updated) => {
      if (updated) {
        console.log('🔄 Encuestas actualizadas, recargando...');
        this.loadPolls();
      }
    });
  }

  /**
   * Se ejecuta cada vez que el usuario entra a esta pestaña
   * Útil para actualizar las encuestas cuando se crea una nueva
   */
  ionViewWillEnter() {
    this.loadPolls();
    this.updatePendingCount();
  }

  async checkAndRequestNotifications() {
    try {
      // Esperar un poco para no bloquear la carga inicial
      await new Promise(resolve => setTimeout(resolve, 2000));

      const user = this.authService.getCurrentUser();
      if (!user?.id) return;

      // Verificar si ya tiene permiso
      if (Notification.permission === 'granted') {
        // Asegurar que esté suscrito en el backend
        await this.pushService.initialize();
        await this.pushService.subscribeUser(user.id);
        return;
      }

      // Si ya denegó, no molestar
      if (Notification.permission === 'denied') return;

      // Si no ha respondido, preguntar
      const alert = await this.alertController.create({
        header: '🔔 Activar Notificaciones',
        message: '¿Quieres recibir avisos cuando haya nuevas encuestas?',
        buttons: [
          { text: 'No por ahora', role: 'cancel' },
          {
            text: 'Sí, activar',
            handler: async () => {
              await this.pushService.initialize();
              const success = await this.pushService.subscribeUser(user.id);
              
              if (success) {
                const toast = await this.toastController.create({
                  message: '✅ Notificaciones activadas',
                  duration: 2000,
                  color: 'success',
                  position: 'top'
                });
                await toast.present();
              }
            }
          }
        ]
      });

      await alert.present();

    } catch (error) {
      console.error('Error verificando notificaciones:', error);
    }
  }
  /*
  loadAnsweredPolls() {
    const saved = localStorage.getItem('answeredPolls');
    this.answeredPolls = saved ? JSON.parse(saved) : [];
  }
  */
  async loadPolls() {
  const user = this.authService.getCurrentUser();
  if (!user?.id) return;

  this.loading = true;

  this.pollsService.getPollsForUser(user.id).subscribe({
    next: async (res) => {
      const list = (res || []).filter(p => !p.completed && p.questions && p.questions.length > 0);
      this.polls = list;
        await this.offlineData.savePolls(list); // guardamos cache

        // intentar asignar thumbnails cacheadas o empezar a cachearlas
        for (const p of this.polls) {
          const pid = (p.pollId ?? p.id) as number;
          try {
            const blob = await this.offlineData.getThumbnailBlob(pid);
            if (blob) {
              (p as any).thumbnailUrl = URL.createObjectURL(blob);
            } else if ((p as any).thumbnailUrl) {
              // cachear en background y luego asignar
              await this.offlineData.cacheThumbnail(pid, (p as any).thumbnailUrl);
              const b2 = await this.offlineData.getThumbnailBlob(pid);
              if (b2) (p as any).thumbnailUrl = URL.createObjectURL(b2);
            }
          } catch (e) {
            // no crítico
            console.warn('thumb processing error', e);
          }
        }

        this.loading = false;
    },
    error: async (err) => {
      console.error('Error cargando encuestas, intentando cache', err);
      const cached = await this.offlineData.getPolls();
      // filtrar por stale? mostrar todos y marcar stale si quieres
        this.polls = (cached || []).filter(p => p.questions && p.questions.length > 0);

        // asignar thumbnails cacheadas si existen
        for (const p of this.polls) {
          const pid = (p.pollId ?? p.id) as number;
          try {
            const blob = await this.offlineData.getThumbnailBlob(pid);
            if (blob) {
              (p as any).thumbnailUrl = URL.createObjectURL(blob);
            }
          } catch (e) {
            console.warn('error getting cached thumb', e);
          }
        }

        this.loading = false;
      // opcional: mostrar toast indicando modo offline
    }
  });
}

  /* MODAL */
  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async openPollModal(id: number) {
  this.activePollId = id;
  this.pollQuestions = [];

  if (!navigator.onLine) {
    const cached = await this.offlineData.getPoll(id);
    if (cached) {
      this.pollQuestions = cached.questions || [];
      this.activePollTitle = cached.title || 'Encuesta (offline)';
      this.modal.present();
      return;
    }
    
  }

  // Si hay conexión, seguir con la llamada actual a getPollQuestions()
  // cuando recibas detalle, guarda:
  this.pollsService.getPollQuestions(id).subscribe({
    next: async (questions) => {
      // construir pollDetail con preguntas si tu endpoint no devuelve todo
      const pollDetail = { pollId: id, title: this.activePollTitle, questions };
      await this.offlineData.savePoll(pollDetail);
      this.pollQuestions = questions;
      this.modal.present();
    },
    error: async (err) => {
      // fallback a cache si existe
      const cached = await this.offlineData.getPoll(id);
      if (cached) {
        this.pollQuestions = cached.questions || [];
        this.activePollTitle = cached.title || 'Encuesta (offline)';
        this.modal.present();
      } else {
        console.error('Error cargando preguntas y no hay cache', err);
      }
    }
  });
}
  async sendSingleResponse(data: any): Promise<void> {
    const body: any = {
      pollId: data.pollId ?? data.pollId ?? data.pollId,
      questionId: data.questionId,
      userId: data.userId,
      response: data.response || ''
    };

    // 👉 Si hay optionId válido → lo enviamos
    if (data.optionId !== null && data.optionId !== undefined) {
      body.optionId = data.optionId;
    }

    console.log('📤 Enviando al backend (o encolando):', body);

    // Si no hay conexión, encolar directamente
    if (!navigator.onLine) {
      await this.offlineData.enqueueResponse({ type: 'submitResponse', payload: body });
      await this.updatePendingCount();
      return;
    }

    try {
      await firstValueFrom(this.answerService.createResponse(body));
    } catch (err) {
      console.error('❌ Error enviando respuesta, encolando:', err);
      // encolar como fallback para reintento
      try {
        await this.offlineData.enqueueResponse({ type: 'submitResponse', payload: body });
        await this.updatePendingCount();
      } catch (e) {
        console.error('Error encolando fallback', e);
      }
      // No lanzar error para que el flujo continue; ya quedó en cola
    }
  }

  // Actualizar contador de pendientes
  async updatePendingCount() {
    try {
      this.pendingCount = await this.offlineData.getPendingCount();
    } catch (e) {
      console.warn('Error getting pending count', e);
      this.pendingCount = 0;
    }
  }

  // Procesar la cola manualmente (botón)
  async processQueueNow() {
    const toast = await this.toastController.create({ message: 'Procesando cola...', duration: 2000 });
    await toast.present();
    try {
      await this.offlineData.processQueue(async (payload: any) => {
        await firstValueFrom(this.answerService.createResponse(payload));
      }, 3);
      await this.updatePendingCount();
      const ok = await this.toastController.create({ message: 'Procesamiento finalizado', duration: 2000, color: 'success' });
      await ok.present();
    } catch (e) {
      console.error('Error procesando cola manualmente', e);
      const err = await this.toastController.create({ message: 'Error procesando cola', duration: 2000, color: 'danger' });
      await err.present();
    }
  }

  async submitResponses() {
  const user = this.authService.getCurrentUser();
  const userId = user?.id;

  if (!userId) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudo identificar al usuario. Por favor inicia sesión de nuevo.',
      buttons: ['OK'],
    });
    await alert.present();
    return;
  }

  try {
    for (const q of this.pollQuestions) {
      let payload: any = null;

      // OPEN
      if (q.type === 'open') {
        payload = {
          pollId: this.activePollId,
          questionId: q.id,
          userId,
          response: q.answer || '',
          optionId: null
        };
      }

      // YES / NO
      if (q.type === 'yes-no') {
        payload = {
          pollId: this.activePollId,
          questionId: q.id,
          userId,
          response: q.answer === true ? "yes" : "no"
        };
      }

      // SINGLE CHOICE
      if (q.type === 'single-choice') {
        payload = {
          pollId: this.activePollId,
          questionId: q.id,
          userId,
          optionId: q.answer,
          response: ''
        };
      }

      // MULTIPLE CHOICE
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

          await this.sendSingleResponse(multiPayload);
        }

        continue;
      }

      await this.sendSingleResponse(payload);
    }

    const alert = await this.alertController.create({
      header: 'Éxito',
      message: 'La encuesta se ha contestado correctamente.',
      buttons: ['OK'],
    });
    await alert.present();
    this.modal.dismiss();
    
    // Recargar la lista para que desaparezca la encuesta contestada
    this.loadPolls();

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
