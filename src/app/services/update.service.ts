import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AlertController, Platform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly CHECK_INTERVAL = 1000 * 60 * 60 * 4; // 4 horas

  constructor(
    private swUpdate: SwUpdate,
    private alertCtrl: AlertController,
    private platform: Platform
  ) {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker no habilitado');
      return;
    }

    // ✅ Nueva API Angular 16–20
    this.swUpdate.versionUpdates.subscribe(async (event) => {
      console.log('SW Event:', event);

      if (event.type === 'VERSION_READY') {
        await this.promptUserToUpdate();
      }
    });

    // Opcional: al volver del background
    try {
      (this.platform as any).resume?.subscribe(() => {
        this.checkForUpdate();
      });
    } catch (_) {}

    // Chequeos periódicos
    setInterval(() => this.checkForUpdate(), this.CHECK_INTERVAL);

    // Chequeo inicial
    this.checkForUpdate();
  }

  // Revisa si existe una nueva versión
  async checkForUpdate() {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (e) {
      console.warn('checkForUpdate failed', e);
    }
  }

  // Alerta para actualizar
  private async promptUserToUpdate() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva versión disponible',
      message: 'Hay una nueva versión lista para instalar.',
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: () => this.doUpdate()
        }
      ]
    });

    await alert.present();
  }

  // Instalar update y recargar
  async doUpdate() {
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch (e) {
      console.error('Error activating update', e);
      document.location.reload();
    }
  }
}
