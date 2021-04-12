// In webview.js

// There are many ways to listen to click events, you can even use
// something like jQuery or React. This is how it can be done using
// plain JavaScript:
document.addEventListener('click', event => {
	const element = event.target;
	// If a TOC header has been clicked:
	if (element.className === 'toc-item-link') {
		// Get the slug and display it:
		// const slug = element.dataset.slug;
		// console.info('Clicked header slug: ' + slug);

        // Post the message and slug info back to the plugin:
		webviewApi.postMessage({
			name: 'scrollToHash',
			hash: element.dataset.slug,
		});

	}
});