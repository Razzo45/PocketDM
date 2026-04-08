"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeDiceRoll(props: {
  isRolling: boolean;
  targetValue?: number;
  onSettled?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 280;
    const height = mount.clientHeight || 180;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.25);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const geo = new THREE.IcosahedronGeometry(1.2, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.35,
      metalness: 0.2,
    });
    const die = new THREE.Mesh(geo, mat);
    scene.add(die);

    let frame = 0;
    const animate = () => {
      frame++;

      if (props.isRolling) {
        settledRef.current = false;
        die.rotation.x += 0.08;
        die.rotation.y += 0.12;
        die.rotation.z += 0.05;
      } else {
        const target = (props.targetValue ?? 1) * 0.2;
        die.rotation.x += (target - die.rotation.x) * 0.08;
        die.rotation.y += ((target * 1.3) % (Math.PI * 2) - die.rotation.y) * 0.08;
        die.rotation.z += ((target * 1.7) % (Math.PI * 2) - die.rotation.z) * 0.08;

        const settled =
          Math.abs((target - die.rotation.x) * 0.08) < 0.001 &&
          Math.abs((((target * 1.3) % (Math.PI * 2) - die.rotation.y) * 0.08)) < 0.001;
        if (settled && !settledRef.current && frame > 20) {
          settledRef.current = true;
          props.onSettled?.();
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    let raf = requestAnimationFrame(animate);

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [props.isRolling, props.targetValue, props.onSettled]);

  return <div ref={mountRef} className="h-44 w-full" />;
}

