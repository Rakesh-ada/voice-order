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
        recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'bn-IN'; // Bengali only
        
        recognition.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                rawBengaliText += (rawBengaliText ? ' ' : '') + finalTranscript.trim();
                statusIndicator.textContent = 'Recognized: ' + finalTranscript;
                processBengaliText(rawBengaliText); // Send to Gemini for correction
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            statusIndicator.textContent = 'Error: ' + event.error;
            stopRecording();
        };
    }

    // 2. Process Bengali Text (Remove Repetitions)
    async function processBengaliText(text) {
        statusIndicator.textContent = 'Correcting repetitions...';
        
        try {
            // Gemini prompt for Bengali repetition removal
            const prompt = `
            নিচের বাংলা টেক্সট থেকে অপ্রয়োজনীয় পুনরাবৃত্তি সরিয়ে ফেলুন। শুধুমাত্র সংশোধিত টেক্সট দিন:
            
            "${text}"
            `;
            
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const data = await response.json();
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
            statusIndicator.textContent = 'Error correcting text';
        }
    }

    // 4. Translate Bengali to English
    async function translateBengaliToEnglish(bengaliText) {
        statusIndicator.textContent = 'Translating...';
        
        try {
            const prompt = `
            Translate this Bengali text to English exactly:
            
            "${bengaliText}"
            `;
            
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const data = await response.json();
            englishTextElement.textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            statusIndicator.textContent = 'Translation complete';
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed';
        }
    }

    // Recording control functions
    function startRecording() {
        rawBengaliText = '';
        bengaliTextElement.textContent = '';
        englishTextElement.textContent = '';
        
        recognition.start();
        isRecording = true;
        statusIndicator.textContent = 'Listening for Bengali...';
    }

    function stopRecording() {
        recognition.stop();
        isRecording = false;
        statusIndicator.textContent = 'Processing complete';
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
    setupBengaliRecognition();
    recordButton.addEventListener('click', toggleRecording);
    translateToggle.addEventListener('change', () => {
        if (translateToggle.checked && bengaliTextElement.textContent) {
            translateBengaliToEnglish(bengaliTextElement.textContent);
        } else {
            englishTextElement.textContent = '';
        }
    });
});