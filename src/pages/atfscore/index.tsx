import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Checkbox,
  Grid2 as Grid,
  ImageList,
  ImageListItem,
  MenuItem,
  Paper,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useRef } from "react";
import NumberField from "@/components/NumberField";
import * as Enka from "@/enka";

interface Option {
  label: string;
  main: boolean;
  sub: boolean;
  rate: number;
};

interface Multiple {
  use: boolean;
  value: number;
};

interface Score {
  score: number;
  maxScore: number;
};

interface SubStatus {
  status: string;
  value: number;
};

interface Artifact {
  main: string;
  sub: SubStatus[];
};

interface BaseStatus { [k: string]: number };

interface CharacterData {
  status: BaseStatus;
  artifacts: Artifact[];
};

interface CharacterDetails { [k: string]: CharacterData };

const options: Option[] = [
  { label: "会心率", main: true, sub: true, rate: 0.5 },
  { label: "会心ダメージ", main: true, sub: true, rate: 1 },
  { label: "攻撃力%", main: true, sub: true, rate: 0.75 },
  { label: "攻撃力+", main: true, sub: true, rate: 2.5 },
  { label: "HP%", main: true, sub: true, rate: 0.75 },
  { label: "HP+", main: true, sub: true, rate: 38.5 },  // ??
  { label: "防御力%", main: true, sub: true, rate: 0.9375 },
  { label: "防御力+", main: false, sub: true, rate: 3 },
  { label: "元素熟知", main: true, sub: true, rate: 3 },
  { label: "元素チャージ効率", main: true, sub: true, rate: 5/6 },
  { label: "物理ダメージ", main: true, sub: false, rate: 0.9375 },
  { label: "炎元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "水元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "風元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "雷元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "草元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "氷元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "岩元素ダメージ", main: true, sub: false, rate: 0.75 },
  { label: "与える治療効果", main: true, sub: false, rate: 0.577 }, // ??
];

const mainOptions = options.filter((opt) => opt.main);
const subOptions = options.filter((opt) => opt.sub);

const scoreColor = "#d66";

const defaultMainStatus = ["HP+", "攻撃力+", "攻撃力%", "炎元素ダメージ", "会心率"];
const defaultSubStatus = [
  { status: "会心率", value: 0 },
  { status: "会心ダメージ", value: 0 },
  { status: "元素熟知", value: 0 },
  { status: "元素チャージ効率", value: 0 },
];

