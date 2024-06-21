import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface Task {
  date: string;
  time: string;
  title: string;
  note: string;
  completed: boolean;
}

@customElement('schedulr-schedule')
export class SchedulrSchedule extends LitElement {
  @property({ type: Array })
  tasks: Task[] = []

  static override styles = css`
    .completed {
      text-decoration: line-through;
    }
  `

  override render() {
    return html`
      <ul>
        ${this.tasks.map(
          (task, index) => html`
            <li class="${task.completed ? 'completed' : ''}">
              <input type="checkbox" ?checked="${task.completed}" @change="${() => this.toggleTask(index)}" />
              ${task.date} ${task.time}: ${task.title}<br>
              ${task.note}
            </li>
          `
        )}
      </ul>
    `
  }

  toggleTask(index: number) {
    // @ts-expect-error joejoe
    this.tasks[index].completed = !this?.tasks?.[index]?.completed
    this.requestUpdate()
  }
}
