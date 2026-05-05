export enum AccidentDetectionSensitivity {
  Normal = 0,
  Sensitive = 1,
  Tough = 2,
}

export enum ApiLanguage {
  none = 'None',
  english = 'English',
  russian = 'Russian',
  portuguese = 'Portuguese',
  spanish = 'Spanish',
}

export type Tag = {
  tag: string;
  source?: string;
};
