import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';

const uslug = require('uslug');

joplin.plugins.register({
	onStart: async function() {

		// TODO Need to check if deflist is enabled
		const panels = joplin.views.panels;
		const view = await panels.create('tod-panel');

		// Create a toolbar button
		await joplin.commands.register({
			name: 'toggleTOD',
			label: 'Toggle Table of definitions',
			iconName: 'fas fa-scroll',
			execute: async () => {
				const visible = await panels.visible(view);
				panels.show(view, !visible);
			}
		});

		await joplin.views.toolbarButtons.create('todButton', 'toggleTOD', ToolbarButtonLocation.NoteToolbar);

		// Building the panel
		await joplin.views.panels.setHtml(view, 'Loading...');
		await joplin.views.panels.addScript(view, './webview.css');
		await joplin.views.panels.addScript(view, './table-tod.js');	
		
		// Message handler
		panels.onMessage(view, async (message: any) => {
			console.info(message);

			if (message.name == "fetchData") {
				joplin.views.panels.setHtml(view, "Loud and clear!");
				return await fetchDefCards();
			} else if (message.name == "tokens") {
				console.info(message.token);
				console.info(message.tokens);
				return;
			}

		});

		// Structure the panel
		await panels.setHtml(view, `
			<div class="container">Click to generate cards</div>
		`);

		/**
			<div class="container">
				// push method simple
				<div class="card">
					<div class="card-title"></div>
					<div class="card-body"></div>
				</div>
			</div> 
		*/


		// Here we register new Markdown plugin
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'table-tod',
			'./table-tod-plugin.js'
		);

		await joplin.contentScripts.onMessage('table-tod', (message: any) => {
			console.info(message);
		});

		/* 
		await joplin.contentScripts.onMessage('testing', (message: any) => {
			console.info(message.query);
			console.info(message.type)
			console.log("got it!")
			return message + '+response';
		});
		
		await joplin.views.panels.onMessage(panel, (message) => {
			if (message.name === 'scrollToHash') {
				// As the name says, the scrollToHash command makes the note scroll
				// to the provided hash.
				joplin.commands.execute('scrollToHash', message.hash)
			}
		});*/

		console.info('Test plugin started!');
		async function updateToDView() {
			
			// Get the current note in the workspace
			const cards = await fetchDefCards();
			slugs = {};

			// Keep in mind that it can be `null` if nothing is currently selected!
			if (cards) {
								
				console.info(cards);
				console.info('Note content has changed!');

			} else {
				console.info('No note is selected.');
			}

		}

		// Scans and fetches all the definitions made
		async function fetchDefCards() {

			const { body } = await joplin.workspace.selectedNote();

			if (!body) return body;

			var cards = body.match(/(.+)\n:\[((?:.|\n)*?)\]:/gi);
			
			const allCards = [];
			for (var card in cards) {
				allCards.push(cards[card].match(/(?<title>.+)\n:\[(?<body>(?:.|\n)*?)\]:/i).groups);
			}

			return allCards;
		}

		// This event will be triggered when the user selects a different note
		await joplin.workspace.onNoteSelectionChange(() => {
			updateToDView();
		});

		// This event will be triggered when the content of the note changes
		// as you also want to update the TOC in this case.
		await joplin.workspace.onNoteChange(() => {
			updateToDView();
		});

		// Also update the TOC when the plugin starts
		updateToDView();
	},
});
/*
function detectTOD(noteBody:string) {

	noteBody = noteBody.replace(/\${\s*tod\s*}/g,'HAHHAHA');
	console.info(noteBody);
}

function buildHtml(cards: Array<Object>) : string {



	return "";
}
*/

let slugs = {};

function headerSlug(headerText) {
	const s = uslug(headerText);
	let num = slugs[s] ? slugs[s] : 1;
	const output = [s];
	if (num > 1) output.push(num);
	slugs[s] = num + 1;
	return output.join('-');
}

function escapeHtml(unsafe:string) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}