// IELTS Speaking Practice JavaScript

let currentPrompt = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let timerInterval = null;
let timeLeft = 0;
let isRecording = false;

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
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error saving API key: ' + error);
    }
});

// Start practice
document.getElementById('startPractice').addEventListener('click', async () => {
    const part = document.getElementById('partSelect').value;

    try {
        const response = await fetch('/api/speaking/prompts/list');
        const data = await response.json();
        const prompts = data.prompts || [];

        // Filter by selected part
        const filteredPrompts = prompts.filter(p => p.part == part);

        if (filteredPrompts.length === 0) {
            alert('No prompts available for this part. Please add some prompts first.');
            return;
        }

        // Select random prompt
        currentPrompt = filteredPrompts[Math.floor(Math.random() * filteredPrompts.length)];

        // For Part 1, split questions by newline
        if (part == '1') {
            currentQuestions = currentPrompt.question.split('\n').filter(q => q.trim().length > 0);
            currentQuestionIndex = 0;
        } else {
            currentQuestions = [currentPrompt.question];
            currentQuestionIndex = 0;
        }

        // Show practice area
        document.getElementById('practiceArea').style.display = 'block';
        displayCurrentQuestion();

        // Set timer based on part
        if (part == '1') {
            timeLeft = 300; // 5 minutes for Part 1 (multiple questions)
            document.getElementById('timerLabel').textContent = 'Total Time';
        } else if (part == '2') {
            timeLeft = 60; // 1 minute preparation for Part 2
            document.getElementById('timerLabel').textContent = 'Preparation Time';
            startTimer();
        } else {
            timeLeft = 300; // 5 minutes for Part 3
            document.getElementById('timerLabel').textContent = 'Total Time';
        }

        document.getElementById('timerValue').textContent = formatTime(timeLeft);

        // Show/hide next question button for Part 1
        if (part == '1') {
            document.getElementById('nextQuestionBtn').style.display = 'inline-block';
        } else {
            document.getElementById('nextQuestionBtn').style.display = 'none';
        }

    } catch (error) {
        alert('Error loading prompts: ' + error);
    }
});

// Display current question
function displayCurrentQuestion() {
    const part = document.getElementById('partSelect').value;

    if (part == '1') {
        document.getElementById('questionText').innerHTML = `
            <strong>Question ${currentQuestionIndex + 1} of ${currentQuestions.length}:</strong><br>
            ${currentQuestions[currentQuestionIndex]}
        `;

        // Update next question button
        if (currentQuestionIndex >= currentQuestions.length - 1) {
            document.getElementById('nextQuestionBtn').textContent = 'Finish Questions';
        } else {
            document.getElementById('nextQuestionBtn').textContent = 'Next Question';
        }
    } else {
        document.getElementById('questionText').textContent = currentQuestions[0];
    }
}

// Next question (Part 1 only)
document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    const part = document.getElementById('partSelect').value;

    if (part == '1') {
        currentQuestionIndex++;

        if (currentQuestionIndex >= currentQuestions.length) {
            // All questions answered, stop recording
            if (isRecording) {
                document.getElementById('stopRecording').click();
            }
            document.getElementById('questionText').innerHTML = '<strong>All questions completed!</strong><br>You can now stop recording and get your evaluation.';
            document.getElementById('nextQuestionBtn').style.display = 'none';
        } else {
            displayCurrentQuestion();
        }
    }
});

// Start recording
document.getElementById('startRecording').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
            displayRecordedAudio();
            document.getElementById('getTranscript').style.display = 'inline-block';
            isRecording = false;
        });

        mediaRecorder.start();
        isRecording = true;
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        document.getElementById('recordingIndicator').classList.add('active');

        // Start speaking timer if not already started
        if (!timerInterval) {
            startTimer();
        }

    } catch (error) {
        alert('Error accessing microphone: ' + error);
    }
});

// Stop recording
document.getElementById('stopRecording').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('recordingIndicator').classList.remove('active');
        stopTimer();
    }
});

// Display recorded audio
function displayRecordedAudio() {
    const audioURL = URL.createObjectURL(recordedBlob);
    const audioElement = document.createElement('audio');
    audioElement.src = audioURL;
    audioElement.controls = true;
    audioElement.style.width = '100%';
    audioElement.style.maxWidth = '500px';

    const container = document.getElementById('audioContainer');
    container.innerHTML = '';
    container.appendChild(audioElement);
}

