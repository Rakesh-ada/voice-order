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
    
    // Gemini API
    const GEMINI_API_KEY = 'AIzaSyBL_Opc-A1Y1qH8XB8pZ9JDlzx_Ql5rFoM';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
                    // First display the raw text
                    bengaliTextElement.textContent = rawBengaliText;
                    statusIndicator.textContent = 'Recognized: ' + finalTranscript;
                    // Then process it for cleaning
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

    // 2. Process Bengali Text (Remove Repetitions)
    async function processBengaliText(text) {
        statusIndicator.textContent = 'Correcting repetitions...';
        console.log('Processing text:', text);
        
        try {
            // Gemini prompt for Bengali repetition removal
            const prompt = `
            নিচের বাংলা টেক্সট থেকে অপ্রয়োজনীয় পুনরাবৃত্তি সরিয়ে ফেলুন। শুধুমাত্র সংশোধিত টেক্সট দিন:
            
            "${text}"
            `;
            
            console.log('Sending to Gemini API...');
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Gemini API response:', data);
            
            const cleanedText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
            
            // 3. Display Corrected Bengali
            bengaliTextElement.textContent = cleanedText;
            statusIndicator.textContent = 'Repetitions removed';
            
            // 4. Auto-translate if enabled
            if (translateToggle.checked) {
                translateBengaliToEnglish(cleanedText);
            }
        } catch (error) {
            console.error('Gemini error:', error);
            bengaliTextElement.textContent = text; // Fallback to original
            statusIndicator.textContent = 'Error correcting text: ' + error.message;
        }
    }

    // 4. Translate Bengali to English
    async function translateBengaliToEnglish(bengaliText) {
        if (!bengaliText.trim()) {
            console.log('No text to translate');
            return;
        }

        statusIndicator.textContent = 'Translating...';
        console.log('Translating text:', bengaliText);
        
        try {
            const prompt = `
            Translate this Bengali text to English exactly. Keep the meaning and context intact:
            
            "${bengaliText}"
            `;
            
            console.log('Sending to Gemini API for translation...');
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Translation response:', data);
            
            const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (translatedText) {
                englishTextElement.textContent = translatedText.trim();
                statusIndicator.textContent = 'Translation complete';
                console.log('Translation displayed:', translatedText);
            } else {
                throw new Error('No translation received from API');
            }
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed: ' + error.message;
            englishTextElement.textContent = ''; // Clear any partial translation
        }
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