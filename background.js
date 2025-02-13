
// Replace 'YOUR_API_KEY' with your actual OpenAI API key
const apiKey = '3b571ff41ad84cdc92f4889cf57d0c73';

// Function to detect the domain category of the webpage
async function detectDomain(pageContent) {
    try {
        const response = await fetch('https://api.cohere.ai/v1/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                inputs: [pageContent],
                model: 'command',
                examples: [
                    { text: 'Breaking news about politics and economy', label: 'News' },
                    { text: 'A research paper on quantum computing', label: 'Research' },
                    { text: 'JavaScript code snippet for web scraping', label: 'Code' },
                    { text: 'Stock market trends and financial analysis', label: 'Finance' },
                    { text: 'Latest deals on e-commerce platforms', label: 'E-commerce' }
                ]
            })
        });
        const data = await response.json();
        return data.classifications[0].prediction;
    } catch (error) {
        console.error('Domain detection error:', error);
        return 'Unknown';
    }
}

// Function to summarize webpage content
async function summarizePageContent(pageContent, sendResponse) {
    try {
        const domain = await detectDomain(pageContent);
        const response = await fetch('https://api.cohere.ai/v1/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                text: pageContent,
                length: 'medium',
                format: 'paragraph',
                model: 'command',
                extractiveness: 'low',
                temperature: 0.3,
            })
        });

        if (response.ok) {
            const data = await response.json();
            sendResponse({ action: 'summaryResponse', summary: data.summary, domain });
        } else {
            console.error('Error summarizing:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function for AI-Powered Q/A System
async function askQuestion(question, pageContent, sendResponse) {
    try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt: `Answer based on the following content:\n\n${pageContent}\n\nQuestion: ${question}\n\nAnswer:`,
                model: 'command',
                max_tokens: 100,
                temperature: 0.3,
            })
        });

        if (response.ok) {
            const data = await response.json();
            sendResponse({ action: 'qaResponse', answer: data.generations[0].text });
        } else {
            console.error('Error generating answer:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Chrome message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizePage') {
        summarizePageContent(request.content, sendResponse);
    } else if (request.action === 'askQuestion') {
        askQuestion(request.question, request.content, sendResponse);
    }
    return true;
});
