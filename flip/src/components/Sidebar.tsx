// src/components/Sidebar.tsx
export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 p-6 border-r hidden md:block">
      <nav className="space-y-4">
        <a href="/dashboard" className="block hover:underline">
          🗓️ Horário
        </a>
        <a href="/dashboard#pdfs" className="block hover:underline">
          📁 Ficheiros
        </a>
        <a href="/dashboard#notas" className="block hover:underline">
          📝 Notas (em breve)
        </a>
      </nav>
    </aside>
  );
}
