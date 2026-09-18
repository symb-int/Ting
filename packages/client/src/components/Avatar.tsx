import React, { useState, useMemo } from 'react';
import type { TUser } from 'librechat-data-provider';
import { Skeleton } from './Skeleton';
import { UserIcon } from '~/svgs';

export interface AvatarProps {
  user?: TUser;
  size?: number;
  className?: string;
  alt?: string;
  showDefaultWhenEmpty?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 32,
  className = '',
  alt,
  showDefaultWhenEmpty = true,
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string>();
  const [failedSrc, setFailedSrc] = useState<string>();
  const imageSrc = user?.avatar || '';
  const imageLoaded = loadedSrc === imageSrc;
  const imageError = failedSrc === imageSrc;
  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return '';
    const parts = name.split(/\s+/);
    const first = Array.from(parts[0])[0];
    const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
    return first + last;
  }, [user?.name]);

  const altText = useMemo(
    () => alt || `${user?.name || user?.username || user?.email || ''}'s avatar`,
    [alt, user?.name, user?.username, user?.email],
  );

  if (imageSrc && !imageError) {
    return (
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        {!imageLoaded && (
          <Skeleton className="rounded-full" style={{ width: `${size}px`, height: `${size}px` }} />
        )}

        <img
          key={imageSrc}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            display: imageLoaded ? 'block' : 'none',
          }}
          className={`rounded-full ${className}`}
          src={imageSrc}
          alt={altText}
          onLoad={() => setLoadedSrc(imageSrc)}
          onError={() => setFailedSrc(imageSrc)}
        />
      </div>
    );
  }

  if (showDefaultWhenEmpty || (!imageSrc && initials)) {
    return (
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`relative inline-flex flex-none items-center justify-center rounded-full border border-border-medium bg-surface-secondary text-sm font-bold leading-[1.45] text-text-primary ${className}`}
        aria-hidden="true"
      >
        {initials || <UserIcon />}
      </div>
    );
  }

  return null;
};

export default Avatar;
