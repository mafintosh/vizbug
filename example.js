const vizbug = require('./')

class Storage {
  constructor () {
    this.debug = vizbug()
    this.debug('new instance')
  }

  write (data, cb) {
    this.debug('writing data to storage %b', data)
    setImmediate(cb)
  }
}

class DataStructure {
  constructor () {
    this.debug = vizbug()
    this.debug('new instance')
    this.storage = new Storage()
  }

  addData (data, cb) {
    this.debug('adding data to data structure %b', data)
    setImmediate(() =>{
      this.storage.write(data, cb)
    })
  }
}

const d = new DataStructure()

d.addData(Buffer.alloc(1000), function () {
  console.log('data added')
})
