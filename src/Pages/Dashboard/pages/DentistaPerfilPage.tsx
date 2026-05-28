import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Calendar, Pause, Check, X,
  CalendarDays, ArrowRight,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Avatar } from '../components/Avatar';
import { obterDentista } from '../services/voluntarios';

export default function DentistaPerfilPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dentista = id ? obterDentista(id) : undefined;

  if (!dentista) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
        <p className="text-sm text-muted">Dentista não encontrado.</p>
        <button
          onClick={() => navigate('/dashboard/voluntarios')}
          className="text-sm px-4 py-2 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors"
        >
          Voltar a Voluntários
        </button>
      </div>
    );
  }

  const isPendente = dentista.status === 'Pendente';

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/dashboard/voluntarios')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Voluntários · {dentista.regiao}
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">

          {/* Avatar + identificação */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar initials={dentista.iniciais} size="lg" tone="info" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg md:text-xl font-semibold text-ink">
                  {dentista.nome}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  dentista.status === 'Ativa'    ? 'bg-success-soft text-success' :
                  dentista.status === 'Inativo'  ? 'bg-warning-soft text-warning' :
                                                    'bg-info-soft text-info'
                }`}>
                  {dentista.status === 'Pendente' ? 'Aguardando aprovação' : dentista.status}
                </span>
              </div>

              <p className="text-sm text-muted mt-2 leading-relaxed">
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
                    <span key={p} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-surface-soft text-muted">
                      {p}
                    </span>
                  ))}
                  {dentista.tags.map((t) => (
                    <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-surface-soft text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ações — full-width no mobile, coluna no desktop */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[200px]">
            {isPendente ? (
              <>
                <button className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl bg-success text-surface hover:opacity-90 transition-opacity">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Aprovar cadastro
                </button>
                <button className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-danger hover:bg-danger-soft transition-colors">
                  <X className="w-4 h-4" strokeWidth={2} />
                  Rejeitar
                </button>
              </>
            ) : (
              <>
                <button className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl bg-ink text-surface hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-4 h-4" strokeWidth={2} />
                  Contatar
                </button>
                <button className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-ink hover:bg-surface-soft transition-colors">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  Ver agenda
                </button>
                <button className="inline-flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl border border-line text-danger hover:bg-danger-soft transition-colors">
                  <Pause className="w-4 h-4" strokeWidth={2} />
                  Suspender
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPIs (não mostra se pendente) */}
      {!isPendente && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Vínculos ativos"       value={dentista.vinculosAtivos}      sub={`de ${dentista.vinculosTotal} no total`} />
          <KpiCard label="Atendimentos em 2025"  value={dentista.atendimentosNoAno}   sub="+14 vs 2024" subTone="success" />
          <KpiCard label="Rating médio"          value={dentista.rating.toFixed(1)}   sub={`${dentista.ratingCount} avaliações`} />
          <KpiCard label="Comparecimento"        value={`${dentista.taxaComparecimento}%`} sub="acima da média" subTone="success" />
        </div>
      )}

      {/* Pacientes ativos */}
      {!isPendente && dentista.pacientesAtivos.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base md:text-sm font-semibold text-ink">
              Pacientes ativos · {dentista.vinculosAtivos} vínculos
            </h2>
            <span className="text-xs text-subtle whitespace-nowrap">Em tratamento agora</span>
          </div>

          <div className="divide-y divide-line">
            {dentista.pacientesAtivos.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-4 py-4 first:pt-1 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar initials={p.iniciais} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink md:text-base">
                      {p.nome}, {p.idade} anos
                    </p>
                    <p className="mt-1 text-xs text-muted md:text-sm">
                      {p.tratamento} · {p.programa}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                        {p.atendimentos} atendimentos
                      </span>
                      <span>vinculado há {p.diasVinculado}d</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    p.status === 'em-andamento' ? 'bg-info-soft text-info' :
                    p.status === 'aguardando'   ? 'bg-warning-soft text-warning' :
                                                  'bg-success-soft text-success'
                  }`}>
                    {p.status === 'em-andamento' ? 'Em andamento' : p.status === 'aguardando' ? 'Aguardando consulta' : 'Concluído'}
                  </span>
                  <button className="w-full rounded-xl border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-soft sm:w-auto">
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dentista.vinculosAtivos > dentista.pacientesAtivos.length && (
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm text-ink transition-colors hover:bg-surface-soft">
              Ver todos os {dentista.vinculosAtivos} pacientes
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Disponibilidade + Últimos atendimentos */}
      {!isPendente && dentista.disponibilidadeSemana.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base md:text-sm font-semibold text-ink">Disponibilidade da semana</h2>
              <span className="text-xs text-subtle whitespace-nowrap">
                {dentista.disponibilidadeSemana.reduce((acc, d) => acc + (d.total - d.ocupados), 0)} slots livres
              </span>
            </div>

            <div className="mb-4 grid grid-cols-5 gap-1.5">
              {dentista.disponibilidadeSemana.map((d) => (
                <div
                  key={d.dia}
                  className={`rounded-lg px-1 py-3 text-center ${
                    d.livre ? 'bg-surface-soft' : 'bg-info-soft'
                  }`}
                >
                  <p className={`text-xs ${d.livre ? 'text-muted' : 'text-info'}`}>{d.dia}</p>
                  <p className={`mt-1 text-sm font-medium ${d.livre ? 'text-muted' : 'text-ink'}`}>
                    {d.livre ? 'livre' : `${d.ocupados}/${d.total}`}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted">
              Horários: <span className="font-medium text-ink">{dentista.horarioConfigurado}</span>
            </p>
            {dentista.proximoSlot && (
              <p className="mt-1 text-xs text-muted">
                Próximo slot livre: <span className="font-medium text-success">{dentista.proximoSlot}</span>
              </p>
            )}
          </div>

          {dentista.ultimosAtendimentos.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
              <h2 className="mb-4 text-base md:text-sm font-semibold text-ink">Últimos atendimentos</h2>
              <div className="divide-y divide-line">
                {dentista.ultimosAtendimentos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0">
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{a.paciente}</p>
                      <p className="mt-0.5 text-xs text-subtle">{a.descricao}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted">{a.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Mensagem específica para pendentes */}
      {isPendente && (
        <div className="rounded-2xl border border-info bg-info-soft p-4 md:p-5 text-sm leading-relaxed text-info">
          Este dentista está aguardando aprovação para entrar na rede.
          Verifique os documentos (CRO, certificados) antes de aprovar.
          Após aprovação, ele recebe acesso ao painel em <code className="rounded-md bg-surface px-1.5 py-0.5 text-xs">/meu-painel</code> e pode configurar horários e receber convites de vinculação.
        </div>
      )}

    </div>
  );
}