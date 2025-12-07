import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UpdateService } from './services/update.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private updateService: UpdateService
  ) { }
}
console.log("VERSIÓN 1.1 - cambio realizado 07/12/2025 12:37 AM");
