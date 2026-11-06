export type Locale = 'pt-BR' | 'en-US' | 'es-ES';
export type LocaleFlagCode = 'br' | 'us' | 'es';

export type LocaleOption = {
  code: Locale;
  label: string;
  nativeLabel: string;
  flagCode: LocaleFlagCode;
};

export const defaultLocale: Locale = 'pt-BR';

export const localeOptions: LocaleOption[] = [
  {
    code: 'pt-BR',
    label: 'Português (pt-BR)',
    nativeLabel: 'Português',
    flagCode: 'br',
  },
  {
    code: 'en-US',
    label: 'English (en-US)',
    nativeLabel: 'English',
    flagCode: 'us',
  },
  {
    code: 'es-ES',
    label: 'Español (es-ES)',
    nativeLabel: 'Español',
    flagCode: 'es',
  },
];

const enUS: Record<string, string> = {
  'Abrir menu': 'Open menu',
  'Fechar menu': 'Close menu',
  'Meu perfil': 'My profile',
  'Sair': 'Sign out',
  'Encerrar sessão': 'End session',
  'Voltar para o login': 'Back to login',
  'Selecionar idioma': 'Select language',
  'Idioma': 'Language',
  'Idioma da plataforma': 'Platform language',
  'Português': 'Portuguese',
  'Inglês': 'English',
  'Espanhol': 'Spanish',

  'Tela de login': 'Login screen',
  'Entrar na plataforma': 'Sign in to the platform',
  'Acesse com seu usuário para continuar.': 'Sign in with your account to continue.',
  'Preencha usuário/e-mail e senha para continuar.': 'Enter your email and password to continue.',
  'O e-mail ou a senha estão incorretos.': 'The email or password is incorrect.',
  'Informe seu e-mail.': 'Enter your email.',
  'Informe sua senha.': 'Enter your password.',
  'E-mail': 'Email',
  'Senha': 'Password',
  'Lembrar de mim': 'Remember me',
  'Esqueci a senha': 'Forgot password',
  'Entrar': 'Sign in',

  'Visão geral': 'Overview',
  'Resumo operacional da plataforma': 'Platform operations summary',
  'Organizações': 'Organizations',
  'Organizações e módulos contratados': 'Organizations and contracted modules',
  'Usuários': 'Users',
  'usuário': 'user',
  'usuários': 'users',
  'Controle de acessos e perfis': 'Access and role management',
  'Turmas': 'Groups',
  'turma': 'group',
  'turmas': 'groups',
  'Grupos, alunos e módulos': 'Groups, students, and modules',
  'Alunos': 'Students',
  'aluno': 'student',
  'alunos': 'students',
  'Turma, tentativas e resultados': 'Group, attempts, and results',
  'Galeria': 'Gallery',
  'Treinamentos disponíveis': 'Available trainings',
  'Perfil': 'Profile',
  'Dados da sessão atual': 'Current session data',
  'Workspace': 'Workspace',

  'Dados do usuário': 'User data',
  'Nome completo': 'Full name',
  'Foto do perfil': 'Profile photo',
  'Enviar foto': 'Upload photo',
  'PNG ou JPG, até 5 MB': 'PNG or JPG, up to 5 MB',
  'E-mail verificado': 'Email verified',
  'Verificação pendente': 'Verification pending',
  'Novo e-mail aguardando validação': 'New email awaiting validation',
  'Confirmação de e-mail': 'Email confirmation',
  'Salve as alterações para iniciar a validação do novo endereço. Depois, informe o código de 6 dígitos recebido por e-mail.':
    'Save your changes to start validating the new address. Then enter the 6-digit code received by email.',
  'O campo será habilitado quando houver uma troca de e-mail pendente.':
    'This field will be enabled when an email change is pending.',
  'Aguardando troca': 'Waiting for change',
  'Confirmar código': 'Confirm code',
  'Código de confirmação preparado para validação pelo backend.':
    'Confirmation code prepared for backend validation.',
  'Documento': 'Document',
  'CPF ou documento interno': 'Tax ID or internal document',
  'Sexo': 'Sex',
  'Não informado': 'Not informed',
  'Feminino': 'Female',
  'Masculino': 'Male',
  'Outro': 'Other',
  'Data de nascimento': 'Date of birth',
  'Organização': 'Organization',
  'Perfil de acesso': 'Access profile',
  'Senha da conta': 'Account password',
  'Use uma senha com pelo menos 8 caracteres e combine letras, números e símbolos.':
    'Use a password with at least 8 characters and combine letters, numbers, and symbols.',
  'Senha atual': 'Current password',
  'Digite a sua senha atual': 'Enter your current password',
  'Nova senha': 'New password',
  'Defina uma nova senha': 'Set a new password',
  'Confirmar nova senha': 'Confirm new password',
  'Repita a nova senha': 'Repeat the new password',
  'Descartar alterações': 'Discard changes',
  'Salvar alterações': 'Save changes',
  'Nenhuma alteração foi identificada para envio.': 'No changes were identified for submission.',
  'Alterações preparadas para envio:': 'Changes prepared for submission:',
  'nome': 'name',
  'e-mail com nova verificação': 'email with new verification',
  'código de confirmação do e-mail': 'email confirmation code',
  'dados pessoais': 'personal data',
  'foto do perfil': 'profile photo',
  'senha após validação da senha atual': 'password after current password validation',

  'Admin da organização': 'Organization admin',
  'Instrutor': 'Instructor',
  'Aluno': 'Student',
  'Super Admin': 'Super Admin',
  'Ativo': 'Active',
  'Ativa': 'Active',
  'Convidado': 'Invited',
  'Desativado': 'Disabled',
  'Desativada': 'Disabled',
  'Arquivada': 'Archived',
  'Concluída': 'Completed',
  'Transferida': 'Transferred',
  'Em implantação': 'Onboarding',
  'Aprovado': 'Approved',
  'Aprovada': 'Approved',
  'Pendente': 'Pending',
  'Reforço': 'Reinforcement',
  'Reforço recomendado': 'Reinforcement recommended',
  'Atenção': 'Attention',
  'Crítico': 'Critical',
  'Saudável': 'Healthy',
  'Liberado': 'Enabled',
  'Bloqueado': 'Blocked',
  'Disponível em breve': 'Coming soon',

  'Buscar usuário': 'Search user',
  'Buscar aluno': 'Search student',
  'Buscar organização': 'Search organization',
  'Buscar por módulo ou treinamento': 'Search by module or training',
  'Todos os status': 'All statuses',
  'Todos os perfis': 'All profiles',
  'Todos os módulos': 'All modules',
  'Todas as turmas': 'All groups',
  'Todos os níveis': 'All levels',
  'Exibindo': 'Showing',
  'Mostrando': 'Showing',
  'de': 'of',
  'em': 'in',
  'treinamentos em': 'trainings in',
  'alunos em': 'students in',
  'turmas da organização.': 'groups in the organization.',
  'turmas ativas.': 'active groups.',
  'módulos.': 'modules.',
  'Ativos': 'Active',
  'Convidados': 'Invited',
  'Desativados': 'Disabled',
  'Ativas': 'Active',
  'Desativadas': 'Disabled',
  'ativa': 'active',
  'ativas': 'active',
  'ativo': 'active',
  'ativos': 'active',
  'desativada': 'disabled',
  'desativadas': 'disabled',
  'desativado': 'disabled',
  'desativados': 'disabled',
  'liberação': 'release',
  'liberações': 'releases',
  'execução': 'execution',
  'execuções': 'executions',
  'pendente': 'pending',
  'pendentes': 'pending',

  'Anterior': 'Previous',
  'Próxima': 'Next',
  'Ações': 'Actions',
  'Detalhes': 'Details',
  'Ver detalhes': 'View details',
  'Editar': 'Edit',
  'Excluir': 'Delete',
  'Remover': 'Remove',
  'Cancelar': 'Cancel',
  'Salvar': 'Save',
  'Criar': 'Create',
  'Confirmar': 'Confirm',
  'Ver aluno': 'View student',
  'Ver log': 'View log',
  'Ver relatório': 'View report',
  'Realizar treinamento': 'Start training',
  'Ver resultados': 'View results',
  'Iniciar treinamento': 'Start training',
  'Voltar para alunos': 'Back to students',
  'Voltar para galeria': 'Back to gallery',
  'Voltar para organizações': 'Back to organizations',
  'Voltar para turmas': 'Back to groups',

  'Organizações cadastradas': 'Registered organizations',
  'organização': 'organization',
  'organizações': 'organizations',
  'Visão objetiva dos contratos e da composição de usuários por organização.':
    'Objective view of contracts and user composition by organization.',
  'Nova organização': 'New organization',
  'Criar organização': 'Create organization',
  'Excluir organização': 'Delete organization',
  'Nome da organização': 'Organization name',
  'Gerencie organizações clientes, admins da organização e módulos liberados para cada contrato.':
    'Manage client organizations, organization admins, and modules enabled for each contract.',
  'Cadastre os dados básicos da organização cliente. Módulos e admins podem ser configurados na tela de detalhes.':
    'Register the client organization basics. Modules and admins can be configured on the details page.',
  'Atualize os dados básicos e o status do contrato da organização.':
    'Update the organization basics and contract status.',
  'Nenhuma organização encontrada com os filtros atuais.':
    'No organization found with the current filters.',
  'Esta ação removeria': 'This action would remove',
  'da listagem local. No backend real, o ideal será desativar o contrato antes de excluir dados.':
    'from the local list. In the real backend, the contract should ideally be disabled before deleting data.',

  'Usuários cadastrados': 'Registered users',
  'Novo usuário': 'New user',
  'Editar usuário': 'Edit user',
  'Excluir usuário': 'Delete user',
  'Criar usuário': 'Create user',
  'Nome': 'Name',
  'Role': 'Role',
  'Status': 'Status',
  'Cadastrar instrutores e alunos vinculados à sua organização.':
    'Register instructors and students linked to your organization.',
  'Este e-mail já está cadastrado.': 'This email is already registered.',

  'Turmas cadastradas': 'Registered groups',
  'Nova turma': 'New group',
  'Criar turma': 'Create group',
  'Editar turma': 'Edit group',
  'Excluir turma': 'Delete group',
  'Detalhes da turma': 'Group details',
  'Adicionar aluno': 'Add student',
  'Adicionar módulo': 'Add module',
  'Remover aluno': 'Remove student',
  'Remover módulo': 'Remove module',
  'Selecione o aluno e confirme o vínculo com esta turma.':
    'Select the student and confirm the link with this group.',
  'Selecione o módulo e confirme a liberação para esta turma.':
    'Select the module and confirm access for this group.',
  'Um aluno deve ter somente uma turma ativa por vez. Se ele mudar de turma, a membership anterior deve ser encerrada para preservar o histórico.':
    'A student should have only one active group at a time. If they change groups, the previous membership should be closed to preserve history.',

  'Treinamentos': 'Trainings',
  'treinamento': 'training',
  'treinamentos': 'trainings',
  'Catálogo da plataforma': 'Platform catalog',
  'Módulo': 'Module',
  'Módulos': 'Modules',
  'módulo': 'module',
  'módulos': 'modules',
  'Treinamento': 'Training',
  'tentativa': 'attempt',
  'Tentativas': 'Attempts',
  'tentativas': 'attempts',
  'registro': 'record',
  'registros': 'records',
  'Resultados por aluno': 'Results by student',
  'Tentativas do treinamento': 'Training attempts',
  'Registro por execução, com acesso ao relatório textual registrado.':
    'Execution log with access to the registered text report.',
  'Resultados do treinamento': 'Training results',
  'Resumo': 'Summary',
  'Execuções recentes': 'Recent executions',
  'Comparativo por módulo': 'Comparison by module',

  'Média geral': 'Overall average',
  'Média': 'Average',
  'Aprovação': 'Approval',
  'Participação': 'Participation',
  'Aprendizado': 'Learning',
  'Tempo médio': 'Average time',
  'Melhor nota': 'Best score',
  'Risco atual': 'Current risk',
  'Acurácia': 'Accuracy',
  'Erros críticos': 'Critical errors',
  'Dicas usadas': 'Hints used',
  'Nota média.': 'Average score.',
  'Por execução.': 'Per execution.',
  'Aprovadas.': 'Approved.',
  'Maior nota.': 'Highest score.',
  'Prioridade.': 'Priority.',

  'Dados do aluno': 'Student data',
  'Histórico de turmas': 'Group history',
  'Histórico e logs por tentativa': 'Attempt history and logs',
  'Informações cadastrais e histórico de turmas vinculadas ao aluno.':
    'Registration information and group history linked to the student.',
  'Lista compacta para acompanhar vínculos atuais e anteriores.':
    'Compact list to track current and previous links.',
  'Registro cronológico das execuções, com score, acurácia, tempo, desfecho e acesso ao log registrado.':
    'Chronological execution log with score, accuracy, time, outcome, and access to the registered log.',
  'Último acesso': 'Last access',
  'Última turma': 'Last group',
  'Turma atual': 'Current group',
  'Entrada na turma atual': 'Current group entry',
  'Entrada na turma': 'Group entry',
  'Entrada': 'Entry',
  'Saída': 'Exit',
  'Em andamento': 'In progress',
  'Sem atividade': 'No activity',
  'Sem turma ativa': 'No active group',
  'Sem código': 'No code',

  'Relatório da execução': 'Execution report',
  'Indicadores': 'Indicators',
  'Leitura pedagógica registrada': 'Registered pedagogical reading',
  'Painel da organização': 'Organization dashboard',
  'Painel da plataforma': 'Platform dashboard',
  'Visão executiva da operação de treinamentos, com carga por instrutor, pendências e sinais de risco.':
    'Executive view of training operations, with instructor workload, pending items, and risk signals.',
  'Gerenciar usuários': 'Manage users',
  'Ver turmas': 'View groups',
  'Ações rápidas': 'Quick actions',
  'Cadastrar admins': 'Register admins',
  'Revisar catálogo': 'Review catalog',
  'Criar empresa cliente': 'Create client organization',
  'Gerenciar organizações': 'Manage organizations',
  'Abrir organizações': 'Open organizations',
  'Painel Immersia': 'Immersia dashboard',
  'Painel de aprendizagem': 'Learning dashboard',
  'Visão consolidada das suas turmas, com participação, desempenho e sinais de reforço.':
    'Consolidated group view with participation, performance, and reinforcement signals.',
  'Visão administrativa da operação: organizações clientes, admins, usuários e liberação de módulos.':
    'Administrative view of the operation: client organizations, admins, users, and module access.',
  'Visão geral da plataforma': 'Platform overview',
  'Painel inicial com o recorte operacional do perfil autenticado, atualizado a partir dos dados disponíveis.':
    'Initial dashboard with the operational view for the authenticated role, updated from available data.',
  'Catálogo': 'Catalog',
  'Cobertura': 'Coverage',
  'Usuários da organização': 'Organization users',
  'Módulos liberados': 'Enabled modules',
  'Perfis operacionais': 'Operational profiles',
  'Organizações clientes': 'Client organizations',
  'Recorte de status, admins e módulos liberados por organização.':
    'Snapshot of status, admins, and enabled modules by organization.',
  'Liberação por módulo': 'Module access',
  'Visão rápida de quantas organizações possuem acesso a cada módulo do catálogo.':
    'Quick view of how many organizations have access to each catalog module.',
  'liberações ativas': 'active releases',
  'Admins de organização.': 'Organization admins.',
  'Acompanhamento operacional.': 'Operational monitoring.',
  'Treinamentos VR.': 'VR trainings.',
  'Organizações clientes cadastradas na plataforma.':
    'Client organizations registered on the platform.',
  'Organizações em implantação ou com acesso pausado.':
    'Organizations in onboarding or with paused access.',
  'Usuários responsáveis por gerir organizações clientes.':
    'Users responsible for managing client organizations.',
  'Perfis cadastrados entre Immersia, organizações, instrutores e alunos.':
    'Profiles registered across Immersia, organizations, instructors, and students.',
  'Instrutores cadastrados nas organizações clientes.':
    'Instructors registered in client organizations.',
  'Módulos do catálogo e quantidade de liberações para organizações.':
    'Catalog modules and number of releases for organizations.',
  'Percentual de organizações com pelo menos um módulo liberado.':
    'Percentage of organizations with at least one enabled module.',
  'Total de treinamentos disponíveis no catálogo de estudos.':
    'Total trainings available in the study catalog.',

  'Turmas ativas': 'Active groups',
  'Grupos disponíveis para acompanhamento.': 'Groups available for monitoring.',
  'Turmas ativas que podem receber alunos, módulos e acompanhamento de resultados.':
    'Active groups that can receive students, modules, and results monitoring.',
  'Alunos cadastrados na organização.': 'Students registered in the organization.',
  'Total de alunos disponíveis para vínculo em turmas da organização.':
    'Total students available to be linked to organization groups.',
  'Módulos disponíveis para vincular às turmas.': 'Modules available to link to groups.',
  'Módulos liberados para a organização e disponíveis para as turmas.':
    'Modules enabled for the organization and available to groups.',
  'Buscar turma': 'Search group',
  'Filtrar turmas por status': 'Filter groups by status',
  'Criar nova turma': 'Create new group',
  'Preencha os dados básicos da turma. No backend, essa ação deve criar o grupo dentro da organização atual.':
    'Fill in the group basics. In the backend, this action should create the group inside the current organization.',
  'Resumo do objetivo da turma': 'Summary of the group objective',
  'Turma não encontrada': 'Group not found',
  'A turma solicitada não está disponível para a organização atual.':
    'The requested group is not available for the current organization.',
  'Selecionar aluno': 'Select student',
  'Sem alunos disponíveis': 'No students available',
  'Selecionar módulo': 'Select module',
  'Sem módulos disponíveis': 'No modules available',
  'Selecionar aluno para adicionar': 'Select student to add',
  'Selecionar módulo para liberar': 'Select module to enable',
  'Remover aluno da turma': 'Remove student from group',
  'Liberar módulo': 'Enable module',
  'Remover módulo da turma': 'Remove module from group',
  'Confirme a remoção do vínculo ativo. O histórico de tentativas deve continuar preservado para consultas futuras.':
    'Confirm removal of the active link. The attempt history should remain preserved for future queries.',
  'Selecione um módulo contratado pela organização e confirme a liberação para esta turma.':
    'Select a module contracted by the organization and confirm access for this group.',
  'Confirme a remoção da liberação. Os resultados já registrados continuam disponíveis no histórico.':
    'Confirm access removal. Existing results remain available in the history.',

  'Alunos cadastrados': 'Registered students',
  'Filtrar por turma': 'Filter by group',
  'Filtrar por status': 'Filter by status',
  'Aluno não encontrado': 'Student not found',
  'O registro solicitado não está disponível para a organização ou ainda não possui dados suficientes.':
    'The requested record is not available for the organization or does not yet have enough data.',
  'Dados do Aluno': 'Student data',
  'Com execução': 'With execution',
  'com execução': 'with execution',
  'Alunos com execução.': 'Students with executions.',
  'Quantidade de alunos atualmente vinculados à turma.':
    'Number of students currently linked to the group.',
  'Percentual de alunos da turma com pelo menos uma tentativa registrada.':
    'Percentage of group students with at least one recorded attempt.',
  'Média das notas registradas nas execuções desta turma.':
    'Average score recorded in this group executions.',
  'Variação média entre primeira e última tentativa dos alunos com histórico suficiente.':
    'Average variation between first and latest attempt for students with enough history.',
  'Execuções aprovadas.': 'Approved executions.',
  'Percentual de execuções da turma com resultado aprovado.':
    'Percentage of group executions with an approved result.',
  'Nas execuções.': 'In executions.',
  'Total de erros críticos registrados nas tentativas da turma.':
    'Total critical errors recorded in group attempts.',
  'Apoios solicitados.': 'Requested support.',
  'Quantidade de dicas usadas nas execuções da turma.':
    'Number of hints used during group executions.',
  'Liberados.': 'Enabled.',
  'Quantidade de módulos liberados para a turma.': 'Number of modules enabled for the group.',

  'Organização não encontrada': 'Organization not found',
  'A organização solicitada não está disponível na base atual.':
    'The requested organization is not available in the current dataset.',
  'Editar organização': 'Edit organization',
  'Gestores da organização.': 'Organization managers.',
  'Admins vinculados à organização cliente.': 'Admins linked to the client organization.',
  'Acompanhamento.': 'Monitoring.',
  'Instrutores que podem acompanhar turmas, alunos e resultados.':
    'Instructors who can monitor groups, students, and results.',
  'Alunos vinculados à organização.': 'Students linked to the organization.',
  'Módulos liberados para a organização.': 'Modules enabled for the organization.',
  'Filtrar usuários por perfil': 'Filter users by role',
  'Filtrar usuários por status': 'Filter users by status',
  'Selecionar status da organização': 'Select organization status',
  'Salvar módulos': 'Save modules',
  'Selecione quais módulos ficam disponíveis para a organização.':
    'Select which modules are available to the organization.',
  'Novo admin da organização': 'New organization admin',
  'Cadastre um admin vinculado a esta organização.':
    'Register an admin linked to this organization.',
  'Selecionar status do admin': 'Select admin status',
  'Desativar admin da organização': 'Disable organization admin',
  'O acesso deste admin será bloqueado, mas o registro continuará disponível para auditoria e histórico.':
    'This admin access will be blocked, but the record will remain available for audit and history.',

  'Usuários da sua organização, com gestão de instrutores e alunos.':
    'Users in your organization, with instructor and student management.',
  'Usuários cadastrados em todas as organizações da plataforma.':
    'Users registered across all platform organizations.',
  'Selecionar perfil de acesso': 'Select access profile',
  'Selecionar status do usuário': 'Select user status',
  'Selecionar organização': 'Select organization',
  'Remover usuário': 'Remove user',
  'Confirme a remoção deste usuário da plataforma. No backend, essa ação deve validar vínculos e preservar histórico de aprendizagem.':
    'Confirm removal of this user from the platform. In the backend, this action should validate links and preserve learning history.',
  'Cadastre instrutores e alunos vinculados à sua organização.':
    'Register instructors and students linked to your organization.',

  'Resultados não encontrados': 'Results not found',
  'O treinamento solicitado não está disponível para a organização atual ou ainda não possui dados.':
    'The requested training is not available for the current organization or does not have data yet.',
  'Acompanhe desempenho, participação e tentativas dos alunos neste treinamento.':
    'Monitor student performance, participation, and attempts in this training.',
  'Com acesso.': 'With access.',
  'Quantidade de turmas ativas consideradas na análise deste treinamento.':
    'Number of active groups considered in this training analysis.',
  'Percentual de alunos da organização que possuem pelo menos uma tentativa neste treinamento.':
    'Percentage of organization students with at least one attempt in this training.',
  'Média das notas registradas em todas as tentativas deste treinamento.':
    'Average score recorded across all attempts for this training.',
  'Tentativas aprovadas.': 'Approved attempts.',
  'Percentual médio de acertos nas tentativas registradas para este treinamento.':
    'Average correct-answer percentage in recorded attempts for this training.',
  'Alunos em atenção.': 'Students needing attention.',
  'Alunos cuja tentativa mais recente indica necessidade de reforço.':
    'Students whose most recent attempt indicates a need for reinforcement.',

  'Seleção do extintor correto': 'Selecting the correct extinguisher',
  'Inspeção inicial da área': 'Initial area inspection',
  'Resposta ao princípio de incêndio': 'Initial fire response',
  'Abandono de área em emergência': 'Emergency area evacuation',
  'Introdução à NR-10': 'Introduction to NR-10',
  'Bloqueio e etiquetagem': 'Lockout and tagout',
  'Reconhecimento de riscos elétricos': 'Electrical risk recognition',
  'Trabalho em altura': 'Work at height',
  'Sistema de ancoragem': 'Anchorage system',
  'Resgate e evacuação': 'Rescue and evacuation',
  'Treinamentos para prevenção e combate a incêndio, resposta inicial e uso correto de equipamentos.':
    'Training for fire prevention and firefighting, initial response, and correct equipment use.',
  'Treinamentos voltados à segurança em instalações e serviços com eletricidade.':
    'Training focused on safety in electrical installations and services.',
  'Treinamentos para trabalho em altura, avaliação de risco e preparação da atividade.':
    'Training for work at height, risk assessment, and activity preparation.',
  'Identifique a classe do fogo e selecione o extintor mais adequado para cada ocorrência.':
    'Identify the fire class and select the most appropriate extinguisher for each event.',
  'Reconheça riscos, rotas de fuga e condições do ambiente antes do início da resposta.':
    'Recognize risks, escape routes, and environmental conditions before starting the response.',
  'Treine a sequência operacional esperada para os primeiros minutos da ocorrência.':
    'Practice the expected operational sequence for the first minutes of the event.',
  'Revise a lógica de evacuação e conduza a saída com segurança até o ponto de encontro.':
    'Review evacuation logic and lead a safe exit to the assembly point.',

  'Análise de aprendizagem': 'Learning analytics',
  'Evolução das pendências': 'Pending executions trend',
  'Sem execuções suficientes para calcular a evolução das pendências.': 'Not enough executions to chart pending items.',
  'Nota consolidada.': 'Consolidated score.',
  'Concentração das tentativas por faixa de nota.': 'Attempts by score range.',
  'Faixas de nota': 'Score ranges',
  'Em breve': 'Coming soon',
  'Disponível': 'Available',
  'Sem turmas': 'No groups',
  'Turma arquivada': 'Archived group',
  'Sem média': 'No average',
  'Sem tentativas': 'No attempts',
  'Em breve: treinamento em desenvolvimento.': 'Coming soon: training in development.',
  'Treinamento em desenvolvimento, disponível em breve.': 'Training in development, coming soon.',
  'Abrir no Meta Quest': 'Open on Meta Quest',
  'Meta Quest (app Immersia)': 'Meta Quest (Immersia app)',
  'Navegador (web)': 'Browser (web)',
  'Link de abertura': 'Launch link',
  'Identificador (gerado do título)': 'Identifier (generated from the title)',
  'Execução': 'Execution',
  'Treinamentos VR': 'VR trainings',
  'Alunos das suas turmas ativas.': 'Students in your active groups.',
  'Turmas ativas em que você é o instrutor responsável.': 'Active groups where you are the instructor in charge.',
  'Alunos com vínculo ativo nas suas turmas.': 'Students actively enrolled in your groups.',
  'Incêndio classe A: escolha e uso do extintor': 'Class A fire: choosing and using the extinguisher',
  'Prevenção e combate a incêndio: resposta inicial a incêndio classe A e uso correto do extintor (NR-23 / NBR 12693).': 'Fire prevention and firefighting: initial response to class A fires and correct extinguisher use (NR-23 / NBR 12693).',
  'Segurança em instalações e serviços com eletricidade. Treinamento em desenvolvimento.': 'Safety in electrical installations and services. Training in development.',
  'Segurança e saúde nos trabalhos em espaços confinados. Treinamento em desenvolvimento.': 'Health and safety in confined spaces. Training in development.',
  'Entrada segura em espaço confinado': 'Safe confined space entry',
  'Resposta inicial a princípio de incêndio': 'Initial response to an incipient fire',
  'Abandono de área e rotas de fuga': 'Area evacuation and escape routes',
  'Fundamentos de segurança elétrica': 'Electrical safety fundamentals',
  'Leitura de risco elétrico em campo': 'Reading electrical risk in the field',
  'Entrada e permanência em espaço confinado': 'Confined space entry and stay',
};

