// There are many ways to listen to click events, you can even use
// something like jQuery or React. This is how it can be done using
// plain JavaScript:

window.onload = async function() {
    const response = await webviewApi.postMessage({name: 'fetchData'});
}
// Load on click generate cards
document.addEventListener('click', async event => {

    console.info("ndwnd");
    console.log("DWND");
    const response = await webviewApi.postMessage({name: 'fetchData'});
    var d = document.getElementsByClassName('container');
    d.innerHtml = "nekaj nekaj sedaj dobim sm neki";

});