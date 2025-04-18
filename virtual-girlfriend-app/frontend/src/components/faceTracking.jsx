import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export const FaceTracking = () => {
  const faceMeshRef = useRef();

  useEffect(() => {
    const faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true });
    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        // Map landmarks to avatar blendshapes here
        console.log("Face landmarks detected:", landmarks);
      }
    });

    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  return null;
};