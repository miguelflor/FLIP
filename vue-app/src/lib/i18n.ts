import { computed, ref, watchEffect } from 'vue';
import { storage } from './storage';

/*
 * The app's text in European Portuguese and English. Every text the user reads comes from
 * here, through t(). The English dictionary is typed against the Portuguese one, so a text
 * missing a translation fails to compile.
 *
 * Backend errors arrive as codes ("session_expired", or "clip_http_error|503" with a value)
 * and are translated by translateError, under the "error." keys.
 */

const pt = {
  // Login
  'login.tagline': 'Acesso ao CLIP da NOVA FCT',
  'login.hint': 'Inicie sessão com as suas credenciais do CLIP',
  'login.loggingIn': 'A entrar...',
  'login.autoFailed': 'Não foi possível entrar automaticamente: {error}',
  'login.username': 'Identificador de estudante',
  'login.usernamePlaceholder': 'ex.: j.pd',
  'login.password': 'Palavra-passe',
  'login.showPassword': 'Mostrar palavra-passe',
  'login.hidePassword': 'Ocultar palavra-passe',
  'login.remember': 'Lembrar-me neste computador',
  'login.submit': 'Entrar',

  // Shared
  'common.retry': 'Tentar novamente',
  'common.refresh': 'Atualizar',
  'common.loading': 'A carregar...',

  // Navbar and profile
  'nav.selectStudent': 'Selecionar aluno',
  'nav.settings': 'Definições',
  'nav.logout': 'Terminar sessão',
  'profile.student': 'Estudante',
  'profile.course': 'Curso',

  // Dashboard
  'dashboard.selectYear': 'Selecionar ano',
  'dashboard.selectPeriod': 'Selecionar período',
  'period.s1': '1º Semestre',
  'period.s2': '2º Semestre',
  'period.t1': '1º Trimestre',
  'period.t2': '2º Trimestre',
  'query.noSession': 'Sessão não encontrada',

  // Schedule
  'schedule.title': 'Horário semanal',
  'schedule.loading': 'A carregar horário...',
  'schedule.calendar': 'Calendário',
  'schedule.exportIcs': 'Exportar horário para o calendário (.ics)',
  'schedule.exportPng': 'Exportar como PNG',
  'schedule.exportGoogle': 'Exportar para Google Calendar',
  'schedule.exportFailed': 'Erro ao exportar horário: {error}',
  'schedule.icsFailed': 'Erro ao exportar calendário: {error}',
  'schedule.emptyImage': 'imagem vazia',
  'class.t': 'Teórica',
  'class.p': 'Prática',
  'class.tp': 'Teórico-Prática',
  'weekday.Monday': 'Segunda',
  'weekday.Tuesday': 'Terça',
  'weekday.Wednesday': 'Quarta',
  'weekday.Thursday': 'Quinta',
  'weekday.Friday': 'Sexta',
  'weekday.Saturday': 'Sábado',
  'weekday.Sunday': 'Domingo',

  // Tests
  'tests.title': 'Testes de avaliação',
  'tests.loading': 'A carregar testes...',
  'tests.empty': 'Sem testes neste período',
  'tests.notEnrolled': 'Por inscrever',

  // Course files
  'files.title': 'Ficheiros das cadeiras',
  'files.search': 'Procurar ficheiros...',
  'files.searchLabel': 'Procurar ficheiros',
  'files.noUnits': 'Não há cadeiras neste ano letivo.',
  'files.selectStudent': 'Por favor, selecione um aluno.',
  'files.unitsFailed': 'Não foi possível obter as cadeiras',
  'files.downloadAll': 'Descarregar tudo (zip)',
  'files.download': 'Descarregar {name}',
  'files.noneFound': 'Nenhum ficheiro encontrado.',
  'files.unitEmpty': 'Esta cadeira não tem ficheiros.',
  'files.noSession': 'Sessão não encontrada. Inicie sessão novamente.',
  'files.someFailed': '{failed} de {total} ficheiros não foram descarregados',
  'files.downloadFailed': 'Erro ao descarregar {name}: {error}',
  'files.date': 'Data: {value}',
  'files.size': 'Tamanho: {value}',
  'files.uploader': 'Por: {value}',
  'section.Multimedia': 'Material Multimédia',
  'section.Problemas': 'Problemas',
  'section.Protocolos': 'Protocolos',
  'section.Seminarios': 'Seminários',
  'section.Exames': 'Exames',
  'section.Testes': 'Testes',
  'section.Textos_de_Apoio': 'Textos de Apoio',
  'section.Outros': 'Outros',
  'downloads.saved': '«{name}» guardado na pasta de transferências',

  // Toasts and dialogs
  'toast.close': 'Fechar notificação',
  'settings.close': 'Fechar definições',

  // Settings
  'settings.title': 'Definições',
  'settings.appearance': 'Aparência',
  'settings.theme': 'Tema',
  'settings.themeLight': 'Claro',
  'settings.themeDark': 'Escuro',
  'settings.system': 'Sistema',
  'settings.language': 'Idioma',
  'settings.preloadTitle': 'Ficheiros das cadeiras',
  'settings.preloadHelp':
    'As listas de ficheiros carregadas em segundo plano aparecem logo, e a pesquisa encontra-as. Carregar mais faz mais pedidos ao CLIP.',
  'settings.preload': 'Carregar antecipadamente',
  'settings.preloadPeriod': 'Período selecionado',
  'settings.preloadAll': 'Todos os períodos',
  'settings.preloadNone': 'Nenhum',
  'settings.downloads': 'Transferências',
  'settings.downloadsHelp': 'Ficheiros, horários e calendários são guardados em:',
  'settings.downloadsUnset': 'Ainda não escolhida: será pedida na primeira transferência.',
  'settings.changeFolder': 'Alterar pasta',
  'settings.chooseFolder': 'Escolher pasta',
  'settings.folderChanged': 'Pasta de transferências alterada',
  'settings.savedLogin': 'Sessão guardada',
  'settings.savedLoginIs': 'O início de sessão de {name} está guardado neste computador, no cofre do sistema, para entrar automaticamente.',
  'settings.savedLoginNone':
    'Nenhum início de sessão guardado. Para entrar automaticamente, marque «Lembrar-me neste computador» ao iniciar sessão.',
  'settings.forget': 'Esquecer',
  'settings.forgotten': 'Início de sessão esquecido',
  'settings.forgetFailed': 'Erro ao esquecer o início de sessão',
  'settings.cache': 'Cache',
  'settings.cacheHelp':
    'As páginas do CLIP ficam guardadas neste computador, cifradas, para o FLIP abrir depressa. Limpar a cache obriga a pedi-las de novo ao CLIP.',
  'settings.clearCache': 'Limpar cache',
  'settings.cacheCleared': 'Cache limpa com sucesso',
  'settings.cacheFailed': 'Erro ao limpar cache',

  // Backend errors, by code
  'error.session_expired': 'Sessão expirada, inicie sessão novamente',
  'error.clip_timeout': 'O CLIP demorou demasiado a responder. Tente novamente.',
  'error.clip_unreachable': 'Não foi possível contactar o CLIP. Verifique a ligação à internet.',
  'error.clip_http_error': 'O CLIP respondeu com um erro ({value})',
  'error.invalid_credentials': 'Identificador ou palavra-passe incorretos',
  'error.login_failed': 'O CLIP não aceitou o início de sessão. Tente novamente.',
  'error.no_student_data': 'Esta conta não tem dados de aluno no CLIP',
  'error.unknown_student': 'Este aluno não pertence à sessão iniciada',
  'error.invalid_period': 'Ano ou período inválido',
  'error.cache_error': 'Erro ao aceder à cache local',
  'error.student_info_unreadable': 'Não foi possível ler os dados do aluno',
  'error.schedule_unreadable': 'Não foi possível ler o horário',
  'error.invalid_file_link': 'Ligação de ficheiro inválida',
  'error.no_files': '{value} não tem ficheiros',
  'error.zip_empty': 'Nenhum ficheiro pôde ser descarregado',
  'error.save_failed': 'Não foi possível guardar o ficheiro',
  'error.settings_save_failed': 'Não foi possível guardar as definições',
  'error.download_cancelled': 'Transferência cancelada',
} as const;

