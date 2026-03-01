import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Calendar, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { usuariosApi } from "@/lib/usuarios.api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfileHeader({ usuario, onAtualizar }) {
  const inputRef = useRef(null);
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  const iniciais = [usuario?.nome?.[0], usuario?.sobrenome?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  const localizacao = [usuario?.cidade, usuario?.uf]
    .filter(Boolean)
    .join(", ");

  const membroDesde = usuario?.date_joined
    ? format(new Date(usuario.date_joined), "MMMM 'de' yyyy", { locale: ptBR })
    : null;

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSalvandoAvatar(true);
    try {
      await usuariosApi.atualizarAvatar(file);
      toast.success("Foto atualizada.");
      onAtualizar?.();
    } catch (err) {
      toast.error(err?.avatar?.[0] || "Erro ao atualizar foto.");
    } finally {
      setSalvandoAvatar(false);
      e.target.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={usuario?.avatar_url} alt="Perfil" />
              <AvatarFallback className="text-2xl">{iniciais}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
              disabled={salvandoAvatar}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold">
              {[usuario?.nome, usuario?.sobrenome].filter(Boolean).join(" ") || "—"}
            </h1>
            <p className="text-muted-foreground capitalize">
              {usuario?.role || "—"}
            </p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {usuario?.email || "—"}
              </div>
              {localizacao && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {localizacao}
                </div>
              )}
              {membroDesde && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  Membro desde {membroDesde}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}