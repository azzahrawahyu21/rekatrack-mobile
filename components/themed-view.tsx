// import { View, type ViewProps } from 'react-native';

// import { useThemeColor } from '@/hooks/use-theme-color';

// export type ThemedViewProps = ViewProps & {
//   lightColor?: string;
//   darkColor?: string;
// };

// export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
//   const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

//   return <View style={[{ backgroundColor }, style]} {...otherProps} />;
// }

import { Children } from 'react';
import { Text, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  children,
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Otomatis bungkus string dengan <Text> biar aman
  const processedChildren = Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <Text>{child}</Text>;
    }
    return child;
  });

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps}>
      {processedChildren}
    </View>
  );
}