// Get transcript
document.getElementById('getTranscript').addEventListener('click', async () => {
    if (!recordedBlob) {
        alert('No recording available');
        return;
    }

    document.getElementById('getTranscript').disabled = true;
    document.getElementById('getTranscript').textContent = 'Transcribing...';

    try {
        const formData = new FormData();
        formData.append('audio', recordedBlob, 'recording.webm');

        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            document.getElementById('transcriptionContainer').style.display = 'block';
            document.getElementById('transcriptionText').textContent = data.transcript;
            document.getElementById('wordCount').textContent = data.word_count;
            document.getElementById('getEvaluation').style.display = 'inline-block';
        }
    } catch (error) {
        alert('Error transcribing: ' + error);
    } finally {
        document.getElementById('getTranscript').disabled = false;
        document.getElementById('getTranscript').textContent = 'Get Transcript';
    }
});

// Get AI evaluation
document.getElementById('getEvaluation').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value;

    if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
    }

    const transcript = document.getElementById('transcriptionText').textContent;
    const wordCount = parseInt(document.getElementById('wordCount').textContent);

    // For Part 1, show all questions in the evaluation
    const part = document.getElementById('partSelect').value;
    let questionText = currentPrompt.question;
    if (part == '1') {
        questionText = currentQuestions.join('\n');
    }

    document.getElementById('getEvaluation').disabled = true;
    document.getElementById('getEvaluation').textContent = 'Evaluating...';

    try {
        const response = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                task_type: 'speaking',
                part: currentPrompt.part,
                question: questionText,
                transcript: transcript,
                word_count: wordCount,
                speaking_time: 120 // approximate
            })
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            document.getElementById('feedbackContainer').style.display = 'block';
            document.getElementById('feedbackContent').innerHTML = data.feedback;
            document.getElementById('addToVocab').style.display = 'inline-block';
            document.getElementById('newQuestion').style.display = 'inline-block';
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
    const part = document.getElementById('partSelect').value;
    let questionText = currentPrompt.question;
    if (part == '1') {
        questionText = currentQuestions.join(' / ');
    }

    try {
        const response = await fetch('/api/vocabulary_cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: new Date().toLocaleDateString(),
                question: questionText,
                title: `Speaking Part ${currentPrompt.part}`,
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

// New question
document.getElementById('newQuestion').addEventListener('click', () => {
    location.reload();
});

// Timer functions
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timerValue').textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            stopTimer();
            if (isRecording) {
                alert('Time is up!');
            }
        }
    }, 1000);
}

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

// Prompts management
document.getElementById('addPrompt').addEventListener('click', async () => {
    const part = document.getElementById('newPromptPart').value;
    const question = document.getElementById('newPromptQuestion').value;

    if (!question.trim()) {
        alert('Please enter a question');
        return;
    }

    // Validate Part 1 has multiple questions
    if (part == '1') {
        const questions = question.split('\n').filter(q => q.trim().length > 0);
        if (questions.length < 3) {
            alert('Part 1 should have at least 3 questions (one per line)');
            return;
        }
    }

    try {
        const response = await fetch('/api/speaking/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                part: parseInt(part),
                question: question,
                topic: '',
                audio_file: null
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Prompt added!');
            document.getElementById('newPromptQuestion').value = '';
            loadPromptsList();
        }
    } catch (error) {
        alert('Error adding prompt: ' + error);
    }
});

async function loadPromptsList() {
    try {
        const response = await fetch('/api/speaking/prompts/list');
        const data = await response.json();
        const prompts = data.prompts || [];

        const listDiv = document.getElementById('promptsList');

        if (prompts.length === 0) {
            listDiv.innerHTML = '<p style="color: #666;">No prompts yet. Add some above!</p>';
            return;
        }

        let html = '';
        prompts.forEach(prompt => {
            const questionPreview = prompt.part == 1
                ? prompt.question.split('\n').slice(0, 2).join('<br>') + (prompt.question.split('\n').length > 2 ? '<br>...' : '')
                : prompt.question;

            html += `
                <div style="background: white; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd;">
                    <p><strong>Part ${prompt.part}</strong>${prompt.part == 1 ? ` (${prompt.question.split('\n').filter(q => q.trim()).length} questions)` : ''}</p>
                    <p style="margin: 10px 0;">${questionPreview}</p>
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
        const response = await fetch(`/api/speaking/prompts/${id}`, {
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

// Load prompts on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
});
