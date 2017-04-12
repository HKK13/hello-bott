'use strict';

class Tracer {
  constructor() {
    this.types = Object.freeze({
      'start': 'start',
      'break': 'break',
      'continue': 'continue',
      'end': 'end'
    });
    this.dummy = new Map();
  }

  start(user, description) {
    let today = (new Date()).toISOString();
    if (this.dummy.has(user)) {
      if (!this.dummy.get(user).has(today)) {
        this.dummy.get(user).set(today, {description: description});
        return true;
      }

      return false;
    } else {
      this.dummy.set(user, new Map());
      this.dummy.get(user).set(today, {description: description});
      return true;
    }
  }


}

module.exports = new Tracer();
