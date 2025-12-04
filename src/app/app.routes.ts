import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { authGuard } from './guards/auth-guard';
import { PollQuestionsComponent } from './poll-questions/poll-questions.component';
import { PollQuestionComponent } from './poll-question/poll-question.component';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/encuestas',
    component: PollQuestionsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'encuesta/:id',
    component: PollQuestionComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
