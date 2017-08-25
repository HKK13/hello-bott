
class Message {

  constructor(slackMessage) {
    this.messageObject = slackMessage;
    this.text = slackMessage.text;
    this.command = '';
    this.user = slackMessage.user;
  }

  reply(text) {
    this.send(text, this.messageObject.channel);
  }

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

    return {command, text};
  }

  throw(error) {
    try {
      let returnText = '';
      if (error) {
        if (error.name == 'TypeError')
          returnText = `<@${this.user}>, command '${this.command}' does not exist.`;
        else if (error.name == 'LeakableBotError')
          returnText = `<@${this.user}>, ${error.message}`;
        else
          returnText = 'Problems captain!';
      } else {
        returnText = text;
      }

      this.send(`<@${this.user}>,` + returnText.toLowerCase(), this.messageObject.channel);
    } catch (err) {
      console.error(err);
    }
  }

}


module.exports = Message;
