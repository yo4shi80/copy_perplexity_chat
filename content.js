// This script is injected into the Perplexity page to extract chat content.

/**
 * Extracts the entire conversation from the Perplexity chat interface, handling multiple turns.
 * @param {boolean} formatAsMarkdown - Whether to format the output as Markdown.
 * @returns {string} - The extracted conversation text.
 */
function extractConversation(formatAsMarkdown) {
  // Note: These selectors are based on Perplexity's DOM structure as of August 2025.
  // They are designed to capture all parts of a multi-turn conversation in document order.
  const messageSelector = [
    'h1[class*="group/query"]',      // Initial user query
    'div[class*="group/query"]',     // Subsequent user queries
    'div[class*="prose"]'             // AI response content
  ].join(', ');

  const messageElements = document.querySelectorAll(messageSelector);

  if (messageElements.length === 0) {
    console.log("Copy Perplexity Chat: No chat messages found with the current selectors.");
    return "No conversation found. The page structure may have changed.";
  }

  const conversation = [];
  let currentMessage = null;

  messageElements.forEach(el => {
    let author = '';
    // innerText is used to preserve line breaks similar to how a user would copy-paste.
    const content = el.innerText;

    // Determine the author based on the element's tag and classes.
    if (el.tagName.toLowerCase() === 'h1' || el.className.includes('group/query')) {
      author = 'User';
    } else if (el.className.includes('prose')) {
      author = 'Perplexity';
    }

    if (author) {
      // If the current message block is from the same author as the previous one,
      // append the content. This handles cases where a single response is in multiple elements.
      if (currentMessage && currentMessage.author === author) {
        currentMessage.content += '\n\n' + content;
      } else {
        // If the author is different, push the previous message and start a new one.
        if (currentMessage) {
          conversation.push(currentMessage);
        }
        currentMessage = { author, content };
      }
    }
  });

  // Don't forget to push the very last message collected.
  if (currentMessage) {
    conversation.push(currentMessage);
  }

  // Format the final output string from the structured conversation array.
  let conversationText = '';
  conversation.forEach(msg => {
    if (formatAsMarkdown) {
      // Indent content for better readability in Markdown lists.
      const indentedContent = msg.content.replace(/\n/g, '\n  ');
      conversationText += `* **${msg.author}:**\n  ${indentedContent}\n\n`;
    } else {
      conversationText += `${msg.author}:\n${msg.content}\n\n`;
    }
  });

  return conversationText.trim();
}

/**
 * Listen for a message from the popup script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getChatContent") {
    const chatContent = extractConversation(request.formatAsMarkdown);
    sendResponse({ data: chatContent });
  }
  // Keep the message channel open for the asynchronous response.
  return true;
});