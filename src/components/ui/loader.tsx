import React from 'react';
import { motion } from 'framer-motion';

const QuantumLoader: React.FC = () => {
  const particles = 12;
  const radius = 50;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative w-32 h-32">
        {[...Array(particles)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-3 h-3 bg-blue-500 rounded-full"
            animate={{
              x: Math.cos(index / particles * Math.PI * 2) * radius,
              y: Math.sin(index / particles * Math.PI * 2) * radius,
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-500"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>
    </div>
  );
};

export default QuantumLoader;