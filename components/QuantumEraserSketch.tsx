"use client";
import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

export default function QuantumEraserSketch() {
  const sketchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sketch = (p: p5) => {
      let t = 0;

      const canvasSize = () => {
        const el = sketchRef.current; 
        return { 
          w: el ? el.offsetWidth : (typeof window !== 'undefined' ? window.innerWidth/2 : 400), 
          h: el ? el.offsetHeight : (typeof window !== 'undefined' ? window.innerHeight/2 : 300) 
        };
      };

      p.setup = () => {
        const { w, h } = canvasSize();
        p.createCanvas(w, h);
      };

      p.windowResized = () => {
        const { w, h } = canvasSize();
        p.resizeCanvas(w, h);
      };

      p.draw = () => {
        t += 0.02;
        p.background(0, 40);
        drawDiagram(p, t);
        // Static prediction labels with zeros (screenshot state)
        p.fill(255); p.noStroke(); p.textSize(12);
        p.text(`Predicted Market Cap:`, p.width - 210, p.height/2 + 230);
        p.text(`1h → $0`, p.width - 210, p.height/2 + 246);
        p.text(`1d → $0`, p.width - 210, p.height/2 + 262);
        p.text(`1w → $0`, p.width - 210, p.height/2 + 278);
      };

      function drawDiagram(p: p5, time: number) {
        p.strokeWeight(2);
        p.stroke(255, 0, 0, 180);
        p.line(60, p.height / 2, 140, p.height / 2);
        drawGlowingCircle(60, p.height / 2, 20, p.color(255, 0, 0));
        textLabel("Laser", 42, p.height / 2 - 30);
        drawSplitter(140, p.height / 2, "BBO");
        drawSplitter(p.width / 2 - 180, p.height / 2 - 90, "BSa");
        drawSplitter(p.width / 2, p.height / 2 - 50, "BSb");
        drawSplitter(p.width / 2 + 80, p.height / 2 + 50, "BSc");
        drawSplitter(p.width / 2 + 190, p.height / 2 - 80, "BSd");
        drawMirror(p.width / 2 - 80, p.height / 2 + 100, "Ma");
        drawMirror(p.width / 2 + 120, p.height / 2 - 160, "Mb");
        drawDetector(p.width - 80, p.height / 2 - 200, "D0");
        drawDetector(p.width / 2 - 260, p.height / 2 + 200, "D1");
        drawDetector(p.width / 2 + 20, p.height / 2 + 200, "D2");
        drawDetector(p.width / 2 - 280, p.height / 2 - 200, "D3");
        drawDetector(p.width / 2 + 240, p.height / 2 - 200, "D4");
        drawGlowingCircle(p.width - 100, p.height / 2 + 140, 58, p.color(0, 200, 255));
        textLabel("Prediction Engine", p.width - 170, p.height / 2 + 210);
      }

      function drawGlowingCircle(x: number, y: number, r: number, c: p5.Color) {
        for (let i = 10; i > 0; i--) {
          p.stroke(p.red(c), p.green(c), p.blue(c), 15);
          p.strokeWeight(i * 2);
          p.ellipse(x, y, r);
        }
        p.stroke(c); p.strokeWeight(2); p.ellipse(x, y, r);
      }
      function drawSplitter(x: number, y: number, label: string) {
        p.push(); p.translate(x, y); p.rotate(p.PI / 4);
        p.stroke(0, 200, 255, 200); p.fill(0, 60);
        p.rectMode(p.CENTER); p.rect(0, 0, 40, 40, 4); p.pop();
        textLabel(label, x - 18, y - 28);
      }
      function drawMirror(x: number, y: number, label: string) {
        p.stroke(150, 255, 150, 220); p.strokeWeight(6);
        p.line(x - 22, y - 22, x + 22, y + 22); textLabel(label, x - 15, y - 25);
      }
      function drawDetector(x: number, y: number, label: string) {
        drawGlowingCircle(x, y, 26, p.color(255)); textLabel(label, x - 18, y + 42);
      }
      function textLabel(txt: string, x: number, y: number) {
        p.noStroke(); p.fill(255); p.textSize(12); p.text(txt, x, y);
      }
    };

    const p5Instance = new p5(sketch, sketchRef.current!);
    return () => { p5Instance.remove(); };
  }, []);

  return <div ref={sketchRef} className="w-full h-full" />;
}
