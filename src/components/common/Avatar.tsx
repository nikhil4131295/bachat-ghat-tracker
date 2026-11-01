import React from 'react';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PASTEL_COLORS = [
  'bg-pastel-mint text-teal-dark border-emerald-300',
  'bg-pastel-peach text-coral-hover border-orange-300',
  'bg-pastel-lavender text-purple-800 border-purple-300',
  'bg-pastel-sky text-sky-800 border-sky-300',
  'bg-pastel-butter text-amber-800 border-amber-300',
  'bg-pastel-pink text-pink-800 border-pink-300',
];

export const Avatar: React.FC<AvatarProps> = ({ name, photoUrl, size = 'md', className = '' }) => {
  // Generate consistent color based on name hash
  const colorIndex = Math.abs(
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % PASTEL_COLORS.length;
  const colorClass = PASTEL_COLORS[colorIndex];

  // Extract initials (supports Devanagari & English)
  const cleanName = name.replace(/\(.*?\)/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let initials = cleanName.slice(0, 2);
  if (parts.length >= 2) {
    initials = parts[0][0] + parts[1][0];
  }

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm font-bold',
    lg: 'w-16 h-16 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-2xl object-cover shadow-sm border ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-2xl flex items-center justify-center font-heading border shadow-sm select-none ${className}`}
    >
      {initials}
    </div>
  );
};
