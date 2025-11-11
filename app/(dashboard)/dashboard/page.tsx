"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

// Inline SVG components
const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-purple-50 p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Welcome Video Section */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl border border-green-100">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-5xl font-bold text-gray-900">Bem-vindo ao Groov.ia</h1>
            <p className="text-xl text-gray-700">Sua jornada de transformação digital começa aqui</p>
          </div>

          {/* YouTube Video Embed */}
          <div className="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl shadow-xl">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/C9U2rPYtqNo"
              title="Vídeo de Boas-vindas"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg text-gray-600">
              Assista ao vídeo para entender como o Groov.ia pode transformar seu negócio
            </p>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="rounded-3xl bg-white p-12 text-center shadow-2xl border-2 border-transparent bg-gradient-to-br from-green-100 to-purple-100 bg-clip-padding">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-purple-100 p-4">
                <PlayIcon />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-gray-900">Início - Scan do seu negócio</h2>

            <p className="text-lg leading-relaxed text-gray-700">
              Comece sua jornada de transformação digital com o Scan completo do seu negócio. Nossa IA vai guiá-lo
              através de 6 etapas estratégicas para revelar o DNA da sua empresa e criar um plano de ação inteligente.
            </p>

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="group h-16 bg-green-600 px-12 text-xl font-bold hover:bg-green-700 hover:shadow-2xl hover:shadow-green-600/30"
              >
                <Link href="/dashboard/jornada-scan" className="flex items-center gap-3">
                  Começar Jornada Scan
                  <ArrowRightIcon />
                </Link>
              </Button>

              <p className="text-sm text-gray-600">⏱️ Tempo estimado: 45-60 minutos · 🎯 6 etapas estratégicas</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 text-center shadow-lg border border-green-100">
            <div className="mb-2 text-4xl font-bold text-green-600">6</div>
            <div className="text-sm font-semibold text-gray-700">Etapas Estratégicas</div>
            <div className="mt-1 text-xs text-gray-500">Jornada completa de análise</div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-center shadow-lg border border-purple-100">
            <div className="mb-2 text-4xl font-bold text-purple-600">IA</div>
            <div className="text-sm font-semibold text-gray-700">Inteligência Artificial</div>
            <div className="mt-1 text-xs text-gray-500">Análise profunda e personalizada</div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-center shadow-lg border border-green-100">
            <div className="mb-2 text-4xl font-bold text-green-600">100%</div>
            <div className="text-sm font-semibold text-gray-700">Personalizado</div>
            <div className="mt-1 text-xs text-gray-500">Para o seu negócio único</div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
          <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">Próximos Passos</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto justify-start p-6 text-left hover:border-green-300 hover:bg-green-50 bg-transparent"
            >
              <Link href="/dashboard/agentes">
                <div>
                  <div className="mb-1 font-bold">Ver Meus Agentes</div>
                  <div className="text-sm text-gray-600">Acesse todos os agentes IA disponíveis</div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto justify-start p-6 text-left hover:border-purple-300 hover:bg-purple-50 bg-transparent"
            >
              <Link href="/dashboard/membros">
                <div>
                  <div className="mb-1 font-bold">Convidar Equipe</div>
                  <div className="text-sm text-gray-600">Colabore com sua equipe na jornada</div>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
