import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Calendar, Pause, Check, X,
  CalendarDays, ArrowRight,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { DENTISTAS } from '../data/dentistas';

export default function DentistaPerfilPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dentista = DENTISTAS.find((d) => d.id === id);

  if (!dentista) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-muted">Dentista não encontrado.</p>
        <button onClick={() => navigate('/dashboard/voluntarios')} className="text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
          Voltar a Voluntários
        </button>
      </div>
    );
  }

  const isPendente = dentista.status === 'Pendente';

  return (
    <div className="flex flex-col gap-5 max-w-[1280px]">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/dashboard/voluntarios')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Voluntários · {dentista.regiao}
      </button>

      {/* Header card */}
      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="flex items-center gap-4">
          <Avatar initials={dentista.iniciais} size="lg" tone="info" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-semibold text-ink">{dentista.nome}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${
                dentista.status === 'Ativa'    ? 'bg-success-soft text-success' :
                dentista.status === 'Inativo'  ? 'bg-warning-soft text-warning' :
                                                  'bg-info-soft text-info'
              }`}>
                {dentista.status === 'Pendente' ? 'Aguardando aprovação' : dentista.status}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              {dentista.especialidade} · {dentista.cro} · {dentista.cidade}-{dentista.estado}
              {dentista.bairro && `, ${dentista.bairro}`}
            </p>
            {!isPendente && (
              <p className="text-xs text-subtle mt-1.5">
                Voluntária desde {dentista.voluntariaDesde} · {dentista.anosNaRede} anos de rede
              </p>
            )}
            {(dentista.tags.length > 0 || dentista.programas.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dentista.programas.map((p) => (
                  <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-2xs bg-surface-soft text-muted">{p}</span>
                ))}
                {dentista.tags.map((t) => (
                  <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-2xs bg-surface-soft text-muted">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {isPendente ? (
              <>
                <button className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-success text-surface hover:opacity-90 transition-opacity">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Aprovar cadastro
                </button>
                <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-danger hover:bg-danger-soft transition-colors">
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                  Rejeitar
                </button>
              </>
            ) : (
              <>
                <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-ink text-surface hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                  Contatar
                </button>
                <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                  Ver agenda
                </button>
                <button className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-line text-danger hover:bg-danger-soft transition-colors">
                  <Pause className="w-3.5 h-3.5" strokeWidth={2} />
                  Suspender
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPIs (não mostra se pendente — não tem histórico) */}
      {!isPendente && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Vínculos ativos" value={dentista.vinculosAtivos} sub={`de ${dentista.vinculosTotal} no total`} />
          <KpiCard label="Atendimentos em 2025" value={dentista.atendimentosNoAno} sub="+14 vs 2024" subTone="success" />
          <KpiCard label="Rating médio" value={dentista.rating.toFixed(1)} sub={`${dentista.ratingCount} avaliações`} />
          <KpiCard label="Comparecimento" value={`${dentista.taxaComparecimento}%`} sub="acima da média" subTone="success" />
        </div>
      )}

      {/* Pacientes ativos */}
      {!isPendente && dentista.pacientesAtivos.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">
              Pacientes ativos · {dentista.vinculosAtivos} vínculos
            </h2>
            <span className="text-2xs text-subtle">Em tratamento agora</span>
          </div>
          <div className="divide-y divide-line">
            {dentista.pacientesAtivos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-1">
                <Avatar initials={p.iniciais} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{p.nome}, {p.idade} anos</p>
                  <p className="text-2xs text-muted mt-0.5">{p.tratamento} · {p.programa}</p>
                  <div className="flex items-center gap-3 mt-1 text-2xs text-subtle">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" strokeWidth={2} />{p.atendimentos} atendimentos</span>
                    <span>vinculado há {p.diasVinculado}d</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${
                  p.status === 'em-andamento' ? 'bg-info-soft text-info' :
                  p.status === 'aguardando'   ? 'bg-warning-soft text-warning' :
                                                'bg-success-soft text-success'
                }`}>
                  {p.status === 'em-andamento' ? 'Em andamento' : p.status === 'aguardando' ? 'Aguardando consulta' : 'Concluído'}
                </span>
                <button className="text-xs px-3 py-1.5 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">Ver</button>
              </div>
            ))}
          </div>
          {dentista.vinculosAtivos > dentista.pacientesAtivos.length && (
            <button className="w-full inline-flex items-center justify-center gap-1.5 text-sm py-2 mt-3 rounded-md border border-line text-ink hover:bg-surface-soft transition-colors">
              Ver todos os {dentista.vinculosAtivos} pacientes
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Disponibilidade + Últimos atendimentos */}
      {!isPendente && dentista.disponibilidadeSemana.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">Disponibilidade da semana</h2>
              <span className="text-2xs text-subtle">
                {dentista.disponibilidadeSemana.reduce((acc, d) => acc + (d.total - d.ocupados), 0)} slots livres
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {dentista.disponibilidadeSemana.map((d) => (
                <div
                  key={d.dia}
                  className={`text-center py-2 px-1 rounded-md ${
                    d.livre ? 'bg-surface-soft' : 'bg-info-soft'
                  }`}
                >
                  <p className={`text-2xs ${d.livre ? 'text-muted' : 'text-info'}`}>{d.dia}</p>
                  <p className={`text-xs font-medium mt-1 ${d.livre ? 'text-muted' : 'text-ink'}`}>
                    {d.livre ? 'livre' : `${d.ocupados}/${d.total}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-2xs text-muted">
              Horários configurados: <span className="font-medium text-ink">{dentista.horarioConfigurado}</span>
            </p>
            {dentista.proximoSlot && (
              <p className="text-2xs text-muted mt-1">
                Próximo slot livre: <span className="font-medium text-success">{dentista.proximoSlot}</span>
              </p>
            )}
          </div>

          {dentista.ultimosAtendimentos.length > 0 && (
            <div className="bg-surface border border-line rounded-xl p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Últimos atendimentos</h2>
              <div className="divide-y divide-line">
                {dentista.ultimosAtendimentos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs first:pt-0">
                    <div>
                      <p className="font-medium text-ink">{a.paciente}</p>
                      <p className="text-2xs text-subtle mt-0.5">{a.descricao}</p>
                    </div>
                    <span className="text-muted whitespace-nowrap">{a.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Mensagem específica para pendentes */}
      {isPendente && (
        <div className="bg-info-soft border border-info rounded-xl p-5 text-sm text-info">
          Este dentista está aguardando aprovação para entrar na rede.
          Verifique os documentos (CRO, certificados) antes de aprovar.
          Após aprovação, ele recebe acesso ao painel em <code className="bg-surface px-1.5 py-0.5 rounded">/meu-painel</code> e pode configurar horários e receber convites de vinculação.
        </div>
      )}

    </div>
  );
}