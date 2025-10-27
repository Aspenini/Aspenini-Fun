// WebRTC P2P Pong Game
class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        // Game state
        this.isHost = false;
        this.isConnected = false;
        this.isPaused = false;
        
        // WebRTC
        this.pc = null;
        this.dataChannel = null;
        this.state = 'disconnected'; // disconnected, connecting, connected
        
        // Game objects
        this.paddle1 = { x: 20, y: 200, width: 10, height: 80, dy: 0 };
        this.paddle2 = { x: 770, y: 200, width: 10, height: 80, dy: 0 };
        this.ball = { x: 400, y: 250, dx: 5, dy: 5, radius: 10 };
        
        // Score
        this.playerScore = 0;
        this.opponentScore = 0;
        this.winScore = 11;
        
        // Game state
        this.keys = {};
        this.lastUpdate = 0;
        
        // STUN servers
        this.stunServers = [{ urls: 'stun:stun.l.google.com:19302' }];
        
        this.init();
    }
    
    init() {
        this.setupUI();
        this.setupInput();
        this.setupCanvasResize();
        this.gameLoop();
        
        // Update status
        this.updateStatus();
    }
    
    setupUI() {
        // Mode switching
        document.getElementById('hostBtn').addEventListener('click', () => {
            this.switchMode(true);
        });
        
        document.getElementById('joinBtn').addEventListener('click', () => {
            this.switchMode(false);
        });
        
        // Host actions
        document.getElementById('startServerBtn').addEventListener('click', () => {
            this.startServer();
        });
        
        document.getElementById('copyOfferBtn').addEventListener('click', () => {
            this.copyToClipboard('offerCode');
        });
        
        document.getElementById('acceptBtn').addEventListener('click', () => {
            this.acceptConnection();
        });
        
        document.getElementById('rejectBtn').addEventListener('click', () => {
            this.rejectConnection();
        });
        
        document.getElementById('showAcceptBtn').addEventListener('click', () => {
            this.showConnectionRequest();
        });
        
        // Guest actions
        document.getElementById('connectAsGuestBtn').addEventListener('click', () => {
            this.joinGame();
        });
        
        document.getElementById('copyAnswerBtn').addEventListener('click', () => {
            this.copyToClipboard('guestAnswer');
        });
        
        // Make textareas select all on click
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('click', () => {
                textarea.select();
            });
        });
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key.toLowerCase() === 'p' && this.isConnected) {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupCanvasResize() {
        const resizeObserver = new ResizeObserver(() => {
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width !== 0) {
                this.canvas.width = 800;
                this.canvas.height = 500;
            }
        });
        
        resizeObserver.observe(this.canvas);
    }
    
    switchMode(isHost) {
        this.isHost = isHost;
        
        // Reset all boxes
        document.getElementById('startServerBox').style.display = 'block';
        document.getElementById('offerCodeBox').style.display = 'none';
        document.getElementById('connectionRequest').style.display = 'none';
        document.getElementById('answerBoxGuest').style.display = 'none';
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (isHost) {
            document.getElementById('hostBtn').classList.add('active');
            document.getElementById('hostView').style.display = 'block';
            document.getElementById('joinView').style.display = 'none';
        } else {
            document.getElementById('joinBtn').classList.add('active');
            document.getElementById('hostView').style.display = 'none';
            document.getElementById('joinView').style.display = 'block';
        }
    }
    
    updateStatus() {
        const statusEl = document.getElementById('status');
        if (this.state === 'connected') {
            statusEl.textContent = 'Connected';
            statusEl.classList.add('connected');
        } else if (this.state === 'connecting') {
            statusEl.textContent = 'Connecting...';
            statusEl.classList.remove('connected');
        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.classList.remove('connected');
        }
    }
    
    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    copyToClipboard(elementId) {
        const textarea = document.getElementById(elementId);
        textarea.select();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textarea.value).then(() => {
                this.showNotification('✓ Copied to clipboard!');
            });
        } else {
            document.execCommand('copy');
            this.showNotification('✓ Copied!');
        }
    }
    
    async startServer() {
        try {
            this.state = 'connecting';
            this.updateStatus();
            
            // Create peer connection
            this.pc = new RTCPeerConnection({ iceServers: this.stunServers });
            
            // Create data channel as host
            this.dataChannel = this.pc.createDataChannel('game', { ordered: true });
            this.setupDataChannel(this.dataChannel);
            
            // Generate offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            
            // Wait for ICE gathering to complete
            await this.waitForIceGathering();
            
            // Encode and display offer
            const offerCode = btoa(JSON.stringify(this.pc.localDescription));
            document.getElementById('offerCode').value = offerCode;
            
            // Show the offer code box
            document.getElementById('startServerBox').style.display = 'none';
            document.getElementById('offerCodeBox').style.display = 'block';
            
            this.showNotification('✓ Server started! Share your code.');
            
            // Listen for when we need to show the connection request
            this.waitingForAnswer = true;
            
        } catch (error) {
            console.error('Start server error:', error);
            this.showNotification('Failed to start server: ' + error.message);
            this.state = 'disconnected';
            this.updateStatus();
        }
    }
    
    waitForIceGathering() {
        return new Promise((resolve) => {
            if (this.pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                const checkState = () => {
                    if (this.pc.iceGatheringState === 'complete') {
                        this.pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                };
                this.pc.addEventListener('icegatheringstatechange', checkState);
                
                // Timeout after 3 seconds
                setTimeout(() => {
                    this.pc.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }, 3000);
            }
        });
    }
    
    async joinGame() {
        try {
            this.state = 'connecting';
            this.updateStatus();
            
            const offerCode = document.getElementById('receivedOffer').value.trim();
            
            if (!offerCode) {
                this.showNotification('Please paste the host code!');
                this.state = 'disconnected';
                this.updateStatus();
                return;
            }
            
            // Create peer connection
            this.pc = new RTCPeerConnection({ iceServers: this.stunServers });
            
            // Set up data channel handler
            this.pc.ondatachannel = (event) => {
                this.handleDataChannel(event.channel);
            };
            
            // Parse and set remote description (offer)
            const offer = JSON.parse(atob(offerCode));
            await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Create answer
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            
            // Wait for ICE gathering
            await this.waitForIceGathering();
            
            // Encode and display answer
            const answerCode = btoa(JSON.stringify(this.pc.localDescription));
            document.getElementById('guestAnswer').value = answerCode;
            document.getElementById('answerBoxGuest').style.display = 'block';
            
            this.showNotification('Send the answer code to the host!');
            
            // Set up connection state monitoring
            this.pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.pc.iceConnectionState);
                if (this.pc.iceConnectionState === 'connected') {
                    this.state = 'connected';
                    this.isConnected = true;
                    this.updateStatus();
                    this.startGame();
                    this.showNotification('✓ Connected! Game starting...');
                } else if (this.pc.iceConnectionState === 'failed' || this.pc.iceConnectionState === 'disconnected') {
                    this.state = 'disconnected';
                    this.isConnected = false;
                    this.updateStatus();
                }
            };
            
        } catch (error) {
            console.error('Join game error:', error);
            this.showNotification('Failed to join: ' + error.message);
            this.state = 'disconnected';
            this.updateStatus();
        }
    }
    
    async acceptConnection() {
        try {
            const answerCode = document.getElementById('answerCode').value.trim();
            
            if (!answerCode) {
                this.showNotification('Please paste the answer code!');
                return;
            }
            
            // Parse and set remote description (answer)
            const answer = JSON.parse(atob(answerCode));
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            
            this.showNotification('Connecting...');
            
            // Set up connection state monitoring
            this.pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.pc.iceConnectionState);
                if (this.pc.iceConnectionState === 'connected') {
                    this.state = 'connected';
                    this.isConnected = true;
                    this.updateStatus();
                    this.startGame();
                    this.showNotification('✓ Connected! Game starting...');
                } else if (this.pc.iceConnectionState === 'failed' || this.pc.iceConnectionState === 'disconnected') {
                    this.state = 'disconnected';
                    this.isConnected = false;
                    this.updateStatus();
                }
            };
            
        } catch (error) {
            console.error('Accept connection error:', error);
            this.showNotification('Failed to connect: ' + error.message);
        }
    }
    
    rejectConnection() {
        document.getElementById('answerCode').value = '';
        document.getElementById('connectionRequest').style.display = 'none';
        this.showNotification('Connection rejected');
    }
    
    // Show connection request when host has offer shared
    showConnectionRequest() {
        document.getElementById('offerCodeBox').style.display = 'none';
        document.getElementById('connectionRequest').style.display = 'block';
    }
    
    handleDataChannel(channel) {
        this.setupDataChannel(channel);
    }
    
    setupDataChannel(channel) {
        this.dataChannel = channel;
        
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.state = 'connected';
            this.isConnected = true;
            this.updateStatus();
            this.startGame();
            this.showNotification('✓ Connected! Game starting...');
        };
        
        this.dataChannel.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
        
        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.state = 'disconnected';
            this.isConnected = false;
            this.updateStatus();
            this.showNotification('Connection lost');
        };
    }
    
    handleMessage(data) {
        if (data.type === 'paddle') {
            if (this.isHost) {
                this.paddle2.y = data.y;
            } else {
                this.paddle1.y = data.y;
            }
        } else if (data.type === 'ball') {
            this.ball.x = data.x;
            this.ball.y = data.y;
            this.ball.dx = data.dx;
            this.ball.dy = data.dy;
        } else if (data.type === 'score') {
            this.opponentScore = data.score;
            this.updateScoreDisplay();
        } else if (data.type === 'reset') {
            this.resetRound();
        }
    }
    
    sendMessage(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
        }
    }
    
    startGame() {
        document.getElementById('connectionPanel').style.display = 'none';
        document.getElementById('gamePanel').style.display = 'block';
        
        // Reset game
        this.resetGame();
        
        // Start appropriate game loop
        if (this.isHost) {
            this.lastUpdate = performance.now();
            this.hostGameLoop();
        } else {
            this.clientGameLoop();
        }
    }
    
    resetGame() {
        this.playerScore = 0;
        this.opponentScore = 0;
        this.ball.x = 400;
        this.ball.y = 250;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() - 0.5) * 5;
        
        this.paddle1.y = 200;
        this.paddle2.y = 200;
        
        this.updateScoreDisplay();
    }
    
    resetRound() {
        this.ball.x = 400;
        this.ball.y = 250;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() - 0.5) * 5;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.showNotification(this.isPaused ? 'Paused' : 'Resumed');
    }
    
    updateScoreDisplay() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('opponentScore').textContent = this.opponentScore;
    }
    
    hostGameLoop() {
        if (!this.isConnected) return;
        if (this.isPaused) {
            requestAnimationFrame(() => this.hostGameLoop());
            return;
        }
        
        const now = performance.now();
        const dt = Math.min((now - this.lastUpdate) / 16.67, 2); // Cap at 2x for lag spikes
        this.lastUpdate = now;
        
        // Update paddle 1 (local)
        if (this.keys['w'] || this.keys['arrowup']) {
            this.paddle1.y = Math.max(0, this.paddle1.y - 8);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.paddle1.y = Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y + 8);
        }
        
        // Send paddle position to opponent
        this.sendMessage({ type: 'paddle', y: this.paddle1.y });
        
        // Update ball (only host simulates)
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall collisions
        if (this.ball.y <= this.ball.radius || this.ball.y >= this.canvas.height - this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Paddle collisions
        if (this.checkPaddleCollision(this.ball, this.paddle1)) {
            this.ball.dx = Math.abs(this.ball.dx);
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y - this.paddle1.y) / this.paddle1.height;
            this.ball.dy = (hitPos - 0.5) * 10;
        }
        
        if (this.checkPaddleCollision(this.ball, this.paddle2)) {
            this.ball.dx = -Math.abs(this.ball.dx);
            this.ball.x = this.paddle2.x - this.ball.radius;
            
            // Add spin
            const hitPos = (this.ball.y - this.paddle2.y) / this.paddle2.height;
            this.ball.dy = (hitPos - 0.5) * 10;
        }
        
        // Score
        if (this.ball.x < 0) {
            this.opponentScore++;
            this.updateScoreDisplay();
            this.sendMessage({ type: 'score', score: this.opponentScore });
            
            if (this.opponentScore >= this.winScore) {
                this.gameOver(false);
            } else {
                this.resetRound();
                this.sendMessage({ type: 'reset' });
            }
        } else if (this.ball.x > this.canvas.width) {
            this.playerScore++;
            this.updateScoreDisplay();
            
            if (this.playerScore >= this.winScore) {
                this.gameOver(true);
            } else {
                this.resetRound();
                this.sendMessage({ type: 'reset' });
            }
        }
        
        // Send ball state to opponent
        this.sendMessage({
            type: 'ball',
            x: this.ball.x,
            y: this.ball.y,
            dx: this.ball.dx,
            dy: this.ball.dy
        });
        
        requestAnimationFrame(() => this.hostGameLoop());
    }
    
    clientGameLoop() {
        if (!this.isConnected) return;
        if (this.isPaused) {
            requestAnimationFrame(() => this.clientGameLoop());
            return;
        }
        
        // Update paddle 2 (local for guest)
        if (this.keys['w'] || this.keys['arrowup']) {
            this.paddle2.y = Math.max(0, this.paddle2.y - 8);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.paddle2.y = Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y + 8);
        }
        
        // Send paddle position to host
        this.sendMessage({ type: 'paddle', y: this.paddle2.y });
        
        requestAnimationFrame(() => this.clientGameLoop());
    }
    
    checkPaddleCollision(ball, paddle) {
        return ball.x - ball.radius < paddle.x + paddle.width &&
               ball.x + ball.radius > paddle.x &&
               ball.y - ball.radius < paddle.y + paddle.height &&
               ball.y + ball.radius > paddle.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = 'rgba(138, 119, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        if (this.isHost) {
            this.drawPaddle(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height, true);
            this.drawPaddle(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height, false);
        } else {
            // Guest sees reversed
            this.drawPaddle(this.canvas.width - this.paddle1.x - this.paddle1.width, this.paddle1.y, this.paddle1.width, this.paddle1.height, false);
            this.drawPaddle(this.canvas.width - this.paddle2.x - this.paddle2.width, this.paddle2.y, this.paddle2.width, this.paddle2.height, true);
        }
        
        // Draw ball
        this.ctx.fillStyle = '#8a77ff';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#8a77ff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw pause indicator
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(138, 119, 255, 0.8)';
            this.ctx.font = '48px Orbitron, monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawPaddle(x, y, width, height, isLocal) {
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        
        if (isLocal) {
            gradient.addColorStop(0, '#4c9aff');
            gradient.addColorStop(1, '#8a77ff');
        } else {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ee5a6f');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Border glow
        this.ctx.strokeStyle = isLocal ? '#4c9aff' : '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver(winner) {
        this.isPaused = true;
        setTimeout(() => {
            if (confirm(winner ? 'You won! Play again?' : 'You lost! Play again?')) {
                this.playerScore = 0;
                this.opponentScore = 0;
                this.resetGame();
                this.isPaused = false;
            }
        }, 500);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pongGame = new PongGame();
});
