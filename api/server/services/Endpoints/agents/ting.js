const OpenAI = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
const { recordTingUsage } = require('@librechat/api');
const TingClient = require('~/app/clients/TingClient');
const db = require('~/models');

const initializeTingNative = async (params) => ({
  client: new TingClient({
    ...params,
    deps: {
      listPublishedTingProcedures: db.listPublishedTingProcedures,
      getMessages: db.getMessages,
      recordUsage: (usage, context) => recordTingUsage(db.spendStructuredTokens, usage, context),
      createModel: (model, onUsage) => ({
        onUsage,
        formatSchema: zodResponseFormat,
        complete: (body, options) =>
          new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 }).chat.completions.create(
            body,
            options,
          ),
      }),
    },
  }),
});

module.exports = { initializeTingNative };
