import { expect, fixture, html } from '@open-wc/testing'
import { SchedulrApp } from './app.js'


describe('schedulr-app', () => {
  let app: SchedulrApp

  beforeEach(async () => {
    app = await fixture(html`
      <schedulr-app></schedulr-app>
    `)
  })

  it('renders', () => {
    expect(app).to.be.instanceOf(SchedulrApp)
  })

  it('should have schedulr-header', () => {
    const header = app.shadowRoot!.querySelector('schedulr-header')
    expect(header).to.exist
  })

  it('should have schedulr-schedule-list', () => {
    const scheduleList = app.shadowRoot!.querySelector('schedulr-schedule-list')
    expect(scheduleList).to.exist
  })
})
