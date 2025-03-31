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
                    
                    // Update display
                    bengaliTextElement.textContent = recognizedText;
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript;
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
        // Clear previous text
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
                // Bengali text is already displayed in real-time
                
                // Translate to English if toggle is on
                if (translateToggle.checked) {
                    statusIndicator.textContent = 'Translating...';
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
        bengaliTextElement.textContent = text.trim();
        
        if (translateToggle.checked) {
            statusIndicator.textContent = 'Translating...';
            translateText(text.trim(), 'bn', 'en')
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
}); 