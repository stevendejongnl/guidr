import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('schedulr-task')
export class SchedulrTask extends LitElement {
  override render() {
    return html`
      <input type="checkbox" />
      <schedulr-task-title>2021-09-01 10:00:00: Task 1</schedulr-task-title>
      <schedulr-task-note>Task 1 note</schedulr-task-note>
    `
  }
}

@customElement('schedulr-task-title')
export class SchedulrTaskTitle extends LitElement {
  override render() {
    return html`<h2><slot></slot></h2>`
  }
}

@customElement('schedulr-task-note')
export class SchedulrTaskNote extends LitElement {
  override render() {
    return html`<p><slot></slot></p>`
  }
}
