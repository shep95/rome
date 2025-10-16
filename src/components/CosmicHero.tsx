import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Particle Ring Component
function ParticleRing() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 800;
  const radius = 3;
  
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.3;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    return positions;
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#c2a084"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Cosmic Wave Particles
function CosmicWave() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 3000;
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      const y = -3 + Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Orange color with variation
      const intensity = 0.7 + Math.random() * 0.3;
      colors[i * 3] = 0.76 * intensity; // R
      colors[i * 3 + 1] = 0.49 * intensity; // G
      colors[i * 3 + 2] = 0.31 * intensity; // B
    }
    
    return [positions, colors];
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current && pointsRef.current.geometry.attributes.position) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        positions[i * 3 + 1] = -3 + Math.sin(x * 0.5 + time * 0.5) * Math.cos(z * 0.5 + time * 0.3) * 0.5;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        vertexColors
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      <bufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
    </Points>
  );
}

// Background Stars
function Stars() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const starCount = 500;
  
  const positions = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
    }
    
    return positions;
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

export const CosmicHero = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Subtle ambient light */}
        <ambientLight intensity={0.2} />
        
        {/* Point light at center for glow effect */}
        <pointLight position={[0, 0, 0]} intensity={1.5} color="#c2a084" distance={10} />
        
        {/* Background stars */}
        <Stars />
        
        {/* Main particle ring */}
        <ParticleRing />
        
        {/* Cosmic wave particles */}
        <CosmicWave />
        
        {/* Additional glow ring */}
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[2.8, 3.2, 64]} />
          <meshBasicMaterial
            color="#c2a084"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Canvas>
      
      {/* Fade-in overlay */}
      <div className="absolute inset-0 bg-black animate-fade-out pointer-events-none" />
    </div>
  );
};
