const { searchKnowledgeBase } = require('./knowledgeBaseService');

// In a real application, this would connect to a proper AI chatbot service (e.g., Dialogflow, Rasa, etc.)
const getChatbotResponse = (message) => {
    const query = message.toLowerCase();

    if (query.includes('password')) {
        return 'I can help with that. To reset your password, please go to the login page and click the "Forgot Password" link.';
    }

    if (query.includes('signals')) {
        return 'You can configure your trading signals in the settings page of the trading dashboard.';
    }

    if (query.includes('prop firm')) {
        return 'The prop firm rules can be found in the "Prop Firm Rules" section of the trading dashboard.';
    }

    const knowledgeBaseResults = searchKnowledgeBase(query);
    if (knowledgeBaseResults.length > 0) {
        return `I found some information that might help: ${knowledgeBaseResults[0].title}. Would you like to know more?`;
    }

    return "I'm sorry, I don't have an answer for that. Would you like to speak to a human agent?";
};

module.exports = {
    getChatbotResponse,
};
