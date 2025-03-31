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
                recordButton.classList.add('recording');
                recordButton.textContent = '⏹️ Stop';
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

    // 3. Translate Bengali to English using a direct mapping approach
    function translateBengaliToEnglish(bengaliText) {
        if (!bengaliText.trim()) {
            console.log('No text to translate');
            return;
        }

        statusIndicator.textContent = 'Translating...';
        console.log('Translating text:', bengaliText);
        
        try {
            // Use our expanded dictionary for a better direct translation
            const translatedText = directTranslation(bengaliText);
            englishTextElement.textContent = translatedText;
            statusIndicator.textContent = 'Translation complete';
        } catch (error) {
            console.error('Translation error:', error);
            statusIndicator.textContent = 'Translation failed: ' + error.message;
        }
    }
    
    // Enhanced direct translation method with a more comprehensive dictionary
    function directTranslation(bengaliText) {
        // Expanded Bengali to English dictionary for common food ordering phrases
        const bengaliDictionary = {
            // Personal pronouns
            'আমি': 'I',
            'আমার': 'my',
            'আমাকে': 'me',
            'তুমি': 'you',
            'তোমার': 'your',
            'আপনি': 'you (formal)',
            'আপনার': 'your (formal)',
            
            // Common verbs
            'চাই': 'want',
            'দিন': 'give',
            'খাব': 'will eat',
            'নিতে': 'to take',
            'খেতে': 'to eat',
            'দেখতে': 'to see',
            'বলুন': 'say',
            'করতে': 'to do',
            
            // Food items
            'খাবার': 'food',
            'ভাত': 'rice',
            'মাছ': 'fish',
            'মাংস': 'meat',
            'মুরগি': 'chicken',
            'গরু': 'beef',
            'সব্জি': 'vegetable',
            'আলু': 'potato',
            'টমেটো': 'tomato',
            'পেঁয়াজ': 'onion',
            'রসুন': 'garlic',
            'মরিচ': 'chili',
            'ডাল': 'lentil soup',
            'রুটি': 'bread',
            'পরোটা': 'paratha',
            'নান': 'naan',
            
            // Drinks
            'পানি': 'water',
            'চা': 'tea',
            'কফি': 'coffee',
            'দুধ': 'milk',
            'রস': 'juice',
            'পানীয়': 'beverage',
            
            // Fruits
            'ফল': 'fruit',
            'আপেল': 'apple',
            'কলা': 'banana',
            'আম': 'mango',
            'আঙ্গুর': 'grape',
            
            // Quantities
            'এক': 'one',
            'দুই': 'two',
            'তিন': 'three',
            'চার': 'four',
            'পাঁচ': 'five',
            'ছয়': 'six',
            'কম': 'less',
            'বেশি': 'more',
            'কিছু': 'some',
            'অনেক': 'many',
            
            // Common adjectives
            'ভালো': 'good',
            'মন্দ': 'bad',
            'গরম': 'hot',
            'ঠান্ডা': 'cold',
            'মিষ্টি': 'sweet',
            'টক': 'sour',
            'ঝাল': 'spicy',
            'নোনতা': 'salty',
            
            // Restaurant phrases
            'মেনু': 'menu',
            'বিল': 'bill',
            'অর্ডার': 'order',
            'রেস্তোরাঁ': 'restaurant',
            'টেবিল': 'table',
            'চেয়ার': 'chair',
            
            // Common conjunctions and prepositions
            'এবং': 'and',
            'কিন্তু': 'but',
            'সাথে': 'with',
            'ছাড়া': 'without',
            'জন্য': 'for',
            'থেকে': 'from',
            
            // Time-related
            'এখন': 'now',
            'আজ': 'today',
            'কাল': 'tomorrow',
            'গতকাল': 'yesterday'
        };
        
        // Process the text
        let translation = '';
        const sentences = bengaliText.split(/[।?!]/);
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (!sentence) continue;
            
            const words = sentence.split(/\s+/);
            const translatedWords = [];
            
            for (const word of words) {
                // Clean the word of punctuation
                const cleanWord = word.replace(/[,.!?()।'"]/g, '').trim();
                if (!cleanWord) continue;
                
                // Look up in dictionary
                if (bengaliDictionary[cleanWord]) {
                    translatedWords.push(bengaliDictionary[cleanWord]);
                } else {
                    // Keep original if not found
                    translatedWords.push(cleanWord);
                }
            }
            
            // Add the translated sentence
            translation += translatedWords.join(' ');
            
            // Add appropriate punctuation between sentences
            if (i < sentences.length - 1 && translation) {
                translation += '. ';
            }
        }
        
        return translation;
    }

    // Recording control functions
    function startRecording() {
        try {
            // Clear previous content
            rawBengaliText = '';
            bengaliTextElement.textContent = '';
            englishTextElement.textContent = '';
            
            // Start recording
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
                statusIndicator.textContent = 'Processing complete';
                recordButton.classList.remove('recording');
                recordButton.textContent = '🎤 Record Bengali';
                console.log('Recording stopped');
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            statusIndicator.textContent = 'Error stopping recording: ' + error.message;
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
    }
});