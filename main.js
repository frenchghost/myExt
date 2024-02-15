chrome.runtime.sendMessage({ message: "SendMessageToWebSocket", data: `Loaded: ${window.location.href}` });

// Initial check when the content script is injected
if (window.location.href.includes("https://google.com/")) {
    chrome.runtime.sendMessage({
        message: `ReadyToConnect-${window.location.href.split("https://google.com/")[1]}`
    });
}

if (window.location.href === "https://www.nike.com/") {
    chrome.runtime.sendMessage({ message: "SendMessageToWebSocket", data: "Nike Home Page Loaded" });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "CheckForElement") {
    let elementFoundLoop = false
        const elementSelector = request.elementSelector;
    const element = document.querySelector(elementSelector);
    if(element) {
        const elementFound = element ? true : false;

        // Send a response to the background script indicating whether the element was found
        sendResponse({ elementFound });   
    }
  }
  if(request.message === "eval") {
    eval(request.data)
  }
});