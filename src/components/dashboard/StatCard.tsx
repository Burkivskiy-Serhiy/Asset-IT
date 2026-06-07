'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ label, value, change, trend, icon: Icon, color = 'var(--primary)' }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="glass-panel overflow-hidden border-none card-gradient">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center" 
              style={{ backgroundColor: `${color}15`, color: color }}
            >
              <Icon size={24} />
            </div>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                trend === 'up' ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
              )}>
                {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-3xl font-extrabold mb-1 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
