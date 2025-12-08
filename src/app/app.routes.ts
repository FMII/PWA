import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { deviceRoleGuard } from './guards/device-role-guard';
import { PollQuestionsComponent } from './poll-questions/poll-questions.component';
import { PollQuestionComponent } from './poll-question/poll-question.component';
import { AdminMobileWarningComponent } from './admin-mobile-warning/admin-mobile-warning.component';
import { DownloadAppComponent } from './download-app/download-app.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent,
  },
  {
    path: 'admin-mobile-warning',
    component: AdminMobileWarningComponent
  },
  {
    path: 'download-app',
    component: DownloadAppComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, deviceRoleGuard],
    data: { requiresAdmin: true }
  },
  {
    path: 'admin/encuestas',
    component: PollQuestionsComponent,
    canActivate: [authGuard, deviceRoleGuard],
    data: { requiresAdmin: true }
  },
  {
    path: 'encuesta/:id',
    component: PollQuestionComponent,
    canActivate: [authGuard, deviceRoleGuard],
  },
  {
    path: 'tabs',
    canActivate: [authGuard, deviceRoleGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
