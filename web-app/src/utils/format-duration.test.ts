import { expect } from '@open-wc/testing'
import { formatDuration } from './format-duration.js'

describe('formatDuration', () => {
  it('returns 0s for zero', () => {
    expect(formatDuration(0)).to.equal('0s')
  })

  it('returns 0s for negative values', () => {
    expect(formatDuration(-5)).to.equal('0s')
  })

  it('formats seconds only', () => {
    expect(formatDuration(1)).to.equal('1s')
    expect(formatDuration(30)).to.equal('30s')
    expect(formatDuration(59)).to.equal('59s')
  })

  it('formats minutes only (no remaining seconds)', () => {
    expect(formatDuration(60)).to.equal('1m')
    expect(formatDuration(120)).to.equal('2m')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).to.equal('1m 30s')
    expect(formatDuration(125)).to.equal('2m 5s')
  })

  it('formats hours only', () => {
    expect(formatDuration(3600)).to.equal('1h')
    expect(formatDuration(7200)).to.equal('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(3660)).to.equal('1h 1m')
    expect(formatDuration(5400)).to.equal('1h 30m')
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3661)).to.equal('1h 1m 1s')
    expect(formatDuration(7384)).to.equal('2h 3m 4s')
  })

  it('suppresses zero components in the middle', () => {
    expect(formatDuration(3601)).to.equal('1h 1s')
  })
})
