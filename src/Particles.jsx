import React, { useRef, useEffect, useCallback } from "react";

const ParticleCanvas = ({
  img,
  width,
  height,
  particleSize = 1,
  particleGap = 3,
  particlesSpeed = 15,
  particlesGravity = 0.3,
  particlesAcceleration = 0.025,
  particlesVelocity = 0.9,
  particlesForce = 10,
  mouseRadius = 80,
  glowFrequency = 0.03,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageInitFunctionRef = useRef(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const parentWidth = container.clientWidth;
    const parentHeight = container.clientHeight;

    if (canvas.width !== parentWidth || canvas.height !== parentHeight) {
      canvas.width = parentWidth;
      canvas.height = parentHeight;
      imageInitFunctionRef.current();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let animationFrameId;

    let particleArray = [];
    const mouse = { x: undefined, y: undefined, radius: mouseRadius };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.x - rect.left;
      mouse.y = event.y - rect.top;
    };

    class Particle {
      constructor(x, y, color) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = particleSize;
        this.baseX = x;
        this.baseY = y;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.gravity = particlesGravity;
        this.maxSpeed = particlesSpeed;
        this.transparent = false;
        this.toggleTransparency();
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.transparent ? 0.15 : 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      update() {
        let dx = this.baseX - this.x;
        let dy = this.baseY - this.y;
        this.acceleration.x = dx * particlesAcceleration;
        this.acceleration.y = dy * particlesAcceleration;
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        if (Math.abs(this.velocity.x) > this.maxSpeed) {
          this.velocity.x = this.maxSpeed * Math.sign(this.velocity.x);
        }
        if (Math.abs(this.velocity.y) > this.maxSpeed) {
          this.velocity.y = this.maxSpeed * Math.sign(this.velocity.y);
        }

        this.velocity.x *= particlesVelocity;
        this.velocity.y *= particlesVelocity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.velocity.y += this.gravity;

        let dxMouse = mouse.x - this.x;
        let dyMouse = mouse.y - this.y;
        let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < mouse.radius) {
          let forceDirectionX = dxMouse / distanceMouse;
          let forceDirectionY = dyMouse / distanceMouse;
          let force =
            ((mouse.radius - distanceMouse) / mouse.radius) * particlesForce;

          this.velocity.x -= force * forceDirectionX;
          this.velocity.y -= force * forceDirectionY;
        }

        if (Math.random() < glowFrequency) {
          this.toggleTransparency();
        }
      }

      toggleTransparency() {
        this.transparent = !this.transparent;
      }
    }

    const init = () => {
      particleArray = [];
      const image = new Image();
      image.src = img;
      image.onload = () => {
        const imgWidth = image.width;
        const imgHeight = image.height;
        const positionX = (canvas.width - imgWidth) / 2;
        const positionY = (canvas.height - imgHeight) / 2;
        ctx.drawImage(image, positionX, positionY);
        const imageData = ctx.getImageData(
          positionX,
          positionY,
          imgWidth,
          imgHeight
        );
        const data = imageData.data;

        const step = particleGap;

        for (let y = 0; y < imgHeight; y += step) {
          for (let x = 0; x < imgWidth; x += step) {
            const index = y * 4 * imgWidth + x * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const alpha = data[index + 3];

            if (alpha > 0) {
              const color = `rgb(${red},${green},${blue})`;
              particleArray.push(
                new Particle(x + positionX, y + positionY, color)
              );
            }
          }
        }
      };
    };

    imageInitFunctionRef.current = init;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particleArray.forEach((particle) => {
        particle.draw();
        particle.update();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    init();
    animate();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      // className={s.container}
      style={{ maxWidth: width, height: height, width: "100%" }}
    >
      <canvas
        style={{ width: "100%", height: "100%" }}
        ref={canvasRef}
      ></canvas>
    </div>
  );
};

export default ParticleCanvas;
