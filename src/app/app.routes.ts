import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { PollQuestionsComponent } from './poll-questions/poll-questions.component';
import { PollQuestionComponent } from './poll-question/poll-question.component';
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
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { requiresAdmin: true }
  },
  {
    path: 'admin/encuestas',
    component: PollQuestionsComponent,
    canActivate: [authGuard],
    data: { requiresAdmin: true }
  },
  {
    path: 'encuesta/:id',
    component: PollQuestionComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
