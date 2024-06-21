import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('schedulr-task')
export class SchedulrTask extends LitElement {
  override render() {
    return html`
      <input type="checkbox" />
      <task-title>2021-09-01 10:00:00: Task 1</task-title>
      <task-note>Task 1 note</task-note>
    `
  }
}
