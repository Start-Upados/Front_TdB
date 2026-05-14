import { Link } from 'react-router-dom';


export function StatsSection() {
  const stats = [
    { value: '50', label: 'Projetos Desenvolvidos',     suffix: '+' },
    { value: '100',   label: 'Conexões e Colaborações',  suffix: '+'  },
    { value: '15',   label: 'Cidades atendidas',    suffix: '+'  },
    { value: '3',       label: 'Países atendidos',     suffix: ''   },
  ];

  return (
    <section className="bg-[#0f3460] py-14 px-6">
      <div className="max-w-[90%] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-white mb-1">
                {s.value}
                <span className="text-[#00D4AA]">{s.suffix}</span>
              </p>
              <p className="text-blue-300/70 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


const PROJECTS = [
  {
    tag:   'ONG · Case de Sucesso',
    title: 'Dashboard Turma do Bem',
    desc:  'Sistema completo de gestão para a ONG, conectando +18 mil dentistas voluntários a adolescentes em todo o Brasil.',
    tech:  ['React', 'TypeScript', 'Google Sheets', 'Tailwind'],
    color: '#00D4AA',
    link:  '/dashboard',
    cta:   'Ver Dashboard',
  },
  {
    tag:   'Startup · Em desenvolvimento',
    title: 'Plataforma StartUpados()',
    desc:  'Site institucional moderno com dashboard administrativo, integração com Google Sheets e backend em Quarkus + Oracle.',
    tech:  ['React', 'Quarkus', 'Oracle', 'Java'],
    color: '#40C4FF',
    link:  '/NossosServicos',
    cta:   'Saiba mais',
  },
  {
    tag:   'Inovação · Tecnologia',
    title: 'Seu projeto aqui',
    desc:  'Desenvolvemos soluções digitais completas — do planejamento à entrega — para empresas que querem crescer com tecnologia.',
    tech:  ['React', 'Node.js', 'Cloud', 'API'],
    color: '#D4AF37',
    link:  '/FaleConosco',
    cta:   'Fale conosco',
  },
];

export function ProjectsSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-[90%] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#0f3460]/50">
            Portfólio
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a2e] mt-2 mb-3">
            Nossos projetos
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-[15px]">
            Soluções reais desenvolvidas para empresas e organizações que querem transformar ideias em impacto.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROJECTS.map((p, i) => (
            <div
              key={i}
              className="group border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              style={{ borderTop: `3px solid ${p.color}` }}
            >
              <span
                className="text-[10.5px] font-semibold uppercase tracking-wide mb-3"
                style={{ color: p.color }}
              >
                {p.tag}
              </span>
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-3">{p.title}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed mb-5 flex-1">{p.desc}</p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: `${p.color}15`, color: p.color }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <Link
                to={p.link}
                className="flex items-center gap-2 text-[13px] font-semibold transition-all duration-200"
                style={{ color: p.color }}
              >
                {p.cta}
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


const TECHS = [
  { name: 'React',       color: '#61DAFB', icon: '⚛' },
  { name: 'TypeScript',  color: '#3178C6', icon: 'TS' },
  { name: 'Java',        color: '#f89820', icon: '☕' },
  { name: 'Quarkus',     color: '#4695EB', icon: 'Q'  },
  { name: 'Oracle DB',   color: '#F80000', icon: '🗄' },
  { name: 'Tailwind',    color: '#38BDF8', icon: '🎨' },
  { name: 'Google Cloud',color: '#4285F4', icon: '☁' },
  { name: 'Vite',        color: '#646CFF', icon: '⚡' },
];

export function TechSection() {
  return (
    <section className="py-20 px-6 bg-[#f8fafc]">
      <div className="max-w-[90%] mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0f3460]/50">
            Stack tecnológica
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1a2e] mt-2 mb-3">
            Tecnologias que usamos
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-[15px]">
            Trabalhamos com as tecnologias mais modernas do mercado para entregar soluções robustas e escaláveis.
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {TECHS.map((t, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-default group"
            >
              <span
                className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl font-bold text-white text-[13px]"
                style={{ background: t.color }}
              >
                {t.icon}
              </span>
              <span className="text-[11px] font-medium text-gray-600 text-center leading-tight">
                {t.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


const STEPS = [
  {
    number: '01',
    title:  'Entendemos o problema',
    desc:   'Ouvimos o cliente, mapeamos as dores e entendemos profundamente o que precisa ser resolvido.',
    color:  '#00D4AA',
  },
  {
    number: '02',
    title:  'Planejamos a solução',
    desc:   'Definimos arquitetura, tecnologias e cronograma. Clareza antes de qualquer linha de código.',
    color:  '#40C4FF',
  },
  {
    number: '03',
    title:  'Desenvolvemos',
    desc:   'Código limpo, componentes reutilizáveis e entregas incrementais com feedback contínuo.',
    color:  '#B39DDB',
  },
  {
    number: '04',
    title:  'Entregamos e evoluímos',
    desc:   'Deploy, documentação e suporte. Sempre prontos para evoluir o produto junto com o cliente.',
    color:  '#FFD740',
  },
];

export function ProcessSection() {
  return (
    <section className="relative py-20 px-6 bg-[#1a1a2e] overflow-hidden">
      <div className="max-w-[90%] mx-auto">
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
            Metodologia
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-3">
            Como trabalhamos
          </h2>
          <p className="text-blue-300/60 max-w-lg mx-auto text-[15px]">
            Um processo claro e transparente do início ao fim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Linha conectora */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-[2px] bg-white/10" />

          {STEPS.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Número */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#1a1a2e] font-extrabold text-lg mb-5 relative z-10 shadow-lg"
                style={{ background: s.color }}
              >
                {s.number}
              </div>
              <h3 className="text-[16px] font-bold text-white mb-2">{s.title}</h3>
              <p className="text-blue-300/60 text-[13px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


const PARTNERS = [
  { name: 'Turma do Bem', desc: 'ONG · Saúde bucal'      },
  { name: 'FIAP',         desc: 'Educação · Tecnologia'   },
  //{ name: 'Colgate',      desc: 'Patrocinador'            },
  //{ name: 'Oral-B',       desc: 'Parceiro estratégico'    },
];

export function PartnersSection() {
  return (
    <section className="py-16 px-10 bg-white border-t border-gray-100">
      <div className="max-w-[90%] mx-auto">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-10">
          Empresas e organizações que confiam na StartUpados
        </p>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PARTNERS.map((p, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center text-white font-bold text-lg mb-3 group-hover:scale-110 transition-transform duration-200">
                {p.name[0]}
              </div>
              <p className="font-bold text-[#1a1a2e] text-[14px]">{p.name}</p>
              <p className="text-gray-700 text-[11px] mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export function CTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="max-w-[90%] mx-auto text-center relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
          Vamos conversar?
        </span>

        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 mb-5 leading-tight">
          Tem um projeto em mente?
          <br />
          <span className="text-amber-400">A gente resolve.</span>
        </h2>

        <p className="text-blue-300/70 max-w-xl mx-auto text-[15px] leading-relaxed mb-10">
          Da ideia ao produto final — desenvolvemos soluções digitais completas para startups,
          empresas e ONGs que querem crescer com tecnologia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/FaleConosco"
            className="inline-flex items-center gap-2 bg-amber-400 text-[#1a1a2e] font-bold px-8 py-4 rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 text-[15px]"
          >
            Fale conosco agora
            <span>→</span>
          </Link>
          <Link
            to="/NossosServicos"
            className="inline-flex items-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 text-[15px] border border-white/20"
          >
            Ver nossos serviços
          </Link>
        </div>
      </div>
    </section>
  );
}