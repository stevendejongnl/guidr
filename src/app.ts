import { LitElement, html } from "lit"
import { customElement, state } from "lit/decorators.js"

@customElement('schedulr-app')
export class SchedulrApp extends LitElement {

  @state()
  tasks = [
    { date: '2022-01-01', time: '09:00', title: 'First task', note: 'Some random note', completed: false },
    { date: '2022-01-02', time: '10:00', title: 'Second task', note: 'Another random note', completed: true },
  ]

  override render() {
    return html`
      <schedulr-header></schedulr-header>
      <schedulr-schedule-list></schedulr-schedule-list>
      <schedulr-schedule .tasks=${this.tasks}></schedulr-schedule>
    `
  }
}
