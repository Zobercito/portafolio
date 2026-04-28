import { useState } from 'react';
import PrivacyModal from './PrivacyModal';

export default function PrivacyLink() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-[0.2em] font-medium"
      >
        Aviso Legal y Privacidad
      </button>

      <PrivacyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
