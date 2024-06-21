import { expect, fixture, html } from '@open-wc/testing'
import { SchedulrHeader } from './header.js'


describe('schedulr-header', () => {
  let header: SchedulrHeader

  beforeEach(async () => {
    header = await fixture(html`
      <schedulr-header></schedulr-header>
    `)
  })

  it('renders', () => {
    expect(header).to.be.instanceOf(SchedulrHeader)
  })

  it('should show a heading text', () => {
    expect(header.shadowRoot?.textContent).to.be.equal('Schedulr')
  })
})
