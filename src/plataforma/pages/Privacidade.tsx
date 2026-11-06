import logoUrl from '../../assets/Immersia_logo-removebg.png';

const sections: { title: string; text: string[] }[] = [
  {
    title: 'Quem trata os seus dados',
    text: [
      'A organização em que você trabalha decide sobre os seus dados de capacitação (controladora). A Immersia opera a plataforma e os treinamentos em realidade virtual em nome dela (operadora).',
    ],
  },
  {
    title: 'Quais dados',
    text: [
      'Cadastro: nome, e-mail e/ou CPF, perfil de acesso e organização.',
      'Capacitação: turmas, cursos, materiais concluídos, resultados dos treinamentos VR (nota, tempo, etapas e erros), validade e certificados.',
      'O óculos (Quest) não recebe nenhum dado seu: só o nome do treinamento. O serviço que roda as sessões VR conhece você apenas por um identificador sem nome.',
    ],
  },
  {
    title: 'Para quê',
    text: [
      'Registrar e comprovar a capacitação exigida pelas Normas Regulamentadoras (cumprimento de obrigação legal da organização) e oferecer os cursos contratados por ela.',
      'Os dados não são vendidos nem usados para publicidade.',
    ],
  },
  {
    title: 'Quem vê',
    text: [
      'Você vê os seus cursos, resultados e certificados. Os instrutores veem os alunos das turmas em que dão aula; os gestores da organização, as pessoas dela. A equipe da Immersia acessa para suporte e operação.',
      'Qualquer pessoa com o código de um certificado impresso pode conferir se ele é verdadeiro: a verificação mostra só o que está impresso.',
    ],
  },
  {
    title: 'Por quanto tempo',
    text: [
      'Enquanto você tiver vínculo com a organização e, depois, pelo prazo em que ela precisa guardar os registros de capacitação. Quando você sai, o gestor pode remover seus dados pessoais: o histórico fica anônimo.',
    ],
  },
  {
    title: 'Seus direitos',
    text: [
      'Você pode baixar os seus dados em Perfil › Baixar meus dados, e pedir correção ou remoção ao gestor da sua organização. Dúvidas sobre o tratamento: privacidade@immersia.com.br.',
    ],
  },
];

/** Aviso de privacidade (página pública). */
export default function Privacidade() {
  return (
    <main className="immersia-bg min-h-screen px-5 py-10 text-white">
      <article className="mx-auto max-w-2xl">
        <img src={logoUrl} alt="Immersia" className="h-12 w-auto" />
        <h1 className="mt-8 text-3xl font-semibold">Aviso de privacidade</h1>
        <p className="mt-2 text-sm text-white/55">
          Plataforma de treinamentos Immersia · LGPD (Lei 13.709/2018)
        </p>
        <div className="mt-8 space-y-7">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-semibold text-white">{s.title}</h2>
              {s.text.map((t) => (
                <p key={t} className="mt-2 text-sm leading-6 text-white/70">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
