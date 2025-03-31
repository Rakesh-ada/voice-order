document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recordButton = document.getElementById('recordButton');
    const statusIndicator = document.getElementById('statusIndicator');
    const bengaliTextElement = document.getElementById('bengaliText');
    const englishTextElement = document.getElementById('englishText');
    const copyBengaliButton = document.getElementById('copyBengali');
    const copyEnglishButton = document.getElementById('copyEnglish');
    const translateToggle = document.getElementById('translateToggle');
    
    // Variables
    let recognition;
    let isRecording = false;
    let recognizedText = '';
    
    // Setup Web Speech API
    function setupSpeechRecognition() {
        try {
            // Check if the browser supports the Web Speech API
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.');
            }
            
            // Initialize the speech recognition
            recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            
            // Configure recognition
            recognition.lang = 'bn-IN'; // Bengali (India)
            recognition.continuous = true;
            recognition.interimResults = true;
            
            // Handle results
            recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                const transcript = result[0].transcript;
                
                if (result.isFinal) {
                    // Clean up repeated words that sometimes occur in Bengali recognition
                    const cleanTranscript = cleanupRepeatedWords(transcript);
                    recognizedText += ' ' + cleanTranscript;
                    statusIndicator.textContent = 'Recognized: ' + cleanTranscript;
                } else {
                    statusIndicator.textContent = 'Listening... ' + transcript;
                }
            };
            
            // Handle errors
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                statusIndicator.textContent = 'Error: ' + event.error;
                stopRecording();
            };
            
            // Handle end of recognition
            recognition.onend = () => {
                if (isRecording) {
                    // If we're still supposed to be recording, restart recognition
                    // (this handles automatic stops by the browser)
                    recognition.start();
                }
            };
            
            return true;
        } catch (error) {
            console.error('Speech recognition setup error:', error);
            statusIndicator.textContent = error.message;
            return false;
        }
    }
    
    // Toggle recording function
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
            recordButton.innerHTML = '<span class="icon">🎤</span> Record';
            recordButton.classList.remove('secondary', 'recording');
            recordButton.classList.add('primary');
        } else {
            startRecording();
            recordButton.innerHTML = '<span class="icon">⏹️</span> Stop';
            recordButton.classList.remove('primary');
            recordButton.classList.add('secondary', 'recording');
        }
    }
    
    // Start recording function
    function startRecording() {
        recognizedText = '';
        bengaliTextElement.textContent = '';
        englishTextElement.textContent = '';
        
        try {
            recognition.start();
            isRecording = true;
            statusIndicator.textContent = 'Listening...';
        } catch (error) {
            console.error('Start recording error:', error);
            statusIndicator.textContent = 'Error starting recording: ' + error.message;
        }
    }
    
    // Stop recording function
    function stopRecording() {
        try {
            recognition.stop();
            isRecording = false;
            statusIndicator.textContent = 'Processing...';
            
            // Process the recognized text
            if (recognizedText.trim()) {
                // Format the text as a business order
                const formattedBengaliText = formatAsBusinessOrder(recognizedText);
                bengaliTextElement.textContent = formattedBengaliText;
                
                // Translate to English if toggle is on
                if (translateToggle.checked) {
                    statusIndicator.textContent = 'Translating...';
                    translateText(formattedBengaliText, 'bn', 'en')
                        .then(englishText => {
                            englishTextElement.textContent = englishText;
                            statusIndicator.textContent = 'Ready';
                        })
                        .catch(error => {
                            console.error('Translation error:', error);
                            statusIndicator.textContent = 'Translation error: ' + error.message;
                        });
                } else {
                    statusIndicator.textContent = 'Ready';
                }
            } else {
                statusIndicator.textContent = 'No speech detected. Please try again.';
            }
        } catch (error) {
            console.error('Stop recording error:', error);
            statusIndicator.textContent = 'Error stopping recording: ' + error.message;
        }
    }
    
    // Function to format text as a business order
    function formatAsBusinessOrder(text) {
        // Clean and normalize the text
        const cleanedText = text.trim();
        
        // Check if the text appears to be a dimension-based order list
        if (isDimensionOrder(cleanedText)) {
            return formatDimensionOrder(cleanedText);
        }
        
        // Regular Bengali text formatting (default)
        // Split by sentence endings (Bengali danda, periods, exclamation, question marks)
        const lines = cleanedText.split(/[।.!?]+/).filter(line => line.trim() !== '');
        
        let formattedText = '**বাংলা অর্ডার**\n\n';
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                formattedText += `${index + 1}. ${trimmedLine}\n`;
            }
        });
        
        // Add timestamp
        const now = new Date();
        formattedText += `\nতারিখ: ${now.toLocaleDateString()}\nসময়: ${now.toLocaleTimeString()}`;
        
        return formattedText;
    }
    
    // Function to check if text is a dimension-based order
    function isDimensionOrder(text) {
        // Look for patterns like "10x12", "9x 10", dimension with kg
        const dimensionPattern = /\d+\s*[xX]\s*\d+\s*(kg|KG|Kg)?/i;
        return dimensionPattern.test(text);
    }
    
    // Function to format dimension-based order
    function formatDimensionOrder(text) {
        // Clean and normalize the text
        let cleanedText = text.replace(/\s+/g, ' ').trim();
        if (cleanedText.startsWith('order input')) {
            cleanedText = cleanedText.replace('order input', '').trim();
        }
        
        // Special case handling for common format patterns
        if (cleanedText.includes('S1') || 
            cleanedText.match(/([A-Za-z]+\s+loose)/i) || 
            cleanedText.match(/([A-Za-z]+\s+\d+\s*[xX]\s*\d+)/i)) {
            return formatSpecificOrder(cleanedText);
        }
        
        // Regular category-based formatting
        const categories = {};
        let currentCategory = null;
        
        // Split by category indicators
        const parts = cleanedText.split(/(?=[A-Za-z][A-Za-z\s]*(?:\s+\d+|:))/g);
        
        parts.forEach(part => {
            part = part.trim();
            if (!part) return;
            
            // Check if this is a category with or without colon
            const categoryMatch = part.match(/^([A-Za-z][A-Za-z\s]*)(:|(?=\s+\d+))/);
            if (categoryMatch) {
                currentCategory = categoryMatch[1].trim();
                if (!categories[currentCategory]) {
                    categories[currentCategory] = [];
                }
                
                // Extract dimensions and quantities
                const itemText = part.substring(categoryMatch[0].length).trim();
                extractItems(itemText, currentCategory, categories);
            } else if (currentCategory && part.match(/\d+\s*[xX]\s*\d+/)) {
                // This is a continuation of items for the current category
                extractItems(part, currentCategory, categories);
            }
        });
        
        return formatCategoriesOutput(categories);
    }
    
    // Function to handle the specific format with known categories
    function formatSpecificOrder(text) {
        // Identify potential categories
        const potentialCategories = [];
        
        // Look for category names in the text
        const categoryRegex = /\b([A-Za-z][A-Za-z\s]*)\b(?=\s+\d+\s*[xX])/g;
        let categoryMatch;
        while ((categoryMatch = categoryRegex.exec(text)) !== null) {
            const categoryName = categoryMatch[1].trim();
            if (categoryName && !potentialCategories.includes(categoryName)) {
                potentialCategories.push(categoryName);
            }
        }
        
        // If no categories found, use a default approach
        if (potentialCategories.length === 0) {
            const defaultCategories = {};
            extractItems(text, "Items", defaultCategories);
            return formatCategoriesOutput(defaultCategories);
        }
        
        // Process categories
        const categories = {};
        
        potentialCategories.forEach((category, index) => {
            categories[category] = [];
            
            // Get content between this category and the next one (or end)
            const nextCategory = index < potentialCategories.length - 1 ? 
                potentialCategories[index + 1] : null;
            
            const categoryRegex = new RegExp(`${category}(.*?)(?=${nextCategory ? nextCategory : '$'})`, 's');
            const contentMatch = text.match(categoryRegex);
            
            if (contentMatch && contentMatch[1]) {
                extractItems(contentMatch[1].trim(), category, categories);
            }
        });
        
        return formatCategoriesOutput(categories);
    }
    
    // Format categories into the desired output
    function formatCategoriesOutput(categories) {
        let formattedText = '';
        
        Object.keys(categories).forEach(category => {
            if (categories[category].length > 0) {
                formattedText += `${category}:\n\n`;
                
                categories[category].forEach(item => {
                    // Format dimension and quantity
                    const formattedDimension = item.dimension.replace(/\s+/g, '').replace(/[xX]/, 'x');
                    let formattedQuantity = item.quantity;
                    
                    // Ensure "kg" is included and formats are consistent
                    if (!formattedQuantity.toLowerCase().includes('kg')) {
                        formattedQuantity += ' kg';
                    }
                    
                    formattedText += `- ${formattedDimension}: ${formattedQuantity}\n`;
                });
                
                formattedText += '\n';
            }
        });
        
        // Add timestamp
        const now = new Date();
        formattedText += `Date: ${now.toLocaleDateString()}\nTime: ${now.toLocaleTimeString()}`;
        
        return formattedText;
    }
    
    // Helper function to extract items
    function extractItems(text, category, categories) {
        const regex = /(\d+\s*[xX]\s*\d+)\s*(\d+\s*kg|\d+)/gi;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const dimension = match[1].trim();
            let quantity = match[2].trim();
            
            // Ensure "kg" is included
            if (!quantity.toLowerCase().includes('kg')) {
                quantity += ' kg';
            }
            
            categories[category].push({
                dimension: dimension,
                quantity: quantity
            });
        }
    }
    
    // Function to translate text using Google Translate (client-side approach)
    async function translateText(text, sourceLang, targetLang) {
        try {
            // Remove markdown formatting for translation
            const plainText = text
                .replace(/\*\*বাংলা অর্ডার\*\*\n\n/, '')
                .replace(/^\d+\.\s/gm, '')
                .replace(/\n(তারিখ|সময়):.*$/gm, '');
            
            // Use the free client-side translation approach
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(plainText)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Translation request failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // The response format is a nested array - extract the translated text
            let translatedText = '';
            
            // Each item in the first array contains a translation segment
            if (data && data[0]) {
                // Concatenate all translation segments
                for (const segment of data[0]) {
                    if (segment[0]) {
                        translatedText += segment[0];
                    }
                }
            }
            
            if (!translatedText) {
                throw new Error('No translation returned');
            }
            
            // Format the translated text similar to source
            const translatedLines = translatedText.split(/[.!?]+/).filter(line => line.trim() !== '');
            
            let formattedTranslation = '**English Translation**\n\n';
            
            translatedLines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    formattedTranslation += `${index + 1}. ${trimmedLine}\n`;
                }
            });
            
            // Add timestamp
            const now = new Date();
            formattedTranslation += `\nDate: ${now.toLocaleDateString()}\nTime: ${now.toLocaleTimeString()}`;
            
            return formattedTranslation;
        } catch (error) {
            console.error('Translation error:', error);
            // Provide a more user-friendly error message
            if (error.message.includes('failed with status: 429')) {
                throw new Error('Translation limit exceeded. Please try again later.');
            } else {
                throw new Error('Failed to translate text: ' + error.message);
            }
        }
    }
    
    // Function to copy text to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Clipboard error:', error);
            return false;
        }
    }
    
    // Event Listeners
    recordButton.addEventListener('click', toggleRecording);
    
    copyBengaliButton.addEventListener('click', () => {
        copyToClipboard(bengaliTextElement.textContent)
            .then(() => {
                copyBengaliButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyBengaliButton.innerHTML = '<span class="icon">📋</span> Copy Bengali';
                }, 2000);
            });
    });
    
    copyEnglishButton.addEventListener('click', () => {
        copyToClipboard(englishTextElement.textContent)
            .then(() => {
                copyEnglishButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyEnglishButton.innerHTML = '<span class="icon">📋</span> Copy English';
                }, 2000);
            });
    });
    
    translateToggle.addEventListener('change', () => {
        if (translateToggle.checked && bengaliTextElement.textContent.trim()) {
            statusIndicator.textContent = 'Translating...';
            translateText(bengaliTextElement.textContent, 'bn', 'en')
                .then(englishText => {
                    englishTextElement.textContent = englishText;
                    statusIndicator.textContent = 'Ready';
                })
                .catch(error => {
                    console.error('Translation error:', error);
                    statusIndicator.textContent = 'Translation error: ' + error.message;
                });
        } else if (!translateToggle.checked) {
            englishTextElement.textContent = '';
        }
    });
    
    // Initialize the app
    if (setupSpeechRecognition()) {
        statusIndicator.textContent = 'Ready';
    } else {
        recordButton.disabled = true;
        statusIndicator.textContent = 'Speech recognition not available';
    }
    
    // Add test function for direct input processing
    window.processDirectInput = function(text) {
        bengaliTextElement.textContent = formatAsBusinessOrder(text);
        
        if (translateToggle.checked) {
            statusIndicator.textContent = 'Translating...';
            translateText(bengaliTextElement.textContent, 'bn', 'en')
                .then(englishText => {
                    englishTextElement.textContent = englishText;
                    statusIndicator.textContent = 'Ready';
                })
                .catch(error => {
                    console.error('Translation error:', error);
                    statusIndicator.textContent = 'Translation error: ' + error.message;
                });
        }
    };
    
    // Function to clean up repeated words that often appear in Bengali recognition
    function cleanupRepeatedWords(text) {
        if (!text) return '';
        
        // Split text into words
        const words = text.split(/\s+/);
        const result = [];
        
        // Remove immediately repeated words (common in voice recognition)
        for (let i = 0; i < words.length; i++) {
            if (i === 0 || words[i] !== words[i-1]) {
                result.push(words[i]);
            }
        }
        
        return result.join(' ');
    }
}); 