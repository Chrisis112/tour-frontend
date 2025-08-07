import Image from 'next/image';

export default function UserAvatar({ src, alt }: { src?: string; alt: string }) {
  return (
    <Image
      src={src || '/default-avatar.png'}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full object-cover"
      style={{ width: 40, height: 40 }}
    />
  );
}
