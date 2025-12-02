import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('exampleModal', { read: ElementRef }) exampleModalRef!: ElementRef;

  constructor() { }

  ngOnInit() {}

  ngAfterViewInit() {
    // Mover el modal al body para evitar stacking-contexts creados por contenedores (Ionic, etc.)
    try {
      const modalEl = this.exampleModalRef?.nativeElement as HTMLElement | undefined;
      if (modalEl && modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
      }
    } catch (e) {
      // Si algo falla, no romper la app — sólo lo registramos en consola
      console.warn('No se pudo mover el modal al body:', e);
    }
  }

}
