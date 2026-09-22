const express = require('express');
const { createTingProcedureHandlers } = require('@librechat/api');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { hasCapability } = require('~/server/middleware/roles/capabilities');
const { getAppConfig } = require('~/server/services/Config');
const db = require('~/models');

const router = express.Router();
const handlers = createTingProcedureHandlers({
  getAppConfig,
  hasCapability,
  getTingProcedure: db.getTingProcedure,
  listTingProcedures: db.listTingProcedures,
  createTingProcedure: db.createTingProcedure,
  updateTingProcedure: db.updateTingProcedure,
  listPublishedTingProcedures: db.listPublishedTingProcedures,
  getPublishedTingProcedure: db.getPublishedTingProcedure,
});

router.use(requireJwtAuth);
router.get('/capabilities', handlers.capabilities);
router.get('/catalog', handlers.catalog);
router.get('/procedures', handlers.list);
router.get('/procedures/:procedureId', handlers.get);
router.post('/procedures', handlers.create);
router.put('/procedures/:procedureId', handlers.update);

module.exports = router;
