'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex('notes')
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .modify(queryBuilder => {
      if (searchTerm) queryBuilder.where('title', 'like', `%${searchTerm}%`);
      if (folderId) queryBuilder.where('folder_id', folderId);
      if (tagId) queryBuilder.where('tag_id', tagId);
    })
    .orderBy('notes.id')
    .then(results => res.json(hydrateNotes(results)))
    .catch(err => next(err));
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where({'notes.id': id})
    .then(results => {
      if (results) res.json(hydrateNotes(results));
      else next();
    })
    .catch(err => next(err));
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folderId'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      if (field === 'folderId') updateObj['folder_id'] = req.body[field];
      else updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  let noteId;
  // knex('notes')
  //   .returning('id')
  //   .where({'notes.id': id})
  //   .update(updateObj)
  //   .then(results => {
  //     if (results[0]) res.json(results[0]);
  //     else next();
  //   })
  //   .catch(err => next(err));
  knex('notes')
    .returning('id')
    .where({'notes.id': id})
    .update(updateObj)
    .then(([id]) => {
      noteId = id;
      return knex('notes')
        .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      if (result) res.json(result);
      else next();
    })
    .catch(err => next(err));
});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const {title, content, folderId} = req.body;

  const newItem = {title, content, folder_id: folderId};
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  let noteId;

  knex('notes')
    .returning('id')
    .insert(newItem)
    .then(([id]) => {
      noteId = id;
      return knex('notes')
        .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => res.location(`${req.originalUrl}/${result.id}`).status(201).json(result))
    .catch(err => next(err));
});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  // notes.delete(id)
  //   .then(() => {
  //     res.sendStatus(204);
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
  knex('notes')
    .where({id})
    .del()
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;
