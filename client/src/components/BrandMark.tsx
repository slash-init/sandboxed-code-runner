type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span>Sand</span>
      <span className="text-blue-600">
        bx.
      </span>
    </span>
  );
}
