// IELTS Writing Task 1 JavaScript

let currentPrompt = null;
let timerInterval = null;
let timeLeft = 1200; // 20 minutes in seconds

// Tab switching
document.getElementById('practiceTab').addEventListener('click', () => {
    document.getElementById('practiceTab').classList.add('active');
    document.getElementById('promptsTab').classList.remove('active');
    document.getElementById('practiceContent').classList.add('active');
    document.getElementById('promptsContent').classList.remove('active');
});

document.getElementById('promptsTab').addEventListener('click', () => {
    document.getElementById('promptsTab').classList.add('active');
    document.getElementById('practiceTab').classList.remove('active');
    document.getElementById('promptsContent').classList.add('active');
    document.getElementById('practiceContent').classList.remove('active');
    loadPromptsList();
});

// Save API key
document.getElementById('saveApiKeyBtn').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value;
    try {
        const response = await fetch('/save_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey })
        });
        const data = await response.json();
        if (data.success) {
            alert('API key saved!');
        }
    } catch (error) {
        alert('Error saving API key: ' + error);
    }
});

// Word count
document.getElementById('writingArea').addEventListener('input', () => {
    const text = document.getElementById('writingArea').value;
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    document.getElementById('wordCount').textContent = wordCount;
});

// Start practice
document.getElementById('startPractice').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/writing_task1/prompts/list');
        const data = await response.json();
        const prompts = data.prompts || [];

        if (prompts.length === 0) {
            alert('No prompts available. Please add some prompts first.');
            return;
        }

        // Select random prompt
        currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // Hide tabs and show practice area
        document.querySelector('.tab-navigation').style.display = 'none';
        document.querySelector('h1').textContent = 'IELTS Writing Task 1 - Practice Mode';

        document.getElementById('practiceArea').style.display = 'block';
        document.getElementById('taskDescription').textContent = currentPrompt.question || 'Describe the information shown in the diagram.';

        // Show diagram if available
        if (currentPrompt.diagram_file) {
            document.getElementById('diagramImage').src = `/api/writing_task1/diagram/${currentPrompt.diagram_file}`;
            document.getElementById('diagramContainer').style.display = 'block';
        } else {
            document.getElementById('diagramContainer').style.display = 'none';
        }

        // Hide config section and start button
        document.querySelector('.config-section').style.display = 'none';
        document.getElementById('startPractice').closest('.button-container').style.display = 'none';
        document.querySelector('.task-instructions').style.display = 'none';

        // Reset timer
        timeLeft = 1200;
        updateTimerDisplay();

    } catch (error) {
        alert('Error loading prompts: ' + error);
    }
});

// Update timer display
function updateTimerDisplay() {
    document.getElementById('timerValue').textContent = formatTime(timeLeft);
}

// Start timer
document.getElementById('startTimer').addEventListener('click', () => {
    if (timerInterval) {
        stopTimer();
        document.getElementById('startTimer').textContent = 'Start Timer';
        return;
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            stopTimer();
            alert('Time is up!');
        }
    }, 1000);

    document.getElementById('startTimer').textContent = 'Pause Timer';
});

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get AI evaluation
document.getElementById('getEvaluation').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value;
    const text = document.getElementById('writingArea').value;
    const wordCount = parseInt(document.getElementById('wordCount').textContent);

    if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
    }

    if (!text.trim()) {
        alert('Please write your response first');
        return;
    }

    if (wordCount < 150) {
        const proceed = confirm(`Your response is only ${wordCount} words (minimum is 150). Continue with evaluation anyway?`);
        if (!proceed) return;
    }

    document.getElementById('getEvaluation').disabled = true;
    document.getElementById('getEvaluation').textContent = 'Evaluating...';

    try {
        const response = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                task_type: 'writing_task1',
                text: text,
                word_count: wordCount,
                diagram_description: currentPrompt.diagram_description || 'Visual information'
            })
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            document.getElementById('feedbackContainer').style.display = 'block';
            document.getElementById('feedbackContent').innerHTML = data.feedback;
            document.getElementById('addToVocab').style.display = 'inline-block';
        }
    } catch (error) {
        alert('Error getting evaluation: ' + error);
    } finally {
        document.getElementById('getEvaluation').disabled = false;
        document.getElementById('getEvaluation').textContent = 'Get AI Evaluation';
    }
});

// Add to vocabulary
document.getElementById('addToVocab').addEventListener('click', async () => {
    const feedback = document.getElementById('feedbackContent').innerHTML;

    try {
        const response = await fetch('/api/vocabulary_cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: new Date().toLocaleDateString(),
                question: currentPrompt.question,
                title: 'Writing Task 1',
                content: feedback
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Added to vocabulary cards!');
        }
    } catch (error) {
        alert('Error adding to vocabulary: ' + error);
    }
});

// New task
document.getElementById('newTask').addEventListener('click', () => {
    if (confirm('Start a new task? Your current work will be lost.')) {
        document.getElementById('writingArea').value = '';
        document.getElementById('wordCount').textContent = '0';
        document.getElementById('feedbackContainer').style.display = 'none';
        document.getElementById('addToVocab').style.display = 'none';
        timeLeft = 1200;
        stopTimer();
        document.getElementById('startTimer').textContent = 'Start Timer';
        document.getElementById('startPractice').click();
    }
});

// Prompts management
document.getElementById('addPrompt').addEventListener('click', async () => {
    const question = document.getElementById('newPromptQuestion').value;
    const description = document.getElementById('newPromptDescription').value;
    const diagramFile = document.getElementById('diagramUpload').files[0];

    if (!question.trim()) {
        alert('Please enter a task question');
        return;
    }

    let diagramFilename = null;

    // Upload diagram if provided
    if (diagramFile) {
        const formData = new FormData();
        formData.append('diagram', diagramFile);

        try {
            const uploadResponse = await fetch('/api/writing_task1/upload_diagram', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadResponse.json();

            if (uploadData.success) {
                diagramFilename = uploadData.filename;
            } else {
                alert('Error uploading diagram: ' + uploadData.error);
                return;
            }
        } catch (error) {
            alert('Error uploading diagram: ' + error);
            return;
        }
    }

    try {
        const response = await fetch('/api/writing_task1/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                diagram_description: description,
                diagram_file: diagramFilename
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Prompt added!');
            document.getElementById('newPromptQuestion').value = '';
            document.getElementById('newPromptDescription').value = '';
            document.getElementById('diagramUpload').value = '';
            loadPromptsList();
        }
    } catch (error) {
        alert('Error adding prompt: ' + error);
    }
});

async function loadPromptsList() {
    try {
        const response = await fetch('/api/writing_task1/prompts/list');
        const data = await response.json();
        const prompts = data.prompts || [];

        const listDiv = document.getElementById('promptsList');

        if (prompts.length === 0) {
            listDiv.innerHTML = '<p style="color: #666;">No prompts yet. Add some above!</p>';
            return;
        }

        let html = '';
        prompts.forEach(prompt => {
            html += `
                <div style="background: white; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd;">
                    <p><strong>Question:</strong> ${prompt.question}</p>
                    ${prompt.diagram_file ? `<p><strong>Diagram:</strong> ${prompt.diagram_file}</p>` : ''}
                    <button onclick="deletePrompt(${prompt.id})" class="btn btn-danger btn-compact">Delete</button>
                </div>
            `;
        });

        listDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading prompts:', error);
    }
}

async function deletePrompt(id) {
    if (!confirm('Delete this prompt?')) return;

    try {
        const response = await fetch(`/api/writing_task1/prompts/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadPromptsList();
        }
    } catch (error) {
        alert('Error deleting prompt: ' + error);
    }
}
