import Image from "next/image";

export default function ForjaLogo({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt="FORJA"
      width={size}
      height={size}
      className={`rounded-[22%] ${className}`}
      priority
    />
  );
}
