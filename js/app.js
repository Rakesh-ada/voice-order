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
    let rawBengaliText = '';
    let lastFinalTranscript = '';
    let debounceTimer;
    let repetitionCache = [];
    const CACHE_SIZE = 5;

    // 1. Setup Bengali-only Speech Recognition
    function setupBengaliRecognition() {
        try {
            if (!('webkitSpeechRecognition' in window)) {
                throw new Error('Speech recognition is not supported in this browser. Please use Chrome.');
            }

            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'bn-IN'; // Bengali only
            
            recognition.onstart = () => {
                statusIndicator.textContent = 'Listening for Bengali...';
                recordButton.classList.add('recording');
            };
            
            recognition.onresult = (event) => {
                clearTimeout(debounceTimer);
                
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                // Display interim results
                if (interimTranscript) {
                    bengaliTextElement.textContent = rawBengaliText + ' ' + interimTranscript;
                }
                
                // Process final results
                if (finalTranscript && finalTranscript !== lastFinalTranscript) {
                    lastFinalTranscript = finalTranscript;
                    
                    // Check for repetition before adding to raw text
                    if (!isRepetition(finalTranscript)) {
                        rawBengaliText += (rawBengaliText ? ' ' : '') + finalTranscript.trim();
                        updateRepetitionCache(finalTranscript);
                        
                        // Debounce processing to avoid rapid consecutive calls
                        debounceTimer = setTimeout(() => {
                            processBengaliText(rawBengaliText);
                        }, 500);
                    }
                }
            };
            
            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                statusIndicator.textContent = 'Error: ' + event.error;
                stopRecording();
            };

            recognition.onend = () => {
                if (isRecording) {
                    recognition.start(); // Restart if still recording
                } else {
                    recordButton.classList.remove('recording');
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

    // Check if current transcript is a repetition
    function isRepetition(transcript) {
        if (repetitionCache.length === 0) return false;
        
        const cleanTranscript = transcript.trim().toLowerCase();
        const lastPhrase = repetitionCache[repetitionCache.length - 1].toLowerCase();
        
        // Simple similarity check (could be enhanced)
        const similarityThreshold = 0.8;
        const similarity = calculateSimilarity(cleanTranscript, lastPhrase);
        
        return similarity > similarityThreshold;
    }

    // Simple similarity calculation (Levenshtein distance based)
    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length <= str2.length ? str1 : str2;
        const longerLength = longer.length;
        
        if (longerLength === 0) return 1.0;
        
        const distance = levenshteinDistance(longer, shorter);
        return (longerLength - distance) / parseFloat(longerLength);
    }

    // Basic Levenshtein distance implementation
    function levenshteinDistance(s, t) {
        if (s.length === 0) return t.length;
        if (t.length === 0) return s.length;

        const matrix = [];
        for (let i = 0; i <= s.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= t.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= s.length; i++) {
            for (let j = 1; j <= t.length; j++) {
                const cost = s.charAt(i - 1) === t.charAt(j - 1) ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[s.length][t.length];
    }

    // Update repetition cache
    function updateRepetitionCache(transcript) {
        repetitionCache.push(transcript.trim());
        if (repetitionCache.length > CACHE_SIZE) {
            repetitionCache.shift();
        }
    }

    // 2. Enhanced Bengali Text Processing with Repetition Removal
    function processBengaliText(text) {
        statusIndicator.textContent = 'Processing...';
        
        // Enhanced client-side cleaning
        const cleanedText = removeRepetitions(text);
        
        bengaliTextElement.textContent = cleanedText;
        statusIndicator.textContent = 'Ready';
        
        // Auto-translate if enabled
        if (translateToggle.checked) {
            translateBengaliToEnglish(cleanedText);
        }
    }

    // Advanced repetition removal
    function removeRepetitions(text) {
        // Split into sentences or phrases
        const phrases = text.split(/[।?!]+/).filter(phrase => phrase.trim().length > 0);
        const uniquePhrases = [];
        const phraseMap = new Map();
        
        phrases.forEach(phrase => {
            const cleanPhrase = phrase.trim();
            let isUnique = true;
            
            // Check against all previous phrases
            phraseMap.forEach((count, existingPhrase) => {
                const similarity = calculateSimilarity(cleanPhrase, existingPhrase);
                if (similarity > 0.7) { // Similarity threshold
                    isUnique = false;
                    phraseMap.set(existingPhrase, count + 1);
                }
            });
            
            if (isUnique) {
                phraseMap.set(cleanPhrase, 1);
                uniquePhrases.push(cleanPhrase);
            }
        });
        
        // Reconstruct text with only unique phrases
        return uniquePhrases.join('। ') + (uniquePhrases.length > 0 ? '।' : '');
    }

    // 3. Translation functions remain the same as previous version
    function translateBengaliToEnglish(bengaliText) {
        // ... (same implementation as before)
    }

    // ... (rest of the code remains the same)
});
