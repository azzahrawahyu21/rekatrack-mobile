// constants/fonts.ts
import { TextStyle } from "react-native";

type TFont = TextStyle;

export const Fonts: Record<
	| "header1"
	| "header2"
	| "header3"
	| "header4"
	| "header5"
	| "header6"
	| "paragraphRegularLarge"
	| "paragraphRegularSmall"
	| "paragraphMediumLarge"
	| "paragraphMediumSmall",
	TFont
> = {
	header1: {
		fontFamily: "Inter_700Bold",
		fontSize: 26,
		lineHeight: 32,
		textAlign: "left",
	},
	header2: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 22,
		lineHeight: 28,
		textAlign: "left",
	},
	header3: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 20,
		lineHeight: 24,
		textAlign: "left",
	},
	header4: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 19,
		lineHeight: 24,
		textAlign: "left",
	},
	header5: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 18,
		lineHeight: 22,
		textTransform: "uppercase",
		textAlign: "left",
	},
	header6: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
		lineHeight: 20,
		textAlign: "left",
	},

	paragraphRegularLarge: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
		lineHeight: 24,
		textAlign: "left",
	},
	paragraphRegularSmall: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		lineHeight: 20,
		textAlign: "left",
	},

	paragraphMediumLarge: {
		fontFamily: "Inter_500Medium",
		fontSize: 16,
		lineHeight: 24,
		textAlign: "left",
	},
	paragraphMediumSmall: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
		lineHeight: 20,
		textAlign: "left",
	},
};
