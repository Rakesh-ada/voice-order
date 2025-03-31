document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recordButton = document.getElementById('recordButton');
    const statusIndicator = document.getElementById('statusIndicator');
    const bengaliTextElement = document.getElementById('bengaliText');
    const englishTextElement = document.getElementById('englishText');
    const translateToggle = document.getElementById('translateToggle');
    
    // Variables
    let recognition;
    let isRecording = false;
    let rawBengaliText = ''; // Stores ONLY Bengali raw input
    let collectingMode = true; // When true, only collect audio without processing
    
    // Gemini API key
    const GEMINI_API_KEY = 'AIzaSyDjonLXdO1u8KdXllXSiAsZB0VFXG2iRbU';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Cache for translations to optimize API usage
    const translationCache = new Map();

    // 1. Setup Bengali-only Speech Recognition
    function setupBengaliRecognition() {
        try {
            // Check if browser supports speech recognition
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition is not supported in this browser. Please use Chrome.');
            }

            // Create recognition instance
            recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            
            // Configure recognition
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'bn-IN'; // Bengali only
            
            // Log recognition setup
            console.log('Speech recognition initialized with language:', recognition.lang);
            
            recognition.onstart = () => {
                console.log('Recognition started');
                statusIndicator.textContent = 'Listening for Bengali...';
                recordButton.classList.add('recording');
                recordButton.textContent = '⏹️ Stop';
                collectingMode = true; // Start in collecting mode
                // Clear the text display when starting new recording
                bengaliTextElement.textContent = '';
            };
            
            recognition.onresult = (event) => {
                console.log('Recognition result received:', event.results);
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                // If we have a final transcript, add it to our raw text
                if (finalTranscript) {
                    console.log('Final transcript:', finalTranscript);
                    rawBengaliText += (rawBengaliText ? ' ' : '') + finalTranscript.trim();
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript;
                    
                    // Only process text after stopping if we're not in collecting mode
                    if (!collectingMode) {
                        processBengaliText(rawBengaliText);
                    }
                }
                
                // For interim results, show in status indicator only
                if (interimTranscript) {
                    console.log('Interim transcript:', interimTranscript);
                    statusIndicator.textContent = 'Listening: ' + interimTranscript;
                }
            };
            
            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                statusIndicator.textContent = 'Error: ' + event.error;
                stopRecording();
            };

            recognition.onend = () => {
                console.log('Recognition ended');
                if (isRecording) {
                    console.log('Restarting recognition...');
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error('Error restarting recognition:', error);
                        isRecording = false;
                        recordButton.classList.remove('recording');
                        recordButton.textContent = '🎤 Record Bengali';
                    }
                } else {
                    recordButton.classList.remove('recording');
                    recordButton.textContent = '🎤 Record Bengali';
                }
            };
            
            return true;
        } catch (error) {
            console.error('Failed to setup speech recognition:', error);
            statusIndicator.textContent = 'Error: ' + error.message;
            recordButton.disabled = true;
            return false;
        }
    }

    // 2. Process Bengali Text (Clean up repetitions)
    function processBengaliText(text) {
        statusIndicator.textContent = 'Processing...';
        console.log('Processing text:', text);
        
        try {
            // Enhanced client-side cleaning of repetitions
            const cleanedText = removeRepetitions(text);
            
            // Display ONLY the cleaned text, never the raw text
            bengaliTextElement.textContent = cleanedText;
            statusIndicator.textContent = 'Processed';
            
            // Auto-translate if enabled
            if (translateToggle.checked) {
                translateBengaliToEnglish(cleanedText);
            }
        } catch (error) {
            console.error('Processing error:', error);
            statusIndicator.textContent = 'Error processing text: ' + error.message;
            // On error, clear any partial text to avoid showing unprocessed content
            bengaliTextElement.textContent = '';
        }
    }

    // Enhanced repetition removal function
    function removeRepetitions(text) {
        // First, let's clean up extra spaces and normalize punctuation
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        
        // Split text into sentences or phrases
        const sentences = normalizedText.split(/[।?!]/).filter(s => s.trim().length > 0);
        const uniqueSentences = [];
        
        // Track seen sentences with similarity checking
        const seenPhrases = [];
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            
            // Skip empty sentences
            if (!trimmed) continue;
            
            // Check if this sentence is similar to any we've seen before
            let isDuplicate = false;
            for (const seenPhrase of seenPhrases) {
                if (calculateSimilarity(trimmed, seenPhrase) > 0.7) { // 70% similarity threshold
                    isDuplicate = true;
                    break;
                }
            }
            
            if (!isDuplicate) {
                seenPhrases.push(trimmed);
                uniqueSentences.push(trimmed);
            }
        }
        
        // Now check for repeated words within each sentence
        const finalSentences = [];
        for (const sentence of uniqueSentences) {
            finalSentences.push(removeRepeatedWords(sentence));
        }
        
        // Join unique sentences back together
        return finalSentences.join('। ') + (finalSentences.length > 0 ? '।' : '');
    }
    
    // Calculate similarity between two strings (simple Levenshtein-based approach)
    function calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length === 0 || str2.length === 0) return 0.0;
        
        // Very basic similarity: percentage of matching words
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        
        let matches = 0;
        for (const word of words1) {
            if (words2.includes(word)) {
                matches++;
            }
        }
        
        return matches / Math.max(words1.length, words2.length);
    }
    
    // Remove repeated consecutive words in a sentence
    function removeRepeatedWords(sentence) {
        const words = sentence.split(/\s+/);
        const result = [];
        
        for (let i = 0; i < words.length; i++) {
            // Only add the word if it's different from the previous one
            if (i === 0 || words[i].toLowerCase() !== words[i-1].toLowerCase()) {
                result.push(words[i]);
            }
        }
        
        return result.join(' ');
    }

    // 3. Translate Bengali to English using Gemini API
    async function translateBengaliToEnglish(bengaliText) {
        if (!bengaliText.trim()) {
            console.log('No text to translate');
            return;
        }

        statusIndicator.textContent = 'Translating...';
        console.log('Translating text:', bengaliText);
        
        try {
            // Check cache first to optimize API usage
            if (translationCache.has(bengaliText)) {
                console.log('Using cached translation');
                englishTextElement.textContent = translationCache.get(bengaliText);
                statusIndicator.textContent = 'Translation complete (cached)';
                return;
            }
            
            // Call Gemini API for translation
            const translatedText = await callGeminiAPI(bengaliText);
            englishTextElement.textContent = translatedText;
            statusIndicator.textContent = 'Translation complete';
            
            // Cache the result for future use
            translationCache.set(bengaliText, translatedText);
            
            // Limit cache size to prevent memory issues
            if (translationCache.size > 50) {
                // Remove oldest entry
                const firstKey = translationCache.keys().next().value;
                translationCache.delete(firstKey);
            }
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed: ' + error.message;
            
            // Fallback to Google Translate API if Gemini fails
            try {
                const fallbackText = await fetchGoogleTranslation(bengaliText);
                englishTextElement.textContent = fallbackText;
                statusIndicator.textContent = 'Basic translation complete (fallback)';
            } catch (fallbackError) {
                console.error('Fallback translation error:', fallbackError);
            }
        }
    }
    
    // Call Gemini API for translation
    async function callGeminiAPI(text) {
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Translate this Bengali text to English: "${text}"`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 800
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Response:', errorData);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Gemini API Response:', data);

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format from Gemini API');
            }

            // Extract just the translation, ignoring any explanatory text
            let translatedText = data.candidates[0].content.parts[0].text;
            
            // Clean up the result - remove quotation marks and explanatory text
            translatedText = translatedText.replace(/^["']|["']$/g, '');
            translatedText = translatedText.replace(/^Translation: /i, '');
            translatedText = translatedText.replace(/^In English: /i, '');
            translatedText = translatedText.replace(/^Translated text: /i, '');
            
            return translatedText.trim();
        } catch (error) {
            console.error('Gemini API call failed:', error);
            throw error;
        }
    }
    
    // Google Translate API as fallback
    async function fetchGoogleTranslation(text) {
        try {
            const response = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=' + encodeURI(text));
            
            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract translation from Google's API response format
            let translation = '';
            if (data && data[0]) {
                for (let i = 0; i < data[0].length; i++) {
                    if (data[0][i][0]) {
                        translation += data[0][i][0];
                    }
                }
            }
            
            return translation || 'Translation unavailable';
        } catch (error) {
            console.error('Google Translation API error:', error);
            throw new Error('Failed to connect to translation service');
        }
    }

    // Recording control functions
    function startRecording() {
        try {
            // Clear previous content
            rawBengaliText = '';
            bengaliTextElement.textContent = ''; // Clear display text
            englishTextElement.textContent = '';
            
            // Start recording in collection mode
            collectingMode = true;
            recognition.start();
            isRecording = true;
            statusIndicator.textContent = 'Listening for Bengali...';
            recordButton.classList.add('recording');
            recordButton.textContent = '⏹️ Stop';
            console.log('Recording started');
        } catch (error) {
            console.error('Error starting recording:', error);
            isRecording = false;
            statusIndicator.textContent = 'Error starting recording: ' + error.message;
            recordButton.classList.remove('recording');
        }
    }

    function stopRecording() {
        try {
            if (recognition && isRecording) {
                recognition.stop();
                isRecording = false;
                collectingMode = false; // Exit collection mode to process full text
                statusIndicator.textContent = 'Processing complete audio...';
                recordButton.classList.remove('recording');
                recordButton.textContent = '🎤 Record Bengali';
                console.log('Recording stopped, processing full text');
                
                // Process the entire collected text after stopping
                if (rawBengaliText.trim()) {
                    processBengaliText(rawBengaliText);
                } else {
                    statusIndicator.textContent = 'No audio detected';
                    bengaliTextElement.textContent = ''; // Ensure no text is displayed if no audio
                }
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            statusIndicator.textContent = 'Error stopping recording: ' + error.message;
            bengaliTextElement.textContent = ''; // Clear on error
        }
    }

    function toggleRecording() {
        console.log('Toggle recording, current state:', isRecording);
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Initialize
    if (setupBengaliRecognition()) {
        // Add event listeners
        recordButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Record button clicked');
            toggleRecording();
        });
        
        translateToggle.addEventListener('change', () => {
            const currentBengaliText = bengaliTextElement.textContent.trim();
            if (translateToggle.checked && currentBengaliText) {
                console.log('Translation toggle on, translating:', currentBengaliText);
                translateBengaliToEnglish(currentBengaliText);
            } else {
                englishTextElement.textContent = '';
                statusIndicator.textContent = 'Translation disabled';
            }
        });
        
        // Set initial button text
        recordButton.textContent = '🎤 Record Bengali';
        
        // Ensure text elements are empty on startup
        bengaliTextElement.textContent = '';
        englishTextElement.textContent = '';
    }
});