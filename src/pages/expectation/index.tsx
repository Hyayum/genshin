import {
  Box,
  Grid2 as Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import NumberField from "@/components/NumberField";
import { useState } from "react";

interface Calc {
  mode: number;
  noncritValue?: number;
  critValue?: number;
  critRate: number;
  critDamage?: number;
};

enum mode {
  fromCrit = 0,
  fromNoncrit = 1,
  fromValues = 2,
};

export default function Expectation() {
  const defaultCalc = {
    mode: mode.fromCrit,
    noncritValue: 0,
    critValue: 0,
    critRate: 0,
    critDamage: 0,
  };
  const [calcs, setCalcs] = useState<Calc[]>(Array(10).fill(defaultCalc));
  const onChangeCalc = (calc: Calc, i: number) => {
    const newCalcs = [...calcs];
    newCalcs[i] = calc;
    setCalcs(newCalcs);
  };

  return (
    <Grid container spacing={1} sx={{ m: 5, minWidth: 1000 }}>
      <Grid size={12}>
        <Typography variant="h4">
          ダメージ期待値計算機
        </Typography>
        <Typography variant="subtitle2">
          ※会心ダメージの数値は原神方式 (会心時のダメージが(1 + 会心ダメージ)倍)
        </Typography>
      </Grid>
      {calcs.map((calc, i) => (
        <Grid size={12} key={i}>
          <Calculator calc={calc} onChange={(c) => onChangeCalc(c, i)} />
        </Grid>
      ))}
    </Grid>
  );
};

const Calculator = ({ calc, onChange }: { calc: Calc, onChange: (c: Calc) => void }) => {
  const required: { [k: number]: string[] } = {
    [mode.fromCrit]: ["critValue", "critRate", "critDamage"],
    [mode.fromNoncrit]: ["noncritValue", "critRate", "critDamage"],
    [mode.fromValues]: ["noncritValue", "critValue", "critRate"],
  };

  const modeOptions = [
    { label: "会心時のダメージと率ダメから", value: mode.fromCrit },
    { label: "非会心時のダメージと率ダメから", value: mode.fromNoncrit },
    { label: "会心/非会心時のダメージと会心率から", value: mode.fromValues },
  ];

  const calcExpectation = () => {
    if (calc.mode == mode.fromCrit) {
      if (!(calc.critValue && calc.critRate && calc.critDamage)) { return 0; }
      const noncritValue = 100 * calc.critValue / (100 + calc.critDamage);
      return (calc.critValue * calc.critRate + noncritValue * (100 - calc.critRate)) / 100;
    } else if (calc.mode == mode.fromNoncrit) {
      if (!(calc.noncritValue && calc.critRate && calc.critDamage)) { return 0; }
      const critValue = calc.noncritValue * (100 + calc.critDamage) / 100;
      return (critValue * calc.critRate + calc.noncritValue * (100 - calc.critRate)) / 100;
    } else if (calc.mode == mode.fromValues) {
      if (!(calc.noncritValue && calc.critValue && calc.critRate)) { return 0; }
      return (calc.critValue * calc.critRate + calc.noncritValue * (100 - calc.critRate)) / 100;
    } else {
      return 0;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 1, my: 1 }}>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 350 }}>
          <TextField
            select
            id="mode"
            label="計算方式"
            size="small"
            value={calc.mode}
            onChange={(e) => onChange({ ...calc, mode: Number(e.target.value) })}
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          >
            {modeOptions.map((k) => (
              <MenuItem key={k.value} value={k.value}>
                {k.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        {required[calc.mode].includes("critValue") && (
          <Box sx={{ width: 150 }}>
            <NumberField
              id="critValue"
              label="会心時のダメージ"
              size="small"
              value={calc.critValue}
              onChange={(e) => onChange({ ...calc, critValue: Math.max(Number(e.target.value), 0) })}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
        )}
        {required[calc.mode].includes("noncritValue") && (
          <Box sx={{ width: 150 }}>
            <NumberField
              id="noncritValue"
              label="非会心時のダメージ"
              size="small"
              value={calc.noncritValue}
              onChange={(e) => onChange({ ...calc, noncritValue: Math.max(Number(e.target.value), 0) })}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
        )}
        {required[calc.mode].includes("critRate") && (
          <Box sx={{ width: 150 }}>
            <NumberField
              id="critRate"
              label="会心率(%)"
              size="small"
              value={calc.critRate}
              onChange={(e) => onChange({ ...calc, critRate: Math.max(Number(e.target.value), 0) })}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
        )}
        {required[calc.mode].includes("critDamage") && (
          <Box sx={{ width: 150 }}>
            <NumberField
              id="critDamage"
              label="会心ダメージ(%)"
              size="small"
              value={calc.critDamage}
              onChange={(e) => onChange({ ...calc, critDamage: Math.max(Number(e.target.value), 0) })}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
        )}
        <Typography variant="h6" sx={{ mx: 2, my: 0.5, color: "#f66" }}>
          {calcExpectation().toFixed(0)}
        </Typography>
      </Box>
    </Paper>
  );
};