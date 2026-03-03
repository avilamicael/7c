import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_LINK = "https://app.seudominio.com.br/leads/empresa-demo";

export function LinkCaptacaoSection() {
  const [copiado, setCopiado] = useState(false);

  function handleCopiar() {
    navigator.clipboard.writeText(MOCK_LINK);
    setCopiado(true);
    toast.success("Link copiado para a área de transferência.");
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Link de Captação</CardTitle>
              <Badge variant="secondary" className="text-xs">Em breve</Badge>
            </div>
            <CardDescription>Compartilhe este link para captar leads de clientes.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            readOnly
            value={MOCK_LINK}
            className="font-mono text-sm text-muted-foreground bg-muted cursor-default select-all"
          />
          <Button variant="outline" size="icon" onClick={handleCopiar}>
            {copiado
              ? <Check className="size-4 text-green-500" />
              : <Copy className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}