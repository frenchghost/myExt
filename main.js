chrome.runtime.sendMessage({ message: "SendMessageToWebSocket", data: `Loaded: ${window.location.href}` });

// Initial check when the content script is injected
if (window.location.href.includes("google.com/")) {
    chrome.runtime.sendMessage({
        message: `ReadyToConnect-${window.location.href.split("google.com/")[1]}`
    });
}
if (window.location.href.includes("google.com/")) {
    chrome.runtime.sendMessage({
        message: `ReadyToConnect-${window.location.href.split("google.com/")[1]}`
    });
}

if (window.location.href === "https://www.nike.com/") {
    chrome.runtime.sendMessage({ message: "SendMessageToWebSocket", data: "Nike Home Page Loaded" });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "CheckForElement") {
        const elementSelector = request.elementSelector;
    const element = document.querySelector(elementSelector);
    console.log(element)
    if(element) {
        const elementFound = element ? true : false;

        // Send a response to the background script indicating whether the element was found
        sendResponse({ elementFound });   
    }
  }
  if(request.message == "GetElementResults") {
    const elementSelector = request.elementSelector;
    const element = eval(elementSelector)
    if(element) {
    sendResponse({ element });  
    } 
  }
  if(request.message === "eval") {
    eval(request.data)
  }
});
