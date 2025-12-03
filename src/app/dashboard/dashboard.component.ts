import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Polls } from '../services/polls';
import { NgFor } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, NgFor]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  polls: any[] = [];
  editingPollId: number | null = null;

  constructor(private pollsService: Polls) {}

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    this.pollsService.getAllPolls().subscribe({
      next: (res) => this.polls = res,
      error: (err) => console.error("Error al cargar encuestas:", err)
    });
  }

  ngAfterViewInit(): void {

    const modal = document.getElementById("modal")!;
    const openBtn = document.getElementById("openModalBtn")!;
    const closeBtn = document.getElementById("closeModalBtn")!;
    const createBtn = document.getElementById("createBtn")!;

    // OPEN MODAL PARA CREAR
    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
      this.editingPollId = null;

      // Limpiar inputs
      (document.getElementById("title") as HTMLInputElement).value = "";
      (document.getElementById("description") as HTMLTextAreaElement).value = "";
      (document.getElementById("status") as HTMLSelectElement).value = "";

      createBtn.textContent = "Crear";
    });

    // CLOSE MODAL
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    // BOTÓN PRINCIPAL (CREAR o EDITAR)
    createBtn.addEventListener("click", () => {

      const titleEl = document.getElementById("title") as HTMLInputElement;
      const descriptionEl = document.getElementById("description") as HTMLTextAreaElement;
      const statusEl = document.getElementById("status") as HTMLSelectElement;

      const pollData: any = {
        title: titleEl.value,
        description: descriptionEl.value,
        status: statusEl.value,
      };

      // 🔵 MODO EDITAR
      if (this.editingPollId !== null) {
        this.pollsService.updatePoll(this.editingPollId, pollData).subscribe({
          next: () => {
            alert("Encuesta actualizada correctamente");
            modal.style.display = "none";
            this.editingPollId = null;
            createBtn.textContent = "Crear";
            this.loadPolls();
          },
          error: () => alert("Error al actualizar encuesta")
        });
        return;
      }

      // 🟢 MODO CREAR
      pollData.creatorId = Number(localStorage.getItem('userId'));

      this.pollsService.createPoll(pollData).subscribe({
        next: () => {
          alert("Encuesta creada correctamente");
          modal.style.display = "none";
          this.loadPolls();
        },
        error: () => alert("Error al crear encuesta")
      });
    });

  }

  // 🔥 FUNCIÓN PARA ABRIR MODAL EN MODO EDITAR
  openEditModal(poll: any) {
    const modal = document.getElementById("modal")!;
    modal.style.display = "flex";

    this.editingPollId = poll.id;

    (document.getElementById("title") as HTMLInputElement).value = poll.title;
    (document.getElementById("description") as HTMLTextAreaElement).value = poll.description;
    (document.getElementById("status") as HTMLSelectElement).value = poll.status;

    const createBtn = document.getElementById("createBtn")!;
    createBtn.textContent = "Actualizar";
  }

}
