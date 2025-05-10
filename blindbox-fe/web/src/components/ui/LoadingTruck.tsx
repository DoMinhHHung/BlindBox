import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

const LoadingTruck: React.FC = () => {
  return (
    <motion.div
      className="flex items-center justify-center w-full"
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{
        duration: 2,
        ease: "easeInOut",
      }}
    >
      <div className="relative">
        <Truck className="w-8 h-8 text-primary-600" />
        <motion.div
          className="absolute -bottom-2 left-0 right-0 h-1 bg-primary-600/50 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 2,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-2 left-0 w-8 h-1 bg-primary-600 rounded-full"
          initial={{ x: 0 }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingTruck;