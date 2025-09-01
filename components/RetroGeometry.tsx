"use client";
import { useEffect, useRef } from "react";
import p5 from "p5";

interface Props { isSlow?: boolean }

export default function RetroGeometry({ isSlow = false }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const slowRef = useRef<boolean>(isSlow);

  useEffect(() => { slowRef.current = isSlow; }, [isSlow]);

  useEffect(() => {
    if (!hostRef.current) return;

    const sketch = (p: p5) => {
      let gfx: p5.Graphics;
      let t = 0;
      let mouseX = 0;
      let mouseY = 0;
      let mouseInCanvas = false;
      let canvasReady = false;
      let zoomLevel = 0; // 0 = invisible, 1 = full size
      const DENSITY = Math.min(window.devicePixelRatio || 1, 2);

      const S = () => Math.min(p.width, p.height) / 1800; // Smaller scale

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.pixelDensity(DENSITY);
        gfx = p.createGraphics(p.width, p.height);
        gfx.pixelDensity(DENSITY);
        p.noCursor();
        p.background(0);
        canvasReady = true;
      };

      // Restore mouse tracking for the geometric cursor
      p.mouseMoved = () => {
        mouseX = p.mouseX;
        mouseY = p.mouseY;
        mouseInCanvas = true;
      };
      p.mouseDragged = () => {
        mouseX = p.mouseX;
        mouseY = p.mouseY;
        mouseInCanvas = true;
      };
      p.mouseEntered = () => { mouseInCanvas = true; };
      p.mouseExited = () => { mouseInCanvas = false; };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        gfx = p.createGraphics(p.width, p.height);
        gfx.pixelDensity(DENSITY);
      };

      p.draw = () => {
        const slowFactor = slowRef.current ? 0.35 : 1.0;

        p.background(0);
        gfx.clear();
        gfx.push();
        gfx.translate(p.width * 0.75, p.height / 2);

        const currentScale = Math.pow(zoomLevel, 0.8);
        gfx.scale(currentScale);

        gfx.rotate(t * 0.12 * slowFactor);

        for (let glow = 22; glow >= 8; glow -= 7) {
          gfx.stroke(255, 70);
          gfx.strokeWeight(glow);
          drawSystem(gfx, false, t);
        }

        const breathe = p.map(p.sin(t * 1.5 * slowFactor), -1, 1, 0.7, 1.0);
        gfx.stroke(255, 220 * breathe);
        gfx.strokeWeight(2.2 * breathe);
        drawSystem(gfx, true, t);

        gfx.pop();

        const ctx = (p as any).drawingContext as CanvasRenderingContext2D;
        ctx.globalCompositeOperation = "destination-out";
        p.image(gfx, 0, 0);
        ctx.globalCompositeOperation = "source-over";

        const outerGfx = p.createGraphics(p.width, p.height);
        outerGfx.pixelDensity(DENSITY);
        outerGfx.push();
        outerGfx.translate(p.width * 0.75, p.height / 2);
        outerGfx.scale(currentScale);
        outerGfx.rotate(t * 0.12 * slowFactor);
        const R_outer = 720 * S();
        for (let glow = 22; glow >= 8; glow -= 7) {
          outerGfx.stroke(255, 70);
          outerGfx.strokeWeight(glow);
          outerGfx.noFill();
          outerGfx.circle(0, 0, R_outer * 2);
        }
        const frameBreathe = p.map(p.sin(t * 1.2 * slowFactor), -1, 1, 0.8, 1.0);
        outerGfx.stroke(255, 220 * frameBreathe);
        outerGfx.strokeWeight(2.2 * frameBreathe);
        outerGfx.noFill();
        outerGfx.circle(0, 0, R_outer * 2);
        outerGfx.pop();
        ctx.globalCompositeOperation = "destination-out";
        p.image(outerGfx, 0, 0);
        ctx.globalCompositeOperation = "source-over";

        if (zoomLevel < 1) {
          zoomLevel += 0.005 * slowFactor;
        }

        // Draw the geometric cursor when inside the canvas bounds
        if (mouseX >= 0 && mouseX <= p.width && mouseY >= 0 && mouseY <= p.height && mouseInCanvas) {
          drawCursor(p);
        }

        t += p.deltaTime * 0.001 * slowFactor; // seconds
      };

      function drawSystem(g: p5.Graphics | p5, finalPass: boolean, t: number) {
        const s = S();
        const R_outer = 520 * s;
        const R_side = 220 * s;
        const R_center = 230 * s;
        const R_tb = 180 * s;
        const R_ves = 170 * s;
        const CX = 270 * s;
        const TOP = 320 * s;

        g.noFill();
        const outerPulse = 1 + 0.012 * Math.sin(t * 0.8);
        g.circle(0, 0, R_outer * 2 * outerPulse);
        const orbitR = 26 * s;
        const orbitA = t * 1.4;
        g.circle(-CX + orbitR * Math.cos(orbitA), orbitR * Math.sin(orbitA), R_side * 2);
        g.circle(CX + orbitR * Math.cos(orbitA + Math.PI), orbitR * Math.sin(orbitA + Math.PI), R_side * 2);
        const lisX = 14 * s * Math.sin(t * 1.6);
        const lisY = 14 * s * Math.sin(t * 2.3 + Math.PI / 4);
        g.circle(lisX, lisY, R_center * 2);
        const vx = 120 * s;
        const pha = t * 2.1, phb = t * 1.3 + Math.PI / 3;
        g.circle(-vx + 10 * s * Math.sin(pha), 12 * s * Math.sin(phb), R_ves * 2);
        g.circle(vx + 10 * s * Math.sin(pha + Math.PI), 12 * s * Math.sin(phb + Math.PI), R_ves * 2);
        const bob = 26 * s * Math.sin(t * 1.1);
        g.circle(0, -TOP + bob, R_tb * 2);
        g.circle(0, TOP - bob, R_tb * 2);
        const prec = 0.18 * Math.sin(t * 1.25);
        g.push();
        g.rotate(prec);
        g.line(-R_outer, 0, R_outer, 0);
        g.line(0, -R_outer, 0, R_outer);
        g.pop();
        const barX = 210 * s;
        const swing = 0.12 * Math.sin(t * 1.35 + Math.PI / 6);
        g.push();
        g.rotate(swing);
        g.line(-barX, 0, barX, 0);
        g.line(-barX, 0, -barX, -80 * s);
        g.line(barX, 0, barX, -80 * s);
        g.pop();
        const apex = 480 * s;
        g.push();
        g.rotate(-prec * 1.2);
        g.triangle(0, -apex, -CX, 0, CX, 0);
        g.triangle(0, apex, -CX, 0, CX, 0);
        g.pop();
        const sqBase = 110 * s;
        const sqSize = sqBase * (1 + 0.06 * Math.sin(t * 1.8));
        g.rectMode(p.CENTER);
        g.rect(0, 120 * s + sqSize / 2, sqSize, sqSize);
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

      function drawCursor(pInst: p5) {
        pInst.push();
        pInst.translate(mouseX, mouseY);
        pInst.scale(0.08);
        pInst.stroke(255);
        pInst.strokeWeight(3);
        drawSystem(pInst as unknown as p5.Graphics, true, t);
        pInst.pop();
      }
    };

    const instance = new p5(sketch, hostRef.current);
    return () => instance.remove();
  }, []);

  return <div ref={hostRef} className="fixed inset-0 overflow-visible" />;
}
