import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

type Status = "default" | "error" | "disabled";

/**
 * IMPORTANT:
 * - Kita extend TextInputProps supaya komponen menerima semua properti TextInput
 *   seperti autoCapitalize, keyboardType, secureTextEntry, maxLength, etc.
 */
type BaseProps = TextInputProps & {
  label?: string;
  helperText?: string;
  status?: Status;
};

/* ---------- Text Field ---------- */
export const TextField = forwardRef<TextInput, BaseProps>(
  ({ label, helperText, status = "default", placeholder, ...rest }, ref) => (
    <View style={styles.formGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        {...rest}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray}
        style={[
          styles.input,
          status === "error" && styles.errorBorder,
          status === "disabled" && styles.disabled,
        ]}
        editable={status !== "disabled"}
      />
      {helperText ? (
        <Text style={[styles.helperText, status === "error" && styles.errorText]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  )
);
TextField.displayName = "TextField";   // ✅ tambahkan ini

/* ---------- Password Field ---------- */
export const PasswordField = forwardRef<TextInput, BaseProps>(
  ({ label, helperText, status = "default", placeholder, secureTextEntry = true, ...rest }, ref) => {
    const [secure, setSecure] = useState<boolean>(secureTextEntry);

    return (
      <View style={styles.formGroup}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputWrapper,
            status === "error" && styles.errorBorder,
            status === "disabled" && styles.disabled,
          ]}
        >
          <TextInput
            ref={ref}
            {...rest}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray}
            secureTextEntry={secure}
            style={styles.inputFlex}
            editable={status !== "disabled"}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.gray}
            />
          </TouchableOpacity>
        </View>
        {helperText ? (
          <Text style={[styles.helperText, status === "error" && styles.errorText]}>
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);
PasswordField.displayName = "PasswordField";   // ✅ tambahkan ini

/* ---------- Select Dropdown ---------- */
export const SelectField = ({
  label,
  placeholder = "Select Option",
  items = [],
  onValueChange,
}: {
  label?: string;
  placeholder?: string;
  items: { label: string; value: string }[];
  onValueChange?: (value: any, index: number) => void;
}) => (
  <View style={styles.formGroup}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputWrapper}>
      <RNPickerSelect
        onValueChange={onValueChange as (value: any, index: number) => void}
        items={items}
        placeholder={{ label: placeholder, value: null }}
        style={{
          inputIOS: styles.inputFlex,
          inputAndroid: styles.inputFlex,
          placeholder: { color: Colors.gray },
        }}
        useNativeAndroidPickerStyle={false}
        Icon={() => (
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color={Colors.gray}
            style={{ top: 12, right: 10 }}
          />
        )}
      />
    </View>
    {/* helperText untuk Select tinggal ditambahkan di sini jika diperlukan */}
  </View>
);

const styles = StyleSheet.create({
  formGroup: { marginBottom: 16 },
  label: {
    ...Fonts.paragraphMediumSmall,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    ...Fonts.paragraphRegularSmall,
    borderWidth: 1,
    borderColor: Colors.navy,
    borderRadius: 24,
    padding: 10,
    color: Colors.navy,
    backgroundColor: Colors.white,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.navy,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  inputFlex: {
    ...Fonts.paragraphRegularSmall,
    flex: 1,
    color: Colors.navy,
    paddingVertical: 0,
  },
  helperText: {
    ...Fonts.paragraphRegularSmall,
    fontSize: 12, // override kecil sesuai desain helper
    color: Colors.gray,
    marginTop: 4,
  },
  errorBorder: { borderColor: Colors.danger },
  disabled: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.gray,
    color: Colors.gray,
  },
  errorText: { color: Colors.danger },
});
