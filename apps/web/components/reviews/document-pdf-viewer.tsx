import { advancesApi } from "@/lib/api";

type Props = {
  advanceId: string;
  title: string;
};

export function DocumentPdfViewer({ advanceId, title }: Props) {
  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="flex justify-end items-center px-4 py-2 bg-white border-b shrink-0">
        <a
          href={advancesApi.pdfDownloadUrl(advanceId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-[#185FA5] border border-[#185FA5] px-4 py-1.5 rounded-lg hover:bg-[#185FA5]/5"
        >
          Descargar PDF
        </a>
      </div>
      <iframe
        src={advancesApi.pdfPreviewUrl(advanceId)}
        className="flex-1 w-full border-0 bg-white"
        title={`Vista previa: ${title}`}
      />
    </div>
  );
}
