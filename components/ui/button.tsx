import React from "react";
import {
    ActivityIndicator,
    GestureResponderEvent,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

type Size = "large" | "medium" | "small";
type Variant = "solid" | "outline";

export type ButtonProps = {
	title: string;
	onPress?: (e: GestureResponderEvent) => void;
	size?: Size;
	variant?: Variant;
	loading?: boolean;
	disabled?: boolean;
	uppercase?: boolean;
	/** Brand color override:
	 * - solid: background & border
	 * - outline: border & text
	 * default: Colors.navy
	 */
	color?: string;
	/** Override warna teks (kalau perlu) */
	textColor?: string;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	testID?: string;
};

export default function Button({
	title,
	onPress,
	size = "medium",
	variant = "solid",
	loading = false,
	disabled = false,
	uppercase = false,
	color,
	textColor,
	style,
	textStyle,
	testID,
}: ButtonProps) {
	// warna utama tombol (default navy)
	const tone = color ?? Colors.navy;

	return (
		<Pressable
			testID={testID}
			disabled={disabled || loading}
			onPress={onPress}
			style={({ pressed }) => {
				const base: StyleProp<ViewStyle> = [
					styles.base,
					sizeStyles[size],
					style,
				];

				if (variant === "solid") {
					(base as (ViewStyle | undefined)[]).push({
						backgroundColor: tone,
						borderColor: tone,
						opacity: pressed ? 0.9 : 1, // feedback sederhana saat ditekan
					});
					if (disabled || loading) {
						(base as (ViewStyle | undefined)[]).push({
							backgroundColor: Colors.lightGray,
							borderColor: Colors.gray,
						});
					}
				} else {
					// outline
					(base as (ViewStyle | undefined)[]).push({
						backgroundColor: "transparent",
						borderColor: tone,
					});
					if (pressed) {
						(base as (ViewStyle | undefined)[]).push({
							// bg samar saat ditekan
							backgroundColor: "rgba(0,0,0,0.04)",
						});
					}
					if (disabled || loading) {
						(base as (ViewStyle | undefined)[]).push({
							borderColor: Colors.gray,
						});
					}
				}

				return base;
			}}>
			{() => {
				const isDisabled = disabled || loading;
				const txtBase: StyleProp<TextStyle> = [
					styles.text,
					sizeTextStyles[size],
					{ textTransform: uppercase ? "uppercase" : "none" },
					textStyle,
				];

				if (variant === "solid") {
					// default teks solid = putih, bisa dioverride
					txtBase.push({ color: textColor ?? Colors.white });
					if (isDisabled) txtBase.push({ color: Colors.gray });
				} else {
					// outline: default warna teks = tone, bisa dioverride
					txtBase.push({ color: textColor ?? tone });
					if (isDisabled) txtBase.push({ color: Colors.gray });
				}

				return loading ? (
					<ActivityIndicator
						size="small"
						color={
							variant === "solid"
								? textColor ?? Colors.white
								: textColor ?? tone
						}
					/>
				) : (
					<Text style={txtBase}>{title}</Text>
				);
			}}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		// gunakan Fonts kamu kalau mau:
		...Fonts.paragraphMediumLarge,
	},
});

const sizeStyles: Record<Size, ViewStyle> = {
	large: { height: 48, paddingHorizontal: 24, borderRadius: 24, minWidth: 160 },
	medium: {
		height: 40,
		paddingHorizontal: 20,
		borderRadius: 20,
		minWidth: 140,
	},
	small: { height: 32, paddingHorizontal: 16, borderRadius: 16, minWidth: 120 },
};

const sizeTextStyles: Record<Size, TextStyle> = {
	large: { fontSize: 16, lineHeight: 22 },
	medium: { fontSize: 14, lineHeight: 20 },
	small: { fontSize: 12, lineHeight: 18 },
};
