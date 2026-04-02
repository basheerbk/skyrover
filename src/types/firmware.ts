export type FirmwareArtifact = {
  name: string;
  address: number;
  dataBase64?: string;
};

export type CompileResponse = {
  success: boolean;
  message?: string;
  output?: string;
  requestId?: string;
  artifacts?: FirmwareArtifact[];
  flashMode?: string;
  flashFreq?: string;
  flashSize?: string;
};

