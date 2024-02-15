let ws;
let extensionId;
let checkElementInterval;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "SendMessageToWebSocket") {
    sendMessageToWebSocket(request.data);
  }

  if (request.message.includes("ReadyToConnect-")) {
    establishWebSocketConnection(request.message.split("ReadyToConnect-")[1]);
  }

  if (request.message.includes("awaitElement-")) {
    startCheckingElement(request.message.split("awaitElement-")[1]);
  }
});

function establishWebSocketConnection(port) {
  const wsUrl = `ws://localhost:${port}`;
  extensionId = generateRandomId();
  ws = new WebSocket(wsUrl);

  ws.addEventListener('open', handleWebSocketOpen);
  ws.addEventListener('message', handleWebSocketMessage);
  ws.addEventListener('error', handleWebSocketError);
  ws.addEventListener('close', handleWebSocketClose);
}

function handleWebSocketOpen(event) {
  console.log('WebSocket connection opened:', event);
  ws.send(`Extension connected with ID: ${extensionId}`);
}

function handleWebSocketMessage(event) {
  console.log('Message from WebSocket server:', event.data);
  handleWebSocketCommand(event.data);
}

function handleWebSocketError(event) {
  console.error('WebSocket error:', event);
}

function handleWebSocketClose(event) {
  console.log('WebSocket connection closed:', event);
}

function sendMessageToWebSocket(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(data);
    console.log('Message sent to WebSocket:', data);
  } else {
    console.error('WebSocket is not open or initialized.');
  }
}

function startCheckingElement(elementSelector) {
  clearInterval(checkElementInterval);

  checkElementInterval = setInterval(function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, { message: "CheckForElement", elementSelector }, function(response) {
          console.log(response);
          if (response && response.elementFound) {
            ws.send(`element found-${elementSelector}`);
            console.log("Element found!");
            clearInterval(checkElementInterval);
          } else {
            console.log("Element not found yet.");
          }
        });
      });
    });
  }, 1000);
}

function evalScript(expression, tabId) {
  chrome.tabs.sendMessage(tabId, { message: "eval", data: expression }, function(response) {
    if (response && response.evalResult) {
      // Send the evaluation result back to the WebSocket server
      ws.send(`evalResult-${response.evalResult}`);
    }
  });
}

function handleWebSocketCommand(command) {
  if (command.split("-")[0] === "goto") {
    navigateToURL(command.split("-")[1]);
  }

  if (command.includes("awaitElement-")) {
    const elementSelector = command.split("awaitElement-")[1];
    startCheckingElement(elementSelector);
  }

  if (command.includes("eval-")) {
    const expression = command.split("eval-")[1];
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        evalScript(expression, tab.id);
      });
    });
  }

  // Add more commands as needed
}

function navigateToURL(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tabId = tabs[0].id;
    chrome.tabs.update(tabId, { url: url });
  });
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 10);
}
