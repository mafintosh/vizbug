const ENABLED = !!process.env.VIZBUG

module.exports = ENABLED ? enabled() : disabled
module.exports.enabled = ENABLED

function disabled () {
  return noop
}

function noop () {}

function enabled () {
  const OUTPUT = process.env.VIZBUG === 'true' ? 'stdout': process.env.VIZBUG
  const DEBUG_STATE = global.__DEBUG_STATE__ || (global.__DEBUG_STATE__ = { context: 0, id: 0, trace: 0, traces: new WeakMap(), output: createOutput() })
  const stackback = require('stackback')
  const os = require('os')

  return debug

  function debug (topic) {
    if (!topic) topic = parentFunctionName()

    const context = ++DEBUG_STATE.context

    return function log (message, ...trace) {
      const traces = [ ...trace ]
      const stacks = stackback(new Error())
      const top = stacks[Math.min(stacks.length - 1, 1)]
      const filename = top.getFileName()
      const line = top.getLineNumber()

      for (const t of traces) {
        if (!DEBUG_STATE.traces.has(t)) {
          try {
            DEBUG_STATE.traces.set(t, ++DEBUG_STATE.trace)
          } catch (_) {} // ignore value types
        }
      }

      const m = {
        topic,
        message: format(message, traces),
        filename,
        line,
        id: ++DEBUG_STATE.id,
        context,
        tracing: traces.map(traceId),
        date: new Date()
      }

      DEBUG_STATE.output.write(JSON.stringify(m) + os.EOL)
    }
  }

  function createOutput () {
    return OUTPUT === 'stdout'
      ? process.stdout
      : OUTPUT === 'stderr'
        ? process.stderr
        : require('fs').createWriteStream(OUTPUT)
  }

  function traceId (t) {
    return DEBUG_STATE.traces.get(t)
  }

  function parentFunctionName () {
    const stacks = stackback(new Error())
    const top = stacks[Math.min(stacks.length - 1, 2)]
    return top ? top.getFunctionName() : null
  }

  function format (m, traces) {
    let i = 0

    return m.replace(/%[odsib]/g, function (match) {
      if (i >= traces.length) return match

      const t = traces[i++]
      switch (match) {
        case '%b':
          return formatBuffer(t)
        case '%o':
          return JSON.stringify(t)
        case '%d':
        case '%i':
        case '%s':
          return '' + t
      }

      return match
    })
  }

  function formatBuffer (buf) {
    if (!buf) return 'null'
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
    if (buf.length < 10) return '<0x' + buf.toString('hex') + '>'
    return '<0x' + buf.slice(0, 4).toString('hex') + '... (' + buf.length + ' b)>'
  }
}
