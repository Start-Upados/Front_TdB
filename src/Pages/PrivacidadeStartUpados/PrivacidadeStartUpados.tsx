import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Política de Privacidade e Exclusão de Dados do site StartUpados — rota /privacidade
 *
 * Cobre o site institucional da StartUpados. Os sistemas desenvolvidos para
 * clientes (ex.: Turma do Bem) têm política própria, linkada na seção 9.
 *
 * ANTES DE PUBLICAR: preencha os campos [PREENCHER] em EMPRESA abaixo.
 */

const EMPRESA = {
  nome: 'StartUpados',
  razaoSocial: '[PREENCHER: razão social ou nome do responsável]',
  documento: '[PREENCHER: CNPJ, se houver]',
  cidade: 'São Paulo/SP',
  email: '[PREENCHER: e-mail de contato, ex.: contato@startupados.com.br]',
  site: 'www.startupados.com.br',
  ultimaAtualizacao: '9 de outubro de 2026',
};

const SECOES = [
  { id: 'quem-somos', titulo: '1. Quem somos' },
  { id: 'dados-coletados', titulo: '2. Quais dados coletamos' },
  { id: 'finalidades', titulo: '3. Para que usamos os dados' },
  { id: 'bases-legais', titulo: '4. Bases legais' },
  { id: 'compartilhamento', titulo: '5. Compartilhamento' },
  { id: 'transferencia', titulo: '6. Transferência internacional' },
  { id: 'retencao', titulo: '7. Por quanto tempo guardamos' },
  { id: 'seguranca', titulo: '8. Segurança' },
  { id: 'sistemas-clientes', titulo: '9. Sistemas desenvolvidos para clientes' },
  { id: 'direitos', titulo: '10. Seus direitos' },
  { id: 'exclusao-de-dados', titulo: '11. Exclusão de dados' },
  { id: 'cookies', titulo: '12. Cookies' },
  { id: 'alteracoes', titulo: '13. Alterações nesta política' },
  { id: 'contato', titulo: '14. Contato' },
];

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200 pt-8 dark:border-slate-700">
      <h2 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">{titulo}</h2>
      <div className="space-y-4 leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-slate-400">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacidadeStartUpados() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const alvo = document.getElementById(hash.slice(1));
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  useEffect(() => {
    const anterior = document.title;
    document.title = `Política de Privacidade | ${EMPRESA.nome}`;
    return () => {
      document.title = anterior;
    };
  }, []);

  const email = (
    <a href={`mailto:${EMPRESA.email}`} className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-400">
      {EMPRESA.email}
    </a>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-sky-700 dark:text-sky-400">{EMPRESA.nome}</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Última atualização: {EMPRESA.ultimaAtualizacao}</p>
          <p className="mt-6 leading-relaxed text-slate-700 dark:text-slate-300">
            Esta política explica como a {EMPRESA.nome} trata os dados pessoais de quem visita o site {EMPRESA.site} ou
            entra em contato conosco, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº
            13.709/2018, “LGPD”).
          </p>
        </header>

        <nav aria-label="Sumário" className="mb-12 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sumário</h2>
          <ol className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-slate-700 hover:text-sky-700 hover:underline dark:text-slate-300 dark:hover:text-sky-400">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          <Secao id="quem-somos" titulo="1. Quem somos">
            <p>
              A {EMPRESA.nome} ({EMPRESA.razaoSocial}, {EMPRESA.documento}, {EMPRESA.cidade}) desenvolve soluções de
              tecnologia, como sistemas web, integrações e automações, para organizações e empresas. Em relação aos
              dados tratados neste site institucional, a {EMPRESA.nome} é a <strong>controladora</strong>, nos termos
              da LGPD.
            </p>
          </Secao>

          <Secao id="dados-coletados" titulo="2. Quais dados coletamos">
            <Lista
              itens={[
                <><strong>Dados de contato que você nos envia</strong>, por formulário, e-mail ou redes sociais: nome, e-mail, telefone, empresa ou organização e o conteúdo da mensagem.</>,
                <><strong>Dados técnicos de navegação</strong>, registrados automaticamente pelos nossos provedores de hospedagem: endereço IP, tipo de navegador e dispositivo, páginas acessadas, data e hora.</>,
              ]}
            />
            <p>Não pedimos dados sensíveis neste site e pedimos que você não os envie nas mensagens de contato.</p>
          </Secao>

          <Secao id="finalidades" titulo="3. Para que usamos os dados">
            <Lista
              itens={[
                'Responder a contatos, dúvidas e pedidos de orçamento.',
                'Apresentar propostas e conduzir conversas sobre possíveis projetos, quando você as solicitar.',
                'Garantir o funcionamento, a segurança e a prevenção de abusos no site.',
                'Cumprir obrigações legais.',
              ]}
            />
            <p>Não vendemos dados pessoais e não enviamos comunicações de marketing sem a sua autorização.</p>
          </Secao>

          <Secao id="bases-legais" titulo="4. Bases legais">
            <Lista
              itens={[
                <><strong>Procedimentos preliminares a um contrato</strong> (art. 7º, V): quando você nos procura para um orçamento ou projeto.</>,
                <><strong>Legítimo interesse</strong> (art. 7º, IX): resposta a contatos espontâneos e segurança do site.</>,
                <><strong>Consentimento</strong> (art. 7º, I): eventuais comunicações que você autorizar, revogável a qualquer momento.</>,
                <><strong>Cumprimento de obrigação legal</strong> (art. 7º, II): guarda de registros exigidos por lei, como os de acesso a aplicações (Marco Civil da Internet, Lei nº 12.965/2014).</>,
              ]}
            />
          </Secao>

          <Secao id="compartilhamento" titulo="5. Compartilhamento">
            <p>Os dados são compartilhados apenas com:</p>
            <Lista
              itens={[
                'Provedores de tecnologia que operam o site sob nossas instruções, como hospedagem e serviço de e-mail.',
                'Autoridades públicas, quando exigido por lei ou ordem judicial.',
              ]}
            />
          </Secao>

          <Secao id="transferencia" titulo="6. Transferência internacional">
            <p>
              Alguns provedores de hospedagem e nuvem podem armazenar dados em servidores fora do Brasil. Nesses casos,
              a transferência segue o art. 33 da LGPD, com fornecedores que oferecem garantias de proteção de dados
              compatíveis com a legislação brasileira.
            </p>
          </Secao>

          <Secao id="retencao" titulo="7. Por quanto tempo guardamos">
            <Lista
              itens={[
                'Mensagens de contato que não resultaram em projeto: até 12 meses após o último contato.',
                'Dados relacionados a um projeto contratado: enquanto durar a relação e pelo prazo necessário para cumprir obrigações legais e contratuais.',
                'Registros de acesso ao site: pelo prazo previsto no Marco Civil da Internet.',
              ]}
            />
          </Secao>

          <Secao id="seguranca" titulo="8. Segurança">
            <p>
              Usamos conexão criptografada (HTTPS), acesso restrito às informações recebidas e fornecedores que adotam
              boas práticas de segurança. Se ocorrer um incidente que possa causar risco ou dano relevante,
              comunicaremos os titulares afetados e a Autoridade Nacional de Proteção de Dados (ANPD), conforme o art.
              48 da LGPD.
            </p>
          </Secao>

          <Secao id="sistemas-clientes" titulo="9. Sistemas desenvolvidos para clientes">
            <p>
              Alguns sistemas desenvolvidos pela {EMPRESA.nome} são acessados por este mesmo domínio, mas pertencem aos
              nossos clientes. Nesses sistemas, o cliente é o <strong>controlador</strong> dos dados e define suas
              finalidades, e a {EMPRESA.nome} atua apenas como <strong>operadora</strong>, tratando os dados conforme
              as instruções do cliente e para a prestação do serviço.
            </p>
            <p>
              Por isso, cada sistema tem sua própria política de privacidade. É o caso da plataforma da Turma do Bem
              (solicitação de atendimento, portais de paciente e dentista, painel administrativo e canais de mensagem),
              cuja política está em{' '}
              <Link to="/turma-do-bem/privacidade" className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-400">
                Política de Privacidade da Turma do Bem
              </Link>
              . Pedidos sobre dados tratados nesses sistemas devem ser feitos diretamente ao cliente responsável; se
              recebermos um pedido desse tipo, nós o encaminharemos a ele.
            </p>
          </Secao>

          <Secao id="direitos" titulo="10. Seus direitos">
            <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento e sem custo:</p>
            <Lista
              itens={[
                'Confirmar se tratamos seus dados e acessá-los.',
                'Corrigir dados incompletos, inexatos ou desatualizados.',
                'Pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou excessivos.',
                'Pedir a portabilidade dos dados.',
                'Pedir a eliminação dos dados tratados com base no consentimento e revogar esse consentimento.',
                'Saber com quem compartilhamos seus dados.',
                'Apresentar reclamação à ANPD (gov.br/anpd).',
              ]}
            />
            <p>Para exercer esses direitos, escreva para {email}. Responderemos em até 15 dias.</p>
          </Secao>

          <Secao id="exclusao-de-dados" titulo="11. Exclusão de dados">
            <p>Para pedir a exclusão dos dados que você nos enviou por este site ou pelos nossos canais de contato:</p>
            <ol className="list-decimal space-y-3 pl-6 marker:font-semibold marker:text-slate-500">
              <li>
                Envie um e-mail para {email} com o assunto “Exclusão de dados”, informando o nome e o e-mail ou telefone
                usados no contato.
              </li>
              <li>Podemos pedir uma confirmação de identidade, para evitar pedidos feitos em seu nome por outra pessoa.</li>
              <li>
                Em até 15 dias, excluímos os dados e confirmamos por e-mail. Dados que a lei obriga a guardar são
                mantidos apenas pelo prazo legal, e informaremos quais foram.
              </li>
            </ol>
            <p className="rounded-lg border-l-4 border-sky-600 bg-sky-50 p-4 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Se os seus dados estão na plataforma da Turma do Bem (por exemplo, cadastro em um programa ou mensagens
              enviadas à Turma do Bem pelo Instagram ou WhatsApp), siga as instruções da{' '}
              <Link to="/turma-do-bem/privacidade#exclusao-de-dados" className="font-medium underline underline-offset-2">
                seção de exclusão de dados da Turma do Bem
              </Link>
              .
            </p>
          </Secao>

          <Secao id="cookies" titulo="12. Cookies">
            <p>
              O site usa apenas os recursos técnicos necessários ao seu funcionamento. Não usamos cookies de
              publicidade nem ferramentas de rastreamento para fins comerciais.
            </p>
          </Secao>

          <Secao id="alteracoes" titulo="13. Alterações nesta política">
            <p>
              Podemos atualizar esta política a qualquer momento. A data da última atualização aparece no topo da
              página.
            </p>
          </Secao>

          <Secao id="contato" titulo="14. Contato">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p><strong>{EMPRESA.nome}</strong> — {EMPRESA.razaoSocial}</p>
              <p>{EMPRESA.documento} · {EMPRESA.cidade}</p>
              <p>E-mail: {email}</p>
            </div>
          </Secao>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <Link to="/" className="text-sky-700 hover:underline dark:text-sky-400">
            ← Voltar para a página inicial
          </Link>
        </footer>
      </div>
    </main>
  );
}
