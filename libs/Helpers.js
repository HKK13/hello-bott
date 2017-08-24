'use strict';

class Helpers {

  static extractCommand(message) {
    // Get first word as command, pass whole if single word.
    let command = '_' + (message.text.substr(0, message.text.indexOf(' ')) || message.text)
        .toLowerCase();
    let text = '';

    // Remove command before dispatching remaining text.
    if (message.text.indexOf(' ') != -1) {
      text = message.text.substr(message.text.indexOf(' ') + 1);
    }

    return {command, text};
  }

}

module.exports = Helpers;
