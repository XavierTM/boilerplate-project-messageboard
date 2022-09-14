const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Thread, Reply } = require('../routes/db');
const casual = require('casual');
const { v4 } = require('uuid');
const { hash } = require('bcrypt');

chai.use(chaiHttp);

suite('Functional Tests', function() {

   test("Creating a new thread: POST request to /api/threads/{board}", function(done) {

      chai
         .request(server)
         .post('/api/threads/new_board')
         .send({
            text: 'First Thread',
            delete_password: 'password'
         })
         .end(function(err, res) {

            assert.equal(res.status, 200);
            done();

         });
   });


   test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function(done) {
      
      chai
         .request(server)
         .get('/api/threads/new_board')
         .end(function(err, res) {

            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isArray(res.body[0].replies);

            done();

         });
   });

   
   test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", async function() {
      
      const thread = await Thread.findOne({ where: { board: 'new_board' }});

      const { _id } = thread;
      const res = await chai
         .request(server)
         .delete('/api/threads/new_board')
         .send({
            thread_id: _id,
            delete_password: 'not_password'
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "incorrect password");

   });


   test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", async function() {
      
      const thread = await Thread.findOne({ where: { board: 'new_board' }});

      const { _id } = thread;
      const res = await chai
         .request(server)
         .delete('/api/threads/new_board')
         .send({
            thread_id: _id,
            delete_password: 'password'
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "success");
      
   });

   test("Reporting a thread: PUT request to /api/threads/{board}", async function() {
      
      let thread = await Thread.create({ 
         board: 'new_board', 
         text: casual.text, 
         delete_password: casual.password 
      });

      const { _id } = thread;

      const res = await chai
         .request(server)
         .put('/api/threads/new_board')
         .send({
            report_id: _id,
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "reported");

      thread = await Thread.findOne({ where: { _id }});
      assert.equal(thread.reported, true);
      
   });

   test("Creating a new reply: POST request to /api/replies/{board}", async function() {
      
      const thread = await Thread.findOne({ where: { board: 'new_board' }});
      const { _id } = thread;

      const replyCountBefore = await Reply.count({ where: { thread: _id }});


      const res = await chai
         .request(server)
         .post('/api/replies/new_board')
         .send({
            thread_id: _id,
            delete_password: 'password',
            text: casual.text
         });

      assert.equal(res.status, 200);

      
      const replyCountAfter = await Reply.count({ where: { thread: _id }});
      assert.equal(replyCountBefore, replyCountAfter - 1);
      
   });


   test("Viewing a single thread with all replies: GET request to /api/replies/{board}", async function() {
      
      const thread = await Thread.findOne({ where: { board: 'new_board' }});
      const { _id } = thread;

      const replyCount = await Reply.count({ where: { thread: _id }});


      const res = await chai
         .request(server)
         .get(`/api/replies/new_board?thread_id=${_id}`);

      assert.equal(res.status, 200);
      assert.isObject(res.body);
      assert.isArray(res.body.replies);
      assert.equal(res.body.replies.length, replyCount);
     
   });

   test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", async function() {
      
      const reply = await Reply.findOne();
      const { _id } = reply;

      const res = await chai
         .request(server)
         .delete(`/api/replies/new_board`)
         .send({
            reply_id: _id,
            delete_password: v4()
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "incorrect password");
     
   });


   test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", async function() {
      
      const thread = await Thread.findOne();
      const { _id: thread_id } = thread;

      const password = casual.password;

      const reply = await Reply.create({
         thread: thread_id,
         delete_password: await hash(password, 1),
         text: casual.catch_phrase
      });

      const { _id } = reply;

      const res = await chai
         .request(server)
         .delete(`/api/replies/new_board`)
         .send({
            reply_id: _id,
            delete_password: password
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "success");
     
   });


   test("Reporting a thread: PUT request to /api/threads/{board}", async function() {
      
      let reply = await Reply.findOne();

      const { _id } = reply;

      const res = await chai
         .request(server)
         .put('/api/replies/new_board')
         .send({
            reply_id: _id,
         });

      assert.equal(res.status, 200);
      assert.equal(res.text, "reported");

      reply = await Reply.findOne({ where: { _id }});
      assert.equal(reply.reported, true);
      
   });



});
