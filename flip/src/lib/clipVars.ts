export const PERIOD_N = "per%EDodo_lectivo";
export const PERIOD_TYPE = "tipo_de_per%EDodo_lectivo";
export const TYPE_FILE = "tipo_de_documento_de_unidade";

export enum PeriodType {
    S = "s",
    T = "t",
}

export enum FileType {
    MULTIMEDIA = "0ac",
    PROBLEMS = "1e",
    PROTOCOLS = "2tr",
    SEMINARS = "3sm",
    EXAMS = "ex",
    TESTS = "t",
    SUPPORT_TEXTS = "ta",
    OTHERS = "xot"
}

export const typeToRealName = (type: FileType): string => {
    const map: Record<FileType, string> = {
        [FileType.MULTIMEDIA]: "Multimédia",
        [FileType.PROBLEMS]: "Problemas",
        [FileType.PROTOCOLS]: "Protocolos",
        [FileType.SEMINARS]: "Seminários",
        [FileType.EXAMS]: "Exames",
        [FileType.TESTS]: "Testes",
        [FileType.SUPPORT_TEXTS]: "Textos de Apoio",
        [FileType.OTHERS]: "Outros"
    };
    return map[type] ?? "Desconhecido";
};

export function stringToFileType(typeString: string): FileType | undefined {
  // Check direct match first
  if (Object.values(FileType).includes(typeString as FileType)) {
    return typeString as FileType;
  }
  
  // Try to match by name using the typeToRealName mapping
  const normalizedString = typeString.toLowerCase();
  
  for (const type of Object.values(FileType)) {
    // Check if the real name matches (case-insensitive)
    if (typeToRealName(type).toLowerCase() === normalizedString) {
      return type;
    }
  }
  
  // No match found
  return undefined;
}
