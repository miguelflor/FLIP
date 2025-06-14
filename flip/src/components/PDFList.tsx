// src/components/PDFList.tsx
export default function PDFList() {
  const pdfs = [
    { nome: 'Aula 1 - Cálculo II.pdf', link: '#' },
    { nome: 'Resumo - EDA.pdf', link: '#' },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4" id="pdfs">
      <h3 className="text-lg font-bold mb-2">📁 Ficheiros Recentes</h3>
      <ul className="space-y-1 text-sm">
        {pdfs.map((pdf, idx) => (
          <li key={idx}>
            <a href={pdf.link} className="text-blue-600 hover:underline">
              {pdf.nome}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
