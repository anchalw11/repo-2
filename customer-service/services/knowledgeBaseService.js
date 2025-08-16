// In a real application, this would connect to a knowledge base (e.g., a database, a set of markdown files, etc.)
const knowledgeBase = [
    {
        id: 1,
        title: 'How to reset your password',
        content: 'To reset your password, go to the login page and click on the "Forgot Password" link.',
    },
    {
        id: 2,
        title: 'How to configure your trading signals',
        content: 'You can configure your trading signals in the settings page of the trading dashboard.',
    },
    {
        id: 3,
        title: 'What are the prop firm rules?',
        content: 'The prop firm rules can be found in the "Prop Firm Rules" section of the trading dashboard.',
    },
];

const searchKnowledgeBase = (query) => {
    return knowledgeBase.filter((article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
    );
};

module.exports = {
    searchKnowledgeBase,
};
