const {
  initializeTingClient,
  tingSaveOptions,
  tingUserMessage,
  buildTingMessages,
  sendTingCompletion,
  tingConversationTitle,
  tingConversationSaveOptions,
} = require('@librechat/api');
const BaseClient = require('./BaseClient');

class TingClient extends BaseClient {
  constructor(options) {
    super(null, options);
    initializeTingClient(this, options);
  }

  setOptions(options) {
    initializeTingClient(this, options);
  }

  getSaveOptions() {
    return tingSaveOptions(this);
  }

  createUserMessage(options) {
    return tingUserMessage(this.options.req, super.createUserMessage(options));
  }

  getBuildMessagesOptions() {
    return {};
  }

  buildMessages(messages) {
    return buildTingMessages(this, messages);
  }

  sendCompletion() {
    return sendTingCompletion(this);
  }

  saveMessageToDatabase(message, options, user) {
    return super.saveMessageToDatabase(
      message,
      tingConversationSaveOptions(this, options, message),
      user,
    );
  }

  async titleConvo() {
    return tingConversationTitle(this);
  }
}

module.exports = TingClient;
