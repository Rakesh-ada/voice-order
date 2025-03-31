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
            };
            
            recognition.onresult = (event) => {
                console.log('Recognition result received:', event.results);
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    console.log('Final transcript:', finalTranscript);
                    rawBengaliText += (rawBengaliText ? ' ' : '') + finalTranscript.trim();
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript;
                    // Process the text for cleaning
                    processBengaliText(rawBengaliText);
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
                    recognition.start();
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
            // Simple client-side cleaning of repetitions (basic implementation)
            const cleanedText = removeRepetitions(text);
            
            // Display the cleaned text
            bengaliTextElement.textContent = cleanedText;
            statusIndicator.textContent = 'Processed';
            
            // Auto-translate if enabled
            if (translateToggle.checked) {
                translateBengaliToEnglish(cleanedText);
            }
        } catch (error) {
            console.error('Processing error:', error);
            statusIndicator.textContent = 'Error processing text: ' + error.message;
        }
    }

    // Simple repetition removal function
    function removeRepetitions(text) {
        // Split text into sentences or phrases
        const sentences = text.split(/[।?!]/).filter(s => s.trim().length > 0);
        const uniqueSentences = [];
        
        // Track seen sentences to avoid duplicates
        const seenPhrases = new Set();
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            
            // Skip empty sentences
            if (!trimmed) continue;
            
            // Check if we've seen this phrase before
            if (!seenPhrases.has(trimmed)) {
                seenPhrases.add(trimmed);
                uniqueSentences.push(trimmed);
            }
        }
        
        // Join unique sentences back together
        return uniqueSentences.join('। ') + (uniqueSentences.length > 0 ? '।' : '');
    }

    // 3. Translate Bengali to English using Chrome's Web Speech API
    function translateBengaliToEnglish(bengaliText) {
        if (!bengaliText.trim()) {
            console.log('No text to translate');
            return;
        }

        statusIndicator.textContent = 'Translating...';
        console.log('Translating text:', bengaliText);
        
        try {
            // Use Chrome's speech recognition for translation
            const translationRecognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            translationRecognition.lang = 'en-US'; // Target language: English
            
            // First, use speech synthesis to "speak" the Bengali text
            const speechSynthesis = window.speechSynthesis;
            const speechUtterance = new SpeechSynthesisUtterance(bengaliText);
            speechUtterance.lang = 'bn-IN'; // Bengali
            speechUtterance.volume = 0; // Mute it (we don't need to hear it)
            
            // Set up recognition before synthesis
            translationRecognition.onresult = (event) => {
                const translatedText = event.results[0][0].transcript;
                englishTextElement.textContent = translatedText;
                statusIndicator.textContent = 'Translation complete';
                console.log('Translation displayed:', translatedText);
            };
            
            translationRecognition.onerror = (event) => {
                console.error('Translation error:', event.error);
                statusIndicator.textContent = 'Translation failed: ' + event.error;
                
                // Fallback to direct display method
                useDirectTranslation(bengaliText);
            };
            
            translationRecognition.onend = () => {
                console.log('Translation recognition ended');
                if (englishTextElement.textContent === '') {
                    // If no result, use fallback
                    useDirectTranslation(bengaliText);
                }
            };
            
            // Start listening for English translation when synthesis ends
            speechUtterance.onend = () => {
                translationRecognition.start();
            };
            
            // Start the process
            speechSynthesis.speak(speechUtterance);
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed: ' + error.message;
            
            // Use fallback translation method
            useDirectTranslation(bengaliText);
        }
    }
    
    // Fallback translation method (direct word mapping for common phrases)
    function useDirectTranslation(bengaliText) {
        // Try to extract meaning from Bengali text using a simple word-mapping approach
        const commonWords = {
            'আমি': 'I',
            'তুমি': 'you',
            'সে': 'he/she',
            'আমরা': 'we',
            'তারা': 'they',
            'খাবার': 'food',
            'পানি': 'water',
            'চা': 'tea',
            'কফি': 'coffee',
            'ভাত': 'rice',
            'মাছ': 'fish',
            'মাংস': 'meat',
            'সব্জি': 'vegetable',
            'ফল': 'fruit',
            'আপেল': 'apple',
            'কলা': 'banana'
            // Add more common Bengali words and their English translations
        };
        
        let translatedWords = [];
        const words = bengaliText.split(/\s+/);
        
        for (const word of words) {
            const cleanWord = word.replace(/[।,.?!]/g, '').trim();
            if (commonWords[cleanWord]) {
                translatedWords.push(commonWords[cleanWord]);
            } else {
                // Keep the original word if no translation is available
                translatedWords.push(cleanWord);
            }
        }
        
        englishTextElement.textContent = translatedWords.join(' ');
        statusIndicator.textContent = 'Basic translation complete';
    }

    // Recording control functions
    function startRecording() {
        try {
            rawBengaliText = '';
            bengaliTextElement.textContent = '';
            englishTextElement.textContent = '';
            
            recognition.start();
            isRecording = true;
            statusIndicator.textContent = 'Listening for Bengali...';
            console.log('Recording started');
        } catch (error) {
            console.error('Error starting recording:', error);
            statusIndicator.textContent = 'Error starting recording: ' + error.message;
        }
    }

    function stopRecording() {
        try {
            recognition.stop();
            isRecording = false;
            statusIndicator.textContent = 'Processing complete';
            console.log('Recording stopped');
        } catch (error) {
            console.error('Error stopping recording:', error);
            statusIndicator.textContent = 'Error stopping recording: ' + error.message;
        }
    }

    function toggleRecording() {
        if (isRecording) {
            stopRecording();
            recordButton.textContent = '🎤 Record Bengali';
        } else {
            startRecording();
            recordButton.textContent = '⏹️ Stop';
        }
    }

    // Initialize
    if (setupBengaliRecognition()) {
        recordButton.addEventListener('click', toggleRecording);
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
    }
});