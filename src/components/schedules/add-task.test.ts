import { expect, fixture, html } from '@open-wc/testing'
import { SchedulrAddTask } from './add-task.js'


describe('schedulr-add-task', () => {
  let addTask: SchedulrAddTask

  beforeEach(async () => {
    addTask = await fixture(html`
      <schedulr-add-task></schedulr-add-task>
    `)
  })

  it('renders', () => {
    expect(addTask).to.be.instanceOf(SchedulrAddTask)
  })
})
