import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Polls } from '../../services/polls';
import { Answer } from '../../services/answer';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'poll-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="loading">Cargando resultados…</div>
    <div *ngIf="!loading && !poll">No se encontró la encuesta.</div>
    <div *ngIf="errorMessage" class="text-danger">{{ errorMessage }}</div>

    <div *ngIf="poll">
      <div style="width:100%;max-width:800px;margin-top:12px;min-height:260px;">
        <canvas #chartCanvas style="width:100%;height:260px;display:block;"></canvas>
      </div>
    </div>
  `
})
export class PollChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() pollId!: number;
  @Input() selectedQuestionId: number | null = null;
  @Output() selectedQuestionIdChange = new EventEmitter<number | null>();
  @ViewChild('chartCanvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;

  poll: any = null;
  responses: any[] = [];
  chart: Chart | null = null;
  loading = false;
  errorMessage: string | null = null;

  constructor(private polls: Polls, private answer: Answer) {}

  async ngOnInit() {
    await this.loadDataIfNeeded();
  }

  async ngOnChanges(changes: SimpleChanges) {
    // If poll changed, reload data
    if (changes['pollId'] && !changes['pollId'].isFirstChange()) {
      await this.loadDataIfNeeded();
      return;
    }

    // If selectedQuestionId was changed externally, re-render
    if (changes['selectedQuestionId'] && !changes['selectedQuestionId'].isFirstChange()) {
      this.renderChart();
    }
  }

  private async loadDataIfNeeded() {
    if (!this.pollId) return;
    this.loading = true;
    this.errorMessage = null;
    try {
      this.poll = await firstValueFrom(this.polls.getPollById(this.pollId));
      // ensure questions are present; if not, try fetching them
      if (!this.poll?.questions || this.poll.questions.length === 0) {
        try {
          const qs = await firstValueFrom(this.polls.getPollQuestions(this.pollId));
          if (qs && qs.length) this.poll.questions = qs;
        } catch (e) {
          // ignore - questions may not be necessary for some polls
        }
      }
      this.responses = (await firstValueFrom(this.answer.getResponsesByPoll(this.pollId))) as any[];
      console.log('PollChart: loaded poll', this.poll);
      console.log('PollChart: loaded responses count', this.responses?.length ?? 0);
      if (this.poll?.questions && this.poll.questions.length > 0) {
        // If no external selectedQuestionId provided, default to first question and emit
        if (this.selectedQuestionId == null) {
          this.selectedQuestionId = this.poll.questions[0].id;
          this.selectedQuestionIdChange.emit(this.selectedQuestionId);
        }
      }
      setTimeout(() => this.renderChart(), 0);
    } catch (e) {
      const str = String(e);
      console.error('Error loading poll or responses for chart', str);
      this.errorMessage = 'Error cargando datos: ' + str;
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  renderChart() {
    if (!this.poll || !this.selectedQuestionId) return;
    const question = this.poll.questions.find((q: any) => q.id === this.selectedQuestionId);
    if (!question) return;

    const respForQ = this.responses.filter(r => r.questionId === this.selectedQuestionId || (r.payload && r.payload.questionId === this.selectedQuestionId));

    const counts: Record<string, number> = {};
    for (const r of respForQ) {
      const optId = (r.optionId ?? r.payload?.optionId ?? (r.option?.id));
      if (optId == null) continue;
      counts[optId] = (counts[optId] || 0) + 1;
    }

    const options = question.options || [];
    const labels = options.map((o: any) => o.text ?? o.label ?? (`Opción ${o.id}`));
    const data = options.map((o: any) => counts[o.id] || 0);

    // if there's no data at all, try to draw using counts keys or show friendly message
    const total = data.reduce((s: number, v: number) => s + v, 0);
    if (total === 0 && Object.keys(counts).length === 0) {
      this.errorMessage = 'No hay respuestas registradas para esta pregunta.';
      if (this.chart) { this.chart.destroy(); this.chart = null; }
      return;
    }

    if (options.length === 0 && Object.keys(counts).length > 0) {
      const ids = Object.keys(counts);
      ids.sort();
      const lbls = ids.map(id => `Opción ${id}`);
      const dat = ids.map(id => counts[id]);
      return this.drawChart(lbls, dat);
    }

    this.drawChart(labels, data);
  }

  private drawChart(labels: string[], data: number[]) {
    try {
      if (!this.canvas) return;
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (!ctx) return;
      if (this.chart) this.chart.destroy();

      const bg = labels.map((_, i) => this.pickColor(i));

      // ensure canvas has a fixed pixel height for Chart.js to render consistently
      try { this.canvas.nativeElement.height = 260; } catch (e) { /* ignore */ }

      const cfg: ChartConfiguration = {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: bg
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      } as any;

      this.chart = new Chart(ctx, cfg);
      this.errorMessage = null;
    } catch (e) {
      const str = String(e);
      console.error('Error drawing chart', str);
      this.errorMessage = 'Error al dibujar gráfico: ' + str;
    }
  }

  private pickColor(i: number) {
    const palette = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E'];
    return palette[i % palette.length];
  }

}
