import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  const { shouldRender, showAnim } = useModalAnimation(isOpen);
  useBodyScrollLock(isOpen);

  // Handle escape key and clicks outside
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        showAnim ? 'bg-zinc-950/40 backdrop-blur-sm pointer-events-auto' : 'bg-transparent pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Aviso Legal y Privacidad"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950/90 p-6 sm:p-8 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showAnim ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-zinc-100 italic">Aviso Legal y Privacidad</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar text-zinc-400 text-sm leading-relaxed space-y-6">
          <section>
            <h4 className="text-zinc-200 font-medium mb-2 uppercase tracking-widest text-xs">1. Responsable</h4>
            <p>Francisco González, desarrollador Fullstack y estudiante de Ingeniería Informática.</p>
          </section>

          <section>
            <h4 className="text-zinc-200 font-medium mb-2 uppercase tracking-widest text-xs">2. Datos Recogidos</h4>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Formulario de contacto:</strong> Nombre y correo (voluntarios). Se procesan a través de <strong>Web3Forms</strong> para que los pueda recibir y responderte. Este servicio cuenta con su propia política de privacidad orientada a la protección de datos.
              </li>
              <li>
                <strong>Chat con IA:</strong> Tus mensajes se envían a la <strong>Groq API</strong> para generar respuestas en tiempo real. Groq no retiene ni utiliza estos datos para entrenar modelos. No se guardan copias en mis servidores. Puedes consultar su <a href="https://groq.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-zinc-100 transition-colors">política de privacidad</a> para más detalle.
              </li>
              <li>
                <strong>Seguridad:</strong> Utilizo <strong>Cloudflare Turnstile</strong> para bloquear spam y bots sin rastrearte de forma invasiva.
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-zinc-200 font-medium mb-2 uppercase tracking-widest text-xs">3. Cookies y Rastreo</h4>
            <p>
              Este sitio <strong>no utiliza cookies de seguimiento ni de análisis</strong> (como Google Analytics). Solo se emplean elementos técnicos esenciales para la seguridad del sitio y el funcionamiento del chat.
            </p>
          </section>

          <section>
            <h4 className="text-zinc-200 font-medium mb-2 uppercase tracking-widest text-xs">4. Finalidad</h4>
            <p>Responder a tus mensajes, facilitar la comunicación profesional y mostrar mis habilidades técnicas mediante funciones interactivas.</p>
          </section>

          <section>
            <h4 className="text-zinc-200 font-medium mb-2 uppercase tracking-widest text-xs">5. Derechos</h4>
            <p>Puedes escribirme en cualquier momento para consultar, corregir o solicitar la eliminación de cualquier dato que me hayas enviado a través del formulario.</p>
          </section>
        </div>

        <div className="pt-4 border-t border-zinc-800/40 mt-6 flex-shrink-0">
          <p className="text-[10px] text-zinc-600 italic">
            Última actualización: Abril 2026. Este sitio prioriza la privacidad y la mínima recolección de datos.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
