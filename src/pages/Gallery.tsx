import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Glasses,
  Smartphone,
} from 'lucide-react';

import fire_extinguisher from '../assets/fire_extinguisher.jpg';
import nr10_intro from '../assets/nr10_intro.jpg';
import nr10_risks from '../assets/nr10_risks.jpg';
import nr10_best from '../assets/nr10_best.jpg';

import { useNavigate } from 'react-router-dom';

type Training = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  completed: boolean;
  imageUrl?: string;
  modality: 'VR' | 'AR';
  url: string; // link externo (placeholder)
  enabled?: boolean; // controla se pode abrir
};

type Module = {
  id: string;
  name: string; // ex.: "NR-10"
  trainings: Training[];
};

const modulesMock: Module[] = [
  {
    id: 'fire',
    name: 'Combate a Incêndio',
    trainings: [
      {
        id: 'fire-1',
        title: 'Seleção do extintor correto',
        description: 'Escolha o extintor ideal para cada classe de fogo.',
        minutes: 30,
        completed: true,
        modality: 'VR',
        url: 'https://immersia-plataform-firefighting-01.netlify.app/', // TODO: trocar pelo link real
        enabled: true, // ✅ único acessível
        imageUrl: fire_extinguisher,
      },
    ],
  },
  {
    id: 'nr10',
    name: 'NR-10',
    trainings: [
      {
        id: 'nr10-1',
        title: 'Introdução à NR-10',
        description: 'Conceitos e responsabilidades.',
        minutes: 25,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr10-1',
        enabled: false,
        imageUrl: nr10_intro,
      },
      {
        id: 'nr10-2',
        title: 'Riscos elétricos',
        description: 'Identificação e prevenção.',
        minutes: 40,
        completed: false,
        modality: 'AR',
        url: 'https://example.com/nr10-2',
        enabled: false,
        imageUrl: nr10_risks,
      },
      {
        id: 'nr10-3',
        title: 'Procedimentos básicos',
        description: 'Rotinas e boas práticas.',
        minutes: 35,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr10-3',
        enabled: false,
        imageUrl: nr10_best,
      },
    ],
  },
];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function ModalityIcon({ modality }: { modality: 'VR' | 'AR' }) {
  return modality === 'VR' ? (
    <Glasses className="h-4 w-4 text-white/60" />
  ) : (
    <Smartphone className="h-4 w-4 text-white/60" />
  );
}

export default function Gallery() {
  const navigate = useNavigate();

  function logout() {
    // Sem auth real: apenas volta para login e limpa campos no reload natural
    navigate('/');
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      {/* Topbar */}
      <header className="topbar">
        <div className="container-page flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/gallery')}
            className="text-sm font-medium text-white/80 hover:text-white"
          >
            Início
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="chip hover:bg-white/15 transition"
                aria-label="Abrir menu do usuário"
              >
                Perfil <ChevronDown className="h-4 w-4 text-white/70" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={10}
                className="min-w-48 rounded-2xl border border-white/15 bg-black/70 p-2 text-sm text-white shadow-[0_20px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
              >
                <DropdownMenu.Item
                  onSelect={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 outline-none hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 text-white/70" />
                  Sair
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="container-page pb-14 pt-10">
        <h1 className="text-center text-3xl font-semibold tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-center text-sm text-white/65">
          Escolha um treinamento para continuar.
        </p>

        <div className="mt-10 space-y-10">
          {modulesMock.map((mod) => (
            <div key={mod.id}>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-lg font-semibold">{mod.name}</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mod.trainings.map((t) => (
                  <article key={t.id} className="card-training">
                    {/* imagem */}
                    <div className="relative h-36 w-full overflow-hidden bg-white/5">
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                          imagem
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />

                      {/* chips no topo */}
                      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                        {/* VR / AR */}
                        <span className="chip-overlay">
                          <ModalityIcon modality={t.modality} />
                          {t.modality}
                        </span>

                        {/* Tempo */}
                        <span className="chip-overlay">
                          <Clock3 className="h-4 w-4 text-white" />
                          {formatDuration(t.minutes)}
                        </span>

                        {/* Status */}
                        <span
                          className={[
                            'chip-overlay',
                            t.completed
                              ? 'chip-overlay-success'
                              : 'chip-overlay-muted',
                          ].join(' ')}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t.completed ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    {/* conteúdo */}
                    <div className="p-5">
                      <h3 className="text-base font-semibold">{t.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-white/65">
                        {t.description}
                      </p>

                      <button
                        type="button"
                        disabled={!t.enabled}
                        className={[
                          'mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition',
                          t.enabled
                            ? 'bg-violet-600 text-white hover:bg-violet-500 active:translate-y-[1px]'
                            : 'bg-white/6 text-white/35 cursor-not-allowed opacity-70',
                        ].join(' ')}
                        onClick={() => {
                          if (!t.enabled) return;
                          window.open(t.url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        {t.enabled ? 'Iniciar treinamento' : 'Em breve'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
