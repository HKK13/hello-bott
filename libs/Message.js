const debug = require('debug')('message');


class Message {

  constructor(slackMessage) {
    this.messageObject = slackMessage;
    this.text = slackMessage.text;
    this.command = '';
    this.user = slackMessage.user;
    debug('Message constructed with', slackMessage);
  }


  /**
   * Replies to the sender's channel.
   * @param text
   */
  reply(text) {
    this.send(text, this.messageObject.channel);
    debug(`Message; ${text} sent.`);
  }


  send(text) {
    throw new Error('Not Implemented, please provide a send method.');
  }


  /**
   * Extracts the first word from the message text
   * and returns them as two object fields.
   * @returns {{command: string, text: string}}
   */
  extractCommand() {
    // Get first word as command, pass whole if single word.
    let command = '_' + (this.messageObject.text.substr(0, this.messageObject.text.indexOf(' '))
      || this.messageObject.text).toLowerCase();
    let text = '';

    // Remove command before dispatching remaining text.
    if (this.messageObject.text.indexOf(' ') != -1) {
      text = this.messageObject.text.substr(this.messageObject.text.indexOf(' ') + 1);
    }

    this.command = command;
    this.text = text;

    debug('Command and Text extracted from the message', {command, text});
    return {command, text};
  }


  /**
   * Notifies the user on an error with a appropriate message.
   * @param {Error} error
   */
  throw(error) {
    try {
      let returnText = '';
      if (error.name == 'TypeError') {
        let command = this.command.substr(1, this.command.length-1);
        returnText = `<@${this.user}>, command '${command}' does not exist.`;
      }
      else if (error.name == 'LeakableBotError')
        returnText = `<@${this.user}>, ${error.message}`;
      else
        returnText = 'Problems captain!';

      this.send(returnText, this.messageObject.channel);
      debug(`Error message; ${returnText} sent to the user.`);
    } catch (err) {
      debug('Error sending the error message.', err);
    }
  }

}


module.exports = Message;
