import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Polls } from '../services/polls';
import { NgFor, CommonModule, NgIf } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { PollChartComponent } from '../components/poll-chart/poll-chart.component';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, NgFor, CommonModule, NgIf, PollChartComponent]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  polls: any[] = [];
  editingPollId: number | null = null;
  stats: { total: number; open: number; closed: number } | null = null;

  constructor(private pollsService: Polls) {}

  selectedPollId: number | null = null;
  questions: any[] = [];
  selectedQuestionId: number | null = null;

  ngOnInit() {
    this.loadPolls();
    this.loadPollStats();
  }

  loadPollStats() {
    this.pollsService.getStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => {
        console.error('Error al cargar estadisticas de encuestas:', err);
        this.stats = null;
      }
    });
  }

  loadPolls() {
    this.pollsService.getAllPolls().subscribe({
      next: (res) => {
        this.polls = res;
        // seleccionar la primera encuesta por defecto si no hay ninguna seleccionada
        if (this.polls && this.polls.length > 0 && this.selectedPollId === null) {
          this.selectedPollId = this.polls[0].id;
          // load questions for the initially selected poll
          this.loadQuestionsForSelectedPoll(this.selectedPollId);
        }
      },
      error: (err) => console.error("Error al cargar encuestas:", err)
    });
  }

  loadQuestionsForSelectedPoll(pollId: number | null) {
    if (pollId == null) {
      this.questions = [];
      this.selectedQuestionId = null;
      return;
    }
    this.pollsService.getPollById(pollId).subscribe({
      next: (p) => {
        this.questions = p?.questions && p.questions.length ? p.questions : [];
        if (this.questions.length > 0) {
          this.selectedQuestionId = this.questions[0].id;
        } else {
          // try fetching questions endpoint
          this.pollsService.getPollQuestions(pollId).subscribe({
            next: (qs) => {
              this.questions = qs || [];
              if (this.questions.length > 0) this.selectedQuestionId = this.questions[0].id;
            },
            error: () => { this.questions = []; }
          });
        }
      },
      error: () => {
        this.questions = [];
        this.selectedQuestionId = null;
      }
    });
  }

  // Reload polls from server and ensure a specific poll is present in the local list
  reloadPollsAndEnsure(updated?: any) {
    this.pollsService.getAllPolls().subscribe({
      next: (res) => {
        this.polls = res || [];
        // seleccionar la primera encuesta por defecto si no hay ninguna seleccionada
        if (this.polls && this.polls.length > 0 && this.selectedPollId === null) {
          this.selectedPollId = this.polls[0].id;
        }

        // Si el backend filtró la encuesta (p. ej. la marcó closed y la lista no la incluye), la reañadimos localmente
        if (updated && updated.id && !this.polls.find(p => p.id === updated.id)) {
          this.polls.unshift(updated);
        }
      },
      error: (err) => {
        console.error("Error al recargar encuestas:", err);
        // En caso de error, mantenemos la lista local como estaba
        if (updated && updated.id && !this.polls.find(p => p.id === updated.id)) {
          this.polls.unshift(updated);
        }
      }
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
          next: (updated) => {
            // Recargamos la lista y nos aseguramos de que la encuesta actualizada permanezca visible
            this.reloadPollsAndEnsure(updated);

            alert("Encuesta actualizada correctamente");
            modal.style.display = "none";
            this.editingPollId = null;
            createBtn.textContent = "Crear";
          },
          error: () => alert("Error al actualizar encuesta")
        });
        return;
      }

      // 🟢 MODO CREAR
      pollData.creatorId = Number(localStorage.getItem('userId'));

      this.pollsService.createPoll(pollData).subscribe({
        next: (created) => {
          // Asegurar que la encuesta creada se muestre aunque el backend no la incluya en la lista (p. ej. si está 'closed')
          this.reloadPollsAndEnsure(created);

          alert("Encuesta creada correctamente");
          modal.style.display = "none";
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

  showResults(pollId: number) {
    this.selectedPollId = pollId;
    // scroll to chart area (if needed)
    setTimeout(() => {
      const el = document.getElementById('resultsArea');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

}
