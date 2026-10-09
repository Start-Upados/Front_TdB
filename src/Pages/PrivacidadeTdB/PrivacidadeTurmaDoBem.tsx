import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Política de Privacidade e Exclusão de Dados da Turma do Bem — rota /turma-do-bem/privacidade
 *
 * A seção de exclusão tem id="exclusao-de-dados", então a URL
 * https://www.startupados.com.br/turma-do-bem/privacidade#exclusao-de-dados
 * pode ser usada no campo "URL de exclusão de dados" do app da Meta.
 *
 * ANTES DE PUBLICAR: preencha os campos [PREENCHER] em ORG abaixo
 * e peça para a ONG (e, se possível, um advogado) revisar o texto.
 */

const ORG = {
  nome: 'Turma do Bem',
  razaoSocial: '',
  cnpj: '',
  endereco: '',
  emailPrivacidade: '',
  encarregado: '',
  instagram: '@startupados_tdb',
  site: 'www.startupados.com.br',
  ultimaAtualizacao: '9 de outubro de 2026',
};

const SECOES = [
  { id: 'quem-somos', titulo: '1. Quem somos' },
  { id: 'dados-coletados', titulo: '2. Quais dados coletamos' },
  { id: 'mensagens', titulo: '3. Mensagens pelo Instagram e WhatsApp' },
  { id: 'finalidades', titulo: '4. Para que usamos os dados' },
  { id: 'bases-legais', titulo: '5. Bases legais' },
  { id: 'menores', titulo: '6. Crianças e adolescentes' },
  { id: 'dados-sensiveis', titulo: '7. Dados sensíveis' },
  { id: 'compartilhamento', titulo: '8. Compartilhamento' },
  { id: 'transferencia', titulo: '9. Transferência internacional' },
  { id: 'retencao', titulo: '10. Por quanto tempo guardamos' },
  { id: 'seguranca', titulo: '11. Segurança' },
  { id: 'direitos', titulo: '12. Seus direitos' },
  { id: 'exclusao-de-dados', titulo: '13. Exclusão de dados' },
  { id: 'cookies', titulo: '14. Cookies e dados de navegação' },
  { id: 'alteracoes', titulo: '15. Alterações nesta política' },
  { id: 'contato', titulo: '16. Contato' },
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

export default function PrivacidadeTurmaDoBem() {
  const { hash } = useLocation();

  // React Router não rola até a âncora sozinho: trata #exclusao-de-dados.
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
    document.title = `Política de Privacidade | ${ORG.nome}`;
    return () => {
      document.title = anterior;
    };
  }, []);

  const email = (
    <a href={`mailto:${ORG.emailPrivacidade}`} className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-400">
      {ORG.emailPrivacidade}
    </a>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-sky-700 dark:text-sky-400">{ORG.nome}</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Última atualização: {ORG.ultimaAtualizacao}</p>
          <p className="mt-6 leading-relaxed text-slate-700 dark:text-slate-300">
            Esta política explica, de forma clara, como a {ORG.nome} coleta, usa, guarda, compartilha e protege os
            dados pessoais de quem usa o site {ORG.site}, nossos formulários de cadastro e nossos canais de
            atendimento por mensagem (Instagram e WhatsApp), em conformidade com a Lei Geral de Proteção de Dados
            Pessoais (Lei nº 13.709/2018, “LGPD”).
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
              A {ORG.nome} ({ORG.razaoSocial}, CNPJ {ORG.cnpj}, com sede em {ORG.endereco}) é uma organização sem
              fins lucrativos que oferece tratamento odontológico gratuito por meio de dentistas voluntários, em dois
              programas principais: o <strong>Dentista do Bem</strong>, para jovens de 11 a 17 anos de famílias de
              baixa renda, e o <strong>Apolônias do Bem</strong>, para mulheres maiores de 18 anos que tiveram a
              dentição afetada por violência de gênero.
            </p>
            <p>
              Para os fins da LGPD, a {ORG.nome} é a <strong>controladora</strong> dos dados pessoais tratados nesta
              plataforma, ou seja, é quem decide como e para que os dados são usados. Os fornecedores de tecnologia
              que nos ajudam a operar a plataforma atuam como <strong>operadores</strong>, seguindo nossas
              instruções (veja a seção 8).
            </p>
            <p>
              Nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) é {ORG.encarregado}, que pode ser contatado
              pelo e-mail {email}.
            </p>
          </Secao>

          <Secao id="dados-coletados" titulo="2. Quais dados coletamos">
            <p>Coletamos apenas os dados necessários para cada finalidade. Conforme a forma como você interage conosco:</p>
            <h3 className="font-semibold text-slate-900 dark:text-white">Solicitação de atendimento (beneficiários)</h3>
            <Lista
              itens={[
                'Dados de identificação: nome completo, data de nascimento, RG ou CPF.',
                'Dados de contato: telefone, e-mail, endereço, cidade e estado.',
                'No Dentista do Bem: dados do jovem e do responsável legal, e informações socioeconômicas da família (como faixa de renda familiar), usadas para verificar os critérios do programa.',
                'Informações sobre a condição de saúde bucal e a necessidade de tratamento.',
                'No Apolônias do Bem: informações estritamente necessárias para confirmar a participação no programa, tratadas com sigilo reforçado (veja a seção 7).',
                'Dados gerados pela plataforma: número de protocolo, senha de acesso ao portal do beneficiário, QR Code de identificação, histórico de agendamentos e atendimentos.',
              ]}
            />
            <h3 className="font-semibold text-slate-900 dark:text-white">Cadastro de dentistas voluntários</h3>
            <Lista
              itens={[
                'Nome, RG ou CPF, número de registro no Conselho Regional de Odontologia (CRO), especialidade, contato, cidade de atuação e disponibilidade.',
              ]}
            />
            <h3 className="font-semibold text-slate-900 dark:text-white">Mensagens pelo Instagram e WhatsApp</h3>
            <Lista itens={['Veja a seção 3, que trata especificamente desses canais.']} />
            <h3 className="font-semibold text-slate-900 dark:text-white">Navegação no site</h3>
            <Lista itens={['Dados técnicos, como endereço IP, tipo de navegador e páginas acessadas, registrados pelos nossos provedores de hospedagem para segurança e funcionamento do site.']} />
          </Secao>

          <Secao id="mensagens" titulo="3. Mensagens pelo Instagram e WhatsApp">
            <p>
              Quando você envia uma mensagem para a conta oficial da {ORG.nome} no Instagram ({ORG.instagram}) ou
              para o nosso WhatsApp, a mensagem é recebida pela nossa plataforma por meio das interfaces oficiais da
              Meta Platforms (Instagram Messaging API e WhatsApp Business Platform) e fica disponível para a nossa
              equipe na Central de Mensagens do painel administrativo.
            </p>
            <p>Nesses canais, tratamos:</p>
            <Lista
              itens={[
                'O identificador da sua conta no canal (no Instagram, um identificador numérico fornecido pela Meta e o seu nome de usuário; no WhatsApp, o seu número de telefone e o nome do perfil).',
                'O conteúdo das mensagens de texto que você nos envia e das respostas que enviamos, com data e hora.',
                'As opções que você escolhe nos botões de atendimento automático.',
                'Imagens, áudios e outros anexos não são armazenados pela nossa plataforma: registramos apenas que um anexo foi enviado. O conteúdo permanece nos sistemas da Meta, sob as políticas dela.',
              ]}
            />
            <p>
              <strong>Atendimento automático (pré-triagem).</strong> Ao iniciar uma conversa pelo Instagram, um
              atendimento automático faz algumas perguntas de múltipla escolha (por exemplo, para qual programa é o
              atendimento e a faixa de idade) para indicar o caminho mais adequado. Essa etapa é apenas uma
              orientação inicial: ela não exclui ninguém de forma definitiva, não substitui a análise da nossa
              equipe e sempre permite falar com uma pessoa. Não pedimos, nesse canal, o valor exato da renda nem
              relatos sobre situações de violência. Quando há encaminhamento para cadastro, os dados completos são
              coletados no formulário seguro do nosso site.
            </p>
            <p>
              As mensagens trocadas também ficam registradas nos aplicativos da Meta, conforme a{' '}
              <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">
                Política de Privacidade do Instagram
              </a>{' '}
              e a{' '}
              <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">
                Política de Privacidade do WhatsApp
              </a>
              . Para os lembretes e confirmações de consulta pelo WhatsApp, usamos o número informado no cadastro,
              com o seu consentimento, que pode ser revogado a qualquer momento.
            </p>
          </Secao>

          <Secao id="finalidades" titulo="4. Para que usamos os dados">
            <Lista
              itens={[
                'Receber, analisar e responder solicitações de atendimento.',
                'Verificar se a pessoa atende aos critérios de cada programa e fazer a triagem.',
                'Agendar consultas, enviar lembretes e confirmar presença.',
                'Encaminhar o beneficiário ao dentista voluntário responsável pelo atendimento.',
                'Permitir o acesso ao portal do beneficiário e ao painel do dentista voluntário.',
                'Cadastrar e gerenciar dentistas voluntários.',
                'Responder dúvidas e mensagens recebidas pelos nossos canais.',
                'Produzir indicadores e relatórios de impacto social de forma agregada, sem identificar pessoas.',
                'Cumprir obrigações legais e regulatórias e garantir a segurança da plataforma.',
              ]}
            />
            <p>Não vendemos dados pessoais e não os usamos para publicidade.</p>
          </Secao>

          <Secao id="bases-legais" titulo="5. Bases legais">
            <p>Cada tratamento se apoia em uma das hipóteses previstas na LGPD:</p>
            <Lista
              itens={[
                <><strong>Consentimento</strong> (arts. 7º, I, e 11, I): cadastro nos programas, envio de mensagens pelo WhatsApp e tratamento de dados sensíveis.</>,
                <><strong>Procedimentos preliminares e execução da relação com o titular</strong> (art. 7º, V): análise da solicitação, agendamento e acompanhamento do atendimento.</>,
                <><strong>Tutela da saúde</strong> (art. 11, II, “f”), em procedimento realizado por profissionais de saúde: registros do tratamento odontológico.</>,
                <><strong>Cumprimento de obrigação legal ou regulatória</strong> (arts. 7º, II, e 11, II, “a”): guarda de registros exigidos por lei.</>,
                <><strong>Legítimo interesse</strong> (art. 7º, IX): segurança da plataforma e resposta a mensagens enviadas espontaneamente aos nossos canais, sempre respeitando seus direitos e expectativas.</>,
              ]}
            />
          </Secao>

          <Secao id="menores" titulo="6. Crianças e adolescentes">
            <p>
              O Dentista do Bem atende adolescentes de 11 a 17 anos. Os dados de menores de idade são tratados no seu
              melhor interesse, conforme o art. 14 da LGPD e o Estatuto da Criança e do Adolescente. O cadastro deve
              ser feito ou acompanhado pelo pai, mãe ou responsável legal, que fornece o consentimento específico.
            </p>
            <p>
              Se um adolescente entrar em contato diretamente pelos nossos canais de mensagem, a equipe orienta que o
              cadastro seja feito com o responsável. Coletamos apenas o mínimo necessário e não usamos os dados de
              menores para nenhuma finalidade além do atendimento.
            </p>
          </Secao>

          <Secao id="dados-sensiveis" titulo="7. Dados sensíveis">
            <p>
              Informações sobre saúde e sobre situações de violência são dados pessoais sensíveis (art. 5º, II, da
              LGPD) e recebem proteção reforçada: acesso restrito às pessoas da equipe que precisam deles para o
              atendimento, registro mínimo e nenhum uso fora da finalidade informada.
            </p>
            <p>
              No Apolônias do Bem, adotamos cuidados adicionais de discrição: as mensagens automáticas usam termos
              neutros, não solicitamos relatos detalhados por mensagem e a confirmação dos critérios é feita pela
              equipe, de forma reservada.
            </p>
            <p className="rounded-lg border-l-4 border-sky-600 bg-sky-50 p-4 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Se você estiver em situação de perigo, ligue <strong>190</strong>. Para orientação e apoio a mulheres,
              o <strong>Ligue 180</strong> atende 24 horas, gratuitamente. Violência contra crianças e adolescentes
              pode ser denunciada no <strong>Disque 100</strong>.
            </p>
          </Secao>

          <Secao id="compartilhamento" titulo="8. Compartilhamento">
            <p>Compartilhamos dados apenas quando necessário e somente com:</p>
            <Lista
              itens={[
                <><strong>Dentistas voluntários</strong> responsáveis pelo seu atendimento, que recebem somente as informações necessárias e têm dever de sigilo profissional.</>,
                <><strong>Meta Platforms</strong> (Instagram e WhatsApp), para receber e enviar mensagens pelos canais oficiais.</>,
                <><strong>Provedores de tecnologia</strong> que operam a plataforma sob nossas instruções: hospedagem do site e do servidor de aplicação, banco de dados em nuvem, ferramenta de automação de mensagens e serviço de planilhas usado como cópia de segurança.</>,
                <><strong>Autoridades públicas</strong>, quando exigido por lei ou ordem judicial.</>,
              ]}
            />
            <p>
              Exigimos dos fornecedores medidas de segurança compatíveis com a LGPD e o uso dos dados exclusivamente
              para a prestação do serviço contratado.
            </p>
          </Secao>

          <Secao id="transferencia" titulo="9. Transferência internacional">
            <p>
              Alguns dos nossos fornecedores de tecnologia (como a Meta e provedores de hospedagem e nuvem) podem
              armazenar ou processar dados em servidores fora do Brasil. Nesses casos, a transferência ocorre nos
              termos do art. 33 da LGPD, com fornecedores que adotam cláusulas contratuais e garantias de proteção de
              dados compatíveis com a legislação brasileira.
            </p>
          </Secao>

          <Secao id="retencao" titulo="10. Por quanto tempo guardamos">
            <Lista
              itens={[
                'Conversas pelo Instagram e WhatsApp que não resultaram em cadastro: até 12 meses após a última mensagem, sendo depois excluídas.',
                'Solicitações não aprovadas ou que não se encaixaram nos critérios: até 12 meses após a análise, salvo pedido de exclusão antes disso.',
                'Dados de beneficiários atendidos: enquanto durar o acompanhamento e, depois, pelo prazo exigido pela legislação para registros de atendimento em saúde (incluindo a Lei nº 13.787/2018, quando aplicável).',
                'Dados de dentistas voluntários: enquanto durar a participação no programa e pelo prazo necessário ao cumprimento de obrigações legais.',
                'Dados agregados e anonimizados de impacto social podem ser mantidos por prazo indeterminado, pois não identificam ninguém.',
              ]}
            />
          </Secao>

          <Secao id="seguranca" titulo="11. Segurança">
            <p>Adotamos medidas técnicas e administrativas para proteger os dados, entre elas:</p>
            <Lista
              itens={[
                'Comunicação criptografada (HTTPS) entre o seu navegador, a plataforma e os serviços integrados.',
                'Acesso ao painel administrativo restrito a pessoas autorizadas, com login individual e perfis de acesso.',
                'Validação de autenticidade das mensagens recebidas dos canais da Meta.',
                'Credenciais de integração guardadas fora do código-fonte e com acesso restrito.',
                'Princípio da necessidade: coletamos e exibimos apenas o mínimo exigido para cada finalidade.',
              ]}
            />
            <p>
              Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente de segurança que possa causar
              risco ou dano relevante, comunicaremos os titulares afetados e a Autoridade Nacional de Proteção de
              Dados (ANPD), conforme o art. 48 da LGPD.
            </p>
          </Secao>

          <Secao id="direitos" titulo="12. Seus direitos">
            <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento e sem custo:</p>
            <Lista
              itens={[
                'Confirmar se tratamos seus dados e acessá-los.',
                'Corrigir dados incompletos, inexatos ou desatualizados.',
                'Pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei.',
                'Pedir a portabilidade dos dados a outro fornecedor de serviço.',
                'Pedir a eliminação dos dados tratados com base no seu consentimento.',
                'Saber com quem compartilhamos seus dados.',
                'Ser informado sobre a possibilidade de não fornecer consentimento e suas consequências.',
                'Revogar o consentimento.',
                'Apresentar reclamação à ANPD (gov.br/anpd).',
              ]}
            />
            <p>Para exercer esses direitos, escreva para {email}. Responderemos em até 15 dias.</p>
          </Secao>

          <Secao id="exclusao-de-dados" titulo="13. Exclusão de dados">
            <p>Você pode pedir a exclusão dos seus dados pessoais a qualquer momento, por qualquer um destes canais:</p>
            <ol className="list-decimal space-y-3 pl-6 marker:font-semibold marker:text-slate-500">
              <li>
                <strong>Por e-mail:</strong> envie uma mensagem para {email} com o assunto “Exclusão de dados”,
                informando seu nome completo e, se tiver, o número de protocolo. Se o contato foi pelo Instagram,
                informe também o seu nome de usuário; se foi pelo WhatsApp, o número de telefone usado.
              </li>
              <li>
                <strong>Pelo Instagram:</strong> envie uma mensagem direta para {ORG.instagram} com o texto
                “Quero excluir meus dados”.
              </li>
              <li>
                <strong>Pelo WhatsApp:</strong> envie a mesma mensagem para o nosso número oficial.
              </li>
            </ol>
            <h3 className="font-semibold text-slate-900 dark:text-white">Como tratamos o pedido</h3>
            <Lista
              itens={[
                'Podemos pedir uma confirmação de identidade, para evitar que outra pessoa solicite a exclusão em seu nome.',
                'Respondemos em até 15 dias, informando o que foi excluído.',
                'Excluímos as mensagens, os dados de cadastro e as informações associadas da nossa plataforma e das cópias de segurança sob nosso controle.',
                'Dados que a lei nos obriga a guardar, como registros de atendimento em saúde já realizado, são mantidos apenas pelo prazo legal, com acesso restrito, e excluídos ao final desse prazo. Nesses casos, informaremos quais dados precisaram ser mantidos e por quê.',
                'Se você ainda tiver um tratamento em andamento, explicaremos o impacto da exclusão no atendimento antes de concluí-la.',
              ]}
            />
            <h3 className="font-semibold text-slate-900 dark:text-white">Dados nos aplicativos da Meta</h3>
            <p>
              A exclusão na nossa plataforma não apaga o histórico da conversa dentro do Instagram ou do WhatsApp,
              que fica nos sistemas da Meta. Você pode apagar a conversa no próprio aplicativo. Se você autorizou
              algum aplicativo nosso pela sua conta do Instagram, também pode removê-lo em Configurações → Apps e
              sites.
            </p>
          </Secao>

          <Secao id="cookies" titulo="14. Cookies e dados de navegação">
            <p>
              O site usa apenas os recursos técnicos necessários ao seu funcionamento, como a manutenção da sessão
              de quem está logado no portal do beneficiário, no painel do dentista ou no painel administrativo. Não
              usamos cookies de publicidade nem ferramentas de rastreamento para fins comerciais.
            </p>
          </Secao>

          <Secao id="alteracoes" titulo="15. Alterações nesta política">
            <p>
              Podemos atualizar esta política para refletir mudanças na plataforma ou na legislação. A data da última
              atualização aparece no topo da página. Mudanças relevantes serão comunicadas nos nossos canais.
            </p>
          </Secao>

          <Secao id="contato" titulo="16. Contato">
            <p>Dúvidas sobre esta política ou sobre o tratamento dos seus dados:</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p><strong>{ORG.razaoSocial}</strong> — CNPJ {ORG.cnpj}</p>
              <p>{ORG.endereco}</p>
              <p>Encarregado de Dados (DPO): {ORG.encarregado}</p>
              <p>E-mail: {email}</p>
            </div>
          </Secao>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <Link to="/login" className="text-sky-700 hover:underline dark:text-sky-400">
            ← Voltar para o sistema Turma do Bem
          </Link>
        </footer>
      </div>
    </main>
  );
}
