import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { authInterceptor } from './app/interceptors/auth.interceptor';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(FormsModule),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: true, // Activado siempre para probar notificaciones
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
});
