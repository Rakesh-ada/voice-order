// Test cases for Bengali Voice Order App

// Array of test cases for repetition cleaning
const repetitionTests = [
    {
        name: "English Repetitions", 
        input: "hello hello how how are you you doing today today",
        expectedOutput: "hello how are you doing today"
    },
    {
        name: "Bengali Repetitions",
        input: "আমি আমি তোমাকে তোমাকে ভালোবাসি ভালোবাসি",
        expectedOutput: "আমি তোমাকে ভালোবাসি"
    },
    {
        name: "Mixed Language",
        input: "hello hello আমি আমি কি কি করছি করছি",
        expectedOutput: "hello আমি কি করছি"
    },
    {
        name: "Business Order with Repetitions",
        input: "customer customer name name John Smith Smith order order 5 pizza pizza 3 burger burger delivery delivery address 123 Main St St",
        expectedOutput: "customer name John Smith order 5 pizza 3 burger delivery address 123 Main St"
    }
];

// Function to run test cases
function runRepetitionTests() {
    if (typeof window.processDirectInput !== 'function') {
        console.error('processDirectInput function not available');
        return;
    }

    // Create test UI if not present
    if (!document.getElementById('testResultsContainer')) {
        createTestUI();
    }

    const resultsContainer = document.getElementById('testResults');
    resultsContainer.innerHTML = '';
    
    // Run each test case
    repetitionTests.forEach((test, index) => {
        // Process the input text
        window.processDirectInput(test.input);
        
        // Wait for cleaning to complete
        setTimeout(() => {
            // Get the displayed text
            const bengaliText = document.getElementById('bengaliText').textContent;
            const englishText = document.getElementById('englishText').textContent;
            const outputText = bengaliText || englishText;
            
            // Check if output matches expected
            const isPassing = outputText.includes(test.expectedOutput);
            
            // Display result
            const resultHTML = `
                <div class="test-case ${isPassing ? 'passing' : 'failing'}">
                    <h4>Test ${index + 1}: ${test.name}</h4>
                    <div><strong>Input:</strong> ${test.input}</div>
                    <div><strong>Expected:</strong> ${test.expectedOutput}</div>
                    <div><strong>Got:</strong> ${outputText}</div>
                    <div class="result">${isPassing ? 'PASS' : 'FAIL'}</div>
                </div>
            `;
            resultsContainer.innerHTML += resultHTML;
        }, 3000); // Allow time for API calls to complete
    });
}

// Create test UI
function createTestUI() {
    const testContainer = document.createElement('div');
    testContainer.id = 'testResultsContainer';
    testContainer.className = 'test-container';
    
    testContainer.innerHTML = `
        <h3>Auto-Clean Repetition Tests</h3>
        <button id="runTestsButton" class="btn">Run Tests</button>
        <div id="testResults"></div>
    `;
    
    document.body.appendChild(testContainer);
    
    // Add styling
    const style = document.createElement('style');
    style.textContent = `
        .test-container {
            margin-top: 20px;
            padding: 15px;
            background-color: #242424;
            border-radius: 8px;
            border: 1px solid #333;
        }
        
        .test-case {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #444;
        }
        
        .passing {
            border-left: 4px solid #4caf50;
        }
        
        .failing {
            border-left: 4px solid #f44336;
        }
        
        .result {
            font-weight: bold;
            margin-top: 8px;
        }
        
        .passing .result {
            color: #4caf50;
        }
        
        .failing .result {
            color: #f44336;
        }
    `;
    
    document.head.appendChild(style);
    
    // Add event listener
    document.getElementById('runTestsButton').addEventListener('click', runRepetitionTests);
}

// Initialize tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(createTestUI, 1000); // Delay to ensure main app is initialized
}); 