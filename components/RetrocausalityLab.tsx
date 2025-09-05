"use client";
import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface RetrocausalityLabProps {
  isOpen?: boolean;
  className?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'past' | 'present' | 'future';
  label: string;
  probability?: number;
  connections: string[];
  pulsePhase: number;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  particlePhase: number;
}

export default function RetrocausalityLab({ isOpen = true, className = "" }: RetrocausalityLabProps) {
  const sketchRef = useRef<HTMLDivElement>(null);
  const [predictionData, setPredictionData] = useState({
    marketCap: 0,
    timeline: '1h',
    confidence: 0.75
  });

  useEffect(() => {
    if (!sketchRef.current) return;

    // Clean up any existing instance
    if (sketchRef.current.children.length > 0) {
      sketchRef.current.innerHTML = '';
    }

    const sketch = (p: p5) => {
      let t = 0;
      let nodes: Node[] = [];
      let connections: Connection[] = [];
      let particles: Array<{x: number, y: number, targetX: number, targetY: number, progress: number, color: p5.Color}> = [];
      let gridOffset = 0;

      const canvasSize = () => {
        const el = sketchRef.current;
        return {
          w: el ? el.offsetWidth : 800,
          h: el ? el.offsetHeight : 600
        };
      };

      p.setup = () => {
        const { w, h } = canvasSize();
        p.createCanvas(w, h);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        
        // Initialize neural network nodes
        initializeNodes(w, h);
        initializeConnections();
      };

      p.windowResized = () => {
        const { w, h } = canvasSize();
        p.resizeCanvas(w, h);
        initializeNodes(w, h);
      };

      p.draw = () => {
        t += 0.016; // ~60fps
        gridOffset += 0.5;
        
        // Dark sci-fi background with quantum grid
        drawQuantumGrid();
        
        // Draw neural network
        drawConnections();
        drawNodes();
        drawParticles();
        
        // Draw prediction engine panel
        drawPredictionPanel();
        
        // Update particles
        updateParticles();
      };

      function initializeNodes(w: number, h: number) {
        nodes = [
          // Past nodes (left side)
          { id: 'D1', x: w * 0.15, y: h * 0.3, type: 'past', label: 'D1', probability: 0.8, connections: ['present'], pulsePhase: 0 },
          { id: 'D2', x: w * 0.15, y: h * 0.5, type: 'past', label: 'D2', probability: 0.6, connections: ['present'], pulsePhase: 1.5 },
          { id: 'D3', x: w * 0.15, y: h * 0.7, type: 'past', label: 'D3', probability: 0.4, connections: ['present'], pulsePhase: 3 },
          
          // Present node (center)
          { id: 'present', x: w * 0.5, y: h * 0.5, type: 'present', label: 'Laser', probability: 1.0, connections: ['F1', 'F2', 'F3'], pulsePhase: 0 },
          
          // Future nodes (right side)
          { id: 'F1', x: w * 0.85, y: h * 0.3, type: 'future', label: 'F1', probability: 0.7, connections: [], pulsePhase: 0.8 },
          { id: 'F2', x: w * 0.85, y: h * 0.5, type: 'future', label: 'F2', probability: 0.5, connections: [], pulsePhase: 2.2 },
          { id: 'F3', x: w * 0.85, y: h * 0.7, type: 'future', label: 'F3', probability: 0.3, connections: [], pulsePhase: 3.8 }
        ];
      }

      function initializeConnections() {
        connections = [
          { from: 'D1', to: 'present', strength: 0.8, particlePhase: 0 },
          { from: 'D2', to: 'present', strength: 0.6, particlePhase: 1.5 },
          { from: 'D3', to: 'present', strength: 0.4, particlePhase: 3 },
          { from: 'present', to: 'F1', strength: 0.7, particlePhase: 0.8 },
          { from: 'present', to: 'F2', strength: 0.5, particlePhase: 2.2 },
          { from: 'present', to: 'F3', strength: 0.3, particlePhase: 3.8 }
        ];
      }

      function drawQuantumGrid() {
        p.background(0, 0, 5); // Very dark background
        
        // Quantum geometry grid
        p.stroke(200, 20, 30, 20);
        p.strokeWeight(1);
        
        const gridSize = 40;
        for (let x = 0; x < p.width; x += gridSize) {
          const offsetX = (x + gridOffset) % (gridSize * 2);
          p.line(offsetX, 0, offsetX, p.height);
        }
        
        for (let y = 0; y < p.height; y += gridSize) {
          const offsetY = (y + gridOffset * 0.7) % (gridSize * 2);
          p.line(0, offsetY, p.width, offsetY);
        }
      }

      function drawConnections() {
        connections.forEach(conn => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          
          if (!fromNode || !toNode) return;
          
          // Animated connection with pulsing gradient
          const pulse = p.sin(t * 2 + conn.particlePhase) * 0.5 + 0.5;
          const alpha = 30 + pulse * 40;
          
          // Glowing thread effect
          p.strokeWeight(2 + pulse * 2);
          p.stroke(180, 80, 80, alpha);
          p.line(fromNode.x, fromNode.y, toNode.x, toNode.y);
          
          // Add subtle motion blur effect
          p.strokeWeight(1);
          p.stroke(180, 60, 60, alpha * 0.3);
          p.line(fromNode.x, fromNode.y, toNode.x, toNode.y);
        });
      }

      function drawNodes() {
        nodes.forEach(node => {
          const pulse = p.sin(t * 3 + node.pulsePhase) * 0.3 + 0.7;
          const size = 20 + pulse * 10;
          
          // Node glow effect
          for (let i = 5; i > 0; i--) {
            const alpha = 20 - i * 3;
            const nodeSize = size + i * 3;
            
            if (node.type === 'past') {
              p.fill(120, 80, 60, alpha); // Cyan for past
            } else if (node.type === 'present') {
              p.fill(300, 80, 80, alpha); // Magenta for present
            } else {
              p.fill(60, 80, 60, alpha); // Green for future
            }
            
            p.noStroke();
            p.ellipse(node.x, node.y, nodeSize);
          }
          
          // Main node
          if (node.type === 'past') {
            p.fill(120, 100, 80);
          } else if (node.type === 'present') {
            p.fill(300, 100, 90);
          } else {
            p.fill(60, 100, 80);
          }
          
          p.noStroke();
          p.ellipse(node.x, node.y, size);
          
          // Node label
          p.fill(0, 0, 100);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.text(node.label, node.x, node.y);
          
          // Probability ring for future nodes
          if (node.type === 'future' && node.probability) {
            p.stroke(60, 100, 80, 60);
            p.strokeWeight(2);
            p.noFill();
            const ringSize = size + 15;
            const arcEnd = p.map(node.probability, 0, 1, 0, p.TWO_PI);
            p.arc(node.x, node.y, ringSize, ringSize, 0, arcEnd);
          }
        });
      }

      function drawParticles() {
        particles.forEach(particle => {
          const alpha = p.map(particle.progress, 0, 1, 100, 0);
          p.fill(particle.color);
          p.noStroke();
          p.ellipse(particle.x, particle.y, 3);
        });
      }

      function updateParticles() {
        // Add new particles on connections
        if (p.frameCount % 10 === 0) {
          connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            
            if (fromNode && toNode && Math.random() < conn.strength) {
              particles.push({
                x: fromNode.x,
                y: fromNode.y,
                targetX: toNode.x,
                targetY: toNode.y,
                progress: 0,
                color: p.color(180, 100, 100, 80)
              });
            }
          });
        }
        
        // Update existing particles
        particles = particles.filter(particle => {
          particle.progress += 0.02;
          particle.x = p.lerp(particle.x, particle.targetX, 0.1);
          particle.y = p.lerp(particle.y, particle.targetY, 0.1);
          return particle.progress < 1;
        });
      }

      function drawPredictionPanel() {
        const panelX = p.width - 250;
        const panelY = p.height - 200;
        
        // Holographic card background
        p.fill(0, 0, 10, 80);
        p.stroke(200, 50, 80, 60);
        p.strokeWeight(1);
        p.rect(panelX, panelY, 220, 160, 10);
        
        // Title
        p.fill(0, 0, 100);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text('Prediction Engine', panelX + 15, panelY + 15);
        
        // Market cap prediction
        p.textSize(14);
        p.fill(0, 0, 80);
        p.text('Predicted Market Cap:', panelX + 15, panelY + 45);
        p.fill(60, 100, 80);
        p.text(`$${predictionData.marketCap.toLocaleString()}`, panelX + 15, panelY + 65);
        
        // Timeline slider
        p.fill(0, 0, 60);
        p.text('Timeline:', panelX + 15, panelY + 90);
        
        const timelineOptions = ['10m', '1h', '1d', '1w'];
        timelineOptions.forEach((option, i) => {
          const x = panelX + 15 + i * 45;
          const y = panelY + 110;
          const isActive = option === predictionData.timeline;
          
          if (isActive) {
            p.fill(200, 80, 80, 60);
            p.rect(x - 5, y - 5, 35, 20, 5);
          }
          
          p.fill(0, 0, 100);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.text(option, x + 12, y + 5);
        });
        
        // Confidence indicator
        p.fill(0, 0, 60);
        p.textAlign(p.LEFT, p.TOP);
        p.text('Confidence:', panelX + 15, panelY + 140);
        
        const confidenceWidth = 150;
        const confidenceHeight = 8;
        p.fill(0, 0, 20);
        p.rect(panelX + 15, panelY + 155, confidenceWidth, confidenceHeight, 4);
        
        p.fill(60, 100, 80);
        p.rect(panelX + 15, panelY + 155, confidenceWidth * predictionData.confidence, confidenceHeight, 4);
      }
    };

    const p5Instance = new p5(sketch, sketchRef.current);
    
    return () => {
      p5Instance.remove();
    };
  }, [isOpen, predictionData]);

  return (
    <div className={`w-full h-full ${className}`}>
      <div ref={sketchRef} className="w-full h-full" />
    </div>
  );
}
