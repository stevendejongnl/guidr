import { LitElement, html } from "lit"
import { customElement } from "lit/decorators.js"

@customElement('schedulr-app')
export class SchedulrApp extends LitElement {
  override render() {
    return html`<schedulr-header></schedulr-header>`
  }
}
