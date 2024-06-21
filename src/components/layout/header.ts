import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('schedulr-header')
export class SchedulrHeader extends LitElement {
  override render() {
    return html`<h1>Schedulr</h1>`
  }
}
