import { expect, fixture, html } from '@open-wc/testing'
import { SchedulrTask } from './task.js'


describe('schedulr-task', () => {
  let task: SchedulrTask

  beforeEach(async () => {
    task = await fixture(html`
      <schedulr-task></schedulr-task>
    `)
  })

  it('renders', () => {
    expect(task).to.be.instanceOf(SchedulrTask)
  })

  it('should have a checkbox', async () => {
    const checkbox = task.shadowRoot?.querySelector('input[type="checkbox"]')
    expect(checkbox).to.exist
  })

  it('should have a task-title', async () => {
    const title = task.shadowRoot?.querySelector('schedulr-task-title')
    expect(title?.textContent?.trim()).to.be.equal('2021-09-01 10:00:00: Task 1')
  })

  it('should render task-note', async () => {
    const note = task.shadowRoot?.querySelector('schedulr-task-note')
    expect(note?.textContent?.trim()).to.be.equal('Task 1 note')
  })
})
