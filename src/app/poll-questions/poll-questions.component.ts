import { Component, OnInit } from '@angular/core';
import { Polls } from '../services/polls';
import { NgFor } from '@angular/common';
import { NgClass } from '@angular/common';
@Component({
  selector: 'app-poll-questions',
  templateUrl: './poll-questions.component.html',
  styleUrls: ['./poll-questions.component.scss'],
  imports: [NgFor, NgClass]
})
export class PollQuestionsComponent implements OnInit {

  polls: any[] = [];
  constructor(private pollsService: Polls) { }

  ngOnInit() {
    this.loadPolls();
  }
  loadPolls() {
    this.pollsService.getAllPolls().subscribe({
      next: (res) => this.polls = res,
      error: (err) => console.error("Error al cargar encuestas:", err)
    });
  }
}