const es: Record<string, string> = {
  'Abrir menu': 'Abrir menú',
  'Fechar menu': 'Cerrar menú',
  'Meu perfil': 'Mi perfil',
  'Sair': 'Salir',
  'Encerrar sessão': 'Cerrar sesión',
  'Voltar para o login': 'Volver al inicio de sesión',
  'Selecionar idioma': 'Seleccionar idioma',
  'Idioma': 'Idioma',
  'Idioma da plataforma': 'Idioma de la plataforma',
  'Português': 'Portugués',
  'Inglês': 'Inglés',
  'Espanhol': 'Español',

  'Tela de login': 'Pantalla de inicio de sesión',
  'Entrar na plataforma': 'Entrar en la plataforma',
  'Acesse com seu usuário para continuar.': 'Accede con tu cuenta para continuar.',
  'Preencha usuário/e-mail e senha para continuar.': 'Introduce tu e-mail y contraseña para continuar.',
  'O e-mail ou a senha estão incorretos.': 'El e-mail o la contraseña son incorrectos.',
  'Informe seu e-mail.': 'Introduce tu e-mail.',
  'Informe sua senha.': 'Introduce tu contraseña.',
  'E-mail': 'E-mail',
  'Senha': 'Contraseña',
  'Lembrar de mim': 'Recordarme',
  'Esqueci a senha': 'Olvidé mi contraseña',
  'Entrar': 'Entrar',

  'Visão geral': 'Vista general',
  'Resumo operacional da plataforma': 'Resumen operativo de la plataforma',
  'Organizações': 'Organizaciones',
  'Organizações e módulos contratados': 'Organizaciones y módulos contratados',
  'Usuários': 'Usuarios',
  'usuário': 'usuario',
  'usuários': 'usuarios',
  'Controle de acessos e perfis': 'Control de accesos y perfiles',
  'Turmas': 'Grupos',
  'turma': 'grupo',
  'turmas': 'grupos',
  'Grupos, alunos e módulos': 'Grupos, alumnos y módulos',
  'Alunos': 'Alumnos',
  'aluno': 'alumno',
  'alunos': 'alumnos',
  'Turma, tentativas e resultados': 'Grupo, intentos y resultados',
  'Galeria': 'Galería',
  'Treinamentos disponíveis': 'Entrenamientos disponibles',
  'Perfil': 'Perfil',
  'Dados da sessão atual': 'Datos de la sesión actual',
  'Workspace': 'Área de trabajo',

  'Dados do usuário': 'Datos del usuario',
  'Nome completo': 'Nombre completo',
  'Foto do perfil': 'Foto de perfil',
  'Enviar foto': 'Subir foto',
  'PNG ou JPG, até 5 MB': 'PNG o JPG, hasta 5 MB',
  'E-mail verificado': 'E-mail verificado',
  'Verificação pendente': 'Verificación pendiente',
  'Novo e-mail aguardando validação': 'Nuevo e-mail pendiente de validación',
  'Confirmação de e-mail': 'Confirmación de e-mail',
  'Salve as alterações para iniciar a validação do novo endereço. Depois, informe o código de 6 dígitos recebido por e-mail.':
    'Guarda los cambios para iniciar la validación de la nueva dirección. Luego introduce el código de 6 dígitos recibido por e-mail.',
  'O campo será habilitado quando houver uma troca de e-mail pendente.':
    'El campo se habilitará cuando haya un cambio de e-mail pendiente.',
  'Aguardando troca': 'Esperando cambio',
  'Confirmar código': 'Confirmar código',
  'Código de confirmação preparado para validação pelo backend.':
    'Código de confirmación preparado para validación en el backend.',
  'Documento': 'Documento',
  'CPF ou documento interno': 'Documento fiscal o interno',
  'Sexo': 'Sexo',
  'Não informado': 'No informado',
  'Feminino': 'Femenino',
  'Masculino': 'Masculino',
  'Outro': 'Otro',
  'Data de nascimento': 'Fecha de nacimiento',
  'Organização': 'Organización',
  'Perfil de acesso': 'Perfil de acceso',
  'Senha da conta': 'Contraseña de la cuenta',
  'Use uma senha com pelo menos 8 caracteres e combine letras, números e símbolos.':
    'Usa una contraseña de al menos 8 caracteres y combina letras, números y símbolos.',
  'Senha atual': 'Contraseña actual',
  'Digite a sua senha atual': 'Introduce tu contraseña actual',
  'Nova senha': 'Nueva contraseña',
  'Defina uma nova senha': 'Define una nueva contraseña',
  'Confirmar nova senha': 'Confirmar nueva contraseña',
  'Repita a nova senha': 'Repite la nueva contraseña',
  'Descartar alterações': 'Descartar cambios',
  'Salvar alterações': 'Guardar cambios',
  'Nenhuma alteração foi identificada para envio.': 'No se identificaron cambios para enviar.',
  'Alterações preparadas para envio:': 'Cambios preparados para envío:',
  'nome': 'nombre',
  'e-mail com nova verificação': 'e-mail con nueva verificación',
  'código de confirmação do e-mail': 'código de confirmación de e-mail',
  'dados pessoais': 'datos personales',
  'foto do perfil': 'foto de perfil',
  'senha após validação da senha atual': 'contraseña tras validar la contraseña actual',

  'Admin da organização': 'Admin de la organización',
  'Instrutor': 'Instructor',
  'Aluno': 'Alumno',
  'Super Admin': 'Super Admin',
  'Ativo': 'Activo',
  'Ativa': 'Activa',
  'Convidado': 'Invitado',
  'Desativado': 'Desactivado',
  'Desativada': 'Desactivada',
  'Arquivada': 'Archivada',
  'Concluída': 'Concluida',
  'Transferida': 'Transferida',
  'Em implantação': 'En implantación',
  'Aprovado': 'Aprobado',
  'Aprovada': 'Aprobada',
  'Pendente': 'Pendiente',
  'Reforço': 'Refuerzo',
  'Reforço recomendado': 'Refuerzo recomendado',
  'Atenção': 'Atención',
  'Crítico': 'Crítico',
  'Saudável': 'Saludable',
  'Liberado': 'Habilitado',
  'Bloqueado': 'Bloqueado',
  'Disponível em breve': 'Disponible próximamente',

  'Buscar usuário': 'Buscar usuario',
  'Buscar aluno': 'Buscar alumno',
  'Buscar organização': 'Buscar organización',
  'Buscar por módulo ou treinamento': 'Buscar por módulo o entrenamiento',
  'Todos os status': 'Todos los estados',
  'Todos os perfis': 'Todos los perfiles',
  'Todos os módulos': 'Todos los módulos',
  'Todas as turmas': 'Todos los grupos',
  'Todos os níveis': 'Todos los niveles',
  'Exibindo': 'Mostrando',
  'Mostrando': 'Mostrando',
  'de': 'de',
  'em': 'en',
  'treinamentos em': 'entrenamientos en',
  'alunos em': 'alumnos en',
  'turmas da organização.': 'grupos de la organización.',
  'turmas ativas.': 'grupos activos.',
  'módulos.': 'módulos.',
  'Ativos': 'Activos',
  'Convidados': 'Invitados',
  'Desativados': 'Desactivados',
  'Ativas': 'Activas',
  'Desativadas': 'Desactivadas',
  'ativa': 'activa',
  'ativas': 'activas',
  'ativo': 'activo',
  'ativos': 'activos',
  'desativada': 'desactivada',
  'desativadas': 'desactivadas',
  'desativado': 'desactivado',
  'desativados': 'desactivados',
  'liberação': 'habilitación',
  'liberações': 'habilitaciones',
  'execução': 'ejecución',
  'execuções': 'ejecuciones',
  'pendente': 'pendiente',
  'pendentes': 'pendientes',

  'Anterior': 'Anterior',
  'Próxima': 'Siguiente',
  'Ações': 'Acciones',
  'Detalhes': 'Detalles',
  'Ver detalhes': 'Ver detalles',
  'Editar': 'Editar',
  'Excluir': 'Eliminar',
  'Remover': 'Quitar',
  'Cancelar': 'Cancelar',
  'Salvar': 'Guardar',
  'Criar': 'Crear',
  'Confirmar': 'Confirmar',
  'Ver aluno': 'Ver alumno',
  'Ver log': 'Ver log',
  'Ver relatório': 'Ver informe',
  'Realizar treinamento': 'Realizar entrenamiento',
  'Ver resultados': 'Ver resultados',
  'Iniciar treinamento': 'Iniciar entrenamiento',
  'Voltar para alunos': 'Volver a alumnos',
  'Voltar para galeria': 'Volver a la galería',
  'Voltar para organizações': 'Volver a organizaciones',
  'Voltar para turmas': 'Volver a grupos',

  'Organizações cadastradas': 'Organizaciones registradas',
  'organização': 'organización',
  'organizações': 'organizaciones',
  'Visão objetiva dos contratos e da composição de usuários por organização.':
    'Vista objetiva de contratos y composición de usuarios por organización.',
  'Nova organização': 'Nueva organización',
  'Criar organização': 'Crear organización',
  'Excluir organização': 'Eliminar organización',
  'Nome da organização': 'Nombre de la organización',
  'Gerencie organizações clientes, admins da organização e módulos liberados para cada contrato.':
    'Gestiona organizaciones cliente, admins de la organización y módulos habilitados para cada contrato.',
  'Cadastre os dados básicos da organização cliente. Módulos e admins podem ser configurados na tela de detalhes.':
    'Registra los datos básicos de la organización cliente. Los módulos y admins se configuran en la pantalla de detalles.',
  'Atualize os dados básicos e o status do contrato da organização.':
    'Actualiza los datos básicos y el estado del contrato de la organización.',
  'Nenhuma organização encontrada com os filtros atuais.':
    'No se encontró ninguna organización con los filtros actuales.',
  'Esta ação removeria': 'Esta acción eliminaría',
  'da listagem local. No backend real, o ideal será desativar o contrato antes de excluir dados.':
    'de la lista local. En el backend real, lo ideal será desactivar el contrato antes de eliminar datos.',

  'Usuários cadastrados': 'Usuarios registrados',
  'Novo usuário': 'Nuevo usuario',
  'Editar usuário': 'Editar usuario',
  'Excluir usuário': 'Eliminar usuario',
  'Criar usuário': 'Crear usuario',
  'Nome': 'Nombre',
  'Role': 'Rol',
  'Status': 'Estado',
  'Cadastrar instrutores e alunos vinculados à sua organização.':
    'Registra instructores y alumnos vinculados a tu organización.',
  'Este e-mail já está cadastrado.': 'Este e-mail ya está registrado.',

  'Turmas cadastradas': 'Grupos registrados',
  'Nova turma': 'Nuevo grupo',
  'Criar turma': 'Crear grupo',
  'Editar turma': 'Editar grupo',
  'Excluir turma': 'Eliminar grupo',
  'Detalhes da turma': 'Detalles del grupo',
  'Adicionar aluno': 'Agregar alumno',
  'Adicionar módulo': 'Agregar módulo',
  'Remover aluno': 'Quitar alumno',
  'Remover módulo': 'Quitar módulo',
  'Selecione o aluno e confirme o vínculo com esta turma.':
    'Selecciona el alumno y confirma el vínculo con este grupo.',
  'Selecione o módulo e confirme a liberação para esta turma.':
    'Selecciona el módulo y confirma la habilitación para este grupo.',
  'Um aluno deve ter somente uma turma ativa por vez. Se ele mudar de turma, a membership anterior deve ser encerrada para preservar o histórico.':
    'Un alumno debe tener solo un grupo activo a la vez. Si cambia de grupo, la membresía anterior debe cerrarse para preservar el historial.',

  'Treinamentos': 'Entrenamientos',
  'treinamento': 'entrenamiento',
  'treinamentos': 'entrenamientos',
  'Catálogo da plataforma': 'Catálogo de la plataforma',
  'Módulo': 'Módulo',
  'Módulos': 'Módulos',
  'módulo': 'módulo',
  'módulos': 'módulos',
  'Treinamento': 'Entrenamiento',
  'tentativa': 'intento',
  'Tentativas': 'Intentos',
  'tentativas': 'intentos',
  'registro': 'registro',
  'registros': 'registros',
  'Resultados por aluno': 'Resultados por alumno',
  'Tentativas do treinamento': 'Intentos del entrenamiento',
  'Registro por execução, com acesso ao relatório textual registrado.':
    'Registro por ejecución, con acceso al informe textual registrado.',
  'Resultados do treinamento': 'Resultados del entrenamiento',
  'Resumo': 'Resumen',
  'Execuções recentes': 'Ejecuciones recientes',
  'Comparativo por módulo': 'Comparativo por módulo',

  'Média geral': 'Promedio general',
  'Média': 'Promedio',
  'Aprovação': 'Aprobación',
  'Participação': 'Participación',
  'Aprendizado': 'Aprendizaje',
  'Tempo médio': 'Tiempo promedio',
  'Melhor nota': 'Mejor puntuación',
  'Risco atual': 'Riesgo actual',
  'Acurácia': 'Precisión',
  'Erros críticos': 'Errores críticos',
  'Dicas usadas': 'Pistas usadas',
  'Nota média.': 'Puntuación promedio.',
  'Por execução.': 'Por ejecución.',
  'Aprovadas.': 'Aprobadas.',
  'Maior nota.': 'Mayor puntuación.',
  'Prioridade.': 'Prioridad.',

  'Dados do aluno': 'Datos del alumno',
  'Histórico de turmas': 'Historial de grupos',
  'Histórico e logs por tentativa': 'Historial y logs por intento',
  'Informações cadastrais e histórico de turmas vinculadas ao aluno.':
    'Información de registro e historial de grupos vinculados al alumno.',
  'Lista compacta para acompanhar vínculos atuais e anteriores.':
    'Lista compacta para seguir vínculos actuales y anteriores.',
  'Registro cronológico das execuções, com score, acurácia, tempo, desfecho e acesso ao log registrado.':
    'Registro cronológico de ejecuciones, con puntuación, precisión, tiempo, resultado y acceso al log registrado.',
  'Último acesso': 'Último acceso',
  'Última turma': 'Último grupo',
  'Turma atual': 'Grupo actual',
  'Entrada na turma atual': 'Ingreso al grupo actual',
  'Entrada na turma': 'Ingreso al grupo',
  'Entrada': 'Ingreso',
  'Saída': 'Salida',
  'Em andamento': 'En curso',
  'Sem atividade': 'Sin actividad',
  'Sem turma ativa': 'Sin grupo activo',
  'Sem código': 'Sin código',

  'Relatório da execução': 'Informe de la ejecución',
  'Indicadores': 'Indicadores',
  'Leitura pedagógica registrada': 'Lectura pedagógica registrada',
  'Painel da organização': 'Panel de la organización',
  'Painel da plataforma': 'Panel de la plataforma',
  'Visão executiva da operação de treinamentos, com carga por instrutor, pendências e sinais de risco.':
    'Vista ejecutiva de la operación de entrenamientos, con carga por instructor, pendientes y señales de riesgo.',
  'Gerenciar usuários': 'Gestionar usuarios',
  'Ver turmas': 'Ver grupos',
  'Ações rápidas': 'Acciones rápidas',
  'Cadastrar admins': 'Registrar admins',
  'Revisar catálogo': 'Revisar catálogo',
  'Criar empresa cliente': 'Crear organización cliente',
  'Gerenciar organizações': 'Gestionar organizaciones',
  'Abrir organizações': 'Abrir organizaciones',
  'Painel Immersia': 'Panel Immersia',
  'Painel de aprendizagem': 'Panel de aprendizaje',
  'Visão consolidada das suas turmas, com participação, desempenho e sinais de reforço.':
    'Vista consolidada del grupo, con participación, desempeño y señales de refuerzo.',
  'Visão administrativa da operação: organizações clientes, admins, usuários e liberação de módulos.':
    'Vista administrativa de la operación: organizaciones cliente, admins, usuarios y habilitación de módulos.',
  'Visão geral da plataforma': 'Vista general de la plataforma',
  'Painel inicial com o recorte operacional do perfil autenticado, atualizado a partir dos dados disponíveis.':
    'Panel inicial con el recorte operativo del perfil autenticado, actualizado a partir de los datos disponibles.',
  'Catálogo': 'Catálogo',
  'Cobertura': 'Cobertura',
  'Usuários da organização': 'Usuarios de la organización',
  'Módulos liberados': 'Módulos habilitados',
  'Perfis operacionais': 'Perfiles operativos',
  'Organizações clientes': 'Organizaciones cliente',
  'Recorte de status, admins e módulos liberados por organização.':
    'Recorte de estado, admins y módulos habilitados por organización.',
  'Liberação por módulo': 'Habilitación por módulo',
  'Visão rápida de quantas organizações possuem acesso a cada módulo do catálogo.':
    'Vista rápida de cuántas organizaciones tienen acceso a cada módulo del catálogo.',
  'liberações ativas': 'habilitaciones activas',
  'Admins de organização.': 'Admins de organización.',
  'Acompanhamento operacional.': 'Seguimiento operativo.',
  'Treinamentos VR.': 'Entrenamientos VR.',
  'Organizações clientes cadastradas na plataforma.':
    'Organizaciones cliente registradas en la plataforma.',
  'Organizações em implantação ou com acesso pausado.':
    'Organizaciones en implantación o con acceso pausado.',
  'Usuários responsáveis por gerir organizações clientes.':
    'Usuarios responsables de gestionar organizaciones cliente.',
  'Perfis cadastrados entre Immersia, organizações, instrutores e alunos.':
    'Perfiles registrados entre Immersia, organizaciones, instructores y alumnos.',
  'Instrutores cadastrados nas organizações clientes.':
    'Instructores registrados en las organizaciones cliente.',
  'Módulos do catálogo e quantidade de liberações para organizações.':
    'Módulos del catálogo y cantidad de habilitaciones para organizaciones.',
  'Percentual de organizações com pelo menos um módulo liberado.':
    'Porcentaje de organizaciones con al menos un módulo habilitado.',
  'Total de treinamentos disponíveis no catálogo de estudos.':
    'Total de entrenamientos disponibles en el catálogo de estudios.',

  'Turmas ativas': 'Grupos activos',
  'Grupos disponíveis para acompanhamento.': 'Grupos disponibles para seguimiento.',
  'Turmas ativas que podem receber alunos, módulos e acompanhamento de resultados.':
    'Grupos activos que pueden recibir alumnos, módulos y seguimiento de resultados.',
  'Alunos cadastrados na organização.': 'Alumnos registrados en la organización.',
  'Total de alunos disponíveis para vínculo em turmas da organização.':
    'Total de alumnos disponibles para vincular a grupos de la organización.',
  'Módulos disponíveis para vincular às turmas.': 'Módulos disponibles para vincular a los grupos.',
  'Módulos liberados para a organização e disponíveis para as turmas.':
    'Módulos habilitados para la organización y disponibles para los grupos.',
  'Buscar turma': 'Buscar grupo',
  'Filtrar turmas por status': 'Filtrar grupos por estado',
  'Criar nova turma': 'Crear nuevo grupo',
  'Preencha os dados básicos da turma. No backend, essa ação deve criar o grupo dentro da organização atual.':
    'Completa los datos básicos del grupo. En el backend, esta acción debe crear el grupo dentro de la organización actual.',
  'Resumo do objetivo da turma': 'Resumen del objetivo del grupo',
  'Turma não encontrada': 'Grupo no encontrado',
  'A turma solicitada não está disponível para a organização atual.':
    'El grupo solicitado no está disponible para la organización actual.',
  'Selecionar aluno': 'Seleccionar alumno',
  'Sem alunos disponíveis': 'Sin alumnos disponibles',
  'Selecionar módulo': 'Seleccionar módulo',
  'Sem módulos disponíveis': 'Sin módulos disponibles',
  'Selecionar aluno para adicionar': 'Seleccionar alumno para agregar',
  'Selecionar módulo para liberar': 'Seleccionar módulo para habilitar',
  'Remover aluno da turma': 'Quitar alumno del grupo',
  'Liberar módulo': 'Habilitar módulo',
  'Remover módulo da turma': 'Quitar módulo del grupo',
  'Confirme a remoção do vínculo ativo. O histórico de tentativas deve continuar preservado para consultas futuras.':
    'Confirma la eliminación del vínculo activo. El historial de intentos debe seguir preservado para futuras consultas.',
  'Selecione um módulo contratado pela organização e confirme a liberação para esta turma.':
    'Selecciona un módulo contratado por la organización y confirma la habilitación para este grupo.',
  'Confirme a remoção da liberação. Os resultados já registrados continuam disponíveis no histórico.':
    'Confirma la eliminación de la habilitación. Los resultados ya registrados continúan disponibles en el historial.',

  'Alunos cadastrados': 'Alumnos registrados',
  'Filtrar por turma': 'Filtrar por grupo',
  'Filtrar por status': 'Filtrar por estado',
  'Aluno não encontrado': 'Alumno no encontrado',
  'O registro solicitado não está disponível para a organização ou ainda não possui dados suficientes.':
    'El registro solicitado no está disponible para la organización o aún no tiene datos suficientes.',
  'Dados do Aluno': 'Datos del alumno',
  'Com execução': 'Con ejecución',
  'com execução': 'con ejecución',
  'Alunos com execução.': 'Alumnos con ejecuciones.',
  'Quantidade de alunos atualmente vinculados à turma.':
    'Cantidad de alumnos actualmente vinculados al grupo.',
  'Percentual de alunos da turma com pelo menos uma tentativa registrada.':
    'Porcentaje de alumnos del grupo con al menos un intento registrado.',
  'Média das notas registradas nas execuções desta turma.':
    'Promedio de las puntuaciones registradas en las ejecuciones de este grupo.',
  'Variação média entre primeira e última tentativa dos alunos com histórico suficiente.':
    'Variación promedio entre el primer y último intento de los alumnos con historial suficiente.',
  'Execuções aprovadas.': 'Ejecuciones aprobadas.',
  'Percentual de execuções da turma com resultado aprovado.':
    'Porcentaje de ejecuciones del grupo con resultado aprobado.',
  'Nas execuções.': 'En las ejecuciones.',
  'Total de erros críticos registrados nas tentativas da turma.':
    'Total de errores críticos registrados en los intentos del grupo.',
  'Apoios solicitados.': 'Apoyos solicitados.',
  'Quantidade de dicas usadas nas execuções da turma.':
    'Cantidad de ayudas usadas en las ejecuciones del grupo.',
  'Liberados.': 'Habilitados.',
  'Quantidade de módulos liberados para a turma.': 'Cantidad de módulos habilitados para el grupo.',

  'Organização não encontrada': 'Organización no encontrada',
  'A organização solicitada não está disponível na base atual.':
    'La organización solicitada no está disponible en la base actual.',
  'Editar organização': 'Editar organización',
  'Gestores da organização.': 'Gestores de la organización.',
  'Admins vinculados à organização cliente.': 'Admins vinculados a la organización cliente.',
  'Acompanhamento.': 'Seguimiento.',
  'Instrutores que podem acompanhar turmas, alunos e resultados.':
    'Instructores que pueden seguir grupos, alumnos y resultados.',
  'Alunos vinculados à organização.': 'Alumnos vinculados a la organización.',
  'Módulos liberados para a organização.': 'Módulos habilitados para la organización.',
  'Filtrar usuários por perfil': 'Filtrar usuarios por perfil',
  'Filtrar usuários por status': 'Filtrar usuarios por estado',
  'Selecionar status da organização': 'Seleccionar estado de la organización',
  'Salvar módulos': 'Guardar módulos',
  'Selecione quais módulos ficam disponíveis para a organização.':
    'Selecciona qué módulos quedan disponibles para la organización.',
  'Novo admin da organização': 'Nuevo admin de la organización',
  'Cadastre um admin vinculado a esta organização.':
    'Registra un admin vinculado a esta organización.',
  'Selecionar status do admin': 'Seleccionar estado del admin',
  'Desativar admin da organização': 'Desactivar admin de la organización',
  'O acesso deste admin será bloqueado, mas o registro continuará disponível para auditoria e histórico.':
    'El acceso de este admin será bloqueado, pero el registro seguirá disponible para auditoría e historial.',

  'Usuários da sua organização, com gestão de instrutores e alunos.':
    'Usuarios de tu organización, con gestión de instructores y alumnos.',
  'Usuários cadastrados em todas as organizações da plataforma.':
    'Usuarios registrados en todas las organizaciones de la plataforma.',
  'Selecionar perfil de acesso': 'Seleccionar perfil de acceso',
  'Selecionar status do usuário': 'Seleccionar estado del usuario',
  'Selecionar organização': 'Seleccionar organización',
  'Remover usuário': 'Quitar usuario',
  'Confirme a remoção deste usuário da plataforma. No backend, essa ação deve validar vínculos e preservar histórico de aprendizagem.':
    'Confirma la eliminación de este usuario de la plataforma. En el backend, esta acción debe validar vínculos y preservar el historial de aprendizaje.',
  'Cadastre instrutores e alunos vinculados à sua organização.':
    'Registra instructores y alumnos vinculados a tu organización.',

  'Resultados não encontrados': 'Resultados no encontrados',
  'O treinamento solicitado não está disponível para a organização atual ou ainda não possui dados.':
    'El entrenamiento solicitado no está disponible para la organización actual o aún no tiene datos.',
  'Acompanhe desempenho, participação e tentativas dos alunos neste treinamento.':
    'Acompaña desempeño, participación e intentos de los alumnos en este entrenamiento.',
  'Com acesso.': 'Con acceso.',
  'Quantidade de turmas ativas consideradas na análise deste treinamento.':
    'Cantidad de grupos activos considerados en el análisis de este entrenamiento.',
  'Percentual de alunos da organização que possuem pelo menos uma tentativa neste treinamento.':
    'Porcentaje de alumnos de la organización que tienen al menos un intento en este entrenamiento.',
  'Média das notas registradas em todas as tentativas deste treinamento.':
    'Promedio de las puntuaciones registradas en todos los intentos de este entrenamiento.',
  'Tentativas aprovadas.': 'Intentos aprobados.',
  'Percentual médio de acertos nas tentativas registradas para este treinamento.':
    'Porcentaje promedio de aciertos en los intentos registrados para este entrenamiento.',
  'Alunos em atenção.': 'Alumnos en atención.',
  'Alunos cuja tentativa mais recente indica necessidade de reforço.':
    'Alumnos cuyo intento más reciente indica necesidad de refuerzo.',

  'Seleção do extintor correto': 'Selección del extintor correcto',
  'Inspeção inicial da área': 'Inspección inicial del área',
  'Resposta ao princípio de incêndio': 'Respuesta al inicio de incendio',
  'Abandono de área em emergência': 'Abandono de área en emergencia',
  'Introdução à NR-10': 'Introducción a la NR-10',
  'Bloqueio e etiquetagem': 'Bloqueo y etiquetado',
  'Reconhecimento de riscos elétricos': 'Reconocimiento de riesgos eléctricos',
  'Trabalho em altura': 'Trabajo en altura',
  'Sistema de ancoragem': 'Sistema de anclaje',
  'Resgate e evacuação': 'Rescate y evacuación',
  'Treinamentos para prevenção e combate a incêndio, resposta inicial e uso correto de equipamentos.':
    'Entrenamientos para prevención y combate de incendios, respuesta inicial y uso correcto de equipos.',
  'Treinamentos voltados à segurança em instalações e serviços com eletricidade.':
    'Entrenamientos enfocados en seguridad en instalaciones y servicios con electricidad.',
  'Treinamentos para trabalho em altura, avaliação de risco e preparação da atividade.':
    'Entrenamientos para trabajo en altura, evaluación de riesgo y preparación de la actividad.',
  'Identifique a classe do fogo e selecione o extintor mais adequado para cada ocorrência.':
    'Identifica la clase de fuego y selecciona el extintor más adecuado para cada incidente.',
  'Reconheça riscos, rotas de fuga e condições do ambiente antes do início da resposta.':
    'Reconoce riesgos, rutas de escape y condiciones del ambiente antes de iniciar la respuesta.',
  'Treine a sequência operacional esperada para os primeiros minutos da ocorrência.':
    'Practica la secuencia operativa esperada para los primeros minutos del incidente.',
  'Revise a lógica de evacuação e conduza a saída com segurança até o ponto de encontro.':
    'Revisa la lógica de evacuación y conduce la salida con seguridad hasta el punto de encuentro.',

  'Análise de aprendizagem': 'Análisis de aprendizaje',
  'Evolução das pendências': 'Evolución de pendientes',
  'Sem execuções suficientes para calcular a evolução das pendências.': 'Sin ejecuciones suficientes para calcular la evolución de pendientes.',
  'Nota consolidada.': 'Puntuación consolidada.',
  'Concentração das tentativas por faixa de nota.': 'Concentración de intentos por rango de puntuación.',
  'Faixas de nota': 'Rangos de puntuación',
  'Em breve': 'Próximamente',
  'Disponível': 'Disponible',
  'Sem turmas': 'Sin grupos',
  'Turma arquivada': 'Grupo archivado',
  'Sem média': 'Sin promedio',
  'Sem tentativas': 'Sin intentos',
  'Em breve: treinamento em desenvolvimento.': 'Próximamente: entrenamiento en desarrollo.',
  'Treinamento em desenvolvimento, disponível em breve.': 'Entrenamiento en desarrollo, disponible próximamente.',
  'Abrir no Meta Quest': 'Abrir en Meta Quest',
  'Meta Quest (app Immersia)': 'Meta Quest (app Immersia)',
  'Navegador (web)': 'Navegador (web)',
  'Link de abertura': 'Enlace de apertura',
  'Identificador (gerado do título)': 'Identificador (generado del título)',
  'Execução': 'Ejecución',
  'Treinamentos VR': 'Entrenamientos VR',
  'Alunos das suas turmas ativas.': 'Alumnos de tus grupos activos.',
  'Turmas ativas em que você é o instrutor responsável.': 'Grupos activos en los que eres el instructor responsable.',
  'Alunos com vínculo ativo nas suas turmas.': 'Alumnos con vínculo activo en tus grupos.',
  'Incêndio classe A: escolha e uso do extintor': 'Incendio clase A: elección y uso del extintor',
  'Prevenção e combate a incêndio: resposta inicial a incêndio classe A e uso correto do extintor (NR-23 / NBR 12693).': 'Prevención y combate de incendios: respuesta inicial a incendios clase A y uso correcto del extintor (NR-23 / NBR 12693).',
  'Segurança em instalações e serviços com eletricidade. Treinamento em desenvolvimento.': 'Seguridad en instalaciones y servicios con electricidad. Entrenamiento en desarrollo.',
  'Segurança e saúde nos trabalhos em espaços confinados. Treinamento em desenvolvimento.': 'Seguridad y salud en trabajos en espacios confinados. Entrenamiento en desarrollo.',
  'Entrada segura em espaço confinado': 'Entrada segura en espacio confinado',
  'Resposta inicial a princípio de incêndio': 'Respuesta inicial a un principio de incendio',
  'Abandono de área e rotas de fuga': 'Abandono de área y rutas de escape',
  'Fundamentos de segurança elétrica': 'Fundamentos de seguridad eléctrica',
  'Leitura de risco elétrico em campo': 'Lectura de riesgo eléctrico en campo',
  'Entrada e permanência em espaço confinado': 'Entrada y permanencia en espacio confinado',
};

