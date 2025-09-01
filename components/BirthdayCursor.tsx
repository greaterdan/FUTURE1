"use client";
import React, { useEffect, useRef, useState } from "react";
import p5 from "p5";

export default function BirthdayCursor() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const sketch = (p: p5) => {
      let mouseX = 0;
      let mouseY = 0;
      let mouseInCanvas = false;
      let t = 0;

      const S = () => Math.min(p.width, p.height) / 1800;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.pixelDensity(1);
        p.noCursor();
        // Hide default cursor on the entire document
        document.body.style.cursor = 'none';
      };

      p.mouseMoved = () => {
        mouseX = p.mouseX;
        mouseY = p.mouseY;
        mouseInCanvas = true;
      };

      p.mousePressed = () => {
        mouseInCanvas = true;
      };

      p.mouseReleased = () => {
        mouseInCanvas = true;
      };

      p.mouseDragged = () => {
        mouseX = p.mouseX;
        mouseY = p.mouseY;
        mouseInCanvas = true;
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.draw = () => {
        p.clear();
        
        // Check if mouse is within canvas bounds
        if (mouseX < 0 || mouseX > p.width || mouseY < 0 || mouseY > p.height) {
          mouseInCanvas = false;
        }
        
        // Draw custom cursor when mouse is in canvas
        if (mouseInCanvas) {
          drawCursor(p);
        }
        
        t += p.deltaTime * 0.001; // seconds
      };

      function drawSystem(g: any, finalPass: boolean) {
        const s = S();

        // canonical radii/offsets
        const R_outer = 520 * s;
        const R_side = 220 * s;
        const R_center = 230 * s;
        const R_tb = 180 * s;
        const R_ves = 170 * s;
        const CX = 270 * s;
        const TOP = 320 * s;

        g.noFill();

        // outer ring (micro pulse)
        const outerPulse = 1 + 0.012 * Math.sin(t * 0.8);
        g.circle(0, 0, R_outer * 2 * outerPulse);

        // side circles (orbit)
        const orbitR = 26 * s;
        const orbitA = t * 1.4;
        g.circle(-CX + orbitR * Math.cos(orbitA), orbitR * Math.sin(orbitA), R_side * 2);
        g.circle(CX + orbitR * Math.cos(orbitA + Math.PI), orbitR * Math.sin(orbitA + Math.PI), R_side * 2);

        // center + vesica pair (lissajous drift)
        const lisX = 14 * s * Math.sin(t * 1.6);
        const lisY = 14 * s * Math.sin(t * 2.3 + Math.PI / 4);
        g.circle(lisX, lisY, R_center * 2);

        const vx = 120 * s;
        const pha = t * 2.1, phb = t * 1.3 + Math.PI / 3;
        g.circle(-vx + 10 * s * Math.sin(pha), 12 * s * Math.sin(phb), R_ves * 2);
        g.circle(vx + 10 * s * Math.sin(pha + Math.PI), 12 * s * Math.sin(phb + Math.PI), R_ves * 2);

        // top & bottom (counterphase bob)
        const bob = 26 * s * Math.sin(t * 1.1);
        g.circle(0, -TOP + bob, R_tb * 2);
        g.circle(0, TOP - bob, R_tb * 2);

        // crosshair (precession)
        const prec = 0.18 * Math.sin(t * 1.25);
        g.push();
        g.rotate(prec);
        g.line(-R_outer, 0, R_outer, 0);
        g.line(0, -R_outer, 0, R_outer);
        g.pop();

        // horizontal bar + posts (gentle swing)
        const barX = 210 * s;
        const swing = 0.12 * Math.sin(t * 1.35 + Math.PI / 6);
        g.push();
        g.rotate(swing);
        g.line(-barX, 0, barX, 0);
        g.line(-barX, 0, -barX, -80 * s);
        g.line(barX, 0, barX, -80 * s);
        g.pop();

        // triangles up/down (counter-rotate to crosshair)
        const apex = 480 * s;
        g.push();
        g.rotate(-prec * 1.2);
        g.triangle(0, -apex, -CX, 0, CX, 0);
        g.triangle(0, apex, -CX, 0, CX, 0);
        g.pop();

        // inner square (breathing)
        const sqBase = 110 * s;
        const sqSize = sqBase * (1 + 0.06 * Math.sin(t * 1.8));
        g.rectMode(p.CENTER);
        g.rect(0, 120 * s + sqSize / 2, sqSize, sqSize);

        // dots (pulsing)
        if (finalPass) {
          g.push();
          g.noStroke();
          const dPulse = 1 + 0.25 * Math.sin(t * 2.2);
          g.fill(255, 220);
          g.circle(-360 * s + 6 * s * Math.sin(t * 1.7), 0, 10 * s * dPulse);
          g.circle(360 * s + 6 * s * Math.sin(t * 1.7 + Math.PI), 0, 10 * s * dPulse);
          g.circle(0, -365 * s + 6 * s * Math.cos(t * 1.9), 8 * s * dPulse);
          g.circle(0, 365 * s + 6 * s * Math.cos(t * 1.9 + Math.PI), 8 * s * dPulse);
          g.pop();
        }
      }

      function drawCursor(p: p5) {
        // Simple, stable cursor drawing
        p.push();
        p.translate(mouseX, mouseY);
        p.scale(0.08);
        
        // Single strong stroke for stability
        p.stroke(255, 255);
        p.strokeWeight(4);
        drawSystem(p, true);
        
        p.pop();
      }
    };

    const instance = new p5(sketch, hostRef.current);
    return () => {
      instance.remove();
      // Restore default cursor when component unmounts
      document.body.style.cursor = 'auto';
    };
  }, []);

  return <div ref={hostRef} className="fixed inset-0 pointer-events-none z-[60]" />;
}
