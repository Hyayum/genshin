import { TextField, TextFieldProps, TextFieldVariants } from "@mui/material";
import { useState } from "react";

type Props = {
    variant?: TextFieldVariants;
  } & Omit<TextFieldProps, 'variant' | 'onFocus' | 'onBlur' | 'type'>

const NumberField = (props: Props) => {
  const [focused, setFocused] = useState(false);
  const { value, ...rest } = props;
  return (
    <TextField
      { ...rest }
      type="number"
      value={value || (focused ? "" : value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

export default NumberField;