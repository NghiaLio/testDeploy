class AudioAlignmentApp {
    constructor() {
        this.form = document.getElementById('uploadForm');
        this.audioInput = document.getElementById('audioFiles');
        this.transcriptInput = document.getElementById('transcriptFiles');
        this.submitBtn = document.getElementById('submitBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultContainer = document.getElementById('resultContainer');
        this.resultContent = document.getElementById('resultContent');
        this.errorContainer = document.getElementById('errorContainer');
        this.errorContent = document.getElementById('errorContent');
        
        // Batch processing elements
        this.filePreview = document.getElementById('filePreview');
        this.fileList = document.getElementById('fileList');
        this.batchProgress = document.getElementById('batchProgress');
        this.currentFile = document.getElementById('currentFile');
        this.fileCounter = document.getElementById('fileCounter');
        this.batchSummary = document.getElementById('batchSummary');
        this.successCount = document.getElementById('successCount');
        this.failureCount = document.getElementById('failureCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.batchActions = document.getElementById('batchActions');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.downloadZipBtn = document.getElementById('downloadZipBtn');
        
        // Batch processing state
        this.batchResults = [];
        this.currentBatchIndex = 0;
        this.totalFiles = 0;
        
        this.initEventListeners();
        this.setupDragAndDrop();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.audioInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.transcriptInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllResults());
        this.downloadZipBtn.addEventListener('click', () => this.downloadZipResults());
    }
    
    setupDragAndDrop() {
        [this.audioInput, this.transcriptInput].forEach(input => {
            const label = input.closest('.file-label');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                label.addEventListener(eventName, this.preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                label.addEventListener(eventName, () => label.classList.add('dragover'), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                label.addEventListener(eventName, () => label.classList.remove('dragover'), false);
            });
            
            label.addEventListener('drop', (e) => this.handleDrop(e, input), false);
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e, input) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            this.handleFileSelect({ target: input });
        }
    }
    
    handleFileSelect(e) {
        const input = e.target;
        const label = input.closest('.file-label');
        const files = input.files;
        
        if (files.length > 0) {
            label.classList.add('has-file');
            const fileInfo = label.querySelector('.file-info');
            
            if (files.length === 1) {
                fileInfo.textContent = `Đã chọn: ${files[0].name} (${this.formatFileSize(files[0].size)})`;
            } else {
                const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
                fileInfo.textContent = `Đã chọn: ${files.length} files (${this.formatFileSize(totalSize)})`;
            }
            
            this.updateFilePreview();
        } else {
            label.classList.remove('has-file');
            const fileInfo = label.querySelector('.file-info');
            if (input.id === 'audioFiles') {
                fileInfo.textContent = 'Hỗ trợ: WAV, MP3, FLAC, M4A, OGG (có thể chọn nhiều file)';
            } else {
                fileInfo.textContent = 'Hỗ trợ: TXT, LAB (có thể chọn nhiều file)';
            }
            this.updateFilePreview();
        }
        
        this.validateForm();
    }
    
    updateFilePreview() {
        const audioFiles = Array.from(this.audioInput.files);
        const transcriptFiles = Array.from(this.transcriptInput.files);
        
        if (audioFiles.length > 0 || transcriptFiles.length > 0) {
            this.filePreview.style.display = 'block';
            this.fileList.innerHTML = '';
            
            // Show audio files
            audioFiles.forEach(file => {
                this.addFileItem(file, '🎵');
            });
            
            // Show transcript files
            transcriptFiles.forEach(file => {
                this.addFileItem(file, '📄');
            });
        } else {
            this.filePreview.style.display = 'none';
        }
    }
    
    addFileItem(file, icon) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
        `;
        this.fileList.appendChild(fileItem);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    validateForm() {
        const audioFiles = this.audioInput.files;
        const transcriptFiles = this.transcriptInput.files;
        const isValid = audioFiles.length > 0 && transcriptFiles.length > 0;
        
        this.submitBtn.disabled = !isValid;
        return isValid;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showError('Vui lòng chọn cả file âm thanh và transcript');
            return;
        }
        
        const audioFiles = Array.from(this.audioInput.files);
        const transcriptFiles = Array.from(this.transcriptInput.files);
        
        // Validate file types
        for (const file of audioFiles) {
            if (!this.validateAudioFile(file)) {
                this.showError(`File âm thanh không hợp lệ: ${file.name}`);
                return;
            }
        }
        
        for (const file of transcriptFiles) {
            if (!this.validateTranscriptFile(file)) {
                this.showError(`File transcript không hợp lệ: ${file.name}`);
                return;
            }
        }
        
        this.startBatchProcessing(audioFiles, transcriptFiles);
    }
    
    validateAudioFile(file) {
        const validTypes = ['audio/wav', 'audio/wave', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/x-m4a', 'audio/m4a', 'audio/ogg', 'audio/oga'];
        const validExtensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.oga'];
        
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        return hasValidType || hasValidExtension;
    }
    
    validateTranscriptFile(file) {
        const validTypes = ['text/plain'];
        const validExtensions = ['.txt', '.lab'];
        
        const hasValidType = validTypes.includes(file.type) || file.type === '';
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        return hasValidType && hasValidExtension;
    }
    
    async startBatchProcessing(audioFiles, transcriptFiles) {
        this.startLoading();
        this.hideResults();
        this.batchResults = [];
        this.currentBatchIndex = 0;
        
        // Auto-match files if enabled
        const autoMatch = document.getElementById('autoMatch').checked;
        let filePairs = [];
        
        if (autoMatch) {
            filePairs = this.autoMatchFiles(audioFiles, transcriptFiles);
        } else {
            // Manual pairing - use first audio with first transcript, etc.
            const minLength = Math.min(audioFiles.length, transcriptFiles.length);
            for (let i = 0; i < minLength; i++) {
                filePairs.push({
                    audio: audioFiles[i],
                    transcript: transcriptFiles[i]
                });
            }
        }
        
        this.totalFiles = filePairs.length;
        
        if (filePairs.length === 0) {
            this.showError('Không thể ghép cặp files. Vui lòng kiểm tra tên files.');
            this.stopLoading();
            return;
        }
        
        // Process files sequentially
        for (let i = 0; i < filePairs.length; i++) {
            this.currentBatchIndex = i;
            this.updateBatchProgress(i + 1, filePairs.length, filePairs[i].audio.name);
            
            try {
                const result = await this.uploadFilePair(filePairs[i].audio, filePairs[i].transcript);
                this.batchResults.push({
                    success: true,
                    audioName: filePairs[i].audio.name,
                    result: result
                });
            } catch (error) {
                this.batchResults.push({
                    success: false,
                    audioName: filePairs[i].audio.name,
                    error: error.message
                });
            }
            
            this.updateBatchSummary();
        }
        
        this.showBatchResults();
        this.stopLoading();
    }
    
    autoMatchFiles(audioFiles, transcriptFiles) {
        const pairs = [];
        
        for (const audioFile of audioFiles) {
            const audioBaseName = this.getBaseName(audioFile.name);
            
            for (const transcriptFile of transcriptFiles) {
                const transcriptBaseName = this.getBaseName(transcriptFile.name);
                
                if (audioBaseName === transcriptBaseName) {
                    pairs.push({
                        audio: audioFile,
                        transcript: transcriptFile
                    });
                    break;
                }
            }
        }
        
        return pairs;
    }
    
    getBaseName(filename) {
        return filename.replace(/\.[^/.]+$/, "");
    }
    
    async uploadFilePair(audioFile, transcriptFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('transcription', transcriptFile);
        
        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Phản hồi từ server không hợp lệ'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.error || `HTTP ${xhr.status}: ${xhr.statusText}`));
                    } catch (e) {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Lỗi kết nối mạng'));
            });
            
            xhr.addEventListener('timeout', () => {
                reject(new Error('Timeout: Quá trình xử lý mất quá nhiều thời gian'));
            });
            
            xhr.open('POST', '/api/align');
            xhr.responseType = 'text';
            xhr.timeout = 300000; // 5 minutes timeout
            xhr.send(formData);
        });
    }
    
    updateBatchProgress(current, total, filename) {
        const percentage = (current / total) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `Đang xử lý file ${current}/${total}`;
        this.currentFile.textContent = `Đang xử lý: ${filename}`;
        this.fileCounter.textContent = `${current}/${total} files`;
        this.batchProgress.style.display = 'block';
    }
    
    updateBatchSummary() {
        const successCount = this.batchResults.filter(r => r.success).length;
        const failureCount = this.batchResults.filter(r => !r.success).length;
        const pendingCount = this.totalFiles - this.batchResults.length;
        
        this.successCount.textContent = successCount;
        this.failureCount.textContent = failureCount;
        this.pendingCount.textContent = pendingCount;
    }
    
    showBatchResults() {
        this.hideError();
        this.resultContainer.style.display = 'block';
        this.batchSummary.style.display = 'block';
        this.batchActions.style.display = 'block';
        
        let displayText = '📊 Kết quả xử lý hàng loạt:\n\n';
        
        for (const result of this.batchResults) {
            if (result.success) {
                displayText += `✅ ${result.audioName}: Thành công\n`;
                if (result.result.message) {
                    displayText += `   ${result.result.message}\n`;
                }
            } else {
                displayText += `❌ ${result.audioName}: ${result.error}\n`;
            }
            displayText += '\n';
        }
        
        this.resultContent.textContent = displayText;
    }
    
    startLoading() {
        this.submitBtn.disabled = true;
        this.loadingSpinner.style.display = 'block';
        this.progressContainer.style.display = 'block';
        this.updateProgress(0, 'Bắt đầu xử lý hàng loạt...');
    }
    
    stopLoading() {
        this.submitBtn.disabled = false;
        this.loadingSpinner.style.display = 'none';
        this.progressContainer.style.display = 'none';
        this.batchProgress.style.display = 'none';
    }
    
    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }
    
    showError(message) {
        this.hideResults();
        this.errorContainer.style.display = 'block';
        this.errorContent.textContent = message;
    }
    
    hideResults() {
        this.resultContainer.style.display = 'none';
        this.batchActions.style.display = 'none';
        this.batchSummary.style.display = 'none';
    }
    
    hideError() {
        this.errorContainer.style.display = 'none';
    }
    
    downloadAllResults() {
        const successfulResults = this.batchResults.filter(r => r.success);
        
        successfulResults.forEach((result, index) => {
            if (result.result.timestamp_data) {
                const blob = new Blob([result.result.timestamp_data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.getBaseName(result.audioName)}_timestamp.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }
    
    downloadZipResults() {
        // This would require a server endpoint to create ZIP files
        // For now, we'll just download individual files
        this.downloadAllResults();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioAlignmentApp();
});
