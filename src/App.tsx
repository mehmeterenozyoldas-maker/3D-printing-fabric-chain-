import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, SpotLight } from '@react-three/drei';
import { useControls, Leva, folder } from 'leva';
import { GenerativeGrid } from './components/GenerativeGrid';

export default function App() {
  // Advanced Parametric State for Industrial Design
  const params = useControls('Generative Controls', {
    MacroForm: folder({
      formType: { value: 'Planar', options: ['Planar', 'Cylindrical (Sleeve)', 'Radial (Disc)'] },
      formRadius: { value: 12, min: 4, max: 30, step: 0.5, render: (get) => get('Generative Controls.formType') !== 'Planar' },
    }),
    MicroStructure: folder({
      modulePattern: { value: 'Auxetic', options: ['Honeycomb', 'Auxetic', 'Heat Sink'] },
      columns: { value: 24, min: 2, max: 80, step: 1 },
      rows: { value: 20, min: 2, max: 80, step: 1 },
      moduleSize: { value: 0.8, min: 0.2, max: 3, step: 0.05 },
      thickness: { value: 0.3, min: 0.05, max: 2, step: 0.01 },
      linkGap: { value: 0.08, min: 0, max: 0.4, step: 0.01 },
    }),
    Morphology: folder({
      hollowFactor: { value: 0.55, min: 0, max: 0.9, step: 0.05 },
    }),
    TopologicalWarp: folder({
      warpAmplitude: { value: 1.5, min: 0, max: 10, step: 0.1 },
      warpFrequency: { value: 0.3, min: 0.0, max: 1, step: 0.01 },
    })
  });

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Leva theme={{ colors: { elevation1: '#111', elevation2: '#1a1a1a', highlight1: '#333', highlight2: '#444' }, sizes: { rootWidth: '340px' } }} />
      
      {/* UI Overlay */}
      <header className="absolute top-0 left-0 z-10 p-6 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-white/90 font-mono uppercase">
          Industrial Generative CAD
        </h1>
        <p className="text-sm text-white/40 mt-2 max-w-md font-mono">
          Parametric metamaterial structural designer.
          Explore complex microstructures (Auxetic, Heat Sinks) mapped onto planar, cylindrical, and radial topologies.
        </p>
      </header>

      {/* R3F Canvas */}
      <Canvas camera={{ position: [20, 20, 25], fov: 40 }}>
        <color attach="background" args={['#080808']} />
        
        {/* Industrial Cinematic Lighting Setup */}
        <ambientLight intensity={0.2} />
        
        <SpotLight 
          position={[20, 40, 20]} 
          angle={0.3} 
          penumbra={0.5} 
          intensity={2000} 
          castShadow 
          color="#ffffff"
        />
        
        <SpotLight 
          position={[-20, 10, -20]} 
          angle={0.5} 
          penumbra={0.8} 
          intensity={1500} 
          color="#aaaaff"
        />

        {/* Phase 2: Advanced Computational Grid */}
        <GenerativeGrid {...params} />
        
        {/* Controls and Environment */}
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        
        {/* Environment map adds realistic specular reflections to the metal */}
        <Environment preset="warehouse" />
        
        <ContactShadows 
          position={[0, -10, 0]} 
          opacity={0.8} 
          scale={80} 
          blur={2.5} 
          far={20} 
          resolution={1024}
          color="#000000"
        />
      </Canvas>
    </div>
  );
}
