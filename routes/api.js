'use strict';

const { Thread, Reply } = require("./db");
const bcrypt = require('bcrypt');



module.exports = function (app) {
	
	app.post('/api/threads/:board', async function(req, res) {

		const { text, delete_password } = req.body;
		const { board } = req.params;

		await Thread.create({
			text,
			delete_password: await bcrypt.hash(delete_password, 1),
			board,
		})

		res.send();

	});

	app.get('/api/threads/:board', async function (req, res) {

		const { board } = req.params;

		let threads = await Thread.findAll({
			where: { board },
			limit: 10,
			attributes: [ '_id', 'created_on', 'text', 'bumped_on' ],
			include: {
				model: Reply,
				attributes: [ '_id', 'created_on', 'text' ],
				order: [
					[ 'created_on', 'DESC' ]
				],
				limit: 3
			},
			order: [
				[ 'bumped_on', 'DESC' ] 
			]
		});
		
		threads = threads.map(thread => {

			thread = thread.dataValues;

			thread.replies = thread.Replies.map(reply => reply.dataValues);
			delete thread.Replies;

			return thread;
		})

		res.send(threads);

	});

	app.delete('/api/threads/:board', async function (req, res) {

		const { board } = req.params;
		const { delete_password, thread_id: _id } = req.body;

		const thread = await Thread.findOne({ where: { board, _id }});
		
		if (!thread)
			return res.send("success");

		// validate password
		const isValid = await bcrypt.compare(delete_password, thread.delete_password);
		if (!isValid) {
			return res.send("incorrect password");
		}

		await thread.destroy();

		res.send("success");

	});

	app.put('/api/threads/:board', async function (req, res) {

		const { report_id: _id } = req.body;

		await Thread.update({ reported: true }, {
			where: { _id }
		});

		res.send("reported");

	});
		
	app.post('/api/replies/:board', async function(req, res) {

		const { text, delete_password, thread_id: thread } = req.body;
		const { board } = req.params;

		const reply = await Reply.create({
			text,
			delete_password: await bcrypt.hash(delete_password, 1),
			board,
			thread,
		});

		await Thread.update({
			bumped_on: reply.created_on,
		}, { where: { _id: thread }});

		res.send();

	});

	app.get('/api/replies/:board', async function(req, res) {

		const { thread_id: _id } = req.query;
		const { board } = req.params;

		let thread = await Thread.findOne({
			where: { board, _id },
			attributes: [ '_id', 'created_on', 'text', 'bumped_on' ],
			include: {
				model: Reply,
				attributes: [ '_id', 'created_on', 'text' ],
			}
		});

		if (!thread)
			return res.sendStatus(404);

		thread = thread.dataValues;
		thread.replies = thread.Replies.map(reply => reply.dataValues);
		delete thread.Replies;

		res.send(thread)

	});

	app.delete('/api/replies/:board', async function (req, res) {

		const { delete_password, reply_id: _id } = req.body;

		const reply = await Reply.findOne({ where: { _id }});
		
		if (!reply)
			return res.send("success");

		// validate password
		const isValid = await bcrypt.compare(delete_password, reply.delete_password);
		if (!isValid)
			return res.send("incorrect password");

		await reply.update({ text: '[deleted]' });

		res.send("success");

	});

	app.put('/api/replies/:board', async function (req, res) {

		const { reply_id: _id } = req.body;

		await Reply.update({ reported: true }, {
			where: { _id }
		});

		res.send("reported");
		
	});

};
