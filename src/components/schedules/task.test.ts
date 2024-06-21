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

  it('should render task-title', async () => {
    const title = task.shadowRoot?.querySelector('task-title')
    expect(title).to.be.equal('2021-09-01 10:00:00: Task 1')
  })

  it('should render task-note', async () => {
    const note = task.shadowRoot?.querySelector('task-note')
    expect(note).to.be.equal('Task 1 note')
  })
})
