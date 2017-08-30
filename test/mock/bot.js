const EventEmitter = require('events').EventEmitter;


class Bot extends EventEmitter {

  constructor() {
    super();
    this.owner = {id: 'U4GQ53YG7'};
  }

  emitMessage(message) {
    this.emit('message', message);
  }

}


module.exports = Bot;
