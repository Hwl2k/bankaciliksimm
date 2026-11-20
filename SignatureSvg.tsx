import type { SignatureStyle } from '../game/types';

interface SignatureSvgProps {
  style: SignatureStyle;
  label?: string;
}

const PATH_MAP: Record<SignatureStyle, string> = {
  loop: 'M8,28 C20,6 34,6 28,28 C24,40 52,10 66,24 C78,36 96,12 120,26 C135,34 150,20 162,24',
  sharp: 'M10,32 L28,8 L42,34 L60,10 L78,32 L96,14 L114,30 L134,12 L156,28',
  wave: 'M10,24 Q34,6 56,24 T102,24 T152,24 M26,34 L142,34',
  slash: 'M16,34 L42,6 M34,26 L152,20 M92,12 L106,32',
};

export function SignatureSvg({ style, label = 'İmza örneği' }: SignatureSvgProps) {
  return (
    <svg
      width="124"
      height="28"
      viewBox="0 0 170 40"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <path
        d={PATH_MAP[style]}
        fill="none"
        stroke="#0A2540"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
