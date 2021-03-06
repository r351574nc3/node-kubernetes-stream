const EventEmitter = require('events').EventEmitter
const debug = require('debug')('kubernetes-stream:source')

class EventSource extends EventEmitter {
  constructor (list, watch) {
    super()
    this.listFn = list
    this.watchFn = watch
    this.watching = false
  }

  list (options = {}) {
    debug('listing with %j', options)
    this.listFn.call(null, options, (err, list) => {
      if (err) {
        debug('list error %s', String(err))
        return this.emit('error', err)
      }

      debug('%s returned %d items', list.kind, list.items.length)
      this.emit('list', list)
    })
  }

  watch (options = {}) {
    if (this.watching) return

    this.stopFn = this.watchFn.call(null, options, (err, event) => {
      if (err) {
        debug('watch error %s', String(err))
        return this.emit('error', err)
      }

      if (event) {
        debug('watch event %j', {
          type: event.type,
          kind: event.object.kind
        })

        return this.emit('event', event)
      }

      debug('watch end')
      this.watching = false
      this.emit('end')
    })

    this.watching = true
  }

  close () {
    if (this.watching) {
      debug('stop watching')
      this.stopFn.call(null)
      this.watching = false

      debug('closing')
      this.emit('close')
    }
  }
}

module.exports = EventSource
