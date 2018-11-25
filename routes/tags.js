'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

router.get('/', (req, res, next) => {
  knex('tags')
    .select('id', 'name')
    .then(results => res.json(results))
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('tags')
    .select('id', 'name')
    .where({id})
    .then(([result]) => {
      if (result) res.json(result);
      else next();
    })
    .catch(err => next(err));
});

router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const updateObj = {};
  const updateableFields = ['name'];
  updateableFields.forEach(field => {if (field in req.body) updateObj[field] = req.body[field];});
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .returning('id', 'name')
    .where({id})
    .update(updateObj)
    .then(([result]) => {
      if (result) res.json(result);
      else next();
    })
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const name = req.body.name;
  const newItem = {name};
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 404;
    return next(err);
  }

  knex('tags')
    .returning('id', 'name')
    .insert(newItem)
    .then(([result]) => res.location(`${req.originalUrl}/${result.id}`).status(201).json(result))
    .catch(err => next(err));
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('tags')
    .where({id})
    .del()
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;