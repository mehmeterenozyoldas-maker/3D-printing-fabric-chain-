import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface GridProps {
  formType: string;
  formRadius: number;
  modulePattern: string;
  columns: number;
  rows: number;
  moduleSize: number;
  thickness: number;
  linkGap: number;
  hollowFactor: number;
  warpAmplitude: number;
  warpFrequency: number;
}

export function GenerativeGrid({ 
  formType, formRadius, modulePattern,
  columns, rows, moduleSize, thickness, linkGap, 
  hollowFactor, warpAmplitude, warpFrequency 
}: GridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Memoize complex functional geometries
  const geometry = useMemo(() => {
    const radius = Math.max(0.01, moduleSize - linkGap);
    
    // Procedural shape generator for different microstructures
    const generatePoints = (scale: number) => {
      const pts = [];
      const r = radius * scale;
      
      if (modulePattern === 'Honeycomb') {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          pts.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
        }
      } else if (modulePattern === 'Auxetic') {
        // Re-entrant hexagon (negative Poisson's ratio structure)
        pts.push(new THREE.Vector2(r * 0.35, 0));
        pts.push(new THREE.Vector2(r * 0.6, r * 0.866));
        pts.push(new THREE.Vector2(-r * 0.6, r * 0.866));
        pts.push(new THREE.Vector2(-r * 0.35, 0));
        pts.push(new THREE.Vector2(-r * 0.6, -r * 0.866));
        pts.push(new THREE.Vector2(r * 0.6, -r * 0.866));
      } else if (modulePattern === 'Heat Sink') {
        // Finned/geared structure for thermal dissipation
        const teeth = 12;
        for (let i = 0; i < teeth * 2; i++) {
          const angle = (i / (teeth * 2)) * Math.PI * 2;
          const currentR = i % 2 === 0 ? r : r * 0.6;
          pts.push(new THREE.Vector2(Math.cos(angle) * currentR, Math.sin(angle) * currentR));
        }
      }
      return pts;
    };

    const outerPoints = generatePoints(1);
    const shape = new THREE.Shape(outerPoints);

    // Inner void (Hole) for material reduction / fluid passage
    if (hollowFactor > 0.05) {
      const innerPoints = generatePoints(hollowFactor);
      const hole = new THREE.Path(innerPoints);
      shape.holes.push(hole);
    }

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: Math.min(0.02, thickness * 0.1),
      bevelSize: Math.min(0.02, moduleSize * 0.05),
      bevelSegments: 2,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // ExtrudeGeometry builds in XY plane, pointing to Z. 
    // Rotate to lie on XZ plane, pointing to Y for standard displacement
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -thickness / 2, 0); // Center origin
    
    return geo;
  }, [modulePattern, moduleSize, thickness, linkGap, hollowFactor]);

  // Industrial Engineering Material (Anodized, Machine-Milled Aesthetic)
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({ 
      color: '#1a1f26', 
      emissive: '#05070a',
      roughness: 0.3, 
      metalness: 0.8,
      clearcoat: 0.2,
      clearcoatRoughness: 0.7,
      flatShading: modulePattern === 'Heat Sink',
    });
  }, [modulePattern]);

  const count = columns * rows;
  
  // Advanced Topological Matrix Computation
  const transforms = useMemo(() => {
    const R = moduleSize;
    const xOffset = 1.5 * R;
    const zOffset = Math.sqrt(3) * R;
    
    const totalWidth = (columns - 1) * xOffset;
    const totalHeight = (rows - 1) * zOffset;

    const matrices = [];
    const dummy = new THREE.Object3D();
    
    // Interference wave pattern for stress/load simulation
    const getSurfaceY = (x: number, z: number) => {
       const wave1 = Math.sin(x * warpFrequency) * Math.cos(z * warpFrequency);
       const wave2 = Math.sin((x + z) * warpFrequency * 0.6);
       return (wave1 + wave2 * 0.4) * warpAmplitude;
    };

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        const isOddCol = col % 2 !== 0;
        
        let localX = col * xOffset - totalWidth / 2;
        let localZ = row * zOffset - totalHeight / 2;
        if (isOddCol) localZ += zOffset / 2;

        let localY = getSurfaceY(localX, localZ);

        // Calculate surface normal
        const delta = 0.01;
        const dx = (getSurfaceY(localX + delta, localZ) - getSurfaceY(localX - delta, localZ)) / (2 * delta);
        const dz = (getSurfaceY(localX, localZ + delta) - getSurfaceY(localX, localZ - delta)) / (2 * delta);
        let normal = new THREE.Vector3(-dx, 1, -dz).normalize();

        // Parametric thickness logic based on "stress" (height)
        const normalizedHeight = warpAmplitude > 0 ? (localY / warpAmplitude + 1) / 2 : 0; 
        const scaleY = warpAmplitude > 0 ? 0.3 + (normalizedHeight * 2.0) : 1; 

        // MACRO-FORM MAPPING (The boundaries of the computational design)
        if (formType === 'Planar') {
          dummy.position.set(localX, localY, localZ);
          
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            normal
          );
          dummy.quaternion.copy(quaternion);
        } else if (formType === 'Cylindrical (Sleeve)') {
          // Wrapped around a cylindrical Mandrel (like a robotic arm sleeve or stent)
          const angle = localX / formRadius;
          const currentRadius = formRadius + localY; // Warp affects the radius
          
          const finalX = Math.sin(angle) * currentRadius;
          const finalZ = Math.cos(angle) * currentRadius;
          const finalY = localZ; // The length of the cylinder runs along Y

          dummy.position.set(finalX, finalY, finalZ);

          // Rotate the normal vector mathematically onto the cylinder
          const cylinderNormal = new THREE.Vector3(
            Math.sin(angle) * normal.y + Math.cos(angle) * normal.x,
            normal.z,
            Math.cos(angle) * normal.y - Math.sin(angle) * normal.x
          ).normalize();

          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            cylinderNormal
          );
          
          dummy.quaternion.copy(quaternion);
          
          // Align the modules along the circumference flow
          dummy.rotateOnWorldAxis(cylinderNormal, -angle);
        } else if (formType === 'Radial (Disc)') {
          // Flattened disc projection (e.g., turbine blades, structural rotors)
          // Map x to angle, and z to radius
          const angle = localX * 0.5;
          const radiusFromCenter = formRadius + localZ;
          
          const finalX = Math.sin(angle) * radiusFromCenter;
          const finalZ = Math.cos(angle) * radiusFromCenter;
          const finalY = localY;
          
          dummy.position.set(finalX, finalY, finalZ);
          
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            normal
          );
          dummy.quaternion.copy(quaternion);
          // Orient along tangent
          dummy.rotateY(-angle);
        }

        dummy.scale.set(1, scaleY, 1);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
      }
    }
    return matrices;
  }, [formType, formRadius, columns, rows, moduleSize, warpAmplitude, warpFrequency]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < transforms.length; i++) {
      meshRef.current.setMatrixAt(i, transforms[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [transforms]);

  return (
    <instancedMesh
      key={`${count}_${modulePattern}`} 
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
}
