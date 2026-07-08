const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'script.js');
const data = fs.readFileSync(filePath, 'utf8');

const anchor = '/* ═══════════════════════════════════════════════════════\n   ECOSYSTEM HUB & SPOKE';
const anchorR = '/* ═══════════════════════════════════════════════════════\r\n   ECOSYSTEM HUB & SPOKE';

let startIdx = data.indexOf(anchor);
if (startIdx === -1) {
    startIdx = data.indexOf(anchorR);
}

if (startIdx === -1) {
    console.log("Anchor not found!");
    process.exit(1);
}

const safeBefore = data.substring(0, startIdx);

const replacement = `/* ═══════════════════════════════════════════════════════
   ECOSYSTEM HUB & SPOKE — SVG lines + node reveal (Draggable & Floating)
═══════════════════════════════════════════════════════ */
(function() {
  const section = document.querySelector('.eco-section');
  const svg     = document.getElementById('ecoSvg');
  const hub     = document.getElementById('ecoHub');
  const nodesIn  = [...document.querySelectorAll('.eco-node[data-ring="in"]')];
  const nodesOut = [...document.querySelectorAll('.eco-node[data-ring="out"]')];
  if (!svg || !hub) return;

  function getCenter(el) {
    const sr = svg.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return {
      x: er.left + er.width  / 2 - sr.left,
      y: er.top  + er.height / 2 - sr.top,
    };
  }

  const allNodes = [...nodesIn, ...nodesOut];
  const connections = [];

  // Initialize nodes for drag & float
  allNodes.forEach((node, i) => {
    node.dragX = 0;
    node.dragY = 0;
    node.floatPhase = Math.random() * Math.PI * 2;
    node.floatSpeed = 0.015 + Math.random() * 0.01;
    node.isDragging = false;
    node.isRevealed = false;
    node.style.cursor = 'grab';
    node.style.position = 'relative'; // ensures z-index works well
    node.style.userSelect = 'none'; // prevent text highlight when dragging

    // Pointer events for drag
    node.addEventListener('mousedown', e => onDragStart(e, node));
    node.addEventListener('touchstart', e => onDragStart(e.touches[0], node), { passive: false });
  });

  let activeNode = null;
  let dragOffset = { x: 0, y: 0 };

  function onDragStart(e, node) {
    if (!node.isRevealed) return;
    activeNode = node;
    node.isDragging = true;
    node.style.cursor = 'grabbing';
    node.style.zIndex = 100;
    node.style.transition = 'none'; // Ensure no CSS transition interferes
    
    // Calculate offset relative to current drag coords
    dragOffset.x = e.clientX - node.dragX;
    dragOffset.y = e.clientY - node.dragY;
  }

  function onDragMove(e) {
    if (!activeNode) return;
    activeNode.dragX = e.clientX - dragOffset.x;
    activeNode.dragY = e.clientY - dragOffset.y;
    e.preventDefault();
  }

  function onDragEnd() {
    if (activeNode) {
      activeNode.isDragging = false;
      activeNode.style.cursor = 'grab';
      activeNode.style.zIndex = '';
      activeNode.style.transition = 'opacity 0.5s, border-color 0.25s, background 0.25s'; // Restore hover transitions
      activeNode = null;
    }
  }

  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchmove', e => { if (activeNode) { onDragMove(e.touches[0]); } }, { passive: false });
  window.addEventListener('touchend', onDragEnd);

  function initSVG() {
    svg.innerHTML = '';
    connections.length = 0;

    allNodes.forEach((node, i) => {
      const isOut = node.dataset.ring === 'out';
      
      const gId = 'eg_' + Math.random().toString(36).slice(2);
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gId);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');

      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', isOut ? 'rgba(96,165,250,0.6)' : 'rgba(96,165,250,0.15)');
      const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', isOut ? 'rgba(52,211,153,0.6)' : 'rgba(96,165,250,0.6)');

      grad.appendChild(s1);
      grad.appendChild(s2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', \`url(#\${gId})\`);
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('stroke-linecap', 'round');
      line.style.opacity = '0';
      svg.appendChild(line);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', i % 3 === 0 ? '#fbbf24' : '#60a5fa');
      dot.setAttribute('opacity', '0');
      svg.appendChild(dot);

      connections.push({
        node, line, dot, grad, isOut,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.003
      });
    });
  }

  function drawLoop() {
    const hc = getCenter(hub);

    connections.forEach(conn => {
      const { node, line, dot, grad, isOut } = conn;
      
      if (node.isRevealed) {
        // Floating motion
        if (!node.isDragging) {
          node.floatPhase += node.floatSpeed;
        }
        const floatY = Math.sin(node.floatPhase) * 10; // Float height
        const floatX = Math.cos(node.floatPhase * 0.7) * 5; // Slight horizontal float
        node.style.transform = \`translate(\${node.dragX + floatX}px, \${node.dragY + floatY}px)\`;

        const nc = getCenter(node);

        // Update gradient coords based on node positions
        grad.setAttribute('x1', isOut ? hc.x : nc.x);
        grad.setAttribute('y1', isOut ? hc.y : nc.y);
        grad.setAttribute('x2', isOut ? nc.x : hc.x);
        grad.setAttribute('y2', isOut ? nc.y : hc.y);

        // Update line coords
        line.setAttribute('x1', nc.x);
        line.setAttribute('y1', nc.y);
        line.setAttribute('x2', hc.x);
        line.setAttribute('y2', hc.y);
        line.style.opacity = '1';

        // Update dot position
        conn.t += conn.speed;
        if (conn.t > 1) conn.t -= 1;
        
        let pX, pY;
        if (isOut) {
          // Packet flows hub -> out
          pX = hc.x + (nc.x - hc.x) * conn.t;
          pY = hc.y + (nc.y - hc.y) * conn.t;
        } else {
          // Packet flows in -> hub
          pX = nc.x + (hc.x - nc.x) * conn.t;
          pY = nc.y + (hc.y - nc.y) * conn.t;
        }
        
        dot.setAttribute('cx', pX);
        dot.setAttribute('cy', pY);
        dot.setAttribute('opacity', '0.85');
      }
    });

    requestAnimationFrame(drawLoop);
  }

  initSVG();

  ScrollTrigger.create({
    trigger: '.eco-section',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      allNodes.forEach((node, i) => {
        setTimeout(() => {
          node.classList.add('revealed');
          node.isRevealed = true;
          // Set transition to opacity only to ignore transform css conflicts
          node.style.transition = 'opacity 0.5s, border-color 0.25s, background 0.25s'; 
        }, i * 100);
      });
      // Start the render loop
      requestAnimationFrame(drawLoop);
    },
  });
})();
`;

fs.writeFileSync(filePath, safeBefore + replacement, 'utf8');
console.log("script.js patched successfully.");
