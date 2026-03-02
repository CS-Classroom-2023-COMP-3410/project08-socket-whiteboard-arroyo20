document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('whiteboard');
  const context = canvas.getContext('2d');
  const colorInput = document.getElementById('color-input');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeDisplay = document.getElementById('brush-size-display');
  const clearButton = document.getElementById('clear-button');
  const connectionStatus = document.getElementById('connection-status');
  const userCount = document.getElementById('user-count');

  let boardState = [];

    function resizeCanvas() {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      redrawCanvas(boardState);
    }

    // Initialize canvas size
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Drawing variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Connect to Socket.IO server
    const socket = io('http://localhost:3000');

    // Socket.IO event handlers

    socket.on('connect', () => {
      connectionStatus.textContent = 'Connected';
    });

    socket.on('disconnect', () => {
      connectionStatus.textContent = 'Disconnected';
    });

    socket.on('currentUsers', (count) => {
      userCount.textContent = count;
    });

    socket.on('boardState', (state) => {
      boardState = state;
      redrawCanvas(boardState);
    });

    socket.on('draw', (drawData) => {
      boardState.push(drawData);
      drawLine(
        drawData.x0,
        drawData.y0,
        drawData.x1,
        drawData.y1,
        drawData.color,
        drawData.size
      );
    });

    socket.on('clear', () => {
      boardState = [];
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Canvas mouse event handlers
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Clear button
    clearButton.addEventListener('click', clearCanvas);

    // Brush size display
    brushSizeInput.addEventListener('input', () => {
      brushSizeDisplay.textContent = brushSizeInput.value;
    });

    function startDrawing(e) {
      isDrawing = true;
      const coords = getCoordinates(e);
      lastX = coords.x;
      lastY = coords.y;
    }

    function draw(e) {
      if (!isDrawing) return;

      const coords = getCoordinates(e);

      const drawData = {
        x0: lastX,
        y0: lastY,
        x1: coords.x,
        y1: coords.y,
        color: colorInput.value,
        size: brushSizeInput.value
      };

      socket.emit('draw', drawData);

      lastX = coords.x;
      lastY = coords.y;
    }

    function drawLine(x0, y0, x1, y1, color, size) {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = color;
      context.lineWidth = size;
      context.lineCap = 'round';
      context.stroke();
      context.closePath();
    }

    function stopDrawing() {
      isDrawing = false;
    }

    function clearCanvas() {
      socket.emit('clear');
    }

    function redrawCanvas(state = []) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      state.forEach((line) => {
        drawLine(
          line.x0,
          line.y0,
          line.x1,
          line.y1,
          line.color,
          line.size
        );
      });
    }

    function getCoordinates(e) {
      if (e.touches && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else {
        return {
          x: e.offsetX,
          y: e.offsetY
        };
      }
    }

    function handleTouchStart(e) {
      e.preventDefault();
      startDrawing(e);
    }

    function handleTouchMove(e) {
      e.preventDefault();
      draw(e);
    }
  });