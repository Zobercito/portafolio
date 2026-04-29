import { useState, useEffect } from 'react';
import ModalOverlay, { type ModalItemData } from './ModalOverlay';
import MiniGallery from './MiniGallery';
import { projects, certificates, stackIcons, workExperience, education } from '../data/experienceData';
import { useCarousel } from '../hooks/useCarousel';
import { useElementOverflow } from '../hooks/useElementOverflow';

type ModalType = 'projects' | 'certificates' | null;

interface StackIcon {
  name: string;
  url: string;
}

export default function ExperienceLayout() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [initialModalItem, setInitialModalItem] = useState<ModalItemData | null>(null);

  const { scrollRef, setIsHovered, handleManualScroll } = useCarousel();
  const {
    containerRef: expRef,
    contentRef,
    isOverflowing: isExpOverflowing,
    isExpanded: isExpExpanded,
    setIsExpanded: setIsExpExpanded,
    scrollHeight: expScrollHeight
  } = useElementOverflow();

  // Initial scroll to middle for the carousel
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2;
    }
  }, []);

  const openProjects = () => {
    setInitialModalItem(null);
    setActiveModal('projects');
  };

  const openCertificates = () => {
    setInitialModalItem(null);
    setActiveModal('certificates');
  };

  const openProjectDetails = (item: ModalItemData) => {
    setInitialModalItem(item);
    setActiveModal('projects');
  };

  const openCertificateDetails = (item: ModalItemData) => {
    setInitialModalItem(item);
    setActiveModal('certificates');
  };

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
      setInitialModalItem(null);
    }, 400);
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 xl:grid xl:grid-cols-12 xl:grid-rows-3 xl:h-184 xl:grid-flow-dense">

        {/* 1. EXPERIENCE */}
        <article
          ref={expRef}
          className={`relative xl:col-span-6 xl:row-span-2 xl:col-start-1 xl:row-start-1 md:h-44 xl:h-full md:shrink-0 rounded-2xl ${isExpExpanded ? 'z-50 overflow-visible' : 'z-10 overflow-hidden custom-scrollbar'
            }`}
        >
          {/* Animated mobile background */}
          <div
            className={`absolute top-0 left-0 w-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] rounded-2xl z-0 pointer-events-none ${isExpExpanded
              ? 'bg-zinc-900/95 border border-zinc-700/80 shadow-[0_1rem_3rem_rgba(0,0,0,0.8)] backdrop-blur-xl'
              : 'bg-zinc-900/35 border border-zinc-800/80 backdrop-blur-sm'
              }`}
            style={{ height: isExpExpanded ? `${expScrollHeight}px` : '100%' }}
          />

          {/* Inner content wrapper */}
          <div ref={contentRef} className="relative z-10 w-full p-3 sm:p-4 xl:p-6 xl:h-full xl:overflow-y-auto flex flex-col pointer-events-auto">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_45%)]" />
            <h3 className="relative z-10 mb-2 xl:mb-4 text-sm sm:text-base xl:text-xl font-semibold tracking-wide text-zinc-100">Experiencia</h3>

            <div className="relative z-10 flex flex-col gap-2 xl:gap-6">
              {workExperience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-2 xl:gap-3">
                  <div className="flex items-start gap-2 xl:gap-4">
                    <a href={exp.companyUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block shrink-0 transition-transform duration-300 hover:scale-110">
                      <img src={exp.logo} alt={exp.company} loading="lazy" decoding="async" className="h-8 w-8 xl:h-14 xl:w-14 rounded-md xl:rounded-lg border border-zinc-700/80 shadow-[0_4px_8px_rgba(0,0,0,0.35)] [image-rendering:high-quality]" />
                    </a>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm xl:text-lg font-medium text-zinc-100">
                        <span className="xl:hidden">{exp.titleShort}</span>
                        <span className="hidden xl:inline">{exp.title}</span>
                      </h4>
                      <a href={exp.companyUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] sm:text-xs xl:text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100 hover:underline">
                        {exp.company}
                      </a>
                      <div className="mt-0.5 xl:mt-1 text-[9px] sm:text-[10px] xl:text-xs text-zinc-500">
                        <span>{exp.period}</span>
                        <span className="hidden xl:inline"> · {exp.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 xl:gap-4 text-[10px] sm:text-xs xl:text-sm leading-snug xl:leading-relaxed text-zinc-400">
                    <p>{exp.description}</p>
                    <ul className="flex flex-col gap-1 xl:gap-2.5 pl-3 xl:pl-4 list-disc marker:text-zinc-600">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expand button (Mobile only) */}
          {isExpOverflowing && (
            <div
              className="xl:hidden absolute top-0 left-0 w-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none z-20 rounded-2xl"
              style={{ height: isExpExpanded ? `${expScrollHeight}px` : '100%' }}
            >
              <div
                className="absolute bottom-0 left-0 w-full h-16 flex items-end justify-center pb-2 pointer-events-auto rounded-b-2xl overflow-hidden"
                style={{
                  background: isExpExpanded
                    ? 'linear-gradient(to top, rgba(24, 24, 27, 0.95), rgba(24, 24, 27, 0.8), transparent)'
                    : 'linear-gradient(to top, rgba(9, 9, 11, 0.95), rgba(9, 9, 11, 0.8), transparent)'
                }}
              >
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsExpExpanded(!isExpExpanded);
                  }}
                  className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-medium text-zinc-400 hover:text-white pb-1"
                >
                  {isExpExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            </div>
          )}
        </article>

        {/* Grid Bottom Section */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:contents shrink-0">
          <article className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-3 sm:p-4 xl:p-6 backdrop-blur-sm xl:col-span-6 xl:row-span-1 xl:h-44 xl:col-start-1 xl:row-start-3">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_45%)]" />
            <h3 className="relative z-10 mb-2 xl:mb-4 text-sm sm:text-base xl:text-xl font-semibold tracking-wide text-zinc-100">Educación</h3>
            <div className="relative z-10 flex flex-col gap-2 xl:gap-6">
              {education.map((edu, idx) => (
                <div key={idx} className="flex items-start gap-2 xl:gap-4">
                  <a href={edu.institutionUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block shrink-0 transition-transform duration-300 hover:scale-110">
                    <img src={edu.logo} alt={edu.institution} loading="lazy" decoding="async" className="h-8 w-8 xl:h-14 xl:w-14 rounded-md xl:rounded-lg border border-zinc-700/80 shadow-[0_4px_8px_rgba(0,0,0,0.35)] object-cover" />
                  </a>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm xl:text-lg font-medium text-zinc-100 leading-tight">
                      <span className="xl:hidden">{edu.degreeShort}</span>
                      <span className="hidden xl:inline">{edu.degree}</span>
                    </h4>
                    <a href={edu.facultyUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-0.5 text-[10px] sm:text-xs xl:text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100 hover:underline">
                      <span className="xl:hidden">{edu.institutionShort}</span>
                      <span className="hidden xl:inline">{edu.institution}</span>
                    </a>
                    <div className="mt-0.5 xl:mt-1 text-[9px] sm:text-[10px] xl:text-xs text-zinc-500">
                      <span>{edu.period}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-3 sm:p-4 xl:p-6 backdrop-blur-sm xl:col-span-6 xl:row-span-1 xl:h-44 xl:col-start-7 xl:row-start-3 flex flex-col">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.15),transparent_42%)]" />
            <h3 className="relative z-10 text-sm sm:text-base xl:text-xl font-semibold tracking-wide text-zinc-100 shrink-0">Stack</h3>

            <div className="relative z-10 w-full mt-1 xl:mt-2 xl:flex-1 xl:min-h-0 flex flex-col justify-center">
              <button type="button" onClick={() => handleManualScroll('left')} className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-5/6 w-8 sm:w-10 xl:w-12 bg-linear-to-r from-zinc-950/80 to-transparent items-center justify-start pl-0 sm:pl-1 opacity-40 hover:opacity-100 transition-opacity text-zinc-300 rounded-s-md" aria-label="Retroceder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 xl:w-5 xl:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button type="button" onClick={() => handleManualScroll('right')} className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-5/6 w-8 sm:w-10 xl:w-12 bg-linear-to-l from-zinc-950/80 to-transparent items-center justify-end pr-0 sm:pr-1 opacity-40 hover:opacity-100 transition-opacity text-zinc-300 rounded-e-md" aria-label="Avanzar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 xl:w-5 xl:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <div className="w-full mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div ref={scrollRef} className="flex w-full shrink-0 flex-nowrap items-center overflow-x-hidden gap-6 pr-6 sm:gap-9 sm:pr-9 xl:gap-11 xl:pr-11 pt-2 xl:pt-3 pb-2 xl:pb-3">
                  {Array(8).fill(stackIcons).flat().map((icon: StackIcon, index: number) => (
                    <div
                      key={`${icon.name}-${index}`}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className="relative group/icon flex flex-col items-center justify-start shrink-0 transition-transform hover:-translate-y-1.5 w-9 sm:w-10 xl:w-11 h-13 sm:h-15 xl:h-17"
                      title={icon.name}
                    >
                      <img src={icon.url} alt={icon.name} loading="lazy" decoding="async" className="h-8 w-8 sm:h-10 sm:w-10 xl:h-11 xl:w-11 object-contain opacity-80 transition-opacity group-hover/icon:opacity-100" />
                      <span className="block absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] xl:text-[10px] font-medium tracking-[0.08em] text-zinc-400 group-hover/icon:text-zinc-200 transition-colors uppercase whitespace-nowrap">
                        {icon.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Galleries */}
        <div className="xl:col-span-6 xl:row-span-1 xl:col-start-7 xl:row-start-1 xl:h-auto">
          <MiniGallery title="Proyectos" items={projects} gradientClass="bg-[radial-gradient(circle_at_15%_20%,rgba(148,163,184,0.17),transparent_40%)]" onViewAll={openProjects} onItemClick={openProjectDetails} isParentModalOpen={activeModal !== null} />
        </div>

        <div className="xl:col-span-6 xl:row-span-1 xl:col-start-7 xl:row-start-2 xl:h-auto">
          <MiniGallery title="Certificados" items={certificates} gradientClass="bg-[radial-gradient(circle_at_80%_30%,rgba(244,63,94,0.16),transparent_42%)]" onViewAll={openCertificates} onItemClick={openCertificateDetails} isParentModalOpen={activeModal !== null} />
        </div>
      </div>

      <ModalOverlay isOpen={activeModal === 'projects'} title="Proyectos" items={projects} onClose={closeModal} initialItem={activeModal === 'projects' ? initialModalItem : null} />
      <ModalOverlay isOpen={activeModal === 'certificates'} title="Certificados" items={certificates} onClose={closeModal} initialItem={activeModal === 'certificates' ? initialModalItem : null} />
    </>
  );
}
