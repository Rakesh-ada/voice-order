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
    let detectedLanguage = '';
    
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
    
    // Function to translate text using Google Translate (client-side approach)
    async function translateText(text, sourceLang, targetLang) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            
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
            
            return translatedText;
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
}); 