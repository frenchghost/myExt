let ws;
let extensionId;
let checkElementInterval;
let username 
let password


function callbackFn(details) {
  console.log('Authentication Required for URL:', details.url);
  console.log(details.url.includes("?"))
if(details.url.includes("?")) {
  console.log(details.url.split("?")[1])
  return {
    authCredentials: {
      username: details.url.split("?")[1].split(":")[2],
      password: details.url.split("?")[1].split(":")[3]
    }
  };
} else if(username && password) {
  return {
    authCredentials: {
      username: username,
      password: password
    }
  }
}
}

chrome.webRequest.onAuthRequired.addListener(
  callbackFn,
  { urls: ["<all_urls>"] },
  ['blocking']
);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "SendMessageToWebSocket") {
    sendMessageToWebSocket(request.data);
  }

  if (request.message.includes("ReadyToConnect-")) {
    proxy = request.message.split("ReadyToConnect-")
    if(proxy.includes("?") && !password  && !username) {
      chrome.proxy.settings.set({
        value: {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "http",
              host: proxy.split("?")[1].split(":")[0],
              port: parseInt(proxy.split("?")[1].split(":")[1]) // Replace with your proxy port
            },
            // 154.21.18.113:3128:ftva778:wvyelemkjgmgq
            bypassList: ["<local>"]
          }
        },
        scope: "regular"
      }, function() {
        console.log("Proxy configured");
      });
       username =  proxy.split("?")[1].split(":")[2]
       password = proxy.split("?")[1].split(":")[3]
       navigateToURL("https://google.com/" + request.message.split("ReadyToConnect-")[1])
    }
    console.log("yes")
    establishWebSocketConnection(request.message.split("ReadyToConnect-")[1]);
  }

  if (request.message.includes("awaitElement-")) {
    startCheckingElement(request.message.split("awaitElement-")[1]);
  }

  if(request.message.includes("checkForElement-")) {

  }

});

function establishWebSocketConnection(port) {
  console.log("establishWebSocketConnection")
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
function checkForElement(elementSelector) {
  chrome.tabs.sendMessage(tab.id, { message: "CheckForElement", elementSelector }, function(response) {
    console.log(response);
    if (response && response.elementFound) {
      ws.send(`elementfound-${elementSelector}`);
      console.log("Element found!");
    } else {
      ws.send(`element not found-${elementSelector}`)
    }
  });
}
function GetElementResults(elementSelector) {
  console.log("getting Element")
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, { message: "GetElementResults", elementSelector }, function(response) {
        console.log(response);
        if(response.element) {
        console.log("got Element")
        console.log(response.element)
          ws.send(`elementResults-${response.element}`)
        }
      });
    });
  });
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
  if (command.split("--")[0] === "goto") {
    navigateToURL(command.split("--")[1]);
  }

  if (command.includes("awaitElement-")) {
    const elementSelector = command.split("awaitElement-")[1];
    startCheckingElement(elementSelector);
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

  if (command.includes("getElement-")) {
    GetElementResults(command.split("getElement-")[1]);
  }
  
  if (command = "getcurrenturl") {
    getCurrentURL();
  }

  // Add more commands as needed
}

function navigateToURL(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tabId = tabs[0].id;
    chrome.tabs.update(tabId, { url: url });
  });
}

function getCurrentURL() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentURL = tabs[0].url;
    ws.send(`currentURL-${currentURL}`);
    console.log("Current URL sent to WebSocket:", currentURL);
  });
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 10);
}
