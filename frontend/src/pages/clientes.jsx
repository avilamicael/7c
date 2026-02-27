import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClientesTable } from "@/components/clientes/clientes-table";

// Mock data — substituir pela chamada à API quando estiver pronta
const clientesMock = [
  {
    id: "1",
    public_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    nome: "João",
    sobrenome: "Silva",
    data_nascimento: "1985-03-15",
    nacionalidade: "BR",
    passaporte: "AB123456",
    passaporte_emissao: "2020-01-10",
    passaporte_expiracao: "2030-01-10",
    passaporte_pais: "BR",
    email: "joao.silva@email.com",
    rede_social: "@joaosilva",
    observacoes: "Cliente VIP",
    ativo: true,
    data_cadastro: "2025-02-10T10:00:00Z",
    documentos: [
      { id: 1, tipo: "cpf", numero: "123.456.789-00" },
      { id: 2, tipo: "rg", numero: "12.345.678-9" },
    ],
    telefones: [
      { id: 1, tipo: "proprio", nome: "", numero: "(48) 99999-1111" },
      { id: 2, tipo: "emergencia", nome: "Maria Silva", numero: "(48) 98888-2222" },
    ],
  },
  {
    id: "2",
    public_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    nome: "Ana",
    sobrenome: "Pereira",
    data_nascimento: "1992-07-22",
    nacionalidade: "BR",
    passaporte: "",
    passaporte_emissao: "",
    passaporte_expiracao: "",
    passaporte_pais: "",
    email: "ana.pereira@email.com",
    rede_social: "@anapereira",
    observacoes: "",
    ativo: true,
    data_cadastro: "2025-02-15T14:30:00Z",
    documentos: [{ id: 3, tipo: "cpf", numero: "987.654.321-00" }],
    telefones: [{ id: 3, tipo: "proprio", nome: "", numero: "(11) 97777-3333" }],
  },
  {
    id: "3",
    public_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    nome: "Carlos",
    sobrenome: "Mendez",
    data_nascimento: "1978-11-05",
    nacionalidade: "AR",
    passaporte: "XY987654",
    passaporte_emissao: "2019-06-15",
    passaporte_expiracao: "2029-06-15",
    passaporte_pais: "AR",
    email: "carlos.mendez@email.com",
    rede_social: "",
    observacoes: "Fala espanhol",
    ativo: true,
    data_cadastro: "2025-01-20T09:00:00Z",
    documentos: [{ id: 4, tipo: "outro", numero: "DNI 30123456" }],
    telefones: [
      { id: 4, tipo: "proprio", nome: "", numero: "+54 11 9999-4444" },
      { id: 5, tipo: "emergencia", nome: "Sofia Mendez", numero: "+54 11 8888-5555" },
    ],
  },
  {
    id: "4",
    public_id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    nome: "Emily",
    sobrenome: "Johnson",
    data_nascimento: "1990-02-28",
    nacionalidade: "US",
    passaporte: "US456789",
    passaporte_emissao: "2021-03-20",
    passaporte_expiracao: "2031-03-20",
    passaporte_pais: "US",
    email: "emily.johnson@email.com",
    rede_social: "@emilyjohnson",
    observacoes: "",
    ativo: false,
    data_cadastro: "2024-12-05T11:00:00Z",
    documentos: [{ id: 5, tipo: "outro", numero: "SSN 123-45-6789" }],
    telefones: [{ id: 5, tipo: "proprio", nome: "", numero: "+1 555 9999-6666" }],
  },
];

export default function ClientesPage() {
  // isAdmin — substituir pelo contexto de autenticação real
  const isAdmin = true;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-2">
                <h1 className="text-2xl font-bold">Clientes</h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie sua base de clientes.
                </p>
              </div>
              <div className="px-4 lg:px-6">
                <ClientesTable clientes={clientesMock} isAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
