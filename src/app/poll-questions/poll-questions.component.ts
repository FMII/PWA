import { Component, OnInit } from '@angular/core';
import { Polls } from '../services/polls';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { QuestionService } from '../services/question';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-poll-questions',
  templateUrl: './poll-questions.component.html',
  styleUrls: ['./poll-questions.component.scss'],
  imports: [NgFor, NgClass, FormsModule, NgIf, RouterModule]
})
export class PollQuestionsComponent implements OnInit {

  polls: any[] = [];
  selectedPollId: number | null = null;

  newQuestion = {
    pollId: 0,
    type: 'multiple-choice', // 'multiple-choice', 'single-choice', 'open', 'yes-no'
    title: '',
    options: [{ text: '' }]
  };

  constructor(
    private pollsService: Polls,
    private questionService: QuestionService
  ) { }

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    this.pollsService.getAllPolls().subscribe({
      next: res => this.polls = res,
      error: err => console.error("Error al cargar encuestas:", err)
    });
  }

  openModal(pollId: number) {
    this.selectedPollId = pollId;
    this.resetNewQuestion(pollId);
    document.getElementById("questionModal")!.style.display = "flex";
  }

  closeModal() {
    document.getElementById("questionModal")!.style.display = "none";
  }

  resetNewQuestion(pollId: number) {
    this.newQuestion = {
      pollId,
      type: 'multiple-choice',
      title: '',
      options: [{ text: '' }]
    };
  }

  onTypeChange() {
    if (this.newQuestion.type === 'open') {
      this.newQuestion.options = [];
    } else {
      // multiple-choice, single-choice o yes-no empiezan con una opción vacía
      this.newQuestion.options = [{ text: '' }];
    }
  }

  addOption() {
    this.newQuestion.options.push({ text: '' });
  }

  removeOption(index: number) {
    this.newQuestion.options.splice(index, 1);
  }

  saveQuestion(stayOpen: boolean = true) {
    if (!this.newQuestion.title.trim()) {
      alert("El título de la pregunta no puede estar vacío.");
      return;
    }

    const payload: any = {
      pollId: this.newQuestion.pollId,
      type: this.newQuestion.type === 'yes-no' ? 'single-choice' : this.newQuestion.type,
      title: this.newQuestion.title
    };

    if (this.newQuestion.type !== 'open') {
      const options = this.newQuestion.options
        .filter(opt => opt.text.trim() !== '')
        .map(opt => ({ text: opt.text }));

      if (options.length === 0) {
        alert("Agrega al menos una opción válida.");
        return;
      }

      // Validar que preguntas de opción única o múltiple tengan al menos 2 opciones
      if ((this.newQuestion.type === 'single-choice' || this.newQuestion.type === 'multiple-choice') && options.length < 2) {
        alert("⚠️ Las preguntas de opción única o múltiple deben tener al menos 2 opciones.");
        return;
      }

      payload.options = { create: options };
    }

    this.questionService.createQuestion(payload).subscribe({
      next: () => {
        alert("Pregunta creada correctamente");

        if (stayOpen) {
          // Reiniciar formulario para agregar otra pregunta sin cerrar modal
          this.resetNewQuestion(this.newQuestion.pollId);
        } else {
          this.closeModal();
        }

      },
      error: err => {
        console.error("Error al crear pregunta:", err);
        alert("Ocurrió un error al crear la pregunta");
      }
    });
  }

}
