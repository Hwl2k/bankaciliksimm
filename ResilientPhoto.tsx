import { useState } from 'react';
import { User } from 'lucide-react';

interface ResilientPhotoProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResilientPhoto({ src, alt, className = '' }: ResilientPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-slate-800 text-slate-300 ${className}`}
      >
        <User className="w-10 h-10 opacity-75" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
