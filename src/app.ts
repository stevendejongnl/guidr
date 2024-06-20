import { LitElement, html } from "lit"
import { customElement, state } from "lit/decorators.js"

@customElement('schedulr-app')
export class SchedulrApp extends LitElement {

  @state()
  tasks = [
    { date: '2022-01-01', time: '09:00', completed: false },
    { date: '2022-01-02', time: '10:00', completed: true },
  ]

  override render() {
    return html`
      <schedulr-header></schedulr-header>
      <schedulr-schedule .tasks=${this.tasks}></schedulr-schedule>
    `
  }
}
