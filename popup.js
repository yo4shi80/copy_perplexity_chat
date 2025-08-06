document.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.getElementById('copyButton');
  const markdownCheck = document.getElementById('markdownCheck');
  const status = document.getElementById('status');

  copyButton.addEventListener('click', () => {
    status.textContent = ''; // Reset status message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // Inject the content script into the active tab
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }, () => {
        // After the script is injected, send a message to it
        chrome.tabs.sendMessage(activeTab.id, {
          action: "getChatContent",
          formatAsMarkdown: markdownCheck.checked
        }, (response) => {
          if (chrome.runtime.lastError) {
            status.textContent = 'Error: Could not connect.';
            console.error(chrome.runtime.lastError.message);
            return;
          }

          if (response && response.data) {
            // Copy the received data to the clipboard
            navigator.clipboard.writeText(response.data).then(() => {
              status.textContent = 'Copied!';
            }).catch(err => {
              status.textContent = 'Failed to copy.';
              console.error('Clipboard write failed: ', err);
            });
          } else {
            status.textContent = 'No chat content found.';
          }
        });
      });
    });
  });
});