export default function Atfscore() {
  const [fetching, setFetching] = useState(false);
  const [uid, setUid] = useState("");
  const [characters, setCharacters] = useState<string[]>([]);
  const characterDetails = useRef<CharacterDetails>({});
  
  const [multiples, setMultiples] = useState<{ [key: string]: Multiple }>(subOptions.reduce((obj, opt) => ({
    ...obj,
    [opt.label]: {
      use: ["会心率", "会心ダメージ", "攻撃力%"].includes(opt.label),
      value: opt.label.includes("会心") ? (1 / opt.rate) : (0.75 / opt.rate),
    },
  }), {}));

  const [baseStatus, setBaseStatus] = useState<BaseStatus>({
    "HP": 0,
    "攻撃力": 0,
    "防御力": 0,
  });

  const calcs = 5;
  const [artifacts, setArtifacts] = useState<Artifact[]>(Array(calcs).fill(0).map((z, i) => ({
    main: defaultMainStatus[i],
    sub: defaultSubStatus,
  })));

  const onChangeArtifact = (i: number, artifact: Artifact) => {
    const newArtifacts = [...artifacts];
    newArtifacts[i] = artifact;
    setArtifacts(newArtifacts);
  };

  const calcScore = (artifact: Artifact) => {
    const score = artifact.sub.reduce((sum, sub) => {
      const { status, value } = sub;
      return (multiples[status].use ? value * multiples[status].value : 0) + sum;
    }, 0);
    const optionWeights = subOptions
      .filter((opt) => multiples[opt.label].use && opt.label != artifact.main)
      .map((opt) => opt.rate * multiples[opt.label].value)
      .sort((a, b) => b - a);
    const maxScore = 7.78 * Array(4).fill(0).reduce((sum, z, i) => (
      sum + (optionWeights[i] || 0) * (i == 0 ? 6 : 1)
    ), 0);
    return { score: score, maxScore: maxScore };
  };

  const scores = artifacts.map((a) => calcScore(a));
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalMaxScore = scores.reduce((sum, s) => sum + s.maxScore, 0);

  const fetchEnka = async () => {
    if (!uid) { return; }
    setFetching(true);
    try {
      const response = await fetch(`${Enka.apiUrl}?uid=${uid}`);
      const jsonData: Enka.EnkaData = await response.json();
      //console.log(jsonData);
      const characterIds = jsonData.avatarInfoList?.map((c) => String(c.avatarId));
      if (characterIds) {
        setCharacters(characterIds);
        const details: CharacterDetails = jsonData.avatarInfoList.reduce((obj, c) => {
          const equips: (Artifact | null)[] = c.equipList.map((eq) => {
            if (!(eq.reliquary && eq.flat.reliquaryMainstat && eq.flat.reliquarySubstats)) {
              return null;
            }
            const mainStat = Enka.statusNames[eq.flat.reliquaryMainstat.mainPropId];
            const subStat = eq.flat.reliquarySubstats.map((stat) => ({
              status: Enka.statusNames[stat.appendPropId],
              value: stat.statValue,
            }));
            const subStatFull = Array(4).fill(0).map((z, i) => subStat[i] || { status: "防御力+", value: 0 });
            return { main: mainStat, sub: subStatFull };
          });
          const charaStatus: BaseStatus = {
            "HP": c.fightPropMap["1"],
            "攻撃力": c.fightPropMap["4"],
            "防御力": c.fightPropMap["7"],
          };
          const charaData: CharacterData = {
            status: charaStatus,
            artifacts: equips.filter((eq) => eq !== null),
          };
          return { ...obj, [String(c.avatarId)]: charaData };
        }, {});
        characterDetails.current = details;
      }
    } catch (e) {
      console.log(e);
    }
    setFetching(false);
  };

  const onClickCharacter = (id: string) => {
    //console.log(characterDetails.current)
    if (characterDetails.current[id]) {
      const fullArtifacts = Array(calcs).fill(0).map((z, i) => 
        characterDetails.current[id].artifacts[i] || {
          main: artifacts[i].main,
          sub: defaultSubStatus,
        }
      );
      setArtifacts(fullArtifacts);
      setBaseStatus(characterDetails.current[id].status);
    }
  };

  return (
    <>
      <Grid container spacing={5} sx={{ m: 5, width: 1000 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            カスタム聖遺物スコア計算機
          </Typography>
          <Typography variant="subtitle2">
            各ステータスの比重を設定してスコアを計算できます
          </Typography>
        </Grid>  
        <Grid container spacing={1} sx={{ width: 600, mb: 3 }}>
          <Grid size={12}>
            <Typography variant="h5" sx={{ my: 2 }}>
              係数の設定 (スコア = 数値 × 係数)
            </Typography>
          </Grid>
          {subOptions.map((opt) => {
            const setValue = (m: Multiple) => setMultiples({
              ...multiples,
              [opt.label]: m,
            });
            return (
              <Grid size={6} key={opt.label}>
                <MultipleEditor
                  opt={opt}
                  multiple={multiples[opt.label]}
                  setValue={setValue}
                  perValue={
                    opt.label.includes("+") ?
                    multiples[opt.label.replace("+", "%")].value : null
                  }
                  baseStatus={baseStatus}
                  setBaseStatus={setBaseStatus}
                />
              </Grid>
            );
          })}
        </Grid>
        <Grid size={12}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: 120 }}>
              <TextField
                label="UID"
                size="small"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
              />
            </Box>
            <Button
              color="success"
              size="small"
              variant="contained"
              onClick={fetchEnka}
            >
              キャラ情報取得
            </Button>
          </Box>
          {characters.length > 0 && (
            <ImageList cols={6} sx={{ mt: 1, width: 400 }}>
              {characters.map((c) => (
                <ImageListItem
                  key={c}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    bgcolor: Enka.characterData[c].rarity == 5 ? "#c95" : "#87b",
                    cursor: "pointer",
                  }}
                  onClick={() => onClickCharacter(c)}
                >
                  <img
                    src={`https://enka.network/ui/UI_AvatarIcon_${Enka.characterData[c].name}.png`}
                    alt={Enka.characterData[c].name}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Grid>
        <Grid container spacing={5} sx={{ width: 1000, mb: 4 }}>
          {Array(calcs).fill(0).map((z, i) => (
            <Grid size={6} key={i}>
              <ArtifactEditor
                artifact={artifacts[i]}
                multiples={multiples}
                setArtifact={(a: Artifact) => onChangeArtifact(i, a)}
                score={scores[i]}
              />
            </Grid>
          ))}
        </Grid>
        <Grid size={12}>
          <Typography variant="h5" sx={{ color: scoreColor }}>
            {`合計：${totalScore.toFixed(1)} / ${totalMaxScore.toFixed(1)} (${(100 * totalScore / (totalMaxScore || 1)).toFixed(1)}%)`}
          </Typography>
        </Grid>
        <Grid container spacing={1} sx={{ width: 900 }}>
          {subOptions.map((opt) => {
            const status = opt.label;
            const statusSum = artifacts.reduce((sum, a) => (a.sub.find((s) => s.status == status)?.value || 0) + sum, 0);
            const toFix = opt.rate > 1 ? 0 : 1;
            const scoreSumStr = multiples[status].use ? ` → ${(statusSum * multiples[status].value).toFixed(1)}` : "";
            return (
              <>
                <Grid size={2.8}>
                  <Typography variant="h6">
                    {`${status}`}
                  </Typography>
                </Grid>
                <Grid size={1.1}>
                  <Typography variant="h6">
                    {statusSum.toFixed(toFix)}
                  </Typography>
                </Grid>
                <Grid size={2.1}>
                  <Typography variant="h6" sx={{ color: scoreColor }}>
                    {scoreSumStr}
                  </Typography>
                </Grid>
              </>
            );
          })}
        </Grid>
      </Grid>
      <Backdrop open={fetching}>
        <CircularProgress sx={{ color: "#fff" }} />
      </Backdrop>
    </>
  );
};

const MultipleEditor = ({
  opt,
  multiple,
  setValue,
  perValue = null,
  baseStatus,
  setBaseStatus,
}: {
  opt: Option;
  multiple: Multiple;
  setValue: (m: Multiple) => void;
  perValue: number | null;
  baseStatus: BaseStatus;
  setBaseStatus: (s: BaseStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isPlus = opt.label.includes("+") && perValue !== null;
  const status = isPlus ? opt.label.split("+")[0] : "";

  const presets = [
    { label: "等倍", value: 1 },
    { label: "伸び(会心ダメージ換算)", value: 1 / opt.rate },
    { label: "伸び(攻撃力%換算)", value: 0.75 / opt.rate },
  ];
  if (isPlus) {
    presets.push({
      label: `基礎${status}を元に${status}%に換算`,
      value: 100 * perValue / (baseStatus[status] || 1),
    });
  }

  const onClickPreset = (v: number) => {
    setValue({ ...multiple, value: v });
    setOpen(false);
  };

  const onChangeBaseStatus = (v: number) => {
    setBaseStatus({ ...baseStatus, [status]: v });
  };

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Checkbox
        size="small"
          checked={multiple.use}
          onClick={() => setValue({
            use: !multiple.use,
            value: multiple.value,
          })}
        />
        <Box sx={{ width: 150 }}>
          <NumberField
            label={opt.label}
            size="small"
            value={Math.round(10000 * multiple.value) / 10000}
            onChange={(e) => setValue({
              use: multiple.use,
              value: Math.max(Number(e.target.value), 0),
            })}
            fullWidth
          />
        </Box>
        <Button
          color="primary"
          variant="text"
          size="small"
          onClick={() => setOpen(true)}
          ref={buttonRef}
          sx={{ mx: 1 }}
        >
          プリセット
        </Button>
      </Box>
      <Popover
        open={open}
        anchorEl={buttonRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClose={() => setOpen(false)}
      >
        <Paper elevation={3} sx={{ p: 1 }}>
          <Box sx={{ display: "flex" }}>
            {presets.map((pre) => (
              <Button
                key={pre.label}
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => onClickPreset(pre.value)}
                sx={{ m: 0.5 }}
              >
                {pre.label}
              </Button>
            ))}
            {isPlus && (
              <Box sx={{ width: 100 }}>
                <NumberField
                  label={`基礎${status}`}
                  size="small"
                  value={Math.round(baseStatus[status])}
                  onChange={(e) => onChangeBaseStatus(Math.max(Number(e.target.value), 0))}
                  fullWidth
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

const ArtifactEditor = ({
  artifact,
  multiples,
  setArtifact,
  score: scores,
}: {
  artifact: Artifact;
  multiples: { [k: string]: Multiple };
  setArtifact: (a: Artifact) => void;
  score: Score;
}) => {
  const { main: mainStatus, sub: subStatus } = artifact;
  const { score, maxScore } = scores;

  const onChangeSubStatus = (i: number, status: { status?: string, value?: number }) => {
    const newSubStatus = [...subStatus];
    newSubStatus[i] = { ...newSubStatus[i], ...status };
    setArtifact({ main: mainStatus, sub: newSubStatus });
  };

  return (
    <Box sx={{ width: 600, mr: 5 }}>
      <Box sx={{ width: 250, my: 3 }}>
        <TextField
          select
          label="メインステータス"
          size="small"
          value={mainStatus}
          onChange={(e) => setArtifact({ main: e.target.value, sub: subStatus })}
          fullWidth
        >
          {mainOptions.map((opt) => (
            <MenuItem key={opt.label} value={opt.label}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {Array(4).fill(0).map((z, i) => {
        const { status, value } = subStatus[i];
        return (
          <Box key={i} sx={{ display: "flex", my: 2 }}>
            <Box sx={{ width: 200 }}>
              <TextField
                select
                label={`サブステータス${i + 1}`}
                size="small"
                value={status}
                onChange={(e) => onChangeSubStatus(i, { status: e.target.value })}
                fullWidth
              >
                {subOptions.map((opt) => (
                  <MenuItem key={opt.label} value={opt.label}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ width: 150 }}>
              <NumberField
                label={status}
                size="small"
                value={value}
                onChange={(e) => onChangeSubStatus(i, { value: Math.max(Number(e.target.value), 0) })}
                fullWidth
              />
            </Box>
            <Typography variant="h6" sx={{ mx: 2, color: scoreColor }}>
              {(multiples[status].use ? value * multiples[status].value : 0).toFixed(1)}
            </Typography>
          </Box>
        );
      })}
      <Typography variant="h6" sx={{ color: scoreColor }}>
        {`${score.toFixed(1)} / ${maxScore.toFixed(1)} (${(100 * score / (maxScore || 1)).toFixed(1)}%)`}
      </Typography>
    </Box>
  );
};