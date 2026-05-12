import { useState, useEffect } from 'react';

// ─── SLIDES ───────────────────────────────────
const SLIDES = [
  {
    image:    '/Banner/VisaoDesenvolvedor.png',
    tag:      'Desenvolvimento de Software',
    title:    'Transformando código em soluções reais',
    desc:     'Desenvolvemos sistemas modernos, escaláveis e inovadores para empresas e ONGs que querem crescer com tecnologia.',
    color:    '#00D4AA',
  },
  {
    image:    '/Banner/ArquiteturaSoftware.png',
    tag:      'Inovação & Tecnologia',
    title:    'Arquitetando o futuro digital',
    desc:     'Nossa equipe projeta soluções tecnológicas que transformam processos complexos em experiências simples e eficientes.',
    color:    '#40C4FF',
  },
  {
    image:    '/Banner/Mentoria.png',
    tag:      'Conectando Pessoas',
    title:    'Pessoas no centro de tudo',
    desc:     'Acreditamos que a melhor tecnologia é aquela que conecta pessoas, gera valor e impacta positivamente a sociedade.',
    color:    '#B39DDB',
  },
  {
    image:    '/Banner/ConexaoPessoas.png',
    tag:      'Colaboração com Empresas',
    title:    'Parcerias que geram resultados',
    desc:     'Trabalhamos lado a lado com empresas e organizações para transformar ideias em produtos digitais de alto impacto.',
    color:    '#FFD740',
  },
  {
    image:    '/Banner/SolucaoOng.png',
    tag:      'Case de Sucesso · Turma do Bem',
    title:    'Dashboard que transforma vidas',
    desc:     'Desenvolvemos o sistema de gestão da ONG Turma do Bem — conectando 4.218 dentistas voluntários a 247.893 adolescentes.',
    color:    '#00E676',
  },
];

export default function HeroCarousel() {
  const [current,  setCurrent]  = useState(0);
  const [animating, setAnimating] = useState(false);

  // Troca automática a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [current]);

  function goTo(index: number) {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  }

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{ height: 750 }}
    >
      {/* ── Imagem de fundo com fade ── */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: animating ? 0 : 1 }}
      >
        <img
          src={slide.image}
          alt={slide.tag}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B35]/95 via-[#0D1B35]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B35]/80 via-transparent to-transparent" />
      </div>

      {/* ── Conteúdo do slide ── */}
      <div
        className="absolute inset-0 flex flex-col justify-center px-10 py-8 transition-all duration-500"
        style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)' }}
      >
        {/* Tag */}
        <span
          className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 inline-flex items-center gap-2"
          style={{ color: slide.color }}
        >
          <span
            className="inline-block w-5 h-[2px] rounded"
            style={{ background: slide.color }}
          />
          {slide.tag}
        </span>

        {/* Título */}
        <h2 className="text-[28px] font-extrabold text-white leading-tight mb-4 max-w-[380px]">
          {slide.title}
        </h2>

        {/* Descrição */}
        <p className="text-[13.5px] text-blue-200/70 leading-relaxed max-w-[360px] mb-6">
          {slide.desc}
        </p>

        {/* Indicador do slide atual */}
        <div
          className="text-[11px] font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 w-fit"
          style={{
            background: `${slide.color}18`,
            color: slide.color,
            border: `1px solid ${slide.color}40`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: slide.color }} />
          {current + 1} de {SLIDES.length}
        </div>
      </div>

      {/* ── Dots de navegação ── */}
      <div className="absolute bottom-5 right-6 flex gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full cursor-pointer border-none outline-none"
            style={{
              width:   i === current ? 24 : 8,
              height:  8,
              background: i === current ? slide.color : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>

      {/* ── Setas de navegação ── */}
      <button
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer border-none outline-none transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
      >
        ‹
      </button>
      <button
        onClick={() => goTo((current + 1) % SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer border-none outline-none transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
      >
        ›
      </button>

      {/* ── Barra de progresso ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
        <div
          key={current}
          className="h-full rounded-full"
          style={{
            background: slide.color,
            animation: 'progress 4s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}