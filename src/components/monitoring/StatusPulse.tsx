'use client';
import React from 'react';
import { motion } from 'framer-motion';
interface MonitoringPulseProps {
  status: 'online' | 'offline' | 'warning';
}
export default function MonitoringPulse({ status }: MonitoringPulseProps) {
  const bgColor = 
    status === 'online' ? 'bg-emerald-500' : 
    status === 'warning' ? 'bg-amber-500' : 
    'bg-red-500';
  return (
    <div className="relative w-3 h-3 flex items-center justify-center">
      <motion.div 
        className={`absolute w-full h-full rounded-full ${bgColor}`}
        animate={{
          scale: [1, 2.2],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      <div className={`relative w-2 h-2 rounded-full z-10 ${bgColor}`} />
    </div>
  );
}