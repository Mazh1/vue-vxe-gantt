import mitt from 'mitt'

class EventBus {
  constructor() {
    this.emitter = mitt()
    this.events = {
      WIN_RESIZE: 'win:resize',
    }
  }

  on(event, handler) {
    this.emitter.on(event, handler)
  }

  emit(event, data) {
    this.emitter.emit(event, data)
  }

}
export const eventBus = new EventBus()
