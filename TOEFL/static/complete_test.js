class CompleteTestManager {
    constructor() {
        this.apiKey = '';
        this.currentTaskIndex = 0;
        this.tasks = [];
        this.results = [];

        // Task content
        this.task1Prompts = [];
        this.task2Reading = '';
        this.task2Audio = '';
        this.task2HasAudio = false;
        this.task3Reading = '';
        this.task3Audio = '';
        this.task3HasAudio = false;
        this.task4Notes = '';
        this.task4Audio = '';
        this.task4HasAudio = false;
        this.task5Reading = '';
        this.task5Audio = '';
        this.task5HasAudio = false;
        this.task6Discussion = null;

        // Prompt system
        this.task2Prompts = [];
        this.task3Prompts = [];
        this.task4Prompts = [];
        this.task5Prompts = [];
        this.task6Prompts = [];
        this.selectedTask2PromptId = null;
        this.selectedTask3PromptId = null;
        this.selectedTask4PromptId = null;
        this.selectedTask5PromptId = null;
        this.selectedTask6PromptId = null;
        this.currentEditingTask2PromptId = null;
        this.currentEditingTask3PromptId = null;
        this.currentEditingTask4PromptId = null;
        this.currentEditingTask5PromptId = null;
        this.currentEditingTask6PromptId = null;

        this.init();
    }

    init() {
        // Tab navigation
        document.getElementById('instructionsTab').addEventListener('click', () => this.switchTab('instructions'));
        document.getElementById('customizationTab').addEventListener('click', () => this.switchTab('customization'));

        // Setup screen elements
        document.getElementById('validateAndStartBtn').addEventListener('click', () => this.validateAndStart());
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => this.saveApiKey());

        // Results screen
        const restartBtn = document.getElementById('restartTestBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }

        // Task 2 modal buttons
        document.getElementById('task2NewBtn').addEventListener('click', () => this.openTask2ModalForNew());
        document.getElementById('task2EditBtn').addEventListener('click', () => this.openTask2ModalForEdit());
        document.getElementById('task2ModalCancelBtn').addEventListener('click', () => this.closeTask2Modal());
        document.getElementById('task2ModalSaveBtn').addEventListener('click', () => this.saveTask2Prompt());
        document.getElementById('task2ModalDeleteBtn').addEventListener('click', () => this.deleteTask2Prompt());
        document.getElementById('task2ModalAudioUpload').addEventListener('change', (e) => this.handleModalAudioUpload(e, 2));

        // Task 3 modal buttons
        document.getElementById('task3NewBtn').addEventListener('click', () => this.openTask3ModalForNew());
        document.getElementById('task3EditBtn').addEventListener('click', () => this.openTask3ModalForEdit());
        document.getElementById('task3ModalCancelBtn').addEventListener('click', () => this.closeTask3Modal());
        document.getElementById('task3ModalSaveBtn').addEventListener('click', () => this.saveTask3Prompt());
        document.getElementById('task3ModalDeleteBtn').addEventListener('click', () => this.deleteTask3Prompt());
        document.getElementById('task3ModalAudioUpload').addEventListener('change', (e) => this.handleModalAudioUpload(e, 3));

        // Task 4 modal buttons
        document.getElementById('task4NewBtn').addEventListener('click', () => this.openTask4ModalForNew());
        document.getElementById('task4EditBtn').addEventListener('click', () => this.openTask4ModalForEdit());
        document.getElementById('task4ModalCancelBtn').addEventListener('click', () => this.closeTask4Modal());
        document.getElementById('task4ModalSaveBtn').addEventListener('click', () => this.saveTask4Prompt());
        document.getElementById('task4ModalDeleteBtn').addEventListener('click', () => this.deleteTask4Prompt());
        document.getElementById('task4ModalAudioUpload').addEventListener('change', (e) => this.handleModalAudioUpload(e, 4));

        // Task 5 buttons - redirect to task5 page for prompt management
        document.getElementById('task5NewBtn').addEventListener('click', () => {
            window.open('/task5', '_blank');
        });
        document.getElementById('task5EditBtn').addEventListener('click', () => {
            window.open('/task5', '_blank');
        });

        // Task 6 buttons - redirect to task6 page for prompt management
        document.getElementById('task6NewBtn').addEventListener('click', () => {
            window.open('/task6', '_blank');
        });
        document.getElementById('task6EditBtn').addEventListener('click', () => {
            window.open('/task6', '_blank');
        });

        // Modal close buttons (X)
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modalId = closeBtn.getAttribute('data-modal');
                document.getElementById(modalId).style.display = 'none';
            });
        });

        // Load prompts
        this.loadTask2Prompts();
        this.loadTask3Prompts();
        this.loadTask4Prompts();
        this.loadTask5Prompts();
        this.loadTask6Prompts();
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);

        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        if (tabName === 'instructions') {
            document.getElementById('instructionsTab').classList.add('active');
            document.getElementById('instructionsContent').classList.add('active');
        } else if (tabName === 'customization') {
            document.getElementById('customizationTab').classList.add('active');
            const customContent = document.getElementById('customizationContent');
            customContent.classList.add('active');
            console.log('Customization content display:', window.getComputedStyle(customContent).display);
        }
    }

    async checkExistingAudio() {
        // Check Task 2
        try {
            const response = await fetch('/api/task/2/content');
            const data = await response.json();
            if (data.audio_path) {
                document.getElementById('task2AudioStatus').textContent = `Uploaded: ${data.audio_path}`;
                document.getElementById('task2AudioStatus').className = 'audio-status success';
                this.task2HasAudio = true;
            }
        } catch (error) {}

        // Check Task 3
        try {
            const response = await fetch('/api/task/3/content');
            const data = await response.json();
            if (data.audio_path) {
                document.getElementById('task3AudioStatus').textContent = `Uploaded: ${data.audio_path}`;
                document.getElementById('task3AudioStatus').className = 'audio-status success';
                this.task3HasAudio = true;
            }
        } catch (error) {}

        // Check Task 4
        try {
            const response = await fetch('/api/task/4/content');
            const data = await response.json();
            if (data.audio_path) {
                document.getElementById('task4AudioStatus').textContent = `Uploaded: ${data.audio_path}`;
                document.getElementById('task4AudioStatus').className = 'audio-status success';
                this.task4HasAudio = true;
            }
        } catch (error) {}
    }

    async loadTask2Prompts() {
        try {
            const response = await fetch('/api/task/2/prompts/list');
            const data = await response.json();
            this.task2Prompts = data.prompts || [];

            const select = document.getElementById('task2PromptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.task2Prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                const preview = prompt.reading.substring(0, 50).replace(/\n/g, ' ');
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => this.handleTask2PromptSelect(e));
        } catch (error) {
            console.log('Error loading Task 2 prompts:', error);
        }
    }

    async loadTask3Prompts() {
        try {
            const response = await fetch('/api/task/3/prompts/list');
            const data = await response.json();
            this.task3Prompts = data.prompts || [];

            const select = document.getElementById('task3PromptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.task3Prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                const preview = prompt.reading.substring(0, 50).replace(/\n/g, ' ');
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => this.handleTask3PromptSelect(e));
        } catch (error) {
            console.log('Error loading Task 3 prompts:', error);
        }
    }

    async loadTask4Prompts() {
        try {
            const response = await fetch('/api/task/4/prompts/list');
            const data = await response.json();
            this.task4Prompts = data.prompts || [];

            const select = document.getElementById('task4PromptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.task4Prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                const preview = prompt.notes ? prompt.notes.substring(0, 50).replace(/\n/g, ' ') : (prompt.audio_file || 'No content');
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => this.handleTask4PromptSelect(e));
        } catch (error) {
            console.log('Error loading Task 4 prompts:', error);
        }
    }

    async loadTask5Prompts() {
        try {
            const response = await fetch('/api/task/5/prompts/list');
            const data = await response.json();
            this.task5Prompts = data.prompts || [];

            const select = document.getElementById('task5PromptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.task5Prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                const preview = prompt.reading.substring(0, 50).replace(/\n/g, ' ');
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => this.handleTask5PromptSelect(e));
        } catch (error) {
            console.log('Error loading Task 5 prompts:', error);
        }
    }

    async loadTask6Prompts() {
        try {
            const response = await fetch('/api/task/6/prompts/list');
            const data = await response.json();
            this.task6Prompts = data.prompts || [];

            const select = document.getElementById('task6PromptSelect');
            select.innerHTML = '<option value="">-- Random Prompt --</option>';

            this.task6Prompts.forEach(prompt => {
                const option = document.createElement('option');
                option.value = prompt.id;
                const preview = prompt.professor_question ? prompt.professor_question.substring(0, 50).replace(/\n/g, ' ') : 'No content';
                option.textContent = `#${prompt.id}: ${preview}...`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => this.handleTask6PromptSelect(e));
        } catch (error) {
            console.log('Error loading Task 6 prompts:', error);
        }
    }

    async handleAudioUpload(event, taskNum) {
        const file = event.target.files[0];
        if (!file) return;

        const statusDiv = document.getElementById(`task${taskNum}AudioStatus`);
        statusDiv.textContent = 'Uploading...';
        statusDiv.className = 'audio-status';

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch(`/api/task/${taskNum}/upload_audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                statusDiv.textContent = `Upload successful: ${data.audio_path}`;
                statusDiv.className = 'audio-status success';

                if (taskNum === 2) this.task2HasAudio = true;
                if (taskNum === 3) this.task3HasAudio = true;
                if (taskNum === 4) this.task4HasAudio = true;
            } else {
                statusDiv.textContent = `Upload failed: ${data.error}`;
                statusDiv.className = 'audio-status error';
            }
        } catch (error) {
            statusDiv.textContent = `Upload error: ${error.message}`;
            statusDiv.className = 'audio-status error';
        }
    }

    handleTask2PromptSelect(event) {
        const promptId = parseInt(event.target.value);
        const display = document.getElementById('task2Display');

        if (promptId) {
            const prompt = this.task2Prompts.find(p => p.id === promptId);
            if (prompt) {
                this.selectedTask2PromptId = promptId;
                display.innerHTML = `<strong>Reading:</strong> ${prompt.reading.substring(0, 100)}...<br><strong>Audio:</strong> ${prompt.audio_file || 'None'}`;
                display.style.color = '#333';
            }
        } else {
            this.selectedTask2PromptId = null;
            display.innerHTML = '<em>Random mode - a prompt will be selected when you start</em>';
            display.style.color = '#666';
        }
    }

    handleTask3PromptSelect(event) {
        const promptId = parseInt(event.target.value);
        const display = document.getElementById('task3Display');

        if (promptId) {
            const prompt = this.task3Prompts.find(p => p.id === promptId);
            if (prompt) {
                this.selectedTask3PromptId = promptId;
                display.innerHTML = `<strong>Reading:</strong> ${prompt.reading.substring(0, 100)}...<br><strong>Audio:</strong> ${prompt.audio_file || 'None'}`;
                display.style.color = '#333';
            }
        } else {
            this.selectedTask3PromptId = null;
            display.innerHTML = '<em>Random mode - a prompt will be selected when you start</em>';
            display.style.color = '#666';
        }
    }

    handleTask4PromptSelect(event) {
        const promptId = parseInt(event.target.value);
        const display = document.getElementById('task4Display');

        if (promptId) {
            const prompt = this.task4Prompts.find(p => p.id === promptId);
            if (prompt) {
                this.selectedTask4PromptId = promptId;
                const notesPreview = prompt.notes ? prompt.notes.substring(0, 100) : 'No notes';
                display.innerHTML = `<strong>Notes:</strong> ${notesPreview}...<br><strong>Audio:</strong> ${prompt.audio_file || 'None'}`;
                display.style.color = '#333';
            }
        } else {
            this.selectedTask4PromptId = null;
            display.innerHTML = '<em>Random mode - a prompt will be selected when you start</em>';
            display.style.color = '#666';
        }
    }

    handleTask5PromptSelect(event) {
        const promptId = parseInt(event.target.value);
        const display = document.getElementById('task5Display');

        if (promptId) {
            const prompt = this.task5Prompts.find(p => p.id === promptId);
            if (prompt) {
                this.selectedTask5PromptId = promptId;
                const readingPreview = prompt.reading ? prompt.reading.substring(0, 100) : 'No reading';
                display.innerHTML = `<strong>Reading:</strong> ${readingPreview}...<br><strong>Audio:</strong> ${prompt.audio_file || 'None'}`;
                display.style.color = '#333';
            }
        } else {
            this.selectedTask5PromptId = null;
            display.innerHTML = '<em>Random mode - a prompt will be selected when you start</em>';
            display.style.color = '#666';
        }
    }

    handleTask6PromptSelect(event) {
        const promptId = parseInt(event.target.value);
        const display = document.getElementById('task6Display');

        if (promptId) {
            const prompt = this.task6Prompts.find(p => p.id === promptId);
            if (prompt) {
                this.selectedTask6PromptId = promptId;
                const questionPreview = prompt.professor_question ? prompt.professor_question.substring(0, 100) : 'No question';
                display.innerHTML = `<strong>Professor's question:</strong> ${questionPreview}...`;
                display.style.color = '#333';
            }
        } else {
            this.selectedTask6PromptId = null;
            display.innerHTML = '<em>Random mode - a prompt will be selected when you start</em>';
            display.style.color = '#666';
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('apiKey').value;
        const button = document.getElementById('saveApiKeyBtn');
        const originalText = button.textContent;

        button.textContent = 'Saving...';
        button.disabled = true;

        try {
            const response = await fetch('/save_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey })
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            button.textContent = 'Error!';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    validateAndStart() {
        // Get API key
        this.apiKey = document.getElementById('apiKey').value;

        // Get real test conditions setting
        this.realTestConditions = document.getElementById('realTestConditions').checked;

        // Get task selection
        const task1Selected = document.getElementById('selectTask1').checked;
        const task2Selected = document.getElementById('selectTask2').checked;
        const task3Selected = document.getElementById('selectTask3').checked;
        const task4Selected = document.getElementById('selectTask4').checked;
        const task5Selected = document.getElementById('selectTask5').checked;
        const task6Selected = document.getElementById('selectTask6').checked;

        // Check if at least one task is selected
        const errorSpan = document.getElementById('taskSelectionError');
        if (!task1Selected && !task2Selected && !task3Selected && !task4Selected && !task5Selected && !task6Selected) {
            errorSpan.style.display = 'block';
            errorSpan.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        errorSpan.style.display = 'none';

        // Get all content
        const task1Text = document.getElementById('task1Prompts').value.trim();
        this.task1Prompts = task1Text.split('\n').filter(p => p.trim());

        // Validate content for selected tasks only
        const missing = [];
        if (task1Selected && this.task1Prompts.length === 0) {
            missing.push('Task 1: Independent Speaking prompts');
        }
        if (task2Selected && this.task2Prompts.length === 0) {
            missing.push('Task 2: No prompts available in the system');
        }
        if (task3Selected && this.task3Prompts.length === 0) {
            missing.push('Task 3: No prompts available in the system');
        }
        if (task4Selected && this.task4Prompts.length === 0) {
            missing.push('Task 4: No prompts available in the system');
        }
        if (task5Selected && this.task5Prompts.length === 0) {
            missing.push('Task 5: No prompts available in the system');
        }
        if (task6Selected && this.task6Prompts.length === 0) {
            missing.push('Task 6: No prompts available in the system');
        }

        // Show warning if missing content
        const warningDiv = document.getElementById('validationWarning');
        const missingList = document.getElementById('missingContentList');

        if (missing.length > 0) {
            missingList.innerHTML = missing.map(m => `<li>${m}</li>`).join('');
            warningDiv.style.display = 'block';
            warningDiv.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Hide warning and start test
        warningDiv.style.display = 'none';

        // Store selected tasks
        this.selectedTasks = [];
        if (task1Selected) this.selectedTasks.push(1);
        if (task2Selected) this.selectedTasks.push(2);
        if (task3Selected) this.selectedTasks.push(3);
        if (task4Selected) this.selectedTasks.push(4);
        if (task5Selected) this.selectedTasks.push(5);
        if (task6Selected) this.selectedTasks.push(6);

        this.startTest();
    }

    startTest() {
        // Hide setup screen
        document.getElementById('setupScreen').style.display = 'none';
        document.getElementById('testScreen').style.display = 'block';

        // Initialize results array
        this.results = [];
        this.currentTaskIndex = 0;

        // Select prompts for tasks 2, 3, 4 only if they are selected
        if (this.selectedTasks.includes(2)) {
            if (this.selectedTask2PromptId) {
                const prompt = this.task2Prompts.find(p => p.id === this.selectedTask2PromptId);
                this.task2Reading = prompt.reading;
                this.task2Audio = prompt.audio_file;
                this.task2HasAudio = !!prompt.audio_file;
            } else {
                const randomPrompt = this.task2Prompts[Math.floor(Math.random() * this.task2Prompts.length)];
                this.task2Reading = randomPrompt.reading;
                this.task2Audio = randomPrompt.audio_file;
                this.task2HasAudio = !!randomPrompt.audio_file;
            }
            console.log('Task 2 audio:', this.task2Audio, 'hasAudio:', this.task2HasAudio);
        }

        if (this.selectedTasks.includes(3)) {
            if (this.selectedTask3PromptId) {
                const prompt = this.task3Prompts.find(p => p.id === this.selectedTask3PromptId);
                this.task3Reading = prompt.reading;
                this.task3Audio = prompt.audio_file;
                this.task3HasAudio = !!prompt.audio_file;
            } else {
                const randomPrompt = this.task3Prompts[Math.floor(Math.random() * this.task3Prompts.length)];
                this.task3Reading = randomPrompt.reading;
                this.task3Audio = randomPrompt.audio_file;
                this.task3HasAudio = !!randomPrompt.audio_file;
            }
            console.log('Task 3 audio:', this.task3Audio, 'hasAudio:', this.task3HasAudio);
        }

        if (this.selectedTasks.includes(4)) {
            if (this.selectedTask4PromptId) {
                const prompt = this.task4Prompts.find(p => p.id === this.selectedTask4PromptId);
                this.task4Notes = prompt.notes || '';
                this.task4Audio = prompt.audio_file;
                this.task4HasAudio = !!prompt.audio_file;
            } else {
                const randomPrompt = this.task4Prompts[Math.floor(Math.random() * this.task4Prompts.length)];
                this.task4Notes = randomPrompt.notes || '';
                this.task4Audio = randomPrompt.audio_file;
                this.task4HasAudio = !!randomPrompt.audio_file;
            }
            console.log('Task 4 audio:', this.task4Audio, 'hasAudio:', this.task4HasAudio);
        }

        if (this.selectedTasks.includes(5)) {
            if (this.selectedTask5PromptId) {
                const prompt = this.task5Prompts.find(p => p.id === this.selectedTask5PromptId);
                this.task5Reading = prompt.reading;
                this.task5Audio = prompt.audio_file;
                this.task5HasAudio = !!prompt.audio_file;
            } else {
                const randomPrompt = this.task5Prompts[Math.floor(Math.random() * this.task5Prompts.length)];
                this.task5Reading = randomPrompt.reading;
                this.task5Audio = randomPrompt.audio_file;
                this.task5HasAudio = !!randomPrompt.audio_file;
            }
        }

        if (this.selectedTasks.includes(6)) {
            if (this.selectedTask6PromptId) {
                const prompt = this.task6Prompts.find(p => p.id === this.selectedTask6PromptId);
                this.task6Discussion = prompt;
            } else {
                const randomPrompt = this.task6Prompts[Math.floor(Math.random() * this.task6Prompts.length)];
                this.task6Discussion = randomPrompt;
            }
        }

        // Start with first task
        this.runNextTask();
    }

    runNextTask() {
        if (this.currentTaskIndex >= this.selectedTasks.length) {
            // All selected tasks completed, show results
            this.showFinalResults();
            return;
        }

        const taskNum = this.selectedTasks[this.currentTaskIndex];
        const displayIndex = this.currentTaskIndex + 1;
        document.getElementById('currentTaskNum').textContent = displayIndex;

        const taskNames = {
            1: 'Independent Speaking',
            2: 'Campus Announcement',
            3: 'Academic Concept',
            4: 'Lecture Summary',
            5: 'Integrated Writing',
            6: 'Academic Discussion'
        };

        const totalTasks = this.selectedTasks.length;
        document.getElementById('currentTaskName').textContent = taskNames[taskNum];

        // Update the progress display
        const progressContainer = document.querySelector('.test-progress h2');
        if (progressContainer) {
            progressContainer.innerHTML = `Task <span id="currentTaskNum">${displayIndex}</span> of ${totalTasks}: <span id="currentTaskName">${taskNames[taskNum]}</span>`;
        }

        // Run the appropriate task
        if (taskNum === 1) {
            this.runTask1();
        } else if (taskNum === 2) {
            this.runTask2();
        } else if (taskNum === 3) {
            this.runTask3();
        } else if (taskNum === 4) {
            this.runTask4();
        } else if (taskNum === 5) {
            this.runTask5();
        } else if (taskNum === 6) {
            this.runTask6();
        }
    }

    runTask1() {
        // Select random prompt
        const randomPrompt = this.task1Prompts[Math.floor(Math.random() * this.task1Prompts.length)];

        const container = document.getElementById('taskContainer');
        container.innerHTML = `
            <div class="task-content">
                <h3>Independent Speaking</h3>
                <div class="toefl-prompt">${randomPrompt}</div>
                <div id="task1Status">Preparing audio...</div>
            </div>
        `;

        // Create audio for prompt, then show timer and record
        this.createPromptAudio(randomPrompt, () => {
            this.showTimerAndRecord(15, 45, randomPrompt, 1);
        });
    }

    async createPromptAudio(text, callback) {
        try {
            const response = await fetch('/create_audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            const audioData = data.audio;
            const audio = new Audio('data:audio/mp3;base64,' + audioData);

            document.getElementById('task1Status').textContent = 'Listen to the question...';

            audio.play();
            audio.onended = callback;

        } catch (error) {
            console.error('Error creating audio:', error);
            callback();
        }
    }

    showTimerAndRecord(prepTime, speakTime, questionText, taskNum) {
        const container = document.getElementById('taskContainer');

        // Stop any audio that might be playing
        const existingAudio = document.getElementById('taskAudio');
        if (existingAudio) {
            existingAudio.pause();
            existingAudio.src = ''; // Clear source to fully stop
        }

        // Replace content (not append) to remove audio player
        container.innerHTML = `
            <div class="toefl-prompt" style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-left: 4px solid #333;">
                ${questionText}
            </div>
            <div class="timer-container" style="display: block;">
                <div class="timer">
                    <span id="timerValue">${prepTime}</span>
                </div>
                <div class="timer-label" id="timerLabel">Preparation Time</div>
            </div>
            <div class="recording-indicator" id="recordingIndicator">Recording in progress...</div>
        `;

        let timeLeft = prepTime;
        const timerValue = document.getElementById('timerValue');
        const timerLabel = document.getElementById('timerLabel');

        const prepInterval = setInterval(() => {
            timeLeft--;
            timerValue.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(prepInterval);
                // Start recording
                timerLabel.textContent = 'Speaking Time';
                document.getElementById('recordingIndicator').style.display = 'block';
                this.startRecordingForTask(speakTime, questionText, taskNum);
            }
        }, 1000);
    }

    async startRecordingForTask(speakTime, questionText, taskNum) {
        const timerValue = document.getElementById('timerValue');
        timerValue.textContent = speakTime;

        try {
            // List available audio input devices for debugging
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            console.log('Available microphones:');
            audioInputs.forEach((device, index) => {
                console.log(`  ${index + 1}. ${device.label || 'Unnamed device'} (${device.deviceId})`);
            });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Log which tracks are active
            const audioTracks = stream.getAudioTracks();
            console.log('Active audio track:', audioTracks[0]?.label || 'Unknown');
            console.log('Audio track settings:', audioTracks[0]?.getSettings());

            // Detect Safari and use appropriate MIME type
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
            }

            console.log('Using MIME type:', mimeType);

            // Create audio level monitor to check if microphone is actually picking up sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            // Check audio levels every second
            const levelCheckInterval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                console.log('Microphone level:', Math.round(average), '/ 255');
                if (average < 5) {
                    console.warn('⚠️ Very low audio level - microphone may not be working!');
                }
            }, 1000);

            const options = { mimeType: mimeType };
            const mediaRecorder = new MediaRecorder(stream, options);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    console.log('Audio chunk collected:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = async () => {
                clearInterval(levelCheckInterval);
                audioContext.close();
                console.log('Recording stopped. Total chunks:', audioChunks.length);
                const audioBlob = new Blob(audioChunks, { mimeType: mimeType });
                console.log('Final audio blob size:', audioBlob.size, 'bytes', 'type:', mimeType);
                await this.processTaskRecording(audioBlob, questionText, taskNum, speakTime);
            };

            // Start recording with timeslice to ensure data is collected regularly
            mediaRecorder.start(1000); // Collect data every second
            console.log('Recording started for task', taskNum, 'with format:', mimeType);

            let timeLeft = speakTime;
            const recordInterval = setInterval(() => {
                timeLeft--;
                timerValue.textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(recordInterval);
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    document.getElementById('recordingIndicator').style.display = 'none';
                }
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check your permissions.');
        }
    }

    async processTaskRecording(audioBlob, questionText, taskNum, totalTime) {
        const container = document.getElementById('taskContainer');
        container.innerHTML = `
            <h3>Task ${taskNum} - Processing...</h3>
            <div class="ai-loading">
                <div class="ai-loading-content">
                    <div class="ai-loading-text">Transcribing and evaluating...</div>
                    <div class="loading-dots">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                    </div>
                </div>
            </div>
        `;

        try {
            // Transcribe
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const transcribeResponse = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!transcribeResponse.ok) {
                throw new Error(`Transcription failed: ${transcribeResponse.statusText}`);
            }

            const transcribeData = await transcribeResponse.json();
            console.log('Transcribe response:', transcribeData);

            // Backend returns 'transcript', not 'text'
            const transcript = transcribeData.transcript || '';
            const wordCount = transcribeData.word_count || (transcript ? transcript.split(/\s+/).filter(w => w.length > 0).length : 0);

            // Get AI evaluation if API key is available
            let evaluation = null;
            if (this.apiKey && !this.realTestConditions) {
                try {
                    container.innerHTML = `
                        <h3>Task ${taskNum} - Getting AI feedback...</h3>
                        <div class="ai-loading">
                            <div class="ai-loading-content">
                                <div class="ai-loading-text">Evaluating your response...</div>
                                <div class="loading-dots">
                                    <div class="loading-dot"></div>
                                    <div class="loading-dot"></div>
                                    <div class="loading-dot"></div>
                                </div>
                            </div>
                        </div>
                    `;

                    const evalResponse = await fetch('/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            api_key: this.apiKey,
                            question: questionText,
                            transcript: transcript,
                            task_number: taskNum
                        })
                    });

                    const evalData = await evalResponse.json();
                    console.log('Evaluation response:', evalData);
                    evaluation = evalData.feedback || evalData.evaluation || 'Evaluation not available';
                } catch (error) {
                    console.error('Error getting evaluation:', error);
                    evaluation = 'Error getting evaluation: ' + error.message;
                }
            }

            // Store result with evaluation
            this.results.push({
                taskNum: taskNum,
                question: questionText,
                transcript: transcript,
                wordCount: wordCount,
                speakingTime: totalTime,
                evaluation: evaluation
            });

            // Show intermediate results if not in real test conditions
            if (!this.realTestConditions) {
                container.innerHTML = `
                    <div class="task-result-container">
                        <h3>Task ${taskNum} Results</h3>

                        <div class="result-section">
                            <h4>Your Response</h4>
                            <p><strong>Word count:</strong> ${wordCount} words | <strong>Speaking time:</strong> ${totalTime}s</p>
                            <div class="transcription-box">
                                ${transcript || 'No transcription available'}
                            </div>
                        </div>

                        ${evaluation ? `
                            <div class="result-section">
                                <h4>AI Evaluation</h4>
                                <div class="evaluation-box">
                                    ${evaluation}
                                </div>
                                <button id="saveVocabBtn" class="btn btn-success" style="margin-top: 15px; width: 100%;">
                                    Save Vocabulary Section to Flashcards
                                </button>
                            </div>
                        ` : ''}

                        <div style="text-align: center; margin-top: 30px;">
                            <button id="continueBtn" class="btn btn-primary btn-large">Continue to Next Task</button>
                        </div>
                    </div>
                `;

                // Wait for user to click continue
                document.getElementById('continueBtn').addEventListener('click', () => {
                    this.currentTaskIndex++;
                    this.runNextTask();
                });

                // Add vocabulary save functionality if button exists
                const saveVocabBtn = document.getElementById('saveVocabBtn');
                if (saveVocabBtn) {
                    saveVocabBtn.addEventListener('click', () => this.saveVocabularyCard(evaluation, taskNum));
                }
            } else {
                // Real test conditions - move to next task automatically
                this.currentTaskIndex++;
                container.innerHTML = `<h3>Task ${taskNum} completed! Moving to next task...</h3>`;
                setTimeout(() => {
                    this.runNextTask();
                }, 2000);
            }

        } catch (error) {
            console.error('Error processing task:', error);
            // Still move to next task even if transcription fails
            this.results.push({
                taskNum: taskNum,
                question: questionText,
                transcript: '[Transcription failed]',
                wordCount: 0,
                speakingTime: totalTime,
                error: error.message
            });

            this.currentTaskIndex++;
            container.innerHTML = `<div class="alert alert-warning">Task ${taskNum} completed (transcription failed). Moving to next task...</div>`;

            setTimeout(() => {
                this.runNextTask();
            }, 2000);
        }
    }

    runTask2() {
        this.runIntegratedTask(2, this.task2Reading, this.task2HasAudio, 50, 30, 60);
    }

    runTask3() {
        this.runIntegratedTask(3, this.task3Reading, this.task3HasAudio, 50, 30, 60);
    }

    async runIntegratedTask(taskNum, readingText, hasAudio, readTime, prepTime, speakTime) {
        const container = document.getElementById('taskContainer');

        // Show reading
        container.innerHTML = `
            <h3>Reading Time: <span id="readTimer">${readTime}</span>s</h3>
            <div class="reading-passage">${readingText}</div>
        `;

        let timeLeft = readTime;
        const readTimer = document.getElementById('readTimer');

        const readInterval = setInterval(() => {
            timeLeft--;
            readTimer.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(readInterval);

                // Show listening or skip to prep
                if (hasAudio) {
                    this.playTaskAudio(taskNum, readingText, prepTime, speakTime);
                } else {
                    this.showNoAudioWarning(taskNum, readingText, prepTime, speakTime);
                }
            }
        }, 1000);
    }

    async playTaskAudio(taskNum, readingText, prepTime, speakTime) {
        const container = document.getElementById('taskContainer');

        // Get the audio file path based on task number
        let audioPath = '';
        if (taskNum === 2) audioPath = this.task2Audio;
        if (taskNum === 3) audioPath = this.task3Audio;

        if (!audioPath) {
            console.error(`No audio path found for task ${taskNum}`);
            this.showNoAudioWarning(taskNum, readingText, prepTime, speakTime);
            return;
        }

        container.innerHTML = `
            <h3>Listen to the audio</h3>
            <audio id="taskAudio" controls autoplay>
                <source src="/api/task/${taskNum}/audio/${audioPath}" type="audio/mpeg">
            </audio>
            <p class="instruction-text">The preparation timer will start when the audio finishes.</p>
            <div style="margin-top: 20px;">
                <button id="skipAudioBtn" class="btn btn-secondary">Skip to Preparation</button>
            </div>
        `;

        const audio = document.getElementById('taskAudio');
        const skipBtn = document.getElementById('skipAudioBtn');

        audio.addEventListener('ended', () => {
            this.showTimerAndRecord(prepTime, speakTime, readingText, taskNum);
        });

        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <p><strong>Audio file not available</strong></p>
                    <p>The audio file could not be loaded. You can continue to the preparation phase.</p>
                    <button id="continueAfterError" class="btn btn-primary">Continue to Preparation</button>
                </div>
            `;
            document.getElementById('continueAfterError').addEventListener('click', () => {
                this.showTimerAndRecord(prepTime, speakTime, readingText, taskNum);
            });
        });

        skipBtn.addEventListener('click', () => {
            audio.pause();
            this.showTimerAndRecord(prepTime, speakTime, readingText, taskNum);
        });
    }

    showNoAudioWarning(taskNum, readingText, prepTime, speakTime) {
        const container = document.getElementById('taskContainer');
        container.innerHTML = `
            <div class="no-api-warning">
                No audio available for this task. Proceeding to preparation phase...
            </div>
        `;

        setTimeout(() => {
            this.showTimerAndRecord(prepTime, speakTime, readingText, taskNum);
        }, 3000);
    }

    runTask4() {
        // Task 4: Lecture only, no reading
        const container = document.getElementById('taskContainer');

        if (this.task4HasAudio && this.task4Audio) {
            container.innerHTML = `
                <h3>Listen to the lecture</h3>
                <audio id="taskAudio" controls autoplay>
                    <source src="/api/task/4/audio/${this.task4Audio}" type="audio/mpeg">
                </audio>
                <p class="instruction-text">The preparation timer will start when the audio finishes.</p>
            `;

            const audio = document.getElementById('taskAudio');
            audio.addEventListener('ended', () => {
                this.showTimerAndRecord(20, 60, 'Lecture Summary', 4);
            });

            audio.addEventListener('error', (e) => {
                console.error('Audio error for Task 4:', e);
                this.showNoAudioWarning(4, 'Lecture Summary', 20, 60);
            });
        } else {
            container.innerHTML = `
                <div class="alert alert-error">
                    Task 4 requires an audio file. This task will be skipped.
                </div>
            `;

            setTimeout(() => {
                this.currentTaskIndex++;
                this.runNextTask();
            }, 3000);
        }
    }

    async showFinalResults() {
        // Hide test screen, show results screen
        document.getElementById('testScreen').style.display = 'none';
        document.getElementById('resultsScreen').style.display = 'block';

        const resultsDiv = document.getElementById('allResults');

        if (!this.apiKey) {
            resultsDiv.innerHTML = `
                <div class="alert alert-error">
                    No API key provided. Transcriptions are available, but AI evaluation was not performed.
                </div>
            `;
        }

        // Display all results
        let resultsHtml = '<h2>All Task Transcriptions</h2>';

        this.results.forEach((result, index) => {
            resultsHtml += `
                <div class="transcription-container" style="margin-bottom: 30px;">
                    <h3>Task ${result.taskNum}</h3>
                    <p><strong>Question:</strong> ${result.question.substring(0, 100)}...</p>
                    <p><strong>Word count:</strong> ${result.wordCount} words</p>
                    <div style="background: white; padding: 15px; border: 1px solid #ddd; margin-top: 10px;">
                        ${result.transcript}
                    </div>
                </div>
            `;
        });

        resultsDiv.innerHTML = resultsHtml;

        // If API key is available, get combined evaluation
        if (this.apiKey) {
            resultsDiv.innerHTML += `
                <div class="ai-loading">
                    <div class="ai-loading-content">
                        <div class="ai-loading-text">Getting comprehensive evaluation...</div>
                        <div class="loading-dots">
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                        </div>
                    </div>
                </div>
            `;

            // Here you could implement a combined evaluation call
            // For now, we'll just remove the loading indicator
            setTimeout(() => {
                const loadingIndicator = resultsDiv.querySelector('.ai-loading');
                if (loadingIndicator) loadingIndicator.remove();

                resultsDiv.innerHTML += `
                    <div class="alert alert-error">
                        Combined AI evaluation is coming soon. Individual task evaluations are available in the single task mode.
                    </div>
                `;
            }, 1000);
        }
    }

    restart() {
        // Reset everything
        this.currentTaskIndex = 0;
        this.results = [];

        // Show setup screen
        document.getElementById('resultsScreen').style.display = 'none';
        document.getElementById('setupScreen').style.display = 'block';
    }

    // ==================== TASK 2 MODAL METHODS ====================

    async openTask2ModalForNew() {
        this.currentEditingTask2PromptId = null;
        document.getElementById('task2ModalTitle').textContent = 'New Task 2 Prompt';
        document.getElementById('task2ModalReadingText').value = '';
        document.getElementById('task2ModalDeleteBtn').style.display = 'none';
        document.getElementById('task2ModalAudioStatus').textContent = '';

        await this.loadTask2AudioList();
        document.getElementById('task2Modal').style.display = 'flex';
    }

    async openTask2ModalForEdit() {
        if (!this.selectedTask2PromptId) {
            alert('Please select a prompt to edit');
            return;
        }

        this.currentEditingTask2PromptId = this.selectedTask2PromptId;
        const prompt = this.task2Prompts.find(p => p.id === this.currentEditingTask2PromptId);

        document.getElementById('task2ModalTitle').textContent = 'Edit Task 2 Prompt';
        document.getElementById('task2ModalReadingText').value = prompt.reading;
        document.getElementById('task2ModalDeleteBtn').style.display = 'block';

        await this.loadTask2AudioList();
        if (prompt.audio_file) {
            document.getElementById('task2ModalAudioSelect').value = prompt.audio_file;
        }

        document.getElementById('task2Modal').style.display = 'flex';
    }

    closeTask2Modal() {
        document.getElementById('task2Modal').style.display = 'none';
        this.currentEditingTask2PromptId = null;
    }

    async loadTask2AudioList() {
        try {
            const response = await fetch('/api/task/2/audio/list');
            const data = await response.json();

            const select = document.getElementById('task2ModalAudioSelect');
            select.innerHTML = '<option value="">-- Select existing audio or upload new --</option>';

            if (data.audio_files) {
                data.audio_files.forEach(filename => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Error loading Task 2 audio list:', error);
        }
    }

    async saveTask2Prompt() {
        const reading = document.getElementById('task2ModalReadingText').value.trim();
        const audioFile = document.getElementById('task2ModalAudioSelect').value;

        if (!reading) {
            alert('Please enter a reading passage');
            return;
        }

        const promptData = {
            reading: reading,
            audio_file: audioFile || null,
            notes: ''
        };

        try {
            let response;
            if (this.currentEditingTask2PromptId) {
                response = await fetch(`/api/task/2/prompts/${this.currentEditingTask2PromptId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            } else {
                response = await fetch('/api/task/2/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            }

            const data = await response.json();

            if (data.success) {
                this.closeTask2Modal();
                await this.loadTask2Prompts();

                if (this.currentEditingTask2PromptId) {
                    document.getElementById('task2PromptSelect').value = this.currentEditingTask2PromptId;
                } else {
                    document.getElementById('task2PromptSelect').value = data.prompt_id;
                }

                const event = { target: document.getElementById('task2PromptSelect') };
                this.handleTask2PromptSelect(event);

                alert('Prompt saved successfully!');
            }
        } catch (error) {
            alert('Error saving prompt: ' + error.message);
        }
    }

    async deleteTask2Prompt() {
        if (!this.currentEditingTask2PromptId) return;

        if (!confirm('Are you sure you want to delete this prompt?')) return;

        try {
            const response = await fetch(`/api/task/2/prompts/${this.currentEditingTask2PromptId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.closeTask2Modal();
                await this.loadTask2Prompts();
                document.getElementById('task2PromptSelect').value = '';
                this.handleTask2PromptSelect({ target: document.getElementById('task2PromptSelect') });
                alert('Prompt deleted successfully!');
            }
        } catch (error) {
            alert('Error deleting prompt: ' + error.message);
        }
    }

    async handleModalAudioUpload(event, taskNum) {
        const file = event.target.files[0];
        if (!file) return;

        const statusDiv = document.getElementById(`task${taskNum}ModalAudioStatus`);
        statusDiv.textContent = 'Uploading...';
        statusDiv.className = 'audio-status';

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch(`/api/task/${taskNum}/upload_audio`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                statusDiv.textContent = `Upload successful: ${data.filename}`;
                statusDiv.className = 'audio-status success';

                // Reload audio list and select the new file
                if (taskNum === 2) {
                    await this.loadTask2AudioList();
                    document.getElementById('task2ModalAudioSelect').value = data.filename;
                } else if (taskNum === 3) {
                    await this.loadTask3AudioList();
                    document.getElementById('task3ModalAudioSelect').value = data.filename;
                } else if (taskNum === 4) {
                    await this.loadTask4AudioList();
                    document.getElementById('task4ModalAudioSelect').value = data.filename;
                }
            } else {
                statusDiv.textContent = `Upload failed: ${data.error}`;
                statusDiv.className = 'audio-status error';
            }
        } catch (error) {
            statusDiv.textContent = `Upload error: ${error.message}`;
            statusDiv.className = 'audio-status error';
        }
    }

    // ==================== TASK 3 MODAL METHODS ====================

    async openTask3ModalForNew() {
        this.currentEditingTask3PromptId = null;
        document.getElementById('task3ModalTitle').textContent = 'New Task 3 Prompt';
        document.getElementById('task3ModalReadingText').value = '';
        document.getElementById('task3ModalQuestionText').value = '';
        document.getElementById('task3ModalDeleteBtn').style.display = 'none';
        document.getElementById('task3ModalAudioStatus').textContent = '';

        await this.loadTask3AudioList();
        document.getElementById('task3Modal').style.display = 'flex';
    }

    async openTask3ModalForEdit() {
        if (!this.selectedTask3PromptId) {
            alert('Please select a prompt to edit');
            return;
        }

        this.currentEditingTask3PromptId = this.selectedTask3PromptId;
        const prompt = this.task3Prompts.find(p => p.id === this.currentEditingTask3PromptId);

        document.getElementById('task3ModalTitle').textContent = 'Edit Task 3 Prompt';
        document.getElementById('task3ModalReadingText').value = prompt.reading;
        document.getElementById('task3ModalQuestionText').value = prompt.question || '';
        document.getElementById('task3ModalDeleteBtn').style.display = 'block';

        await this.loadTask3AudioList();
        if (prompt.audio_file) {
            document.getElementById('task3ModalAudioSelect').value = prompt.audio_file;
        }

        document.getElementById('task3Modal').style.display = 'flex';
    }

    closeTask3Modal() {
        document.getElementById('task3Modal').style.display = 'none';
        this.currentEditingTask3PromptId = null;
    }

    async loadTask3AudioList() {
        try {
            const response = await fetch('/api/task/3/audio/list');
            const data = await response.json();

            const select = document.getElementById('task3ModalAudioSelect');
            select.innerHTML = '<option value="">-- Select existing audio or upload new --</option>';

            if (data.audio_files) {
                data.audio_files.forEach(filename => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Error loading Task 3 audio list:', error);
        }
    }

    async saveTask3Prompt() {
        const reading = document.getElementById('task3ModalReadingText').value.trim();
        const question = document.getElementById('task3ModalQuestionText').value.trim();
        const audioFile = document.getElementById('task3ModalAudioSelect').value;

        if (!reading) {
            alert('Please enter a reading passage');
            return;
        }

        const promptData = {
            reading: reading,
            question: question || '',
            audio_file: audioFile || null,
            notes: ''
        };

        try {
            let response;
            if (this.currentEditingTask3PromptId) {
                response = await fetch(`/api/task/3/prompts/${this.currentEditingTask3PromptId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            } else {
                response = await fetch('/api/task/3/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            }

            const data = await response.json();

            if (data.success) {
                this.closeTask3Modal();
                await this.loadTask3Prompts();

                if (this.currentEditingTask3PromptId) {
                    document.getElementById('task3PromptSelect').value = this.currentEditingTask3PromptId;
                } else {
                    document.getElementById('task3PromptSelect').value = data.prompt_id;
                }

                const event = { target: document.getElementById('task3PromptSelect') };
                this.handleTask3PromptSelect(event);

                alert('Prompt saved successfully!');
            }
        } catch (error) {
            alert('Error saving prompt: ' + error.message);
        }
    }

    async deleteTask3Prompt() {
        if (!this.currentEditingTask3PromptId) return;

        if (!confirm('Are you sure you want to delete this prompt?')) return;

        try {
            const response = await fetch(`/api/task/3/prompts/${this.currentEditingTask3PromptId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.closeTask3Modal();
                await this.loadTask3Prompts();
                document.getElementById('task3PromptSelect').value = '';
                this.handleTask3PromptSelect({ target: document.getElementById('task3PromptSelect') });
                alert('Prompt deleted successfully!');
            }
        } catch (error) {
            alert('Error deleting prompt: ' + error.message);
        }
    }

    // ==================== TASK 4 MODAL METHODS ====================

    async openTask4ModalForNew() {
        this.currentEditingTask4PromptId = null;
        document.getElementById('task4ModalTitle').textContent = 'New Task 4 Prompt';
        document.getElementById('task4ModalQuestionText').value = '';
        document.getElementById('task4ModalNotesText').value = '';
        document.getElementById('task4ModalDeleteBtn').style.display = 'none';
        document.getElementById('task4ModalAudioStatus').textContent = '';

        await this.loadTask4AudioList();
        document.getElementById('task4Modal').style.display = 'flex';
    }

    async openTask4ModalForEdit() {
        if (!this.selectedTask4PromptId) {
            alert('Please select a prompt to edit');
            return;
        }

        this.currentEditingTask4PromptId = this.selectedTask4PromptId;
        const prompt = this.task4Prompts.find(p => p.id === this.currentEditingTask4PromptId);

        document.getElementById('task4ModalTitle').textContent = 'Edit Task 4 Prompt';
        document.getElementById('task4ModalQuestionText').value = prompt.question || '';
        document.getElementById('task4ModalNotesText').value = prompt.notes || '';
        document.getElementById('task4ModalDeleteBtn').style.display = 'block';

        await this.loadTask4AudioList();
        if (prompt.audio_file) {
            document.getElementById('task4ModalAudioSelect').value = prompt.audio_file;
        }

        document.getElementById('task4Modal').style.display = 'flex';
    }

    closeTask4Modal() {
        document.getElementById('task4Modal').style.display = 'none';
        this.currentEditingTask4PromptId = null;
    }

    async loadTask4AudioList() {
        try {
            const response = await fetch('/api/task/4/audio/list');
            const data = await response.json();

            const select = document.getElementById('task4ModalAudioSelect');
            select.innerHTML = '<option value="">-- Select existing audio or upload new --</option>';

            if (data.audio_files) {
                data.audio_files.forEach(filename => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Error loading Task 4 audio list:', error);
        }
    }

    async saveTask4Prompt() {
        const question = document.getElementById('task4ModalQuestionText').value.trim();
        const notes = document.getElementById('task4ModalNotesText').value.trim();
        const audioFile = document.getElementById('task4ModalAudioSelect').value;

        if (!audioFile) {
            alert('Please select or upload an audio file for Task 4');
            return;
        }

        const promptData = {
            question: question || '',
            reading: '',
            audio_file: audioFile,
            notes: notes
        };

        try {
            let response;
            if (this.currentEditingTask4PromptId) {
                response = await fetch(`/api/task/4/prompts/${this.currentEditingTask4PromptId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            } else {
                response = await fetch('/api/task/4/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promptData)
                });
            }

            const data = await response.json();

            if (data.success) {
                this.closeTask4Modal();
                await this.loadTask4Prompts();

                if (this.currentEditingTask4PromptId) {
                    document.getElementById('task4PromptSelect').value = this.currentEditingTask4PromptId;
                } else {
                    document.getElementById('task4PromptSelect').value = data.prompt_id;
                }

                const event = { target: document.getElementById('task4PromptSelect') };
                this.handleTask4PromptSelect(event);

                alert('Prompt saved successfully!');
            }
        } catch (error) {
            alert('Error saving prompt: ' + error.message);
        }
    }

    async deleteTask4Prompt() {
        if (!this.currentEditingTask4PromptId) return;

        if (!confirm('Are you sure you want to delete this prompt?')) return;

        try {
            const response = await fetch(`/api/task/4/prompts/${this.currentEditingTask4PromptId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.closeTask4Modal();
                await this.loadTask4Prompts();
                document.getElementById('task4PromptSelect').value = '';
                this.handleTask4PromptSelect({ target: document.getElementById('task4PromptSelect') });
                alert('Prompt deleted successfully!');
            }
        } catch (error) {
            alert('Error deleting prompt: ' + error.message);
        }
    }

    async saveVocabularyCard(evaluationHTML, taskNum) {
        const button = document.getElementById('saveVocabBtn');
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = 'Saving...';

        try {
            // Extract vocabulary section from evaluation HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(evaluationHTML, 'text/html');

            // Find the Language & Vocabulary section
            const headers = doc.querySelectorAll('h4');
            let vocabSection = null;

            for (let i = 0; i < headers.length; i++) {
                if (headers[i].textContent.toLowerCase().includes('vocabulary') ||
                    headers[i].textContent.toLowerCase().includes('language')) {
                    // Get content until next h4 or end
                    let content = '';
                    let nextElement = headers[i].nextElementSibling;

                    while (nextElement && nextElement.tagName !== 'H4') {
                        content += nextElement.outerHTML;
                        nextElement = nextElement.nextElementSibling;
                    }

                    vocabSection = headers[i].outerHTML + content;
                    break;
                }
            }

            if (!vocabSection) {
                button.textContent = 'No vocabulary section found!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
                return;
            }

            // Save to server
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const response = await fetch('/api/vocabulary_cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    title: `Task ${taskNum} - Vocabulary Review`,
                    content: vocabSection,
                    question: ''
                })
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = '✓ Saved!';
                button.classList.remove('btn-success');
                button.classList.add('btn-secondary');
                setTimeout(() => {
                    button.textContent = 'Saved to Flashcards';
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving vocabulary card:', error);
            button.textContent = 'Error!';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CompleteTestManager();
});
