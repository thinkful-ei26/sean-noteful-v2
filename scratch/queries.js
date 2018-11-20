'use strict';

const knex = require('../knex');

// Get All Notes accepts a searchTerm and finds notes with titles which contain the term. It returns an array of objects
let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

// Get Note By Id accepts an ID. It returns the note as an object not an array
let getID = 1000; // hardcoded id, make dynamic later
knex('notes')
  .select('notes.id', 'title', 'content')
  .where({id: getID})
  .then(results => console.log(JSON.stringify(results[0])))
  .catch(err => console.error(err));


// Update Note By Id accepts an ID and an object with the desired updates. It returns the updated note as an object
let updateID = 1000;
let updateObject = {title: 'updated title', content: 'updated content'};
knex('notes')
  .returning(['notes.id', 'title', 'content'])
  .where({id: updateID})
  .update(updateObject)
  .then(results => console.log(JSON.stringify(results[0])))
  .catch(err => console.error(err));

// Create a Note accepts an object with the note properties and inserts it in the DB. It returns the new note (including 
// the new id) as an object
let createObject = {title: 'new title', content: 'new content'};
knex('notes')
  .returning(['notes.id', 'title', 'content'])
  .insert(createObject)
  .then(results => console.log(results[0]))
  .catch(err => console.error(err));

// Delete Note By Id accepts an ID and deletes the note from the DB
let deleteID = 1000;
knex('notes')
  .where({id: deleteID})
  .del()
  .then()
  .catch(err => console.error(err));
