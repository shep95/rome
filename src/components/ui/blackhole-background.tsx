import { useEffect, useRef } from 'react';

export function BlackHoleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const starsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || isInitializedRef.current) return;

    isInitializedRef.current = true;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let h = window.innerHeight;
    let w = window.innerWidth;
    let cw = w;
    let ch = h;
    let maxorbit = 255;
    let centery = ch / 2;
    let centerx = cw / 2;

    const startTime = new Date().getTime();
    let currentTime = 0;

    let expanse = false;
    let returning = false;
    let collapse = false;

    canvas.width = cw;
    canvas.height = ch;

    function setDPI(canvas: HTMLCanvasElement, dpi: number) {
      if (!canvas.style.width) canvas.style.width = canvas.width + 'px';
      if (!canvas.style.height) canvas.style.height = canvas.height + 'px';

      const scaleFactor = dpi / 96;
      canvas.width = Math.ceil(canvas.width * scaleFactor);
      canvas.height = Math.ceil(canvas.height * scaleFactor);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(scaleFactor, scaleFactor);
    }

    function rotate(cx: number, cy: number, x: number, y: number, angle: number): [number, number] {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
      const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
      return [nx, ny];
    }

    setDPI(canvas, 192);

    class Star {
      orbital: number;
      x: number;
      y: number;
      yOrigin: number;
      speed: number;
      rotation: number;
      startRotation: number;
      id: number;
      collapseBonus: number;
      color: string;
      hoverPos: number;
      expansePos: number;
      prevR: number;
      prevX: number;
      prevY: number;
      originalY: number;

      constructor() {
        const rands = [
          Math.random() * (maxorbit / 2) + 1,
          Math.random() * (maxorbit / 2) + maxorbit
        ];

        this.orbital = (rands.reduce((p, c) => p + c, 0) / rands.length);
        this.x = centerx;
        this.y = centery + this.orbital;
        this.yOrigin = centery + this.orbital;
        this.speed = (Math.floor(Math.random() * 2.5) + 1.5) * Math.PI / 180;
        this.rotation = 0;
        this.startRotation = (Math.floor(Math.random() * 360) + 1) * Math.PI / 180;
        this.id = starsRef.current.length;
        this.collapseBonus = this.orbital - (maxorbit * 0.7);
        if (this.collapseBonus < 0) this.collapseBonus = 0;

        this.color = `rgba(171,144,105,${1 - (this.orbital / 255)})`;
        this.hoverPos = centery + (maxorbit / 2) + this.collapseBonus;
        this.expansePos = centery + (this.id % 100) * -10 + (Math.floor(Math.random() * 20) + 1);
        this.prevR = this.startRotation;
        this.prevX = this.x;
        this.prevY = this.y;
        this.originalY = this.yOrigin;

        starsRef.current.push(this);
      }

      draw() {
        if (!context) return;

        if (!expanse && !returning) {
          this.rotation = this.startRotation + (currentTime * this.speed);
          if (!collapse) { // not hovered
            if (this.y > this.yOrigin) {
              this.y -= 2.5;
            }
            if (this.y < this.yOrigin - 4) {
              this.y += (this.yOrigin - this.y) / 10;
            }
          } else { // on hover
            if (this.y > this.hoverPos) {
              this.y -= (this.hoverPos - this.y) / -5;
            }
            if (this.y < this.hoverPos - 4) {
              this.y += 2.5;
            }
          }
        } else if (expanse && !returning) {
          this.rotation = this.startRotation + (currentTime * (this.speed / 2));
          if (this.y > this.expansePos) {
            this.y -= Math.floor(this.expansePos - this.y) / -80;
          }
        } else if (returning) {
          this.rotation = this.startRotation + (currentTime * this.speed);
          if (Math.abs(this.y - this.originalY) > 2) {
            this.y += (this.originalY - this.y) / 50;
          } else {
            this.y = this.originalY;
            this.yOrigin = this.originalY;
          }
        }

        context.save();
        context.fillStyle = this.color;
        context.strokeStyle = this.color;
        context.beginPath();
        const oldPos = rotate(centerx, centery, this.prevX, this.prevY, -this.prevR);
        context.moveTo(oldPos[0], oldPos[1]);
        context.translate(centerx, centery);
        context.rotate(this.rotation);
        context.translate(-centerx, -centery);
        context.lineTo(this.x, this.y);
        context.stroke();
        context.restore();

        this.prevR = this.rotation;
        this.prevX = this.x;
        this.prevY = this.y;
      }
    }

    // Click handler for expansion
    const handleClick = () => {
      if (expanse || returning) return;
      
      collapse = false;
      expanse = true;
      returning = false;

      setTimeout(() => {
        expanse = false;
        returning = true;

        setTimeout(() => {
          returning = false;
        }, 8000);
      }, 25000);
    };

    // Hover handlers
    const handleMouseOver = () => {
      if (expanse === false) {
        collapse = true;
      }
    };

    const handleMouseOut = () => {
      if (expanse === false) {
        collapse = false;
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    function loop() {
      if (!context) return;

      const now = new Date().getTime();
      currentTime = (now - startTime) / 50;

      // Clear canvas completely - no trails
      context.fillStyle = 'rgb(10, 10, 10)';
      context.fillRect(0, 0, cw, ch);

      for (let i = 0; i < starsRef.current.length; i++) {
        if (starsRef.current[i] !== undefined) {
          starsRef.current[i].draw();
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    }

    function init() {
      if (!context) return;
      
      // Fill with app's background color initially
      context.fillStyle = 'rgb(10, 10, 10)';
      context.fillRect(0, 0, cw, ch);
      
      for (let i = 0; i < 2000; i++) {
        new Star();
      }
      
      loop();
    }

    init();

    return () => {
      isInitializedRef.current = false;
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      context.clearRect(0, 0, cw, ch);
      starsRef.current.length = 0;
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer bg-[rgb(10,10,10)] z-0"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
}
