"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function TesteBancoPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch("/api/agents")
      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Conexão bem-sucedida! ${data.agents?.length || 0} agentes encontrados.`,
        })
      } else {
        setResult({
          success: false,
          message: `Erro na conexão: ${data.error || "Erro desconhecido"}`,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao testar conexão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teste do Banco de Dados</h1>
        <p className="text-muted-foreground">Verifique a conexão com o banco de dados Supabase</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Teste de Conexão
          </CardTitle>
          <CardDescription>Clique no botão abaixo para testar a conexão com o banco de dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Testar Conexão
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
