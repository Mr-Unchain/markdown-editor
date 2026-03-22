import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleRovingTabindex, initRovingTabindex } from '../keyboard-navigation'

describe('initRovingTabindex', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <button class="btn">A</button>
      <button class="btn">B</button>
      <button class="btn">C</button>
    `
    document.body.appendChild(container)
  })

  it('最初の要素をtabindex=0、残りを-1に設定する', () => {
    initRovingTabindex(container, '.btn')

    const buttons = container.querySelectorAll('.btn')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    expect(buttons[1].getAttribute('tabindex')).toBe('-1')
    expect(buttons[2].getAttribute('tabindex')).toBe('-1')
  })
})

describe('handleRovingTabindex', () => {
  let container: HTMLElement
  let buttons: NodeListOf<HTMLElement>

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <button class="btn">A</button>
      <button class="btn">B</button>
      <button class="btn">C</button>
    `
    document.body.appendChild(container)
    buttons = container.querySelectorAll('.btn')
    initRovingTabindex(container, '.btn')
    ;(buttons[0] as HTMLElement).focus()
  })

  it('ArrowRightで次の要素にフォーカスする', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    vi.spyOn(event, 'preventDefault')
    handleRovingTabindex(container, event, { selector: '.btn' })

    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    expect(buttons[0].getAttribute('tabindex')).toBe('-1')
  })

  it('末尾でArrowRightすると先頭にループする', () => {
    ;(buttons[2] as HTMLElement).focus()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    handleRovingTabindex(container, event, { selector: '.btn' })

    expect(buttons[0].getAttribute('tabindex')).toBe('0')
  })

  it('loop=falseの場合、末尾で止まる', () => {
    ;(buttons[2] as HTMLElement).focus()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    handleRovingTabindex(container, event, { selector: '.btn', loop: false })

    expect(buttons[2].getAttribute('tabindex')).toBe('0')
  })

  it('無関係なキーは無視する', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    vi.spyOn(event, 'preventDefault')
    handleRovingTabindex(container, event, { selector: '.btn' })

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
