document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recordButton = document.getElementById('recordButton');
    const statusIndicator = document.getElementById('statusIndicator');
    const bengaliTextElement = document.getElementById('bengaliText');
    const englishTextElement = document.getElementById('englishText');
    const copyBengaliButton = document.getElementById('copyBengali');
    const copyEnglishButton = document.getElementById('copyEnglish');
    const translateToggle = document.getElementById('translateToggle');
    const formatOrderButton = document.getElementById('formatOrderButton');
    
    // Variables
    let recognition;
    let isRecording = false;
    let recognizedText = '';
    let detectedLanguage = '';
    
    // Gemini API key
    const GEMINI_API_KEY = 'AIzaSyBL_Opc-A1Y1qH8XB8pZ9JDlzx_Ql5rFoM';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // Setup Web Speech API
    function setupSpeechRecognition() {
        try {
            // Check if the browser supports the Web Speech API
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.');
            }
            
            // Initialize the speech recognition
            recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            
            // Configure recognition - start with Bengali as default
            recognition.continuous = true;
            recognition.interimResults = true;
            
            // Initially detect language automatically
            recognition.lang = 'bn-IN,en-US'; // Support both Bengali and English
            
            // Handle results
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                // Process results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update for interim results
                if (interimTranscript) {
                    statusIndicator.textContent = 'Listening... ' + interimTranscript;
                }
                
                // Update for final results
                if (finalTranscript) {
                    // Add space if this isn't the first word
                    if (recognizedText) recognizedText += ' ';
                    recognizedText += finalTranscript;
                    
                    // Try to detect language from recognized text
                    detectLanguage(recognizedText);
                    
                    // Update primary display based on detected language
                    if (detectedLanguage === 'bn') {
                        bengaliTextElement.textContent = recognizedText;
                    } else {
                        englishTextElement.textContent = recognizedText;
                    }
                    
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript + ' (Detected: ' + (detectedLanguage === 'bn' ? 'Bengali' : 'English') + ')';
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
    
    // Detect language (Bengali or English)
    function detectLanguage(text) {
        // Bengali Unicode range: \u0980-\u09FF
        const bengaliPattern = /[\u0980-\u09FF]/;
        
        // If the text contains Bengali characters, consider it Bengali
        if (bengaliPattern.test(text)) {
            detectedLanguage = 'bn';
            // Update recognition language to Bengali for better accuracy
            recognition.lang = 'bn-IN';
        } else {
            detectedLanguage = 'en';
            // Update recognition language to English for better accuracy
            recognition.lang = 'en-US';
        }
        
        return detectedLanguage;
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
        // Clear previous text
        recognizedText = '';
        detectedLanguage = '';
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
                // Translate based on detected language
                if (translateToggle.checked) {
                    statusIndicator.textContent = 'Translating...';
                    
                    if (detectedLanguage === 'bn') {
                        // Bengali to English translation
                        translateText(recognizedText.trim(), 'bn', 'en')
                            .then(englishText => {
                                englishTextElement.textContent = englishText;
                                statusIndicator.textContent = 'Ready';
                            })
                            .catch(error => {
                                console.error('Translation error:', error);
                                statusIndicator.textContent = 'Translation error: ' + error.message;
                            });
                    } else {
                        // English to Bengali translation
                        translateText(recognizedText.trim(), 'en', 'bn')
                            .then(bengaliText => {
                                bengaliTextElement.textContent = bengaliText;
                                statusIndicator.textContent = 'Ready';
                            })
                            .catch(error => {
                                console.error('Translation error:', error);
                                statusIndicator.textContent = 'Translation error: ' + error.message;
                            });
                    }
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
    
    // Function to translate text using Gemini API
    async function translateText(text, sourceLang, targetLang) {
        try {
            // Create the prompt for Gemini to translate the text
            let prompt;
            if (sourceLang === 'bn' && targetLang === 'en') {
                prompt = `Translate the following Bengali text to English. Return only the translation without any additional text or explanations: "${text}"`;
            } else if (sourceLang === 'en' && targetLang === 'bn') {
                prompt = `Translate the following English text to Bengali. Return only the translation without any additional text or explanations: "${text}"`;
            } else {
                throw new Error(`Unsupported language pair: ${sourceLang} to ${targetLang}`);
            }
            
            // Prepare the request body for Gemini API
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            };
            
            // Send the request to Gemini API
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API request failed with status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }
            
            const data = await response.json();
            
            // Extract the translated text from the Gemini API response
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                const translatedText = data.candidates[0].content.parts[0].text.trim();
                return translatedText;
            }
            
            throw new Error('No translation returned from Gemini API');
        } catch (error) {
            console.error('Translation error:', error);
            
            // Fallback to client-side Google Translate if Gemini API fails
            try {
                console.log('Falling back to Google Translate API');
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                
                const fallbackResponse = await fetch(url);
                
                if (!fallbackResponse.ok) {
                    throw new Error(`Fallback translation request failed with status: ${fallbackResponse.status}`);
                }
                
                const fallbackData = await fallbackResponse.json();
                
                // The response format is a nested array - extract the translated text
                let translatedText = '';
                
                // Each item in the first array contains a translation segment
                if (fallbackData && fallbackData[0]) {
                    // Concatenate all translation segments
                    for (const segment of fallbackData[0]) {
                        if (segment[0]) {
                            translatedText += segment[0];
                        }
                    }
                }
                
                if (!translatedText) {
                    throw new Error('No translation returned from fallback service');
                }
                
                return translatedText;
            } catch (fallbackError) {
                console.error('Fallback translation error:', fallbackError);
                throw new Error(`Translation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
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
    
    // Format Order button event listener
    formatOrderButton.addEventListener('click', () => {
        // Get the appropriate text based on detected language
        const textToFormat = detectedLanguage === 'bn' ? 
            bengaliTextElement.textContent : 
            englishTextElement.textContent;
            
        if (!textToFormat.trim()) {
            statusIndicator.textContent = 'No text to format. Please record or enter text first.';
            return;
        }
        
        formatBusinessOrder(textToFormat, detectedLanguage)
            .then(formattedText => {
                // Update the appropriate text element
                if (detectedLanguage === 'bn') {
                    bengaliTextElement.textContent = formattedText;
                    
                    // If translation is enabled, translate the formatted text
                    if (translateToggle.checked) {
                        translateText(formattedText, 'bn', 'en')
                            .then(englishText => {
                                englishTextElement.textContent = englishText;
                                statusIndicator.textContent = 'Order formatted';
                            })
                            .catch(error => {
                                console.error('Translation error:', error);
                                statusIndicator.textContent = 'Error translating formatted order';
                            });
                    } else {
                        statusIndicator.textContent = 'Order formatted';
                    }
                } else {
                    englishTextElement.textContent = formattedText;
                    
                    // If translation is enabled, translate the formatted text
                    if (translateToggle.checked) {
                        translateText(formattedText, 'en', 'bn')
                            .then(bengaliText => {
                                bengaliTextElement.textContent = bengaliText;
                                statusIndicator.textContent = 'Order formatted';
                            })
                            .catch(error => {
                                console.error('Translation error:', error);
                                statusIndicator.textContent = 'Error translating formatted order';
                            });
                    } else {
                        statusIndicator.textContent = 'Order formatted';
                    }
                }
            })
            .catch(error => {
                console.error('Formatting error:', error);
                statusIndicator.textContent = 'Error formatting order: ' + error.message;
            });
    });
    
    translateToggle.addEventListener('change', () => {
        if (translateToggle.checked && recognizedText.trim()) {
            statusIndicator.textContent = 'Translating...';
            
            // Translate based on detected language
            if (detectedLanguage === 'bn') {
                translateText(recognizedText.trim(), 'bn', 'en')
                    .then(englishText => {
                        englishTextElement.textContent = englishText;
                        statusIndicator.textContent = 'Ready';
                    })
                    .catch(error => {
                        console.error('Translation error:', error);
                        statusIndicator.textContent = 'Translation error: ' + error.message;
                    });
            } else {
                translateText(recognizedText.trim(), 'en', 'bn')
                    .then(bengaliText => {
                        bengaliTextElement.textContent = bengaliText;
                        statusIndicator.textContent = 'Ready';
                    })
                    .catch(error => {
                        console.error('Translation error:', error);
                        statusIndicator.textContent = 'Translation error: ' + error.message;
                    });
            }
        } else if (!translateToggle.checked) {
            // Clear the translated text when toggle is turned off
            if (detectedLanguage === 'bn') {
                englishTextElement.textContent = '';
            } else {
                bengaliTextElement.textContent = '';
            }
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
        // Detect language of the input text
        const lang = detectLanguage(text);
        
        // Set the text in the appropriate element
        if (lang === 'bn') {
            bengaliTextElement.textContent = text.trim();
        } else {
            englishTextElement.textContent = text.trim();
        }
        
        // Translate if toggle is on
        if (translateToggle.checked) {
            statusIndicator.textContent = 'Translating...';
            
            if (lang === 'bn') {
                translateText(text.trim(), 'bn', 'en')
                    .then(englishText => {
                        englishTextElement.textContent = englishText;
                        statusIndicator.textContent = 'Ready';
                    })
                    .catch(error => {
                        console.error('Translation error:', error);
                        statusIndicator.textContent = 'Translation error: ' + error.message;
                    });
            } else {
                translateText(text.trim(), 'en', 'bn')
                    .then(bengaliText => {
                        bengaliTextElement.textContent = bengaliText;
                        statusIndicator.textContent = 'Ready';
                    })
                    .catch(error => {
                        console.error('Translation error:', error);
                        statusIndicator.textContent = 'Translation error: ' + error.message;
                    });
            }
        }
    };

    // Function to format business order using Gemini AI
    async function formatBusinessOrder(text, language) {
        try {
            statusIndicator.textContent = 'Formatting order...';
            
            // Create the prompt for Gemini to format the order
            let prompt;
            if (language === 'bn') {
                prompt = `Format the following Bengali business order text into a structured, clean business order format.

Important:
1. Fix any repetitions (like "তুমি তুমি তুমি কেমন তুমি কেমন আছো") by removing redundant words.
2. Extract and organize the following information if present:
   - Customer name and contact details
   - Order number/ID (if any)
   - Ordered items with quantities and prices
   - Delivery address or pickup details
   - Payment method
   - Special instructions

3. Format the output as follows:
   - Use clear sections with headings
   - List items in a structured way
   - Add appropriate line breaks
   - Calculate totals if prices are mentioned

Return the properly formatted order in Bengali without any explanations or additional text.

Text to format: "${text}"`;
            } else {
                prompt = `Format the following English business order text into a structured, clean business order format.

Important:
1. Fix any repetitions (like "you you you how how are you") by removing redundant words.
2. Extract and organize the following information if present:
   - Customer name and contact details
   - Order number/ID (if any)
   - Ordered items with quantities and prices
   - Delivery address or pickup details
   - Payment method
   - Special instructions

3. Format the output as follows:
   - Use clear sections with headings
   - List items in a structured way
   - Add appropriate line breaks
   - Calculate totals if prices are mentioned

Return the properly formatted order without any explanations or additional text.

Text to format: "${text}"`;
            }
            
            // Prepare the request body for Gemini API
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            };
            
            // Send the request to Gemini API
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API request failed with status: ${response.status}, details: ${JSON.stringify(errorData)}`);
            }
            
            const data = await response.json();
            
            // Extract the formatted text from the Gemini API response
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                const formattedText = data.candidates[0].content.parts[0].text.trim();
                return formattedText;
            }
            
            throw new Error('No formatted text returned from Gemini API');
        } catch (error) {
            console.error('Order formatting error:', error);
            statusIndicator.textContent = 'Error formatting order: ' + error.message;
            throw error;
        }
    }
}); 