export type MessageKey = keyof typeof pt;

const en: Record<MessageKey, string> = {
  'login.tagline': "Access to NOVA FCT's CLIP",
  'login.hint': 'Sign in with your CLIP credentials',
  'login.loggingIn': 'Signing in...',
  'login.autoFailed': "Couldn't sign in automatically: {error}",
  'login.username': 'Student identifier',
  'login.usernamePlaceholder': 'e.g. j.pd',
  'login.password': 'Password',
  'login.showPassword': 'Show password',
  'login.hidePassword': 'Hide password',
  'login.remember': 'Remember me on this computer',
  'login.submit': 'Sign in',

  'common.retry': 'Try again',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading...',

  'nav.selectStudent': 'Select student',
  'nav.settings': 'Settings',
  'nav.logout': 'Sign out',
  'profile.student': 'Student',
  'profile.course': 'Course',

  'dashboard.selectYear': 'Select year',
  'dashboard.selectPeriod': 'Select period',
  'period.s1': '1st Semester',
  'period.s2': '2nd Semester',
  'period.t1': '1st Trimester',
  'period.t2': '2nd Trimester',
  'query.noSession': 'Session not found',

  'schedule.title': 'Weekly schedule',
  'schedule.loading': 'Loading schedule...',
  'schedule.calendar': 'Calendar',
  'schedule.exportIcs': 'Export schedule to your calendar (.ics)',
  'schedule.exportPng': 'Export as PNG',
  'schedule.exportGoogle': 'Export to Google Calendar',
  'schedule.exportFailed': "Couldn't export the schedule: {error}",
  'schedule.icsFailed': "Couldn't export the calendar: {error}",
  'schedule.emptyImage': 'empty image',
  'class.t': 'Lecture',
  'class.p': 'Practical',
  'class.tp': 'Lecture-Practical',
  'weekday.Monday': 'Monday',
  'weekday.Tuesday': 'Tuesday',
  'weekday.Wednesday': 'Wednesday',
  'weekday.Thursday': 'Thursday',
  'weekday.Friday': 'Friday',
  'weekday.Saturday': 'Saturday',
  'weekday.Sunday': 'Sunday',

  'tests.title': 'Assessment tests',
  'tests.loading': 'Loading tests...',
  'tests.empty': 'No tests this period',
  'tests.notEnrolled': 'Not enrolled',

  'files.title': 'Course files',
  'files.search': 'Search files...',
  'files.searchLabel': 'Search files',
  'files.noUnits': 'No courses in this academic year.',
  'files.selectStudent': 'Please select a student.',
  'files.unitsFailed': "Couldn't load the courses",
  'files.downloadAll': 'Download all (zip)',
  'files.download': 'Download {name}',
  'files.noneFound': 'No files found.',
  'files.unitEmpty': 'This course has no files.',
  'files.noSession': 'Session not found. Please sign in again.',
  'files.someFailed': "{failed} of {total} files couldn't be downloaded",
  'files.downloadFailed': "Couldn't download {name}: {error}",
  'files.date': 'Date: {value}',
  'files.size': 'Size: {value}',
  'files.uploader': 'By: {value}',
  'section.Multimedia': 'Multimedia',
  'section.Problemas': 'Problem sets',
  'section.Protocolos': 'Lab protocols',
  'section.Seminarios': 'Seminars',
  'section.Exames': 'Exams',
  'section.Testes': 'Tests',
  'section.Textos_de_Apoio': 'Reading material',
  'section.Outros': 'Other',
  'downloads.saved': '"{name}" saved to your downloads folder',

  'toast.close': 'Close notification',
  'settings.close': 'Close settings',

  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.system': 'System',
  'settings.language': 'Language',
  'settings.preloadTitle': 'Course files',
  'settings.preloadHelp':
    'File lists loaded in the background show at once, and search finds them. Loading more sends more requests to CLIP.',
  'settings.preload': 'Load ahead of time',
  'settings.preloadPeriod': 'Selected period',
  'settings.preloadAll': 'All periods',
  'settings.preloadNone': 'None',
  'settings.downloads': 'Downloads',
  'settings.downloadsHelp': 'Files, schedules and calendars are saved to:',
  'settings.downloadsUnset': "Not chosen yet: you'll be asked on the first download.",
  'settings.changeFolder': 'Change folder',
  'settings.chooseFolder': 'Choose folder',
  'settings.folderChanged': 'Download folder changed',
  'settings.savedLogin': 'Saved login',
  'settings.savedLoginIs': "{name}'s login is saved on this computer, in the system keychain, to sign in automatically.",
  'settings.savedLoginNone':
    'No saved login. To sign in automatically, tick "Remember me on this computer" when signing in.',
  'settings.forget': 'Forget',
  'settings.forgotten': 'Saved login forgotten',
  'settings.forgetFailed': "Couldn't forget the saved login",
  'settings.cache': 'Cache',
  'settings.cacheHelp':
    "CLIP's pages are kept on this computer, encrypted, so FLIP opens quickly. Clearing the cache means fetching them from CLIP again.",
  'settings.clearCache': 'Clear cache',
  'settings.cacheCleared': 'Cache cleared',
  'settings.cacheFailed': "Couldn't clear the cache",

  'error.session_expired': 'Session expired, please sign in again',
  'error.clip_timeout': 'CLIP took too long to answer. Please try again.',
  'error.clip_unreachable': "Couldn't reach CLIP. Check your internet connection.",
  'error.clip_http_error': 'CLIP answered with an error ({value})',
  'error.invalid_credentials': 'Wrong identifier or password',
  'error.login_failed': "CLIP didn't accept the login. Please try again.",
  'error.no_student_data': 'This account has no student data on CLIP',
  'error.unknown_student': "This student doesn't belong to the signed-in account",
  'error.invalid_period': 'Invalid year or period',
  'error.cache_error': "Couldn't access the local cache",
  'error.student_info_unreadable': "Couldn't read the student's details",
  'error.schedule_unreadable': "Couldn't read the schedule",
  'error.invalid_file_link': 'Invalid file link',
  'error.no_files': '{value} has no files',
  'error.zip_empty': "None of the files could be downloaded",
  'error.save_failed': "Couldn't save the file",
  'error.settings_save_failed': "Couldn't save the settings",
  'error.download_cancelled': 'Download cancelled',
};

