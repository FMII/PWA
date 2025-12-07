import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UpdateService } from './services/update.service';
import { OfflineData } from './services/offline-data';
import { Answer } from './services/answer';
import { AuthService } from './services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private updateService: UpdateService,
    private offlineData: OfflineData,
    private answerService: Answer,
    private authService: AuthService
    , private toastCtrl: ToastController
  ) { }

  async ngOnInit(): Promise<void> {
    // Procesar la cola cuando volvamos a conectar
    window.addEventListener('online', async () => {
      try {
        // si hay pendientes, recargar la página una sola vez para asegurar ambiente limpio
        const pending = await this.offlineData.getPendingCount();
        const reloadedFlag = sessionStorage.getItem('reloaded_for_queue');
        if (pending > 0 && !reloadedFlag) {
          // marcar y recargar para que la app arranque en un estado limpio
          sessionStorage.setItem('reloaded_for_queue', '1');
          console.log('Pending items detected, reloading to process queue...');
          // avisar al usuario antes de recargar
          try {
            const t = await this.toastCtrl.create({
              message: 'Sincronizando respuestas pendientes… la app se recargará',
              duration: 2000,
              position: 'bottom'
            });
            await t.present();
            // esperar un momento para que el toast sea visible
            await new Promise(r => setTimeout(r, 1500));
          } catch (e) {
            // no bloquear si Toast falla
            console.warn('Toast failed', e);
          }
          window.location.reload();
          return;
        }

        // si ya recargamos o no era necesario recargar, procesar la cola directamente
        await this.offlineData.processQueue(async (payload: any) => {
          try {
            await firstValueFrom(this.answerService.createResponse(payload));
          } catch (err: any) {
            const status = err?.status ?? (err?.message && err.message.indexOf('HTTP 401') !== -1 ? 401 : null);
            if (status === 401) {
              // intentar refresh token si el AuthService lo implementa
              const maybeRefresh = (this.authService as any).refreshToken;
              if (typeof maybeRefresh === 'function') {
                try {
                  const refreshRes = maybeRefresh.call(this.authService);
                  // soportar Observable o Promise
                  await firstValueFrom(refreshRes instanceof Promise ? (refreshRes as any) : refreshRes);
                  // reintentar la petición una vez
                  await firstValueFrom(this.answerService.createResponse(payload));
                  return;
                } catch (refreshErr) {
                  console.warn('Token refresh failed while processing queue', refreshErr);
                  throw err;
                }
              }
              console.warn('Request returned 401 while processing queue. Ensure token valid or re-authenticate.');
            }
            throw err;
          }
        }, 3);
      } catch (e) {
        console.error('Error processing offline queue on online event', e);
      }
    });

    // Si venimos de una recarga forzada para procesar la cola, procesarla ahora y limpiar flag
    const wasReloaded = sessionStorage.getItem('reloaded_for_queue');
    if (wasReloaded && navigator.onLine) {
      try {
        await this.offlineData.processQueue(async (payload: any) => {
          try {
            await firstValueFrom(this.answerService.createResponse(payload));
          } catch (err: any) {
            const status = err?.status ?? (err?.message && err.message.indexOf('HTTP 401') !== -1 ? 401 : null);
            if (status === 401) {
              const maybeRefresh = (this.authService as any).refreshToken;
              if (typeof maybeRefresh === 'function') {
                try {
                  const refreshRes = maybeRefresh.call(this.authService);
                  await firstValueFrom(refreshRes instanceof Promise ? (refreshRes as any) : refreshRes);
                  await firstValueFrom(this.answerService.createResponse(payload));
                  return;
                } catch (refreshErr) {
                  console.warn('Token refresh failed while processing queue after reload', refreshErr);
                  throw err;
                }
              }
              console.warn('Request returned 401 while processing queue after reload. Ensure token valid or re-authenticate.');
            }
            throw err;
          }
        }, 3);
      } catch (e) {
        console.error('Error processing queue after reload', e);
      } finally {
        sessionStorage.removeItem('reloaded_for_queue');
      }
    } else if (navigator.onLine) {
      // intentar procesar al inicio si hay conexión y no venimos de recarga
      window.dispatchEvent(new Event('online'));
    }
  }
}

console.log('VERSIÓN 1.1 - cambio realizado 07/12/2025 12:37 AM');
