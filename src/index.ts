import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
	onStart: async function() {

		// Create a spoiler block command
		await joplin.commands.register({
			name: 'insert_spoiler_block',
			label: 'Spoiler block',
			iconName: 'fas fa-angle-right',
			execute: async () => {
				await joplin.commands.execute('insertText',':[\nTitle...\n\nBody...\n\n]:');
			}
		});

		// Create a spoiler block toolbar button
		await joplin.views.toolbarButtons.create('insert_spoiler_block', 'insert_spoiler_block', ToolbarButtonLocation.EditorToolbar);
		
		// Create a spoiler block command shortcut
		await joplin.views.menus.create('spoiler_block', 'Insert spoiler block', [
			{
				commandName: 'insert_spoiler_block',
				accelerator: 'Ctrl+Alt+P'
			}
		]);

		// Create a inline spoiler command
		await joplin.commands.register({
			name: 'insert_inline_spoiler',
			label: 'Spoiler',
			iconName: 'fas fa-low-vision',
			execute: async () => {
				await joplin.commands.execute('insertText','%%spoiler%%');
			}
		});

		// Create a inline spoiler toolbar button
		await joplin.views.toolbarButtons.create('insert_inline_spoiler', 'insert_inline_spoiler', ToolbarButtonLocation.EditorToolbar);

		// Create a inline spoiler command shortcut
		await joplin.views.menus.create('inline_spoiler', 'Insert spoiler', [
			{
				commandName: 'insert_inline_spoiler',
				accelerator: 'Ctrl+Alt+O'
			}
		]);

		// Here we register new Markdown plugin
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			'Spoilers',
			'./spoilers.js'
		);

	},
});