//必要部分のみ
export interface Enka {
  avatarInfoList: AvatarInfo[];
};

export interface AvatarInfo {
  avatarId: number;
  fightPropMap: { [k: string]: number };
  equipList: Equip[];
};

export interface Equip {
  reliquary?: {
    level: number;
  };
  weapon?: {
    level: number;
  };
  flat: {
    reliquarySubstats?: Substat[];
    reliquaryMainstat?: {
      mainPropId: string;
      statValue: number;
    };
    weaponStats?: Substat[];
  };
};

export interface Substat {
  appendPropId: string;
  statValue: number
};