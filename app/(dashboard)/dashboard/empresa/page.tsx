"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SuporteGroovia } from "@/components/suporte-groovia"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentList } from "@/components/document-list"
import { useOrganization } from "@/lib/organization-context"

export default function EmpresaPage() {
  const { currentOrganization } = useOrganization()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Empresa</h1>
            <p className="text-gray-600 mt-2">Gerencie todos os documentos e entregas dos agentes</p>
          </div>
          <SuporteGroovia />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - 3 Quadrants */}
          <div className="lg:col-span-2 space-y-6">
            {/* GROOVIA INTELLIGENCE */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-xl text-purple-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GROOVIA INTELLIGENCE
                </CardTitle>
                <CardDescription>Dossiê completo da fase Scan - PDF e formato editável</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DocumentList
                  category="intelligence"
                  organizationId={currentOrganization?.id}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>

            {/* GROOVIA FLOW */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-xl text-green-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GROOVIA FLOW
                </CardTitle>
                <CardDescription>Outputs das fases Estratégia e Tático</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DocumentList
                  category="flow"
                  organizationId={currentOrganization?.id}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>

            {/* GROOVIA BOARD */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="text-xl text-purple-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  GROOVIA BOARD
                </CardTitle>
                <CardDescription>Compilado geral organizado - Estratégia até Tático</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DocumentList
                  category="board"
                  organizationId={currentOrganization?.id}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Company Documents */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-gray-200 sticky top-6">
              <CardHeader className="bg-gradient-to-b from-gray-50 to-white">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  DOCUMENTOS EMPRESA
                </CardTitle>
                <CardDescription>Compartilhe documentos sobre sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <DocumentUpload
                  category="company_docs"
                  organizationId={currentOrganization?.id}
                  onUploadComplete={handleUploadComplete}
                />
                <div className="mt-6">
                  <DocumentList
                    category="company_docs"
                    organizationId={currentOrganization?.id}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
