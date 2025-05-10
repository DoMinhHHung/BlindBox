import React from 'react';
import { motion } from 'framer-motion';

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 animate-gradient opacity-60"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-900/50 to-neutral-950"></div>
        </div>
        
        {/* Floating orbs */}
        <motion.div
          className="absolute h-[300px] w-[800px] rounded-full bg-primary-500/30 blur-[100px]"
          animate={{
            x: ["0%", "100%", "0%"],
            y: ["0%", "100%", "0%"],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ top: '20%', left: '10%' }}
        />
        
        <motion.div
          className="absolute h-[250px] w-[600px] rounded-full bg-accent-500/20 blur-[120px]"
          animate={{
            x: ["0%", "-50%", "0%"],
            y: ["0%", "70%", "0%"],
            rotate: [0, -120, -360],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ top: '60%', right: '15%' }}
        />
        
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -20, null],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Glass reflections */}
        <motion.div
          className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-white/10 backdrop-blur-md"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute top-2/3 right-1/4 h-40 w-40 rounded-full bg-white/5 backdrop-blur-sm"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center w-full">
        {children}
      </div>
    </div>
  );
};

export default AuthContainer;