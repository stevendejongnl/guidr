import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('schedulr-add-task')
export class SchedulrAddTask extends LitElement {
  override render() {
    return html`Add a task`
  }
}
