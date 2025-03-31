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
    let rawRecognizedText = ''; // Stores EXACT speech-to-text output
    let detectedLanguage = '';
    
    // Gemini API key
    const GEMINI_API_KEY = 'AIzaSyBL_Opc-A1Y1qH8XB8pZ9JDlzx_Ql5rFoM';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // Setup Web Speech API
    function setupSpeechRecognition() {
        try {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser.');
            }
            
            recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'bn-IN,en-US'; // Default to bilingual mode
            
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update UI for live feedback
                if (interimTranscript) {
                    statusIndicator.textContent = 'Listening... ' + interimTranscript;
                }
                
                // Process finalized speech
                if (finalTranscript) {
                    // Store RAW recognized text (no formatting)
                    rawRecognizedText += (rawRecognizedText ? ' ' : '') + finalTranscript.trim();
                    
                    // Detect language (Bengali or English)
                    detectedLanguage = detectLanguage(rawRecognizedText);
                    
                    // Update UI with raw text
                    if (detectedLanguage === 'bn') {
                        bengaliTextElement.textContent = rawRecognizedText;
                        englishTextElement.textContent = ''; // Clear previous translation
                    } else {
                        englishTextElement.textContent = rawRecognizedText;
                        bengaliTextElement.textContent = ''; // Clear previous translation
                    }
                    
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript + ' (Detected: ' + (detectedLanguage === 'bn' ? 'Bengali' : 'English') + ')';
                    
                    // Auto-translate if toggle is on
                    if (translateToggle.checked) {
                        handleTranslation();
                    }
                }
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                statusIndicator.textContent = 'Error: ' + event.error;
                stopRecording();
            };
            
            recognition.onend = () => {
                if (isRecording) recognition.start(); // Auto-restart if still recording
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
        const bengaliPattern = /[\u0980-\u09FF]/;
        return bengaliPattern.test(text) ? 'bn' : 'en';
    }
    
    // Toggle recording
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
            recordButton.innerHTML = '<span class="icon">🎤</span> Record';
            recordButton.classList.remove('recording');
        } else {
            startRecording();
            recordButton.innerHTML = '<span class="icon">⏹️</span> Stop';
            recordButton.classList.add('recording');
        }
    }
    
    // Start recording
    function startRecording() {
        rawRecognizedText = ''; // Reset on new recording
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
    
    // Stop recording
    function stopRecording() {
        try {
            recognition.stop();
            isRecording = false;
            statusIndicator.textContent = 'Ready';
        } catch (error) {
            console.error('Stop recording error:', error);
            statusIndicator.textContent = 'Error stopping recording: ' + error.message;
        }
    }
    
    // Handle translation (uses rawRecognizedText without modification)
    async function handleTranslation() {
        if (!rawRecognizedText.trim()) return;
        
        statusIndicator.textContent = 'Translating...';
        
        try {
            const sourceLang = detectedLanguage;
            const targetLang = detectedLanguage === 'bn' ? 'en' : 'bn';
            
            const translatedText = await translateText(rawRecognizedText, sourceLang, targetLang);
            
            if (targetLang === 'en') {
                englishTextElement.textContent = translatedText;
            } else {
                bengaliTextElement.textContent = translatedText;
            }
            
            statusIndicator.textContent = 'Translation complete';
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed';
        }
    }
    
    // Translate text (Gemini API) - Input text remains UNMODIFIED
    async function translateText(text, sourceLang, targetLang) {
        const prompt = `Translate this EXACTLY without adding/removing content (${sourceLang} → ${targetLang}):\n\n"${text}"`;
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || text; // Fallback to original if error
    }
    
    // Format order (optional post-processing)
    async function formatBusinessOrder() {
        if (!rawRecognizedText.trim()) {
            statusIndicator.textContent = 'No text to format';
            return;
        }
        
        statusIndicator.textContent = 'Formatting order...';
        
        try {
            const prompt = `Format this business order clearly (keep ALL original content):\n\n${rawRecognizedText}`;
            
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const data = await response.json();
            const formattedText = data.candidates?.[0]?.content?.parts?.[0]?.text || rawRecognizedText;
            
            // Update UI with formatted text
            if (detectedLanguage === 'bn') {
                bengaliTextElement.textContent = formattedText;
            } else {
                englishTextElement.textContent = formattedText;
            }
            
            statusIndicator.textContent = 'Order formatted';
        } catch (error) {
            console.error('Formatting error:', error);
            statusIndicator.textContent = 'Formatting failed';
        }
    }
    
    // Copy to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            return false;
        }
    }
    
    // Event Listeners
    recordButton.addEventListener('click', toggleRecording);
    
    copyBengaliButton.addEventListener('click', () => {
        copyToClipboard(bengaliTextElement.textContent)
            .then(success => {
                if (success) {
                    copyBengaliButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBengaliButton.innerHTML = '<span class="icon">📋</span> Copy Bengali';
                    }, 2000);
                }
            });
    });
    
    copyEnglishButton.addEventListener('click', () => {
        copyToClipboard(englishTextElement.textContent)
            .then(success => {
                if (success) {
                    copyEnglishButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyEnglishButton.innerHTML = '<span class="icon">📋</span> Copy English';
                    }, 2000);
                }
            });
    });
    
    translateToggle.addEventListener('change', () => {
        if (translateToggle.checked && rawRecognizedText.trim()) {
            handleTranslation();
        } else {
            // Clear translation when toggle is off
            if (detectedLanguage === 'bn') {
                englishTextElement.textContent = '';
            } else {
                bengaliTextElement.textContent = '';
            }
        }
    });
    
    formatOrderButton.addEventListener('click', formatBusinessOrder);
    
    // Initialize
    if (setupSpeechRecognition()) {
        statusIndicator.textContent = 'Ready';
    } else {
        recordButton.disabled = true;
        statusIndicator.textContent = 'Speech recognition unavailable';
    }
});