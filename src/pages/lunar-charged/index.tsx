import {
  Box,
  Checkbox,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import NumberField from "@/components/NumberField";
import { useEffect, useState, Component } from "react";

type InputStatus = {
  enabled: boolean;
  base: number;
  em: number;
  critRate: number;
  critDmg: number;
  lunarChargedBuff: number;
};

type IndividualOutput = {
  baseDmgExp: number;
  firstRate: number;
  secondRate: number;
  finalDmgExp: number;
};

export default function LunarCharged() {
  const [inputs, setInputs] = useState<InputStatus[]>(Array.from({ length: 4 }, () => ({
    enabled: true,
    base: 1447,
    em: 200,
    critRate: 60,
    critDmg: 120,
    lunarChargedBuff: 0,
  })));
  const [outputs, setOutputs] = useState<IndividualOutput[]>(Array.from({ length: 4 }, () => ({
    baseDmgExp: 0,
    firstRate: 0,
    secondRate: 0,
    finalDmgExp: 0,
  })))
  const [res, setRes] = useState(10);
  const [baseBuff, setBaseBuff] = useState(14);
  const [finalDmg, setFinalDmg] = useState({ exp: 0, min: 0, max: 0 });

  const toggleEnabled = (index: number) => {
    setInputs((prev) => prev.map((input, i) => i == index ? { ...input, enabled: !prev[i].enabled } : input));
  };

  const updateInput = (params: Partial<InputStatus>, index: number) => {
    setInputs((prev) => prev.map((input, i) => i == index ? { ...input, ...params } : input));
  };

  const calcIndividualDmg = (status: InputStatus, isCrit: boolean) => {
    const base = 1.8 * (1 + baseBuff / 100) * status.base;
    const lunarChargedBuff = 1 + 6 * status.em / (status.em + 2000) + status.lunarChargedBuff / 100;
    const crit = 1 + (isCrit ? status.critDmg / 100 : 0);
    const resMultiplier = res < 0 ? 1 - res / 200 : res < 75 ? 1 - res / 100 : 1 / (4 * res / 100 + 1);
    return base * lunarChargedBuff * crit * resMultiplier;
  };

  // 順位重複なし
  const getRank = (arr: number[], index: number) => {
    const sorteddArr = arr.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
    return sorteddArr.findIndex(v => v.index == index);
  };

  const calcDmg = () => {
    const enabledIndex = inputs.reduce((acc, stat, i) => stat.enabled ? [...acc, i] : acc, [] as number[]);
    
    const individualResults: IndividualOutput[] = inputs.map((status) => ({
      baseDmgExp: status.enabled ? calcIndividualDmg(status, false) * (1 + status.critRate * status.critDmg / 10000) : 0,
      firstRate: 0,
      secondRate: 0,
      finalDmgExp: 0,
    }));
    let minDmg = Infinity;
    let maxDmg = -Infinity;

    // 会心全パターン
    for (let i = 0; i < 2 ** enabledIndex.length; i++) {
      const critPtn = i.toString(2).padStart(enabledIndex.length, "0");
      const rate = enabledIndex.reduce((acc, index, j) => {
        const status = inputs[index];
        const isCrit = critPtn[j] == "1";
        const critRate = Math.min(status.critRate) / 100;
        const critOrNotRate = isCrit ? critRate : 1 - critRate;
        return acc * critOrNotRate;
      }, 1);
      const dmgs = enabledIndex.map((index, j) => {
        const status = inputs[index];
        const isCrit = critPtn[j] == "1";
        return calcIndividualDmg(status, isCrit);
      });
      const totalDmg = enabledIndex.reduce((acc, index, j) => {
        const dmg = dmgs[j];
        const rank = getRank(dmgs, j);
        const finalDmgMultiplier = rank == 0 ? 1 : rank == 1 ? 0.5 : 1 / 12;
        const finalDmg = dmg * finalDmgMultiplier;
        individualResults[index].firstRate += rank == 0 ? rate : 0;
        individualResults[index].secondRate += rank == 1 ? rate : 0;
        individualResults[index].finalDmgExp += finalDmg * rate;
        return acc + finalDmg;
      }, 0);
      minDmg = Math.min(minDmg, totalDmg);
      maxDmg = Math.max(maxDmg, totalDmg);
    }
    const finalDmgExp = individualResults.reduce((acc, result) => acc + result.finalDmgExp, 0);
    setOutputs(individualResults);
    setFinalDmg({ exp: finalDmgExp, max: maxDmg, min: minDmg });
  };

  useEffect(() => {
    calcDmg();
  }, [inputs, res, baseBuff]);

  const inputContainerStyle = {
    width: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const inputProps = {
    size: "medium" as const,
    fullWidth: true,
  };

  return (
    <Grid container spacing={3} sx={{ m: 5, minWidth: 1000 }}>
      <Grid size={12}>
        <Typography variant="h4">
          月感電ダメージ期待値計算機
        </Typography>
        <Typography variant="subtitle2" sx={{ whiteSpace: "pre-wrap", color: "#666" }}>
          月感電ダメージ = 1番大きい個別ダメージ×1 + 2番目×0.5 + 3番目×(1/12) + 4番目×(1/12){"\n"}
          個別ダメージ = 1.8 × (1 + 基礎値バフ) × Lv.固有値 × (1 + 6熟知 / (熟知 + 2000) + 月感電バフ) × (1 + 会心ダメージ(会心時のみ)) × 耐性補正{"\n"}
          ※会心は各キャラごとに判定
        </Typography>
      </Grid>

      <Grid size={12} sx={{ display: "flex", gap: 1 }}>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="敵の元素耐性(%)"
            value={res}
            onChange={(e) => setRes(Number(e.target.value) || 0)}
          />
        </Box>
        <Box sx={{ ...inputContainerStyle, width: 150 }}>
          <NumberField
            {...inputProps}
            label="月感電基礎値バフ(%)"
            value={baseBuff}
            onChange={(e) => setBaseBuff(Number(e.target.value) || 0)}
          />
        </Box>
      </Grid>

      {inputs.map((input, i) => (
        <InputArea
          key={i}
          input={input}
          output={outputs[i]}
          toggleEnabled={() => toggleEnabled(i)}
          updateInput={(params) => updateInput(params, i)}
        />
      ))}

      <Grid size={12}>
        {[
          { label: "期待値", value: Math.round(finalDmg.exp) },
          { label: "最大値", value: Math.round(finalDmg.max) },
          { label: "最小値", value: Math.round(finalDmg.min) },
        ].map(({ label, value }, i) => (
          <Box sx={{ display: "flex", gap: 2 }} key={i}>
            <Typography variant="h6" sx={{ color: "#444", width: 80 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color: "#f44" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Grid>

      <Grid size={12}>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#666" }}>
          ※Lv.固有値：Lv.90で1447 <a href="https://genshin-impact.fandom.com/wiki/Elemental_Reaction/Level_Scaling#Level_Multiplier" target="_blank" rel="noopener noreferrer" style={{ color: "#284" }}>⇒詳細(Fandom)</a>{"\n"}
          ※月感電基礎値バフ：イネファ固有天賦(最大14%){"\n"}
          ※月感電バフ：砕け散る光輪(精錬1: 40%)・イファ固有天賦(最大40%)・モナ1凸(15%)・雷のような怒り4セット(20%)
        </Typography>
      </Grid>
    </Grid>
  );
}

type InputAreaProps = {
  input: InputStatus;
  output: IndividualOutput;
  toggleEnabled: () => void;
  updateInput: (params: Partial<InputStatus>) => void;
};

const InputAreaComponent = ({
  input,
  output,
  toggleEnabled,
  updateInput,
}: InputAreaProps) => {
  const inputContainerStyle = {
    width: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const inputProps = {
    size: "medium" as const,
    fullWidth: true,
  };

  return (
    <Grid size={12}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box sx={{ ...inputContainerStyle, width: 20 }}>
          <Checkbox
            checked={input.enabled}
            onChange={toggleEnabled}
            size="small"
          />
        </Box>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="Lv.固有値"
            value={input.base}
            onChange={(e) => updateInput({ base: Number(e.target.value) || 0 })}
          />
        </Box>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="元素熟知"
            value={input.em}
            onChange={(e) => updateInput({ em: Number(e.target.value) || 0 })}
          />
        </Box>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="会心率(%)"
            value={input.critRate}
            onChange={(e) => updateInput({ critRate: Number(e.target.value) || 0 })}
          />
        </Box>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="会心ダメージ(%)"
            value={input.critDmg}
            onChange={(e) => updateInput({ critDmg: Number(e.target.value) || 0 })}
          />
        </Box>
        <Box sx={inputContainerStyle}>
          <NumberField
            {...inputProps}
            label="月感電バフ(%)"
            value={input.lunarChargedBuff}
            onChange={(e) => updateInput({ lunarChargedBuff: Number(e.target.value) || 0 })}
          />
        </Box>

        <OutputField label="個別期待値" value={Math.round(output.baseDmgExp)} />
        <OutputField label="1位率" value={`${Math.round(output.firstRate * 100 * 10) / 10}%`} />
        <OutputField label="2位率" value={`${Math.round(output.secondRate * 100 * 10) / 10}%`} />
        <OutputField label="貢献度期待値" value={Math.round(output.finalDmgExp)} />
      </Box>
    </Grid>
  )
};

class InputArea extends Component {
  props: InputAreaProps;

  constructor(props: InputAreaProps) {
    super(props);
    this.props = props;
  };

  shouldComponentUpdate(nextProps: Readonly<InputAreaProps>): boolean {
    return JSON.stringify(this.props.input) != JSON.stringify(nextProps.input) ||
      JSON.stringify(this.props.output) != JSON.stringify(nextProps.output);
  };

  render() {
    return (
      <InputAreaComponent {...this.props} />
    );
  };
};

const OutputField = ({ label, value }: { label: string, value: number | string }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: 100 }}>
      <Typography variant="body2" sx={{ color: "#666" }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ color: "#f44" }}>
        {value}
      </Typography>
    </Box>
  );
};