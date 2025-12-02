import { Component, OnInit } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { IonInput, IonItem, IonList, IonText, IonIcon, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [IonButton, IonInput, IonItem, IonList, IonText, IonIcon,IonContent],
})
export class LoginComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