const dictionaries: Record<Exclude<Locale, 'pt-BR'>, Record<string, string>> = {
  'en-US': enUS,
  'es-ES': es,
};

function normalizeCopy(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function translateKnownUnit(unit: string, locale: Exclude<Locale, 'pt-BR'>) {
  const normalized = normalizeCopy(unit);
  return dictionaries[locale][normalized] ?? normalized;
}

function translateDynamicCopy(source: string, locale: Exclude<Locale, 'pt-BR'>) {
  const trainingsByModuleMatch = source.match(
    /^Exibindo\s+(.+)\s+de\s+(.+)\s+treinamentos\s+em\s+(.+)\s+módulos\.$/
  );
  if (trainingsByModuleMatch) {
    const [, filtered, total, modules] = trainingsByModuleMatch;
    return locale === 'en-US'
      ? `Showing ${filtered} of ${total} trainings across ${modules} modules.`
      : `Mostrando ${filtered} de ${total} entrenamientos en ${modules} módulos.`;
  }

  const organizationGroupsMatch = source.match(
    /^Exibindo\s+(.+)\s+de\s+(.+)\s+turmas\s+da\s+organização\.$/
  );
  if (organizationGroupsMatch) {
    const [, filtered, total] = organizationGroupsMatch;
    return locale === 'en-US'
      ? `Showing ${filtered} of ${total} groups in the organization.`
      : `Mostrando ${filtered} de ${total} grupos de la organización.`;
  }

  const studentsByGroupsMatch = source.match(
    /^Exibindo\s+(.+)\s+de\s+(.+)\s+alunos?\s+em\s+(.+)\s+turmas?\s+ativas?\.$/
  );
  if (studentsByGroupsMatch) {
    const [, filtered, total, groups] = studentsByGroupsMatch;
    return locale === 'en-US'
      ? `Showing ${filtered} of ${total} students in ${groups} active groups.`
      : `Mostrando ${filtered} de ${total} alumnos en ${groups} grupos activos.`;
  }

  const previousModulePageMatch = source.match(/^Página anterior de (.+)$/);
  if (previousModulePageMatch) {
    return locale === 'en-US'
      ? `Previous page for ${previousModulePageMatch[1]}`
      : `Página anterior de ${previousModulePageMatch[1]}`;
  }

  const nextModulePageMatch = source.match(/^Próxima página de (.+)$/);
  if (nextModulePageMatch) {
    return locale === 'en-US'
      ? `Next page for ${nextModulePageMatch[1]}`
      : `Página siguiente de ${nextModulePageMatch[1]}`;
  }

  const showingMatch = source.match(/^Mostrando\s+(.+)\s+de\s+(.+)\s+(.+)$/);
  if (showingMatch) {
    const [, range, total, unit] = showingMatch;
    const translatedUnit = translateKnownUnit(unit, locale);
    return locale === 'en-US'
      ? `Showing ${range} of ${total} ${translatedUnit}`
      : `Mostrando ${range} de ${total} ${translatedUnit}`;
  }

  const pageMatch = source.match(/^Página\s+(\d+)\s+de\s+(\d+)$/);
  if (pageMatch) {
    return locale === 'en-US'
      ? `Page ${pageMatch[1]} of ${pageMatch[2]}`
      : `Página ${pageMatch[1]} de ${pageMatch[2]}`;
  }

  const displayingMatch = source.match(/^Exibindo\s+(.+)$/);
  if (displayingMatch) {
    return locale === 'en-US' ? `Showing ${displayingMatch[1]}` : `Mostrando ${displayingMatch[1]}`;
  }

  const activeMatch = source.match(/^(\d+)\s+ativos?$/);
  if (activeMatch) {
    return locale === 'en-US'
      ? `${activeMatch[1]} active`
      : `${activeMatch[1]} activo${activeMatch[1] === '1' ? '' : 's'}`;
  }

  const countWithKnownUnitMatch = source.match(/^(\d+)\s+(.+)$/);
  if (countWithKnownUnitMatch) {
    const [, count, unit] = countWithKnownUnitMatch;
    const translatedUnit = translateKnownUnit(unit, locale);

    if (translatedUnit !== normalizeCopy(unit)) {
      return `${count} ${translatedUnit}`;
    }
  }

  const ratioWithKnownUnitMatch = source.match(/^(\d+\/\d+)\s+(.+)$/);
  if (ratioWithKnownUnitMatch) {
    const [, ratio, unit] = ratioWithKnownUnitMatch;
    const translatedUnit = translateKnownUnit(unit, locale);

    if (translatedUnit !== normalizeCopy(unit)) {
      return `${ratio} ${translatedUnit}`;
    }
  }

  const modulesMatch = source.match(/^(\d+)\s+módulos?$/);
  if (modulesMatch) {
    return locale === 'en-US'
      ? `${modulesMatch[1]} module${modulesMatch[1] === '1' ? '' : 's'}`
      : `${modulesMatch[1]} módulo${modulesMatch[1] === '1' ? '' : 's'}`;
  }

  return null;
}

export function translateCopy(source: string, locale: Locale) {
  if (locale === 'pt-BR') return source;

  const leadingWhitespace = source.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = source.match(/\s*$/)?.[0] ?? '';
  const normalized = normalizeCopy(source);
  const translated = dictionaries[locale][normalized] ?? translateDynamicCopy(normalized, locale);

  return translated ? `${leadingWhitespace}${translated}${trailingWhitespace}` : source;
}