const DICTIONARIES = { 'pt-PT': pt as Record<MessageKey, string>, en };

export type Locale = keyof typeof DICTIONARIES;
export type LanguageChoice = 'pt' | 'en' | 'system';

// 'system' (the default) picks Portuguese for a Portuguese system, else English.
const choice = ref<LanguageChoice>(
  (['pt', 'en'] as const).find((c) => c === storage.get('language')) ?? 'system',
);

export const locale = computed<Locale>(() => {
  if (choice.value === 'pt') return 'pt-PT';
  if (choice.value === 'en') return 'en';
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-PT' : 'en';
});

watchEffect(() => (document.documentElement.lang = locale.value));

/** The text for `key` in the current language, with {placeholders} filled in. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return DICTIONARIES[locale.value][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * A backend error in the current language. The backend sends codes, optionally with a
 * value ("clip_http_error|503"); anything else (e.g. an unexpected system error) is shown
 * as it came.
 */
export function translateError(err: unknown): string {
  const raw = String(err);
  const [code, value = ''] = raw.split(/\|(.*)/s);
  const key = `error.${code}` as MessageKey;
  return key in pt ? t(key, { value }) : raw;
}

export function useLanguage() {
  const setLanguage = (value: LanguageChoice) => {
    choice.value = value;
    storage.set('language', value === 'system' ? null : value);
  };
  return { language: choice, locale, setLanguage };
}
