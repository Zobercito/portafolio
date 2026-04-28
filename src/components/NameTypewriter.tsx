import { useEffect, useState, useRef } from 'react';

interface NameTypewriterProps {
  firstName: string;
  lastName: string;
  speed?: number;
  enableErrorAnimation?: boolean;
  onArrowClick?: () => void;
}

type Phase =
  | 'first'
  | 'last-normal'
  | 'last-error'
  | 'last-error-delay'
  | 'last-error-pause'
  | 'last-backspace'
  | 'last-correct';
type CursorLine = 'first' | 'last';

// Static constants for the typo correction animation sequence
const lastNameWithError = 'Gonzálrz'; // Intentional typo for the animation
const backspaceCount = 2;              // Characters to backspace: "rz"

export default function NameTypewriter({
  firstName,
  lastName,
  speed = 1000,
  enableErrorAnimation = true,
  onArrowClick,
}: NameTypewriterProps) {
  const [phase, setPhase] = useState<Phase>('first');
  const [cursorLine, setCursorLine] = useState<CursorLine>('first');
  const [typedFirst, setTypedFirst] = useState('');
  const [typedLast, setTypedLast] = useState('');
  const [isTyping, setIsTyping] = useState(false); // false = blinking, true = solid
  const [hasFinishedTyping, setHasFinishedTyping] = useState(false);
  const [showStatusDot, setShowStatusDot] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const hasDismissedArrow = useRef(false);

  useEffect(() => {
    setHasFinishedTyping(false);
    setShowStatusDot(false);
    setShowArrow(false);
  }, [firstName, lastName, speed, enableErrorAnimation]);

  useEffect(() => {
    if (!hasFinishedTyping) return;

    const statusTimeout = setTimeout(() => {
      setShowStatusDot(true);
      if (!hasDismissedArrow.current) {
        setShowArrow(true);
      }
    }, 1000);

    return () => clearTimeout(statusTimeout);
  }, [hasFinishedTyping]);

  useEffect(() => {
    const handleInteract = () => {
      hasDismissedArrow.current = true;
      setShowArrow(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(e.code)) {
        handleInteract();
      }
    };

    window.addEventListener('wheel', handleInteract, { passive: true });
    window.addEventListener('touchmove', handleInteract, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => link.addEventListener('click', handleInteract));

    return () => {
      window.removeEventListener('wheel', handleInteract);
      window.removeEventListener('touchmove', handleInteract);
      window.removeEventListener('keydown', handleKeyDown);
      navLinks.forEach(link => link.removeEventListener('click', handleInteract));
    };
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'first') {
      let i = 1;
      const type = () => {
        setIsTyping(true);
        setTypedFirst(firstName.slice(0, i));
        if (i < firstName.length) {
          i++;
          timeout = setTimeout(type, speed);
        } else {
          // Finished typing first name, pause before proceeding
          setIsTyping(false);
          timeout = setTimeout(() => {
            setCursorLine('last');
            const shouldShowError = enableErrorAnimation && Math.random() < 0.15;
            setPhase(shouldShowError ? 'last-error' : 'last-normal');
          }, 0);
        }
      };
      // Initial delay before typing starts
      setIsTyping(false);
      timeout = setTimeout(type, 100);

    } else if (phase === 'last-normal') {
      let i = 1;
      const type = () => {
        setIsTyping(true);
        setTypedLast(lastName.slice(0, i));
        if (i < lastName.length) {
          i++;
          timeout = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          setHasFinishedTyping(true);
        }
      };
      timeout = setTimeout(type, speed);

    } else if (phase === 'last-error') {
      let i = 1;
      const type = () => {
        setIsTyping(true);
        setTypedLast(lastNameWithError.slice(0, i));
        if (i < lastNameWithError.length) {
          i++;
          timeout = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          timeout = setTimeout(() => setPhase('last-error-delay'), speed * 2);
        }
      };
      timeout = setTimeout(type, speed);

    } else if (phase === 'last-error-delay') {
      setIsTyping(false);
      timeout = setTimeout(() => setPhase('last-error-pause'), 500);

    } else if (phase === 'last-error-pause') {
      setIsTyping(false);
      timeout = setTimeout(() => setPhase('last-backspace'), 2000);

    } else if (phase === 'last-backspace') {
      let i = lastNameWithError.length;
      const backspace = () => {
        setIsTyping(true);
        i--;
        setTypedLast(lastNameWithError.slice(0, i));
        if (i > lastNameWithError.length - backspaceCount) {
          timeout = setTimeout(backspace, speed * 3.2);
        } else {
          setIsTyping(false);
          timeout = setTimeout(() => setPhase('last-correct'), speed * 2);
        }
      };
      timeout = setTimeout(backspace, 300);

    } else if (phase === 'last-correct') {
      const startIndex = lastNameWithError.length - backspaceCount;
      let i = startIndex + 1;
      const type = () => {
        setIsTyping(true);
        setTypedLast(lastNameWithError.slice(0, startIndex) + lastName.slice(startIndex, i));
        if (i < lastName.length) {
          i++;
          timeout = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          setHasFinishedTyping(true);
        }
      };
      timeout = setTimeout(type, speed);
    }

    return () => clearTimeout(timeout);
  }, [phase, firstName, lastName, speed, enableErrorAnimation]);

  const handleArrowClick = () => {
    hasDismissedArrow.current = true;
    setShowArrow(false);
    if (onArrowClick) {
      onArrowClick();
    } else {
      // Fallback to manual scroll or safe default if no handler is provided
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const cursorClass = `cursor${isTyping ? '' : ' blinking'}`;

  // Prevent layout shift by rendering a non-breaking space placeholder
  // before the second line starts typing.
  const secondLineContent = typedLast || '\u00A0';

  return (
    <div>
      <div className="h-6 mb-1 sm:mb-2 ml-1 sm:ml-2">
        {showStatusDot && (
          <span className="status-badge inline-flex items-center gap-2 text-[0.7rem] sm:text-xs tracking-[0.22em] uppercase text-zinc-300">
            <span className="status-dot" aria-hidden="true" />
            Disponible para trabajar
          </span>
        )}
      </div>

      <h1 className="mb-6 sm:mb-8 leading-[1.05] tracking-tight">
        <span className="block text-[clamp(2.8rem,9vw,7rem)] font-semibold text-zinc-100 relative w-fit">
          {typedFirst}
          <span className={`${cursorClass} ${cursorLine === 'first' ? 'opacity-100' : 'opacity-0'} absolute -right-[0.6em] top-0`}>_</span>
        </span>
        <span
          className={`block text-[clamp(2.8rem,9vw,7rem)] font-semibold text-zinc-300 relative w-fit ${phase === 'last-error-pause' ? 'squiggly-error' : ''}`}
          style={{ visibility: cursorLine === 'first' ? 'hidden' : 'visible' }}
        >
          {secondLineContent}
          <span className={`${cursorClass} ${cursorLine === 'last' ? 'opacity-100' : 'opacity-0'} absolute -right-[0.6em] top-0`}>_</span>
        </span>
      </h1>

      {showArrow && (
        <button
          className="absolute bottom-8 sm:bottom-12 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in-down cursor-pointer bg-transparent border-none p-0 group"
          onClick={handleArrowClick}
          aria-label="Ir a Sobre mí"
        >
          <svg
            className="down-arrow group-hover:text-zinc-100 transition-colors duration-200"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}
